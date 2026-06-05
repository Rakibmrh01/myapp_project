// Daily Account — accounting.js v2.2
// Real হিসাব বিজ্ঞান ছক — জাবেদা, খতিয়ান, রেওয়ামিল, আর্থিক বিবরণী

var currentTab = 'journal';
var _journalSort = 'date_desc'; // ডিফল্ট: নতুন আগে

/* ══════════════════════════════
   SORT
══════════════════════════════ */
function setSort(mode) {
    _journalSort = mode;
    document.querySelectorAll('.sort-btn').forEach(function(b) { b.classList.remove('s-active'); });
    var btn = document.getElementById('sBtn_' + mode);
    if (btn) btn.classList.add('s-active');
    buildJournal();
}

/* ══════════════════════════════
   TAB
══════════════════════════════ */
function showTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('onclick').indexOf("'"+tab+"'") !== -1);
    });
    document.querySelectorAll('.section-wrap').forEach(function(s) {
        s.classList.toggle('active', s.id === 'sec_'+tab);
    });

    /* action bar: sort শুধু জাবেদায়, copy label বদলায় */
    var ab  = document.getElementById('actionBar');
    var cb  = ab ? ab.querySelector('.copy-bar-btn') : null;
    var sr  = ab ? ab.querySelector('.sort-row')     : null;
    var labels = {
        journal:'📋 জাবেদা কপি করুন',
        ledger :'📋 খতিয়ান কপি করুন',
        trial  :'📋 রেওয়ামিল কপি করুন',
        financial:'📋 বিবরণী কপি করুন'
    };
    if (ab) ab.className = 'action-bar show';
    if (cb) { cb.textContent = labels[tab]||'📋 কপি করুন'; cb.onclick = function(){ copySection(tab); }; }
    if (sr) sr.style.display = tab==='journal' ? 'flex' : 'none';

    if (tab==='journal')   buildJournal();
    if (tab==='ledger')    buildLedger();
    if (tab==='trial')     buildTrial();
    if (tab==='financial') buildFinancial();
}

/* ══════════════════════════════
   HELPERS
══════════════════════════════ */
function fmtN(n) {
    var v = Math.round(parseFloat(n||0));
    if (v === 0) return '—';
    return v.toLocaleString('en-BD');
}
function fmtD(dateStr) {
    return typeof formatDateDisplay==='function' ? formatDateDisplay(dateStr) : (dateStr||'--');
}
function showToast(msg) {
    if (typeof window._showToast==='function') { window._showToast(msg); return; }
    var t=document.createElement('div');
    t.textContent=msg;
    t.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;padding:9px 20px;border-radius:20px;font-size:.8rem;font-weight:700;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.35)';
    document.body.appendChild(t);
    setTimeout(function(){t.remove();},2000);
}

/* ══════════════════════════════
   জাবেদা (Journal)
══════════════════════════════ */
function buildJournal() {
    var incomes  = (DB.get('income')  || []).slice();
    var expenses = (DB.get('expense') || []).slice();
    var savings  = (DB.get('savings') || []).slice();
    var ledger   = (DB.get('ledger')  || []).slice();

    var entries = [];

    incomes.forEach(function(i) {
        entries.push({
            date:i.date,
            dr:'নগদ / ব্যাংক হিসাব',
            cr:(i.source||'আয়')+' হিসাব',
            amt:parseFloat(i.amount||0),
            narr:'('+(i.source||'আয়')+(i.note?' — '+i.note:'')+' বাবদ প্রাপ্তি)'
        });
    });
    expenses.forEach(function(i) {
        entries.push({
            date:i.date,
            dr:(i.category||i.source||'ব্যয়')+' হিসাব',
            cr:'নগদ / ব্যাংক হিসাব',
            amt:parseFloat(i.amount||0),
            narr:'('+(i.category||i.source||'ব্যয়')+(i.note?' — '+i.note:'')+' বাবদ প্রদান)'
        });
    });
    savings.forEach(function(i) {
        entries.push({
            date:i.date,
            dr:'সঞ্চয় / '+(i.method||'নগদ')+' হিসাব',
            cr:'নগদ / ব্যাংক হিসাব',
            amt:parseFloat(i.amount||0),
            narr:'(সঞ্চয় জমা'+(i.note?' — '+i.note:'')+' বাবদ)'
        });
    });
    ledger.forEach(function(i) {
        var p = i.person||i.name||'ব্যক্তি';
        if (i.type==='dena') {
            entries.push({ date:i.date, dr:p+' হিসাব (প্রদেয়)', cr:'নগদ / ব্যাংক হিসাব', amt:parseFloat(i.amount||0), narr:'('+p+'-কে ধার প্রদান'+(i.note?' — '+i.note:'')+')' });
        } else {
            entries.push({ date:i.date, dr:'নগদ / ব্যাংক হিসাব', cr:p+' হিসাব (প্রাপ্য)', amt:parseFloat(i.amount||0), narr:'('+p+'-এর কাছ থেকে ধার গ্রহণ'+(i.note?' — '+i.note:'')+')' });
        }
    });

    /* SORT */
    var s = _journalSort;
    if (s==='date_asc')  entries.sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
    if (s==='date_desc') entries.sort(function(a,b){ return new Date(b.date)-new Date(a.date); });
    if (s==='amt_desc')  entries.sort(function(a,b){ return b.amt-a.amt; });
    if (s==='amt_asc')   entries.sort(function(a,b){ return a.amt-b.amt; });

    var tbody = document.getElementById('body_journal');
    if (!tbody) return;
    if (entries.length===0) {
        tbody.innerHTML='<tr><td colspan="5" class="empty-msg">কোনো লেনদেন নেই</td></tr>';
        return;
    }

    var totalDr=0; var html='';
    var copyText='জাবেদা (Journal)\n'+'═'.repeat(55)+'\n';
    copyText+='ক্র. | তারিখ       | হিসাবের নাম                   | ডেবিট    | ক্রেডিট\n'+'─'.repeat(55)+'\n';

    entries.forEach(function(e, idx) {
        totalDr += e.amt;
        var n = idx+1;
        html += '<tr class="dr-row">'
            +'<td class="j-sl" rowspan="3">'+n+'</td>'
            +'<td class="j-date" rowspan="3">'+fmtD(e.date)+'</td>'
            +'<td class="j-name"><strong>'+e.dr+'</strong>&nbsp;<span style="color:#3b82f6;font-size:.65rem;font-weight:800;background:#eff6ff;padding:1px 5px;border-radius:4px">Dr.</span></td>'
            +'<td class="j-amt j-dr-amt">'+fmtN(e.amt)+'</td>'
            +'<td class="j-amt" style="color:#94a3b8">—</td>'
            +'</tr>'
            +'<tr class="cr-row">'
            +'<td class="j-name" style="padding-left:28px;color:#374151">'
            +'<span style="color:#9ca3af;font-size:.68rem;margin-right:4px">To</span>'+e.cr
            +'&nbsp;<span style="color:#16a34a;font-size:.65rem;font-weight:800;background:#f0fdf4;padding:1px 5px;border-radius:4px">Cr.</span>'
            +'</td>'
            +'<td class="j-amt" style="color:#94a3b8">—</td>'
            +'<td class="j-amt j-cr-amt">'+fmtN(e.amt)+'</td>'
            +'</tr>'
            +'<tr class="narr-row">'
            +'<td colspan="3"><span style="color:#94a3b8;margin-right:4px">✦</span>'+e.narr+'</td>'
            +'</tr>';

        copyText+=fmtD(e.date).padEnd(12)+'| Dr.'+e.dr.padEnd(30)+'| '+String(Math.round(e.amt)).padStart(8)+' |\n';
        copyText+='            |     '+e.cr.padEnd(31)+'|          | '+String(Math.round(e.amt)).padStart(8)+'\n';
        copyText+='─'.repeat(55)+'\n';
    });

    html+='<tr class="total-row">'
        +'<td colspan="2">মোট (Total)</td>'
        +'<td></td>'
        +'<td class="j-dr-amt">'+fmtN(totalDr)+'</td>'
        +'<td class="j-cr-amt">'+fmtN(totalDr)+'</td>'
        +'</tr>';

    copyText+='═'.repeat(55)+'\nমোট ডেবিট = মোট ক্রেডিট = ৳'+Math.round(totalDr)+'\n';
    tbody.innerHTML=html;
    var ca=document.getElementById('copy_journal'); if(ca) ca.value=copyText;
}

/* ══════════════════════════════
   খতিয়ান (Ledger) — T-Account
══════════════════════════════ */
function buildLedger() {
    var incomes  = DB.get('income')  || [];
    var expenses = DB.get('expense') || [];
    var savings  = DB.get('savings') || [];
    var ledger   = DB.get('ledger')  || [];

    var accounts = {};
    function addDr(name,amt,date,ref){ if(!accounts[name])accounts[name]={dr:[],cr:[]}; accounts[name].dr.push({amt:parseFloat(amt||0),date:date,ref:ref||''}); }
    function addCr(name,amt,date,ref){ if(!accounts[name])accounts[name]={dr:[],cr:[]}; accounts[name].cr.push({amt:parseFloat(amt||0),date:date,ref:ref||''}); }

    incomes.forEach(function(i) {
        addDr('নগদ / ব্যাংক হিসাব', i.amount, i.date, i.source||'আয়');
        addCr((i.source||'আয়')+' হিসাব', i.amount, i.date, 'নগদ / ব্যাংক');
    });
    expenses.forEach(function(i) {
        addDr((i.category||i.source||'ব্যয়')+' হিসাব', i.amount, i.date, 'নগদ / ব্যাংক');
        addCr('নগদ / ব্যাংক হিসাব', i.amount, i.date, i.category||i.source||'ব্যয়');
    });
    savings.forEach(function(i) {
        addDr('সঞ্চয় হিসাব', i.amount, i.date, 'নগদ / ব্যাংক');
        addCr('নগদ / ব্যাংক হিসাব', i.amount, i.date, 'সঞ্চয়');
    });
    ledger.forEach(function(i) {
        var p=i.person||i.name||'ব্যক্তি';
        if(i.type==='dena'){
            addDr(p+' হিসাব', i.amount, i.date, 'নগদ (দেনা)');
            addCr('নগদ / ব্যাংক হিসাব', i.amount, i.date, p+' — দেনা');
        } else {
            addDr('নগদ / ব্যাংক হিসাব', i.amount, i.date, p+' — পাওনা');
            addCr(p+' হিসাব', i.amount, i.date, 'নগদ (পাওনা)');
        }
    });

    var container=document.getElementById('ledger_accounts');
    if(!container) return;
    if(Object.keys(accounts).length===0){ container.innerHTML='<div class="empty-msg">কোনো ডাটা নেই</div>'; return; }

    var html='<div class="t-wrapper">';
    var copyText='খতিয়ান (Ledger)\n'+'═'.repeat(50)+'\n';

    Object.keys(accounts).sort().forEach(function(name) {
        var acct=accounts[name];
        var drTotal=acct.dr.reduce(function(s,e){return s+e.amt;},0);
        var crTotal=acct.cr.reduce(function(s,e){return s+e.amt;},0);
        var balance=drTotal-crTotal;
        var maxRows=Math.max(acct.dr.length,acct.cr.length);

        html+='<div class="t-account">'
            +'<div class="t-title">'+name
            +'<span>জের: '+(balance>=0?'Dr. ':'Cr. ')+'৳'+fmtN(Math.abs(balance))+'</span></div>'
            +'<div class="t-body">';

        /* Dr side */
        html+='<div class="t-side">'
            +'<table class="t-table"><thead>'
            +'<tr><th class="t-dr-head" colspan="3">ডেবিট পক্ষ (Dr.)</th></tr>'
            +'<tr><th style="width:62px">তারিখ</th><th>বিবরণ</th><th style="width:68px;text-align:right">টাকা (৳)</th></tr>'
            +'</thead><tbody>';
        acct.dr.forEach(function(e){
            html+='<tr><td style="color:#475569;font-size:.68rem">'+fmtD(e.date)+'</td>'
                +'<td>'+e.ref+'</td>'
                +'<td class="t-dr-amt">'+fmtN(e.amt)+'</td></tr>';
        });
        if(balance<0) html+='<tr class="t-jer"><td colspan="2" style="color:#15803d;font-style:italic;font-size:.68rem">জের বহন (Cr.)</td><td class="t-cr-amt">'+fmtN(Math.abs(balance))+'</td></tr>';
        html+='<tr class="t-total"><td colspan="2" style="font-weight:900">মোট</td><td class="t-dr-amt">'+fmtN(Math.max(drTotal,crTotal))+'</td></tr>';
        html+='</tbody></table></div>';

        /* Cr side */
        html+='<div class="t-side">'
            +'<table class="t-table"><thead>'
            +'<tr><th class="t-cr-head" colspan="3">ক্রেডিট পক্ষ (Cr.)</th></tr>'
            +'<tr><th style="width:62px">তারিখ</th><th>বিবরণ</th><th style="width:68px;text-align:right">টাকা (৳)</th></tr>'
            +'</thead><tbody>';
        acct.cr.forEach(function(e){
            html+='<tr><td style="color:#475569;font-size:.68rem">'+fmtD(e.date)+'</td>'
                +'<td>'+e.ref+'</td>'
                +'<td class="t-cr-amt">'+fmtN(e.amt)+'</td></tr>';
        });
        if(balance>0) html+='<tr class="t-jer"><td colspan="2" style="color:#dc2626;font-style:italic;font-size:.68rem">জের বহন (Dr.)</td><td class="t-dr-amt">'+fmtN(balance)+'</td></tr>';
        html+='<tr class="t-total"><td colspan="2" style="font-weight:900">মোট</td><td class="t-cr-amt">'+fmtN(Math.max(drTotal,crTotal))+'</td></tr>';
        html+='</tbody></table></div>';

        html+='</div></div>'; /* t-body, t-account */

        copyText+='\n'+name+'\n'+'─'.repeat(44)+'\n';
        copyText+='Dr. মোট: ৳'+Math.round(drTotal)+' | Cr. মোট: ৳'+Math.round(crTotal)+' | জের: '+(balance>=0?'Dr.':'Cr.')+' ৳'+Math.round(Math.abs(balance))+'\n';
    });

    html+='</div>';
    container.innerHTML=html;
    var ca=document.getElementById('copy_ledger'); if(ca) ca.value=copyText;
}

/* ══════════════════════════════
   রেওয়ামিল (Trial Balance)
══════════════════════════════ */
function buildTrial() {
    var incomes  = DB.get('income')  || [];
    var expenses = DB.get('expense') || [];
    var savings  = DB.get('savings') || [];
    var ledger   = DB.get('ledger')  || [];

    var totalIncome  = incomes.reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var totalExpense = expenses.reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var totalSavings = savings.reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var dena   = ledger.filter(function(i){return i.type==='dena';}).reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var pabona = ledger.filter(function(i){return i.type==='pabona';}).reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var cash   = totalIncome+pabona-totalExpense-dena-totalSavings;

    var catTotals={}; expenses.forEach(function(i){var c=i.category||i.source||'অন্যান্য ব্যয়';catTotals[c]=(catTotals[c]||0)+parseFloat(i.amount||0);});
    var srcTotals={}; incomes.forEach(function(i){var s=i.source||'অন্যান্য আয়';srcTotals[s]=(srcTotals[s]||0)+parseFloat(i.amount||0);});

    var rows=[];
    rows.push({type:'head',label:'সম্পদ হিসাব (Assets)'});
    rows.push({label:'নগদ ও ব্যাংক হিসাব',dr:Math.max(0,cash),cr:0});
    rows.push({label:'পাওনা / প্রাপ্য হিসাব',dr:pabona,cr:0});
    rows.push({label:'সঞ্চয় হিসাব',dr:totalSavings,cr:0});
    rows.push({type:'head',label:'দায় হিসাব (Liabilities)'});
    rows.push({label:'দেনা / প্রদেয় হিসাব',dr:0,cr:dena});
    rows.push({type:'head',label:'আয় হিসাব (Revenue)'});
    Object.keys(srcTotals).forEach(function(s){rows.push({label:s,dr:0,cr:srcTotals[s]});});
    rows.push({type:'head',label:'ব্যয় হিসাব (Expense)'});
    Object.keys(catTotals).forEach(function(c){rows.push({label:c,dr:catTotals[c],cr:0});});

    var totalDr=rows.reduce(function(s,r){return s+(r.dr||0);},0);
    var totalCr=rows.reduce(function(s,r){return s+(r.cr||0);},0);

    var tbody=document.getElementById('body_trial'); if(!tbody) return;
    var today=new Date();
    var dateStr=String(today.getDate()).padStart(2,'0')+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+today.getFullYear();
    var html=''; var sl=0;
    var copyText='রেওয়ামিল (Trial Balance)\nতারিখ: '+dateStr+'\n'+'═'.repeat(55)+'\n'+'ক্র. | হিসাব শিরোনাম                  | ডেবিট (৳)   | ক্রেডিট (৳)\n'+'─'.repeat(55)+'\n';

    rows.forEach(function(r){
        if(r.type==='head'){
            html+='<tr class="section-head"><td colspan="4">◆ '+r.label+'</td></tr>';
            copyText+='\n▸ '+r.label+'\n';
        } else {
            sl++;
            html+='<tr>'
                +'<td style="text-align:center;color:#94a3b8;font-size:.7rem">'+sl+'</td>'
                +'<td>'+r.label+'</td>'
                +'<td class="tb-dr">'+(r.dr>0?fmtN(r.dr):'—')+'</td>'
                +'<td class="tb-cr">'+(r.cr>0?fmtN(r.cr):'—')+'</td>'
                +'</tr>';
            copyText+=sl+'    | '+r.label.padEnd(32)+'| '+(r.dr>0?String(Math.round(r.dr)).padStart(11):' '.repeat(11))+'| '+(r.cr>0?String(Math.round(r.cr)).padStart(11):'')+'\n';
        }
    });

    html+='<tr class="total-row">'
        +'<td colspan="2">সর্বমোট (Grand Total)</td>'
        +'<td>৳ '+fmtN(totalDr)+'</td>'
        +'<td>৳ '+fmtN(totalCr)+'</td>'
        +'</tr>';

    copyText+='─'.repeat(55)+'\nমোট | '+' '.repeat(32)+'| '+String(Math.round(totalDr)).padStart(11)+'| '+String(Math.round(totalCr)).padStart(11)+'\n';
    tbody.innerHTML=html;

    var diff=Math.abs(totalDr-totalCr); var balanced=diff<1;
    var statusDiv=document.getElementById('trial_status');
    if(statusDiv) statusDiv.innerHTML='<div class="'+(balanced?'balance-ok':'balance-fail')+'">'
        +(balanced
            ?'✅ রেওয়ামিল মিলেছে — ডেবিট = ক্রেডিট = ৳'+fmtN(totalDr)
            :'⚠️ মেলেনি! ব্যবধান: ৳'+fmtN(diff)+'  (হিসাবে ভুল আছে)'
        )+'</div>';
    copyText+=(balanced?'✅ রেওয়ামিল মিলেছে':'⚠️ মেলেনি, ব্যবধান: ৳'+Math.round(diff))+'\n';
    var ca=document.getElementById('copy_trial'); if(ca) ca.value=copyText;
}

/* ══════════════════════════════
   আর্থিক বিবরণী (Financial Statements)
══════════════════════════════ */
function buildFinancial() {
    var incomes  = DB.get('income')  || [];
    var expenses = DB.get('expense') || [];
    var savings  = DB.get('savings') || [];
    var ledger   = DB.get('ledger')  || [];

    var totalIncome  = incomes.reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var totalExpense = expenses.reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var totalSavings = savings.reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var unpaidDena   = ledger.filter(function(i){return i.type==='dena'&&!i.paid;}).reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var unpaidPabona = ledger.filter(function(i){return i.type==='pabona'&&!i.paid;}).reduce(function(s,i){return s+parseFloat(i.amount||0);},0);
    var netIncome    = totalIncome-totalExpense;
    var cash         = Math.max(0,netIncome+unpaidPabona-unpaidDena-totalSavings);
    var totalAssets  = cash+unpaidPabona+totalSavings;
    var totalLiab    = unpaidDena;
    var equity       = totalAssets-totalLiab;

    var catTotals={}; expenses.forEach(function(i){var c=i.category||i.source||'অন্যান্য';catTotals[c]=(catTotals[c]||0)+parseFloat(i.amount||0);});
    var srcTotals={}; incomes.forEach(function(i){var s=i.source||'অন্যান্য';srcTotals[s]=(srcTotals[s]||0)+parseFloat(i.amount||0);});

    var today=new Date();
    var dateStr=String(today.getDate()).padStart(2,'0')+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+today.getFullYear();
    var html='';

    /* ── Income Statement ── */
    html+='<div class="fs-card fs-green">'
        +'<div class="fs-card-title">📊 আয় বিবরণী (Income Statement)'
        +'<span style="font-size:.63rem;opacity:.7;margin-left:auto">'+dateStr+'</span></div>'
        +'<table class="fs-table"><thead><tr><th>বিবরণ</th><th class="fs-right">পরিমাণ (৳)</th><th class="fs-right">মোট (৳)</th></tr></thead><tbody>'
        +'<tr style="background:#f0fdf4"><td colspan="3" style="font-weight:900;color:#15803d;font-size:.73rem;padding:7px 10px">▸ আয় সমূহ (Revenue):</td></tr>';
    Object.keys(srcTotals).forEach(function(s){
        html+='<tr class="indent"><td>'+s+'</td><td class="fs-cr">'+fmtN(srcTotals[s])+'</td><td></td></tr>';
    });
    html+='<tr class="sub-total"><td><strong>মোট আয়</strong></td><td></td><td class="fs-cr"><strong>'+fmtN(totalIncome)+'</strong></td></tr>';
    html+='<tr style="background:#fef2f2"><td colspan="3" style="font-weight:900;color:#dc2626;font-size:.73rem;padding:7px 10px">▸ ব্যয় সমূহ (Expense):</td></tr>';
    Object.keys(catTotals).forEach(function(c){
        html+='<tr class="indent"><td>'+c+'</td><td class="fs-dr">'+fmtN(catTotals[c])+'</td><td></td></tr>';
    });
    html+='<tr class="sub-total"><td><strong>মোট ব্যয়</strong></td><td></td><td class="fs-dr"><strong>'+fmtN(totalExpense)+'</strong></td></tr>';
    html+='<tr class="'+(netIncome>=0?'net-profit':'net-loss')+'">'
        +'<td colspan="2"><strong>'+(netIncome>=0?'✅ নিট মুনাফা (Net Profit)':'❌ নিট লোকসান (Net Loss)')+'</strong></td>'
        +'<td class="'+(netIncome>=0?'fs-cr':'fs-dr')+'"><strong>'+fmtN(Math.abs(netIncome))+'</strong></td>'
        +'</tr></tbody></table></div>';

    /* ── Balance Sheet ── */
    html+='<div class="fs-card fs-blue">'
        +'<div class="fs-card-title">🏛️ আর্থিক অবস্থার বিবরণী (Balance Sheet)'
        +'<span style="font-size:.63rem;opacity:.7;margin-left:auto">'+dateStr+'</span></div>'
        +'<div style="overflow-x:auto"><table class="fs-table" style="min-width:360px"><thead>'
        +'<tr><th colspan="2" style="text-align:center;border-right:2px solid #1d4ed8">সম্পদ (Assets)</th><th colspan="2" style="text-align:center">দায় ও মালিকানাস্বত্ব</th></tr>'
        +'</thead><tbody>'
        +'<tr style="background:#eff6ff">'
        +'<td colspan="2" style="font-weight:900;color:#1d4ed8;font-size:.72rem;border-right:2px solid #bfdbfe">▸ চলতি সম্পদ:</td>'
        +'<td colspan="2" style="font-weight:900;color:#dc2626;font-size:.72rem">▸ চলতি দায়:</td></tr>'
        +'<tr>'
        +'<td style="border-right:1px solid #e2e8f0">নগদ ও ব্যাংক</td><td class="fs-cr" style="border-right:2px solid #bfdbfe">'+fmtN(cash)+'</td>'
        +'<td>দেনা (প্রদেয়)</td><td class="fs-dr">'+fmtN(unpaidDena)+'</td></tr>'
        +'<tr>'
        +'<td style="border-right:1px solid #e2e8f0">পাওনা (প্রাপ্য)</td><td class="fs-cr" style="border-right:2px solid #bfdbfe">'+fmtN(unpaidPabona)+'</td>'
        +'<td colspan="2" style="font-weight:900;color:#1d4ed8;font-size:.72rem">▸ মালিকানাস্বত্ব:</td></tr>'
        +'<tr>'
        +'<td style="border-right:1px solid #e2e8f0">সঞ্চয়</td><td class="fs-cr" style="border-right:2px solid #bfdbfe">'+fmtN(totalSavings)+'</td>'
        +'<td>মালিকের স্বত্ব</td><td class="fs-cr">'+fmtN(equity)+'</td></tr>'
        +'<tr class="grand-total">'
        +'<td colspan="2" style="border-right:2px solid #475569">মোট সম্পদ: ৳ '+fmtN(totalAssets)+'</td>'
        +'<td colspan="2">মোট দায় + স্বত্ব: ৳ '+fmtN(totalLiab+equity)+'</td></tr>'
        +'</tbody></table></div></div>';

    /* ── Savings ── */
    html+='<div class="fs-card fs-purple">'
        +'<div class="fs-card-title">🏦 সঞ্চয় বিবরণী</div>'
        +'<table class="fs-table"><thead><tr><th>মাধ্যম</th><th>ব্যাংক / প্রতিষ্ঠান</th><th class="fs-right">পরিমাণ (৳)</th></tr></thead><tbody>';
    savings.forEach(function(s){
        html+='<tr><td>'+(s.method||'নগদ')+'</td><td>'+(s.bankName||'—')+'</td><td class="fs-cr">'+fmtN(s.amount)+'</td></tr>';
    });
    if(savings.length===0) html+='<tr><td colspan="3" class="empty-msg">কোনো সঞ্চয় নেই</td></tr>';
    html+='<tr class="grand-total"><td colspan="2">মোট সঞ্চয়</td><td style="text-align:right">৳ '+fmtN(totalSavings)+'</td></tr>'
        +'</tbody></table></div>';

    document.getElementById('financial_content').innerHTML=html;

    var copyText='আর্থিক বিবরণী — '+dateStr+'\n'+'═'.repeat(40)+'\n';
    copyText+='\nআয় বিবরণী:\n মোট আয়:  ৳'+Math.round(totalIncome)+'\n মোট ব্যয়: ৳'+Math.round(totalExpense)+'\n নিট: ৳'+Math.round(netIncome)+'\n';
    copyText+='\nব্যালেন্স শিট:\n নগদ: ৳'+Math.round(cash)+'\n পাওনা: ৳'+Math.round(unpaidPabona)+'\n সঞ্চয়: ৳'+Math.round(totalSavings)+'\n দেনা: ৳'+Math.round(unpaidDena)+'\n মালিকানাস্বত্ব: ৳'+Math.round(equity)+'\n';
    var ca=document.getElementById('copy_financial'); if(ca) ca.value=copyText;
}

/* ══════════════════════════════
   COPY
══════════════════════════════ */
function copySection(tab) {
    var ta=document.getElementById('copy_'+tab);
    if(!ta||!ta.value){ showToast('❌ কিছু নেই'); return; }
    if(navigator.clipboard){
        navigator.clipboard.writeText(ta.value)
            .then(function(){ showToast('✅ কপি হয়েছে!'); })
            .catch(function(){ _fallbackCopy(ta.value); });
    } else { _fallbackCopy(ta.value); }
}
function _fallbackCopy(text){
    var t=document.createElement('textarea');t.value=text;t.style.cssText='position:fixed;opacity:0';
    document.body.appendChild(t);t.select();
    try{document.execCommand('copy');showToast('✅ কপি হয়েছে!');}catch(e){showToast('❌ কপি হয়নি');}
    document.body.removeChild(t);
}

/* ══════════════════════════════
   INIT
══════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
    buildJournal();
});
