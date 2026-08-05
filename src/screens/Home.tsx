import { motion, AnimatePresence } from 'motion/react';
import { Bell, Mic, Sofa, Monitor, FileText, Package, MapPin, Sun, Moon, Languages, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Screen } from '../types';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import { useDarkMode } from '../hooks/useDarkMode';
import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const ACTION_IMAGES: Record<string, string> = {
  'furniture': 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=400&auto=format&fit=crop',
  'electronics': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=400&auto=format&fit=crop',
  'documents': 'https://images.unsplash.com/photo-1586769852044-692d6e671f0a?q=80&w=400&auto=format&fit=crop',
  'custom': ''
};

interface HomeProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { isDark, toggle } = useDarkMode();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const { activeRequests, user, setCurrentRequest } = useApp();
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Find active orders
  const storedGuestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
  const myActiveOrders = activeRequests.filter(req => 
    (user?.uid && req.userId === user.uid && req.status !== 'delivered') ||
    (!user?.uid && storedGuestOrders.some((g: any) => g.id === req.id) && req.status !== 'delivered')
  );

  const latestOrder = myActiveOrders[0];

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingIdInput.trim()) return;
    
    const cleanId = trackingIdInput.trim().toUpperCase();
    const req = activeRequests.find(r => r.id === cleanId || r.id.replace(/\D/g, '') === cleanId.replace(/\D/g, ''));
    if (req) {
      setCurrentRequest(req);
      onNavigate('tracking');
    } else {
      setTrackingError(t('order_not_found') || 'Order not found. Check the ID.');
      setTimeout(() => setTrackingError(null), 3000);
    }
  };

  const notifications = [
    { id: 1, title: 'Shipment Delivered', message: 'Your furniture shipment has been delivered successfully.', time: '2h ago', icon: CheckCircle, color: 'text-blue-500' },
    { id: 2, title: 'Driver Arriving', message: 'Your driver is 5 minutes away from the pickup location.', time: '45m ago', icon: Clock, color: 'text-blue-500' },
    { id: 3, title: 'Payment Confirmed', message: 'Payment for order #MRSL-9921-X has been processed.', time: '1h ago', icon: CheckCircle, color: 'text-blue-500' },
    { id: 4, title: 'New Message', message: 'Driver Alex Rivera sent you a message.', time: '10m ago', icon: AlertCircle, color: 'text-orange-500' },
  ];

  const quickActions = [
    { id: 'furniture', icon: Sofa, label: t('furniture'), sub: t('sofas_beds'), color: 'bg-red-500/10 text-red-500' },
    { id: 'electronics', icon: Monitor, label: t('electronics'), sub: t('tv_pc'), color: 'bg-blue-500/10 text-blue-500' },
    { id: 'documents', icon: FileText, label: t('documents'), sub: t('legal_files'), color: 'bg-orange-500/10 text-orange-500' },
    { id: 'custom', icon: Package, label: t('custom_load'), sub: t('specialized'), color: 'bg-blue-500 text-white', isSolid: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? -100 : 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-white flex flex-col transition-colors duration-300"
    >
      <div className="flex-1 overflow-y-auto hide-scrollbar pt-20 pb-32 px-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-200 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&h=250&auto=format&fit=crop" 
                alt="User" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left rtl:text-right">
              <p className="text-[12px] font-bold tracking-widest text-zinc-400 uppercase">{t('good_evening')}</p>
              <h2 className="text-lg font-bold text-zinc-900">Alex Rivera</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center transition-colors duration-300"
              title="Toggle Language"
            >
              <Languages className="w-4 h-4" />
            </button>
            <button 
              onClick={toggle}
              className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center transition-colors duration-300"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowNotifications(true)}
              className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center relative transition-colors duration-300"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full border-2 border-zinc-900"></span>
            </button>
          </div>
        </div>

        {/* Logo & Greeting */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Logo className="origin-center" />
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight px-4 transition-colors duration-300">
            {t('what_moving')}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[260px] transition-colors duration-300">
            {t('describe_items')}
          </p>
        </div>

        {/* Voice Input */}
        <button 
          onClick={() => onNavigate('details')}
          className="w-full h-16 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center px-4 gap-3 shadow-sm dark:shadow-none active:scale-[0.98] transition-all duration-300"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          <span className="flex-1 text-left rtl:text-right text-zinc-500 dark:text-zinc-400 text-sm">e.g. 'I need to move a king size bed'</span>
          <Mic className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
        </button>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 transition-colors duration-300">{t('quick_actions')}</h3>
            <button className="text-xs font-bold text-blue-600 dark:text-blue-500 tracking-wider uppercase">{t('see_all')}</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                onClick={() => onNavigate('details')}
                className={`p-5 rounded-3xl flex flex-col items-start gap-4 text-left rtl:text-right transition-all duration-300 active:scale-95 relative overflow-hidden ${
                  action.isSolid 
                    ? 'bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg shadow-green-600/30 dark:shadow-none' 
                    : 'bg-zinc-900 text-white border border-zinc-800'
                }`}
              >
                {ACTION_IMAGES[action.id] && (
                  <div 
                    className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} w-40 h-40 pointer-events-none z-0`}
                    style={{
                      backgroundImage: `url(${ACTION_IMAGES[action.id]})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      maskImage: `radial-gradient(circle at ${isRTL ? '100% 0%' : '0% 0%'}, black 20%, transparent 80%)`,
                      WebkitMaskImage: `radial-gradient(circle at ${isRTL ? '100% 0%' : '0% 0%'}, black 20%, transparent 80%)`,
                      opacity: 0.3,
                      filter: 'grayscale(100%) brightness(1.2) contrast(1.2)',
                      mixBlendMode: 'luminosity'
                    }}
                  />
                )}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative z-10 ${action.isSolid ? 'bg-white/20' : action.color}`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <h4 className="font-bold mb-1">{action.label}</h4>
                  <p className={`text-xs ${action.isSolid ? 'text-blue-100' : 'text-zinc-400'}`}>{action.sub}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Active Shipment or Tracking Search */}
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 transition-colors duration-300">
            {latestOrder ? t('active_shipment') : 'Track Delivery'}
          </h3>
          
          {latestOrder ? (
            <button 
              onClick={() => {
                setCurrentRequest(latestOrder);
                onNavigate('tracking');
              }}
              className="w-full text-left rtl:text-right bg-zinc-900 dark:bg-zinc-800 rounded-3xl p-5 text-white shadow-xl shadow-zinc-900/10 dark:shadow-none transition-all duration-300 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold tracking-widest text-zinc-500 uppercase mb-0.5">ID: {latestOrder.id}</p>
                    <h4 className="font-bold text-sm">
                      {latestOrder.status === 'Pending' ? t('pending') : latestOrder.status === 'in_transit' || latestOrder.status === 'En-route' ? t('in_transit') : latestOrder.status}
                    </h4>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full border border-blue-500/30 text-blue-400 text-[12px] font-bold tracking-wider uppercase bg-blue-500/10">
                  Active
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="h-1.5 w-full bg-zinc-800 dark:bg-zinc-700 rounded-full overflow-hidden transition-colors duration-300">
                  <div 
                    className="h-full bg-blue-500 rounded-full relative"
                    style={{ width: latestOrder.status === 'Pending' ? '15%' : latestOrder.status === 'En-route' ? '40%' : '75%' }}
                  >
                    <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]`}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="truncate max-w-[150px]">{latestOrder.pickupAddress}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {latestOrder.etaTime || '45 min'}</span>
                </div>
              </div>
            </button>
          ) : (
            <form onSubmit={handleTrackSubmit} className="space-y-3">
              <div className="relative">
                <input 
                  type="text" 
                  value={trackingIdInput}
                  onChange={(e) => setTrackingIdInput(e.target.value)}
                  placeholder="Enter Tracking / Order ID (e.g. REQ-1234)"
                  className="w-full h-14 bg-zinc-100 dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 rounded-2xl pl-4 pr-16 text-sm font-bold outline-none focus:border-blue-500 transition-colors text-zinc-900 dark:text-white"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-2 h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Track
                </button>
              </div>
              {trackingError && (
                <p className="text-xs font-bold text-rose-500 pl-2">{trackingError}</p>
              )}
            </form>
          )}
        </div>
      </div>

      <BottomNav currentScreen="home" onNavigate={onNavigate} />

      {/* Notifications Overlay */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowNotifications(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('notifications')}</h3>
                </div>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex gap-4 transition-colors duration-300"
                  >
                    <div className={`mt-1 ${notif.color}`}>
                      <notif.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{notif.title}</h4>
                        <span className="text-[12px] text-zinc-400 font-medium tracking-wider uppercase">{notif.time}</span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 pt-2">
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all duration-300"
                >
                  {t('close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
