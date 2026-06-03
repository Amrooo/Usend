import "./env";
import express from "express";
import path from "path";


// Lazy-load firebase-admin on first DB use to avoid slow startup from disk
let _admin: any = null;
let _db: any = null;

async function getAdmin(): Promise<any> {
  if (!_admin) {
    const adminModule = await import('firebase-admin');
    _admin = adminModule.default || adminModule;
    if (!_admin.apps.length) {
      try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          _admin.initializeApp({ credential: _admin.credential.cert(serviceAccount) });
          console.log("Firebase Admin initialized with service account key.");
        } else if (process.env.NODE_ENV !== 'production') {
          const dummyCert = {
            type: 'service_account',
            project_id: 'gen-lang-client-0329298140',
            private_key: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAySE61MBcwz76FDzpIrErdcfXZZjYdJDQ0JBHLncIvpyXv9Xk\n/PMhjVIpFJHcLPnNzocSnkdmVX4I2m0gIxjSKvgpJ/XpR98QkitOIhFbnNLq4UdQ\nGv/EkbKpzn02hoDdQ2CrEI0ljCGtkaTZ+NDVjALQoMc3sH3ho9LdUCj8937zWHSF\nUW7vD7PBO4bi+KP+tSXkF98EHs13RbCXw+Wl9LSybTVhLR9q1TdBF4FvkhipnhyA\n9NuL7B6ebNp27uKkQ3dyyHI7xTh6DgzPAIpAQdnAuz9wNtOq2yu8NAN+ClkUERD+\nM5KZImlMd2I7EU7GcHHi2iHXhU471aaUD3fPuwIDAQABAoIBADWa+K4Zct/K2iYo\nsc5AQCANGjiGyzIOIsljmsUkjp0W6U8EuBo+xrN+sVo9IdyO265uy6SJzRl+FOf6\na7VO+TzglT+ESB+SsTzz88garjsW7+kI862ue3qFjsJtFuo0UEST8CPiKp61nygR\nMtMg/blqSqZ/UjVk542dNsUVl45yuyEPkBkzF2XwdsN6qRrWRHnJpZgC5GG/v3s6\nNb5bBi+RuYDbUuofygCRIC6VQ1qZciUGN7GjRZv4liVUIW69HuR1qyegWF69y5Pi\nWE/dOjmHXwTGLNj2ymhHLAaE+C+9l1V/DLT/7oSQ2BsNWmELjclxq5ljjCOZdeAV\ndIp2rWECgYEA9TR74rG8/AcOiYW2G/jvkfnsaEXM4H5dpemvZIJuMGm3zmQzwFSm\nE51G7bARCIU25/ufWt+FvqH7ioigLFM8nWdQI9c5RteYWYOX7NV5Z2bz4yUqz1x2\nBqjFvurR132i69X6wYIyg3xF9BB4imQVKTilReqCU/n/ByAQpGPB49ECgYEA0fwC\nHZBGJOiM4MU6R2FEBY0DAD6UC8lL4J3rDhvNt7i+8Bp25V8YediN5fwtrHqSZZJ6\nngvpZqYLEbG/ZxKAleklN9q7h2pvcvyZqu0IZ2AoeFMKTR66RyEB9NGzsw4/Ewlh\nzTAN4ozWDaRnURzCgW4JArj3y4xIVv8y8GPc2csCgYEA1/gZIasA1E523GO76VlR\n0RX6xkCsWhKS8z4nMHS9DsEelpelCULFYENHpLRN3F5Q5PS3/7ceOrC7N+JsiX3q\nxoynhlnbZe0gj78bAgtoOc3xA+DJmwhKIEVonmZ+2rka1XOLwAKn8S11A6m6MdJC\n3SK6VyFdFw/7MtBoOBJxRPECgYBvIFoSQTcN81AS5+2Wtv/jnCO5bmS09BvGzGwH\n9GjjUM8jjC3d53yxhwxZaSLWw6tUO7fOimlD3J3BCHtN1fnc3BzJOWXDHW3Lwail\nT3oCE153hyLNe3SDjhFV+eCK4wA4V9+9UjAW9AeYAqh2wayiCJSWL0NcImpqN/ZC\nR+cqDwKBgQDh34mJIO6VUZGVBbFZKB+wASE5OOlJih0sbVzkrUujmhon63OA16Oa\neJ9m8nW+su4nj+MpKnFUzqvfdT3jcAD1ucCcES05gofAj/2umyJbt06Rir0Ji8vk\nsyQlhGR8HkdMFWiN/9IilwZHU0GM1i4V4sfJFsmc7RIB8I69HAIvzw==\n-----END RSA PRIVATE KEY-----',
            client_email: 'dummy@gen-lang-client-0329298140.iam.gserviceaccount.com'
          };
          _admin.initializeApp({ credential: _admin.credential.cert(dummyCert) });
          console.log("Firebase Admin initialized with dummy credentials for local development.");
        } else {
          _admin.initializeApp();
          console.warn("Firebase Admin initialized with application default credentials.");
        }
      } catch (error) {
        console.error("Failed to initialize Firebase Admin:", error);
      }
    }
  }
  return _admin;
}

async function getDb(): Promise<any> {
  if (!_db) {
    const admin = await getAdmin();
    _db = admin.firestore();
  }
  return _db;
}


const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe Client lazily to avoid crashing on boot if key is missing
let stripeClient: any = null;
async function getStripe(): Promise<any> {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is required for payments");
    }
    const StripeModule = await import("stripe");
    const StripeClass = StripeModule.default || StripeModule;
    stripeClient = new StripeClass(key, { apiVersion: "2022-11-15" as any });
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
    const { amountAED, orderId, customerId, metadata, isTopUp, merchantId } = req.body;

    if (isTopUp) {
      if (!amountAED || !merchantId) {
        return res.status(400).json({ error: "Missing merchantId or amount for top-up" });
      }

      const amount = Math.round(amountAED * 100);
      const stripe = await getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "aed",
        metadata: {
          ...metadata,
          type: "wallet_topup",
          merchantId,
          amountAED: amountAED.toString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return res.json({ clientSecret: paymentIntent.client_secret });
    }

    // SECURITY GAP FIX: In a real environment, you MUST fetch the 'orderId' from your Firebase Database 
    // to determine the genuine expected `amountAED` to prevent client-side manipulation.
    if (!orderId || !amountAED) {
      return res.status(400).json({ error: "Missing orderId or amount" });
    }

    let validAmountAED = amountAED;

    if (orderId) {
      try {
        const dbAdmin = await getDb();
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

    const stripe = await getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "aed",
      metadata: { ...metadata, orderId, customerId },
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
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const stripe = await getStripe();
    if (!endpointSecret) {
      throw new Error("Webhook secret not configured");
    }
    event = stripe.webhooks.constructEvent(request.body, sig as string, endpointSecret);
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn("Stripe webhook signature verification failed or secret missing. Bypassing check in local development mode.");
      try {
        event = JSON.parse(request.body.toString());
      } catch (parseErr: any) {
        return response.status(400).send(`Webhook Error parsing raw body: ${parseErr.message}`);
      }
    } else {
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      
      // Check if it is a wallet top-up transaction
      if (paymentIntentSucceeded.metadata?.type === 'wallet_topup') {
        const merchantId = paymentIntentSucceeded.metadata.merchantId;
        const amountAED = parseFloat(paymentIntentSucceeded.metadata.amountAED || '0');
        
        if (merchantId && amountAED > 0) {
          console.log(`Top-up confirmed for Merchant: ${merchantId}, Amount: ${amountAED}`);
          
          getDb().then((dbAdmin) => {
            getAdmin().then((admin) => {
              const userRef = dbAdmin.collection('users').doc(merchantId);
              dbAdmin.runTransaction(async (transaction: any) => {
                const userDoc = await transaction.get(userRef);
                let currentBalance = 1485.00; // default initial balance
                if (userDoc.exists) {
                  currentBalance = userDoc.data()?.walletBalance !== undefined ? userDoc.data()?.walletBalance : 1485.00;
                }
                const newBalance = currentBalance + amountAED;
                transaction.set(userRef, { walletBalance: newBalance }, { merge: true });
                
                // Also append a transaction record
                const txnRef = dbAdmin.collection('users').doc(merchantId).collection('transactions').doc();
                transaction.set(txnRef, {
                  id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                  date: new Date().toLocaleString(),
                  type: 'Funds Added',
                  amount: amountAED,
                  method: 'Stripe Gateway',
                  status: 'Completed',
                  ref: `Stripe-${paymentIntentSucceeded.id ? paymentIntentSucceeded.id.slice(-6) : 'AUTO'}`,
                  timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
              })
              .then(() => console.log(`Successfully credited merchant ${merchantId} with ${amountAED} AED.`))
              .catch((err: any) => console.error("Failed to execute top-up transaction:", err));
            });
          });
        }
      } else if (paymentIntentSucceeded.metadata?.orderId) {
        console.log(`Payment confirmed for Order: ${paymentIntentSucceeded.metadata.orderId}`);
        // Securely update the payment status avoiding client tampering
        getDb().then((dbAdmin) => {
          getAdmin().then((admin) => {
            dbAdmin.collection('requests').doc(paymentIntentSucceeded.metadata.orderId).update({
              paymentStatus: 'paid',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }).catch((err: any) => console.error("Failed to update order payment status:", err));
          });
        });
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
     getDb().then((dbAdmin) => {
       getAdmin().then((admin) => {
         dbAdmin.collection('requests').doc(data.WaybillNumber).collection('tracking_history').add({
             updateCode: data.UpdateCode,
             updateDescription: data.UpdateDescription,
             location: data.UpdateLocation || 'Hub',
             timestamp: admin.firestore.FieldValue.serverTimestamp(),
             rawPayload: data
         }).catch((err: any) => console.error("Failed to append tracking history:", err));

         // Also update the main shipment status
         dbAdmin.collection('requests').doc(data.WaybillNumber).update({
             status: data.UpdateDescription,
             updatedAt: admin.firestore.FieldValue.serverTimestamp()
         }).catch((err: any) => console.error("Failed to update tracking status:", err));
       });
     });
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

    let aramexServicePath = "";
    if (serviceType === "rate") {
      aramexServicePath =
        "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate";
    } else if (serviceType === "shipping") {
      aramexServicePath = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments";
    } else if (serviceType === "tracking") {
      aramexServicePath = "/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments";
    } else if (serviceType === "pickup") {
      aramexServicePath = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreatePickup";
    } else {
      return res.status(200).json({ 
        HasErrors: true, 
        Notifications: [{ Code: "ERR_ROUTING", Message: "Invalid Aramex service type" }] 
      });
    }

    let aramexRes;
    try {
      aramexRes = await fetch(`${baseUrl}${aramexServicePath}`, {
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

// Initialize the Google GenAI SDK lazily
const apiKey = process.env.GEMINI_API_KEY;
let _ai: any = null;
async function getAI(): Promise<any> {
  if (!_ai) {
    const { GoogleGenAI } = await import('@google/genai');
    _ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return _ai;
}

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
    const { Type } = await import('@google/genai');
    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
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
    const { createServer: createViteServer } = await import('vite');
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

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
