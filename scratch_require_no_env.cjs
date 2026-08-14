console.log("No env - A: Before require firebase-admin");
delete process.env.NODE_ENV;
process.env.GCE_METADATA_HOST = '127.0.0.1';
process.env.GCE_METADATA_CHECK_DISABLE = 'true';
process.env.NO_GCE_CHECK = 'true';
const admin = require("firebase-admin");
console.log("No env - B: After require firebase-admin");
