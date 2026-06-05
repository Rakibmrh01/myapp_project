// Daily Account — notes.js v4.0
// Google Keep style — text, photo, drawing, voice, tags, search, relation

var allNotes = [];
var filteredNotes = [];
var currentNoteId = null;
var currentDrawing = null;
var mediaRecorder = null;
var audioChunks = [];
var isRecording = false;
var drawingHistory = [];
var drawingStep = -1;
var currentColor = '#1f2937';
var currentSize = 3;

document.addEventListener('DOMContentLoaded', function() {
    loadNotes();
    renderNotes();
    setupSearch();
    setupTagFilter();
});

function loadNotes() {
    allNotes = DB.get('notes') || [];
    filteredNotes = allNotes.slice().reverse();
}

function setupSearch() {
    var inp = document.getElementById('noteSearch');
    if (inp) inp.addEventListener('input', function() { filterNotes(this.value); });
}

function filterNotes(q) {
    q = (q||'').toLowerCase().trim();
    if (!q) { filteredNotes = allNotes.slice().reverse(); }
    else {
        filteredNotes = allNotes.filter(function(n){
            return (n.text||'').toLowerCase().includes(q)
                || (n.title||'').toLowerCase().includes(q)
                || (n.tag||'').toLowerCase().includes(q);
        }).reverse();
    }
    renderNotes();
}

function setupTagFilter() {
    document.querySelectorAll('.tag-filter-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
            document.querySelectorAll('.tag-filter-btn').forEach(function(b){ b.classList.remove('active'); });
            this.classList.add('active');
            var tag = this.dataset.tag;
            if (tag === 'all') { filteredNotes = allNotes.slice().reverse(); }
            else { filteredNotes = allNotes.filter(function(n){ return n.tag===tag; }).reverse(); }
            renderNotes();
        });
    });
}

/* ── RENDER ── */
function renderNotes() {
    var container = document.getElementById('notesList');
    if (!container) return;
    if (filteredNotes.length === 0) {
        container.innerHTML = '<div class="notes-empty"><span>📝</span><p>কোনো নোট নেই</p></div>';
        return;
    }
    var html = '';
    filteredNotes.forEach(function(note) {
        var tagColors = {income:'#10b981',expense:'#ef4444',dena:'#f59e0b',pabona:'#3b82f6',general:'#8b5cf6'};
        var tagLabels = {income:'💰 আয়',expense:'💸 ব্যয়',dena:'📕 দেনা',pabona:'📗 পাওনা',general:'🗒️ সাধারণ'};
        var tc = tagColors[note.tag||'general'] || '#8b5cf6';
        var tl = tagLabels[note.tag||'general'] || '🗒️ সাধারণ';
        var bgColor = note.color || '#ffffff';

        var mediaHtml = '';
        if (note.photo) {
            mediaHtml += '<img src="'+note.photo+'" class="note-thumb" onclick="_viewPhoto(\''+note.id+'\')" />';
        }
        if (note.drawing) {
            mediaHtml += '<img src="'+note.drawing+'" class="note-thumb note-drawing-thumb" onclick="_viewNoteDrawing(\''+note.id+'\')" />';
        }
        if (note.voice) {
            mediaHtml += '<div class="note-voice-chip" onclick="_playVoice(\''+note.id+'\')">'
                +'<span>🎙️</span><span>ভয়েস</span></div>';
        }

        var relationHtml = '';
        if (note.relation) {
            var ricons = {income:'💰',expense:'💸',ledger:'📒',savings:'🏦'};
            relationHtml = '<div class="note-relation-chip">'
                +(ricons[note.relation.store]||'🔗')+' '+(note.relation.label||'সম্পর্ক')
                +'</div>';
        }

        html += '<div class="note-card" style="background:'+bgColor+';border-top:3px solid '+tc+'" onclick="openViewNote(\''+note.id+'\')">'
            + (note.title ? '<div class="note-card-title">'+escHtml(note.title)+'</div>' : '')
            + '<div class="note-card-text">'+(escHtml(note.text||'').replace(/\n/g,'<br>'))+'</div>'
            + (mediaHtml ? '<div class="note-media-row">'+mediaHtml+'</div>' : '')
            + '<div class="note-card-footer">'
            + '<span class="note-tag-chip" style="background:'+tc+'22;color:'+tc+';border:1px solid '+tc+'44">'+tl+'</span>'
            + relationHtml
            + '<span class="note-date">'+formatDateDisplay(note.createdAt ? note.createdAt.slice(0,10) : '')+'</span>'
            + '</div>'
            + '</div>';
    });
    container.innerHTML = html;
    // double tap to zoom
    var lastTap = 0;
    document.querySelectorAll('.note-card').forEach(function(card) {
        card.addEventListener('touchend', function(e) {
            var now = Date.now();
            if (now - lastTap < 300) {
                e.preventDefault();
                if (card.classList.contains('zoomed')) {
                    card.classList.remove('zoomed');
                    document.body.style.overflow = '';
                } else {
                    card.classList.add('zoomed');
                    document.body.style.overflow = 'hidden';
                    card.scrollTop = 0;
                }
            }
            lastTap = now;
        }, {passive:false});
    });
}

function escHtml(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── NEW NOTE MODAL ── */
function openNewNote() {
    currentNoteId = null;
    currentDrawing = null;
    _buildNoteModal({});
}

function openEditNote(id) {
    var note = allNotes.find(function(n){ return n.id===id; });
    if (!note) return;
    currentNoteId = id;
    currentDrawing = note.drawing || null;
    _buildNoteModal(note);
}

function _buildNoteModal(note) {
    var ex = document.getElementById('__noteModal'); if(ex) ex.remove();
    var tagColors = {income:'#10b981',expense:'#ef4444',dena:'#f59e0b',pabona:'#3b82f6',general:'#8b5cf6'};
    var colors = ['#ffffff','#fef3c7','#dcfce7','#dbeafe','#fce7f3','#faf5ff','#fee2e2','#e0f2fe'];

    var colorBtns = colors.map(function(c){
        return '<button onclick="_setNoteColor(\''+c+'\')" style="width:26px;height:26px;border-radius:50%;background:'+c+';border:2px solid '+(note.color===c?'#374151':'#e5e7eb')+';cursor:pointer" id="__nc_'+c.replace('#','')+'"></button>';
    }).join('');

    var tagBtns = [
        ['general','🗒️ সাধারণ'],['income','💰 আয়'],['expense','💸 ব্যয়'],
        ['dena','📕 দেনা'],['pabona','📗 পাওনা']
    ].map(function(t){
        var active = (note.tag||'general')===t[0] ? 'border:2px solid '+tagColors[t[0]] : 'border:1px solid #e5e7eb';
        return '<button class="note-tag-modal-btn" data-tag="'+t[0]+'" onclick="_setNoteTag(\''+t[0]+'\')" style="'+active+'">'+t[1]+'</button>';
    }).join('');

    var drawingPreview = (note.drawing||currentDrawing)
        ? '<img src="'+(note.drawing||currentDrawing)+'" style="width:100%;max-height:120px;object-fit:contain;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:8px;cursor:pointer" onclick="openDrawingPad(true)" />'
        : '';

    var photoPreview = note.photo
        ? '<img src="'+note.photo+'" style="width:100%;max-height:140px;object-fit:cover;border-radius:10px;margin-bottom:8px;cursor:pointer" onclick="_viewFullPhoto(\''+note.id+'\')" />'
        : '';

    var voicePreview = note.voice
        ? '<div style="background:#f1f5f9;border-radius:10px;padding:10px;display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer" onclick="_playVoiceById()">'
        + '<span style="font-size:1.3rem">🎙️</span>'
        + '<span style="font-size:.85rem;font-weight:700;color:#374151">ভয়েস নোট</span>'
        + '<button onclick="event.stopPropagation();_deleteVoice()" style="margin-left:auto;background:none;border:none;color:#ef4444;cursor:pointer;font-size:.8rem">✕</button>'
        + '</div>'
        : '';

    var relHtml = note.relation
        ? '<div style="background:#eff6ff;border-radius:10px;padding:10px;display:flex;align-items:center;gap:8px;margin-bottom:8px">'
        + '<span>🔗</span><span style="font-size:.85rem;font-weight:700;color:#1d4ed8">'+(note.relation.label||'সম্পর্ক')+'</span>'
        + '<button onclick="event.stopPropagation();_removeRelation()" style="margin-left:auto;background:none;border:none;color:#ef4444;cursor:pointer;font-size:.8rem">✕</button>'
        + '</div>'
        : '';

    var modal = document.createElement('div');
    modal.id = '__noteModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center';

    modal.innerHTML = '<div id="__noteSheet" style="background:'+(note.color||'#ffffff')+';border-radius:24px 24px 0 0;padding:0;width:100%;max-height:95vh;overflow-y:auto;box-shadow:0 -8px 40px rgba(0,0,0,.2)">'
        // Handle bar
        +'<div style="width:40px;height:4px;background:rgba(0,0,0,.1);border-radius:4px;margin:12px auto 0"></div>'
        // Top actions
        +'<div style="display:flex;align-items:center;gap:8px;padding:10px 16px">'
        +'<button onclick="saveNote()" style="flex:1;padding:10px;background:#374151;color:white;border:none;border-radius:12px;font-size:.88rem;font-weight:900;cursor:pointer;font-family:inherit">✅ সংরক্ষণ</button>'
        +(currentNoteId ? '<button onclick="deleteNote()" style="padding:10px 14px;background:#fef2f2;color:#ef4444;border:1px solid #fecaca;border-radius:12px;font-size:.88rem;font-weight:800;cursor:pointer;font-family:inherit">🗑️</button>' : '')
        +'<button onclick="document.getElementById(\'__noteModal\').remove()" style="padding:10px 14px;background:#f3f4f6;color:#6b7280;border:none;border-radius:12px;font-size:.88rem;font-weight:800;cursor:pointer;font-family:inherit">✕</button>'
        +'</div>'
        // Content area
        +'<div style="padding:0 16px 8px">'
        + photoPreview + voicePreview + drawingPreview + relHtml
        +'<input type="text" id="__noteTitle" placeholder="শিরোনাম (ঐচ্ছিক)" value="'+(note.title||'')+'" style="width:100%;padding:10px 0;border:none;border-bottom:1px solid #e5e7eb;font-size:1rem;font-weight:800;color:#1f2937;background:transparent;outline:none;margin-bottom:8px;font-family:inherit" />'
        +'<textarea id="__noteText" placeholder="নোট লিখুন..." style="width:100%;min-height:120px;border:none;font-size:.92rem;color:#374151;background:transparent;outline:none;resize:none;font-family:inherit;line-height:1.7">'+escHtml(note.text||'')+'</textarea>'
        +'</div>'
        // Color picker
        +'<div style="padding:8px 16px;border-top:1px solid rgba(0,0,0,.06)">'
        +'<div style="font-size:.7rem;font-weight:700;color:#9ca3af;margin-bottom:6px">রঙ বেছে নিন</div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap">'+colorBtns+'</div>'
        +'</div>'
        // Tag selector
        +'<div style="padding:8px 16px;border-top:1px solid rgba(0,0,0,.06)">'
        +'<div style="font-size:.7rem;font-weight:700;color:#9ca3af;margin-bottom:6px">ট্যাগ</div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap" id="__tagRow">'+tagBtns+'</div>'
        +'</div>'
        // Action buttons
        +'<div style="display:flex;gap:8px;padding:10px 16px;border-top:1px solid rgba(0,0,0,.06);overflow-x:auto">'
        +'<button onclick="_addPhotoToNote()" style="flex-shrink:0;padding:9px 14px;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:11px;font-size:.82rem;font-weight:800;cursor:pointer;font-family:inherit">📷 ফটো</button>'
        +'<button onclick="openDrawingPad(false)" style="flex-shrink:0;padding:9px 14px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:11px;font-size:.82rem;font-weight:800;cursor:pointer;font-family:inherit">✏️ হাতের লেখা</button>'
        +'<button onclick="_startVoice()" style="flex-shrink:0;padding:9px 14px;background:#faf5ff;color:#7c3aed;border:1px solid #e9d5ff;border-radius:11px;font-size:.82rem;font-weight:800;cursor:pointer;font-family:inherit" id="__voiceBtn">🎙️ ভয়েস</button>'
        +'<button onclick="_addRelationToNote()" style="flex-shrink:0;padding:9px 14px;background:#eff6ff;color:#0369a1;border:1px solid #bae6fd;border-radius:11px;font-size:.82rem;font-weight:800;cursor:pointer;font-family:inherit">🔗 সম্পর্ক</button>'
        +'</div>'
        +'<div style="height:20px"></div>'
        +'</div>';

    document.body.appendChild(modal);

    // animate up
    var sheet = document.getElementById('__noteSheet');
    sheet.style.transform = 'translateY(100%)';
    sheet.style.transition = 'transform .3s cubic-bezier(.34,1.1,.64,1)';
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ sheet.style.transform='translateY(0)'; }); });

    modal.onclick = function(e){ if(e.target===modal) modal.remove(); };
}

function _setNoteColor(color) {
    var sheet = document.getElementById('__noteSheet');
    if (sheet) sheet.style.background = color;
    // update border
    document.querySelectorAll('[id^="__nc_"]').forEach(function(b){
        b.style.border = '1px solid #e5e7eb';
    });
    var btn = document.getElementById('__nc_'+color.replace('#',''));
    if (btn) btn.style.border = '2px solid #374151';
    window.__currentNoteColor = color;
}

function _setNoteTag(tag) {
    var tagColors = {income:'#10b981',expense:'#ef4444',dena:'#f59e0b',pabona:'#3b82f6',general:'#8b5cf6'};
    document.querySelectorAll('.note-tag-modal-btn').forEach(function(b){
        b.style.border = '1px solid #e5e7eb';
    });
    document.querySelectorAll('[data-tag="'+tag+'"]').forEach(function(b){
        b.style.border = '2px solid '+(tagColors[tag]||'#8b5cf6');
    });
    window.__currentNoteTag = tag;
}

/* ── SAVE / DELETE ── */
function saveNote() {
    var title = document.getElementById('__noteTitle') ? document.getElementById('__noteTitle').value.trim() : '';
    var text  = document.getElementById('__noteText')  ? document.getElementById('__noteText').value.trim()  : '';
    if (!title && !text && !currentDrawing && !window.__currentNotePhoto) {
        showToast('❌ কিছু লিখুন'); return;
    }

    var noteData = {
        title:   title,
        text:    text,
        tag:     window.__currentNoteTag || 'general',
        color:   window.__currentNoteColor || '#ffffff',
        drawing: currentDrawing || null,
        photo:   window.__currentNotePhoto || null,
        voice:   window.__currentNoteVoice || null,
        relation:window.__currentNoteRelation || null,
    };

    if (currentNoteId) {
        // Edit
        var all = DB.get('notes') || [];
        var idx = all.findIndex(function(n){ return n.id===currentNoteId; });
        if (idx > -1) {
            noteData.id = currentNoteId;
            noteData.createdAt = all[idx].createdAt;
            noteData.updatedAt = new Date().toISOString();
            all[idx] = noteData;
            DB.set('notes', all);
        }
        showToast('✅ নোট আপডেট হয়েছে');
    } else {
        DB.add('notes', noteData);
        showToast('✅ নোট সংরক্ষিত হয়েছে');
    }

    // cleanup
    window.__currentNoteColor = null;
    window.__currentNoteTag = null;
    window.__currentNotePhoto = null;
    window.__currentNoteVoice = null;
    window.__currentNoteRelation = null;
    currentDrawing = null;

    var modal = document.getElementById('__noteModal'); if(modal) modal.remove();
    loadNotes(); renderNotes();
}

function deleteNote() {
    if (!currentNoteId) return;
    _confirm({title:'নোট মুছবেন?',msg:'ট্র্যাশে যাবে',icon:'🗑️',type:'danger',yesText:'🗑️ মুছুন'}, function(){
        var all = DB.get('notes') || [];
        var idx = all.findIndex(function(n){ return n.id===currentNoteId; });
        if (idx > -1) { addToTrash('notes', all[idx]); all.splice(idx,1); DB.set('notes',all); }
        var modal = document.getElementById('__noteModal'); if(modal) modal.remove();
        loadNotes(); renderNotes();
        showToast('🗑️ নোট মুছে গেছে');
    });
}

/* ── PHOTO ── */
function _addPhotoToNote() {
    var inp = document.createElement('input');
    inp.type='file'; inp.accept='image/*';
    inp.onchange = function() {
        var file = inp.files[0]; if(!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            window.__currentNotePhoto = e.target.result;
            showToast('✅ ফটো যোগ হয়েছে');
            // Refresh modal
            var id = currentNoteId;
            var modal = document.getElementById('__noteModal'); if(modal) modal.remove();
            var note = id ? (DB.get('notes')||[]).find(function(n){return n.id===id;}) : {};
            note = note || {};
            note.photo = e.target.result;
            _buildNoteModal(note);
        };
        reader.readAsDataURL(file);
    };
    inp.click();
}

function _viewFullPhoto(id) {
    var all = DB.get('notes')||[];
    var note = all.find(function(n){ return n.id===id; });
    if (note && note.photo) {
        if (typeof _viewPhoto==='function') _viewPhoto(note.photo);
    }
}

function _viewPhoto(src) {
    var ex = document.getElementById('__photoFull'); if(ex) ex.remove();
    var d = document.createElement('div');
    d.id='__photoFull';
    d.style.cssText='position:fixed;inset:0;z-index:9999999;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:16px';
    var img = document.createElement('img');
    img.src=src; img.style.cssText='max-width:100%;max-height:88vh;border-radius:12px';
    d.appendChild(img);
    d.onclick=function(){d.remove();};
    document.body.appendChild(d);
}

function _viewNoteDrawing(id) {
    var all = DB.get('notes')||[];
    var note = all.find(function(n){ return n.id===id; });
    if (note && note.drawing) _viewPhoto(note.drawing);
}

/* ── VOICE ── */
function _startVoice() {
    if (isRecording) {
        _stopVoice(); return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('❌ এই ডিভাইসে ভয়েস সাপোর্ট নেই'); return;
    }
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = function(e){ audioChunks.push(e.data); };
        mediaRecorder.onstop = function(){
            var blob = new Blob(audioChunks, {type:'audio/webm'});
            var reader = new FileReader();
            reader.onload = function(e){ window.__currentNoteVoice = e.target.result; showToast('✅ ভয়েস রেকর্ড হয়েছে'); };
            reader.readAsDataURL(blob);
            stream.getTracks().forEach(function(t){t.stop();});
        };
        mediaRecorder.start();
        isRecording = true;
        var btn = document.getElementById('__voiceBtn');
        if (btn) { btn.textContent='⏹️ থামান'; btn.style.background='#fee2e2'; btn.style.color='#dc2626'; }
        showToast('🎙️ রেকর্ডিং শুরু...');
    }).catch(function(){ showToast('❌ মাইক্রোফোন অ্যাক্সেস নেই'); });
}

function _stopVoice() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        var btn = document.getElementById('__voiceBtn');
        if (btn) { btn.textContent='🎙️ ভয়েস'; btn.style.background='#faf5ff'; btn.style.color='#7c3aed'; }
    }
}

function _playVoice(id) {
    var all = DB.get('notes')||[];
    var note = all.find(function(n){ return n.id===id; });
    if (note && note.voice) { var a=new Audio(note.voice); a.play(); }
}

function _playVoiceById() {
    if (window.__currentNoteVoice) { var a=new Audio(window.__currentNoteVoice); a.play(); }
}

function _deleteVoice() {
    window.__currentNoteVoice = null;
    showToast('🗑️ ভয়েস মুছে গেছে');
}

/* ── DRAWING PAD ── */
function openDrawingPad(isEdit) {
    var ex = document.getElementById('__drawPad'); if(ex) ex.remove();
    drawingHistory = []; drawingStep = -1;

    var pad = document.createElement('div');
    pad.id = '__drawPad';
    pad.style.cssText = 'position:fixed;inset:0;z-index:9999999;background:white;display:flex;flex-direction:column';

    var colors = ['#1f2937','#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#000000'];
    var colorBtns = colors.map(function(c){
        return '<button onclick="_setDrawColor(\''+c+'\')" style="width:28px;height:28px;border-radius:50%;background:'+c+';border:2px solid '+(currentColor===c?'white':'transparent')+';cursor:pointer;flex-shrink:0" id="__dc_'+c.replace('#','')+'" ></button>';
    }).join('');

    pad.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #e5e7eb;background:white;position:sticky;top:0;z-index:10">'
        +'<button onclick="_undoDraw()" style="padding:8px 12px;background:#f3f4f6;border:none;border-radius:9px;font-size:.82rem;font-weight:800;cursor:pointer">↩ Undo</button>'
        +'<button onclick="_redoDraw()" style="padding:8px 12px;background:#f3f4f6;border:none;border-radius:9px;font-size:.82rem;font-weight:800;cursor:pointer">↪ Redo</button>'
        +'<button onclick="_clearDraw()" style="padding:8px 12px;background:#fef2f2;color:#ef4444;border:1px solid #fecaca;border-radius:9px;font-size:.82rem;font-weight:800;cursor:pointer">🗑️ মুছুন</button>'
        +'<div style="flex:1"></div>'
        +'<button onclick="_saveDrawingAndClose()" style="padding:8px 16px;background:#374151;color:white;border:none;border-radius:10px;font-size:.85rem;font-weight:900;cursor:pointer">✅ ঠিক আছে</button>'
        +'<button onclick="document.getElementById(\'__drawPad\').remove()" style="padding:8px 12px;background:#f3f4f6;border:none;border-radius:9px;font-size:.82rem;cursor:pointer">✕</button>'
        +'</div>'
        +'<div style="display:flex;align-items:center;gap:6px;padding:8px 14px;border-bottom:1px solid #f1f5f9;background:white;overflow-x:auto">'
        +colorBtns
        +'<div style="width:1px;height:24px;background:#e5e7eb;flex-shrink:0;margin:0 4px"></div>'
        +'<input type="range" min="1" max="20" value="3" oninput="_setDrawSize(this.value)" style="width:80px;accent-color:#374151">'
        +'<span id="__sizeLabel" style="font-size:.75rem;font-weight:700;color:#6b7280;width:24px">3px</span>'
        +'<div style="flex:1"></div>'
        +'<button onclick="_toggleEraser()" id="__eraserBtn" style="padding:6px 12px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;font-size:.78rem;font-weight:800;cursor:pointer">⬜ ইরেজার</button>'
        +'</div>'
        +'<canvas id="__drawCanvas" style="flex:1;touch-action:none;cursor:crosshair;background:white"></canvas>';

    document.body.appendChild(pad);

    var canvas = document.getElementById('__drawCanvas');
    var dpr = window.devicePixelRatio || 1;
    var cw = window.innerWidth;
    var ch = window.innerHeight - 112;
    canvas.width  = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width  = cw + 'px';
    canvas.style.height = ch + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var ctx = canvas.getContext('2d');
    if (isEdit && currentDrawing) {
        var img = new Image();
        img.onload = function(){ ctx.drawImage(img,0,0); _saveHistory(); };
        img.src = currentDrawing;
    } else { _saveHistory(); }

    var drawing = false;
    var isEraser = false;
    var lastX=0, lastY=0;

    function getPos(e) {
        var rect = canvas.getBoundingClientRect();
        var dpr2 = window.devicePixelRatio || 1;
        var src = e.touches ? e.touches[0] : e;
        return [
            (src.clientX - rect.left) * (canvas.width / rect.width / dpr2),
            (src.clientY - rect.top)  * (canvas.height / rect.height / dpr2)
        ];
    }

    function startDraw(e) {
        e.preventDefault();
        drawing = true;
        var pos = getPos(e); lastX=pos[0]; lastY=pos[1];
        ctx.beginPath(); ctx.moveTo(lastX,lastY);
    }

    function draw(e) {
        e.preventDefault();
        if (!drawing) return;
        var pos = getPos(e);
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
        ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : currentColor;
        ctx.lineWidth = isEraser ? currentSize*3 : currentSize;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(pos[0],pos[1]); ctx.stroke();
        lastX=pos[0]; lastY=pos[1];
    }

    function endDraw(e) {
        if (!drawing) return;
        drawing = false;
        _saveHistory();
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('touchstart', startDraw, {passive:false});
    canvas.addEventListener('touchmove', draw, {passive:false});
    canvas.addEventListener('touchend', endDraw);

    window._toggleEraser = function(){
        isEraser = !isEraser;
        var btn = document.getElementById('__eraserBtn');
        if (btn) {
            btn.style.background = isEraser ? '#374151' : '#f3f4f6';
            btn.style.color = isEraser ? 'white' : '';
            btn.textContent = isEraser ? '✏️ কলম' : '⬜ ইরেজার';
        }
    };
}

function _saveHistory() {
    var canvas = document.getElementById('__drawCanvas');
    if (!canvas) return;
    drawingStep++;
    drawingHistory = drawingHistory.slice(0, drawingStep);
    drawingHistory.push(canvas.toDataURL());
}

function _undoDraw() {
    if (drawingStep <= 0) return;
    drawingStep--;
    var canvas = document.getElementById('__drawCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.onload = function(){ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
    img.src = drawingHistory[drawingStep];
}

function _redoDraw() {
    if (drawingStep >= drawingHistory.length-1) return;
    drawingStep++;
    var canvas = document.getElementById('__drawCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.onload = function(){ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
    img.src = drawingHistory[drawingStep];
}

function _clearDraw() {
    var canvas = document.getElementById('__drawCanvas');
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
    _saveHistory();
}

function _setDrawColor(c) {
    currentColor = c;
    document.querySelectorAll('[id^="__dc_"]').forEach(function(b){ b.style.border='2px solid transparent'; });
    var btn = document.getElementById('__dc_'+c.replace('#',''));
    if (btn) btn.style.border = '2px solid white';
}

function _setDrawSize(v) {
    currentSize = parseInt(v);
    var lbl = document.getElementById('__sizeLabel');
    if (lbl) lbl.textContent = v+'px';
}

function _saveDrawingAndClose() {
    var canvas = document.getElementById('__drawCanvas');
    if (!canvas) return;
    currentDrawing = canvas.toDataURL('image/png');
    var pad = document.getElementById('__drawPad'); if(pad) pad.remove();
    showToast('✅ হাতের লেখা সংরক্ষিত');
    // Refresh note modal
    var id = currentNoteId;
    var noteModal = document.getElementById('__noteModal');
    if (noteModal) {
        noteModal.remove();
        var note = id ? (DB.get('notes')||[]).find(function(n){return n.id===id;}) : {};
        note = note || {};
        note.drawing = currentDrawing;
        _buildNoteModal(note);
    }
}

/* ── RELATION ── */
function _addRelationToNote() {
    if (typeof _openRelationSelector === 'function') {
        _openRelationSelector('notes', -1, {}, 'notes');
    } else {
        showToast('💡 সম্পর্ক যোগ করতে লেনদেন পেজ ব্যবহার করুন');
    }
}

function _removeRelation() {
    window.__currentNoteRelation = null;
    showToast('🔗 সম্পর্ক সরানো হয়েছে');
}

/* ══ NOTE VIEW MODAL ══ */
function openViewNote(id) {
    var note = allNotes.find(function(n){ return n.id===id; });
    if (!note) return;

    var ex = document.getElementById('__noteView'); if(ex) ex.remove();

    var tagColors = {income:'#10b981',expense:'#ef4444',dena:'#f59e0b',pabona:'#3b82f6',general:'#8b5cf6'};
    var tagLabels = {income:'💰 আয়',expense:'💸 ব্যয়',dena:'📕 দেনা',pabona:'📗 পাওনা',general:'🗒️ সাধারণ'};
    var tc  = tagColors[note.tag||'general'] || '#8b5cf6';
    var tl  = tagLabels[note.tag||'general'] || '🗒️';
    var bg  = note.color || '#ffffff';

    var modal = document.createElement('div');
    modal.id = '__noteView';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:transparent;display:block';

    var mediaHtml = '';
    if (note.photo)   mediaHtml += '<img src="'+note.photo+'" onclick="event.stopPropagation();_viewPhoto(\''+note.photo+'\')" style="width:100%;max-height:220px;object-fit:cover;border-radius:14px;margin-bottom:10px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.15);display:block"/>';
    if (note.drawing) mediaHtml += '<img src="'+note.drawing+'" onclick="event.stopPropagation();_viewPhoto(\''+note.drawing+'\')" style="width:100%;max-height:200px;object-fit:contain;border-radius:14px;margin-bottom:10px;cursor:pointer;background:#f8fafc;border:1px solid #e5e7eb;display:block"/>';
    if (note.voice)   mediaHtml += '<button onclick="event.stopPropagation();_playVoice(\''+note.id+'\')" style="width:100%;padding:13px;background:linear-gradient(135deg,#faf5ff,#ede9fe);color:#7c3aed;border:1.5px solid rgba(139,92,246,.3);border-radius:13px;font-size:.9rem;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px">🎙️ ভয়েস শুনুন ▶</button>';

    var relHtml = '';
    if (note.relation) {
        var ricons = {income:'💰',expense:'💸',ledger:'📒',savings:'🏦'};
        relHtml = '<div style="background:#eff6ff;border-radius:10px;padding:9px 13px;margin-bottom:10px;font-size:.82rem;font-weight:700;color:#1d4ed8">'+(ricons[note.relation.store]||'🔗')+' '+(note.relation.label||'সম্পর্ক')+'</div>';
    }

    var sheet = document.createElement('div');
    sheet.style.cssText = 'background:'+bg+';border-radius:0;padding:0 0 40px;width:100%;height:100vh;overflow-y:auto;border-top:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999';

    sheet.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;position:sticky;top:0;background:'+bg+';z-index:1;border-bottom:1px solid rgba(0,0,0,.06)">'
        +'<span class="note-tag-chip" style="background:'+tc+'22;color:'+tc+';border:1px solid '+tc+'44;font-size:.75rem;font-weight:800;padding:4px 10px;border-radius:20px">'+tl+'</span>'
        +'<div style="display:flex;gap:8px">'
        +'<button onclick="event.stopPropagation();openEditNote(\''+note.id+'\')" style="padding:8px 14px;background:rgba(0,0,0,.06);border:none;border-radius:10px;font-size:.82rem;font-weight:800;cursor:pointer;font-family:inherit">✏️ সম্পাদনা</button>'
        +'<button onclick="event.stopPropagation();document.getElementById(\'__noteView\').remove()" style="padding:8px 12px;background:rgba(0,0,0,.06);border:none;border-radius:10px;font-size:.88rem;cursor:pointer">✕</button>'
        +'</div></div>'
        +'<div style="padding:14px 18px">'
        +(note.title ? '<h2 style="font-size:1.5rem;font-weight:900;color:#111827;margin-bottom:12px;line-height:1.3;padding:0 2px">'+escHtml(note.title)+'</h2>' : '')
        +(note.text  ? '<div style="font-size:1.1rem;color:#374151;line-height:1.9;white-space:pre-wrap;margin-bottom:14px">'+escHtml(note.text)+'</div>' : '')
        +mediaHtml + relHtml
        +'<div style="color:#9ca3af;font-size:.75rem;margin-top:8px">'+formatDateDisplay(note.createdAt ? note.createdAt.slice(0,10) : '')+'</div>'
        +'</div>';

    modal.appendChild(sheet);
    modal.onclick = function(e){ if(e.target===modal) modal.remove(); };
    document.body.appendChild(modal);

    // animate
    sheet.style.transform = 'translateY(100%)';
    sheet.style.transition = 'transform .3s cubic-bezier(.34,1.1,.64,1)';
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ sheet.style.transform='translateY(0)'; }); });
}
