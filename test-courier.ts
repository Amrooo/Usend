import { CourierEngine } from './src/backend/adapters/CourierEngine';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Initialize Firebase exactly like server.ts
try {
  let serviceAccount = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else if (fs.existsSync('./serviceAccountKey.json')) {
    serviceAccount = require('./serviceAccountKey.json');
  }

  if (!admin.apps.length) {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase initialized successfully using service account.");
    } else {
      admin.initializeApp();
      console.log("Firebase Admin initialized using default credentials (ADC).");
    }
  }
} catch (err: any) {
  console.error("Firebase Initialization Failed (Courier Test Script):", err.message);
  process.exit(1);
}

const dbAdmin = getFirestore();

async function runTests() {
  try {
    console.log("Fetching courier configs from Firebase...");
    const doc = await dbAdmin.collection('config').doc('couriers').get();
    if (!doc.exists) {
      console.error("No courier configs found in DB.");
      return;
    }
    const configs = doc.data();

    const engine = new CourierEngine();
    
    // Test Noon
    const noonConfig = configs?.noon;
    if (noonConfig) {
      const activeCreds = noonConfig.currentMode === 'sandbox' ? noonConfig.sandboxCreds : noonConfig.productionCreds;
      console.log(`\nTesting Noon (${noonConfig.currentMode})...`);
      const noonAdapter = engine.getAdapter('noon');
      
      const res = await noonAdapter.validateCredentials(activeCreds, noonConfig.currentMode || 'sandbox');
      console.log("Noon Validation Result:", res);
    } else {
      console.log("\nNo Noon config found.");
    }

    // Test Aramex
    const aramexConfig = configs?.aramex;
    if (aramexConfig) {
      const activeCreds = aramexConfig.currentMode === 'sandbox' ? aramexConfig.sandboxCreds : aramexConfig.productionCreds;
      console.log(`\nTesting Aramex (${aramexConfig.currentMode})...`);
      const aramexAdapter = engine.getAdapter('aramex');
      
      const res = await aramexAdapter.validateCredentials(activeCreds, aramexConfig.currentMode || 'sandbox');
      console.log("Aramex Validation Result:", res);
    } else {
      console.log("\nNo Aramex config found.");
    }

  } catch (e) {
    console.error("Test script failed:", e);
  }
}

runTests().then(() => process.exit(0));
