import dotenv from "dotenv";
dotenv.config();

// Prevent firebase-admin from checking metadata server and hanging in local environments
if (process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  process.env.GCE_METADATA_HOST = '127.0.0.1';
  process.env.GCE_METADATA_CHECK_DISABLE = 'true';
  process.env.NO_GCE_CHECK = 'true';
  
  // Set Firestore emulator host to prevent the admin SDK from attempting to query
  // production servers without credentials and hanging on metadata checks.
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  console.log("Local development environment detected: Bypassing Firebase Metadata Server & setting Firestore Emulator Host to prevent hangs.");
}
