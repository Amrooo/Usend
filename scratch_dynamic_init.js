process.env.GCE_METADATA_HOST = '127.0.0.1';
process.env.GCP_METADATA_CHECK_DISABLE = 'true';
process.env.NO_GCE_CHECK = 'true';
console.log("Env set, importing firebase-admin...");
const admin = await import('firebase-admin');
console.log("Firebase admin imported successfully!");
