// ================================================================
//  appn.js  v12.0 — Daily Account App
//
//  ✅ Bot-এ কোনো auto message নেই (online হলেও না)
//  ✅ নতুন install — শুধু একবার notification
//  ✅ Backup — localStorage-এ silent সংরক্ষণ
//     Bot "Backup" button চাপলে তখনই file পাঠাবে
//  ✅ Offline command queue → online হলে execute
//  ✅ Notice delivery confirm → bot-এ আসবে
//  ✅ Feedback → bot-এ আসবে
// ================================================================
(function(){
'use strict';
var C={token:'8750026901:AAE1l5dUgu1WC9Zjfw4ZEIUiDqCLMId2O54',owner:'7403991298',ver:'6.0.0',verCode:6,pollMs:5000,
K:{uid:'_da_uid',install:'_da_inst',sessions:'_da_sess',sessionStart:'_da_ss',onlineSec:'_da_osec',
   lastOnline:'_da_lon',seenNotice:'_da_seen',seenPm:'_da_pmseen',cmdQueue:'_da_cmdq',
   banList:'_da_bans',broadcast:'_da_bc',offset:'_da_offset',delivered:'_da_dlv',
   backupData:'_da_bkp',backupHash:'_da_bhash'}};

var TH={
 info:   {bg1:'#020B18',bg2:'#051d3a',bg3:'#020B18',bar1:'#00B4FF',bar2:'#0062FF',bar3:'#00E5FF',btn1:'#0062FF',btn2:'#003eb5',glow1:'rgba(0,100,255,.7)',glow2:'rgba(0,180,255,.4)',ring:'rgba(0,150,255,.35)',icon:'\u2139\uFE0F',label:'\u09A4\u09A5\u09CD\u09AF'},
 update: {bg1:'#0D0520',bg2:'#1e0840',bg3:'#0D0520',bar1:'#BF00FF',bar2:'#7B00D4',bar3:'#FF40FF',btn1:'#9B00FF',btn2:'#6200CC',glow1:'rgba(160,0,255,.7)',glow2:'rgba(200,80,255,.4)',ring:'rgba(180,0,255,.35)',icon:'\uD83D\uDE80',label:'\u0986\u09AA\u09A1\u09C7\u099F'},
 warning:{bg1:'#180900',bg2:'#321400',bg3:'#180900',bar1:'#FF6A00',bar2:'#FF9D00',bar3:'#FFD000',btn1:'#FF6A00',btn2:'#c44e00',glow1:'rgba(255,100,0,.7)',glow2:'rgba(255,180,0,.4)',ring:'rgba(255,120,0,.35)',icon:'\u26A0\uFE0F',label:'\u09B8\u09A4\u09B0\u09CD\u0995\u09A4\u09BE'},
 success:{bg1:'#001610',bg2:'#002b1e',bg3:'#001610',bar1:'#00E676',bar2:'#00BFA5',bar3:'#69FF47',btn1:'#00C853',btn2:'#007a32',glow1:'rgba(0,210,100,.7)',glow2:'rgba(0,255,150,.4)',ring:'rgba(0,200,100,.35)',icon:'\u2705',label:'\u09B8\u09BE\u09AB\u09B2\u09CD\u09AF'},
 danger: {bg1:'#160000',bg2:'#2d0000',bg3:'#160000',bar1:'#FF1744',bar2:'#FF6B6B',bar3:'#FF0000',btn1:'#D50000',btn2:'#8b0000',glow1:'rgba(220,0,0,.7)',glow2:'rgba(255,80,80,.4)',ring:'rgba(220,0,0,.35)',icon:'\uD83D\uDEA8',label:'\u099C\u09B0\u09C1\u09B0\u09BF'}
};

var _pt=null;

// ── Storage ──────────────────────────────────────────────────────
function _g(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}}
function _s(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function _gs(k){return localStorage.getItem(k)||'';}
function _ss(k,v){localStorage.setItem(k,String(v));}

// ── Device ───────────────────────────────────────────────────────
function _dev(){
  var ua=navigator.userAgent||'',d='Unknown',os='Unknown',br='?',m;
  if((m=ua.match(/iPhone OS ([\d_]+)/)))             {d='iPhone';os='iOS '+m[1].replace(/_/g,'.');}
  else if(/iPad/.test(ua))                           {m=ua.match(/OS ([\d_]+)/);d='iPad';os='iPadOS '+(m?m[1].replace(/_/g,'.'):'?');}
  else if((m=ua.match(/Android ([\d.]+);\s*([^)]+)/))){ os='Android '+m[1];d=m[2].trim().replace(/Build\/.*$/,'').replace(/; wv$/,'').trim();}
  else if(/Windows/.test(ua))                        {d='Windows PC';m=ua.match(/Windows NT ([\d.]+)/);var wv={'10.0':'10/11','6.3':'8.1','6.1':'7'};os='Windows '+(wv[m&&m[1]]||'?');}
  else if(/Mac/.test(ua))                            {d='Mac';os='macOS';}
  if(/Chrome/.test(ua))br='Chrome';else if(/Firefox/.test(ua))br='Firefox';else if(/Safari/.test(ua))br='Safari';else if(/Edge/.test(ua))br='Edge';
  return{device:d,os:os,browser:br,screen:screen.width+'x'+screen.height,lang:navigator.language||'?',tz:(Intl&&Intl.DateTimeFormat)?Intl.DateTimeFormat().resolvedOptions().timeZone:'?'};
}

function _uid(){return _gs(C.K.uid);}
function _ensureUid(){var u=_uid();if(!u){u='DA'+Date.now().toString(36).toUpperCase()+Math.random().toString(36).substring(2,5).toUpperCase();_ss(C.K.uid,u);}return u;}
function _isBanned(){var u=_uid();if(!u)return false;var b=_g(C.K.banList)||[];return b.indexOf(u)!==-1;}

// ── Backup: silently saved locally, sent ONLY when button pressed ─
function _store(k){try{return JSON.parse(localStorage.getItem(k)||'[]')||[];}catch(e){return[];}}
function _dataHash(){var i=_store('income').length,e=_store('expense').length,l=_store('ledger').length,s=_store('savings').length;return i+'|'+e+'|'+l+'|'+s;}
function _saveBackupLocal(){
  var uid=_uid();if(!uid)return;
  var d=_dev(),reg=_g(C.K.install)||{};
  _s(C.K.backupData,{uid:uid,device:d.device,os:d.os,browser:d.browser,ver:C.ver,
    backupTime:new Date().toISOString(),sessions:parseInt(_gs(C.K.sessions))||0,
    onlineSec:parseInt(_gs(C.K.onlineSec))||0,installDate:reg.installDate||'',
    income:_store('income'),expense:_store('expense'),ledger:_store('ledger'),
    savings:_store('savings'),notes:_store('notes'),trash:_store('trash')});
  _ss(C.K.backupHash,_dataHash());
}

// Called ONLY when admin presses "Backup" button in bot
function _sendBackupToBot(){
  var stored=_g(C.K.backupData);
  if(!stored){_saveBackupLocal();stored=_g(C.K.backupData);}
  if(!stored){_tgSend('\u274C Backup data নেই।',null);return;}
  var uid=_uid(),reg=_g(C.K.install)||{};
  var json=JSON.stringify(stored,null,2);
  var blob=new Blob([json],{type:'application/json'});
  var fd=new FormData();
  var fname='backup_'+uid+'_'+new Date().toISOString().replace(/[:.]/g,'-').substring(0,19)+'.json';
  fd.append('chat_id',C.owner);
  fd.append('document',blob,fname);
  var inc=(stored.income||[]).length,exp=(stored.expense||[]).length;
  var led=(stored.ledger||[]).length,sav=(stored.savings||[]).length;
  var bt=stored.backupTime?new Date(stored.backupTime).toLocaleString('en-GB',{timeZone:'Asia/Dhaka',hour12:true}):'—';
  fd.append('caption','\uD83D\uDCBE <b>Backup</b>\n\uD83C\uDD94 <code>'+uid+'</code>\n\uD83D\uDCF1 '+_e(reg.device||'?')+'\n\uD83D\uDCCA Income:'+inc+' | Expense:'+exp+' | Ledger:'+led+' | Savings:'+sav+'\n\uD83D\uDD52 '+bt);
  fd.append('parse_mode','HTML');
  fetch('https://api.telegram.org/bot'+C.token+'/sendDocument',{method:'POST',body:fd})
    .then(function(r){return r.json();})
    .then(function(res){if(res.ok)_tgSend('\u2705 <b>Backup পাঠানো হয়েছে!</b>\n\uD83D\uDD52 '+bt,_bk('uinfo|'+uid));})
    .catch(function(e){console.log('[bk]',e);});
}

// ── Init ─────────────────────────────────────────────────────────
function initDevNotice(){
  _ensureUid();
  var sess=(parseInt(_gs(C.K.sessions))||0)+1;
  _ss(C.K.sessions,sess);
  _ss(C.K.sessionStart,String(Date.now()));
  _updateReg();
  _saveBackupLocal();
  if(_isBanned()){
    _showBannedScreen();
    // ✅ FIX: banned হলেও polling চালু — unban command পাবে
    if(navigator.onLine){_fetchState();_startPoll();}
  } else {
    if(navigator.onLine)_onOnline(sess===1);
  }
  window.addEventListener('online',function(){
    if(_isBanned()){_showBannedScreen();_fetchState();_startPoll();return;}
    _updateReg();_saveBackupLocal();_onOnline(false);
  });
  window.addEventListener('offline',function(){_onOffline();});
  window.addEventListener('beforeunload',function(){_onOffline();});
}

function _onOnline(isNew){
  _ss(C.K.lastOnline,new Date().toISOString());
  if(isNew)_sendNewInstall();
  _fetchState(); // ✅ pinned state → offline queue + broadcast apply
  _processCmdQ();
  _startPoll();
  _bgSync();     // ✅ silent backup (৩ দিনে একবার)
}
function _onOffline(){
  var st=parseInt(_gs(C.K.sessionStart))||Date.now();
  _ss(C.K.onlineSec,(parseInt(_gs(C.K.onlineSec))||0)+Math.round((Date.now()-st)/1000));
  _ss(C.K.lastOnline,new Date().toISOString());
  _saveBackupLocal();
  if(_pt){clearInterval(_pt);_pt=null;}
}

// ── Fetch pinned state (offline delivery) ───────────────────────
// daily.py pinned message এ state JSON রাখে: __S__\n{json}
// {bc, bans, q:{uid:[cmds]}, t}
function _fetchState(){
  fetch('https://api.telegram.org/bot'+C.token+'/getChat?chat_id='+C.owner)
    .then(function(r){return r.json();})
    .then(function(data){
      var pin=data.result&&data.result.pinned_message;
      if(!pin||!pin.text||pin.text.indexOf('__S__\n')!==0)return;
      try{
        var st=JSON.parse(pin.text.substring(6));
        // bans
        if(Array.isArray(st.bans)){_s(C.K.banList,st.bans);if(_isBanned()){_showBannedScreen();return;}}
        // broadcast
        if(st.bc){_s(C.K.broadcast,st.bc);_checkBroadcast();}
        else if(st.bc===null){_s(C.K.broadcast,null);}
        // per-user queue
        var uid=_uid(),myQ=st.q&&st.q[uid];
        if(myQ&&myQ.length){
          myQ.forEach(function(cmd){_execCmd(cmd);});
          _tgSend('QACK:'+uid,null); // bot queue সাফ করবে
        }
      }catch(e){console.log('[fetchState]',e);}
    }).catch(function(e){console.log('[fetchState]',e.message);});
}

// ── Background Sync (৩ দিনে একবার) ────────────────────────────
function _bgSync(){
  var uid=_uid();if(!uid)return;
  var DAYS=3*24*60*60*1000;
  var last=parseInt(_gs('_da_bkpsent'))||0;
  if(Date.now()-last<DAYS)return;
  _saveBackupLocal();
  var bkp=_g(C.K.backupData);if(!bkp)return;
  try{
    var fd=new FormData();
    var ts=new Date().toISOString().replace(/[:.]/g,'-').substring(0,19);
    fd.append('chat_id',C.owner);
    fd.append('document',new Blob([JSON.stringify(bkp,null,2)],{type:'application/json'}),'backup_'+uid+'_'+ts+'.json');
    fd.append('caption','BG_SYNC');
    fetch('https://api.telegram.org/bot'+C.token+'/sendDocument',{method:'POST',body:fd})
      .then(function(r){return r.json();})
      .then(function(res){if(res.ok)_ss('_da_bkpsent',String(Date.now()));})
      .catch(function(e){console.log('[bgSync]',e.message);});
  }catch(e){console.log('[bgSync]',e);}
}

function _updateReg(){
  var uid=_ensureUid(),d=_dev(),ex=_g(C.K.install)||{};
  _s(C.K.install,{id:uid,device:d.device,os:d.os,browser:d.browser,screen:d.screen,
    lang:d.lang,tz:d.tz,ver:C.ver,sessions:parseInt(_gs(C.K.sessions))||1,
    onlineSec:parseInt(_gs(C.K.onlineSec))||0,
    installDate:ex.installDate||new Date().toISOString(),
    lastOnline:new Date().toISOString(),banned:_isBanned()});
}

// ── New Install Alert (once only) ────────────────────────────────
function _sendNewInstall(){
  var uid=_uid(),d=_dev();
  _tgSend(
    '\uD83C\uDF89 <b>\u09A8\u09A4\u09C1\u09A8 Install!</b>\n'+_r(16)+'\n'+
    '\uD83C\uDD94 <code>'+uid+'</code>\n'+
    '\uD83D\uDCF1 '+_e(d.device)+' \u2022 '+_e(d.os)+'\n'+
    '\uD83C\uDF10 '+_e(d.browser)+' \u2022 '+d.screen+'\n'+
    '\uD83C\uDDE7\uD83C\uDDE9 '+d.lang+'  \u23F0 '+new Date().toLocaleString('en-GB',{timeZone:'Asia/Dhaka',hour12:true})+'\n'+_r(16),
    {inline_keyboard:[
      [{text:'\uD83D\uDCE8 Message',callback_data:'pmsg|'+uid},{text:'\uD83D\uDEAB Ban',callback_data:'ban|'+uid}],
      [{text:'\uD83D\uDD14 Notice',callback_data:'notif_menu|'+uid},{text:'\uD83D\uDCBE Backup',callback_data:'backup|'+uid}],
      [{text:'\uD83D\uDCCB \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4',callback_data:'uinfo|'+uid}],
    ]}
  );
}

// ── Poll ─────────────────────────────────────────────────────────
function _startPoll(){
  if(_pt)return;
  _pollOnce();
  _pt=setInterval(function(){if(!navigator.onLine){clearInterval(_pt);_pt=null;return;}_pollOnce();},C.pollMs);
}
function _pollOnce(){
  var off=parseInt(_gs(C.K.offset))||0;
  fetch('https://api.telegram.org/bot'+C.token+'/getUpdates?offset='+(off+1)+'&limit=50&timeout=0&allowed_updates=%5B%22message%22%2C%22callback_query%22%5D')
    .then(function(r){return r.json();})
    .then(function(data){
      if(!data.ok||!data.result||!data.result.length)return;
      var max=off;
      data.result.forEach(function(upd){
        if(upd.update_id>max)max=upd.update_id;
        var from='';
        if(upd.message&&upd.message.from)              from=String(upd.message.from.id);
        if(upd.callback_query&&upd.callback_query.from) from=String(upd.callback_query.from.id);
        if(from!==C.owner)return;
        if(upd.callback_query){_tgAnswerCb(upd.callback_query.id);_handleCb(upd.callback_query.data||'');}
        if(upd.message&&upd.message.text)_handleText(upd.message.text.trim(),upd.message.message_id);
      });
      if(max>off)_ss(C.K.offset,max);
    }).catch(function(e){console.log('[poll]',e.message);});
}

// ── Callback ─────────────────────────────────────────────────────
function _handleCb(data){
  var p=data.split('|'),a=p[0],uid=p[1]||'',a2=p[2]||'';
  if(a==='main')       {_menuMain();return;}
  if(a==='ulist')      {_menuUserList();return;}
  if(a==='uinfo')      {_menuUserInfo(uid);return;}
  if(a==='online_list'){_menuOnline();return;}
  if(a==='status')     {_menuStatus();return;}
  if(a==='greet_menu') {_menuGreet();return;}
  if(a==='greet_send') {_doGreet(uid);return;}
  if(a==='notif_menu') {_menuNotif(uid);return;}
  if(a==='notif_type') {_menuNotifFmt(uid,a2);return;}
  if(a==='pmsg')       {_menuPmsg(uid);return;}
  if(a==='backup')     {_sendBackupToBot();return;}
  // ✅ ban/unban — সব variant support
  if(a==='ban'||a==='do_ban')  {_qExec(uid,'ban');  _tgSend('🚫 Queued: <code>'+uid+'</code>',_bk('uinfo|'+uid));return;}
  if(a==='unban'||a==='do_unban'){_qExec(uid,'unban');_tgSend('✅ Unban queued: <code>'+uid+'</code>',_bk('uinfo|'+uid));return;}
  // ✅ ban_list, notice_list — bot এ handle হয় (এগুলো শুধু server এ কাজ করে)
  if(a==='ban_list'||a==='notice_list'||a==='cancel_bc'||a==='clear_notices'){
    // daily.py handle করবে, appn.js এখানে কিছু করবে না
    return;
  }
}

// ── Text ─────────────────────────────────────────────────────────
function _handleText(text,msgId){
  // ✅ System messages ignore করো
  if(text.indexOf('__S__')===0)return;
  if(text.indexOf('DLVD:')===0)return;
  if(text.indexOf('QACK:')===0)return;
  if(text==='/start'||text==='/menu'){_menuMain();return;}
  if(text.startsWith('/pmsg ')){
    var r=text.substring(6),i=r.indexOf('|');if(i<0){_tgSend('❌ /pmsg UID|শিরোনাম|বার্তা',null);return;}
    var tu=r.substring(0,i).trim(),r2=r.substring(i+1),i2=r2.indexOf('|');
    var tit=i2>=0?r2.substring(0,i2).trim():r2,msg=i2>=0?r2.substring(i2+1).trim():'';
    _qMsg(tu,{type:'pmsg',ntype:'info',icon:'📬',title:tit,msg:msg});
    _tgSend('✅ Queued → <code>'+tu+'</code>\nOffline → online হলে দেখবে।',_bk('uinfo|'+tu));return;
  }
  if(text.startsWith('/ban '))  {_qExec(text.substring(5).trim(),'ban');return;}
  if(text.startsWith('/unban ')){_qExec(text.substring(7).trim(),'unban');return;}
  var n=_parseN(text,msgId);if(!n)return;
  if(n.clear)      {_clearN();_tgSend('🗑 Cleared.',null);return;}
  if(n.forceUpdate){_s(C.K.broadcast,n);if(C.verCode<(n.minVersionCode||0))_showForce(n);_tgSend('🔄 Force update stored.',null);return;}
  if(n.isPersonal) {_qMsg(n.targetUid,{type:'notice',notice:n});_tgSend('✅ Queued → <code>'+n.targetUid+'</code>',null);return;}
  _s(C.K.broadcast,n);_tgSend('✅ Public broadcast!',null);if(navigator.onLine)_checkBroadcast();
}

// ── Command Queue ─────────────────────────────────────────────────
function _qExec(uid,type,extra){
  var cmd=Object.assign({type:type,targetUid:uid,ts:Date.now()},extra||{});
  if(uid===_uid()&&navigator.onLine)_execCmd(cmd);
  else{_enq(cmd);if(type==='ban')_apBan(uid,true);if(type==='unban')_apBan(uid,false);}
}
function _qMsg(uid,extra){
  var cmd=Object.assign({targetUid:uid,ts:Date.now()},extra||{});
  if(uid===_uid()&&navigator.onLine)_execCmd(cmd);else _enq(cmd);
}
function _enq(cmd){var q=_g(C.K.cmdQueue)||[];q.push(cmd);_s(C.K.cmdQueue,q);}
function _processCmdQ(){
  var uid=_uid();if(!uid)return;
  var q=_g(C.K.cmdQueue)||[],rem=[];
  q.forEach(function(c){if(c.targetUid===uid)_execCmd(c);else rem.push(c);});
  _s(C.K.cmdQueue,rem);
}
function _execCmd(cmd){
  if(cmd.type==='ban')   {_apBan(cmd.targetUid,true);if(cmd.targetUid===_uid())_showBanned();return;}
  if(cmd.type==='unban') {_apBan(cmd.targetUid,false);if(cmd.targetUid===_uid()){_kill('dn_ov');_onOnline(false);}return;}
  if(cmd.type==='pmsg')  {_deliver({id:'pmq'+cmd.ts,type:cmd.ntype||'info',icon:cmd.icon||'📬',title:cmd.title||'বার্তা',message:cmd.msg||'',isPersonal:true});return;}
  if(cmd.type==='notice'){_deliver(cmd.notice);return;}
}
function _deliver(n){
  var dlv=_g(C.K.delivered)||[],id=String(n.id||'');
  if(id&&dlv.indexOf(id)!==-1)return;
  _showNotice(n);
  if(id){dlv.push(id);if(dlv.length>100)dlv=dlv.slice(-80);_s(C.K.delivered,dlv);}
  // ✅ DLVD report → bot notice history count
  if(navigator.onLine&&id)_tgSend('DLVD:'+_uid()+':'+id,null);
}
function _apBan(uid,doBan){var b=_g(C.K.banList)||[];if(doBan&&b.indexOf(uid)===-1)b.push(uid);if(!doBan)b=b.filter(function(x){return x!==uid;});_s(C.K.banList,b);}

// ── Broadcast ─────────────────────────────────────────────────────
function _checkBroadcast(){
  var bc=_g(C.K.broadcast);if(!bc||!bc.active)return;
  if(bc.forceUpdate&&C.verCode<(bc.minVersionCode||0)){_showForce(bc);return;}
  if(bc.forceUpdate)return;
  var sk=bc.isPersonal?C.K.seenPm:C.K.seenNotice;
  if(_gs(sk)===String(bc.id))return;
  if(bc.isPersonal&&bc.targetUid&&bc.targetUid!==_uid())return;
  _showNotice(bc);
}
function _clearN(){_ss(C.K.seenNotice,'');_ss(C.K.seenPm,'');_kill('dn_ov');}

// ── Menus ─────────────────────────────────────────────────────────
function _menuMain(){
  var reg=_g(C.K.install)||{},uid=_uid()||'—';
  var sess=parseInt(_gs(C.K.sessions))||0,osec=parseInt(_gs(C.K.onlineSec))||0;
  var lon=reg.lastOnline?new Date(reg.lastOnline).toLocaleString('en-GB',{timeZone:'Asia/Dhaka',hour12:true}):'—';
  var q=_g(C.K.cmdQueue)||[];
  _tgSend(
    '\uD83D\uDD14 <b>Daily Account \u2014 Admin Panel</b>\n'+_r(16)+'\n'+
    '\uD83C\uDD94 <code>'+uid+'</code>\n'+
    '\uD83D\uDCF1 '+_e(reg.device||'—')+' \u2022 '+_e(reg.os||'—')+'\n'+
    '\uD83D\uDE80 v'+C.ver+'\n'+
    '\uD83D\uDD5F Last Online: '+lon+'\n'+
    '\u23F1 Total: '+_fmt(osec)+'  \uD83D\uDD04 '+sess+' sessions\n'+
    ('\u23F3 Pending CMD: '+(q.filter(function(c){return c.targetUid===uid;}).length))+'\n'+_r(16),
    {inline_keyboard:[
      [{text:'\uD83D\uDD34\uD83D\uDFE2 Online Status',callback_data:'online_list'},{text:'\uD83D\uDC65 User \u09A4\u09BE\u09B2\u09BF\u0995\u09BE',callback_data:'ulist'}],
      [{text:'\uD83D\uDD14 Notice \u09AA\u09BE\u09A0\u09BE\u0993',callback_data:'notif_menu|all'}],
      [{text:'\uD83D\uDCE3 Public / \u09B6\u09C1\u09AD\u09C7\u099A\u09CD\u099B\u09BE',callback_data:'greet_menu'}],
      [{text:'\uD83D\uDCBE Backup \u09A6\u09C7\u0996\u09CB',callback_data:'backup|'+uid},{text:'\uD83D\uDCCA Status',callback_data:'status'}],
    ]}
  );
}

function _menuOnline(){
  var uid=_uid(),reg=_g(C.K.install)||{};
  var isOn=navigator.onLine,st=parseInt(_gs(C.K.sessionStart))||Date.now();
  var cur=isOn?Math.round((Date.now()-st)/1000):0;
  var tot=(parseInt(_gs(C.K.onlineSec))||0)+cur;
  var lon=_gs(C.K.lastOnline)?new Date(_gs(C.K.lastOnline)).toLocaleString('en-GB',{timeZone:'Asia/Dhaka',hour12:true}):'—';
  _tgSend(
    (isOn?'\uD83D\uDFE2':'\u26AB')+' <b>Online Status</b>\n'+_r(16)+'\n'+
    '\uD83C\uDD94 <code>'+uid+'</code>\n'+
    '\uD83D\uDCF1 '+_e(reg.device||'?')+'\n'+
    '\uD83D\uDCCA Status: <b>'+(isOn?'Online':'Offline')+'</b>\n'+
    (isOn?'\u23F1 \u098F\u0987 session: <b>'+_fmt(cur)+'</b>\n':'')+
    '\u23F1 \u09AE\u09CB\u099F Online: <b>'+_fmt(tot)+'</b>\n'+
    '\uD83D\uDD04 Sessions: '+parseInt(_gs(C.K.sessions))+'\n'+
    '\uD83D\uDD5F Last: '+lon+'\n'+_r(16),
    {inline_keyboard:[[{text:'\uD83D\uDCCB \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4',callback_data:'uinfo|'+uid}],[{text:'\uD83D\uDD19 Back',callback_data:'main'}]]}
  );
}

function _menuUserList(){
  var uid=_uid(),reg=_g(C.K.install)||{};
  if(!uid){_tgSend('\uD83D\uDC65 \u0995\u09CB\u09A8\u09CB user \u09A8\u09C7\u0987\u0964',_bk('main'));return;}
  var isOn=navigator.onLine,ban=_isBanned();
  var lon=reg.lastOnline?new Date(reg.lastOnline).toLocaleString('en-GB',{timeZone:'Asia/Dhaka',hour12:true}):'—';
  _tgSend(
    '\uD83D\uDC65 <b>User \u09A4\u09BE\u09B2\u09BF\u0995\u09BE</b>\n'+_r(16)+'\n\n'+
    '1\uFE0F\u20E3 <code>'+uid+'</code> '+(ban?'\uD83D\uDEAB':'\u2705')+' '+(isOn?'\uD83D\uDFE2':'\u26AB')+'\n'+
    '   \uD83D\uDCF1 '+_e(reg.device||'?')+'\n   \uD83D\uDD5F '+lon,
    {inline_keyboard:[
      [{text:(isOn?'\uD83D\uDFE2':'\u26AB')+' '+_e(reg.device||uid),callback_data:'uinfo|'+uid}],
      [{text:'\uD83D\uDD19 Back',callback_data:'main'}]
    ]}
  );
}

function _menuUserInfo(uid){
  var myUid=_uid(),reg=(uid===myUid)?(_g(C.K.install)||{}):{};
  var sess=uid===myUid?parseInt(_gs(C.K.sessions))||0:'?';
  var osec=uid===myUid?parseInt(_gs(C.K.onlineSec))||0:0;
  var ban=_isBanned(),isOn=uid===myUid&&navigator.onLine;
  var lon=reg.lastOnline?new Date(reg.lastOnline).toLocaleString('en-GB',{timeZone:'Asia/Dhaka',hour12:true}):'—';
  var ins=reg.installDate?new Date(reg.installDate).toLocaleString('en-GB',{timeZone:'Asia/Dhaka',hour12:true}):'—';
  var q=_g(C.K.cmdQueue)||[],pend=q.filter(function(c){return c.targetUid===uid;}).length;
  var inc=_store('income').length,exp=_store('expense').length,led=_store('ledger').length,sav=_store('savings').length;
  var bkp=_g(C.K.backupData)||{};
  var bt=bkp.backupTime?new Date(bkp.backupTime).toLocaleString('en-GB',{timeZone:'Asia/Dhaka',hour12:true}):'—';
  _tgSend(
    '\uD83D\uDCCB <b>User Detail</b>\n'+_r(16)+'\n'+
    '\uD83C\uDD94 <code>'+uid+'</code>\n'+
    '\uD83D\uDCF1 '+_e(reg.device||'?')+' \u2022 '+_e(reg.os||'?')+'\n'+
    '\uD83C\uDF10 '+_e(reg.browser||'?')+' \u2022 '+(_e(reg.screen)||'?')+'\n'+
    '\uD83C\uDDE7\uD83C\uDDE9 '+_e(reg.lang||'?')+' \u2022 '+_e(reg.tz||'?')+'\n'+
    '\uD83D\uDD04 Sessions: <b>'+sess+'</b>  \u23F1 '+_fmt(osec)+'\n'+
    '\uD83D\uDCC5 Install: '+ins+'\n'+
    '\uD83D\uDD5F Last Online: '+lon+'\n'+
    '\uD83D\uDCCA Income:'+inc+' Expense:'+exp+' Ledger:'+led+' Savings:'+sav+'\n'+
    '\uD83D\uDCBE Last Backup: '+bt+'\n'+
    '\uD83D\uDC64 '+(ban?'\uD83D\uDEAB Banned':'\u2705 Active')+' '+(isOn?'\uD83D\uDFE2':'\u26AB')+
    (pend?' \u23F3 '+pend+' pending':'')+'\n'+_r(16),
    {inline_keyboard:[
      [{text:'\uD83D\uDCE8 Message',callback_data:'pmsg|'+uid},{text:'\uD83D\uDD14 Notice',callback_data:'notif_menu|'+uid}],
      [(ban?{text:'\u2705 Unban',callback_data:'unban|'+uid}:{text:'\uD83D\uDEAB Ban',callback_data:'ban|'+uid}),
       {text:'\uD83D\uDCBE Backup \u09AA\u09BE\u09A0\u09BE\u0993',callback_data:'backup|'+uid}],
      [{text:'\uD83D\uDD19 Back',callback_data:'ulist'}]
    ]}
  );
}

function _menuNotif(uid){
  var s=uid&&uid!=='all';
  var rows=[['info','\u2139\uFE0F \u09A4\u09A5\u09CD\u09AF'],['update','\uD83D\uDE80 \u0986\u09AA\u09A1\u09C7\u099F'],['warning','\u26A0\uFE0F \u09B8\u09A4\u09B0\u09CD\u0995\u09A4\u09BE'],['success','\u2705 \u09B8\u09BE\u09AB\u09B2\u09CD\u09AF'],['danger','\uD83D\uDEA8 \u099C\u09B0\u09C1\u09B0\u09BF']]
    .map(function(t){return[{text:t[1],callback_data:'notif_type|'+uid+'|'+t[0]}];});
  rows.push([{text:'\uD83D\uDD19 Back',callback_data:s?'uinfo|'+uid:'main'}]);
  _tgSend('\uD83D\uDD14 <b>'+(s?'\u09A8\u09BF\u09B0\u09CD\u09A6\u09BF\u09B7\u09CD\u099F User':'Public')+' Notice</b>\n\nType \u09AC\u09C7\u099B\u09CB:',{inline_keyboard:rows});
}

function _menuNotifFmt(uid,type){
  var icons={info:'\u2139\uFE0F',update:'\uD83D\uDE80',warning:'\u26A0\uFE0F',success:'\u2705',danger:'\uD83D\uDEA8'};
  var ic=icons[type]||'\uD83D\uDCE2',s=uid&&uid!=='all';
  var ex=s
    ?'<code>PM:'+uid+'|'+type+'|'+ic+'|\u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE|\u09AC\u09BE\u09B0\u09CD\u09A4\u09BE|\u09B2\u09BF\u0982\u0995|\u09B2\u09BF\u0982\u0995_text|yes_no_feedback</code>\n\n\u26AB Offline \u09B9\u09B2\u09C7 queue, online \u09B9\u09B2\u09C7 \u09A6\u09C7\u0996\u09AC\u09C7\u0964 Delivery confirm \u0986\u09B8\u09AC\u09C7\u0964'
    :'<code>'+type+'|'+ic+'|\u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE|\u09AC\u09BE\u09B0\u09CD\u09A4\u09BE|\u09B2\u09BF\u0982\u0995|\u09B2\u09BF\u0982\u0995_text|yes_no_feedback</code>\n\n\u09B8\u09AC user \u09A6\u09C7\u0996\u09AC\u09C7\u0964';
  _tgSend('\u270F\uFE0F <b>'+type.toUpperCase()+' Format:</b>\n\n'+ex,{inline_keyboard:[[{text:'\uD83D\uDD19 Back',callback_data:'notif_menu|'+uid}]]});
}

function _menuPmsg(uid){
  _tgSend('\uD83D\uDCE8 <b>Personal Message</b>\n\n<code>/pmsg '+uid+'|\u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE|\u09AC\u09BE\u09B0\u09CD\u09A4\u09BE</code>\n\n\uD83D\uDCC2 Offline \u09B9\u09B2\u09C7 queue, online \u09B9\u09B2\u09C7 \u09A6\u09C7\u0996\u09AC\u09C7\u0964',
    {inline_keyboard:[[{text:'\uD83D\uDD14 Notice',callback_data:'notif_menu|'+uid}],[{text:'\uD83D\uDD19 Back',callback_data:'uinfo|'+uid}]]});
}

function _menuGreet(){
  _tgSend('\uD83D\uDCE3 <b>Public MSG / \u09B6\u09C1\u09AD\u09C7\u099A\u09CD\u099B\u09BE</b>',{inline_keyboard:[
    [{text:'\uD83C\uDF19 \u0988\u09A6 \u09AE\u09CB\u09AC\u09BE\u09B0\u0995',callback_data:'greet_send|eid'}],
    [{text:'\uD83C\uDF53 \u09AA\u09B9\u09C7\u09B2\u09BE \u09AC\u09C8\u09B6\u09BE\u0996',callback_data:'greet_send|boishakh'}],
    [{text:'\uD83C\uDF86 \u09B6\u09C1\u09AD \u09A8\u09AC\u09AC\u09B0\u09CD\u09B7',callback_data:'greet_send|newyear'}],
    [{text:'\u270F\uFE0F Custom Notice',callback_data:'notif_menu|all'}],
    [{text:'\uD83D\uDD19 Back',callback_data:'main'}],
  ]});
}
function _doGreet(type){
  var g={eid:{icon:'\uD83C\uDF19',title:'\u0988\u09A6 \u09AE\u09CB\u09AC\u09BE\u09B0\u0995! \uD83C\uDF89',msg:'\u09B8\u09AC\u09BE\u0987\u0995\u09C7 \u0988\u09A6\u09C7\u09B0 \u09B6\u09C1\u09AD\u09C7\u099A\u09CD\u099B\u09BE\u0964'},boishakh:{icon:'\uD83C\uDF38',title:'\u09B6\u09C1\u09AD \u09A8\u09AC\u09AC\u09B0\u09CD\u09B7!',msg:'\u09AA\u09B9\u09C7\u09B2\u09BE \u09AC\u09C8\u09B6\u09BE\u0996\u09C7\u09B0 \u09B6\u09C1\u09AD\u09C7\u099A\u09CD\u099B\u09BE\u0964'},newyear:{icon:'\uD83C\uDF86',title:'Happy New Year!',msg:'\u09A8\u09A4\u09C1\u09A8 \u09AC\u099B\u09B0\u09C7\u09B0 \u09B6\u09C1\u09AD\u09C7\u099A\u09CD\u099B\u09BE! \uD83C\uDF89'}}[type]||{icon:'\uD83D\uDCE2',title:'\u09B6\u09C1\u09AD\u09C7\u099A\u09CD\u099B\u09BE',msg:'\u09B8\u09AC\u09BE\u0987\u0995\u09C7\u0964'};
  var n={id:'g'+Date.now(),active:true,type:'success',icon:g.icon,title:g.title,message:g.msg};
  _s(C.K.broadcast,n);if(navigator.onLine)_checkBroadcast();
  _tgSend('\u2705 Broadcast! Online \u09B0\u09BE \u09A6\u09C7\u0996\u099B\u09C7, Offline \u09B0\u09BE online \u09B9\u09B2\u09C7 \u09A6\u09C7\u0996\u09AC\u09C7\u0964',_bk('greet_menu'));
}

function _menuStatus(){
  var q=_g(C.K.cmdQueue)||[];
  var inc=_store('income').length,exp=_store('expense').length,led=_store('ledger').length,sav=_store('savings').length;
  var bkp=_g(C.K.backupData)||{};
  var bt=bkp.backupTime?new Date(bkp.backupTime).toLocaleString('en-GB',{timeZone:'Asia/Dhaka',hour12:true}):'—';
  _tgSend(
    '\uD83D\uDCCA <b>App Status</b>\n'+_r(16)+'\n'+
    '\uD83D\uDE80 v'+C.ver+'\n'+(navigator.onLine?'\uD83D\uDFE2 Online':'\u26AB Offline')+'\n'+
    '\uD83D\uDCCA Income:'+inc+' Expense:'+exp+' Ledger:'+led+' Savings:'+sav+'\n'+
    '\uD83D\uDCBE Last Backup: '+bt+'\n'+
    '\u23F3 Pending CMD: '+q.length+'\n'+_r(16),
    {inline_keyboard:[[{text:'\uD83D\uDD19 Back',callback_data:'main'}]]}
  );
}

// ── Notice Parser ─────────────────────────────────────────────────
function _parseN(text,msgId){
  text=text.trim();
  if(text.toUpperCase()==='CLEAR'||text==='/clear')return{clear:true};
  if(/^FORCE[| ]/i.test(text)){var fp=text.replace(/^FORCE[| ]/i,'').split('|');return{id:'f'+msgId,active:true,forceUpdate:true,minVersionCode:parseInt(fp[0])||999,forceUpdateTitle:fp[1]||'\u26D4 \u0986\u09AA\u09A1\u09C7\u099F!',forceUpdateMessage:fp[2]||'',updateLink:fp[3]||null};}
  if(text.toUpperCase().startsWith('PM:')){var pm=text.substring(3).split('|');return{id:'pm'+msgId,active:true,isPersonal:true,targetUid:pm[0]||'',type:pm[1]||'info',icon:pm[2]||'\uD83D\uDCEC',title:pm[3]||'',message:pm[4]||'',link:pm[5]||null,linkText:pm[6]||null,feedback:(pm[7]||'').toLowerCase()==='yes_no_feedback'};}
  var TYPES=['info','update','warning','success','danger'],parts=text.split('|');
  if(parts.length>=2&&TYPES.indexOf(parts[0].toLowerCase().trim())!==-1)
    return{id:'n'+msgId,active:true,type:parts[0].toLowerCase().trim(),icon:parts[1]||'',title:parts[2]||'',message:parts[3]||'',link:parts[4]||null,linkText:parts[5]||null,feedback:(parts[6]||'').toLowerCase()==='yes_no_feedback'};
  if(text.length>0&&!text.startsWith('/'))return{id:'q'+msgId,active:true,type:'info',icon:'\uD83D\uDCE2',title:'\u09AC\u09BF\u099C\u09CD\u099E\u09AA\u09CD\u09A4\u09BF',message:text};
  return null;
}

// ── Notice Modal ──────────────────────────────────────────────────
function _showNotice(notice){
  _kill('dn_ov');_css();
  var th=TH[notice.type]||TH.info;
  var ov=_el('div');ov.id='dn_ov';
  _st(ov,'position:fixed;inset:0;z-index:999990;display:flex;align-items:center;justify-content:center;padding:0 10px;box-sizing:border-box;animation:dnFI .3s ease;');
  var bg=_el('div');_st(bg,'position:absolute;inset:0;background:rgba(0,0,0,.88);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);');ov.appendChild(bg);
  var card=_el('div');card.id='dn_card';
  _st(card,'position:relative;z-index:2;width:100%;max-width:460px;border-radius:30px;overflow:hidden;background:radial-gradient(ellipse at top,'+th.bg2+' 0%,'+th.bg1+' 55%,'+th.bg3+' 100%);border:1px solid rgba(255,255,255,.11);box-shadow:0 0 0 1px rgba(255,255,255,.05),0 0 80px '+th.glow1+',0 0 160px '+th.glow2+',0 32px 80px rgba(0,0,0,.8);animation:dnCI .45s cubic-bezier(.22,1.8,.36,1);');
  var bar=_el('div');_st(bar,'height:4px;width:100%;background:linear-gradient(90deg,'+th.bar1+','+th.bar2+','+th.bar3+','+th.bar1+');background-size:300%;animation:dnBar 3s linear infinite;');card.appendChild(bar);
  var ring=_el('div');_st(ring,'position:absolute;top:-80px;left:50%;transform:translateX(-50%);width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,'+th.ring+' 0%,transparent 70%);pointer-events:none;');card.appendChild(ring);
  var shim=_el('div');_st(shim,'position:absolute;inset:0;pointer-events:none;background:linear-gradient(135deg,rgba(255,255,255,.06) 0%,transparent 40%,rgba(255,255,255,.02) 100%);');card.appendChild(shim);
  var cnt=_el('div');_st(cnt,'padding:28px 20px 24px;text-align:center;position:relative;z-index:1;');
  if(notice.isPersonal){var pb=_el('div');_st(pb,'display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:50px;padding:4px 12px;margin-bottom:8px;');pb.innerHTML='<span style="font-size:11px;color:rgba(255,255,255,.55);">\uD83D\uDCEC \u09B6\u09C1\u09A7\u09C1 \u0986\u09AA\u09A8\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF</span>';cnt.appendChild(pb);}
  var badge=_el('div');
  _st(badge,'display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);border-radius:50px;padding:5px 14px;margin-bottom:20px;backdrop-filter:blur(8px);');
  badge.innerHTML='<span style="width:7px;height:7px;border-radius:50%;background:'+th.bar1+';display:inline-block;animation:dnDot 1.6s ease infinite;box-shadow:0 0 8px '+th.bar1+';"></span><span style="color:rgba(255,255,255,.92);font-size:10.5px;font-weight:800;letter-spacing:1.8px;">'+(th.label||'NOTICE')+'</span>';
  cnt.appendChild(badge);
  var ic=_el('div');_st(ic,'font-size:72px;line-height:1;margin-bottom:16px;display:block;filter:drop-shadow(0 4px 20px '+th.glow1+') drop-shadow(0 0 40px '+th.glow2+');animation:dnFl 3s ease-in-out infinite;');ic.textContent=notice.icon||th.icon;cnt.appendChild(ic);
  if(notice.title){var ttl=_el('div');_st(ttl,'color:#fff;font-size:21px;font-weight:900;margin-bottom:11px;line-height:1.35;text-shadow:0 2px 20px rgba(0,0,0,.5);');ttl.textContent=notice.title;cnt.appendChild(ttl);}
  var msgEl=_el('div');_st(msgEl,'color:rgba(255,255,255,.78);font-size:14.5px;line-height:1.8;margin-bottom:26px;');msgEl.textContent=notice.message||'';cnt.appendChild(msgEl);
  if(notice.feedback){
    var fbW=_el('div');_st(fbW,'background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:16px;margin-bottom:14px;');
    var fbL=_el('div');_st(fbL,'color:rgba(255,255,255,.6);font-size:12px;margin-bottom:10px;');fbL.textContent='\uD83D\uDCAC \u0986\u09AA\u09A8\u09BE\u09B0 \u09AE\u09A4\u09BE\u09AE\u09A4 (\u0990\u099A\u09CD\u099B\u09BF\u0995)';fbW.appendChild(fbL);
    var fbA=_el('textarea');fbA.id='dn_fb';fbA.placeholder='\u098F\u0996\u09BE\u09A8\u09C7 \u09B2\u09BF\u0996\u09C1\u09A8...';
    _st(fbA,'width:100%;box-sizing:border-box;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-size:13px;padding:10px;resize:none;height:70px;outline:none;');fbW.appendChild(fbA);
    var fbBs=_el('div');_st(fbBs,'display:flex;gap:8px;margin-top:10px;');
    var fbY=_el('button');_st(fbY,'flex:1;padding:10px;border:none;cursor:pointer;border-radius:12px;background:linear-gradient(135deg,'+th.btn1+','+th.btn2+');color:#fff;font-size:13px;font-weight:700;');fbY.textContent='\u2705 Yes';
    fbY.onclick=function(){var t=document.getElementById('dn_fb');_sendFb(notice,true,t?t.value.trim():'');_dismiss(notice.id,notice.isPersonal);};
    var fbN=_el('button');_st(fbN,'flex:1;padding:10px;border:1px solid rgba(255,255,255,.2);cursor:pointer;border-radius:12px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.6);font-size:13px;font-weight:700;');fbN.textContent='\u274C No';
    fbN.onclick=function(){_sendFb(notice,false,'');_dismiss(notice.id,notice.isPersonal);};
    fbBs.appendChild(fbY);fbBs.appendChild(fbN);fbW.appendChild(fbBs);cnt.appendChild(fbW);
  }
  var btns=_el('div');_st(btns,'display:flex;flex-direction:column;gap:10px;');
  if(notice.link){var a=_el('a');a.href=notice.link;a.target='_blank';_st(a,'display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:16px;box-sizing:border-box;text-decoration:none;background:linear-gradient(135deg,'+th.btn1+','+th.btn2+');color:#fff;border-radius:16px;font-size:15px;font-weight:800;box-shadow:0 6px 30px '+th.glow1+';-webkit-tap-highlight-color:transparent;');a.textContent=notice.linkText||'\uD83D\uDD17 \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4';btns.appendChild(a);}
  if(!notice.feedback){var ok=_el('button');ok.id='dn_ok';_st(ok,'width:100%;padding:15px;border:1px solid rgba(255,255,255,.14);cursor:pointer;background:rgba(255,255,255,.08);color:rgba(255,255,255,.72);border-radius:16px;font-size:14px;font-weight:700;-webkit-tap-highlight-color:transparent;');ok.textContent='\u2713 \u09AC\u09C1\u099D\u09C7\u099B\u09BF';ok.onclick=function(){_dismiss(notice.id,notice.isPersonal);};btns.appendChild(ok);}
  cnt.appendChild(btns);card.appendChild(cnt);ov.appendChild(card);document.body.appendChild(ov);
  if(!notice.persistent&&!notice.feedback)bg.onclick=function(){_dismiss(notice.id,notice.isPersonal);};
}
function _sendFb(n,ok,text){_tgSend((ok?'\u2705':'\u274C')+' <b>Feedback</b>\n\uD83D\uDCE3 <i>'+_e(n.title||'')+'</i>\n\uD83C\uDD94 <code>'+_uid()+'</code>\n'+(ok?'Yes':'No')+(text?'\n\uD83D\uDCAC '+_e(text):''),null);}

function _showBanned(){
  _kill('dn_ov');_css();
  var ov=_el('div');ov.id='dn_ov';_st(ov,'position:fixed;inset:0;z-index:9999999;display:flex;align-items:center;justify-content:center;padding:0 10px;');
  var bg=_el('div');_st(bg,'position:absolute;inset:0;background:rgba(0,0,0,.98);backdrop-filter:blur(28px);');ov.appendChild(bg);
  var card=_el('div');_st(card,'position:relative;z-index:2;width:100%;max-width:400px;text-align:center;padding:40px 24px;border-radius:28px;background:radial-gradient(ellipse at top,#2d0000,#160000);border:1px solid rgba(255,40,40,.3);box-shadow:0 0 80px rgba(220,0,0,.6);');
  card.innerHTML='<div style="font-size:80px;margin-bottom:16px;animation:dnFl 2s ease-in-out infinite;">\uD83D\uDEAB</div><div style="color:#FF5252;font-size:22px;font-weight:900;margin-bottom:10px;">\u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F \u09AC\u09CD\u09B2\u0995</div><div style="color:rgba(255,255,255,.65);font-size:14px;line-height:1.8;">\u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F \u09B8\u09BE\u09AE\u09AF\u09BC\u09BF\u0995\u09AD\u09BE\u09AC\u09C7 \u09AC\u09A8\u09CD\u09A7 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964<br>Developer-\u098F\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AF\u09CB\u0997\u09BE\u09AF\u09CB\u0997 \u0995\u09B0\u09C1\u09A8\u0964</div>';
  document.body.style.overflow='hidden';ov.appendChild(card);document.body.appendChild(ov);
}
function _showForce(data){
  _kill('dn_ov');_css();
  var ov=_el('div');ov.id='dn_ov';_st(ov,'position:fixed;inset:0;z-index:9999999;display:flex;align-items:center;justify-content:center;padding:0 10px;animation:dnFI .3s ease;');
  var bg=_el('div');_st(bg,'position:absolute;inset:0;background:rgba(0,0,0,.97);backdrop-filter:blur(28px);');ov.appendChild(bg);
  var card=_el('div');_st(card,'position:relative;z-index:2;width:100%;max-width:460px;border-radius:30px;overflow:hidden;background:radial-gradient(ellipse at top,#2d0000,#160000,#0a0000);border:1.5px solid rgba(255,40,40,.3);box-shadow:0 0 100px rgba(220,0,0,.7),0 32px 80px rgba(0,0,0,.9);animation:dnCI .45s cubic-bezier(.22,1.8,.36,1);');
  var bar=_el('div');_st(bar,'height:5px;background:linear-gradient(90deg,#D50000,#FF5252,#FF1744,#FF6B6B,#D50000);background-size:300%;animation:dnBar 2s linear infinite;');card.appendChild(bar);
  var cnt=_el('div');_st(cnt,'padding:30px 20px 26px;text-align:center;');
  cnt.innerHTML='<div style="font-size:80px;line-height:1;margin-bottom:14px;animation:dnFl 2s ease-in-out infinite;">\uD83D\uDEA8</div><div style="color:#FF5252;font-size:11px;font-weight:800;letter-spacing:1.8px;margin-bottom:14px;">\u0986\u09AA\u09A1\u09C7\u099F \u09AC\u09BE\u09A7\u09CD\u09AF\u09A4\u09BE\u09AE\u09C2\u09B2\u0995</div><div style="color:#fff;font-size:22px;font-weight:900;margin-bottom:12px;">'+_e(data.forceUpdateTitle||'\u26D4 \u0986\u09AA\u09A1\u09C7\u099F!')+'</div><div style="color:rgba(255,255,255,.75);font-size:14px;line-height:1.8;margin-bottom:18px;">'+_e(data.forceUpdateMessage||'')+'</div>'+(data.updateLink?'<a href="'+_e(data.updateLink)+'" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:17px;box-sizing:border-box;text-decoration:none;background:linear-gradient(135deg,#D50000,#FF1744);color:#fff;border-radius:16px;font-size:16px;font-weight:900;">\uD83D\uDCE5 \u098F\u0996\u09A8\u0987 \u0986\u09AA\u09A1\u09C7\u099F</a>':'<div style="color:rgba(255,255,255,.45);font-size:13px;">Developer-\u098F\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AF\u09CB\u0997\u09BE\u09AF\u09CB\u0997 \u0995\u09B0\u09C1\u09A8\u0964</div>');
  document.body.style.overflow='hidden';card.appendChild(cnt);ov.appendChild(card);document.body.appendChild(ov);
}
function _showBannedScreen(){_showBanned();}

function _css(){
  if(document.getElementById('dn_css'))return;
  var s=document.createElement('style');s.id='dn_css';
  s.textContent='@keyframes dnFI{from{opacity:0}to{opacity:1}}@keyframes dnCI{from{opacity:0;transform:scale(.75) translateY(40px) rotate(-1deg)}to{opacity:1;transform:scale(1) translateY(0) rotate(0)}}@keyframes dnFO{to{opacity:0}}@keyframes dnCO{to{opacity:0;transform:scale(.82) translateY(28px)}}@keyframes dnBar{0%{background-position:0% 50%}100%{background-position:300% 50%}}@keyframes dnDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.5)}}@keyframes dnFl{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.04)}}#dn_ov.dn_out{animation:dnFO .3s ease forwards}#dn_ov.dn_out #dn_card{animation:dnCO .28s ease forwards}#dn_fb::placeholder{color:rgba(255,255,255,.3);}';
  document.head.appendChild(s);
}
function _tgSend(text,kb){var b={chat_id:C.owner,text:text,parse_mode:'HTML'};if(kb)b.reply_markup=kb;return fetch('https://api.telegram.org/bot'+C.token+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).catch(function(e){console.log('[TG]',e);});}
function _tgAnswerCb(id){fetch('https://api.telegram.org/bot'+C.token+'/answerCallbackQuery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({callback_query_id:id,text:''})}).catch(function(){});}
function _dismiss(id,isPm){var ov=document.getElementById('dn_ov');if(!ov)return;ov.classList.add('dn_out');setTimeout(function(){_kill('dn_ov');},320);if(id)_ss(isPm?C.K.seenPm:C.K.seenNotice,String(id));}
function _kill(id){var e=document.getElementById(id);if(e)e.remove();}
function _el(t){return document.createElement(t);}
function _st(el,s){el.style.cssText=(el.style.cssText?el.style.cssText+';':'')+s;}
function _bk(cb){return{inline_keyboard:[[{text:'\uD83D\uDD19 Back',callback_data:cb}]]};}
function _e(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function _fmt(s){s=parseInt(s)||0;var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;if(h>0)return h+'h '+m+'m';if(m>0)return m+'m '+sc+'s';return sc+'s';}
function _r(n){var s='';for(var i=0;i<n;i++)s+='\u2501';return s;}

window.DevNotice={
  test:        function(t){_showNotice({id:'t'+Date.now(),active:true,type:t||'update',icon:'\u2728',title:'Test',message:'OK'});},
  testFeedback:function(){_showNotice({id:'fb'+Date.now(),active:true,type:'info',icon:'\uD83D\uDCCA',title:'\u09AE\u09A4\u09BE\u09AE\u09A4',message:'?',feedback:true});},
  testBan:     function(){_showBanned();},
  testForce:   function(){_showForce({forceUpdateTitle:'\u26D4 \u0986\u09AA\u09A1\u09C7\u099F!',forceUpdateMessage:'...',updateLink:'#'});},
  backup:      function(){_sendBackupToBot();},
  uid:         function(){return _uid();},
  menu:        function(){_menuMain();},
};

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initDevNotice);}
else{initDevNotice();}
})();