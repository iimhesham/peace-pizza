/* =========================================================
   BJHOST — مدير طاولة البلاك جاك (بيشتغل على جهاز صاحب الطاولة بس).
   من غير سيرفر: صاحب الطاولة بيشغّل محرك القواعد (BJE) ويكتب الحالة العامة في
   rooms/<code>/bjs ، والشوز والورقة المخفية بتفضل عنده (في الذاكرة + secrets/<code>/bj
   اللي القواعد بتخليها له هو بس) فاللاعبين مايشوفوش الورقة المخفية قبل الكشف.
   - اللاعب بيكتب نيته في players/<slot>/q = {id, r, t, a} والمضيف بيطبقها بالقواعد.
   - الدلر البشري والدلر الآلي بيعدّوا على نفس dealerStep (نفس قواعد الدلر بالظبط).
   - الفلوس: اللاعب بيخصم رهانه من محفظته لحظة الوضع، والمضيف بيكتب العائد لكل لاعب
     في inbox/<uid>/bj_<code>_<round> وكل لاعب بيستلمه مرة واحدة (SHK.claimInbox).
========================================================= */
(function(root){
"use strict";
var E=root.BJE;
var SL=["s1","s2","s3","s4","s5"];
var TIMES={bet:30000,ins:20000,turn:45000,dealer:50000,show:9000,step:900,hb:5000};

function create(cfg){
  var db=cfg.db,code=cfg.code,hostUid=cfg.hostUid,getRoom=cfg.getRoom,now=cfg.now||Date.now,T=Object.assign({},TIMES,cfg.times||{});
  var onErr=cfg.onError||function(){};
  var H={code:code,n:0,rid:"",round:null,shoe:null,ph:"WAITING",bets:{},acked:{},dl:0,dur:0,dlk:0,who:"",msg:"",
         showUntil:0,stepAt:0,forceDeal:false,dealerClick:false,ready:false,lastPub:"",lastHb:0,seq:0,turnKey:"",stopped:false,uids:{}};
  var ref=function(p){return db.ref("rooms/"+code+(p?"/"+p:""));};

  /* ---------- حفظ/استرجاع (لو صاحب الطاولة عمل Refresh) ---------- */
  function persist(){
    if(H.stopped)return;
    var v={n:H.n,rid:H.rid,ph:H.ph,bets:H.bets,acked:H.acked,dur:H.dur,round:H.round||null,shoe:H.round?null:(H.shoe||null),uids:H.uids};
    db.ref("secrets/"+code+"/bj").set(JSON.parse(JSON.stringify(v))).catch(function(){});
  }
  var ready=db.ref("secrets/"+code+"/bj").once("value").then(function(s){
    var v=s.val();
    if(v){H.n=v.n||0;H.rid=v.rid||"";H.ph=v.ph||"WAITING";H.bets=v.bets||{};H.acked=v.acked||{};H.round=v.round||null;H.shoe=v.shoe||(H.round?H.round.shoe:null);H.uids=v.uids||{};
      if(H.round){H.round.dealer=H.round.dealer||[];H.round.seats=H.round.seats||[];}
      H.dur=v.dur||0;H.dl=now()+(H.dur||T.turn);H.dlk++;}
  }).catch(function(){}).then(function(){H.ready=true;});

  /* ---------- أدوات ---------- */
  function room(){return getRoom()||null;}
  function seated(S){var P=(S&&S.players)||{},max=((S&&S.bj)||{}).max||5,out=[];SL.slice(0,max).forEach(function(k){if(P[k]&&P[k].uid)out.push(k);});return out;}
  function setPhase(ph,dur,who){H.ph=ph;H.dur=dur||0;H.dl=dur?now()+dur:0;H.dlk++;H.who=who||"";H.stepAt=now()+T.step;}
  function seatIdx(slot){return H.round?H.round.seats.findIndex(function(s){return s.id===slot;}):-1;}
  function refundTicket(uid,rid){ // العميل بيسترجع اللي دفعه من علامة الرهان بتاعته (من غير ما المضيف يحدد مبلغ)
    return db.ref("inbox/"+uid+"/bj_"+code+"_"+rid).set({a:0,s:0,r:"blackjack_refund",f:hostUid,room:code,t:now()}).catch(function(e){onErr(e);});
  }

  /* ---------- نوايا اللاعبين ---------- */
  function intents(S){
    var P=(S&&S.players)||{},changed=false;
    SL.forEach(function(slot){
      var p=P[slot];if(!p||!p.q)return;
      var q=p.q;if(!q.id||q.id<=(H.acked[slot]||0))return;
      H.acked[slot]=q.id;changed=true;H.uids[slot]=p.uid;
      handle(slot,p,q);
    });
    return changed;
  }
  function handle(slot,p,q){
    if(q.t==="bet"){
      if(H.ph==="BETTING"&&q.r===H.rid&&!H.bets[slot]&&E.validBet(q.a)){H.bets[slot]=q.a;H.uids[slot]=p.uid;}
      else if(!H.bets[slot]||q.r!==H.rid){refundTicket(p.uid,q.r||"x");}   // رهان متأخر/مش في ميعاده
      return;
    }
    if(!H.round)return;
    var i=seatIdx(slot);if(i<0||H.round.seats[i].uid!==p.uid)return;
    if(q.t==="ins"){if(H.ph==="INSURANCE"&&q.r===H.rid){E.setInsurance(H.round,i,Math.max(0,Math.floor(+q.a||0)));syncAfterEngine();}return;}
    if(H.ph==="PLAYER_TURNS"&&q.r===H.rid&&H.round.turn&&H.round.turn.s===i){
      var r=E.act(H.round,i,q.t,Infinity);
      if(r.ok)syncAfterEngine();
    }
  }

  /* ---------- مزامنة المرحلة مع المحرك ---------- */
  function syncAfterEngine(){
    var r=H.round;if(!r)return;
    if(r.phase==="SETTLEMENT"){if(H.ph!=="SETTLEMENT"&&H.ph!=="ROUND_COMPLETE")settle();return;}
    if(r.phase==="INSURANCE"){if(H.ph!=="INSURANCE")setPhase("INSURANCE",T.ins);return;}
    if(r.phase==="PLAYER_TURNS"){
      var tk=r.turn?r.turn.s+":"+r.turn.h+":"+r.seats[r.turn.s].hands.length+":"+r.seats[r.turn.s].hands[r.turn.h].cards.length:"";
      if(H.ph!=="PLAYER_TURNS"||H.turnKey!==tk){H.turnKey=tk;setPhase("PLAYER_TURNS",T.turn,r.turn?r.seats[r.turn.s].id:"");}
      return;
    }
    if(r.phase==="DEALER_TURN"){
      if(H.ph!=="DEALER_TURN")setPhase("DEALER_TURN",modeOf()==="human"?T.dealer:0,"dealer");
    }
  }
  function modeOf(){var S=room();return(S&&S.bj&&S.bj.dealer)||"cpu";}

  /* ---------- الحسم والدفع ---------- */
  function settle(){
    var r=H.round,res=r.result;if(!res)return;
    H.msg=res.dealerBJ?"Dealer has Blackjack":res.dealerBust?"Dealer busts with "+res.dealerTotal:"Dealer stands on "+res.dealerTotal;
    res.seats.forEach(function(s){
      var reason=s.net>0?(s.hands.some(function(h){return h.outcome==="blackjack";})?"blackjack_blackjack":"blackjack_win"):s.net<0?"blackjack_loss":"blackjack_push";
      var uid=s.uid;if(!uid)return;
      db.ref("inbox/"+uid+"/bj_"+code+"_"+r.id).set({a:s.returned,r:reason,f:hostUid,s:s.staked,room:code,t:now()}).catch(function(e){onErr(e);});
    });
    H.showUntil=now()+T.show;
    setPhase("SETTLEMENT",0,"");
  }

  /* ---------- جولة جديدة ---------- */
  function startBetting(){
    H.rid="r"+(++H.n);H.round=null;H.bets={};H.turnKey="";H.msg="";H.auto=false;H.dealerClick=false;
    setPhase("BETTING",T.bet,"");
  }
  function dealRound(S){
    var P=S.players||{},ent=[];
    SL.forEach(function(slot){
      var a=H.bets[slot];if(!a)return;
      var p=P[slot];var uid=(p&&p.uid)||H.uids[slot];if(!uid)return;
      ent.push({id:slot,uid:uid,name:(p&&p.name)||"Player",bet:a});
    });
    if(!ent.length)return false;
    try{H.round=E.startRound({id:H.rid,shoe:H.shoe,entrants:ent});}catch(x){onErr(x);return false;}
    H.shoe=H.round.shoe;H.msg=H.round.reshuffled?"New shoe shuffled":"";
    H.forceDeal=false;
    var ph=H.round.phase;
    if(ph==="SETTLEMENT"){settle();}
    else if(ph==="DEALER_TURN"){setPhase("DEALER_TURN",modeOf()==="human"?T.dealer:0,"dealer");}
    else if(ph==="INSURANCE"){setPhase("INSURANCE",T.ins);}
    else{H.turnKey="";syncAfterEngine();}
    return true;
  }

  /* ---------- النبضة الرئيسية ---------- */
  function tick(){
    if(H.stopped||!H.ready)return;
    var S=room();if(!S){return;}
    var t=now(),ch=false,seatedNow=seated(S);
    if(intents(S))ch=true;

    if(H.ph==="WAITING"){
      if(seatedNow.length){startBetting();ch=true;}
    }else if(H.ph==="BETTING"){
      var bet=Object.keys(H.bets).length,all=seatedNow.length&&seatedNow.every(function(k){return H.bets[k];});
      if(!seatedNow.length&&!bet){H.ph="WAITING";H.dl=0;ch=true;}
      else if(bet&&(all&&modeOf()!=="human"||H.forceDeal||t>=H.dl)){if(dealRound(S))ch=true;}
      else if(!bet&&t>=H.dl){setPhase("BETTING",T.bet,"");ch=true;}   // مفيش رهانات: نفتح المهلة تاني
    }else if(H.ph==="INSURANCE"&&H.round){
      if(t>=H.dl){H.round.seats.forEach(function(s,i){if(!s.insAsked)E.setInsurance(H.round,i,0);});syncAfterEngine();ch=true;}
    }else if(H.ph==="PLAYER_TURNS"&&H.round&&H.round.turn){
      var i=H.round.turn.s,seat=H.round.seats[i],P=S.players||{},cur=P[seat.id],gone=!cur||cur.uid!==seat.uid;
      if(t>=H.dl||(gone&&t>=H.dl-T.turn+1500)){ // انتهى الوقت (أو اللاعب مشي): Stand
        var r=E.act(H.round,i,"stand",Infinity);if(r.ok){H.msg=seat.name+(gone?" left":" ran out of time")+": stand";syncAfterEngine();ch=true;}
      }
    }else if(H.ph==="DEALER_TURN"&&H.round){
      var human=modeOf()==="human",go=false,once=false;
      if(!human)H.auto=true;                                   // دلر CPU: بيلعب لوحده بنفس القواعد
      else if(H.dealerClick){go=true;once=true;H.dealerClick=false;}  // دلر بشري: ضغطة = خطوة واحدة إجبارية
      else if(H.dl&&t>=H.dl)H.auto=true;                       // الدلر البشري سكت: نكمل أوتوماتيك بنفس القواعد
      if(H.auto&&t>=H.stepAt)go=true;
      if(go&&(once||t>=H.stepAt)){
        var st=E.dealerStep(H.round);H.stepAt=t+T.step;ch=true;
        if(st.done)settle();
        else if(human&&!H.auto){H.dl=t+T.dealer;H.dlk++;}
      }
    }else if(H.ph==="SETTLEMENT"){
      if(t>=H.showUntil){setPhase("ROUND_COMPLETE",0,"");ch=true;}
    }else if(H.ph==="ROUND_COMPLETE"){
      if(seatedNow.length){startBetting();ch=true;}else{H.ph="WAITING";H.round=null;ch=true;}
    }
    publish(ch);
  }

  /* ---------- النشر ---------- */
  function publish(force){
    var t=now(),pub=H.round?E.publicView(H.round):null;
    var o={ph:H.ph,rid:H.rid,dur:H.dur,dlk:H.dlk,who:H.who,bets:H.bets,ack:H.acked,msg:H.msg,pub:pub,mode:modeOf(),n:H.n};
    var j=JSON.stringify(o);
    if(!force&&j===H.lastPub&&t-H.lastHb<T.hb)return;
    if(j!==H.lastPub)persist();
    H.lastPub=j;H.lastHb=t;o.seq=++H.seq;o.hb=t;
    ref("bjs").set(JSON.parse(JSON.stringify(o))).catch(function(e){onErr(e);});
  }

  /* ---------- واجهة للـ UI ---------- */
  function dealerGo(){if(H.ph==="DEALER_TURN")H.dealerClick=true;tick();}
  function deal(){if(H.ph==="BETTING"&&Object.keys(H.bets).length){H.forceDeal=true;tick();}}
  function stop(){H.stopped=true;}
  function view(){ // اللي صاحب الطاولة بس يشوفه: ورق الدلر كامل
    var r=H.round;return{ph:H.ph,dealer:r?r.dealer.slice():[],holeShown:r?r.holeShown:false,shouldHit:r?E.dealerShouldHit(r.dealer):false,bets:H.bets,round:r};
  }
  return{ready:ready,tick:tick,dealerGo:dealerGo,deal:deal,stop:stop,view:view,H:H,persist:persist};
}
root.BJHOST={create:create,TIMES:TIMES,SLOTS:SL};
})(typeof window!=="undefined"?window:globalThis);
