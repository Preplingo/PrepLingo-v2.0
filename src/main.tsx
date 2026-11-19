import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
    } else {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => reg.update().catch(() => {}))
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
