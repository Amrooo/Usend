console.log("Step 1: Starting script");
try {
  console.log("Step 2: Requiring dotenv");
  require("dotenv").config();
  console.log("Step 3: Requiring express");
  require("express");
  console.log("Step 4: Requiring firebase-admin");
  const admin = require("firebase-admin");
  console.log("Step 5: Initializing firebase-admin app");
  admin.initializeApp();
  console.log("Step 6: Getting firestore");
  const db = admin.firestore();
  console.log("Step 7: Testing firestore query");
  db.collection("settings").doc("courier_configs").get()
    .then(() => console.log("Step 8: Firestore query succeeded"))
    .catch((err) => console.log("Step 8: Firestore query failed:", err.message));
} catch (e) {
  console.error("Error caught:", e);
}
