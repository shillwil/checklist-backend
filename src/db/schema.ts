import { uuid, pgTable, varchar, boolean, timestamp, integer, pgSchema } from "drizzle-orm/pg-core";

// Explicitly use the public schema
const publicSchema = pgSchema("public");

export const UserTable = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  firebase_uid: varchar("firebase_uid").notNull().unique(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull().unique(),
});

export const checklistItems = pgTable("checklist_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => UserTable.id).notNull(),
  title: varchar("title").notNull(),
  description: varchar("description"),
  category: varchar("category"),
  completed: boolean("completed").default(false).notNull(),
  dueDate: timestamp("due_date"),
  priority: integer("priority").default(3).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Export types for TypeScript
export type User = typeof UserTable.$inferSelect;
export type NewUser = typeof UserTable.$inferInsert;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type NewChecklistItem = typeof checklistItems.$inferInsert;