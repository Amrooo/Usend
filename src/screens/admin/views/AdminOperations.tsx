import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp, USendRequest } from '../../../context/AppContext';
import { Package, Clock, ShieldAlert, Truck, ChevronRight, X, AlertCircle } from 'lucide-react';

// Setup leaflet marker icons properly for React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'out for delivery':
    case 'accepted':
    case 'picked up': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
    case 'exceptions':
    case 'cancelled':
    case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
};

export default function AdminOperations() {
  const { activeRequests } = useApp();
  const [filter, setFilter] = useState<'All' | 'Active' | 'Exceptions'>('Active');
  const [selectedRequest, setSelectedRequest] = useState<USendRequest | null>(null);

  const filteredRequests = useMemo(() => {
    return activeRequests.filter(req => {
      const status = req.status?.toLowerCase() || '';
      if (filter === 'Exceptions') {
        return status === 'exceptions' || status === 'rejected' || status === 'cancelled';
      }
      if (filter === 'Active') {
        return status !== 'delivered' && status !== 'cancelled' && status !== 'rejected';
      }
      return true;
    });
  }, [activeRequests, filter]);

  // Center on Dubai by default if no requests have position
  const defaultCenter: [number, number] = [25.2048, 55.2708];

  return (
    <div className="h-full flex flex-col md:flex-row bg-white relative">
      {/* Left Sidebar - List */}
      <div className="w-full md:w-96 border-r border-zinc-200 flex flex-col h-full bg-white z-10 shadow-sm relative">
        <div className="p-6 border-b border-zinc-100">
          <h1 className="text-xl font-black text-zinc-900 tracking-tight">Control Tower</h1>
          <p className="text-sm text-zinc-500 mt-1">Live monitoring of logistics network.</p>

          <div className="flex bg-zinc-100 p-1 rounded-xl mt-4">
            {['All', 'Active', 'Exceptions'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${filter === f ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 font-medium">No {filter.toLowerCase()} shipments.</p>
            </div>
          ) : (
            filteredRequests.map(req => (
              <motion.div
                layout
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedRequest?.id === req.id 
                    ? 'border-zinc-900 bg-zinc-50 shadow-sm' 
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-zinc-500">{req.id}</span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-zinc-900 line-clamp-1">{req.name}</h3>
                <div className="mt-3 flex items-center gap-4 text-xs font-medium text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[100px]">{req.carrier || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{req.etaTime || 'No ETA'}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-full bg-zinc-100">
        <MapContainer 
          center={defaultCenter} 
          zoom={11} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {filteredRequests.map(req => {
            if (!req.position) return null;
            return (
              <Marker 
                key={req.id} 
                position={req.position}
                icon={customIcon}
                eventHandlers={{
                  click: () => setSelectedRequest(req)
                }}
              >
                <Popup className="rounded-xl border-0 shadow-xl">
                  <div className="p-1">
                    <div className="text-xs font-mono text-zinc-500 mb-1">{req.id}</div>
                    <div className="font-bold text-sm text-zinc-900 mb-2">{req.name}</div>
                    <div className={`text-[10px] inline-block uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${getStatusColor(req.status)}`}>
                      {req.status}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Selected Request Details Overlay */}
        <AnimatePresence>
          {selectedRequest && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-6 right-6 w-80 bg-white/95 backdrop-blur-xl border border-zinc-200 rounded-2xl shadow-2xl z-[1000] overflow-hidden flex flex-col max-h-[calc(100%-3rem)]"
            >
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/95 z-10">
                <h3 className="font-bold text-zinc-900">Shipment Details</h3>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-bold">{selectedRequest.id}</span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Customer / Merchant</span>
                    <p className="font-medium text-sm text-zinc-900">{selectedRequest.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{selectedRequest.channel}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Carrier Integration</span>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-zinc-400" />
                      <p className="font-medium text-sm text-zinc-900">{selectedRequest.carrier || 'Unassigned'}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Origin & Destination</span>
                    <div className="relative pl-3 space-y-3 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-200">
                      <div className="relative">
                        <div className="absolute left-[-15px] top-1.5 w-2 h-2 rounded-full bg-zinc-900 border-2 border-white" />
                        <p className="text-xs font-medium text-zinc-900 line-clamp-2">{selectedRequest.fromDestination}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute left-[-15px] top-1.5 w-2 h-2 rounded-full bg-zinc-400 border-2 border-white" />
                        <p className="text-xs font-medium text-zinc-900 line-clamp-2">{selectedRequest.toDestination || selectedRequest.address}</p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedRequest.status?.toLowerCase() === 'exceptions' && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-red-900">Exception Raised</p>
                        <p className="text-xs text-red-700 mt-0.5">Please check the exceptions panel for resolution tasks.</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
