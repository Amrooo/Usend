import React, { useEffect, useRef, useState, useId } from 'react';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    ymaps?: any;
  }
}

export interface MarkerProps {
  position: [number, number]; // [lat, lng]
  color?: string; // e.g. '#FF2B42', '#10B981'
  preset?: string; // default: 'islands#blueDotIcon'
  hint?: string;
  balloonContent?: string;
}

export interface YandexMapDisplayProps {
  center: [number, number];
  zoom?: number;
  markers?: MarkerProps[];
  className?: string;
  style?: React.CSSProperties;
}

export default function YandexMapDisplay({
  center,
  zoom = 12,
  markers = [],
  className = "w-full h-full",
  style = { width: '100%', height: '100%', minHeight: '200px' }
}: YandexMapDisplayProps) {
  const mapContainerId = `yandex-map-display-${useId().replace(/:/g, '')}`;
  const [isMapReady, setIsMapReady] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  // Load script if not present
  useEffect(() => {
    let script: any = document.getElementById('yango-maps-api-script') || document.querySelector('script[src*="api-maps"]');
    
    if (script && window.ymaps && window.ymaps.ready) {
      return; // Already loaded
    }

    if (!script) {
      const apikey = (import.meta as any).env.VITE_YANDEX_MAPS_API_KEY || '';
      script = document.createElement('script');
      script.id = 'yango-maps-api-script';
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apikey}&lang=en_US`;
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Initialize and update map
  useEffect(() => {
    let isMounted = true;

    const renderMap = () => {
      if (!window.ymaps || !window.ymaps.ready) return;

      window.ymaps.ready(() => {
        if (!isMounted) return;
        
        const container = document.getElementById(mapContainerId);
        if (!container) return;

        // Clean up previous instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }

        container.innerHTML = ''; // Clear container

        try {
          const map = new window.ymaps.Map(mapContainerId, {
            center: center,
            zoom: zoom,
            controls: ['zoomControl']
          }, {
            suppressMapOpenBlock: true,
          });

          mapInstanceRef.current = map;
          setIsMapReady(true);

          // Add markers
          markers.forEach(m => {
            const placemark = new window.ymaps.Placemark(m.position, {
              hintContent: m.hint,
              balloonContent: m.balloonContent
            }, {
              preset: m.preset || 'islands#blueDotIcon',
              iconColor: m.color
            });
            map.geoObjects.add(placemark);
          });

        } catch (initErr) {
          console.error("Yandex Map mounting error:", initErr);
        }
      });
    };

    if (window.ymaps && window.ymaps.ready) {
      renderMap();
    } else {
      const checkInterval = setInterval(() => {
        if (window.ymaps && window.ymaps.ready) {
          clearInterval(checkInterval);
          renderMap();
        }
      }, 500);
      return () => clearInterval(checkInterval);
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.destroy(); } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [center[0], center[1], zoom, JSON.stringify(markers)]);

  return (
    <div className="relative w-full h-full">
      <div
        id={mapContainerId}
        className={className}
        style={style}
      />
      {!isMapReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-100/80 backdrop-blur-sm">
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin mb-2" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Loading Map...
          </p>
        </div>
      )}
    </div>
  );
}
