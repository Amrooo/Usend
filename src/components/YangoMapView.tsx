import React, { useEffect, useRef, useState, useId } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Navigation, Route, Check, X, Search, Locate, ArrowRight, Clock, DollarSign, Info } from 'lucide-react';

declare global {
  interface Window {
    ymaps?: any;
  }
}

export type MapPickerTarget = 'pickup' | 'dropoff' | 'shipper' | 'receiver' | 'route' | 'general';

interface YangoMapViewProps {
  target?: MapPickerTarget;
  initialPickup?: string;
  initialDropoff?: string;
  initialPickupCoords?: [number, number]; // [lat, lng]
  initialDropoffCoords?: [number, number]; // [lat, lng]
  onRouteCalculated?: (metrics: { distanceKm: number; durationMins: number; estimatedFare: number }) => void;
  onConfirm?: (
    pickup: { address: string; coords: [number, number] },
    dropoff?: { address: string; coords: [number, number] },
    metrics?: { distanceKm: number; durationMins: number; estimatedFare: number }
  ) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export default function YangoMapView({
  target = 'general',
  initialPickup = 'Downtown Dubai, UAE',
  initialDropoff = 'Dubai Marina Walk, UAE',
  initialPickupCoords = [25.1972, 55.2744],
  initialDropoffCoords = [25.0785, 55.1390],
  onRouteCalculated,
  onConfirm,
  onClose,
  isModal = false,
}: YangoMapViewProps) {
  const { language, isRTL } = useLanguage();
  const uniqueId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const mapContainerId = `yango-map-engine-${uniqueId}`;
  const searchInputId = `yango-search-input-${uniqueId}`;

  // Normalized mode
  const isPickupMode = target === 'pickup' || target === 'shipper';
  const isDropoffMode = target === 'dropoff' || target === 'receiver';
  const isRouteMode = target === 'route';

  // Active address & coordinates state
  const [currentAddress, setCurrentAddress] = useState<string>(() => {
    if (isDropoffMode) return initialDropoff;
    return initialPickup;
  });

  const [currentCoords, setCurrentCoords] = useState<[number, number]>(() => {
    if (isDropoffMode) return initialDropoffCoords;
    return initialPickupCoords;
  });

  // Secondary point for dual routing
  const [secondaryAddress, setSecondaryAddress] = useState<string>(initialDropoff);
  const [secondaryCoords, setSecondaryCoords] = useState<[number, number]>(initialDropoffCoords);

  const [activeTab, setActiveTab] = useState<'pickup' | 'dropoff'>(isDropoffMode ? 'dropoff' : 'pickup');
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [routeMetrics, setRouteMetrics] = useState<{
    distanceKm: number;
    durationMins: number;
    estimatedFare: number;
  }>({
    distanceKm: 18.5,
    durationMins: 22,
    estimatedFare: 25.00
  });

  const mapInstanceRef = useRef<any>(null);
  const mainPlacemarkRef = useRef<any>(null);
  const secondaryPlacemarkRef = useRef<any>(null);
  const routeRef = useRef<any>(null);

  // Yango Maps JS API initialization
  useEffect(() => {
    let isMounted = true;

    const loadYangoMaps = () => {
      const apiKey = localStorage.getItem('yango_maps_api_key') || 'e6e584f2-51a8-4447-b353-84729f27d825';
      const langParam = language === 'ar' ? 'ar_AE' : 'en_AE';
      const scriptUrl = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=${langParam}&coordorder=latlong`;

      if (window.ymaps && window.ymaps.ready) {
        initMap();
        return;
      }

      let script = document.getElementById('yango-maps-api-script') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'yango-maps-api-script';
        script.type = 'text/javascript';
        script.src = scriptUrl;
        script.async = true;
        document.head.appendChild(script);
      }

      script.onload = () => {
        if (isMounted && window.ymaps && window.ymaps.ready) {
          initMap();
        }
      };
    };

    const initMap = () => {
      window.ymaps.ready(() => {
        if (!isMounted) return;
        const container = document.getElementById(mapContainerId);
        if (!container) return;

        container.innerHTML = '';

        try {
          // Initialize native Yango map centered on selected coords
          const map = new window.ymaps.Map(mapContainerId, {
            center: currentCoords,
            zoom: 14,
            controls: ['zoomControl', 'geolocationControl']
          }, {
            suppressMapOpenBlock: true
          });

          mapInstanceRef.current = map;
          setIsMapReady(true);

          // 1. Create Main Interactive Placemark
          const pinColor = (isDropoffMode || activeTab === 'dropoff') ? 'islands#redDotIcon' : 'islands#darkGreenDotIcon';
          const placemark = new window.ymaps.Placemark(currentCoords, {
            hintContent: isDropoffMode ? 'Drop-off Location' : 'Pickup Location',
            balloonContent: currentAddress
          }, {
            preset: pinColor,
            draggable: true
          });

          // Handle Drag End -> Reverse Geocode
          placemark.events.add('dragend', () => {
            const coords = placemark.geometry.getCoordinates();
            const pos: [number, number] = [coords[0], coords[1]];
            setCurrentCoords(pos);

            window.ymaps.geocode(coords).then((res: any) => {
              const geoObj = res.geoObjects.get(0);
              const addr = geoObj ? geoObj.getAddressLine() : `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
              setCurrentAddress(addr);
            });
          });

          map.geoObjects.add(placemark);
          mainPlacemarkRef.current = placemark;

          // 2. Map Click -> Move Pin & Reverse Geocode
          map.events.add('click', (e: any) => {
            const coords = e.get('coords');
            const pos: [number, number] = [coords[0], coords[1]];
            setCurrentCoords(pos);
            placemark.geometry.setCoordinates(coords);

            window.ymaps.geocode(coords).then((res: any) => {
              const geoObj = res.geoObjects.get(0);
              const addr = geoObj ? geoObj.getAddressLine() : `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
              setCurrentAddress(addr);
            });
          });

          // 3. Autocomplete Suggestion Integration
          if (window.ymaps.SuggestView) {
            const suggestView = new window.ymaps.SuggestView(searchInputId, {
              provider: {
                suggest: (req: string) => window.ymaps.suggest(req, { boundedBy: [[24.7, 54.9], [25.5, 55.6]] })
              }
            });

            suggestView.events.add('select', (e: any) => {
              const selectedAddr = e.get('item').value;
              window.ymaps.geocode(selectedAddr, { results: 1 }).then((res: any) => {
                const geoObj = res.geoObjects.get(0);
                if (geoObj) {
                  const coords = geoObj.geometry.getCoordinates();
                  const pos: [number, number] = [coords[0], coords[1]];
                  setCurrentCoords(pos);
                  setCurrentAddress(selectedAddr);
                  placemark.geometry.setCoordinates(coords);
                  map.setCenter(coords, 15, { duration: 300 });
                }
              });
            });
          }

        } catch (err) {
          console.error("Yango Map Init Error:", err);
        }
      });
    };

    loadYangoMaps();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [language, mapContainerId]);

  // Geolocation handler (My Location)
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current || !window.ymaps) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setCurrentCoords(coords);
        if (mainPlacemarkRef.current) {
          mainPlacemarkRef.current.geometry.setCoordinates(coords);
        }
        mapInstanceRef.current.setCenter(coords, 16, { duration: 300 });

        window.ymaps.geocode(coords).then((res: any) => {
          const geoObj = res.geoObjects.get(0);
          const addr = geoObj ? geoObj.getAddressLine() : `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
          setCurrentAddress(addr);
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation denied or unavailable:", err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Confirm Selection
  const handleConfirmLocation = () => {
    if (onConfirm) {
      if (isDropoffMode) {
        onConfirm(
          { address: initialPickup, coords: initialPickupCoords },
          { address: currentAddress, coords: currentCoords },
          routeMetrics
        );
      } else {
        onConfirm(
          { address: currentAddress, coords: currentCoords },
          { address: secondaryAddress, coords: secondaryCoords },
          routeMetrics
        );
      }
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[520px] bg-slate-900 overflow-hidden select-none ${isModal ? 'rounded-2xl' : ''}`}>
      {/* 1. NATIVE YANGO MAP CANVAS (100% UNCLUTTERED) */}
      <div
        id={mapContainerId}
        className="absolute inset-0 w-full h-full z-0"
        style={{ width: '100%', height: '100%', minHeight: '520px' }}
      />

      {/* Loading Overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Loading Yango Maps...
          </p>
        </div>
      )}

      {/* 2. TOP FLOATING SEARCH & TARGET HEADER */}
      <div className="absolute top-3 inset-x-3 sm:inset-x-auto sm:left-4 sm:right-4 z-20 flex flex-col gap-2 max-w-2xl mx-auto pointer-events-auto">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-2.5 flex items-center gap-2">
          {/* Target Indicator Badge */}
          <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
            isDropoffMode 
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isDropoffMode ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} />
            <span>{isDropoffMode ? (isRTL ? 'نقطة التسليم' : 'Drop-off (B)') : (isRTL ? 'نقطة الاستلام' : 'Pickup (A)')}</span>
          </div>

          {/* Autocomplete Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id={searchInputId}
              type="text"
              value={currentAddress}
              onChange={(e) => setCurrentAddress(e.target.value)}
              placeholder={isRTL ? 'ابحث عن العنوان أو حرك الدبوس...' : 'Search street, landmark or drag pin...'}
              className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400"
            />
          </div>

          {/* Locate Me GPS Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Locate Me (GPS)"
            className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl cursor-pointer transition-colors shrink-0"
          >
            <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          {/* Close Modal Button (if modal) */}
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 rounded-xl cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tip / Instruction Pill */}
        <div className="self-center bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white tracking-wide shadow-md flex items-center gap-1.5">
          <Info className="w-3 h-3 text-emerald-400" />
          <span>{isRTL ? 'انقر على الخريطة أو اسحب الدبوس لتحديد الموقع بدقة' : 'Click map or drag the pin to set exact coordinates'}</span>
        </div>
      </div>

      {/* 3. BOTTOM FLOATING CONFIRMATION ACTION BAR */}
      <div className="absolute bottom-3 inset-x-3 sm:inset-x-auto sm:left-4 sm:right-4 z-20 max-w-2xl mx-auto pointer-events-auto">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3">
          {/* Selected Location Summary */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                isDropoffMode ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
              }`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  {isDropoffMode ? (isRTL ? 'العنوان المحدد للتسليم' : 'Selected Drop-off Location') : (isRTL ? 'العنوان المحدد للاستلام' : 'Selected Pickup Location')}
                </p>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate mt-0.5">
                  {currentAddress || 'Downtown Dubai, UAE'}
                </p>
                <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  {currentCoords[0].toFixed(5)}° N, {currentCoords[1].toFixed(5)}° E
                </p>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirmLocation}
            className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] cursor-pointer ${
              isDropoffMode
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {isDropoffMode 
                ? (isRTL ? 'تأكيد موقع التسليم (نقطة ب)' : 'Confirm Drop-off Location') 
                : (isRTL ? 'تأكيد موقع الاستلام (نقطة أ)' : 'Confirm Pickup Location')
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
