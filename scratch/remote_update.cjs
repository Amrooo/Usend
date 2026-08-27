
    const dotenv = require('dotenv');
    dotenv.config({ path: '/home/1150801.cloudwaysapps.com/mksqztfeks/public_html/.env' });
    const admin = require('firebase-admin');
    const { getFirestore } = require('firebase-admin/firestore');

    process.env.GCE_METADATA_HOST = '127.0.0.1';
    process.env.GCE_METADATA_CHECK_DISABLE = 'true';

    const app = admin.apps.length ? admin.app() : admin.initializeApp({
      projectId: 'usend-staging-9182'
    });

    const db = getFirestore(app);

    async function doUpdate() {
      console.log("=== UPDATING REQ-8117 IN FIRESTORE VIA ADMIN SDK ===");
      await db.collection('requests').doc('REQ-8117').set({
        status: 'Assigned',
        carrier: 'noon',
        externalTrackingNumber: 'NOON-REQ-8117',
        noonTaskId: 'NOON-REQ-8117',
        noonProviderStatus: 'pending_assignment',
        noonStatusLabel: 'Finding Driver (Assigned)',
        etaTime: '15-30 Mins (Noon RoD)'
      }, { merge: true });

      const snap = await db.collection('requests').doc('REQ-8117').get();
      console.log("Updated Doc Data:", JSON.stringify(snap.data(), null, 2));
      process.exit(0);
    }
    doUpdate().catch(e => { console.error("Update Error:", e); process.exit(1); });
  