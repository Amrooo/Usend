import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../types';
import UserSidebar from '../../components/UserSidebar';
import { Search, MapPin, Package, Clock, X, Phone, FileText, CheckCircle2, AlertCircle, Truck, Navigation, User, CreditCard, Hash, Check, Calendar, Globe2 } from 'lucide-react';
import { useState, useEffect, ReactNode, FC } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp, USendRequest } from '../../context/AppContext';
import Barcode from "react-barcode";
import YandexMapDisplay from '../../components/YandexMapDisplay';
import YangoMapView from '../../components/YangoMapView';

interface UserTrackingProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function UserTracking({ onNavigate }: UserTrackingProps) {
  const { t, isRTL } = useLanguage();
  const { activeRequests, user, updateRequestStatus, updateRequest } = useApp();
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapEngine, setMapEngine] = useState<'yango' | 'leaflet'>('yango');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => setIsMapReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const storedGuestData = JSON.parse(localStorage.getItem('guestOrders') || '[]');
  const storedGuestIds = storedGuestData.map((g: any) => g.id);
  const myRequests = activeRequests.filter(req => 
    (user?.uid && (req.userId === user.uid || req.phone === user.phoneNumber || storedGuestIds.includes(req.id))) || 
    (!user?.uid && storedGuestIds.includes(req.id))
  );
  const activeOrders = myRequests;

  // Bottom Grid State
  const [gridSearch, setGridSearch] = useState('');
  const [gridStatusFilter, setGridStatusFilter] = useState('all');
  const [gridPage, setGridPage] = useState(1);
  const gridPageSize = 5;

  const gridFilteredRequests = myRequests.filter(order => {
    if (gridSearch.trim()) {
      const q = gridSearch.toLowerCase();
      const matchId = (order.id || '').toLowerCase().includes(q);
      const matchName = (order.name || '').toLowerCase().includes(q);
      const matchAddress = (order.address || '').toLowerCase().includes(q);
      const matchItem = (order.itemType || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchAddress && !matchItem) {
        return false;
      }
    }
    if (gridStatusFilter !== 'all') {
      const orderStatus = order.status.toLowerCase().replace(' ', '_');
      const matchesStatus = orderStatus === gridStatusFilter || 
             (gridStatusFilter === 'pending' && (orderStatus === 'pending' || orderStatus === 'assigning' || orderStatus === 'approved' || orderStatus === 'assigned' || orderStatus === 'created')) || 
             (gridStatusFilter === 'in_transit' && (orderStatus === 'in_transit' || orderStatus === 'en-route')) || 
             (gridStatusFilter === 'picked_up' && orderStatus === 'picked_up') ||
             (gridStatusFilter === 'delivered' && (orderStatus === 'delivered' || orderStatus === 'completed')) ||
             (gridStatusFilter === 'cancelled' && (orderStatus === 'rejected' || orderStatus === 'exceptions' || orderStatus === 'cancelled'));
      if (!matchesStatus) return false;
    }
    return true;
  });

  const gridTotalPages = Math.ceil(gridFilteredRequests.length / gridPageSize);
  const gridPaginatedRequests = gridFilteredRequests.slice((gridPage - 1) * gridPageSize, gridPage * gridPageSize);

  const [selectedOrder, setSelectedOrder] = useState<USendRequest | null>(null);

  const getDispatchError = (order: USendRequest) => {
    if (order.carrierLogs?.error) return order.carrierLogs.error;
    if (order.aramexLogs?.response?.error) return order.aramexLogs.response.error;
    if (order.aramexLogs?.response?.Notifications?.[0]?.Message) return order.aramexLogs.response.Notifications[0].Message;
    return order.dispatchError || "The order could not be sent to the courier. Please contact support.";
  };
  const liveSelectedOrder = selectedOrder ? (activeRequests.find(r => r.id === selectedOrder.id) || selectedOrder) : null;
  const [aramexSteps, setAramexSteps] = useState<any[]>([]);
  const [showApiLogs, setShowApiLogs] = useState(false);

  useEffect(() => {
    if (selectedOrder?.externalTrackingNumber && selectedOrder.carrier === 'aramex') {
      import('../../services/courierIntegration').then(({ courierIntegrationService }) => {
        courierIntegrationService.trackShipment('aramex', selectedOrder.externalTrackingNumber!)
          .then(res => {
            if (res.success && res.steps.length > 0) {
              setAramexSteps(res.steps);
            }
          })
          .catch(err => console.error(err));
      });
    } else {
      setAramexSteps([]);
    }
  }, [selectedOrder]);

  const filteredOrders = activeOrders.filter(order => {
    // If search query is typed, verify tracking number (ID) or basic fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (order.id || '').toLowerCase().includes(q);
      const matchName = (order.name || '').toLowerCase().includes(q);
      const matchAddress = (order.address || '').toLowerCase().includes(q);
      const matchItem = (order.itemType || '').toLowerCase().includes(q);
      const matchDescription = (order.description || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchAddress && !matchItem && !matchDescription) {
        return false;
      }
    }

    let matchesDate = true;
    if (dateRange.start || dateRange.end) {
      const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.parse(order.date);
      if (!isNaN(orderTime)) {
         if (dateRange.start && orderTime < new Date(dateRange.start).getTime()) matchesDate = false;
         if (dateRange.end && orderTime > new Date(dateRange.end).getTime() + 86400000) matchesDate = false;
      }
    }

    if (!matchesDate) return false;

    if (filter !== 'all') {
      const orderStatus = order.status.toLowerCase().replace(' ', '_');
      const matchesStatus = orderStatus === filter || 
                            (filter === 'pending' && (orderStatus === 'pending' || orderStatus === 'assigning' || orderStatus === 'approved' || orderStatus === 'assigned' || orderStatus === 'created')) || 
                            (filter === 'in_transit' && (orderStatus === 'in_transit' || orderStatus === 'en-route')) || 
                            (filter === 'picked_up' && orderStatus === 'picked_up') ||
                            (filter === 'delivered' && (orderStatus === 'delivered' || orderStatus === 'completed')) ||
                            (filter === 'cancelled' && (orderStatus === 'rejected' || orderStatus === 'exceptions' || orderStatus === 'cancelled'));
      if (!matchesStatus) return false;
    }
    return true;
  }).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (Date.parse(a.date) || 0);
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (Date.parse(b.date) || 0);

      if (sortOrder === 'newest') {
         if (timeA !== timeB) return timeB - timeA;
         return b.id.localeCompare(a.id);
      } else {
         if (timeA !== timeB) return timeA - timeB;
         return a.id.localeCompare(b.id);
      }
  });

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  const mapCenter: [number, number] = [25.2048, 55.2708];

  const statusTabs = [
    { id: 'all', label: t('all') || 'All' },
    { id: 'pending', label: t('pending') || 'Pending' },
    { id: 'picked_up', label: t('picked_up') || 'Picked Up' },
    { id: 'in_transit', label: t('in_transit') || 'In Transit' },
    { id: 'delivered', label: t('delivered') || 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  const TimelinePart: FC<{ dot: ReactNode, title: string, desc: string, active?: boolean, last?: boolean }> = ({ dot, title, desc, active, last }) => (
    <div className="flex gap-4 min-h-[60px]">
       <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${active ? 'bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg shadow-[#113f36]/30' : 'bg-zinc-100 text-zinc-400'}`}>
             {dot}
          </div>
          {!last && <div className={`w-0.5 flex-1 ${active ? 'bg-gradient-to-r from-blue-700 to-blue-500' : 'bg-zinc-200'}`}></div>}
       </div>
       <div className="pb-6">
          <h4 className={`font-bold text-sm ${active ? 'text-zinc-900' : 'text-zinc-400'}`}>{title}</h4>
          <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
       </div>
    </div>
  );

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <UserSidebar currentScreen="user_tracking" onNavigate={onNavigate} />
      
      <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
            <button 
              onClick={() => onNavigate('user_individual')}
              className="px-6 py-3.5 bg-[#113f36] hover:bg-[#0e332c] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#113f36]/20 hover:shadow-xl hover:shadow-[#113f36]/30 active:scale-[0.98] flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Create Order</span>
            </button>
          </div>

          {/* All Orders Table Grid Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-8 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#113f36]" />
                  {t('all_orders') || 'All Shipments Ledger'}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">Filter, search, and track all your past and current orders.</p>
              </div>

              {/* Grid Search */}
              <div className="relative w-full md:w-80">
                <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input 
                  type="text" 
                  placeholder={t('search_orders') || 'Search orders...'}
                  value={gridSearch}
                  onChange={(e) => { setGridSearch(e.target.value); setGridPage(1); }}
                  className={`w-full h-10 pl-9 pr-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-hidden focus:border-[#113f36] focus:ring-4 focus:ring-[#113f36]/5 transition-all ${isRTL ? 'text-right' : 'text-left'}`}
                />
              </div>
            </div>

            {/* Grid Status Filters */}
            <div className="px-8 py-4 bg-zinc-50/50 border-b border-zinc-200 flex flex-wrap gap-2">
              {[
                { id: 'all', label: t('all') || 'All' },
                { id: 'pending', label: t('pending') || 'Pending' },
                { id: 'picked_up', label: t('picked_up') || 'Picked Up' },
                { id: 'in_transit', label: t('in_transit') || 'In Transit' },
                { id: 'delivered', label: t('delivered') || 'Delivered' },
                { id: 'cancelled', label: 'Cancelled' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setGridStatusFilter(tab.id); setGridPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${gridStatusFilter === tab.id ? 'bg-[#113f36] border-[#113f36] text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse`}>
                <thead>
                  <tr className="bg-zinc-50 text-zinc-400 text-[11px] font-black uppercase tracking-wider border-b border-zinc-200">
                    <th className="p-4 px-6 font-bold">Order ID</th>
                    <th className="p-4 px-6 font-bold">Recipient</th>
                    <th className="p-4 px-6 font-bold">Route</th>
                    <th className="p-4 px-6 font-bold">Item Type</th>
                    <th className="p-4 px-6 font-bold">Status</th>
                    <th className="p-4 px-6 font-bold text-right">Amount</th>
                    <th className="p-4 px-6 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {gridPaginatedRequests.length > 0 ? gridPaginatedRequests.map((order) => {
                    const isRejected = order.status === 'Rejected' || order.status === 'Cancelled';
                    return (
                      <tr key={order.id} className="border-b border-zinc-200 hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4 px-6 text-zinc-900 font-bold font-mono text-xs">{order.id}</td>
                        <td className="p-4 px-6 text-zinc-900 font-bold">{order.name}</td>
                        <td className="p-4 px-6 text-zinc-500 max-w-[200px] truncate" title={`${order.fromDestination} ➔ ${order.toDestination}`}>
                          {order.fromDestination || 'N/A'} ➔ {order.toDestination || 'N/A'}
                        </td>
                        <td className="p-4 px-6 text-zinc-500 capitalize">{order.itemType}</td>
                        <td className="p-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            order.status === 'delivered' || order.status === 'Completed' ? 'bg-[#113f36]/10 text-[#113f36]' :
                            order.status === 'in_transit' ? 'bg-amber-50 text-amber-700' :
                            order.status === 'Assigned' ? 'bg-indigo-50 text-indigo-700' :
                            order.status === 'Approved' ? 'bg-purple-50 text-purple-700' :
                            isRejected ? 'bg-red-50 text-red-700' :
                            'bg-orange-50 text-orange-600'
                          }`}>
                            {order.status === 'delivered' && <CheckCircle2 className="w-3 h-3" />}
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 px-6 text-zinc-900 font-bold text-right" dir="ltr">{order.orderAmount}</td>
                        <td className="p-4 px-6 text-center">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-[#113f36] hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-zinc-700 inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            Track on Map
                          </button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="p-16 text-center text-zinc-400 italic">No shipments match filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Grid Pagination Controls */}
            {gridTotalPages > 1 && (
              <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
                <button 
                  onClick={() => setGridPage(p => Math.max(1, p - 1))}
                  disabled={gridPage === 1}
                  className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-xs font-bold text-zinc-700 disabled:opacity-40 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Prev
                </button>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Page {gridPage} of {gridTotalPages}</span>
                <button 
                  onClick={() => setGridPage(p => Math.min(gridTotalPages, p + 1))}
                  disabled={gridPage === gridTotalPages}
                  className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-xs font-bold text-zinc-700 disabled:opacity-40 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </motion.div>
        
        <AnimatePresence>
          {selectedOrder && (
            <div className="fixed inset-0 z-[100] flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedOrder(null)}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              />
              <motion.div
                initial={{ x: isRTL ? '-100%' : '100%' }}
                animate={{ x: 0 }}
                exit={{ x: isRTL ? '-100%' : '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 240 }}
                className={`relative bg-white shadow-2xl w-[90%] md:w-full md:max-w-sm h-full overflow-hidden flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{t('order_details') || 'Order Details'}</h2>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{selectedOrder.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)} 
                    className="p-2 border border-zinc-200 rounded-full text-zinc-500 hover:text-zinc-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                  {/* Status Progress Header */}
                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${
                        liveSelectedOrder?.status === 'delivered' || liveSelectedOrder?.status === 'Completed' ? 'bg-[#113f36]' : 'bg-blue-600'
                      }`}>
                        {liveSelectedOrder?.status === 'delivered' || liveSelectedOrder?.status === 'Completed' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Status</p>
                        <h4 className="text-sm font-black text-zinc-900 uppercase mt-1">{liveSelectedOrder?.status || selectedOrder.status}</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Arrival</p>
                      <h4 className="text-sm font-black text-zinc-900 uppercase mt-1">{liveSelectedOrder?.etaTime || 'In Transit'}</h4>
                    </div>
                  </div>

                  {/* Enhanced Waybill Stamp */}
                  {/* Enhanced Waybill Stamp */}
                  {(selectedOrder.externalTrackingNumber || liveSelectedOrder?.status === 'Dispatch Failed') && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative border-2 border-dashed border-zinc-200 rounded-3xl p-6 bg-zinc-50/30 overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex flex-col">
                           <h3 className="text-xl font-black italic tracking-tighter text-zinc-900 uppercase">
                             {(selectedOrder.courier || '').toLowerCase().includes('noon') ? 'noon' : (selectedOrder.courier || '').toLowerCase().includes('aramex') ? 'aramex' : 'usend'}
                           </h3>
                           <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tracking Waybill</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl flex flex-col items-end ${liveSelectedOrder?.status === 'Dispatch Failed' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-zinc-900 text-white'}`}>
                           <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Carrier ID</span>
                           <span className="text-xs font-black font-mono">{liveSelectedOrder?.status === 'Dispatch Failed' ? 'FAILED' : selectedOrder.externalTrackingNumber}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
                        <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Shipper</p>
                          <p className="text-xs font-black text-zinc-900 leading-tight">{selectedOrder.merchantName || 'Store'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Consignee</p>
                          <p className="text-xs font-black text-zinc-900 leading-tight">{selectedOrder.name || user?.displayName}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center pt-6 border-t border-zinc-200 relative z-10">
                        {liveSelectedOrder?.status === 'Dispatch Failed' ? (
                          <div className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 items-start">
                             <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                             <div>
                                <h4 className="text-xs font-bold text-red-900 uppercase tracking-widest mb-1">Dispatch Failed</h4>
                                <p className="text-xs text-red-700 leading-relaxed font-medium">
                                   {liveSelectedOrder ? getDispatchError(liveSelectedOrder) : "The order could not be sent to the courier. Please contact support."}
                                </p>
                             </div>
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
                            <Barcode 
                              value={selectedOrder.externalTrackingNumber} 
                              width={1.4} 
                              height={45} 
                              fontSize={12}
                              background="transparent"
                              lineColor="#18181b"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Order Details */}
                  <div className="bg-white border border-[#EBEFE9] rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(220,225,235,0.45)] flex flex-col gap-5 mt-2">
                    <div className="flex items-center gap-3 border-b border-[#EBEFE9] pb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-zinc-900 uppercase tracking-widest">Order Details</h3>
                        <p className="text-[11px] text-blue-600 font-bold mt-0.5">Time & Courier Info</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Date & Time */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Created At</span>
                        <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex items-start gap-2">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-black text-zinc-900">
                              {selectedOrder.createdAt 
                                ? ((selectedOrder.createdAt as any)?.toDate 
                                    ? (selectedOrder.createdAt as any).toDate().toLocaleDateString('en-GB') 
                                    : new Date(selectedOrder.createdAt as string).toLocaleDateString('en-GB')) 
                                : 'N/A'}
                            </p>
                            <p className="text-[10px] font-bold text-zinc-500 mt-0.5">
                              {selectedOrder.createdAt 
                                ? ((selectedOrder.createdAt as any)?.toDate 
                                    ? (selectedOrder.createdAt as any).toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
                                    : new Date(selectedOrder.createdAt as string).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })) 
                                : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Courier Info */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Courier</span>
                        <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex items-start gap-2">
                          <Truck className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-black text-zinc-900 uppercase">
                               {selectedOrder.courier || 'USEND'}
                            </p>
                            <div className="mt-1">
                               {(selectedOrder.courier || '').toLowerCase().includes('noon') && (
                                  <div className="bg-[#feee00] text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-md inline-block">noon</div>
                               )}
                               {(selectedOrder.courier || '').toLowerCase().includes('aramex') && (
                                  <div className="bg-[#e2001a] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md inline-block">Aramex</div>
                               )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SUMMARY & PAYMENT EXACT LAYOUT */}
                  <div className="bg-white border border-[#EBEFE9] rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(220,225,235,0.45)] flex flex-col gap-5 mt-2">
                    
                    {/* Header */}
                    <div className="flex items-center gap-3 border-b border-[#EBEFE9] pb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#546a40]/10 flex items-center justify-center text-[#546a40]">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-zinc-900 uppercase tracking-widest">Summary & Payment</h3>
                        <p className="text-[11px] text-[#546a40] font-bold mt-0.5">Order Parameters Ready</p>
                      </div>
                    </div>

                    {/* Map & Locations */}
                    <div className="space-y-4">
                      <div className="h-[200px] w-full rounded-2xl overflow-hidden relative border border-zinc-200 z-0 bg-zinc-50">
                        <YandexMapDisplay 
                           center={selectedOrder.position || [25.2048, 55.2708]} 
                           zoom={11} 
                           markers={[
                             { position: selectedOrder.position || [25.2048, 55.2708], color: '#113f36', hint: 'Order Location' }
                           ]} 
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Pickup Location</span>
                          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-xs font-semibold text-zinc-700 truncate">{selectedOrder.fromDestination || selectedOrder.pickupAddress || 'Dubai'}</span>
                              <span className="text-[10px] text-zinc-500 font-medium truncate">{selectedOrder.merchantName || 'Store'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Dropoff Location</span>
                          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-xs font-semibold text-zinc-700 truncate">{selectedOrder.toDestination || selectedOrder.address || 'Dubai'}</span>
                              <span className="text-[10px] text-zinc-500 font-medium truncate">{selectedOrder.name || user?.displayName || 'Customer'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Package Specs */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Package Specifications</span>
                      <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Weight</span>
                          <span className="text-sm font-bold text-zinc-800">{selectedOrder.weight || '1'} kg</span>
                        </div>
                        <div className="w-px h-6 bg-zinc-200" />
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Dimensions</span>
                          <span className="text-sm font-bold text-zinc-800">
                            {selectedOrder.dimensions || '10x10x10'} cm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Billing Breakdown */}
                    <div className="bg-[#113f36]/5 border border-[#113f36]/15 rounded-2xl p-5 space-y-4 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Base Rate Fee</span>
                        <span className="text-xs font-bold text-zinc-900">AED {(() => { const amt = selectedOrder.orderAmount ? parseFloat(selectedOrder.orderAmount) : 0; return (amt * 0.70).toFixed(2); })()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Processing Commission</span>
                        <span className="text-xs font-bold text-zinc-900">AED {(() => { const amt = selectedOrder.orderAmount ? parseFloat(selectedOrder.orderAmount) : 0; return (amt * 0.15).toFixed(2); })()}</span>
                      </div>
                      
                      <div className="border-t border-[#113f36]/10 pt-3 flex justify-between items-end">
                        <div>
                          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 block">Total Charge</span>
                          <span className="text-xs text-zinc-500 font-medium">{selectedOrder.paymentMethod || 'Incl. VAT'}</span>
                        </div>
                        <span className="font-display font-black text-xl text-[#113f36]">
                          AED {selectedOrder.orderAmount ? parseFloat(selectedOrder.orderAmount).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Lifecycle */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                       <Navigation className="w-4 h-4 text-blue-600" />
                       Shipment Lifecycle
                    </h3>
                    <div className="space-y-0 pl-2 border-l-2 border-zinc-100 ml-2">
                      <TimelinePart dot={<Package className="w-4 h-4" />} title="Processing" desc="Warehouse acknowledged" active />
                      <TimelinePart dot={<Truck className="w-4 h-4" />} title="Out for Delivery" desc="Carrier en-route" active={!!selectedOrder.externalTrackingNumber} />
                      <TimelinePart dot={<CheckCircle2 className="w-4 h-4" />} title="Delivered" desc="Successfully received" last active={selectedOrder.status === 'delivered' || selectedOrder.status === 'Completed'} />
                    </div>
                  </div>
                </div>

                  {(selectedOrder.status === 'Pending' || selectedOrder.status === 'assigning' || selectedOrder.status === 'pending') && (
                    <div className="pt-4 border-t border-zinc-200">
                      <button
                        onClick={() => {
                          updateRequestStatus(selectedOrder.id, 'Rejected');
                          setSelectedOrder(null);
                        }}
                        className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        {t('cancel_order') || 'Cancel Order'}
                      </button>
                    </div>
                  )}

                  {(selectedOrder.status === 'delivered' || selectedOrder.status === 'in_transit') && (
                    <div className="pt-4 border-t border-zinc-200 flex flex-col gap-3">
                      {selectedOrder.status === 'delivered' && (
                        <button
                          onClick={() => {
                            alert(t('leave_review_prompt') || "Rate your experience with the courier (1-5 stars):\n\n★★★★★");
                          }}
                          className="w-full py-3.5 border-2 border-zinc-200 text-zinc-900 hover:bg-zinc-50 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-[15px] uppercase tracking-widest cursor-pointer"
                        >
                          {t('rate_courier') || 'Rate Courier & Review'}
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          alert(t('return_processing_alert') || "Generating reverse-pickup RMA label with Aramex... \n\nCheck your email for the Return Waybill.");
                          // Simulate return generation
                          updateRequestStatus(selectedOrder.id, 'Pending', 'RMA Processing');
                          setSelectedOrder(null);
                        }}
                        className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-[15px] uppercase tracking-widest cursor-pointer"
                      >
                        <Package className="w-4 h-4" />
                        {t('create_rma') || 'Create Return Request (RMA)'}
                      </button>
                    </div>
                  )}

              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
