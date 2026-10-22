/* اختبار محرك أبطال أوروبا + معايرة الصعوبة. run: node js/ucl.test.js [--calib] */
const U=require("./ucl-engine.js"),D=require("./ucl-data.js");
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
console.log("UCL tests: "+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
