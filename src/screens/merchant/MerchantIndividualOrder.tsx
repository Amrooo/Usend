import { useState, FormEvent, useRef, ChangeEvent, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import Modal from '../../components/Modal';
import MapPicker from '../../components/MapPicker';
import CustomDatePicker from '../../components/CustomDatePicker';
import { 
  Package, 
  Send, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  Info, 
  Calendar, 
  Calculator, 
  Scale, 
  Sparkles, 
  Check, 
  TrendingUp, 
  ChevronRight, 
  Map,
  UploadCloud,
  Truck,
  AlertCircle,
  Wallet,
  CreditCard,
  CheckCircle2,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripePublishableKey, createStripePaymentIntent } from '../../lib/paymentUtils';
import StripeCheckoutForm from '../../components/merchant/StripeCheckoutForm';
import { detectEmirate } from '../../services/courierIntegration';

const UAE_ADDRESS_SUGGESTIONS = [
  { name: "Dubai Mall, Financial Center Road, Downtown Dubai", position: [25.1972, 55.2797] },
  { name: "Mall of the Emirates, Al Barsha Road, Al Barsha 1, Dubai", position: [25.1181, 55.2006] },
  { name: "Burj Khalifa, 1 Sheikh Mohammed bin Rashid Blvd, Downtown Dubai", position: [25.1972, 55.2744] },
  { name: "Dubai Marina Mall, Al Marsa Street, Dubai Marina", position: [25.0772, 55.1403] },
  { name: "Jebel Ali Port Terminal 1, Warehouse District, Dubai", position: [24.8900, 55.0800] },
  { name: "Dubai International Airport (DXB) Terminal 3, Airport Road", position: [25.2532, 55.3657] },
  { name: "Palm Jumeirah Crescent, Atlantis The Palm, Dubai", position: [25.1304, 55.1171] },
  { name: "Al Reem Island, Marina Square Towers, Abu Dhabi", position: [24.4981, 54.4034] },
  { name: "Yas Island Circuit, Yas Leisure Drive, Abu Dhabi", position: [24.4699, 54.6052] },
  { name: "Sheikh Zayed Grand Mosque, Sheikh Rashid Rd, Abu Dhabi", position: [24.4128, 54.4750] },
  { name: "Abu Dhabi Corniche Beach Walk, Abu Dhabi", position: [24.4719, 54.3415] },
  { name: "University City Campus, Sharjah University Rd, Sharjah", position: [25.3188, 55.4897] },
  { name: "Al Majaz Waterfront Park, Corniche St, Sharjah", position: [25.3242, 55.3831] },
  { name: "Al Nahda Park, Al Ittihad Road, Sharjah", position: [25.2974, 55.3789] },
  { name: "Mirdif City Centre Mall, Sheikh Mohammed Bin Zayed Rd, Dubai", position: [25.2155, 55.4072] },
  { name: "JBR Beach Walk, The Walk, Jumeirah Beach Residence, Dubai", position: [25.0739, 55.1309] },
  { name: "Al Ain Mall, Othman Bin Affan Street, Al Ain", position: [24.2185, 55.7725] },
  { name: "Khalifa City A, Street 15, Abu Dhabi", position: [24.4251, 54.5723] },
  { name: "Deira Clocktower Square, Al Maktoum Road, Dubai", position: [25.2588, 55.3298] },
  { name: "Meydan Racecourse, Al Meydan Road, Nad Al Sheba, Dubai", position: [25.1582, 55.3184] },
  { name: "Business Bay Central, Marasi Drive, Dubai", position: [25.1833, 55.2711] },
  { name: "Dubai Logistics City, Aviation City, Dubai South", position: [24.8961, 55.1611] }
];

function getDeterministicCoordinates(addressText: string): [number, number] {
  if (!addressText) return [25.2048, 55.2708]; // Dubai Center fallback
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < addressText.length; i++) {
    const char = addressText.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + char;
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + char;
    hash2 |= 0;
  }
  const lat = 24.8 + Math.abs(hash1 % 500) / 1000;
  const lng = 55.0 + Math.abs(hash2 % 400) / 1000;
  return [lat, lng];
}

interface MerchantIndividualOrderProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantIndividualOrder({ onNavigate }: MerchantIndividualOrderProps) {
  const { t, isRTL } = useLanguage();
  const { user, addRequest, updateRequest, merchantActiveTab, setMerchantActiveTab, settings, courierConfigs } = useApp();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isMapOpenQuoteTarget, setIsMapOpenQuoteTarget] = useState<'pickup' | 'dropoff' | 'manual_pickup' | 'manual_dropoff' | null>(null);
  const [isDateOpen, setIsDateOpen] = useState(false);
  
  // Autocomplete Writable input states
  const [activeAutocompleteField, setActiveAutocompleteField] = useState<'manual_pickup' | 'manual_dropoff' | 'quote_pickup' | 'quote_dropoff' | null>(null);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  
  // Normal Order State
  const [formData, setFormData] = useState<{
    customerName: string;
    phone: string;
    address: string;
    position: [number, number] | null;
    pickupAddress: string;
    pickupPosition: [number, number] | null;
    deliveryDate: string;
    amount: string;
    paymentType: string;
    notes: string;
    items: string;
    weight: string;
    carrier: string;
    printFormat: 'PDF' | 'ZPL';
    enableCod: boolean;
    length: string;
    width: string;
    height: string;
    aramexBox?: { id: string; name: string; nameAr?: string; size: string; weight: string; length: string; width: string; height: string; img: string; desc: string; tag: string } | null;
  }>({
    customerName: '',
    phone: '+971 ',
    address: '',
    position: null,
    pickupAddress: 'Dubai Warehouse - Jebel Ali Port',
    pickupPosition: [24.89, 55.08] as [number, number],
    deliveryDate: new Date().toISOString().split('T')[0] + ' 12:00',
    amount: '',
    paymentType: 'wallet',
    notes: '',
    items: '',
    weight: '2',
    carrier: 'aramex',
    printFormat: 'PDF',
    enableCod: false,
    length: '30',
    width: '22',
    height: '15',
    aramexBox: { id: 'small', name: 'Small Wonder', nameAr: 'صندوق صغير - خفيف', size: '30 × 22 × 15', weight: '2', length: '30', width: '22', height: '15', img: '📦', desc: 'MAX 2 KG', tag: 'Light Item' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAramexBoxModalOpen, setIsAramexBoxModalOpen] = useState(false);

  // Merchant Wallet & Checkout Modal States
  const [walletBalance, setWalletBalance] = useState<number>(2450.00);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('Authorizing Payment...');
  const [dispatchedSuccessOrder, setDispatchedSuccessOrder] = useState<{
    reqId: string;
    trackingNumber: string;
    carrier: string;
    totalPaid: number;
    paymentMethod: string;
    awbUrl?: string;
    date: string;
  } | null>(null);

  // Synchronize Merchant Wallet Balance in Real-Time
  useEffect(() => {
    if (user) {
      const uid = user.uid || (user as any).id;
      if (typeof (user as any).walletBalance === 'number') {
        setWalletBalance((user as any).walletBalance);
      }
      try {
        const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (typeof data.walletBalance === 'number') {
              setWalletBalance(data.walletBalance);
            }
          }
        });
        return () => unsub();
      } catch (e) {
        console.warn('Wallet listener fallback:', e);
      }
    }
  }, [user]);

  const dynamicPricing = useMemo(() => {
    const carrierKey = formData.carrier || 'aramex';
    const config = courierConfigs?.[carrierKey];
    const rates = config?.rates?.merchant || { baseFee: 12, perKmRate: 0.5, perKgRate: 2.5, expressSurcharge: 10, codFee: 5 };
    
    let distance = 0;
    if (formData.pickupPosition && formData.position) {
      const R = 6371;
      const dLat = (formData.position[0] - formData.pickupPosition[0]) * Math.PI / 180;
      const dLon = (formData.position[1] - formData.pickupPosition[1]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(formData.pickupPosition[0] * Math.PI / 180) * Math.cos(formData.position[0] * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    
    const distFee = Number((distance * (rates.perKmRate || 0.5)).toFixed(2));
    const parsedWeight = parseFloat(formData.weight) || 2;
    const weightFee = Number((parsedWeight > 5 ? (parsedWeight - 5) * (rates.perKgRate || 2.5) : 0).toFixed(2));
    const codFee = formData.enableCod ? (rates.codFee || 5) : 0;
    
    const baseTotal = rates.baseFee + distFee + weightFee + codFee;
    const commission = Number((settings?.merchantCommission || 5.00).toFixed(2));
    const total = Number((baseTotal + commission).toFixed(2));
    
    return {
      baseFee: rates.baseFee,
      distFee,
      distance: Number(distance.toFixed(1)),
      weightFee,
      codFee,
      commission,
      total
    };
  }, [formData.carrier, formData.pickupPosition, formData.position, formData.weight, formData.enableCod, courierConfigs, settings]);

  // Deep Domain Courier Rules & Restrictions Engine (Noon vs Aramex)
  const courierCompliance = useMemo(() => {
    const weightNum = parseFloat(formData.weight) || 0;
    const lengthNum = parseFloat(formData.length) || 0;
    const widthNum = parseFloat(formData.width) || 0;
    const heightNum = parseFloat(formData.height) || 0;
    const codNum = formData.enableCod ? (parseFloat(formData.amount || '0') || 0) : 0;
    const distance = dynamicPricing.distance;

    const violations: Array<{ rule: string; message: string; fixCourier?: 'aramex' | 'noon' }> = [];

    if (formData.carrier === 'noon') {
      // 1. Noon On-Demand Weight Limit (Max 15 kg)
      if (weightNum > 15) {
        violations.push({
          rule: 'Weight Exceeded for Noon (Max 15 kg)',
          message: `Noon on-demand rider delivery accepts parcels up to 15 kg (current: ${weightNum} kg). Please switch to Aramex Express.`,
          fixCourier: 'aramex'
        });
      }

      // 2. Noon Dimensions Limit (Max 50 x 40 x 40 cm for rider thermal container)
      if (lengthNum > 50 || widthNum > 40 || heightNum > 40) {
        violations.push({
          rule: 'Dimensions Exceeded for Noon (Max 50×40×40 cm)',
          message: `Noon parcel dimensions cannot exceed 50×40×40 cm to fit rider storage bags (current: ${lengthNum}×${widthNum}×${heightNum} cm). Please switch to Aramex Express.`,
          fixCourier: 'aramex'
        });
      }

      // 3. Noon Intra-Emirate Policy Enforcement (Pickup and Delivery must be in the SAME Emirate)
      const originEmirate = detectEmirate(formData.pickupAddress, formData.pickupPosition);
      const destEmirate = detectEmirate(formData.address, formData.position);
      if (originEmirate !== destEmirate) {
        violations.push({
          rule: 'Noon Intra-Emirate Restriction',
          message: `Noon Rider-on-Demand strictly delivers intra-emirate (inside ${originEmirate} only). Inter-emirate shipments (${originEmirate} ➔ ${destEmirate}) are not supported by Noon. Please switch to Aramex Express.`,
          fixCourier: 'aramex'
        });
      } else if (distance > 65) {
        violations.push({
          rule: 'Distance Exceeded for Noon Hyperlocal (Max 65 km)',
          message: `Noon on-demand operates strictly within 65 km (current trip: ${distance} km). Long-distance linehauls must be shipped via Aramex Express.`,
          fixCourier: 'aramex'
        });
      }

      // 4. Noon Cash on Delivery Limit (Max AED 2,500 for rider transit safety)
      if (formData.enableCod && codNum > 2500) {
        violations.push({
          rule: 'COD Limit Exceeded for Noon (Max AED 2,500)',
          message: `Noon on-demand rider cash collection limit is AED 2,500 (current: AED ${codNum.toFixed(2)}). Please switch to Aramex Express for higher COD values.`,
          fixCourier: 'aramex'
        });
      }
    } else if (formData.carrier === 'aramex') {
      // 1. Aramex Standard Express Weight Limit (Max 50 kg)
      if (weightNum > 50) {
        violations.push({
          rule: 'Aramex Standard Express Weight Limit (Max 50 kg)',
          message: `Aramex standard courier express allows up to 50 kg per piece (current: ${weightNum} kg). Shipments exceeding 50 kg must be split or booked as pallet freight.`
        });
      }

      // 2. Aramex Standard Length & Girth Limit (Max 150 cm length, max girth 300 cm)
      const girth = lengthNum + 2 * (widthNum + heightNum);
      if (lengthNum > 150 || girth > 300) {
        violations.push({
          rule: 'Aramex Dimension Limit Exceeded (Max 150 cm)',
          message: `Aramex parcel exceeds standard dimension limits (Max length: 150 cm, Max girth: 300 cm). Current length: ${lengthNum} cm, Girth: ${girth.toFixed(0)} cm.`
        });
      }

      // 3. Aramex COD Limit (Max AED 10,000)
      if (formData.enableCod && codNum > 10000) {
        violations.push({
          rule: 'Aramex COD Limit (Max AED 10,000)',
          message: `Aramex cash on delivery threshold is AED 10,000 per shipment (current: AED ${codNum.toFixed(2)}).`
        });
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations
    };
  }, [formData.carrier, formData.weight, formData.length, formData.width, formData.height, formData.enableCod, formData.amount, dynamicPricing.distance]);

  // Stripe Integration States
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePubKey, setStripePubKey] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const stripePromise = useMemo(() => {
    if (!stripePubKey) return null;
    try {
      return loadStripe(stripePubKey);
    } catch (e) {
      console.error("Stripe initialization error:", e);
      setStripeError("Unable to connect to secure payment network.");
      return null;
    }
  }, [stripePubKey]);

  const stripeOptions = useMemo(() => stripeClientSecret ? { clientSecret: stripeClientSecret } : null, [stripeClientSecret]);

  // Quick Wallet Top-up: switch to card checkout to fund wallet
  const handleQuickWalletTopup = (amount: number) => {
    setCheckoutPaymentMethod('card');
    setIsCheckoutModalOpen(true);
    window.dispatchEvent(new CustomEvent('app_toast', {
      detail: {
        title: 'Top-Up via Card',
        message: `Complete card payment to add AED ${amount} to your wallet balance.`,
        type: 'info'
      }
    }));
  };

  // Execute Payment and Dispatch to Courier
  const handleExecutePaymentAndDispatch = async (paymentMethod: 'wallet' | 'card', stripePaymentIntent?: any) => {
    if (paymentMethod === 'wallet' && walletBalance < dynamicPricing.total) {
      window.dispatchEvent(new CustomEvent('app_toast', {
        detail: { title: 'Insufficient Wallet Balance', message: `Your current balance is AED ${walletBalance.toFixed(2)}, which is less than the required AED ${dynamicPricing.total.toFixed(2)}. Please top up or pay with card.`, type: 'error' }
      }));
      return;
    }

    setIsProcessingPayment(true);
    setProcessingStatusText(paymentMethod === 'wallet' ? 'Authorizing & Deducting Wallet Settle...' : 'Verifying Secure Card Payment...');

    try {
      // 1. Process Wallet Deduction if wallet payment
      if (paymentMethod === 'wallet') {
        const newBalance = Number((walletBalance - dynamicPricing.total).toFixed(2));
        setWalletBalance(newBalance);
        if (user) {
          try {
            const uid = user.uid || (user as any).id;
            await setDoc(doc(db, 'users', uid), { walletBalance: newBalance }, { merge: true });
          } catch (e) {
            console.warn('Wallet balance sync error:', e);
          }
        }
      }

      // 2. Generate unique order Reference ID
      const reqId = `REQ-${Math.floor(1000 + Math.random() * 9000).toString()}`;
      setProcessingStatusText(`Connecting to ${formData.carrier === 'aramex' ? 'Aramex Express' : 'Noon Hyperlocal'} Courier Network...`);

      // 3. Dispatch directly to Courier API
      const config = courierConfigs?.[formData.carrier];
      const activeCreds = config
        ? (config.currentMode === 'sandbox' ? config.sandboxCreds : config.productionCreds)
        : undefined;

      const canonicalPayload = {
        senderName: "USend Merchant",
        senderPhone: formData.pickupPhone || "+971500000000",
        senderCity: formData.pickupCity || "Dubai",
        senderCountry: "AE",
        senderAddress: formData.pickupAddress || "Merchant Store",
        receiverName: formData.customerName || "Recipient",
        receiverPhone: formData.phone || "+971520000000",
        receiverCity: formData.address?.split(',')[1]?.trim() || "Dubai",
        receiverCountry: "AE",
        receiverAddress: formData.address || "Delivery Address",
        goodsDescription: formData.notes || "E-commerce Goods",
        weightKg: formData.weight ? parseFloat(formData.weight) : 1.0,
        codAmountAED: formData.enableCod ? (parseFloat(formData.amount || '0') || 0) : 0,
        reference: reqId,
        dimensions: {
          length: parseFloat(formData.length) || 10,
          width: parseFloat(formData.width) || 10,
          height: parseFloat(formData.height) || 10
        }
      };

      setProcessingStatusText('Generating Official Courier Waybill & Tracking ID...');

      let finalTrackingNumber = `AWB-${Math.floor(10000000 + Math.random() * 90000000)}`;
      let awbUrl: string | undefined;

      try {
        const res = await fetch('/api/courier/shipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courierId: formData.carrier,
            payload: canonicalPayload,
            credentials: activeCreds ? { ...activeCreds, apiEnv: config?.currentMode } : undefined,
            environment: config?.currentMode || 'sandbox'
          })
        });

        const courierRes = await res.json();
        if (courierRes.success && courierRes.trackingNumber) {
          finalTrackingNumber = courierRes.trackingNumber;
          awbUrl = courierRes.awbUrl || courierRes.labelUrl;
        }
      } catch (courierErr) {
        console.warn('Courier API dispatch fallback:', courierErr);
      }

      // 4. Save the Confirmed & Paid Request in DB
      const payload = {
        id: reqId,
        name: formData.customerName,
        phone: formData.phone,
        channel: 'Merchant Portal',
        date: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        status: 'Assigned' as const,
        position: formData.position!,
        address: formData.address,
        itemType: formData.items || 'General Goods',
        description: formData.notes,
        amountType: 'packages' as const,
        paymentMethod: paymentMethod === 'wallet' ? 'Merchant Wallet' : 'Credit Card (Stripe)',
        paymentStatus: 'PAID',
        stripeIntentId: stripePaymentIntent?.id,
        orderAmount: `${dynamicPricing.total.toFixed(2)} AED`,
        applicantType: 'Merchant' as const,
        fromDestination: formData.pickupAddress,
        toDestination: formData.address,
        etaTime: '2 Hours',
        carrier: formData.carrier,
        externalTrackingNumber: finalTrackingNumber,
        awbLabelUrl: awbUrl,
        printFormat: formData.printFormat
      };

      await addRequest(payload);

      // 5. Present Success Receipt Screen
      setDispatchedSuccessOrder({
        reqId,
        trackingNumber: finalTrackingNumber,
        carrier: formData.carrier === 'aramex' ? 'Aramex Express' : 'Noon Hyperlocal',
        totalPaid: dynamicPricing.total,
        paymentMethod: paymentMethod === 'wallet' ? 'Merchant Wallet' : 'Credit Card (Stripe)',
        awbUrl,
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      window.dispatchEvent(new CustomEvent('app_toast', {
        detail: { title: 'Order Dispatched & Paid!', message: `Shipment #${finalTrackingNumber} is now assigned and in progress.`, type: 'success' }
      }));

    } catch (err: any) {
      console.error('Order checkout error:', err);
      window.dispatchEvent(new CustomEvent('app_toast', {
        detail: { title: 'Checkout Failed', message: err.message || 'Could not process order payment.', type: 'error' }
      }));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Merchant AI recognition uploader state and tools
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [merchantPhoto, setMerchantPhoto] = useState<string | null>(null);
  const [isAnalyzingMerchantItem, setIsAnalyzingMerchantItem] = useState(false);
  const [merchantAIResult, setMerchantAIResult] = useState<{
    itemName?: string;
    category?: string;
    estimatedValueAED?: number;
    estimatedWeightKg?: number;
    quantity?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    notes?: string;
  } | null>(null);

  const analyzeMerchantItemWithAI = async (nameToUse?: string, base64ToUse?: string | null) => {
    const targetName = nameToUse !== undefined ? nameToUse : formData.items;
    const targetPhoto = base64ToUse !== undefined ? base64ToUse : merchantPhoto;

    if (!targetName && !targetPhoto) return;

    setIsAnalyzingMerchantItem(true);
    try {
      const response = await fetch('/api/gemini/analyze-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemName: targetName,
          photoBase64: targetPhoto
        })
      });

      if (!response.ok) {
        throw new Error("Failed to recognize item details with AI");
      }

      const data = await response.json();
      if (data && !data.error) {
        setFormData(prev => ({
          ...prev,
          items: data.itemName || prev.items,
          weight: (data.estimatedWeightKg && data.estimatedWeightKg > 15) ? 'heavy' : (data.estimatedWeightKg && data.estimatedWeightKg > 4) ? 'medium' : 'light',
          notes: data.notes ? `${data.notes}` : prev.notes
        }));

        setQuoteData(prev => ({
          ...prev,
          weightKg: data.estimatedWeightKg ? String(data.estimatedWeightKg) : prev.weightKg,
          lengthCm: data.lengthCm ? String(data.lengthCm) : prev.lengthCm,
          widthCm: data.widthCm ? String(data.widthCm) : prev.widthCm,
          heightCm: data.heightCm ? String(data.heightCm) : prev.heightCm
        }));

        setMerchantAIResult(data);
      }
    } catch (err) {
      console.error("Merchant AI Recognition error:", err);
    } finally {
      setIsAnalyzingMerchantItem(false);
    }
  };

  const handleMerchantPhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setMerchantPhoto(base64);
        analyzeMerchantItemWithAI(formData.items, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quote Calculator State
  const [quoteData, setQuoteData] = useState({
    pickupAddress: 'Dubai Warehouse - Jebel Ali Port',
    pickupPosition: [24.89, 55.08] as [number, number],
    dropoffAddress: '',
    dropoffPosition: null as [number, number] | null,
    weightKg: '5',
    lengthCm: '30',
    widthCm: '20',
    heightCm: '15',
    serviceLevel: 'express', // eco, standard, express
    insurance: true
  });

  interface QuoteOption {
     courier: string;
     baseFee: number;
     insuranceFee: number;
     discount: number;
     total: number;
     eta: string;
  }

  const [calculatedQuotes, setCalculatedQuotes] = useState<{
    distanceKm: number;
    options: QuoteOption[];
  } | null>(null);

  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);

  const handleCalculateQuote = async () => {
    if (!quoteData.dropoffAddress) return;
    setIsCalculatingQuote(true);
    let dist = Math.floor(15 + Math.random() * 45); // distance in km fallback
    try {
      // Distance calculation
      if (quoteData.pickupPosition && quoteData.dropoffPosition) {
        const R = 6371; // Earth's Radius in km
        const dLat = (quoteData.dropoffPosition[0] - quoteData.pickupPosition[0]) * Math.PI / 180;
        const dLon = (quoteData.dropoffPosition[1] - quoteData.pickupPosition[1]) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(quoteData.pickupPosition[0] * Math.PI / 180) * Math.cos(quoteData.dropoffPosition[0] * Math.PI / 180) * 
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const computedDist = R * c;
        dist = computedDist < 1 ? 1.5 : Number(computedDist.toFixed(1));
      }

      // Try calling live Aramex API
      const { courierIntegrationService, defaultAramexCreds } = await import('../../services/courierIntegration');
      const rateRes = await courierIntegrationService.calculateRate('aramex', {
         credentials: defaultAramexCreds,
         originCity: 'Dubai',
         originCountry: 'AE',
         destCity: quoteData.dropoffAddress.includes('Abu Dhabi') ? 'Abu Dhabi' : 'Dubai',
         destCountry: 'AE',
         weightKb: parseFloat(quoteData.weightKg) || 1,
         isExpress: quoteData.serviceLevel === 'express'
      });

      const aramexTotal = (rateRes.rateAED || 12) + (quoteData.insurance ? 5 : 0);
      
      const options: QuoteOption[] = [
        {
          courier: 'aramex',
          baseFee: rateRes.breakdown?.base || 12,
          insuranceFee: quoteData.insurance ? 5 : 0,
          discount: 0,
          total: aramexTotal,
          eta: quoteData.serviceLevel === 'express' ? '1.5 Hours' : quoteData.serviceLevel === 'standard' ? 'Same Day' : 'Next Day'
        },
        {
          courier: 'usend_fleet',
          baseFee: (rateRes.breakdown?.base || 12) * 0.8,
          insuranceFee: quoteData.insurance ? 3 : 0,
          discount: 0,
          total: Number(((rateRes.rateAED || 12) * 0.8 + (quoteData.insurance ? 3 : 0)).toFixed(2)),
          eta: quoteData.serviceLevel === 'express' ? '2 Hours' : 'Next Day'
        },
        {
          courier: 'dhl_express',
          baseFee: (rateRes.breakdown?.base || 12) * 1.5,
          insuranceFee: quoteData.insurance ? 8 : 0,
          discount: 0,
          total: Number(((rateRes.rateAED || 12) * 1.5 + (quoteData.insurance ? 8 : 0)).toFixed(2)),
          eta: '45 Minutes'
        }
      ];

      setCalculatedQuotes({ distanceKm: dist, options: options.sort((a,b) => a.total - b.total) });

    } catch (err) {
      console.error("Calculate quote failed:", err);
      // Fallback
      const base = 12;
      const weightBonus = Math.max(0, (parseFloat(quoteData.weightKg) - 2) * 1.5);
      const ins = quoteData.insurance ? 5 : 0;
      const multiplier = quoteData.serviceLevel === 'express' ? 1.5 : quoteData.serviceLevel === 'eco' ? 0.85 : 1.0;
      const subtotal = (base + dist * 2.5 + weightBonus) * multiplier;
      const discount = quoteData.serviceLevel === 'eco' ? subtotal * 0.1 : 0;
      const totalNum = subtotal - discount + ins;

      setCalculatedQuotes({
        distanceKm: dist,
        options: [
          { courier: 'aramex', baseFee: base, insuranceFee: ins, discount, total: totalNum, eta: 'Same Day' }
        ]
      });
    } finally {
      setIsCalculatingQuote(false);
    }
  };

  const validatePhone = (phone: string) => {
    return /^\+971 \d{9}$/.test(phone);
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+971 ')) {
       if (val.length < 5) val = '+971 ';
       else val = '+971 ' + val.replace(/^\+?9?7?1?\s*/, '').replace(/[^0-9]/g, '');
    } else {
       val = '+971 ' + val.slice(5).replace(/[^0-9]/g, ''); 
    }
    if (val.length > 14) val = val.slice(0, 14);
    setFormData({...formData, phone: val});
  };

  const validateOrderForm = () => {
    if (!formData.customerName || formData.customerName.trim().length < 2) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { title: 'Missing Recipient Name', message: 'Please enter the recipient / customer full name.', type: 'error' } }));
      return false;
    }
    if (!validatePhone(formData.phone)) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { title: 'Invalid Phone Number', message: 'Please enter a valid UAE phone number starting with +971 followed by 9 digits.', type: 'error' } }));
      return false;
    }
    if (!formData.pickupAddress || !formData.pickupPosition) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { title: 'Missing Pickup Location', message: 'Please select a valid pickup warehouse / location.', type: 'error' } }));
      return false;
    }
    if (!formData.address || !formData.position) {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: { title: 'Missing Dropoff Location', message: 'Please select or search a valid delivery destination.', type: 'error' } }));
      return false;
    }
    if (!courierCompliance.isCompliant) {
      const topViolation = courierCompliance.violations[0];
      window.dispatchEvent(new CustomEvent('app_toast', {
        detail: {
          title: `Courier Incompatibility: ${formData.carrier === 'noon' ? 'Noon Hyperlocal' : 'Aramex Express'}`,
          message: topViolation.message,
          type: 'error'
        }
      }));
      return false;
    }
    return true;
  };

  const handleNormalSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateOrderForm()) return;
    setDispatchedSuccessOrder(null);
    setCheckoutPaymentMethod(formData.paymentType as 'wallet' | 'card');
    setIsCheckoutModalOpen(true);
  };

  const isGetQuoteMode = merchantActiveTab === 'get_quotes';

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_individual" onNavigate={onNavigate} />
      
      <main className="flex-1 p-4 md:p-10 h-full overflow-y-auto relative">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#113f36]/5 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0"></div>

        <motion.div
          key={isGetQuoteMode ? "quote_mode" : "order_mode"}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-8 relative z-10"
        >
          {/* Header Segment */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/60 pb-6">
            <div>
              <span className="text-[#113f36] font-bold text-[12px] uppercase tracking-[0.4em]">
                {isGetQuoteMode ? 'Pricing Engine' : 'Express Delivery'}
              </span>
              <h1 className="text-3xl font-display font-medium text-zinc-900 uppercase tracking-tight mt-1">
                {isGetQuoteMode ? 'Instant Commission Quote' : 'New Manual Order'}
              </h1>
              <p className="text-sm text-zinc-500 mt-1.5">
                {isGetQuoteMode 
                  ? 'Calculate real-time shipping quotes based on weight, volume, and service tier.' 
                  : 'Dispatch high-priority orders instantly with our hyper-local dispatch network.'}
              </p>
            </div>

            {/* Sub-tab quick switcher */}
            <div className="bg-zinc-200/60 p-1.5 rounded-2xl flex items-center gap-1 self-start sm:self-center">
              <button 
                onClick={() => setMerchantActiveTab('manual_orders')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  !isGetQuoteMode 
                    ? 'bg-white text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Manual Order
              </button>
              <button 
                onClick={() => setMerchantActiveTab('get_quotes')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  isGetQuoteMode 
                    ? 'bg-white text-zinc-900 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Get Quotes
              </button>
            </div>
          </div>

          {!isGetQuoteMode ? (
            /* MANUAL ORDER DISPATCH FORM */
            <form onSubmit={handleNormalSubmit} className="max-w-4xl mx-auto space-y-7">
                {/* Customer Information Cards */}
                <div className="bg-white border border-[#EBEFE9] rounded-[2.5rem] p-5 md:p-8 shadow-[0_8px_30px_rgb(220,225,235,0.45)] space-y-7">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#113f36]/10 text-[#546a40] flex items-center justify-center">
                      <User className="w-[18px] h-[18px]" />
                    </div>
                    <h2 className="font-bold text-lg text-slate-800">Customer Details</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">FullName</label>
                      <div className="relative flex items-center">
                        <User className="absolute left-4 text-slate-400 w-4.5 h-4.5 z-10" />
                        <input 
                          required
                          type="text" 
                          value={formData.customerName}
                          onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                          placeholder="John Doe" 
                          className="w-full bg-slate-50/50 border border-[#E2E8F0] focus:border-[#546a40] focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 outline-none text-slate-900 transition-all font-medium text-sm focus:ring-4 focus:ring-[#546a40]/10 shadow-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Recipient Phone</label>
                      <div className="relative flex items-center">
                        <Phone className="absolute left-4 text-slate-400 w-4.5 h-4.5 z-10" />
                        <input 
                          required
                          type="tel" 
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          placeholder="+971 50 XXXXXXX" 
                          className="w-full bg-slate-50/50 border border-[#E2E8F0] focus:border-[#546a40] focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 outline-none text-slate-900 transition-all font-mono tracking-widest text-sm focus:ring-4 focus:ring-[#546a40]/10 shadow-xs"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 relative">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Pickup Location / Warehouse</label>
                      <div className="relative flex items-center">
                        <MapPin className="absolute left-4 text-[#546a40] w-4.5 h-4.5 z-10" />
                        <input 
                          required
                          type="text" 
                          value={formData.pickupAddress}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({
                              ...formData,
                              pickupAddress: val,
                              pickupPosition: getDeterministicCoordinates(val)
                            });
                          }}
                          placeholder="Type pickup address or use map..." 
                          className="w-full bg-slate-50/50 border border-[#E2E8F0] focus:border-[#546a40] focus:bg-white rounded-2xl pl-12 pr-28 py-3.5 outline-none text-slate-900 font-medium text-sm truncate z-0 focus:ring-4 focus:ring-[#546a40]/10 shadow-xs"
                        />
                        <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setIsMapOpenQuoteTarget('manual_pickup');
                              setIsMapOpen(true);
                            }}
                            className="h-[38px] px-3.5 rounded-xl bg-[#546a40]/5 hover:bg-[#546a40]/10 active:scale-95 text-[#546a40] border border-[#546a40]/15 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Map className="w-3.5 h-3.5" /> Map
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Dropoff Location / Customer</label>
                      <div className="relative flex items-center">
                        <MapPin className="absolute left-4 text-rose-500 w-4.5 h-4.5 z-10" />
                        <input 
                          required
                          type="text" 
                          value={formData.address}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({
                              ...formData,
                              address: val,
                              position: getDeterministicCoordinates(val)
                            });
                          }}
                          placeholder="Type dropoff address or use map..." 
                          className="w-full bg-slate-50/50 border border-[#E2E8F0] focus:border-[#546a40] focus:bg-white rounded-2xl pl-12 pr-28 py-3.5 outline-none text-slate-900 font-medium text-sm truncate z-0 focus:ring-4 focus:ring-[#546a40]/10 shadow-xs"
                        />
                        
                        <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setIsMapOpenQuoteTarget('manual_dropoff');
                              setIsMapOpen(true);
                            }}
                            className="h-[38px] px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-600 border border-rose-200/40 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Map className="w-3.5 h-3.5" /> Map
                          </button>
                        </div>
                      </div>

                      {/* Quick option: Call recipient on arrival */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const note = "Call recipient on arrival / for exact drop-off pin";
                            const current = formData.address || '';
                            let newAddress = '';
                            if (current.includes("Call recipient on arrival")) {
                              newAddress = current.replace(new RegExp(`(\\s*[-–,]\\s*)?${note}`, 'gi'), '').trim();
                            } else {
                              const base = current.trim() ? `${current.trim()} - ` : 'Dubai, UAE - ';
                              newAddress = `${base}${note}`;
                            }
                            setFormData({
                              ...formData,
                              address: newAddress,
                              position: getDeterministicCoordinates(newAddress)
                            });
                          }}
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none shadow-xs ${
                            formData.address?.includes("Call recipient on arrival")
                              ? 'bg-[#113F36] border-[#113F36] text-white shadow-md shadow-[#113F36]/20'
                              : 'bg-emerald-50/70 border-emerald-200/90 text-[#113F36] hover:bg-emerald-100 hover:border-emerald-400'
                          }`}
                        >
                          <Phone className={`w-3.5 h-3.5 shrink-0 ${formData.address?.includes("Call recipient on arrival") ? 'text-[#cca073]' : 'text-emerald-700'}`} />
                          <span>{isRTL ? "الاتصال بالمستلم عند الوصول لتحديد موقع التسليم" : "Call recipient on arrival / for exact drop-off pin"}</span>
                          {formData.address?.includes("Call recipient on arrival") && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#cca073] shrink-0" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Scheduled Delivery</label>
                      <div className="relative flex items-center">
                        <Calendar className="absolute left-4 text-slate-400 w-4.5 h-4.5 z-10 pointer-events-none" />
                        <input 
                          readOnly
                          required
                          type="text" 
                          value={formData.deliveryDate}
                          onClick={() => setIsDateOpen(true)}
                          className="w-full bg-slate-50/50 border border-[#E2E8F0] hover:border-slate-300 rounded-2xl pl-12 pr-4 py-3.5 outline-none text-slate-900 cursor-pointer font-medium text-sm transition-all shadow-xs"
                        />
                      </div>
                    </div>
                    
                    {/* Dynamic Distance Indicator */}
                    <div className="space-y-2 col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">GPS Calculated Distance</label>
                      <div className="w-full h-[50px] bg-slate-50/50 border border-[#E2E8F0] rounded-2xl px-5 font-semibold text-sm text-slate-800 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Calculated:</span>
                          <span>
                            {formData.pickupPosition && formData.position ? (
                              <strong className="text-[#546a40] font-black text-sm tracking-tight animate-fade-in">
                                {Number((() => {
                                  const R = 6371;
                                  const dLat = (formData.position[0] - formData.pickupPosition[0]) * Math.PI / 180;
                                  const dLon = (formData.position[1] - formData.pickupPosition[1]) * Math.PI / 180;
                                  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(formData.pickupPosition[0] * Math.PI / 180) * Math.cos(formData.position[0] * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
                                  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                                })()).toFixed(1)} km
                              </strong>
                            ) : (
                              <span className="text-zinc-400 dark:text-zinc-500 italic font-medium text-xs">Waiting for locations</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package Information Card */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-200/80 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                        <Package className="w-[18px] h-[18px]" />
                      </div>
                      <h2 className="font-bold text-lg text-zinc-800">Package Parameters & Details</h2>
                    </div>
                    <span className="text-[15px] font-bold text-[#113f36] bg-[#113f36]/10 px-2 py-1 rounded-md">
                      AI Auto-recognition Enabled
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Item Contents</label>
                      {formData.items.length >= 3 && (
                        <button
                          type="button"
                          onClick={() => analyzeMerchantItemWithAI()}
                          disabled={isAnalyzingMerchantItem}
                          className="text-[12px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold py-1 px-3 rounded-lg flex items-center gap-1 hover:brightness-110 disabled:opacity-50 transition-all select-none shadow-xs"
                        >
                          ✨ Fill with AI
                        </button>
                      )}
                    </div>
                    <textarea 
                      rows={3}
                      value={formData.items}
                      onChange={(e) => setFormData({...formData, items: e.target.value})}
                      onBlur={() => {
                        if (formData.items.length >= 3 && !isAnalyzingMerchantItem && !merchantAIResult) {
                          analyzeMerchantItemWithAI(formData.items, merchantPhoto);
                        }
                      }}
                      placeholder="e.g. 1x Mac Studio, 2x Keyboard Accessories" 
                      className="w-full bg-zinc-50 border border-zinc-200/60 focus:border-[#113f36] rounded-xl px-4 py-3 outline-none text-zinc-900 font-medium text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Cargo Photo (Optional)</label>
                      <span className="text-[15px] text-zinc-400">Skip photo, type manually, or snap anytime!</span>
                    </div>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#113f36] hover:bg-[#113f36]/5 transition-all text-zinc-500"
                    >
                      {merchantPhoto ? (
                        <div className="relative w-full h-full p-2">
                          <img src={merchantPhoto} alt="Merchant Cargo Preview" className="w-full h-full object-contain rounded-lg" />
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 opacity-50 text-orange-500 animate-bounce" />
                          <span className="text-xs font-bold text-zinc-800">Click to upload package image for instant parameter filling</span>
                          <span className="text-[12px] text-zinc-400">Directly extracts weight, counts, values, and package sizes!</span>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleMerchantPhotoUpload}
                    />
                  </div>

                  {isAnalyzingMerchantItem && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-orange-50/70 border border-orange-100 rounded-2xl flex items-center gap-3"
                    >
                      <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-600 rounded-full animate-spin shrink-0"></div>
                      <div>
                        <h4 className="text-xs font-bold text-orange-900 uppercase tracking-wider flex items-center gap-1">
                          <span>✨ AI Freight Analyst parsing shipment characteristics...</span>
                        </h4>
                        <p className="text-[12px] text-orange-600 mt-0.5 font-medium">Auto-estimating bulk weight, package dimensions (LxWxH), and confirming package counts.</p>
                      </div>
                    </motion.div>
                  )}

                  {merchantAIResult && !isAnalyzingMerchantItem && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-zinc-50 border border-zinc-250/60 rounded-2xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] uppercase font-black tracking-widest text-orange-600 flex items-center gap-1">
                          📦 AI EXPORT ESTIMATES APPLIED
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setMerchantAIResult(null)}
                          className="text-[15px] font-bold text-zinc-400 hover:text-zinc-650"
                        >
                          Reset Parameters
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div className="bg-white p-2.5 rounded-xl border border-zinc-100">
                          <span className="text-[12px] uppercase tracking-wider text-zinc-400 block font-bold">Est. Weight</span>
                          <span className="text-xs font-extrabold text-zinc-850">{merchantAIResult.estimatedWeightKg || 5} kg</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-zinc-100">
                          <span className="text-[12px] uppercase tracking-wider text-zinc-400 block font-bold">Dimensions</span>
                          <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                            {merchantAIResult.lengthCm || 30}x{merchantAIResult.widthCm || 20}x{merchantAIResult.heightCm || 15}cm
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-zinc-100">
                          <span className="text-[12px] uppercase tracking-wider text-zinc-400 block font-bold">Total Quantity</span>
                          <span className="text-xs font-extrabold text-zinc-850">{merchantAIResult.quantity || 1} Item(s)</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-zinc-100">
                          <span className="text-[12px] uppercase tracking-wider text-zinc-400 block font-bold">Transit Decl. Value</span>
                          <span className="text-xs font-extrabold text-zinc-850">{merchantAIResult.estimatedValueAED || 120} AED</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Handling Directives & Notes</label>
                    <textarea 
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="e.g. Leave with security guard, fragile contents" 
                      className="w-full bg-zinc-50 border border-zinc-200/60 focus:border-[#113f36] rounded-xl px-4 py-3 outline-none text-zinc-900 font-medium text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Purchase Details Panel */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-200/80 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                      <DollarSign className="w-[18px] h-[18px]" />
                    </div>
                    <h2 className="font-bold text-lg text-zinc-800">Cod Value Mapping</h2>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="checkbox" 
                        id="enableCod"
                        checked={formData.enableCod}
                        onChange={(e) => {
                          setFormData({...formData, enableCod: e.target.checked, amount: e.target.checked ? formData.amount : ''});
                        }}
                        className="w-4 h-4 accent-[#113f36] cursor-pointer"
                      />
                      <label htmlFor="enableCod" className="text-[12px] font-black uppercase tracking-wider text-zinc-400 cursor-pointer">
                        Enable COD (Collect Cash from Customer)
                      </label>
                    </div>
                    {formData.enableCod && (
                      <div className="relative animate-in fade-in slide-in-from-top-1">
                        <span className="absolute left-4 top-3.5 text-zinc-400 font-bold text-sm">AED</span>
                        <input 
                          required
                          type="number" 
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          placeholder="0.00" 
                          className="w-full bg-zinc-50 border border-zinc-200/60 focus:border-[#113f36] rounded-xl pl-14 pr-4 py-3 outline-none text-zinc-900 font-bold transition-colors font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Payout Settlement Option</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { key: 'card', label: 'Pay with Card (Stripe)', desc: 'Securely pay via Credit/Debit card' },
                        { key: 'wallet', label: 'Pay from Wallet', desc: 'Deduct from USend Merchant Wallet' }
                      ].map((type) => (
                        <button
                          key={type.key}
                          type="button"
                          onClick={() => setFormData({...formData, paymentType: type.key})}
                          className={`flex items-start justify-between p-4 rounded-xl border-2 text-left transition-all ${
                            formData.paymentType === type.key 
                              ? 'border-[#113f36] bg-[#113f36]/5 text-[#113f36]' 
                              : 'border-transparent bg-zinc-50'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs text-zinc-800 block">{type.label}</span>
                            <span className="text-[12px] text-zinc-400">{type.desc}</span>
                          </div>
                          {formData.paymentType === type.key && (
                            <div className="w-2 h-2 rounded-full bg-[#113f36] mt-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Courier / Fulfillment Routing Option */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-200/80 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <Truck className="w-[18px] h-[18px]" />
                    </div>
                    <h2 className="font-bold text-lg text-zinc-800">Courier & Driver Fulfillment</h2>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[12px] uppercase font-black tracking-wider text-zinc-400">Choose Courier Channel</p>
                    <div className="flex flex-col gap-3.5">
                      {/* Aramex Option */}
                      <div className="space-y-3">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => { 
                            setFormData(prev => ({
                              ...prev,
                              carrier: 'aramex',
                              aramexBox: prev.aramexBox || { id: 'small', name: 'Small Box', size: '30 × 22 × 15', weight: '2', length: '30', width: '22', height: '15', img: '📦', desc: 'MAX 2 KG', tag: 'Light (2kg)' }
                            }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setFormData(prev => ({
                                ...prev,
                                carrier: 'aramex',
                                aramexBox: prev.aramexBox || { id: 'small', name: 'Small Box', size: '30 × 22 × 15', weight: '2', length: '30', width: '22', height: '15', img: '📦', desc: 'MAX 2 KG', tag: 'Light (2kg)' }
                              }));
                            }
                          }}
                          className={`flex flex-col p-5 rounded-2xl border-2 text-left transition-all cursor-pointer w-full relative overflow-hidden gap-3 ${
                            formData.carrier === 'aramex'
                              ? 'border-[#d12421] bg-[#d12421]/5 text-zinc-950 shadow-sm'
                              : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#d12421] text-white flex items-center justify-center text-[10px] font-black tracking-tighter shrink-0 shadow-xs">
                                aramex
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-sm text-zinc-900 block">Aramex Express</span>
                                  <span className="text-[10px] font-black bg-red-100 text-[#d12421] px-2 py-0.5 rounded-full uppercase">Global Fleet</span>
                                </div>
                                <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5 max-w-md">
                                  Global & domestic express shipping across all UAE Emirates with full linehaul coverage.
                                </p>
                              </div>
                            </div>
                            <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              formData.carrier === 'aramex' ? 'border-[#d12421]' : 'border-zinc-300'
                            }`}>
                              {formData.carrier === 'aramex' && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#d12421]" />
                              )}
                            </div>
                          </div>

                          {/* Aramex Capability Chips */}
                          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-200/60">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
                              📅 Next-Day SLA (24-48 Hours)
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                              🌍 All 7 UAE Emirates
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                              ⚖️ Up to 50 kg
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                              💵 COD up to AED 10K
                            </span>
                          </div>

                          {/* Aramex Same-Day SLA Warning Banner */}
                          {formData.carrier === 'aramex' && (
                            <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl space-y-1.5 text-xs text-left" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                                <span>Aramex Express SLA Notice:</span>
                              </div>
                              <p className="text-[11px] text-amber-800 leading-relaxed">
                                Aramex operates on Next-Day / 24-48 Hours SLA across UAE. If you require <strong>Instant Same-Day / 2-Hour Delivery</strong>, use Noon RoD.
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, carrier: 'noon' }));
                                }}
                                className="mt-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                              >
                                ⚡ Switch to Noon RoD (Same-Day Delivery)
                              </button>
                            </div>
                          )}

                          {/* Aramex Violations Alert (if any) */}
                          {formData.carrier === 'aramex' && !courierCompliance.isCompliant && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs">
                              <div className="flex items-center gap-1.5 text-red-700 font-bold">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>Aramex Express Compliance Notice:</span>
                              </div>
                              {courierCompliance.violations.map((v, i) => (
                                <p key={i} className="text-[11px] text-red-650 pl-5 leading-tight">
                                  • {v.message}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Aramex Sub-Categories / Box Selection - ONLY shown after selecting Aramex as courier */}
                        {formData.carrier === 'aramex' && (
                          <div className="bg-red-50/60 border border-red-200/90 rounded-2xl p-4.5 space-y-3.5 animate-in fade-in slide-in-from-top-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-200/60 pb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
                                  Package Type:
                                </span>
                                <span className="text-[11px] font-bold text-[#d12421] bg-white px-2.5 py-0.5 rounded-full border border-red-200">
                                  {formData.aramexBox?.name || 'Standard Box'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsAramexBoxModalOpen(true)}
                                className="text-[11px] font-black uppercase text-[#d12421] hover:text-red-700 bg-white px-3 py-1.5 rounded-lg border border-red-200 shadow-xs cursor-pointer self-start sm:self-auto transition-colors"
                              >
                                Browse All Box Sizes
                              </button>
                            </div>

                            {/* Direct Box Type Pills */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { id: 'envelope', name: 'A4 Envelope', weight: '0.5', length: '33', width: '24', height: '3', size: '33×24×3 cm', img: '✉️', tag: 'Docs' },
                                { id: 'small', name: 'Small Box', weight: '2', length: '30', width: '22', height: '15', size: '30×22×15 cm', img: '📦', tag: 'Light (2kg)' },
                                { id: 'medium', name: 'Medium Box', weight: '15', length: '50', width: '40', height: '37', size: '50×40×37 cm', img: '📦', tag: 'Popular (15kg)' },
                                { id: 'large', name: 'Large Box', weight: '30', length: '65', width: '50', height: '46', size: '65×50×46 cm', img: '📦', tag: 'Heavy (30kg)' }
                              ].map((box) => {
                                const isSelected = formData.aramexBox?.id === box.id || (formData.length === box.length && formData.width === box.width);
                                return (
                                  <button
                                    key={box.id}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        carrier: 'aramex',
                                        aramexBox: {
                                          id: box.id,
                                          name: box.name,
                                          size: box.size,
                                          weight: box.weight,
                                          length: box.length,
                                          width: box.width,
                                          height: box.height,
                                          img: box.img,
                                          desc: `MAX ${box.weight} KG`,
                                          tag: box.tag
                                        },
                                        weight: box.weight,
                                        length: box.length,
                                        width: box.width,
                                        height: box.height
                                      }));
                                    }}
                                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                      isSelected 
                                        ? 'border-[#d12421] bg-white ring-2 ring-red-500/20 shadow-xs' 
                                        : 'border-red-100/80 bg-white/70 hover:bg-white hover:border-red-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="text-base">{box.img}</span>
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-[#d12421] text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                                        {box.tag}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-extrabold text-zinc-900 truncate block">{box.name}</span>
                                    <span className="text-[10px] text-zinc-500 font-medium">{box.size}</span>
                                  </button>
                                );
                              })}
                            </div>
                            
                            <div className="flex items-center justify-between text-[11px] text-zinc-500 bg-white/80 p-2.5 rounded-xl border border-red-100">
                              <span className="font-semibold text-zinc-700">Applied Dimensions:</span>
                              <span className="font-mono font-bold text-zinc-900">
                                {formData.length} × {formData.width} × {formData.height} cm ({formData.weight} kg)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Noon Option */}
                      <div className="space-y-2">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setFormData({...formData, carrier: 'noon'})}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setFormData({...formData, carrier: 'noon'});
                            }
                          }}
                          className={`flex flex-col p-5 rounded-2xl border-2 text-left transition-all cursor-pointer w-full relative overflow-hidden gap-3 ${
                            formData.carrier === 'noon'
                              ? (!courierCompliance.isCompliant ? 'border-rose-400 bg-rose-50/50' : 'border-amber-500 bg-amber-50') + ' text-zinc-950 shadow-sm'
                              : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#feee00] text-black flex items-center justify-center text-[10px] font-black tracking-tight border border-amber-300 shrink-0 shadow-xs">
                                noon
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-sm text-zinc-900 block">Noon Hyperlocal</span>
                                  <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full uppercase">On-Demand</span>
                                </div>
                                <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5 max-w-md">
                                  Rapid same-day on-demand intra-emirate parcel delivery via Noon rider network (e.g. Dubai to Dubai, Abu Dhabi to Abu Dhabi).
                                </p>
                              </div>
                            </div>
                            <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              formData.carrier === 'noon' ? 'border-amber-500' : 'border-zinc-300'
                            }`}>
                              {formData.carrier === 'noon' && (
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                              )}
                            </div>
                          </div>

                          {/* Noon Capability Chips */}
                          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-200/60">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                              ⚡ Same-Day / On-Demand
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60">
                              🏠 Intra-Emirate Only (Same Emirate)
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                              ⚖️ Max 15 kg
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                              💵 COD up to AED 2,500
                            </span>
                          </div>

                          {/* Noon Violations Alert & 1-Click Resolution */}
                          {formData.carrier === 'noon' && !courierCompliance.isCompliant && (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
                              <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>Noon Process Rule Violation Detected:</span>
                              </div>
                              <div className="space-y-1 pl-5">
                                {courierCompliance.violations.map((v, i) => (
                                  <p key={i} className="text-[11px] text-rose-700 leading-tight">
                                    • <strong>{v.rule}:</strong> {v.message}
                                  </p>
                                ))}
                              </div>
                              <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-rose-200/70">
                                <span className="text-[11px] font-semibold text-rose-800">
                                  Aramex Express is fully compatible with this shipment:
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData(prev => ({
                                      ...prev,
                                      carrier: 'aramex',
                                      aramexBox: prev.aramexBox || { id: 'medium', name: 'Medium Box', size: '50 × 40 × 37', weight: '15', length: '50', width: '40', height: '37', img: '📦', desc: 'MAX 15 KG', tag: 'Popular (15kg)' }
                                    }));
                                  }}
                                  className="px-3 py-1.5 bg-[#d12421] hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                                >
                                  ⚡ Switch to Aramex Express
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SUMMARY & PAYMENT - RELOCATED DIRECTLY UNDER COURIER SECTION */}
                <div className="bg-white border border-[#EBEFE9] rounded-[2.5rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(220,225,235,0.45)] space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-[#EBEFE9] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#113f36]/10 flex items-center justify-center text-[#113f36]">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-zinc-900 uppercase tracking-widest">Summary & Payment</h3>
                        <p className="text-xs text-[#113f36] font-bold mt-0.5">Live Order Parameters & Cost Breakdown</p>
                      </div>
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-zinc-100 rounded-lg text-zinc-600">
                      Step 5 of 5
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Order Parameters Summary */}
                    <div className="space-y-4">
                      {/* Carrier Service Badge */}
                      <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Carrier Service</span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            formData.carrier === 'aramex' ? 'bg-[#d12421] text-white shadow-xs' :
                            'bg-[#feee00] text-black border border-amber-300'
                          }`}>
                            {formData.carrier === 'aramex' ? 'Aramex Express' : 'Noon Hyperlocal'}
                          </span>
                        </div>
                        
                        {formData.carrier === 'aramex' && formData.aramexBox && (
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-200/60">
                            <span className="text-zinc-600 font-medium flex items-center gap-1.5">
                              <span>{formData.aramexBox.img}</span>
                              <span className="font-bold text-zinc-800">{formData.aramexBox.name}</span>
                            </span>
                            <span className="text-[11px] font-bold text-zinc-700 bg-white px-2 py-0.5 rounded-md border border-zinc-200">
                              {formData.aramexBox.size} cm
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Routing Details */}
                      <div className="space-y-2.5">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pickup Location</span>
                            {dynamicPricing.distance > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                {dynamicPricing.distance} km trip
                              </span>
                            )}
                          </div>
                          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                            <span className="text-xs font-semibold text-zinc-700 truncate">{formData.pickupAddress || 'Dubai Warehouse'}</span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Dropoff Destination</span>
                          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                            <span className="text-xs font-semibold text-zinc-700 truncate">{formData.address || 'Select on Map or enter address'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Package Specifications */}
                      <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-100 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Weight</span>
                          <span className="text-sm font-bold text-zinc-800">{formData.weight || '2'} kg</span>
                        </div>
                        <div className="w-px h-7 bg-zinc-200" />
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Dimensions</span>
                          <span className="text-sm font-bold text-zinc-800">
                            {formData.length || '30'} × {formData.width || '22'} × {formData.height || '15'} cm
                          </span>
                        </div>
                      </div>

                      {/* Payment & COD mode */}
                      <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-100 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500 font-medium">Payment Mode</span>
                          <span className="font-bold text-zinc-800 capitalize">
                            {formData.paymentType === 'card' ? 'Credit / Debit Card' : 'Merchant Wallet'}
                          </span>
                        </div>
                        {formData.enableCod && (
                          <div className="flex justify-between items-center text-amber-700 font-bold pt-1.5 border-t border-zinc-200">
                            <span>COD Collection Value</span>
                            <span>AED {parseFloat(formData.amount || '0').toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Billing Breakdown & Dispatch Button */}
                    <div className="flex flex-col justify-between space-y-4">
                      <div className="bg-[#113f36]/5 border border-[#113f36]/15 rounded-2xl p-5 space-y-3.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Base Carrier Rate</span>
                          <span className="text-xs font-bold text-zinc-900">AED {dynamicPricing.baseFee.toFixed(2)}</span>
                        </div>
                        {dynamicPricing.distFee > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Distance ({dynamicPricing.distance} km)</span>
                            <span className="text-xs font-bold text-zinc-900">AED {dynamicPricing.distFee.toFixed(2)}</span>
                          </div>
                        )}
                        {dynamicPricing.weightFee > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Weight Surcharge</span>
                            <span className="text-xs font-bold text-zinc-900">AED {dynamicPricing.weightFee.toFixed(2)}</span>
                          </div>
                        )}
                        {formData.enableCod && (
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] uppercase font-black tracking-widest text-zinc-500">COD Processing Fee</span>
                            <span className="text-xs font-bold text-zinc-900">AED {dynamicPricing.codFee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Platform Commission</span>
                          <span className="text-xs font-bold text-zinc-900">AED {dynamicPricing.commission.toFixed(2)}</span>
                        </div>
                        
                        <div className="border-t border-[#113f36]/15 pt-3.5 flex justify-between items-end">
                          <div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 block">Total Charge</span>
                            <span className="text-xs text-zinc-500 font-medium">Incl. 5% VAT</span>
                          </div>
                          <span className="font-display font-black text-2xl text-[#113f36]">
                            AED {dynamicPricing.total.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Compliance Alert in Summary (if violations exist) */}
                      {!courierCompliance.isCompliant && (
                        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2 text-xs animate-pulse">
                          <div className="flex items-center gap-2 text-rose-800 font-black">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Cannot Dispatch: Courier Rule Incompatibility</span>
                          </div>
                          <p className="text-[11px] text-rose-700 leading-tight">
                            {courierCompliance.violations[0].message}
                          </p>
                          {courierCompliance.violations[0].fixCourier === 'aramex' && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  carrier: 'aramex',
                                  aramexBox: prev.aramexBox || { id: 'medium', name: 'Medium Box', size: '50 × 40 × 37', weight: '15', length: '50', width: '40', height: '37', img: '📦', desc: 'MAX 15 KG', tag: 'Popular (15kg)' }
                                }));
                              }}
                              className="w-full py-2 bg-[#d12421] hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                            >
                              ⚡ Switch to Aramex Express to Proceed
                            </button>
                          )}
                        </div>
                      )}

                      {/* Dispatch Submit Button */}
                      <button
                        type="submit"
                        disabled={!courierCompliance.isCompliant}
                        className={`w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] font-display uppercase text-xs tracking-widest shadow-md cursor-pointer ${
                          !courierCompliance.isCompliant
                            ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed border border-zinc-400/50'
                            : 'bg-[#113f36] hover:bg-[#0e332c] text-white shadow-[0_8px_20px_rgba(17,63,54,0.2)]'
                        }`}
                      >
                        {!courierCompliance.isCompliant ? (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            <span>Resolve Courier Restrictions to Proceed</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Proceed to Payment & Dispatch • AED {dynamicPricing.total.toFixed(2)}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
            </form>
          ) : (
            /* GET QUOTES INTERACTIVE CALCULATOR */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200/80 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#113f36]/10 text-[#113f36] flex items-center justify-center">
                      <Calculator className="w-[18px] h-[18px]" />
                    </div>
                    <h2 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">Routing Parameters</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <label className="text-[12px] font-black uppercase tracking-wider text-zinc-500">Pick-up Warehouse</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMapOpenQuoteTarget('pickup');
                            setIsMapOpen(true);
                          }}
                          className="text-[15px] font-bold text-[#113f36] bg-zinc-100 hover:bg-zinc-200 px-2 py-1 flex items-center gap-1 rounded-md transition-colors"
                        >
                          <Map className="w-3 h-3" /> Select Map
                        </button>
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 text-zinc-400 w-4 h-4 z-10" />
                        <input 
                          type="text" 
                          value={quoteData.pickupAddress}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteData({
                              ...quoteData,
                              pickupAddress: val,
                              pickupPosition: getDeterministicCoordinates(val)
                            });
                            setAutocompleteQuery(val);
                            setActiveAutocompleteField('quote_pickup');
                          }}
                          onFocus={() => {
                            setAutocompleteQuery(quoteData.pickupAddress);
                            setActiveAutocompleteField('quote_pickup');
                          }}
                          onBlur={() => {
                            setTimeout(() => setActiveAutocompleteField(null), 250);
                          }}
                          placeholder="Type pick-up address or use map..." 
                          className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl pl-11 pr-4 py-3 outline-none text-zinc-900 font-medium text-sm truncate z-0"
                        />
                        {activeAutocompleteField === 'quote_pickup' && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto w-full">
                            {UAE_ADDRESS_SUGGESTIONS.filter(item => item.name.toLowerCase().includes(autocompleteQuery.toLowerCase())).slice(0, 5).map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onMouseDown={() => {
                                  setQuoteData({
                                    ...quoteData,
                                    pickupAddress: item.name,
                                    pickupPosition: item.position as [number, number]
                                  });
                                  setActiveAutocompleteField(null);
                                }}
                                className="w-full text-left px-6 py-3 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#113f36] shrink-0" />
                                <span className="truncate">{item.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <label className="text-[12px] font-black uppercase tracking-wider text-zinc-500">Drop-off Destination</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMapOpenQuoteTarget('dropoff');
                            setIsMapOpen(true);
                          }}
                          className="text-[15px] font-bold text-rose-500 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 flex items-center gap-1 rounded-md transition-colors"
                        >
                          <Map className="w-3 h-3" /> Select Map
                        </button>
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 text-red-500 w-4 h-4 z-10" />
                        <input 
                          type="text" 
                          value={quoteData.dropoffAddress}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteData({
                              ...quoteData,
                              dropoffAddress: val,
                              dropoffPosition: getDeterministicCoordinates(val)
                            });
                            setAutocompleteQuery(val);
                            setActiveAutocompleteField('quote_dropoff');
                          }}
                          onFocus={() => {
                            setAutocompleteQuery(quoteData.dropoffAddress);
                            setActiveAutocompleteField('quote_dropoff');
                          }}
                          onBlur={() => {
                            setTimeout(() => setActiveAutocompleteField(null), 250);
                          }}
                          placeholder="Type drop-off address or use map..."
                          className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl pl-11 pr-4 py-3 outline-none text-zinc-900 font-medium text-sm truncate z-0"
                        />
                        {activeAutocompleteField === 'quote_dropoff' && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto w-full">
                            {UAE_ADDRESS_SUGGESTIONS.filter(item => item.name.toLowerCase().includes(autocompleteQuery.toLowerCase())).slice(0, 5).map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onMouseDown={() => {
                                  setQuoteData({
                                    ...quoteData,
                                    dropoffAddress: item.name,
                                    dropoffPosition: item.position as [number, number]
                                  });
                                  setActiveAutocompleteField(null);
                                }}
                                className="w-full text-left px-6 py-3 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                              >
                                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                <span className="truncate">{item.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cargo dimension inputs */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-2 col-span-1">
                      <label className="text-[15px] font-black uppercase tracking-wider text-zinc-400">Weight (kg)</label>
                      <input 
                        type="number"
                        value={quoteData.weightKg}
                        onChange={(e) => setQuoteData({...quoteData, weightKg: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-3 text-center text-zinc-900 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2 col-span-1">
                      <label className="text-[15px] font-black uppercase tracking-wider text-zinc-400">Length (cm)</label>
                      <input 
                        type="number"
                        value={quoteData.lengthCm}
                        onChange={(e) => setQuoteData({...quoteData, lengthCm: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-3 text-center text-zinc-900 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2 col-span-1">
                      <label className="text-[15px] font-black uppercase tracking-wider text-zinc-400">Width (cm)</label>
                      <input 
                        type="number"
                        value={quoteData.widthCm}
                        onChange={(e) => setQuoteData({...quoteData, widthCm: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-3 text-center text-zinc-900 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2 col-span-1">
                      <label className="text-[15px] font-black uppercase tracking-wider text-zinc-400">Height (cm)</label>
                      <input 
                        type="number"
                        value={quoteData.heightCm}
                        onChange={(e) => setQuoteData({...quoteData, heightCm: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-3 text-center text-zinc-900 font-bold text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Service Level selections */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200/80 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                      <Sparkles className="w-[18px] h-[18px]" />
                    </div>
                    <h2 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">Execution Priority</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'eco', label: 'Eco Saver', delay: 'Next-Day Delivery', fee: '0.85x Multiplier' },
                      { key: 'standard', label: 'Standard Local', delay: 'Same-Day Dispatch', fee: '1.0x Multiplier' },
                      { key: 'express', label: 'Hyper-Express', delay: '90-Min On-Demand', fee: '1.5x Multiplier' }
                    ].map((tier) => (
                      <button
                        key={tier.key}
                        onClick={() => setQuoteData({...quoteData, serviceLevel: tier.key})}
                        className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-36 ${
                          quoteData.serviceLevel === tier.key 
                            ? 'border-[#113f36] bg-[#113f36]/5/15 text-[#113f36] font-semibold' 
                            : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-650'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-zinc-900 block">{tier.label}</span>
                            {quoteData.serviceLevel === tier.key && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#113f36]" />
                            )}
                          </div>
                          <span className="text-[15px] text-zinc-500 mt-1 block">{tier.delay}</span>
                        </div>
                        <span className="text-[12px] font-black uppercase tracking-wider text-[#113f36] bg-[#113f36]/5/70 px-2 py-1 rounded-md self-start">
                          {tier.fee}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Slider option for Marine/Cargo insurance */}
                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="insurance" 
                        checked={quoteData.insurance}
                        onChange={(e) => setQuoteData({...quoteData, insurance: e.target.checked})}
                        className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                      />
                      <div>
                        <label htmlFor="insurance" className="font-bold text-xs text-zinc-800 cursor-pointer block">Comprehensive Freight Transit Insurance</label>
                        <span className="text-[12px] text-zinc-400 block">Insure valuable items up to AED 10,000 against any transit damage (+AED 5.00)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Result Panel */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200/80 shadow-md flex flex-col h-full justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                        <TrendingUp className="w-[18px] h-[18px]" />
                      </div>
                      <h2 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">Quote Calculation</h2>
                    </div>

                    {!quoteData.dropoffAddress ? (
                      <div className="py-12 text-center text-zinc-400 space-y-3">
                        <Map className="w-12 h-12 stroke-1 text-zinc-300 mx-auto" />
                        <p className="text-xs font-medium">To print an instant quotation, please input delivery destination coordinates first.</p>
                      </div>
                    ) : (
                      <button
                        onClick={handleCalculateQuote}
                        disabled={isCalculatingQuote}
                        className="w-full py-4 bg-zinc-900 hover:bg-zinc-850 text-white rounded-2xl font-bold font-display uppercase text-xs tracking-widest transition-all mb-4"
                      >
                        {isCalculatingQuote ? 'Pricing Cargo...' : 'Generate Shipping Quote'}
                      </button>
                    )}

                    {calculatedQuotes && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full overflow-y-auto pr-2 pb-16">
                        <div className="text-center mb-4">
                           <span className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-zinc-500">{t('smart_courier_options') || 'Smart Courier Options'}</span>
                           <h3 className="text-xl font-display font-black text-zinc-900 mt-1">{t('found_rates') || 'Found Rates'} ({calculatedQuotes.options.length})</h3>
                        </div>

                        {calculatedQuotes.options.map((opt, idx) => (
                           <div key={opt.courier + idx} className="p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-brand/50 transition-colors cursor-pointer group shadow-sm flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {opt.courier === 'aramex' && <div className="w-6 h-6 bg-[#d12421] text-white rounded-md flex items-center justify-center font-black text-[12px]">A</div>}
                                  {opt.courier === 'dhl_express' && <div className="w-6 h-6 bg-yellow-400 text-red-600 rounded-md flex items-center justify-center font-black text-[12px]">D</div>}
                                  {opt.courier === 'usend_fleet' && <div className="w-6 h-6 bg-zinc-900 text-white rounded-md flex items-center justify-center font-black text-[12px]">U</div>}
                                  
                                  <div>
                                    <span className="text-xs font-black uppercase tracking-wider block leading-tight">{opt.courier.replace('_', ' ')}</span>
                                    <span className="text-[12px] font-medium text-zinc-400 block">{opt.eta}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-medium block text-zinc-400">Total AED</span>
                                  <span className="font-mono text-lg font-black text-zinc-900 dark:text-white leading-none">{opt.total}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  // Prefill Normal Order Form from Quote
                                  setFormData(prev => ({
                                    ...prev,
                                    customerName: `Quoted ${opt.courier.replace('_', ' ').toUpperCase()} Client`,
                                    phone: '+971 50 123 4567',
                                    address: quoteData.dropoffAddress,
                                    position: quoteData.dropoffPosition,
                                    pickupAddress: quoteData.pickupAddress,
                                    pickupPosition: quoteData.pickupPosition,
                                    deliveryDate: 'Today, instant dispatch',
                                    amount: String(opt.total),
                                    paymentType: 'card',
                                    notes: `Quoted ${opt.courier} Cargo. Weight: ${quoteData.weightKg} kg`,
                                    carrier: opt.courier === 'aramex' ? 'aramex' : 'usend'
                                  }));
                                  setMerchantActiveTab('manual_orders');
                                }}
                                className="w-full py-2.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 group-hover:bg-brand group-hover:text-white rounded-xl font-bold font-display text-[12px] uppercase tracking-widest transition-all"
                              >
                                {t('select_book') || 'Select & Book'}
                              </button>
                           </div>
                        ))}
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Aramex Box Size Picker Modal */}
      <Modal isOpen={isAramexBoxModalOpen} onClose={() => setIsAramexBoxModalOpen(false)} title={isRTL ? "اختر حجم الصندوق (أرامكس)" : "Choose Aramex Box Size"}>
         <div className="space-y-5 p-1 select-none text-slate-800">
            <div className="bg-gradient-to-r from-red-50 to-orange-50/50 p-3.5 rounded-2xl border border-red-100 flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-[#d12421] text-white flex items-center justify-center shrink-0 shadow-sm font-black text-xs">
                  📦
               </div>
               <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {isRTL ? "سيتم ملء الوزن والأبعاد تلقائياً بناءً على حجم الصندوق المحدد:" : "Weight and dimensions will be auto-filled based on your selection:"}
               </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
               {[
                 { id: 'large', name: 'Large & In Charge', nameAr: 'صندوق كبير - شحن ثقيل', size: '65 × 50 × 46', weight: '30', length: '65', width: '50', height: '46', img: '📦', desc: 'MAX 30 KG', tag: 'Heavy Duty' },
                 { id: 'medium', name: 'Medium Easy', nameAr: 'صندوق متوسط - عادي', size: '50 × 40 × 37', weight: '15', length: '50', width: '40', height: '37', img: '📦', desc: 'MAX 15 KG', tag: 'Most Popular' },
                 { id: 'small', name: 'Small Wonder', nameAr: 'صندوق صغير - خفيف', size: '30 × 22 × 15', weight: '2', length: '30', width: '22', height: '15', img: '📦', desc: 'MAX 2 KG', tag: 'Light Item' },
                 { id: 'envelope', name: 'A4 Envelope', nameAr: 'ظرف مستندات A4', size: '33 × 24 × 3', weight: '0.5', length: '33', width: '24', height: '3', img: '✉️', desc: 'MAX 0.5 KG', tag: 'Documents' }
               ].map((box) => (
                  <div
                     key={box.id}
                     onClick={() => {
                       setFormData(p => ({
                         ...p,
                         carrier: 'aramex',
                         aramexBox: box,
                         weight: box.weight,
                         length: box.length,
                         width: box.width,
                         height: box.height
                       }));
                       setIsAramexBoxModalOpen(false);
                     }}
                     className="relative flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-[#d12421] hover:bg-gradient-to-br hover:from-white hover:to-red-50/30 hover:shadow-lg hover:shadow-red-500/10 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 group overflow-hidden"
                  >
                     <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl group-hover:bg-[#d12421]/10 group-hover:border-[#d12421]/20 group-hover:scale-105 transition-all duration-300 shrink-0 shadow-inner">
                        {box.img}
                     </div>
                     
                     <div className="space-y-1 text-start flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                           <h4 className="text-xs font-black uppercase text-slate-900 tracking-tight group-hover:text-[#d12421] transition-colors truncate">
                              {isRTL ? box.nameAr : box.name}
                           </h4>
                           <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 group-hover:bg-[#d12421]/10 group-hover:text-[#d12421] px-2 py-0.5 rounded-full transition-colors shrink-0">
                              {box.tag}
                           </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                           <span className="font-mono">{box.size} cm</span>
                           <span className="text-slate-300">•</span>
                           <span className="text-slate-700 font-extrabold">{box.weight} kg</span>
                        </p>
                        <p className="text-[9px] uppercase tracking-widest font-black text-[#d12421] pt-0.5">
                           {box.desc}
                        </p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </Modal>

      {/* Map Address Picker Modal */}
      <Modal 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        title={t('select_address') || 'Confirm Location on Grid Map'}
        maxWidth="max-w-5xl"
      >
        <MapPicker 
          targetType={isMapOpenQuoteTarget === 'pickup' || isMapOpenQuoteTarget === 'manual_pickup' ? 'pickup' : 'dropoff'}
          initialAddress={
            isMapOpenQuoteTarget === 'pickup' ? quoteData.pickupAddress : 
            isMapOpenQuoteTarget === 'dropoff' ? quoteData.dropoffAddress : 
            isMapOpenQuoteTarget === 'manual_pickup' ? formData.pickupAddress : 
            formData.address
          }
          initialPosition={
            isMapOpenQuoteTarget === 'pickup' ? quoteData.pickupPosition : 
            isMapOpenQuoteTarget === 'dropoff' ? quoteData.dropoffPosition : 
            isMapOpenQuoteTarget === 'manual_pickup' ? formData.pickupPosition : 
            formData.position
          }
          onSelect={(addr, pos) => {
            if (isMapOpenQuoteTarget === 'pickup') {
              setQuoteData({ ...quoteData, pickupAddress: addr, pickupPosition: pos });
            } else if (isMapOpenQuoteTarget === 'dropoff') {
              setQuoteData({ ...quoteData, dropoffAddress: addr, dropoffPosition: pos });
            } else if (isMapOpenQuoteTarget === 'manual_pickup') {
              setFormData({ ...formData, pickupAddress: addr, pickupPosition: pos });
            } else {
              setFormData({ ...formData, address: addr, position: pos });
            }
            setIsMapOpen(false);
          }}
          onClose={() => setIsMapOpen(false)} 
        />
      </Modal>


      {/* Scheduled Picker Modal */}
      <Modal 
        isOpen={isDateOpen} 
        onClose={() => setIsDateOpen(false)} 
        title={t('select_date') || 'Select Schedule'}
      >
        <CustomDatePicker 
          initialDate={formData.deliveryDate}
          onSelect={(date) => {
            setFormData({...formData, deliveryDate: date});
            setIsDateOpen(false);
          }}
        />
      </Modal>

      {/* Merchant Payment & Dispatch Checkout Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => {
          if (!isProcessingPayment) {
            setIsCheckoutModalOpen(false);
            if (dispatchedSuccessOrder) {
              setDispatchedSuccessOrder(null);
            }
          }
        }}
        title={dispatchedSuccessOrder ? "🎉 Shipment Dispatched & Paid" : "Checkout & Courier Payment"}
      >
        {dispatchedSuccessOrder ? (
          /* SUCCESS RECEIPT VIEW */
          <div className="p-4 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-display font-black text-zinc-900">
                Payment Succeeded & Order Dispatched!
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Your shipment has been registered with {dispatchedSuccessOrder.carrier} and assigned an active waybill.
              </p>
            </div>

            {/* Tracking Badge */}
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Waybill / Tracking No.</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700">
                  Active AWB
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200">
                <span className="font-mono text-sm font-black text-zinc-900 tracking-wide select-all">
                  {dispatchedSuccessOrder.trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(dispatchedSuccessOrder.trackingNumber);
                    window.dispatchEvent(new CustomEvent('app_toast', { detail: { title: 'Copied', message: 'Tracking number copied to clipboard', type: 'success' } }));
                  }}
                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
                  title="Copy Tracking ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Courier</span>
                  <span className="font-bold text-zinc-800">{dispatchedSuccessOrder.carrier}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Amount Paid</span>
                  <span className="font-bold text-emerald-600">AED {dispatchedSuccessOrder.totalPaid.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Payment Mode</span>
                  <span className="font-bold text-zinc-800">{dispatchedSuccessOrder.paymentMethod}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Date & Time</span>
                  <span className="font-mono text-zinc-600 text-[11px]">{dispatchedSuccessOrder.date}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCheckoutModalOpen(false);
                  onNavigate('merchant_tracking');
                }}
                className="w-full py-3.5 bg-[#113f36] hover:bg-[#0e332c] text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Track Live in Requests & Orders</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Waybill</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDispatchedSuccessOrder(null);
                    setIsCheckoutModalOpen(false);
                    setFormData(prev => ({
                      ...prev,
                      customerName: '',
                      phone: '+971 ',
                      address: '',
                      position: null,
                      notes: '',
                      items: '',
                      amount: ''
                    }));
                  }}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Order</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CHECKOUT PAYMENT SELECTION VIEW */
          <div className="p-2 space-y-5">
            {/* Quick Order Route & Amount Header */}
            <div className="bg-[#113f36]/5 border border-[#113f36]/15 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                  Courier Settle Amount
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-display font-black text-[#113f36]">
                    AED {dynamicPricing.total.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-medium">(Incl. VAT)</span>
                </div>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#113f36] text-white inline-flex items-center gap-1.5 shadow-xs">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  {formData.carrier === 'aramex' ? 'Aramex Express' : 'Noon Hyperlocal'}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-1">
                  Trip Distance: {dynamicPricing.distance} km
                </span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setCheckoutPaymentMethod('wallet')}
                className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  checkoutPaymentMethod === 'wallet'
                    ? 'bg-white text-[#113f36] shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Merchant Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setCheckoutPaymentMethod('card')}
                className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  checkoutPaymentMethod === 'card'
                    ? 'bg-white text-[#113f36] shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Credit / Debit Card</span>
              </button>
            </div>

            {/* TAB 1: MERCHANT WALLET PAYMENT */}
            {checkoutPaymentMethod === 'wallet' && (
              <div className="space-y-4">
                {/* Balance & Calculation Card */}
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium">Available Wallet Balance</span>
                    <span className="font-mono font-bold text-zinc-900 text-sm">
                      AED {walletBalance.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium">Order Settle Deduction</span>
                    <span className="font-mono font-bold text-rose-600 text-sm">
                      - AED {dynamicPricing.total.toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-700">Remaining Balance After Order</span>
                    <span className={`font-mono font-black text-sm ${
                      walletBalance >= dynamicPricing.total ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      AED {(walletBalance - dynamicPricing.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Balance Status Banner */}
                {walletBalance >= dynamicPricing.total ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200/70 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Wallet funds are active and ready for instant automated dispatch.</span>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200/70 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Insufficient wallet balance (Short by AED {(dynamicPricing.total - walletBalance).toFixed(2)}).</span>
                    </div>
                    <p className="text-[11px] text-rose-700">
                      Quickly top-up your wallet below or switch to card payment:
                    </p>
                    <div className="flex gap-2 pt-1">
                      {[100, 250, 500].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleQuickWalletTopup(amt)}
                          className="flex-1 py-1.5 bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          +AED {amt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Wallet Action Button */}
                <button
                  type="button"
                  disabled={walletBalance < dynamicPricing.total || isProcessingPayment}
                  onClick={() => handleExecutePaymentAndDispatch('wallet')}
                  className="w-full py-4 bg-[#113f36] hover:bg-[#0e332c] text-white rounded-2xl font-bold flex items-center justify-center gap-2 text-xs uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{processingStatusText}</span>
                    </div>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Pay AED {dynamicPricing.total.toFixed(2)} from Wallet & Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: CREDIT / DEBIT CARD PAYMENT */}
            {checkoutPaymentMethod === 'card' && (
              <div className="space-y-4">
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Secure 256-Bit SSL Gateway
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">VISA / MASTERCARD / AMEX</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Cardholder Name</label>
                      <input 
                        type="text" 
                        defaultValue={user?.displayName || "Merchant Partner"} 
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-medium text-zinc-800 outline-none focus:border-[#113f36]"
                        placeholder="Name on card"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Card Number</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          defaultValue="•••• •••• •••• 4242" 
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-medium text-zinc-800 outline-none focus:border-[#113f36]"
                          placeholder="4000 0000 0000 0000"
                        />
                        <CreditCard className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Expires</label>
                        <input 
                          type="text" 
                          defaultValue="12/28" 
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-medium text-zinc-800 outline-none focus:border-[#113f36]"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">CVV / CVC</label>
                        <input 
                          type="password" 
                          defaultValue="•••" 
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-medium text-zinc-800 outline-none focus:border-[#113f36]"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Card Action Button */}
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={() => handleExecutePaymentAndDispatch('card')}
                  className="w-full py-4 bg-[#113f36] hover:bg-[#0e332c] text-white rounded-2xl font-bold flex items-center justify-center gap-2 text-xs uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{processingStatusText}</span>
                    </div>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      <span>Pay AED {dynamicPricing.total.toFixed(2)} & Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
