/* =========================================================
   Online XO: two players, no host and no judge.
   One player opens a room, the other joins with the code.
   Every finished game: the winner gets +3 points in stats.
   State lives in the two player slots (each player only writes their own slot):
     players/a = host (X), players/b = guest (O)
     rd = the round this player is ready for, mv = "round:cells", w = wins in this room
   Current round = min(a.rd, b.rd). Cells played this round = the "mv" strings tagged with that round.
========================================================= */
(function(){
if(!window.OL||!OL.i)return;
var I=OL.i,e=I.e,U=I.U,T=I.T,IX=I.IX,IC=I.IC;
var LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
var MARK={
  x:'<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M26 26L74 74" pathLength="100"/><path d="M74 26L26 74" pathLength="100" style="animation-delay:.12s"/></svg>',
  o:'<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="25" pathLength="100"/></svg>'
};
var done={},startedFor="";

function cells(p,R){var m=String((p&&p.mv)||"").split(":");if(+m[0]!==R)return[];
  return(m[1]||"").split("").map(Number).filter(function(n){return n>=0&&n<=8;});}
function winOf(b){for(var i=0;i<LINES.length;i++){var l=LINES[i];if(b[l[0]]&&b[l[0]]===b[l[1]]&&b[l[0]]===b[l[2]])return{w:b[l[0]],line:l};}return null;}
function calc(S,uid){
  var P=S.players||{},a=P.a,b=P.b,both=!!(a&&b);
  var R=both?Math.min(a.rd||1,b.rd||1):((a&&a.rd)||1);
  var xs=cells(a,R),os=both?cells(b,R):[],bd=Array(9).fill("");
  xs.forEach(function(i){bd[i]="x";});os.forEach(function(i){if(!bd[i])bd[i]="o";});
  var n=xs.length+os.length,first=(R%2===1)?"x":"o",turn=(n%2===0)?first:(first==="x"?"o":"x");
  var w=winOf(bd),over=!!w||n>=9,my=a&&a.uid===uid?"x":(b&&b.uid===uid?"o":"");
  return{both:both,R:R,bd:bd,turn:turn,w:w,over:over,draw:over&&!w,my:my,n:n,a:a,b:b,xs:xs,os:os,
    mySlot:my==="x"?"a":(my==="o"?"b":""),myRd:my==="x"?((a&&a.rd)||1):((b&&b.rd)||1)};}

/* ---------- stats: +3 points for a win, once per finished game ---------- */
function record(c,ctx){
  var u=U(),key="olxo_"+ctx.code+"_"+(ctx.S.created||0)+"_"+c.R;
  if(done[key])return;done[key]=1;
  try{if(localStorage.getItem(key))return;localStorage.setItem(key,"1");}catch(x){}
  var db=I.db(),win=!c.draw&&c.w&&c.w.w===c.my,pts=win?3:0;
  if(pts&&window.SHK)SHK.points(pts,key);   /* 1 نقطة = 10 شنكلولو */
  db.ref("users/"+u.uid+"/stats/xo").transaction(function(s){s=s||{pts:0,right:0,wrong:0,games:0,wins:0};s.pts+=pts;s.games+=1;if(win)s.wins+=1;return s;},function(err){
    if(err)return;
    I.syncLB(function(){if(pts)db.ref("lb/"+u.uid+"/m/"+I.mkey()).transaction(function(v){return(v||0)+pts;});});});
  if(win){var cur=(c.my==="x"?c.a:c.b)||{};db.ref("rooms/"+ctx.code+"/players/"+c.mySlot+"/w").set((cur.w||0)+1);}
}

/* ---------- actions ---------- */
function play(i){
  var ctx=I.ctx(),S=ctx.S;if(!S)return;var c=calc(S,U().uid);
  if(!c.both||c.over||!c.my||c.turn!==c.my||c.bd[i])return;
  var mine=(c.my==="x"?c.xs:c.os).concat(i);
  I.db().ref("rooms/"+ctx.code+"/players/"+c.mySlot+"/mv").set(c.R+":"+mine.join(""));
  try{if(typeof playClickSound==="function")playClickSound();}catch(x){}
}
function next(){
  var ctx=I.ctx(),S=ctx.S;if(!S)return;var c=calc(S,U().uid);if(!c.over||!c.my)return;
  I.db().ref("rooms/"+ctx.code+"/players/"+c.mySlot+"/rd").set(c.R+1);
}
function leave(){if(confirm("Leave this room?"))OL.exit();}

/* ---------- screen ---------- */
function pcard(p,sym,c,turnNow){
  var name=p?p.name:"Waiting...",wins=p?(p.w||0):0,me=p&&p.uid===U().uid;
  return'<div class="xo2-pl '+sym+(turnNow?' is-turn':'')+(p?'':' empty')+'"'+(p?' onclick="OL.prof(\''+e(p.uid)+'\')"':'')+'><span class="xo2-pm">'+MARK[sym]+'</span><b dir="auto">'+e(name)+(me?' (you)':'')+'</b><em>'+wins+'</em></div>';}
function draw(){
  var ctx=I.ctx(),S=ctx.S,u=U();if(!S)return;
  var c=calc(S,u.uid),host=ctx.role==="host";
  var sk=ctx.code+"_"+(S.created||0);if(host&&c.both&&S.status==="lobby"&&startedFor!==sk){startedFor=sk;I.db().ref("rooms/"+ctx.code).update({status:"play"});}
  var o={room:true,t:"XO",g:"xo",playing:c.both&&!c.over};
  if(!c.both){
    I.shell('<div class="ol-ticket" onclick="OL.copy()"><small>Room code · tap to share</small><div class="ol-code">'+e(ctx.code)+'</div><span>Send this code to a friend</span></div>'+
      '<div class="xo2-wait"><div class="xo2-dots"><i></i><i></i><i></i></div>Waiting for your friend to join...</div>'+
      '<div class="xo2-rules">Win a game and get <b>+3</b> points in your stats. Draws give nothing.</div>'+
      (host?'<button type="button" class="ol-b r" onclick="OL.close()">Close Room</button>':''),o);return;}
  if(c.over)record(c,ctx);
  var winSym=c.w?c.w.w:"",iWon=c.over&&!c.draw&&winSym===c.my;
  var status;
  if(!c.my)status='<span>Spectating</span>';
  else if(c.over){
    if(c.draw)status='<span class="xo2-d">Draw. Nobody scores.</span>';
    else status=iWon?'<span class="xo2-w">You win! +3 points</span>':'<span class="xo2-l">'+e((winSym==="x"?c.a:c.b).name)+' wins this one</span>';
  }else status=c.turn===c.my?'<span class="xo2-t">Your turn</span>':'<span>'+e((c.turn==="x"?c.a:c.b).name)+' is playing...</span>';
  var b='';for(var i=0;i<9;i++){var v=c.bd[i],win=c.w&&c.w.line.indexOf(i)>=0;
    b+='<button type="button" class="xo2-cell'+(v?' is-'+v:'')+(win?' is-win':'')+(c.w&&!win?' is-dim':'')+'" '+((v||c.over||c.turn!==c.my)?'disabled ':'')+'onclick="OLXO.play('+i+')" aria-label="Cell '+(i+1)+'">'+(v?MARK[v]:'')+'</button>';}
  var foot='';
  if(c.over){foot=c.myRd>c.R?'<div class="xo2-wait sm">Waiting for '+e((c.my==="x"?c.b:c.a).name)+' to start the next game...</div>':'<button type="button" class="xo2-next" onclick="OLXO.next()">Next Game</button>';}
  I.shell('<div class="xo2-score">'+pcard(c.a,"x",c,!c.over&&c.turn==="x")+'<div class="xo2-mid"><small>Game</small><em>'+c.R+'</em></div>'+pcard(c.b,"o",c,!c.over&&c.turn==="o")+'</div>'+
    '<p class="xo2-status" role="status" aria-live="polite">'+status+'</p><div class="xo2-board'+(c.draw?' is-draw':'')+'">'+b+'</div>'+
    '<div class="xo2-foot">'+foot+'<div class="xo2-rules">Winner of each game gets <b>+3</b> points in stats.</div>'+
    (host?'<button type="button" class="ol-s" onclick="OL.close()">Close Room</button>':'<button type="button" class="ol-s" onclick="OLXO.leave()">Leave Room</button>')+'</div>',o);
}

/* ---------- styles (same slate and pink identity as the offline XO) ---------- */
var css=`
#olRoot[data-g="xo"]{--bg:#0b0f11;--bgr:11,15,17;--bg0:#070a0b;--wash:radial-gradient(ellipse at 50% -10%,rgba(54,67,74,.75),transparent 62%);--card:#1d262b;--cardr:29,38,43;--card2:#2a353b;--h1:#36434A;--h2:#1d262b;--ln:rgba(229,212,200,.16);--ln2:rgba(229,212,200,.3);--mu:#b3a59b;--mu2:#8a7f77;--ink:#E5D4C8;--ink2:#E5D4C8;--ac:#FF4777;--acr:255,71,119;--on:#1a1214}
#olRoot[data-g="xo"] .ol-ttl{font-family:Anton,Impact,'Arial Black',sans-serif;font-weight:400;letter-spacing:.16em;color:var(--ac);font-size:26px}
.xo2-score{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;margin-top:4px}
.xo2-pl{display:flex;flex-direction:column;align-items:center;gap:2px;padding:12px 6px 9px;background:#36434A;border-radius:22px;border:2px solid transparent;opacity:.7;transition:border-color .15s,opacity .15s;min-width:0;cursor:pointer}
.xo2-pl.is-turn{border-color:#FF4777;opacity:1}.xo2-pl.empty{opacity:.4;cursor:default}
.xo2-pm{width:22px;height:22px}.xo2-pm svg{width:100%;height:100%;fill:none;stroke-width:12;stroke-linecap:round}
.xo2-pl.x .xo2-pm svg{stroke:#FF4777}.xo2-pl.o .xo2-pm svg{stroke:#E5D4C8}
.xo2-pm svg path,.xo2-pm svg circle{stroke-dasharray:none;animation:none}
.xo2-pl b{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:700;color:#E5D4C8}
.xo2-you{font:700 10px/1 Anton,Impact,sans-serif;letter-spacing:.18em;color:#1a1214;background:#E5D4C8;border-radius:4px;padding:3px 6px 2px;margin-top:2px}
.xo2-pl em{font-style:normal;font-family:Anton,Impact,'Arial Black',sans-serif;font-size:38px;line-height:1.05}
.xo2-pl.x em{color:#FF4777}.xo2-pl.o em{color:#E5D4C8}
.xo2-mid{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:52px;color:#b3a59b}
.xo2-mid small{font-size:12px}.xo2-mid em{font-style:normal;font-family:Anton,Impact,sans-serif;font-size:26px;line-height:1}
.xo2-status{min-height:30px;margin:16px 0 0;text-align:center;font-size:17px;font-weight:600;color:#E5D4C8}
.xo2-status .xo2-t{color:#FF4777}.xo2-status .xo2-w{color:#FF4777;font-weight:800}.xo2-status .xo2-d{color:#b3a59b}
.xo2-board{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(100%,360px);margin:14px auto 0}
.xo2-cell{position:relative;aspect-ratio:1;min-height:0;padding:0;display:grid;place-items:center;background:#36434A;border:0;border-radius:26px;cursor:pointer;transition:background .15s,opacity .2s,transform .1s}
.xo2-cell:not(:disabled):active{transform:scale(.94);background:#2a353b}.xo2-cell:disabled{cursor:default}
.xo2-cell svg{width:58%;height:58%;fill:none;stroke-width:11;stroke-linecap:round}
.xo2-cell.is-x svg{stroke:#FF4777}.xo2-cell.is-o svg{stroke:#E5D4C8}
.xo2-cell svg path,.xo2-cell svg circle{stroke-dasharray:100;stroke-dashoffset:100;animation:xo2Draw .26s ease-out forwards}
@keyframes xo2Draw{to{stroke-dashoffset:0}}
.xo2-cell.is-win{background:#FF4777}.xo2-cell.is-win svg{stroke:#1a1214}.xo2-cell.is-dim{opacity:.4}
.xo2-board.is-draw .xo2-cell{background:#2a353b}
.xo2-foot{display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:20px}
.xo2-foot .ol-s{margin:0;width:min(100%,360px)}
.xo2-next{width:min(100%,360px);min-height:54px;background:#FF4777;color:#1a1214;border:0;border-radius:20px;font:800 17px inherit;font-family:inherit;cursor:pointer}.xo2-next:active{transform:scale(.97)}
.xo2-rules{text-align:center;color:#b3a59b;font-size:13px;line-height:1.6}.xo2-rules b{color:#FF4777}
.xo2-wait{display:flex;flex-direction:column;align-items:center;gap:12px;margin:22px 0 10px;padding:20px 14px;border-radius:20px;border:1px dashed rgba(255,71,119,.5);color:#E5D4C8;text-align:center}
.xo2-wait.sm{margin:0;padding:12px 14px;width:min(100%,360px)}
.xo2-dots{display:flex;gap:7px}.xo2-dots i{width:9px;height:9px;border-radius:50%;background:#FF4777;animation:xo2B 1s infinite ease-in-out}.xo2-dots i:nth-child(2){animation-delay:.15s}.xo2-dots i:nth-child(3){animation-delay:.3s}
@keyframes xo2B{0%,80%,100%{opacity:.25;transform:scale(.8)}40%{opacity:1;transform:scale(1.1)}}
#xo .ol-go{--olc:#FF4777;font-family:'IBM Plex Sans','Segoe UI',system-ui,sans-serif;border-color:rgba(255,71,119,.6);border-radius:20px;min-height:54px;margin:12px 0 0;max-width:none}
@media (prefers-reduced-motion:reduce){.xo2-cell svg path,.xo2-cell svg circle{animation:none;stroke-dashoffset:0}.xo2-dots i{animation:none}}
`;
var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
window.OLXO={draw:draw,play:play,next:next,leave:leave};
})();
