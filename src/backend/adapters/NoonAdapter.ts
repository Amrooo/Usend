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
  toNoonCoord,
  fromNoonCoord,
  aedToFils
} from './CourierAdapter';

// Default staging pickup point coordinates (Dubai Mall area — pre-tested serviceable)
const DEFAULT_PICKUP_LAT = 25.1964783;
const DEFAULT_PICKUP_LNG = 55.2808833;

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
    // 1. TESTING ENVIRONMENT ONLY: Always use Noon's official shared staging key.
    // This ignores whatever is typed in the UI to prevent production keys from breaking UAT.
    if (env === 'sandbox') {
      return 'SstJi9Ho0EHG2t7kQVSz7nA2hOeL3iiwVxHxb0Njk60QJ0LfmvoXoOsimw1zQC7VugHXiIRRMnWyU6f0uHcEcLlco5Eujqbd5pTwDlfBXpacuRI4m4AAj61NwM0B7Ihk';
    }

    // 2. PRODUCTION ENVIRONMENT: Use the credentials from the UI or environment variables
    if (process.env.NOON_API_KEY) return process.env.NOON_API_KEY;
    if (credentials.apiKey && credentials.apiKey.length > 10) return credentials.apiKey;
    if (credentials.password && credentials.password.length > 10) return credentials.password;

    // Production API Key for TRSH (FZC)
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

  // ─── Validate Credentials ─────────────────────────────────────────────────
  async validateCredentials(
    credentials: CourierCredentials,
    environment: CourierEnvironment
  ): Promise<{ success: boolean; error?: string }> {
    const baseUrl = this.getBaseUrl(environment);
    const apiKey = this.getApiKey(credentials, environment);
    const outletCode = credentials.outletCode || credentials.accountNumber;

    if (!apiKey) return { success: false, error: 'Noon API Key is missing. Please provide a valid API Key.' };

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

      if (text.includes("You don't have any outlets")) {
        return { success: true, error: "Connection Successful! Note: Your Noon account does not have any pickup points (outlets) configured yet. You will need to create one in your Noon dashboard to generate waybills." };
      }

      if (!response.ok) {
        return { success: false, error: `Noon API returned an unexpected error (HTTP ${response.status}). Details: ${text}` };
      }

      // API Key is valid! Now check the Outlet Code if provided.
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return { success: false, error: 'Noon API returned an invalid response format.' };
      }

      const points = Array.isArray(data) ? data : (data.pickup_points || data.data || []);
      const availableCodes = points.map((p: any) => p.outlet_code || p.id).filter(Boolean);

      if (!outletCode) {
        if (availableCodes.length > 0) {
          return {
            success: false,
            error: `API Key is Valid! However, the Outlet Code is missing. Available Outlet Codes on this account are: ${availableCodes.join(', ')}. Please enter one of these in the Outlet Code / Account Number field.`
          };
        }
        return { success: false, error: 'API Key is Valid! However, the Outlet Code is missing, and we could not find any active pickup points on this account.' };
      }

      // Check if the provided outlet code actually exists
      if (availableCodes.length > 0 && !availableCodes.includes(outletCode)) {
        return {
          success: false,
          error: `API Key is Valid, but the Outlet Code "${outletCode}" was not found. Available Outlet Codes are: ${availableCodes.join(', ')}.`
        };
      }

      return { success: true };
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
    // Noon RoD uses dynamic pricing per zone — no public rate API.
    // Return a configurable flat rate.
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

    // Resolve outlet code: payload > credentials > staging official default
    const outletCode = payload.outletCode
      || credentials.outletCode
      || credentials.storeId
      || credentials.accountNumber
      || (environment === 'sandbox' ? '77T4HCOD4G' : '');
    if (!outletCode) {
      return { success: false, error: 'Noon: No outlet_code provided. Select a pickup point first.' };
    }

    // Resolve idempotency key (required by Noon API)
    const idempotencyKey = payload.idempotencyKey
      || `usend-${payload.orderId || payload.reference || Date.now()}-${outletCode}`;

    // Pickup coordinates: use payload values or fallback to default serviceable point
    const pickupLatInt = toNoonCoord(payload.pickupLat ?? DEFAULT_PICKUP_LAT);
    const pickupLngInt = toNoonCoord(payload.pickupLng ?? DEFAULT_PICKUP_LNG);

    // Drop-off coordinates: use payload values or fallback near pickup
    const dropLatInt = toNoonCoord(payload.dropLat ?? DEFAULT_PICKUP_LAT);
    const dropLngInt = toNoonCoord(payload.dropLng ?? (DEFAULT_PICKUP_LNG + 0.01));

    // COD/prepaid: Noon requires one of cod_value > 0 OR prepaid_value > 0
    const codFils = aedToFils(payload.codAmountAED || 0);
    const prepaidFils = aedToFils(payload.prepaidAmountAED || 0);

    // If both are 0 (fully prepaid order with no declared value), use a nominal prepaid
    const finalCodFils = codFils;
    const finalPrepaidFils = (codFils === 0 && prepaidFils === 0) ? 100 : prepaidFils;

    const noonPayload: Record<string, any> = {
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
        country_code: 'ae',      // Noon staging only accepts lowercase 'ae'
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
          error: 'Noon returned an HTML page — check API key and network access',
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

      // Noon returns {"detail":"Not Found"} for unknown paths (FastAPI)
      if (response.status === 404 && data.detail) {
        return { success: false, error: `Noon endpoint not found: ${data.detail}` };
      }

      if (!response.ok || data.error) {
        const errMsg = data.error || data.detail || data.message
          || `Noon task creation failed (HTTP ${response.status})`;
        console.error('[NoonAdapter] NOON_TASK_CREATE_FAILED', { outletCode, idempotencyKey, error: errMsg });
        return { success: false, error: errMsg };
      }

      // Success: {"mp_task_nr": "...", "status": "successful"}
      const taskId = data.mp_task_nr;
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
        headers: this.buildHeaders(credentials),
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
        headers: this.buildHeaders(credentials),
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
