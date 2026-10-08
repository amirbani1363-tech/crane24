// ============================================================
// جرثقیل ۲۴ - Service Worker
// استراتژی: Cache First برای همه فایل‌ها (کاملاً آفلاین)
// ============================================================

const CACHE_NAME = 'jarsaghil24-v1';
const RUNTIME_CACHE = 'jarsaghil24-runtime-v1';

// فایل‌هایی که باید از قبل کش بشن
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// ============================================================
// نصب: کش کردن فایل‌های اصلی
// ============================================================
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker در حال نصب...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 کش کردن فایل‌ها...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('✅ نصب کامل شد');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('❌ خطا در نصب:', err);
      })
  );
});

// ============================================================
// فعال‌سازی: پاک کردن کش‌های قدیمی
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker فعال شد');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('🗑️ پاک کردن کش قدیمی:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================================
// Fetch: استراتژی Cache First + Network Fallback
// ============================================================
self.addEventListener('fetch', (event) => {
  // فقط GET
  if (event.request.method !== 'GET') return;

  // از فایل‌های خارجی (مثل chrome-extension) صرف‌نظر کن
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // اگر در کش هست، از کش بده (آفلاین کار می‌کنه)
      if (cached) {
        // در پس‌زمینه هم آپدیت کن
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => {});
        return cached;
      }

      // اگر در کش نبود، از شبکه بگیر
      return fetch(event.request)
        .then((response) => {
          // پاسخ‌های موفق رو کش کن
          if (!response  response.status !== 200  response.type === 'opaque') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // اگر شبکه هم نبود و درخواست صفحه HTML بود
          if (event.request.mode === 'navigate' ||
              (event.request.headers.get('accept') || '').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
    })
  );
});

// ============================================================
// پیام‌ها (برای آپدیت دستی)
// ============================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
