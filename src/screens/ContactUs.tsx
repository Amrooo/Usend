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
import SmartChatbot from '../components/SmartChatbot';
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
  <img src="/src/assets/ai.png" alt="AI Chatbot" className={`object-contain ${className}`} />
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
    copyright: '© 2026 USEND LOGISTICS TECHNOLOGIES. REGULATION COMPLIANT IN UAE.',
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

const ContactUs = ({ onNavigate }: LandingPageProps) => {
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
      image: heroTruck,
      titleEn: 'We Are Here To Help',
      titleAr: 'نحن هنا لمساعدتك',
      descEn: 'Our support team is available 24/7 to answer your inquiries and resolve any issues.',
      descAr: 'فريق الدعم لدينا متاح على مدار الساعة للإجابة على استفساراتك وحل أي مشكلات.',
    },
    {
      type: 'image',
      image: sectorContainer,
      titleEn: 'Global Support Network',
      titleAr: 'شبكة دعم عالمية',
      descEn: 'Reach out to our experts across various logistics sectors.',
      descAr: 'تواصل مع خبرائنا في مختلف القطاعات اللوجستية.',
    },
    {
      type: 'image',
      image: shipmentImg,
      titleEn: 'Track & Resolve',
      titleAr: 'تتبع وحل',
      descEn: 'Need help with a specific shipment? Contact our dedicated tracking support.',
      descAr: 'هل تحتاج إلى مساعدة في شحنة معينة؟ اتصل بدعم التتبع المخصص لدينا.',
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlideIdx(prev => (prev + 1) % heroSlides.length);
    }, 7500);
    return () => clearInterval(interval);
  }, []);

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
        <div className="relative w-full h-[400px] md:h-[500px] rounded-[2rem] overflow-hidden shadow-sm flex flex-col items-center justify-center text-center">
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
                alt="Contact Support"
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
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/60 to-slate-900/40 pointer-events-none"></div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-24 z-10 max-w-5xl pt-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroSlideIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="text-center md:text-start"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white mb-6 drop-shadow-lg leading-tight">
                  {isRTL ? heroSlides[heroSlideIdx].titleAr : heroSlides[heroSlideIdx].titleEn}
                </h1>
                <p className="text-lg text-slate-200 md:max-w-2xl font-medium leading-relaxed drop-shadow-md">
                  {isRTL ? heroSlides[heroSlideIdx].descAr : heroSlides[heroSlideIdx].descEn}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Slider Dots */}
            <div className="absolute bottom-10 left-6 md:left-24 flex items-center justify-center md:justify-start w-full md:w-auto gap-2 z-20">
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
      </div>

      <div className="w-full relative z-10 bg-white px-6 md:px-16 py-16 flex flex-col items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl text-start">
          <div className="flex flex-col gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#113f36]/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#113f36]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{isRTL ? 'المقر الرئيسي' : 'Headquarters'}</h3>
              </div>
              <p className="text-slate-600 mb-3 font-medium flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                Dubai Silicon Oasis, UAE
              </p>
              <p className="text-slate-600 mb-3 font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                +971 4 123 4567
              </p>
              <p className="text-slate-600 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                support@usend.com
              </p>
            </div>
            
            <div className="bg-[#113f36] text-white p-8 rounded-3xl shadow-sm flex-1 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <Globe2 className="w-40 h-40" />
              </div>
              <h3 className="text-xl font-bold mb-4">{isRTL ? 'ساعات العمل' : 'Support Hours'}</h3>
              <p className="mb-2 text-white/80">{isRTL ? 'نحن متاحون لخدمتكم' : 'We are available to serve you'}</p>
              <ul className="space-y-2 mt-4 font-medium">
                <li className="flex justify-between border-b border-white/20 pb-2">
                  <span>{isRTL ? 'الاثنين - الجمعة' : 'Monday - Friday'}</span>
                  <span>9:00 AM - 6:00 PM</span>
                </li>
                <li className="flex justify-between border-b border-white/20 pb-2">
                  <span>{isRTL ? 'السبت' : 'Saturday'}</span>
                  <span>10:00 AM - 4:00 PM</span>
                </li>
                <li className="flex justify-between pb-2">
                  <span>{isRTL ? 'الأحد' : 'Sunday'}</span>
                  <span>{isRTL ? 'مغلق' : 'Closed'}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col">
            <h3 className="text-xl font-bold mb-6 text-slate-900">{isRTL ? 'أرسل رسالة' : 'Send a Message'}</h3>
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{isRTL ? 'الاسم الكامل' : 'Full Name'}</label>
                <input type="text" placeholder={isRTL ? 'الاسم' : 'Name'} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#113f36] bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</label>
                <input type="email" placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#113f36] bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{isRTL ? 'الموضوع' : 'Subject'}</label>
                <select className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#113f36] bg-white text-slate-600 transition-all">
                  <option value="">{isRTL ? 'اختر الموضوع' : 'Select a topic'}</option>
                  <option value="tracking">{isRTL ? 'تتبع الشحنة' : 'Shipment Tracking'}</option>
                  <option value="billing">{isRTL ? 'الفواتير' : 'Billing Inquiry'}</option>
                  <option value="partnership">{isRTL ? 'الشراكة' : 'Partnership'}</option>
                  <option value="other">{isRTL ? 'أخرى' : 'Other'}</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-1">{isRTL ? 'الرسالة' : 'Message'}</label>
                <textarea rows={4} placeholder={isRTL ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?'} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#113f36] bg-white transition-all resize-none"></textarea>
              </div>
            </div>
            <button className="w-full mt-6 py-4 bg-[#113f36] hover:bg-[#0d3029] text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2">
              {isRTL ? 'إرسال الرسالة' : 'Submit Message'}
            </button>
          </div>
        </div>
      </div>
<footer className="w-full bg-white text-slate-900 pt-24 pb-16 px-4 md:px-8 border-t border-slate-200 relative overflow-hidden">
          {/* Large transparent watermark background logo */}
          <div className="absolute inset-x-0 bottom-4 text-center select-none pointer-events-none z-0">
            <span className="text-[15vw] font-black tracking-widest text-slate-900/[0.03] uppercase leading-none block font-sans">
              {isRTL ? 'يوسند' : 'USEND'}
            </span>
          </div>

          <div className="max-w-7xl mx-auto space-y-16 relative z-10">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-start">
              
              <div className="space-y-6 md:col-span-2">
                <div className="flex items-center gap-3">
                  <LogoIcon className="h-12 w-auto" />
                  <div className="flex flex-col text-start">
                    <span className="text-sm font-black tracking-widest text-slate-900 uppercase leading-none">{isRTL ? 'يو سند' : 'USend'}</span>
                    <span className="text-[12px] font-bold uppercase text-slate-700 tracking-wider leading-none mt-1">{isRTL ? 'الشحن الذكي' : 'Smart Shipping'}</span>
                  </div>
                </div>
                <p className="text-[12px] text-slate-500 leading-relaxed max-w-md font-semibold font-sans">
                  {isRTL 
                    ? 'خدمات لوجستية ونقل متكاملة مبنية للشركات التي تطلب السرعة والدقة ومتابعة فورية لسلاسل الإمداد.' 
                    : 'Global logistics and transportation built for businesses that demand speed, precision, and real-time supply chain visibility.'}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[13px] font-black uppercase text-slate-800 tracking-widest font-sans">{isRTL ? 'بوابات المنظومة' : 'Connect Hubs'}</h4>
                <ul className="space-y-2 text-[13px] font-bold text-slate-600 font-sans">
                  <li>
                    <span 
                      className="hover:text-[#113f36] transition-colors cursor-pointer" 
                      onClick={() => {
                        setLoginRole('user');
                        setLoginEmail('user@usend.com');
                        setLoginModalOpen(true);
                      }}
                    >
                      {isRTL ? 'بوابة الأفراد' : 'Individual Terminal'}
                    </span>
                  </li>
                  <li>
                    <span 
                      className="hover:text-[#113f36] transition-colors cursor-pointer" 
                      onClick={() => {
                        setLoginRole('merchant');
                        setLoginEmail('merchant@usend.com');
                        setLoginModalOpen(true);
                      }}
                    >
                      {isRTL ? 'لوحة تحكم التجار' : 'Merchant Control Panel'}
                    </span>
                  </li>
                </ul>
              </div>



            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-slate-200 text-[13px] font-black text-slate-500 uppercase tracking-widest font-sans">
              <p>{content.copyright}</p>
              <div className="flex items-center gap-8">
                <a href="#" className="hover:text-[#113f36] transition-colors">{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
                <a href="#" className="hover:text-[#113f36] transition-colors">{isRTL ? 'شروط الخدمة' : 'Service Terms'}</a>
              </div>
            </div>

          </div>
        </footer>

      {/* Floating Buttons layout */}
      <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-40 flex items-center gap-3`}>
        <SmartChatbot isRTL={isRTL} />

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

export default ContactUs;