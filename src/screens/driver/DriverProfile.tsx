import { motion } from 'motion/react';
import { User, Settings, CreditCard, Bell, Shield, LogOut, ChevronRight, Moon, Sun, Car } from 'lucide-react';
import { Screen } from '../../types';
import DriverBottomNav from '../../components/DriverBottomNav';
import { useLanguage } from '../../context/LanguageContext';
import { useDarkMode } from '../../hooks/useDarkMode';

interface DriverProfileProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function DriverProfile({ onNavigate }: DriverProfileProps) {
  const { t, isRTL } = useLanguage();
  const { isDark, toggle } = useDarkMode();

  const menuItems = [
    { icon: User, label: t('personal_info') || 'Personal Info' },
    { icon: CreditCard, label: 'Payout Methods' },
    { icon: Bell, label: t('notifications') || 'Notifications' },
    { icon: Shield, label: t('security') || 'Security' },
    { icon: Settings, label: t('settings') || 'Settings' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white dark:bg-zinc-950 flex flex-col transition-colors duration-300"
    >
      <div className="flex-1 overflow-y-auto pt-20 pb-32 px-6">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-emerald-500 p-1">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&h=250&auto=format&fit=crop" 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white dark:border-zinc-950 flex items-center justify-center text-white">
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Marcus Driver</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">marcus.driver@example.com</p>
          <div className="mt-3 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
            Pro Driver
          </div>
        </div>

        <div className="space-y-2">
          {/* Switch to User Mode */}
          <button
            onClick={() => onNavigate('home')}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors group mb-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <User className="w-5 h-5" />
              </div>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">Switch to User Account</span>
            </div>
            <ChevronRight className={`w-5 h-5 text-emerald-600 dark:text-emerald-500 ${isRTL ? 'rotate-180' : ''}`} />
          </button>

          {menuItems.map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-500 transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.label}</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-zinc-300 dark:text-zinc-700 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          ))}

          <button
            onClick={toggle}
            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-500 transition-colors">
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDark ? (isRTL ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'}`}></div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('splash')}
            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group mt-4"
          >
            <div className="flex items-center gap-4 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-bold">{t('logout') || 'Logout'}</span>
            </div>
          </button>
        </div>
      </div>

      <DriverBottomNav currentScreen="driver_profile" onNavigate={onNavigate} />
    </motion.div>
  );
}
