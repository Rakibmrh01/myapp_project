var _itemCache = {};
var _cacheIdx  = 0;
function _cacheItem(item) { var k='c'+(++_cacheIdx); _itemCache[k]=item; return k; }
function _getCachedItem(k) { return _itemCache[k]||null; }

// Daily Account — income-list.js v3.4
// Sort + দিন আগে নোটের নিচে আলাদা + confirmation + styled cards

var currentView     = 'card';
var currentPeriod   = 'monthly';
var allIncomes      = [];
var filteredIncomes = [];
var deleteIndex     = null;
var currentSort     = 'date_new';

document.addEventListener('DOMContentLoaded', function() {
    loadIncomes(); updateSummary(); applySortToFiltered(); renderCurrentView(); setTimeout(_populateSourceFilter,100);
    var addForm=document.getElementById('addIncomeForm'); if(addForm) addForm.addEventListener('submit',submitAddIncome);
    var editForm=document.getElementById('editForm'); if(editForm) editForm.addEventListener('submit',submitEditIncome);
});

function loadIncomes() { allIncomes=DB.get('income')||[]; filteredIncomes=allIncomes.slice(); }
function _safe(id,val){ var el=document.getElementById(id); if(el) el.textContent=val; }
function _safe2(id,disp){ var el=document.getElementById(id); if(el) el.style.display=disp; }

function updateSummary() {
    var total=filteredIncomes.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var count=filteredIncomes.length; var avg=count>0?total/count:0;
    _safe('totalIncome','৳ '+Math.round(total)); _safe('totalEntries',count); _safe('avgIncome','৳ '+Math.round(avg));
}

function searchIncome() {
    var q=(document.getElementById('searchInput')?document.getElementById('searchInput').value:'').toLowerCase();
    filteredIncomes=q===''?allIncomes.slice():allIncomes.filter(function(i){ return (i.source||'').toLowerCase().includes(q)||(i.note||'').toLowerCase().includes(q); });
    applySortToFiltered();
    updateSummary(); renderCurrentView();
}

function sortBy(val) {
    currentSort=val||currentSort;
    applySortToFiltered();
    renderCurrentView();
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
    currentView=view;
    document.querySelectorAll('.toggle-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.view===view); });
    _safe2('cardView',view==='card'?'block':'none'); _safe2('tableView',view==='table'?'block':'none'); _safe2('analysisView',view==='analysis'?'block':'none');
    renderCurrentView();
}

function renderCurrentView() {
    if(filteredIncomes.length===0){showEmptyState();return;} hideEmptyState();
    if(currentView==='card') renderCardView();
    else if(currentView==='table') renderTableView();
    else if(currentView==='analysis') renderAnalysisView();
}

function renderCardView() {
    var container=document.getElementById('cardView'); if(!container) return;
    container.innerHTML='';
    filteredIncomes.forEach(function(income) {
        var idx=allIncomes.findIndex(function(x){ return (x.id&&x.id===income.id)||JSON.stringify(x)===JSON.stringify(income); });
        var ck=_cacheItem(income);
        var isFav=!!income.favorite; var isPending=!!income.pending;
        var daysAgo=typeof getDaysAgo==='function'?getDaysAgo(income.date):'';

        var card=document.createElement('div');
        card.className='list-card income-card'+(isFav?' favorite-card':'')+(isPending?' pending-card':'');
        card.innerHTML=
            '<div class="card-header">'
            +'<h3>'+(income.source||'(নাম নেই)')+'</h3>'
            +'<span class="amount">৳ '+Math.round(parseFloat(income.amount||0))+'</span>'
            +'</div>'
            +'<div class="card-meta">'
            +'📅 <span class="card-date">'+formatDateDisplay(income.date)+'</span>'
            +' &nbsp;·&nbsp; 🕑 '+formatTimeAMPM(income.time)
            +(income.note?'<br>📝 '+income.note:'')
            +(daysAgo?'<br><span class="days-ago-badge">🕐 '+daysAgo+'</span>':'')
            +(isPending?'<br><span style="color:#f59e0b;font-weight:700">⏸ স্থগিত</span>':'')
            +(income.relations&&income.relations.length?'<br><span style="color:#0ea5e9;font-size:.7rem;font-weight:700">🔗 '+income.relations.length+' সম্পর্ক</span>':'')
            +'</div>'
            +(income.photo||income.drawing||income.voice ? '<div class="card-media-section">'+(income.photo ? '<img class="card-media-photo" src="'+income.photo+'" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+income.photo+'\')" />' : '')+(income.drawing ? '<div class="card-media-drawing" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+income.drawing+'\')" ><img src="'+income.drawing+'" /></div>' : '')+(income.voice ? '<span class="card-media-voice" onclick="_playCardVoice(\''+income.id+'\',\'income\')" > শুনুন</span>' : '')+'</div>' : '')
            +'<div class="card-actions">'
            +'<button class="action-btn edit-btn" onclick="openEditModal('+idx+')">✏️ সম্পাদনা</button>'
            +'<button class="action-btn delete-btn" onclick="showDeleteModal('+idx+')">🗑️ মুছুন</button>'
            +'<button class="more-btn" onclick="_openMoreMenuCached(this,\'income\',\''+ck+'\',\'income\')">•••</button>'
            +'</div>';
        container.appendChild(card);
    });
    setTimeout(initScrollAnim,50);
}

function renderTableView() {
    var container=document.getElementById('monthlyTables'); if(!container) return; container.innerHTML='';
    var monthGroups={};
    filteredIncomes.forEach(function(inc){ var d=new Date(inc.date); var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); if(!monthGroups[k]) monthGroups[k]=[]; monthGroups[k].push(inc); });
    var MONTHS=['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
    Object.keys(monthGroups).sort().reverse().forEach(function(k){
        var parts=k.split('-'); var yr=parts[0]; var mo=parts[1];
        var incomes=monthGroups[k]; var total=incomes.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
        var sec=document.createElement('div'); sec.className='month-table-section';
        sec.innerHTML='<div class="month-header income-header"><h3>'+MONTHS[+mo-1]+' '+yr+'</h3><span class="month-total">মোট: ৳ '+Math.round(total)+'</span></div>'
            +'<div class="table-wrapper"><table class="excel-table"><thead><tr><th>উৎস</th><th>পরিমাণ</th><th>তারিখ</th><th>সময়</th></tr></thead><tbody>'
            +incomes.map(function(inc){ return '<tr><td>'+(inc.source||'--')+'</td><td class="amount-cell">৳ '+Math.round(parseFloat(inc.amount||0))+'</td><td class="date-cell">'+formatDateDisplay(inc.date)+'</td><td>'+formatTimeAMPM(inc.time)+'</td></tr>'; }).join('')
            +'<tr class="total-row"><td><strong>মোট</strong></td><td class="amount-cell"><strong>৳ '+Math.round(total)+'</strong></td><td colspan="2"></td></tr></tbody></table></div>';
        container.appendChild(sec);
    });
}

function renderAnalysisView() { updateCurrentMonthStats(); updateTopSources(); updateComparisonStats(); updateMonthlyBreakdown(); }
function updateCurrentMonthStats() {
    var now=new Date(); var m=now.getMonth(); var yr=now.getFullYear();
    var list=allIncomes.filter(function(i){ var d=new Date(i.date); return d.getMonth()===m&&d.getFullYear()===yr; });
    var total=list.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var max=list.reduce(function(s,i){ return Math.max(s,parseFloat(i.amount||0)); },0);
    var days=new Date(yr,m+1,0).getDate();
    _safe('currentMonthIncome','৳ '+Math.round(total)); _safe('avgDailyIncome','৳ '+Math.round(total/days)); _safe('maxIncome','৳ '+Math.round(max)); _safe('currentMonthEntries',list.length);
}
function updateTopSources() {
    var totals={};
    allIncomes.forEach(function(i){ var s=i.source||'অন্যান্য'; totals[s]=(totals[s]||0)+parseFloat(i.amount||0); });
    var sorted=Object.entries(totals).sort(function(a,b){ return b[1]-a[1]; }).slice(0,5);
    var c=document.getElementById('topSources'); if(!c) return;
    c.innerHTML=sorted.length===0?'<p style="text-align:center;color:#6b7280;padding:20px">কোনো ডাটা নেই</p>'
        :sorted.map(function(e,i){ return '<div class="stat-row"><span class="stat-label">'+(i+1)+'. '+e[0]+'</span><span class="stat-value income-stat">৳ '+Math.round(e[1])+'</span></div>'; }).join('');
}
function updateComparisonStats() {
    var now=new Date(); var cm=now.getMonth(); var cy=now.getFullYear(); var lm=cm===0?11:cm-1; var ly=cm===0?cy-1:cy;
    var sumF=function(m2,y2){ return allIncomes.filter(function(i){ var d=new Date(i.date); return d.getMonth()===m2&&d.getFullYear()===y2; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0); };
    var curTotal=sumF(cm,cy); var lastTotal=sumF(lm,ly);
    var yrTotal=allIncomes.filter(function(i){ return new Date(i.date).getFullYear()===cy; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var change=lastTotal>0?((curTotal-lastTotal)/lastTotal*100).toFixed(1):0;
    _safe('lastMonthIncome','৳ '+Math.round(lastTotal)); _safe('yearlyTotal','৳ '+Math.round(yrTotal));
    var chEl=document.getElementById('monthChange'); if(chEl){ chEl.textContent=(change>0?'+':'')+change+'%'; chEl.style.color=change>=0?'#10b981':'#ef4444'; }
}
function updateMonthlyBreakdown() {
    var MNAMES=['জানু','ফেব','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];
    var yr=new Date().getFullYear(); var c=document.getElementById('monthGrid'); if(!c) return; c.innerHTML='';
    for(var m=0;m<12;m++){ var m2=m; var tot=allIncomes.filter(function(i){ var d=new Date(i.date); return d.getMonth()===m2&&d.getFullYear()===yr; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0); c.innerHTML+='<div class="month-item"><span class="month-name">'+MNAMES[m]+'</span><span class="month-value income-stat">৳ '+Math.round(tot)+'</span></div>'; }
}
function changePeriod(period) { currentPeriod=period; document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.period===period); }); renderAnalysisView(); }

function showDeleteModal(index) { deleteIndex=index; _safe2('deleteModal','flex'); }
function closeDeleteModal()     { deleteIndex=null;  _safe2('deleteModal','none'); }
function confirmDeleteIncome() {
    if(deleteIndex===null) return;
    // confirm handled by modal
    if(deleteIndex>=0&&deleteIndex<allIncomes.length){ addToTrash('income',allIncomes[deleteIndex]); allIncomes.splice(deleteIndex,1); DB.set('income',allIncomes); closeDeleteModal(); loadIncomes(); filteredIncomes=allIncomes.slice(); applySortToFiltered(); updateSummary(); renderCurrentView(); showToast('🗑️ ট্র্যাশে গেছে ↩'); }
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
    loadIncomes(); filteredIncomes=allIncomes.slice(); applySortToFiltered(); updateSummary(); renderCurrentView();
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
        
        // media save
        if (typeof _formMedia!=='undefined') {
            if (_formMedia.photo)   allIncomes[idx].photo   = _formMedia.photo;
            if (_formMedia.drawing) allIncomes[idx].drawing = _formMedia.drawing;
            if (_formMedia.voice)   allIncomes[idx].voice   = _formMedia.voice;
            _formMedia.photo=null; _formMedia.drawing=null; _formMedia.voice=null;
        }
        DB.set('income',allIncomes); loadIncomes(); filteredIncomes=allIncomes.slice(); applySortToFiltered(); updateSummary(); renderCurrentView(); closeEditModal(); showToast('✅ আপডেট হয়েছে');
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
    // allIncomes কখনো পরিবর্তন করা যাবে না — শুধু filteredIncomes পরিবর্তন করো
    filteredIncomes = (val === 'all') ? allIncomes.slice() : allIncomes.filter(function(i){ return (i.source||'') === val; });
    applySortToFiltered();
    updateSummary();
    renderCurrentView();
}

function _populateSourceFilter() {
    var sel = document.getElementById('sourceFilter');
    if (!sel) return;
    var defaults = ['বেতন','ব্যবসা','ফ্রিল্যান্স','কমিশন','ভাড়া','বিনিয়োগ','উপহার','বোনাস','অন্যান্য'];
    var custom = JSON.parse(localStorage.getItem('__custom_cat_income') || '[]');
    var dbSrc = {};
    (DB.get('income')||[]).forEach(function(i){ if(i.source) dbSrc[i.source]=true; });
    
    var all = [];
    defaults.forEach(function(d){ if(all.indexOf(d)===-1) all.push(d); });
    custom.forEach(function(d){ if(all.indexOf(d)===-1) all.push(d); });
    Object.keys(dbSrc).sort().forEach(function(d){ if(all.indexOf(d)===-1) all.push(d); });
    
    while (sel.options.length > 1) sel.remove(1);
    all.forEach(function(s){
        var opt = document.createElement('option');
        opt.value = s; opt.textContent = s;
        sel.appendChild(opt);
    });
}