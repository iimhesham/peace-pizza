/* =========================================================
   UCL — واجهة لعبة «أبطال أوروبا» (CHAMPIONS XI). أوفلاين على جهاز واحد.
   المنطق: js/ucl-engine.js · البيانات: js/ucl-data.js · الشكل: css/ucl.css
   الواجهة كلها بتتبني من JS جوه #uclRoot (زي Sudoku)، بالإنجليزي من الشمال لليمين.

   الدورة: إعداد (تشكيلة/أسلوب/وضع) ← سحب نادي بطل + موسم ← اختيار لاعب
   (11 مرة، 3 إعادات سحب) ← محاكاة بطولة إقصائية 9 مباريات ← نتيجة.
========================================================= */
(function(){
"use strict";
var root=document.getElementById("uclRoot");
if(!root||!window.UCL||!window.UCL_DATA)return;

var U=window.UCL,SEASONS=window.UCL_DATA.seasons,STAGES=U.STAGES;
var KEY="uclSettings",SKEY="uclStats",MAXRR=3;
var POSORD=["GK","RB","CB","LB","DM","CM","AM","RM","LM","RW","LW","ST"];
var STYLE_LABEL={defensive:"Defensive",balanced:"Balanced",attacking:"Attacking"};
var TIER_RANK={po:1,r16:2,quarter:3,semi:4,finalist:5,champions:6,unbeaten:7,flawless:8,immaculate:9};

var S={
  view:"setup",fid:"4-3-3",style:"balanced",mode:"classic",
  slots:[],picks:{},taken:{},used:{},count:0,
  cur:null,phase:"idle",rolling:false,rerolls:MAXRR,sel:null,
  team:null,res:null,reveal:0,timers:[],counted:false,auto:true,speed:"normal",live:null,
  stats:{runs:0,titles:0,flawless:0,best:""}
};

/* ---------- أدوات ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function rnd(){return window.PPR&&window.PPR.float?window.PPR.float():Math.random();}
function newSeed(){return window.PPR&&window.PPR.seed31?window.PPR.seed31():Math.floor(rnd()*2147483646)+1;}
function click(){if(typeof playClickSound==="function")playClickSound();}
function say(m){if(typeof toast==="function")toast(m);}
function lum(hex){var n=parseInt(hex.slice(1),16);return(0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255;}
function ink(hex){return lum(hex)>0.6?"#0a0f2a":"#ffffff";}
function clearTimers(){S.timers.forEach(function(t){clearTimeout(t);clearInterval(t);});S.timers=[];}
function later(fn,ms){var t=setTimeout(fn,ms);S.timers.push(t);return t;}

function loadSave(){
  try{
    var j=JSON.parse(localStorage.getItem(KEY)||"null");
    if(j){
      if(U.FORMATIONS[j.fid])S.fid=j.fid;
      if(U.STYLES.indexOf(j.style)>-1)S.style=j.style;
      if(j.mode==="classic"||j.mode==="memory")S.mode=j.mode;
      if(typeof j.auto==="boolean")S.auto=j.auto;
      if(j.speed==="normal"||j.speed==="fast"||j.speed==="ultra")S.speed=j.speed;
    }
    var st=JSON.parse(localStorage.getItem(SKEY)||"null");
    if(st&&typeof st.runs==="number")S.stats={runs:st.runs|0,titles:st.titles|0,flawless:st.flawless|0,best:String(st.best||"")};
  }catch(e){}
}
function saveSettings(){try{localStorage.setItem(KEY,JSON.stringify({fid:S.fid,style:S.style,mode:S.mode,auto:S.auto,speed:S.speed}));}catch(e){}}
function saveStats(){try{localStorage.setItem(SKEY,JSON.stringify(S.stats));}catch(e){}}

/* ---------- رسومات ---------- */
function crest(c,ab,sz){
  var f=c[0],s=c[1],t=ink(f),fs=ab.length>3?8:ab.length>2?10:12;
  return '<svg class="u-crest" viewBox="0 0 48 54" width="'+sz+'" height="'+Math.round(sz*54/48)+'" aria-hidden="true">'+
    '<path d="M3 3h42v24c0 13-9.5 19.5-21 24C12.5 46.5 3 40 3 27z" fill="'+f+'" stroke="'+s+'" stroke-width="3"/>'+
    '<path d="M3 3h42v9H3z" fill="'+s+'"/>'+
    '<text x="24" y="36" text-anchor="middle" font-size="'+fs+'" fill="'+t+'">'+esc(ab)+'</text></svg>';
}
var XI_CREST=crest(["#0e3bb8","#e8f2ff"],"XI",44);
function stars(n){var o="";for(var i=0;i<n;i++)o+="<i></i>";return '<span class="u-stars" aria-hidden="true">'+o+"</span>";}
function dieSvg(){
  return '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M2 1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm2 3v2h2V4zm6 0v2h2V4zM7 7v2h2V7zm-3 3v2h2v-2zm6 0v2h2v-2z"/></svg>';
}
function miniPitch(fid){
  var sl=U.slotsFor(fid),o='<svg class="u-mini-svg" viewBox="0 0 100 128" aria-hidden="true" preserveAspectRatio="xMidYMid meet">'+
    '<rect x="3" y="3" width="94" height="122" rx="2" class="ln"/><path d="M3 64h94" class="ln"/><circle cx="50" cy="64" r="10" class="ln"/>'+
    '<rect x="24" y="3" width="52" height="17" class="ln"/><rect x="24" y="108" width="52" height="17" class="ln"/>';
  sl.forEach(function(s){o+='<circle cx="'+s.x.toFixed(1)+'" cy="'+(s.y*1.28).toFixed(1)+'" r="4.2" class="dt"/>';});
  return o+"</svg>";
}
function pitchLines(){
  return '<svg class="u-lines" viewBox="0 0 100 128" preserveAspectRatio="none" aria-hidden="true">'+
    '<rect x="3" y="3" width="94" height="122" rx="1.5"/><path d="M3 64h94"/><circle cx="50" cy="64" r="10.5"/><circle cx="50" cy="64" r="0.9" class="fill"/>'+
    '<rect x="24" y="3" width="52" height="17"/><rect x="38" y="3" width="24" height="6.5"/>'+
    '<rect x="24" y="108" width="52" height="17"/><rect x="38" y="118.5" width="24" height="6.5"/></svg>';
}

/* ---------- الملعب ---------- */
function pitch(hot){
  var o='<div class="u-pitch" role="group" aria-label="Your starting XI">'+pitchLines();
  S.slots.forEach(function(s){
    var p=S.picks[s.i],isHot=hot&&hot.indexOf(s.i)>-1;
    var st='left:'+s.x.toFixed(2)+'%;top:'+s.y.toFixed(2)+'%';
    if(p){
      o+='<div class="u-slot is-filled" style="'+st+'">'+
        '<span class="u-shirt" style="--c0:'+p.c[0]+';--c1:'+p.c[1]+';--tx:'+ink(p.c[0])+'">'+
        (S.mode==="memory"&&S.view!=="sim"&&!S.res?esc(s.pos):p.r)+'</span>'+
        '<span class="u-nm">'+esc(p.n)+'</span></div>';
    }else{
      o+='<button type="button" class="u-slot is-empty'+(isHot?' is-hot':'')+'" style="'+st+'" data-act="slot" data-i="'+s.i+'"'+
        (isHot?'':' tabindex="-1"')+' aria-label="Empty '+s.pos+' slot">'+
        '<span class="u-ring">'+s.pos+'</span></button>';
    }
  });
  return o+"</div>";
}

/* ---------- الشريط العلوي ---------- */
function bar(){
  var back=S.view==="setup"?"home":"back";
  return '<header class="u-bar"><button type="button" class="u-ib" data-act="'+back+'" aria-label="'+(back==="home"?"Back to home":"Back to settings")+'">'+
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>'+
    '<div class="u-title"><b>CHAMPIONS XI</b><span>Dream team · Cup winners</span></div><span class="u-ib u-ghost"></span></header>';
}

/* ---------- 1) الإعداد ---------- */
function viewSetup(){
  var fm="";
  U.FORMATION_IDS.forEach(function(f){fm+='<button type="button" class="u-chip'+(f===S.fid?' is-on':'')+'" data-act="fid" data-v="'+f+'">'+f+'</button>';});
  var st="";
  U.STYLES.forEach(function(x){st+='<button type="button" class="u-seg-b'+(x===S.style?' is-on':'')+'" data-act="style" data-v="'+x+'">'+STYLE_LABEL[x]+'</button>';});
  var md='<button type="button" class="u-seg-b'+(S.mode==="classic"?' is-on':'')+'" data-act="mode" data-v="classic">Classic</button>'+
         '<button type="button" class="u-seg-b'+(S.mode==="memory"?' is-on':'')+'" data-act="mode" data-v="memory">From memory</button>';
  var b=S.stats.best?(TIER_RANK[S.stats.best]>=6?"★ ":"")+S.stats.best.toUpperCase():"—";
  return '<div class="u-hero">'+stars(8)+
    '<h1 class="u-logo">CHAMPIONS<br>XI</h1><p class="u-tag">Roll a winning club. Pick one star. Win all '+U.TOTAL_MATCHES+'.</p>'+
    '<div class="u-flow"><span><b>1</b>ROLL</span><span><b>2</b>PICK</span><span><b>3</b>WIN</span></div></div>'+
    '<div class="u-panel"><h2 class="u-label">Formation</h2><div class="u-chips">'+fm+'</div><div class="u-mini">'+miniPitch(S.fid)+'</div></div>'+
    '<div class="u-panel"><h2 class="u-label">Style</h2><div class="u-seg">'+st+'</div></div>'+
    '<div class="u-panel"><h2 class="u-label">Mode</h2><div class="u-seg">'+md+'</div>'+
    '<p class="u-hint">'+(S.mode==="classic"?"Ratings are visible while you pick.":"Names and positions only. Ratings stay hidden until the cup is over.")+'</p></div>'+
    '<ul class="u-rules"><li><b>11</b><span>picks</span></li><li><b>'+MAXRR+'</b><span>re-rolls</span></li><li><b>'+U.TOTAL_MATCHES+'</b><span>matches</span></li></ul>'+
    '<button type="button" class="u-btn u-big" data-act="start">Kick off draft</button>'+
    '<div class="u-record"><div><b>'+S.stats.runs+'</b><span>cups</span></div><div><b>'+S.stats.titles+'</b><span>titles</span></div><div><b>'+S.stats.flawless+'</b><span>flawless</span></div><div><b class="u-sm">'+esc(b)+'</b><span>best</span></div></div>'+
    '<p class="u-beta"><span>BETA</span>'+SEASONS.length+' title-winning seasons · squads and ratings are provisional estimates.</p>';
}

/* ---------- 2) السحب والاختيار ---------- */
function statusBar(){
  var segs="";for(var i=0;i<11;i++)segs+='<i class="'+(i<S.count?'on':'')+'"></i>';
  var pips="";for(var j=0;j<MAXRR;j++)pips+='<i class="'+(j<S.rerolls?'on':'')+'"></i>';
  return '<div class="u-status"><div class="u-prog"><span>PICK <b>'+Math.min(S.count+(S.count<11?1:0),11)+'</b>/11</span><div class="u-segs">'+segs+'</div></div>'+
    '<div class="u-rr"><span>RE-ROLLS</span><div class="u-pips">'+pips+'</div></div></div>';
}
function drawnCard(s){
  return '<article class="u-draw">'+crest(s.c,s.ab,64)+'<div class="u-draw-t"><small>'+(S.rolling?"ROLLING…":"DRAWN")+'</small><b>'+esc(s.club)+'</b>'+
    '<span class="u-ssn">'+esc(s.ss)+'</span><em>'+esc(s.coach)+' · Final '+esc(s.fin)+'</em></div></article>';
}
function listRows(s){
  var pk=U.pickable(s,S.slots,S.picks,S.taken),can={};
  pk.forEach(function(x){can[x.p.n]=x;});
  var rows=s.p.slice().sort(function(a,b){
    var da=POSORD.indexOf(a.pos),db=POSORD.indexOf(b.pos);
    return da-db||b.r-a.r;
  });
  var o="";
  rows.forEach(function(p){
    var ok=!!can[p.n],why=S.taken[p.n]?"IN YOUR XI":"NO FREE SLOT";
    var isSel=S.sel&&S.sel.n===p.n;
    o+='<button type="button" class="u-row'+(ok?'':' is-dis')+(isSel?' is-sel':'')+'" data-act="pick" data-n="'+esc(p.n)+'"'+(ok?'':' disabled')+'>'+
      '<span class="u-pos">'+p.pos+'</span><span class="u-pn">'+esc(p.n)+(p.alt?'<small>'+p.alt+'</small>':'')+'</span>'+
      (ok?(S.mode==="classic"?'<span class="u-r'+(p.r>=93?' is-leg':'')+'">'+(p.r>=93?'★ ':'')+p.r+'</span>':'<span class="u-r u-q">??</span>'):'<span class="u-why">'+why+'</span>')+'</button>';
  });
  return '<div class="u-list" role="list">'+o+'</div>';
}
function viewDraft(){
  var o=statusBar(),hot=null;
  if(S.rolling){
    o+='<div class="u-drawbox is-rolling" id="uRoll">'+(S.cur?drawnCard(S.cur):'')+'</div>';
  }else if(S.phase==="drawn"&&S.cur){
    var alts=U.seasonAlternatives(SEASONS,S.cur,S.used,S.slots,S.picks,S.taken).length;
    var noRR=S.rerolls<1;
    o+='<div class="u-drawbox">'+drawnCard(S.cur)+'</div>'+
      '<div class="u-rrow"><button type="button" class="u-btn u-alt" data-act="rr-team"'+(noRR?' disabled':'')+'>↻ Other club</button>'+
      '<button type="button" class="u-btn u-alt" data-act="rr-season"'+(noRR||!alts?' disabled':'')+'>↻ Other season</button></div>'+
      '<h2 class="u-label u-lh">Pick one player</h2>'+listRows(S.cur);
    if(S.sel)hot=S.sel.slots;
  }else{
    o+='<div class="u-drawbox is-empty"><p>Roll to draw a Champions winner and the season it won the cup.</p></div>'+
      '<button type="button" class="u-btn u-big u-roll" data-act="roll">'+dieSvg()+' Roll</button>';
  }
  o+='<h2 class="u-label u-lh">Your XI · '+S.fid+' · '+STYLE_LABEL[S.style]+'</h2>'+pitch(hot);
  return o;
}

/* ---------- 3) جاهز للمحاكاة ---------- */
function bars(t,hide){
  function row(l,v){return '<div class="u-bar-r"><span>'+l+'</span><div class="u-meter"><i style="width:'+(hide?0:Math.max(0,Math.min(100,(v-60)*100/40)))+'%"></i></div><b>'+(hide?'??':Math.round(v))+'</b></div>';}
  return '<div class="u-bars">'+row("ATT",t.A)+row("DEF",t.D)+row("OVR",t.ovr)+'</div>';
}
function viewReady(){
  var t=U.makeTeam(S.slots,S.picks,S.style),hide=S.mode==="memory";
  return '<div class="u-ready"><h2 class="u-label">Squad complete</h2><p class="u-big-t">Your '+S.fid+' is ready</p></div>'+
    pitch(null)+'<div class="u-panel">'+bars(t,hide)+(hide?'<p class="u-hint">Ratings are revealed after the cup.</p>':'')+'</div>'+
    '<button type="button" class="u-btn u-big" data-act="sim">Play the knockout</button>'+
    '<button type="button" class="u-btn u-alt u-wide" data-act="again">Redo draft</button>';
}

/* ---------- 4) البطولة ---------- */
function goalLines(tie,opp){
  var o="";
  tie.legs.forEach(function(m,k){
    var g=[];
    m.gUs.forEach(function(x){g.push({min:x.min,n:x.n,us:1});});
    m.gThem.forEach(function(x){g.push({min:x.min,n:x.n,us:0});});
    if(k===tie.legs.length-1&&tie.et){
      tie.et.gUs.forEach(function(x){g.push({min:x.min,n:x.n,us:1});});
      tie.et.gThem.forEach(function(x){g.push({min:x.min,n:x.n,us:0});});
    }
    g.sort(function(a,b){return a.min-b.min;});
    o+='<div class="u-gl"><h4>'+(tie.legs.length>1?(k?"2nd leg":"1st leg"):"Final")+' · '+m.us+'–'+m.them+'</h4>';
    if(!g.length)o+='<p class="u-none">No goals</p>';
    else{o+='<ul>';g.forEach(function(x){o+='<li class="'+(x.us?'us':'them')+'"><span>'+x.min+'′</span><i></i><b>'+esc(x.n)+'</b>'+(x.us?'':'<em>'+esc(opp.ab)+'</em>')+'</li>';});o+='</ul>';}
    o+='</div>';
  });
  return o;
}
function tieCard(r){
  var t=r.tie,two=r.stage.legs>1,opp=r.opp,win=t.adv;
  var legs="";
  t.legs.forEach(function(m,k){
    legs+='<li><span>'+(two?(k?'2ND LEG':'1ST LEG'):'MATCH')+'</span><b>'+m.us+' – '+m.them+'</b></li>';
  });
  var note="";
  if(t.et)note+='<span>Extra time '+t.et.us+'–'+t.et.them+'</span>';
  if(t.pens)note+='<span>Penalties '+t.pens.us+'–'+t.pens.them+'</span>';
  var big=two?'AGG '+t.aggUs+'–'+t.aggThem:t.legs[0].us+(t.et?'+'+t.et.us:'')+' – '+t.legs[0].them+(t.et?'+'+t.et.them:'');
  return '<article class="u-tie '+(win?'is-win':'is-out')+'">'+
    '<header><b>'+esc(r.stage.name)+'</b><span>'+(two?'2 LEGS':'1 MATCH')+'</span></header>'+
    '<div class="u-vs"><div class="u-side">'+XI_CREST+'<b>YOUR XI</b><small>'+S.fid+'</small></div>'+
    '<div class="u-led"><strong>'+(two?t.aggUs+'–'+t.aggThem:big)+'</strong><small>'+(two?'AGGREGATE':'FULL TIME')+'</small></div>'+
    '<div class="u-side">'+crest(opp.c,opp.ab,44)+'<b>'+esc(opp.club)+'</b><small>'+esc(opp.ss)+(S.mode==="memory"?'':' · '+Math.round(opp.O))+'</small></div></div>'+
    '<ul class="u-legs">'+legs+'</ul>'+(note?'<p class="u-tnote">'+note+'</p>':'')+
    '<details class="u-goals"><summary>Goals &amp; scorers</summary>'+goalLines(t,opp)+'</details>'+
    '<footer class="u-res">'+(win?'<span>▶ THROUGH</span>':'<span>✖ ELIMINATED</span>')+'</footer></article>';
}
/* ---------- إحصاءات النتيجة ---------- */
function tally(){
  var g={};
  S.res.stages.forEach(function(r){
    r.tie.legs.forEach(function(m){m.gUs.forEach(function(x){g[x.n]=(g[x.n]||0)+1;});});
    if(r.tie.et)r.tie.et.gUs.forEach(function(x){g[x.n]=(g[x.n]||0)+1;});
  });
  var max=0,names=[];
  Object.keys(g).forEach(function(n){if(g[n]>max){max=g[n];names=[n];}else if(g[n]===max)names.push(n);});
  return{g:g,max:max,boot:names};
}
function verdict(){
  var r=S.res,tm=S.team,tr=r.tier,T=tally(),xi="";
  S.slots.forEach(function(s){var p=S.picks[s.i];if(p){var gl=T.g[p.n]||0;
    xi+='<li><span class="u-pos">'+s.pos+'</span><b>'+esc(p.n)+'</b><em>'+esc(p.ab)+' '+esc(p.ss)+'</em>'+(gl?'<u>'+gl+' ⚽</u>':'')+'<i>'+p.r+'</i></li>';}});
  var boot=T.max?'<div class="u-boot"><small>GOLDEN BOOT</small><b>'+T.boot.map(function(n){return esc(n.toUpperCase())+' '+T.max;}).join(' · ')+'</b></div>':'';
  return '<div class="u-verdict t-'+tr.id+'">'+stars(8)+'<small>FINAL VERDICT</small><h2>'+esc(tr.label)+'</h2><p>'+esc(tr.sub)+'</p>'+
    '<div class="u-rec"><small>RECORD</small><strong>'+r.wins+'–'+r.losses+'</strong><span>'+r.wins+' won · '+r.draws+' drawn · '+r.losses+' lost</span></div>'+
    '<div class="u-vstats"><div><b>'+r.scored+'</b><span>goals for</span></div><div><b>'+r.conceded+'</b><span>against</span></div><div><b>'+Math.round(tm.ovr)+'</b><span>overall</span></div><div><b>'+r.played+'</b><span>matches</span></div></div>'+boot+'</div>'+
    '<div class="u-rrow"><button type="button" class="u-btn u-alt" data-act="replay">↻ Replay</button><button type="button" class="u-btn" data-act="card">See card →</button></div>'+
    '<div class="u-panel u-mt"><h2 class="u-label">Team strength</h2>'+bars(tm,false)+'</div>'+
    '<div class="u-panel"><h2 class="u-label">Your XI · ratings revealed</h2><ul class="u-xi">'+xi+'</ul></div>'+
    '<button type="button" class="u-btn u-big" data-act="again">Play again</button>'+
    '<button type="button" class="u-btn u-alt u-wide" data-act="back">Change settings</button>'+
    '<button type="button" class="u-btn u-ghostb u-wide" data-act="home">Back to home</button>';
}

/* ---------- المباراة اللايف ---------- */
function legPlan(si,k){
  var t=S.res.stages[si].tie,m=t.legs[k],last=k===t.legs.length-1,ev=[];
  m.gUs.forEach(function(g){ev.push({min:g.min,n:g.n,us:1});});
  m.gThem.forEach(function(g){ev.push({min:g.min,n:g.n,us:0});});
  if(last&&t.et){
    t.et.gUs.forEach(function(g){ev.push({min:g.min,n:g.n,us:1});});
    t.et.gThem.forEach(function(g){ev.push({min:g.min,n:g.n,us:0});});
  }
  ev.sort(function(a,b){return a.min-b.min;});
  return{ev:ev,last:last,end:(last&&t.et)?120:90,t:t};
}
function liveScore(p,min){
  var u=0,th=0;p.ev.forEach(function(e){if(e.min<=min){if(e.us)u++;else th++;}});
  return[u,th];
}
function clockTxt(min,end){return min>90?"ET "+min+"′":min+"′";}
function feedHtml(p,min,opp){
  var o="";
  p.ev.forEach(function(e){if(e.min<=min)o+='<li class="'+(e.us?'us':'them')+'"><span>'+e.min+'′</span><i></i><b>'+esc(e.n)+'</b>'+(e.us?'':'<em>'+esc(opp.ab)+'</em>')+'</li>';});
  return o;
}
function liveCard(){
  var L=S.live,r=S.res.stages[L.si],opp=r.opp,two=r.stage.legs>1,p=legPlan(L.si,L.k),
      sc=liveScore(p,L.min),wait=L.state==="wait",prev="",pu=0,pt=0,j;
  for(j=0;j<L.k;j++){var m=r.tie.legs[j];pu+=m.us;pt+=m.them;prev+='<li><span>'+(j?'2ND LEG':'1ST LEG')+'</span><b>'+m.us+' – '+m.them+'</b></li>';}
  var legName=two?(L.k?'2ND LEG':'1ST LEG'):'THE FINAL';
  return '<article class="u-tie u-live'+(wait?' is-wait':'')+'" id="uLive"><header><b>'+esc(r.stage.name)+'</b><span>'+legName+'</span></header>'+
    '<div class="u-vs"><div class="u-side">'+XI_CREST+'<b>YOUR XI</b><small>'+S.fid+'</small></div>'+
    '<div class="u-led" id="uLed"><strong id="uSc">'+sc[0]+'–'+sc[1]+'</strong><small id="uClk">'+(wait?'KICK-OFF':clockTxt(L.min,p.end))+'</small></div>'+
    '<div class="u-side">'+crest(opp.c,opp.ab,44)+'<b>'+esc(opp.club)+'</b><small>'+esc(opp.ss)+(S.mode==="memory"?'':' · '+Math.round(opp.O))+'</small></div></div>'+
    (two&&L.k?'<p class="u-agg" id="uAgg">AGG '+(pu+sc[0])+'–'+(pt+sc[1])+'</p>':'')+
    (prev?'<ul class="u-legs">'+prev+'</ul>':'')+
    '<ul class="u-feed" id="uFeed">'+feedHtml(p,L.min,opp)+'</ul>'+
    (wait?'<button type="button" class="u-btn u-play" data-act="kick">▶ Kick off '+(two?(L.k?'2nd leg':'1st leg'):'the final')+'</button>':'')+'</article>';
}
function controls(done){
  function sp(v,l){return '<button type="button" class="u-seg-b'+(S.speed===v?' is-on':'')+'" data-act="speed" data-v="'+v+'">'+l+'</button>';}
  return '<div class="u-ctl"><div class="u-seg"><button type="button" class="u-seg-b'+(!S.auto?' is-on':'')+'" data-act="auto" data-v="0">Match by match</button>'+
    '<button type="button" class="u-seg-b'+(S.auto?' is-on':'')+'" data-act="auto" data-v="1">Automatic</button></div>'+
    '<div class="u-seg u-spd">'+sp("normal","Normal")+sp("fast","Fast")+sp("ultra","Ultra")+'</div></div>';
}
function viewSim(){
  var r=S.res,over=S.reveal>=r.stages.length&&!S.live;
  var o='<div class="u-board"><small>KNOCKOUT STAGE</small><b>'+(over?(r.champion?'CHAMPIONS':'OUT'):'MATCHDAY')+'</b>'+
    '<span>'+STAGES.length+' ROUNDS · '+U.TOTAL_MATCHES+' MATCHES</span></div>';
  if(!over)o+=controls();
  for(var i=0;i<Math.min(S.reveal,r.stages.length);i++)o+=tieCard(r.stages[i]);
  if(S.live)o+=liveCard()+'<button type="button" class="u-btn u-ghostb u-wide" data-act="skip">Skip to result</button>';
  else if(over)o+=verdict();
  return o;
}

/* ---------- الرسم ---------- */
function render(keepScroll){
  var y=window.scrollY,h;
  if(S.view==="setup")h=viewSetup();
  else if(S.view==="draft")h=viewDraft();
  else if(S.view==="ready")h=viewReady();
  else h=viewSim();
  root.className="u-mode-"+S.view+(S.mode==="memory"?" is-memory":"");
  root.innerHTML=bar()+'<main class="u-main">'+h+'</main>';
  if(keepScroll)window.scrollTo(0,y);
}

/* ---------- الأفعال ---------- */
function resetDraft(){
  clearTimers();
  S.slots=U.slotsFor(S.fid);S.picks={};S.taken={};S.used={};S.count=0;
  S.cur=null;S.phase="idle";S.rolling=false;S.rerolls=MAXRR;S.sel=null;
  S.team=null;S.res=null;S.reveal=0;S.counted=false;
}
function startDraft(){click();resetDraft();S.view="draft";saveSettings();render();window.scrollTo(0,0);}

function doRoll(kind){
  if(S.rolling)return;
  var next;
  if(kind==="draw")next=U.drawSeason(rnd,SEASONS,S.used,S.slots,S.picks,S.taken);
  else{
    if(S.rerolls<1||!S.cur)return;
    next=kind==="team"?U.rerollTeam(rnd,SEASONS,S.cur,S.used,S.slots,S.picks,S.taken):U.rerollSeason(rnd,SEASONS,S.cur,S.used,S.slots,S.picks,S.taken);
    if(!next){say("No other option available");return;}
  }
  if(!next){say("No squad can fill your open slots");return;}
  click();
  if(kind!=="draw")S.rerolls--;
  S.rolling=true;S.sel=null;
  S.cur=SEASONS[Math.floor(rnd()*SEASONS.length)];
  S.phase="drawn";
  render();
  var box=document.getElementById("uRoll"),n=0;
  var iv=setInterval(function(){
    n++;
    var f=SEASONS[Math.floor(rnd()*SEASONS.length)];
    if(box)box.innerHTML=drawnCard(f);
    if(n>=9){
      clearInterval(iv);
      S.cur=next;S.used[next.id]=1;S.rolling=false;S.phase="drawn";
      render();window.scrollTo(0,0);
    }
  },75);
  S.timers.push(iv);
}

function place(p,slotIdx){
  var s=S.cur;
  S.picks[slotIdx]={n:p.n,r:p.r,pos:p.pos,alt:p.alt,c:s.c,ab:s.ab,ss:s.ss,club:s.club};
  S.taken[p.n]=1;S.count++;S.cur=null;S.phase="idle";S.sel=null;
  click();
  if(S.count>=11){S.view="ready";render();window.scrollTo(0,0);return;}
  render();window.scrollTo(0,0);
}
function doPick(name){
  if(S.rolling||!S.cur)return;
  var pk=U.pickable(S.cur,S.slots,S.picks,S.taken),hit=null;
  pk.forEach(function(x){if(x.p.n===name)hit=x;});
  if(!hit)return;
  if(S.sel&&S.sel.n===name){S.sel=null;render(true);return;}
  var kinds={};hit.slots.forEach(function(i){kinds[S.slots[i].pos]=1;});
  if(Object.keys(kinds).length===1){place(hit.p,hit.slots[0]);return;}
  S.sel={n:name,slots:hit.slots,p:hit.p};click();render(true);
  say("Tap a highlighted slot on the pitch");
  var pt=root.querySelector(".u-pitch");if(pt)pt.scrollIntoView({behavior:"smooth",block:"center"});
}
function doSlot(i){
  if(!S.sel||S.sel.slots.indexOf(i)<0)return;
  place(S.sel.p,i);
}

function msTick(){return{normal:85,fast:30,ultra:7}[S.speed]||85;}
function msGoal(){return{normal:700,fast:260,ultra:50}[S.speed]||700;}
function startSim(seed){
  S.team=U.makeTeam(S.slots,S.picks,S.style);
  S.res=U.runCup(S.team,seed||newSeed(),SEASONS);
  S.view="sim";S.reveal=0;
  render();window.scrollTo(0,0);
  nextMatch();
}
function doSim(){click();S.counted=false;startSim();}
function doReplay(){click();clearTimers();S.counted=true;startSim(S.res.seed);}
function nextMatch(){
  clearTimers();
  if(S.reveal>=S.res.stages.length){S.live=null;finish();return;}
  S.live={si:S.reveal,k:0,min:0,state:"wait"};
  render();
  if(S.auto)later(startLeg,S.reveal===0?900:700);
}
function startLeg(){
  if(!S.live||S.live.state!=="wait"||S.view!=="sim")return;
  S.live.state="play";S.live.min=0;render();
  later(tick,msTick());
}
function tick(){
  var L=S.live;if(S.view!=="sim"||!L||L.state!=="play")return;
  var p=legPlan(L.si,L.k),opp=S.res.stages[L.si].opp;
  L.min++;
  var hit=p.ev.filter(function(e){return e.min===L.min;}),sc=liveScore(p,L.min);
  var clk=document.getElementById("uClk"),scr=document.getElementById("uSc"),fd=document.getElementById("uFeed"),led=document.getElementById("uLed"),ag=document.getElementById("uAgg");
  if(clk)clk.textContent=clockTxt(L.min,p.end);
  if(scr)scr.textContent=sc[0]+"–"+sc[1];
  if(fd)fd.innerHTML=feedHtml(p,L.min,opp);
  if(ag){var r=S.res.stages[L.si],pu=0,pt=0;for(var j=0;j<L.k;j++){pu+=r.tie.legs[j].us;pt+=r.tie.legs[j].them;}ag.textContent="AGG "+(pu+sc[0])+"–"+(pt+sc[1]);}
  if(hit.length&&led){
    led.classList.remove("is-g","is-c");void led.offsetWidth;
    led.classList.add(hit.some(function(e){return !e.us;})&&!hit.some(function(e){return e.us;})?"is-c":"is-g");
  }
  if(L.min>=p.end){later(endLeg,msGoal());return;}
  later(tick,msTick()+(hit.length?msGoal():0));
}
function endLeg(){
  var L=S.live;if(!L||S.view!=="sim")return;
  var p=legPlan(L.si,L.k);
  if(!p.last){S.live={si:L.si,k:L.k+1,min:0,state:"wait"};render(true);if(S.auto)later(startLeg,msGoal()+500);return;}
  S.reveal=L.si+1;S.live=null;
  render();
  if(S.reveal>=S.res.stages.length){finish();return;}
  S.live={si:S.reveal,k:0,min:0,state:"wait"};
  later(function(){render(true);if(S.auto)later(startLeg,900);},S.auto?900:400);
}
function finish(){
  if(!S.counted){
    S.counted=true;
    var t=S.res.tier;
    S.stats.runs++;
    if(S.res.champion)S.stats.titles++;
    if(t.id==="flawless"||t.id==="immaculate")S.stats.flawless++;
    if((TIER_RANK[t.id]||0)>(TIER_RANK[S.stats.best]||0))S.stats.best=t.id;
    saveStats();
  }
  S.live=null;render();window.scrollTo(0,0);
}
function skip(){
  clearTimers();S.reveal=S.res.stages.length;S.live=null;finish();
}

/* ---------- كارت المشاركة (PNG) ---------- */
function shareCard(){
  var r=S.res,T=tally(),c=document.createElement("canvas"),W=1080,H=1350,x=c.getContext("2d");
  c.width=W;c.height=H;
  var g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,"#0b2fb8");g.addColorStop(.5,"#061478");g.addColorStop(1,"#02061c");x.fillStyle=g;x.fillRect(0,0,W,H);
  x.strokeStyle="rgba(79,208,255,.12)";x.lineWidth=1;for(var i=0;i<W;i+=54){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke();}for(i=0;i<H;i+=54){x.beginPath();x.moveTo(0,i);x.lineTo(W,i);x.stroke();}
  x.strokeStyle="#4fd0ff";x.lineWidth=4;x.strokeRect(30,30,W-60,H-60);
  x.textAlign="center";x.fillStyle="#4fd0ff";x.font="600 30px 'Chakra Petch',system-ui,sans-serif";x.fillText("C H A M P I O N S   X I",W/2,110);
  x.fillStyle="#fff";x.font="700 84px 'Chakra Petch',system-ui,sans-serif";x.fillText(r.tier.label,W/2,230);
  x.fillStyle="#c9d3e8";x.font="500 32px 'Chakra Petch',system-ui,sans-serif";x.fillText(r.tier.sub,W/2,285);
  x.fillStyle="#ffd23f";x.font="700 190px 'Chakra Petch',system-ui,sans-serif";x.fillText(r.wins+"–"+r.losses,W/2,470);
  x.fillStyle="#c9d3e8";x.font="600 30px 'Chakra Petch',system-ui,sans-serif";
  x.fillText(r.scored+" GOALS FOR   ·   "+r.conceded+" AGAINST   ·   "+Math.round(S.team.ovr)+" OVERALL",W/2,540);
  if(T.max){x.fillStyle="#ffd23f";x.font="700 34px 'Chakra Petch',system-ui,sans-serif";x.fillText("GOLDEN BOOT  "+T.boot.join(" · ").toUpperCase()+"  "+T.max,W/2,605);}
  x.textAlign="left";var y=680;
  S.slots.forEach(function(s){var p=S.picks[s.i];if(!p)return;
    x.fillStyle="#2b6bff";x.fillRect(110,y-34,84,44);x.fillStyle="#fff";x.font="700 26px 'Chakra Petch',system-ui,sans-serif";x.textAlign="center";x.fillText(s.pos,152,y-3);
    x.textAlign="left";x.font="600 36px 'Chakra Petch',system-ui,sans-serif";x.fillText(p.n,220,y-2);
    x.fillStyle="#8fb2ff";x.font="500 28px 'Chakra Petch',system-ui,sans-serif";x.fillText(p.ab+" "+p.ss,620,y-2);
    x.textAlign="right";x.fillStyle="#5dffb0";x.font="700 38px 'Chakra Petch',system-ui,sans-serif";x.fillText(String(p.r),W-110,y-2);y+=54;});
  x.textAlign="center";x.fillStyle="#4fd0ff";x.font="500 26px 'Chakra Petch',system-ui,sans-serif";x.fillText(S.fid+" · "+STYLE_LABEL[S.style]+" · seed #"+r.seed,W/2,H-70);
  c.toBlob(function(b){
    if(!b){say("Couldn't build the card");return;}
    var f;try{f=new File([b],"champions-xi.png",{type:"image/png"});}catch(e){f=null;}
    if(f&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:"Champions XI"}).catch(function(){});return;}
    var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="champions-xi.png";document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(a.href);},4000);say("Card saved");
  },"image/png");
}

root.addEventListener("click",function(e){
  var b=e.target.closest("[data-act]");if(!b||b.disabled)return;
  var a=b.getAttribute("data-act"),v=b.getAttribute("data-v");
  switch(a){
    case "home":clearTimers();click();show("hub");break;
    case "back":
      if(S.view==="draft"&&S.count>0&&!window.confirm("Leave this draft? Your picks will be lost."))break;
      clearTimers();click();S.view="setup";render();window.scrollTo(0,0);break;
    case "fid":S.fid=v;click();saveSettings();render(true);break;
    case "style":S.style=v;click();saveSettings();render(true);break;
    case "mode":S.mode=v;click();saveSettings();render(true);break;
    case "start":startDraft();break;
    case "roll":doRoll("draw");break;
    case "rr-team":doRoll("team");break;
    case "rr-season":doRoll("season");break;
    case "pick":doPick(b.getAttribute("data-n"));break;
    case "slot":doSlot(+b.getAttribute("data-i"));break;
    case "sim":doSim();break;
    case "skip":click();skip();break;
    case "kick":click();startLeg();break;
    case "auto":S.auto=v==="1";click();saveSettings();render(true);if(S.auto&&S.live&&S.live.state==="wait")later(startLeg,300);break;
    case "speed":S.speed=v;click();saveSettings();render(true);break;
    case "replay":doReplay();break;
    case "card":click();shareCard();break;
    case "again":startDraft();break;
  }
});

/* ---------- نقاط الدخول (من كارت الشاشة الرئيسية) ---------- */
window.uclOpen=function(){
  clearTimers();loadSave();
  S.view="setup";resetDraft();
  render();
  show("ucl");
};
window.uclHome=function(){clearTimers();show("hub");};

loadSave();
render();
})();
