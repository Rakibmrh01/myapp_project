// ================================================================
//  Daily Account — trash-manager.js  v3.1
//  Premium — 30-day auto-expire, restore/delete by section
// ================================================================

let _trashItems = [];
let _filterKey  = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadTrash();
});

function loadTrash() {
    _trashItems = DB.getTrash();
    renderTrash();
    updateCount();
}

function updateCount() {
    const el = document.getElementById('trashCount');
    if (el) el.textContent = _trashItems.length + ' টি';
}

function setFilter(key) {
    _filterKey = key;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter===key));
    renderTrash();
}

function renderTrash() {
    const container = document.getElementById('trashList');
    if (!container) return;

    const filtered = _filterKey==='all'
        ? _trashItems
        : _trashItems.filter(i => i._trashKey === _filterKey);

    if (filtered.length===0) {
        container.innerHTML = `
          <div style="text-align:center;padding:60px 24px;color:rgba(255,255,255,.4)">
            <div style="font-size:3rem;margin-bottom:12px">🗑️</div>
            <p style="font-size:1rem;font-weight:700">ট্র্যাশ খালি</p>
            <p style="font-size:.8rem;margin-top:6px">মুছে ফেলা আইটেম এখানে দেখাবে</p>
          </div>`;
        return;
    }

    container.innerHTML = filtered.map(item => {
        const key    = item._trashKey;
        const colors = {income:'#10b981',expense:'#ef4444',ledger:'#f59e0b',savings:'#a855f7'};
        const icons  = {income:'💰',expense:'💸',ledger:'📋',savings:'🏦'};
        const labels = {income:'আয়',expense:'ব্যয়',ledger:'লেনদেন',savings:'সঞ্চয়'};
        const color  = colors[key]||'#667eea';
        const title  = item.source||item.category||item.person||item.name||item.method||'--';
        const daysLeft = Math.ceil((new Date(item._trashedAt).getTime()+(30*24*60*60*1000)-Date.now())/(24*60*60*1000));

        return `
          <div class="trash-card" style="background:rgba(255,255,255,.05);border:1px solid ${color}33;border-left:4px solid ${color};border-radius:14px;padding:14px;margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:1.2rem">${icons[key]||'📄'}</span>
                <div>
                  <div style="color:white;font-weight:800;font-size:.95rem">${title}</div>
                  <div style="color:${color};font-size:.8rem;font-weight:700">${labels[key]||key} · ৳${Math.round(item.amount||0)}</div>
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="color:#9ca3af;font-size:.72rem">${formatDateDisplay(item.date||item._trashedAt)}</div>
                <div style="color:${daysLeft<=3?'#ef4444':'#f59e0b'};font-size:.68rem;font-weight:700">${daysLeft}d বাকি</div>
              </div>
            </div>
            ${item.note ? `<div style="color:#9ca3af;font-size:.75rem;margin-bottom:8px">📝 ${item.note}</div>` : ''}
            <div style="display:flex;gap:8px">
              <button onclick="restoreItem('${item._trashId}')"
                style="flex:1;padding:9px;background:${color}22;color:${color};border:1px solid ${color}44;border-radius:10px;font-size:.82rem;font-weight:800;cursor:pointer">
                ↩ পুনরুদ্ধার
              </button>
              <button onclick="permanentDelete('${item._trashId}')"
                style="flex:1;padding:9px;background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.3);border-radius:10px;font-size:.82rem;font-weight:800;cursor:pointer">
                🗑️ চিরতরে মুছুন
              </button>
            </div>
          </div>`;
    }).join('');
}

function restoreItem(trashId) {
    if (!confirm('✅ এই আইটেমটি পুনরুদ্ধার করবেন?')) return;
    const key = DB.restoreFromTrash(trashId);
    if (key) {
        showToast(`✅ ${key==='income'?'আয়':key==='expense'?'ব্যয়':key==='savings'?'সঞ্চয়':'লেনদেন'} পুনরুদ্ধার হয়েছে`);
        loadTrash();
    }
}

function permanentDelete(trashId) {
    if (!confirm('স্থায়ীভাবে মুছবেন?')) return;
    if (!confirm('⚠️ চিরতরে মুছে ফেলবেন? পুনরুদ্ধার করা যাবে না।')) return;
    DB.permanentDelete(trashId);
    showToast('🗑️ চিরতরে মুছে গেছে');
    loadTrash();
}

function restoreAll() {
    const filtered = _filterKey==='all'
        ? [..._trashItems]
        : _trashItems.filter(i=>i._trashKey===_filterKey);
    if (filtered.length===0) { showToast('ট্র্যাশ খালি'); return; }
    filtered.forEach(item => DB.restoreFromTrash(item._trashId));
    showToast(`✅ ${filtered.length}টি আইটেম পুনরুদ্ধার হয়েছে`);
    loadTrash();
}

function emptyAll() {
    if (_trashItems.length===0) { showToast('ট্র্যাশ আগে থেকেই খালি'); return; }
    if (!confirm('⚠️ সব ট্র্যাশ চিরতরে মুছে ফেলবেন?')) return;
    DB.emptyTrash();
    showToast('🗑️ ট্র্যাশ খালি করা হয়েছে');
    loadTrash();
}

function _showPremWall() {
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#0d0b1e,#1a1040);padding:24px">
        <div style="background:rgba(255,255,255,.05);border-radius:22px;padding:32px 24px;max-width:300px;width:100%;border:2px solid rgba(168,85,247,.4);text-align:center;box-shadow:0 30px 80px rgba(168,85,247,.25)">
          <div style="font-size:3rem;margin-bottom:14px">🔒</div>
          <h2 style="color:#c084fc;font-size:1.1rem;font-weight:900;margin-bottom:8px">Premium প্রয়োজন</h2>
          <p style="color:#9ca3af;font-size:.85rem;margin-bottom:20px">Trash Manager একটি Premium ফিচার</p>
          <button onclick="history.back()"
            style="width:100%;padding:14px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:white;border:none;border-radius:14px;font-size:.95rem;font-weight:900;cursor:pointer">
            ← ফিরে যান
          </button>
        </div>
      </div>
      <script src="../js/db.js"></script>`;
}

