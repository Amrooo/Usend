const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = JSON.parse(fs.readFileSync('usend-5ce60-firebase-adminsdk-fbsvc-c8c3fa1bc9.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function listCollections() {
  const collections = await db.listCollections();
  console.log(collections.map(c => c.id).join(', '));
}
listCollections();
