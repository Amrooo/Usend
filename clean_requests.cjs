#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

// Read firebase-applet-config.json
const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const PROJECT_ID = firebaseConfig.projectId;

console.log(`[Clean] Targeting Firebase project: ${PROJECT_ID}`);

// Get Access Token
const homedir = require('os').homedir();
const fbToolsPath = path.join(homedir, '.config', 'configstore', 'firebase-tools.json');
let accessToken = null;
if (fs.existsSync(fbToolsPath)) {
  const fbTools = JSON.parse(fs.readFileSync(fbToolsPath, 'utf8'));
  accessToken = fbTools.tokens?.access_token;
}

if (!accessToken) {
  console.error('[Clean] Could not find access token in firebase-tools.json.');
  process.exit(1);
}

async function getDocs(collection) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?pageSize=100`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error(`Failed to fetch ${collection}: ${res.statusText}`);
  const data = await res.json();
  return data.documents || [];
}

async function deleteDoc(name) {
  const url = `https://firestore.googleapis.com/v1/${name}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error(`Failed to delete ${name}: ${res.statusText}`);
}

async function clean() {
  const docs = await getDocs('requests');
  console.log(`Found ${docs.length} requests to delete.`);
  for (const doc of docs) {
    await deleteDoc(doc.name);
    console.log(`Deleted ${doc.name}`);
  }
  console.log('Cleanup complete.');
}

clean().catch(err => {
  console.error(err);
  process.exit(1);
});
