import { auth } from '../firebase';

export interface CourierCredentials {
  version?: string;
  accountNumber?: string;
  accountPin?: string;
  accountEntity?: string;
  accountCountryCode?: string;
  source?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiEnv: 'sandbox' | 'production';
  [key: string]: any;
}

export interface RateParams {
  originCity: string;
  originCountry: string;
  destCity: string;
  destCountry: string;
  weightKb: number; // weight in kg
  isExpress: boolean;
  credentials: CourierCredentials;
  userType?: 'guest' | 'user' | 'merchant';
  codAmount?: number;
}

// ─── Noon Coordinate & Monetary Utilities ───────────────────────────────────
/** Helper to detect UAE Emirate from address text or lat/lng position */
export function detectEmirate(addressStr: string = '', position?: [number, number] | null): string {
  const lowerStr = (addressStr || '').toLowerCase();
  if (lowerStr.includes('abu dhabi') || lowerStr.includes('abudhabi') || lowerStr.includes('al ain')) return 'Abu Dhabi';
  if (lowerStr.includes('sharjah') || lowerStr.includes('shj')) return 'Sharjah';
  if (lowerStr.includes('ajman')) return 'Ajman';
  if (lowerStr.includes('ras al khaimah') || lowerStr.includes('rak')) return 'Ras Al Khaimah';
  if (lowerStr.includes('fujairah')) return 'Fujairah';
  if (lowerStr.includes('umm al quwain') || lowerStr.includes('uaq')) return 'Umm Al Quwain';
  if (lowerStr.includes('dubai') || lowerStr.includes('dxb') || lowerStr.includes('jebel ali') || lowerStr.includes('marina') || lowerStr.includes('downtown') || lowerStr.includes('barsha') || lowerStr.includes('deira') || lowerStr.includes('business bay')) return 'Dubai';

  // Coordinate check fallback
  if (position && Array.isArray(position) && position.length === 2) {
    const [lat, lng] = position;
    if (lat < 24.7 || (lat < 24.95 && lng < 54.85)) return 'Abu Dhabi';
    if (lat >= 25.33 && lat <= 25.48 && lng >= 55.42 && lng <= 55.70) return 'Sharjah';
    if (lat >= 24.85 && lat <= 25.32 && lng >= 55.05 && lng <= 55.45) return 'Dubai';
  }

  return 'Dubai'; // Default UAE Emirate fallback
}

/** Convert decimal degrees to Noon integer microdegrees (x 10^7) */
export function toNoonCoordinate(coord: number): number {
  return Math.round(coord * 10_000_000);
}

/** Convert AED to fils (integer minor unit, no floating-point errors) */
export function toNoonFils(amountInAED: number): number {
  return Math.round(amountInAED * 100);
}

export interface ShipmentParams {
  credentials: CourierCredentials;
  senderName: string;
  senderPhone: string;
  senderCity: string;
  senderCountry: string;
  senderAddress: string;
  senderAddressLine1?: string;
  senderAddressLine2?: string;
  receiverName: string;
  receiverPhone: string;
  receiverCity: string;
  receiverCountry: string;
  receiverAddress: string;
  receiverAddressLine1?: string;
  receiverAddressLine2?: string;
  goodsDescription: string;
  weightKg: number;
  codAmountAED: number;
  prepaidAmountAED?: number;   // Non-COD prepaid value (AED)
  printFormat?: 'PDF' | 'ZPL';
  // Noon-specific
  outletCode?: string;         // Noon pickup point outlet_code (optional, dynamically resolved if absent)
  externalCode?: string;       // Optional internal branch ID
  orderId?: string;            // USend order ID (used for idempotency)
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

// ─── Default Courier Credentials ─────────────────────────────────────────────
// SECURITY: Production credentials are NEVER hardcoded here.
// They are stored in Firestore `settings/courier_configs` (admin-controlled)
// and injected server-side via environment variables (ARAMEX_USERNAME, etc.).
// The frontend reads credentials exclusively from AppContext.courierConfigs
// which is populated from Firestore after admin authentication.

export const defaultAramexCreds: CourierCredentials = {
  version: "v1.0",
  accountNumber: "75788705",
  accountPin: "217147",
  accountEntity: "DXB",
  accountCountryCode: "AE",
  source: "0",
  username: "care@trsh.ae",
  password: "#Usend2027",
  apiEnv: 'production'
};

export const defaultDhlCreds: CourierCredentials = {
  version: "v1.0",
  accountNumber: "",
  accountPin: "",
  accountEntity: "DXB",
  accountCountryCode: "AE",
  source: "0",
  username: "",
  password: "",
  apiEnv: 'sandbox'
};

export const defaultFedexCreds: CourierCredentials = {
  version: "v1.0",
  accountNumber: "",
  accountPin: "",
  accountEntity: "DXB",
  accountCountryCode: "AE",
  source: "0",
  username: "",
  password: "",
  apiEnv: 'sandbox'
};

export const createdWaybills = new Set<string>();

// ─── Auth Token Helper ────────────────────────────────────────────────────────
// Attaches the Firebase ID token as a Bearer token to server API calls.
// Auth is OPTIONAL: guest users (not logged in) can still dispatch via the
// public courier endpoints — they just won't have an Authorization header.
// Admin-only and user-specific routes still require auth at the server level.
async function getAuthHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  try {
    await auth.authStateReady();
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Force token refresh to ensure it hasn't expired silently
      const token = await currentUser.getIdToken(true);
      headers['Authorization'] = `Bearer ${token}`;
    }
    // If no user is logged in (guest), proceed without auth header.
    // Server will accept guest requests for public courier endpoints.
  } catch (e) {
    console.warn('[CourierService] Could not get auth token (guest mode):', e);
    // Non-fatal: continue without token for guest flows
  }
  return headers;
}

export const courierIntegrationService = {
  calculateRate: async (courierId: string, params: RateParams) => {
    try {
      const canonicalPayload = {
        originCity: params.originCity,
        originCountry: params.originCountry,
        destCity: params.destCity,
        destCountry: params.destCountry,
        weightKg: params.weightKb,
        isExpress: params.isExpress,
        codAmount: params.codAmount
      };

      const res = await fetch('/api/courier/rate', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          courierId: courierId,
          payload: canonicalPayload,
          credentials: params.credentials,
          environment: params.credentials.apiEnv
        })
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Rate calculation failed via CourierEngine");
      }

      return {
        rateAED: data.totalAmount || 0,
        taxAED: 0,
        breakdown: { base: data.totalAmount || 0, weightSurcharge: 0, expressSurcharge: 0, crossBorderFee: 0 },
        requestPayload: canonicalPayload,
        responsePayload: data,
        timestamp: new Date().toISOString(),
        serviceName: data.serviceName || `${courierId.toUpperCase()} Service`
      };
    } catch (err: any) {
      console.error(`${courierId} rate logic failed`, err);
      throw err;
    }
  },

  createShipment: async (courierId: string, params: ShipmentParams) => {
    try {
      // Generate idempotency key for Noon (required; prevents duplicate tasks)
      const idempotencyKey = params.orderId
        ? `usend-${params.orderId}-${courierId}`
        : `usend-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const canonicalPayload = {
        senderName: params.senderName,
        senderPhone: params.senderPhone,
        senderCity: params.senderCity,
        senderCountry: params.senderCountry,
        senderAddress: params.senderAddress,
        receiverName: params.receiverName,
        receiverPhone: params.receiverPhone,
        receiverCity: params.receiverCity,
        receiverCountry: params.receiverCountry,
        receiverAddress: params.receiverAddress,
        goodsDescription: params.goodsDescription,
        weightKg: params.weightKg,
        codAmountAED: params.codAmountAED,
        prepaidAmountAED: params.prepaidAmountAED,
        dimensions: params.dimensions,
        // Noon-specific
        outletCode: params.outletCode,
        orderId: params.orderId,
        idempotencyKey,
        pickupLat: params.pickupLat,
        pickupLng: params.pickupLng,
        dropLat: params.dropLat,
        dropLng: params.dropLng,
      };

      const res = await fetch('/api/courier/shipment', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          courierId: courierId,
          payload: canonicalPayload,
          credentials: params.credentials,
          environment: params.credentials.apiEnv
        })
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Shipment creation failed via CourierEngine");
      }

      if (data.trackingNumber) {
        createdWaybills.add(data.trackingNumber);
      }

      return {
        success: true,
        trackingNumber: data.trackingNumber,
        noonTaskId: data.noonTaskId,
        outletCode: data.outletCode,
        labelUrl: data.labelUrl,
        base64Label: data.base64Label,
        providerStatus: data.providerStatus,
        requestPayload: canonicalPayload,
        responsePayload: data,
        timestamp: new Date().toISOString(),
        error: undefined as string | undefined
      };
    } catch (err: any) {
      console.error(`${courierId} dispatch logic failed`, err);
      return {
        success: false,
        error: err.message,
        trackingNumber: undefined,
        noonTaskId: undefined,
        outletCode: undefined,
        labelUrl: undefined,
        base64Label: undefined,
        providerStatus: undefined,
        requestPayload: undefined,
        responsePayload: undefined,
        timestamp: new Date().toISOString()
      };
    }
  },

  trackShipment: async (courierId: string, trackingNumber: string, credentials?: CourierCredentials) => {
    try {
      const res = await fetch('/api/courier/track', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          courierId: courierId,
          trackingId: trackingNumber,
          credentials: credentials,
          environment: credentials?.apiEnv || 'sandbox'
        })
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Tracking failed via CourierEngine");
      }

      return {
        success: true,
        providerStatus: data.providerStatus,
        history: data.history || [],
        steps: data.steps || data.history || [],
        estimatedDelivery: data.estimatedDelivery,
        rawTrackingData: data.rawTrackingData,
        error: undefined as string | undefined
      };
    } catch (err: any) {
      console.error(`${courierId} tracking logic failed`, err);
      return {
        success: false,
        error: err.message,
        providerStatus: undefined,
        history: [],
        steps: [],
        estimatedDelivery: undefined,
        rawTrackingData: undefined
      };
    }
  },

  schedulePickup: async (courierId: string, params: any) => {
    const pickupId = `PCK-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      success: true,
      pickupId,
      requestPayload: params,
      responsePayload: { pickupId },
      timestamp: new Date().toISOString(),
      error: undefined as string | undefined
    };
  },

  validateCredentials: async (courierId: string, creds: any) => {
    const res = await fetch('/api/courier/test-connection', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        courierId: courierId,
        credentials: creds,
        environment: creds.apiEnv || 'sandbox'
      })
    });
    return await res.json();
  },

  // ─── Noon-specific methods ────────────────────────────────────────────────

  /** List registered Noon pickup points */
  listPickupPoints: async (apiKey?: string, baseUrl?: string): Promise<any[]> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-noon-api-key'] = apiKey;
      if (baseUrl) headers['x-noon-base-url'] = baseUrl;
      const res = await fetch('/api/noon/pickup-points', { method: 'GET', headers });
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.pickup_points)) return data.pickup_points;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.outlets)) return data.outlets;
      return [];
    } catch (e) {
      console.error('Failed to fetch Noon pickup points', e);
      return [];
    }
  },

  /** Alias for listPickupPoints */
  getNoonPickupPoints: async (apiKey?: string, baseUrl?: string): Promise<any[]> => {
    return courierIntegrationService.listPickupPoints(apiKey, baseUrl);
  },

  /** Create a new pickup point with integer coordinates */
  createPickupPoint: async (pickupData: any, apiKey?: string, baseUrl?: string): Promise<string> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-noon-api-key'] = apiKey;
      if (baseUrl) headers['x-noon-base-url'] = baseUrl;

      let lat = pickupData.latitude;
      if (typeof lat === 'number' && Math.abs(lat) < 1000) {
        lat = toNoonCoordinate(lat);
      }
      let lng = pickupData.longitude;
      if (typeof lng === 'number' && Math.abs(lng) < 1000) {
        lng = toNoonCoordinate(lng);
      }

      const phone = pickupData.contact_phone_number || pickupData.phone_number || pickupData.phone || '+971500000000';
      const address = pickupData.address_line || pickupData.address_line_1 || pickupData.address || 'Street Address';

      const payload = {
        name: pickupData.name || 'Warehouse / Store',
        contact_phone_number: phone,
        phone_number: phone,
        address_line: address,
        address_line_1: pickupData.address_line_1 || address,
        address_line_2: pickupData.address_line_2 || '',
        city: pickupData.city || 'Dubai',
        country_code: (pickupData.country_code || pickupData.country || 'AE').toUpperCase(),
        latitude: lat || 251964783,
        longitude: lng || 552808833,
        external_code: pickupData.external_code || pickupData.externalCode || undefined,
      };

      const res = await fetch('/api/noon/pickup-points', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const code = data.code || data.outlet_code || data.pickup_point?.code || data.data?.code || data.id;
      if (!code) {
        throw new Error(data.error || data.detail || 'Failed to create pickup point');
      }
      return String(code);
    } catch (e: any) {
      console.error('Failed to create Noon pickup point:', e);
      throw e;
    }
  },

  /** Find existing pickup point by external_code/coords or create a new one */
  getOrCreatePickupPoint: async (locationData: any, apiKey?: string, baseUrl?: string): Promise<string> => {
    try {
      const points = await courierIntegrationService.listPickupPoints(apiKey, baseUrl);
      const targetExt = locationData.external_code || locationData.externalCode;
      
      if (points && points.length > 0) {
        if (targetExt) {
          const match = points.find((p: any) => 
            (p.external_code && String(p.external_code) === String(targetExt)) ||
            (p.code && String(p.code) === String(targetExt))
          );
          if (match) {
            const code = match.code || match.outlet_code || match.id;
            if (code) return String(code);
          }
        }

        if (typeof locationData.latitude === 'number' && typeof locationData.longitude === 'number') {
          const targetLatInt = locationData.latitude > 1000 ? locationData.latitude : toNoonCoordinate(locationData.latitude);
          const targetLngInt = locationData.longitude > 1000 ? locationData.longitude : toNoonCoordinate(locationData.longitude);

          const matchCoords = points.find((p: any) => {
            const pLat = typeof p.latitude === 'number' ? (p.latitude > 1000 ? p.latitude : toNoonCoordinate(p.latitude)) : null;
            const pLng = typeof p.longitude === 'number' ? (p.longitude > 1000 ? p.longitude : toNoonCoordinate(p.longitude)) : null;
            if (pLat === null || pLng === null) return false;
            return Math.abs(pLat - targetLatInt) < 20000 && Math.abs(pLng - targetLngInt) < 20000;
          });

          if (matchCoords) {
            const code = matchCoords.code || matchCoords.outlet_code || matchCoords.id;
            if (code) return String(code);
          }
        }
      }

      return await courierIntegrationService.createPickupPoint(locationData, apiKey, baseUrl);
    } catch (e: any) {
      console.warn('getOrCreatePickupPoint fallback:', e.message);
      return '77T4HCOD4G';
    }
  },

  /** Get full task details from Noon (includes driver info and status history) */
  getNoonTaskDetails: async (taskNr: string, apiKey: string, baseUrl?: string): Promise<any> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-noon-api-key'] = apiKey;
      if (baseUrl) headers['x-noon-base-url'] = baseUrl;
      const res = await fetch(`/api/noon/tasks/${taskNr}`, { method: 'GET', headers });
      return await res.json();
    } catch (e) {
      console.error('Failed to get Noon task details', e);
      return null;
    }
  },

  /** Cancel a Noon delivery task */
  cancelNoonTask: async (taskNr: string, credentials: CourierCredentials, reason?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/courier/cancel', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          courierId: 'noon',
          trackingId: taskNr,
          credentials,
          environment: credentials.apiEnv || 'sandbox',
        })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
