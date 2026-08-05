import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, Banknote, MapPin, ArrowRight, ChevronRight } from 'lucide-react';
import { Screen } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface OnboardingProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function Onboarding({ onNavigate }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { t, isRTL } = useLanguage();

  const steps = [
    {
      title: t('onboarding_title_1'),
      description: t('onboarding_desc_1'),
      icon: Scan,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: t('onboarding_title_2'),
      description: t('onboarding_desc_2'),
      icon: Banknote,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: t('onboarding_title_3'),
      description: t('onboarding_desc_3'),
      icon: MapPin,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onNavigate('home');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: isRTL ? -100 : 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-white flex flex-col p-8 pt-20 transition-colors duration-300"
    >
      <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} w-full`}>
        <button 
          onClick={() => onNavigate('home')}
          className="text-zinc-500 font-medium text-sm transition-colors duration-300"
        >
          {t('skip')}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center w-full"
          >
            <div className={`w-32 h-32 rounded-full ${steps[currentStep].bgColor} flex items-center justify-center mb-10`}>
              {(() => {
                const Icon = steps[currentStep].icon;
                return <Icon className={`w-16 h-16 ${steps[currentStep].color}`} />;
              })()}
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4 transition-colors duration-300">
              {steps[currentStep].title}
            </h2>
            <p className="text-zinc-500 text-base leading-relaxed max-w-[280px] mx-auto transition-colors duration-300">
              {steps[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full mb-12 flex flex-col items-center gap-8">
        <div className="flex gap-2">
          {steps.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'w-8 bg-gradient-to-r from-blue-700 to-blue-500' 
                  : 'w-2 bg-zinc-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full h-16 bg-zinc-900 dark:bg-zinc-100 rounded-3xl flex items-center justify-center gap-2 text-white dark:text-zinc-900 font-semibold text-lg transition-transform active:scale-95"
        >
          {currentStep === steps.length - 1 ? t('get_started') : t('next')}
          {currentStep === steps.length - 1 ? (
            <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          ) : (
            <ChevronRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          )}
        </button>
      </div>
    </motion.div>
  );
}
