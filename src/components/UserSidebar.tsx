import { 
  LayoutDashboard, 
  Map, 
  CreditCard, 
  LogOut, 
  Menu, 
  Globe, 
  History, 
  Anchor, 
  X,
  PlusCircle,
  Package,
  Users,
  Settings,
  Database
} from 'lucide-react';
import LogoIcon from './LogoIcon';
import { Screen } from '../types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function UserSidebar({ currentScreen, onNavigate }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, language, setLanguage, isRTL } = useLanguage();

  const userItems = [
    { id: 'user_dashboard', icon: LayoutDashboard, label: t('dashboard') || 'Dashboard' },
    { id: 'user_individual', icon: PlusCircle, label: t('individual_order') || 'New Order' },
    { id: 'user_orders', icon: History, label: t('previous_orders') || 'Orders' },
    { id: 'user_tracking', icon: Map, label: t('tracking') || 'Tracking' },
    { id: 'user_payments', icon: CreditCard, label: t('payments') || 'Payment Methods' },
  ];
  
  const navItems = userItems;

  const handleItemClick = (screen: Screen) => {
    onNavigate(screen);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#09090b] text-[#e4e4e7] select-none border-r border-zinc-900/80">
      <div className="p-6 pb-5 border-b border-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleItemClick('user_dashboard')}>
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <LogoIcon className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" variant="light" />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-widest text-[#f4f4f5] leading-none">USend Portal</h1>
            <span className="text-[13px] text-zinc-500 font-bold uppercase tracking-widest mt-1 block">Consumer Access</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-5 px-4 space-y-6 hide-scrollbar">
        <div className="space-y-1.5">
          <h2 className={`text-[12px] font-black uppercase tracking-[0.25em] text-zinc-500 px-3.5 mb-2.5 ${isRTL ? 'text-right' : 'text-left'} opacity-90`}>
            User Portal
          </h2>
          <div className="space-y-[3px]">
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id as Screen)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 group/btn relative ${
                    isActive 
                      ? 'bg-brand text-white font-bold shadow-lg shadow-brand/25' 
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/45'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon className={`w-[17px] h-[17px] shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-zinc-400 group-hover/btn:text-zinc-200 group-hover/btn:scale-105'
                    }`} />
                    <span className="text-[12px] font-semibold leading-none truncate tracking-wide text-left">{item.label}</span>
                  </div>
                  {isActive ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-transparent group-hover/btn:bg-zinc-600 transition-colors shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-900 bg-[#050507] space-y-1.5">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 text-[12px] font-black uppercase tracking-widest transition-all"
        >
          <Globe className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>
        <button
          onClick={() => handleItemClick('landing_page')}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-50/10 text-[12px] font-black uppercase tracking-widest transition-all"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>{t('exit_portal') || 'Exit Portal'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className={`md:hidden flex items-center justify-between p-4 bg-[#09090b] text-[#f4f4f5] sticky top-0 z-40 border-b border-zinc-900 shadow-sm`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleItemClick('user_dashboard')}>
          <div className="w-8 h-8 flex items-center justify-center">
            <LogoIcon className="w-6 h-6 text-white drop-shadow-md" variant="light" />
          </div>
          <span className="font-black text-xs tracking-widest uppercase text-zinc-100">USend Consumer</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors border border-zinc-800"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: isRTL ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '100%' : '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} w-[280px] bg-[#09090b] z-50 md:hidden shadow-2xl flex flex-col`}
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className={`hidden md:flex flex-col w-[260px] h-screen sticky top-0 overflow-hidden shadow-lg border-${isRTL ? 'l' : 'r'} border-zinc-900 bg-[#09090b]`} dir={isRTL ? 'rtl' : 'ltr'}>
        <SidebarContent />
      </div>
    </>
  );
}
