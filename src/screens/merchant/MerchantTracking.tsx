import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import { Search, MapPin, Package, Clock, X, Phone, User, FileText, Star, AlertCircle, ChevronRight, CheckCircle2, Play, Check, Terminal, Printer, RefreshCw, Navigation, CreditCard, Hash, Truck, Send, Zap, ArrowRight, Calendar } from 'lucide-react';
import { useState, useEffect, ReactNode, FC } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp, USendRequest } from '../../context/AppContext';
import { courierIntegrationService, defaultAramexCreds } from '../../services/courierIntegration';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import Barcode from 'react-barcode';



interface MerchantTrackingProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantTracking({ onNavigate }: MerchantTrackingProps) {
  const { t, isRTL } = useLanguage();
  const { activeRequests, user, updateRequest, updateRequestStatus, courierConfigs } = useApp();
  const [isMapReady, setIsMapReady] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('all_carriers');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => setIsMapReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const merchantRequests = activeRequests.filter(req => 
    (user?.uid && req.merchantId === user.uid)
  );
  const activeOrders = merchantRequests;

  // Bottom Grid State
  const [gridSearch, setGridSearch] = useState('');
  const [gridStatusFilter, setGridStatusFilter] = useState('all');
  const [gridPage, setGridPage] = useState(1);
  const gridPageSize = 8;

  const gridFilteredRequests = merchantRequests.filter(order => {
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
    
    // Status Filter
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

    // Carrier Filter
    if (carrierFilter !== 'all_carriers' && order.carrier !== carrierFilter) {
      return false;
    }

    // Date Range Filter
    if (dateRange.start || dateRange.end) {
      const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.parse(order.date);
      if (!isNaN(orderTime)) {
         if (dateRange.start && orderTime < new Date(dateRange.start).getTime()) return false;
         if (dateRange.end && orderTime > new Date(dateRange.end).getTime() + 86400000) return false;
      }
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

  const gridTotalPages = Math.ceil(gridFilteredRequests.length / gridPageSize);
  const gridPaginatedRequests = gridFilteredRequests.slice((gridPage - 1) * gridPageSize, gridPage * gridPageSize);

  const [selectedOrder, setSelectedOrder] = useState<USendRequest | null>(null);
  const liveSelectedOrder = selectedOrder ? (merchantRequests.find(r => r.id === selectedOrder.id) || selectedOrder) : null;
  const [isDispatching, setIsDispatching] = useState(false);
  const [showSoapLogs, setShowSoapLogs] = useState(false);

  const handleAramexDispatch = async (req: USendRequest) => {
    setIsDispatching(true);
    try {
      let numericCod = 0;
      if (req.orderAmount) {
        const parsed = parseInt(req.orderAmount.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed)) {
          numericCod = parsed;
        }
      }

      const aramexConfig = courierConfigs?.aramex;
      const activeCreds = aramexConfig
        ? (aramexConfig.currentMode === 'sandbox' ? aramexConfig.sandboxCreds : aramexConfig.productionCreds)
        : null;
      const hasValidAramex = activeCreds && activeCreds.username && activeCreds.accountNumber;
      const finalAramexCreds = hasValidAramex
        ? { ...activeCreds, apiEnv: aramexConfig?.currentMode || 'sandbox' }
        : defaultAramexCreds;

      const res = await courierIntegrationService.createShipment('aramex', {
        credentials: finalAramexCreds,
        senderName: "USend Central Depot",
        senderPhone: "+971500000000",
        senderCity: "Dubai",
        senderCountry: "AE",
        senderAddress: "Jebel Ali Area Node A",
        receiverName: req.name || "Recipient Buyer",
        receiverPhone: req.phone || "+971520000000",
        receiverCity: req.toDestination || "Abu Dhabi",
        receiverCountry: "AE",
        receiverAddress: req.address || req.toDestination || "Corniche Street Apt 4",
        goodsDescription: req.itemType || "E-Commerce Delivery Order Cargo",
        weightKg: 1.5,
        codAmountAED: numericCod
      });

      if (res.success) {
        await updateRequest(req.id, {
          status: 'Assigned',
          carrier: 'aramex',
          externalTrackingNumber: res.trackingNumber,
          awbLabelBase64: res.base64Label,
          awbLabelUrl: res.labelUrl,
          aramexLogs: {
            request: res.requestPayload,
            response: res.responsePayload,
            timestamp: res.timestamp
          }
        });
      } else {
        alert("Aramex Dispatch Failed: " + (res.error || "Unknown error generating shipment."));
        await updateRequest(req.id, {
          aramexLogs: {
            request: res.requestPayload || {},
            response: res.responsePayload || { error: res.error },
            timestamp: res.timestamp || new Date().toISOString()
          }
        });
      }
    } catch (err: any) {
      console.error("Failed to dispatch to Aramex:", err);
      alert("System Error: " + err.message);
    } finally {
      setIsDispatching(false);
    }
  };



  const handleNoonDispatch = async (req: USendRequest) => {
    setIsDispatching(true);
    try {
      let numericCod = 0;
      if (req.orderAmount) {
        const parsed = parseInt(req.orderAmount.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed)) {
          numericCod = parsed;
        }
      }

      // Convert COD value to fills (Noon requirement: integer, in fills not dirhams)
      const codValueFils = Math.round(numericCod * 100);

      const noonConfig = courierConfigs?.noon;
      const noonCreds = noonConfig
        ? (noonConfig.currentMode === 'sandbox' ? noonConfig.sandboxCreds : noonConfig.productionCreds)
        : undefined;

      console.log(`[Noon Dispatch] Processing order ${req.id} through Noon API...`);
      const payload = {
        senderName: "USend Merchant",
        senderPhone: "+971500000000",
        senderCity: "Dubai",
        senderCountry: "AE",
        senderAddress: "Merchant Location",
        receiverName: req.name || "Recipient Buyer",
        receiverPhone: req.phone || "+971520000000",
        receiverCity: "Dubai",
        receiverCountry: "AE",
        receiverAddress: req.address || "Corniche Street, Dubai, UAE",
        goodsDescription: req.description || "Package",
        weightKg: 1,
        codAmountAED: numericCod,
        reference: req.id,
        credentials: noonCreds ? { ...noonCreds, apiEnv: noonConfig?.currentMode } : { apiEnv: 'sandbox' }
      };

      const res = await courierIntegrationService.createShipment('noon', payload);

      if (res.success && res.trackingNumber) {
        await updateRequest(req.id, {
          status: 'Assigned',
          carrier: 'noon',
          externalTrackingNumber: res.trackingNumber,
          carrierLogs: {
            request: payload,
            response: res,
            timestamp: new Date().toISOString()
          }
        });
        alert(`Noon Dispatch Succeeded! mp_task_nr: ${res.trackingNumber}`);
      } else {
        alert("Noon Dispatch Failed: " + (res.error || "Unknown error generating Noon delivery task."));
        await updateRequest(req.id, {
          carrierLogs: {
            request: payload,
            response: res,
            timestamp: new Date().toISOString(),
            error: res.error
          }
        });
      }
    } catch (err: any) {
      console.error("Failed to dispatch to Noon:", err);
      alert("System Error: " + err.message);
    } finally {
      setIsDispatching(false);
    }
  };

  const handlePickupRequest = async (req: USendRequest) => {
    setIsDispatching(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const res = await courierIntegrationService.schedulePickup('aramex', {
         credentials: defaultAramexCreds,
         pickupDate: todayDate,
         readyTime: "14:00:00",
         contactName: "Warehouse Ops",
         contactPhone: "+971501234567",
         contactRegion: "Dubai"
      });

      if (res.success) {
        alert(`Pickup Scheduled successfully! Pickup ID: ${res.pickupId}`);
        await updateRequest(req.id, {
          aramexLogs: {
            request: res.requestPayload,
            response: res.responsePayload,
            timestamp: res.timestamp,
            pickupId: res.pickupId
          }
        });
      } else {
        alert("Aramex Pickup Request Failed: " + (res.error || "Unknown error"));
        // update request with failure payload so user can see it in SOAP view
        await updateRequest(req.id, {
          aramexLogs: {
            request: res.requestPayload || {},
            response: res.responsePayload || { error: res.error },
            timestamp: res.timestamp,
            pickupId: req.aramexLogs?.pickupId
          }
        });
      }
    } catch (err: any) {
      console.error("Failed to request pickup:", err);
      alert("System Error: " + err.message);
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredOrders = activeOrders.filter(order => {
    // 1. Status Filter
    const orderStatus = order.status.toLowerCase().replace(' ', '_');
    const matchesStatus = filter === 'all' || 
                          orderStatus === filter || 
                          (filter === 'pending' && (orderStatus === 'pending' || orderStatus === 'assigning' || orderStatus === 'approved' || orderStatus === 'assigned' || orderStatus === 'created')) || 
                          (filter === 'in_transit' && (orderStatus === 'in_transit' || orderStatus === 'en-route')) || 
                          (filter === 'picked_up' && orderStatus === 'picked_up') ||
                          (filter === 'delivered' && (orderStatus === 'delivered' || orderStatus === 'completed')) ||
                          (filter === 'cancelled' && (orderStatus === 'rejected' || orderStatus === 'exceptions' || orderStatus === 'cancelled'));

    // 2. Search Filter (Unified with gridSearch)
    const sTerm = gridSearch.toLowerCase();
    const searchStr = (order.id + ' ' + order.name + ' ' + (order.externalTrackingNumber || '')).toLowerCase();
    const matchesSearch = !sTerm || searchStr.includes(sTerm);

    // 3. Carrier Filter
    const matchesCarrier = carrierFilter === 'all_carriers' || (order.carrier === carrierFilter);

    // 4. Date Range Filter
    let matchesDate = true;
    if (dateRange.start || dateRange.end) {
      const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.parse(order.date);
      if (!isNaN(orderTime)) {
         if (dateRange.start && orderTime < new Date(dateRange.start).getTime()) matchesDate = false;
         if (dateRange.end && orderTime > new Date(dateRange.end).getTime() + 86400000) matchesDate = false;
      }
    }

    return matchesStatus && matchesSearch && matchesCarrier && matchesDate;
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

  const mapCenter: [number, number] = [25.2048, 55.2708]; // UAE

  const statusTabs = [
    { id: 'all', label: t('all') || 'All' },
    { id: 'pending', label: t('pending') || 'Pending' },
    { id: 'picked_up', label: t('picked_up') || 'Picked Up' },
    { id: 'in_transit', label: t('in_transit') || 'In Transit' },
    { id: 'delivered', label: t('delivered') || 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const TimelinePart: FC<{ dot: ReactNode, title: string, desc: string, active?: boolean, last?: boolean }> = ({ dot, title, desc, active, last }) => (
    <div className="flex gap-4 min-h-[60px]">
       <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${active ? 'bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg shadow-[#113f36]/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
             {dot}
          </div>
          {!last && <div className={`w-0.5 flex-1 ${active ? 'bg-gradient-to-r from-blue-700 to-blue-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>}
       </div>
       <div className="pb-6">
          <h4 className={`font-bold text-sm ${active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>{title}</h4>
          <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
       </div>
    </div>
  );

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_tracking" onNavigate={onNavigate} />
      
      <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-900">{t('order_tracking')}</h1>
              <p className="text-zinc-500 mt-1">{t('monitor_active_deliveries')}</p>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm overflow-hidden relative group">
                <div className="flex items-center justify-between mb-2">
                   <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500">
                      <Package className="w-4 h-4" />
                   </div>
                   <span className="text-[12px] font-black text-zinc-400 uppercase tracking-wider">{t('total') || 'Total'}</span>
                </div>
                <div className="text-2xl font-black text-zinc-900">{activeOrders.length}</div>
             </div>
             <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm overflow-hidden relative group">
                <div className="flex items-center justify-between mb-2">
                   <div className="w-8 h-8 rounded-xl bg-[#113f36]/10 flex items-center justify-center text-[#113f36]">
                      <Clock className="w-4 h-4" />
                   </div>
                   <span className="text-[12px] font-black text-[#113f36]/60 uppercase tracking-wider">{t('in_transit')}</span>
                </div>
                <div className="text-2xl font-black text-zinc-900">1</div>
             </div>
             <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm overflow-hidden relative group">
                <div className="flex items-center justify-between mb-2">
                   <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <CheckCircle2 className="w-4 h-4" />
                   </div>
                   <span className="text-[12px] font-black text-purple-500/60 uppercase tracking-wider">{t('picked_up')}</span>
                </div>
                <div className="text-2xl font-black text-zinc-900">1</div>
             </div>
             <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm overflow-hidden relative group">
                <div className="flex items-center justify-between mb-2">
                   <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <AlertCircle className="w-4 h-4" />
                   </div>
                   <span className="text-[12px] font-black text-orange-500/60 uppercase tracking-wider">{t('pending')}</span>
                </div>
                <div className="text-2xl font-black text-zinc-900">1</div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
            {/* Real Map */}
            <div className="lg:col-span-2 bg-zinc-200 rounded-3xl h-[240px] lg:h-[300px] relative overflow-hidden border border-zinc-200 z-0">
              {isMapReady ? (
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  {activeOrders.map((order) => (
                    <Marker 
                      key={order.id} 
                      position={order.position || [25.2, 55.2]}
                      eventHandlers={{
                        click: () => setSelectedOrder(order),
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>{order.id}</strong><br />
                          {order.customer}<br />
                          {order.status}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-[#113f36] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Active Orders List */}
            <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 flex flex-col min-h-[240px] lg:h-[300px] transition-colors">
              <div className="p-6 border-b border-zinc-200">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#113f36] rounded-full animate-pulse"></div>
                  {t('active_orders')} ({filteredOrders.length})
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {paginatedOrders.length > 0 ? paginatedOrders.map((order) => {
                    const isRejected = order.status === 'Rejected' || order.status === 'Cancelled';
                    return (
                  <button 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left bg-zinc-50 hover:bg-zinc-100 rounded-2xl p-4 border transition-all relative overflow-hidden group ${selectedOrder?.id === order.id ? 'border-[#113f36] ring-4 ring-blue-500/10 translate-x-1 shadow-md' : 'border-zinc-200 hover:border-zinc-300'} ${isRTL ? 'text-right' : 'text-left'} ${isRejected ? 'opacity-50 grayscale' : ''}`}
                  >
                    {/* Status accent bar indicator */}
                    <div className={`absolute top-0 bottom-0 ${isRTL ? 'right-0' : 'left-0'} w-1.5 ${
                      isRejected ? 'bg-red-500' :
                      order.status === 'delivered' || order.status === 'Completed' ? 'bg-[#113f36]' :
                      order.status === 'in_transit' ? 'bg-amber-500' :
                      order.status === 'Assigned' ? 'bg-indigo-500' :
                      order.status === 'Approved' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }`} />

                    <div className={`flex flex-col gap-3 ${isRTL ? 'pr-4' : 'pl-4'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                           <div className="flex flex-wrap items-center gap-2">
                             <h3 className="text-sm font-bold text-zinc-900">{order.name}</h3>
                             {order.carrier === 'aramex' && <span className="bg-[#d12421] text-white px-1.5 py-0.5 rounded-md text-[13px] font-black uppercase">Aramex</span>}
                              {order.carrier === 'noon' && <span className="bg-[#feee00] text-black px-1.5 py-0.5 rounded-md text-[13px] font-black uppercase border border-amber-300">Noon</span>}
                             {order.carrier === 'dhl_express' && <span className="bg-yellow-400 text-red-600 px-1.5 py-0.5 rounded-md text-[13px] font-black uppercase">DHL</span>}
                             {order.carrier === 'usend' && <span className="bg-zinc-900 text-white px-1.5 py-0.5 rounded-md text-[13px] font-black uppercase">USend</span>}
                             <span className="px-1.5 py-0.5 rounded-md bg-zinc-200/50 text-[12px] font-black text-zinc-500">
                               {order.id}
                             </span>
                           </div>
                           <div className="flex items-center gap-1 mt-1 text-[13px] font-medium text-zinc-500">
                             <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                             <span className="truncate max-w-[140px] leading-tight">{order.address}</span>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className={`px-2 py-0.5 rounded-lg text-[13px] font-black tracking-wider uppercase ${
                              order.status === 'delivered' || order.status === 'Completed' ? 'bg-[#113f36]/10 text-[#113f36]' :
                              order.status === 'in_transit' ? 'bg-amber-50 text-amber-700' :
                              order.status === 'Assigned' ? 'bg-indigo-50 text-indigo-700 font-bold' :
                              order.status === 'Approved' ? 'bg-purple-50 text-purple-600' :
                              'bg-orange-50 text-orange-600'
                            }`}>
                              {order.status}
                           </span>
                           <span className="text-[12px] font-bold text-zinc-400">{order.date}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-200/80">
                        <div className="flex items-center gap-2">
                          <img src={`https://i.pravatar.cc/100?u=${order.driverId || 'default'}`} alt="Driver" className="w-6 h-6 rounded-full object-cover ring-2 ring-white" referrerPolicy="no-referrer" />
                          <span className="text-xs font-bold text-zinc-700">{order.driverId || 'Not Assigned'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 bg-zinc-100 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3 text-[#113f36]" />
                          <span className="text-[12px] font-black text-zinc-700">ETA: {order.etaTime}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )}) : (
                   <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-10">
                      <Package className="w-12 h-12 mb-2 opacity-20" />
                      <p className="text-sm font-medium">No orders found</p>
                   </div>
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between rounded-b-3xl">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-bold text-zinc-700 disabled:opacity-50 hover:bg-zinc-100 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-sm font-medium text-zinc-500">Page {currentPage} of {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-bold text-zinc-700 disabled:opacity-50 hover:bg-zinc-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* All Orders Table Grid Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden mt-8">
            <div className="p-8 border-b border-zinc-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#113f36]" />
                  {t('all_orders') || 'All Shipments Ledger'}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">Filter, search, and track all your past and current orders.</p>
              </div>

              {/* Integrated Filters & Grid Search */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="relative min-w-[200px] flex-1">
                  <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                  <input 
                    type="text" 
                    placeholder={t('search_orders') || 'Search orders...'}
                    value={gridSearch}
                    onChange={(e) => { setGridSearch(e.target.value); setGridPage(1); }}
                    className={`w-full h-10 pl-9 pr-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-hidden focus:border-[#113f36] focus:ring-4 focus:ring-[#113f36]/5 transition-all ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>

                {/* Date range picker */}
                <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 h-10">
                  <input 
                     type="date" 
                     value={dateRange.start} 
                     onChange={(e) => { setDateRange(p => ({...p, start: e.target.value})); setGridPage(1); }}
                     className="bg-transparent text-xs text-zinc-600 outline-none font-medium border-none focus:ring-0 p-0"
                  />
                  <span className="text-zinc-400 self-center">-</span>
                  <input 
                     type="date" 
                     value={dateRange.end} 
                     onChange={(e) => { setDateRange(p => ({...p, end: e.target.value})); setGridPage(1); }}
                     className="bg-transparent text-xs text-zinc-600 outline-none font-medium border-none focus:ring-0 p-0"
                  />
                </div>

                {/* Carrier Filter */}
                <select 
                  value={carrierFilter}
                  onChange={(e) => { setCarrierFilter(e.target.value); setGridPage(1); }}
                  className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 h-10 outline-none text-zinc-900 text-xs font-bold min-w-[120px]"
                >
                  <option value="all_carriers">All Carriers</option>
                  <option value="aramex">Aramex</option>
                  <option value="dhl_express">DHL</option>
                  <option value="usend">USend Fleet</option>
                </select>

                {/* Sort Order */}
                <select
                  value={sortOrder}
                  onChange={(e) => { setSortOrder(e.target.value as any); setGridPage(1); }}
                  className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 h-10 outline-none text-zinc-900 text-xs font-bold min-w-[120px]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
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
                  onClick={() => { setGridStatusFilter(tab.id); setFilter(tab.id); setGridPage(1); }}
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
        
        {/* Advanced Order Details Side-Sheet */}
        <AnimatePresence>
          {selectedOrder && liveSelectedOrder && (
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
                className={`relative bg-white shadow-2xl w-[95%] md:w-full md:max-w-2xl h-full overflow-hidden flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div className="p-6 border-b border-zinc-200 flex items-center justify-between shadow-xs z-10">
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{t('order_details')}</h2>
                     <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{liveSelectedOrder.id}</p>
                        {liveSelectedOrder.externalTrackingNumber && (
                           <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200 uppercase">
                              {liveSelectedOrder.externalTrackingNumber}
                           </span>
                        )}
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
                        liveSelectedOrder.status === 'delivered' || liveSelectedOrder.status === 'Completed' ? 'bg-[#113f36]' : 'bg-amber-500'
                      }`}>
                        {liveSelectedOrder.status === 'delivered' || liveSelectedOrder.status === 'Completed' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Current Status</p>
                        <h4 className="text-sm font-black text-zinc-900 uppercase mt-1">{liveSelectedOrder.status}</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Estimated Delivery</p>
                      <h4 className="text-sm font-black text-zinc-900 uppercase mt-1">{liveSelectedOrder.etaTime || 'Calculating...'}</h4>
                    </div>
                  </div>

                  {/* Enhanced Waybill Stamp */}
                  {(selectedOrder.externalTrackingNumber || liveSelectedOrder.status === 'Dispatch Failed') && (
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
                        <div className={`px-3 py-1.5 rounded-xl flex flex-col items-end ${liveSelectedOrder.status === 'Dispatch Failed' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-zinc-900 text-white'}`}>
                           <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Carrier ID</span>
                           <span className="text-xs font-black font-mono">{liveSelectedOrder.status === 'Dispatch Failed' ? 'FAILED' : selectedOrder.externalTrackingNumber}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
                        <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Shipper</p>
                          <p className="text-xs font-black text-zinc-900 leading-tight">{selectedOrder.merchantName || 'Store'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Consignee</p>
                          <p className="text-xs font-black text-zinc-900 leading-tight">{selectedOrder.name || (selectedOrder.customerName || 'Customer')}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center pt-6 border-t border-zinc-200 relative z-10">
                        {liveSelectedOrder.status === 'Dispatch Failed' ? (
                          <div className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 items-start">
                             <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                             <div>
                                <h4 className="text-xs font-bold text-red-900 uppercase tracking-widest mb-1">Dispatch Failed</h4>
                                <p className="text-xs text-red-700 leading-relaxed font-medium">
                                   {liveSelectedOrder.dispatchError || "The order could not be sent to the courier. Please check the provided details and try again or contact support."}
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

                    {/* Locations */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Pickup Location</span>
                        <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-semibold text-zinc-700 truncate">{liveSelectedOrder.fromDestination || liveSelectedOrder.pickupAddress || 'Dubai'}</span>
                            <span className="text-[10px] text-zinc-500 font-medium truncate">{liveSelectedOrder.merchantName || 'Store'} ({liveSelectedOrder.phone || 'N/A'})</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Dropoff Location</span>
                        <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-semibold text-zinc-700 truncate">{liveSelectedOrder.toDestination || liveSelectedOrder.address || 'Dubai'}</span>
                            <span className="text-[10px] text-zinc-500 font-medium truncate">{liveSelectedOrder.name || 'Customer'}</span>
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
                          <span className="text-sm font-bold text-zinc-800">{liveSelectedOrder.weight || '1'} kg</span>
                        </div>
                        <div className="w-px h-6 bg-zinc-200" />
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Dimensions</span>
                          <span className="text-sm font-bold text-zinc-800">
                            {liveSelectedOrder.dimensions || '10x10x10'} cm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Billing Breakdown */}
                    <div className="bg-[#113f36]/5 border border-[#113f36]/15 rounded-2xl p-5 space-y-4 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Base Rate Fee</span>
                        <span className="text-xs font-bold text-zinc-900">AED {(() => { const amt = liveSelectedOrder.orderAmount ? parseFloat(liveSelectedOrder.orderAmount) : 0; return (amt * 0.70).toFixed(2); })()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] uppercase font-black tracking-widest text-zinc-500">Processing Commission</span>
                        <span className="text-xs font-bold text-zinc-900">AED {(() => { const amt = liveSelectedOrder.orderAmount ? parseFloat(liveSelectedOrder.orderAmount) : 0; return (amt * 0.15).toFixed(2); })()}</span>
                      </div>
                      
                      <div className="border-t border-[#113f36]/10 pt-3 flex justify-between items-end">
                        <div>
                          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 block">Total Charge</span>
                          <span className="text-xs text-zinc-500 font-medium">Incl. VAT</span>
                        </div>
                        <span className="font-display font-black text-xl text-[#113f36]">
                          AED {liveSelectedOrder.orderAmount ? parseFloat(liveSelectedOrder.orderAmount).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Timeline */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                       <Navigation className="w-4 h-4 text-[#113f36]" />
                       Shipment Timeline
                    </h3>
                    <div className="space-y-0 pl-2 border-l-2 border-zinc-100 ml-2">
                      <TimelinePart dot={<Package className="w-4 h-4" />} title="Order Dispatched" desc={liveSelectedOrder.date} active />
                      <TimelinePart dot={<Truck className="w-4 h-4" />} title="Carrier Handoff" desc="Carrier acknowledged" active={!!liveSelectedOrder.externalTrackingNumber} />
                      <TimelinePart dot={<CheckCircle2 className="w-4 h-4" />} title="Completed" desc="Successfully delivered" last active={liveSelectedOrder.status === 'delivered' || liveSelectedOrder.status === 'Completed'} />
                    </div>
                  </div>
                </div>

                  {/* Courier Dispatch Actions */}
                  {!liveSelectedOrder.externalTrackingNumber && liveSelectedOrder.status !== 'Rejected' && liveSelectedOrder.status !== 'Cancelled' && (
                    <>
                      {/* Courier Dispatch Actions — check .carrier (not .courier) */}
                      {(liveSelectedOrder.carrier || '').toLowerCase().includes('noon') ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-extrabold tracking-tight text-amber-600 lowercase font-sans select-none">noon <span className="font-light text-zinc-400">RoD</span></span>
                            <span className="text-[13px] bg-amber-500/15 text-amber-700 px-2 py-0.5 rounded font-black uppercase tracking-wider">Staging API Ready</span>
                          </div>
                          <p className="text-[12px] text-zinc-500 leading-normal">
                            This order hasn&apos;t been connected to an active Noon Rider on Demand task yet. Send dispatch signal to verify Noon Staging Hyperlocal API integrations.
                          </p>
                          <button 
                            onClick={() => handleNoonDispatch(liveSelectedOrder)}
                            disabled={isDispatching}
                            className="w-full bg-amber-500 hover:bg-zinc-950 text-white font-black text-[12px] uppercase tracking-widest py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 select-none cursor-pointer"
                          >
                            {isDispatching ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                            <span>Dispatch to Noon Staging</span>
                          </button>
                        </motion.div>
                      ) : (
                        /* Aramex Sandbox Courier Dispatch Action */
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-[#d12421]/5 border border-[#d12421]/20 rounded-2xl p-5 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-extrabold tracking-tight text-[#d12421] lowercase font-sans select-none">aramex</span>
                            <span className="text-[13px] bg-[#d12421]/15 text-[#d12421] px-2 py-0.5 rounded font-black uppercase tracking-wider">Sandbox API Ready</span>
                          </div>
                          <p className="text-[12px] text-zinc-500 leading-normal">
                            This order hasn&apos;t been connected to an active delivery agent carrier yet. Send dispatch signal to verify Aramex SOAP Web Service integrations.
                          </p>
                          <button 
                            onClick={() => handleAramexDispatch(liveSelectedOrder)}
                            disabled={isDispatching}
                            className="w-full bg-[#d12421] hover:bg-zinc-950 text-white font-black text-[12px] uppercase tracking-widest py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 select-none cursor-pointer"
                          >
                            {isDispatching ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                            <span>Dispatch to Aramex Courier</span>
                          </button>
                        </motion.div>
                      )}
                    </>
                  )}

                  {/* API Traces Expanders */}
                  <div className="space-y-3">
                    {/* Aramex Waybill Signal Status */}
                    {liveSelectedOrder.externalTrackingNumber && (liveSelectedOrder.carrier || '').toLowerCase().includes('aramex') && (
                       <div className="flex items-center justify-between bg-[#113f36]/5 p-3 rounded-xl border border-[#113f36]/10">
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-4 bg-[#d12421] rounded-full" />
                             <h3 className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Aramex Waybill Signal</h3>
                          </div>
                          <span className="text-[10px] text-[#113f36] font-extrabold flex items-center gap-1">
                            <Check className="w-3 h-3" /> API REGISTERED
                          </span>
                       </div>
                    )}

                    {/* SOAP XML logs expander */}
                    {liveSelectedOrder.aramexLogs && (
                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-zinc-50">
                        <button 
                          type="button"
                          onClick={() => setShowSoapLogs(!showSoapLogs)}
                          className="w-full p-3.5 font-extrabold text-[11px] text-zinc-500 flex items-center justify-between hover:bg-zinc-100 outline-hidden"
                        >
                          <span className="flex items-center gap-1.5 uppercase font-black tracking-widest">
                            <Terminal className="w-3.5 h-3.5 text-[#113f36]" />
                            ARAMEX SOAP TRACES
                          </span>
                          <span className="text-[10px] font-bold text-[#113f36] bg-[#113f36]/10 border border-[#113f36]/15 px-2 py-0.5 rounded uppercase">{showSoapLogs ? 'Hide' : 'API JSON'}</span>
                        </button>
                        
                        {showSoapLogs && (
                          <div className="p-3 border-t border-zinc-200 space-y-3 font-mono text-[11px] max-h-[220px] overflow-y-auto bg-[#113f36]/5 text-zinc-700">
                            <div className="space-y-1">
                              <span className="text-[#113f36] font-black block uppercase tracking-wider text-[11px]">WSDL ENDPOINT: https://ws.aramex.net/ShippingAPI.v1</span>
                              <pre className="bg-white/80 border border-zinc-200 p-2 rounded text-zinc-600 overflow-x-auto select-all leading-normal">
                                {JSON.stringify(liveSelectedOrder.aramexLogs.request, null, 2)}
                              </pre>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-zinc-200">
                              <span className="text-[#6d8c55] font-black block uppercase tracking-wider text-[11px]">SOAP ACTION: 'CreateShipmentsResponse'</span>
                              <pre className="bg-white/80 border border-zinc-200 p-2 rounded text-[#6d8c55] overflow-x-auto select-all leading-normal">
                                {JSON.stringify(liveSelectedOrder.aramexLogs.response, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Noon JSON REST logs expander */}
                    {liveSelectedOrder.noonLogs && (
                      <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-zinc-50">
                        <button 
                          type="button"
                          onClick={() => setShowSoapLogs(!showSoapLogs)}
                          className="w-full p-3.5 font-extrabold text-[11px] text-zinc-500 flex items-center justify-between hover:bg-zinc-100 outline-hidden"
                        >
                          <span className="flex items-center gap-1.5 uppercase font-black tracking-widest">
                            <Terminal className="w-3.5 h-3.5 text-amber-600" />
                            NOON STAGING REST TRACES
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded uppercase">{showSoapLogs ? 'Hide' : 'API JSON'}</span>
                        </button>
                        
                        {showSoapLogs && (
                          <div className="p-3 border-t border-zinc-200 space-y-3 font-mono text-[11px] max-h-[220px] overflow-y-auto bg-amber-50/70 text-zinc-700">
                            <div className="space-y-1">
                              <span className="text-amber-700 font-black block uppercase tracking-wider text-[11px]">REST ENDPOINT: POST https://food-api-team.noonstg.team/public/v1/create-task</span>
                              <pre className="bg-white/80 border border-amber-200 p-2 rounded text-zinc-600 overflow-x-auto select-all leading-normal">
                                {JSON.stringify(liveSelectedOrder.noonLogs.request, null, 2)}
                              </pre>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-amber-200">
                              <span className="text-[#6d8c55] font-black block uppercase tracking-wider text-[11px]">RESPONSE CODES: 200/201 SUCCESS</span>
                              <pre className="bg-white/80 border border-amber-200 p-2 rounded text-[#6d8c55] overflow-x-auto select-all leading-normal">
                                {JSON.stringify(liveSelectedOrder.noonLogs.response, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {(liveSelectedOrder.status === 'Pending' || liveSelectedOrder.status === 'pending' || liveSelectedOrder.status === 'assigning') && (
                    <div className="pt-4 border-t border-zinc-200">
                      <button
                        onClick={() => {
                          updateRequestStatus(liveSelectedOrder.id, 'Rejected');
                          setSelectedOrder(null);
                        }}
                        className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        {t('cancel_order') || 'Cancel Order'}
                      </button>
                    </div>
                  )}

                <div className="p-6 border-t border-zinc-100 bg-white">
                   <div className="flex gap-3">
                      <button className="flex-1 py-3 bg-[#113f36] hover:bg-[#113f36]/90 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all">
                         {t('contact_customer') || 'Contact Customer'}
                      </button>
                      <button className="w-12 h-12 flex items-center justify-center border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-600 hover:bg-zinc-100 transition-colors">
                         <Phone className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
