import admin from "firebase-admin";
import { getApps, cert } from "firebase-admin/app";

if (!getApps().length) {
  admin.initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Fix multiline private key
    }),
  });
}

export const adminAuth = admin.auth();
