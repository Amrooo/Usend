const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'usend-staging-9182'
});

const auth = admin.auth();
const db = admin.firestore();

async function run() {
  try {
    const userRecord = await auth.createUser({
      email: 'amro-samman@hotmail.com',
      password: '#JohnSnow2027',
      displayName: 'Amro Samman'
    });
    console.log('Successfully created new user:', userRecord.uid);
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      id: userRecord.uid,
      email: 'amro-samman@hotmail.com',
      role: 'admin',
      type: 'admin',
      name: 'Amro Samman',
      createdAt: new Date().toISOString()
    });
    console.log('Successfully added user to Firestore');
    process.exit(0);
  } catch (error) {
    console.error('Error creating new user:', error);
    process.exit(1);
  }
}
run();
