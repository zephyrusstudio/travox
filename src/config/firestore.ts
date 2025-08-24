import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase Admin SDK
// Supports multiple authentication methods:
// 1. FIREBASE_SERVICE_ACCOUNT_JSON (JSON string in env)
// 2. FIREBASE_SERVICE_ACCOUNT_PATH (path to JSON file)
// 3. GOOGLE_APPLICATION_CREDENTIALS (standard Google env var)
// 4. Manual configuration from individual env vars

if (!admin.apps.length) {
  try {
    // Method 1: JSON string in environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      console.log('🔥 Using Firebase credentials from FIREBASE_SERVICE_ACCOUNT_JSON');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    // Method 2: Path to service account file
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
      console.log('🔥 Using Firebase credentials from FIREBASE_SERVICE_ACCOUNT_PATH');
      const serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    // Method 3: Standard Google credentials environment variable
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('🔥 Using Firebase credentials from GOOGLE_APPLICATION_CREDENTIALS');
      admin.initializeApp();
    }
    // Method 4: Manual configuration from individual env vars
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('🔥 Using Firebase credentials from individual env vars');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        })
      });
    }
    // Method 5: Use the firestore-creds.json file in the root directory
    else if (fs.existsSync('firestore-creds.json')) {
      console.log('🔥 Using Firebase credentials from firestore-creds.json');
      const serviceAccount = JSON.parse(fs.readFileSync('firestore-creds.json', 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    // Fallback: Default initialization
    else {
      console.log('🔥 Attempting default Firebase initialization');
      admin.initializeApp();
    }

    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

export const firestore = admin.firestore();

// Configure Firestore to ignore undefined properties globally
firestore.settings({ ignoreUndefinedProperties: false });
