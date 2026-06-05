// ================================================================
//  Daily Account — full-page-setup.js  v4.0
//  List pages: full controls + live preview
//  Other pages: page-specific controls only
// ================================================================

var _curPage = 'income';
var _curFW   = '700';

var LIST_PAGES = ['income','expense','ledger','savings'];

/* ── Page defaults ── */
var PAGE_DEFAULTS = {
    income:    {hBg1:'#10b981',hBg2:'#059669',hAngle:135,hColor:'#ffffff',sBg1:'#10b981',sBg2:'#059669',cBg1:'#f0fdf4',cBg2:'#dcfce7',cBorder:'#10b981',bw:5,cR:14,amtC:'#059669',shd:'0 4px 16px rgba(0,0,0,.12)',fs:14,ts:19,fw:'700',fc:'#1f2937',ls:0,pad:14,gap:12},
    expense:   {hBg1:'#ef4444',hBg2:'#dc2626',hAngle:135,hColor:'#ffffff',sBg1:'#ef4444',sBg2:'#dc2626',cBg1:'#fef2f2',cBg2:'#fee2e2',cBorder:'#ef4444',bw:5,cR:14,amtC:'#dc2626',shd:'0 4px 16px rgba(0,0,0,.12)',fs:14,ts:19,fw:'700',fc:'#1f2937',ls:0,pad:14,gap:12},
    ledger:    {hBg1:'#f59e0b',hBg2:'#d97706',hAngle:135,hColor:'#ffffff',sBg1:'#f59e0b',sBg2:'#d97706',cBg1:'#fff7ed',cBg2:'#ffedd5',cBorder:'#f59e0b',bw:5,cR:14,amtC:'#ea580c',shd:'0 4px 16px rgba(0,0,0,.12)',fs:14,ts:19,fw:'700',fc:'#1f2937',ls:0,pad:14,gap:12},
    savings:   {hBg1:'#E2136E',hBg2:'#b5105a',hAngle:135,hColor:'#ffffff',sBg1:'#E2136E',sBg2:'#b5105a',cBg1:'#fff0f7',cBg2:'#fce4ef',cBorder:'#E2136E',bw:5,cR:14,amtC:'#E2136E',shd:'0 4px 16px rgba(0,0,0,.12)',fs:14,ts:19,fw:'700',fc:'#1f2937',ls:0,pad:14,gap:12},
    /* Non-list pages */
    index:     {hBg1:'#3b82f6',hBg2:'#8b5cf6',hColor:'#ffffff',bgMain:'#f1f5f9',textC:'#1f2937',fs:15,
                /* balance-main: dashboard.css → linear-gradient(135deg,#10b981,#059669) */
                balBg1:'#10b981',balBg2:'#059669',balTxtC:'#ffffff',balFS:52,
                /* mini cards: dashboard.css → income #10b981/#059669, expense #ef4444/#dc2626, dena #fbbf24/#f59e0b, pabona #3b82f6/#2563eb, savings #E2136E/#b5105a */
                incCardC:'#10b981',expCardC:'#ef4444',ledCardC:'#fbbf24',savCardC:'#E2136E',
                menuBg:'#ffffff',menuBorderC:'#e2e8f0',menuTxtC:'#1f2937',menuIconSz:36,
                footerBg:'#ffffff',footerBorderC:'#e5e7eb',footerStyle:'classic',
                footerInc:'#10b981',footerExp:'#ef4444',footerLed:'#3b82f6',footerSet:'#E2136E',
                footerIconSz:22,footerTxtSz:9,footerPad:8},
    analysis:  {hBg1:'#0ea5e9',hBg2:'#0284c7',hColor:'#ffffff',bgMain:'#f0f9ff',textC:'#1f2937',fs:14,
                chartC1:'#10b981',chartC2:'#ef4444',chartC3:'#a855f7',chartC4:'#f59e0b',
                anlCardBg:'#ffffff',anlCardRadius:20,
                sumIncC1:'#10b981',sumIncC2:'#059669',sumExpC1:'#ef4444',sumExpC2:'#dc2626',
                sumSavC1:'#a855f7',sumSavC2:'#9333ea',
                healthBarColor:'#10b981',
                statBg:'#f0f9ff',statTxt:'#0ea5e9',kpiFontSz:14,
                adviceBg:'rgba(14,165,233,.08)',adviceBorderC:'#0ea5e9',adviceTxtC:'#0369a1',adviceFontSz:14},
    notes:     {hBg1:'#8b5cf6',hBg2:'#7c3aed',hColor:'#ffffff',bgMain:'#f8fafc',textC:'#374151',fs:15,
                noteCardBg:'#ffffff',noteCardRadius:14,
                noteTitleC:'#1f2937',noteTitleSz:17,
                noteTextC:'#374151',noteTextSz:15,
                noteTagBg:'#ede9fe',noteTagC:'#6d28d9',
                fabBg1:'#8b5cf6',fabBg2:'#7c3aed',fabSize:54},
    settings:  {hBg1:'#1e293b',hBg2:'#0f172a',hColor:'#ffffff',bgMain:'#f8fafc',textC:'#374151',fs:14,
                secBg:'#ffffff',secBorderC:'#e2e8f0',secRadius:14,
                itemBorderC:'#f1f5f9',iconBg:'#eff6ff',iconC:'#3b82f6',
                toggleOnC:'#10b981',labelC:'#1f2937',subLabelC:'#6b7280'},
    accounting:{hBg1:'#1e3a5f',hBg2:'#0f2744',hColor:'#ffffff',bgMain:'#f0f4ff',textC:'#1f2937',fs:13,
                tblHdrBg:'#1e3a5f',tblHdrTxt:'#ffffff',
                tblBorderC:'#e2e8f0',tblRow1:'#ffffff',tblRow2:'#f8fafc',
                drC:'#dc2626',crC:'#16a34a',totBg:'#f0f4ff',totBorderC:'#667eea'},
    trash:     {hBg1:'#dc2626',hBg2:'#991b1b',hColor:'#ffffff',bgMain:'#fef2f2',textC:'#374151',fs:14,
                itemBg:'#fef2f2',itemBorderC:'#fecaca',itemRadius:12,
                restoreBtnBg:'#10b981',deleteBtnBg:'#dc2626',
                filterBtnBg:'#f1f5f9',filterActiveBg:'#dc2626'},
    calculator:{hBg1:'#f59e0b',hBg2:'#d97706',hColor:'#ffffff',bgMain:'#f1f5f9',textC:'#1f2937',fs:14,
                dispBg:'#1e293b',dispTxtC:'#ffffff',dispExprC:'#94a3b8',
                numBtnBg:'#ffffff',numBtnTxt:'#1f2937',numBtnShadow:true,
                opBtnBg:'#f59e0b',opBtnTxt:'#ffffff',
                eqBtnBg:'#10b981',eqBtnTxt:'#ffffff',
                clearBtnBg:'#ef4444',clearBtnTxt:'#ffffff',
                btnRadius:12,btnFontSz:20},
};

/* ── Helpers ── */
function _g(id)  { var e=document.getElementById(id); return e?e.value:''; }
function _s(id,v){ var e=document.getElementById(id); if(e) e.value=v; }
function _sr(id,v,vid,unit){ _s(id,v); var el=document.getElementById(vid); if(el) el.textContent=v+(unit||''); }

function _getCfg(pg) {
    var saved=null;
    try{
        if(typeof DB!=='undefined'&&DB.getPageConfig) saved=DB.getPageConfig(pg);
        else{ var all=JSON.parse(localStorage.getItem('pageConfig')||'{}'); saved=all[pg]||null; }
    }catch(e){}
    return Object.assign({},PAGE_DEFAULTS[pg]||PAGE_DEFAULTS.income,saved||{});
}

function _saveToDB(pg,cfg){
    try{
        if(typeof DB!=='undefined'&&DB.setPageConfig){ DB.setPageConfig(pg,cfg); return; }
        var all=JSON.parse(localStorage.getItem('pageConfig')||'{}');
        all[pg]=cfg; localStorage.setItem('pageConfig',JSON.stringify(all));
    }catch(e){}
}

function fpsToast(msg){
    var t=document.getElementById('__fpsToast');
    if(!t){ t=document.createElement('div'); t.id='__fpsToast'; t.className='fps-toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show');
    setTimeout(function(){ t.classList.remove('show'); },2000);
}

/* ── SWITCH PAGE ── */
function switchPage(btn, pg) {
    document.querySelectorAll('.fps-tab').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    _curPage = pg;

    // Nav bar এ current page দেখানো
    var _pgLabels={income:'💚 আয়',expense:'💸 ব্যয়',ledger:'📒 দেনাপাওনা',savings:'💜 সঞ্চয়',
                   index:'🏠 হোম',analysis:'📊 বিশ্লেষণ',notes:'📝 নোটস',settings:'⚙️ সেটিংস',
                   accounting:'📚 হিসাব',trash:'🗑️ ট্র্যাশ',calculator:'🔢 ক্যালকুলেটর'};
    var plusBtn=document.getElementById('fpsNavPlusBtn');
    if(plusBtn){ plusBtn.title='বর্তমান: '+(_pgLabels[pg]||pg); }

    var isList = LIST_PAGES.indexOf(pg) > -1;

    var lc = document.getElementById('listControls');
    var sc = document.getElementById('specificControls');
    if (lc) lc.style.display = isList ? 'block' : 'none';
    if (sc) sc.style.display = isList ? 'none'  : 'block';

    if (isList) {
        _loadListControls();
        livePreview();
    } else {
        _loadSpecificControls(pg);
    }
}

/* ════ LIST PAGE CONTROLS ════ */
function _loadListControls() {
    var cfg = _getCfg(_curPage);
    _s('headerBg1', cfg.hBg1);
    _s('headerBg2', cfg.hBg2);
    _s('headerColor',cfg.hColor);
    _s('summBg1',   cfg.sBg1);
    _s('summBg2',   cfg.sBg2);
    _s('cardBg1',   cfg.cBg1);
    _s('cardBg2',   cfg.cBg2);
    _s('cardBorder',cfg.cBorder);
    _s('amountColor',cfg.amtC);
    _sr('borderW',  cfg.bw,  'borderWVal',  'px');
    _sr('cardRadius',cfg.cR,'cardRadiusVal','px');
    _sr('fontSize',  cfg.fs, 'fontSizeVal', 'px');
    _sr('titleSize', cfg.ts, 'titleSizeVal','px');
    _sr('letterSpacing',cfg.ls,'lsVal',     'px');
    _sr('cardPad',  cfg.pad,'padVal',       'px');
    _sr('cardGap',  cfg.gap,'gapVal',       'px');
    _s('fontColor', cfg.fc);
    _curFW = cfg.fw||'700';
    document.querySelectorAll('#fwGroup .fps-fw-btn').forEach(function(b){
        b.classList.toggle('active',b.dataset.fw===_curFW);
    });
    var shSel=document.getElementById('cardShadow');
    if(shSel) shSel.value=cfg.shd||'0 4px 16px rgba(0,0,0,.12)';

    // Update header color bar
    var hcb=document.getElementById('hdrColorBar');
    if(hcb) hcb.style.background='linear-gradient(135deg,'+cfg.hBg1+','+cfg.hBg2+')';

    // Load table configs
    var tc=DB.get('tblConfig')||{};
    _s('tblHdr1',    tc.hdr1||cfg.hBg1);
    _s('tblHdr2',    tc.hdr2||cfg.hBg2);
    _s('tblRow1',    tc.row1||'#ffffff');
    _s('tblRow2',    tc.row2||'#f8fafc');
    _s('tblThColor', tc.thColor||'#1d4ed8');
    _s('tblAmtColor',tc.amtColor||cfg.amtC);
}

function selectFW(btn) {
    document.querySelectorAll('#fwGroup .fps-fw-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    _curFW=btn.dataset.fw;
    livePreview();
}

function _readListControls() {
    return {
        hBg1:_g('headerBg1'),hBg2:_g('headerBg2'),hAngle:135,hColor:_g('headerColor'),
        sBg1:_g('summBg1'),sBg2:_g('summBg2'),
        cBg1:_g('cardBg1'),cBg2:_g('cardBg2'),
        cBorder:_g('cardBorder'),bw:+_g('borderW'),
        cR:+_g('cardRadius'),amtC:_g('amountColor'),
        shd:(document.getElementById('cardShadow')?document.getElementById('cardShadow').value:'0 4px 16px rgba(0,0,0,.12)'),
        fs:+_g('fontSize'),ts:+_g('titleSize'),fw:_curFW,
        fc:_g('fontColor'),ls:+_g('letterSpacing'),
        pad:+_g('cardPad'),gap:+_g('cardGap'),
    };
}

function saveCfg() {
    var cfg=_readListControls();
    _saveToDB(_curPage,cfg);
    if(typeof _applyCSSVars==='function') _applyCSSVars(_curPage,cfg);
    fpsToast('✅ '+_curPage+' সংরক্ষিত!');
}

function resetCfg() {
    var def=PAGE_DEFAULTS[_curPage];
    if(!def) return;
    _saveToDB(_curPage,def);
    _loadListControls();
    livePreview();
    setTimeout(function(){ if(typeof _initColorPickers==='function') _initColorPickers(); },200);
    fpsToast('↺ রিসেট সম্পন্ন');
}

function saveAllPages() {
    var cfg=_readListControls();
    LIST_PAGES.forEach(function(pg){ _saveToDB(pg,cfg); });
    fpsToast('✅ সব পেজে প্রয়োগ হয়েছে!');
}

function saveTblCfg() {
    var tc={hdr1:_g('tblHdr1'),hdr2:_g('tblHdr2'),row1:_g('tblRow1'),row2:_g('tblRow2'),
            thColor:_g('tblThColor'),amtColor:_g('tblAmtColor')};
    DB.set('tblConfig',tc);
    _applyTblVars(tc);
    fpsToast('✅ ছক সংরক্ষিত!');
}

function _applyTblVars(tc) {
    var r=document.documentElement.style;
    if(tc.hdr1)   r.setProperty('--tbl-hdr-bg','linear-gradient(135deg,'+tc.hdr1+','+tc.hdr2+')');
    if(tc.row1)   r.setProperty('--tbl-row1',tc.row1);
    if(tc.row2)   r.setProperty('--tbl-row2',tc.row2);
    if(tc.thColor)r.setProperty('--tbl-th-color',tc.thColor);
    if(tc.amtColor)r.setProperty('--tbl-amt-color',tc.amtColor);
}

function saveAnlCfg() {
    var ac={c1:_g('anlC1'),c2:_g('anlC2'),c3:_g('anlC3'),c4:_g('anlC4')};
    DB.set('anlConfig',ac);
    fpsToast('✅ বিশ্লেষণ রং সংরক্ষিত!');
}

/* ════ LIVE PREVIEW ════ */
function livePreview() {
    if(LIST_PAGES.indexOf(_curPage)===-1) return;
    var c=_readListControls();
    var hBg='linear-gradient('+c.hAngle+'deg,'+c.hBg1+','+c.hBg2+')';

    var pvHdr=document.getElementById('pvHdr');
    if(pvHdr){ pvHdr.style.background=hBg; }

    var pvTitle=document.getElementById('pvTitle');
    if(pvTitle){ pvTitle.style.color=c.hColor; pvTitle.style.fontSize=(c.ts*.7)+'px'; pvTitle.style.fontWeight=c.fw; }

    var pvSum=document.getElementById('pvSum');
    if(pvSum) pvSum.style.background='linear-gradient(135deg,'+c.sBg1+','+c.sBg2+')';

    var cBg='linear-gradient(135deg,'+c.cBg1+','+c.cBg2+')';
    [1,2].forEach(function(n){
        var pvc=document.getElementById('pvC'+n);
        if(pvc){
            pvc.style.background=cBg;
            pvc.style.borderLeft=c.bw+'px solid '+c.cBorder;
            pvc.style.borderRadius=Math.round(c.cR*.7)+'px';
            pvc.style.padding=Math.round(c.pad*.6)+'px '+Math.round(c.pad*.7)+'px';
            pvc.style.boxShadow=c.shd;
        }
        var pvn=document.getElementById('pvN'+n);
        if(pvn){ pvn.style.color=c.fc; pvn.style.fontSize=(c.fs*.85)+'px'; pvn.style.fontWeight=c.fw; }
        var pva=document.getElementById('pvA'+n);
        if(pva){ pva.style.color=c.amtC; pva.style.fontSize=(c.ts*.75)+'px'; pva.style.fontWeight='900'; }
    });

    var pvCards=document.getElementById('pvCards');
    if(pvCards) pvCards.style.gap=Math.round(c.gap*.5)+'px';

    // Update header color bar
    var hcb=document.getElementById('hdrColorBar');
    if(hcb) hcb.style.background=hBg;
}

/* ════ SPECIFIC PAGE CONTROLS ════ */
function _loadSpecificControls(pg) {
    var cfg = _getCfg(pg);
    var hdr = document.getElementById('specificHdr');
    var body= document.getElementById('specificBody');
    if(!hdr||!body) return;

    // Update header
    hdr.style.background='linear-gradient(135deg,'+(cfg.hBg1||'#667eea')+','+(cfg.hBg2||'#764ba2')+')';

    // Load common header fields
    _s('sp_hBg1',  cfg.hBg1  ||'#667eea');
    _s('sp_hBg2',  cfg.hBg2  ||'#764ba2');
    _s('sp_hColor',cfg.hColor||'#ffffff');
    _s('sp_bgMain',cfg.bgMain||'#f1f5f9');
    _s('sp_textC', cfg.textC ||'#1f2937');
    _sr('sp_fs',   cfg.fs||15,'sp_fsVal','px');

    var labels = {index:'🏠 হোম পেজ',analysis:'📊 বিশ্লেষণ',notes:'📝 নোটস',
                  settings:'⚙️ সেটিংস',accounting:'📚 হিসাব',trash:'🗑️ ট্র্যাশ',calculator:'🔢 ক্যালকুলেটর'};
    hdr.innerHTML = (labels[pg]||pg)+' কাস্টমাইজ';

    // Build page-specific controls
    var html = '';

    if (pg === 'index') {
        html += row2c('ব্যালেন্স রং ১','sp_balBg1',cfg.balBg1||'#10b981',
                      'ব্যালেন্স রং ২','sp_balBg2',cfg.balBg2||'#059669');
        html += row2c('ব্যালেন্স টেক্সট রং','sp_balTxtC',cfg.balTxtC||'#ffffff',
                      'টাকার রং','sp_balAmtC',cfg.balAmtC||'#ffffff');
        html += rowRange('ব্যালেন্স ফন্ট সাইজ','sp_balFS',cfg.balFS||52,28,72,'px','spBalFSV');
        html += '<div class="sub-label">💰 মিনি কার্ড রং</div>';
        html += row2c('আয় কার্ড','sp_incCardC',cfg.incCardC||'#10b981',
                      'ব্যয় কার্ড','sp_expCardC',cfg.expCardC||'#ef4444');
        html += row2c('দেনা কার্ড','sp_ledCardC',cfg.ledCardC||'#fbbf24',
                      'সঞ্চয় কার্ড','sp_savCardC',cfg.savCardC||'#E2136E');
        html += '<div class="sub-label">📋 মেনু বাটন</div>';
        html += row2c('মেনু ব্যাকগ্রাউন্ড','sp_menuBg',cfg.menuBg||'#ffffff',
                      'মেনু বর্ডার','sp_menuBorderC',cfg.menuBorderC||'#e2e8f0');
        html += row2c('মেনু টেক্সট','sp_menuTxtC',cfg.menuTxtC||'#1f2937',
                      '','','');
        html += rowRange('মেনু আইকন সাইজ','sp_menuIconSz',cfg.menuIconSz||36,20,60,'px','spMenuISzV');
        html += '<div class="sub-label">🔽 ফুটার নেভিগেশন বার স্টাইল</div>';
        html += '<div style="margin-bottom:12px">'
              + '<div style="font-size:.76rem;color:#94a3b8;font-weight:700;margin-bottom:8px">৫টি আধুনিক স্টাইল বেছে নিন — চালু হলে হোমে দেখাবে</div>'
              + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="footerStyleGrid">'
              // Style 1: Classic Light
              + _footerStyleBtn(cfg.footerStyle||'classic', 'classic',
                  '🔲 Classic Light',
                  'background:#fff;border-top:1px solid #e5e7eb',
                  '#059669','#dc2626','#2563eb','#E2136E')
              // Style 2: Dark Glow
              + _footerStyleBtn(cfg.footerStyle||'classic', 'dark-glow',
                  '🌃 Dark Glow',
                  'background:linear-gradient(180deg,#0f172a,#1e1b4b);border-top:1px solid rgba(99,102,241,.3)',
                  '#34d399','#f87171','#60a5fa','#f472b6')
              // Style 3: Floating Pill
              + _footerStyleBtn(cfg.footerStyle||'classic', 'floating',
                  '🫧 Floating Pill',
                  'background:rgba(255,255,255,.95);border-radius:24px 24px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,.12);border-top:none',
                  '#10b981','#ef4444','#3b82f6','#E2136E')
              // Style 4: Gradient Bar
              + _footerStyleBtn(cfg.footerStyle||'classic', 'gradient-bar',
                  '🌈 Gradient Bar',
                  'background:linear-gradient(135deg,#667eea,#764ba2);border-top:none',
                  '#fff','#fff','#fff','#fff')
              // Style 5: bKash Pink
              + _footerStyleBtn(cfg.footerStyle||'classic', 'bkash',
                  '💗 bKash Pink',
                  'background:linear-gradient(135deg,#E2136E,#b5105a);border-top:none',
                  '#fff','#fff','#fff','#fff')
              + '</div></div>';
        html += row2c('আয় বাটন রং','sp_footerInc',cfg.footerInc||'#10b981',
                      'ব্যয় বাটন রং','sp_footerExp',cfg.footerExp||'#ef4444');
        html += row2c('লেজার বাটন','sp_footerLed',cfg.footerLed||'#3b82f6',
                      'সেটিংস বাটন','sp_footerSet',cfg.footerSet||'#E2136E');
        html += rowRange('বাটন আইকন সাইজ','sp_footerIconSz',cfg.footerIconSz||22,14,36,'px','spFIconSzV');
        html += rowRange('বাটন লেখার সাইজ','sp_footerTxtSz',cfg.footerTxtSz||9,7,14,'px','spFTxtSzV');

    } else if (pg === 'analysis') {
        // ── চার্ট রং
        html += '<div class="sub-label">📊 চার্ট রং</div>';
        html += row2c('চার্ট রং ১ (আয়)','sp_chartC1',cfg.chartC1||'#10b981',
                      'চার্ট রং ২ (ব্যয়)','sp_chartC2',cfg.chartC2||'#ef4444');
        html += row2c('চার্ট রং ৩ (সঞ্চয়)','sp_chartC3',cfg.chartC3||'#a855f7',
                      'চার্ট রং ৪ (অ্যাকসেন্ট)','sp_chartC4',cfg.chartC4||'#f59e0b');
        // ── কার্ড স্টাইল
        html += '<div class="sub-label">🃏 কার্ড ও লেআউট</div>';
        html += row2c('কার্ড ব্যাকগ্রাউন্ড','sp_anlCardBg',cfg.anlCardBg||'#ffffff',
                      '','','');
        html += rowRange('কার্ড গোলাই','sp_anlCardRadius',cfg.anlCardRadius||20,0,32,'px','spAnlCRV');
        html += row2c('কার্ড শ্যাডো (CSS)','sp_anlShadow','','','','');
        // ── সামারি কার্ড
        html += '<div class="sub-label">💰 সামারি কার্ড রং</div>';
        html += row2c('আয় কার্ড রং ১','sp_sumIncC1',cfg.sumIncC1||'#10b981',
                      'আয় কার্ড রং ২','sp_sumIncC2',cfg.sumIncC2||'#059669');
        html += row2c('ব্যয় কার্ড রং ১','sp_sumExpC1',cfg.sumExpC1||'#ef4444',
                      'ব্যয় কার্ড রং ২','sp_sumExpC2',cfg.sumExpC2||'#dc2626');
        html += row2c('সঞ্চয় কার্ড রং ১','sp_sumSavC1',cfg.sumSavC1||'#a855f7',
                      'সঞ্চয় কার্ড রং ২','sp_sumSavC2',cfg.sumSavC2||'#9333ea');
        // ── হেলথ স্কোর
        html += '<div class="sub-label">❤️ হেলথ স্কোর</div>';
        html += row2c('হেলথ বার রং','sp_healthBarColor',cfg.healthBarColor||'#10b981',
                      '','','');
        // ── KPI সেকশন
        html += '<div class="sub-label">📐 KPI ও স্ট্যাট বক্স</div>';
        html += row2c('বক্স ব্যাকগ্রাউন্ড','sp_statBg',cfg.statBg||'#f0f9ff',
                      'ভ্যালু টেক্সট রং','sp_statTxt',cfg.statTxt||'#0ea5e9');
        html += rowRange('KPI ফন্ট সাইজ','sp_kpiFontSz',cfg.kpiFontSz||14,10,20,'px','spKpiFSV');
        // ── AI পরামর্শ
        html += '<div class="sub-label">🤖 AI পরামর্শ সেকশন</div>';
        html += row2c('পরামর্শ ব্যাকগ্রাউন্ড','sp_adviceBg',cfg.adviceBg||'rgba(14,165,233,.08)',
                      'পরামর্শ বর্ডার','sp_adviceBorderC',cfg.adviceBorderC||'#0ea5e9');
        html += row2c('পরামর্শ টেক্সট রং','sp_adviceTxtC',cfg.adviceTxtC||'#0369a1',
                      '','','');
        html += rowRange('পরামর্শ ফন্ট সাইজ','sp_adviceFontSz',cfg.adviceFontSz||14,10,20,'px','spAdvFSV');
        // ── হেডার
        html += '<div class="sub-label">🎨 হেডার রং</div>';
        html += row2c('হেডার রং ১','sp_hBg1',cfg.hBg1||'#0ea5e9',
                      'হেডার রং ২','sp_hBg2',cfg.hBg2||'#0284c7');
        // ── ফন্ট
        html += '<div class="sub-label">🔤 ফন্ট</div>';
        html += rowRange('ফন্ট সাইজ','sp_fs',cfg.fs||14,11,22,'px','spAnlFSV');

    } else if (pg === 'notes') {
        html += '<div class="sub-label">🃏 নোট কার্ড</div>';
        html += row2c('কার্ড ব্যাকগ্রাউন্ড','sp_noteCardBg',cfg.noteCardBg||'#ffffff',
                      '','','');
        html += rowRange('কার্ড গোলাই','sp_noteCardRadius',cfg.noteCardRadius||14,0,28,'px','spNCRV');
        html += '<div class="sub-label">🔤 শিরোনাম</div>';
        html += row2c('শিরোনাম রং','sp_noteTitleC',cfg.noteTitleC||'#1f2937','','','');
        html += rowRange('শিরোনাম ফন্ট সাইজ','sp_noteTitleSz',cfg.noteTitleSz||17,12,28,'px','spNTSzV');
        html += '<div class="sub-label">📝 নোটের লেখা</div>';
        html += row2c('লেখার রং','sp_noteTextC',cfg.noteTextC||'#374151','','','');
        html += rowRange('লেখার ফন্ট সাইজ','sp_noteTextSz',cfg.noteTextSz||15,11,24,'px','spNTextSzV');
        html += '<div class="sub-label">🏷️ ট্যাগ</div>';
        html += row2c('ট্যাগ ব্যাকগ্রাউন্ড','sp_noteTagBg',cfg.noteTagBg||'#ede9fe',
                      'ট্যাগ টেক্সট','sp_noteTagC',cfg.noteTagC||'#6d28d9');
        html += '<div class="sub-label">➕ FAB বাটন</div>';
        html += row2c('FAB রং ১','sp_fabBg1',cfg.fabBg1||'#8b5cf6',
                      'FAB রং ২','sp_fabBg2',cfg.fabBg2||'#7c3aed');
        html += rowRange('FAB সাইজ','sp_fabSize',cfg.fabSize||54,44,72,'px','spFabSzV');

    } else if (pg === 'settings') {
        html += '<div class="sub-label">📋 সেকশন</div>';
        html += row2c('সেকশন ব্যাকগ্রাউন্ড','sp_secBg',cfg.secBg||'#ffffff',
                      'সেকশন বর্ডার','sp_secBorderC',cfg.secBorderC||'#e2e8f0');
        html += rowRange('সেকশন গোলাই','sp_secRadius',cfg.secRadius||14,0,24,'px','spSecRV');
        html += '<div class="sub-label">📌 আইটেম</div>';
        html += row2c('আইটেম বর্ডার','sp_itemBorderC',cfg.itemBorderC||'#f1f5f9',
                      'আইকন ব্যাকগ্রাউন্ড','sp_iconBg',cfg.iconBg||'#eff6ff');
        html += row2c('আইকন রং','sp_iconC',cfg.iconC||'#3b82f6',
                      'লেবেল রং','sp_labelC',cfg.labelC||'#1f2937');
        html += row2c('সাব-লেবেল রং','sp_subLabelC',cfg.subLabelC||'#6b7280',
                      'টগল চালু রং','sp_toggleOnC',cfg.toggleOnC||'#10b981');

    } else if (pg === 'accounting') {
        html += '<div class="sub-label">📊 টেবিল হেডার</div>';
        html += row2c('হেডার ব্যাকগ্রাউন্ড','sp_tblHdrBg',cfg.tblHdrBg||'#1e3a5f',
                      'হেডার টেক্সট','sp_tblHdrTxt',cfg.tblHdrTxt||'#ffffff');
        html += '<div class="sub-label">📋 সারি</div>';
        html += row2c('সারি ১ রং','sp_tblRow1',cfg.tblRow1||'#ffffff',
                      'সারি ২ রং','sp_tblRow2',cfg.tblRow2||'#f8fafc');
        html += row2c('টেবিল বর্ডার','sp_tblBorderC',cfg.tblBorderC||'#e2e8f0','','','');
        html += '<div class="sub-label">💰 ডেবিট/ক্রেডিট</div>';
        html += row2c('Dr রং','sp_drC',cfg.drC||'#dc2626',
                      'Cr রং','sp_crC',cfg.crC||'#16a34a');
        html += row2c('মোট row ব্যাকগ্রাউন্ড','sp_totBg',cfg.totBg||'#f0f4ff',
                      'মোট বর্ডার','sp_totBorderC',cfg.totBorderC||'#667eea');

    } else if (pg === 'trash') {
        html += '<div class="sub-label">🃏 আইটেম কার্ড</div>';
        html += row2c('কার্ড ব্যাকগ্রাউন্ড','sp_itemBg',cfg.itemBg||'#fef2f2',
                      'বর্ডার রং','sp_itemBorderC2',cfg.itemBorderC||'#fecaca');
        html += rowRange('কার্ড গোলাই','sp_itemRadius',cfg.itemRadius||12,0,24,'px','spTItemRV');
        html += '<div class="sub-label">🔘 বাটন</div>';
        html += row2c('পুনরুদ্ধার বাটন','sp_restoreBtnBg',cfg.restoreBtnBg||'#10b981',
                      'মুছুন বাটন','sp_deleteBtnBg',cfg.deleteBtnBg||'#dc2626');
        html += row2c('ফিল্টার বাটন','sp_filterBtnBg',cfg.filterBtnBg||'#f1f5f9',
                      'সক্রিয় ফিল্টার','sp_filterActiveBg',cfg.filterActiveBg||'#dc2626');

    } else if (pg === 'calculator') {
        html += '<div class="sub-label">📟 Display</div>';
        html += row2c('Display ব্যাকগ্রাউন্ড','sp_dispBg',cfg.dispBg||'#1e293b',
                      'Display টেক্সট রং','sp_dispTxtC',cfg.dispTxtC||'#ffffff');
        html += row2c('Expression রং','sp_dispExprC',cfg.dispExprC||'#94a3b8','','','');
        html += '<div class="sub-label">🔢 সংখ্যা বাটন</div>';
        html += row2c('বাটন ব্যাকগ্রাউন্ড','sp_numBtnBg',cfg.numBtnBg||'#ffffff',
                      'বাটন টেক্সট','sp_numBtnTxt',cfg.numBtnTxt||'#1f2937');
        html += '<div class="sub-label">➗ অপারেটর বাটন</div>';
        html += row2c('অপারেটর ব্যাকগ্রাউন্ড','sp_opBtnBg',cfg.opBtnBg||'#f59e0b',
                      'অপারেটর টেক্সট','sp_opBtnTxt',cfg.opBtnTxt||'#ffffff');
        html += '<div class="sub-label">✅ = ও Clear</div>';
        html += row2c('= বাটন রং','sp_eqBtnBg',cfg.eqBtnBg||'#10b981',
                      'Clear বাটন রং','sp_clearBtnBg',cfg.clearBtnBg||'#ef4444');
        html += rowRange('বাটন গোলাই','sp_btnRadius',cfg.btnRadius||12,4,24,'px','spCalcBRV');
        html += rowRange('বাটন ফন্ট সাইজ','sp_btnFontSz',cfg.btnFontSz||20,14,32,'px','spCalcBFSV');
    }

    body.innerHTML = html;
    setTimeout(function(){ if(typeof _initColorPickers==='function') _initColorPickers(); },100);
}

/* ── HTML builders ── */
function _footerStyleBtn(curStyle, styleKey, label, previewCss, c1, c2, c3, c4) {
    var active = (curStyle === styleKey);
    return '<div onclick="_selectFooterStyle(\''+styleKey+'\')" style="cursor:pointer;border-radius:12px;padding:8px;border:2px solid '+(active?'#E2136E':'rgba(255,255,255,.1)')+';background:rgba(255,255,255,.04);transition:all .2s">'
        + '<div style="border-radius:8px;padding:6px 4px;margin-bottom:5px;'+previewCss+';display:flex;justify-content:space-around;align-items:center">'
        + '<span style="font-size:.55rem;color:'+c1+';font-weight:900;text-align:center">💰<br>আয়</span>'
        + '<span style="font-size:.55rem;color:'+c2+';font-weight:900;text-align:center">💸<br>ব্যয়</span>'
        + '<span style="font-size:.55rem;color:'+c3+';font-weight:900;text-align:center">📒<br>লেজার</span>'
        + '<span style="font-size:.55rem;color:'+c4+';font-weight:900;text-align:center">⚙️<br>সেটিংস</span>'
        + '</div>'
        + '<div style="color:'+(active?'#E2136E':'#94a3b8')+';font-size:.68rem;font-weight:800;text-align:center">'+(active?'✅ ':'')+ label+'</div>'
        + '</div>';
}

window._selectFooterStyle = function(styleKey) {
    var cfg = _getCfg('index');
    cfg.footerStyle = styleKey;
    _saveToDB('index', cfg);
    _applyFooterStyle(styleKey);
    _loadSpecificControls('index');
    fpsToast('✅ ফুটার স্টাইল সেট: ' + styleKey);
};

function _applyFooterStyle(styleKey) {
    var root = document.documentElement;
    var styles = {
        'classic':      {bg:'rgba(255,255,255,.97)', border:'#e5e7eb', radius:'0', shadow:'none'},
        'dark-glow':    {bg:'linear-gradient(180deg,#0f172a,#1e1b4b)', border:'rgba(99,102,241,.3)', radius:'0', shadow:'none'},
        'floating':     {bg:'rgba(255,255,255,.95)', border:'transparent', radius:'24px 24px 0 0', shadow:'0 -4px 24px rgba(0,0,0,.12)'},
        'gradient-bar': {bg:'linear-gradient(135deg,#667eea,#764ba2)', border:'transparent', radius:'0', shadow:'none'},
        'bkash':        {bg:'linear-gradient(135deg,#E2136E,#b5105a)', border:'transparent', radius:'0', shadow:'none'},
    };
    var textColors = {
        'classic':      {inc:'#10b981',exp:'#ef4444',led:'#3b82f6',set:'#E2136E'},
        'dark-glow':    {inc:'#34d399',exp:'#f87171',led:'#60a5fa',set:'#f472b6'},
        'floating':     {inc:'#10b981',exp:'#ef4444',led:'#3b82f6',set:'#E2136E'},
        'gradient-bar': {inc:'#fff',exp:'#fff',led:'#fff',set:'#fff'},
        'bkash':        {inc:'#fff',exp:'#fff',led:'#fff',set:'#fff'},
    };
    var s = styles[styleKey] || styles['classic'];
    var t = textColors[styleKey] || textColors['classic'];
    root.style.setProperty('--pg-index-footerBg', s.bg);
    root.style.setProperty('--pg-index-footerBorderC', s.border);
    root.style.setProperty('--pg-index-footerRadius', s.radius);
    root.style.setProperty('--pg-index-footerShadow', s.shadow);
    root.style.setProperty('--pg-index-footerInc', t.inc);
    root.style.setProperty('--pg-index-footerExp', t.exp);
    root.style.setProperty('--pg-index-footerLed', t.led);
    root.style.setProperty('--pg-index-footerSet', t.set);
}

function row2c(l1,id1,v1, l2,id2,v2) {
    var h='<div class="fps-grid2" style="margin-bottom:12px">';
    h+='<div class="fps-row" style="margin:0"><div class="fps-lbl">'+l1+'</div>';
    h+='<input type="color" class="fps-color" id="'+id1+'" value="'+v1+'"></div>';
    if(l2&&id2&&v2){
        h+='<div class="fps-row" style="margin:0"><div class="fps-lbl">'+l2+'</div>';
        h+='<input type="color" class="fps-color" id="'+id2+'" value="'+v2+'"></div>';
    } else { h+='<div></div>'; }
    h+='</div>';
    return h;
}
function rowRange(label,id,val,mn,mx,unit,vid) {
    return '<div class="fps-row"><div class="fps-lbl">'+label+' <span class="fps-val" id="'+vid+'">'+val+unit+'</span></div>'
        +'<input type="range" class="fps-range" id="'+id+'" min="'+mn+'" max="'+mx+'" value="'+val
        +'" oninput="document.getElementById(\''+vid+'\').textContent=this.value+\''+unit+'\'"></div>';
}

/* ── Save specific page ── */
function saveSpecificCfg() {
    var pg = _curPage;
    var cfg = Object.assign({},_getCfg(pg));

    // Common header
    cfg.hBg1   = _g('sp_hBg1');
    cfg.hBg2   = _g('sp_hBg2');
    cfg.hColor = _g('sp_hColor');
    cfg.bgMain = _g('sp_bgMain');
    cfg.textC  = _g('sp_textC');
    cfg.fs     = +_g('sp_fs');

    // Collect all sp_ inputs
    var spEls = document.querySelectorAll('[id^="sp_"]');
    for(var i=0;i<spEls.length;i++){
        var el=spEls[i];
        var key=el.id.replace('sp_','');
        cfg[key]=el.type==='range'?+el.value:el.value;
    }

    _saveToDB(pg,cfg);

    // Apply immediately
    if(typeof applyPageConfig==='function'){
        try{ applyPageConfig(); }catch(e){}
    }

    fpsToast('✅ '+pg+' সংরক্ষিত!');
}

function resetSpecificCfg() {
    var def=PAGE_DEFAULTS[_curPage];
    if(!def) return;
    _saveToDB(_curPage,def);
    _loadSpecificControls(_curPage);
    fpsToast('↺ রিসেট সম্পন্ন');
}

/* ── Table/Analysis save ── */
function _applyCSSVars(pg,cfg){
    // Save to DB then apply via applyPageConfig
    _saveToDB(pg,cfg);
    if(typeof applyPageConfig==='function'){
        // Temporarily set body data-page
        var old=document.body.dataset.page;
        document.body.dataset.page=pg;
        try{ applyPageConfig(); }catch(e){}
        if(old) document.body.dataset.page=old;
        else delete document.body.dataset.page;
    }
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded',function(){
    _loadListControls();
    livePreview();
    setTimeout(function(){ if(typeof _initColorPickers==='function') _initColorPickers(); },200);
});
