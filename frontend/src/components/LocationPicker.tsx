import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Route, AlertCircle, Loader2, Search } from 'lucide-react';

const LONGDO_MAP_API_KEY = 'b80284eaae12b49f5c9412483a527156';

declare global {
  interface Window {
    longdo: any;
    __longdoLoaded?: boolean;
    __longdoLoading?: boolean;
    __longdoCallbacks?: Array<() => void>;
  }
}

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

export interface RouteInfo {
  distanceKm: number;
  durationText: string;
}

interface Props {
  origin: LocationData | null;
  destination: LocationData | null;
  onOriginChange: (loc: LocationData) => void;
  onDestinationChange: (loc: LocationData) => void;
  onRouteInfo: (info: RouteInfo | null) => void;
}

// Load Longdo Map script once
function loadLongdoMap(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.__longdoLoaded && window.longdo) {
      resolve();
      return;
    }

    if (window.__longdoLoading) {
      window.__longdoCallbacks = window.__longdoCallbacks ?? [];
      window.__longdoCallbacks.push(resolve);
      return;
    }

    window.__longdoLoading = true;
    window.__longdoCallbacks = [];

    const script = document.createElement('script');
    script.src = `https://api.longdo.com/map/?key=${LONGDO_MAP_API_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Longdo map defines window.longdo, but we might need to wait a tick
      const checkInterval = setInterval(() => {
        if (window.longdo) {
          clearInterval(checkInterval);
          window.__longdoLoaded = true;
          window.__longdoLoading = false;
          (window.__longdoCallbacks ?? []).forEach(cb => cb());
          resolve();
        }
      }, 100);
      // Timeout after 10s
      setTimeout(() => { clearInterval(checkInterval); }, 10000);
    };

    script.onerror = () => {
      window.__longdoLoading = false;
      reject(new Error('Failed to load Longdo Map'));
    };

    document.head.appendChild(script);
  });
}

function AutocompleteInput({
  placeholder,
  iconColor,
  icon: Icon,
  value,
  onChange,
  onSelect,
}: {
  placeholder: string;
  iconColor: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  onSelect: (loc: LocationData) => void;
}) {
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLongdo = async (keyword: string) => {
    if (!keyword.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://search.longdo.com/mapsearch/json/search?keyword=${encodeURIComponent(keyword)}&limit=5&key=${LONGDO_MAP_API_KEY}`);
      const json = await res.json();
      setResults(json.data || []);
      setShowDropdown(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value) searchLongdo(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor} pointer-events-none z-10`} />
      <input
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
        placeholder={placeholder}
        className="input-field pl-10 w-full"
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
      )}
      
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0"
              onClick={() => {
                const locData = { address: r.name || r.address || '', lat: r.lat, lng: r.lon };
                onChange(locData.address);
                onSelect(locData);
                setShowDropdown(false);
              }}
            >
              <div className="flex items-start gap-2">
                <Search className="w-3.5 h-3.5 mt-1 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-200">{r.name}</p>
                  {r.address && <p className="text-xs text-slate-400 truncate">{r.address}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LocationPicker({ origin, destination, onOriginChange, onDestinationChange, onRouteInfo }: Props) {
  const [mapsState, setMapsState] = useState<'loading' | 'loaded' | 'error'>('loading');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const [originText, setOriginText] = useState(origin?.address ?? '');
  const [destText, setDestText] = useState(destination?.address ?? '');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Load Maps
  useEffect(() => {
    loadLongdoMap()
      .then(() => setMapsState('loaded'))
      .catch(() => {
        setMapsState('error');
      });
  }, []);

  // Init map after loaded
  useEffect(() => {
    if (mapsState !== 'loaded' || !mapRef.current || mapInstanceRef.current) return;

    // Remove any previous map instance DOM just in case
    mapRef.current.innerHTML = '';

    const map = new window.longdo.Map({
      placeholder: mapRef.current,
      language: 'th',
      lastView: false
    });

    // Bangkok Default
    map.location({ lon: 100.5018, lat: 13.7563 }, true);
    map.zoom(6, true);

    mapInstanceRef.current = map;
  }, [mapsState]);

  // Sync text when props change
  useEffect(() => { if (origin) setOriginText(origin.address); }, [origin]);
  useEffect(() => { if (destination) setDestText(destination.address); }, [destination]);

  // Calculate route when both locations set
  const calcRoute = useCallback(async () => {
    if (!origin || !destination || !window.longdo || !mapInstanceRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.Route.clear();
      }
      setRouteInfo(null);
      onRouteInfo(null);
      return;
    }

    setRouteLoading(true);
    const map = mapInstanceRef.current;

    try {
      // 1. Draw route on Map
      map.Route.clear();
      map.Route.add(new window.longdo.Marker({ lon: origin.lng, lat: origin.lat }, { title: 'ต้นทาง', detail: origin.address }));
      map.Route.add(new window.longdo.Marker({ lon: destination.lng, lat: destination.lat }, { title: 'ปลายทาง', detail: destination.address }));
      map.Route.search();

      // 2. Fetch Distance via REST API
      const res = await fetch(`https://api.longdo.com/RouteService/json/route/guide?flon=${origin.lng}&flat=${origin.lat}&tlon=${destination.lng}&tlat=${destination.lat}&mode=t&type=25&key=${LONGDO_MAP_API_KEY}`);
      const json = await res.json();
      
      if (json.data && json.data[0]) {
        const info: RouteInfo = {
          distanceKm: Math.round((json.data[0].distance / 1000) * 10) / 10,
          durationText: Math.round(json.data[0].interval / 60) + ' นาที',
        };
        setRouteInfo(info);
        onRouteInfo(info);
      }
    } catch (e) {
      console.error(e);
      setRouteInfo(null);
      onRouteInfo(null);
    } finally {
      setRouteLoading(false);
    }
  }, [origin, destination, onRouteInfo]);

  useEffect(() => { calcRoute(); }, [calcRoute]);

  // Error fallback
  if (mapsState === 'error') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">ไม่สามารถโหลด Longdo Map ได้</p>
          </div>
        </div>
        <div className="relative">
          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
          <input type="text" value={originText} onChange={e => { setOriginText(e.target.value); if (e.target.value) onOriginChange({ address: e.target.value, lat: 0, lng: 0 }); }} placeholder="ต้นทาง" className="input-field pl-10 w-full" />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400 pointer-events-none" />
          <input type="text" value={destText} onChange={e => { setDestText(e.target.value); if (e.target.value) onDestinationChange({ address: e.target.value, lat: 0, lng: 0 }); }} placeholder="ปลายทาง" className="input-field pl-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Origin */}
      {mapsState === 'loaded' ? (
        <AutocompleteInput placeholder="ค้นหาต้นทาง เช่น กรุงเทพมหานคร" icon={Navigation} iconColor="text-emerald-400" value={originText} onChange={setOriginText} onSelect={loc => { setOriginText(loc.address); onOriginChange(loc); }} />
      ) : (
        <div className="input-field flex items-center gap-2 text-slate-500 cursor-wait">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">กำลังโหลด Longdo Map...</span>
        </div>
      )}

      {/* Destination */}
      {mapsState === 'loaded' ? (
        <AutocompleteInput placeholder="ค้นหาปลายทาง เช่น เชียงใหม่" icon={MapPin} iconColor="text-red-400" value={destText} onChange={setDestText} onSelect={loc => { setDestText(loc.address); onDestinationChange(loc); }} />
      ) : (
        <div className="input-field flex items-center gap-2 text-slate-500 cursor-wait">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">กำลังโหลด...</span>
        </div>
      )}

      {/* Map canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-700" style={{ height: '260px' }}>
        <div ref={mapRef} className="w-full h-full" />
        {mapsState === 'loading' && (
          <div className="absolute inset-0 bg-dark-900 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
            <span className="text-xs text-slate-500">กำลังโหลดแผนที่...</span>
          </div>
        )}
        {routeLoading && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-dark-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-slate-300 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            กำลังคำนวณเส้นทาง...
          </div>
        )}
      </div>

      {/* Route info */}
      {routeInfo && (
        <div className="flex items-center gap-3 bg-primary-500/10 border border-primary-500/20 rounded-xl px-4 py-3">
          <Route className="w-5 h-5 text-primary-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">{routeInfo.distanceKm.toLocaleString()} กิโลเมตร</p>
            <p className="text-xs text-slate-400">ประมาณเวลาเดินทาง {routeInfo.durationText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
