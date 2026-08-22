import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('usend-5ce60-firebase-adminsdk-fbsvc-c8c3fa1bc9.json', 'utf8'));
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function runTests() {
  const docSnap = await db.collection('private_settings').doc('courier_credentials').get();
  const credentials = docSnap.data();
  if (!credentials) {
    console.error("No credentials found in Firestore.");
    return;
  }
  
  console.log("Credentials retrieved. Testing with Courier Engine...");
  
  // To avoid dealing with ES modules/TS in a raw JS file, let's just make direct API calls to Aramex and Noon.
  // Noon Test
  if (credentials.noon) {
    const noonTest = credentials.noon.test;
    const noonProd = credentials.noon.production;
    
    if (noonTest && noonTest.apiKey) {
      console.log("Testing Noon (Sandbox)...");
      try {
        const res = await fetch("https://api.noon.partners/pickup-points", {
          headers: { "Authorization": `Key ${noonTest.apiKey}` }
        });
        console.log(`Noon Sandbox status: ${res.status}`);
        if(res.status === 401) console.log("Noon Sandbox: Unauthorized (Invalid Key)");
      } catch (e) { console.error("Noon Sandbox Error", e); }
    } else {
      console.log("No Noon Sandbox credentials saved.");
    }
    
    if (noonProd && noonProd.apiKey) {
      console.log("Testing Noon (Production)...");
      try {
        const res = await fetch("https://api.noon.partners/pickup-points", {
          headers: { "Authorization": `Key ${noonProd.apiKey}` }
        });
        console.log(`Noon Prod status: ${res.status}`);
        if(res.status === 401) console.log("Noon Prod: Unauthorized (Invalid Key)");
      } catch (e) { console.error("Noon Prod Error", e); }
    } else {
      console.log("No Noon Production credentials saved.");
    }
  }

  // Aramex Test (Using a basic rate calc or validate endpoint if available)
  if (credentials.aramex) {
      console.log("\nAramex credentials found. We need a valid SOAP/REST payload to test Aramex.");
      console.log(JSON.stringify(credentials.aramex, null, 2));
  }
}

runTests().then(() => process.exit(0));
