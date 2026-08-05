import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import React from 'react';
import { Screen } from '../types';
import { 
  ArrowRight, Globe2, ChevronDown, ArrowUp, Zap, Smartphone, Shield, 
  ChevronLeft, ChevronRight, XCircle, Truck, Package, Plane, Warehouse, 
  Bot, Star, Users, Calculator, Check, MapPin, Play, Plus, Building, 
  ArrowUpRight, Phone, Award, ShieldAlert, HelpCircle, Lock, Mail, Loader2, Anchor
} from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import LogoIcon from '../components/LogoIcon';
import LoginModal from '../components/LoginModal';
import OrderWizard from '../components/OrderWizard';

import heroTruck from '../assets/hero-truck.png';
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
    heroTitle: 'Unified Courier Hub\nFor E-Commerce',
    heroDesc: 'SwiftMove is a central hub connecting online merchants and users with last-mile couriers to deliver products and items seamlessly. Provide recipient details, designate item prices, and choose payment modes in one unified dashboard. Easily dispatch via sandbox channels like Aramex or use our active on-demand local drivers on the SwiftMove driver app.',
    btnDownloadApp: 'Download App',
    btnLearnMore: 'Get Pricing Estimate',
    aboutCaption: 'About SwiftMove Gateway',
    aboutTitle: 'Connect Online Shops & Custom API Dispatches to UAE Courier Networks.',
    aboutDesc: 'Enter receiver parameters, set the exact payment value you want to collect, and determine options for cash or card. Integrated services like Aramex automatically route jobs to external carriers, while other dispatches are handled immediately by local SwiftMove drivers using the Driver App.',
    aboutAchievement: '98.5% On-Time Delivery Across UAE Domestic Networks',
    statIndigenous: '15K+ Active Store Merchants',
    statTons: '5M+ Waybills Generated',
    statClients: '98%+ Courier SLA Met',
    servicesBadge: 'Unified Gateway',
    servicesTitle: 'One integration. Connected courier channels.',
    servicesDesc: 'From establishing customer delivery addresses and collecting custom cash payouts to on-demand driver dispatch, SwiftMove powers the complete logistics loop.',
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
    howStep2Desc: 'Choose the courier that fits. Selecting Aramex utilizes external sandbox tracking, and other options assign directly to the SwiftMove driver pool.',
    howStep3Num: '03',
    howStep3Title: 'On-Demand Local Driver Assignment',
    howStep3Desc: 'Private driver fleets accept pending SwiftMove orders via the Driver Companion App, initiating optimized navigation and live tracking.',
    howStep4Num: '04',
    howStep4Title: 'Instant COD Settlement',
    howStep4Desc: 'Cash-on-Delivery collections are automatically updated on your merchant ledger. Settle and withdraw payments straight to your bank account.',
    teamBadge: 'The Shipping Builders',
    teamTitle: 'Meet the Builders of Smart Logistics',
    teamDesc: 'Our success starts with our people. Meet the logistics engineers and software architects building the future of UAE e-commerce parcel routing.',
    teamSlogan: 'Skilled Experts in Logistics and E-Commerce Integration. Delivering GCC Domestic Excellence.',
    faqBadge: 'Common Questions',
    faqTitle: 'Frequently Answered Questions',
    faq1Q: 'How does SwiftMove integrate with my existing online store?',
    faq1A: 'We support one-click API integrations for WooCommerce, Shopify, Magento, and Wix. Once connected, orders are synced in real-time, allowing immediate waybill generation.',
    faq2Q: 'Do you support international parcel shipping?',
    faq2A: 'International shipping across GCC states (Riyadh, Doha, Bahrain, Muscat) and worldwide is currently under construction and is marked as "Coming Soon" with live trials launching next quarter.',
    faq3Q: 'How can I track my domestic shipping progress?',
    faq3A: 'Our system generates live tracking links for consumers. Or simply enter your order code starting with "REQ-" straight into our built-in Support Bot.',
    faq4Q: 'How do e-commerce cash on delivery (COD) payouts work?',
    faq4A: 'Our smart wallet tracks driver feedback instantly. Once the receiver confirms signature and pays, the amount is credited to your Merchant Wallet to withdraw anytime.',
    footerLead: 'Accelerate E-Commerce Deliveries & Settle Payments Instantly',
    footerLeadDesc: 'Link your store with our multi-courier aggregator and optimize your delivery operational speed.',
    copyright: '© 2026 SWIFTMOVE SYSTEMS (SHIPLIFIER GATEWAY AGENCY). REGULATION COMPLIANT IN UAE.',
    botGreeting: 'Hello! I am SwiftMove AI Assistant. Enter any Order Number (e.g., REQ-1001) to track your delivery, or ask about our e-commerce integrations.',
    smartSolutionsTitle: 'Smart Solutions',
    smartSolutionsForShipping: 'for Shipping',
    smartSolutionsDesc: 'SwiftMove offers shipping tools that simplify logistics for modern businesses',
    startNowBtn: 'Start Now',
    talkToSalesBtn: 'Talk to Sales',
    aboutUsCaption: 'About SwiftMove Gateway',
    aboutUsTitle: 'About Us',
    successRate: 'Success Rate In On-Time Product Delivery',
  },
  ar: {
    navServices: 'الخدمات',
    navPortals: 'بوابات المنظومة',
    navEstimator: 'حاسبة الشحن',
    navTeam: 'فريقنا',
    navFaq: 'الأسئلة الشائعة',
    adminAccess: 'بوابة الإدارة العامة',
    hubAccess: 'الوصول للمنصة',
    heroBadge: 'بوابة الشحن الموحدة للتجارة الإلكترونية وشبكة السائقين',
    heroTitle: 'منصة شحن متكاملة\nللتجارة الإلكترونية',
    heroDesc: 'سويفت موف هي منصة لوجستية مركزية لربط المتاجر والعملاء بالسائقين بهدف توصيل المنتجات والطرود من موقع لآخر بسلاسة وسهولة. حدد تفاصيل المستلم وسعر المنتج المراد تحصيله وخيارات الدفع المفضلة في واجهة موحدة. يمكنك توجيه الطلبات تلقائياً لأرامكس عبر سائقيهم، أو إسنادها فوراً لسائقين محليين عبر تطبيق السائق الخاص بسويفت موف.',
    btnDownloadApp: 'تحميل التطبيق',
    btnLearnMore: 'احصل على تسعيرة شحن',
    aboutCaption: 'لمحة عن منصة سويفت موف',
    aboutTitle: 'ربط لوجستي متكامل يجمع المتاجر والعملاء ومندوبي التوصيل بالإمارات.',
    aboutDesc: 'سجل بيانات المستلم، حدد السعر المطلوب تحصيله، واختر طريقة الدفع المفضلة. توفر لك المنصة خيارات توجيه ذكية لأرامكس (توصيل خارجي) أو إسناد ذكي مباشر لمندوبيك عبر تطبيق السائقين الخاص بنا.',
    aboutAchievement: 'ربط لوجستي بنسبة نجاح 98.5٪ في دولة الإمارات العربية المتحدة',
    statIndigenous: 'أكثر من ١٥ ألف متجر تجزئة نشط',
    statTons: 'أكثر من ٥ ملايين بوليصة شحن مطبوعة',
    statClients: 'معدل رضا يتجاوز ٩٨٪ من خدمات التوصيل للشركات',
    servicesBadge: 'الربط البرمجي الموحد',
    servicesTitle: 'تكامل تقني واحد. توجيه ذكي متعدد للمناديب.',
    servicesDesc: 'تحديد عناوين العملاء، تعيين أسعار الطرود المراد تحصيلها نقداً أو الكترونياً، وإسناد ذكي فوري لأسطول السائقين لتسوية مبيعاتك بسهولة.',
    portalsBadge: 'منظومة عصرية متكاملة',
    portalsTitle: 'منصات موحدة مخصصة لنمو تجارتك الإلكترونية',
    portalsDesc: 'احصل على وصول فوري ومباشر للبوابات المصممة للشركات، مندوبي التوصيل والعملاء، ومبرمجي المتاجر.',
    portalPersonalTitle: 'تتبع طلبات المستهلكين',
    portalPersonalDesc: 'هل لديك شحنة واردة؟ تتبع خط سير المندوب واستعرض تفاصيله على الخريطة مباشرة مع تحديثات ذكية.',
    portalPersonalBtn: 'افتح حساب المستهلك',
    portalBusinessTitle: 'لوحة تحكم الشركات والتجار',
    portalBusinessDesc: 'سجل شحنات متجرك، اطبع بوليصات الشحن الموحدة، تتبع عمليات التحصيل للدفع عند الاستلام وسدد أرباح المبيعات.',
    portalBusinessBtn: 'افتح مساحة عمل التاجر',
    portalCourierTitle: 'تطبيق مندوب التوصيل',
    portalCourierDesc: 'التطبيق المساعد للسائقين بالإمارات. تحسين المسارات، إثباتات التسليم الرقمية، وتسوية عوائد الدفع عند الاستلام فوراً.',
    portalCourierBtn: 'افتح واجهة السائق',
    portalAdminTitle: 'بوابة الإدارة العامة',
    portalAdminTitleDesc: 'نظرة عامة لمعدلات أداء شركات التوصيل، تتبع خرائط السائقين عبر GPS، تعديل النظام والتحكم الكامل في الدفاتر اللوجستية.',
    portalAdminBtn: 'افتح بوابة الإدارة',
    estimatorBadge: 'حاسبة الشحن التائديرية',
    estimatorTitle: 'قارن أسعار الشحن المحلي بالإمارات',
    estimatorDesc: 'حدد إمارات الاستلام والتسليم وقارن بين خيارات شركات الشحن المتعددة مع التكلفة التقديرية وسرعة الشحن المتوقعة.',
    pricingSource: 'إمارة الاستلام',
    pricingTarget: 'إمارة التسليم',
    pricingWeight: 'الوزن الإجمالي (كجم)',
    pricingWidth: 'العرض (سم)',
    pricingLength: 'الطول (سم)',
    pricingEstimateBtn: 'احسب وقارن عروض الأسعار الأكثر توفيراً',
    howBadge: 'عمليات لوجستية مؤتمتة في الإمارات',
    howTitle: 'مزامنة كاملة وتسوية فورية لأرباح مبيعاتك بدقة متناهية',
    howStep1Num: '٠١',
    howStep1Title: 'تحديد بيانات المستلم وسعر المنتج',
    howStep1Desc: 'أدخل معلومات العميل المندرج وموقع المستودع وموقع التسليم، بالإضافة لتحديد السعر ومطالب التحصيل المطلوبة.',
    howStep2Num: '٠٢',
    howStep2Title: 'اختيار مسار التوصيل المناسب',
    howStep2Desc: 'اختر أرامكس للاعتماد على أسطولهم وأنظمة التفتيش والتتبع الخاصة بهم بشكل مباشر، أو الخيارات الأخرى لإسناد سائق من أسطولك المحلي المباشر.',
    howStep3Num: '٠٣',
    howStep3Title: 'إسناد وتوصيل الطرود عبر السائقين',
    howStep3Desc: 'يقوم سائق طاقمك المحلي باستلام الطرد والتحرك الفوري باستخدام تطبيق السائق مع تقديم التتبع المباشر وإثبات التوصيل.',
    howStep4Num: '٠٤',
    howStep4Title: 'تسوية فورية لمدفوعات الاستلام (COD)',
    howStep4Desc: 'يتم تحديث مبالغ الدفع عند الاستلام تلقائياً في دفتر الأستاذ الخاص بك. قم بتسويتها وسحب الأرباح فوراً لحسابك البنكي.',
    teamBadge: 'بناة منظومة الشحن والتحكم',
    teamTitle: 'تعرف على الفريق المطور لشبكتنا الذكية',
    teamDesc: 'التميز الحقيقي يبدأ بالكوادر البشرية. تعرف على مهندسي الخدمات اللوجستية والبرمجيات اللذين يصنعون مستقبل فرز وتوصيل الطرود بالإمارات.',
    teamSlogan: 'خبراء متمرسون في اللوجستيات ودمج التجارة الإلكترونية، يضمنون أعلى مستويات الجودة محلياً وإقليمياً.',
    faqBadge: 'الأسئلة المتكررة',
    faqTitle: 'استفسارات وحلول لوجستية ذكية',
    faq1Q: 'كيف تتكامل منصة سويفت موف مع تجارتي الحالية؟',
    faq1A: 'نحن ندعم الربط التلقائي بضغطة زر لمنصات شوبيفاي، ووكومرس، ماجنتو، وويكس. بمجرد الربط، ستُسحب الطلبات وتُصدر بوليصات الشحن تلقائياً.',
    faq2Q: 'هل توفرون خيارات شحن دولي وعبر الحدود؟',
    faq2A: 'الشحن الدولي لدول مجلس التعاون الخليجي (الرياض، الدوحة، المنامة، مسقط) والعالم قيد التطوير ومدرج كـ "قريباً" مع إطلاق تجريبي في الربع القادم.',
    faq3Q: 'كيف أتتبع دقة توصيل طردي محلياً؟',
    faq3A: 'يُصدر نظامنا روابط تتبع حية للمستلم النهائي. أو ببساطة أدخل كود الطلب الذي يبدأ بـ "REQ-" مباشرة في مساعد سويفت موف الذكي للمحادثة.',
    faq4Q: 'كيف تتم تسوية مبالغ الدفع عند الاستلام (COD)؟',
    faq4A: 'تقوم محفظتنا الذكية برصد إفادات المندوب فور التوصيل الفعلي وتوقيع العميل، ليتم تقييد المبلغ تلقائياً في محفظة التاجر لسحبها في أي وقت.',
    footerLead: 'سرّع وتيرة شحن مبيعاتك وسدد الأموال فورياً دون انتظار',
    footerLeadDesc: 'اربط عمليات البيع والشحن بمستقبل لوجستياتنا الرقمية اليوم.',
    copyright: '© ٢٠٢٦ سويفت موف للشحن ومزامنة التجارة الإلكترونية. خاضعة للأنظمة المعتمدة بدولة الإمارات العربية المتحدة.',
    botGreeting: 'مرحباً! أنا مساعد سويفت موف الذكي للربط اللوجستي والتتبع. أدخل كود شحنتك (Req-1XXX) لمراجعة موقع الطرد.',
    smartSolutionsTitle: 'حلول ذكية لـ',
    smartSolutionsForShipping: 'عمليات الشحن',
    smartSolutionsDesc: 'تقدم شركة SwiftMove أدوات شحن تبسط العمليات اللوجستية للشركات الحديثة',
    startNowBtn: 'ابدأ الآن',
    talkToSalesBtn: 'تحدث إلى المبيعات',
    aboutUsCaption: 'حـول منصــة SwiftMove',
    aboutUsTitle: 'من نحن',
    successRate: 'نسبة النجاح في توصيل المنتجات في الوقت المحدد',
  }
};

const LandingPage = ({ onNavigate }: LandingPageProps) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { language, setLanguage, isRTL } = useLanguage();
  
  // Unified Login Modal State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<'merchant' | 'user' | 'driver' | 'admin'>('merchant');
  const [loginEmail, setLoginEmail] = useState('merchant@swiftmove.com');
  const [loginPassword, setLoginPassword] = useState('password');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Guest Order Modal State
  const [guestModalOpen, setGuestModalOpen] = useState(false);

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
      if (loginPassword === 'password') {
        console.warn("Demo Fallback applied. Auth error details: ", err);
        
        let targetRole = 'merchant';
        if (loginEmail.toLowerCase().includes('admin') || loginEmail.toLowerCase() === 'octman.sam@gmail.com') targetRole = 'admin';
        else if (loginEmail.toLowerCase().includes('driver') || loginEmail.toLowerCase().includes('user')) targetRole = 'user';
        
        setUser({
          uid: 'demo-fallback-uid',
          email: loginEmail,
          role: targetRole,
          name: 'Demo User',
        });
        
        setLoginModalOpen(false);
        onNavigate(redirectScreen);
      } else {
        setLoginError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const content = landingTranslations[language as 'en' | 'ar'] || landingTranslations.en;
  
  // Interactive Live Estimator states (UAE Domestic)
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

  // Parallax scroll trackers
  const { scrollY } = useScroll({
    target: targetRef,
    offset: ['start start', 'end start']
  });

  // Floating AI assist states
  const [botOpen, setBotOpen] = useState(false);
  const [botMessages, setBotMessages] = useState<{sender: 'bot'|'user', text: string}[]>([
    { sender: 'bot', text: content.botGreeting }
  ]);
  const [botInput, setBotInput] = useState('');

  const { activeRequests, signIn, setUser } = useApp();

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
        reply = `Status for ${orderNum}: \n\n• Current Location: Dubai Al Quoz Sorting Facility\n• Shipping Line: Aramex Express (Sandbox)\n• Expected Delivery: Next Business Day before 6:00 PM\n• Payout Mode: Cash on Delivery (320.00 AED)`;
      } else if (userMsg.toLowerCase().includes('rate') || userMsg.toLowerCase().includes('price') || userMsg.toLowerCase().includes('cost')) {
        reply = "Our standard UAE domestic rates:\n\n• Dubai to Abu Dhabi (Express Road): Starting at 25 AED base\n• Local messengers (Same Day): 15 AED flat rate\n• Extra Weight tariff: 1.5 AED per extra KG\n\nUse the Live Shipping Calculator on our home page to compare exact tariffs.";
      } else {
        reply = "Thanks for reaching out! I can track any 'REQ-' code in our UAE sandbox. Enter an order code or type 'rates' to see our current shipping prices.";
      }

      setBotMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 850);
  };

  useEffect(() => {
    const handleScroll = () => {
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
      className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#2563EB]/20 overflow-x-hidden relative flex flex-col w-full" 
      dir={isRTL ? "rtl" : "ltr"} 
      ref={targetRef}
    >
      
      {/* HERO SECTION - Sky Blue to Royal Blue Gradient Container (Matching mockup exactly) */}
      <div className="w-full relative bg-gradient-to-b from-[#2B6CB0] via-[#2563EB] to-[#1E3A8A] text-white rounded-b-[4.5rem] overflow-hidden pb-36 px-4 md:px-8 z-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40"></div>
        
        {/* HEADER MENU - Transparent Overlay matching mockup exactly */}
        <nav className="w-full bg-transparent text-white py-6 border-b border-white/10 z-50 relative">
          <div className="max-w-7xl mx-auto w-full px-4 md:px-8 flex items-center justify-between">
            
            {/* Left Brand Logo */}
            <div className="flex items-center cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <LogoIcon className="h-8 w-auto" variant="dark" />
              <span className="text-xl font-bold tracking-tight text-white font-sans ml-2">
                SwiftMove
              </span>
            </div>

            {/* Suffix Divider + Links */}
            <div className="hidden md:flex items-center">
              <div className="h-4 w-px bg-white/20 mx-6"></div>
              <div className="flex items-center gap-8 text-[13px] font-semibold text-white/80 font-sans">
                <a href="#landing-root" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white hover:text-[#2563EB] transition-colors">{isRTL ? 'الرئيسية' : 'Home'}</a>
                <a href="#services" onClick={(e) => handleScrollTo(e, 'services')} className="hover:text-[#2563EB] transition-colors">{isRTL ? 'الخدمات' : 'Services'}</a>
                <a href="#solutions" onClick={(e) => handleScrollTo(e, 'solutions')} className="hover:text-[#2563EB] transition-colors">{isRTL ? 'الحلول' : 'Solutions'}</a>
                <a href="#sectors" onClick={(e) => handleScrollTo(e, 'sectors')} className="hover:text-[#2563EB] transition-colors">{isRTL ? 'الشبكة' : 'Network'}</a>
                <a href="#about" onClick={(e) => handleScrollTo(e, 'about')} className="hover:text-[#2563EB] transition-colors">{isRTL ? 'من نحن' : 'About'}</a>
                <a href="#faq" onClick={(e) => handleScrollTo(e, 'faq')} className="hover:text-[#2563EB] transition-colors">{isRTL ? 'اتصل بنا' : 'Contact'}</a>
              </div>
            </div>

            {/* Right links: Track Shipment and Get a Quote */}
            <div className="flex items-center gap-6 text-[13px] font-semibold text-white/80 font-sans">
              <button 
                onClick={() => setBotOpen(true)}
                className="hover:text-[#2563EB] transition-colors cursor-pointer"
              >
                {isRTL ? 'تتبع الشحنة' : 'Track Shipment'}
              </button>
              <button 
                onClick={() => setGuestModalOpen(true)}
                className="px-5 py-2.5 rounded-lg bg-white text-[#2563EB] hover:bg-slate-100 font-bold transition-all duration-200 shadow-sm cursor-pointer"
              >
                {isRTL ? 'طلب تسعيرة' : 'Get a Quote'}
              </button>
            </div>

          </div>
        </nav>

        {/* Transparent Watermark Background Logo */}
        <div className="absolute inset-x-0 bottom-24 text-center select-none pointer-events-none z-0">
          <span className="text-[17vw] font-black tracking-widest text-white/[0.025] uppercase leading-none block font-sans">
            SWIFTMOVE
          </span>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10 space-y-8 pt-16">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.15] font-sans">
            {isRTL 
              ? 'حلول مخصصة لمتطلبات عملك — النقل البري والجوي والبحري موحد على منصة ذكية واحدة.' 
              : 'Tailored solutions for your business requirements — road, air, and ocean freight unified on a single intelligent platform.'}
          </h1>
          
          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => setGuestModalOpen(true)}
              className="px-8 py-4 bg-[#2563EB] hover:bg-blue-600 text-white text-[13px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <span>{isRTL ? 'ابدأ الشحن كضيف' : 'Start Shipping'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                setLoginRole('merchant');
                setLoginModalOpen(true);
              }}
              className="px-8 py-4 bg-white text-slate-900 hover:bg-slate-100 text-[13px] font-black uppercase tracking-widest rounded-full transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <span>{isRTL ? 'بوابة التاجر' : 'Merchant Portal'}</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>
          </div>

          {/* Overlapping Truck Image */}
          <div className="w-full max-w-5xl mx-auto pt-16 relative">
            <img 
              src={heroTruck} 
              alt="SwiftMove Cargo Delivery Truck" 
              className="w-full h-auto object-contain select-none filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.01] transition-transform duration-700"
            />
          </div>
        </div>
      </div>

      {/* TIMELINE SECTION (Directly Below Hero curved block) - Full Width */}
      <section className="w-full bg-white py-16 px-4 md:px-8 border-b border-slate-100 relative z-20 -mt-16">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] text-center mb-12">
            {isRTL ? 'حلول مخصصة لمتطلبات عملك' : 'TAILORED SOLUTIONS FOR YOUR BUSINESS REQUIREMENTS'}
          </p>
          
          {/* Horizontal Timeline */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute top-[18px] left-[12%] right-[12%] h-[1.5px] bg-slate-100 z-0"></div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
              {/* Node 1 */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-9 h-9 rounded-full bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center text-blue-600 font-bold z-10">
                  <span className="w-3 h-3 bg-[#2563EB] rounded-full"></span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">30k+</h3>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Shipments / year</p>
                  <p className="text-[11px] text-slate-400">Across all modes</p>
                </div>
              </div>

              {/* Node 2 */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-9 h-9 rounded-full bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center text-blue-600 font-bold z-10">
                  <span className="w-3 h-3 bg-[#2563EB] rounded-full"></span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">2.9k</h3>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active partners</p>
                  <p className="text-[11px] text-slate-400">Carrier network</p>
                </div>
              </div>

              {/* Node 3 */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-9 h-9 rounded-full bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center text-blue-600 font-bold z-10">
                  <span className="w-3 h-3 bg-[#2563EB] rounded-full"></span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">1,245</h3>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Shipments / year</p>
                  <p className="text-[11px] text-slate-400">Road, sea & air</p>
                </div>
              </div>

              {/* Node 4 */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-9 h-9 rounded-full bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center text-blue-600 font-bold z-10">
                  <span className="w-3 h-3 bg-[#2563EB] rounded-full"></span>
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

      {/* ALL SET FOR SEAMLESS TRANSPORTATION SECTION - Full Width */}
      <section id="services" className="w-full bg-white py-24 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Heading row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 text-left">
              <h2 className="text-3xl md:text-[2.6rem] font-black uppercase text-slate-950 tracking-tight leading-none font-sans">
                {isRTL ? 'جاهزون لجميع عمليات النقل السلسة' : 'ALL SET FOR SEAMLESS TRANSPORTATION'}
              </h2>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-5 py-2 bg-[#2563EB] text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-sm">
                  Road, Sea, Rail
                </span>
                <span className="px-5 py-2 bg-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-wider rounded-full hover:bg-slate-200 transition-all cursor-pointer">
                  Next-flight-out
                </span>
                <span className="px-5 py-2 bg-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-wider rounded-full hover:bg-slate-200 transition-all cursor-pointer">
                  FCL, LCL, Bulk
                </span>
              </div>
            </div>
            <div className="flex shrink-0">
              <button 
                onClick={() => setGuestModalOpen(true)}
                className="px-6 py-3 border border-slate-200 hover:border-slate-400 text-slate-800 hover:text-black rounded-full font-black text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all bg-white shadow-sm cursor-pointer"
              >
                <span>All Services</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Two-card layout grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Left Column: Image of container cargo ship */}
            <div className="rounded-[2rem] overflow-hidden shadow-md border border-slate-100 relative min-h-[360px] bg-slate-100">
              <img 
                src={ctaCargoShip} 
                alt="Global Freight Multimodal" 
                className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700"
              />
            </div>

            {/* Right Column: Soft lavender/blueish Card */}
            <div className="bg-[#F1F5F9] rounded-[2rem] border border-slate-100 p-8 md:p-12 flex flex-col justify-between shadow-sm text-left">
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
                  Global Freight Multimodal
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
                  Complete door-to-door solutions across every major corridor, seamlessly connecting road, rail, and ocean.
                </p>
                <ul className="space-y-4 pt-4 text-slate-700 font-semibold text-sm">
                  {[
                    'Dedicated account manager',
                    'Real-time shipment tracking',
                    'Full customs clearance support',
                    'Insurance included'
                  ].map((bullet, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => setGuestModalOpen(true)}
                  className="px-8 py-3.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-full font-black text-[12px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <span>Request a Quote</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Bottom 3-Card Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* Card 1 */}
            <div className="rounded-[2rem] overflow-hidden relative h-[240px] group cursor-pointer border border-slate-100 shadow-sm" onClick={() => setGuestModalOpen(true)}>
              <img src={sectorContainer} alt="Global Freight Multimodal" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
                <span className="text-sm font-black uppercase tracking-wider">Global Freight Multimodal</span>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"><ArrowUpRight className="w-4 h-4" /></div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-[2rem] overflow-hidden relative h-[240px] group cursor-pointer border border-slate-100 shadow-sm" onClick={() => setGuestModalOpen(true)}>
              <img src={ctaCargoShip} alt="Air Freight Express" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
                <span className="text-sm font-black uppercase tracking-wider">Air Freight Express</span>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"><ArrowUpRight className="w-4 h-4" /></div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-[2rem] overflow-hidden relative h-[240px] group cursor-pointer border border-slate-100 shadow-sm" onClick={() => setGuestModalOpen(true)}>
              <img src={heroTruck} alt="Ocean & Port Logistics" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
                <span className="text-sm font-black uppercase tracking-wider">Ocean & Port Logistics</span>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"><ArrowUpRight className="w-4 h-4" /></div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* BRAND TICKER MARQUEE - Vignette Slate Branding (Full Width) */}
      <section className="w-full py-12 bg-white border-b border-slate-100 flex flex-col items-center justify-center relative select-none overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
        <div className="flex items-center gap-16 animate-marquee whitespace-nowrap">
          {logos.concat(logos).map((logoItem, idx) => (
            <div key={idx} className="flex items-center gap-2 select-none shrink-0 opacity-55 hover:opacity-100 transition-opacity">
              <span className="text-slate-800 font-black text-[13px] uppercase tracking-widest">{logoItem.name}</span>
              <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full"></span>
            </div>
          ))}
        </div>
      </section>

      {/* TAILORED SOLUTIONS ABOUT BLOCK - Lavender rounded container - Full Width */}
      <section id="about" className="w-full py-24 bg-white px-4 md:px-8">
        <div className="max-w-7xl mx-auto bg-[#F8FAFC] border border-slate-100 rounded-[3rem] p-8 md:p-14 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: text content */}
            <div className="lg:col-span-6 text-left space-y-8">
              <p className="text-[11px] font-black uppercase text-[#2563EB] tracking-wider block">
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
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Real-Time Tracking</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Direct live driver maps and digital status logs.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Insured & Certified</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">100% safe domestic UAE carrier warranty coverage.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center shrink-0">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">All UAE Emirates</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">Complete logistics coverage in Dubai, Abu Dhabi, Sharjah.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center shrink-0">
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
                  onClick={() => setGuestModalOpen(true)}
                  className="px-8 py-3.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-full font-black text-[12px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <span>Explore Our Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: Dynamic layout cards */}
            <div className="lg:col-span-6 grid grid-cols-12 gap-4 h-full items-stretch">
              
              {/* Large top card (Warehouse Photo) */}
              <div className="col-span-12 rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm h-[260px]">
                <img src={sectorContainer} alt="Modern warehouse" className="w-full h-full object-cover" />
              </div>

              {/* Bottom row: left image card + right statistics card */}
              <div className="col-span-12 sm:col-span-6 rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm h-[190px]">
                <img src={heroTruck} alt="Logistics delivery truck" className="w-full h-full object-cover" />
              </div>

              <div className="col-span-12 sm:col-span-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white flex flex-col justify-between h-[190px] shadow-lg shadow-blue-500/15 text-left">
                <span className="text-[11px] font-black uppercase tracking-widest text-blue-200">System Accuracy</span>
                <div className="space-y-2">
                  <p className="text-5xl font-black tracking-tight">97.6%</p>
                  <p className="text-[11px] uppercase tracking-wider text-slate-200 font-extrabold">On-Time Delivery</p>
                  {/* Progress Bar */}
                  <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: '97.6%' }} />
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* END-TO-END LOGISTICS SOLUTIONS SECTION - 4 Card Grid - Full Width */}
      <section className="w-full bg-[#FAFBFD] py-24 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 text-left">
              <h2 className="text-3xl md:text-[2.6rem] font-black uppercase text-slate-950 tracking-tight leading-none font-sans">
                END-TO-END LOGISTICS SOLUTIONS
              </h2>
            </div>
            <div className="flex shrink-0">
              <button 
                onClick={() => setGuestModalOpen(true)}
                className="px-6 py-3 bg-[#2563EB] hover:bg-blue-600 text-white rounded-full font-black text-[11px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>All Services</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4 Cards Grid (2x2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            
            {/* Card 1 */}
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-[2rem] p-8 flex flex-col justify-between h-[280px] shadow-xs text-left">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/25 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="px-4 py-1 rounded-full bg-slate-200/50 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                  FCL - LCL
                </span>
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-black text-slate-900">Road Freight</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Flexible and secure domestic transport solutions across all major corridors, from first-mile pickup to final delivery.
                </p>
              </div>
              <div className="pt-4">
                <button onClick={() => setGuestModalOpen(true)} className="px-4 py-2 border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-black rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all bg-white cursor-pointer">
                  Learn More <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-[2rem] p-8 flex flex-col justify-between h-[280px] shadow-xs text-left">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/25 flex items-center justify-center shrink-0">
                  <Anchor className="w-5 h-5" />
                </div>
                <span className="px-4 py-1 rounded-full bg-slate-200/50 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                  FCL - LCL
                </span>
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-black text-slate-900">Ocean Freight</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  FCL and LCL ocean freight from all major global ports, with custom handling and container loading.
                </p>
              </div>
              <div className="pt-4">
                <button onClick={() => setGuestModalOpen(true)} className="px-4 py-2 border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-black rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all bg-white cursor-pointer">
                  Learn More <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Card 3 (Highlighted) */}
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-[2rem] p-8 flex flex-col justify-between h-[280px] shadow-xs text-left">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/25 flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5" />
                </div>
                <span className="px-4 py-1 rounded-full bg-slate-200/50 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                  Express
                </span>
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-black text-slate-900">Air Freight</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Express and standard air cargo solutions across our global active networks, built for time-critical shipments.
                </p>
              </div>
              <div className="pt-4">
                <button onClick={() => setGuestModalOpen(true)} className="px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                  Learn More <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-[2rem] p-8 flex flex-col justify-between h-[280px] shadow-xs text-left">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/25 flex items-center justify-center shrink-0">
                  <Warehouse className="w-5 h-5" />
                </div>
                <span className="px-4 py-1 rounded-full bg-slate-200/50 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                  FCL - LCL
                </span>
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-black text-slate-900">Warehousing & Distribution</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Scalable 3PL fulfillment centers with automated inventory management and real-time visibility control.
                </p>
              </div>
              <div className="pt-4">
                <button onClick={() => setGuestModalOpen(true)} className="px-4 py-2 border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-black rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all bg-white cursor-pointer">
                  Learn More <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SERVING BUSINESSES ACROSS SECTORS - Full Width */}
      <section id="sectors" className="w-full bg-white py-24 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          {/* Suspended orange container layout container */}
          <div className="rounded-[3rem] overflow-hidden shadow-2xl relative min-h-[480px] flex items-center justify-end">
            
            {/* Background Image */}
            <div className="absolute inset-0 z-0 bg-slate-900">
              <img 
                src={sectorContainer} 
                alt="Serving Businesses Across Sectors" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/60 to-slate-950/90" />
            </div>

            {/* Sectors List Overlay Content on right */}
            <div className="relative z-10 max-w-lg mr-8 md:mr-16 p-8 text-white text-left space-y-6">
              <h2 className="text-3xl md:text-[2.6rem] font-black uppercase tracking-tight leading-none font-sans">
                {isRTL ? 'خدمة الشركات عبر مختلف القطاعات' : 'SERVING BUSINESSES ACROSS SECTORS'}
              </h2>
              <p className="text-slate-300 font-medium leading-relaxed text-xs md:text-sm font-sans">
                From heavy manufacturing to high-velocity e-commerce, our logistics infrastructure adapts to the unique demands of every industry.
              </p>
              
              {/* Industry list with arrows */}
              <div className="divide-y divide-white/10 pt-4 text-xs md:text-sm font-bold font-sans">
                {[
                  'Manufacturing',
                  'Healthcare & Pharmaceuticals',
                  'Retail & E-Commerce',
                  'Manufacturing Technology',
                  'Automotive & Aerospace'
                ].map((sector, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between py-3 cursor-pointer hover:text-[#2563EB] transition-colors"
                    onClick={() => setGuestModalOpen(true)}
                  >
                    <span className="tracking-wide">{sector}</span>
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SOLUTIONS/ESTIMATOR SECTION - Full Width */}
      <section id="solutions" className="w-full py-24 bg-[#060B26] text-white relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 relative z-10 text-center">
          <span className="px-4.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-blue-400 text-[11px] font-black uppercase tracking-widest inline-block">
            {content.estimatorBadge}
          </span>
          <h2 className="text-3xl md:text-[2.60rem] font-black uppercase tracking-tight max-w-2xl mx-auto leading-none">
            {content.estimatorTitle}
          </h2>
          <p className="text-slate-400 font-medium text-xs md:text-sm max-w-xl mx-auto">
            {content.estimatorDesc}
          </p>

          <div className="w-full max-w-3xl mx-auto bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-md text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-350 font-black block mb-2">{content.pricingSource}</label>
                <select 
                  value={estSource}
                  onChange={(e) => setEstSource(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-semibold text-white focus:border-[#2563EB] outline-none transition-all cursor-pointer"
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
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-semibold text-white focus:border-[#2563EB] outline-none transition-all cursor-pointer"
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
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-semibold text-white focus:border-[#2563EB] outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-350 font-black block mb-2">{content.pricingWidth}</label>
                <input 
                  type="number"
                  value={estWidth}
                  onChange={(e) => setEstWidth(Number(e.target.value))}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-semibold text-white focus:border-[#2563EB] outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-350 font-black block mb-2">{content.pricingLength}</label>
                <input 
                  type="number"
                  value={estLength}
                  onChange={(e) => setEstLength(Number(e.target.value))}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-semibold text-white focus:border-[#2563EB] outline-none transition-all"
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
              className="w-full h-13 bg-[#2563EB] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md mt-8 flex items-center justify-center gap-2 cursor-pointer"
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
                    <span className="text-[11px] font-black uppercase text-blue-400 tracking-wider">Calculated Results</span>
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

      {/* TRUSTED BY THE WORLD'S BEST BRANDS Section - Full Width */}
      <section className="w-full bg-white py-24 px-4 md:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          <h2 className="text-3xl md:text-[2.6rem] font-black uppercase text-slate-950 tracking-tight leading-none">
            TRUSTED BY THE WORLD'S BEST BRANDS
          </h2>
          
          {/* 3-Column Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left pt-6">
            
            {/* Review 1 */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-orange-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-600 text-[13px] md:text-sm font-semibold leading-relaxed">
                  "SwiftMove has reduced our freight spend by 22% in the first quarter. Their real-time tracking platform is game-changing — our ops team can finally breathe easy."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  MC
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Marcus Chen</h4>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">VP Supply Chain, Oasis Distributors</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-orange-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-600 text-[13px] md:text-sm font-semibold leading-relaxed">
                  "Their API integration is the best we've seen. Parcel creation takes seconds now, and it scales with our volume without any hiccups."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  SR
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Sophia Reyes</h4>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Director of Operations, Apex Retail Group</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-orange-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-600 text-[13px] md:text-sm font-semibold leading-relaxed">
                  "Their customs clearance speed is unmatched. No more administrative delays or unexpected fees — just fast, reliable deliveries."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  DV
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Dmitri Volkov</h4>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">COO, EuroBridge Manufacturing</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* READY TO MOVE YOUR CARGO? - CTA Vessel Banner - Full Width */}
        <section className="w-full py-24 px-4 md:px-8 bg-white">
          <div className="max-w-7xl mx-auto rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl relative min-h-[420px] flex items-center justify-center text-center text-white bg-slate-900">
            {/* Ocean Vessel background image */}
            <div className="absolute inset-0 z-0">
              <img 
                src={ctaCargoShip} 
                alt="Ready to Move Your Cargo" 
                className="w-full h-full object-cover opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 space-y-6">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight max-w-3xl mx-auto leading-tight font-sans">
                {isRTL ? 'جاهز لنقل شحنتك؟' : 'READY TO MOVE\nYOUR CARGO?'}
              </h2>
              <p className="text-slate-350 font-medium leading-relaxed text-xs md:text-sm max-w-xl mx-auto font-sans">
                Get a custom freight quote in under 2 minutes. No commitments, no hidden fees — just fast, transparent pricing from a network that delivers.
              </p>
              <div className="pt-4">
                <button 
                  onClick={() => setGuestModalOpen(true)}
                  className="px-8 py-4 bg-[#2563EB] hover:bg-blue-600 text-white text-[13px] font-black uppercase tracking-widest rounded-full transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  {isRTL ? 'احصل على عرض سعر مجاني' : 'Get a Free Quote'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION - Full Width */}
        <section id="faq" className="w-full py-24 bg-[#FAFBFD] relative border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 space-y-12">
            <div className="text-center space-y-4">
              <span className="px-4.5 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-black uppercase tracking-widest inline-block">
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
                    className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-hidden cursor-pointer"
                  >
                    <span className="font-extrabold text-[13px] md:text-sm text-slate-900 tracking-tight">{item.q}</span>
                    <span className={`w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`}>
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

        {/* WATERMARK FOOTER SECTION - Full Width */}
        <footer className="w-full bg-[#060B26] text-white pt-24 pb-16 px-4 md:px-8 border-t border-white/5 relative overflow-hidden">
          {/* Large transparent watermark background logo */}
          <div className="absolute inset-x-0 bottom-4 text-center select-none pointer-events-none z-0">
            <span className="text-[15vw] font-black tracking-widest text-white/[0.015] uppercase leading-none block font-sans">
              SWIFTMOVE
            </span>
          </div>

          <div className="max-w-7xl mx-auto space-y-16 relative z-10">
            
            {/* Footer main banner */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-white/10">
              <div className="space-y-2 text-left">
                <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight">{content.footerLead}</h3>
                <p className="text-slate-400 text-xs md:text-sm font-semibold">{content.footerLeadDesc}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setGuestModalOpen(true)}
                  className="px-6 py-3.5 bg-white text-slate-950 text-[12px] font-black uppercase tracking-widest rounded-full hover:bg-[#2563EB] hover:text-white transition-all shadow-md cursor-pointer"
                >
                  Launch Platform
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
              
              <div className="space-y-6 md:col-span-2">
                <div className="flex items-center gap-3">
                  <LogoIcon className="h-10 w-auto" variant="dark" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black tracking-widest text-white uppercase leading-none">SwiftMove</span>
                    <span className="text-[12px] font-mono font-bold uppercase text-[#2563EB] tracking-[0.25em]">Smart Shipping</span>
                  </div>
                </div>
                <p className="text-[12px] text-slate-400 leading-relaxed max-w-md font-semibold font-sans">
                  Global logistics and transportation built for businesses that demand speed, precision, and real-time supply chain visibility.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[13px] font-black uppercase text-slate-500 tracking-widest font-sans">Connect Hubs</h4>
                <ul className="space-y-2 text-[13px] font-bold text-slate-350 font-sans">
                  <li>
                    <span 
                      className="hover:text-[#2563EB] transition-colors cursor-pointer" 
                      onClick={() => {
                        setLoginRole('user');
                        setLoginEmail('user@swiftmove.com');
                        setLoginModalOpen(true);
                      }}
                    >
                      Individual Terminal
                    </span>
                  </li>
                  <li>
                    <span 
                      className="hover:text-[#2563EB] transition-colors cursor-pointer" 
                      onClick={() => {
                        setLoginRole('merchant');
                        setLoginEmail('merchant@swiftmove.com');
                        setLoginModalOpen(true);
                      }}
                    >
                      Merchant Control Panel
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-[13px] font-black uppercase text-slate-500 tracking-widest font-sans">Corporate Parameters</h4>
                <ul className="space-y-2 text-[13px] font-bold text-slate-350 font-sans">
                  <li><span className="hover:text-[#2563EB] transition-colors cursor-pointer" onClick={() => { setLoginRole('admin'); setLoginModalOpen(true); }}>Zonal Admin Portal</span></li>
                  <li><a href="#" className="hover:text-[#2563EB] transition-colors">Safety Logs</a></li>
                  <li><a href="#" className="hover:text-[#2563EB] transition-colors">API Keys</a></li>
                </ul>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-white/10 text-[13px] font-black text-slate-500 uppercase tracking-widest font-sans">
              <p>{content.copyright}</p>
              <div className="flex items-center gap-8">
                <a href="#" className="hover:text-[#2563EB] transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-[#2563EB] transition-colors">Service Terms</a>
              </div>
            </div>

          </div>
        </footer>

      </div>

      {/* GUEST ORDER WIZARD MODAL */}
      <AnimatePresence>
        {guestModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <LogoIcon className="h-7 w-auto" variant="dark" />
                  <span className="text-sm font-black uppercase tracking-wider">SwiftMove Guest Dispatch</span>
                </div>
                <button onClick={() => setGuestModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 p-6 md:p-10 overflow-y-auto hide-scrollbar">
                <OrderWizard onNavigate={onNavigate} isGuest={true} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOAT CHATBOT DIALOGUE - SwiftMove AI */}
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
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-[#2563EB] animate-bounce">
                    <AiFace3DIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs uppercase tracking-wide font-sans">SwiftMove AI Support</h3>
                    <p className="text-[12px] text-cyan-400 font-bold uppercase tracking-widest font-mono">Status: active</p>
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
                         ? 'bg-[#2563EB] text-white rounded-br-none' 
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
                  className="flex-1 outline-none text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-[#2563EB] transition-all font-semibold"
                />
                <button type="submit" className="w-11 h-11 bg-slate-900 hover:bg-[#2563EB] text-white rounded-xl flex items-center justify-center shadow-lg transition-colors shrink-0">
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
          className="px-5 py-3 rounded-full bg-slate-900 hover:bg-[#2563EB] text-white border border-slate-700 shadow-xl items-center gap-2.5 transition-all text-[13px] font-black uppercase tracking-widest flex hover:-translate-y-0.5 active:translate-y-0 select-none cursor-pointer"
          id="docked-bot-trigger"
        >
          <AiFace3DIcon className="w-6 h-6 text-blue-400 rotate-12" />
        </button>

        {/* Back To Top Button */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md text-slate-850 flex items-center justify-center hover:bg-[#2563EB] hover:text-white transition-all select-none cursor-pointer"
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