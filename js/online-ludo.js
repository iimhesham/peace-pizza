/* =========================================================
   Online Ludo: 2 to 6 players, one room code, host starts the game.
   Classic board = up to 4 players. "6-player board" (host switch in the lobby, opts.six=1) = up to 6 players on a
   six-arm board with two extra colours (violet, pink). Same rules engine, same replay, just a longer track.

   How it works (no game server, only the existing Firebase rooms):
   - Same rules engine as the offline game (js/ludo-engine.js).
   - Nobody sends a dice result or a piece position. Each player only
     writes the list of actions they chose, in their own slot:
       players/<slot>/mv = "<gid>:<log>"   log chars: "r" = roll, "0".."3" = piece
   - The dice are NOT random on the client: roll number k of a game is a fixed
     function of the room seed, so nobody can re-roll or pick a number.
   - Every phone replays the same log with the same engine, so everybody gets
     the same board. A move that is not legal is simply ignored by the replay.
   - Host-only fields: status, cols (slot -> colour), seed, gid, opts, bots.
   - bots/<colour> = n: the host hands a seat that stopped playing to the CPU;
     the player's first n actions stay, then the CPU plays that seat.
   Every finished game: 1st place +10, 2nd +7, 3rd +5, everyone else 0 points in stats.
========================================================= */
(function(){
if(!window.OL||!OL.i||!window.LudoEngine||!window.LudoUI)return;
var I=OL.i,e=I.e,U=I.U,T=I.T,IX=I.IX,IC=I.IC,E=LudoEngine,UI=LudoUI;
var SLOTS=["a","b","c","d","e","f"],done={},view=null,CN=UI.CNAME;
function isSix(S){return!!(S&&S.opts&&S.opts.six);}
function capOf(S){return isSix(S)?6:4;}
function seatsFor(six,n){return(six?UI.SEAT_LAYOUT6:UI.SEAT_LAYOUT)[Math.max(2,Math.min(n,six?6:4))];}

/* ---------- replay ---------- */
function replay(S){
  var cols=S.cols||{},P=S.players||{},seed=(S.seed|0),gid=+S.gid||0,o=S.opts||{};
  var mode=o.six?6:4,slotOf={},order=E.LY(mode).colors.filter(function(c){
    var sl=SLOTS.filter(function(s){return cols[s]===c&&P[s];})[0];if(sl)slotOf[c]=sl;return!!sl;});
  if(order.length<2)return null;
  var cfg=order.map(function(c){var p=P[slotOf[c]];return{color:c,type:"human",name:p.name||CN[c],uid:p.uid||""};});
  var g=E.initializeGame(cfg,{threeSixes:o.three!==0,fullRanking:!!o.full,mode:mode},Math.abs(seed)%order.length);
  var logs={},bots=S.bots||{},ptr={},k=0,trace=[],guard=0,wait=null;
  order.forEach(function(c){
    var m=String((P[slotOf[c]]||{}).mv||""),i=m.indexOf(":"),L=(i>0&&+m.slice(0,i)===gid)?m.slice(i+1):"";
    if(bots[c]!=null)L=L.slice(0,Math.max(0,+bots[c]||0));
    logs[c]=L;ptr[c]=0;});
  while(g.phase!=="over"&&guard++<8000){
    var col=E.cur(g).color,L=logs[col],avail=ptr[col]<L.length,bot=bots[col]!=null&&!avail;
    if(g.phase==="roll"){
      if(avail){if(L.charAt(ptr[col]++)!=="r")continue;}
      else if(!bot){wait={color:col,need:"roll"};break;}
      var dice=E.diceFor(seed,k++),res=E.applyRoll(g,dice);
      trace.push({t:"roll",color:col,dice:dice,noMove:!!(res.noMove||res.cancelled),cancelled:!!res.cancelled});
    }else{
      var id=null;
      if(avail){var ch=L.charAt(ptr[col]++);if(ch<"0"||ch>"3")continue;id=col+"-"+(+ch+1);
        if(!g.valid.some(function(m){return m.tokenId===id;}))continue;}
      else if(bot){var m=E.chooseAIMoveSeeded(g,seed,k);id=m.tokenId;}
      else{wait={color:col,need:"move"};break;}
      var tk=E.tokenOf(g,id),from=tk.position,dv=g.diceValue,r=E.moveToken(g,id,dv);
      trace.push({t:"move",color:col,id:id,from:from,to:r.to,captured:r.captured||[],finished:!!r.finished});
    }
  }
  return{g:g,trace:trace,wait:wait,order:order,slotOf:slotOf,gid:gid,seed:seed,over:g.phase==="over",cols:cols,bots:bots};
}
function mySeat(S,uid){var P=S.players||{};return SLOTS.filter(function(s){return P[s]&&P[s].uid===uid;})[0]||"";}
function present(S){var P=S.players||{};return SLOTS.filter(function(s){return P[s];});}
function myLog(S,slot){var P=S.players||{},m=String((P[slot]||{}).mv||""),i=m.indexOf(":");return(i>0&&+m.slice(0,i)===(+S.gid||0))?m.slice(i+1):"";}

/* ---------- writes ---------- */
function db(){return I.db();}
function room(code){return db().ref("rooms/"+code);}
function send(ch){
  var ctx=I.ctx(),S=ctx.S;if(!S||!view)return;
  var slot=mySeat(S,U().uid);if(!slot)return;
  room(ctx.code).child("players/"+slot+"/mv").set((+S.gid||0)+":"+myLog(S,slot)+ch);
}
function roll(){
  var R=view&&view.R,ctx=I.ctx();if(!R||view.anim||view.lock||!ctx.S)return;
  var my=R.cols[mySeat(ctx.S,U().uid)];
  if(!R.wait||R.wait.need!=="roll"||R.wait.color!==my)return;
  view.lock=Date.now();try{if(typeof playClickSound==="function")playClickSound();}catch(x){}
  send("r");
}
function auto(){
  UI.autoSet(!UI.autoGet());
  try{if(typeof playClickSound==="function")playClickSound();}catch(x){}
  UI.autoPaint($("oluAuto"));
  T(UI.autoGet()?"Auto roll: on":"Auto roll: off");
  if(view){view.autoKey="";controls();}
}
function pick(id){
  var R=view&&view.R,ctx=I.ctx();if(!R||view.anim||view.lock||!ctx.S)return;
  var my=R.cols[mySeat(ctx.S,U().uid)];
  if(!R.wait||R.wait.need!=="move"||R.wait.color!==my)return;
  if(id.split("-")[0]!==my||!R.g.valid.some(function(m){return m.tokenId===id;}))return;
  view.lock=Date.now();send(String(+id.split("-")[1]-1));
}
function start(again){
  var ctx=I.ctx(),S=ctx.S;if(!S||ctx.role!=="host")return;
  var sl=present(S);if(again&&S.cols){}else if(sl.length<2){T("You need at least 2 players");return;}
  var u={status:"play",seed:(Math.random()*2147483647)|0,gid:(+S.gid||0)+1,bots:null};
  if(!again||!S.cols){var lay=seatsFor(isSix(S),sl.length),cols={};sl.forEach(function(s,i){cols[s]=lay[i];});u.cols=cols;}
  room(ctx.code).update(u);
}
function opt(k){
  var ctx=I.ctx(),S=ctx.S;if(!S||ctx.role!=="host"||S.status!=="lobby")return;
  if(k==="six"&&isSix(S)&&present(S).length>4){T("More than 4 players are in the room, so the 6-player board must stay on");return;}
  var o=S.opts||{three:1,full:0};room(ctx.code).child("opts/"+k).set(o[k]===0||!o[k]?1:0);
}
function bot(color){
  var ctx=I.ctx(),S=ctx.S,R=view&&view.R;if(!S||!R||ctx.role!=="host")return;
  var p=(S.players||{})[R.slotOf[color]];if(!p||p.uid===U().uid)return;
  if(!confirm("Let the computer play for "+p.name+"?"))return;
  room(ctx.code).child("bots/"+color).set(myLog(S,R.slotOf[color]).length);
}
function leave(){
  var ctx=I.ctx(),S=ctx.S;
  if(S&&S.status==="lobby"&&ctx.role!=="host"){var sl=mySeat(S,U().uid);if(sl)room(ctx.code).child("players/"+sl).remove().catch(function(){});OL.exit();return;}
  if(confirm("Leave this room?"))OL.exit();
}

/* ---------- stats: 1st +10, 2nd +7, 3rd +5 ---------- */
var PTS=[10,7,5];
function record(R,ctx){
  var u=U(),S=ctx.S,my=R.cols[mySeat(S,u.uid)];if(!my)return;
  if(R.bots[my]!=null)return;
  var key="ollu_"+ctx.code+"_"+(S.created||0)+"_"+R.gid;
  if(done[key])return;done[key]=1;
  try{if(localStorage.getItem(key))return;localStorage.setItem(key,"1");}catch(x){}
  var win=R.g.winner===my,pts=PTS[R.g.ranking.indexOf(my)]||0,d=db();
  d.ref("users/"+u.uid+"/stats/ludo").transaction(function(s){s=s||{pts:0,right:0,wrong:0,games:0,wins:0};s.pts+=pts;s.games+=1;if(win)s.wins+=1;return s;},function(err){
    if(err)return;
    I.syncLB(function(){if(pts)d.ref("lb/"+u.uid+"/m/"+I.mkey()).transaction(function(v){return(v||0)+pts;});});});
}

/* ---------- screens ---------- */
var $=function(id){return document.getElementById(id);};
function dot(c){return'<span class="lu-dot c-'+c+'"></span>';}

function lobby(ctx,S){
  view=null;
  var host=ctx.role==="host",sl=present(S),P=S.players||{},o=S.opts||{three:1,full:0},n=sl.length,six=isSix(S),cap=capOf(S),lay=seatsFor(six,n);
  var rows=SLOTS.slice(0,Math.max(cap,n)).map(function(s,i){
    var p=P[s];if(!p)return'<div class="ol-t empty olu-row">Waiting for a player...</div>';
    var k=sl.indexOf(s),c=lay[k];
    return'<div class="ol-t ol-ck olu-row c-'+c+'" onclick="OL.prof(\''+e(p.uid)+'\')"><b>'+dot(c)+I.nmu(p.uid,p.name)+(p.uid===S.host?' <small class="olu-tag">HOST</small>':'')+'</b></div>';}).join("");
  var set=host?'<div class="ol-sec">Rules</div>'+
    '<button type="button" class="ol-sw'+(six?' on':'')+'" onclick="OLLUDO.opt(\'six\')"><span><b>6-player board</b><small>'+(six?'Up to 6 players on the big board. Two extra colours: violet and pink':'Classic board, up to 4 players. Switch on for up to 6 players')+'</small></span><i></i></button>'+
    '<button type="button" class="ol-sw'+(o.three!==0?' on':'')+'" onclick="OLLUDO.opt(\'three\')"><span><b>Three 6s in a row cancel the turn</b><small>The third 6 is lost and the turn passes</small></span><i></i></button>'+
    '<button type="button" class="ol-sw'+(o.full?' on':'')+'" onclick="OLLUDO.opt(\'full\')"><span><b>Play for every place</b><small>Keep playing after the first winner</small></span><i></i></button>':
    '<div class="olu-rules">'+(six?'6-player board · ':'')+(o.three!==0?'Three 6s in a row cancel the turn':'No limit on 6s')+' · '+(o.full?'Playing for every place':'First home wins')+'</div>';
  I.shell('<div class="ol-ticket" onclick="OL.copy()"><small>Room code · tap to share</small><div class="ol-code">'+e(ctx.code)+'</div><span>Send this code to your friends</span></div>'+
    '<div class="ol-sec">Players ('+n+'/'+cap+')</div>'+rows+set+
    (host?'<button type="button" class="ol-b" '+(n<2?'disabled ':'')+'onclick="OLLUDO.start()">'+(n<2?'Waiting for players...':'Start Game')+'</button><button type="button" class="ol-b r" onclick="OL.close()">Close Room</button>'
         :'<div class="ol-w">Waiting for the host to start...</div><button type="button" class="ol-s" onclick="OLLUDO.leave()">Leave Room</button>')+
    '<div class="xo2-rules">Finish 1st for <b>+10</b> points, 2nd for <b>+7</b>, 3rd for <b>+5</b>.</div>',{room:true,t:"LUDO",g:"ludo",c:""});
}

function playHTML(){
  return'<div id="oluRoot"><div class="lu-strip" id="oluStrip"></div><div class="lu-boardwrap" id="oluBoard"></div>'+
    '<div class="lu-ctl" id="oluCtl"><div id="oluDie"></div><div class="lu-side"><p class="lu-status" id="oluStatus" role="status" aria-live="polite"></p>'+
    '<div class="lu-rollrow"><button type="button" class="lu-roll" id="oluRoll" onclick="OLLUDO.roll()">Roll Dice</button>'+
    '<button type="button" class="lu-auto" id="oluAuto" onclick="OLLUDO.auto()" aria-pressed="false" aria-label="Auto roll" title="Auto roll"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg><span>AUTO</span></button></div></div></div>'+
    '<div class="lu-meta"><span id="oluMeta"></span></div><div id="oluHost"></div><div id="oluRes"></div>'+
    '<button type="button" class="ol-s olu-leave" onclick="OLLUDO.leave()">Leave Room</button></div>';
}

function draw(){
  var ctx=I.ctx(),S=ctx.S;if(!S)return;
  if(S.status==="lobby"||!S.cols)return lobby(ctx,S);
  var R=replay(S);if(!R)return lobby(ctx,S);
  var key=ctx.code+"_"+R.gid+"_"+R.g.mode,fresh=!view||view.key!==key||!$("oluRoot");
  if(fresh){
    I.shell(playHTML(),{room:true,t:"LUDO",g:"ludo",playing:!R.over});
    var board=UI.makeBoard($("oluBoard"),R.order,R.g.mode);
    UI.dieEl($("oluDie"));
    view={key:key,board:board,shown:R.trace.length,R:R,anim:false,lock:0,lastDice:0,dieColor:"",sentAuto:"",over:false};
    for(var i=R.trace.length-1;i>=0;i--)if(R.trace[i].t==="roll"){view.lastDice=R.trace[i].dice;view.dieColor=R.trace[i].color;break;}
    board.render(R.g);
    controls();
    if(R.over)showResult();
    return;
  }
  view.R=R;view.S=S;
  if(view.shown>R.trace.length)view.shown=R.trace.length;
  step();
}

async function step(){
  if(!view||view.anim)return;
  view.anim=true;var v=view;
  try{
    while(view===v){
      var R=v.R,evs=R.trace.slice(v.shown);if(!evs.length)break;
      if(evs.length>10){v.shown=R.trace.length;for(var i=R.trace.length-1;i>=0;i--)if(R.trace[i].t==="roll"){v.lastDice=R.trace[i].dice;v.dieColor=R.trace[i].color;break;}break;}
      var ev=evs[0];v.shown++;
      if(ev.t==="roll"){
        v.dieColor=ev.color;v.lastDice=ev.dice;paintDie(true);
        await UI.rollAnim($("oluDie"),ev.dice,520);if(view!==v)return;
        if(ev.noMove){$("oluStatus").innerHTML=ev.cancelled?"Three sixes. Turn cancelled.":"No move for "+ev.dice+".";await UI.sleep(UI.reduce()?80:800);}
      }else{
        await v.board.animateMove(ev.id,ev.to);if(view!==v)return;
        if(ev.captured.length){try{if(typeof playRevealSound==="function")playRevealSound();}catch(x){}await v.board.flyHome(ev.captured);if(view!==v)return;}
        else try{if(typeof playClickSound==="function")playClickSound();}catch(x){}
      }
    }
  }finally{if(view===v)v.anim=false;}
  if(view!==v)return;
  v.board.render(v.R.g);
  v.lock=0;
  controls();
  if(v.R.over&&v.shown>=v.R.trace.length)showResult();
}

function paintDie(onlyColor){
  var d=$("oluDie"),ctl=$("oluCtl");if(!d||!view)return;
  E.COLORS6.forEach(function(c){ctl.classList.remove("c-"+c);});
  var cur=view.R.over?"":E.cur(view.R.g).color;
  if(cur)ctl.classList.add("c-"+cur);
  if(!onlyColor){UI.setDie(d,view.lastDice);}
  else if(view.dieColor){E.COLORS6.forEach(function(c){ctl.classList.remove("c-"+c);});ctl.classList.add("c-"+view.dieColor);}
}

function controls(){
  var ctx=I.ctx(),S=ctx.S;if(!view||!S||!$("oluRoot"))return;
  var R=view.R,g=R.g,u=U(),slot=mySeat(S,u.uid),my=R.cols[slot],host=ctx.role==="host",over=R.over;
  var cp=over?null:E.cur(g),w=R.wait;
  // strip
  var st=$("oluStrip");st.style.setProperty("--n",R.order.length);st.classList.toggle("is-six",R.order.length>4);
  st.innerHTML=g.players.map(function(p){
    var isBot=R.bots[p.color]!=null,rk=g.ranking.indexOf(p.color);
    return'<div class="lu-pc c-'+p.color+(!over&&cp&&p===cp?' is-turn':'')+(p.finishedTokens>=4?' is-done':'')+'"><span class="lu-dot"></span><b dir="auto">'+e(p.name)+(p.color===my?' (you)':'')+'</b>'+
      '<span class="lu-pips">'+[0,1,2,3].map(function(i){return'<s'+(i<p.finishedTokens?' class="on"':'')+'></s>';}).join("")+'</span>'+
      (isBot?'<span class="lu-rk">CPU</span>':(rk>=0&&g.opts.fullRanking?'<span class="lu-rk">#'+(rk+1)+'</span>':''))+'</div>';}).join("");
  // die
  paintDie(false);
  var mine=!!(w&&my&&w.color===my);
  var rb=$("oluRoll");
  rb.disabled=!(mine&&w.need==="roll"&&!view.lock);
  rb.classList.toggle("is-go",!rb.disabled);
  rb.textContent=!rb.disabled?"Roll Dice":(mine&&w.need==="move"?"Pick a piece":(over?"Game over":"Waiting..."));
  UI.autoPaint($("oluAuto"));
  // Auto roll: if it is my turn to roll and auto is on, roll after a short pause
  if(!rb.disabled&&UI.autoGet()&&!view.anim&&!over){
    var ak=view.key+"_"+R.trace.length;
    if(view.autoKey!==ak){
      view.autoKey=ak;var va=view;
      setTimeout(function(){
        if(view!==va)return;
        var W=va.R.wait;
        if(UI.autoGet()&&!va.anim&&!va.lock&&W&&W.need==="roll"&&W.color===my)roll();
        else va.autoKey="";
      },UI.reduce()?80:650);
    }
  }
  // valid pieces
  if(mine&&w.need==="move"&&!view.lock){
    view.board.setValid(g.valid.map(function(m){return m.tokenId;}),pick);
    var v=g.valid,key=view.key+"_"+view.shown;
    if((v.length===1||v.every(function(m){return m.exit;}))&&view.sentAuto!==key){
      view.sentAuto=key;var vw=view;
      setTimeout(function(){if(view===vw&&!vw.anim&&vw.R.wait&&vw.R.wait.need==="move"&&vw.R.wait.color===my)pick(v[0].tokenId);},UI.reduce()?80:420);
    }
  }else view.board.setValid(null);
  // status
  var txt="";
  if(over)txt="<b>"+e(E.playerOf(g,g.winner).name)+"</b> wins!";
  else if(!slot)txt="Spectating";
  else if(w){
    var wp=E.playerOf(g,w.color),nm="<b>"+e(wp.name)+"</b>";
    if(w.color===my)txt=w.need==="roll"?(g.consecutiveSixes?"Rolled a 6. Roll again":"Your turn. Roll the dice"):"Tap a glowing piece";
    else txt=nm+(w.need==="roll"?" is about to roll...":" is choosing...");
  }
  if(!view.anim)$("oluStatus").innerHTML=txt;
  $("oluMeta").textContent=(g.opts.threeSixes?"3 sixes cancel":"No 6-limit")+" · Turn "+g.turnNo;
  // host: hand a stuck seat to the CPU
  var hp=$("oluHost");hp.innerHTML="";
  if(host&&!over&&w&&w.color!==my&&R.bots[w.color]==null){
    var p=E.playerOf(g,w.color);
    hp.innerHTML='<button type="button" class="ol-s" onclick="OLLUDO.bot(\''+w.color+'\')">Not playing? Let the CPU play for '+e(p.name)+'</button>';
  }
}

function showResult(){
  var ctx=I.ctx(),S=ctx.S;if(!view||!S||view.over)return;
  var R=view.R;if(!R.over)return;view.over=true;
  record(R,ctx);
  try{if(typeof playRevealSound==="function")playRevealSound();}catch(x){}
  var g=R.g,w=E.playerOf(g,g.winner),host=ctx.role==="host";
  var ranks=g.ranking.map(function(c,i){var p=E.playerOf(g,c);
    return'<div class="c-'+c+'"><em>'+(i+1)+'</em><b dir="auto">'+e(p.name)+'</b><small>'+p.finishedTokens+'/4 home · '+p.captures+' captures'+(PTS[i]&&p.color&&R.bots[p.color]==null?' · +'+PTS[i]+' pts':'')+'</small></div>';}).join("");
  $("oluRes").innerHTML='<div class="lu-final-card c-'+g.winner+' olu-res"><div class="lu-trophy"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 21h8M10 17h4"/></svg></div>'+
    '<h3>'+e(w.name)+' wins!</h3><p>1st +10 · 2nd +7 · 3rd +5 points in stats</p><div class="lu-rank">'+ranks+'</div>'+
    (host?'<button type="button" class="lu-main" onclick="OLLUDO.again()">Play Again</button><button type="button" class="lu-alt" onclick="OL.close()">Close Room</button>'
         :'<div class="ol-w">Waiting for the host to start another game...</div>')+
    '<button type="button" class="lu-alt" onclick="OL.rank()">Ranking</button><button type="button" class="lu-link" onclick="OL.stats()">My Stats</button></div>';
  var rs=$("oluRes");if(rs&&rs.scrollIntoView)setTimeout(function(){try{rs.scrollIntoView({behavior:"smooth",block:"nearest"});}catch(x){}},250);
}

/* ---------- styles ---------- */
var css=`
#olRoot[data-g="ludo"]{--bg:#120d0a;--bgr:18,13,10;--bg0:#0c0806;--wash:radial-gradient(ellipse at 50% -10%,rgba(150,92,52,.4),transparent 62%);--card:#261a14;--cardr:38,26,20;--card2:#33241b;--h1:#33241b;--h2:#261a14;--ln:rgba(242,230,207,.16);--ln2:rgba(242,230,207,.3);--mu:#b9a98f;--mu2:#8d7f6a;--ink:#F2E6CF;--ink2:#F2E6CF;--ac:#F2E6CF;--acr:242,230,207;--on:#1a120d}
#olRoot[data-g="ludo"] .ol-ttl{font-family:Anton,Impact,'Arial Black',sans-serif;font-weight:400;letter-spacing:.18em;color:#F2E6CF;font-size:26px}
#olRoot[data-g="ludo"] .lu-boardwrap{width:min(100%,460px)}
.olu-row{display:flex;align-items:center}
.olu-row .lu-dot{display:inline-block;vertical-align:middle;width:20px;height:20px;margin-inline-end:10px;box-shadow:inset 0 0 0 3px var(--pd),inset 0 0 0 6px var(--pl)}
.olu-row.empty{opacity:.45}
.olu-row.c-red{border-inline-start:4px solid #E5484D}.olu-row.c-green{border-inline-start:4px solid #2EAE6B}.olu-row.c-yellow{border-inline-start:4px solid #F2B632}.olu-row.c-blue{border-inline-start:4px solid #3B82E0}.olu-row.c-violet{border-inline-start:4px solid #8B5CF6}.olu-row.c-pink{border-inline-start:4px solid #EC5FA8}
.olu-tag{margin-inline-start:6px;padding:2px 6px;border-radius:5px;background:#F2E6CF;color:#1a120d;font:700 10px/1 Anton,Impact,sans-serif;letter-spacing:.12em}
.olu-rules{margin:10px 0;text-align:center;color:#b9a98f;font-size:13px}
.olu-res.lu-final-card{margin:16px auto 0;width:min(100%,420px);box-shadow:none}
.olu-leave{margin-top:18px}
#oluRoot .lu-pc b{font-size:12px}
#oluHost{margin-top:8px}
`;
var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

window.OLLUDO={draw:draw,roll:roll,auto:auto,start:function(){start(false);},again:function(){start(true);},opt:opt,bot:bot,leave:leave,
  _replay:replay};
})();
