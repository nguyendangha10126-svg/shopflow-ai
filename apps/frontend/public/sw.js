const CACHE_NAME = 'shopflow-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Không cache API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first với fallback sang Cache cho điều hướng trang
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('/index.html');
        if (cachedIndex) return cachedIndex;

        // Offline HTML fallback
        return new Response(
          `<!DOCTYPE html>
          <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>ShopFlow AI - Mất kết nối</title>
              <style>
                body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; text-align: center; padding: 20px; }
                .card { background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 400px; }
                h1 { font-size: 20px; margin-bottom: 8px; color: #4f46e5; }
                p { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
                button { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Đang Mất Kết Nối Mạng</h1>
                <p>Thiết bị của bạn đang tạm thời ngắt kết nối Internet. Dữ liệu đã tải vẫn được bảo toàn an toàn.</p>
                <button onclick="window.location.reload()">Thử tải lại</button>
              </div>
            </body>
          </html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
    );
    return;
  }

  // Cache-first cho static files (CSS, JS, Fonts, Images)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache).catch(() => {});
        });
        return response;
      });
    })
  );
});

