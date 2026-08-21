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

export class GenericRestAdapter implements CourierAdapter {
  id: string;
  name: string;
  capabilities = ['RATE', 'SHIPMENT', 'TRACKING'];

  constructor(id: string) {
    this.id = id;
    this.name = id.toUpperCase();
  }

  async validateCredentials(credentials: CourierCredentials, environment: CourierEnvironment): Promise<{ success: boolean; error?: string }> {
    // If it's a dynamic courier added via Admin Portal, we just accept the credentials as valid
    // unless they are completely empty.
    if (Object.keys(credentials).length === 0) {
      return { success: false, error: 'No credentials provided' };
    }
    return { success: true };
  }

  async calculateRate(payload: CanonicalRatePayload, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalRateResponse> {
    // Dummy response for generic couriers
    return {
      success: true,
      totalAmount: 15.0,
      currency: 'AED',
      serviceName: `${this.name} Standard`
    };
  }

  async createShipment(payload: CanonicalShipmentPayload, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalShipmentResponse> {
    // Dummy response for generic couriers
    const dummyTracking = `GEN-${Math.floor(Math.random() * 1000000)}`;
    return {
      success: true,
      trackingNumber: dummyTracking,
      providerStatus: 'Created',
    };
  }

  async trackShipment(trackingId: string, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalTrackingResponse> {
    return {
      success: true,
      providerStatus: 'In Transit',
      usendStatus: 'IN_TRANSIT',
      timestamp: new Date().toISOString()
    };
  }

  async cancelShipment(trackingId: string, credentials: CourierCredentials, environment: CourierEnvironment): Promise<boolean> {
    return true;
  }
}
