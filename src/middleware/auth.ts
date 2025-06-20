// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/firebase-admin';
import { db } from '../db';
import { UserTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    dbUserId?: string; // Changed from nested dbUser object to just the ID
  };
}

export async function verifyFirebaseToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user from database
    const [dbUser] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.firebase_uid, decodedToken.uid))
      .limit(1);

    if (!dbUser) {
      // If user doesn't exist in DB, they need to sync first
      return res.status(404).json({ 
        error: 'User not found in database. Please complete registration.',
        code: 'USER_NOT_SYNCED' 
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: dbUser.name,
      dbUserId: dbUser.id // Store just the ID, not the whole user object
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}