"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.verifyFirebaseToken);
// Get paginated checklist items
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '30', category, search, sortField = 'priority', sortDirection = 'asc' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        // Build query conditions
        const conditions = [
            (0, drizzle_orm_1.eq)(schema_1.checklistItems.userId, req.user.dbUser.id)
        ];
        if (category) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.checklistItems.category, category));
        }
        if (search) {
            conditions.push((0, drizzle_orm_1.ilike)(schema_1.checklistItems.title, `%${search}%`));
        }
        // Get total count
        const [{ itemCount }] = await db_1.db
            .select({ itemCount: (0, drizzle_orm_1.count)(schema_1.checklistItems.id) })
            .from(schema_1.checklistItems)
            .where((0, drizzle_orm_1.and)(...conditions));
        // Get paginated items
        const items = await db_1.db
            .select()
            .from(schema_1.checklistItems)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy(
        // Validate that sortField is a valid column name
        (() => {
            // Define valid sort fields
            const validSortFields = ['id', 'title', 'category', 'completed', 'dueDate', 'priority', 'createdAt', 'updatedAt'];
            // Use a default sort field if the provided one is invalid
            const validatedSortField = validSortFields.includes(sortField)
                ? sortField
                : 'createdAt';
            return sortDirection === 'desc'
                ? (0, drizzle_orm_1.desc)(schema_1.checklistItems[validatedSortField])
                : (0, drizzle_orm_1.asc)(schema_1.checklistItems[validatedSortField]);
        })())
            .limit(limitNum)
            .offset(offset);
        const totalPages = Math.ceil(Number(itemCount) / limitNum);
        res.json({
            items,
            totalCount: Number(itemCount),
            currentPage: pageNum,
            totalPages
        });
    }
    catch (error) {
        console.error('Fetch checklist error:', error);
        res.status(500).json({ error: 'Failed to fetch checklist items' });
    }
});
// Create new checklist item
router.post('/', async (req, res) => {
    try {
        const { title, description, category, dueDate, priority } = req.body;
        const [newItem] = await db_1.db
            .insert(schema_1.checklistItems)
            .values({
            userId: req.user.dbUser.id,
            title,
            description,
            category,
            dueDate: dueDate ? new Date(dueDate) : null,
            priority: priority || 3
        })
            .returning();
        res.json(newItem);
    }
    catch (error) {
        console.error('Create checklist item error:', error);
        res.status(500).json({ error: 'Failed to create checklist item' });
    }
});
// Update checklist item
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const [updatedItem] = await db_1.db
            .update(schema_1.checklistItems)
            .set({
            ...updates,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.checklistItems.id, id), (0, drizzle_orm_1.eq)(schema_1.checklistItems.userId, req.user.dbUser.id)))
            .returning();
        if (!updatedItem) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(updatedItem);
    }
    catch (error) {
        console.error('Update checklist item error:', error);
        res.status(500).json({ error: 'Failed to update checklist item' });
    }
});
// Delete checklist item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [deletedItem] = await db_1.db
            .delete(schema_1.checklistItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.checklistItems.id, id), (0, drizzle_orm_1.eq)(schema_1.checklistItems.userId, req.user.dbUser.id)))
            .returning();
        if (!deletedItem) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete checklist item error:', error);
        res.status(500).json({ error: 'Failed to delete checklist item' });
    }
});
exports.default = router;
