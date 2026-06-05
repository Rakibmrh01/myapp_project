// ================================================================
//  Daily Account — ai-dashboard.js  v3.0
//  • হোম পেজে দিনে সর্বোচ্চ ৫টি API request (সেটিংস থেকে পরিবর্তন)
//  • Cache: একবার আনলে ৩ ঘন্টা পুনরায় ব্যবহার
//  • Multi-key: একটা 429 দিলে অটো পরবর্তী key তে যায়
//  • Retry + backoff
// ================================================================

(function () {
  'use strict';

  var CACHE_KEY    = 'aiDashCache';
  var USAGE_KEY    = 'aiDashUsage';
  var SETTINGS_KEY = 'aiDashSettings';
  var CACHE_TTL_MS = 3 * 60 * 60 * 1000;

  /* ── SETTINGS ── */
  function getSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveSettings(obj) {
    var s = getSettings();
    Object.keys(obj).forEach(function (k) { s[k] = obj[k]; });
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }
  function isDashAIEnabled() { return getSettings().dashAIEnabled !== false; }
  function getDailyLimit() {
    var v = getSettings().dashDailyLimit;
    return typeof v === 'number' ? v : 5;
  }

  /* ── MULTI-KEY ── */
  function getKeys() {
    try {
      var arr = JSON.parse(localStorage.getItem('geminiApiKeys') || '[]');
      if (Array.isArray(arr) && arr.length) return arr.filter(function (k) { return k && k.length > 10; });
      var single = localStorage.getItem('geminiApiKey') || '';
      return single ? [single] : [];
    } catch (e) { return []; }
  }
  function getKeyIdx() { return parseInt(localStorage.getItem('geminiKeyIdx') || '0', 10) || 0; }
  function setKeyIdx(i) { localStorage.setItem('geminiKeyIdx', String(i)); }
  function getCurrentKey() {
    var keys = getKeys(); if (!keys.length) return '';
    return keys[getKeyIdx() % keys.length];
  }
  function rotateKey() {
    var keys = getKeys(); if (keys.length <= 1) return false;
    setKeyIdx((getKeyIdx() + 1) % keys.length); return true;
  }

  /* ── DAILY USAGE ── */
  function getUsage() {
    try {
      var u = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
      var today = new Date().toDateString();
      if (u.date !== today) return { date: today, count: 0 };
      return u;
    } catch (e) { return { date: new Date().toDateString(), count: 0 }; }
  }
  function incrementUsage() {
    var u = getUsage(); u.count = (u.count || 0) + 1;
    localStorage.setItem(USAGE_KEY, JSON.stringify(u));
    return u.count;
  }
  function isLimitReached() {
    var lim = getDailyLimit();
    return lim > 0 && getUsage().count >= lim;
  }

  /* ── CACHE ── */
  function getCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function setCache(badge, advices) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ badge: badge, advices: advices, ts: Date.now() }));
  }
  function getFreshCache() {
    var c = getCache();
    if (!c.ts || !c.badge) return null;
    if (Date.now() - c.ts > CACHE_TTL_MS) return null;
    return c;
  }
  function clearCache() { localStorage.removeItem(CACHE_KEY); }

  /* ── DATA (compact) ── */
  function getData() {
    function ls(k) { try { var d = localStorage.getItem(k); return d ? JSON.parse(d) : []; } catch (e) { return []; } }
    var income = ls('income'), expense = ls('expense'), ledger = ls('ledger'), savings = ls('savings');
    var totalInc = 0, totalExp = 0, totalSav = 0;
    income.forEach(function (i) { totalInc += Number(i.amount) || 0; });
    expense.forEach(function (i) { totalExp += Number(i.amount) || 0; });
    savings.forEach(function (i) { totalSav += Number(i.amount) || 0; });
    var den = 0, pab = 0;
    ledger.forEach(function (i) { if (!i.paid) { if (i.type === 'dena') den += Number(i.amount) || 0; else pab += Number(i.amount) || 0; } });
    var bal = totalInc - totalExp - totalSav - den + pab;
    var cats = {}; expense.forEach(function (i) { var c = i.category || 'অন্যান্য'; cats[c] = (cats[c] || 0) + (Number(i.amount) || 0); });
    var topCat = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; }).slice(0, 4).map(function (c) { return c + '(৳' + Math.round(cats[c]) + ')'; }).join(', ');
    var src = {}; income.forEach(function (i) { var s = i.source || 'আয়'; src[s] = (src[s] || 0) + (Number(i.amount) || 0); });
    var topSrc = Object.keys(src).sort(function (a, b) { return src[b] - src[a]; }).slice(0, 3).map(function (s) { return s + '(৳' + Math.round(src[s]) + ')'; }).join(', ');
    var all = [];
    income.slice(-4).forEach(function (i) { all.push('আয়৳' + Math.round(i.amount || 0) + '[' + (i.source || '') + ']' + (i.note ? '(' + i.note + ')' : '')); });
    expense.slice(-4).forEach(function (i) { all.push('ব্যয়৳' + Math.round(i.amount || 0) + '[' + (i.category || '') + ']' + (i.note ? '(' + i.note + ')' : '')); });
    var unpaid = ledger.filter(function (i) { return !i.paid; }).slice(0, 4).map(function (i) { return (i.type === 'dena' ? 'দেনা' : 'পাওনা') + ' ' + (i.person || '') + '৳' + Math.round(i.amount || 0); }).join(',');
    return {
      totalInc: Math.round(totalInc), totalExp: Math.round(totalExp), totalSav: Math.round(totalSav),
      bal: Math.round(bal), den: Math.round(den), pab: Math.round(pab),
      topCat: topCat || 'নেই', topSrc: topSrc || 'নেই', recent: all.slice(-6).join('; ') || 'নেই',
      unpaid: unpaid || 'পরিশোধিত'
    };
  }

  /* ── PROMPTS ── */
  function badgePrompt(d) {
    return 'Daily Account AI। ডেটা:\nআয়৳' + d.totalInc + ' ব্যয়৳' + d.totalExp + ' ব্যালেন্স৳' + d.bal +
      ' সঞ্চয়৳' + d.totalSav + ' দেনা৳' + d.den + ' পাওনা৳' + d.pab +
      ' শীর্ষব্যয়:' + d.topCat + ' আয়উৎস:' + d.topSrc +
      ' সাম্প্রতিক:' + d.recent + ' বকেয়া:' + d.unpaid +
      '\nশুধু এই format এ দাও:\nbadge_title: [emoji ৪-৬শব্দ]\nbadge_desc: [১বাক্য বাংলায়]';
  }
  function advicePrompt(d) {
    return 'Daily Account AI। ৩টি ছোট পরামর্শ বাংলায়।\nডেটা:\nআয়৳' + d.totalInc + ' ব্যয়৳' + d.totalExp +
      ' ব্যালেন্স৳' + d.bal + ' সঞ্চয়৳' + d.totalSav + ' দেনা৳' + d.den +
      ' শীর্ষব্যয়:' + d.topCat + ' বকেয়া:' + d.unpaid + ' সাম্প্রতিক:' + d.recent +
      '\nFormat:\nadvice1: ...\nadvice2: ...\nadvice3: ...';
  }

  /* ── GEMINI CALL ── */
  var _retries = 0;
  function callGemini(prompt, maxTok, cb) {
    var key = getCurrentKey();
    if (!key) { cb(null, 'nokey'); return; }
    fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: maxTok }
        })
      }
    )
    .then(function (r) {
      if (r.status === 429) {
        if (rotateKey() && _retries < 3) {
          _retries++;
          setTimeout(function () { callGemini(prompt, maxTok, cb); }, 2000 * _retries);
          return;
        }
        _retries = 0; cb(null, '429'); return;
      }
      _retries = 0;
      if (!r.ok) { cb(null, 'err'); return; }
      return r.json();
    })
    .then(function (data) {
      if (!data) return;
      var t = data.candidates && data.candidates[0] && data.candidates[0].content &&
        data.candidates[0].content.parts && data.candidates[0].content.parts[0].text;
      cb(t || null, null);
    })
    .catch(function () { cb(null, 'err'); });
  }

  /* ── PARSERS ── */
  function parseBadge(t) {
    if (!t) return null;
    var ti = (t.match(/badge_title:\s*(.+)/i) || [])[1] || '';
    var de = (t.match(/badge_desc:\s*(.+)/i) || [])[1] || '';
    return (ti && de) ? { title: ti.trim(), desc: de.trim() } : null;
  }
  function parseAdvices(t) {
    if (!t) return null;
    var arr = [1, 2, 3].map(function (n) {
      return (t.match(new RegExp('advice' + n + ':\\s*(.+)', 'i')) || [])[1] || '';
    }).filter(function (x) { return x.trim(); });
    return arr.length ? arr : null;
  }

  /* ── INJECT BADGE ── */
  function injectBadge(badge) {
    var track = document.getElementById('sbsTrack');
    if (!track) return;
    var old = document.getElementById('ai-badge-slide');
    if (old) old.remove();
    var slide = document.createElement('div');
    slide.id = 'ai-badge-slide';
    slide.className = 'sbs-slide';
    slide.style.cssText = 'background:linear-gradient(135deg,#4f46e5,#7c3aed,#E2136E);border-radius:16px;padding:11px 13px;display:flex;align-items:center;gap:10px;cursor:pointer;min-width:100%;box-sizing:border-box;overflow:hidden';
    slide.onclick = function () { location.href = 'pages/aichat.html'; };
    slide.innerHTML =
      '<div style="width:36px;height:36px;background:rgba(255,255,255,.18);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0">🤖</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="color:rgba(255,255,255,.72);font-size:0.56rem;font-weight:800;letter-spacing:.5px;text-transform:uppercase">✨ AI বিশ্লেষণ</div>' +
        '<div style="color:#fff;font-size:0.82rem;font-weight:800;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">' + badge.title + '</div>' +
        '<div style="color:rgba(255,255,255,.78);font-size:0.67rem;line-height:1.35;margin-top:2px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + badge.desc + '</div>' +
      '</div>' +
      '<div style="flex-shrink:0;background:rgba(255,255,255,.18);border-radius:9px;padding:5px 9px;font-size:0.65rem;color:#fff;font-weight:800">Chat→</div>';
    track.insertBefore(slide, track.firstChild);
    _rebuildSbsDots();
    if (typeof sbsGoTo === 'function') try { sbsGoTo(0); } catch (e) {}
    if (typeof startSbsAuto === 'function') try { startSbsAuto(); } catch (e) {}
  }
  function _rebuildSbsDots() {
    var track = document.getElementById('sbsTrack');
    var wrap = document.getElementById('sbsDots');
    if (!track || !wrap) return;
    var slides = track.querySelectorAll('.sbs-slide');
    wrap.innerHTML = '';
    for (var i = 0; i < slides.length; i++) {
      var b = document.createElement('button');
      b.className = 'sbs-dot' + (i === 0 ? ' on' : '');
      b.setAttribute('onclick', 'sbsGoTo(' + i + ')');
      wrap.appendChild(b);
    }
  }

  /* ── INJECT ADVICES ── */
  function injectAdvices(advices) {
    var track = document.getElementById('sasTrack');
    if (!track) return;
    track.querySelectorAll('.ai-adv-slide').forEach(function (el) { el.remove(); });
    var cfgs = [
      { bg: 'rgba(79,70,229,.1)', bd: 'rgba(99,102,241,.3)', ico: '🤖', lbl: 'AI পরামর্শ ১' },
      { bg: 'rgba(16,185,129,.1)', bd: 'rgba(16,185,129,.3)', ico: '💡', lbl: 'AI পরামর্শ ২' },
      { bg: 'rgba(226,19,110,.1)', bd: 'rgba(226,19,110,.3)', ico: '📊', lbl: 'AI পরামর্শ ৩' }
    ];
    advices.forEach(function (txt, i) {
      var c = cfgs[i % 3];
      var slide = document.createElement('div');
      slide.className = 'sas-slide ai-adv-slide';
      slide.style.cssText = 'background:' + c.bg + ';border:1.5px solid ' + c.bd + ';border-radius:14px;padding:13px 14px;display:flex;align-items:flex-start;gap:10px;min-width:100%;box-sizing:border-box';
      slide.innerHTML =
        '<div style="width:32px;height:32px;border-radius:10px;background:' + c.bd + ';display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0;margin-top:1px">' + c.ico + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:0.6rem;font-weight:800;color:#a78bfa;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px">' + c.lbl + '</div>' +
          '<div style="font-size:0.88rem;line-height:1.65;font-weight:500">' + txt + '</div>' +
        '</div>';
      track.appendChild(slide);
    });
    var all = track.querySelectorAll('.sas-slide');
    var ctr = document.getElementById('sasCounter');
    if (ctr) ctr.textContent = '1/' + all.length;
    var dw = document.getElementById('sasDots');
    if (dw) {
      dw.innerHTML = '';
      for (var j = 0; j < all.length; j++) {
        var b = document.createElement('button');
        b.className = 'sas-dot' + (j === 0 ? ' on' : '');
        b.setAttribute('onclick', 'sasGoTo(' + j + ')');
        dw.appendChild(b);
      }
    }
    if (typeof sasGoTo === 'function') try { sasGoTo(0); } catch (e) {}
    if (typeof startSasAuto === 'function') try { startSasAuto(); } catch (e) {}
  }

  /* ── AI CHAT BTN IN SAS HEADER ── */
  function addChatBtn() {
    var hdr = document.querySelector('.sas-hdr');
    if (!hdr || document.getElementById('aiChatHBtn')) return;
    var a = document.createElement('a');
    a.id = 'aiChatHBtn';
    a.href = 'pages/aichat.html';
    a.style.cssText = 'background:linear-gradient(135deg,#4338ca,#7c3aed);border-radius:20px;padding:5px 13px;font-size:0.72rem;color:white;font-weight:800;text-decoration:none;display:flex;align-items:center;gap:5px;flex-shrink:0;box-shadow:0 3px 12px rgba(124,109,250,.4)';
    a.innerHTML = '🤖 AI Chat';
    hdr.appendChild(a);
  }

  /* ── MAIN ── */
  function run() {
    addChatBtn();
    if (!isDashAIEnabled()) return;
    if (!navigator.onLine) return;
    if (!getKeys().length) return;

    // Cache ব্যবহার করো
    var cached = getFreshCache();
    if (cached) {
      if (cached.badge) injectBadge(cached.badge);
      if (cached.advices) injectAdvices(cached.advices);
      return;
    }

    // Limit চেক
    if (isLimitReached()) return;

    var d = getData();
    var badge = null, advices = null, done = 0;

    function finish() {
      done++;
      if (done === 2) {
        if (badge || advices) setCache(badge, advices);
        if (badge) injectBadge(badge);
        if (advices) injectAdvices(advices);
      }
    }

    incrementUsage(); // ১টি call-ই usage = ১ ধরা হবে

    callGemini(badgePrompt(d), 100, function (text, err) {
      if (!err) badge = parseBadge(text);
      finish();
    });

    callGemini(advicePrompt(d), 220, function (text, err) {
      if (!err) advices = parseAdvices(text);
      finish();
    });
  }

  /* ── GLOBAL API (aichat settings ব্যবহার করে) ── */
  window.AIDash = {
    getSettings: getSettings, saveSettings: saveSettings,
    getKeys: getKeys, getUsage: getUsage,
    getDailyLimit: getDailyLimit, isLimitReached: isLimitReached,
    clearCache: clearCache,
    forceRefresh: function () { clearCache(); run(); }
  };

  /* ── BOOT ── */
  if (document.readyState === 'complete') { setTimeout(run, 900); }
  else { window.addEventListener('load', function () { setTimeout(run, 900); }); }
  window.addEventListener('online', function () { setTimeout(run, 1000); });

})();