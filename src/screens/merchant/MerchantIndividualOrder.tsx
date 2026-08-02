import { useState, FormEvent, useRef, ChangeEvent } from 'react';
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
  Truck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { aramexService } from '../../services/aramexIntegration';

export const UAE_ADDRESS_SUGGESTIONS = [
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

export function getDeterministicCoordinates(addressText: string): [number, number] {
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
  const { addRequest, merchantActiveTab, setMerchantActiveTab } = useApp();
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
  }>({
    customerName: '',
    phone: '+971 ',
    address: '',
    position: null,
    pickupAddress: 'Dubai Warehouse - Jebel Ali Port',
    pickupPosition: [24.89, 55.08] as [number, number],
    deliveryDate: new Date().toISOString().split('T')[0] + ' 12:00',
    amount: '',
    paymentType: 'card',
    notes: '',
    items: '',
    weight: 'light',
    carrier: 'aramex',
    printFormat: 'PDF'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleNormalSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validatePhone(formData.phone)) {
      alert("Please enter a valid UAE phone number starting with +971 followed by 9 digits.");
      return;
    }

    if (!formData.pickupAddress || !formData.pickupPosition || !formData.address || !formData.position) {
      alert(t('error_missing_location') || "Error: Please specify both a valid Pickup Location and a Dropoff Location to calculate distance and dispatch.");
      return;
    }

    setIsSubmitting(true);

    const submitOrder = async () => {
      const reqId = `REQ-${Math.floor(1000 + Math.random() * 9000).toString()}`;
      const payload = {
        id: reqId,
        name: formData.customerName,
        phone: formData.phone,
        channel: 'Merchant Portal',
        date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Pending' as const,
        position: formData.position,
        address: formData.address,
        itemType: formData.items || 'General Goods',
        description: formData.notes,
        amountType: 'packages' as const,
        paymentMethod: formData.paymentType === 'card' ? 'Credit Card' : 'Cash on Delivery',
        orderAmount: `${formData.amount || '150'} AED`,
        applicantType: 'Merchant' as const,
        fromDestination: formData.pickupAddress,
        toDestination: formData.address,
        etaTime: '2 Hours',
        carrier: formData.carrier,
        printFormat: formData.printFormat
      };
      
      await addRequest(payload);

      if (formData.carrier === 'aramex') {
        try {
          const aramexRes = await aramexService.createDeliveryJob(payload);
          if (aramexRes.success === false) {
             throw new Error(aramexRes.error || "Aramex API failed to create shipment.");
          }
        } catch (err: any) {
          console.error("Aramex Sandbox Dispatch failed", err);
          setIsSubmitting(false);
          window.dispatchEvent(new CustomEvent('app_toast', { detail: { title: 'Aramex Integration Error', message: err.message, type: 'error' } }));
          return;
        }
      }

      setIsSubmitting(false);
      onNavigate('merchant_tracking');
    };
    
    submitOrder();
  };

  const isGetQuoteMode = merchantActiveTab === 'get_quotes';

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_individual" onNavigate={onNavigate} />
      
      <main className="flex-1 p-6 lg:p-10 h-full overflow-y-auto relative">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0"></div>

        <motion.div
          key={isGetQuoteMode ? "quote_mode" : "order_mode"}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-8 relative z-10"
        >
          {/* Header Segment */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/60 pb-6">
            <div>
              <span className="text-emerald-600 font-bold text-[12px] uppercase tracking-[0.4em]">
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
            <form onSubmit={handleNormalSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Information Cards */}
                <div className="bg-white dark:bg-zinc-950 border border-[#E9EFF6] dark:border-zinc-800/60 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(220,225,235,0.45)] dark:shadow-none space-y-7">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#10b981] flex items-center justify-center">
                      <User className="w-[18px] h-[18px]" />
                    </div>
                    <h2 className="font-bold text-lg text-slate-800 dark:text-zinc-250">Customer Details</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">FullName</label>
                      <div className="relative flex items-center">
                        <User className="absolute left-4 text-slate-400 dark:text-zinc-500 w-4.5 h-4.5 z-10" />
                        <input 
                          required
                          type="text" 
                          value={formData.customerName}
                          onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                          placeholder="John Doe" 
                          className="w-full bg-slate-50/50 dark:bg-zinc-800/50 border border-[#E2E8F0] dark:border-zinc-800/80 focus:border-[#10b981] focus:bg-white dark:focus:bg-zinc-900 rounded-2xl pl-12 pr-4 py-3.5 outline-none text-slate-900 dark:text-zinc-100 transition-all font-medium text-sm focus:ring-4 focus:ring-[#10b981]/10 shadow-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Recipient Phone</label>
                      <div className="relative flex items-center">
                        <Phone className="absolute left-4 text-slate-400 dark:text-zinc-500 w-4.5 h-4.5 z-10" />
                        <input 
                          required
                          type="tel" 
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          placeholder="+971 50 XXXXXXX" 
                          className="w-full bg-slate-50/50 dark:bg-zinc-800/50 border border-[#E2E8F0] dark:border-zinc-800/80 focus:border-[#10b981] focus:bg-white dark:focus:bg-zinc-900 rounded-2xl pl-12 pr-4 py-3.5 outline-none text-slate-900 dark:text-zinc-100 transition-all font-mono tracking-widest text-sm focus:ring-4 focus:ring-[#10b981]/10 shadow-xs"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 relative">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Pickup Location / Warehouse</label>
                      <div className="relative flex items-center">
                        <MapPin className="absolute left-4 text-[#10b981] w-4.5 h-4.5 z-10" />
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
                            setAutocompleteQuery(val);
                            setActiveAutocompleteField('manual_pickup');
                          }}
                          onFocus={() => {
                            setAutocompleteQuery(formData.pickupAddress);
                            setActiveAutocompleteField('manual_pickup');
                          }}
                          onBlur={() => {
                            setTimeout(() => setActiveAutocompleteField(null), 250);
                          }}
                          placeholder="Type pickup address or use map..." 
                          className="w-full bg-slate-50/50 dark:bg-zinc-800/50 border border-[#E2E8F0] dark:border-zinc-800/80 focus:border-[#10b981] focus:bg-white dark:focus:bg-zinc-900 rounded-2xl pl-12 pr-28 py-3.5 outline-none text-slate-900 dark:text-zinc-100 font-medium text-sm truncate z-0 focus:ring-4 focus:ring-[#10b981]/10 shadow-xs"
                        />
                        <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setIsMapOpenQuoteTarget('manual_pickup');
                              setIsMapOpen(true);
                            }}
                            className="h-[38px] px-3.5 rounded-xl bg-[#10b981]/5 hover:bg-[#10b981]/10 active:scale-95 text-[#10b981] border border-[#10b981]/15 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Map className="w-3.5 h-3.5" /> Map
                          </button>
                        </div>
                      </div>
                      
                      {activeAutocompleteField === 'manual_pickup' && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto">
                          {UAE_ADDRESS_SUGGESTIONS.filter(item => item.name.toLowerCase().includes(autocompleteQuery.toLowerCase())).slice(0, 5).map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={() => {
                                setFormData({
                                  ...formData,
                                  pickupAddress: item.name,
                                  pickupPosition: item.position as [number, number]
                                });
                                setActiveAutocompleteField(null);
                              }}
                              className="w-full text-left px-6 py-3.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 border-b border-[#F1F5F9] dark:border-[#1E293B] last:border-0"
                            >
                              <MapPin className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 relative">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Dropoff Location / Customer</label>
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
                            setAutocompleteQuery(val);
                            setActiveAutocompleteField('manual_dropoff');
                          }}
                          onFocus={() => {
                            setAutocompleteQuery(formData.address);
                            setActiveAutocompleteField('manual_dropoff');
                          }}
                          onBlur={() => {
                            setTimeout(() => setActiveAutocompleteField(null), 250);
                          }}
                          placeholder="Type dropoff address or use map..." 
                          className="w-full bg-slate-50/50 dark:bg-zinc-800/50 border border-[#E2E8F0] dark:border-zinc-800/80 focus:border-[#10b981] focus:bg-white dark:focus:bg-zinc-900 rounded-2xl pl-12 pr-28 py-3.5 outline-none text-slate-900 dark:text-zinc-100 font-medium text-sm truncate z-0 focus:ring-4 focus:ring-[#10b981]/10 shadow-xs"
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
                      
                      {activeAutocompleteField === 'manual_dropoff' && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto">
                          {UAE_ADDRESS_SUGGESTIONS.filter(item => item.name.toLowerCase().includes(autocompleteQuery.toLowerCase())).slice(0, 5).map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={() => {
                                setFormData({
                                  ...formData,
                                  address: item.name,
                                  position: item.position as [number, number]
                                });
                                setActiveAutocompleteField(null);
                              }}
                              className="w-full text-left px-6 py-3.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 border-b border-[#F1F5F9] dark:border-[#1E293B] last:border-0"
                            >
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2 col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Scheduled Delivery</label>
                      <div className="relative flex items-center">
                        <Calendar className="absolute left-4 text-slate-400 dark:text-zinc-500 w-4.5 h-4.5 z-10 pointer-events-none" />
                        <input 
                          readOnly
                          required
                          type="text" 
                          value={formData.deliveryDate}
                          onClick={() => setIsDateOpen(true)}
                          className="w-full bg-slate-50/50 dark:bg-zinc-800/50 border border-[#E2E8F0] dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 rounded-2xl pl-12 pr-4 py-3.5 outline-none text-slate-900 dark:text-zinc-100 cursor-pointer font-medium text-sm transition-all shadow-xs"
                        />
                      </div>
                    </div>
                    
                    {/* Dynamic Distance Indicator */}
                    <div className="space-y-2 col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">GPS Calculated Distance</label>
                      <div className="w-full h-[50px] bg-slate-50/50 dark:bg-zinc-850 border border-[#E2E8F0] dark:border-zinc-800/80 rounded-2xl px-5 font-semibold text-sm text-slate-800 dark:text-zinc-100 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 dark:text-zinc-500 font-medium text-xs uppercase tracking-wider">Calculated:</span>
                          <span>
                            {formData.pickupPosition && formData.position ? (
                              <strong className="text-[#10b981] font-black text-sm tracking-tight animate-fade-in">
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
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200/80 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                        <Package className="w-[18px] h-[18px]" />
                      </div>
                      <h2 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">Package Parameters & Details</h2>
                    </div>
                    <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
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
                          className="text-[12px] bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-extrabold py-1 px-3 rounded-lg flex items-center gap-1 hover:brightness-110 disabled:opacity-50 transition-all select-none shadow-xs"
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
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/60 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 font-medium text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Cargo Photo (Optional)</label>
                      <span className="text-[13px] text-zinc-400">Skip photo, type manually, or snap anytime!</span>
                    </div>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-zinc-500"
                    >
                      {merchantPhoto ? (
                        <div className="relative w-full h-full p-2">
                          <img src={merchantPhoto} alt="Merchant Cargo Preview" className="w-full h-full object-contain rounded-lg" />
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 opacity-50 text-orange-500 animate-bounce" />
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Click to upload package image for instant parameter filling</span>
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
                      className="p-4 bg-orange-50/70 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 rounded-2xl flex items-center gap-3"
                    >
                      <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-600 rounded-full animate-spin shrink-0"></div>
                      <div>
                        <h4 className="text-xs font-bold text-orange-900 dark:text-orange-100 uppercase tracking-wider flex items-center gap-1">
                          <span>✨ AI Freight Analyst parsing shipment characteristics...</span>
                        </h4>
                        <p className="text-[12px] text-orange-600 dark:text-orange-400 mt-0.5 font-medium">Auto-estimating bulk weight, package dimensions (LxWxH), and confirming package counts.</p>
                      </div>
                    </motion.div>
                  )}

                  {merchantAIResult && !isAnalyzingMerchantItem && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-250/60 dark:border-zinc-800/80 rounded-2xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] uppercase font-black tracking-widest text-orange-600 dark:text-orange-400 flex items-center gap-1">
                          📦 AI EXPORT ESTIMATES APPLIED
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setMerchantAIResult(null)}
                          className="text-[13px] font-bold text-zinc-400 hover:text-zinc-650"
                        >
                          Reset Parameters
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                          <span className="text-[12px] uppercase tracking-wider text-zinc-400 block font-bold">Est. Weight</span>
                          <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">{merchantAIResult.estimatedWeightKg || 5} kg</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                          <span className="text-[12px] uppercase tracking-wider text-zinc-400 block font-bold">Dimensions</span>
                          <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                            {merchantAIResult.lengthCm || 30}x{merchantAIResult.widthCm || 20}x{merchantAIResult.heightCm || 15}cm
                          </span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                          <span className="text-[12px] uppercase tracking-wider text-zinc-400 block font-bold">Total Quantity</span>
                          <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">{merchantAIResult.quantity || 1} Item(s)</span>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                          <span className="text-[12px] uppercase tracking-wider text-zinc-400 block font-bold">Transit Decl. Value</span>
                          <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">{merchantAIResult.estimatedValueAED || 120} AED</span>
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
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/60 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 font-medium text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Purchase Details Panel */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200/80 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                      <DollarSign className="w-[18px] h-[18px]" />
                    </div>
                    <h2 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">Cod Value Mapping</h2>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Order Amount (COD to Collect)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-zinc-400 font-bold text-sm">AED</span>
                      <input 
                        required
                        type="number" 
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        placeholder="0.00" 
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/60 focus:border-emerald-500 rounded-xl pl-14 pr-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 font-bold transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Payout Settlement Option</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { key: 'card', label: 'E-Payment (Prepaid)', desc: 'Billed to Merchant Wallet' },
                        { key: 'cash', label: 'Cash on Delivery (COD)', desc: 'Collect from recipient at door' }
                      ].map((type) => (
                        <button
                          key={type.key}
                          type="button"
                          onClick={() => setFormData({...formData, paymentType: type.key})}
                          className={`flex items-start justify-between p-4 rounded-xl border-2 text-left transition-all ${
                            formData.paymentType === type.key 
                              ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700' 
                              : 'border-transparent bg-zinc-50'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs text-zinc-800 block">{type.label}</span>
                            <span className="text-[12px] text-zinc-400">{type.desc}</span>
                          </div>
                          {formData.paymentType === type.key && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Courier / Fulfillment Routing Option */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200/80 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <Truck className="w-[18px] h-[18px]" />
                    </div>
                    <h2 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">Courier & Driver Fulfillment</h2>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[12px] uppercase font-black tracking-wider text-zinc-400">Choose Courier Channel</p>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        
                        { 
                          key: 'aramex', 
                          label: 'Aramex Sandbox Service', 
                          desc: 'Dispatches packages directly into Aramex\'s sandbox courier channels. Generates automated sandbox API Waybills, WSDL XML logs, and external tracking.' 
                        }
                      ].map((carrier) => (
                        <div key={carrier.key} className="space-y-2">
                           <button
                             type="button"
                             onClick={() => setFormData({...formData, carrier: carrier.key})}
                             className={`flex flex-col p-4 rounded-xl border-2 text-left transition-all cursor-pointer w-full ${
                               formData.carrier === carrier.key 
                                 ? 'border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/20 text-indigo-900 dark:text-zinc-100' 
                                 : 'border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300'
                             }`}
                           >
                             <div className="flex items-center justify-between w-full mb-1">
                               <span className="font-extrabold text-xs">{carrier.label}</span>
                               <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                 formData.carrier === carrier.key ? 'border-indigo-600' : 'border-zinc-300'
                               }`}>
                                 {formData.carrier === carrier.key && (
                                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                 )}
                               </div>
                             </div>
                             <p className="text-[12px] text-zinc-500 leading-normal">{carrier.desc}</p>
                           </button>

                           {formData.carrier === carrier.key && (
                              <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded-xl mt-2 animate-in fade-in slide-in-from-top-1">
                                 <button
                                   type="button"
                                   onClick={() => setFormData({...formData, printFormat: 'PDF'})}
                                   className={`flex-1 text-[12px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors ${formData.printFormat === 'PDF' ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
                                 >
                                   {t('standard_a4') || 'Standard A4 (PDF)'}
                                 </button>
                                 <button
                                   type="button"
                                   onClick={() => setFormData({...formData, printFormat: 'ZPL'})}
                                   className={`flex-1 text-[12px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${formData.printFormat === 'ZPL' ? 'bg-white dark:bg-zinc-900 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-700'}`}
                                 >
                                   {t('thermal_printer') || 'Thermal Printer (ZPL)'}
                                 </button>
                              </div>
                           )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Confirm Dispatch Bar */}
                <div className="bg-zinc-900 text-white rounded-[2/5rem] p-8 space-y-5 shadow-xl">
                  <div className="space-y-3">
                    <div className="flex justify-between text-zinc-400 text-xs uppercase tracking-widest font-black">
                      <span>Base rate fee</span>
                      <span className="text-white">AED 12.00</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 text-xs uppercase tracking-widest font-black">
                      <span>Processing commission</span>
                      <span className="text-white">AED 5.00</span>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-lg">
                      <span className="uppercase text-xs tracking-widest font-black text-zinc-400">Total charge</span>
                      <span className="font-mono text-xl">AED 17.00</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-[#4f95cc] hover:bg-[#3f87bd] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 font-display uppercase text-xs tracking-widest"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Dispatch To Fleet
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* GET QUOTES INTERACTIVE CALCULATOR */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200/80 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
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
                          className="text-[13px] font-bold text-[#047857] bg-zinc-100 hover:bg-zinc-200 px-2 py-1 flex items-center gap-1 rounded-md transition-colors"
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
                                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
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
                          className="text-[13px] font-bold text-rose-500 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 flex items-center gap-1 rounded-md transition-colors"
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
                      <label className="text-[13px] font-black uppercase tracking-wider text-zinc-400">Weight (kg)</label>
                      <input 
                        type="number"
                        value={quoteData.weightKg}
                        onChange={(e) => setQuoteData({...quoteData, weightKg: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-3 text-center text-zinc-900 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2 col-span-1">
                      <label className="text-[13px] font-black uppercase tracking-wider text-zinc-400">Length (cm)</label>
                      <input 
                        type="number"
                        value={quoteData.lengthCm}
                        onChange={(e) => setQuoteData({...quoteData, lengthCm: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-3 text-center text-zinc-900 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2 col-span-1">
                      <label className="text-[13px] font-black uppercase tracking-wider text-zinc-400">Width (cm)</label>
                      <input 
                        type="number"
                        value={quoteData.widthCm}
                        onChange={(e) => setQuoteData({...quoteData, widthCm: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-3 text-center text-zinc-900 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2 col-span-1">
                      <label className="text-[13px] font-black uppercase tracking-wider text-zinc-400">Height (cm)</label>
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
                            ? 'border-emerald-500 bg-emerald-50/15 text-emerald-900 font-semibold' 
                            : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-650'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-zinc-900 block">{tier.label}</span>
                            {quoteData.serviceLevel === tier.key && (
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                          </div>
                          <span className="text-[13px] text-zinc-500 mt-1 block">{tier.delay}</span>
                        </div>
                        <span className="text-[12px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50/70 px-2 py-1 rounded-md self-start">
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
              <div className="space-y-6">
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
          )}
        </motion.div>
      </main>

      {/* Map Address Picker Modal */}
      <Modal 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        title={t('select_address') || 'Confirm Location on Grid Map'}
      >
        <MapPicker 
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
          onSelect={(address, position) => {
            if (isMapOpenQuoteTarget === 'pickup') {
              setQuoteData({...quoteData, pickupAddress: address, pickupPosition: position as [number, number]});
            } else if (isMapOpenQuoteTarget === 'dropoff') {
              setQuoteData({...quoteData, dropoffAddress: address, dropoffPosition: position as [number, number]});
            } else if (isMapOpenQuoteTarget === 'manual_pickup') {
              setFormData({...formData, pickupAddress: address, pickupPosition: position as [number, number]});
            } else {
              setFormData({...formData, address, position: position as [number, number]});
            }
            setIsMapOpen(false);
          }}
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
    </div>
  );
}
