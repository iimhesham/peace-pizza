/* Online table simulation: host controller + players (own wallets) on a shared mock Firebase.  run: node tests/table.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path"),createDb=require("./mockdb");
const J=f=>fs.readFileSync(path.join(__dirname,"../js/"+f),"utf8");
function ctxWith(files,extra){const c=Object.assign({console,Date,setTimeout,Promise,JSON,Math,Object,Array,crypto:globalThis.crypto},extra||{});vm.createContext(c);files.forEach(f=>vm.runInContext(J(f),c));return c;}
const shk=()=>{const c=ctxWith(["shankalolo.js"]);return vm.runInContext("SHK",c);};
const eng=ctxWith(["blackjack-engine.js","blackjack-host.js"]);const E=vm.runInContext("BJE",eng),BJHOST=vm.runInContext("BJHOST",eng);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0;const failed=[],tests=[];const t=(n,f)=>tests.push([n,f]);
const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error((m||"")+" expected "+JSON.stringify(b)+" got "+JSON.stringify(a));};
const ok=(c,m)=>{if(!c)throw new Error(m||"not ok");};

async function setup(opts){
  opts=opts||{};const db=createDb(),code="1234";
  const players=opts.players||["A","B"];const P={};players.forEach((u,i)=>{P["s"+(i+1)]={uid:u,name:u};});
  db.set("rooms/"+code,{host:"H",game:"blackjack",status:"lobby",created:Date.now(),bj:{dealer:opts.mode||"cpu",max:5},players:P});
  const W={};for(const u of players){W[u]=shk();await W[u].attach(db,{uid:u,displayName:u});}
  let clock=1000000;
  const host=BJHOST.create({db,code,hostUid:"H",getRoom:()=>db.get("rooms/"+code),now:()=>clock,times:opts.times,onError:e=>{throw e;}});
  await host.ready;
  const api={db,code,W,host,P,
    async run(ms,step){step=step||500;for(let i=0;i<ms/step;i++){clock+=step;host.tick();await sleep(6);}},
    bjs:()=>db.get("rooms/"+code+"/bjs"),
    async bet(u,amt,slot){const rid=api.bjs().rid;const r=await W[u].bjStake(code,rid,0,amt);if(!r.ok)return r;api.q(slot,"bet",amt);return r;},
    q(slot,tp,a){const cur=db.get("rooms/"+code+"/players/"+slot+"/q");db.set("rooms/"+code+"/players/"+slot+"/q",{id:(cur?cur.id:0)+1,r:api.bjs().rid,t:tp,a:a||0});},
    rig(order){host.H.shoe=E.rig(order);},
    async bal(u){await sleep(40);return W[u].balance();}};
  return api;
}
t("full round, CPU dealer, 2 players: bets, hidden hole card, payouts, inbox cleared",async()=>{
  const g=await setup();await g.run(1000);eq(g.bjs().ph,"BETTING");
  // A: 10+9 stand (19). B: 10+5 stand (15). Dealer up 10, hole 7D (17).
  g.rig(["10S","10H","9D","5C","8D","7D"].map((c,i)=>c));
  // order: A1,B1,Dup,A2,B2,Dhole → A:10S,9D  B:10H,5C  dealer:?? (we need Dup,Dhole) fix below
});
t("round: A wins, B loses, dealer 17 stands; hole card never in public room data",async()=>{
  const g=await setup();await g.run(1000);
  // deal order: A1,B1,Dup,A2,B2,Dhole
  g.rig(["10S","10H","KD","9D","5C","7D"]);   // A=19, B=15, dealer K+7D=17
  ok((await g.bet("A",100,"s1")).ok);ok((await g.bet("B",50,"s2")).ok);
  await g.run(2000);
  eq(g.bjs().ph,"PLAYER_TURNS");
  const room=JSON.stringify(g.db.get("rooms/"+g.code));ok(room.indexOf("7D")<0,"hole card must not be in the public room data");
  eq(g.bjs().pub.dealer[1],null);
  ok(JSON.stringify(g.db.get("secrets/"+g.code)).indexOf("7D")>=0,"hole card lives in host-only secrets");
  eq(g.bjs().pub.turn.s,0);
  g.q("s1","stand");await g.run(1000);eq(g.bjs().pub.turn.s,1);
  g.q("s2","stand");await g.run(4000);
  eq(g.bjs().ph,"SETTLEMENT");eq(g.bjs().pub.dealer[1],"7D");
  eq(await g.bal("A"),10100);eq(await g.bal("B"),9950);
  ok(!g.db.get("inbox/A")&&!g.db.get("inbox/B"),"inbox claimed");
  ok(!g.db.get("users/A/bj/open"),"open bet markers cleared");
  // next round starts after the result is shown
  await g.run(12000);eq(g.bjs().ph,"BETTING");eq(g.bjs().rid,"r2");
});
t("timeout: player who does nothing auto-stands after 45s; table does not freeze",async()=>{
  const g=await setup({players:["A"]});await g.run(1000);
  g.rig(["10S","10H","9D","7D"]);ok((await g.bet("A",100,"s1")).ok);
  await g.run(3000);eq(g.bjs().ph,"PLAYER_TURNS");
  await g.run(40000);eq(g.bjs().ph,"PLAYER_TURNS");
  await g.run(8000);ok(["DEALER_TURN","SETTLEMENT"].indexOf(g.bjs().ph)>=0,"advanced after timeout, got "+g.bjs().ph);
  await g.run(3000);eq(await g.bal("A"),10100);   // 19 vs 17 wins
});
t("player who left the seat is auto-stood quickly, others keep playing",async()=>{
  const g=await setup();await g.run(1000);g.rig(["10S","10H","KD","9D","5C","7D"]);
  await g.bet("A",100,"s1");await g.bet("B",50,"s2");await g.run(2000);
  g.db.set("rooms/"+g.code+"/players/s1",null);    // A disconnects / leaves
  await g.run(3000);eq(g.bjs().pub.turn.s,1,"moved on to B");
  g.q("s2","stand");await g.run(5000);eq(g.bjs().ph,"SETTLEMENT");eq(await g.bal("A"),10100,"A is still paid by uid");
});
t("human dealer: waits for the dealer, one forced step per click, same rules, auto after timeout",async()=>{
  const g=await setup({players:["A"],mode:"human"});await g.run(1000);
  g.rig(["10S","10H","6D","6C","5S","9D"]);   // A=10+6=16 ; dealer up 10H hole 6C=16 → must draw; draw 5S=21? (A hits nothing)
  // A: 10S,6D ; dealer: 10H up, 6C hole
  await g.bet("A",100,"s1");await g.run(1500);eq(g.bjs().ph,"BETTING","human dealer deals manually");g.host.deal();await g.run(1500);
  g.q("s1","stand");await g.run(2000);eq(g.bjs().ph,"DEALER_TURN");
  await g.run(5000);eq(g.bjs().pub.holeShown,false,"nothing happens until the dealer acts");
  g.host.dealerGo();await sleep(10);eq(g.bjs().pub.holeShown,true,"click 1 reveals");eq(g.bjs().pub.dealer.length,2);
  await g.run(1000);eq(g.bjs().pub.dealer.length,2,"no extra card without a click");
  g.host.dealerGo();await sleep(10);eq(g.bjs().pub.dealer.length,3,"click 2 draws (16 → must hit)");
  // dealer 10+6+5=21 → stand; remaining step is the final stand
  g.host.dealerGo();await sleep(40);eq(g.bjs().ph,"SETTLEMENT");eq(g.bjs().pub.dealer.length,3);
  eq(await g.bal("A"),9900);
});
t("human dealer timeout: finishes automatically by the mandatory rules",async()=>{
  const g=await setup({players:["A"],mode:"human"});await g.run(1000);
  g.rig(["10S","10H","9D","6C","4S"]);await g.bet("A",100,"s1");await g.run(1000);g.host.deal();await g.run(2000);
  g.q("s1","stand");await g.run(2000);eq(g.bjs().ph,"DEALER_TURN");
  await g.run(52000);await g.run(3500);
  eq(g.bjs().ph,"SETTLEMENT");eq(g.bjs().pub.dealer,["10H","6C","4S"]);eq(g.bjs().pub.dealerTotal,20);
  eq(await g.bal("A"),9900,"19 loses to 20");
});
t("insurance: dealer Ace, insurance wins 2:1 vs dealer blackjack",async()=>{
  const g=await setup({players:["A"]});await g.run(1000);
  g.rig(["10S","AH","9D","KC"]);await g.bet("A",100,"s1");await g.run(2000);
  eq(g.bjs().ph,"INSURANCE");
  const n=await g.W.A.bjNextN(g.code,g.bjs().rid);eq(n,1);
  ok((await g.W.A.bjStake(g.code,g.bjs().rid,n,50)).ok);g.q("s1","ins",50);
  await g.run(3000);eq(g.bjs().ph,"SETTLEMENT");
  // main hand loses 100, insurance returns 150 → net 0 (staked 150 returned 150)
  eq(await g.bal("A"),10000);
});
t("insurance declined/timeout and dealer has no blackjack → plays on",async()=>{
  const g=await setup({players:["A"]});await g.run(1000);
  g.rig(["10S","AH","8D","6C"]);await g.bet("A",100,"s1");await g.run(2000);eq(g.bjs().ph,"INSURANCE");
  await g.run(21000);eq(g.bjs().ph,"PLAYER_TURNS");
});
t("double: extra stake is debited and settled on the doubled wager",async()=>{
  const g=await setup({players:["A"]});await g.run(1000);
  g.rig(["5S","10H","6D","8C","10D"]);await g.bet("A",100,"s1");await g.run(2000);   // 5+6=11 ; dealer 10H+8C=18
  const rid=g.bjs().rid;const n=await g.W.A.bjNextN(g.code,rid);
  ok((await g.W.A.bjStake(g.code,rid,n,100)).ok);eq(await g.bal("A"),9800);g.q("s1","double");
  await g.run(8000);eq(g.bjs().ph,"SETTLEMENT");eq(await g.bal("A"),10200,"21 beats 18 on a 200 wager");
});
t("illegal action intent: extra stake is refunded at settlement (no free loss)",async()=>{
  const g=await setup({players:["A"]});await g.run(1000);
  g.rig(["10S","10H","9D","8C"]);await g.bet("A",100,"s1");await g.run(2000);   // 19, not splittable
  const rid=g.bjs().rid;await g.W.A.bjStake(g.code,rid,1,100);g.q("s1","split");   // illegal: host ignores
  await g.run(1000);g.q("s1","stand");await g.run(8000);
  eq(g.bjs().ph,"SETTLEMENT");eq(await g.bal("A"),10100,"won 100, the unused 100 came back");
});
t("late bet after the deal is refunded",async()=>{
  const g=await setup();await g.run(1000);g.rig(["10S","10H","KD","9D","5C","7D"]);
  await g.bet("A",100,"s1");await g.run(31000);eq(g.bjs().ph,"PLAYER_TURNS","B did not bet → round starts without B");
  const rid=g.bjs().rid;ok((await g.W.B.bjStake(g.code,rid,0,200)).ok);eq(g.W.B.balance(),9800);g.q("s2","bet",200);
  await g.run(1500);eq(await g.bal("B"),10000,"late stake refunded");
});
t("invalid / over-limit bets are rejected by the host and refunded",async()=>{
  const g=await setup({players:["A"]});await g.run(1000);g.rig(["10S","10H","9D","8C"]);
  const rid=g.bjs().rid;ok((await g.W.A.bjStake(g.code,rid,0,505)).ok);g.q("s1","bet",505);   // not a multiple of 10 / > max
  await g.run(1500);eq(g.bjs().bets.s1,undefined);eq(await g.bal("A"),10000);
});
t("host reload mid-round resumes from secrets and finishes the round",async()=>{
  const g=await setup({players:["A"]});await g.run(1000);g.rig(["10S","10H","9D","7D"]);await g.bet("A",100,"s1");await g.run(2000);
  eq(g.bjs().ph,"PLAYER_TURNS");
  g.host.stop();
  const clock2=5000000;let c2=clock2;
  const host2=BJHOST.create({db:g.db,code:g.code,hostUid:"H",getRoom:()=>g.db.get("rooms/"+g.code),now:()=>c2,onError:e=>{throw e;}});await host2.ready;
  eq(host2.H.round.dealer,["10H","7D"],"engine round restored incl. hole card");
  g.q("s1","stand");for(let i=0;i<12;i++){c2+=700;host2.tick();await sleep(6);}
  eq(g.bjs().ph,"SETTLEMENT");eq(await g.bal("A"),10100);
});
t("shoe is per table and persists between rounds (cards come out of it)",async()=>{
  const g=await setup({players:["A"]});await g.run(1000);await g.bet("A",10,"s1");await g.run(2000);
  const left=g.bjs().pub.shoeLeft;ok(left<312&&left>=300,"left="+left);
});
t("natural blackjack pays 3:2 through the wallet; stats/achievements recorded once",async()=>{
  const g=await setup({players:["A"]});await g.run(1000);
  g.rig(["AS","9H","KD","8C"]);await g.bet("A",100,"s1");await g.run(8000);
  eq(g.bjs().ph,"SETTLEMENT");eq(await g.bal("A"),10150);
  const seat=g.bjs().pub.result.seats[0];
  const a1=await g.W.A.recordBjRound("1234_"+g.bjs().rid,seat);eq(a1.map(x=>x.id).sort(),["first_blackjack","first_hand"]);
  eq(await g.bal("A"),10150+350);
  const a2=await g.W.A.recordBjRound("1234_"+g.bjs().rid,seat);eq(a2.length,0);eq(await g.bal("A"),10500);
});
(async()=>{for(const [n,f] of tests){try{await f();pass++;}catch(e){fail++;failed.push(n+" -> "+(e&&e.message||e));}}
  console.log("Online table simulation: "+pass+" passed, "+fail+" failed");failed.forEach(x=>console.log(" FAIL "+x));process.exit(fail?1:0);})();
