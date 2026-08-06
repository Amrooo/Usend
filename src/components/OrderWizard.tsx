import React, { useState, useRef, ChangeEvent, useMemo } from 'react';
import { Truck, MapPin, Phone, Lock, CheckCircle2, ArrowRight, Plane, Camera, AlertCircle, Map, UploadCloud, User, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Screen } from '../types';
import { aramexService } from '../services/aramexIntegration';
import { updateDocument } from '../lib/firebaseUtils';
import MapPicker from './MapPicker';
import Modal from './Modal';
import { countriesAndCities } from '../data';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Separate component for the actual payment form to use Stripe hooks
function StripePaymentForm({ clientSecret, totalAmount, onPaymentSuccess, onCancel }: { 
  clientSecret: string, 
  totalAmount: number, 
  onPaymentSuccess: (paymentIntent: any) => void,
  onCancel: () => void 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !isReady) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required'
      });

      if (error) {
        setErrorMessage(error.message || 'An unexpected error occurred during payment.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent);
      } else {
        setErrorMessage('Payment status unrecognized. Please try again.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Secure payment component error.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm transition-all">
        <PaymentElement onReady={() => setIsReady(true)} />
      </div>
      
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button 
          type="button" 
          onClick={onCancel} 
          disabled={isProcessing}
          className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 font-bold uppercase tracking-widest text-xs disabled:opacity-50"
        >
          Back
        </button>
        <button 
          type="submit" 
          disabled={!stripe || !isReady || isProcessing} 
          className="flex-1 py-3.5 rounded-xl bg-zinc-900 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg disabled:bg-zinc-400"
        >
          {isProcessing ? 'Verifying...' : `Secure Pay ${totalAmount} AED`}
        </button>
      </div>
    </form>
  );
}

interface OrderWizardProps {
  onNavigate: (s: Screen) => void;
  onRequestLogin?: () => void;
  isGuest?: boolean;
}

export default function OrderWizard({ onNavigate, onRequestLogin, isGuest = true }: OrderWizardProps) {
  const { isRTL, t } = useLanguage();
  const { addRequest, user, courierConfigs } = useApp();

  const [wizardStep, setWizardStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [shipmentType, setShipmentType] = useState<'domestic' | 'international' | null>(null);
  
  // Shipper details
  const [shipperData, setShipperData] = useState({
    name: user?.name || '', 
    email: user?.email || '', 
    country: 'United Arab Emirates', 
    phone: user?.phoneNumber || '', 
    city: 'Dubai', 
    street: '', 
    building: '', 
    landmark: '',
    position: null as [number, number] | null
  });

  // Receiver details
  const [receiverData, setReceiverData] = useState({
    name: '', phone: '+971 ', country: 'United Arab Emirates', city: 'Dubai', street: '', position: null as [number, number] | null
  });

  // Shipment details
  const [shipmentData, setShipmentData] = useState({
    weight: '1', 
    description: '', 
    quantity: '1', 
    photo: null as string | null, 
    courier: 'usend' as 'usend' | 'aramex' | 'noon', 
    declaredValue: '',
    codAmount: '150',
    receiverPaymentMode: 'cod' as 'cod' | 'card'
  });

  // Sender Delivery Fee payment details
  const [senderPaymentMethod, setSenderPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePubKey, setStripePubKey] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const stripePromise = useMemo(() => {
    if (!stripePubKey) return null;
    try {
      return loadStripe(stripePubKey);
    } catch (e) {
      console.error("Stripe initialization error:", e);
      setStripeError("Unable to connect to payment secure server. Please check your network.");
      return null;
    }
  }, [stripePubKey]);
  const stripeOptions = useMemo(() => stripeClientSecret ? { clientSecret: stripeClientSecret } : null, [stripeClientSecret]);
  
  const [loading, setLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapTarget, setMapTarget] = useState<'shipper' | 'receiver'>('shipper');
  
  const validatePhone = (phone: string) => {
    // Exact UAE phone format: +971 followed by 9 digits
    return /^\+971 \d{9}$/.test(phone);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handlePhoneChange = (setter: React.Dispatch<React.SetStateAction<any>>, field: string = 'phone') => (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+971 ')) {
       if (val.length < 5) val = '+971 ';
       else val = '+971 ' + val.replace(/^\+?9?7?1?\s*/, '').replace(/[^0-9]/g, '');
    } else {
       val = '+971 ' + val.slice(5).replace(/[^0-9]/g, ''); 
    }
    if (val.length > 14) val = val.slice(0, 14);
    setter((p: any) => ({ ...p, [field]: val }));
  };

  const handleSelectType = (type: 'domestic' | 'international') => {
    setShipmentType(type);
    setWizardStep(1);
    if (type === 'international') {
      setReceiverData(p => ({ ...p, country: 'Saudi Arabia' }));
    }
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShipmentData(prev => ({ ...prev, photo: reader.result as string }));
        // Mock AI Recognition delay
        setTimeout(() => {
          setShipmentData(prev => ({
            ...prev,
            description: prev.description || 'Auto-detected Package',
            weight: '5'
          }));
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotal = () => {
    let baseFee = 30;
    if (shipmentData.courier === 'aramex') {
      baseFee = 35;
    } else if (shipmentData.courier === 'noon') {
      baseFee = 28;
    } else {
      baseFee = 30; // usend
    }

    if (shipmentType === 'international') {
      baseFee = 120;
    }

    const additionalWeight = Math.max(0, parseFloat(shipmentData.weight || '1') - 5);
    const weightFee = additionalWeight * 5; // 5 AED per kg above 5kg
    return baseFee + weightFee;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (wizardStep === 1) {
      if (!validatePhone(shipperData.phone)) {
        alert(isRTL ? "يرجى إدخال رقم هاتف صحيح للمرسل" : "Please enter a valid phone number for the shipper.");
        return;
      }
      if (isGuest && !validateEmail(shipperData.email)) {
        alert(isRTL ? "يرجى إدخال بريد إلكتروني صحيح لإرسال الفاتورة" : "Please enter a valid email to receive your invoice.");
        return;
      }
    }
    if (wizardStep === 2) {
      if (!validatePhone(receiverData.phone)) {
        alert(isRTL ? "يرجى إدخال رقم هاتف صحيح للمستلم" : "Please enter a valid phone number for the receiver.");
        return;
      }
    }

    if (wizardStep === 4 && paymentMethod === 'card' && !stripeClientSecret) {
      setLoading(true);
      const startPayment = async () => {
        try {
          const pubRes = await fetch('/api/payments/config');
          const { publishableKey } = await pubRes.json();
          setStripePubKey(publishableKey);

          const response = await fetch('/api/payments/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amountAED: calculateTotal(),
              customerId: user?.uid || 'guest-' + Date.now(),
              metadata: { email: shipperData.email, type: 'wizard_order' }
            }),
          });
          const { clientSecret } = await response.json();
          setStripeClientSecret(clientSecret);
          setLoading(false);
        } catch (err: any) {
          console.error("Payment setup failed:", err);
          alert("Failed to initialize secure payment. Please try again or use Cash on Delivery.");
          setLoading(false);
        }
      };
      startPayment();
      return;
    }

    if (wizardStep < 4) {
      setWizardStep((prev) => (prev + 1) as 1|2|3|4|5);
    } else {
      if (paymentMethod === 'cod') {
        setLoading(true);
        processFinalOrder();
      }
    }
  };

  const processFinalOrder = async (confirmedPaymentIntent?: any) => {
    const newOrderId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = calculateTotal();
    
    const codVal = parseFloat(shipmentData.codAmount || '0') || 0;

    const reqPayload: any = {
      id: newOrderId,
      name: shipperData.name || (isGuest ? (isRTL ? 'ÙØ³ØªØ®Ø¯Ù Ø¶ÙÙ' : 'Guest User') : user?.name || 'User'),
      receiverName: receiverData.name || 'Recipient',
      receiverPhone: receiverData.phone || '+971',
      userId: isGuest ? undefined : user?.uid,
      phone: shipperData.phone || '+971',
      pickupAddress: shipperData.city ? `${shipperData.street}, ${shipperData.city}, ${shipperData.country}` : 'Dubai, UAE',
      channel: isGuest ? 'Guest Flow' : 'User Portal',
      date: new Date().toLocaleDateString(),
      status: 'Pending' as const,
      paymentStatus: confirmedPaymentIntent ? 'paid' : (senderPaymentMethod === 'wallet' ? 'paid' : 'pending'),
      stripeIntentId: confirmedPaymentIntent?.id,
      address: receiverData.city ? `${receiverData.street}, ${receiverData.city}, ${receiverData.country}` : 'Dubai, UAE',
      fromDestination: shipperData.city ? `${shipperData.street}, ${shipperData.city}, ${shipperData.country}` : 'Sharjah, UAE',
      toDestination: receiverData.city ? `${receiverData.street}, ${receiverData.city}, ${receiverData.country}` : 'Dubai, UAE',
      position: receiverData.position,
      itemType: 'Package',
      description: `${shipmentData.quantity}x ${shipmentData.description} (${shipmentData.weight}kg)`,
      amountType: 'single item' as const,
      paymentMethod: shipmentData.receiverPaymentMode === 'card' ? 'Card on Delivery' : 'Cash on Delivery',
      orderAmount: `${codVal} AED`,
      deliveryFee: `${totalAmount} AED`,
      senderPaymentMethod: senderPaymentMethod === 'wallet' ? 'USend Wallet' : 'Credit Card (Stripe)',
      applicantType: isGuest ? 'Guest' as const : 'User' as const,
      etaTime: 'Pending',
      courier: shipmentData.courier === 'aramex' ? 'Aramex' : shipmentData.courier === 'noon' ? 'Noon RoD' : 'USend Fleet',
    };
    
    try {
      await addRequest(reqPayload);

      // Persist transaction record directly to user's profile on Firestore upon successful credit card payment
      if (!isGuest && user && user.uid && confirmedPaymentIntent) {
        const newTxn = {
          id: `TXN-ORD-${Math.floor(10000 + Math.random() * 90000)}`,
          date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'Order Payment',
          amount: -totalAmount,
          method: 'Credit Card (Stripe)',
          status: 'Completed',
          ref: newOrderId
        };
        const currentTxns = Array.isArray(user.transactions) ? user.transactions : [];
        const updatedTxns = [newTxn, ...currentTxns];
        try {
          if (user?.uid && !user.uid.startsWith('user-')) {
            await updateDocument('users', user.uid, { transactions: updatedTxns });
          }
        } catch (txnError) {
          console.warn("Firestore user transaction sync skipped, local state maintained:", txnError);
        }
      }

      if (isGuest) {
        const storedGuest = JSON.parse(localStorage.getItem('guestOrders') || '[]');
        storedGuest.push({ id: newOrderId, phone: shipperData.phone });
        localStorage.setItem('guestOrders', JSON.stringify(storedGuest));
      }
      
      if (shipmentData.courier === 'aramex') {
        const aramexRes = await aramexService.createDeliveryJob(reqPayload);
        if (aramexRes.success === false) {
           console.error("Aramex failed (non-blocking for USend UI)", aramexRes.error);
        }
      }
      
      setCreatedOrderId(newOrderId);
      setLoading(false);
      setWizardStep(5);
    } catch (err: any) {
      console.error("Order submission failed:", err);
      alert("Submission Error: " + err.message);
      setLoading(false);
    }
  };

  const handlePrevStep = () => {
    if (wizardStep > 0) setWizardStep((prev) => (prev - 1) as 0|1|2|3|4|5);
  };

  const handleMapSelect = (addr: string, pos: [number, number]) => {
    if (mapTarget === 'shipper') {
      setShipperData(p => ({ ...p, street: addr, position: pos }));
    } else {
      setReceiverData(p => ({ ...p, street: addr, position: pos }));
    }
    setIsMapOpen(false);
  };

  const renderProgressBar = () => {
    const steps = [
      { id: 1, label: isRTL ? 'المرسل' : 'Shipper' },
      { id: 2, label: isRTL ? 'المستلم' : 'Receiver' },
      { id: 3, label: isRTL ? 'الشحنة' : 'Shipment' },
      { id: 4, label: isRTL ? 'الدفع' : 'Payment' },
    ];
    if (wizardStep === 0 || wizardStep === 5) return null;
    return (
      <div className="w-full mb-10 px-4">
        <div className="flex items-center justify-between relative" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-200 -z-10" />
          {steps.map((s) => {
            const isActive = wizardStep === s.id;
            const isCompleted = wizardStep > s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 relative bg-white md:bg-transparent">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm bg-white transition-all ${isActive ? 'border-brand text-brand' : isCompleted ? 'border-zinc-300 text-zinc-400' : 'border-zinc-300 text-zinc-400'}`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-zinc-400" /> : s.id}
                </div>
                <span className={`text-[13px] md:text-xs font-semibold absolute -bottom-6 w-24 text-center ${isActive ? 'text-brand' : 'text-zinc-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full bg-white rounded-[2.5rem] ${isGuest ? 'shadow-xs' : 'shadow-none'} p-6 md:p-10 text-slate-800`} dir={isRTL ? "rtl" : "ltr"}>
      <Modal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} title="Select Location on Map">
         <MapPicker onSelect={handleMapSelect} onClose={() => setIsMapOpen(false)} />
      </Modal>


      <AnimatePresence mode="wait">
        {wizardStep === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="py-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-4">
              
              {/* Domestic button card */}
              <motion.button 
                whileHover={{ scale: 1.025, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectType('domestic')} 
                className="bg-white border-[3px] border-zinc-100 hover:border-brand hover:shadow-2xl active:bg-zinc-50 rounded-3xl p-10 flex flex-col items-center justify-center gap-6 shadow-sm transition-all duration-300 group relative overflow-hidden cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full bg-brand/5 group-hover:bg-brand/10 flex items-center justify-center transition-all duration-300 transform group-hover:scale-110">
                  <Truck className="w-10 h-10 text-brand transition-colors stroke-[1.5]" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-zinc-800 uppercase tracking-tight">{isRTL ? "شحنة محلية" : "Domestic Shipment"}</h3>
                  <p className="text-xs text-zinc-400 font-medium">{isRTL ? "توصيل سريع بين جميع إمارات الدولة" : "Within UAE 7 Emirates"}</p>
                </div>
                <span className="absolute top-3 right-3 bg-brand/10 text-brand text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                  {isRTL ? "فوري / اليوم التالي" : "Instant / Next-Day"}
                </span>
              </motion.button>
              
              {/* International button card */}
              <div 
                className="bg-white border-[3px] border-dashed border-zinc-200 opacity-40 grayscale rounded-3xl p-10 flex flex-col items-center justify-center gap-6 shadow-sm relative overflow-hidden cursor-not-allowed select-none"
              >
                <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center">
                  <Plane className="w-10 h-10 text-zinc-400 stroke-[1.5]" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-zinc-400 uppercase tracking-tight">{isRTL ? "شحنة دولية" : "International"}</h3>
                  <p className="text-xs text-zinc-300 font-medium">{isRTL ? "شحن سريع إلى جميع أنحاء العالم" : "Global courier dispatch"}</p>
                </div>
                <span className="absolute top-3 right-3 bg-zinc-100 text-zinc-500 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                  {isRTL ? "غير متوفر حالياً" : "Not Available"}
                </span>
              </div>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {renderProgressBar()}

      <AnimatePresence mode="wait">
        {wizardStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <form onSubmit={handleNextStep} className="space-y-8 mt-16 pb-4">
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">{isRTL ? "بيانات المرسل" : "Shipper Details"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className={`space-y-2 ${isGuest ? '' : 'md:col-span-2'}`}>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Name *</label>
                  <input required type="text" value={shipperData.name} onChange={e => setShipperData(p => ({...p, name: e.target.value}))} className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none transition-colors" />
                </div>
                {isGuest && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Email (Invoice) *</label>
                    <input required type="email" value={shipperData.email} onChange={e => setShipperData(p => ({...p, email: e.target.value}))} className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none transition-colors" />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Phone *</label>
                  <input required type="tel" value={shipperData.phone} onChange={handlePhoneChange(setShipperData, 'phone')} placeholder="+971 50 1234567" className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none font-mono tracking-widest transition-colors" dir="ltr" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Country *</label>
                  <select value={shipperData.country} onChange={e => setShipperData(p => ({...p, country: e.target.value, city: countriesAndCities[e.target.value as keyof typeof countriesAndCities]?.[0] || ''}))} className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none">
                    {Object.keys(countriesAndCities).filter(c => shipmentType === 'domestic' ? c === 'United Arab Emirates' : true).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">City *</label>
                  <select value={shipperData.city} onChange={e => setShipperData(p => ({...p, city: e.target.value}))} className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none">
                    {(countriesAndCities[shipperData.country as keyof typeof countriesAndCities] || []).map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
    
                <div className="space-y-2 md:col-span-2 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Address / Street *</label>
                    <button type="button" onClick={() => { setMapTarget('shipper'); setIsMapOpen(true); }} className="text-xs font-bold text-brand bg-brand/10 px-2 py-1 flex items-center gap-1 rounded-md mb-1"><Map className="w-3 h-3"/> Map Picker</button>
                  </div>
                  <input required type="text" value={shipperData.street} onChange={e => setShipperData(p => ({...p, street: e.target.value}))} className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none transition-colors pr-10" placeholder="Street, Building, etc." />
                </div>
              </div>
              <div className="flex gap-4 pt-6"><button type="button" onClick={handlePrevStep} className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 font-bold uppercase tracking-widest text-xs">Back</button><button type="submit" className="flex-1 py-3.5 rounded-xl bg-brand text-white font-bold uppercase tracking-widest text-xs shadow-lg">Next</button></div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {wizardStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <form onSubmit={handleNextStep} className="space-y-8 mt-16 pb-4">
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">{isRTL ? "بيانات المستلم" : "Receiver Details"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Name *</label>
                  <input required type="text" value={receiverData.name} onChange={e => setReceiverData(p => ({...p, name: e.target.value}))} className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Phone *</label>
                  <input required type="tel" value={receiverData.phone} onChange={handlePhoneChange(setReceiverData, 'phone')} placeholder="+971 50 1234567" className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none font-mono tracking-widest" dir="ltr" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Country *</label>
                  <select value={receiverData.country} onChange={e => setReceiverData(p => ({...p, country: e.target.value, city: countriesAndCities[e.target.value as keyof typeof countriesAndCities]?.[0] || ''}))} className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none">
                    {Object.keys(countriesAndCities).filter(c => shipmentType === 'domestic' ? c === 'United Arab Emirates' : true).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">City *</label>
                  <select value={receiverData.city} onChange={e => setReceiverData(p => ({...p, city: e.target.value}))} className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none">
                    {(countriesAndCities[receiverData.country as keyof typeof countriesAndCities] || []).map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
    
                <div className="space-y-2 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Dropoff Address *</label>
                    <button type="button" onClick={() => { setMapTarget('receiver'); setIsMapOpen(true); }} className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 flex items-center gap-1 rounded-md mb-1"><Map className="w-3 h-3"/> Map Picker</button>
                  </div>
                  <input required type="text" value={receiverData.street} onChange={e => setReceiverData(p => ({...p, street: e.target.value}))} className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none" />
                </div>
              </div>
              <div className="flex gap-4 pt-6"><button type="button" onClick={handlePrevStep} className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 font-bold uppercase tracking-widest text-xs">Back</button><button type="submit" className="flex-1 py-3.5 rounded-xl bg-brand text-white font-bold uppercase tracking-widest text-xs shadow-lg">Next</button></div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {wizardStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <form onSubmit={handleNextStep} className="space-y-6 mt-16 pb-4">
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">{isRTL ? "تفاصيل الشحنة" : "Shipment Details"}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Weight (kg) *</label>
                  <input required type="number" step="0.1" min="0.1" value={shipmentData.weight} onChange={e => setShipmentData(p => ({...p, weight: e.target.value}))} className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Quantity *</label>
                  <input required type="number" min="1" value={shipmentData.quantity} onChange={e => setShipmentData(p => ({...p, quantity: e.target.value}))} className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Description *</label>
                  <input required type="text" value={shipmentData.description} onChange={e => setShipmentData(p => ({...p, description: e.target.value}))} className="w-full bg-zinc-50 border border-zinc-200 focus:border-brand rounded-xl px-4 py-3 outline-none" />
                  <p className="text-[10px] text-zinc-400">You can manually edit this field after photo auto-detection.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Cargo Photo (Optional - AI Extraction)</label>
                  <label className="w-full h-32 border-2 border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-brand/5">
                    {shipmentData.photo ? <img src={shipmentData.photo} className="h-full object-contain p-2"/> : <><UploadCloud className="w-8 h-8 text-zinc-400 mb-2"/><span className="text-xs font-bold">Snap or attach an image</span></>}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload}/>
                  </label>
                </div>
                
                <div className="space-y-4 md:col-span-2 pt-4 border-t border-zinc-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Select Courier & Shipping Speed</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* USend Fleet Option */}
                    <label className={`flex flex-col justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${shipmentData.courier === 'usend' ? 'border-brand bg-brand/5 shadow-md shadow-brand/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                      <input type="radio" value="usend" checked={shipmentData.courier === 'usend'} onChange={() => setShipmentData(p =>({...p, courier: 'usend'}))} className="hidden"/>
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-sans select-none text-base">
                          <span className="text-[#113f36] font-black tracking-tight">USend</span>
                          <span className="text-[#cca073] font-black tracking-tight -ml-1">Fleet</span>
                        </div>
                        <div>
                          <span className="font-black text-xl text-brand">30 AED</span>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Instant Delivery</p>
                        </div>
                      </div>
                    </label>

                    {/* Aramex Option */}
                    <label className={`flex flex-col justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${shipmentData.courier === 'aramex' ? 'border-[#E31B23] bg-red-500/5 shadow-md shadow-red-500/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                      <input type="radio" value="aramex" checked={shipmentData.courier === 'aramex'} onChange={() => setShipmentData(p =>({...p, courier: 'aramex'}))} className="hidden"/>
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-sans select-none shrink-0">
                          <span className="text-[#E31B23] font-black text-xl tracking-tighter italic">aramex</span>
                        </div>
                        <div>
                          <span className="font-black text-xl text-[#E31B23]">35 AED</span>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Next-Day Delivery</p>
                        </div>
                      </div>
                    </label>

                    {/* Noon Option */}
                    <label className={`flex flex-col justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${shipmentData.courier === 'noon' ? 'border-[#feee00] bg-yellow-500/5 shadow-md shadow-yellow-500/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                      <input type="radio" value="noon" checked={shipmentData.courier === 'noon'} onChange={() => setShipmentData(p =>({...p, courier: 'noon'}))} className="hidden"/>
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-sans select-none shrink-0">
                          <div className="bg-[#feee00] text-black font-extrabold text-xs px-2 py-1 rounded tracking-tighter">
                            noon
                          </div>
                        </div>
                        <div>
                          <span className="font-black text-xl text-zinc-950">28 AED</span>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Eco-Saver Delivery</p>
                        </div>
                      </div>
                    </label>

                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6"><button type="button" onClick={handlePrevStep} className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 font-bold uppercase tracking-widest text-xs">Back</button><button type="submit" className="flex-1 py-3.5 rounded-xl bg-brand text-white font-bold uppercase tracking-widest text-xs shadow-lg">Next</button></div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {wizardStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="space-y-8 mt-16 pb-4">
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">{isRTL ? "مراجعة الطلب" : "Summary & Payment"}</h3>
              
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 lg:p-8 space-y-6 shadow-xs mb-6 text-left rtl:text-right">
                
                {/* Visual Route */}
                <div className="bg-slate-50 rounded-2xl p-5 flex items-center justify-between border border-slate-100">
                  <div>
                    <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider block">Pickup</span>
                    <p className="font-bold text-sm text-zinc-800">{shipperData.city || 'Dubai'}</p>
                    <p className="text-[11px] text-zinc-500 font-semibold">{shipperData.name} ({shipperData.phone})</p>
                  </div>
                  <div className="flex flex-col items-center justify-center px-4">
                    <ArrowRight className="text-brand w-5 h-5 animate-pulse" />
                    <span className="text-[8px] uppercase font-bold text-zinc-400 mt-1 tracking-widest">{shipmentType === 'international' ? 'Air Cargo' : 'Land Transport'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider block">Dropoff</span>
                    <p className="font-bold text-sm text-zinc-800">{receiverData.city || 'Abu Dhabi'}</p>
                    <p className="text-[11px] text-zinc-500 font-semibold">{receiverData.name} ({receiverData.phone})</p>
                  </div>
                </div>

                {/* Package Details */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-600 border-b border-zinc-100 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider block">Package Type</span>
                    <span className="text-zinc-800 font-bold">{shipmentData.description || 'Package Shipment'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider block">Weight & Qty</span>
                    <span className="text-zinc-800 font-bold">{shipmentData.weight} kg / {shipmentData.quantity} Units</span>
                  </div>
                </div>

                {/* Pricing Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center text-zinc-500 font-medium">
                    <span>Selected Courier ({shipmentData.courier === 'aramex' ? 'Aramex' : shipmentData.courier === 'noon' ? 'Noon' : 'USend Fleet'})</span>
                    <span className="font-semibold text-zinc-800">
                      {shipmentData.courier === 'aramex' ? '35' : shipmentData.courier === 'noon' ? '28' : '30'} AED
                    </span>
                  </div>
                  
                  {parseFloat(shipmentData.weight || '0') > 5 && (
                    <div className="flex justify-between items-center text-zinc-500 font-medium">
                      <span>Weight Surcharge ({Math.max(0, parseFloat(shipmentData.weight || '0') - 5)} kg extra)</span>
                      <span className="font-semibold text-zinc-800">
                        {Math.max(0, parseFloat(shipmentData.weight || '0') - 5) * 5} AED
                      </span>
                    </div>
                  )}

                  {shipmentType === 'international' && (
                    <div className="flex justify-between items-center text-zinc-500 font-medium">
                      <span>International Base Markup</span>
                      <span className="font-semibold text-zinc-800">90 AED</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xl font-black text-brand pt-4 border-t border-slate-100 mt-4">
                    <span>Total Cost</span>
                    <span>{calculateTotal()} AED</span>
                  </div>
                </div>
              </div>
              
              {isGuest && (
                <div className="bg-brand/10 text-brand px-4 py-3 rounded-xl text-xs font-semibold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4"/>
                  An invoice will be automatically sent to {shipperData.email} upon confirmation.
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <label className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-brand bg-brand/5' : 'border-zinc-200'}`}>
                   <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 accent-brand" />
                   <div><span className="font-bold uppercase text-sm block">Cash on Delivery</span><span className="text-xs text-zinc-500">Pay on pickup or dropoff</span></div>
                 </label>
                 <label className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-brand bg-brand/5' : 'border-zinc-200'}`}>
                   <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-5 h-5 accent-brand" />
                   <div><span className="font-bold uppercase text-sm block">Card Payment</span><span className="text-xs text-zinc-500">Visa / Mastercard</span></div>
                 </label>
              </div>
    
              {paymentMethod === 'card' && stripeClientSecret && stripePromise && stripeOptions && (
                <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm animate-in zoom-in-95 duration-200">
                   <Elements stripe={stripePromise} options={stripeOptions}>
                      <StripePaymentForm 
                        clientSecret={stripeClientSecret} 
                        totalAmount={calculateTotal()}
                        onPaymentSuccess={(intent) => processFinalOrder(intent)}
                        onCancel={() => setStripeClientSecret(null)}
                      />
                   </Elements>
                </div>
              )}
    
              {paymentMethod === 'card' && !stripeClientSecret && (
                <div className="flex gap-4 pt-6"><button type="button" onClick={handlePrevStep} className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 font-bold uppercase tracking-widest text-xs">Back</button><button type="button" onClick={(e) => handleNextStep(e as any)} disabled={loading} className="flex-1 py-3.5 rounded-xl bg-zinc-900 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">{loading ? 'Preparing Payment...' : 'Proceed to Card Entry'}</button></div>
              )}
    
              {paymentMethod === 'cod' && (
                <div className="flex gap-4 pt-6"><button type="button" onClick={handlePrevStep} className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 font-bold uppercase tracking-widest text-xs">Back</button><button type="button" onClick={(e) => handleNextStep(e as any)} disabled={loading} className="flex-1 py-3.5 rounded-xl bg-zinc-900 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">{loading ? 'Processing...' : 'Confirm Order'}</button></div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {wizardStep === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="text-center py-10 space-y-6 max-w-sm mx-auto">
              <div className="w-24 h-24 rounded-full bg-brand/10 flex items-center justify-center mx-auto text-brand"><CheckCircle2 className="w-12 h-12" /></div>
              <h4 className="text-3xl font-black uppercase">Order Created</h4>
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
                 <p className="text-[10px] font-black uppercase text-slate-500">Tracking Code</p>
                 <p className="text-2xl font-mono font-bold text-brand">{createdOrderId}</p>
              </div>
              <p className="text-sm text-slate-500">{isGuest ? "Your guest order has been placed. You can track it here." : "Your delivery has been scheduled."}</p>
              <div className="pt-8">
                <button onClick={() => isGuest && onRequestLogin ? onRequestLogin() : onNavigate('user_tracking')} className="w-full py-4 rounded-xl bg-brand text-white font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2">
                   {isGuest ? "Login / Track" : "View Tracking"} <ArrowRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
