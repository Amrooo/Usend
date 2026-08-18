// Centralized Stripe Payment Helper — uses backend API exclusively.
// SECURITY: Stripe secret keys are NEVER stored in client-side code.
// All PaymentIntent creation goes through /api/payments/create-intent (server.ts)
// which reads STRIPE_SECRET_KEY from the server environment only.
export const DEFAULT_STRIPE_PUB_KEY =
  (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || "";

/**
 * Safely fetches the Stripe Publishable Key from the backend.
 */
export async function getStripePublishableKey(): Promise<string> {
  try {
    const res = await fetch('/api/payments/config');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.publishableKey) return data.publishableKey;
    }
  } catch (err) {
    console.warn("Stripe config fetch warning, using env fallback:", err);
  }
  return DEFAULT_STRIPE_PUB_KEY;
}

interface PaymentIntentPayload {
  amountAED: number;
  customerId?: string;
  orderId?: string;
  topup?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Creates a Stripe PaymentIntent via the backend API.
 * SECURITY: No direct Stripe API calls from the browser — secret key stays server-side.
 */
export async function createStripePaymentIntent(payload: PaymentIntentPayload): Promise<{ clientSecret: string }> {
  const amountAED = Math.max(payload.amountAED || 5, 1);

  try {
    const res = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, amountAED }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.clientSecret) {
        return { clientSecret: data.clientSecret };
      }
    }

    const errData = contentType.includes('application/json')
      ? await res.json().catch(() => ({}))
      : {};
    throw new Error(errData.error || `Payment service returned HTTP ${res.status}`);
  } catch (err: any) {
    console.error("Payment intent creation failed:", err.message);
    throw new Error("Unable to initialize payment session. Please check your connection and try again.");
  }
}
