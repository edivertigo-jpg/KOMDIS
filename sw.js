// ============================================================
//  Service Worker — Dashboard Komite Medis SHND
//  Strategi: Cache-first untuk aset statis,
//            Network-first untuk data API Google Apps Script
// ============================================================

const CACHE_NAME    = 'komite-medis-v1';
const CACHE_OFFLINE = 'komite-medis-offline-v1';

// Aset yang di-cache saat install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap',
];

// ── INSTALL ─────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching assets...');
        // Cache satu-satu agar error satu tidak blok semua
        return Promise.allSettled(
          PRECACHE_ASSETS.map(url =>
            cache.add(url).catch(err => console.warn('[SW] Gagal cache:', url, err))
          )
        );
      })
      .then(() => {
        console.log('[SW] Install selesai');
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== CACHE_OFFLINE)
          .map(k => {
            console.log('[SW] Hapus cache lama:', k);
            return caches.delete(k);
          })
      )
    ).then(() => {
      console.log('[SW] Aktif & siap');
      return self.clients.claim();
    })
  );
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Lewati request non-GET
  if (request.method !== 'GET') return;

  // ── Google Apps Script API → Network-first, jangan cache ──
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('script.googleusercontent.com')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Offline: kembalikan JSON error agar UI bisa tampilkan pesan
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            error: 'Anda sedang offline. Data terakhir masih ditampilkan.'
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // ── Google Drive foto/dokumen → Network-first ──
  if (url.hostname.includes('lh3.googleusercontent.com') ||
      url.hostname.includes('drive.google.com')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache foto profil agar bisa dilihat offline
          if (response.ok && url.hostname.includes('lh3.googleusercontent.com')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ── Google Fonts → Cache-first ──
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── CDN (xlsx, dll) → Cache-first ──
  if (url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Aset lokal (HTML, JS, CSS, gambar) → Cache-first ──
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback ke index.html untuk navigasi
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ── BACKGROUND SYNC (opsional, untuk future offline form) ────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
  }
});

// ── PUSH NOTIFICATION (siap untuk future feature) ─────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || 'Ada notifikasi baru',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Komite Medis SHND', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
