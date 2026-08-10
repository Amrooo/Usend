const { onRequest } = require("firebase-functions/v2/https");
const { app } = require("./server.cjs");

// Deploy Express app as 'api' Cloud Function
exports.api = onRequest(
  {
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60
  },
  app
);
