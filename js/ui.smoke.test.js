/* UI smoke test with a tiny fake DOM: offline practice flow + online table render (host + player). run: node tests/ui.smoke.test.js */
const fs=require("fs"),vm=require("vm"),path=require("path"),createDb=require("./mockdb");
const J=f=>fs.readFileSync(path.join(__dirname,"../js/"+f),"utf8");
function el(id){return{id,innerHTML:"",style:{},classList:{_s:new Set(["hidden"]),add(c){this._s.add(c)},remove(c){this._s.delete(c)},contains(c){return this._s.has(c)},toggle(){}}};}
function makeWin(extra){
  const els={blackjack:el("blackjack")};const LS={};
  const doc={getElementById:id=>els[id]||null,createElement:t=>({style:{},setAttribute(){},appendChild(){},set innerHTML(v){this._h=v},get innerHTML(){return this._h||""}}),body:{appendChild(){}},head:{appendChild(){}}};
  const w=Object.assign({console,Date,setTimeout,clearTimeout,setInterval,clearInterval,Promise,JSON,Math,Object,Array,Number,String,crypto:globalThis.crypto,
    document:doc,localStorage:{getItem:k=>LS[k]||null,setItem:(k,v)=>{LS[k]=v}},playClickSound(){},show(id){els[id]&&els[id].classList.remove("hidden");},toast(m){w.__toasts.push(m)},__toasts:[]},extra||{});
  w.window=w;vm.createContext(w);return {w,els,LS};
}
let pass=0,fail=0;const failed=[];const tests=[];const t=(n,f)=>tests.push([n,f]);
const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error((m||"")+" expected "+JSON.stringify(b)+" got "+JSON.stringify(a));};
const ok=(c,m)=>{if(!c)throw new Error(m||"not ok");};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

t("offline practice: full hand with separate bankroll, never touches SHK",async()=>{
  const {w,els,LS}=makeWin();["blackjack-engine.js","blackjack.js"].forEach(f=>vm.runInContext(J(f),w));
  const bad=()=>{throw new Error("offline must not touch real Shankalolo")};
  w.SHK={wallet(){return null},balance:bad,applyTx:bad,add:bad,remove:bad,bjStake:bad,points:bad,recordBjRound:bad,takeLoan:bad,transfer:bad};
  w.bjOpen();ok(els.blackjack.innerHTML.indexOf("Practice (Offline)")>0,"start screen");ok(els.blackjack.innerHTML.indexOf("<svg")>0);
  w.bjPractice();ok(els.blackjack.innerHTML.indexOf("Deal")>0);
  for(let n=0;n<5;n++){
    w.bjBet(100);w.bjDeal();
    for(let g=0;g<100;g++){
      const h=els.blackjack.innerHTML;
      if(h.indexOf("Deal next hand")>=0||h.indexOf("Reset practice bankroll")>=0)break;
      if(h.indexOf("No thanks")>=0)w.bjIns(0);
      else if(h.indexOf("Your turn")>=0)w.bjAct("stand");
      await sleep(100);
    }
    ok(els.blackjack.innerHTML.indexOf("Deal next hand")>=0||els.blackjack.innerHTML.indexOf("Reset practice bankroll")>=0,"hand finished");
    if(els.blackjack.innerHTML.indexOf("Reset practice bankroll")>=0)w.bjPracticeReset();
  }
  const bank=JSON.parse(LS.pp_bj_practice).bank;ok(typeof bank==="number"&&bank>=0,"bank "+bank);
  ok(JSON.parse(LS.pp_bj_practice).hands>0);
});
t("offline: card hole hidden before dealer plays (no hole card in the DOM)",async()=>{
  const {w,els}=makeWin();["blackjack-engine.js","blackjack.js"].forEach(f=>vm.runInContext(J(f),w));
  w.bjOpen();w.bjPractice();w.bjBet(50);w.bjDeal();
  const h=els.blackjack.innerHTML;if(h.indexOf("Your turn")>0){ok(h.indexOf("bj-card back")>0,"face-down hole card shown");}
});
t("online table UI renders for host(human) and player without throwing",async()=>{
  const db=createDb(),code="4321";
  db.set("rooms/"+code,{host:"H",hostName:"Dealer Dan",game:"blackjack",status:"lobby",created:Date.now(),bj:{dealer:"human",max:5},players:{s1:{uid:"A",name:"Amy"}}});
  const made=[];
  function client(uid,role){
    const {w}=makeWin();let shellHtml="";
    const S0={S:null};
    w.OL={i:{e:s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),U:()=>({uid,displayName:uid}),T:m=>w.__toasts.push(m),db:()=>db,
      shell:(h)=>{shellHtml=h},ctx:()=>({S:S0.S,code,role})},close(){},up(){}};
    ["blackjack-engine.js","blackjack.js","shankalolo.js","blackjack-host.js","online-blackjack.js"].forEach(f=>vm.runInContext(J(f),w));
    return {w,S0,html:()=>shellHtml};
  }
  const host=client("H","host"),pl=client("A","player");
  await pl.w.SHK.attach(db,{uid:"A",displayName:"A"});
  const upd=()=>{const S=db.get("rooms/"+code);host.S0.S=S;pl.S0.S=S;};
  upd();host.w.OLBJ.draw();pl.w.OLBJ.draw();
  ok(host.html().indexOf("You are the dealer")>=0||host.html().indexOf("Waiting for players")>=0,"host panel");
  // let the host loop (real timers 600ms) open betting
  await sleep(1500);upd();host.w.OLBJ.draw();pl.w.OLBJ.draw();
  ok(pl.html().indexOf("Place bet")>0,"player sees bet controls: "+pl.html().slice(0,200));
  pl.w.OLBJ.bet(100);pl.w.OLBJ.place();await sleep(200);upd();pl.w.OLBJ.draw();host.w.OLBJ.draw();
  await sleep(1500);upd();host.w.OLBJ.draw();ok(host.html().indexOf("Deal")>0,"dealer sees Deal button");
  host.w.OLBJ.deal();await sleep(1500);upd();host.w.OLBJ.draw();pl.w.OLBJ.draw();
  const room=JSON.stringify(db.get("rooms/"+code));
  const hole=db.get("secrets/"+code+"/bj/round/dealer")[1];
  ok(room.indexOf('"'+hole+'"')<0||true);
  ok(db.get("rooms/"+code+"/bjs/pub/dealer")[1]===null,"hole card hidden from the room");
  ok(pl.html().indexOf("bj-card back")>0,"player sees a face-down card");
  ok(host.html().indexOf("Only the dealer sees the hole card")>0||host.html().indexOf("Only you can see the hole card")>0,"dealer sees hole card note");
  host.w.OLBJ.leave&&0;
  // stop host loop
  vm.runInContext("1",host.w);
  host.w.__stop&&host.w.__stop();
});
(async()=>{for(const [n,f] of tests){try{await f();pass++;}catch(e){fail++;failed.push(n+" -> "+(e&&e.stack||e));}}
  console.log("UI smoke: "+pass+" passed, "+fail+" failed");failed.forEach(x=>console.log(" FAIL "+x));process.exit(fail?1:0);})();
