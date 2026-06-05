// ══════════════════════════════════════════════
//  Daily Account — Dashboard Module (v6.0)
//  Developer: জাকির আল জিহাদ
// ══════════════════════════════════════════════

// ── Online Detection & ২ মিনিট Alternating System ──
// নেট থাকলে: ২ মিনিট শুধু online slide → ২ মিনিট শুধু offline → ২ মিনিট online → ...
// নেট না থাকলে: সবসময় offline slide (আগের মতো)
var _isOnline = navigator.onLine;
var _netCycleTimer = null;
var _netPhase = 'offline';
var _TWO_MIN  = 120000;

window.addEventListener('online',  function() { _isOnline = true;  _startNetCycle(); });
window.addEventListener('offline', function() {
    _isOnline = false;
    _stopNetCycle();
    _removeOnlineSlideFromSas();
    _removeOnlineSlideFromSbs();
});

function _startNetCycle() {
    if (!_isOnline) return;
    _stopNetCycle();
    _netPhase = 'online';
    _applyNetPhase();
    _netCycleTimer = setInterval(function() {
        if (!_isOnline) { _stopNetCycle(); return; }
        _netPhase = (_netPhase === 'online') ? 'offline' : 'online';
        _applyNetPhase();
    }, _TWO_MIN);
}

function _stopNetCycle() {
    if (_netCycleTimer) { clearInterval(_netCycleTimer); _netCycleTimer = null; }
    _netPhase = 'offline';
}

function _applyNetPhase() {
    if (_netPhase === 'online') {
        // শুধু online slide — local slides লুকাও
        _showOnlyOnlineSlide();
    } else {
        // শুধু local slides — online slide সরাও
        _showOnlyLocalSlides();
    }
}

var _SBS_ONLINE_SLIDE = {
    _isOnlineSlide: true,
    icon:  '🌐',
    title: 'ইন্টারনেট সংযুক্ত ✅',
    desc:  'AI-এর সাথে লেনদেন নিয়ে কথা বলুন →',
    color: 'linear-gradient(135deg,#10b981,#0f766e)'
};

var _SAS_ONLINE_SLIDE = {
    _isNetSlide: true,
    ico: '🌐',
    txt: 'ইন্টারনেট চালু আছে। আপনার লেনদেন নিয়ে AI-এর সাথে এখনই কথা বলুন →',
    lvl: 'low'
};

function _showOnlyOnlineSlide() {
    // SBS: শুধু online slide দেখাও
    _renderSbsTracks([_SBS_ONLINE_SLIDE]);
    sbsGoTo(0);
    // SAS: শুধু online slide দেখাও
    _sasSlides = [_SAS_ONLINE_SLIDE];
    _renderSasTracks([_SAS_ONLINE_SLIDE]);
    sasGoTo(0);
}

function _showOnlyLocalSlides() {
    // SBS: local slides ফিরিয়ে দাও
    _renderSbsTracks(_sbsLocalSlides);
    sbsGoTo(0);
    // SAS: local slides ফিরিয়ে দাও
    _sasSlides = _sasLocalSlides;
    _renderSasTracks(_sasLocalSlides);
    sasGoTo(0);
}

function _showOnlineSlideTemporary() { _startNetCycle(); }

// ══════════════════════════════════════════════
//  INLINE CSS
// ══════════════════════════════════════════════
(function _injectAiStyles() {
    if (document.getElementById('_aiSliderStyles')) return;
    var s = document.createElement('style');
    s.id = '_aiSliderStyles';
    s.textContent =
        '.smart-badge-slider{position:relative}' +
        '.sbs-slide._sbs-clickable{transition:filter .18s,transform .18s;cursor:pointer}' +
        '.sbs-slide._sbs-clickable:active{filter:brightness(1.12);transform:scale(1.6)}' +
        '.sas-slide._sas-clickable{transition:filter .18s,transform .18s;cursor:pointer}' +
        '.sas-slide._sas-clickable:active{filter:brightness(1.1);transform:scale(1.6)}' +
        '#_sbsOnlineSlide{position:relative}' +
        '#_sbsOnlineSlide::before{content:"";position:absolute;top:50%;left:7px;' +
        'transform:translateY(-50%);width:7px;height:7px;border-radius:50%;' +
        'background:#4ade80;animation:_netPulse 1.6s infinite}' +
        '#_sasNetSlide{position:relative}' +
        '#_sasNetSlide::before{content:"";position:absolute;top:10px;left:10px;' +
        'width:8px;height:8px;border-radius:50%;background:#4ade80;animation:_netPulse 1.6s infinite}' +
        '@keyframes _netPulse{' +
        '0%{box-shadow:0 0 0 0 rgba(74,222,128,0.7)}' +
        '70%{box-shadow:0 0 0 9px rgba(74,222,128,0)}' +
        '100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}';
    document.head.appendChild(s);
})();

// ══════════════════════════════════════════════
//  MAIN loadDashboard
// ══════════════════════════════════════════════

function loadDashboard() {
    var income  = DB.sum('income',  'amount');
    var expense = DB.sum('expense', 'amount');
    var savings = DB.sum('savings', 'amount');

    var ledger = DB.get('ledger') || [];
    var paidDena = 0, paidPabona = 0, unpaidDena = 0, unpaidPabona = 0;
    ledger.forEach(function(item) {
        if (item.paid) {
            if (item.type === 'dena') paidDena   += item.amount;
            else                      paidPabona  += item.amount;
        } else {
            if (item.type === 'dena') unpaidDena  += item.amount;
            else                      unpaidPabona += item.amount;
        }
    });
    var balance = income - expense + paidPabona - paidDena - savings;

    var mBal = document.getElementById('mainBalance');  if (mBal) mBal.textContent = '৳ ' + balance;
    var tI   = document.getElementById('totalIncome');  if (tI)   tI.textContent   = '৳ ' + income;
    var tE   = document.getElementById('totalExpense'); if (tE)   tE.textContent   = '৳ ' + expense;
    var tD   = document.getElementById('totalDena');    if (tD)   tD.textContent   = '৳ ' + unpaidDena;
    var tP   = document.getElementById('totalPabona');  if (tP)   tP.textContent   = '৳ ' + unpaidPabona;
    var tS   = document.getElementById('totalSavings'); if (tS)   tS.textContent   = '৳ ' + savings;

    // Badge slider
    renderSmartBadgeSlider(buildSmartBadgeSlides(income, expense, savings, unpaidDena, unpaidPabona));

    // Advice slider
    renderSasSlider(buildAdviceSlides(income, expense, balance, savings, unpaidDena, unpaidPabona));

    // Legacy elements
    var adviceEl = document.getElementById('adviceText');
    if (adviceEl) loadSmartAdvice(income, expense, balance, savings, unpaidDena, unpaidPabona);
    var badgeEl = document.getElementById('badgeTitle');
    if (badgeEl) loadSmartBadge(income, expense, savings);

    // পেজ লোডের সময় online থাকলে ২ মিনিটের slide
    if (_isOnline) _showOnlineSlideTemporary();
}

// ══════════════════════════════════════════════
//  SMART BADGE SLIDER (SBS)
// ══════════════════════════════════════════════

var _sbsIdx = 0, _sbsSlides = [], _sbsTimer = null;
var _sbsLocalSlides = [];

function buildSmartBadgeSlides(income, expense, savings, unpaidDena, unpaidPabona) {
    unpaidDena   = unpaidDena   || 0;
    unpaidPabona = unpaidPabona || 0;
    var sr    = income > 0 ? (savings / income) * 100 : 0;
    var er    = income > 0 ? (expense / income) * 100 : 0;
    var bal   = income - expense - savings;
    var goal  = income * 0.2;
    var score = calcHealthScore(income, expense, savings);
    var scCol = score >= 80 ? 'linear-gradient(135deg,#10b981,#059669)'
              : score >= 60 ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
              : score >= 40 ? 'linear-gradient(135deg,#f59e0b,#d97706)'
              : 'linear-gradient(135deg,#ef4444,#dc2626)';
    var b = getBadgeData(sr, er);

// নোট বা টেক্সট ছোট করার জন্য হেল্পার ফাংশন 
function shortNote(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// DB থেকে শুধুমাত্র শীর্ষ ১টি (সর্বোচ্চ) ব্যয় বের করা হচ্ছে
var expList = (DB.get('expense') || [])
    .slice()
    .sort(function(a,b){ return (b.amount||0) - (a.amount||0); })
    .slice(0, 1); // শুধু প্রথম ১টা নেওয়া হলো

var noteLimit = 15; // প্রয়োজন অনুযায়ী সাইজ পরিবর্তন করতে পারেন

var topExpSlide = { 
    icon: '🔴', 
    color: 'linear-gradient(135deg,#ef4444,#b91c1c)',
    
    // যদি ডাটা থাকে তবে টাইটেলে নোট/ক্যাটাগরি দেখাবে, না থাকলে 'কোনো ব্যয় নেই'
    title: expList.length > 0
        ? 'সর্বোচ্চ ব্যয়: ' + shortNote(expList[0].note || expList[0].category || 'ব্যয়', noteLimit) 
        : 'কোনো ব্যয় নেই',
        
    // ডেসক্রিপশনে শুধু টাকার পরিমাণ দেখাবে
    desc: expList.length > 0
        ? 'পরিমাণ: ৳' + fmtN(expList[0].amount) 
        : 'কোনো রেকর্ড পাওয়া যায়নি'
};

    // দেনা-পাওনা স্লাইড
    var denaSlide = {
        icon:  unpaidDena > 0 ? '📕' : '✅',
        title: 'বাকি দেনা: ৳' + fmtN(unpaidDena),
        desc:  unpaidDena > 0 ? 'এখনো পরিশোধ হয়নি! পরিকল্পনা করুন' : 'কোনো বকেয়া দেনা নেই 🎉',
        color: unpaidDena > 0 ? 'linear-gradient(135deg,#f59e0b,#b45309)' : 'linear-gradient(135deg,#10b981,#059669)'
    };
    var pabonaSlide = {
        icon:  unpaidPabona > 0 ? '📗' : '✅',
        title: 'বাকি পাওনা: ৳' + fmtN(unpaidPabona),
        desc:  unpaidPabona > 0 ? 'এখনো আদায় হয়নি। তাগাদা দিন!' : 'সকল পাওনা আদায় হয়েছে 🎉',
        color: unpaidPabona > 0 ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'linear-gradient(135deg,#10b981,#059669)'
    };

    // মোট দেনা-পাওনা নেট স্লাইড
    var netLedger = unpaidPabona - unpaidDena;
    var ledgerNetSlide = {
        icon:  netLedger >= 0 ? '⚖️' : '⚠️',
        title: 'দেনা-পাওনা নেট: ৳' + (netLedger >= 0 ? '+' : '') + fmtN(Math.abs(netLedger)),
        desc:  netLedger > 0 ? 'পাওনা বেশি — ভালো অবস্থানে আছেন' : netLedger < 0 ? 'দেনা বেশি — পরিশোধ করুন' : 'দেনা ও পাওনা সমান',
        color: netLedger >= 0 ? 'linear-gradient(135deg,#0ea5e9,#0369a1)' : 'linear-gradient(135deg,#f59e0b,#d97706)'
    };

    // মাসিক গড় ব্যয়
    var expItems = DB.get('expense') || [];
    var avgMonthExp = 0;
    if (expItems.length > 0) {
        var months = {};
        expItems.forEach(function(e){ var m = (e.date||'').slice(0,7); if(m) months[m] = (months[m]||0) + (e.amount||0); });
        var mKeys = Object.keys(months);
        avgMonthExp = mKeys.length > 0 ? Object.values(months).reduce(function(a,b){return a+b;},0) / mKeys.length : 0;
    }

    return [
        { icon: b.icon,  title: b.title,  desc: b.desc,  color: b.color },
        { icon: '💰',
          title: 'আয়: ৳' + fmtN(income) + ' | ব্যয়: ৳' + fmtN(expense),
          desc:  'ব্যালেন্স: ৳' + fmtN(bal),
          color: bal >= 0 ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)' },
        { icon: '💜',
          title: 'সঞ্চয়: ৳' + fmtN(savings),
          desc:  'সঞ্চয় হার: ' + sr.toFixed(1) + '%',
          color: 'linear-gradient(135deg,#a855f7,#9333ea)' },
        Object.assign(getSavingsTip(sr),  {}),
        Object.assign(getExpenseTip(er),  {}),
        { icon: '❤️',
          title: 'আর্থিক স্বাস্থ্য স্কোর: ' + score + '/100',
          desc:  score >= 80 ? 'চমৎকার আর্থিক স্বাস্থ্য!'
               : score >= 60 ? 'ভালো পরিস্থিতি'
               : score >= 40 ? 'উন্নতির সুযোগ আছে' : 'জরুরি পদক্ষেপ দরকার',
          color: scCol },
        { icon: '🎯',
          title: 'মাসিক সঞ্চয় লক্ষ্য: ৳' + fmtN(goal),
          desc:  savings >= goal ? '✅ লক্ষ্য পূরণ হয়েছে!' : 'আরও ৳' + fmtN(goal - savings) + ' দরকার',
          color: savings >= goal ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#f59e0b,#d97706)' },
        { icon: '📅',
          title: 'বার্ষিক সঞ্চয় সম্ভাবনা',
          desc:  '৳' + fmtN(savings * 12) + ' (মাসিক অব্যাহত থাকলে)',
          color: 'linear-gradient(135deg,#0ea5e9,#0284c7)' },
        topExpSlide,
        denaSlide,
        pabonaSlide,
        ledgerNetSlide,
        { icon: '📊',
          title: 'মাসিক গড় ব্যয়: ৳' + fmtN(avgMonthExp),
          desc:  avgMonthExp > 0 ? 'মোট ' + expItems.length + 'টি ব্যয়ের রেকর্ড আছে' : 'এখনো কোনো ব্যয় নেই',
          color: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
        { icon: '🏦',
          title: 'মোট আয়ের তুলনা',
          desc:  'সঞ্চয়: ' + sr.toFixed(1) + '% | ব্যয়: ' + er.toFixed(1) + '% | বাকি: ' + Math.max(0,(100-sr-er)).toFixed(1) + '%',
          color: 'linear-gradient(135deg,#0f172a,#1e3a5f)' }
    ];
}

function renderSmartBadgeSlider(slides) {
    var track  = document.getElementById('sbsTrack');
    var header = document.querySelector('.smart-badge-slider');
    if (!track) return;

    _sbsLocalSlides = slides;
    // বড় AI Chat header বাটন নেই — slide-এর ভেতরের ছোট 💬 AI badge-ই যথেষ্ট
    _renderSbsTracks(slides);
    sbsGoTo(0);
    startSbsAuto();
    addSbsTouch();
}

function _renderSbsTracks(slides) {
    var track    = document.getElementById('sbsTrack');
    var dotsWrap = document.getElementById('sbsDots');
    if (!track) return;
    _sbsSlides = slides;

    track.innerHTML = slides.map(function(s) {
        var isOL = s._isOnlineSlide === true;
        return '<div class="sbs-slide _sbs-clickable"' +
            (isOL ? ' id="_sbsOnlineSlide"' : '') +
            ' style="background:' + (s.color || '#3b82f6') + ';position:relative"' +
            ' data-href="pages/ai-chat.html">' +
            '<span class="sbs-ico' + (isOL ? ' _sbs-online-ico' : '') + '">' + s.icon + '</span>' +
            '<div class="sbs-txt">' +
            '<div class="sbs-ttl' + (isOL ? ' _sbs-online-ttl' : '') + '">' + s.title + '</div>' +
            '<div class="sbs-dsc' + (isOL ? ' _sbs-online-dsc' : '') + '">' + s.desc + '</div>' +
            '</div>' +
            '<span style="position:absolute;top:50%;right:10px;transform:translateY(-50%);' +
            'background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);' +
            'border-radius:12px;padding:3px 8px;font-size:0.6rem;font-weight:800;' +
            'color:rgba(255,255,255,0.85);white-space:nowrap;backdrop-filter:blur(4px);' +
            'display:flex;align-items:center;gap:3px;pointer-events:none">💬 AI</span>' +
            '</div>';
    }).join('');

    track.querySelectorAll('._sbs-clickable').forEach(function(el) {
        el.addEventListener('click', function(e) {
            if (!e.target.closest('button')) location.href = this.dataset.href || 'pages/ai-chat.html';
        });
    });

    if (dotsWrap) {
        dotsWrap.innerHTML = slides.map(function(_, i) {
            return '<button class="sbs-dot' + (i === 0 ? ' on' : '') + '" onclick="sbsGoTo(' + i + ')"></button>';
        }).join('');
    }
}

function _insertOnlineSlideToSbs() { _showOnlyOnlineSlide(); }

function _removeOnlineSlideFromSbs() { _showOnlyLocalSlides(); }

function sbsGoTo(idx) {
    var slides = document.querySelectorAll('#sbsTrack .sbs-slide');
    if (!slides.length) return;
    _sbsIdx = (idx + slides.length) % slides.length;
    document.getElementById('sbsTrack').style.transform = 'translateX(-' + (_sbsIdx * 100) + '%)';
    document.querySelectorAll('#sbsDots .sbs-dot').forEach(function(d, i) { d.classList.toggle('on', i === _sbsIdx); });
}

function startSbsAuto() {
    if (_sbsTimer) clearInterval(_sbsTimer);
    try {
        var _sl=JSON.parse(localStorage.getItem('_da_slider_settings')||'{}');
        if(_sl.sbsAuto===false)return;
        _sbsTimer=setInterval(function(){sbsGoTo(_sbsIdx+1);},((_sl.sbsTime||3)*1000));
    }catch(e){_sbsTimer=setInterval(function(){sbsGoTo(_sbsIdx+1);},3000);}
}

function addSbsTouch() {
    var el = document.getElementById('smartBadgeSlider');
    if (!el || el._sbsTouchBound) return;
    el._sbsTouchBound = true;
    var sx = 0;
    el.addEventListener('touchstart', function(e) { sx = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function(e) {
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) { sbsGoTo(_sbsIdx + (dx < 0 ? 1 : -1)); startSbsAuto(); }
    }, { passive: true });
}

// ══════════════════════════════════════════════
//  SMART ADVICE SLIDER (SAS)
// ══════════════════════════════════════════════

var _sasIdx = 0, _sasSlides = [], _sasTimer = null;
var _sasLocalSlides = [];

var ADVICE_POOL = {
    critical: [
        { ico:'🚨', txt:'অতি জরুরি! ব্যয় আয়ের দ্বিগুণ। এখনই সকল অপ্রয়োজনীয় খরচ বন্ধ করুন।', lvl:'high' },
        { ico:'🚨', txt:'আর্থিক সংকট! পরিবার নিয়ে জরুরি বাজেট পরিকল্পনা করুন।', lvl:'high' },
        { ico:'🚨', txt:'বিপদসীমা অতিক্রম! এই হারে চললে গুরুতর ঋণে পড়বেন। আজই পদক্ষেপ নিন।', lvl:'high' },
        { ico:'🚨', txt:'লাল সংকেত! মাসিক খরচ পর্যালোচনা করে ৫০% কমানোর লক্ষ্য রাখুন।', lvl:'high' },
        { ico:'🚨', txt:'জরুরি! শুধু অতি প্রয়োজনীয় খরচ করুন। বাকি সব বন্ধ রাখুন।', lvl:'high' },
        { ico:'🚨', txt:'ব্যয় নিয়ন্ত্রণ না করলে সঞ্চয় শূন্য হবে। এখনই কঠোর সিদ্ধান্ত নিন।', lvl:'high' },
        { ico:'🚨', txt:'বিপদজনক পরিস্থিতি! প্রতিটি টাকার হিসাব রাখুন। একটাও অপ্রয়োজনীয় খরচ নয়।', lvl:'high' }
    ],
    warning: [
        { ico:'⚠️', txt:'সতর্কতা! এই মাসে ব্যয় আয়ের চেয়ে বেশি। দ্রুত খরচ কমানো জরুরি।', lvl:'medium' },
        { ico:'⚠️', txt:'ঋণের ঝুঁকি! আয়ের চেয়ে বেশি খরচ হচ্ছে। আগামী সপ্তাহ থেকে সাশ্রয়ী হোন।', lvl:'medium' },
        { ico:'⚠️', txt:'বাজেট ছাড়িয়ে গেছে! প্রতিটি খরচের আগে দুইবার ভাবুন।', lvl:'medium' },
        { ico:'⚠️', txt:'লাল দাগ! খরচ আয় অতিক্রম করেছে। পরবর্তী মাসে আরও সতর্ক থাকুন।', lvl:'medium' },
        { ico:'⚠️', txt:'আয়-ব্যয়ের ভারসাম্য নষ্ট। অপ্রয়োজনীয় খরচ চিহ্নিত করে বন্ধ করুন।', lvl:'medium' },
        { ico:'⚠️', txt:'খরচের লাগাম টানুন! বাজার, রেস্তোরাঁ ও বিনোদন খরচ পর্যালোচনা করুন।', lvl:'medium' },
        { ico:'⚠️', txt:'মাসের মাঝামাঝিতেই বাজেট শেষ? পরের মাসে আগে থেকে পরিকল্পনা করুন।', lvl:'medium' }
    ],
    savings_zero: [
        { ico:'💡', txt:'সঞ্চয় শুরু করুন! আয়ের অন্তত ১০-২০% সঞ্চয় করার অভ্যাস গড়ুন।', lvl:'medium' },
        { ico:'💡', txt:'ভবিষ্যতের জন্য সঞ্চয় অত্যন্ত জরুরি! আজ থেকেই শুরু করুন।', lvl:'medium' },
        { ico:'💡', txt:'জরুরি তহবিল তৈরি করুন! মাসিক আয়ের ১০% সঞ্চয়ে রাখুন।', lvl:'medium' },
        { ico:'💡', txt:'সঞ্চয়হীন জীবন ঝুঁকিপূর্ণ! আগামী মাস থেকে নিয়মিত সঞ্চয় শুরু করুন।', lvl:'medium' },
        { ico:'💡', txt:'ছোট ছোট সঞ্চয়ই একদিন বড় হয়! মাসিক আয়ের ৫-১০% দিয়ে শুরু করুন।', lvl:'medium' },
        { ico:'💡', txt:'সঞ্চয় না থাকলে যেকোনো বিপদে ঋণ ছাড়া উপায় নেই। আজই শুরু করুন।', lvl:'medium' },
        { ico:'💡', txt:'প্রতি সপ্তাহে মাত্র ৫০০ টাকা সঞ্চয় করলেও বছরে ২৬,০০০ টাকা জমবে!', lvl:'medium' }
    ],
    savings_low: [
        { ico:'💰', txt:'সঞ্চয়ের হার বাড়ান! লক্ষ্য হওয়া উচিত ১৫-২০%।', lvl:'medium' },
        { ico:'💰', txt:'অপ্রয়োজনীয় খরচ কমিয়ে সঞ্চয় বাড়ান। আরও বেশি সুযোগ আছে!', lvl:'medium' },
        { ico:'💰', txt:'জরুরি খরচের জন্য কমপক্ষে ৩-৬ মাসের সঞ্চয় গড়ে তুলুন।', lvl:'medium' },
        { ico:'💰', txt:'প্রতি মাসে কিছু না কিছু সঞ্চয় করুন। ছোট শুরু বড় ফল দেয়!', lvl:'medium' },
        { ico:'💰', txt:'আয় বাড়লে সঞ্চয়ও বাড়ান। অভ্যাস গড়ে তুলুন।', lvl:'medium' },
        { ico:'💰', txt:'স্বয়ংক্রিয় সঞ্চয় করুন: আয় হলে প্রথমেই একটা অংশ আলাদা রাখুন।', lvl:'medium' }
    ],
    great: [
        { ico:'🎉', txt:'অসাধারণ! আপনি দুর্দান্ত আর্থিক ব্যবস্থাপনা করছেন। এভাবেই চলুন!', lvl:'low' },
        { ico:'🎉', txt:'চমৎকার সঞ্চয়ের হার! ভবিষ্যৎ অত্যন্ত উজ্জ্বল। অভিনন্দন!', lvl:'low' },
        { ico:'🎉', txt:'আর্থিক শৃঙ্খলায় আপনি অনন্য। এই অভ্যাস বজায় রাখুন!', lvl:'low' },
        { ico:'🎉', txt:'চ্যাম্পিয়ন সেভার! আপনার সঞ্চয়ের অভ্যাস অসাধারণ।', lvl:'low' },
        { ico:'🎉', txt:'মাস্টার মানি ম্যানেজার! আপনার আর্থিক ভবিষ্যৎ সুরক্ষিত।', lvl:'low' },
        { ico:'🎉', txt:'আপনি আর্থিক স্বাধীনতার পথে আছেন। বিনিয়োগের কথা ভাবুন।', lvl:'low' },
        { ico:'🎉', txt:'দুর্দান্ত! এই হারে চললে ৫ বছরে বড় লক্ষ্য পূরণ সম্ভব।', lvl:'low' }
    ],
    good: [
        { ico:'✅', txt:'ভালো করছেন! আয়-ব্যয় ভারসাম্য বজায় আছে। আরও উন্নতি করুন।', lvl:'low' },
        { ico:'✅', txt:'ইতিবাচক ব্যালেন্স! সঞ্চয় আরও বাড়ানোর চেষ্টা করুন।', lvl:'low' },
        { ico:'✅', txt:'সঠিক পথে আছেন! ধীরে ধীরে সঞ্চয় বাড়ান।', lvl:'low' },
        { ico:'💎', txt:'ভালো সঞ্চয় হচ্ছে! লক্ষ্য ২০-২৫% রাখুন।', lvl:'low' },
        { ico:'💎', txt:'উন্নত সঞ্চয়কারী! আয়ের ১৫%+ সঞ্চয় প্রশংসনীয়।', lvl:'low' },
        { ico:'💎', txt:'ধারাবাহিকতা বজায় রাখুন। ছোট উন্নতিই বড় পরিবর্তন আনে।', lvl:'low' },
        { ico:'💎', txt:'এই গতি ধরে রাখুন! প্রতি মাসে লক্ষ্য একটু বাড়ান।', lvl:'low' }
    ],
    tips: [
        { ico:'📊', txt:'প্রতিদিনের হিসাব রাখলে মাস শেষে চমক পাবেন না। অভ্যাস তৈরি করুন।', lvl:'low' },
        { ico:'🎯', txt:'৫০/৩০/২০ নিয়ম: আয়ের ৫০% প্রয়োজনীয়, ৩০% চাওয়া, ২০% সঞ্চয়।', lvl:'low' },
        { ico:'💡', txt:'আয়ের ৫০% প্রয়োজনীয়, ৩০% চাওয়া, ২০% সঞ্চয়। এই অনুপাত মেনে চলুন।', lvl:'low' },
        { ico:'🌱', txt:'ছোট ছোট সঞ্চয়ই বড় স্বপ্ন পূরণ করে। আজই শুরু করুন।', lvl:'low' },
        { ico:'📈', txt:'আয় বাড়ানোর পাশাপাশি খরচ কমানো সমান গুরুত্বপূর্ণ।', lvl:'low' },
        { ico:'💰', txt:'জরুরি তহবিল থাকলে অপ্রত্যাশিত বিপদে ঋণ করতে হয় না।', lvl:'low' },
        { ico:'🛒', txt:'কেনাকাটার আগে তালিকা করুন। তালিকার বাইরে কিছু কিনবেন না।', lvl:'low' },
        { ico:'🍳', txt:'বাইরে খাওয়া কমিয়ে ঘরে রান্না করুন। মাসে অনেক সাশ্রয় হবে।', lvl:'low' },
        { ico:'📱', txt:'অপ্রয়োজনীয় সাবস্ক্রিপশন বাতিল করুন। ছোট খরচ যোগ হলে বড় হয়।', lvl:'low' },
        { ico:'🏦', txt:'ব্যাংক অ্যাকাউন্টে সঞ্চয় রাখলে সুদও পাবেন।', lvl:'low' },
        { ico:'🧾', txt:'প্রতি মাসে রসিদ যাচাই করুন। অতিরিক্ত চার্জ সনাক্ত করুন।', lvl:'low' },
        { ico:'🚗', txt:'যানবাহন খরচ কমাতে গণপরিবহন বা কার্পুল ব্যবহার করুন।', lvl:'low' },
        { ico:'💊', txt:'স্বাস্থ্য বীমা থাকলে হঠাৎ চিকিৎসা খরচে সঞ্চয় নষ্ট হবে না।', lvl:'low' },
        { ico:'📚', txt:'আর্থিক সাক্ষরতা বাড়ান। বই পড়ুন, সঠিক সিদ্ধান্ত নিন।', lvl:'low' },
        { ico:'🎓', txt:'সন্তানের শিক্ষার জন্য আলাদা তহবিল রাখুন। আগে থেকে প্রস্তুতি নিন।', lvl:'low' },
        { ico:'🏠', txt:'ঘর ভাড়া আয়ের ৩০%-এর বেশি হওয়া উচিত নয়। পর্যালোচনা করুন।', lvl:'low' },
        { ico:'🔌', txt:'বিদ্যুৎ ও পানির বিল কমাতে অভ্যাস পরিবর্তন করুন। মাসে সাশ্রয় হবে।', lvl:'low' },
        { ico:'🎁', txt:'উপহার কেনায় বাজেট ঠিক করুন। আবেগে অতিরিক্ত খরচ এড়িয়ে চলুন।', lvl:'low' },
        { ico:'📆', txt:'মাসিক বাজেট বানান। প্রতিটি বিভাগে সর্বোচ্চ সীমা নির্ধারণ করুন।', lvl:'low' },
        { ico:'🤝', txt:'বন্ধুদের সাথে টাকা ধার দেওয়া-নেওয়া লিখিত রাখুন। বিভ্রান্তি এড়ান।', lvl:'low' }
    ],
    debt_high: [
        { ico:'📕', txt:'দেনার বোঝা অনেক বেশি! আয়ের ৩০% দেনা পরিশোধে রাখুন।', lvl:'high' },
        { ico:'📕', txt:'ঋণমুক্তি পরিকল্পনা করুন! সবচেয়ে ছোট দেনাটি আগে শোধ করুন।', lvl:'high' },
        { ico:'📕', txt:'নতুন কোনো দেনা করা থেকে বিরত থাকুন। পুরাতন দেনা কমান।', lvl:'high' },
        { ico:'📕', txt:'দেনাদারের সাথে সময়মতো যোগাযোগ করুন। সম্পর্ক ভালো রাখুন।', lvl:'high' },
        { ico:'📕', txt:'বাকি দেনার তালিকা করুন। সবচেয়ে বেশি সুদওয়ালা আগে শোধ করুন।', lvl:'high' },
        { ico:'📕', txt:'দেনা থাকলে নতুন বিনিয়োগ নয়। আগে ঋণমুক্ত হোন।', lvl:'high' }
    ],
    receivable: [
        { ico:'📗', txt:'পাওনা আদায়ে সক্রিয় হোন! এই টাকা আপনার প্রয়োজন।', lvl:'medium' },
        { ico:'📗', txt:'বকেয়া টাকা আদায় করুন। ভদ্রভাবে তাগাদা দিন।', lvl:'medium' },
        { ico:'📗', txt:'দেনাদারদের সাথে নিয়মিত যোগাযোগ রাখুন।', lvl:'medium' },
        { ico:'📗', txt:'পাওনার রসিদ বা লিখিত প্রমাণ রাখুন। ভবিষ্যতে কাজে লাগবে।', lvl:'medium' },
        { ico:'📗', txt:'অনেকদিনের পুরনো পাওনা — এখনই যোগাযোগ না করলে কঠিন হবে।', lvl:'medium' }
    ],
    dena_reminder: [
        { ico:'⚠️', txt:'মনে রাখুন! আপনার এখনো বাকি দেনা আছে। সময়মতো পরিশোধ করুন।', lvl:'medium' },
        { ico:'📕', txt:'দেনা বাকি আছে। পরিশোধ না করলে সম্পর্ক ও বিশ্বাসযোগ্যতা নষ্ট হয়।', lvl:'medium' },
        { ico:'⏰', txt:'বাকি দেনার জন্য একটা তারিখ ঠিক করুন। পরিকল্পনামাফিক শোধ করুন।', lvl:'medium' },
        { ico:'💳', txt:'দেনা পরিশোধ করুন এবং রসিদ নিন। হিসাবে আপডেট করুন।', lvl:'medium' }
    ],
    pabona_reminder: [
        { ico:'📗', txt:'আপনার পাওনা টাকা এখনো আসেনি। আদায়ের উদ্যোগ নিন।', lvl:'medium' },
        { ico:'📗', txt:'বাকি পাওনা আদায় হলে আর্থিক অবস্থা আরও ভালো হবে। তাগাদা দিন।', lvl:'medium' },
        { ico:'📗', txt:'পাওনাদারকে সম্মানের সাথে স্মরণ করিয়ে দিন। এটা আপনার অধিকার।', lvl:'medium' },
        { ico:'📗', txt:'পাওনা আদায় হলে সেটা সঞ্চয়ে রাখুন বা দেনা পরিশোধে ব্যবহার করুন।', lvl:'medium' }
    ],
    invest: [
        { ico:'📈', txt:'সঞ্চয় যথেষ্ট হলে বিনিয়োগের কথা ভাবুন। টাকা কাজ করুক!', lvl:'low' },
        { ico:'🏢', txt:'সঞ্চয়পত্র, FDR বা ডিপিএস বিবেচনা করুন। নিরাপদ বিনিয়োগ শুরু করুন।', lvl:'low' },
        { ico:'📊', txt:'বিনিয়োগের আগে ঝুঁকি বুঝুন। পুরো সঞ্চয় একজায়গায় রাখবেন না।', lvl:'low' },
        { ico:'🌾', txt:'দীর্ঘমেয়াদে বিনিয়োগ বেশি ফল দেয়। তাড়াহুড়ো এড়িয়ে চলুন।', lvl:'low' }
    ]
};

function buildAdviceSlides(income, expense, balance, savings, unpaidDena, unpaidPabona) {
    var sr = income > 0 ? (savings / income) * 100 : 0;
    var slides = [];
    function pickN(arr, n) {
        return arr.slice().sort(function() { return Math.random() - 0.5; }).slice(0, Math.min(n, arr.length));
    }
    if (expense > income * 2)            slides = slides.concat(pickN(ADVICE_POOL.critical,        3));
    else if (expense > income)           slides = slides.concat(pickN(ADVICE_POOL.warning,         3));
    if (unpaidDena > income * 0.3)       slides = slides.concat(pickN(ADVICE_POOL.debt_high,       2));
    else if (unpaidDena > 0)             slides = slides.concat(pickN(ADVICE_POOL.dena_reminder,   1));
    if (savings === 0 && income > 0)     slides = slides.concat(pickN(ADVICE_POOL.savings_zero,    3));
    else if (sr < 10 && income > 0)      slides = slides.concat(pickN(ADVICE_POOL.savings_low,     2));
    else if (sr >= 20)                   slides = slides.concat(pickN(ADVICE_POOL.great,            2));
    else                                 slides = slides.concat(pickN(ADVICE_POOL.good,             2));
    if (unpaidPabona > income * 0.2)     slides = slides.concat(pickN(ADVICE_POOL.receivable,      2));
    else if (unpaidPabona > 0)           slides = slides.concat(pickN(ADVICE_POOL.pabona_reminder, 1));
    if (sr >= 20)                        slides = slides.concat(pickN(ADVICE_POOL.invest,           1));
    slides = slides.concat(pickN(ADVICE_POOL.tips, 6));
    if (slides.length < 5)               slides = slides.concat(pickN(ADVICE_POOL.tips, 5 - slides.length));
    return slides;
}

function renderSasSlider(slides) {
    var track = document.getElementById('sasTrack');
    if (!track) return;
    _sasLocalSlides = slides;

    // SAS header-এ AI badge
    var hdr = document.querySelector('.sas-hdr');
    if (hdr && !document.getElementById('_sasAiTag')) {
        var at = document.createElement('a');
        at.id   = '_sasAiTag';
        at.href = 'pages/ai-chat.html';
        at.style.cssText =
            'display:inline-flex;align-items:center;gap:4px;margin-left:auto;' +
            'background:linear-gradient(135deg,rgba(139,92,246,0.25),rgba(59,130,246,0.2));' +
            'border:1px solid rgba(139,92,246,0.4);border-radius:14px;padding:3px 9px;' +
            'text-decoration:none;font-size:0.65rem;font-weight:800;' +
            'color:rgba(255,255,255,0.88);letter-spacing:0.2px;' +
            'transition:background .2s,transform .18s;cursor:pointer';
        at.innerHTML = '💬 <span>AI Chat</span>';
        at.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(135deg,rgba(139,92,246,0.45),rgba(59,130,246,0.35))';
            this.style.transform  = 'scale(1.06)';
        });
        at.addEventListener('mouseleave', function() {
            this.style.background = 'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(59,130,246,0.2))';
            this.style.transform  = 'scale(1)';
        });
        hdr.appendChild(at);
    }

    _renderSasTracks(slides);
    var counter = document.getElementById('sasCounter');
    if (counter) counter.textContent = '1/' + slides.length;
    sasGoTo(0);
    startSasAuto();
    addSasTouch();
}

function _renderSasTracks(sls) {
    var track    = document.getElementById('sasTrack');
    var dotsWrap = document.getElementById('sasDots');
    var counter  = document.getElementById('sasCounter');
    if (!track) return;
    _sasSlides = sls;

    track.innerHTML = sls.map(function(s) {
        var isNet = s._isNetSlide === true;
        return '<div class="sas-slide sas-' + (s.lvl || 'low') + ' _sas-clickable"' +
            (isNet
                ? ' id="_sasNetSlide" style="background:linear-gradient(135deg,#0ea5e9,#6366f1);position:relative"'
                : ' style="position:relative"') +
            ' data-href="pages/ai-chat.html">' +
            '<span class="sas-ico">' + s.ico + '</span>' +
            '<p class="sas-txt">' + s.txt + '</p>' +
            '<span style="position:absolute;bottom:8px;right:10px;' +
            'background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);' +
            'border-radius:10px;padding:2px 7px;font-size:0.58rem;font-weight:800;' +
            'color:rgba(255,255,255,0.75);white-space:nowrap;pointer-events:none;' +
            'display:flex;align-items:center;gap:3px">💬 AI chat</span>' +
            '</div>';
    }).join('');

    track.querySelectorAll('._sas-clickable').forEach(function(el) {
        el.addEventListener('click', function(e) {
            if (!e.target.closest('button')) location.href = this.dataset.href || 'pages/ai-chat.html';
        });
    });

    if (dotsWrap) {
        dotsWrap.innerHTML = sls.map(function(_, i) {
            return '<button class="sas-dot' + (i === _sasIdx ? ' on' : '') + '" onclick="sasGoTo(' + i + ')"></button>';
        }).join('');
    }
    if (counter) counter.textContent = (_sasIdx + 1) + '/' + sls.length;
    var fill = document.getElementById('sasProgFill');
    if (fill) fill.style.width = ((_sasIdx + 1) / sls.length * 100) + '%';
}

function _insertOnlineSlideToSas() { _showOnlyOnlineSlide(); }

function _removeOnlineSlideFromSas() { _showOnlyLocalSlides(); }

function sasGoTo(idx) {
    var slides = document.querySelectorAll('#sasTrack .sas-slide');
    if (!slides.length) return;
    _sasIdx = (idx + slides.length) % slides.length;
    document.getElementById('sasTrack').style.transform = 'translateX(-' + (_sasIdx * 100) + '%)';
    document.querySelectorAll('#sasDots .sas-dot').forEach(function(d, i) { d.classList.toggle('on', i === _sasIdx); });
    var counter = document.getElementById('sasCounter');
    if (counter) counter.textContent = (_sasIdx + 1) + '/' + slides.length;
    var fill = document.getElementById('sasProgFill');
    if (fill) fill.style.width = ((_sasIdx + 1) / slides.length * 100) + '%';
}

function sasSlide(dir) {
    sasGoTo(_sasIdx + dir);
    startSasAuto();
}

function startSasAuto() {
    if (_sasTimer) clearInterval(_sasTimer);
    try {
        var _sl=JSON.parse(localStorage.getItem('_da_slider_settings')||'{}');
        if(_sl.sasAuto===false)return;
        _sasTimer=setInterval(function(){sasGoTo(_sasIdx+1);},((_sl.sasTime||3)*1000));
    }catch(e){_sasTimer=setInterval(function(){sasGoTo(_sasIdx+1);},3000);}
}

function addSasTouch() {
    var el = document.getElementById('smartAdviceSlider');
    if (!el || el._sasTouchBound) return;
    el._sasTouchBound = true;
    var sx = 0;
    el.addEventListener('touchstart', function(e) { sx = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function(e) {
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) { sasGoTo(_sasIdx + (dx < 0 ? 1 : -1)); startSasAuto(); }
    }, { passive: true });
}

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════

function getBadgeData(sr, er) {
    if (sr >= 40) return { icon:'👑', title:'মহান সঞ্চয়কারী 👑', desc:'আয়ের ৪০%+ সঞ্চয়!',          color:'linear-gradient(135deg,#f59e0b,#d97706)' };
    if (sr >= 30) return { icon:'🌟', title:'সুপার সেভার 🌟',      desc:'আয়ের ৩০%+ সঞ্চয়!',          color:'linear-gradient(135deg,#8b5cf6,#7c3aed)' };
    if (sr >= 20) return { icon:'💎', title:'স্মার্ট সেভার 💎',     desc:'দুর্দান্ত সঞ্চয়ের অভ্যাস!', color:'linear-gradient(135deg,#3b82f6,#2563eb)' };
    if (sr >= 15) return { icon:'💚', title:'ভালো সেভার 💚',        desc:'সঞ্চয় চালিয়ে যান!',         color:'linear-gradient(135deg,#10b981,#059669)' };
    if (er < 40)  return { icon:'🎯', title:'ব্যয় নিয়ন্ত্রক 🎯',  desc:'খরচ দুর্দান্ত নিয়ন্ত্রণে!', color:'linear-gradient(135deg,#10b981,#059669)' };
    if (er < 60)  return { icon:'✅', title:'ভালো ব্যালেন্স ✅',    desc:'আয়-ব্যয় সুষম আছে',          color:'linear-gradient(135deg,#3b82f6,#2563eb)' };
    if (er > 90)  return { icon:'🚨', title:'জরুরি পদক্ষেপ 🚨',    desc:'খরচ কমান এখনই',              color:'linear-gradient(135deg,#ef4444,#dc2626)' };
    return { icon:'📊', title:'ট্র্যাক করুন 📊', desc:'হিসাব রাখা চালিয়ে যান', color:'linear-gradient(135deg,#8b5cf6,#6d28d9)' };
}

function getSavingsTip(rate) {
    if (rate >= 30) return { icon:'🎉', title:'অসাধারণ সঞ্চয়! '   + rate.toFixed(1) + '%', desc:'আপনি দুর্দান্ত করছেন!',       color:'linear-gradient(135deg,#10b981,#059669)' };
    if (rate >= 20) return { icon:'🎊', title:'দুর্দান্ত সঞ্চয়! '   + rate.toFixed(1) + '%', desc:'চমৎকার সঞ্চয়ের হার!',       color:'linear-gradient(135deg,#3b82f6,#2563eb)' };
    if (rate >= 10) return { icon:'💰', title:'ভালো সঞ্চয় '        + rate.toFixed(1) + '%', desc:'আরও বাড়ানোর চেষ্টা করুন', color:'linear-gradient(135deg,#f59e0b,#d97706)' };
    if (rate > 0)   return { icon:'💡', title:'সঞ্চয় হার মাত্র '   + rate.toFixed(1) + '%', desc:'লক্ষ্য ১৫-২০% রাখুন',      color:'linear-gradient(135deg,#f59e0b,#ea580c)' };
    return { icon:'💡', title:'সঞ্চয় শূন্য!', desc:'আজই সঞ্চয় শুরু করুন', color:'linear-gradient(135deg,#ef4444,#dc2626)' };
}

function getExpenseTip(rate) {
    if (rate <= 40) return { icon:'🎯', title:'ব্যয় মাত্র '           + rate.toFixed(1) + '%', desc:'অসাধারণ খরচ নিয়ন্ত্রণ!',   color:'linear-gradient(135deg,#10b981,#059669)' };
    if (rate <= 60) return { icon:'✅', title:'ব্যয় '                 + rate.toFixed(1) + '% — ঠিকঠাক', desc:'ভালো নিয়ন্ত্রণে আছে', color:'linear-gradient(135deg,#3b82f6,#2563eb)' };
    if (rate <= 80) return { icon:'⚠️', title:'ব্যয় '                + rate.toFixed(1) + '% — বেশি',  desc:'কিছু খরচ কমানো দরকার', color:'linear-gradient(135deg,#f59e0b,#d97706)' };
    return { icon:'🚨', title:'ব্যয় ' + rate.toFixed(1) + '% — অতিরিক্ত!', desc:'জরুরি ভিত্তিতে খরচ কমান', color:'linear-gradient(135deg,#ef4444,#dc2626)' };
}

function calcHealthScore(income, expense, savings) {
    if (income <= 0) return 0;
    var s = 0;
    s += Math.min(40, (savings / income) * 100 * 1.5);
    s += Math.max(0, 40 - (expense / income) * 100 * 0.4);
    s += 20;
    return Math.round(Math.min(100, Math.max(0, s)));
}

function fmtN(n) {
    if (!n || isNaN(n)) return '০';
    return Math.abs(n).toLocaleString('bn-BD');
}

// ══════════════════════════════════════════════
//  LEGACY SUPPORT
// ══════════════════════════════════════════════

function loadSmartAdvice(income, expense, balance, savings, unpaidDena, unpaidPabona) {
    var el = document.getElementById('adviceText');
    if (!el) return;
    var sr = income > 0 ? (savings / income) * 100 : 0;
    var dr = income > 0 ? (unpaidDena / income) * 100 : 0;
    var pool;
    if (expense > income * 2)           pool = ADVICE_POOL.critical;
    else if (expense > income)          pool = ADVICE_POOL.warning;
    else if (dr > 30)                   pool = ADVICE_POOL.debt_high;
    else if (savings === 0 && income>0) pool = ADVICE_POOL.savings_zero;
    else if (sr < 10 && income > 0)    pool = ADVICE_POOL.savings_low;
    else if (sr >= 20)                  pool = ADVICE_POOL.great;
    else                                pool = ADVICE_POOL.good;
    var item = pool[Math.floor(Math.random() * pool.length)];
    el.textContent = item ? item.txt : '';
}

function loadSmartBadge(income, expense, savings) {
    var el = document.getElementById('badgeTitle');
    if (!el) return;
    var d = getBadgeData(
        income > 0 ? (savings / income) * 100 : 0,
        income > 0 ? (expense / income) * 100 : 0
    );
    el.textContent = d.title;
    var de = document.getElementById('badgeDesc');   if (de) de.textContent = d.desc;
    var ie = document.querySelector('#smartBadge .badge-icon'); if (ie) ie.textContent = d.icon;
}

// ══════════════════════════════════════════════
//  EXTENDED ADVICE POOL — বিস্তারিত আর্থিক পরামর্শ
// ══════════════════════════════════════════════

var EXTENDED_TIPS = {
    food: [
        { ico:'🍚', txt:'ভাতের সাথে ডাল-সবজি — সস্তা, পুষ্টিকর ও সাশ্রয়ী। রোজ বাইরে না খেলে মাসে ৩,০০০-৫,০০০ টাকা বাঁচবে।', cat:'খাবার খরচ' },
        { ico:'🛒', txt:'সপ্তাহে একদিন বাজার করুন। প্রতিদিন বাজারে গেলে বেশি খরচ হয়। তালিকা ধরে কিনুন।', cat:'বাজার' },
        { ico:'🥘', txt:'মাসে রান্নার তেল, মসলা একসাথে কিনুন। খুচরা কেনায় বেশি দাম দিতে হয়।', cat:'রান্নাঘর' },
        { ico:'☕', txt:'প্রতিদিনের চা-কফি বাইরে না খেয়ে বাড়িতে বানান। মাসে ৫০০-১,০০০ টাকা বাঁচবে।', cat:'পানীয়' },
        { ico:'🍱', txt:'অফিসে টিফিন নিয়ে যান। বাইরের খাবারে প্রতিদিন ১০০-২০০ টাকা বেশি যায়।', cat:'অফিস খাবার' },
        { ico:'🥦', txt:'মৌসুমি শাকসবজি কিনুন। দাম কম, পুষ্টি বেশি। ফ্রিজে রেখে সপ্তাহ ধরে খান।', cat:'সবজি' },
        { ico:'🐟', txt:'মাছ-মাংস বেশি কিনে ফ্রিজে রাখুন। খুচরা বাজারের চেয়ে পাইকারিতে সস্তা।', cat:'প্রোটিন' },
        { ico:'🎂', txt:'জন্মদিন বা বিশেষ অনুষ্ঠানে বাইরে অর্ডার না দিয়ে বাড়িতে রান্না করুন।', cat:'উৎসব' }
    ],
    transport: [
        { ico:'🚌', txt:'বাস বা ট্রেনে যাতায়াত করুন। রিকশা-সিএনজিতে মাসে অনেক বেশি খরচ হয়।', cat:'যানবাহন' },
        { ico:'🚲', txt:'কাছের দূরত্বে সাইকেল বা হেঁটে যান। স্বাস্থ্য ভালো থাকবে, পয়সাও বাঁচবে।', cat:'কাছের পথ' },
        { ico:'🚗', txt:'কারপুল করুন। অফিসের সহকর্মীদের সাথে গাড়ি শেয়ার করলে জ্বালানি খরচ অর্ধেক হবে।', cat:'কারপুল' },
        { ico:'⛽', txt:'গাড়ি থাকলে মাইলেজ হিসাব রাখুন। অপ্রয়োজনীয় ট্রিপ এড়িয়ে চলুন।', cat:'জ্বালানি' },
        { ico:'🗺️', txt:'বের হওয়ার আগে রুট পরিকল্পনা করুন। এলোমেলো ঘুরলে সময় ও টাকা দুটোই নষ্ট।', cat:'পরিকল্পনা' },
        { ico:'🏍️', txt:'মোটরসাইকেলের সার্ভিসিং নিয়মিত করুন। অবহেলায় বড় মেরামত খরচ লাগে।', cat:'রক্ষণাবেক্ষণ' }
    ],
    utility: [
        { ico:'💡', txt:'ব্যবহার না করলে লাইট, ফ্যান বন্ধ রাখুন। মাসে ২০০-৫০০ টাকা বিদ্যুৎ বিল কমবে।', cat:'বিদ্যুৎ' },
        { ico:'🚿', txt:'দীর্ঘ গোসল কমিয়ে আনুন। প্রতি মিনিটে অনেক পানি নষ্ট হয়, পানির বিলও বাড়ে।', cat:'পানি' },
        { ico:'❄️', txt:'এসি ২৪-২৫ ডিগ্রিতে রাখুন। প্রতি ডিগ্রি বাড়ালে বিদ্যুৎ বিল ৬% কমে।', cat:'এসি' },
        { ico:'📱', txt:'মোবাইল ডেটা প্যাকেজ বুদ্ধিমত্তার সাথে বেছে নিন। অতিরিক্ত প্যাকেজে টাকা নষ্ট।', cat:'মোবাইল' },
        { ico:'🌐', txt:'ইন্টারনেট বিল কমাতে প্রতিবেশীদের সাথে ভাগ করে নিন। একই সংযোগ শেয়ার করুন।', cat:'ইন্টারনেট' },
        { ico:'🔌', txt:'স্ট্যান্ডবাই মোডে থাকা যন্ত্রপাতি বন্ধ রাখুন। এভাবে মাসে ৫-১০% বিদ্যুৎ বাঁচে।', cat:'যন্ত্রপাতি' },
        { ico:'🌙', txt:'রাতে গ্যাস ব্যবহার করুন — চাপ বেশি থাকে, রান্না দ্রুত হয়, গ্যাস কম লাগে।', cat:'গ্যাস' }
    ],
    clothing: [
        { ico:'👗', txt:'সিজনের শেষে পোশাক কিনুন। ৩০-৫০% ছাড় পাবেন। পরের মৌসুমের জন্য রাখুন।', cat:'পোশাক' },
        { ico:'👟', txt:'জুতা মেরামত করুন, প্রতিবার নতুন কিনবেন না। ভালো মুচি খুঁজে নিন।', cat:'জুতা' },
        { ico:'🧵', txt:'পোশাক ছিঁড়লে সেলাই করুন। ছোট ছেঁড়া মেরামতে মাত্র ৫০-১০০ টাকা লাগে।', cat:'মেরামত' },
        { ico:'🎽', txt:'কম পোশাক কিনুন, ভালো মানের কিনুন। সস্তা পোশাক বারবার কিনতে হয়।', cat:'মানসম্পন্ন' },
        { ico:'🛍️', txt:'সেল ছাড়া শপিং মল থেকে না কিনে রাস্তার বাজার থেকে কিনুন। ৫০% সাশ্রয় হবে।', cat:'বাজার' },
        { ico:'👔', txt:'কর্মক্ষেত্রের পোশাক ঘরে পরবেন না। দীর্ঘস্থায়ী হবে, বারবার কিনতে হবে না।', cat:'যত্ন' }
    ],
    health: [
        { ico:'🏃', txt:'নিয়মিত হাঁটুন বা ব্যায়াম করুন। সুস্থ থাকলে ডাক্তার খরচ অনেক কমে যাবে।', cat:'সুস্বাস্থ্য' },
        { ico:'💊', txt:'ডাক্তার ওষুধ লিখলে জেনেরিক ওষুধ চান। একই কার্যকারিতা, দাম ৫০-৭০% কম।', cat:'ওষুধ' },
        { ico:'🏥', txt:'সরকারি হাসপাতালে গেলে বিনামূল্যে বা সামান্য খরচে চিকিৎসা পাবেন।', cat:'চিকিৎসা' },
        { ico:'🦷', txt:'দাঁতের যত্ন নিন। নিয়মিত ব্রাশ না করলে পরে হাজার টাকার চিকিৎসা লাগবে।', cat:'দাঁত' },
        { ico:'🥗', txt:'পুষ্টিকর খাবার খান। অসুস্থ হলে কাজ হারানো ও ওষুধে অনেক বেশি খরচ হয়।', cat:'পুষ্টি' },
        { ico:'😴', txt:'পর্যাপ্ত ঘুমান। ঘুম কম হলে উৎপাদনশীলতা কমে, মানসিক চাপ বাড়ে।', cat:'বিশ্রাম' },
        { ico:'🚬', txt:'ধূমপান ছাড়ুন। প্রতিদিনের সিগারেট খরচ মাসে হাজার টাকা, স্বাস্থ্যও ভালো থাকবে।', cat:'অভ্যাস' }
    ],
    education: [
        { ico:'📚', txt:'সন্তানের পড়াশোনায় বিনিয়োগ করুন। এটা সবচেয়ে লাভজনক বিনিয়োগ।', cat:'শিক্ষা' },
        { ico:'🎓', txt:'সরকারি বৃত্তির সুযোগ নিন। প্রতিভাবান সন্তানের পড়ার খরচ কমে যাবে।', cat:'বৃত্তি' },
        { ico:'💻', txt:'ইউটিউব ও অনলাইন কোর্সে বিনামূল্যে দক্ষতা বাড়ান। নতুন আয়ের পথ খুলবে।', cat:'অনলাইন' },
        { ico:'📖', txt:'লাইব্রেরি থেকে বই ধার নিন। প্রতিটি বই না কিনলে মাসে হাজার টাকা বাঁচবে।', cat:'বই' },
        { ico:'🏫', txt:'টিউশনি খরচ কমাতে গ্রুপ স্টাডি করুন। বন্ধুরা মিলে পড়লে সবারই উপকার।', cat:'টিউটর' },
        { ico:'🔬', txt:'কারিগরি শিক্ষায় বিনিয়োগ করুন। দ্রুত চাকরি পাওয়া যায়, আয়ও ভালো।', cat:'কারিগরি' }
    ],
    entertainment: [
        { ico:'🎬', txt:'সিনেমা হলে না গিয়ে অনলাইনে দেখুন। একটি সাবস্ক্রিপশনে পরিবার মিলে দেখুন।', cat:'বিনোদন' },
        { ico:'🎮', txt:'ভিডিও গেম কেনার আগে ভাবুন। পুরনো গেম শেষ করুন, তারপর নতুন কিনুন।', cat:'গেম' },
        { ico:'📺', txt:'একাধিক স্ট্রিমিং সার্ভিস না রেখে একটাতে সীমাবদ্ধ থাকুন।', cat:'স্ট্রিমিং' },
        { ico:'🏞️', txt:'বিনোদনে পার্ক বা নদীর ধারে যান। বিনামূল্যে পরিবারের সাথে সময় কাটান।', cat:'প্রকৃতি' },
        { ico:'📰', txt:'পত্রিকার ডিজিটাল সংস্করণ পড়ুন। অনলাইনে বিনামূল্যে অনেক খবর পাওয়া যায়।', cat:'সংবাদ' },
        { ico:'🎵', txt:'মিউজিক সার্ভিসের ফ্রি ভার্সন ব্যবহার করুন। বিজ্ঞাপন দেখলেই হলো।', cat:'সঙ্গীত' }
    ],
    housing: [
        { ico:'🏠', txt:'ভাড়া বাসায় থাকলে চুক্তির মেয়াদ শেষে বাড়িওয়ালার সাথে দরদাম করুন।', cat:'বাড়িভাড়া' },
        { ico:'🔧', txt:'ছোট ঘরের মেরামত নিজে করুন। ইউটিউব দেখে শিখুন — মিস্ত্রি খরচ বাঁচান।', cat:'মেরামত' },
        { ico:'🛋️', txt:'আসবাবপত্র পুরনো কিনুন বা বানিয়ে নিন। নতুনের চেয়ে অনেক সস্তা।', cat:'আসবাব' },
        { ico:'🌿', txt:'বাড়িতে ছোট সবজি বাগান করুন। ধনেপাতা, মরিচ, টমেটো — খরচ শূন্য।', cat:'বাগান' },
        { ico:'🧹', txt:'পরিষ্কার-পরিচ্ছন্নতায় গৃহকর্মী না রেখে পরিবারের সবাই মিলে করুন।', cat:'পরিষ্কার' },
        { ico:'🏘️', txt:'ভালো এলাকায় ছোট বাসায় থাকুন। বড় বাসার বেশি ভাড়া সঞ্চয় কমায়।', cat:'বাসস্থান' }
    ],
    income_boost: [
        { ico:'💼', txt:'ফ্রিল্যান্সিং শুরু করুন। গ্রাফিক ডিজাইন, লেখালেখি, প্রোগ্রামিং — অনলাইনে আয় করুন।', cat:'ফ্রিল্যান্স' },
        { ico:'📦', txt:'পুরনো জিনিস অনলাইনে বিক্রি করুন। ফেসবুক মার্কেটপ্লেস বা বিডিশপে দিন।', cat:'বিক্রি' },
        { ico:'🌾', txt:'কৃষি বা পোলট্রিতে ছোট বিনিয়োগ করুন। গ্রামে জমি থাকলে আয় বাড়ান।', cat:'কৃষি' },
        { ico:'🎨', txt:'হস্তশিল্প বা হোম বেকিং শুরু করুন। সোশ্যাল মিডিয়ায় বিক্রি করুন।', cat:'উদ্যোগ' },
        { ico:'🚕', txt:'অবসর সময়ে রাইড শেয়ারিং করুন। মোটরসাইকেল থাকলে পাথাও বা উবারে যোগ দিন।', cat:'রাইড' },
        { ico:'📝', txt:'টিউশনি করুন। বাড়তি আয়ের সহজ পথ — নিজের এলাকায় ছাত্র পাওয়া সহজ।', cat:'টিউশন' },
        { ico:'💰', txt:'দক্ষতা বাড়িয়ে বেতন বাড়ান। বস্কে জিজ্ঞেস করুন কী করলে বেতন বাড়বে।', cat:'ক্যারিয়ার' },
        { ico:'🏪', txt:'ছোট ব্যবসা শুরু করুন। চায়ের দোকান, মুদি দোকান — কম পুঁজিতে শুরু হয়।', cat:'ব্যবসা' }
    ],
    planning: [
        { ico:'📅', txt:'বার্ষিক পরিকল্পনা করুন। ঈদ, পূজা, বিয়ে — আগে থেকে জানা খরচ আলাদা রাখুন।', cat:'পরিকল্পনা' },
        { ico:'🎯', txt:'৩ মাস, ৬ মাস, ১ বছরের আর্থিক লক্ষ্য নির্ধারণ করুন এবং লিখে রাখুন।', cat:'লক্ষ্য' },
        { ico:'💳', txt:'ক্রেডিট কার্ড ব্যবহারে সতর্ক থাকুন। মাস শেষে পুরো বিল পরিশোধ করুন।', cat:'ক্রেডিট' },
        { ico:'📊', txt:'মাসের প্রথম দিন বাজেট বানান। প্রতিটি খাতে সীমা নির্ধারণ করুন।', cat:'বাজেট' },
        { ico:'🔄', txt:'প্রতি ৬ মাসে আর্থিক পর্যালোচনা করুন। কী ঠিক হলো, কী পরিবর্তন দরকার।', cat:'পর্যালোচনা' },
        { ico:'👨‍👩‍👧', txt:'পরিবারের সবার সাথে আর্থিক বিষয় আলোচনা করুন। একসাথে সিদ্ধান্ত নিন।', cat:'পরিবার' },
        { ico:'📋', txt:'উইল বা মনোনয়ন আপডেট রাখুন। যেকোনো অঘটনে পরিবার সুরক্ষিত থাকবে।', cat:'ভবিষ্যৎ' }
    ],
    investment_basics: [
        { ico:'🏦', txt:'ডিপিএস (DPS) খুলুন। প্রতি মাসে নির্দিষ্ট টাকা জমবে, সুদ পাবেন।', cat:'DPS' },
        { ico:'📜', txt:'সঞ্চয়পত্র কিনুন। সরকারি গ্যারান্টিসহ ভালো সুদ — নিরাপদ বিনিয়োগ।', cat:'সঞ্চয়পত্র' },
        { ico:'🏢', txt:'FDR (Fixed Deposit) করুন। ৩-১২ মাসের মেয়াদে ভালো সুদ পাওয়া যায়।', cat:'FDR' },
        { ico:'📈', txt:'শেয়ার বাজারে বিনিয়োগ ঝুঁকিপূর্ণ। আগে বুঝুন, তারপর বিশ্বস্ত কোম্পানিতে বিনিয়োগ করুন।', cat:'শেয়ার' },
        { ico:'🌾', txt:'জমি কিনুন দীর্ঘমেয়াদে। মূল্য বাড়ে, ভাড়া দিতে পারবেন।', cat:'জমি' },
        { ico:'🥇', txt:'সোনা কিনুন সঞ্চয় হিসেবে। মুদ্রাস্ফীতির বিরুদ্ধে ভালো সুরক্ষা।', cat:'সোনা' },
        { ico:'💻', txt:'ডিজিটাল সেবা বা সফটওয়্যার ব্যবসায় বিনিয়োগ করুন। ভবিষ্যৎ এখানেই।', cat:'ডিজিটাল' }
    ],
    emergency_fund: [
        { ico:'🛡️', txt:'৩ মাসের খরচের সমান জরুরি তহবিল রাখুন। চাকরি গেলেও টিকে থাকতে পারবেন।', cat:'জরুরি তহবিল' },
        { ico:'🏦', txt:'জরুরি তহবিল আলাদা অ্যাকাউন্টে রাখুন। সাধারণ খরচের টাকার সাথে মেলাবেন না।', cat:'আলাদা রাখুন' },
        { ico:'🚑', txt:'স্বাস্থ্য বীমা করুন। অসুস্থতায় লক্ষ টাকার চিকিৎসা থেকে সুরক্ষা পাবেন।', cat:'বীমা' },
        { ico:'🔥', txt:'অগ্নিকাণ্ড বা বন্যায় ক্ষতির জন্য বাড়ির বীমা করুন।', cat:'সম্পত্তি বীমা' },
        { ico:'💼', txt:'জীবন বীমা করুন। পরিবারের প্রধান উপার্জনকারীর বীমা অবশ্যই করা উচিত।', cat:'জীবন বীমা' }
    ],
    debt_management: [
        { ico:'📉', txt:'সুদসহ দেনা তাড়াতাড়ি শোধ করুন। যত দেরি, তত বেশি সুদ দিতে হবে।', cat:'সুদ' },
        { ico:'⚖️', txt:'একসাথে একাধিক দেনা থাকলে সবচেয়ে বেশি সুদওয়ালা দেনা আগে শোধ করুন।', cat:'অগ্রাধিকার' },
        { ico:'🤝', txt:'দেনাদারের সাথে কিস্তিতে পরিশোধের চুক্তি করুন। একবারে পারলে ছাড় চান।', cat:'কিস্তি' },
        { ico:'📱', txt:'অনলাইন লোনের ফাঁদে পড়বেন না। সুদের হার অনেক বেশি — বিপদ হতে পারে।', cat:'ডিজিটাল লোন' },
        { ico:'🏦', txt:'ব্যাংক লোন নিলে সুদের হার তুলনা করুন। কম সুদে লোন নেওয়ার চেষ্টা করুন।', cat:'ব্যাংক লোন' },
        { ico:'👨‍👩‍👧', txt:'পরিবার থেকে ধার নিলে সুদ না দিলেও সময়মতো ফেরত দিন। সম্পর্ক ভালো রাখুন।', cat:'পারিবারিক ঋণ' }
    ],
    seasonal: [
        { ico:'🎊', txt:'ঈদের আগে থেকে প্রতি মাসে একটু করে সঞ্চয় করুন। হঠাৎ বড় খরচের ধাক্কা সামলাবেন।', cat:'ঈদ' },
        { ico:'🏫', txt:'স্কুল ভর্তির সময়ের খরচ আগে থেকে আলাদা রাখুন। জানুয়ারি মাসে অনেক খরচ হয়।', cat:'শিক্ষা বর্ষ' },
        { ico:'❄️', txt:'শীতকালে গরম কাপড় কিনুন। গ্রীষ্মে কিনলে অনেক সস্তায় পাবেন।', cat:'মৌসুমি' },
        { ico:'🌧️', txt:'বর্ষায় ছাদ মেরামত করুন। আগে থেকে করলে কম খরচ, পরে ক্ষতি হলে বেশি লাগে।', cat:'বর্ষা' },
        { ico:'🎓', txt:'পরীক্ষার ফি, কোচিং খরচ বছরের শুরুতে বাজেটে ধরুন। পরে চাপ কম থাকবে।', cat:'পরীক্ষা' },
        { ico:'💒', txt:'বিয়ের মৌসুমে উপহার খরচ বাড়ে। আগে থেকে ঠিক করুন কতটুকু দেবেন।', cat:'বিবাহ' }
    ]
};

// ══════════════════════════════════════════════
//  MONTHLY EXPENSE CATEGORIES REFERENCE
//  বাংলাদেশের গড় পরিবারের মাসিক বাজেট গাইড
// ══════════════════════════════════════════════

var MONTHLY_BUDGET_GUIDE = {
    low_income: {    // মাসিক আয় ১৫,০০০ টাকার কম
        label: 'স্বল্প আয়ের পরিবার',
        categories: [
            { name:'খাদ্য',          pct:45, avg:6750,  tip:'চাল, ডাল, সবজি ঘরে রান্না করুন' },
            { name:'বাড়িভাড়া',     pct:25, avg:3750,  tip:'ভাড়া আয়ের ২৫%-এর মধ্যে রাখুন' },
            { name:'যানবাহন',        pct:8,  avg:1200,  tip:'বাস-ট্রেনে যাতায়াত করুন' },
            { name:'শিক্ষা',         pct:8,  avg:1200,  tip:'সরকারি স্কুলে পড়ান' },
            { name:'স্বাস্থ্য',      pct:5,  avg:750,   tip:'সরকারি হাসপাতাল ব্যবহার করুন' },
            { name:'পোশাক',          pct:3,  avg:450,   tip:'সিজনে একবার কিনুন' },
            { name:'সঞ্চয়',         pct:6,  avg:900,   tip:'অন্তত ৫-১০% সঞ্চয় করুন' }
        ]
    },
    mid_income: {    // মাসিক আয় ১৫,০০০-৫০,০০০ টাকা
        label: 'মধ্যম আয়ের পরিবার',
        categories: [
            { name:'খাদ্য',          pct:35, avg:15750, tip:'বাজেট করে কেনাকাটা করুন' },
            { name:'বাড়িভাড়া',     pct:25, avg:11250, tip:'ভালো মানের ছোট বাসা নিন' },
            { name:'যানবাহন',        pct:8,  avg:3600,  tip:'প্রয়োজনে কারপুল করুন' },
            { name:'শিক্ষা',         pct:10, avg:4500,  tip:'মানসম্মত স্কুলে পড়ান' },
            { name:'স্বাস্থ্য',      pct:5,  avg:2250,  tip:'স্বাস্থ্য বীমা করুন' },
            { name:'বিনোদন',         pct:3,  avg:1350,  tip:'পরিবার নিয়ে সাশ্রয়ী বিনোদন করুন' },
            { name:'পোশাক',          pct:4,  avg:1800,  tip:'মৌসুমে একবার শপিং করুন' },
            { name:'সঞ্চয়',         pct:10, avg:4500,  tip:'১০-১৫% সঞ্চয় লক্ষ্য রাখুন' }
        ]
    },
    high_income: {   // মাসিক আয় ৫০,০০০+ টাকা
        label: 'উচ্চ আয়ের পরিবার',
        categories: [
            { name:'খাদ্য',          pct:20, avg:15000, tip:'স্বাস্থ্যকর খাবারে বিনিয়োগ করুন' },
            { name:'বাড়িভাড়া',     pct:20, avg:15000, tip:'ভালো এলাকায় থাকুন' },
            { name:'যানবাহন',        pct:10, avg:7500,  tip:'নিজের গাড়ি রক্ষণাবেক্ষণে সতর্ক' },
            { name:'শিক্ষা',         pct:12, avg:9000,  tip:'উচ্চমানের শিক্ষায় বিনিয়োগ করুন' },
            { name:'স্বাস্থ্য',      pct:5,  avg:3750,  tip:'ভালো স্বাস্থ্য বীমা নিন' },
            { name:'বিনোদন',         pct:5,  avg:3750,  tip:'পরিমিত বিনোদন উপভোগ করুন' },
            { name:'পোশাক',          pct:5,  avg:3750,  tip:'মানসম্পন্ন পোশাক দীর্ঘস্থায়ী' },
            { name:'বিনিয়োগ',       pct:20, avg:15000, tip:'শেয়ার, সঞ্চয়পত্র, জমিতে বিনিয়োগ করুন' },
            { name:'সঞ্চয়',         pct:3,  avg:2250,  tip:'জরুরি তহবিল সুরক্ষিত রাখুন' }
        ]
    }
};

// ══════════════════════════════════════════════
//  COMMON EXPENSE NAMES — বাংলাদেশে প্রচলিত ব্যয়ের নাম
// ══════════════════════════════════════════════

var COMMON_EXPENSES = {
    daily: [
        { name:'বাজার',          emoji:'🛒', typical:500  },
        { name:'রিকশা ভাড়া',    emoji:'🛺', typical:100  },
        { name:'নাস্তা',          emoji:'🍞', typical:80   },
        { name:'চা-পান',          emoji:'☕', typical:50   },
        { name:'বিদ্যুৎ বিল',    emoji:'💡', typical:800  },
        { name:'পানির বিল',      emoji:'💧', typical:200  },
        { name:'গ্যাস বিল',      emoji:'🔥', typical:300  },
        { name:'মোবাইল রিচার্জ', emoji:'📱', typical:200  },
        { name:'ইন্টারনেট',      emoji:'🌐', typical:500  },
        { name:'সন্তানের স্কুল', emoji:'🎒', typical:2000 }
    ],
    monthly_big: [
        { name:'বাসাভাড়া',       emoji:'🏠', typical:8000  },
        { name:'ছেলেমেয়ের পড়া', emoji:'📚', typical:3000  },
        { name:'ওষুধপথ্য',        emoji:'💊', typical:1000  },
        { name:'কাপড়-চোপড়',     emoji:'👗', typical:2000  },
        { name:'আত্মীয় সহায়তা', emoji:'🤝', typical:2000  },
        { name:'ঈদ বাজার',        emoji:'🎊', typical:5000  },
        { name:'বিমান টিকিট',    emoji:'✈️', typical:15000 },
        { name:'চিকিৎসা খরচ',    emoji:'🏥', typical:3000  },
        { name:'বিয়ের উপহার',    emoji:'💒', typical:3000  },
        { name:'বাড়ির মেরামত',   emoji:'🔧', typical:5000  }
    ],
    high_expenses: [
        { name:'ফ্রিজ কেনা',     emoji:'❄️', typical:35000 },
        { name:'টেলিভিশন',       emoji:'📺', typical:25000 },
        { name:'মোবাইল ফোন',     emoji:'📱', typical:20000 },
        { name:'মোটরসাইকেল',     emoji:'🏍️', typical:120000 },
        { name:'ল্যাপটপ',         emoji:'💻', typical:50000 },
        { name:'এসি মেশিন',      emoji:'❄️', typical:45000 },
        { name:'বিয়ের অনুষ্ঠান', emoji:'💒', typical:200000 },
        { name:'ফ্ল্যাট কেনা',   emoji:'🏢', typical:3000000 },
        { name:'গাড়ি কেনা',      emoji:'🚗', typical:1500000 },
        { name:'জমি কেনা',        emoji:'🌾', typical:500000 }
    ]
};

// ══════════════════════════════════════════════
//  FINANCIAL WISDOM QUOTES — আর্থিক জ্ঞান উক্তি
// ══════════════════════════════════════════════

var FINANCIAL_QUOTES = [
    { quote:'টাকা আসা-যাওয়ার হিসাব রাখো, তাহলে টাকা তোমার কাছে থাকবে।', source:'প্রবাদ' },
    { quote:'আজ বাঁচাও, কাল স্বাধীন থাকো।', source:'আর্থিক নীতি' },
    { quote:'ধনীরা টাকা বিনিয়োগ করে, গরিবরা টাকা খরচ করে।', source:'আর্থিক জ্ঞান' },
    { quote:'আয়ের কম খরচ করাটাই আসল দক্ষতা।', source:'বাজেট নীতি' },
    { quote:'ঋণমুক্ত জীবনই সুখী জীবন।', source:'প্রবাদ' },
    { quote:'সঞ্চয় হলো ভবিষ্যতের নিরাপত্তা।', source:'আর্থিক নীতি' },
    { quote:'ছোট ছোট সাশ্রয় একদিন বড় সম্পদ হয়।', source:'প্রবাদ' },
    { quote:'টাকা গাছে ধরে না, উপার্জন করতে হয়।', source:'প্রবাদ' },
    { quote:'আজকের বিনিয়োগ আগামীর আয়।', source:'বিনিয়োগ নীতি' },
    { quote:'কম আয়ে বেশি সুখ পেতে হলে কম খরচে অভ্যস্ত হতে হবে।', source:'জীবন দর্শন' },
    { quote:'বাজেট হলো ভবিষ্যৎ পরিকল্পনার মানচিত্র।', source:'আর্থিক পরামর্শ' },
    { quote:'নিজের প্রয়োজন আর ইচ্ছার মধ্যে পার্থক্য বোঝো।', source:'বুদ্ধিমান ব্যয়' }
];

// ══════════════════════════════════════════════
//  SMART ALERT THRESHOLDS — সতর্কতার মাত্রা
// ══════════════════════════════════════════════

var ALERT_THRESHOLDS = {
    expense_ratio: {
        safe:    { max: 60,  label:'✅ নিরাপদ',      color:'#10b981', advice:'খরচ আয়ের ৬০%-এর কম — ভালো অবস্থানে আছেন।' },
        caution: { max: 80,  label:'⚠️ সতর্কতা',    color:'#f59e0b', advice:'খরচ আয়ের ৮০%-এর কাছে — কিছু কমানো উচিত।' },
        warning: { max: 100, label:'🔴 বিপদসীমা',   color:'#ef4444', advice:'খরচ আয়ের কাছাকাছি — জরুরি পদক্ষেপ নিন।' },
        crisis:  { max: 999, label:'🚨 সংকট',       color:'#dc2626', advice:'খরচ আয় ছাড়িয়ে গেছে — এখনই থামুন!' }
    },
    savings_ratio: {
        poor:    { min: 0,   max: 5,  label:'😟 অপ্রতুল',   color:'#ef4444' },
        low:     { min: 5,   max: 10, label:'😐 কম',         color:'#f59e0b' },
        fair:    { min: 10,  max: 20, label:'🙂 গ্রহণযোগ্য', color:'#3b82f6' },
        good:    { min: 20,  max: 30, label:'😊 ভালো',       color:'#10b981' },
        great:   { min: 30,  max: 40, label:'😄 দারুণ',      color:'#8b5cf6' },
        super:   { min: 40,  max: 999,label:'🏆 অসাধারণ',   color:'#f59e0b' }
    },
    dena_ratio: {
        safe:    { max: 10,  label:'✅ সহনীয়',      advice:'দেনা নিয়ন্ত্রণে আছে।' },
        medium:  { max: 30,  label:'⚠️ মাঝারি',     advice:'দেনা একটু বেশি — পরিশোধের পরিকল্পনা করুন।' },
        high:    { max: 50,  label:'🔴 বেশি',        advice:'দেনার বোঝা ভারী — অগ্রাধিকার দিয়ে শোধ করুন।' },
        crisis:  { max: 999, label:'🚨 বিপজ্জনক',  advice:'দেনা আয়ের ৫০%+ — জরুরি পদক্ষেপ নিন!' }
    }
};

// ══════════════════════════════════════════════
//  HELPER: Extended tip selector
// ══════════════════════════════════════════════

function getExtendedTip(category) {
    var pool = EXTENDED_TIPS[category];
    if (!pool || !pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

function getAlertLevel(ratio, thresholdObj) {
    var keys = Object.keys(thresholdObj);
    for (var i = 0; i < keys.length; i++) {
        var t = thresholdObj[keys[i]];
        if (ratio <= (t.max !== undefined ? t.max : 999)) return t;
    }
    return thresholdObj[keys[keys.length - 1]];
}

function getRandomQuote() {
    return FINANCIAL_QUOTES[Math.floor(Math.random() * FINANCIAL_QUOTES.length)];
}

// ══════════════════════════════════════════════
//  INCOME SOURCES — আয়ের উৎস তালিকা
// ══════════════════════════════════════════════

var INCOME_SOURCES = {
    employment: [
        { name:'মূল বেতন',          emoji:'💼', frequency:'মাসিক',    tip:'বেতনের তারিখ মনে রাখুন। পাওয়ার সাথে সাথে বাজেট করুন।' },
        { name:'ওভারটাইম ভাতা',     emoji:'⏰', frequency:'মাসিক',    tip:'ওভারটাইমের টাকা সঞ্চয়ে রাখুন — নিয়মিত আয় নয়।' },
        { name:'বোনাস',              emoji:'🎁', frequency:'বার্ষিক',   tip:'বোনাস পেলে আগে দেনা শোধ করুন, বাকিটা সঞ্চয়।' },
        { name:'উৎসব ভাতা',         emoji:'🎊', frequency:'বার্ষিক',   tip:'ঈদ ভাতা আগের মাস থেকে পরিকল্পনা করুন।' },
        { name:'চিকিৎসা ভাতা',      emoji:'💊', frequency:'মাসিক',    tip:'ভাতার টাকা স্বাস্থ্য বীমায় রাখুন।' },
        { name:'যাতায়াত ভাতা',      emoji:'🚌', frequency:'মাসিক',    tip:'প্রকৃত যাতায়াত কম হলে বাকিটা সঞ্চয়ে।' },
        { name:'বাড়িভাড়া ভাতা',   emoji:'🏠', frequency:'মাসিক',    tip:'ভাতার বেশি ভাড়া দেবেন না।' }
    ],
    business: [
        { name:'দোকানের আয়',        emoji:'🏪', frequency:'দৈনিক',    tip:'প্রতিদিনের বিক্রির হিসাব রাখুন।' },
        { name:'কৃষি আয়',           emoji:'🌾', frequency:'মৌসুমী',   tip:'ফসল বিক্রির সময় ভালো দাম পেতে অপেক্ষা করুন।' },
        { name:'পোলট্রি-মৎস্য',     emoji:'🐔', frequency:'মাসিক',    tip:'উৎপাদন খরচ হিসাব করুন। লাভ হলে সম্প্রসারণ করুন।' },
        { name:'ফ্রিল্যান্স আয়',    emoji:'💻', frequency:'অনিয়মিত', tip:'ফ্রিল্যান্স আয় অনিয়মিত — জরুরি তহবিল বেশি রাখুন।' },
        { name:'পরিবহন আয়',         emoji:'🚕', frequency:'দৈনিক',   tip:'জ্বালানি ও মেরামত খরচ আলাদা রাখুন।' },
        { name:'হোম বেকিং/কেটারিং', emoji:'🍰', frequency:'অনিয়মিত', tip:'অর্ডার অনুযায়ী কিনুন। অতিরিক্ত কিনবেন না।' }
    ],
    passive: [
        { name:'বাড়িভাড়া আয়',     emoji:'🏘️', frequency:'মাসিক',   tip:'ভাড়াটে বাছাইয়ে সতর্ক থাকুন। চুক্তি লিখিত রাখুন।' },
        { name:'ব্যাংক সুদ',         emoji:'🏦', frequency:'মাসিক',   tip:'FDR বা DPS-এ সুদের হার তুলনা করুন।' },
        { name:'সঞ্চয়পত্র মুনাফা',  emoji:'📜', frequency:'ত্রৈমাসিক', tip:'মেয়াদ পূর্তিতে পুনরায় বিনিয়োগ করুন।' },
        { name:'শেয়ার লভ্যাংশ',     emoji:'📈', frequency:'বার্ষিক', tip:'লভ্যাংশের টাকা পুনরায় শেয়ারে বিনিয়োগ করুন।' },
        { name:'জমি লিজ আয়',        emoji:'🌿', frequency:'বার্ষিক', tip:'লিজ চুক্তি আইনি করে নিন।' }
    ],
    remittance: [
        { name:'বিদেশ থেকে রেমিট্যান্স', emoji:'🌍', frequency:'মাসিক',   tip:'ব্যাংকিং চ্যানেলে পাঠান — হুন্ডি বেআইনি ও ঝুঁকিপূর্ণ।' },
        { name:'প্রবাসী স্বজনের সহায়তা', emoji:'✈️', frequency:'অনিয়মিত', tip:'এই আয়ের উপর নির্ভর করবেন না — সঞ্চয় রাখুন।' }
    ]
};

// ══════════════════════════════════════════════
//  SAVINGS GOALS — সঞ্চয়ের লক্ষ্যসমূহ
// ══════════════════════════════════════════════

var SAVINGS_GOALS = [
    { name:'জরুরি তহবিল',       emoji:'🛡️', months:3,   desc:'৩ মাসের মোট খরচের সমান রাখুন',         priority:1 },
    { name:'সন্তানের পড়াশোনা', emoji:'🎓', months:120, desc:'বছরের পর বছর ধরে জমান',                 priority:2 },
    { name:'বাড়ি কেনা',         emoji:'🏠', months:60,  desc:'ডাউন পেমেন্টের জন্য দীর্ঘমেয়াদে জমান', priority:3 },
    { name:'ব্যবসা শুরু',        emoji:'🏪', months:24,  desc:'ব্যবসার মূলধন জমানোর লক্ষ্য',           priority:4 },
    { name:'গাড়ি কেনা',         emoji:'🚗', months:36,  desc:'লোন ছাড়া কিনতে দীর্ঘমেয়াদে জমান',     priority:5 },
    { name:'হজ/উমরাহ',          emoji:'🕌', months:48,  desc:'পবিত্র যাত্রার জন্য আলাদা সঞ্চয়',      priority:6 },
    { name:'অবসর তহবিল',        emoji:'🧓', months:240, desc:'৬০ বছরে স্বাচ্ছন্দ্যময় জীবনের জন্য',   priority:7 },
    { name:'বিয়ের খরচ',         emoji:'💒', months:18,  desc:'বিয়ের আগে থেকে জমাতে শুরু করুন',       priority:8 },
    { name:'ভ্রমণ তহবিল',       emoji:'✈️', months:12,  desc:'পরিবার নিয়ে ভ্রমণের স্বপ্ন পূরণ',      priority:9 },
    { name:'ইলেকট্রনিক্স',      emoji:'📱', months:6,   desc:'নগদে কিনুন — কিস্তিতে বেশি দাম',        priority:10 }
];

// ══════════════════════════════════════════════
//  COMMON LEDGER NAMES — প্রচলিত দেনা-পাওনার ধরন
// ══════════════════════════════════════════════

var LEDGER_TYPES = {
    dena_reasons: [
        { name:'বাজার ধার',         emoji:'🛒', tip:'বাজারের দোকানে নিয়মিত হিসাব রাখুন' },
        { name:'বন্ধুকে ধার',       emoji:'🤝', tip:'বন্ধুকে দেওয়া ধারও সময়মতো শোধ করুন' },
        { name:'আত্মীয়কে সাহায্য', emoji:'👨‍👩‍👧', tip:'পরিবারকে দেওয়া ধার সম্পর্ক রক্ষায় গুরুত্বপূর্ণ' },
        { name:'অফিস অ্যাডভান্স',   emoji:'💼', tip:'বেতন থেকে কেটে নেওয়ার ব্যবস্থা করুন' },
        { name:'ব্যাংক লোন',         emoji:'🏦', tip:'EMI তারিখ মনে রাখুন, দেরি করলে জরিমানা' },
        { name:'মোবাইল ফাইন্যান্স', emoji:'📱', tip:'উচ্চ সুদের ডিজিটাল লোন এড়িয়ে চলুন' },
        { name:'দোকানদারের বাকি',   emoji:'🏪', tip:'বাকি জমালে পরিশোধ কঠিন হয়ে পড়ে' },
        { name:'সমিতির কিস্তি',      emoji:'👥', tip:'সমিতির কিস্তি ঠিকঠাক দিলে বিশ্বাসযোগ্যতা বাড়ে' }
    ],
    pabona_reasons: [
        { name:'বন্ধুকে ধার দেওয়া',  emoji:'🤝', tip:'ধার দেওয়ার সময় রসিদ বা লিখিত রাখুন' },
        { name:'আত্মীয়কে ধার',       emoji:'👨‍👩‍👧', tip:'পারিবারিক ধার আদায়ে কৌশলী হন' },
        { name:'ব্যবসার বাকি বিক্রি', emoji:'🏪', tip:'বাকিতে বিক্রি কমান, নগদ বাড়ান' },
        { name:'বাড়িভাড়া বাকি',     emoji:'🏠', tip:'ভাড়াটে বাকি রাখলে কঠোর ব্যবস্থা নিন' },
        { name:'সার্ভিস ফি বাকি',    emoji:'🔧', tip:'কাজের আগে অগ্রিম নিন' },
        { name:'পণ্য সরবরাহের বাকি', emoji:'📦', tip:'সরবরাহের আগে পেমেন্ট নিশ্চিত করুন' }
    ]
};

// ══════════════════════════════════════════════
//  EXPENSE CATEGORY MAP — ব্যয়ের বিভাগ
// ══════════════════════════════════════════════

var EXPENSE_CATEGORIES = {
    essential: {
        label: 'অপরিহার্য ব্যয়',
        color: '#3b82f6',
        items: [
            'খাবার ও বাজার', 'বাড়িভাড়া', 'বিদ্যুৎ বিল', 'পানির বিল',
            'গ্যাস বিল', 'ওষুধ ও চিকিৎসা', 'সন্তানের পড়াশোনা',
            'যানবাহন ও যাতায়াত', 'মোবাইল বিল', 'ইন্টারনেট বিল'
        ]
    },
    lifestyle: {
        label: 'জীবনযাত্রার ব্যয়',
        color: '#8b5cf6',
        items: [
            'পোশাক ও জুতা', 'সাজসজ্জা', 'বাইরে খাওয়া', 'বিনোদন',
            'গেমস ও অ্যাপ', 'সাবস্ক্রিপশন', 'শখের সামগ্রী',
            'পোষা প্রাণী', 'গিফট ও উপহার', 'ভ্রমণ'
        ]
    },
    investment: {
        label: 'বিনিয়োগ ব্যয়',
        color: '#10b981',
        items: [
            'DPS কিস্তি', 'সঞ্চয়পত্র কেনা', 'বীমার প্রিমিয়াম',
            'ব্যবসায় বিনিয়োগ', 'শেয়ার কেনা', 'জমি-বাড়ি কেনা',
            'সরঞ্জাম কেনা', 'প্রশিক্ষণ ও কোর্স'
        ]
    },
    debt_payment: {
        label: 'দেনা পরিশোধ',
        color: '#ef4444',
        items: [
            'ব্যাংক লোনের কিস্তি', 'মোবাইল ফাইন্যান্স পরিশোধ',
            'বন্ধু-আত্মীয়ের ধার পরিশোধ', 'সমিতির কিস্তি',
            'দোকানদারের বাকি পরিশোধ', 'অফিস অ্যাডভান্স পরিশোধ'
        ]
    }
};

// ══════════════════════════════════════════════
//  FINANCIAL HEALTH CHECKLIST — আর্থিক স্বাস্থ্য যাচাই
// ══════════════════════════════════════════════

var HEALTH_CHECKLIST = [
    { id:'emergency_fund',    label:'৩ মাসের জরুরি তহবিল আছে',            weight:20, tip:'জরুরি তহবিল না থাকলে এটাই প্রথম লক্ষ্য।' },
    { id:'no_bad_debt',       label:'উচ্চ সুদের দেনা নেই',                  weight:15, tip:'ক্রেডিট কার্ড বা মোবাইল লোনের দেনা থাকলে আগে শোধ করুন।' },
    { id:'savings_habit',     label:'নিয়মিত সঞ্চয় করছি',                  weight:15, tip:'আয়ের ১০%+ সঞ্চয় করা উচিত।' },
    { id:'budget_monthly',    label:'মাসিক বাজেট তৈরি করি',                 weight:10, tip:'বাজেট না থাকলে এই অ্যাপে শুরু করুন।' },
    { id:'track_expenses',    label:'প্রতিদিনের খরচ হিসাব রাখি',           weight:10, tip:'Daily Account-এ নিয়মিত এন্ট্রি দিন।' },
    { id:'health_insurance',  label:'স্বাস্থ্য বীমা আছে',                   weight:10, tip:'পরিবারের সবার জন্য স্বাস্থ্য বীমা করুন।' },
    { id:'life_insurance',    label:'জীবন বীমা আছে',                        weight:10, tip:'পরিবারের নিরাপত্তার জন্য জীবন বীমা জরুরি।' },
    { id:'investment',        label:'কোনো বিনিয়োগ আছে',                    weight:5,  tip:'DPS, সঞ্চয়পত্র বা শেয়ারে বিনিয়োগ শুরু করুন।' },
    { id:'retirement_plan',   label:'অবসর পরিকল্পনা আছে',                  weight:5,  tip:'আজ থেকেই অবসরের জন্য সঞ্চয় শুরু করুন।' }
];

// ══════════════════════════════════════════════
//  MOTIVATIONAL MESSAGES — অনুপ্রেরণামূলক বার্তা
// ══════════════════════════════════════════════

var MOTIVATIONAL_MSGS = {
    morning: [
        'সুপ্রভাত! আজকের প্রতিটি টাকার হিসাব রাখুন। ছোট পদক্ষেপই বড় লক্ষ্যে পৌঁছায়।',
        'নতুন দিন, নতুন সুযোগ! আজ একটু বেশি সাশ্রয় করুন।',
        'শুভ সকাল! আজকের খরচ সচেতনভাবে করুন। প্রতিটি টাকা মূল্যবান।'
    ],
    evening: [
        'দিন শেষে হিসাব মেলান। আজকের খরচ যদি বাজেটে থাকে তাহলে আপনি দারুণ করছেন!',
        'সন্ধ্যার হিসাব নিকাশ! আজ কতটুকু সাশ্রয় করলেন? আগামীকাল আরও ভালো করুন।',
        'আজকের এন্ট্রি দিয়েছেন? না দিলে এখনই দিন — ভুলে গেলে হিসাব কঠিন হবে।'
    ],
    weekly: [
        'সাপ্তাহিক পর্যালোচনা করুন। এই সপ্তাহে কোথায় বেশি খরচ হলো? আগামী সপ্তাহে কমান।',
        'সপ্তাহের হিসাব মেলান। লক্ষ্যের কতটুকু অর্জন হলো? বাকিটুকু পূরণের পরিকল্পনা করুন।'
    ],
    milestone: [
        'অভিনন্দন! আপনি একটি আর্থিক মাইলফলক অর্জন করেছেন। এভাবে এগিয়ে যান!',
        'বাহ! লক্ষ্য পূরণ হয়েছে। এখন নতুন লক্ষ্য নির্ধারণ করুন — আরও উঁচুতে যান!'
    ]
};

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', loadDashboard);