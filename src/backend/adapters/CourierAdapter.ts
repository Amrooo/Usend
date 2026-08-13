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
  outletCode?: string; // Noon: selected pickup point code
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
  prepaidAmountAED?: number;   // For non-COD orders (Noon requires one of cod or prepaid)
  reference?: string;
  orderId?: string;            // Usend order ID for idempotency
  idempotencyKey?: string;     // Caller-supplied idempotency key
  // Coordinates (decimal degrees - adapters convert internally as needed)
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  // Noon-specific
  outletCode?: string;         // Noon pickup point code (outlet_code)
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
  noonTaskId?: string;
  outletCode?: string;
}

export interface CanonicalTrackingResponse {
  success: boolean;
  usendStatus: string;         // Canonical: PENDING, IN_TRANSIT, DELIVERED, FAILED
  usendStatusLabel?: string;   // Human-readable label
  providerStatus: string;
  location?: string;
  timestamp: string;
  error?: string;
  // Driver / rider info (Noon RoD)
  driverName?: string;
  driverPhone?: string;
  driverLat?: number;
  driverLng?: number;
  // Task info
  noonTaskId?: string;
  pickupAddress?: string;
  dropAddress?: string;
  cancellable?: boolean;
  statusHistory?: Array<{
    status: string;
    label: string;
    timestamp: string | null;
    completed: boolean;
  }>;
}

export interface CourierAdapter {
  id: string;
  name: string;
  capabilities: string[];
  validateCredentials(credentials: CourierCredentials, environment: CourierEnvironment): Promise<{ success: boolean; error?: string }>;
  calculateRate(payload: CanonicalRatePayload, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalRateResponse>;
  createShipment(payload: CanonicalShipmentPayload, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalShipmentResponse>;
  trackShipment(trackingId: string, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalTrackingResponse>;
  cancelShipment(trackingId: string, credentials: CourierCredentials, environment: CourierEnvironment): Promise<boolean>;
  getLabel?(trackingId: string, credentials: CourierCredentials, environment: CourierEnvironment): Promise<string>;
}

// ─── Noon Status Mapping ─────────────────────────────────────────────────────
export const NOON_STATUS_MAP: Record<string, { usendStatus: string; label: string; cancellable: boolean }> = {
  pending_assignment:         { usendStatus: 'PENDING',    label: 'Finding Driver',    cancellable: true  },
  assigned:                   { usendStatus: 'IN_TRANSIT', label: 'Driver Assigned',   cancellable: true  },
  arrived_at_pickup_location: { usendStatus: 'IN_TRANSIT', label: 'Driver at Pickup',  cancellable: true  },
  picked_up:                  { usendStatus: 'IN_TRANSIT', label: 'Picked Up',         cancellable: false },
  arrived_at_delivery:        { usendStatus: 'IN_TRANSIT', label: 'Driver Arriving',   cancellable: false },
  delivered:                  { usendStatus: 'DELIVERED',  label: 'Delivered',         cancellable: false },
  cancelled:                  { usendStatus: 'FAILED',     label: 'Cancelled',         cancellable: false },
  undelivered:                { usendStatus: 'FAILED',     label: 'Undelivered',       cancellable: false },
};

export const NOON_STATUS_STEPS = [
  { status: 'pending_assignment',         label: 'Finding Driver'   },
  { status: 'assigned',                   label: 'Driver Assigned'  },
  { status: 'arrived_at_pickup_location', label: 'Driver at Pickup' },
  { status: 'picked_up',                  label: 'Picked Up'        },
  { status: 'arrived_at_delivery',        label: 'Driver Arriving'  },
  { status: 'delivered',                  label: 'Delivered'        },
];

// ─── Coordinate & Currency Utilities ─────────────────────────────────────────
/** Convert decimal degrees to Noon integer microdegrees (x 10^7) */
export function toNoonCoord(decimal: number): number {
  return Math.round(decimal * 1e7);
}

/** Convert Noon integer microdegrees to decimal degrees */
export function fromNoonCoord(micro: number | string): number {
  return Number(micro) / 1e7;
}

/** Convert AED to fils (integer minor unit, no floating-point errors) */
export function aedToFils(aed: number): number {
  return Math.round(aed * 100);
}
