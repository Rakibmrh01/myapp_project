// Daily Account - Expense Module - Android 9 compatible

document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('expenseForm');
    if (form) form.addEventListener('submit', submitExpense);
    loadRecentExpense();
});

function submitExpense(e) {
    e.preventDefault();
    var category = (document.getElementById('category') ? document.getElementById('category').value : '').trim();
    var source   = (document.getElementById('source')   ? document.getElementById('source').value   : '').trim();
    var amount   = document.getElementById('amount') ? document.getElementById('amount').value : '';
    var date     = (document.getElementById('date')  ? document.getElementById('date').value  : '') || nowDate();
    var time     = (document.getElementById('time')  ? document.getElementById('time').value  : '') || nowTime();
    var note     = (document.getElementById('note')  ? document.getElementById('note').value  : '').trim();

    var cat = category || source;
    if (!validateRequired(cat))  { showAlert('ব্যয়ের ধরন লিখুন'); return; }
    if (!validateAmount(amount)) { showAlert('সঠিক পরিমাণ লিখুন'); return; }

    // media attach
    var _mediaObj = {};
    if (typeof _formMedia!=='undefined') {
        if (_formMedia.photo)   _mediaObj.photo   = _formMedia.photo;
        if (_formMedia.drawing) _mediaObj.drawing = _formMedia.drawing;
        if (_formMedia.voice)   _mediaObj.voice   = _formMedia.voice;
        _formMedia.photo=null; _formMedia.drawing=null; _formMedia.voice=null;
    }
    DB.add('expense', Object.assign({category:cat, source:source||cat, amount:Number(amount), date:date, time:time, note:note}, _mediaObj));
    showToast('✅ ব্যয় সংরক্ষিত হয়েছে');
    e.target.reset();
    var dateEl = document.getElementById('date'); if(dateEl) dateEl.value = nowDate();
    var timeEl = document.getElementById('time'); if(timeEl) timeEl.value = nowTime();
    loadRecentExpense();
    checkBudgetWarning(Number(amount));
}

function loadRecentExpense() {
    var container = document.getElementById('recentExpensePreview');
    if (!container) return;
    var expenses = DB.get('expense') || [];
    var recent = expenses.slice(-3).reverse();
    if (recent.length === 0) { container.innerHTML = '<p class="empty-text">কোনো ব্যয় নেই</p>'; return; }
    var html = '';
    recent.forEach(function(exp) {
        html += '<div class="preview-card expense-preview">'
            + '<div class="preview-header">'
            + '<h4>' + (exp.category||exp.source||'--') + '</h4>'
            + '<span class="preview-amount expense-amount">৳ ' + Math.round(parseFloat(exp.amount||0)) + '</span>'
            + '</div>'
            + '<div class="preview-meta">'
            + '📅 ' + formatDateDisplay(exp.date) + ' &nbsp;·&nbsp; ⏰ ' + formatTimeAMPM(exp.time)
            + (exp.note ? '<br>📝 ' + exp.note : '')
            + '</div></div>';
    });
    container.innerHTML = html;
}
