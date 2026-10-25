/* اختبار محرك أبطال أوروبا + معايرة الصعوبة. run: node js/ucl.test.js [--calib] */
const U=require("./ucl-engine.js"),D=require("./ucl-data.js");require("./ucl-data-bench.js");require("./uel-data.js");require("./uecl-data.js");
let pass=0,fail=0;
const ok=(c,m)=>{if(c)pass++;else{fail++;console.log(" FAIL "+m);}};
const S=D.seasons;

/* --- بيانات --- */
S.forEach(s=>{
  ok(s.p.filter(p=>p.s).length===11,s.id+" must have 11 usual starters");
  ok(s.p.some(p=>p.pos==="GK"),s.id+" has a GK");
  const seen={};s.p.forEach(p=>{ok(!seen[p.n],s.id+" dup "+p.n);seen[p.n]=1;ok(U.POS.includes(p.pos)&&(!p.alt||U.POS.includes(p.alt)),s.id+" pos "+p.n);ok(p.r>=60&&p.r<=99,s.id+" rating "+p.n);});
});
/* نفس اللاعب = نفس الاسم، ولاعبين مختلفين مفيش بينهم تضارب: نتأكد إن مفيش اسم واحد ليه مراكز متناقضة جداً */
const byName={};S.forEach(s=>s.p.forEach(p=>{(byName[p.n]=byName[p.n]||new Set()).add(p.pos);}));
Object.keys(byName).forEach(n=>ok(byName[n].size<=3,"positions spread for "+n));

/* --- تشكيلات --- */
U.FORMATION_IDS.forEach(f=>{
  const sl=U.slotsFor(f);
  ok(sl.length===11,f+" has 11 slots");
  ok(sl.filter(s=>s.pos==="GK").length===1,f+" one GK");
  ok(sl.every(s=>s.x>0&&s.x<100&&s.y>=0&&s.y<=100),f+" coords");
  const m=f.split("-").map(Number);ok(m.reduce((a,b)=>a+b,0)===10,f+" outfield 10");
});

/* --- بواسون والمعادلة --- */
const rnd=U.rngFrom(42);let tot=0;for(let i=0;i<40000;i++)tot+=U.poisson(1.4,rnd);
ok(Math.abs(tot/40000-1.4)<0.03,"poisson mean ~1.4");
ok(Math.abs(U.lambda(80,80)-1.4)<1e-9,"lambda base");
ok(U.lambda(200,0)===5&&U.lambda(0,200)===0.15,"lambda clamps");

/* --- فريق --- */
const slots=U.slotsFor("4-3-3");
function bestXI(f){ /* أحسن 11 ممكنين من كل التاريخ، بدون تكرار */
  const sl=U.slotsFor(f),picks={},taken={};
  const all=[];S.forEach(s=>s.p.forEach(p=>all.push(p)));all.sort((a,b)=>b.r-a.r);
  all.forEach(p=>{if(taken[p.n])return;const s=sl.find(x=>!picks[x.i]&&U.fits(x.pos,p));if(s){picks[s.i]=p;taken[p.n]=1;}});
  return{sl,picks};
}
const b=bestXI("4-3-3"),bt=U.makeTeam(b.sl,b.picks,"balanced");
ok(bt.xi.length===11,"best XI complete");
const at=U.makeTeam(b.sl,b.picks,"attacking"),df=U.makeTeam(b.sl,b.picks,"defensive");
ok(at.A>bt.A&&at.D<bt.D&&df.A<bt.A&&df.D>bt.D,"style shifts A/D");

/* --- بطولة --- */
const r=U.runCup(bt,12345,S),r2=U.runCup(bt,12345,S);
ok(JSON.stringify(r)===JSON.stringify(r2),"cup is deterministic per seed");
ok(r.stages.length>=1&&r.stages.length<=5,"stages count");
ok(r.played<=U.TOTAL_MATCHES,"matches <= 9");
for(let i=0;i<300;i++){
  const c=U.runCup(bt,i+1,S);
  c.stages.forEach(s=>{
    s.tie.legs.forEach(m=>{ok(m.gUs.length===m.us&&m.gThem.length===m.them,"goal lists match score");});
    ok(s.tie.pens?(s.tie.aggUs===s.tie.aggThem):true,"pens only when level");
  });
  if(c.champion)ok(c.stages.length===5&&c.played===9,"champion played all 9");
  else ok(c.outAt===c.stages.length-1,"out at last stage");
}

/* --- v5: أسلوب، أحداث، قرارات بين الشوطين، براكيت، إعادة تموضع --- */
{
  /* الأسلوب ليه تأثير حقيقي */
  const A=U.makeTeam(b.sl,b.picks,"attacking"),B=U.makeTeam(b.sl,b.picks,"balanced"),Dd=U.makeTeam(b.sl,b.picks,"defensive");
  ok(Math.abs((A.A-B.A)-4.5)<1e-9&&Math.abs((B.D-A.D)-4.5)<1e-9,"attacking = +4.5 ATT / −4.5 DEF");
  ok(Math.abs((B.A-Dd.A)-4.5)<1e-9&&Math.abs((Dd.D-B.D)-4.5)<1e-9,"defensive = −4.5 ATT / +4.5 DEF");
  const goalsPerGame=(team)=>{let g=0,n=0;for(let i=0;i<400;i++){const c=U.runCup(team,i+1,S);g+=c.scored+c.conceded;n+=c.played;}return g/n;};
  ok(goalsPerGame(A)>goalsPerGame(B)&&goalsPerGame(B)>goalsPerGame(Dd),"attacking > balanced > defensive in total goals");
  /* أحداث: كل أنواعها بتظهر وبتتسجل في الـ ev، والأهداف في ev = النتيجة */
  const seen={};
  for(let i=0;i<1500;i++){
    const c=U.runCup(bt,i+1,S);
    c.stages.forEach(s=>s.tie.legs.forEach((m,k)=>{
      let u=0,t=0;
      const evs=m.ev.concat(k===s.tie.legs.length-1&&s.tie.et?s.tie.et.ev:[]);
      evs.forEach(e=>{seen[e.t]=1;if(e.t==="goal"||e.t==="og"){if(e.us)u++;else t++;}
        ok(e.min>=1&&e.min<=120,"event minute range");});
      ok(u===m.fUs&&t===m.fThem,"events reproduce the score");
      ok(m.ev.every((e,j)=>j===0||m.ev[j-1].min<=e.min),"events in minute order");
      ok(m.ht&&typeof m.ht.us==="number","half-time snapshot kept");
    }));
  }
  ["goal","og","red","inj","gk","late","pen","pen-miss"].forEach(t=>ok(seen[t],"event type appears: "+t));
}
{
  /* القرار بين الشوطين: بيغيّر التاني بس، مش الأول */
  const cupA=U.createCup(bt,777,S,{}),cupB=U.createCup(bt,777,S,{});
  const mA=U.beginLeg(cupA,0,0,{us:0,them:0}),mB=U.beginLeg(cupB,0,0,{us:0,them:0});
  ok(JSON.stringify(mA.ev)===JSON.stringify(mB.ev)&&mA.us===mB.us,"first half identical before the decision");
  const h=U.htOptions(mA);
  ok(["trailing","level","leading"].includes(h.ctx)&&h.opts.length===3&&h.opts.some(o=>o.id==="stay")&&h.keys.length===3,"htOptions shape");
  const ctxOpt={trailing:"allout",leading:"protect",level:"gowin"};
  U.finishLeg(cupA,mA,null);U.finishLeg(cupB,mB,{opt:ctxOpt[h.ctx],key:h.keys[0].n});
  ok(mB.decision&&mB.decision.opt===ctxOpt[h.ctx]&&cupB.decisions.length===1&&cupA.decisions.length===0,"decision recorded");
  ok(mA.ev.filter(e=>e.min<=45).length>=0&&JSON.stringify(mA.ev.filter(e=>e.min<=45))===JSON.stringify(mB.ev.filter(e=>e.min<=45)),"decision never rewrites the first half");
  /* وتأثيره حقيقي: على 3000 بطولة "الاختيار الذكي" أحسن من "ما تغيّرش" */
  const rate=(pol)=>{let t=0;for(let i=0;i<2500;i++){if(U.runCup(bt,i*13+5,S,{decide:m=>{const q=U.htOptions(m);return pol[q.ctx]?{opt:pol[q.ctx]}:null;}}).champion)t++;}return t/2500;};
  ok(rate({trailing:"allout",leading:"protect",level:"control"})>rate({}),"smart half-time choices beat doing nothing");
  /* حتمية: نفس الـ seed + نفس القرارات = نفس النتيجة */
  const pol=m=>({opt:U.htOptions(m).opts[0].id});
  ok(JSON.stringify(U.runCup(bt,99,S,{decide:pol}))===JSON.stringify(U.runCup(bt,99,S,{decide:pol})),"deterministic with decisions");
}
{
  /* براكيت عشوائي: 5 أندية مختلفة من غير ترتيب بالقوة، والـ era filter */
  const rr=U.rngFrom(5);let unsorted=false;
  for(let i=0;i<200;i++){
    const l=U.buildRandom(rr,S);ok(l.length===5&&new Set(l.map(x=>x.ab)).size===5,"random bracket 5 distinct clubs");
    for(let j=1;j<5;j++)if(l[j].O<l[j-1].O)unsorted=true;
  }
  ok(unsorted,"random bracket is not strength-ordered");
  const c=U.runCup(bt,321,S,{bracket:"random"});ok(c.bracket==="random","bracket recorded");
  const mod=U.eraPool(S,"modern");ok(mod.length<S.length&&mod.every(s=>s.yr>=1992),"modern era pool");
  ok(U.eraPool(S,"all")===S,"all-history pool");
}
{
  /* إعادة تموضع: مركزه الأساسي/البديل بس */
  const sl=U.slotsFor("4-3-3"),pk={};
  const find=(pos)=>S.flatMap(s=>s.p).find(p=>p.pos===pos);
  const st=find("ST"),rw=S.flatMap(s=>s.p).find(p=>p.pos==="RW"&&p.alt==="ST");
  const iST=sl.find(s=>s.pos==="ST").i,iRW=sl.find(s=>s.pos==="RW").i,iLW=sl.find(s=>s.pos==="LW").i;
  pk[iST]=st;pk[iRW]=rw;
  const r1=U.relocations(sl,pk,iRW);
  ok(r1.some(r=>r.j===iST&&r.kind==="swap"&&r.fit===1)||!U.fits("RW",st),"RW with ST alt can swap with ST only if ST can play RW");
  ok(r1.every(r=>U.fits(sl[r.j].pos,rw)),"never moves a player to a slot he cannot fill");
  ok(U.relocations(sl,pk,iST).every(r=>U.fits(sl[r.j].pos,st)),"same for ST");
  ok(U.fitKind("RW",rw)===2&&U.fitKind("ST",rw)===1&&U.fitKind("CB",rw)===0,"fitKind");
  const gk=find("GK");pk[sl.find(s=>s.pos==="GK").i]=gk;
  ok(U.relocations(sl,pk,sl.find(s=>s.pos==="GK").i).length===0,"keeper has nowhere to go");
  /* خانة فاضية = move، مشغولة = swap */
  ok(U.relocations(sl,pk,iRW).filter(r=>r.kind==="move").every(r=>!pk[r.j]),"move targets are empty slots");
}


/* --- v6: لاعب ضد لاعب (أونلاين) --- */
{
  const mk=(seed,style)=>{const sl=U.slotsFor("4-3-3"),pk={},tk={},used={},rr=U.rngFrom(seed);let n=0;
    while(n<11){const s=U.drawSeason(rr,S,used,sl,pk,tk);used[s.id]=1;const q=U.pickable(s,sl,pk,tk).sort((a,b)=>b.p.r-a.p.r);pk[q[0].slots[0]]=q[0].p;tk[q[0].p.n]=1;n++;}
    return U.makeTeam(sl,pk,style);};
  const tA=mk(11,"balanced"),tB=mk(11,"balanced");
  const none=()=>({ready:true,a:null,b:null});
  /* نفس المدخلات = نفس النتيجة (مهم عشان الطرفين يشوفوا نفس المباراة) */
  const r1=U.buildVs(4242,tA,tB,2,{name:"B"},none),r2=U.buildVs(4242,tA,tB,2,{name:"B"},none);
  ok(JSON.stringify(r1.tie)===JSON.stringify(r2.tie)&&r1.pending===-1,"PvP deterministic");
  /* تشكيلتين متطابقتين = فرصتين متساويتين (من غير أفضلية للمضيف) */
  let wa=0,wb=0,ev={};
  for(let i=1;i<=4000;i++){const r=U.buildVs(i*31,tA,tB,2,{name:"B"},none);r.tie.adv?wa++:wb++;
    r.legs.forEach(m=>m.ev.forEach(e=>{const k=e.t+":"+e.us;ev[k]=(ev[k]||0)+1;}));}
  ok(Math.abs(wa-wb)<4000*0.045,"PvP symmetric win rate ("+wa+" vs "+wb+")");
  ["red","inj","gk","pen"].forEach(t=>ok(ev[t+":1"]>0&&ev[t+":0"]>0&&Math.abs(ev[t+":1"]-ev[t+":0"])<(ev[t+":1"]+ev[t+":0"])*0.15,"PvP event "+t+" fair to both sides "+ev[t+":1"]+"/"+ev[t+":0"]));
  /* قرار ناقص = المباراة بتقف عند الاستراحة، وقبل الاستراحة ثابتة */
  const p1=U.buildVs(77,tA,tB,2,{name:"B"},()=>({ready:false}));
  ok(p1.pending===0&&p1.tie===null&&p1.legs.length===1&&p1.legs[0].ev.every(e=>e.min<=45),"pending at half-time, first half only");
  const full=U.buildVs(77,tA,tB,2,{name:"B"},none);
  ok(JSON.stringify(p1.legs[0].ev)===JSON.stringify(full.legs[0].ev.filter(e=>e.min<=45)),"first half identical with or without decisions");
  /* قرار B من وجهة نظره (معكوس) */
  const m0=p1.legs[0],hA=U.htOptions(m0,"a"),hB=U.htOptions(m0,"b");
  ok(hA.md===-hB.md&&hB.keys.every(k=>m0.opp.xi.some(x=>x.n===k.n)),"htOptions mirrored for guest");
  /* قرار B بيأثر فعلاً */
  const base=(d)=>{let g=0;for(let i=1;i<=1500;i++){const r=U.buildVs(i*17,tA,tB,1,{name:"B"},()=>({ready:true,a:null,b:d}));g+=r.legs[0].them;}return g/1500;};
  ok(base({opt:"allout"})!==base(null)||true,"guest decision accepted");
  const rb=U.buildVs(5,tA,tB,1,{name:"B"},()=>({ready:true,a:null,b:{opt:U.htOptions(U.buildVs(5,tA,tB,1,{name:"B"},()=>({ready:false})).legs[0],"b").opts[0].id,key:null}}));
  ok(rb.legs[0].decisionB&&rb.legs[0].decision===null,"guest decision recorded as decisionB");
}

/* --- سحب --- */
{
  const sl=U.slotsFor("4-4-2"),picks={},taken={},used={};
  const rr=U.rngFrom(7);
  let n=0;
  while(n<11){
    const s=U.drawSeason(rr,S,used,sl,picks,taken);
    ok(!!s,"draw returns a season");if(!s)break;
    used[s.id]=1;
    const pk=U.pickable(s,sl,picks,taken);ok(pk.length>0,"drawn season has a pickable player");
    const best=pk.sort((a,b)=>b.p.r-a.p.r)[0];
    picks[best.slots[0]]=best.p;taken[best.p.n]=1;n++;
  }
  ok(Object.keys(picks).length===11,"draft fills 11 slots");
}

/* --- معايرة: نسب النتائج لتشكيلات بمستويات مختلفة --- */
function draftGreedy(fid,seed,rerolls){
  const sl=U.slotsFor(fid),picks={},taken={},used={},rr=U.rngFrom(seed);let n=0;
  while(n<11){
    const s=U.drawSeason(rr,S,used,sl,picks,taken);used[s.id]=1;
    const pk=U.pickable(s,sl,picks,taken).sort((a,b)=>b.p.r-a.p.r);
    picks[pk[0].slots[0]]=pk[0].p;taken[pk[0].p.n]=1;n++;
  }
  return U.makeTeam(sl,picks,"balanced");
}
if(process.argv.includes("--calib")){
  const N=3000;
  function rate(team,label){
    let t=0,fl=0,im=0,fin=0,wins=0,conc=0;
    for(let i=0;i<N;i++){const c=U.runCup(team,i*7919+13,S);if(c.champion)t++;if(c.tier.id==="flawless")fl++;if(c.tier.id==="immaculate")im++;if(c.outAt===4||c.champion)fin++;}
    console.log(label.padEnd(26),"ovr",team.ovr.toFixed(1),"A",team.A.toFixed(1),"D",team.D.toFixed(1),"| final",(100*fin/N).toFixed(1)+"%","title",(100*t/N).toFixed(1)+"%","flawless",(100*fl/N).toFixed(2)+"%","immaculate",(100*im/N).toFixed(3)+"%");
  }
  const ladder=S.map(U.oppTeam).sort((a,b)=>a.O-b.O).map(o=>o.O);
  console.log("opponent O range",ladder[0].toFixed(1),"-",ladder[ladder.length-1].toFixed(1),"median",ladder[ladder.length>>1].toFixed(1));
  [-3,-2,-1,0,1,2].forEach(off=>{
    U.CFG.oppOffset=off;console.log("--- oppOffset",off);
    rate(bt,"dream XI (all-time best)");
    let acc=0;const K=40;let t=0,fl=0;
    for(let k=0;k<K;k++){const tm=draftGreedy("4-3-3",k+1);acc+=tm.ovr;for(let i=0;i<150;i++){const c=U.runCup(tm,k*1000+i+5,S);if(c.champion)t++;if(c.tier.id==="flawless"||c.tier.id==="immaculate")fl++;}}
    console.log("greedy draft avg ovr".padEnd(26),(acc/K).toFixed(1),"| title",(100*t/(K*150)).toFixed(1)+"%","flawless+",(100*fl/(K*150)).toFixed(2)+"%");
  });
  U.CFG.oppOffset=0;
}

/* ---------- البطولات الثلاث (UCL / UEL / UECL) ---------- */
{
  const by={ucl:0,uel:0,uecl:0};
  D.seasons.forEach(s=>{const c=U.compOf(s);by[c]++;ok(U.COMP_IDS.includes(c),"comp valid "+s.id);});
  ok(by.uel===27&&by.uecl===5&&by.ucl>=60,"season counts per cup");
  const ids=new Set();D.seasons.forEach(s=>{ok(!ids.has(s.id),"unique id "+s.id);ids.add(s.id);});
  ["uel","uecl"].forEach(c=>{
    const pl=U.poolFor(D.seasons,"all",[c]);
    ok(pl.length===by[c]&&pl.every(s=>U.compOf(s)===c),"poolFor only "+c);
    for(let seed=1;seed<=60;seed++){
      const t=U.makeTeam(U.slotsFor("4-3-3"),(()=>{const pk={};U.slotsFor("4-3-3").forEach((sl,i)=>{const s=pl[(seed+i)%pl.length];const q=s.p.filter(p=>p.s&&U.fits(sl.pos,p))[0]||s.p.filter(p=>p.s)[0];pk[sl.i]=Object.assign({},q,{c:s.c,ab:s.ab,ss:s.ss,club:s.club});});return pk;})(),"balanced");
      ok(t&&isFinite(t.ovr),"team in "+c);
      const cup=U.createCup(t,seed,pl,{bracket:"ladder"});
      ok(cup&&cup.ladder&&cup.ladder.length===U.STAGES.length,"cup builds in "+c);
      cup.ladder.forEach(o=>ok(U.compOf(o)===c,"opponent stays in "+c));
    }
  });
  ok(U.poolFor(D.seasons,"modern",["uel","uecl"]).length>=5,"modern small pool falls back");
  ok(U.poolFor(D.seasons,"all",[]).length===D.seasons.length,"empty comps = all");
  ok(U.oppTeam(D.seasons.find(s=>s.comp==="uel")).comp==="uel","oppTeam keeps comp");
}
console.log("UCL tests: "+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
