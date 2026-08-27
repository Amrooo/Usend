
    const admin = require('/home/1150801.cloudwaysapps.com/mksqztfeks/public_html/node_modules/firebase-admin');
    if (!admin.apps.length) admin.initializeApp({ projectId: 'usend-43751' });
    const db = admin.firestore();
    async function search() {
      console.log("=== SEARCHING FIRESTORE FOR 8117 / NOON ===");
      const collections = ['requests', 'orders', 'shipments'];
      for (const col of collections) {
        const snap = await db.collection(col).get();
        snap.forEach(doc => {
          const d = doc.data();
          const str = JSON.stringify({ id: doc.id, ...d });
          if (str.includes('8117')) {
            console.log('FOUND MATCH IN ' + col + ' [' + doc.id + ']:');
            console.log(JSON.stringify(d, null, 2));
          }
        });
      }
      process.exit(0);
    }
    search().catch(err => { console.error(err); process.exit(1); });
  