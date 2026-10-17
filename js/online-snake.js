/* =========================================================
   Online Snakes & Ladders: 2 to 4 players, one room code, host starts the game.

   نفس فكرة لودو: مفيش سيرفر لعبة، بس غرف Firebase الموجودة.
   - نفس محرك القواعد (js/snake-engine.js) أوفلاين وأونلاين.
   - محدش بيبعت نتيجة نرد ولا مكان ولا كارت. كل لاعب بيكتب قراراته بس في خانته:
       players/<slot>/mv = "<gid>:<log>"     (حروف القرارات: r u t j c d z A B f x w a n)
   - النرد والكروت واللوحة نفسها دوال ثابتة من seed الغرفة، فمفيش حد يقدر يعيد الرمي أو يختار رقم.
   - كل موبايل بيعيد تشغيل نفس السجلات بنفس المحرك فبيطلع نفس اللوحة. قرار غير قانوني بيتتجاهل.
   - الكروت والفخاخ سرية على الشاشة بس (الكل بيحسب نفس الحالة): ده لعب بين أصحاب، مش حماية.
   - حقول الهوست بس: status, cols (slot -> لون), seed, gid, opts {cls, surv, full}, bots.
   - bots/<لون> = n: الهوست بيدّي مقعد وقف لعب للكمبيوتر؛ أول n حرف من سجل اللاعب بيفضلوا وبعدين الكمبيوتر بيلعب.
   كل مباراة بتخلص: المركز الأول +10، التاني +7، التالت +5 في الإحصائيات.
========================================================= */
(function(){
if(!window.OL||!OL.i||!window.SNE||!window.SnakeUI||!window.LudoUI)return;
var I=OL.i,e=I.e,U=I.U,T=I.T,E=SNE,UI=SnakeUI,LU=LudoUI;
var SLOTS=["a","b","c","d"],done={},view=null,CN=UI.CNAME;
var $=function(id){return document.getElementById(id);};
var PTS=[10,7,5];
function sfx(k){try{UI.sfx(k);}catch(x){}}
function eopts(S){var o=S.opts||{},cls=!!o.cls;return{style:cls?"classic":"chaos",surv:!cls&&!!o.surv,full:!!o.full};}
function seatsFor(n){return UI.SEAT_LAYOUT[Math.max(2,Math.min(4,n))];}
function mySeat(S,uid){var P=S.players||{};return SLOTS.filter(function(s){return P[s]&&P[s].uid===uid;})[0]||"";}
function present(S){var P=S.players||{};return SLOTS.filter(function(s){return P[s];});}
function myLog(S,slot){var P=S.players||{},m=String((P[slot]||{}).mv||""),i=m.indexOf(":");return(i>0&&+m.slice(0,i)===(+S.gid||0))?m.slice(i+1):"";}
function db(){return I.db();}
function room(code){return db().ref("rooms/"+code);}

/* ---------- replay ---------- */
function replay(S){
  var cols=S.cols||{},P=S.players||{},seed=(S.seed|0),gid=+S.gid||0,bots=S.bots||{},slotOf={};
  var order=UI.SEAT_LAYOUT[4].filter(function(c){
    var sl=SLOTS.filter(function(s){return cols[s]===c&&P[s];})[0];if(sl)slotOf[c]=sl;return!!sl;});
  var n=order.length;if(n<2)return null;
  var logs=[],bs=[],names=[];
  order.forEach(function(c){
    var p=P[slotOf[c]]||{};
    logs.push(myLog(S,slotOf[c]));
    bs.push(bots[c]!=null?(+bots[c]||0):null);
    names.push(p.name||CN[c]);
  });
  var o=eopts(S),R=E.replay(n,o,seed,Math.abs(seed)%n,logs,bs);
  return{g:R.g,trace:R.trace,wait:R.wait,n:n,order:order,slotOf:slotOf,names:names,gid:gid,seed:seed,over:R.g.over,cols:cols,bots:bots,opts:o,
    tokens:R.trace.map(function(t){return t.tok;})};
}
function myIdx(S,R){var sl=mySeat(S,U().uid);return sl?R.order.indexOf(R.cols[sl]):-1;}

/* ---------- writes ---------- */
function send(tok){
  var ctx=I.ctx(),S=ctx.S;if(!S||!view)return;
  var slot=mySeat(S,U().uid);if(!slot)return;
  room(ctx.code).child("players/"+slot+"/mv").set((+S.gid||0)+":"+myLog(S,slot)+tok);
}
function start(again){
  var ctx=I.ctx(),S=ctx.S;if(!S||ctx.role!=="host")return;
  var sl=present(S);if(again&&S.cols){}else if(sl.length<2){T("محتاج لاعبين اتنين على الأقل");return;}
  var u={status:"play",seed:PPR.seed31(),gid:(+S.gid||0)+1,bots:null};
  if(!again||!S.cols){var lay=seatsFor(sl.length),cols={};sl.forEach(function(s,i){cols[s]=lay[i];});u.cols=cols;}
  room(ctx.code).update(u);
}
function opt(k){
  var ctx=I.ctx(),S=ctx.S;if(!S||ctx.role!=="host"||S.status!=="lobby")return;
  var o=S.opts||{cls:0,surv:0,full:0},r=room(ctx.code);
  if(k==="surv"&&o.cls){T("النجاة محتاجة وضع الفوضى");return;}
  var nv=o[k]?0:1;
  if(k==="cls"&&nv){r.child("opts/surv").set(0);}
  r.child("opts/"+k).set(nv);
}
function bot(color){
  var ctx=I.ctx(),S=ctx.S,R=view&&view.R;if(!S||!R||ctx.role!=="host")return;
  var p=(S.players||{})[R.slotOf[color]];if(!p||p.uid===U().uid)return;
  if(!confirm("تخلي الكمبيوتر يلعب مكان "+p.name+"؟"))return;
  room(ctx.code).child("bots/"+color).set(myLog(S,R.slotOf[color]).length);
}
function leave(){
  var ctx=I.ctx(),S=ctx.S;
  if(S&&S.status==="lobby"&&ctx.role!=="host"){var sl=mySeat(S,U().uid);if(sl)room(ctx.code).child("players/"+sl).remove().catch(function(){});OL.exit();return;}
  if(confirm("تخرج من الغرفة؟"))OL.exit();
}

/* ---------- stats: 1st +10, 2nd +7, 3rd +5 ---------- */
function record(R,ctx){
  var u=U(),S=ctx.S,idx=myIdx(S,R);if(idx<0)return;
  var my=R.order[idx];if(R.bots[my]!=null)return;
  var key="olsn_"+ctx.code+"_"+(S.created||0)+"_"+R.gid;
  if(done[key])return;done[key]=1;
  try{if(localStorage.getItem(key))return;localStorage.setItem(key,"1");}catch(x){}
  var g=R.g,P=g.players[idx],win=g.winner===idx,pts=PTS[g.ranking.indexOf(idx)]||0,d=db();
  if(pts&&window.SHK){try{SHK.points(pts,key);}catch(x){}}   /* 1 نقطة = 30 شنكلولو (POINT_RATE) */
  d.ref("users/"+u.uid+"/stats/snake").transaction(function(s){s=s||{pts:0,right:0,wrong:0,games:0,wins:0};s.pts+=pts;s.games+=1;if(win)s.wins+=1;return s;},function(err){
    if(err)return;
    I.syncLB(function(){if(pts)d.ref("lb/"+u.uid+"/m/"+I.mkey()).transaction(function(v){return(v||0)+pts;});});
    /* عدّادات الإنجازات في معاملة منفصلة: لو القواعد رفضتها، النقاط الأساسية تفضل محفوظة */
    d.ref("users/"+u.uid+"/stats/snake").transaction(function(s){
      s=s||{pts:0,right:0,wrong:0,games:0,wins:0};
      if(win&&P.st.gap>=40)s.cb=(s.cb||0)+1;
      if(win&&P.st.used===0&&P.st.wardUsed===0)s.ch=(s.ch||0)+1;
      if(win&&g.opts.surv)s.ih=(s.ih||0)+1;
      s.dg=(s.dg||0)+P.st.dodged;s.st=(s.st||0)+P.st.steals;s.tp=(s.tp||0)+P.st.sprung;
      return s;
    },function(){});
  });
}

/* ---------- screens ---------- */
function dot(c){return'<span class="sn-dot c-'+c+'"></span>';}
function lobby(ctx,S){
  view=null;
  var host=ctx.role==="host",sl=present(S),P=S.players||{},o=S.opts||{cls:0,surv:0,full:0},n=sl.length,lay=seatsFor(n);
  var rows=SLOTS.map(function(s,i){
    var p=P[s];if(!p)return'<div class="ol-t empty olsn-row">مستني لاعب...</div>';
    var k=sl.indexOf(s),c=lay[k];
    return'<div class="ol-t ol-ck olsn-row c-'+c+'" onclick="OL.prof(\''+e(p.uid)+'\')"><b>'+dot(c)+I.nmu(p.uid,p.name)+(p.uid===S.host?' <small class="olsn-tag">المضيف</small>':'')+'</b></div>';}).join("");
  var set=host?'<div class="ol-sec">القواعد</div>'+
    '<button type="button" class="ol-sw'+(!o.cls?' on':'')+'" onclick="OLSNK.opt(\'cls\')"><span><b>وضع الفوضى</b><small>'+(!o.cls?'كروت وفخاخ مخفية وخانات خاصة وحدث عالمي كل 5 جولات':'كلاسيك: سلالم وتعابين بس. شغّل الفوضى للعبة الكاملة')+'</small></span><i></i></button>'+
    '<button type="button" class="ol-sw'+(o.surv&&!o.cls?' on':'')+'" onclick="OLSNK.opt(\'surv\')"><span><b>وضع النجاة</b><small>'+(o.cls?'محتاج وضع الفوضى':'3 قلوب لكل لاعب. التعابين الطويلة والفخاخ واللعنة بتاخد قلب. آخر واحد يفضل يكسب')+'</small></span><i></i></button>'+
    '<button type="button" class="ol-sw'+(o.full?' on':'')+'" onclick="OLSNK.opt(\'full\')"><span><b>العب لكل المراكز</b><small>كمّل اللعب بعد أول فايز</small></span><i></i></button>':
    '<div class="olsn-rules">'+(o.cls?'كلاسيك':'وضع الفوضى')+(o.surv&&!o.cls?' · نجاة':'')+' · '+(o.full?'اللعب لكل المراكز':'أول واحد يوصل 100 يكسب')+'</div>';
  I.shell('<div class="olsn-ar" dir="rtl" lang="ar"><div class="ol-ticket" onclick="OL.copy()"><small>كود الغرفة · دوس عشان تشاركه</small><div class="ol-code" dir="ltr">'+e(ctx.code)+'</div><span>ابعت الكود لصحابك</span></div>'+
    '<div class="ol-sec">اللاعبين ('+n+'/4)</div>'+rows+set+
    (host?'<button type="button" class="ol-b" '+(n<2?'disabled ':'')+'onclick="OLSNK.start()">'+(n<2?'مستني لاعبين...':'ابدأ اللعب')+'</button><button type="button" class="ol-b r" onclick="OL.close()">اقفل الغرفة</button>'
         :'<div class="ol-w">مستني المضيف يبدأ...</div><button type="button" class="ol-s" onclick="OLSNK.leave()">اخرج من الغرفة</button>')+
    '<div class="xo2-rules">المركز الأول <b>+10</b> نقاط، التاني <b>+7</b>، التالت <b>+5</b>.</div></div>',{room:true,t:"سلم وتعبان",g:"snake",c:""});
}

function shellHTML(){
  return'<div class="olsn-ar" dir="rtl" lang="ar"><div id="olsnRoot">'+UI.playHTML()+'</div><div id="olsnHost"></div><div id="olsnRes"></div>'+
    '<button type="button" class="ol-s olsn-leave" onclick="OLSNK.leave()">اخرج من الغرفة</button></div>';
}

function build(R,S,ctx){
  I.shell(shellHTML(),{room:true,t:"سلم وتعبان",g:"snake",playing:!R.over});
  var my=myIdx(S,R),v={key:ctx.code+"_"+R.gid,R:R,my:my,autoKey:"",over:false,fed:R.tokens.slice(),v:null};
  view=v;
  v.v=UI.createView($("olsnRoot"),{
    state:R.g,names:R.names,colors:R.order,
    canAct:function(seat){return seat===my&&my>=0;},
    viewSeat:function(){return my;},
    reveal:function(seat){return seat===my;},
    isCpu:function(seat){return view&&view.R&&view.R.bots[view.R.order[seat]]!=null;},
    send:function(tok){send(tok);},
    onIdle:function(){if(view===v){autoRoll();hostPanel();}},
    onOver:function(){if(view===v)showResult();},
    onAuto:auto
  });
  LU.autoPaint($("olsnRoot").querySelector(".sn-auto"));
  hostPanel();
}
function auto(){
  LU.autoSet(!LU.autoGet());sfx("click");
  var b=document.querySelector("#olsnRoot .sn-auto");LU.autoPaint(b);
  T(LU.autoGet()?"الرمي التلقائي: شغال":"الرمي التلقائي: مقفول");
  if(view){view.autoKey="";autoRoll();}
}
function autoRoll(){
  var vw=view;if(!vw||!vw.v||!LU.autoGet())return;
  var sh=vw.v.sh;if(sh.over||vw.v.busy())return;
  var p=sh.pend;if(!p||p.t!=="roll"||p.seat!==vw.my)return;
  var key=vw.key+"_"+vw.fed.length;if(vw.autoKey===key)return;vw.autoKey=key;
  setTimeout(function(){
    if(view!==vw)return;
    var s2=vw.v.sh;
    if(LU.autoGet()&&!vw.v.busy()&&!s2.over&&s2.pend&&s2.pend.t==="roll"&&s2.pend.seat===vw.my)vw.v.send("r");
    else vw.autoKey="";
  },LU.reduce()?80:650);
}
function hostPanel(){
  var hp=$("olsnHost"),vw=view;if(!hp||!vw||!vw.v)return;
  var ctx=I.ctx(),R=vw.R,sh=vw.v.sh;hp.innerHTML="";
  if(ctx.role!=="host"||sh.over||!sh.pend)return;
  var seat=sh.pend.seat,col=R.order[seat];
  if(seat===vw.my||R.bots[col]!=null)return;
  hp.innerHTML='<button type="button" class="ol-s" onclick="OLSNK.bot(\''+col+'\')">مش بيلعب؟ خلّي الكمبيوتر يلعب مكان '+e(R.names[seat])+'</button>';
}

function draw(){
  var ctx=I.ctx(),S=ctx.S;if(!S)return;
  if(S.status==="lobby"||!S.cols)return lobby(ctx,S);
  var R=replay(S);if(!R)return lobby(ctx,S);
  var key=ctx.code+"_"+R.gid,fresh=!view||view.key!==key||!$("olsnRoot");
  if(!fresh){
    var f=view.fed,same=f.length<=R.tokens.length;
    for(var i=0;same&&i<f.length;i++)if(f[i]!==R.tokens[i])same=false;
    if(!same||R.tokens.length-f.length>14){if(view.v)view.v.destroy();fresh=true;}
  }
  if(fresh){if(view&&view.v)view.v.destroy();build(R,S,ctx);return;}
  view.R=R;
  var add=R.tokens.slice(view.fed.length);
  if(add.length){view.fed=R.tokens.slice();view.v.feed(add);}
  else view.v.settle();
  hostPanel();
}

function showResult(){
  var ctx=I.ctx(),S=ctx.S;if(!view||!S||view.over)return;
  var R=view.R;if(!R||!R.over)return;view.over=true;
  record(R,ctx);sfx("win");
  var g=R.g,host=ctx.role==="host",pts={};
  g.ranking.forEach(function(s,i){if(PTS[i]&&R.bots[R.order[s]]==null)pts[s]=PTS[i];});
  var w=g.winner;
  $("olsnRes").innerHTML='<div class="sn-final-card c-'+R.order[w]+' olsn-res"><div class="sn-trophy"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 21h8M10 17h4"/></svg></div>'+
    '<h3>الفايز: '+e(R.names[w])+'</h3><p>المركز 1: +10 · 2: +7 · 3: +5 نقاط في الإحصائيات</p><div class="sn-rank">'+UI.resultHTML(g,R.names,R.order,{points:pts})+'</div>'+
    (host?'<button type="button" class="sn-main" onclick="OLSNK.again()">العب تاني</button><button type="button" class="sn-alt" onclick="OL.close()">اقفل الغرفة</button>'
         :'<div class="ol-w">مستني المضيف يبدأ مباراة تانية...</div>')+
    '<button type="button" class="sn-alt" onclick="OL.rank()">الترتيب</button><button type="button" class="sn-link" onclick="OL.stats()">إحصائياتي</button></div>';
  var rs=$("olsnRes");if(rs&&rs.scrollIntoView)setTimeout(function(){try{rs.scrollIntoView({behavior:"smooth",block:"nearest"});}catch(x){}},250);
}

window.OLSNK={draw:draw,start:function(){start(false);},again:function(){start(true);},opt:opt,bot:bot,leave:leave,_replay:replay};
})();
