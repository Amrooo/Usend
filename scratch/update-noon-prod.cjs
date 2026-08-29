const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function update() {
  try {
    const noonRef = db.collection('settings').doc('courier_configs');
    const doc = await noonRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      if (data.noon) {
        data.noon.currentMode = 'production';
        await noonRef.set(data);
        console.log("Successfully set Noon currentMode to 'production'");
      } else {
        console.log("Noon config not found in courier_configs");
      }
    }
    
    const credsRef = db.collection('private_settings').doc('courier_credentials');
    const credsDoc = await credsRef.get();
    if (credsDoc.exists) {
      const credsData = credsDoc.data();
      if (credsData.noon && credsData.noon.productionCreds) {
        console.log("Noon production creds exist in Firestore:", credsData.noon.productionCreds.apiKey ? "YES (Key Present)" : "NO KEY");
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error updating:", error);
    process.exit(1);
  }
}

update();
