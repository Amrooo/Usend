import React, { useEffect, useRef, useState, useId, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Navigation, Search, Check, X, Crosshair, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    ymaps?: any;
  }
}

export interface YangoMapViewProps {
  mode?: 'pickup' | 'dropoff' | 'route';
  initialPickup?: string;
  initialDropoff?: string;
  initialPickupCoords?: [number, number]; // [lat, lng]
  initialDropoffCoords?: [number, number]; // [lat, lng]
  onSelectLocation?: (address: string, coords: [number, number], distanceKm?: number) => void;
  onConfirm?: (pickup: { address: string; coords: [number, number] }, dropoff: { address: string; coords: [number, number] }, distanceKm: number) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export default function YangoMapView({
  mode = 'pickup',
  initialPickup = 'Downtown Dubai, Dubai, UAE',
  initialDropoff = 'Dubai Marina Walk, Dubai, UAE',
  initialPickupCoords = [25.1972, 55.2744],
  initialDropoffCoords = [25.0785, 55.1390],
  onSelectLocation,
  onConfirm,
  onClose,
  isModal = true,
}: YangoMapViewProps) {
  const { language, isRTL } = useLanguage();
  const uniqueId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const mapContainerId = `yango-map-${uniqueId}`;

  const [activeMode, setActiveMode] = useState<'pickup' | 'dropoff' | 'route'>(mode);
  const [pickupAddress, setPickupAddress] = useState(initialPickup || 'Downtown Dubai, UAE');
  const [dropoffAddress, setDropoffAddress] = useState(initialDropoff || 'Dubai Marina, UAE');
  const [pickupCoords, setPickupCoords] = useState<[number, number]>(initialPickupCoords || [25.1972, 55.2744]);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number]>(initialDropoffCoords || [25.0785, 55.1390]);

  const [searchQuery, setSearchQuery] = useState(mode === 'dropoff' ? dropoffAddress : pickupAddress);
  const [searchResults, setSearchResults] = useState<Array<{ title: string; coords: [number, number] }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [calculatedDistanceKm, setCalculatedDistanceKm] = useState<number>(0);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const mapInstanceRef = useRef<any>(null);
  const pickupPlacemarkRef = useRef<any>(null);
  const dropoffPlacemarkRef = useRef<any>(null);
  const currentRouteRef = useRef<any>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Sync mode changes
  useEffect(() => {
    setActiveMode(mode);
    setSearchQuery(mode === 'dropoff' ? dropoffAddress : pickupAddress);
  }, [mode]);

  // Reverse geocoding helper using ymaps.geocode
  const reverseGeocode = useCallback((coords: [number, number], callback: (addr: string) => void) => {
    if (window.ymaps && window.ymaps.geocode) {
      window.ymaps.geocode(coords, { results: 1 }).then((res: any) => {
        const obj = res.geoObjects.get(0);
        if (obj) {
          const addr = obj.getAddressLine() || obj.properties.get('name') || `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
          callback(addr);
        } else {
          callback(`${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`);
        }
      }).catch(() => {
        callback(`${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`);
      });
    } else {
      callback(`${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`);
    }
  }, []);

  // Safe search query handler using ymaps.geocode
  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val.trim() || val.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(true);
      if (window.ymaps && window.ymaps.geocode) {
        window.ymaps.geocode(`${val.trim()}, UAE`, {
          results: 5,
          boundedBy: [[24.0, 54.0], [26.2, 56.5]],
          strictBounds: false
        }).then((res: any) => {
          setIsSearching(false);
          const results: Array<{ title: string; coords: [number, number] }> = [];
          res.geoObjects.each((geoObject: any) => {
            const coords = geoObject.geometry.getCoordinates();
            const text = geoObject.getAddressLine() || geoObject.properties.get('name');
            if (coords && text) {
              results.push({ title: text, coords: [coords[0], coords[1]] });
            }
          });
          setSearchResults(results);
          setShowSearchResults(results.length > 0);
        }).catch(() => {
          setIsSearching(false);
        });
      } else {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectSearchResult = (result: { title: string; coords: [number, number] }) => {
    setShowSearchResults(false);
    setSearchQuery(result.title);

    if (activeMode === 'pickup') {
      setPickupCoords(result.coords);
      setPickupAddress(result.title);
      if (pickupPlacemarkRef.current) {
        pickupPlacemarkRef.current.geometry.setCoordinates(result.coords);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(result.coords, 15);
      }
      if (activeMode === 'route') recalculateYangoRoute(result.coords, dropoffCoords);
    } else {
      setDropoffCoords(result.coords);
      setDropoffAddress(result.title);
      if (dropoffPlacemarkRef.current) {
        dropoffPlacemarkRef.current.geometry.setCoordinates(result.coords);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(result.coords, 15);
      }
      if (activeMode === 'route') recalculateYangoRoute(pickupCoords, result.coords);
    }
  };

  // Central location setter for clicks on map, icons, landmarks, or POIs
  const applySelectedLocation = useCallback((pos: [number, number], customName?: string) => {
    if (activeMode === 'pickup') {
      setPickupCoords(pos);
      if (pickupPlacemarkRef.current) {
        pickupPlacemarkRef.current.geometry.setCoordinates(pos);
        if (mapInstanceRef.current && mapInstanceRef.current.geoObjects.indexOf(pickupPlacemarkRef.current) === -1) {
          mapInstanceRef.current.geoObjects.add(pickupPlacemarkRef.current);
        }
      }
      if (customName) {
        setPickupAddress(customName);
        setSearchQuery(customName);
      } else {
        reverseGeocode(pos, (addr) => {
          setPickupAddress(addr);
          setSearchQuery(addr);
        });
      }
    } else if (activeMode === 'dropoff') {
      setDropoffCoords(pos);
      if (dropoffPlacemarkRef.current) {
        dropoffPlacemarkRef.current.geometry.setCoordinates(pos);
        if (mapInstanceRef.current && mapInstanceRef.current.geoObjects.indexOf(dropoffPlacemarkRef.current) === -1) {
          mapInstanceRef.current.geoObjects.add(dropoffPlacemarkRef.current);
        }
      }
      if (customName) {
        setDropoffAddress(customName);
        setSearchQuery(customName);
      } else {
        reverseGeocode(pos, (addr) => {
          setDropoffAddress(addr);
          setSearchQuery(addr);
        });
      }
    } else {
      setDropoffCoords(pos);
      if (dropoffPlacemarkRef.current) {
        dropoffPlacemarkRef.current.geometry.setCoordinates(pos);
      }
      if (customName) {
        setDropoffAddress(customName);
      } else {
        reverseGeocode(pos, (addr) => {
          setDropoffAddress(addr);
          recalculateYangoRoute(pickupCoords, pos);
        });
      }
    }
  }, [activeMode, pickupCoords, reverseGeocode]);

  // Initialize Native Yango Map
  useEffect(() => {
    let isMounted = true;

    const startMap = () => {
      if (!window.ymaps || !window.ymaps.ready) return;

      window.ymaps.ready(() => {
        if (!isMounted) return;
        const container = document.getElementById(mapContainerId);
        if (!container) return;

        container.innerHTML = '';

        try {
          const targetCoords = activeMode === 'dropoff' ? dropoffCoords : pickupCoords;

          const map = new window.ymaps.Map(mapContainerId, {
            center: targetCoords,
            zoom: 14,
            controls: ['zoomControl', 'geolocationControl']
          }, {
            suppressMapOpenBlock: true,
            yandexMapDisablePoiInteractivity: true, // Disables native POI popups so clicks pass straight to our handler!
            autoFitToViewport: 'always'
          });

          mapInstanceRef.current = map;
          setIsMapReady(true);

          // 1. Pickup Placemark (Green Pin)
          const pickupPlacemark = new window.ymaps.Placemark(pickupCoords, {
            hintContent: 'Pickup Location (Point A)'
          }, {
            preset: 'islands#darkGreenDotIcon',
            draggable: true
          });

          pickupPlacemark.events.add('dragend', () => {
            const newCoords = pickupPlacemark.geometry.getCoordinates();
            const pos: [number, number] = [newCoords[0], newCoords[1]];
            applySelectedLocation(pos);
          });

          if (activeMode === 'pickup' || activeMode === 'route') {
            map.geoObjects.add(pickupPlacemark);
          }
          pickupPlacemarkRef.current = pickupPlacemark;

          // 2. Dropoff Placemark (Red Pin)
          const dropoffPlacemark = new window.ymaps.Placemark(dropoffCoords, {
            hintContent: 'Dropoff Destination (Point B)'
          }, {
            preset: 'islands#redDotIcon',
            draggable: true
          });

          dropoffPlacemark.events.add('dragend', () => {
            const newCoords = dropoffPlacemark.geometry.getCoordinates();
            const pos: [number, number] = [newCoords[0], newCoords[1]];
            applySelectedLocation(pos);
          });

          if (activeMode === 'dropoff' || activeMode === 'route') {
            map.geoObjects.add(dropoffPlacemark);
          }
          dropoffPlacemarkRef.current = dropoffPlacemark;

          // 3. Map Click Listener (Direct canvas, icons, roads, hotspots)
          map.events.add('click', (e: any) => {
            const coords = e.get('coords');
            if (coords) {
              applySelectedLocation([coords[0], coords[1]]);
            }
          });

          // 4. GeoObjects / POIs Click Listener (Sightseeing icons, attractions, custom landmarks)
          map.geoObjects.events.add('click', (e: any) => {
            const target = e.get('target');
            if (target === pickupPlacemark || target === dropoffPlacemark) return;
            const coords = e.get('coords') || (target && target.geometry && target.geometry.getCoordinates());
            const name = target && target.properties && (target.properties.get('name') || target.properties.get('balloonContent'));
            if (coords) {
              applySelectedLocation([coords[0], coords[1]], name);
            }
          });

          if (activeMode === 'route') {
            recalculateYangoRoute(pickupCoords, dropoffCoords);
          }

        } catch (initErr) {
          console.error("Yango Map mounting error:", initErr);
        }
      });
    };

    if (window.ymaps && window.ymaps.ready) {
      startMap();
    } else {
      const script = document.getElementById('yango-maps-api-script') || document.querySelector('script[src*="api-maps"]');
      if (script) {
        script.addEventListener('load', startMap);
      }
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [activeMode, mapContainerId, applySelectedLocation]);

  // Route calculation
  const recalculateYangoRoute = (p1: [number, number], p2: [number, number]) => {
    if (!window.ymaps || !mapInstanceRef.current) return;

    if (currentRouteRef.current) {
      mapInstanceRef.current.geoObjects.remove(currentRouteRef.current);
    }

    window.ymaps.route([p1, p2], {
      mapStateAutoApply: true,
      routingMode: 'auto'
    }).then((route: any) => {
      currentRouteRef.current = route;
      route.getPaths().options.set({
        strokeColor: '#FF2B42',
        strokeWidth: 6,
        opacity: 0.95
      });
      mapInstanceRef.current.geoObjects.add(route);
      const km = parseFloat((route.getLength() / 1000).toFixed(1));
      setCalculatedDistanceKm(km);
    }).catch(() => {
      const d = haversineDistance(p1, p2);
      setCalculatedDistanceKm(d);
    });
  };

  const haversineDistance = (c1: [number, number], c2: [number, number]) => {
    const R = 6371;
    const dLat = ((c2[0] - c1[0]) * Math.PI) / 180;
    const dLon = ((c2[1] - c1[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((c1[0] * Math.PI) / 180) * Math.cos((c2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Browser Geolocation / GPS
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        applySelectedLocation(coords);
        if (mapInstanceRef.current) mapInstanceRef.current.setCenter(coords, 15);
      },
      () => {
        setIsLocating(false);
        alert("Could not fetch GPS position. You can tap directly on the map to set location.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Confirm Selection and return back to parent form
  const handleConfirmLocation = () => {
    if (activeMode === 'pickup') {
      if (onSelectLocation) onSelectLocation(pickupAddress, pickupCoords);
      if (onConfirm) onConfirm({ address: pickupAddress, coords: pickupCoords }, { address: dropoffAddress, coords: dropoffCoords }, calculatedDistanceKm);
    } else if (activeMode === 'dropoff') {
      if (onSelectLocation) onSelectLocation(dropoffAddress, dropoffCoords);
      if (onConfirm) onConfirm({ address: pickupAddress, coords: pickupCoords }, { address: dropoffAddress, coords: dropoffCoords }, calculatedDistanceKm);
    } else {
      if (onConfirm) onConfirm({ address: pickupAddress, coords: pickupCoords }, { address: dropoffAddress, coords: dropoffCoords }, calculatedDistanceKm);
      if (onSelectLocation) onSelectLocation(pickupAddress, pickupCoords, calculatedDistanceKm);
    }
    if (onClose) onClose();
  };

  const currentAddress = activeMode === 'dropoff' ? dropoffAddress : pickupAddress;
  const currentCoords = activeMode === 'dropoff' ? dropoffCoords : pickupCoords;

  return (
    <div className={`relative w-full h-[70vh] min-h-[480px] max-h-[680px] bg-[#f8fafc] text-zinc-900 overflow-hidden flex flex-col ${isModal ? 'rounded-2xl' : ''}`}>
      
      {/* 1. TOP FLOATING SEARCH & CONTROLS */}
      <div className="absolute top-4 inset-x-4 z-[500] flex flex-col items-center gap-1 max-w-xl mx-auto pointer-events-auto">
        <div className="relative w-full bg-white/95 backdrop-blur-xl border border-zinc-200/80 rounded-2xl shadow-xl flex items-center px-3.5 py-2.5 transition-all focus-within:ring-2 focus-within:ring-[#FF2B42]/30 focus-within:border-[#FF2B42]">
          <div className="flex items-center gap-2 mr-2">
            {activeMode === 'pickup' ? (
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shrink-0" />
            ) : (
              <span className="w-3 h-3 rounded-full bg-[#FF2B42] shadow-sm shrink-0" />
            )}
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowSearchResults(true);
            }}
            placeholder={
              activeMode === 'pickup' 
                ? (isRTL ? "ابحث أو اضغط على أي معلم بالخريطة لتحديد الاستلام..." : "Search or tap any landmark/spot for pickup...")
                : (isRTL ? "ابحث أو اضغط على أي معلم بالخريطة لتحديد التسليم..." : "Search or tap any landmark/spot for dropoff...")
            }
            className="w-full bg-transparent text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 outline-none"
          />

          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin mr-1" />
          )}

          {searchQuery && !isSearching && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-px bg-zinc-200 mx-2" />

          {/* GPS Locate Button */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            title={isRTL ? "استخدام موقعي الحالي" : "Use current GPS location"}
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors flex items-center gap-1 text-[11px] font-bold shrink-0 cursor-pointer"
          >
            <Crosshair className={`w-3.5 h-3.5 text-[#FF2B42] ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRTL ? "موقعي" : "GPS"}</span>
          </button>
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="w-full bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden mt-1 max-h-56 overflow-y-auto">
            {searchResults.map((res, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSearchResult(res)}
                className="w-full text-left px-4 py-3 hover:bg-zinc-50 border-b border-zinc-100 last:border-0 flex items-start gap-2.5 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#FF2B42] shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-800 font-medium line-clamp-2 leading-relaxed">{res.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. FULL CANVAS NATIVE YANGO MAP */}
      <div
        id={mapContainerId}
        className="w-full flex-1 z-0 cursor-crosshair"
        style={{ width: '100%', height: '100%', minHeight: '380px' }}
      />

      {/* Loading Overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="w-8 h-8 border-3 border-[#FF2B42] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-600">
            Loading Yango Maps...
          </p>
        </div>
      )}

      {/* 3. CLEAN BOTTOM CONFIRMATION BAR */}
      <div className="absolute bottom-4 inset-x-4 z-[500] max-w-xl mx-auto pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-2xl border border-zinc-200/80 rounded-3xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3.5">
          {/* Address Information */}
          <div className="flex items-start gap-3 w-full sm:w-auto flex-1 min-w-0">
            <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
              activeMode === 'pickup' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-[#FF2B42]'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                activeMode === 'pickup' ? 'text-emerald-600' : 'text-[#FF2B42]'
              }`}>
                {activeMode === 'pickup' ? (isRTL ? 'موقع الاستلام المحدد' : 'Selected Pickup Point') : (isRTL ? 'وجهة التسليم المحددة' : 'Selected Dropoff Point')}
              </span>
              <p className="text-xs font-bold text-zinc-900 truncate mt-0.5" title={currentAddress}>
                {currentAddress}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                {currentCoords[0].toFixed(5)}, {currentCoords[1].toFixed(5)}
              </p>
            </div>
          </div>

          {/* Direct Confirm Action Button */}
          <button
            onClick={handleConfirmLocation}
            className={`w-full sm:w-auto px-7 py-3.5 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
              activeMode === 'pickup'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                : 'bg-[#FF2B42] hover:bg-[#e02439] shadow-[#FF2B42]/25'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {activeMode === 'pickup' 
                ? (isRTL ? 'تأكيد موقع الاستلام' : 'Confirm Pickup Location')
                : (isRTL ? 'تأكيد وجهة التسليم' : 'Confirm Dropoff Location')
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
