// ================================================================
//  Daily Account — db.js  v4.0  🚀 ULTRA FAST EDITION
//  ✅ Bulk Warmup   → page load এ ONE scan, সব RAM এ
//  ✅ Write-Behind  → localStorage write কখনো UI block করে না
//  ✅ Month Index   → income/expense মাস ফিল্টার instant
//  ✅ Total Cache   → dashboard sum গুলো pre-calculated
//  ✅ Zero Wait     → কোনো get() আর localStorage ছোঁয় না
//  Android 9 compatible — no template literals, no arrow functions
// ================================================================

var DB = {

    /* ════════════════════════════════════════
       MEMORY STORE
       সব localStorage data এখানে থাকে।
       page load এ একবার load হয়, তারপর
       সব read এখান থেকেই — zero I/O
       ════════════════════════════════════════ */
    _cache: {},

    /* ════════════════════════════════════════
       WRITE-BEHIND QUEUE
       set() → queue তে রাখে (sync return)
             → 150ms পর background এ flush
       UI কখনো block হয় না
       ════════════════════════════════════════ */
    _writeQueue: {},        // { key: value } — pending writes
    _flushTimer: null,      // debounce timer handle
    _FLUSH_DELAY: 150,      // ms — কতক্ষণ পর flush

    /* ════════════════════════════════════════
       MONTH INDEX
       { 'income':{'2024-01':[...items],'2024-02':[...]} }
       ফিল্টার instant O(1) — loop নেই
       ════════════════════════════════════════ */
    _idx: {},

    /* ════════════════════════════════════════
       TOTAL CACHE
       { 'income_sum': 55000, 'expense_sum': 32000 }
       dashboard এ sum() কল করতে হয় না
       ════════════════════════════════════════ */
    _totals: {},

    /* ════════════════════════════════════════
       BULK WARMUP — সবচেয়ে গুরুত্বপূর্ণ ফাংশন
       localStorage এর সব key একসাথে পড়ে
       RAM এ ভরে দেয়। প্রতিটা get() এরপর
       শুধু object lookup — microseconds!
       ════════════════════════════════════════ */
    _bulkWarmup: function() {
        var t0 = Date.now();
        var count = 0;
        try {
            var len = localStorage.length;
            for (var i = 0; i < len; i++) {
                var key = localStorage.key(i);
                if (!key) continue;
                try {
                    var raw = localStorage.getItem(key);
                    if (raw === null) continue;
                    // JSON parse শুধু একবার — এরপর আর কখনো না
                    this._cache[key] = JSON.parse(raw);
                    count++;
                } catch(e) {
                    // corrupted entry — skip
                    this._cache[key] = null;
                }
            }
        } catch(e) {
            console.warn('[DB] Warmup partial fail:', e.message);
        }
        var elapsed = Date.now() - t0;
        console.log('[DB v4] Warmup: ' + count + ' keys in ' + elapsed + 'ms');
        return elapsed;
    },

    /* ════════════════════════════════════════
       MONTH INDEX BUILD
       income/expense/ledger/savings এর
       প্রতিটা item কে yyyy-mm দিয়ে index করে
       ════════════════════════════════════════ */
    _buildIndexes: function() {
        var INDEXED = ['income', 'expense', 'ledger', 'savings'];
        for (var i = 0; i < INDEXED.length; i++) {
            var key = INDEXED[i];
            this._idx[key] = {};
            var items = this._cache[key];
            if (!Array.isArray(items)) continue;
            for (var j = 0; j < items.length; j++) {
                var item = items[j];
                if (!item || !item.date) continue;
                // date = 'yyyy-mm-dd' → key = 'yyyy-mm'
                var monthKey = item.date.substring(0, 7);
                if (!this._idx[key][monthKey]) {
                    this._idx[key][monthKey] = [];
                }
                this._idx[key][monthKey].push(item);
            }
        }
    },

    /* ════════════════════════════════════════
       TOTAL CACHE BUILD
       সব store এর total sum pre-calculate করে
       dashboard এ sum() loop চালাতে হয় না
       ════════════════════════════════════════ */
    _buildTotals: function() {
        var SUMMED = ['income', 'expense', 'savings'];
        for (var i = 0; i < SUMMED.length; i++) {
            var key = SUMMED[i];
            var items = this._cache[key];
            if (!Array.isArray(items)) { this._totals[key + '_sum'] = 0; continue; }
            var total = 0;
            for (var j = 0; j < items.length; j++) {
                total += Number(items[j] && items[j].amount) || 0;
            }
            this._totals[key + '_sum'] = total;
        }
        // ledger আলাদা — dena/paona
        var ledger = this._cache['ledger'] || [];
        var dena = 0, paona = 0;
        for (var k = 0; k < ledger.length; k++) {
            var l = ledger[k];
            if (!l) continue;
            if (l.type === 'dena')  dena  += Number(l.amount) || 0;
            if (l.type === 'paona') paona += Number(l.amount) || 0;
        }
        this._totals['ledger_dena']  = dena;
        this._totals['ledger_paona'] = paona;
    },


    /* ════════════════════════════════════════
       PUBLIC API
       ════════════════════════════════════════ */

    get: function(key) {
        // সরাসরি cache — zero localStorage read
        var v = this._cache[key];
        return v !== undefined ? v : null;
    },

    set: function(key, value) {
        // 1. Cache আগেই update — caller সাথে সাথে পায়
        this._cache[key] = value;
        // 2. Index ও total invalidate করো
        this._invalidate(key, value);
        // 3. Write queue তে রাখো — UI block নেই
        this._queueWrite(key, value);
        return true;
    },

    /* Write queue — 150ms পর batch flush */
    _queueWrite: function(key, value) {
        this._writeQueue[key] = value;
        if (this._flushTimer) clearTimeout(this._flushTimer);
        var self = this;
        this._flushTimer = setTimeout(function() {
            self._flush();
        }, this._FLUSH_DELAY);
    },

    /* localStorage এ batch write */
    _flush: function() {
        var keys = Object.keys(this._writeQueue);
        if (keys.length === 0) return;
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            try {
                localStorage.setItem(key, JSON.stringify(this._writeQueue[key]));
            } catch(e) {
                console.warn('[DB] Write failed:', key, e.message);
                // localStorage full হলে পুরনো trash clear করার চেষ্টা
                if (e.name === 'QuotaExceededError') {
                    try { localStorage.removeItem('trash'); } catch(e2) {}
                    try { localStorage.setItem(key, JSON.stringify(this._writeQueue[key])); } catch(e3) {}
                }
            }
        }
        this._writeQueue = {};
        this._flushTimer = null;
    },

    /* page navigate হওয়ার আগে flush করো */
    _flushSync: function() {
        clearTimeout(this._flushTimer);
        this._flush();
    },

    /* set হলে index ও total আপডেট */
    _invalidate: function(key, value) {
        var INDEXED = ['income', 'expense', 'ledger', 'savings'];
        if (INDEXED.indexOf(key) === -1) return;
        // Index rebuild (fast — শুধু ওই key-এর)
        if (!Array.isArray(value)) { this._idx[key] = {}; return; }
        this._idx[key] = {};
        for (var j = 0; j < value.length; j++) {
            var item = value[j];
            if (!item || !item.date) continue;
            var monthKey = item.date.substring(0, 7);
            if (!this._idx[key][monthKey]) this._idx[key][monthKey] = [];
            this._idx[key][monthKey].push(item);
        }
        // Total rebuild
        if (key === 'income' || key === 'expense' || key === 'savings') {
            var total = 0;
            for (var i = 0; i < value.length; i++) {
                total += Number(value[i] && value[i].amount) || 0;
            }
            this._totals[key + '_sum'] = total;
        }
        if (key === 'ledger') {
            var dena = 0, paona = 0;
            for (var k = 0; k < value.length; k++) {
                var l = value[k];
                if (!l) continue;
                if (l.type === 'dena')  dena  += Number(l.amount) || 0;
                if (l.type === 'paona') paona += Number(l.amount) || 0;
            }
            this._totals['ledger_dena']  = dena;
            this._totals['ledger_paona'] = paona;
        }
    },


    /* ════════════════════════════════════════
       FAST QUERY METHODS
       ════════════════════════════════════════ */

    /* মাস দিয়ে instant filter — O(1) */
    getByMonth: function(key, year, month) {
        var mm = String(month).padStart(2, '0');
        var monthKey = year + '-' + mm;
        return (this._idx[key] && this._idx[key][monthKey]) || [];
    },

    /* মাসের total — O(1) */
    sumByMonth: function(key, field, year, month) {
        var items = this.getByMonth(key, year, month);
        var total = 0;
        for (var i = 0; i < items.length; i++) {
            total += Number(items[i][field]) || 0;
        }
        return total;
    },

    /* Pre-calculated total — dashboard এর জন্য */
    getTotal: function(key) {
        return this._totals[key] || 0;
    },

    /* সব month এর list (analysis page) */
    getMonthList: function(key) {
        var idx = this._idx[key] || {};
        var months = Object.keys(idx).sort().reverse();
        return months;
    },

    /* এই মাসের সব income + expense summary */
    getCurrentMonthSummary: function() {
        var now = new Date();
        var y = now.getFullYear();
        var m = now.getMonth() + 1;
        return {
            income:  this.sumByMonth('income',  'amount', y, m),
            expense: this.sumByMonth('expense', 'amount', y, m),
            savings: this.sumByMonth('savings', 'amount', y, m)
        };
    },

    /* ════════════════════════════════════════
       CRUD — আগের মতোই কিন্তু write-behind দিয়ে
       ════════════════════════════════════════ */

    add: function(key, object) {
        var data = this.get(key) || [];
        object.id        = this.generateId();
        object.createdAt = new Date().toISOString();
        if (object.amount !== undefined) object.amount = Number(object.amount) || 0;
        data.push(object);
        this.set(key, data);
        return object;
    },

    update: function(key, index, newData) {
        var data = this.get(key) || [];
        if (index >= 0 && index < data.length) {
            var updated = {};
            var keys1 = Object.keys(data[index]);
            for (var i = 0; i < keys1.length; i++) updated[keys1[i]] = data[index][keys1[i]];
            var keys2 = Object.keys(newData);
            for (var j = 0; j < keys2.length; j++) updated[keys2[j]] = newData[keys2[j]];
            updated.updatedAt = new Date().toISOString();
            data[index] = updated;
            this.set(key, data);
            return data[index];
        }
        return null;
    },

    remove: function(key, index) {
        var data = this.get(key) || [];
        if (index >= 0 && index < data.length) {
            var removed = data.splice(index, 1);
            this.set(key, data);
            return removed[0];
        }
        return null;
    },

    sum: function(key, field) {
        // Pre-calculated cache ব্যবহার করো
        if (field === 'amount' && this._totals[key + '_sum'] !== undefined) {
            return this._totals[key + '_sum'];
        }
        return (this.get(key) || []).reduce(function(t, i) { return t + (Number(i[field]) || 0); }, 0);
    },

    count: function(key) { return (this.get(key) || []).length; },

    clear: function(key) {
        delete this._cache[key];
        delete this._idx[key];
        delete this._totals[key + '_sum'];
        // Queue তে clear command
        this._writeQueue[key] = '__REMOVE__';
        var self = this;
        if (this._flushTimer) clearTimeout(this._flushTimer);
        this._flushTimer = setTimeout(function() {
            // Remove যেগুলো clear করা সেগুলো handle
            var keys = Object.keys(self._writeQueue);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                if (self._writeQueue[k] === '__REMOVE__') {
                    localStorage.removeItem(k);
                } else {
                    try { localStorage.setItem(k, JSON.stringify(self._writeQueue[k])); } catch(e) {}
                }
            }
            self._writeQueue = {};
            self._flushTimer = null;
        }, this._FLUSH_DELAY);
    },

    clearAll: function() {
        var KEEP = ['settings', 'cssConfig', 'pageConfig', 'customFonts', 'appLockPin', 'uploadedFonts'];
        var allKeys = [];
        for (var i = 0; i < localStorage.length; i++) allKeys.push(localStorage.key(i));
        for (var k = 0; k < allKeys.length; k++) {
            if (KEEP.indexOf(allKeys[k]) === -1) {
                localStorage.removeItem(allKeys[k]);
                delete this._cache[allKeys[k]];
            }
        }
        this._idx     = {};
        this._totals  = {};
        this._writeQueue = {};
        this.initStorage();
    },

    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },


    /* ════════════════════════════════════════
       TRASH SYSTEM
       ════════════════════════════════════════ */
    addToTrash: function(storeKey, item) {
        var trash = this.get('trash') || [];
        var trashItem = {};
        var ks = Object.keys(item);
        for (var i = 0; i < ks.length; i++) trashItem[ks[i]] = item[ks[i]];
        trashItem._trashKey  = storeKey;
        trashItem._trashedAt = new Date().toISOString();
        trashItem._trashId   = this.generateId();
        trash.push(trashItem);
        var cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
        var filtered = [];
        for (var j = 0; j < trash.length; j++) {
            if (new Date(trash[j]._trashedAt).getTime() > cutoff) filtered.push(trash[j]);
        }
        this.set('trash', filtered);
        return trashItem;
    },

    restoreFromTrash: function(trashId) {
        var trash = this.get('trash') || [];
        var idx = -1;
        for (var i = 0; i < trash.length; i++) { if (trash[i]._trashId === trashId) { idx = i; break; } }
        if (idx === -1) return false;
        var item = {};
        var ks = Object.keys(trash[idx]);
        for (var k = 0; k < ks.length; k++) item[ks[k]] = trash[idx][ks[k]];
        var storeKey = item._trashKey;
        delete item._trashKey; delete item._trashedAt; delete item._trashId;
        var data = this.get(storeKey) || [];
        data.unshift(item);
        this.set(storeKey, data);
        trash.splice(idx, 1);
        this.set('trash', trash);
        return storeKey;
    },

    permanentDelete: function(trashId) {
        var trash = this.get('trash') || [];
        var idx = -1;
        for (var i = 0; i < trash.length; i++) { if (trash[i]._trashId === trashId) { idx = i; break; } }
        if (idx === -1) return false;
        trash.splice(idx, 1);
        this.set('trash', trash);
        return true;
    },

    emptyTrash: function() { this.set('trash', []); },

    getTrash: function() {
        var cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
        var trash = this.get('trash') || [];
        var result = [];
        for (var i = 0; i < trash.length; i++) {
            if (new Date(trash[i]._trashedAt).getTime() > cutoff) result.push(trash[i]);
        }
        return result;
    },


    /* ════════════════════════════════════════
       INIT
       ════════════════════════════════════════ */
    initStorage: function() {
        var stores = ['income', 'expense', 'ledger', 'savings', 'trash', 'notes'];
        for (var i = 0; i < stores.length; i++) {
            if (this.get(stores[i]) === null) this.set(stores[i], []);
        }
        if (!this.get('settings')) {
            this.set('settings', {
                language: 'bn', darkMode: false, currency: '৳',
                firstRun: true, budgetWarning: true, notifications: true
            });
        }
        if (!this.get('cssConfig')) {
            this.set('cssConfig', {
                primaryColor: '#667eea', incomeColor: '#10b981', expenseColor: '#ef4444',
                denaColor: '#f59e0b', pabonaColor: '#3b82f6', savingsColor: '#E2136E',
                bgColor: '#f0f4f8', cardBgColor: '#ffffff',
                fontSize: 17, cardRadius: 20, btnRadius: 12, borderWidth: 3,
                cardBorder: true, cardShadow: true, shadowDepth: 2,
                animSpeed: 300, cardGap: 0.2, paddingSize: 0.5
            });
        }
        if (!this.get('pageConfig')) {
            var D = {
                income:  {hBg1:'#10b981',hBg2:'#059669',hAngle:135,hColor:'#ffffff',sBg1:'#10b981',sBg2:'#059669',cBg1:'#f0fdf4',cBg2:'#dcfce7',cBorder:'#10b981',bw:5,cR:14,amtC:'#059669',shd:'0 3px 10px rgba(0,0,0,.08)',fs:14,ts:19,fw:'700',fc:'#1f2937',ls:0,pad:14,gap:12},
                expense: {hBg1:'#ef4444',hBg2:'#dc2626',hAngle:135,hColor:'#ffffff',sBg1:'#ef4444',sBg2:'#dc2626',cBg1:'#fef2f2',cBg2:'#fee2e2',cBorder:'#ef4444',bw:5,cR:14,amtC:'#dc2626',shd:'0 3px 10px rgba(0,0,0,.08)',fs:14,ts:19,fw:'700',fc:'#1f2937',ls:0,pad:14,gap:12},
                ledger:  {hBg1:'#f59e0b',hBg2:'#d97706',hAngle:135,hColor:'#ffffff',sBg1:'#f59e0b',sBg2:'#d97706',cBg1:'#fff7ed',cBg2:'#ffedd5',cBorder:'#f59e0b',bw:5,cR:14,amtC:'#ea580c',shd:'0 3px 10px rgba(0,0,0,.08)',fs:14,ts:19,fw:'700',fc:'#1f2937',ls:0,pad:14,gap:12},
                savings: {hBg1:'#E2136E',hBg2:'#b5105a',hAngle:135,hColor:'#ffffff',sBg1:'#E2136E',sBg2:'#b5105a',cBg1:'#fff0f7',cBg2:'#fce4ef',cBorder:'#E2136E',bw:5,cR:14,amtC:'#E2136E',shd:'0 3px 10px rgba(0,0,0,.08)',fs:14,ts:19,fw:'700',fc:'#1f2937',ls:0,pad:14,gap:12},
                index:   {hBg1:'#3b82f6',hBg2:'#8b5cf6',hAngle:135,hColor:'#ffffff',sBg1:'#3b82f6',sBg2:'#8b5cf6',cBg1:'#f0f4ff',cBg2:'#e0e7ff',cBorder:'#3b82f6',bw:5,cR:14,amtC:'#2563eb',shd:'0 3px 10px rgba(0,0,0,.08)',fs:14,ts:19,fw:'700',fc:'#1f2937',ls:0,pad:14,gap:12}
            };
            this.set('pageConfig', D);
        }
    },

    /* ════════════════════════════════════════
       PREMIUM
       ════════════════════════════════════════ */
    isPremium: function() { return true; },
    activatePremium: function(key) { return true; },

    /* ════════════════════════════════════════
       PAGE CONFIG
       ════════════════════════════════════════ */
    getPageConfig: function(page) { return (this.get('pageConfig') || {})[page] || null; },
    setPageConfig: function(page, cfg) {
        var all = this.get('pageConfig') || {};
        all[page] = cfg; this.set('pageConfig', all);
    },
    resetPageConfig: function(page) {
        var all = this.get('pageConfig') || {};
        delete all[page]; this.set('pageConfig', all);
    },

    /* ════════════════════════════════════════
       FAVORITES
       ════════════════════════════════════════ */
    toggleFavorite: function(storeKey, index) {
        var data = this.get(storeKey) || [];
        if (index >= 0 && index < data.length) {
            data[index].favorite = !data[index].favorite;
            this.set(storeKey, data);
            return data[index].favorite;
        }
        return false;
    },
    getFavorites: function(storeKey) {
        var data = this.get(storeKey) || [];
        return data.filter(function(i) { return i.favorite; });
    },

    /* ════════════════════════════════════════
       DEBUG
       ════════════════════════════════════════ */
    cacheInfo: function() {
        var keys = Object.keys(this._cache);
        var info = 'Cache: ' + keys.length + ' keys | Totals: ';
        var tkeys = Object.keys(this._totals);
        for (var i = 0; i < tkeys.length; i++) {
            info += tkeys[i] + '=' + this._totals[tkeys[i]] + ' ';
        }
        return info;
    },

    perfReport: function() {
        return {
            cachedKeys:    Object.keys(this._cache).length,
            indexedStores: Object.keys(this._idx).length,
            pendingWrites: Object.keys(this._writeQueue).length,
            totals:        this._totals
        };
    }
};


/* ════════════════════════════════════════════════════
   STARTUP SEQUENCE
   ১. Bulk warmup (সব localStorage → RAM)
   ২. initStorage (default values)
   ৩. Month index build (fast queries)
   ৪. Total cache build (dashboard instant)
   ════════════════════════════════════════════════════ */
(function() {
    var t0 = Date.now();
    DB._bulkWarmup();   // ← সব data একসাথে RAM এ
    DB.initStorage();   // ← defaults set করো
    DB._buildIndexes(); // ← month index বানাও
    DB._buildTotals();  // ← totals pre-calculate করো
    console.log('[DB v4] Ready in ' + (Date.now() - t0) + 'ms | ' + DB.cacheInfo());
})();


/* ════════════════════════════════════════════════════
   PAGE UNLOAD GUARD
   navigate করার আগে pending writes flush করে
   কোনো data হারাবে না
   ════════════════════════════════════════════════════ */
window.addEventListener('beforeunload', function() {
    DB._flushSync();
});
// Android WebView এ beforeunload কাজ না করলে
document.addEventListener('visibilitychange', function() {
    if (document.hidden) DB._flushSync();
});
// Page hide event (hopweb/Android)
window.addEventListener('pagehide', function() {
    DB._flushSync();
});


/* ════════════════════════════════════════════════════
   DATE / TIME HELPERS
   ════════════════════════════════════════════════════ */
function nowDate() { return new Date().toISOString().split('T')[0]; }
function nowTime() {
    var n = new Date();
    return String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
}
function formatDate(d)  { return d || nowDate(); }
function formatTime(t)  { return t || nowTime(); }

function formatDateDisplay(dateStr) {
    if (!dateStr) return '??-??-??';
    var d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return String(d.getDate()).padStart(2, '0') + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getFullYear()).slice(-2);
}

function formatTimeAMPM(time24) {
    if (!time24) return '--';
    var parts = time24.split(':');
    var hr = parseInt(parts[0]);
    var mn = parts[1] || '00';
    var ap = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12 || 12;
    return hr + ':' + mn + ' ' + ap;
}

function banglaNumber(num) {
    var bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(num).split('').map(function(d) {
        return bn[d] !== undefined ? bn[d] : d;
    }).join('');
}

function formatCurrency(amount) {
    return '৳ ' + Math.round(parseFloat(amount || 0)).toLocaleString('en-BD');
}

function addToTrash(storeKey, item) { return DB.addToTrash(storeKey, item); }

function shortDate(dateStr) {
    if (!dateStr) return '--';
    var d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
}
function shortTime(time24) {
    if (!time24) return '--';
    var parts = time24.split(':');
    var hr = parseInt(parts[0]);
    var mn = parts[1] || '00';
    var ap = hr >= 12 ? 'p' : 'a';
    hr = hr % 12 || 12;
    return hr + ':' + mn + ap;
}