/* Shankalolo economy tests — run: node tests/economy.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path"),createDb=require("./mockdb");
const LS={};const localStorage={getItem:k=>LS[k]||null,setItem:(k,v)=>{LS[k]=v;}};
function load(){const ctx={console,Date,setTimeout,Promise,JSON,Math,Object,Array,localStorage};vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname,"../js/shankalolo.js"),"utf8")+";this.SHK=SHK;",ctx);return ctx.SHK;}
let pass=0,fail=0;const failed=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const tests=[];function t(n,fn){tests.push([n,fn]);}
const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error((m||"")+" expected "+JSON.stringify(b)+" got "+JSON.stringify(a));};
const ok=(c,m)=>{if(!c)throw new Error(m||"not ok");};
const U=(id,n)=>({uid:id,displayName:n||id});
const DAY=86400000;

t("49 starting 10,000 granted once (refresh / re-login / relog)",async()=>{
  const S=load(),db=createDb();
  await S.attach(db,U("u1"));eq(S.balance(),10000);
  await S.add(500,"x","a1");eq(S.balance(),10500);
  S.detach();await S.attach(db,U("u1"));eq(S.balance(),10500,"no second grant after re-login");
  await S.ensure();await S.applyTx({delta:0});eq(S.balance(),10500);
  const S2=load();await S2.attach(db,U("u1"));eq(S2.balance(),10500,"fresh page load, same account");
  eq(S2.high(),10500);
  // a second user gets its own grant
  S2.detach();await S2.attach(db,U("u2"));eq(S2.balance(),10000);
});
t("49b existing user with stats gets the grant once and keeps old data",async()=>{
  const S=load(),db=createDb();db.set("users/u9/stats/xo",{pts:120,games:7,wins:4,right:0,wrong:0});
  await S.attach(db,U("u9"));eq(S.balance(),13600,"historical points are converted once at 30/point");
  eq(db.get("users/u9/stats/xo/pts"),120,"stats untouched");
  const hist=Object.values(db.get("users/u9/wtx")||{});ok(hist.some(h=>h.r==="starting_balance"),"history has starting_balance");
});
t("50 3 points = 90 Shankalolo",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("p1"));
  await S.points(3,"xo_room1");eq(S.balance(),10090);
  eq(S.pointsToShk(3),90);eq(S.pointsToShk(0),0);
});
t("51 same points award is never converted twice",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("p1"));
  await S.points(3,"xo_room1");await S.points(3,"xo_room1");await S.points(3,"xo_room1");eq(S.balance(),10090);
  await S.points(3,"xo_room2");eq(S.balance(),10180);
});
t("points earned before the wallet is ready are queued and applied once",async()=>{
  const S=load(),db=createDb();await S.points(4,"q1");await S.points(4,"q1");eq(JSON.parse(LS.pp_shk_pend).length,1);
  await S.attach(db,U("pq"));await sleep(60);eq(S.balance(),10120);eq(JSON.parse(LS.pp_shk_pend).length,0);
  await S.flushPending();eq(S.balance(),10120);
});
t("52 all-time high never decreases",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("h1"));
  await S.add(5000,"win","w1");eq(S.high(),15000);
  await S.remove(9000,"loss","l1");eq(S.balance(),6000);eq(S.high(),15000);
  await S.remove(1000,"loss","l2");eq(S.high(),15000);
});
t("no negative balance / bad amounts",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("n1"));
  const r=await S.remove(10001,"bet","b1");ok(!r.ok);eq(r.err,"insufficient");eq(S.balance(),10000);
  ok(!(await S.add(-5,"x")).ok);ok(!(await S.add(1.5,"x")).ok);ok(!(await S.remove(0,"x")).ok);eq(S.balance(),10000);
  ok((await S.remove(10000,"bet","b2")).ok);eq(S.balance(),0);
});
t("same tx id applied once",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("d1"));
  await S.add(100,"x","same");const r=await S.add(100,"x","same");ok(r.dup);eq(S.balance(),10100);
});
t("transfer between players via inbox (once)",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("a"));
  const r=await S.transfer("b",1000,"friend_loan_sent","friend_loan_received","t1");ok(r.ok);eq(S.balance(),9000);
  S.detach();await S.attach(db,U("b"));await sleep(30);eq(S.balance(),11000);
  await S.claimInbox();eq(S.balance(),11000);ok(!db.get("inbox/b"),"inbox emptied");
});
t("53 formal loan max = 50% of all-time high",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("l1"));
  await S.add(10000,"w","w1");eq(S.high(),20000);await S.remove(15000,"l","l1");
  const o=await S.myLoanInfo();eq(o.info.limit,10000);eq(o.info.available,10000);
  const r=await S.takeLoan(10010);ok(!r.ok);ok((await S.takeLoan(6000)).ok);
  const o2=await S.myLoanInfo();eq(o2.info.outstanding,6000);eq(o2.info.available,4000,"limit applies to total outstanding");
  ok(!(await S.takeLoan(5000)).ok);
});
t("54 max 2 formal loans per calendar month",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("l2"));
  ok((await S.takeLoan(100)).ok);ok((await S.takeLoan(100)).ok);
  const r=await S.takeLoan(100);ok(!r.ok);ok(/both loans/.test(r.err),r.err);
  const o=await S.myLoanInfo();eq(o.info.usedThisMonth,2);eq(o.info.leftThisMonth,0);
});
t("55/56 no interest and due in 30 days",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("l3"));
  const before=Date.now();await S.takeLoan(1000);const o=await S.myLoanInfo();const l=o.loans[0];
  eq(l.p,1000);eq(S.loanRemaining(l),1000);eq(S.balance(),11000);
  ok(l.d-l.t===30*DAY,"due = issue + 30 days");
  await S.repayLoan(l.id,400);const o2=await S.myLoanInfo();eq(S.loanRemaining(o2.loans[0]),600);eq(S.balance(),10600,"repay exactly what was paid, nothing extra");
  await S.repayLoan(o2.loans[0].id,600);const o3=await S.myLoanInfo();eq(S.loanStatus(o3.loans[0],Date.now()),"paid");
});
t("57/58 overdue: marked, 7-day restriction, debt remains, no new loan",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("l4"));
  const old=Date.now()-40*DAY;
  db.set("users/l4/loans/old1",{p:500,r:100,t:old,d:old+30*DAY,s:"a",cr:1});
  const o=await S.myLoanInfo();const l=o.loans[0];
  eq(S.loanStatus(l,Date.now()),"overdue");eq(S.loanRemaining(l),400,"debt not erased, no interest");
  ok(o.info.overdue);ok(!o.info.canBorrow);eq(o.info.restrictedUntil,l.d+7*DAY);
  eq(db.get("users/l4/loans/old1/s"),"o","marked overdue in db");
  ok(!(await S.takeLoan(100)).ok);
  // repay it: still restricted until due+7d (here that already passed) → allowed again
  await S.repayLoan("old1",400);const o2=await S.myLoanInfo();ok(!o2.info.overdue);ok(o2.info.canBorrow);
  // fresh overdue case: due 3 days ago → restriction runs until due+7d (4 more days)
  const t2=Date.now()-33*DAY;db.set("users/l4/loans/old2",{p:100,r:0,t:t2,d:t2+30*DAY,s:"a",cr:1});
  await S.repayLoan("old2",100);const o3=await S.myLoanInfo();ok(!o3.info.overdue);ok(o3.info.restrictedUntil>Date.now(),"still in the 7-day pause after paying late");ok(!o3.info.canBorrow);
});
t("59 friend loan max = 50,000",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("bor","Bor"));
  ok(!(await S.friendLoanRequest("len","Len",50001)).ok);ok(!(await S.friendLoanRequest("len","Len",0)).ok);
  ok((await S.friendLoanRequest("len","Len",50000)).ok);
  eq(S.balance(),10000,"a request moves no money");
});
t("60 lender cannot lend more than balance; request alone transfers nothing",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("bor","Bor"));
  await S.friendLoanRequest("len","Len",20000);const id=Object.keys(db.get("floans"))[0];
  S.detach();await S.attach(db,U("len","Len"));eq(S.balance(),10000);
  const r=await S.friendLoanApprove(id);ok(!r.ok);ok(/enough/.test(r.err),r.err);eq(S.balance(),10000);eq(db.get("floans/"+id+"/st"),"req","request goes back to pending");
  await S.add(15000,"x","gift");const r2=await S.friendLoanApprove(id);ok(r2.ok,r2.err);eq(S.balance(),5000);eq(db.get("floans/"+id+"/st"),"act");
  S.detach();await S.attach(db,U("bor","Bor"));await sleep(30);eq(S.balance(),30000,"borrower got it via inbox");
});
t("61 friend loan repayment reduces remaining; paid at zero",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("bor","Bor"));
  await S.friendLoanRequest("len","Len",1000);const id=Object.keys(db.get("floans"))[0];
  S.detach();await S.attach(db,U("len","Len"));await S.friendLoanApprove(id);
  S.detach();await S.attach(db,U("bor","Bor"));await sleep(30);eq(S.balance(),11000);
  ok((await S.friendLoanRepay(id,300)).ok);let f=db.get("floans/"+id);eq(f.r,300);eq(S.floanRemaining(f),700);eq(f.st,"act");
  ok(!(await S.friendLoanRepay(id,800)).ok,"cannot repay more than remaining");
  ok((await S.friendLoanRepay(id,700)).ok);f=db.get("floans/"+id);eq(S.floanRemaining(f),0);eq(f.st,"paid");eq(Object.keys(f.reps).length,2,"repayment history");
  eq(S.balance(),10000);
  S.detach();await S.attach(db,U("len","Len"));await sleep(30);eq(S.balance(),10000-1000+1000,"lender got everything back");
});
t("friend loan: only the lender approves, only once",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("bor","Bor"));await S.friendLoanRequest("len","Len",500);const id=Object.keys(db.get("floans"))[0];
  ok(!(await S.friendLoanApprove(id)).ok,"borrower cannot approve own request");eq(S.balance(),10000);
  S.detach();await S.attach(db,U("len","Len"));ok((await S.friendLoanApprove(id)).ok);ok(!(await S.friendLoanApprove(id)).ok,"second approve refused");eq(S.balance(),9500);
});
t("62 offline practice never touches real Shankalolo (SHK has no offline API)",async()=>{
  const S=load();ok(!("practice" in S));
  // nothing attached → every wallet call fails closed
  const r=await S.applyTx({delta:100,reason:"x"});ok(!r.ok);eq(S.balance(),0);
});
t("63 online bets/payouts use real wallet: stake, settlement via inbox, reconcile extra",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("bj1"));
  ok((await S.bjStake("1234","r1",0,100)).ok);eq(S.balance(),9900);
  ok((await S.bjStake("1234","r1",1,100)).ok);eq(S.balance(),9800,"double debits the extra stake");
  ok(!(await S.bjStake("1234","r1",1,100)).ok||S.balance()===9800,"same stake id not charged twice");
  // host settles: player staked 200 (engine) and wins 1:1 → ret 400
  await S.sendInbox("bj1","bj_1234_r1",400,"blackjack_win",{s:200});await sleep(30);eq(S.balance(),10200);
  ok(!db.get("users/bj1/bj/open/1234_r1"),"open bet cleared");
  // claim again must not pay twice
  await S.sendInbox("bj1","bj_1234_r1",400,"blackjack_win",{s:200});await sleep(30);eq(S.balance(),10200);
  // rejected extra stake gets reconciled: paid 200 but engine staked 100 → refund diff
  await S.bjStake("77","r2",0,100);await S.bjStake("77","r2",1,100);
  await S.sendInbox("bj1","bj_77_r2",0,"blackjack_loss",{s:100});await sleep(30);eq(S.balance(),10200-200+100);
});
t("orphan open bets are refunded once when the table is gone",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("or1"));
  await S.bjStake("55","r9",0,200);eq(S.balance(),9800);
  db.set("users/or1/bj/open/55_r9/t",Date.now()-10*60000);
  await S.recoverOpenBets(async()=>false);eq(S.balance(),10000);
  await S.recoverOpenBets(async()=>false);eq(S.balance(),10000);
  // live table: not refunded
  await S.bjStake("56","r1",0,100);db.set("users/or1/bj/open/56_r1/t",Date.now()-10*60000);
  await S.recoverOpenBets(async()=>true);eq(S.balance(),9900);
});
t("stats + achievements: granted once, rewards credited once",async()=>{
  const S=load(),db=createDb();await S.attach(db,U("ac1"));
  const seat={hands:[{bet:100,outcome:"blackjack",net:150,natural:true,bust:false,doubled:false,fromSplit:false,total:21,cards:["AS","KH"]}],ins:{amount:0,won:false,ret:0}};
  const e1=await S.recordBjRound("r1",seat);eq(e1.map(a=>a.id).sort(),["first_blackjack","first_hand"]);eq(S.balance(),10000+100+250);
  const e2=await S.recordBjRound("r1",seat);eq(e2.length,0,"same round not counted twice");eq(S.balance(),10350);
  const st=await S.bjStats();eq(st.hands,1);eq(st.bjs,1);eq(st.wins,1);eq(st.profit,150);eq(st.bigWin,150);eq(st.bigBet,100);eq(st.streak,1);
  const e3=await S.checkAchievements();eq(e3.length,0);eq(S.balance(),10350);
});
t("stats reducer: counters (double win, split win, insurance, five-card, perfect 21, streak, losses)",async()=>{
  const S=load();
  const mk=(o)=>Object.assign({bet:100,outcome:"win",net:100,natural:false,bust:false,doubled:false,fromSplit:false,total:20,cards:["10S","KH"]},o);
  let s=S.applyRoundToStats(null,"a",{hands:[mk({doubled:true,bet:200,net:200})],ins:{amount:50,won:false,ret:0}}).s;
  eq([s.doubles,s.doubleWins,s.insBets,s.insWins,s.wagered,s.lossTotal],[1,1,1,0,250,50]);
  s=S.applyRoundToStats(s,"b",{hands:[mk({fromSplit:true,total:21,cards:["5S","5H","4D","3C","4S"]}),mk({fromSplit:true,outcome:"loss",net:-100})],ins:{amount:0,won:false,ret:0}}).s;
  eq([s.splits,s.splitWins,s.fiveWins,s.twentyOneWins,s.losses,s.streak,s.bestStreak],[1,1,1,1,1,0,2]);
  s=S.applyRoundToStats(s,"c",{hands:[mk({outcome:"push",net:0})],ins:{amount:50,won:true,ret:150}}).s;
  eq([s.pushes,s.insWins,s.streak],[1,1,0]);
  const w={h:100000};eq(S.newlyEarned(s,w,{}).some(a=>a.id==="big_bankroll"),true);eq(S.newlyEarned(s,{h:999999},{}).some(a=>a.id==="millionaire"),false);
  eq(S.ACHIEVEMENTS.length,15);eq(S.ACHIEVEMENTS.reduce((a,x)=>a+x.reward,0),100+250+500+1000+1000+100+250+100+250+300+500+250+1500+2000+5000);
});
t("ten-win streak achievement",async()=>{
  const S=load();let s=null;for(let i=0;i<10;i++)s=S.applyRoundToStats(s,"r"+i,{hands:[{bet:10,outcome:"win",net:10,natural:false,bust:false,doubled:false,fromSplit:false,total:19,cards:["10S","9H"]}],ins:null}).s;
  eq(s.bestStreak,10);ok(S.newlyEarned(s,null,{}).some(a=>a.id==="ten_streak"));
});
(async()=>{for(const [n,fn] of tests){try{await fn();pass++;}catch(e){fail++;failed.push(n+" -> "+e.message);}}
  console.log("Shankalolo economy: "+pass+" passed, "+fail+" failed");failed.forEach(f=>console.log(" FAIL "+f));process.exit(fail?1:0);})();
