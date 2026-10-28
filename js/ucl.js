/* =========================================================
   UCL — واجهة لعبة «كؤوس أوروبا» (EUROPE XI: دوري الأبطال + اليوروبا + المؤتمر). أوفلاين على جهاز واحد.
   المنطق: js/ucl-engine.js · البيانات: js/ucl-data.js · الشكل: css/ucl.css
   الواجهة كلها بتتبني من JS جوه #uclRoot (زي Sudoku)، بالإنجليزي من الشمال لليمين.

   الدورة: إعداد (تشكيلة/أسلوب/مسار/عرض) ← سحب نادي بطل + موسم ← اختيار لاعب
   (11 مرة، 3 إعادات سحب) ← إدارة التشكيلة (اضغط أي لاعب: تفاصيل + تغيير مركز)
   ← بطولة إقصائية 9 مباريات، بقرارات بين الشوطين ← نتيجة + إنجازات.
========================================================= */
(function(){
"use strict";
var root=document.getElementById("uclRoot");
if(!root||!window.UCL||!window.UCL_DATA)return;

var U=window.UCL,SEASONS=window.UCL_DATA.seasons,STAGES=U.STAGES;
var KEY="uclSettings",SKEY="uclStats",AKEY="uclAch",MAXRR=3;
var POSORD=["GK","RB","CB","LB","DM","CM","AM","RM","LM","RW","LW","ST"];
var GRP={GK:["GK"],DEF:["RB","LB","CB"],MID:["DM","CM","AM","RM","LM"],ATT:["RW","LW","ST"]};
var STYLE_LABEL={defensive:"Defensive",balanced:"Balanced",attacking:"Attacking"};
var STYLE_DESC={
  attacking:"ATT +4.5 · DEF −4.5. More goals at both ends, more own goals and late drama against you.",
  balanced:"No modifiers. The baseline.",
  defensive:"ATT −4.5 · DEF +4.5. Tight, low-scoring games. A little better in shootouts."
};
var TIER_RANK={po:1,r16:2,quarter:3,semi:4,finalist:5,champions:6,unbeaten:7,flawless:8,immaculate:9};
var TIER_STARS={po:0,r16:1,quarter:2,semi:3,finalist:3,champions:4,unbeaten:4,flawless:5,immaculate:5};
var TIER_NAME={po:"KNOCKED OUT",r16:"LAST 16",quarter:"QUARTER-FINALIST",semi:"SEMI-FINALIST",finalist:"FINALIST",champions:"CHAMPIONS",unbeaten:"UNBEATEN",flawless:"FLAWLESS",immaculate:"IMMACULATE"};

var S={
  view:"setup",fid:"4-3-3",style:"balanced",mode:"classic",bracket:"ladder",era:"all",comps:["ucl","uel","uecl"],tab:"cups",pres:"cinematic",manage:true,
  slots:[],picks:{},taken:{},used:{},count:0,
  cur:null,phase:"idle",rolling:false,revealing:false,rerolls:MAXRR,rrUsed:-1,sel:null,flt:"ALL",sheet:null,
  team:null,res:null,cup:null,stages:[],tieLegs:[],reveal:0,timers:[],counted:false,auto:true,speed:"normal",live:null,xiOpen:false,
  fin:null,on:null,
  stats:{runs:0,titles:0,flawless:0,best:"",imm:0,gf:0,big:0},ach:{}
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
function pool(){return U.poolFor(SEASONS,S.on?S.on.era:S.era,S.on?S.on.cups:S.comps);}
var scEl=document.getElementById("ucl");
function getY(){return S.on&&scEl?scEl.scrollTop:window.scrollY;}
function setY(y){if(S.on&&scEl)scEl.scrollTop=y;else window.scrollTo(0,y);}
function toTop(){setY(0);}
function rc(r){return r>=90?"r1":r>=85?"r2":r>=80?"r3":r>=75?"r4":"r5";}
function inGrp(pos,f){return f==="ALL"||GRP[f].indexOf(pos)>-1;}
function sgn(x){return(x>=0?"+":"−")+Math.abs(x).toFixed(1);}

function loadSave(){
  try{
    var j=JSON.parse(localStorage.getItem(KEY)||"null");
    if(j){
      if(U.FORMATIONS[j.fid])S.fid=j.fid;
      if(U.STYLES.indexOf(j.style)>-1)S.style=j.style;
      if(j.mode==="classic"||j.mode==="memory")S.mode=j.mode;
      if(j.bracket==="ladder"||j.bracket==="random")S.bracket=j.bracket;
      if(j.era==="all"||j.era==="modern")S.era=j.era;
      if(j.pres==="cinematic"||j.pres==="fast")S.pres=j.pres;
      if(typeof j.manage==="boolean")S.manage=j.manage;
      if(typeof j.auto==="boolean")S.auto=j.auto;
      if(j.speed==="normal"||j.speed==="fast"||j.speed==="ultra")S.speed=j.speed;
    }
    var st=JSON.parse(localStorage.getItem(SKEY)||"null");
    if(st&&typeof st.runs==="number")S.stats={runs:st.runs|0,titles:st.titles|0,flawless:st.flawless|0,best:String(st.best||""),imm:st.imm|0,gf:st.gf|0,big:st.big|0};
    var a=JSON.parse(localStorage.getItem(AKEY)||"null");
    if(a&&typeof a==="object")S.ach=a;
  }catch(e){}
}
function saveSettings(){try{localStorage.setItem(KEY,JSON.stringify({fid:S.fid,style:S.style,mode:S.mode,bracket:S.bracket,era:S.era,pres:S.pres,manage:S.manage,auto:S.auto,speed:S.speed}));}catch(e){}}
function saveStats(){try{localStorage.setItem(SKEY,JSON.stringify(S.stats));localStorage.setItem(AKEY,JSON.stringify(S.ach));}catch(e){}}

/* ---------- الإنجازات ---------- */
var ACH=[
  {id:"first",n:"Kick-off",d:"Finish your first cup.",t:function(r){return true;}},
  {id:"champ",n:"Champions of Europe",d:"Win the Final.",t:function(r){return r.champion;}},
  {id:"unbeaten",n:"Invincible",d:"Win the cup without losing a match.",t:function(r){return r.champion&&r.losses===0;}},
  {id:"flawless",n:"Flawless",d:"Win all 9 matches.",t:function(r){return r.champion&&r.wins===U.TOTAL_MATCHES;}},
  {id:"immaculate",n:"Immaculate",d:"Win all 9 without conceding.",t:function(r){return r.tier.id==="immaculate";}},
  {id:"comeback",n:"Never Say Die",d:"Win a match you were losing at half-time.",t:function(r,f){return f.comeback;}},
  {id:"tactician",n:"Tactician",d:"Change the plan at half-time 4 times in one cup.",t:function(r,f){return f.decs>=4;}},
  {id:"gambler",n:"Fortune Favours",d:"Go all-out when trailing, and win the match.",t:function(r,f){return f.gambler;}},
  {id:"total",n:"Total Football",d:"Win it all Attacking with 20+ goals.",t:function(r){return r.champion&&S.style==="attacking"&&r.scored>=20;}},
  {id:"bus",n:"Park the Bus",d:"Win it all Defensive, conceding 2 or fewer.",t:function(r){return r.champion&&S.style==="defensive"&&r.conceded<=2;}},
  {id:"wild",n:"Wild Ride",d:"Win the title through a Random Bracket.",t:function(r){return r.champion&&r.bracket==="random";}},
  {id:"modern",n:"Modern Master",d:"Win the title in Modern Era mode.",t:function(r){return r.champion&&S.era==="modern";}},
  {id:"boot",n:"Golden Boot",d:"One player scores 6+ in a single cup.",t:function(r,f){return f.maxG>=6;}},
  {id:"wonder",n:"Wonder Goal",d:"Score a wonder goal.",t:function(r,f){return f.wonder;}},
  {id:"under",n:"Underdog",d:"Win the title with an XI rated under 88.",t:function(r){return r.champion&&S.team&&S.team.ovr<88;}},
  {id:"triple",n:"Triple Crown",d:"Win the title with players from all three cups in your XI.",t:function(r){return r.champion&&cupsInXI()===3;}}
];
function cupsInXI(){var m={};Object.keys(S.picks).forEach(function(k){m[S.picks[k].cp||"ucl"]=1;});return Object.keys(m).length;}
function runFacts(){
  var f={comeback:false,decs:0,gambler:false,wonder:false,maxG:0,big:0,g:{}};
  S.res.stages.forEach(function(st){
    function goalsOf(evs){evs.forEach(function(e){if(e.t==="goal"&&e.us===1){f.g[e.n]=(f.g[e.n]||0)+1;if(e.w)f.wonder=true;}});}
    st.tie.legs.forEach(function(m){
      goalsOf(m.ev);
      if(m.ht&&m.ht.us<m.ht.them&&m.fUs>m.fThem)f.comeback=true;
      if(m.decision&&m.decision.opt!=="stay"){f.decs++;if(m.decision.opt==="allout"&&m.fUs>m.fThem)f.gambler=true;}
      f.big=Math.max(f.big,m.fUs-m.fThem);
    });
    if(st.tie.et)goalsOf(st.tie.et.ev);
  });
  Object.keys(f.g).forEach(function(n){f.maxG=Math.max(f.maxG,f.g[n]);});
  return f;
}

/* ---------- رسومات ---------- */
var COMPS={
  ucl:{id:"ucl",n:"Champions League",s:"UCL",c:"#3d7bff",l:"#8db4ff"},
  uel:{id:"uel",n:"Europa League",s:"UEL",c:"#f2680c",l:"#ffa24d"},
  uecl:{id:"uecl",n:"Conference League",s:"UECL",c:"#1fb36b",l:"#6ff0b0"}
};
function compOf(s){return U.compOf(s);}
function compName(s){var id=compOf(s);return(id==="uel"&&s.yr&&s.yr<=2009)?"UEFA Cup":COMPS[id].n;}
function compTag(id){id=COMPS[id]?id:"ucl";return'<span class="u-ct c-'+id+'">'+COMPS[id].s+'</span>';}
var CID=0;
var PATS=["plain","half","band","hoops","chevron"];
var PAT={MIL:"stripes",INT:"stripes",JUV:"stripes",BAR:"stripes",ATM:"stripes",CRV:"stripes",POR:"stripes",CSK:"half",
  SEV:"band",AJX:"band",PSG:"band",FEY:"half",BEN:"half",HSV:"hoops",CEL:"hoops",TOT:"plain",RMA:"plain",MUN:"plain",LIV:"plain",CHE:"plain",MCI:"plain",BAY:"plain",BVB:"plain",
  CRY:"chevron",ATA:"stripes",SGE:"half",WHU:"chevron",AVL:"half",ROM:"half",OLY:"stripes",GAL:"half",VAL:"chevron",ZEN:"hoops",SHA:"stripes",VIL:"plain"};
var SHAPES=["M6 7Q28 1 50 7V30C50 46 39 55 28 61C17 55 6 46 6 30Z","M5 5H51V31C51 46 38 55 28 61C18 55 5 46 5 31Z","M28 6A24 24 0 1 1 27.99 6Z"];
function hash(s){var h=7;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h;}
function starPts(cx,cy,R,r){var p=[],k;for(k=0;k<10;k++){var a=-Math.PI/2+k*Math.PI/5,q=k%2?r:R;p.push((cx+q*Math.cos(a)).toFixed(1)+","+(cy+q*Math.sin(a)).toFixed(1));}return p.join(" ");}
function glyph(id,cx,cy,k){
  if(id==="uel")return'<path transform="translate('+cx+' '+cy+') scale('+k+')" d="M.15-1 L-.62.12 H-.08 L-.22 1 L.62-.18 H.1Z" fill="#fff"/>';
  if(id==="uecl")return'<g transform="translate('+cx+' '+cy+') scale('+k+')"><path d="M0-1C.8-.5.8.5 0 1C-.8.5-.8-.5 0-1Z" fill="#fff"/><path d="M0-.55V.6" stroke="'+COMPS.uecl.c+'" stroke-width=".16" fill="none"/></g>';
  return'<polygon transform="translate('+cx+' '+cy+') scale('+k+')" points="'+starPts(0,0,1,.42)+'" fill="#fff"/>';
}
function compIcon(id,sz){
  id=COMPS[id]?id:"ucl";var C=COMPS[id],g="ci"+(++CID);
  return'<svg class="u-ci" viewBox="0 0 24 24" width="'+sz+'" height="'+sz+'" aria-hidden="true"><defs><linearGradient id="'+g+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+C.l+'"/><stop offset="1" stop-color="'+C.c+'"/></linearGradient></defs>'+
    '<circle cx="12" cy="12" r="11" fill="url(#'+g+')" stroke="rgba(255,255,255,.85)" stroke-width="1.3"/>'+glyph(id,12,12.4,6.4)+'</svg>';
}
function crest(c,ab,sz,comp){
  var f=c[0],s=c[1],h=hash(ab),shp=h%3,pat=PAT[ab]||PATS[(h>>3)%PATS.length],d=SHAPES[shp],n=++CID,cl="cc"+n,gl="cg"+n,bg="cm"+n,L="";
  var fs=ab.length>3?9:ab.length>2?11:13;
  if(pat==="stripes"){for(var i=1;i<7;i+=2)L+='<rect x="'+(4+i*9.6-9.6)+'" y="0" width="9.6" height="64" fill="'+s+'"/>';}
  else if(pat==="hoops")L='<rect x="0" y="13" width="56" height="10" fill="'+s+'"/><rect x="0" y="33" width="56" height="10" fill="'+s+'"/>';
  else if(pat==="half")L='<rect x="28" y="0" width="28" height="64" fill="'+s+'"/>';
  else if(pat==="band")L='<rect x="21" y="0" width="14" height="64" fill="'+s+'"/>';
  else if(pat==="chevron")L='<path d="M0 18L28 40L56 18V30L28 52L0 30Z" fill="'+s+'"/>';
  else L='<rect x="0" y="0" width="56" height="15" fill="'+s+'"/>';
  var med="";
  if(comp&&COMPS[comp]){var C=COMPS[comp];
    med='<defs><linearGradient id="'+bg+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+C.l+'"/><stop offset="1" stop-color="'+C.c+'"/></linearGradient></defs>'+
      '<circle cx="44" cy="50" r="10.5" fill="url(#'+bg+')" stroke="#0b0e14" stroke-width="3"/><circle cx="44" cy="50" r="10.5" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="1.4"/>'+glyph(comp,44,50.4,5.6);}
  return'<svg class="u-crest" viewBox="0 0 56 64" width="'+sz+'" height="'+Math.round(sz*64/56)+'" aria-hidden="true">'+
    '<defs><clipPath id="'+cl+'"><path d="'+d+'"/></clipPath><linearGradient id="'+gl+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>'+
    '<path d="'+d+'" fill="'+f+'" stroke="#0b0e14" stroke-width="3.2" stroke-linejoin="round"/>'+
    '<g clip-path="url(#'+cl+')">'+L+'<rect x="0" y="0" width="56" height="34" fill="url(#'+gl+')"/></g>'+
    '<path d="'+d+'" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.1" stroke-linejoin="round"/>'+
    '<text x="28" y="'+(shp===2?36:37)+'" text-anchor="middle" font-size="'+fs+'" font-weight="800" fill="#fff" stroke="rgba(0,0,0,.72)" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke" style="font-family:Inter,system-ui,sans-serif;letter-spacing:.02em">'+esc(ab)+'</text>'+med+'</svg>';
}
var XI_CREST=crest(["#12151c","#f2680c"],"XI",44);
function starsRow(n,glow){
  var o="";for(var i=0;i<5;i++)o+='<i class="'+(i<n?'on':'')+'"></i>';
  return '<span class="u-starrow'+(glow?' is-glow':'')+'" aria-label="'+n+' of 5 stars">'+o+"</span>";
}
function dieSvg(){
  return '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M2 1h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm2 3v2h2V4zm6 0v2h2V4zM7 7v2h2V7zm-3 3v2h2v-2zm6 0v2h2v-2z"/></svg>';
}
function medal(id){
  return '<svg class="u-medal m-'+id+'" viewBox="0 0 64 72" width="84" height="94" aria-hidden="true">'+
    '<defs><linearGradient id="uMg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--m1)"/><stop offset="1" style="stop-color:var(--m2)"/></linearGradient></defs>'+
    '<path d="M32 3 58 12v22c0 17-11 28-26 35C17 62 6 51 6 34V12z" fill="url(#uMg)" stroke="rgba(255,255,255,.55)" stroke-width="2"/>'+
    '<path d="M32 12 50 18v16c0 11-7 19-18 24C21 53 14 45 14 34V18z" fill="rgba(0,0,0,.22)"/>'+
    '<path d="M23 22h18v2h5v5a7 7 0 0 1-6 6.9 8 8 0 0 1-4 3.4V44h5v3H23v-3h5v-4.7a8 8 0 0 1-4-3.4A7 7 0 0 1 18 29v-5h5zm-3 4v3a3 3 0 0 0 2 2.8V26zm24 0h-2v5.8a3 3 0 0 0 2-2.8z" fill="#fff" fill-opacity=".92"/></svg>';
}
function miniPitch(fid){
  var sl=U.slotsFor(fid),o='<svg class="u-mini-svg" viewBox="0 0 100 128" aria-hidden="true" preserveAspectRatio="xMidYMid meet">'+
    '<rect x="3" y="3" width="94" height="122" rx="2" class="ln"/><path d="M3 64h94" class="ln"/><circle cx="50" cy="64" r="10" class="ln"/>'+
    '<rect x="24" y="3" width="52" height="17" class="ln"/><rect x="24" y="108" width="52" height="17" class="ln"/>';
  sl.forEach(function(s){
    var cx=s.x.toFixed(1),cy=(s.y*1.28).toFixed(1);
    o+='<circle cx="'+cx+'" cy="'+cy+'" r="6.4" class="dt"/><text x="'+cx+'" y="'+(+cy+2.3).toFixed(1)+'" class="tx" text-anchor="middle">'+s.pos+'</text>';
  });
  return o+"</svg>";
}
function pitchLines(){
  return '<svg class="u-lines" viewBox="0 0 100 128" preserveAspectRatio="none" aria-hidden="true">'+
    '<rect x="3" y="3" width="94" height="122" rx="1.5"/><path d="M3 64h94"/><circle cx="50" cy="64" r="10.5"/><circle cx="50" cy="64" r="0.9" class="fill"/>'+
    '<rect x="24" y="3" width="52" height="17"/><rect x="38" y="3" width="24" height="6.5"/>'+
    '<rect x="24" y="108" width="52" height="17"/><rect x="38" y="118.5" width="24" height="6.5"/></svg>';
}

/* ---------- الملعب (كل لاعب في التشكيلة ينضغط عليه) ---------- */
function hideRatings(){return S.mode==="memory"&&!S.res;}
function pitch(hot,tip){
  var o='<div class="u-pitch" role="group" aria-label="Your starting XI">'+pitchLines();
  S.slots.forEach(function(s){
    var p=S.picks[s.i],isHot=hot&&hot.indexOf(s.i)>-1;
    var st='left:'+s.x.toFixed(2)+'%;top:'+s.y.toFixed(2)+'%';
    if(p){
      o+='<button type="button" class="u-slot is-filled" style="'+st+'" data-act="xi" data-i="'+s.i+'" aria-label="'+esc(p.n)+', '+s.pos+'. Details">'+
        '<span class="u-shirt" style="--c0:'+p.c[0]+';--c1:'+p.c[1]+';--tx:'+ink(p.c[0])+'">'+(hideRatings()?esc(s.pos):p.r)+'</span>'+
        '<span class="u-nm">'+esc(p.n)+'</span></button>';
    }else{
      o+='<button type="button" class="u-slot is-empty'+(isHot?' is-hot':'')+'" style="'+st+'" data-act="slot" data-i="'+s.i+'"'+
        (isHot?'':' tabindex="-1"')+' aria-label="Empty '+s.pos+' slot">'+
        '<span class="u-ring">'+s.pos+'</span></button>';
    }
  });
  return o+"</div>"+(tip?'<p class="u-tip">Tap any player for details or to change his position.</p>':"");
}

/* ---------- الشريط العلوي ---------- */
function bar(){
  var back=S.on?"oleave":S.view==="setup"?"home":"back";
  return '<header class="u-bar"><button type="button" class="u-ib" data-act="'+back+'" aria-label="'+(back==="home"?"Back to home":back==="oleave"?"Leave room":"Back to settings")+'">'+
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>'+
    '<div class="u-title"><b>EUROPE XI</b><span>Dream team · Cup winners</span></div><span class="u-ib u-ghost"></span></header>';
}

/* ---------- 1) الإعداد ---------- */
function seg(act,cur,items){
  var o='<div class="u-seg">';
  items.forEach(function(x){o+='<button type="button" class="u-seg-b'+(String(x[0])===String(cur)?' is-on':'')+'" data-act="'+act+'" data-v="'+x[0]+'">'+x[1]+'</button>';});
  return o+"</div>";
}
function trophyRoom(){
  var n=0,o="";
  ACH.forEach(function(a){
    var on=!!S.ach[a.id];if(on)n++;
    o+='<li class="'+(on?'is-on':'')+'"><i></i><div><b>'+esc(a.n)+'</b><span>'+esc(a.d)+'</span></div></li>';
  });
  var best=S.stats.best?TIER_NAME[S.stats.best]||S.stats.best.toUpperCase():"—";
  return '<details class="u-panel u-troph" open><summary><span>Trophy room</span><em>'+n+'/'+ACH.length+'</em></summary>'+
    '<div class="u-pb"><div><b>'+esc(best)+'</b><span>best finish</span></div><div><b>'+S.stats.titles+'</b><span>titles</span></div><div><b>'+S.stats.imm+'</b><span>immaculate</span></div><div><b>'+S.stats.gf+'</b><span>most goals</span></div><div><b>'+(S.stats.big||0)+'</b><span>biggest win</span></div></div>'+
    '<ul class="u-ach">'+o+'</ul></details>';
}
function compStat(id){
  var l=SEASONS.filter(function(s){return compOf(s)===id;}),a=9999,b=0;
  l.forEach(function(s){if(s.yr<a)a=s.yr;if(s.yr>b)b=s.yr;});
  return{n:l.length,a:a,b:b};
}
function cupCard(id){
  var C=COMPS[id],st=compStat(id);
  return '<div class="u-cup c-'+id+'">'+compIcon(id,42)+'<span class="u-cup-t"><b>'+C.n+'</b><small>'+st.n+(id==="ucl"?' champion + finalist seasons':' title-winning seasons')+' · '+st.a+'–'+st.b+'</small></span></div>';
}
var TABS=[["cups","Cups"],["squad","Squad"],["match","Match"],["record","Record"]];
function setupTabs(){
  var o='<nav class="u-tabs" role="tablist" aria-label="Setup">';
  TABS.forEach(function(t){o+='<button type="button" role="tab" class="u-tab t-'+t[0]+(S.tab===t[0]?' is-on':'')+'" aria-selected="'+(S.tab===t[0])+'" data-act="tab" data-v="'+t[0]+'">'+t[1]+'</button>';});
  return o+'</nav>';
}
function cupsLabel(){
  return"All 3 cups";
}
function viewSetup(){
  if(!S.tab)S.tab="cups";
  var n=pool().length,p="";
  if(S.tab==="cups"){
    var era=seg("era",S.era,[["all","All history"],["modern","Modern (1992+)"]]);
    p='<div class="u-panel"><h2 class="u-label">One draft, three cups</h2><div class="u-cups">'+cupCard("ucl")+cupCard("uel")+cupCard("uecl")+'</div>'+
      '<p class="u-hint">Every roll can land on a winner of any of the three cups, and so can every opponent. The badge on each club shows which cup it won.</p></div>'+
      '<div class="u-panel"><h2 class="u-label">Era</h2>'+era+'<p class="u-hint">'+(S.era==="modern"?"Only seasons from 1992 on, for your draft and your opponents.":"Every title-winning (and UCL finalist) season of all three cups.")+'</p></div>'+
      '<p class="u-note"><b>How ratings work.</b> A player is rated on the cup run his club won, not on his career. A Europa League star is rated against that tournament.</p>';
  }else if(S.tab==="squad"){
    var fm="";
    U.FORMATION_IDS.forEach(function(f){fm+='<button type="button" class="u-chip'+(f===S.fid?' is-on':'')+'" data-act="fid" data-v="'+f+'">'+f+'</button>';});
    var st=seg("style",S.style,U.STYLES.map(function(x){return[x,STYLE_LABEL[x]];}));
    p='<div class="u-panel"><h2 class="u-label">Formation</h2><div class="u-chips">'+fm+'</div><div class="u-mini">'+miniPitch(S.fid)+'</div></div>'+
      '<div class="u-panel"><h2 class="u-label">Playing style</h2>'+st+'<p class="u-hint">'+STYLE_DESC[S.style]+'</p></div>';
  }else if(S.tab==="match"){
    var br=seg("bracket",S.bracket,[["ladder","Classic Path"],["random","Random Bracket"]]);
    var pr=seg("pres",S.pres,[["cinematic","Cinematic"],["fast","Fast"]]);
    var mg=seg("manage",S.manage?"1":"0",[["1","Manage"],["0","Auto"]]);
    var md=seg("mode",S.mode,[["classic","Visible"],["memory","Hidden"]]);
    p='<div class="u-panel"><h2 class="u-label">Tournament</h2>'+br+
      '<p class="u-hint">'+(S.bracket==="ladder"?"Opponents get stronger every round, from the weakest 20% up to the strongest. Best for chasing Immaculate.":"Five clubs drawn from the whole pool, no order. A super team in the Last 16, a weaker side in the Final. High variance.")+'</p></div>'+
      '<div class="u-panel"><h2 class="u-label">Match experience</h2>'+pr+
      '<p class="u-hint">'+(S.pres==="cinematic"?"Match by match. Goals, cards and injuries as they happen. Skip any time.":"Instant results. No half-time decisions. Good for grinding.")+'</p>'+
      (S.pres==="cinematic"?'<h2 class="u-label u-lh2">Half-time decisions</h2>'+mg+'<p class="u-hint">'+(S.manage?"At the break you choose how to play the second half. It changes what comes next, never what already happened.":"The XI plays the second half without changes.")+'</p>':'')+'</div>'+
      '<div class="u-panel"><h2 class="u-label">Ratings</h2>'+md+'<p class="u-hint">'+(S.mode==="classic"?"Ratings are visible while you pick.":"Names and positions only. Ratings stay hidden until the cup is over.")+'</p></div>';
  }else{
    var b=S.stats.best?(TIER_RANK[S.stats.best]>=6?"★ ":"")+(TIER_NAME[S.stats.best]||S.stats.best.toUpperCase()):"—";
    p='<div class="u-record"><div><b>'+S.stats.runs+'</b><span>cups</span></div><div><b>'+S.stats.titles+'</b><span>titles</span></div><div><b>'+S.stats.flawless+'</b><span>flawless</span></div><div><b class="u-sm">'+esc(b)+'</b><span>best</span></div></div>'+
      trophyRoom()+
      '<p class="u-beta"><span>BETA</span>'+SEASONS.length+' seasons across three cups (UCL champions + finalists) · squads and ratings are provisional estimates.</p>';
  }
  return '<div class="u-hero"><div class="u-hero-r"><h1 class="u-logo">EUROPE<span>XI</span></h1><div class="u-trio">'+compIcon("ucl",26)+compIcon("uel",26)+compIcon("uecl",26)+'</div></div>'+
    '<p class="u-tag">Roll a winning club from Europe\'s cups. Pick one star. Manage the run. Win all '+U.TOTAL_MATCHES+'.</p>'+
    '<div class="u-flow"><span><b>1</b>ROLL</span><span><b>2</b>PICK</span><span><b>3</b>MANAGE</span></div></div>'+
    setupTabs()+'<div class="u-tabp" role="tabpanel">'+p+'</div>'+
    '<div class="u-dock"><p class="u-sum"><b>'+cupsLabel()+'</b><i></i>'+n+' seasons<i></i>'+S.fid+'<i></i>'+STYLE_LABEL[S.style]+'</p>'+
    '<div class="u-dock-b"><button type="button" class="u-btn u-big" data-act="start">Kick off draft</button>'+
    '<button type="button" class="u-btn u-alt u-onl" data-act="online">Play online</button></div></div>';
}

/* ---------- 2) السحب والاختيار ---------- */
function statusBar(){
  var segs="";for(var i=0;i<11;i++)segs+='<i class="'+(i<S.count?'on':'')+'"></i>';
  var pips="";for(var j=0;j<MAXRR;j++)pips+='<i class="'+(j<S.rerolls?'on':'')+(j===S.rrUsed?' is-used':'')+'"></i>';
  return '<div class="u-status"><div class="u-prog"><span>PICK <b>'+Math.min(S.count+(S.count<11?1:0),11)+'</b>/11</span><div class="u-segs">'+segs+'</div></div>'+
    '<div class="u-rr"><span>RE-ROLLS · <b>'+S.rerolls+'</b> LEFT</span><div class="u-pips">'+pips+'</div></div></div>';
}
function drawnCard(s,mode){
  var cls="u-draw"+(mode==="reveal"?" is-reveal":mode==="roll"?" is-flip":"");
  var cid=compOf(s),C=COMPS[cid];
  return '<article class="'+cls+' c-'+cid+'" style="--c0:'+s.c[0]+';--c1:'+s.c[1]+';--cc:'+C.c+';--cl:'+C.l+'"><span class="u-draw-c">'+crest(s.c,s.ab,64,cid)+'</span><div class="u-draw-t"><small>'+(mode==="roll"?"ROLLING…":"DRAWN")+'</small><b>'+esc(s.club)+'</b>'+
    '<span class="u-ssn">'+esc(s.ss)+'</span><span class="u-cp">'+compIcon(cid,16)+esc(compName(s))+(s.ru?' · FINALIST':'')+'</span><em>'+esc(s.coach)+' · Final '+esc(s.fin)+'</em></div></article>';
}
function fltBar(s){
  var o='<div class="u-flt" role="group" aria-label="Filter by position">';
  ["ALL","GK","DEF","MID","ATT"].forEach(function(f){
    var n=f==="ALL"?s.p.length:s.p.filter(function(p){return inGrp(p.pos,f);}).length;
    o+='<button type="button" class="u-fb'+(S.flt===f?' is-on':'')+'" data-act="flt" data-v="'+f+'">'+f+'<small>'+n+'</small></button>';
  });
  return o+"</div>";
}
function listRows(s){
  var pk=U.pickable(s,S.slots,S.picks,S.taken),can={};
  pk.forEach(function(x){can[x.p.n]=x;});
  var rows=s.p.filter(function(p){return inGrp(p.pos,S.flt);}).sort(function(a,b){
    var da=POSORD.indexOf(a.pos),db=POSORD.indexOf(b.pos);
    return da-db||b.r-a.r;
  });
  var o="";
  rows.forEach(function(p){
    var x=can[p.n],ok=!!x,why=S.taken[p.n]?"IN YOUR XI":"NO FREE SLOT";
    var isSel=S.sel&&S.sel.n===p.n,fit="";
    if(ok){
      var nat=false,alt="";
      x.slots.forEach(function(i){var k=U.fitKind(S.slots[i].pos,p);if(k===2)nat=true;else if(!alt)alt=S.slots[i].pos;});
      fit=nat?'<em class="u-fit f-main">MAIN</em>':'<em class="u-fit f-alt">AS '+alt+'</em>';
    }
    o+='<button type="button" class="u-row'+(ok?'':' is-dis')+(isSel?' is-sel':'')+'" data-act="pick" data-n="'+esc(p.n)+'"'+(ok?'':' disabled')+'>'+
      '<span class="u-pos">'+p.pos+'</span><span class="u-pn">'+esc(p.n)+(p.alt?'<small>'+p.alt+'</small>':'')+'</span>'+fit+
      (ok?(S.mode==="classic"?'<span class="u-r '+rc(p.r)+'">'+(p.r>=93?'★ ':'')+p.r+'</span>':'<span class="u-r u-q">??</span>'):'<span class="u-why">'+why+'</span>')+'</button>';
  });
  if(!o)o='<p class="u-none u-pad">No players in this group.</p>';
  return '<div class="u-list" role="list">'+o+'</div>';
}
function viewDraft(){
  var o=statusBar(),hot=null;
  if(S.rolling){
    o+='<div class="u-drawbox is-rolling" id="uRoll">'+(S.cur?drawnCard(S.cur,"roll"):'')+'</div>';
  }else if(S.phase==="drawn"&&S.cur&&S.revealing){
    o+='<div class="u-drawbox">'+drawnCard(S.cur,"reveal")+'</div><p class="u-wait"><i></i><i></i><i></i></p>';
  }else if(S.phase==="drawn"&&S.cur){
    var alts=U.seasonAlternatives(pool(),S.cur,S.used,S.slots,S.picks,S.taken).length;
    var noRR=S.rerolls<1;
    o+='<div class="u-drawbox">'+drawnCard(S.cur)+'</div>'+
      '<div class="u-rrow"><button type="button" class="u-btn u-alt" data-act="rr-team"'+(noRR?' disabled':'')+'>↻ Other club</button>'+
      '<button type="button" class="u-btn u-alt" data-act="rr-season"'+(noRR||!alts?' disabled':'')+'>↻ Other season</button></div>'+
      '<h2 class="u-label u-lh">Pick one player</h2>'+fltBar(S.cur)+listRows(S.cur);
    if(S.sel)hot=S.sel.slots;
  }else{
    o+='<div class="u-drawbox is-empty"><p>Roll to draw a winning club and the season it lifted the cup.</p></div>'+
      '<button type="button" class="u-btn u-big u-roll" data-act="roll">'+dieSvg()+' Roll</button>';
  }
  o+='<h2 class="u-label u-lh">Your XI · '+S.fid+' · '+STYLE_LABEL[S.style]+'</h2>'+pitch(hot,S.count>0);
  return o;
}

/* ---------- 3) جاهز للمحاكاة ---------- */
function bars(t,hide){
  function row(l,v){return '<div class="u-bar-r"><span>'+l+'</span><div class="u-meter"><i style="width:'+(hide?0:Math.max(0,Math.min(100,(v-60)*100/40)))+'%"></i></div><b>'+(hide?'??':Math.round(v))+'</b></div>';}
  return '<div class="u-bars">'+row("ATT",t.A)+row("DEF",t.D)+row("OVR",t.ovr)+'</div>';
}
function setupLine(){
  return '<ul class="u-chipline"><li>'+S.fid+'</li><li>'+STYLE_LABEL[S.style]+'</li><li>'+(S.bracket==="ladder"?"Classic Path":"Random Bracket")+'</li>'+
    (S.era==="modern"?'<li>Modern era</li>':'')+'<li>'+(S.pres==="fast"?"Fast":S.manage?"Cinematic · Manage":"Cinematic · Auto")+'</li></ul>';
}
function viewReady(){
  var t=U.makeTeam(S.slots,S.picks,S.style),hide=S.mode==="memory";
  if(S.on)return'<div class="u-ready"><h2 class="u-label">Squad complete</h2><p class="u-big-t">Lock in your '+S.fid+'</p></div>'+onLine()+
    pitch(null,true)+'<div class="u-panel">'+bars(t,hide)+(hide?'<p class="u-hint">Ratings are revealed after the match.</p>':'')+'</div>'+
    '<p class="u-hint u-c">Once you lock in, your XI is final. Your opponent sees it when the match starts.</p>'+
    '<button type="button" class="u-btn u-big" data-act="olock">Lock in XI</button>'+
    '<button type="button" class="u-btn u-alt u-wide" data-act="again">Redo draft</button>';
  return '<div class="u-ready"><h2 class="u-label">Squad complete</h2><p class="u-big-t">Your '+S.fid+' is ready</p></div>'+setupLine()+
    pitch(null,true)+'<div class="u-panel">'+bars(t,hide)+(hide?'<p class="u-hint">Ratings are revealed after the cup.</p>':'')+'</div>'+
    '<button type="button" class="u-btn u-big" data-act="sim">Play the knockout</button>'+
    '<button type="button" class="u-btn u-alt u-wide" data-act="again">Redo draft</button>';
}

/* ---------- 4) البطولة ---------- */
function evGood(e){
  if(e.t==="goal"||e.t==="og"||e.t==="gk"||e.t==="pen")return e.us===1;
  if(e.t==="red"||e.t==="pen-miss")return e.us===0;
  return null;
}
function evLi(e,opp){
  var g=evGood(e),cls=g===null?(e.t==="inj"?"bad":"mid"):g?"good":"bad",tag="",txt="";
  switch(e.t){
    case"goal":txt=esc(e.n)+(e.pen?" (pen)":"");tag=e.w?"WONDER GOAL":"";break;
    case"og":txt=esc(e.n)+" (og)";tag="OWN GOAL";break;
    case"red":txt=esc(e.n)+" sent off";tag="RED CARD";break;
    case"inj":txt=esc(e.n)+" goes off hurt";tag="INJURY";break;
    case"gk":txt=esc(e.n)+(e.us?" keeps you in it":" denies you");tag="KEEPER";break;
    case"pen":txt=esc(e.n)+" steps up";tag="PENALTY";break;
    case"pen-miss":txt=esc(e.n)+" fails, "+esc(e.gk)+" saves";tag="MISSED";break;
    case"late":txt="End-to-end finish. Goals more likely.";tag="LATE DRAMA";break;
  }
  var side=(e.us===0&&(e.t==="goal"||e.t==="og"||e.t==="pen"||e.t==="pen-miss"||e.t==="gk"))?'<em>'+esc(opp.ab)+'</em>':'';
  return '<li class="'+cls+' k-'+e.t+'"><span>'+e.min+'′</span><i></i>'+(tag?'<u>'+tag+'</u>':'')+'<b>'+txt+'</b>'+side+'</li>';
}
function legEvents(tie,k){
  var m=tie.legs[k],ev=m.ev.slice();
  if(k===tie.legs.length-1&&tie.et)ev=ev.concat(tie.et.ev);
  return ev;
}
function goalLines(tie,opp){
  var o="";
  tie.legs.forEach(function(m,k){
    var ev=legEvents(tie,k);
    o+='<div class="u-gl"><h4>'+(tie.legs.length>1?(k?"2nd leg":"1st leg"):"Final")+' · '+m.us+'–'+m.them+(m.ht?' <small>HT '+m.ht.us+'–'+m.ht.them+'</small>':'')+'</h4>';
    if(m.decision)o+='<p class="u-dec">Half-time: '+esc(m.decision.name)+(m.decision.key?' · focus on '+esc(m.decision.key):'')+'</p>';
    if(!ev.length)o+='<p class="u-none">No goals, no drama</p>';
    else{o+='<ul>';ev.forEach(function(e){o+=evLi(e,opp);});o+='</ul>';}
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
    '<div class="u-side">'+crest(opp.c,opp.ab,44,compOf(opp))+'<b>'+esc(opp.club)+'</b><small>'+compTag(compOf(opp))+esc(opp.ss)+(S.mode==="memory"&&!S.res?'':' · '+Math.round(opp.O))+'</small></div></div>'+
    '<ul class="u-legs">'+legs+'</ul>'+(note?'<p class="u-tnote">'+note+'</p>':'')+
    '<details class="u-goals"><summary>Match report</summary>'+goalLines(t,opp)+'</details>'+
    '<footer class="u-res">'+(win?'<span>▶ THROUGH</span>':'<span>✖ ELIMINATED</span>')+'</footer></article>';
}
/* شريط مسار البطولة */
function tracker(){
  var o='<ol class="u-track" aria-label="Tournament path">';
  STAGES.forEach(function(st,i){
    var done=S.stages[i],cls="";
    if(done)cls=done.tie.adv?"is-won":"is-lost";
    else if(i===S.reveal&&!S.res)cls="is-now";
    var opp=S.cup&&S.cup.ladder?S.cup.ladder[i]:(S.res&&S.res.stages[i]?S.res.stages[i].opp:null);
    o+='<li class="'+cls+'"><i>'+(done?(done.tie.adv?'✓':'✕'):i+1)+'</i><b>'+st.short+'</b>'+(opp?'<span>'+esc(opp.ab)+'</span>':'')+'</li>';
  });
  return o+'</ol>';
}
function tallyGoals(){
  var g={};
  S.stages.forEach(function(r){
    r.tie.legs.forEach(function(m){m.ev.forEach(function(e){if(e.t==="goal"&&e.us===1)g[e.n]=(g[e.n]||0)+1;});});
    if(r.tie.et)r.tie.et.ev.forEach(function(e){if(e.t==="goal"&&e.us===1)g[e.n]=(g[e.n]||0)+1;});
  });
  var max=0,names=[];
  Object.keys(g).forEach(function(n){if(g[n]>max){max=g[n];names=[n];}else if(g[n]===max)names.push(n);});
  return{g:g,max:max,boot:names};
}
function bestPlayer(T){
  var best=null,sc=-1;
  S.slots.forEach(function(s){var p=S.picks[s.i];if(!p)return;var v=(T.g[p.n]||0)*100+p.r;if(v>sc){sc=v;best={p:p,g:T.g[p.n]||0,pos:s.pos};}});
  return best;
}
function verdict(){
  var r=S.res,tm=S.team,tr=r.tier,T=tallyGoals(),F=S.fin||{},path="";
  r.stages.forEach(function(st){
    var t=st.tie,two=st.stage.legs>1,sc=two?t.aggUs+'–'+t.aggThem:t.legs[0].us+(t.et?'+'+t.et.us:'')+'–'+t.legs[0].them+(t.et?'+'+t.et.them:'');
    path+='<li class="'+(t.adv?'w':'l')+'">'+crest(st.opp.c,st.opp.ab,26,compOf(st.opp))+'<div><b>'+esc(st.opp.club)+'</b><small>'+st.stage.short+' · '+compTag(compOf(st.opp))+esc(st.opp.ss)+'</small></div>'+
      '<strong>'+sc+'</strong><em>'+(t.pens?'PENS':t.et?'AET':t.adv?'W':'L')+'</em></li>';
  });
  var bp=bestPlayer(T);
  var bpHtml=bp?'<div class="u-bp"><span class="u-shirt" style="--c0:'+bp.p.c[0]+';--c1:'+bp.p.c[1]+';--tx:'+ink(bp.p.c[0])+'">'+bp.p.r+'</span><div><small>BEST PLAYER OF THE RUN</small><b>'+esc(bp.p.n)+'</b><span>'+esc(bp.p.ab)+' '+esc(bp.p.ss)+' · '+(bp.g?bp.g+(bp.g===1?' goal':' goals'):bp.pos)+'</span></div></div>':'';
  var boot=T.max?'<div class="u-boot"><small>GOLDEN BOOT</small><b>'+T.boot.map(function(n){return esc(n.toUpperCase())+' '+T.max;}).join(' · ')+'</b></div>':'';
  var pb='';
  if(F.newBest)pb='<p class="u-pbn is-new">★ New personal best</p>';
  else if(F.prevBest)pb='<p class="u-pbn">Personal best: '+esc(TIER_NAME[F.prevBest]||F.prevBest.toUpperCase())+'</p>';
  var ach='';
  if(F.newAch&&F.newAch.length){
    ach='<div class="u-panel u-newach"><h2 class="u-label">Achievement unlocked</h2><ul class="u-ach">';
    F.newAch.forEach(function(a){ach+='<li class="is-on"><i></i><div><b>'+esc(a.n)+'</b><span>'+esc(a.d)+'</span></div></li>';});
    ach+='</ul></div>';
  }
  return '<div class="u-verdict t-'+tr.id+'"><small>FINAL VERDICT</small>'+medal(tr.id)+starsRow(TIER_STARS[tr.id]||0,TIER_RANK[tr.id]>=8)+
    '<h2>'+esc(tr.label)+'</h2><p>'+esc(tr.sub)+'</p>'+pb+
    '<div class="u-rec"><small>RECORD</small><strong>'+r.wins+'–'+r.losses+'</strong><span>'+r.wins+' won · '+r.draws+' drawn · '+r.losses+' lost</span></div>'+
    '<div class="u-vstats"><div><b>'+r.scored+'</b><span>goals for</span></div><div><b>'+r.conceded+'</b><span>against</span></div><div><b>'+Math.round(tm.ovr)+'</b><span>overall</span></div><div><b>'+r.played+'</b><span>matches</span></div></div>'+
    bpHtml+boot+'</div>'+ach+
    '<div class="u-panel"><h2 class="u-label">Your path</h2><ul class="u-path">'+path+'</ul></div>'+
    '<div class="u-rrow"><button type="button" class="u-btn u-alt" data-act="squad">View full squad</button><button type="button" class="u-btn u-alt" data-act="card">Share card</button></div>'+
    '<div class="u-panel u-mt"><h2 class="u-label">Team strength</h2>'+bars(tm,false)+'</div>'+
    '<button type="button" class="u-btn u-big" data-act="again">Play again</button>'+
    '<div class="u-rrow"><button type="button" class="u-btn u-alt" data-act="replay">↻ Run it back</button><button type="button" class="u-btn u-alt" data-act="back">Try another formation</button></div>'+
    '<button type="button" class="u-btn u-ghostb u-wide" data-act="home">Back to home</button>';
}

/* ---------- المباراة اللايف ---------- */
function liveEv(L){return L.etTie?L.m.ev.concat(L.etTie.et.ev):L.m?L.m.ev:[];}
function liveScore(L,min){
  var u=0,th=0;
  liveEv(L).forEach(function(e){if(e.min<=min&&(e.t==="goal"||e.t==="og")){if(e.us)u++;else th++;}});
  return[u,th];
}
function clockTxt(min,L){return L&&L.state==="ht"?"HALF-TIME":min>90?"ET "+min+"′":min+"′";}
function feedHtml(L,min,opp){
  var o="";
  liveEv(L).forEach(function(e){if(e.min<=min)o+=evLi(e,opp);});
  return o;
}
function priorAgg(L){
  var pu=0,pt=0;S.tieLegs.forEach(function(m){pu+=m.us;pt+=m.them;});
  return[pu,pt];
}
function htPanel(L){
  var m=L.m,h=U.htOptions(m),D=L.dec||{opt:"stay",key:null};
  var head=h.ctx==="trailing"?"You're behind":h.ctx==="leading"?"You're in front":"All square";
  var sub=h.two?'Aggregate '+(S.tieLegs.reduce(function(a,x){return a+x.us;},0)+m.us)+'–'+(S.tieLegs.reduce(function(a,x){return a+x.them;},0)+m.them):'Score '+m.us+'–'+m.them;
  var o='<div class="u-ht"><div class="u-ht-h"><small>HALF-TIME DECISION</small><b>'+head+'</b><span>'+sub+'</span></div><div class="u-opts">';
  h.opts.forEach(function(x){
    o+='<button type="button" class="u-opt'+(D.opt===x.id?' is-on':'')+'" data-act="dec" data-v="'+x.id+'"><b>'+esc(x.name)+'</b><span>'+esc(x.note)+'</span></button>';
  });
  o+='</div><h3 class="u-label u-lh3">Look for</h3><div class="u-keys">'+
    '<button type="button" class="u-key'+(!D.key?' is-on':'')+'" data-act="key" data-v="">Nobody</button>';
  h.keys.forEach(function(p){o+='<button type="button" class="u-key'+(D.key===p.n?' is-on':'')+'" data-act="key" data-v="'+esc(p.n)+'">'+esc(p.n)+'</button>';});
  o+='</div><p class="u-hint">The decision shifts what happens in the next 45 minutes. The first half stays as it was.</p>'+
    '<button type="button" class="u-btn u-play2" data-act="resume">▶ Start second half</button></div>';
  return o;
}
function liveCard(){
  var L=S.live,r=STAGES[L.si],opp=(S.cup&&S.cup.ladder?S.cup.ladder[L.si]:null),two=r.legs>1,
      wait=L.state==="wait",ht=L.state==="ht",sc=L.m?liveScore(L,L.min):[0,0],pg=priorAgg(L),prev="",j;
  for(j=0;j<S.tieLegs.length;j++){var mm=S.tieLegs[j];prev+='<li><span>'+(j?'2ND LEG':'1ST LEG')+'</span><b>'+mm.us+' – '+mm.them+'</b></li>';}
  var legName=two?(L.k?'2ND LEG':'1ST LEG'):'THE FINAL';
  var clk=wait?'KICK-OFF':L.state==="pens"?'PENALTIES':clockTxt(L.min,L);
  return '<article class="u-tie u-live'+(wait?' is-wait':'')+(ht?' is-ht':'')+'" id="uLive"><header><b>'+esc(r.name)+'</b><span>'+legName+'</span></header>'+
    '<div class="u-vs"><div class="u-side">'+XI_CREST+'<b>YOUR XI</b><small>'+S.fid+'</small></div>'+
    '<div class="u-led" id="uLed"><strong id="uSc">'+sc[0]+'–'+sc[1]+'</strong><small id="uClk">'+clk+'</small></div>'+
    '<div class="u-side">'+crest(opp.c,opp.ab,44,compOf(opp))+'<b>'+esc(opp.club)+'</b><small>'+compTag(compOf(opp))+esc(opp.ss)+(S.mode==="memory"?'':' · '+Math.round(opp.O))+'</small></div></div>'+
    (two&&L.k?'<p class="u-agg" id="uAgg">AGG '+(pg[0]+sc[0])+'–'+(pg[1]+sc[1])+'</p>':'')+
    (prev?'<ul class="u-legs">'+prev+'</ul>':'')+
    (L.state==="pens"&&L.etTie&&L.etTie.pens?'<p class="u-tnote"><span>Penalties '+L.etTie.pens.us+'–'+L.etTie.pens.them+'</span></p>':'')+
    '<ul class="u-feed" id="uFeed">'+(L.m?feedHtml(L,L.min,opp):'')+'</ul>'+
    (wait?'<button type="button" class="u-btn u-play" data-act="kick">▶ Kick off '+(two?(L.k?'2nd leg':'1st leg'):'the final')+'</button>':'')+
    (ht?htPanel(L):'')+'</article>';
}
function controls(){
  function sp(v,l){return '<button type="button" class="u-seg-b'+(S.speed===v?' is-on':'')+'" data-act="speed" data-v="'+v+'">'+l+'</button>';}
  return '<div class="u-ctl"><div class="u-seg"><button type="button" class="u-seg-b'+(!S.auto?' is-on':'')+'" data-act="auto" data-v="0">Tap to kick off</button>'+
    '<button type="button" class="u-seg-b'+(S.auto?' is-on':'')+'" data-act="auto" data-v="1">Auto kick-off</button></div>'+
    '<div class="u-seg u-seg2"><button type="button" class="u-seg-b'+(S.manage?' is-on':'')+'" data-act="manage" data-v="1">Manage HT</button>'+
    '<button type="button" class="u-seg-b'+(!S.manage?' is-on':'')+'" data-act="manage" data-v="0">Auto HT</button></div>'+
    '<div class="u-seg u-spd">'+sp("normal","Normal")+sp("fast","Fast")+sp("ultra","Ultra")+'</div></div>';
}
function xiPanel(){
  if(!S.live||S.live.state!=="wait"&&S.live.state!=="ht")return "";
  var can=S.live.state==="wait";
  return '<div class="u-panel u-xipan"><button type="button" class="u-xit" data-act="xitog"><span>Your XI · '+S.fid+'</span><em>'+(S.xiOpen?'Hide':can?'Tap to manage':'View')+'</em></button>'+
    (S.xiOpen?pitch(null,true):'')+'</div>';
}
function viewSim(){
  var over=!!S.res&&!S.live;
  var o='<div class="u-board"><small>KNOCKOUT STAGE · '+(S.bracket==="ladder"?'CLASSIC PATH':'RANDOM BRACKET')+'</small><b>'+(over?(S.res.champion?'CHAMPIONS':'OUT'):'MATCHDAY')+'</b>'+tracker()+'</div>';
  if(!over&&S.pres==="cinematic")o+=controls();
  for(var i=0;i<S.stages.length;i++)o+=tieCard(S.stages[i]);
  if(S.live){
    o+=liveCard()+xiPanel();
    o+='<div class="u-rrow u-skips"><button type="button" class="u-btn u-ghostb" data-act="skipm">Skip match</button><button type="button" class="u-btn u-ghostb" data-act="skip">Skip to result</button></div>';
  }else if(over)o+=verdict();
  return o;
}

/* ---------- نافذة تفاصيل اللاعب / التشكيلة ---------- */
function canMoveNow(){return S.view==="draft"||S.view==="ready"||(S.view==="sim"&&S.live&&S.live.state==="wait"&&!S.res);}
function teamIfMoved(i,rl){
  var pk={},k;for(k in S.picks)pk[k]=S.picks[k];
  var p=pk[i];
  if(rl.kind==="move"){pk[rl.j]=p;delete pk[i];}else{var q=pk[rl.j];pk[rl.j]=p;pk[i]=q;}
  return U.makeTeam(S.slots,pk,S.style);
}
function playerSheet(i){
  var p=S.picks[i],slot=S.slots[i];
  if(!p)return"";
  var hide=hideRatings(),movable=canMoveNow(),rls=U.relocations(S.slots,S.picks,i);
  var full=S.count>=11&&(S.view==="ready"||S.view==="sim");
  var base=full?U.makeTeam(S.slots,S.picks,S.style):null;
  var T=S.res?tallyGoals():null,gl=T&&T.g[p.n]?T.g[p.n]:0;
  var natural=U.fitKind(slot.pos,p)===2;
  var wa=Math.round(U.WATT[slot.pos]*100),wd=Math.round(U.WDEF[slot.pos]*100);
  var o='<div class="u-sheet" data-act="sheet-x"><div class="u-sheet-card" role="dialog" aria-label="'+esc(p.n)+'"><button type="button" class="u-sx" data-act="sheet-x" aria-label="Close">✕</button>'+
    '<div class="u-sh-h"><span class="u-shirt u-shirt-l" style="--c0:'+p.c[0]+';--c1:'+p.c[1]+';--tx:'+ink(p.c[0])+'">'+(hide?esc(slot.pos):p.r)+'</span>'+
    '<div><b>'+esc(p.n)+'</b><span>'+esc(p.club)+' · '+esc(p.ss)+'</span></div></div>'+
    '<ul class="u-sh-g"><li><small>PLAYING AS</small><b>'+slot.pos+'</b><em class="u-fit '+(natural?'f-main':'f-alt')+'">'+(natural?'NATURAL':'ALT ROLE')+'</em></li>'+
    '<li><small>NATURAL</small><b>'+p.pos+'</b></li><li><small>ALT</small><b>'+(p.alt||'—')+'</b></li>'+
    '<li><small>RATING</small><b class="'+(hide?'':rc(p.r))+'">'+(hide?'??':p.r)+'</b></li></ul>'+
    '<div class="u-sh-b"><div class="u-bar-r"><span>ATT</span><div class="u-meter"><i style="width:'+wa+'%"></i></div><b>'+wa+'%</b></div>'+
    '<div class="u-bar-r"><span>DEF</span><div class="u-meter"><i style="width:'+wd+'%"></i></div><b>'+wd+'%</b></div></div>'+
    '<p class="u-hint">How much this slot counts toward your team ATT and DEF.</p>'+
    (S.res?'<p class="u-sh-gl">'+(gl?gl+(gl===1?' goal':' goals')+' this cup':'No goals this cup')+'</p>':'');
  o+='<h3 class="u-label u-lh3">Position</h3>';
  if(!rls.length){
    o+='<p class="u-hint">No other position is available. He can only play '+p.pos+(p.alt?' or '+p.alt:'')+', and every other slot for those roles is taken or not in this formation.</p>';
  }else if(!movable){
    o+='<p class="u-hint">Positions are locked while a match is on. Change them before kick-off.</p>';
  }else{
    o+='<div class="u-mv">';
    rls.forEach(function(rl){
      var tgt=S.slots[rl.j],lab=rl.kind==="move"?'Move to <b>'+tgt.pos+'</b>':'Swap with <b>'+esc(rl.with)+'</b> <small>('+tgt.pos+')</small>';
      var d="";
      if(full&&!hide){var t2=teamIfMoved(i,rl);d='<em class="u-dl">ATT '+sgn(t2.A-base.A)+' · DEF '+sgn(t2.D-base.D)+'</em>';}
      o+='<button type="button" class="u-mvb" data-act="move" data-i="'+i+'" data-j="'+rl.j+'"><span>'+lab+'</span>'+d+'<em class="u-fit '+(rl.fit===2?'f-main':'f-alt')+'">'+(rl.fit===2?'NATURAL':'ALT ROLE')+'</em></button>';
    });
    o+='</div>';
  }
  return o+'</div></div>';
}
function squadSheet(){
  var T=S.res?tallyGoals():null,xi="";
  S.slots.forEach(function(s){var p=S.picks[s.i];if(p){var gl=T&&T.g[p.n]||0;
    xi+='<li><span class="u-pos">'+s.pos+'</span><b>'+esc(p.n)+'</b><em>'+esc(p.ab)+' '+esc(p.ss)+compTag(p.cp)+'</em>'+(gl?'<u>'+gl+' ⚽</u>':'')+'<i class="'+rc(p.r)+'">'+(hideRatings()?'??':p.r)+'</i></li>';}});
  return '<div class="u-sheet" data-act="sheet-x"><div class="u-sheet-card" role="dialog" aria-label="Full squad"><button type="button" class="u-sx" data-act="sheet-x" aria-label="Close">✕</button>'+
    '<h3 class="u-label">Your XI · '+S.fid+' · '+STYLE_LABEL[S.style]+'</h3><ul class="u-xi">'+xi+'</ul></div></div>';
}
function sheetHtml(){
  if(!S.sheet)return"";
  if(S.sheet.squad)return squadSheet();
  var h=playerSheet(S.sheet.i);
  if(!h)S.sheet=null;
  return h;
}

/* ---------- الرسم ---------- */
function render(keepScroll){
  var y=getY(),h;
  if(S.view==="setup")h=viewSetup();
  else if(S.view==="draft")h=viewDraft();
  else if(S.view==="ready")h=viewReady();
  else if(S.view==="osetup")h=viewOSetup();
  else if(S.view==="owait")h=viewOWait();
  else if(S.view==="omatch")h=viewOMatch();
  else h=viewSim();
  root.className="u-mode-"+S.view+(S.mode==="memory"?" is-memory":"")+(S.sheet?" has-sheet":"");
  root.innerHTML=bar()+'<main class="u-main">'+h+'</main>'+sheetHtml();
  if(keepScroll)setY(y);
}

/* ---------- الأفعال ---------- */
function resetDraft(){
  clearTimers();
  S.slots=U.slotsFor(S.fid);S.picks={};S.taken={};S.used={};S.count=0;
  S.cur=null;S.phase="idle";S.rolling=false;S.revealing=false;S.rerolls=MAXRR;S.rrUsed=-1;S.sel=null;S.flt="ALL";S.sheet=null;
  S.team=null;S.res=null;S.cup=null;S.stages=[];S.tieLegs=[];S.reveal=0;S.counted=false;S.live=null;S.xiOpen=false;S.fin=null;
}
function startDraft(){click();resetDraft();S.view="draft";if(!S.on)saveSettings();render();toTop();}

function doRoll(kind){
  if(S.rolling||S.revealing)return;
  var P=pool(),next;
  if(kind==="draw")next=U.drawSeason(rnd,P,S.used,S.slots,S.picks,S.taken);
  else{
    if(S.rerolls<1||!S.cur)return;
    next=kind==="team"?U.rerollTeam(rnd,P,S.cur,S.used,S.slots,S.picks,S.taken):U.rerollSeason(rnd,P,S.cur,S.used,S.slots,S.picks,S.taken);
    if(!next){say("No other option available");return;}
  }
  if(!next){say("No squad can fill your open slots");return;}
  click();
  if(kind!=="draw"){S.rerolls--;S.rrUsed=S.rerolls;say("Re-roll used · "+S.rerolls+" left");}
  S.rolling=true;S.sel=null;S.flt="ALL";
  S.cur=P[Math.floor(rnd()*P.length)];
  S.phase="drawn";
  render();
  var box=document.getElementById("uRoll"),n=0;
  var iv=setInterval(function(){
    n++;
    var f=P[Math.floor(rnd()*P.length)];
    if(box)box.innerHTML=drawnCard(f,"roll");
    if(n>=13){
      clearInterval(iv);
      S.cur=next;S.used[next.id]=1;S.rolling=false;S.revealing=true;S.phase="drawn";
      render();toTop();
      later(function(){S.revealing=false;S.rrUsed=-1;render();},1500);
    }
  },70);
  S.timers.push(iv);
}

function place(p,slotIdx){
  var s=S.cur;
  S.picks[slotIdx]={n:p.n,r:p.r,pos:p.pos,alt:p.alt,c:s.c,ab:s.ab,ss:s.ss,club:s.club,cp:compOf(s)};
  S.taken[p.n]=1;S.count++;S.cur=null;S.phase="idle";S.sel=null;
  click();
  if(S.count>=11){S.view="ready";render();toTop();return;}
  render();toTop();
}
function doPick(name){
  if(S.rolling||S.revealing||!S.cur)return;
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
/* تغيير مركز لاعب (مسموح بس لمركزه الأساسي أو البديل) */
function doMove(i,j){
  var ok=U.relocations(S.slots,S.picks,i).filter(function(r){return r.j===j;})[0];
  if(!ok||!canMoveNow())return;
  var p=S.picks[i];
  if(ok.kind==="move"){S.picks[j]=p;delete S.picks[i];}
  else{var q=S.picks[j];S.picks[j]=p;S.picks[i]=q;}
  S.sel=null;click();
  if(S.view==="sim"&&S.live)S.team=U.makeTeam(S.slots,S.picks,S.style);
  S.sheet={i:j};
  say(ok.kind==="move"?p.n+" → "+S.slots[j].pos:p.n+" ⇄ "+ok.with);
  render(true);
}
/* معاينة حية: لاعب في القائمة ← الخانات اللي ينفع يملاها */
function previewFor(name){
  clearPreview();
  if(!S.cur||S.rolling||S.revealing)return;
  var pk=U.pickable(S.cur,S.slots,S.picks,S.taken),hit=null;
  pk.forEach(function(x){if(x.p.n===name)hit=x;});
  if(!hit)return;
  hit.slots.forEach(function(i){
    var el=root.querySelector('.u-slot[data-i="'+i+'"]');
    if(el)el.classList.add(U.fitKind(S.slots[i].pos,hit.p)===2?"is-prev":"is-prev-alt");
  });
}
function clearPreview(){
  var a=root.querySelectorAll(".is-prev,.is-prev-alt");
  for(var i=0;i<a.length;i++)a[i].classList.remove("is-prev","is-prev-alt");
}

/* ---------- المحاكاة ---------- */
function msTick(){return{normal:85,fast:30,ultra:7}[S.speed]||85;}
function msGoal(){return{normal:700,fast:260,ultra:50}[S.speed]||700;}
function startSim(seed){
  clearTimers();
  S.team=U.makeTeam(S.slots,S.picks,S.style);
  S.cup=U.createCup(S.team,seed||newSeed(),pool(),{bracket:S.bracket});
  S.stages=[];S.tieLegs=[];S.reveal=0;S.res=null;S.live=null;S.counted=false;S.sheet=null;S.fin=null;S.xiOpen=false;
  S.view="sim";
  if(S.pres==="fast"){
    var r=U.runCup(S.team,S.cup.seed,pool(),{bracket:S.bracket});
    S.res=r;S.stages=r.stages;S.reveal=r.stages.length;
    finish(true);return;
  }
  render();toTop();
  nextMatch();
}
function doSim(){click();startSim();}
function doRerun(){click();startSim();}  /* نفس التشكيلة، بطولة جديدة */
function nextMatch(){
  clearTimers();
  S.live={si:S.reveal,k:S.tieLegs.length,min:0,state:"wait",m:null,h2:false,dec:null};
  render(true);
  if(S.auto)later(startLeg,S.reveal===0?900:700);
}
function startLeg(){
  var L=S.live;
  if(!L||L.state!=="wait"||S.view!=="sim")return;
  beginNow();
  render(true);
  later(tick,msTick());
}
function beginNow(){
  var L=S.live,pg=priorAgg(L);
  S.team=U.makeTeam(S.slots,S.picks,S.style);S.cup.team=S.team;
  L.m=U.beginLeg(S.cup,L.si,L.k,{us:pg[0],them:pg[1]});
  L.state="play";L.min=0;L.h2=false;
}
function secondHalf(dec){
  var L=S.live;if(!L||L.h2)return;
  U.finishLeg(S.cup,L.m,dec||null);L.h2=true;
}
function tick(){
  var L=S.live;
  if(S.view!=="sim"||!L||(L.state!=="play"&&L.state!=="et"))return;
  var opp=S.cup.ladder[L.si];
  L.min++;
  var evs=liveEv(L),hit=evs.filter(function(e){return e.min===L.min;}),sc=liveScore(L,L.min);
  var clk=document.getElementById("uClk"),scr=document.getElementById("uSc"),fd=document.getElementById("uFeed"),led=document.getElementById("uLed"),ag=document.getElementById("uAgg");
  if(clk)clk.textContent=clockTxt(L.min,L);
  if(scr)scr.textContent=sc[0]+"–"+sc[1];
  if(fd)fd.innerHTML=feedHtml(L,L.min,opp);
  if(ag){var pg=priorAgg(L);ag.textContent="AGG "+(pg[0]+sc[0])+"–"+(pg[1]+sc[1]);}
  var gl=hit.filter(function(e){return e.t==="goal"||e.t==="og";});
  if(gl.length&&led){
    led.classList.remove("is-g","is-c");void led.offsetWidth;
    led.classList.add(gl.some(function(e){return e.us;})?"is-g":"is-c");
  }else if(hit.some(function(e){return e.t==="red"||e.t==="pen"||e.t==="inj";})&&led){
    led.classList.remove("is-g","is-c","is-e");void led.offsetWidth;led.classList.add("is-e");
  }
  /* بين الشوطين */
  if(L.state==="play"&&L.min===45&&!L.h2){
    if(S.pres==="cinematic"&&S.manage){
      L.state="ht";L.dec={opt:"stay",key:null};render(true);return;
    }
    if(clk)clk.textContent="HALF-TIME";
    later(function(){secondHalf(null);tick();},msGoal()+300);return;
  }
  var pause=(hit.length?msGoal():0);
  if(L.state==="play"&&L.min>=90){later(endLeg,msGoal()+200);return;}
  if(L.state==="et"&&L.min>=120){later(endEt,msGoal()+200);return;}
  later(tick,msTick()+pause);
}
function resume(){
  var L=S.live;if(!L||L.state!=="ht")return;
  click();
  secondHalf(L.dec);
  L.state="play";
  render(true);
  later(tick,msGoal());
}
function pushTie(tie,si){
  S.stages.push({stage:STAGES[si],opp:S.cup.ladder[si],tie:tie});
  S.reveal=S.stages.length;S.tieLegs=[];
  return tie.adv;
}
function endLeg(){
  var L=S.live;if(!L||S.view!=="sim")return;
  var si=L.si;
  S.tieLegs.push(L.m);
  if(S.tieLegs.length<STAGES[si].legs){
    S.live={si:si,k:L.k+1,min:0,state:"wait",m:null,h2:false,dec:null};
    render(true);if(S.auto)later(startLeg,msGoal()+500);return;
  }
  var tie=U.settleTie(S.cup,si,S.tieLegs);
  if(tie.et){
    S.live={si:si,k:L.k,min:90,state:"et",m:L.m,h2:true,etTie:tie};
    render(true);later(tick,msTick()+300);return;
  }
  concludeTie(tie,si);
}
function endEt(){
  var L=S.live;if(!L||!L.etTie)return;
  if(L.etTie.pens){L.state="pens";render(true);later(function(){concludeTie(L.etTie,L.si);},msGoal()*2+900);return;}
  concludeTie(L.etTie,L.si);
}
function concludeTie(tie,si){
  var adv=pushTie(tie,si);
  S.live=null;
  if(!adv){finishCup(false,si);return;}
  if(si===STAGES.length-1){finishCup(true,-1);return;}
  render(true);
  nextMatch();
}
function finishCup(champion,outAt){
  S.res=U.finishCup(S.cup,S.stages,champion,outAt);
  finish();
}
/* نتيجة نهائية + إحصاءات + إنجازات (مرة واحدة بس) */
function finish(){
  if(!S.counted){
    S.counted=true;
    var r=S.res,t=r.tier,f=runFacts(),prev=S.stats.best,newBest=(TIER_RANK[t.id]||0)>(TIER_RANK[prev]||0)&&S.stats.runs>0;
    S.stats.runs++;
    if(r.champion)S.stats.titles++;
    if(t.id==="flawless"||t.id==="immaculate")S.stats.flawless++;
    if(t.id==="immaculate")S.stats.imm++;
    if(r.scored>S.stats.gf)S.stats.gf=r.scored;
    if(f.big>S.stats.big)S.stats.big=f.big;
    if((TIER_RANK[t.id]||0)>(TIER_RANK[S.stats.best]||0))S.stats.best=t.id;
    var fresh=[];
    ACH.forEach(function(a){if(!S.ach[a.id]&&a.t(r,f)){S.ach[a.id]=Date.now();fresh.push(a);}});
    S.fin={prevBest:prev,newBest:newBest,newAch:fresh};
    saveStats();
    if(fresh.length)later(function(){say("Achievement: "+fresh[0].n+(fresh.length>1?" +"+(fresh.length-1):""));},900);
  }
  S.live=null;render();toTop();
}
/* تخطّي المباراة الحالية (من غير قرار بين الشوطين) */
function skipMatch(){
  var L=S.live;if(!L)return;
  clearTimers();
  if(L.etTie){
    if(L.state==="pens"){concludeTie(L.etTie,L.si);return;}
    L.min=120;L.state="et";if(L.etTie.pens){L.state="pens";concludeTie(L.etTie,L.si);}else concludeTie(L.etTie,L.si);return;
  }
  if(L.state==="wait")beginNow();
  secondHalf(null);
  L.state="play";L.min=90;
  endLeg();
}
function playStageQuick(si,legs){
  var st=STAGES[si],k;
  for(k=legs.length;k<st.legs;k++){
    var pr={us:0,them:0};legs.forEach(function(x){pr.us+=x.us;pr.them+=x.them;});
    S.team=U.makeTeam(S.slots,S.picks,S.style);S.cup.team=S.team;
    var m=U.beginLeg(S.cup,si,k,pr);U.finishLeg(S.cup,m,null);legs.push(m);
  }
  return U.settleTie(S.cup,si,legs);
}
function skipAll(){
  clearTimers();
  var L=S.live,si,adv;
  if(!L)return;
  if(L.etTie){si=L.si;adv=pushTie(L.etTie,si);}
  else{
    si=L.si;var legs=S.tieLegs.slice();
    if(L.m){if(!L.h2)U.finishLeg(S.cup,L.m,null);legs.push(L.m);}
    adv=pushTie(playStageQuick(si,legs),si);
  }
  S.live=null;
  while(adv&&si<STAGES.length-1){si++;adv=pushTie(playStageQuick(si,[]),si);}
  finishCup(adv&&si===STAGES.length-1,adv?-1:si);
}

/* ---------- كارت المشاركة (PNG) ---------- */
function shareCard(){
  var r=S.res,T=tallyGoals(),c=document.createElement("canvas"),W=1080,H=1350,x=c.getContext("2d");
  c.width=W;c.height=H;
  var g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,"#0b2fb8");g.addColorStop(.5,"#061478");g.addColorStop(1,"#02061c");x.fillStyle=g;x.fillRect(0,0,W,H);
  x.strokeStyle="rgba(79,208,255,.12)";x.lineWidth=1;for(var i=0;i<W;i+=54){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke();}for(i=0;i<H;i+=54){x.beginPath();x.moveTo(0,i);x.lineTo(W,i);x.stroke();}
  x.strokeStyle="#4fd0ff";x.lineWidth=4;x.strokeRect(30,30,W-60,H-60);
  x.textAlign="center";x.fillStyle="#4fd0ff";x.font="600 30px Inter,system-ui,sans-serif";x.fillText("C H A M P I O N S   X I",W/2,110);
  x.fillStyle="#fff";x.font="700 84px Inter,system-ui,sans-serif";x.fillText(r.tier.label,W/2,220);
  x.fillStyle="#ffd23f";x.font="700 44px Inter,system-ui,sans-serif";var st="";for(i=0;i<5;i++)st+=i<(TIER_STARS[r.tier.id]||0)?"★ ":"☆ ";x.fillText(st.trim(),W/2,280);
  x.fillStyle="#c9d3e8";x.font="500 30px Inter,system-ui,sans-serif";x.fillText(r.tier.sub,W/2,325);
  x.fillStyle="#ffd23f";x.font="700 170px Inter,system-ui,sans-serif";x.fillText(r.wins+"–"+r.losses,W/2,490);
  x.fillStyle="#c9d3e8";x.font="600 28px Inter,system-ui,sans-serif";
  x.fillText(r.scored+" GOALS FOR   ·   "+r.conceded+" AGAINST   ·   "+Math.round(S.team.ovr)+" OVERALL",W/2,545);
  var line=r.stages.map(function(s){var t=s.tie;return s.stage.short.split(" ")[0]+" "+(s.stage.legs>1?t.aggUs+"–"+t.aggThem:t.legs[0].us+"–"+t.legs[0].them)+(t.adv?"":" ✕");}).join("  ·  ");
  x.fillStyle="#8fb2ff";x.font="500 24px Inter,system-ui,sans-serif";x.fillText(line,W/2,590);
  if(T.max){x.fillStyle="#ffd23f";x.font="700 32px Inter,system-ui,sans-serif";x.fillText("GOLDEN BOOT  "+T.boot.join(" · ").toUpperCase()+"  "+T.max,W/2,640);}
  x.textAlign="left";var y=715;
  S.slots.forEach(function(s){var p=S.picks[s.i];if(!p)return;
    x.fillStyle="#2b6bff";x.fillRect(110,y-34,84,44);x.fillStyle="#fff";x.font="700 26px Inter,system-ui,sans-serif";x.textAlign="center";x.fillText(s.pos,152,y-3);
    x.textAlign="left";x.font="600 36px Inter,system-ui,sans-serif";x.fillText(p.n,220,y-2);
    x.fillStyle="#8fb2ff";x.font="500 28px Inter,system-ui,sans-serif";x.fillText(p.ab+" "+p.ss,620,y-2);
    x.textAlign="right";x.fillStyle="#5dffb0";x.font="700 38px Inter,system-ui,sans-serif";x.fillText(String(p.r),W-110,y-2);y+=52;});
  x.textAlign="center";x.fillStyle="#4fd0ff";x.font="500 24px Inter,system-ui,sans-serif";
  x.fillText(S.fid+" · "+STYLE_LABEL[S.style]+" · "+(r.bracket==="random"?"Random Bracket":"Classic Path")+(S.era==="modern"?" · Modern":"")+" · seed #"+r.seed,W/2,H-70);
  c.toBlob(function(b){
    if(!b){say("Couldn't build the card");return;}
    var f;try{f=new File([b],"champions-xi.png",{type:"image/png"});}catch(e){f=null;}
    if(f&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:"Europe XI"}).catch(function(){});return;}
    var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="champions-xi.png";document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(a.href);},4000);say("Card saved");
  },"image/png");
}

root.addEventListener("click",function(e){
  var b=e.target.closest("[data-act]");if(!b||b.disabled)return;
  var a=b.getAttribute("data-act"),v=b.getAttribute("data-v");
  /* الخلفية بتقفل النافذة، بس الضغط جوه الكارت لأ */
  if(a==="sheet-x"){if(b.classList.contains("u-sheet")&&e.target!==b)return;S.sheet=null;click();render(true);return;}
  switch(a){
    case"home":clearTimers();click();show("hub");break;
    case"back":
      if(S.view==="draft"&&S.count>0&&!window.confirm("Leave this draft? Your picks will be lost."))break;
      if(S.view==="sim"&&S.live&&!window.confirm("Leave the cup? This run will be lost."))break;
      clearTimers();click();S.view="setup";S.sheet=null;render();toTop();break;
    case"fid":S.fid=v;click();saveSettings();render(true);break;
    case"style":S.style=v;click();saveSettings();render(true);break;
    case"mode":S.mode=v;click();saveSettings();render(true);break;
    case"bracket":S.bracket=v;click();saveSettings();render(true);break;
    case"era":S.era=v;click();saveSettings();render(true);break;
    case"tab":S.tab=v;click();render();toTop();break;
    case"pres":S.pres=v;click();saveSettings();render(true);break;
    case"manage":S.manage=v==="1";click();saveSettings();render(true);break;
    case"start":startDraft();break;
    case"roll":doRoll("draw");break;
    case"rr-team":doRoll("team");break;
    case"rr-season":doRoll("season");break;
    case"flt":S.flt=v;click();render(true);break;
    case"pick":doPick(b.getAttribute("data-n"));break;
    case"slot":doSlot(+b.getAttribute("data-i"));break;
    case"xi":click();S.sheet={i:+b.getAttribute("data-i")};render(true);break;
    case"move":doMove(+b.getAttribute("data-i"),+b.getAttribute("data-j"));break;
    case"squad":click();S.sheet={squad:true};render(true);break;
    case"xitog":click();S.xiOpen=!S.xiOpen;render(true);break;
    case"sim":doSim();break;
    case"skip":click();skipAll();break;
    case"skipm":click();skipMatch();break;
    case"kick":click();startLeg();break;
    case"dec":if(S.live&&S.live.dec){S.live.dec.opt=v;click();render(true);}break;
    case"key":if(S.live&&S.live.dec){S.live.dec.key=v||null;click();render(true);}break;
    case"resume":resume();break;
    case"auto":S.auto=v==="1";click();saveSettings();render(true);if(S.auto&&S.live&&S.live.state==="wait")later(startLeg,300);break;
    case"speed":S.speed=v;click();saveSettings();render(true);break;
    case"replay":doRerun();break;
    case"card":click();shareCard();break;
    case"again":startDraft();break;
    case"online":
      if(window.OL&&OL.open){click();OL.open("ucl");}else say("Online mode is not ready yet");break;
    case"oleave":if(S.on)S.on.cfg.onLeave();break;
    case"ostart":startDraft();break;
    case"olock":doLock();break;
    case"odec":if(S.on&&S.on.dec){S.on.dec.opt=v;click();render(true);}break;
    case"okey":if(S.on&&S.on.dec){S.on.dec.key=v||null;click();render(true);}break;
    case"olockdec":doLockDec();break;
    case"oforce":doForce();break;
    case"oskip":click();skipPb();break;
    case"olineups":if(S.on){S.on.showXI=S.on.showXI?"":"1";click();render(true);}break;
    case"onext":if(S.on){click();S.on.cfg.onNext(S.on.snap.R);}break;
  }
});
/* معاينة حية للخانات (ماوس/كيبورد) */
root.addEventListener("mouseover",function(e){var r=e.target.closest(".u-row[data-n]");if(r&&!r.disabled&&!S.sel)previewFor(r.getAttribute("data-n"));});
root.addEventListener("mouseout",function(e){if(e.target.closest(".u-row[data-n]")&&!S.sel)clearPreview();});
root.addEventListener("focusin",function(e){var r=e.target.closest(".u-row[data-n]");if(r&&!r.disabled&&!S.sel)previewFor(r.getAttribute("data-n"));});
root.addEventListener("focusout",function(e){if(e.target.closest(".u-row[data-n]")&&!S.sel)clearPreview();});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&S.sheet&&root.offsetParent!==null){S.sheet=null;render(true);}});

/* =========================================================
   أونلاين: لاعب ضد لاعب (Head to head) — الاتنين بيعملوا مسودة لتشكيلتهم لوحدهم،
   وبعدين نفس المباراة (ذهاب وإياب أو مباراة واحدة) بتتحسب عند الاتنين بنفس الـ seed،
   وبين الشوطين كل واحد بيختار قراره. الحالة كلها بتتخزّن في خانة كل لاعب (a/b)،
   وكل واحد بيكتب في خانته بس. الربط بـ Firebase في js/online-ucl.js.
========================================================= */
var OC1=["#0e3bb8","#e8f2ff"],OC2=["#b8340e","#fff0e8"],watch=0;
function safe(t){return String(t==null?"":t).replace(/[;|=~^"\\]/g," ").replace(/\s+/g," ").trim();}
function abbr(n){var w=String(n||"?").trim().split(/\s+/),a=(w.length>1?w[0].charAt(0)+w[1].charAt(0):w[0].slice(0,3)).toUpperCase();return a||"OPP";}
function encodeXI(R){
  return JSON.stringify({R:R,f:S.fid,s:S.style,p:S.slots.map(function(sl){var p=S.picks[sl.i];return[safe(p.n),p.pos,p.alt||"",p.r,safe(p.ab),safe(p.ss),safe(p.club),p.c[0],p.c[1],p.cp||"ucl"];})});
}
function decodeXI(str,R){
  if(!str)return null;
  try{
    var j=JSON.parse(str);
    if(!j||j.R!==R||!U.FORMATIONS[j.f]||U.STYLES.indexOf(j.s)<0||!j.p||j.p.length!==11)return null;
    var slots=U.slotsFor(j.f),picks={},seen={};
    for(var i=0;i<11;i++){
      var a=j.p[i],p={n:String(a[0]),pos:String(a[1]),alt:String(a[2]||""),r:Math.max(60,Math.min(99,+a[3]||60)),ab:String(a[4]),ss:String(a[5]),club:String(a[6]),c:[String(a[7]),String(a[8])],cp:COMPS[a[9]]?a[9]:"ucl"};
      if(U.POS.indexOf(p.pos)<0||seen[p.n]||!U.fits(slots[i].pos,p)||!/^#[0-9a-fA-F]{6}$/.test(p.c[0])||!/^#[0-9a-fA-F]{6}$/.test(p.c[1]))return null;
      seen[p.n]=1;picks[i]=p;
    }
    return{fid:j.f,style:j.s,slots:slots,picks:picks,team:U.makeTeam(slots,picks,j.s)};
  }catch(e){return null;}
}
function parseHd(str,R){var o={};String(str||"").split(";").forEach(function(t){var m=/^(\d+)\.(\d+)=([a-z]+)\|(.*)$/.exec(t);if(m&&+m[1]===R)o[+m[2]]={opt:m[3],key:m[4]||null};});return o;}
function parseFw(str,R){var o={};String(str||"").split(";").forEach(function(t){var m=/^(\d+)\.(\d+)$/.exec(t);if(m&&+m[1]===R)o[+m[2]]=1;});return o;}
function rseed(sn){return((sn.seed+sn.R*7919)%2147483646)+1;}
function flipEv(e){
  if(!S.on||S.on.snap.me!=="b")return e;
  var c={},k;for(k in e)c[k]=e[k];c.us=e.us===1?0:e.us===0?1:e.us;return c;
}
function opName(){var sn=S.on.snap;return(sn.me==="a"?sn.b:sn.a).name||"Opponent";}
function myName(){var sn=S.on.snap;return(sn[sn.me]||{}).name||"You";}

function doLock(){
  var O=S.on;if(!O||S.count<11||O.restored&&O.mine)return;
  click();var R=O.snap.R;
  O.cfg.onLock(R,encodeXI(R));
  O.restored=true;S.team=U.makeTeam(S.slots,S.picks,S.style);S.view="owait";S.sheet=null;render();toTop();
}
function unmountOn(){
  clearTimers();if(watch){clearInterval(watch);watch=0;}
  S.on=null;document.body.classList.remove("ucl-online");S.view="setup";S.sheet=null;resetDraft();render();
}
function mountOn(cfg){
  clearTimers();loadSave();resetDraft();
  S.on={cfg:cfg,snap:null,round:0,era:"all",cups:U.COMP_IDS.slice(),pb:null,vs:null,dec:null,dA:null,dB:null,hd:{a:{},b:{}},fw:{a:{},b:{}},legs:2,showXI:""};
  S.view="osetup";S.sheet=null;
  if(watch)clearInterval(watch);
  watch=setInterval(function(){if(S.on&&!document.body.classList.contains("ol-open"))unmountOn();},800);
}
function refreshVs(){
  var O=S.on,sn=O.snap,R=sn.R,legs=+((sn.opts||{}).legs)===1?1:2;
  var hA=parseHd(sn.a.hd,R),hB=parseHd(sn.b.hd,R),fA=parseFw(sn.a.fw,R),fB=parseFw(sn.b.fw,R),stay={opt:"stay",key:null};
  O.hd={a:hA,b:hB};O.fw={a:fA,b:fB};O.legs=legs;
  /* لو واحد كمّل من غير التاني، قرار التاني "ما تغيّرش" مهما حصل بعد كده (نفس النتيجة عند الاتنين) */
  O.vs=U.buildVs(rseed(sn),O.dA.team,O.dB.team,legs,{name:sn.b.name,ab:abbr(sn.b.name),c:OC2},function(k){
    var da=fB[k]?stay:(hA[k]||null),db=fA[k]?stay:(hB[k]||null);
    return{ready:!!(da&&db),a:da,b:db};
  });
}
function onSync(sn){
  var O=S.on;if(!O||!sn||!sn.me)return;
  O.snap=sn;O.era=sn.opts&&sn.opts.era==="modern"?"modern":"all";
  document.body.classList.add("ucl-online");
  var me=sn.me,op=me==="a"?"b":"a",R=sn.R;
  if(O.round!==R){
    O.round=R;clearTimers();resetDraft();O.pb=null;O.vs=null;O.dec=null;O.rec=false;O.restored=false;O.waitSince=0;O.showXI="";
    S.view="osetup";
  }
  var mine=decodeXI((sn[me]||{}).xi,R),theirs=decodeXI((sn[op]||{}).xi,R);
  O.mine=mine;O.theirs=theirs;
  if(mine&&!O.restored){S.fid=mine.fid;S.style=mine.style;S.slots=mine.slots;S.picks=mine.picks;S.count=11;S.taken={};S.team=mine.team;O.restored=true;}
  if(mine&&theirs){
    O.dA=me==="a"?mine:theirs;O.dB=me==="a"?theirs:mine;
    refreshVs();
    if(S.view!=="omatch"||!O.pb){S.view="omatch";S.sheet=null;startPb();}
    else softMatch();
    return;
  }
  if(mine){if(S.view!=="owait"){S.view="owait";S.sheet=null;}render(true);return;}
  if(S.view==="osetup")render(true);
}

/* ---------- تشغيل المباراة عند كل لاعب ---------- */
function startPb(){var O=S.on;O.pb={k:0,min:0,state:"wait"};render(true);toTop();later(pbKick,900);}
function pbKick(){var O=S.on;if(!O||!O.pb||O.pb.state!=="wait"||S.view!=="omatch")return;O.pb.state="play";O.pb.min=0;render(true);later(pbTick,msTick());}
function pbEvs(){
  var O=S.on,pb=O.pb,m=O.vs.legs[pb.k],ev=m.ev;
  if(O.vs.tie&&O.vs.tie.et&&pb.k===O.legs-1&&(pb.state==="et"||pb.state==="pens"||pb.state==="done"))ev=ev.concat(O.vs.tie.et.ev);
  return ev.map(flipEv);
}
function oScore(evs,min){var u=0,t=0;evs.forEach(function(e){if(e.min<=min&&(e.t==="goal"||e.t==="og")){if(e.us)u++;else t++;}});return[u,t];}
function prevAgg(){
  var O=S.on,u=0,t=0,i;
  for(i=0;i<O.pb.k;i++){var m=O.vs.legs[i],a=O.snap.me==="a";u+=a?m.us:m.them;t+=a?m.them:m.us;}
  return[u,t];
}
function updateLive(){
  var O=S.on,pb=O.pb,evs=pbEvs(),sc=oScore(evs,pb.min),opp={ab:abbr(opName())},hit=evs.filter(function(e){return e.min===pb.min;});
  var clk=document.getElementById("uClk"),scr=document.getElementById("uSc"),fd=document.getElementById("uFeed"),led=document.getElementById("uLed"),ag=document.getElementById("uAgg");
  if(clk)clk.textContent=clockTxt(pb.min,null);
  if(scr)scr.textContent=sc[0]+"–"+sc[1];
  if(fd){var h="";evs.forEach(function(e){if(e.min<=pb.min)h+=evLi(e,opp);});fd.innerHTML=h;}
  if(ag){var pg=prevAgg();ag.textContent="AGG "+(pg[0]+sc[0])+"–"+(pg[1]+sc[1]);}
  var gl=hit.filter(function(e){return e.t==="goal"||e.t==="og";});
  if(gl.length&&led){led.classList.remove("is-g","is-c","is-e");void led.offsetWidth;led.classList.add(gl.some(function(e){return e.us;})?"is-g":"is-c");}
  else if(hit.length&&led){led.classList.remove("is-g","is-c","is-e");void led.offsetWidth;led.classList.add("is-e");}
  return hit.length;
}
function pbTick(){
  var O=S.on;if(!O||S.view!=="omatch"||!O.pb)return;
  var pb=O.pb;if(pb.state!=="play"&&pb.state!=="et")return;
  if(!O.vs.legs[pb.k])return;
  pb.min++;
  var hit=updateLive();
  if(pb.state==="play"&&pb.min===45&&O.vs.pending===pb.k){
    pb.state="ht";if(!O.dec||O.dec.k!==pb.k||O.dec.R!==O.snap.R)O.dec={R:O.snap.R,k:pb.k,opt:"stay",key:null};
    O.waitSince=0;render(true);return;
  }
  if(pb.state==="play"&&pb.min>=90){later(pbEndLeg,msGoal()+200);return;}
  if(pb.state==="et"&&pb.min>=120){later(pbEndEt,msGoal()+200);return;}
  later(pbTick,msTick()+(hit?msGoal():0));
}
function pbEndLeg(){
  var O=S.on;if(!O||!O.pb||S.view!=="omatch")return;
  var pb=O.pb,tie=O.vs.tie;
  if(pb.k<O.legs-1){
    if(!O.vs.legs[pb.k+1])return;
    O.pb={k:pb.k+1,min:0,state:"wait"};render(true);later(pbKick,msGoal()+500);return;
  }
  if(tie&&tie.et){pb.state="et";pb.min=90;render(true);later(pbTick,msTick()+300);return;}
  pbDone();
}
function pbEndEt(){
  var O=S.on;if(!O||!O.pb)return;
  var tie=O.vs.tie;
  if(tie&&tie.pens){O.pb.state="pens";render(true);later(pbDone,msGoal()*2+900);return;}
  pbDone();
}
function myWin(){var O=S.on,tie=O.vs.tie;return(O.snap.me==="a")===!!tie.adv;}
function pbDone(){
  var O=S.on;if(!O||!O.pb||!O.vs.tie)return;
  O.pb.state="done";
  if(!O.rec){O.rec=true;try{O.cfg.onRecord({win:myWin(),R:O.snap.R});}catch(e){}}
  render();toTop();
}
/* وصل تحديث من الفايربيز أثناء المباراة */
function softMatch(){
  var O=S.on,pb=O.pb;if(!pb)return;
  if(pb.state==="ht"){
    if(O.vs.pending!==pb.k){pb.state="play";render(true);later(pbTick,msGoal());}
    else render(true);
    return;
  }
  if(pb.state==="done")render(true);
}
function skipPb(){
  var O=S.on;if(!O||!O.pb)return;var pb=O.pb;
  if(pb.state==="wait"){clearTimers();pb.state="play";pb.min=0;render(true);}
  if(pb.state==="play"){clearTimers();if(pb.min<45&&O.vs.pending===pb.k)pb.min=44;else pb.min=89;later(pbTick,10);}
  else if(pb.state==="et"){clearTimers();pb.min=119;later(pbTick,10);}
}

/* ---------- قرار الاستراحة (أونلاين) ---------- */
function htPanelOn(){
  var O=S.on,sn=O.snap,me=sn.me,pb=O.pb,k=pb.k,m=O.vs.legs[k],h=U.htOptions(m,me),D=O.dec,my=O.hd[me][k];
  var head=h.ctx==="trailing"?"You're behind":h.ctx==="leading"?"You're in front":"All square";
  var sc=oScore(pbEvs(),45),pg=prevAgg();
  var sub=h.two?"Aggregate "+(pg[0]+sc[0])+"–"+(pg[1]+sc[1]):"Score "+sc[0]+"–"+sc[1];
  var o='<div class="u-ht"><div class="u-ht-h"><small>HALF-TIME DECISION</small><b>'+head+'</b><span>'+sub+'</span></div>';
  if(my){
    var long=O.waitSince&&Date.now()-O.waitSince>30000;
    o+='<div class="u-lock"><b>Decision locked</b><span>'+esc(my.opt==="stay"?"Stay the course":(h.opts.filter(function(x){return x.id===my.opt;})[0]||{name:my.opt}).name)+(my.key?' · focus on '+esc(my.key):'')+'</span></div>'+
      '<p class="u-wait2"><i></i><i></i><i></i> Waiting for '+esc(opName())+'…</p>'+
      (long?'<button type="button" class="u-btn u-alt" data-act="oforce">Continue without them</button><p class="u-hint">Their decision for this half is counted as “stay the course”.</p>':'');
    return o+'</div>';
  }
  o+='<div class="u-opts">';
  h.opts.forEach(function(x){o+='<button type="button" class="u-opt'+(D.opt===x.id?' is-on':'')+'" data-act="odec" data-v="'+x.id+'"><b>'+esc(x.name)+'</b><span>'+esc(x.note)+'</span></button>';});
  o+='</div><h3 class="u-label u-lh3">Look for</h3><div class="u-keys"><button type="button" class="u-key'+(!D.key?' is-on':'')+'" data-act="okey" data-v="">Nobody</button>';
  h.keys.forEach(function(p){o+='<button type="button" class="u-key'+(D.key===p.n?' is-on':'')+'" data-act="okey" data-v="'+esc(p.n)+'">'+esc(p.n)+'</button>';});
  o+='</div><p class="u-hint">Both managers choose in secret. Nobody sees the other’s choice until the second half starts.</p>'+
    '<button type="button" class="u-btn u-play2" data-act="olockdec">Lock decision</button></div>';
  return o;
}
function doLockDec(){
  var O=S.on;if(!O||!O.pb||O.pb.state!=="ht")return;
  var k=O.pb.k,me=O.snap.me,D=O.dec;
  click();
  O.hd[me][k]={opt:D.opt,key:D.key};O.waitSince=Date.now();
  try{O.cfg.onDecide(O.snap.R,k,D.opt,D.key?safe(D.key):"");}catch(e){}
  render(true);
  later(function(){if(S.on&&S.on.pb&&S.on.pb.state==="ht")render(true);},30600);
}
function doForce(){
  var O=S.on;if(!O||!O.pb||O.pb.state!=="ht")return;
  click();try{O.cfg.onForce(O.snap.R,O.pb.k);}catch(e){}
}

/* ---------- الشاشات ---------- */
function onLine(){
  var O=S.on,o=O.snap.opts||{};
  return'<ul class="u-chipline"><li>Game '+O.snap.R+'</li><li>'+(O.legs===1||+o.legs===1?"Single match":"Two legs")+'</li><li>'+(O.era==="modern"?"Modern era":"All history")+'</li><li>'+S.fid+'</li><li>'+STYLE_LABEL[S.style]+'</li></ul>';
}
function roster(sn){
  var a=sn.a,b=sn.b;
  return'<div class="u-vsbar"><div><b>'+esc(a.name)+'</b><small>'+(a.w||0)+' wins</small></div><em>VS</em><div><b>'+esc(b?b.name:"Waiting…")+'</b><small>'+((b&&b.w)||0)+' wins</small></div></div>';
}
function viewOSetup(){
  var O=S.on,sn=O.snap;if(!sn)return'<p class="u-wait"><i></i><i></i><i></i></p>';
  var me=sn.me,op=me==="a"?"b":"a";
  var fm="";U.FORMATION_IDS.forEach(function(f){fm+='<button type="button" class="u-chip'+(f===S.fid?' is-on':'')+'" data-act="fid" data-v="'+f+'">'+f+'</button>';});
  var st=seg("style",S.style,U.STYLES.map(function(x){return[x,STYLE_LABEL[x]];}));
  var md=seg("mode",S.mode,[["classic","Visible"],["memory","Hidden"]]);
  var opLocked=!!decodeXI((sn[op]||{}).xi,sn.R);
  return'<div class="u-hero"><h1 class="u-logo">HEAD<br>TO HEAD</h1><p class="u-tag">Draft your XI in secret. Then manage the match against a real opponent.</p></div>'+
    roster(sn)+
    '<ul class="u-chipline"><li>Game '+sn.R+'</li><li>'+(+(sn.opts||{}).legs===1?"Single match":"Two legs")+'</li><li>'+(O.era==="modern"?"Modern era (1992+)":"All history")+'</li></ul>'+
    '<div class="u-panel"><h2 class="u-label">Formation</h2><div class="u-chips">'+fm+'</div><div class="u-mini">'+miniPitch(S.fid)+'</div></div>'+
    '<div class="u-panel"><h2 class="u-label">Playing style</h2>'+st+'<p class="u-hint">'+STYLE_DESC[S.style]+'</p></div>'+
    '<div class="u-panel"><h2 class="u-label">Ratings while you draft</h2>'+md+'</div>'+
    '<p class="u-hint u-c">'+esc((sn[op]||{}).name||"Opponent")+(opLocked?' has already locked in an XI.':' is getting ready.')+'</p>'+
    '<button type="button" class="u-btn u-big" data-act="ostart">Start draft</button>';
}
function viewOWait(){
  var O=S.on,sn=O.snap,op=sn.me==="a"?"b":"a";
  return'<div class="u-ready"><h2 class="u-label">XI locked in</h2><p class="u-big-t">Waiting for '+esc((sn[op]||{}).name||"your opponent")+'</p></div>'+onLine()+
    '<p class="u-wait"><i></i><i></i><i></i></p>'+pitch(null,true)+
    '<p class="u-hint u-c">The match starts the moment they lock in theirs.</p>';
}
function roPitch(d){
  var o='<div class="u-pitch u-ro">'+pitchLines();
  d.slots.forEach(function(s){
    var p=d.picks[s.i],st='left:'+s.x.toFixed(2)+'%;top:'+s.y.toFixed(2)+'%';
    o+='<div class="u-slot is-filled" style="'+st+'"><span class="u-shirt" style="--c0:'+p.c[0]+';--c1:'+p.c[1]+';--tx:'+ink(p.c[0])+'">'+p.r+'</span><span class="u-nm">'+esc(p.n)+'</span></div>';
  });
  return o+'</div>';
}
function lineups(){
  var O=S.on,me=O.snap.me,mine=me==="a"?O.dA:O.dB,theirs=me==="a"?O.dB:O.dA;
  function bx(d,label){
    return'<div class="u-panel"><h2 class="u-label">'+label+' · '+d.fid+' · '+STYLE_LABEL[d.style]+'</h2>'+roPitch(d)+bars(d.team,false)+'</div>';
  }
  return bx(mine,"Your XI")+bx(theirs,esc(opName())+"’s XI");
}
function onCard(){
  var O=S.on,pb=O.pb,sn=O.snap,two=O.legs>1,wait=pb.state==="wait",ht=pb.state==="ht";
  var evs=pbEvs(),sc=oScore(evs,pb.min),pg=prevAgg(),opp={ab:abbr(opName())},prev="",j,a=sn.me==="a";
  for(j=0;j<pb.k;j++){var mm=O.vs.legs[j];prev+='<li><span>'+(j?'2ND LEG':'1ST LEG')+'</span><b>'+(a?mm.us:mm.them)+' – '+(a?mm.them:mm.us)+'</b></li>';}
  var clk=wait?"KICK-OFF":pb.state==="pens"?"PENALTIES":ht?"HALF-TIME":clockTxt(pb.min,null);
  var feed="";evs.forEach(function(e){if(e.min<=pb.min)feed+=evLi(e,opp);});
  var pens=O.vs.tie&&O.vs.tie.pens&&pb.state==="pens"?'<p class="u-tnote"><span>Penalties '+(a?O.vs.tie.pens.us:O.vs.tie.pens.them)+'–'+(a?O.vs.tie.pens.them:O.vs.tie.pens.us)+'</span></p>':'';
  return'<article class="u-tie u-live'+(wait?' is-wait':'')+(ht?' is-ht':'')+'" id="uLive"><header><b>Head to head</b><span>'+(two?(pb.k?'2ND LEG':'1ST LEG'):'SINGLE MATCH')+'</span></header>'+
    '<div class="u-vs"><div class="u-side">'+crest(OC1,"YOU",44)+'<b>'+esc(myName())+'</b><small>'+esc(S.fid)+'</small></div>'+
    '<div class="u-led" id="uLed"><strong id="uSc">'+sc[0]+'–'+sc[1]+'</strong><small id="uClk">'+clk+'</small></div>'+
    '<div class="u-side">'+crest(OC2,abbr(opName()),44)+'<b>'+esc(opName())+'</b><small>'+esc((a?O.dB:O.dA).fid)+'</small></div></div>'+
    (two&&pb.k?'<p class="u-agg" id="uAgg">AGG '+(pg[0]+sc[0])+'–'+(pg[1]+sc[1])+'</p>':'')+
    (prev?'<ul class="u-legs">'+prev+'</ul>':'')+pens+
    '<ul class="u-feed" id="uFeed">'+feed+'</ul>'+(ht?htPanelOn():'')+'</article>';
}
function viewOResult(){
  var O=S.on,sn=O.snap,tie=O.vs.tie,a=sn.me==="a",win=myWin(),opp={ab:abbr(opName())};
  var aggMe=a?tie.aggUs:tie.aggThem,aggOp=a?tie.aggThem:tie.aggUs;
  var note="";
  if(tie.et)note+='<span>Extra time '+(a?tie.et.us:tie.et.them)+'–'+(a?tie.et.them:tie.et.us)+'</span>';
  if(tie.pens)note+='<span>Penalties '+(a?tie.pens.us:tie.pens.them)+'–'+(a?tie.pens.them:tie.pens.us)+'</span>';
  var legs="",rep="";
  O.vs.legs.forEach(function(m,k){
    var u=a?m.us:m.them,t=a?m.them:m.us;
    legs+='<li><span>'+(O.legs>1?(k?'2ND LEG':'1ST LEG'):'MATCH')+'</span><b>'+u+' – '+t+'</b></li>';
    var ev=m.ev.slice();if(k===O.legs-1&&tie.et)ev=ev.concat(tie.et.ev);
    var dMe=a?m.decision:m.decisionB,dOp=a?m.decisionB:m.decision;
    rep+='<div class="u-gl"><h4>'+(O.legs>1?(k?'2nd leg':'1st leg'):'Match')+' · '+u+'–'+t+(m.ht?' <small>HT '+(a?m.ht.us:m.ht.them)+'–'+(a?m.ht.them:m.ht.us)+'</small>':'')+'</h4>'+
      '<p class="u-dec">You: '+esc(dMe?dMe.name+(dMe.key?' · focus '+dMe.key:''):'Stay the course')+'</p><p class="u-dec u-dec2">'+esc(opName())+': '+esc(dOp?dOp.name+(dOp.key?' · focus '+dOp.key:''):'Stay the course')+'</p>';
    if(!ev.length)rep+='<p class="u-none">No goals, no drama</p>';
    else{rep+='<ul>';ev.forEach(function(e){rep+=evLi(flipEv(e),opp);});rep+='</ul>';}
    rep+='</div>';
  });
  var g={};
  O.vs.legs.forEach(function(m,k){var ev=m.ev.slice();if(k===O.legs-1&&tie.et)ev=ev.concat(tie.et.ev);ev.forEach(function(e){if(e.t==="goal"&&((e.us===1)===a)){g[e.n]=(g[e.n]||0)+1;}});});
  var sc=Object.keys(g).map(function(n){return esc(n)+(g[n]>1?' ×'+g[n]:'');}).join(' · ');
  var myRd=(sn[sn.me]||{}).rd||1,waitNext=myRd>sn.R;
  return'<div class="u-verdict '+(win?'t-champions':'t-po')+'"><small>FULL TIME</small>'+medal(win?"champions":"po")+'<h2>'+(win?'YOU WIN':'YOU LOSE')+'</h2>'+
    '<p>'+esc(myName())+' '+aggMe+' – '+aggOp+' '+esc(opName())+'</p>'+(note?'<p class="u-tnote">'+note+'</p>':'')+
    '<div class="u-rec"><small>SCORE</small><strong>'+aggMe+'–'+aggOp+'</strong><span>'+(O.legs>1?'on aggregate':'single match')+'</span></div>'+
    (sc?'<div class="u-boot"><small>YOUR SCORERS</small><b>'+sc+'</b></div>':'')+'</div>'+
    '<div class="u-panel"><h2 class="u-label">Result</h2><ul class="u-legs u-legs2">'+legs+'</ul><details class="u-goals"><summary>Match report</summary>'+rep+'</details></div>'+
    lineups()+
    (waitNext?'<p class="u-wait2"><i></i><i></i><i></i> Waiting for '+esc(opName())+' to start the next game…</p>':'<button type="button" class="u-btn u-big" data-act="onext">Next game</button>')+
    '<button type="button" class="u-btn u-ghostb u-wide" data-act="oleave">Leave room</button>';
}
function viewOMatch(){
  var O=S.on,pb=O.pb;if(!pb||!O.vs)return'<p class="u-wait"><i></i><i></i><i></i></p>';
  if(pb.state==="done")return viewOResult();
  var a=O.snap.me==="a",ctl='<div class="u-ctl"><div class="u-seg u-spd">'+["normal","fast","ultra"].map(function(v){return'<button type="button" class="u-seg-b'+(S.speed===v?' is-on':'')+'" data-act="speed" data-v="'+v+'">'+({normal:"Normal",fast:"Fast",ultra:"Ultra"})[v]+'</button>';}).join("")+'</div></div>';
  return roster(O.snap)+ctl+onCard()+
    (pb.state==="play"||pb.state==="et"?'<button type="button" class="u-btn u-ghostb u-wide" data-act="oskip">Skip ahead</button>':'')+
    '<button type="button" class="u-btn u-ghostb u-wide" data-act="olineups">'+(O.showXI?'Hide lineups':'Show both XIs')+'</button>'+(O.showXI?lineups():'');
}

window.UCLO={
  mount:mountOn,sync:onSync,unmount:unmountOn,
  active:function(){return!!S.on;}
};

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
