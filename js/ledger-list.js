var _itemCache = {};
var _cacheIdx  = 0;
function _cacheItem(item) { var k='c'+(++_cacheIdx); _itemCache[k]=item; return k; }
function _getCachedItem(k) { return _itemCache[k]||null; }

// Daily Account — ledger-list.js v3.4
// দেনা কাটুন বাটন + পরিশোধ বাটন + দিন আগে + confirmation

var currentView     = 'card';
var allLedgers      = [];
var filteredLedgers = [];
var deleteIndex     = null;
var currentSort     = 'date_new';
var activeTab       = 'all';

document.addEventListener('DOMContentLoaded', function() {
    loadLedger(); updateSummary(); applySortToFiltered(); renderCurrentView();
    var editForm=document.getElementById('editForm'); if(editForm) editForm.addEventListener('submit',submitEditLedger);
});

function loadLedger() { allLedgers=DB.get('ledger')||[]; filteredLedgers=allLedgers.slice(); }
function sortBy(val) { currentSort=val||currentSort; applySortToFiltered(); renderCurrentView(); }
function applySortToFiltered() {
    filteredLedgers.sort(function(a,b){
        if(currentSort==='date_new') return new Date(b.date)-new Date(a.date);
        if(currentSort==='date_old') return new Date(a.date)-new Date(b.date);
        if(currentSort==='amt_high') return parseFloat(b.amount||0)-parseFloat(a.amount||0);
        if(currentSort==='amt_low')  return parseFloat(a.amount||0)-parseFloat(b.amount||0);
        if(currentSort==='name_az')  return (a.person||a.name||'').localeCompare(b.person||b.name||'');
        if(currentSort==='name_za')  return (b.person||b.name||'').localeCompare(a.person||a.name||'');
        if(currentSort==='unpaid_first'){ filteredLedgers.sort(function(a,b){ return (a.paid?1:0)-(b.paid?1:0); }); return; }
        if(currentSort==='paid_first'){   filteredLedgers.sort(function(a,b){ return (b.paid?1:0)-(a.paid?1:0); }); return; }
        return new Date(b.date)-new Date(a.date);
    });
}
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
    activeTab=tab;
    document.querySelectorAll('[data-tab]').forEach(function(b){ b.classList.toggle('active',b.dataset.tab===tab); });
    // allLedgers কখনো পরিবর্তন করা যাবে না — শুধু filteredLedgers পরিবর্তন করো
    if(tab==='all')         filteredLedgers=allLedgers.slice();
    else if(tab==='dena')   filteredLedgers=allLedgers.filter(function(i){ return i.type==='dena'; });
    else if(tab==='pabona') filteredLedgers=allLedgers.filter(function(i){ return i.type==='pabona'; });
    else if(tab==='paid')   filteredLedgers=allLedgers.filter(function(i){ return !!i.paid; });
    else if(tab==='unpaid') filteredLedgers=allLedgers.filter(function(i){ return !i.paid; });
    applySortToFiltered(); updateSummary(); renderCurrentView();
}

function filterByType() {
    var val=document.getElementById('typeFilter')?document.getElementById('typeFilter').value:'all';
    filterTab(val);
}

function searchLedger() {
    var q=(document.getElementById('searchInput')?document.getElementById('searchInput').value:'').toLowerCase();
    filteredLedgers=q===''?allLedgers.slice():allLedgers.filter(function(i){ return (i.person||i.name||'').toLowerCase().includes(q)||(i.note||'').toLowerCase().includes(q); });
    applySortToFiltered(); updateSummary(); renderCurrentView();
}

function switchView(view) {
    currentView=view;
    document.querySelectorAll('.toggle-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.view===view); });
    _safe2('cardView',view==='card'?'block':'none'); _safe2('tableView',view==='table'?'block':'none'); _safe2('analysisView',view==='analysis'?'block':'none');
    renderCurrentView();
}

function renderCurrentView() {
    if(filteredLedgers.length===0){showEmptyState();return;} hideEmptyState();
    if(currentView==='card') renderCardView();
    else if(currentView==='table') renderTableView();
    else if(currentView==='analysis') renderAnalysisView();
}

function renderCardView() {
    var container=document.getElementById('cardView'); if(!container) return;
    container.innerHTML='';
    filteredLedgers.forEach(function(item) {
        var allData=DB.get('ledger')||[];
        var idx=allData.findIndex(function(x){ return (x.id&&x.id===item.id)||JSON.stringify(x)===JSON.stringify(item); });
        var ck=_cacheItem(item);
        var isDena=item.type==='dena'; var isPaid=!!item.paid; var isFav=!!item.favorite; var isPending=!!item.pending;
        var typeLabel=isDena?'📕 দেনা':'📗 পাওনা';
        var cardClass=isDena?'dena-card':'pabona-card';
        var amtClass=isDena?'dena-amount':'pabona-amount';
        var daysAgo=typeof getDaysAgo==='function'?getDaysAgo(item.date):'';
        var isDeducted=!!item.deducted;

        // কত দিন বাকি/বাকি overdue
        var overdueHtml='';
        if (!isPaid && item.dueDate) {
            var due=new Date(item.dueDate); var today=new Date(); var diff=Math.floor((today-due)/86400000);
            if (diff>0) overdueHtml='<br><span style="color:#ef4444;font-size:.72rem;font-weight:800">⚠️ '+diff+' দিন বেশি হয়ে গেছে</span>';
        }

        var paidBadge=isPaid?'<span style="display:inline-block;background:#dcfce7;color:#16a34a;font-size:.7rem;font-weight:800;padding:2px 8px;border-radius:20px;margin-left:6px">✅ পরিশোধিত</span>':'';
        var deductBadge=isDeducted?'<span style="display:inline-block;background:#fef3c7;color:#d97706;font-size:.68rem;font-weight:800;padding:2px 8px;border-radius:20px;margin-left:4px">📉 বাদ রাখা</span>':'';

        var card=document.createElement('div');
        card.className='list-card ledger-card '+cardClass+(isFav?' favorite-card':'')+(isPending?' pending-card':'')+(isPaid?' paid-card':'');
        if(isPaid){ card.style.opacity='.55'; card.style.filter='grayscale(60%)'; }
        card.innerHTML=
            '<div class="card-header"><h3>'+(item.person||item.name||'(নাম নেই)')+paidBadge+deductBadge+'</h3>'
            +'<span class="amount '+amtClass+'">৳ '+Math.round(parseFloat(item.amount||0))+'</span></div>'
            +'<div class="card-meta"><span style="font-weight:700">'+typeLabel+'</span>'
            +' &nbsp;·&nbsp; 📅 '+formatDateDisplay(item.date)
            +' &nbsp;·&nbsp; 🕑 '+formatTimeAMPM(item.time)
            +(item.note?'<br>📝 '+item.note:'')
            +overdueHtml
            +(daysAgo?'<br><span class="days-ago-badge">🕐 '+daysAgo+'</span>':'')
            +(isPending?'<br><span style="color:#f59e0b;font-weight:700">⏸ স্থগিত</span>':'')
            +'</div>'
            +(item.photo||item.drawing||item.voice ? '<div class="card-media-section">'+(item.photo ? '<img class="card-media-photo" src="'+item.photo+'" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+item.photo+'\')" />' : '')+(item.drawing ? '<div class="card-media-drawing" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+item.drawing+'\')" ><img src="'+item.drawing+'" /></div>' : '')+(item.voice ? '<span class="card-media-voice" onclick="_playCardVoice(\''+item.id+'\',\'ledger\')" > শুনুন</span>' : '')+'</div>' : '')
            +'<div class="card-actions">'
            +(!isPaid?'<button class="action-btn pay-btn" onclick="markPaid('+idx+')">✅ পরিশোধ</button>':'<button class="action-btn unpay-btn" onclick="markUnpaid('+idx+')">↩ পূর্বাবস্থা</button>')
            +'<button class="action-btn edit-btn" onclick="openEditModal('+idx+')">✏️ সম্পাদনা</button>'
            +'<button class="action-btn delete-btn" onclick="showDeleteModal('+idx+')">🗑️ মুছুন</button>'
            +'<button class="more-btn" onclick="_openMoreMenuCached(this,\'ledger\',\''+ck+'\',\''+( item.type||'dena')+'\')">•••</button>'
            +'</div>';
        container.appendChild(card);
    });
    setTimeout(initScrollAnim,50);
}

function markPaid(index) {
    var all=DB.get('ledger')||[];
    if(index<0||index>=all.length) return;
    var item=all[index];
    if(typeof showPaymentUI==='function'){
        showPaymentUI('ledger',index,item,function(){
            var all2=DB.get('ledger')||[];
            if(index<all2.length){ all2[index].paid=true; all2[index].paidDate=nowDate(); all2[index].paidTime=nowTime(); DB.set('ledger',all2); }
            loadLedger(); filteredLedgers=allLedgers.slice(); updateSummary(); renderCurrentView();
            showToast('✅ পরিশোধ চিহ্নিত হয়েছে');
        });
    } else {
        if(!confirm('পরিশোধ চিহ্নিত করবেন?')) return;
        all[index].paid=true; all[index].paidDate=nowDate(); all[index].paidTime=nowTime();
        DB.set('ledger',all); loadLedger(); filteredLedgers=allLedgers.slice(); updateSummary(); renderCurrentView();
        showToast('✅ পরিশোধ চিহ্নিত হয়েছে');
    }
}

function markUnpaid(index) {
    var all=DB.get('ledger')||[];
    if(index<0||index>=all.length) return;
    all[index].paid=false; all[index].paidDate=null; all[index].paidTime=null;
    DB.set('ledger',all); loadLedger(); filteredLedgers=allLedgers.slice(); updateSummary(); renderCurrentView();
    showToast('↩ পরিশোধ বাতিল হয়েছে');
}

function renderTableView() {
    var container=document.getElementById('monthlyTables'); if(!container) return; container.innerHTML='';
    var monthGroups={};
    filteredLedgers.forEach(function(item){ var d=new Date(item.date); var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); if(!monthGroups[k]) monthGroups[k]=[]; monthGroups[k].push(item); });
    var MONTHS=['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
    Object.keys(monthGroups).sort().reverse().forEach(function(k){
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

function renderAnalysisView() { updateTopPersons(); updateComparisonStats(); updateMonthlyBreakdown(); }

function updateTopPersons() {
    var topD={}; var topP={};
    (DB.get('ledger')||[]).forEach(function(i){ var p=i.person||i.name||'অজানা'; if(i.type==='dena'){topD[p]=(topD[p]||0)+parseFloat(i.amount||0);}else{topP[p]=(topP[p]||0)+parseFloat(i.amount||0);} });
    var cD=document.getElementById('topDebtors'); var cP=document.getElementById('topCreditors');
    var top5=function(obj){ return Object.entries(obj).sort(function(a,b){ return b[1]-a[1]; }).slice(0,5); };
    if(cD) cD.innerHTML=top5(topD).map(function(e,i){ return '<div class="stat-row"><span class="stat-label">'+(i+1)+'. '+e[0]+'</span><span class="stat-value expense-stat">৳ '+Math.round(e[1])+'</span></div>'; }).join('')||'<p style="color:#6b7280;text-align:center;padding:12px">কোনো ডাটা নেই</p>';
    if(cP) cP.innerHTML=top5(topP).map(function(e,i){ return '<div class="stat-row"><span class="stat-label">'+(i+1)+'. '+e[0]+'</span><span class="stat-value income-stat">৳ '+Math.round(e[1])+'</span></div>'; }).join('')||'<p style="color:#6b7280;text-align:center;padding:12px">কোনো ডাটা নেই</p>';
}

function updateComparisonStats() {
    var now=new Date(); var cm=now.getMonth(); var cy=now.getFullYear(); var lm=cm===0?11:cm-1; var ly=cm===0?cy-1:cy;
    var all=DB.get('ledger')||[];
    var sumF=function(m,y,type){ return all.filter(function(i){ var d=new Date(i.date); return d.getMonth()===m&&d.getFullYear()===y&&i.type===type; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0); };
    _safe('lastMonthDena','৳ '+Math.round(sumF(lm,ly,'dena'))); _safe('lastMonthPabona','৳ '+Math.round(sumF(lm,ly,'pabona')));
    var yrD=all.filter(function(i){ return new Date(i.date).getFullYear()===cy&&i.type==='dena'; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var yrP=all.filter(function(i){ return new Date(i.date).getFullYear()===cy&&i.type==='pabona'; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    _safe('yearlyDena','৳ '+Math.round(yrD)); _safe('yearlyPabona','৳ '+Math.round(yrP));
}

function updateMonthlyBreakdown() {
    var MNAMES=['জানু','ফেব','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];
    var yr=new Date().getFullYear(); var c=document.getElementById('monthGrid'); if(!c) return; c.innerHTML='';
    var all=DB.get('ledger')||[];
    for(var m=0;m<12;m++){
        var m2=m;
        var d=all.filter(function(i){ var dt=new Date(i.date); return dt.getMonth()===m2&&dt.getFullYear()===yr&&i.type==='dena'; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
        var p=all.filter(function(i){ var dt=new Date(i.date); return dt.getMonth()===m2&&dt.getFullYear()===yr&&i.type==='pabona'; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
        c.innerHTML+='<div class="month-item"><span class="month-name">'+MNAMES[m]+'</span><span class="month-value" style="font-size:.7rem"><span style="color:#ef4444">↑'+Math.round(d)+'</span> <span style="color:#10b981">↓'+Math.round(p)+'</span></span></div>';
    }
}

function changePeriod(period) { document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.period===period); }); renderAnalysisView(); }

function showDeleteModal(index) { deleteIndex=index; _safe2('deleteModal','flex'); }
function closeDeleteModal()     { deleteIndex=null;  _safe2('deleteModal','none'); }

function confirmDelete() {
    if(deleteIndex===null) return;
    // confirm handled by modal
    var all=DB.get('ledger')||[];
    if(deleteIndex>=0&&deleteIndex<all.length){
        addToTrash('ledger',all[deleteIndex]); all.splice(deleteIndex,1); DB.set('ledger',all);
        closeDeleteModal(); loadLedger(); filteredLedgers=allLedgers.slice(); updateSummary(); renderCurrentView();
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
        DB.set('ledger',all); loadLedger(); filteredLedgers=allLedgers.slice(); updateSummary(); renderCurrentView();
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