import { motion } from 'motion/react';
import { ArrowRight, Globe } from 'lucide-react';
import { Screen } from '../types';
import Logo from '../components/Logo';
import LogoIcon from '../components/LogoIcon';
import { useLanguage } from '../context/LanguageContext';

interface SplashProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function Splash({ onNavigate }: SplashProps) {
  const { t, isRTL, language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-8 pt-10 transition-colors duration-300"
    >
      {/* Navigation - Contained and Rounded */}
      <div className="absolute top-8 md:top-10 inset-x-0 z-[100] px-4 w-full flex items-center justify-center">
        <div className="cursor-pointer text-zinc-900 dark:text-white" onClick={() => onNavigate('landing_page')}>
          <LogoIcon className="w-auto h-20" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full mt-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center space-y-2"
        >
          <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 transition-colors duration-300 italic">
            {t('splash_title')}
          </h2>
          <h3 className="text-xl font-bold tracking-tight text-zinc-600 dark:text-zinc-400 mt-1 transition-colors duration-300 uppercase">
            {t('splash_subtitle')}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-[280px] mx-auto transition-colors duration-300 pt-3">
            {t('splash_desc')}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="w-full mb-12 space-y-4"
      >
        <button
          onClick={() => onNavigate('phone_auth')}
          className="w-full h-16 bg-blue-700 rounded-3xl flex items-center justify-center gap-2 text-white font-semibold text-lg shadow-[0_8px_30px_rgb(21,128,61,0.4)] dark:shadow-none transition-transform active:scale-95"
        >
          {t('get_started')}
          <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
        </button>
        
        <button
          onClick={() => onNavigate('driver_home')}
          className="w-full h-16 bg-zinc-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-lg transition-transform active:scale-95 border border-zinc-200 dark:border-zinc-800"
        >
          {t('driver_mode')}
        </button>
      </motion.div>
    </motion.div>
  );
}
