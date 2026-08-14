import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

let dirName = "";
try {
  // @ts-ignore
  dirName = __dirname;
} catch (e) {
  // @ts-ignore
  dirName = path.dirname(fileURLToPath(import.meta.url));
}

let envPath = path.resolve(dirName, '../.env');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '.env');
}
dotenv.config({ path: envPath });

// Disable TLS validation errors for UAT/Staging proxy handshakes
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Prevent firebase-admin and google-auth-library from checking metadata server and hanging in local environments
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  process.env.METADATA_SERVER_DETECTION = 'none';
  process.env.GCE_METADATA_HOST = '127.0.0.1';
  process.env.GCP_METADATA_CHECK_DISABLE = 'true';
  process.env.NO_GCE_CHECK = 'true';
}
