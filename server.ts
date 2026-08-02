import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import Stripe from "stripe";
import dotenv from "dotenv";
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";

dotenv.config();

// Read firebase-applet-config.json for target project and database info
let firebaseConfig: { projectId?: string; firestoreDatabaseId?: string } = {};
try {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
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

// ARAMEX API PROXY
app.post("/api/aramex/:serviceType", async (req, res) => {
  try {
    const { serviceType } = req.params;
    let payload = req.body;

    let aramexUser = process.env.ARAMEX_USERNAME;
    
    payload = {
      ...payload,
      ClientInfo: {
        UserName: aramexUser ? aramexUser.replace(/,$/, '') : "testingapi@aramex.com",
        Password: process.env.ARAMEX_PASSWORD || "R123456789$r",
        Version: process.env.ARAMEX_VERSION || "v1.0",
        AccountNumber: process.env.ARAMEX_ACCOUNT_NUMBER || "45796",
        AccountPin: process.env.ARAMEX_ACCOUNT_PIN || "116216",
        AccountEntity: process.env.ARAMEX_ACCOUNT_ENTITY || "DXB",
        AccountCountryCode: process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || "AE",
        Source: process.env.ARAMEX_SOURCE !== undefined ? Number(process.env.ARAMEX_SOURCE) : 0,
        PreferredLanguageCode: process.env.ARAMEX_PREFERRED_LANGUAGE || null
      },
    };

    const baseUrl = process.env.ARAMEX_BASE_URL || "https://ws.dev.aramex.net";

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

    let aramexRes;
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
    } catch (fetchError: any) {
      console.error("Aramex fetch failed:", fetchError.message);
      return res.status(200).json({
        HasErrors: true,
        Notifications: [
          { Code: "ERR_NETWORK", Message: `Could not connect to Aramex API (${baseUrl}). The environment might be restricted or offline. Details: ${fetchError.message}` }
        ]
      });
    }

    const textData = await aramexRes.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch (e) {
      console.error("Aramex Non-JSON Error:", textData);
      // Return 200 with formatted error so proxy does not replace it with HTML
      return res.status(200).json({
        HasErrors: true,
        Notifications: [
          { Code: `HTTP_${aramexRes.status}`, Message: `Aramex API returned non-JSON. Status: ${aramexRes.status}. Details: ${textData.substring(0, 150)}` }
        ]
      });
    }

    return res.json(data);
  } catch (error: any) {
    console.error("Aramex Error:", error);
    return res.status(500).json({ error: error.message });
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

startServer();
