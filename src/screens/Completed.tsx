import { useState } from 'react';
import { motion } from 'motion/react';
import { Star, CheckCircle2, MapPin, Package, Heart } from 'lucide-react';
import { Screen } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CompletedProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function Completed({ onNavigate }: CompletedProps) {
  const { t, isRTL } = useLanguage();
  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState<number | null>(null);

  const tips = [2, 5, 10, 15];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col transition-colors duration-300 overflow-hidden"
    >
      <div className="flex-1 flex flex-col px-6 pt-20 pb-32 overflow-y-auto hide-scrollbar">
        {/* Success Header */}
        <div className="flex flex-col items-center justify-center mb-8 mt-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-blue-600 dark:text-blue-500" />
          </motion.div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2">{t('order_delivered')}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">{t('how_was_delivery')}</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 transition-colors duration-300 mb-6">
          <h3 className="text-[12px] font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase mb-4">{t('order_summary')}</h3>
          
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">3 Large Boxes</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">24" x 18" x 18" • 45.2 kg</p>
              </div>
            </div>
            <div className={isRTL ? 'text-left' : 'text-right'}>
              <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">{t('total_paid')}</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">AED 12.50</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">241 Tech Plaza, San Francisco</p>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-3 h-3 text-red-500 flex-shrink-0 -ml-0.5" />
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">88 Logistics Way, Palo Alto</p>
            </div>
          </div>
        </div>

        {/* Driver Rating */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 transition-colors duration-300 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 mb-3">
            <img 
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&h=250&auto=format&fit=crop" 
              alt="Driver" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Marcus T.</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">{t('rate_driver')}</p>
          
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star}
                onClick={() => setRating(star)}
                className="p-1 transition-transform active:scale-90"
              >
                <Star className={`w-8 h-8 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300 dark:text-zinc-700'}`} />
              </button>
            ))}
          </div>

          <div className="w-full border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <p className="text-xs font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase mb-4 text-center">{t('tip_driver')}</p>
            <div className="flex items-center justify-center gap-3">
              {tips.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTip(amount)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all ${
                    tip === amount 
                      ? 'bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-md' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action */}
      <div className="absolute bottom-0 inset-x-0 p-6 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 z-20 transition-colors duration-300">
        <button
          onClick={() => onNavigate('home')}
          className="w-full h-16 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center gap-2 text-white dark:text-zinc-900 font-semibold text-lg shadow-lg transition-transform active:scale-95"
        >
          {t('done')}
        </button>
      </div>
    </motion.div>
  );
}
