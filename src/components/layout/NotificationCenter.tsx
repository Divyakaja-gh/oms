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

function NotificationCenterComponent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState('Local Area');
  const [hasUnread, setHasUnread] = useState(false);

  // Time ticker only updates when notification popover is actually opened
  useEffect(() => {
    if (!isOpen) return;
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, [isOpen]);

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

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(prev => !prev);
      setHasUnread(false);
    };

    window.addEventListener('open_notifications', handleOpen);
    return () => window.removeEventListener('open_notifications', handleOpen);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className="w-5 h-5 text-amber-500" />;
    if (code <= 48) return <Cloud className="w-5 h-5 text-zinc-400" />;
    return <CloudRain className="w-5 h-5 text-blue-500" />;
  };

  return (
    <>
      {/* Mobile backdrop to close popover when tapping outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/25 backdrop-blur-xs z-35 sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 
        Positioned at bottom-20 (80px) on mobile (<sm) to leave 16px clearance above 
        the mobile bottom navigation bar (h-16 / 64px), so the "More" button remains
        100% visible and accessible. On desktop (sm:), positioned at bottom-6.
      */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end pointer-events-auto">
        {isOpen && (
          <div className="mb-3 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 transition-all">
            <div className="bg-zinc-50 dark:bg-zinc-800/70 border-b border-zinc-100 dark:border-zinc-800 p-3.5 sm:p-4 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> System Notifications
              </h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900 flex flex-col gap-2.5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between items-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span suppressHydrationWarning>{time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                <span suppressHydrationWarning className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {weather && (
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-2.5 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate flex-1 font-medium">{locationName}</span>
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
                    {getWeatherIcon(weather.condition)}
                    <span>{weather.temp}°C</span>
                  </div>
                </div>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto p-3.5 sm:p-4 space-y-2.5">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 dark:text-zinc-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">All systems operational. No unread alerts.</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">System Notification</h4>
                      <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 block font-mono" suppressHydrationWarning>
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
          className="relative p-2.5 sm:p-3 bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 rounded-full shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-700/50 dark:border-zinc-700 transition-all cursor-pointer select-none active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          aria-label="Toggle system notifications and weather"
          title="System Notifications & Weather"
        >
          <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white dark:border-zinc-900 rounded-full animate-pulse"></span>
          )}
        </button>
      </div>
    </>
  );
}

export const NotificationCenter = React.memo(NotificationCenterComponent);
