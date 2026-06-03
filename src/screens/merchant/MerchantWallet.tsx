import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import { 
  Filter, 
  Coins,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { loadStripe } from '@stripe/stripe-js';

interface MerchantWalletProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantWallet({ onNavigate }: MerchantWalletProps) {
  const { isRTL } = useLanguage();
  
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [walletBalance, setWalletBalance] = useState(1485.00);
  const [codPending, setCodPending] = useState(850.00);
  const [fundsAmount, setFundsAmount] = useState('');
  
  // Stripe top-up state variables
  const [stripeMethod, setStripeMethod] = useState<'standard' | 'stripe_card' | 'stripe_applepay'>('stripe_card');
  const [stripeCardNum, setStripeCardNum] = useState('4242 4242 4242 4242');
  const [stripeCardExp, setStripeCardExp] = useState('12/28');
  const [stripeCardCvv, setStripeCardCvv] = useState('883');
  const [stripeIsProcessing, setStripeIsProcessing] = useState(false);
  const [stripeShowReceipt, setStripeShowReceipt] = useState(false);

  const [transactions, setTransactions] = useState([
    { id: 'TXN-001', date: 'Today, 14:30', type: 'Platform Fee', amount: -5.00, method: 'Wallet Deduction', status: 'Completed', ref: 'ORD-9921' },
    { id: 'TXN-002', date: 'Today, 12:15', type: 'Funds Added', amount: 500.00, method: 'Credit Card', status: 'Completed', ref: 'Top-up' },
    { id: 'TXN-003', date: 'Yesterday, 18:45', type: 'Platform Fee', amount: -5.00, method: 'Wallet Deduction', status: 'Completed', ref: 'ORD-9920' },
    { id: 'TXN-004', date: 'Yesterday, 15:20', type: 'Withdrawal', amount: -1200.00, method: 'Bank Transfer', status: 'Processing', ref: 'Bank Ending 1234' },
    { id: 'TXN-005', date: '12 Mar, 09:10', type: 'COD Collection', amount: 350.00, method: 'Driver Deposit', status: 'Completed', ref: 'Batch #44' },
  ]);

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(fundsAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    if (stripeMethod !== 'standard') {
      setStripeIsProcessing(true);
      try {
        const pubKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_REMOVED';
        
        // 1. Create Payment Intent on our backend Express server
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amountAED: parsed,
            orderId: `TOPUP-${Date.now()}`,
            customerId: 'merchant-partner',
            metadata: {
              type: 'wallet_topup',
              merchantId: 'merchant-partner'
            }
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to create payment intent');
        }

        const { clientSecret } = await response.json();

        // 2. Initialize Stripe
        const stripe = await loadStripe(pubKey);
        if (!stripe) {
          throw new Error('Failed to load Stripe SDK. Check your network or publishable key.');
        }

        // 3. Parse expiry date input (MM/YY)
        const expiryParts = stripeCardExp.trim().split('/');
        if (expiryParts.length !== 2) {
          throw new Error('Invalid Expiry Date format. Use MM/YY.');
        }
        const expMonth = parseInt(expiryParts[0], 10);
        const rawYear = expiryParts[1].trim();
        const expYear = rawYear.length === 2 ? 2000 + parseInt(rawYear, 10) : parseInt(rawYear, 10);

        if (isNaN(expMonth) || expMonth < 1 || expMonth > 12 || isNaN(expYear)) {
          throw new Error('Invalid Expiry Month or Year.');
        }

        // 4. Tokenize the card details first via Stripe's REST API
        const tokenResponse = await fetch('https://api.stripe.com/v1/tokens', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pubKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'card[number]': stripeCardNum.replace(/\s/g, ''),
            'card[exp_month]': expMonth.toString(),
            'card[exp_year]': expYear.toString(),
            'card[cvc]': stripeCardCvv.trim(),
          }).toString(),
        });

        if (!tokenResponse.ok) {
          const tokenErr = await tokenResponse.json();
          throw new Error(tokenErr.error?.message || 'Failed to tokenize card');
        }

        const tokenData = await tokenResponse.json();

        // 5. Confirm Card Payment using the generated token
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: {
              token: tokenData.id,
            },
            billing_details: {
              name: 'USend Merchant Partner',
            },
          },
        });

        if (error) {
          throw new Error(error.message || 'Payment confirmation failed');
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          // Success! Update UI balance and show success screen
          setWalletBalance(prev => prev + parsed);
          setTransactions(prev => [
            {
              id: `TXN-PMB-TOP-${Math.floor(10000 + Math.random() * 90000)}`,
              date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'Funds Added',
              amount: parsed,
              method: stripeMethod === 'stripe_card' ? 'Credit Card (Stripe)' : 'Apple Pay (Stripe)',
              status: 'Completed',
              ref: 'Top-up'
            },
            ...prev
          ]);
          setStripeShowReceipt(true);
        } else {
          throw new Error(`Unexpected Stripe payment status: ${paymentIntent?.status}`);
        }
      } catch (err: any) {
        console.error("Stripe Checkout Error:", err);
        alert(err.message || "An unexpected error occurred during Stripe payment.");
      } finally {
        setStripeIsProcessing(false);
      }
    } else {
      // Standard Card simulated flow
      setWalletBalance(prev => prev + parsed);
      setTransactions(prev => [
        {
          id: `TXN-PMB-TOP-${Math.floor(10000 + Math.random() * 90000)}`,
          date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'Funds Added',
          amount: parsed,
          method: 'Credit Card',
          status: 'Completed',
          ref: 'Top-up'
        },
        ...prev
      ]);
      setFundsAmount('');
      setShowAddFunds(false);
    }
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 w-full ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_wallet" onNavigate={onNavigate} />
      
      <main className="flex-1 p-6 lg:p-10 h-full overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-8 text-left"
        >
          {/* Page Headers */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <span className="text-blue-600 font-bold text-[12px] uppercase tracking-[0.4em] block">
                Financial Operations Ledger
              </span>
              <h1 className="text-3xl font-display font-medium text-zinc-900 uppercase tracking-tight mt-1">
                Wallet & Topups
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Monitor available balance credits dedicated for dispatch platform commission.
              </p>
            </div>
          </div>

          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-950 p-8 rounded-[2.5rem] text-white md:col-span-2 relative overflow-hidden shadow-xl">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div>
                        <p className="text-zinc-400 font-bold tracking-widest uppercase text-xs mb-1">Available Fleet Balance</p>
                        <h3 className="text-5xl font-black font-mono">AED {walletBalance.toFixed(2)}</h3>
                        <p className="text-xs text-zinc-400 mt-4 max-w-sm">Funds dedicated for immediate dispatch platform commissions. AED 5.00 applied per delivery.</p>
                     </div>
                     <div className="min-w-[180px] space-y-2">
                        <button 
                          onClick={() => setShowAddFunds(true)}
                          className="w-full bg-white text-zinc-900 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:bg-zinc-100 transition-all cursor-pointer"
                        >
                          + Top-Up Wallet
                        </button>
                        {showWithdraw && <div />}
                        <button 
                          onClick={() => setShowWithdraw(true)}
                          className="w-full bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-white/15 transition-all cursor-pointer"
                        >
                          Withdrawal payout
                        </button>
                     </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-200/80 shadow-sm flex flex-col justify-between">
                   <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                     <Coins className="w-5 h-5" />
                   </div>
                   <div>
                     <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider">COD Collected Waiting Payout</span>
                     <h3 className="text-3xl font-black text-zinc-900 font-mono mt-1">AED {codPending.toFixed(2)}</h3>
                   </div>
                   <button
                     onClick={() => onNavigate('merchant_payments')}
                     className="text-[#4f95cc] font-bold text-xs mt-3 text-left hover:underline cursor-pointer"
                   >
                     Manage COD Transfers &rarr;
                   </button>
                </div>
              </div>

              {/* Transactions list */}
              <div className="bg-white rounded-[2rem] border border-zinc-200 overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Transactions Log</span>
                  <button className="p-1.5 bg-zinc-50 rounded-lg text-zinc-400 hover:bg-zinc-100">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 text-[12px] font-black uppercase tracking-wide">
                        <th className="p-4 pl-6">Reference ID</th>
                        <th className="p-4">Time & Date</th>
                        <th className="p-4">Log Type</th>
                        <th className="p-4">Settle Option</th>
                        <th className="p-4 text-right pr-6">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-xs">
                      {transactions.map((txn, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/10">
                          <td className="p-4 pl-6">
                            <span className="font-bold text-zinc-800 block">{txn.id}</span>
                            <span className="text-[12px] text-zinc-400 font-mono">{txn.ref}</span>
                          </td>
                          <td className="p-4 text-zinc-400">{txn.date}</td>
                          <td className="p-4">
                            <span className={`font-bold ${
                              txn.amount > 0 ? 'text-blue-600' : 'text-zinc-600'
                            }`}>{txn.type}</span>
                          </td>
                          <td className="p-4 text-zinc-400">{txn.method}</td>
                          <td className={`p-4 text-right pr-6 font-bold font-mono ${txn.amount > 0 ? 'text-blue-600' : 'text-zinc-900'}`}>
                            {txn.amount > 0 ? '+' : ''}AED {txn.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
          </div>
        </motion.div>
      </main>

      {/* Top-up Modal */}
      {showAddFunds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowAddFunds(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white text-zinc-900 rounded-3xl w-full max-w-md shadow-2xl p-6 relative z-10"
          >
            {stripeShowReceipt ? (
              <div className="text-center py-6 space-y-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-2xl text-zinc-900">AED {parseFloat(fundsAmount || '0').toFixed(2)}</h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Added to Fleet Balance</p>
                </div>
                
                <div className="bg-zinc-50 p-4 rounded-xl text-left border border-zinc-100 text-xs font-mono space-y-2">
                  <div className="flex justify-between"><span className="text-zinc-400">Auth Code:</span><span className="font-bold text-zinc-700">STRIPE-AUTH-9912X</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Card:</span><span className="font-bold text-zinc-700">**** {stripeCardNum.slice(-4)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Time:</span><span className="font-bold text-zinc-700">{new Date().toLocaleString()}</span></div>
                </div>

                <button
                  onClick={() => {
                    setFundsAmount('');
                    setStripeShowReceipt(false);
                    setShowAddFunds(false);
                  }}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Done & Settle Funds
                </button>
              </div>
            ) : stripeIsProcessing ? (
              <div className="text-center py-10 space-y-4">
                <div className="relative w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-zinc-100 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-zinc-800">Processing Stripe UAE Gateway Settle...</h4>
                  <p className="text-[13px] text-zinc-400">Verifying 3D secure and registering order at ae.stripe.com...</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-zinc-900">Top-up Wallet Portal</h3>
                  <span className="px-2 py-0.5 rounded-full text-[12px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100 font-mono">stripe.com</span>
                </div>

                <form onSubmit={handleTopupSubmit} className="space-y-4 text-left">
                  <div className="space-y-1">
                     <label className="text-[12px] font-bold uppercase tracking-wider text-zinc-400 pl-0.5">Settle top-up Amount (AED)</label>
                     <input 
                       required
                       type="number" 
                       value={fundsAmount}
                       onChange={(e) => setFundsAmount(e.target.value)}
                       placeholder="e.g. 500.00"
                       className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl font-bold font-mono text-lg outline-none focus:border-zinc-900"
                     />
                  </div>

                  {/* Payment Channel Selection */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-zinc-400 pl-0.5 block">Select Acceptance Gateway</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setStripeMethod('standard')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 font-bold transition-all cursor-pointer text-center ${
                          stripeMethod === 'standard'
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        <span className="text-base">💳</span>
                        <span>Standard Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStripeMethod('stripe_card')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 font-bold transition-all cursor-pointer text-center ${
                          stripeMethod !== 'standard'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        <span className="text-base">🛡️</span>
                        <span>Stripe Gateway</span>
                      </button>
                    </div>
                  </div>

                  {stripeMethod !== 'standard' && (
                    <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100 space-y-3 animate-in fade-in duration-100 text-xs">
                      <div className="flex items-center justify-between text-[13px] text-blue-700 font-black tracking-widest uppercase">
                        <span>Stripe UAE sandbox card</span>
                        <span>Active</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="space-y-1">
                          <label className="text-[13px] font-bold text-blue-800 uppercase pl-0.5">Card number</label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-white border border-blue-200 px-3 py-1.5 rounded-lg font-mono font-bold text-zinc-900 text-xs"
                            value={stripeCardNum}
                            onChange={(e) => setStripeCardNum(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[13px] font-bold text-blue-800 uppercase pl-0.5">Expiry</label>
                            <input 
                              required
                              type="text" 
                              className="w-full bg-white border border-blue-200 px-3 py-1.5 rounded-lg font-mono font-bold text-zinc-900 text-xs"
                              value={stripeCardExp}
                              onChange={(e) => setStripeCardExp(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[13px] font-bold text-blue-800 uppercase pl-0.5">CVV</label>
                            <input 
                              required
                              type="password" 
                              className="w-full bg-white border border-blue-200 px-3 py-1.5 rounded-lg font-mono font-bold text-zinc-900 text-xs"
                              value={stripeCardCvv}
                              onChange={(e) => setStripeCardCvv(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button" 
                      onClick={() => setShowAddFunds(false)}
                      className="flex-1 py-3 text-zinc-400 font-bold hover:bg-zinc-50 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit" 
                      className={`flex-[2] py-3 font-bold rounded-xl shadow-lg transition-all cursor-pointer text-center text-white ${
                        stripeMethod !== 'standard'
                          ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/10'
                          : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                      }`}
                    >
                      {stripeMethod !== 'standard' ? 'Pay Securely via Stripe' : 'Authorize Card Settle'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
