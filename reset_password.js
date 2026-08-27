import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
let envPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '.env');
}
dotenv.config({ path: envPath });

let firebaseConfig = {};
try {
  const configPath = path.resolve(__dirname, "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (e) {
  console.error("Failed to read firebase-applet-config.json:", e);
}

if (firebaseConfig.projectId) {
  process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
}

const options = {
  projectId: firebaseConfig.projectId
};

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  options.credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp(options);

async function run() {
  const uid = 'uldwRiMWWIeaIEc76vC3lKbTAcl1'; // UID for amro-samman@hotmail.com
  await admin.auth().updateUser(uid, {
    password: '#JohnSnow2027'
  });
  console.log('Successfully updated password for amro-samman@hotmail.com');
}

run().then(() => process.exit(0)).catch(err => {
  console.error('Failed to update password:', err);
  process.exit(1);
});
