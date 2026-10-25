/* =========================================================
   Online Europe XI: head to head. Two players, no host, no judge.
   One player opens a room, the other joins with the code.
   Each player drafts a private XI, then the same match is simulated on both phones
   from the same seed. At half-time both managers pick a decision.
   State lives in the two player slots (each player only writes their own slot):
     players/a = host, players/b = guest
     xi = the locked XI (JSON, tagged with the game number), hd = half-time decisions "R.L=opt|key;...",
     fw = legs where this player continued without the opponent's decision "R.L;...",
     rd = the game number this player is ready for, w = wins in this room
   Current game = min(a.rd, b.rd). Everything else is derived, so both phones always agree.
   The screens themselves (draft, pitch, match) live in js/ucl.js (window.UCLO).
========================================================= */
(function(){
if(!window.OL||!OL.i)return;
var I=OL.i,e=I.e,U=I.U,T=I.T;
var done={},startedFor="",mounted="";

function snap(S,uid){
  var P=S.players||{},a=P.a,b=P.b,both=!!(a&&b);
  var R=both?Math.min(a.rd||1,b.rd||1):((a&&a.rd)||1);
  return{both:both,R:R,me:a&&a.uid===uid?"a":(b&&b.uid===uid?"b":""),a:a||null,b:b||null,opts:S.opts||{},
    seed:((S.created||1)%2147483000)+1,created:S.created||0};
}
function slotRef(ctx,sn,child){return I.db().ref("rooms/"+ctx.code+"/players/"+sn.me+(child?"/"+child:""));}
function cur(){var ctx=I.ctx();return{ctx:ctx,sn:ctx.S?snap(ctx.S,U().uid):null};}

/* ---------- stats: +5 points for a win, once per finished game ---------- */
function record(r){
  var c=cur();if(!c.sn||!c.sn.me)return;
  var u=U(),key="oluc_"+c.ctx.code+"_"+(c.ctx.S.created||0)+"_"+r.R;
  if(done[key])return;done[key]=1;
  try{if(localStorage.getItem(key))return;localStorage.setItem(key,"1");}catch(x){}
  var db=I.db(),win=!!r.win,pts=win?5:0;
  if(pts&&window.SHK)SHK.points(pts,key);
  db.ref("users/"+u.uid+"/stats/ucl").transaction(function(s){s=s||{pts:0,right:0,wrong:0,games:0,wins:0};s.pts+=pts;s.games+=1;if(win)s.wins+=1;return s;},function(err){
    if(err)return;
    I.syncLB(function(){if(pts)db.ref("lb/"+u.uid+"/m/"+I.mkey()).transaction(function(v){return(v||0)+pts;});});});
  if(win){var cu=(c.sn[c.sn.me]||{});slotRef(c.ctx,c.sn,"w").set((cu.w||0)+1);}
}

/* ---------- what the screens can ask us to do ---------- */
var cfg={
  onLock:function(R,xi){var c=cur();if(!c.sn||!c.sn.me)return;slotRef(c.ctx,c.sn,"xi").set(xi);},
  onDecide:function(R,L,opt,key){
    var c=cur();if(!c.sn||!c.sn.me)return;
    var tag=R+"."+L+"=";
    slotRef(c.ctx,c.sn,"hd").transaction(function(v){v=v||"";if(v.indexOf(tag)>=0||v.indexOf(";"+tag)>=0)return v;
      return(v?v+";":"")+tag+String(opt).replace(/[^a-z]/g,"")+"|"+String(key||"").replace(/[;|=]/g," ");});
  },
  onForce:function(R,L){
    var c=cur();if(!c.sn||!c.sn.me)return;
    var tag=R+"."+L;
    slotRef(c.ctx,c.sn,"fw").transaction(function(v){v=v||"";return(";"+v+";").indexOf(";"+tag+";")>=0?v:(v?v+";":"")+tag;});
  },
  onRecord:record,
  onNext:function(R){var c=cur();if(!c.sn||!c.sn.me)return;if(((c.sn[c.sn.me]||{}).rd||1)>R)return;slotRef(c.ctx,c.sn,"rd").set(R+1);},
  onLeave:function(){
    var c=cur();
    if(c.ctx.role==="host"){OL.close();return;}
    if(confirm("Leave this room?"))OL.exit();
  }
};

/* ---------- lobby (before the second player joins) ---------- */
function opt(k,v){var ctx=I.ctx();if(ctx.role!=="host"||!ctx.S||ctx.S.status!=="lobby")return;I.db().ref("rooms/"+ctx.code+"/opts/"+k).set(v);}
function lobby(ctx,S){
  var host=ctx.role==="host",o=S.opts||{},legs=+o.legs===1?1:2,era=o.era==="modern"?"modern":"all";
  var set=host?'<div class="ol-sec">Match format</div><div class="ol-chips">'+
      '<button type="button" class="ol-chip'+(legs===2?' on':'')+'" onclick="OLUCL.opt(\'legs\',2)">Two legs</button>'+
      '<button type="button" class="ol-chip'+(legs===1?' on':'')+'" onclick="OLUCL.opt(\'legs\',1)">Single match</button></div>'+
    '<div class="ol-sec">Era</div><div class="ol-chips">'+
      '<button type="button" class="ol-chip'+(era==="all"?' on':'')+'" onclick="OLUCL.opt(\'era\',\'all\')">All history</button>'+
      '<button type="button" class="ol-chip'+(era==="modern"?' on':'')+'" onclick="OLUCL.opt(\'era\',\'modern\')">Modern (1992+)</button></div>'
    :'<div class="ol-sec">Match</div><p class="uco-sum">'+(legs===1?'Single match':'Two legs')+' · All 3 cups · '+(era==="modern"?'Modern era':'All history')+'</p>';
  I.shell('<div class="ol-ticket" onclick="OL.copy()"><small>Room code · tap to share</small><div class="ol-code">'+e(ctx.code)+'</div><span>Send this code to a friend</span></div>'+
    '<div class="uco-wait"><div class="uco-dots"><i></i><i></i><i></i></div>Waiting for your opponent to join...</div>'+set+
    '<div class="uco-rules">Each of you drafts a secret XI from title-winning clubs. Then the same match plays out on both phones, and at half-time you each choose how to play the second half. Winner gets <b>+5</b> points in stats.</div>'+
    (host?'<button type="button" class="ol-b r" onclick="OL.close()">Close Room</button>':'<button type="button" class="ol-s" onclick="OLUCL.leave()">Leave Room</button>'),
    {room:true,t:"EUROPE XI",g:"ucl"});
}

function draw(){
  var ctx=I.ctx(),S=ctx.S,u=U();if(!S||!window.UCLO)return;
  var sn=snap(S,u.uid),host=ctx.role==="host";
  var key=ctx.code+"_"+(S.created||0);
  if(host&&sn.both&&S.status==="lobby"&&startedFor!==key){startedFor=key;I.db().ref("rooms/"+ctx.code).update({status:"play"});}
  if(!sn.both||!sn.me){
    if(mounted){UCLO.unmount();mounted="";}
    lobby(ctx,S);return;
  }
  if(mounted!==key){
    I.shell('<div class="ol-w">Loading...</div>',{room:true,t:"EUROPE XI",g:"ucl",playing:true});
    UCLO.mount(cfg);mounted=key;
  }
  UCLO.sync(sn);
}
function leave(){if(confirm("Leave this room?"))OL.exit();}

/* ---------- styles for the lobby (the match screens use css/ucl.css) ---------- */
var css=`
#olRoot[data-g="ucl"]{--bg:#060912;--bgr:6,9,18;--bg0:#03050c;--wash:radial-gradient(ellipse at 50% -10%,rgba(43,107,255,.42),transparent 62%);--card:#0e1428;--cardr:14,20,40;--card2:#172041;--h1:#0a2cb0;--h2:#030827;--ln:rgba(255,255,255,.1);--ln2:rgba(255,255,255,.22);--mu:#9aa6c4;--mu2:#6f7b9b;--ink:#e9eefb;--ink2:#e9eefb;--ac:#7aa7ff;--acr:122,167,255;--on:#06102e}
#olRoot[data-g="ucl"] .ol-ttl{font-family:Anton,Impact,'Arial Black',sans-serif;font-weight:400;letter-spacing:.16em;color:var(--ac);font-size:24px}
.uco-wait{display:flex;flex-direction:column;align-items:center;gap:12px;margin:18px 0 6px;padding:18px 14px;border-radius:20px;border:1px dashed rgba(122,167,255,.5);color:#e9eefb;text-align:center}
.uco-dots{display:flex;gap:7px}.uco-dots i{width:9px;height:9px;border-radius:50%;background:#7aa7ff;animation:ucoB 1s infinite ease-in-out}.uco-dots i:nth-child(2){animation-delay:.15s}.uco-dots i:nth-child(3){animation-delay:.3s}
@keyframes ucoB{0%,80%,100%{opacity:.25;transform:scale(.8)}40%{opacity:1;transform:scale(1.1)}}
.uco-rules{text-align:center;color:#9aa6c4;font-size:13px;line-height:1.6;margin:14px 0}.uco-rules b{color:#7aa7ff}
.uco-sum{margin:0 0 6px;color:#e9eefb;font-size:15px}
@media (prefers-reduced-motion:reduce){.uco-dots i{animation:none}}
`;
var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
window.OLUCL={draw:draw,opt:opt,leave:leave};
})();
