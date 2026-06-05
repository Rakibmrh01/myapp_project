var _itemCache = {};
var _cacheIdx  = 0;
function _cacheItem(item) { var k='c'+(++_cacheIdx); _itemCache[k]=item; return k; }
function _getCachedItem(k) { return _itemCache[k]||null; }

// Daily Account — savings-list.js v3.3 — দিন আগে + confirmation

var currentView     = 'card';
var allSavings      = [];
var filteredSavings = [];
var deleteIndex     = null;
var currentSort     = 'date_new';

document.addEventListener('DOMContentLoaded', function() {
    loadSavings(); updateSummary(); applySortToFiltered(); renderCurrentView();
    var addForm=document.getElementById('addSavingsForm'); if(addForm) addForm.addEventListener('submit',submitAddSavings);
    var editForm=document.getElementById('editForm'); if(editForm) editForm.addEventListener('submit',submitEditSavings);
});

function loadSavings() { allSavings=DB.get('savings')||[]; filteredSavings=allSavings.slice(); }
function sortBy(val) { currentSort=val||currentSort; applySortToFiltered(); renderCurrentView(); }
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
function _safe(id,val){ var el=document.getElementById(id); if(el) el.textContent=val; }
function _safe2(id,disp){ var el=document.getElementById(id); if(el) el.style.display=disp; }

function updateSummary() {
    var total=filteredSavings.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var count=filteredSavings.length; var avg=count>0?total/count:0;
    _safe('totalSavings','৳ '+Math.round(total)); _safe('totalEntries',count); _safe('avgSavings','৳ '+Math.round(avg));
}

function searchSavings() {
    var q=(document.getElementById('searchInput')?document.getElementById('searchInput').value:'').toLowerCase();
    filteredSavings=q===''?allSavings.slice():allSavings.filter(function(i){ return (i.method||i.source||'').toLowerCase().includes(q)||(i.bankName||'').toLowerCase().includes(q)||(i.note||'').toLowerCase().includes(q); });
    applySortToFiltered(); updateSummary(); renderCurrentView();
}

function switchView(view) {
    currentView=view;
    document.querySelectorAll('.toggle-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.view===view); });
    _safe2('cardView',view==='card'?'block':'none'); _safe2('tableView',view==='table'?'block':'none'); _safe2('analysisView',view==='analysis'?'block':'none');
    renderCurrentView();
}

function renderCurrentView() {
    if(filteredSavings.length===0){showEmptyState();return;} hideEmptyState();
    if(currentView==='card') renderCardView();
    else if(currentView==='table') renderTableView();
    else if(currentView==='analysis') renderAnalysisView();
}

function renderCardView() {
    var container=document.getElementById('cardView'); if(!container) return; container.innerHTML='';
    filteredSavings.forEach(function(item) {
        var idx=allSavings.findIndex(function(x){ return (x.id&&x.id===item.id)||JSON.stringify(x)===JSON.stringify(item); });
        var ck=_cacheItem(item);
        var isFav=!!item.favorite; var label=item.method||item.source||'সঞ্চয়'; var bank=item.bankName?' · 🏦 '+item.bankName:'';
        var daysAgo=typeof getDaysAgo==='function'?getDaysAgo(item.date):'';
        var card=document.createElement('div');
        card.className='list-card savings-card'+(isFav?' favorite-card':'');
        card.innerHTML='<div class="card-header"><h3>'+label+bank+'</h3><span class="amount savings-amount">৳ '+Math.round(parseFloat(item.amount||0))+'</span></div>'
            +'<div class="card-meta">📅 <span class="card-date">'+formatDateDisplay(item.date)+'</span> &nbsp;·&nbsp; 🕑 '+formatTimeAMPM(item.time)
            +(item.note?'<br>📝 '+item.note:'')
            +(daysAgo?'<br><span class="days-ago-badge">🕐 '+daysAgo+'</span>':'')
            +'</div>'
            +(item.photo||item.drawing||item.voice ? '<div class="card-media-section">'
                +(item.photo ? '<img class="card-media-photo" src="'+item.photo+'" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+item.photo+'\')" />' : '')
                +(item.drawing ? '<div class="card-media-drawing" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+item.drawing+'\')" ><img src="'+item.drawing+'" /></div>' : '')
                +(item.voice ? '<span class="card-media-voice" onclick="_playCardVoice(\''+item.id+'\',\'savings\')" >🎙️ শুনুন</span>' : '')
                +'</div>' : '')
            +'<div class="card-actions"><button class="action-btn edit-btn" onclick="openEditModal('+idx+')">✏️ সম্পাদনা</button><button class="action-btn delete-btn" onclick="showDeleteModal('+idx+')">🗑️ মুছুন</button><button class="more-btn" onclick="_openMoreMenuCached(this,\'savings\',\''+ck+'\',\'savings\')">•••</button></div>';
        container.appendChild(card);
    });
    setTimeout(initScrollAnim,50);
}

function renderTableView() {
    var container=document.getElementById('monthlyTables'); if(!container) return; container.innerHTML='';
    var monthGroups={};
    filteredSavings.forEach(function(item){ var d=new Date(item.date); var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); if(!monthGroups[k]) monthGroups[k]=[]; monthGroups[k].push(item); });
    var MONTHS=['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
    Object.keys(monthGroups).sort().reverse().forEach(function(k){
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
}

function renderAnalysisView() {
    var now=new Date(); var m=now.getMonth(); var yr=now.getFullYear();
    var list=allSavings.filter(function(i){ var d=new Date(i.date); return d.getMonth()===m&&d.getFullYear()===yr; });
    var total=list.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    _safe('currentMonthSavings','৳ '+Math.round(total)); _safe('currentMonthEntries',list.length);
    var totals={}; allSavings.forEach(function(i){ var s=i.method||'অন্যান্য'; totals[s]=(totals[s]||0)+parseFloat(i.amount||0); });
    var sorted=Object.entries(totals).sort(function(a,b){ return b[1]-a[1]; }).slice(0,5);
    var c=document.getElementById('topMethods'); if(c) c.innerHTML=sorted.map(function(e,i){ return '<div class="stat-row"><span class="stat-label">'+(i+1)+'. '+e[0]+'</span><span class="stat-value savings-stat">৳ '+Math.round(e[1])+'</span></div>'; }).join('')||'<p style="text-align:center;color:#6b7280;padding:20px">কোনো ডাটা নেই</p>';
    var MNAMES=['জানু','ফেব','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];
    var grid=document.getElementById('monthGrid'); if(grid){ grid.innerHTML=''; for(var mo=0;mo<12;mo++){ var mo2=mo; var tot=allSavings.filter(function(i){ var d=new Date(i.date); return d.getMonth()===mo2&&d.getFullYear()===yr; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0); grid.innerHTML+='<div class="month-item"><span class="month-name">'+MNAMES[mo]+'</span><span class="month-value savings-stat">৳ '+Math.round(tot)+'</span></div>'; } }
}

function showDeleteModal(index) { deleteIndex=index; _safe2('deleteModal','flex'); }
function closeDeleteModal()     { deleteIndex=null;  _safe2('deleteModal','none'); }

function confirmDeleteSavings() {
    if(deleteIndex===null) return;
    // confirm handled by modal
    if(deleteIndex>=0&&deleteIndex<allSavings.length){
        addToTrash('savings',allSavings[deleteIndex]); allSavings.splice(deleteIndex,1); DB.set('savings',allSavings);
        closeDeleteModal(); loadSavings(); filteredSavings=allSavings.slice(); updateSummary(); renderCurrentView();
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
    loadSavings(); filteredSavings=allSavings.slice(); updateSummary(); renderCurrentView();
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
        
        // media save
        if (typeof _formMedia!=='undefined') {
            if (_formMedia.photo)   allSavings[idx].photo   = _formMedia.photo;
            if (_formMedia.drawing) allSavings[idx].drawing = _formMedia.drawing;
            if (_formMedia.voice)   allSavings[idx].voice   = _formMedia.voice;
            _formMedia.photo=null; _formMedia.drawing=null; _formMedia.voice=null;
        }
        DB.set('savings',allSavings); loadSavings(); filteredSavings=allSavings.slice(); updateSummary(); renderCurrentView();
        closeEditModal(); showToast('✅ আপডেট হয়েছে');
    }
}

function showEmptyState() { _safe2('emptyState','block'); _safe2('cardView','none'); _safe2('tableView','none'); _safe2('analysisView','none'); }
function hideEmptyState()  { _safe2('emptyState','none'); }

function filterByMethod() {
    var val = document.getElementById('methodFilter') ? document.getElementById('methodFilter').value : 'all';
    filteredSavings = (val === 'all') ? allSavings.slice() : allSavings.filter(function(i){ return (i.method||'') === val; });
    applySortToFiltered();
    updateSummary();
    renderCurrentView();
}

function toggleBankRow() {
    var method = document.getElementById('editMethod') ? document.getElementById('editMethod').value : '';
    var bankRow = document.getElementById('bankNameRow') || document.getElementById('editBankRow');
    if (bankRow) {
        bankRow.style.display = (method === 'bank' || method === 'bkash' || method === 'nagad' || method === 'rocket') ? 'block' : 'none';
    }
}

function setSortChip(btn, val) {
    document.querySelectorAll('.sort-chip').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    sortBy(val);
}