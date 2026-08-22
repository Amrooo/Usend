const admin = require('firebase-admin');
admin.initializeApp({ projectId: "usend-staging-9182" }); // Assuming running on GC or has ADC, wait, on Cloudways it might rely on env variables.
