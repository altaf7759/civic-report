import { 
  users, 
  issues, 
  categories, 
  upvotes, 
  assignments,
  type User, 
  type InsertUser,
  type Issue,
  type InsertIssue,
  type Category,
  type InsertCategory,
  type Upvote,
  type InsertUpvote,
  type Assignment,
  type InsertAssignment,
  type ResolveIssue
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: any;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAdminUsers(): Promise<User[]>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Issue operations
  getIssues(filters?: {
    state?: string;
    city?: string;
    status?: string;
    userId?: string;
    assignedToAdmin?: string;
  }): Promise<(Issue & { 
    category: Category | null; 
    user: User | null; 
    upvoteCount: number;
    userUpvoted?: boolean;
    resolver?: User | null;
  })[]>;
  getIssue(id: string, userId?: string): Promise<(Issue & { 
    category: Category | null; 
    user: User | null; 
    upvoteCount: number;
    userUpvoted?: boolean;
    resolver?: User | null;
  }) | undefined>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssueStatus(id: string, status: string): Promise<void>;
  resolveIssue(id: string, data: ResolveIssue, resolvedBy: string): Promise<void>;
  
  // Upvote operations
  toggleUpvote(userId: string, issueId: string): Promise<{ upvoted: boolean; count: number }>;
  
  // Assignment operations
  assignIssue(assignment: InsertAssignment): Promise<Assignment>;
  getAssignedIssues(adminId: string): Promise<(Issue & { 
    category: Category | null; 
    user: User | null; 
    upvoteCount: number;
  })[]>;
  
  // Analytics
  getAnalytics(): Promise<{
    totalIssues: number;
    notAssigned: number;
    assigned: number;
    resolved: number;
    categoryBreakdown: { name: string; count: number }[];
    mostUpvotedIssues: (Issue & { 
      category: Category | null; 
      upvoteCount: number;
    })[];
  }>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "admin"));
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async getIssues(filters?: {
    state?: string;
    city?: string;
    status?: string;
    userId?: string;
    assignedToAdmin?: string;
  }): Promise<(Issue & { 
    category: Category | null; 
    user: User | null; 
    upvoteCount: number;
    userUpvoted?: boolean;
    resolver?: User | null;
  })[]> {
    let query = db
      .select({
        issue: issues,
        category: categories,
        user: users,
        upvoteCount: sql<number>`COALESCE(${sql`COUNT(${upvotes.id})`}, 0)`,
        resolver: sql<User | null>`NULL`,
      })
      .from(issues)
      .leftJoin(categories, eq(issues.categoryId, categories.id))
      .leftJoin(users, eq(issues.userId, users.id))
      .leftJoin(upvotes, eq(issues.id, upvotes.issueId))
      .groupBy(issues.id, categories.id, users.id);

    if (filters?.assignedToAdmin) {
      query = query
        .innerJoin(assignments, eq(issues.id, assignments.issueId));
    }

    const conditions = [];
    if (filters?.assignedToAdmin) conditions.push(eq(assignments.adminId, filters.assignedToAdmin));
    if (filters?.state) conditions.push(eq(issues.state, filters.state));
    if (filters?.city) conditions.push(eq(issues.city, filters.city));
    if (filters?.status) conditions.push(eq(issues.status, filters.status));
    if (filters?.userId) conditions.push(eq(issues.userId, filters.userId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(issues.createdAt));

    const results = await query;
    
    return results.map(result => ({
      ...result.issue,
      category: result.category,
      user: result.user,
      upvoteCount: result.upvoteCount,
      resolver: result.resolver,
    }));
  }

  async getIssue(id: string, userId?: string): Promise<(Issue & { 
    category: Category | null; 
    user: User | null; 
    upvoteCount: number;
    userUpvoted?: boolean;
    resolver?: User | null;
  }) | undefined> {
    const result = await db
      .select({
        issue: issues,
        category: categories,
        user: users,
        resolver: sql<User | null>`resolver_user`,
        upvoteCount: sql<number>`COALESCE(upvote_count.count, 0)`,
        userUpvoted: userId ? sql<boolean>`CASE WHEN user_upvote.id IS NOT NULL THEN true ELSE false END` : sql<boolean>`false`,
      })
      .from(issues)
      .leftJoin(categories, eq(issues.categoryId, categories.id))
      .leftJoin(users, eq(issues.userId, users.id))
      .leftJoin(
        sql`(SELECT issue_id, COUNT(*) as count FROM upvotes GROUP BY issue_id) upvote_count`,
        sql`upvote_count.issue_id = ${issues.id}`
      )
      .leftJoin(
        sql`users resolver_user`,
        eq(issues.resolvedBy, sql`resolver_user.id`)
      )
      .leftJoin(
        userId ? sql`upvotes user_upvote` : sql`(SELECT NULL as id, NULL as user_id, NULL as issue_id) user_upvote`,
        userId ? and(eq(sql`user_upvote.issue_id`, issues.id), eq(sql`user_upvote.user_id`, userId)) : sql`false`
      )
      .where(eq(issues.id, id))
      .limit(1);

    const [row] = result;
    if (!row) return undefined;

    return {
      ...row.issue,
      category: row.category,
      user: row.user,
      upvoteCount: row.upvoteCount,
      userUpvoted: row.userUpvoted,
      resolver: row.resolver,
    };
  }

  async createIssue(issue: InsertIssue): Promise<Issue> {
    const [newIssue] = await db
      .insert(issues)
      .values(issue)
      .returning();
    return newIssue;
  }

  async updateIssueStatus(id: string, status: string): Promise<void> {
    await db
      .update(issues)
      .set({ status })
      .where(eq(issues.id, id));
  }

  async resolveIssue(id: string, data: ResolveIssue, resolvedBy: string): Promise<void> {
    await db
      .update(issues)
      .set({
        status: "resolved",
        resolutionNotes: data.resolutionNotes,
        resolutionImageUrl: data.resolutionImageUrl,
        resolvedBy,
        resolvedAt: new Date(),
      })
      .where(eq(issues.id, id));
  }

  async toggleUpvote(userId: string, issueId: string): Promise<{ upvoted: boolean; count: number }> {
    const existingUpvote = await db
      .select()
      .from(upvotes)
      .where(and(eq(upvotes.userId, userId), eq(upvotes.issueId, issueId)))
      .limit(1);

    if (existingUpvote.length > 0) {
      // Remove upvote
      await db
        .delete(upvotes)
        .where(and(eq(upvotes.userId, userId), eq(upvotes.issueId, issueId)));
    } else {
      // Add upvote
      await db
        .insert(upvotes)
        .values({ userId, issueId });
    }

    const [countResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(upvotes)
      .where(eq(upvotes.issueId, issueId));

    return {
      upvoted: existingUpvote.length === 0,
      count: countResult.count,
    };
  }

  async assignIssue(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db
      .insert(assignments)
      .values(assignment)
      .returning();
    
    await this.updateIssueStatus(assignment.issueId!, "assigned");
    
    return newAssignment;
  }

  async getAssignedIssues(adminId: string): Promise<(Issue & { 
    category: Category | null; 
    user: User | null; 
    upvoteCount: number;
  })[]> {
    return this.getIssues({ assignedToAdmin: adminId, status: "assigned" });
  }

  async getAnalytics(): Promise<{
    totalIssues: number;
    notAssigned: number;
    assigned: number;
    resolved: number;
    categoryBreakdown: { name: string; count: number }[];
    mostUpvotedIssues: (Issue & { 
      category: Category | null; 
      upvoteCount: number;
    })[];
  }> {
    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(issues);

    const [notAssignedResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(issues)
      .where(eq(issues.status, "not-assigned"));

    const [assignedResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(issues)
      .where(eq(issues.status, "assigned"));

    const [resolvedResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(issues)
      .where(eq(issues.status, "resolved"));

    const categoryBreakdown = await db
      .select({
        name: categories.name,
        count: sql<number>`COUNT(${issues.id})`,
      })
      .from(categories)
      .leftJoin(issues, eq(categories.id, issues.categoryId))
      .groupBy(categories.id, categories.name);

    const mostUpvotedIssues = await db
      .select({
        issue: issues,
        category: categories,
        upvoteCount: sql<number>`COALESCE(COUNT(${upvotes.id}), 0)`,
      })
      .from(issues)
      .leftJoin(categories, eq(issues.categoryId, categories.id))
      .leftJoin(upvotes, eq(issues.id, upvotes.issueId))
      .groupBy(issues.id, categories.id)
      .orderBy(desc(sql`COUNT(${upvotes.id})`))
      .limit(3);

    return {
      totalIssues: totalResult.count,
      notAssigned: notAssignedResult.count,
      assigned: assignedResult.count,
      resolved: resolvedResult.count,
      categoryBreakdown,
      mostUpvotedIssues: mostUpvotedIssues.map(item => ({
        ...item.issue,
        category: item.category,
        upvoteCount: item.upvoteCount,
      })),
    };
  }
}

export const storage = new DatabaseStorage();
