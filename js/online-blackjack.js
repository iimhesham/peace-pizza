/* =========================================================
   Online Blackjack — واجهة الطاولة داخل نظام الغرف بتاع الموقع (OL).
   - المنطق: js/blackjack-engine.js (القواعد) + js/blackjack-host.js (مدير الطاولة على جهاز صاحبها).
   - اللاعب بيكتب نيته في players/<slot>/q والمضيف بيطبقها ويكتب الحالة العامة في rooms/<code>/bjs.
   - الرهان بيتخصم من محفظة اللاعب (SHK) والعائد بيجيله من inbox.
========================================================= */
(function(){
if(!window.OL||!OL.i||!window.BJE||!window.BJUI||!window.BJHOST)return;
var I=OL.i,E=BJE,UI=BJUI,e=I.e,U=I.U,T=I.T;
var SL=BJHOST.SLOTS,host=null,loop=null,hostCode="";
var bet=50,placing=false,placedFor="",rec={},tStart={},acting=false,lastSeq=0,seenAt=0,nextRecover=0;

function ctx(){return I.ctx();}
function mySlot(S){var P=(S&&S.players)||{},me=U().uid,r="";SL.forEach(function(k){if(P[k]&&P[k].uid===me)r=k;});return r;}
function bal(){return window.SHK&&SHK.wallet&&SHK.wallet()?SHK.balance():0;}
function modeOf(S){return(S&&S.bj&&S.bj.dealer)||"cpu";}
function dealerName(S){return modeOf(S)==="human"?(S.hostName||"Dealer"):"CPU Dealer";}

/* ---------- مدير الطاولة (صاحب الطاولة بس) ---------- */
function ensureHost(code){
  if(host&&hostCode===code)return;
  stopHost();hostCode=code;
  host=BJHOST.create({db:I.db(),code:code,hostUid:U().uid,getRoom:function(){var c=ctx();return c.S;},onError:function(err){
    var m=(err&&err.code==="PERMISSION_DENIED")?"Could not write the table. Publish the new Firebase Rules":"Table error";T(m);}});
  loop=setInterval(function(){var c=ctx();if(!c.S||c.role!=="host"||c.code!==hostCode){stopHost();return;}host.tick();},600);
}
function stopHost(){if(loop)clearInterval(loop);loop=null;if(host)host.stop();host=null;hostCode="";}

/* ---------- نوايا اللاعب ---------- */
function sendQ(t,a){
  var c=ctx(),S=c.S,slot=mySlot(S);if(!slot||!S.bjs)return;
  var cur=(S.players[slot]||{}).q,id=Math.max(myQ(slot),(cur&&cur.id)||0)+1;
  I.db().ref("rooms/"+c.code+"/players/"+slot+"/q").set({id:id,r:S.bjs.rid,t:t,a:a||0}).catch(function(){T("Could not send. Check your connection");});
  qLocal[slot]=id;
}
var qLocal={};function myQ(slot){return qLocal[slot]||0;}

function placeBet(){
  var c=ctx(),S=c.S,B=S&&S.bjs;if(!B||B.ph!=="BETTING"||placing)return;
  if(!window.SHK){T("Wallet is loading, try again");return;}
  if(!E.validBet(bet)){T("Enter a valid bet");return;}
  if(bal()<bet){T("Not enough Shankalolo");return;}
  placing=true;UI.click();
  SHK.bjStake(c.code,B.rid,0,bet).then(function(r){
    placing=false;
    if(!r.ok){T(r.err==="insufficient"?"Not enough Shankalolo":"Could not place the bet");return;}
    placedFor=B.rid;sendQ("bet",bet);draw();
  });
}
function extraStake(amount,then){
  var c=ctx(),B=c.S.bjs;if(acting)return;
  if(bal()<amount){T("Not enough Shankalolo");return;}
  acting=true;
  SHK.bjNextN(c.code,B.rid).then(function(n){return SHK.bjStake(c.code,B.rid,n,amount);}).then(function(r){
    acting=false;if(!r.ok){T("Could not place the extra bet");return;}then();
  });
}
function act(a){
  var c=ctx(),S=c.S,B=S&&S.bjs,slot=mySlot(S);if(!B||B.ph!=="PLAYER_TURNS"||acting)return;UI.click();
  var i=seatIndex(B,slot);if(i<0)return;var h=B.pub.seats[i].hands[B.pub.turn.h];
  if(a==="double"||a==="split")extraStake(h.bet,function(){sendQ(a);});
  else sendQ(a);
}
function insure(v){
  var c=ctx(),S=c.S,B=S&&S.bjs;if(!B||B.ph!=="INSURANCE")return;UI.click();
  if(v>0)extraStake(v,function(){sendQ("ins",v);});else sendQ("ins",0);
}
function seatIndex(B,slot){if(!B||!B.pub)return-1;var r=-1;B.pub.seats.forEach(function(s,i){if(s.id===slot)r=i;});return r;}

/* ---------- الرسم ---------- */
function timerBar(B){
  if(!B||!B.dur||!B.dlk)return"";
  var k=B.dlk+"_"+B.rid;if(!tStart[k]){tStart={};tStart[k]=Date.now();}
  var el=Math.max(0,(Date.now()-tStart[k])/1000),d=B.dur/1000;
  if(el>=d)return"";
  return'<div class="bj-timer"><i style="animation-duration:'+d+'s;animation-delay:-'+el.toFixed(2)+'s"></i></div>';
}
function seatsHtml(S,B,me){
  var P=S.players||{},max=(S.bj&&S.bj.max)||5,h="";
  SL.slice(0,max).forEach(function(k){
    var p=P[k];
    if(!p||!p.uid){h+='<div class="bj-seat empty"><b>Empty seat</b></div>';return;}
    var bet=B&&B.bets&&B.bets[k],inRound=B&&B.pub&&seatIndex(B,k)>=0&&B.pub.seats[seatIndex(B,k)].uid===p.uid;
    var st=inRound?"In the round":(B&&B.ph==="BETTING"?(bet?"Bet placed":"Choosing a bet..."):"Waiting for next round");
    h+='<div class="bj-seat'+(p.uid===me?" me":"")+'">'+(p.photo?'<img referrerpolicy="no-referrer" alt="" src="'+e(p.photo)+'">':"")+'<div><b>'+e(p.name||"Player")+(p.uid===me?" (you)":"")+'</b><small>'+st+'</small></div><span class="sp"></span>'+(bet&&B.ph==="BETTING"?'<span class="bj-chip">'+UI.COIN+UI.fmt(bet)+'</span>':"")+'</div>';
  });
  return'<div class="bj-seats">'+h+'</div>';
}
function tableHtml(S,B,me,isHost,hv){
  var h="";
  if(B&&B.pub){
    var pub=B.pub;
    if(isHost&&modeOf(S)==="human"&&hv&&hv.round&&!pub.holeShown){ // صاحب الطاولة (الدلر البشري) بيشوف الورقة المخفية
      var full=Object.assign({},pub,{dealer:hv.dealer});
      h+=UI.dealer(full).replace('<div class="bj-cards">','<div class="bj-cards" title="Only you can see the hole card">');
      h+='<div class="bj-note" style="margin:0">Only the dealer sees the hole card</div>';
    }else h+=UI.dealer(pub);
    var res=pub.result;
    h+=UI.arc()+'<div class="bj-players n'+Math.min(pub.seats.length,5)+'">';
    pub.seats.forEach(function(s,i){
      var sr=res&&res.seats[i],mine=s.uid===me;
      h+='<div class="bj-zone bj-seatz'+(mine?" me":"")+'"><div class="bj-lab"><span>'+e(s.name||"Player")+(mine?" (you)":"")+'</span>'+(sr?'<em>'+(sr.net>0?"+"+UI.fmt(sr.net):sr.net<0?"−"+UI.fmt(-sr.net):"Push")+'</em>':"")+'</div><div class="bj-hands">'+
        s.hands.map(function(x,j){return UI.hand(x,{active:pub.turn&&pub.turn.s===i&&pub.turn.h===j&&B.ph==="PLAYER_TURNS",res:sr&&sr.hands[j]});}).join("")+'</div>'+
        (s.insurance?'<div class="bj-hinfo">Insurance <span class="bj-chip">'+UI.COIN+UI.fmt(s.insurance)+'</span>'+(sr?(sr.ins.won?'<span class="bj-res win">PAID 2:1</span>':'<span class="bj-res loss">LOST</span>'):"")+'</div>':"")+'</div>';
    });
    h+='</div>';
  }else{
    h+='<div class="bj-zone"><div class="bj-lab"><span>Dealer</span><em>'+e(dealerName(S))+'</em></div><div class="bj-cards"></div></div>';
  }
  return h;
}
function controls(S,B,slot,isHost,hv){
  var me=U().uid,ph=B?B.ph:"WAITING",h="";
  if(isHost&&modeOf(S)==="human"){
    if(ph==="BETTING"){var n=Object.keys((hv&&hv.bets)||{}).length;h+='<div class="bj-ctl"><div class="bj-warn">You are the dealer. '+n+' bet'+(n===1?"":"s")+' in.</div><button type="button" class="bj-btn pri" '+(n?"":"disabled ")+'onclick="OLBJ.deal()">Deal</button></div>';}
    else if(ph==="DEALER_TURN"&&hv){
      var lab=!hv.holeShown?"Reveal the hole card":hv.shouldHit?"Draw a card (16 or less)":"Stand (17 or more)";
      h+='<div class="bj-ctl"><div class="bj-warn">Dealer rules are fixed: draw on 16 or less, stand on 17 or more (soft 17 too). If you wait, the table finishes by these rules.</div><button type="button" class="bj-btn pri" onclick="OLBJ.dealerGo()">'+lab+'</button></div>';}
    else if(ph==="WAITING")h+='<div class="bj-ctl"><div class="bj-warn">Waiting for players to sit down. Share the room code.</div></div>';
  }
  if(!slot){ // مش قاعد (دلر بشري أو متفرج)
    if(!(isHost&&modeOf(S)==="human"))h+='<div class="bj-ctl"><div class="bj-warn">You are not seated.</div></div>';
    return h;
  }
  var bets=(B&&B.bets)||{},mine=bets[slot],inRound=B&&B.pub&&seatIndex(B,slot)>=0;
  if(ph==="WAITING")return h+'<div class="bj-ctl"><div class="bj-warn">Waiting for the next round...</div></div>';
  if(ph==="BETTING"){
    if(mine||placedFor===B.rid)return h+'<div class="bj-ctl"><div class="bj-warn">Bet placed: '+UI.fmt(mine||bet)+'. Waiting for the others...</div>'+timerBar(B)+'</div>';
    var max=Math.min(E.RULES.MAX_BET,Math.floor(bal()));if(bet>max)bet=Math.max(E.RULES.MIN_BET,max);
    return h+'<div class="bj-ctl"><div class="bj-bet-show">'+UI.coin(bet)+' '+UI.fmt(bet)+'<small>YOUR BET · NO LIMIT · BALANCE '+UI.fmt(bal())+'</small></div>'+UI.betChips(bet,max,"OLBJ.bet")+
      '<button type="button" class="bj-btn pri" '+(bal()<E.RULES.MIN_BET||placing?"disabled ":"")+'onclick="OLBJ.place()">Place bet</button>'+timerBar(B)+'</div>';
  }
  if(!inRound)return h+'<div class="bj-ctl"><div class="bj-warn">You are sitting this round out.</div></div>';
  var i=seatIndex(B,slot),seat=B.pub.seats[i];
  if(ph==="INSURANCE"){
    if(seat.insAsked)return h+'<div class="bj-ctl"><div class="bj-warn">Insurance answered. Waiting for the others...</div>'+timerBar(B)+'</div>';
    var mx=E.insuranceMax(seat.hands[0].bet);
    return h+'<div class="bj-ctl"><div class="bj-warn">Dealer shows an Ace. Insurance pays 2:1 if the dealer has Blackjack (max half your bet).</div><div class="bj-row"><button type="button" class="bj-btn pri" '+(bal()<mx||acting?"disabled ":"")+'onclick="OLBJ.ins('+mx+')">Insure for '+UI.fmt(mx)+'</button><button type="button" class="bj-btn dim" onclick="OLBJ.ins(0)">No thanks</button></div>'+timerBar(B)+'</div>';
  }
  if(ph==="PLAYER_TURNS"){
    var t=B.pub.turn;
    if(!t||t.s!==i)return h+'<div class="bj-ctl"><div class="bj-warn">Waiting for '+e(B.pub.turn?B.pub.seats[B.pub.turn.s].name:"the dealer")+'...</div>'+timerBar(B)+'</div>';
    var hand=seat.hands[t.h],L=E.legalFor(hand,seat.hands.length,bal());
    var b=function(a,txt,c){return'<button type="button" class="bj-btn'+(c||"")+'" '+(L[a]&&!acting?"":"disabled ")+'onclick="OLBJ.act(\''+a+'\')">'+txt+'</button>';};
    return h+'<div class="bj-ctl"><div class="bj-acts">'+b("hit","Hit")+b("stand","Stand"," pri")+b("double","Double")+b("split","Split")+b("surrender","Surrender"," dim")+'</div>'+timerBar(B)+'</div>';
  }
  if(ph==="DEALER_TURN")return h+'<div class="bj-ctl"><div class="bj-warn">Dealer is playing...</div></div>';
  if(ph==="SETTLEMENT"||ph==="ROUND_COMPLETE"){
    var sr=B.pub.result&&B.pub.result.seats[i];
    return h+'<div class="bj-ctl"><div class="bj-bet-show">'+(sr?(sr.net>0?"You won "+UI.fmt(sr.net):sr.net<0?"You lost "+UI.fmt(-sr.net):"Push"):"")+'<small>NEXT ROUND STARTS SOON · BALANCE '+UI.fmt(bal())+'</small></div></div>';
  }
  return h;
}
var hooked=false;
function hook(){if(hooked||!window.SHK||!SHK.onChange)return;hooked=true;SHK.onChange(function(){var c=ctx();if(c&&c.S&&c.S.game==="blackjack")draw();});}
function draw(){
  var c=ctx(),S=c.S,code=c.code,role=c.role,me=U().uid;
  if(!S)return;
  hook();UI.sprite();
  var isHost=role==="host";
  if(isHost)ensureHost(code);
  var B=S.bjs||null,slot=mySlot(S),hv=isHost&&host?host.view():null;
  if(B&&B.seq!==lastSeq){lastSeq=B.seq;seenAt=Date.now();}
  var stale=B&&B.hb&&!isHost&&Math.abs(Date.now()-B.hb)>40000&&Date.now()-seenAt>40000;
  var mode=modeOf(S);
  var head='<div class="bj-status"><span class="bj-phase">'+UI.phase(B?B.ph:"WAITING")+'</span><span>'+(mode==="human"?"Human dealer: "+e(S.hostName||"Dealer"):"CPU dealer")+(B&&B.pub?' · '+B.pub.shoeLeft+' cards left':'')+'</span></div>';
  var wal='<div class="bj-row" style="margin:0 0 8px">'+'<button type="button" class="bj-wal" onclick="OLBJ.wallet()" aria-label="Wallet">'+UI.coin(bal())+UI.fmt(bal())+'<small>WALLET</small></button><button type="button" class="wl-ico sm" onclick="OLBJ.wallet()" aria-label="Wallet">'+'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v2"/><path d="M3 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3"/><path d="M21 9H16a2.5 2.5 0 0 0 0 5h5a0 0 0 0 0 0 0V9z"/><circle cx="16.6" cy="11.5" r=".6" fill="currentColor"/></svg>'+'</button><button type="button" class="wl-ico sm bj-rotbtn" onclick="bjRotate()" aria-label="Rotate screen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="10" height="18" rx="2" transform="rotate(0)"/><path d="M4 9a8 8 0 0 1 3-4M20 15a8 8 0 0 1-3 4"/><path d="M4 5v4h4M20 19v-4h-4"/></svg></button></div>';
  var html='<div class="bj-app"><div class="bj-wrap">'+wal+'<div class="bj-felt">'+head+(stale?'<div class="bj-warn">The dealer connection looks lost. You can leave the table.</div>':"")+
    tableHtml(S,B,me,isHost,hv)+(B&&B.msg?'<div class="bj-msg">'+e(B.msg)+'</div>':'<div class="bj-msg"></div>')+controls(S,B,slot,isHost,hv)+'</div>'+
    '<div class="bj-card2" style="margin-top:12px"><h3>Seats</h3>'+seatsHtml(S,B,me)+'<div class="bj-row"><button type="button" class="bj-btn sm dim" onclick="OLBJ.wallet()">Wallet &amp; loans</button>'+(isHost?'<button type="button" class="bj-btn sm dim" onclick="OL.close()">Close table</button>':'<button type="button" class="bj-btn sm dim" onclick="OL.up()">Leave table</button>')+'</div></div></div></div>';
  I.shell(html,{room:true,t:"Blackjack",g:"blackjack",playing:true});
  afterDraw(S,code,B);
}
/* بعد كل رسمة: سجّل نتيجتي مرة واحدة (إحصائيات + إنجازات) واستلم العوائد */
function afterDraw(S,code,B){
  if(!window.SHK||!B||!B.pub||!B.pub.result||!(B.ph==="SETTLEMENT"||B.ph==="ROUND_COMPLETE"))return;
  var me=U().uid,key=code+"_"+B.rid;if(rec[key])return;
  var seat=null;B.pub.result.seats.forEach(function(s){if(s.uid===me)seat=s;});
  if(!seat)return;rec[key]=1;
  SHK.claimInbox();
  SHK.recordBjRound(key,seat).then(function(list){(list||[]).forEach(function(a){T("Achievement: "+a.n+" +"+UI.fmt(a.reward));});}).catch(function(){});
}

/* ---------- الخروج: لاعب يحرر كرسيه، صاحب الطاولة يقفلها ---------- */
function leave(code,role,S){
  try{
    var db=I.db(),me=U().uid;
    if(role==="host"){stopHost();db.ref("rooms/"+code).remove();db.ref("secrets/"+code).remove().catch(function(){});return;}
    var slot=mySlot(S),B=S&&S.bjs;if(!slot)return;
    var busyRound=B&&B.pub&&seatIndex(B,slot)>=0&&["INSURANCE","PLAYER_TURNS","DEALER_TURN"].indexOf(B.ph)>=0;
    var bettedNow=B&&B.ph==="BETTING"&&B.bets&&B.bets[slot];
    if(busyRound||bettedNow)return; // الكرسي بيفضل لحد ما الجولة تخلص، والمضيف بيلعب عنه Stand
    db.ref("rooms/"+code+"/players/"+slot).transaction(function(x){return x&&x.uid===me?null:undefined;});
    if(window.SHK)setTimeout(function(){SHK.recoverOpenBets(function(c,r){return db.ref("rooms/"+c+"/bjs/rid").once("value").then(function(s){return s.val()===r;});});},4000);
  }catch(x){}
}

window.OLBJ={draw:draw,bet:function(v){bet=Math.max(E.RULES.MIN_BET,Math.min(Math.floor(v)||E.RULES.MIN_BET,Math.max(E.RULES.MIN_BET,Math.floor(bal()))));draw();},place:placeBet,act:act,ins:insure,leave:leave,
  deal:function(){if(host)host.deal();},dealerGo:function(){if(host)host.dealerGo();},
  wallet:function(){if(window.SHKUI)SHKUI.open();else T("Wallet is loading");}};
})();
