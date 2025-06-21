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
	console.log('Auth middleware: Request path:', req.path, 'Full URL:', req.originalUrl, 'Method:', req.method);
	
	const token = req.headers.authorization?.split('Bearer ')[1];

	if (!token) {
		console.log('Auth middleware: No token provided');
		return res.status(401).json({ error: 'No token provided' });
	}

	try {
		// Verify the Firebase ID token
		console.log('Auth middleware: Verifying token...');
		const decodedToken = await auth.verifyIdToken(token);
		console.log('Auth middleware: Token verified for uid:', decodedToken.uid);
		
		// For the sync endpoint, we don't need a database user yet
		// More robust path detection that works across different deployment environments
		if ((req.path === '/sync' || 
		     req.originalUrl === '/api/auth/sync' || 
		     req.originalUrl.endsWith('/sync') || 
		     req.originalUrl.includes('/auth/sync')) && 
		    req.method === 'POST') {
			console.log('Auth middleware: Sync endpoint detected, skipping DB user check');
			req.user = {
				uid: decodedToken.uid,
				email: decodedToken.email,
				name: decodedToken.name || decodedToken.email?.split('@')[0]
			};
			return next();
		}
		
		// For all other endpoints, require a database user
		const [dbUser] = await db
			.select()
			.from(UserTable)
			.where(eq(UserTable.firebase_uid, decodedToken.uid))
			.limit(1);

		if (!dbUser) {
			console.log('Auth middleware: User not found in database for uid:', decodedToken.uid);
			// Provide a more helpful error response
			return res.status(404).json({ 
				error: 'User not found in database. Please complete registration.',
				code: 'USER_NOT_SYNCED',
				uid: decodedToken.uid,
				email: decodedToken.email
			});
		}

		console.log('Auth middleware: User found:', dbUser.id);
		
		req.user = {
			uid: decodedToken.uid,
			email: decodedToken.email || dbUser.email,
			name: dbUser.name,
			dbUserId: dbUser.id
		};

		next();
	} catch (error: any) {
		console.error('Auth middleware: Token verification error:', error);
		
		// Provide more specific error messages
		if (error.code === 'auth/argument-error') {
			return res.status(401).json({ 
				error: 'Invalid token format',
				code: 'INVALID_TOKEN_FORMAT'
			});
		} else if (error.code === 'auth/id-token-expired') {
			return res.status(401).json({ 
				error: 'Token expired',
				code: 'TOKEN_EXPIRED'
			});
		} else if (error.code === 'auth/id-token-revoked') {
			return res.status(401).json({ 
				error: 'Token revoked',
				code: 'TOKEN_REVOKED'
			});
		}
		
		return res.status(401).json({ 
			error: 'Invalid token',
			code: 'INVALID_TOKEN'
		});
	}
}