// Daily Account - Settings v3.3 - Android 9 compatible

function loadSettings() {
    var s  = DB.get('settings') || {};
    var dm = document.getElementById('darkModeToggle');
    var ls = document.getElementById('languageSelect');
    var bw = document.getElementById('budgetWarning');
    if (dm) dm.checked = !!s.darkMode;
    if (ls) ls.value   = s.language || 'bn';
    if (bw) bw.checked = s.budgetWarning !== false;
    _updatePremiumUI();
    _loadSavedFonts();
    _updateLockStatus();
}

document.addEventListener('DOMContentLoaded', function() {
    loadSettings();

    var dm = document.getElementById('darkModeToggle');
    if (dm) {
        dm.addEventListener('change', function() {
            var s = DB.get('settings') || {};
            s.darkMode = this.checked;
            DB.set('settings', s);
            document.body.classList.toggle('dark-mode', !!s.darkMode);
            showToast(s.darkMode ? '🌙 ডার্ক মোড চালু' : '☀️ লাইট মোড চালু');
        });
    }

    var ls = document.getElementById('languageSelect');
    if (ls) {
        ls.addEventListener('change', function() {
            var s = DB.get('settings') || {};
            s.language = this.value;
            DB.set('settings', s);
            showToast('✅ ভাষা পরিবর্তন হয়েছে');
        });
    }

    var bw = document.getElementById('budgetWarning');
    if (bw) {
        bw.addEventListener('change', function() {
            var s = DB.get('settings') || {};
            s.budgetWarning = this.checked;
            DB.set('settings', s);
            showToast(this.checked ? '✅ সতর্কতা চালু' : '❌ সতর্কতা বন্ধ');
        });
    }
});

function _updatePremiumUI() {
    // সকলের জন্য সব ফিচার উন্মুক্ত
    var ctaBlock = document.getElementById('premCTABlock');
    var actBlock = document.getElementById('premActiveBlock');
    var fontSec  = document.getElementById('fontSection');
    var lockSec  = document.getElementById('lockSection');

    if (ctaBlock) ctaBlock.style.display = 'none';
    if (actBlock) actBlock.style.display = 'block';
    if (fontSec)  fontSec.style.display  = 'block';
    if (lockSec)  lockSec.style.display  = 'block';

    ['fps','font','lock','trash','backup'].forEach(function(id) {
        var b = document.getElementById('b_'+id);
        if (b) { b.textContent = '✅'; b.classList.add('unlocked'); }
    });

    var el = document.getElementById('premSinceDate');
    if (el) el.textContent = '✅ সকলের জন্য সম্পূর্ণ উন্মুক্ত';
}

function toggleKeyForm() {
    var form = document.getElementById('premKeyForm');
    if (!form) return;
    var open = form.classList.toggle('visible');
    if (open) {
        setTimeout(function(){
            var inp = document.getElementById('__keyInput');
            if (inp) inp.focus();
        }, 60);
    }
}

function exportBackup() {
    var data = {
        app:'Daily Account', version:'3.3',
        exportDate: new Date().toISOString().slice(0,10),
        income:    DB.get('income')    || [],
        expense:   DB.get('expense')   || [],
        ledger:    DB.get('ledger')    || [],
        savings:   DB.get('savings')   || [],
        notes:     DB.get('notes')     || [],
        settings:  DB.get('settings')  || {},
        cssConfig: DB.get('cssConfig') || {},
        pageConfig:DB.get('pageConfig')|| {}
    };
    var json     = JSON.stringify(data, null, 2);
    var filename = 'daily-account-backup-' + new Date().toISOString().slice(0,10) + '.json';
    if (typeof _shareOrDownload === 'function') {
        _shareOrDownload(json, filename, 'application/json');
    } else {
        var blob = new Blob([json], {type:'application/json'});
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href=url; a.download=filename; a.style.display='none';
        document.body.appendChild(a); a.click();
        setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
        showToast('✅ ব্যাকআপ ডাউনলোড সফল!');
    }
}

function importBackup(event) {
    var file = event.target.files[0];
    if (!file) return;
    event.target.value = '';
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var data = JSON.parse(e.target.result);
            if (!confirm('⚠️ সব পুরনো ডাটা মুছে নতুন ডাটা রিস্টোর হবে। নিশ্চিত?')) return;
            if (data.income)     DB.set('income',     data.income);
            if (data.expense)    DB.set('expense',    data.expense);
            if (data.ledger)     DB.set('ledger',     data.ledger);
            if (data.savings)    DB.set('savings',    data.savings);
            if (data.notes)      DB.set('notes',      data.notes);
            if (data.settings)   DB.set('settings',   data.settings);
            if (data.cssConfig)  DB.set('cssConfig',  data.cssConfig);
            if (data.pageConfig) DB.set('pageConfig', data.pageConfig);
            showToast('✅ ব্যাকআপ রিস্টোর সফল!');
            setTimeout(function(){ location.href='../index.html'; }, 1500);
        } catch(err) { showToast('❌ ভুল ফাইল!'); }
    };
    reader.readAsText(file);
}

function exportCSV() {
    var income  = DB.get('income')  || [];
    var expense = DB.get('expense') || [];
    var csv = '\uFEFF';
    csv += 'Type,Source/Category,Amount,Date,Time,Note\n';
    income.forEach(function(i){
        csv += 'Income,"'+(i.source||'N/A')+'",'+i.amount+',"'+(i.date||'')+'","'+(i.time||'')+'","'+(i.note||'')+'"\n';
    });
    expense.forEach(function(i){
        csv += 'Expense,"'+(i.category||'N/A')+'",'+i.amount+',"'+(i.date||'')+'","'+(i.time||'')+'","'+(i.note||'')+'"\n';
    });
    var filename = 'daily-account-'+new Date().toISOString().slice(0,10)+'.csv';
    if (typeof _shareOrDownload === 'function') {
        _shareOrDownload('\uFEFF'+csv, filename, 'text/csv;charset=utf-8');
    } else {
        var blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href=url; a.download=filename; a.style.display='none';
        document.body.appendChild(a); a.click();
        setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
        showToast('✅ CSV ডাউনলোড সফল!');
    }
}

function resetAllData() {
    if (!confirm('⚠️ সব ডাটা মুছে ফেলা হবে। নিশ্চিত?')) return;
    if (!confirm('❗ সত্যিই মুছবেন? শেষ সতর্কতা!')) return;
    DB.clearAll();
    showToast('✅ সব ডাটা মুছে ফেলা হয়েছে');
    setTimeout(function(){ location.href='../index.html'; }, 1500);
}

function _loadSavedFonts() {
    var cf = DB.get('customFonts') || {};
    var bn = document.getElementById('fontBangla');
    var en = document.getElementById('fontEnglish');
    var nm = document.getElementById('fontNumber');
    if (bn) bn.value = cf.bangla  || '';
    if (en) en.value = cf.english || '';
    if (nm) nm.value = cf.number  || '';
}

function saveFonts() {
    var bn = document.getElementById('fontBangla');
    var en = document.getElementById('fontEnglish');
    var nm = document.getElementById('fontNumber');
    var cf = {
        bangla:  (bn ? bn.value : '').trim(),
        english: (en ? en.value : '').trim(),
        number:  (nm ? nm.value : '').trim()
    };
    DB.set('customFonts', cf);
    if (typeof applyCustomFonts === 'function') applyCustomFonts();
    showToast('✅ ফন্ট সংরক্ষিত হয়েছে');
}

function _updateLockStatus() {
    var pin = localStorage.getItem('appLockPin');
    var el  = document.getElementById('lockStatus');
    if (el) el.textContent = pin ? '🔒 App Lock চালু (PIN সেট আছে)' : '🔓 App Lock বন্ধ';
}

function savePin() {
    var inp = document.getElementById('pinInput');
    var pin = (inp ? inp.value : '').trim();
    if (!/^\d{4}$/.test(pin)) { showToast('❌ ঠিক ৪টি সংখ্যার PIN দিন'); return; }
    localStorage.setItem('appLockPin', pin);
    sessionStorage.setItem('__unlocked', '1');
    _updateLockStatus();
    showToast('✅ PIN সেট হয়েছে');
    if (inp) inp.value = '';
}

function removePin() {
    localStorage.removeItem('appLockPin');
    sessionStorage.removeItem('__unlocked');
    _updateLockStatus();
    showToast('🔓 App Lock সরিয়ে নেওয়া হয়েছে');
}

function openSocial(platform) {
    var links = {
        facebook: 'https://facebook.com/jakir.al.jihad',
        telegram: 'https://t.me/jakiraljihad1'
    };
    if (links[platform]) window.open(links[platform], '_blank');
}