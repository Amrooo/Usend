import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import Stripe from "stripe";
import dotenv from "dotenv";
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import { courierEngine } from "./src/backend/adapters/CourierEngine";

// Load environment variables: check __dirname first, then fallback to cwd
let envPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '.env');
}
dotenv.config({ path: envPath });

// Disable TLS validation errors for UAT/Staging proxy handshakes
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Prevent firebase-admin from checking metadata server and hanging in local environments
if (process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  process.env.GCE_METADATA_HOST = '127.0.0.1';
  process.env.GCE_METADATA_CHECK_DISABLE = 'true';
  process.env.NO_GCE_CHECK = 'true';
  
  // Set Firestore emulator host to prevent the admin SDK from attempting to query
  // production servers without credentials and hanging on metadata checks.
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  console.log("Local development environment detected: Bypassing Firebase Metadata Server & setting Firestore Emulator Host to prevent hangs.");
}

// Read firebase-applet-config.json for target project and database info
let firebaseConfig: { projectId?: string; firestoreDatabaseId?: string } = {};
try {
  let configPath = path.resolve(__dirname, "firebase-applet-config.json");
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
      console.warn("Firebase Admin: No service account key found, using default credentials.");
    }
    
    admin.initializeApp(options);
  } catch (error) {
    console.error("Firebase Admin: Initialization failed:", error);
  }
}

const appInstance = admin.app();
// Use the specific firestore database ID if provided, otherwise default
const dbAdmin = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(appInstance, firebaseConfig.firestoreDatabaseId)
  : getFirestore(appInstance);

const app = express();
const PORT = 3000;

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

// --- PAYMENT API ENDPOINTS (Stripe) ---
app.get("/api/payments/config", (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY });
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

// NOON WEBHOOK LISTENER
app.post("/api/webhooks/noon", express.json(), async (req, res) => {
  console.log("Noon Webhook Received:", req.body);
  const data = req.body;
  if (data?.order_reference || data?.task_nr) {
     const trackingRef = data.order_reference || data.task_nr;
     const statusDesc = data.status_description || data.status_code || "Updated";
     
     broadcastEvent({
         type: 'WEBHOOK_UPDATE',
         trackingNumber: trackingRef,
         updateCode: data.status_code,
         updateDescription: statusDesc,
         timestamp: data.event_time || new Date().toISOString(),
         location: data.location || 'Noon Hub'
     });

     dbAdmin.collection('requests').doc(trackingRef).collection('tracking_history').add({
         updateCode: data.status_code || 'UPDATE',
         updateDescription: statusDesc,
         location: data.location || 'Noon Hub',
         timestamp: FieldValue.serverTimestamp(),
         rawPayload: data
     }).catch(err => console.error("Failed to append Noon tracking history:", err));

     dbAdmin.collection('requests').doc(trackingRef).update({
         status: statusDesc,
         updatedAt: FieldValue.serverTimestamp()
     }).catch(err => console.error("Failed to update Noon tracking status:", err));
  }
  res.status(200).json({ status: "acknowledged" });
});
// ARAMEX API PROXY
app.post("/api/aramex/:serviceType", async (req, res) => {
  try {
    const { serviceType } = req.params;
    let payload = req.body;

    const userClientInfo = payload.ClientInfo || {};

    const isProduction = (process.env.ARAMEX_ENV === "production") || (req.headers["x-aramex-env"] === "production");
    const baseUrl = process.env.ARAMEX_BASE_URL || (isProduction ? "https://ws.aramex.net" : "https://ws.uat.aramex.net");

    // Default test credentials according to the attached Aramex JSON environment
    const defaultUserName = "dxbit@aramex.com";
    const defaultPassword = "Ar@m3x$h1pp1ng";
    const defaultAccountNumber = "154454";
    const defaultAccountPin = "115216";
    const defaultAccountEntity = "DXB";
    const defaultAccountCountryCode = "AE";
    const defaultSource = 0;
    const defaultVersion = "v1.0";

    const finalUserName = userClientInfo.UserName && userClientInfo.UserName !== "testingapi@aramex.com"
      ? userClientInfo.UserName
      : (process.env.ARAMEX_USERNAME || defaultUserName);

    const finalPassword = userClientInfo.Password && userClientInfo.Password !== "R123456789$r"
      ? userClientInfo.Password
      : (process.env.ARAMEX_PASSWORD || defaultPassword);

    const finalVersion = userClientInfo.Version && userClientInfo.Version !== "v1"
      ? userClientInfo.Version
      : (process.env.ARAMEX_VERSION || defaultVersion);

    const finalAccountNumber = userClientInfo.AccountNumber && userClientInfo.AccountNumber !== "45796"
      ? userClientInfo.AccountNumber
      : (process.env.ARAMEX_ACCOUNT_NUMBER || defaultAccountNumber);

    const finalAccountPin = userClientInfo.AccountPin && userClientInfo.AccountPin !== "116216"
      ? userClientInfo.AccountPin
      : (process.env.ARAMEX_ACCOUNT_PIN || defaultAccountPin);

    const finalAccountEntity = userClientInfo.AccountEntity || process.env.ARAMEX_ACCOUNT_ENTITY || defaultAccountEntity;
    const finalAccountCountryCode = userClientInfo.AccountCountryCode || process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || defaultAccountCountryCode;
    const finalSource = userClientInfo.Source !== undefined
      ? Number(userClientInfo.Source)
      : (process.env.ARAMEX_SOURCE !== undefined ? Number(process.env.ARAMEX_SOURCE) : defaultSource);

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
    } else {
      return res.status(200).json({ 
        HasErrors: true, 
        Notifications: [{ Code: "ERR_ROUTING", Message: "Invalid Aramex service type" }] 
      });
    }

    try {
      aramexRes = await fetch(`${baseUrl}${path}`, {
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
        data = JSON.parse(textData);
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

const getNoonBaseUrl = (req: any) => {
  return req.headers["x-noon-base-url"] || req.query.baseUrl || (req.body && req.body.baseUrl) || "https://merchants.staging.noon.com";
};

const getNoonHeaders = (req: any) => {
  const clientApiKey = req.headers["x-noon-api-key"] || req.query.apiKey || (req.body && req.body.apiKey);
  const apiKey = clientApiKey && clientApiKey !== "noon_secret_key_123" ? clientApiKey : "";
  return {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
    "Api-Key": apiKey,
    "Authorization": `Bearer ${apiKey}`
  };
};

// --- GENERIC COURIER ENGINE API ENDPOINTS ---
app.post("/api/courier/test-connection", express.json(), async (req, res) => {
  try {
    const { courierId, credentials, environment } = req.body;
    if (!courierId || !credentials || !environment) {
      return res.status(400).json({ success: false, error: "Missing required parameters" });
    }
    const adapter = courierEngine.getAdapter(courierId);
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
    const adapter = courierEngine.getAdapter(courierId);
    const result = await adapter.calculateRate(payload, credentials, environment);
    return res.json(result);
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
});

app.post("/api/courier/shipment", express.json(), async (req, res) => {
  try {
    const { courierId, payload, credentials, environment } = req.body;
    const adapter = courierEngine.getAdapter(courierId);
    const result = await adapter.createShipment(payload, credentials, environment);
    return res.json(result);
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
});

app.post("/api/courier/track", express.json(), async (req, res) => {
  try {
    const { courierId, trackingId, credentials, environment } = req.body;
    const adapter = courierEngine.getAdapter(courierId);
    const result = await adapter.trackShipment(trackingId, credentials, environment);
    return res.json(result);
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
});

app.post("/api/courier/cancel", express.json(), async (req, res) => {
  try {
    const { courierId, trackingId, credentials, environment } = req.body;
    const adapter = courierEngine.getAdapter(courierId);
    const result = await adapter.cancelShipment(trackingId, credentials, environment);
    return res.json({ success: result });
  } catch (error: any) {
    return res.json({ success: false, error: error.message });
  }
});


// 1. GET Pickup Addresses / Pickup Points
app.get("/api/noon/pickup-addresses", async (req, res) => {
  try {
    const baseUrl = getNoonBaseUrl(req);
    console.log(`[Noon Proxy] Fetching pickup points from ${baseUrl}...`);
    const response = await fetch(`${baseUrl}/public/v1/pickup-points/list`, {
      method: "GET",
      headers: getNoonHeaders(req),
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("[Noon Proxy] Successfully fetched pickup points from Noon API.");
      return res.json(data);
    } else {
      console.error(`[Noon Proxy] Noon API returned ${response.status}.`);
      return res.status(response.status).json({ error: `Noon API returned ${response.status}` });
    }
  } catch (error: any) {
    console.error(`[Noon Proxy] Failed to connect to Noon: ${error.message}.`);
    return res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});

// 2. POST Create Delivery Task
app.post("/api/noon/create-task", async (req, res) => {
  const params = req.body;
  try {
    const baseUrl = getNoonBaseUrl(req);
    console.log(`[Noon Proxy] Sending create-task payload to ${baseUrl}...`, JSON.stringify(params));
    const response = await fetch(`${baseUrl}/public/v1/create-task`, {
      method: "POST",
      headers: getNoonHeaders(req),
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();
    console.log(`[Noon Proxy] Noon Staging API returned status ${response.status}:`, data);
    
    if (response.ok || data.status === "SUCCESS") {
      return res.status(response.status).json(data);
    } else {
      console.error(`[Noon Proxy] Noon API returned error structure.`);
      return res.status(response.status).json(data);
    }
  } catch (error: any) {
    console.error(`[Noon Proxy] Noon create-task connection failed: ${error.message}.`);
    return res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});

// 3. GET Task Details
app.get("/api/noon/tasks/:mp_task_nr", async (req, res) => {
  const { mp_task_nr } = req.params;
  try {
    const baseUrl = getNoonBaseUrl(req);
    console.log(`[Noon Proxy] Fetching task details for ${mp_task_nr} from ${baseUrl}...`);
    const response = await fetch(`${baseUrl}/public/v1/tasks/${mp_task_nr}`, {
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
    const response = await fetch(`${baseUrl}/public/v1/tasks/${mp_task_nr}/cancel`, {
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

async function startServer() {
  // Non-blocking firestore seed for courier integrations configuration
  try {
    dbAdmin.collection('settings').doc('courier_configs').get().then((docSnap) => {
      if (!docSnap.exists) {
        const initialConfigs = {
          aramex: {
            id: 'aramex',
            name: 'Aramex Express',
            status: 'Active',
            currentMode: 'sandbox',
            baseUrlUat: 'ws.aramex.net',
            baseUrlProd: 'ws.aramex.net',
            connectionStatus: 'UNTESTED',
            sandboxCreds: {
              username: "testingapi@aramex.com",
              password: "R123456789$r",
              accountNumber: "45796",
              accountPin: "116216",
              accountEntity: "DXB",
              accountCountryCode: "AE",
              source: "24",
              version: "v1"
            },
            productionCreds: {
              username: "",
              password: "",
              accountNumber: "",
              accountPin: "",
              accountEntity: "",
              accountCountryCode: "",
              source: "",
              version: ""
            }
          },
          noon: {
            id: 'noon',
            name: 'Noon Hyperlocal',
            status: 'Active',
            currentMode: 'sandbox',
            baseUrlUat: 'https://food-api-team.noonstg.team',
            baseUrlProd: 'https://food-api.noon.com',
            connectionStatus: 'UNTESTED',
            sandboxCreds: {
              apiKey: 'noon_secret_key_123',
              storeId: ''
            },
            productionCreds: {
              apiKey: '',
              storeId: ''
            }
          }
        };
        dbAdmin.collection('settings').doc('courier_configs').set(initialConfigs)
          .then(() => console.log("[Firestore Seed] Successfully initialized default courier configurations."))
          .catch((err: any) => console.error("[Firestore Seed] Failed to set default courier configs:", err.message));
      }
    }).catch((err: any) => {
      console.warn("[Firestore Seed] Failed to read settings/courier_configs:", err.message);
    });
  } catch (err: any) {
    console.error("[Firestore Seed] Failed to initialize check:", err.message);
  }

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
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
  startServer();
}

export { app };

