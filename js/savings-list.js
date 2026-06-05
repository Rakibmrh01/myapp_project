var _itemCache = {};
var _cacheIdx  = 0;
function _cacheItem(item) { var k='c'+(++_cacheIdx); _itemCache[k]=item; return k; }
function _getCachedItem(k) { return _itemCache[k]||null; }

// Daily Account — savings-list.js v4.0
// Live search + highlight + no white flash + scroll restore

var currentView     = 'card';
var allSavings      = [];
var filteredSavings = [];
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
    var q  = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : '';
    var sf = document.getElementById('typeFilter')||document.getElementById('sourceFilter')||document.getElementById('methodFilter');
    return q !== '' || (sf && sf.value !== 'all');
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
        try { sessionStorage.setItem('__sp_savings', window.scrollY); } catch(e) {}
        if (_isFiltered()) return;
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 320) {
            _shownCards += 25; _shownMonths += 3; _doRender();
        }
    }, { passive: true });
}

function _restoreScroll_savings() {
    try { var sp=sessionStorage.getItem('__sp_savings'); if(sp) setTimeout(function(){ window.scrollTo(0,parseInt(sp)); },150); } catch(e) {}
}

function _savePageState_savings() {
    try { sessionStorage.setItem('__pst_savings', JSON.stringify({view:currentView,sort:currentSort,sc:_shownCards,sm:_shownMonths})); } catch(e) {}
}
function _restorePageState_savings() {
    try { var s=JSON.parse(sessionStorage.getItem('__pst_savings')||'null'); if(!s) return; currentView=s.view||'card'; currentSort=s.sort||'date_new'; _shownCards=s.sc||25; _shownMonths=s.sm||4; } catch(e) {}
}

document.addEventListener('DOMContentLoaded', function() {
    _restorePageState_savings();
    loadSavings(); updateSummary(); applySortToFiltered();
    document.querySelectorAll('.toggle-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.view===currentView); });
    _safe2('cardView',currentView==='card'?'block':'none');
    _safe2('tableView',currentView==='table'?'block':'none');
    _safe2('analysisView',currentView==='analysis'?'block':'none');
    renderCurrentView();
    var addForm=document.getElementById('addSavingsForm'); if(addForm) addForm.addEventListener('submit',submitAddSavings);
    var editForm=document.getElementById('editForm'); if(editForm) editForm.addEventListener('submit',submitEditSavings);
    _bindLazyScroll(); _restoreScroll_savings();
    document.addEventListener('visibilitychange', function(){ if(document.hidden) _savePageState_savings(); });
    window.addEventListener('pagehide', _savePageState_savings);
});

function loadSavings() { allSavings=DB.get('savings')||[]; filteredSavings=allSavings.slice(); }
function _safe(id,val){ var el=document.getElementById(id); if(el) el.textContent=val; }
function _safe2(id,disp){ var el=document.getElementById(id); if(el) el.style.display=disp; }

function updateSummary() {
    var total=filteredSavings.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var count=filteredSavings.length; var avg=count>0?total/count:0;
    _safe('totalSavings','৳ '+Math.round(total)); _safe('totalEntries',count); _safe('avgSavings','৳ '+Math.round(avg));
}

/* ── Live Search ── */
function searchSavings() {
    clearTimeout(_srchTimer);
    _srchTimer = setTimeout(function() {
        var inp = document.getElementById('searchInput');
        var q   = inp ? inp.value.toLowerCase().trim() : '';
        filteredSavings = q === ''
            ? allSavings.slice()
            : allSavings.filter(function(i) {
                return (i.method||'').toLowerCase().indexOf(q) !== -1
                    || (i.bankName||'').toLowerCase().indexOf(q) !== -1
                    || (i.note||'').toLowerCase().indexOf(q)     !== -1
                    || (i.source||'').toLowerCase().indexOf(q)   !== -1;
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
    filteredSavings = allSavings.slice();
    applySortToFiltered(); updateSummary(); _doRender();
}

/* ── Unified render dispatcher ── */
function _doRender() {
    var isEmpty = filteredSavings.length === 0;
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
        badge.innerHTML = '🔍&nbsp;<strong>' + _escHtml(_srchQ) + '</strong>&ensp;—&ensp;' + filteredSavings.length + ' টি ফলাফল'
            + '<button onclick="_clearSearch()" style="margin-left:auto;padding:4px 12px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-size:.72rem;font-weight:800;cursor:pointer;font-family:inherit">✕</button>';
    } else {
        if (badge) badge.remove();
    }

    if (isEmpty) return;
    if (currentView === 'card')          _renderCardNow();
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

    var list = _srchQ ? filteredSavings : filteredSavings.slice(0, _shownCards);
    list.forEach(function(item) {
        var idx = allSavings.findIndex(function(x){ return (x.id&&x.id===item.id)||JSON.stringify(x)===JSON.stringify(item); });
        var ck  = _cacheItem(item);
        var isFav = !!item.favorite;
        var label = item.method||item.source||'সঞ্চয়';
        var bank  = item.bankName ? ' · 🏦 '+item.bankName : '';
        var daysAgo = typeof getDaysAgo==='function' ? getDaysAgo(item.date) : '';

        var card = document.createElement('div');
        card.className = 'list-card savings-card'+(isFav?' favorite-card':'');
        card.innerHTML =
            '<div class="card-header">'
            +'<h3>'+_hl(label+bank, _srchQ)+'</h3>'
            +'<span class="amount savings-amount">৳ '+Math.round(parseFloat(item.amount||0))+'</span>'
            +'</div>'
            +'<div class="card-meta">'
            +'📅 <span class="card-date">'+formatDateDisplay(item.date)+'</span>'
            +' &nbsp;·&nbsp; 🕑 '+formatTimeAMPM(item.time)
            +(item.note?'<br>📝 '+_hl(item.note, _srchQ):'')
            +(daysAgo?'<br><span class="days-ago-badge">🕐 '+daysAgo+'</span>':'')
            +'</div>'
            +(item.photo||item.drawing||item.voice ? '<div class="card-media-section">'+(item.photo?'<img class="card-media-photo" src="'+item.photo+'" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+item.photo+'\')" />':'')+(item.drawing?'<div class="card-media-drawing" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+item.drawing+'\')" ><img src="'+item.drawing+'" /></div>':'')+(item.voice?'<span class="card-media-voice" onclick="_playCardVoice(\''+item.id+'\',\'savings\')" >🎙️ শুনুন</span>':'')+'</div>':'')
            +'<div class="card-actions">'
            +'<button class="action-btn edit-btn" onclick="openEditModal('+idx+')">✏️ সম্পাদনা</button>'
            +'<button class="action-btn delete-btn" onclick="showDeleteModal('+idx+')">🗑️ মুছুন</button>'
            +'<button class="more-btn" onclick="_openMoreMenuCached(this,\'savings\',\''+ck+'\',\'savings\')">•••</button>'
            +'</div>';
        container.appendChild(card);
    });
    if (!_srchQ && filteredSavings.length > _shownCards) {
        var mi = document.createElement('div');
        mi.style.cssText = 'text-align:center;padding:14px;color:#9ca3af;font-size:.8rem;font-weight:700';
        mi.textContent = '↓ স্ক্রোল করুন — আরও '+(filteredSavings.length-_shownCards)+' টি বাকি';
        container.appendChild(mi);
    }
    setTimeout(initScrollAnim, 50);
}

function sortBy(val) { currentSort=val||currentSort; applySortToFiltered(); _doRender(); }
function applySortToFiltered() {
    filteredSavings.sort(function(a,b){
        if(currentSort==='date_new') return new Date(b.date)-new Date(a.date);
        if(currentSort==='date_old') return new Date(a.date)-new Date(b.date);
        if(currentSort==='amt_high') return parseFloat(b.amount||0)-parseFloat(a.amount||0);
        if(currentSort==='amt_low')  return parseFloat(a.amount||0)-parseFloat(b.amount||0);
        if(currentSort==='name_az')  return (a.method||'').localeCompare(b.method||'');
        if(currentSort==='name_za')  return (b.method||'').localeCompare(a.method||'');
        return new Date(b.date)-new Date(a.date);
    });
}

function switchView(view) {
    currentView=view;
    _savePageState_savings();
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
    filteredSavings.forEach(function(item){ var d=new Date(item.date); var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); if(!monthGroups[k]) monthGroups[k]=[]; monthGroups[k].push(item); });
    var MONTHS=['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
    var _allKeys=Object.keys(monthGroups).sort().reverse();
    var _keysToShow=_srchQ?_allKeys:_allKeys.slice(0,_shownMonths);
    _keysToShow.forEach(function(k){
        var parts=k.split('-'); var yr=parts[0]; var mo=parts[1];
        var items=monthGroups[k]; var total=items.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
        var sec=document.createElement('div'); sec.className='month-table-section';
        sec.innerHTML='<div class="month-header savings-header"><h3>'+MONTHS[+mo-1]+' '+yr+'</h3><span class="month-total">মোট: ৳ '+Math.round(total)+'</span></div>'
            +'<div class="table-wrapper"><table class="excel-table"><thead><tr><th>মাধ্যম</th><th>পরিমাণ</th><th>তারিখ</th><th>নোট</th></tr></thead><tbody>'
            +items.map(function(i){ return '<tr><td>'+(i.method||i.source||'--')+'</td><td class="amount-cell">৳ '+Math.round(parseFloat(i.amount||0))+'</td><td class="date-cell">'+formatDateDisplay(i.date)+'</td><td>'+(i.note||'--')+'</td></tr>'; }).join('')
            +'<tr class="total-row"><td><strong>মোট</strong></td><td class="amount-cell"><strong>৳ '+Math.round(total)+'</strong></td><td colspan="2"></td></tr>'
            +'</tbody></table></div>';
        container.appendChild(sec);
    });
    if(!_srchQ&&_allKeys.length>_shownMonths){var mi=document.createElement('div');mi.style.cssText='text-align:center;padding:14px;color:#9ca3af;font-size:.8rem;font-weight:700';mi.textContent='↓ স্ক্রোল করুন — আরও '+(_allKeys.length-_shownMonths)+' মাস বাকি';container.appendChild(mi);}
}

var _laCharts = {};
function _laDestroy(k){ if(_laCharts[k]){try{_laCharts[k].destroy();}catch(e){}_laCharts[k]=null;} }
function _laFmt(n){ return '৳ '+Math.round(n).toLocaleString('en-BD'); }
var _SAV_CLR = '#E2136E';

function renderAnalysisView() {
    var now=new Date(); var m=now.getMonth(); var yr=now.getFullYear();
    var isDark=document.body.classList.contains('dark-mode');
    var txtClr=isDark?'#e2e8f0':'#374151';
    var list=allSavings.filter(function(i){var d=new Date(i.date);return d.getMonth()===m&&d.getFullYear()===yr;});
    var mTotal=list.reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var allTotal=allSavings.reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var maxSav=allSavings.reduce(function(s,i){return Math.max(s,parseFloat(i.amount||0));},0);
    var yrTotal=allSavings.filter(function(i){return new Date(i.date).getFullYear()===yr;}).reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    _safe('currentMonthSavings',_laFmt(mTotal));
    _safe('totalSavingsKpi',_laFmt(allTotal));
    _safe('maxSaving',_laFmt(maxSav));
    _safe('currentMonthEntries',list.length);
    _safe('yearlyTotal',_laFmt(yrTotal));
    var lm=m===0?11:m-1; var ly=m===0?yr-1:yr;
    var lastMTotal=allSavings.filter(function(i){var d=new Date(i.date);return d.getMonth()===lm&&d.getFullYear()===ly;}).reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var change=lastMTotal>0?((mTotal-lastMTotal)/lastMTotal*100).toFixed(1):0;
    var pill=document.getElementById('laChangePill');
    if(pill){pill.textContent=(change>0?'▲ +':change<0?'▼ ':'')+change+'%';}
    var sorted=allSavings.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);});
    var cum=0, lineLabels=[], lineData=[];
    sorted.forEach(function(i){cum+=parseFloat(i.amount||0);lineLabels.push(i.date);lineData.push(cum);});
    if(!lineLabels.length){lineLabels=['শুরু'];lineData=[0];}
    _laDestroy('line');
    var lctx=document.getElementById('laLineChart');
    if(lctx){_laCharts.line=new Chart(lctx,{type:'line',data:{labels:lineLabels.map(function(l){if(l==='শুরু')return l;var p=l.split('-');return p[2]+'/'+p[1];}),datasets:[{label:'মোট সঞ্চয়',data:lineData,borderColor:_SAV_CLR,backgroundColor:_SAV_CLR+'28',tension:0.4,fill:true,borderWidth:2.5,pointRadius:3,pointBackgroundColor:_SAV_CLR}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return '৳'+v;},color:txtClr,font:{size:10}},grid:{color:'rgba(0,0,0,.05)'}},x:{ticks:{color:txtClr,maxTicksLimit:6,font:{size:10}}}}}}); }
    var months={};
    allSavings.forEach(function(i){if(!i.date)return;var mk=i.date.substring(0,7);if(!months[mk])months[mk]=0;months[mk]+=parseFloat(i.amount||0);});
    var mkeys=Object.keys(months).sort().slice(-6);
    var MN=['','জান','ফেব','মার','এপ্র','মে','জুন','জুল','আগ','সেপ','অক্ট','নভ','ডিস'];
    _laDestroy('bar');
    var bctx=document.getElementById('laBarChart');
    if(bctx){_laCharts.bar=new Chart(bctx,{type:'bar',data:{labels:mkeys.map(function(k){var p=k.split('-');return (MN[parseInt(p[1])]||p[1])+"'"+(p[0].slice(-2));}),datasets:[{label:'সঞ্চয়',data:mkeys.map(function(k){return months[k];}),backgroundColor:_SAV_CLR+'88',borderColor:_SAV_CLR,borderWidth:2,borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return '৳'+v;},color:txtClr,font:{size:10}},grid:{color:'rgba(0,0,0,.05)'}},x:{ticks:{color:txtClr,font:{size:10}}}}}}); }
}

function changePeriod(period) { document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.period===period); }); renderAnalysisView(); }

function showDeleteModal(index) { deleteIndex=index; _safe2('deleteModal','flex'); }
function closeDeleteModal()     { deleteIndex=null;  _safe2('deleteModal','none'); }

function confirmDeleteSavings() {
    if(deleteIndex===null) return;
    if(deleteIndex>=0&&deleteIndex<allSavings.length){
        addToTrash('savings',allSavings[deleteIndex]); allSavings.splice(deleteIndex,1); DB.set('savings',allSavings);
        closeDeleteModal(); loadSavings(); filteredSavings=allSavings.slice(); _srchQ=''; updateSummary(); _doRender();
        showToast('🗑️ ট্র্যাশে গেছে ↩');
    }
}
function confirmDelete() { confirmDeleteSavings(); }

function submitAddSavings(e) {
    e.preventDefault();
    var method=(document.getElementById('method')||{value:'cash'}).value||'cash';
    var amount=(document.getElementById('amount')||{value:''}).value;
    var date=(document.getElementById('date')||{value:nowDate()}).value||nowDate();
    var time=(document.getElementById('time')||{value:nowTime()}).value||nowTime();
    var note=(document.getElementById('note')||{value:''}).value||'';
    var bankName=(document.getElementById('bankName')||{value:''}).value||'';
    if (!amount||parseFloat(amount)<=0) { showToast('❌ পরিমাণ লিখুন'); return; }
    DB.add('savings',{method:method,bankName:bankName,source:'direct',amount:parseFloat(amount),date:date,time:time,note:note});
    showToast('✅ সঞ্চয় যোগ হয়েছে'); e.target.reset();
    var dateEl=document.getElementById('date'); if(dateEl) dateEl.value=nowDate();
    var timeEl=document.getElementById('time'); if(timeEl) timeEl.value=nowTime();
    loadSavings(); filteredSavings=allSavings.slice(); updateSummary(); _doRender();
}

function openEditModal(index) {
    var item=allSavings[index]; if(!item) return;
    document.getElementById('editIndex').value=index;
    var methodEl=document.getElementById('editMethod'); if(methodEl) methodEl.value=item.method||'cash';
    document.getElementById('editAmount').value=item.amount||'';
    document.getElementById('editDate').value=item.date||'';
    var timeEl=document.getElementById('editTime'); if(timeEl) timeEl.value=item.time||'';
    document.getElementById('editNote').value=item.note||'';
    var bankEl=document.getElementById('editBankName'); if(bankEl) bankEl.value=item.bankName||'';
    _safe2('editModal','flex');
    if (typeof _initFormMedia==='function') _initFormMedia(item.photo||null,item.drawing||null,item.voice||null);
}
function closeEditModal() { _safe2('editModal','none'); }

function submitEditSavings(e) {
    e.preventDefault();
    var idx=parseInt(document.getElementById('editIndex').value);
    if(idx>=0&&idx<allSavings.length){
        var methodEl=document.getElementById('editMethod'); var bankEl=document.getElementById('editBankName');
        allSavings[idx]=Object.assign({},allSavings[idx],{
            method:methodEl?methodEl.value:allSavings[idx].method,
            bankName:bankEl?bankEl.value:allSavings[idx].bankName,
            amount:Number(document.getElementById('editAmount').value),
            date:document.getElementById('editDate').value,
            time:document.getElementById('editTime')?document.getElementById('editTime').value:allSavings[idx].time,
            note:document.getElementById('editNote').value,
        });
        if (typeof _formMedia!=='undefined') {
            if (_formMedia.photo)   allSavings[idx].photo   = _formMedia.photo;
            if (_formMedia.drawing) allSavings[idx].drawing = _formMedia.drawing;
            if (_formMedia.voice)   allSavings[idx].voice   = _formMedia.voice;
            _formMedia.photo=null; _formMedia.drawing=null; _formMedia.voice=null;
        }
        DB.set('savings',allSavings); loadSavings(); filteredSavings=allSavings.slice(); updateSummary(); _doRender();
        closeEditModal(); showToast('✅ আপডেট হয়েছে');
    }
}

function showEmptyState() { _safe2('emptyState','block'); _safe2('cardView','none'); _safe2('tableView','none'); _safe2('analysisView','none'); }
function hideEmptyState()  { _safe2('emptyState','none'); }

function filterByMethod() {
    var val = document.getElementById('methodFilter') ? document.getElementById('methodFilter').value : 'all';
    filteredSavings = (val === 'all') ? allSavings.slice() : allSavings.filter(function(i){ return (i.method||'') === val; });
    applySortToFiltered(); updateSummary(); _doRender();
}

function toggleBankRow() {
    var method = document.getElementById('editMethod') ? document.getElementById('editMethod').value : '';
    var bankRow = document.getElementById('bankNameRow') || document.getElementById('editBankRow');
    if (bankRow) {
        bankRow.style.display = (method==='bank'||method==='bkash'||method==='nagad'||method==='rocket') ? 'block' : 'none';
    }
}

function setSortChip(btn, val) {
    document.querySelectorAll('.sort-chip').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    sortBy(val);
}
