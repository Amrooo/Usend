import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Screen } from '../../types';
import UserSidebar from '../../components/UserSidebar';
import { Package, Search, ChevronRight, MapPin, Clock, MoreHorizontal, Redo2, X, Info, User } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import Modal from '../../components/Modal';

interface UserOrdersProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

interface OrderRecord {
  id: string;
  recipient: string;
  date: string;
  amount: string;
  status: 'delivered' | 'cancelled' | 'returned';
  category: string;
  items: string;
  address: string;
  image?: string;
}

export default function UserOrders({ onNavigate }: UserOrdersProps) {
  const { t, isRTL } = useLanguage();
  const { activeRequests, user } = useApp();
  const storedGuestData = JSON.parse(localStorage.getItem('guestOrders') || '[]');
  const storedGuestIds = storedGuestData.map((g: any) => g.id);
  const myRequests = activeRequests.filter((req: any) => 
    (user?.uid && (req.userId === user.uid || req.phone === user.phoneNumber || storedGuestIds.includes(req.id))) || 
    (!user?.uid && (req.applicantType === 'Individual User' || req.applicantType === 'User' || storedGuestIds.includes(req.id)))
  );
  
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  
  const previousOrders = myRequests.filter((req: any) => req.status === 'delivered');
  const [searchTerm, setSearchTerm] = useState('');
  const filteredOrders = previousOrders.filter((req: any) => req.id.toLowerCase().includes(searchTerm.toLowerCase()) || (req.name || req.toDestination || '').toLowerCase().includes(searchTerm.toLowerCase()));


  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <UserSidebar currentScreen="user_orders" onNavigate={onNavigate} />
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 h-full overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-10"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                {t('previous_orders') || 'Previous Orders'}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Review and re-send your past deliveries.</p>
            </div>
            <div className="relative">
              <Search className={`w-5 h-5 text-zinc-400 absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2`} />
              <input 
                type="text" 
                placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 text-sm focus:ring-2 focus:ring-brand outline-none w-full md:w-72 shadow-sm transition-all`}
              />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOrders.length > 0 ? filteredOrders.map((order: any, i: number) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-brand/20 transition-all group flex flex-col"
              >
                <div className="p-8 space-y-6 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                      {order.id}
                    </span>
                    <span className="flex items-center gap-1.5 text-[13px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full">
                      Delivered
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-display font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      To: {order.name || order.toDestination}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">{order.date}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <MapPin className="w-4 h-4 text-zinc-300" />
                      <span className="truncate">{order.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <Package className="w-4 h-4 text-zinc-300" />
                      <span className="truncate">{order.items}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-100 font-bold text-xs uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Info className="w-4 h-4" />
                    Details
                  </button>
                  <button 
                    onClick={() => onNavigate('user_individual')}
                    className="h-12 w-12 rounded-xl bg-brand text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-brand/20 group/btn"
                    title="Send Again"
                  >
                    <Redo2 className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full p-20 text-center text-zinc-400 italic">No previous orders found.</div>
            )}
          </div>

          {/* Details Modal */}
          <Modal
            isOpen={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            title="Order Information"
          >
            {selectedOrder && (
              <div className="space-y-8 p-2">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">Order ID</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{selectedOrder.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">Amount Paid</p>
                    <p className="text-lg font-bold text-brand">{selectedOrder.amount}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">Recipient</p>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedOrder.recipient}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">Address</p>
                        <p className="font-medium text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{selectedOrder.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">Items</p>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedOrder.items}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">Completed On</p>
                        <p className="font-medium text-zinc-600 dark:text-zinc-400 text-sm">{selectedOrder.date}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                        onNavigate('user_individual');
                        setSelectedOrder(null);
                    }}
                    className="w-full h-14 rounded-2xl bg-brand text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-brand/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand/20"
                  >
                    <Redo2 className="w-5 h-5" />
                    Send Again
                  </button>
                </div>
              </div>
            )}
          </Modal>
        </motion.div>
      </main>
    </div>
  );
}
