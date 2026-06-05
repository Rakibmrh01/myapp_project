var _itemCache = {};
var _cacheIdx  = 0;
function _cacheItem(item) { var k='c'+(++_cacheIdx); _itemCache[k]=item; return k; }
function _getCachedItem(k) { return _itemCache[k]||null; }

// Daily Account — income-list.js v4.0
// Live search + highlight + cache + no white flash + scroll restore

var currentView     = 'card';
var currentPeriod   = 'monthly';
var allIncomes      = [];
var filteredIncomes = [];
var deleteIndex     = null;
var currentSort     = 'date_new';

/* ── Lazy Loading ── */
var _shownCards  = 25;
var _shownMonths = 4;
var _lazyScrollBound = false;

/* ── Search state ── */
var _srchTimer = null;
var _srchQ     = '';

function _isFiltered() {
    var q  = document.getElementById('searchInput')  ? document.getElementById('searchInput').value.trim()  : '';
    var sf = document.getElementById('sourceFilter') ? document.getElementById('sourceFilter').value : 'all';
    return q !== '' || sf !== 'all';
}

function _hl(text, q) {
    if (!q || !text) return String(text || '');
    var s = String(text);
    var e = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    try { return s.replace(new RegExp('('+e+')','gi'),'<mark class="srch-hl">$1</mark>'); }
    catch(er) { return s; }
}

function _escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Lazy Scroll ── */
function _bindLazyScroll() {
    if (_lazyScrollBound) return;
    _lazyScrollBound = true;
    window.addEventListener('scroll', function() {
        try { sessionStorage.setItem('__sp_income', window.scrollY); } catch(e) {}
        if (_isFiltered()) return;
        var bottom = window.scrollY + window.innerHeight;
        var docH   = document.documentElement.scrollHeight;
        if (bottom >= docH - 300) {
            var oldC = _shownCards; var oldM = _shownMonths;
            _shownCards  += 25;
            _shownMonths += 3;
            if (_shownCards !== oldC || _shownMonths !== oldM) _doRender();
        }
    }, { passive: true });
}

function _restoreScroll() {
    try {
        var sp = sessionStorage.getItem('__sp_income');
        if (sp) setTimeout(function() { window.scrollTo(0, parseInt(sp)); }, 150);
    } catch(e) {}
}

/* ── Page State ── */
function _savePageState() {
    try {
        sessionStorage.setItem('__pst_income', JSON.stringify({
            view: currentView, sort: currentSort,
            shownCards: _shownCards, shownMonths: _shownMonths
        }));
    } catch(e) {}
}

function _restorePageState() {
    try {
        var s = JSON.parse(sessionStorage.getItem('__pst_income') || 'null');
        if (!s) return;
        currentView  = s.view  || 'card';
        currentSort  = s.sort  || 'date_new';
        _shownCards  = s.shownCards  || 25;
        _shownMonths = s.shownMonths || 4;
    } catch(e) {}
}

document.addEventListener('DOMContentLoaded', function() {
    _restorePageState();
    loadIncomes(); updateSummary(); applySortToFiltered();
    document.querySelectorAll('.toggle-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.view===currentView); });
    _safe2('cardView',     currentView==='card'     ?'block':'none');
    _safe2('tableView',    currentView==='table'    ?'block':'none');
    _safe2('analysisView', currentView==='analysis' ?'block':'none');
    renderCurrentView();
    setTimeout(_populateSourceFilter, 100);
    _bindLazyScroll();
    _restoreScroll();
    var addForm=document.getElementById('addIncomeForm'); if(addForm) addForm.addEventListener('submit',submitAddIncome);
    var editForm=document.getElementById('editForm'); if(editForm) editForm.addEventListener('submit',submitEditIncome);
    document.addEventListener('visibilitychange', function(){ if(document.hidden) _savePageState(); });
    window.addEventListener('pagehide', _savePageState);
});

function loadIncomes() { allIncomes=DB.get('income')||[]; filteredIncomes=allIncomes.slice(); }
function _safe(id,val){ var el=document.getElementById(id); if(el) el.textContent=val; }
function _safe2(id,disp){ var el=document.getElementById(id); if(el) el.style.display=disp; }

function updateSummary() {
    var total=filteredIncomes.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var count=filteredIncomes.length; var avg=count>0?total/count:0;
    _safe('totalIncome','৳ '+Math.round(total)); _safe('totalEntries',count); _safe('avgIncome','৳ '+Math.round(avg));
}

/* ── Live Search ── */
function searchIncome() {
    clearTimeout(_srchTimer);
    _srchTimer = setTimeout(function() {
        var inp = document.getElementById('searchInput');
        var q   = inp ? inp.value.toLowerCase().trim() : '';
        filteredIncomes = q === ''
            ? allIncomes.slice()
            : allIncomes.filter(function(i) {
                return (i.source||'').toLowerCase().indexOf(q) !== -1
                    || (i.note||'').toLowerCase().indexOf(q)   !== -1
                    || (i.category||'').toLowerCase().indexOf(q) !== -1;
            });
        _srchQ = q;
        applySortToFiltered();
        updateSummary();
        _doRender();
    }, 30);
}

function _clearSearch() {
    var inp = document.getElementById('searchInput');
    if (inp) { inp.value = ''; inp.dispatchEvent(new Event('input')); }
    _srchQ = '';
    filteredIncomes = allIncomes.slice();
    applySortToFiltered(); updateSummary(); _doRender();
}

/* ── Unified render dispatcher ── */
function _doRender() {
    var isEmpty = filteredIncomes.length === 0;
    _safe2('emptyState', isEmpty ? 'block' : 'none');
    _safe2('cardView',     (!isEmpty && currentView==='card')     ? 'block' : 'none');
    _safe2('tableView',    (!isEmpty && currentView==='table')    ? 'block' : 'none');
    _safe2('analysisView', (!isEmpty && currentView==='analysis') ? 'block' : 'none');

    /* badge */
    var badge = document.getElementById('_srchBadge');
    if (_srchQ && !isEmpty) {
        if (!badge) {
            badge = document.createElement('div');
            badge.id = '_srchBadge';
            badge.style.cssText = 'display:flex;align-items:center;gap:8px;padding:7px 14px;font-size:.8rem;font-weight:700;color:#b45309;background:#fffbeb;border-bottom:1.5px solid #fde68a;position:sticky;top:0;z-index:9';
            var cv = document.getElementById('cardView');
            if (cv && cv.parentNode) cv.parentNode.insertBefore(badge, cv);
        }
        badge.innerHTML = '🔍&nbsp;<strong>' + _escHtml(_srchQ) + '</strong>&ensp;—&ensp;' + filteredIncomes.length + ' টি ফলাফল'
            + '<button onclick="_clearSearch()" style="margin-left:auto;padding:4px 12px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-size:.72rem;font-weight:800;cursor:pointer;font-family:inherit">✕</button>';
    } else {
        if (badge) badge.remove();
    }

    if (isEmpty) return;
    if (currentView === 'card')     _renderCardNow();
    else if (currentView === 'table')    renderTableView();
    else if (currentView === 'analysis') renderAnalysisView();
}

/* ── Card render — NO setTimeout blank, direct DOM write ── */
function _renderCardNow() {
    var container = document.getElementById('cardView');
    if (!container) return;
    container.innerHTML = '';
    if (_srchQ) container.classList.add('srch-active');
    else        container.classList.remove('srch-active');

    var list = _srchQ ? filteredIncomes : filteredIncomes.slice(0, _shownCards);
    list.forEach(function(income) {
        var idx = allIncomes.findIndex(function(x){ return (x.id&&x.id===income.id)||JSON.stringify(x)===JSON.stringify(income); });
        var ck  = _cacheItem(income);
        var isFav = !!income.favorite; var isPending = !!income.pending;
        var daysAgo = typeof getDaysAgo==='function' ? getDaysAgo(income.date) : '';

        var card = document.createElement('div');
        card.className = 'list-card income-card'+(isFav?' favorite-card':'')+(isPending?' pending-card':'');
        card.innerHTML =
            '<div class="card-header">'
            +'<h3>'+_hl(income.source||'(নাম নেই)', _srchQ)+'</h3>'
            +'<span class="amount">৳ '+Math.round(parseFloat(income.amount||0))+'</span>'
            +'</div>'
            +'<div class="card-meta">'
            +'📅 <span class="card-date">'+formatDateDisplay(income.date)+'</span>'
            +' &nbsp;·&nbsp; 🕑 '+formatTimeAMPM(income.time)
            +(income.note?'<br>📝 '+_hl(income.note, _srchQ):'')
            +(daysAgo?'<br><span class="days-ago-badge">🕐 '+daysAgo+'</span>':'')
            +(isPending?'<br><span style="color:#f59e0b;font-weight:700">⏸ স্থগিত</span>':'')
            +(income.relations&&income.relations.length?'<br><span class="relation-badge">🔗 '+income.relations.length+' সম্পর্ক</span>':'')
            +'</div>'
            +(income.photo||income.drawing||income.voice ? '<div class="card-media-section">'+(income.photo?'<img class="card-media-photo" src="'+income.photo+'" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+income.photo+'\')" />':'')+(income.drawing?'<div class="card-media-drawing" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+income.drawing+'\')" ><img src="'+income.drawing+'" /></div>':'')+(income.voice?'<span class="card-media-voice" onclick="_playCardVoice(\''+income.id+'\',\'income\')" > শুনুন</span>':'')+'</div>':'')
            +'<div class="card-actions">'
            +'<button class="action-btn edit-btn" onclick="openEditModal('+idx+')">✏️ সম্পাদনা</button>'
            +'<button class="action-btn delete-btn" onclick="showDeleteModal('+idx+')">🗑️ মুছুন</button>'
            +'<button class="more-btn" onclick="_openMoreMenuCached(this,\'income\',\''+ck+'\',\'income\')">•••</button>'
            +'</div>';
        container.appendChild(card);
    });
    if (!_srchQ && filteredIncomes.length > _shownCards) {
        var mi = document.createElement('div');
        mi.style.cssText = 'text-align:center;padding:14px;color:#9ca3af;font-size:.8rem;font-weight:700';
        mi.textContent = '↓ স্ক্রোল করুন — আরও '+(filteredIncomes.length-_shownCards)+' টি বাকি';
        container.appendChild(mi);
    }
    setTimeout(initScrollAnim, 50);
}

function sortBy(val) {
    currentSort = val || currentSort;
    applySortToFiltered();
    _doRender();
}

function applySortToFiltered() {
    filteredIncomes.sort(function(a,b){
        if(currentSort==='date_new') return new Date(b.date)-new Date(a.date);
        if(currentSort==='date_old') return new Date(a.date)-new Date(b.date);
        if(currentSort==='amt_high') return parseFloat(b.amount||0)-parseFloat(a.amount||0);
        if(currentSort==='amt_low')  return parseFloat(a.amount||0)-parseFloat(b.amount||0);
        if(currentSort==='name_az')  return (a.source||'').localeCompare(b.source||'');
        if(currentSort==='name_za')  return (b.source||'').localeCompare(a.source||'');
        return new Date(b.date)-new Date(a.date);
    });
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.toggle-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.view===view); });
    _safe2('cardView',view==='card'?'block':'none');
    _safe2('tableView',view==='table'?'block':'none');
    _safe2('analysisView',view==='analysis'?'block':'none');
    _savePageState();
    _doRender();
}

function renderCurrentView() { _doRender(); }

function renderCardView() { _renderCardNow(); }

function renderTableView() {
    var container=document.getElementById('monthlyTables'); if(!container) return; container.innerHTML='';
    var monthGroups={};
    filteredIncomes.forEach(function(inc){ var d=new Date(inc.date); var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); if(!monthGroups[k]) monthGroups[k]=[]; monthGroups[k].push(inc); });
    var MONTHS=['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
    var _allKeys=Object.keys(monthGroups).sort().reverse();
    var _keysToShow=_srchQ?_allKeys:_allKeys.slice(0,_shownMonths);
    _keysToShow.forEach(function(k){
        var parts=k.split('-'); var yr=parts[0]; var mo=parts[1];
        var incomes=monthGroups[k]; var total=incomes.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
        var sec=document.createElement('div'); sec.className='month-table-section';
        sec.innerHTML='<div class="month-header income-header"><h3>'+MONTHS[+mo-1]+' '+yr+'</h3><span class="month-total">মোট: ৳ '+Math.round(total)+'</span></div>'
            +'<div class="table-wrapper"><table class="excel-table"><thead><tr><th>উৎস</th><th>পরিমাণ</th><th>তারিখ</th><th>সময়</th></tr></thead><tbody>'
            +incomes.map(function(inc){ return '<tr><td>'+(inc.source||'--')+'</td><td class="amount-cell">৳ '+Math.round(parseFloat(inc.amount||0))+'</td><td class="date-cell">'+formatDateDisplay(inc.date)+'</td><td>'+formatTimeAMPM(inc.time)+'</td></tr>'; }).join('')
            +'<tr class="total-row"><td><strong>মোট</strong></td><td class="amount-cell"><strong>৳ '+Math.round(total)+'</strong></td><td colspan="2"></td></tr></tbody></table></div>';
        container.appendChild(sec);
    });
    if(!_srchQ&&_allKeys.length>_shownMonths){
        var mi=document.createElement('div'); mi.style.cssText='text-align:center;padding:14px;color:#9ca3af;font-size:.8rem;font-weight:700';
        mi.textContent='↓ স্ক্রোল করুন — আরও '+(_allKeys.length-_shownMonths)+' মাস বাকি'; container.appendChild(mi);
    }
}

var _laCharts = {};
function _laDestroy(k){ if(_laCharts[k]){try{_laCharts[k].destroy();}catch(e){}_laCharts[k]=null;} }
var _LA_COLORS=['#10b981','#3b82f6','#f59e0b','#a855f7','#ef4444','#06b6d4','#f97316','#8b5cf6'];
function _laFmt(n){ return '৳ '+Math.round(n).toLocaleString('en-BD'); }

function renderAnalysisView() {
    var now=new Date(); var m=now.getMonth(); var yr=now.getFullYear();
    var isDark=document.body.classList.contains('dark-mode');
    var txtClr=isDark?'#e2e8f0':'#374151';
    var list=allIncomes.filter(function(i){ var d=new Date(i.date); return d.getMonth()===m&&d.getFullYear()===yr; });
    var total=list.reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var max=list.reduce(function(s,i){return Math.max(s,parseFloat(i.amount||0));},0);
    var days=new Date(yr,m+1,0).getDate();
    _safe('currentMonthIncome',_laFmt(total));
    _safe('avgDailyIncome',_laFmt(total/days));
    _safe('maxIncome',_laFmt(max));
    _safe('currentMonthEntries',list.length);
    var lm=m===0?11:m-1; var ly=m===0?yr-1:yr;
    var lastTotal=allIncomes.filter(function(i){var d=new Date(i.date);return d.getMonth()===lm&&d.getFullYear()===ly;}).reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var yrTotal=allIncomes.filter(function(i){return new Date(i.date).getFullYear()===yr;}).reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var change=lastTotal>0?((total-lastTotal)/lastTotal*100).toFixed(1):0;
    _safe('yearlyTotal',_laFmt(yrTotal));
    var pill=document.getElementById('laChangePill');
    if(pill){pill.textContent=(change>0?'▲ +':change<0?'▼ ':'')+change+'%';pill.className='la-change-pill'+(change<0?' neg':'');}
    var months={};
    allIncomes.forEach(function(i){if(!i.date)return;var mk=i.date.substring(0,7);if(!months[mk])months[mk]=0;months[mk]+=parseFloat(i.amount||0);});
    var mkeys=Object.keys(months).sort().slice(-6);
    var MN=['','জান','ফেব','মার','এপ্র','মে','জুন','জুল','আগ','সেপ','অক্ট','নভ','ডিস'];
    var barLabels=mkeys.map(function(k){var p=k.split('-');return (MN[parseInt(p[1])]||p[1])+"'"+(p[0].slice(-2));});
    var barData=mkeys.map(function(k){return months[k];});
    _laDestroy('bar');
    var bctx=document.getElementById('laBarChart');
    if(bctx){_laCharts.bar=new Chart(bctx,{type:'bar',data:{labels:barLabels,datasets:[{label:'আয়',data:barData,backgroundColor:'#10b98188',borderColor:'#10b981',borderWidth:2,borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return '৳'+v;},color:txtClr,font:{size:10}},grid:{color:'rgba(0,0,0,.05)'}},x:{ticks:{color:txtClr,font:{size:10}}}}}}); }
    var srcs={};
    allIncomes.forEach(function(i){var s=i.source||'অন্যান্য';srcs[s]=(srcs[s]||0)+parseFloat(i.amount||0);});
    var skeys=Object.keys(srcs).sort(function(a,b){return srcs[b]-srcs[a];}).slice(0,8);
    var stotal=skeys.reduce(function(t,k){return t+srcs[k];},0);
    _laDestroy('pie');
    var pctx=document.getElementById('laPieChart');
    if(pctx&&skeys.length){
        _laCharts.pie=new Chart(pctx,{type:'doughnut',data:{labels:skeys,datasets:[{data:skeys.map(function(k){return srcs[k];}),backgroundColor:_LA_COLORS.slice(0,skeys.length).map(function(c){return c+'cc';}),borderColor:_LA_COLORS.slice(0,skeys.length),borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false}}}});
        var leg=document.getElementById('laPieLegend');
        if(leg){leg.innerHTML=skeys.slice(0,6).map(function(k,i){return '<div class="la-leg-item"><span class="la-leg-dot" style="background:'+_LA_COLORS[i]+'"></span><span class="la-leg-name">'+k+'</span><span class="la-leg-amt">'+Math.round(stotal>0?(srcs[k]/stotal*100):0)+'%</span></div>';}).join('');}
    }
}
function changePeriod(period) { currentPeriod=period; document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.period===period); }); renderAnalysisView(); }

function showDeleteModal(index) { deleteIndex=index; _safe2('deleteModal','flex'); }
function closeDeleteModal()     { deleteIndex=null;  _safe2('deleteModal','none'); }
function confirmDeleteIncome() {
    if(deleteIndex===null) return;
    if(deleteIndex>=0&&deleteIndex<allIncomes.length){ addToTrash('income',allIncomes[deleteIndex]); allIncomes.splice(deleteIndex,1); DB.set('income',allIncomes); closeDeleteModal(); loadIncomes(); filteredIncomes=allIncomes.slice(); _srchQ=''; applySortToFiltered(); updateSummary(); _doRender(); showToast('🗑️ ট্র্যাশে গেছে ↩'); }
}
function confirmDelete() { confirmDeleteIncome(); }

function submitAddIncome(e) {
    e.preventDefault();
    var source=(document.getElementById('source')||document.getElementById('incomeSource')||{value:''}).value.trim();
    var amount=(document.getElementById('amount')||document.getElementById('incomeAmount')||{value:''}).value;
    var date=(document.getElementById('date')||document.getElementById('incomeDate')||{value:nowDate()}).value||nowDate();
    var time=(document.getElementById('time')||document.getElementById('incomeTime')||{value:nowTime()}).value||nowTime();
    var note=(document.getElementById('note')||document.getElementById('incomeNote')||{value:''}).value||'';
    if(!source||!amount||parseFloat(amount)<=0){showToast('❌ উৎস ও পরিমাণ লিখুন');return;}
    DB.add('income',{source:source,amount:parseFloat(amount),date:date,time:time,note:note});
    showToast('✅ আয় যোগ হয়েছে'); e.target.reset();
    var dateEl=document.getElementById('date')||document.getElementById('incomeDate'); if(dateEl) dateEl.value=nowDate();
    var timeEl=document.getElementById('time')||document.getElementById('incomeTime'); if(timeEl) timeEl.value=nowTime();
    loadIncomes(); filteredIncomes=allIncomes.slice(); applySortToFiltered(); updateSummary(); _doRender();
}
function openEditModal(index) {
    var inc=allIncomes[index]; if(!inc) return;
    document.getElementById('editIndex').value=index;
    document.getElementById('editSource').value=inc.source||'';
    document.getElementById('editAmount').value=inc.amount||'';
    document.getElementById('editDate').value=inc.date||'';
    var timeEl=document.getElementById('editTime'); if(timeEl) timeEl.value=inc.time||'';
    document.getElementById('editNote').value=inc.note||'';
    _safe2('editModal','flex');
    if (typeof _initFormMedia==='function') _initFormMedia(inc.photo||null,inc.drawing||null,inc.voice||null);
}
function closeEditModal() { _safe2('editModal','none'); }
function submitEditIncome(e) {
    e.preventDefault();
    var idx=parseInt(document.getElementById('editIndex').value);
    if(idx>=0&&idx<allIncomes.length){
        allIncomes[idx]=Object.assign({},allIncomes[idx],{ source:document.getElementById('editSource').value, amount:Number(document.getElementById('editAmount').value), date:document.getElementById('editDate').value, time:document.getElementById('editTime')?document.getElementById('editTime').value:allIncomes[idx].time, note:document.getElementById('editNote').value });
        if (typeof _formMedia!=='undefined') {
            if (_formMedia.photo)   allIncomes[idx].photo   = _formMedia.photo;
            if (_formMedia.drawing) allIncomes[idx].drawing = _formMedia.drawing;
            if (_formMedia.voice)   allIncomes[idx].voice   = _formMedia.voice;
            _formMedia.photo=null; _formMedia.drawing=null; _formMedia.voice=null;
        }
        DB.set('income',allIncomes); loadIncomes(); filteredIncomes=allIncomes.slice(); applySortToFiltered(); updateSummary(); _doRender(); closeEditModal(); showToast('✅ আপডেট হয়েছে');
    }
}
function showEmptyState() { _safe2('emptyState','block'); _safe2('cardView','none'); _safe2('tableView','none'); _safe2('analysisView','none'); }
function hideEmptyState()  { _safe2('emptyState','none'); }

function setSortChip(btn, val) {
    document.querySelectorAll('.sort-chip').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    sortBy(val);
}

function filterBySource() {
    var val = document.getElementById('sourceFilter') ? document.getElementById('sourceFilter').value : 'all';
    filteredIncomes = (val === 'all') ? allIncomes.slice() : allIncomes.filter(function(i){ return (i.source||'') === val; });
    applySortToFiltered(); updateSummary(); _doRender();
}

function _populateSourceFilter() {
    var sel = document.getElementById('sourceFilter'); if (!sel) return;
    var defaults = ['বেতন','ব্যবসা','ফ্রিল্যান্স','কমিশন','ভাড়া','বিনিয়োগ','উপহার','বোনাস','অন্যান্য'];
    var custom = JSON.parse(localStorage.getItem('__custom_cat_income') || '[]');
    var dbSrc = {};
    (DB.get('income')||[]).forEach(function(i){ if(i.source) dbSrc[i.source]=true; });
    var all = [];
    defaults.forEach(function(d){ if(all.indexOf(d)===-1) all.push(d); });
    custom.forEach(function(d){ if(all.indexOf(d)===-1) all.push(d); });
    Object.keys(dbSrc).sort().forEach(function(d){ if(all.indexOf(d)===-1) all.push(d); });
    while (sel.options.length > 1) sel.remove(1);
    all.forEach(function(s){ var opt=document.createElement('option'); opt.value=s; opt.textContent=s; sel.appendChild(opt); });
}
