import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import YangoMapView from './YangoMapView';

interface YangoMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPickup?: string;
  initialDropoff?: string;
  initialPickupCoords?: [number, number];
  initialDropoffCoords?: [number, number];
  onConfirm?: (pickup: { address: string; coords: [number, number] }, dropoff: { address: string; coords: [number, number] }, fare: number) => void;
}

export default function YangoMapModal({
  isOpen,
  onClose,
  initialPickup,
  initialDropoff,
  initialPickupCoords,
  initialDropoffCoords,
  onConfirm
}: YangoMapModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 md:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative z-10 w-full max-w-5xl h-[85vh] max-h-[760px] bg-[#18181b] rounded-[2rem] border border-zinc-700/80 shadow-2xl overflow-hidden"
        >
          <YangoMapView
            isModal={true}
            initialPickup={initialPickup}
            initialDropoff={initialDropoff}
            initialPickupCoords={initialPickupCoords}
            initialDropoffCoords={initialDropoffCoords}
            onConfirm={(p, d, fare) => {
              if (onConfirm) onConfirm(p, d, fare);
              onClose();
            }}
            onClose={onClose}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
