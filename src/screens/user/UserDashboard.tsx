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
    (!user?.uid && storedGuestIds.includes(req.id))
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(myRequests.length / itemsPerPage);
  const paginatedRequests = myRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalSpent = myRequests.reduce((sum, req) => sum + parseFloat(req.orderAmount?.replace(/[^0-9.]/g, '') || '0'), 0);

  const stats = [
    { label: t('total_orders') || 'Total Orders', value: myRequests.length.toLocaleString(), change: '+2', isPositive: true, icon: Package },
    { label: t('active_deliveries') || 'Active Deliveries', value: myRequests.filter(o => o.status !== 'delivered').length.toString(), change: '+1', isPositive: true, icon: Clock },
    { label: t('total_spent') || 'Total Spent', value: `AED ${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, change: '+AED 45', isPositive: true, icon: DollarSign },
  ];

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-[#EFF3EE] text-zinc-900 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <UserSidebar currentScreen="user_dashboard" onNavigate={onNavigate} />
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 h-full overflow-y-auto hide-scrollbar overflow-x-hidden relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#113f36]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none z-0"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-6 md:space-y-12 relative z-10"
        >
          {/* Dashboard Header Banner */}
          <div className="bg-[#7AA08A] rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden shadow-sm text-zinc-950 flex flex-col xl:flex-row gap-6 md:gap-8 justify-between items-stretch">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 overflow-hidden z-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0,150 C 300,100 400,300 700,200 C 900,150 1000,250 1000,250 L 1000,400 L 0,400 Z" fill="#113f36" />
                <circle cx="800" cy="80" r="120" fill="white" opacity="0.3" />
              </svg>
            </div>

            {/* Banner Main Column */}
            <div className="flex-1 space-y-8 relative z-10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#243B20] bg-[#D5E2D2]/90 border border-white/20 px-3 md:px-3.5 py-1 md:py-1.5 rounded-full inline-block mb-2 md:mb-3.5 shadow-xs">
                  {t('hub_personal') || 'Consumer Hub'}
                </span>
                <h1 className="text-2xl md:text-5xl font-display font-black text-[#1C2C1E] tracking-tight leading-tight md:leading-none uppercase">
                  OAK USend Portal
                </h1>
                <p className="text-[#364935] text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1 md:mt-2.5">
                  {t('welcome_back') || "Welcome back! Mind your logistics, packages, and tracking stats."}
                </p>
              </div>

              {/* Stats - floating on top of the wavy architecture gradient banner! */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:max-w-4xl mt-4">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white/95 backdrop-blur-md rounded-[2rem] p-6 flex flex-col justify-between shadow-sm border border-white/40 h-[125px] group hover:scale-[1.02] hover:bg-white transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#344633]/15 text-[#344633] flex items-center justify-center pointer-events-none">
                          <stat.icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5D6B5A]">
                          {stat.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-2">
                      <h3 className="text-2xl font-black text-[#1C2C1E] tracking-tight">{stat.value}</h3>
                      <button 
                        onClick={() => onNavigate(stat.label.includes('Spent') ? 'user_payments' : 'user_orders')}
                        className="w-8 h-8 rounded-full bg-white shadow-xs border border-zinc-100 flex items-center justify-center text-[#344633] cursor-pointer hover:bg-zinc-50 transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Banner Right Column: Pastel Yellow Action Banner (floating) */}
            <div className="xl:w-[325px] bg-[#EFF2CD]/95 backdrop-blur-md rounded-[2.2rem] p-7 flex flex-col justify-between shadow-md border border-[#E1E7B9] relative z-10 overflow-hidden min-h-[220px]">
              <div>
                <h3 className="text-lg font-black text-[#384318] tracking-tight uppercase">
                  {t('new_order') || 'Add New Shipment'}
                </h3>
                <p className="text-[#5B6D2D] text-[11px] font-semibold mt-1.5 leading-relaxed">
                  Fast automatic parcel routing, tracking codes, and digital settlements anywhere in the UAE.
                </p>
              </div>

              <div className="space-y-2 mt-6">
                <button 
                  onClick={() => onNavigate('user_individual')}
                  className="w-full h-12 bg-[#384318] hover:bg-[#252D10] text-[#EFF2CD] font-bold text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  + Create Order
                </button>
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white border border-[#EBEFE9] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(220,225,235,0.45)]">
            <div className="p-6 md:p-10 border-b border-[#EBEFE9] flex items-center justify-between bg-white">
              <h2 className="text-lg md:text-xl font-display font-semibold uppercase tracking-tight text-slate-900">{t('recent_orders') || 'Recent Orders'}</h2>
              <button 
                onClick={() => onNavigate('user_tracking')}
                className="text-[#546a40] font-bold text-[12px] uppercase tracking-widest hover:opacity-75 transition-opacity"
              >
                {t('view_all_orders') || 'View All Orders'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse min-w-[800px]`}>
                <thead>
                  <tr className="bg-slate-50 text-zinc-400 text-[12px] font-black uppercase tracking-widest border-b border-[#EBEFE9]">
                    <th className="p-8 font-bold">{t('order_id') || 'Order ID'}</th>
                    <th className="p-8 font-bold">{t('recipient') || 'Recipient'}</th>
                    <th className="p-8 font-bold">{t('status') || 'Status'}</th>
                    <th className="p-8 font-bold">{t('amount') || 'Amount'}</th>
                    <th className="p-8 font-bold text-center">{t('time') || 'Time'}</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {paginatedRequests.length > 0 ? paginatedRequests.map((order, i) => (
                    <tr key={i} className="border-b border-[#EBEFE9] last:border-0 hover:bg-slate-50/50 transition-colors group">
                      <td className="p-8 text-zinc-900 font-bold">{order.id}</td>
                      <td className="p-8 text-zinc-500">{order.name}</td>
                      <td className="p-8">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-widest ${
                          order.status === 'delivered' ? 'bg-[#113f36]/5 text-[#113f36]' :
                          order.status === 'in_transit' || order.status === 'En-route' ? 'bg-[#113f36]/5 text-[#546a40]' :
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
                       <td colSpan={5} className="p-20 text-center text-zinc-350 italic font-medium">
                          No active data found in current session.
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-[#EBEFE9] bg-slate-50/50 flex items-center justify-between">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-5 py-2.5 border border-[#EBEFE9] rounded-xl text-xs font-black uppercase tracking-wider text-zinc-700 disabled:opacity-40 hover:bg-zinc-100 transition-all bg-white shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-5 py-2.5 border border-[#EBEFE9] rounded-xl text-xs font-black uppercase tracking-wider text-zinc-700 disabled:opacity-40 hover:bg-zinc-100 transition-all bg-white shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
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
            <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl">
              <div>
                <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Status</p>
                <p className="text-[#113f36] font-black uppercase text-xs tracking-widest">Delivered Successfully</p>
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
