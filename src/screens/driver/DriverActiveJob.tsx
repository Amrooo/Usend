import { motion } from 'motion/react';
import { MapPin, Navigation, Phone, MessageSquare, CheckCircle, ChevronLeft, Package, ChevronRight } from 'lucide-react';
import { Screen } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useState } from 'react';

interface DriverActiveJobProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

import { useApp } from '../../context/AppContext';

export default function DriverActiveJob({ onNavigate }: DriverActiveJobProps) {
  const { t, isRTL } = useLanguage();
  const { currentRequest, updateRequestStatus } = useApp();
  const [status, setStatus] = useState<'heading_to_pickup' | 'arrived' | 'in_transit' | 'pod' | 'delivered'>('heading_to_pickup');
  const [podPhoto, setPodPhoto] = useState(false);

  const handleNextStatus = () => {
    if (status === 'heading_to_pickup') setStatus('arrived');
    else if (status === 'arrived') {
       setStatus('in_transit');
       if (currentRequest) updateRequestStatus(currentRequest.id, 'En-route');
    }
    else if (status === 'in_transit') {
       setStatus('pod');
    }
    else if (status === 'pod') {
       if (!podPhoto) return; // Must upload photo
       setStatus('delivered');
       if (currentRequest) updateRequestStatus(currentRequest.id, 'delivered');
    }
    else onNavigate('driver_home');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? -100 : 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-white dark:bg-zinc-950 flex flex-col transition-colors duration-300"
    >
      {/* Map Area */}
      <div className="flex-1 relative bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-50 dark:opacity-30"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(100%) contrast(1.2)'
          }}
        />
        
        {/* Map Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white dark:from-zinc-950/80 dark:to-zinc-950"></div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6 pt-12 flex items-center justify-between z-10">
          <button 
            onClick={() => onNavigate('driver_home')}
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 shadow-lg flex items-center justify-center text-zinc-900 dark:text-white"
          >
            <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {status === 'heading_to_pickup' ? 'Heading to Pickup' : 
               status === 'arrived' ? 'Arrived at Pickup' : 
               status === 'in_transit' ? 'In Transit to Dropoff' : 'Delivered'}
            </span>
          </div>
          <button className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 shadow-lg flex items-center justify-center text-zinc-900 dark:text-white">
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* Route Info Card */}
        <div className="absolute bottom-6 left-6 right-6 bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-zinc-100 dark:border-zinc-800 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&h=250&auto=format&fit=crop" 
                  alt="Customer" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{currentRequest?.name || 'Alex Rivera'}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Customer • 4.9 ★</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700">
                <MessageSquare className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 transition-colors hover:bg-emerald-500/20">
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 my-4"></div>

          <div className="space-y-4 mb-6 relative">
            <div className={`absolute ${isRTL ? 'right-[11px]' : 'left-[11px]'} top-4 bottom-4 w-0.5 bg-zinc-200 dark:bg-zinc-800`}></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center ${status === 'heading_to_pickup' ? 'bg-emerald-500' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                <div className={`w-2 h-2 rounded-full ${status === 'heading_to_pickup' ? 'bg-white' : 'bg-zinc-400'}`}></div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Pickup</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{currentRequest?.fromDestination || '123 Main St, Downtown'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center ${status === 'in_transit' ? 'bg-emerald-500' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                <MapPin className={`w-3 h-3 ${status === 'in_transit' ? 'text-white' : 'text-zinc-400'}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">Dropoff</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{currentRequest?.toDestination || currentRequest?.address || '456 Oak Ave, Westside'}</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl mb-5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Declared Items:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]">{currentRequest?.items || 'Commercial Parcel'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Collect from Receiver:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                AED {currentRequest?.value || currentRequest?.orderAmount || '45.00'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Payment Type:</span>
              <span className="font-extrabold text-[12px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {currentRequest?.paymentMethod === 'card' ? 'Prepaid (Card)' : 'Cash on Delivery (COD)'}
              </span>
            </div>
          </div>

          {status === 'pod' && (
            <div className="mb-6 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-dashed space-y-3 relative">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Proof of Delivery (POD)</h4>
              <p className="text-xs text-zinc-500">Capture photo of the delivered package and recipient confirmation.</p>
              
              <button 
                onClick={() => setPodPhoto(true)}
                className={`w-full py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${podPhoto ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10' : 'border-zinc-300 dark:border-zinc-700 border-dashed text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                <CheckCircle className={`w-5 h-5 ${podPhoto ? 'text-green-500' : ''}`} />
                {podPhoto ? 'Photo Uploaded Successfully' : 'Take Package Photo'}
              </button>
            </div>
          )}

          <button 
            onClick={handleNextStatus}
            disabled={status === 'pod' && !podPhoto}
            className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all duration-300 shadow-xl shadow-zinc-900/10 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'heading_to_pickup' && 'I have arrived at Pickup'}
            {status === 'arrived' && 'Start Transit'}
            {status === 'in_transit' && 'Record Proof of Delivery'}
            {status === 'pod' && 'Complete Delivery'}
            {status === 'delivered' && 'Back to Dashboard'}
            {status !== 'delivered' && <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
