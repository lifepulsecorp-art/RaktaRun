import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || 'lifepulse-dev',
      });
      console.log('Firebase Admin initialized for project:', serviceAccount.project_id);
    }
  } catch (error: any) {
    console.warn('Could not initialize Firebase Admin SDK (continuing in Local Auth mode):', error.message);
  }
} else {
  console.log('Running in Local Auth mode (firebase-service-account.json not found).');
}

export default admin;
