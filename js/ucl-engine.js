/* =========================================================
   UCL ENGINE — منطق لعبة أبطال أوروبا (من غير أي DOM).
   الواجهة: js/ucl.js · البيانات: js/ucl-data.js · الاختبار: node js/ucl.test.js

   الفكرة: بتبني 11 لاعب من تشكيلات أبطال أوروبا، وبعدين بطولة إقصائية
   (ملحق + 16 + ربع + نصف ذهاب وإياب + نهائي مباراة واحدة = 9 مباريات).
   النتيجة بتوزيع بواسون (نفس نموذج 7a0):
     λ لنا   = 1.4 + 0.08 × (هجومنا − قوة الخصم)
     λ علينا = 1.4 + 0.08 × (قوة الخصم − دفاعنا)     [محصورين بين 0.15 و 5]
   الهجوم والدفاع = متوسط موزون بمركز الخانة اللي اللاعب بيلعب فيها.
========================================================= */
(function(g){
"use strict";

/* ---------- ضبط المعادلة (كلها قابلة للمعايرة) ---------- */
var CFG={
  base:1.4,slope:0.08,minL:0.15,maxL:5,
  oppOffset:0,        /* بيتضاف على قوة كل خصم (معايرة الصعوبة) */
  styleAdj:3,         /* هجومي: هجوم +3 ودفاع −3، والعكس للدفاعي */
  penBase:0.5,penSlope:0.012,penMin:0.1,penMax:0.9,
  etShare:1/3         /* الوقت الإضافي = ثلث λ المباراة */
};

/* ---------- المراكز والأوزان ---------- */
var POS=["GK","RB","LB","CB","DM","CM","AM","RM","LM","RW","LW","ST"];
var WATT={GK:0,RB:0,LB:0,CB:0,DM:0.2,CM:0.5,RM:0.5,LM:0.5,AM:0.8,RW:1,LW:1,ST:1};
var WDEF={GK:1,RB:1,LB:1,CB:1,DM:0.8,CM:0.5,RM:0.5,LM:0.5,AM:0.2,RW:0,LW:0,ST:0};

/* ---------- التشكيلات: صفوف من الهجوم للحارس، من الشمال لليمين ---------- */
var BACK4=["LB","CB","CB","RB"];
var FORMATIONS={
  "4-3-3":[["LW","ST","RW"],["CM","AM","CM"],BACK4,["GK"]],
  "4-4-2":[["ST","ST"],["LM","CM","CM","RM"],BACK4,["GK"]],
  "4-2-3-1":[["ST"],["LW","AM","RW"],["DM","DM"],BACK4,["GK"]],
  "4-2-4":[["LW","ST","ST","RW"],["CM","CM"],BACK4,["GK"]],
  "3-5-2":[["ST","ST"],["LM","CM","DM","CM","RM"],["CB","CB","CB"],["GK"]],
  "5-3-2":[["ST","ST"],["CM","CM","CM"],["LB","CB","CB","CB","RB"],["GK"]],
  "4-5-1":[["ST"],["LM","CM","DM","CM","RM"],BACK4,["GK"]],
  "3-4-3":[["LW","ST","RW"],["LM","CM","CM","RM"],["CB","CB","CB"],["GK"]]
};
var FORMATION_IDS=["4-3-3","4-4-2","4-2-3-1","4-2-4","3-5-2","5-3-2","4-5-1","3-4-3"];
var STYLES=["defensive","balanced","attacking"];

/* ---------- أدوار البطولة (9 مباريات) ---------- */
var STAGES=[
  {id:"PO",name:"Knockout Play-off",short:"PLAY-OFF",legs:2},
  {id:"R16",name:"Round of 16",short:"LAST 16",legs:2},
  {id:"QF",name:"Quarter-final",short:"QUARTER",legs:2},
  {id:"SF",name:"Semi-final",short:"SEMI",legs:2},
  {id:"F",name:"Final",short:"FINAL",legs:1}
];
var TOTAL_MATCHES=STAGES.reduce(function(a,s){return a+s.legs;},0);

/* خانات التشكيلة بإحداثيات % على الملعب (فوق = هجوم) */
function slotsFor(fid){
  var rows=FORMATIONS[fid]||FORMATIONS["4-3-3"],out=[],n=rows.length,i=0;
  rows.forEach(function(row,ri){
    var y=n===1?50:10+ri*(80/(n-1));
    row.forEach(function(pos,ci){
      out.push({i:i++,pos:pos,x:(ci+1)*100/(row.length+1),y:y});
    });
  });
  return out;
}

/* ---------- اللاعب يناسب الخانة؟ (مركزه الأساسي أو البديل بس) ---------- */
function same(a,b){
  return a===b||(a==="RM"&&b==="RW")||(a==="RW"&&b==="RM")||(a==="LM"&&b==="LW")||(a==="LW"&&b==="LM");
}
function fits(slotPos,p){return same(slotPos,p.pos)||(!!p.alt&&same(slotPos,p.alt));}

/* اللاعبين اللي ينفع يتختاروا من موسم: لاعب → الخانات الفاضية المناسبة */
function pickable(season,slots,picks,taken){
  var out=[];
  season.p.forEach(function(p){
    if(taken&&taken[p.n])return;
    var idx=[];
    slots.forEach(function(s){if(!picks[s.i]&&fits(s.pos,p))idx.push(s.i);});
    if(idx.length)out.push({p:p,slots:idx});
  });
  return out;
}

/* ---------- RNG بـ seed (mulberry32) ---------- */
function rngFrom(seed){
  var a=(seed>>>0)||1;
  return function(){
    a=(a+0x6D2B79F5)>>>0;
    var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
    return((t^(t>>>14))>>>0)/4294967296;
  };
}
function poisson(lam,rnd){
  var L=Math.exp(-lam),k=0,p=1;
  do{k++;p*=rnd();}while(p>L&&k<60);
  return k-1;
}
function clamp(x,a,b){return x<a?a:x>b?b:x;}
function lambda(a,b){return clamp(CFG.base+CFG.slope*(a-b),CFG.minL,CFG.maxL);}

/* ---------- قوة الفريق ---------- */
function makeTeam(slots,picks,style){
  var xi=[],a=0,aw=0,d=0,dw=0,sum=0;
  slots.forEach(function(s){
    var p=picks[s.i];if(!p)return;
    var wa=WATT[s.pos],wd=WDEF[s.pos];
    a+=p.r*wa;aw+=wa;d+=p.r*wd;dw+=wd;sum+=p.r;
    xi.push({n:p.n,pos:s.pos,r:p.r});
  });
  var A=aw?a/aw:0,D=dw?d/dw:0,adj=style==="attacking"?CFG.styleAdj:style==="defensive"?-CFG.styleAdj:0;
  return{xi:xi,A:A+adj,D:D-adj,ovr:xi.length?sum/xi.length:0,style:style||"balanced"};
}
/* قوة الموسم لما يتسحب كخصم = متوسط الـ 11 الأساسيين */
function seasonStrength(season){
  var st=season.p.filter(function(p){return p.s;});
  if(!st.length)st=season.p.slice().sort(function(a,b){return b.r-a.r;}).slice(0,11);
  return st.reduce(function(a,p){return a+p.r;},0)/st.length;
}
function oppTeam(season){
  var st=season.p.filter(function(p){return p.s;});
  return{xi:st.map(function(p){return{n:p.n,pos:p.pos,r:p.r};}),O:seasonStrength(season),
    id:season.id,club:season.club,ab:season.ab,ss:season.ss,yr:season.yr,c:season.c,coach:season.coach,fin:season.fin};
}

/* ---------- الهدّافين والدقايق ---------- */
function scorerPick(xi,rnd){
  var tot=0,w=xi.map(function(p){
    var x=p.pos==="GK"?0:Math.max(WATT[p.pos],0.05)*Math.pow(Math.max(p.r-55,1),2);
    tot+=x;return x;
  });
  if(!tot)return xi[0];
  var t=rnd()*tot;
  for(var i=0;i<xi.length;i++){t-=w[i];if(t<=0)return xi[i];}
  return xi[xi.length-1];
}
function goals(n,xi,rnd,lo,hi){
  var out=[];
  for(var i=0;i<n;i++)out.push({n:scorerPick(xi,rnd).n,min:lo+Math.floor(rnd()*(hi-lo+1))});
  return out.sort(function(a,b){return a.min-b.min;});
}

/* ---------- مباراة (90 دقيقة) + وقت إضافي + ركلات ترجيح ---------- */
function playLeg(rnd,team,opp){
  var O=opp.O+CFG.oppOffset;
  var gf=poisson(lambda(team.A,O),rnd),ga=poisson(lambda(O,team.D),rnd);
  return{us:gf,them:ga,gUs:goals(gf,team.xi,rnd,1,90),gThem:goals(ga,opp.xi,rnd,1,90)};
}
function playExtra(rnd,team,opp){
  var O=opp.O+CFG.oppOffset;
  var gf=poisson(lambda(team.A,O)*CFG.etShare,rnd),ga=poisson(lambda(O,team.D)*CFG.etShare,rnd);
  return{us:gf,them:ga,gUs:goals(gf,team.xi,rnd,91,120),gThem:goals(ga,opp.xi,rnd,91,120)};
}
var PEN_SCORES=[[5,4],[4,3],[5,3],[4,2],[3,2],[3,1],[6,5],[7,6],[5,4],[4,3]];
function penWinProb(team,opp){
  return clamp(CFG.penBase+CFG.penSlope*(team.ovr-opp.O),CFG.penMin,CFG.penMax);
}
function playPens(rnd,team,opp){
  var win=rnd()<penWinProb(team,opp),s=PEN_SCORES[Math.floor(rnd()*PEN_SCORES.length)];
  return{us:win?s[0]:s[1],them:win?s[1]:s[0],win:win};
}

/* ---------- مواجهة كاملة (ذهاب وإياب أو مباراة واحدة) ---------- */
function playTie(rnd,team,opp,legs){
  var L=[],aggUs=0,aggThem=0,i,et=null,pens=null;
  for(i=0;i<legs;i++){
    var m=playLeg(rnd,team,opp);
    L.push(m);aggUs+=m.us;aggThem+=m.them;
  }
  if(aggUs===aggThem){
    et=playExtra(rnd,team,opp);aggUs+=et.us;aggThem+=et.them;
    if(aggUs===aggThem)pens=playPens(rnd,team,opp);
  }
  var adv=pens?pens.win:aggUs>aggThem;
  /* إحصاء المباريات: الوقت الإضافي بيتحسب على آخر مباراة في المواجهة */
  var wins=0,draws=0,losses=0,conceded=0,scored=0;
  L.forEach(function(m,k){
    var fu=m.us+(k===legs-1&&et?et.us:0),ft=m.them+(k===legs-1&&et?et.them:0);
    m.fUs=fu;m.fThem=ft;
    scored+=fu;conceded+=ft;
    if(fu>ft)wins++;else if(fu<ft)losses++;else draws++;
  });
  return{legs:L,aggUs:aggUs,aggThem:aggThem,et:et,pens:pens,adv:adv,
    wins:wins,draws:draws,losses:losses,scored:scored,conceded:conceded};
}

/* ---------- سلم الخصوم: كل دور من شريحة أقوى (من أضعف 20% للنهائي في أقوى 20%) ---------- */
function buildLadder(rnd,seasons){
  var arr=seasons.map(oppTeam).sort(function(a,b){return a.O-b.O;}),n=arr.length,used={},out=[];
  [[0,.2],[.2,.4],[.4,.6],[.6,.8],[.8,1]].forEach(function(w){
    var lo=Math.floor(w[0]*n),hi=Math.max(lo+1,Math.floor(w[1]*n));
    var pool=arr.slice(lo,hi).filter(function(o){return !used[o.ab];});
    if(!pool.length)pool=arr.slice(lo,hi);
    var o=pool[Math.floor(rnd()*pool.length)];
    used[o.ab]=1;out.push(o);
  });
  return out;
}

/* ---------- نتيجة البطولة والمستوى ---------- */
function tierOf(r){
  if(r.champion){
    if(r.wins===TOTAL_MATCHES&&r.conceded===0)return{id:"immaculate",label:"IMMACULATE",sub:"9 wins · 0 goals against"};
    if(r.wins===TOTAL_MATCHES)return{id:"flawless",label:"FLAWLESS",sub:"Won all "+TOTAL_MATCHES+" matches"};
    if(r.losses===0)return{id:"unbeaten",label:"UNBEATEN CHAMPIONS",sub:"Champions of Europe, no defeats"};
    return{id:"champions",label:"CHAMPIONS OF EUROPE",sub:"You won the Final"};
  }
  var s=STAGES[r.outAt];
  if(s.id==="F")return{id:"finalist",label:"FINALIST",sub:"Lost the Final"};
  if(s.id==="SF")return{id:"semi",label:"SEMI-FINALIST",sub:"Out in the Semi-final"};
  if(s.id==="QF")return{id:"quarter",label:"QUARTER-FINALIST",sub:"Out in the Quarter-final"};
  if(s.id==="R16")return{id:"r16",label:"LAST 16",sub:"Out in the Round of 16"};
  return{id:"po",label:"KNOCKED OUT",sub:"Out in the Knockout Play-off"};
}

function runCup(team,seed,seasons){
  var rnd=rngFrom(seed),ladder=buildLadder(rnd,seasons),out=[],champion=true,outAt=-1;
  var wins=0,draws=0,losses=0,scored=0,conceded=0,played=0;
  for(var i=0;i<STAGES.length;i++){
    var st=STAGES[i],tie=playTie(rnd,team,ladder[i],st.legs);
    out.push({stage:st,opp:ladder[i],tie:tie});
    wins+=tie.wins;draws+=tie.draws;losses+=tie.losses;scored+=tie.scored;conceded+=tie.conceded;played+=st.legs;
    if(!tie.adv){champion=false;outAt=i;break;}
  }
  var res={seed:seed,stages:out,champion:champion,outAt:outAt,played:played,
    wins:wins,draws:draws,losses:losses,scored:scored,conceded:conceded};
  res.tier=tierOf(res);
  return res;
}

/* ---------- السحب ---------- */
function shuffled(arr,rnd){
  var a=arr.slice(),i,j,t;
  for(i=a.length-1;i>0;i--){j=Math.floor(rnd()*(i+1));t=a[i];a[i]=a[j];a[j]=t;}
  return a;
}
/* موسم عشوائي فيه لاعب واحد على الأقل ينفع يتختار. exclude = مواسم متسحبة قبل كده */
function firstWithPick(cands,rnd,slots,picks,taken){
  var order=shuffled(cands,rnd);
  for(var i=0;i<order.length;i++){
    if(pickable(order[i],slots,picks,taken).length)return order[i];
  }
  return null;
}
function drawSeason(rnd,seasons,used,slots,picks,taken){
  var fresh=seasons.filter(function(s){return !used[s.id];});
  return firstWithPick(fresh,rnd,slots,picks,taken)||firstWithPick(seasons,rnd,slots,picks,taken);
}
/* «فريق تاني»: نادي مختلف تماماً */
function rerollTeam(rnd,seasons,cur,used,slots,picks,taken){
  var c=seasons.filter(function(s){return s.ab!==cur.ab&&!used[s.id];});
  return firstWithPick(c,rnd,slots,picks,taken);
}
/* «موسم تاني»: نفس النادي في موسم فوز تاني */
function seasonAlternatives(seasons,cur,used,slots,picks,taken){
  return seasons.filter(function(s){
    return s.ab===cur.ab&&s.id!==cur.id&&!used[s.id]&&pickable(s,slots,picks,taken).length;
  });
}
function rerollSeason(rnd,seasons,cur,used,slots,picks,taken){
  var c=seasonAlternatives(seasons,cur,used,slots,picks,taken);
  return c.length?c[Math.floor(rnd()*c.length)]:null;
}

var API={CFG:CFG,POS:POS,WATT:WATT,WDEF:WDEF,FORMATIONS:FORMATIONS,FORMATION_IDS:FORMATION_IDS,STYLES:STYLES,
  STAGES:STAGES,TOTAL_MATCHES:TOTAL_MATCHES,slotsFor:slotsFor,fits:fits,pickable:pickable,rngFrom:rngFrom,
  poisson:poisson,lambda:lambda,makeTeam:makeTeam,seasonStrength:seasonStrength,oppTeam:oppTeam,
  penWinProb:penWinProb,playTie:playTie,buildLadder:buildLadder,runCup:runCup,tierOf:tierOf,
  drawSeason:drawSeason,rerollTeam:rerollTeam,rerollSeason:rerollSeason,seasonAlternatives:seasonAlternatives};
g.UCL=API;
if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
