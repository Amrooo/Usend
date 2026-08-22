const admin = require('firebase-admin');
process.env.GOOGLE_CLOUD_PROJECT = "usend-staging-9182";
admin.initializeApp({ projectId: "usend-staging-9182" });

const db = admin.firestore();

async function listAndWipe() {
  try {
    const collections = await db.listCollections();
    for (const collection of collections) {
      if (['users', 'webhooks', 'private_settings'].includes(collection.id)) {
        console.log(`Skipping protected collection: ${collection.id}`);
        continue;
      }
      console.log(`Wiping collection: ${collection.id}`);
      const snapshot = await collection.get();
      const batch = db.batch();
      let count = 0;
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
      });
      await batch.commit();
      console.log(`Deleted ${count} documents from ${collection.id}`);
    }
    console.log("Database wipe complete.");
  } catch(e) {
    console.error("Error wiping database:", e);
  }
}
listAndWipe().then(() => process.exit(0));
