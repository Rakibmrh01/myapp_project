// ================================================================
//  Daily Account — extra-backup.js  v5.1 (Standalone — No external deps)
//  সমস্ত backup/restore/telegram/csv/ai ফাংশন এক ফাইলে
//  DB object এখানেই embedded — db.js দরকার নেই
// ================================================================

/* ════════════════════════════════════════
   EMBEDDED DB (db.js থেকে নেওয়া)
════════════════════════════════════════ */
var DB = {
    get: function(key) {
        try { var d=localStorage.getItem(key); return d?JSON.parse(d):null; }
        catch(e){ return null; }
    },
    set: function(key,value) {
        try { localStorage.setItem(key,JSON.stringify(value)); return true; }
        catch(e){ return false; }
    },
    sum: function(key,field) {
        return (this.get(key)||[]).reduce(function(t,i){ return t+(Number(i[field])||0); },0);
    },
    count: function(key) { return (this.get(key)||[]).length; },
    initStorage: function() {
        var stores=['income','expense','ledger','savings','trash','notes'];
        for(var i=0;i<stores.length;i++){
            if(!this.get(stores[i])) this.set(stores[i],[]);
        }
    }
};
DB.initStorage();

/* ════════════════════════════════════════
   UTILS
════════════════════════════════════════ */
function _d() { return new Date().toISOString().slice(0,10); }

function showSt(id,msg,type) {
    var el=document.getElementById(id); if(!el) return;
    el.textContent=msg;
    el.className='st '+(type==='ok'?'ok-st':type==='info'?'info-st':'er-st');
    setTimeout(function(){ el.className='st'; },5000);
}

function showR(id,msg,type) {
    var el=document.getElementById(id); if(!el) return;
    el.textContent=msg;
    el.className='s-result '+(type==='ok'?'r-ok':type==='info'?'r-info':'r-err');
}

function openModal(name) {
    var key=name.charAt(0).toUpperCase()+name.slice(1);
    var m=document.getElementById('modal'+key);
    if(m) m.classList.add('open');
}
function closeModal(id) {
    var m=document.getElementById(id); if(m) m.classList.remove('open');
}

/* ════════════════════════════════════════
   BUILD JSON BACKUP
════════════════════════════════════════ */
function buildJSON(withMedia) {
    var data={app:'Daily Account',v:'3.5',date:_d(),media:withMedia};
    ['income','expense','ledger','savings','notes'].forEach(function(s) {
        var arr=DB.get(s)||[];
        if(!withMedia) {
            arr=arr.map(function(i){
                var o={};
                Object.keys(i).forEach(function(k){
                    if(k!=='photo'&&k!=='drawing'&&k!=='voice') o[k]=i[k];
                });
                return o;
            });
        }
        data[s]=arr;
    });
    data.settings   = DB.get('settings')   || {};
    data.cssConfig  = DB.get('cssConfig')  || {};
    data.pageConfig = DB.get('pageConfig') || {};
    return JSON.stringify(data,null,2);
}

/* ════════════════════════════════════════
   LOCAL BACKUP — JSON
════════════════════════════════════════ */
function doBackup(withMedia,act) {
    var json=buildJSON(withMedia);
    var fn='da-backup'+(withMedia?'-media':'')+'-'+_d()+'.json';
    if(act==='cp') {
        var ta=document.getElementById('jsonTA');
        ta.value=json; ta.className='ta show'; ta.select();
        try {
            navigator.clipboard.writeText(json)
                .then(function(){ showSt('bkSt','✅ কপি হয়েছে! WhatsApp/Notes এ paste করুন।','ok'); })
                .catch(function(){ document.execCommand('copy'); showSt('bkSt','✅ কপি হয়েছে','ok'); });
        } catch(e) { document.execCommand('copy'); showSt('bkSt','✅ কপি হয়েছে','ok'); }
    } else {
        saveFile(json,fn,'application/json','bkSt');
    }
}

function saveFile(content,fn,mime,stId) {
    var blob=new Blob([content],{type:mime});
    if(navigator.share && navigator.canShare) {
        try {
            var file=new File([blob],fn,{type:mime});
            if(navigator.canShare({files:[file]})) {
                navigator.share({files:[file],title:'Daily Account'})
                    .then(function(){ if(stId) showSt(stId,'✅ শেয়ার/সেভ সফল!','ok'); })
                    .catch(function(){ anchorDl(blob,fn,stId); });
                return;
            }
        } catch(e){}
    }
    anchorDl(blob,fn,stId);
}

function anchorDl(blob,fn,stId) {
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url; a.download=fn; a.style.display='none';
    document.body.appendChild(a); a.click();
    setTimeout(function(){
        try{document.body.removeChild(a);}catch(e){}
        URL.revokeObjectURL(url);
    },800);
    if(stId) showSt(stId,'✅ ডাউনলোড শুরু হয়েছে!','ok');
}

function shareText() {
    var json=buildJSON(false);
    if(navigator.share) {
        navigator.share({title:'Daily Account Backup '+_d(),text:json})
            .catch(function(){ _cpTxt(json); });
    } else { _cpTxt(json); }
}

function _cpTxt(t) {
    if(navigator.clipboard) {
        navigator.clipboard.writeText(t)
            .then(function(){ showSt('bkSt','✅ Clipboard এ কপি! WhatsApp/Notes এ paste করুন।','ok'); });
    }
}

/* ════════════════════════════════════════
   TELEGRAM BACKUP
   ─── কেন আগে কাজ করত না ───
   db.js লোড না হলে DB undefined → buildJSON() crash করত।
   এখন DB এই ফাইলেই embedded, তাই সব কাজ করবে।
════════════════════════════════════════ */
function tgSaveCredentials() {
    var t=document.getElementById('tg_token').value.trim();
    var c=document.getElementById('tg_chatid').value.trim();
    if(!t||!c){ showR('tg_result','❌ Token ও Chat ID দুটোই লাগবে','err'); return; }
    localStorage.setItem('da_tg_token',t);
    localStorage.setItem('da_tg_chatid',c);
    showR('tg_result','✅ সংরক্ষিত হয়েছে!','ok');
}

function _tgCreds() {
    return {
        token:  document.getElementById('tg_token').value.trim()  || localStorage.getItem('da_tg_token')  || '',
        chatId: document.getElementById('tg_chatid').value.trim() || localStorage.getItem('da_tg_chatid') || ''
    };
}

function tgTest() {
    var c=_tgCreds();
    if(!c.token||!c.chatId){ showR('tg_result','❌ Token ও Chat ID দিন','err'); return; }
    showR('tg_result','⏳ Test message পাঠানো হচ্ছে...','info');
    fetch('https://api.telegram.org/bot'+c.token+'/sendMessage',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({chat_id:c.chatId,text:'✅ Daily Account Backup Test — Connection OK! 🎉'})
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
        if(d.ok) showR('tg_result','✅ Test সফল! Telegram এ message পেয়েছেন?','ok');
        else     showR('tg_result','❌ Error: '+d.description,'err');
    })
    .catch(function(e){ showR('tg_result','❌ Network error: '+e.message,'err'); });
}

function tgSend(withMedia) {
    var c=_tgCreds();
    if(!c.token||!c.chatId){ showR('tg_result','❌ Token ও Chat ID সংরক্ষণ করুন','err'); return; }
    localStorage.setItem('da_tg_token',c.token);
    localStorage.setItem('da_tg_chatid',c.chatId);

    var json=buildJSON(withMedia);
    var dateStr=_d();
    var fname='backup-'+dateStr+(withMedia?'-with-media':'')+'.json';

    showR('tg_result','⏳ পাঠানো হচ্ছে...','info');

    var incLen=(DB.get('income')||[]).length;
    var expLen=(DB.get('expense')||[]).length;
    var ledLen=(DB.get('ledger')||[]).length;
    var msg=
        '🗄️ Daily Account Backup\n'+
        '📅 তারিখ: '+dateStr+(withMedia?' 📸 মিডিয়া সহ':'')+'\n\n'+
        '📊 আয়: '+incLen+' · ব্যয়: '+expLen+' · লেজার: '+ledLen+'\n\n'+
        '📎 ফাইল: '+fname;

    // Step 1: text message
    fetch('https://api.telegram.org/bot'+c.token+'/sendMessage',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({chat_id:c.chatId,text:msg})
    })
    .then(function() {
        // Step 2: .json file as document
        var blob=new Blob([json],{type:'application/json'});
        var form=new FormData();
        form.append('chat_id',c.chatId);
        form.append('document',blob,fname);
        form.append('caption','📁 '+fname+'\nSize: ~'+Math.round(json.length/1024)+'KB');
        return fetch('https://api.telegram.org/bot'+c.token+'/sendDocument',{method:'POST',body:form});
    })
    .then(function(r){ return r.json(); })
    .then(function(d) {
        if(d.ok) {
            if(withMedia) _tgSendMediaFiles(c.token,c.chatId,dateStr);
            showR('tg_result','✅ Telegram এ .json ফাইল পাঠানো সফল!\n📁 '+fname,'ok');
        } else {
            showR('tg_result','❌ Error: '+d.description,'err');
        }
    })
    .catch(function(e){ showR('tg_result','❌ '+e.message,'err'); });
}

function tgSendAllInOne() {
    var c=_tgCreds();
    if(!c.token||!c.chatId){ showR('tg_result','❌ Token ও Chat ID সংরক্ষণ করুন','err'); return; }
    localStorage.setItem('da_tg_token',c.token);
    localStorage.setItem('da_tg_chatid',c.chatId);

    showR('tg_result','⏳ সব মিডিয়া সহ এক ফাইলে তৈরি হচ্ছে...','info');
    var json=buildJSON(true);
    var fname='backupwithmedia-'+_d()+'.json';
    var blob=new Blob([json],{type:'application/json'});
    var form=new FormData();
    form.append('chat_id',c.chatId);
    form.append('document',blob,fname);
    form.append('caption','📦 Full Backup (media সহ) — '+_d()+'\nSize: ~'+Math.round(json.length/1024)+'KB');

    fetch('https://api.telegram.org/bot'+c.token+'/sendDocument',{method:'POST',body:form})
    .then(function(r){ return r.json(); })
    .then(function(d) {
        if(d.ok) showR('tg_result','✅ এক ফাইলে সব backup পাঠানো সফল!\n📁 '+fname,'ok');
        else     showR('tg_result','❌ Error: '+d.description+'\n💡 ফাইল অনেক বড় হলে মিডিয়া ছাড়া পাঠান','err');
    })
    .catch(function(e){ showR('tg_result','❌ '+e.message,'err'); });
}

function _tgSendMediaFiles(token,chatId,dateStr) {
    var stores=['income','expense','ledger','savings','notes'];
    var photos=[],drawings=[],voices=[];
    stores.forEach(function(s){
        (DB.get(s)||[]).forEach(function(item){
            if(item.photo   && item.photo.indexOf('data:')===0)   photos.push({data:item.photo,   name:'photo_'+(item.id||Date.now())+'.jpg'});
            if(item.drawing && item.drawing.indexOf('data:')===0) drawings.push({data:item.drawing,name:'drawing_'+(item.id||Date.now())+'.png'});
            if(item.voice   && item.voice.indexOf('data:')===0)   voices.push({data:item.voice,   name:'voice_'+(item.id||Date.now())+'.webm'});
        });
    });
    var total=photos.length+drawings.length+voices.length;
    if(total===0) return;
    fetch('https://api.telegram.org/bot'+token+'/sendMessage',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({chat_id:chatId,text:'📸 মিডিয়া ফাইল: ছবি '+photos.length+' · হাতের লেখা '+drawings.length+' · ভয়েস '+voices.length})
    });
    var toSend=photos.slice(0,3).concat(drawings.slice(0,3)).concat(voices.slice(0,3));
    var i=0;
    function sendNext() {
        if(i>=toSend.length) return;
        var item=toSend[i++];
        var parts=item.data.split(',');
        var mime=parts[0].match(/:(.*?);/)[1];
        var binary=atob(parts[1]);
        var arr=new Uint8Array(binary.length);
        for(var j=0;j<binary.length;j++) arr[j]=binary.charCodeAt(j);
        var blob=new Blob([arr],{type:mime});
        var form=new FormData();
        form.append('chat_id',chatId);
        form.append('document',blob,item.name);
        fetch('https://api.telegram.org/bot'+token+'/sendDocument',{method:'POST',body:form})
            .then(function(){ setTimeout(sendNext,500); })
            .catch(function(){ setTimeout(sendNext,500); });
    }
    sendNext();
}

/* ════════════════════════════════════════
   GOOGLE DRIVE
════════════════════════════════════════ */
function copyGASCode() {
    var code=document.getElementById('gasCode').textContent;
    if(navigator.clipboard) {
        navigator.clipboard.writeText(code).then(function(){
            var btn=document.querySelector('.copy-script');
            if(btn){ btn.textContent='✅ কপি!'; setTimeout(function(){ btn.textContent='📋 Copy'; },2000); }
        });
    }
}

function gdSaveUrl() {
    var url=document.getElementById('gd_url').value.trim();
    if(!url||url.indexOf('script.google.com')===-1){
        showR('gd_result','❌ সঠিক Apps Script URL দিন','err'); return;
    }
    localStorage.setItem('da_gd_url',url);
    showR('gd_result','✅ URL সংরক্ষিত হয়েছে!','ok');
}

function gdSend(withMedia) {
    var url=document.getElementById('gd_url').value.trim()||localStorage.getItem('da_gd_url')||'';
    if(!url){ showR('gd_result','❌ আগে Apps Script URL সংরক্ষণ করুন','err'); return; }
    var json=buildJSON(withMedia);
    showR('gd_result','⏳ Google Drive এ upload হচ্ছে...','info');
    fetch(url,{method:'POST',body:json,headers:{'Content-Type':'text/plain'}})
    .then(function(r){ return r.text(); })
    .then(function(t){
        try {
            var d=JSON.parse(t);
            if(d.ok||d.file) showR('gd_result','✅ Drive এ save সফল!\n📁 ফাইল: '+(d.file||''),'ok');
            else              showR('gd_result','⚠️ Response: '+t,'info');
        } catch(e2) {
            showR('gd_result','⚠️ সম্ভবত সফল। Response: '+t.slice(0,100),'info');
        }
    })
    .catch(function(e){ showR('gd_result','❌ '+e.message+'\n\n💡 CORS ব্লক হতে পারে। Script এ doOptions() যোগ করুন।','err'); });
}

function gdList() {
    var url=localStorage.getItem('da_gd_url')||document.getElementById('gd_url').value.trim()||'';
    if(!url){ showR('gd_result','❌ URL নেই','err'); return; }
    showR('gd_result','⏳ ফাইল তালিকা আনা হচ্ছে...','info');
    fetch(url)
    .then(function(r){ return r.json(); })
    .then(function(d){
        var files=d.files||[];
        if(!files.length){ showR('gd_result','❌ কোনো backup নেই','err'); return; }
        var html='';
        files.slice(0,8).forEach(function(f){
            html+=
                '<div>'+
                '<div style="flex:1;font-size:.82rem;color:#94a3b8;font-weight:600">📄 '+f.name+'</div>'+
                '<button onclick="gdRestore(\''+f.id+'\')" style="padding:6px 12px;background:#10b981;color:white;border:none;border-radius:8px;font-size:.75rem;font-weight:800;cursor:pointer">Restore</button>'+
                '</div>';
        });
        document.getElementById('gd_file_list').innerHTML=html;
        showR('gd_result','✅ '+files.length+' টি backup পাওয়া গেছে','ok');
    })
    .catch(function(e){ showR('gd_result','❌ '+e.message,'err'); });
}

function gdRestore(fileId) {
    var url=localStorage.getItem('da_gd_url')||'';
    if(!url){ showR('gd_result','❌ URL নেই','err'); return; }
    showR('gd_result','⏳ restore হচ্ছে...','info');
    fetch(url+'?fileId='+fileId)
    .then(function(r){ return r.json(); })
    .then(function(d){
        if(d.income||d.expense) doRestore(d);
        else showR('gd_result','⚠️ Restore করতে ফাইলটি Download করে Paste করুন','info');
    })
    .catch(function(e){ showR('gd_result','❌ '+e.message,'err'); });
}

/* ════════════════════════════════════════
   JSONBIN
════════════════════════════════════════ */
function jbSave() {
    var key=document.getElementById('jb_key').value.trim();
    if(!key){ showR('jb_result','❌ API Key দিন','err'); return; }
    var json=buildJSON(false);
    var binId=localStorage.getItem('da_jb_binId')||'';
    var url=binId?'https://api.jsonbin.io/v3/b/'+binId:'https://api.jsonbin.io/v3/b';
    var method=binId?'PUT':'POST';
    showR('jb_result','⏳ আপলোড হচ্ছে...','info');
    fetch(url,{
        method:method,
        headers:{'Content-Type':'application/json','X-Master-Key':key,'X-Bin-Name':'DA-'+_d()},
        body:json
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
        var id=d.metadata?d.metadata.id:'';
        if(id) {
            localStorage.setItem('da_jb_binId',id);
            localStorage.setItem('da_jb_key',key);
            document.getElementById('jb_binId').value=id;
            showR('jb_result','✅ Save সফল!\nBin ID: '+id+'\n(সংরক্ষণ করুন!)','ok');
        } else { showR('jb_result','❌ '+(d.message||JSON.stringify(d)),'err'); }
    })
    .catch(function(e){ showR('jb_result','❌ '+e.message,'err'); });
}

function jbLoad() {
    var key=document.getElementById('jb_key').value.trim()||localStorage.getItem('da_jb_key')||'';
    var binId=document.getElementById('jb_binId').value.trim()||localStorage.getItem('da_jb_binId')||'';
    if(!key||!binId){ showR('jb_result','❌ API Key ও Bin ID দিন','err'); return; }
    showR('jb_result','⏳ লোড হচ্ছে...','info');
    fetch('https://api.jsonbin.io/v3/b/'+binId+'/latest',{headers:{'X-Master-Key':key}})
    .then(function(r){ return r.json(); })
    .then(function(d){
        if(d.record){ doRestore(d.record); showR('jb_result','✅ Restore সফল!','ok'); }
        else showR('jb_result','❌ ডাটা পাওয়া যায়নি','err');
    })
    .catch(function(e){ showR('jb_result','❌ '+e.message,'err'); });
}

/* ════════════════════════════════════════
   CSV EXPORT/IMPORT
════════════════════════════════════════ */
function buildCSV() {
    var csv='\uFEFFধরন,উৎস/ক্যাটাগরি,পরিমাণ,তারিখ,সময়,নোট\n';
    (DB.get('income')||[]).forEach(function(i){
        csv+='আয়,"'+(i.source||'')+'",'    +Math.round(i.amount||0)+',"'+(i.date||'')+'","'+(i.time||'')+'","'+(i.note||'')+'"\n';
    });
    (DB.get('expense')||[]).forEach(function(i){
        csv+='ব্যয়,"'+(i.category||i.source||'')+'",' +Math.round(i.amount||0)+',"'+(i.date||'')+'","'+(i.time||'')+'","'+(i.note||'')+'"\n';
    });
    return csv;
}

function doCSV(act) {
    var csv=buildCSV();
    if(act==='cp') {
        var ta=document.getElementById('csvTA');
        ta.value=csv; ta.className='ta show'; ta.select();
        try {
            navigator.clipboard.writeText(csv)
                .then(function(){ showSt('csvSt','✅ CSV কপি হয়েছে!','ok'); });
        } catch(e) { document.execCommand('copy'); showSt('csvSt','✅ কপি হয়েছে','ok'); }
    } else {
        saveFile(csv,'da-'+_d()+'.csv','text/csv','csvSt');
    }
}

function resetFromCSV() {
    if(!confirm('⚠️ CSV দিয়ে আয়/ব্যয় রিসেট হবে। নিশ্চিত?')) return;
    var ta=document.getElementById('csvTA');
    if(!ta.value.trim()){ showSt('csvSt','❌ আগে CSV কপি করুন','err'); return; }
    try {
        var lines=ta.value.split('\n'),income=[],expense=[];
        for(var i=1;i<lines.length;i++){
            var c=lines[i].split(','); if(c.length<3) continue;
            var type=c[0].replace(/"/g,'').trim();
            var obj={
                id:Date.now()+'_'+i,
                source:   c[1].replace(/"/g,'').trim(),
                category: c[1].replace(/"/g,'').trim(),
                amount:   parseFloat(c[2])||0,
                date:     c[3]?c[3].replace(/"/g,'').trim():'',
                time:     c[4]?c[4].replace(/"/g,'').trim():'',
                note:     c[5]?c[5].replace(/"/g,'').trim():''
            };
            if(type==='আয়') income.push(obj);
            else if(type==='ব্যয়') expense.push(obj);
        }
        DB.set('income',income); DB.set('expense',expense);
        showSt('csvSt','✅ আমদানি সফল! আয়:'+income.length+' ব্যয়:'+expense.length,'ok');
    } catch(e){ showSt('csvSt','❌ '+e.message,'err'); }
}

/* ════════════════════════════════════════
   EXCEL / XLSX EXPORT
   (SheetJS CDN থেকে লোড হলে কাজ করে)
════════════════════════════════════════ */
function doExcel() {
    if(typeof XLSX === 'undefined'){
        showSt('csvSt','⏳ Excel library লোড হচ্ছে...','info');
        var script=document.createElement('script');
        script.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload=function(){ _makeExcel(); };
        script.onerror=function(){ showSt('csvSt','❌ Excel library লোড হয়নি। CSV ব্যবহার করুন।','err'); };
        document.head.appendChild(script);
    } else { _makeExcel(); }
}

function _makeExcel() {
    try {
        var wb=XLSX.utils.book_new();
        // Income sheet
        var incData=[['ID','উৎস','পরিমাণ','তারিখ','সময়','নোট']];
        (DB.get('income')||[]).forEach(function(r){ incData.push([r.id||'',r.source||'',r.amount||0,r.date||'',r.time||'',r.note||'']); });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(incData), 'আয়');
        // Expense sheet
        var expData=[['ID','ক্যাটাগরি','পরিমাণ','তারিখ','সময়','নোট']];
        (DB.get('expense')||[]).forEach(function(r){ expData.push([r.id||'',r.category||r.source||'',r.amount||0,r.date||'',r.time||'',r.note||'']); });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expData), 'ব্যয়');
        // Ledger sheet
        var ledData=[['ID','নাম','ধরন','পরিমাণ','তারিখ','পরিশোধ','নোট']];
        (DB.get('ledger')||[]).forEach(function(r){ ledData.push([r.id||'',r.name||'',r.type||'',r.amount||0,r.date||'',r.paid?'হ্যাঁ':'না',r.note||'']); });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ledData), 'লেজার');
        // Savings sheet
        var savData=[['ID','নাম','পরিমাণ','তারিখ','লক্ষ্য','নোট']];
        (DB.get('savings')||[]).forEach(function(r){ savData.push([r.id||'',r.name||'',r.amount||0,r.date||'',r.goal||0,r.note||'']); });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(savData), 'সঞ্চয়');

        XLSX.writeFile(wb,'daily-account-'+_d()+'.xlsx');
        showSt('csvSt','✅ Excel ফাইল ডাউনলোড হয়েছে!','ok');
    } catch(e){ showSt('csvSt','❌ Excel তৈরিতে ত্রুটি: '+e.message,'err'); }
}

/* ════════════════════════════════════════
   RESTORE
════════════════════════════════════════ */
function restoreJSON(ev) {
    var f=ev.target.files[0]; if(!f) return; ev.target.value='';
    var r=new FileReader();
    r.onload=function(e){
        try { doRestore(JSON.parse(e.target.result)); }
        catch(er){ showSt('rstSt','❌ ভুল ফাইল!','err'); }
    };
    r.readAsText(f);
}

function restoreFromPaste() {
    var t=document.getElementById('pasteTA').value.trim();
    if(!t){ showSt('rstSt','❌ কিছু paste করুন','err'); return; }
    try { doRestore(JSON.parse(t)); }
    catch(e){ showSt('rstSt','❌ ভুল JSON: '+e.message,'err'); }
}

function doRestore(data) {
    if(!confirm('⚠️ বর্তমান ডাটা মুছে নতুন ডাটা রিস্টোর হবে। নিশ্চিত?')) return;
    ['income','expense','ledger','savings','notes','settings','cssConfig','pageConfig'].forEach(function(k){
        if(data[k]) DB.set(k,data[k]);
    });
    showSt('rstSt','✅ রিস্টোর সফল! পেজ reload হবে...','ok');
    setTimeout(function(){
        // যদি index.html থাকে সেখানে যাও, না থাকলে reload
        try { location.href='../index.html'; } catch(e){ location.reload(); }
    },1800);
}

/* ════════════════════════════════════════
   AI FINANCIAL ANALYSIS (Local — No API)
════════════════════════════════════════ */
function generateAI() {
    var income  = DB.sum('income','amount');
    var expense = DB.sum('expense','amount');
    var savings = DB.sum('savings','amount');
    var ledger  = DB.get('ledger')||[];
    var dena=0, pabona=0;
    ledger.forEach(function(i){
        if(!i.paid){
            if(i.type==='dena') dena+=Number(i.amount||0);
            else                pabona+=Number(i.amount||0);
        }
    });
    var balance = income - expense + pabona - dena - savings;
    var sr = income>0 ? Math.round(savings/income*100) : 0;
    var er = income>0 ? Math.round(expense/income*100) : 0;

    var advice =
        expense > income     ? '⚠️ ব্যয় আয়ের চেয়ে বেশি! দ্রুত খরচ কমান।' :
        sr >= 30             ? '🎉 অসাধারণ! আয়ের '+sr+'% সঞ্চয়! চমৎকার আর্থিক অভ্যাস!' :
        sr >= 20             ? '✅ দুর্দান্ত! '+sr+'% সঞ্চয় চালিয়ে যান।' :
        er > 80              ? '⚠️ ব্যয় অনেক বেশি ('+er+'%) — খরচ কমান।' :
                               '💡 সঞ্চয় বাড়ান। বর্তমানে '+sr+'%, লক্ষ্য ২০%+।';

    var html =
        '<div class="ai-row"><span class="ai-lbl">💰 মোট আয়</span><span class="ai-val">৳'+Math.round(income)+'</span></div>'+
        '<div class="ai-row"><span class="ai-lbl">💸 মোট ব্যয়</span><span class="ai-val">৳'+Math.round(expense)+'</span></div>'+
        '<div class="ai-row"><span class="ai-lbl">🏦 সঞ্চয়</span><span class="ai-val">৳'+Math.round(savings)+' ('+sr+'%)</span></div>'+
        '<div class="ai-row"><span class="ai-lbl">📕 দেনা</span><span class="ai-val">৳'+Math.round(dena)+'</span></div>'+
        '<div class="ai-row"><span class="ai-lbl">📗 পাওনা</span><span class="ai-val">৳'+Math.round(pabona)+'</span></div>'+
        '<div class="ai-row"><span class="ai-lbl">💵 ব্যালেন্স</span><span class="ai-val" style="color:'+(balance>=0?'#34d399':'#fca5a5')+'">৳'+Math.round(balance)+'</span></div>'+
        '<div class="ai-advice">'+advice+'</div>';

    var out=document.getElementById('aiOut');
    out.innerHTML=html;
    out.style.display='block';
}

/* ════════════════════════════════════════
   FONT UPLOAD
════════════════════════════════════════ */
function uploadFont(ev,type) {
    var f=ev.target.files[0]; if(!f) return;
    var r=new FileReader();
    r.onload=function(e){
        var b64=e.target.result.split(',')[1];
        var ext=f.name.split('.').pop().toLowerCase();
        var stored={};
        try{ stored=JSON.parse(localStorage.getItem('uploadedFonts')||'{}'); }catch(e2){}
        stored[type]={b64:b64,mime:ext,name:f.name};
        localStorage.setItem('uploadedFonts',JSON.stringify(stored));
        var cf=DB.get('customFonts')||{};
        cf[type]=f.name.replace(/\.[^.]+$/,'');
        DB.set('customFonts',cf);
        var ids={bangla:'btnBn',english:'btnEn',number:'btnNum'};
        var btn=document.getElementById(ids[type]);
        if(btn){ btn.textContent='✅ '+f.name.slice(0,13); btn.className='fu loaded'; }
        showSt('fntSt','✅ '+f.name+' লোড হয়েছে!','ok');
    };
    r.readAsDataURL(f);
}

function clearFont(type) {
    var stored={};
    try{ stored=JSON.parse(localStorage.getItem('uploadedFonts')||'{}'); }catch(e){}
    delete stored[type];
    localStorage.setItem('uploadedFonts',JSON.stringify(stored));
    var cf=DB.get('customFonts')||{};
    delete cf[type]; DB.set('customFonts',cf);
    var ids={bangla:'btnBn',english:'btnEn',number:'btnNum'};
    var btn=document.getElementById(ids[type]);
    if(btn){ btn.textContent='📁 আপলোড'; btn.className='fu'; }
    showSt('fntSt','🗑️ ফন্ট সরানো হয়েছে','ok');
}

/* ════════════════════════════════════════
   INIT — DOMContentLoaded
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
    // Modal close on backdrop click
    document.querySelectorAll('.modal').forEach(function(m){
        m.addEventListener('click',function(e){ if(e.target===m) m.classList.remove('open'); });
    });

    // Restore saved credentials
    var tgT=localStorage.getItem('da_tg_token'),tgC=localStorage.getItem('da_tg_chatid');
    var tgTEl=document.getElementById('tg_token'), tgCEl=document.getElementById('tg_chatid');
    if(tgT && tgTEl) tgTEl.value=tgT;
    if(tgC && tgCEl) tgCEl.value=tgC;

    var gdEl=document.getElementById('gd_url');
    var gdUrl=localStorage.getItem('da_gd_url');
    if(gdUrl && gdEl) gdEl.value=gdUrl;

    var jbKEl=document.getElementById('jb_key'), jbBEl=document.getElementById('jb_binId');
    var jbK=localStorage.getItem('da_jb_key'), jbB=localStorage.getItem('da_jb_binId');
    if(jbK && jbKEl) jbKEl.value=jbK;
    if(jbB && jbBEl) jbBEl.value=jbB;

    // Font status
    try {
        var s=JSON.parse(localStorage.getItem('uploadedFonts')||'{}');
        var ids={bangla:'btnBn',english:'btnEn',number:'btnNum'};
        Object.keys(s).forEach(function(t){
            var b=document.getElementById(ids[t]);
            if(b && s[t].name){ b.textContent='✅ '+s[t].name.slice(0,13); b.className='fu loaded'; }
        });
    } catch(e){}

    console.log('✅ extra-backup.js v5.1 initialized — All features ready!');
});