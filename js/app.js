// ================================================================
//  Daily Account — app.js  v3.5
//  Original v3.2 base + নতুন: পরিশোধ modal + দেনা/পাওনা কাটুন
//  + confirmation সব জায়গায় + দিন আগে helper
// ================================================================

const APP = { name:'Daily Account', version:'4.0.0', developer:'জাকির আল জিহাদ' };

/* ══════════════════════════════════
   LANGUAGE SYSTEM
   ══════════════════════════════════ */
const LANG = {
    bn: {
        back:'ফিরে যান', save:'সংরক্ষণ করুন', cancel:'বাতিল',
        delete:'মুছুন', edit:'সম্পাদনা', search:'খুঁজুন', noData:'কোনো ডাটা নেই',
        income:'আয়', expense:'ব্যয়', ledger:'দেনাপাওনা', savings:'সঞ্চয়',
        date:'তারিখ', time:'সময়', note:'নোট', amount:'পরিমাণ',
        favorite_add:'প্রিয়তে যোগ হয়েছে ❤️', favorite_remove:'প্রিয় থেকে সরানো হয়েছে',
        dark_on:'🌙 ডার্ক মোড চালু', dark_off:'☀️ লাইট মোড চালু',
        premium_required:'👑 Premium প্রয়োজন', key_wrong:'❌ ভুল Key!',
        key_success:'✅ Premium সক্রিয়! 🎉', pin_saved:'✅ PIN সংরক্ষিত',
        pin_deleted:'🔓 App Lock বন্ধ', pin_wrong:'❌ ভুল PIN', pin_hint:'৪-সংখ্যার PIN দিন',
    },
    en: {
        back:'Go Back', save:'Save', cancel:'Cancel',
        delete:'Delete', edit:'Edit', search:'Search', noData:'No Data',
        income:'Income', expense:'Expense', ledger:'Ledger', savings:'Savings',
        date:'Date', time:'Time', note:'Note', amount:'Amount',
        favorite_add:'Added to Favorites ❤️', favorite_remove:'Removed from Favorites',
        dark_on:'🌙 Dark Mode On', dark_off:'☀️ Light Mode On',
        premium_required:'👑 Premium Required', key_wrong:'❌ Wrong Key!',
        key_success:'✅ Premium Activated! 🎉', pin_saved:'✅ PIN Saved',
        pin_deleted:'🔓 App Lock Off', pin_wrong:'❌ Wrong PIN', pin_hint:'Enter 4-digit PIN',
    }
};

let currentLang = 'bn';
try { currentLang = (DB.get('settings') || {}).language || 'bn'; } catch(e) {}

function t(key) { return (LANG[currentLang] || LANG.bn)[key] || key; }

function setLang(code) {
    currentLang = code;
    var s = DB.get('settings') || {};
    s.language = code;
    DB.set('settings', s);
    showToast('✅ ভাষা পরিবর্তন হয়েছে');
}

/* ══════════════════════════════════
   NAVIGATION
   ══════════════════════════════════ */
function goBack()  { window.history.back(); }
function goHome()  { window.location.href = '../index.html'; }

/* ══════════════════════════════════
   TOAST NOTIFICATION
   ══════════════════════════════════ */
function showToast(message, duration) {
    duration = duration || 3000;
    var old = document.querySelector('.__app-toast');
    if (old) { old.style.opacity='0'; old.style.transform='translateX(-50%) translateY(-12px) scale(.9)'; setTimeout(function(){ if(old.parentNode) old.remove(); },200); }
    
    var toast = document.createElement('div');
    toast.className = '__app-toast';
    
    var bg='linear-gradient(135deg,#1e293b,#0f172a)';
    var border='rgba(255,255,255,.15)'; var glow='rgba(0,0,0,.5)';
    var emoji = '';
    if      (message.includes('✅')||message.includes('🏦')||message.includes('💰')||message.includes('আদায')||message.includes('যোগ হয়')) { bg='linear-gradient(135deg,#064e3b,#065f46)'; border='rgba(16,185,129,.5)'; glow='rgba(16,185,129,.4)'; }
    else if (message.includes('❌')||message.includes('🚨')||message.includes('ভুল')) { bg='linear-gradient(135deg,#450a0a,#991b1b)'; border='rgba(239,68,68,.5)'; glow='rgba(239,68,68,.4)'; }
    else if (message.includes('🗑️')||message.includes('মুছ')||message.includes('ট্র্যাশ')) { bg='linear-gradient(135deg,#1c1917,#292524)'; border='rgba(168,85,247,.45)'; glow='rgba(168,85,247,.3)'; }
    else if (message.includes('💸')||message.includes('পরিশোধ')||message.includes('📥')) { bg='linear-gradient(135deg,#1e1a4a,#2e1065)'; border='rgba(99,102,241,.5)'; glow='rgba(99,102,241,.35)'; }
    else if (message.includes('⚠️')||message.includes('সতর্ক')||message.includes('সাবধান')) { bg='linear-gradient(135deg,#451a03,#78350f)'; border='rgba(245,158,11,.5)'; glow='rgba(245,158,11,.35)'; }
    else if (message.includes('📋')||message.includes('কপি')) { bg='linear-gradient(135deg,#0c4a6e,#075985)'; border='rgba(14,165,233,.5)'; glow='rgba(14,165,233,.35)'; }
    else if (message.includes('🔗')||message.includes('সম্পর্ক')) { bg='linear-gradient(135deg,#0f172a,#1e3a5f)'; border='rgba(59,130,246,.5)'; glow='rgba(59,130,246,.35)'; }
    
    toast.style.cssText = [
        'position:fixed',
        'bottom:32px',
        'left:50%',
        'transform:translateX(-50%) translateY(30px) scale(.9)',
        'background:'+bg,
        'color:white',
        'padding:16px 28px',
        'border-radius:20px',
        'font-weight:900',
        'font-size:1.05rem',
        'line-height:0.5',
        'box-shadow:0 16px 50px '+glow+',0 6px 20px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.12)',
        'z-index:999999',
        'white-space:nowrap',
        'max-width:calc(100vw - 32px)',
        'border:1.5px solid '+border,
        'pointer-events:none',
        'text-align:center',
        'opacity:0',
        'transition:all .35s cubic-bezier(.34,1.56,.64,1)',
        'letter-spacing:.01em',
        'backdrop-filter:blur(8px)',
        '-webkit-backdrop-filter:blur(8px)'
    ].join(';');
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0) scale(1)';
    }); });
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-8px) scale(.92)';
        setTimeout(function(){ if(toast.parentNode) toast.remove(); }, 350);
    }, duration);
}

/* ══════════════════════════════════
   KOT DIN AGE HELPER
   ══════════════════════════════════ */
function getDaysAgo(dateStr) {
    if (!dateStr) return '';
    try {
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        var days = Math.floor((new Date() - d) / 86400000);
        if (days === 0) return 'আজ';
        if (days === 1) return 'গতকাল';
        if (days < 7)   return days + ' দিন আগে';
        if (days < 30)  return Math.floor(days/7) + ' সপ্তাহ আগে';
        if (days < 365) return Math.floor(days/30) + ' মাস আগে';
        return Math.floor(days/365) + ' বছর আগে';
    } catch(e) { return ''; }
}

/* ══════════════════════════════════
   VALIDATION
   ══════════════════════════════════ */
function showAlert(msg) { alert(msg); }
function validateAmount(v)  { var n = Number(v); return !isNaN(n) && n > 0; }
function validateRequired(v){ return v && v.toString().trim() !== ''; }

/* ══════════════════════════════════
   QUICK AMOUNTS & TYPE SELECTOR
   ══════════════════════════════════ */
function setupQuickAmounts() {
    document.querySelectorAll('.quick-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var inp = document.getElementById('amount');
            if (inp) { inp.value = this.dataset.value; inp.focus(); }
        });
    });
}

function setupTypeSelector() {
    document.querySelectorAll('.type-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.type-btn').forEach(function(b){ b.classList.remove('active'); });
            this.classList.add('active');
            var inp = document.getElementById('type') || document.getElementById('source');
            if (inp) inp.value = this.dataset.type || this.dataset.source || '';
        });
    });
}

function loadDataLists() {
    fetch('../data/income_types.json').then(function(r){ return r.json(); }).then(function(data){
        var dl = document.getElementById('incomeTypes');
        if (dl && data.income_types) data.income_types.forEach(function(t2){ var o=document.createElement('option'); o.value=t2; dl.appendChild(o); });
    }).catch(function(){});
    fetch('../data/expense_categories.json').then(function(r){ return r.json(); }).then(function(data){
        var dl = document.getElementById('expenseCategories');
        if (dl && data.expense_categories) data.expense_categories.forEach(function(c){ var o=document.createElement('option'); o.value=c; dl.appendChild(o); });
    }).catch(function(){});
}

/* ══════════════════════════════════
   CSS CONFIG
   ══════════════════════════════════ */
function applyCSSConfig() {
    var config = DB.get('cssConfig');
    if (!config) return;
    var root = document.documentElement;
    root.style.setProperty('--primary-color',  config.primaryColor  || '#667eea');
    root.style.setProperty('--income-color',   config.incomeColor   || '#10b981');
    root.style.setProperty('--expense-color',  config.expenseColor  || '#ef4444');
    root.style.setProperty('--dena-color',     config.denaColor     || '#f59e0b');
    root.style.setProperty('--pabona-color',   config.pabonaColor   || '#3b82f6');
    root.style.setProperty('--savings-color',  config.savingsColor  || '#a855f7');
    root.style.setProperty('--bg-main',        config.bgColor       || '#f0f4f8');
    root.style.setProperty('--bg-card',        config.cardBgColor   || '#ffffff');
    root.style.setProperty('--base-font-size', (config.fontSize||19) + 'px');
    root.style.setProperty('--card-radius',    (config.cardRadius||20) + 'px');
    root.style.setProperty('--btn-radius',     (config.btnRadius||12) + 'px');
    root.style.setProperty('--anim-speed',     (config.animSpeed||300) + 'ms');
    root.style.setProperty('--space-md',       (config.cardGap||0.2) + 'rem');
    root.style.setProperty('--space-lg',       (config.paddingSize||0.5) + 'rem');
    var shadows = {1:'0 2px 8px rgba(0,0,0,.1)',2:'0 6px 20px rgba(0,0,0,.12)',3:'0 10px 35px rgba(0,0,0,.18)'};
    root.style.setProperty('--shadow-md', config.cardShadow ? (shadows[config.shadowDepth] || shadows[2]) : 'none');
    root.style.setProperty('--card-border-width', config.cardBorder ? (config.borderWidth||3)+'px' : '0px');
}

/* ══════════════════════════════════
   PER-PAGE CONFIG (full-page-setup লজিক ঠিক রাখা)
   ══════════════════════════════════ */
function _detectPage() {
    var path = location.pathname.toLowerCase();
    if (path.includes('income-list'))   return 'income';
    if (path.includes('income'))        return 'income';
    if (path.includes('expense-list'))  return 'expense';
    if (path.includes('expense'))       return 'expense';
    if (path.includes('ledger-list'))   return 'ledger';
    if (path.includes('ledger'))        return 'ledger';
    if (path.includes('savings-list'))  return 'savings';
    if (path.includes('savings'))       return 'savings';
    if (path.includes('analysis'))      return 'analysis';
    if (path.includes('notes'))         return 'notes';
    if (path.includes('settings'))      return 'settings';
    if (path.includes('accounting'))    return 'accounting';
    if (path.includes('trash'))         return 'trash';
    if (path.includes('calculator'))    return 'calculator';
    if (path.includes('index') || path.endsWith('/')) return 'index';
    return null;
}

/* hex color কে একটু গাঢ় করে — mini card gradient এর দ্বিতীয় রং */
function _darken(hex) {
    try {
        hex = hex.trim().replace('#','');
        var r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
        r=Math.max(0,Math.floor(r*0.82)); g=Math.max(0,Math.floor(g*0.82)); b=Math.max(0,Math.floor(b*0.82));
        return '#'+(r<16?'0':'')+r.toString(16)+(g<16?'0':'')+g.toString(16)+(b<16?'0':'')+b.toString(16);
    } catch(e){ return hex; }
}

function applyPageConfig() {
    var pg = (document.body && document.body.dataset && document.body.dataset.page) || _detectPage();
    if (!pg) return;
    var saved = DB.getPageConfig(pg);
    if (!saved) return;
    var root = document.documentElement;
    var p = '--pg-' + pg + '-';

    var hAngle = saved.hAngle || 135;
    var hBg1 = saved.hBg1 || '#667eea';
    var hBg2 = saved.hBg2 || '#764ba2';

    // ── Universal vars ──
    root.style.setProperty(p+'header-bg',    'linear-gradient('+hAngle+'deg,'+hBg1+','+hBg2+')');
    root.style.setProperty(p+'header-color', saved.hColor || '#fff');
    if (saved.bgMain)  root.style.setProperty(p+'bgMain',  saved.bgMain);
    if (saved.textC)   root.style.setProperty(p+'textC',   saved.textC);
    if (saved.fs)      root.style.setProperty(p+'fs',      saved.fs+'px');

    // ── List page specific ──
    var listPgs = ['income','expense','ledger','savings'];
    if (listPgs.indexOf(pg) > -1) {
        root.style.setProperty(p+'summary-bg',   'linear-gradient(135deg,'+(saved.sBg1||hBg1)+','+(saved.sBg2||hBg2)+')');
        root.style.setProperty(p+'card-bg',      'linear-gradient(135deg,'+(saved.cBg1||'#f0fdf4')+','+(saved.cBg2||'#dcfce7')+')');
        root.style.setProperty(p+'card-border',  saved.cBorder || hBg1);
        root.style.setProperty(p+'border-w',     (saved.bw||5)+'px');
        root.style.setProperty(p+'card-radius',  (saved.cR||14)+'px');
        root.style.setProperty(p+'card-shadow',  saved.shd || '0 3px 10px rgba(0,0,0,.08)');
        root.style.setProperty(p+'amount-color', saved.amtC || '#059669');
        root.style.setProperty(p+'amt-color',    saved.amtC || '#059669');
        root.style.setProperty(p+'font-size',    (saved.fs||14)+'px');
        root.style.setProperty(p+'title-size',   (saved.ts||19)+'px');
        root.style.setProperty(p+'font-weight',  saved.fw || '700');
        root.style.setProperty(p+'font-color',   saved.fc || '#1f2937');
        root.style.setProperty(p+'letter-spacing',(saved.ls||0)+'px');
        root.style.setProperty(p+'card-pad',     (saved.pad||14)+'px');
        root.style.setProperty(p+'card-gap',     (saved.gap||12)+'px');
    }

    // ── INDEX (Home) page ──
    if (pg === 'index') {
        // balBg — শুধু saved থাকলেই gradient বানাবে, না হলে CSS default (#10b981,#059669) থাকবে
        if (saved.balBg1 || saved.balBg2) {
            var balBg1 = saved.balBg1 || '#10b981';
            var balBg2 = saved.balBg2 || '#059669';
            root.style.setProperty(p+'balBg', 'linear-gradient(135deg,'+balBg1+','+balBg2+')');
        }
        if (saved.balTxtC) root.style.setProperty(p+'balTxtC', saved.balTxtC);
        if (saved.balFS)   root.style.setProperty(p+'balFS', saved.balFS+'px');
        // Mini card — প্রতিটা আলাদা আলাদা চেক, শুধু set হলেই apply
        if (saved.incCardC) root.style.setProperty(p+'incCardBg', 'linear-gradient(135deg,'+saved.incCardC+','+_darken(saved.incCardC)+')');
        if (saved.expCardC) root.style.setProperty(p+'expCardBg', 'linear-gradient(135deg,'+saved.expCardC+','+_darken(saved.expCardC)+')');
        if (saved.ledCardC) root.style.setProperty(p+'ledCardBg', 'linear-gradient(135deg,'+saved.ledCardC+','+_darken(saved.ledCardC)+')');
        if (saved.savCardC) root.style.setProperty(p+'savCardBg', 'linear-gradient(135deg,'+saved.savCardC+','+_darken(saved.savCardC)+')');
        if (saved.menuTxtC) root.style.setProperty(p+'menuTxtC', saved.menuTxtC);
        if (saved.menuTxtSz) root.style.setProperty(p+'menuTxtSz', saved.menuTxtSz+'px');
        if (saved.footerBg) root.style.setProperty(p+'footerBg', saved.footerBg);
        if (saved.footerBorderC) root.style.setProperty(p+'footerBorderC', saved.footerBorderC);
        // Footer style presets
        if (saved.footerStyle) {
            var _fStyles = {
                'classic':      {bg:'rgba(255,255,255,.97)',border:'#e5e7eb',radius:'0',shadow:'none',inc:'#10b981',exp:'#ef4444',led:'#3b82f6',set:'#E2136E'},
                'dark-glow':    {bg:'linear-gradient(180deg,#0f172a,#1e1b4b)',border:'rgba(99,102,241,.3)',radius:'0',shadow:'none',inc:'#34d399',exp:'#f87171',led:'#60a5fa',set:'#f472b6'},
                'floating':     {bg:'rgba(255,255,255,.95)',border:'transparent',radius:'24px 24px 0 0',shadow:'0 -4px 24px rgba(0,0,0,.12)',inc:'#10b981',exp:'#ef4444',led:'#3b82f6',set:'#E2136E'},
                'gradient-bar': {bg:'linear-gradient(135deg,#667eea,#764ba2)',border:'transparent',radius:'0',shadow:'none',inc:'#fff',exp:'#fff',led:'#fff',set:'#fff'},
                'bkash':        {bg:'linear-gradient(135deg,#E2136E,#b5105a)',border:'transparent',radius:'0',shadow:'none',inc:'#fff',exp:'#fff',led:'#fff',set:'#fff'},
            };
            var _fs = _fStyles[saved.footerStyle];
            if (_fs) {
                root.style.setProperty(p+'footerBg', _fs.bg);
                root.style.setProperty(p+'footerBorderC', _fs.border);
                root.style.setProperty(p+'footerRadius', _fs.radius);
                root.style.setProperty(p+'footerShadow', _fs.shadow);
                root.style.setProperty(p+'footerInc', _fs.inc);
                root.style.setProperty(p+'footerExp', _fs.exp);
                root.style.setProperty(p+'footerLed', _fs.led);
                root.style.setProperty(p+'footerSet', _fs.set);
            }
        }
        if (saved.footerInc) root.style.setProperty(p+'footerInc', saved.footerInc);
        if (saved.footerExp) root.style.setProperty(p+'footerExp', saved.footerExp);
        if (saved.footerLed) root.style.setProperty(p+'footerLed', saved.footerLed);
        if (saved.footerSet) root.style.setProperty(p+'footerSet', saved.footerSet);
        if (saved.footerIconSz) root.style.setProperty(p+'footerIconSz', saved.footerIconSz+'px');
        if (saved.footerTxtSz)  root.style.setProperty(p+'footerTxtSz',  saved.footerTxtSz+'px');
    }

    // ── NOTES page ──
    if (pg === 'notes') {
        if (saved.noteCardBg)     root.style.setProperty('--notes-card-bg',   saved.noteCardBg);
        if (saved.noteCardRadius) root.style.setProperty(p+'noteCardRadius',  saved.noteCardRadius+'px');
        if (saved.noteTitleC)     root.style.setProperty('--notes-title-color', saved.noteTitleC);
        if (saved.noteTitleSz)    root.style.setProperty('--notes-title-size',  saved.noteTitleSz+'px');
        if (saved.noteTextC)      root.style.setProperty('--notes-text-color',  saved.noteTextC);
        if (saved.noteTextSz)     root.style.setProperty('--notes-font-size',   saved.noteTextSz+'px');
        if (saved.noteTagBg)      root.style.setProperty(p+'noteTagBg', saved.noteTagBg);
        if (saved.noteTagC)       root.style.setProperty(p+'noteTagC',  saved.noteTagC);
        if (saved.fabBg1) root.style.setProperty(p+'fabBg1', saved.fabBg1);
        if (saved.fabSize) root.style.setProperty(p+'fabSize', saved.fabSize+'px');
    }

    // ── ANALYSIS page ──
    if (pg === 'analysis') {
        if (saved.anlCardBg)     root.style.setProperty(p+'anlCardBg',     saved.anlCardBg);
        if (saved.anlCardRadius) root.style.setProperty(p+'anlCardRadius', saved.anlCardRadius+'px');
        if (saved.adviceBg)      root.style.setProperty(p+'adviceBg',      saved.adviceBg);
        if (saved.adviceBorderC) root.style.setProperty(p+'adviceBorderC', saved.adviceBorderC);
        if (saved.adviceTxtC)    root.style.setProperty(p+'adviceTxtC',    saved.adviceTxtC);
        if (saved.adviceFontSz)  root.style.setProperty(p+'adviceFontSz',  saved.adviceFontSz+'px');
        if (saved.anlTextC)      root.style.setProperty(p+'textC', saved.anlTextC);
        // Chart colors → analysis.js এ apply করা হবে
        if (saved.chartC1) root.style.setProperty('--chart-c1', saved.chartC1);
        if (saved.chartC2) root.style.setProperty('--chart-c2', saved.chartC2);
        if (saved.chartC3) root.style.setProperty('--chart-c3', saved.chartC3);
        if (saved.chartC4) root.style.setProperty('--chart-c4', saved.chartC4);
    }

    // ── SETTINGS page ──
    if (pg === 'settings') {
        if (saved.secBg)       root.style.setProperty(p+'secBg',      saved.secBg);
        if (saved.secBorderC)  root.style.setProperty(p+'secBorderC', saved.secBorderC);
        if (saved.secRadius)   root.style.setProperty(p+'secRadius',  saved.secRadius+'px');
        if (saved.itemBorderC) root.style.setProperty(p+'itemBorderC',saved.itemBorderC);
        if (saved.iconBg)      root.style.setProperty(p+'iconBg',     saved.iconBg);
        if (saved.iconC)       root.style.setProperty(p+'iconC',      saved.iconC);
        if (saved.labelC)      root.style.setProperty(p+'labelC',     saved.labelC);
        if (saved.subLabelC)   root.style.setProperty(p+'subLabelC',  saved.subLabelC);
        if (saved.toggleOnC)   root.style.setProperty(p+'toggleOnC',  saved.toggleOnC);
    }

    // ── ACCOUNTING page ──
    if (pg === 'accounting') {
        if (saved.tblHdrBg)   root.style.setProperty(p+'tblHdrBg',   saved.tblHdrBg);
        if (saved.tblHdrTxt)  root.style.setProperty(p+'tblHdrTxt',  saved.tblHdrTxt);
        if (saved.tblBorderC) root.style.setProperty(p+'tblBorderC', saved.tblBorderC);
        if (saved.tblRow1)    root.style.setProperty(p+'tblRow1',    saved.tblRow1);
        if (saved.tblRow2)    root.style.setProperty(p+'tblRow2',    saved.tblRow2);
        if (saved.drC)        root.style.setProperty(p+'drC',        saved.drC);
        if (saved.crC)        root.style.setProperty(p+'crC',        saved.crC);
        if (saved.totBg)      root.style.setProperty(p+'totBg',      saved.totBg);
        if (saved.totBorderC) root.style.setProperty(p+'totBorderC', saved.totBorderC);
    }

    // ── TRASH page ──
    if (pg === 'trash') {
        if (saved.itemBg)         root.style.setProperty(p+'itemBg',         saved.itemBg);
        if (saved.itemBorderC)    root.style.setProperty(p+'itemBorderC',    saved.itemBorderC);
        if (saved.itemRadius)     root.style.setProperty(p+'itemRadius',     saved.itemRadius+'px');
        if (saved.restoreBtnBg)   root.style.setProperty(p+'restoreBtnBg',  saved.restoreBtnBg);
        if (saved.deleteBtnBg)    root.style.setProperty(p+'deleteBtnBg',   saved.deleteBtnBg);
        if (saved.filterBtnBg)    root.style.setProperty(p+'filterBtnBg',   saved.filterBtnBg);
        if (saved.filterActiveBg) root.style.setProperty(p+'filterActiveBg',saved.filterActiveBg);
    }

    // ── CALCULATOR page ──
    if (pg === 'calculator') {
        if (saved.dispBg)      root.style.setProperty(p+'dispBg',      saved.dispBg);
        if (saved.dispTxtC)    root.style.setProperty(p+'dispTxtC',    saved.dispTxtC);
        if (saved.dispExprC)   root.style.setProperty(p+'dispExprC',   saved.dispExprC);
        if (saved.numBtnBg)    root.style.setProperty(p+'numBtnBg',    saved.numBtnBg);
        if (saved.numBtnTxt)   root.style.setProperty(p+'numBtnTxt',   saved.numBtnTxt);
        if (saved.opBtnBg)     root.style.setProperty(p+'opBtnBg',     saved.opBtnBg);
        if (saved.opBtnTxt)    root.style.setProperty(p+'opBtnTxt',    saved.opBtnTxt);
        if (saved.eqBtnBg)     root.style.setProperty(p+'eqBtnBg',     saved.eqBtnBg);
        if (saved.clearBtnBg)  root.style.setProperty(p+'clearBtnBg',  saved.clearBtnBg);
        if (saved.btnRadius)   root.style.setProperty(p+'btnRadius',   saved.btnRadius+'px');
        if (saved.btnFontSz)   root.style.setProperty(p+'btnFontSz',   saved.btnFontSz+'px');
    }

    // ── Global body style ──
    if (saved.bgMain) document.body.style.background = saved.bgMain;
    if (saved.textC)  document.body.style.color = saved.textC;
    if (saved.fs)     document.body.style.fontSize = saved.fs+'px';
}


function applyAllPageConfigs() {
    ['income','expense','ledger','savings','index','settings'].forEach(function(pg) {
        var saved = DB.getPageConfig(pg);
        if (!saved) return;
        var root = document.documentElement;
        var p = '--pg-'+pg+'-';
        root.style.setProperty(p+'header-bg',    'linear-gradient('+(saved.hAngle||135)+'deg,'+(saved.hBg1||'#667eea')+','+(saved.hBg2||'#764ba2')+')');
        root.style.setProperty(p+'card-bg',      'linear-gradient(135deg,'+(saved.cBg1||'#f0f4ff')+','+(saved.cBg2||'#e0e7ff')+')');
        root.style.setProperty(p+'card-border',  saved.cBorder||'#667eea');
        root.style.setProperty(p+'amount-color', saved.amtC||saved.amtColor||'#059669');
    });
}

/* ══════════════════════════════════
   DARK MODE
   ══════════════════════════════════ */
function applyDarkMode() {
    var s = DB.get('settings') || {};
    document.body.classList.toggle('dark-mode', !!s.darkMode);
}

function toggleDarkMode() {
    var s = DB.get('settings') || {};
    s.darkMode = !s.darkMode;
    DB.set('settings', s);
    applyDarkMode();
    showToast(s.darkMode ? t('dark_on') : t('dark_off'));
    var toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.checked = !!s.darkMode;
}

/* ══════════════════════════════════
   CUSTOM FONTS
   ══════════════════════════════════ */
function applyCustomFonts() {
    var cfg = DB.get('customFonts') || {};
    var uploaded = {};
    try { uploaded = JSON.parse(localStorage.getItem('uploadedFonts') || '{}'); } catch(e) {}

    // First: inject @font-face for uploaded fonts
    ['bangla','english','number'].forEach(function(type) {
        var name = cfg[type];
        if (!name) return;
        if (uploaded[type] && uploaded[type].b64) {
            var fontId = '__uf_'+type;
            var ex = document.getElementById(fontId);
            if (ex) ex.remove();
            var st = document.createElement('style');
            st.id = fontId;
            var mime = uploaded[type].mime || 'truetype';
            var fmt = mime==='woff2'?'woff2':mime==='woff'?'woff':mime==='otf'?'opentype':'truetype';
            st.textContent = "@font-face{font-family:'"+name+"';src:url('data:font/"+mime+";base64,"+uploaded[type].b64+"') format('"+fmt+"');font-weight:100 900;font-style:normal;}";
            document.head.appendChild(st);
        } else if (name) {
            var linkId = '__gf_'+name.replace(/\s+/g,'_');
            if (!document.getElementById(linkId)) {
                var link = document.createElement('link');
                link.id = linkId; link.rel = 'stylesheet';
                link.href = 'https://fonts.googleapis.com/css2?family='+encodeURIComponent(name)+':wght@400;500;600;700;800;900&display=swap';
                document.head.appendChild(link);
            }
        }
    });

    // Then: set CSS variables on :root
    var root = document.documentElement;
    var banglaName = cfg.bangla;
    var englishName = cfg.english;
    var numberName = cfg.number;

    if (banglaName) {
        root.style.setProperty('--font-bangla', "'"+banglaName+"', 'Hind Siliguri', sans-serif");
    }
    if (englishName) {
        root.style.setProperty('--font-english', "'"+englishName+"', 'Segoe UI', sans-serif");
    }
    if (numberName) {
        root.style.setProperty('--font-number', "'"+numberName+"', 'Segoe UI', monospace");
    }

    // Critical: inject a <style> that forces font on ALL elements
    // This overrides any hardcoded font-family in CSS files
    var overrideId = '__fontOverride';
    var old = document.getElementById(overrideId);
    if (old) old.remove();

    var rules = '';
    if (banglaName) {
        rules += 'body, p, h1, h2, h3, h4, h5, h6, span, div, label, button, a, li, td, th, .card-meta, .card-header h3, .setting-info h4 { font-family: \''+banglaName+'\', \'Hind Siliguri\', sans-serif !important; }\n';
    }
    if (numberName) {
        rules += '.amount, .balance-amount, .card-amount, .summary-value, .amount-cell, .stat-value, .month-value, .balance-amount { font-family: \''+numberName+'\', \'Segoe UI\', monospace !important; }\n';
    }
    if (englishName) {
        rules += 'input, textarea, select, code, pre, .monospace { font-family: \''+englishName+'\', \'Segoe UI\', sans-serif !important; }\n';
    }

    if (rules) {
        var st2 = document.createElement('style');
        st2.id = overrideId;
        st2.textContent = rules;
        document.head.appendChild(st2);
    }
}

/* ══════════════════════════════════
   PREMIUM
   ══════════════════════════════════ */
function activateKey() {
    var input = document.getElementById('__keyInput');
    if (!input) return;
    var ok = DB.activatePremium(input.value.trim());
    if (ok) {
        input.value = '';
        showToast(t('key_success'));
        setTimeout(function(){ if (typeof _updatePremiumUI==='function') _updatePremiumUI(); }, 300);
    } else {
        showToast(t('key_wrong'));
    }
}

function showPremiumWall(featureName) {
    var existing = document.getElementById('__premWall');
    if (existing) existing.remove();
    var wall = document.createElement('div');
    wall.id = '__premWall';
    wall.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px';
    wall.innerHTML = '<div style="background:linear-gradient(160deg,#0d0b1e,#1a1040);border-radius:22px;padding:28px 22px;max-width:320px;width:100%;border:2px solid rgba(168,85,247,.4);box-shadow:0 30px 80px rgba(0,0,0,.7);text-align:center">'
        + '<div style="font-size:3rem;margin-bottom:10px">👑</div>'
        + '<h3 style="color:#c084fc;font-size:1.15rem;font-weight:900;margin-bottom:8px">Premium প্রয়োজন</h3>'
        + (featureName ? '<p style="color:#9ca3af;font-size:.84rem;margin-bottom:16px;font-weight:600">"'+featureName+'" ব্যবহার করতে Key দিন</p>' : '')
        + '<div style="display:flex;gap:8px;margin-bottom:12px">'
        + '<input id="__wallKey" type="text" placeholder="🔑 Key দিন…" style="flex:1;padding:11px 12px;border:2px solid rgba(168,85,247,.38);border-radius:12px;background:rgba(255,255,255,.07);color:white;font-size:.9rem;font-weight:700;outline:none">'
        + '<button onclick="_wallActivate()" style="padding:11px 14px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:white;border:none;border-radius:12px;font-size:.88rem;font-weight:900;cursor:pointer">চালু</button>'
        + '</div>'
        + '<div style="display:flex;gap:8px;margin-bottom:14px">'
        + '<a href="tel:+8801737930168" style="flex:1;padding:11px;background:linear-gradient(135deg,#10b981,#059669);color:white;border-radius:12px;font-size:.85rem;font-weight:800;text-decoration:none;display:flex;align-items:center;justify-content:center">📞 কল</a>'
        + '<a href="https://wa.me/8801737930168" target="_blank" style="flex:1;padding:11px;background:linear-gradient(135deg,#25d366,#128c7e);color:white;border-radius:12px;font-size:.85rem;font-weight:800;text-decoration:none;display:flex;align-items:center;justify-content:center">💬 WA</a>'
        + '</div>'
        + '<button onclick="document.getElementById(\'__premWall\').remove()" style="width:100%;padding:11px;background:rgba(255,255,255,.08);color:#9ca3af;border:1px solid rgba(255,255,255,.12);border-radius:12px;font-size:.88rem;font-weight:700;cursor:pointer">বাতিল</button>'
        + '</div>';
    document.body.appendChild(wall);
    var wk = document.getElementById('__wallKey');
    if (wk) wk.focus();
}

function _wallActivate() {
    var wk = document.getElementById('__wallKey');
    var ok = DB.activatePremium((wk ? wk.value : '').trim());
    if (ok) {
        var w = document.getElementById('__premWall');
        if (w) w.remove();
        showToast(t('key_success'));
        setTimeout(function(){ location.reload(); }, 800);
    } else {
        showToast(t('key_wrong'));
    }
}

/* ══════════════════════════════════
   APP LOCK
   ══════════════════════════════════ */
function initAppLock() {
    var pin = localStorage.getItem('appLockPin');
    if (!pin) return;
    if (sessionStorage.getItem('__unlocked') === '1') return;
    _showLockScreen(pin);
}

function _showLockScreen(correctPin) {
    if (!document.getElementById('__lockStyles')) {
        var st = document.createElement('style');
        st.id = '__lockStyles';
        st.textContent = '@keyframes __lockPulse{0%,100%{box-shadow:0 0 30px rgba(168,85,247,.4)}50%{box-shadow:0 0 60px rgba(168,85,247,.7)}}'
            + '@keyframes __pinShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-9px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}'
            + '.__nbtn:active{background:rgba(168,85,247,.4)!important;transform:scale(.88)!important;}';
        document.head.appendChild(st);
    }
    var screen = document.createElement('div');
    screen.id = '__lockScreen';
    screen.style.cssText = 'position:fixed;inset:0;z-index:999999;overflow:hidden;background:linear-gradient(160deg,#0d0b1e,#1a1040,#0a1628);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:24px';
    var enteredPin = '';
    var numKeys = [1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(function(k) {
        if (k === '') return '<div></div>';
        return '<button onclick="__pinKey(\''+k+'\')" class="__nbtn" style="padding:17px;border-radius:18px;font-size:1.3rem;font-weight:900;background:rgba(255,255,255,.07);color:white;border:1px solid rgba(168,85,247,.2);cursor:pointer;transition:all .15s;-webkit-tap-highlight-color:transparent">'+k+'</button>';
    }).join('');
    screen.innerHTML = '<div style="text-align:center;position:relative;z-index:1">'
        + '<div style="width:90px;height:90px;border-radius:50%;margin:0 auto 14px;background:linear-gradient(135deg,rgba(168,85,247,.22),rgba(124,58,237,.22));border:2px solid rgba(168,85,247,.45);display:flex;align-items:center;justify-content:center;font-size:2.5rem;animation:__lockPulse 2.5s ease-in-out infinite">🔐</div>'
        + '<h2 style="background:linear-gradient(135deg,#c084fc,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:1.4rem;font-weight:900;margin-bottom:4px">Daily Account</h2>'
        + '<span style="color:#9ca3af;font-size:.84rem;font-weight:600">PIN দিয়ে প্রবেশ করুন</span>'
        + '</div>'
        + '<div style="display:flex;gap:14px;position:relative;z-index:1" id="__pinDots">'
        + [0,1,2,3].map(function(i){ return '<div id="__dot'+i+'" style="width:18px;height:18px;border-radius:50%;border:2px solid rgba(168,85,247,.5);background:transparent;transition:all .2s"></div>'; }).join('')
        + '</div>'
        + '<p id="__pinErrLock" style="color:#f87171;font-size:.82rem;font-weight:700;min-height:1.2em;opacity:0;transition:opacity .3s;position:relative;z-index:1"></p>'
        + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:268px;width:100%;position:relative;z-index:1">' + numKeys + '</div>';
    document.body.appendChild(screen);
    window.__pinKey = function(k) {
        if (k === '⌫') enteredPin = enteredPin.slice(0,-1);
        else if (enteredPin.length < 4) enteredPin += k;
        for (var i=0; i<4; i++) {
            var d = document.getElementById('__dot'+i);
            if (!d) continue;
            if (i < enteredPin.length) { d.style.background='linear-gradient(135deg,#c084fc,#a855f7)'; d.style.borderColor='#c084fc'; d.style.boxShadow='0 0 12px rgba(168,85,247,.7)'; }
            else { d.style.background='transparent'; d.style.borderColor='rgba(168,85,247,.5)'; d.style.boxShadow='none'; }
        }
        if (enteredPin.length === 4) {
            if (enteredPin === correctPin) {
                sessionStorage.setItem('__unlocked','1');
                screen.style.transition='opacity .35s'; screen.style.opacity='0';
                setTimeout(function(){ if(screen.parentNode) screen.remove(); }, 350);
            } else {
                var errEl = document.getElementById('__pinErrLock');
                if (errEl) { errEl.textContent='❌ ভুল PIN!'; errEl.style.opacity='1'; }
                var dotsRow = document.getElementById('__pinDots');
                if (dotsRow) { dotsRow.style.animation='__pinShake .42s ease'; setTimeout(function(){ if(dotsRow) dotsRow.style.animation=''; },450); }
                setTimeout(function() {
                    enteredPin='';
                    for (var i=0; i<4; i++) { var d=document.getElementById('__dot'+i); if(d){d.style.background='transparent';d.style.borderColor='rgba(168,85,247,.5)';d.style.boxShadow='none';} }
                    if (errEl) setTimeout(function(){ errEl.style.opacity='0'; },1200);
                }, 420);
            }
        }
    };
}

/* ══════════════════════════════════
   SCROLL ANIMATION
   ══════════════════════════════════ */
function initScrollAnim() {
    var cards = document.querySelectorAll('.list-card');
    if (!cards.length) return;
    cards.forEach(function(c, i) {
        c.style.opacity = '0';
        c.style.transform = 'translateY(16px)';
        c.style.transition = 'opacity .3s ease, transform .3s ease';
        setTimeout(function(){ c.style.opacity='1'; c.style.transform='none'; }, i*40+30);
    });
}

/* ══════════════════════════════════
   MORE MENU — নতুন options সহ
   ══════════════════════════════════ */


/* ══════════════════════════════════
   BEAUTIFUL CONFIRM DIALOG
   ══════════════════════════════════ */
function _confirm(opts, onYes, onNo) {
    // opts: {title, msg, icon, yesText, noText, type}
    // type: 'danger'|'warning'|'success'|'info'
    var ex = document.getElementById('__cfModal'); if(ex) ex.remove();
    
    var types = {
        danger:  {bg:'linear-gradient(160deg,#450a0a,#7f1d1d)', border:'rgba(239,68,68,.5)',  btnBg:'linear-gradient(135deg,#ef4444,#dc2626)', icon:'🗑️'},
        warning: {bg:'linear-gradient(160deg,#451a03,#78350f)', border:'rgba(245,158,11,.5)', btnBg:'linear-gradient(135deg,#f59e0b,#d97706)', icon:'⚠️'},
        success: {bg:'linear-gradient(160deg,#052e16,#065f46)', border:'rgba(16,185,129,.5)', btnBg:'linear-gradient(135deg,#10b981,#059669)', icon:'✅'},
        info:    {bg:'linear-gradient(160deg,#1e1b4b,#312e81)', border:'rgba(99,102,241,.5)', btnBg:'linear-gradient(135deg,#6366f1,#4f46e5)', icon:'💡'},
        pay:     {bg:'linear-gradient(160deg,#0c1a2e,#1e3a5f)', border:'rgba(59,130,246,.5)', btnBg:'linear-gradient(135deg,#3b82f6,#2563eb)', icon:'💸'},
    };
    var t = types[opts.type||'info'];
    var icon = opts.icon || t.icon;
    var yesText = opts.yesText || '✅ হ্যাঁ';
    var noText  = opts.noText  || '❌ বাতিল';

    var modal = document.createElement('div');
    modal.id = '__cfModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:999998;background:rgba(0,0,0,.85);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:20px';
    
    var card = document.createElement('div');
    card.style.cssText = 'background:'+t.bg+';border:2px solid '+t.border+';border-radius:24px;padding:28px 22px;max-width:320px;width:100%;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.6);transform:scale(.85);transition:transform .3s cubic-bezier(.34,1.56,.64,1)';
    
    card.innerHTML = '<div style="font-size:3rem;margin-bottom:12px">'+icon+'</div>'
        +'<h3 style="color:white;font-size:1.1rem;font-weight:900;margin-bottom:8px">'+(opts.title||'নিশ্চিত করুন')+'</h3>'
        +'<p style="color:rgba(255,255,255,.65);font-size:.86rem;font-weight:600;margin-bottom:22px;line-height:1.5">'+(opts.msg||'')+'</p>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
        +'<button id="__cfNo"  style="padding:13px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);border:1.5px solid rgba(255,255,255,.15);border-radius:13px;font-size:.9rem;font-weight:800;cursor:pointer;font-family:inherit">'+noText+'</button>'
        +'<button id="__cfYes" style="padding:13px;background:'+t.btnBg+';color:white;border:none;border-radius:13px;font-size:.9rem;font-weight:900;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.3);font-family:inherit">'+yesText+'</button>'
        +'</div>';

    modal.appendChild(card);
    document.body.appendChild(modal);
    
    // animate in
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ card.style.transform='scale(1)'; }); });
    
    function close() {
        card.style.transform = 'scale(.85)';
        card.style.opacity = '0';
        setTimeout(function(){ if(modal.parentNode) modal.remove(); }, 250);
    }
    
    document.getElementById('__cfYes').onclick = function(){ close(); if(onYes) onYes(); };
    document.getElementById('__cfNo').onclick  = function(){ close(); if(onNo)  onNo(); };
    modal.onclick = function(e){ if(e.target===modal){ close(); if(onNo) onNo(); } };
}

/* ══════════════════════════════════
   CACHED MORE MENU - reliable item access
   ══════════════════════════════════ */
function _openMoreMenuCached(btn, storeKey, cacheKey, cardType) {
    // cache থেকে item নাও
    var item = null;
    if (typeof _itemCache !== 'undefined' && _itemCache[cacheKey]) {
        item = _itemCache[cacheKey];
    }
    if (!item) {
        showToast('❌ আইটেম পাওয়া যায়নি');
        return;
    }
    // DB থেকে real index খোঁজো
    var allData = DB.get(storeKey) || [];
    var idx = -1;
    if (item.id) {
        idx = allData.findIndex(function(x){ return x.id === item.id; });
    }
    if (idx === -1) {
        // id দিয়ে না পেলে data match করো
        for (var i = 0; i < allData.length; i++) {
            if (JSON.stringify(allData[i]) === JSON.stringify(item)) {
                idx = i; break;
            }
        }
    }
    if (idx === -1) {
        // শেষ চেষ্টা - DB এ push করা item নাও
        allData.push(item);
        idx = allData.length - 1;
    }
    openMoreMenu(btn, storeKey, idx, cardType);
}

function openMoreMenu(btn, storeKey, index, cardType) {
    var ex1 = document.getElementById('__moreOverlay');
    var ex2 = document.getElementById('__moreSheet');
    if (ex1) ex1.remove();
    if (ex2) ex2.remove();

    var allData = DB.get(storeKey) || [];
    var item = null;
    if (index >= 0 && index < allData.length) {
        item = allData[index];
    }
    // id দিয়েও খোঁজার চেষ্টা
    if (!item && index >= 0) {
        item = allData[index] || null;
    }
    if (!item) { showToast('❌ আইটেম পাওয়া যায়নি'); return; }

    var isFav     = !!item.favorite;
    var isPending = !!item.pending;
    var suspLabel = isPending ? '✅ স্থগিত তুলে নিন'
        : (cardType==='income' ? '⏸ আয় হয়েছে, আসেনি' : '⏸ ব্যয়/দেনা স্থগিত');

    var typeColors = {income:'#10b981',expense:'#ef4444',ledger:'#f59e0b',savings:'#a855f7',dena:'#f59e0b',pabona:'#3b82f6'};
    var accent = typeColors[cardType] || '#667eea';
    var typeIcons = {income:'💰',expense:'💸',savings:'🏦',ledger:'📋',dena:'📋',pabona:'📋'};
    var typeNames = {income:'আয়',expense:'ব্যয়',savings:'সঞ্চয়',ledger:'লেনদেন',dena:'দেনা',pabona:'পাওনা'};

    var overlay = document.createElement('div');
    overlay.id = '__moreOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.55);backdrop-filter:blur(5px);-webkit-tap-highlight-color:transparent';

    var sheet = document.createElement('div');
    sheet.id = '__moreSheet';
    sheet.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99991;background:linear-gradient(180deg,#0f172a,#1e1b4b);border-radius:24px 24px 0 0;padding:18px 14px 40px;box-shadow:0 -8px 40px rgba(0,0,0,.5);border-top:1.5px solid rgba(139,92,246,.25);max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch';

    var title = item.source || item.category || item.person || item.name || item.method || '--';
    var daysAgo = getDaysAgo(item.date);

    // নতুন buttons
    // income: সঞ্চয় + দেনা পরিশোধ (পাওনা না)
    // expense: সঞ্চয় নেই
    var savRow        = (cardType==='income') ? _mmBtn('#10b981','#059669','🏦 সঞ্চয়ে যোগ','__mmSave()') : '';
    var incDenaPayRow = (cardType==='income') ? _mmBtn('#f59e0b','#d97706','💸 দেনা পরিশোধ','__mmDenaPay2()') : '';
    var incLedPayRow  = (cardType==='income') ? _mmBtn('#6366f1','#4f46e5','📒 লেজার পরিশোধ','__mmIncPay()') : '';
    // dena: পরিশোধ modal + ব্যালেন্স বাড়ান
    var denaPayRow    = (cardType==='dena' && !item.paid) ? _mmBtn('#ef4444','#dc2626','💸 পরিশোধ করুন','__mmDenaPay()') : '';
    var denaBalRow    = (cardType==='dena' && !item.paid) ? _mmBtn('#f97316','#ea580c','📈 ব্যালেন্স বাড়ান','__mmDenaBal()') : '';
    // pabona: আদায় modal + ব্যালেন্স কাটুন
    var pabonaCollRow = (cardType==='pabona' && !item.paid) ? _mmBtn('#10b981','#059669','💰 আদায় করুন','__mmPabonaCollect()') : '';
    var pabonaCutRow  = (cardType==='pabona' && !item.paid&&!item.deducted) ? _mmBtn('#3b82f6','#2563eb','📉 ব্যালেন্স কাটুন','__mmPabonaCut()') : '';
    var recoverRow    = _mmBtn('#8b5cf6','#7c3aed','↩ পুনরুদ্ধার','__mmRecover()');
    var relationRow   = _mmBtn('#0ea5e9','#0284c7','🔗 সম্পর্ক যোগ','__mmRelation()');
    var viewRelRow    = (item.relations&&item.relations.length) ? _mmBtn('#0284c7','#0369a1','🔗 সম্পর্ক দেখুন','__mmViewRelations()') : '';
    var voiceRow      = _mmBtn('#7c3aed','#6d28d9','🎙️ ভয়েস রেকর্ড','__mmVoice()');
    var viewVoiceRow  = item.voice ? _mmBtn('#6d28d9','#5b21b6','▶ ভয়েস শুনুন','__mmPlayVoice()') : '';

    sheet.innerHTML = '<div style="width:40px;height:4px;background:rgba(255,255,255,.18);border-radius:4px;margin:0 auto 16px"></div>'
        + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;background:'+accent+'12;border:1.5px solid '+accent+'30;border-radius:16px;padding:13px">'
        + '<div style="width:46px;height:46px;border-radius:14px;background:'+accent+'22;border:1.5px solid '+accent+'50;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">'+typeIcons[cardType]+'</div>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="color:'+accent+';font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.5px">'+typeNames[cardType]+(daysAgo?' · '+daysAgo:'')+'</div>'
        + '<div style="color:white;font-size:.95rem;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+title+'</div>'
        + '<div style="color:'+accent+';font-size:1.05rem;font-weight:900">৳ '+Math.round(item.amount||0)+'</div>'
        + (item.note?'<div style="color:rgba(255,255,255,.4);font-size:.7rem;margin-top:2px">📝 '+item.note.slice(0,30)+'</div>':'')
        + '</div></div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
        + _mmBtn('#6366f1','#4f46e5','✏️ সম্পাদনা','__mmEdit()')
        + _mmBtn('#ec4899','#db2777',(isFav?'💔 প্রিয় সরান':'❤️ প্রিয়তে যোগ'),'__mmFav()')
        + _mmBtn('#3b82f6','#2563eb','🔍 বিস্তারিত','__mmDetail()')
        + _mmBtn('#8b5cf6','#7c3aed','📸 স্ক্রিনশট','__mmShot()')
        + savRow
        + incDenaPayRow
        + incLedPayRow
        + denaPayRow
        + denaBalRow
        + pabonaCollRow
        + pabonaCutRow
        + relationRow
        + _mmBtn(isPending?'#10b981':'#f59e0b',isPending?'#059669':'#d97706',suspLabel,'__mmSusp()')
        + recoverRow
        + _mmBtn('#ef4444','#dc2626','🗑️ ট্র্যাশে পাঠান','__mmTrash()')
        + _mmBtn('#0ea5e9','#0284c7','📷 ফটো যোগ/দেখুন','__mmPhoto()')
        + _mmBtn('#10b981','#059669','✍️ হাতের লেখা','__mmDraw()')
        + voiceRow + viewVoiceRow + viewRelRow
        + '</div>'
        + '<button onclick="__mmClose()" style="width:100%;padding:13px;background:rgba(255,255,255,.05);color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.1);border-radius:13px;font-size:.88rem;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent">বাতিল</button>';

    document.body.appendChild(overlay);
    document.body.appendChild(sheet);
    sheet.style.transform = 'translateY(100%)';
    sheet.style.transition = 'transform .28s cubic-bezier(.34,1.1,.64,1)';
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ sheet.style.transform='translateY(0)'; }); });

    function closeMenu() {
        sheet.style.transform = 'translateY(100%)';
        setTimeout(function(){ if(overlay.parentNode)overlay.remove(); if(sheet.parentNode)sheet.remove(); }, 250);
    }

    overlay.onclick = closeMenu;
    window.__mmClose   = closeMenu;
    window.__mmEdit    = function(){ closeMenu(); setTimeout(function(){ if(typeof openEditModal==='function') openEditModal(index); },150); };
    window.__mmFav     = function(){ closeMenu(); setTimeout(function(){ toggleFav(storeKey,index); },100); };
    window.__mmDetail  = function(){ closeMenu(); setTimeout(function(){ openDetailDrawer(storeKey,index,cardType); },150); };
    window.__mmShot    = function(){ closeMenu(); setTimeout(function(){ openScreenshot(storeKey,index,cardType); },150); };
    window.__mmSave    = function(){ closeMenu(); setTimeout(function(){ _addToSavings(storeKey,index); },150); };
    window.__mmSusp    = function(){ closeMenu(); setTimeout(function(){ toggleSuspend(storeKey,index); },100); };
    window.__mmDenaPay = function(){ closeMenu(); setTimeout(function(){ _payDenaFromBalance(storeKey,index,item); },150); };
    window.__mmDenaPay2= function(){ closeMenu(); setTimeout(function(){ _payUnpaidDenaFromIncome(item); },150); };
    window.__mmPabonaCollect=function(){ closeMenu(); setTimeout(function(){ _collectPabonaToBalance(storeKey,index,item); },150); };
    window.__mmPabonaCut=function(){ closeMenu(); setTimeout(function(){ _deductPabonaFromBalance(storeKey,index,item); },150); };
    window.__mmDenaBal = function(){ closeMenu(); setTimeout(function(){ _addDenaToBalance(storeKey,index,item); },150); };
    window.__mmIncPay  = function(){ closeMenu(); setTimeout(function(){ _payLedgerFromIncome(storeKey,index,item); },150); };
    window.__mmRelation= function(){ closeMenu(); setTimeout(function(){ _openRelationSelector(storeKey,index,item,cardType); },150); };
    window.__mmPhoto   = function(){ closeMenu(); setTimeout(function(){ _openPhotoOptions(storeKey,index,item); },150); };
    window.__mmDraw    = function(){ closeMenu(); setTimeout(function(){ _openDrawingPad(storeKey,index,item); },150); };
    window.__mmVoice   = function(){ closeMenu(); setTimeout(function(){ _openVoiceRecord(storeKey,index,item); },150); };
    window.__mmPlayVoice = function(){ closeMenu(); setTimeout(function(){ if(item.voice){var a=new Audio(item.voice);a.play();showToast('🎙️ চলছে...');}else{showToast('ভয়েস নেই');} },150); };
    window.__mmViewRelations = function(){ closeMenu(); setTimeout(function(){ _showRelations(item.id,storeKey); },150); };
    window.__mmRecover = function(){
        closeMenu();
        setTimeout(function(){
            showToast('💡 পুনরুদ্ধারের জন্য Trash Manager খুলুন');
            setTimeout(function(){ window.location.href='trash-manager.html'; },800);
        },150);
    };
    window.__mmTrash   = function(){
        closeMenu();
        setTimeout(function(){
            _confirm({title:'ট্র্যাশে পাঠান',msg:'Trash Manager থেকে পুনরুদ্ধার করতে পারবেন।',icon:'🗑️',type:'danger',yesText:'🗑️ পাঠান',noText:'বাতিল'}, function(){
            if (typeof addToTrash==='function') addToTrash(storeKey, item);
            var data = DB.get(storeKey) || [];
            var ri = data.findIndex(function(x){ return x.id&&x.id===item.id; });
            if (ri===-1) ri = data.findIndex(function(x){ return JSON.stringify(x)===JSON.stringify(item); });
            if (ri !== -1) { data.splice(ri,1); DB.set(storeKey,data); }
            showToast('🗑️ ট্র্যাশে গেছে ↩ পুনরুদ্ধার করা যাবে');
            _refreshListViews();
        }); // end _confirm
        }, 280);
    };
}

function _mmBtn(c1,c2,label,fn) {
    return '<button onclick="'+fn+'" style="width:100%;padding:12px 8px;background:linear-gradient(135deg,'+c1+'22,'+c2+'15);color:white;border:1.5px solid '+c1+'45;border-radius:13px;font-size:.83rem;font-weight:800;cursor:pointer;text-align:center;-webkit-tap-highlight-color:transparent;word-break:keep-all;box-shadow:0 2px 8px '+c1+'18">'+label+'</button>';
}

/* ══════════════════════════════════
   দেনা পরিশোধ (ব্যালেন্স থেকে)
   ══════════════════════════════════ */
function _payDenaFromBalance(storeKey, index, item) {
    var amt = parseFloat(item.amount||0);
    var person = item.person||item.name||'--';
    var existing = document.getElementById('__denaPayModal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = '__denaPayModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML = '<div style="background:linear-gradient(160deg,#1a0000,#3b0000);border-radius:22px;padding:26px 20px;max-width:320px;width:100%;border:2px solid rgba(239,68,68,.4);text-align:center">'
        + '<div style="font-size:2.5rem;margin-bottom:8px">💸</div>'
        + '<h3 style="color:#fca5a5;font-size:1.05rem;font-weight:900;margin-bottom:4px">দেনা পরিশোধ</h3>'
        + '<p style="color:#9ca3af;font-size:.82rem;margin-bottom:4px">ব্যক্তি: <strong style="color:white">'+person+'</strong></p>'
        + '<p style="color:#9ca3af;font-size:.82rem;margin-bottom:14px">মোট দেনা: <strong style="color:#ef4444">৳ '+Math.round(amt)+'</strong></p>'
        + '<input type="number" id="__dpAmt" value="'+amt+'" min="1" max="'+amt+'" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.07);border:1.5px solid rgba(239,68,68,.4);border-radius:12px;color:white;font-size:1rem;font-weight:800;text-align:center;outline:none;margin-bottom:10px">'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
        + '<button onclick="__dpFull()" style="padding:12px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:11px;font-size:.85rem;font-weight:800;cursor:pointer">💯 পুরো পরিশোধ</button>'
        + '<button onclick="__dpPartial()" style="padding:12px;background:rgba(239,68,68,.2);color:#fca5a5;border:1px solid rgba(239,68,68,.4);border-radius:11px;font-size:.85rem;font-weight:800;cursor:pointer">✂️ আংশিক</button>'
        + '</div>'
        + '<button onclick="__closeDenaPay()" style="width:100%;padding:10px;background:rgba(255,255,255,.07);color:#9ca3af;border:1px solid rgba(255,255,255,.1);border-radius:12px;font-size:.85rem;cursor:pointer">বাতিল</button>'
        + '</div>';
    document.body.appendChild(modal);

    window.__closeDenaPay = function(){ var m=document.getElementById('__denaPayModal'); if(m) m.remove(); };

    function doPayment(payAmt, isFull) {
        if (!payAmt||payAmt<=0||payAmt>amt) { showToast('❌ সঠিক পরিমাণ দিন'); return; }
        _confirm({
            title: person+'-কে পরিশোধ',
            msg: '৳'+Math.round(payAmt)+' '+(isFull?'পুরো':'আংশিক')+' পরিশোধ হবে\nব্যালেন্স থেকে কমবে।',
            icon: '💸', type: 'pay',
            yesText: '💸 পরিশোধ করুন'
        }, function(){
        var all = DB.get(storeKey)||[];
        var ri = all.findIndex(function(x){ return x.id&&x.id===item.id; });
        if (ri===-1) ri = all.findIndex(function(x){ return JSON.stringify(x)===JSON.stringify(item); });
        if (ri!==-1) {
            if (isFull) { all[ri].paid=true; all[ri].paidDate=nowDate(); all[ri].paidAmt=amt; }
            else { all[ri].paidPartial=(parseFloat(all[ri].paidPartial)||0)+payAmt; if(all[ri].paidPartial>=amt){all[ri].paid=true;all[ri].paidDate=nowDate();} }
            DB.set(storeKey, all);
        }
        DB.add('expense', { category:'দেনা পরিশোধ', source:person+'-কে পরিশোধ', amount:payAmt, date:nowDate(), time:nowTime(), note:'দেনা পরিশোধ - '+(isFull?'পুরো':'আংশিক'), fromDena:true });
        window.__closeDenaPay();
        showToast('✅ ৳'+Math.round(payAmt)+' পরিশোধ হয়েছে');
        _refreshListViews();
        }); // end _confirm
    }
    window.__dpFull    = function(){ doPayment(amt, true); };
    window.__dpPartial = function(){ var inp=document.getElementById('__dpAmt'); var v=parseFloat(inp?inp.value:0); doPayment(v, false); };
}

/* ══════════════════════════════════
   পাওনা আদায় → ব্যালেন্সে যোগ
   ══════════════════════════════════ */
function _collectPabonaToBalance(storeKey, index, item) {
    var amt = parseFloat(item.amount||0);
    var person = item.person||item.name||'--';
    var existing = document.getElementById('__pabonaCollModal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = '__pabonaCollModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML = '<div style="background:linear-gradient(160deg,#001a0a,#003b1a);border-radius:22px;padding:26px 20px;max-width:320px;width:100%;border:2px solid rgba(16,185,129,.4);text-align:center">'
        + '<div style="font-size:2.5rem;margin-bottom:8px">💰</div>'
        + '<h3 style="color:#6ee7b7;font-size:1.05rem;font-weight:900;margin-bottom:4px">পাওনা আদায়</h3>'
        + '<p style="color:#9ca3af;font-size:.82rem;margin-bottom:4px">ব্যক্তি: <strong style="color:white">'+person+'</strong></p>'
        + '<p style="color:#9ca3af;font-size:.82rem;margin-bottom:14px">মোট পাওনা: <strong style="color:#10b981">৳ '+Math.round(amt)+'</strong></p>'
        + '<input type="number" id="__pcAmt" value="'+amt+'" min="1" max="'+amt+'" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.07);border:1.5px solid rgba(16,185,129,.4);border-radius:12px;color:white;font-size:1rem;font-weight:800;text-align:center;outline:none;margin-bottom:10px">'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
        + '<button onclick="__pcFull()" style="padding:12px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:11px;font-size:.85rem;font-weight:800;cursor:pointer">💯 পুরো আদায়</button>'
        + '<button onclick="__pcPartial()" style="padding:12px;background:rgba(16,185,129,.2);color:#6ee7b7;border:1px solid rgba(16,185,129,.4);border-radius:11px;font-size:.85rem;font-weight:800;cursor:pointer">✂️ আংশিক</button>'
        + '</div>'
        + '<button onclick="__closePabonaColl()" style="width:100%;padding:10px;background:rgba(255,255,255,.07);color:#9ca3af;border:1px solid rgba(255,255,255,.1);border-radius:12px;font-size:.85rem;cursor:pointer">বাতিল</button>'
        + '</div>';
    document.body.appendChild(modal);

    window.__closePabonaColl = function(){ var m=document.getElementById('__pabonaCollModal'); if(m) m.remove(); };

    function doCollect(colAmt, isFull) {
        if (!colAmt||colAmt<=0||colAmt>amt) { showToast('❌ সঠিক পরিমাণ দিন'); return; }
        _confirm({
            title: person+'-এর পাওনা আদায়',
            msg: '৳'+Math.round(colAmt)+' '+(isFull?'পুরো':'আংশিক')+' আদায় হবে\nব্যালেন্সে যোগ হবে।',
            icon: '💰', type: 'success',
            yesText: '💰 আদায় করুন'
        }, function(){
        var all = DB.get(storeKey)||[];
        var ri = all.findIndex(function(x){ return x.id&&x.id===item.id; });
        if (ri===-1) ri = all.findIndex(function(x){ return JSON.stringify(x)===JSON.stringify(item); });
        if (ri!==-1) {
            if (isFull) { all[ri].paid=true; all[ri].paidDate=nowDate(); all[ri].collectedAmt=amt; }
            else { all[ri].collectedPartial=(parseFloat(all[ri].collectedPartial)||0)+colAmt; if(all[ri].collectedPartial>=amt){all[ri].paid=true;all[ri].paidDate=nowDate();} }
            DB.set(storeKey, all);
        }
        DB.add('income', { source:person+'-এর কাছ থেকে আদায়', amount:colAmt, date:nowDate(), time:nowTime(), note:'পাওনা আদায় - '+(isFull?'পুরো':'আংশিক'), fromPabona:true });
        window.__closePabonaColl();
        showToast('✅ ৳'+Math.round(colAmt)+' আদায় — ব্যালেন্সে যোগ');
        _refreshListViews();
        }); // end _confirm
    }
    window.__pcFull    = function(){ doCollect(amt, true); };
    window.__pcPartial = function(){ var inp=document.getElementById('__pcAmt'); var v=parseFloat(inp?inp.value:0); doCollect(v, false); };
}

/* ══════════════════════════════════
   আয় থেকে দেনা/পাওনা পরিশোধ
   ══════════════════════════════════ */
function _payLedgerFromIncome(storeKey, index, incomeItem) {
    var incAmt = parseFloat(incomeItem.amount||0);
    var ledger = DB.get('ledger') || [];
    var unpaid = ledger.filter(function(l){ return !l.paid; });
    var existing = document.getElementById('__incPayModal');
    if (existing) existing.remove();

    var listHtml = unpaid.length === 0
        ? '<p style="color:#9ca3af;text-align:center;padding:20px">পরিশোধযোগ্য কোনো দেনা/পাওনা নেই</p>'
        : unpaid.map(function(l, i){
            var col = (l.type==='dena'?'#fca5a5':'#6ee7b7');
            var lbl = (l.type==='dena'?'📕 দেনা':'📗 পাওনা');
            return '<div style="background:rgba(255,255,255,.06);border-radius:13px;padding:13px 14px;margin-bottom:8px;border:1.5px solid rgba(255,255,255,.1);cursor:pointer;transition:all .15s" onclick="__ipSelect('+i+')" id="__ip_'+i+'">'
                + '<div style="display:flex;justify-content:space-between;align-items:center">'
                + '<div><span style="font-size:.7rem;color:'+col+';font-weight:900">'+lbl+'</span> <span style="color:white;font-weight:800;font-size:.9rem">'+(l.person||l.name||'--')+'</span></div>'
                + '<span style="color:'+col+';font-weight:900;font-size:.95rem">৳ '+Math.round(l.amount||0)+'</span>'
                + '</div>'
                + (l.note?'<div style="color:#9ca3af;font-size:.72rem;margin-top:4px">'+l.note+'</div>':'')
                + '</div>';
          }).join('');

    var modal = document.createElement('div');
    modal.id = '__incPayModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);display:flex;align-items:flex-end;justify-content:center';
    modal.innerHTML = '<div style="background:linear-gradient(180deg,#0f172a,#1a1040);border-radius:24px 24px 0 0;padding:20px 16px 40px;width:100%;max-height:85vh;overflow-y:auto;border-top:2px solid rgba(245,158,11,.3)">'
        + '<div style="width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:4px;margin:0 auto 16px"></div>'
        + '<h3 style="color:#fcd34d;font-size:1rem;font-weight:900;margin-bottom:4px;text-align:center">📒 আয় থেকে দেনা/পাওনা পরিশোধ</h3>'
        + '<p style="color:#9ca3af;font-size:.78rem;text-align:center;margin-bottom:14px">আয়: ৳ '+Math.round(incAmt)+' — কোনটি পরিশোধ করবেন?</p>'
        + '<div id="__ipList">'+listHtml+'</div>'
        + '<div id="__ipAmtRow" style="display:none;margin:12px 0">'
        + '<p style="color:#fcd34d;font-size:.82rem;font-weight:800;margin-bottom:8px" id="__ipSelLabel">নির্বাচিত</p>'
        + '<input type="number" id="__ipAmt" placeholder="৳ পরিমাণ" style="width:100%;padding:11px;background:rgba(255,255,255,.07);border:1.5px solid rgba(245,158,11,.4);border-radius:12px;color:white;font-size:1rem;font-weight:800;text-align:center;outline:none;margin-bottom:8px">'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
        + '<button onclick="__ipPayFull()" style="padding:12px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:11px;font-size:.85rem;font-weight:800;cursor:pointer">💯 পুরো</button>'
        + '<button onclick="__ipPayPartial()" style="padding:12px;background:rgba(245,158,11,.2);color:#fcd34d;border:1px solid rgba(245,158,11,.3);border-radius:11px;font-size:.85rem;font-weight:800;cursor:pointer">✂️ আংশিক</button>'
        + '</div></div>'
        + '<button onclick="__closeIncPay()" style="width:100%;padding:12px;background:rgba(255,255,255,.07);color:#9ca3af;border:1px solid rgba(255,255,255,.1);border-radius:12px;font-size:.85rem;cursor:pointer;margin-top:12px">বাতিল</button>'
        + '</div>';
    document.body.appendChild(modal);

    var selectedIdx=-1, selectedItem=null;
    window.__closeIncPay = function(){ var m=document.getElementById('__incPayModal'); if(m) m.remove(); };
    window.__ipSelect = function(i){
        selectedIdx=i; selectedItem=unpaid[i];
        document.querySelectorAll('[id^="__ip_"]').forEach(function(el){ el.style.borderColor='rgba(255,255,255,.1)'; });
        var sel=document.getElementById('__ip_'+i); if(sel) sel.style.borderColor='#f59e0b';
        var lbl=document.getElementById('__ipSelLabel');
        if(lbl) lbl.textContent=(selectedItem.type==='dena'?'📕 দেনা':'📗 পাওনা')+' — '+(selectedItem.person||selectedItem.name||'--')+' — ৳'+Math.round(selectedItem.amount||0);
        var inp=document.getElementById('__ipAmt'); if(inp) inp.value=selectedItem.amount||'';
        var row=document.getElementById('__ipAmtRow'); if(row) row.style.display='block';
    };

    function doPay(payAmt, isFull) {
        if (selectedIdx===-1) { showToast('❌ আগে একটি বেছে নিন'); return; }
        var ledgerAmt=parseFloat(selectedItem.amount||0);
        if (!payAmt||payAmt<=0) { showToast('❌ সঠিক পরিমাণ দিন'); return; }
        if (payAmt>incAmt) { showToast('❌ আয়ের পরিমাণ ৳'+Math.round(incAmt)+' এর বেশি হবে না'); return; }
        var person2=selectedItem.person||selectedItem.name||'--';
        var type2=selectedItem.type==='dena'?'দেনা':'পাওনা';
        if (!confirm(person2+'-এর ৳'+Math.round(payAmt)+' '+type2+' আয় থেকে পরিশোধ করবেন?\nব্যয় হিসেবে যোগ হবে।')) return;
        var allLedger=DB.get('ledger')||[];
        var lri=allLedger.findIndex(function(x){ return x.id&&x.id===selectedItem.id; });
        if(lri===-1) lri=allLedger.findIndex(function(x){ return JSON.stringify(x)===JSON.stringify(selectedItem); });
        if(lri!==-1){
            if(isFull||payAmt>=ledgerAmt){allLedger[lri].paid=true;allLedger[lri].paidDate=nowDate();}
            else{allLedger[lri].paidPartial=(parseFloat(allLedger[lri].paidPartial)||0)+payAmt;if(allLedger[lri].paidPartial>=ledgerAmt){allLedger[lri].paid=true;allLedger[lri].paidDate=nowDate();}}
            DB.set('ledger',allLedger);
        }
        DB.add('expense',{category:(selectedItem.type==='dena'?'দেনা':'পাওনা')+' পরিশোধ (আয় থেকে)',source:person2,amount:payAmt,date:nowDate(),time:nowTime(),note:'আয় থেকে পরিশোধ — '+(isFull?'পুরো':'আংশিক'),fromIncomePay:true});
        window.__closeIncPay();
        showToast('✅ ৳'+Math.round(payAmt)+' পরিশোধ হয়েছে');
        _refreshListViews();
    }
    window.__ipPayFull    = function(){ if(!selectedItem) return; doPay(parseFloat(selectedItem.amount||0),true); };
    window.__ipPayPartial = function(){ var inp=document.getElementById('__ipAmt'); var v=parseFloat(inp?inp.value:0); doPay(v,false); };
}

/* ══════════════════════════════════
   SAVINGS PARTIAL MODAL
   ══════════════════════════════════ */
function _addToSavings(storeKey, index) {
    var item = (DB.get(storeKey)||[])[index];
    if (!item) return;
    var existing = document.getElementById('__savModal');
    if (existing) existing.remove();
    var fullAmt = parseFloat(item.amount||0);
    var modal = document.createElement('div');
    modal.id = '__savModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML = '<div style="background:linear-gradient(160deg,#0d0b1e,#1a1040);border-radius:22px;padding:26px 20px;max-width:310px;width:100%;border:2px solid rgba(168,85,247,.4);box-shadow:0 30px 80px rgba(168,85,247,.3);text-align:center">'
        + '<div style="font-size:2.5rem;margin-bottom:8px">🏦</div>'
        + '<h3 style="color:#c084fc;font-size:1.05rem;font-weight:900;margin-bottom:4px">সঞ্চয়ে যোগ করুন</h3>'
        + '<p style="color:#9ca3af;font-size:.8rem;margin-bottom:16px">মোট পরিমাণ: ৳ '+Math.round(fullAmt)+'</p>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">'
        + '<button onclick="__savFull()" style="padding:12px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:white;border:none;border-radius:12px;font-size:.85rem;font-weight:800;cursor:pointer">💯 সম্পূর্ণ<br><span style="font-size:.72rem;opacity:.8">৳ '+Math.round(fullAmt)+'</span></button>'
        + '<button onclick="__savPartial()" style="padding:12px;background:rgba(168,85,247,.18);color:#c084fc;border:1.5px solid rgba(168,85,247,.4);border-radius:12px;font-size:.85rem;font-weight:800;cursor:pointer">✂️ আংশিক<br><span style="font-size:.72rem;opacity:.8">পরিমাণ দিন</span></button>'
        + '</div>'
        + '<div id="__savPartRow" style="display:none;margin-bottom:14px">'
        + '<input type="number" id="__savPartAmt" placeholder="৳ পরিমাণ" min="1" max="'+fullAmt+'" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.07);border:1.5px solid rgba(168,85,247,.4);border-radius:12px;color:white;font-size:1rem;font-weight:800;text-align:center;outline:none;margin-bottom:8px">'
        + '<button onclick="__savConfirm()" style="width:100%;padding:11px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:white;border:none;border-radius:12px;font-size:.9rem;font-weight:900;cursor:pointer">✅ যোগ করুন</button>'
        + '</div>'
        + '<button onclick="document.getElementById(\'__savModal\').remove()" style="width:100%;padding:10px;background:rgba(255,255,255,.07);color:#9ca3af;border:1px solid rgba(255,255,255,.1);border-radius:12px;font-size:.85rem;cursor:pointer">বাতিল</button>'
        + '</div>';
    document.body.appendChild(modal);
    window.__savFull = function(){
        _confirm({title:'সঞ্চয়ে যোগ',msg:'৳'+Math.round(fullAmt)+' সম্পূর্ণ সঞ্চয়ে যোগ করবেন?',icon:'🏦',type:'success',yesText:'🏦 যোগ করুন'}, function(){
            _doAddToSavings(storeKey,index,fullAmt);
            var m=document.getElementById('__savModal'); if(m) m.remove();
        });
    };
    window.__savPartial = function(){ var r=document.getElementById('__savPartRow'); if(r) r.style.display='block'; var inp=document.getElementById('__savPartAmt'); if(inp) inp.focus(); };
    window.__savConfirm = function(){
        var inp=document.getElementById('__savPartAmt');
        var amt=parseFloat(inp?inp.value:0);
        if (!amt||amt<=0) { showToast('❌ সঠিক পরিমাণ দিন'); return; }
        if (amt>fullAmt) { showToast('❌ মূল পরিমাণ ৳'+Math.round(fullAmt)+' এর বেশি হবে না'); return; }
        _confirm({title:'সঞ্চয়ে যোগ',msg:'৳'+Math.round(amt)+' আংশিক সঞ্চয়ে যোগ করবেন?',icon:'🏦',type:'success',yesText:'🏦 যোগ করুন'}, function(){
            _doAddToSavings(storeKey,index,amt);
            var m=document.getElementById('__savModal'); if(m) m.remove();
        });
    };
}

function _doAddToSavings(storeKey, index, amount) {
    var item = (DB.get(storeKey)||[])[index];
    if (!item) return;
    DB.add('savings', {
        method:'cash', bankName:'', source:'direct',
        amount: amount,
        date:   item.date || nowDate(),
        time:   item.time || nowTime(),
        note:   (storeKey==='income'?'আয়':'ব্যয়')+' থেকে: '+(item.source||item.category||''),
        fromKey:storeKey, fromIdx:index
    });
    showToast('🏦 ৳'+Math.round(amount)+' সঞ্চয়ে যোগ হয়েছে');
}

/* ══════════════════════════════════
   TOGGLE SUSPEND / FAVORITE
   ══════════════════════════════════ */
function toggleSuspend(storeKey, index) {
    var data = DB.get(storeKey) || [];
    if (index<0||index>=data.length) return;
    data[index].pending = !data[index].pending;
    DB.set(storeKey, data);
    showToast(data[index].pending ? '⏸ স্থগিত করা হয়েছে' : '✅ স্থগিত তুলে নেওয়া হয়েছে');
    _refreshListViews();
}

function toggleFav(storeKey, index) {
    var isFav = DB.toggleFavorite(storeKey, index);
    showToast(isFav ? t('favorite_add') : t('favorite_remove'));
    _refreshListViews();
}

function _refreshListViews() {
    if (typeof loadIncomes==='function')  { loadIncomes();  if(typeof renderCurrentView==='function') renderCurrentView(); }
    else if (typeof loadExpenses==='function') { loadExpenses(); if(typeof renderCurrentView==='function') renderCurrentView(); }
    else if (typeof loadLedger==='function')  { loadLedger();   if(typeof renderCurrentView==='function') renderCurrentView(); }
    else if (typeof loadSavings==='function') { loadSavings();  if(typeof renderCurrentView==='function') renderCurrentView(); }
    else { setTimeout(function(){ location.reload(); }, 400); }
}

/* ══════════════════════════════════
   DETAIL DRAWER
   ══════════════════════════════════ */
function openDetailDrawer(storeKey, index, cardType) {
    var existing1=document.getElementById('__detBg'); var existing2=document.getElementById('__detDrawer');
    if (existing1) existing1.remove(); if (existing2) existing2.remove();
    var item = (DB.get(storeKey)||[])[index];
    if (!item) return;
    var colors={income:'#10b981',expense:'#ef4444',dena:'#f59e0b',pabona:'#3b82f6',savings:'#a855f7',ledger:'#f59e0b'};
    var labels={income:'💰 আয়',expense:'💸 ব্যয়',dena:'📕 দেনা',pabona:'📗 পাওনা',savings:'🏦 সঞ্চয়',ledger:'📋 লেনদেন'};
    var color=colors[cardType]||'#667eea';
    var daysAgo = getDaysAgo(item.date);
    var rows=[
        {icon:'📅',label:'তারিখ',val:(formatDateDisplay(item.date)||'--')+(daysAgo?' · '+daysAgo:'')},
        {icon:'🕑',label:'সময়',val:formatTimeAMPM(item.time)||'--'},
        {icon:'💵',label:'পরিমাণ',val:'৳ '+Math.round(item.amount||0)},
        {icon:'📁',label:'উৎস/ধরন',val:item.source||item.category||item.person||item.name||item.method||'--'},
        {icon:'📝',label:'নোট',val:item.note||'--'},
        {icon:'❤️',label:'প্রিয়',val:item.favorite?'হ্যাঁ':'না'},
        {icon:'✅',label:'পরিশোধ',val:item.paid?'হ্যাঁ ('+formatDateDisplay(item.paidDate)+')':'না'}
    ];
    var bg=document.createElement('div'); bg.id='__detBg';
    bg.style.cssText='position:fixed;inset:0;z-index:99980;background:rgba(0,0,0,.5);backdrop-filter:blur(4px)';
    bg.onclick=function(){ closeDetailDrawer(); };
    document.body.appendChild(bg);
    var drawer=document.createElement('div'); drawer.id='__detDrawer';
    drawer.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:99981;background:white;border-radius:24px 24px 0 0;padding:20px 18px 40px;box-shadow:0 -8px 40px rgba(0,0,0,.2);max-height:85vh;overflow-y:auto;transform:translateY(100%);transition:transform .35s cubic-bezier(.34,1.1,.64,1)';
    drawer.innerHTML='<div style="width:40px;height:4px;background:#e5e7eb;border-radius:4px;margin:0 auto 16px"></div>'
        +'<p style="font-size:.72rem;font-weight:700;color:'+color+';margin-bottom:4px;text-transform:uppercase">'+labels[cardType]+'</p>'
        +'<h3 style="color:'+color+';font-size:1.2rem;font-weight:900;margin-bottom:4px">'+(item.source||item.category||item.person||item.name||'--')+'</h3>'
        +'<div style="font-size:1.8rem;font-weight:900;color:'+color+';margin-bottom:18px">৳ '+Math.round(item.amount||0)+'</div>'
        +rows.filter(function(r){ return r.val&&r.val!=='--'; }).map(function(r){
            return '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid #f3f4f6">'
                +'<span style="font-size:1.1rem;flex-shrink:0;margin-top:1px">'+r.icon+'</span>'
                +'<div><div style="font-size:.72rem;font-weight:700;color:#9ca3af;text-transform:uppercase;margin-bottom:2px">'+r.label+'</div>'
                +'<div style="font-size:.9rem;font-weight:700;color:#1f2937">'+r.val+'</div></div></div>';
        }).join('');
    // Media section
    if (item.photo || item.drawing || item.voice) {
        var mediaDiv = document.createElement('div');
        mediaDiv.style.cssText = 'padding:14px 0;border-top:1px solid #f3f4f6;margin-top:4px';
        var mTitle = '<div style="font-size:.7rem;font-weight:800;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">মিডিয়া</div>';
        var mContent = '';
        if (item.photo) {
            mContent += '<img src="'+item.photo+'" onclick="_viewPhoto(\''+item.photo+'\')" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;border:1.5px solid #e5e7eb;cursor:pointer;margin-bottom:8px;display:block" />';
        }
        if (item.drawing) {
            mContent += '<img src="'+item.drawing+'" onclick="_viewPhoto(\''+item.drawing+'\')" style="width:100%;max-height:180px;object-fit:contain;border-radius:12px;border:1.5px solid #e5e7eb;cursor:pointer;margin-bottom:8px;display:block;background:#f8fafc" />';
        }
        if (item.voice) {
            mContent += '<button onclick="_playCardVoice(\''+item.id+'\',\''+storeKey+'\')" style="width:100%;padding:12px;background:#faf5ff;color:#7c3aed;border:1.5px solid #e9d5ff;border-radius:12px;font-size:.88rem;font-weight:800;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px">🎙️ ভয়েস শুনুন</button>';
        }
        mediaDiv.innerHTML = mTitle + mContent;
        drawer.appendChild(mediaDiv);
    }
    document.body.appendChild(drawer);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ drawer.style.transform='translateY(0)'; }); });
}

function closeDetailDrawer() {
    var d=document.getElementById('__detDrawer'); var b=document.getElementById('__detBg');
    if (d) { d.style.transform='translateY(100%)'; setTimeout(function(){ if(d.parentNode)d.remove(); },350); }
    if (b) b.remove();
}

/* ══════════════════════════════════
   SCREENSHOT
   ══════════════════════════════════ */
function openScreenshot(storeKey, index, cardType) {
    var existing=document.getElementById('__shotModal'); if (existing) existing.remove();
    var arr=DB.get(storeKey)||[]; var item=arr[index];
    if (!item) { showToast('❌ আইটেম পাওয়া যায়নি'); return; }
    var colors={income:'linear-gradient(135deg,#10b981,#059669)',expense:'linear-gradient(135deg,#ef4444,#dc2626)',ledger:'linear-gradient(135deg,#f59e0b,#d97706)',savings:'linear-gradient(135deg,#a855f7,#7c3aed)',dena:'linear-gradient(135deg,#f59e0b,#d97706)',pabona:'linear-gradient(135deg,#3b82f6,#2563eb)'};
    var typeLabels={income:'💰 আয়',expense:'💸 ব্যয়',dena:'📕 দেনা',pabona:'📗 পাওনা',savings:'🏦 সঞ্চয়',ledger:'📋 লেনদেন'};
    var bg=colors[cardType]||colors.income;
    var extras=[];
    if (item.category&&item.category!==item.source) extras.push({l:'ক্যাটাগরি',v:item.category});
    if (item.method) extras.push({l:'মাধ্যম',v:item.method});
    if (item.bankName) extras.push({l:'ব্যাংক',v:item.bankName});
    if (item.person) extras.push({l:'ব্যক্তি',v:item.person});
    if (item.type)   extras.push({l:'ধরন',v:item.type==='dena'?'দেনা':'পাওনা'});
    if (item.note)   extras.push({l:'নোট',v:item.note});
    var modal=document.createElement('div'); modal.id='__shotModal';
    modal.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px';
    var card=document.createElement('div'); card.id='__shotCard';
    card.style.cssText='background:'+bg+';color:white;border-radius:20px;padding:22px;width:100%;max-width:320px;box-shadow:0 20px 60px rgba(0,0,0,.5)';
    card.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">'
        +'<div><div style="font-size:.68rem;font-weight:700;opacity:.8;text-transform:uppercase;margin-bottom:3px">'+typeLabels[cardType]+'</div>'
        +'<div style="font-size:1.15rem;font-weight:900">'+(item.source||item.category||item.person||item.name||'--')+'</div></div>'
        +'<div style="text-align:right;flex-shrink:0;margin-left:12px"><div style="font-size:1.6rem;font-weight:900">৳'+Math.round(item.amount||0)+'</div></div>'
        +'</div>'
        +'<div style="background:rgba(255,255,255,.18);border-radius:12px;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px">'
        +'<div><div style="font-size:.6rem;font-weight:700;opacity:.7;text-transform:uppercase">তারিখ</div><div style="font-size:.88rem;font-weight:800">'+formatDateDisplay(item.date)+'</div></div>'
        +'<div><div style="font-size:.6rem;font-weight:700;opacity:.7;text-transform:uppercase">সময়</div><div style="font-size:.88rem;font-weight:800">'+formatTimeAMPM(item.time)+'</div></div>'
        +extras.map(function(f){ return '<div><div style="font-size:.6rem;font-weight:700;opacity:.7;text-transform:uppercase">'+f.l+'</div><div style="font-size:.82rem;font-weight:700">'+f.v+'</div></div>'; }).join('')
        +'</div>'
        +'<div style="text-align:right;margin-top:10px;font-size:.65rem;opacity:.55;font-weight:600">Daily Account · @jakiraljihad</div>';
    modal.innerHTML='<p style="color:white;font-weight:900;font-size:1rem;margin-bottom:14px">📸 স্ক্রিনশট প্রিভিউ</p>';
    modal.appendChild(card);
    var actions=document.createElement('div');
    actions.style.cssText='display:flex;gap:10px;margin-top:16px;width:100%;max-width:320px';
    actions.innerHTML='<button onclick="__doShot()" style="flex:1;padding:13px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:white;border:none;border-radius:13px;font-size:.9rem;font-weight:900;cursor:pointer">📤 শেয়ার/সেভ</button>'
        +'<button onclick="document.getElementById(\'__shotModal\').remove()" style="padding:13px 16px;background:rgba(255,255,255,.1);color:white;border:none;border-radius:13px;font-size:.9rem;font-weight:900;cursor:pointer">✕</button>';
    modal.appendChild(actions);
    document.body.appendChild(modal);
    window.__doShot = function(){
        if (typeof html2canvas !== 'undefined') {
            html2canvas(document.getElementById('__shotCard'),{backgroundColor:null,scale:2}).then(function(canvas){
                canvas.toBlob(function(blob){
                    if (navigator.share&&blob) { navigator.share({files:[new File([blob],'daily-account.png',{type:'image/png'})]}).catch(function(){ var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='daily-account.png';a.click(); }); }
                    else if (blob) { var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='daily-account.png';a.click(); }
                });
            });
        } else { showToast('📸 ফোনের স্ক্রিন ক্যাপচার ব্যবহার করুন'); }
    };
}

/* ══════════════════════════════════
   BACKUP / EXPORT (Share API + Blob)
   ══════════════════════════════════ */
function exportBackup() {
    var data = {
        income:DB.get('income')||[], expense:DB.get('expense')||[],
        ledger:DB.get('ledger')||[], savings:DB.get('savings')||[],
        notes:DB.get('notes')||[], settings:DB.get('settings')||{},
        cssConfig:DB.get('cssConfig')||{}, pageConfig:DB.get('pageConfig')||{},
        exportedAt:new Date().toISOString(), version:'3.5'
    };
    var json = JSON.stringify(data,null,2);
    var fname = 'daily-account-backup-'+new Date().toISOString().slice(0,10)+'.json';
    _shareOrDownload(json, fname, 'application/json');
}

function _shareOrDownload(content, filename, mime) {
    if (navigator.share && navigator.canShare) {
        try {
            var file = new File([content], filename, {type:mime});
            if (navigator.canShare({files:[file]})) {
                navigator.share({files:[file],title:'Daily Account Backup'})
                    .then(function(){ showToast('✅ শেয়ার সফল!'); })
                    .catch(function(){ _blobDownload(content,filename,mime); });
                return;
            }
        } catch(e) {}
    }
    _blobDownload(content, filename, mime);
}

function _blobDownload(content, filename, mime) {
    try {
        var blob=new Blob([content],{type:mime}); var url=URL.createObjectURL(blob);
        var a=document.createElement('a'); a.href=url; a.download=filename; a.style.display='none';
        document.body.appendChild(a); a.click();
        setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); },300);
        showToast('📥 ডাউনলোড হচ্ছে...');
    } catch(e) {
        _copyToClipboard(typeof content==='string'?content:JSON.stringify(content));
        showToast('📋 কপি করা হয়েছে');
    }
}

function _copyToClipboard(text) {
    if (navigator.clipboard&&navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function(){});
    } else {
        var ta=document.createElement('textarea'); ta.value=text;
        ta.style.cssText='position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta); ta.select();
        try{document.execCommand('copy');}catch(e2){}
        document.body.removeChild(ta);
    }
}

function importBackup(event) {
    var file=event.target.files[0]; if(!file) return;
    var reader=new FileReader();
    reader.onload=function(e){
        try {
            var data=JSON.parse(e.target.result);
            if (!confirm('এই ব্যাকআপ রিস্টোর করবেন?')) return;
            if(data.income)     DB.set('income',     data.income);
            if(data.expense)    DB.set('expense',    data.expense);
            if(data.ledger)     DB.set('ledger',     data.ledger);
            if(data.savings)    DB.set('savings',    data.savings);
            if(data.notes)      DB.set('notes',      data.notes);
            if(data.settings)   DB.set('settings',   data.settings);
            if(data.cssConfig)  DB.set('cssConfig',  data.cssConfig);
            if(data.pageConfig) DB.set('pageConfig', data.pageConfig);
            showToast('✅ ব্যাকআপ রিস্টোর হয়েছে');
            setTimeout(function(){ location.reload(); }, 1000);
        } catch(e2) { showToast('❌ ব্যাকআপ ফাইল ভুল!'); }
    };
    reader.readAsText(file);
    if (event.target) event.target.value='';
}

function exportCSV() {
    var keys=['income','expense','ledger','savings'];
    var csv='';
    keys.forEach(function(key){
        var data=DB.get(key)||[]; if(!data.length) return;
        csv+='\n--- '+key.toUpperCase()+' ---\n';
        if(data[0]) csv+=Object.keys(data[0]).join(',')+'\n';
        data.forEach(function(row){ csv+=Object.values(row).map(function(v){ return '"'+String(v||'').replace(/"/g,'""')+'"'; }).join(',')+'\n'; });
    });
    _shareOrDownload('\uFEFF'+csv, 'daily-account-'+new Date().toISOString().slice(0,10)+'.csv', 'text/csv;charset=utf-8');
}

function resetAllData() {
    _confirm({title:'সব ডাটা মুছুন',msg:'এই কাজ পূর্বাবস্থায় ফেরানো যাবে না!',icon:'⚠️',type:'danger',yesText:'🗑️ মুছে দিন',noText:'বাতিল'}, function(){
        DB.clearAll();
        showToast('🗑️ সব ডাটা মুছে গেছে');
        setTimeout(function(){ location.reload(); }, 1000);
    });
}

/* ══════════════════════════════════
   SOCIAL / MISC
   ══════════════════════════════════ */
function openSocial(platform) {
    var links={youtube:'https://youtube.com/@jakiraljihad',facebook:'https://facebook.com/jakiraljihad',instagram:'https://instagram.com/jakiraljihad',tiktok:'https://tiktok.com/@jakiraljihad',telegram:'https://t.me/jakiraljihad01'};
    if (links[platform]) window.open(links[platform],'_blank');
}

function checkFirstRun() {
    var s=DB.get('settings')||{};
    if (s.firstRun) { var modal=document.getElementById('tutorialModal'); if(modal) modal.style.display='flex'; }
}
function closeTutorial() {
    var s=DB.get('settings')||{}; s.firstRun=false; DB.set('settings',s);
    var modal=document.getElementById('tutorialModal'); if(modal) modal.style.display='none';
}

function addAnimationStyles() {
    if (document.getElementById('__appAnims')) return;
    var style=document.createElement('style'); style.id='__appAnims';
    style.textContent='@keyframes slideInRight{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}'
        +'@keyframes fadeIn{from{opacity:0}to{opacity:1}}'
        +'@keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}';
    document.head.appendChild(style);
}

function checkBudgetWarning(newAmount) {
    var s=DB.get('settings')||{}; if(!s.budgetWarning) return;
    var totalIncome=DB.sum('income','amount'); var totalExpense=DB.sum('expense','amount')+(newAmount||0);
    var warningDiv=document.getElementById('budgetWarning'); if(!warningDiv) return;
    if(totalIncome>0&&totalExpense>totalIncome*0.8){
        var pct=Math.round((totalExpense/totalIncome)*100);
        warningDiv.style.display='flex';
        var wt=document.getElementById('warningText'); if(wt) wt.textContent='আপনার ব্যয় আয়ের '+pct+'% হয়ে গেছে! সাবধান!';
    }
}

function loadCurrentBalance() {
    var income=DB.sum('income','amount'); var expense=DB.sum('expense','amount');
    var ledger=DB.get('ledger')||[]; var paidDena=0, paidPabona=0;
    ledger.forEach(function(item){
        if(item.paid){if(item.type==='dena') paidDena+=parseFloat(item.amount||0); else paidPabona+=parseFloat(item.amount||0);}
    });
    var savings=DB.sum('savings','amount');
    var balance=income-expense+paidPabona-paidDena-savings;
    var el=document.getElementById('currentBalance');
    if(el){ el.textContent='৳ '+Math.round(balance); el.style.color=balance<0?'#dc2626':'#16a34a'; }
}


/* ══════════════════════════════════
   পরিশোধ — সুন্দর Stylish UI
   ══════════════════════════════════ */
function showPaymentUI(storeKey, index, item, onConfirm) {
    var ex = document.getElementById('__payUI'); if(ex) ex.remove();
    var person = item.person||item.name||'--';
    var amt = parseFloat(item.amount||0);
    var isDena = item.type==='dena';
    var c1 = isDena?'#ef4444':'#10b981'; var c2 = isDena?'#dc2626':'#059669';
    var icon = isDena?'💸':'💰';
    var label = isDena?'দেনা পরিশোধ':'পাওনা আদায়';

    var ui = document.createElement('div');
    ui.id = '__payUI';
    ui.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.9);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;padding:20px';
    ui.innerHTML = '<div style="background:linear-gradient(160deg,#0f172a,#1e1b4b);border-radius:24px;padding:28px 22px;max-width:320px;width:100%;border:2px solid '+c1+'40;box-shadow:0 0 60px '+c1+'20,0 30px 80px rgba(0,0,0,.6);text-align:center;position:relative;overflow:hidden">'
        +'<div style="position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,'+c1+'15,transparent 70%);border-radius:50%"></div>'
        +'<div style="font-size:3rem;margin-bottom:10px;position:relative">'+icon+'</div>'
        +'<h3 style="color:'+c1+';font-size:1.1rem;font-weight:900;margin-bottom:6px;position:relative">'+label+'</h3>'
        +'<p style="color:rgba(255,255,255,.6);font-size:.82rem;margin-bottom:16px;position:relative">'+person+'</p>'
        +'<div style="background:'+c1+'12;border:1.5px solid '+c1+'30;border-radius:16px;padding:16px;margin-bottom:20px;position:relative">'
        +'<div style="color:rgba(255,255,255,.5);font-size:.72rem;font-weight:700;margin-bottom:4px">পরিমাণ</div>'
        +'<div style="color:'+c1+';font-size:2rem;font-weight:900">৳ '+Math.round(amt)+'</div>'
        +'</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;position:relative">'
        +'<button id="__payConfirm" style="padding:14px;background:linear-gradient(135deg,'+c1+','+c2+');color:white;border:none;border-radius:14px;font-size:.92rem;font-weight:900;cursor:pointer;box-shadow:0 6px 20px '+c1+'40">✅ নিশ্চিত</button>'
        +'<button onclick="document.getElementById(\'__payUI\').remove()" style="padding:14px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.12);border-radius:14px;font-size:.92rem;font-weight:800;cursor:pointer">বাতিল</button>'
        +'</div></div>';
    document.body.appendChild(ui);

    // animate in
    ui.querySelector('div').style.transform='scale(.85)';
    ui.querySelector('div').style.transition='transform .3s cubic-bezier(.34,1.56,.64,1)';
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ ui.querySelector('div').style.transform='scale(1)'; }); });

    document.getElementById('__payConfirm').onclick = function() {
        // animate out
        var card = ui.querySelector('div');
        card.style.transform='scale(1.05)';
        card.style.opacity='0';
        setTimeout(function(){ if(ui.parentNode) ui.remove(); if(onConfirm) onConfirm(); }, 280);
    };
}

/* ══════════════════════════════════
   দেনা → আয় থেকে সরাসরি পরিশোধ
   ══════════════════════════════════ */
function _payUnpaidDenaFromIncome(incomeItem) {
    var unpaidDena = (DB.get('ledger')||[]).filter(function(l){ return l.type==='dena'&&!l.paid; });
    if (unpaidDena.length===0) { showToast('✅ কোনো অপরিশোধিত দেনা নেই'); return; }
    _payLedgerFromIncomeFiltered(incomeItem, unpaidDena);
}

function _payLedgerFromIncomeFiltered(incomeItem, ledgerItems) {
    var incAmt=parseFloat(incomeItem.amount||0);
    var existing=document.getElementById('__incPayModal'); if(existing) existing.remove();
    var listHtml=ledgerItems.map(function(l,i){
        var col='#fca5a5'; var lbl='📕 দেনা';
        return '<div style="background:rgba(255,255,255,.06);border-radius:13px;padding:13px 14px;margin-bottom:8px;border:1.5px solid rgba(255,255,255,.1);cursor:pointer;transition:all .15s" onclick="__ipSelect('+i+')" id="__ip_'+i+'">'
            +'<div style="display:flex;justify-content:space-between;align-items:center">'
            +'<div><span style="font-size:.7rem;color:'+col+';font-weight:900">'+lbl+'</span> <span style="color:white;font-weight:800;font-size:.9rem">'+(l.person||l.name||'--')+'</span></div>'
            +'<span style="color:'+col+';font-weight:900;font-size:.95rem">৳ '+Math.round(l.amount||0)+'</span>'
            +'</div>'+(l.note?'<div style="color:#9ca3af;font-size:.72rem;margin-top:4px">'+l.note+'</div>':'')+'</div>';
    }).join('');

    var modal=document.createElement('div'); modal.id='__incPayModal';
    modal.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);display:flex;align-items:flex-end;justify-content:center';
    modal.innerHTML='<div style="background:linear-gradient(180deg,#0f172a,#1a1040);border-radius:24px 24px 0 0;padding:20px 16px 40px;width:100%;max-height:85vh;overflow-y:auto;border-top:2px solid rgba(239,68,68,.3)">'
        +'<div style="width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:4px;margin:0 auto 16px"></div>'
        +'<h3 style="color:#fca5a5;font-size:1rem;font-weight:900;margin-bottom:4px;text-align:center">💸 আয় থেকে দেনা পরিশোধ</h3>'
        +'<p style="color:#9ca3af;font-size:.78rem;text-align:center;margin-bottom:14px">আয়: ৳ '+Math.round(incAmt)+'</p>'
        +'<div id="__ipList">'+listHtml+'</div>'
        +'<div id="__ipAmtRow" style="display:none;margin:12px 0">'
        +'<p style="color:#fca5a5;font-size:.82rem;font-weight:800;margin-bottom:8px" id="__ipSelLabel">নির্বাচিত</p>'
        +'<input type="number" id="__ipAmt" placeholder="৳ পরিমাণ" style="width:100%;padding:11px;background:rgba(255,255,255,.07);border:1.5px solid rgba(239,68,68,.4);border-radius:12px;color:white;font-size:1rem;font-weight:800;text-align:center;outline:none;margin-bottom:8px">'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
        +'<button onclick="__ipPayFull()" style="padding:12px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:11px;font-size:.85rem;font-weight:800;cursor:pointer">💯 পুরো</button>'
        +'<button onclick="__ipPayPartial()" style="padding:12px;background:rgba(239,68,68,.2);color:#fca5a5;border:1px solid rgba(239,68,68,.3);border-radius:11px;font-size:.85rem;font-weight:800;cursor:pointer">✂️ আংশিক</button>'
        +'</div></div>'
        +'<button onclick="__closeIncPay()" style="width:100%;padding:12px;background:rgba(255,255,255,.07);color:#9ca3af;border:1px solid rgba(255,255,255,.1);border-radius:12px;font-size:.85rem;cursor:pointer;margin-top:12px">বাতিল</button>'
        +'</div>';
    document.body.appendChild(modal);
    var selIdx=-1; var selItem=null;
    window.__closeIncPay=function(){ var m=document.getElementById('__incPayModal'); if(m) m.remove(); };
    window.__ipSelect=function(i){
        selIdx=i; selItem=ledgerItems[i];
        document.querySelectorAll('[id^="__ip_"]').forEach(function(el){ el.style.borderColor='rgba(255,255,255,.1)'; });
        var sel=document.getElementById('__ip_'+i); if(sel) sel.style.borderColor='#ef4444';
        var lbl=document.getElementById('__ipSelLabel'); if(lbl) lbl.textContent='📕 দেনা — '+(selItem.person||selItem.name||'--')+' — ৳'+Math.round(selItem.amount||0);
        var inp=document.getElementById('__ipAmt'); if(inp) inp.value=selItem.amount||'';
        var row=document.getElementById('__ipAmtRow'); if(row) row.style.display='block';
    };
    function doPay(payAmt,isFull){
        if(!selItem){showToast('❌ আগে একটি বেছে নিন');return;}
        if(!payAmt||payAmt<=0){showToast('❌ সঠিক পরিমাণ দিন');return;}
        if(payAmt>incAmt){showToast('❌ আয়ের পরিমাণ ৳'+Math.round(incAmt)+' এর বেশি নয়');return;}
        var ledgerAmt=parseFloat(selItem.amount||0);
        var allLedger=DB.get('ledger')||[];
        var lri=allLedger.findIndex(function(x){ return x.id&&x.id===selItem.id; });
        if(lri===-1) lri=allLedger.findIndex(function(x){ return JSON.stringify(x)===JSON.stringify(selItem); });
        if(lri!==-1){
            if(isFull||payAmt>=ledgerAmt){allLedger[lri].paid=true;allLedger[lri].paidDate=nowDate();}
            else{allLedger[lri].paidPartial=(parseFloat(allLedger[lri].paidPartial)||0)+payAmt;if(allLedger[lri].paidPartial>=ledgerAmt){allLedger[lri].paid=true;allLedger[lri].paidDate=nowDate();}}
            DB.set('ledger',allLedger);
        }
        DB.add('expense',{category:'দেনা পরিশোধ (আয় থেকে)',source:selItem.person||selItem.name||'--',amount:payAmt,date:nowDate(),time:nowTime(),note:'আয় থেকে দেনা পরিশোধ — '+(isFull?'পুরো':'আংশিক'),fromIncomePay:true});
        window.__closeIncPay();
        showToast('✅ ৳'+Math.round(payAmt)+' দেনা পরিশোধ হয়েছে');
        _refreshListViews();
    }
    window.__ipPayFull=function(){ if(!selItem) return; doPay(parseFloat(selItem.amount||0),true); };
    window.__ipPayPartial=function(){ var inp=document.getElementById('__ipAmt'); doPay(parseFloat(inp?inp.value:0),false); };
}

/* ══════════════════════════════════
   দেনা — ব্যালেন্স বাড়ান (পরিশোধ নয়)
   ══════════════════════════════════ */
function _addDenaToBalance(storeKey, index, item) {
    var amt=parseFloat(item.amount||0);
    var person=item.person||item.name||'--';
    var existing=document.getElementById('__denaBalModal'); if(existing) existing.remove();
    var modal=document.createElement('div'); modal.id='__denaBalModal';
    modal.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML='<div style="background:linear-gradient(160deg,#1a0a00,#3b1a00);border-radius:22px;padding:26px 20px;max-width:320px;width:100%;border:2px solid rgba(249,115,22,.4);text-align:center">'
        +'<div style="font-size:2.5rem;margin-bottom:8px">📈</div>'
        +'<h3 style="color:#fb923c;font-size:1.05rem;font-weight:900;margin-bottom:4px">ব্যালেন্স বাড়ান</h3>'
        +'<p style="color:#9ca3af;font-size:.82rem;margin-bottom:4px">ব্যক্তি: <strong style="color:white">'+person+'</strong></p>'
        +'<p style="color:#9ca3af;font-size:.82rem;margin-bottom:4px">দেনার পরিমাণ: <strong style="color:#f97316">৳ '+Math.round(amt)+'</strong></p>'
        +'<p style="color:#fb923c;font-size:.75rem;margin-bottom:14px;font-style:italic">দেনা পরিশোধ হবে না — শুধু ব্যালেন্স বাড়বে</p>'
        +'<input type="number" id="__dbAmt" value="'+amt+'" min="1" style="width:100%;padding:11px;background:rgba(255,255,255,.07);border:1.5px solid rgba(249,115,22,.4);border-radius:12px;color:white;font-size:1rem;font-weight:800;text-align:center;outline:none;margin-bottom:10px">'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
        +'<button onclick="__dbConfirm()" style="padding:12px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;border-radius:11px;font-size:.85rem;font-weight:800;cursor:pointer">✅ ব্যালেন্স বাড়ান</button>'
        +'<button onclick="document.getElementById(\'__denaBalModal\').remove()" style="padding:12px;background:rgba(255,255,255,.07);color:#9ca3af;border:1px solid rgba(255,255,255,.1);border-radius:11px;font-size:.85rem;cursor:pointer">বাতিল</button>'
        +'</div></div>';
    document.body.appendChild(modal);
    window.__dbConfirm=function(){
        var inp=document.getElementById('__dbAmt'); var v=parseFloat(inp?inp.value:0);
        if(!v||v<=0){showToast('❌ সঠিক পরিমাণ দিন');return;}
        // Add as income to increase balance
        DB.add('income',{source:'দেনা সংক্রান্ত আয় ('+person+')',amount:v,date:nowDate(),time:nowTime(),note:'দেনা থেকে ব্যালেন্স বৃদ্ধি — পরিশোধ নয়',fromDenaBal:true});
        document.getElementById('__denaBalModal').remove();
        showToast('📈 ৳'+Math.round(v)+' ব্যালেন্সে যোগ হয়েছে');
        _refreshListViews();
    };
}

/* ══════════════════════════════════
   পাওনা — ব্যালেন্স কাটুন (deduct)
   ══════════════════════════════════ */
function _deductPabonaFromBalance(storeKey, index, item) {
    var amt=parseFloat(item.amount||0);
    var person=item.person||item.name||'--';
    if(item.deducted){showToast('⚠️ ইতিমধ্যে ব্যালেন্স থেকে বাদ আছে');return;}
    var existing=document.getElementById('__pabCutModal'); if(existing) existing.remove();
    var modal=document.createElement('div'); modal.id='__pabCutModal';
    modal.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML='<div style="background:linear-gradient(160deg,#001630,#003060);border-radius:22px;padding:26px 20px;max-width:320px;width:100%;border:2px solid rgba(59,130,246,.4);text-align:center">'
        +'<div style="font-size:2.5rem;margin-bottom:8px">📉</div>'
        +'<h3 style="color:#93c5fd;font-size:1.05rem;font-weight:900;margin-bottom:4px">ব্যালেন্স কাটুন</h3>'
        +'<p style="color:#9ca3af;font-size:.82rem;margin-bottom:4px">ব্যক্তি: <strong style="color:white">'+person+'</strong></p>'
        +'<p style="color:#9ca3af;font-size:.82rem;margin-bottom:4px">পাওনা: <strong style="color:#3b82f6">৳ '+Math.round(amt)+'</strong></p>'
        +'<p style="color:#93c5fd;font-size:.75rem;margin-bottom:18px;font-style:italic">পরিশোধ পেলে আবার ব্যালেন্সে যোগ হবে</p>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
        +'<button onclick="__pabCutConfirm()" style="padding:12px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:11px;font-size:.85rem;font-weight:800;cursor:pointer">📉 কাটুন</button>'
        +'<button onclick="document.getElementById(\'__pabCutModal\').remove()" style="padding:12px;background:rgba(255,255,255,.07);color:#9ca3af;border:1px solid rgba(255,255,255,.1);border-radius:11px;font-size:.85rem;cursor:pointer">বাতিল</button>'
        +'</div></div>';
    document.body.appendChild(modal);
    window.__pabCutConfirm=function(){
        var all=DB.get(storeKey)||[];
        var ri=all.findIndex(function(x){ return x.id&&x.id===item.id; });
        if(ri===-1) ri=all.findIndex(function(x){ return JSON.stringify(x)===JSON.stringify(item); });
        if(ri!==-1){all[ri].deducted=true; DB.set(storeKey,all);}
        DB.add('expense',{category:'পাওনা বাদ রাখা',source:person,amount:amt,date:nowDate(),time:nowTime(),note:'পাওনা ব্যালেন্স থেকে বাদ — পরে আদায় হলে যোগ হবে',fromPabonaCut:true});
        document.getElementById('__pabCutModal').remove();
        showToast('📉 ৳'+Math.round(amt)+' ব্যালেন্স থেকে কাটা হয়েছে');
        _refreshListViews();
    };
}

/* ══════════════════════════════════
   সম্পর্ক Selector (Relation)
   ══════════════════════════════════ */
function _openRelationSelector(storeKey, index, item, cardType) {
    var ex=document.getElementById('__relModal'); if(ex) ex.remove();
    var allData=[];
    ['income','expense','ledger','savings'].forEach(function(k){
        var rows=DB.get(k)||[];
        rows.forEach(function(r){ allData.push(Object.assign({},r,{_store:k})); });
    });
    allData.sort(function(a,b){ return new Date(b.date)-new Date(a.date); });

    var modal=document.createElement('div'); modal.id='__relModal';
    modal.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.9);backdrop-filter:blur(12px);display:flex;align-items:flex-end;justify-content:center';

    function renderList(filter, storeFilter) {
        var filtered=allData.filter(function(r){
            if(r.id===item.id&&r._store===storeKey) return false;
            if(storeFilter&&r._store!==storeFilter) return false;
            if(!filter) return true;
            var q=filter.toLowerCase();
            return (r.source||r.category||r.person||r.name||'').toLowerCase().includes(q)||(r.note||'').toLowerCase().includes(q);
        }).slice(0,30);
        return filtered.map(function(r,i){
            var icons={income:'💰',expense:'💸',ledger:r.type==='dena'?'📕':'📗',savings:'🏦'};
            var ic=icons[r._store]||'📋';
            return '<div onclick="__relSelect('+i+')" id="__rel_'+i+'" style="display:flex;align-items:center;gap:10px;padding:11px 13px;background:rgba(255,255,255,.05);border-radius:12px;margin-bottom:6px;border:1.5px solid rgba(255,255,255,.08);cursor:pointer">'
                +'<span style="font-size:1.1rem">'+ic+'</span>'
                +'<div style="flex:1;min-width:0"><div style="color:white;font-weight:800;font-size:.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(r.source||r.category||r.person||r.name||'--')+'</div>'
                +'<div style="color:#6b7280;font-size:.72rem">'+formatDateDisplay(r.date)+' · ৳'+Math.round(r.amount||0)+'</div></div>'
                +'<div style="color:#0ea5e9;font-size:.72rem;font-weight:700">'+r._store+'</div>'
                +'</div>';
        }).join('');
    }

    var currentFiltered=allData.filter(function(r){ return r.id!==item.id||r._store!==storeKey; }).slice(0,30);

    modal.innerHTML='<div style="background:linear-gradient(180deg,#0f172a,#1e1b4b);border-radius:24px 24px 0 0;padding:20px 16px 40px;width:100%;max-height:88vh;display:flex;flex-direction:column;border-top:2px solid rgba(14,165,233,.3)">'
        +'<div style="width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:4px;margin:0 auto 14px"></div>'
        +'<h3 style="color:#38bdf8;font-size:1rem;font-weight:900;text-align:center;margin-bottom:12px">🔗 সম্পর্ক যোগ করুন</h3>'
        +'<div style="display:flex;gap:8px;margin-bottom:10px">'
        +'<input type="text" id="__relSearch" placeholder="🔍 খুঁজুন…" oninput="__relFilter()" style="flex:1;padding:10px 13px;background:rgba(255,255,255,.08);border:1.5px solid rgba(14,165,233,.3);border-radius:12px;color:white;font-size:.88rem;outline:none">'
        +'<select id="__relStore" onchange="__relFilter()" style="padding:8px 12px;background:rgba(255,255,255,.08);border:1.5px solid rgba(14,165,233,.3);border-radius:12px;color:white;font-size:.82rem;outline:none">'
        +'<option value="">সব</option><option value="income">আয়</option><option value="expense">ব্যয়</option><option value="ledger">দেনাপাওনা</option><option value="savings">সঞ্চয়</option>'
        +'</select></div>'
        +'<div id="__relList" style="overflow-y:auto;flex:1;padding-right:4px">'+renderList('','')+'</div>'
        +'<button onclick="document.getElementById(\'__relModal\').remove()" style="width:100%;padding:12px;background:rgba(255,255,255,.07);color:#9ca3af;border:1px solid rgba(255,255,255,.1);border-radius:12px;font-size:.85rem;cursor:pointer;margin-top:10px">বাতিল</button>'
        +'</div>';
    document.body.appendChild(modal);

    window.__relFilter=function(){
        var q=document.getElementById('__relSearch')?document.getElementById('__relSearch').value:'';
        var sf=document.getElementById('__relStore')?document.getElementById('__relStore').value:'';
        document.getElementById('__relList').innerHTML=renderList(q,sf);
    };
    window.__relSelect=function(i){
        var filtered=allData.filter(function(r){ return r.id!==item.id||r._store!==storeKey; });
        var sel=filtered[i]; if(!sel) return;
        // Save relation
        var all=DB.get(storeKey)||[];
        var ri=all.findIndex(function(x){ return x.id&&x.id===item.id; });
        if(ri===-1) ri=all.findIndex(function(x){ return JSON.stringify(x)===JSON.stringify(item); });
        if(ri!==-1){
            if(!all[ri].relations) all[ri].relations=[];
            all[ri].relations.push({store:sel._store,id:sel.id,label:sel.source||sel.category||sel.person||sel.name||'--',amount:sel.amount,date:sel.date});
            DB.set(storeKey,all);
        }
        document.getElementById('__relModal').remove();
        showToast('🔗 সম্পর্ক যোগ হয়েছে');
    };
}


/* ══════════════════════════════════
   SORT CHIPS
   ══════════════════════════════════ */
function setSortChip(btn, val) {
    document.querySelectorAll('.sort-chip').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    if (typeof sortBy === 'function') sortBy(val);
}

/* ══════════════════════════════════
   PHOTO CAPTURE / UPLOAD
   ══════════════════════════════════ */




/* ══════════════════════════════════
   DRAWING / HANDWRITING
   ══════════════════════════════════ */


var _drawHistory = [], _drawHistoryIdx = -1, _drawColor = '#000000', _isDrawing = false, _lastX = 0, _lastY = 0;

function _initDrawCanvas() {
    var canvas = document.getElementById('__drawCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    function resize() {
        var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.putImageData(data, 0, 0);
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    }
    setTimeout(resize, 50);

    function getPos(e) {
        var r = canvas.getBoundingClientRect();
        var src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - r.left, y: src.clientY - r.top };
    }

    function startDraw(e) {
        e.preventDefault();
        _isDrawing = true;
        var p = getPos(e); _lastX = p.x; _lastY = p.y;
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
    }
    function draw(e) {
        if (!_isDrawing) return; e.preventDefault();
        var size = parseInt(document.getElementById('__brushSize').value) || 4;
        var p = getPos(e);
        ctx.lineWidth = size; ctx.strokeStyle = _drawColor;
        ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        _lastX = p.x; _lastY = p.y;
    }
    function stopDraw(e) {
        if (!_isDrawing) return;
        _isDrawing = false;
        _drawHistory = _drawHistory.slice(0, _drawHistoryIdx + 1);
        _drawHistory.push(canvas.toDataURL());
        _drawHistoryIdx = _drawHistory.length - 1;
    }

    canvas.addEventListener('mousedown',  startDraw);
    canvas.addEventListener('mousemove',  draw);
    canvas.addEventListener('mouseup',    stopDraw);
    canvas.addEventListener('touchstart', startDraw, {passive:false});
    canvas.addEventListener('touchmove',  draw,      {passive:false});
    canvas.addEventListener('touchend',   stopDraw);

    _drawHistory = []; _drawHistoryIdx = -1;
    _drawHistory.push(canvas.toDataURL());
    _drawHistoryIdx = 0;
}

function _setDrawColor(c) {
    _drawColor = c;
    document.querySelectorAll('#__drawPad button[data-color]').forEach(function(b){
        b.style.border = b.dataset.color === c ? '3px solid #667eea' : '2px solid rgba(255,255,255,.3)';
    });
}

function _drawUndo() {
    if (_drawHistoryIdx <= 0) return;
    _drawHistoryIdx--;
    var canvas = document.getElementById('__drawCanvas'); if(!canvas) return;
    var img = new Image(); img.src = _drawHistory[_drawHistoryIdx];
    img.onload = function(){ canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height); canvas.getContext('2d').drawImage(img,0,0); };
}
function _drawRedo() {
    if (_drawHistoryIdx >= _drawHistory.length-1) return;
    _drawHistoryIdx++;
    var canvas = document.getElementById('__drawCanvas'); if(!canvas) return;
    var img = new Image(); img.src = _drawHistory[_drawHistoryIdx];
    img.onload = function(){ canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height); canvas.getContext('2d').drawImage(img,0,0); };
}
function _drawClear() {
    var canvas = document.getElementById('__drawCanvas'); if(!canvas) return;
    canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
    canvas.getContext('2d').fillStyle = '#f8fafc';
    canvas.getContext('2d').fillRect(0,0,canvas.width,canvas.height);
}

function _drawSave(storeKey, index) {
    var canvas = document.getElementById('__drawCanvas'); if(!canvas) return;
    var dataUrl = canvas.toDataURL('image/png');
    var allData = DB.get(storeKey) || [];
    if (!allData[index]) return;
    if (!allData[index].drawings) allData[index].drawings = [];
    allData[index].drawings.push({ data: dataUrl, date: nowDate() });
    DB.set(storeKey, allData);
    document.getElementById('__drawPad').remove();
    showToast('✅ হাতের লেখা সেভ হয়েছে');
    _refreshListViews();
}


/* ══════════════════════════════════
   PHOTO / DRAWING / RELATION VIEW
   ══════════════════════════════════ */
function _viewPhoto(src) {
    var ex = document.getElementById('__photoViewer'); if(ex) ex.remove();
    var modal = document.createElement('div');
    modal.id = '__photoViewer';
    modal.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px';

    // Check if drawing (PNG with transparency → white bg)
    var isDrawing = src && src.indexOf('image/png') > -1;
    var imgBg = isDrawing ? 'background:white;border-radius:14px;' : '';

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ বন্ধ করুন';
    closeBtn.style.cssText = 'position:absolute;top:16px;right:16px;background:rgba(255,255,255,.15);color:white;border:1.5px solid rgba(255,255,255,.3);border-radius:10px;padding:8px 16px;font-size:.85rem;font-weight:800;cursor:pointer;font-family:inherit';
    closeBtn.onclick = function(){ modal.remove(); };

    var wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:96vw;max-height:88vh;display:flex;align-items:center;justify-content:center;'+imgBg;

    var img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'max-width:100%;max-height:85vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.6);display:block';

    // Drawing এ সাদা background বাড়িমে দেই
    if (isDrawing || (src && src.indexOf('data:image/png') === 0)) {
        wrap.style.background = 'white';
        wrap.style.borderRadius = '14px';
        wrap.style.padding = '8px';
    }

    wrap.appendChild(img);
    modal.appendChild(closeBtn);
    modal.appendChild(wrap);
    modal.onclick = function(e){ if(e.target===modal) modal.remove(); };
    document.body.appendChild(modal);
}

function _viewDrawing(itemId, storeKey) {
    var all = DB.get(storeKey)||[];
    var item = null;
    for(var i=0;i<all.length;i++){ if(all[i].id===itemId){item=all[i];break;} }
    if (!item||!item.drawing) { showToast('❌ হাতের লেখা পাওয়া যায়নি'); return; }
    _viewPhoto(item.drawing);
}

function _showRelations(itemId, storeKey) {
    var all = DB.get(storeKey)||[];
    var item = null;
    for(var i=0;i<all.length;i++){ if(all[i].id===itemId){item=all[i];break;} }
    if (!item||!item.relations||!item.relations.length) { showToast('কোনো সম্পর্ক নেই'); return; }
    var ex = document.getElementById('__relView'); if(ex) ex.remove();
    var modal = document.createElement('div');
    modal.id = '__relView';
    modal.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.85);backdrop-filter:blur(10px);display:flex;align-items:flex-end;justify-content:center';
    var icons = {income:'💰',expense:'💸',ledger:'📒',savings:'🏦'};
    var listHtml = '';
    for(var j=0;j<item.relations.length;j++){
        var r=item.relations[j];
        listHtml += '<div style="background:rgba(255,255,255,.06);border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">'
            +'<div><div style="color:#94a3b8;font-size:.72rem">'+(icons[r.store]||'📋')+' '+r.store+'</div><div style="color:white;font-weight:800;font-size:.9rem">'+(r.label||'--')+'</div></div>'
            +'<span style="color:#10b981;font-weight:900">৳ '+Math.round(r.amount||0)+'</span>'
            +'</div>';
    }
    var sheet = document.createElement('div');
    sheet.style.cssText = 'background:linear-gradient(180deg,#0f172a,#1e1b4b);border-radius:24px 24px 0 0;padding:20px 16px 40px;width:100%;max-height:80vh;overflow-y:auto;border-top:2px solid rgba(14,165,233,.3)';
    sheet.innerHTML = '<div style="width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:4px;margin:0 auto 14px"></div>'
        +'<h3 style="color:#38bdf8;font-size:1rem;font-weight:900;text-align:center;margin-bottom:14px">🔗 সম্পর্কিত লেনদেন</h3>'
        +listHtml
        +'<button onclick="document.getElementById(\'__relView\').remove()" style="width:100%;padding:12px;background:rgba(255,255,255,.07);color:#9ca3af;border:1px solid rgba(255,255,255,.1);border-radius:12px;font-size:.85rem;cursor:pointer;font-family:inherit;margin-top:8px">বন্ধ করুন</button>';
    modal.appendChild(sheet);
    modal.onclick = function(e){ if(e.target===modal) modal.remove(); };
    document.body.appendChild(modal);
}


/* ══════════════════════════════════
   FORM MEDIA — Photo / Drawing / Voice
   Add page ও Edit modal উভয়ের জন্য
   ══════════════════════════════════ */

// Global media state for current form
var _formMedia = { photo: null, drawing: null, voice: null };

function _initFormMedia(existingPhoto, existingDrawing, existingVoice) {
    _formMedia.photo   = existingPhoto   || null;
    _formMedia.drawing = existingDrawing || null;
    _formMedia.voice   = existingVoice   || null;
    _renderFormMediaPreview();
}

function _renderFormMediaPreview() {
    var row = document.getElementById('__formMediaPreview');
    if (!row) return;
    var html = '';
    if (_formMedia.photo) {
        html += '<div class="media-preview-item">'
            +'<img src="'+_formMedia.photo+'" style="width:70px;height:70px;object-fit:cover;border-radius:8px;display:block;cursor:pointer" />'
            +'<button class="media-del" onclick="_clearFormMedia(\'photo\')">✕</button></div>';
    }
    if (_formMedia.drawing) {
        html += '<div class="media-preview-item">'
            +'<img src="'+_formMedia.drawing+'" style="width:70px;height:70px;object-fit:contain;background:#f8fafc;border-radius:8px;display:block;cursor:pointer" />'
            +'<button class="media-del" onclick="_clearFormMedia(\'drawing\')">✕</button></div>';
    }
    if (_formMedia.voice) {
        html += '<div class="voice-preview-chip" onclick="_playFormVoice()">'
            +'🎙️ ভয়েস নোট'
            +'<button class="vdel" onclick="event.stopPropagation();_clearFormMedia(\'voice\')">✕</button>'
            +'</div>';
    }
    row.innerHTML = html;
}

function _clearFormMedia(type) {
    _formMedia[type] = null;
    _renderFormMediaPreview();
}

function _playFormVoice() {
    if (_formMedia.voice) { var a = new Audio(_formMedia.voice); a.play(); }
}

// Photo pick
function _formPickPhoto() {
    var ex=document.getElementById('__photoCh'); if(ex) ex.remove();
    var ov=document.createElement('div');
    ov.id='__photoCh';
    ov.style.cssText='position:fixed;inset:0;z-index:9999999;background:rgba(0,0,0,.65);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center';
    var sh=document.createElement('div');
    sh.style.cssText='background:white;border-radius:24px 24px 0 0;padding:20px 16px 34px;width:100%;max-width:500px;box-shadow:0 -8px 30px rgba(0,0,0,.15)';
    sh.innerHTML='<div style="width:36px;height:4px;background:#e2e8f0;border-radius:4px;margin:0 auto 16px"></div>'
        +'<div style="font-size:.95rem;font-weight:900;color:#111827;text-align:center;margin-bottom:14px">ফটো যোগ করুন</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">'
        +'<button onclick="_pickCamera()" style="padding:16px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:14px;font-size:.95rem;font-weight:800;cursor:pointer;font-family:inherit">📷<br><span style=\'font-size:.78rem\'>ক্যামেরা</span></button>'
        +'<button onclick="_pickGallery()" style="padding:16px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:14px;font-size:.95rem;font-weight:800;cursor:pointer;font-family:inherit">🖼️<br><span style=\'font-size:.78rem\'>গ্যালারি</span></button>'
        +'</div>'
        +'<button onclick="document.getElementById(\'__photoCh\').remove()" style="width:100%;padding:12px;background:#f3f4f6;color:#6b7280;border:none;border-radius:12px;font-size:.88rem;font-weight:700;cursor:pointer;font-family:inherit">বাতিল</button>';
    ov.appendChild(sh);
    ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
    document.body.appendChild(ov);
}

function _pickCamera() {
    var ex=document.getElementById('__photoCh'); if(ex) ex.remove();
    // Android এ সঠিকভাবে camera খোলার জন্য capture='environment'
    // একটি hidden input রাখি page এ যা remove হয়না
    var inp = document.getElementById('__cameraInput');
    if (!inp) {
        inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*';
        inp.capture = 'environment'; // rear camera
        inp.id = '__cameraInput';
        inp.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;z-index:-1';
        document.body.appendChild(inp);
        inp.addEventListener('change', function() {
            _readPhotoFile(this);
        });
    }
    inp.value = ''; // reset
    inp.click();
}

function _pickGallery() {
    var ex=document.getElementById('__photoCh'); if(ex) ex.remove();
    var inp = document.getElementById('__galleryInput');
    if (!inp) {
        inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*';
        // NO capture attribute = file manager / gallery
        inp.id = '__galleryInput';
        inp.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;z-index:-1';
        document.body.appendChild(inp);
        inp.addEventListener('change', function() {
            _readPhotoFile(this);
        });
    }
    inp.value = '';
    inp.click();
}

function _readPhotoFile(inp) {
    inp.onchange=function(){
        var file=inp.files[0]; if(!file) return;
        var reader=new FileReader();
        reader.onload=function(e){
            _formMedia.photo=e.target.result;
            _renderFormMediaPreview();
            showToast('✅ ফটো যোগ হয়েছে');
        };
        reader.readAsDataURL(file);
    };
    inp.click();
}

function _pickFromCamera() {
    var ex = document.getElementById('__photoChoice'); if(ex) ex.remove();
    var inp = document.createElement('input');
    inp.type='file'; inp.accept='image/*'; inp.capture='environment';
    _handlePhotoInput(inp);
}

function _pickFromGallery() {
    var ex = document.getElementById('__photoChoice'); if(ex) ex.remove();
    var inp = document.createElement('input');
    inp.type='file'; inp.accept='image/*';
    _handlePhotoInput(inp);
}

function _handlePhotoInput(inp) {
    inp.onchange = function() {
        var file = inp.files[0]; if(!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            _formMedia.photo = e.target.result;
            _renderFormMediaPreview();
            showToast('✅ ফটো যোগ হয়েছে');
        };
        reader.readAsDataURL(file);
    };
    inp.click();
}

// Voice record
var _formRecorder = null;
var _formAudioChunks = [];
var _formRecording = false;

function _formToggleVoice() {
    if (_formRecording) {
        _formStopVoice(); return;
    }
    if (!navigator.mediaDevices) { showToast('❌ ভয়েস সাপোর্ট নেই'); return; }
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream) {
        _formAudioChunks = [];
        _formRecorder = new MediaRecorder(stream);
        _formRecorder.ondataavailable = function(e){ _formAudioChunks.push(e.data); };
        _formRecorder.onstop = function() {
            var blob = new Blob(_formAudioChunks,{type:'audio/webm'});
            var reader = new FileReader();
            reader.onload = function(e2){
                _formMedia.voice = e2.target.result;
                _renderFormMediaPreview();
                showToast('✅ ভয়েস রেকর্ড হয়েছে');
            };
            reader.readAsDataURL(blob);
            stream.getTracks().forEach(function(t){t.stop();});
        };
        _formRecorder.start();
        _formRecording = true;
        var btn = document.getElementById('__formVoiceBtn');
        if (btn) { btn.textContent='⏹️ থামান'; btn.classList.add('recording'); }
        showToast('🎙️ রেকর্ডিং...');
    }).catch(function(){ showToast('❌ মাইক্রোফোন অ্যাক্সেস নেই'); });
}

function _formStopVoice() {
    if (_formRecorder && _formRecording) {
        _formRecorder.stop();
        _formRecording = false;
        var btn = document.getElementById('__formVoiceBtn');
        if (btn) { btn.textContent='🎙️ ভয়েস'; btn.classList.remove('recording'); }
    }
}

// Drawing pad for form
function _formOpenDrawing() {
    var existing = _formMedia.drawing;
    _openFormDrawingPad(existing, function(dataUrl) {
        _formMedia.drawing = dataUrl;
        _renderFormMediaPreview();
    });
}

function _openFormDrawingPad(existing, onSave) {
    var ex = document.getElementById('__formDrawPad'); if(ex) ex.remove();
    var drawHistory = []; var drawStep = -1;
    var drawColor = '#1f2937'; var drawSize = 3; var isEraser = false;

    var pad = document.createElement('div');
    pad.id = '__formDrawPad';
    pad.style.cssText = 'position:fixed;inset:0;z-index:9999999;background:white;display:flex;flex-direction:column';

    var colors = ['#1f2937','#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#ffffff'];
    var colorBtns = colors.map(function(c){
        return '<button onclick="__dc(\''+c+'\')" style="width:28px;height:28px;border-radius:50%;background:'+c+';border:2px solid '+(c==='#1f2937'?'#667eea':'#e5e7eb')+';cursor:pointer;flex-shrink:0"></button>';
    }).join('');

    pad.innerHTML = '<div style="display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid #e5e7eb;background:#f9fafb">'
        +'<button onclick="__ud()" style="padding:7px 12px;background:#f3f4f6;border:none;border-radius:9px;font-size:.8rem;font-weight:800;cursor:pointer;font-family:inherit">↩</button>'
        +'<button onclick="__rd()" style="padding:7px 12px;background:#f3f4f6;border:none;border-radius:9px;font-size:.8rem;font-weight:800;cursor:pointer;font-family:inherit">↪</button>'
        +'<button onclick="__cld()" style="padding:7px 12px;background:#fef2f2;color:#ef4444;border:1px solid #fecaca;border-radius:9px;font-size:.8rem;font-weight:800;cursor:pointer;font-family:inherit">🗑️</button>'
        +'<div style="flex:1"></div>'
        +'<button onclick="__sd()" style="padding:8px 16px;background:#374151;color:white;border:none;border-radius:10px;font-size:.85rem;font-weight:900;cursor:pointer;font-family:inherit">✅ ঠিক আছে</button>'
        +'<button onclick="document.getElementById(\'__formDrawPad\').remove()" style="padding:7px 11px;background:#f3f4f6;border:none;border-radius:9px;font-size:.82rem;cursor:pointer">✕</button>'
        +'</div>'
        +'<div style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-bottom:1px solid #f1f5f9;background:white;overflow-x:auto">'
        +colorBtns
        +'<div style="width:1px;height:22px;background:#e5e7eb;flex-shrink:0;margin:0 3px"></div>'
        +'<input type="range" min="1" max="18" value="3" oninput="__dsz(this.value)" style="width:70px;accent-color:#374151">'
        +'<span id="__dszL" style="font-size:.72rem;font-weight:700;color:#6b7280;width:22px">3</span>'
        +'<button onclick="__er()" id="__erBtn" style="padding:5px 10px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;font-size:.75rem;font-weight:800;cursor:pointer;font-family:inherit;flex-shrink:0">⬜</button>'
        +'</div>'
        +'<canvas id="__formCanvas" style="flex:1;touch-action:none;cursor:crosshair;background:white"></canvas>';

    document.body.appendChild(pad);

    var canvas = document.getElementById('__formCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 105;
    var ctx = canvas.getContext('2d');

    if (existing) {
        var img = new Image();
        img.onload = function(){ ctx.drawImage(img,0,0); _sh(); };
        img.src = existing;
    } else { _sh(); }

    function _sh() { drawStep++; drawHistory = drawHistory.slice(0,drawStep); drawHistory.push(canvas.toDataURL()); }

    var drw=false, lx=0, ly=0;
    function gp(e){
        var r=canvas.getBoundingClientRect();
        var src = e.touches ? e.touches[0] : e;
        var x = (src.clientX - r.left) * (canvas.width / r.width);
        var y = (src.clientY - r.top)  * (canvas.height / r.height);
        return [x, y];
    }
    function s1(e){ e.preventDefault(); drw=true; var p=gp(e); lx=p[0];ly=p[1]; ctx.beginPath(); ctx.moveTo(lx,ly); }
    function s2(e){
        e.preventDefault();
        if(!drw) return;
        var p=gp(e);
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
        ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : drawColor;
        ctx.lineWidth   = isEraser ? drawSize*4 : drawSize;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.shadowBlur  = isEraser ? 0 : 1;
        ctx.shadowColor = drawColor;
        ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(p[0],p[1]); ctx.stroke();
        lx=p[0]; ly=p[1];
    }
    function s3(){ if(!drw) return; drw=false; ctx.shadowBlur=0; _sh(); }

    canvas.addEventListener('mousedown',s1); canvas.addEventListener('mousemove',s2); canvas.addEventListener('mouseup',s3);
    canvas.addEventListener('touchstart',s1,{passive:false}); canvas.addEventListener('touchmove',s2,{passive:false}); canvas.addEventListener('touchend',s3);

    window.__dc = function(c){ drawColor=c; document.querySelectorAll('#__formDrawPad button[style*="border-radius:50%"]').forEach(function(b){b.style.border='2px solid #e5e7eb';}); event.target.style.border='2px solid #667eea'; };
    window.__ud = function(){ if(drawStep<=0) return; drawStep--; var img2=new Image(); img2.onload=function(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img2,0,0);}; img2.src=drawHistory[drawStep]; };
    window.__rd = function(){ if(drawStep>=drawHistory.length-1) return; drawStep++; var img2=new Image(); img2.onload=function(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img2,0,0);}; img2.src=drawHistory[drawStep]; };
    window.__cld = function(){ ctx.clearRect(0,0,canvas.width,canvas.height); _sh(); };
    window.__dsz = function(v){ drawSize=parseInt(v); var l=document.getElementById('__dszL'); if(l) l.textContent=v; };
    window.__er = function(){ isEraser=!isEraser; var b=document.getElementById('__erBtn'); if(b){b.style.background=isEraser?'#374151':'#f3f4f6';b.style.color=isEraser?'white':'';} };
    window.__sd = function(){ var data=canvas.toDataURL('image/png'); pad.remove(); if(onSave) onSave(data); showToast('✅ হাতের লেখা সংরক্ষিত'); };
}


/* ══════════════════════════════════
   CARD VOICE PLAY
   ══════════════════════════════════ */
function _playCardVoice(itemId, storeKey) {
    var all = DB.get(storeKey) || [];
    var item = null;
    for (var i=0; i<all.length; i++) { if (all[i].id === itemId) { item = all[i]; break; } }
    if (!item || !item.voice) { showToast('❌ ভয়েস পাওয়া যায়নি'); return; }
    var audio = new Audio(item.voice);
    audio.play().then(function(){ showToast('🎙️ ভয়েস বাজছে...'); }).catch(function(){ showToast('❌ বাজানো যায়নি'); });
}


/* ══════════════════════════════════
   CUSTOM CATEGORY SYSTEM
   ══════════════════════════════════ */

function _showCatRow() {
    var inputs = ['source','category','person'];
    var hasVal = false;
    for (var i=0; i<inputs.length; i++) {
        var el = document.getElementById(inputs[i]);
        if (el && el.value.trim()) { hasVal=true; break; }
    }
    var row = document.getElementById('__addToCatRow');
    if (row) row.style.display = hasVal ? 'flex' : 'none';
}
function _addToCustomCategory(storeType) {
    var inputEl = null;
    if (storeType==='income')  inputEl = document.getElementById('source') || document.getElementById('incomeSource');
    if (storeType==='expense') inputEl = document.getElementById('category') || document.getElementById('expenseCategory');
    if (storeType==='ledger')  inputEl = document.getElementById('person');
    if (storeType==='savings') inputEl = document.getElementById('method');
    
    var val = (inputEl ? inputEl.value : '').trim();
    if (!val) { showToast('❌ আগে নাম লিখুন'); return; }
    
    var key = '__custom_cat_'+storeType;
    var cats = JSON.parse(localStorage.getItem(key) || '[]');
    if (cats.indexOf(val) === -1) {
        cats.push(val);
        localStorage.setItem(key, JSON.stringify(cats));
        showToast('✅ "'+val+'" ক্যাটাগরিতে যোগ হয়েছে');
        // datalist আপডেট
        _updateDatalist(storeType, cats);
    } else {
        showToast('⚠️ "'+val+'" আগে থেকেই আছে');
    }
}

function _updateDatalist(storeType, cats) {
    var dlId = {income:'incomeTypes',expense:'expenseCategories',ledger:'personList',savings:'methodList'};
    var dl = document.getElementById(dlId[storeType]);
    if (!dl) return;
    cats.forEach(function(c){
        var found = false;
        for (var i=0; i<dl.options.length; i++) { if(dl.options[i].value===c){found=true;break;} }
        if (!found) { var o=document.createElement('option'); o.value=c; dl.appendChild(o); }
    });
}

function _loadCustomCategories() {
    ['income','expense','ledger','savings'].forEach(function(t){
        var cats = JSON.parse(localStorage.getItem('__custom_cat_'+t) || '[]');
        if (cats.length) _updateDatalist(t, cats);
    });
    // show add-to-cat row on input
    ['source','category','person','method','incomeSource','expenseCategory'].forEach(function(id){
        var el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function(){
                var row = document.getElementById('__addToCatRow');
                if (row) row.style.display = this.value.trim() ? 'flex' : 'none';
            });
        }
    });
}


/* ══════════════════════════════════════════════════════
   ADVANCED COLOR PICKER — সব জায়গায় ব্যবহারযোগ্য
   ══════════════════════════════════════════════════════ */

var _CP_PRESETS = [
    /* ── Greens ── */
    '#10b981','#059669','#047857','#065f46',
    '#34d399','#6ee7b7','#a7f3d0','#d1fae5',
    /* ── Reds ── */
    '#ef4444','#dc2626','#b91c1c','#991b1b',
    '#f87171','#fca5a5','#fecaca','#fee2e2',
    /* ── Blues ── */
    '#3b82f6','#2563eb','#1d4ed8','#1e40af',
    '#60a5fa','#93c5fd','#bfdbfe','#dbeafe',
    /* ── Purples ── */
    '#8b5cf6','#7c3aed','#6d28d9','#5b21b6',
    '#a78bfa','#c4b5fd','#ddd6fe','#ede9fe',
    /* ── Yellows/Oranges ── */
    '#f59e0b','#d97706','#b45309','#92400e',
    '#fbbf24','#fcd34d','#fde68a','#fef3c7',
    /* ── Pinks ── */
    '#ec4899','#db2777','#be185d','#9d174d',
    '#f472b6','#f9a8d4','#fbcfe8','#fce7f3',
    /* ── Cyans ── */
    '#06b6d4','#0891b2','#0e7490','#155e75',
    '#22d3ee','#67e8f9','#a5f3fc','#cffafe',
    /* ── Grays ── */
    '#1f2937','#374151','#4b5563','#6b7280',
    '#9ca3af','#d1d5db','#e5e7eb','#f9fafb',
    /* ── Special ── */
    '#ffffff','#000000','#ff6b6b','#ffd93d',
    '#6bcb77','#4d96ff','#ff922b','#cc5de8',
];

var _cpActive = null; // current active picker

function _openColorPicker(inputEl) {
    var ex = document.getElementById('__cpModal');
    if(ex) { ex.remove(); _cpActive=null; return; }
    _cpActive = inputEl;
    var currentVal = inputEl.value || '#667eea';

    var modal = document.createElement('div');
    modal.id = '__cpModal';
    modal.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999999;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;top:0';

    var sheet = document.createElement('div');
    sheet.style.cssText = 'background:#1e293b;border-radius:18px 18px 0 0;width:100%;max-width:480px;box-shadow:0 -6px 28px rgba(0,0,0,.4);max-height:68vh;overflow-y:auto;display:flex;flex-direction:column';

    var swatchHtml = '';
    _CP_PRESETS.forEach(function(col) {
        var brd = col==='#ffffff'?'border:1.5px solid #475569':'border:1.5px solid transparent';
        swatchHtml += '<div onclick="_cpSelectColor(\'' + col + '\')" style="width:28px;height:28px;border-radius:6px;background:'+col+';cursor:pointer;flex-shrink:0;'+brd+';transition:transform .1s" title="'+col+'"></div>';
    });

    sheet.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:#1e293b;position:sticky;top:0;z-index:2;border-bottom:1px solid #334155;flex-shrink:0">'
        +'<span style="font-size:.84rem;font-weight:900;color:white">🎨 কালার বাছুন</span>'
        +'<button onclick="document.getElementById(\'__cpModal\').remove();_cpActive=null" style="background:rgba(239,68,68,.18);border:1px solid rgba(239,68,68,.4);color:#f87171;border-radius:8px;padding:5px 11px;font-size:.76rem;font-weight:800;cursor:pointer;font-family:inherit">বাতিল ✕</button>'
        +'</div>'

        +'<div style="padding:10px 14px;display:flex;gap:8px;align-items:center;flex-shrink:0">'
        +'<div id="__cpPreview" style="width:44px;height:44px;border-radius:10px;background:'+currentVal+';border:2px solid rgba(255,255,255,.18);flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>'
        +'<div style="flex:1">'
        +'<input type="text" id="__cpHex" value="'+currentVal+'" maxlength="7" placeholder="#ffffff"'
        +' style="width:100%;padding:9px 12px;background:rgba(255,255,255,.09);border:1.5px solid rgba(255,255,255,.15);border-radius:9px;color:white;font-size:.9rem;font-weight:700;font-family:monospace;outline:none;-webkit-text-fill-color:white"'
        +' oninput="_cpHexInput(this.value)">'
        +'</div>'
        +'<input type="color" id="__cpNative" value="'+currentVal+'"'
        +' style="width:40px;height:40px;border:none;border-radius:9px;cursor:pointer;padding:2px;background:rgba(255,255,255,.08);flex-shrink:0"'
        +' oninput="_cpNativeChange(this.value)">'
        +'</div>'

        +'<div style="padding:4px 14px 10px;flex-shrink:0">'
        +'<div style="font-size:.64rem;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">প্রিসেট</div>'
        +'<div style="display:flex;flex-wrap:wrap;gap:5px">'+swatchHtml+'</div>'
        +'</div>'

        +'<div style="padding:8px 14px;display:flex;gap:8px;flex-shrink:0;position:sticky;bottom:0;background:#1e293b;border-top:1px solid #334155">'
        +'<button onclick="_cpApply()" style="flex:1;padding:11px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:11px;font-size:.86rem;font-weight:900;cursor:pointer;font-family:inherit">✅ প্রয়োগ করুন</button>'
        +'<button onclick="document.getElementById(\'__cpModal\').remove();_cpActive=null" style="flex:1;padding:11px;background:rgba(255,255,255,.07);color:#94a3b8;border:1px solid #334155;border-radius:11px;font-size:.86rem;font-weight:800;cursor:pointer;font-family:inherit">বাতিল</button>'
        +'</div>';

    modal.appendChild(sheet);
    modal.onclick = function(e){ if(e.target===modal){ modal.remove(); _cpActive=null; } };

    sheet.style.transform = 'translateY(100%)';
    sheet.style.transition = 'transform .25s cubic-bezier(.34,1.1,.64,1)';
    document.body.appendChild(modal);
    requestAnimationFrame(function(){
        requestAnimationFrame(function(){ sheet.style.transform='translateY(0)'; });
    });
}


function _cpSelectColor(hex) {
    var prev = document.getElementById('__cpPreview');
    var hexIn= document.getElementById('__cpHex');
    var native=document.getElementById('__cpNative');
    if(prev)   prev.style.background=hex;
    if(hexIn)  hexIn.value=hex;
    if(native) native.value=hex;
    // Highlight selected swatch
    document.querySelectorAll('#__cpModal [onclick]').forEach(function(el){
        if(el.title===hex) el.style.transform='scale(1.2)';
        else el.style.transform='scale(1)';
    });
}

function _cpHexInput(val) {
    val = val.trim();
    if(val && val[0]!=='#') val='#'+val;
    var err=document.getElementById('__cpHexErr');
    var prev=document.getElementById('__cpPreview');
    var native=document.getElementById('__cpNative');
    var valid=/^#[0-9A-Fa-f]{6}$/.test(val)||/^#[0-9A-Fa-f]{3}$/.test(val);
    if(err) err.style.display=valid?'none':'block';
    if(valid){
        if(prev) prev.style.background=val;
        if(native) native.value=val;
    }
}

function _cpNativeChange(val) {
    var prev=document.getElementById('__cpPreview');
    var hexIn=document.getElementById('__cpHex');
    if(prev) prev.style.background=val;
    if(hexIn) hexIn.value=val;
}

function _cpApply() {
    var hexIn=document.getElementById('__cpHex');
    var val=hexIn?hexIn.value.trim():'';
    if(!val||!/^#[0-9A-Fa-f]{3,6}$/.test(val)){ showToast('❌ সঠিক কালার কোড দিন'); return; }
    if(_cpActive){
        _cpActive.value=val;
        // Trigger oninput/onchange
        var ev=document.createEvent('Event');
        ev.initEvent('input',true,true);
        _cpActive.dispatchEvent(ev);
        var ev2=document.createEvent('Event');
        ev2.initEvent('change',true,true);
        _cpActive.dispatchEvent(ev2);
    }
    document.getElementById('__cpModal').remove();
    _cpActive=null;
    showToast('✅ কালার প্রয়োগ হয়েছে');
}

/* Override all color inputs - attach picker on click */
function _initColorPickers() {
    document.querySelectorAll('input[type=color]').forEach(function(inp) {
        if(inp.dataset.cpInit) return;
        inp.dataset.cpInit='1';

        // Add hex value display next to input
        var parent = inp.parentNode;
        if(parent && !parent.querySelector('.cp-hex-badge')) {
            var badge = document.createElement('span');
            badge.className = 'cp-hex-badge';
            badge.textContent = inp.value || '#000000';
            badge.style.cssText = 'font-size:.68rem;font-weight:800;color:#6b7280;font-family:monospace;background:#f1f5f9;padding:2px 7px;border-radius:6px;margin-left:4px;cursor:pointer;flex-shrink:0';
            parent.appendChild(badge);

            // Update badge on change
            inp.addEventListener('input', function(){
                badge.textContent = this.value;
                badge.style.background = this.value;
                // Contrast text
                var hex = this.value.replace('#','');
                var r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
                var lum=(0.299*r+0.587*g+0.114*b)/255;
                badge.style.color = lum>0.5 ? '#1f2937' : '#ffffff';
            });
            // Init badge color
            if(inp.value) {
                badge.style.background=inp.value;
                var hex2=inp.value.replace('#','');
                if(hex2.length===6){
                    var r2=parseInt(hex2.slice(0,2),16), g2=parseInt(hex2.slice(2,4),16), b2=parseInt(hex2.slice(4,6),16);
                    badge.style.color=((0.299*r2+0.587*g2+0.114*b2)/255)>0.5?'#1f2937':'#ffffff';
                }
            }
        }

        // Open our color picker on click
        inp.addEventListener('click', function(e){
            e.preventDefault();
            _openColorPicker(this);
        });
        inp.addEventListener('mousedown', function(e){ e.preventDefault(); });
        inp.addEventListener('touchend', function(e){ e.preventDefault(); _openColorPicker(this); },{passive:false});
    });
}


/* ══════════════════════════════════
   DOMContentLoaded INIT
   ══════════════════════════════════ */


/* ══ Extended Functions v4 ══ */
function _openVoiceRecord(storeKey, index, item) {
    var ex = document.getElementById('__voiceRecModal'); if(ex) ex.remove();
    if (!navigator.mediaDevices) { showToast('❌ ভয়েস সাপোর্ট নেই'); return; }
    var isDark = document.body.classList.contains('dark-mode');
    var bg = isDark ? 'linear-gradient(160deg,#1e2435,#252d3d)' : 'white';
    var tc = isDark ? '#e2e8f0' : '#1f2937';
    var modal = document.createElement('div');
    modal.id = '__voiceRecModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.85);display:flex;align-items:flex-end;justify-content:center';
    modal.innerHTML = '<div style="background:'+bg+';border-radius:24px 24px 0 0;padding:24px 18px 44px;width:100%;text-align:center">'+
        '<div style="width:40px;height:4px;background:#e5e7eb;border-radius:4px;margin:0 auto 16px"></div>'+
        '<h3 style="color:'+tc+';font-size:1rem;font-weight:900;margin-bottom:18px">🎙️ ভয়েস রেকর্ড</h3>'+
        (item && item.voice ? '<button onclick="__playItemVoice()" style="width:100%;padding:12px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;border:none;border-radius:12px;font-weight:800;cursor:pointer;margin-bottom:10px;font-family:inherit">▶ পুরনো ভয়েস শুনুন</button>'+
        '<button onclick="__deleteItemVoice()" style="width:100%;padding:11px;background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;border-radius:12px;font-weight:800;cursor:pointer;margin-bottom:10px;font-family:inherit">🗑️ ভয়েস মুছুন</button>' : '')+
        '<div id="__vrStatus" style="font-size:.85rem;font-weight:700;color:#6b7280;margin-bottom:14px;min-height:22px"></div>'+
        '<div style="display:flex;gap:10px">'+
        '<button id="__vrRecBtn" onclick="__vrToggle()" style="flex:1;padding:14px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:14px;font-size:.9rem;font-weight:900;cursor:pointer;font-family:inherit">🔴 রেকর্ড শুরু</button>'+
        '<button onclick="document.getElementById(\'__voiceRecModal\').remove()" style="flex:1;padding:14px;background:#f3f4f6;color:#6b7280;border:none;border-radius:14px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit">বাতিল</button>'+
        '</div></div>';
    document.body.appendChild(modal);
    modal.onclick = function(e){ if(e.target===modal) modal.remove(); };

    var recorder = null, chunks = [], isRec = false;
    window.__vrToggle = function() {
        if (!isRec) {
            navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
                chunks = [];
                recorder = new MediaRecorder(stream);
                recorder.ondataavailable = function(e){ chunks.push(e.data); };
                recorder.onstop = function(){
                    var blob = new Blob(chunks,{type:'audio/webm'});
                    var reader = new FileReader();
                    reader.onload = function(e2){
                        var data = DB.get(storeKey)||[];
                        if(index>=0&&index<data.length){
                            data[index].voice = e2.target.result;
                            DB.set(storeKey, data);
                            showToast('✅ ভয়েস সংরক্ষিত');
                            _refreshListViews();
                        }
                        modal.remove();
                    };
                    reader.readAsDataURL(blob);
                    stream.getTracks().forEach(function(t){t.stop();});
                };
                recorder.start();
                isRec = true;
                var btn = document.getElementById('__vrRecBtn');
                if(btn) btn.textContent = '⏹️ থামান';
                var st = document.getElementById('__vrStatus');
                if(st) st.textContent = '🔴 রেকর্ডিং চলছে...';
            }).catch(function(){ showToast('❌ মাইক্রোফোন অ্যাক্সেস নেই'); });
        } else {
            if(recorder) recorder.stop();
            isRec = false;
        }
    };
    window.__playItemVoice = function(){
        if(item&&item.voice){ var a=new Audio(item.voice); a.play(); showToast('▶ ভয়েস বাজছে...'); }
    };
    window.__deleteItemVoice = function(){
        var data = DB.get(storeKey)||[];
        if(index>=0&&index<data.length){
            data[index].voice = null;
            DB.set(storeKey,data);
            showToast('🗑️ ভয়েস মুছে ফেলা হয়েছে');
            _refreshListViews();
        }
        modal.remove();
    };
}

document.addEventListener('DOMContentLoaded', function () {
    addAnimationStyles();
    applyCSSConfig();
    applyDarkMode();
    if (typeof applyAllSavedPageConfigs === 'function') { try { applyAllSavedPageConfigs(); } catch(e) {} }
    try { applyPageConfig(); } catch(e) {}
    try { applyAllPageConfigs(); } catch(e) {}
    try { applyCustomFonts(); } catch(e) {}
    setupQuickAmounts();
    setupTypeSelector();
    loadDataLists();
    checkFirstRun();
    initAppLock();
    try { _loadCustomCategories(); } catch(e) {}
    setTimeout(_initColorPickers, 300);
    console.log('✨ '+APP.name+' v'+APP.version+' by '+APP.developer);
});