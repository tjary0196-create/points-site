const CACHE_NAME = 'digital-syria-v6'; // رُفع من v5 إلى v6: تحويل صفحات HTML
// لاستراتيجية Network-first بدل Cache-first، لأن Cache-first كان ممكن يعرض
// نسخة قديمة أو خاطئة من صفحة (متل صفحة المتجر بدل البطولات) بسبب طبيعة
// cache.addAll() الذرية (لو فشل ملف وحد بالقائمة، ما بينحفظ ولا ملف).

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
      // نحفظ كل ملف لحاله (مش addAll) عشان فشل ملف وحد ما يمنع حفظ الباقي
      return Promise.all(
        urlsToCache.map(url => cache.add(url).catch(() => {
          console.log('تعذر حفظ:', url);
        }))
      );
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

  const isHTMLPage = event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  if (isHTMLPage) {
    // Network-first: دايماً نجرب نجيب أحدث نسخة من الشبكة أول، والكاش بس
    // كخطة احتياطية لو مافي إنترنت. هيك أي صفحة (متجر/بطولات/أدمن) دايماً
    // بتفتح صح ومحدّثة، وما في احتمال نرجع نسخة قديمة بالغلط.
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      }).catch(() => caches.match(event.request).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // باقي الملفات (CSS/JS/صور): Cache-first عادي، أسرع وما فيها خطر تضارب صفحات
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
      }).catch(() => new Response('', { status: 504, statusText: 'Network error and no cache available' }));
    })
  );
});
