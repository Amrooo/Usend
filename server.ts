import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import Stripe from "stripe";
import dotenv from "dotenv";
import admin from 'firebase-admin';

dotenv.config();

// Initialize Firebase Admin for secure backend operations
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized with service account key.");
    } else {
      admin.initializeApp();
      console.warn("Firebase Admin initialized with application default credentials. This may fail if not deployed correctly.");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}
const dbAdmin = admin.firestore();

const app = express();
const PORT = 3000;

// Initialize Stripe Client lazily to avoid crashing on boot if key is missing
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is required for payments");
    }
    stripeClient = new Stripe(key, { apiVersion: "2026-04-22.dahlia" as any });
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
app.post("/api/payments/create-intent", async (req, res) => {
  try {
    const { amountAED, orderId, customerId, metadata } = req.body;

    // SECURITY GAP FIX: In a real environment, you MUST fetch the 'orderId' from your Firebase Database 
    // to determine the genuine expected `amountAED` to prevent client-side manipulation.
    if (!orderId || !amountAED) {
      return res.status(400).json({ error: "Missing orderId or amount" });
    }

    let validAmountAED = amountAED;

    if (orderId) {
      try {
        const orderSnap = await dbAdmin.collection('requests').doc(orderId).get();
        if (orderSnap.exists) {
          const expectedAmount = orderSnap.data()?.totalAmountAED;
          if (expectedAmount && expectedAmount !== amountAED) {
             console.warn(`Amount mismatch for order ${orderId}: expected ${expectedAmount}, got ${amountAED}`);
             validAmountAED = expectedAmount;
          }
        }
      } catch (err) {
        console.error("DB check failed:", err);
      }
    }

    // Amount in Stripe must be in small units, so for AED we multiply by 100 (fils)
    const amount = Math.round(validAmountAED * 100);

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "aed",
      metadata: { ...metadata, orderId, customerId },
      // For testing, automatic_payment_methods helps simulation
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error("Stripe Error:", error);
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
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
         timestamp: admin.firestore.FieldValue.serverTimestamp(),
         rawPayload: data
     }).catch(err => console.error("Failed to append tracking history:", err));

     // Also update the main shipment status
     dbAdmin.collection('requests').doc(data.WaybillNumber).update({
         status: data.UpdateDescription,
         updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
        Version: process.env.ARAMEX_VERSION || "v1",
        AccountNumber: process.env.ARAMEX_ACCOUNT_NUMBER || "45796",
        AccountPin: process.env.ARAMEX_ACCOUNT_PIN || "116216",
        AccountEntity: process.env.ARAMEX_ACCOUNT_ENTITY || "DXB",
        AccountCountryCode: process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || "AE",
        Source: process.env.ARAMEX_SOURCE || "24",
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
  });
}

startServer();
