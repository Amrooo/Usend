import { motion } from 'motion/react';
import { Screen } from '../../types';
import UserSidebar from '../../components/UserSidebar';
import { Package, Clock, DollarSign, ArrowUpRight, ArrowDownRight, CheckCircle2, PlusCircle, History, Info, Redo2, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { useState } from 'react';
import Modal from '../../components/Modal';

interface UserDashboardProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function UserDashboard({ onNavigate }: UserDashboardProps) {
  const { t, isRTL } = useLanguage();
  const { activeRequests, user } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const storedGuestData = JSON.parse(localStorage.getItem('guestOrders') || '[]');
  const storedGuestIds = storedGuestData.map((g: any) => g.id);
  const myRequests = activeRequests.filter(req => 
    (user?.uid && (req.userId === user.uid || req.phone === user.phoneNumber || storedGuestIds.includes(req.id))) || 
    (!user?.uid && (req.applicantType === 'Individual User' || req.applicantType === 'User' || storedGuestIds.includes(req.id)))
  );

  const totalSpent = myRequests.reduce((sum, req) => sum + parseFloat(req.orderAmount?.replace(/[^0-9.]/g, '') || '0'), 0);

  const stats = [
    { label: t('total_orders') || 'Total Orders', value: myRequests.length.toLocaleString(), change: '+2', isPositive: true, icon: Package },
    { label: t('active_deliveries') || 'Active Deliveries', value: myRequests.filter(o => o.status !== 'delivered').length.toString(), change: '+1', isPositive: true, icon: Clock },
    { label: t('total_spent') || 'Total Spent', value: `AED ${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, change: '+AED 45', isPositive: true, icon: DollarSign },
  ];

  const previousOrders = myRequests.filter(req => req.status === 'delivered');

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 text-zinc-900 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <UserSidebar currentScreen="user_dashboard" onNavigate={onNavigate} />
      
      <main className="flex-1 p-8 lg:p-12 h-full overflow-y-auto hide-scrollbar overflow-x-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none z-0"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-12 relative z-10"
        >
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <p className="text-brand font-black text-[12px] uppercase tracking-[0.5em] mb-3">User Portal</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium tracking-tight uppercase leading-tight text-zinc-900">
                {t('dashboard') || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate('user_individual')}
                className="h-14 px-8 rounded-2xl bg-brand text-white font-black text-[12px] uppercase tracking-widest shadow-xl shadow-brand/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                {t('new_order') || 'New Order'}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] hover:shadow-xl hover:border-brand/20 transition-all group"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-[12px] font-black uppercase tracking-widest ${stat.isPositive ? 'text-blue-600 bg-blue-50' : 'text-red-500 bg-red-50'} px-3 py-1 rounded-full`}>
                    {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span dir="ltr">{stat.change}</span>
                  </div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-display font-medium mb-2 tracking-tight text-zinc-900" dir="ltr">{stat.value}</h3>
                <p className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Previous Orders Grid Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-medium uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                <History className="w-5 h-5 text-brand" />
                {t('previous_orders') || 'Previous Orders'}
              </h2>
              <button 
                onClick={() => onNavigate('user_orders')}
                className="text-brand font-black text-[12px] uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                View History
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {previousOrders.length > 0 ? previousOrders.map((order: any, i) => (
                <div key={order.id} className="bg-white border border-zinc-200 rounded-[2rem] p-6 space-y-4 hover:shadow-lg transition-all group border-b-4 border-b-zinc-100">
                  <div className="flex justify-between items-start">
                    <span className="text-[13px] font-black text-zinc-400 uppercase tracking-widest">{order.id}</span>
                    <span className="bg-blue-50 text-blue-600 text-[12px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">Delivered</span>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 truncate">To: {order.recipient || order.toDestination || 'N/A'}</p>
                    <p className="text-[12px] text-zinc-500 mt-0.5">{order.date}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 h-10 rounded-xl bg-zinc-50 text-zinc-600 text-[12px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Details
                    </button>
                    <button 
                      onClick={() => onNavigate('user_individual')}
                      className="h-10 w-10 rounded-xl bg-brand/10 text-brand hover:bg-brand hover:text-white transition-all flex items-center justify-center"
                      title="Send Again"
                    >
                      <Redo2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full p-20 text-center text-zinc-400 italic">No previous orders found.</div>
              )}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white border border-zinc-200 rounded-[3rem] overflow-hidden shadow-sm">
            <div className="p-10 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-xl font-display font-medium uppercase tracking-tight text-zinc-900">{t('recent_orders') || 'Recent Orders'}</h2>
              <button 
                onClick={() => onNavigate('user_tracking')}
                className="text-brand font-black text-[12px] uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                {t('view_all_orders') || 'View All Orders'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse min-w-[800px]`}>
                <thead>
                  <tr className="bg-zinc-50 text-zinc-400 text-[12px] font-black uppercase tracking-widest border-b border-zinc-100">
                    <th className="p-8 font-black">{t('order_id') || 'Order ID'}</th>
                    <th className="p-8 font-black">{t('recipient') || 'Recipient'}</th>
                    <th className="p-8 font-black">{t('status') || 'Status'}</th>
                    <th className="p-8 font-black">{t('amount') || 'Amount'}</th>
                    <th className="p-8 font-black text-center">{t('time') || 'Time'}</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {myRequests.length > 0 ? myRequests.map((order, i) => (
                    <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors group">
                      <td className="p-8 text-zinc-900 font-bold">{order.id}</td>
                      <td className="p-8 text-zinc-500">{order.name}</td>
                      <td className="p-8">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest ${
                          order.status === 'delivered' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'in_transit' || order.status === 'En-route' ? 'bg-blue-50 text-brand' :
                          'bg-orange-50 text-orange-600'
                        }`}>
                          {order.status === 'delivered' && <CheckCircle2 className="w-3 h-3" />}
                          {(order.status === 'in_transit' || order.status === 'En-route') && <Clock className="w-3 h-3" />}
                          {order.status === 'delivered' ? t('delivered') : (order.status === 'in_transit' || order.status === 'En-route') ? t('in_transit') : order.status}
                        </span>
                      </td>
                      <td className="p-8 text-zinc-900 font-bold" dir="ltr">{order.orderAmount}</td>
                      <td className="p-8 text-zinc-400 text-center">{order.date}</td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={5} className="p-20 text-center text-zinc-300 italic font-medium">
                          No active data found in current session.
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </main>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Information"
      >
        {selectedOrder && (
          <div className="space-y-6 p-2">
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
              <div>
                <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Status</p>
                <p className="text-blue-600 font-black uppercase text-xs tracking-widest">Delivered Successfully</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Amount</p>
                <p className="text-brand font-black text-sm">{selectedOrder.amount}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-zinc-100 bg-white">
                  <p className="text-[13px] font-black text-zinc-400 uppercase tracking-widest mb-1">Order ID</p>
                  <p className="text-sm font-bold text-zinc-900">{selectedOrder.id}</p>
                </div>
                <div className="p-4 rounded-2xl border border-zinc-100 bg-white">
                  <p className="text-[13px] font-black text-zinc-400 uppercase tracking-widest mb-1">Date</p>
                  <p className="text-sm font-bold text-zinc-900">{selectedOrder.date}</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-100 bg-white space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-zinc-400 uppercase tracking-widest">Items</p>
                    <p className="text-sm font-bold text-zinc-900">{selectedOrder.items}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-zinc-400 uppercase tracking-widest">Delivery Address</p>
                    <p className="text-sm font-medium text-zinc-600">{selectedOrder.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
               onClick={() => {
                 onNavigate('user_individual');
                 setSelectedOrder(null);
               }}
               className="w-full h-14 bg-brand text-white rounded-2xl font-black uppercase tracking-widest text-[12px] shadow-lg shadow-brand/20 hover:bg-brand/90 transition-all flex items-center justify-center gap-2"
            >
              <Redo2 className="w-5 h-5" />
              Re-order Now
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
