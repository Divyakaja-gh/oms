import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CloudRain, Sun, Cloud, MapPin, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'fallback' | 'info';
  message: string;
  timestamp: Date;
}

interface WeatherData {
  temp: number;
  condition: number;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState('Local Area');
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Basic IP-based geolocation and weather via reliable endpoints
    fetch('https://ipwho.is/')
      .then(res => res.json())
      .then(data => {
        if (data && data.success !== false && data.latitude && data.longitude) {
          const loc = data.city ? (data.region && data.region !== data.city ? `${data.city}, ${data.region}` : data.city) : 'Local Area';
          setLocationName(loc);
          return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${data.latitude}&longitude=${data.longitude}&current_weather=true`);
        }
        return fetch('/api/weather');
      })
      .then(res => res.json())
      .then(data => {
        if (data.current_weather) {
          setWeather({
            temp: data.current_weather.temperature,
            condition: data.current_weather.weathercode,
          });
        } else if (data.temp !== undefined) {
          if (data.city) setLocationName(data.city);
          setWeather({
            temp: data.temp,
            condition: data.condition || 1,
          });
        }
      })
      .catch(err => {
        console.warn('Weather fetch fallback in notification box:', err);
      });
  }, []);

  useEffect(() => {
    const handleFallback = (e: Event) => {
      const customEvent = e as CustomEvent;
      setNotifications(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        type: 'fallback',
        message: customEvent.detail?.message || 'AI Model Fallback Used due to primary model unavailability.',
        timestamp: new Date()
      }, ...prev]);
      setHasUnread(true);
      setIsOpen(true);
    };

    window.addEventListener('ai_fallback', handleFallback);
    return () => window.removeEventListener('ai_fallback', handleFallback);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className="w-5 h-5 text-amber-500" />;
    if (code <= 48) return <Cloud className="w-5 h-5 text-zinc-400" />;
    return <CloudRain className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-zinc-50 border-b border-zinc-100 p-4 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notification Box
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 bg-white flex flex-col gap-3 border-b border-zinc-100">
            <div className="flex justify-between items-center text-sm font-medium text-zinc-800">
              <span suppressHydrationWarning>{time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <span suppressHydrationWarning>{time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {weather && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <MapPin className="w-4 h-4 text-zinc-400" />
                <span className="truncate flex-1">{locationName}</span>
                <div className="flex items-center gap-1.5 font-medium">
                  {getWeatherIcon(weather.condition)}
                  {weather.temp}°C
                </div>
              </div>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No new notifications</p>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-900">System Notification</h4>
                    <p className="text-xs text-amber-700 mt-1">{notif.message}</p>
                    <span className="text-[10px] text-amber-500 mt-2 block" suppressHydrationWarning>
                      {notif.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          setHasUnread(false);
        }}
        className="relative p-3 bg-zinc-900 text-white rounded-full shadow-lg hover:bg-zinc-800 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {hasUnread && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-zinc-900 rounded-full"></span>
        )}
      </button>
    </div>
  );
}
