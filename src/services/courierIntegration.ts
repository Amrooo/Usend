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

export interface ShipmentParams {
  credentials: CourierCredentials;
  senderName: string;
  senderPhone: string;
  senderCity: string;
  senderCountry: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverCity: string;
  receiverCountry: string;
  receiverAddress: string;
  goodsDescription: string;
  weightKg: number;
  codAmountAED: number;
  prepaidAmountAED?: number;   // Non-COD prepaid value (AED)
  printFormat?: 'PDF' | 'ZPL';
  // Noon-specific
  outletCode?: string;         // Noon pickup point outlet_code
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

export const defaultAramexCreds: CourierCredentials = {
  version: "v1",
  accountNumber: "45796",
  accountPin: "116216",
  accountEntity: "DXB",
  accountCountryCode: "AE",
  source: "24",
  username: "testingapi@aramex.com",
  password: "R123456789$r",
  apiEnv: 'sandbox'
};

export const defaultDhlCreds: CourierCredentials = {
  version: "v33",
  accountNumber: "849301931-DXB",
  accountPin: "902123",
  accountEntity: "MIDDLE_EAST",
  accountCountryCode: "AE",
  source: "30",
  username: "dhl_sandbox_user_ae",
  password: "DHL_secret_2026",
  apiEnv: 'sandbox'
};

export const defaultFedexCreds: CourierCredentials = {
  version: "v2026",
  accountNumber: "990158221",
  accountPin: "FDX-3029",
  accountEntity: "GCC_FEDEX",
  accountCountryCode: "AE",
  source: "45",
  username: "fedex_api_express_sandbox",
  password: "FedexSecuredPwd_9901",
  apiEnv: 'sandbox'
};

export const createdWaybills = new Set<string>();

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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierId: courierId,
          credentials: creds,
          environment: creds.apiEnv || 'sandbox'
        })
      });
      return await res.json();
  },

  // ─── Noon-specific methods ────────────────────────────────────────────────

  /** Fetch all Noon pickup points for the configured environment */
  getNoonPickupPoints: async (apiKey: string, baseUrl?: string): Promise<any[]> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-noon-api-key'] = apiKey;
      if (baseUrl) headers['x-noon-base-url'] = baseUrl;
      const res = await fetch('/api/noon/pickup-points', { method: 'GET', headers });
      const data = await res.json();
      // Noon returns an array directly or { pickup_points: [...] }
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.pickup_points)) return data.pickup_points;
      return [];
    } catch (e) {
      console.error('Failed to fetch Noon pickup points', e);
      return [];
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
        headers: { 'Content-Type': 'application/json' },
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
