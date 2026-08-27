const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function searchOrder() {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../firebase-applet-config.json'), 'utf8'));
  admin.initializeApp({
    projectId: config.projectId
  });

  const db = config.firestoreDatabaseId 
    ? admin.firestore().databaseId = config.firestoreDatabaseId
    : admin.firestore();

  console.log("Searching Firestore for order NOON-REQ-8117...");

  const requestsRef = admin.firestore().collection('requests');
  const snap = await requestsRef.get();

  let matchFound = null;

  snap.forEach(doc => {
    const data = doc.data();
    const docId = doc.id;
    const str = JSON.stringify({ docId, ...data });
    if (str.includes('8117') || str.includes('NOON-REQ-8117')) {
      matchFound = { id: docId, ...data };
    }
  });

  if (matchFound) {
    console.log("=== ORDER FOUND IN FIRESTORE ===");
    console.log(JSON.stringify(matchFound, null, 2));
  } else {
    console.log("Order NOON-REQ-8117 not found in Firestore requests collection.");
    console.log("Total requests in collection:", snap.size);
    snap.forEach(doc => {
      console.log(`Doc ID: ${doc.id} | Carrier: ${doc.data().carrier || doc.data().courier} | Status: ${doc.data().status}`);
    });
  }
}

searchOrder().catch(console.error);
