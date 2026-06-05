// Daily Account - Ledger Module - Android 9 compatible

document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('ledgerForm');
    if (form) form.addEventListener('submit', submitLedger);
    loadRecentLedger();
    setupLedgerTypeToggle();
});

function setupLedgerTypeToggle() {
    document.querySelectorAll('.type-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.type-btn').forEach(function(b){ b.classList.remove('active'); });
            this.classList.add('active');
            var typeEl = document.getElementById('type');
            if (typeEl) typeEl.value = this.dataset.type || '';
        });
    });
}

function submitLedger(e) {
    e.preventDefault();
    var person = (document.getElementById('person') ? document.getElementById('person').value : '').trim();
    var type   = document.getElementById('type')   ? document.getElementById('type').value   : 'dena';
    var amount = document.getElementById('amount') ? document.getElementById('amount').value : '';
    var date   = (document.getElementById('date')  ? document.getElementById('date').value   : '') || nowDate();
    var time   = (document.getElementById('time')  ? document.getElementById('time').value   : '') || nowTime();
    var note   = (document.getElementById('note')  ? document.getElementById('note').value   : '').trim();
    var dueDate= document.getElementById('dueDate') ? document.getElementById('dueDate').value : '';

    if (!validateRequired(person)) { showAlert('ব্যক্তির নাম লিখুন'); return; }
    if (!validateAmount(amount))   { showAlert('সঠিক পরিমাণ লিখুন'); return; }

    // media attach
    var _mediaObj = {};
    if (typeof _formMedia!=='undefined') {
        if (_formMedia.photo)   _mediaObj.photo   = _formMedia.photo;
        if (_formMedia.drawing) _mediaObj.drawing = _formMedia.drawing;
        if (_formMedia.voice)   _mediaObj.voice   = _formMedia.voice;
        _formMedia.photo=null; _formMedia.drawing=null; _formMedia.voice=null;
    }
            DB.add('ledger', Object.assign({ person:person, name:person, type:type, amount:Number(amount), date:date, time:time, note:note, dueDate:dueDate, paid:false }, _mediaObj));
    showToast(type==='dena' ? '📕 দেনা সংরক্ষিত হয়েছে' : '📗 পাওনা সংরক্ষিত হয়েছে');
    e.target.reset();
    var dateEl = document.getElementById('date'); if(dateEl) dateEl.value = nowDate();
    var timeEl = document.getElementById('time'); if(timeEl) timeEl.value = nowTime();
    loadRecentLedger();
}

function loadRecentLedger() {
    var container = document.getElementById('recentLedgerPreview');
    if (!container) return;
    var ledgers = DB.get('ledger') || [];
    var recent = ledgers.slice(-3).reverse();
    if (recent.length === 0) { container.innerHTML = '<p class="empty-text">কোনো দেনা-পাওনা নেই</p>'; return; }
    var html = '';
    recent.forEach(function(l) {
        var isDena = l.type === 'dena';
        html += '<div class="preview-card ' + (isDena?'dena':'pabona') + '-preview">'
            + '<div class="preview-header">'
            + '<h4>' + (l.person||l.name||'--') + ' <span style="font-size:.72rem;opacity:.7">' + (isDena?'📕 দেনা':'📗 পাওনা') + '</span></h4>'
            + '<span class="preview-amount ' + (isDena?'dena-amount':'pabona-amount') + '">৳ ' + Math.round(parseFloat(l.amount||0)) + '</span>'
            + '</div>'
            + '<div class="preview-meta">'
            + '📅 ' + formatDateDisplay(l.date)
            + (l.note ? '<br>📝 ' + l.note : '')
            + '</div></div>';
    });
    container.innerHTML = html;
}
