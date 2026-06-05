// Daily Account — analysis.js PRO v5.0
// Real DB data | Period filter | Health score | KPI | Charts | Heatmap
// Android 9 compat — no template literals, no arrow fn in critical paths

var _ANL = {
  period: 'all',
  charts: {},
  COLORS: ['#10b981','#ef4444','#a855f7','#f59e0b','#3b82f6','#ec4899','#06b6d4','#f97316','#84cc16','#8b5cf6'],
  lineDays: 7
};

/* ══ HELPERS ══ */
function _fmt(n){ return '৳ ' + Math.round(n).toLocaleString('en-BD'); }
function _pct(a,b){ return b > 0 ? Math.round((a/b)*100) : 0; }
function _sv(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; }
function _sc2(id,c){ var e=document.getElementById(id); if(e) e.style.color=c; }

/* Filter data by period */
function _filterByPeriod(arr, period) {
  if (!arr || !arr.length) return arr || [];
  if (period === 'all') return arr;
  var now = new Date();
  var from = null;
  if (period === 'thismonth') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'lastmonth') {
    from = new Date(now.getFullYear(), now.getMonth()-1, 1);
    var to = new Date(now.getFullYear(), now.getMonth(), 0);
    return arr.filter(function(i){ if(!i.date) return false; var d=new Date(i.date); return d>=from && d<=to; });
  } else if (period === '7days') {
    from = new Date(now - 7*86400000);
  } else if (period === '30days') {
    from = new Date(now - 30*86400000);
  } else if (period === 'thisyear') {
    from = new Date(now.getFullYear(), 0, 1);
  } else if (period && period.indexOf('month:') === 0) {
    // format: month:2025-03
    var parts = period.split(':')[1].split('-');
    var yr = parseInt(parts[0]), mo = parseInt(parts[1])-1;
    var mFrom = new Date(yr, mo, 1);
    var mTo = new Date(yr, mo+1, 0);
    return arr.filter(function(i){ if(!i.date) return false; var d=new Date(i.date); return d>=mFrom && d<=mTo; });
  }
  if (!from) return arr;
  return arr.filter(function(i){ if(!i.date) return false; return new Date(i.date) >= from; });
}

function _sumField(arr, field) {
  return (arr || []).reduce(function(t,i){ return t + (Number(i[field])||0); }, 0);
}

function _maxField(arr, field) {
  var m = 0;
  (arr||[]).forEach(function(i){ var v=Number(i[field])||0; if(v>m) m=v; });
  return m;
}

/* ══ PERIOD SWITCH ══ */
function setPeriod(btn, period) {
  _ANL.period = period;
  document.querySelectorAll('.anl-pt-btn').forEach(function(b){ b.classList.remove('on'); });
  document.querySelectorAll('.anl-month-btn').forEach(function(b){ b.classList.remove('on'); });
  if (btn) btn.classList.add('on');
  loadAnalysis();
}

function setMonthPeriod(btn, monthKey) {
  _ANL.period = 'month:' + monthKey;
  document.querySelectorAll('.anl-pt-btn').forEach(function(b){ b.classList.remove('on'); });
  document.querySelectorAll('.anl-month-btn').forEach(function(b){ b.classList.remove('on'); });
  if (btn) btn.classList.add('on');
  loadAnalysis();
}

/* Build month tabs from DB data */
function _buildMonthTabs() {
  var container = document.getElementById('monthTabs');
  if (!container) return;
  var allInc = DB.get('income') || [];
  var allExp = DB.get('expense') || [];
  var all = allInc.concat(allExp);
  var months = {};
  all.forEach(function(i){
    if (!i.date) return;
    var p = i.date.split('-');
    if (p.length < 2) return;
    var key = p[0] + '-' + p[1];
    months[key] = true;
  });
  var keys = Object.keys(months).sort().reverse().slice(0, 12);
  var BN_MONTHS = ['','জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];
  var html = '';
  keys.forEach(function(k){
    var parts = k.split('-');
    var mo = parseInt(parts[1]);
    var yr = parts[0].slice(2);
    var label = BN_MONTHS[mo] + ' \'' + yr;
    html += '<button class="anl-pt-btn anl-month-btn" data-p="month:'+k+'" onclick="setMonthPeriod(this,\''+k+'\')">' + label + '</button>';
  });
  container.innerHTML = html;
}

/* ══ ANIMATED COUNTER ══ */
function _animCount(el, target, prefix, duration) {
  if (!el) return;
  duration = duration || 700;
  var start = 0;
  var startTime = null;
  var rounded = Math.round(target);
  function step(ts) {
    if (!startTime) startTime = ts;
    var prog = Math.min((ts - startTime) / duration, 1);
    var ease = 1 - Math.pow(1 - prog, 3);
    var current = Math.round(ease * rounded);
    el.textContent = (prefix || '') + current.toLocaleString('en-BD');
    if (prog < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ══ APPLY PAGE CONFIG ══ */
function applyPageConfig() {
  var cfg = {};
  try { cfg = (JSON.parse(localStorage.getItem('pageConfig')) || {})['analysis'] || {}; } catch(e) {}
  var r = document.documentElement.style;
  if (cfg.hBg1) {
    r.setProperty('--hBg1', cfg.hBg1);
    var h = document.getElementById('anlHeader');
    if (h) h.style.background = 'linear-gradient(135deg,' + cfg.hBg1 + ',' + (cfg.hBg2 || cfg.hBg1) + ')';
  }
  if (cfg.hBg2)  r.setProperty('--hBg2', cfg.hBg2);
  if (cfg.fs)    { r.setProperty('--base-font-size', cfg.fs+'px'); document.documentElement.style.fontSize = cfg.fs+'px'; }
  if (cfg.chartC1) r.setProperty('--anl-c1', cfg.chartC1);
  if (cfg.chartC2) r.setProperty('--anl-c2', cfg.chartC2);
  if (cfg.chartC3) r.setProperty('--anl-c3', cfg.chartC3);
  if (cfg.chartC4) r.setProperty('--anl-c4', cfg.chartC4);
  if (cfg.anlCardBg) r.setProperty('--anl-card-bg', cfg.anlCardBg);
  if (cfg.anlCardRadius) r.setProperty('--anl-card-r', cfg.anlCardRadius+'px');
  if (cfg.adviceBg)     r.setProperty('--anl-advice-bg', cfg.adviceBg);
  if (cfg.adviceBorderC) r.setProperty('--anl-advice-border', cfg.adviceBorderC);
  if (cfg.adviceTxtC)   r.setProperty('--anl-advice-txt', cfg.adviceTxtC);
  if (cfg.adviceFontSz) r.setProperty('--anl-advice-fs', cfg.adviceFontSz+'px');
  if (cfg.healthBarColor) r.setProperty('--anl-health-color', cfg.healthBarColor);
  if (cfg.statBg)  r.setProperty('--anl-stat-bg', cfg.statBg);
  if (cfg.statTxt) r.setProperty('--anl-stat-txt', cfg.statTxt);
  if (cfg.anlShadow) r.setProperty('--anl-shadow', cfg.anlShadow);
}

/* ══ MAIN LOAD ══ */
function loadAnalysis() {
  applyPageConfig();

  var p = _ANL.period;
  var allIncome  = DB.get('income')  || [];
  var allExpense = DB.get('expense') || [];
  var allSavings = DB.get('savings') || [];
  var allLedger  = DB.get('ledger')  || [];

  var incomes  = _filterByPeriod(allIncome,  p);
  var expenses = _filterByPeriod(allExpense, p);
  var savings  = _filterByPeriod(allSavings, p);

  var income  = _sumField(incomes,  'amount');
  var expense = _sumField(expenses, 'amount');
  var sav     = _sumField(savings,  'amount');

  var paidDena=0, paidPabona=0, unpaidDena=0, unpaidPabona=0;
  var unpaidDenaCnt=0, unpaidPabonaCnt=0;
  allLedger.forEach(function(item) {
    var amt = Number(item.amount) || 0;
    if (item.paid) {
      if (item.type==='dena') paidDena   += amt;
      else                    paidPabona += amt;
    } else {
      if (item.type==='dena') { unpaidDena += amt; unpaidDenaCnt++; }
      else                    { unpaidPabona += amt; unpaidPabonaCnt++; }
    }
  });

  var balance = income - expense + paidPabona - paidDena - sav;

  // ── Header pills
  _sv('hPill1', 'আয় ' + _fmt(income));
  _sv('hPill2', 'ব্যয় ' + _fmt(expense));
  _sv('hPill3', 'ব্যালেন্স ' + _fmt(balance));

  // ── Summary cards (animated)
  var iEl = document.getElementById('totalIncome');
  var eEl = document.getElementById('totalExpense');
  var bEl = document.getElementById('currentBalance');
  var sEl = document.getElementById('totalSavings');
  _animCount(iEl, income,  '৳ ');
  _animCount(eEl, expense, '৳ ');
  _animCount(bEl, balance, '৳ ');
  _animCount(sEl, sav,     '৳ ');

  var balCard = document.getElementById('balCard');
  if (balCard) {
    if (balance < 0) balCard.classList.add('neg');
    else balCard.classList.remove('neg');
  }

  // ── KPI
  var txCount = incomes.length + expenses.length;
  var avgTx   = txCount > 0 ? (income + expense) / txCount : 0;
  var savRate  = _pct(sav, income);
  var expRate  = _pct(expense, income);
  var daysActive = _getDaysActive(allIncome, allExpense);
  var dAvgInc = daysActive > 0 ? income/daysActive : 0;
  var dAvgExp = daysActive > 0 ? expense/daysActive : 0;

  _sv('kDInc', _fmt(dAvgInc));
  _sv('kDExp', _fmt(dAvgExp));
  _sv('kSR', savRate+'%');
  _sv('kER', expRate+'%');
  _sv('kTC', txCount);
  _sv('kAT', _fmt(avgTx));

  // ── Detailed stats
  _sv('avgDailyIncome',  _fmt(dAvgInc));
  _sv('avgDailyExpense', _fmt(dAvgExp));
  _sv('savingsRate', savRate+'%');
  _sv('expenseRate',  expRate+'%');
  _sv('statTxCount', txCount);
  _sv('statNetPos',  _fmt(balance));
  _sv('statMaxInc',  _fmt(_maxField(incomes,  'amount')));
  _sv('statMaxExp',  _fmt(_maxField(expenses, 'amount')));

  // ── Ledger
  _sv('ledUnpaidDena',   _fmt(unpaidDena));
  _sv('ledUnpaidPabona', _fmt(unpaidPabona));
  _sv('ledDenaCnt',    unpaidDenaCnt   + ' টি');
  _sv('ledPabonaCnt',  unpaidPabonaCnt + ' টি');
  _sv('ledPaidDena',   _fmt(paidDena));
  _sv('ledPaidPabona', _fmt(paidPabona));

  // ── Compare
  _sv('cmpI', _fmt(income));
  _sv('cmpE', _fmt(expense));
  var total = income + expense;
  var iP = total>0 ? Math.round((income/total)*100) : 0;
  var eP = total>0 ? Math.round((expense/total)*100) : 0;
  _setBar('cIBar', iP); _sv('cIPct', iP+'%');
  _setBar('cEBar', eP); _sv('cEPct', eP+'%');
  var cmpMsg = document.getElementById('cmpMsg');
  if (cmpMsg) {
    if (income === 0 && expense === 0) {
      cmpMsg.textContent = 'এখনো কোনো ডাটা নেই';
      cmpMsg.style.color = '#6b7280';
    } else if (income > expense) {
      var diff = income - expense;
      cmpMsg.textContent = '✅ আয় ব্যয়ের চেয়ে ' + _fmt(diff) + ' বেশি';
      cmpMsg.style.color = '#10b981';
      cmpMsg.style.background = 'rgba(16,185,129,.08)';
    } else if (expense > income) {
      var diff2 = expense - income;
      cmpMsg.textContent = '⚠️ ব্যয় আয়ের চেয়ে ' + _fmt(diff2) + ' বেশি!';
      cmpMsg.style.color = '#ef4444';
      cmpMsg.style.background = 'rgba(239,68,68,.08)';
    } else {
      cmpMsg.textContent = '⚖️ আয় ও ব্যয় সমান';
      cmpMsg.style.color = '#f59e0b';
    }
  }

  // ── Health Score
  _buildHealthScore(income, expense, sav, balance, unpaidDena, incomes, expenses);

  // ── Savings Goal
  _buildSavingsGoal(sav, allSavings);

  // ── Category bars
  _buildCatList(expenses);

  // ── Income sources
  _buildSrcGrid(incomes, income);

  // ── Monthly list
  _buildMonthlyList(allIncome, allExpense);

  // ── Heatmap
  _buildHeatmap(allExpense);

  // ── AI Advice
  generateSmartAdvice(income, expense, balance, sav, unpaidDena, unpaidPabona, expenses, incomes, allLedger);

  // ── Charts
  _buildCharts(incomes, expenses, allSavings);
}

/* ── SET BAR (animated) ── */
function _setBar(id, pct) {
  var el = document.getElementById(id);
  if (!el) return;
  el.style.width = '0';
  setTimeout(function(){ el.style.width = Math.min(pct,100)+'%'; }, 50);
}

/* ── DAYS ACTIVE ── */
function _getDaysActive(inc, exp) {
  var dates = {};
  (inc||[]).forEach(function(i){ if(i.date) dates[i.date.split('T')[0]]=1; });
  (exp||[]).forEach(function(i){ if(i.date) dates[i.date.split('T')[0]]=1; });
  var keys = Object.keys(dates);
  if (!keys.length) return 1;
  var sorted = keys.sort();
  var d1 = new Date(sorted[0]);
  var d2 = new Date(sorted[sorted.length-1]);
  var days = Math.max(1, Math.round((d2-d1)/86400000)+1);
  return days;
}

/* ── HEALTH SCORE ── */
function _buildHealthScore(income, expense, savings, balance, unpaidDena, incomes, expenses) {
  var scores = { savings:0, expCtrl:0, balance:0, debt:100 };

  if (income > 0) {
    scores.savings = Math.min(100, Math.round((savings/income)*100) * 5);
    var expRatio = expense/income;
    scores.expCtrl = expRatio <= 0.5 ? 100 : expRatio <= 0.7 ? 75 : expRatio <= 0.9 ? 45 : 15;
    scores.balance = balance >= income*0.5 ? 100 : balance >= income*0.3 ? 75 : balance >= 0 ? 50 : 10;
  }
  if (income > 0 && unpaidDena > 0) {
    var dr = unpaidDena/income;
    scores.debt = dr > 0.5 ? 20 : dr > 0.3 ? 50 : dr > 0.1 ? 75 : 95;
  }

  var total = Math.round((scores.savings*0.3 + scores.expCtrl*0.3 + scores.balance*0.25 + scores.debt*0.15));
  total = Math.min(100, Math.max(0, total));

  // Gauge
  var circ = document.getElementById('gaugeCircle');
  var numEl = document.getElementById('gaugeNum');
  var badge = document.getElementById('healthBadge');
  var msg   = document.getElementById('healthMsg');
  var r = document.documentElement;

  var color, label, msgTxt;
  if (total >= 80)      { color='#10b981'; label='🏆 চমৎকার'; msgTxt='আপনার আর্থিক অবস্থা খুবই ভালো! এভাবে চালিয়ে যান।'; }
  else if (total >= 60) { color='#3b82f6'; label='✅ ভালো';   msgTxt='আর্থিক অবস্থা ঠিক আছে। একটু সঞ্চয় বাড়ালে আরও ভালো হবে।'; }
  else if (total >= 40) { color='#f59e0b'; label='⚠️ মাঝামাঝি'; msgTxt='কিছু উন্নতির সুযোগ আছে। ব্যয় কমানো এবং সঞ্চয় বাড়ানো জরুরি।'; }
  else                  { color='#ef4444'; label='🚨 সংকটজনক'; msgTxt='আর্থিক পরিস্থিতি কঠিন। তাৎক্ষণিক পদক্ষেপ নিন।'; }

  r.style.setProperty('--anl-health-color', color);
  if (circ) {
    var offset = 251 - (251 * total/100);
    circ.style.stroke = color;
    setTimeout(function(){ circ.style.strokeDashoffset = offset; }, 100);
  }
  if (numEl) {
    var n = 0;
    var interval = setInterval(function(){
      n += 2;
      if (n >= total) { n=total; clearInterval(interval); }
      numEl.textContent = n;
    }, 14);
  }
  if (badge) { badge.textContent = label; badge.style.background = color+'22'; badge.style.color = color; }
  if (msg)   msg.textContent = msgTxt;

  // Health bars
  setTimeout(function(){
    var sP = Math.min(100, Math.round((savings/(income||1))*100)*2);
    var eP = scores.expCtrl;
    var bP = scores.balance;
    var dP = scores.debt;
    _setBar('hbS', sP); _sv('hbSPct', Math.min(sP,100)+'%');
    _setBar('hbE', eP); _sv('hbEPct', eP+'%');
    _setBar('hbB', bP); _sv('hbBPct', bP+'%');
    _setBar('hbD', dP); _sv('hbDPct', dP+'%');
  }, 200);
}

/* ── SAVINGS GOAL ── */
function _buildSavingsGoal(sav, allSavings) {
  var monthly = _sumField(_filterByPeriod(allSavings,'thismonth'),'amount');
  var target = allSavings.length > 0 ? Math.max(sav * 1.2, monthly * 3, 5000) : 10000;
  var pct = Math.min(100, Math.round((sav/target)*100));
  _sv('goalPct', pct+'%');
  _sv('goalCurrent', 'বর্তমান: ' + _fmt(sav));
  _sv('goalTarget', 'লক্ষ্য: ' + _fmt(target));
  var fill = document.getElementById('goalFill');
  if (fill) { fill.style.width='0'; setTimeout(function(){ fill.style.width=pct+'%'; }, 200); }
}

/* ── CATEGORY BARS ── */
function _buildCatList(expenses) {
  var cats = {};
  expenses.forEach(function(e){
    var c = e.category || e.source || 'অন্যান্য';
    cats[c] = (cats[c]||0) + (Number(e.amount)||0);
  });
  var keys = Object.keys(cats).sort(function(a,b){ return cats[b]-cats[a]; }).slice(0,8);
  var total = keys.reduce(function(t,k){ return t+cats[k]; },0);
  var el = document.getElementById('catList');
  if (!el) return;
  if (!keys.length) { el.innerHTML = '<div style="text-align:center;color:#9ca3af;font-size:.8rem;padding:12px">কোনো ব্যয় নেই</div>'; return; }
  var html = '';
  keys.forEach(function(k, i){
    var pct = total>0 ? Math.round((cats[k]/total)*100) : 0;
    var clr = _ANL.COLORS[i % _ANL.COLORS.length];
    html += '<div class="anl-cat-item">'
      + '<div class="anl-cat-row"><span class="anl-cat-name">' + k + '</span><span class="anl-cat-amt">' + _fmt(cats[k]) + '</span></div>'
      + '<div class="anl-cat-bar"><div class="anl-cat-fill" style="background:' + clr + ';width:0" data-w="' + pct + '"></div></div>'
      + '<div class="anl-cat-pct">' + pct + '%</div>'
      + '</div>';
  });
  el.innerHTML = html;
  setTimeout(function(){
    el.querySelectorAll('.anl-cat-fill').forEach(function(f){ f.style.width=f.getAttribute('data-w')+'%'; });
  }, 100);
}

/* ── INCOME SOURCES ── */
function _buildSrcGrid(incomes, total) {
  var srcs = {};
  incomes.forEach(function(i){
    var s = i.source || i.category || 'অন্যান্য';
    srcs[s] = (srcs[s]||0) + (Number(i.amount)||0);
  });
  var keys = Object.keys(srcs).sort(function(a,b){ return srcs[b]-srcs[a]; }).slice(0,6);
  var el = document.getElementById('srcGrid');
  if (!el) return;
  if (!keys.length) { el.innerHTML = '<div style="color:#9ca3af;font-size:.8rem;padding:8px">কোনো আয় নেই</div>'; return; }
  var html = '';
  keys.forEach(function(k,i){
    var pct = total>0 ? Math.round((srcs[k]/total)*100) : 0;
    var clr = _ANL.COLORS[i % _ANL.COLORS.length];
    html += '<div class="anl-src-card" style="border-top:3px solid '+clr+'">'
      + '<div class="anl-src-name">' + k + '</div>'
      + '<div class="anl-src-amt" style="color:'+clr+'">' + _fmt(srcs[k]) + '</div>'
      + '<div class="anl-src-pct">' + pct + '% মোট আয়ের</div>'
      + '</div>';
  });
  el.innerHTML = html;
}

/* ── MONTHLY LIST ── */
function _buildMonthlyList(allInc, allExp) {
  var months = {};
  allInc.forEach(function(i){ if(!i.date)return; var m=i.date.substring(0,7); if(!months[m])months[m]={inc:0,exp:0}; months[m].inc+=(Number(i.amount)||0); });
  allExp.forEach(function(i){ if(!i.date)return; var m=i.date.substring(0,7); if(!months[m])months[m]={inc:0,exp:0}; months[m].exp+=(Number(i.amount)||0); });
  var keys = Object.keys(months).sort().slice(-6).reverse();
  var el = document.getElementById('monthlyList');
  if (!el) return;
  if (!keys.length) { el.innerHTML = ''; return; }
  var maxVal = 1;
  keys.forEach(function(k){ var v=months[k]; if(v.inc>maxVal) maxVal=v.inc; if(v.exp>maxVal) maxVal=v.exp; });
  var html = '';
  keys.forEach(function(k){
    var d = months[k];
    var iP = Math.round((d.inc/maxVal)*100);
    var eP = Math.round((d.exp/maxVal)*100);
    var bal = d.inc - d.exp;
    var balClr = bal>=0?'#10b981':'#ef4444';
    var parts = k.split('-');
    var mNames = ['','জান','ফেব','মার','এপ্র','মে','জুন','জুল','আগ','সেপ','অক্ট','নভ','ডিস'];
    var mLabel = mNames[parseInt(parts[1])] + ' ' + parts[0].slice(-2);
    html += '<div class="anl-mr">'
      + '<span class="anl-mn">' + mLabel + '</span>'
      + '<div class="anl-mb-wrap">'
      + '<div class="anl-mb-row"><div class="anl-mb-bar" style="background:#10b981;width:'+iP+'%"></div><span class="anl-mb-amt" style="color:#10b981">'+_fmt(d.inc)+'</span></div>'
      + '<div class="anl-mb-row"><div class="anl-mb-bar" style="background:#ef4444;width:'+eP+'%"></div><span class="anl-mb-amt" style="color:#ef4444">'+_fmt(d.exp)+'</span></div>'
      + '</div>'
      + '<span class="anl-mbal" style="color:'+balClr+'">'+_fmt(bal)+'</span>'
      + '</div>';
  });
  el.innerHTML = html;
}

/* ── HEATMAP ── */
function _buildHeatmap(allExp) {
  var byDay = {};
  allExp.forEach(function(i){ if(!i.date)return; var d=i.date.split('T')[0]; byDay[d]=(byDay[d]||0)+(Number(i.amount)||0); });
  var vals = Object.values(byDay);
  var max = vals.length ? Math.max.apply(null,vals) : 1;
  var el = document.getElementById('heatmapGrid');
  if (!el) return;
  var html = '';
  for (var i=34; i>=0; i--) {
    var d = new Date(Date.now() - i*86400000);
    var key = d.toISOString().split('T')[0];
    var v = byDay[key] || 0;
    var lvl = v===0 ? 0 : v<max*.2 ? 1 : v<max*.4 ? 2 : v<max*.7 ? 3 : 4;
    var title = key + ': ' + _fmt(v);
    html += '<div class="anl-hm hm'+lvl+'" title="'+title+'"></div>';
  }
  el.innerHTML = html;
}

/* ── CHART TYPE SWITCH ── */
function switchPieType(type, btn) {
  document.querySelectorAll('#ct1a,#ct1b,#ct1c').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
  var incomes  = _filterByPeriod(DB.get('income')||[],  _ANL.period);
  var expenses = _filterByPeriod(DB.get('expense')||[], _ANL.period);
  var inc = _sumField(incomes,'amount');
  var exp = _sumField(expenses,'amount');
  _drawIncExpChart(type, inc, exp);
}

function setLinePeriod(btn, days) {
  _ANL.lineDays = days;
  document.querySelectorAll('#lp7,#lp14,#lp30').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
  var incomes  = _filterByPeriod(DB.get('income')||[],  _ANL.period);
  var expenses = _filterByPeriod(DB.get('expense')||[], _ANL.period);
  _drawLineChart(incomes, expenses, days);
}

/* ── CHARTS ── */
function _buildCharts(incomes, expenses, savings) {
  var inc = _sumField(incomes,'amount');
  var exp = _sumField(expenses,'amount');
  _drawIncExpChart('pie', inc, exp);
  _drawBarChart(DB.get('income')||[], DB.get('expense')||[]);
  _drawLineChart(DB.get('income')||[], DB.get('expense')||[], _ANL.lineDays);
  _drawDoughnutChart(expenses);
  _drawSavingsChart(DB.get('savings')||[]);
}

function _getChartColors() {
  var cfg = {};
  try { cfg = (JSON.parse(localStorage.getItem('pageConfig'))||{})['analysis']||{}; } catch(e) {}
  return {
    c1: cfg.chartC1||'#10b981',
    c2: cfg.chartC2||'#ef4444',
    c3: cfg.chartC3||'#a855f7',
    c4: cfg.chartC4||'#f59e0b'
  };
}

function _destroyChart(key) {
  if (_ANL.charts[key]) { try { _ANL.charts[key].destroy(); } catch(e){} _ANL.charts[key]=null; }
}

function _drawIncExpChart(type, inc, exp) {
  _destroyChart('pie');
  var ctx = document.getElementById('pieChart');
  if (!ctx) return;
  var cc = _getChartColors();
  var isDark = document.body.classList.contains('dark-mode');
  var txtClr = isDark ? '#e5e7eb' : '#374151';
  _ANL.charts.pie = new Chart(ctx, {
    type: type==='pie'?'pie':type==='doughnut'?'doughnut':'bar',
    data: {
      labels: ['আয়','ব্যয়'],
      datasets: [{
        data: type==='bar' ? null : [inc, exp],
        label: type==='bar' ? 'আয়' : undefined,
        backgroundColor: type==='bar' ? cc.c1+'cc' : [cc.c1+'cc', cc.c2+'cc'],
        borderColor: type==='bar' ? cc.c1 : [cc.c1, cc.c2],
        borderWidth: 2,
        borderRadius: type==='bar' ? 8 : 0,
        data: type==='bar' ? [inc] : [inc, exp]
      },
      type==='bar' ? {
        label:'ব্যয়', data:[exp],
        backgroundColor: cc.c2+'cc', borderColor:cc.c2,
        borderWidth:2, borderRadius:8
      } : null].filter(Boolean)
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ position:'bottom', labels:{ color:txtClr, font:{size:13,weight:'bold'}, padding:12 }},
        tooltip:{ callbacks:{ label: function(ctx){ return ctx.label+': '+_fmt(ctx.parsed||ctx.raw||0); }}}
      },
      scales: type==='bar' ? { y:{ beginAtZero:true, ticks:{ callback:function(v){return '৳'+v;}, color:txtClr }, grid:{color:'rgba(0,0,0,.05)'} }, x:{ticks:{color:txtClr}} } : undefined
    }
  });
}

function _drawBarChart(allInc, allExp) {
  _destroyChart('bar');
  var ctx = document.getElementById('barChart');
  if (!ctx) return;
  var cc = _getChartColors();
  var months = {};
  allInc.forEach(function(i){ if(!i.date)return; var m=i.date.substring(0,7); if(!months[m])months[m]={inc:0,exp:0}; months[m].inc+=(Number(i.amount)||0); });
  allExp.forEach(function(i){ if(!i.date)return; var m=i.date.substring(0,7); if(!months[m])months[m]={inc:0,exp:0}; months[m].exp+=(Number(i.amount)||0); });
  var labels = Object.keys(months).sort().slice(-6);
  var mNames = ['','জান','ফেব','মার','এপ্র','মে','জুন','জুল','আগ','সেপ','অক্ট','নভ','ডিস'];
  var isDark = document.body.classList.contains('dark-mode');
  var txtClr = isDark ? '#e5e7eb' : '#374151';
  _ANL.charts.bar = new Chart(ctx, {
    type:'bar',
    data:{
      labels: labels.map(function(l){ var p=l.split('-'); return (mNames[parseInt(p[1])]||p[1])+' '+p[0].slice(-2); }),
      datasets:[
        { label:'আয়', data:labels.map(function(l){return months[l].inc;}), backgroundColor:cc.c1+'cc', borderColor:cc.c1, borderWidth:2, borderRadius:6 },
        { label:'ব্যয়', data:labels.map(function(l){return months[l].exp;}), backgroundColor:cc.c2+'cc', borderColor:cc.c2, borderWidth:2, borderRadius:6 }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ color:txtClr, font:{size:12,weight:'bold'}, padding:10 }}},
      scales:{ y:{beginAtZero:true, ticks:{callback:function(v){return '৳'+v;},color:txtClr},grid:{color:'rgba(0,0,0,.05)'}}, x:{ticks:{color:txtClr}} }
    }
  });
}

function _drawLineChart(allInc, allExp, days) {
  _destroyChart('line');
  var ctx = document.getElementById('lineChart');
  if (!ctx) return;
  var cc = _getChartColors();
  var daysMap = {};
  var now = new Date();
  for (var i=days-1; i>=0; i--) {
    var d2 = new Date(now - i*86400000);
    daysMap[d2.toISOString().split('T')[0]] = {inc:0,exp:0};
  }
  allInc.forEach(function(i){ if(daysMap[i.date]!==undefined) daysMap[i.date].inc+=(Number(i.amount)||0); });
  allExp.forEach(function(i){ if(daysMap[i.date]!==undefined) daysMap[i.date].exp+=(Number(i.amount)||0); });
  var labels = Object.keys(daysMap);
  var isDark = document.body.classList.contains('dark-mode');
  var txtClr = isDark ? '#e5e7eb' : '#374151';
  _ANL.charts.line = new Chart(ctx, {
    type:'line',
    data:{
      labels: labels.map(function(l){ var p=l.split('-'); return p[2]+'/'+p[1]; }),
      datasets:[
        { label:'আয়', data:labels.map(function(l){return daysMap[l].inc;}), borderColor:cc.c1, backgroundColor:cc.c1+'22', tension:0.4, fill:true, borderWidth:2.5, pointRadius:3, pointBackgroundColor:cc.c1 },
        { label:'ব্যয়', data:labels.map(function(l){return daysMap[l].exp;}), borderColor:cc.c2, backgroundColor:cc.c2+'22', tension:0.4, fill:true, borderWidth:2.5, pointRadius:3, pointBackgroundColor:cc.c2 }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ color:txtClr, font:{size:12,weight:'bold'}, padding:10 }}},
      scales:{ y:{beginAtZero:true, ticks:{callback:function(v){return '৳'+v;},color:txtClr},grid:{color:'rgba(0,0,0,.05)'}}, x:{ticks:{color:txtClr,maxTicksLimit:7}} }
    }
  });
}

function _drawDoughnutChart(expenses) {
  _destroyChart('doughnut');
  var ctx = document.getElementById('doughnutChart');
  if (!ctx) return;
  var cats = {};
  expenses.forEach(function(e){ var c=e.category||e.source||'অন্যান্য'; cats[c]=(cats[c]||0)+(Number(e.amount)||0); });
  var keys = Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];}).slice(0,8);
  if (!keys.length) { ctx.style.display='none'; return; }
  ctx.style.display='';
  var isDark = document.body.classList.contains('dark-mode');
  var txtClr = isDark ? '#e5e7eb' : '#374151';
  _ANL.charts.doughnut = new Chart(ctx, {
    type:'doughnut',
    data:{
      labels: keys,
      datasets:[{ data:keys.map(function(k){return cats[k];}), backgroundColor:_ANL.COLORS.slice(0,keys.length).map(function(c){return c+'cc';}), borderColor:_ANL.COLORS.slice(0,keys.length), borderWidth:2 }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ position:'bottom', labels:{ color:txtClr, font:{size:11,weight:'bold'}, padding:8 }},
        tooltip:{ callbacks:{ label:function(ctx){ var t=ctx.dataset.data.reduce(function(a,b){return a+b;},0); var p=Math.round((ctx.parsed/t)*100); return ctx.label+': '+_fmt(ctx.parsed)+' ('+p+'%)'; }}}
      }
    }
  });
}

function _drawSavingsChart(allSavings) {
  _destroyChart('savings');
  var ctx = document.getElementById('savingsChart');
  if (!ctx) return;
  var cc = _getChartColors();
  var sorted = allSavings.slice().sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
  var cum = 0, labels = [], data = [];
  sorted.forEach(function(i){ cum+=(Number(i.amount)||0); labels.push(i.date); data.push(cum); });
  if (!labels.length) { labels=['শুরু']; data=[0]; }
  var isDark = document.body.classList.contains('dark-mode');
  var txtClr = isDark ? '#e5e7eb' : '#374151';
  _ANL.charts.savings = new Chart(ctx, {
    type:'line',
    data:{
      labels: labels.map(function(l){ if(l==='শুরু')return l; var p=l.split('-'); return p[2]+'/'+p[1]; }),
      datasets:[{ label:'সঞ্চয়', data:data, borderColor:cc.c3, backgroundColor:cc.c3+'28', tension:0.4, fill:true, borderWidth:2.5, pointRadius:4, pointBackgroundColor:cc.c3, pointBorderColor:'#fff', pointBorderWidth:2 }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ color:txtClr, font:{size:12,weight:'bold'}, padding:10 }}},
      scales:{ y:{beginAtZero:true, ticks:{callback:function(v){return '৳'+v;},color:txtClr},grid:{color:'rgba(0,0,0,.05)'}}, x:{ticks:{color:txtClr,maxTicksLimit:8}} }
    }
  });
}

/* ══ SMART AI ADVICE SLIDER ══ */
var _ANL_SLIDER = { cur: 0, total: 0, timer: null, prog: null, progTimer: null, startX: 0, isDrag: false };

function anlSlide(dir) {
  var total = _ANL_SLIDER.total;
  if (total <= 1) return;
  _ANL_SLIDER.cur = (_ANL_SLIDER.cur + dir + total) % total;
  _anlSliderRender();
  _anlSliderResetTimer();
}

function _anlSliderGoto(idx) {
  _ANL_SLIDER.cur = idx;
  _anlSliderRender();
  _anlSliderResetTimer();
}

function _anlSliderRender() {
  var cur = _ANL_SLIDER.cur;
  var total = _ANL_SLIDER.total;
  var track = document.getElementById('sliderTrack');
  if (track) track.style.transform = 'translateX(-' + (cur * 100) + '%)';
  var counter = document.getElementById('slideCounter');
  if (counter) counter.textContent = (cur+1) + '/' + total;
  var dots = document.querySelectorAll('.anl-dot');
  dots.forEach(function(d, i){ d.classList.toggle('on', i === cur); });
  _anlProgReset();
}

function _anlProgReset() {
  var fill = document.getElementById('slideProgFill');
  if (!fill) return;
  fill.style.transition = 'none';
  fill.style.width = '0%';
  clearInterval(_ANL_SLIDER.progTimer);
  var elapsed = 0;
  var interval = 50;
  var total = 5000;
  _ANL_SLIDER.progTimer = setInterval(function(){
    elapsed += interval;
    var pct = Math.min((elapsed / total) * 100, 100);
    fill.style.transition = 'width '+interval+'ms linear';
    fill.style.width = pct + '%';
    if (elapsed >= total) clearInterval(_ANL_SLIDER.progTimer);
  }, interval);
}

function _anlSliderResetTimer() {
  clearInterval(_ANL_SLIDER.timer);
  clearInterval(_ANL_SLIDER.progTimer);
  if (_ANL_SLIDER.total <= 1) return;
  _anlProgReset();
  _ANL_SLIDER.timer = setInterval(function(){
    _ANL_SLIDER.cur = (_ANL_SLIDER.cur + 1) % _ANL_SLIDER.total;
    _anlSliderRender();
  }, 5000);
}

function _anlInitSliderTouch() {
  var wrap = document.getElementById('sliderWrap');
  if (!wrap || wrap._sliderTouchInit) return;
  wrap._sliderTouchInit = true;
  wrap.addEventListener('touchstart', function(e){
    _ANL_SLIDER.startX = e.touches[0].clientX;
    _ANL_SLIDER.isDrag = false;
  }, { passive: true });
  wrap.addEventListener('touchmove', function(e){
    var dx = e.touches[0].clientX - _ANL_SLIDER.startX;
    if (Math.abs(dx) > 8) _ANL_SLIDER.isDrag = true;
  }, { passive: true });
  wrap.addEventListener('touchend', function(e){
    if (!_ANL_SLIDER.isDrag) return;
    var dx = e.changedTouches[0].clientX - _ANL_SLIDER.startX;
    if (Math.abs(dx) > 40) anlSlide(dx < 0 ? 1 : -1);
  }, { passive: true });
  // mouse drag
  wrap.addEventListener('mousedown', function(e){ _ANL_SLIDER.startX = e.clientX; _ANL_SLIDER.isDrag = false; });
  wrap.addEventListener('mousemove', function(e){ if(e.buttons && Math.abs(e.clientX - _ANL_SLIDER.startX) > 8) _ANL_SLIDER.isDrag = true; });
  wrap.addEventListener('mouseup', function(e){ if(!_ANL_SLIDER.isDrag) return; var dx=e.clientX-_ANL_SLIDER.startX; if(Math.abs(dx)>40) anlSlide(dx<0?1:-1); });
}

function generateSmartAdvice(income, expense, balance, savings, unpaidDena, unpaidPabona, expenses, incomes, ledger) {
  var advice = [];

  if (expense > income && income > 0) {
    advice.push({ icon:'🚨', text:'এই সময়ে ব্যয় আয়ের চেয়ে বেশি! অবিলম্বে খরচ কমান।', pri:'high' });
  } else if (balance > income*0.5 && income>0) {
    advice.push({ icon:'🎉', text:'চমৎকার! আয়ের ৫০%+ ব্যালেন্সে রয়েছে। অসাধারণ পারফরম্যান্স!', pri:'high' });
  } else if (balance > income*0.3 && income>0) {
    advice.push({ icon:'✅', text:'ভালো! আর্থিক অবস্থা স্বাস্থ্যকর। এভাবে চালিয়ে যান।', pri:'medium' });
  } else if (balance >= 0 && income>0) {
    advice.push({ icon:'💡', text:'আরও কিছু সঞ্চয় করার চেষ্টা করুন। ব্যালেন্স কম।', pri:'low' });
  }

  if (income>0 && expense>income*0.9) {
    advice.push({ icon:'🚨', text:'সংকটজনক! ব্যয় আয়ের ৯০% ছাড়িয়েছে। জরুরি পদক্ষেপ নিন।', pri:'high' });
  } else if (income>0 && expense>income*0.7) {
    advice.push({ icon:'⚠️', text:'সতর্ক! ব্যয়ের পরিমাণ অনেক বেশি (আয়ের '+Math.round((expense/income)*100)+'%)।', pri:'medium' });
  }

  if (savings===0 && income>0) {
    advice.push({ icon:'💰', text:'কোনো সঞ্চয় নেই! ভবিষ্যতের জন্য আজই সঞ্চয় শুরু করুন।', pri:'high' });
  } else if (income>0 && savings>income*0.2) {
    advice.push({ icon:'🏆', text:'দারুণ! আয়ের ২০%+ সঞ্চয় করেছেন। আপনি স্মার্ট সেভার!', pri:'high' });
  } else if (income>0 && savings>income*0.1) {
    advice.push({ icon:'👍', text:'ভালো শুরু! সঞ্চয়ের হার আরো বাড়ানোর চেষ্টা করুন।', pri:'medium' });
  }

  if (incomes.length>0) {
    var lastDate = incomes[incomes.length-1].date;
    var dSince = Math.floor((new Date()-new Date(lastDate))/86400000);
    if (dSince>=7) advice.push({ icon:'⏰', text:dSince+' দিন ধরে নতুন আয় নেই। আয় এন্ট্রি করুন।', pri:'high' });
  } else if (income===0) {
    advice.push({ icon:'💰', text:'এখনো কোনো আয় এন্ট্রি নেই। আয় যোগ করে শুরু করুন।', pri:'high' });
  }

  if (expenses.length>0) {
    var cats = {};
    expenses.forEach(function(e){ var c=e.category||e.source||'অন্যান্য'; cats[c]=(cats[c]||0)+(Number(e.amount)||0); });
    var top=null, topAmt=0;
    Object.keys(cats).forEach(function(k){ if(cats[k]>topAmt){topAmt=cats[k];top=k;} });
    if (top && expense>0 && topAmt>expense*0.4) {
      advice.push({ icon:'📊', text:'"'+top+'" খাতে সবচেয়ে বেশি ('+Math.round((topAmt/expense)*100)+'%) খরচ হচ্ছে।', pri:'medium' });
    }
  }

  if (unpaidDena>0 && income>0 && unpaidDena>income*0.3) {
    advice.push({ icon:'📕', text:'দেনার পরিমাণ অনেক বেশি ('+_fmt(unpaidDena)+')! যত দ্রুত সম্ভব পরিশোধ করুন।', pri:'high' });
  } else if (unpaidDena>0) {
    advice.push({ icon:'📕', text:_fmt(unpaidDena)+' দেনা বাকি আছে। পরিশোধের পরিকল্পনা করুন।', pri:'medium' });
  }

  if (unpaidPabona>0 && income>0 && unpaidPabona>income*0.2) {
    advice.push({ icon:'📗', text:_fmt(unpaidPabona)+' পাওনা সংগ্রহ করুন! অনেক টাকা বাইরে আছে।', pri:'high' });
  } else if (unpaidPabona>0) {
    advice.push({ icon:'📗', text:_fmt(unpaidPabona)+' পাওনা সংগ্রহ করার চেষ্টা করুন।', pri:'low' });
  }

  ledger.forEach(function(item){
    if (!item.paid) {
      var days = Math.floor((new Date()-new Date(item.date||0))/86400000);
      if (days>=30) {
        var tp = item.type==='dena'?'দেনা':'পাওনা';
        advice.push({ icon:item.type==='dena'?'📕':'📗', text:days+' দিন হইল '+(item.person||'')+'এর '+_fmt(item.amount)+' '+tp+' পরিশোধ হয়নি!', pri:'high' });
      }
    }
  });

  if (!advice.length) advice.push({ icon:'✅', text:'আপনার আর্থিক অবস্থা ভালো! এভাবেই চালিয়ে যান।', pri:'low' });

  var pMap = {high:3,medium:2,low:1};
  advice.sort(function(a,b){ return pMap[b.pri]-pMap[a.pri]; });
  advice = advice.slice(0,8);

  // Build slider slides
  var track = document.getElementById('sliderTrack');
  var dotsContainer = document.getElementById('sliderDots');
  if (!track || !dotsContainer) return;

  _ANL_SLIDER.total = advice.length;
  _ANL_SLIDER.cur = 0;
  clearInterval(_ANL_SLIDER.timer);
  clearInterval(_ANL_SLIDER.progTimer);

  var slidesHtml = '';
  advice.forEach(function(item){
    slidesHtml += '<div class="anl-slide">'
      + '<div class="anl-adv ' + item.pri + '">'
      + '<span class="ai-ico">' + item.icon + '</span>'
      + '<p class="ai-txt">' + item.text + '</p>'
      + '</div></div>';
  });
  track.innerHTML = slidesHtml;
  track.style.transform = 'translateX(0%)';

  var dotsHtml = '';
  advice.forEach(function(_, i){
    dotsHtml += '<button class="anl-dot' + (i===0?' on':'') + '" onclick="_anlSliderGoto('+i+')" aria-label="স্লাইড '+(i+1)+'"></button>';
  });
  dotsContainer.innerHTML = dotsHtml;

  var counter = document.getElementById('slideCounter');
  if (counter) counter.textContent = '1/' + advice.length;

  _anlInitSliderTouch();
  if (advice.length > 1) _anlSliderResetTimer();
  else { var fill=document.getElementById('slideProgFill'); if(fill){fill.style.width='100%';} }
}

/* ══ DARK MODE OBSERVER ══ */
var _dmObs = new MutationObserver(function(){
  var p = _ANL.period;
  var inc = _filterByPeriod(DB.get('income')||[], p);
  var exp = _filterByPeriod(DB.get('expense')||[], p);
  _buildCharts(inc, exp, DB.get('savings')||[]);
});
_dmObs.observe(document.body, {attributes:true, attributeFilter:['class']});

/* ══ INIT ══ */
document.addEventListener('DOMContentLoaded', function(){
  applyPageConfig();
  _buildMonthTabs();
  loadAnalysis();
});
