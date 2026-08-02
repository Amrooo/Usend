import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

export default function StripeCheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isReady) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        setMessage(error.message || 'An unexpected error occurred.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage('Payment successful!');
        onSuccess();
      } else {
        setMessage('Unrecognized payment status.');
      }
    } catch (err: any) {
      setMessage(err.message || 'Payment engine error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 w-full text-left">
      <PaymentElement onReady={() => setIsReady(true)} />
      {message && <div className="mt-4 text-xs font-semibold text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100">{message}</div>}
      
      <button
        disabled={isProcessing || !stripe || !elements || !isReady}
        type="submit"
        className="w-full mt-6 py-3.5 bg-[#635BFF] hover:bg-[#524BFF] disabled:bg-[#635BFF]/30 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex justify-center items-center cursor-pointer"
      >
        {isProcessing ? 'Processing secure payment...' : 'Pay with Stripe'}
      </button>
    </form>
  );
}
