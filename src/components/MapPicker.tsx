import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import YangoMapView from './YangoMapView';

interface MapPickerProps {
  onSelect?: (address: string, position: [number, number], distanceKm?: number) => void;
  onClose?: () => void;
  initialPosition?: [number, number] | { lat: number; lng: number };
  initialAddress?: string;
  targetType?: 'pickup' | 'dropoff' | 'route';
}

export default function MapPicker({
  onSelect,
  onClose,
  initialPosition,
  initialAddress,
  targetType = 'pickup',
}: MapPickerProps) {
  const { isRTL } = useLanguage();

  const parsedCoords: [number, number] = initialPosition
    ? Array.isArray(initialPosition)
      ? initialPosition
      : [initialPosition.lat, initialPosition.lng]
    : [25.1972, 55.2744]; // Downtown Dubai

  return (
    <div className="w-full h-[70vh] min-h-[480px] max-h-[680px] bg-[#f8fafc] rounded-3xl overflow-hidden shadow-2xl">
      <YangoMapView
        mode={targetType}
        initialPickup={targetType === 'pickup' ? (initialAddress || 'Downtown Dubai, UAE') : 'Downtown Dubai, UAE'}
        initialPickupCoords={targetType === 'pickup' ? parsedCoords : [25.1972, 55.2744]}
        initialDropoff={targetType === 'dropoff' ? (initialAddress || 'Dubai Marina, UAE') : 'Dubai Marina, UAE'}
        initialDropoffCoords={targetType === 'dropoff' ? parsedCoords : [25.0785, 55.1390]}
        onSelectLocation={(address, coords, distanceKm) => {
          if (onSelect) {
            onSelect(address, coords, distanceKm);
          }
          if (onClose) onClose();
        }}
        onConfirm={(pickup, dropoff, distanceKm) => {
          if (onSelect) {
            if (targetType === 'dropoff') {
              onSelect(dropoff.address, dropoff.coords, distanceKm);
            } else {
              onSelect(pickup.address, pickup.coords, distanceKm);
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
