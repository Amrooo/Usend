import { motion, AnimatePresence } from 'motion/react';
import { Bell, MapPin, Package, Clock, ChevronRight, CheckCircle, Shield, Moon, X } from 'lucide-react';
import { Screen } from '../../types';
import DriverBottomNav from '../../components/DriverBottomNav';
import Logo from '../../components/Logo';
import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

interface DriverHomeProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function DriverHome({ onNavigate }: DriverHomeProps) {
  const { t, isRTL } = useLanguage();
  const { activeRequests, updateRequestStatus } = useApp();
  const [isOnline, setIsOnline] = useState(true);
  const [notification, setNotification] = useState<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const displayJobs = activeRequests.filter(r => r.status === 'Pending' && (!r.carrier || r.carrier === 'usend')).map(order => ({
    id: order.id,
    customer: order.name || 'Retail Consignee',
    pickup: order.fromDestination || order.pickupAddress || order.address || 'Dubai Warehouse',
    dropoff: order.toDestination || order.address,
    price: order.value || order.orderAmount || '45.00 AED',
    distance: '4.5 km',
    time: '15 min away',
    type: order.items || order.itemType || 'Parcel',
    items: order.items || order.description || 'Handle with extreme care'
  }));

  useEffect(() => {
    // Initialize audio object
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  useEffect(() => {
    if (!isOnline) return;

    // Simulate a new job arriving after 5 seconds of being online
    const timer = setTimeout(() => {
      const newJob = {
        id: 'TRSH-5510-N',
        customer: 'Emma Watson',
        pickup: '990 Tech Blvd, Innovation Park',
        dropoff: '120 Startup Way, Tech District',
        price: 'AED 55.00',
        distance: '4.5 mi',
        time: '10 min away',
        type: 'Documents',
        items: 'Confidential Legal Papers',
      };

      // Play sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }

      // Show notification
      setNotification(newJob);

      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isOnline]);

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? -100 : 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-white dark:bg-zinc-950 flex flex-col transition-colors duration-300"
    >
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="absolute top-16 left-4 right-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl p-4 shadow-2xl z-50 flex items-start gap-4 border border-zinc-800 dark:border-zinc-200"
          >
            <div className="w-10 h-10 rounded-full bg-[#f5502c] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#f5502c]/30">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm mb-1">New Request: {notification.type}</h4>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">{notification.pickup}</p>
              <div className="flex items-center gap-2">
                <span className="text-blue-400 dark:text-blue-600 font-bold">{notification.price}</span>
                <span className="text-xs text-zinc-500">• {notification.distance}</span>
              </div>
            </div>
            <button 
              onClick={() => setNotification(null)} 
              className="p-1 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto hide-scrollbar pt-20 pb-32 px-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-[#f5502c] p-0.5 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&h=250&auto=format&fit=crop" 
                alt="Driver" 
                className="w-full h-full rounded-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left rtl:text-right">
              <p className="text-[12px] font-bold tracking-widest text-zinc-400 uppercase">{t('good_evening')}</p>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Marcus Driver</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 rounded-full px-3 py-1.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-blue-500' : 'bg-zinc-400'}`}></span>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{isOnline ? 'Online' : 'Offline'}</span>
              <button 
                onClick={() => setIsOnline(!isOnline)}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isOnline ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isOnline ? (isRTL ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 dark:bg-zinc-800 rounded-3xl p-5 text-white shadow-xl shadow-zinc-900/10 dark:shadow-none">
            <p className="text-xs text-zinc-400 mb-1">Today's Earnings</p>
            <h3 className="text-2xl font-bold text-blue-400">AED 142.50</h3>
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-300">
              <CheckCircle className="w-3 h-3 text-blue-500" />
              <span>4 Jobs Completed</span>
            </div>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Acceptance Rate</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">98%</h3>
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <Shield className="w-3 h-3 text-[#f5502c]" />
              <span>Top Rated Driver</span>
            </div>
          </div>
        </div>

        {/* Available Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 transition-colors duration-300">Available Requests</h3>
            {isOnline && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </div>

          {!isOnline ? (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-8 text-center border border-zinc-200 dark:border-zinc-800">
              <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Moon className="w-8 h-8 text-zinc-400" />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">You are offline</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Go online to start receiving delivery requests in your area.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#f5502c]/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-[#f5502c]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{job.type}</h4>
                        <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{job.items}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400">{job.price}</h4>
                      <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{job.distance}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5 relative">
                    <div className={`absolute ${isRTL ? 'right-[11px]' : 'left-[11px]'} top-4 bottom-4 w-0.5 bg-zinc-200 dark:bg-zinc-800`}></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Pickup • {job.time}</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{job.pickup}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Dropoff</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{job.dropoff}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl font-bold text-sm transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700">
                      Decline
                    </button>
                    <button 
                      onClick={() => {
                        updateRequestStatus(job.id, 'En-route');
                        onNavigate('driver_active_job');
                      }}
                      className="flex-[2] py-3 bg-[#f5502c] text-white rounded-xl font-bold text-sm transition-colors hover:bg-[#d44525] shadow-lg shadow-[#f5502c]/20"
                    >
                      Accept Request
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DriverBottomNav currentScreen="driver_home" onNavigate={onNavigate} />
    </motion.div>
  );
}
