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
  Database,
  Wallet
} from 'lucide-react';
import { Screen } from '../types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantSidebar({ currentScreen, onNavigate }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, language, setLanguage, isRTL } = useLanguage();

  const userItems = [
    { id: 'user_dashboard', icon: LayoutDashboard, label: t('dashboard') || 'Dashboard' },
    { id: 'user_individual', icon: PlusCircle, label: t('individual_order') || 'New Order' },
    { id: 'user_orders', icon: History, label: t('previous_orders') || 'Orders' },
    { id: 'user_tracking', icon: Map, label: t('tracking') || 'Tracking' },
    { id: 'user_payments', icon: CreditCard, label: t('payments') || 'Payment Methods' },
  ];

  const merchantGroups = [
    {
      title: '',
      items: [
        { id: 'merchant_dashboard', icon: LayoutDashboard, label: t('dashboard') || 'Dashboard' }
      ]
    },
    {
      title: t('orders_freight') || 'Orders & Freight',
      items: [
        { id: 'merchant_individual', icon: PlusCircle, label: t('individual_order') || 'Manual Orders' },
        { id: 'merchant_batch', icon: Package, label: t('create_batch_orders') || 'Bulk Orders & Quotes' }
      ]
    },
    {
      title: t('warehouse') || 'Warehouse',
      items: [
        { id: 'merchant_inventory', icon: Package, label: t('manage_inventory') || 'Manage Inventory' }
      ]
    },
    {
      title: t('integrations') || 'Integrations',
      items: [
        { id: 'merchant_integrations', icon: Database, label: t('ecommerce_couriers') || 'Ecommerce & Couriers' }
      ]
    },
    {
      title: t('reports') || 'Reports',
      items: [
        { id: 'merchant_tracking', icon: Map, label: t('tracking') || 'Live Tracking' },
        { id: 'merchant_customers', icon: Users, label: t('customers') || 'Customers & Analytics' }
      ]
    },
    {
      title: t('finance') || 'Finance',
      items: [
        { id: 'merchant_wallet', icon: Wallet, label: t('wallet') || 'Wallet & Topups' },
        { id: 'merchant_payments', icon: CreditCard, label: t('payments') || 'Invoices & Tax Reports' },
        { id: 'merchant_settings', icon: Settings, label: t('settings') || 'Portal Settings' }
      ]
    }
  ];

  const handleItemClick = (screen: Screen) => {
    onNavigate(screen);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#EFF3EE]/95 text-zinc-800 select-none border-r border-[#E2ECE0]">
      <div className="p-6 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleItemClick('merchant_dashboard')}>
          <div className="w-10 h-10 rounded-2xl bg-[#D5E2D2] border border-[#CBD7C9] flex items-center justify-center text-[#344633] leading-none shrink-0 shadow-sm">
            <Anchor className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-[13px] font-black uppercase tracking-wider text-[#344633] leading-none">USend Portal</h1>
            <span className="text-[11px] text-[#6D7D6A] font-bold uppercase tracking-widest mt-1 block">Merchant Access</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-5 px-4 space-y-6 hide-scrollbar">
        <div className="space-y-4">
          {merchantGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              {group.title && (
                <h2 className={`text-[10px] font-black uppercase tracking-[0.25em] text-[#6D7D6A]/80 px-3.5 mb-2.5 ${isRTL ? 'text-right' : 'text-left'} opacity-90`}>
                  {group.title}
                </h2>
              )}
              <div className="space-y-[3px]">
                {group.items.map((item, itemIdx) => {
                  const isActive = currentScreen === item.id;
                  return (
                    <button
                      key={`${item.id}-${item.label}-${itemIdx}`}
                      onClick={() => handleItemClick(item.id as Screen)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-200 group/btn relative ${
                        isActive 
                          ? 'bg-[#D5E2D2] text-[#344633] font-bold shadow-sm' 
                          : 'text-[#5D6B5A] hover:text-[#344633] hover:bg-[#D5E2D2]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon className={`w-[17px] h-[17px] shrink-0 transition-transform ${
                          isActive ? 'text-[#344633] scale-105' : 'text-[#6D7D6A] group-hover/btn:text-[#344633] group-hover/btn:scale-105'
                        }`} />
                        <span className="text-[12px] font-semibold leading-none truncate tracking-wide text-left">{item.label}</span>
                      </div>
                      {isActive ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#344633] shrink-0 shadow-xs" />
                       ) : (
                        <div className="w-1 h-1 rounded-full bg-transparent group-hover/btn:bg-[#344633]/30 transition-colors shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-transparent space-y-1.5 pb-6">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#5D6B5A] hover:text-[#344633] hover:bg-[#D5E2D2]/40 text-[11px] font-bold uppercase tracking-widest transition-all"
        >
          <Globe className="w-4 h-4 text-[#6D7D6A] group-hover:text-[#344633]" />
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>
        <button
          onClick={() => handleItemClick('landing_page')}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 text-[11px] font-bold uppercase tracking-widest transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('exit_portal') || 'Exit Portal'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className={`md:hidden flex items-center justify-between p-4 bg-white text-zinc-800 sticky top-0 z-40 border-b border-[#e2e8f0] shadow-sm`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleItemClick('merchant_dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981]">
            <Anchor className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs tracking-widest uppercase text-zinc-900">USend Merchant</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-slate-50 rounded-xl text-zinc-500 hover:bg-slate-100 transition-colors border border-slate-200"
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
              className="fixed inset-0 bg-slate-900/60 z-50 md:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: isRTL ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '100%' : '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} w-[280px] bg-white z-50 md:hidden shadow-2xl flex flex-col`}
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-zinc-550 border border-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className={`hidden md:flex flex-col w-[260px] h-screen sticky top-0 overflow-hidden shadow-sm border-${isRTL ? 'l' : 'r'} border-[#E2ECE0] bg-[#EFF3EE]`} dir={isRTL ? 'rtl' : 'ltr'}>
        <SidebarContent />
      </div>
    </>
  );
}
