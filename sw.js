const CACHE_NAME = 'mrh-daily-account-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/css/base.css',
  '/css/dashboard.css',
  '/css/animation.css',
  '/css/forms.css',
  '/css/list.css',
  '/css/charts.css',
  '/css/calculator.css',
  '/css/notes.css',
  '/css/settings.css',
  '/css/extra-backup.css',
  '/css/extra-backup-analysis.css',
  '/css/css-changer.css',
  '/js/db.js',
  '/js/app.js',
  '/js/dashboard.js',
  '/js/settings.js',
  '/js/income.js',
  '/js/expense.js',
  '/js/ledger.js',
  '/js/savings.js',
  '/js/analysis.js',
  '/js/calculator.js',
  '/js/notes.js',
  '/js/backup.js',
  '/js/chart.min.js',
  '/js/chart-engine.js',
  '/js/accounting.js',
  '/js/css-changer.js',
  '/js/extra-backup.js',
  '/js/font.js',
  '/js/full-page-setup.js',
  '/js/income-list.js',
  '/js/expense-list.js',
  '/js/ledger-list.js',
  '/js/savings-list.js',
  '/js/trash-manager.js',
  '/js/AnalysisForexbackup.js',
  '/pages/income.html',
  '/pages/expense.html',
  '/pages/ledger.html',
  '/pages/ledger-list.html',
  '/pages/savings.html',
  '/pages/savings-list.html',
  '/pages/income-list.html',
  '/pages/expense-list.html',
  '/pages/analysis.html',
  '/pages/analysis_backup.html',
  '/pages/calculator.html',
  '/pages/notes.html',
  '/pages/settings.html',
  '/pages/backup.html',
  '/pages/extra-backup.html',
  '/pages/emergency-backup.html',
  '/pages/accounting.html',
  '/pages/css-changer.html',
  '/pages/full-page-setup.html',
  '/pages/font.html',
  '/pages/trash-manager.html',
  '/pages/about.html',
  '/pages/how-to-use.html',
  '/pages/privacy-policy.html',
  '/pages/terms.html',
  '/data/app_config.json',
  '/data/expense_categories.json',
  '/data/income_types.json',
  '/data/bank_methods.json',
  '/data/colors.json',
  '/data/ai_rules.json',
  '/data/chart_config.json',
  '/data/ledger_status.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install — সব ফাইল cache করো
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS.map(url => new Request(url, {cache: 'reload'})))
        .catch(err => console.log('Cache error (non-critical):', err));
    }).then(() => self.skipWaiting())
  );
});

// Activate — পুরনো cache মুছো
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — Offline first strategy
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
      }).catch(() => caches.match('/index.html'));
    })
  );
});
