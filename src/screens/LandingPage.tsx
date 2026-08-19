import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { useRef, useState, useEffect, useMemo } from 'react';
import React from 'react';
import { Screen } from '../types';
import { 
  ArrowRight, Globe2, ChevronDown, ArrowUp, Zap, Smartphone, Shield, 
  ChevronLeft, ChevronRight, XCircle, Truck, Package, Plane, Warehouse, 
  Bot, Star, Users, Calculator, Check, MapPin, Play, Plus, Building, 
  ArrowUpRight, Phone, Award, ShieldAlert, HelpCircle, Lock, Mail, Loader2, Anchor, LogOut, Bell, Menu, X
} from 'lucide-react';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import LogoIcon from '../components/LogoIcon';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import OrderWizard from '../components/OrderWizard';
import uaeFlag from '../assets/uae-flag.jpg';
import heroVideo from '../assets/hero-video.mp4';
import heroTruck from '../assets/hero-truck.png';
import shipmentImg from '../assets/shipment.png';
import sectorContainer from '../assets/sector-container.png';
import ctaCargoShip from '../assets/cta-cargo-ship.png';

const AiFace3DIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 44 44" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="22" r="20" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14 24C14 24 16.5 28 22 28C27.5 28 30 24 30 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="17.5" cy="18.5" r="1.5" fill="currentColor" />
    <circle cx="26.5" cy="18.5" r="1.5" fill="currentColor" />
  </svg>
);

interface LandingPageProps {
  onNavigate: (screen: Screen) => void;
}

const landingTranslations = {
  en: {
    navServices: 'Services',
    navPortals: 'Ecosystem Portals',
    navEstimator: 'Live Estimator',
    navTeam: 'Our Team',
    navFaq: 'FAQ',
    adminAccess: 'Admin Portal',
    hubAccess: 'Hub Access',
    heroBadge: 'Multi-Courier E-Commerce Shipping Gateway',
    heroTitle: 'Unified Courier HubFor E-Commerce',
    heroDesc: 'USend is a central hub connecting online merchants and users with last-mile couriers to deliver products and items seamlessly. Provide recipient details, designate item prices, and choose payment modes in one unified dashboard. Easily dispatch via sandbox channels like Aramex or use our active on-demand local drivers on the USend driver app.',
    btnDownloadApp: 'Download App',
    btnLearnMore: 'Get Pricing Estimate',
    aboutCaption: 'About USend Gateway',
    aboutTitle: 'Connect Online Shops & Custom API Dispatches to UAE Courier Networks.',
    aboutDesc: 'Enter receiver parameters, set the exact payment value you want to collect, and determine options for cash or card. Integrated services like Aramex automatically route jobs to external carriers, while other dispatches are handled immediately by local USend drivers using the Driver App.',
    aboutAchievement: '98.5% On-Time Delivery Across UAE Domestic Networks',
    statIndigenous: '15K+ Active Store Merchants',
    statTons: '5M+ Waybills Generated',
    statClients: '98%+ Courier SLA Met',
    servicesBadge: 'Unified Gateway',
    servicesTitle: 'One integration. Connected courier channels.',
    servicesDesc: 'From establishing customer delivery addresses and collecting custom cash payouts to on-demand driver dispatch, USend powers the complete logistics loop.',
    portalsBadge: 'All-In-One Unified Ecosystem',
    portalsTitle: 'Connected Ports For UAE E-Commerce Deliveries',
    portalsDesc: 'Gain direct access to respective interfaces built precisely for portal merchants, active driver fleets, retail customers, and country-wide administrators.',
    portalPersonalTitle: 'Customer App Tracking',
    portalPersonalDesc: 'Got an incoming parcel? View delivery coordinates, and communicate with delivery couriers live.',
    portalPersonalBtn: 'Access Customer Area',
    portalBusinessTitle: 'Merchant Portal Core',
    portalBusinessDesc: 'Consolidate e-commerce orders, sync Shopify catalogs, design & print custom bulk waybills, and request instant COD balance payouts.',
    portalBusinessBtn: 'Open Merchant Workspace',
    portalCourierTitle: 'Driver Dispatch Terminal',
    portalCourierDesc: 'UAE courier driver companion app. Route optimization, digital signature proof, and real-time COD invoice settlement on-the-go.',
    portalCourierBtn: 'Driver App View',
    portalAdminTitle: 'Admin Portal',
    portalAdminTitleDesc: 'Complete overview of active courier performance rates, live driver GPS coordinates, system parameter configuration, and COD ledger control.',
    portalAdminBtn: 'Open Admin Portal',
    estimatorBadge: 'Shipping Calculator',
    estimatorTitle: 'Compare Domestic Shipping Rates',
    estimatorDesc: 'Select pickup and destination Emirates. Instantly compare UAE domestic couriers and see estimated transit speeds.',
    pricingSource: 'Emirate of Origin',
    pricingTarget: 'Destination Emirate',
    pricingWeight: 'Weight Limit (KG)',
    pricingWidth: 'Width (CM)',
    pricingLength: 'Length (CM)',
    pricingEstimateBtn: 'Compare Domestic Rates',
    howBadge: 'Automated Operations',
    howTitle: 'Synchronize and Settle Every Order With Absolute Precision',
    howStep1Num: '01',
    howStep1Title: 'Identify Receivers & Decide Pricing',
    howStep1Desc: 'Input recipient credentials, delivery destinations, and specify package price details and optimal payout methods for COD/Prepaid.',
    howStep2Num: '02',
    howStep2Title: 'Integrated Courier Selection',
    howStep2Desc: 'Choose the courier that fits. Selecting Aramex utilizes external sandbox tracking, and other options assign directly to the USend driver pool.',
    howStep3Num: '03',
    howStep3Title: 'On-Demand Local Driver Assignment',
    howStep3Desc: 'Private driver fleets accept pending USend orders via the Driver Companion App, initiating optimized navigation and live tracking.',
    howStep4Num: '04',
    howStep4Title: 'Instant COD Settlement',
    howStep4Desc: 'Cash-on-Delivery collections are automatically updated on your merchant ledger. Settle and withdraw payments straight to your bank account.',
    teamBadge: 'The Shipping Builders',
    teamTitle: 'Meet the Builders of Smart Logistics',
    teamDesc: 'Our success starts with our people. Meet the logistics engineers and software architects building the future of UAE e-commerce parcel routing.',
    teamSlogan: 'Skilled Experts in Logistics and E-Commerce Integration. Delivering GCC Domestic Excellence.',
    faqBadge: 'Common Questions',
    faqTitle: 'Frequently Answered Questions',
    faq1Q: 'How does USend integrate with my existing online store?',
    faq1A: 'We support one-click API integrations for WooCommerce, Shopify, Magento, and Wix. Once connected, orders are synced in real-time, allowing immediate waybill generation.',
    faq2Q: 'Do you support international parcel shipping?',
    faq2A: 'International shipping across GCC states (Riyadh, Doha, Bahrain, Muscat) and worldwide is currently under construction and is marked as "Coming Soon" with live trials launching next quarter.',
    faq3Q: 'How can I track my domestic shipping progress?',
    faq3A: 'Our system generates live tracking links for consumers. Or simply enter your order code starting with "REQ-" straight into our built-in Support Bot.',
    faq4Q: 'How do e-commerce cash on delivery (COD) payouts work?',
    faq4A: 'Our smart wallet tracks driver feedback instantly. Once the receiver confirms signature and pays, the amount is credited to your Merchant Wallet to withdraw anytime.',
    footerLead: 'Accelerate E-Commerce Deliveries & Settle Payments Instantly',
    footerLeadDesc: 'Link your store with our multi-courier aggregator and optimize your delivery operational speed.',
    copyright: '© 2026 USEND SYSTEMS (SHIPLIFIER GATEWAY AGENCY). REGULATION COMPLIANT IN UAE.',
    botGreeting: 'Hello! I am USend AI Assistant. Enter any Order Number (e.g., REQ-1001) to track your delivery, or ask about our e-commerce integrations.',
    smartSolutionsTitle: 'Smart Solutions',
    smartSolutionsForShipping: 'for Shipping',
    smartSolutionsDesc: 'USend offers shipping tools that simplify logistics for modern businesses',
    startNowBtn: 'Start Now',
    talkToSalesBtn: 'Talk to Sales',
    aboutUsCaption: 'About USend Gateway',
    aboutUsTitle: 'About Us',
    successRate: 'Success Rate In On-Time Product Delivery',
  },
  ar: {
    navServices: 'الخدمات',
    navPortals: 'بوابات المنظومة',
    navEstimator: 'حاسبة الشحن',
    navTeam: 'فريق العمل',
    navFaq: 'الأسئلة الشائعة',
    adminAccess: 'لوحة الإدارة',
    hubAccess: 'تسجيل الدخول',
    heroBadge: 'بوابة الشحن الموحدة للمتاجر الإلكترونية وشبكات التوصيل',
    heroTitle: 'مركزك اللوجستي المتكامل لإدارة التجارة الإلكترونية',
    heroDesc: 'منصة "يو سند" هي بوابتك المركزية التي تربط المتاجر والعملاء بأفضل مزودي الخدمات اللوجستية. تتيح لك المنصة إدارة تفاصيل الشحنات، تحديد الأسعار، وتخصيص خيارات الدفع من لوحة تحكم واحدة. وجه طلباتك بسلاسة إلى شركاء الشحن مثل أرامكس، أو اعتمد على أسطولنا المحلي من السائقين لتوصيل فوري وفعّال.',
    btnDownloadApp: 'حمل التطبيق',
    btnLearnMore: 'احسب تكلفة الشحن',
    aboutCaption: 'عن منصة "يو سند"',
    aboutTitle: 'حلقة الوصل الذكية بين المتاجر الإلكترونية وشبكات التوصيل في الإمارات.',
    aboutDesc: 'أدخل بيانات المستلم، حدد قيمة التحصيل (COD)، واختر طريقة الدفع المناسبة. يضمن لك نظامنا المتكامل توجيه الشحنات تلقائياً عبر شركائنا الموثوقين، أو إسنادها فورياً لسائقينا المحليين لضمان سرعة التوصيل.',
    aboutAchievement: 'نسبة نجاح 98.5٪ في دقة تسليم الشحنات داخل الإمارات',
    statIndigenous: 'أكثر من 15,000 متجر نشط',
    statTons: 'أكثر من 5 ملايين بوليصة مصدرة',
    statClients: 'رضا عملاء يتجاوز 98٪',
    servicesBadge: 'بوابة موحدة للخدمات اللوجستية',
    servicesTitle: 'تكامل برمجي واحد.. خيارات شحن لا حصر لها.',
    servicesDesc: 'بدءاً من إدارة عناوين العملاء وعمليات الدفع عند الاستلام، وصولاً إلى توجيه السائقين بشكل فوري، "يو سند" تدير دورتك اللوجستية بالكامل.',
    portalsBadge: 'منظومة متكاملة',
    portalsTitle: 'بوابات مخصصة لتلبية احتياجات التجارة الإلكترونية',
    portalsDesc: 'تمتع بوصول مباشر وواجهات مصممة خصيصاً للمتاجر، أساطيل التوصيل، العملاء، ومسؤولي النظام.',
    portalPersonalTitle: 'تطبيق تتبع الشحنات للعملاء',
    portalPersonalDesc: 'هل تنتظر شحنة؟ تتبع موقعها بدقة وتواصل مع مندوب التوصيل في الوقت الفعلي.',
    portalPersonalBtn: 'بوابة العملاء',
    portalBusinessTitle: 'لوحة تحكم التجار',
    portalBusinessDesc: 'أدر طلبات متجرك، زامن منتجاتك، اطبع بوليصات الشحن المجمعة، واستلم أموال التحصيل (COD) بضغطة زر.',
    portalBusinessBtn: 'بوابة المتاجر',
    portalCourierTitle: 'تطبيق مندوبي التوصيل',
    portalCourierDesc: 'الرفيق الرقمي لمندوبي التوصيل. تحسين مسارات الرحلة، إثبات التسليم الرقمي، وتسوية الفواتير فورياً.',
    portalCourierBtn: 'بوابة السائقين',
    portalAdminTitle: 'لوحة الإدارة المركزية',
    portalAdminTitleDesc: 'إشراف شامل على أداء شركات الشحن، تتبع مباشر لمواقع السائقين، تحكم بإعدادات النظام، وإدارة السجلات المالية.',
    portalAdminBtn: 'بوابة الإدارة',
    estimatorBadge: 'حاسبة الشحن',
    estimatorTitle: 'قارن أسعار الشحن المحلي بسهولة',
    estimatorDesc: 'حدد وجهة الانطلاق والوصول داخل الإمارات، وقارن بين أسعار شركات الشحن وأوقات التوصيل المقدرة بلمحة بصر.',
    pricingSource: 'منطقة الاستلام',
    pricingTarget: 'منطقة التسليم',
    pricingWeight: 'الوزن (كجم)',
    pricingWidth: 'العرض (سم)',
    pricingLength: 'الطول (سم)',
    pricingEstimateBtn: 'احسب أسعار الشحن',
    howBadge: 'عمليات لوجستية مؤتمتة',
    howTitle: 'مزامنة وتسوية لكل شحنة بدقة متناهية',
    howStep1Num: '01',
    howStep1Title: 'تحديد المستلم والتسعير',
    howStep1Desc: 'أدخل بيانات المستلم وعنوانه، وحدد تفاصيل الدفع سواء كان الدفع مسبقاً أو عند الاستلام (COD).',
    howStep2Num: '02',
    howStep2Title: 'اختيار مسار الشحن',
    howStep2Desc: 'اختر شركة الشحن الأنسب. قم بتوجيهها لأرامكس للتتبع الخارجي، أو لأسطول "يو سند" المحلي للتوصيل المباشر.',
    howStep3Num: '03',
    howStep3Title: 'الإسناد الفوري للسائقين',
    howStep3Desc: 'يستقبل السائقون الطلبات المعلقة عبر تطبيقهم، لتبدأ رحلة التوصيل مع توجيه ذكي وتتبع مباشر.',
    howStep4Num: '04',
    howStep4Title: 'تسوية مالية فورية',
    howStep4Desc: 'تُضاف مبالغ الدفع عند الاستلام (COD) تلقائياً لمحفظتك. سدد رسومك واسحب أرباحك لحسابك البنكي متى شئت.',
    teamBadge: 'خبراء اللوجستيات',
    teamTitle: 'تعرف على بناة شبكتنا الذكية',
    teamDesc: 'نجاحنا ينبع من فريقنا. تواصل مع مهندسينا اللوجستيين ومطوري البرمجيات الذين يرسمون مستقبل التوصيل في الإمارات.',
    teamSlogan: 'نخبة من الخبراء في اللوجستيات والتجارة الإلكترونية، لضمان أعلى مستويات الخدمة المحلية.',
    faqBadge: 'الأسئلة الشائعة',
    faqTitle: 'استفسارات وحلول لوجستية',
    faq1Q: 'كيف أرتبط منصة "يو سند" بمتجري الإلكتروني؟',
    faq1A: 'نوفر ربطاً سريعاً ومباشراً لمعظم المنصات مثل شوبيفاي، ووكومرس، وماجنتو. بمجرد الربط، تُزامن الطلبات وتُصدر البوليصات آلياً.',
    faq2Q: 'هل تدعمون الشحن الدولي؟',
    faq2A: 'خدمة الشحن الدولي لدول الخليج وغيرها قيد التطوير حالياً، وسنطلق المرحلة التجريبية قريباً.',
    faq3Q: 'كيف يمكنني تتبع حالة شحنتي؟',
    faq3A: 'يُرسل نظامنا روابط تتبع مباشرة للمستلمين، أو يمكنك إدخال رقم الطلب (مثل REQ-1001) في المساعد الآلي لتتبعها فوراً.',
    faq4Q: 'كيف يتم تحصيل أموال الدفع عند الاستلام (COD)؟',
    faq4A: 'يرصد نظامنا تأكيد السائق للتسليم فوراً، وبمجرد دفع المستلم وتوقيعه، يُضاف المبلغ لمحفظتك لتقوم بسحبه لاحقاً.',
    footerLead: 'سرّع وتيرة شحناتك واستلم أرباحك فوراً',
    footerLeadDesc: 'اربط متجرك بمنصتنا اللوجستية المتقدمة واستمتع بسرعة وموثوقية التوصيل.',
    copyright: '© 2026 جميع الحقوق محفوظة لشركة "يو سند" للأنظمة اللوجستية. مرخصة للعمل في دولة الإمارات العربية المتحدة.',
    botGreeting: 'أهلاً بك! أنا المساعد الآلي لـ "يو سند". أدخل رقم الطلب (مثل REQ-1001) لتتبعه، أو اسألني عن خدمات الربط لمتاجرك.',
    smartSolutionsTitle: 'حلول ذكية مخصصة لـ',
    smartSolutionsForShipping: 'عمليات الشحن',
    smartSolutionsDesc: 'توفر "يو سند" أدوات مبتكرة تسهّل إدارة العمليات اللوجستية لشركتك.',
    startNowBtn: 'ابدأ الآن',
    talkToSalesBtn: 'تواصل مع المبيعات',
    aboutUsCaption: 'عن منصة "يو سند"',
    aboutUsTitle: 'من نحن',
    successRate: 'نسبة النجاح في التوصيل في الوقت المحدد',
  }
};

const LandingPage = ({ onNavigate }: LandingPageProps) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { language, setLanguage, isRTL } = useLanguage();
  
  // Unified Login Modal State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<'merchant' | 'user' | 'driver' | 'admin'>('merchant');
  const [loginEmail, setLoginEmail] = useState('merchant@usend.com');
  const [loginPassword, setLoginPassword] = useState('password');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Guest Order Modal State
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  // Real Notifications State & Logic
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [clearedNotifIds, setClearedNotifIds] = useState<string[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);


  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    let redirectScreen: Screen = 'merchant_dashboard';
    if (loginRole === 'user' || (loginRole as string) === 'driver') redirectScreen = 'user_dashboard';
    else if (loginRole === 'admin') redirectScreen = 'admin_dashboard';

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setLoginModalOpen(false);
      onNavigate(redirectScreen);
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const content = landingTranslations[language as 'en' | 'ar'] || landingTranslations.en;
  
  const [estSource, setEstSource] = useState('DXB');
  const [estTarget, setEstTarget] = useState('AUH');
  const [estWeight, setEstWeight] = useState(5);
  const [estWidth, setEstWidth] = useState(30);
  const [estLength, setEstLength] = useState(30);
  
  const [calculating, setCalculating] = useState(false);
  const [estimateResult, setEstimateResult] = useState<{
    calculated: boolean;
    basePrice: number;
    weightSurcharge: number;
    volumeSurcharge: number;
    totalPrice: number;
    duration: string;
    routeType: 'Domestic Express' | 'Express Road' | 'Local Messenger';
  } | null>(null);

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const { scrollY } = useScroll({
    target: targetRef,
    offset: ['start start', 'end start']
  });
  const yParallax = useTransform(scrollY, [0, 800], [0, 200]);

    const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  
  const heroSlides = [
    {
      type: 'image',
      image: uaeFlag,
      titleEn: 'Proudly serving businesses across all of the UAE',
      titleAr: 'نفخر بخدمة الشركات في جميع أنحاء دولة الإمارات العربية المتحدة',
      descEn: 'With state-of-the-art logistics infrastructure, we make the impossible possible.',
      descAr: 'من خلال البنية التحتية اللوجستية الحديثة، نجعل المستحيل ممكناً.',
    },
    {
      type: 'video',
      video: heroVideo,
      titleEn: 'Smart shipping infrastructure built for tomorrow',
      titleAr: 'بنية تحتية للشحن الذكي مبنية للمستقبل',
      descEn: 'Optimize your logistics lifecycle with direct API and driver-companion connections.',
      descAr: 'حسن دورة حياة الخدمات اللوجستية الخاصة بك مع الاتصال المباشر للواجهة البرمجية والسائق.',
    },
    {
      type: 'image',
      image: ctaCargoShip,
      titleEn: 'Taking your cargo further, faster, and more securely',
      titleAr: 'نأخذ شحنتك إلى أبعد من ذلك، أسرع، وبأمان أكبر',
      descEn: 'We are your dependable partner for delivering your precious items and ensuring your products reach their destination safely.',
      descAr: 'نحن شريكك الموثوق به لتسليم أغراضك الثمينة وضمان وصول منتجاتك إلى وجهتها بأمان.',
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlideIdx(prev => (prev + 1) % heroSlides.length);
    }, 7500);
    return () => clearInterval(interval);
  }, []);

const [botOpen, setBotOpen] = useState(false);
  const [botMessages, setBotMessages] = useState<{sender: 'bot'|'user', text: string}[]>([
    { sender: 'bot', text: content.botGreeting }
  ]);
  const [botInput, setBotInput] = useState('');

  const { activeRequests, allOrders, signIn, setUser, user, signOut } = useApp();

  // Dynamic Real Notifications derived from authenticated user & active orders
  const notifications = useMemo(() => {
    if (!user) return [];

    const list = (allOrders && allOrders.length) ? allOrders : activeRequests;
    const userOrders = list.filter(r => 
      r.userId === user.uid || 
      r.id?.includes(user.uid || '') || 
      user.role === 'admin' || 
      user.role === 'merchant'
    );

    const generated: Array<{
      id: string;
      titleEn: string;
      titleAr: string;
      descEn: string;
      descAr: string;
      timeEn: string;
      timeAr: string;
      read: boolean;
      type: 'order' | 'wallet' | 'courier' | 'system' | 'api';
    }> = [];

    generated.push({
      id: `welcome-${user.uid || user.id || 'usr'}`,
      titleEn: `System Active for ${user.name || 'Account'}`,
      titleAr: `النظام نشط لحساب ${user.name || 'المستخدم'}`,
      descEn: `Connected to Aramex, Noon & USend Fleet dispatch network.`,
      descAr: `متصل بشبكة شحن أرامكس، نون، وأسطول يو سيند.`,
      timeEn: 'Active',
      timeAr: 'نشط',
      read: readNotifIds.includes(`welcome-${user.uid || user.id || 'usr'}`),
      type: 'system'
    });

    userOrders.slice(0, 10).forEach((order) => {
      const isDelivered = (order.status || '').toLowerCase().includes('deliver');
      const isInTransit = (order.status || '').toLowerCase().includes('transit') || (order.status || '').toLowerCase().includes('dispatch');
      
      const notifId = `order-created-${order.id}`;
      generated.push({
        id: notifId,
        titleEn: `Order ${order.id} Created`,
        titleAr: `تم إنشاء الطلب ${order.id}`,
        descEn: `Shipment from ${order.originCity || 'Dubai'} to ${order.destinationCity || order.receiverCity || 'UAE'} via ${order.carrier || 'Aramex'}.`,
        descAr: `تم تسجيل شحنة من ${order.originCity || 'دبي'} إلى ${order.destinationCity || order.receiverCity || 'الإمارات'} عبر ${order.carrier || 'أرامكس'}.`,
        timeEn: order.date || 'Today',
        timeAr: order.date || 'اليوم',
        read: readNotifIds.includes(notifId),
        type: 'order'
      });

      if (isDelivered) {
        const delivId = `order-deliv-${order.id}`;
        generated.push({
          id: delivId,
          titleEn: `Shipment ${order.id} Delivered`,
          titleAr: `تم تسليم الشحنة ${order.id}`,
          descEn: `Package successfully delivered to destination recipient.`,
          descAr: `تم تسليم الطرد بنجاح للمستلم في الوجهة.`,
          timeEn: 'Delivered',
          timeAr: 'تم التسليم',
          read: readNotifIds.includes(delivId),
          type: 'courier'
        });
      } else if (isInTransit) {
        const transId = `order-trans-${order.id}`;
        generated.push({
          id: transId,
          titleEn: `Shipment ${order.id} Out for Delivery`,
          titleAr: `الشحنة ${order.id} قيد التوصيل`,
          descEn: `Driver/Courier is on route to recipient. Tracking active.`,
          descAr: `السائق/الناقل في طريقه للمستلم. التتبع نشط.`,
          timeEn: 'In Transit',
          timeAr: 'جاري التوصيل',
          read: readNotifIds.includes(transId),
          type: 'courier'
        });
      }
    });

    return generated.filter(n => !clearedNotifIds.includes(n.id));
  }, [user, activeRequests, allOrders, readNotifIds, clearedNotifIds]);

  const markAllNotifsAsRead = () => {
    setReadNotifIds(notifications.map(n => n.id));
  };

  const toggleNotifRead = (id: string) => {
    setReadNotifIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const clearAllNotifications = () => {
    setClearedNotifIds(notifications.map(n => n.id));
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const handleBotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botInput.trim()) return;

    const userMsg = botInput.trim();
    setBotMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setBotInput('');

    setTimeout(() => {
      let reply = "";
      const matchOrder = userMsg.match(/REQ-\d+/i);
      
      if (matchOrder) {
        const orderNum = matchOrder[0].toUpperCase();
        const found = activeRequests.find(r => r.id.toUpperCase() === orderNum);
        if (found) {
          reply = `Order ${found.id} Found!
• Status: ${found.status.toUpperCase()}
• Recipient: ${found.name}
• Route: ${found.fromDestination} ➔ ${found.toDestination}
• Carrier: ${found.courier || 'USend Fleet'}
• Item Type: ${found.itemType || 'Package'}
• COD Amount: ${found.orderAmount || '0 AED'}
• Delivery Fee: ${found.deliveryFee || '0 AED'}
• ETA Time: ${found.etaTime || 'Calculating...'}`;
        } else {
          reply = `Status for ${orderNum}: • Current Location: Dubai Al Quoz Sorting Facility• Shipping Line: Aramex Express (Sandbox)• Expected Delivery: Next Business Day before 6:00 PM• Payout Mode: Cash on Delivery (320.00 AED)`;
        }
      } else if (userMsg.toLowerCase().includes('rate') || userMsg.toLowerCase().includes('price') || userMsg.toLowerCase().includes('cost')) {
        reply = "Our standard UAE domestic rates:• Dubai to Abu Dhabi (Express Road): Starting at 25 AED base• Local messengers (Same Day): 15 AED flat rate• Extra Weight tariff: 1.5 AED per extra KGUse the Live Shipping Calculator on our home page to compare exact tariffs.";
      } else {
        reply = "Thanks for reaching out! I can track any 'REQ-' code in our UAE sandbox. Enter an order code or type 'rates' to see our current shipping prices.";
      }

      setBotMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 850);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) setIsScrolled(true);
      else setIsScrolled(false);
      if (window.scrollY > 400) setShowBackToTop(true);
      else setShowBackToTop(false);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logos = [
    { name: 'Genesis', url: 'https://genesis-logistics.com/wp-content/themes/genesis/images/logo.png' },
    { name: 'Kelsen', url: 'https://kelsen.com/wp-content/uploads/2019/06/Kelsen_logo.png' },
    { name: 'Polar Seafood', url: 'https://polarseafood.com/static/img/logo.svg' },
    { name: 'Beumer', url: 'https://www.beumergroup.com/wp-content/themes/beumergroup/assets/img/beumer-group-logo.svg' },
    { name: 'Pharmacosmos', url: 'https://www.pharmacosmos.com/media/1001/pharmacosmos-logo.svg' },
    { name: 'SGD', url: 'https://sportsgroupdenmark.com/wp-content/uploads/2021/04/SGD_logo.png' },
  ];

  const handleScrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div 
      id="landing-root"
      className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#113f36]/20 overflow-x-hidden relative flex flex-col w-full" 
      dir={isRTL ? "rtl" : "ltr"} 
      ref={targetRef}
    >
      
      
      
      
      
      {/* ── HEADER (FLOATING & OVERLAY) ── */}
            <Header onNavigate={onNavigate} setLoginRole={setLoginRole} setLoginModalOpen={setLoginModalOpen} content={content} handleScrollTo={handleScrollTo} />
      <div className="w-full relative z-10 bg-white px-6 md:px-16 py-4 pb-0">
        <div className="relative w-full h-[510px] md:h-[640px] rounded-[2rem] overflow-hidden shadow-sm">
          {/* Background Slider */}
          <AnimatePresence mode="wait">
            {heroSlides[heroSlideIdx].type === 'video' ? (
              <motion.video
                key={heroSlideIdx}
                src={heroSlides[heroSlideIdx].video}
                autoPlay
                loop
                muted
                playsInline
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
                style={{ y: yParallax }}
                className="absolute -top-[5%] inset-x-0 w-full h-[115%] object-cover object-top select-none"
              />
            ) : (
              <motion.img
                key={heroSlideIdx}
                src={heroSlides[heroSlideIdx].image}
                alt="USend Freight"
                referrerPolicy="no-referrer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
                style={{ y: yParallax }}
                className="absolute -top-[5%] inset-x-0 w-full h-[115%] object-cover object-top select-none"
              />
            )}
          </AnimatePresence>
          
          {/* Overlay Gradients */}
          <div className={`absolute inset-0 ${
            isRTL 
              ? 'bg-gradient-to-l from-slate-950/80 via-slate-900/40 to-transparent' 
              : 'bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent'
          } pointer-events-none`}></div>

          {/* ── Hero Content ── */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-24 z-10 max-w-5xl pt-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroSlideIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <h1 className="text-4xl sm:text-5xl md:text-[5rem] font-bold text-white leading-[1.05] tracking-tight font-sans drop-shadow-lg">
                  {isRTL ? heroSlides[heroSlideIdx].titleAr : heroSlides[heroSlideIdx].titleEn}
                </h1>
                <p className="mt-6 text-white font-bold text-base md:text-xl max-w-2xl drop-shadow-md">
                  {isRTL ? heroSlides[heroSlideIdx].descAr : heroSlides[heroSlideIdx].descEn}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 mt-10">
                  <button
                    onClick={() => { setLoginRole('user'); setLoginModalOpen(true); }}
                    className="bg-[#113f36] hover:bg-[#0d3029] text-white px-7 py-3.5 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors shadow-lg cursor-pointer"
                  >
                    {isRTL ? 'ابدأ طلبك الآن' : 'Ship Now'}
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setBotOpen(true)}
                    className="bg-[#cca073] hover:bg-[#b78b5c] text-slate-900 px-7 py-3.5 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors shadow-lg cursor-pointer"
                  >
                    {isRTL ? 'تتبع الشحنة' : 'Live Tracking'}
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Slider Dots */}
            <div className="absolute bottom-10 left-6 md:left-24 flex items-center gap-2 z-20">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroSlideIdx(idx)}
                  className={`w-12 h-1.5 rounded-full transition-all cursor-pointer ${idx === heroSlideIdx ? 'bg-[#113f36]' : 'bg-white/30 hover:bg-white/50'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Partners Section */}
        <section className="w-full py-12 bg-white flex flex-col items-center justify-center relative select-none overflow-hidden border-b border-slate-100">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          <p className="text-slate-500 font-medium text-[15px] mb-8">
            {isRTL ? 'شركاء الشركات العالمية الرائدة' : 'Partners of world leading shipping companies'}
          </p>

          <div className="w-full overflow-hidden flex whitespace-nowrap group" dir="ltr">
            <div className={`flex items-center gap-8 ${isRTL ? 'animate-marquee-rtl' : 'animate-marquee'} whitespace-nowrap py-2 pr-8 group-hover:[animation-play-state:paused]`}>
              {[
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0">
                      <span className="text-[#E31B23] font-black text-2xl tracking-tighter italic">aramex</span>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0">
                      <div className="bg-[#feee00] text-black font-extrabold text-lg px-3.5 py-1.5 rounded-lg tracking-tighter">
                        noon
                      </div>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0">
                      <div className="bg-[#ffcc00] text-[#d00000] font-black italic text-xl px-4 py-1.5 rounded-lg tracking-tight">
                        DHL
                      </div>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0 text-xl">
                      <span className="text-[#4D148C] font-black tracking-tight">Fed</span>
                      <span className="text-[#FF6600] font-black tracking-tight -ml-1">Ex</span>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0 text-xl">
                      <span className="text-[#113f36] font-black tracking-tight">{isRTL ? 'يوسند' : 'USend'}</span>
                      <span className="text-[#cca073] font-black tracking-tight -ml-1">{isRTL ? 'فليت' : 'Fleet'}</span>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex flex-col font-sans select-none shrink-0 relative pt-1">
                      <span className="text-black font-black text-xl tracking-tight leading-none">amazon</span>
                      <div className="w-14 h-1.5 bg-[#FF9900] rounded-full -mt-0.5 ml-1 self-start animate-pulse"></div>
                    </div>
                  )
                }
              ].concat([
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0">
                      <span className="text-[#E31B23] font-black text-2xl tracking-tighter italic">aramex</span>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0">
                      <div className="bg-[#feee00] text-black font-extrabold text-lg px-3.5 py-1.5 rounded-lg tracking-tighter">
                        noon
                      </div>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0">
                      <div className="bg-[#ffcc00] text-[#d00000] font-black italic text-xl px-4 py-1.5 rounded-lg tracking-tight">
                        DHL
                      </div>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0 text-xl">
                      <span className="text-[#4D148C] font-black tracking-tight">Fed</span>
                      <span className="text-[#FF6600] font-black tracking-tight -ml-1">Ex</span>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0 text-xl">
                      <span className="text-[#113f36] font-black tracking-tight">{isRTL ? 'يوسند' : 'USend'}</span>
                      <span className="text-[#cca073] font-black tracking-tight -ml-1">{isRTL ? 'فليت' : 'Fleet'}</span>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex flex-col font-sans select-none shrink-0 relative pt-1">
                      <span className="text-black font-black text-xl tracking-tight leading-none">amazon</span>
                      <div className="w-14 h-1.5 bg-[#FF9900] rounded-full -mt-0.5 ml-1 self-start animate-pulse"></div>
                    </div>
                  )
                }
              ]).concat([
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0">
                      <span className="text-[#E31B23] font-black text-2xl tracking-tighter italic">aramex</span>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0">
                      <div className="bg-[#feee00] text-black font-extrabold text-lg px-3.5 py-1.5 rounded-lg tracking-tighter">
                        noon
                      </div>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0">
                      <div className="bg-[#ffcc00] text-[#d00000] font-black italic text-xl px-4 py-1.5 rounded-lg tracking-tight">
                        DHL
                      </div>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0 text-xl">
                      <span className="text-[#4D148C] font-black tracking-tight">Fed</span>
                      <span className="text-[#FF6600] font-black tracking-tight -ml-1">Ex</span>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex items-center gap-1.5 font-sans select-none shrink-0 text-xl">
                      <span className="text-[#113f36] font-black tracking-tight">{isRTL ? 'يوسند' : 'USend'}</span>
                      <span className="text-[#cca073] font-black tracking-tight -ml-1">{isRTL ? 'فليت' : 'Fleet'}</span>
                    </div>
                  )
                },
                {
                  logo: (
                    <div className="flex flex-col font-sans select-none shrink-0 relative pt-1">
                      <span className="text-black font-black text-xl tracking-tight leading-none">amazon</span>
                      <div className="w-14 h-1.5 bg-[#FF9900] rounded-full -mt-0.5 ml-1 self-start animate-pulse"></div>
                    </div>
                  )
                }
              ]).map((logoItem, idx) => (
                <div key={idx} className="flex items-center gap-2 select-none shrink-0 bg-white px-8 py-3.5 rounded-2xl border border-slate-100 shadow-xs transition-all duration-300 hover:scale-110 hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 cursor-pointer">
                  {logoItem.logo}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guest Order Wizard Styled for Theme */}
        <div className="w-full bg-slate-50/30 py-24 px-4 md:px-8 relative z-20 border-t border-b border-slate-100/50" id="order-wizard">
          {/* Subtle decorative glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#113f36]/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-5xl mx-auto flex flex-col items-center relative z-10">
            
            {/* Header Block */}
            <div className="text-center space-y-4 max-w-2xl mb-12">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#113f36]/10 text-[#113f36] text-[11px] font-black uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5 text-[#cca073]" />
                {isRTL ? 'شحن فوري بدون حساب' : 'Instant Checkout Flow'}
              </span>
              <h2 className="text-3xl md:text-[2.8rem] font-black uppercase tracking-tight text-slate-900 leading-none">
                {isRTL ? 'شحن فوري وسهل للجميع' : 'Fast Guest Send'}
              </h2>
              <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
                {isRTL ? 'أرسل شحناتك فوراً وبدون الحاجة لتسجيل حساب. احسب السعر والوقت وابدأ فوراً.' : 'Dispatch single parcels instantly without creating an account. Compare rates, set COD parameters, and pay in one step.'}
              </p>
            </div>
            
            {/* Actually, let's keep the Order Wizard here but wrap it nicely */}
            <div className="w-full bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden relative">
              <div className="p-4 md:p-10">
                <OrderWizard 
                  onNavigate={onNavigate} 
                  isGuest={true} 
                  onRequestLogin={() => { setLoginRole('user'); setLoginModalOpen(true); }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* TIMELINE SECTION - Full Width */}
      <section className="w-full bg-white py-16 px-4 md:px-8 border-b border-slate-100 relative">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-center mb-12">
            {isRTL ? 'حلول مخصصة لمتطلبات عملك' : 'TAILORED SOLUTIONS FOR YOUR BUSINESS REQUIREMENTS'}
          </p>
          
          {/* Horizontal Timeline */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute top-[18px] left-[12%] right-[12%] h-[1.5px] bg-slate-200 z-0"></div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
              {/* Node 1 */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-9 h-9 rounded-full bg-white border border-[#113f36]/20 shadow-sm flex items-center justify-center text-[#113f36] font-bold z-10">
                  <span className="w-2.5 h-2.5 bg-[#113f36] rounded-full"></span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">30k+</h3>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Shipments / year</p>
                  <p className="text-[11px] text-slate-400">Across all modes</p>
                </div>
              </div>

              {/* Node 2 */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-9 h-9 rounded-full bg-white border border-[#113f36]/20 shadow-sm flex items-center justify-center text-[#113f36] font-bold z-10">
                  <span className="w-2.5 h-2.5 bg-[#113f36] rounded-full"></span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">2.9k</h3>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active partners</p>
                  <p className="text-[11px] text-slate-400">Carrier network</p>
                </div>
              </div>

              {/* Node 3 */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-9 h-9 rounded-full bg-white border border-[#113f36]/20 shadow-sm flex items-center justify-center text-[#113f36] font-bold z-10">
                  <span className="w-2.5 h-2.5 bg-[#113f36] rounded-full"></span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">1,245</h3>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Shipments / year</p>
                  <p className="text-[11px] text-slate-400">Road, sea & air</p>
                </div>
              </div>

              {/* Node 4 */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-9 h-9 rounded-full bg-white border border-[#113f36]/20 shadow-sm flex items-center justify-center text-[#113f36] font-bold z-10">
                  <span className="w-2.5 h-2.5 bg-[#113f36] rounded-full"></span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">5,875</h3>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Shipments / year</p>
                  <p className="text-[11px] text-slate-400">Globally served</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      


      {/* END-TO-END LOGISTICS SOLUTIONS SECTION - 4 Card Grid - Full Width */}
      <section id="services" className="w-full bg-[#FAFBFD] py-24 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 text-start">
              <h2 className="text-3xl md:text-[2.6rem] font-black uppercase text-slate-950 tracking-tight leading-none font-sans">
                {isRTL ? 'خدمات النقل والخدمات اللوجستية المتكاملة' : 'END-TO-END LOGISTICS SOLUTIONS'}
              </h2>
            </div>
            <div className="flex shrink-0">
              <button 
                onClick={() => document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-[#113f36] hover:bg-[#0d3029] text-white rounded-full font-black text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>{isRTL ? 'جميع الخدمات' : 'All Services'}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* 4 Cards Grid (2x2) - Focused on UAE Domestic Services with elegant background image hover effects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            
            {/* Card 1: Inter-Emirate Delivery */}
            <div 
              onClick={() => document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative bg-white border border-slate-200/60 rounded-[2rem] p-8 flex flex-col justify-between h-[300px] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden text-start cursor-pointer"
            >
              {/* Fade-in & Scale Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-[0.03] group-hover:opacity-[0.09] transition-all duration-700 pointer-events-none transform scale-100 group-hover:scale-105"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80')` }}
              />
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-[#113f36]/10 text-[#113f36] group-hover:bg-[#113f36] group-hover:text-white border border-[#113f36]/25 flex items-center justify-center shrink-0 transition-all duration-500">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="px-4 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider group-hover:bg-[#cca073]/15 group-hover:text-[#cca073] transition-all duration-500">
                  {isRTL ? 'داخل الإمارات' : 'UAE Domestic'}
                </span>
              </div>
              
              <div className="relative z-10 space-y-2 mt-4">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-[#113f36] transition-colors duration-300">
                  {isRTL ? 'التوصيل بين الإمارات' : 'Inter-Emirate Delivery'}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {isRTL 
                    ? 'شحن بري سريع وآمن يربط بين جميع الإمارات السبع. نوفر خدمة النقل من الباب إلى الباب بين دبي، أبوظبي، والشارقة وباقي المدن خلال 24 ساعة.' 
                    : 'Fast, secure, and reliable door-to-door freight distribution connecting all 7 Emirates with scheduled daily dispatches.'}
                </p>
              </div>
              
              <div className="relative z-10 pt-4">
                <button className="px-4 py-2 border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-black rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all bg-white cursor-pointer shadow-xs">
                  {isRTL ? 'احجز الآن' : 'Ship Now'} <ArrowRight className={`w-3 h-3 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Card 2: Same-Day Local Express */}
            <div 
              onClick={() => document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative bg-white border border-slate-200/60 rounded-[2rem] p-8 flex flex-col justify-between h-[300px] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden text-start cursor-pointer"
            >
              {/* Fade-in & Scale Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-[0.03] group-hover:opacity-[0.09] transition-all duration-700 pointer-events-none transform scale-100 group-hover:scale-105"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1615460549969-36fa19521a4f?auto=format&fit=crop&w=800&q=80')` }}
              />
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-[#113f36]/10 text-[#113f36] group-hover:bg-[#113f36] group-hover:text-white border border-[#113f36]/25 flex items-center justify-center shrink-0 transition-all duration-500">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="px-4 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider group-hover:bg-[#cca073]/15 group-hover:text-[#cca073] transition-all duration-500">
                  {isRTL ? 'توصيل فوري' : 'Same-Day Delivery'}
                </span>
              </div>
              
              <div className="relative z-10 space-y-2 mt-4">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-[#113f36] transition-colors duration-300">
                  {isRTL ? 'توصيل محلي سريع' : 'Same-Day Local Express'}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {isRTL 
                    ? 'خدمة توصيل سريعة من الباب إلى الباب للمستندات والطرود العاجلة داخل دبي وأبوظبي والشارقة في غضون ساعات قليلة.' 
                    : 'On-demand point-to-point courier routes operating within major UAE city limits for time-sensitive cargo and documents.'}
                </p>
              </div>
              
              <div className="relative z-10 pt-4">
                <button className="px-4 py-2 border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-black rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all bg-white cursor-pointer shadow-xs">
                  {isRTL ? 'طلب سريع' : 'Book Express'} <ArrowRight className={`w-3 h-3 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Card 3: Merchant E-commerce Logistics */}
            <div 
              onClick={() => document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative bg-white border border-slate-200/60 rounded-[2rem] p-8 flex flex-col justify-between h-[300px] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden text-start cursor-pointer"
            >
              {/* Fade-in & Scale Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-[0.03] group-hover:opacity-[0.09] transition-all duration-700 pointer-events-none transform scale-100 group-hover:scale-105"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80')` }}
              />
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-[#113f36]/10 text-[#113f36] group-hover:bg-[#113f36] group-hover:text-white border border-[#113f36]/25 flex items-center justify-center shrink-0 transition-all duration-500">
                  <Building className="w-5 h-5" />
                </div>
                <span className="px-4 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider group-hover:bg-[#cca073]/15 group-hover:text-[#cca073] transition-all duration-500">
                  {isRTL ? 'أعمال وتجارة' : 'B2B Logistics'}
                </span>
              </div>
              
              <div className="relative z-10 space-y-2 mt-4">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-[#113f36] transition-colors duration-300">
                  {isRTL ? 'خدمات التجار والتجارة الإلكترونية' : 'Merchant E-commerce Logistics'}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {isRTL 
                    ? 'حلول شحن مخصصة لشركات التجارة الإلكترونية، تشمل تحصيل مبالغ الدفع عند الاستلام (COD) وإدارة المرتجعات والتسليم السريع.' 
                    : 'Tailored merchant booking portals, automated API webhooks, bulk shipping channels, and comprehensive Cash on Delivery (COD) remittance.'}
                </p>
              </div>
              
              <div className="relative z-10 pt-4">
                <button className="px-4 py-2 border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-black rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all bg-white cursor-pointer shadow-xs">
                  {isRTL ? 'بوابة التجار' : 'Merchant Portal'} <ArrowRight className={`w-3 h-3 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Card 4: Noon Rider-on-Demand (RoD) */}
            <div 
              onClick={() => document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative bg-white border border-slate-200/60 rounded-[2rem] p-8 flex flex-col justify-between h-[300px] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden text-start cursor-pointer"
            >
              {/* Fade-in & Scale Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-[0.03] group-hover:opacity-[0.09] transition-all duration-700 pointer-events-none transform scale-100 group-hover:scale-105"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558222218-b7b54eede3f3?auto=format&fit=crop&w=800&q=80')` }}
              />
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-[#113f36]/10 text-[#113f36] group-hover:bg-[#113f36] group-hover:text-white border border-[#113f36]/25 flex items-center justify-center shrink-0 transition-all duration-500">
                  <Globe2 className="w-5 h-5" />
                </div>
                <span className="px-4 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                  {isRTL ? 'تكامل نون' : 'Noon RoD Integrated'}
                </span>
              </div>
              
              <div className="relative z-10 space-y-2 mt-4">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-[#113f36] transition-colors duration-300">
                  {isRTL ? 'توصيل نون السريع' : 'Noon Hyperlocal Delivery'}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {isRTL 
                    ? 'ربط مباشر مع شبكة نون للتوصيل الفوري (Noon Rider on Demand) لإسناد وتوصيل طلباتك بسرعة فائقة داخل المدن الرئيسية.' 
                    : 'Direct integration with Noon Rider on Demand (RoD) logistics network for rapid intra-city hyper-local parcel dispatch.'}
                </p>
              </div>
              
              <div className="relative z-10 pt-4">
                <button className="px-4 py-2 border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-black rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all bg-white cursor-pointer shadow-xs">
                  {isRTL ? 'إسناد نون' : 'Book Noon Rider'} <ArrowRight className={`w-3 h-3 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="w-full bg-white pb-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-[2rem] overflow-hidden relative min-h-[360px] bg-slate-900 shadow-sm flex items-end" onClick={() => document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' })}>
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 hover:opacity-40 transition-opacity duration-700 cursor-pointer"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1600&q=80')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/60 to-transparent pointer-events-none"></div>
            <div className="relative z-10 p-10 md:p-14 w-full text-start">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white font-sans leading-none drop-shadow-lg mb-4">
                {isRTL ? 'جاهز لشحن طردك الآن؟' : 'READY TO DISPATCH YOUR SHIPMENT?'}
              </h2>
              <p className="text-white/90 text-sm font-semibold tracking-wide mb-8">
                {isRTL ? 'احسب الأسعار فوراً واحصل على بوليسة الشحن عبر أسطولنا أو شركائنا المعينين.' : 'Calculate live courier rates and generate instant waybills with Aramex, Noon, or USend local drivers.'}
              </p>
              
              <button 
                className="px-8 py-3.5 bg-[#cca073] hover:bg-[#b88c5e] text-slate-950 rounded-full font-black text-[12px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl cursor-pointer"
              >
                <span>{isRTL ? 'احسب سعر الشحنة' : 'Calculate Courier Rate'}</span>
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* TAILORED SOLUTIONS ABOUT BLOCK - Lavender rounded container - Full Width */}
      <section id="about" className="w-full py-24 bg-white px-4 md:px-8">
        <div className="max-w-7xl mx-auto bg-[#F8FAFC] border border-slate-100 rounded-[3rem] p-8 md:p-14 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: text content */}
            <div className="lg:col-span-6 text-start space-y-8">
              <p className="text-[11px] font-black uppercase text-[#113f36] tracking-wider block">
                {content.aboutUsCaption}
              </p>
              <h2 className="text-3xl md:text-[2.6rem] font-bold text-slate-950 tracking-tight leading-none font-sans uppercase">
                {isRTL ? 'حلول شحن مخصصة لمتطلبات تجارتك' : 'TAILORED SOLUTIONS FOR YOUR BUSINESS REQUIREMENTS'}
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
                {content.aboutDesc}
              </p>

              {/* 2x2 Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#113f36]/10 text-[#113f36] border border-[#113f36]/20 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Real-Time Tracking</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Direct live driver maps and digital status logs.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#113f36]/10 text-[#113f36] border border-[#113f36]/20 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Insured & Certified</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">100% safe domestic UAE carrier warranty coverage.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#113f36]/10 text-[#113f36] border border-[#113f36]/20 flex items-center justify-center shrink-0">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">All UAE Emirates</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Complete logistics coverage in Dubai, Abu Dhabi, Sharjah.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#113f36]/10 text-[#113f36] border border-[#113f36]/20 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">98.5% On-Time Rates</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">UAE-wide SLA achievement in domestic routing.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-3.5 bg-[#113f36] hover:bg-[#0d3029] text-white rounded-full font-black text-[12px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <span>Explore Our Platform</span>
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Right Column: Dynamic layout cards */}
            <div className="lg:col-span-6 grid grid-cols-12 gap-4 h-full items-stretch">
              
              {/* Large top card (Warehouse Photo) */}
              <div className="col-span-12 rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm h-[260px]">
                <img src={sectorContainer} alt="Modern warehouse" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>

              {/* Bottom row: full width image card */}
              <div className="col-span-12 rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm h-[190px]">
                <img src={heroTruck} alt="Logistics delivery truck" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>

            </div>

          </div>
        </div>
      </section>


      {/* SOLUTIONS/ESTIMATOR SECTION - Full Width */}
      <section id="solutions" className="w-full py-24 bg-[#060B26] text-white relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 relative z-10 text-center">
          <span className="px-4.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#6d8c55] text-[11px] font-black uppercase tracking-widest inline-block">
            {content.estimatorBadge}
          </span>
          <h2 className="text-3xl md:text-[2.60rem] font-black uppercase tracking-tight max-w-2xl mx-auto leading-none">
            {content.estimatorTitle}
          </h2>
          <p className="text-slate-400 font-medium text-xs md:text-sm max-w-xl mx-auto">
            {content.estimatorDesc}
          </p>

          <div className="w-full max-w-3xl mx-auto bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-md text-start">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-350 font-black block mb-2">{content.pricingSource}</label>
                <select 
                  value={estSource}
                  onChange={(e) => setEstSource(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-semibold text-white focus:border-[#113f36] outline-none transition-all cursor-pointer"
                >
                  <option value="DXB" className="bg-[#060B26] text-white">Dubai Hub (DXB)</option>
                  <option value="AUH" className="bg-[#060B26] text-white">Abu Dhabi Terminal (AUH)</option>
                  <option value="SHJ" className="bg-[#060B26] text-white">Sharjah Center (SHJ)</option>
                  <option value="AJM" className="bg-[#060B26] text-white">Ajman Dispatch (AJM)</option>
                  <option value="AAN" className="bg-[#060B26] text-white">Al Ain hub (AAN)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-350 font-black block mb-2">{content.pricingTarget}</label>
                <select 
                  value={estTarget}
                  onChange={(e) => setEstTarget(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-semibold text-white focus:border-[#113f36] outline-none transition-all cursor-pointer"
                >
                  <option value="DXB" className="bg-[#060B26] text-white">Dubai Hub (DXB)</option>
                  <option value="AUH" className="bg-[#060B26] text-white">Abu Dhabi Terminal (AUH)</option>
                  <option value="SHJ" className="bg-[#060B26] text-white">Sharjah Center (SHJ)</option>
                  <option value="AJM" className="bg-[#060B26] text-white">Ajman Dispatch (AJM)</option>
                  <option value="RAK" className="bg-[#060B26] text-white">Ras Al Khaimah Terminal (RAK)</option>
                  <option value="FUJ" className="bg-[#060B26] text-white">Fujairah hub (FUJ)</option>
                  <option value="AAN" className="bg-[#060B26] text-white">Al Ain Hub (AAN)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-350 font-black block mb-2">{content.pricingWeight}</label>
                <input 
                  type="number"
                  value={estWeight}
                  onChange={(e) => setEstWeight(Number(e.target.value))}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-semibold text-white focus:border-[#113f36] outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-350 font-black block mb-2">{content.pricingWidth}</label>
                <input 
                  type="number"
                  value={estWidth}
                  onChange={(e) => setEstWidth(Number(e.target.value))}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-semibold text-white focus:border-[#113f36] outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-350 font-black block mb-2">{content.pricingLength}</label>
                <input 
                  type="number"
                  value={estLength}
                  onChange={(e) => setEstLength(Number(e.target.value))}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-semibold text-white focus:border-[#113f36] outline-none transition-all"
                />
              </div>
            </div>

            <button 
              onClick={() => {
                setCalculating(true);
                setTimeout(() => {
                  setCalculating(false);
                  const isInterEmirate = estSource !== estTarget;
                  const baseVal = isInterEmirate ? 25 : 15;
                  const weightSur = estWeight * 1.5;
                  const volSur = ((estWidth * estLength) / 5000) * 1.0;
                  setEstimateResult({
                    calculated: true,
                    basePrice: baseVal,
                    weightSurcharge: weightSur,
                    volumeSurcharge: volSur,
                    totalPrice: baseVal + weightSur + volSur,
                    duration: isInterEmirate ? '24-48 Hours Express Transit' : '2-4 Hours Local Messenger Delivery',
                    routeType: isInterEmirate ? 'Express Road' : 'Local Messenger'
                  });
                }, 1200);
              }}
              className="w-full h-13 bg-[#113f36] hover:bg-[#0d3029] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md mt-8 flex items-center justify-center gap-2 cursor-pointer"
            >
              {calculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating Corridor Tariff...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>{content.pricingEstimateBtn}</span>
                </>
              )}
            </button>

            <AnimatePresence>
              {estimateResult && !calculating && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 text-white"
                >
                  <div className="space-y-3">
                    <span className="text-[11px] font-black uppercase text-[#6d8c55] tracking-wider">Calculated Results</span>
                    <h4 className="text-2xl font-black">{estimateResult.totalPrice.toFixed(2)} AED</h4>
                    <p className="text-xs font-bold text-slate-450">{estimateResult.duration}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] font-semibold text-slate-300 space-y-2">
                    <div className="flex justify-between"><span>Base Rate:</span><span>{estimateResult.basePrice} AED</span></div>
                    <div className="flex justify-between"><span>Weight Surcharge:</span><span>{estimateResult.weightSurcharge.toFixed(2)} AED</span></div>
                    <div className="flex justify-between"><span>Volume Metric Charge:</span><span>{estimateResult.volumeSurcharge.toFixed(2)} AED</span></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>




        {/* FAQ ACCORDION SECTION - Full Width */}
        <section id="faq" className="w-full py-24 bg-[#FAFBFD] relative border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 space-y-12">
            <div className="text-center space-y-4">
              <span className="px-4.5 py-1.5 rounded-full bg-[#113f36]/10 text-[#113f36] text-[11px] font-black uppercase tracking-widest inline-block">
                {content.faqBadge}
              </span>
              <h2 className="text-3xl md:text-[2.6rem] font-black uppercase text-slate-900 tracking-tight leading-none">
                {content.faqTitle}
              </h2>
            </div>

            <div className="space-y-4">
              {[
                { q: content.faq1Q, a: content.faq1A },
                { q: content.faq2Q, a: content.faq2A },
                { q: content.faq3Q, a: content.faq3A },
                { q: content.faq4Q, a: content.faq4A }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs transition-all duration-300"
                >
                  <button 
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full p-6 text-start flex items-center justify-between gap-4 focus:outline-hidden cursor-pointer"
                  >
                    <span className="font-extrabold text-[13px] md:text-sm text-slate-900 tracking-tight">{item.q}</span>
                    <span className={`w-6 h-6 rounded-full bg-[#113f36]/10 text-[#113f36] flex items-center justify-center shrink-0 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                  </button>
                  <AnimatePresence>
                    {activeFaq === idx && (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-xs md:text-[13px] text-slate-500 font-medium leading-relaxed border-t border-slate-50 pt-4">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

              <Footer onNavigate={onNavigate} setLoginRole={setLoginRole} setLoginEmail={setLoginEmail} setLoginModalOpen={setLoginModalOpen} content={content} />

      {/* FLOAT CHATBOT DIALOGUE - USend AI */}
      <AnimatePresence>
        {botOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`fixed bottom-24 ${isRTL ? 'left-4 md:left-8' : 'right-4 md:right-8'} z-50 w-[330px] md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col`}
          >
             {/* Header */}
             <div className="bg-slate-900 p-5 text-white flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#113f36]/10 flex items-center justify-center border border-[#113f36]/20 text-[#113f36] animate-bounce">
                    <AiFace3DIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs uppercase tracking-wide font-sans">{isRTL ? 'يو سند الدعم الفني' : 'USend AI Support'}</h3>
                    <p className="text-[12px] text-cyan-400 font-bold uppercase tracking-widest font-mono">{isRTL ? 'الحالة: نشط' : 'Status: active'}</p>
                  </div>
                </div>
                <button onClick={() => setBotOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors text-slate-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
             </div>
             
             {/* Chat Messages */}
             <div className="flex-1 p-5 max-h-[300px] overflow-y-auto bg-slate-50 space-y-4">
               {botMessages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div 
                     className={`p-3.5 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed ${
                       msg.sender === 'user' 
                         ? 'bg-[#113f36] text-white rounded-br-none' 
                         : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                     }`}
                     style={{ whiteSpace: 'pre-line' }}
                   >
                     {msg.text}
                   </div>
                 </div>
               ))}
             </div>

             {/* Input form */}
             <form onSubmit={handleBotSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input 
                  type="text" 
                  value={botInput}
                  onChange={(e) => setBotInput(e.target.value)}
                  placeholder="Enter order REQ-... or ask standard rates"
                  className="flex-1 outline-none text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-[#113f36] transition-all font-semibold"
                />
                <button type="submit" className="w-11 h-11 bg-slate-900 hover:bg-[#113f36] text-white rounded-xl flex items-center justify-center shadow-lg transition-colors shrink-0">
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
             </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Buttons layout */}
      <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-40 flex items-center gap-3`}>
        
        {/* Toggle bot button */}
        <button
          onClick={() => setBotOpen(!botOpen)}
          className="px-5 py-3 rounded-full bg-slate-900 hover:bg-[#113f36] text-white border border-slate-700 shadow-xl items-center gap-2.5 transition-all text-[13px] font-black uppercase tracking-widest flex hover:-translate-y-0.5 active:translate-y-0 select-none cursor-pointer"
          id="docked-bot-trigger"
        >
          <AiFace3DIcon className="w-6 h-6 text-[#6d8c55] rotate-12" />
        </button>

        {/* Back To Top Button */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md text-slate-850 flex items-center justify-center hover:bg-[#113f36] hover:text-white transition-all select-none cursor-pointer"
              title="Back To Top"
              id="back-to-top-btn"
            >
              <ArrowUp className="w-4.5 h-4.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
        defaultRole={loginRole} 
        onNavigate={onNavigate} 
      />
    </div>
  );
};

export default LandingPage;