import React, { useEffect, useRef, useState, useId } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Navigation, Car, Clock, DollarSign, Route, RefreshCw, X, Play, ShieldCheck, Check, Key, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

declare global {
  interface Window {
    ymaps?: any;
  }
}

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
  const uniqueId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const mapContainerId = `yango-map-engine-${uniqueId}`;
  const pickupInputId = `yango-pickup-input-${uniqueId}`;
  const dropoffInputId = `yango-dropoff-input-${uniqueId}`;

  // API Key Management
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('yango_maps_api_key') || 'e6e584f2-51a8-4447-b353-84729f27d825'; // Default sandbox/partner key
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');

  const [pickupAddress, setPickupAddress] = useState(initialPickup);
  const [dropoffAddress, setDropoffAddress] = useState(initialDropoff);
  const [pickupCoords, setPickupCoords] = useState<[number, number]>(initialPickupCoords);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number]>(initialDropoffCoords);

  const [routeMetrics, setRouteMetrics] = useState<{
    distanceKm: number;
    durationMins: number;
    estimatedFare: number;
  }>({
    distanceKm: 18.5,
    durationMins: 22,
    estimatedFare: 63.80
  });

  const [isMapReady, setIsMapReady] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isSimulatingDriver, setIsSimulatingDriver] = useState(false);
  const [activeStep, setActiveStep] = useState<'plan' | 'dispatched' | 'arrived'>('plan');
  const [loadError, setLoadError] = useState<string | null>(null);

  const mapInstanceRef = useRef<any>(null);
  const pickupPlacemarkRef = useRef<any>(null);
  const dropoffPlacemarkRef = useRef<any>(null);
  const currentRouteRef = useRef<any>(null);
  const driverPlacemarkRef = useRef<any>(null);
  const simulationIntervalRef = useRef<any>(null);

  // 1. Dynamic Script Loader for Yango Maps JS API
  useEffect(() => {
    let isMounted = true;

    const loadYangoScript = () => {
      const existingScript = document.getElementById('yango-maps-api-script') as HTMLScriptElement;
      const langParam = language === 'ar' ? 'ar_AE' : 'en_AE';
      const scriptUrl = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=${langParam}&coordorder=latlong`;

      if (window.ymaps && window.ymaps.ready) {
        initYangoMap();
        return;
      }

      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'yango-maps-api-script';
      script.type = 'text/javascript';
      script.src = scriptUrl;
      script.async = true;

      script.onload = () => {
        if (!isMounted) return;
        if (window.ymaps && window.ymaps.ready) {
          initYangoMap();
        }
      };

      script.onerror = () => {
        if (!isMounted) return;
        setLoadError('Failed to connect to Yango Maps API. Please verify your API Key.');
      };

      document.head.appendChild(script);
    };

    const initYangoMap = () => {
      window.ymaps.ready(() => {
        if (!isMounted) return;
        const container = document.getElementById(mapContainerId);
        if (!container) return;

        container.innerHTML = '';

        try {
          // Initialize Yango Map Centered on Dubai
          const map = new window.ymaps.Map(mapContainerId, {
            center: pickupCoords,
            zoom: 13,
            controls: ['zoomControl', 'trafficControl', 'geolocationControl']
          }, {
            suppressMapOpenBlock: true
          });

          mapInstanceRef.current = map;
          setIsMapReady(true);
          setLoadError(null);

          // 1. Setup Point A (Pickup - Green Pin)
          const pickupPlacemark = new window.ymaps.Placemark(pickupCoords, {
            hintContent: 'Pickup Location (Point A)',
            balloonContent: pickupAddress
          }, {
            preset: 'islands#darkGreenDotIcon',
            draggable: true
          });

          pickupPlacemark.events.add('dragend', () => {
            const newCoords = pickupPlacemark.geometry.getCoordinates();
            setPickupCoords([newCoords[0], newCoords[1]]);
            window.ymaps.geocode(newCoords).then((res: any) => {
              const firstGeoObject = res.geoObjects.get(0);
              const address = firstGeoObject ? firstGeoObject.getAddressLine() : `${newCoords[0].toFixed(4)}, ${newCoords[1].toFixed(4)}`;
              setPickupAddress(address);
              recalculateYangoRoute(newCoords, dropoffCoords);
            });
          });

          map.geoObjects.add(pickupPlacemark);
          pickupPlacemarkRef.current = pickupPlacemark;

          // 2. Setup Point B (Destination - Red Pin)
          const dropoffPlacemark = new window.ymaps.Placemark(dropoffCoords, {
            hintContent: 'Destination (Point B)',
            balloonContent: dropoffAddress
          }, {
            preset: 'islands#redDotIcon',
            draggable: true
          });

          dropoffPlacemark.events.add('dragend', () => {
            const newCoords = dropoffPlacemark.geometry.getCoordinates();
            setDropoffCoords([newCoords[0], newCoords[1]]);
            window.ymaps.geocode(newCoords).then((res: any) => {
              const firstGeoObject = res.geoObjects.get(0);
              const address = firstGeoObject ? firstGeoObject.getAddressLine() : `${newCoords[0].toFixed(4)}, ${newCoords[1].toFixed(4)}`;
              setDropoffAddress(address);
              recalculateYangoRoute(pickupCoords, newCoords);
            });
          });

          map.geoObjects.add(dropoffPlacemark);
          dropoffPlacemarkRef.current = dropoffPlacemark;

          // 3. Map Click Listener
          map.events.add('click', (e: any) => {
            const coords = e.get('coords');
            setDropoffCoords([coords[0], coords[1]]);
            dropoffPlacemark.geometry.setCoordinates(coords);
            window.ymaps.geocode(coords).then((res: any) => {
              const firstGeoObject = res.geoObjects.get(0);
              const address = firstGeoObject ? firstGeoObject.getAddressLine() : `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
              setDropoffAddress(address);
              recalculateYangoRoute(pickupCoords, coords);
            });
          });

          // 4. Setup SuggestView Autocomplete for Inputs
          setupYangoSuggest(pickupInputId, (coords: [number, number], addr: string) => {
            setPickupCoords(coords);
            setPickupAddress(addr);
            pickupPlacemark.geometry.setCoordinates(coords);
            map.setCenter(coords);
            recalculateYangoRoute(coords, dropoffCoords);
          });

          setupYangoSuggest(dropoffInputId, (coords: [number, number], addr: string) => {
            setDropoffCoords(coords);
            setDropoffAddress(addr);
            dropoffPlacemark.geometry.setCoordinates(coords);
            map.setCenter(coords);
            recalculateYangoRoute(pickupCoords, coords);
          });

          // 5. Initial Route Calculation
          recalculateYangoRoute(pickupCoords, dropoffCoords);

        } catch (err: any) {
          console.error("Yango Map Init Error:", err);
          setLoadError(err.message || "Authentication error with Yango Maps API Key");
        }
      });
    };

    loadYangoScript();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch (e) {}
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [apiKey, language, mapContainerId]);

  // Connect Yango Suggest API to HTML Input
  const setupYangoSuggest = (elementId: string, callback: (coords: [number, number], addr: string) => void) => {
    try {
      if (!window.ymaps || !window.ymaps.SuggestView) return;

      const suggestView = new window.ymaps.SuggestView(elementId, {
        provider: {
          suggest: (request: string) => window.ymaps.suggest(request, { boundedBy: [[24.7, 54.9], [25.5, 55.6]] }) // GCC Bounding Box
        }
      });

      suggestView.events.add('select', (e: any) => {
        const selectedAddress = e.get('item').value;
        window.ymaps.geocode(selectedAddress, { results: 1 }).then((res: any) => {
          const firstGeoObject = res.geoObjects.get(0);
          if (firstGeoObject) {
            const coords = firstGeoObject.geometry.getCoordinates();
            callback([coords[0], coords[1]], selectedAddress);
          }
        });
      });
    } catch (e) {
      console.warn("SuggestView setup skipped:", e);
    }
  };

  // Calculate Dynamic Road Route & Traffic Profile
  const recalculateYangoRoute = (p1: [number, number], p2: [number, number]) => {
    if (!window.ymaps || !mapInstanceRef.current) return;

    if (currentRouteRef.current) {
      mapInstanceRef.current.geoObjects.remove(currentRouteRef.current);
    }

    window.ymaps.route([p1, p2], {
      mapStateAutoApply: true,
      routingMode: 'auto' // Driving mode
    }).then((route: any) => {
      currentRouteRef.current = route;

      // Style active polyline path with Yango Brand Red
      route.getPaths().options.set({
        strokeColor: '#FF2B42',
        strokeWidth: 6,
        opacity: 0.95
      });

      mapInstanceRef.current.geoObjects.add(route);

      // Extract Telemetry Metrics
      const distanceKm = parseFloat((route.getLength() / 1000).toFixed(1));
      const timeMins = Math.ceil(route.getTime() / 60);
      const estimatedFare = parseFloat((12 + (distanceKm * 2.8)).toFixed(2));

      const metrics = { distanceKm, durationMins: timeMins, estimatedFare };
      setRouteMetrics(metrics);
      if (onRouteCalculated) onRouteCalculated(metrics);
    }).catch((routeErr: any) => {
      console.warn("Yango routing notice:", routeErr);
    });
  };

  // -------------------------------------------------------------
  // Real-Time Live Driver Tracking Subsystem (LERP Engine)
  // -------------------------------------------------------------
  const startLiveTrackingSimulation = () => {
    if (!currentRouteRef.current || !mapInstanceRef.current || !window.ymaps) return;

    try {
      const pathCoordinates = currentRouteRef.current.getPaths().get(0).getCoordinates();
      if (!pathCoordinates || pathCoordinates.length < 2) return;

      setIsSimulatingDriver(true);
      setActiveStep('dispatched');

      if (driverPlacemarkRef.current) {
        mapInstanceRef.current.geoObjects.remove(driverPlacemarkRef.current);
      }

      // Initialize Driver Marker
      const driverPlacemark = new window.ymaps.Placemark(pathCoordinates[0], {
        hintContent: 'USend Courier On-Demand',
        balloonContent: 'Live Driver Telemetry Stream'
      }, {
        iconLayout: 'default#image',
        iconImageHref: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
        iconImageSize: [40, 40],
        iconImageOffset: [-20, -20]
      });

      mapInstanceRef.current.geoObjects.add(driverPlacemark);
      driverPlacemarkRef.current = driverPlacemark;

      let stepIndex = 0;
      let progress = 0;

      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);

      simulationIntervalRef.current = setInterval(() => {
        if (stepIndex >= pathCoordinates.length - 1) {
          clearInterval(simulationIntervalRef.current);
          setIsSimulatingDriver(false);
          setActiveStep('arrived');
          return;
        }

        const startNode = pathCoordinates[stepIndex];
        const endNode = pathCoordinates[stepIndex + 1];

        // Linear interpolation between coordinate nodes
        progress += 0.04;
        const currentLat = startNode[0] + (endNode[0] - startNode[0]) * progress;
        const currentLng = startNode[1] + (endNode[1] - startNode[1]) * progress;

        driverPlacemark.geometry.setCoordinates([currentLat, currentLng]);

        if (progress >= 1.0) {
          progress = 0;
          stepIndex++;
        }
      }, 50); // 20 updates per second for fluid 60 FPS visual animation
    } catch (simErr) {
      console.warn("Simulation notice:", simErr);
    }
  };

  const handleSaveApiKey = () => {
    if (tempKeyInput.trim()) {
      localStorage.setItem('yango_maps_api_key', tempKeyInput.trim());
      setApiKey(tempKeyInput.trim());
      setShowKeyModal(false);
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[520px] bg-[#121214] text-white overflow-hidden ${isModal ? 'rounded-2xl' : ''}`}>
      {/* 1. NATIVE YANGO MAP CANVAS (EDGE-TO-EDGE) */}
      <div
        id={mapContainerId}
        className="absolute inset-0 w-full h-full z-0"
        style={{ width: '100%', height: '100%', minHeight: '520px', backgroundColor: '#121214' }}
      />

      {/* Loading Indicator */}
      {!isMapReady && !loadError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#121214]/90 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-[#FF2B42] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-300">
            Initializing Yango Maps Engine...
          </p>
        </div>
      )}

      {/* Error / Missing Key Banner */}
      {loadError && (
        <div className="absolute top-4 inset-x-4 sm:inset-x-auto sm:left-4 z-[600] max-w-md bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 backdrop-blur-xl shadow-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-300">Yango Maps Key Notice</p>
            <p className="text-zinc-400 text-[11px] mt-0.5">{loadError}</p>
            <button
              onClick={() => {
                setTempKeyInput(apiKey);
                setShowKeyModal(true);
              }}
              className="mt-2.5 px-3 py-1.5 bg-[#FF2B42] hover:bg-[#e02439] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Key className="w-3 h-3" /> Enter Registered API Key
            </button>
          </div>
        </div>
      )}

      {/* 2. FLOATING YANGO DISPATCH CARD OVERLAY */}
      <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} z-[500] w-[calc(100%-2rem)] sm:w-96 max-w-[420px] bg-[#1E1E24]/95 backdrop-blur-2xl border border-[#2C2C35] rounded-3xl p-5 shadow-2xl transition-all duration-300 max-h-[calc(100%-2rem)] overflow-y-auto`}>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#2C2C35]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-white tracking-tight">Order Mobility</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FF2B42]/15 text-[#FF2B42] border border-[#FF2B42]/30">
              Yango Engine
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setTempKeyInput(apiKey);
                setShowKeyModal(true);
              }}
              className="p-1.5 rounded-xl bg-[#121214] hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
              title="Configure Yango API Key"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="p-1.5 rounded-xl bg-[#121214] hover:bg-zinc-800 text-zinc-400 cursor-pointer transition-colors"
              title={isPanelCollapsed ? "Expand" : "Collapse"}
            >
              {isPanelCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-[#121214] hover:bg-zinc-800 text-zinc-400 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {!isPanelCollapsed && (
          <div className="space-y-4 pt-3.5">
            <p className="text-[11px] text-[#8E8E93] font-medium">
              {isRTL ? 'حدد نقطة الاستلام والوجهة أو اضغط مباشرة على الخريطة' : 'Set pickup & destination or tap directly on the map'}
            </p>

            {/* Inputs */}
            <div className="space-y-3.5">
              {/* Pickup Point A */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  {isRTL ? 'نقطة الاستلام (أ)' : 'Pickup Location (Point A)'}
                </label>
                <input
                  id={pickupInputId}
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Search pickup or drag green pin"
                  className="w-full bg-[#121214] border border-[#2C2C35] focus:border-[#FF2B42] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all placeholder:text-zinc-500 font-medium"
                />
              </div>

              {/* Destination Point B */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF2B42] shadow-[0_0_8px_rgba(255,43,66,0.8)]" />
                  {isRTL ? 'وجهة التسليم (ب)' : 'Destination (Point B)'}
                </label>
                <input
                  id={dropoffInputId}
                  type="text"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder="Search destination or drag red pin"
                  className="w-full bg-[#121214] border border-[#2C2C35] focus:border-[#FF2B42] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all placeholder:text-zinc-500 font-medium"
                />
              </div>
            </div>

            {/* Trip Telemetry Summary */}
            {routeMetrics && (
              <div className="bg-[#121214] border border-[#2C2C35] rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2C2C35]">
                  <span className="text-[#8E8E93] flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5 text-zinc-400" />
                    {isRTL ? 'المسافة المقدرة:' : 'Estimated Distance:'}
                  </span>
                  <span className="font-bold text-white font-mono">{routeMetrics.distanceKm} km</span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2C2C35]">
                  <span className="text-[#8E8E93] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {isRTL ? 'الوقت مع المرور:' : 'Travel Time (Traffic):'}
                  </span>
                  <span className="font-bold text-amber-400 font-mono">{routeMetrics.durationMins} mins</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    {isRTL ? 'التكلفة المقدرة:' : 'Estimated Fare:'}
                  </span>
                  <span className="font-black text-[#FF2B42] text-sm font-mono">AED {routeMetrics.estimatedFare}</span>
                </div>
              </div>
            )}

            {/* Status Banners */}
            {activeStep === 'dispatched' && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[11px] text-blue-400 flex items-center gap-2 animate-pulse">
                <Car className="w-4 h-4 shrink-0" />
                <span>{isRTL ? 'السائق في الطريق عبر مسار يانجو المباشر...' : 'Driver en-route via Yango Live Telemetry...'}</span>
              </div>
            )}

            {activeStep === 'arrived' && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{isRTL ? 'وصل السائق إلى الوجهة المحددة بنجاح!' : 'Driver arrived at destination successfully!'}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {activeStep === 'plan' ? (
                <button
                  onClick={startLiveTrackingSimulation}
                  className="w-full py-3.5 bg-[#FF2B42] hover:bg-[#e02439] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#FF2B42]/25 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isRTL ? 'محاكاة تتبع السائق المباشر' : 'Simulate Live Driver Telemetry'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActiveStep('plan');
                    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
                    if (driverPlacemarkRef.current && mapInstanceRef.current) {
                      mapInstanceRef.current.geoObjects.remove(driverPlacemarkRef.current);
                    }
                  }}
                  className="w-full py-2.5 bg-[#121214] hover:bg-zinc-800 text-white border border-[#2C2C35] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
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
                  className="w-full py-3.5 bg-white hover:bg-zinc-100 text-black font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <Check className="w-4 h-4 text-black" />
                  {isRTL ? 'تأكيد المسار والنقاط' : 'Confirm Location & Route'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. YANGO API KEY CONFIG MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#1E1E24] border border-[#2C2C35] rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#FF2B42]" />
                <h3 className="font-bold text-sm">Yango Maps API Configuration</h3>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="p-1 rounded-full text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#8E8E93]">
              Enter your registered developer or partner API key from Yango Developer Console or Yandex Developer Dashboard (developer.tech.yandex.com).
            </p>
            <input
              type="text"
              value={tempKeyInput}
              onChange={(e) => setTempKeyInput(e.target.value)}
              placeholder="Paste Yango API Key here..."
              className="w-full bg-[#121214] border border-[#2C2C35] focus:border-[#FF2B42] rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="flex-1 py-2.5 bg-[#121214] hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="flex-1 py-2.5 bg-[#FF2B42] hover:bg-[#e02439] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#FF2B42]/25"
              >
                Save & Initialize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
