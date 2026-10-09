/* ============================================================
   جرثقیل ۲۴ - Service Worker
   نسخه: v3 (کش جدید برای آپدیت اجباری)
   ============================================================ */

const CACHE_NAME = 'jarsaghil24-v3';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// ============================================================
// نصب: کش کردن فایل‌های اصلی
// ============================================================
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker v3 نصب شد');
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
  );
});

// ============================================================
// فعال‌سازی: پاک کردن کش‌های قدیمی
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker v3 فعال شد');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log('🗑️ حذف کش قدیمی:', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================================
// Fetch: استراتژی Network First (برای آپدیت خودکار)
// ============================================================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // پاسخ موفق از شبکه
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        // کش کن برای دفعات بعد
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // آفلاین: از کش بده
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // اگه صفحه اصلی بود و در کش نبود
          if (event.request.mode === 'navigate') {
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