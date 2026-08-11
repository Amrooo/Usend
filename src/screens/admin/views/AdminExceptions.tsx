import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../../context/AppContext';
import { AlertTriangle, Clock, MapPin, Truck } from 'lucide-react';

export default function AdminExceptions() {
  const { activeRequests } = useApp();

  const exceptions = useMemo(() => {
    return activeRequests.filter(req => {
      const status = req.status?.toLowerCase() || '';
      return status === 'exceptions' || status === 'rejected' || status === 'cancelled';
    });
  }, [activeRequests]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-5xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            Exceptions & Investigations
            {exceptions.length > 0 && (
              <span className="bg-red-100 text-red-600 text-sm px-2.5 py-0.5 rounded-full font-bold">
                {exceptions.length} Active
              </span>
            )}
          </h1>
          <p className="text-zinc-500 mt-1">Review flagged shipments, provider errors, and dead-letter queues.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        {exceptions.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">No Active Exceptions</h3>
            <p className="text-zinc-500 mt-2">All shipments are operating normally within the network.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            <AnimatePresence>
              {exceptions.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 hover:bg-zinc-50/50 transition-colors flex flex-col md:flex-row gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded">{req.id}</span>
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-200">
                        {req.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-zinc-900 text-lg mb-4">{req.name}</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2 text-sm">
                        <Truck className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Carrier</span>
                          <span className="font-medium text-zinc-700">{req.carrier || 'Unassigned'}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Destination</span>
                          <span className="font-medium text-zinc-700 line-clamp-2">{req.toDestination || req.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-64 bg-red-50 border border-red-100 rounded-xl p-4 shrink-0 flex flex-col justify-center">
                    <h5 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-2">Investigation Required</h5>
                    <p className="text-xs text-red-700 mb-4">This shipment was flagged for an operational exception. Please verify the timeline and contact the carrier.</p>
                    <button className="w-full bg-white border border-red-200 text-red-700 font-bold text-sm py-2 rounded-lg hover:bg-red-100 transition-colors">
                      Resolve Issue
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
