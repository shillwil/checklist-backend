import { Router } from 'express';
import { db } from '../db';
import { UserTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import { auth } from '../lib/firebase-admin';
import { verifyFirebaseToken } from '../middleware/auth';

const router = Router();

// Sync user endpoint - called after Firebase sign up
// This endpoint uses the middleware but has special handling to not require a DB user
router.post('/sync', verifyFirebaseToken, async (req: AuthRequest, res) => {
  try {
    const { uid, email } = req.body;

    console.log('Auth sync: Syncing user with uid:', uid);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.firebase_uid, uid))
      .limit(1);

    if (existingUser) {
      console.log('Auth sync: User already exists:', existingUser.id);
      return res.json({ user: existingUser, created: false });
    }

    // Extract user info from various sources
    const userEmail = email || req.user!.email;
    const name = req.body.name ||
      req.user!.name ||
      userEmail?.split('@')[0] ||
      'User';

    if (!userEmail) {
      console.error('Auth sync: No email provided');
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('Auth sync: Creating new user with email:', userEmail);

    // Create new user
    try {
      const [newUser] = await db
        .insert(UserTable)
        .values({
          firebase_uid: uid,
          email: userEmail,
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
          .where(eq(UserTable.firebase_uid, uid))
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
router.get('/me', verifyFirebaseToken, async (req: AuthRequest, res) => {
	try {
		// Since the middleware already fetches the user, we can use it directly
		if (!req.user?.dbUserId) {
			return res.status(404).json({ 
				error: 'User not found',
				code: 'USER_NOT_SYNCED' 
			});
		}

		const [user] = await db
			.select()
			.from(UserTable)
			.where(eq(UserTable.id, req.user!.dbUserId))
			.limit(1);

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