import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Read firebase-tools config
const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens.access_token;
const projectId = 'usend-staging-9182';

console.log('Using access token starting with:', accessToken.substring(0, 15));

// Initialize Admin SDK with the oauth access token
admin.initializeApp({
  credential: {
    getAccessToken: () => Promise.resolve({
      access_token: accessToken,
      expires_in: 3600
    })
  },
  projectId: projectId
});

async function run() {
  const uid = 'uldwRiMWWIeaIEc76vC3lKbTAcl1'; // UID for amro-samman@hotmail.com
  await admin.auth().updateUser(uid, {
    password: '#JohnSnow2027'
  });
  console.log('Successfully updated password for amro-samman@hotmail.com to #JohnSnow2027!');
}

run().catch(console.error);
