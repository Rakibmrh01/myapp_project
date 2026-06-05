const CACHE_NAME = 'mrh-daily-account-v4';
const BASE = '/myapp_project';

// সব ফাইলের লিস্ট
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/favicon.png',
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
  BASE + '/js/ai-dashboard.js',
  BASE + '/js/n.js',
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
  BASE + '/js/AnalysisForexbackup.js',
  BASE + '/pages/income.html',
  BASE + '/pages/expense.html',
  BASE + '/pages/ledger.html',
  BASE + '/pages/savings.html',
  BASE + '/pages/analysis.html',
  BASE + '/pages/analysis_backup.html',
  BASE + '/pages/ai-chat.html',
  BASE + '/pages/calculator.html',
  BASE + '/pages/notes.html',
  BASE + '/pages/settings.html',
  BASE + '/pages/extra-backup.html',
  BASE + '/pages/emergency-backup.html',
  BASE + '/pages/accounting.html',
  BASE + '/pages/income-list.html',
  BASE + '/pages/expense-list.html',
  BASE + '/pages/ledger-list.html',
  BASE + '/pages/savings-list.html',
  BASE + '/pages/trash-manager.html',
  BASE + '/pages/about.html',
  BASE + '/pages/how-to-use.html',
  BASE + '/pages/font.html',
  BASE + '/pages/css-changer.html',
  BASE + '/pages/full-page-setup.html',
  BASE + '/pages/privacy-policy.html',
  BASE + '/pages/terms.html',
  BASE + '/data/app_config.json',
  BASE + '/data/ai_config.json',
  BASE + '/data/expense_categories.json',
  BASE + '/data/income_types.json',
  BASE + '/data/bank_methods.json',
  BASE + '/data/colors.json',
  BASE + '/data/ai_rules.json',
  BASE + '/data/chart_config.json',
  BASE + '/data/ledger_status.json',
  BASE + '/icons/icon-72x72.png',
  BASE + '/icons/icon-96x96.png',
  BASE + '/icons/icon-128x128.png',
  BASE + '/icons/icon-144x144.png',
  BASE + '/icons/icon-192x192.png',
  BASE + '/icons/icon-512x512.png'
];

// Install — একটাও বাদ না দিয়ে সব cache করো
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // একটা একটা করে cache করো, একটা fail করলেও বাকিগুলো হবে
      return Promise.allSettled(
        ASSETS.map(url =>
          cache.add(url).catch(e => console.warn('Cache miss:', url, e))
        )
      );
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

// Fetch — Cache first, তারপর network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Cache এ আছে → সরাসরি দাও (নেট লাগবে না)
      if (cached) return cached;

      // Cache এ নেই → নেট থেকে নিয়ে cache করো
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // নেটও নেই → index.html দাও
        return caches.match(BASE + '/index.html');
      });
    })
  );
});

// প্রথমবার install এর পর সব client কে reload করো
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
