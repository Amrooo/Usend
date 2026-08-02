console.log("Loading firebase-admin/app...");
await import('firebase-admin/app');
console.log("Loaded app!");

console.log("Loading firebase-admin/auth...");
await import('firebase-admin/auth');
console.log("Loaded auth!");

console.log("Loading firebase-admin/firestore...");
await import('firebase-admin/firestore');
console.log("Loaded firestore!");
