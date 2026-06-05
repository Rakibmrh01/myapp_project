var _itemCache = {};
var _cacheIdx  = 0;
function _cacheItem(item) { var k='c'+(++_cacheIdx); _itemCache[k]=item; return k; }
function _getCachedItem(k) { return _itemCache[k]||null; }

// Daily Account — ledger-list.js v4.0
// Live search + highlight + no white flash + scroll restore

var currentView     = 'card';
var allLedgers      = [];
var filteredLedgers = [];
var deleteIndex     = null;
var currentSort     = 'date_new';
var activeTab       = 'all';

/* ── Lazy Loading ── */
var _shownCards  = 25;
var _shownMonths = 4;
var _lazyScrollBound = false;

/* ── Search state ── */
var _srchTimer = null;
var _srchQ     = '';

function _isFiltered() {
    var q  = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : '';
    var sf = document.getElementById('typeFilter');
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
        try { sessionStorage.setItem('__sp_ledger', window.scrollY); } catch(e) {}
        if (_isFiltered()) return;
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 320) {
            _shownCards += 25; _shownMonths += 3; _doRender();
        }
    }, { passive: true });
}

function _restoreScroll_ledger() {
    try { var sp=sessionStorage.getItem('__sp_ledger'); if(sp) setTimeout(function(){ window.scrollTo(0,parseInt(sp)); },150); } catch(e) {}
}

function _savePageState_ledger() {
    try { sessionStorage.setItem('__pst_ledger', JSON.stringify({view:currentView,sort:currentSort,sc:_shownCards,sm:_shownMonths})); } catch(e) {}
}
function _restorePageState_ledger() {
    try { var s=JSON.parse(sessionStorage.getItem('__pst_ledger')||'null'); if(!s) return; currentView=s.view||'card'; currentSort=s.sort||'date_new'; _shownCards=s.sc||25; _shownMonths=s.sm||4; } catch(e) {}
}

document.addEventListener('DOMContentLoaded', function() {
    _restorePageState_ledger();
    loadLedger(); updateSummary(); applySortToFiltered();
    document.querySelectorAll('.toggle-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.view===currentView); });
    _safe2('cardView',currentView==='card'?'block':'none');
    _safe2('tableView',currentView==='table'?'block':'none');
    _safe2('analysisView',currentView==='analysis'?'block':'none');
    renderCurrentView();
    var editForm=document.getElementById('editForm'); if(editForm) editForm.addEventListener('submit',submitEditLedger);
    _bindLazyScroll(); _restoreScroll_ledger();
    document.addEventListener('visibilitychange', function(){ if(document.hidden) _savePageState_ledger(); });
    window.addEventListener('pagehide', _savePageState_ledger);
});

function loadLedger() { allLedgers=DB.get('ledger')||[]; filteredLedgers=allLedgers.slice(); }
function _safe(id,val){ var el=document.getElementById(id); if(el) el.textContent=val; }
function _safe2(id,disp){ var el=document.getElementById(id); if(el) el.style.display=disp; }

function updateSummary() {
    var all=DB.get('ledger')||[];
    var dena=all.filter(function(i){ return i.type==='dena'; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var pabona=all.filter(function(i){ return i.type==='pabona'; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var paidDena=all.filter(function(i){ return i.type==='dena'&&i.paid; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var paidPab=all.filter(function(i){ return i.type==='pabona'&&i.paid; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var net=pabona-dena;
    _safe('totalDena','৳ '+Math.round(dena)); _safe('totalPabona','৳ '+Math.round(pabona));
    _safe('balance','৳ '+Math.round(net)); _safe('netBalance','৳ '+Math.round(net));
    _safe('totalEntries',all.length);
    _safe('totalDenaAnalysis','৳ '+Math.round(dena)); _safe('paidDena','৳ '+Math.round(paidDena)); _safe('unpaidDena','৳ '+Math.round(dena-paidDena));
    _safe('denaCount',all.filter(function(i){ return i.type==='dena'; }).length);
    _safe('totalPabonaAnalysis','৳ '+Math.round(pabona)); _safe('paidPabona','৳ '+Math.round(paidPab)); _safe('unpaidPabona','৳ '+Math.round(pabona-paidPab));
    _safe('pabonaCount',all.filter(function(i){ return i.type==='pabona'; }).length);
    var total=dena+pabona; var rate=total>0?Math.round(((paidDena+paidPab)/total)*100):0;
    _safe('paymentRate',rate+'%');
}

function filterTab(tab) {
    activeTab = tab;
    document.querySelectorAll('[data-tab]').forEach(function(b){ b.classList.toggle('active',b.dataset.tab===tab); });
    if(tab==='all')         filteredLedgers = allLedgers.slice();
    else if(tab==='dena')   filteredLedgers = allLedgers.filter(function(i){ return i.type==='dena'; });
    else if(tab==='pabona') filteredLedgers = allLedgers.filter(function(i){ return i.type==='pabona'; });
    else if(tab==='paid')   filteredLedgers = allLedgers.filter(function(i){ return !!i.paid; });
    else if(tab==='unpaid') filteredLedgers = allLedgers.filter(function(i){ return !i.paid; });
    applySortToFiltered(); updateSummary(); _doRender();
}

function filterByType() {
    var val = document.getElementById('typeFilter') ? document.getElementById('typeFilter').value : 'all';
    filterTab(val);
}

/* ── Live Search ── */
function searchLedger() {
    clearTimeout(_srchTimer);
    _srchTimer = setTimeout(function() {
        var inp = document.getElementById('searchInput');
        var q   = inp ? inp.value.toLowerCase().trim() : '';
        filteredLedgers = q === ''
            ? allLedgers.slice()
            : allLedgers.filter(function(i) {
                return (i.person||i.name||'').toLowerCase().indexOf(q) !== -1
                    || (i.note||'').toLowerCase().indexOf(q) !== -1;
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
    filteredLedgers = allLedgers.slice();
    applySortToFiltered(); updateSummary(); _doRender();
}

/* ── Unified render dispatcher ── */
function _doRender() {
    var isEmpty = filteredLedgers.length === 0;
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
            badge.style.cssText = 'display:flex;align-items:center;gap:8px;padding:7px 14px;font-size:.8rem;font-weight:700;color:#ea580c;background:#fff7ed;border-bottom:1.5px solid #fed7aa;position:sticky;top:0;z-index:9';
            var cv = document.getElementById('cardView');
            if (cv && cv.parentNode) cv.parentNode.insertBefore(badge, cv);
        }
        badge.innerHTML = '🔍&nbsp;<strong>' + _escHtml(_srchQ) + '</strong>&ensp;—&ensp;' + filteredLedgers.length + ' টি ফলাফল'
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

    var _list = _srchQ ? filteredLedgers : filteredLedgers.slice(0, _shownCards);
    _list.forEach(function(item) {
        var allData = DB.get('ledger') || [];
        var idx = allData.findIndex(function(x){ return (x.id&&x.id===item.id)||JSON.stringify(x)===JSON.stringify(item); });
        var ck = _cacheItem(item);
        var isDena = item.type==='dena'; var isPaid = !!item.paid; var isFav = !!item.favorite; var isPending = !!item.pending;
        var typeLabel = isDena ? '📕 দেনা' : '📗 পাওনা';
        var cardClass = isDena ? 'dena-card' : 'pabona-card';
        var amtClass  = isDena ? 'dena-amount' : 'pabona-amount';
        var daysAgo = typeof getDaysAgo==='function' ? getDaysAgo(item.date) : '';
        var isDeducted = !!item.deducted;

        var overdueHtml = '';
        if (!isPaid && item.dueDate) {
            var due = new Date(item.dueDate); var today = new Date(); var diff = Math.floor((today-due)/86400000);
            if (diff > 0) overdueHtml = '<br><span style="color:#ef4444;font-size:.72rem;font-weight:800">⚠️ '+diff+' দিন বেশি হয়ে গেছে</span>';
        }

        var paidBadge   = isPaid ? '<span style="display:inline-block;background:#dcfce7;color:#16a34a;font-size:.7rem;font-weight:800;padding:2px 8px;border-radius:20px;margin-left:6px">✅ পরিশোধিত</span>' : '';
        var deductBadge = isDeducted ? '<span style="display:inline-block;background:#fef3c7;color:#d97706;font-size:.68rem;font-weight:800;padding:2px 8px;border-radius:20px;margin-left:4px">📉 বাদ রাখা</span>' : '';

        var card = document.createElement('div');
        card.className = 'list-card ledger-card '+cardClass+(isFav?' favorite-card':'')+(isPending?' pending-card':'')+(isPaid?' paid-card':'');
        if (isPaid) { card.style.opacity='.55'; card.style.filter='grayscale(60%)'; }
        card.innerHTML =
            '<div class="card-header"><h3>'+_hl(item.person||item.name||'(নাম নেই)', _srchQ)+paidBadge+deductBadge+'</h3>'
            +'<span class="amount '+amtClass+'">৳ '+Math.round(parseFloat(item.amount||0))+'</span></div>'
            +'<div class="card-meta"><span style="font-weight:700">'+typeLabel+'</span>'
            +' &nbsp;·&nbsp; 📅 '+formatDateDisplay(item.date)
            +' &nbsp;·&nbsp; 🕑 '+formatTimeAMPM(item.time)
            +(item.note?'<br>📝 '+_hl(item.note, _srchQ):'')
            +overdueHtml
            +(daysAgo?'<br><span class="days-ago-badge">🕐 '+daysAgo+'</span>':'')
            +(isPending?'<br><span style="color:#f59e0b;font-weight:700">⏸ স্থগিত</span>':'')
            +'</div>'
            +(item.photo||item.drawing||item.voice ? '<div class="card-media-section">'+(item.photo?'<img class="card-media-photo" src="'+item.photo+'" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+item.photo+'\')" />':'')+(item.drawing?'<div class="card-media-drawing" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+item.drawing+'\')" ><img src="'+item.drawing+'" /></div>':'')+(item.voice?'<span class="card-media-voice" onclick="_playCardVoice(\''+item.id+'\',\'ledger\')" > শুনুন</span>':'')+'</div>':'')
            +'<div class="card-actions">'
            +(!isPaid?'<button class="action-btn pay-btn" onclick="markPaid('+idx+')">✅ পরিশোধ</button>':'<button class="action-btn unpay-btn" onclick="markUnpaid('+idx+')">↩ পূর্বাবস্থা</button>')
            +'<button class="action-btn edit-btn" onclick="openEditModal('+idx+')">✏️ সম্পাদনা</button>'
            +'<button class="action-btn delete-btn" onclick="showDeleteModal('+idx+')">🗑️ মুছুন</button>'
            +'<button class="more-btn" onclick="_openMoreMenuCached(this,\'ledger\',\''+ck+'\',\''+(item.type||'dena')+'\')">•••</button>'
            +'</div>';
        container.appendChild(card);
    });
    if (!_srchQ && filteredLedgers.length > _shownCards) {
        var mi = document.createElement('div');
        mi.style.cssText = 'text-align:center;padding:14px;color:#9ca3af;font-size:.8rem;font-weight:700';
        mi.textContent = '↓ স্ক্রোল করুন — আরও '+(filteredLedgers.length-_shownCards)+' টি বাকি';
        container.appendChild(mi);
    }
    setTimeout(initScrollAnim, 50);
}

function sortBy(val) { currentSort=val||currentSort; applySortToFiltered(); _doRender(); }
function applySortToFiltered() {
    filteredLedgers.sort(function(a,b){
        if(currentSort==='date_new') return new Date(b.date)-new Date(a.date);
        if(currentSort==='date_old') return new Date(a.date)-new Date(b.date);
        if(currentSort==='amt_high') return parseFloat(b.amount||0)-parseFloat(a.amount||0);
        if(currentSort==='amt_low')  return parseFloat(a.amount||0)-parseFloat(b.amount||0);
        if(currentSort==='name_az')  return (a.person||a.name||'').localeCompare(b.person||b.name||'');
        if(currentSort==='name_za')  return (b.person||b.name||'').localeCompare(a.person||a.name||'');
        if(currentSort==='unpaid_first') return (a.paid?1:0)-(b.paid?1:0);
        if(currentSort==='paid_first')   return (b.paid?1:0)-(a.paid?1:0);
        return new Date(b.date)-new Date(a.date);
    });
}

function switchView(view) {
    currentView = view;
    _savePageState_ledger();
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
    filteredLedgers.forEach(function(item){ var d=new Date(item.date); var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); if(!monthGroups[k]) monthGroups[k]=[]; monthGroups[k].push(item); });
    var MONTHS=['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
    var _allKeys=Object.keys(monthGroups).sort().reverse();
    var _keysToShow=_srchQ?_allKeys:_allKeys.slice(0,_shownMonths);
    _keysToShow.forEach(function(k){
        var parts=k.split('-'); var yr=parts[0]; var mo=parts[1];
        var items=monthGroups[k];
        var dena=items.filter(function(i){ return i.type==='dena'; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
        var pabona=items.filter(function(i){ return i.type==='pabona'; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
        var sec=document.createElement('div'); sec.className='month-table-section';
        sec.innerHTML='<div class="month-header ledger-header"><h3>'+MONTHS[+mo-1]+' '+yr+'</h3><span class="month-total">দেনা: ৳'+Math.round(dena)+' | পাওনা: ৳'+Math.round(pabona)+'</span></div>'
            +'<div class="table-wrapper"><table class="excel-table"><thead><tr><th>ব্যক্তি</th><th>ধরন</th><th>পরিমাণ</th><th>তারিখ</th><th>স্ট্যাটাস</th></tr></thead><tbody>'
            +items.map(function(i){ var paid=i.paid?'<span style="color:#16a34a;font-weight:700">✅ পরিশোধ</span>':'<span style="color:#ef4444;font-weight:700">⏳ বাকি</span>'; return '<tr><td>'+(i.person||i.name||'--')+'</td><td><span style="color:'+(i.type==='dena'?'#ef4444':'#10b981')+';font-weight:700">'+(i.type==='dena'?'দেনা':'পাওনা')+'</span></td><td class="amount-cell">৳ '+Math.round(parseFloat(i.amount||0))+'</td><td class="date-cell">'+formatDateDisplay(i.date)+'</td><td>'+paid+'</td></tr>'; }).join('')
            +'</tbody></table></div>';
        container.appendChild(sec);
    });
}

var _laCharts = {};
function _laDestroy(k){ if(_laCharts[k]){try{_laCharts[k].destroy();}catch(e){}_laCharts[k]=null;} }
function _laFmt(n){ return '৳ '+Math.round(n).toLocaleString('en-BD'); }

function renderAnalysisView() {
    var all=DB.get('ledger')||[];
    var isDark=document.body.classList.contains('dark-mode');
    var txtClr=isDark?'#e2e8f0':'#374151';
    var totalDena=0,totalPabona=0,paidDenaAmt=0,paidPabonaAmt=0,unpaidDenaAmt=0,unpaidPabonaAmt=0;
    all.forEach(function(i){
        var a=parseFloat(i.amount||0);
        if(i.type==='dena'){totalDena+=a;if(i.paid)paidDenaAmt+=a;else unpaidDenaAmt+=a;}
        else{totalPabona+=a;if(i.paid)paidPabonaAmt+=a;else unpaidPabonaAmt+=a;}
    });
    var net=totalPabona-totalDena;
    var totalPaid=paidDenaAmt+paidPabonaAmt;
    var totalAll=totalDena+totalPabona;
    var payRate=totalAll>0?Math.round((totalPaid/totalAll)*100):0;
    _safe('totalDenaAnalysis',_laFmt(totalDena));
    _safe('totalPabonaAnalysis',_laFmt(totalPabona));
    _safe('netBalance',_laFmt(net));
    _safe('paymentRate',payRate+'%');
    _safe('unpaidDena',_laFmt(unpaidDenaAmt));
    _safe('unpaidPabona',_laFmt(unpaidPabonaAmt));
    var nbEl=document.getElementById('netBalance');
    if(nbEl) nbEl.style.color=net>=0?'#10b981':'#ef4444';
    _laDestroy('dena');
    var dctx=document.getElementById('laDenaChart');
    if(dctx){
        _laCharts.dena=new Chart(dctx,{type:'doughnut',data:{labels:['দেনা পরিশোধিত','দেনা বাকি','পাওনা আদায়','পাওনা বাকি'],datasets:[{data:[paidDenaAmt,unpaidDenaAmt,paidPabonaAmt,unpaidPabonaAmt],backgroundColor:['#10b98188','#ef444488','#3b82f688','#f59e0b88'],borderColor:['#10b981','#ef4444','#3b82f6','#f59e0b'],borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{display:false}}}});
        var leg=document.getElementById('laDenaLegend');
        if(leg){var clrs=['#10b981','#ef4444','#3b82f6','#f59e0b'],lbls=['দেনা পরিশোধিত','দেনা বাকি','পাওনা আদায়','পাওনা বাকি'],vals=[paidDenaAmt,unpaidDenaAmt,paidPabonaAmt,unpaidPabonaAmt];leg.innerHTML=lbls.map(function(l,i){return '<div class="la-leg-item"><span class="la-leg-dot" style="background:'+clrs[i]+'"></span><span class="la-leg-name">'+l+'</span><span class="la-leg-amt">'+_laFmt(vals[i])+'</span></div>';}).join('');}
    }
    var persons={};
    all.forEach(function(i){var p=i.person||i.name||'অজানা';if(!persons[p])persons[p]={dena:0,pabona:0};if(i.type==='dena')persons[p].dena+=parseFloat(i.amount||0);else persons[p].pabona+=parseFloat(i.amount||0);});
    var pkeys=Object.keys(persons).sort(function(a,b){return (persons[b].dena+persons[b].pabona)-(persons[a].dena+persons[a].pabona);}).slice(0,6);
    _laDestroy('person');
    var pctx=document.getElementById('laPersonChart');
    if(pctx&&pkeys.length){
        _laCharts.person=new Chart(pctx,{type:'bar',data:{labels:pkeys,datasets:[{label:'দেনা',data:pkeys.map(function(k){return persons[k].dena;}),backgroundColor:'#ef444488',borderColor:'#ef4444',borderWidth:2,borderRadius:6},{label:'পাওনা',data:pkeys.map(function(k){return persons[k].pabona;}),backgroundColor:'#10b98188',borderColor:'#10b981',borderWidth:2,borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:txtClr,font:{size:11},padding:8}}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return '৳'+v;},color:txtClr,font:{size:10}},grid:{color:'rgba(0,0,0,.05)'}},x:{ticks:{color:txtClr,font:{size:10}}}}}});
    }
}

function changePeriod(period) { document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.period===period); }); renderAnalysisView(); }

function markPaid(index) {
    var all=DB.get('ledger')||[];
    if(index<0||index>=all.length) return;
    var item=all[index];
    if(typeof showPaymentUI==='function'){
        showPaymentUI('ledger',index,item,function(){
            var all2=DB.get('ledger')||[];
            if(index<all2.length){ all2[index].paid=true; all2[index].paidDate=nowDate(); all2[index].paidTime=nowTime(); DB.set('ledger',all2); }
            loadLedger(); filteredLedgers=allLedgers.slice(); updateSummary(); _doRender();
            showToast('✅ পরিশোধ চিহ্নিত হয়েছে');
        });
    } else {
        if(!confirm('পরিশোধ চিহ্নিত করবেন?')) return;
        all[index].paid=true; all[index].paidDate=nowDate(); all[index].paidTime=nowTime();
        DB.set('ledger',all); loadLedger(); filteredLedgers=allLedgers.slice(); updateSummary(); _doRender();
        showToast('✅ পরিশোধ চিহ্নিত হয়েছে');
    }
}

function markUnpaid(index) {
    var all = DB.get('ledger') || [];
    if (index < 0 || index >= all.length) return;
    Swal.fire({
        title: 'আপনি কি নিশ্চিত?',
        text: "এই পরিশোধটি কি বাতিল করতে চান?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff4757',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'হ্যাঁ, বাতিল করুন',
        cancelButtonText: 'না'
    }).then(function(result) {
        if (result.isConfirmed) {
            all[index].paid = false;
            all[index].paidDate = null;
            all[index].paidTime = null;
            DB.set('ledger', all);
            loadLedger(); filteredLedgers = allLedgers.slice(); updateSummary(); _doRender();
            Swal.fire('বাতিল হয়েছে!', 'পরিশোধটি সফলভাবে বাতিল করা হয়েছে।', 'success');
        }
    });
}

function showDeleteModal(index) { deleteIndex=index; _safe2('deleteModal','flex'); }
function closeDeleteModal()     { deleteIndex=null;  _safe2('deleteModal','none'); }

function confirmDelete() {
    if(deleteIndex===null) return;
    var all=DB.get('ledger')||[];
    if(deleteIndex>=0&&deleteIndex<all.length){
        addToTrash('ledger',all[deleteIndex]); all.splice(deleteIndex,1); DB.set('ledger',all);
        closeDeleteModal(); loadLedger(); filteredLedgers=allLedgers.slice(); _srchQ=''; updateSummary(); _doRender();
        showToast('🗑️ ট্র্যাশে গেছে');
    }
}

function openEditModal(index) {
    var all=DB.get('ledger')||[]; var item=all[index]; if(!item) return;
    document.getElementById('editIndex').value=index;
    var personEl=document.getElementById('editPerson'); if(personEl) personEl.value=item.person||item.name||'';
    var typeEl=document.getElementById('editType'); if(typeEl) typeEl.value=item.type||'dena';
    document.getElementById('editAmount').value=item.amount||'';
    document.getElementById('editDate').value=item.date||'';
    var timeEl=document.getElementById('editTime'); if(timeEl) timeEl.value=item.time||'';
    document.getElementById('editNote').value=item.note||'';
    var paidEl=document.getElementById('editPaid'); if(paidEl) paidEl.value=item.paid?'true':'false';
    _safe2('editModal','flex');
    if (typeof _initFormMedia==='function') _initFormMedia(item.photo||null,item.drawing||null,item.voice||null);
}
function closeEditModal() { _safe2('editModal','none'); }

function submitEditLedger(e) {
    e.preventDefault();
    var idx=parseInt(document.getElementById('editIndex').value);
    var all=DB.get('ledger')||[];
    if(idx>=0&&idx<all.length){
        var personVal=(document.getElementById('editPerson')?document.getElementById('editPerson').value:'').trim();
        var paidVal=document.getElementById('editPaid')?document.getElementById('editPaid').value==='true':false;
        all[idx]=Object.assign({},all[idx],{
            person:personVal, name:personVal,
            type:document.getElementById('editType')?document.getElementById('editType').value:all[idx].type,
            amount:Number(document.getElementById('editAmount').value),
            date:document.getElementById('editDate').value,
            time:document.getElementById('editTime')?document.getElementById('editTime').value:all[idx].time,
            note:document.getElementById('editNote').value,
            paid:paidVal, paidDate:paidVal?(all[idx].paidDate||nowDate()):null,
        });
        DB.set('ledger',all); loadLedger(); filteredLedgers=allLedgers.slice(); updateSummary(); _doRender();
        closeEditModal(); showToast('✅ আপডেট হয়েছে');
    }
}

function showEmptyState() { _safe2('emptyState','block'); _safe2('cardView','none'); _safe2('tableView','none'); _safe2('analysisView','none'); }
function hideEmptyState()  { _safe2('emptyState','none'); }

function setSortChip(btn, val) {
    document.querySelectorAll('.sort-chip').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    sortBy(val);
}
