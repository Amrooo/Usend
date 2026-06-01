import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

const testUsers = [
  { email: 'user@usend.com', password: 'password123', role: 'user', name: 'Test User' },
  { email: 'merchant@usend.com', password: 'password123', role: 'merchant', name: 'Test Merchant' },
  { email: 'admin@usend.com', password: 'password123', role: 'admin', name: 'Test Admin' },
  { email: 'driver@usend.com', password: 'password123', role: 'driver', name: 'Test Driver' }
];

async function run() {
  for (const u of testUsers) {
    try {
      console.log(`Creating ${u.email}...`);
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: u.email,
        role: u.role,
        name: u.name,
        createdAt: new Date().toISOString()
      });
      console.log(`Successfully created ${u.email} with UID: ${cred.user.uid}`);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        console.log(`${u.email} already exists! Skipping...`);
      } else {
        console.error(`Error creating ${u.email}:`, e.message);
      }
    }
  }
  process.exit(0);
}

run();
