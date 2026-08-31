import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe2, ChevronDown, Bell, LogOut, ArrowUpRight, Menu, X, ArrowRight, Truck, Calculator, Bot, Shield } from 'lucide-react';
import { Screen } from './types';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import LogoIcon from './LogoIcon';
import OrdersBasketDropdown from './OrdersBasketDropdown';

interface HeaderProps {
  onNavigate: (screen: Screen) => void;
  setLoginRole: (role: any) => void;
  setLoginModalOpen: (open: boolean) => void;
  content: any;
  handleScrollTo: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
  forceSolid?: boolean;
}

export default function Header({ onNavigate, setLoginRole, setLoginModalOpen, content, handleScrollTo, forceSolid = false }: HeaderProps) {
  const { user, signOut, activeRequests } = useApp();
  const { language, setLanguage, isRTL } = useLanguage();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [clearedNotifIds, setClearedNotifIds] = useState<string[]>([]);
  
  const dynamicNotifs = useMemo(() => {
    if (!user) return [];

    const userOrders = (activeRequests || []).filter(r => 
      r.userId === user.uid || 
      r.id?.includes(user.uid || '') || 
      user.role === 'admin' || 
      user.role === 'merchant'
    );

    const generated: Array<{
      id: string;
      type: 'order' | 'wallet' | 'courier' | 'system' | 'api';
      titleEn: string;
      titleAr: string;
      descEn: string;
      descAr: string;
      timeEn: string;
      timeAr: string;
      read: boolean;
    }> = [];

    generated.push({
      id: `welcome-${user.uid || user.id || 'usr'}`,
      type: 'system',
      titleEn: `System Active for ${user.name || 'Account'}`,
      titleAr: `النظام نشط لحساب ${user.name || 'المستخدم'}`,
      descEn: `Connected to Aramex, Noon & USend Fleet dispatch network.`,
      descAr: `متصل بشبكة شحن أرامكس، نون، وأسطول يو سيند.`,
      timeEn: 'Active',
      timeAr: 'نشط',
      read: readNotifIds.includes(`welcome-${user.uid || user.id || 'usr'}`)
    });

    userOrders.slice(0, 10).forEach((order) => {
      const isCancelled = (order.status || '').toLowerCase().includes('cancel');
      const isDelivered = (order.status || '').toLowerCase().includes('deliver');
      const isInTransit = !isCancelled && ((order.status || '').toLowerCase().includes('transit') || (order.status || '').toLowerCase().includes('dispatch'));

      if (isCancelled) {
        const cancelId = `order-cancel-${order.id}`;
        generated.push({
          id: cancelId,
          type: 'order',
          titleEn: `Order ${order.id} Cancelled`,
          titleAr: `تم إلغاء الطلب ${order.id}`,
          descEn: order.cancellationReason ? `Reason: ${order.cancellationReason}` : 'Shipment cancelled by system/admin.',
          descAr: order.cancellationReason ? `سبب الإلغاء: ${order.cancellationReason}` : 'تم إلغاء الشحنة وإيقاف مسار التوصيل.',
          timeEn: order.cancelledAt ? new Date(order.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (order.date || 'Cancelled'),
          timeAr: order.cancelledAt ? new Date(order.cancelledAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : (order.date || 'ملغي'),
          read: readNotifIds.includes(cancelId)
        });
      } else if (isDelivered) {
        const delivId = `order-deliv-${order.id}`;
        generated.push({
          id: delivId,
          type: 'courier',
          titleEn: `Shipment ${order.id} Delivered`,
          titleAr: `تم تسليم الشحنة ${order.id}`,
          descEn: `Package successfully delivered to destination recipient.`,
          descAr: `تم تسليم الطرد بنجاح للمستلم في الوجهة.`,
          timeEn: 'Delivered',
          timeAr: 'تم التسليم',
          read: readNotifIds.includes(delivId)
        });
      } else if (isInTransit) {
        const transId = `order-trans-${order.id}`;
        generated.push({
          id: transId,
          type: 'courier',
          titleEn: `Shipment ${order.id} Out for Delivery`,
          titleAr: `الشحنة ${order.id} قيد التوصيل`,
          descEn: `Driver/Courier is on route to recipient. Tracking active.`,
          descAr: `السائق/الناقل في طريقه للمستلم. التتبع نشط.`,
          timeEn: 'In Transit',
          timeAr: 'جاري التوصيل',
          read: readNotifIds.includes(transId)
        });
      } else {
        const notifId = `order-created-${order.id}`;
        generated.push({
          id: notifId,
          type: 'order',
          titleEn: `Order ${order.id} Created`,
          titleAr: `تم إنشاء الطلب ${order.id}`,
          descEn: `Shipment from ${order.fromDestination || order.originCity || 'Dubai'} to ${order.toDestination || order.destinationCity || 'UAE'}.`,
          descAr: `تم تسجيل شحنة من ${order.fromDestination || order.originCity || 'دبي'} إلى ${order.toDestination || order.destinationCity || 'الإمارات'}.`,
          timeEn: order.date || 'Today',
          timeAr: order.date || 'اليوم',
          read: readNotifIds.includes(notifId)
        });
      }
    });

    return generated;
  }, [user, activeRequests, readNotifIds]);

  const notifications = dynamicNotifs.filter(n => !clearedNotifIds.includes(n.id));

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const markAllNotifsAsRead = () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    setReadNotifIds(prev => [...prev, ...unreadIds]);
  };

  const toggleNotifRead = (id: string) => {
    if (!readNotifIds.includes(id)) {
      setReadNotifIds(prev => [...prev, id]);
    }
  };

  const clearAllNotifications = () => {
    setClearedNotifIds(notifications.map(n => n.id));
    setNotifDropdownOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isSolid = isScrolled || forceSolid;

  return (
    <>
      <header className={`z-50 transition-all duration-300 ${
        isSolid 
          ? 'fixed top-2 md:top-0 left-2.5 sm:left-4 md:left-0 right-2.5 sm:right-4 md:right-0 py-2 sm:py-2.5 shadow-md bg-white/95 backdrop-blur-md border border-zinc-100 md:border-b md:border-x-0 md:border-t-0 text-slate-900 px-3 sm:px-5 md:px-10 lg:px-16 rounded-2xl md:rounded-none flex items-center justify-between' 
          : 'absolute top-3 sm:top-6 md:top-8 left-3 sm:left-6 md:left-10 lg:left-20 right-3 sm:right-6 md:right-10 lg:right-20 bg-transparent text-white px-0 py-0 flex items-center justify-between'
      }`}>
        {/* Mobile Menu Button (Hamburger) & Logo Group */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3">
          {/* Mobile Menu Button (Hamburger) */}
          <div className="flex md:hidden items-center">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className={`p-1.5 sm:p-2 rounded-xl transition-all border cursor-pointer ${
                isSolid 
                  ? 'border-zinc-200 text-[#113f36] hover:bg-zinc-100' 
                  : 'border-white/20 text-white hover:bg-white/10'
              }`}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Logo */}
          <div
            className="flex items-center gap-2 md:gap-3 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <LogoIcon className={`h-8 sm:h-10 md:h-12 w-auto transition-all duration-300 shrink-0 ${!isSolid ? 'brightness-0 invert' : ''}`} />
            <div className="hidden sm:flex flex-col text-start">
              <span className={`text-base md:text-xl font-black tracking-tight leading-none transition-colors duration-300 ${isSolid ? 'text-slate-900' : 'text-white'}`}>{isRTL ? 'يوسند' : 'Usend'}</span>
              <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-wider leading-none mt-1 transition-colors duration-300 ${isSolid ? 'text-[#113f36]' : 'text-[#cca073]'}`}>{isRTL ? 'الشحن الذكي' : 'Smart Shipping'}</span>
            </div>
          </div>
        </div>
        
        {/* Navigation Links (Desktop) */}
        <nav className={`hidden md:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm font-medium transition-all duration-300 px-5 lg:px-7 py-2.5 rounded-full ${
          isSolid 
            ? 'text-slate-700 bg-slate-50 border border-slate-200/60' 
            : 'text-white bg-white/10 backdrop-blur-md border border-white/20'
        }`}>
          <a href="#landing-root" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#cca073] transition-colors">{isRTL ? 'الرئيسية' : 'Home'}</a>
          <a href="#services"  onClick={(e) => handleScrollTo(e, 'services')}  className="hover:text-[#cca073] transition-colors">{isRTL ? 'الخدمات' : 'Services'}</a>
          <a href="#solutions" onClick={(e) => handleScrollTo(e, 'solutions')} className="hover:text-[#cca073] transition-colors">{isRTL ? 'الحلول' : 'Resources'}</a>
          <a href="#"     onClick={(e) => { e.preventDefault(); onNavigate('about_us'); }} className="hover:text-[#cca073] transition-colors">{isRTL ? 'من نحن' : 'About'}</a>
          <a href="#"       onClick={(e) => { e.preventDefault(); onNavigate('contact_us'); }} className="hover:text-[#cca073] transition-colors">{isRTL ? 'اتصل بنا' : 'Contact'}</a>
        </nav>

        {/* Right CTA / Logged in User Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3.5 relative">
          
          {/* Active Orders & Shipments Basket Dropdown */}
          <OrdersBasketDropdown onNavigate={onNavigate} isSolidHeader={isSolid} />

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className={`px-2 sm:px-3 py-1.5 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              isSolid 
                ? 'border-zinc-200 text-[#113f36] hover:bg-[#113f36]/5' 
                : 'border-white/20 text-white hover:bg-white/10'
            }`}
            title={language === 'en' ? 'تغيير اللغة إلى العربية' : 'Switch Language to English'}
          >
            <span className="text-sm select-none leading-none">
              {language === 'en' ? '🇦🇪' : '🇬🇧'}
            </span>
            <span className="text-[11px] sm:text-xs font-bold">{language === 'en' ? 'عربي' : 'EN'}</span>
          </button>

          {/* Notification Bell Icon & Dropdown */}
          {user && (
          <div className="relative">
            <button
              onClick={() => { setNotifDropdownOpen(!notifDropdownOpen); if (typeof Notification !== "undefined") { Notification.requestPermission(); } }}
              className={`p-1.5 sm:p-2 rounded-xl transition-all relative cursor-pointer border flex items-center justify-center ${
                isSolid 
                  ? 'border-zinc-200 text-zinc-600 hover:text-[#113f36] hover:bg-zinc-50' 
                  : 'border-white/20 text-white/80 hover:text-white hover:bg-white/10'
              }`}
              title={isRTL ? 'الإشعارات' : 'Notifications'}
            >
              <Bell className="w-4 h-4" />
              {user && unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10B981]"></span>
              )}
            </button>

            <AnimatePresence>
              {notifDropdownOpen && (
                <>
                  {/* Click outside backdrop to close */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotifDropdownOpen(false)}
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className={`fixed left-3 right-3 sm:absolute sm:left-auto top-18 sm:top-full mt-2 sm:mt-3.5 w-auto sm:w-[370px] max-w-[calc(100vw-24px)] bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-4.5 z-50 overflow-hidden ${
                      isRTL 
                        ? 'sm:left-0 sm:origin-top-left' 
                        : 'sm:right-0 sm:origin-top-right'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-black text-sm uppercase text-slate-900">
                          {isRTL ? 'مركز الإشعارات' : 'Notifications'}
                        </span>
                        {unreadNotifsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                            {unreadNotifsCount} {isRTL ? 'جديد' : 'new'}
                          </span>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={markAllNotifsAsRead}
                          className="text-[10px] font-black text-[#113f36] hover:text-[#0d3029] uppercase tracking-wider cursor-pointer bg-none border-none outline-none"
                        >
                          {isRTL ? 'تحديد الكل كمقروء' : 'Mark all read'}
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {!user ? (
                        <div className="py-6 px-4 text-center space-y-3.5 bg-slate-50/60 rounded-xl border border-slate-100 my-1">
                          <div className="w-10 h-10 rounded-2xl bg-[#113f36]/10 text-[#113f36] flex items-center justify-center mx-auto shadow-xs">
                            <Bell className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-sans font-black text-xs text-slate-900 uppercase tracking-wide">
                              {isRTL ? 'مركز الإشعارات المباشرة' : 'Real-Time Notifications'}
                            </h4>
                            <p className="text-[11px] font-medium text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                              {isRTL ? 'يرجى تسجيل الدخول لعرض تتبع شحناتك وتحديثات التوصيل الخاصة بك.' : 'Please sign in to view your real shipment updates, tracking alerts, and account activity.'}
                            </p>
                          </div>
                          <button 
                            onClick={() => { setNotifDropdownOpen(false); setLoginRole('user'); setLoginModalOpen(true); }}
                            className="mt-1 w-full py-2.5 bg-[#113f36] hover:bg-[#0d3029] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {isRTL ? 'تسجيل الدخول الآن' : 'Sign In Now'}
                          </button>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                          {isRTL ? 'لا توجد إشعارات جديدة لشحناتك' : 'No active notifications for your orders'}
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const IconComponent = notif.type === 'order' ? Truck : notif.type === 'wallet' ? Calculator : notif.type === 'api' ? Bot : Shield;
                          return (
                            <div
                              key={notif.id}
                              onClick={() => toggleNotifRead(notif.id)}
                              className={`flex gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                notif.read
                                  ? 'bg-slate-50/50 border-slate-100 text-slate-500'
                                  : 'bg-emerald-50/20 border-emerald-100/50 hover:bg-emerald-50/40 text-slate-800'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                notif.read 
                                  ? 'bg-slate-200/50 text-slate-500' 
                                  : 'bg-[#113f36]/10 text-[#113f36]'
                              }`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className="space-y-1 text-start flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-sans font-black text-[11px] uppercase tracking-wide truncate">
                                    {isRTL ? notif.titleAr : notif.titleEn}
                                  </h4>
                                  <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                                    {isRTL ? notif.timeAr : notif.timeEn}
                                  </span>
                                </div>
                                <p className="text-[11px] leading-relaxed font-medium line-clamp-2">
                                  {isRTL ? notif.descAr : notif.descEn}
                                </p>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 rounded-full bg-emerald-500 self-center shrink-0" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={clearAllNotifications}
                          className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-wider cursor-pointer"
                        >
                          {isRTL ? 'مسح الكل' : 'Clear All'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          )}

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <span className={`text-[12px] font-bold transition-colors hidden lg:inline-block ${isSolid ? 'text-zinc-700' : 'text-slate-100'}`}>
                {isRTL ? 'مرحباً، ' : 'Welcome, '}<span className="underline decoration-[#cca073] decoration-2">{user.name || user.email}</span>
              </span>
              
              {/* Go to Portal Button */}
              <button
                onClick={() => {
                  let dest: Screen = 'user_dashboard';
                  if (user?.role === 'merchant') {
                    dest = 'merchant_dashboard';
                  } else {
                    dest = 'user_dashboard';
                  }
                  onNavigate(dest);
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1 sm:gap-1.5 ${
                  isSolid 
                    ? 'bg-[#113f36] hover:bg-[#0d3029] text-white' 
                    : 'bg-white hover:bg-slate-100 text-zinc-950 shadow-md'
                }`}
              >
                <span>{isRTL ? 'لوحة التحكم' : 'Dashboard'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              {/* Logout Button */}
              <button
                onClick={async () => {
                  await signOut();
                }}
                className={`p-1.5 sm:p-2 rounded-xl transition-colors border cursor-pointer ${
                  isSolid 
                    ? 'border-zinc-200 text-zinc-500 hover:text-red-600 hover:bg-red-50/50' 
                    : 'border-white/20 text-white/80 hover:text-red-400 hover:bg-white/10'
                }`}
                title={isRTL ? 'تسجيل الخروج' : 'Logout'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setLoginRole('user'); setLoginModalOpen(true); }}
              className={`px-3 sm:px-4.5 py-1.5 sm:py-2 rounded-xl font-bold transition-all cursor-pointer shadow-sm text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 shrink-0 ${
                isSolid 
                  ? 'bg-[#113f36] hover:bg-[#0d3029] text-white shadow-[#113f36]/20' 
                  : 'bg-white hover:bg-slate-100 text-zinc-950 shadow-md'
              }`}
            >
              <span>{isRTL ? 'ابدأ الآن' : 'Get Started'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer with Smooth Animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[99999] flex flex-col md:hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: isRTL ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-[85%] max-w-[340px] h-full bg-slate-900 text-white shadow-2xl flex flex-col justify-between overflow-y-auto p-6 z-10 border-r border-white/10"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* Top Drawer Header */}
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <LogoIcon className="h-9 w-auto brightness-0 invert" />
                    <div className="flex flex-col text-start">
                      <span className="text-lg font-black tracking-tight leading-none text-white">{isRTL ? 'يوسند' : 'USend'}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#cca073] mt-0.5">{isRTL ? 'الشحن الذكي' : 'Smart Shipping'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Status Bar in Drawer */}
                {user && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                        {user.role === 'merchant' ? (isRTL ? 'حساب تاجر نشط' : 'Active Merchant') : (isRTL ? 'حساب عميل نشط' : 'Active Account')}
                      </span>
                      <p className="text-xs font-bold text-white truncate mt-0.5">{user.name || user.email}</p>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="mt-6 flex flex-col gap-2 font-black text-base uppercase tracking-wider">
                  <a 
                    href="#landing-root" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      window.scrollTo({ top: 0, behavior: 'smooth' }); 
                      setMobileMenuOpen(false); 
                    }} 
                    className="p-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between text-white/90 hover:text-[#cca073]"
                  >
                    <span>{isRTL ? 'الرئيسية' : 'Home'}</span>
                    <ArrowRight className={`w-4 h-4 text-white/40 ${isRTL ? 'rotate-180' : ''}`} />
                  </a>

                  <a 
                    href="#services"  
                    onClick={(e) => { 
                      handleScrollTo(e, 'services'); 
                      setMobileMenuOpen(false); 
                    }}  
                    className="p-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between text-white/90 hover:text-[#cca073]"
                  >
                    <span>{isRTL ? 'الخدمات والتوصيل' : 'Services & Fleet'}</span>
                    <ArrowRight className={`w-4 h-4 text-white/40 ${isRTL ? 'rotate-180' : ''}`} />
                  </a>

                  <a 
                    href="#solutions" 
                    onClick={(e) => { 
                      handleScrollTo(e, 'solutions'); 
                      setMobileMenuOpen(false); 
                    }} 
                    className="p-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between text-white/90 hover:text-[#cca073]"
                  >
                    <span>{isRTL ? 'الحلول والمزايا' : 'Solutions & API'}</span>
                    <ArrowRight className={`w-4 h-4 text-white/40 ${isRTL ? 'rotate-180' : ''}`} />
                  </a>

                  <a 
                    href="#"     
                    onClick={(e) => { 
                      e.preventDefault();
                      onNavigate('about_us'); 
                      setMobileMenuOpen(false); 
                    }}     
                    className="p-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between text-white/90 hover:text-[#cca073]"
                  >
                    <span>{isRTL ? 'من نحن' : 'About Us'}</span>
                    <ArrowRight className={`w-4 h-4 text-white/40 ${isRTL ? 'rotate-180' : ''}`} />
                  </a>

                  <a 
                    href="#"       
                    onClick={(e) => { 
                      e.preventDefault();
                      onNavigate('contact_us'); 
                      setMobileMenuOpen(false); 
                    }}       
                    className="p-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between text-white/90 hover:text-[#cca073]"
                  >
                    <span>{isRTL ? 'اتصل بنا' : 'Contact Support'}</span>
                    <ArrowRight className={`w-4 h-4 text-white/40 ${isRTL ? 'rotate-180' : ''}`} />
                  </a>
                </div>
              </div>

              {/* Bottom Drawer Actions */}
              <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
                {/* Language Switch Button */}
                <button
                  onClick={() => {
                    setLanguage(language === 'en' ? 'ar' : 'en');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-white/15 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-none">{language === 'en' ? '🇦🇪' : '🇬🇧'}</span>
                    <span>{language === 'en' ? 'تغيير إلى العربية' : 'Switch to English'}</span>
                  </span>
                  <span className="text-[10px] text-[#cca073] font-black">{language === 'en' ? 'العربية' : 'EN'}</span>
                </button>

                {!user ? (
                  <button
                    onClick={() => { 
                      setLoginRole('user'); 
                      setLoginModalOpen(true); 
                      setMobileMenuOpen(false); 
                    }}
                    className="w-full py-3 bg-[#cca073] hover:bg-[#b88c60] text-zinc-950 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                  >
                    <span>{isRTL ? 'تسجيل الدخول / البدء' : 'Sign In / Get Started'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        let dest: Screen = 'user_dashboard';
                        if (user.role === 'merchant') dest = 'merchant_dashboard';
                        onNavigate(dest);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-3 bg-[#cca073] hover:bg-[#b88c60] text-zinc-950 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                    >
                      <span>{isRTL ? 'الانتقال إلى لوحة التحكم' : 'Go to Dashboard'}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        await signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-2.5 bg-white/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isRTL ? 'تسجيل الخروج' : 'Logout'}</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
