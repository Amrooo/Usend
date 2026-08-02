console.log("Loading google-auth-library...");
try {
  const auth = require('google-auth-library');
  console.log("Loaded google-auth-library!");
} catch (e) {
  console.error("Crash error:", e.message, e.stack);
}
