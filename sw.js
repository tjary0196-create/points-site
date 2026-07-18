const CACHE_NAME = 'digital-syria-v4'; // تم رفعه من v3 إلى v4 عمداً: يجبر كل من فتح
// الموقع قبل هذا التحديث على تفريغ الكاش القديم وتحميل الملفات الجديدة تلقائياً،
// بدل ما يضل عالق يشوف نسخة قديمة (ثيم ذهبي / لوحات أدمن ميتة) لأن الكاش القديم
// كان أقوى من إعدادات Cache-Control بملف vercel.json.

const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/tournaments.html',
  '/404.html',
  '/manifest.json',
  '/store-neon.css',
  '/animations.css',
  '/assets/logo-icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(() => {
        console.log('Some resources failed to cache, continuing...');
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        return caches.match('/index.html');
      });
    })
  );
});
