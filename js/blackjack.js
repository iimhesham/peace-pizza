/* =========================================================
   Blackjack — واجهة اللعب الأوفلاين (تمرين ضد دلر CPU) + أدوات رسم مشتركة مع الأونلاين.
   - القواعد كلها من js/blackjack-engine.js (BJE) — هنا واجهة بس.
   - الأوفلاين: رصيد تمرين منفصل في localStorage (مش شنكلولو حقيقية، ومالوش أي أثر على المحفظة).
   - BJUI: دوال رسم الورق واليد بيستخدمها الأونلاين (js/online-blackjack.js) كمان.
========================================================= */
(function(){
"use strict";
var E=window.BJE;if(!E)return;
var D=document;function $(id){return D.getElementById(id);}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function fmt(n){return Number(n||0).toLocaleString("en-US");}
function click(){try{if(typeof playClickSound==="function")playClickSound();}catch(x){}}
function say(m){try{if(typeof toast==="function")toast(m);}catch(x){}}

/* ---------- رسومات ---------- */
var SUITS={
  S:"M10 1C10 1 3 7 3 11.5A3.5 3.5 0 0 0 9.2 13.6C9 15.6 8.3 17 7 18.5H13C11.7 17 11 15.6 10.8 13.6A3.5 3.5 0 0 0 17 11.5C17 7 10 1 10 1Z",
  H:"M10 18.5C10 18.5 2 13 2 7.5A4 4 0 0 1 10 5.5A4 4 0 0 1 18 7.5C18 13 10 18.5 10 18.5Z",
  D:"M10 1.5L17 10L10 18.5L3 10Z",
  C:"M10 2A3.4 3.4 0 0 0 7.6 7.8A3.6 3.6 0 1 0 9 13.4C8.9 15.4 8.2 17 7 18.5H13C11.8 17 11.1 15.4 11 13.4A3.6 3.6 0 1 0 12.4 7.8A3.4 3.4 0 0 0 10 2Z"
};
function sprite(){
  if($("bjSprite"))return;
  var s=D.createElement("div");s.id="bjSprite";s.style.cssText="position:absolute;width:0;height:0;overflow:hidden";
  s.innerHTML='<svg width="0" height="0" aria-hidden="true">'+Object.keys(SUITS).map(function(k){return'<symbol id="bj-s-'+k+'" viewBox="0 0 20 20"><path d="'+SUITS[k]+'"/></symbol>';}).join("")+'</svg>';
  D.body.appendChild(s);
}
var COIN='<svg class="bj-coin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#C9A24B"/><circle cx="12" cy="12" r="8.6" fill="#0E7A52" stroke="#8A6A22" stroke-width="1"/><path d="M15.6 8.6H10.2Q8.6 8.6 8.6 10.2V11.2Q8.6 12.6 10.2 12.6H13.8Q15.4 12.6 15.4 14V14.8Q15.4 16.4 13.8 16.4H8.4" fill="none" stroke="#F6E3A1" stroke-width="2" stroke-linejoin="round"/></svg>';

var COIN_V=COIN.replace("#0E7A52","#5B3DB8").replace("#C9A24B","#CDB8FF").replace("#8A6A22","#2E1A73").replace("#F6E3A1","#F3EBFF");
var COIN_R=COIN.replace("#0E7A52","#B3261E").replace("#C9A24B","#FFD36B").replace("#8A6A22","#5A0F0A").replace("#F6E3A1","#FFF1C2");
function coin(n){n=Number(n)||0;return n>=1000000?COIN_R:n>=100000?COIN_V:COIN;}
function cardHtml(c,small){
  if(!c)return'<div class="bj-card back"></div>';
  var r=E.rankOf(c),s=E.suitOf(c),red=(s==="H"||s==="D");
  return'<div class="bj-card'+(red?" r":"")+'"><span class="rk">'+r+'</span><svg class="st2 bj-suit"><use href="#bj-s-'+s+'"/></svg><svg class="st bj-suit"><use href="#bj-s-'+s+'"/></svg></div>';
}
function totTag(label,total,bust,nat){
  if(label==null)return"";
  return'<span class="bj-tot'+(bust?" bust":nat?" bjk":"")+'">'+(nat?"Blackjack":bust?"Bust "+total:esc(label))+'</span>';
}
var OUT={win:"WIN",loss:"LOSE",push:"PUSH",blackjack:"BLACKJACK",surrender:"SURRENDER"};
function resTag(r){
  if(!r)return"";
  var n=r.net>0?" +"+fmt(r.net):r.net<0?" −"+fmt(-r.net):"";
  return'<span class="bj-res '+r.outcome+'">'+OUT[r.outcome]+n+'</span>';
}
/* يد واحدة. h من BJE.publicView. res (اختياري) نتيجة اليد بعد الحسم */
function handHtml(h,o){
  o=o||{};
  return'<div class="bj-hand'+(o.active?" act":"")+(h.done?" done":"")+'"><div class="bj-cards">'+h.cards.map(function(c){return cardHtml(c);}).join("")+'</div>'+
    '<div class="bj-hinfo">'+totTag(h.label,h.total,h.bust,h.natural)+'<span class="bj-chip">'+coin(h.bet)+fmt(h.bet)+'</span>'+(h.doubled?'<span class="bj-res">DOUBLED</span>':"")+(h.splitAces?'<span class="bj-res">ACES</span>':"")+resTag(o.res)+'</div></div>';
}
var flipDone=false;
function dealerHtml(p){
  var doFlip=false;
  if(!p.holeShown)flipDone=false;else if(!flipDone&&p.dealer.length>=2){flipDone=true;doFlip=true;}
  var cards=p.dealer.map(function(c,i){var h=cardHtml(c);return(doFlip&&i===1)?h.replace('class="bj-card','class="bj-card flip'):h;}).join("");
  var tot="";
  if(p.holeShown)tot=totTag(p.dealerLabel,p.dealerTotal,p.dealerTotal>21,p.dealer.length===2&&p.dealerTotal===21);
  else if(p.dealer[0]){var v=E.cardValue(E.rankOf(p.dealer[0]));tot='<span class="bj-tot">'+(v===11?"A":v)+' + ?</span>';}
  if(doFlip)tot=tot.replace('class="bj-tot','class="bj-tot pop');
  return'<div class="bj-zone bj-dz"><div class="bj-lab"><span>Dealer</span>'+tot+'</div><div class="bj-cards">'+cards+'</div></div>';
}
function arcHtml(){return'<div class="bj-arc" aria-hidden="true"><svg viewBox="0 0 320 40" preserveAspectRatio="xMidYMid meet"><path id="bjArcP" d="M10 8Q160 46 310 8" fill="none" stroke="rgba(79,157,255,.5)" stroke-width="1.2"/><text font-size="9" letter-spacing="3" fill="#7C93B3" text-anchor="middle"><textPath href="#bjArcP" startOffset="50%">BLACKJACK PAYS 3 TO 2</textPath></text></svg></div>';}
function phaseName(p){
  return({BETTING:"Place your bet",DEALING:"Dealing",INITIAL_CHECK:"Dealer checks",INSURANCE:"Insurance",PLAYER_TURNS:"Your turn",DEALER_TURN:"Dealer plays",SETTLEMENT:"Result",ROUND_COMPLETE:"Round over",WAITING_FOR_PLAYERS:"Waiting for players"})[p]||p;
}
function betChips(cur,max,fn){
  var h='<div class="bj-bets">';
  [10,100,1000,10000].forEach(function(v){h+='<button type="button" class="bj-btn sm" '+(cur+v>max?"disabled ":"")+'onclick="'+fn+'('+(cur+v)+')">+'+fmt(v)+'</button>';});
  h+='<button type="button" class="bj-btn sm dim" onclick="'+fn+'('+E.RULES.MIN_BET+')">Min</button><button type="button" class="bj-btn sm dim" onclick="'+fn+'('+max+')">Max</button></div>';
  h+='<div class="bj-row"><input class="bj-in bj-betin" inputmode="numeric" autocomplete="off" placeholder="Type any amount" value="" onchange="var v=parseInt(this.value.replace(/[^0-9]/g,\'\'),10);'+fn+'(isNaN(v)?'+E.RULES.MIN_BET+':v)"></div>';
  return h;
}
function heroSvg(){
  var pa=function(cx,cy,r){return'<path d="M'+cx+' '+(cy-r)+'Q'+cx+' '+cy+' '+(cx+r)+' '+cy+'Q'+cx+' '+cy+' '+cx+' '+(cy+r)+'Q'+cx+' '+cy+' '+(cx-r)+' '+cy+'Q'+cx+' '+cy+' '+cx+' '+(cy-r)+'Z" fill="#FBF9E4"/>';};
  var bars="",xx=348,w=[3,1,2,1,3,1,1,2,1,3,2,1];for(var i=0;i<w.length;i++){bars+='<rect x="'+xx+'" y="118" width="'+w[i]+'" height="100" fill="#FBF9E4"/>';xx+=w[i]+2.2;}
  var chk="";for(var j=0;j<2;j++)for(var k=0;k<30;k++){if((j+k)%2===0)chk+='<rect x="'+(20+k*12)+'" y="'+(316+j*8)+'" width="12" height="8" fill="#FBF9E4"/>';}
  var fan=[{a:-34,s:"H",c:"#5B88B2"},{a:-13,s:"C",c:"#122C4F"},{a:8,s:"D",c:"#5B88B2"},{a:29,s:"S",c:"#122C4F"}].map(function(c,i){
    var big=i===3;
    return'<g transform="translate(150 262) rotate('+c.a+') translate(-38 -120)"><rect width="76" height="108" rx="9" fill="#FBF9E4" stroke="#5B88B2" stroke-width="3"/>'+
      '<text x="8" y="22" font-size="17" fill="'+c.c+'">A</text><svg x="7" y="26" width="12" height="12" fill="'+c.c+'"><use href="#bj-s-'+c.s+'"/></svg>'+
      '<svg x="'+(big?18:24)+'" y="'+(big?32:40)+'" width="'+(big?40:28)+'" height="'+(big?44:28)+'" fill="'+c.c+'"><use href="#bj-s-'+c.s+'"/></svg></g>';
  }).join("");
  return'<svg viewBox="0 0 400 346" role="img" aria-label="Blackjack table"><defs><path id="bjGlobe" d="M310 262m-31 0a31 31 0 1 1 62 0a31 31 0 1 1 -62 0"/></defs>'+
    '<text x="236" y="30" font-size="11" letter-spacing="3" fill="#FBF9E4">AUTHENTIC</text><rect x="326" y="23" width="54" height="6" fill="#FBF9E4"/>'+
    '<text x="23" y="96" font-size="62" fill="#5B88B2">BLACKJACK</text><text x="20" y="93" font-size="62" fill="#FBF9E4">BLACKJACK</text>'+
    '<text x="20" y="124" font-size="21" letter-spacing="1.5" fill="#FBF9E4">SHANKALOLO TABLE</text>'+
    pa(40,170,12)+pa(100,150,7)+pa(62,226,9)+pa(222,134,6)+pa(268,200,8)+pa(300,150,5)+
    fan+bars+
    '<circle cx="310" cy="262" r="38" fill="none" stroke="#FBF9E4" stroke-width="2"/><circle cx="310" cy="262" r="24" fill="none" stroke="#FBF9E4" stroke-width="1.6"/><ellipse cx="310" cy="262" rx="10" ry="24" fill="none" stroke="#FBF9E4" stroke-width="1.4"/><path d="M286 262H334M290 250H330M290 274H330" stroke="#FBF9E4" stroke-width="1.4"/>'+
    '<text font-size="8" letter-spacing="1.6" fill="#FBF9E4"><textPath href="#bjGlobe">SHANKALOLO · BLACKJACK · SHANKALOLO ·</textPath></text>'+
    '<rect x="20" y="280" width="140" height="22" fill="none" stroke="#FBF9E4" stroke-width="1.5"/><rect x="22" y="282" width="18" height="18" fill="#FBF9E4"/><text x="26" y="296" font-size="15" fill="#122C4F">R</text>'+
    '<text x="45" y="291" font-size="6.5" fill="#FBF9E4">PRACTICE OR SHANKALOLO ONLY</text><text x="45" y="299" font-size="6.5" fill="#FBF9E4">NO REAL MONEY</text>'+
    '<text x="200" y="312" font-size="10" text-anchor="middle" fill="#8197AC"> </text>'+chk+'</svg>';
}

window.BJUI={esc:esc,fmt:fmt,COIN:COIN,coin:coin,sprite:sprite,card:cardHtml,hand:handHtml,dealer:dealerHtml,phase:phaseName,res:resTag,tot:totTag,betChips:betChips,arc:arcHtml,hero:heroSvg,click:click,say:say};

/* =========================================================
   الأوفلاين: تمرين ضد دلر CPU برصيد تمرين منفصل
========================================================= */
var LS="pp_bj_practice",START_BANK=10000;
var P=load(),round=null,shoe=null,bet=50,busy=false,tm=null,lastMsg="";
function load(){try{var v=JSON.parse(localStorage.getItem(LS)||"null");if(v&&typeof v.bank==="number")return v;}catch(x){}return{bank:START_BANK,hands:0,wins:0,losses:0,pushes:0};}
function save(){try{localStorage.setItem(LS,JSON.stringify(P));}catch(x){}}

function icoBack(){return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';}
function walChip(){
  var real=window.SHK&&SHK.wallet&&SHK.wallet();
  var wb='<button type="button" class="wl-ico sm" onclick="bjWallet()" aria-label="Wallet">'+'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v2"/><path d="M3 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3"/><path d="M21 9H16a2.5 2.5 0 0 0 0 5h5a0 0 0 0 0 0 0V9z"/><circle cx="16.6" cy="11.5" r=".6" fill="currentColor"/></svg>'+'</button>';
  if(view==="table")return'<button type="button" class="bj-wal" onclick="bjPracticeInfo()">'+coin(P.bank)+fmt(P.bank)+'<small>PRACTICE</small></button>'+wb+'<button type="button" class="wl-ico sm bj-rotbtn" onclick="bjRotate()" aria-label="Rotate screen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="10" height="18" rx="2" transform="rotate(0)"/><path d="M4 9a8 8 0 0 1 3-4M20 15a8 8 0 0 1-3 4"/><path d="M4 5v4h4M20 19v-4h-4"/></svg></button>';
  return'<button type="button" class="bj-wal" onclick="bjWallet()">'+coin(real?real.b:0)+(real?fmt(real.b):"—")+'<small>WALLET</small></button>';
}
var view="start";
function shellTop(){return'<div class="bj-top"><button type="button" class="bj-back" onclick="bjBack()" aria-label="Back">'+icoBack()+'</button><div class="bj-title">Blackjack</div>'+walChip()+'</div>';}

function drawStart(){
  var s=$("blackjack");if(!s)return;
  s.innerHTML=shellTop()+'<div class="bj-wrap"><div class="bj-hero">'+heroSvg()+'</div>'+
   '<div class="bj-modes">'+
   '<button type="button" class="bj-mode" onclick="bjPractice()"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h.01M15 16h.01M12 12h.01"/></svg></i><span><b>Practice (Offline)</b><small>Play against the CPU dealer with a separate 10,000 practice bankroll. No real Shankalolo.</small></span></button>'+
   '<button type="button" class="bj-mode on" onclick="bjOnline()"><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg></i><span><b>Play Online</b><small>Real tables with real Shankalolo. Human dealer or CPU dealer, up to 5 players.</small></span></button>'+
   '</div><button type="button" class="bj-link" onclick="bjHelp()">How the table works</button>'+
   '<p class="bj-note">Shankalolo is a virtual coin for fun. It has no cash value.</p></div>';
}
function drawHelp(){
  var s=$("blackjack");view="help";
  s.innerHTML=shellTop()+'<div class="bj-wrap"><div class="bj-card2 bj-rules"><h3>House rules</h3>'+
  '<h4>Goal</h4><ul><li>Beat the dealer without going over 21. Aces count 1 or 11. Face cards count 10.</li><li>A Blackjack is an Ace plus a 10-value card on your first two cards. It pays 3:2.</li></ul>'+
  '<h4>Table</h4><ul><li>6 decks (312 cards). A new shoe is shuffled before a round when fewer than 52 cards remain.</li><li>No bet limit: bet any amount up to your balance.</li></ul>'+
  '<h4>Dealer</h4><ul><li>Draws on 16 or less and stands on all 17s, including soft 17.</li><li>With a 10-value card or an Ace showing, the dealer checks for Blackjack first.</li></ul>'+
  '<h4>Your options</h4><ul><li><b>Hit / Stand</b>.</li><li><b>Double</b>: double the bet, take exactly one card. Allowed after a split.</li><li><b>Split</b>: two cards of the same value (any two 10-value cards like K and Q work), up to 4 hands. Split Aces get one card each and cannot be resplit. A+10 after a split is a normal 21.</li><li><b>Surrender</b>: first two cards only, get half your bet back.</li><li><b>Insurance</b>: only when the dealer shows an Ace. Up to half your bet, pays 2:1.</li></ul>'+
  '<h4>Payouts</h4><ul><li>Win 1:1 · Blackjack 3:2 · Push returns your bet.</li></ul></div>'+
  '<button type="button" class="bj-btn" style="width:100%" onclick="bjHome()">Back</button></div>';
}

/* ---------- الأوفلاين ---------- */
function setBet(v){bet=Math.max(E.RULES.MIN_BET,Math.min(E.RULES.MAX_BET,Math.floor(v)));if(bet>P.bank)bet=Math.floor(P.bank);draw();}
function drawTable(){
  var s=$("blackjack");if(!s)return;view="table";
  var pub=round?E.publicView(round):null,h="";
  h+='<div class="bj-felt"><div class="bj-status"><span class="bj-phase">'+phaseName(round?round.phase:"BETTING")+'</span><span>Practice · not real Shankalolo</span></div>';
  if(pub){
    h+=dealerHtml(pub)+arcHtml();
    var seat=pub.seats[0],res=pub.result?pub.result.seats[0]:null;
    h+='<div class="bj-zone bj-pz"><div class="bj-lab"><span>You</span><em>'+(pub.reshuffled?"New shoe shuffled · ":"")+pub.shoeLeft+' cards left</em></div><div class="bj-hands">'+
      seat.hands.map(function(x,i){return handHtml(x,{active:pub.turn&&pub.turn.h===i&&pub.phase==="PLAYER_TURNS",res:res&&res.hands[i]});}).join("")+'</div>'+
      (seat.insurance?'<div class="bj-hinfo">Insurance: <span class="bj-chip">'+COIN+fmt(seat.insurance)+'</span>'+(res?(res.ins.won?'<span class="bj-res win">PAID 2:1</span>':'<span class="bj-res loss">LOST</span>'):"")+'</div>':"")+'</div>';
  }else h+='<div class="bj-zone bj-dz"><div class="bj-lab"><span>Dealer</span></div><div class="bj-cards"></div></div>'+arcHtml()+'<div class="bj-zone bj-pz"><div class="bj-lab"><span>You</span></div><div class="bj-cards"></div></div>';
  h+='<div class="bj-msg">'+esc(lastMsg)+'</div>';
  h+=controls(pub)+'</div>';
  h+='<p class="bj-note">Practice hands '+P.hands+' · wins '+P.wins+' · losses '+P.losses+' · pushes '+P.pushes+'</p>';
  s.innerHTML=shellTop()+'<div class="bj-wrap">'+h+'</div>';
}
function controls(pub){
  var ph=round?round.phase:"BETTING";
  if(!round||ph==="SETTLEMENT"||ph==="ROUND_COMPLETE"){
    if(P.bank<E.RULES.MIN_BET)return'<div class="bj-ctl"><div class="bj-warn">You are out of practice chips.</div><button type="button" class="bj-btn pri" onclick="bjPracticeReset()">Reset practice bankroll to 10,000</button></div>';
    var max=Math.min(E.RULES.MAX_BET,Math.floor(P.bank));if(bet>max)bet=max;if(bet<E.RULES.MIN_BET)bet=E.RULES.MIN_BET;
    return'<div class="bj-ctl"><div class="bj-bet-show">'+coin(bet)+' '+fmt(bet)+'<small>YOUR BET · NO LIMIT · BALANCE '+fmt(P.bank)+'</small></div>'+betChips(bet,max,"bjBet")+'<button type="button" class="bj-btn pri" onclick="bjDeal()">'+(round?"Deal next hand":"Deal")+'</button></div>';
  }
  if(busy||ph==="DEALER_TURN")return'<div class="bj-ctl"><div class="bj-warn">Dealer is playing...</div></div>';
  if(ph==="INSURANCE"){var mx=E.insuranceMax(round.seats[0].hands[0].bet);
    return'<div class="bj-ctl"><div class="bj-warn">Dealer shows an Ace. Insurance pays 2:1 if the dealer has Blackjack.</div><div class="bj-row"><button type="button" class="bj-btn pri" '+(P.bank<mx?"disabled ":"")+'onclick="bjIns('+mx+')">Insure for '+fmt(mx)+'</button><button type="button" class="bj-btn dim" onclick="bjIns(0)">No thanks</button></div></div>';}
  if(ph==="PLAYER_TURNS"){var L=E.legal(round,0,P.bank);
    function b(a,t,c){return'<button type="button" class="bj-btn'+(c||"")+'" '+(L[a]?"":"disabled ")+'onclick="bjAct(\''+a+'\')">'+t+'</button>';}
    return'<div class="bj-ctl"><div class="bj-acts">'+b("hit","Hit")+b("stand","Stand"," pri")+b("double","Double")+b("split","Split")+b("surrender","Surrender"," dim")+'</div></div>';}
  return"";
}
var draw=drawTable;

function deal(){
  click();
  if(busy)return;
  if(!E.validBet(bet)||bet>P.bank){say("Pick a valid bet");return;}
  P.bank-=bet;save();
  var seat={id:"s1",uid:"you",name:"You",bet:bet};
  round=E.startRound({id:"p"+Date.now(),shoe:shoe,entrants:[seat]});
  shoe=round.shoe;lastMsg=round.reshuffled?"New shoe shuffled":"";
  afterChange();
}
function afterChange(){
  if(!round)return;
  if(round.phase==="DEALER_TURN"){drawTable();runDealer();return;}
  if(round.phase==="SETTLEMENT"){finish();return;}
  drawTable();
}
function runDealer(){
  busy=true;drawTable();
  (function step(){
    var r=E.dealerStep(round);drawTable();
    if(r.done){busy=false;finish();return;}
    tm=setTimeout(step,650);
  })();
}
function finish(){
  busy=false;
  var res=round.result.seats[0];
  if(!round.holeShown)round.holeShown=true;
  P.bank+=res.returned;
  res.hands.forEach(function(h){P.hands++;if(h.outcome==="win"||h.outcome==="blackjack")P.wins++;else if(h.outcome==="push")P.pushes++;else P.losses++;});
  save();
  lastMsg=res.net>0?"You won "+fmt(res.net):res.net<0?"You lost "+fmt(-res.net):"Push";
  round.phase="ROUND_COMPLETE";
  drawTable();
}
function ins(v){
  click();var r=E.setInsurance(round,0,v);if(!r.ok){say("Insurance not allowed");return;}
  if(v>0){P.bank-=v;save();}
  afterChange();
}
function act(a){
  if(busy)return;click();
  var r=E.act(round,0,a,P.bank);if(!r.ok){say("Not allowed now");return;}
  if(r.extra){P.bank-=r.extra;save();}
  afterChange();
}

/* ---------- نقاط الدخول ---------- */
window.bjOpen=function(){click();try{sprite();}catch(x){}view="start";drawStart();show("blackjack");};
window.bjHome=function(){click();view="start";drawStart();};
window.bjBack=function(){click();if(view==="start"){clearTimeout(tm);busy=false;show("hub");}else{clearTimeout(tm);busy=false;view="start";drawStart();}};
window.bjPractice=function(){click();view="table";round=null;lastMsg="";if(P.bank<E.RULES.MIN_BET)lastMsg="";drawTable();};
window.bjHelp=function(){click();drawHelp();};
window.bjBet=setBet;window.bjDeal=deal;window.bjIns=ins;window.bjAct=act;
window.bjPracticeReset=function(){click();P.bank=START_BANK;save();bet=50;drawTable();};
window.bjPracticeInfo=function(){say("Practice chips are separate from your real Shankalolo");};
window.bjSelfTest=function(){var run=function(){return window.__bjSelfTest();};if(window.__bjSelfTest)return run();var sc=document.createElement("script");sc.src="js/blackjack-selftest.js?v=1";sc.onload=run;document.head.appendChild(sc);return"loading...";};
window.bjOnline=function(){click();if(window.OL&&OL.open)OL.open("blackjack");else say("Sign in with Google to play online");};
window.bjWallet=function(){click();if(window.SHKUI&&SHKUI.open)SHKUI.open();else if(window.OL&&OL.account)OL.account();else say("Sign in with Google first");};
window.bjRefresh=function(){var s=$("blackjack");if(s&&!s.classList.contains("hidden")&&view==="start")drawStart();};
})();
