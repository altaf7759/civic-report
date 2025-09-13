import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("citizen"), // citizen, admin, superadmin
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
});

export const issues = pgTable("issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  state: text("state").notNull(),
  city: text("city").notNull(),
  reporterName: text("reporter_name").notNull(),
  reporterPhone: text("reporter_phone").notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  location: text("location").notNull(),
  priority: text("priority").notNull(), // low, medium, high
  status: text("status").notNull().default("not-assigned"), // not-assigned, assigned, resolved
  mediaUrls: jsonb("media_urls").$type<string[]>().default([]),
  userId: varchar("user_id").references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  resolutionImageUrl: text("resolution_image_url"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const upvotes = pgTable("upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  issueId: varchar("issue_id").references(() => issues.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").references(() => issues.id),
  adminId: varchar("admin_id").references(() => users.id),
  assignedBy: varchar("assigned_by").references(() => users.id),
  assignmentNotes: text("assignment_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  issues: many(issues),
  upvotes: many(upvotes),
  assignments: many(assignments),
  resolvedIssues: many(issues, { relationName: "resolver" }),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  user: one(users, { fields: [issues.userId], references: [users.id] }),
  category: one(categories, { fields: [issues.categoryId], references: [categories.id] }),
  resolver: one(users, { fields: [issues.resolvedBy], references: [users.id], relationName: "resolver" }),
  upvotes: many(upvotes),
  assignments: many(assignments),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  issues: many(issues),
}));

export const upvotesRelations = relations(upvotes, ({ one }) => ({
  user: one(users, { fields: [upvotes.userId], references: [users.id] }),
  issue: one(issues, { fields: [upvotes.issueId], references: [issues.id] }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  issue: one(issues, { fields: [assignments.issueId], references: [issues.id] }),
  admin: one(users, { fields: [assignments.adminId], references: [users.id] }),
  assignedByUser: one(users, { fields: [assignments.assignedBy], references: [users.id], relationName: "assigner" }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  createdAt: true,
  status: true,
  resolvedAt: true,
  resolvedBy: true,
  resolutionNotes: true,
  resolutionImageUrl: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertUpvoteSchema = createInsertSchema(upvotes).omit({
  id: true,
  createdAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});

export const resolveIssueSchema = z.object({
  resolutionNotes: z.string().min(1),
  resolutionImageUrl: z.string().min(1),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Upvote = typeof upvotes.$inferSelect;
export type InsertUpvote = z.infer<typeof insertUpvoteSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type ResolveIssue = z.infer<typeof resolveIssueSchema>;
