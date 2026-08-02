const dotenv = require('dotenv');
dotenv.config();
const Stripe = require('stripe');

// Initialize stripe
const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is missing from environment!");
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: '2022-11-15' });

(async () => {
  try {
    console.log("Testing Stripe local integration...");
    
    // 1. Create a PaymentIntent for top-up
    console.log("Creating PaymentIntent via local server /api/payments/create-intent...");
    const res = await fetch('http://localhost:3001/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountAED: 50.00,
        isTopUp: true,
        merchantId: 'test_merchant_uid'
      })
    });
    
    if (!res.ok) {
      throw new Error(`Failed to create intent. Status: ${res.status} ${await res.text()}`);
    }
    
    const { clientSecret } = await res.json();
    console.log("Successfully created PaymentIntent. clientSecret:", clientSecret);
    
    // Extract paymentIntent ID from clientSecret
    const paymentIntentId = clientSecret.split('_secret')[0];
    console.log("Extracted PaymentIntent ID:", paymentIntentId);
    
    // 2. Retrieve the PaymentIntent using Stripe SDK to verify it
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log("Stripe Verification - Retrieved PaymentIntent status:", paymentIntent.status);
    console.log("Metadata:", paymentIntent.metadata);
    
    // 3. Simulate calling the local webhook with mock payment confirmation
    console.log("Simulating webhook confirmation local trigger...");
    const webhookRes = await fetch('http://localhost:3001/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'mock_signature'
      },
      body: JSON.stringify({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: paymentIntentId,
            status: 'succeeded',
            amount: 5000,
            currency: 'aed',
            metadata: {
              type: 'wallet_topup',
              merchantId: 'test_merchant_uid',
              amountAED: '50.00'
            }
          }
        }
      })
    });
    
    if (webhookRes.ok) {
      console.log("Webhook simulation successfully triggered and processed!");
      console.log("Stripe local integration verification passed!");
    } else {
      console.error("Webhook trigger failed. Status:", webhookRes.status, await webhookRes.text());
    }
    
  } catch (e) {
    console.error("Error verifying Stripe integration:", e.message);
  }
})();
