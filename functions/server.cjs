var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_stripe = __toESM(require("stripe"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var import_firestore = require("firebase-admin/firestore");
var import_fs = __toESM(require("fs"), 1);

// src/backend/adapters/AramexAdapter.ts
var AramexAdapter = class {
  constructor() {
    this.id = "aramex";
    this.name = "Aramex";
    this.capabilities = ["RATE", "SHIPMENT", "TRACKING", "LABEL"];
  }
  getBaseUrl(env) {
    return "https://ws.aramex.net";
  }
  async validateCredentials(credentials, environment) {
    const baseUrl = this.getBaseUrl(environment);
    const path2 = "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate";
    const payload = {
      ClientInfo: {
        UserName: credentials.username,
        Password: credentials.password || "",
        Version: credentials.version || "v1.0",
        AccountNumber: credentials.accountNumber,
        AccountPin: credentials.accountPin,
        AccountEntity: credentials.accountEntity,
        AccountCountryCode: credentials.accountCountryCode,
        Source: parseInt(credentials.source || "0", 10) || 0
      },
      Transaction: {
        Reference1: "Connection Verification",
        Reference2: "",
        Reference3: "",
        Reference4: "",
        Reference5: ""
      },
      OriginAddress: { City: "Dubai", CountryCode: "AE" },
      DestinationAddress: { City: "Abu Dhabi", CountryCode: "AE" },
      ShipmentDetails: {
        PaymentType: "P",
        ProductGroup: "DOM",
        ProductType: "OND",
        ActualWeight: { Value: 1, Unit: "KG" },
        ChargeableWeight: { Value: 1, Unit: "KG" },
        NumberOfPieces: 1
      }
    };
    try {
      const response = await fetch(`${baseUrl}${path2}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15e3)
      });
      if (!response.ok) {
        return { success: false, error: `Aramex returned status code ${response.status}` };
      }
      const data2 = await response.json();
      if (data2.HasErrors) {
        return { success: false, error: data2.Notifications?.[0]?.Message || `Aramex API credentials validation failed. Raw response: ${JSON.stringify(data2)}` };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || "Network error while connecting to Aramex" };
    }
  }
  async calculateRate(payload, credentials, environment) {
    const baseUrl = this.getBaseUrl(environment);
    const path2 = "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate";
    const aramexPayload = {
      ClientInfo: {
        UserName: credentials.username,
        Password: credentials.password,
        Version: credentials.version || "v1.0",
        AccountNumber: credentials.accountNumber,
        AccountPin: credentials.accountPin,
        AccountEntity: credentials.accountEntity,
        AccountCountryCode: credentials.accountCountryCode,
        Source: parseInt(credentials.source || "0", 10) || 0
      },
      Transaction: {
        Reference1: "Rate Calculation",
        Reference2: "",
        Reference3: "",
        Reference4: "",
        Reference5: ""
      },
      OriginAddress: {
        City: payload.originCity,
        CountryCode: payload.originCountry
      },
      DestinationAddress: {
        City: payload.destCity,
        CountryCode: payload.destCountry
      },
      ShipmentDetails: {
        PaymentType: payload.codAmount ? "C" : "P",
        // C = COD, P = Prepaid
        ProductGroup: payload.originCountry === payload.destCountry ? "DOM" : "EXP",
        ProductType: payload.isExpress ? "PPX" : "OND",
        ActualWeight: { Value: payload.weightKg, Unit: "KG" },
        ChargeableWeight: { Value: payload.weightKg, Unit: "KG" },
        NumberOfPieces: 1,
        Services: payload.codAmount ? "CODS" : ""
      }
    };
    try {
      const response = await fetch(`${baseUrl}${path2}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aramexPayload)
      });
      const data2 = await response.json();
      if (data2.HasErrors) {
        return { success: false, error: data2.Notifications?.[0]?.Message || `Unknown Error. Raw response: ${JSON.stringify(data2)}` };
      }
      return {
        success: true,
        totalAmount: data2.TotalAmount?.Value,
        currency: data2.TotalAmount?.CurrencyCode,
        serviceName: payload.isExpress ? "Aramex Priority Express" : "Aramex Value Parcel"
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  async createShipment(payload, credentials, environment) {
    const baseUrl = this.getBaseUrl(environment);
    const path2 = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments";
    const isDomestic = payload.senderCountry === payload.receiverCountry;
    const aramexPayload = {
      ClientInfo: {
        UserName: credentials.username,
        Password: credentials.password,
        Version: credentials.version || "v1.0",
        AccountNumber: credentials.accountNumber,
        AccountPin: credentials.accountPin,
        AccountEntity: credentials.accountEntity,
        AccountCountryCode: credentials.accountCountryCode,
        Source: parseInt(credentials.source || "0", 10) || 0
      },
      Transaction: {
        Reference1: payload.reference || "USend Shipment",
        Reference2: "",
        Reference3: "",
        Reference4: "",
        Reference5: ""
      },
      Shipments: [
        {
          Reference1: payload.reference || "",
          Reference2: "",
          Reference3: "",
          Shipper: {
            Reference1: "USend Central Depot",
            Reference2: "",
            AccountNumber: credentials.accountNumber,
            PartyAddress: {
              Line1: payload.senderAddress,
              Line2: "",
              Line3: "",
              City: payload.senderCity,
              CountryCode: payload.senderCountry
            },
            Contact: {
              PersonName: payload.senderName,
              CompanyName: "USend Hub",
              PhoneNumber1: payload.senderPhone,
              EmailAddress: "dispatch@usend.ae"
            }
          },
          Consignee: {
            Reference1: "",
            Reference2: "",
            AccountNumber: "",
            PartyAddress: {
              Line1: payload.receiverAddress,
              Line2: "",
              Line3: "",
              City: payload.receiverCity,
              CountryCode: payload.receiverCountry
            },
            Contact: {
              PersonName: payload.receiverName,
              CompanyName: payload.receiverName,
              PhoneNumber1: payload.receiverPhone,
              EmailAddress: ""
            }
          },
          ThirdParty: null,
          Reference4: "",
          Reference5: "",
          ShippingDateTime: `/Date(${(/* @__PURE__ */ new Date()).getTime()})/`,
          DueDate: `/Date(${new Date((/* @__PURE__ */ new Date()).getTime() + 864e5).getTime()})/`,
          Comments: "USend Aggregation Dispatch",
          PickupLocation: "Reception",
          OperationsInstructions: "Handle with care",
          AccountingInstrcutions: "",
          Details: {
            Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
            ActualWeight: { Value: payload.weightKg, Unit: "KG" },
            ChargeableWeight: { Value: payload.weightKg, Unit: "KG" },
            DescriptionOfGoods: payload.goodsDescription,
            GoodsOriginCountry: payload.senderCountry,
            NumberOfPieces: 1,
            ProductGroup: isDomestic ? "DOM" : "EXP",
            ProductType: "OND",
            PaymentType: payload.codAmountAED > 0 ? "C" : "P",
            PaymentOptions: "",
            Services: payload.codAmountAED > 0 ? "CODS" : "",
            CashOnDeliveryAmount: payload.codAmountAED > 0 ? {
              Value: payload.codAmountAED,
              CurrencyCode: "AED"
            } : null,
            CustomsValueAmount: null
          }
        }
      ],
      LabelInfo: {
        ReportID: 9729,
        ReportType: "URL"
      }
    };
    try {
      const response = await fetch(`${baseUrl}${path2}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aramexPayload)
      });
      const data2 = await response.json();
      if (data2.HasErrors) {
        return { success: false, error: data2.Notifications?.[0]?.Message || `Unknown Error. Raw response: ${JSON.stringify(data2)}` };
      }
      const shipment = data2.Shipments?.[0];
      if (!shipment) {
        return { success: false, error: "No shipment data returned" };
      }
      return {
        success: true,
        trackingNumber: shipment.ID,
        labelUrl: shipment.ShipmentLabel?.LabelURL,
        base64Label: shipment.ShipmentLabel?.LabelFileContents,
        providerStatus: "Generated"
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  async trackShipment(trackingId, credentials, environment) {
    const baseUrl = this.getBaseUrl(environment);
    const path2 = "/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments";
    const payload = {
      ClientInfo: {
        UserName: credentials.username,
        Password: credentials.password,
        Version: credentials.version || "v1.0",
        AccountNumber: credentials.accountNumber,
        AccountPin: credentials.accountPin,
        AccountEntity: credentials.accountEntity,
        AccountCountryCode: credentials.accountCountryCode,
        Source: parseInt(credentials.source || "0", 10) || 0
      },
      Transaction: { Reference1: "", Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
      Shipments: [trackingId]
    };
    try {
      const response = await fetch(`${baseUrl}${path2}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data2 = await response.json();
      if (data2.HasErrors) {
        return { success: false, providerStatus: "Error", usendStatus: "FAILED", timestamp: (/* @__PURE__ */ new Date()).toISOString(), error: data2.Notifications?.[0]?.Message || `Tracking Error. Raw response: ${JSON.stringify(data2)}` };
      }
      const results = data2.TrackingResults;
      if (!results || results.length === 0) {
        return { success: false, providerStatus: "No Data", usendStatus: "PENDING", timestamp: (/* @__PURE__ */ new Date()).toISOString(), error: "No tracking data found" };
      }
      const updates = results[0].Value;
      if (!updates || updates.length === 0) {
        return { success: true, providerStatus: "No Updates", usendStatus: "PENDING", timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      }
      const latest = updates[updates.length - 1];
      const newest = updates[0];
      return {
        success: true,
        providerStatus: newest.UpdateDescription,
        usendStatus: this.mapStatus(newest.UpdateCode),
        location: newest.UpdateLocation,
        timestamp: newest.UpdateDateTime
      };
    } catch (e) {
      return { success: false, providerStatus: "Error", usendStatus: "FAILED", timestamp: (/* @__PURE__ */ new Date()).toISOString(), error: e.message };
    }
  }
  async cancelShipment(trackingId, credentials, environment) {
    return false;
  }
  mapStatus(aramexCode) {
    const code = aramexCode.toUpperCase();
    if (["SH005", "SH006", "SH007", "SH014", "SH164"].includes(code)) return "DELIVERED";
    if (["SH012", "SH069", "SH234"].includes(code)) return "IN_TRANSIT";
    if (["SH047", "SH048", "SH049"].includes(code)) return "FAILED";
    return "PENDING";
  }
};

// src/backend/adapters/NoonAdapter.ts
var NoonAdapter = class {
  constructor() {
    this.id = "noon";
    this.name = "Noon";
    this.capabilities = ["SHIPMENT", "TRACKING", "CANCEL"];
  }
  getBaseUrl(env) {
    return env === "production" ? "https://merchants.noon.com" : "https://food-api-team.noonstg.team";
  }
  async validateCredentials(credentials, environment) {
    const baseUrl = this.getBaseUrl(environment);
    try {
      const apiKey2 = credentials.apiKey || credentials.password || "";
      if (!apiKey2) {
        return { success: false, error: "Missing API key parameter" };
      }
      const response = await fetch(`${baseUrl}/public/v1/pickup-points/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey2,
          "Api-Key": apiKey2,
          "Authorization": `Bearer ${apiKey2}`
        },
        signal: AbortSignal.timeout(1e4)
      });
      const responseText = await response.text();
      if (responseText.includes("FortiGuard") || responseText.includes("Web Filter") || responseText.includes("Access Blocked")) {
        return { success: false, error: "Access blocked by FortiGuard Corporate Firewall/Web Filter. The Noon Staging domain is restricted on this network." };
      }
      if (!response.ok) {
        let errorMsg = `Noon returned status code ${response.status}`;
        try {
          const errData = JSON.parse(responseText);
          if (errData.message) errorMsg = errData.message;
        } catch (e) {
        }
        return { success: false, error: errorMsg };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || "Network error while connecting to Noon" };
    }
  }
  async calculateRate(payload, credentials, environment) {
    return {
      success: true,
      totalAmount: payload.isExpress ? 25 : 15,
      currency: "AED",
      serviceName: "Noon Hyperlocal"
    };
  }
  async createShipment(payload, credentials, environment) {
    const baseUrl = this.getBaseUrl(environment);
    const codInFils = Math.round((payload.codAmountAED || 0) * 100);
    const noonPayload = {
      outlet_code: credentials.accountNumber || "DEFAULT_OUTLET",
      // Often provided as accountNumber
      order_reference: payload.reference || `USEND-${Date.now()}`,
      customer_name: payload.receiverName,
      customer_phone: payload.receiverPhone,
      drop_off_address: {
        address: payload.receiverAddress,
        lat: 25.2048,
        // In a real scenario we'd use actual geocoded lat/lng
        lng: 55.2708,
        contact_name: payload.receiverName,
        contact_phone_number: payload.receiverPhone,
        country_code: payload.receiverCountry || "AE"
      },
      lat: 25.2048,
      lng: 55.2708,
      cod_value: codInFils,
      payment_method: codInFils > 0 ? "COD" : "PAID"
    };
    try {
      const response = await fetch(`${baseUrl}/public/v1/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": credentials.apiKey || credentials.password || "",
          "Api-Key": credentials.apiKey || credentials.password || "",
          "Authorization": `Bearer ${credentials.apiKey || credentials.password}`
        },
        body: JSON.stringify(noonPayload)
      });
      const data2 = await response.json();
      if (!response.ok || data2.status === "ERROR" || !data2.mp_task_nr) {
        return { success: false, error: data2.message || `Failed to create Noon Task. Raw response: ${JSON.stringify(data2)}` };
      }
      return {
        success: true,
        trackingNumber: data2.mp_task_nr,
        providerStatus: data2.status || "CREATED"
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  async trackShipment(trackingId, credentials, environment) {
    const baseUrl = this.getBaseUrl(environment);
    try {
      const response = await fetch(`${baseUrl}/public/v1/task/${trackingId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": credentials.apiKey || credentials.password || "",
          "Api-Key": credentials.apiKey || credentials.password || "",
          "Authorization": `Bearer ${credentials.apiKey || credentials.password}`
        }
      });
      const data2 = await response.json();
      if (!response.ok || data2.status === "ERROR") {
        return { success: false, providerStatus: "Error", usendStatus: "FAILED", timestamp: (/* @__PURE__ */ new Date()).toISOString(), error: data2.message || "Tracking Error" };
      }
      return {
        success: true,
        providerStatus: data2.status,
        usendStatus: this.mapStatus(data2.status),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (e) {
      return { success: false, providerStatus: "Error", usendStatus: "FAILED", timestamp: (/* @__PURE__ */ new Date()).toISOString(), error: e.message };
    }
  }
  async cancelShipment(trackingId, credentials, environment) {
    const baseUrl = this.getBaseUrl(environment);
    try {
      const response = await fetch(`${baseUrl}/public/v1/task/${trackingId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": credentials.apiKey || credentials.password || "",
          "Api-Key": credentials.apiKey || credentials.password || "",
          "Authorization": `Bearer ${credentials.apiKey || credentials.password}`
        },
        body: JSON.stringify({ reason: "USend Automated Cancellation" })
      });
      const data2 = await response.json();
      return response.ok && data2.status === "SUCCESS";
    } catch (e) {
      return false;
    }
  }
  mapStatus(noonStatus) {
    const status = (noonStatus || "").toUpperCase();
    if (["DELIVERED", "COMPLETED", "SUCCESS"].includes(status)) return "DELIVERED";
    if (["CANCELLED", "REJECTED", "FAILED"].includes(status)) return "FAILED";
    if (["CREATED", "ASSIGNED", "DISPATCHED", "IN_PROGRESS"].includes(status)) return "IN_TRANSIT";
    return "PENDING";
  }
};

// src/backend/adapters/CourierEngine.ts
var CourierEngine = class {
  constructor() {
    this.adapters = /* @__PURE__ */ new Map();
    this.registerAdapter(new AramexAdapter());
    this.registerAdapter(new NoonAdapter());
  }
  registerAdapter(adapter) {
    this.adapters.set(adapter.id, adapter);
  }
  getAdapter(id) {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new Error(`Courier adapter for '${id}' not found`);
    }
    return adapter;
  }
};
var courierEngine = new CourierEngine();

// server.ts
import_dotenv.default.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
if (process.env.NODE_ENV !== "production" && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  process.env.GCE_METADATA_HOST = "127.0.0.1";
  process.env.GCE_METADATA_CHECK_DISABLE = "true";
  process.env.NO_GCE_CHECK = "true";
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  console.log("Local development environment detected: Bypassing Firebase Metadata Server & setting Firestore Emulator Host to prevent hangs.");
}
var firebaseConfig = {};
try {
  const configPath = import_path.default.resolve(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(configPath)) {
    firebaseConfig = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
  }
} catch (e) {
  console.error("Failed to read firebase-applet-config.json:", e);
}
if (firebaseConfig.projectId) {
  process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
}
if (!import_firebase_admin.default.apps.length) {
  try {
    const options = {
      projectId: firebaseConfig.projectId
    };
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      options.credential = import_firebase_admin.default.credential.cert(serviceAccount);
      console.log("Firebase Admin: Initializing with provided service account key.");
    } else {
      console.warn("Firebase Admin: No service account key found, using default credentials.");
    }
    import_firebase_admin.default.initializeApp(options);
  } catch (error) {
    console.error("Firebase Admin: Initialization failed:", error);
  }
}
var appInstance = import_firebase_admin.default.app();
var dbAdmin = firebaseConfig.firestoreDatabaseId ? (0, import_firestore.getFirestore)(appInstance, firebaseConfig.firestoreDatabaseId) : (0, import_firestore.getFirestore)(appInstance);
var app = (0, import_express.default)();
var PORT = 3e3;
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    project: firebaseConfig.projectId || "unknown",
    database: firebaseConfig.firestoreDatabaseId || "default"
  });
});
var stripeClient = null;
function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is required for payments");
    }
    stripeClient = new import_stripe.default(key, { apiVersion: "2023-10-16" });
  }
  return stripeClient;
}
app.use((req, res, next) => {
  if (req.originalUrl === "/api/webhooks/stripe") {
    next();
  } else {
    import_express.default.json({ limit: "15mb" })(req, res, next);
  }
});
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
  } catch (error) {
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
        const orderSnap = await dbAdmin.collection("requests").doc(orderId).get();
        if (orderSnap.exists) {
          const data2 = orderSnap.data();
          const dbAmountStr = data2?.orderAmount || "";
          const dbAmount = parseFloat(dbAmountStr.replace(/[^0-9.]/g, ""));
          if (!isNaN(dbAmount) && Math.abs(dbAmount - amountAED) > 0.01) {
            console.warn(`Amount mismatch for order ${orderId}: expected ${dbAmount}, got ${amountAED}`);
            validAmountAED = dbAmount;
          }
        }
      } catch (err) {
        console.error("DB check failed (non-blocking for intent creation):", err);
      }
    }
    const amount = Math.round(validAmountAED * 100);
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "aed",
      metadata: { ...metadata, orderId: orderId || "topup", isTopup: topup ? "true" : "false", customerId },
      automatic_payment_methods: {
        enabled: true
      }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe Intent Error:", error);
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/webhooks/stripe", import_express.default.raw({ type: "application/json" }), (request, response) => {
  const sig = request.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    return response.status(400).send(`Webhook Error: Stripe Webhook Secret not configured`);
  }
  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntentSucceeded = event.data.object;
      console.log(`Payment confirmed for Order: ${paymentIntentSucceeded.metadata.orderId}`);
      if (paymentIntentSucceeded.metadata.orderId) {
        dbAdmin.collection("requests").doc(paymentIntentSucceeded.metadata.orderId).update({
          paymentStatus: "paid",
          updatedAt: import_firestore.FieldValue.serverTimestamp()
        }).catch((err) => console.error("Failed to update order payment status:", err));
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  response.send();
});
var clients = [];
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
function broadcastEvent(event) {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(event)}

`);
  });
}
app.post("/api/webhooks/aramex", import_express.default.json(), async (req, res) => {
  console.log("Webhook Received:", req.body);
  const data2 = req.body;
  if (data2?.UpdateCode && data2?.WaybillNumber) {
    broadcastEvent({
      type: "WEBHOOK_UPDATE",
      trackingNumber: data2.WaybillNumber,
      updateCode: data2.UpdateCode,
      updateDescription: data2.UpdateDescription,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      location: data2.UpdateLocation || "Hub"
    });
    dbAdmin.collection("requests").doc(data2.WaybillNumber).collection("tracking_history").add({
      updateCode: data2.UpdateCode,
      updateDescription: data2.UpdateDescription,
      location: data2.UpdateLocation || "Hub",
      timestamp: import_firestore.FieldValue.serverTimestamp(),
      rawPayload: data2
    }).catch((err) => console.error("Failed to append tracking history:", err));
    dbAdmin.collection("requests").doc(data2.WaybillNumber).update({
      status: data2.UpdateDescription,
      updatedAt: import_firestore.FieldValue.serverTimestamp()
    }).catch((err) => console.error("Failed to update tracking status:", err));
  }
  res.status(200).json({ status: "acknowledged" });
});
app.post("/api/webhooks/noon", import_express.default.json(), async (req, res) => {
  console.log("Noon Webhook Received:", req.body);
  const data2 = req.body;
  if (data2?.order_reference || data2?.task_nr) {
    const trackingRef = data2.order_reference || data2.task_nr;
    const statusDesc = data2.status_description || data2.status_code || "Updated";
    broadcastEvent({
      type: "WEBHOOK_UPDATE",
      trackingNumber: trackingRef,
      updateCode: data2.status_code,
      updateDescription: statusDesc,
      timestamp: data2.event_time || (/* @__PURE__ */ new Date()).toISOString(),
      location: data2.location || "Noon Hub"
    });
    dbAdmin.collection("requests").doc(trackingRef).collection("tracking_history").add({
      updateCode: data2.status_code || "UPDATE",
      updateDescription: statusDesc,
      location: data2.location || "Noon Hub",
      timestamp: import_firestore.FieldValue.serverTimestamp(),
      rawPayload: data2
    }).catch((err) => console.error("Failed to append Noon tracking history:", err));
    dbAdmin.collection("requests").doc(trackingRef).update({
      status: statusDesc,
      updatedAt: import_firestore.FieldValue.serverTimestamp()
    }).catch((err) => console.error("Failed to update Noon tracking status:", err));
  }
  res.status(200).json({ status: "acknowledged" });
});
app.post("/api/aramex/:serviceType", async (req, res) => {
  try {
    const { serviceType } = req.params;
    let payload = req.body;
    const userClientInfo = payload.ClientInfo || {};
    const isProduction = process.env.ARAMEX_ENV === "production" || req.headers["x-aramex-env"] === "production";
    const baseUrl = process.env.ARAMEX_BASE_URL || (isProduction ? "https://ws.aramex.net" : "https://ws.uat.aramex.net");
    const defaultUserName = "dxbit@aramex.com";
    const defaultPassword = "Ar@m3x$h1pp1ng";
    const defaultAccountNumber = "154454";
    const defaultAccountPin = "115216";
    const defaultAccountEntity = "DXB";
    const defaultAccountCountryCode = "AE";
    const defaultSource = 0;
    const defaultVersion = "v1.0";
    const finalUserName = userClientInfo.UserName && userClientInfo.UserName !== "testingapi@aramex.com" ? userClientInfo.UserName : process.env.ARAMEX_USERNAME || defaultUserName;
    const finalPassword = userClientInfo.Password && userClientInfo.Password !== "R123456789$r" ? userClientInfo.Password : process.env.ARAMEX_PASSWORD || defaultPassword;
    const finalVersion = userClientInfo.Version && userClientInfo.Version !== "v1" ? userClientInfo.Version : process.env.ARAMEX_VERSION || defaultVersion;
    const finalAccountNumber = userClientInfo.AccountNumber && userClientInfo.AccountNumber !== "45796" ? userClientInfo.AccountNumber : process.env.ARAMEX_ACCOUNT_NUMBER || defaultAccountNumber;
    const finalAccountPin = userClientInfo.AccountPin && userClientInfo.AccountPin !== "116216" ? userClientInfo.AccountPin : process.env.ARAMEX_ACCOUNT_PIN || defaultAccountPin;
    const finalAccountEntity = userClientInfo.AccountEntity || process.env.ARAMEX_ACCOUNT_ENTITY || defaultAccountEntity;
    const finalAccountCountryCode = userClientInfo.AccountCountryCode || process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || defaultAccountCountryCode;
    const finalSource = userClientInfo.Source !== void 0 ? Number(userClientInfo.Source) : process.env.ARAMEX_SOURCE !== void 0 ? Number(process.env.ARAMEX_SOURCE) : defaultSource;
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
      }
    };
    let path2 = "";
    if (serviceType === "rate") {
      path2 = "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate";
    } else if (serviceType === "shipping") {
      path2 = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments";
    } else if (serviceType === "tracking") {
      path2 = "/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments";
    } else if (serviceType === "pickup") {
      path2 = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreatePickup";
    } else {
      return res.status(200).json({
        HasErrors: true,
        Notifications: [{ Code: "ERR_ROUTING", Message: "Invalid Aramex service type" }]
      });
    }
    try {
      aramexRes = await fetch(`${baseUrl}${path2}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15e3)
        // 15 second timeout
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
    } catch (fetchError) {
      return res.status(500).json({ error: `Aramex API connection failed: ${fetchError.message}` });
    }
  } catch (error) {
    console.error("Aramex Error:", error);
    return res.status(500).json({ error: error.message });
  }
});
var getNoonBaseUrl = (req) => {
  return req.headers["x-noon-base-url"] || req.query.baseUrl || req.body && req.body.baseUrl || "https://merchants.staging.noon.com";
};
var getNoonHeaders = (req) => {
  const clientApiKey = req.headers["x-noon-api-key"] || req.query.apiKey || req.body && req.body.apiKey;
  const apiKey2 = clientApiKey && clientApiKey !== "noon_secret_key_123" ? clientApiKey : "";
  return {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey2,
    "Api-Key": apiKey2,
    "Authorization": `Bearer ${apiKey2}`
  };
};
app.post("/api/courier/test-connection", import_express.default.json(), async (req, res) => {
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
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message });
  }
});
app.post("/api/courier/rate", import_express.default.json(), async (req, res) => {
  try {
    const { courierId, payload, credentials, environment } = req.body;
    const adapter = courierEngine.getAdapter(courierId);
    const result = await adapter.calculateRate(payload, credentials, environment);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});
app.post("/api/courier/shipment", import_express.default.json(), async (req, res) => {
  try {
    const { courierId, payload, credentials, environment } = req.body;
    const adapter = courierEngine.getAdapter(courierId);
    const result = await adapter.createShipment(payload, credentials, environment);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});
app.post("/api/courier/track", import_express.default.json(), async (req, res) => {
  try {
    const { courierId, trackingId, credentials, environment } = req.body;
    const adapter = courierEngine.getAdapter(courierId);
    const result = await adapter.trackShipment(trackingId, credentials, environment);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});
app.post("/api/courier/cancel", import_express.default.json(), async (req, res) => {
  try {
    const { courierId, trackingId, credentials, environment } = req.body;
    const adapter = courierEngine.getAdapter(courierId);
    const result = await adapter.cancelShipment(trackingId, credentials, environment);
    return res.json({ success: result });
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});
app.get("/api/noon/pickup-addresses", async (req, res) => {
  try {
    const baseUrl = getNoonBaseUrl(req);
    console.log(`[Noon Proxy] Fetching pickup points from ${baseUrl}...`);
    const response = await fetch(`${baseUrl}/public/v1/pickup-points/list`, {
      method: "GET",
      headers: getNoonHeaders(req),
      signal: AbortSignal.timeout(1e4)
    });
    if (response.ok) {
      const data2 = await response.json();
      console.log("[Noon Proxy] Successfully fetched pickup points from Noon API.");
      return res.json(data2);
    } else {
      console.error(`[Noon Proxy] Noon API returned ${response.status}.`);
      return res.status(response.status).json({ error: `Noon API returned ${response.status}` });
    }
  } catch (error) {
    console.error(`[Noon Proxy] Failed to connect to Noon: ${error.message}.`);
    return res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});
app.post("/api/noon/create-task", async (req, res) => {
  const params = req.body;
  try {
    const baseUrl = getNoonBaseUrl(req);
    console.log(`[Noon Proxy] Sending create-task payload to ${baseUrl}...`, JSON.stringify(params));
    const response = await fetch(`${baseUrl}/public/v1/create-task`, {
      method: "POST",
      headers: getNoonHeaders(req),
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(1e4)
    });
    const data2 = await response.json();
    console.log(`[Noon Proxy] Noon Staging API returned status ${response.status}:`, data2);
    if (response.ok || data2.status === "SUCCESS") {
      return res.status(response.status).json(data2);
    } else {
      console.error(`[Noon Proxy] Noon API returned error structure.`);
      return res.status(response.status).json(data2);
    }
  } catch (error) {
    console.error(`[Noon Proxy] Noon create-task connection failed: ${error.message}.`);
    return res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});
app.get("/api/noon/tasks/:mp_task_nr", async (req, res) => {
  const { mp_task_nr } = req.params;
  try {
    const baseUrl = getNoonBaseUrl(req);
    console.log(`[Noon Proxy] Fetching task details for ${mp_task_nr} from ${baseUrl}...`);
    const response = await fetch(`${baseUrl}/public/v1/tasks/${mp_task_nr}`, {
      method: "GET",
      headers: getNoonHeaders(req),
      signal: AbortSignal.timeout(1e4)
    });
    if (response.ok) {
      const data2 = await response.json();
      return res.json(data2);
    }
    return res.status(response.status).json({ error: `Noon API returned ${response.status}` });
  } catch (error) {
    console.error(`[Noon Proxy] Noon fetch task details failed: ${error.message}.`);
    return res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});
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
      signal: AbortSignal.timeout(1e4)
    });
    if (response.ok) {
      const data2 = await response.json();
      return res.json(data2);
    }
    return res.status(response.status).json({ error: `Noon API returned ${response.status}` });
  } catch (error) {
    console.error(`[Noon Proxy] Noon task cancellation failed: ${error.message}.`);
    return res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});
var apiKey = process.env.GEMINI_API_KEY;
var ai = new import_genai.GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
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
    const parts = [];
    if (photoBase64) {
      const matches = photoBase64.match(
        /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/
      );
      let data2 = photoBase64;
      let mimeType = "image/jpeg";
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        data2 = matches[2];
      }
      parts.push({
        inlineData: {
          mimeType,
          data: data2
        }
      });
    }
    let promptText = "You are an AI cargo logistics and delivery dispatch dispatcher. Your goal is to analyze the user's item details and return highly precise shipping data.\n";
    if (itemName) {
      promptText += `User written item name/details: "${itemName}"
`;
    }
    if (photoBase64) {
      promptText += "Analyze the uploaded photograph of the item to recognize physical attributes, packaging type, and details.\n";
    }
    promptText += "Please estimate dimensions (length, width, height in cm) and weight based on the type of cargo item detected. Determine 'quantity' (how many items you clearly see or are described), categorize the item, assign a reasonable insurance valuation in AED, and write an helpful dispatch note.";
    parts.push({ text: promptText });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            itemName: {
              type: import_genai.Type.STRING,
              description: "The formatted, cleaned, clean-cut name of the item. E.g. 'Sony PlayStation 5' or 'Real Estate Title Deeds'."
            },
            category: {
              type: import_genai.Type.STRING,
              description: "Must be exactly one of: 'documents', 'electronics', 'food', 'clothing', 'other'."
            },
            estimatedWeightKg: {
              type: import_genai.Type.NUMBER,
              description: "The approximate weight of the shipment in kilograms (kg). Prefer 0.2 for documents/light sheets."
            },
            quantity: {
              type: import_genai.Type.INTEGER,
              description: "Quantity of items detected or mentioned (how many items). E.g. 1, 2, 5. Default to 1 if not explicitly visible."
            },
            lengthCm: {
              type: import_genai.Type.NUMBER,
              description: "Estimated typical cardboard box or product package length in cm."
            },
            widthCm: {
              type: import_genai.Type.NUMBER,
              description: "Estimated typical package width in cm."
            },
            heightCm: {
              type: import_genai.Type.NUMBER,
              description: "Estimated typical package height in cm."
            },
            estimatedValueAED: {
              type: import_genai.Type.NUMBER,
              description: "Estimated retail value / customs / transit insurance declaration in AED."
            },
            notes: {
              type: import_genai.Type.STRING,
              description: "A summary of item's nature, state or shape, package density warning, or custom handling instructions."
            }
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
            "notes"
          ]
        }
      }
    });
    const resultText = response.text;
    if (!resultText) {
      return res.status(500).json({ error: "Failed to generate response text from Gemini." });
    }
    const parsedData = JSON.parse(resultText.trim());
    return res.json(parsedData);
  } catch (error) {
    console.error("AI recognizes item error:", error);
    return res.status(500).json({
      error: error.message || "An error occurred while recognizing the item physical profile."
    });
  }
});
var isProd = process.env.NODE_ENV === "production";
async function startServer() {
  if (!isProd) {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      const masked = secretKey.substring(0, 7) + "..." + secretKey.substring(secretKey.length - 4);
      console.log(`[Stripe Console] Found STRIPE_SECRET_KEY (${masked}). Validating connection with stripe.com API...`);
      try {
        const stripe = getStripe();
        stripe.balance.retrieve().then((bal) => {
          const mode = secretKey.startsWith("sk_test_") ? "TEST (sandbox)" : "LIVE (production)";
          console.log(`[Stripe Console] SUCCESS! Successfully authenticated & connected with Stripe API in ${mode} mode.`);
          console.log(`[Stripe Console] Available Balance: ${bal.available.map((a) => `${(a.amount / 100).toFixed(2)} ${a.currency.toUpperCase()}`).join(", ") || "N/A"}`);
        }).catch((err) => {
          console.error(`[Stripe Console] ERROR: Stripe secret key verification failed: ${err.message}`);
        });
      } catch (err) {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
//# sourceMappingURL=server.cjs.map
