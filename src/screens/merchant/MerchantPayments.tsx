import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import { 
  DollarSign, 
  Download, 
  Filter, 
  ArrowDownRight, 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Percent, 
  Coins, 
  Scale, 
  Sparkles, 
  Landmark, 
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { loadStripe } from '@stripe/stripe-js';

interface MerchantPaymentsProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantPayments({ onNavigate }: MerchantPaymentsProps) {
  const { t, isRTL } = useLanguage();
  const { merchantActiveTab, setMerchantActiveTab } = useApp();
  
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [walletBalance, setWalletBalance] = useState(1485.00);
  const [codPending, setCodPending] = useState(850.00);
  const [fundsAmount, setFundsAmount] = useState('');
  
  // Stripe top-up state variables
  const [stripeMethod, setStripeMethod] = useState<'standard' | 'stripe_card' | 'stripe_applepay'>('stripe_card');
  const [stripeCardNum, setStripeCardNum] = useState('4111 2222 3333 4444');
  const [stripeCardExp, setStripeCardExp] = useState('12/28');
  const [stripeCardCvv, setStripeCardCvv] = useState('883');
  const [stripeCardName, setStripeCardName] = useState('USend Merchant Partner');
  const [stripeIsProcessing, setStripeIsProcessing] = useState(false);
  const [stripeShowReceipt, setStripeShowReceipt] = useState(false);

  const [withdrawalState, setWithdrawalState] = useState<string | null>(null);

  const transactions = [
    { id: 'TXN-001', date: 'Today, 14:30', type: 'Platform Fee', amount: -5.00, method: 'Wallet Deduction', status: 'Completed', ref: 'ORD-9921' },
    { id: 'TXN-002', date: 'Today, 12:15', type: 'Funds Added', amount: 500.00, method: 'Credit Card', status: 'Completed', ref: 'Top-up' },
    { id: 'TXN-003', date: 'Yesterday, 18:45', type: 'Platform Fee', amount: -5.00, method: 'Wallet Deduction', status: 'Completed', ref: 'ORD-9920' },
    { id: 'TXN-004', date: 'Yesterday, 15:20', type: 'Withdrawal', amount: -1200.00, method: 'Bank Transfer', status: 'Processing', ref: 'Bank Ending 1234' },
    { id: 'TXN-005', date: '12 Mar, 09:10', type: 'COD Collection', amount: 350.00, method: 'Driver Deposit', status: 'Completed', ref: 'Batch #44' },
  ];

  const statements = [
    { id: 'STM-2026-05', period: 'May 01 - May 15, 2026', totalOrders: 154, amount: 2450.00, vat: 122.50, status: 'Settled' },
    { id: 'STM-2026-04', period: 'Apr 15 - Apr 30, 2026', totalOrders: 98, amount: 1850.00, vat: 92.50, status: 'Settled' },
  ];

  const freightInvoices = [
    { id: 'INV-FRG-002', date: 'Today, 10:15 AM', carrier: 'Maersk Liner', from: 'Jebel Ali Port', to: 'DWC Airport', container: '40HC', amount: 2850.00, status: 'Invoice Cleared' },
    { id: 'INV-FRG-001', date: '15 May, 14:00', carrier: 'DP World', from: 'Central JAFZA Terminal', to: 'Sharjah Hub', container: '20GP', amount: 1540.00, status: 'Invoiced Bill' }
  ];

  const handlePayoutCOD = () => {
    if (codPending <= 0) return;
    setWithdrawalState('submitting');
    setTimeout(() => {
      setWalletBalance(prev => prev + codPending);
      setCodPending(0);
      setWithdrawalState('success');
      setTimeout(() => setWithdrawalState(null), 2000);
    }, 1200);
  };

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(fundsAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    if (stripeMethod !== 'standard') {
      setStripeIsProcessing(true);
      try {
        const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_REMOVED';
        
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
              name: stripeCardName || 'USend Merchant Partner',
            },
          },
        });

        if (error) {
          throw new Error(error.message || 'Payment confirmation failed');
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          // Success! Update UI balance and show success screen
          setWalletBalance(prev => prev + parsed);
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
      setFundsAmount('');
      setShowAddFunds(false);
    }
  };

  // Setup modes
  const isStatements = merchantActiveTab === 'statements' || !merchantActiveTab || (merchantActiveTab !== 'cod' && merchantActiveTab !== 'tax' && merchantActiveTab !== 'freight_invoices' && merchantActiveTab !== 'warehouse_invoices');
  const isCOD = merchantActiveTab === 'cod';
  const isTax = merchantActiveTab === 'tax';
  const isFreightInvoices = merchantActiveTab === 'freight_invoices';
  const isWarehouseInvoices = merchantActiveTab === 'warehouse_invoices';

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 w-full ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_payments" onNavigate={onNavigate} />
      
      <main className="flex-1 p-6 lg:p-10 h-full overflow-y-auto">
        <motion.div
          key={merchantActiveTab}
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
                {isStatements ? 'Digital Statements' : isCOD ? 'Cash on Delivery (COD)' : isTax ? 'Tax Returns & VAT' : isFreightInvoices ? 'Freight Invoicing' : isWarehouseInvoices ? 'Storage Invoices' : 'Wallet & Topups'}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                {isStatements 
                  ? 'Official semi-monthly ledger statements with download options for accounting audits.'
                  : isCOD 
                    ? 'Synchronize driver accumulated cash collection funds and instantly withdraw to bank.'
                    : isTax 
                      ? '5% Federal Tax authority reports. Track VAT collected on deliveries and cross-freezone filings.'
                      : isFreightInvoices 
                        ? 'Consolidated heavy port cargo shipment receipts and marine haulage logs.'
                        : isWarehouseInvoices 
                          ? 'Assess monthly pallet storage flat rates, terminal dues and loading fees.'
                          : 'Monitor available balance credits dedicated for dispatch platform commission.'}
              </p>
            </div>

            <div className="flex gap-2 self-start sm:self-center">
              {[
                { key: 'statements', label: t('statements') || 'Statements' },
                { key: 'cod', label: 'COD Payments' },
                { key: 'tax', label: 'Tax Reports' },
                { key: 'freight_invoices', label: 'Freight Bills' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setMerchantActiveTab(tab.key)}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    merchantActiveTab === tab.key 
                      ? 'bg-zinc-900 text-white shadow-sm' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isStatements ? (
            /* TAB 1: STATEMENTS */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 text-[12px] font-black uppercase tracking-widest">
                        <th className="p-4 pl-6">Statement Reference</th>
                        <th className="p-4">Date Range</th>
                        <th className="p-4">Deliveries volume</th>
                        <th className="p-4">Vat lock (5%)</th>
                        <th className="p-4">Settle Total</th>
                        <th className="p-4 text-center">Export</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-xs">
                      {statements.map((stm, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/10">
                          <td className="p-4 pl-6">
                            <span className="font-bold text-zinc-805 block">{stm.id}</span>
                            <span className="text-[13px] uppercase tracking-wider bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md mt-1 inline-block">Audit Locked</span>
                          </td>
                          <td className="p-4 text-zinc-500">{stm.period}</td>
                          <td className="p-4 font-mono font-bold text-zinc-800">{stm.totalOrders} Dispatches</td>
                          <td className="p-4 font-mono">AED {stm.vat.toFixed(2)}</td>
                          <td className="p-4 font-bold font-mono text-zinc-950">AED {stm.amount.toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <button className="p-2 bg-zinc-100 hover:bg-zinc-205 rounded-lg text-zinc-600">
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : isCOD ? (
            /* TAB 2: COD COLLECTION PAYOUTS */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left animate-in fade-in duration-205">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-amber-50 border border-amber-200/50 p-8 rounded-[2.5rem] space-y-3">
                  <div className="flex items-center gap-3">
                    <Coins className="w-5 h-5 text-amber-600" />
                    <h2 className="font-bold text-base text-amber-950">Driver Cash Deposit Sync</h2>
                  </div>
                  <p className="text-xs text-amber-800">Your drivers collect raw door cash for your ecommerce COD orders. These cash reserves are synchronized daily at our Freezone terminal and ready to be credited instantly to your bank or portal ledger.</p>
                </div>

                {/* Bank settlement choices */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm space-y-4">
                  <span className="text-xs font-black uppercase tracking-widest text-[#4f95cc] block">Active Bank accounts</span>
                  <div className="p-5 border-2 border-dashed border-zinc-250 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-600">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-black text-xs text-zinc-805 block">Emirates NBD Business account</span>
                        <span className="text-[12px] text-zinc-400 font-mono">IBAN: AE24 0220 0000 1234 5678 901</span>
                      </div>
                    </div>
                    <span className="text-[12px] bg-blue-50 text-blue-600 font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">Primary</span>
                  </div>
                </div>
              </div>

              {/* Instant settlement drawer */}
              <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-zinc-200 p-8 shadow-md text-left flex flex-col h-full justify-between">
                  <div className="space-y-6">
                    <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                      Payout Executor
                    </h3>

                    <div className="p-5 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-3xl text-center space-y-1 shadow-md">
                      <span className="text-[12px] text-amber-100 font-extrabold uppercase tracking-widest">Direct COD Withdrawal balance</span>
                      <h4 className="text-3xl font-black font-mono">
                        AED {codPending.toFixed(2)}
                      </h4>
                    </div>

                    <div className="space-y-2 text-xs text-zinc-500 font-medium">
                      <div className="flex justify-between">
                        <span>Terminal Transfer fee</span>
                        <span className="text-zinc-900">AED 0.00 (Waived)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Arrival speed</span>
                        <span className="text-blue-600 font-bold">Instant to AED bank</span>
                      </div>
                    </div>
                  </div>

                  {codPending > 0 ? (
                    <button
                      onClick={handlePayoutCOD}
                      disabled={withdrawalState === 'submitting'}
                      className="w-full mt-8 py-3.5 bg-zinc-950 hover:bg-zinc-850 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      {withdrawalState === 'submitting' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4" />
                          Execute Bank payout
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-4 bg-blue-50 text-blue-700 text-center font-bold text-xs rounded-xl mt-6">
                      Successfully withdrawn! Ledger cleared.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isTax ? (
            /* TAB 3: TAX AND VAT */
            <div className="max-w-3xl mx-auto bg-white p-10 rounded-[2.5rem] border border-zinc-200/80 shadow-sm text-left space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-4 text-left border-b border-zinc-100 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#4f95cc]/10 text-[#4f95cc] flex items-center justify-center">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-zinc-900">Federal Tax Authority (VAT) Compliance</h2>
                  <p className="text-xs text-zinc-550">Track standard 5% tax collects on your commercial logistics dispatches.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between py-2 border-b border-zinc-50 font-semibold">
                  <span>Merchant TRN (Tax Registration Number)</span>
                  <span className="font-mono font-bold text-zinc-800">100523490200003</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-50 font-semibold">
                  <span>YTD VAT Collected on Sales</span>
                  <span className="font-mono text-zinc-800">AED 1,245.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-50 font-semibold">
                  <span>YTD Deductible Input VAT (Logistics Services)</span>
                  <span className="font-mono text-blue-600">-AED 62.25</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold text-zinc-900 pt-3">
                  <span>Net VAT Payable / (Refund due)</span>
                  <span className="text-blue-600">AED 1,182.75</span>
                </div>
              </div>

              <button
                className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-950 hover:bg-zinc-850 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export official XML/Excel VAT File
              </button>
            </div>
          ) : (
            /* TAB 4: FREIGHT INVOICES */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 text-[12px] font-black uppercase tracking-widest">
                        <th className="p-4 pl-6">Invoice ID</th>
                        <th className="p-4">Cargo Carrier</th>
                        <th className="p-4">Origin / Dest</th>
                        <th className="p-4">Locker Specification</th>
                        <th className="p-4">Invoice Net</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-xs">
                      {freightInvoices.map((inv, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/10">
                          <td className="p-4 pl-6">
                            <span className="font-bold text-zinc-805 block">{inv.id}</span>
                            <span className="text-[12px] text-zinc-400">{inv.date}</span>
                          </td>
                          <td className="p-4 font-bold text-zinc-800">{inv.carrier}</td>
                          <td className="p-4 text-zinc-500">{inv.from} &rarr; {inv.to}</td>
                          <td className="p-4 font-mono">{inv.container} cargo module</td>
                          <td className="p-4 font-bold font-mono text-zinc-900">AED {inv.amount.toFixed(2)}</td>
                          <td className="p-4">
                            <div className="flex justify-center">
                              <span className={`px-2.5 py-1 rounded-full text-[13px] font-black uppercase tracking-widest ${
                                inv.status === 'Invoice Cleared' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600 animate-pulse'
                              }`}>
                                {inv.status}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* MODALS */}
      {showAddFunds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowAddFunds(false);
            setStripeShowReceipt(false);
            setStripeIsProcessing(false);
          }} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl overflow-hidden font-sans"
          >
            {stripeShowReceipt ? (
              <div className="text-center space-y-5 py-2">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                  <span className="text-2xl">✓</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-zinc-900">Wallet Settle Transferred</h3>
                  <p className="text-xs text-zinc-400">Captured by secure Stripe UAE (stripe.com) processing engine.</p>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 text-xs space-y-2.5 max-w-sm mx-auto text-left font-medium">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Credited Settle:</span>
                    <span className="font-bold text-zinc-900">+{fundsAmount} AED</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Payment Gateway:</span>
                    <span className="font-semibold text-blue-600">Stripe UAE (Secure card)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Transaction Ref:</span>
                    <span className="font-mono text-zinc-400">TXN-PMB-TOP-{Math.floor(10000 + Math.random() * 90000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Timestamp:</span>
                    <span className="text-zinc-500 font-mono">Just Now</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFundsAmount('');
                    setStripeShowReceipt(false);
                    setShowAddFunds(false);
                  }}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
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
                            ? 'bg-blue-50 border-blue-350 text-blue-800'
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
                      className={`flex-2 py-3 font-bold rounded-xl shadow-lg transition-all cursor-pointer text-center text-white ${
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
