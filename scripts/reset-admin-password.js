const admin = require("firebase-admin");
const serviceAccount = require("../firebase-applet-config.json"); // Or whichever config

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function resetPassword() {
  try {
    const email = "amro-samman@hotmail.com";
    const user = await admin.auth().getUserByEmail(email);
    const newPassword = "USendAdmin@" + Math.random().toString(36).slice(-8) + "!";
    await admin.auth().updateUser(user.uid, {
      password: newPassword
    });
    console.log("Password successfully updated to: " + newPassword);
  } catch (error) {
    console.error("Error updating user:", error);
  }
}
resetPassword();
