import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

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

// Ensure JSON parsing with generous limits for base64 photo payloads
app.use(express.json({ limit: "15mb" }));

// --- PAYMENT API ENDPOINTS (Stripe) ---
app.post("/api/payments/create-intent", async (req, res) => {
  try {
    const { amountAED, customerId, metadata } = req.body;
    
    // Amount in Stripe must be in small units, so for AED we multiply by 100 (fils)
    const amount = Math.round(amountAED * 100);
    
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "aed",
      metadata: metadata,
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

// ARAMEX API PROXY
app.post("/api/aramex/:serviceType", async (req, res) => {
  try {
    const { serviceType } = req.params;
    let payload = req.body;
    
    // Auto-inject secure ClientInfo credentials from environment variables
    payload = {
      ...payload,
      ClientInfo: {
        UserName: process.env.ARAMEX_USERNAME || "testingapi@aramex.com",
        Password: process.env.ARAMEX_PASSWORD || "R123456789$r",
        Version: process.env.ARAMEX_VERSION || "v1",
        AccountNumber: process.env.ARAMEX_ACCOUNT_NUMBER || "45796",
        AccountPin: process.env.ARAMEX_ACCOUNT_PIN || "116216",
        AccountEntity: process.env.ARAMEX_ACCOUNT_ENTITY || "DXB",
        AccountCountryCode: process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || "AE",
        Source: process.env.ARAMEX_SOURCE || "24"
      }
    };
    
    // Use Sandbox URL for testing
    const baseUrl = "https://ws.sbx.aramex.net";
    
    let path = "";
    if (serviceType === "rate") {
      path = "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate";
    } else if (serviceType === "shipping") {
      path = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments";
    } else if (serviceType === "tracking") {
      path = "/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments";
    } else {
      return res.status(400).json({ error: "Invalid Aramex service type" });
    }

    const aramexRes = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const textData = await aramexRes.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch (e) {
      console.error("Aramex Non-JSON Error:", textData);
      // Return a status indicating a problem, pass the raw text for info if needed.
      return res.status(aramexRes.status !== 200 ? aramexRes.status : 500).json({ error: "Aramex API returned non-JSON response", details: textData });
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
      return res.status(400).json({ error: "Missing itemName or photoBase64 parameter." });
    }

    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY environment variable is not configured. Please set it in Settings > Secrets." 
      });
    }

    // Build parts for the Gemini contents body
    const parts: any[] = [];

    // Add base64 photo if provided
    if (photoBase64) {
      // Stripping data scheme prefix if present (e.g., "data:image/png;base64,")
      const matches = photoBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
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
    let promptText = "You are an AI cargo logistics and delivery dispatch dispatcher. Your goal is to analyze the user's item details and return highly precise shipping data.\n";
    if (itemName) {
      promptText += `User written item name/details: "${itemName}"\n`;
    }
    if (photoBase64) {
      promptText += "Analyze the uploaded photograph of the item to recognize physical attributes, packaging type, and details.\n";
    }
    promptText += "Please estimate dimensions (length, width, height in cm) and weight based on the type of cargo item detected. Determine 'quantity' (how many items you clearly see or are described), categorize the item, assign a reasonable insurance valuation in AED, and write an helpful dispatch note.";

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
              description: "The formatted, cleaned, clean-cut name of the item. E.g. 'Sony PlayStation 5' or 'Real Estate Title Deeds'.",
            },
            category: {
              type: Type.STRING,
              description: "Must be exactly one of: 'documents', 'electronics', 'food', 'clothing', 'other'.",
            },
            estimatedWeightKg: {
              type: Type.NUMBER,
              description: "The approximate weight of the shipment in kilograms (kg). Prefer 0.2 for documents/light sheets.",
            },
            quantity: {
              type: Type.INTEGER,
              description: "Quantity of items detected or mentioned (how many items). E.g. 1, 2, 5. Default to 1 if not explicitly visible.",
            },
            lengthCm: {
              type: Type.NUMBER,
              description: "Estimated typical cardboard box or product package length in cm.",
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
              description: "Estimated retail value / customs / transit insurance declaration in AED.",
            },
            notes: {
              type: Type.STRING,
              description: "A summary of item's nature, state or shape, package density warning, or custom handling instructions.",
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
      return res.status(500).json({ error: "Failed to generate response text from Gemini." });
    }

    // Try to parse clean structured JSON to return
    const parsedData = JSON.parse(resultText.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error("AI recognizes item error:", error);
    return res.status(500).json({ 
      error: error.message || "An error occurred while recognizing the item physical profile." 
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
