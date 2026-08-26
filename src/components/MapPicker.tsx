import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import YangoMapView, { MapPickerTarget } from './YangoMapView';

interface MapPickerProps {
  target?: MapPickerTarget;
  onSelect?: (address: string, position: [number, number], distanceKm?: number, durationMins?: number) => void;
  onClose?: () => void;
  initialPosition?: [number, number] | { lat: number; lng: number };
  initialAddress?: string;
}

export default function MapPicker({ 
  target = 'general',
  onSelect, 
  onClose, 
  initialPosition, 
  initialAddress 
}: MapPickerProps) {
  const { isRTL } = useLanguage();
  
  const parsedCoords: [number, number] = initialPosition
    ? Array.isArray(initialPosition)
      ? initialPosition
      : [initialPosition.lat, initialPosition.lng]
    : [25.1972, 55.2744]; // Downtown Dubai

  const isDropoff = target === 'dropoff' || target === 'receiver';

  return (
    <div className="flex flex-col h-[78vh] min-h-[520px] max-h-[720px] w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative">
      <YangoMapView
        target={target}
        initialPickup={!isDropoff ? (initialAddress || 'Downtown Dubai, UAE') : 'Downtown Dubai, UAE'}
        initialPickupCoords={!isDropoff ? parsedCoords : [25.1972, 55.2744]}
        initialDropoff={isDropoff ? (initialAddress || 'Dubai Marina Walk, UAE') : 'Dubai Marina Walk, UAE'}
        initialDropoffCoords={isDropoff ? parsedCoords : [25.0785, 55.1390]}
        onConfirm={(pickup, dropoff, metrics) => {
          if (onSelect) {
            if (isDropoff && dropoff) {
              onSelect(dropoff.address, dropoff.coords, metrics?.distanceKm, metrics?.durationMins);
            } else {
              onSelect(pickup.address, pickup.coords, metrics?.distanceKm, metrics?.durationMins);
            }
          }
          if (onClose) onClose();
        }}
        onClose={onClose}
        isModal={true}
      />
    </div>
  );
}
