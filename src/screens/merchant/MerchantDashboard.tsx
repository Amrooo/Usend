import { motion } from 'motion/react';
import { useState } from 'react';
import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import { Package, TrendingUp, Clock, DollarSign, ArrowUpRight, ArrowDownRight, CheckCircle2, PlusCircle, Search, Bell } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';

interface MerchantDashboardProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantDashboard({ onNavigate }: MerchantDashboardProps) {
  const { t, isRTL } = useLanguage();
  const { activeRequests, user } = useApp();

  const merchantRequests = activeRequests.filter(req => 
    (user?.uid && req.merchantId === user.uid)
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(merchantRequests.length / itemsPerPage);
  const paginatedRequests = merchantRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // All Orders ledger states
  const [allOrdersSearch, setAllOrdersSearch] = useState('');
  const [allOrdersStatus, setAllOrdersStatus] = useState('all');
  const [allOrdersPage, setAllOrdersPage] = useState(1);
  const allOrdersLimit = 10;

  const filteredAllRequests = merchantRequests.filter(order => {
    if (allOrdersSearch.trim()) {
      const q = allOrdersSearch.toLowerCase();
      const matchId = (order.id || '').toLowerCase().includes(q);
      const matchName = (order.name || '').toLowerCase().includes(q);
      const matchAddress = (order.address || '').toLowerCase().includes(q);
      const matchItem = (order.itemType || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchAddress && !matchItem) {
        return false;
      }
    }
    if (allOrdersStatus === 'all') return true;
    const orderStatus = order.status.toLowerCase().replace(' ', '_');
    return orderStatus === allOrdersStatus || 
           (allOrdersStatus === 'pending' && (orderStatus === 'pending' || orderStatus === 'assigning' || orderStatus === 'approved')) || 
           (allOrdersStatus === 'in_transit' && (orderStatus === 'in_transit' || orderStatus === 'en-route' || orderStatus === 'reviewing')) || 
           (allOrdersStatus === 'delivered' && orderStatus === 'delivered') ||
           (allOrdersStatus === 'cancelled' && (orderStatus === 'rejected' || orderStatus === 'cancelled' || orderStatus === 'exceptions'));
  });

  const allOrdersTotalPages = Math.ceil(filteredAllRequests.length / allOrdersLimit);
  const paginatedAllRequests = filteredAllRequests.slice((allOrdersPage - 1) * allOrdersLimit, allOrdersPage * allOrdersLimit);

  const totalRev = merchantRequests.reduce((sum, req) => sum + parseFloat(req.orderAmount?.replace(/[^0-9.]/g, '') || '0'), 0);
  const platformFees = totalRev * 0.05;

  const stats = [
    { label: t('total_orders'), value: merchantRequests.length.toLocaleString(), change: '+12%', isPositive: true, icon: Package },
    { label: t('active_deliveries'), value: merchantRequests.filter(o => o.status !== 'delivered').length.toString(), change: '+4', isPositive: true, icon: Clock },
    { label: t('total_revenue'), value: `AED ${totalRev.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, change: '+8.5%', isPositive: true, icon: TrendingUp },
    { label: t('platform_fees'), value: `AED ${platformFees.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, change: '-2.1%', isPositive: false, icon: DollarSign },
  ];

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-[#EFF3EE] text-zinc-900 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_dashboard" onNavigate={onNavigate} />
      
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
                  {t('merchant_intelligence') || 'Merchant Hub'}
                </span>
                <h1 className="text-2xl md:text-5xl font-display font-black text-[#1C2C1E] tracking-tight leading-tight md:leading-none uppercase">
                  OAK Merchant Intel
                </h1>
                <p className="text-[#364935] text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1 md:mt-2.5">
                  {t('welcome_back_merchant') || "Manage logistics, customer cash settlements, and dispatch stats securely."}
                </p>
              </div>

              {/* Stats - floating on top of the wavy architecture gradient banner! */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 xl:max-w-5xl mt-4">
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
                        onClick={() => onNavigate('merchant_tracking')}
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
                  {t('dispatch') || 'Dispatch Hub'}
                </h3>
                <p className="text-[#5B6D2D] text-[11px] font-semibold mt-1.5 leading-relaxed">
                  Generate instant shipment codes, coordinate drivers, or handle bulk batch orders in real-time.
                </p>
              </div>

              <div className="space-y-2 mt-6">
                <button 
                  onClick={() => onNavigate('merchant_individual')}
                  className="w-full h-11 bg-white hover:bg-zinc-50 text-[#384318] border border-[#CBD7C9] font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-4 h-4 text-[#384318]" />
                  + Single Order
                </button>
                <button 
                  onClick={() => onNavigate('merchant_batch')}
                  className="w-full h-11 bg-[#384318] hover:bg-[#252D10] text-[#EFF2CD] font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <Package className="w-4 h-4" />
                  + Batch Upload
                </button>
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white border hover:border-[#D5E2D2] transition-colors border-zinc-150/50 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgba(150,160,145,0.06)]">
            <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between bg-white">
              <h2 className="text-lg md:text-xl font-display font-black uppercase tracking-tight text-[#1C2C1E]">{t('recent_orders')}</h2>
              <button 
                onClick={() => onNavigate('merchant_tracking')}
                className="text-[#344633] font-black text-[11px] uppercase tracking-widest hover:opacity-75 transition-opacity"
              >
                {t('view_all_orders')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse min-w-[800px]`}>
                <thead>
                  <tr className="bg-[#EFF3EE]/60 text-[#5D6B5A] text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="p-8 font-bold">{t('order_id')}</th>
                    <th className="p-8 font-bold">{t('customer')}</th>
                    <th className="p-8 font-bold">{t('status')}</th>
                    <th className="p-8 font-bold">{t('amount')}</th>
                    <th className="p-8 font-bold">{t('platform_fees')}</th>
                    <th className="p-8 font-bold text-center">{t('time')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {paginatedRequests.length > 0 ? paginatedRequests.map((order, i) => (
                    <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-[#EFF3EE]/20 transition-colors group">
                      <td className="p-8 text-[#1C2C1E] font-black">{order.id}</td>
                      <td className="p-8 text-[#5D6B5A] font-bold">{order.name}</td>
                      <td className="p-8">
                        <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'delivered' ? 'bg-[#D5E2D2]/60 text-[#344633]' :
                          order.status === 'in_transit' || order.status === 'En-route' ? 'bg-amber-50 text-amber-700' :
                          'bg-zinc-100 text-zinc-600'
                        }`}>
                          {order.status === 'delivered' && <CheckCircle2 className="w-3 h-3" />}
                          {(order.status === 'in_transit' || order.status === 'En-route') && <Clock className="w-3 h-3" />}
                          {order.status === 'delivered' ? t('delivered') : (order.status === 'in_transit' || order.status === 'En-route') ? t('in_transit') : order.status}
                        </span>
                      </td>
                      <td className="p-8 text-[#1C2C1E] font-black" dir="ltr">{order.orderAmount}</td>
                      <td className="p-8 text-rose-600 font-bold" dir="ltr">-AED {((parseFloat(order.orderAmount?.replace(/[^0-9.]/g, '') || '0')) * 0.05).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td className="p-8 text-zinc-400 text-center">{order.date}</td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={6} className="p-20 text-center text-zinc-350 italic font-medium">
                          No active data found in current session.
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-zinc-150/50 bg-[#EFF3EE]/20 flex items-center justify-between">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-5 py-2.5 border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-700 disabled:opacity-40 hover:bg-zinc-100 transition-all bg-white shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-5 py-2.5 border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-700 disabled:opacity-40 hover:bg-zinc-100 transition-all bg-white shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* All Orders Ledger Block */}
          <div className="bg-white border hover:border-[#D5E2D2] transition-colors border-zinc-150/50 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgba(150,160,145,0.06)] mt-6 md:mt-8">
            <div className="p-6 md:p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white">
              <div>
                <h2 className="text-lg md:text-xl font-display font-black uppercase tracking-tight text-[#1C2C1E]">
                  {t('all_orders') || 'All Orders Ledger'}
                </h2>
                <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                  Full list of all active, past, and pending deliveries ({filteredAllRequests.length})
                </p>
              </div>

              {/* Search Control */}
              <div className="relative w-full md:w-80">
                <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 ${isRTL ? 'right-3.5' : 'left-3.5'}`} />
                <input 
                  type="text" 
                  placeholder="Search by ID, Recipient, Address..."
                  value={allOrdersSearch}
                  onChange={(e) => { setAllOrdersSearch(e.target.value); setAllOrdersPage(1); }}
                  className={`w-full h-11 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-[#113f36]/20 focus:border-[#113f36] transition-all ${isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'}`}
                />
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="px-6 md:px-10 py-4 md:py-5 bg-zinc-50/50 border-b border-slate-100 flex flex-wrap gap-2 md:gap-2.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'in_transit', label: 'In Transit' },
                { id: 'delivered', label: 'Delivered' },
                { id: 'cancelled', label: 'Cancelled / Rejected' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setAllOrdersStatus(tab.id); setAllOrdersPage(1); }}
                  className={`px-4.5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                    allOrdersStatus === tab.id 
                      ? 'bg-[#113f36] border-[#113f36] text-white shadow-md' 
                      : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse min-w-[800px]`}>
                <thead>
                  <tr className="bg-[#EFF3EE]/60 text-[#5D6B5A] text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="p-8 font-bold">{t('order_id')}</th>
                    <th className="p-8 font-bold">{t('customer')}</th>
                    <th className="p-8 font-bold">{t('courier')}</th>
                    <th className="p-8 font-bold">{t('status')}</th>
                    <th className="p-8 font-bold">{t('amount')}</th>
                    <th className="p-8 font-bold text-center">{t('time')}</th>
                    <th className="p-8 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {paginatedAllRequests.length > 0 ? paginatedAllRequests.map((order, i) => (
                    <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-[#EFF3EE]/20 transition-colors group">
                      <td className="p-8 text-[#1C2C1E] font-black font-mono text-xs">{order.id}</td>
                      <td className="p-8">
                        <div>
                          <p className="text-[#5D6B5A] font-bold">{order.name}</p>
                          <p className="text-[11px] text-zinc-400 font-bold truncate max-w-[180px]" title={order.address}>{order.address}</p>
                        </div>
                      </td>
                      <td className="p-8">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                          (order.carrier || '').toLowerCase() === 'noon' ? 'bg-amber-100 text-amber-800' :
                          (order.carrier || '').toLowerCase() === 'aramex' ? 'bg-red-100 text-red-800' :
                          'bg-zinc-100 text-zinc-650'
                        }`}>
                          {order.carrier || 'Not Dispatched'}
                        </span>
                      </td>
                      <td className="p-8">
                        <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'delivered' ? 'bg-[#D5E2D2]/60 text-[#344633]' :
                          order.status === 'in_transit' || order.status === 'En-route' ? 'bg-amber-50 text-amber-700' :
                          'bg-zinc-100 text-zinc-650'
                        }`}>
                          {order.status === 'delivered' && <CheckCircle2 className="w-3 h-3" />}
                          {(order.status === 'in_transit' || order.status === 'En-route') && <Clock className="w-3 h-3" />}
                          {order.status === 'delivered' ? t('delivered') : (order.status === 'in_transit' || order.status === 'En-route') ? t('in_transit') : order.status}
                        </span>
                      </td>
                      <td className="p-8 text-[#1C2C1E] font-black" dir="ltr">{order.orderAmount}</td>
                      <td className="p-8 text-zinc-400 text-center">{order.date}</td>
                      <td className="p-8 text-center">
                        <button 
                          onClick={() => onNavigate('merchant_tracking')}
                          className="px-4 py-2 bg-zinc-950 hover:bg-[#113f36] text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                        >
                          Track Shipment
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={7} className="p-20 text-center text-zinc-350 italic font-medium">
                          No shipments match search query or filters.
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* All Orders Pagination Controls */}
            {allOrdersTotalPages > 1 && (
              <div className="p-6 border-t border-zinc-150/50 bg-[#EFF3EE]/20 flex items-center justify-between">
                <button 
                  onClick={() => setAllOrdersPage(p => Math.max(1, p - 1))}
                  disabled={allOrdersPage === 1}
                  className="px-5 py-2.5 border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-700 disabled:opacity-40 hover:bg-zinc-100 transition-all bg-white shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Page {allOrdersPage} of {allOrdersTotalPages}
                </span>
                <button 
                  onClick={() => setAllOrdersPage(p => Math.min(allOrdersTotalPages, p + 1))}
                  disabled={allOrdersPage === allOrdersTotalPages}
                  className="px-5 py-2.5 border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-700 disabled:opacity-40 hover:bg-zinc-100 transition-all bg-white shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
