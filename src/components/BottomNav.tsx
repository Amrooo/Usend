import { Home, Box, Plus, Wallet, User } from 'lucide-react';
import { Screen } from '../types';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'orders', icon: Box, label: 'Orders' },
    { id: 'details', icon: Plus, label: 'New', isFab: true },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="absolute bottom-6 left-4 right-4 h-16 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-full shadow-2xl flex items-center justify-between px-2 z-50 transition-colors duration-300">
      {navItems.map((item) => {
        const isActive = currentScreen === item.id;
        
        if (item.isFab) {
          return (
            <button 
              key={item.id}
              onClick={() => onNavigate('details')}
              className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 transform transition-all active:scale-95 hover:bg-gradient-to-r from-emerald-700 to-emerald-500 flex-shrink-0"
            >
              <Plus className="w-6 h-6 stroke-[3px]" />
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => item.id !== 'wallet' && onNavigate(item.id as Screen)}
            className={`relative flex items-center justify-center h-10 px-3 rounded-full transition-all duration-300 ${
              isActive 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
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
