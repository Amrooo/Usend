import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe2, ChevronDown, Bell, LogOut, ArrowUpRight, Menu, X, ArrowRight, Truck, Calculator, Bot, Shield } from 'lucide-react';
import { Screen } from './types';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import LogoIcon from './LogoIcon';

interface HeaderProps {
  onNavigate: (screen: Screen) => void;
  setLoginRole: (role: any) => void;
  setLoginModalOpen: (open: boolean) => void;
  content: any;
  handleScrollTo: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
  forceSolid?: boolean;
}

export default function Header({ onNavigate, setLoginRole, setLoginModalOpen, content, handleScrollTo, forceSolid = false }: HeaderProps) {
  const { user, signOut } = useApp();
  const { language, setLanguage, isRTL } = useLanguage();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  
  // Mock notifications
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [clearedNotifIds, setClearedNotifIds] = useState<string[]>([]);
  
  const mockNotifs = [
    {
      id: '1',
      type: 'order',
      titleEn: 'System Update', titleAr: 'تحديث النظام',
      descEn: 'We have updated our terms of service.', descAr: 'لقد قمنا بتحديث شروط الخدمة الخاصة بنا.',
      timeEn: '2h ago', timeAr: 'قبل ساعتين',
      read: false
    },
    {
      id: '2',
      type: 'wallet',
      titleEn: 'New Shipment Alert', titleAr: 'تنبيه شحنة جديدة',
      descEn: 'Your shipment #12345 has been delivered.', descAr: 'تم توصيل شحنتك رقم 12345.',
      timeEn: '5h ago', timeAr: 'قبل 5 ساعات',
      read: false
    },
    {
      id: '3',
      type: 'api',
      titleEn: 'Welcome Message', titleAr: 'رسالة ترحيبية',
      descEn: 'Welcome to Usend logistics platform.', descAr: 'مرحبا بك في منصة يوسند اللوجستية.',
      timeEn: '1d ago', timeAr: 'قبل يوم',
      read: true
    }
  ];

  const notifications = mockNotifs
    .filter(n => !clearedNotifIds.includes(n.id))
    .map(n => ({ ...n, read: n.read || readNotifIds.includes(n.id) }));

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
    setClearedNotifIds(mockNotifs.map(n => n.id));
    setNotifDropdownOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isSolid = isScrolled || forceSolid;

  return (
    <>
      <header className={`z-50 transition-all duration-300 ${
        isSolid 
          ? 'fixed top-2 md:top-0 left-3 md:left-0 right-3 md:right-0 py-2.5 shadow-md bg-white/95 backdrop-blur-md border border-zinc-100 md:border-b md:border-x-0 md:border-t-0 text-slate-900 px-4 md:px-16 rounded-2xl md:rounded-none flex items-center justify-between' 
          : 'absolute top-8 left-6 md:left-24 right-6 md:right-24 bg-transparent text-white px-0 py-0 flex items-center justify-between'
      }`}>
        {/* Mobile Menu Button (Hamburger) & Logo Group */}
        <div className="flex items-center gap-2 md:gap-0">
          {/* Mobile Menu Button (Hamburger) */}
          <div className="flex md:hidden items-center gap-2">
            <button 
              onClick={() => {
                const menu = document.getElementById('mobile-nav-overlay');
                if (menu) menu.style.display = 'flex';
              }}
              className={`p-2 rounded-lg transition-all border ${
                isSolid 
                  ? 'border-zinc-200 text-[#113f36] hover:bg-zinc-50' 
                  : 'border-white/20 text-white hover:bg-white/10'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Logo */}
          <div
            className="flex items-center gap-2 md:gap-3.5 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <LogoIcon className={`h-10 md:h-13 w-auto transition-all duration-300 ${!isSolid ? 'brightness-0 invert' : ''}`} />
            <div className="hidden md:flex flex-col text-start">
              <span className={`text-lg md:text-xl font-black tracking-tight leading-none transition-colors duration-300 ${isSolid ? 'text-slate-900' : 'text-white'}`}>{isRTL ? 'يوسند' : 'Usend'}</span>
              <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider leading-none mt-1 md:mt-1.5 transition-colors duration-300 ${isSolid ? 'text-[#113f36]' : 'text-[#cca073]'}`}>{isRTL ? 'الشحن الذكي' : 'Smart Shipping'}</span>
            </div>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div className={`hidden md:flex items-center gap-6 text-[15px] font-medium transition-all duration-300 px-8 py-3 rounded-full ${
          isSolid 
            ? 'text-slate-700 bg-slate-50 border border-slate-200/60' 
            : 'text-white bg-white/10 backdrop-blur-md border border-white/20'
        }`}>
          <a href="#landing-root" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#cca073] transition-colors">{isRTL ? 'الرئيسية' : 'Home'}</a>
          <a href="#services"  onClick={(e) => handleScrollTo(e, 'services')}  className="hover:text-[#cca073] transition-colors">{isRTL ? 'الخدمات' : 'Services'}</a>
          <a href="#solutions" onClick={(e) => handleScrollTo(e, 'solutions')} className="hover:text-[#cca073] transition-colors">{isRTL ? 'الحلول' : 'Resources'}</a>
          <a href="#"     onClick={(e) => onNavigate('about_us')}     className="hover:text-[#cca073] transition-colors">{isRTL ? 'من نحن' : 'About'}</a>
          <a href="#"       onClick={(e) => onNavigate('contact_us')}       className="hover:text-[#cca073] transition-colors">{isRTL ? 'اتصل بنا' : 'Contact'}</a>
        </div>

        {/* Right CTA / Logged in User Menu */}
        <div className="flex items-center gap-3 md:gap-4 relative">
          
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className={`hidden md:flex px-3 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer items-center gap-2 ${
              isSolid 
                ? 'border-zinc-200 text-[#113f36] hover:bg-[#113f36]/5' 
                : 'border-white/20 text-white hover:bg-white/10'
            }`}
            title={language === 'en' ? 'تغيير اللغة إلى العربية' : 'Switch Language to English'}
          >
            <span className="text-sm select-none leading-none">
              {language === 'en' ? '🇦🇪' : '🇬🇧'}
            </span>
            <span>{language === 'en' ? 'العربية' : 'EN'}</span>
          </button>

          {/* Notification Bell Icon & Dropdown */}
          {user && (
          <div className="relative">
            <button
              onClick={() => { setNotifDropdownOpen(!notifDropdownOpen); if (typeof Notification !== "undefined") { Notification.requestPermission(); } }}
              className={`p-2 rounded-lg transition-all relative cursor-pointer border flex items-center justify-center ${
                isSolid 
                  ? 'border-zinc-200 text-zinc-500 hover:text-[#113f36] hover:bg-zinc-50' 
                  : 'border-white/20 text-white/80 hover:text-white hover:bg-white/10'
              }`}
              title={isRTL ? 'الإشعارات' : 'Notifications'}
            >
              <Bell className="w-4 h-4" />
              {user && unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
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
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute top-full mt-3.5 w-[330px] sm:w-[370px] max-w-[calc(100vw-32px)] bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-4.5 z-50 overflow-hidden ${
                      isRTL 
                        ? 'left-0 sm:-left-4 origin-top-left' 
                        : 'right-[-60px] sm:right-0 origin-top-right'
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
            <div className="flex items-center gap-3">
              <span className={`text-[12px] font-bold transition-colors hidden sm:inline-block ${isSolid ? 'text-zinc-700' : 'text-slate-100'}`}>
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
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                  isSolid 
                    ? 'bg-[#113f36] hover:bg-[#0d3029] text-white' 
                    : 'bg-white hover:bg-slate-100 text-zinc-950 shadow-md'
                }`}
              >
                {isRTL ? 'لوحة التحكم' : 'Dashboard'}
              </button>

              {/* Logout Button */}
              <button
                onClick={async () => {
                  await signOut();
                }}
                className={`p-2 rounded-lg transition-colors border cursor-pointer ${
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
              className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg font-bold transition-all cursor-pointer shadow-sm text-[11px] sm:text-[15px] flex items-center gap-1.5 sm:gap-2 ${
                isSolid 
                  ? 'bg-[#113f36] hover:bg-[#0d3029] text-white' 
                  : 'bg-white hover:bg-slate-100 text-zinc-950 shadow-md'
              }`}
            >
              {isRTL ? 'ابدأ الآن' : 'Get Started'}
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </header>
      <div 
        id="mobile-nav-overlay"
        className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex-col hidden md:hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <LogoIcon className="h-10 w-auto brightness-0 invert" />
            <span className="text-xl font-black text-white">{isRTL ? 'يو سند' : 'USend'}</span>
          </div>
          <button 
            onClick={() => {
              const menu = document.getElementById('mobile-nav-overlay');
              if (menu) menu.style.display = 'none';
            }}
            className="p-2 rounded-lg bg-white/10 text-white border border-white/20"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-8 text-2xl font-black uppercase tracking-widest text-white/90">
          <a href="#landing-root" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); document.getElementById('mobile-nav-overlay')!.style.display = 'none'; }} className="hover:text-[#cca073] transition-colors">{isRTL ? 'الرئيسية' : 'Home'}</a>
          <a href="#services"  onClick={(e) => { handleScrollTo(e, 'services'); document.getElementById('mobile-nav-overlay')!.style.display = 'none'; }}  className="hover:text-[#cca073] transition-colors">{isRTL ? 'الخدمات' : 'Services'}</a>
          <a href="#solutions" onClick={(e) => { handleScrollTo(e, 'solutions'); document.getElementById('mobile-nav-overlay')!.style.display = 'none'; }} className="hover:text-[#cca073] transition-colors">{isRTL ? 'الحلول' : 'Resources'}</a>
          <a href="#"     onClick={(e) => { onNavigate('about_us'); document.getElementById('mobile-nav-overlay')!.style.display = 'none'; }}     className="hover:text-[#cca073] transition-colors">{isRTL ? 'من نحن' : 'About'}</a>
          <a href="#"       onClick={(e) => { onNavigate('contact_us'); document.getElementById('mobile-nav-overlay')!.style.display = 'none'; }}       className="hover:text-[#cca073] transition-colors">{isRTL ? 'اتصل بنا' : 'Contact'}</a>
          
          {/* Language Switcher in Mobile Drawer */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="mt-4 px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
            title={language === 'en' ? 'تغيير اللغة إلى العربية' : 'Switch Language to English'}
          >
            <span className="text-base select-none leading-none">
              {language === 'en' ? '🇦🇪' : '🇬🇧'}
            </span>
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>
        <div className="p-10 border-t border-white/10 flex flex-col gap-4">
           {!user ? (
             <button
               onClick={() => { setLoginRole('user'); setLoginModalOpen(true); document.getElementById('mobile-nav-overlay')!.style.display = 'none'; }}
               className="w-full py-3 bg-white text-zinc-950 rounded-xl font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2"
             >
               {isRTL ? 'ابدأ الآن' : 'Get Started'}
               <ArrowUpRight className="w-4 h-4" />
             </button>
           ) : (
             <button
                onClick={() => {
                  let dest: Screen = 'user_dashboard';
                  if (user.role === 'merchant') dest = 'merchant_dashboard';
                  onNavigate(dest);
                  document.getElementById('mobile-nav-overlay')!.style.display = 'none';
                }}
                className="w-full py-3 bg-white text-zinc-950 rounded-xl font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2"
              >
                {isRTL ? 'لوحة التحكم' : 'Dashboard'}
              </button>
           )}
        </div>
      </div>

    </>
  );
}
