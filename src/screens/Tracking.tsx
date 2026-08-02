import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, MapPin, Phone, MessageSquare, Navigation, Package, Star, X } from 'lucide-react';
import { Screen } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

interface TrackingProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function Tracking({ onNavigate }: TrackingProps) {
  const [progress, setProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<'pickup' | 'dropoff' | null>(null);
  const { t, isRTL } = useLanguage();
  const { currentRequest } = useApp();

  useEffect(() => {
    if (!currentRequest) return;
    
    let targetProgress = 0;
    if (currentRequest.status === 'Pending') targetProgress = 10;
    else if (currentRequest.status === 'assigning') targetProgress = 20;
    else if (currentRequest.status === 'En-route') targetProgress = 40;
    else if (currentRequest.status === 'in_transit') targetProgress = 75;
    else if (currentRequest.status === 'delivered') targetProgress = 100;
    else targetProgress = 5;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= targetProgress) {
          clearInterval(interval);
          return targetProgress;
        }
        return prev + 1;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [currentRequest?.status]);

  const etaMinutes = Math.max(0, 18 - Math.floor(progress / 5));
  const isDelivered = progress === 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? -100 : 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-zinc-50 transition-colors duration-300 overflow-hidden"
    >
      {/* Map Area */}
      <div className="absolute inset-0 bg-[#e5e3df]">
        {/* Decorative Map Background */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        {/* Route Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
          <path 
            d="M 80,100 C 150,100 150,250 250,250 S 300,400 200,500" 
            fill="none" 
            stroke="#f5502c" 
            strokeWidth="6" 
            strokeLinecap="round"
            strokeDasharray="10 10"
            className="opacity-20"
          />
          <motion.path 
            d="M 80,100 C 150,100 150,250 250,250 S 300,400 200,500" 
            fill="none" 
            stroke="#f5502c" 
            strokeWidth="6" 
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ ease: "linear" }}
          />
        </svg>

        {/* Pickup Marker */}
        <div className={`absolute top-[85px] ${isRTL ? 'right-[65px]' : 'left-[65px]'} z-10`}>
          <button 
            onClick={() => setSelectedMarker(selectedMarker === 'pickup' ? null : 'pickup')}
            className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-lg relative transition-transform active:scale-90"
          >
            <div className="w-3 h-3 bg-white dark:bg-black rounded-full"></div>
          </button>
          
          <AnimatePresence>
            {selectedMarker === 'pickup' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 p-3 z-50 text-left rtl:text-right"
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedMarker(null); }}
                  className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200`}
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-1">{t('pickup_address')}</p>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{currentRequest?.address || '221B Baker St, London'}</p>
                <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 mt-1">Contact: {currentRequest?.name || 'John Doe'}</p>
                <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">ID: {currentRequest?.id}</p>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-900 border-b border-r border-zinc-100 dark:border-zinc-800 rotate-45"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dropoff Marker */}
        <div className={`absolute top-[485px] ${isRTL ? 'right-[185px]' : 'left-[185px]'} z-10`}>
          <button 
            onClick={() => setSelectedMarker(selectedMarker === 'dropoff' ? null : 'dropoff')}
            className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg relative transition-transform active:scale-90"
          >
            <MapPin className="w-4 h-4 text-white" />
          </button>

          <AnimatePresence>
            {selectedMarker === 'dropoff' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 p-3 z-50 text-left rtl:text-right"
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedMarker(null); }}
                  className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200`}
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-1">{t('dropoff_address')}</p>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{currentRequest?.toDestination || '88 Logistics Way, Palo Alto'}</p>
                <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 mt-1">Status: {currentRequest?.status || 'Pending'}</p>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-900 border-b border-r border-zinc-100 dark:border-zinc-800 rotate-45"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Driver Marker */}
        <motion.div 
          className={`absolute top-[100px] ${isRTL ? 'right-[80px]' : 'left-[80px]'} z-20`}
          animate={{
            x: isRTL ? [0, -70, -170, -120] : [0, 70, 170, 120],
            y: [0, 150, 150, 400],
          }}
          transition={{
            duration: 5,
            ease: "linear",
            times: [0, 0.3, 0.6, 1]
          }}
        >
          <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full shadow-xl flex items-center justify-center border-2 border-[#f5502c] relative">
            <Navigation className={`w-6 h-6 text-[#f5502c] fill-[#f5502c] ${isRTL ? '-rotate-135' : 'rotate-45'}`} />
            <div className={`absolute -bottom-1 ${isRTL ? '-left-1' : '-right-1'} w-4 h-4 bg-[#f5502c] rounded-full border-2 border-white dark:border-zinc-800`}></div>
          </div>
        </motion.div>

        {/* Header Controls */}
        <div className="absolute top-0 inset-x-0 pt-12 p-6 flex items-center justify-between z-30">
          <button 
            onClick={() => onNavigate('home')}
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 shadow-lg flex items-center justify-center text-zinc-900 dark:text-white active:scale-95 transition-all duration-300"
          >
            <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-[#f5502c] rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{t('live_tracking')}</span>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 rounded-t-[2rem] z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-colors duration-300"
        animate={{ y: isMinimized ? 'calc(100% - 80px)' : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          if (info.offset.y > 50) {
            setIsMinimized(true);
          } else if (info.offset.y < -50) {
            setIsMinimized(false);
          }
        }}
      >
        <div 
          className="w-full pt-4 pb-4 cursor-pointer flex flex-col items-center touch-none"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-2"></div>
          {isMinimized && (
            <span className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
              {t('delivery_details') || 'Delivery Details'}
            </span>
          )}
        </div>
        
        <div className="px-6 pb-8">
          <div className="flex items-end justify-between mb-6">
            <div className="text-left rtl:text-right">
              {isDelivered ? (
                <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{t('order_delivered')}</h2>
              ) : (
                <>
                  <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{etaMinutes} {t('min')}</h2>
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t('est_arrival')}</p>
                </>
              )}
            </div>
            <div className="text-right rtl:text-left">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">1.2 mi</p>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t('distance')}</p>
            </div>
          </div>

          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-8">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#f5502c] to-[#d44525] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 mb-6 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                  <img 
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&h=250&auto=format&fit=crop" 
                    alt="Driver" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className={`absolute -bottom-1 ${isRTL ? '-left-1' : '-right-1'} bg-white dark:bg-zinc-900 rounded-full p-0.5 shadow-sm`}>
                  <div className="bg-yellow-400 text-white text-[12px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Star className="w-2 h-2 fill-current" /> 4.9
                  </div>
                </div>
              </div>
              <div className="text-left rtl:text-right">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Marcus T.</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Toyota Prius • ABC 123</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-900 dark:text-white border border-zinc-100 dark:border-zinc-700 active:scale-95 transition-all">
                <MessageSquare className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-full bg-[#f5502c] shadow-sm flex items-center justify-center text-white active:scale-95 transition-all">
                <Phone className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          <div className={`flex items-start gap-4 p-4 rounded-2xl border ${
            isDelivered 
              ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' 
              : 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isDelivered
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-orange-100 dark:bg-orange-900/30 text-[#f5502c] dark:text-[#f5502c]'
            }`}>
              <Package className="w-4 h-4" />
            </div>
            <div className="text-left rtl:text-right">
              <h4 className={`text-sm font-bold mb-1 ${
                isDelivered ? 'text-emerald-900 dark:text-emerald-100' : 'text-orange-900 dark:text-orange-100'
              }`}>
                {isDelivered ? t('order_delivered') : t('picked_up')}
              </h4>
              <p className={`text-xs ${
                isDelivered ? 'text-emerald-700/70 dark:text-emerald-300/70' : 'text-orange-700/70 dark:text-orange-300/70'
              }`}>
                {isDelivered ? 'Your package has been successfully delivered.' : t('driver_on_way')}
              </p>
            </div>
          </div>

          {isDelivered && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onNavigate('completed')}
              className="w-full mt-6 h-14 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-zinc-900 font-bold text-lg shadow-lg transition-transform active:scale-95"
            >
              {t('order_summary')}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
