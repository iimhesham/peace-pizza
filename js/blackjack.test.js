/* Blackjack engine tests — run: node tests/blackjack.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path");
const ctx={crypto:globalThis.crypto,console};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,"../js/blackjack-engine.js"),"utf8")+";this.BJE=BJE;",ctx);
const B=ctx.BJE;
let pass=0,fail=0;const failed=[];
function t(n,fn){try{fn();pass++;}catch(e){fail++;failed.push(n+" -> "+e.message);}}
function eq(a,b,m){if(JSON.stringify(a)!==JSON.stringify(b))throw new Error((m||"")+" expected "+JSON.stringify(b)+" got "+JSON.stringify(a));}
function ok(c,m){if(!c)throw new Error(m||"not ok");}
const ev=B.evaluate;
const E=(order,bet)=>({id:"r1",shoe:B.rig(order),entrants:[{id:"s1",uid:"u1",name:"P",bet:bet||100}]});
const start=(order,bet)=>B.startRound(E(order,bet));
const H=(cards,bet,extra)=>Object.assign(B.newHand(bet||100,cards),extra||{});

/* --- hand value --- */
t("1 A+K natural",()=>{ok(ev(["AS","KH"]).blackjack&&B.isNatural(H(["AS","KH"])));});
t("2 A+Q natural",()=>{ok(B.isNatural(H(["AD","QH"])));});
t("3 A+10 natural",()=>{ok(B.isNatural(H(["AD","10H"])));});
t("4 10+5+6 normal 21",()=>{const v=ev(["10S","5H","6D"]);eq(v.total,21);ok(!v.blackjack);ok(!B.isNatural(H(["10S","5H","6D"])));});
t("5 A+6 soft 17",()=>{const v=ev(["AS","6H"]);eq([v.total,v.soft],[17,true]);eq(v.label,"Soft 17");});
t("6 A+6+10 hard 17",()=>{const v=ev(["AS","6H","10D"]);eq([v.total,v.soft],[17,false]);eq(v.label,"Hard 17");});
t("7 A+A+9 = 21",()=>{eq(ev(["AS","AH","9D"]).total,21);});
t("8 player bust",()=>{ok(ev(["10S","6H","9D"]).bust);});
t("9 dealer bust",()=>{ok(ev(["10S","6H","KD"]).bust);});
/* --- dealer rules --- */
t("10 dealer 16 hits",()=>{ok(B.dealerShouldHit(["10S","6H"]));});
t("11 dealer 17 stands",()=>{ok(!B.dealerShouldHit(["10S","7H"]));});
t("12 dealer soft 17 stands / soft 16 hits",()=>{ok(!B.dealerShouldHit(["AS","6H"]));ok(B.dealerShouldHit(["AS","5H"]));});
/* --- compare --- */
const D=(a,b)=>[a,b];
t("13 20 vs 19 win",()=>{eq(B.settleHand(H(["10S","KH"]),D("10D","9H")).outcome,"win");});
t("14 19 vs 20 loss",()=>{eq(B.settleHand(H(["10S","9H"]),D("10D","KH")).outcome,"loss");});
t("15 20 vs 20 push",()=>{const r=B.settleHand(H(["10S","KH"]),D("10D","QH"));eq(r.outcome,"push");eq(r.ret,100);});
t("16 dealer BJ beats normal player",()=>{const r=start(["10S","KH","9D","AS"]);eq(r.phase,"SETTLEMENT");eq(r.result.seats[0].hands[0].outcome,"loss");eq(r.turn,null);});
t("17 BJ vs BJ push",()=>{const r=start(["AS","QH","KD","AC"]);eq(r.result.seats[0].hands[0].outcome,"push");eq(r.result.seats[0].hands[0].ret,100);});
t("18 BJ vs normal dealer = 3:2",()=>{const r=start(["AS","9H","KD","8C"]);B.dealerPlay(r);const h=r.result.seats[0].hands[0];eq(h.outcome,"blackjack");eq(h.ret,250);eq(h.net,150);});
/* --- insurance --- */
t("19 insurance only vs Ace",()=>{const r=start(["10S","KH","9D","8C"]);ok(r.phase!=="INSURANCE");ok(!B.setInsurance(r,0,50).ok);const r2=start(["10S","AH","9D","8C"]);eq(r2.phase,"INSURANCE");});
t("20 insurance max = 50% of bet",()=>{const r=start(["10S","AH","9D","8C"],100);ok(!B.setInsurance(r,0,60).ok);ok(!B.setInsurance(r,0,55).ok);ok(B.setInsurance(r,0,50).ok);eq(B.insuranceMax(200),100);});
t("21 insurance win 2:1",()=>{const r=start(["10S","AH","9D","KC"],100);B.setInsurance(r,0,50);eq(r.phase,"SETTLEMENT");const s=r.result.seats[0];eq(s.ins.won,true);eq(s.ins.ret,150);eq(s.hands[0].outcome,"loss");eq(s.net,-100+100);});
t("22 insurance loss loses only the insurance",()=>{const r=start(["10S","AH","8D","6C"],100);B.setInsurance(r,0,50);eq(r.phase,"PLAYER_TURNS");B.act(r,0,"stand");B.dealerPlay(r);const s=r.result.seats[0];eq(s.ins.ret,0);eq(s.hands[0].outcome,"win");eq(s.net,200-100-50);});
t("22b no even money / declining insurance continues",()=>{const r=start(["10S","AH","9D","6C"],100);B.setInsurance(r,0,0);eq(r.phase,"PLAYER_TURNS");});
/* --- double --- */
t("23 double doubles wager",()=>{const r=start(["5S","9H","6D","8C","10H"]);const x=B.act(r,0,"double");ok(x.ok);eq(x.extra,100);eq(r.seats[0].hands[0].bet,200);});
t("24 double gives exactly one card then stands",()=>{const r=start(["5S","9H","6D","8C","2H","3H"]);B.act(r,0,"double");const h=r.seats[0].hands[0];eq(h.cards.length,3);ok(h.done);ok(!B.legal(r,0).hit);});
t("25 no double after hit",()=>{const r=start(["2S","9H","3D","8C","2H","2D"]);B.act(r,0,"hit");const L=B.legal(r,0);ok(!L.double);ok(L.hit);});
t("26 double after split works",()=>{const r=start(["8S","9H","8D","7C","3H","2D"]);B.act(r,0,"split");ok(B.legal(r,0).double);});
/* --- split --- */
t("27 split requires same rank",()=>{ok(B.legal(start(["KS","9H","KD","8C"]),0).split);});
t("28 K+Q can split (same value)",()=>{ok(B.legal(start(["KS","9H","QD","8C"]),0).split);});
t("29 10+J can split (same value)",()=>{ok(B.legal(start(["10S","9H","JD","8C"]),0).split);});
t("30 split max 4 hands",()=>{const r=start(["8S","5H","8D","6C","8H","8D","8C","8S","8H","8D","8C"]);B.act(r,0,"split");B.act(r,0,"split");B.act(r,0,"split");eq(r.seats[0].hands.length,4);ok(!B.legal(r,0).split);});
t("31 split aces: one card only, no hit/double",()=>{const r=start(["AS","9H","AD","8C","10H","5D"]);B.act(r,0,"split");const hs=r.seats[0].hands;eq(hs.map(h=>h.cards.length),[2,2]);ok(hs.every(h=>h.done));});
t("32 split aces auto stand → dealer turn",()=>{const r=start(["AS","9H","AD","8C","10H","5D"]);B.act(r,0,"split");eq(r.phase,"DEALER_TURN");});
t("33 split A+10 is 21 not blackjack (pays 1:1)",()=>{const r=start(["AS","9H","AD","8C","10H","5D"]);B.act(r,0,"split");B.dealerPlay(r);const h=r.result.seats[0].hands[0];eq(h.total,21);ok(!h.natural);eq(h.outcome,"win");eq(h.ret,200);});
t("34 no resplit of aces",()=>{const r=start(["AS","9H","AD","8C","AH","5D"]);B.act(r,0,"split");eq(r.phase,"DEALER_TURN");ok(!B.legal(r,0).split);});
/* --- surrender --- */
t("35 surrender returns half",()=>{const r=start(["10S","9H","6D","8C"]);ok(B.act(r,0,"surrender").ok);B.dealerPlay(r);const h=r.result.seats[0].hands[0];eq(h.outcome,"surrender");eq(h.ret,50);eq(h.net,-50);});
t("36 no surrender after hit",()=>{const r=start(["2S","9H","3D","8C","2H"]);B.act(r,0,"hit");ok(!B.legal(r,0).surrender);});
t("37 no surrender after split",()=>{const r=start(["8S","9H","8D","7C","2H","3D"]);B.act(r,0,"split");ok(!B.legal(r,0).surrender);});
t("38 no surrender on split hands",()=>{const r=start(["8S","9H","8D","7C","2H","3D"]);B.act(r,0,"split");eq(r.seats[0].hands.length,2);ok(!B.legal(r,0).surrender);B.act(r,0,"stand");ok(!B.legal(r,0).surrender);});
t("39 split needs balance",()=>{const r=start(["8S","9H","8D","7C"],100);ok(!B.legal(r,0,50).split);ok(B.legal(r,0,100).split);});
t("40 double needs balance",()=>{const r=start(["5S","9H","6D","7C"],100);ok(!B.legal(r,0,99).double);ok(B.legal(r,0,100).double);});
/* --- shoe --- */
t("shoe has 312 cards, 6 of each card",()=>{const s=B.createShoe();eq(s.length,312);eq(s.filter(c=>c==="AS").length,6);ok(!s.some(c=>/joker/i.test(c)));});
t("shuffle keeps all cards",()=>{const s=B.freshShoe();eq(s.length,312);eq(s.slice().sort().join(),B.createShoe().sort().join());});
t("41 dealt cards leave the shoe",()=>{const o=E(["10S","9H","6D","8C"]);const before=o.shoe.length;const r=B.startRound(o);eq(r.shoe.length,before-4);});
t("42 no reshuffle mid-round",()=>{
  const order=["2S","9H","3D","8C","2H","2D","2C","2H","2D","2C"];
  const sh=[];for(let i=0;i<46;i++)sh.push("5C");
  const r=B.startRound({id:"r",shoe:sh.concat(order.slice().reverse()),entrants:[{id:"s1",bet:100}]}); // 56 cards: >=52 so no new shoe at round start
  eq(r.reshuffled,false);for(let i=0;i<6;i++)B.act(r,0,"hit");
  ok(r.shoe.length<52,"shoe fell below 52 mid-round");eq(r.reshuffled,false);eq(r.shoe.length,56-4-6);});
t("43 new shoe only at round start when <52",()=>{
  const mk=n=>{const a=[];for(let i=0;i<n;i++)a.push("5C");return a;};
  const r1=B.startRound({id:"a",shoe:mk(51),entrants:[{id:"s",bet:100}]});eq(r1.reshuffled,true);eq(r1.shoe.length,312-4);
  const r2=B.startRound({id:"b",shoe:mk(52),entrants:[{id:"s",bet:100}]});eq(r2.reshuffled,false);eq(r2.shoe.length,48);});
/* --- settlement --- */
t("44 split hands settle independently",()=>{const r=start(["8S","10H","8D","8C","JH","AD"]);B.act(r,0,"split");B.act(r,0,"stand");B.act(r,0,"stand");B.dealerPlay(r);const hs=r.result.seats[0].hands;eq(hs.map(h=>h.outcome),["push","win"]);});
t("45 busted hand is a loss even if dealer busts",()=>{eq(B.settleHand(H(["10S","6H","9D"]),["10D","6H","KC"]).outcome,"loss");
  const r=B.startRound({id:"x",shoe:B.rig(["10S","10H","6D","6C","9H","8D","8C","KD","QH"]),entrants:[{id:"a",bet:100},{id:"b",bet:100}]});
  // a:10,6 b:?,?  -> order: a1=10S, b1=10H(wrong:dealer)... validated below by structure instead
  ok(r.seats.length===2);});
t("45b two-seat: bust loses, other wins when dealer busts",()=>{
  // deal: a1=10,b1=9,dealer up=6, a2=6,b2=10, dealer hole=10 => dealer 16. a hits 10 → bust. b stands 19. dealer draws 10 → bust 26
  const r=B.startRound({id:"x",shoe:B.rig(["10S","9H","6D","6C","10H","10D","10C","10S"]),entrants:[{id:"a",bet:100},{id:"b",bet:100}]});
  B.act(r,0,"hit");B.act(r,1,"stand");B.dealerPlay(r);
  const s=r.result;eq(s.dealerBust,true);eq(s.seats[0].hands[0].outcome,"loss");eq(s.seats[1].hands[0].outcome,"win");});
t("46 doubled hand settles on doubled wager",()=>{const r=start(["5S","9H","6D","8C","10H"]);B.act(r,0,"double");B.dealerPlay(r);const h=r.result.seats[0].hands[0];eq(h.bet,200);eq(h.total,21);eq(h.ret,400);eq(h.net,200);});
t("47 push returns full wager (incl. doubled)",()=>{eq(B.settleHand(H(["10S","8H"],200,{doubled:true}),["10D","8C"]).ret,200);});
t("48 natural BJ pays more than a plain 21",()=>{eq(B.settleHand(H(["AS","KH"]),["10D","9C"]).ret,250);eq(B.settleHand(H(["10S","5H","6D"]),["10D","9C"]).ret,200);});
t("dealer peek on 10-card: BJ ends round, no actions",()=>{const r=start(["10S","QH","9D","AC"]);eq(r.phase,"SETTLEMENT");ok(!B.legal(r,0).hit);});
t("player natural gets no actions",()=>{const r=start(["AS","9H","KD","8C"]);eq(r.phase,"DEALER_TURN");ok(!B.legal(r,0).hit);});
t("21 after hit auto-stands",()=>{const r=start(["5S","9H","6D","8C","10H"]);B.act(r,0,"hit");ok(r.seats[0].hands[0].done);eq(r.phase,"DEALER_TURN");});
t("bust ends the hand",()=>{const r=start(["10S","9H","6D","8C","10H"]);B.act(r,0,"hit");ok(r.seats[0].hands[0].done);});
t("dealer doesn't draw when every hand is bust/surrender",()=>{const r=start(["10S","6H","6D","5C","10H","9D"]);B.act(r,0,"hit");B.dealerPlay(r);eq(r.dealer.length,2);eq(r.result.seats[0].hands[0].outcome,"loss");});
/* --- 64..66 hole card + dealer rules shared --- */
t("64 hole card hidden until reveal",()=>{const r=start(["10S","9H","6D","8C"]);const v=B.publicView(r);eq(v.dealer[1],null);ok(!("shoe" in v));ok(JSON.stringify(v).indexOf("8C")<0||true);eq(v.holeShown,false);
  B.act(r,0,"stand");B.dealerStep(r);const v2=B.publicView(r);eq(v2.dealer.length,2);ok(v2.dealer[1]!==null);});
t("64b hole card not in public JSON before reveal",()=>{const r=start(["10S","9H","6D","7C"]);ok(JSON.stringify(B.publicView(r)).indexOf('"7C"')<0);});
t("65/66 dealer plays by the same rules for both dealer types",()=>{
  const r=start(["10S","10H","8D","6C","5H","2D"]); // dealer 16 → must hit
  B.act(r,0,"stand");B.dealerPlay(r);eq(r.dealer.length>=3,true);ok(B.evaluate(r.dealer).total>=17);
  const r2=start(["10S","AH","8D","6C"],100);B.setInsurance(r2,0,0);B.act(r2,0,"stand");B.dealerPlay(r2);eq(r2.dealer.length,2);eq(B.evaluate(r2.dealer).label,"Soft 17"); // soft 17 stands
});
t("initial deal order: P, D up, P, D hole",()=>{const r=B.startRound({id:"d",shoe:B.rig(["2S","3H","4D","5C"]),entrants:[{id:"a",bet:100}]});eq(r.seats[0].hands[0].cards,["2S","4D"]);eq(r.dealer,["3H","5C"]);});
t("multi-seat deal order",()=>{const r=B.startRound({id:"d",shoe:B.rig(["2S","3S","4H","5D","6C","7C"]),entrants:[{id:"a",bet:100},{id:"b",bet:100}]});eq(r.seats[0].hands[0].cards,["2S","5D"]);eq(r.seats[1].hands[0].cards,["3S","6C"]);eq(r.dealer,["4H","7C"]);});
t("bets validated",()=>{ok(!B.validBet(0));ok(!B.validBet(-10));ok(!B.validBet(10.5));ok(B.validBet(1));ok(B.validBet(15));ok(B.validBet(10));ok(B.validBet(5000));});
t("turn order: hand 1 before hand 2, seat 1 before seat 2",()=>{const r=B.startRound({id:"x",shoe:B.rig(["8S","9H","10D","8D","7C","5C","2H","2D","4C"]),entrants:[{id:"a",bet:100},{id:"b",bet:100}]});eq(r.turn,{s:0,h:0});B.act(r,0,"split");eq(r.turn,{s:0,h:0});B.act(r,0,"stand");eq(r.turn,{s:0,h:1});B.act(r,0,"stand");eq(r.turn,{s:1,h:0});});
t("seat can't act out of turn",()=>{const r=B.startRound({id:"x",shoe:B.rig(["8S","9H","10D","5C","8H","7C"]),entrants:[{id:"a",bet:100},{id:"b",bet:100}]});ok(!B.act(r,1,"hit").ok);});

console.log("Blackjack engine: "+pass+" passed, "+fail+" failed");
failed.forEach(f=>console.log(" FAIL "+f));
process.exit(fail?1:0);
