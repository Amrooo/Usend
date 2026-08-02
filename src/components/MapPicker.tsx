import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPickerProps {
  onSelect?: (address: string, position: [number, number]) => void;
  onClose?: () => void;
  initialPosition?: [number, number] | { lat: number; lng: number };
  initialAddress?: string;
}

function LocationMarker({ position, setPosition, setAddress }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setAddress(`Selected Location: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function MapPicker({ onSelect, onClose, initialPosition, initialAddress }: MapPickerProps) {
  const { isRTL } = useLanguage();
  const [position, setPosition] = useState<L.LatLng | null>(initialPosition ? new L.LatLng(Array.isArray(initialPosition) ? initialPosition[0] : initialPosition.lat, Array.isArray(initialPosition) ? initialPosition[1] : initialPosition.lng) : new L.LatLng(25.2048, 55.2708));
  const [address, setAddress] = useState(initialAddress || 'Dubai, United Arab Emirates');

  const handleConfirm = () => {
    if (position && onSelect) {
      onSelect(address, [position.lat, position.lng]);
    }
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-[70vh] min-h-[500px]">
      <div className="p-4 border-b border-zinc-200 bg-white z-10 relative">
        <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search address (Simulated)..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-transparent outline-none text-sm font-medium text-zinc-900"
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>
      </div>
      <div className="relative flex-1 z-0">
        <MapContainer center={position || [25.2048, 55.2708]} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} setAddress={setAddress} />
        </MapContainer>
      </div>
      <div className="p-4 border-t border-zinc-200 bg-white grid grid-cols-2 gap-3 z-10 relative">
        <button
          onClick={onClose}
          className="py-3.5 rounded-xl border border-zinc-300 font-bold text-zinc-700 hover:bg-zinc-50 transition-colors uppercase cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-widest transition-colors uppercase cursor-pointer"
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
}
