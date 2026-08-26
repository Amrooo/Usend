import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import YangoMapView from './YangoMapView';
import { MapPin, Navigation } from 'lucide-react';

interface MapPickerProps {
  onSelect?: (address: string, position: [number, number]) => void;
  onClose?: () => void;
  initialPosition?: [number, number] | { lat: number; lng: number };
  initialAddress?: string;
}

export default function MapPicker({ onSelect, onClose, initialPosition, initialAddress }: MapPickerProps) {
  const { isRTL } = useLanguage();
  
  const parsedCoords: [number, number] = initialPosition
    ? Array.isArray(initialPosition)
      ? initialPosition
      : [initialPosition.lat, initialPosition.lng]
    : [25.1972, 55.2744]; // Downtown Dubai

  return (
    <div className="flex flex-col h-[75vh] min-h-[500px] max-h-[700px] w-full bg-[#18181b] rounded-2xl overflow-hidden shadow-2xl">
      <YangoMapView
        initialPickup={initialAddress || 'Downtown Dubai, UAE'}
        initialPickupCoords={parsedCoords}
        onConfirm={(pickup, dropoff, fare) => {
          if (onSelect) {
            onSelect(pickup.address, pickup.coords);
          }
          if (onClose) onClose();
        }}
        onClose={onClose}
        isModal={true}
      />
    </div>
  );
}
