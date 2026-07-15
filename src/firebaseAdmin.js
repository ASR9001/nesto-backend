import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

const serviceAccountPath = path.join(process.cwd(), 'keys', 'nexofirebase.json');

const serviceAccount = JSON.parse(
  readFileSync(serviceAccountPath, 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
