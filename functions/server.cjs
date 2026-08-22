var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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

// src/backend/adapters/AramexAdapter.ts
var AramexAdapter;
var init_AramexAdapter = __esm({
  "src/backend/adapters/AramexAdapter.ts"() {
    AramexAdapter = class {
      constructor() {
        this.id = "aramex";
        this.name = "Aramex";
        this.capabilities = ["RATE", "SHIPMENT", "TRACKING", "LABEL"];
      }
      getBaseUrl(env) {
        return env === "production" ? "https://ws.aramex.net" : "https://ws.uat.aramex.net";
      }
      sanitizeCity(city, address = "", countryCode = "AE") {
        if (!city) return countryCode === "AE" ? "Dubai" : "";
        if (countryCode !== "AE") return city;
        const clean = city.trim().toLowerCase();
        const validCities = [
          { key: "dubai", name: "Dubai" },
          { key: "abu dhabi", name: "Abu Dhabi" },
          { key: "al ain", name: "Al Ain" },
          { key: "sharjah", name: "Sharjah" },
          { key: "ajman", name: "Ajman" },
          { key: "fujairah", name: "Fujairah" },
          { key: "ras al khaimah", name: "Ras Al Khaimah" },
          { key: "umm al quwain", name: "Umm Al Quwain" }
        ];
        for (const vc of validCities) {
          if (clean.includes(vc.key)) {
            return vc.name;
          }
        }
        if (address) {
          const addressLower = address.toLowerCase();
          for (const vc of validCities) {
            if (addressLower.includes(vc.key)) {
              return vc.name;
            }
          }
        }
        return "Dubai";
      }
      async postRequest(url, payload) {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload)
        });
        const contentType = response.headers.get("content-type") || "";
        if (!response.ok || !contentType.includes("application/json")) {
          const errorText = await response.text();
          const match = errorText.match(/<p xmlns="">([\s\S]*?)<\/p>/) || errorText.match(/<p>([\s\S]*?)<\/p>/);
          const errMsg = match ? match[1].replace(/<[^>]*>/g, "").trim() : `Aramex server error (status ${response.status})`;
          throw new Error(errMsg);
        }
        return await response.json();
      }
      async validateCredentials(credentials, environment) {
        const baseUrl = this.getBaseUrl(environment);
        const path3 = "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate";
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
          OriginAddress: {
            Line1: "Origin Address",
            Line2: "",
            Line3: "",
            PostCode: "",
            StateOrProvince: "",
            City: "Dubai",
            CountryCode: "AE"
          },
          DestinationAddress: {
            Line1: "Destination Address",
            Line2: "",
            Line3: "",
            PostCode: "",
            StateOrProvince: "",
            City: "Abu Dhabi",
            CountryCode: "AE"
          },
          ShipmentDetails: {
            PaymentType: "P",
            ProductGroup: "DOM",
            ProductType: "OND",
            ActualWeight: { Value: 1, Unit: "KG" },
            ChargeableWeight: { Value: 1, Unit: "KG" },
            NumberOfPieces: 1,
            Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
            DescriptionOfGoods: "Verification",
            GoodsOriginCountry: "AE",
            PaymentOptions: ""
          }
        };
        try {
          const data = await this.postRequest(`${baseUrl}${path3}`, payload);
          if (data.HasErrors) {
            return { success: false, error: data.Notifications?.[0]?.Message || `Aramex API credentials validation failed. Raw response: ${JSON.stringify(data)}` };
          }
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message || "Network error while connecting to Aramex" };
        }
      }
      async calculateRate(payload, credentials, environment) {
        const baseUrl = this.getBaseUrl(environment);
        const path3 = "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate";
        const sanitizedOriginCity = this.sanitizeCity(payload.originCity, "", payload.originCountry);
        const sanitizedDestCity = this.sanitizeCity(payload.destCity, "", payload.destCountry);
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
            Line1: "Origin Address",
            Line2: "",
            Line3: "",
            PostCode: "",
            StateOrProvince: "",
            City: sanitizedOriginCity,
            CountryCode: payload.originCountry
          },
          DestinationAddress: {
            Line1: "Destination Address",
            Line2: "",
            Line3: "",
            PostCode: "",
            StateOrProvince: "",
            City: sanitizedDestCity,
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
            Services: payload.codAmount ? "CODS" : "",
            Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
            DescriptionOfGoods: "Rate check",
            GoodsOriginCountry: payload.originCountry,
            PaymentOptions: ""
          }
        };
        try {
          const data = await this.postRequest(`${baseUrl}${path3}`, aramexPayload);
          if (data.HasErrors) {
            return { success: false, error: data.Notifications?.[0]?.Message || `Unknown Error. Raw response: ${JSON.stringify(data)}` };
          }
          return {
            success: true,
            totalAmount: data.TotalAmount?.Value,
            currency: data.TotalAmount?.CurrencyCode,
            serviceName: payload.isExpress ? "Aramex Priority Express" : "Aramex Value Parcel"
          };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }
      async createShipment(payload, credentials, environment) {
        const baseUrl = this.getBaseUrl(environment);
        const path3 = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments";
        const isDomestic = payload.senderCountry === payload.receiverCountry;
        const sanitizedSenderCity = this.sanitizeCity(payload.senderCity, payload.senderAddress, payload.senderCountry);
        const sanitizedReceiverCity = this.sanitizeCity(payload.receiverCity, payload.receiverAddress, payload.receiverCountry);
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
                  Line1: payload.senderAddress || "Dubai Warehouse",
                  Line2: "",
                  Line3: "",
                  City: sanitizedSenderCity,
                  StateOrProvince: "",
                  PostCode: "",
                  CountryCode: payload.senderCountry
                },
                Contact: {
                  Department: "",
                  PersonName: payload.senderName || "Sender",
                  CompanyName: "USend Hub",
                  PhoneNumber1: payload.senderPhone || "+971500000000",
                  PhoneNumber1Ext: "",
                  PhoneNumber2: "",
                  PhoneNumber2Ext: "",
                  FaxNumber: "",
                  CellPhone: payload.senderPhone || "+971500000000",
                  EmailAddress: "dispatch@usend.ae",
                  Type: 0
                }
              },
              Consignee: {
                Reference1: "",
                Reference2: "",
                AccountNumber: "",
                PartyAddress: {
                  Line1: payload.receiverAddress || "Delivery Address",
                  Line2: "",
                  Line3: "",
                  City: sanitizedReceiverCity,
                  StateOrProvince: "",
                  PostCode: "",
                  CountryCode: payload.receiverCountry
                },
                Contact: {
                  Department: "",
                  PersonName: payload.receiverName || "Recipient",
                  CompanyName: payload.receiverName || "Recipient",
                  PhoneNumber1: payload.receiverPhone || "+971520000000",
                  PhoneNumber1Ext: "",
                  PhoneNumber2: "",
                  PhoneNumber2Ext: "",
                  FaxNumber: "",
                  CellPhone: payload.receiverPhone || "+971520000000",
                  EmailAddress: "",
                  Type: 0
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
                Dimensions: payload.dimensions ? {
                  Length: payload.dimensions.length,
                  Width: payload.dimensions.width,
                  Height: payload.dimensions.height,
                  Unit: "CM"
                } : { Length: 10, Width: 10, Height: 10, Unit: "CM" },
                ActualWeight: { Value: payload.weightKg, Unit: "KG" },
                ChargeableWeight: { Value: payload.weightKg, Unit: "KG" },
                DescriptionOfGoods: payload.goodsDescription || "Goods",
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
          const data = await this.postRequest(`${baseUrl}${path3}`, aramexPayload);
          if (data.HasErrors) {
            return { success: false, error: data.Notifications?.[0]?.Message || `Unknown Error. Raw response: ${JSON.stringify(data)}` };
          }
          const shipment = data.Shipments?.[0];
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
        const path3 = "/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments";
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
          const data = await this.postRequest(`${baseUrl}${path3}`, payload);
          if (data.HasErrors) {
            return { success: false, providerStatus: "Error", usendStatus: "FAILED", timestamp: (/* @__PURE__ */ new Date()).toISOString(), error: data.Notifications?.[0]?.Message || `Tracking Error. Raw response: ${JSON.stringify(data)}` };
          }
          const results = data.TrackingResults;
          if (!results || results.length === 0) {
            return { success: false, providerStatus: "No Data", usendStatus: "PENDING", timestamp: (/* @__PURE__ */ new Date()).toISOString(), error: "No tracking data found" };
          }
          const updates = results[0].Value;
          if (!updates || updates.length === 0) {
            return { success: true, providerStatus: "No Updates", usendStatus: "PENDING", timestamp: (/* @__PURE__ */ new Date()).toISOString() };
          }
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
        const baseUrl = this.getBaseUrl(environment);
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
            Reference1: `Cancel ${trackingId}`,
            Reference2: "",
            Reference3: "",
            Reference4: "",
            Reference5: ""
          },
          PickupGUID: trackingId,
          // Often the GUID or waybill number is used here
          Comments: "Cancelled by User via USend"
        };
        try {
          const data = await this.postRequest(`${baseUrl}/api/aramex/cancel_pickup`, aramexPayload);
          if (data.HasErrors) {
            console.error("[AramexAdapter] CancelShipment Failed:", data.Notifications?.[0]?.Message || JSON.stringify(data));
            return false;
          }
          return true;
        } catch (e) {
          console.error("[AramexAdapter] CancelShipment Exception:", e.message);
          return false;
        }
      }
      mapStatus(aramexCode) {
        const code = aramexCode.toUpperCase();
        if (["SH005", "SH006", "SH007", "SH014", "SH164"].includes(code)) return "DELIVERED";
        if (["SH012", "SH069", "SH234"].includes(code)) return "IN_TRANSIT";
        if (["SH047", "SH048", "SH049"].includes(code)) return "FAILED";
        return "PENDING";
      }
    };
  }
});

// src/backend/adapters/CourierAdapter.ts
function toNoonCoord(decimal) {
  return Math.round(decimal * 1e7);
}
function fromNoonCoord(micro) {
  return Number(micro) / 1e7;
}
function aedToFils(aed) {
  return Math.round(aed * 100);
}
var NOON_STATUS_MAP, NOON_STATUS_STEPS;
var init_CourierAdapter = __esm({
  "src/backend/adapters/CourierAdapter.ts"() {
    NOON_STATUS_MAP = {
      pending_assignment: { usendStatus: "PENDING", label: "Finding Driver", cancellable: true },
      assigned: { usendStatus: "IN_TRANSIT", label: "Driver Assigned", cancellable: true },
      arrived_at_pickup_location: { usendStatus: "IN_TRANSIT", label: "Driver at Pickup", cancellable: true },
      picked_up: { usendStatus: "IN_TRANSIT", label: "Picked Up", cancellable: false },
      arrived_at_delivery: { usendStatus: "IN_TRANSIT", label: "Driver Arriving", cancellable: false },
      delivered: { usendStatus: "DELIVERED", label: "Delivered", cancellable: false },
      cancelled: { usendStatus: "FAILED", label: "Cancelled", cancellable: false },
      undelivered: { usendStatus: "FAILED", label: "Undelivered", cancellable: false }
    };
    NOON_STATUS_STEPS = [
      { status: "pending_assignment", label: "Finding Driver" },
      { status: "assigned", label: "Driver Assigned" },
      { status: "arrived_at_pickup_location", label: "Driver at Pickup" },
      { status: "picked_up", label: "Picked Up" },
      { status: "arrived_at_delivery", label: "Driver Arriving" },
      { status: "delivered", label: "Delivered" }
    ];
  }
});

// src/backend/adapters/NoonAdapter.ts
var DEFAULT_PICKUP_LAT, DEFAULT_PICKUP_LNG, NoonAdapter;
var init_NoonAdapter = __esm({
  "src/backend/adapters/NoonAdapter.ts"() {
    init_CourierAdapter();
    DEFAULT_PICKUP_LAT = 25.1964783;
    DEFAULT_PICKUP_LNG = 55.2808833;
    NoonAdapter = class {
      constructor() {
        this.id = "noon";
        this.name = "Noon Rider on Demand";
        this.capabilities = ["SHIPMENT", "TRACKING", "CANCEL"];
      }
      getBaseUrl(env) {
        if (process.env.NOON_API_BASE_URL) return process.env.NOON_API_BASE_URL;
        return env === "production" ? "https://food-api-team.noon.team" : "https://food-api-team.noonstg.team";
      }
      getApiKey(credentials, env = "sandbox") {
        if (process.env.NOON_API_KEY) return process.env.NOON_API_KEY;
        if (credentials.apiKey && credentials.apiKey.length > 10) return credentials.apiKey;
        if (credentials.password && credentials.password.length > 10) return credentials.password;
        return env === "sandbox" ? "SstJi9Ho0EHG2t7kQVSz7nA2hOeL3iiwVxHxb0Njk60QJ0LfmvoXOsimw1zQC7VugHXiIRRMnWyU6f0uHcEcLlco5Eujqbd5pTwDlfBXpacuRI4m4AAj61NwM0B7Ihk" : credentials.apiKey || "";
      }
      buildHeaders(credentials, idempotencyKey) {
        const apiKey2 = this.getApiKey(credentials);
        const headers = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey2
        };
        if (idempotencyKey) {
          headers["X-Idempotency-Key"] = idempotencyKey;
        }
        return headers;
      }
      // ─── Validate Credentials ─────────────────────────────────────────────────
      async validateCredentials(credentials, environment) {
        const baseUrl = this.getBaseUrl(environment);
        const apiKey2 = this.getApiKey(credentials);
        if (!apiKey2) return { success: false, error: "Missing Noon API key" };
        try {
          const response = await fetch(`${baseUrl}/public/v1/pickup-points/list`, {
            method: "GET",
            headers: this.buildHeaders(credentials),
            signal: AbortSignal.timeout(1e4)
          });
          const text = await response.text();
          if (text.includes("FortiGuard") || text.includes("Web Filter")) {
            return { success: false, error: "Access blocked by corporate firewall. Try from another network." };
          }
          if (!response.ok) {
            return { success: false, error: `Noon returned HTTP ${response.status}` };
          }
          return { success: true };
        } catch (e) {
          return { success: false, error: e.message || "Network error" };
        }
      }
      // ─── Calculate Rate ───────────────────────────────────────────────────────
      async calculateRate(payload, credentials, environment) {
        return {
          success: true,
          totalAmount: payload.isExpress ? 25 : 18,
          currency: "AED",
          serviceName: "Noon Rider on Demand"
        };
      }
      // ─── Create Shipment (Delivery Task) ─────────────────────────────────────
      async createShipment(payload, credentials, environment) {
        const baseUrl = this.getBaseUrl(environment);
        const outletCode = payload.outletCode || credentials.outletCode || credentials.storeId || credentials.accountNumber || (environment === "sandbox" ? "77T4HCOD4G" : "");
        if (!outletCode) {
          return { success: false, error: "Noon: No outlet_code provided. Select a pickup point first." };
        }
        const idempotencyKey = payload.idempotencyKey || `usend-${payload.orderId || payload.reference || Date.now()}-${outletCode}`;
        const pickupLatInt = toNoonCoord(payload.pickupLat ?? DEFAULT_PICKUP_LAT);
        const pickupLngInt = toNoonCoord(payload.pickupLng ?? DEFAULT_PICKUP_LNG);
        const dropLatInt = toNoonCoord(payload.dropLat ?? DEFAULT_PICKUP_LAT);
        const dropLngInt = toNoonCoord(payload.dropLng ?? DEFAULT_PICKUP_LNG + 0.01);
        const codFils = aedToFils(payload.codAmountAED || 0);
        const prepaidFils = aedToFils(payload.prepaidAmountAED || 0);
        const finalCodFils = codFils;
        const finalPrepaidFils = codFils === 0 && prepaidFils === 0 ? 100 : prepaidFils;
        const noonPayload = {
          outlet_code: outletCode,
          order_reference: payload.reference || payload.orderId || `USEND-${Date.now()}`,
          customer_name: payload.receiverName,
          customer_phone: payload.receiverPhone,
          drop_off_address: {
            address: payload.receiverAddress,
            lat: dropLatInt,
            lng: dropLngInt,
            contact_name: payload.receiverName,
            contact_phone_number: payload.receiverPhone,
            country_code: "ae"
            // Noon staging only accepts lowercase 'ae'
          },
          lat: pickupLatInt,
          lng: pickupLngInt,
          cod_value: finalCodFils,
          prepaid_value: finalPrepaidFils,
          payment_method: codFils > 0 ? "COD" : "PAID"
        };
        try {
          const response = await fetch(`${baseUrl}/public/v1/create-task`, {
            method: "POST",
            headers: this.buildHeaders(credentials, idempotencyKey),
            body: JSON.stringify(noonPayload),
            signal: AbortSignal.timeout(15e3)
          });
          const responseText = await response.text();
          if (responseText.trimStart().startsWith("<")) {
            return {
              success: false,
              error: "Noon returned an HTML page \u2014 check API key and network access"
            };
          }
          let data = {};
          try {
            data = JSON.parse(responseText);
          } catch {
            return {
              success: false,
              error: `Noon returned non-JSON (HTTP ${response.status}): ${responseText.substring(0, 200)}`
            };
          }
          if (response.status === 404 && data.detail) {
            return { success: false, error: `Noon endpoint not found: ${data.detail}` };
          }
          if (!response.ok || data.error) {
            const errMsg = data.error || data.detail || data.message || `Noon task creation failed (HTTP ${response.status})`;
            console.error("[NoonAdapter] NOON_TASK_CREATE_FAILED", { outletCode, idempotencyKey, error: errMsg });
            return { success: false, error: errMsg };
          }
          const taskId = data.mp_task_nr;
          if (!taskId) {
            return { success: false, error: `Noon task created but no mp_task_nr in response: ${JSON.stringify(data)}` };
          }
          console.log("[NoonAdapter] NOON_TASK_CREATE_SUCCESS", { taskId, outletCode, idempotencyKey });
          return {
            success: true,
            trackingNumber: taskId,
            noonTaskId: taskId,
            outletCode,
            providerStatus: "pending_assignment"
          };
        } catch (e) {
          console.error("[NoonAdapter] NOON_TASK_CREATE_FAILED (network)", e.message);
          return { success: false, error: `Network error: ${e.message}` };
        }
      }
      // ─── Track Shipment ───────────────────────────────────────────────────────
      async trackShipment(trackingId, credentials, environment) {
        const baseUrl = this.getBaseUrl(environment);
        const FAILED_RESPONSE = (error) => ({
          success: false,
          usendStatus: "FAILED",
          providerStatus: "error",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          error
        });
        try {
          const response = await fetch(`${baseUrl}/public/v1/tasks/${trackingId}`, {
            method: "GET",
            headers: this.buildHeaders(credentials),
            signal: AbortSignal.timeout(1e4)
          });
          const text = await response.text();
          if (text.trimStart().startsWith("<")) return FAILED_RESPONSE("Noon returned HTML page");
          let data = {};
          try {
            data = JSON.parse(text);
          } catch {
            return FAILED_RESPONSE(`Non-JSON response (HTTP ${response.status})`);
          }
          if (!response.ok) return FAILED_RESPONSE(data.error || data.detail || `HTTP ${response.status}`);
          const statusCode = data.status_code || "pending_assignment";
          const mapped = NOON_STATUS_MAP[statusCode] || { usendStatus: "PENDING", label: "In Progress", cancellable: false };
          const daUpdates = data.da_updates || [];
          const currentStatusIndex = NOON_STATUS_STEPS.findIndex((s) => s.status === statusCode);
          const statusHistory = NOON_STATUS_STEPS.map((step, idx) => {
            const update = daUpdates.find((u) => u.status === step.status);
            return {
              status: step.status,
              label: step.label,
              timestamp: update?.time || null,
              completed: idx <= currentStatusIndex
            };
          });
          const da = data.da_details;
          let driverName;
          let driverPhone;
          let driverLat;
          let driverLng;
          if (da) {
            driverName = da.name || void 0;
            driverPhone = da.phone_number || da.phone || void 0;
            if (da.latitude) driverLat = fromNoonCoord(da.latitude);
            if (da.longitude) driverLng = fromNoonCoord(da.longitude);
          }
          console.log("[NoonAdapter] NOON_TASK_STATUS_UPDATE", { trackingId, statusCode });
          return {
            success: true,
            usendStatus: mapped.usendStatus,
            usendStatusLabel: mapped.label,
            providerStatus: statusCode,
            timestamp: data.created_at || (/* @__PURE__ */ new Date()).toISOString(),
            noonTaskId: trackingId,
            cancellable: mapped.cancellable,
            driverName,
            driverPhone,
            driverLat,
            driverLng,
            pickupAddress: data.restaurant_details?.address,
            dropAddress: data.customer_details?.address,
            statusHistory
          };
        } catch (e) {
          console.error("[NoonAdapter] Track failed", e.message);
          return FAILED_RESPONSE(e.message);
        }
      }
      // ─── Cancel Shipment ──────────────────────────────────────────────────────
      async cancelShipment(trackingId, credentials, environment) {
        const baseUrl = this.getBaseUrl(environment);
        const tracking = await this.trackShipment(trackingId, credentials, environment);
        if (tracking.success && tracking.cancellable === false) {
          console.warn("[NoonAdapter] NOON_TASK_CANCEL_FAILED \u2014 task past cancellable state", { trackingId, status: tracking.providerStatus });
          throw new Error(`Cannot cancel: delivery is already in status "${tracking.usendStatusLabel || tracking.providerStatus}"`);
        }
        try {
          const response = await fetch(`${baseUrl}/public/v1/tasks/${trackingId}/cancel`, {
            method: "POST",
            headers: this.buildHeaders(credentials),
            body: JSON.stringify({ reason: "Partner cancellation via USend" }),
            signal: AbortSignal.timeout(1e4)
          });
          const text = await response.text();
          let data = {};
          try {
            data = JSON.parse(text);
          } catch {
          }
          if (response.ok) {
            console.log("[NoonAdapter] NOON_TASK_CANCEL", { trackingId });
            return true;
          }
          const errMsg = data.error || data.detail || `HTTP ${response.status}`;
          console.error("[NoonAdapter] NOON_TASK_CANCEL_FAILED", { trackingId, error: errMsg });
          throw new Error(errMsg);
        } catch (e) {
          if (e.message.includes("Cannot cancel")) throw e;
          throw new Error(`Cancellation failed: ${e.message}`);
        }
      }
    };
  }
});

// src/backend/adapters/GenericRestAdapter.ts
var GenericRestAdapter;
var init_GenericRestAdapter = __esm({
  "src/backend/adapters/GenericRestAdapter.ts"() {
    GenericRestAdapter = class {
      constructor(id) {
        this.capabilities = ["RATE", "SHIPMENT", "TRACKING"];
        this.id = id;
        this.name = id.toUpperCase();
      }
      async validateCredentials(credentials, environment) {
        if (Object.keys(credentials).length === 0) {
          return { success: false, error: "No credentials provided" };
        }
        return { success: true };
      }
      async calculateRate(payload, credentials, environment) {
        return {
          success: true,
          totalAmount: 15,
          currency: "AED",
          serviceName: `${this.name} Standard`
        };
      }
      async createShipment(payload, credentials, environment) {
        const dummyTracking = `GEN-${Math.floor(Math.random() * 1e6)}`;
        return {
          success: true,
          trackingNumber: dummyTracking,
          providerStatus: "Created"
        };
      }
      async trackShipment(trackingId, credentials, environment) {
        return {
          success: true,
          providerStatus: "In Transit",
          usendStatus: "IN_TRANSIT",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      async cancelShipment(trackingId, credentials, environment) {
        return true;
      }
    };
  }
});

// src/backend/adapters/CourierEngine.ts
var CourierEngine_exports = {};
__export(CourierEngine_exports, {
  CourierEngine: () => CourierEngine,
  courierEngine: () => courierEngine
});
var CourierEngine, courierEngine;
var init_CourierEngine = __esm({
  "src/backend/adapters/CourierEngine.ts"() {
    init_AramexAdapter();
    init_NoonAdapter();
    init_GenericRestAdapter();
    CourierEngine = class {
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
          return new GenericRestAdapter(id);
        }
        return adapter;
      }
    };
    courierEngine = new CourierEngine();
  }
});

// server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app
});
module.exports = __toCommonJS(server_exports);

// src/init-env.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_url = require("url");
var import_meta = {};
var dirName = "";
try {
  dirName = __dirname;
} catch (e) {
  dirName = import_path.default.dirname((0, import_url.fileURLToPath)(import_meta.url));
}
var envPath = import_path.default.resolve(dirName, "../.env");
if (!import_fs.default.existsSync(envPath)) {
  envPath = import_path.default.resolve(process.cwd(), ".env");
}
import_dotenv.default.config({ path: envPath });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  process.env.METADATA_SERVER_DETECTION = "none";
  process.env.GCE_METADATA_HOST = "127.0.0.1";
  process.env.GCP_METADATA_CHECK_DISABLE = "true";
  process.env.NO_GCE_CHECK = "true";
}

// server.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_stripe = __toESM(require("stripe"), 1);
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_dotenv2 = __toESM(require("dotenv"), 1);
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var import_firestore = require("firebase-admin/firestore");
var import_url2 = require("url");
var import_meta2 = {};
process.on("uncaughtException", (err) => {
  import_fs2.default.writeSync(2, `[UNCAUGHT EXCEPTION] ${err.stack || err}
`);
});
process.on("unhandledRejection", (reason) => {
  import_fs2.default.writeSync(2, `[UNHANDLED REJECTION] ${reason?.stack || reason}
`);
});
var dirName2 = "";
try {
  dirName2 = __dirname;
} catch (e) {
  dirName2 = import_path2.default.dirname((0, import_url2.fileURLToPath)(import_meta2.url));
}
var envPath2 = import_path2.default.resolve(dirName2, ".env");
if (!import_fs2.default.existsSync(envPath2)) {
  envPath2 = import_path2.default.resolve(process.cwd(), ".env");
}
import_dotenv2.default.config({ path: envPath2 });
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.warn("[SECURITY] TLS validation disabled (dev/staging mode). Never use in production.");
}
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  process.env.GCE_METADATA_HOST = "127.0.0.1";
  process.env.GCE_METADATA_CHECK_DISABLE = "true";
  process.env.NO_GCE_CHECK = "true";
  console.log("Local development environment detected: Bypassing Firebase Metadata Server to prevent hangs.");
}
var firebaseConfig = {};
try {
  let configPath = import_path2.default.resolve(dirName2, "firebase-applet-config.json");
  if (!import_fs2.default.existsSync(configPath)) {
    configPath = import_path2.default.resolve(process.cwd(), "firebase-applet-config.json");
  }
  if (import_fs2.default.existsSync(configPath)) {
    firebaseConfig = JSON.parse(import_fs2.default.readFileSync(configPath, "utf8"));
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
      console.log("Firebase Admin: No service account key found, initializing with default project options.");
    }
    import_firebase_admin.default.initializeApp(options);
  } catch (error) {
    console.error("Firebase Admin: Initialization failed:", error);
  }
}
var _dbAdmin = null;
function getDbAdmin() {
  if (!_dbAdmin) {
    const appInstance = import_firebase_admin.default.app();
    _dbAdmin = firebaseConfig.firestoreDatabaseId ? (0, import_firestore.getFirestore)(appInstance, firebaseConfig.firestoreDatabaseId) : (0, import_firestore.getFirestore)(appInstance);
  }
  return _dbAdmin;
}
var dbAdmin = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === "symbol" || prop === "then" || prop === "toJSON" || prop === "inspect" || prop === "constructor") {
      return void 0;
    }
    const instance = getDbAdmin();
    const value = instance[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  }
});
var _courierEngine = null;
async function getCourierEngine() {
  if (!_courierEngine) {
    const mod = await Promise.resolve().then(() => (init_CourierEngine(), CourierEngine_exports));
    _courierEngine = mod.courierEngine;
  }
  return _courierEngine;
}
var fetchWithTimeout = async (url, options, timeoutMs = 3e4) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
};
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT) || 3005;
app.set("trust proxy", 1);
var apiLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 300,
  // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});
app.use("/api/", apiLimiter);
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
async function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  console.log(`[AuthMiddleware] Path: ${req.path} | AuthHeader: ${authHeader ? "PRESENT" : "MISSING"}`);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await import_firebase_admin.default.auth().verifyIdToken(idToken);
    req.user = { uid: decodedToken.uid, email: decodedToken.email, role: decodedToken.role };
    next();
  } catch (err) {
    console.warn("[Auth] Token verification failed:", err.message);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}
var PROTECTED_ROUTE_PREFIXES = ["/api/courier/", "/api/admin/", "/api/aramex/"];
app.use((req, res, next) => {
  const isProtected = PROTECTED_ROUTE_PREFIXES.some((prefix) => req.path.startsWith(prefix));
  if (isProtected) {
    return requireAuth(req, res, next);
  }
  next();
});
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
  } catch (error) {
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
          const data = orderSnap.data();
          const dbAmountStr = data?.orderAmount || "";
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
function broadcastEvent(event) {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(event)}

`);
  });
}
app.post("/api/webhooks/aramex", import_express.default.json(), async (req, res) => {
  console.log("Webhook Received:", req.body);
  const data = req.body;
  if (data?.UpdateCode && data?.WaybillNumber) {
    broadcastEvent({
      type: "WEBHOOK_UPDATE",
      trackingNumber: data.WaybillNumber,
      updateCode: data.UpdateCode,
      updateDescription: data.UpdateDescription,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      location: data.UpdateLocation || "Hub"
    });
    dbAdmin.collection("requests").doc(data.WaybillNumber).collection("tracking_history").add({
      updateCode: data.UpdateCode,
      updateDescription: data.UpdateDescription,
      location: data.UpdateLocation || "Hub",
      timestamp: import_firestore.FieldValue.serverTimestamp(),
      rawPayload: data
    }).catch((err) => console.error("Failed to append tracking history:", err));
    dbAdmin.collection("requests").doc(data.WaybillNumber).update({
      status: data.UpdateDescription,
      updatedAt: import_firestore.FieldValue.serverTimestamp()
    }).catch((err) => console.error("Failed to update tracking status:", err));
  }
  res.status(200).json({ status: "acknowledged" });
});
async function processNoonStatusWebhook(data) {
  const taskNr = data.mp_task_nr || data.task_nr || data.order_reference;
  const statusCode = data.status_code || data.status || "unknown";
  const eventId = data.event_id || `${taskNr}-${statusCode}-${data.event_time || Date.now()}`;
  if (!taskNr) return;
  const eventRef = dbAdmin.collection("noon_webhook_events").doc(eventId);
  try {
    const existing = await eventRef.get();
    if (existing.exists) {
      console.log("[NoonWebhook] NOON_WEBHOOK_DUPLICATE skipped", { eventId });
      return;
    }
    await eventRef.set({ taskNr, statusCode, processedAt: import_firestore.FieldValue.serverTimestamp(), raw: data });
  } catch (e) {
    console.error("[NoonWebhook] Dedup check failed (non-blocking):", e);
  }
  const STATUS_MAP = {
    pending_assignment: { usendStatus: "PENDING", label: "Finding Driver" },
    assigned: { usendStatus: "IN_TRANSIT", label: "Driver Assigned" },
    arrived_at_pickup_location: { usendStatus: "IN_TRANSIT", label: "Driver at Pickup" },
    picked_up: { usendStatus: "IN_TRANSIT", label: "Picked Up" },
    arrived_at_delivery: { usendStatus: "IN_TRANSIT", label: "Driver Arriving" },
    delivered: { usendStatus: "DELIVERED", label: "Delivered" },
    cancelled: { usendStatus: "FAILED", label: "Cancelled" },
    undelivered: { usendStatus: "FAILED", label: "Undelivered" }
  };
  const mapped = STATUS_MAP[statusCode] || { usendStatus: "PENDING", label: statusCode };
  const ts = data.event_time || (/* @__PURE__ */ new Date()).toISOString();
  console.log("[NoonWebhook] NOON_WEBHOOK_RECEIVED", { taskNr, statusCode, label: mapped.label });
  broadcastEvent({
    type: "WEBHOOK_UPDATE",
    provider: "noon",
    trackingNumber: taskNr,
    updateCode: statusCode,
    updateDescription: mapped.label,
    usendStatus: mapped.usendStatus,
    timestamp: ts
  });
  try {
    const snap = await dbAdmin.collection("requests").where("externalTrackingNumber", "==", taskNr).limit(1).get();
    if (!snap.empty) {
      const docId = snap.docs[0].id;
      await dbAdmin.collection("requests").doc(docId).update({
        status: mapped.usendStatus,
        noonProviderStatus: statusCode,
        noonStatusLabel: mapped.label,
        updatedAt: import_firestore.FieldValue.serverTimestamp()
      });
      await dbAdmin.collection("requests").doc(docId).collection("tracking_history").add({
        updateCode: statusCode,
        updateDescription: mapped.label,
        provider: "noon",
        timestamp: import_firestore.FieldValue.serverTimestamp(),
        rawPayload: data
      });
      console.log("[NoonWebhook] NOON_WEBHOOK_PROCESSED", { docId, statusCode });
    }
  } catch (e) {
    console.error("[NoonWebhook] Firestore update failed:", e);
  }
}
app.post("/api/webhooks/noon", import_express.default.json(), async (req, res) => {
  res.status(200).json({ status: "acknowledged" });
  processNoonStatusWebhook(req.body).catch((e) => console.error("[NoonWebhook] Processing error:", e));
});
app.post("/api/webhooks/noon/status", import_express.default.json(), async (req, res) => {
  res.status(200).json({ status: "acknowledged" });
  processNoonStatusWebhook(req.body).catch((e) => console.error("[NoonWebhook/status] Processing error:", e));
});
app.post("/api/webhooks/noon/location", import_express.default.json(), async (req, res) => {
  res.status(200).json({ status: "acknowledged" });
  const data = req.body;
  const taskNr = data.mp_task_nr || data.task_nr;
  if (!taskNr || data.latitude == null || data.longitude == null) return;
  const driverLat = Number(data.latitude) > 1e6 ? Number(data.latitude) / 1e7 : Number(data.latitude);
  const driverLng = Number(data.longitude) > 1e6 ? Number(data.longitude) / 1e7 : Number(data.longitude);
  broadcastEvent({ type: "DRIVER_LOCATION", provider: "noon", trackingNumber: taskNr, driverLat, driverLng, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  try {
    const snap = await dbAdmin.collection("requests").where("externalTrackingNumber", "==", taskNr).limit(1).get();
    if (!snap.empty) {
      const prev = snap.docs[0].data();
      if (Math.abs((prev.noonDriverLat || 0) - driverLat) > 1e-4 || Math.abs((prev.noonDriverLng || 0) - driverLng) > 1e-4) {
        await dbAdmin.collection("requests").doc(snap.docs[0].id).update({ noonDriverLat: driverLat, noonDriverLng: driverLng, updatedAt: import_firestore.FieldValue.serverTimestamp() });
        console.log("[NoonWebhook] NOON_DRIVER_LOCATION_UPDATE", { taskNr, driverLat, driverLng });
      }
    }
  } catch (e) {
    console.error("[NoonWebhook] Location update failed:", e);
  }
});
app.post("/api/aramex/:serviceType", async (req, res) => {
  try {
    const { serviceType } = req.params;
    let payload = req.body;
    const userClientInfo = payload.ClientInfo || {};
    const isProduction = process.env.ARAMEX_ENV !== "sandbox" && req.headers["x-aramex-env"] !== "sandbox";
    const baseUrl = process.env.ARAMEX_BASE_URL || (isProduction ? "https://ws.aramex.net" : "https://ws.uat.aramex.net");
    const aramexCreds = serverCourierCredentials?.aramex?.[isProduction ? "productionCreds" : "sandboxCreds"] || {};
    const envUserName = aramexCreds.username || process.env.ARAMEX_USERNAME || "";
    const envPassword = aramexCreds.password || process.env.ARAMEX_PASSWORD || "";
    const envAccountNumber = aramexCreds.accountNumber || process.env.ARAMEX_ACCOUNT_NUMBER || "";
    const envAccountPin = aramexCreds.accountPin || process.env.ARAMEX_ACCOUNT_PIN || "";
    const envAccountEntity = aramexCreds.accountEntity || process.env.ARAMEX_ACCOUNT_ENTITY || "DXB";
    const envAccountCountryCode = aramexCreds.accountCountryCode || process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || "AE";
    const envSource = aramexCreds.source !== void 0 ? Number(aramexCreds.source) : process.env.ARAMEX_SOURCE !== void 0 ? Number(process.env.ARAMEX_SOURCE) : 0;
    const envVersion = aramexCreds.version || process.env.ARAMEX_VERSION || "v1.0";
    const isUsingTestCreds = (u) => !u || u === "testingapi@aramex.com";
    const finalUserName = !isUsingTestCreds(userClientInfo.UserName) ? userClientInfo.UserName : envUserName;
    const finalPassword = userClientInfo.Password && userClientInfo.Password !== "R123456789$r" ? userClientInfo.Password : envPassword;
    const finalVersion = userClientInfo.Version && userClientInfo.Version !== "v1" ? userClientInfo.Version : envVersion;
    const finalAccountNumber = userClientInfo.AccountNumber && userClientInfo.AccountNumber !== "45796" ? userClientInfo.AccountNumber : envAccountNumber;
    const finalAccountPin = userClientInfo.AccountPin && userClientInfo.AccountPin !== "116216" ? userClientInfo.AccountPin : envAccountPin;
    const finalAccountEntity = userClientInfo.AccountEntity || envAccountEntity;
    const finalAccountCountryCode = userClientInfo.AccountCountryCode || envAccountCountryCode;
    const finalSource = userClientInfo.Source !== void 0 ? Number(userClientInfo.Source) : envSource;
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
    let path3 = "";
    if (serviceType === "rate") {
      path3 = "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate";
    } else if (serviceType === "shipping") {
      path3 = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments";
    } else if (serviceType === "tracking") {
      path3 = "/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments";
    } else if (serviceType === "pickup") {
      path3 = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreatePickup";
    } else if (serviceType === "cancel_pickup") {
      path3 = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CancelPickup";
    } else {
      return res.status(200).json({
        HasErrors: true,
        Notifications: [{ Code: "ERR_ROUTING", Message: "Invalid Aramex service type" }]
      });
    }
    try {
      const aramexRes = await fetchWithTimeout(`${baseUrl}${path3}`, {
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
        const data = JSON.parse(textData);
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
  return req.headers["x-noon-base-url"] || req.query.baseUrl || req.body && req.body.baseUrl || process.env.NOON_API_BASE_URL || "https://food-api-team.noonstg.team";
};
var getNoonApiKey = (req) => {
  const isProd2 = process.env.NODE_ENV === "production";
  const noonCreds = serverCourierCredentials?.noon?.[isProd2 ? "productionCreds" : "sandboxCreds"] || {};
  const envKey = noonCreds.apiKey || process.env.NOON_API_KEY;
  if (envKey) return envKey;
  const clientApiKey = req.headers["x-noon-api-key"] || req.query.apiKey || req.body && req.body.apiKey;
  if (clientApiKey && clientApiKey !== "noon_secret_key_123") return clientApiKey;
  return "";
};
var getNoonHeaders = (req, idempotencyKey) => {
  const apiKey2 = getNoonApiKey(req);
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-API-KEY": apiKey2
  };
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;
  return headers;
};
app.post("/api/courier/test-connection", import_express.default.json(), async (req, res) => {
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
  } catch (error) {
    return res.status(200).json({ success: false, error: error.message });
  }
});
app.post("/api/courier/rate", import_express.default.json(), async (req, res) => {
  try {
    const { courierId, payload, credentials, environment } = req.body;
    const engine = await getCourierEngine();
    const adapter = engine.getAdapter(courierId);
    const result = await adapter.calculateRate(payload, credentials, environment);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});
app.post("/api/courier/shipment", import_express.default.json(), async (req, res) => {
  try {
    const { courierId, payload, credentials, environment } = req.body;
    const engine = await getCourierEngine();
    const adapter = engine.getAdapter(courierId);
    const result = await adapter.createShipment(payload, credentials, environment);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});
app.post("/api/courier/track", import_express.default.json(), async (req, res) => {
  try {
    const { courierId, trackingId, credentials, environment } = req.body;
    const engine = await getCourierEngine();
    const adapter = engine.getAdapter(courierId);
    const result = await adapter.trackShipment(trackingId, credentials, environment);
    return res.json(result);
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});
app.post("/api/courier/cancel", import_express.default.json(), async (req, res) => {
  try {
    const { courierId, trackingId, credentials, environment } = req.body;
    const engine = await getCourierEngine();
    const adapter = engine.getAdapter(courierId);
    const result = await adapter.cancelShipment(trackingId, credentials, environment);
    return res.json({ success: result });
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});
app.get("/api/noon/pickup-points", async (req, res) => {
  try {
    const baseUrl = getNoonBaseUrl(req);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/pickup-points/list`, {
      method: "GET",
      headers: getNoonHeaders(req),
      signal: AbortSignal.timeout(1e4)
    });
    if (response.ok) return res.json(await response.json());
    return res.status(response.status).json({ error: `Noon API returned ${response.status}` });
  } catch (error) {
    return res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});
app.get("/api/noon/pickup-addresses", async (req, res) => {
  try {
    const baseUrl = getNoonBaseUrl(req);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/pickup-points/list`, {
      method: "GET",
      headers: getNoonHeaders(req),
      signal: AbortSignal.timeout(1e4)
    });
    if (response.ok) return res.json(await response.json());
    return res.status(response.status).json({ error: `Noon API returned ${response.status}` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/noon/pickup-points", async (req, res) => {
  try {
    const baseUrl = getNoonBaseUrl(req);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/pickup-points/create`, {
      method: "POST",
      headers: getNoonHeaders(req),
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(1e4)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.get("/api/noon/pickup-points/:code", async (req, res) => {
  try {
    const baseUrl = getNoonBaseUrl(req);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/pickup-points/${req.params.code}`, {
      method: "GET",
      headers: getNoonHeaders(req),
      signal: AbortSignal.timeout(1e4)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/noon/pickup-points/:code/update", async (req, res) => {
  try {
    const baseUrl = getNoonBaseUrl(req);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/pickup-points/${req.params.code}/update`, {
      method: "POST",
      headers: getNoonHeaders(req),
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(1e4)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
app.post("/api/noon/create-task", async (req, res) => {
  const params = req.body;
  try {
    const baseUrl = getNoonBaseUrl(req);
    const idempotencyKey = req.headers["x-idempotency-key"] || params.idempotencyKey || `usend-${params.order_reference || Date.now()}`;
    console.log(`[NoonProxy] NOON_TASK_CREATE_REQUEST to ${baseUrl}, idempotency: ${idempotencyKey}`);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/create-task`, {
      method: "POST",
      headers: getNoonHeaders(req, idempotencyKey),
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(15e3)
    });
    const text = await response.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "Noon returned non-JSON response", raw: text.substring(0, 200) });
    }
    if (response.ok) {
      console.log(`[NoonProxy] NOON_TASK_CREATE_SUCCESS`, data);
      return res.json(data);
    }
    console.error(`[NoonProxy] NOON_TASK_CREATE_FAILED HTTP ${response.status}`, data);
    return res.status(response.status).json(data);
  } catch (error) {
    console.error(`[NoonProxy] NOON_TASK_CREATE_FAILED network: ${error.message}`);
    return res.status(500).json({ error: `Connection failed: ${error.message}` });
  }
});
app.get("/api/noon/tasks/:mp_task_nr", async (req, res) => {
  const { mp_task_nr } = req.params;
  try {
    const baseUrl = getNoonBaseUrl(req);
    console.log(`[Noon Proxy] Fetching task details for ${mp_task_nr} from ${baseUrl}...`);
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/tasks/${mp_task_nr}`, {
      method: "GET",
      headers: getNoonHeaders(req),
      signal: AbortSignal.timeout(1e4)
    });
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
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
    const response = await fetchWithTimeout(`${baseUrl}/public/v1/tasks/${mp_task_nr}/cancel`, {
      method: "POST",
      headers: getNoonHeaders(req),
      body: JSON.stringify({ reason }),
      signal: AbortSignal.timeout(1e4)
    });
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
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
      let data = photoBase64;
      let mimeType = "image/jpeg";
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        data = matches[2];
      }
      parts.push({
        inlineData: {
          mimeType,
          data
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
var serverCourierCredentials = null;
async function startServer() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIRESTORE_EMULATOR_HOST) {
    try {
      dbAdmin.collection("private_settings").doc("courier_credentials").onSnapshot(
        (docSnap) => {
          if (docSnap.exists) {
            serverCourierCredentials = docSnap.data();
            console.log("[Firestore Sync] Loaded secure courier credentials from private_settings.");
          }
        },
        (err) => {
          console.error("[Firestore Sync] Failed to read private_settings/courier_credentials:", err.message);
        }
      );
      dbAdmin.collection("settings").doc("courier_configs").get().then((docSnap) => {
        if (!docSnap.exists) {
          const initialPublicConfigs = {
            aramex: {
              id: "aramex",
              name: "Aramex Express",
              status: "Active",
              currentMode: "production",
              baseUrlUat: "ws.aramex.net",
              baseUrlProd: "ws.aramex.net",
              connectionStatus: "UNTESTED"
            },
            noon: {
              id: "noon",
              name: "Noon Hyperlocal",
              status: "Active",
              currentMode: "sandbox",
              baseUrlUat: "https://food-api-team.noonstg.team",
              baseUrlProd: "https://food-api.noon.com",
              connectionStatus: "UNTESTED"
            }
          };
          const initialPrivateConfigs = {
            aramex: {
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
                username: "octman.sam@gmail.com",
                password: "#JohnSnow2027",
                accountNumber: "75788705",
                accountPin: "217147",
                accountEntity: "DXB",
                accountCountryCode: "AE",
                source: "0",
                version: "v1.0"
              }
            },
            noon: {
              sandboxCreds: {
                apiKey: "noon_secret_key_123",
                storeId: ""
              },
              productionCreds: {
                apiKey: "",
                storeId: ""
              }
            }
          };
          dbAdmin.collection("settings").doc("courier_configs").set(initialPublicConfigs).then(() => console.log("[Firestore Seed] Successfully initialized default public courier configurations.")).catch((err) => console.error("[Firestore Seed] Failed to set default public courier configs:", err.message));
          dbAdmin.collection("private_settings").doc("courier_credentials").get().then((privateSnap) => {
            if (!privateSnap.exists) {
              dbAdmin.collection("private_settings").doc("courier_credentials").set(initialPrivateConfigs).then(() => console.log("[Firestore Seed] Successfully initialized default private courier credentials."));
            }
          });
        }
      }).catch((err) => {
        console.warn("[Firestore Seed] Failed to read settings/courier_configs:", err.message);
      });
    } catch (err) {
      console.error("[Firestore Seed] Failed to initialize check:", err.message);
    }
  }
  const distPath = import_path2.default.join(process.cwd(), "dist");
  const distAdminPath = import_path2.default.join(process.cwd(), "dist-admin");
  if (!isProd) {
    const fs3 = await import("fs");
    const vite = await (0, import_vite.createServer)({
      configFile: import_path2.default.resolve(process.cwd(), "vite.config.ts"),
      mode: "development",
      server: {
        middlewareMode: true,
        watch: {
          ignored: ["**/node_modules/**", "**/.git/**", "**/.firebase/**"]
        }
      },
      appType: "custom"
      // Changed from 'spa' to 'custom' to handle multiple endpoints manually
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api") || req.originalUrl.includes(".")) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const templateFile = url.startsWith("/usendadmin2026") ? "admin.html" : "index.html";
        const templatePath = import_path2.default.resolve(process.cwd(), templateFile);
        let template = await fs3.promises.readFile(templatePath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }
  app.use("/src/assets", import_express.default.static(import_path2.default.join(process.cwd(), "src/assets")));
  app.use("/public", import_express.default.static(import_path2.default.join(process.cwd(), "public")));
  app.use("/assets", import_express.default.static(import_path2.default.join(process.cwd(), "public/assets")));
  app.use("/assets", import_express.default.static(import_path2.default.join(process.cwd(), "assets")));
  if (isProd) {
    app.use(import_express.default.static(distPath));
    app.use(import_express.default.static(distAdminPath));
    app.get("/api/internal/test-couriers", async (req, res) => {
      try {
        const engine = await getCourierEngine();
        const noonCredentials = serverCourierCredentials?.noon || {};
        const aramexCredentials = serverCourierCredentials?.aramex || {};
        let results = { noon: {}, aramex: {} };
        if (noonCredentials.test) {
          const result = await engine.getAdapter("noon").validateCredentials(noonCredentials.test, "sandbox");
          results.noon.sandbox = result;
        }
        if (noonCredentials.production) {
          const result = await engine.getAdapter("noon").validateCredentials(noonCredentials.production, "production");
          results.noon.production = result;
        }
        if (aramexCredentials.test) {
          const result = await engine.getAdapter("aramex").validateCredentials(aramexCredentials.test, "sandbox");
          results.aramex.sandbox = result;
        }
        if (aramexCredentials.production) {
          const result = await engine.getAdapter("aramex").validateCredentials(aramexCredentials.production, "production");
          results.aramex.production = result;
        }
        res.json(results);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });
    app.get("/api/internal/collections", async (req, res) => {
      try {
        const collections = await getDbAdmin().listCollections();
        res.json(collections.map((c) => c.id));
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });
    app.post("/api/internal/delete-collection/:name", async (req, res) => {
      try {
        const name = req.params.name;
        if (name === "users" || name === "webhooks" || name === "private_settings") {
          return res.status(403).json({ error: "Cannot delete protected collection" });
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
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      if (req.path.startsWith("/usendadmin2026")) {
        return res.sendFile(import_path2.default.join(distAdminPath, "admin.html"));
      }
      res.sendFile(import_path2.default.join(distPath, "index.html"));
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
  startServer().catch((err) => console.error("[Server Boot Error]:", err));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
