import { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Package } from 'lucide-react';
import { Screen } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SuccessProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function Success({ onNavigate }: SuccessProps) {
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      onNavigate('tracking');
    }, 3000);
    return () => clearTimeout(timer);
  }, [onNavigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-500 flex flex-col items-center justify-center p-8 text-white"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          delay: 0.2, 
          type: "spring",
          stiffness: 260,
          damping: 20 
        }}
        className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 relative"
      >
        <CheckCircle2 className="w-16 h-16 text-emerald-600" />
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          className={`absolute -bottom-2 ${isRTL ? '-left-2' : '-right-2'} w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border-4 border-emerald-600`}
        >
          <Package className="w-5 h-5 text-white" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-3"
      >
        <h2 className="text-3xl font-black tracking-tight">{t('order_confirmed')}</h2>
        <p className="text-emerald-100 font-medium max-w-[250px] mx-auto">
          {t('driver_on_way_notify')}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12"
      >
        <div className="w-8 h-8 rounded-full border-t-2 border-white animate-spin"></div>
      </motion.div>
    </motion.div>
  );
}
