import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import React from 'react';
import { Screen } from '../types';
import { 
  ArrowRight, Globe2, ChevronDown, ArrowUp, Zap, Smartphone, Shield, 
  ChevronLeft, ChevronRight, XCircle, Truck, Package, Plane, Warehouse, 
  Bot, Star, Users, Calculator, Check, MapPin, Play, Plus, Building, 
  ArrowUpRight, Phone, Award, ShieldAlert, HelpCircle, Lock, Mail, Loader2
} from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import LogoIcon from '../components/LogoIcon';
import shiomentImg from '../components/shioment.png';
import LoginModal from '../components/LoginModal';

import GuestOrderWidget from '../components/GuestOrderWidget';

// AeroLogoIcon renders the abstract geometric flight wings icon shown in the sample image
const AeroLogoIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M48 10L12 85L48 68V10Z" fill="url(#aero-grad-left)" />
    <path d="M52 10L88 85L52 68V10Z" fill="url(#aero-grad-right)" />
    <defs>
      <linearGradient id="aero-grad-left" x1="12" y1="85" x2="48" y2="10" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0B3BC2" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
      <linearGradient id="aero-grad-right" x1="88" y1="85" x2="52" y2="10" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#60A5FA" />
      </linearGradient>
    </defs>
  </svg>
);

// Partner Logistics Star/Star-symbol Logos matching the uploaded sample yellow banner
const MaerskLogo = () => (
  <div className="flex items-center gap-2 md:gap-2.5 select-none shrink-0" id="logo-maersk">
    <div className="w-8 h-8 md:w-9.5 md:h-9.5 bg-white/10 rounded-md flex items-center justify-center text-[#1452D1] shrink-0 shadow-sm">
      <svg className="w-5 h-5 md:w-6 md:h-6 fill-current" viewBox="0 0 24 24">
        {/* Precise symmetrical 8-pointed star */}
        <polygon points="12,2 14.1,8.3 20.3,6.2 16.2,11.3 21.8,14.7 15,14.7 16.2,21.5 12,17.2 7.8,21.5 9,14.7 2.2,14.7 7.8,11.3 3.7,6.2 9.9,8.3" />
      </svg>
    </div>
    <span className="font-sans font-black text-white text-base md:text-[21px] tracking-wider leading-none">MAERSK</span>
  </div>
);

const NextCarriersLogo = () => (
  <div className="flex items-center gap-1.5 text-white select-none font-sans shrink-0" id="logo-nextcarriers">
    <span className="text-[20px] md:text-[25px] font-extrabold italic tracking-tighter leading-none flex items-center">
      N
      <span className="inline-block transform -skew-x-12 mx-0.5">
        <svg className="w-4 h-5 md:w-5 md:h-6 fill-current pb-0.5" viewBox="0 0 16 24">
          <path d="M4,22 L4,10 L1,10 L8,2 L15,10 L12,10 L12,22 Z" />
        </svg>
      </span>
      C
    </span>
    <div className="flex flex-col text-left leading-[0.8] ml-1">
      <span className="text-[12px] md:text-[14px] font-black tracking-widest leading-none block">NEXT</span>
      <span className="text-[8.5px] md:text-[10px] font-black tracking-wider leading-none block opacity-85 mt-0.5">CARRIERS</span>
    </div>
  </div>
);

const FastShippingLogo = () => (
  <div className="flex flex-col items-center justify-center text-white select-none text-center shrink-0" id="logo-fastshipping">
    <div className="h-5 md:h-6 flex items-center justify-center">
      <svg className="w-12 h-5 md:w-14 md:h-5.5 fill-current" viewBox="0 0 60 22">
        <path d="M22,3 L36,3 C38,3 39,4 38,6 L33,12 L24,12 Z" />
        <path d="M8,14 L50,14 L54,10 L12,10 Z" />
        <path d="M4,17 L44,17 L41,19 L7,19 Z" fillOpacity="0.8" />
      </svg>
    </div>
    <span className="text-[11px] md:text-[12px] font-black tracking-widest block uppercase mt-0.5 leading-none">FAST SHIPPING</span>
    <span className="text-[6px] md:text-[7px] font-black tracking-[0.16em] block uppercase leading-none opacity-85 mt-0.5">COMPANY TAGLINE</span>
  </div>
);

const SilvaShippingLogo = () => (
  <div className="flex items-center text-white font-serif select-none relative pb-1.5 shrink-0" id="logo-silvashipping">
    <div className="flex items-baseline leading-none">
      <span className="text-[20px] md:text-[24px] font-black tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>SILVA</span>
      <span className="text-[12px] md:text-[14px] font-medium ml-1 tracking-tight" style={{ fontFamily: 'system-ui, sans-serif' }}>Shipping</span>
    </div>
    <div className="absolute bottom-[2px] left-0 right-0 h-[2px] bg-white/10" />
    <svg className="w-full h-1.5 absolute bottom-[-1px] left-0" viewBox="0 0 100 6" preserveAspectRatio="none">
      <path d="M0,2 Q50,6 100,2 L100,4 Q50,8 0,4 Z" fill="currentColor" />
    </svg>
  </div>
);

const FedExLogo = () => (
  <div className="flex items-center text-white font-sans tracking-tighter select-none font-black text-[22px] md:text-[26px] leading-none shrink-0" id="logo-fedex">
    <span className="font-extrabold -mr-[1px] tracking-tight text-white">Fed</span>
    <span className="font-extrabold -ml-[1px] tracking-tight text-white">Ex®</span>
  </div>
);

// High-fidelity 3D Holographic AI Cybernetic Face Icon
const AiFace3DIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <radialGradient id="ai-face-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
        <stop offset="60%" stopColor="#2563EB" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="ai-face-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    {/* Base 3D Orb Depth */}
    <circle cx="50" cy="50" r="45" fill="url(#ai-face-glow)" />
    <circle cx="50" cy="50" r="34" stroke="url(#ai-face-grad)" strokeWidth="2.5" className="animate-pulse" />
    
    {/* Metallic Digital Face Contour */}
    <path d="M35 48 C35 34, 65 34, 65 48 C65 60, 58 68, 50 72 C42 68, 35 60, 35 48 Z" stroke="url(#ai-face-grad)" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Depth Contours (3D face lines) */}
    <path d="M38 50 Q50 54 62 50" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <path d="M41 57 Q50 62 59 57" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M44 63 Q50 67 56 63" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

    {/* Sparkling Artificial Iris eyes */}
    <circle cx="43" cy="45" r="3.5" fill="#60A5FA" opacity="0.5" className="animate-ping" />
    <circle cx="43" cy="45" r="2.5" fill="#FFFFFF" />
    <circle cx="57" cy="45" r="3.5" fill="#60A5FA" opacity="0.5" className="animate-ping" />
    <circle cx="57" cy="45" r="2.5" fill="#FFFFFF" />

    {/* Neural central node line */}
    <path d="M50 34 V42" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
    <circle cx="50" cy="27" r="2.5" fill="#EC4899" />
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
    portalPersonalDesc: 'Got an incoming parcel? Dispatch localized messengers, view delivery coordinates, and communicate with delivery couriers live.',
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
    estimatorTitle: 'Unify UAE Shipping Quotations',
    estimatorDesc: 'Select pickup cities and destination hubs. Instantly compare multiple domestic couriers and see estimated transit speeds.',
    pricingSource: 'City of Origin',
    pricingTarget: 'Destination Hub',
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
    botGreeting: 'Hello! I am the Support Bot. Enter any Order Number (e.g., REQ-1001) to track your delivery, or ask about our e-commerce integrations.',  },  ar: {
    navServices: 'الخدمات',
    navPortals: 'بوابات المنظومة',
    navEstimator: 'حاسبة الشحن',
    navTeam: 'فريقنا',
    navFaq: 'الأسئلة الشائعة',
    adminAccess: 'بوابة الإدارة العامة',
    hubAccess: 'الوصول للمنصة',
    heroBadge: 'بوابة الشحن الموحدة للتجارة الإلكترونية وشبكة السائقين',
    heroTitle: 'منصة شحن متكاملة\nللتجارة الإلكترونية',
    heroDesc: 'يو إس إند هي منصة لوجستية مركزية لربط المتاجر والعملاء بالسائقين بهدف توصيل المنتجات والطرود من موقع لآخر بسلاسة وسهولة. حدد تفاصيل المستلم وسعر المنتج المراد تحصيله وخيارات الدفع المفضلة في واجهة موحدة. يمكنك توجيه الطلبات تلقائياً لأرامكس عبر سائقيهم، أو إسنادها فوراً لسائقين محليين عبر تطبيق السائق الخاص بيو إس إند.',
    btnDownloadApp: 'تحميل التطبيق',
    btnLearnMore: 'احصل على تسعيرة شحن',
    aboutCaption: 'لمحة عن منصة يو إس إند',
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
    estimatorBadge: 'حاسبة الشحن التقديرية',
    estimatorTitle: 'قارن أسعار الشحن المحلي بالإمارات',
    estimatorDesc: 'حدد مدن الاستلام والتسليم وقارن بين خيارات شركات الشحن المتعددة مع التكلفة التقديرية وسرعة الشحن المتوقعة.',
    pricingSource: 'مدينة الاستلام',
    pricingTarget: 'مدينة التسليم',
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
    faq1Q: 'كيف تتكامل منصة يو إس إند مع تجارتي الحالية؟',
    faq1A: 'نحن ندعم الربط التلقائي بضغطة زر لمنصات شوبيفاي، ووكومرس، ماجنتو، وويكس. بمجرد الربط، ستُسحب الطلبات وتُصدر بوليصات الشحن تلقائياً.',
    faq2Q: 'هل توفرون خيارات شحن دولي وعبر الحدود؟',
    faq2A: 'الشحن الدولي لدول مجلس التعاون الخليجي (الرياض، الدوحة، المنامة، مسقط) والعالم قيد التطوير ومدرج كـ "قريباً" مع إطلاق تجريبي في الربع القادم.',
    faq3Q: 'كيف أتتبع دقة توصيل طردي محلياً؟',
    faq3A: 'يُصدر نظامنا روابط تتبع حية للمستلم النهائي. أو ببساطة أدخل كود الطلب الذي يبدأ بـ "REQ-" مباشرة في مساعد يو إس إند الذكي للمحادثة.',
    faq4Q: 'كيف تتم تسوية مبالغ الدفع عند الاستلام (COD)؟',
    faq4A: 'تقوم محفظتنا الذكية برصد إفادات المندوب فور التوصيل الفعلي وتوقيع العميل، ليتم تقييد المبلغ تلقائياً في محفظة التاجر لسحبها في أي وقت.',
    footerLead: 'سرّع وتيرة شحن مبيعاتك وسدد الأموال فورياً دون انتظار',
    footerLeadDesc: 'اربط عمليات البيع والشحن بمستقبل لوجستياتنا الرقمية اليوم.',
    copyright: '© ٢٠٢٦ يو إس إند للشحن ومزامنة التجارة الإلكترونية. خاضعة للأنظمة المعتمدة بدولة الإمارات العربية المتحدة.',
    botGreeting: 'مرحباً! أنا مساعد يو إس إند الذكي للربط اللوجستي والتتبع. أدخل كود شحنتك (Req-1XXX) لمراجعة موقع الطرد.',
  }
};

const LandingPage = ({ onNavigate }: LandingPageProps) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const { language, setLanguage, isRTL } = useLanguage();
  
  // Unified Login Modal State
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<'merchant' | 'user' | 'driver' | 'admin'>('merchant');
  const [loginEmail, setLoginEmail] = useState('merchant@usend.com');
  const [loginPassword, setLoginPassword] = useState('password');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    let redirectScreen: Screen = 'merchant_dashboard';
    if (loginRole === 'user') redirectScreen = 'user_dashboard';
    else if (loginRole === 'driver') redirectScreen = 'driver_home';
    else if (loginRole === 'admin') redirectScreen = 'admin_dashboard';

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setLoginModalOpen(false);
      onNavigate(redirectScreen);
    } catch (err: any) {
      console.warn("Graceful Demo Fallback applied. Auth error details: ", err);
      setLoginModalOpen(false);
      onNavigate(redirectScreen);
    } finally {
      setLoginLoading(false);
    }
  };

  const content = landingTranslations[language as 'en' | 'ar'] || landingTranslations.en;
  
  // Interactive Live Estimator states
  const [estSource, setEstSource] = useState('DXB');
  const [estTarget, setEstTarget] = useState('RUH');
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

  // Derived subtle transform mappings for premium smooth scroll layers
  const heroTextY = useTransform(scrollY, [0, 800], [0, 160]);
  const bgGraphicY = useTransform(scrollY, [0, 1000], [0, 300]);
  const cardFloatY = useTransform(scrollY, [200, 1200], [35, -35]);
  const textFadeOpacity = useTransform(scrollY, [0, 350], [1, 0]);
  const aboutImageY = useTransform(scrollY, [200, 1400], [40, -40]);
  const aboutTextY = useTransform(scrollY, [200, 1400], [-20, 20]);
  const portalsY = useTransform(scrollY, [600, 2200], [30, -30]);
  const estimatorY = useTransform(scrollY, [1400, 3200], [40, -40]);

  // Floating AI assist states
  const [botOpen, setBotOpen] = useState(false);
  const [botMessages, setBotMessages] = useState<{sender: 'bot'|'user', text: string}[]>([
    { sender: 'bot', text: content.botGreeting }
  ]);
  const [botInput, setBotInput] = useState('');

  const { activeRequests, signIn } = useApp();

  const handleBotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botInput.trim()) return;

    const userMsg = botInput.trim();
    setBotMessages(m => [...m, { sender: 'user', text: userMsg }]);
    const query = userMsg.toLowerCase();
    setBotInput('');

    setTimeout(() => {
      // 1. Order Tracking
      if (query.toUpperCase().includes('REQ-')) {
        const orderId = query.toUpperCase().match(/REQ-\d+/)?.[0];
        const foundRequest = activeRequests.find(r => r.id === orderId);
        if (foundRequest) {
          const detailStr = language === 'en' 
            ? `Order Status [${foundRequest.id}]: Active. Consignee: ${foundRequest.customer || foundRequest.name}. Stage: ${foundRequest.status} heading to ${foundRequest.address || foundRequest.toDestination}. Vehicle dispatch: ${foundRequest.vehicle || 'Fleet Messenger'}. Estimated remaining time: ${foundRequest.etaTime || '45 minutes'}.`
            : `حالة شحنتك المرموز لها [${foundRequest.id}]: قيد النقل النشط. العميل المستلم: ${foundRequest.customer || foundRequest.name}. الشحنة الآن: ${foundRequest.status} متجهة نحو وجهة: ${foundRequest.address || foundRequest.toDestination}. المركبة المندوبة: ${foundRequest.vehicle || 'المندوب اللوجستي'}. الوقت المتبقي المقدر: ${foundRequest.etaTime || '٤٥ دقيقة'}.`;
          setBotMessages(m => [...m, { sender: 'bot', text: detailStr }]);
          return;
        } else {
          const errorMsg = language === 'en'
            ? `We registered your query for "${orderId}", but our active GCC router couldn't find a live sequence matching this exact ID. Please verify invoice files or contact merchant support.`
            : `قمنا بالبحث عن الرمز الوارد "${orderId}"، ولكن لم نعثر على شحنة قيد التشغيل بهذا المعرّف في الإقليم الموحد حالياً. يرجى مراجعة فاتورة الشراء وتأكيد الرمز.`;
          setBotMessages(m => [...m, { sender: 'bot', text: errorMsg }]);
          return;
        }
      }

      // 2. Services Knowledge Base
      const serviceKeywords = ['service', 'what do you do', 'provide', 'help', 'individual', 'merchant', 'business', 'track', 'wallet', 'delivery', 'طريقة', 'سعر', 'خدمات', 'كيف', 'شحن'];
      if (serviceKeywords.some(keyword => query.includes(keyword))) {
        let response = language === 'en'
          ? "USend provides high-scale logistical services in UAE networks:\n\n• Individual send courier: Quick point-to-point dispatch across UAE cities.\n• Enterprise Merchant: Bulk order uploads, fully synchronized COD wallet ledger, and developer APIs.\n• Fleet Tracking: Highly visual live maps linked with drivers.\n• Intelligent AI Routing & Support on-the-go.\n\nWhich portal or tool would you like to open?"
          : "شبكة مرسال توفر خدمات تشغيلية متكاملة بجميع موانئ دولة الإمارات:\n\n• إرسال الطرود الفردية: استدعاء فوري ومؤتمت للمناديب المحليين.\n• منصة الشركات والتجار: فواتير مجمعة، تحصيل المدفوعات والـ COD، وخطوط مبرمجة سريعة.\n• خرائط التتبع التفاعلية بمجرد الإطلاق.\n• تعويض وإيداع سريع للأموال.\n\nأي بوابة تشغيلية تود مراجعتها الآن؟";
        
        setBotMessages(m => [...m, { sender: 'bot', text: response }]);
        return;
      }

      // 3. Fallback
      const fallbackStr = language === 'en'
        ? "I can guide you on active shipping parameters, regional COD wallet systems, and track custom cargo indices. Simply type your shipment ID (e.g., REQ-1002) or ask 'What services do you provide?'"
        : "يمكنني مساعدتك في تتبع أي طرد نشط أو حساب تسعيرة تقريبية. يرجى كتابة رمز الطلب (مثل REQ-1001) أو طرح استفسارك بخصوص: 'ما الخدمات المتوفرة للتجار؟'";
      setBotMessages(m => [...m, { sender: 'bot', text: fallbackStr }]);
    }, 600);
  };

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setShowBackToTop(latest > 350);
    });
  }, [scrollY]);

  // Execute interactive estimate calculation
  const runSizerEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    setEstimateResult(null);

    setTimeout(() => {
      // Logic calculations
      const isInter = estSource !== estTarget && !(estSource === 'DXB' && estTarget === 'AUH') && !(estSource === 'AUH' && estTarget === 'DXB');
      const baseVal = isInter ? 85 : 18;
      const wSurcharge = Math.round(estWeight * 4.5);
      const vVol = Math.round((estWidth * estLength * 15) / 5000);
      const vSurcharge = Math.round(vVol * 0.82);
      const outputSum = baseVal + wSurcharge + vSurcharge;

      let category: 'Domestic Express' | 'Express Road' | 'Local Messenger' = 'Local Messenger';
      let durationStr = 'Same Day / within 4 Hours';

      if (isInter) {
        category = 'Express Road';
        durationStr = 'Coming Soon (GCC Trials next quarter)';
      } else {
        category = estWeight > 15 ? 'Express Road' : 'Domestic Express';
        durationStr = estWeight > 15 ? 'Next Day Priority' : 'Express 2-3 Hours';
      }

      setEstimateResult({
        calculated: true,
        basePrice: baseVal,
        weightSurcharge: wSurcharge,
        volumeSurcharge: vSurcharge,
        totalPrice: outputSum,
        duration: durationStr,
        routeType: category
      });
      setCalculating(false);
    }, 700);
  };

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
      className="min-h-screen bg-gradient-to-b from-[#DBEAFE] via-[#EFF6FF] to-white text-slate-900 font-sans selection:bg-[#1452D1]/20 overflow-x-hidden relative" 
      dir={isRTL ? "rtl" : "ltr"} 
      ref={targetRef}
    >
      
      {/* Pristine elegant standard viewport flow (no extra nested scroll restraints) */}
      <div className="w-full relative overflow-hidden flex flex-col min-h-screen bg-gradient-to-b from-[#EFF6FF] via-white via-[250px] to-white">
        
        {/* Decorative Fluid Gradients behind page for premium Parallax depth */}
        <div className="absolute top-0 inset-x-0 h-[1000px] overflow-hidden pointer-events-none z-0">
          <motion.div 
            style={{ y: bgGraphicY }}
            className="absolute -top-[20%] left-[10%] w-[55%] h-[60%] bg-[radial-gradient(circle,rgba(20,82,209,0.07)_0%,transparent_70%)] blur-[110px]"
          />
          <motion.div 
            style={{ y: useTransform(scrollY, [0, 800], [0, 100]) }}
            className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle,rgba(20,82,209,0.05)_0%,transparent_65%)] blur-[90px]"
          />
          
          {/* Fine dotted design grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.012)_1px,transparent_1px)] bg-[size:40px_40px] opacity-60"></div>
        </div>
 

        {/* TOP HEADER - Styled exactly like sample image */}
        <nav 
          className="w-full z-[100] border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 transition-all duration-300 shadow-xs"
        >
          <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-4 flex items-center justify-between">
            {/* Logo Brand Label: USend */}
            <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => onNavigate('landing_page')}>
              <LogoIcon className="h-[46px] lg:h-[52px] w-auto" />
            </div>
            
            {/* Mid links for easy jump on landing, perfectly mimicking menu */}
            <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-500 font-sans">
              <a href="#landing-root" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-slate-950 font-bold hover:text-[#1452D1] transition-colors">{isRTL ? 'الرئيسية' : 'Home'}</a>
              <a href="#about" onClick={(e) => handleScrollTo(e, 'about')} className="hover:text-[#1452D1] transition-colors">{isRTL ? 'من نحن' : 'About us'}</a>
              <a href="#estimator" onClick={(e) => handleScrollTo(e, 'estimator')} className="hover:text-[#1452D1] transition-colors">{isRTL ? 'الحاسبة' : 'Estimator'}</a>
              
              {/* Interactive Page drop-down link */}
              <div className="relative">
                <button 
                  onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
                  onMouseEnter={() => setPageDropdownOpen(true)}
                  className="hover:text-[#1452D1] flex items-center gap-1 transition-colors focus:outline-hidden font-medium"
                >
                  <span>{isRTL ? 'المنصات' : 'Ecosystems'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <AnimatePresence>
                  {pageDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      onMouseLeave={() => setPageDropdownOpen(false)}
                      className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-full mt-3.5 w-60 rounded-2xl bg-white border border-slate-150/70 p-2.5 shadow-xl z-[150] space-y-1`}
                    >
                      {[
                        { l: 'Individual Send Portal', s: 'user_dashboard', r: 'user' },
                        { l: 'Merchant Dashboard Core', s: 'merchant_dashboard', r: 'merchant' },
                        { l: 'Direct Hub Dispatcher', s: 'hub', r: 'merchant' }
                      ].map((item, id) => (
                        <button 
                          key={id}
                          onClick={() => {
                            setPageDropdownOpen(false);
                            setLoginRole(item.r as any);
                            setLoginModalOpen(true);
                          }}
                          className="w-full text-left font-sans font-bold text-[10.5px] uppercase tracking-wider text-slate-600 hover:text-[#1452D1] hover:bg-[#1452D1]/5 p-2.5 rounded-xl transition-all block"
                        >
                          {item.l}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right side Language & Contact CTA */}
            <div className="flex items-center gap-3">
              {/* Subtle Language Toggle with Planet Flag */}
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="w-10 h-10 rounded-full bg-[#FAFAFA] flex items-center justify-center text-zinc-900 hover:bg-zinc-150 transition-all border border-zinc-200/50"
              >
                <Globe2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  onNavigate('hub');
                }}
                className="px-5.5 py-2.5 rounded-full bg-[#1452D1] hover:bg-blue-600 text-white text-[12px] font-bold tracking-wide transition-all duration-200 shadow-sm"
                id="header-signin-btn"
              >
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            </div>
          </div>
        </nav>

        {/* HERO HERO HERO SECTION - Stacked layout exactly as reference image */}
        <header className="relative pt-16 sm:pt-20 pb-16 px-4 md:px-8 max-w-7xl mx-auto z-10 w-full flex flex-col items-center">
          
          {/* Centered stack content with parallax scroll */}
          <motion.div style={{ y: heroTextY, opacity: textFadeOpacity }} className="text-center max-w-4xl mx-auto space-y-6 flex flex-col items-center">
            
            {/* Elegant Brand Logo placed precisely above heading with nice brand-aligned dropshadow */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-1"
            >
              <LogoIcon className="h-16 sm:h-20 md:h-24 w-auto transform hover:scale-105 transition-transform duration-300 filter drop-shadow-[0_10px_20px_rgba(20,82,209,0.15)]" />
            </motion.div>

            <h1 className="text-[2.6rem] sm:text-[3.9rem] md:text-[4.5rem] font-bold text-slate-900 tracking-tight leading-[1.12]">
              Smart <span className="text-[#1452D1]">Solutions</span> for <br /> Shipping
            </h1>

            <p className="text-slate-500 text-sm sm:text-base font-medium max-w-xl mx-auto select-none leading-relaxed">
              USend offers shipping tools that simplify logistics for modern businesses
            </p>

            {/* Sub centered action buttons matching screenshot */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <button 
                onClick={() => {
                  onNavigate('hub');
                }}
                className="px-7 py-3 rounded-full bg-[#1452D1] text-white hover:bg-blue-600 font-bold transition-all text-[12.5px] shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                id="hero-download-btn"
              >
                Start Now
              </button>
              <a 
                href="#estimator"
                onClick={(e) => handleScrollTo(e, 'estimator')}
                className="px-7 py-3 rounded-full bg-blue-50 text-[#1452D1] hover:bg-blue-100 font-bold transition-all text-[12.5px] block text-center border border-blue-100/50"
                id="hero-learn-btn"
              >
                Learn More
              </a>
            </div>

          </motion.div>

          {/* DYNAMIC HIGH-FIDELITY TABLET/COMPUTER MOCKUP SITUATED DIRECTLY BENEATH THE BUTTONS */}
          <motion.div style={{ y: cardFloatY }} className="w-full max-w-5xl mx-auto mt-14 px-1 md:px-4 relative">
            
            {/* Top green gradient behind portal shape */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[75%] bg-[radial-gradient(circle,rgba(20,82,209,0.18)_0%,rgba(20,82,209,0.06)_45%,transparent_75%)] blur-[80px] pointer-events-none -z-10 rounded-full" />

            {/* Metallic Device Frame with top notch */}
            <div className="relative bg-slate-100 rounded-[2.2rem] p-3 md:p-4.5 border-4 border-slate-900 shadow-[0_35px_80px_rgba(20,82,209,0.08)] max-w-5xl mx-auto overflow-hidden">
              
              {/* Screen Camera notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-5.5 bg-slate-900 rounded-b-xl flex items-center justify-center z-20">
                <span className="w-2.5 h-2.5 bg-slate-950 rounded-full border border-slate-800" />
                <span className="w-8 h-1 bg-slate-850 rounded-full ml-1.5" />
              </div>

               {/* Inner screen content */}
              <div className="bg-[#FAFBFD] w-full rounded-2xl overflow-hidden border border-slate-200 grid grid-cols-12 min-h-[580px] text-slate-800 font-sans shadow-inner">
                
                {/* 1. SIDEBAR (Width 22% - Col span 3) */}
                <div className="col-span-3 bg-white border-r border-slate-100 p-4.5 flex flex-col justify-between select-none">
                  <div className="space-y-6">
                    {/* Brand header */}
                    <div className="flex items-center gap-2.5 pb-4 border-b border-slate-50">
                      <LogoIcon className="h-7 w-auto" variant="light" />
                      <div className="ml-auto w-3 h-3 bg-slate-100 rounded-full border border-slate-200" />
                    </div>

                    {/* Main Menu Title */}
                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2 block">Main Menu</span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-blue-50 text-[#1452D1] text-[11.5px] font-bold cursor-pointer">
                          <span className="w-1.5 h-1.5 bg-[#1452D1] rounded-full" />
                          <span>Dashboard</span>
                        </div>
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 text-[11.5px] font-bold hover:bg-slate-50 cursor-pointer transition-colors">
                          <Package className="w-3.5 h-3.5" />
                          <span>Shipments</span>
                        </div>
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 text-[11.5px] font-bold hover:bg-slate-50 cursor-pointer transition-colors">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Tracking</span>
                        </div>
                      </div>
                    </div>

                    {/* Features list block style */}
                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2 block">Features</span>
                      <div className="space-y-1 text-[11.5px] font-bold text-slate-400">
                        {['Vehicle List', 'Customers', 'Companies', 'Warehouses', 'Reports'].map((feat, id) => (
                          <div key={id} className="px-3 py-1.5 hover:bg-slate-50 rounded-xl cursor-not-allowed flex items-center gap-2">
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar bottom indicator */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    <div>
                      <p className="text-[9px] font-black text-slate-800 leading-none">SYSTEM ACTIVE</p>
                      <p className="text-[7.5px] text-slate-400 font-mono mt-0.5 uppercase">USend Cloud Mirror</p>
                    </div>
                  </div>
                </div>

                {/* 2. MAIN CONTENT LAYOUT (Col span 9) */}
                <div className="col-span-9 bg-[#F8F9FD] p-5.5 flex flex-col justify-between">
                  
                  {/* Dashboard header widgets */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="relative w-56">
                      <input 
                        disabled 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full bg-white border border-slate-200/60 rounded-xl pl-8 pr-3 py-1.5 text-[11px] font-medium text-slate-500" 
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200/50 flex items-center justify-center relative shadow-3xs cursor-pointer">
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[11px]">🔔</span>
                      </div>

                      {/* Robert Johnson Profile */}
                      <div className="bg-white border border-slate-150/60 rounded-full py-1 pl-1.5 pr-3.5 flex items-center gap-2 shadow-3xs cursor-pointer">
                        <img 
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" 
                          alt="Robert Johnson" 
                          className="w-6.5 h-6.5 rounded-full object-cover border border-slate-200" 
                        />
                        <div className="leading-none text-left">
                          <p className="text-[9.5px] font-black text-slate-800">Robert Johnson</p>
                          <p className="text-[7.5px] text-slate-400 font-extrabold tracking-tight uppercase">Super Admin</p>
                        </div>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* 3. SH SHIPMENT METRIC SUMMARY GRID */}
                  <div className="grid grid-cols-4 gap-3.5 my-3">
                    {[
                      { label: 'Total Shipment', value: '7,391', pct: '+2.34%', up: true },
                      { label: 'Delivery Shipment', value: '5,698', pct: '-0.73%', up: false },
                      { label: 'Pending Shipment', value: '1,243', pct: '-1.34%', up: false },
                      { label: 'Return Shipment', value: '945', pct: '+3.89%', up: true },
                    ].map((item, id) => (
                      <div key={id} className="bg-white border border-slate-150/60 rounded-2xl p-3 shadow-3xs flex flex-col justify-between">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</p>
                          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">{item.value}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[7.5px] font-black ${(item.up) ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                            {item.pct}
                          </span>
                          <span className="text-[7.5px] text-slate-400 font-medium">Last Week</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 4. STATISTICS CHARTS AND CORRESPONDING ACTIONS */}
                  <div className="grid grid-cols-12 gap-3.5 mt-1.5">
                    
                    {/* Left stats columns (span 7) */}
                    <div className="col-span-7 space-y-3.5">
                      
                      {/* Shipment Statistic Column chart */}
                      <div className="bg-white border border-slate-150/60 rounded-[1.4rem] p-4 shadow-3xs">
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-50 mb-3.5">
                          <div>
                            <h4 className="text-[10.5px] font-black text-slate-800 uppercase tracking-tight">Shipment Statistic</h4>
                            <p className="text-[8px] text-slate-400 font-bold">Monthly progress summaries</p>
                          </div>
                          <div className="px-2 py-0.5 rounded bg-slate-50 text-[8px] font-bold text-slate-500 border border-slate-100 flex items-center gap-1">
                            <span>Last 8 Months</span>
                            <ChevronDown className="w-2.5 h-2.5" />
                          </div>
                        </div>

                        {/* Interactive columns container */}
                        <div className="h-28 flex items-end justify-between px-1.5 pt-1.5 gap-2">
                          {[
                            { m: 'Jan', s: 45, d: 35 },
                            { m: 'Feb', s: 55, d: 42 },
                            { m: 'Mar', s: 40, d: 30 },
                            { m: 'Apr', s: 75, d: 58 },
                            { m: 'May', s: 60, d: 48 },
                            { m: 'Jun', s: 80, d: 65 },
                            { m: 'Jul', s: 70, d: 52 },
                            { m: 'Aug', s: 88, d: 74 },
                          ].map((item, id) => (
                            <div key={id} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative">
                              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white rounded text-[7.5px] py-0.5 px-1.5 whitespace-nowrap z-30 font-mono shadow">
                                Ship: {item.s}k | Del: {item.d}k
                              </div>
                              <div className="w-full relative rounded-t-sm overflow-hidden flex flex-col justify-end h-16">
                                {/* Delivery layer (Light Green) */}
                                <div className="w-full bg-[#A7F3D0] rounded-t-xs" style={{ height: `${(item.d / item.s) * 100}%` }} />
                                {/* Shipment layer (Main Green) */}
                                <span className="absolute bottom-0 inset-x-0 bg-[#1452D1]" style={{ height: `${item.s}%`, zIndex: -1 }} />
                              </div>
                              <span className="text-[7.5px] font-bold text-slate-400 mt-2">{item.m}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Locations Progress Indicators */}
                      <div className="bg-white border border-slate-150/60 rounded-[1.4rem] p-4 shadow-3xs">
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Shipping Location</span>
                          <span className="text-[7.5px] text-slate-400 font-extrabold uppercase">Ratio metrics</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          {[
                            { name: 'DKI Jakarta', r: 96, c: 'bg-[#1452D1]' },
                            { name: 'East Java', r: 56, c: 'bg-blue-500' },
                            { name: 'West Java', r: 83, c: 'bg-indigo-500' },
                            { name: 'DIY Yogyakarta', r: 43, c: 'bg-amber-500' },
                          ].map((col, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-[7.5px] font-bold text-slate-500">
                                <span>{col.name}</span>
                                <span className="font-mono">{col.r}%</span>
                              </div>
                              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${col.c} rounded-full`} style={{ width: `${col.r}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Delivery Map tracking right column (span 5) */}
                    <div className="col-span-12 md:col-span-5">
                      <div className="bg-white border border-slate-150/60 rounded-[1.4rem] p-4 shadow-3xs flex flex-col justify-between h-full min-h-[295px]">
                        
                        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                          <div>
                            <h4 className="text-[10px] font-black text-[#1452D1] tracking-tight uppercase">Delivery Tracking</h4>
                            <p className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">Tracking ID: #SHP-1001</p>
                          </div>
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[7.5px] font-black uppercase">In Transit</span>
                        </div>

                        {/* Tiny live map graphic route simulation */}
                        <div className="h-24 my-2.5 rounded-xl bg-blue-50/50 relative overflow-hidden flex items-center justify-center border border-slate-100">
                          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#1452D1_1px,transparent_1px)] bg-[size:10px_10px]" />
                          <div className="absolute top-[35%] left-[20%] w-[60%] h-0.5 bg-dashed border-t border-dashed border-blue-400 transform rotate-[12deg]" />
                          
                          <div className="absolute top-[28%] left-[20%] w-2.5 h-2.5 bg-[#1452D1] rounded-full border border-white shadow-md" />
                          <div className="absolute bottom-[35%] right-[20%] w-2.5 h-2.5 bg-blue-500 rounded-full border border-white shadow-md" />
                          
                          {/* Animated truck pin */}
                          <motion.div 
                            animate={{ x: [-45, 45], y: [-10, 10] }}
                            transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
                            className="absolute top-[35%] left-[50%] bg-[#1452D1] text-white rounded-lg p-0.5 shadow-md z-10"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </motion.div>
                        </div>

                        {/* Departure -> Destination */}
                        <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center text-[8px] font-black text-slate-800 uppercase">
                            <span>Los Angeles, US</span>
                            <span className="text-[#1452D1]">➡️</span>
                            <span>Canberra, AU</span>
                          </div>
                          <p className="text-[7.5px] font-mono font-bold text-slate-450 text-right">Estimate: 14/03/2025</p>
                        </div>

                        {/* Representative Courier card */}
                        <div className="mt-2 text-left pt-2 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img 
                              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100" 
                              alt="Adam Rushford" 
                              className="w-8 h-8 rounded-full border border-slate-150 object-cover" 
                            />
                            <div>
                              <h5 className="text-[10px] font-bold text-slate-800 leading-none">Adam Rushford</h5>
                              <p className="text-[7.5px] text-slate-450 font-extrabold uppercase mt-0.5">Courier Fleet</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-1">
                            <span className="w-5.5 h-5.5 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-150 text-[9px] cursor-pointer">💬</span>
                            <span className="w-5.5 h-5.5 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-150 text-[9px] cursor-pointer">📞</span>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* 5. FINANCIAL REVENUE REPORT GAUGE ARCH */}
                  <div className="border border-slate-150/65 bg-white rounded-2xl p-3 shadow-3xs flex items-center justify-between mt-3.5 select-none">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="text-[#1452D1]" strokeWidth="3" strokeDasharray="81, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span className="text-[8.5px] font-bold font-mono text-[#1452D1]">81%</span>
                      </div>
                      <div className="text-left">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Shipping Revenue</p>
                        <p className="text-sm font-bold text-slate-900 font-mono leading-none mt-0.5">$473,265</p>
                        <p className="text-[7.5px] text-slate-450 mt-0.5">81% from Target Revenue</p>
                      </div>
                    </div>

                    <div className="flex gap-4 pr-3 text-left">
                      {[
                        { label: 'Q1', val: '$67,396' },
                        { label: 'Q2', val: '$84,899' },
                        { label: 'Q3', val: '$56,822' },
                      ].map((item, id) => (
                        <div key={id} className="text-left leading-none">
                          <span className="text-[7.5px] text-slate-400 font-black uppercase">{item.label}</span>
                          <p className="text-[10px] font-mono font-bold text-slate-800 mt-0.5">{item.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </motion.div>

        </header>

        {/* BRAND TICKER - Trusted by Leaders (placed immediately beneath the screen mockup) */}
        <section className="py-12 bg-[#1452D1] border-y border-blue-600/20 flex flex-col items-center justify-center relative select-none overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <p className="text-center text-[11px] font-black text-stone-900/60 uppercase tracking-[0.35em] mb-7">
              {isRTL ? 'شركاؤنا المعتمدون' : 'Our Partners'}
            </p>
          </div>
          
          <div className="w-full relative overflow-hidden">
            {/* Soft edge vignetting fade filters */}
            <div className="absolute inset-y-0 left-0 w-16 md:w-36 bg-gradient-to-r from-[#1452D1] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 md:w-36 bg-gradient-to-l from-[#1452D1] to-transparent z-10 pointer-events-none" />

            {/* Seamless high-fidelity scrolling container */}
            <motion.div 
              animate={{ x: isRTL ? ["-50%", "0%"] : ["0%", "-50%"] }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="flex items-center gap-16 md:gap-24 min-w-max py-2"
            >
              {/* Set 1 */}
              <div className="flex items-center gap-16 md:gap-24 shrink-0 px-8">
                <MaerskLogo />
                <NextCarriersLogo />
                <FastShippingLogo />
                <SilvaShippingLogo />
                <FedExLogo />
              </div>
              {/* Set 2 (for seamless loop wrapping) */}
              <div className="flex items-center gap-16 md:gap-24 shrink-0 px-8">
                <MaerskLogo />
                <NextCarriersLogo />
                <FastShippingLogo />
                <SilvaShippingLogo />
                <FedExLogo />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ABOUT US SECTION - Remodeled with ultra-premium Parallax scrolling depth */}
        <section id="about" className="py-28 bg-white relative border-b border-slate-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Side-by-side 98% dark card + Cargo Truck photo with parallax style scroll */}
            <motion.div style={{ y: aboutImageY }} className="lg:col-span-6 grid grid-cols-12 gap-4 items-stretch h-full">
              
              {/* 98% Dark Canvas block */}
              <div className="col-span-12 sm:col-span-5 bg-[#0A192F] rounded-[2rem] p-6.5 text-white flex flex-col justify-between min-h-[310px] shadow-sm">
                <div>
                  <LogoIcon className="h-8 w-auto opacity-90" variant="dark" />
                </div>
                <div className="space-y-2 mt-8 text-left">
                  <p className="text-4xl md:text-[2.85rem] font-bold tracking-tight font-sans leading-none">98%</p>
                  <p className="text-[10.5px] text-slate-300 font-medium font-sans leading-relaxed uppercase tracking-wider">
                    Success Rate In On-Time Product Delivery
                  </p>
                </div>
              </div>

              {/* Blue matched-height Truck image */}
              <div className="col-span-12 sm:col-span-7 rounded-[2rem] overflow-hidden border border-slate-205/70 shadow-md bg-slate-100 min-h-[310px]">
                <img 
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800" 
                  alt="USend Cargo Delivery Truck" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 select-none"
                />
              </div>

            </motion.div>

            {/* Right Column: Text content with inverted parallax motion */}
            <motion.div style={{ y: aboutTextY }} className="lg:col-span-6 text-left space-y-5.5 pl-0 lg:pl-6">
              <p className="text-[12.5px] font-bold text-slate-450 uppercase tracking-widest block font-sans">
                About us
              </p>
              
              <h2 className="text-3xl sm:text-[2.5rem] font-bold text-slate-950 tracking-tight leading-[1.18] font-sans">
                We Specialize In Reliable E-Commerce Shipping. Direct Domestic Deliveries Moved Safely & Instantly.
              </h2>

              <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-[15px]">
                We believe true excellence comes from the harmony of accuracy and innovation. Every action we take is guided by meticulous precision, ensuring flawless execution at every step.
              </p>
            </motion.div>

          </div>
        </section>


      {/* ECOSYSTEM ECOSYSTEM PORTALS SECTION - All Logistical Portals Connected */}
      <section id="portals" className="py-24 bg-slate-900 text-white relative">
        <div className="absolute top-0 inset-x-0 h-[200px] bg-gradient-to-b from-white to-transparent pointer-events-none opacity-5" />
        
        <motion.div style={{ y: portalsY }} className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[#1452D1] text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
              🔑 {content.portalsBadge}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.1] uppercase">
              {content.portalsTitle}
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium">
              {content.portalsDesc}
            </p>
          </div>

          {/* Connected Bento-Style Grid demonstrating full-stack unified portals capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Portal 1: Personal User */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6.5 hover:border-[#1452D1] transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-[#1452D1]/10 border border-[#1452D1]/20 flex items-center justify-center text-[#1452D1] group-hover:bg-[#1452D1] group-hover:text-white transition-all">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black uppercase text-white tracking-tight">{content.portalPersonalTitle}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{content.portalPersonalDesc}</p>
              </div>
              <div className="pt-8">
                <button 
                  onClick={() => {
                    setLoginRole('user');
                    setLoginEmail('user@usend.com');
                    setLoginModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-[#1452D1] hover:text-white text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2"
                >
                  <span>{content.portalPersonalBtn}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Portal 2: Enterprise Merchant */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6.5 hover:border-[#1452D1] transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-[#1452D1] group-hover:text-white transition-all">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black uppercase text-white tracking-tight">{content.portalBusinessTitle}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{content.portalBusinessDesc}</p>
              </div>
              <div className="pt-8">
                <button 
                  onClick={() => {
                    setLoginRole('merchant');
                    setLoginEmail('merchant@usend.com');
                    setLoginModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-[#1452D1] hover:text-white text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2"
                >
                  <span>{content.portalBusinessBtn}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Portal 3: Drivers */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6.5 hover:border-[#1452D1] transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-[#1452D1] group-hover:text-white transition-all">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black uppercase text-white tracking-tight">{content.portalCourierTitle}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{content.portalCourierDesc}</p>
              </div>
              <div className="pt-8">
                <button 
                  onClick={() => {
                    setLoginRole('driver');
                    setLoginEmail('driver@usend.com');
                    setLoginModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-[#1452D1] hover:text-white text-slate-300 text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2"
                >
                  <span>{content.portalCourierBtn}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Portal 4: Control Tower Admin */}
            <div className="bg-slate-950/80 border border-[#1452D1]/40 rounded-3xl p-6.5 hover:border-[#1452D1] transition-all flex flex-col justify-between group/admin relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-[#1452D1] text-[7.5px] font-black uppercase tracking-widest rounded-bl-xl text-white">
                Super Command
              </div>
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover/admin:bg-[#1452D1] group-hover/admin:text-white transition-all">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black uppercase text-white tracking-tight">{content.portalAdminTitle}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{content.portalAdminTitleDesc}</p>
              </div>
              <div className="pt-8">
                <button 
                  onClick={() => {
                    setLoginRole('admin');
                    setLoginEmail('admin@usend.com');
                    setLoginModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#1452D1] hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2"
                >
                  <span>{content.portalAdminBtn}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>



        </motion.div>
      </section>

      {/* GUEST ORDER WIDGET */}
      <section className="py-24 bg-slate-50 relative border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <GuestOrderWidget 
            onNavigate={onNavigate} 
            onRequestLogin={() => {
              setLoginRole('user');
              setLoginModalOpen(true);
            }}
          />
        </div>
      </section>

      {/* HOW WE WORK SECTION - How We Manage Every Shipment With Care */}
      <section id="how" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-[10px] font-black text-[#1452D1] uppercase tracking-[0.4em]">{content.howBadge}</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tight leading-tight">{content.howTitle}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            
            {/* Visual connected line for timeline look in big view */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[80%] h-0.5 bg-slate-100 -z-10 hidden lg:block" />

            {[
              { num: content.howStep1Num, title: content.howStep1Title, desc: content.howStep1Desc },
              { num: content.howStep2Num, title: content.howStep2Title, desc: content.howStep2Desc },
              { num: content.howStep3Num, title: content.howStep3Title, desc: content.howStep3Desc },
              { num: content.howStep4Num, title: content.howStep4Title, desc: content.howStep4Desc }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6.5 hover:shadow-md transition-all relative group"
              >
                {/* Flow indicator badge */}
                <div className="absolute -top-4 -left-4 w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-white font-black text-[10px] uppercase font-mono flex items-center justify-center group-hover:bg-[#1452D1] transition-all">
                  {step.num}
                </div>
                <div className="space-y-4 pt-2">
                  <h4 className="text-base font-black uppercase text-slate-800 tracking-tight">{step.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">{step.desc}</p>
                </div>
              </motion.div>
            ))}

          </div>

          {/* Sea Containers Banner Image with Play Button overlap - USend motif */}
          <div className="mt-16 rounded-[2.5rem] overflow-hidden relative h-[380px] shadow-lg">
            <img 
              src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=1500" 
              alt="Global Freight Excellence" 
              className="w-full h-full object-cover brightness-75 contrast-110 shrink-0"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-85" />
            
            {/* Elements overlap */}
            <div className="absolute inset-0 p-8 flex flex-col justify-between items-start text-white">
              <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">
                USend Network Film
              </span>
              
              <div className="w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Global Freight Systems Designed to Deliver</h3>
                  <p className="text-slate-300 text-xs md:text-sm font-medium mt-1 max-w-xl">Watch how we coordinate daily parcel handovers, transit hubs, and e-commerce distribution networks seamlessly across the UAE.</p>
                </div>
                
                {/* Circular Play Button matching mockup representation */}
                <button 
                  onClick={() => alert('Launching USend corporate corridor showcase video.')}
                  className="w-16 h-16 rounded-full bg-[#1452D1] text-white hover:bg-white hover:text-[#1452D1] transition-all flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 shrink-0 self-end"
                  aria-label="Play Corporate Video"
                >
                  <Play className="w-6 h-6 fill-current ml-1" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* DYNAMIC SHIPPING RATE ESTIMATOR - CALCULATOR COMPONENT */}
      <section id="estimator" className="py-24 bg-slate-900 text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,82,209,0.12)_0%,transparent_75%)] pointer-events-none" />
        
        <motion.div style={{ y: estimatorY }} className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-center">
            
            {/* Left side text headers */}
            <div className="lg:col-span-5 space-y-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 text-[#1452D1] text-[10px] font-extrabold uppercase tracking-widest rounded-full">
                <Calculator className="w-4 h-4" /> {content.estimatorBadge}
              </span>
              <h2 className="text-3xl md:text-4.5xl font-black uppercase tracking-tight leading-tight">
                {content.estimatorTitle}
              </h2>
              <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
                {content.estimatorDesc}
              </p>
              
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/15 text-[#1452D1] flex items-center justify-center font-black text-xs font-mono">1</div>
                  <p className="text-xs text-slate-300">Base handling fee is variable between local and international.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/15 text-[#1452D1] flex items-center justify-center font-black text-xs font-mono">2</div>
                  <p className="text-xs text-slate-300">Volumetric weight calculated as: (W * L * H) / 5000 according to IATA standards.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/15 text-[#1452D1] flex items-center justify-center font-black text-xs font-mono">3</div>
                  <p className="text-xs text-slate-300">Instant direct access links generate automated router parameters.</p>
                </div>
              </div>
            </div>

            {/* Price Form Container */}
            <div className="lg:col-span-7 bg-white text-slate-900 rounded-[2.5rem] p-6.5 md:p-8 border border-slate-200 shadow-2xl relative overflow-hidden">
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 border-b border-slate-100 pb-4 mb-6">
                Interactive Sizer Estimator Form
              </h3>

              <form onSubmit={runSizerEstimate} className="space-y-6">
                
                {/* Cities Hub Select */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{content.pricingSource}</label>
                    <div className="relative">
                      <select 
                        value={estSource}
                        onChange={(e) => setEstSource(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#1452D1] appearance-none cursor-pointer"
                      >
                        <option value="DXB">Dubai Airport (DXB)</option>
                        <option value="AUH">Abu Dhabi Port (AUH)</option>
                        <option value="SHJ">Sharjah Terminal (SHJ)</option>
                      </select>
                      <MapPin className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{content.pricingTarget}</label>
                    <div className="relative">
                      <select 
                        value={estTarget}
                        onChange={(e) => setEstTarget(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#1452D1] appearance-none cursor-pointer"
                      >
                        <option value="RUH">Riyadh Hub, KSA (RUH)</option>
                        <option value="DOH">Doha Terminal, Qatar (DOH)</option>
                        <option value="MCT">Muscat Depot, Oman (MCT)</option>
                        <option value="DXB">Dubai Terminal, UAE (DXB)</option>
                        <option value="AUH">Abu Dhabi Hub, UAE (AUH)</option>
                      </select>
                      <MapPin className="absolute right-4 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Weight Scale Range slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span>{content.pricingWeight}</span>
                    <span className="font-mono text-[#1452D1] text-xs">{estWeight} KG</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="150" 
                    value={estWeight}
                    onChange={(e) => setEstWeight(Number(e.target.value))}
                    className="w-full accent-[#1452D1] h-1.5 bg-slate-100 rounded-lg cursor-pointer animate-pulse"
                  />
                  <div className="flex justify-between text-[8px] font-bold text-slate-400">
                    <span>1 KG (Envelope/Docs)</span>
                    <span>150 KG (Heavier Pallets)</span>
                  </div>
                </div>

                {/* Volumetric dimensions fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{content.pricingWidth}</label>
                    <input 
                      type="number" 
                      min="10" 
                      max="150"
                      value={estWidth}
                      onChange={(e) => setEstWidth(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#1452D1]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{content.pricingLength}</label>
                    <input 
                      type="number" 
                      min="10" 
                      max="150"
                      value={estLength}
                      onChange={(e) => setEstLength(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#1452D1]"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={calculating}
                  className="w-full py-4 rounded-xl bg-[#1452D1] hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                >
                  {calculating ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Calculator className="w-4 h-4" />
                      <span>{content.pricingEstimateBtn}</span>
                    </>
                  )}
                </button>

              </form>

              {/* Interactive Calculation Result Card Display */}
              <AnimatePresence>
                {estimateResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-[#1452D1] text-[8px] font-extrabold uppercase tracking-widest rounded border border-blue-100/50">
                          {estimateResult.routeType} Recommended
                        </span>
                        <h4 className="text-sm font-black text-slate-800 uppercase mt-1">Zonal Shipping Rate Receipt</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 uppercase font-black">Estimated Sum</p>
                        <p className="text-xl font-black font-mono text-[#1452D1]">AED {estimateResult.totalPrice}.00</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-slate-500 text-[10px] font-semibold border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span>Base handling fare</span>
                        <span>AED {estimateResult.basePrice}.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weight metrics surcharge</span>
                        <span>AED {estimateResult.weightSurcharge}.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volumetric capacity estimate</span>
                        <span>AED {estimateResult.volumeSurcharge}.00</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-100 p-3.5 rounded-xl">
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase font-black">Average Delivery Window</p>
                        <p className="text-xs font-bold text-slate-800">{estimateResult.duration}</p>
                      </div>
                      <button 
                        onClick={() => onNavigate('hub')}
                        className="py-2.5 px-4 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#1452D1] transition-all text-center"
                      >
                        Settle & Ship Now
                      </button>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>
        </motion.div>
      </section>

      {/* MEET THE TEAM BEHIND THE MOVE - Aeroship Jane Robert Robert Fox */}
      <section id="team" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-[10px] font-black text-[#1452D1] uppercase tracking-[0.4em]">{content.teamBadge}</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tight leading-tight">{content.teamTitle}</h2>
            <p className="text-slate-500 text-sm font-medium">{content.teamDesc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Promo Card skilled experts */}
            <div className="bg-[#1452D1] rounded-[2rem] p-8 text-white flex flex-col justify-between shadow-lg">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white text-lg">
                  💡
                </div>
                <h3 className="text-xl font-black uppercase leading-tight tracking-tight">Supply Chain Excellence</h3>
                <p className="text-xs text-white/80 leading-relaxed font-semibold">{content.teamSlogan}</p>
              </div>
              <div className="pt-8">
                <span className="text-[9px] font-mono tracking-widest uppercase font-black opacity-60">USend Systems UAE</span>
              </div>
            </div>

            {/* Team member: Kristin Watson */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-[2rem] overflow-hidden group hover:border-[#1452D1] transition-all relative">
              <div className="h-64 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" 
                  alt="Kristin Watson" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Kristin Watson</h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Founder & Managing Director</p>
                <p className="text-[10px] text-zinc-400 mt-3 font-semibold">12+ years experience directing complex air networks across GCC countries.</p>
              </div>
            </div>

            {/* Team member: Jane Cooper */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-[2rem] overflow-hidden group hover:border-[#1452D1] transition-all relative">
              <div className="h-64 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400" 
                  alt="Jane Cooper" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Jane Cooper</h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Marketing & Relations Coordinator</p>
                <p className="text-[10px] text-zinc-400 mt-3 font-semibold">Coordinates large enterprise accounts, API deployment & key client integration events.</p>
              </div>
            </div>

            {/* Team member: Robert Fox */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-[2rem] overflow-hidden group hover:border-[#1452D1] transition-all relative">
              <div className="h-64 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400" 
                  alt="Robert Fox" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Robert Fox</h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Fulfillment Team Coordinator</p>
                <p className="text-[10px] text-zinc-400 mt-3 font-semibold">Direct fleet operations, driver directories, routing algorithms & COD wallet ledgers.</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      

      {/* FAQ ACCORDION SECTION */}
      <section id="faq" className="py-24 bg-slate-50 relative border-t border-slate-200/50">
        <div className="max-w-4xl mx-auto px-4">
          
          <div className="text-center space-y-4 mb-16">
            <span className="text-[10px] font-black text-[#1452D1] uppercase tracking-[0.4em]">{content.faqBadge}</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tight">{content.faqTitle}</h2>
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
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex justify-between items-center transition-colors hover:bg-slate-50 outline-none select-none"
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                >
                  <p className="text-sm font-black uppercase text-slate-800 tracking-tight flex items-center gap-3">
                    <span className="text-[#1452D1] font-mono text-[10px]/none flex items-center justify-center w-5 h-5 rounded-full bg-blue-100/50 font-bold">?</span>
                    {item.q}
                  </p>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>

                {activeFaq === idx && (
                  <div className="p-6 pt-0 border-t border-slate-100 text-xs md:text-sm text-slate-600 leading-relaxed font-semibold bg-slate-50/50">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FOOTER SECTION - Optimize Speed */}
      <footer className="bg-slate-950 text-white pt-24 pb-16 px-4 md:px-8 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* Footer main banner call */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-white/15">
            <div className="space-y-2">
              <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight">{content.footerLead}</h3>
              <p className="text-slate-400 text-xs md:text-sm font-semibold">{content.footerLeadDesc}</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => onNavigate('hub')}
                className="px-6 py-3.5 bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#1452D1] hover:text-white transition-all"
              >
                Launch Platform
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            
            <div className="space-y-6 md:col-span-2">
              <div className="flex items-center gap-3">
                <LogoIcon className="h-10 w-auto" variant="dark" />
                <div className="flex flex-col">
                  <span className="text-sm font-black tracking-widest text-white uppercase leading-none">USEND</span>
                  <span className="text-[8px] font-mono font-bold uppercase text-blue-400 tracking-[0.25em]">Smart Shipping</span>
                </div>
              </div>
              <p className="text-[12px] text-slate-400 leading-relaxed max-w-md font-semibold">
                Settle UAE/GCC distribution corridors with high-scale autonomous fleet registries, direct map diagnostics, secure client cash transactions, and intelligent chatbot utilities.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Connect Hubs</h4>
              <ul className="space-y-2 text-[11px] font-bold text-slate-300">
                <li>
                  <span 
                    className="hover:text-[#1452D1] transition-colors cursor-pointer" 
                    onClick={() => {
                      setLoginRole('user');
                      setLoginEmail('user@usend.com');
                      setLoginModalOpen(true);
                    }}
                  >
                    Individual Terminal
                  </span>
                </li>
                <li>
                  <span 
                    className="hover:text-[#1452D1] transition-colors cursor-pointer" 
                    onClick={() => {
                      setLoginRole('merchant');
                      setLoginEmail('merchant@usend.com');
                      setLoginModalOpen(true);
                    }}
                  >
                    Merchant Control Panel
                  </span>
                </li>
                <li>
                  <span 
                    className="hover:text-[#1452D1] transition-colors cursor-pointer" 
                    onClick={() => {
                      setLoginRole('driver');
                      setLoginEmail('driver@usend.com');
                      setLoginModalOpen(true);
                    }}
                  >
                    Driver Delivery App
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Corporate Parameters</h4>
              <ul className="space-y-2 text-[11px] font-bold text-slate-300">
                <li><span className="hover:text-[#1452D1] transition-colors cursor-pointer" onClick={() => { setLoginRole('admin'); setLoginModalOpen(true); }}>Zonal Admin Portal</span></li>
                <li><a href="#" className="hover:text-[#1452D1] transition-colors">Safety Logs</a></li>
                <li><a href="#" className="hover:text-[#1452D1] transition-colors">API Keys</a></li>
              </ul>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest">
            <p>{content.copyright}</p>
            <div className="flex items-center gap-8">
              <a href="#" className="hover:text-[#1452D1] transition-colors">Privacy Polity</a>
              <a href="#" className="hover:text-[#1452D1] transition-colors">Service Terms</a>
            </div>
          </div>

        </div>
      </footer>

      </div>

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
                 <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-[#1452D1] animate-bounce">
                   <AiFace3DIcon className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="font-extrabold text-xs uppercase tracking-wide">USend AI Support</h3>
                   <p className="text-[8px] text-cyan-400 font-bold uppercase tracking-widest font-mono">Status: active</p>
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
                         ? 'bg-[#1452D1] text-white rounded-br-none' 
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
                  className="flex-1 outline-none text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-[#1452D1] transition-all font-semibold"
                />
                <button type="submit" className="w-11 h-11 bg-slate-900 hover:bg-[#1452D1] text-white rounded-xl flex items-center justify-center shadow-lg transition-colors shrink-0">
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
             </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Buttons layout */}
      <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-40 flex items-center gap-3`}>
        
        {/* Toggle bot button (Desktop style) */}
        <button
          onClick={() => setBotOpen(!botOpen)}
          className="px-5 py-3 rounded-full bg-slate-900 hover:bg-[#1452D1] text-white border border-slate-700 shadow-xl items-center gap-2.5 transition-all text-[9px] font-black uppercase tracking-widest flex hover:-translate-y-0.5 active:translate-y-0 select-none"
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
              className="w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md text-slate-850 flex items-center justify-center hover:bg-[#1452D1] hover:text-white transition-all select-none"
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
