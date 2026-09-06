import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker with automatic update & offline precaching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[CAOMS PWA] New update available - activating service worker');
  },
  onOfflineReady() {
    console.log('[CAOMS PWA] Service Worker active: ready for offline execution');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

