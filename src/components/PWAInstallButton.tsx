import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'badge' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone PWA mode, suppress install prompt
  if (isInstalled) {
    return null;
  }

  // Desktop / Android Chrome installable flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg font-semibold transition shadow-xs cursor-pointer ${
          variant === 'header'
            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm'
        }`}
        title="Install CAOMS on your device for offline desktop/mobile access"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-install-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 px-2.5 py-1 text-xs font-semibold transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-zinc-500" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-zinc-200 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900">Install CAOMS on iPhone / iPad</h3>
                <button 
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-zinc-600">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-zinc-900">Step 1:</strong> Tap the <strong>Share</strong> icon in the Safari bottom toolbar.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-zinc-900">Step 2:</strong> Scroll down and select <strong>Add to Home Screen</strong>.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-zinc-900 py-2 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
