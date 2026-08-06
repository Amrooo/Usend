import { motion } from 'motion/react';
import { User, Settings, CreditCard, Bell, Shield, LogOut, ChevronRight, Moon, Sun, Car, Package, Clock, TrendingUp, Activity, MapPin, Star, CheckCircle2 } from 'lucide-react';
import { Screen } from '../types';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../context/LanguageContext';
import { useDarkMode } from '../hooks/useDarkMode';

interface ProfileProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function Profile({ onNavigate }: ProfileProps) {
  const { t, isRTL } = useLanguage();
  const { isDark, toggle } = useDarkMode();

  const stats = [
    { label: t('total_orders'), value: '24', icon: Package, color: 'text-[#113f36]', bg: 'bg-[#113f36]/5 dark:bg-[#113f36]/10' },
    { label: t('active'), value: '2', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { label: t('total_spent'), value: 'AED 1,240', icon: TrendingUp, color: 'text-[#113f36]', bg: 'bg-[#113f36]/5 dark:bg-[#113f36]/10' },
    { label: t('points'), value: '850', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
  ];

  const recentActivities = [
    { id: 1, title: 'Order Delivered', desc: 'King Size Bed', time: '2 hours ago', icon: CheckCircle2, color: 'text-[#113f36]', bg: 'bg-[#113f36]/10 dark:bg-[#113f36]/20' },
    { id: 2, title: 'Payment Successful', desc: 'AED 120.00 via Visa', time: 'Yesterday', icon: CreditCard, color: 'text-[#113f36]', bg: 'bg-[#113f36]/10 dark:bg-[#113f36]/20' },
    { id: 3, title: 'New Address Added', desc: 'Home - 123 Main St', time: '3 days ago', icon: MapPin, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/20' },
  ];

  const menuItems = [
    { icon: User, label: t('personal_info') || 'Personal Info' },
    { icon: CreditCard, label: t('payment_methods') || 'Payment Methods' },
    { icon: Bell, label: t('notifications') || 'Notifications' },
    { icon: Shield, label: t('security') || 'Security' },
    { icon: Settings, label: t('settings') || 'Settings' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col transition-colors duration-300 overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto pb-40 hide-scrollbar">
        {/* Header Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-b-[2.5rem] shadow-sm mb-6 relative overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-green-400 to-green-600 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-12 right-6">
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="px-6 pb-8 -mt-12 relative z-10">
            <div className="flex justify-between items-end mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-zinc-900 shadow-lg bg-[#113f36] p-0.5">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&h=250&auto=format&fit=crop" 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#113f36] rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-white hover:bg-gradient-to-r from-blue-700 to-blue-500 transition-colors shadow-md">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Alex Rivera</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-3">alex.rivera@example.com</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 text-yellow-700 dark:text-yellow-500 rounded-xl text-xs font-bold uppercase tracking-wider border border-yellow-400/20">
                <Star className="w-3.5 h-3.5 fill-current" /> Premium Member
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 hover:border-[#113f36]/30 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">{stat.value}</h3>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {t('recent_activity')}
              </h3>
              <button 
                onClick={() => onNavigate('orders')}
                className="text-sm font-bold text-[#113f36] dark:text-[#113f36] hover:text-[#113f36] transition-colors"
              >
                View All
              </button>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-2 shadow-sm border border-zinc-100 dark:border-zinc-800">
              {recentActivities.map((activity, i) => (
                <div key={activity.id} className={`flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${i !== recentActivities.length - 1 ? 'mb-1' : ''}`}>
                  <div className={`w-12 h-12 rounded-2xl ${activity.bg} ${activity.color} flex items-center justify-center shrink-0`}>
                    <activity.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{activity.title}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{activity.desc}</p>
                  </div>
                  <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Menu */}
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 px-1">Settings</h3>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-2 shadow-sm border border-zinc-100 dark:border-zinc-800">
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{item.label}</span>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              ))}

              <button
                onClick={toggle}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </div>
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-[#113f36]' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDark ? (isRTL ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'}`}></div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('landing_page')}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group mt-2"
              >
                <div className="flex items-center gap-4 text-red-500">
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm">{t('logout') || 'Logout'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav currentScreen="profile" onNavigate={onNavigate} />
    </motion.div>
  );
}
