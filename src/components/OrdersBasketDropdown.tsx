import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Copy, 
  Check, 
  ExternalLink, 
  MapPin, 
  Search, 
  ArrowRight, 
  X, 
  RefreshCw, 
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  Send
} from 'lucide-react';
import { useApp, USendRequest } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from './types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface OrdersBasketDropdownProps {
  onNavigate?: (screen: Screen) => void;
  isSolidHeader?: boolean;
}

export default function OrdersBasketDropdown({ onNavigate, isSolidHeader = false }: OrdersBasketDropdownProps) {
  const { activeRequests, allOrders, user } = useApp();
  const { language, isRTL } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<USendRequest | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<USendRequest | null>(null);
  const [guestOrdersList, setGuestOrdersList] = useState<USendRequest[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load guest orders from localStorage on mount and when orders change
  const refreshGuestOrders = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('guestOrders') || '[]');
      if (Array.isArray(stored)) {
        setGuestOrdersList(stored);
      }
    } catch (e) {
      console.warn('Failed to parse guestOrders:', e);
    }
  };

  useEffect(() => {
    refreshGuestOrders();
    const handleOrderUpdate = () => refreshGuestOrders();
    window.addEventListener('usend_order_updated', handleOrderUpdate);
    window.addEventListener('storage', handleOrderUpdate);
    return () => {
      window.removeEventListener('usend_order_updated', handleOrderUpdate);
      window.removeEventListener('storage', handleOrderUpdate);
    };
  }, []);

  // Compute relevant orders for current user or guest
  const relevantOrders = useMemo(() => {
    const list = [...(activeRequests || []), ...(guestOrdersList || [])];
    const map = new Map<string, USendRequest>();

    list.forEach(order => {
      if (!order || !order.id) return;
      if (user) {
        if (
          order.userId === user.uid ||
          order.merchantId === user.uid ||
          user.role === 'admin' ||
          guestOrdersList.some(g => g.id === order.id)
        ) {
          map.set(order.id, order);
        }
      } else {
        // Guest user on landing page - include all local guest orders or active state
        map.set(order.id, order);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return (dateB || b.id.localeCompare(a.id)) - (dateA || 0);
    });
  }, [activeRequests, guestOrdersList, user]);

  const inTransitCount = useMemo(() => {
    return relevantOrders.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s.includes('transit') || s.includes('route') || s.includes('assign') || s.includes('pending') || s.includes('approved');
    }).length;
  }, [relevantOrders]);

  const totalCount = relevantOrders.length;

  // Copy tracking number
  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Search single order online
  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchedOrder(null);

    try {
      // 1. Check local list first
      const localMatch = relevantOrders.find(o => 
        o.id.toLowerCase() === q.toLowerCase() || 
        o.externalTrackingNumber?.toLowerCase() === q.toLowerCase() ||
        o.noonTaskId?.toLowerCase() === q.toLowerCase()
      );

      if (localMatch) {
        setSearchedOrder(localMatch);
        setIsSearching(false);
        return;
      }

      // 2. Query Firestore directly
      const docRef = doc(db, 'requests', q);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as USendRequest;
        setSearchedOrder({ ...data, id: snap.id });
      } else {
        setSearchError(language === 'ar' ? 'لم يتم العثور على شحنة بهذا الرقم' : 'No shipment found with this tracking ID');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Lock background body scroll when tracking modal is open
  useEffect(() => {
    if (selectedOrderForModal) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      // Prevent layout shift from scrollbar disappearing
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [selectedOrderForModal]);

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('cancel')) {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500',
        label: language === 'ar' ? 'ملغي' : 'Cancelled',
        step: 0,
        isCancelled: true
      };
    }
    if (s.includes('deliver') || s.includes('complete')) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        label: language === 'ar' ? 'تم التوصيل' : 'Delivered',
        step: 4,
        isCancelled: false
      };
    }
    if (s.includes('transit') || s.includes('route') || s.includes('en-route')) {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        dot: 'bg-blue-500 animate-ping',
        label: language === 'ar' ? 'في الطريق' : 'In Transit',
        step: 3,
        isCancelled: false
      };
    }
    if (s.includes('assign')) {
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        dot: 'bg-purple-500',
        label: language === 'ar' ? 'تم تعيين السائق' : 'Driver Assigned',
        step: 2,
        isCancelled: false
      };
    }
    return {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
      label: language === 'ar' ? 'قيد المعالجة' : 'Processing',
      step: 1,
      isCancelled: false
    };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Trigger Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border shadow-xs active:scale-95 ${
          isSolidHeader
            ? isOpen
              ? 'bg-[#113f36] text-white border-[#113f36]'
              : 'border-zinc-200 text-zinc-700 hover:text-[#113f36] hover:bg-zinc-50'
            : isOpen
              ? 'bg-white text-zinc-900 border-white shadow-lg'
              : 'border-white/20 text-white hover:bg-white/10'
        }`}
        title={language === 'ar' ? 'سلة الطلبات والشحنات النشطة' : 'My Orders & Shipments Basket'}
      >
        <div className="relative">
          <ShoppingBag className="w-4 h-4" />
          {inTransitCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </div>

        <span className="hidden sm:inline font-sans text-xs">
          {language === 'ar' ? 'طلباتي' : 'Orders'}
        </span>

        {totalCount > 0 && (
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black transition-colors ${
            isOpen
              ? isSolidHeader ? 'bg-white/20 text-white' : 'bg-zinc-900 text-white'
              : isSolidHeader ? 'bg-[#113f36]/10 text-[#113f36]' : 'bg-white/20 text-white'
          }`}>
            {totalCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`absolute top-full mt-3 w-[360px] sm:w-[420px] max-w-[calc(100vw-24px)] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 rounded-[1.75rem] shadow-2xl z-50 overflow-hidden text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[85vh] ${
                isRTL ? 'left-0 sm:-left-6 origin-top-left' : 'right-[-50px] sm:right-0 origin-top-right'
              }`}
            >
              {/* Top Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-zinc-50/80 to-emerald-50/20 dark:from-zinc-900/80 dark:to-zinc-800/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#113f36] text-white flex items-center justify-center shadow-sm shadow-[#113f36]/20">
                    <Package className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-sm text-zinc-900 dark:text-zinc-100">
                      {language === 'ar' ? 'سلة الشحنات والطلبات' : 'Active Shipments & Basket'}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                      {totalCount > 0 
                        ? (language === 'ar' ? `${totalCount} شحنة مسجلة` : `${totalCount} active trackable shipment${totalCount > 1 ? 's' : ''}`)
                        : (language === 'ar' ? 'لا توجد شحنات جارية' : 'No ongoing orders')
                      }
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Search Bar */}
              <div className="p-3 bg-zinc-50/60 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                <form onSubmit={handleSearchOrder} className="relative flex items-center">
                  <Search className={`w-3.5 h-3.5 text-zinc-400 absolute ${isRTL ? 'right-3' : 'left-3'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'ar' ? 'تتبع أي شحنة (مثال: REQ-1234)...' : 'Search any Tracking or Order #...'}
                    className={`w-full py-2 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-[#113f36] dark:focus:border-[#6d8c55] font-medium transition-all ${
                      isRTL ? 'pr-9 pl-16' : 'pl-9 pr-16'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className={`absolute ${isRTL ? 'left-1.5' : 'right-1.5'} px-2.5 py-1 bg-[#113f36] hover:bg-[#0d3029] disabled:opacity-50 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all`}
                  >
                    {isSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : (language === 'ar' ? 'بحث' : 'Find')}
                  </button>
                </form>

                {searchError && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1.5 px-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {searchError}
                  </p>
                )}
              </div>

              {/* Search Result Card (if searching) */}
              {searchedOrder && (
                <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-800/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      {language === 'ar' ? 'نتيجة البحث' : 'Search Result'}
                    </span>
                    <button onClick={() => setSearchedOrder(null)} className="text-[10px] text-zinc-400 hover:text-zinc-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="bg-white dark:bg-zinc-850 p-3 rounded-xl border border-amber-200/70 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs">{searchedOrder.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(searchedOrder.status).bg}`}>
                        {getStatusBadge(searchedOrder.status).label}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate">
                      {searchedOrder.fromDestination || 'Dubai'} ➔ {searchedOrder.toDestination || searchedOrder.address || 'UAE'}
                    </p>
                    <button
                      onClick={() => setSelectedOrderForModal(searchedOrder)}
                      className="mt-2 w-full py-1.5 bg-[#113f36] text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1"
                    >
                      <span>{language === 'ar' ? 'عرض التتبع الكامل' : 'View Full Tracking'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Orders List Area */}
              <div className="overflow-y-auto max-h-[380px] p-3 sm:p-4 space-y-3.5 scrollbar-thin">
                {relevantOrders.length === 0 ? (
                  /* ── Empty State ── */
                  <div className="py-10 px-4 text-center space-y-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto shadow-inner">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                        {language === 'ar' ? 'لا توجد طلبات سابقة في السلة' : 'No orders in your basket yet'}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[240px] mx-auto leading-relaxed">
                        {language === 'ar' 
                          ? 'عند قيامك بحجز أي شحنة، ستظهر هنا تلقائياً لتتبع حالتها وموقع السائق في أي وقت.' 
                          : 'Book a delivery on USend to track your parcel, driver dispatch, and waybill status in real time here.'
                        }
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsOpen(false);
                        const el = document.getElementById('estimator') || document.getElementById('services');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="mt-2 px-4 py-2 bg-[#113f36] hover:bg-[#0d3029] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'احجز شحنة جديدة' : 'Book a Shipment'}</span>
                    </button>
                  </div>
                ) : (
                  /* ── List of Orders ── */
                  relevantOrders.map((order) => {
                    const statusInfo = getStatusBadge(order.status);
                    const trackingNumber = order.externalTrackingNumber || order.noonTaskId || order.id;
                    const isCopied = copiedId === trackingNumber;

                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedOrderForModal(order);
                          setIsOpen(false);
                        }}
                        className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/70 hover:border-[#113f36] dark:hover:border-[#6d8c55] hover:shadow-md transition-all cursor-pointer group space-y-3"
                      >
                        {/* Order Number & Status Pill */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono font-black text-xs text-zinc-900 dark:text-zinc-100 truncate">
                              {order.id}
                            </span>
                            <button
                              onClick={(e) => handleCopy(trackingNumber, e)}
                              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md transition-colors"
                              title={language === 'ar' ? 'نسخ رقم الشحنة' : 'Copy Tracking Number'}
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1.5 ${statusInfo.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Courier / Carrier Info */}
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                            <Truck className="w-3.5 h-3.5 text-[#113f36] dark:text-[#6d8c55]" />
                            {order.carrier ? (order.carrier.toUpperCase()) : 'USEND SMART FLEET'}
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {order.orderAmount || 'AED 25.00'}
                          </span>
                        </div>

                        {/* Route (From -> To) */}
                        <div className="bg-zinc-50/80 dark:bg-zinc-900/60 p-2.5 rounded-xl text-xs space-y-1.5 border border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 truncate">
                            <div className="w-2 h-2 rounded-full bg-[#113f36] flex-shrink-0" />
                            <span className="truncate">{order.fromDestination || order.pickupAddress || 'Dubai Hub'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold truncate">
                            <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                            <span className="truncate">{order.toDestination || order.address || 'Abu Dhabi, UAE'}</span>
                          </div>
                        </div>

                        {/* Cancellation Notice or Mini Visual Step Bar */}
                        {statusInfo.isCancelled ? (
                          <div className="pt-1">
                            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 p-2 rounded-xl text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                              <span className="font-bold">{language === 'ar' ? 'سبب الإلغاء:' : 'Cancelled:'}</span> {order.cancellationReason || (language === 'ar' ? 'تم إلغاء الطلب' : 'Shipment cancelled')}
                            </div>
                          </div>
                        ) : (
                          <div className="pt-1">
                            <div className="grid grid-cols-4 gap-1">
                              {[1, 2, 3, 4].map((step) => (
                                <div
                                  key={step}
                                  className={`h-1.5 rounded-full transition-all ${
                                    step <= statusInfo.step
                                      ? 'bg-[#113f36] dark:bg-[#6d8c55]'
                                      : 'bg-zinc-100 dark:bg-zinc-700'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex justify-between items-center mt-1.5 text-[10px] text-zinc-400 font-medium">
                              <span>{language === 'ar' ? 'تم الحجز' : 'Booked'}</span>
                              <span>{order.etaTime || '18 mins'}</span>
                              <span className="text-[#113f36] dark:text-[#6d8c55] font-bold group-hover:underline flex items-center gap-0.5">
                                {language === 'ar' ? 'تتبع' : 'Track'}
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Footer Actions */}
              <div className="p-3 sm:p-4 bg-zinc-50/80 dark:bg-zinc-900/80 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.dispatchEvent(new CustomEvent('open-smart-bot'));
                  }}
                  className="px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-[#113f36] dark:hover:text-zinc-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'ar' ? 'مساعدة التتبع' : 'Need Help?'}</span>
                </button>

                {user ? (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (onNavigate) {
                        onNavigate(user.role === 'merchant' ? 'merchant_dashboard' : 'user_dashboard');
                      }
                    }}
                    className="px-3.5 py-1.5 bg-[#113f36] hover:bg-[#0d3029] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{language === 'ar' ? 'لوحة التحكم الكاملة' : 'Open Portal'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      const el = document.getElementById('estimator') || document.getElementById('services');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3.5 py-1.5 bg-[#113f36] hover:bg-[#0d3029] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{language === 'ar' ? 'حساب تكلفة طلب' : 'Get a Quote'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Live Detailed Tracking Modal ── */}
      <AnimatePresence>
        {selectedOrderForModal && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 overscroll-contain select-none"
            onTouchMove={(e) => {
              if (e.target === e.currentTarget) e.preventDefault();
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderForModal(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 p-6 overflow-hidden z-10 max-h-[90vh] flex flex-col overscroll-contain select-text"
              dir={isRTL ? 'rtl' : 'ltr'}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    getStatusBadge(selectedOrderForModal.status).isCancelled 
                      ? 'bg-rose-500/10 text-rose-600' 
                      : 'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100">
                      {language === 'ar' ? 'التتبع المباشر للشحنة' : 'Live Shipment Tracker'}
                    </h3>
                    <p className="font-mono text-xs text-zinc-500">
                      #{selectedOrderForModal.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderForModal(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto py-5 space-y-5 scrollbar-thin">
                {/* Status Hero */}
                {getStatusBadge(selectedOrderForModal.status).isCancelled ? (
                  <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-zinc-950 p-5 rounded-2xl text-white shadow-lg space-y-3 border border-rose-800/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase tracking-widest text-rose-300 font-bold">
                        {selectedOrderForModal.carrier ? selectedOrderForModal.carrier.toUpperCase() : 'USEND LOGISTICS'}
                      </span>
                      <span className="px-3 py-1 bg-rose-500/20 text-rose-200 border border-rose-400/30 backdrop-blur-md rounded-full text-xs font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                        {language === 'ar' ? 'تم إلغاء الشحنة' : 'Order Cancelled'}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-black text-rose-100">
                        {selectedOrderForModal.cancellationReason || (language === 'ar' ? 'تم إلغاء الطلب من قبل الإدارة / العميل' : 'Cancelled by Admin / Customer')}
                      </p>
                      <p className="text-xs text-rose-300/80 font-medium mt-1">
                        {selectedOrderForModal.cancelledAt 
                          ? (language === 'ar' ? `تاريخ الإلغاء: ${new Date(selectedOrderForModal.cancelledAt).toLocaleString('ar-AE')}` : `Cancelled at: ${new Date(selectedOrderForModal.cancelledAt).toLocaleString()}`)
                          : (language === 'ar' ? 'تم إيقاف مسار التوصيل واسترجاع أي مبالغ مستحقة' : 'Delivery stopped. Applicable refunds processed.')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-[#113f36] to-[#0a2721] p-5 rounded-2xl text-white shadow-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase tracking-widest text-[#cca073] font-bold">
                        {selectedOrderForModal.carrier || 'USend Direct Delivery'}
                      </span>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
                        {getStatusBadge(selectedOrderForModal.status).label}
                      </span>
                    </div>
                    <div>
                      <p className="text-2xl font-black">{selectedOrderForModal.etaTime || '18 mins away'}</p>
                      <p className="text-xs text-zinc-300 font-medium">
                        {language === 'ar' ? 'الوقت التقديري لوصول السائق' : 'Estimated courier arrival time'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Route Cards */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 space-y-3 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        {language === 'ar' ? 'نقطة الاستلام' : 'Pickup Origin'}
                      </p>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {selectedOrderForModal.fromDestination || selectedOrderForModal.pickupAddress || 'Dubai Hub'}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-200 dark:bg-zinc-700 ml-9" />

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        {language === 'ar' ? 'عنوان التسليم' : 'Delivery Destination'}
                      </p>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {selectedOrderForModal.toDestination || selectedOrderForModal.address || 'Abu Dhabi, UAE'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tracking Milestones Timeline */}
                <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500">
                    {language === 'ar' ? 'سجل مراحل الشحنة' : 'Shipment Timeline'}
                  </h4>

                  <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-700">
                    {/* Step 1: Created */}
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{language === 'ar' ? 'تم إنشاء الطلب وتأكيده' : 'Order Created & Confirmed'}</p>
                        <p className="text-[10px] text-zinc-400">{selectedOrderForModal.date || 'Today'}</p>
                      </div>
                    </div>

                    {getStatusBadge(selectedOrderForModal.status).isCancelled ? (
                      /* Cancelled Step Milestone */
                      <>
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-xs">
                            <X className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{language === 'ar' ? 'تم إلغاء الشحنة' : 'Shipment Cancelled'}</p>
                            <p className="text-[10px] text-rose-500 font-semibold">
                              {selectedOrderForModal.cancellationReason ? `Reason: ${selectedOrderForModal.cancellationReason}` : (language === 'ar' ? 'تم إيقاف عملية الشحن' : 'Delivery aborted')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 relative z-10 opacity-40">
                          <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-400 flex items-center justify-center text-xs">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold line-through">{language === 'ar' ? 'التوصيل والاستلام' : 'Delivery & Handoff'}</p>
                            <p className="text-[10px] text-zinc-400">{language === 'ar' ? 'تم الإلغاء' : 'Cancelled'}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Step 2: Waybill */}
                        <div className="flex items-center gap-3 relative z-10">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            getStatusBadge(selectedOrderForModal.status).step >= 2
                              ? 'bg-emerald-500 text-white'
                              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                          }`}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{language === 'ar' ? 'تجهيز بوليصة الشحن وتعيين الناقل' : 'Waybill Prepared & Carrier Assigned'}</p>
                            <p className="text-[10px] text-zinc-400">
                              {selectedOrderForModal.externalTrackingNumber ? `AWB #${selectedOrderForModal.externalTrackingNumber}` : 'Pending assignment'}
                            </p>
                          </div>
                        </div>

                        {/* Step 3: Out for Delivery */}
                        <div className="flex items-center gap-3 relative z-10">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            getStatusBadge(selectedOrderForModal.status).step >= 3
                              ? 'bg-emerald-500 text-white'
                              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                          }`}>
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{language === 'ar' ? 'السائق في الطريق للتسليم' : 'Courier Out for Delivery'}</p>
                            <p className="text-[10px] text-zinc-400">
                              {selectedOrderForModal.noonDriverName ? `Rider: ${selectedOrderForModal.noonDriverName}` : 'Driver on the way'}
                            </p>
                          </div>
                        </div>

                        {/* Step 4: Delivered */}
                        <div className="flex items-center gap-3 relative z-10">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            getStatusBadge(selectedOrderForModal.status).step >= 4
                              ? 'bg-emerald-500 text-white'
                              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{language === 'ar' ? 'تم استلام الشحنة وتوقيع الإيصال' : 'Shipment Delivered & Signed'}</p>
                            <p className="text-[10px] text-zinc-400">{getStatusBadge(selectedOrderForModal.status).step >= 4 ? 'Completed' : 'Pending'}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    const text = `Hi, I am inquiring about my USend shipment #${selectedOrderForModal.id}`;
                    window.open(`https://wa.me/971500000000?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-500" />
                  <span>WhatsApp Support</span>
                </button>

                <button
                  onClick={() => setSelectedOrderForModal(null)}
                  className="px-6 py-2.5 bg-[#113f36] hover:bg-[#0d3029] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
