import { motion } from 'motion/react';
import { Screen } from '../types';
import { 
  User, 
  Briefcase, 
  ArrowRight, 
  Zap, 
  Globe2, 
  ShieldCheck, 
  Car, 
  Activity, 
  Terminal, 
  ArrowUpRight,
  PackageCheck,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LogoIcon from '../components/LogoIcon';
import { useState, useEffect } from 'react';
import LoginModal from '../components/LoginModal';

interface HubProps {
  onNavigate: (screen: Screen) => void;
}

export default function Hub({ onNavigate }: HubProps) {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<'admin' | 'merchant' | 'user' | 'driver'>('user');

  const content = language === 'en' ? {
    navFeatures: 'Services',
    navSolutions: 'Resources',
    navMarketplace: 'Our Vision',
    navFees: 'Contact',
    loginCustomer: 'Hub Access',
  } : {
    navFeatures: 'الخدمات',
    navSolutions: 'الموارد',
    navMarketplace: 'عن الشركة',
    navFees: 'الوظائف',
    loginCustomer: 'الوصول للمنصة',
  };

  const dispatchTerminals = [
    {
      id: 'personal',
      role: 'user' as const,
      title: t('hub_personal') || 'Customer Terminal',
      subtitle: 'RETAIL SHIPPING & TRACKING',
      desc: t('hub_personal_desc') || 'Instantly dispatch light packages across UAE cities, track live driver locations on full-screen maps, and coordinate custom delivery parameters.',
      icon: <User className="w-6 h-6 text-[#113f36]" />,
      colorClass: 'from-blue-500/10 to-blue-500/10 hover:border-[#113f36]/30',
      tagColor: 'bg-[#113f36]/5 text-[#113f36] dark:bg-zinc-900 dark:text-[#6e938c]',
      badgeText: 'INDIVIDUAL DISPATCH',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600',
      metricLabel: 'Dispatch Time',
      metricValue: 'Instant',
    },
    {
      id: 'business',
      role: 'merchant' as const,
      title: t('hub_business') || 'Merchant Terminal',
      subtitle: 'ENTERPRISE INTEGRATION',
      desc: t('hub_business_desc') || 'Ingest bulk CSV directories, customize Cash on Delivery (COD) collection guidelines, access Sandbox Aramex waybill systems, and settle store ledgers instantly.',
      icon: <Briefcase className="w-6 h-6 text-[#113f36]" />,
      colorClass: 'from-blue-500/10 to-indigo-500/10 hover:border-indigo-500/30',
      tagColor: 'bg-indigo-50 text-indigo-800 dark:bg-zinc-900 dark:text-indigo-300',
      badgeText: 'E-COMMERCE MERCHANT',
      image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=600',
      metricLabel: 'SLA Match Rate',
      metricValue: '99.8%',
    }
  ];

  return (
    <div className={`min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans overflow-x-hidden relative flex flex-col ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Top Banner Accent */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-[110]" />

      {/* Decorative Grid Mesh Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.35] pointer-events-none" />

      {/* Container Wrap for Navigation & Content */}
      <div className="relative p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto flex-1 flex flex-col">
        
        {/* Navigation - Contained and Rounded */}
        <nav 
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
            paddingTop: '16px', 
            paddingBottom: '16px',
            borderColor: 'rgba(0, 0, 0, 0.06)',
            backdropFilter: `blur(20px)`
          }}
          className="fixed top-6 inset-x-4 lg:inset-x-12 z-[100] transition-all duration-500 border rounded-[2rem] max-w-[1500px] mx-auto px-6 md:px-10 shadow-sm shadow-zinc-100/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer text-zinc-900" onClick={() => onNavigate('landing_page')}>
              <LogoIcon className="w-auto h-[46px] lg:h-[52px]" />
            </div>
            
            <div className="hidden xl:flex items-center gap-10 text-[12px] font-bold text-zinc-500 uppercase tracking-[0.25em]">
              <span className="hover:text-zinc-900 transition-colors cursor-pointerSB" onClick={() => onNavigate('landing_page')}>{content.navFeatures}</span>
              <span className="hover:text-zinc-900 transition-colors cursor-pointerSB" onClick={() => onNavigate('landing_page')}>{content.navSolutions}</span>
              <span className="hover:text-zinc-900 transition-colors cursor-pointerSB" onClick={() => onNavigate('landing_page')}>{content.navMarketplace}</span>
              <span className="hover:text-zinc-900 transition-colors cursor-pointerSB" onClick={() => onNavigate('landing_page')}>{content.navFees}</span>
            </div>

            <div className="flex items-center gap-3 md:gap-5">
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 hover:bg-zinc-200 transition-all border border-zinc-200/50"
              >
                <Globe2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>

        {/* Main Grid */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 mt-28 md:mt-32 lg:p-10 relative z-10 w-full max-w-[1300px] mx-auto">
          
          {/* Fully Interactive Grid Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mb-12">
            {dispatchTerminals.map((terminal, idx) => (
              <motion.div
                key={terminal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => {
                  setLoginRole(terminal.role);
                  setLoginModalOpen(true);
                }}
                className={`group relative rounded-[2rem] bg-white border border-zinc-200/80 p-6 flex flex-col justify-between overflow-hidden cursor-pointer shadow-sm hover:border-zinc-300 transition-all duration-300 hover:shadow-xl hover:shadow-zinc-100/50 active:scale-[0.99]`}
              >
                {/* Visual Backdrop Splatter */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[80px] opacity-40 bg-gradient-to-br ${terminal.colorClass} pointer-events-none transition-transform duration-500 group-hover:scale-150`} />

                {/* Card Top */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 shadow-sm flex items-center justify-center group-hover:bg-indigo-50/10 group-hover:scale-105 duration-300">
                      {terminal.icon}
                    </div>
                    <span className={`text-[15px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${terminal.tagColor}`}>
                      {terminal.badgeText}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[15px] font-extrabold text-zinc-400 tracking-widest uppercase">
                      {terminal.subtitle}
                    </p>
                    <h2 className="text-lg font-black text-zinc-950 flex items-center gap-1 group-hover:text-[#113f36] transition-colors duration-300">
                      {terminal.title}
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </h2>
                  </div>

                  <p className="text-xs text-zinc-500 leading-normal font-medium dark:text-zinc-600 line-clamp-3">
                    {terminal.desc}
                  </p>
                </div>

                {/* Card Bottom: Interactive Image & Stat Accents */}
                <div className="mt-6 pt-4 border-t border-zinc-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={terminal.image} 
                      alt="" 
                      className="w-10 h-10 rounded-xl object-cover border border-zinc-100 filter grayscale group-hover:grayscale-0 duration-500"
                    />
                    <div>
                      <p className="text-[15px] font-black uppercase text-zinc-400 tracking-wider">
                        {terminal.metricLabel}
                      </p>
                      <p className="text-xs font-bold text-zinc-800">
                        {terminal.metricValue}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 text-[12px] font-black uppercase tracking-wider text-zinc-400 group-hover:text-[#113f36] duration-300">
                    Connect Portal
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 duration-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white pt-24 pb-16 px-8 border-t border-zinc-100 mt-auto w-full">
         <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center gap-3 text-zinc-900 mb-6">
                  <LogoIcon className="w-auto h-12" />
               </div>
               <p className="text-zinc-500 text-sm max-w-sm leading-relaxed font-semibold">
                Designing the architecture for future logistics. Autonomous, secure, and regionally connected infrastructure.
               </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 col-span-1 md:col-span-2">
               <div>
                  <h4 className="text-zinc-900 font-extrabold text-[15px] uppercase tracking-[0.3em] mb-6 opacity-40">Network</h4>
                  <ul className="space-y-3 text-zinc-600 text-xs font-bold">
                    <li><a href="#" className="hover:text-amber-600 transition-colors">Express Depots</a></li>
                    <li><a href="#" className="hover:text-amber-600 transition-colors">Surface Fleet</a></li>
                    <li><a href="#" className="hover:text-amber-600 transition-colors">Smart Hubs</a></li>
                  </ul>
               </div>

               <div>
                  <h4 className="text-zinc-900 font-extrabold text-[15px] uppercase tracking-[0.3em] mb-6 opacity-40">Resources</h4>
                  <ul className="space-y-3 text-zinc-600 text-xs font-bold">
                    <li><a href="#" className="hover:text-[#113f36] transition-colors">API Docs</a></li>
                    <li><a href="#" className="hover:text-[#113f36] transition-colors">Governance</a></li>
                    <li><a href="#" className="hover:text-[#113f36] transition-colors">Careers</a></li>
                  </ul>
               </div>
            </div>
         </div>

         <div className="max-w-[1400px] mx-auto pt-10 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-[15px] font-black text-zinc-400 uppercase tracking-[0.4em]">
              © 2026 USEND SYSTEMS. ARCHITECTED IN UAE.
            </div>
            
            <div className="flex items-center gap-8 text-[15px] font-black text-zinc-400 uppercase tracking-[0.4em]">
               <a href="#" className="hover:text-[#113f36] transition-colors">Privacy</a>
               <a href="#" className="hover:text-[#113f36] transition-colors">Terms</a>
            </div>
         </div>
      </footer>

      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
        defaultRole={loginRole} 
        onNavigate={onNavigate} 
      />
    </div>
  );
}
