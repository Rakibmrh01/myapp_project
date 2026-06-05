// ================================================================
//  Daily Account — AnalysisForexbackup.js  v6.0
//  ✅ Excel (.xlsx via SheetJS) — proper multi-sheet workbook
//  ✅ Word  (.docx via html-docx-js/browser) — proper document
//  ✅ Telegram — সকল অপশন কার্যকর
//  ✅ JSON / CSV / AI / ZIP — সব কাজ করে
//  Developer: জাকির আল জিহাদ
// ================================================================

/* ════════════════════════════════════════
   UTILS
════════════════════════════════════════ */
function _d()  { return new Date().toISOString().slice(0,10); }
function _dt() { var n=new Date(); return n.getFullYear()+'-'+_p(n.getMonth()+1)+'-'+_p(n.getDate())+' '+_p(n.getHours())+':'+_p(n.getMinutes()); }
function _p(n) { return String(n).padStart(2,'0'); }
function _num(v){ try{return Math.round(parseFloat(v)||0);}catch(e){return 0;} }
function _fmtAmt(n){ return '৳ '+_num(n).toLocaleString('en-BD'); }

function _tgToken() {
  return (document.getElementById('tg_token')&&document.getElementById('tg_token').value.trim())
      || localStorage.getItem('da_tg_token')||'';
}
function _tgChatId() {
  return (document.getElementById('tg_chatid')&&document.getElementById('tg_chatid').value.trim())
      || localStorage.getItem('da_tg_chatid')||'';
}
function _getDaysSince(d){ try{return Math.floor((Date.now()-new Date(d).getTime())/86400000);}catch(e){return 999;} }

/* ════════════════════════════════════════
   DATA HELPERS
════════════════════════════════════════ */
function _getData() {
  return {
    income:  DB.get('income')  || [],
    expense: DB.get('expense') || [],
    ledger:  DB.get('ledger')  || [],
    savings: DB.get('savings') || [],
    notes:   DB.get('notes')   || [],
    settings:   DB.get('settings')   || {},
    cssConfig:  DB.get('cssConfig')  || {},
    pageConfig: DB.get('pageConfig') || {}
  };
}
function _totals(d) {
  var inc  = d.income.reduce(function(s,i){return s+_num(i.amount);},0);
  var exp  = d.expense.reduce(function(s,i){return s+_num(i.amount);},0);
  var sav  = d.savings.reduce(function(s,i){return s+_num(i.amount);},0);
  var uDena   = d.ledger.filter(function(i){return i.type==='dena'   &&!i.paid;}).reduce(function(s,i){return s+_num(i.amount);},0);
  var uPabona = d.ledger.filter(function(i){return i.type==='pabona' &&!i.paid;}).reduce(function(s,i){return s+_num(i.amount);},0);
  var pDena   = d.ledger.filter(function(i){return i.type==='dena'   && i.paid;}).reduce(function(s,i){return s+_num(i.amount);},0);
  var pPabona = d.ledger.filter(function(i){return i.type==='pabona' && i.paid;}).reduce(function(s,i){return s+_num(i.amount);},0);
  return { inc:inc, exp:exp, sav:sav, bal:inc-exp, uDena:uDena, uPabona:uPabona, pDena:pDena, pPabona:pPabona };
}

/* ════════════════════════════════════════
   JSON BUILDER
════════════════════════════════════════ */
function buildJSON(withMedia) {
  var d = _getData();
  var data = {app:'Daily Account',developer:'জাকির আল জিহাদ',v:'5.0',date:_d(),media:withMedia};
  ['income','expense','ledger','savings','notes'].forEach(function(s){
    var arr = d[s];
    if(!withMedia){ arr=arr.map(function(i){ var o={}; Object.keys(i).forEach(function(k){if(k!=='photo'&&k!=='drawing'&&k!=='voice')o[k]=i[k];}); return o; }); }
    data[s]=arr;
  });
  data.settings=d.settings; data.cssConfig=d.cssConfig; data.pageConfig=d.pageConfig;
  data.calcHistory=DB.get('calcHistory')||[]; data.customFonts=DB.get('customFonts')||{};
  if(withMedia){ try{data.uploadedFonts=JSON.parse(localStorage.getItem('uploadedFonts')||'{}');}catch(e){} }
  return JSON.stringify(data,null,2);
}

/* ════════════════════════════════════════
   CSV BUILDERS
════════════════════════════════════════ */
function buildCSVAll() {
  var d = _getData(); var h='\uFEFF';
  var income=h+'উৎস,পরিমাণ,তারিখ,সময়,নোট\n';
  d.income.forEach(function(i){income+='"'+(i.source||'')+'",'+ _num(i.amount)+',"'+(i.date||'')+'","'+(i.time||'')+'","'+(i.note||'')+'"\n';});
  var expense=h+'ক্যাটাগরি,পরিমাণ,তারিখ,সময়,নোট\n';
  d.expense.forEach(function(i){expense+='"'+(i.category||i.source||'')+'",'+ _num(i.amount)+',"'+(i.date||'')+'","'+(i.time||'')+'","'+(i.note||'')+'"\n';});
  var ledger=h+'ধরন,ব্যক্তি,পরিমাণ,তারিখ,পরিশোধ,পরিশোধ তারিখ,নোট\n';
  d.ledger.forEach(function(i){ledger+='"'+(i.type==='dena'?'দেনা':'পাওনা')+'","'+(i.person||i.name||'')+'",'+ _num(i.amount)+',"'+(i.date||'')+'","'+(i.paid?'হ্যাঁ':'না')+'","'+(i.paidDate||'')+'","'+(i.note||'')+'"\n';});
  var savings=h+'শিরোনাম,পরিমাণ,লক্ষ্য,তারিখ,নোট\n';
  d.savings.forEach(function(i){savings+='"'+(i.title||i.category||'')+'",'+ _num(i.amount)+','+ _num(i.goal)+',"'+(i.date||'')+'","'+(i.note||'')+'"\n';});
  return {income:income,expense:expense,ledger:ledger,savings:savings};
}

/* ════════════════════════════════════════
   AI TEXT BUILDER
════════════════════════════════════════ */
function buildAIText(){ return buildAIDeep(); }
function generateAI(){
  var el=document.getElementById('aiOut'); if(!el)return;
  var txt=buildAIDeep();
  el.style.display='block';
  el.innerHTML='<pre style="white-space:pre-wrap;word-break:break-word;font-family:monospace;font-size:.78rem;color:#e2e8f0;line-height:1.7;margin:0">'+txt+'</pre>';
  if(typeof showSt==='function') showSt('aiSt','✅ বিশ্লেষণ তৈরি হয়েছে!','ok');
}

function buildAIDeep() {
  var d=_getData(); var t=_totals(d);
  var expCats={};
  d.expense.forEach(function(e){var k=e.category||e.source||'অন্যান্য';expCats[k]=(expCats[k]||0)+_num(e.amount);});
  var topCats=Object.keys(expCats).sort(function(a,b){return expCats[b]-expCats[a];}).slice(0,5);
  var incSrc={};
  d.income.forEach(function(i){var k=i.source||'অন্যান্য';incSrc[k]=(incSrc[k]||0)+_num(i.amount);});
  var topInc=Object.keys(incSrc).sort(function(a,b){return incSrc[b]-incSrc[a];}).slice(0,5);
  var savR=t.inc>0?((t.sav/t.inc)*100).toFixed(1):'0.0';
  var expR=t.inc>0?((t.exp/t.inc)*100).toFixed(1):'0.0';
  var L=[];
  L.push('╔══════════════════════════════════════════════╗');
  L.push('║   📊 DAILY ACCOUNT — বিস্তারিত আর্থিক বিশ্লেষণ   ║');
  L.push('║   Developer: জাকির আল জিহাদ | v6.0           ║');
  L.push('╚══════════════════════════════════════════════╝');
  L.push('📅 তারিখ: '+_d()+'  |  সময়: '+_dt());
  L.push('');
  L.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  L.push('📈 সারসংক্ষেপ');
  L.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  L.push('💰 মোট আয়        : '+_fmtAmt(t.inc)+' ('+d.income.length+' টি লেনদেন)');
  L.push('💸 মোট ব্যয়        : '+_fmtAmt(t.exp)+' ('+d.expense.length+' টি লেনদেন)');
  L.push('💵 নেট ব্যালেন্স   : '+_fmtAmt(t.bal)+(t.bal>=0?' ✅':' 🚨'));
  L.push('🏦 মোট সঞ্চয়      : '+_fmtAmt(t.sav)+' ('+d.savings.length+' টি)');
  L.push('');
  L.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  L.push('📒 দেনাপাওনা বিশ্লেষণ');
  L.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  L.push('🔴 বকেয়া দেনা      : '+_fmtAmt(t.uDena)+(t.uDena>0?' ⚠️':' ✅'));
  L.push('🟢 বকেয়া পাওনা     : '+_fmtAmt(t.uPabona));
  L.push('✅ পরিশোধিত দেনা   : '+_fmtAmt(t.pDena));
  L.push('✅ আদায় পাওনা     : '+_fmtAmt(t.pPabona));
  L.push('📊 মোট এন্ট্রি      : '+d.ledger.length+' টি');
  if(t.uDena>0||t.uPabona>0){L.push('⚖️ নেট দেনাপাওনা   : '+(t.uDena>t.uPabona?'🔴 আপনি দিতে হবে '+_fmtAmt(t.uDena-t.uPabona):'🟢 আপনি পাবেন '+_fmtAmt(t.uPabona-t.uDena)));}
  L.push('');
  L.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  L.push('📊 অনুপাত বিশ্লেষণ');
  L.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  L.push('📉 ব্যয়ের হার      : '+expR+'% (আয়ের তুলনায়)');
  L.push('💹 সঞ্চয়ের হার     : '+savR+'%');
  L.push('');
  if(topInc.length>0){L.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'); L.push('💰 শীর্ষ আয়ের উৎস'); L.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'); topInc.forEach(function(s,i){var p=t.inc>0?((incSrc[s]/t.inc)*100).toFixed(1):'0';L.push((i+1)+'. '+s+': '+_fmtAmt(incSrc[s])+' ('+p+'%)');});L.push('');}
  if(topCats.length>0){L.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'); L.push('💸 শীর্ষ ব্যয়ের ক্যাটাগরি'); L.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'); topCats.forEach(function(c,i){var p=t.exp>0?((expCats[c]/t.exp)*100).toFixed(1):'0';L.push((i+1)+'. '+c+': '+_fmtAmt(expCats[c])+' ('+p+'%)');});L.push('');}
  L.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  L.push('🤖 AI পরামর্শ ও মূল্যায়ন');
  L.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if(t.exp>t.inc&&t.inc>0)L.push('🚨 সংকট! ব্যয় আয়ের চেয়ে বেশি। অবিলম্বে খরচ কমান।');
  else if(t.bal>t.inc*0.5&&t.inc>0)L.push('🏆 অসাধারণ! আয়ের ৫০%+ ব্যালেন্সে আছে।');
  else if(t.bal>t.inc*0.3&&t.inc>0)L.push('✅ চমৎকার! আর্থিক অবস্থা ভালো। এভাবে চালিয়ে যান।');
  else if(t.inc>0)L.push('💡 আরও সঞ্চয় করার সুযোগ আছে।');
  if(parseFloat(savR)>=20)L.push('🏆 দারুণ! আয়ের '+savR+'% সঞ্চয় করেছেন।');
  else if(parseFloat(savR)>=10)L.push('👍 সঞ্চয় '+savR+'% — আরেকটু বাড়ানোর চেষ্টা করুন।');
  else if(t.inc>0)L.push('⚠️ সঞ্চয় মাত্র '+savR+'%। লক্ষ্য: কমপক্ষে ২০%।');
  if(t.uDena>0)L.push('🔴 সতর্কতা: '+_fmtAmt(t.uDena)+' দেনা পরিশোধ বাকি।');
  if(t.uPabona>0)L.push('🟢 মনে রাখুন: '+_fmtAmt(t.uPabona)+' পাওনা আদায় করতে হবে।');
  L.push('');
  L.push('══════════════════════════════════════');
  L.push('          Daily Account v6.0 | জাকির আল জিহাদ');
  L.push('══════════════════════════════════════');
  return L.join('\n');
}

/* ════════════════════════════════════════
   EXCEL BUILDER — SheetJS (XLSX proper)
   Browser CDN: https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
════════════════════════════════════════ */

function _loadXLSX(cb) {
  if(typeof XLSX !== 'undefined'){ cb(); return; }
  var sc=document.createElement('script');
  sc.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  sc.onload=function(){ cb(); };
  sc.onerror=function(){ if(typeof showR==='function') showR('tg_result','❌ SheetJS library লোড হয়নি। ইন্টারনেট চেক করুন।','err'); };
  document.head.appendChild(sc);
}

function _buildXLSXWorkbook() {
  var d=_getData(); var t=_totals(d);
  var wb=XLSX.utils.book_new();

  /* ── Sheet 1: Summary ── */
  var sumData=[
    ['📊 Daily Account — আর্থিক সারসংক্ষেপ','','','','',''],
    ['তৈরির তারিখ: '+_d()+'','','Developer: জাকির আল জিহাদ','','',''],
    ['','','','','',''],
    ['💰 মোট আয়','💸 মোট ব্যয়','💵 নেট ব্যালেন্স','🏦 সঞ্চয়','🔴 বকেয়া দেনা','🟢 বকেয়া পাওনা'],
    [_num(t.inc),_num(t.exp),_num(t.bal),_num(t.sav),_num(t.uDena),_num(t.uPabona)],
    ['','','','','',''],
    ['মোট আয় লেনদেন',d.income.length+' টি','মোট ব্যয় লেনদেন',d.expense.length+' টি','দেনাপাওনা',d.ledger.length+' টি'],
    ['পরিশোধিত দেনা',_num(t.pDena),'আদায় পাওনা',_num(t.pPabona),'',''],
    ['','','','','',''],
    ['— ব্যয়ের ক্যাটাগরি —','পরিমাণ','সংখ্যা','— আয়ের উৎস —','পরিমাণ','সংখ্যা'],
  ];
  var expCats={};
  d.expense.forEach(function(e){var k=e.category||e.source||'অন্যান্য';if(!expCats[k])expCats[k]={sum:0,cnt:0};expCats[k].sum+=_num(e.amount);expCats[k].cnt++;});
  var incSrc={};
  d.income.forEach(function(i){var k=i.source||'অন্যান্য';if(!incSrc[k])incSrc[k]={sum:0,cnt:0};incSrc[k].sum+=_num(i.amount);incSrc[k].cnt++;});
  var expArr=Object.keys(expCats).sort(function(a,b){return expCats[b].sum-expCats[a].sum;});
  var incArr=Object.keys(incSrc).sort(function(a,b){return incSrc[b].sum-incSrc[a].sum;});
  var maxR=Math.max(expArr.length,incArr.length);
  for(var i=0;i<maxR;i++){
    var er=expArr[i]?[expArr[i],expCats[expArr[i]].sum,expCats[expArr[i]].cnt]:['','',''];
    var ir=incArr[i]?[incArr[i],incSrc[incArr[i]].sum,incSrc[incArr[i]].cnt]:['','',''];
    sumData.push([er[0],er[1],er[2],ir[0],ir[1],ir[2]]);
  }
  var wsSummary=XLSX.utils.aoa_to_sheet(sumData);
  wsSummary['!cols']=[{wch:24},{wch:16},{wch:10},{wch:24},{wch:16},{wch:10}];
  wsSummary['!merges']=[{s:{r:0,c:0},e:{r:0,c:5}}];
  XLSX.utils.book_append_sheet(wb,wsSummary,'সারসংক্ষেপ');

  /* ── Sheet 2: Income ── */
  var incRows=[['উৎস / মাধ্যম','পরিমাণ (৳)','তারিখ','সময়','নোট']];
  d.income.forEach(function(i){incRows.push([i.source||'',_num(i.amount),i.date||'',i.time||'',i.note||'']);});
  incRows.push(['মোট',{f:'SUM(B2:B'+d.income.length+')'},'','','']);
  var wsInc=XLSX.utils.aoa_to_sheet(incRows);
  wsInc['!cols']=[{wch:22},{wch:14},{wch:14},{wch:10},{wch:40}];
  XLSX.utils.book_append_sheet(wb,wsInc,'💰 আয়');

  /* ── Sheet 3: Expense ── */
  var expRows=[['ক্যাটাগরি','পরিমাণ (৳)','তারিখ','সময়','নোট']];
  d.expense.forEach(function(i){expRows.push([i.category||i.source||'',_num(i.amount),i.date||'',i.time||'',i.note||'']);});
  expRows.push(['মোট',{f:'SUM(B2:B'+d.expense.length+')'},'','','']);
  var wsExp=XLSX.utils.aoa_to_sheet(expRows);
  wsExp['!cols']=[{wch:22},{wch:14},{wch:14},{wch:10},{wch:40}];
  XLSX.utils.book_append_sheet(wb,wsExp,'💸 ব্যয়');

  /* ── Sheet 4: Ledger ── */
  var ledRows=[['ধরন','ব্যক্তি','পরিমাণ (৳)','তারিখ','পরিশোধ','পরিশোধ তারিখ','নোট']];
  d.ledger.forEach(function(i){ledRows.push([i.type==='dena'?'দেনা':'পাওনা',i.person||i.name||'',_num(i.amount),i.date||'',i.paid?'✅ হ্যাঁ':'⏳ না',i.paidDate||'',i.note||'']);});
  var wsLed=XLSX.utils.aoa_to_sheet(ledRows);
  wsLed['!cols']=[{wch:10},{wch:18},{wch:14},{wch:14},{wch:12},{wch:16},{wch:35}];
  XLSX.utils.book_append_sheet(wb,wsLed,'📒 দেনাপাওনা');

  /* ── Sheet 5: Savings (if any) ── */
  if(d.savings.length>0){
    var savRows=[['শিরোনাম','পরিমাণ (৳)','লক্ষ্য (৳)','তারিখ','নোট']];
    d.savings.forEach(function(i){savRows.push([i.title||i.category||'',_num(i.amount),_num(i.goal||0),i.date||'',i.note||'']);});
    savRows.push(['মোট',{f:'SUM(B2:B'+d.savings.length+')'},'','','']);
    var wsSav=XLSX.utils.aoa_to_sheet(savRows);
    wsSav['!cols']=[{wch:22},{wch:14},{wch:14},{wch:14},{wch:35}];
    XLSX.utils.book_append_sheet(wb,wsSav,'🏦 সঞ্চয়');
  }

  return wb;
}

function _xlsxBlob() {
  var wb=_buildXLSXWorkbook();
  var wbout=XLSX.write(wb,{bookType:'xlsx',type:'array'});
  return new Blob([wbout],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

/* ════════════════════════════════════════
   WORD DOCUMENT BUILDER — Pure OOXML (.docx)
   No external library. JSZip only (already
   loaded for MEGA ZIP). Falls back to loading
   JSZip if not yet present.
════════════════════════════════════════ */

/* ── OOXML helpers ── */
function _esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function _wRun(text, opts) {
  /* opts: bold, color, sz (half-points), italic */
  opts = opts || {};
  var rPr = '';
  if (opts.bold)   rPr += '<w:b/><w:bCs/>';
  if (opts.italic) rPr += '<w:i/>';
  if (opts.sz)     rPr += '<w:sz w:val="'+opts.sz+'"/><w:szCs w:val="'+opts.sz+'"/>';
  if (opts.color)  rPr += '<w:color w:val="'+opts.color.replace('#','')+'"/>';
  var rPrTag = rPr ? '<w:rPr>'+rPr+'</w:rPr>' : '';
  /* split on newlines */
  var parts = String(text||'').split('\n');
  var out = '';
  parts.forEach(function(p, i){
    if(i > 0) out += '<w:r><w:br/></w:r>';
    out += '<w:r>'+rPrTag+'<w:t xml:space="preserve">'+_esc(p)+'</w:t></w:r>';
  });
  return out;
}

function _wPara(runs, pOpts) {
  /* pOpts: align, spaceBefore, spaceAfter, style, shading */
  pOpts = pOpts || {};
  var pPr = '';
  if (pOpts.style)       pPr += '<w:pStyle w:val="'+pOpts.style+'"/>';
  if (pOpts.align)       pPr += '<w:jc w:val="'+pOpts.align+'"/>';
  if (pOpts.spaceBefore || pOpts.spaceAfter) {
    var b = pOpts.spaceBefore || 0, a = pOpts.spaceAfter || 0;
    pPr += '<w:spacing w:before="'+b+'" w:after="'+a+'"/>';
  }
  if (pOpts.shading)     pPr += '<w:shd w:val="clear" w:color="auto" w:fill="'+pOpts.shading+'"/>';
  if (pOpts.border)      pPr += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="'+pOpts.border+'"/></w:pBdr>';
  var pPrTag = pPr ? '<w:pPr>'+pPr+'</w:pPr>' : '';
  return '<w:p>'+pPrTag+runs+'</w:p>';
}

function _wCell(content, opts) {
  opts = opts || {};
  var tcPr = '';
  if (opts.w)       tcPr += '<w:tcW w:w="'+opts.w+'" w:type="dxa"/>';
  if (opts.fill)    tcPr += '<w:shd w:val="clear" w:color="auto" w:fill="'+opts.fill.replace('#','')+'"/>';
  if (opts.span)    tcPr += '<w:gridSpan w:val="'+opts.span+'"/>';
  if (opts.vAlign)  tcPr += '<w:vAlign w:val="'+opts.vAlign+'"/>';
  if (opts.noBorder) tcPr += '<w:tcBorders><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/></w:tcBorders>';
  var tcPrTag = tcPr ? '<w:tcPr>'+tcPr+'</w:tcPr>' : '';
  return '<w:tc>'+tcPrTag+content+'</w:tc>';
}

function _wRow(cells, height){
  var trPr = height ? '<w:trPr><w:trHeight w:val="'+height+'"/></w:trPr>' : '';
  return '<w:tr>'+trPr+cells+'</w:tr>';
}

function _wTable(rows, colWidths){
  var tblPr = '<w:tblPr>'
    +'<w:tblStyle w:val="TableGrid"/>'
    +'<w:tblW w:w="9072" w:type="dxa"/>'
    +'<w:tblBorders>'
    +'<w:top w:val="single" w:sz="4" w:color="CCCCCC"/>'
    +'<w:left w:val="single" w:sz="4" w:color="CCCCCC"/>'
    +'<w:bottom w:val="single" w:sz="4" w:color="CCCCCC"/>'
    +'<w:right w:val="single" w:sz="4" w:color="CCCCCC"/>'
    +'<w:insideH w:val="single" w:sz="4" w:color="CCCCCC"/>'
    +'<w:insideV w:val="single" w:sz="4" w:color="CCCCCC"/>'
    +'</w:tblBorders>'
    +'<w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar>'
    +'</w:tblPr>';
  var tblGrid = '<w:tblGrid>'+colWidths.map(function(w){return '<w:gridCol w:w="'+w+'"/>';}).join('')+'</w:tblGrid>';
  return '<w:tbl>'+tblPr+tblGrid+rows.join('')+'</w:tbl>';
}

/* make a standard data table with header row */
function _makeDocxTable(headers, rows, hdrFill, colWidths) {
  var totalW = colWidths.reduce(function(s,w){return s+w;},0);
  var hdrCells = headers.map(function(h,i){
    return _wCell(
      _wPara(_wRun(h,{bold:true,color:'#FFFFFF',sz:18}),{align:'center',shading:hdrFill.replace('#','')}),
      {w:colWidths[i], fill:hdrFill, vAlign:'center'}
    );
  });
  var allRows = [_wRow(hdrCells.join(''), 320)];
  rows.forEach(function(row, ri){
    var bg = ri%2===0 ? 'FFFFFF' : 'F1F5F9';
    var cells = row.map(function(cell, ci){
      return _wCell(
        _wPara(_wRun(cell,{sz:17}),{spaceAfter:0}),
        {w:colWidths[ci], fill:'#'+bg}
      );
    });
    allRows.push(_wRow(cells.join(''), 280));
  });
  return _wTable(allRows, colWidths);
}

/* section heading paragraph */
function _secHead(text, color) {
  return _wPara(
    _wRun(text, {bold:true, color:color||'1E3A5F', sz:28}),
    {spaceBefore:280, spaceAfter:120, border: color||'1E3A5F'}
  );
}

/* ── Build OOXML document.xml body ── */
function _buildDocxBody() {
  var d=_getData(); var t=_totals(d);
  var expCats={};
  d.expense.forEach(function(e){var k=e.category||e.source||'অন্যান্য';expCats[k]=(expCats[k]||0)+_num(e.amount);});
  var topCats=Object.keys(expCats).sort(function(a,b){return expCats[b]-expCats[a];}).slice(0,5);
  var incSrc={};
  d.income.forEach(function(i){var k=i.source||'অন্যান্য';incSrc[k]=(incSrc[k]||0)+_num(i.amount);});
  var topInc=Object.keys(incSrc).sort(function(a,b){return incSrc[b]-incSrc[a];}).slice(0,5);
  var savR=t.inc>0?((t.sav/t.inc)*100).toFixed(1):'0.0';
  var expR=t.inc>0?((t.exp/t.inc)*100).toFixed(1):'0.0';
  var body = '';

  /* ── TITLE ── */
  body += _wPara(_wRun('Daily Account',{bold:true,color:'1E3A5F',sz:56}),{align:'center',spaceBefore:0,spaceAfter:80});
  body += _wPara(_wRun('সম্পূর্ণ আর্থিক রিপোর্ট',{bold:true,color:'374151',sz:32}),{align:'center',spaceAfter:60});
  body += _wPara(_wRun('তারিখ: '+_d()+' | Developer: জাকির আল জিহাদ | v6.0',{color:'6B7280',sz:18}),{align:'center',spaceAfter:240,border:'1E3A5F'});

  /* ── SUMMARY ── */
  body += _secHead('সারসংক্ষেপ');
  var sumColW = [1512,1512,1512,1512,1512,1512];
  var sumHdrs = ['মোট আয়','মোট ব্যয়','নেট ব্যালেন্স','সঞ্চয়','বকেয়া দেনা','বকেয়া পাওনা'];
  var sumVals = [_fmtAmt(t.inc),_fmtAmt(t.exp),_fmtAmt(t.bal),_fmtAmt(t.sav),_fmtAmt(t.uDena),_fmtAmt(t.uPabona)];
  var sumFills = ['064E3B','450A0A','1E3A5F','2E1065','451A03','0C4A6E'];
  var sumValClrs= ['10B981','EF4444',t.bal>=0?'1D4ED8':'DC2626','A855F7','D97706','059669'];
  var sumHdrCells = sumHdrs.map(function(h,i){
    return _wCell(_wPara(_wRun(h,{bold:true,color:'FFFFFF',sz:16}),{align:'center',shading:sumFills[i]}),{w:sumColW[i],fill:'#'+sumFills[i],vAlign:'center'});
  });
  var sumValCells = sumVals.map(function(v,i){
    return _wCell(_wPara(_wRun(v,{bold:true,color:sumValClrs[i],sz:20}),{align:'center'}),{w:sumColW[i],fill:'#F8FAFC'});
  });
  body += _wTable([_wRow(sumHdrCells.join(''),320),_wRow(sumValCells.join(''),400)],sumColW);
  body += _wPara('',{spaceAfter:120});

  /* stats row */
  var statsData=[
    ['মোট আয় লেনদেন', d.income.length+' টি'],
    ['মোট ব্যয় লেনদেন', d.expense.length+' টি'],
    ['দেনাপাওনা এন্ট্রি', d.ledger.length+' টি'],
    ['পরিশোধিত দেনা', _fmtAmt(t.pDena)],
    ['আদায় পাওনা', _fmtAmt(t.pPabona)],
    ['ব্যয়ের হার', expR+'%'],
    ['সঞ্চয়ের হার', savR+'%'],
    ['নোট', d.notes.length+' টি'],
  ];
  var stRows = statsData.map(function(row,i){
    var bg = i%2===0?'FFFFFF':'F8FAFC';
    return _wRow([
      _wCell(_wPara(_wRun(row[0],{bold:true,sz:18}),{}),{w:3200,fill:'#'+bg}),
      _wCell(_wPara(_wRun(row[1],{bold:true,color:'1E3A5F',sz:18}),{}),{w:5872,fill:'#'+bg}),
    ].join(''), 280);
  });
  body += _wTable(stRows,[3200,5872]);
  body += _wPara('',{spaceAfter:120});

  /* ── INCOME TABLE ── */
  body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  body += _secHead('আয়ের তালিকা ('+d.income.length+' টি)', '059669');
  body += _makeDocxTable(
    ['উৎস / মাধ্যম','পরিমাণ (৳)','তারিখ','সময়','নোট'],
    d.income.map(function(i){return [i.source||'',_fmtAmt(i.amount),i.date||'',i.time||'',i.note||''];}),
    '#059669',[2400,1400,1400,900,2972]
  );
  body += _wPara(_wRun('মোট আয়: '+_fmtAmt(t.inc),{bold:true,color:'059669',sz:20}),{align:'right',spaceAfter:120});

  /* ── EXPENSE TABLE ── */
  body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  body += _secHead('ব্যয়ের তালিকা ('+d.expense.length+' টি)', 'DC2626');
  body += _makeDocxTable(
    ['ক্যাটাগরি','পরিমাণ (৳)','তারিখ','সময়','নোট'],
    d.expense.map(function(i){return [i.category||i.source||'',_fmtAmt(i.amount),i.date||'',i.time||'',i.note||''];}),
    '#DC2626',[2400,1400,1400,900,2972]
  );
  body += _wPara(_wRun('মোট ব্যয়: '+_fmtAmt(t.exp),{bold:true,color:'DC2626',sz:20}),{align:'right',spaceAfter:80});

  if(topCats.length>0){
    body += _secHead('শীর্ষ ব্যয়ের ক্যাটাগরি','DC2626');
    body += _makeDocxTable(
      ['ক্রম','ক্যাটাগরি','পরিমাণ (৳)','শতাংশ'],
      topCats.map(function(c,i){return [String(i+1),c,_fmtAmt(expCats[c]),t.exp>0?((expCats[c]/t.exp)*100).toFixed(1)+'%':'0%'];}),
      '#B91C1C',[900,3600,2200,2372]
    );
  }

  /* ── LEDGER TABLE ── */
  body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  body += _secHead('দেনাপাওনার খাতা ('+d.ledger.length+' টি)', 'D97706');
  body += _makeDocxTable(
    ['ধরন','ব্যক্তি','পরিমাণ','তারিখ','পরিশোধ','পরিশোধ তারিখ','নোট'],
    d.ledger.map(function(i){
      return [i.type==='dena'?'দেনা':'পাওনা', i.person||i.name||'', _fmtAmt(i.amount), i.date||'', i.paid?'হ্যাঁ':'না', i.paidDate||'', i.note||''];
    }),
    '#D97706',[1100,1700,1300,1300,900,1500,1272]
  );

  /* ── SAVINGS ── */
  if(d.savings.length>0){
    body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    body += _secHead('সঞ্চয়ের তালিকা ('+d.savings.length+' টি)', '7C3AED');
    body += _makeDocxTable(
      ['শিরোনাম','পরিমাণ (৳)','লক্ষ্য (৳)','তারিখ','নোট'],
      d.savings.map(function(i){return [i.title||i.category||'',_fmtAmt(i.amount),_fmtAmt(i.goal||0),i.date||'',i.note||''];}),
      '#7C3AED',[2500,1500,1500,1300,2272]
    );
  }

  /* ── AI ANALYSIS ── */
  body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  body += _secHead('AI আর্থিক বিশ্লেষণ ও পরামর্শ', '7C3AED');
  body += _wPara('',{spaceAfter:80});

  /* stats mini table */
  var statsGrid = [
    ['মোট লেনদেন', String(d.income.length+d.expense.length+d.ledger.length)+' টি'],
    ['ব্যয়ের হার', expR+'%'],
    ['সঞ্চয়ের হার', savR+'%'],
    ['বিশ্লেষণের তারিখ', _d()],
  ];
  body += _makeDocxTable(
    ['বিষয়','মান'],
    statsGrid,
    '#334155',[4536,4536]
  );
  body += _wPara('',{spaceAfter:120});

  /* advice paragraphs */
  var advices=[];
  if(t.exp>t.inc&&t.inc>0)           advices.push(['DC2626','সংকট! ব্যয় আয়ের চেয়ে বেশি। অবিলম্বে খরচ কমান।']);
  else if(t.bal>t.inc*0.5&&t.inc>0)  advices.push(['059669','অসাধারণ! আয়ের ৫০%+ ব্যালেন্সে আছে!']);
  else if(t.bal>t.inc*0.3&&t.inc>0)  advices.push(['059669','চমৎকার! আর্থিক অবস্থা ভালো। এভাবে চালিয়ে যান।']);
  else if(t.inc>0)                    advices.push(['D97706','আরও সঞ্চয় করার সুযোগ আছে।']);
  if(parseFloat(savR)>=20)            advices.push(['059669','দারুণ! আয়ের '+savR+'% সঞ্চয় করেছেন।']);
  else if(parseFloat(savR)>=10)       advices.push(['D97706','সঞ্চয়ের হার '+savR+'% — আরেকটু বাড়ানোর চেষ্টা করুন।']);
  else if(t.inc>0)                    advices.push(['DC2626','সঞ্চয় মাত্র '+savR+'%। লক্ষ্য: কমপক্ষে ২০%।']);
  if(t.uDena>0)                       advices.push(['DC2626',_fmtAmt(t.uDena)+' দেনা পরিশোধ বাকি।']);
  if(t.uPabona>0)                     advices.push(['059669',_fmtAmt(t.uPabona)+' পাওনা আদায় করতে হবে।']);

  advices.forEach(function(a){
    body += _wPara(_wRun(a[1],{bold:true,color:a[0],sz:20}),{spaceBefore:60,spaceAfter:60,shading:'F8FAFC'});
  });
  body += _wPara('',{spaceAfter:120});

  /* top sources */
  if(topInc.length>0){
    body += _secHead('শীর্ষ আয়ের উৎস','059669');
    body += _makeDocxTable(
      ['ক্রম','উৎস','পরিমাণ (৳)','শতাংশ'],
      topInc.map(function(k,i){return [String(i+1),k,_fmtAmt(incSrc[k]),t.inc>0?((incSrc[k]/t.inc)*100).toFixed(1)+'%':'0%'];}),
      '#059669',[900,3600,2200,2372]
    );
  }

  /* footer */
  body += _wPara(_wRun('Daily Account v6.0 | Developer: জাকির আল জিহাদ | তৈরি: '+_d(),{color:'9CA3AF',sz:16}),{align:'center',spaceBefore:240,border:'CCCCCC'});
  return body;
}

/* ── Build full .docx binary via JSZip ── */
function _wordBlob(cb){
  function _build(){
    var body = _buildDocxBody();

    /* document.xml */
    var docXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      +'<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"'
      +' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"'
      +' xmlns:o="urn:schemas-microsoft-com:office:office"'
      +' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
      +' xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"'
      +' xmlns:v="urn:schemas-microsoft-com:vml"'
      +' xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"'
      +' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"'
      +' xmlns:w10="urn:schemas-microsoft-com:office:word"'
      +' xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
      +' xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"'
      +' xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"'
      +' xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"'
      +' xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"'
      +' xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"'
      +' mc:Ignorable="w14 wp14">'
      +'<w:body>'
      + body
      +'<w:sectPr>'
      +'<w:pgSz w:w="11906" w:h="16838"/>'
      +'<w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>'
      +'</w:sectPr>'
      +'</w:body></w:document>';

    /* styles.xml — minimal */
    var stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      +'<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
      +' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      +'<w:docDefaults><w:rPrDefault><w:rPr>'
      +'<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'
      +'<w:sz w:val="20"/><w:szCs w:val="20"/>'
      +'</w:rPr></w:rPrDefault></w:docDefaults>'
      +'<w:style w:type="table" w:styleId="TableGrid">'
      +'<w:name w:val="Table Grid"/>'
      +'<w:tblPr><w:tblBorders>'
      +'<w:top w:val="single" w:sz="4" w:color="auto"/>'
      +'<w:left w:val="single" w:sz="4" w:color="auto"/>'
      +'<w:bottom w:val="single" w:sz="4" w:color="auto"/>'
      +'<w:right w:val="single" w:sz="4" w:color="auto"/>'
      +'<w:insideH w:val="single" w:sz="4" w:color="auto"/>'
      +'<w:insideV w:val="single" w:sz="4" w:color="auto"/>'
      +'</w:tblBorders></w:tblPr>'
      +'</w:style>'
      +'</w:styles>';

    /* relationships */
    var relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
      +'</Relationships>';

    var docRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
      +'</Relationships>';

    var contentTypesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      +'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      +'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      +'<Default Extension="xml" ContentType="application/xml"/>'
      +'<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
      +'<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
      +'</Types>';

    var zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypesXml);
    zip.file('_rels/.rels', docRelsXml);
    zip.file('word/document.xml', docXml);
    zip.file('word/styles.xml', stylesXml);
    zip.file('word/_rels/document.xml.rels', relsXml);

    zip.generateAsync({type:'blob', compression:'DEFLATE'})
      .then(function(blob){ cb(blob); })
      .catch(function(e){ if(typeof showR==='function') showR('tg_result','❌ DOCX তৈরিতে সমস্যা: '+e.message,'err'); });
  }

  /* JSZip দরকার — আগে লোড করি */
  if(typeof JSZip !== 'undefined'){
    _build();
  } else {
    var sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    sc.onload = function(){ _build(); };
    sc.onerror = function(){ if(typeof showR==='function') showR('tg_result','❌ JSZip লোড হয়নি। ইন্টারনেট চেক করুন।','err'); };
    document.head.appendChild(sc);
  }
}

/* ════════════════════════════════════════
   SHARE / COPY helpers (Hopweb compatible)
════════════════════════════════════════ */
function _shareOrCopy(content, fname, mime, stId){
  var blob=new Blob([content],{type:mime});
  if(navigator.share && navigator.canShare){
    try{
      var file=new File([blob],fname,{type:mime});
      if(navigator.canShare({files:[file]})){
        navigator.share({files:[file],title:'Daily Account'})
          .then(function(){if(typeof showSt==='function')showSt(stId,'✅ শেয়ার/সেভ সফল!','ok');})
          .catch(function(){_copyToClip(content,stId);});
        return;
      }
    }catch(e){}
  }
  _copyToClip(typeof content==='string'?content:JSON.stringify(content),stId);
}

function _copyToClip(txt,stId){
  if(navigator.clipboard){
    navigator.clipboard.writeText(txt)
      .then(function(){if(typeof showSt==='function')showSt(stId,'✅ কপি হয়েছে! WhatsApp/Notes/Email এ paste করুন।','ok');})
      .catch(function(){_execCopy(txt,stId);});
  }else{_execCopy(txt,stId);}
}
function _execCopy(txt,stId){
  var ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;left:-9999px;opacity:0';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');if(typeof showSt==='function')showSt(stId,'✅ কপি হয়েছে!','ok');}catch(e){}
  document.body.removeChild(ta);
}

/* ════════════════════════════════════════
   TG FILE SENDER
════════════════════════════════════════ */
function _tgSendFile(token, chatId, blob, fname, caption, resultId){
  var form=new FormData();
  form.append('chat_id',chatId);
  form.append('document',blob,fname);
  form.append('caption',caption);
  return fetch('https://api.telegram.org/bot'+token+'/sendDocument',{method:'POST',body:form})
    .then(function(r){return r.json();})
    .then(function(res){
      if(res.ok){if(typeof showR==='function')showR(resultId,'✅ "'+fname+'" Telegram এ পাঠানো সফল! 🎉','ok');}
      else{if(typeof showR==='function')showR(resultId,'❌ '+res.description,'err');}
      return res.ok;
    }).catch(function(e){if(typeof showR==='function')showR(resultId,'❌ '+e.message,'err');return false;});
}
function _tgMsg(token,chatId,text){
  return fetch('https://api.telegram.org/bot'+token+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text:text})});
}

/* ════════════════════════════════════════
   TELEGRAM — সকল অপশন
════════════════════════════════════════ */

/* JSON (without media) */
function tgSend(withMedia){
  var token=_tgToken(),chatId=_tgChatId();
  if(!token||!chatId){if(typeof showR==='function')showR('tg_result','❌ Token ও Chat ID সংরক্ষণ করুন','err');return;}
  localStorage.setItem('da_tg_token',token);localStorage.setItem('da_tg_chatid',chatId);
  var json=buildJSON(withMedia);
  var d2=_getData();var fname='DA-backup'+(withMedia?'-media':'')+'-'+_d()+'.json';
  if(typeof showR==='function')showR('tg_result','⏳ JSON পাঠানো হচ্ছে...','info');
  var msg='🗂 Daily Account Backup\n📅 '+_d()+(withMedia?' 📸 মিডিয়া সহ':'')+'\n📊 আয়: '+d2.income.length+' · ব্যয়: '+d2.expense.length+' · লেজার: '+d2.ledger.length+'\n📎 ফাইল: '+fname;
  _tgMsg(token,chatId,msg).then(function(){
    var blob=new Blob([json],{type:'application/json'});
    _tgSendFile(token,chatId,blob,fname,'📁 '+fname+' | Daily Account','tg_result')
      .then(function(ok){if(ok&&withMedia)_tgSendMediaFiles(token,chatId);});
  }).catch(function(e){if(typeof showR==='function')showR('tg_result','❌ '+e.message,'err');});
}

/* JSON all-in-one with media */
function tgSendAllInOne(){
  var token=_tgToken(),chatId=_tgChatId();
  if(!token||!chatId){if(typeof showR==='function')showR('tg_result','❌ Token ও Chat ID সংরক্ষণ করুন','err');return;}
  if(typeof showR==='function')showR('tg_result','⏳ সব এক ফাইলে তৈরি হচ্ছে...','info');
  var json=buildJSON(true);
  var blob=new Blob([json],{type:'application/json'});
  var fname='DA-fullbackup-'+_d()+'.json';
  _tgSendFile(token,chatId,blob,fname,'📦 Full Backup (media সহ) | '+_d()+' | ~'+Math.round(json.length/1024)+'KB','tg_result');
}

/* CSV — 4 separate files */
function tgSendCSV(){
  var token=_tgToken(),chatId=_tgChatId();
  if(!token||!chatId){if(typeof showR==='function')showR('tg_result','❌ Token ও Chat ID সংরক্ষণ করুন','err');return;}
  var sheets=buildCSVAll(); var d=_d();
  var files=[
    {data:sheets.income,  name:'DA-income-'+d+'.csv',   cap:'💰 আয়ের CSV | '+d},
    {data:sheets.expense, name:'DA-expense-'+d+'.csv',  cap:'💸 ব্যয়ের CSV | '+d},
    {data:sheets.ledger,  name:'DA-ledger-'+d+'.csv',   cap:'📒 দেনাপাওনা CSV | '+d},
    {data:sheets.savings, name:'DA-savings-'+d+'.csv',  cap:'🏦 সঞ্চয় CSV | '+d},
  ];
  if(typeof showR==='function')showR('tg_result','⏳ CSV ফাইলগুলো পাঠানো হচ্ছে (৪টি)...','info');
  var i=0;
  function next(){
    if(i>=files.length){if(typeof showR==='function')showR('tg_result','✅ সব CSV (৪টি) Telegram এ পাঠানো সফল! 🎉','ok');return;}
    var f=files[i++];
    var blob=new Blob([f.data],{type:'text/csv;charset=utf-8'});
    _tgSendFile(token,chatId,blob,f.name,f.cap,'tg_result').then(function(){setTimeout(next,800);});
  }
  next();
}

/* Excel (.xlsx proper via SheetJS) */
function tgSendExcel(){
  var token=_tgToken(),chatId=_tgChatId();
  if(!token||!chatId){if(typeof showR==='function')showR('tg_result','❌ Token ও Chat ID সংরক্ষণ করুন','err');return;}
  if(typeof showR==='function')showR('tg_result','⏳ Excel তৈরি হচ্ছে...','info');
  _loadXLSX(function(){
    try{
      var blob=_xlsxBlob();
      var fname='DA-Excel-'+_d()+'.xlsx';
      _tgSendFile(token,chatId,blob,fname,
        '📊 Daily Account Excel (.xlsx)\n📅 '+_d()+'\n✅ সারসংক্ষেপ + আয় + ব্যয় + দেনাপাওনা\n💡 Excel / Google Sheets এ খুলুন',
        'tg_result');
    }catch(e){if(typeof showR==='function')showR('tg_result','❌ Excel তৈরিতে সমস্যা: '+e.message,'err');}
  });
}

/* Word (.docx proper) */
function tgSendWord(){
  var token=_tgToken(),chatId=_tgChatId();
  if(!token||!chatId){if(typeof showR==='function')showR('tg_result','❌ Token ও Chat ID সংরক্ষণ করুন','err');return;}
  if(typeof showR==='function')showR('tg_result','⏳ Word Document তৈরি হচ্ছে...','info');
  _wordBlob(function(blob){
    var fname='DA-Report-'+_d()+'.docx';
    _tgSendFile(token,chatId,blob,fname,
      '📝 Daily Account Word Report (.docx)\n📅 '+_d()+'\n✅ সম্পূর্ণ আর্থিক রিপোর্ট + AI বিশ্লেষণ\n💡 MS Word / Google Docs এ খুলুন',
      'tg_result');
  });
}

/* AI Text (.txt) */
function tgSendAI(){
  var token=_tgToken(),chatId=_tgChatId();
  if(!token||!chatId){if(typeof showR==='function')showR('tg_result','❌ Token ও Chat ID সংরক্ষণ করুন','err');return;}
  if(typeof showR==='function')showR('tg_result','⏳ AI বিশ্লেষণ তৈরি হচ্ছে...','info');
  var txt=buildAIDeep();
  var blob=new Blob([txt],{type:'text/plain;charset=utf-8'});
  var fname='DA-AI-Analysis-'+_d()+'.txt';
  _tgSendFile(token,chatId,blob,fname,
    '🤖 AI আর্থিক বিশ্লেষণ (.txt)\n📅 '+_d()+'\n✅ আয়+ব্যয়+দেনাপাওনা+AI পরামর্শ\n| Daily Account | জাকির আল জিহাদ',
    'tg_result');
}

/* Simple HTML report — used by tgSendPDF & doPDFReport */
function _buildWordHTML(){
  var d=_getData();var t=_totals(d);
  var expCats={};d.expense.forEach(function(e){var k=e.category||e.source||'অন্যান্য';expCats[k]=(expCats[k]||0)+_num(e.amount);});
  var topCats=Object.keys(expCats).sort(function(a,b){return expCats[b]-expCats[a];}).slice(0,5);
  var incSrc={};d.income.forEach(function(i){var k=i.source||'অন্যান্য';incSrc[k]=(incSrc[k]||0)+_num(i.amount);});
  var topInc=Object.keys(incSrc).sort(function(a,b){return incSrc[b]-incSrc[a];}).slice(0,5);
  var savR=t.inc>0?((t.sav/t.inc)*100).toFixed(1):'0.0';
  var expR=t.inc>0?((t.exp/t.inc)*100).toFixed(1):'0.0';
  function mkTbl(hdrs,rows,hc){
    var s='<table style="width:100%;border-collapse:collapse;margin-bottom:14pt">';
    s+='<tr>'+hdrs.map(function(h){return '<th style="background:'+hc+';color:#fff;font-weight:bold;padding:6pt 8pt;border:1px solid #ccc;font-size:10pt">'+h+'</th>';}).join('')+'</tr>';
    rows.forEach(function(r,i){var bg=i%2?'#f8fafc':'#fff';s+='<tr>'+r.map(function(c){return '<td style="padding:5pt 8pt;border:1px solid #ddd;font-size:10pt;background:'+bg+'">'+String(c||'-')+'</td>';}).join('')+'</tr>';});
    return s+'</table>';
  }
  var h='<!DOCTYPE html><html><head><meta charset="UTF-8"><style>';
  h+='body{font-family:Arial,sans-serif;font-size:11pt;color:#1f2937;line-height:1.5;padding:20pt}';
  h+='h1{color:#1e3a5f;font-size:18pt;border-bottom:2pt solid #1e3a5f;padding-bottom:5pt;margin:20pt 0 10pt}';
  h+='h2{color:#374151;font-size:13pt;margin:16pt 0 8pt;border-left:4pt solid #1e3a5f;padding-left:8pt}';
  h+='</style></head><body>';
  h+='<div style="text-align:center;border-bottom:2pt solid #1e3a5f;padding-bottom:16pt;margin-bottom:16pt">';
  h+='<div style="font-size:24pt;font-weight:bold;color:#1e3a5f">Daily Account</div>';
  h+='<div style="font-size:14pt;color:#374151;margin-top:5pt">সম্পূর্ণ আর্থিক রিপোর্ট</div>';
  h+='<div style="font-size:10pt;color:#6b7280;margin-top:6pt">তারিখ: '+_d()+' | Developer: জাকির আল জিহাদ</div></div>';
  h+='<h1>সারসংক্ষেপ</h1>';
  h+=mkTbl(['বিষয়','পরিমাণ'],[['মোট আয়',_fmtAmt(t.inc)],['মোট ব্যয়',_fmtAmt(t.exp)],['নেট ব্যালেন্স',_fmtAmt(t.bal)],['সঞ্চয়',_fmtAmt(t.sav)],['বকেয়া দেনা',_fmtAmt(t.uDena)],['বকেয়া পাওনা',_fmtAmt(t.uPabona)],['ব্যয়ের হার',expR+'%'],['সঞ্চয়ের হার',savR+'%']],'#1e3a5f');
  h+='<h1>আয়ের তালিকা ('+d.income.length+' টি)</h1>';
  h+=mkTbl(['উৎস','পরিমাণ','তারিখ','সময়','নোট'],d.income.map(function(i){return[i.source||'',_fmtAmt(i.amount),i.date||'',i.time||'',i.note||''];}),'#059669');
  h+='<h1>ব্যয়ের তালিকা ('+d.expense.length+' টি)</h1>';
  h+=mkTbl(['ক্যাটাগরি','পরিমাণ','তারিখ','সময়','নোট'],d.expense.map(function(i){return[i.category||i.source||'',_fmtAmt(i.amount),i.date||'',i.time||'',i.note||''];}),'#dc2626');
  if(topCats.length){h+='<h2>শীর্ষ ব্যয়ের ক্যাটাগরি</h2>';h+=mkTbl(['ক্যাটাগরি','পরিমাণ','%'],topCats.map(function(c,i){return[c,_fmtAmt(expCats[c]),t.exp>0?((expCats[c]/t.exp)*100).toFixed(1)+'%':'0%'];}),'#b91c1c');}
  h+='<h1>দেনাপাওনার খাতা ('+d.ledger.length+' টি)</h1>';
  h+=mkTbl(['ধরন','ব্যক্তি','পরিমাণ','তারিখ','পরিশোধ','পরিশোধ তারিখ','নোট'],d.ledger.map(function(i){return[i.type==='dena'?'দেনা':'পাওনা',i.person||i.name||'',_fmtAmt(i.amount),i.date||'',i.paid?'হ্যাঁ':'না',i.paidDate||'',i.note||''];}),'#d97706');
  if(d.savings.length){h+='<h1>সঞ্চয়ের তালিকা</h1>';h+=mkTbl(['শিরোনাম','পরিমাণ','লক্ষ্য','তারিখ','নোট'],d.savings.map(function(i){return[i.title||i.category||'',_fmtAmt(i.amount),_fmtAmt(i.goal||0),i.date||'',i.note||''];}),'#7c3aed');}
  if(topInc.length){h+='<h2>শীর্ষ আয়ের উৎস</h2>';h+=mkTbl(['উৎস','পরিমাণ','%'],topInc.map(function(k){return[k,_fmtAmt(incSrc[k]),t.inc>0?((incSrc[k]/t.inc)*100).toFixed(1)+'%':'0%'];}),'#059669');}
  h+='<p style="text-align:center;color:#9ca3af;font-size:9pt;margin-top:20pt;border-top:1px solid #e5e7eb;padding-top:10pt">Daily Account v6.0 | জাকির আল জিহাদ | '+_d()+'</p>';
  h+='</body></html>';
  return h;
}

/* HTML Report (PDF করুন) */
function tgSendPDF(){
  var token=_tgToken(),chatId=_tgChatId();
  if(!token||!chatId){if(typeof showR==='function')showR('tg_result','❌ Token ও Chat ID সংরক্ষণ করুন','err');return;}
  if(typeof showR==='function')showR('tg_result','⏳ HTML রিপোর্ট তৈরি হচ্ছে...','info');
  var html=_buildWordHTML(); // same HTML, save as .html
  var blob=new Blob([html],{type:'text/html;charset=utf-8'});
  var fname='DA-Report-'+_d()+'.html';
  _tgSendFile(token,chatId,blob,fname,
    '📄 Daily Account HTML রিপোর্ট\n📅 '+_d()+'\n💡 ব্রাউজারে খুলুন → Print → Save as PDF\n| Daily Account | জাকির আল জিহাদ',
    'tg_result');
}

/* MEGA ZIP — JSON+CSV+Excel+Word+AI+HTML+Media */
function tgSendMegaZip(){
  var token=_tgToken(),chatId=_tgChatId();
  if(!token||!chatId){if(typeof showR==='function')showR('tg_result','❌ Token ও Chat ID সংরক্ষণ করুন','err');return;}
  if(typeof showR==='function')showR('tg_result','⏳ MEGA ZIP তৈরি হচ্ছে...','info');

  function loadJSZip(cb){
    if(typeof JSZip!=='undefined'){cb();return;}
    var sc=document.createElement('script');
    sc.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    sc.onload=function(){cb();};
    sc.onerror=function(){if(typeof showR==='function')showR('tg_result','❌ JSZip library লোড হয়নি','err');};
    document.head.appendChild(sc);
  }

  loadJSZip(function(){
    _loadXLSX(function(){
      var d2=_d(); var zip=new JSZip();
      zip.file('json/DA-backup-'+d2+'.json', buildJSON(false));
      var sheets=buildCSVAll();
      zip.file('csv/income.csv',sheets.income);
      zip.file('csv/expense.csv',sheets.expense);
      zip.file('csv/ledger.csv',sheets.ledger);
      zip.file('csv/savings.csv',sheets.savings);
      // Excel
      try{var wb=_buildXLSXWorkbook();var xlsBin=XLSX.write(wb,{bookType:'xlsx',type:'array'});zip.file('excel/DA-Excel-'+d2+'.xlsx',xlsBin);}catch(e){}
      // AI text
      zip.file('analysis/DA-AI-'+d2+'.txt',buildAIDeep());
      // HTML report
      zip.file('html/DA-Report-'+d2+'.html',_buildWordHTML());
      // Media
      var pF=zip.folder('media/photo'),dF=zip.folder('media/drawing'),vF=zip.folder('media/voice');
      var d3=_getData();
      ['income','expense','ledger','savings'].forEach(function(s){
        (d3[s]||[]).forEach(function(item){
          var id=item.id||Date.now();
          if(item.photo&&item.photo.indexOf('data:')===0)try{pF.file(s+'_'+id+'.jpg',item.photo.split(',')[1],{base64:true});}catch(e){}
          if(item.drawing&&item.drawing.indexOf('data:')===0)try{dF.file(s+'_'+id+'.png',item.drawing.split(',')[1],{base64:true});}catch(e){}
          if(item.voice&&item.voice.indexOf('data:')===0)try{vF.file(s+'_'+id+'.webm',item.voice.split(',')[1],{base64:true});}catch(e){}
        });
      });

      // Word — async, add after
      _wordBlob(function(wordBlob){
        wordBlob.arrayBuffer().then(function(buf){
          zip.file('word/DA-Report-'+d2+'.docx',buf);
          zip.generateAsync({type:'blob',compression:'DEFLATE'}).then(function(zipBlob){
            var fname='DA-MegaBackup-'+d2+'.zip';
            _tgSendFile(token,chatId,zipBlob,fname,
              '🗜️ MEGA ZIP Backup\n📅 '+d2+'\n✅ JSON+CSV+Excel(.xlsx)+Word(.docx)+AI+HTML+Media\n| Daily Account v6.0 | জাকির আল জিহাদ',
              'tg_result');
          });
        }).catch(function(){
          // Word failed, send without
          zip.generateAsync({type:'blob',compression:'DEFLATE'}).then(function(zipBlob){
            _tgSendFile(token,chatId,zipBlob,'DA-MegaBackup-'+d2+'.zip',
              '🗜️ MEGA ZIP (Word ছাড়া) | '+d2+' | Daily Account','tg_result');
          });
        });
      });
    });
  });
}

/* Media sender helper */
function _tgSendMediaFiles(token,chatId){
  var stores=['income','expense','ledger','savings','notes'];
  var files=[];
  var d2=_getData();
  stores.forEach(function(s){
    (d2[s]||[]).forEach(function(item){
      var id=item.id||Date.now();
      if(item.photo&&item.photo.indexOf('data:')===0)files.push({data:item.photo,name:'photo_'+id+'.jpg'});
      if(item.drawing&&item.drawing.indexOf('data:')===0)files.push({data:item.drawing,name:'drawing_'+id+'.png'});
      if(item.voice&&item.voice.indexOf('data:')===0)files.push({data:item.voice,name:'voice_'+id+'.webm'});
    });
  });
  if(!files.length)return;
  _tgMsg(token,chatId,'📸 মিডিয়া ফাইল পাঠানো হচ্ছে: '+files.length+' টি');
  var i=0;var toSend=files.slice(0,9);
  function next(){
    if(i>=toSend.length)return;
    var item=toSend[i++];
    var parts=item.data.split(',');
    var mime=parts[0].match(/:(.*?);/)[1];
    var bin=atob(parts[1]);var arr=new Uint8Array(bin.length);
    for(var j=0;j<bin.length;j++)arr[j]=bin.charCodeAt(j);
    var blob=new Blob([arr],{type:mime});
    var form=new FormData();form.append('chat_id',chatId);form.append('document',blob,item.name);
    fetch('https://api.telegram.org/bot'+token+'/sendDocument',{method:'POST',body:form})
      .then(function(){setTimeout(next,600);}).catch(function(){setTimeout(next,600);});
  }
  next();
}

/* ════════════════════════════════════════
   LOCAL DOWNLOAD / SHARE (Hopweb compat)
════════════════════════════════════════ */

function doBackup(withMedia,act){
  var json=buildJSON(withMedia);
  var fn='DA-backup'+(withMedia?'-media':'')+'-'+_d()+'.json';
  var ta=document.getElementById('jsonTA');
  if(act==='cp'||act==='sh'){
    if(ta){ta.value=json;ta.className='ta show';ta.select();}
    if(act==='sh'&&navigator.share){
      navigator.share({title:'Daily Account Backup '+_d(),text:json})
        .then(function(){if(typeof showSt==='function')showSt('bkSt','✅ শেয়ার/সেভ সফল!','ok');})
        .catch(function(){_copyToClip(json,'bkSt');});
    }else{_copyToClip(json,'bkSt');}
  }
}

function shareText(){
  var json=buildJSON(false);
  if(navigator.share){navigator.share({title:'Daily Account Backup '+_d(),text:json}).catch(function(){_copyToClip(json,'bkSt');});}
  else{_copyToClip(json,'bkSt');}
}

function doCSVAllSheets(){
  var sheets=buildCSVAll();
  var combined='\uFEFF=== আয় ===\n'+sheets.income+'\n=== ব্যয় ===\n'+sheets.expense+'\n=== দেনাপাওনা ===\n'+sheets.ledger+'\n=== সঞ্চয় ===\n'+sheets.savings;
  _shareOrCopy(combined,'DA-CSV-'+_d()+'.csv','text/csv;charset=utf-8','csvSt');
}

function doExcelDownload(){
  if(typeof showSt==='function')showSt('csvSt','⏳ Excel তৈরি হচ্ছে...','info');
  _loadXLSX(function(){
    try{
      var blob=_xlsxBlob();
      var fname='DA-Excel-'+_d()+'.xlsx';
      if(navigator.share&&navigator.canShare){
        try{
          var file=new File([blob],fname,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
          if(navigator.canShare({files:[file]})){
            navigator.share({files:[file],title:'Daily Account Excel'})
              .then(function(){if(typeof showSt==='function')showSt('csvSt','✅ Excel শেয়ার/সেভ সফল!','ok');})
              .catch(function(){if(typeof showSt==='function')showSt('csvSt','❌ শেয়ার বাতিল। Telegram এ পাঠান।','err');});
            return;
          }
        }catch(e){}
      }
      if(typeof showSt==='function')showSt('csvSt','❌ Hopweb এ Excel save সম্ভব নয়। Telegram বাটন ব্যবহার করুন!','err');
    }catch(e){if(typeof showSt==='function')showSt('csvSt','❌ '+e.message,'err');}
  });
}

function doWordDownload(){
  if(typeof showSt==='function')showSt('aiSt','⏳ Word Document তৈরি হচ্ছে...','info');
  _wordBlob(function(blob){
    var fname='DA-Report-'+_d()+'.docx';
    if(navigator.share&&navigator.canShare){
      try{
        var file=new File([blob],fname,{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
        if(navigator.canShare({files:[file]})){
          navigator.share({files:[file],title:'Daily Account Report'})
            .then(function(){if(typeof showSt==='function')showSt('aiSt','✅ Word শেয়ার/সেভ সফল!','ok');})
            .catch(function(){if(typeof showSt==='function')showSt('aiSt','❌ শেয়ার বাতিল। Telegram এ পাঠান।','err');});
          return;
        }
      }catch(e){}
    }
    if(typeof showSt==='function')showSt('aiSt','❌ Hopweb এ Word save সম্ভব নয়। Telegram বাটন ব্যবহার করুন!','err');
  });
}

function doAITxt(){
  var txt=buildAIDeep();
  _shareOrCopy(txt,'DA-AI-'+_d()+'.txt','text/plain;charset=utf-8','aiSt');
}
function doPDFReport(){
  var html=_buildWordHTML();
  _shareOrCopy(html,'DA-Report-'+_d()+'.html','text/html;charset=utf-8','aiSt');
}

function doZipAll(){
  if(typeof showSt==='function')showSt('csvSt','❌ Hopweb এ ZIP save সম্ভব নয়। Telegram → MEGA ZIP বাটন ব্যবহার করুন!','err');
}

/* ════════════════════════════════════════
   CSV RESET
════════════════════════════════════════ */
function resetFromCSV(){
  if(!confirm('⚠️ CSV দিয়ে আয়/ব্যয় রিসেট হবে। নিশ্চিত?'))return;
  var ta=document.getElementById('csvTA');
  if(!ta||!ta.value.trim()){if(typeof showSt==='function')showSt('csvSt','❌ আগে CSV কপি করুন','err');return;}
  try{
    var lines=ta.value.split('\n'),income=[],expense=[];
    for(var i=1;i<lines.length;i++){
      var c=lines[i].split(',');if(c.length<3)continue;
      var type=c[0].replace(/"/g,'').trim();
      var obj={id:Date.now()+'_'+i,source:c[1].replace(/"/g,'').trim(),category:c[1].replace(/"/g,'').trim(),
               amount:parseFloat(c[2])||0,date:c[3]?c[3].replace(/"/g,'').trim():'',
               time:c[4]?c[4].replace(/"/g,'').trim():'',note:c[5]?c[5].replace(/"/g,'').trim():''};
      if(type==='আয়')income.push(obj);else if(type==='ব্যয়'||type==='ক্যাটাগরি')expense.push(obj);
    }
    DB.set('income',income);DB.set('expense',expense);
    if(typeof showSt==='function')showSt('csvSt','✅ আমদানি সফল! আয়: '+income.length+' | ব্যয়: '+expense.length,'ok');
  }catch(e){if(typeof showSt==='function')showSt('csvSt','❌ '+e.message,'err');}
}

/* ════════════════════════════════════════
   RESTORE
════════════════════════════════════════ */
function doRestore(data){
  if(!confirm('⚠️ বর্তমান ডাটা মুছে নতুন ডাটা রিস্টোর হবে। নিশ্চিত?'))return;
  ['income','expense','ledger','savings','notes','settings','cssConfig','pageConfig'].forEach(function(k){if(data[k]!==undefined)DB.set(k,data[k]);});
  if(typeof showSt==='function')showSt('rstSt','✅ রিস্টোর সফল! পেজ লোড হচ্ছে...','ok');
  setTimeout(function(){location.href='../index.html';},1500);
}
function restoreFromPaste(){
  var t=document.getElementById('pasteTA');
  if(!t||!t.value.trim()){if(typeof showSt==='function')showSt('rstSt','❌ কিছু paste করুন','err');return;}
  try{doRestore(JSON.parse(t.value));}catch(e){if(typeof showSt==='function')showSt('rstSt','❌ ভুল JSON: '+e.message,'err');}
}
function restoreJSON(ev){
  var f=ev.target.files[0];if(!f)return;ev.target.value='';
  var r=new FileReader();
  r.onload=function(e){try{doRestore(JSON.parse(e.target.result));}catch(er){if(typeof showSt==='function')showSt('rstSt','❌ ভুল ফাইল!','err');}};
  r.readAsText(f);
}

/* ════════════════════════════════════════
   FONT
════════════════════════════════════════ */
function uploadFont(ev,type){
  var f=ev.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(e){
    var b64=e.target.result.split(',')[1];
    var stored={};try{stored=JSON.parse(localStorage.getItem('uploadedFonts')||'{}');}catch(e2){}
    stored[type]={b64:b64,mime:f.name.split('.').pop().toLowerCase(),name:f.name};
    localStorage.setItem('uploadedFonts',JSON.stringify(stored));
    var cf=DB.get('customFonts')||{};cf[type]=f.name.replace(/\.[^.]+$/,'');DB.set('customFonts',cf);
    if(typeof applyCustomFonts==='function')applyCustomFonts();
    var ids={bangla:'btnBn',english:'btnEn',number:'btnNum'};
    var btn=document.getElementById(ids[type]);
    if(btn){btn.textContent='✅ '+f.name.slice(0,13);btn.className='fu loaded';}
    if(typeof showSt==='function')showSt('fntSt','✅ '+f.name+' ফন্ট লোড হয়েছে!','ok');
  };
  r.readAsDataURL(f);
}
function clearFont(type){
  var stored={};try{stored=JSON.parse(localStorage.getItem('uploadedFonts')||'{}');}catch(e){}
  delete stored[type];localStorage.setItem('uploadedFonts',JSON.stringify(stored));
  var cf=DB.get('customFonts')||{};delete cf[type];DB.set('customFonts',cf);
  if(typeof applyCustomFonts==='function')applyCustomFonts();
  var ids={bangla:'btnBn',english:'btnEn',number:'btnNum'};
  var btn=document.getElementById(ids[type]);
  if(btn){btn.textContent='📁 আপলোড';btn.className='fu';}
  if(typeof showSt==='function')showSt('fntSt','🗑️ ফন্ট সরানো হয়েছে','ok');
}

/* ════════════════════════════════════════
   GAS CODE COPY
════════════════════════════════════════ */
function copyGASCode(){
  var code=document.getElementById('gasCode');if(!code)return;
  if(navigator.clipboard){
    navigator.clipboard.writeText(code.textContent).then(function(){
      var btn=document.querySelector('.copy-script');
      if(btn){btn.textContent='✅ কপি!';setTimeout(function(){btn.textContent='📋 Copy';},2000);}
    });
  }
}

console.log('✅ AnalysisForexbackup.js v6.0 loaded | Excel+Word+Telegram | জাকির আল জিহাদ');
