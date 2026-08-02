console.log("Starting...");
const admin = (await import('firebase-admin')).default;
console.log("Loaded library");
admin.initializeApp();
console.log("Initialized app");
const db = admin.firestore();
console.log("Got firestore");
