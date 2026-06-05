const CACHE_NAME = 'mrh-daily-account-v2';
const BASE = '/myapp_project';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/favicon.png',
  BASE + '/sw.js',
  BASE + '/css/base.css',
  BASE + '/css/dashboard.css',
  BASE + '/css/animation.css',
  BASE + '/css/forms.css',
  BASE + '/css/list.css',
  BASE + '/css/charts.css',
  BASE + '/css/calculator.css',
  BASE + '/css/notes.css',
  BASE + '/css/settings.css',
  BASE + '/css/extra-backup.css',
  BASE + '/css/extra-backup-analysis.css',
  BASE + '/css/css-changer.css',
  BASE + '/js/db.js',
  BASE + '/js/app.js',
  BASE + '/js/dashboard.js',
  BASE + '/js/settings.js',
  BASE + '/js/income.js',
  BASE + '/js/expense.js',
  BASE + '/js/ledger.js',
  BASE + '/js/savings.js',
  BASE + '/js/analysis.js',
  BASE + '/js/calculator.js',
  BASE + '/js/notes.js',
  BASE + '/js/backup.js',
  BASE + '/js/chart.min.js',
  BASE + '/js/chart-engine.js',
  BASE + '/js/accounting.js',
  BASE + '/js/css-changer.js',
  BASE + '/js/extra-backup.js',
  BASE + '/js/font.js',
  BASE + '/js/full-page-setup.js',
  BASE + '/js/income-list.js',
  BASE + '/js/expense-list.js',
  BASE + '/js/ledger-list.js',
  BASE + '/js/savings-list.js',
  BASE + '/js/trash-manager.js',
  BASE + '/pages/income.html',
  BASE + '/pages/expense.html',
  BASE + '/pages/ledger.html',
  BASE + '/pages/savings.html',
  BASE + '/pages/analysis.html',
  BASE + '/pages/calculator.html',
  BASE + '/pages/notes.html',
  BASE + '/pages/settings.html',
  BASE + '/pages/backup.html',
  BASE + '/pages/extra-backup.html',
  BASE + '/pages/accounting.html',
  BASE + '/pages/income-list.html',
  BASE + '/pages/expense-list.html',
  BASE + '/pages/ledger-list.html',
  BASE + '/pages/savings-list.html',
  BASE + '/pages/trash-manager.html',
  BASE + '/data/app_config.json',
  BASE + '/icons/icon-192x192.png',
  BASE + '/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS).catch(e => console.log('cache err:', e)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(BASE + '/index.html'));
    })
  );
});
