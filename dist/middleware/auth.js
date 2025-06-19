"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebaseToken = verifyFirebaseToken;
const firebase_admin_1 = require("../lib/firebase-admin");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function verifyFirebaseToken(req, res, next) {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        // Verify the Firebase ID token
        const decodedToken = await firebase_admin_1.auth.verifyIdToken(token);
        // Get user from database
        const [dbUser] = await db_1.db
            .select()
            .from(schema_1.UserTable)
            .where((0, drizzle_orm_1.eq)(schema_1.UserTable.firebase_uid, decodedToken.uid))
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
    }
    catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
}
