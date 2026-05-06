/**
 * Minimal Firebase Admin shim — ONLY for FCM messaging.
 * All Firestore and Auth usage has been migrated to Supabase.
 *
 * This file is intentionally kept lean:
 * - Uses only firebase-admin/messaging
 * - Does NOT initialise Firestore or Auth
 */
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

if (!admin.apps.length) {
  try {
    let credential: admin.credential.Credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8');
      credential = admin.credential.cert(JSON.parse(decoded));
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credential = admin.credential.applicationDefault();
    } else {
      const serviceAccountPath = path.join(
        process.cwd(),
        'guidemyroute-77af8-firebase-adminsdk-fbsvc-67e173961a.json'
      );
      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
      credential = admin.credential.cert(JSON.parse(serviceAccountContent));
    }

    admin.initializeApp({ credential });
  } catch (error) {
    console.error('Firebase Messaging initialization error', error);
  }
}

export const adminMessaging = admin.messaging();
