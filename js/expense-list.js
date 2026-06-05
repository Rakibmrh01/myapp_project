var _itemCache = {};
var _cacheIdx  = 0;
function _cacheItem(item) { var k='c'+(++_cacheIdx); _itemCache[k]=item; return k; }
function _getCachedItem(k) { return _itemCache[k]||null; }

// Daily Account — expense-list.js v4.0
// Live search + highlight + no white flash + scroll restore

var currentView      = 'card';
var currentPeriod    = 'monthly';
var allExpenses      = [];
var filteredExpenses = [];
var deleteIndex      = null;
var currentSort      = 'date_new';

/* ── Lazy Loading ── */
var _shownCards  = 25;
var _shownMonths = 4;
var _lazyScrollBound = false;

/* ── Search state ── */
var _srchTimer = null;
var _srchQ     = '';

function _isFiltered() {
    var q  = document.getElementById('searchInput')  ? document.getElementById('searchInput').value.trim()  : '';
    var sf = document.getElementById('categoryFilter')||document.getElementById('sourceFilter');
    var sfv = sf ? sf.value : 'all';
    return q !== '' || sfv !== 'all';
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
    if (_lazyScrollBound) return; _lazyScrollBound = true;
    window.addEventListener('scroll', function() {
        try { sessionStorage.setItem('__sp_expense', window.scrollY); } catch(e) {}
        if (_isFiltered()) return;
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 320) {
            _shownCards += 25; _shownMonths += 3; _doRender();
        }
    }, { passive: true });
}

function _restoreScroll_expense() {
    try { var sp=sessionStorage.getItem('__sp_expense'); if(sp) setTimeout(function(){ window.scrollTo(0,parseInt(sp)); },150); } catch(e) {}
}

function _savePageState_expense() {
    try { sessionStorage.setItem('__pst_expense', JSON.stringify({view:currentView,sort:currentSort,sc:_shownCards,sm:_shownMonths})); } catch(e) {}
}
function _restorePageState_expense() {
    try { var s=JSON.parse(sessionStorage.getItem('__pst_expense')||'null'); if(!s) return; currentView=s.view||'card'; currentSort=s.sort||'date_new'; _shownCards=s.sc||25; _shownMonths=s.sm||4; } catch(e) {}
}

document.addEventListener('DOMContentLoaded', function() {
    _restorePageState_expense();
    loadExpenses(); updateSummary(); applySortToFiltered();
    document.querySelectorAll('.toggle-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.view===currentView); });
    _safe2('cardView',currentView==='card'?'block':'none');
    _safe2('tableView',currentView==='table'?'block':'none');
    _safe2('analysisView',currentView==='analysis'?'block':'none');
    renderCurrentView();
    setTimeout(_populateCategoryFilter, 100);
    var addForm=document.getElementById('addExpenseForm'); if(addForm) addForm.addEventListener('submit',submitAddExpense);
    var editForm=document.getElementById('editForm'); if(editForm) editForm.addEventListener('submit',submitEditExpense);
    _bindLazyScroll();
    _restoreScroll_expense();
    document.addEventListener('visibilitychange', function(){ if(document.hidden) _savePageState_expense(); });
    window.addEventListener('pagehide', _savePageState_expense);
});

function loadExpenses() { allExpenses=DB.get('expense')||[]; filteredExpenses=allExpenses.slice(); }
function _safe(id,val){ var el=document.getElementById(id); if(el) el.textContent=val; }
function _safe2(id,disp){ var el=document.getElementById(id); if(el) el.style.display=disp; }

function updateSummary() {
    var total=filteredExpenses.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var count=filteredExpenses.length; var avg=count>0?total/count:0;
    _safe('totalExpense','৳ '+Math.round(total)); _safe('totalEntries',count); _safe('avgExpense','৳ '+Math.round(avg));
}

/* ── Live Search ── */
function searchExpense() {
    clearTimeout(_srchTimer);
    _srchTimer = setTimeout(function() {
        var inp = document.getElementById('searchInput');
        var q   = inp ? inp.value.toLowerCase().trim() : '';
        filteredExpenses = q === ''
            ? allExpenses.slice()
            : allExpenses.filter(function(i) {
                return (i.category||'').toLowerCase().indexOf(q) !== -1
                    || (i.source||'').toLowerCase().indexOf(q)   !== -1
                    || (i.note||'').toLowerCase().indexOf(q)     !== -1;
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
    filteredExpenses = allExpenses.slice();
    applySortToFiltered(); updateSummary(); _doRender();
}

/* ── Unified render dispatcher ── */
function _doRender() {
    var isEmpty = filteredExpenses.length === 0;
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
        badge.innerHTML = '🔍&nbsp;<strong>' + _escHtml(_srchQ) + '</strong>&ensp;—&ensp;' + filteredExpenses.length + ' টি ফলাফল'
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

    var list = _srchQ ? filteredExpenses : filteredExpenses.slice(0, _shownCards);
    list.forEach(function(expense) {
        var idx = allExpenses.findIndex(function(x){ return (x.id&&x.id===expense.id)||JSON.stringify(x)===JSON.stringify(expense); });
        var ck  = _cacheItem(expense);
        var isFav = !!expense.favorite; var isPending = !!expense.pending;
        var daysAgo = typeof getDaysAgo==='function' ? getDaysAgo(expense.date) : '';

        var card = document.createElement('div');
        card.className = 'list-card expense-card'+(isFav?' favorite-card':'')+(isPending?' pending-card':'');
        card.innerHTML =
            '<div class="card-header">'
            +'<h3>'+_hl(expense.category||expense.source||'(নাম নেই)', _srchQ)+'</h3>'
            +'<span class="amount expense-amount">৳ '+Math.round(parseFloat(expense.amount||0))+'</span>'
            +'</div>'
            +'<div class="card-meta">'
            +'📅 <span class="card-date">'+formatDateDisplay(expense.date)+'</span>'
            +' &nbsp;·&nbsp; 🕑 '+formatTimeAMPM(expense.time)
            +(expense.note?'<br>📝 '+_hl(expense.note, _srchQ):'')
            +(isPending?'<br><span style="color:#f59e0b;font-weight:700">⏸ স্থগিত</span>':'')
            +(daysAgo?'<br><span class="days-ago-badge">🕐 '+daysAgo+'</span>':'')
            +'</div>'
            +(expense.photo||expense.drawing||expense.voice ? '<div class="card-media-section">'+(expense.photo?'<img class="card-media-photo" src="'+expense.photo+'" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+expense.photo+'\')" />':'')+(expense.drawing?'<div class="card-media-drawing" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+expense.drawing+'\')" ><img src="'+expense.drawing+'" /></div>':'')+(expense.voice?'<span class="card-media-voice" onclick="_playCardVoice(\''+expense.id+'\',\'expense\')" >🎙️ শুনুন</span>':'')+'</div>':'')
            +'<div class="card-actions">'
            +'<button class="action-btn edit-btn" onclick="openEditModal('+idx+')">✏️ সম্পাদনা</button>'
            +'<button class="action-btn delete-btn" onclick="showDeleteModal('+idx+')">🗑️ মুছুন</button>'
            +'<button class="more-btn" onclick="_openMoreMenuCached(this,\'expense\',\''+ck+'\',\'expense\')">•••</button>'
            +'</div>';
        container.appendChild(card);
    });
    if (!_srchQ && filteredExpenses.length > _shownCards) {
        var mi = document.createElement('div');
        mi.style.cssText = 'text-align:center;padding:14px;color:#9ca3af;font-size:.8rem;font-weight:700';
        mi.textContent = '↓ স্ক্রোল করুন — আরও '+(filteredExpenses.length-_shownCards)+' টি বাকি';
        container.appendChild(mi);
    }
    setTimeout(initScrollAnim, 50);
}

function sortBy(val) { currentSort=val||currentSort; applySortToFiltered(); _doRender(); }
function applySortToFiltered() {
    filteredExpenses.sort(function(a,b){
        if(currentSort==='date_new') return new Date(b.date)-new Date(a.date);
        if(currentSort==='date_old') return new Date(a.date)-new Date(b.date);
        if(currentSort==='amt_high') return parseFloat(b.amount||0)-parseFloat(a.amount||0);
        if(currentSort==='amt_low')  return parseFloat(a.amount||0)-parseFloat(b.amount||0);
        if(currentSort==='name_az')  return (a.category||a.source||'').localeCompare(b.category||b.source||'');
        if(currentSort==='name_za')  return (b.category||b.source||'').localeCompare(a.category||a.source||'');
        return new Date(b.date)-new Date(a.date);
    });
}

function switchView(view) {
    currentView=view;
    _savePageState_expense();
    document.querySelectorAll('.toggle-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.view===view); });
    _safe2('cardView',view==='card'?'block':'none');
    _safe2('tableView',view==='table'?'block':'none');
    _safe2('analysisView',view==='analysis'?'block':'none');
    _doRender();
}

function renderCurrentView() { _doRender(); }
function renderCardView()    { _renderCardNow(); }

function renderTableView() {
    var container=document.getElementById('monthlyTables'); if(!container) return; container.innerHTML='';
    var monthGroups={};
    filteredExpenses.forEach(function(exp){ var d=new Date(exp.date); var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); if(!monthGroups[k]) monthGroups[k]=[]; monthGroups[k].push(exp); });
    var MONTHS=['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
    var _allKeys=Object.keys(monthGroups).sort().reverse();
    var _keysToShow=_srchQ?_allKeys:_allKeys.slice(0,_shownMonths);
    _keysToShow.forEach(function(k){
        var parts=k.split('-'); var yr=parts[0]; var mo=parts[1];
        var expenses=monthGroups[k]; var total=expenses.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
        var sec=document.createElement('div'); sec.className='month-table-section';
        sec.innerHTML='<div class="month-header expense-header"><h3>'+MONTHS[+mo-1]+' '+yr+'</h3><span class="month-total">মোট: ৳ '+Math.round(total)+'</span></div>'
            +'<div class="table-wrapper"><table class="excel-table"><thead><tr><th>ক্যাটাগরি</th><th>পরিমাণ</th><th>তারিখ</th><th>সময়</th></tr></thead><tbody>'
            +expenses.map(function(exp){ return '<tr><td>'+(exp.category||exp.source||'--')+'</td><td class="amount-cell">৳ '+Math.round(parseFloat(exp.amount||0))+'</td><td class="date-cell">'+formatDateDisplay(exp.date)+'</td><td>'+formatTimeAMPM(exp.time)+'</td></tr>'; }).join('')
            +'<tr class="total-row"><td><strong>মোট</strong></td><td class="amount-cell"><strong>৳ '+Math.round(total)+'</strong></td><td colspan="2"></td></tr>'
            +'</tbody></table></div>';
        container.appendChild(sec);
    });
    if(!_srchQ&&_allKeys&&_allKeys.length>_shownMonths){
        var mi=document.createElement('div'); mi.style.cssText='text-align:center;padding:14px;color:#9ca3af;font-size:.8rem;font-weight:700';
        mi.textContent='↓ স্ক্রোল করুন — আরও '+(_allKeys.length-_shownMonths)+' মাস বাকি'; container.appendChild(mi);
    }
}

var _laCharts = {};
function _laDestroy(k){ if(_laCharts[k]){try{_laCharts[k].destroy();}catch(e){}_laCharts[k]=null;} }
var _LA_COLORS=['#ef4444','#f59e0b','#3b82f6','#a855f7','#10b981','#ec4899','#06b6d4','#f97316'];
function _laFmt(n){ return '৳ '+Math.round(n).toLocaleString('en-BD'); }

function renderAnalysisView() {
    var now=new Date(); var m=now.getMonth(); var yr=now.getFullYear();
    var isDark=document.body.classList.contains('dark-mode');
    var txtClr=isDark?'#e2e8f0':'#374151';
    var list=allExpenses.filter(function(i){var d=new Date(i.date);return d.getMonth()===m&&d.getFullYear()===yr;});
    var total=list.reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var max=list.reduce(function(s,i){return Math.max(s,parseFloat(i.amount||0));},0);
    var days=new Date(yr,m+1,0).getDate();
    _safe('currentMonthExpense',_laFmt(total));
    _safe('avgDailyExpense',_laFmt(total/days));
    _safe('maxExpense',_laFmt(max));
    _safe('currentMonthEntries',list.length);
    var lm=m===0?11:m-1; var ly=m===0?yr-1:yr;
    var lastTotal=allExpenses.filter(function(i){var d=new Date(i.date);return d.getMonth()===lm&&d.getFullYear()===ly;}).reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var yrTotal=allExpenses.filter(function(i){return new Date(i.date).getFullYear()===yr;}).reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var change=lastTotal>0?((total-lastTotal)/lastTotal*100).toFixed(1):0;
    _safe('yearlyExpense',_laFmt(yrTotal));
    var pill=document.getElementById('laChangePill');
    if(pill){pill.textContent=(change>0?'▲ +':change<0?'▼ ':'')+change+'%';pill.className='la-change-pill'+(change>=0?' neg':'');}
    var months={};
    allExpenses.forEach(function(i){if(!i.date)return;var mk=i.date.substring(0,7);if(!months[mk])months[mk]=0;months[mk]+=parseFloat(i.amount||0);});
    var mkeys=Object.keys(months).sort().slice(-6);
    var MN=['','জান','ফেব','মার','এপ্র','মে','জুন','জুল','আগ','সেপ','অক্ট','নভ','ডিস'];
    var barLabels=mkeys.map(function(k){var p=k.split('-');return (MN[parseInt(p[1])]||p[1])+"'"+(p[0].slice(-2));});
    _laDestroy('bar');
    var bctx=document.getElementById('laBarChart');
    if(bctx){_laCharts.bar=new Chart(bctx,{type:'bar',data:{labels:barLabels,datasets:[{label:'ব্যয়',data:mkeys.map(function(k){return months[k];}),backgroundColor:'#ef444488',borderColor:'#ef4444',borderWidth:2,borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return '৳'+v;},color:txtClr,font:{size:10}},grid:{color:'rgba(0,0,0,.05)'}},x:{ticks:{color:txtClr,font:{size:10}}}}}}); }
    var cats={};
    allExpenses.forEach(function(i){var c=i.category||i.source||'অন্যান্য';cats[c]=(cats[c]||0)+parseFloat(i.amount||0);});
    var ckeys=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];}).slice(0,8);
    var ctotal=ckeys.reduce(function(t,k){return t+cats[k];},0);
    _laDestroy('pie');
    var pctx=document.getElementById('laPieChart');
    if(pctx&&ckeys.length){
        _laCharts.pie=new Chart(pctx,{type:'doughnut',data:{labels:ckeys,datasets:[{data:ckeys.map(function(k){return cats[k];}),backgroundColor:_LA_COLORS.slice(0,ckeys.length).map(function(c){return c+'cc';}),borderColor:_LA_COLORS.slice(0,ckeys.length),borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false}}}});
        var leg=document.getElementById('laPieLegend');
        if(leg){leg.innerHTML=ckeys.slice(0,6).map(function(k,i){return '<div class="la-leg-item"><span class="la-leg-dot" style="background:'+_LA_COLORS[i]+'"></span><span class="la-leg-name">'+k+'</span><span class="la-leg-amt">'+Math.round(ctotal>0?(cats[k]/ctotal*100):0)+'%</span></div>';}).join('');}
    }
}
function changePeriod(period) { currentPeriod=period; document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.period===period); }); renderAnalysisView(); }

function showDeleteModal(index) { deleteIndex=index; _safe2('deleteModal','flex'); }
function closeDeleteModal()     { deleteIndex=null;  _safe2('deleteModal','none'); }

function confirmDeleteExpense() {
    if (deleteIndex===null) return;
    if (deleteIndex>=0&&deleteIndex<allExpenses.length) {
        addToTrash('expense', allExpenses[deleteIndex]);
        allExpenses.splice(deleteIndex,1); DB.set('expense',allExpenses);
        closeDeleteModal(); loadExpenses(); filteredExpenses=allExpenses.slice(); _srchQ=''; updateSummary(); _doRender();
        showToast('🗑️ ট্র্যাশে গেছে ↩');
    }
}
function confirmDelete() { confirmDeleteExpense(); }

function submitAddExpense(e) {
    e.preventDefault();
    var category=(document.getElementById('category')||document.getElementById('expenseCategory')||{value:''}).value.trim();
    var source=(document.getElementById('source')||{value:''}).value.trim();
    var amount=(document.getElementById('amount')||document.getElementById('expenseAmount')||{value:''}).value;
    var date=(document.getElementById('date')||document.getElementById('expenseDate')||{value:nowDate()}).value||nowDate();
    var time=(document.getElementById('time')||document.getElementById('expenseTime')||{value:nowTime()}).value||nowTime();
    var note=(document.getElementById('note')||document.getElementById('expenseNote')||{value:''}).value||'';
    if ((!category&&!source)||!amount||parseFloat(amount)<=0) { showToast('❌ ক্যাটাগরি ও পরিমাণ লিখুন'); return; }
    DB.add('expense',{category:category||source,source:source||category,amount:parseFloat(amount),date:date,time:time,note:note});
    showToast('✅ ব্যয় যোগ হয়েছে'); e.target.reset();
    var dateEl=document.getElementById('date')||document.getElementById('expenseDate'); if(dateEl) dateEl.value=nowDate();
    var timeEl=document.getElementById('time')||document.getElementById('expenseTime'); if(timeEl) timeEl.value=nowTime();
    loadExpenses(); filteredExpenses=allExpenses.slice(); updateSummary(); _doRender();
}

function openEditModal(index) {
    var exp=allExpenses[index]; if(!exp) return;
    document.getElementById('editIndex').value=index;
    var catEl=document.getElementById('editCategory'); if(catEl) catEl.value=exp.category||exp.source||'';
    var srcEl=document.getElementById('editSource');   if(srcEl) srcEl.value=exp.source||exp.category||'';
    document.getElementById('editAmount').value=exp.amount||'';
    document.getElementById('editDate').value=exp.date||'';
    var timeEl=document.getElementById('editTime'); if(timeEl) timeEl.value=exp.time||'';
    document.getElementById('editNote').value=exp.note||'';
    _safe2('editModal','flex');
    if (typeof _initFormMedia==='function') _initFormMedia(exp.photo||null,exp.drawing||null,exp.voice||null);
}
function closeEditModal() { _safe2('editModal','none'); }

function submitEditExpense(e) {
    e.preventDefault();
    var idx=parseInt(document.getElementById('editIndex').value);
    if (idx>=0&&idx<allExpenses.length) {
        var catEl=document.getElementById('editCategory'); var srcEl=document.getElementById('editSource');
        var newCat=(catEl?catEl.value:'')||allExpenses[idx].category||'';
        var newSrc=(srcEl?srcEl.value:'')||allExpenses[idx].source||'';
        allExpenses[idx]=Object.assign({},allExpenses[idx],{
            category:newCat, source:newSrc,
            amount:Number(document.getElementById('editAmount').value),
            date:document.getElementById('editDate').value,
            time:document.getElementById('editTime')?document.getElementById('editTime').value:allExpenses[idx].time,
            note:document.getElementById('editNote').value,
        });
        if (typeof _formMedia!=='undefined') {
            if (_formMedia.photo)   allExpenses[idx].photo   = _formMedia.photo;
            if (_formMedia.drawing) allExpenses[idx].drawing = _formMedia.drawing;
            if (_formMedia.voice)   allExpenses[idx].voice   = _formMedia.voice;
            _formMedia.photo=null; _formMedia.drawing=null; _formMedia.voice=null;
        }
        DB.set('expense',allExpenses); loadExpenses(); filteredExpenses=allExpenses.slice(); updateSummary(); _doRender();
        closeEditModal(); showToast('✅ আপডেট হয়েছে');
    }
}

function showEmptyState() { _safe2('emptyState','block'); _safe2('cardView','none'); _safe2('tableView','none'); _safe2('analysisView','none'); }
function hideEmptyState()  { _safe2('emptyState','none'); }

function filterByCategory() {
    var val = document.getElementById('categoryFilter') ? document.getElementById('categoryFilter').value : 'all';
    filteredExpenses = (val === 'all') ? allExpenses.slice() : allExpenses.filter(function(i){ return (i.category||i.source||'') === val; });
    applySortToFiltered(); updateSummary(); _doRender();
}

function _populateCategoryFilter() {
    var sel = document.getElementById('categoryFilter'); if (!sel) return;
    var defaults = ['খাবার','পরিবহন','বিল/ইউটিলিটি','স্বাস্থ্য','শিক্ষা','পোশাক','বিনোদন','বাড়িভাড়া','কেনাকাটা','অন্যান্য'];
    var customCats = JSON.parse(localStorage.getItem('__custom_cat_expense') || '[]');
    var dbCats = {};
    (DB.get('expense')||[]).forEach(function(i){ var cv=i.category||i.source||''; if(cv) dbCats[cv]=true; });
    var allCats = [];
    defaults.forEach(function(d){ if(allCats.indexOf(d)===-1) allCats.push(d); });
    customCats.forEach(function(d){ if(allCats.indexOf(d)===-1) allCats.push(d); });
    Object.keys(dbCats).sort().forEach(function(d){ if(allCats.indexOf(d)===-1) allCats.push(d); });
    while (sel.options.length > 1) sel.remove(1);
    allCats.forEach(function(cat){ var opt=document.createElement('option'); opt.value=cat; opt.textContent=cat; sel.appendChild(opt); });
}

function setSortChip(btn, val) {
    document.querySelectorAll('.sort-chip').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    sortBy(val);
}
