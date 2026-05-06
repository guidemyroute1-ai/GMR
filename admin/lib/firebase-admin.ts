import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

if (!admin.apps.length) {
  try {
    // C7 fix: Prefer environment variable for service account, with file fallback for local dev
    let credential: admin.credential.Credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Production: Use base64-encoded service account from env var
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8');
      credential = admin.credential.cert(JSON.parse(decoded));
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // GCP standard: Use the default credential path
      credential = admin.credential.applicationDefault();
    } else {
      // Local dev fallback: Read from file (ensure this file is in .gitignore!)
      const serviceAccountPath = path.join(process.cwd(), 'guidemyroute-77af8-firebase-adminsdk-fbsvc-67e173961a.json');
      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
      credential = admin.credential.cert(JSON.parse(serviceAccountContent));
    }

    admin.initializeApp({ credential });
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminMessaging = admin.messaging();
