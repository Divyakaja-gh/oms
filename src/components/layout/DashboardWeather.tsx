import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Clock, 
  MapPin, 
  RefreshCw
} from 'lucide-react';

interface GeoLocationData {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export function DashboardWeather() {
  const [time, setTime] = useState(new Date());
  const [geo, setGeo] = useState<GeoLocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Time ticker
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Geolocation Fetcher (Resolves Location Name only, no IP exposed)
  const fetchLocation = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsUpdating(true);
    }

    let resolvedGeo: GeoLocationData | null = null;

    // STEP 1: Direct client-side fetch to resolve location name
    try {
      const res = await fetch('https://ipwho.is/', {
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false && data.latitude && data.longitude) {
          resolvedGeo = {
            city: data.city || data.region || 'Local Area',
            region: data.region || '',
            country: data.country || 'India',
            latitude: data.latitude,
            longitude: data.longitude,
            timezone: data.timezone?.id
          };
        }
      }
    } catch (e) {
      console.warn('Primary location lookup error:', e);
    }

    // STEP 2: Secondary fallback: server proxy endpoint
    if (!resolvedGeo) {
      try {
        const res = await fetch('/api/weather', {
          signal: AbortSignal.timeout(4000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.latitude && data.longitude) {
            resolvedGeo = {
              city: data.city || 'Local Area',
              region: data.region || '',
              country: data.country || 'India',
              latitude: data.latitude,
              longitude: data.longitude,
              timezone: data.timezone
            };
          }
        }
      } catch (e2) {
        console.warn('Server weather proxy error:', e2);
      }
    }

    // STEP 3: Tertiary fallback: freeipapi.com
    if (!resolvedGeo) {
      try {
        const res = await fetch('https://freeipapi.com/api/json', {
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.latitude && data.longitude) {
            resolvedGeo = {
              city: data.cityName || 'Local Area',
              region: data.regionName || '',
              country: data.countryName || 'India',
              latitude: data.latitude,
              longitude: data.longitude
            };
          }
        }
      } catch (e3) {
        console.warn('Tertiary geo fallback error:', e3);
      }
    }

    // Default coordinates if all geo endpoints fail (Default to CA Practice HQ Bengaluru)
    if (!resolvedGeo) {
      resolvedGeo = {
        city: 'Bengaluru',
        region: 'Karnataka',
        country: 'India',
        latitude: 12.9716,
        longitude: 77.5946
      };
    }

    setGeo(resolvedGeo);
    setIsLoading(false);
    setIsUpdating(false);
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Format time based on detected timezone
  const formattedTime = time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: geo?.timezone || undefined
  });

  const formattedDate = time.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: geo?.timezone || undefined
  });

  // Extract first 3 letters of city and state name
  const rawCity = geo?.city || 'Bengaluru';
  const rawState = geo?.region || 'Karnataka';
  const city3Letters = useMemo(() => {
    const cleaned = rawCity.trim().replace(/[^a-zA-Z]/g, '');
    return (cleaned.slice(0, 3) || rawCity.slice(0, 3)).toUpperCase();
  }, [rawCity]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-full px-4 py-2 shadow-2xs animate-pulse">
        <div className="w-20 h-5 bg-zinc-200 rounded-full"></div>
        <div className="w-px h-5 bg-zinc-200"></div>
        <div className="w-24 h-5 bg-zinc-200 rounded-full"></div>
      </div>
    );
  }

  return (
    <div 
      id="dashboard-time-location-bar"
      className="flex items-center gap-2.5 sm:gap-3 bg-white border border-zinc-200/90 rounded-full px-4 py-1.5 shadow-2xs text-xs select-none"
    >
      {/* 1. Time & Date */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
          <Clock className="w-3.5 h-3.5 text-zinc-600" />
        </div>
        <div className="flex flex-col">
          <span 
            className="text-xs font-bold text-zinc-900 font-mono tracking-tight leading-tight"
            suppressHydrationWarning
          >
            {formattedTime}
          </span>
          <span 
            className="text-[10px] font-semibold text-zinc-500 leading-none mt-0.5"
            suppressHydrationWarning
          >
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-zinc-200 shrink-0" />

      {/* 2. Location Display: First 3 letters of city and then state */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <MapPin className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span 
            className="text-xs font-bold text-zinc-800 truncate leading-tight flex items-center gap-1.5" 
            title={`${rawCity}, ${rawState}, ${geo?.country || 'India'}`}
          >
            <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider border border-indigo-100/80">
              {city3Letters}
            </span>
            <span className="truncate">{rawState}</span>
          </span>
          <span className="text-[10px] font-semibold text-zinc-400 leading-none mt-0.5 truncate">
            {rawCity}, {geo?.country || 'India'}
          </span>
        </div>
      </div>

      {/* Refresh Pill Button */}
      <button
        type="button"
        onClick={() => fetchLocation(true)}
        disabled={isUpdating}
        className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer disabled:opacity-50 ml-1 shrink-0"
        title="Refresh location & time"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin text-indigo-600' : ''}`} />
      </button>
    </div>
  );
}
