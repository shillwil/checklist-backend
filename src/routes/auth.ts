import { Router } from 'express';
import { db } from '../db';
import { UserTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '../lib/firebase-admin';

const router = Router();

// Sync user endpoint - called after Firebase sign up
// This endpoint doesn't require the middleware since the user might not exist yet
router.post('/sync', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.firebase_uid, decodedToken.uid))
      .limit(1);

    if (existingUser) {
      return res.json({ user: existingUser });
    }

    // Create new user using info from the token and request body
    const [newUser] = await db
      .insert(UserTable)
      .values({
        firebase_uid: decodedToken.uid,
        email: decodedToken.email || req.body.email,
        name: decodedToken.name || req.body.name || decodedToken.email?.split('@')[0] || 'User'
      })
      .returning();

    res.json({ user: newUser });
  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Get current user endpoint
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    
    const [user] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.firebase_uid, decodedToken.uid))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;