// ============================================================
//  Service Worker — Dashboard Komite Medis SHND
//  - Hapus SEMUA cache lama saat activate
//  - Terima SKIP_WAITING → reload otomatis di client
//  - Network-first untuk API, Cache-first untuk aset statis
// ============================================================

const CACHE_VERSION = 'komdis-v5'; // Ganti versi ini setiap deploy baru

const PRECACHE = [
  '/KOMDIS/',
  '/KOMDIS/index.html',
  '/KOMDIS/manifest.json',
  '/KOMDIS/icons/icon-192.png',
  '/KOMDIS/icons/icon-512.png',
];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Install:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(url).catch(e => console.warn('[SW] Skip cache:', url, e.message))
        )
      ))
  );
});

// ── ACTIVATE — hapus SEMUA cache lama tanpa terkecuali ───────
self.addEventListener('activate', event => {
  console.log('[SW] Activate:', CACHE_VERSION, '— membersihkan cache lama...');
  event.waitUntil(
    caches.keys()
      .then(keys => {
        const toDelete = keys.filter(k => k !== CACHE_VERSION);
        if (toDelete.length > 0) console.log('[SW] Hapus cache lama:', toDelete);
        return Promise.all(toDelete.map(k => caches.delete(k)));
      })
      .then(() => {
        console.log('[SW] Cache bersih. Ambil kontrol semua tab...');
        return self.clients.claim();
      })
  );
});

// ── MESSAGE — terima SKIP_WAITING dari halaman ───────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING diterima → aktivasi sekarang');
    self.skipWaiting();
  }
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Google Apps Script → Network-only
  if (url.hostname.includes('script.google.com') || url.hostname.includes('script.googleusercontent.com')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ success: false, offline: true, error: 'Anda offline. Data terakhir ditampilkan.' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Google Drive foto → Network-first + cache
  if (url.hostname.includes('lh3.googleusercontent.com')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) { const c = res.clone(); caches.open(CACHE_VERSION).then(ca => ca.put(request, c)); }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Drive dokumen → Network-only
  if (url.hostname.includes('drive.google.com')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Google Fonts → Cache-first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) { const c = res.clone(); caches.open(CACHE_VERSION).then(ca => ca.put(request, c)); }
          return res;
        });
      })
    );
    return;
  }

  // CDN → Cache-first
  if (url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) { const c = res.clone(); caches.open(CACHE_VERSION).then(ca => ca.put(request, c)); }
          return res;
        });
      })
    );
    return;
  }

  // Aset lokal → Network-first agar selalu fresh
  event.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) { const c = res.clone(); caches.open(CACHE_VERSION).then(ca => ca.put(request, c)); }
        return res;
      })
      .catch(() =>
        caches.match(request).then(cached =>
          cached || (request.mode === 'navigate' ? caches.match('/KOMDIS/index.html') : null)
        )
      )
  );
});
