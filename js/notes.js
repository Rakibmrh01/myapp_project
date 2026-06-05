// Daily Account — notes.js v6.0 — HACKER TERMINAL
// ██████████████████████████████████████████████████
// সব লজিক অক্ষুণ্ণ — UI: terminal / hacker aesthetic
// ██████████████████████████████████████████████████

var allNotes = [];
var filteredNotes = [];
var currentNoteId = null;
var currentDrawing = null;
var mediaRecorder = null;
var audioChunks = [];
var isRecording = false;
var drawingHistory = [];
var drawingStep = -1;
var currentColor = '#00ff41';
var currentSize = 3;

/* ── shared style vars ── */
var _H = {
  bg:      '#010b01',
  card:    '#020d02',
  surface: '#031103',
  green:   '#00ff41',
  cyan:    '#00fff9',
  amber:   '#ffb300',
  red:     '#ff003c',
  muted:   '#1a6b1a',
  dim:     '#00c032',
  border:  'rgba(0,255,65,.25)',
  borderHi:'rgba(0,255,65,.6)',
  mono:    "'Share Tech Mono','Courier New',monospace",
  bengali: "'Hind Siliguri','Noto Sans Bengali',sans-serif",
};

document.addEventListener('DOMContentLoaded', function() {
    loadNotes();
    renderNotes();
    setupSearch();
    setupTagFilter();
});

function loadNotes() {
    allNotes = DB.get('notes') || [];
    filteredNotes = allNotes.slice().reverse();
    _updateCountBadge();
}

function _updateCountBadge() {
    var badge = document.getElementById('noteCountBadge');
    if (!badge) return;
    var n = filteredNotes.length;
    if (n > 0) { badge.textContent = '[' + n + ' RECORDS]'; badge.style.display = 'block'; }
    else { badge.style.display = 'none'; }
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
    _updateCountBadge();
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
            _updateCountBadge();
        });
    });
}

/* ════════════════════════════════
   RENDER
════════════════════════════════ */
function renderNotes() {
    var container = document.getElementById('notesList');
    if (!container) return;
    if (filteredNotes.length === 0) {
        container.innerHTML = '<div class="notes-empty"><span>X</span><p>কোনো নোট নেই</p></div>';
        return;
    }
    var html = '';
    filteredNotes.forEach(function(note) {
        /* tag system — all rendered green in CSS, labels kept for search */
        var tagLabels = {income:'💰 আয়',expense:'💸 ব্যয়',dena:'📕 দেনা',pabona:'📗 পাওনা',general:'🗒️ সাধারণ'};
        var tagCodes  = {income:'INCOME',expense:'EXPENSE',dena:'DENA',pabona:'PABONA',general:'GENERAL'};
        var tl = tagLabels[note.tag||'general'] || '🗒️ সাধারণ';
        var tc_code = tagCodes[note.tag||'general'] || 'GENERAL';
        var bgColor = note.color || '#020d02';

        var mediaHtml = '';
        if (note.photo)   mediaHtml += '<img src="'+note.photo+'" class="note-thumb" onclick="_viewPhoto(\''+note.id+'\')" />';
        if (note.drawing) mediaHtml += '<img src="'+note.drawing+'" class="note-thumb note-drawing-thumb" onclick="_viewNoteDrawing(\''+note.id+'\')" />';
        if (note.voice)   mediaHtml += '<div class="note-voice-chip" onclick="_playVoice(\''+note.id+'\')">[🎙 AUDIO]</div>';

        var relationHtml = '';
        if (note.relation) {
            var ricons = {income:'$',expense:'$',ledger:'#',savings:'#'};
            relationHtml = '<div class="note-relation-chip">['+(ricons[note.relation.store]||'~')+(note.relation.label||'REL')+']</div>';
        }

        html += '<div class="note-card" style="background:'+bgColor+';border-top:2px solid #00ff41" onclick="openViewNote(\''+note.id+'\')">'
            + (note.title ? '<div class="note-card-title">'+escHtml(note.title)+'</div>' : '')
            + '<div class="note-card-text">'+(escHtml(note.text||'').replace(/\n/g,'<br>'))+'</div>'
            + (mediaHtml ? '<div class="note-media-row">'+mediaHtml+'</div>' : '')
            + '<div class="note-card-footer">'
            + '<span class="note-tag-chip">'+tc_code+'</span>'
            + relationHtml
            + '<span class="note-date">'+_hackDate(note.createdAt ? note.createdAt.slice(0,10) : '')+'</span>'
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

function _hackDate(d) {
    if (!d) return '--/--/--';
    return d.replace(/-/g, '/');
}

function escHtml(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ════════════════════════════════
   NEW / EDIT NOTE MODAL
════════════════════════════════ */
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

    /* color palette — dark terminal tones */
    var colors = ['#020d02','#0d1a00','#001a0d','#000d1a','#1a000d','#0d0020','#1a0000','#001010'];
    var colorNames = ['DEFAULT','GREEN','TEAL','NAVY','MAROON','PURPLE','DARK-RED','DARK-CYAN'];

    var colorBtns = colors.map(function(c, i){
        var isActive = (note.color === c);
        return '<button onclick="_setNoteColor(\''+c+'\')" title="'+colorNames[i]+'"'
            + ' style="width:28px;height:28px;border-radius:2px;background:'+c+';'
            + 'border:1.5px solid '+(isActive ? '#00ff41' : 'rgba(0,255,65,.25)')+';'
            + 'cursor:pointer;'+(isActive ? 'box-shadow:0 0 8px #00ff41;' : '')+'font-size:0"'
            + ' id="__nc_'+c.replace(/#/g,'')+'"></button>';
    }).join('');

    var tagCodes = {income:'INCOME',expense:'EXPENSE',dena:'DENA',pabona:'PABONA',general:'GENERAL'};
    var tagBtns = [
        ['general','GENERAL'],['income','INCOME'],['expense','EXPENSE'],
        ['dena','DENA'],['pabona','PABONA']
    ].map(function(t){
        var isActive = (note.tag||'general')===t[0];
        return '<button class="note-tag-modal-btn" data-tag="'+t[0]+'" onclick="_setNoteTag(\''+t[0]+'\')"'
            + ' style="'+(isActive ? 'border:1px solid #00ff41;background:rgba(0,255,65,.12);color:#00ff41;' : '')+'">'+t[1]+'</button>';
    }).join('');

    var drawingPreview = (note.drawing||currentDrawing)
        ? '<img src="'+(note.drawing||currentDrawing)+'" style="width:100%;max-height:120px;object-fit:contain;border-radius:2px;border:1px solid rgba(0,255,65,.3);margin-bottom:10px;cursor:pointer;filter:brightness(.8) hue-rotate(85deg) saturate(.6);background:#000f00" onclick="openDrawingPad(true)" />'
        : '';

    var photoPreview = note.photo
        ? '<img src="'+note.photo+'" style="width:100%;max-height:150px;object-fit:cover;border-radius:2px;border:1px solid rgba(0,255,65,.25);margin-bottom:10px;cursor:pointer;filter:brightness(.8) saturate(.5) hue-rotate(85deg)" onclick="_viewFullPhoto(\''+note.id+'\')" />'
        : '';

    var voicePreview = note.voice
        ? '<div style="background:rgba(0,255,65,.06);border:1px solid rgba(0,255,65,.25);border-radius:2px;padding:11px 14px;display:flex;align-items:center;gap:10px;margin-bottom:10px;cursor:pointer;font-family:'+_H.mono+'" onclick="_playVoiceById()">'
        + '<span style="color:#00ff41;font-size:1rem">▶</span>'
        + '<span style="font-size:.76rem;font-weight:400;color:#00ff41;letter-spacing:1px">AUDIO_NOTE.webm</span>'
        + '<button onclick="event.stopPropagation();_deleteVoice()" style="margin-left:auto;background:rgba(255,0,60,.12);border:1px solid rgba(255,0,60,.3);border-radius:2px;color:#ff003c;cursor:pointer;font-size:.7rem;padding:3px 8px;font-family:'+_H.mono+'">DEL</button>'
        + '</div>'
        : '';

    var relHtml = note.relation
        ? '<div style="background:rgba(0,255,249,.06);border:1px solid rgba(0,255,249,.22);border-radius:2px;padding:10px 14px;display:flex;align-items:center;gap:10px;margin-bottom:10px;font-family:'+_H.mono+'">'
        + '<span style="color:#00fff9;font-size:.76rem;letter-spacing:1px">[LINK] '+(note.relation.label||'RELATION')+'</span>'
        + '<button onclick="event.stopPropagation();_removeRelation()" style="margin-left:auto;background:rgba(255,0,60,.1);border:1px solid rgba(255,0,60,.25);border-radius:2px;color:#ff003c;cursor:pointer;font-size:.7rem;padding:3px 8px;font-family:'+_H.mono+'">UNLINK</button>'
        + '</div>'
        : '';

    var modal = document.createElement('div');
    modal.id = '__noteModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,8,0,.85);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center';

    modal.innerHTML =
        '<div id="__noteSheet" style="'
        + 'background:#000d00;'
        + 'border-top:1px solid #00ff41;'
        + 'border-left:1px solid rgba(0,255,65,.3);'
        + 'border-right:1px solid rgba(0,255,65,.3);'
        + 'border-radius:0;padding:0;width:100%;max-height:96vh;overflow-y:auto;'
        + 'box-shadow:0 -8px 40px rgba(0,255,65,.2),0 0 60px rgba(0,0,0,.9)">'

        // top glow line
        + '<div style="height:2px;background:linear-gradient(90deg,transparent,#00ff41,#00fff9,#00ff41,transparent);animation:none"></div>'

        // handle
        + '<div style="width:36px;height:3px;background:rgba(0,255,65,.3);border-radius:0;margin:10px auto 0"></div>'

        // header
        + '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px 10px;border-bottom:1px solid rgba(0,255,65,.12)">'
        + '<div style="font-family:'+_H.mono+';font-size:.68rem;color:#00fff9;letter-spacing:2px;text-shadow:0 0 8px rgba(0,255,249,.4)">'+(currentNoteId ? '[ EDIT_MODE ]' : '[ NEW_RECORD ]')+'</div>'
        + '<div style="flex:1"></div>'
        + '<button onclick="saveNote()" style="padding:9px 18px;background:#00ff41;color:#000;border:none;border-radius:2px;font-size:.78rem;font-family:'+_H.mono+';font-weight:700;cursor:pointer;letter-spacing:1px;box-shadow:0 0 14px rgba(0,255,65,.4)">SAVE ▶</button>'
        + (currentNoteId ? '<button onclick="deleteNote()" style="padding:9px 14px;background:rgba(255,0,60,.1);color:#ff003c;border:1px solid rgba(255,0,60,.3);border-radius:2px;font-size:.78rem;font-family:'+_H.mono+';cursor:pointer;letter-spacing:1px">DEL</button>' : '')
        + '<button onclick="document.getElementById(\'__noteModal\').remove()" style="padding:9px 12px;background:rgba(255,255,255,.05);color:rgba(0,255,65,.6);border:1px solid rgba(0,255,65,.15);border-radius:2px;font-size:.95rem;cursor:pointer;font-family:'+_H.mono+'">✕</button>'
        + '</div>'

        // inputs
        + '<div style="padding:12px 16px 8px">'
        + photoPreview + voicePreview + drawingPreview + relHtml
        + '<input type="text" id="__noteTitle" placeholder="// শিরোনাম এখানে লিখুন" value="'+(note.title||'')+'"'
        + ' style="width:100%;padding:11px 0;border:none;border-bottom:1px solid rgba(0,255,65,.2);'
        + 'font-size:1rem;font-family:'+_H.mono+';color:#00fff9;background:transparent;outline:none;'
        + 'margin-bottom:10px;letter-spacing:.5px;caret-color:#00ff41" />'
        + '<textarea id="__noteText" placeholder=">> নোট লিখুন..."'
        + ' style="width:100%;min-height:130px;border:1px solid rgba(0,255,65,.14);border-radius:2px;'
        + 'padding:11px 13px;font-size:.92rem;font-family:'+_H.bengali+';color:#00c032;'
        + 'background:rgba(0,255,65,.03);outline:none;resize:none;line-height:1.8;'
        + 'caret-color:#00ff41">'+ escHtml(note.text||'') +'</textarea>'
        + '</div>'

        // color picker
        + '<div style="padding:10px 16px;border-top:1px solid rgba(0,255,65,.08)">'
        + '<div style="font-size:.64rem;font-family:'+_H.mono+';color:#1a6b1a;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px"># card_color</div>'
        + '<div style="display:flex;gap:7px;flex-wrap:wrap">'+colorBtns+'</div>'
        + '</div>'

        // tag selector
        + '<div style="padding:10px 16px;border-top:1px solid rgba(0,255,65,.08)">'
        + '<div style="font-size:.64rem;font-family:'+_H.mono+';color:#1a6b1a;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px"># tag_category</div>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap" id="__tagRow">'+tagBtns+'</div>'
        + '</div>'

        // action buttons
        + '<div style="display:flex;gap:7px;padding:10px 16px 14px;border-top:1px solid rgba(0,255,65,.08);overflow-x:auto">'
        + '<button onclick="_addPhotoToNote()" style="flex-shrink:0;padding:10px 14px;background:rgba(0,255,65,.07);color:#00ff41;border:1px solid rgba(0,255,65,.25);border-radius:2px;font-size:.74rem;font-family:'+_H.mono+';cursor:pointer;letter-spacing:.8px">[IMG]</button>'
        + '<button onclick="openDrawingPad(false)" style="flex-shrink:0;padding:10px 14px;background:rgba(0,255,249,.07);color:#00fff9;border:1px solid rgba(0,255,249,.25);border-radius:2px;font-size:.74rem;font-family:'+_H.mono+';cursor:pointer;letter-spacing:.8px">[DRAW]</button>'
        + '<button onclick="_startVoice()" style="flex-shrink:0;padding:10px 14px;background:rgba(0,255,65,.07);color:#00ff41;border:1px solid rgba(0,255,65,.25);border-radius:2px;font-size:.74rem;font-family:'+_H.mono+';cursor:pointer;letter-spacing:.8px" id="__voiceBtn">[REC]</button>'
        + '<button onclick="_addRelationToNote()" style="flex-shrink:0;padding:10px 14px;background:rgba(255,179,0,.07);color:#ffb300;border:1px solid rgba(255,179,0,.25);border-radius:2px;font-size:.74rem;font-family:'+_H.mono+';cursor:pointer;letter-spacing:.8px">[LINK]</button>'
        + '</div>'
        + '<div style="height:20px"></div>'
        + '</div>';

    document.body.appendChild(modal);

    var sheet = document.getElementById('__noteSheet');
    sheet.style.transform = 'translateY(100%)';
    sheet.style.transition = 'transform .3s cubic-bezier(.34,1.1,.64,1)';
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ sheet.style.transform='translateY(0)'; }); });
    modal.onclick = function(e){ if(e.target===modal) modal.remove(); };
}

function _setNoteColor(color) {
    var sheet = document.getElementById('__noteSheet');
    if (sheet) sheet.style.background = color;
    document.querySelectorAll('[id^="__nc_"]').forEach(function(b){
        b.style.border = '1.5px solid rgba(0,255,65,.25)';
        b.style.boxShadow = 'none';
    });
    var btn = document.getElementById('__nc_'+color.replace(/#/g,''));
    if (btn) { btn.style.border = '1.5px solid #00ff41'; btn.style.boxShadow = '0 0 8px #00ff41'; }
    window.__currentNoteColor = color;
}

function _setNoteTag(tag) {
    document.querySelectorAll('.note-tag-modal-btn').forEach(function(b){
        b.style.border = '1px solid #1a6b1a';
        b.style.background = 'transparent';
        b.style.color = '#00c032';
    });
    document.querySelectorAll('[data-tag="'+tag+'"]').forEach(function(b){
        b.style.border = '1px solid #00ff41';
        b.style.background = 'rgba(0,255,65,.12)';
        b.style.color = '#00ff41';
    });
    window.__currentNoteTag = tag;
}

/* ════════════════════════════════
   SAVE / DELETE
════════════════════════════════ */
function saveNote() {
    var title = document.getElementById('__noteTitle') ? document.getElementById('__noteTitle').value.trim() : '';
    var text  = document.getElementById('__noteText')  ? document.getElementById('__noteText').value.trim()  : '';
    if (!title && !text && !currentDrawing && !window.__currentNotePhoto) {
        showToast('❌ কিছু লিখুন'); return;
    }
    var noteData = {
        title:    title,
        text:     text,
        tag:      window.__currentNoteTag  || 'general',
        color:    window.__currentNoteColor|| '#020d02',
        drawing:  currentDrawing           || null,
        photo:    window.__currentNotePhoto|| null,
        voice:    window.__currentNoteVoice|| null,
        relation: window.__currentNoteRelation || null,
    };
    if (currentNoteId) {
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
    window.__currentNoteColor = null; window.__currentNoteTag = null;
    window.__currentNotePhoto = null; window.__currentNoteVoice = null;
    window.__currentNoteRelation = null; currentDrawing = null;
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

/* ════════════════════════════════
   PHOTO
════════════════════════════════ */
function _addPhotoToNote() {
    var inp = document.createElement('input');
    inp.type='file'; inp.accept='image/*';
    inp.onchange = function() {
        var file = inp.files[0]; if(!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            window.__currentNotePhoto = e.target.result;
            showToast('✅ ফটো যোগ হয়েছে');
            var id = currentNoteId;
            var modal = document.getElementById('__noteModal'); if(modal) modal.remove();
            var note = id ? (DB.get('notes')||[]).find(function(n){return n.id===id;}) : {};
            note = note || {}; note.photo = e.target.result;
            _buildNoteModal(note);
        };
        reader.readAsDataURL(file);
    };
    inp.click();
}

function _viewFullPhoto(id) {
    var all = DB.get('notes')||[];
    var note = all.find(function(n){ return n.id===id; });
    if (note && note.photo) { if (typeof _viewPhoto==='function') _viewPhoto(note.photo); }
}

function _viewPhoto(src) {
    var ex = document.getElementById('__photoFull'); if(ex) ex.remove();
    var d = document.createElement('div');
    d.id='__photoFull';
    d.style.cssText='position:fixed;inset:0;z-index:9999999;background:rgba(0,4,0,.97);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:16px';
    var img = document.createElement('img');
    img.src=src;
    img.style.cssText='max-width:100%;max-height:86vh;border-radius:2px;border:1px solid rgba(0,255,65,.3);filter:brightness(.85) saturate(.6) hue-rotate(85deg)';
    d.appendChild(img);
    d.onclick=function(){d.remove();};
    document.body.appendChild(d);
}

function _viewNoteDrawing(id) {
    var all = DB.get('notes')||[];
    var note = all.find(function(n){ return n.id===id; });
    if (note && note.drawing) _viewPhoto(note.drawing);
}

/* ════════════════════════════════
   VOICE
════════════════════════════════ */
function _startVoice() {
    if (isRecording) { _stopVoice(); return; }
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
        mediaRecorder.start(); isRecording = true;
        var btn = document.getElementById('__voiceBtn');
        if (btn) { btn.textContent='[■ STOP]'; btn.style.background='rgba(255,0,60,.12)'; btn.style.color='#ff003c'; btn.style.borderColor='rgba(255,0,60,.3)'; }
        showToast('🎙️ রেকর্ডিং শুরু...');
    }).catch(function(){ showToast('❌ মাইক্রোফোন অ্যাক্সেস নেই'); });
}

function _stopVoice() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop(); isRecording = false;
        var btn = document.getElementById('__voiceBtn');
        if (btn) { btn.textContent='[REC]'; btn.style.background='rgba(0,255,65,.07)'; btn.style.color='#00ff41'; btn.style.borderColor='rgba(0,255,65,.25)'; }
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

/* ════════════════════════════════
   DRAWING PAD
════════════════════════════════ */
function openDrawingPad(isEdit) {
    var ex = document.getElementById('__drawPad'); if(ex) ex.remove();
    drawingHistory = []; drawingStep = -1;

    var pad = document.createElement('div');
    pad.id = '__drawPad';
    pad.style.cssText = 'position:fixed;inset:0;z-index:9999999;background:#010b01;display:flex;flex-direction:column;font-family:'+_H.mono;

    var colors = ['#00ff41','#00fff9','#ffb300','#ff003c','#ff7700','#ffffff','#7700ff','#000000'];
    var colorBtns = colors.map(function(c){
        return '<button onclick="_setDrawColor(\''+c+'\')" style="width:26px;height:26px;border-radius:2px;background:'+c+';border:1.5px solid '+(currentColor===c?'white':'rgba(0,255,65,.2)')+';cursor:pointer;flex-shrink:0" id="__dc_'+c.replace(/#/g,'')+'" ></button>';
    }).join('');

    pad.innerHTML =
        // toolbar
        '<div style="display:flex;align-items:center;gap:7px;padding:10px 14px;background:#000c00;border-bottom:1px solid rgba(0,255,65,.2)">'
        +'<button onclick="_undoDraw()" style="padding:8px 12px;background:rgba(0,255,65,.07);border:1px solid rgba(0,255,65,.22);border-radius:2px;font-size:.74rem;color:#00ff41;cursor:pointer;font-family:'+_H.mono+';letter-spacing:.5px">↩UNDO</button>'
        +'<button onclick="_redoDraw()" style="padding:8px 12px;background:rgba(0,255,65,.07);border:1px solid rgba(0,255,65,.22);border-radius:2px;font-size:.74rem;color:#00ff41;cursor:pointer;font-family:'+_H.mono+';letter-spacing:.5px">REDO↪</button>'
        +'<button onclick="_clearDraw()" style="padding:8px 12px;background:rgba(255,0,60,.08);border:1px solid rgba(255,0,60,.25);border-radius:2px;font-size:.74rem;color:#ff003c;cursor:pointer;font-family:'+_H.mono+';letter-spacing:.5px">CLR</button>'
        +'<div style="flex:1"></div>'
        +'<button onclick="_saveDrawingAndClose()" style="padding:8px 16px;background:#00ff41;color:#000;border:none;border-radius:2px;font-size:.8rem;font-family:'+_H.mono+';font-weight:700;cursor:pointer;letter-spacing:1px">SAVE ▶</button>'
        +'<button onclick="document.getElementById(\'__drawPad\').remove()" style="padding:8px 12px;background:rgba(0,255,65,.06);border:1px solid rgba(0,255,65,.15);border-radius:2px;font-size:.85rem;cursor:pointer;color:rgba(0,255,65,.5);font-family:'+_H.mono+'">✕</button>'
        +'</div>'
        // color/size bar
        +'<div style="display:flex;align-items:center;gap:7px;padding:8px 14px;background:#000a00;border-bottom:1px solid rgba(0,255,65,.1);overflow-x:auto">'
        +colorBtns
        +'<div style="width:1px;height:22px;background:rgba(0,255,65,.15);flex-shrink:0;margin:0 4px"></div>'
        +'<input type="range" min="1" max="20" value="3" oninput="_setDrawSize(this.value)" style="width:80px;accent-color:#00ff41">'
        +'<span id="__sizeLabel" style="font-size:.7rem;color:#1a6b1a;width:28px;font-family:'+_H.mono+'">3px</span>'
        +'<div style="flex:1"></div>'
        +'<button onclick="_toggleEraser()" id="__eraserBtn" style="padding:6px 11px;background:rgba(0,255,65,.07);border:1px solid rgba(0,255,65,.2);border-radius:2px;font-size:.7rem;cursor:pointer;color:#00ff41;font-family:'+_H.mono+';letter-spacing:.5px">ERASER</button>'
        +'</div>'
        // canvas — white bg for drawing
        +'<canvas id="__drawCanvas" style="flex:1;touch-action:none;cursor:crosshair;background:#f0fff0"></canvas>';

    document.body.appendChild(pad);

    var canvas = document.getElementById('__drawCanvas');
    var dpr = window.devicePixelRatio || 1;
    var cw = window.innerWidth;
    var ch = window.innerHeight - 110;
    canvas.width  = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width  = cw + 'px';
    canvas.style.height = ch + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

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
        e.preventDefault(); drawing = true;
        var pos = getPos(e); lastX=pos[0]; lastY=pos[1];
        ctx.beginPath(); ctx.moveTo(lastX,lastY);
    }
    function draw(e) {
        e.preventDefault(); if (!drawing) return;
        var pos = getPos(e);
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
        ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : currentColor;
        ctx.lineWidth = isEraser ? currentSize*3 : currentSize;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(pos[0],pos[1]); ctx.stroke();
        lastX=pos[0]; lastY=pos[1];
    }
    function endDraw(e) { if (!drawing) return; drawing=false; _saveHistory(); }

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
            btn.style.background = isEraser ? 'rgba(255,0,60,.12)' : 'rgba(0,255,65,.07)';
            btn.style.color = isEraser ? '#ff003c' : '#00ff41';
            btn.textContent = isEraser ? 'PEN' : 'ERASER';
        }
    };
}

function _saveHistory() {
    var canvas = document.getElementById('__drawCanvas'); if (!canvas) return;
    drawingStep++;
    drawingHistory = drawingHistory.slice(0, drawingStep);
    drawingHistory.push(canvas.toDataURL());
}
function _undoDraw() {
    if (drawingStep <= 0) return; drawingStep--;
    var canvas = document.getElementById('__drawCanvas'); if (!canvas) return;
    var ctx = canvas.getContext('2d'); var img = new Image();
    img.onload = function(){ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
    img.src = drawingHistory[drawingStep];
}
function _redoDraw() {
    if (drawingStep >= drawingHistory.length-1) return; drawingStep++;
    var canvas = document.getElementById('__drawCanvas'); if (!canvas) return;
    var ctx = canvas.getContext('2d'); var img = new Image();
    img.onload = function(){ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
    img.src = drawingHistory[drawingStep];
}
function _clearDraw() {
    var canvas = document.getElementById('__drawCanvas'); if (!canvas) return;
    canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height); _saveHistory();
}
function _setDrawColor(c) {
    currentColor = c;
    document.querySelectorAll('[id^="__dc_"]').forEach(function(b){ b.style.border='1.5px solid rgba(0,255,65,.2)'; });
    var btn = document.getElementById('__dc_'+c.replace(/#/g,''));
    if (btn) btn.style.border = '1.5px solid white';
}
function _setDrawSize(v) {
    currentSize = parseInt(v);
    var lbl = document.getElementById('__sizeLabel');
    if (lbl) lbl.textContent = v+'px';
}
function _saveDrawingAndClose() {
    var canvas = document.getElementById('__drawCanvas'); if (!canvas) return;
    currentDrawing = canvas.toDataURL('image/png');
    var pad = document.getElementById('__drawPad'); if(pad) pad.remove();
    showToast('✅ হাতের লেখা সংরক্ষিত');
    var id = currentNoteId;
    var noteModal = document.getElementById('__noteModal');
    if (noteModal) {
        noteModal.remove();
        var note = id ? (DB.get('notes')||[]).find(function(n){return n.id===id;}) : {};
        note = note || {}; note.drawing = currentDrawing;
        _buildNoteModal(note);
    }
}

/* ════════════════════════════════
   RELATION
════════════════════════════════ */
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

/* ════════════════════════════════
   NOTE VIEW MODAL
════════════════════════════════ */
function openViewNote(id) {
    var note = allNotes.find(function(n){ return n.id===id; });
    if (!note) return;

    var ex = document.getElementById('__noteView'); if(ex) ex.remove();

    var tagCodes = {income:'INCOME',expense:'EXPENSE',dena:'DENA',pabona:'PABONA',general:'GENERAL'};
    var tc_code = tagCodes[note.tag||'general'] || 'GENERAL';

    var modal = document.createElement('div');
    modal.id = '__noteView';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:transparent;display:block';

    var mediaHtml = '';
    if (note.photo)   mediaHtml += '<img src="'+note.photo+'" onclick="event.stopPropagation();_viewPhoto(\''+note.photo+'\')" style="width:100%;max-height:230px;object-fit:cover;border-radius:2px;border:1px solid rgba(0,255,65,.25);margin-bottom:14px;cursor:pointer;filter:brightness(.8) saturate(.5) hue-rotate(85deg);display:block"/>';
    if (note.drawing) mediaHtml += '<img src="'+note.drawing+'" onclick="event.stopPropagation();_viewPhoto(\''+note.drawing+'\')" style="width:100%;max-height:200px;object-fit:contain;border-radius:2px;border:1px solid rgba(0,255,65,.2);margin-bottom:14px;cursor:pointer;background:#000f00;filter:brightness(.8) hue-rotate(85deg) saturate(.6);display:block"/>';
    if (note.voice)   mediaHtml += '<button onclick="event.stopPropagation();_playVoice(\''+note.id+'\')" style="width:100%;padding:13px;background:rgba(0,255,65,.07);color:#00ff41;border:1px solid rgba(0,255,65,.25);border-radius:2px;font-size:.8rem;cursor:pointer;font-family:'+_H.mono+';margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:10px;letter-spacing:1px">▶ PLAY AUDIO_NOTE.webm</button>';

    var relHtml = '';
    if (note.relation) {
        var ricons = {income:'$',expense:'$',ledger:'#',savings:'#'};
        relHtml = '<div style="background:rgba(0,255,249,.06);border:1px solid rgba(0,255,249,.2);border-radius:2px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:#00fff9;font-family:'+_H.mono+';letter-spacing:1px">[LINK] '+(ricons[note.relation.store]||'~')+(note.relation.label||'RELATION')+'</div>';
    }

    var sheet = document.createElement('div');
    sheet.style.cssText = 'background:#010b01;border-radius:0;padding:0;width:100%;height:100vh;overflow-y:auto;position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999';

    sheet.innerHTML =
        // sticky header
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;position:sticky;top:0;background:#000c00;z-index:1;border-bottom:1px solid rgba(0,255,65,.2);box-shadow:0 0 20px rgba(0,255,65,.12)">'
        + '<div style="display:flex;align-items:center;gap:10px">'
        + '<button onclick="event.stopPropagation();document.getElementById(\'__noteView\').remove()" style="padding:8px 12px;background:rgba(0,255,65,.07);border:1px solid rgba(0,255,65,.2);border-radius:2px;font-size:.8rem;color:#00ff41;cursor:pointer;font-family:'+_H.mono+';letter-spacing:1px">← BACK</button>'
        + '<span style="font-family:'+_H.mono+';font-size:.66rem;color:#1a6b1a;letter-spacing:2px;border:1px solid rgba(0,255,65,.2);padding:3px 9px;border-radius:2px">'+tc_code+'</span>'
        + '</div>'
        + '<button onclick="event.stopPropagation();document.getElementById(\'__noteView\').remove();openEditNote(\''+note.id+'\')" style="padding:9px 18px;background:#00ff41;color:#000;border:none;border-radius:2px;font-size:.8rem;font-family:'+_H.mono+';font-weight:700;cursor:pointer;letter-spacing:1px;box-shadow:0 0 14px rgba(0,255,65,.35)">EDIT ▶</button>'
        + '</div>'

        // content
        + '<div style="padding:20px 18px 40px">'
        + (note.title ? '<h2 style="font-size:1.3rem;font-family:'+_H.mono+';color:#00fff9;margin-bottom:14px;line-height:1.35;letter-spacing:1px;text-shadow:0 0 10px rgba(0,255,249,.25)">'+escHtml(note.title)+'</h2>' : '')
        + (note.text  ? '<div style="font-size:1rem;font-family:'+_H.bengali+';color:#00c032;line-height:1.85;white-space:pre-wrap;margin-bottom:18px">'+escHtml(note.text)+'</div>' : '')
        + mediaHtml + relHtml
        + '<div style="display:flex;align-items:center;gap:10px;margin-top:16px;padding-top:12px;border-top:1px solid rgba(0,255,65,.08)">'
        + '<span style="font-size:.68rem;color:#1a6b1a;font-family:'+_H.mono+';letter-spacing:1px">// CREATED: '+_hackDate(note.createdAt ? note.createdAt.slice(0,10) : '--')+'</span>'
        + (note.updatedAt ? '<span style="font-size:.65rem;color:#1a6b1a;font-family:'+_H.mono+';letter-spacing:.8px">| UPDATED: '+_hackDate(note.updatedAt.slice(0,10))+'</span>' : '')
        + '</div>'
        + '</div>';

    modal.appendChild(sheet);
    modal.onclick = function(e){ if(e.target===modal) modal.remove(); };
    document.body.appendChild(modal);

    sheet.style.transform = 'translateY(100%)';
    sheet.style.transition = 'transform .32s cubic-bezier(.34,1.1,.64,1)';
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ sheet.style.transform='translateY(0)'; }); });
}