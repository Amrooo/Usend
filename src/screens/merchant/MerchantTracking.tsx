import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import { Search, MapPin, Package, Clock, X, Phone, User, FileText, Star, AlertCircle, ChevronRight, CheckCircle2, Play, Check, Terminal, Printer, RefreshCw } from 'lucide-react';
import { useState, useEffect, ReactNode } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp, USendRequest } from '../../context/AppContext';
import { courierIntegrationService, defaultAramexCreds } from '../../services/courierIntegration';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MerchantTrackingProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantTracking({ onNavigate }: MerchantTrackingProps) {
  const { t, isRTL } = useLanguage();
  const { activeRequests, user, updateRequest, updateRequestStatus } = useApp();
  const [isMapReady, setIsMapReady] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsMapReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const merchantRequests = activeRequests.filter(req => 
    (user?.uid && req.merchantId === user.uid) || 
    (!user?.uid && req.applicantType === 'Merchant')
  );
  const activeOrders = merchantRequests;

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

      const res = await courierIntegrationService.createShipment('aramex', {
        credentials: defaultAramexCreds,
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
          status: 'Reviewing',
          carrier: 'aramex',
          externalTrackingNumber: res.trackingNumber,
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

  const filteredOrders = activeOrders.filter(order => {
    const statusMap: Record<string, string> = {
      'in_transit': 'in_transit',
      'assigning': 'pending',
      'Pending': 'pending'
    };
    if (filter === 'all') return true;
    const orderStatus = order.status.toLowerCase().replace(' ', '_');
    return orderStatus === filter || (filter === 'pending' && (orderStatus === 'pending' || orderStatus === 'assigning')) || (filter === 'in_transit' && orderStatus === 'in_transit');
  });

  const mapCenter: [number, number] = [25.2048, 55.2708]; // UAE

  const statusTabs = [
    { id: 'all', label: t('all') || 'All' },
    { id: 'pending', label: t('pending') || 'Pending' },
    { id: 'picked_up', label: t('picked_up') || 'Picked Up' },
    { id: 'in_transit', label: t('in_transit') || 'In Transit' },
  ];

  const TimelinePart = ({ dot, title, desc, active, last }: { dot: ReactNode, title: string, desc: string, active?: boolean, last?: boolean }) => (
    <div className="flex gap-4 min-h-[60px]">
       <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${active ? 'bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
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
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_tracking" onNavigate={onNavigate} />
      
      <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100">{t('order_tracking')}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t('monitor_active_deliveries')}</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className={`w-5 h-5 text-zinc-400 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
                <input 
                  type="text" 
                  placeholder={t('search_orders')} 
                  className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-zinc-100 w-full md:w-64`}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative group">
                <div className="flex items-center justify-between mb-2">
                   <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                      <Package className="w-4 h-4" />
                   </div>
                   <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{t('total') || 'Total'}</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{activeOrders.length}</div>
             </div>
             <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative group">
                <div className="flex items-center justify-between mb-2">
                   <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Clock className="w-4 h-4" />
                   </div>
                   <span className="text-[10px] font-black text-blue-500/60 uppercase tracking-wider">{t('in_transit')}</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">1</div>
             </div>
             <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative group">
                <div className="flex items-center justify-between mb-2">
                   <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <CheckCircle2 className="w-4 h-4" />
                   </div>
                   <span className="text-[10px] font-black text-purple-500/60 uppercase tracking-wider">{t('picked_up')}</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">1</div>
             </div>
             <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative group">
                <div className="flex items-center justify-between mb-2">
                   <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <AlertCircle className="w-4 h-4" />
                   </div>
                   <span className="text-[10px] font-black text-orange-500/60 uppercase tracking-wider">{t('pending')}</span>
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">1</div>
             </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
             {statusTabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setFilter(tab.id)}
                 className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
                   filter === tab.id 
                     ? 'bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-500/20' 
                     : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                 }`}
               >
                 {tab.label}
               </button>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
            {/* Real Map */}
            <div className="lg:col-span-2 bg-zinc-200 dark:bg-zinc-800 rounded-3xl h-[400px] lg:h-[600px] relative overflow-hidden border border-zinc-200 dark:border-zinc-800 z-0">
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
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Active Orders List */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[400px] lg:h-[600px] transition-colors">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  {t('active_orders')} ({filteredOrders.length})
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                    const isRejected = order.status === 'Rejected' || order.status === 'Cancelled';
                    return (
                  <button 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl p-4 border transition-all relative overflow-hidden group ${selectedOrder?.id === order.id ? 'border-blue-500 ring-4 ring-blue-500/10 translate-x-1 shadow-md' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm'} ${isRTL ? 'text-right' : 'text-left'} ${isRejected ? 'opacity-50 grayscale' : ''}`}
                  >
                    {/* Status accent bar indicator */}
                    <div className={`absolute top-0 bottom-0 ${isRTL ? 'right-0' : 'left-0'} w-1.5 ${
                      isRejected ? 'bg-red-500' :
                      order.status === 'in_transit' ? 'bg-blue-500' :
                      order.status === 'Approved' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }`} />

                    <div className={`flex flex-col gap-3 ${isRTL ? 'pr-4' : 'pl-4'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                           <div className="flex items-center gap-2">
                             <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{order.name}</h3>
                             <span className="px-1.5 py-0.5 rounded-md bg-zinc-200/50 dark:bg-zinc-700/50 text-[10px] font-black text-zinc-500 dark:text-zinc-400">
                               {order.id}
                             </span>
                           </div>
                           <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-zinc-500">
                             <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                             <span className="truncate max-w-[140px] leading-tight">{order.address}</span>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase ${
                             order.status === 'in_transit' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                             order.status === 'Approved' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                             'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                           }`}>
                             {order.status}
                           </span>
                           <span className="text-[10px] font-bold text-zinc-400">{order.date}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-200/80 dark:border-zinc-700/80">
                        <div className="flex items-center gap-2">
                          <img src={`https://i.pravatar.cc/100?u=${order.driverId || 'default'}`} alt="Driver" className="w-6 h-6 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800" referrerPolicy="no-referrer" />
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{order.driverId || 'Not Assigned'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300">ETA: {order.etaTime}</span>
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
            </div>
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
                className={`relative bg-white dark:bg-zinc-900 shadow-2xl w-full max-w-sm h-full overflow-hidden flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-xs z-10">
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{t('order_details')}</h2>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{liveSelectedOrder.id}</p>
                       <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-855 text-zinc-650 dark:text-zinc-400 px-2 py-0.5 rounded-md">REF-4421</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)} 
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                  {/* Aramex Sandbox Courier Dispatch Action */}
                  {!liveSelectedOrder.externalTrackingNumber && liveSelectedOrder.status !== 'Rejected' && liveSelectedOrder.status !== 'Cancelled' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#d12421]/5 dark:bg-[#d12421]/10 border border-[#d12421]/20 rounded-2xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-extrabold tracking-tight text-[#d12421] lowercase font-sans select-none">aramex</span>
                        <span className="text-[9px] bg-[#d12421]/15 text-[#d12421] px-2 py-0.5 rounded font-black uppercase tracking-wider">Sandbox API Ready</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-normal">
                        This order hasn&apos;t been connected to an active delivery agent carrier yet. Send dispatch signal to verify Aramex SOAP Web Service integrations.
                      </p>
                      <button 
                        onClick={() => handleAramexDispatch(liveSelectedOrder)}
                        disabled={isDispatching}
                        className="w-full bg-[#d12421] hover:bg-zinc-950 text-white font-black text-[10.5px] uppercase tracking-widest py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 select-none cursor-pointer"
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

                  {/* Built-in Waybill & Log viewer */}
                  {liveSelectedOrder.externalTrackingNumber && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-[#d12421] rounded-full" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Aramex Waybill Signal</h3>
                         </div>
                         <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-md">
                           <Check className="w-3 h-3" /> API REGISTERED
                         </span>
                      </div>

                      {/* Printable Waybill design */}
                      <div className="bg-white text-zinc-950 border-2 border-zinc-950 p-4 rounded-3xl font-sans text-left flex flex-col justify-between shadow-xs border-dashed">
                        <div className="border-b-2 border-zinc-950 pb-2 flex justify-between items-start">
                          <span className="text-sm font-black uppercase tracking-tight italic text-[#d12421]">aramex</span>
                          <div className="text-right">
                            <span className="text-[7px] font-black uppercase text-zinc-400 block">Delivery Protocol</span>
                            <span className="text-[8px] font-bold bg-zinc-950 text-white px-1.5 py-0.5 rounded tracking-wide uppercase">COD Parcel</span>
                          </div>
                        </div>

                        <div className="py-2.5 border-b border-zinc-200 grid grid-cols-2 gap-2 text-[9px] font-medium">
                          <div>
                            <span className="font-bold text-zinc-400 block uppercase text-[7px] tracking-wider">Sender</span>
                            <p className="font-extrabold leading-tight">USend Central Depot</p>
                            <p className="text-zinc-500 text-[8px] truncate leading-tight mt-0.5">Jebel Ali Area Node A</p>
                          </div>
                          <div>
                            <span className="font-bold text-zinc-400 block uppercase text-[7px] tracking-wider">Recipient (Buyer)</span>
                            <p className="font-extrabold leading-tight text-zinc-950">{liveSelectedOrder.name}</p>
                            <p className="text-zinc-550 text-[8px] truncate leading-tight mt-0.5">{liveSelectedOrder.address}</p>
                          </div>
                        </div>

                        {/* Cargo dimensions audit */}
                        <div className="py-2 border-b border-zinc-200 grid grid-cols-2 gap-2 text-[8px] font-semibold text-zinc-500">
                          <div>
                            <span className="text-[7px] uppercase block text-zinc-400">Cargo Contents</span>
                            <p className="font-bold text-zinc-800 truncate">{liveSelectedOrder.itemType}</p>
                          </div>
                          <div>
                            <span className="text-[7px] uppercase block text-zinc-400">Declared Value</span>
                            <p className="font-extrabold text-[#d12421]">{liveSelectedOrder.orderAmount}</p>
                          </div>
                        </div>

                        {/* Barcode block */}
                        <div className="py-3 flex flex-col items-center justify-center bg-zinc-50 rounded-2xl my-2 p-2">
                          <div className="flex gap-[1px] h-7 items-stretch mb-1 font-mono">
                            {[2, 4, 1, 3, 2, 4, 1, 3, 1, 4, 2, 3, 1, 2, 3, 1, 4, 1, 2, 4, 1, 3, 4, 1, 2, 3, 4, 1].map((width, i) => (
                              <div key={i} className="bg-zinc-950" style={{ width: `${width}px` }} />
                            ))}
                          </div>
                          <span className="font-mono text-[9px] font-black tracking-widest text-zinc-800">{liveSelectedOrder.externalTrackingNumber}</span>
                        </div>

                        <div className="flex justify-between items-center text-[8px] pt-1.5 text-zinc-400 font-bold">
                          <span>Payment Method: {liveSelectedOrder.paymentMethod}</span>
                          <span className="text-zinc-900 text-[9px] font-black">{liveSelectedOrder.orderAmount}</span>
                        </div>
                      </div>

                      {/* SOAP XML logs expander */}
                      {liveSelectedOrder.aramexLogs && (
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900/40">
                          <button 
                            type="button"
                            onClick={() => setShowSoapLogs(!showSoapLogs)}
                            className="w-full p-3.5 font-extrabold text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800/50 outline-hidden"
                          >
                            <span className="flex items-center gap-1.5 uppercase font-black">
                              <Terminal className="w-3.5 h-3.5 text-blue-500" />
                              SOAP Web Service Traces
                            </span>
                            <span className="text-[9px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">{showSoapLogs ? 'Hide' : 'WSDL XML'}</span>
                          </button>
                          
                          {showSoapLogs && (
                            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3 font-mono text-[8.5px] max-h-[220px] overflow-y-auto bg-black text-zinc-300">
                              <div className="space-y-1">
                                <span className="text-[#1452D1] font-black block uppercase tracking-wider text-[7px]">WSDL ENDPOINT: https://ws.sbx.aramex.net/ShippingAPI.v1</span>
                                <span className="text-zinc-500 italic block text-[7.5px]">SOAPEnvelope XML Request (ClientInfo Header Authorization)</span>
                                <pre className="bg-zinc-950/80 p-2 rounded text-zinc-400 overflow-x-auto select-all leading-normal">
                                  {JSON.stringify(liveSelectedOrder.aramexLogs.request, null, 2)}
                                </pre>
                              </div>
                              <div className="space-y-1 pt-2 border-t border-zinc-900">
                                <span className="text-blue-400 font-black block uppercase tracking-wider text-[7px]">SOAP ACTION: 'CreateShipmentsResponse'</span>
                                <span className="text-zinc-500 italic block text-[7.5px]">API Response Body (JSON/XML structure)</span>
                                <pre className="bg-zinc-950/80 p-2 rounded text-blue-400 overflow-x-auto select-all leading-normal">
                                  {JSON.stringify(liveSelectedOrder.aramexLogs.response, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Status Timeline */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t('current_status')}</h3>
                       </div>
                       <button className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors">
                          <FileText className="w-3.5 h-3.5" />
                          Download AWB
                       </button>
                    </div>
                    <div className="space-y-1">
                       <TimelinePart 
                         dot={<CheckCircle2 className="w-5 h-5" />} 
                         title="Order Formed" 
                         desc="10:30 AM • System Received" 
                         active={true}
                       />
                       <TimelinePart 
                         dot={<Package className="w-5 h-5" />} 
                         title="Courier Dispatched" 
                         desc={liveSelectedOrder.externalTrackingNumber ? "Registered with Aramex Sandbox" : "Awaiting assignment"} 
                         active={liveSelectedOrder.status !== 'Pending' || !!liveSelectedOrder.externalTrackingNumber}
                       />
                       <TimelinePart 
                         dot={<Clock className="w-4 h-4" />} 
                         title="In Transit" 
                         desc="ETA: 10 mins" 
                         active={liveSelectedOrder.status === 'in_transit'}
                       />
                       <TimelinePart 
                         dot={<MapPin className="w-5 h-5" />} 
                         title="Delivered" 
                         desc="Estimate: 11:00 AM" 
                         last
                       />
                    </div>
                  </div>

                  {/* Customer & Items */}
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                         <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t('customer_info')}</h3>
                      </div>
                      <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                         <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?u=${liveSelectedOrder.name}`} alt="" />
                         </div>
                         <div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-100">{liveSelectedOrder.name}</p>
                            <p className="text-xs text-zinc-500" dir="ltr">{liveSelectedOrder.phone || "+971520000000"}</p>
                         </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                         <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t('order_items')}</h3>
                      </div>
                      <div className="bg-zinc-900 text-white p-5 rounded-2xl shadow-md">
                         <div className="flex items-start gap-4">
                            <FileText className="w-5 h-5 mt-0.5 text-zinc-500 animate-pulse" />
                            <p className="text-sm font-medium leading-loose text-zinc-100">{liveSelectedOrder.itemType}</p>
                         </div>
                      </div>
                    </div>
                  </div>

                  {(liveSelectedOrder.status === 'Pending' || liveSelectedOrder.status === 'pending' || liveSelectedOrder.status === 'assigning') && (
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          updateRequestStatus(liveSelectedOrder.id, 'Rejected');
                          setSelectedOrder(null);
                        }}
                        className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        {t('cancel_order') || 'Cancel Order'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                   <div className="flex gap-3">
                      <button className="flex-1 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all">
                         {t('contact_customer') || 'Contact'}
                      </button>
                      <button className="w-12 h-12 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-650">
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
