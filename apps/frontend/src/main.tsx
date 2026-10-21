import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Đăng ký Service Worker hỗ trợ PWA và hoạt động ngoại tuyến (Offline shell)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[ShopFlow PWA] Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('[ShopFlow PWA] Registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
