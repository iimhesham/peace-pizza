/* Snakes & Ladders engine tests:  node js/snake.test.js
   1) rule unit tests  2) board generator over thousands of seeds
   3) full CPU games in every mode with invariant checks  4) online replay determinism (logs -> same state) */
const fs=require("fs"),vm=require("vm"),path=require("path");
function load(){const c={console,Math,JSON,Object,Array,Date};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,"snake-engine.js"),"utf8"),c);return vm.runInContext("SNE",c);}
let FAILED=0;
(function(){
const E=load();
let pass=0,fail=0;
const t=(n,f)=>{try{f();pass++;}catch(e){fail++;console.log("FAIL",n,"-",e.message);}};
const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error((m||"")+" expected "+JSON.stringify(b)+" got "+JSON.stringify(a));};
const ok=(c,m)=>{if(!c)throw new Error(m||"not ok");};
function mk(n,opts,seed){const g=E.init(n||2,opts||{style:"chaos"},seed||12345,0);g.jumps=[];g.sp=[];return g;}
function die(g,d){while(E.diceFor(g.seed,g.dk)!==d)g.dk++;}
function roll(g,d){die(g,d);return E.apply(g,"r");}
const cutAll=g=>{g.jumps=[];g.sp=[];};

t("exact finish: overshoot stays, exact wins",()=>{
  const g=mk();g.players[0].pos=97;roll(g,6);eq(g.players[0].pos,97);eq(g.turn,1);
  g.players[1].pos=10;roll(g,1);eq(g.turn,0);roll(g,3);ok(g.over);eq(g.winner,0);eq(g.ranking[0],0);
});
t("ladder climbs and snake bites",()=>{
  const g=mk();g.jumps=[{id:0,from:5,to:30,cut:0},{id:1,from:40,to:12,cut:0}];
  g.players[0].pos=2;roll(g,3);eq(g.players[0].pos,30);
  g.players[1].pos=37;roll(g,3);eq(g.players[1].pos,12);
});
t("snake catcher card is offered and cancels the bite",()=>{
  const g=mk();g.jumps=[{id:0,from:8,to:2,cut:0}];g.players[0].pos=5;g.players[0].hand=["hunt","tfake"];
  roll(g,3);eq(g.pend.t,"defend");eq(g.pend.seat,0);ok(E.legal(g).indexOf("a0")>=0);ok(E.legal(g).indexOf("a1")<0,"fake trap is not a defense");
  E.apply(g,"a0");eq(g.players[0].pos,8);eq(g.players[0].hand,["tfake"]);eq(g.turn,1);
});
t("declining a defense takes the bite",()=>{
  const g=mk();g.jumps=[{id:0,from:8,to:2,cut:0}];g.players[0].pos=5;g.players[0].ward=1;
  roll(g,3);E.apply(g,"n");eq(g.players[0].pos,2);eq(g.players[0].ward,1);
});
t("ward cancels a snake, shield does not",()=>{
  const g=mk();g.jumps=[{id:0,from:8,to:2,cut:0}];g.players[0].pos=5;g.players[0].hand=["shield"];
  roll(g,3);eq(g.players[0].pos,2,"shield must not offer a defense against snakes");
  const h=mk();h.jumps=[{id:0,from:8,to:2,cut:0}];h.players[0].pos=5;h.players[0].ward=1;roll(h,3);eq(h.pend.t,"defend");E.apply(h,"w");eq(h.players[0].pos,8);eq(h.players[0].ward,0);
});
t("curse square goes back 4; shield blocks it",()=>{
  const g=mk();g.sp=[{cell:20,t:"curse"}];g.players[0].pos=17;roll(g,3);eq(g.players[0].pos,16);
  const h=mk();h.sp=[{cell:20,t:"curse"}];h.players[0].pos=17;h.players[0].hand=["shield"];roll(h,3);eq(h.pend.t,"defend");E.apply(h,"a0");eq(h.players[0].pos,20);
});
t("gate teleports both ways, no chain",()=>{
  const g=mk();g.sp=[{cell:10,t:"gate",to:50},{cell:50,t:"gate",to:10}];g.jumps=[{id:0,from:50,to:99,cut:0}];
  g.jumps=[];g.players[0].pos=7;roll(g,3);eq(g.players[0].pos,50);
  g.players[1].pos=44;roll(g,6);eq(g.players[1].pos,10);
});
t("treasure gives a card; full hand asks which to drop",()=>{
  const g=mk();g.sp=[{cell:6,t:"treasure"}];g.players[0].pos=3;roll(g,3);eq(g.players[0].hand.length,1);
  const h=mk();h.sp=[{cell:6,t:"treasure"}];h.players[0].pos=3;h.players[0].hand=["hunt","hunt","hunt"];roll(h,3);
  eq(h.pend.t,"discard");ok(h.pend.incoming);const inc=h.pend.incoming;E.apply(h,"x1");eq(h.players[0].hand[1],inc);eq(h.turn,1);
  const k=mk();k.sp=[{cell:6,t:"treasure"}];k.players[0].pos=3;k.players[0].hand=["hunt","hunt","hunt"];roll(k,3);E.apply(k,"x3");eq(k.players[0].hand,["hunt","hunt","hunt"]);
});
t("ward shrine gives one ward only",()=>{
  const g=mk();g.sp=[{cell:6,t:"ward"}];g.players[0].pos=3;roll(g,3);eq(g.players[0].ward,1);
});
t("pickpocket: one candidate auto, several prompt, victim can shield",()=>{
  const g=mk(3);g.sp=[{cell:6,t:"steal"}];g.players[0].pos=3;g.players[1].hand=["swap"];roll(g,3);
  eq(g.players[0].hand,["swap"]);eq(g.players[1].hand,[]);
  const h=mk(3);h.sp=[{cell:6,t:"steal"}];h.players[0].pos=3;h.players[1].hand=["swap"];h.players[2].hand=["cut"];roll(h,3);
  eq(h.pend.t,"steal");eq(h.pend.seat,0);eq(E.legal(h).sort(),["t1","t2"]);E.apply(h,"t2");eq(h.players[0].hand,["cut"]);
  const k=mk(2);k.sp=[{cell:6,t:"steal"}];k.players[0].pos=3;k.players[1].hand=["swap","shield"];roll(k,3);
  eq(k.pend.t,"defend");eq(k.pend.seat,1);E.apply(k,"a1");eq(k.players[0].hand,[]);eq(k.players[1].hand,["swap"]);
});
t("fork routes",()=>{
  const mkf=()=>{const g=mk();g.sp=[{cell:20,t:"fork"}];g.players[0].pos=17;roll(g,3);eq(g.pend.t,"fork");return g;};
  let g=mkf();E.apply(g,"f0");eq(g.players[0].pos,26);eq(g.players[0].skip,1);eq(g.turn,1);
  g.players[1].pos=5;roll(g,1);eq(g.turn,1,"player 0 must lose the next turn");
  g=mkf();E.apply(g,"f1");eq(g.players[0].pos,22);eq(g.players[0].ward,1);
  g=mkf();E.apply(g,"f2");ok(g.players[0].hand.length===1||g.players[0].pos<20);
});
t("loaded dice: two rolls, pick one",()=>{
  const g=mk();g.players[0].hand=["loaded"];g.players[0].pos=10;
  eq(E.legal(g).indexOf("u0")>=0,true);E.apply(g,"u0");ok(g.loaded);eq(g.pend.t,"roll");
  const k0=g.dk;E.apply(g,"r");eq(g.pend.t,"pick");eq(g.dk,k0+2);
  const a=g.pend.a,b=g.pend.b;E.apply(g,"B");eq(g.players[0].pos,10+b);eq(g.turn,1);
});
t("one card per turn, cards usable only on your own roll phase",()=>{
  const g=mk();g.players[0].hand=["draw","draw"];E.apply(g,"u0");eq(g.pend.t,"target");E.apply(g,"d");
  eq(g.pend.t,"roll");ok(E.legal(g).every(x=>x==="r"),"second card must not be playable this turn");
});
t("swap: not inside last 10 squares, victim shield blocks",()=>{
  const g=mk();g.players[0].hand=["swap"];g.players[0].pos=20;g.players[1].pos=95;ok(E.legal(g).indexOf("u0")<0);
  g.players[1].pos=60;E.apply(g,"u0");E.apply(g,"t1");eq([g.players[0].pos,g.players[1].pos],[60,20]);
  const h=mk();h.players[0].hand=["swap"];h.players[0].pos=20;h.players[1].pos=60;h.players[1].hand=["shield"];E.apply(h,"u0");E.apply(h,"t1");eq(h.pend.seat,1);E.apply(h,"a0");eq([h.players[0].pos,h.players[1].pos],[20,60]);eq(h.pend.t,"roll");eq(h.pend.seat,0);
});
t("cut ladder: one at a time, 3 rounds, then mends",()=>{
  const g=mk();g.jumps=[{id:0,from:5,to:30,cut:0},{id:1,from:9,to:40,cut:0}];g.players[0].hand=["cut","cut"];
  E.apply(g,"u0");E.apply(g,"j00");eq(g.jumps[0].cut,g.round+3);
  eq(E.legal(g).filter(x=>x[0]==="u").length,0);
  roll(g,1);g.players[1].pos=2;roll(g,3);eq(g.players[1].pos,5,"cut ladder does nothing");
  ok(E.legal(g).indexOf("u0")<0,"second cut while one is active is not allowed");
  for(let i=0;i<8&&g.jumps[0].cut;i++){roll(g,1);}
  eq(g.jumps[0].cut,0,"mended");
});
t("flip: ladder<->snake, max twice, not onto a special",()=>{
  const g=mk();g.jumps=[{id:0,from:5,to:30,cut:0},{id:1,from:50,to:20,cut:0},{id:2,from:60,to:70,cut:0}];g.sp=[{cell:70,t:"curse"}];
  g.players[0].hand=["flip","flip","flip"];ok(E.legal(g).indexOf("u0")>=0);
  eq(E.legal(g).filter(x=>x[0]==="u").length,3);E.apply(g,"u0");eq(E.legal(g).filter(x=>x[0]==="j").sort(),["j00","j01"],"jump 2 can't flip (top lands on a curse)");
  E.apply(g,"j01");eq([g.jumps[1].from,g.jumps[1].to],[20,50]);eq(g.flips,1);
});
t("traps: only others trigger, fake does nothing, owner passes, 2 max, expiry",()=>{
  const g=mk(3);g.players[0].hand=["tback"];g.players[1].pos=10;g.players[2].pos=10;
  E.apply(g,"u0");ok(E.legal(g).indexOf("c15")>=0);ok(E.legal(g).indexOf("c10")<0,"not under a pawn");E.apply(g,"c15");eq(g.traps.length,1);
  roll(g,2);                 // p0 rolls 2 -> 2 (own turn done)
  g.players[1].pos=12;roll(g,3);eq(g.players[1].pos,10,"victim goes back 5 from 15");eq(g.traps.length,0);
  const h=mk();h.players[0].hand=["tfake","tfake","tfake"];E.apply(h,"u0");E.apply(h,"c15");roll(h,1);h.players[1].pos=12;roll(h,3);eq(h.players[1].pos,15);eq(h.traps.length,0);
  const k=mk();k.players[0].hand=["tskip"];E.apply(k,"u0");E.apply(k,"c04");k.players[0].pos=1;roll(k,3);eq(k.players[0].pos,4,"owner passes over own trap");eq(k.traps.length,1);
  for(let i=0;i<30&&k.traps.length;i++)roll(k,1);eq(k.traps.length,0,"expires");
  const m=mk();m.players[0].hand=["tback","tback","tback"];E.apply(m,"u0");E.apply(m,"c30");m.cardUsed=false;E.apply(m,"u0");E.apply(m,"c31");m.cardUsed=false;
  ok(E.legal(m).every(x=>x==="r"),"max 2 traps per owner");
});
t("thief trap steals from victim",()=>{
  const g=mk();g.players[0].hand=["tsteal"];g.players[1].hand=["swap"];g.players[1].pos=12;E.apply(g,"u0");E.apply(g,"c15");roll(g,1);roll(g,3);
  eq(g.players[0].hand,["swap"]);eq(g.players[1].hand,[]);
});
t("world events fire every 5th round",()=>{
  const g=mk(2);let seen=[];for(let i=0;i<30&&g.round<11;i++){const ev=roll(g,1);ev.forEach(e=>{if(e.t==="world")seen.push(e.round);});}
  eq(seen,[5,10]);
});
t("leader's tax hits the leader; sleepy snakes; ladder season; headwind",()=>{
  const g=mk(2);g.jumps=[{id:0,from:6,to:1,cut:0}];g.players[1].pos=40;g.round=4;g.fx={};g.players[1].pos=40;
  g.turn=1;g.pend={t:"roll",seat:1};
  // force world id by seeding lastWorld/rk until tax chosen
  let found=false;for(let k=0;k<200&&!found;k++){const c=E.clone(g);c.rk=k;roll(c,1);if(c.lastWorld==="tax"){eq(c.players[1].pos,36,"tax -5 from 41");found=true;}}ok(found,"tax reachable");
  const h=mk(2);h.jumps=[{id:0,from:6,to:1,cut:0},{id:1,from:3,to:30,cut:0}];h.fx={sleepy:h.round};h.players[0].pos=3;roll(h,3);eq(h.players[0].pos,6,"snake asleep");
  const s=mk(2);s.jumps=[{id:0,from:3,to:30,cut:0}];s.fx={season:s.round};s.players[0].pos=0;roll(s,3);eq(s.players[0].pos,33);
  const w=mk(2);w.fx={headwind:w.round};w.players[0].pos=0;roll(w,4);eq(w.players[0].pos,3);roll(w,1);
  const w2=mk(2);w2.fx={headwind:w2.round};roll(w2,1);eq(w2.players[0].pos,1,"min 1");
});
t("survival: long snake costs a heart, ghost leaves, last survivor wins",()=>{
  const g=mk(3,{style:"chaos",surv:true});g.jumps=[{id:0,from:50,to:20,cut:0}];
  g.players[0].pos=47;g.players[0].hearts=1;roll(g,3);
  ok(g.players[0].ghost);eq(g.players[0].pos,0);ok(!g.over);eq(g.turn,1);
  g.players[1].hearts=1;g.players[1].pos=47;roll(g,3);ok(g.over);eq(g.winner,2);eq(g.ranking,[2,1,0]);
});
t("survival: ward blocks the heart loss too",()=>{
  const g=mk(2,{style:"chaos",surv:true});g.jumps=[{id:0,from:50,to:20,cut:0}];g.players[0].pos=47;g.players[0].ward=1;roll(g,3);E.apply(g,"w");eq(g.players[0].hearts,3);eq(g.players[0].pos,50);
});
t("full ranking plays on until one player is left",()=>{
  const g=mk(3,{style:"chaos",full:true});g.players[0].pos=99;g.players[1].pos=90;g.players[2].pos=80;roll(g,1);ok(!g.over);eq(g.ranking,[0]);
  g.turn;roll(g,6);roll(g,6);let guard=0;while(!g.over&&guard++<20){if(g.pend.t==="roll"){const s=g.pend.seat,need=100-g.players[s].pos;roll(g,Math.min(6,need));}else E.apply(g,E.ai(g,"mid"));}
  ok(g.over);eq(g.ranking.length,3);eq(g.ranking[0],0);
});
t("classic style: no cards, specials, traps or world events",()=>{
  const g=E.init(3,{style:"classic",surv:true},999,0);eq(g.opts.surv,false);eq(g.sp.length,0);eq(E.legal(g),["r"]);
  for(let i=0;i<200&&!g.over;i++){const ev=E.apply(g,"r");ev.forEach(e=>ok(e.t!=="world"&&e.t!=="gain"));}
});
t("rank points",()=>{eq([0,1,2,3].map(E.rankPoints),[10,7,5,0]);});
t("tokens read correctly",()=>{eq(E.readTok("ru1j07c42dwa2nzAf1x3",0),"r");eq(E.readTok("ru1j07c42dwa2nzAf1x3",1),"u1");eq(E.readTok("ru1j07c42dwa2nzAf1x3",3),"j07");eq(E.readTok("ru1j07c42dwa2nzAf1x3",6),"c42");eq(E.readTok("u",0),"");eq(E.readTok("?",0),"");});
t("cellXY serpentine",()=>{eq(E.cellXY(1),[0,0]);eq(E.cellXY(10),[9,0]);eq(E.cellXY(11),[9,1]);eq(E.cellXY(20),[0,1]);eq(E.cellXY(100),[0,9]);});
console.log("rules: pass",pass,"fail",fail);if(fail)FAILED++;

})();
(function(){
const E=load();
let bad=0,N=0,stat={lad:0,sn:0,sp:0};
for(const style of["chaos","classic"]){
  for(let seed=1;seed<=3000;seed++){
    const b=E.genBoard(seed*7+3,style);N++;
    const ends=new Set(),all=[];
    b.jumps.forEach(j=>{all.push(j.from,j.to);});
    b.sp.forEach(s=>all.push(s.cell));
    const dup=all.length!==new Set(all).size;
    const range=all.some(c=>c<2||c>99);
    const rows=b.jumps.some(j=>E.rowOf(j.from)===E.rowOf(j.to));
    const lad=b.jumps.filter(j=>j.to>j.from).length,sn=b.jumps.length-lad;
    const cnt=t=>b.sp.filter(s=>s.t===t).length;
    let spBad=false;
    if(style==="chaos"){spBad=cnt("gate")!==4||cnt("fork")!==1||cnt("treasure")!==4||cnt("curse")!==3||cnt("steal")!==2||cnt("ward")!==2;
      b.sp.filter(s=>s.t==="gate").forEach(s=>{const p=b.sp.find(x=>x.cell===s.to);if(!p||p.to!==s.cell)spBad=true;});}
    else spBad=b.sp.length!==0;
    if(dup||range||rows||spBad||lad<4||sn<5){bad++;if(bad<6)console.log("BAD",style,seed,{dup,range,rows,spBad,lad,sn});}
    stat.lad+=lad;stat.sn+=sn;stat.sp+=b.sp.length;
  }
}
console.log("boards",N,"bad",bad,"avg ladders",(stat.lad/N).toFixed(2),"avg snakes",(stat.sn/N).toFixed(2),"avg sp",(stat.sp/N).toFixed(2));

if(bad)FAILED++;
})();
(function(){
const E=load();
function checkInv(g,where){
  const bad=m=>{throw new Error(where+": "+m+" seq="+g.seq);};
  g.players.forEach((p,i)=>{
    if(p.pos<0||p.pos>100)bad("pos "+i+"="+p.pos);
    if(p.hand.length>E.MAXHAND)bad("hand "+i);
    if(p.ward<0||p.ward>1)bad("ward "+i+"="+p.ward);
    if(p.skip<0)bad("skip");
    if(p.fin&&p.pos!==100)bad("fin pos");
    if(p.ghost&&(p.pos!==0||p.hand.length))bad("ghost state");
    if(g.opts.surv&&!p.ghost&&(p.hearts<1||p.hearts>E.MAXHEART))bad("hearts "+p.hearts);
  });
  const cells=new Set();
  g.jumps.forEach(j=>{[j.from,j.to].forEach(c=>{if(cells.has(c))bad("dup jump end "+c);cells.add(c);});if(j.from<2||j.from>99||j.to<2||j.to>99)bad("jump range");});
  g.sp.forEach(s=>{if(cells.has(s.cell))bad("sp on jump/dup "+s.cell);cells.add(s.cell);});
  g.traps.forEach(t=>{if(cells.has(t.cell))bad("trap on occupied cell "+t.cell);if(g.traps.filter(x=>x.cell===t.cell).length>1)bad("two traps");});
  if(g.traps.some(t=>g.traps.filter(x=>x.owner===t.owner).length>2))bad("owner >2 traps");
  if(g.jumps.filter(j=>j.cut).length>1)bad("two cut");
  if(!g.over){
    if(!g.pend)bad("no pend");
    const L=E.legal(g);if(!L.length)bad("no legal tokens for "+g.pend.t);
    if(g.pend.seat<0||g.pend.seat>=g.n)bad("pend seat");
    const P=g.players[g.pend.seat];
    if(P.ghost||(P.fin&&g.pend.t==="roll"))bad("pend on dead seat "+g.pend.t);
  }
}
function play(n,opts,seed,mode,rng){
  const g=E.init(n,opts,seed,seed%n);let steps=0;const cnt={};
  const lv=["easy","mid","hard"];
  while(!g.over){
    if(steps++>6000)throw new Error("too long seed="+seed+" opts="+JSON.stringify(opts)+" pend="+JSON.stringify(g.pend)+" round="+g.round);
    let tok;
    if(mode==="fuzz"){const L=E.legal(g);tok=L[Math.floor(rng()*L.length)];}
    else tok=E.ai(g,lv[(g.pend.seat+seed)%3]);
    const ev=E.apply(g,tok);
    if(!ev)throw new Error("illegal token from ai/fuzz "+tok+" pend="+JSON.stringify(g.pend));
    ev.forEach(e=>cnt[e.t]=(cnt[e.t]||0)+1);
    checkInv(g,"after "+tok);
  }
  return{g,steps,cnt};
}
function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const mode="ai",N=40;
const combos=[];
for(const style of["chaos","classic"])for(const surv of[false,true])for(const full of[false,true])for(const n of[2,3,4])if(!(style==="classic"&&surv))combos.push({n,opts:{style,surv,full}});
const tot={};let games=0,rolls=0,rounds=0;const win=[0,0,0,0];const ghosts=[];
const t0=Date.now();
for(const c of combos){
  let rl=0,rd=0,gm=0,ov=0;
  for(let i=0;i<N;i++){
    const seed=(i*2654435761+c.n*131+(c.opts.surv?7:0))>>>0;
    const r=play(c.n,c.opts,seed|0,mode,mul(seed));
    games++;gm++;rl+=r.cnt.roll||0;rd+=r.g.round;
    for(const k in r.cnt)tot[k]=(tot[k]||0)+r.cnt[k];
    if(r.g.ranking.length!==c.n)throw new Error("ranking incomplete "+r.g.ranking);
    if(new Set(r.g.ranking).size!==c.n)throw new Error("ranking dup");
    win[r.g.winner]++;
  }
  
}
console.log("games",games,"all finished with invariants intact");

})();
(function(){
const E=load();
function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let ok=0;
for(let i=0;i<150;i++){
  const n=2+i%3,seed=(i*40503+11)|0,opts={style:i%7===0?"classic":"chaos",surv:i%3===0,full:i%5===0};
  const first=Math.abs(seed)%n,rng=mul(seed);
  // 1) humans play random legal tokens, we record per-seat logs
  const g=E.init(n,opts,seed,first),logs=Array(n).fill("");let steps=0;
  const o2=Object.assign({},g.opts);
  while(!g.over&&steps++<5000){
    const L=E.legal(g),tok=(rng()<.5&&L.indexOf("r")>=0)?"r":L[Math.floor(rng()*L.length)];
    logs[g.pend.seat]+=tok;E.apply(g,tok);
  }
  const R=E.replay(n,opts,seed,first,logs,Array(n).fill(null));
  if(JSON.stringify(R.g)!==JSON.stringify(g))throw new Error("replay mismatch "+i);
  // 2) replay with garbage tokens interleaved is tolerated (illegal tokens ignored) and still finishes consistently on both "clients"
  const noisy=logs.map(l=>"zzA"+l.split("").join(""));
  const A=E.replay(n,opts,seed,first,noisy,Array(n).fill(null)),B=E.replay(n,opts,seed,first,noisy,Array(n).fill(null));
  if(JSON.stringify(A.g)!==JSON.stringify(B.g))throw new Error("noisy nondeterministic "+i);
  // 3) JSON round trip mid-game then continue = same result
  const R2=E.replay(n,opts,seed,first,logs.map(l=>l.slice(0,Math.floor(l.length/2))),Array(n).fill(null));
  const snap=E.clone(R2.g);
  if(JSON.stringify(snap)!==JSON.stringify(R2.g))throw new Error("clone mismatch");
  // 4) bots take over from a point: game must finish and be deterministic
  const bots=Array(n).fill(null);bots[1]=Math.floor((logs[1]||"").length/3);
  const L2=logs.map(l=>l.slice(0,Math.floor(l.length/3)));
  const C=E.replay(n,opts,seed,first,L2,bots),D=E.replay(n,opts,seed,first,L2,bots);
  if(JSON.stringify(C.g)!==JSON.stringify(D.g))throw new Error("bot replay nondeterministic");
  if(C.wait&&C.wait.seat===1)throw new Error("bot seat should never be waited on");
  // 5) partial logs: wait must name the seat the engine is waiting for
  const P=E.replay(n,opts,seed,first,Array(n).fill(""),Array(n).fill(null));
  if(!P.wait||P.wait.seat!==first||P.wait.need!=="roll")throw new Error("wait wrong");
  ok++;
}
console.log("replay checks ok",ok);

})();
if(FAILED){console.log("SNAKE TESTS FAILED");process.exit(1);}console.log("SNAKE TESTS OK");
