import { Home, MapPin, Wallet, User } from 'lucide-react';
import { Screen } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'motion/react';

interface DriverBottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function DriverBottomNav({ currentScreen, onNavigate }: DriverBottomNavProps) {
  const { t } = useLanguage();

  const navItems = [
    { id: 'driver_home', icon: Home, label: t('home') || 'Home' },
    { id: 'driver_active_job', icon: MapPin, label: t('active_job') || 'Active' },
    { id: 'driver_earnings', icon: Wallet, label: t('earnings') || 'Earnings' },
    { id: 'driver_profile', icon: User, label: t('profile') || 'Profile' },
  ];

  return (
    <div className="absolute bottom-6 left-4 right-4 h-16 bg-white/90 backdrop-blur-xl border border-zinc-200/50 rounded-full shadow-2xl flex items-center justify-between px-2 z-50 transition-colors duration-300">
      {navItems.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as Screen)}
            className={`relative flex items-center justify-center h-10 px-4 rounded-full transition-all duration-300 ${
              isActive 
                ? 'bg-[#f5502c]/10 text-[#f5502c]' 
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              {isActive && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  className="text-sm font-bold overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
