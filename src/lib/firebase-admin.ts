import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
let serviceAccount;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Try to parse as JSON string
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        // Read from file
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        const rawData = fs.readFileSync(path.resolve(serviceAccountPath), 'utf8');
        serviceAccount = JSON.parse(rawData);
    } else {
        console.warn('No Firebase service account credentials provided');
        serviceAccount = {};
    }
} catch (error) {
    console.error('Error parsing Firebase service account:', error);
    throw new Error('Invalid Firebase service account configuration');
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

export const auth = admin.auth();