import { Router } from 'express';
import { db } from '../db';
import { checklistItems } from '../db/schema';
import { eq, and, ilike, desc, asc, count } from 'drizzle-orm';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(verifyFirebaseToken);

// Get paginated checklist items
router.get('/', async (req: AuthRequest, res) => {
  try {
    const {
      page = '1',
      limit = '30',
      category,
      search,
      sortField = 'priority',
      sortDirection = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query conditions
    const conditions = [
      eq(checklistItems.userId, req.user!.dbUser!.id)
    ];

    if (category) {
      conditions.push(eq(checklistItems.category, category as string));
    }

    if (search) {
      conditions.push(ilike(checklistItems.title, `%${search}%`));
    }

    // Get total count
    const [{ itemCount }] = await db
      .select({ itemCount: count(checklistItems.id) })
      .from(checklistItems)
      .where(and(...conditions));

    // Get paginated items
    const items = await db
      .select()
      .from(checklistItems)
      .where(and(...conditions))
      .orderBy(
        // Validate that sortField is a valid column name
        (() => {
          // Define valid sort fields
          const validSortFields = ['id', 'title', 'category', 'completed', 'dueDate', 'priority', 'createdAt', 'updatedAt'] as const;
          type ValidSortField = typeof validSortFields[number];
          
          // Use a default sort field if the provided one is invalid
          const validatedSortField = validSortFields.includes(sortField as any) 
            ? sortField as ValidSortField 
            : 'createdAt' as const;
            
          return sortDirection === 'desc'
            ? desc(checklistItems[validatedSortField])
            : asc(checklistItems[validatedSortField]);
        })()
      )
      .limit(limitNum)
      .offset(offset);

    const totalPages = Math.ceil(Number(itemCount) / limitNum);

    res.json({
      items,
      totalCount: Number(itemCount),
      currentPage: pageNum,
      totalPages
    });
  } catch (error) {
    console.error('Fetch checklist error:', error);
    res.status(500).json({ error: 'Failed to fetch checklist items' });
  }
});

// Create new checklist item
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, description, category, dueDate, priority } = req.body;

    const [newItem] = await db
      .insert(checklistItems)
      .values({
        userId: req.user!.dbUser!.id,
        title,
        description,
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 3
      })
      .returning();

    res.json(newItem);
  } catch (error) {
    console.error('Create checklist item error:', error);
    res.status(500).json({ error: 'Failed to create checklist item' });
  }
});

// Update checklist item
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [updatedItem] = await db
      .update(checklistItems)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(checklistItems.id, id),
          eq(checklistItems.userId, req.user!.dbUser!.id)
        )
      )
      .returning();

    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error('Update checklist item error:', error);
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

// Delete checklist item
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const [deletedItem] = await db
      .delete(checklistItems)
      .where(
        and(
          eq(checklistItems.id, id),
          eq(checklistItems.userId, req.user!.dbUser!.id)
        )
      )
      .returning();

    if (!deletedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete checklist item error:', error);
    res.status(500).json({ error: 'Failed to delete checklist item' });
  }
});

export default router;
