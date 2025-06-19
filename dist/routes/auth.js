"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Sync user endpoint - called after Firebase sign up
router.post('/sync', auth_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { uid, email } = req.body;
        // Check if user already exists
        const [existingUser] = await db_1.db
            .select()
            .from(schema_1.UserTable)
            .where((0, drizzle_orm_1.eq)(schema_1.UserTable.firebase_uid, uid))
            .limit(1);
        if (existingUser) {
            return res.json({ user: existingUser });
        }
        // Create new user
        const [newUser] = await db_1.db
            .insert(schema_1.UserTable)
            .values({
            firebase_uid: uid,
            email: email,
            name: req.user?.name || email.split('@')[0]
        })
            .returning();
        res.json({ user: newUser });
    }
    catch (error) {
        console.error('User sync error:', error);
        res.status(500).json({ error: 'Failed to sync user' });
    }
});
exports.default = router;
