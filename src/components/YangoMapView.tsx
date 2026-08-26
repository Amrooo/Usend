import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Car, Clock, DollarSign, Route, RefreshCw, X, Play, ShieldCheck, Check, Search } from 'lucide-react';

// Custom Yango/USend Marker Icons
const greenPinIcon = L.divIcon({
  className: 'custom-yango-pin-pickup',
  html: `
    <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
      <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:#10b981; opacity:0.25; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="width:26px; height:26px; border-radius:50%; background:#10b981; border:3px solid #ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:11px; font-weight:900;">A</div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const redPinIcon = L.divIcon({
  className: 'custom-yango-pin-dropoff',
  html: `
    <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
      <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:#ef4444; opacity:0.25; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="width:26px; height:26px; border-radius:50%; background:#ef4444; border:3px solid #ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:11px; font-weight:900;">B</div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const driverVehicleIcon = L.divIcon({
  className: 'custom-yango-driver',
  html: `
    <div style="width:42px; height:42px; background:#113f36; border:3px solid #ffffff; border-radius:50%; box-shadow:0 6px 16px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; transform:scale(1.05); transition:transform 0.2s ease;">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21]
});

interface YangoMapViewProps {
  initialPickup?: string;
  initialDropoff?: string;
  initialPickupCoords?: [number, number]; // [lat, lng]
  initialDropoffCoords?: [number, number]; // [lat, lng]
  onRouteCalculated?: (metrics: { distanceKm: number; durationMins: number; estimatedFare: number }) => void;
  onConfirm?: (pickup: { address: string; coords: [number, number] }, dropoff: { address: string; coords: [number, number] }, fare: number) => void;
  onClose?: () => void;
  isModal?: boolean;
}

// Sub-component to fit map bounds to route
function MapBoundsUpdater({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [bounds, map]);
  return null;
}

// Sub-component to handle map clicks
function MapClickHandler({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    }
  });
  return null;
}

export default function YangoMapView({
  initialPickup = 'Downtown Dubai, Burj Khalifa Area',
  initialDropoff = 'Dubai Marina Walk, Tower B',
  initialPickupCoords = [25.1972, 55.2744],
  initialDropoffCoords = [25.0785, 55.1390],
  onRouteCalculated,
  onConfirm,
  onClose,
  isModal = false,
}: YangoMapViewProps) {
  const { language, isRTL } = useLanguage();

  const [pickupAddress, setPickupAddress] = useState(initialPickup);
  const [dropoffAddress, setDropoffAddress] = useState(initialDropoff);
  const [pickupCoords, setPickupCoords] = useState<[number, number]>(initialPickupCoords);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number]>(initialDropoffCoords);

  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [driverPosition, setDriverPosition] = useState<[number, number] | null>(null);
  const [isSimulatingDriver, setIsSimulatingDriver] = useState(false);
  const [activeStep, setActiveStep] = useState<'plan' | 'dispatched' | 'arrived'>('plan');

  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDropoff, setIsSearchingDropoff] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);

  const animRef = useRef<number | null>(null);

  // Calculate Route & Waypoints (OSRM / Direct interpolation)
  const calcRoute = async (start: [number, number], end: [number, number]) => {
    try {
      // Use OSRM public driving API for actual Dubai road geometry
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        setRoutePolyline(coordinates);

        const distKm = parseFloat((route.distance / 1000).toFixed(1));
        const durMins = Math.ceil(route.duration / 60);
        const fare = parseFloat((12 + distKm * 2.8).toFixed(2));

        const metrics = { distanceKm: distKm, durationMins: durMins, estimatedFare: fare };
        setRouteMetrics(metrics);
        if (onRouteCalculated) onRouteCalculated(metrics);
        return;
      }
    } catch (e) {
      console.warn("OSRM routing fallback:", e);
    }

    // Fallback: smooth interpolated route line
    const steps = 30;
    const fallbackLine: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const r = i / steps;
      fallbackLine.push([
        start[0] + (end[0] - start[0]) * r,
        start[1] + (end[1] - start[1]) * r
      ]);
    }
    setRoutePolyline(fallbackLine);

    const latDiff = Math.abs(start[0] - end[0]);
    const lngDiff = Math.abs(start[1] - end[1]);
    const dist = Math.max(3.5, parseFloat(((latDiff + lngDiff) * 111).toFixed(1)));
    const dur = Math.round(dist * 2.2);
    const fare = parseFloat((12 + dist * 2.8).toFixed(2));
    const metrics = { distanceKm: dist, durationMins: dur, estimatedFare: fare };
    setRouteMetrics(metrics);
    if (onRouteCalculated) onRouteCalculated(metrics);
  };

  const [routeMetrics, setRouteMetrics] = useState<{
    distanceKm: number;
    durationMins: number;
    estimatedFare: number;
  }>({
    distanceKm: 18.5,
    durationMins: 22,
    estimatedFare: 63.80
  });

  useEffect(() => {
    calcRoute(pickupCoords, dropoffCoords);
  }, [pickupCoords, dropoffCoords]);

  // Reverse Geocode
  const reverseGeocode = async (coords: [number, number]): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&countrycodes=ae`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        return parts.slice(0, 3).join(',').trim();
      }
    } catch (e) {}
    return `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
  };

  // Search Address Suggestions
  const searchAddress = async (query: string, type: 'pickup' | 'dropoff') => {
    if (!query || query.length < 3) {
      if (type === 'pickup') setPickupSuggestions([]);
      else setDropoffSuggestions([]);
      return;
    }

    try {
      // Constrained to UAE bounding box: 24.7 to 25.5 Lat, 54.9 to 55.6 Lng
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ae&limit=5&bounded=1&viewbox=54.9,25.5,55.6,24.7`;
      const res = await fetch(url);
      const data = await res.json();
      if (type === 'pickup') {
        setPickupSuggestions(data);
        setIsSearchingPickup(true);
      } else {
        setDropoffSuggestions(data);
        setIsSearchingDropoff(true);
      }
    } catch (e) {}
  };

  // Map Click Handler to set Point A or Point B
  const handleMapClick = async (latlng: L.LatLng) => {
    const coords: [number, number] = [latlng.lat, latlng.lng];
    const addr = await reverseGeocode(coords);
    if (!pickupCoords) {
      setPickupCoords(coords);
      setPickupAddress(addr);
    } else {
      setDropoffCoords(coords);
      setDropoffAddress(addr);
    }
  };

  // Start Real-Time Live Driver Tracking (LERP Simulation)
  const startDriverSimulation = () => {
    if (!routePolyline || routePolyline.length < 2) return;

    setIsSimulatingDriver(true);
    setActiveStep('dispatched');
    setDriverPosition(routePolyline[0]);

    let stepIdx = 0;
    let progress = 0;

    const animate = () => {
      if (stepIdx >= routePolyline.length - 1) {
        setIsSimulatingDriver(false);
        setActiveStep('arrived');
        return;
      }

      const p1 = routePolyline[stepIdx];
      const p2 = routePolyline[stepIdx + 1];

      progress += 0.05; // 20 updates per step
      const lat = p1[0] + (p2[0] - p1[0]) * progress;
      const lng = p1[1] + (p2[1] - p1[1]) * progress;

      setDriverPosition([lat, lng]);

      if (progress >= 1.0) {
        progress = 0;
        stepIdx++;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Compute map bounds
  const mapBounds = useMemo(() => {
    if (routePolyline.length > 0) {
      return L.latLngBounds(routePolyline.map(p => L.latLng(p[0], p[1])));
    }
    return L.latLngBounds([pickupCoords, dropoffCoords]);
  }, [routePolyline, pickupCoords, dropoffCoords]);

  return (
    <div className={`flex flex-col lg:flex-row w-full h-full bg-[#121214] text-white overflow-hidden ${isModal ? 'rounded-[2rem]' : ''}`}>
      {/* CONTROL & ROUTE PANEL */}
      <div className="w-full lg:w-96 p-6 bg-[#18181b] border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col justify-between space-y-6 z-20 shrink-0 overflow-y-auto">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#113f36] flex items-center justify-center text-white shadow-sm">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-zinc-100 uppercase tracking-widest">
                  {isRTL ? 'توجيه وملاحة يانجو' : 'Yango Mobility Route'}
                </h3>
                <p className="text-[10px] text-zinc-400 font-medium">
                  {isRTL ? 'خريطة تفاعلية دقيقة مع حركة المرور المباشرة' : 'Live traffic & GCC road routing'}
                </p>
              </div>
            </div>
            {isModal && onClose && (
              <button onClick={onClose} className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Location Inputs with Suggestions */}
          <div className="space-y-3">
            {/* Point A */}
            <div className="relative">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {isRTL ? 'نقطة الاستلام (أ)' : 'Pickup Location (Point A)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => {
                    setPickupAddress(e.target.value);
                    searchAddress(e.target.value, 'pickup');
                  }}
                  placeholder="Search pickup or drag green pin"
                  className="w-full bg-[#121214] border border-zinc-700 focus:border-[#113f36] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-medium placeholder:text-zinc-500"
                />
              </div>

              {isSearchingPickup && pickupSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1c20] border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {pickupSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const coords: [number, number] = [parseFloat(item.lat), parseFloat(item.lon)];
                        setPickupCoords(coords);
                        setPickupAddress(item.display_name.split(',').slice(0, 3).join(','));
                        setIsSearchingPickup(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-[11px] text-zinc-300 hover:bg-[#113f36] hover:text-white border-b border-zinc-800 last:border-0 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{item.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Point B */}
            <div className="relative">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {isRTL ? 'نقطة التسليم (ب)' : 'Drop-off Destination (Point B)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={dropoffAddress}
                  onChange={(e) => {
                    setDropoffAddress(e.target.value);
                    searchAddress(e.target.value, 'dropoff');
                  }}
                  placeholder="Search destination or drag red pin"
                  className="w-full bg-[#121214] border border-zinc-700 focus:border-[#113f36] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-medium placeholder:text-zinc-500"
                />
              </div>

              {isSearchingDropoff && dropoffSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1c20] border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {dropoffSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const coords: [number, number] = [parseFloat(item.lat), parseFloat(item.lon)];
                        setDropoffCoords(coords);
                        setDropoffAddress(item.display_name.split(',').slice(0, 3).join(','));
                        setIsSearchingDropoff(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-[11px] text-zinc-300 hover:bg-[#113f36] hover:text-white border-b border-zinc-800 last:border-0 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{item.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Route Summary Telemetry */}
          {routeMetrics && (
            <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/80">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-zinc-400" />
                  {isRTL ? 'المسافة المقدرة' : 'Est. Distance'}
                </span>
                <span className="font-mono font-bold text-white">{routeMetrics.distanceKm} km</span>
              </div>

              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/80">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {isRTL ? 'الوقت مع المرور' : 'Travel Time (Traffic)'}
                </span>
                <span className="font-mono font-bold text-amber-400">{routeMetrics.durationMins} mins</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  {isRTL ? 'التكلفة المقدرة' : 'Estimated Fare'}
                </span>
                <span className="font-mono font-black text-emerald-400 text-sm">AED {routeMetrics.estimatedFare}</span>
              </div>
            </div>
          )}

          {/* Live Status Badge */}
          {activeStep === 'dispatched' && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-400 flex items-center gap-2">
              <Car className="w-4 h-4 animate-pulse" />
              <span>{isRTL ? 'السائق في الطريق عبر مسار يانجو...' : 'Driver en-route via Yango Live Telemetry...'}</span>
            </div>
          )}

          {activeStep === 'arrived' && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{isRTL ? 'وصل السائق إلى الوجهة المحددة بنجاح!' : 'Driver arrived at destination successfully!'}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-2">
          {activeStep === 'plan' ? (
            <button
              onClick={startDriverSimulation}
              className="w-full py-3 bg-[#113f36] hover:bg-[#0e332c] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.99]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRTL ? 'محاكاة تتبع السائق المباشر' : 'Simulate Driver Telemetry'}
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveStep('plan');
                setDriverPosition(null);
              }}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              {isRTL ? 'إعادة تعيين المسار' : 'Reset Route'}
            </button>
          )}

          {onConfirm && (
            <button
              onClick={() => onConfirm(
                { address: pickupAddress, coords: pickupCoords },
                { address: dropoffAddress, coords: dropoffCoords },
                routeMetrics.estimatedFare
              )}
              className="w-full py-3 bg-white hover:bg-zinc-100 text-black font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Check className="w-4 h-4 text-black" />
              {isRTL ? 'تأكيد وحفظ المسار' : 'Confirm Location & Route'}
            </button>
          )}
        </div>
      </div>

      {/* MAP VIEWPORT CANVAS */}
      <div className="flex-1 relative w-full h-[450px] lg:h-full min-h-[400px] bg-[#121214]">
        <MapContainer
          center={pickupCoords}
          zoom={12}
          style={{ height: '100%', width: '100%', backgroundColor: '#121214' }}
        >
          {/* Yango-styled Dark Carto Vector Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          <MapBoundsUpdater bounds={mapBounds} />
          <MapClickHandler onClick={handleMapClick} />

          {/* Point A (Pickup - Draggable) */}
          <Marker
            position={pickupCoords}
            icon={greenPinIcon}
            draggable={true}
            eventHandlers={{
              dragend: async (e) => {
                const marker = e.target;
                const newPos = marker.getLatLng();
                const coords: [number, number] = [newPos.lat, newPos.lng];
                setPickupCoords(coords);
                const addr = await reverseGeocode(coords);
                setPickupAddress(addr);
              }
            }}
          >
            <Popup>
              <div className="text-zinc-900 text-xs font-bold p-1">
                <span className="text-emerald-600 uppercase tracking-widest text-[10px] block">Point A (Pickup)</span>
                {pickupAddress}
              </div>
            </Popup>
          </Marker>

          {/* Point B (Dropoff - Draggable) */}
          <Marker
            position={dropoffCoords}
            icon={redPinIcon}
            draggable={true}
            eventHandlers={{
              dragend: async (e) => {
                const marker = e.target;
                const newPos = marker.getLatLng();
                const coords: [number, number] = [newPos.lat, newPos.lng];
                setDropoffCoords(coords);
                const addr = await reverseGeocode(coords);
                setDropoffAddress(addr);
              }
            }}
          >
            <Popup>
              <div className="text-zinc-900 text-xs font-bold p-1">
                <span className="text-rose-600 uppercase tracking-widest text-[10px] block">Point B (Destination)</span>
                {dropoffAddress}
              </div>
            </Popup>
          </Marker>

          {/* Route Polyline */}
          {routePolyline.length > 1 && (
            <Polyline
              positions={routePolyline}
              pathOptions={{
                color: '#113f36',
                weight: 5,
                opacity: 0.95,
                lineJoin: 'round',
                lineCap: 'round'
              }}
            />
          )}

          {/* Live Driver Telemetry Marker */}
          {driverPosition && (
            <Marker position={driverPosition} icon={driverVehicleIcon}>
              <Popup>
                <div className="text-zinc-900 text-xs font-bold p-1">
                  <span className="text-[#113f36] uppercase tracking-widest text-[10px] block">Live Fleet Telemetry</span>
                  USend On-Demand Driver
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
