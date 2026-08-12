export interface CourierCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  accountNumber?: string;
  accountPin?: string;
  accountEntity?: string;
  accountCountryCode?: string;
  version?: string;
  source?: string;
  [key: string]: any; // Allow custom keys
}

export type CourierEnvironment = 'sandbox' | 'production';

export interface CanonicalRatePayload {
  originCity: string;
  originCountry: string;
  destCity: string;
  destCountry: string;
  weightKg: number;
  isExpress: boolean;
  codAmount?: number;
}

export interface CanonicalRateResponse {
  success: boolean;
  totalAmount?: number;
  currency?: string;
  serviceName?: string;
  error?: string;
}

export interface CanonicalShipmentPayload {
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
  reference?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface CanonicalShipmentResponse {
  success: boolean;
  trackingNumber?: string;
  labelUrl?: string;
  base64Label?: string;
  error?: string;
  providerStatus?: string;
}

export interface CanonicalTrackingResponse {
  success: boolean;
  usendStatus: string; // The canonical status: PENDING, IN_TRANSIT, DELIVERED, FAILED
  providerStatus: string;
  location?: string;
  timestamp: string;
  error?: string;
}

export interface CourierAdapter {
  id: string; // e.g. 'aramex', 'noon'
  name: string;
  capabilities: string[];
  
  validateCredentials(credentials: CourierCredentials, environment: CourierEnvironment): Promise<{ success: boolean; error?: string }>;
  calculateRate(payload: CanonicalRatePayload, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalRateResponse>;
  createShipment(payload: CanonicalShipmentPayload, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalShipmentResponse>;
  trackShipment(trackingId: string, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalTrackingResponse>;
  cancelShipment(trackingId: string, credentials: CourierCredentials, environment: CourierEnvironment): Promise<boolean>;
  getLabel?(trackingId: string, credentials: CourierCredentials, environment: CourierEnvironment): Promise<string>;
}
