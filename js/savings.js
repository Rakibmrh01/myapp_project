// Daily Account - Savings Module - Android 9 compatible

document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('savingsForm');
    if (form) form.addEventListener('submit', submitSavings);
    loadRecentSavings();
    loadCurrentBalance();
});

function submitSavings(e) {
    e.preventDefault();
    var method   = (document.getElementById('method')   ? document.getElementById('method').value   : 'cash');
    var bankName = (document.getElementById('bankName') ? document.getElementById('bankName').value : '').trim();
    var amount   = document.getElementById('amount') ? document.getElementById('amount').value : '';
    var date     = (document.getElementById('date')  ? document.getElementById('date').value   : '') || nowDate();
    var time     = (document.getElementById('time')  ? document.getElementById('time').value   : '') || nowTime();
    var note     = (document.getElementById('note')  ? document.getElementById('note').value   : '').trim();

    if (!validateAmount(amount)) { showAlert('সঠিক পরিমাণ লিখুন'); return; }

    // media attach
    var _mediaObj = {};
    if (typeof _formMedia!=='undefined') {
        if (_formMedia.photo)   _mediaObj.photo   = _formMedia.photo;
        if (_formMedia.drawing) _mediaObj.drawing = _formMedia.drawing;
        if (_formMedia.voice)   _mediaObj.voice   = _formMedia.voice;
        _formMedia.photo=null; _formMedia.drawing=null; _formMedia.voice=null;
    }
    DB.add('savings', Object.assign({method:method, bankName:bankName, source:'direct', amount:Number(amount), date:date, time:time, note:note}, _mediaObj));
    showToast('✅ সঞ্চয় সংরক্ষিত হয়েছে');
    e.target.reset();
    var dateEl = document.getElementById('date'); if(dateEl) dateEl.value = nowDate();
    var timeEl = document.getElementById('time'); if(timeEl) timeEl.value = nowTime();
    loadRecentSavings();
    loadCurrentBalance();
}

function loadRecentSavings() {
    var container = document.getElementById('recentSavingsPreview');
    if (!container) return;
    var savings = DB.get('savings') || [];
    var recent = savings.slice(-3).reverse();
    if (recent.length === 0) { container.innerHTML = '<p class="empty-text">কোনো সঞ্চয় নেই</p>'; return; }
    var html = '';
    recent.forEach(function(s) {
        html += '<div class="preview-card savings-preview">'
            + '<div class="preview-header">'
            + '<h4>' + (s.method||'সঞ্চয়') + (s.bankName?' — '+s.bankName:'') + '</h4>'
            + '<span class="preview-amount savings-amount">৳ ' + Math.round(parseFloat(s.amount||0)) + '</span>'
            + '</div>'
            + '<div class="preview-meta">'
            + '📅 ' + formatDateDisplay(s.date)
            + (s.note ? '<br>📝 ' + s.note : '')
            + '</div></div>';
    });
    container.innerHTML = html;
}
