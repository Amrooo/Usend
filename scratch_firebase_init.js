console.log("Setting environment...");
process.env.GCE_METADATA_HOST = '127.0.0.1';
console.log("Starting...");
const admin = (await import('firebase-admin')).default;
console.log("Loaded library");

const dummyCredential = {
  getAccessToken: () => Promise.resolve({
    access_token: 'dummy-token',
    expires_in: 3600
  })
};

admin.initializeApp({
  credential: dummyCredential,
  projectId: 'gen-lang-client-0329298140'
});
console.log("Initialized app");

const db = admin.firestore();
console.log("Got firestore");

console.log("Done!");
process.exit(0);
