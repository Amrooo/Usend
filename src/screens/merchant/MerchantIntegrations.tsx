import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import { 
  Link2, 
  ShoppingCart, 
  Store, 
  CheckCircle2, 
  ChevronRight, 
  Copy, 
  RefreshCw, 
  Globe, 
  Truck, 
  Code, 
  Sparkles, 
  Settings, 
  Cpu, 
  BellRing,
  Check,
  Terminal,
  Sliders,
  Database,
  Play,
  FileText,
  X,
  ChevronDown,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { updateDocument } from '../../lib/firebaseUtils';
import { 
  courierIntegrationService, 
  defaultAramexCreds, 
  defaultDhlCreds, 
  defaultFedexCreds,
  CourierCredentials,
  RateParams,
  ShipmentParams
} from '../../services/courierIntegration';

const ecommercePlatforms = [
  {
    id: 'shopify',
    name: 'Shopify Premium',
    bgColor: 'bg-[#113f36]/5',
    textColor: 'text-[#95BF47]',
    tagline: 'Connect Shopify Storefront',
    desc: 'Synchronize checkout orders automatically. Maps phone numbers, address payloads, and payment methods in real-time.',
    defaultUrl: 'https://myshopify-store.myshopify.com'
  },
  {
    id: 'salla',
    name: 'Salla Platform (GCC)',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-600 dark:text-teal-400',
    tagline: 'Salla OAuth App Store Connection',
    desc: 'Instantly transmit GCC Salla store orders directly into USend driver routes. Native UAE/KSA city mapping.',
    defaultUrl: 'https://salla.sa/my-gcc-boutique'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce Web Store',
    bgColor: 'bg-purple-50',
    textColor: 'text-[#6b2c91]',
    tagline: 'WordPress Rest API Webhook Hook',
    desc: 'Robust synchronization using REST JSON webhooks. Best optimized for bulk freight routes and wholesale shipping.',
    defaultUrl: 'https://mystore.com/woocommerce'
  },
  {
    id: 'zid',
    name: 'Zid GCC Store',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600 dark:text-orange-400',
    tagline: 'Zid Cloud Storefront Auth',
    desc: 'Native Saudi & UAE retail webapp connection. Synchronizes customer locations, COD options, and custom barcodes instantly.',
    defaultUrl: 'https://zid.store/my-fashion-boutique'
  }
];

interface MerchantIntegrationsProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantIntegrations({ onNavigate }: MerchantIntegrationsProps) {
  const { t, isRTL } = useLanguage();
  const { merchantActiveTab, setMerchantActiveTab, addRequest, user } = useApp();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedTestKey, setCopiedTestKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('https://api.merchantstore.com/webhooks/usend');
  const [webhookEvents, setWebhookEvents] = useState({
    onCreated: true,
    onShipped: true,
    onCompleted: true
  });
  
  const [webhookSaved, setWebhookSaved] = useState(false);

  // STRIPE GATEWAY STATES
  const [stripeSecretKey, setStripeSecretKey] = useState('sk_test_... (Sandbox default)');
  const [stripePublishableKey, setStripePublishableKey] = useState('pk_test_...');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('whsec_...');
  const [stripeIsConnected, setStripeIsConnected] = useState(false);
  const [stripeSandboxMode, setStripeSandboxMode] = useState(true);
  const [stripeMethods, setStripeMethods] = useState({
    cards: true,
    applePay: true,
    googlePay: true
  });
  const [stripeIsChecking, setStripeIsChecking] = useState(true);
  const [stripeConnectionError, setStripeConnectionError] = useState<string | null>(null);

  // Fetch real-time Stripe connection status on mount
  React.useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      setStripeIsChecking(true);
      try {
        const [configRes, statusRes] = await Promise.all([
          fetch('/api/payments/config').then(r => r.json()).catch(() => ({})),
          fetch('/api/payments/status').then(r => r.json()).catch(() => ({}))
        ]);
        
        if (!active) return;

        if (configRes.publishableKey) {
          setStripePublishableKey(configRes.publishableKey);
        }

        if (statusRes.connected) {
          setStripeIsConnected(true);
          setStripeSandboxMode(statusRes.mode === 'test');
          setStripeConnectionError(null);
        } else {
          setStripeIsConnected(false);
          setStripeConnectionError(statusRes.error || 'Gateway not initialized');
        }
      } catch (err: any) {
        if (active) {
          setStripeIsConnected(false);
          setStripeConnectionError(err?.message || 'Failed to authenticate connection status');
        }
      } finally {
        if (active) setStripeIsChecking(false);
      }
    };

    fetchStatus();
    return () => {
      active = false;
    };
  }, []);
  
  // E-COMMERCE INTEGRATION STATES
  const [activePlatforms, setActivePlatforms] = useState<string[]>(['shopify']);
  const [configuringPlatform, setConfiguringPlatform] = useState<string | null>(null);
  const [platformStoreUrl, setPlatformStoreUrl] = useState('');
  const [platformAccessToken, setPlatformAccessToken] = useState('');
  const [platformConnecting, setPlatformConnecting] = useState(false);

  // WEBHOOK DEPLOYMENT LOGS IN-MEMORY STATE
  const [webhookLogs, setWebhookLogs] = useState<Array<{status: number, time: string, event: string, payload: string}>>([
    { status: 200, time: 'Today, 11:30 AM', event: 'dispatch.completed', payload: 'ORD-9921-X' },
    { status: 200, time: 'Today, 10:45 AM', event: 'dispatch.created', payload: 'ORD-2041' }
  ]);

  const [courierActiveTab, setCourierActiveTab] = useState<'new' | 'connected'>('new');
  const [connectedCouriers, setConnectedCouriers] = useState<string[]>(['aramex']); // Default aramex connected with sandbox
  const [courierSearchQuery, setCourierSearchQuery] = useState('');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // INTERACTIVE PLAYGROUND STATE
  const [selectedCourierForConfig, setSelectedCourierForConfig] = useState<string | null>(null);
  const [sandboxActiveTab, setSandboxActiveTab] = useState<'config' | 'rate' | 'ship' | 'track'>('config');
  
  // Credentials states
  const [aramexCreds, setAramexCreds] = useState<CourierCredentials>({ ...defaultAramexCreds });
  const [dhlCreds, setDhlCreds] = useState<CourierCredentials>({ ...defaultDhlCreds });
  const [fedexCreds, setFedexCreds] = useState<CourierCredentials>({ ...defaultFedexCreds });

  React.useEffect(() => {
    if (user && user.integrations) {
      if (user.integrations.aramex) setAramexCreds(user.integrations.aramex);
      if (user.integrations.dhl) setDhlCreds(user.integrations.dhl);
      if (user.integrations.fedex) setFedexCreds(user.integrations.fedex);
      
      const activeKeys = Object.keys(user.integrations).filter(k => user.integrations[k]?.accountNumber);
      if (activeKeys.length > 0) {
        setConnectedCouriers(activeKeys);
      }
    }
    if (user && Array.isArray(user.activePlatforms)) {
      setActivePlatforms(user.activePlatforms);
    }
  }, [user]);

  // Rate calculator tool states
  const [rateOriginCity, setRateOriginCity] = useState('Dubai');
  const [rateOriginCountry, setRateOriginCountry] = useState('AE');
  const [rateDestCity, setRateDestCity] = useState('Riyadh');
  const [rateDestCountry, setRateDestCountry] = useState('SA');
  const [rateWeight, setRateWeight] = useState(1.5);
  const [rateExpress, setRateExpress] = useState(true);
  const [rateResult, setRateResult] = useState<any>(null);
  const [rateLoading, setRateLoading] = useState(false);

  // Shipment waybill tool states
  const [shipSenderName, setShipSenderName] = useState('USend Fulfillment Node 1');
  const [shipSenderPhone, setShipSenderPhone] = useState('+97148851221');
  const [shipSenderCity, setShipSenderCity] = useState('Dubai');
  const [shipSenderAddress, setShipSenderAddress] = useState('Warehouse 14, Al Quoz Industrial Area 3');
  const [shipReceiverName, setShipReceiverName] = useState('Faisal Al-Harbi');
  const [shipReceiverPhone, setShipReceiverPhone] = useState('+966501234567');
  const [shipReceiverCity, setShipReceiverCity] = useState('Riyadh');
  const [shipReceiverCountry, setShipReceiverCountry] = useState('SA');
  const [shipReceiverAddress, setShipReceiverAddress] = useState('Al Olaya District, King Fahd Rd Apt 12');
  const [shipGoodsDescription, setShipGoodsDescription] = useState('Vip Electronics - Smart Watch Series X');
  const [shipWeight, setShipWeight] = useState(1.5);
  const [shipCodAmount, setShipCodAmount] = useState(350);
  const [shipResult, setShipResult] = useState<any>(null);
  const [shipLoading, setShipLoading] = useState(false);

  // Tracking details state
  const [trackNumberInput, setTrackNumberInput] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  const getActiveCreds = (id: string): CourierCredentials => {
    if (id === 'aramex') return aramexCreds;
    if (id === 'dhl') return dhlCreds;
    return fedexCreds;
  };

  const handleUpdateCreds = (id: string, updated: Partial<CourierCredentials>) => {
    if (id === 'aramex') {
      setAramexCreds(prev => ({ ...prev, ...updated }));
    } else if (id === 'dhl') {
      setDhlCreds(prev => ({ ...prev, ...updated }));
    } else {
      setFedexCreds(prev => ({ ...prev, ...updated }));
    }
  };

  const handleConnectCourier = (id: string, name: string) => {
    setConnectingId(id);
    setTimeout(() => {
      setConnectedCouriers(prev => {
        const alreadyConnected = prev.includes(id);
        if (alreadyConnected) {
          setToastMsg(`Disconnected from ${name}`);
          setTimeout(() => setToastMsg(null), 3000);
          return prev.filter(item => item !== id);
        } else {
          setToastMsg(`Successfully connected to ${name}!`);
          setTimeout(() => setToastMsg(null), 3000);
          return [...prev, id];
        }
      });
      setConnectingId(null);
    }, 850);
  };

  const couriersList = [
    {
      id: 'aramex',
      name: 'Aramex',
      logo: (
        <span className="text-4xl font-extrabold tracking-tight text-[#d12421] lowercase font-sans select-none">aramex</span>
      ),
      description: "Aramex is a global shipping and logistics company that provides a wide range of transportation services to businesses and individuals worldwide."
    },
    {
      id: 'dhl',
      name: 'DHL',
      logo: (
        <div className="flex items-center gap-[1px] select-none">
          <span className="text-4xl font-black italic tracking-widest text-[#d01c10] font-sans uppercase leading-none">DHL</span>
          <div className="flex flex-col gap-[3px] ml-1.5 justify-center">
            <div className="w-8 h-[2px] bg-[#d01c10]"></div>
            <div className="w-12 h-[2px] bg-[#d01c10]"></div>
            <div className="w-6 h-[2px] bg-[#d01c10]"></div>
          </div>
        </div>
      ),
      description: "DHL is the world's leading logistics company offering shipping solutions raging from domestic and international deliveries."
    },
    {
      id: 'fedex',
      name: 'FedEx',
      logo: (
        <span className="text-3xl font-black tracking-tight font-sans select-none">
          <span className="text-[#49169a]">Fed</span><span className="text-[#ff6605]">Ex</span><span className="text-xs font-bold text-[#ff6605] align-super ml-0.5">&reg;</span>
        </span>
      ),
      description: "FedEx has the largest logistics delivery fleet in the world which makes them leaders in the express transportation method."
    }
  ];

  const filteredCouriers = couriersList.filter(courier => {
    const matchesTab = courierActiveTab === 'new'
      ? !connectedCouriers.includes(courier.id)
      : connectedCouriers.includes(courier.id);

    const matchesSearch = courier.name.toLowerCase().includes(courierSearchQuery.toLowerCase()) ||
                          courier.description.toLowerCase().includes(courierSearchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const CourierCard = ({ courier }: { courier: typeof couriersList[0] }) => {
    const isConnected = connectedCouriers.includes(courier.id);
    const isConnecting = connectingId === courier.id;

    return (
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
        <div className="flex flex-col items-start gap-4">
          <div className="h-10 flex items-center">
            {courier.logo}
          </div>
          
          <div className="flex flex-col gap-4 w-full mt-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold text-left">
              {courier.description}
            </p>

            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl flex flex-col gap-2.5 text-xs text-left border border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-1.5 text-[12px] font-black uppercase text-[#113f36] tracking-wider">
                <Terminal className="w-3.5 h-3.5" /> API Capabilities Ready
              </div>
              <div className="flex flex-wrap gap-2 text-[12px] font-bold text-zinc-650">
                <span className="px-2 py-1 bg-zinc-200/50 dark:bg-zinc-800 rounded-lg">Rate Calculator</span>
                <span className="px-2 py-1 bg-zinc-200/50 dark:bg-zinc-800 rounded-lg">Shipping Service (AWB)</span>
                <span className="px-2 py-1 bg-zinc-200/50 dark:bg-zinc-800 rounded-lg">Tracking Service</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 justify-end">
              {isConnected && (
                <button
                  onClick={() => {
                    setSelectedCourierForConfig(courier.id);
                    setSandboxActiveTab('rate');
                  }}
                  className="px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 transition-colors"
                >
                  Interactive Playground
                </button>
              )}
              
              <button
                onClick={() => {
                  if (!isConnected) {
                    // Open sandbox credentials form straight away!
                    setSelectedCourierForConfig(courier.id);
                    setSandboxActiveTab('config');
                  } else {
                    handleConnectCourier(courier.id, courier.name);
                  }
                }}
                disabled={connectingId !== null}
                className={`px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest transition-all duration-200 shadow-sm shrink-0 ${
                  isConnecting
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed flex items-center gap-1.5'
                    : isConnected
                      ? 'bg-zinc-100 border border-zinc-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-zinc-500 dark:bg-zinc-800 dark:border-transparent dark:text-zinc-300'
                      : 'bg-[#113f36] hover:bg-zinc-950 text-white dark:hover:bg-white dark:hover:text-zinc-950 active:scale-95'
                }`}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Pending...
                  </>
                ) : isConnected ? (
                  'Disconnect'
                ) : (
                  'Configure Account'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleCopy = (keyText: string, type: 'live' | 'test') => {
    navigator.clipboard.writeText(keyText);
    if (type === 'live') {
      setCopiedKey('Copied!');
      setTimeout(() => setCopiedKey(null), 1500);
    } else {
      setCopiedTestKey('Copied!');
      setTimeout(() => setCopiedTestKey(null), 1500);
    }
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2000);
  };

  const isEcommerce = merchantActiveTab === 'ecommerce';
  const isCouriers = merchantActiveTab === 'couriers';
  const isStripe = merchantActiveTab === 'stripe';
  const isApiSettings = merchantActiveTab === 'api_settings';

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 w-full ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_integrations" onNavigate={onNavigate} />
      
      <main className="flex-1 p-6 lg:p-10 h-full overflow-y-auto">
        <motion.div
          key={merchantActiveTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-8 text-left"
        >
          {/* Section Headers */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <span className="text-[#113f36] font-bold text-[12px] uppercase tracking-[0.4em] block">
                {isStripe ? 'Secure Gateway Hub' : 'Enterprise API & Hooks'}
              </span>
              <h1 className="text-3xl font-display font-medium text-zinc-900 uppercase tracking-tight mt-1">
                {isEcommerce ? 'Connected Platforms' : isCouriers ? 'Courier Channels' : isStripe ? 'Stripe checkout' : 'Live API & Webhooks'}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                {isEcommerce 
                  ? 'Connect shop platforms to automatically sync order catalogs, items, and address payloads.'
                  : isCouriers 
                    ? 'Connect external logistics providers like Aramex to route custom dispatches.'
                    : isStripe
                      ? 'Integrate standard online payments and Apple Pay via Stripe (stripe.com) API tunnel.'
                      : 'Manage REST secure bearer keys, trigger endpoints, and register real-time webhook events status.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 self-start sm:self-center">
              {[
                { key: 'ecommerce', label: 'E-Commerce' },
                { key: 'couriers', label: 'Couriers' },
                { key: 'stripe', label: 'Stripe Gateway 🇦🇪' },
                { key: 'api_settings', label: 'API & Webhooks' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setMerchantActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
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

          {/* RENDERING ON BASIS OF ACTIVE SUB-TAB */}
          {isStripe ? (
            /* TAB 3: STRIPE UAE PAYMENT GATEWAY INTEGRATION */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-200 font-sans">
              {/* Left Column: Config Panel */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#113f36]/5 dark:bg-blue-950/20 border border-[#113f36]/20/50 p-6 rounded-3xl space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💳</span>
                    <h2 className="font-sans font-bold text-sm uppercase tracking-wide text-blue-950 dark:text-zinc-100">Stripe (stripe.com) Integration</h2>
                  </div>
                  <p className="text-xs text-[#113f36] dark:text-[#6e938c] leading-relaxed font-sans font-medium">
                    Fully integrate Stripe's official UAE gateway API to process credit cards, local debit cards, Apple Pay, Tabby, and Tamara. Secure checkouts compliant with standard transaction rules.
                  </p>
                  <div className="text-[12px] bg-[#113f36]/10/60 dark:bg-zinc-900/30 p-2.5 rounded-xl border border-[#113f36]/20/30 text-[#113f36] dark:text-[#a5b994] flex items-center gap-2">
                    <span className="font-black font-sans uppercase">API URL:</span>
                    <code className="font-mono">https://api.stripe.com/api/</code>
                  </div>
                </div>

                {/* API Auth settings */}
                <div className="opacity-95 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-sans">Gateway Keys Configuration</h3>
                  
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[12px] font-black uppercase text-zinc-400">Stripe Secret Key</label>
                      <input 
                        type="password"
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[12px] font-black uppercase text-zinc-400">Publishable Key</label>
                        <input 
                          type="text"
                          value={stripePublishableKey}
                          onChange={(e) => setStripePublishableKey(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-black uppercase text-zinc-400">Webhook Secret</label>
                        <input 
                          type="password"
                          value={stripeWebhookSecret}
                          onChange={(e) => setStripeWebhookSecret(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supported Payment Channels */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-sans">Payment Ecosystem Channels</h3>
                    <span className="px-2 py-0.5 rounded-full text-[12px] font-black bg-[#113f36]/5 text-[#113f36] border border-[#113f36]/10 uppercase font-mono tracking-widest">stripe.com</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={stripeMethods.cards}
                        onChange={(e) => setStripeMethods({...stripeMethods, cards: e.target.checked})}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                      <div className="text-left">
                        <span className="text-xs font-extrabold text-zinc-805 dark:text-white block font-sans">Visa / Mastercard / Amex Protocol</span>
                        <span className="text-[13px] text-zinc-455 block font-mono">Accept regional card products in UAE, Egypt, KSA & Gulf</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={stripeMethods.applePay}
                        onChange={(e) => setStripeMethods({...stripeMethods, applePay: e.target.checked})}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                      <div className="text-left">
                        <span className="text-xs font-extrabold text-zinc-800 dark:text-white block font-sans">Apple Pay Integration</span>
                        <span className="text-[13px] text-zinc-455 block font-mono">Instant biometric checkout on mobile devices & Safari</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={stripeMethods.samsungPay}
                        onChange={(e) => setStripeMethods({...stripeMethods, samsungPay: e.target.checked})}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                      <div className="text-left">
                        <span className="text-xs font-extrabold text-zinc-850 dark:text-white block font-sans">Samsung Pay</span>
                        <span className="text-[13px] text-zinc-455 block font-mono">Enable quick digital wallets on Android OS terminals</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-100 dark:border-zinc-800 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={stripeMethods.tabby}
                        onChange={(e) => setStripeMethods({...stripeMethods, tabby: e.target.checked})}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                      <div className="text-left">
                        <span className="text-xs font-extrabold text-zinc-850 dark:text-white block font-sans">Tabby - Buy Now Pay Later</span>
                        <span className="text-[13px] text-zinc-455 block font-mono font-medium">Split payments into 4 interest-free installments</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Connection Guide & Details */}
              <div className="lg:col-span-7 space-y-6">
                        {/* Integration Details block */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-sm space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-sans">Gateway Connection Status</h3>
                    <span className={`px-3 py-1 rounded-full text-[12px] font-black uppercase font-sans tracking-wide border ${
                      stripeIsChecking 
                        ? 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        : stripeIsConnected
                        ? 'bg-[#113f36]/5 text-[#113f36] border-[#113f36]/10 dark:bg-blue-950/20 dark:border-blue-990/30'
                        : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:border-red-990/30'
                    }`}>
                      {stripeIsChecking ? 'Checking...' : stripeIsConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs font-sans text-zinc-600 dark:text-zinc-400">
                    <p className="font-medium text-[13px] leading-relaxed">
                      {stripeIsConnected 
                        ? 'Your Stripe account is successfully integrated! Standard credit cards and local wallets are active for secure processing.'
                        : 'To finalize this Stripe integration, ensure your system secrets or local environment have a valid STRIPE_SECRET_KEY, then reload the page.'}
                    </p>

                    <div className="bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-500 uppercase tracking-widest text-[13px]">API Status</span>
                        <span className={`font-mono font-bold ${
                          stripeIsChecking 
                            ? 'text-zinc-400'
                            : stripeIsConnected 
                            ? 'text-[#113f36]' 
                            : 'text-red-500'
                        }`}>
                          {stripeIsChecking 
                            ? 'Initializing connection...' 
                            : stripeIsConnected 
                            ? 'Active (Ready to transact)' 
                            : stripeConnectionError || 'Connection check failed'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-500 uppercase tracking-widest text-[13px]">Environment</span>
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">
                          {stripeIsConnected 
                            ? (stripeSandboxMode ? 'Sandbox Testing (Test Mode)' : 'Production Active (Live Mode)') 
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Developer best practices section for Stripe integration */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-sans text-left">Stripe (stripe.com) Integration Best Practices</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-left text-zinc-500 dark:text-zinc-400">
                    <div className="space-y-1.5 p-3.5 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-100 dark:border-zinc-800/80">
                      <span className="font-black text-[12px] text-zinc-800 dark:text-zinc-100 uppercase block font-sans">Secure HMAC Validation</span>
                      <p className="leading-relaxed text-[12px]">Always calculate the HMAC Signature on your server side before trusting transaction callbacks. Stripe provides unique payload keys configured using the HMAC Secret key.</p>
                    </div>

                    <div className="space-y-1.5 p-3.5 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-100 dark:border-zinc-800/80">
                      <span className="font-black text-[12px] text-zinc-800 dark:text-zinc-100 uppercase block font-sans">Lazy Payment iframe Keys</span>
                      <p className="leading-relaxed text-[12px]">Generate the transaction token only upon the final checkout submission. Dynamic tokens expire in 60 minutes. Do not call the authorization API upon loader initialization.</p>
                    </div>

                    <div className="space-y-1.5 p-3.5 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-100 dark:border-zinc-800/80">
                      <span className="font-black text-[12px] text-zinc-800 dark:text-zinc-100 uppercase block font-sans">Apple Pay Native domain</span>
                      <p className="leading-relaxed text-[12px]">Verify your domain with Apple Pay Merchant Identification inside Stripe's panel. This activates instant biometric payouts without redirects.</p>
                    </div>

                    <div className="space-y-1.5 p-3.5 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-100 dark:border-zinc-800/80">
                      <span className="font-black text-[12px] text-zinc-800 dark:text-zinc-100 uppercase block font-sans font-medium">Multi-currency Support</span>
                      <p className="leading-relaxed text-[12px]">Verify that currencies configured in e-commerce coincide with those declared in Stripe panel (e.g., AED vs SAR vs EGP) to avoid gateway rejection.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : !isEcommerce && !isCouriers ? (
            /* API SETTINGS & WEBHOOKS (DEFAULT / ACTIVE) */
            <div className="space-y-6">
              {/* API Credentials Card */}
              <div className="bg-zinc-950 text-white rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Code className="w-56 h-56" />
                </div>
                
                <div className="relative z-10 max-w-2xl space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-2">REST Access Credentials</h2>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Authenticate custom integrations with our secure keys. Use the Live key for manufacturing dispatches and Test key for sandboxed mock transactions.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[12px] font-black uppercase tracking-wider text-zinc-500">Live API Key</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-[#6d8c55] select-all overflow-x-auto truncate">
                          sk_live_usend_6d3f2g1h0a7b6c5
                        </div>
                        <button 
                          onClick={() => handleCopy('sk_live_usend_6d3f2g1h0a7b6c5', 'live')}
                          className="p-3.5 bg-white/10 hover:bg-white/15 active:scale-95 rounded-xl transition-all font-mono text-xs font-bold"
                        >
                          {copiedKey || 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[12px] font-black uppercase tracking-wider text-zinc-500">Test API Key</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-zinc-400 select-all overflow-x-auto truncate">
                          sk_test_usend_1a2b3c4d5e6f7g8
                        </div>
                        <button 
                          onClick={() => handleCopy('sk_test_usend_1a2b3c4d5e6f7g8', 'test')}
                          className="p-3.5 bg-white/10 hover:bg-white/15 active:scale-95 rounded-xl transition-all font-mono text-xs font-bold"
                        >
                          {copiedTestKey || 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhooks Config Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <form onSubmit={handleSaveWebhook} className="bg-white p-8 rounded-[2.5rem] border border-zinc-200/80 shadow-sm md:col-span-2 space-y-6">
                  <div className="flex items-center gap-3">
                    <BellRing className="w-5 h-5 text-[#113f36] animate-pulse" />
                    <h3 className="font-bold text-base text-zinc-900">Configure Delivery Webhooks</h3>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-black uppercase tracking-wider text-zinc-500">Target Endpoint URL</label>
                    <input 
                      type="url" 
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://yourdomain.com/callbacks"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-900 font-bold"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[12px] font-black uppercase tracking-wider text-zinc-500 block">Event Subscriptions</label>
                    
                    <label className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={webhookEvents.onCreated}
                        onChange={(e) => setWebhookEvents({...webhookEvents, onCreated: e.target.checked})}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                      <span className="text-xs font-bold text-zinc-805">dispatch.created (Dispatched manifest registered)</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={webhookEvents.onShipped}
                        onChange={(e) => setWebhookEvents({...webhookEvents, onShipped: e.target.checked})}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                      <span className="text-xs font-bold text-zinc-800">dispatch.shipped (Driver collected product)</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={webhookEvents.onCompleted}
                        onChange={(e) => setWebhookEvents({...webhookEvents, onCompleted: e.target.checked})}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                      <span className="text-xs font-bold text-zinc-800">dispatch.completed (Signature uploaded on port delivery)</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-850 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    {webhookSaved ? '✓ Connection Secured' : 'Save webhook configuration'}
                  </button>
                </form>

                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm space-y-6">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-[#113f36]" />
                    <h4 className="font-bold text-sm text-zinc-900">Deployment Logs</h4>
                  </div>
                  <p className="text-xs text-zinc-500">Historical webhook events triggered on your target endpoint node:</p>
                  
                  <div className="space-y-2.5 font-mono text-[12px] divide-y divide-zinc-100 dark:divide-zinc-800">
                    {webhookLogs.map((log, lIdx) => (
                      <div key={lIdx} className="pt-2 first:pt-0">
                        <span className="text-[#113f36] font-bold block">✓ {log.status} OK • {log.time}</span>
                        <span className="text-zinc-650 dark:text-zinc-350 block mt-0.5">Event: {log.event} [{log.payload}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : isEcommerce ? (
            /* TAB 1: ACTIVE E-COMMERCE INTEGRATION SYSTEMS */
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Conditional Rendering sub-views */}
              {configuringPlatform ? (
                /* 1. SEAMLESS CONFIGURATION WIZARD */
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-10 space-y-6 shadow-sm">
                  <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                    <button 
                      onClick={() => setConfiguringPlatform(null)}
                      className="p-2.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl transition-all cursor-pointer text-zinc-600 dark:text-zinc-300 hover:scale-105"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="font-bold text-lg text-zinc-905 dark:text-white uppercase tracking-tight">
                        Integrate {ecommercePlatforms.find(p => p.id === configuringPlatform)?.name} Step
                      </h3>
                      <p className="text-xs text-zinc-450 dark:text-zinc-400 font-semibold mt-0.5">Setup direct store webhooks & instant synchronization keys easily and fast.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-5 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-black uppercase text-zinc-400">Store Domain URL</label>
                        <input 
                          type="url"
                          value={platformStoreUrl}
                          onChange={(e) => setPlatformStoreUrl(e.target.value)}
                          placeholder={ecommercePlatforms.find(p => p.id === configuringPlatform)?.defaultUrl}
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 px-4 py-3 rounded-2xl text-xs font-bold text-zinc-900 dark:text-zinc-100 placeholder:opacity-50"
                        />
                      </div>

                      <div className="space-y-1.5 font-sans">
                        <label className="text-[12px] font-black uppercase text-zinc-455 block">Bearer Access Key (USend Secret Key)</label>
                        <div className="font-mono text-[12px] bg-zinc-950 text-[#6d8c55] rounded-2xl px-4 py-3 border border-zinc-850 flex items-center justify-between select-all leading-relaxed">
                          <span>sk_live_usend_6d3f2g1h0a7b6c5</span>
                          <span className="text-[13px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-900 px-2 py-0.5 rounded leading-none">Bearer Token</span>
                        </div>
                        <p className="text-[13px] text-zinc-450 leading-relaxed font-medium">Use this token inside your platform settings script to authorize background payloads secure dispatching.</p>
                      </div>

                      <div className="space-y-1.5 font-sans">
                        <label className="text-[12px] font-black uppercase text-zinc-400 block">Platform Endpoint Access Secret</label>
                        <input 
                          type="password"
                          value={platformAccessToken}
                          onChange={(e) => setPlatformAccessToken(e.target.value)}
                          placeholder="Type your platform webhook client secret key..."
                          className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 px-4 py-3 rounded-2xl text-xs font-bold text-zinc-900 dark:text-zinc-100 placeholder:opacity-50"
                        />
                      </div>

                      <button
                        onClick={() => {
                          setPlatformConnecting(true);
                          setTimeout(() => {
                            const newPlatforms = [...activePlatforms, configuringPlatform!];
                            setActivePlatforms(newPlatforms);
                            if (user && user.uid) {
                              updateDocument('users', user.uid, {
                                activePlatforms: newPlatforms
                              }).catch(err => console.error("Error saving activePlatforms to DB:", err));
                            }
                            setToastMsg(`Successfully linked ${configuringPlatform!.toUpperCase()} to USend Merchant Portal!`);
                            setTimeout(() => setToastMsg(null), 3000);
                            setPlatformConnecting(false);
                            setConfiguringPlatform(null);
                          }, 1000);
                        }}
                        disabled={platformConnecting || !platformStoreUrl || !platformAccessToken}
                        className="w-full py-4 bg-[#113f36] hover:bg-zinc-950 text-white dark:hover:bg-white dark:text-zinc-950 dark:hover:text-[#113f36] font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                      >
                        {platformConnecting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Establishing TLS connection Node...
                          </>
                        ) : (
                          'Integrate Platform Easily & Fast'
                        )}
                      </button>
                    </div>

                    <div className="bg-zinc-950 text-zinc-400 rounded-3xl p-6 md:p-8 font-mono text-[12px] flex flex-col justify-between border border-zinc-850 h-[360px] relative">
                      <div className="absolute top-4 right-4 text-[12px] uppercase tracking-widest text-[#113f36] font-bold">API Synchronization</div>
                      <div className="space-y-4 text-left leading-relaxed">
                        <p className="text-zinc-620 font-bold">// webhook payloads automatically mapped using USend rest bridge</p>
                        <div>
                          <span className="text-[#6d8c55] font-bold block">1. Auto-Subscribe Event Webhooks:</span>
                          <p className="text-zinc-350 font-sans mt-1">Our platform hooks directly to `{webhookUrl}` to push automatic callbacks on order checkout, drivers collection, and dynamic signatures.</p>
                        </div>
                        <div>
                          <span className="text-[#6d8c55] font-bold block">2. Automatic Driver Fleet Dispatching:</span>
                          <p className="text-zinc-350 font-sans mt-1">As soon as a retail buyer places a signature checkout on your store, real USend drivers accept and update tasks instantly.</p>
                        </div>
                      </div>
                      <div className="bg-zinc-900/60 p-3.5 rounded-2xl block border border-zinc-805 text-left font-sans text-xs">
                        <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider block">Developer Grounding Ready:</span>
                        <p className="text-zinc-350 mt-1 text-[13px] font-medium leading-relaxed">Integrated SDK hooks compliant with: WooCommerce REST endpoints, Salla GCC Standard App credentials, Shopify Storefront webhook APIs, and Zid retail formats.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 3. CORE PLATFORMS CARDS LIST GRID */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-250">
                  {ecommercePlatforms.map((platform) => {
                    const isConnected = activePlatforms.includes(platform.id);
                    return (
                      <div 
                        key={platform.id}
                        className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-zinc-350 dark:hover:border-zinc-700 transition-all text-left"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className={`w-12 h-12 rounded-2xl ${platform.bgColor} flex items-center justify-center ${platform.textColor}`}>
                              {platform.id === 'shopify' && <ShoppingCart className="w-5 h-5" />}
                              {platform.id === 'salla' && <Store className="w-5 h-5" />}
                              {platform.id === 'woocommerce' && <Globe className="w-5 h-5" />}
                              {platform.id === 'zid' && <Sliders className="w-5 h-5" />}
                            </div>
                            {isConnected ? (
                              <div className="flex items-center gap-1.5 text-[12px] font-black text-[#113f36] dark:text-[#6d8c55] bg-[#113f36]/10 px-3 py-1.5 rounded-full uppercase tracking-wider">
                                <Check className="w-3.5 h-3.5" /> Connected & Active
                              </div>
                            ) : (
                              <div className="text-[12px] font-black text-zinc-400 bg-zinc-150 dark:bg-zinc-800 px-3 py-1.5 rounded-full uppercase tracking-wider">
                                Disconnected
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-[13px] font-black uppercase text-zinc-400 tracking-widest block">{platform.tagline}</span>
                            <h3 className="font-bold text-xl text-zinc-905 dark:text-white mt-1">{platform.name} Integration</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-2.5">
                              {platform.desc}
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          {isConnected ? (
                            <>
                              <button 
                                onClick={() => {
                                  setConfiguringPlatform(platform.id);
                                }}
                                className="px-5 py-2.5 rounded-full font-black text-[12px] uppercase tracking-widest bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer w-full sm:w-auto"
                              >
                                <Settings className="w-3.5 h-3.5" /> Reconfigure
                              </button>
                              
                              <button 
                                onClick={() => {
                                  const newPlatforms = activePlatforms.filter(p => p !== platform.id);
                                  setActivePlatforms(newPlatforms);
                                  if (user && user.uid) {
                                    updateDocument('users', user.uid, {
                                      activePlatforms: newPlatforms
                                    }).catch(err => console.error("Error saving activePlatforms to DB:", err));
                                  }
                                  setToastMsg(`Unlinked ${platform.name} platform.`);
                                  setTimeout(() => setToastMsg(null), 3000);
                                }}
                                className="text-zinc-400 hover:text-rose-500 font-bold transition-colors cursor-pointer text-xs"
                              >
                                Disconnect Platform
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => {
                                  setConfiguringPlatform(platform.id);
                                  setPlatformStoreUrl('');
                                  setPlatformAccessToken('');
                                }}
                                className="px-5 py-2.5 rounded-full font-black text-[12px] uppercase tracking-widest bg-[#113f36] hover:bg-zinc-950 text-white dark:hover:bg-white dark:text-zinc-950 transition-all shadow-sm active:scale-95 cursor-pointer w-full sm:w-auto text-center"
                              >
                                Authorize connection
                              </button>
                              <span className="text-zinc-400 font-medium">Automatic Setup in 1-Min</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: COURIERS INTEGRATION */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Toast Message Container */}
              {toastMsg && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-zinc-900 text-white rounded-xl px-5 py-3 shadow-2xl border border-zinc-800 animate-in fade-in slide-in-from-top-4 duration-300">
                  <CheckCircle2 className="w-4 h-4 text-[#6d8c55]" />
                  <span className="text-xs font-bold font-sans">{toastMsg}</span>
                </div>
              )}

              {/* Sub-tab section adapted to general sleek portal theme */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCourierActiveTab('new')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    courierActiveTab === 'new'
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  New Connections
                </button>
                <button
                  onClick={() => setCourierActiveTab('connected')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    courierActiveTab === 'connected'
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-955 dark:hover:text-white'
                  }`}
                >
                  Already Connected
                </button>
              </div>

              {/* Outer Content Frame adapted to natural sleek theme */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                
                {/* Header with nodes network connection logo rebranded */}
                <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="w-14 h-14 rounded-2xl bg-[#113f36]/10 text-[#113f36] flex items-center justify-center shrink-0">
                    <Truck className="w-7 h-7" />
                  </div>
                  <div className="text-left flex-1">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white uppercase">Connect Courier Hub</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
                      Choose and activate native courier tracking or direct last-mile delivery dispatches for customer packages.
                    </p>
                  </div>
                </div>

                {/* Search Bar container with elegant native theme styles */}
                <div className="bg-zinc-50 dark:bg-zinc-800/20 px-8 py-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-center">
                  <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </span>
                    <input 
                      type="text" 
                      value={courierSearchQuery}
                      onChange={(e) => setCourierSearchQuery(e.target.value)}
                      placeholder="Search couriers and dispatch networks..." 
                      className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-sans text-xs font-semibold rounded-2xl pl-10 pr-4 py-3 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-[#113f36]/20 focus:border-[#113f36] transition-all placeholder:text-zinc-455 placeholder:font-normal" 
                    />
                  </div>
                </div>

                {/* Courier Grid Content */}
                <div className="p-8 bg-zinc-50/50 dark:bg-zinc-950/20 flex-1 min-h-[350px]">
                  {filteredCouriers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#113f36]/5 dark:bg-zinc-800 flex items-center justify-center text-[#5195ca] mb-4">
                        <Truck className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-sky-950">
                        {courierActiveTab === 'new' ? 'No courier channels found' : 'No connected couriers'}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 max-w-sm">
                        {courierActiveTab === 'new' 
                          ? 'Try typing another keywords or reset your filters.' 
                          : 'Go to the "New Connections" tab to link your Aramex accounts.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredCouriers.length === 3 ? (
                        <>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <CourierCard courier={filteredCouriers[0]} />
                            <CourierCard courier={filteredCouriers[1]} />
                          </div>
                          <div className="flex justify-center">
                            <div className="w-full lg:w-[calc(50%-12px)]">
                              <CourierCard courier={filteredCouriers[2]} />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center">
                          {filteredCouriers.map((courier) => {
                            const isOnly = filteredCouriers.length === 1;
                            return (
                              <div key={courier.id} className={isOnly ? "md:col-span-2 md:max-w-lg md:mx-auto w-full" : "w-full"}>
                                <CourierCard courier={courier} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* COURIER SANDBOX & PLAYGROUND MODAL */}
          {selectedCourierForConfig && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
              <div 
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedCourierForConfig(null)}
                  className="absolute top-6 right-6 p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors text-zinc-500 dark:text-zinc-400 z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Banner / Header */}
                <div className="p-8 bg-zinc-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 shrink-0">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#113f36]">
                      <Terminal className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-display font-medium uppercase tracking-tight text-white">
                          {'Aramex Sandbox'}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[12px] font-black uppercase tracking-widest bg-yellow-500/25 text-yellow-300 border border-yellow-500/20">
                          Active Sandbox
                        </span>
                      </div>
                      <p className="text-[13px] text-zinc-400 mt-0.5">
                        Test Rate calculator, direct label waybills, and tracking checkpoints for {selectedCourierForConfig.toUpperCase()}.
                      </p>
                    </div>
                  </div>

                  {/* Sandboxed Server State */}
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 py-2.5 px-4 rounded-xl text-left font-mono text-[12px] self-start md:self-auto">
                    <div className="w-2.5 h-2.5 bg-[#113f36] rounded-full animate-ping"></div>
                    <div>
                      <span className="text-zinc-500 block text-[12px] font-bold uppercase tracking-widest leading-none">TEST_URL</span>
                      <span className="text-zinc-300 font-semibold mt-0.5 block leading-none">
                        {selectedCourierForConfig === 'aramex' ? 'ws.aramex.net' : 'api-mock.usend.ae'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Play tabs */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 px-6 overflow-x-auto shrink-0 py-1.5">
                  {[
                    { id: 'config', label: '1. Setup Credentials', icon: <Database className="w-4 h-4" /> },
                    { id: 'rate', label: '2. Rate Calculator', icon: <Sliders className="w-4 h-4" /> },
                    { id: 'ship', label: '3. Shipping Service', icon: <FileText className="w-4 h-4" /> },
                    { id: 'track', label: '4. Tracking Service', icon: <Globe className="w-4 h-4" /> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSandboxActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                        sandboxActiveTab === tab.id
                          ? 'border-[#113f36] text-[#113f36]'
                          : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Playground Content Area */}
                <div className="p-8 overflow-y-auto flex-1 bg-zinc-50/30 dark:bg-[#0c0c0e]">
                  
                  {/* TAB 1: SETUP CREDENTIALS */}
                  {sandboxActiveTab === 'config' && (
                    <div className="space-y-6 text-left animate-in fade-in duration-200">
                      <div className="p-4 bg-[#113f36]/5 dark:bg-blue-950/25 border border-[#113f36]/20/40 rounded-2xl flex items-start gap-3">
                        <Info className="w-5 h-5 text-[#113f36] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-[#113f36] dark:text-[#a5b994]">Interactive Sandbox Credentials Connected</p>
                          <p className="text-[13px] text-[#113f36]/80 dark:text-[#6e938c]/80 mt-1 leading-relaxed">
                            These endpoints simulate actual API behaviors of {selectedCourierForConfig.toUpperCase()} in our sandbox routing bridge. Modify parameters below to verify credentials payload matching.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400">Account Number</label>
                          <input 
                            type="text"
                            value={getActiveCreds(selectedCourierForConfig).accountNumber}
                            onChange={(e) => handleUpdateCreds(selectedCourierForConfig, { accountNumber: e.target.value })}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-905"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400">Account PIN / Security Token</label>
                          <input 
                            type="text"
                            value={getActiveCreds(selectedCourierForConfig).accountPin}
                            onChange={(e) => handleUpdateCreds(selectedCourierForConfig, { accountPin: e.target.value })}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400">Account Entity</label>
                          <input 
                            type="text"
                            value={getActiveCreds(selectedCourierForConfig).accountEntity}
                            onChange={(e) => handleUpdateCreds(selectedCourierForConfig, { accountEntity: e.target.value })}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400">Country Code</label>
                          <input 
                            type="text"
                            value={getActiveCreds(selectedCourierForConfig).accountCountryCode}
                            onChange={(e) => handleUpdateCreds(selectedCourierForConfig, { accountCountryCode: e.target.value })}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400">Developer Username</label>
                          <input 
                            type="text"
                            value={getActiveCreds(selectedCourierForConfig).username}
                            onChange={(e) => handleUpdateCreds(selectedCourierForConfig, { username: e.target.value })}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400">Developer Password</label>
                          <input 
                            type="password"
                            value={getActiveCreds(selectedCourierForConfig).password || ''}
                            onChange={(e) => handleUpdateCreds(selectedCourierForConfig, { password: e.target.value })}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between gap-4">
                        <div className="flex gap-2">
                          <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[12px] font-bold text-zinc-500">API Version: {getActiveCreds(selectedCourierForConfig).version}</span>
                          <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[12px] font-bold text-zinc-500">Source ID: {getActiveCreds(selectedCourierForConfig).source}</span>
                        </div>
                        <button
                          onClick={() => {
                            const currentCreds = getActiveCreds(selectedCourierForConfig);
                            if (user && user.uid) {
                              const updatedIntegrations = {
                                ...(user.integrations || {}),
                                [selectedCourierForConfig]: currentCreds
                              };
                              updateDocument('users', user.uid, {
                                integrations: updatedIntegrations
                              }).catch(err => console.error("Error saving integrations to DB:", err));
                            }

                            if (!connectedCouriers.includes(selectedCourierForConfig)) {
                              setConnectedCouriers(prev => [...prev, selectedCourierForConfig]);
                              setToastMsg(`Successfully connected to ${selectedCourierForConfig.toUpperCase()} Sandbox!`);
                              setTimeout(() => setToastMsg(null), 3000);
                            } else {
                              setToastMsg(`Credentials saved!`);
                              setTimeout(() => setToastMsg(null), 3000);
                            }
                            setSandboxActiveTab('rate');
                          }}
                          className="px-6 py-3 bg-[#113f36] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-950 dark:hover:bg-white dark:hover:text-zinc-950 transition-colors shadow-lg shadow-[#113f36]/10"
                        >
                          Save Credentials & Continue &rarr;
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: RATE CALCULATOR API */}
                  {sandboxActiveTab === 'rate' && (
                    <div className="space-y-6 text-left animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Control panel */}
                        <div className="md:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-850 dark:text-white flex items-center gap-1.5">
                            <Sliders className="w-4 h-4 text-[#113f36]" /> Parameter Tuner
                          </h4>
                          
                          <div className="space-y-1.5">
                            <label className="text-[13px] font-black uppercase text-zinc-400">Origin Route</label>
                            <input 
                              type="text"
                              value={`${rateOriginCity}, ${rateOriginCountry}`}
                              onChange={(e) => {
                                const parts = e.target.value.split(',');
                                setRateOriginCity(parts[0] || 'Dubai');
                                setRateOriginCountry(parts[1]?.trim() || 'AE');
                              }}
                              className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-830 rounded-xl px-3.5 py-2 text-xs font-bold"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[13px] font-black uppercase text-zinc-400">Destination Route</label>
                            <select 
                              value={`${rateDestCity},${rateDestCountry}`}
                              onChange={(e) => {
                                const parts = e.target.value.split(',');
                                setRateDestCity(parts[0]);
                                setRateDestCountry(parts[1]);
                              }}
                              className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-830 rounded-xl px-3.5 py-2 text-xs font-bold"
                            >
                              <option value="Riyadh,SA">Riyadh, SA</option>
                              <option value="Jeddah,SA">Jeddah, SA</option>
                              <option value="Abu Dhabi,AE">Abu Dhabi, AE</option>
                              <option value="Muscat,OM">Muscat, OM</option>
                              <option value="Kuwait City,KW">Kuwait City, KW</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[13px] font-black uppercase text-zinc-400">Weight (KG)</label>
                              <span className="text-[12px] font-bold text-zinc-500 font-mono">{rateWeight} Kg</span>
                            </div>
                            <input 
                              type="range"
                              min="0.5"
                              max="30"
                              step="0.5"
                              value={rateWeight}
                              onChange={(e) => setRateWeight(Number(e.target.value))}
                              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#113f36]"
                            />
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer pt-2">
                            <input 
                              type="checkbox"
                              checked={rateExpress}
                              onChange={(e) => setRateExpress(e.target.checked)}
                              className="w-4 h-4 accent-[#113f36] rounded"
                            />
                            <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">Express Priority Parcel Rate</span>
                          </label>

                          <button
                            onClick={async () => {
                              setRateLoading(true);
                              const res = await courierIntegrationService.calculateRate(selectedCourierForConfig, {
                                originCity: rateOriginCity,
                                originCountry: rateOriginCountry,
                                destCity: rateDestCity,
                                destCountry: rateDestCountry,
                                weightKb: rateWeight,
                                isExpress: rateExpress,
                                credentials: getActiveCreds(selectedCourierForConfig)
                              });
                              setRateResult(res);
                              setRateLoading(false);
                            }}
                            className="w-full py-3 bg-[#113f36] hover:bg-zinc-950 text-white dark:hover:bg-white dark:hover:text-zinc-950 font-black text-[12px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#113f36]/10"
                          >
                            {rateLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                            Run API request
                          </button>
                        </div>

                        {/* Interactive IDE JSON Logs */}
                        <div className="md:col-span-2 space-y-4">
                          <div className="bg-zinc-950 text-zinc-300 rounded-3xl p-6 font-mono text-[13px] h-[340px] flex flex-col justify-between overflow-hidden shadow-2xl relative">
                            <div className="absolute top-4 right-4 text-[13px] font-black uppercase text-zinc-500">Live API Terminal</div>
                            
                            {!rateResult && !rateLoading ? (
                              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center space-y-2">
                                <Terminal className="w-10 h-10 text-zinc-700 animate-pulse" />
                                <p className="font-semibold text-xs text-zinc-400">Terminal Idle</p>
                                <p className="text-[12px] text-zinc-550 max-w-xs">Adjust parameters on the left and click "Run API Request" to transmit payload signals.</p>
                              </div>
                            ) : rateLoading ? (
                              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-center space-y-3">
                                <RefreshCw className="w-8 h-8 animate-spin text-[#113f36]" />
                                <p className="text-[12px] tracking-wider text-[#6d8c55] font-bold">TRANSMITTING SOAP SOAP:Envelope SOAPAction="getRates"...</p>
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col h-full">
                                <div className="flex justify-between border-b border-zinc-800 pb-3 mb-3 text-[12px] font-bold text-zinc-400 shrink-0">
                                  <span>🚀 HTTP 200 SUCCESS ({rateResult.timestamp})</span>
                                  <span className="text-[#113f36] font-mono">{rateResult.serviceName}</span>
                                </div>
                                
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 select-all h-full max-h-[190px]">
                                  {/* Request */}
                                  <div className="text-left bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col">
                                    <div className="text-[13px] font-black text-[#113f36] uppercase mb-1 flex items-center justify-between">
                                      <span>Request Payload (RPC)</span>
                                      <button onClick={() => navigator.clipboard.writeText(JSON.stringify(rateResult.requestPayload, null, 2))} className="hover:text-white"><Copy className="w-3 h-3" /></button>
                                    </div>
                                    <pre className="text-[13px] overflow-x-auto text-zinc-400 font-mono leading-relaxed select-all">
                                      {JSON.stringify(rateResult.requestPayload, null, 2)}
                                    </pre>
                                  </div>
                                  {/* Response */}
                                  <div className="text-left bg-zinc-905 border border-zinc-805 rounded-xl p-3 flex flex-col">
                                    <div className="text-[13px] font-black text-[#113f36] uppercase mb-1 flex items-center justify-between">
                                      <span>Response Body</span>
                                      <button onClick={() => navigator.clipboard.writeText(JSON.stringify(rateResult.responsePayload, null, 2))} className="hover:text-white"><Copy className="w-3 h-3" /></button>
                                    </div>
                                    <pre className="text-[13px] overflow-x-auto text-zinc-300 font-mono leading-relaxed select-all">
                                      {JSON.stringify(rateResult.responsePayload, null, 2)}
                                    </pre>
                                  </div>
                                </div>

                                <div className="pt-3.5 border-t border-zinc-800 mt-3 flex items-center justify-between shrink-0">
                                  <span className="text-zinc-500">Service Courier Quote Rate:</span>
                                  <span className="text-lg font-black text-white font-mono">AED {rateResult.rateAED.toFixed(2)} <span className="text-[12px] text-zinc-400 font-normal">(incl. VAT)</span></span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: SHIPPING SERVICE API */}
                  {sandboxActiveTab === 'ship' && (
                    <div className="space-y-6 text-left animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Control Forms */}
                        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-850 dark:text-white flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                            <Sliders className="w-4 h-4 text-[#113f36]" /> Waybill Information
                          </h4>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            <div className="space-y-1">
                              <label className="text-[13px] font-black uppercase text-zinc-400">Consignee Title</label>
                              <input 
                                type="text"
                                value={shipReceiverName}
                                onChange={(e) => setShipReceiverName(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-830 rounded-xl px-3 py-1.5 text-xs font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[13px] font-black uppercase text-zinc-400">Consignee Phone</label>
                              <input 
                                type="text"
                                value={shipReceiverPhone}
                                onChange={(e) => setShipReceiverPhone(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-830 rounded-xl px-3 py-1.5 text-xs font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[13px] font-black uppercase text-zinc-400">Consignee Address</label>
                              <input 
                                type="text"
                                value={shipReceiverAddress}
                                onChange={(e) => setShipReceiverAddress(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-830 rounded-xl px-3 py-1.5 text-xs font-bold animate-pulse-once"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[13px] font-black uppercase text-zinc-400">City</label>
                                <input 
                                  type="text"
                                  value={shipReceiverCity}
                                  onChange={(e) => setShipReceiverCity(e.target.value)}
                                  className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-830 rounded-xl px-3 py-1.5 text-xs font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[13px] font-black uppercase text-zinc-400">Country Code</label>
                                <input 
                                  type="text"
                                  value={shipReceiverCountry}
                                  onChange={(e) => setShipReceiverCountry(e.target.value)}
                                  className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-830 rounded-xl px-3 py-1.5 text-xs font-bold"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[13px] font-black uppercase text-zinc-400">Description of Goods</label>
                              <input 
                                type="text"
                                value={shipGoodsDescription}
                                onChange={(e) => setShipGoodsDescription(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-830 rounded-xl px-3 py-1.5 text-xs font-bold"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[13px] font-black uppercase text-zinc-400">Weight (KG)</label>
                                <input 
                                  type="number"
                                  value={shipWeight}
                                  onChange={(e) => setShipWeight(Number(e.target.value))}
                                  className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-830 rounded-xl px-3 py-1.5 text-xs font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[13px] font-black uppercase text-zinc-400">COD (AED)</label>
                                <input 
                                  type="number"
                                  value={shipCodAmount}
                                  onChange={(e) => setShipCodAmount(Number(e.target.value))}
                                  className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-830 rounded-xl px-3 py-1.5 text-xs font-bold animate-pulse-once"
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              setShipLoading(true);
                              const res = await courierIntegrationService.createShipment(selectedCourierForConfig, {
                                credentials: getActiveCreds(selectedCourierForConfig),
                                senderName: shipSenderName,
                                senderPhone: shipSenderPhone,
                                senderCity: shipSenderCity,
                                senderCountry: 'AE',
                                senderAddress: shipSenderAddress,
                                receiverName: shipReceiverName,
                                receiverPhone: shipReceiverPhone,
                                receiverCity: shipReceiverCity,
                                receiverCountry: shipReceiverCountry,
                                receiverAddress: shipReceiverAddress,
                                goodsDescription: shipGoodsDescription,
                                weightKg: shipWeight,
                                codAmountAED: shipCodAmount
                              });
                              setShipResult(res);
                              setTrackNumberInput(res.trackingNumber);
                              setShipLoading(false);
                            }}
                            className="w-full py-3 bg-[#113f36] hover:bg-zinc-950 text-white dark:hover:bg-white dark:hover:text-zinc-950 font-black text-[12px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg"
                          >
                            {shipLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                            Generate Domestic Waybill
                          </button>
                        </div>

                        {/* WAYBILL GRAPHICAL PREVIEW & JSON */}
                        <div className="lg:col-span-2 space-y-4">
                          {!shipResult && !shipLoading ? (
                            <div className="bg-zinc-955 bg-black text-zinc-500 rounded-3xl p-10 h-[430px] flex flex-col items-center justify-center text-center space-y-3">
                              <Terminal className="w-12 h-12 text-zinc-800 animate-pulse" />
                              <h4 className="font-bold text-sm text-zinc-400">Waybill Generator Standby</h4>
                              <p className="text-[13px] text-zinc-550 max-w-sm">Enter the customized address details on the left, then click Generate Waybill. The system will construct official SOAP ClientInfo envelopes and return printable Domestic Waybills.</p>
                            </div>
                          ) : shipLoading ? (
                            <div className="bg-black text-zinc-400 rounded-3xl p-10 h-[430px] flex flex-col items-center justify-center text-center space-y-4 font-mono text-[12px]">
                              <RefreshCw className="w-10 h-10 animate-spin text-[#113f36]" />
                              <div className="space-y-1">
                                <p className="text-[#6d8c55] font-bold">TRANSMITTING WSDL: 'ShippingAPI.V2/Shipments'</p>
                                <p className="text-zinc-500">Payload matching standard SOAP v1.1. Encoding Base64 print signals...</p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Waybill Sticker Visual */}
                              <div className="bg-white text-zinc-950 border-2 border-zinc-950 p-5 rounded-[2rem] font-sans text-left flex flex-col justify-between shadow-md h-[430px] border-dashed">
                                <div className="border-b-2 border-zinc-950 pb-3 flex justify-between items-start shrink-0">
                                  <span className="text-xl font-black uppercase tracking-tight italic hover:scale-105 transition-transform">
                                    {'aramex'}
                                  </span>
                                  <div className="text-right">
                                    <span className="text-[12px] font-black uppercase block text-zinc-500">Service Level</span>
                                    <span className="text-[12px] font-bold tracking-tight bg-zinc-950 text-white px-2 py-0.5 rounded uppercase">{shipResult.labelPreview.cod === 'PREPAID' ? 'Priority Int' : 'COD Parcel'}</span>
                                  </div>
                                </div>

                                <div className="py-3 border-b border-zinc-200 grid grid-cols-2 gap-3 text-[13px] flex-1 overflow-y-auto">
                                  <div>
                                    <span className="font-black text-zinc-550 block uppercase text-[13px] tracking-wider">1. Shipper / Sender</span>
                                    <p className="font-bold">{shipResult.labelPreview.sender}</p>
                                    <p className="text-zinc-500 text-[12px] mt-0.5">Reference: {shipResult.carrierReference}</p>
                                  </div>
                                  <div>
                                    <span className="font-black text-zinc-550 block uppercase text-[13px] tracking-wider">2. Consignee / Receiver</span>
                                    <p className="font-black text-zinc-950">{shipResult.labelPreview.receiver}</p>
                                    <p className="text-zinc-500 text-[12px] mt-0.5">Phone: {shipReceiverPhone}</p>
                                  </div>
                                  <div className="col-span-2 pt-2 border-t border-zinc-100">
                                    <div className="flex justify-between text-[12px] font-bold text-zinc-550">
                                      <span>CONTENT DESC: {shipResult.labelPreview.goods}</span>
                                      <span>WEIGHT: {shipResult.labelPreview.weight}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Barcode emulation */}
                                <div className="py-4 flex flex-col items-center justify-center border-t-2 border-zinc-900 border-dashed shrink-0">
                                  <div className="w-full h-12 bg-zinc-900 flex justify-center items-center relative overflow-hidden flex-col gap-1 rounded">
                                    {/* Artificial Barcode lines */}
                                    <div className="flex gap-[2px] items-stretch h-9 w-full opacity-90 select-none">
                                      {Array.from({ length: 42 }).map((_, i) => (
                                        <div 
                                          key={i} 
                                          className="bg-black shrink-0" 
                                          style={{ width: `${i % 3 === 0 ? '4px' : i % 5 === 0 ? '1px' : '2px'}` }}
                                        ></div>
                                      ))}
                                    </div>
                                    <span className="text-[13px] font-black tracking-[0.25em] text-white absolute bottom-1 bg-zinc-950 px-1.5">{shipResult.trackingNumber}</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-zinc-205 flex items-center justify-between shrink-0 text-[12px]">
                                  <span className="font-black">CHARGES COLLECTION:</span>
                                  <span className="font-mono font-black border border-zinc-950 px-3 py-1 bg-zinc-50 rounded text-xs">{shipResult.labelPreview.cod}</span>
                                </div>
                              </div>

                              {/* JSON Payloads raw data block */}
                              <div className="bg-zinc-950 text-zinc-300 rounded-3xl p-5 font-mono text-[13px] h-[430px] flex flex-col justify-between overflow-hidden shadow-2xl relative">
                                <div className="absolute top-4 right-4 text-[12px] font-black uppercase text-[#113f36]">SOAP WSDL Trace</div>
                                
                                <div className="flex justify-between border-b border-zinc-805 pb-2.5 shrink-0 text-[12px] font-black uppercase text-zinc-400">
                                  <span>Response Signature Stream</span>
                                  <span className="text-[#6d8c55] font-bold">RAW PAYLOAD</span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 pt-2">
                                  <div>
                                    <div className="flex justify-between mb-1 text-zinc-500 font-bold">
                                      <span>REQUEST BODY (USend Shipping Mapping)</span>
                                      <button onClick={() => navigator.clipboard.writeText(JSON.stringify(shipResult.requestPayload, null, 2))} className="hover:text-white"><Copy className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <pre className="bg-zinc-900 rounded-lg p-2 text-zinc-400 overflow-x-auto max-h-[160px] select-all">
                                      {JSON.stringify(shipResult.requestPayload, null, 2)}
                                    </pre>
                                  </div>

                                  <div>
                                    <div className="flex justify-between mb-1 text-zinc-550 font-bold">
                                      <span>RETURN SOAP BODY (Success)</span>
                                      <button onClick={() => navigator.clipboard.writeText(JSON.stringify(shipResult.responsePayload, null, 2))} className="hover:text-white"><Copy className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <pre className="bg-zinc-900 rounded-lg p-2 text-zinc-400 overflow-x-auto max-h-[160px] select-all">
                                      {JSON.stringify(shipResult.responsePayload, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: TRACKING SERVICE API */}
                  {sandboxActiveTab === 'track' && (
                    <div className="space-y-6 text-left animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Status tracker parameters */}
                        <div className="md:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#113f36] flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                            <Sliders className="w-4 h-4 text-[#113f36]" /> Tracking Service
                          </h4>

                          <div className="space-y-2">
                            <label className="text-[13px] font-black uppercase text-zinc-400">Courier Waybill Number</label>
                            <input 
                              type="text"
                              value={trackNumberInput}
                              onChange={(e) => setTrackNumberInput(e.target.value)}
                              placeholder="e.g. ARX-45796-039210"
                              className="w-full bg-zinc-50 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-830 rounded-xl px-4 py-2.5 text-xs font-bold"
                            />
                            <p className="text-[13px] text-zinc-500">Provides sandbox lookup matching specific checkpoint telemetry parameters.</p>
                          </div>

                          <button
                            onClick={async () => {
                              if (!trackNumberInput.trim()) return;
                              setTrackLoading(true);
                              const activeCreds = getActiveCreds(selectedCourierForConfig || 'aramex');
                              const res = await courierIntegrationService.trackShipment(selectedCourierForConfig || 'aramex', trackNumberInput, activeCreds);
                              setTrackResult(res);
                              setTrackLoading(false);
                            }}
                            className="w-full py-3 bg-[#113f36] hover:bg-zinc-950 text-white dark:hover:bg-white dark:hover:text-zinc-950 font-black text-[12px] uppercase tracking-widest rounded-xl transition-all"
                          >
                            {trackLoading ? 'Querying status...' : 'Query Waybill Status'}
                          </button>
                        </div>

                        {/* STEPPER TIMELINE DISPLAY */}
                        <div className="md:col-span-2 space-y-4">
                          {!trackResult && !trackLoading ? (
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 bg-white dark:bg-zinc-900 h-[340px] flex flex-col items-center justify-center text-center space-y-2">
                              <Globe className="w-12 h-12 text-zinc-300 animate-spin" style={{ animationDuration: '6s' }} />
                              <h4 className="font-bold text-sm text-zinc-855 dark:text-zinc-300">Tracking Service Portal</h4>
                              <p className="text-[13px] text-zinc-500 max-w-xs">Enter a generated waybill and trigger status history queries to test webhook mappings.</p>
                            </div>
                          ) : trackLoading ? (
                            <div className="bg-black text-zinc-400 rounded-3xl p-10 h-[340px] flex flex-col items-center justify-center text-center space-y-4 font-mono text-[12px]">
                              <RefreshCw className="w-8 h-8 animate-spin text-[#113f36]" />
                              <p className="text-[#6d8c55] font-bold">RESOLVING TRACKING REFERENCE OVER CLOUD CONSOLE...</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              
                              {/* Step logs list */}
                              <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] h-[345px] overflow-y-auto space-y-5 text-left">
                                {trackResult.success === false ? (
                                  <div className="flex flex-col items-center justify-center text-center h-full space-y-3.5 py-6">
                                    <ShieldAlert className="w-12 h-12 text-rose-500 animate-bounce" />
                                    <div className="space-y-1.5 max-w-sm">
                                      <h4 className="font-extrabold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-widest">WSDL Sandbox Error Code 404</h4>
                                      <p className="text-[13px] text-zinc-600 dark:text-zinc-400 font-semibold leading-relaxed">
                                        {trackResult.error}
                                      </p>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-850 px-3 py-2 rounded-xl border border-zinc-150 dark:border-zinc-800 text-[13px] font-mono text-zinc-400 uppercase max-w-xs">
                                      Fault: SOAP-ENV:Client / OrderNotFound
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="border-b border-zinc-100 pb-3 block">
                                      <span className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Waybill Journey logs</span>
                                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-1">Waybill Status: Out For Delivery</h4>
                                    </div>

                                    <div className="relative border-l-2 border-[#113f36]/30 ml-3 space-y-6">
                                      {trackResult.steps.map((step: any, sIdx: number) => (
                                        <div key={sIdx} className="relative pl-6">
                                          {/* Node circle */}
                                          <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 ${
                                            sIdx === trackResult.steps.length - 1 ? 'bg-[#113f36] border-[#113f36]/20 scale-125' : 'bg-[#113f36] border-white dark:border-zinc-900'
                                          }`}></div>
                                          <div className="text-left">
                                            <div className="flex items-center gap-2">
                                              <span className="text-[13px] font-bold text-zinc-900 dark:text-white">{step.location}</span>
                                              <span className="text-[13px] font-bold text-zinc-400 font-mono">{step.time}</span>
                                            </div>
                                            <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed">{step.description}</p>
                                            <span className="text-[12px] font-black tracking-widest text-[#113f36] uppercase mt-1 block bg-[#113f36]/5 dark:bg-zinc-800 inline-block px-1.5 py-0.5 rounded">{step.status}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Target SOAP API Logs */}
                              <div className="md:col-span-1 bg-zinc-950 text-zinc-400 rounded-3xl p-5 h-[345px] font-mono text-[13px] flex flex-col justify-between overflow-hidden shadow-xl">
                                <div className="text-[12px] font-black text-amber-400 flex justify-between uppercase border-b border-zinc-800 pb-2">
                                  <span>Tracking Payload Trace</span>
                                  <span>SOAP Envelopes</span>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-1 space-y-3 pt-2 text-left">
                                  <div>
                                    <span className="block text-zinc-600 font-bold mb-1 uppercase tracking-widest">SOAP Request Headers</span>
                                    <pre className="bg-zinc-900 rounded p-1.5 text-[12px] overflow-x-auto text-zinc-400 select-all max-h-[90px]">
                                      {JSON.stringify(trackResult.requestPayload, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <span className="block text-zinc-650 font-bold mb-1 uppercase tracking-widest">SOAP Response Headers</span>
                                    <pre className="bg-zinc-900 rounded p-1.5 text-[12px] overflow-x-auto text-zinc-400 select-all max-h-[100px]">
                                      {JSON.stringify(trackResult.responsePayload, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>

                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
