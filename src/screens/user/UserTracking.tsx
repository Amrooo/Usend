import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../types';
import UserSidebar from '../../components/UserSidebar';
import { Search, MapPin, Package, Clock, X, Phone, FileText, CheckCircle2, AlertCircle, Truck, Navigation } from 'lucide-react';
import { useState, useEffect, ReactNode } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp, USendRequest } from '../../context/AppContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface UserTrackingProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function UserTracking({ onNavigate }: UserTrackingProps) {
  const { t, isRTL } = useLanguage();
  const { activeRequests, user, updateRequestStatus } = useApp();
  const [isMapReady, setIsMapReady] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsMapReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const myRequests = activeRequests.filter(req => 
    (user?.uid && req.userId === user.uid) || 
    (!user?.uid && (req.applicantType === 'Individual User' || req.applicantType === 'User'))
  );
  const activeOrders = myRequests;
  const [selectedOrder, setSelectedOrder] = useState<USendRequest | null>(null);

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

    const statusMap: Record<string, string> = {
      'in_transit': 'in_transit',
      'assigning': 'pending',
      'Pending': 'pending'
    };
    if (filter === 'all') return true;
    const orderStatus = order.status.toLowerCase().replace(' ', '_');
    return orderStatus === filter || (filter === 'pending' && (orderStatus === 'pending' || orderStatus === 'assigning')) || (filter === 'in_transit' && orderStatus === 'in_transit');
  });

  const mapCenter: [number, number] = [25.2048, 55.2708];

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
      <UserSidebar currentScreen="user_tracking" onNavigate={onNavigate} />
      
      <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100">{t('order_tracking') || 'Tracking'}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t('monitor_active_deliveries') || 'Monitor your deliveries'}</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className={`w-5 h-5 text-zinc-400 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_orders') || 'Search...'} 
                  className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-zinc-100 w-full md:w-64`}
                />
              </div>
            </div>
          </div>

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
            <div className="lg:col-span-2 bg-zinc-200 dark:bg-zinc-800 rounded-3xl h-[400px] lg:h-[600px] relative overflow-hidden border border-zinc-200 dark:border-zinc-800 z-0">
              {isMapReady ? (
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
                          {order.name}<br />
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

            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[400px] lg:h-[600px] transition-colors">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  {t('active_orders') || 'Active Orders'} ({filteredOrders.length})
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
                           </div>
                           <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-zinc-500">
                             <span className="px-1.5 py-0.5 rounded-md bg-zinc-200/50 dark:bg-zinc-700/50 font-black text-zinc-500">
                               {order.id}
                             </span>
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
                className={`relative bg-white dark:bg-zinc-900 shadow-2xl w-full max-w-sm h-full overflow-hidden flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{t('order_details') || 'Order Details'}</h2>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{selectedOrder.id}</p>
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
                  
                  {/* Courier Assigment */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Handled By</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                           <Truck className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                             {selectedOrder.courier || (selectedOrder.channel === 'Merchant Portal' ? 'Aramex' : 'USend Fleet')}
                           </p>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                             {(selectedOrder.courier === 'Aramex Cargo' || selectedOrder.channel === 'Merchant Portal') ? 'External Logistics Provider' : 'Internal Fleet Driver'}
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Route Information */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-orange-500 rounded-full" />
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Routing Details</h3>
                     </div>
                     <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 relative overflow-hidden">
                        
                        <div className="flex gap-3 relative z-10">
                           <div className="flex flex-col items-center pt-1">
                              <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-50" />
                              <div className="w-0.5 h-10 bg-zinc-200 dark:bg-zinc-700" />
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-blue-600 tracking-widest uppercase">Pickup Location</p>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                                {selectedOrder.pickupAddress || selectedOrder.fromDestination || 'Dubai, Main Warehouse'}
                              </p>
                           </div>
                        </div>
                        
                        <div className="flex gap-3 relative z-10">
                           <div className="flex flex-col items-center pt-1">
                              <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-50" />
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-blue-600 tracking-widest uppercase">Drop-off Location</p>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                                {selectedOrder.toDestination || selectedOrder.address || 'Loading...'}
                              </p>
                           </div>
                        </div>

                        {/* Subtle background route graphic */}
                        <Navigation className="absolute -right-4 -bottom-4 w-24 h-24 text-zinc-50 dark:text-zinc-800 -z-0 pointer-events-none" />
                     </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-blue-500 rounded-full" />
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t('current_status') || 'Current Status'}</h3>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <TimelinePart 
                         dot={<CheckCircle2 className="w-5 h-5" />} 
                         title="Order Created" 
                         desc="System Received" 
                         active={true}
                       />
                       <TimelinePart 
                         dot={<Package className="w-5 h-5" />} 
                         title="Picked Up" 
                         desc="Courier assigned" 
                         active={selectedOrder.status !== 'Pending' && selectedOrder.status !== 'assigning'}
                       />
                       <TimelinePart 
                         dot={<Clock className="w-4 h-4" />} 
                         title="In Transit" 
                         desc="On the way" 
                         active={selectedOrder.status === 'in_transit'}
                       />
                       <TimelinePart 
                         dot={<MapPin className="w-5 h-5" />} 
                         title="Delivered" 
                         desc="Recipient location" 
                         last
                       />
                    </div>
                  </div>

                  {(selectedOrder.status === 'Pending' || selectedOrder.status === 'assigning' || selectedOrder.status === 'pending') && (
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          updateRequestStatus(selectedOrder.id, 'Rejected');
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
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
