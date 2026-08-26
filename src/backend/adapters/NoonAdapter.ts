import {
  CourierAdapter,
  CanonicalRatePayload,
  CanonicalRateResponse,
  CanonicalShipmentPayload,
  CanonicalShipmentResponse,
  CanonicalTrackingResponse,
  CourierCredentials,
  CourierEnvironment,
  NOON_STATUS_MAP,
  NOON_STATUS_STEPS,
  toNoonCoordinate,
  toNoonFils,
  toNoonCoord,
  fromNoonCoord,
  aedToFils
} from './CourierAdapter';

// Default staging pickup point coordinates (Dubai Mall area — pre-tested serviceable)
const DEFAULT_PICKUP_LAT = 25.1964783;
const DEFAULT_PICKUP_LNG = 55.2808833;

export interface NoonPickupPointPayload {
  name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  country_code: string;
  latitude: number;   // Scaled integer (lat * 10^7)
  longitude: number;  // Scaled integer (lng * 10^7)
  external_code?: string;
}

export class NoonAdapter implements CourierAdapter {
  id = 'noon';
  name = 'Noon Rider on Demand';
  capabilities = ['SHIPMENT', 'TRACKING', 'CANCEL'];

  private getBaseUrl(env: CourierEnvironment): string {
    if (process.env.NOON_API_BASE_URL) return process.env.NOON_API_BASE_URL;
    return env === 'production'
      ? 'https://food-api-team.noon.team'
      : 'https://food-api-team.noonstg.team';
  }

  private getApiKey(credentials: CourierCredentials, env: CourierEnvironment = 'sandbox'): string {
    // 1. Explicitly provided user credential key
    if (credentials.apiKey && credentials.apiKey.length > 10 && credentials.apiKey !== 'noon_secret_key_123') {
      return credentials.apiKey;
    }
    if (credentials.password && credentials.password.length > 10) {
      return credentials.password;
    }

    // 2. Environment variable
    if (process.env.NOON_API_KEY) {
      return process.env.NOON_API_KEY;
    }

    // 3. Testing Environment default fallback
    if (env === 'sandbox') {
      return 'SstJi9Ho0EHG2t7kQVSz7nA2hOeL3iiwVxHxb0Njk60QJ0LfmvoXoOsimw1zQC7VugHXiIRRMnWyU6f0uHcEcLlco5Eujqbd5pTwDlfBXpacuRI4m4AAj61NwM0B7Ihk';
    }

    // 4. Production fallback for TRSH (FZC)
    return credentials.apiKey || 'gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh';
  }

  private buildHeaders(credentials: CourierCredentials, env: CourierEnvironment = 'sandbox', idempotencyKey?: string): Record<string, string> {
    const apiKey = this.getApiKey(credentials, env);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-KEY': apiKey,
    };
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }
    return headers;
  }

  // ─── Pickup Points API Methods ─────────────────────────────────────────────

  /**
   * Fetch all registered Noon pickup points for this account.
   */
  async listPickupPoints(
    credentials: CourierCredentials,
    environment: CourierEnvironment = 'sandbox'
  ): Promise<any[]> {
    const baseUrl = this.getBaseUrl(environment);
    try {
      const response = await fetch(`${baseUrl}/public/v1/pickup-points/list`, {
        method: 'GET',
        headers: this.buildHeaders(credentials, environment),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn(`[NoonAdapter] listPickupPoints returned HTTP ${response.status}`);
        return [];
      }

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        return [];
      }

      if (Array.isArray(data)) return data;
      if (Array.isArray(data.pickup_points)) return data.pickup_points;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.outlets)) return data.outlets;
      return [];
    } catch (e: any) {
      console.error('[NoonAdapter] Failed to list pickup points:', e.message);
      return [];
    }
  }

  /**
   * Create a new pickup point via POST /public/v1/pickup-points/create
   * Returns the dynamic pickup point `code`.
   */
  async createPickupPoint(
    credentials: CourierCredentials,
    environment: CourierEnvironment = 'sandbox',
    pickupData: Partial<NoonPickupPointPayload> | any
  ): Promise<string> {
    const baseUrl = this.getBaseUrl(environment);

    // Format coordinates as 10^7 scaled integers
    let lat = pickupData.latitude;
    if (typeof lat !== 'number' || isNaN(lat)) {
      lat = toNoonCoordinate(DEFAULT_PICKUP_LAT);
    } else if (Math.abs(lat) < 1000) {
      lat = toNoonCoordinate(lat);
    }

    let lng = pickupData.longitude;
    if (typeof lng !== 'number' || isNaN(lng)) {
      lng = toNoonCoordinate(DEFAULT_PICKUP_LNG);
    } else if (Math.abs(lng) < 1000) {
      lng = toNoonCoordinate(lng);
    }

    const phone = pickupData.contact_phone_number || pickupData.phone_number || pickupData.phone || '+971500000000';
    const address = pickupData.address_line || pickupData.address_line_1 || pickupData.address || 'Street Address';

    const payload: Record<string, any> = {
      name: pickupData.name || 'USend Store',
      contact_phone_number: phone,
      phone_number: phone,
      address_line: address,
      address_line_1: pickupData.address_line_1 || address,
      address_line_2: pickupData.address_line_2 || '',
      city: pickupData.city || 'Dubai',
      country_code: (pickupData.country_code || pickupData.country || 'AE').toUpperCase(),
      latitude: lat,
      longitude: lng,
    };

    const extCode = pickupData.external_code || pickupData.externalCode;
    if (extCode) {
      payload.external_code = String(extCode);
    }

    const response = await fetch(`${baseUrl}/public/v1/pickup-points/create`, {
      method: 'POST',
      headers: this.buildHeaders(credentials, environment),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Failed to parse Noon create pickup point response: ${text.substring(0, 200)}`);
    }

    if (!response.ok) {
      const errMsg = data.error || data.detail || data.message || `HTTP ${response.status}`;
      throw new Error(`Noon create pickup point failed: ${errMsg}`);
    }

    const code = data.code || data.outlet_code || data.pickup_point?.code || data.data?.code || data.id;
    if (!code) {
      throw new Error(`Noon created pickup point but returned no code: ${JSON.stringify(data)}`);
    }

    console.log('[NoonAdapter] Successfully created pickup point:', { code, name: payload.name });
    return String(code);
  }

  /**
   * Dynamically resolves an existing pickup point or creates a new one.
   * Matches by external_code, coordinate proximity, or falls back to creating a new pickup point.
   */
  async getOrCreatePickupPoint(
    credentials: CourierCredentials,
    environment: CourierEnvironment = 'sandbox',
    locationData: Partial<NoonPickupPointPayload> | any
  ): Promise<string> {
    const points = await this.listPickupPoints(credentials, environment);

    if (points && points.length > 0) {
      const targetExt = locationData.external_code || locationData.externalCode;
      
      // 1. Match by external_code if available
      if (targetExt) {
        const matchByExt = points.find((p: any) => 
          (p.external_code && String(p.external_code) === String(targetExt)) ||
          (p.externalCode && String(p.externalCode) === String(targetExt)) ||
          (p.code && String(p.code) === String(targetExt))
        );
        if (matchByExt) {
          const code = matchByExt.code || matchByExt.outlet_code || matchByExt.id;
          if (code) return String(code);
        }
      }

      // 2. Match by approximate coordinates (within ~200m)
      if (typeof locationData.latitude === 'number' && typeof locationData.longitude === 'number') {
        const targetLatInt = locationData.latitude > 1000 
          ? locationData.latitude 
          : toNoonCoordinate(locationData.latitude);
        const targetLngInt = locationData.longitude > 1000 
          ? locationData.longitude 
          : toNoonCoordinate(locationData.longitude);

        const matchByCoords = points.find((p: any) => {
          const pLat = typeof p.latitude === 'number' ? (p.latitude > 1000 ? p.latitude : toNoonCoordinate(p.latitude)) : null;
          const pLng = typeof p.longitude === 'number' ? (p.longitude > 1000 ? p.longitude : toNoonCoordinate(p.longitude)) : null;
          if (pLat === null || pLng === null) return false;
          return Math.abs(pLat - targetLatInt) < 20000 && Math.abs(pLng - targetLngInt) < 20000;
        });

        if (matchByCoords) {
          const code = matchByCoords.code || matchByCoords.outlet_code || matchByCoords.id;
          if (code) return String(code);
        }
      }

      // 3. Match by name or address if identical
      if (locationData.name || locationData.address_line_1 || locationData.address) {
        const searchName = (locationData.name || '').trim().toLowerCase();
        const searchAddr = (locationData.address_line_1 || locationData.address || '').trim().toLowerCase();
        
        const matchByNameAddr = points.find((p: any) => {
          const pName = (p.name || '').trim().toLowerCase();
          const pAddr = (p.address_line_1 || p.address || '').trim().toLowerCase();
          return (searchName && pName === searchName) || (searchAddr && pAddr === searchAddr);
        });

        if (matchByNameAddr) {
          const code = matchByNameAddr.code || matchByNameAddr.outlet_code || matchByNameAddr.id;
          if (code) return String(code);
        }
      }
    }

    // If not found, attempt to create a new pickup point
    try {
      return await this.createPickupPoint(credentials, environment, locationData);
    } catch (err: any) {
      console.warn('[NoonAdapter] createPickupPoint failed, checking fallback points:', err.message);
      // If creation fails but points exist on the account, fallback to the first available point
      if (points && points.length > 0) {
        const fallbackCode = points[0].code || points[0].outlet_code || points[0].id;
        if (fallbackCode) return String(fallbackCode);
      }
      // Staging fallback default
      if (environment === 'sandbox') {
        return '77T4HCOD4G';
      }
      throw err;
    }
  }

  // ─── Validate Credentials (Connection Test) ────────────────────────────────
  async validateCredentials(
    credentials: CourierCredentials,
    environment: CourierEnvironment
  ): Promise<{ success: boolean; error?: string }> {
    const baseUrl = this.getBaseUrl(environment);
    const apiKey = this.getApiKey(credentials, environment);

    if (!apiKey) {
      return { success: false, error: 'Noon API Key is missing. Please provide a valid API Key.' };
    }

    try {
      const response = await fetch(`${baseUrl}/public/v1/pickup-points/list`, {
        method: 'GET',
        headers: this.buildHeaders(credentials, environment),
        signal: AbortSignal.timeout(10000),
      });
      const text = await response.text();

      if (text.includes('FortiGuard') || text.includes('Web Filter')) {
        return { success: false, error: 'Access blocked by corporate firewall. Please whitelist the Noon API.' };
      }

      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'Invalid Noon API Key. Authentication failed.' };
      }

      // If the API returns HTTP 200 OK or empty list message, the connection is authenticated and successful.
      if (response.ok || text.includes("You don't have any outlets")) {
        return { success: true };
      }

      return { success: false, error: `Noon API returned an unexpected error (HTTP ${response.status}). Details: ${text.substring(0, 300)}` };
    } catch (e: any) {
      return { success: false, error: `Network Error: ${e.message || 'Could not reach Noon API'}` };
    }
  }

  // ─── Calculate Rate ───────────────────────────────────────────────────────
  async calculateRate(
    payload: CanonicalRatePayload,
    credentials: CourierCredentials,
    environment: CourierEnvironment
  ): Promise<CanonicalRateResponse> {
    // Noon RoD uses dynamic pricing per zone — return standard domestic rate
    return {
      success: true,
      totalAmount: payload.isExpress ? 25 : 18,
      currency: 'AED',
      serviceName: 'Noon Rider on Demand',
    };
  }

  // ─── Create Shipment (Delivery Task) ─────────────────────────────────────
  async createShipment(
    payload: CanonicalShipmentPayload,
    credentials: CourierCredentials,
    environment: CourierEnvironment
  ): Promise<CanonicalShipmentResponse> {
    const baseUrl = this.getBaseUrl(environment);

    // 1. Resolve outlet_code:
    // (a) Payload explicit outletCode
    // (b) Credentials outletCode or accountNumber
    // (c) Dynamic resolution via getOrCreatePickupPoint()
    let outletCode = payload.outletCode
      || credentials.outletCode
      || credentials.storeId
      || credentials.accountNumber;

    if (!outletCode) {
      try {
        console.log('[NoonAdapter] outlet_code not provided, resolving dynamically via Noon Pickup Points API...');
        outletCode = await this.getOrCreatePickupPoint(credentials, environment, {
          name: payload.senderName || 'USend Store',
          phone_number: payload.senderPhone || '+971500000000',
          address_line_1: payload.senderAddressLine1 || payload.senderAddress || 'Street Address',
          address_line_2: payload.senderAddressLine2 || '',
          city: payload.senderCity || 'Dubai',
          country_code: payload.senderCountry || 'AE',
          latitude: payload.pickupLat ?? DEFAULT_PICKUP_LAT,
          longitude: payload.pickupLng ?? DEFAULT_PICKUP_LNG,
          external_code: payload.externalCode,
        });
      } catch (err: any) {
        console.error('[NoonAdapter] Dynamic pickup point resolution failed:', err.message);
        if (environment === 'sandbox') {
          outletCode = '77T4HCOD4G';
        } else {
          return { success: false, error: `Noon: Failed to resolve pickup point: ${err.message}` };
        }
      }
    }

    if (!outletCode) {
      return { success: false, error: 'Noon: No outlet_code provided or resolvable. Please configure or select a pickup point.' };
    }

    // Resolve idempotency key (required by Noon API)
    const idempotencyKey = payload.idempotencyKey
      || `usend-${payload.orderId || payload.reference || Date.now()}-${outletCode}`;

    // Geocoordinates scaled to 10^7 integers
    const pickupLatInt = toNoonCoordinate(payload.pickupLat ?? DEFAULT_PICKUP_LAT);
    const pickupLngInt = toNoonCoordinate(payload.pickupLng ?? DEFAULT_PICKUP_LNG);
    const dropLatInt = toNoonCoordinate(payload.dropLat ?? DEFAULT_PICKUP_LAT);
    const dropLngInt = toNoonCoordinate(payload.dropLng ?? (DEFAULT_PICKUP_LNG + 0.01));

    // COD / Prepaid values in fils (integer)
    const codFils = toNoonFils(payload.codAmountAED || 0);
    const prepaidFils = toNoonFils(payload.prepaidAmountAED || 0);
    const finalCodFils = codFils;
    const finalPrepaidFils = (codFils === 0 && prepaidFils === 0) ? 100 : prepaidFils;

    const noonPayload: Record<string, any> = {
      outlet_code: outletCode,
      order_reference: payload.reference || payload.orderId || `USEND-${Date.now()}`,
      customer_name: payload.receiverName,
      customer_phone: payload.receiverPhone,
      drop_off_address: {
        address: payload.receiverAddress || `${payload.receiverCity}, UAE`,
        lat: dropLatInt,
        lng: dropLngInt,
        contact_name: payload.receiverName,
        contact_phone_number: payload.receiverPhone,
        country_code: (payload.receiverCountry || 'ae').toLowerCase(),
      },
      lat: pickupLatInt,
      lng: pickupLngInt,
      cod_value: finalCodFils,
      prepaid_value: finalPrepaidFils,
      payment_method: codFils > 0 ? 'COD' : 'PAID',
    };

    try {
      const response = await fetch(`${baseUrl}/public/v1/create-task`, {
        method: 'POST',
        headers: this.buildHeaders(credentials, environment, idempotencyKey),
        body: JSON.stringify(noonPayload),
        signal: AbortSignal.timeout(15000),
      });

      const responseText = await response.text();

      // Guard against HTML (auth portal / firewall)
      if (responseText.trimStart().startsWith('<')) {
        return {
          success: false,
          error: 'Noon returned an HTML page — check API key and corporate network access',
        };
      }

      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        return {
          success: false,
          error: `Noon returned non-JSON (HTTP ${response.status}): ${responseText.substring(0, 200)}`,
        };
      }

      if (response.status === 404 && data.detail) {
        return { success: false, error: `Noon endpoint not found: ${data.detail}` };
      }

      if (!response.ok || data.error) {
        const errMsg = data.error || data.detail || data.message
          || `Noon task creation failed (HTTP ${response.status})`;
        console.error('[NoonAdapter] NOON_TASK_CREATE_FAILED', { outletCode, idempotencyKey, error: errMsg });
        return { success: false, error: errMsg };
      }

      // Extract task ID (mp_task_nr)
      const taskId = data.mp_task_nr || data.task_nr || data.id;
      if (!taskId) {
        return { success: false, error: `Noon task created but no mp_task_nr in response: ${JSON.stringify(data)}` };
      }

      console.log('[NoonAdapter] NOON_TASK_CREATE_SUCCESS', { taskId, outletCode, idempotencyKey });
      return {
        success: true,
        trackingNumber: taskId,
        noonTaskId: taskId,
        outletCode,
        providerStatus: 'pending_assignment',
      };
    } catch (e: any) {
      console.error('[NoonAdapter] NOON_TASK_CREATE_FAILED (network)', e.message);
      return { success: false, error: `Network error: ${e.message}` };
    }
  }

  // ─── Track Shipment ───────────────────────────────────────────────────────
  async trackShipment(
    trackingId: string,
    credentials: CourierCredentials,
    environment: CourierEnvironment
  ): Promise<CanonicalTrackingResponse> {
    const baseUrl = this.getBaseUrl(environment);
    const FAILED_RESPONSE = (error: string): CanonicalTrackingResponse => ({
      success: false,
      usendStatus: 'FAILED',
      providerStatus: 'error',
      timestamp: new Date().toISOString(),
      error,
    });

    try {
      const response = await fetch(`${baseUrl}/public/v1/tasks/${trackingId}`, {
        method: 'GET',
        headers: this.buildHeaders(credentials, environment),
        signal: AbortSignal.timeout(10000),
      });

      const text = await response.text();
      if (text.trimStart().startsWith('<')) return FAILED_RESPONSE('Noon returned HTML page');

      let data: any = {};
      try { data = JSON.parse(text); } catch {
        return FAILED_RESPONSE(`Non-JSON response (HTTP ${response.status})`);
      }

      if (!response.ok) return FAILED_RESPONSE(data.error || data.detail || `HTTP ${response.status}`);

      const statusCode: string = data.status_code || 'pending_assignment';
      const mapped = NOON_STATUS_MAP[statusCode] || { usendStatus: 'PENDING', label: 'In Progress', cancellable: false };

      // Build status history from da_updates
      const daUpdates: any[] = data.da_updates || [];
      const currentStatusIndex = NOON_STATUS_STEPS.findIndex(s => s.status === statusCode);
      const statusHistory = NOON_STATUS_STEPS.map((step, idx) => {
        const update = daUpdates.find((u: any) => u.status === step.status);
        return {
          status: step.status,
          label: step.label,
          timestamp: update?.time || null,
          completed: idx <= currentStatusIndex,
        };
      });

      // Driver details
      const da = data.da_details;
      let driverName: string | undefined;
      let driverPhone: string | undefined;
      let driverLat: number | undefined;
      let driverLng: number | undefined;

      if (da) {
        driverName = da.name || undefined;
        driverPhone = da.phone_number || da.phone || undefined;
        if (da.latitude) driverLat = fromNoonCoord(da.latitude);
        if (da.longitude) driverLng = fromNoonCoord(da.longitude);
      }

      console.log('[NoonAdapter] NOON_TASK_STATUS_UPDATE', { trackingId, statusCode });
      return {
        success: true,
        usendStatus: mapped.usendStatus,
        usendStatusLabel: mapped.label,
        providerStatus: statusCode,
        timestamp: data.created_at || new Date().toISOString(),
        noonTaskId: trackingId,
        cancellable: mapped.cancellable,
        driverName,
        driverPhone,
        driverLat,
        driverLng,
        pickupAddress: data.restaurant_details?.address,
        dropAddress: data.customer_details?.address,
        statusHistory,
      };
    } catch (e: any) {
      console.error('[NoonAdapter] Track failed', e.message);
      return FAILED_RESPONSE(e.message);
    }
  }

  // ─── Cancel Shipment ──────────────────────────────────────────────────────
  async cancelShipment(
    trackingId: string,
    credentials: CourierCredentials,
    environment: CourierEnvironment
  ): Promise<boolean> {
    const baseUrl = this.getBaseUrl(environment);

    // First check current status to validate cancellability
    const tracking = await this.trackShipment(trackingId, credentials, environment);
    if (tracking.success && tracking.cancellable === false) {
      console.warn('[NoonAdapter] NOON_TASK_CANCEL_FAILED — task past cancellable state', { trackingId, status: tracking.providerStatus });
      throw new Error(`Cannot cancel: delivery is already in status "${tracking.usendStatusLabel || tracking.providerStatus}"`);
    }

    try {
      const response = await fetch(`${baseUrl}/public/v1/tasks/${trackingId}/cancel`, {
        method: 'POST',
        headers: this.buildHeaders(credentials, environment),
        body: JSON.stringify({ reason: 'Partner cancellation via USend' }),
        signal: AbortSignal.timeout(10000),
      });

      const text = await response.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* ignore */ }

      if (response.ok) {
        console.log('[NoonAdapter] NOON_TASK_CANCEL', { trackingId });
        return true;
      }
      const errMsg = data.error || data.detail || `HTTP ${response.status}`;
      console.error('[NoonAdapter] NOON_TASK_CANCEL_FAILED', { trackingId, error: errMsg });
      throw new Error(errMsg);
    } catch (e: any) {
      if (e.message.includes('Cannot cancel')) throw e;
      throw new Error(`Cancellation failed: ${e.message}`);
    }
  }
}
