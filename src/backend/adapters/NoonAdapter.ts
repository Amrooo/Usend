import {
  CourierAdapter,
  CanonicalRatePayload,
  CanonicalRateResponse,
  CanonicalShipmentPayload,
  CanonicalShipmentResponse,
  CanonicalTrackingResponse,
  CourierCredentials,
  CourierEnvironment
} from './CourierAdapter';

export class NoonAdapter implements CourierAdapter {
  id = 'noon';
  name = 'Noon';
  capabilities = ['SHIPMENT', 'TRACKING', 'CANCEL'];

  private getBaseUrl(env: CourierEnvironment): string {
    return env === 'production' ? "https://merchants.noon.com" : "https://food-api-team.noonstg.team";
  }

  async validateCredentials(credentials: CourierCredentials, environment: CourierEnvironment): Promise<{ success: boolean; error?: string }> {
    const baseUrl = this.getBaseUrl(environment);
    // As per Noon Integration docs, we test against the pickup-points list endpoint
    try {
      const apiKey = credentials.apiKey || credentials.password || "";
      if (!apiKey) {
        return { success: false, error: "Missing API key parameter" };
      }
      const response = await fetch(`${baseUrl}/public/v1/pickup-points/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
          "Api-Key": apiKey,
          "Authorization": `Bearer ${apiKey}`
        },
        signal: AbortSignal.timeout(10000)
      });
      const responseText = await response.text();
      
      // Check for corporate firewall interception blocks (e.g. FortiGuard Web Filter)
      if (responseText.includes("FortiGuard") || responseText.includes("Web Filter") || responseText.includes("Access Blocked")) {
        return { success: false, error: "Access blocked by FortiGuard Corporate Firewall/Web Filter. The Noon Staging domain is restricted on this network." };
      }

      if (!response.ok) {
        let errorMsg = `Noon returned status code ${response.status}`;
        try {
          const errData = JSON.parse(responseText);
          if (errData.message) errorMsg = errData.message;
        } catch(e) {}
        return { success: false, error: errorMsg };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Network error while connecting to Noon" };
    }
  }

  async calculateRate(payload: CanonicalRatePayload, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalRateResponse> {
    // Noon Dropoff/Hyperlocal typically has fixed pricing or doesn't expose a dynamic rating API.
    // We will return a static standard rate for Noon, or error if not supported in the flow.
    return {
      success: true,
      totalAmount: payload.isExpress ? 25 : 15,
      currency: "AED",
      serviceName: "Noon Hyperlocal"
    };
  }

  async createShipment(payload: CanonicalShipmentPayload, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalShipmentResponse> {
    const baseUrl = this.getBaseUrl(environment);
    
    // Convert AED to fils for Noon
    const codInFils = Math.round((payload.codAmountAED || 0) * 100);

    const noonPayload = {
      outlet_code: credentials.accountNumber || credentials.accountEntity || "DEFAULT_OUTLET",
      order_reference: payload.reference || `USEND-${Date.now()}`,
      customer_name: payload.receiverName,
      customer_phone: payload.receiverPhone,
      drop_off_address: {
        address: payload.receiverAddress,
        lat: 25.2048,
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

    // Endpoint candidates: Noon RoD staging uses different path than /public/v1/create-task
    // The /public/v1/create-task path returns {"detail":"Not Found"} on their FastAPI server.
    // We try the authenticated task endpoint instead.
    const endpointCandidates = [
      `${baseUrl}/api/v1/task`,
      `${baseUrl}/public/v1/task`,
      `${baseUrl}/v1/task`,
      `${baseUrl}/public/v1/create-task`,
    ];

    const apiKey = credentials.apiKey || credentials.password || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-API-KEY": apiKey,
      "Api-Key": apiKey,
      "Authorization": `Bearer ${apiKey}`
    };

    let lastError = "All Noon endpoint candidates returned errors";

    for (const endpoint of endpointCandidates) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(noonPayload),
          signal: AbortSignal.timeout(12000)
        });

        const responseText = await response.text();

        // Skip HTML responses (auth portal redirect or firewall block)
        if (responseText.trimStart().startsWith('<')) {
          lastError = `Noon endpoint ${endpoint} returned an HTML page (authentication redirect or firewall block)`;
          continue;
        }

        let data: any = {};
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          lastError = `Noon endpoint ${endpoint} returned non-JSON (status ${response.status}): ${responseText.substring(0, 100)}`;
          continue;
        }

        // Skip FastAPI 404 {"detail":"Not Found"} responses
        if (response.status === 404 && data.detail) {
          lastError = `Noon endpoint ${endpoint} not found (404): ${data.detail}`;
          continue;
        }

        if (!response.ok || data.status === 'ERROR') {
          lastError = data.message || data.detail || `Noon task creation failed at ${endpoint} (status ${response.status})`;
          // Don't continue — this endpoint exists but returned a business error
          return { success: false, error: `Failed to create Noon Task: ${lastError}` };
        }

        // Success — extract task reference
        const trackingId = data.mp_task_nr || data.task_nr || data.id || data.task_id || data.reference;
        if (!trackingId) {
          return { success: false, error: `Noon task created but no tracking number returned. Response: ${JSON.stringify(data).substring(0, 200)}` };
        }

        return {
          success: true,
          trackingNumber: String(trackingId),
          providerStatus: data.status || "CREATED"
        };

      } catch (e: any) {
        lastError = `Network error reaching ${endpoint}: ${e.message}`;
        continue;
      }
    }

    // All candidates failed — return non-blocking error
    return { success: false, error: `Noon integration unavailable (sandbox may require authenticated session). Details: ${lastError}` };
  }

  async trackShipment(trackingId: string, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalTrackingResponse> {
    const baseUrl = this.getBaseUrl(environment);
    
    try {
      const response = await fetch(`${baseUrl}/public/v1/tasks/${trackingId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": credentials.apiKey || credentials.password || "",
          "Api-Key": credentials.apiKey || credentials.password || "",
          "Authorization": `Bearer ${credentials.apiKey || credentials.password}`
        }
      });
      
      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return { success: false, providerStatus: 'Error', usendStatus: 'FAILED', timestamp: new Date().toISOString(), error: `Noon server returned non-JSON response (status ${response.status})` };
      }

      if (!response.ok || data.status === 'ERROR') {
        return { success: false, providerStatus: 'Error', usendStatus: 'FAILED', timestamp: new Date().toISOString(), error: data.message || "Tracking Error" };
      }

      return {
        success: true,
        providerStatus: data.status,
        usendStatus: this.mapStatus(data.status),
        timestamp: new Date().toISOString()
      };
    } catch (e: any) {
      return { success: false, providerStatus: 'Error', usendStatus: 'FAILED', timestamp: new Date().toISOString(), error: e.message };
    }
  }

  async cancelShipment(trackingId: string, credentials: CourierCredentials, environment: CourierEnvironment): Promise<boolean> {
    const baseUrl = this.getBaseUrl(environment);
    
    try {
      const response = await fetch(`${baseUrl}/public/v1/tasks/${trackingId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": credentials.apiKey || credentials.password || "",
          "Api-Key": credentials.apiKey || credentials.password || "",
          "Authorization": `Bearer ${credentials.apiKey || credentials.password}`
        },
        body: JSON.stringify({ reason: "USend Automated Cancellation" })
      });
      
      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {}
      return response.ok && data.status === 'SUCCESS';
    } catch (e) {
      return false;
    }
  }

  private mapStatus(noonStatus: string): string {
    const status = (noonStatus || "").toUpperCase();
    if (["DELIVERED", "COMPLETED", "SUCCESS"].includes(status)) return "DELIVERED";
    if (["CANCELLED", "REJECTED", "FAILED"].includes(status)) return "FAILED";
    if (["CREATED", "ASSIGNED", "DISPATCHED", "IN_PROGRESS"].includes(status)) return "IN_TRANSIT";
    return "PENDING";
  }
}
