/* ============================================================
   جرثقیل ۲۴ - Service Worker
   کش کردن فایل‌ها برای کار آفلاین
   ============================================================ */

const CACHE_NAME = 'jarsaghil24-v2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// نصب: کش کردن فایل‌های اصلی
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker نصب شد');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 کش کردن فایل‌ها...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// فعال‌سازی: پاک کردن کش‌های قدیمی
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker فعال شد');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('🗑️ حذف کش قدیمی:', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: استراتژی Cache First
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // آپدیت در پس‌زمینه
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response  response.status !== 200  response.type === 'opaque') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});

// پیام‌ها (برای آپدیت دستی)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
