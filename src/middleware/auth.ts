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
    dbUser?: {
      id: string;
      [key: string]: any;
    };
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
      return res.status(404).json({ error: 'User not found in database' });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: dbUser.name
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}