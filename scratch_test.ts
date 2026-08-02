import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();
console.log("Starting test...");
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log("Found key in env");
  } else {
    console.log("No key in env, initializing default...");
    admin.initializeApp();
    console.log("Initialized default admin");
  }
  const db = admin.firestore();
  console.log("Got firestore reference");
} catch (e: any) {
  console.error("Caught error:", e.message, e.stack);
}
console.log("End of test");
