var _itemCache = {};
var _cacheIdx  = 0;
function _cacheItem(item) { var k='c'+(++_cacheIdx); _itemCache[k]=item; return k; }
function _getCachedItem(k) { return _itemCache[k]||null; }

// Daily Account — expense-list.js v3.3
// দিন আগে + confirmation সব জায়গায়

var currentView      = 'card';
var currentPeriod    = 'monthly';
var allExpenses      = [];
var filteredExpenses = [];
var deleteIndex      = null;
var currentSort     = 'date_new';

document.addEventListener('DOMContentLoaded', function() {
    loadExpenses(); updateSummary(); applySortToFiltered(); renderCurrentView();
    setTimeout(_populateCategoryFilter, 100);
    var addForm=document.getElementById('addExpenseForm'); if(addForm) addForm.addEventListener('submit',submitAddExpense);
    var editForm=document.getElementById('editForm'); if(editForm) editForm.addEventListener('submit',submitEditExpense);
});

function loadExpenses() { allExpenses=DB.get('expense')||[]; filteredExpenses=allExpenses.slice(); }
function sortBy(val) { currentSort=val||currentSort; applySortToFiltered(); renderCurrentView(); }
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
function _safe(id,val){ var el=document.getElementById(id); if(el) el.textContent=val; }
function _safe2(id,disp){ var el=document.getElementById(id); if(el) el.style.display=disp; }

function updateSummary() {
    var total=filteredExpenses.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var count=filteredExpenses.length; var avg=count>0?total/count:0;
    _safe('totalExpense','৳ '+Math.round(total)); _safe('totalEntries',count); _safe('avgExpense','৳ '+Math.round(avg));
}

function searchExpense() {
    var q=(document.getElementById('searchInput')?document.getElementById('searchInput').value:'').toLowerCase();
    filteredExpenses=q===''?allExpenses.slice():allExpenses.filter(function(i){ return (i.category||i.source||'').toLowerCase().includes(q)||(i.note||'').toLowerCase().includes(q); });
    applySortToFiltered(); updateSummary(); renderCurrentView();
}

function switchView(view) {
    currentView=view;
    document.querySelectorAll('.toggle-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.view===view); });
    _safe2('cardView',view==='card'?'block':'none'); _safe2('tableView',view==='table'?'block':'none'); _safe2('analysisView',view==='analysis'?'block':'none');
    renderCurrentView();
}

function renderCurrentView() {
    if(filteredExpenses.length===0){showEmptyState();return;} hideEmptyState();
    if(currentView==='card') renderCardView();
    else if(currentView==='table') renderTableView();
    else if(currentView==='analysis') renderAnalysisView();
}

function renderCardView() {
    var container=document.getElementById('cardView'); if(!container) return;
    container.innerHTML='';
    filteredExpenses.forEach(function(expense) {
        var idx=allExpenses.findIndex(function(x){ return (x.id&&x.id===expense.id)||JSON.stringify(x)===JSON.stringify(expense); });
        var ck=_cacheItem(expense);
        var isFav=!!expense.favorite; var isPending=!!expense.pending;
        var daysAgo=typeof getDaysAgo==='function'?getDaysAgo(expense.date):'';
        var card=document.createElement('div');
        card.className='list-card expense-card'+(isFav?' favorite-card':'')+(isPending?' pending-card':'');
        card.innerHTML='<div class="card-header"><h3>'+(expense.category||expense.source||'(নাম নেই)')+'</h3><span class="amount expense-amount">৳ '+Math.round(parseFloat(expense.amount||0))+'</span></div>'
            +'<div class="card-meta">📅 <span class="card-date">'+formatDateDisplay(expense.date)+'</span> &nbsp;·&nbsp; 🕑 '+formatTimeAMPM(expense.time)
            +(expense.note?'<br>📝 '+expense.note:'')
            +(isPending?'<br><span style="color:#f59e0b;font-weight:700">⏸ স্থগিত</span>':'')
            +(daysAgo?'<br><span class="days-ago-badge">🕐 '+daysAgo+'</span>':'')
            +'</div>'
            +(expense.photo||expense.drawing||expense.voice ? '<div class="card-media-section">'
                +(expense.photo ? '<img class="card-media-photo" src="'+expense.photo+'" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+expense.photo+'\')" />' : '')
                +(expense.drawing ? '<div class="card-media-drawing" onclick="if(typeof _viewPhoto===\'function\')_viewPhoto(\''+expense.drawing+'\')" ><img src="'+expense.drawing+'" /></div>' : '')
                +(expense.voice ? '<span class="card-media-voice" onclick="_playCardVoice(\''+expense.id+'\',\'expense\')" >🎙️ শুনুন</span>' : '')
                +'</div>' : '')
            +'<div class="card-actions"><button class="action-btn edit-btn" onclick="openEditModal('+idx+')">✏️ সম্পাদনা</button><button class="action-btn delete-btn" onclick="showDeleteModal('+idx+')">🗑️ মুছুন</button><button class="more-btn" onclick="_openMoreMenuCached(this,\'expense\',\''+ck+'\',\'expense\')">•••</button></div>';
        container.appendChild(card);
    });
    setTimeout(initScrollAnim,50);
}

function renderTableView() {
    var container=document.getElementById('monthlyTables'); if(!container) return; container.innerHTML='';
    var monthGroups={};
    filteredExpenses.forEach(function(exp){ var d=new Date(exp.date); var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); if(!monthGroups[k]) monthGroups[k]=[]; monthGroups[k].push(exp); });
    var MONTHS=['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
    Object.keys(monthGroups).sort().reverse().forEach(function(k){
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
}

function renderAnalysisView() { updateExpenseMonthStats(); updateTopCategories(); updateExpenseComparison(); updateExpenseMonthlyBreakdown(); }

function updateExpenseMonthStats() {
    var now=new Date(); var m=now.getMonth(); var yr=now.getFullYear();
    var list=allExpenses.filter(function(i){ var d=new Date(i.date); return d.getMonth()===m&&d.getFullYear()===yr; });
    var total=list.reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var max=list.reduce(function(s,i){ return Math.max(s,parseFloat(i.amount||0)); },0);
    var days=new Date(yr,m+1,0).getDate();
    _safe('currentMonthExpense','৳ '+Math.round(total)); _safe('avgDailyExpense','৳ '+Math.round(total/days)); _safe('maxExpense','৳ '+Math.round(max)); _safe('currentMonthEntries',list.length);
}

function updateTopCategories() {
    var totals={};
    allExpenses.forEach(function(i){ var s=i.category||i.source||'অন্যান্য'; totals[s]=(totals[s]||0)+parseFloat(i.amount||0); });
    var sorted=Object.entries(totals).sort(function(a,b){ return b[1]-a[1]; }).slice(0,5);
    var c=document.getElementById('topCategories'); if(!c) return;
    c.innerHTML=sorted.length===0?'<p style="text-align:center;color:#6b7280;padding:20px">কোনো ডাটা নেই</p>'
        :sorted.map(function(e,i){ return '<div class="stat-row"><span class="stat-label">'+(i+1)+'. '+e[0]+'</span><span class="stat-value expense-stat">৳ '+Math.round(e[1])+'</span></div>'; }).join('');
}

function updateExpenseComparison() {
    var now=new Date(); var cm=now.getMonth(); var cy=now.getFullYear(); var lm=cm===0?11:cm-1; var ly=cm===0?cy-1:cy;
    var sumF=function(m2,y2){ return allExpenses.filter(function(i){ var d=new Date(i.date); return d.getMonth()===m2&&d.getFullYear()===y2; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0); };
    var curTotal=sumF(cm,cy); var lastTotal=sumF(lm,ly);
    var yrTotal=allExpenses.filter(function(i){ return new Date(i.date).getFullYear()===cy; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
    var change=lastTotal>0?((curTotal-lastTotal)/lastTotal*100).toFixed(1):0;
    _safe('lastMonthExpense','৳ '+Math.round(lastTotal)); _safe('yearlyExpense','৳ '+Math.round(yrTotal));
    var chEl=document.getElementById('monthChange'); if(chEl){ chEl.textContent=(change>0?'+':'')+change+'%'; chEl.style.color=change>=0?'#ef4444':'#10b981'; }
}

function updateExpenseMonthlyBreakdown() {
    var MNAMES=['জানু','ফেব','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];
    var yr=new Date().getFullYear(); var c=document.getElementById('monthGrid'); if(!c) return; c.innerHTML='';
    for(var m=0;m<12;m++){
        var m2=m; var tot=allExpenses.filter(function(i){ var d=new Date(i.date); return d.getMonth()===m2&&d.getFullYear()===yr; }).reduce(function(s,i){ return s+parseFloat(i.amount||0); },0);
        c.innerHTML+='<div class="month-item"><span class="month-name">'+MNAMES[m]+'</span><span class="month-value expense-stat">৳ '+Math.round(tot)+'</span></div>';
    }
}

function changePeriod(period) { currentPeriod=period; document.querySelectorAll('.period-btn').forEach(function(b){ b.classList.toggle('active',b.dataset.period===period); }); renderAnalysisView(); }

function showDeleteModal(index) { deleteIndex=index; _safe2('deleteModal','flex'); }
function closeDeleteModal()     { deleteIndex=null;  _safe2('deleteModal','none'); }

function confirmDeleteExpense() {
    if (deleteIndex===null) return;
    if (!confirm('এই এন্ট্রি মুছবেন?')) return;
    if (deleteIndex>=0&&deleteIndex<allExpenses.length) {
        addToTrash('expense', allExpenses[deleteIndex]);
        allExpenses.splice(deleteIndex,1); DB.set('expense',allExpenses);
        closeDeleteModal(); loadExpenses(); filteredExpenses=allExpenses.slice(); updateSummary(); renderCurrentView();
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
    loadExpenses(); filteredExpenses=allExpenses.slice(); updateSummary(); renderCurrentView();
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
        
        // media save
        if (typeof _formMedia!=='undefined') {
            if (_formMedia.photo)   allExpenses[idx].photo   = _formMedia.photo;
            if (_formMedia.drawing) allExpenses[idx].drawing = _formMedia.drawing;
            if (_formMedia.voice)   allExpenses[idx].voice   = _formMedia.voice;
            _formMedia.photo=null; _formMedia.drawing=null; _formMedia.voice=null;
        }
        DB.set('expense',allExpenses); loadExpenses(); filteredExpenses=allExpenses.slice(); updateSummary(); renderCurrentView();
        closeEditModal(); showToast('✅ আপডেট হয়েছে');
    }
}

function showEmptyState() { _safe2('emptyState','block'); _safe2('cardView','none'); _safe2('tableView','none'); _safe2('analysisView','none'); }
function hideEmptyState()  { _safe2('emptyState','none'); }

function filterByCategory() {
    var val = document.getElementById('categoryFilter') ? document.getElementById('categoryFilter').value : 'all';
    filteredExpenses = (val === 'all') ? allExpenses.slice() : allExpenses.filter(function(i){ return (i.category||i.source||'') === val; });
    applySortToFiltered();
    updateSummary();
    renderCurrentView();
}

function _populateCategoryFilter() {
    var sel = document.getElementById('categoryFilter');
    if (!sel) return;
    // Built-in defaults
    var defaults = ['খাবার','পরিবহন','বিল/ইউটিলিটি','স্বাস্থ্য','শিক্ষা','পোশাক','বিনোদন','বাড়িভাড়া','কেনাকাটা','অন্যান্য'];
    // Custom from localStorage
    var customCats = JSON.parse(localStorage.getItem('__custom_cat_expense') || '[]');
    // From DB
    var dbCats = {};
    (DB.get('expense')||[]).forEach(function(i){ var cv=i.category||i.source||''; if(cv) dbCats[cv]=true; });
    
    var allCats = [];
    defaults.forEach(function(d){ if(allCats.indexOf(d)===-1) allCats.push(d); });
    customCats.forEach(function(d){ if(allCats.indexOf(d)===-1) allCats.push(d); });
    Object.keys(dbCats).sort().forEach(function(d){ if(allCats.indexOf(d)===-1) allCats.push(d); });
    
    // rebuild options
    while (sel.options.length > 1) sel.remove(1);
    allCats.forEach(function(cat){
        var opt = document.createElement('option');
        opt.value = cat; opt.textContent = cat;
        sel.appendChild(opt);
    });
}

function setSortChip(btn, val) {
    document.querySelectorAll('.sort-chip').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    sortBy(val);
}