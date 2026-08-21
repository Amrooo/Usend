import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, 'amro-samman@hotmail.com', '#JohnSnow2027');
    console.log("User created:", userCred.user.uid);
    await setDoc(doc(db, 'users', userCred.user.uid), {
      uid: userCred.user.uid,
      id: userCred.user.uid,
      email: 'amro-samman@hotmail.com',
      role: 'admin',
      type: 'admin',
      name: 'Admin Amro',
      createdAt: new Date().toISOString()
    });
    console.log("Firestore doc created");
    process.exit(0);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
        console.log("Email already in use, trying to update the document instead...");
        // Since we can't easily sign in if we don't want to mess up session, 
        // wait, we can sign in!
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const userCred2 = await signInWithEmailAndPassword(auth, 'amro-samman@hotmail.com', '#JohnSnow2027');
        console.log("Signed in as:", userCred2.user.uid);
        await setDoc(doc(db, 'users', userCred2.user.uid), {
            uid: userCred2.user.uid,
            id: userCred2.user.uid,
            email: 'amro-samman@hotmail.com',
            role: 'admin',
            type: 'admin',
            name: 'Admin Amro',
            createdAt: new Date().toISOString()
        }, { merge: true });
        console.log("Firestore doc updated to admin");
        process.exit(0);
    } else {
        console.error(e);
        process.exit(1);
    }
  }
}
run();
