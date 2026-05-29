import { motion } from 'motion/react';
import { Wallet, TrendingUp, Calendar, ChevronRight, Download } from 'lucide-react';
import { Screen } from '../../types';
import DriverBottomNav from '../../components/DriverBottomNav';
import { useLanguage } from '../../context/LanguageContext';

interface DriverEarningsProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function DriverEarnings({ onNavigate }: DriverEarningsProps) {
  const { t, isRTL } = useLanguage();

  const history = [
    { id: 'TRSH-9921-X', date: 'Today, 2:30 PM', amount: '+AED 45.00', status: 'Completed' },
    { id: 'TRSH-8842-Y', date: 'Today, 11:15 AM', amount: '+AED 32.50', status: 'Completed' },
    { id: 'TRSH-7711-Z', date: 'Yesterday, 4:00 PM', amount: '+AED 85.00', status: 'Completed' },
    { id: 'TRSH-6633-W', date: 'Yesterday, 1:20 PM', amount: '+AED 25.00', status: 'Completed' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? -100 : 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-white dark:bg-zinc-950 flex flex-col transition-colors duration-300"
    >
      <div className="flex-1 overflow-y-auto hide-scrollbar pt-20 pb-32 px-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Earnings</h2>
          <button className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-white">
            <Calendar className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-zinc-900 dark:bg-zinc-800 rounded-3xl p-6 text-white shadow-xl shadow-zinc-900/10 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-400">Available Balance</p>
              <div className="flex items-center gap-1 text-blue-400 text-xs font-bold bg-blue-500/10 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                <span>+12.5%</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-6">AED 845.50</h1>
            
            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors hover:bg-gradient-to-r from-blue-700 to-blue-500 shadow-lg shadow-green-500/20">
                Cash Out
              </button>
              <button className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">This Week</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">AED 425.00</h3>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Trips</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">24</h3>
          </div>
        </div>

        {/* History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 transition-colors duration-300">Recent Transactions</h3>
            <button className="text-xs font-bold text-blue-600 dark:text-blue-500 tracking-wider uppercase">See All</button>
          </div>
          
          <div className="space-y-3">
            {history.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-500">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{item.id}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-blue-600 dark:text-blue-400">{item.amount}</h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{item.status}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <DriverBottomNav currentScreen="driver_earnings" onNavigate={onNavigate} />
    </motion.div>
  );
}
