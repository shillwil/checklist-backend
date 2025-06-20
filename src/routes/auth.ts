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

    console.log('Auth sync: Verifying token...');

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
      console.log('Auth sync: Token verified for uid:', decodedToken.uid);
    } catch (error) {
      console.error('Auth sync: Token verification failed:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.firebase_uid, decodedToken.uid))
      .limit(1);

    if (existingUser) {
      console.log('Auth sync: User already exists:', existingUser.id);
      return res.json({ user: existingUser, created: false });
    }

    // Extract user info from various sources
    const email = decodedToken.email || req.body.email;
    const name = req.body.name ||
      decodedToken.name ||
      decodedToken.displayName ||
      email?.split('@')[0] ||
      'User';

    if (!email) {
      console.error('Auth sync: No email provided');
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Auth sync: Creating new user with email:', email);

    // Create new user
    try {
      const [newUser] = await db
        .insert(UserTable)
        .values({
          firebase_uid: decodedToken.uid,
          email: email,
          name: name
        })
        .returning();

      console.log('Auth sync: User created successfully:', newUser.id);
      res.json({ user: newUser, created: true });
    } catch (dbError: any) {
      console.error('Auth sync: Database error:', dbError);

      // Check if it's a unique constraint violation
      if (dbError.code === '23505') {
        // Try to fetch the user again (race condition handling)
        const [user] = await db
          .select()
          .from(UserTable)
          .where(eq(UserTable.firebase_uid, decodedToken.uid))
          .limit(1);

        if (user) {
          return res.json({ user, created: false });
        }
      }

      throw dbError;
    }
  } catch (error: any) {
    console.error('Auth sync: Unexpected error:', error);
    res.status(500).json({
      error: 'Failed to sync user',
      details: error.message
    });
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
			return res.status(404).json({ 
				error: 'User not found',
				code: 'USER_NOT_SYNCED' 
			});
		}

		res.json({ user });
	} catch (error) {
		console.error('Get user error:', error);
		res.status(500).json({ error: 'Failed to get user' });
	}
});

router.get('/health', (req, res) => {
	res.json({ 
		status: 'ok',
		firebase: 'connected'
	});
});

export default router;