/* ============================================================
   CourtCast Display Designer — Interactive configurator
   Steps: Screen Size → Score Bug → All Courts → Scoreboard
   ============================================================ */

/* ═══════════════════════════════════════════
   COURTCAST DISPLAY DESIGNER — EMBEDDED
═══════════════════════════════════════════ */
var DS={W:845,H:385,adH:314,bugH:71,courts:16,phSL:0,phSR:0,step:0};
var dsDragType=null,dsSelIdx=-1,dsBcElems=[];
var dsEndTime=(function(){var d=new Date();d.setHours(11,0,0,0);return d;})();

/* ── NAV ── */
function dsGoto(n,btn){
  document.querySelectorAll('.ds-page').forEach(function(p,i){p.classList.toggle('ds-page-on',i===n)});
  document.querySelectorAll('.ds-tab').forEach(function(b){b.classList.remove('ds-tab-on')});
  if(btn)btn.classList.add('ds-tab-on');
  DS.step=n;
  document.getElementById('dsPrevBtn').style.visibility=n===0?'hidden':'visible';
  document.getElementById('dsNextBtn').textContent=n===3?'✓ Done':'Next Step →';
  document.getElementById('dsStepLbl').textContent='Step '+(n+1)+' of 4';
  if(n===1)dsInitBug();
  if(n===2)dsRenderCourts();
  if(n===3)dsInitSb();
}
function dsNav(d){
  var n=Math.max(0,Math.min(3,DS.step+d));
  dsGoto(n,document.querySelectorAll('.ds-tab')[n]);
}

/* ── TOGGLE ── */
function dsTog(el,showId){el.classList.toggle('ds-tog-on');if(showId){var s=document.getElementById(showId);if(s)s.style.display=el.classList.contains('ds-tog-on')?'block':'none';}}

/* ── STEP 0: SIZE + ZONE ── */
function dsPickSize(w,h,card){DS.W=w;DS.H=h;document.getElementById('dsCW').value=w;document.getElementById('dsCH').value=h;document.querySelectorAll('.ds-szcard').forEach(function(c){c.classList.remove('ds-szcard-on')});card.classList.add('ds-szcard-on');dsSyncZone();}
function dsCustomSize(){DS.W=+document.getElementById('dsCW').value||845;DS.H=+document.getElementById('dsCH').value||385;document.querySelectorAll('.ds-szcard').forEach(function(c){c.classList.remove('ds-szcard-on')});dsSyncZone();}
function dsSyncZone(){DS.adH=Math.round(DS.H*0.816);DS.bugH=DS.H-DS.adH;dsUpdateZoneUI();}
function dsUpdateZoneUI(){
  // Compute mockup dimensions fitting inside 220×260 frame while preserving aspect ratio
  var MAX_W=210,MAX_H=250;
  var aspect=DS.W/DS.H;
  var mW,mH;
  if(aspect>=1){// landscape or square
    mW=MAX_W;mH=Math.round(MAX_W/aspect);
    if(mH>MAX_H){mH=MAX_H;mW=Math.round(MAX_H*aspect);}
  } else {// portrait
    mH=MAX_H;mW=Math.round(MAX_H*aspect);
    if(mW>MAX_W){mW=MAX_W;mH=Math.round(MAX_W/aspect);}
  }
  mW=Math.max(80,mW);mH=Math.max(60,mH);
  var mock=document.getElementById('dsMock');
  if(mock){mock.style.width=mW+'px';mock.style.height=mH+'px';}
  // update aspect label
  var al=document.getElementById('dsMockAspect');if(al)al.textContent=DS.W+' × '+DS.H;
  // update divider and zones
  var adFrac=DS.adH/DS.H;
  var adPx=Math.round(adFrac*mH);
  var bugPx=mH-adPx;
  var ad=document.getElementById('dsMockAd'),bug=document.getElementById('dsMockBug'),div=document.getElementById('dsMockDiv');
  if(!ad)return;
  ad.style.height=adPx+'px';
  bug.style.height=bugPx+'px';
  div.style.top=(adPx-2.5)+'px';
  document.getElementById('dsMockAdLbl').textContent=DS.adH+'px';
  document.getElementById('dsMockBugLbl').textContent=DS.bugH+'px';
  document.getElementById('dsAdHLbl').textContent=DS.adH+'px';
  document.getElementById('dsBugHLbl').textContent=DS.bugH+'px';
  document.getElementById('dsAdPct').textContent=(DS.adH/DS.H*100).toFixed(1)+'%';
  document.getElementById('dsBugPct').textContent=(DS.bugH/DS.H*100).toFixed(1)+'%';
  document.getElementById('dsTotalLbl').textContent=DS.H+'px';
  document.getElementById('dsSumScreen').textContent=DS.W+' × '+DS.H;
  document.getElementById('dsSumAd').textContent=DS.adH+'px';
  document.getElementById('dsSumBug').textContent=DS.bugH+'px';
}
function dsInitMockDrag(){
  var div=document.getElementById('dsMockDiv'),mock=document.getElementById('dsMock');
  if(!div||!mock)return;
  var dragging=false,startY=0,startAdPx=0;
  function onDown(e){dragging=true;startY=e.touches?e.touches[0].clientY:e.clientY;startAdPx=Math.round((DS.adH/DS.H)*mock.offsetHeight);e.preventDefault();}
  function onMove(e){if(!dragging)return;var cy=e.touches?e.touches[0].clientY:e.clientY;var mH=mock.offsetHeight;var newAdPx=Math.max(20,Math.min(mH-20,startAdPx+(cy-startY)));DS.adH=Math.round((newAdPx/mH)*DS.H);DS.bugH=DS.H-DS.adH;dsUpdateZoneUI();e.preventDefault();}
  function onUp(){dragging=false;}
  div.addEventListener('mousedown',onDown);div.addEventListener('touchstart',onDown,{passive:false});
  document.addEventListener('mousemove',onMove);document.addEventListener('touchmove',onMove,{passive:false});
  document.addEventListener('mouseup',onUp);document.addEventListener('touchend',onUp);
}

/* ── STEP 1: BUG CANVAS ── */
var dsBcDefs={
  courtNum:{text:'1',size:30,color:'#00CFFF',font:"'DM Mono',monospace",w:46},
  eventName:{text:'P. Hittinger',size:13,color:'#fff',font:"'DM Sans',sans-serif",w:170},
  status:{text:'● IN PROGRESS',size:8,color:'#00FF85',font:"'DM Sans',sans-serif",w:120},
  timeLeft:{text:'58m',size:26,color:'#fff',font:"'DM Mono',monospace",w:76},
  clock:{text:'10:01 AM',size:14,color:'rgba(255,255,255,0.6)',font:"'DM Mono',monospace",w:110},
  upcoming:{text:'Clinic 12:30 PM',size:11,color:'#00CFFF',font:"'DM Sans',sans-serif",w:170},
  skillLevel:{text:'3.5–3.9',size:12,color:'#c9b0f0',font:"'DM Sans',sans-serif",w:70},
  waitQueue:{text:'Wait: 3',size:12,color:'#FFB432',font:"'DM Mono',monospace",w:68},
  score:{text:'5 – 2',size:22,color:'#fff',font:"'DM Mono',monospace",w:80},
  divider:{text:'|',size:28,color:'rgba(255,255,255,0.1)',font:"'DM Mono',monospace",w:14}
};
function dsInitBug(){
  document.getElementById('dsBugDimsLbl').textContent=DS.W+' × '+DS.bugH;
  if(dsBcElems.length===0){
    var x=8;
    ['courtNum','eventName','timeLeft','upcoming','clock'].forEach(function(t){
      var d=dsBcDefs[t];
      var approxH=d.size+20;
      var y=Math.max(0,Math.round((DS.bugH-approxH)/2));
      dsBcElems.push({type:t,x:x,y:y,w:d.w,text:d.text,size:d.size,color:d.color,font:d.font});
      x+=d.w+2;
    });
  } else {
    dsBcElems.forEach(function(el){if(el.y===undefined)el.y=0;});
  }
  dsRenderBug();
}
function dsRenderBug(){
  var cvs=document.getElementById('dsBugCanvas');
  cvs.querySelectorAll('.ds-bc-el').forEach(function(e){e.remove()});
  var hint=document.getElementById('dsBcHint');if(hint)hint.style.display=dsBcElems.length?'none':'flex';
  dsBcElems.forEach(function(el,i){dsRenderBcEl(cvs,el,i)});
  dsApplyBg();
}
function dsRenderBcEl(cvs,el,i){
  var sel=i===dsSelIdx;
  if(el.y===undefined) el.y=Math.max(0,Math.round((cvs.offsetHeight-(el.size+20))/2));

  var div=document.createElement('div');
  div.className='ds-bc-el'+(sel?' ds-bc-sel':'');
  div.style.cssText=
    'position:absolute;top:'+el.y+'px;left:'+el.x+'px;width:'+el.w+'px;'+
    'display:flex;align-items:center;justify-content:center;'+
    'cursor:grab;user-select:none;padding:4px 4px;box-sizing:border-box;'+
    'min-height:'+(el.size+12)+'px;border-radius:4px;'+
    'border:1px solid '+(sel?'#00b55e':'rgba(255,255,255,0.08)')+';'+
    (sel?'background:rgba(0,181,94,.12);box-shadow:0 0 0 1px rgba(0,181,94,.3);':'');

  var span=document.createElement('span');
  span.style.cssText='font-size:'+el.size+'px;color:'+el.color+';font-family:'+el.font+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px;pointer-events:none;max-width:100%;line-height:1.2';
  span.textContent=(el.type==='clock')?dsFmtT():(el.type==='timeLeft')?dsBugTL():el.text;

  // delete button
  var xBtn=document.createElement('div');
  xBtn.style.cssText='display:'+(sel?'flex':'none')+';position:absolute;top:-8px;right:-8px;width:16px;height:16px;background:#e03535;border-radius:50%;color:#fff;font-size:9px;align-items:center;justify-content:center;cursor:pointer;z-index:10;line-height:1;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.4)';
  xBtn.textContent='×';
  xBtn.onclick=function(e){e.stopPropagation();dsBcElems.splice(i,1);if(dsSelIdx===i)dsSelIdx=-1;else if(dsSelIdx>i)dsSelIdx--;dsRenderBug();dsHideProp();};

  // right-edge resize handle
  var rz=document.createElement('div');
  rz.style.cssText='position:absolute;right:-4px;top:50%;transform:translateY(-50%);width:7px;height:22px;background:#00b55e;border-radius:4px;cursor:ew-resize;opacity:'+(sel?'1':'0')+';z-index:5;box-shadow:0 1px 4px rgba(0,0,0,.3)';
  rz.addEventListener('mousedown',function(e){
    e.stopPropagation();e.preventDefault();
    var sx=e.clientX,sw=el.w;
    function mm(ev){el.w=Math.max(24,sw+(ev.clientX-sx));div.style.width=el.w+'px';}
    function mu(){document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);}
    document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
  });

  div.appendChild(span);div.appendChild(xBtn);div.appendChild(rz);

  // FREE 2D DRAG — tracks X and Y
  div.addEventListener('mousedown',function(e){
    if(e.target===rz||e.target===xBtn) return;
    e.preventDefault();
    div.style.cursor='grabbing';
    dsSelBc(i);
    var sx=e.clientX,sy=e.clientY,ox=el.x,oy=el.y;
    var cvsRect=cvs.getBoundingClientRect();
    var elH=div.offsetHeight, elW=el.w;
    function mm(ev){
      var nx=Math.max(0,Math.min(cvs.clientWidth-elW, ox+(ev.clientX-sx)));
      var ny=Math.max(0,Math.min(cvs.clientHeight-elH, oy+(ev.clientY-sy)));
      el.x=nx;el.y=ny;
      div.style.left=nx+'px';div.style.top=ny+'px';
    }
    function mu(){div.style.cursor='grab';document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);}
    document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
  });

  div.addEventListener('click',function(e){e.stopPropagation();dsSelBc(i);});
  cvs.appendChild(div);
}
function dsSelBc(i){dsSelIdx=i;dsRenderBug();dsShowProp(dsBcElems[i]);}
function dsShowProp(el){
  var pb=document.getElementById('dsPropBar');pb.style.display='flex';
  document.getElementById('dsPropText').value=el.text;
  document.getElementById('dsPropSize').value=el.size;
  try{document.getElementById('dsPropColor').value=el.color;}catch(e){}
  var fs=document.getElementById('dsPropFont');
  if(fs){var matched=false;for(var i=0;i<fs.options.length;i++){if(fs.options[i].value===el.font){fs.selectedIndex=i;matched=true;break;}}if(!matched)fs.selectedIndex=0;}
}
function dsHideProp(){document.getElementById('dsPropBar').style.display='none';dsSelIdx=-1;}
function dsUpdateProp(){
  if(dsSelIdx<0||!dsBcElems[dsSelIdx])return;
  var el=dsBcElems[dsSelIdx];
  el.text=document.getElementById('dsPropText').value;
  el.size=+document.getElementById('dsPropSize').value||13;
  el.color=document.getElementById('dsPropColor').value;
  var fs=document.getElementById('dsPropFont');
  if(fs&&fs.value) el.font=fs.value;

  // Direct DOM update — avoids full re-render losing selection
  var domEl=document.querySelectorAll('#dsBugCanvas .ds-bc-el')[dsSelIdx];
  if(domEl){
    var span=domEl.querySelector('span');
    if(span){
      span.style.fontFamily=el.font;
      span.style.fontSize=el.size+'px';
      span.style.color=el.color;
      span.textContent=(el.type==='clock')?dsFmtT():(el.type==='timeLeft')?dsBugTL():el.text;
    }
    domEl.style.minHeight=(el.size+12)+'px';
  }
}
function dsDeleteSel(){if(dsSelIdx<0)return;dsBcElems.splice(dsSelIdx,1);dsSelIdx=-1;dsRenderBug();dsHideProp();}
function dsBcDragStart(e,type){dsDragType=type;e.dataTransfer.effectAllowed='copy';}
function dsBcDrop(e){
  e.preventDefault();
  document.getElementById('dsBugCanvas').style.borderColor='#2a3a4a';
  if(!dsDragType)return;
  var cvs=document.getElementById('dsBugCanvas');
  var rect=cvs.getBoundingClientRect();
  var dropX=Math.max(0,Math.round(e.clientX-rect.left));
  var dropY=Math.max(0,Math.round(e.clientY-rect.top));
  var d=dsBcDefs[dsDragType];
  var approxH=d.size+20;
  var y=Math.max(0,Math.min(cvs.offsetHeight-approxH, dropY-Math.round(approxH/2)));
  dsBcElems.push({type:dsDragType,x:Math.max(0,dropX-d.w/2),y:y,w:d.w,text:d.text,size:d.size,color:d.color,font:d.font});
  dsDragType=null;dsRenderBug();
  document.getElementById('dsBcHint').style.display='none';
}
function dsGetBugBg(){var s=document.getElementById('dsBgStyle');if(!s)return'#060c18';var v=s.value;if(v==='dark')return'#060c18';if(v==='solid')return document.getElementById('dsBgColor').value;return'linear-gradient('+(document.getElementById('dsGDir').value)+','+(document.getElementById('dsGA').value)+','+(document.getElementById('dsGB').value)+')';}
function dsApplyBg(){
  var v=document.getElementById('dsBgStyle').value;
  document.getElementById('dsBgSolid').style.display=v==='solid'?'block':'none';
  document.getElementById('dsBgGrad').style.display=v==='gradient'?'block':'none';
  if(v==='gradient'){var g='linear-gradient('+(document.getElementById('dsGDir').value)+','+(document.getElementById('dsGA').value)+','+(document.getElementById('dsGB').value)+')';document.getElementById('dsGPreview').style.background=g;}
  var cvs=document.getElementById('dsBugCanvas');if(cvs)cvs.style.background=dsGetBugBg();
}

/* skill grid */
/* ── SKILL LEVELS — dynamic editable ── */
var dsSkills=[
  {l:'2.0–2.9',  c:'#00cfff'},
  {l:'3.0–3.49', c:'#00a855'},
  {l:'3.5–3.9',  c:'#9370db'},
  {l:'4.0–4.49', c:'#ff8c42'},
  {l:'4.5–5.0+', c:'#ff4f4f'}
];

function dsRenderSkillGrid(){
  var g=document.getElementById('dsSkillGrid');
  if(!g)return;
  g.innerHTML='';
  g.style.cssText='display:flex;flex-direction:column;gap:7px';
  dsSkills.forEach(function(s,i){
    var row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:8px 10px';
    // color swatch + picker
    var sw=document.createElement('div');
    sw.style.cssText='width:28px;height:28px;border-radius:5px;border:1px solid var(--border2);flex-shrink:0;position:relative;overflow:hidden;cursor:pointer;background:'+s.c;
    var cp=document.createElement('input');
    cp.type='color';cp.value=s.c;
    cp.style.cssText='position:absolute;inset:-4px;width:calc(100%+8px);height:calc(100%+8px);opacity:0;cursor:pointer';
    cp.oninput=function(){s.c=this.value;sw.style.background=this.value;dsUpdateSkillUsers();};
    sw.appendChild(cp);
    // label input
    var li=document.createElement('input');
    li.type='text';li.value=s.l;
    li.style.cssText='flex:1;background:#fff;border:1px solid var(--border2);border-radius:6px;color:var(--ink);padding:5px 8px;font-size:12px;font-family:\'DM Sans\',sans-serif;outline:none;min-width:0';
    li.oninput=function(){s.l=this.value;dsUpdateSkillUsers();};
    li.onfocus=function(){this.style.borderColor='var(--green)';};
    li.onblur=function(){this.style.borderColor='var(--border2)';};
    // color bar preview
    var bar=document.createElement('div');
    bar.style.cssText='width:60px;height:8px;border-radius:4px;flex-shrink:0;background:'+s.c;
    cp.addEventListener('input',function(){bar.style.background=this.value;});
    row.appendChild(sw);row.appendChild(li);row.appendChild(bar);
    g.appendChild(row);
  });
}

function dsUpdateSkillUsers(){
  // re-render courts if visible
  if(document.getElementById('ds2').classList.contains('ds-page-on'))dsRenderCourts();
}

function dsAddSkill(){
  dsSkills.push({l:'New Level',c:'#aaaaaa'});
  dsRenderSkillGrid();
}

function dsRemoveSkill(){
  if(dsSkills.length<=1)return;
  dsSkills.pop();
  dsRenderSkillGrid();
  dsUpdateSkillUsers();
}

function dsTestSkill(){
  var panel=document.getElementById('dsSkillTest');
  var cards=document.getElementById('dsSkillTestCards');
  if(!panel||!cards)return;
  var showing=panel.style.display!=='none'&&panel.style.display!=='';
  if(showing){panel.style.display='none';return;}
  panel.style.display='block';
  cards.innerHTML='';
  dsSkills.forEach(function(s){
    // compute a readable text color from bg
    var card=document.createElement('div');
    card.style.cssText='border-radius:8px;padding:10px 14px;border:1px solid;min-width:130px;position:relative;overflow:hidden';
    card.style.background=dsHexToRgba(s.c,0.22);
    card.style.borderColor=dsHexToRgba(s.c,0.45);
    card.innerHTML=
      '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:'+s.c+'"></div>'
      +'<div style="font-size:7px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.28);margin-bottom:2px">Court</div>'
      +'<div style="font-size:22px;font-weight:500;color:#fff;line-height:1.1">1</div>'
      +'<div style="font-size:7px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:'+s.c+';margin:3px 0 2px">● In Progress</div>'
      +'<div style="font-size:10px;font-weight:500;color:#fff">Drop-Ins</div>'
      +'<div style="display:inline-block;font-size:7px;background:rgba(255,255,255,.07);border-radius:3px;padding:1px 5px;color:'+s.c+';margin-top:3px">'+s.l+'</div>';
    cards.appendChild(card);
  });
}

function dsSkillLabelFor(color){
  var match=dsSkills.find(function(s){return s.c===color;});
  return match?match.l:'';
}

function dsHexToRgba(hex,a){
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return'rgba('+r+','+g+','+b+','+a+')';
}

// Call initial render
dsRenderSkillGrid();

/* ── COUNTDOWN TEST MODAL ── */
var dsCdInterval=null, dsCdSeconds=270;

function dsTestCountdown(){
  var modal=document.getElementById('dsCountdownModal');
  if(!modal)return;

  // Size the sim screen — same aspect ratio as selected screen, ~800px max wide
  var VW=Math.min(window.innerWidth-80,900);
  var VH=Math.min(window.innerHeight-200,500);
  var aspect=DS.W/DS.H;
  var sW,sH;
  if(VW/VH>aspect){sH=Math.min(VH,400);sW=Math.round(sH*aspect);}
  else{sW=Math.min(VW,800);sH=Math.round(sW/aspect);}

  var bugH=Math.round(sH*(DS.bugH/DS.H));
  var adH=sH-bugH;

  var screen=document.getElementById('dsCdSimScreen');
  screen.style.width=sW+'px';screen.style.height=sH+'px';

  var ad=document.getElementById('dsCdAdZone');
  ad.style.height=adH+'px';ad.style.width=sW+'px';

  var bug=document.getElementById('dsCdBugStrip');
  bug.style.height=bugH+'px';bug.style.width=sW+'px';

  // Scale fonts relative to bug height
  var fBase=Math.max(10,Math.round(bugH*0.28));
  var fSm=Math.max(7,Math.round(bugH*0.16));
  document.getElementById('dsCdCourtNum').style.fontSize=Math.round(bugH*0.55)+'px';
  document.getElementById('dsCdEvent').style.fontSize=fBase+'px';
  document.getElementById('dsCdTime').style.fontSize=fSm+'px';
  document.getElementById('dsCdTLLbl').style.fontSize=fSm+'px';
  document.getElementById('dsCdTL').style.fontSize=Math.round(bugH*0.38)+'px';
  document.getElementById('dsCdUpLbl').style.fontSize=fSm+'px';
  document.getElementById('dsCdClock').style.fontSize=fBase+'px';

  var warnAt=document.getElementById('dsCdWarnAt');
  if(warnAt)warnAt.textContent=document.getElementById('dsRedMins').value||'5';

  dsCdSeconds=270; // start at 4:30
  dsCdTick();
  if(dsCdInterval)clearInterval(dsCdInterval);
  dsCdInterval=setInterval(dsCdTick,1000);

  modal.style.display='flex';
}

function dsCdSetTime(secs){
  if(dsCdInterval)clearInterval(dsCdInterval);
  dsCdSeconds=secs;
  dsCdTick();
  dsCdInterval=setInterval(dsCdTick,1000);
}

function dsCdTick(){
  if(dsCdSeconds<0){dsCdSeconds=0;}
  var m=Math.floor(dsCdSeconds/60),s=dsCdSeconds%60;
  var tlEl=document.getElementById('dsCdTL');
  var bugEl=document.getElementById('dsCdBugStrip');
  var warnMins=+(document.getElementById('dsRedMins')?document.getElementById('dsRedMins').value:5)||5;
  var warnColor=document.getElementById('dsRedColor')?document.getElementById('dsRedColor').value:'#ff2222';
  var statusMsg=document.getElementById('dsCdStatusMsg');

  var isWarning=dsCdSeconds<=warnMins*60;
  var tStr=m+'m '+(s<10?'0':'')+s+'s';
  if(dsCdSeconds<=0)tStr='Done';

  if(tlEl){
    tlEl.textContent=tStr;
    tlEl.style.color=isWarning?warnColor:'#ffffff';
    tlEl.style.textShadow=isWarning?('0 0 12px '+warnColor):'none';
  }
  if(bugEl){
    bugEl.style.background=isWarning?dsHexToRgba(warnColor,0.15):'#060c18';
    bugEl.style.borderTopColor=isWarning?dsHexToRgba(warnColor,0.4):'rgba(255,255,255,.08)';
  }
  if(statusMsg){
    if(isWarning&&dsCdSeconds>0)statusMsg.innerHTML='<span style="color:#ff6666;font-weight:700">⚠ WARNING ACTIVE</span> — bug is now red (under '+warnMins+' min)';
    else if(dsCdSeconds<=0)statusMsg.innerHTML='<span style="color:var(--muted)">Event ended</span>';
    else statusMsg.innerHTML='Countdown running — warning triggers under <span id="dsCdWarnAt">'+warnMins+'</span> min';
  }
  document.getElementById('dsCdClock').textContent=dsFmtT();
  if(dsCdSeconds>0)dsCdSeconds--;
}

function dsCdClose(){
  if(dsCdInterval)clearInterval(dsCdInterval);
  var modal=document.getElementById('dsCountdownModal');
  if(modal)modal.style.display='none';
  // reset bug strip
  var bugEl=document.getElementById('dsCdBugStrip');
  if(bugEl){bugEl.style.background='#060c18';bugEl.style.borderTopColor='rgba(255,255,255,.08)';}
}
function dsPopWhatChange(){
  var v=document.getElementById('dsPopWhat').value;
  document.getElementById('dsPopCustomMsg').style.display=v==='custom'?'block':'none';
  dsLivePopPreview();
}

function dsPopSizeChange(){
  var pct=document.getElementById('dsPopHPct').value;
  document.getElementById('dsPopHPctLbl').textContent=pct+'%';
  dsLivePopPreview();
}

function dsLivePopPreview(){
  var every=document.getElementById('dsPopEvery').value||'15';
  var forSec=document.getElementById('dsPopFor').value||'30';
  var label=(document.getElementById('dsPopLabel').value||'Now On Court');
  var labelColor=document.getElementById('dsPopLabelColor').value;
  var bg=document.getElementById('dsPopBg').value;
  var ev=document.getElementById('dsPopPrevEvery');if(ev)ev.textContent=every;
  var fs=document.getElementById('dsPopPrevFor');if(fs)fs.textContent=forSec;
  var lbl=document.getElementById('dsPopPrevLabel');if(lbl){lbl.textContent=label.toUpperCase();lbl.style.color=labelColor;}
  var hdr=document.getElementById('dsPopPrevHeader');if(hdr)hdr.style.background=bg;
  var body=document.getElementById('dsPopPrevBody');if(body)body.style.background=dsHexMix(bg,0.8);
  var sl=document.getElementById('dsPopTestSizeLbl');if(sl)sl.textContent=DS.W+'×'+DS.H;
}

function dsPopTest(){
  var modal=document.getElementById('dsPopModal');
  if(!modal)return;

  // Read settings
  var bg=document.getElementById('dsPopBg').value;
  var label=(document.getElementById('dsPopLabel').value||'Now On Court').toUpperCase();
  var labelColor=document.getElementById('dsPopLabelColor').value;
  var hPct=+document.getElementById('dsPopHPct').value||25;
  var wPct=+document.getElementById('dsPopW').value||100;
  var pos=document.getElementById('dsPopPos').value;
  var radius=document.getElementById('dsPopRadius').value;
  var forSec=+document.getElementById('dsPopFor').value||30;
  var every=+document.getElementById('dsPopEvery').value||15;
  var what=document.getElementById('dsPopWhat').value;
  var customMsg=document.getElementById('dsPopMsg')?document.getElementById('dsPopMsg').value:'';

  // Scale screen to fit viewport
  var VW=window.innerWidth-80,VH=window.innerHeight-140;
  var aspect=DS.W/DS.H;
  var sW,sH;
  if(VW/VH>aspect){sH=Math.min(VH,500);sW=Math.round(sH*aspect);}
  else{sW=Math.min(VW,900);sH=Math.round(sW/aspect);}

  var popH=Math.round(sH*hPct/100);
  var popW=Math.round(sW*wPct/100);

  // Position the pop-up
  var popStyle='position:absolute;width:'+popW+'px;height:'+popH+'px;overflow:hidden;border-radius:'+radius+';transition:all .4s cubic-bezier(.22,1,.36,1)';
  var popLeft=0,popTop=0;
  if(pos==='bottom'){popTop=sH-popH;popLeft=Math.round((sW-popW)/2);}
  else if(pos==='top'){popTop=0;popLeft=Math.round((sW-popW)/2);}
  else if(pos==='center'){popTop=Math.round((sH-popH)/2);popLeft=Math.round((sW-popW)/2);}
  else if(pos==='left'){popTop=Math.round((sH-popH)/2);popLeft=0;}
  else if(pos==='right'){popTop=Math.round((sH-popH)/2);popLeft=sW-popW;}

  // Build content inside pop-up scaled to pop-up size
  var contentFS=Math.round(Math.max(10,popH*0.1));
  var nameFS=Math.round(Math.max(12,popH*0.14));
  var hdrH=Math.max(28,Math.round(popH*0.28));
  var bodyH=popH-hdrH;

  var contentHTML='';
  var iconSz=Math.round(Math.min(bodyH*.75,popW*.12));
  if(what==='custom'){
    contentHTML='<div style="width:'+popW+'px;height:'+bodyH+'px;display:flex;align-items:center;justify-content:center;padding:'+Math.round(bodyH*.1)+'px '+Math.round(popW*.04)+'px;overflow:hidden;box-sizing:border-box">'
      +'<div style="font-size:'+nameFS+'px;font-weight:600;color:#fff;line-height:1.4;text-align:center;overflow:hidden;text-overflow:ellipsis">'+(customMsg||'Custom Message')+'</div>'
      +'</div>';
  } else {
    var pad=Math.round(popW*.025);
    contentHTML='<div style="width:'+popW+'px;height:'+bodyH+'px;display:flex;align-items:center;gap:'+Math.round(popW*.02)+'px;padding:0 '+pad+'px;overflow:hidden;box-sizing:border-box">'
      +'<div style="width:'+iconSz+'px;height:'+iconSz+'px;min-width:'+iconSz+'px;background:rgba(0,201,107,.18);border:1.5px solid rgba(0,201,107,.35);border-radius:'+Math.round(iconSz*.2)+'px;display:flex;align-items:center;justify-content:center;font-size:'+Math.round(iconSz*.45)+'px;font-weight:700;color:#00C96B;font-family:\'DM Mono\',monospace;flex-shrink:0">1</div>'
      +'<div style="flex:1;min-width:0;overflow:hidden">'
      +'<div style="font-size:'+nameFS+'px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Drop-Ins 3.5–3.9</div>'
      +'<div style="font-size:'+Math.round(nameFS*.78)+'px;color:rgba(255,255,255,.45);margin-top:'+Math.round(bodyH*.05)+'px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">7:00 – 11:00 AM · 37m remaining</div>'
      +'</div>'
      +'<div style="text-align:right;flex-shrink:0;max-width:'+Math.round(popW*.3)+'px;overflow:hidden">'
      +'<div style="font-size:'+Math.round(nameFS*.7)+'px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,.3);white-space:nowrap">Up Next</div>'
      +'<div style="font-size:'+Math.round(nameFS*.82)+'px;color:#00CFFF;margin-top:'+Math.round(bodyH*.05)+'px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Evening 3.5+ · 6:00 PM</div>'
      +'</div>'
      +'</div>';
  }

  // Assemble pop-up
  var popHTML='<div style="height:'+hdrH+'px;background:'+bg+';display:flex;align-items:center;justify-content:space-between;padding:0 '+Math.round(popW*.03)+'px;border-bottom:1px solid rgba(255,255,255,.08)">'
    +'<span style="font-size:'+Math.round(hdrH*.3)+'px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:'+labelColor+'">'+label+'</span>'
    +'<span style="font-size:'+Math.round(hdrH*.22)+'px;color:rgba(255,255,255,.35)">Every '+every+'m · '+forSec+'s</span>'
    +'</div>'
    +'<div style="height:'+bodyH+'px;background:'+dsHexMix(bg,0.75)+'">'
    +contentHTML
    +'</div>';

  // Size and position the simulated screen
  var sim=document.getElementById('dsPopSimScreen');
  sim.style.width=sW+'px';sim.style.height=sH+'px';

  var adZone=document.getElementById('dsPopSimAd');
  adZone.style.height=sH+'px';adZone.style.width=sW+'px';

  var overlay=document.getElementById('dsPopSimOverlay');
  overlay.style.cssText=popStyle+';left:'+popLeft+'px;top:'+(pos==='bottom'?sH:popTop)+'px';

  var content=document.getElementById('dsPopSimContent');
  content.innerHTML=popHTML;

  var dimsLbl=document.getElementById('dsPopSimDimsLbl');
  if(dimsLbl)dimsLbl.textContent=DS.W+'×'+DS.H+' → scaled to '+sW+'×'+sH+'px';

  // Show modal
  modal.style.display='flex';

  // Animate in after brief delay
  setTimeout(function(){
    if(pos==='bottom')overlay.style.top=(sH-popH)+'px';
    else overlay.style.opacity='1';
  },100);

  // Countdown + auto close
  var remaining=forSec;
  var timerEl=document.getElementById('dsPopSimTimer');
  if(timerEl)timerEl.textContent=remaining+'s remaining';
  var countdown=setInterval(function(){
    remaining--;
    if(timerEl)timerEl.textContent=remaining>0?remaining+'s remaining':'Closing…';
    if(remaining<=0){clearInterval(countdown);dsPopModalClose();}
  },1000);
  overlay._countdown=countdown;
}

function dsPopModalClose(){
  var modal=document.getElementById('dsPopModal');
  var overlay=document.getElementById('dsPopSimOverlay');
  if(overlay&&overlay._countdown)clearInterval(overlay._countdown);
  if(modal)modal.style.display='none';
}

// Close modal on backdrop click
document.addEventListener('click',function(e){
  var modal=document.getElementById('dsPopModal');
  if(modal&&e.target===modal)dsPopModalClose();
});

function dsUpdatePopPreview(){dsLivePopPreview();}

function dsHexMix(hex,darken){
  try{
    var r=Math.round(parseInt(hex.slice(1,3),16)*darken);
    var g=Math.round(parseInt(hex.slice(3,5),16)*darken);
    var b=Math.round(parseInt(hex.slice(5,7),16)*darken);
    return'rgb('+r+','+g+','+b+')';
  }catch(e){return hex;}
}

/* ── STEP 2: COURTS ── */
var dsCourtData=[{n:16,ev:'Morning Drop-Ins 4.0+',t:'7:00–11:00 AM',end:'11:00',sk:'4.0–4.49',by:'Open',up:'Evening 4.5+',upt:'6:00 PM',wq:2},{n:15,ev:'Morning Drop-Ins 4.0+',t:'7:00–11:00 AM',end:'11:00',sk:'4.0–4.49',by:'Open',up:'Evening 4.5+',upt:'6:00 PM',wq:1},{n:14,ev:'Drop-Ins 3.5–3.9',t:'7:00–11:00 AM',end:'11:00',sk:'3.5–3.9',by:'Open',up:'Evening 4.0+',upt:'6:00 PM',wq:3},{n:13,ev:'Drop-Ins 3.5–3.9',t:'7:00–11:00 AM',end:'11:00',sk:'3.5–3.9',by:'Open',up:'Evening 4.0+',upt:'6:00 PM',wq:0},{n:12,ev:'Drop-Ins 3.5–3.9',t:'7:00–11:00 AM',end:'11:00',sk:'3.5–3.9',by:'Open',up:'Evening 3.5+',upt:'6:00 PM',wq:0},{n:11,ev:'Drop-Ins 3.5–3.9',t:'7:00–11:00 AM',end:'11:00',sk:'3.5–3.9',by:'Open',up:'Evening 3.5+',upt:'6:00 PM',wq:0},{n:10,ev:"DUPR Women's League",t:'9:30–11:30 AM',end:'11:30',sk:'3.5–3.9',by:'DUPR',up:'Badminton',upt:'6:00 PM',wq:0},{n:9,ev:"DUPR Women's League",t:'9:30–11:30 AM',end:'11:30',sk:'3.5–3.9',by:'DUPR',up:'Badminton',upt:'6:00 PM',wq:0},{n:8,ev:'Drop-Ins 3.0–3.49',t:'7:00–11:00 AM',end:'11:00',sk:'3.0–3.49',by:'Open',up:'Evening 3.0+',upt:'6:00 PM',wq:4},{n:7,ev:'Tue Morning Ladder',t:'10:00–12:00',end:'12:00',sk:'3.0–3.49',by:'CourtCast',up:'Badminton',upt:'6:00 PM',wq:0},{n:6,ev:'Tue Morning Ladder',t:'10:00–12:00',end:'12:00',sk:'3.0–3.49',by:'CourtCast',up:'M. Sandford',upt:'1:00–2:30',wq:0},{n:5,ev:'Tue Morning Ladder',t:'10:00–12:00',end:'12:00',sk:'2.0–2.9',by:'CourtCast',up:'L. Bloom',upt:'1:00–2:30',wq:1},{n:4,ev:'Tue Morning Ladder',t:'10:00–12:00',end:'12:00',sk:'2.0–2.9',by:'CourtCast',up:'S. Guest',upt:'1:00–2:00',wq:0},{n:3,ev:'Tue Morning Ladder',t:'10:00–12:00',end:'12:00',sk:'2.0–2.9',by:'CourtCast',up:'J. Hofacker',upt:'12:00–1:00',wq:2},{n:2,ev:'Tue Morning Ladder',t:'10:00–12:00',end:'12:00',sk:'2.0–2.9',by:'CourtCast',up:'Demo Clinic',upt:'12:30–1:45',wq:0},{n:1,ev:'P. Hittinger',t:'10:00–11:00 AM',end:'11:00',sk:'2.0–2.9',by:'P. Hittinger',up:'Demo Clinic',upt:'12:30–1:45',wq:0}];
function dsSkBg(sk){return{'4.5–5.0+':'rgba(255,79,79,.22)','4.0–4.49':'rgba(255,140,66,.22)','3.5–3.9':'rgba(147,112,219,.22)','3.0–3.49':'rgba(0,200,107,.18)','2.0–2.9':'rgba(0,180,210,.18)'}[sk]||'rgba(255,255,255,.05)';}
function dsSkBrd(sk){return{'4.5–5.0+':'rgba(255,79,79,.4)','4.0–4.49':'rgba(255,140,66,.4)','3.5–3.9':'rgba(147,112,219,.38)','3.0–3.49':'rgba(0,200,107,.32)','2.0–2.9':'rgba(0,180,210,.3)'}[sk]||'rgba(255,255,255,.1)';}
function dsSkTxt(sk){return{'4.5–5.0+':'#ff8888','4.0–4.49':'#ffaa66','3.5–3.9':'#c9b0f0','3.0–3.49':'#00e876','2.0–2.9':'#00cfff'}[sk]||'#aaa';}
function dsSkStrip(sk){return{'4.5–5.0+':'#FF4F4F','4.0–4.49':'#FF8C42','3.5–3.9':'#9B72FF','3.0–3.49':'#00C96B','2.0–2.9':'#00CFFF'}[sk]||'#555';}
function dsCalcTL(end){var now=new Date(),p=end.split(':'),e=new Date(now);e.setHours(+p[0],+p[1],0,0);var d=Math.floor((e-now)/1000);if(d<=0)return'Done';var h=Math.floor(d/3600),m=Math.floor((d%3600)/60),s=d%60;if(h>0)return h+'h '+(m<10?'0':'')+m+'m';if(m>0)return m+'m '+(s<10?'0':'')+s+'s';return s+'s';}
function dsGetF(){var f={};document.querySelectorAll('#dsFldList .ds-fldrow').forEach(function(r){f[r.dataset.f]=r.querySelector('.ds-tog').classList.contains('ds-tog-on');});return f;}
function dsAdjC(d){DS.courts=Math.max(1,Math.min(32,DS.courts+d));document.getElementById('dsCourtNum').textContent=DS.courts;document.getElementById('dsCourtsDimsLbl').textContent=DS.courts+' courts';dsRenderCourts();}
function dsRenderCourts(){
  var f=dsGetF(),n=DS.courts,cols=Math.min(n,4);
  var g=document.getElementById('dsCgrid');g.style.gridTemplateColumns='repeat('+cols+',1fr)';
  var data=dsCourtData.slice(0,n).sort(function(a,b){return b.n-a.n});var h='';
  data.forEach(function(c){
    var tl=dsCalcTL(c.end),tc=dsSkTxt(c.sk),strip=dsSkStrip(c.sk);
    h+='<div class="ds-cc" style="background:'+dsSkBg(c.sk)+';border-color:'+dsSkBrd(c.sk)+'">';
    if(f.colorStrip)h+='<div style="position:absolute;top:0;left:0;right:0;height:3px;background:'+strip+'"></div>';
    if(f.courtNum)h+='<div style="font-size:7px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.28)">Court</div><div style="font-size:26px;font-weight:500;color:#fff;line-height:1.1">'+c.n+'</div>';
    if(f.inProgress)h+='<div style="font-size:7px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:'+tc+';margin-bottom:2px">● In Progress</div>';
    if(f.eventName)h+='<div style="font-size:10px;font-weight:500;color:#fff;line-height:1.3">'+c.ev+'</div>';
    if(f.timeRange)h+='<div style="font-size:8px;color:rgba(255,255,255,.38);margin-top:1px">'+c.t+'</div>';
    if(f.skillLevel)h+='<div style="display:inline-block;font-size:7px;background:rgba(255,255,255,.07);border-radius:3px;padding:1px 4px;color:'+tc+';margin-top:2px">'+c.sk+'</div>';
    if(f.bookedBy&&c.by!=='Open')h+='<div style="font-size:7.5px;color:rgba(255,255,255,.32);margin-top:2px">'+c.by+'</div>';
    if(f.upNext)h+='<div style="font-size:8px;margin-top:4px;border-top:0.5px solid rgba(255,255,255,.08);padding-top:4px;color:rgba(255,255,255,.4)"><div style="font-size:6.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:'+tc+'">Upcoming</div>'+c.up+' · '+c.upt+'</div>';
    if(f.waitQueue&&c.wq>0)h+='<div style="position:absolute;top:7px;right:7px;font-size:9px;font-weight:700;background:rgba(255,180,50,.12);border:1px solid rgba(255,180,50,.25);color:#FFB432;border-radius:3px;padding:1px 4px">Wait: '+c.wq+'</div>';
    if(f.timeLeft)h+='<div style="position:absolute;bottom:5px;right:7px;font-size:9px;font-family:\'DM Mono\',monospace;color:rgba(255,255,255,.5)" id="dsCtl'+c.n+'">'+tl+'</div>';
    h+='</div>';
  });
  g.innerHTML=h;
}

/* ── STEP 3: SCOREBOARD ── */
function dsInitSb(){document.getElementById('dsSbDimsLbl').textContent=DS.W+' × '+DS.H;dsUpdateSb();}
function dsUpdateSb(){
  var wrap=document.getElementById('dsSbInner');
  var clip=document.getElementById('dsSbClip');
  var scaleWrap=document.getElementById('dsSbScaleWrap');
  if(!wrap||!clip||!scaleWrap)return;

  var t1c=document.getElementById('dsT1c').value,
      t2c=document.getElementById('dsT2c').value,
      bg=document.getElementById('dsSbBg').value,
      font=document.getElementById('dsSbFont').value,
      t1n=document.getElementById('dsT1n').value,
      t2n=document.getElementById('dsT2n').value,
      t1p=document.getElementById('dsT1p').value,
      t2p=document.getElementById('dsT2p').value,
      ev=document.getElementById('dsSbEv').value;
  var showTop=document.getElementById('dsTopTog').classList.contains('ds-tog-on'),
      showBot=document.getElementById('dsBotTog').classList.contains('ds-tog-on'),
      showPips=document.getElementById('dsPipTog').classList.contains('ds-tog-on'),
      showPl=document.getElementById('dsPlTog').classList.contains('ds-tog-on');
  var showSkillBand=document.getElementById('dsSkillBandTog')&&document.getElementById('dsSkillBandTog').classList.contains('ds-tog-on');

  // Show/hide the skill band button strip
  var sbOpts=document.getElementById('dsSkillBandOpts');
  if(sbOpts)sbOpts.style.display=showSkillBand?'block':'none';

  // If a skill preview color is set, tint the background
  var skillTint=showSkillBand&&DS._previewSkill?DS._previewSkill:null;
  var actualBg=bg;
  if(skillTint){
    // blend skill color lightly into bg
    var r=parseInt(skillTint.slice(1,3),16),g2=parseInt(skillTint.slice(3,5),16),b2=parseInt(skillTint.slice(5,7),16);
    actualBg='linear-gradient(160deg,'+bg+' 40%,rgba('+r+','+g2+','+b2+',.18) 100%)';
  }

  // Real screen dimensions
  var RW=DS.W, RH=DS.H;
  // Score font size: scale with screen height, cap range
  var scoreFs=Math.round(Math.max(48,Math.min(140,RH*0.22)));
  var labelFs=Math.round(Math.max(11,Math.min(22,RH*0.028)));
  var playerFs=Math.round(Math.max(13,Math.min(26,RH*0.033)));
  var topH=showTop?Math.round(RH*0.072):0;
  var botH=showBot?Math.round(RH*0.068):0;
  var bodyH=RH-topH-botH;

  // Build at real size
  var h='<div style="width:'+RW+'px;height:'+RH+'px;background:'+actualBg+';overflow:hidden;display:flex;flex-direction:column;font-family:\'DM Sans\',sans-serif">';
  // skill level color strip at very top if tint active
  if(skillTint)h+='<div style="height:5px;background:'+skillTint+';flex-shrink:0"></div>';
  if(showTop)h+='<div style="height:'+topH+'px;background:#040911;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;padding:0 '+(RW*0.02)+'px;flex-shrink:0">'
    +'<div style="font-size:'+labelFs+'px;color:rgba(255,255,255,.35);letter-spacing:1.5px;text-transform:uppercase">'+ev+'</div>'
    +'<div style="display:flex;align-items:center;gap:6px;font-size:'+(labelFs-1)+'px;color:#00FF85"><span style="width:6px;height:6px;background:#00FF85;border-radius:50%;display:inline-block;animation:blink 2s infinite"></span>Live&nbsp;·&nbsp;'+(skillTint?'<span style="background:'+dsHexToRgba(skillTint,0.2)+';color:'+skillTint+';padding:1px 6px;border-radius:3px;font-size:'+(labelFs-2)+'px">'+dsSkillLabelFor(skillTint)+'</span>&nbsp;·&nbsp;':'')+'<span id="dsSbClk">'+dsFmtT()+'</span></div>'
    +'</div>';
  h+='<div style="flex:1;display:flex;height:'+bodyH+'px">';
  // T1
  h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:'+(RH*0.04)+'px;position:relative;border-right:1px solid rgba(255,255,255,.06)">'
    +'<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,'+t1c+',transparent)"></div>'
    +'<div style="font-size:'+labelFs+'px;color:rgba(255,255,255,.32);letter-spacing:3px;text-transform:uppercase;margin-bottom:'+(RH*0.01)+'px;font-weight:500">'+t1n+'</div>';
  if(showPl)h+='<div style="font-size:'+playerFs+'px;color:rgba(255,255,255,.45);margin-bottom:'+(RH*0.025)+'px;text-align:center;line-height:1.5">'+t1p+'</div>';
  h+='<div style="font-size:'+scoreFs+'px;font-family:'+font+';font-weight:500;color:'+t1c+';line-height:1" id="dsSbS1">'+DS.phSL+'</div>';
  if(showPips)h+='<div style="display:flex;gap:8px;margin-top:'+(RH*0.02)+'px"><div style="width:10px;height:10px;border-radius:50%;background:#00C96B"></div><div style="width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.12)"></div><div style="width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.12)"></div></div>';
  h+='</div>';
  // VS
  h+='<div style="width:'+(RW*0.06)+'px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:'+(RH*0.02)+'px;flex-shrink:0">'
    +'<div style="width:1px;height:'+(RH*0.1)+'px;background:rgba(255,255,255,.06)"></div>'
    +'<div style="font-size:'+(labelFs+2)+'px;color:rgba(255,255,255,.12);font-weight:500">VS</div>'
    +'<div style="width:1px;height:'+(RH*0.1)+'px;background:rgba(255,255,255,.06)"></div>'
    +'</div>';
  // T2
  h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:'+(RH*0.04)+'px;position:relative;border-left:1px solid rgba(255,255,255,.06)">'
    +'<div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent,'+t2c+')"></div>'
    +'<div style="font-size:'+labelFs+'px;color:rgba(255,255,255,.32);letter-spacing:3px;text-transform:uppercase;margin-bottom:'+(RH*0.01)+'px;font-weight:500">'+t2n+'</div>';
  if(showPl)h+='<div style="font-size:'+playerFs+'px;color:rgba(255,255,255,.45);margin-bottom:'+(RH*0.025)+'px;text-align:center;line-height:1.5">'+t2p+'</div>';
  h+='<div style="font-size:'+scoreFs+'px;font-family:'+font+';font-weight:500;color:'+t2c+';line-height:1" id="dsSbS2">'+DS.phSR+'</div>';
  if(showPips)h+='<div style="display:flex;gap:8px;margin-top:'+(RH*0.02)+'px"><div style="width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.12)"></div><div style="width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.12)"></div><div style="width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.12)"></div></div>';
  h+='</div></div>';
  if(showBot){
    var bfs=Math.round(Math.max(9,Math.min(18,RH*0.022)));
    var blbl=Math.round(Math.max(7,Math.min(13,RH*0.014)));
    h+='<div style="height:'+botH+'px;background:#040911;border-top:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;padding:0 '+(RW*0.02)+'px;flex-shrink:0">'
      +'<div style="text-align:center"><div style="font-size:'+blbl+'px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.22)">Court</div><div style="font-size:'+bfs+'px;font-family:\'DM Mono\',monospace;color:rgba(255,255,255,.55)">1</div></div>'
      +'<div style="text-align:center"><div style="font-size:'+blbl+'px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.22)">Time Left</div><div style="font-size:'+bfs+'px;font-family:\'DM Mono\',monospace;color:rgba(255,255,255,.55)" id="dsSbBTL">'+dsBugTL()+'</div></div>'
      +'<div style="text-align:center"><div style="font-size:'+blbl+'px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.22)">Score</div><div style="font-size:'+bfs+'px;font-family:\'DM Mono\',monospace"><span style="color:'+t1c+'" id="dsSbBS1">'+DS.phSL+'</span>&nbsp;–&nbsp;<span style="color:'+t2c+'" id="dsSbBS2">'+DS.phSR+'</span></div></div>'
      +'<div style="text-align:center"><div style="font-size:'+blbl+'px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.22)">Game</div><div style="font-size:'+bfs+'px;font-family:\'DM Mono\',monospace;color:rgba(255,255,255,.55)">1 of 3</div></div>'
      +'<div style="text-align:center"><div style="font-size:'+blbl+'px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.22)">Time</div><div style="font-size:'+bfs+'px;font-family:\'DM Mono\',monospace;color:rgba(255,255,255,.55)" id="dsSbBClk">'+dsFmtT()+'</div></div>'
      +'</div>';
  }
  h+='</div>';
  wrap.innerHTML=h;

  // Scale to compact preview: 520px wide max, correct aspect ratio
  requestAnimationFrame(function(){
    var PREVIEW_MAX_W=520;
    var scale=PREVIEW_MAX_W/RW;
    var previewW=PREVIEW_MAX_W;
    var previewH=Math.round(RH*scale);
    scaleWrap.style.transform='scale('+scale+')';
    scaleWrap.style.transformOrigin='top left';
    scaleWrap.style.width=RW+'px';
    // Set clip to exactly the scaled dimensions — no extra black space
    clip.style.width=previewW+'px';
    clip.style.height=previewH+'px';
    var dl=document.getElementById('dsSbDimsLbl');
    if(dl)dl.textContent=DS.W+' × '+DS.H+' · preview '+previewW+'×'+previewH;
  });

  // Populate skill band preview buttons
  var bbWrap=document.getElementById('dsSkillBandBtns');
  if(bbWrap){
    bbWrap.innerHTML='';
    dsSkills.forEach(function(s,i){
      var btn=document.createElement('button');
      btn.style.cssText='padding:4px 10px;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;font-family:"DM Sans",sans-serif;border:1.5px solid '+dsHexToRgba(s.c,0.5)+';background:'+dsHexToRgba(s.c,0.15)+';color:'+s.c;
      btn.textContent=s.l;
      btn.onclick=function(){
        DS._previewSkill=s.c;
        dsUpdateSb();
      };
      bbWrap.appendChild(btn);
    });
    var clearBtn=document.createElement('button');
    clearBtn.style.cssText='padding:4px 10px;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;font-family:"DM Sans",sans-serif;border:1px solid var(--border2);background:transparent;color:var(--muted)';
    clearBtn.textContent='Clear';
    clearBtn.onclick=function(){DS._previewSkill=null;dsUpdateSb();};
    bbWrap.appendChild(clearBtn);
  }
}

/* ── PHONE CONTROLLER ── */
function dsPhAdj(side,d){
  if(side==='L'){DS.phSL=Math.max(0,DS.phSL+d);var e=document.getElementById('dsPhSL');e.textContent=DS.phSL;}
  else{DS.phSR=Math.max(0,DS.phSR+d);var e2=document.getElementById('dsPhSR');e2.textContent=DS.phSR;}
  var s1=document.getElementById('dsSbS1');if(s1)s1.textContent=side==='L'?DS.phSL:DS.phSL;
  var s2=document.getElementById('dsSbS2');if(s2)s2.textContent=DS.phSR;
  var s1b=document.getElementById('dsSbBS1');if(s1b)s1b.textContent=DS.phSL;
  var s2b=document.getElementById('dsSbBS2');if(s2b)s2b.textContent=DS.phSR;
  // fix: update both scores properly
  var ss1=document.getElementById('dsSbS1');if(ss1)ss1.textContent=DS.phSL;
}
function dsPhSwap(){var tmp=DS.phSL;DS.phSL=DS.phSR;DS.phSR=tmp;document.getElementById('dsPhSL').textContent=DS.phSL;document.getElementById('dsPhSR').textContent=DS.phSR;var s1=document.getElementById('dsSbS1');if(s1)s1.textContent=DS.phSL;var s2=document.getElementById('dsSbS2');if(s2)s2.textContent=DS.phSR;}
function dsPhReset(){DS.phSL=0;DS.phSR=0;document.getElementById('dsPhSL').textContent=0;document.getElementById('dsPhSR').textContent=0;var s1=document.getElementById('dsSbS1');if(s1)s1.textContent=0;var s2=document.getElementById('dsSbS2');if(s2)s2.textContent=0;}
function dsPhTab(btn){document.querySelectorAll('.ds-phtb').forEach(function(b){b.classList.remove('ds-phtb-on')});btn.classList.add('ds-phtb-on');}

/* ── CLOCK ── */
function dsFmtT(){var n=new Date(),h=n.getHours(),m=n.getMinutes(),a=h>=12?'PM':'AM';h=h%12||12;return h+':'+(m<10?'0':'')+m+' '+a;}
function dsBugTL(){var d=Math.floor((dsEndTime-new Date())/1000);if(d<=0)return'Done';var h=Math.floor(d/3600),m=Math.floor((d%3600)/60),s=d%60;if(h>0)return h+'h '+(m<10?'0':'')+m+'m';if(m>0)return m+'m '+(s<10?'0':'')+s+'s';return s+'s';}
setInterval(function(){
  var c=dsFmtT(),tl=dsBugTL();
  ['dsSbClk','dsSbBClk'].forEach(function(id){var e=document.getElementById(id);if(e)e.textContent=c;});
  ['dsSbBTL','dsPhTL'].forEach(function(id){var e=document.getElementById(id);if(e)e.textContent=tl;});
  dsCourtData.forEach(function(c){var el=document.getElementById('dsCtl'+c.n);if(el)el.textContent=dsCalcTL(c.end);});
  // update live clock/TL in bug canvas
  var cvs=document.getElementById('dsBugCanvas');
  if(cvs){dsBcElems.forEach(function(el,i){if(el.type==='clock'||el.type==='timeLeft'){var spans=cvs.querySelectorAll('.ds-bc-el span');if(spans[i])spans[i].textContent=(el.type==='clock')?c:tl;}});}
},1000);

/* init */
dsUpdateZoneUI();
dsInitMockDrag();

/* ── BIRTHDAY OVERLAY ── */
var DS_BALLOON_COLORS = ['#ff6b9d','#ff9de2','#c084fc','#818cf8','#34d399','#fbbf24','#f87171','#60a5fa','#a78bfa','#fb923c'];

function dsBdaySpawnBalloons(){
  var c=document.getElementById('bdayBalloons'); if(!c) return; c.innerHTML='';
  for(var i=0;i<18;i++){ (function(idx){
    setTimeout(function(){
      var b=document.createElement('div'); b.className='balloon';
      b.style.left=(5+Math.random()*90)+'%';
      b.style.background=DS_BALLOON_COLORS[Math.floor(Math.random()*DS_BALLOON_COLORS.length)];
      b.style.setProperty('--sway',(Math.random()>.5?1:-1)*(15+Math.random()*40)+'px');
      b.style.animationDuration=(4.5+Math.random()*3).toFixed(1)+'s';
      b.style.animationDelay=(Math.random()*2).toFixed(2)+'s';
      c.appendChild(b);
    },idx*120);
  })(i); }
}

function dsBdayTest(){
  var overlay=document.getElementById('bdayOverlay'); if(!overlay) return;
  var nameEl=document.getElementById('bdayNames');
  var inputEl=document.getElementById('dsBdayName');
  if(nameEl&&inputEl) nameEl.textContent=inputEl.value||'Sarah M.';
  dsBdaySpawnBalloons();
  overlay.classList.add('active');
  var dur=(+(document.getElementById('dsBdayDur')||{value:10}).value||10)*1000;
  setTimeout(function(){ dsBdayClose(); }, dur);
}

function dsBdayClose(){
  var overlay=document.getElementById('bdayOverlay'); if(!overlay) return;
  overlay.classList.remove('active');
  setTimeout(function(){ var c=document.getElementById('bdayBalloons'); if(c) c.innerHTML=''; },700);
}

document.getElementById('bdayOverlay').addEventListener('click',function(e){
  if(e.target===this) dsBdayClose();
});
