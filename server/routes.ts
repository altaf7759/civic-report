import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import { 
  insertIssueSchema, 
  insertCategorySchema, 
  insertAssignmentSchema, 
  resolveIssueSchema 
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // States and cities data - using static data for demo
  app.get("/api/states", (req, res) => {
    res.json([
      { value: "california", label: "California" },
      { value: "new-york", label: "New York" },
      { value: "texas", label: "Texas" },
      { value: "florida", label: "Florida" },
    ]);
  });

  app.get("/api/cities/:state", (req, res) => {
    const cities = {
      california: [
        { value: "san-francisco", label: "San Francisco" },
        { value: "los-angeles", label: "Los Angeles" },
        { value: "san-diego", label: "San Diego" },
      ],
      "new-york": [
        { value: "new-york-city", label: "New York City" },
        { value: "buffalo", label: "Buffalo" },
        { value: "rochester", label: "Rochester" },
      ],
      texas: [
        { value: "houston", label: "Houston" },
        { value: "dallas", label: "Dallas" },
        { value: "austin", label: "Austin" },
      ],
      florida: [
        { value: "miami", label: "Miami" },
        { value: "orlando", label: "Orlando" },
        { value: "tampa", label: "Tampa" },
      ],
    };
    
    res.json(cities[req.params.state as keyof typeof cities] || []);
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  // Issues
  app.get("/api/issues", async (req, res) => {
    try {
      const { state, city, status, userId } = req.query;
      const filters: any = {};
      
      if (state) filters.state = state as string;
      if (city) filters.city = city as string;
      if (status) filters.status = status as string;
      if (userId) filters.userId = userId as string;

      const issues = await storage.getIssues(filters);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  app.get("/api/issues/:id", async (req, res) => {
    try {
      const userId = req.user?.id;
      const issue = await storage.getIssue(req.params.id, userId);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.json(issue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch issue" });
    }
  });

  app.post("/api/issues", requireAuth, upload.array('media', 5), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const mediaUrls = files?.map(file => `/uploads/${file.filename}`) || [];
      
      const issueData = insertIssueSchema.parse({
        ...req.body,
        userId: req.user!.id,
        mediaUrls,
      });
      
      const issue = await storage.createIssue(issueData);
      res.status(201).json(issue);
    } catch (error) {
      res.status(400).json({ message: "Invalid issue data" });
    }
  });

  app.post("/api/issues/:id/upvote", requireAuth, async (req, res) => {
    try {
      const result = await storage.toggleUpvote(req.user!.id, req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle upvote" });
    }
  });

  app.post("/api/issues/:id/resolve", requireAuth, requireRole(["admin"]), upload.single('resolutionImage'), async (req, res) => {
    try {
      const resolutionImageUrl = req.file ? `/uploads/${req.file.filename}` : '';
      const resolveData = resolveIssueSchema.parse({
        resolutionNotes: req.body.resolutionNotes,
        resolutionImageUrl,
      });
      
      await storage.resolveIssue(req.params.id, resolveData, req.user!.id);
      res.json({ message: "Issue resolved successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to resolve issue" });
    }
  });

  // Assignments
  app.post("/api/issues/:id/assign", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const { adminIds, assignmentNotes } = req.body;
      
      if (!adminIds || !Array.isArray(adminIds) || adminIds.length === 0) {
        return res.status(400).json({ message: "At least one admin must be selected" });
      }

      const assignments = [];
      for (const adminId of adminIds) {
        const assignmentData = insertAssignmentSchema.parse({
          issueId: req.params.id,
          adminId,
          assignedBy: req.user!.id,
          assignmentNotes,
        });
        
        const assignment = await storage.assignIssue(assignmentData);
        assignments.push(assignment);
      }
      
      res.json(assignments);
    } catch (error) {
      res.status(400).json({ message: "Failed to assign issue" });
    }
  });

  app.get("/api/admin/issues", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const issues = await storage.getAssignedIssues(req.user!.id);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assigned issues" });
    }
  });

  // Admin management
  app.get("/api/admins", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const admins = await storage.getAdminUsers();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });

  // Analytics
  app.get("/api/analytics", requireAuth, requireRole(["admin", "superadmin"]), async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // Simple static file serving for uploads
    // In production, you'd want to use a proper file server or CDN
    res.sendFile(path.join(process.cwd(), req.path));
  });

  const httpServer = createServer(app);
  return httpServer;
}
