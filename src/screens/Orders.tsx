import { motion } from 'motion/react';
import { Package, ChevronRight, Clock, CheckCircle2, Filter, Search } from 'lucide-react';
import { Screen } from '../types';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

interface OrdersProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function Orders({ onNavigate }: OrdersProps) {
  const { t, isRTL } = useLanguage();
  const { activeRequests, user } = useApp();

  const storedGuestData = JSON.parse(localStorage.getItem('guestOrders') || '[]');
  const storedGuestIds = storedGuestData.map((g: any) => g.id);
  const myRequests = activeRequests.filter((req: any) => 
    (user?.uid && (req.userId === user.uid || req.phone === user.phoneNumber || storedGuestIds.includes(req.id))) || 
    (!user?.uid && (req.applicantType === 'Individual User' || req.applicantType === 'User' || storedGuestIds.includes(req.id)))
  );

  const orders = myRequests.map((r: any) => ({
    id: r.id,
    status: r.status,
    date: r.date || 'Today',
    items: r.itemType || r.description || 'Package Shipment',
    price: `${parseFloat(String(r.orderAmount || '30').replace(/[^0-9.]/g, ''))} AED`,
    active: r.status !== 'delivered' && r.status !== 'Rejected'
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-zinc-50 flex flex-col transition-colors duration-300"
    >
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="bg-white pt-20 pb-6 px-6 rounded-b-[2.5rem] shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight transition-colors duration-300">
                {t('my_orders') || 'Order History'}
              </h1>
              <p className="text-zinc-500 text-sm mt-1">Track and manage your deliveries</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#113f36]/5 flex items-center justify-center text-[#113f36]">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className={`w-5 h-5 text-zinc-400 absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'}`} />
              <input 
                type="text" 
                placeholder="Search orders..." 
                className={`w-full bg-zinc-50 border-none rounded-2xl py-3.5 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 placeholder:text-zinc-400`}
              />
            </div>
            <button className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 space-y-4">
          {[...orders].sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1)).map((order) => (
            <button
              key={order.id}
              onClick={() => order.active && onNavigate('tracking')}
              className={`w-full bg-white rounded-3xl p-5 shadow-sm transition-all active:scale-[0.98] text-left rtl:text-right group ${
                order.active 
                  ? 'border-2 border-[#113f36] shadow-md shadow-green-500/10' 
                  : 'border border-zinc-100 hover:border-[#113f36]/30'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4 items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${order.active ? 'bg-[#113f36] text-white shadow-lg shadow-green-500/20' : 'bg-zinc-50 text-zinc-500 group-hover:bg-zinc-100 transition-colors'}`}>
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-zinc-900">{order.items}</h4>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wider uppercase flex items-center gap-1.5 shrink-0 ${
                  order.active 
                    ? 'bg-[#113f36]/10 text-[#113f36]' 
                    : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {order.active ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {order.active ? t('in_transit') || 'In Transit' : t('delivered') || 'Delivered'}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                <span className="text-sm font-medium text-zinc-500">{order.date}</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-zinc-900">{order.price}</span>
                  <ChevronRight className={`w-5 h-5 text-zinc-300 group-hover:text-[#113f36] transition-colors ${isRTL ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav currentScreen="orders" onNavigate={onNavigate} />
    </motion.div>
  );
}
