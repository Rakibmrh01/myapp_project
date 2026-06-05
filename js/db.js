// ================================================================
//  Daily Account — db.js  v3.3
//  Android 9 compatible — no template literals
// ================================================================

var DB = {

    get: function(key) {
        try {
            var d = localStorage.getItem(key);
            return d ? JSON.parse(d) : null;
        } catch(e) { return null; }
    },

    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch(e) { return false; }
    },

    add: function(key, object) {
        var data = this.get(key) || [];
        object.id        = this.generateId();
        object.createdAt = new Date().toISOString();
        // coerce amount to Number
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
            for (var i=0; i<keys1.length; i++) updated[keys1[i]] = data[index][keys1[i]];
            var keys2 = Object.keys(newData);
            for (var j=0; j<keys2.length; j++) updated[keys2[j]] = newData[keys2[j]];
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
        return (this.get(key) || []).reduce(function(t,i){ return t + (Number(i[field]) || 0); }, 0);
    },

    count: function(key) { return (this.get(key) || []).length; },
    clear: function(key) { localStorage.removeItem(key); },

    clearAll: function() {
        var KEEP = ['settings','cssConfig','pageConfig','customFonts','appLockPin','uploadedFonts'];
        var allKeys = [];
        for (var i=0; i<localStorage.length; i++) allKeys.push(localStorage.key(i));
        for (var k=0; k<allKeys.length; k++) {
            if (KEEP.indexOf(allKeys[k]) === -1) localStorage.removeItem(allKeys[k]);
        }
        this.initStorage();
    },

    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /* ══ TRASH ══ */
    addToTrash: function(storeKey, item) {
        var trash = this.get('trash') || [];
        var trashItem = {};
        var ks = Object.keys(item);
        for (var i=0; i<ks.length; i++) trashItem[ks[i]] = item[ks[i]];
        trashItem._trashKey  = storeKey;
        trashItem._trashedAt = new Date().toISOString();
        trashItem._trashId   = this.generateId();
        trash.push(trashItem);
        var cutoff = Date.now() - (30*24*60*60*1000);
        var filtered = [];
        for (var j=0; j<trash.length; j++) {
            if (new Date(trash[j]._trashedAt).getTime() > cutoff) filtered.push(trash[j]);
        }
        this.set('trash', filtered);
        return trashItem;
    },

    restoreFromTrash: function(trashId) {
        var trash = this.get('trash') || [];
        var idx = -1;
        for (var i=0; i<trash.length; i++) { if (trash[i]._trashId === trashId) { idx=i; break; } }
        if (idx === -1) return false;
        var item = {};
        var ks = Object.keys(trash[idx]);
        for (var k=0; k<ks.length; k++) item[ks[k]] = trash[idx][ks[k]];
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
        for (var i=0; i<trash.length; i++) { if (trash[i]._trashId === trashId) { idx=i; break; } }
        if (idx === -1) return false;
        trash.splice(idx, 1);
        this.set('trash', trash);
        return true;
    },

    emptyTrash: function() { this.set('trash', []); },

    getTrash: function() {
        var cutoff = Date.now() - (30*24*60*60*1000);
        var trash = this.get('trash') || [];
        var result = [];
        for (var i=0; i<trash.length; i++) {
            if (new Date(trash[i]._trashedAt).getTime() > cutoff) result.push(trash[i]);
        }
        return result;
    },

    /* ══ INIT ══ */
    initStorage: function() {
        var stores = ['income','expense','ledger','savings','trash','notes'];
        for (var i=0; i<stores.length; i++) {
            if (!this.get(stores[i])) this.set(stores[i], []);
        }
        if (!this.get('settings')) {
            this.set('settings', {
                language:'bn', darkMode:false, currency:'৳',
                firstRun:true, budgetWarning:true, notifications:true
            });
        }
        if (!this.get('cssConfig')) {
            this.set('cssConfig', {
                primaryColor:'#667eea', incomeColor:'#10b981', expenseColor:'#ef4444',
                denaColor:'#f59e0b', pabonaColor:'#3b82f6', savingsColor:'#E2136E',
                bgColor:'#f0f4f8', cardBgColor:'#ffffff',
                fontSize:17, cardRadius:20, btnRadius:12, borderWidth:3,
                cardBorder:true, cardShadow:true, shadowDepth:2,
                animSpeed:300, cardGap:0.2, paddingSize:0.5
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

    /* ══ PREMIUM — সকলের জন্য উন্মুক্ত ══ */
    isPremium: function() { return true; },
    activatePremium: function(key) { return true; },

    /* ══ PAGE CONFIG ══ */
    getPageConfig: function(page) { return (this.get('pageConfig') || {})[page] || null; },
    setPageConfig: function(page, cfg) {
        var all = this.get('pageConfig') || {};
        all[page] = cfg; this.set('pageConfig', all);
    },
    resetPageConfig: function(page) {
        var all = this.get('pageConfig') || {};
        delete all[page]; this.set('pageConfig', all);
    },

    /* ══ FAVORITES ══ */
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
        return data.filter(function(i){ return i.favorite; });
    }
};

/* ══ DATE / TIME HELPERS ══ */
function nowDate() { return new Date().toISOString().split('T')[0]; }
function nowTime() {
    var n = new Date();
    return String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0');
}
function formatDate(d)  { return d || nowDate(); }
function formatTime(t)  { return t || nowTime(); }

function formatDateDisplay(dateStr) {
    if (!dateStr) return '??-??-??';
    var d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return String(d.getDate()).padStart(2,'0') + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getFullYear()).slice(-2);
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
    return String(num).split('').map(function(d){ return bn[d] !== undefined ? bn[d] : d; }).join('');
}

function formatCurrency(amount) {
    return '৳ ' + Math.round(parseFloat(amount||0)).toLocaleString('en-BD');
}

/* Global trash helper */
function addToTrash(storeKey, item) { return DB.addToTrash(storeKey, item); }

DB.initStorage();
console.log('✅ DB v3.3 initialized');
/* ══ SHORT FORMAT FOR TABLE ══ */
function shortDate(dateStr) {
    if (!dateStr) return '--';
    var d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0');
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