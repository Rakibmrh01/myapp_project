// Daily Account - Income Module - Android 9 compatible

document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('incomeForm');
    if (form) form.addEventListener('submit', submitIncome);
    loadRecentIncome();
});

function submitIncome(e) {
    e.preventDefault();
    var source = (document.getElementById('source') ? document.getElementById('source').value : '').trim();
    var amount = document.getElementById('amount') ? document.getElementById('amount').value : '';
    var date   = (document.getElementById('date')   ? document.getElementById('date').value   : '') || nowDate();
    var time   = (document.getElementById('time')   ? document.getElementById('time').value   : '') || nowTime();
    var note   = (document.getElementById('note')   ? document.getElementById('note').value   : '').trim();

    if (!validateRequired(source)) { showAlert('আয়ের উৎস লিখুন'); return; }
    if (!validateAmount(amount))   { showAlert('সঠিক পরিমাণ লিখুন'); return; }

    // media attach
    var _mediaObj = {};
    if (typeof _formMedia!=='undefined') {
        if (_formMedia.photo)   _mediaObj.photo   = _formMedia.photo;
        if (_formMedia.drawing) _mediaObj.drawing = _formMedia.drawing;
        if (_formMedia.voice)   _mediaObj.voice   = _formMedia.voice;
        _formMedia.photo=null; _formMedia.drawing=null; _formMedia.voice=null;
    }
        var _addData = Object.assign({ source:source, amount:Number(amount), date:date, time:time, note:note }, _mediaObj);
    DB.add('income', _addData);
    showToast('✅ আয় সংরক্ষিত হয়েছে');
    e.target.reset();
    var dateEl = document.getElementById('date'); if(dateEl) dateEl.value = nowDate();
    var timeEl = document.getElementById('time'); if(timeEl) timeEl.value = nowTime();
    loadRecentIncome();
}

function loadRecentIncome() {
    var container = document.getElementById('recentIncomePreview');
    if (!container) return;
    var incomes = DB.get('income') || [];
    var recent = incomes.slice(-3).reverse();
    if (recent.length === 0) {
        container.innerHTML = '<p class="empty-text">কোনো আয় নেই</p>';
        return;
    }
    var html = '';
    recent.forEach(function(inc) {
        html += '<div class="preview-card income-preview">'
            + '<div class="preview-header">'
            + '<h4>' + (inc.source || '--') + '</h4>'
            + '<span class="preview-amount">৳ ' + Math.round(parseFloat(inc.amount||0)) + '</span>'
            + '</div>'
            + '<div class="preview-meta">'
            + '📅 ' + formatDateDisplay(inc.date) + ' &nbsp;·&nbsp; ⏰ ' + formatTimeAMPM(inc.time)
            + (inc.note ? '<br>📝 ' + inc.note : '')
            + '</div></div>';
    });
    container.innerHTML = html;
}
