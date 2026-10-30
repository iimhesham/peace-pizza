/* =========================================================
   UCL ENGINE — منطق لعبة أبطال أوروبا (من غير أي DOM).
   الواجهة: js/ucl.js · البيانات: js/ucl-data.js · الاختبار: node js/ucl.test.js

   الفكرة: بتبني 11 لاعب من تشكيلات أبطال أوروبا، وبعدين بطولة إقصائية
   (ملحق + 16 + ربع + نصف ذهاب وإياب + نهائي مباراة واحدة = 9 مباريات).
   النتيجة بتتحسب دقيقة بدقيقة (احتمال هدف في كل دقيقة = λ/90، يعني بواسون عملياً — نفس نموذج 7a0):
     λ لنا   = 1.4 + 0.08 × (هجومنا − قوة الخصم)
     λ علينا = 1.4 + 0.08 × (قوة الخصم − دفاعنا)     [محصورين بين 0.15 و 5]
   الهجوم والدفاع = متوسط موزون بمركز الخانة اللي اللاعب بيلعب فيها.
========================================================= */
(function(g){
"use strict";

/* ---------- ضبط المعادلة (كلها قابلة للمعايرة) ---------- */
var CFG={
  base:1.4,slope:0.08,minL:0.15,maxL:5,
  chemMax:3.5,        /* أقصى بونص كيمياء على الهجوم والدفاع (XI كامل من نفس الموسم) */
  chemSeason:1,chemClub:0.5,chemCap:3, /* نقاط الرابط: زميل من نفس الموسم = 1، من نفس النادي في موسم تاني = 0.5، سقف اللاعب 3 */
  oppOffset:0,        /* بيتضاف على قوة كل خصم (معايرة الصعوبة) */
  styleAdj:4.5,       /* هجومي: هجوم +4.5 ودفاع −4.5، والعكس للدفاعي */
  penBase:0.5,penSlope:0.012,penMin:0.1,penMax:0.9,defPen:0.04, /* الدفاعي أحسن شوية في الركلات */
  h1Rate:0.95,h2Rate:1.05, /* الأهداف أكتر شوية في الشوط التاني (المجموع = λ) */
  /* الأحداث العشوائية: احتمال حدوثها في مباراة 90 دقيقة (بتتوزع على الدقايق) */
  ev:{redThem:0.035,redUs:0.012,injUs:0.045,gkUs:0.05,gkThem:0.03,penUs:0.05,penThem:0.05,
      penConv:0.78,wonder:0.09,wonderCarry:0.5,injMax:2,
      pvpRed:0.02,pvpGk:0.04}
};
/* الأسلوب بيغيّر شخصية المباراة: احتمال هدف عكسي، كارت أحمر علينا، دراما متأخرة، ومعاناة آخر الوقت */
var STYLE_EV={
  attacking:{og:0.045,redUs:0.018,late:0.18,lateConcede:1.25},
  balanced:{og:0.025,redUs:0.012,late:0.11,lateConcede:1},
  defensive:{og:0.02,redUs:0.010,late:0.08,lateConcede:1}
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

/* 2 = مركزه الأساسي · 1 = مركزه البديل · 0 = مينفعش */
function fitKind(slotPos,p){return same(slotPos,p.pos)?2:(!!p.alt&&same(slotPos,p.alt))?1:0;}
/* لاعب في خانة i: يقدر يروح فين؟ (خانة فاضية مناسبة أو تبديل مع زميل لو الاتنين مناسبين) */
function relocations(slots,picks,i){
  var p=picks[i],out=[];
  if(!p)return out;
  slots.forEach(function(s){
    if(s.i===i||!fits(s.pos,p))return;
    var q=picks[s.i];
    if(!q)out.push({j:s.i,kind:"move",fit:fitKind(s.pos,p)});
    else if(fits(slots[i].pos,q))out.push({j:s.i,kind:"swap",with:q.n,fit:fitKind(s.pos,p)});
  });
  return out;
}

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
/* ---------- الكيمياء: روابط النادي والموسم بين اللاعبين المختارين ---------- */
function chemistry(slots,picks){
  var list=[],club={},seas={};
  slots.forEach(function(s){
    var p=picks[s.i];if(!p||!p.ab)return;
    var ks=p.ab+"|"+(p.ss||"");
    club[p.ab]=(club[p.ab]||0)+1;seas[ks]=(seas[ks]||0)+1;
  });
  var tot=0,n=0,per={};
  slots.forEach(function(s){
    var p=picks[s.i];if(!p)return;
    n++;
    if(!p.ab){per[s.i]=0;return;}
    var ks=p.ab+"|"+(p.ss||""),sameS=seas[ks]-1,sameC=club[p.ab]-seas[ks];
    var pts=Math.min(CFG.chemCap,sameS*CFG.chemSeason+sameC*CFG.chemClub);
    per[s.i]=pts;tot+=pts;
  });
  var frac=n?tot/(n*CFG.chemCap):0;
  return{frac:frac,bonus:frac*CFG.chemMax,per:per,max:CFG.chemCap};
}
function makeTeam(slots,picks,style){
  var xi=[],a=0,aw=0,d=0,dw=0,sum=0;
  slots.forEach(function(s){
    var p=picks[s.i];if(!p)return;
    var wa=WATT[s.pos],wd=WDEF[s.pos];
    a+=p.r*wa;aw+=wa;d+=p.r*wd;dw+=wd;sum+=p.r;
    xi.push({n:p.n,pos:s.pos,r:p.r});
  });
  var ch=chemistry(slots,picks);
  var A=aw?a/aw:0,D=dw?d/dw:0,adj=style==="attacking"?CFG.styleAdj:style==="defensive"?-CFG.styleAdj:0;
  return{xi:xi,A:A+adj+ch.bonus,D:D-adj+ch.bonus,ovr:xi.length?sum/xi.length:0,style:style||"balanced",aw:aw,dw:dw,chem:ch};
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
    id:season.id,comp:season.comp||"ucl",club:season.club,ab:season.ab,ss:season.ss,yr:season.yr,c:season.c,coach:season.coach,fin:season.fin};
}

/* ---------- الهدّافين ---------- */
function wpick(arr,wf,rnd){
  var tot=0,w=arr.map(function(p){var x=wf(p);tot+=x;return x;});
  if(!arr.length)return null;
  if(!tot)return arr[Math.floor(rnd()*arr.length)];
  var t=rnd()*tot;
  for(var i=0;i<arr.length;i++){t-=w[i];if(t<=0)return arr[i];}
  return arr[arr.length-1];
}
function scorerPick(xi,rnd,focus,out){
  var pool=xi.filter(function(p){return !(out&&out[p.n]);});
  if(!pool.length)pool=xi;
  return wpick(pool,function(p){
    var x=p.pos==="GK"?0:Math.max(WATT[p.pos],0.05)*Math.pow(Math.max(p.r-55,1),2);
    if(focus&&p.n===focus)x*=3;
    return x;
  },rnd);
}
function outfield(xi,out){return xi.filter(function(p){return p.pos!=="GK"&&!(out&&out[p.n]);});}

/* =========================================================
   المباراة خطوة بخطوة — دقيقة بدقيقة، والأحداث بتأثّر على اللي بعدها.
   beginLeg  : الشوط الأول (1–45)
   (قرار بين الشوطين من اللاعب)
   finishLeg : الشوط التاني (46–90) بعد تطبيق القرار
   settleTie : وقت إضافي (91–120) + ركلات ترجيح + الإحصاءات
   القرار بيغيّر احتمالات اللي جاي، مش اللي اتحسب فعلاً.
========================================================= */
function goalEv(T,us,min,n,tags){
  var g={n:n,min:min},k;
  if(tags)for(k in tags)g[k]=tags[k];
  (us?T.gUs:T.gThem).push(g);
  if(us)T.us++;else T.them++;
  var e={min:min,t:(tags&&tags.og)?"og":"goal",us:us?1:0,n:n};
  if(tags){if(tags.pen)e.pen=1;if(tags.w)e.w=1;}
  T.ev.push(e);
}
function playPeriod(rnd,m,from,to,T){
  T=T||m;
  var team=m.team,opp=m.opp,E=CFG.ev,sty=STYLE_EV[team.style]||STYLE_EV.balanced,osty=STYLE_EV[opp.style]||STYLE_EV.balanced,pvp=!!opp.pvp;
  var oppGK=opp.xi.filter(function(p){return p.pos==="GK";})[0]||opp.xi[0];
  var ourGK=team.xi.filter(function(p){return p.pos==="GK";})[0]||team.xi[0];
  for(var min=from;min<=to;min++){
    /* أحداث متجدولة (حارس + دراما متأخرة) */
    m.sched.forEach(function(s){
      if(s.done||s.min!==min)return;
      s.done=1;
      if(s.t==="gk"){
        if(s.us){m.mt*=0.72;T.ev.push({min:min,t:"gk",us:1,n:ourGK.n});}
        else{m.mu*=0.8;T.ev.push({min:min,t:"gk",us:0,n:oppGK.n});}
      }else if(s.t==="late"){m.late=true;T.ev.push({min:min,t:"late",us:-1});}
    });
    /* الأهداف */
    var lu=lambda(m.A,m.Do),lt=lambda(m.Ao,m.D),h=min<=45?CFG.h1Rate:min<=90?CFG.h2Rate:1;
    var ru=lu/90*h*m.mu,rt=lt/90*h*m.mt;
    if(m.late&&min>=80&&min<=90){ru*=1.6*osty.lateConcede;rt*=1.6*sty.lateConcede;}
    if(rnd()<ru){
      if(rnd()<osty.og){
        var d=wpick(outfield(opp.xi),function(p){return Math.max(WDEF[p.pos],0.05);},rnd)||opp.xi[0];
        goalEv(T,1,min,d.n,{og:1});
      }else{
        var sc=scorerPick(team.xi,rnd,m.focus,m.out),wd=rnd()<E.wonder;
        goalEv(T,1,min,sc.n,wd?{w:1}:null);
        if(wd)m.wonders=(m.wonders||0)+1;
      }
    }
    if(rnd()<rt){
      if(rnd()<sty.og){
        var o=wpick(outfield(team.xi,m.out),function(p){return Math.max(WDEF[p.pos],0.05);},rnd)||team.xi[0];
        goalEv(T,0,min,o.n,{og:1});
      }else{
        var sc2=scorerPick(opp.xi,rnd,m.focusB,m.outB),wd2=pvp&&rnd()<E.wonder;
        goalEv(T,0,min,sc2.n,wd2?{w:1}:null);
        if(wd2)m.wondersB=(m.wondersB||0)+1;
      }
    }
    /* باقي الأحداث: رمية واحدة في الدقيقة بتقسم على الاحتمالات */
    var x=rnd()*90,who;
    if((x-=(pvp?E.pvpRed+(osty.redUs-STYLE_EV.balanced.redUs):E.redThem))<0){
      if(!m.redThem){m.redThem=1;who=wpick(outfield(opp.xi,m.outB),function(){return 1;},rnd);
        if(pvp)m.outB[who.n]=1;m.mu*=1.3;m.mt*=0.75;T.ev.push({min:min,t:"red",us:0,n:who.n});}
    }else if((x-=(pvp?E.pvpRed:E.redUs)+(sty.redUs-STYLE_EV.balanced.redUs))<0){
      if(!m.redUs){m.redUs=1;who=wpick(outfield(team.xi,m.out),function(){return 1;},rnd);
        m.out[who.n]=1;m.mu*=0.75;m.mt*=1.3;T.ev.push({min:min,t:"red",us:1,n:who.n});}
    }else if((x-=E.injUs)<0){
      if((m.inj||0)<E.injMax){
        who=wpick(outfield(team.xi,m.out),function(){return 1;},rnd);
        if(who){
          m.inj=(m.inj||0)+1;m.out[who.n]=1;
          var drop=Math.max(who.r-72,4);
          m.A-=WATT[who.pos]*drop/(team.aw||1);m.D-=WDEF[who.pos]*drop/(team.dw||1);
          T.ev.push({min:min,t:"inj",us:1,n:who.n});
        }
      }
    }else if(pvp&&(x-=E.injUs)<0){
      if((m.injB||0)<E.injMax){
        who=wpick(outfield(opp.xi,m.outB),function(){return 1;},rnd);
        if(who){
          m.injB=(m.injB||0)+1;m.outB[who.n]=1;
          var dropB=Math.max(who.r-72,4);
          m.Ao-=WATT[who.pos]*dropB/(opp.aw||1);m.Do-=WDEF[who.pos]*dropB/(opp.dw||1);
          T.ev.push({min:min,t:"inj",us:0,n:who.n});
        }
      }
    }else if((x-=E.penUs)<0){
      var tk=scorerPick(team.xi,rnd,m.focus,m.out);
      T.ev.push({min:min,t:"pen",us:1,n:tk.n});
      if(rnd()<E.penConv)goalEv(T,1,min,tk.n,{pen:1});
      else T.ev.push({min:min,t:"pen-miss",us:1,n:tk.n,gk:oppGK.n});
    }else if((x-=E.penThem)<0){
      var tt=scorerPick(opp.xi,rnd,m.focusB,m.outB);
      T.ev.push({min:min,t:"pen",us:0,n:tt.n});
      if(rnd()<E.penConv)goalEv(T,0,min,tt.n,{pen:1});
      else T.ev.push({min:min,t:"pen-miss",us:0,n:tt.n,gk:ourGK.n});
    }
  }
}

function newCup(team,seed,ladder,opts){
  return{rnd:rngFrom(seed),seed:seed,team:team,ladder:ladder,opts:opts||{},carry:{A:0},decisions:[]};
}
function beginLeg(cup,si,k,prior){
  var rnd=cup.rnd,team=cup.team,opp=cup.ladder[si],st=(cup.stages||STAGES)[si],sty=STYLE_EV[team.style]||STYLE_EV.balanced,E=CFG.ev,pvp=!!opp.pvp;
  var m={si:si,k:k,legs:st.legs,team:team,opp:opp,us:0,them:0,gUs:[],gThem:[],ev:[],
    A:team.A+(cup.carry.A||0),D:team.D,O:opp.O+CFG.oppOffset,
    mu:1,mt:1,late:false,out:{},outB:{},focus:null,focusB:null,wonders:0,wondersB:0,inj:0,injB:0,redUs:0,redThem:0,decisionB:null,
    pre:prior||{us:0,them:0},sched:[],decision:null,ht:null,carried:cup.carry.A||0};
  cup.carry.A=0;
  m.Ao=pvp?opp.A+(cup.carryB||0):m.O;m.Do=pvp?opp.D:m.O;
  if(pvp)cup.carryB=0;
  if(rnd()<(pvp?E.pvpGk:E.gkUs))m.sched.push({min:20+Math.floor(rnd()*60),t:"gk",us:1});
  if(rnd()<(pvp?E.pvpGk:E.gkThem))m.sched.push({min:20+Math.floor(rnd()*60),t:"gk",us:0});
  if(rnd()<(pvp?(sty.late+(STYLE_EV[opp.style]||STYLE_EV.balanced).late)/2:sty.late))m.sched.push({min:80,t:"late"});
  playPeriod(rnd,m,1,45);
  m.ht={us:m.us,them:m.them};
  return m;
}

/* ---------- قرارات بين الشوطين ---------- */
function htOptions(m,side){
  var b=side==="b",sg=b?-1:1;
  var md=sg*(m.us-m.them),ad=sg*(m.pre?m.pre.us-m.pre.them:0)+md;
  var ctx=ad<0?"trailing":ad>0?"leading":"level",o;
  var stay={id:"stay",name:"Stay the course",note:"Trust the XI. No change.",us:1,them:1};
  if(ctx==="trailing")o=[
    {id:"allout",name:"All-out attack",note:"Chances at both ends. High risk, high reward.",us:1.3,them:1.25},
    {id:"counter",name:"Change the plan",note:"Compact shape, hit them on the break.",us:1.08,them:0.82},stay];
  else if(ctx==="leading")o=[
    {id:"protect",name:"Protect the lead",note:"Drop deep, shut the game down.",us:0.78,them:0.66},
    {id:"press",name:"Keep the pressure",note:"Go for the killer goal. Leaves space behind.",us:1.15,them:1.1},stay];
  else o=[
    {id:"gowin",name:"Go for the win",note:"Push higher. More goals, both ways.",us:1.22,them:1.15},
    {id:"control",name:"Take control",note:"Keep the ball, wait for the opening.",us:0.97,them:0.85},stay];
  var keys=(b?m.opp.xi:m.team.xi).filter(function(p){return p.pos!=="GK"&&!(b?m.outB:m.out)[p.n];})
    .sort(function(a,b){return WATT[b.pos]*b.r-WATT[a.pos]*a.r;}).slice(0,3);
  return{ctx:ctx,diff:ad,md:md,two:m.legs>1,opts:o,keys:keys};
}
function finishLeg(cup,m,dec,decB){
  var rnd=cup.rnd;
  if(dec&&dec.opt){
    var o=htOptions(m).opts.filter(function(x){return x.id===dec.opt;})[0];
    if(o){m.mu*=o.us;m.mt*=o.them;m.decision={opt:o.id,name:o.name};}
  }
  if(dec&&dec.key){m.focus=dec.key;m.mu*=1.04;if(m.decision)m.decision.key=dec.key;else m.decision={opt:"stay",name:"Stay the course",key:dec.key};}
  if(m.decision)cup.decisions.push({si:m.si,k:m.k,opt:m.decision.opt,key:m.decision.key||null});
  /* المنافس (أونلاين): نفس القرارات بس من وجهة نظره، يعني us/them معكوسين */
  if(decB&&decB.opt){
    var ob=htOptions(m,"b").opts.filter(function(x){return x.id===decB.opt;})[0];
    if(ob){m.mt*=ob.us;m.mu*=ob.them;m.decisionB={opt:ob.id,name:ob.name};}
  }
  if(decB&&decB.key){m.focusB=decB.key;m.mt*=1.04;if(m.decisionB)m.decisionB.key=decB.key;else m.decisionB={opt:"stay",name:"Stay the course",key:decB.key};}
  playPeriod(rnd,m,46,90);
  if(m.wonders)cup.carry.A=Math.min(1,(cup.carry.A||0)+CFG.ev.wonderCarry*m.wonders);
  if(m.wondersB)cup.carryB=Math.min(1,(cup.carryB||0)+CFG.ev.wonderCarry*m.wondersB);
  return m;
}

var PEN_SCORES=[[5,4],[4,3],[5,3],[4,2],[3,2],[3,1],[6,5],[7,6],[5,4],[4,3]];
function penWinProb(team,opp){
  return clamp(CFG.penBase+CFG.penSlope*(team.ovr-opp.O)+(team.style==="defensive"?CFG.defPen:0)-(opp.style==="defensive"?CFG.defPen:0),CFG.penMin,CFG.penMax);
}
function playPens(rnd,team,opp){
  var win=rnd()<penWinProb(team,opp),s=PEN_SCORES[Math.floor(rnd()*PEN_SCORES.length)];
  return{us:win?s[0]:s[1],them:win?s[1]:s[0],win:win};
}

/* ---------- نهاية المواجهة: وقت إضافي + ركلات + إحصاء ---------- */
function settleTie(cup,si,L){
  var rnd=cup.rnd,team=cup.team,opp=cup.ladder[si],legs=L.length,aggUs=0,aggThem=0,et=null,pens=null;
  L.forEach(function(m){aggUs+=m.us;aggThem+=m.them;});
  if(aggUs===aggThem){
    var last=L[legs-1];
    last.mu=1;last.mt=1;last.late=false;last.sched=[];           /* القرار ما بيكملش للوقت الإضافي */
    et={us:0,them:0,gUs:[],gThem:[],ev:[]};
    playPeriod(rnd,last,91,120,et);
    aggUs+=et.us;aggThem+=et.them;
    if(aggUs===aggThem)pens=playPens(rnd,team,opp);
  }
  var adv=pens?pens.win:aggUs>aggThem;
  var wins=0,draws=0,losses=0,conceded=0,scored=0;
  L.forEach(function(m,k){
    var fu=m.us+(k===legs-1&&et?et.us:0),ft=m.them+(k===legs-1&&et?et.them:0);
    m.fUs=fu;m.fThem=ft;scored+=fu;conceded+=ft;
    if(fu>ft)wins++;else if(fu<ft)losses++;else draws++;
  });
  L.forEach(function(m){delete m.team;delete m.opp;delete m.sched;delete m.out;delete m.outB;});
  return{legs:L,aggUs:aggUs,aggThem:aggThem,et:et,pens:pens,adv:adv,
    wins:wins,draws:draws,losses:losses,scored:scored,conceded:conceded};
}

/* ---------- الخصوم ---------- */
/* سلم الصعوبة: كل دور من شريحة أقوى (من أضعف 20% للنهائي في أقوى 20%) */
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
/* براكيت عشوائي: 5 أندية مختلفة من كل التاريخ، من غير أي ترتيب بالقوة */
function buildRandom(rnd,seasons){
  var order=shuffled(seasons,rnd),used={},out=[];
  for(var i=0;i<order.length&&out.length<STAGES.length;i++){
    if(used[order[i].ab])continue;
    used[order[i].ab]=1;out.push(oppTeam(order[i]));
  }
  return out;
}
function eraPool(seasons,era){
  if(era!=="modern")return seasons;
  var m=seasons.filter(function(s){return s.yr>=1992;});
  return m.length>=STAGES.length+3?m:seasons;
}

/* فلتر البطولات: comps = قايمة من ucl/uel/uecl (فاضية = الكل). كل موسم ليه comp (الافتراضي ucl). */
var COMP_IDS=["ucl","uel","uecl"];
function compOf(s){var c=s&&(s.comp||s.cp);return COMP_IDS.indexOf(c)>-1?c:"ucl";}
function poolFor(seasons,era,comps){
  var list=seasons;
  if(comps&&comps.length&&comps.length<COMP_IDS.length)list=seasons.filter(function(s){return comps.indexOf(compOf(s))>-1;});
  if(!list.length)list=seasons;
  return eraPool(list,era);
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
function tally(res){
  var tot={wins:0,draws:0,losses:0,scored:0,conceded:0,played:0};
  res.stages.forEach(function(r){var t=r.tie;tot.wins+=t.wins;tot.draws+=t.draws;tot.losses+=t.losses;tot.scored+=t.scored;tot.conceded+=t.conceded;tot.played+=r.stage.legs;});
  return tot;
}
function finishCup(cup,out,champion,outAt){
  var t=tally({stages:out});
  var res={seed:cup.seed,stages:out,champion:champion,outAt:outAt,played:t.played,
    wins:t.wins,draws:t.draws,losses:t.losses,scored:t.scored,conceded:t.conceded,
    bracket:cup.opts.bracket||"ladder",decisions:cup.decisions};
  res.tier=tierOf(res);
  return res;
}
function makeLadder(rnd,seasons,opts){
  return(opts&&opts.bracket==="random")?buildRandom(rnd,seasons):buildLadder(rnd,seasons);
}
function createCup(team,seed,seasons,opts){
  var rnd=rngFrom(seed);
  /* نفس الـ rnd بيكمل بعد السلم عشان المباريات تفضل حتمية بالـ seed */
  var cup=newCup(team,seed,[],opts);
  cup.rnd=rnd;cup.ladder=makeLadder(rnd,seasons,opts);
  return cup;
}
/* ---------- لاعب ضد لاعب (أونلاين): كل طرف تشكيلته، ونفس الـ seed عند الاتنين ---------- */
function pvpOpp(team,meta){
  meta=meta||{};
  return{pvp:1,xi:team.xi.map(function(p){return{n:p.n,pos:p.pos,r:p.r};}),O:team.ovr,A:team.A,D:team.D,aw:team.aw,dw:team.dw,
    style:team.style,club:meta.name||"Opponent",ab:meta.ab||"OPP",ss:meta.ss||"",c:meta.c||["#4f7cff","#ffffff"]};
}
function createVs(seed,tA,tB,legs,metaB){
  var cup=newCup(tA,seed,[pvpOpp(tB,metaB)],{});
  cup.stages=[{id:"VS",name:"Head to head",short:"MATCH",legs:legs}];
  return cup;
}
/* بيبني المباراة من الصفر بالقرارات المعروفة لحد دلوقتي. لو قرار ناقص بيقف عند الاستراحة (pending).
   decide(k) → {a:{opt,key}|null, b:{opt,key}|null, ready:bool}. نفس المدخلات = نفس النتيجة عند الطرفين. */
function buildVs(seed,tA,tB,legs,metaB,decide){
  var cup=createVs(seed,tA,tB,legs,metaB),L=[],k;
  for(k=0;k<legs;k++){
    var pr={us:0,them:0};L.forEach(function(x){pr.us+=x.us;pr.them+=x.them;});
    var m=U_begin(cup,k,pr),d=decide(k);
    L.push(m);
    if(!d||!d.ready)return{cup:cup,legs:L,tie:null,pending:k};
    finishLeg(cup,m,d.a||null,d.b||null);
  }
  return{cup:cup,legs:L,tie:settleTie(cup,0,L),pending:-1};
}
function U_begin(cup,k,pr){return beginLeg(cup,0,k,pr);}

/* محاكاة كاملة من غير قرارات (الوضع السريع والاختبارات). opts.decide(m,cup) اختياري. */
function runCup(team,seed,seasons,opts){
  var cup=createCup(team,seed,seasons,opts),out=[],champion=true,outAt=-1;
  for(var i=0;i<STAGES.length;i++){
    var st=STAGES[i],legs=[],k;
    for(k=0;k<st.legs;k++){
      var prior={us:0,them:0};legs.forEach(function(x){prior.us+=x.us;prior.them+=x.them;});
      var m=beginLeg(cup,i,k,prior);
      finishLeg(cup,m,opts&&opts.decide?opts.decide(m,cup):null);
      legs.push(m);
    }
    var tie=settleTie(cup,i,legs);
    out.push({stage:st,opp:cup.ladder[i],tie:tie});
    if(!tie.adv){champion=false;outAt=i;break;}
  }
  return finishCup(cup,out,champion,outAt);
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

var API={CFG:CFG,STYLE_EV:STYLE_EV,POS:POS,WATT:WATT,WDEF:WDEF,FORMATIONS:FORMATIONS,FORMATION_IDS:FORMATION_IDS,STYLES:STYLES,
  STAGES:STAGES,TOTAL_MATCHES:TOTAL_MATCHES,slotsFor:slotsFor,fits:fits,fitKind:fitKind,relocations:relocations,pickable:pickable,rngFrom:rngFrom,
  poisson:poisson,lambda:lambda,makeTeam:makeTeam,chemistry:chemistry,seasonStrength:seasonStrength,oppTeam:oppTeam,
  penWinProb:penWinProb,buildLadder:buildLadder,buildRandom:buildRandom,eraPool:eraPool,poolFor:poolFor,compOf:compOf,COMP_IDS:COMP_IDS,
  createCup:createCup,createVs:createVs,buildVs:buildVs,pvpOpp:pvpOpp,beginLeg:beginLeg,finishLeg:finishLeg,settleTie:settleTie,htOptions:htOptions,finishCup:finishCup,
  runCup:runCup,tierOf:tierOf,tally:tally,
  drawSeason:drawSeason,rerollTeam:rerollTeam,rerollSeason:rerollSeason,seasonAlternatives:seasonAlternatives};
g.UCL=API;
if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
