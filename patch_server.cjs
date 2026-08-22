const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const wipeEndpoint = `
// INTERNAL WIPE ENDPOINT
app.get("/api/internal/collections", async (req, res) => {
  try {
    const collections = await getDbAdmin().listCollections();
    res.json(collections.map(c => c.id));
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/internal/delete-collection/:name", async (req, res) => {
  try {
    const name = req.params.name;
    // VERY DANGEROUS: Do not allow deleting users or private_settings
    if (name === 'users' || name === 'webhooks' || name === 'private_settings') {
      return res.status(403).json({ error: 'Cannot delete protected collection' });
    }
    const db = getDbAdmin();
    const batch = db.batch();
    const snapshot = await db.collection(name).get();
    let count = 0;
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    await batch.commit();
    res.json({ success: true, count, collection: name });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});
`;

if (!content.includes('/api/internal/collections')) {
    content = content.replace('app.get("*", (req, res, next) => {', wipeEndpoint + '\n    app.get("*", (req, res, next) => {');
    fs.writeFileSync('server.ts', content);
    console.log('Wipe endpoint added');
} else {
    console.log('Wipe endpoint already exists');
}
