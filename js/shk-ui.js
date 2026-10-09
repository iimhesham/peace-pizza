/* =========================================================
   SHKUI — صفحة المحفظة (شنكلولو): الرصيد، القروض الرسمية، قروض الأصدقاء،
   إحصائيات البلاك جاك، الإنجازات، وسجل العمليات.
   بتتفتح من صفحة الحساب (Player Passport) ومن طاولة البلاك جاك: OL.wallet().
========================================================= */
(function(){
if(!window.OL||!OL.i||!window.SHK)return;
var I=OL.i,e=I.e,U=I.U,T=I.T,S=SHK,UI=window.BJUI||{fmt:function(n){return Number(n||0).toLocaleString("en-US");},COIN:""};
var fmt=UI.fmt,COIN=UI.COIN;
function D(){return I.db();}
function dt(ts){return new Date(ts).toLocaleDateString("en-GB");}
function card(t,inner,tag){return'<div class="bj-card2"><h3>'+t+(tag||"")+'</h3>'+inner+'</div>';}
function kv(rows){return'<div class="bj-kv">'+rows.map(function(r){return'<span>'+r[0]+'</span><b>'+r[1]+'</b>';}).join("")+'</div>';}
var REASON={starting_balance:"Starting balance",points_reward:"Points reward",blackjack_bet:"Blackjack bet",blackjack_win:"Blackjack win",blackjack_blackjack:"Blackjack 3:2",blackjack_loss:"Blackjack loss",blackjack_push:"Blackjack push",blackjack_achievement:"Achievement",blackjack_refund:"Blackjack refund",loan_received:"Loan received",loan_repaid:"Loan repaid",friend_loan_sent:"Friend loan sent",friend_loan_received:"Friend loan received",friend_loan_repaid:"Friend loan repaid",friend_loan_received_back:"Friend repaid you",admin_adjustment:"Adjustment"};
var curTab="loans";
var LST={req:"Waiting for the lender",pay:"Processing",act:"Active",paid:"Paid",rej:"Rejected",can:"Cancelled"};

/* ---------- ملخص صغير في صفحة الحساب ---------- */
function mini(){
  var w=S.wallet();
  setTimeout(fillMini,150);
  return'<div class="bj-app"><div class="bj-card2" id="shkMini"><h3>Shankalolo</h3><div class="bj-big">'+COIN+'<span>'+(w?fmt(w.b):"—")+'</span></div>'+
    kv([["All-time high",w?fmt(w.h):"—"],["Blackjack hands","<span id=\"shkMH\">—</span>"],["Blackjack wins","<span id=\"shkMW\">—</span>"]])+
    '<div class="bj-row" style="margin-top:12px"><button type="button" class="bj-btn sm pri" onclick="OL.wallet()">Wallet, loans &amp; achievements</button></div></div></div>';
}
function fillMini(){
  var a=document.getElementById("shkMH");if(!a||!S.user().uid)return;
  S.bjStats().then(function(s){var b=document.getElementById("shkMW");if(a)a.textContent=fmt(s.hands);if(b)b.textContent=fmt(s.wins);}).catch(function(){});
}

/* ---------- الصفحة الكاملة ---------- */
function render(){
  if(!U()){T("Sign in with Google first");return;}
  I.sv("stats");
  I.shell('<div class="bj-app"><div class="bj-wrap"><div class="bj-card2"><h3>Wallet</h3><p class="bj-note">Loading...</p></div></div></div>',{t:"Wallet",g:"blackjack"});
  S.attach(D(),U()).then(function(){
    return Promise.all([S.myLoanInfo(),S.listFriendLoans().catch(function(){return[];}),S.bjStats(),S.bjAchievements(),S.history(15),D().ref("fl/"+U().uid).once("value").then(function(s){return s.val()||{};}).catch(function(){return{};})]);
  }).then(function(r){paint(r[0],r[1],r[2],r[3],r[4],r[5]);}).catch(function(){
    I.shell('<div class="bj-app"><div class="bj-wrap"><div class="bj-card2"><h3>Wallet</h3><p class="bj-note">Could not load. Check your connection and the Firebase Rules.</p></div></div></div>',{t:"Wallet",g:"blackjack"});
  });
}
function paint(L,FL,st,ach,hist,friends){
  var w=S.wallet()||{b:0,h:0},info=L.info,me=U().uid,h="";
  h+='<div class="wl-hero"><div class="wl-hl"><span class="wl-dot"></span>SHANKALOLO WALLET</div><div class="wl-bal">'+COIN+'<span>'+fmt(w.b)+'</span></div>'+
    '<div class="wl-tiles"><div><label>All-time high</label><b>'+fmt(w.h)+'</b></div><div><label>Max formal loan</label><b>'+fmt(info.limit)+'</b></div><div><label>Owed</label><b>'+fmt(info.outstanding)+'</b></div></div>'+
    '<p class="wl-fine">Virtual coin, no cash value. 1 Point = 10 Shankalolo. Practice chips are separate and never touch this balance.</p></div>';
  h+='@@TABS@@';
  h+='<div class="wl-pane" data-p="loans">';
  /* قروض رسمية */
  var loans=L.loans.map(function(l){
    var s=S.loanStatus(l,Date.now()),rem=S.loanRemaining(l);
    return'<div class="bj-li"><div class="l"><span>Borrowed <b>'+fmt(l.p)+'</b> · '+dt(l.t)+'</span><b>'+s.toUpperCase()+'</b></div><small>Repaid '+fmt(l.r||0)+' · Remaining '+fmt(rem)+' · Due '+dt(l.d)+(s==="overdue"?' · overdue, still owed, no interest':'')+'</small>'+
      (rem>0?'<div class="bj-row" style="margin-top:6px;justify-content:flex-start"><input class="bj-in" style="width:120px" id="lr_'+e(l.id)+'" inputmode="numeric" placeholder="'+rem+'"><button type="button" class="bj-btn sm" onclick="SHKUI.repay(\''+e(l.id)+'\','+rem+')">Repay</button></div>':"")+'</div>';
  }).join("")||'<p class="bj-note" style="text-align:left">No loans yet.</p>';
  h+=card("Formal loan",kv([["Total outstanding",fmt(info.outstanding)],["You can borrow now",fmt(info.available)],["Loans this month",info.usedThisMonth+" of 2 used ("+info.leftThisMonth+" left)"],["Total borrowed",fmt(info.totalBorrowed)],["Total repaid",fmt(info.totalRepaid)]])+
    (info.restrictedUntil>Date.now()?'<div class="bj-warn" style="margin-top:8px">New loans are paused until '+dt(info.restrictedUntil)+' (7 days after an overdue due date).</div>':"")+
    '<p class="bj-note" style="text-align:left">No interest, no fees. Pay back within 30 days. You can repay in parts.</p>'+
    (info.canBorrow?'<div class="bj-row" style="margin-top:8px"><input class="bj-in" style="flex:1" id="loanAmt" inputmode="numeric" placeholder="Amount (max '+fmt(info.available)+')"><button type="button" class="bj-btn sm pri" onclick="SHKUI.take()">Take loan</button></div>':'<div class="bj-warn" style="margin-top:8px">'+e(info.why)+'</div>')+
    '<div style="margin-top:10px">'+loans+'</div>');
  /* قروض الأصدقاء */
  var fids=Object.keys(friends||{}),inc=FL.filter(function(f){return f.l===me&&f.st==="req";});
  var opts=fids.map(function(id){return'<option value="'+e(id)+'" data-n="'+e(friends[id].n||"Friend")+'">'+e(friends[id].n||"Friend")+'</option>';}).join("");
  var flist=FL.filter(function(f){return!(f.l===me&&f.st==="req");}).map(function(f){
    var mineB=f.b===me,rem=S.floanRemaining(f),other=mineB?f.ln:f.bn;
    return'<div class="bj-li"><div class="l"><span>'+(mineB?"Borrowed from ":"Lent to ")+'<b>'+e(other||"Friend")+'</b> · '+fmt(f.p)+'</span><b>'+(LST[f.st]||f.st).toUpperCase()+'</b></div><small>'+dt(f.t)+' · Repaid '+fmt(f.r||0)+' · Remaining '+fmt(rem)+'</small>'+
      (mineB&&f.st==="act"&&rem>0?'<div class="bj-row" style="margin-top:6px;justify-content:flex-start"><input class="bj-in" style="width:120px" id="fr_'+e(f.id)+'" inputmode="numeric" placeholder="'+rem+'"><button type="button" class="bj-btn sm" onclick="SHKUI.frepay(\''+e(f.id)+'\','+rem+')">Repay</button></div>':"")+
      (mineB&&f.st==="req"?'<div class="bj-row" style="margin-top:6px;justify-content:flex-start"><button type="button" class="bj-btn sm dim" onclick="SHKUI.fcancel(\''+e(f.id)+'\')">Cancel request</button></div>':"")+'</div>';
  }).join("");
  h+='</div><div class="wl-pane" data-p="friends">';
  h+=card("Friend loans",
    (inc.length?'<div class="bj-warn" style="margin-bottom:8px">Requests waiting for you</div>'+inc.map(function(f){return'<div class="bj-li"><div class="l"><span><b>'+e(f.bn||"Friend")+'</b> asks for <b>'+fmt(f.p)+'</b></span></div><small>Your balance: '+fmt(w.b)+'</small><div class="bj-row" style="margin-top:6px;justify-content:flex-start"><button type="button" class="bj-btn sm pri" onclick="SHKUI.fok(\''+e(f.id)+'\')">Approve</button><button type="button" class="bj-btn sm dim" onclick="SHKUI.fno(\''+e(f.id)+'\')">Reject</button></div></div>';}).join(""):"")+
    '<p class="bj-note" style="text-align:left">Up to '+fmt(S.FRIEND_LOAN_MAX)+' per loan, no interest. Nothing moves until your friend approves.</p>'+
    (fids.length?'<div class="bj-row" style="margin-top:8px"><select class="bj-in" style="flex:1" id="flFriend">'+opts+'</select><input class="bj-in" style="width:110px" id="flAmt" inputmode="numeric" placeholder="Amount"><button type="button" class="bj-btn sm pri" onclick="SHKUI.freq()">Request</button></div>':'<p class="bj-note" style="text-align:left">Add friends from the Friends tab to ask for a loan.</p>')+
    '<div style="margin-top:10px">'+(flist||'<p class="bj-note" style="text-align:left">No friend loans yet.</p>')+'</div>');
  /* إحصائيات البلاك جاك */
  h+='</div><div class="wl-pane" data-p="stats">';
  h+=card("Blackjack stats",kv([["Hands played",fmt(st.hands)],["Wins",fmt(st.wins)],["Losses",fmt(st.losses)],["Pushes",fmt(st.pushes)],["Natural Blackjacks",fmt(st.bjs)],["Busts",fmt(st.busts)],["Doubles",fmt(st.doubles)],["Splits",fmt(st.splits)],["Surrenders",fmt(st.surr)],["Insurance bets",fmt(st.insBets)],["Insurance wins",fmt(st.insWins)],["Total wagered",fmt(st.wagered)],["Total profit",fmt(st.profit)],["Total losses",fmt(st.lossTotal)],["Biggest win",fmt(st.bigWin)],["Biggest bet",fmt(st.bigBet)],["Current streak",fmt(st.streak)],["Best streak",fmt(st.bestStreak)]]));
  /* إنجازات */
  var got=S.ACHIEVEMENTS.filter(function(a){return ach[a.id];}).length;
  h+=card("Blackjack achievements",'<div class="bj-ach">'+S.ACHIEVEMENTS.map(function(a){var g=ach[a.id];return'<div class="'+(g?"got":"")+'"><span><b>'+e(a.n)+'</b><br><small>'+e(a.d)+'</small></span><b>'+(g?"DONE":"+"+fmt(a.reward))+'</b></div>';}).join("")+'</div>',' <small style="font-size:12px;color:#8197AC">'+got+' / '+S.ACHIEVEMENTS.length+'</small>');
  /* السجل */
  h+='</div><div class="wl-pane" data-p="activity">';
  h+=card("Recent activity",hist.length?hist.map(function(x){return'<div class="bj-li"><div class="l"><span>'+e(REASON[x.r]||x.r)+'</span><b>'+(x.a>0?"+":"")+fmt(x.a)+'</b></div><small>'+dt(x.t)+' · Balance '+fmt(x.b)+'</small></div>';}).join(""):'<p class="bj-note" style="text-align:left">Nothing yet.</p>');
  h+='</div>';
  var nreq=FL.filter(function(f){return f.l===me&&f.st==="req";}).length;
  var TB=[["loans","Loans"],["friends","Friends"+(nreq?" ("+nreq+")":"")],["stats","Stats"],["activity","Activity"]];
  h=h.replace("@@TABS@@",'<div class="wl-tabs">'+TB.map(function(t){return'<button type="button" data-t="'+t[0]+'" class="'+(t[0]===curTab?"on":"")+'" onclick="SHKUI.tab(\''+t[0]+'\')">'+t[1]+'</button>';}).join("")+'</div>');
  I.shell('<div class="bj-app wl-app" data-tab="'+curTab+'"><div class="bj-wrap">'+h+'</div></div>',{t:"Wallet",g:"blackjack"});
}

function num(id){var el=document.getElementById(id);return el?Math.floor(Number((el.value||"").replace(/[^\d]/g,""))):0;}
function done(r,okMsg){T(r&&r.ok?okMsg:(r&&r.err)||"Something went wrong");render();}
window.SHKUI={tab:function(t){curTab=t;var a=document.querySelector('.wl-app');if(a)a.setAttribute('data-tab',t);document.querySelectorAll('.wl-tabs button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-t')===t);});},open:function(){if(window.OL&&OL.wallet)OL.wallet();else render();},render:render,mini:mini,
  take:function(){S.takeLoan(num("loanAmt")).then(function(r){done(r,"Loan added to your balance");});},
  repay:function(id,rem){var a=num("lr_"+id)||rem;S.repayLoan(id,a).then(function(r){done(r,"Repayment done");});},
  freq:function(){var s=document.getElementById("flFriend");if(!s||!s.value)return;var n=s.options[s.selectedIndex].getAttribute("data-n");
    S.friendLoanRequest(s.value,n,num("flAmt")).then(function(r){done(r,"Request sent. Nothing moves until your friend approves");});},
  fok:function(id){S.friendLoanApprove(id).then(function(r){done(r,"Loan sent");});},
  fno:function(id){S.friendLoanReject(id).then(function(ok){T(ok?"Request rejected":"Not available");render();});},
  fcancel:function(id){S.friendLoanCancel(id).then(function(ok){T(ok?"Request cancelled":"Not available");render();});},
  frepay:function(id,rem){var a=num("fr_"+id)||rem;S.friendLoanRepay(id,a).then(function(r){done(r,"Repayment sent");});}};
})();
