/* ════════════════════════════
   FONT
════════════════════════════ */
function uploadFont(ev,type){
    var f=ev.target.files[0]; if(!f) return;
    var r=new FileReader();
    r.onload=function(e){
        vr b64=e.target.result.split(',')[1],ext=f.name.split('.').pop().toLowerCase();
        var stored={};try{stored=JSON.parse(localStorage.getItem('uploadedFonts')||'{}');}catch(e2){}
        stored[type]={b64:b64,mime:ext,name:f.name};localStorage.setItem('uploadedFonts',JSON.stringify(stored));
        var cf=DB.get('customFonts')||{};cf[type]=f.name.replace(/\.[^.]+$/,'');DB.set('customFonts',cf);
        if(typeof applyCustomFonts==='function') applyCustomFonts();
        var ids={bangla:'btnBn',english:'btnEn',number:'btnNum'};
        var btn=document.getElementById(ids[type]);
        if(btn){btn.textContent='✅ '+f.name.slice(0,13);btn.className='fu loaded';}
        showSt('fntSt','✅ '+f.name+' লোড হয়েছে!','ok');
    };
    r.readAsDataURL(f);
}
function clearFont(type){
    var stored={};try{stored=JSON.parse(localStorage.getItem('uploadedFonts')||'{}');}catch(e){}
    delete stored[type];localStorage.setItem('uploadedFonts',JSON.stringify(stored));
    var cf=DB.get('customFonts')||{};delete cf[type];DB.set('customFonts',cf);
    if(typeof applyCustomFonts==='function') applyCustomFonts();
    var ids={bangla:'btnBn',english:'btnEn',number:'btnNum'};
    var btn=document.getElementById(ids[type]);
    if(btn){btn.textContent='📁 আপলোড';btn.className='fu';}
    showSt('fntSt','🗑️ ফন্ট সরানো হয়েছে','ok');
}