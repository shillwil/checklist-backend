import { Router } from 'express';
import { db } from '../db';
import { UserTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Sync user endpoint - called after Firebase sign up
router.post('/sync', verifyFirebaseToken, async (req: AuthRequest, res) => {
  try {
    const { uid, email } = req.body;

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.firebase_uid, uid))
      .limit(1);

    if (existingUser) {
      return res.json({ user: existingUser });
    }

    // Create new user
    const [newUser] = await db
      .insert(UserTable)
      .values({
        firebase_uid: uid,
        email: email,
        name: req.user?.name || email.split('@')[0]
      })
      .returning();

    res.json({ user: newUser });
  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

export default router;
