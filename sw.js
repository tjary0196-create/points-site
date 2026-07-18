const CACHE_NAME = 'digital-syria-v5'; // رُفع من v4 إلى v5: إصلاح جذري لخطأ كان
// يستبدل أي صورة/ملف فشل تحميله مؤقتاً (كشعار الموقع) بمحتوى index.html كامل،
// مما يظهر كـ"صورة مكسورة". هذا الرفع يجبر كل متصفح فتح الموقع سابقاً على
// تحديث الـService Worker فوراً واعتماد السلوك المُصحّح.

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
        // مهم جداً: الرجوع لـindex.html عند فشل الشبكة لازم يقتصر فقط على طلبات
        // التنقل بين الصفحات (navigation requests) — مثلاً المستخدم يفتح رابط
        // وما في نت مؤقتاً، فمنطقي نعرضله آخر نسخة محفوظة من الموقع بدل صفحة فاضية.
        // بس قبل هذا الإصلاح، كانت نفس القاعدة تنطبق على *كل* طلب فاشل (صور،
        // CSS، خطوط...) — فأي تلعثم بسيط بالشبكة أثناء تحميل صورة (متل شعار
        // الموقع assets/logo-icon.svg) كان يخلي الصورة تُستبدل بمحتوى index.html
        // الكامل، فيظهر للمستخدم أيقونة "صورة مكسورة" بدل الشعار الفعلي.
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('', { status: 504, statusText: 'Network error and no cache available' });
      });
    })
  );
});
