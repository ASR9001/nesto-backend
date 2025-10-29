// // firebaseAdmin.js
// import admin from 'firebase-admin';
// import { readFileSync } from 'fs';

// // Replace with path to your Firebase Admin SDK private key
// const serviceAccount = JSON.parse(
//   readFileSync('./firebase-service-account.json')
// );

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// export default admin;
