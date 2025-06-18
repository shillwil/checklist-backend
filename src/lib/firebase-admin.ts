import * as admin from 'firebase-admin';

// Initialize Firebase Admin
// Download service account key from Firebase Console > Project Settings > Service Accounts
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const auth = admin.auth();