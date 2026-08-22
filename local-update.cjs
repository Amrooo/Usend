const admin = require('firebase-admin');
process.env.GOOGLE_CLOUD_PROJECT = "usend-staging-9182";
admin.initializeApp({ projectId: "usend-staging-9182" });
const db = admin.firestore();

async function run() {
  const apiKey = 'gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh';
  await db.collection('private_settings').doc('courier_configs').set({
    noonProdKey: apiKey,
    updatedAt: new Date().toISOString()
  }, { merge: true });
  console.log("Success!");
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
