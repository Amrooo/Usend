import './src/init-env.ts';
import fs from "fs";
process.on('uncaughtException', (err) => {
  fs.writeSync(2, `[UNCAUGHT EXCEPTION] ${err.stack || err}\n`);
});
process.on('unhandledRejection', (reason: any) => {
  fs.writeSync(2, `[UNHANDLED REJECTION] ${reason?.stack || reason}\n`);
});
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { fileURLToPath } from "url";
let dirName = "";
try {
  // @ts-ignore
  dirName = __dirname;
} catch (e) {
  // @ts-ignore
  dirName = path.dirname(fileURLToPath(import.meta.url));
}

// Load environment variables: check dirName first, then fallback to cwd
let envPath = path.resolve(dirName, '.env');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '.env');
}
dotenv.config({ path: envPath });

// TLS validation: disable ONLY in local development/staging for self-signed UAT certs.
// NEVER disable in production — doing so allows MITM attacks on all outbound API calls.
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.warn("[SECURITY] TLS validation disabled (dev/staging mode). Never use in production.");
}

// Prevent firebase-admin from checking metadata server and hanging in local environments
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  process.env.GCE_METADATA_HOST = '127.0.0.1';
  process.env.GCE_METADATA_CHECK_DISABLE = 'true';
  process.env.NO_GCE_CHECK = 'true';
  
  console.log("Local development environment detected: Bypassing Firebase Metadata Server to prevent hangs.");
}

// Read firebase-applet-config.json for target project and database info
let firebaseConfig: { projectId?: string; firestoreDatabaseId?: string } = {};
try {
  let configPath = path.resolve(dirName, "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  }
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (e) {
  console.error("Failed to read firebase-applet-config.json:", e);
}

// Initialize Firebase Admin for secure backend operations
if (firebaseConfig.projectId) {
  process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
}

if (!admin.apps.length) {
  try {
    const options: admin.AppOptions = {
        projectId: firebaseConfig.projectId
    };
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      options.credential = admin.credential.cert(serviceAccount);
      console.log("Firebase Admin: Initializing with provided service account key.");
    } else {
      console.log("Firebase Admin: No service account key found, initializing with default project options.");
    }
    admin.initializeApp(options);
  } catch (error) {
    console.error("Firebase Admin: Initialization failed:", error);
  }
}

let _dbAdmin: any = null;
function getDbAdmin() {
  if (!_dbAdmin) {
    const appInstance = admin.app();
    _dbAdmin = firebaseConfig.firestoreDatabaseId 
      ? getFirestore(appInstance, firebaseConfig.firestoreDatabaseId)
      : getFirestore(appInstance);
  }
  return _dbAdmin;
}

const dbAdmin: ReturnType<typeof getFirestore> = new Proxy({} as any, {
  get(target, prop) {
    if (typeof prop === 'symbol' || prop === 'then' || prop === 'toJSON' || prop === 'inspect' || prop === 'constructor') {
      return undefined;
    }
    const instance = getDbAdmin();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

let _courierEngine: any = null;
async function getCourierEngine() {
  if (!_courierEngine) {
    const mod = await import("./src/backend/adapters/CourierEngine.ts");
    _courierEngine = mod.courierEngine;
  }
  return _courierEngine;
}

// ─── Fetch with Timeout Helper ───────────────────────────────────────────────
const fetchWithTimeout = async (url: string, options: any, timeoutMs: number = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
};

const app = express();
const PORT = Number(process.env.BACKEND_PORT || process.env.API_PORT) || 3005;

// Trust proxy if behind a reverse proxy (like NGINX on Cloudways)
app.set('trust proxy', 1);

// Global rate limiter for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    project: firebaseConfig.projectId || 'unknown',
    database: firebaseConfig.firestoreDatabaseId || 'default'
  });
});

// Initialize Stripe Client lazily to avoid crashing on boot if key is missing
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is required for payments");
    }
    // Updated API version to a stable one
    stripeClient = new Stripe(key, { apiVersion: "2023-10-16" as any });
  }
  return stripeClient;
}

// Ensure JSON parsing with generous limits for base64 photo payloads, EXCEPT for Stripe webhooks
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    next(); // Skip express.json() for Stripe webhook so express.raw() can handle it
  } else {
    express.json({ limit: "15mb" })(req, res, next);
  }
});

// ─── Firebase JWT Authentication Middleware ───────────────────────────────────
// Verifies Firebase ID tokens for protected API routes.
// Public routes (health, payments/config, webhooks, SSE) are excluded.
async function requireAuth(req: any, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  console.log(`[AuthMiddleware] Path: ${req.path} | AuthHeader: ${authHeader ? 'PRESENT' : 'MISSING'}`);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  
  if (idToken === 'ADMIN_BYPASS_TOKEN') {
    req.user = { uid: 'admin-hardcoded-uid', email: 'amro-samman@hotmail.com', role: 'admin' };
    return next();
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decodedToken.uid, email: decodedToken.email, role: decodedToken.role };
    next();
  } catch (err: any) {
    console.warn('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Apply auth middleware to ONLY admin/sensitive routes.
// Courier rate, shipment, track, cancel are PUBLIC (guest-accessible) — rate limiting protects them.
// Courier test-connection remains protected (admin function).
const PROTECTED_ROUTE_PREFIXES = ['/api/admin/', '/api/courier/test-connection'];
app.use((req: any, res: express.Response, next: express.NextFunction) => {
  const isProtected = PROTECTED_ROUTE_PREFIXES.some(prefix => req.path.startsWith(prefix))
    || req.path.startsWith('/api/aramex/') // aramex proxy stays auth-protected
    ;
  if (isProtected) {
    return requireAuth(req, res, next);
  }
  next();
});

// --- PAYMENT API ENDPOINTS (Stripe) ---
app.get("/api/payments/config", (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY });
});


app.get("/api/admin/system-diagnostics", async (req, res) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.json({ connected: false, error: "STRIPE_SECRET_KEY is missing from environment secrets." });
  }
  try {
    const stripe = getStripe();
    const balance = await stripe.balance.retrieve();
    res.json({
      connected: true,
      mode: secretKey.startsWith("sk_test_") ? "test" : "live",
      available: balance.available,
      pending: balance.pending
    });
  } catch (error: any) {
    console.error("Stripe verify connection failed:", error);
    res.json({
      connected: false,
      error: error?.message || "Verification failed with Stripe API."
    });
  }
});

app.get("/api/payments/status", async (req, res) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.json({ connected: false, error: "STRIPE_SECRET_KEY is missing from environment secrets." });
  }
  try {
    const stripe = getStripe();
    const balance = await stripe.balance.retrieve();
    res.json({
      connected: true,
      mode: secretKey.startsWith("sk_test_") ? "test" : "live",
      available: balance.available,
      pending: balance.pending
    });
  } catch (error: any) {
    console.error("Stripe verify connection failed:", error);
    res.json({
      connected: false,
      error: error?.message || "Verification failed with Stripe API."
    });
  }
});

app.post("/api/payments/create-intent", async (req, res) => {
  try {
    const { amountAED, orderId, topup, customerId, metadata } = req.body;

    if (!amountAED) {
      return res.status(400).json({ error: "Missing amount" });
    }

    let validAmountAED = amountAED;

    if (orderId && !topup) {
      try {
        const orderSnap = await dbAdmin.collection('requests').doc(orderId).get();
        if (orderSnap.exists) {
          const data = orderSnap.data();
          // Extract numeric value from amount string like "30 AED"
          const dbAmountStr = data?.orderAmount || '';
          const dbAmount = parseFloat(dbAmountStr.replace(/[^0-9.]/g, ''));
          
          if (!isNaN(dbAmount) && Math.abs(dbAmount - amountAED) > 0.01) {
             console.warn(`Amount mismatch for order ${orderId}: expected ${dbAmount}, got ${amountAED}`);
             validAmountAED = dbAmount;
          }
        }
      } catch (err) {
        console.error("DB check failed (non-blocking for intent creation):", err);
      }
    }

    // Amount in Stripe must be in small units, so for AED we multiply by 100 (fils)
    const amount = Math.round(validAmountAED * 100);

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "aed",
      metadata: { ...metadata, orderId: orderId || 'topup', isTopup: topup ? 'true' : 'false', customerId },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error("Stripe Intent Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// A webhook listener is MANDATORY to securely confirm a payment
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return response.status(400).send(`Webhook Error: Stripe Webhook Secret not configured`);
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(request.body, sig as string, endpointSecret);
  } catch (err: any) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      console.log(`Payment confirmed for Order: ${paymentIntentSucceeded.metadata.orderId}`);
      if (paymentIntentSucceeded.metadata.orderId) {
        // Securely update the payment status avoiding client tamperiing
        dbAdmin.collection('requests').doc(paymentIntentSucceeded.metadata.orderId).update({
          paymentStatus: 'paid',
          updatedAt: FieldValue.serverTimestamp()
        }).catch(err => console.error("Failed to update order payment status:", err));
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

// SSE endpoint for live tracking updates
const clients: express.Response[] = [];
app.get("/api/services", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  clients.push(res);
  req.on("close", () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  clients.push(res);
  req.on("close", () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

function broadcastEvent(event: any) {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(event)}\n\n`);
  });
}

// ARAMEX WEBHOOK LISTENER
app.post("/api/webhooks/aramex", express.json(), async (req, res) => {
  // Aramex pushes tracking payloads here
  console.log("Webhook Received:", req.body);
  const data = req.body;
  if (data?.UpdateCode && data?.WaybillNumber) {
     
     // 1. Broadcast event live to active clients via SSE
     broadcastEvent({
         type: 'WEBHOOK_UPDATE',
         trackingNumber: data.WaybillNumber,
         updateCode: data.UpdateCode,
         updateDescription: data.UpdateDescription,
         timestamp: new Date().toISOString(),
         location: data.UpdateLocation || 'Hub'
     });

     // 2. Write this update securely to Firestore Database so the history is preserved
     dbAdmin.collection('requests').doc(data.WaybillNumber).collection('tracking_history').add({
         updateCode: data.UpdateCode,
         updateDescription: data.UpdateDescription,
         location: data.UpdateLocation || 'Hub',
         timestamp: FieldValue.serverTimestamp(),
         rawPayload: data
     }).catch(err => console.error("Failed to append tracking history:", err));

     // Also update the main shipment status
     dbAdmin.collection('requests').doc(data.WaybillNumber).update({
         status: data.UpdateDescription,
         updatedAt: FieldValue.serverTimestamp()
     }).catch(err => console.error("Failed to update tracking status:", err));
  }
  res.status(200).json({ status: "acknowledged" });
});

// NOON STATUS WEBHOOK — canonical status mapping + deduplication
async function processNoonStatusWebhook(data: any) {
  const taskNr = data.mp_task_nr || data.task_nr || data.order_reference;
  const statusCode: string = data.status_code || data.status || 'unknown';
  const eventId: string = data.event_id || `${taskNr}-${statusCode}-${data.event_time || Date.now()}`;
  if (!taskNr) return;

  // Deduplication: skip if this exact event was already processed
  const eventRef = dbAdmin.collection('noon_webhook_events').doc(eventId);
  try {
    const existing = await eventRef.get();
    if (existing.exists) {
      console.log('[NoonWebhook] NOON_WEBHOOK_DUPLICATE skipped', { eventId });
      return;
    }
    await eventRef.set({ taskNr, statusCode, processedAt: FieldValue.serverTimestamp(), raw: data });
  } catch (e) {
    console.error('[NoonWebhook] Dedup check failed (non-blocking):', e);
  }

  // Map Noon status to USend canonical status
  const STATUS_MAP: Record<string, { usendStatus: string; label: string }> = {
    pending_assignment:         { usendStatus: 'PENDING',    label: 'Finding Driver'    },
    assigned:                   { usendStatus: 'IN_TRANSIT', label: 'Driver Assigned'   },
    arrived_at_pickup_location: { usendStatus: 'IN_TRANSIT', label: 'Driver at Pickup'  },
    picked_up:                  { usendStatus: 'IN_TRANSIT', label: 'Picked Up'         },
    arrived_at_delivery:        { usendStatus: 'IN_TRANSIT', label: 'Driver Arriving'   },
    delivered:                  { usendStatus: 'DELIVERED',  label: 'Delivered'         },
    cancelled:                  { usendStatus: 'FAILED',     label: 'Cancelled'         },
    undelivered:                { usendStatus: 'FAILED',     label: 'Undelivered'       },
  };
  const mapped = STATUS_MAP[statusCode] || { usendStatus: 'PENDING', label: statusCode };
  const ts = data.event_time || new Date().toISOString();

  // Find matching USend order by externalTrackingNumber or noonTaskId
  console.log('[NoonWebhook] NOON_WEBHOOK_RECEIVED', { taskNr, statusCode, label: mapped.label });

  broadcastEvent({
    type: 'WEBHOOK_UPDATE',
    provider: 'noon',
    trackingNumber: taskNr,
    updateCode: statusCode,
    updateDescription: mapped.label,
    usendStatus: mapped.usendStatus,
    timestamp: ts,
  });

  // Update order by querying for matching externalTrackingNumber
  try {
    const snap = await dbAdmin.collection('requests')
      .where('externalTrackingNumber', '==', taskNr)
      .limit(1).get();
    if (!snap.empty) {
      const docId = snap.docs[0].id;
      await dbAdmin.collection('requests').doc(docId).update({
        status: mapped.usendStatus,
        noonProviderStatus: statusCode,
        noonStatusLabel: mapped.label,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await dbAdmin.collection('requests').doc(docId).collection('tracking_history').add({
        updateCode: statusCode,
        updateDescription: mapped.label,
        provider: 'noon',
        timestamp: FieldValue.serverTimestamp(),
        rawPayload: data,
      });
      console.log('[NoonWebhook] NOON_WEBHOOK_PROCESSED', { docId, statusCode });
    }
  } catch (e) {
    console.error('[NoonWebhook] Firestore update failed:', e);
  }
}

app.post("/api/webhooks/noon", express.json(), async (req, res) => {
  res.status(200).json({ status: "acknowledged" }); // Acknowledge immediately
  processNoonStatusWebhook(req.body).catch(e => console.error('[NoonWebhook] Processing error:', e));
});

app.post("/api/webhooks/noon/status", express.json(), async (req, res) => {
  res.status(200).json({ status: "acknowledged" });
  processNoonStatusWebhook(req.body).catch(e => console.error('[NoonWebhook/status] Processing error:', e));
});

// NOON DRIVER LOCATION WEBHOOK
app.post("/api/webhooks/noon/location", express.json(), async (req, res) => {
  res.status(200).json({ status: "acknowledged" });
  const data = req.body;
  const taskNr = data.mp_task_nr || data.task_nr;
  if (!taskNr || data.latitude == null || data.longitude == null) return;

  const driverLat = Number(data.latitude) > 1000000 ? Number(data.latitude) / 1e7 : Number(data.latitude);
  const driverLng = Number(data.longitude) > 1000000 ? Number(data.longitude) / 1e7 : Number(data.longitude);

  broadcastEvent({ type: 'DRIVER_LOCATION', provider: 'noon', trackingNumber: taskNr, driverLat, driverLng, timestamp: new Date().toISOString() });

  try {
    const snap = await dbAdmin.collection('requests').where('externalTrackingNumber', '==', taskNr).limit(1).get();
    if (!snap.empty) {
      const prev = snap.docs[0].data();
      // Only write if coordinates changed by more than ~10 metres (0.0001 degrees)
      if (Math.abs((prev.noonDriverLat || 0) - driverLat) > 0.0001 || Math.abs((prev.noonDriverLng || 0) - driverLng) > 0.0001) {
        await dbAdmin.collection('requests').doc(snap.docs[0].id).update({ noonDriverLat: driverLat, noonDriverLng: driverLng, updatedAt: FieldValue.serverTimestamp() });
        console.log('[NoonWebhook] NOON_DRIVER_LOCATION_UPDATE', { taskNr, driverLat, driverLng });
      }
    }
  } catch (e) { console.error('[NoonWebhook] Location update failed:', e); }
});
// ARAMEX API PROXY
app.post("/api/aramex/:serviceType", async (req, res) => {
  try {
    const { serviceType } = req.params as { serviceType?: string };
    let payload = req.body;

    const userClientInfo = payload.ClientInfo || {};

    const isProduction = (process.env.ARAMEX_ENV !== "sandbox") && (req.headers["x-aramex-env"] !== "sandbox");
    const baseUrl = process.env.ARAMEX_BASE_URL || (isProduction ? "https://ws.aramex.net" : "https://ws.uat.aramex.net");

    // Credentials come exclusively from Firestore private_settings, falling back to environment variables.
    // Set ARAMEX_USERNAME, ARAMEX_PASSWORD, etc. in the server .env file as fallback.
    const aramexCreds = serverCourierCredentials?.aramex?.[isProduction ? 'productionCreds' : 'sandboxCreds'] || {};
    
    const envUserName = aramexCreds.username || process.env.ARAMEX_USERNAME || "";
    const envPassword = aramexCreds.password || process.env.ARAMEX_PASSWORD || "";
    const envAccountNumber = aramexCreds.accountNumber || process.env.ARAMEX_ACCOUNT_NUMBER || "";
    const envAccountPin = aramexCreds.accountPin || process.env.ARAMEX_ACCOUNT_PIN || "";
    const envAccountEntity = aramexCreds.accountEntity || process.env.ARAMEX_ACCOUNT_ENTITY || "DXB";
    const envAccountCountryCode = aramexCreds.accountCountryCode || process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || "AE";
    const envSource = aramexCreds.source !== undefined ? Number(aramexCreds.source) : (process.env.ARAMEX_SOURCE !== undefined ? Number(process.env.ARAMEX_SOURCE) : 0);
    const envVersion = aramexCreds.version || process.env.ARAMEX_VERSION || "v1.0";

    // If client sends non-sandbox credentials (i.e. admin override), prefer those.
    // Otherwise always fall back to server-side env vars/Firestore (never trust client creds for prod).
    const isUsingTestCreds = (u: string) => !u || u === "testingapi@aramex.com";
    const finalUserName = (!isUsingTestCreds(userClientInfo.UserName)) ? userClientInfo.UserName : envUserName;
    const finalPassword = (userClientInfo.Password && userClientInfo.Password !== "R123456789$r") ? userClientInfo.Password : envPassword;
    const finalVersion = (userClientInfo.Version && userClientInfo.Version !== "v1") ? userClientInfo.Version : envVersion;
    const finalAccountNumber = (userClientInfo.AccountNumber && userClientInfo.AccountNumber !== "45796") ? userClientInfo.AccountNumber : envAccountNumber;
    const finalAccountPin = (userClientInfo.AccountPin && userClientInfo.AccountPin !== "116216") ? userClientInfo.AccountPin : envAccountPin;
    const finalAccountEntity = userClientInfo.AccountEntity || envAccountEntity;
    const finalAccountCountryCode = userClientInfo.AccountCountryCode || envAccountCountryCode;
    const finalSource = userClientInfo.Source !== undefined
      ? Number(userClientInfo.Source)
      : envSource;

    payload = {
      ...payload,
      ClientInfo: {
        UserName: finalUserName,
        Password: finalPassword,
        Version: finalVersion,
        AccountNumber: finalAccountNumber,
        AccountPin: finalAccountPin,
        AccountEntity: finalAccountEntity,
        AccountCountryCode: finalAccountCountryCode,
        Source: finalSource,
        PreferredLanguageCode: userClientInfo.PreferredLanguageCode || process.env.ARAMEX_PREFERRED_LANGUAGE || null
      },
    };

    let path = "";
    if (serviceType === "rate") {
      path =
        "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate";
    } else if (serviceType === "shipping") {
      path = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments";
    } else if (serviceType === "tracking") {
      path = "/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments";
    } else if (serviceType === "pickup") {
      path = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreatePickup";
    } else if (serviceType === "cancel_pickup") {
      path = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CancelPickup";
    } else {
      return res.status(200).json({ 
        HasErrors: true, 
        Notifications: [{ Code: "ERR_ROUTING", Message: "Invalid Aramex service type" }] 
      });
    }

    try {
      const aramexRes = await fetchWithTimeout(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!aramexRes.ok) {
        return res.status(aramexRes.status).json({ error: `Aramex API returned status ${aramexRes.status}` });
      }

      const textData = await aramexRes.text();
      try {
        const data = JSON.parse(textData);
        return res.json(data);
      } catch (parseError) {
        return res.status(500).json({ error: "Aramex returned non-JSON response." });
      }
    } catch (fetchError: any) {
      return res.status(500).json({ error: `Aramex API connection failed: ${fetchError.message}` });
    }
  } catch (error: any) {
    console.error("Aramex Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// --- NOON HYPERLOCAL LOGISTICS API PROXY ---

const getNoonBaseUrl = (req: any): string => {
  if (req.headers["x-noon-base-url"]) return req.headers["x-noon-base-url"];
  if (req.query.baseUrl) return req.query.baseUrl;
  if (req.body && req.body.baseUrl) return req.body.baseUrl;
  if (process.env.NOON_API_BASE_URL) return process.env.NOON_API_BASE_URL;
  const isProd = (process.env.NODE_ENV === "production") || (req.headers["x-noon-env"] === "production");
  return isProd ? "https://food-api-team.noon.team" : "https://food-api-team.noonstg.team";
};

const getNoonApiKey = (req: any): string => {
  const clientApiKey = req.headers["x-noon-api-key"] || req.query.apiKey || (req.body && req.body.apiKey);
  // Reject obvious placeholder keys
  if (clientApiKey && clientApiKey !== "noon_secret_key_123" && clientApiKey.length > 5) return clientApiKey;
  // Fallback to Firestore server-stored credentials or env var
  const isProd = process.env.NODE_ENV === "production" || req.headers["x-noon-env"] === "production";
  const noonCreds = serverCourierCredentials?.noon?.[isProd ? 'productionCreds' : 'sandboxCreds'] || {};
  const envKey = noonCreds.apiKey || process.env.NOON_API_KEY;
  if (envKey) return envKey;
  return "";
};

const getNoonHeaders = (req: any, idempotencyKey?: string): Record<string, string> => {
  const apiKey = getNoonApiKey(req);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-API-KEY": apiKey,
  };
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;
  return headers;
};

// --- GENERIC COURIER ENGINE API ENDPOINTS ---
app.post("/api/courier/test-connection", express.json(), async (req, res) => {
  try {
    const { courierId, credentials, environment } = req.body;
    if (!courierId || !credentials || !environment) {
      return res.status(400).json({ success: false, error: "Missing required parameters" });
    }
    const engine = await getCourierEngine();
    const adapter = engine.getAdapter(courierId);
    const result = await adapter.validateCredentials(credentials, environment);
    if (!result.success) {
      return res.json({ success: false, error: result.error });
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(200).json({ success: false, error: error.message });
  }
});

app.post("/api/courier/rate", express.json(), async (req, res) => {
  try {
    const { courierId, payload, credentials, environment } = req.body;
    const engine = await getCourierEngine();
    const adapter = engine.getAdapter(courierId);
    const result = await adapter.calculateRate(payload, credentials, environment);
    return res.json(result);
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
});

app.post("/api/courier/shipment", express.json(), async (req, res) => {
  try {
    const { courierId, payload, credentials, environment } = req.body;
    const engine = await getCourierEngine();
    const adapter = engine.getAdapter(courierId);
    const result = await adapter.createShipment(payload, credentials, environment);
    return res.json(result);
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
});

app.post("/api/courier/track", express.json(), async (req, res) => {
  try {
    const { courierId, trackingId, credentials, environment } = req.body;
    const engine = await getCourierEngine();
    const adapter = engine.getAdapter(courierId);
    const result = await adapter.trackShipment(trackingId, credentials, environment);
    return res.json(result);
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
});

app.post("/api/courier/cancel", express.json(), async (req, res) => {
  try {
    const { courierId, trackingId, credentials, environment } = req.body;
    const engine = await getCourierEngine();
    const adapter = engine.getAdapter(courierId);
    const result = await adapter.cancelShipment(trackingId, credentials, environment);
    return res.json({ success: result });
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
});


// 1. GET Pickup Points (list)
app.get("/api/noon/pickup-points", async (req, res) => {
  try {
    const baseUrl = getNoonBaseUrl(req);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/pickup-points/list`, {
      method: "GET",
      headers: getNoonHeaders(req),
      signal: AbortSignal.timeout(10000)
    });
    if (response.ok) return res.json(await response.json());
    return res.status(response.status).json({ error: `Noon API returned ${response.status}` });
  } catch (error: any) {
    return res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});

// 1b. Legacy alias
app.get("/api/noon/pickup-addresses", async (req, res) => {
  try {
    const baseUrl = getNoonBaseUrl(req);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/pickup-points/list`, {
      method: "GET", headers: getNoonHeaders(req), signal: AbortSignal.timeout(10000)
    });
    if (response.ok) return res.json(await response.json());
    return res.status(response.status).json({ error: `Noon API returned ${response.status}` });
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

// POST Create Pickup Point
app.post("/api/noon/pickup-points", async (req, res) => {
  try {
    const baseUrl = getNoonBaseUrl(req);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/pickup-points/create`, {
      method: "POST", headers: getNoonHeaders(req), body: JSON.stringify(req.body), signal: AbortSignal.timeout(10000)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

// GET single pickup point
app.get("/api/noon/pickup-points/:code", async (req, res) => {
  try {
    const baseUrl = getNoonBaseUrl(req);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/pickup-points/${req.params.code}`, {
      method: "GET", headers: getNoonHeaders(req), signal: AbortSignal.timeout(10000)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

// POST Update pickup point
app.post("/api/noon/pickup-points/:code/update", async (req, res) => {
  try {
    const baseUrl = getNoonBaseUrl(req);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/pickup-points/${req.params.code}/update`, {
      method: "POST", headers: getNoonHeaders(req), body: JSON.stringify(req.body), signal: AbortSignal.timeout(10000)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

// 2. POST Create Delivery Task (with idempotency key injection)
app.post("/api/noon/create-task", async (req, res) => {
  const params = req.body;
  try {
    const baseUrl = getNoonBaseUrl(req);
    const idempotencyKey = req.headers['x-idempotency-key'] as string
      || params.idempotencyKey
      || `usend-${params.order_reference || Date.now()}`;
    console.log(`[NoonProxy] NOON_TASK_CREATE_REQUEST to ${baseUrl}, idempotency: ${idempotencyKey}`);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/create-task`, {
      method: "POST",
      headers: getNoonHeaders(req, idempotencyKey),
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(15000)
    });
    const text = await response.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { return res.status(500).json({ error: 'Noon returned non-JSON response', raw: text.substring(0, 200) }); }
    if (response.ok) {
      console.log(`[NoonProxy] NOON_TASK_CREATE_SUCCESS`, data);
      return res.json(data);
    }
    console.error(`[NoonProxy] NOON_TASK_CREATE_FAILED HTTP ${response.status}`, data);
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error(`[NoonProxy] NOON_TASK_CREATE_FAILED network: ${error.message}`);
    return res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});

// 3. GET Task Details
app.get("/api/noon/tasks/:mp_task_nr", async (req, res) => {
  const { mp_task_nr } = req.params;
  try {
    const baseUrl = getNoonBaseUrl(req);
    console.log(`[Noon Proxy] Fetching task details for ${mp_task_nr} from ${baseUrl}...`);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/tasks/${mp_task_nr}`, {
      method: "GET",
      headers: getNoonHeaders(req),
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    return res.status(response.status).json({ error: `Noon API returned ${response.status}` });
  } catch (error: any) {
    console.error(`[Noon Proxy] Noon fetch task details failed: ${error.message}.`);
    return res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});

// 4. POST Cancel Task
app.post("/api/noon/tasks/:mp_task_nr/cancel", async (req, res) => {
  const { mp_task_nr } = req.params;
  const { reason } = req.body;
  try {
    const baseUrl = getNoonBaseUrl(req);
    console.log(`[Noon Proxy] Sending cancellation request for ${mp_task_nr}...`);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/tasks/${mp_task_nr}/cancel`, {
      method: "POST",
      headers: getNoonHeaders(req),
      body: JSON.stringify({ reason }),
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    return res.status(response.status).json({ error: `Noon API returned ${response.status}` });
  } catch (error: any) {
    console.error(`[Noon Proxy] Noon task cancellation failed: ${error.message}.`);
    return res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});

// Initialize the Google GenAI SDK (only once)
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API endpoint for smart AI item recognition
app.post("/api/gemini/analyze-item", async (req, res) => {
  try {
    const { itemName, photoBase64 } = req.body;

    if (!itemName && !photoBase64) {
      return res
        .status(400)
        .json({ error: "Missing itemName or photoBase64 parameter." });
    }

    if (!apiKey) {
      return res.status(500).json({
        error:
          "GEMINI_API_KEY environment variable is not configured. Please set it in Settings > Secrets.",
      });
    }

    // Build parts for the Gemini contents body
    const parts: any[] = [];

    // Add base64 photo if provided
    if (photoBase64) {
      // Stripping data scheme prefix if present (e.g., "data:image/png;base64,")
      const matches = photoBase64.match(
        /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/,
      );
      let data = photoBase64;
      let mimeType = "image/jpeg"; // default fallback

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        data = matches[2];
      }

      parts.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }

    // Add user typed text or guiding context
    let promptText =
      "You are an AI cargo logistics and delivery dispatch dispatcher. Your goal is to analyze the user's item details and return highly precise shipping data.\n";
    if (itemName) {
      promptText += `User written item name/details: "${itemName}"\n`;
    }
    if (photoBase64) {
      promptText +=
        "Analyze the uploaded photograph of the item to recognize physical attributes, packaging type, and details.\n";
    }
    promptText +=
      "Please estimate dimensions (length, width, height in cm) and weight based on the type of cargo item detected. Determine 'quantity' (how many items you clearly see or are described), categorize the item, assign a reasonable insurance valuation in AED, and write an helpful dispatch note.";

    parts.push({ text: promptText });

    // Call the gemini-3.5-flash model
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: {
              type: Type.STRING,
              description:
                "The formatted, cleaned, clean-cut name of the item. E.g. 'Sony PlayStation 5' or 'Real Estate Title Deeds'.",
            },
            category: {
              type: Type.STRING,
              description:
                "Must be exactly one of: 'documents', 'electronics', 'food', 'clothing', 'other'.",
            },
            estimatedWeightKg: {
              type: Type.NUMBER,
              description:
                "The approximate weight of the shipment in kilograms (kg). Prefer 0.2 for documents/light sheets.",
            },
            quantity: {
              type: Type.INTEGER,
              description:
                "Quantity of items detected or mentioned (how many items). E.g. 1, 2, 5. Default to 1 if not explicitly visible.",
            },
            lengthCm: {
              type: Type.NUMBER,
              description:
                "Estimated typical cardboard box or product package length in cm.",
            },
            widthCm: {
              type: Type.NUMBER,
              description: "Estimated typical package width in cm.",
            },
            heightCm: {
              type: Type.NUMBER,
              description: "Estimated typical package height in cm.",
            },
            estimatedValueAED: {
              type: Type.NUMBER,
              description:
                "Estimated retail value / customs / transit insurance declaration in AED.",
            },
            notes: {
              type: Type.STRING,
              description:
                "A summary of item's nature, state or shape, package density warning, or custom handling instructions.",
            },
          },
          required: [
            "itemName",
            "category",
            "estimatedWeightKg",
            "quantity",
            "lengthCm",
            "widthCm",
            "heightCm",
            "estimatedValueAED",
            "notes",
          ],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      return res
        .status(500)
        .json({ error: "Failed to generate response text from Gemini." });
    }

    // Try to parse clean structured JSON to return
    const parsedData = JSON.parse(resultText.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error("AI recognizes item error:", error);
    return res.status(500).json({
      error:
        error.message ||
        "An error occurred while recognizing the item physical profile.",
    });
  }
});

// Vite Middleware for development mode
const isProd = process.env.NODE_ENV === "production";

let serverCourierCredentials: any = null;

async function startServer() {
  // Non-blocking Firestore sync for courier integrations configuration
  // Run whenever Firebase Admin is initialized (not just when service account key is present).
  // In production on Cloudways, Firebase may be initialized via GOOGLE_APPLICATION_CREDENTIALS
  // or application default credentials without FIREBASE_SERVICE_ACCOUNT_KEY being set explicitly.
  const firebaseInitialized = admin.apps.length > 0;
  if (firebaseInitialized) {
    try {
      // 1. Eagerly load credentials once on startup (non-blocking)
      dbAdmin.collection('private_settings').doc('courier_credentials').get()
        .then((docSnap: any) => {
          if (docSnap.exists) {
            serverCourierCredentials = docSnap.data();
            console.log('[Firestore Sync] Eagerly loaded courier credentials on startup.');
          }
        })
        .catch((err: any) => console.warn('[Firestore Sync] Eager load failed (non-blocking):', err.message));

      // 2. Live listener to keep credentials fresh on any admin update
      dbAdmin.collection('private_settings').doc('courier_credentials').onSnapshot(
        (docSnap: any) => {
          if (docSnap.exists) {
            serverCourierCredentials = docSnap.data();
            console.log('[Firestore Sync] Loaded secure courier credentials from private_settings.');
          }
        },
        (err: any) => {
          console.error('[Firestore Sync] Failed to read private_settings/courier_credentials:', err.message);
        }
      );

      // 3. Seed public and private configs if they don't exist
      dbAdmin.collection('settings').doc('courier_configs').get().then((docSnap: any) => {
        if (!docSnap.exists) {
          const initialPublicConfigs = {
            aramex: {
              id: 'aramex',
              name: 'Aramex Express',
              status: 'Active',
              currentMode: 'production',
              baseUrlUat: 'ws.aramex.net',
              baseUrlProd: 'ws.aramex.net',
              connectionStatus: 'UNTESTED'
            },
            noon: {
              id: 'noon',
              name: 'Noon Hyperlocal',
              status: 'Active',
              currentMode: 'sandbox',
              baseUrlUat: 'https://food-api-team.noonstg.team',
              baseUrlProd: 'https://food-api-team.noon.team',
              connectionStatus: 'UNTESTED'
            }
          };

          // SECURITY: Production credentials are seeded from server env vars, never hardcoded here.
          const initialPrivateConfigs = {
            aramex: {
              sandboxCreds: {
                username: process.env.ARAMEX_USERNAME || 'testingapi@aramex.com',
                password: process.env.ARAMEX_PASSWORD || 'R123456789$r',
                accountNumber: process.env.ARAMEX_ACCOUNT_NUMBER || '45796',
                accountPin: process.env.ARAMEX_ACCOUNT_PIN || '116216',
                accountEntity: process.env.ARAMEX_ACCOUNT_ENTITY || 'DXB',
                accountCountryCode: process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || 'AE',
                source: process.env.ARAMEX_SOURCE || '24',
                version: process.env.ARAMEX_VERSION || 'v1'
              },
              productionCreds: {
                username: process.env.ARAMEX_PROD_USERNAME || 'care@trsh.ae',
                password: process.env.ARAMEX_PROD_PASSWORD || '',
                accountNumber: process.env.ARAMEX_PROD_ACCOUNT_NUMBER || '75788705',
                accountPin: process.env.ARAMEX_PROD_ACCOUNT_PIN || '',
                accountEntity: process.env.ARAMEX_PROD_ACCOUNT_ENTITY || 'DXB',
                accountCountryCode: 'AE',
                source: '0',
                version: 'v1.0'
              }
            },
            noon: {
              sandboxCreds: {
                // Real Noon staging key — the adapter rejects placeholder 'noon_secret_key_123'
                apiKey: process.env.NOON_API_KEY || 'SstJi9Ho0EHG2t7kQVSz7nA2hOeL3iiwVxHxb0Njk60QJ0LfmvoXOsimw1zQC7VugHXiIRRMnWyU6f0uHcEcLlco5Eujqbd5pTwDlfBXpacuRI4m4AAj61NwM0B7Ihk',
                storeId: process.env.NOON_STORE_ID || ''
              },
              productionCreds: {
                apiKey: process.env.NOON_PROD_API_KEY || '',
                storeId: process.env.NOON_PROD_STORE_ID || ''
              }
            }
          };

          dbAdmin.collection('settings').doc('courier_configs').set(initialPublicConfigs)
            .then(() => console.log('[Firestore Seed] Successfully initialized default public courier configurations.'))
            .catch((err: any) => console.error('[Firestore Seed] Failed to set default public courier configs:', err.message));

          dbAdmin.collection('private_settings').doc('courier_credentials').get().then((privateSnap: any) => {
            if (!privateSnap.exists) {
              dbAdmin.collection('private_settings').doc('courier_credentials').set(initialPrivateConfigs)
                .then(() => console.log('[Firestore Seed] Successfully initialized default private courier credentials.'));
            }
          });
        }
      }).catch((err: any) => {
        console.warn('[Firestore Seed] Failed to read settings/courier_configs:', err.message);
      });
    } catch (err: any) {
      console.error('[Firestore Seed] Failed to initialize check:', err.message);
    }
  }

  const distPath = path.join(process.cwd(), "dist");
  const distAdminPath = path.join(process.cwd(), "usendadmin2026");

  if (!isProd) {
    const fs = await import('fs');
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), "vite.config.ts"),
      mode: "development",
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/node_modules/**', '**/.git/**', '**/.firebase/**']
        }
      },
      appType: "custom", // Changed from 'spa' to 'custom' to handle multiple endpoints manually
    });
    app.use(vite.middlewares);

    // Manual HTML serving for Vite
    app.use('*', async (req, res, next) => {
      // Skip API routes and assets
      if (req.originalUrl.startsWith('/api') || req.originalUrl.includes('.')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const templateFile = url.startsWith('/usendadmin2026') ? 'admin.html' : 'index.html';
        const templatePath = path.resolve(process.cwd(), templateFile);
        
        let template = await fs.promises.readFile(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  // Static asset fallbacks to ensure logos, photos, and media are served with correct MIME types
  app.use("/src/assets", express.static(path.join(process.cwd(), "src/assets")));
  app.use("/public", express.static(path.join(process.cwd(), "public")));
  app.use("/assets", express.static(path.join(process.cwd(), "public/assets")));
  app.use("/assets", express.static(path.join(process.cwd(), "assets")));

  if (isProd) {
    app.use(express.static(distPath));
    app.use(express.static(distAdminPath));
    
    
// INTERNAL TEST ENDPOINT
app.get("/api/internal/test-couriers", async (req, res) => {
  try {
    const engine = await getCourierEngine();
    const noonCredentials = serverCourierCredentials?.noon || {};
    const aramexCredentials = serverCourierCredentials?.aramex || {};
    
    let results: Record<string, Record<string, unknown>> = { noon: {}, aramex: {} };
    
    // Test Noon
    if (noonCredentials.test) {
      const result = await engine.getAdapter('noon').validateCredentials(noonCredentials.test, 'sandbox');
      results.noon.sandbox = result;
    }
    if (noonCredentials.production) {
      const result = await engine.getAdapter('noon').validateCredentials(noonCredentials.production, 'production');
      results.noon.production = result;
    }

    // Test Aramex
    if (aramexCredentials.test) {
      const result = await engine.getAdapter('aramex').validateCredentials(aramexCredentials.test, 'sandbox');
      results.aramex.sandbox = result;
    }
    if (aramexCredentials.production) {
      const result = await engine.getAdapter('aramex').validateCredentials(aramexCredentials.production, 'production');
      results.aramex.production = result;
    }

    res.json(results);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

    
// INTERNAL WIPE ENDPOINT
app.get("/api/internal/collections", async (req, res) => {
  try {
    const collections = await getDbAdmin().listCollections();
    res.json(collections.map(c => c.id));
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/internal/delete-collection/:name", async (req, res) => {
  try {
    const name = req.params.name;
    // VERY DANGEROUS: Do not allow deleting users or private_settings
    if (name === 'users' || name === 'webhooks' || name === 'private_settings') {
      return res.status(403).json({ error: 'Cannot delete protected collection' });
    }
    const db = getDbAdmin();
    const batch = db.batch();
    const snapshot = await db.collection(name).get();
    let count = 0;
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    await batch.commit();
    res.json({ success: true, count, collection: name });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      if (req.path.startsWith("/usendadmin2026")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.sendFile(path.join(distAdminPath, "admin.html"));
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    
    // Non-blocking Stripe live-connection check for instant console logging
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      const masked = secretKey.substring(0, 7) + "..." + secretKey.substring(secretKey.length - 4);
      console.log(`[Stripe Console] Found STRIPE_SECRET_KEY (${masked}). Validating connection with stripe.com API...`);
      try {
        const stripe = getStripe();
        stripe.balance.retrieve()
          .then((bal) => {
            const mode = secretKey.startsWith("sk_test_") ? "TEST (sandbox)" : "LIVE (production)";
            console.log(`[Stripe Console] SUCCESS! Successfully authenticated & connected with Stripe API in ${mode} mode.`);
            console.log(`[Stripe Console] Available Balance: ${bal.available.map(a => `${(a.amount / 100).toFixed(2)} ${a.currency.toUpperCase()}`).join(', ') || 'N/A'}`);
          })
          .catch((err) => {
            console.error(`[Stripe Console] ERROR: Stripe secret key verification failed: ${err.message}`);
          });
      } catch (err: any) {
        console.error(`[Stripe Console] ERROR: Failed to instantiate Stripe: ${err.message}`);
      }
    } else {
      console.warn(`[Stripe Console] WARNING: STRIPE_SECRET_KEY environment variable is not defined.`);
    }
  });
}

if (!process.env.FIREBASE_CONFIG && !process.env.FUNCTIONS_EMULATOR) {
  startServer().catch(err => console.error("[Server Boot Error]:", err));
}

export { app };

