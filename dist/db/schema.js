"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checklistItems = exports.UserTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.UserTable = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().notNull().defaultRandom(),
    firebase_uid: (0, pg_core_1.varchar)("firebase_uid").notNull().unique(),
    name: (0, pg_core_1.varchar)("name").notNull(),
    email: (0, pg_core_1.varchar)("email").notNull().unique(),
});
exports.checklistItems = (0, pg_core_1.pgTable)('checklist_items', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.UserTable.id).notNull(),
    title: (0, pg_core_1.varchar)('title').notNull(),
    description: (0, pg_core_1.varchar)('description'),
    category: (0, pg_core_1.varchar)('category'),
    completed: (0, pg_core_1.boolean)('completed').default(false).notNull(),
    dueDate: (0, pg_core_1.timestamp)('due_date'),
    priority: (0, pg_core_1.integer)('priority').default(3).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull()
});
