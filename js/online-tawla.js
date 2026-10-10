/* =========================================================
   TAWLA ONLINE — الطاولة أونلاين، لاعبين اتنين، من غير سيرفر ولا حكم.
   نفس فكرة XO / Ludo: كل لاعب بيكتب أفعاله هو بس في خانته، وكل جهاز بيعيد تشغيل
   نفس الإنجن (js/tawla-engine.js) فتطلع نفس اللوحة عند الاتنين.
   النرد مش عشوائي عند اللاعب: ثابت من seed الغرفة (TawlaEngine.seedDice)، فمحدش يعيد الرمي.
   الرسم نفسه من js/tawla-ui.js — اللوحة أونلاين هي نفس الأوفلاين.

   الغرفة rooms/<code>:
     game:"tawla", status:"lobby"|"play", seed (بيتكتب لما المضيف يبدأ), hc = لون المضيف "b"|"w"
     players/a = المضيف · players/b = الضيف:  { uid, name, photo, rd, mv }
       rd = رقم الجيم اللي اللاعب جاهز له (الجيم الحالي = أصغر rd)
       mv = "<رقم الجيم>:<أفعاله>"   "r" = رمية · حرفين = حركة (من، إلى) بحرف = 'A' + رقم الخانة
       gr = نتايج الجيمات اللي خلصت: "1:w12;2:b7"  (رقم الجيم : لون الكاسب + نقاط الجيم). كل لاعب بيكتب نتيجة كل جيم
            في خانته، والنتيجة بتتقرا من الاتنين. الجيم الحالي بيتحسب من الإعادة مش من هنا.
   المباراة لحد 31 نقطة (قشاطات). فوز الجيم = 10 نقط في الحساب، وفوز المباراة = 30.
   اللي بيكسب الجيم بيبدأ اللي بعده، وأول جيم في كل مباراة بيتحدد بنرد ثابت من الـseed.
========================================================= */
(function(){
if(!window.OL||!OL.i||!window.TawlaEngine||!window.TawlaUI)return;
var I=OL.i,e=I.e,U=I.U,E=window.TawlaEngine,UI=window.TawlaUI;
var W=0,B=1,OUT=E.OUT,WIN_AT=E.WIN_AT;
var GAME_PTS=10,MATCH_PTS=30;
var done={},sel=null,selKey="",lastK=null,lastR=0,rollAt=0,animTm=0,flickIv=0;

/* ---------- المنطق (بدون DOM — بيتختبر لوحده) ---------- */
function colorOf(S,slot){var hw=S&&S.hc==="w";return slot==="a"?(hw?W:B):(hw?B:W);}
function slotOf(S,color){return colorOf(S,"a")===color?"a":"b";}
function logOf(p,R){var m=String((p&&p.mv)||"").split(":");return+m[0]===R?(m[1]||""):"";}
function grOf(p){
  var m={};String((p&&p.gr)||"").split(";").forEach(function(x){var q=x.split(":");if(q[0]&&q[1])m[+q[0]]=q[1];});
  return m;
}
function results(S){var P=S.players||{},a=grOf(P.a),b=grOf(P.b),k;for(k in b)if(!a[k])a[k]=b[k];return a;}
function enc(f,t){return String.fromCharCode(64+f)+String.fromCharCode(64+t);}

/* أول جيم في المباراة: رمية ثابتة من الـseed، اللي نرده أعلى يبدأ (التعادل بيتعاد) */
function openFor(seed,gid){
  for(var j=0;j<50;j++){
    var d=E.seedDice(seed,gid,-(1+j));
    if(d.a!==d.b)return d.a>d.b?W:B;     // a = نرد الأبيض · b = نرد الأسود
  }
  return W;
}

/* إعادة تشغيل جيم واحد من الـseed + سجلّ اللاعبين */
function replay(seed,R,starter,logW,logB){
  var g=E.newGame(),turn=starter,phase="roll",rem=[],k=0,last=null,logs=[logW,logB],ptr=[0,0],over=false,wait=null,guard=0;
  while(guard++<6000){
    if(E.winner(g)>-1){over=true;break;}
    var L=logs[turn],p=ptr[turn];
    if(phase==="roll"){
      if(p>=L.length){wait="roll";break;}
      ptr[turn]=p+1;
      if(L.charAt(p)!=="r")continue;
      var d=E.seedDice(seed,R,k++);
      last={a:d.a,b:d.b,by:turn,k:k,pass:false};
      rem=d.list.slice();
      if(!E.hasMove(g,turn,rem)){last.pass=true;turn=1-turn;rem=[];}
      else phase="move";
    }else{
      if(p+1>=L.length){wait="move";break;}
      ptr[turn]=p+2;
      var f=L.charCodeAt(p)-64,t=L.charCodeAt(p+1)-64,ms=E.movesFor(g,turn,rem),m=null,i;
      for(i=0;i<ms.length;i++)if(ms[i].from===f&&ms[i].to===t){m=ms[i];break;}
      if(!m)continue;                                  // حركة مش قانونية: بتتجاهل
      E.applyMove(g,turn,m);rem=E.consume(rem,m);
      if(E.winner(g)>-1){over=true;break;}
      if(!rem.length||!E.hasMove(g,turn,rem)){turn=1-turn;rem=[];phase="roll";}
    }
  }
  return {g:g,turn:turn,phase:phase,rem:rem,k:k,last:last,over:over,winner:over?E.winner(g):-1,wait:wait};
}

/* الجيمات اللي خلصت قبل R: المجموع الجاري في المباراة، والجيمات اللي خلصت عندها مباراة */
function history(S,R){
  var rr=results(S),tot=[0,0],ended={},list=[],g;
  for(g=1;g<R;g++){
    var v=rr[g];
    if(!v||typeof v!=="string")continue;
    var w=v.charAt(0)==="w"?W:B,pts=parseInt(v.slice(1),10)||0;
    tot[w]+=pts;list.push({g:g,w:w,pts:pts});
    if(tot[w]>=WIN_AT){ended[g]=true;tot=[0,0];}
  }
  return {tot:tot,ended:ended,list:list,prev:rr[R-1]};
}

/* الحالة الكاملة للجيم الحالي من الغرفة */
function calc(S,uid){
  var P=S.players||{},a=P.a,b=P.b,both=!!(a&&b);
  var R=both?Math.min(a.rd||1,b.rd||1):((a&&a.rd)||1);
  var mySlot=a&&a.uid===uid?"a":(b&&b.uid===uid?"b":"");
  var c={both:both,R:R,a:a,b:b,mySlot:mySlot,myColor:mySlot?colorOf(S,mySlot):-1,started:S.status==="play"&&S.seed!=null};
  if(!both||!c.started)return c;
  var seed=S.seed|0,h=history(S,R);
  var prevWinner=h.prev&&typeof h.prev==="string"?(h.prev.charAt(0)==="w"?W:B):-1;
  var starter=(R===1||h.ended[R-1]||prevWinner<0)?openFor(seed,R):prevWinner;
  var slotW=slotOf(S,W),slotB=slotOf(S,B);
  var rp=replay(seed,R,starter,logOf(P[slotW],R),logOf(P[slotB],R));
  var tot=h.tot.slice(),gp=0;
  if(rp.over){gp=E.gamePoints(rp.g,rp.winner);tot[rp.winner]+=gp;}
  c.h=h;c.rp=rp;c.starter=starter;c.tot=tot;c.gp=gp;
  c.matchOver=rp.over&&tot[rp.winner]>=WIN_AT;
  return c;
}

/* ---------- الإحصائيات: فوز الجيم +10، فوز المباراة +30 ---------- */
function record(c,ctx){
  var u=U(),key="oltw_"+ctx.code+"_"+(ctx.S.created||0)+"_"+c.R;
  if(done[key])return;done[key]=1;
  var db=I.db();
  /* نتيجة الجيم بتتسجل في خانتي (الجيم اللي بعده والمباراة بيتحسبوا منها) */
  var me=c.mySlot==="a"?c.a:c.b;
  if(!grOf(me)[c.R])db.ref("rooms/"+ctx.code+"/players/"+c.mySlot+"/gr").set(((me&&me.gr)?me.gr+";":"")+c.R+":"+(c.rp.winner===W?"w":"b")+c.gp);
  try{if(localStorage.getItem(key))return;localStorage.setItem(key,"1");}catch(x){}
  var win=c.rp.winner===c.myColor,pts=win?(c.matchOver?MATCH_PTS:GAME_PTS):0;
  if(pts&&window.SHK)SHK.points(pts,key);   /* 1 نقطة = 10 شنكلولو */
  db.ref("users/"+u.uid+"/stats/tawla").transaction(function(s){s=s||{pts:0,right:0,wrong:0,games:0,wins:0};s.pts+=pts;s.games+=1;if(win)s.wins+=1;return s;},function(err){
    if(err)return;
    I.syncLB(function(){if(pts)db.ref("lb/"+u.uid+"/m/"+I.mkey()).transaction(function(v){return(v||0)+pts;});});});
}

/* ---------- الأفعال ---------- */
function ctxNow(){var x=I.ctx();return x&&x.S&&x.S.game==="tawla"?x:null;}
function writeMv(ctx,c,add){
  var mine=logOf(c.mySlot==="a"?c.a:c.b,c.R);
  I.db().ref("rooms/"+ctx.code+"/players/"+c.mySlot+"/mv").set(c.R+":"+mine+add);
  try{if(typeof playClickSound==="function")playClickSound();}catch(x){}
}
function animating(){return Date.now()-rollAt<UI.TOSS_MS;}
function myTurnMove(c){return c.mySlot&&c.rp&&!c.rp.over&&c.rp.phase==="move"&&c.rp.turn===c.myColor&&!animating();}

function roll(){
  var ctx=ctxNow();if(!ctx)return;var c=calc(ctx.S,U().uid);
  if(!c.rp||!c.mySlot||c.rp.over||c.rp.phase!=="roll"||c.rp.turn!==c.myColor||animating())return;
  writeMv(ctx,c,"r");
}
function maps(c){
  var src={},dst={};
  if(!myTurnMove(c))return{src:src,dst:dst};
  var ms=E.movesFor(c.rp.g,c.myColor,c.rp.rem);
  ms.forEach(function(m){src[m.from]=1;if(sel!==null&&m.from===sel&&dst[m.to]===undefined)dst[m.to]=[m];});
  return{src:src,dst:dst};
}
function tapQ(q){
  var ctx=ctxNow();if(!ctx)return;var c=calc(ctx.S,U().uid);
  if(!myTurnMove(c))return;
  var mp=maps(c);
  if(sel!==null&&mp.dst[q]!==undefined){var m=mp.dst[q][0];sel=null;writeMv(ctx,c,enc(m.from,m.to));return;}
  if(q!==OUT&&mp.src[q]&&sel!==q){sel=q;draw();return;}
  if(sel!==null){sel=null;draw();}
}
function tap(ph){tapQ(UI.qOf(calcMine(),ph));}
function tapOut(side){if(side===calcMine())tapQ(OUT);}
function calcMine(){var ctx=ctxNow();if(!ctx)return W;var c=calc(ctx.S,U().uid);return c.myColor<0?B:c.myColor;}
function next(){
  var ctx=ctxNow();if(!ctx)return;var c=calc(ctx.S,U().uid);
  if(!c.rp||!c.rp.over||!c.mySlot)return;
  I.db().ref("rooms/"+ctx.code+"/players/"+c.mySlot+"/rd").set(c.R+1);
}
function setColor(v){
  var ctx=ctxNow();if(!ctx||ctx.role!=="host"||ctx.S.status!=="lobby")return;
  I.db().ref("rooms/"+ctx.code+"/hc").set(v==="w"?"w":"b");
}
function start(){
  var ctx=ctxNow();if(!ctx||ctx.role!=="host")return;
  var S=ctx.S,P=S.players||{};if(!(P.a&&P.b)||S.status!=="lobby")return;
  I.db().ref("rooms/"+ctx.code).update({status:"play",seed:1+Math.floor(Math.random()*2147483000),hc:S.hc==="w"?"w":"b"});
}
function leave(){if(confirm("تخرج من الغرفة؟"))OL.exit();}

/* ---------- الشاشة ---------- */
var CN=["الأبيض","الأسود"];
function pcard(p,color,c,turnNow,mine){
  var name=p?p.name:"مستني لاعب…";
  var s=c.rp?c.rp.g.s[color]:null;
  var chips=s?'<div class="tw-chips"><button type="button" class="tw-chip" tabindex="-1"><b>'+E.inHome(s)+'</b><span>في التجميع</span></button>'+
    '<button type="button" class="tw-chip" tabindex="-1"><b>'+s.off+'<small style="font-size:11px;opacity:.7">/15</small></b><span>خارج</span></button></div>':'';
  return '<div class="tw-pl'+(turnNow?' is-turn':'')+'"><div class="tw-pl-top"><span class="tw-pc '+(color===W?'w':'b')+'"></span>'+
    '<span class="tw-pl-name" dir="auto">'+e(name)+(mine?' (إنت)':'')+'</span><span class="tw-pl-pts">'+(c.tot?c.tot[color]:0)+'<small> / '+WIN_AT+'</small></span></div>'+chips+'</div>';
}
function shellTw(html,o){I.shell('<div class="tw-app tw-ol" lang="ar" dir="rtl">'+html+'</div>',o);}

function lobby(ctx,S,c,host){
  var o={room:true,t:"Tawla",g:"tawla"};
  var h='<div class="ol-ticket" onclick="OL.copy()"><small>كود الغرفة · اضغط للنسخ</small><div class="ol-code">'+e(ctx.code)+'</div><span>ابعت الكود لصاحبك</span></div>';
  if(!c.both){
    h+='<div class="tw-ol-wait"><div class="tw-ol-dots"><i></i><i></i><i></i></div>مستني صاحبك يدخل…</div>';
  }else{
    var hostColor=S.hc==="w"?W:B,myColor=c.myColor;
    h+='<div class="tw-panel"><div class="tw-label">اللون</div>';
    if(host){
      h+='<div class="tw-seg" role="group" aria-label="لونك"><button type="button" class="'+(hostColor===B?"is-on":"")+'" onclick="OLTW.color(\'b\')">الأسود</button>'+
         '<button type="button" class="'+(hostColor===W?"is-on":"")+'" onclick="OLTW.color(\'w\')">الأبيض</button></div>'+
         '<p class="tw-ol-note">صاحبك هياخد اللون التاني. اللون بيتثبت أول ما الجيم يبدأ.</p>';
    }else{
      h+='<p class="tw-ol-note big">هتلعب بالـ<b>'+CN[myColor]+'</b></p><p class="tw-ol-note">المضيف هو اللي بيختار اللون ويبدأ الجيم.</p>';
    }
    h+='</div>';
    h+=host?'<button type="button" class="tw-start" onclick="OLTW.start()">ابدأ الجيم</button>'
           :'<div class="tw-ol-wait sm">مستني '+e(c.a.name)+' يبدأ الجيم…</div>';
  }
  h+='<div class="tw-ol-rules">أول واحد يوصل <b>31</b> نقطة (من القشاطات) يكسب المباراة. فوز الجيم <b>+'+GAME_PTS+'</b> نقط في حسابك، وفوز المباراة <b>+'+MATCH_PTS+'</b>.</div>';
  h+=host?'<button type="button" class="ol-s" onclick="OL.close()">اقفل الغرفة</button>':'<button type="button" class="ol-s" onclick="OLTW.leave()">اخرج من الغرفة</button>';
  shellTw(h,o);
}

function draw(){
  var ctx=I.ctx(),S=ctx.S,u=U();if(!S)return;
  var c=calc(S,u.uid),host=ctx.role==="host";
  if(!c.both||!c.started){lobby(ctx,S,c,host);return;}
  var rp=c.rp,my=c.myColor<0?B:c.myColor,spect=c.mySlot==="";
  var nameOf=function(col){var p=slotOf(S,col)==="a"?c.a:c.b;return p?p.name:CN[col];};
  var oppC=1-my;

  /* رمية جديدة: أنيميشن النرد عند الاتنين (مش بنحرّك أول رسمة بعد الدخول) */
  if(lastR!==c.R){lastR=c.R;lastK=null;sel=null;}
  if(lastK===null)lastK=rp.k;
  else if(rp.k>lastK){lastK=rp.k;rollAt=Date.now();sel=null;clearTimeout(animTm);animTm=setTimeout(function(){if(ctxNow())draw();},UI.TOSS_MS+40);}
  var anim=animating();
  var sig=c.R+":"+rp.turn+":"+rp.rem.join("")+":"+rp.g.s[0].off+":"+rp.g.s[1].off+":"+rp.k;
  if(sig!==selKey){selKey=sig;sel=null;}

  if(rp.over)record(c,ctx);

  var mp=maps(c),canRoll=!spect&&!rp.over&&rp.phase==="roll"&&rp.turn===my&&!anim;
  var vb=UI.boardHTML({g:rp.g,view:my,turn:(myTurnMove(c)?my:rp.turn),sel:sel,src:mp.src,dst:mp.dst,tray:"r",
    trayMine:function(p){return p===my&&mp.dst[OUT]!==undefined;},
    ph:function(ph){return 'onclick="OLTW.tap('+ph+')"';},
    out:function(p){return 'onclick="OLTW.tapOut('+p+')"';}});

  /* حالة اللعب */
  var st,sub="";
  if(rp.over){
    var w=rp.winner,iw=!spect&&w===my;
    st=c.matchOver?(iw?"كسبت المباراة":nameOf(w)+" كسب المباراة"):(iw?"كسبت الجيم "+c.R:nameOf(w)+" كسب الجيم "+c.R);
    sub=iw?("+"+(c.matchOver?MATCH_PTS:GAME_PTS)+" نقطة في حسابك"):"";
  }else if(anim){st="النرد بيتدحرج…";}
  else if(rp.last&&rp.last.pass&&rp.last.k===rp.k&&rp.phase==="roll"){
    st="مفيش حركة قانونية لـ"+nameOf(rp.last.by);sub="الدور عدّى";
  }else if(rp.turn===my&&!spect){
    st=rp.phase==="roll"?"دورك — ارمِ النرد":"دورك"+(rp.last&&rp.last.a===rp.last.b?" — دبل! 4 حركات":"");
    if(!rp.g.s[my].unlocked)sub="لسه قشاطة واحدة بس تتحرك — وصّلها آخر ربع (18 خطوة) وباقي القشاط يتفتح";
  }else st="دور "+nameOf(rp.turn);

  /* النرد */
  var dice="";
  var showDice=rp.last&&(anim||rp.phase==="move"||(rp.last.pass&&rp.last.k===rp.k&&rp.phase==="roll"));
  if(showDice){
    var a=rp.last.a,b=rp.last.b,vals=a===b?[a,a,a,a]:[a,b],used=null;
    if(!anim){
      if(rp.last.pass)used=vals.map(function(){return true;});
      else if(a===b){var left=rp.rem.length;used=vals.map(function(_,i){return i>=left;});}
      else{var rm=rp.rem.slice();used=vals.map(function(v){var i=rm.indexOf(v);if(i>-1){rm.splice(i,1);return false;}return true;});}
    }
    dice=UI.diceHTML(vals,{used:used,side:rp.last.by,toss:anim});
  }

  /* فوق: الخصم · تحت: أنا */
  var top=pcard(oppC===colorOf(S,"a")?c.a:c.b,oppC,c,!rp.over&&rp.turn===oppC,false);
  var bot=pcard(my===colorOf(S,"a")?c.a:c.b,my,c,!rp.over&&rp.turn===my,!spect);
  var foot="";
  if(rp.over&&!spect){
    var myRd=(c.mySlot==="a"?c.a:c.b).rd||1;
    var other=c.mySlot==="a"?c.b:c.a;
    foot=myRd>c.R?'<div class="tw-ol-wait sm">مستني '+e(other.name)+' يبدأ '+(c.matchOver?"المباراة الجاية":"الجيم الجاي")+'…</div>'
      :'<button type="button" class="tw-start" onclick="OLTW.next()">'+(c.matchOver?"مباراة جديدة":"الجيم الجاي")+'</button>';
  }
  var h=top+
    '<div class="tw-board-wrap'+(vb.trayLeft?' tray-l':'')+'"><div class="tw-board">'+vb.board+'</div><div class="tw-tray">'+vb.tray+'</div></div>'+
    '<p class="tw-status" role="status" aria-live="polite">'+e(st)+(sub?'<small>'+e(sub)+'</small>':'')+'</p>'+
    '<div class="tw-dice-row" id="otwDice">'+dice+'</div>'+
    (canRoll?'<button type="button" class="tw-roll" onclick="OLTW.roll()">'+UI.ICON_DIE+'ارمِ النرد</button>':'')+
    bot+foot+
    '<div class="tw-ol-foot">'+(c.matchOver?'<div class="tw-ol-rules">النتيجة النهائية: '+CN[W]+' '+c.tot[W]+' — '+CN[B]+' '+c.tot[B]+'</div>':
      '<div class="tw-ol-rules">فوز الجيم <b>+'+GAME_PTS+'</b> نقط · فوز المباراة (31) <b>+'+MATCH_PTS+'</b></div>')+
    (host?'<button type="button" class="ol-s" onclick="OL.close()">اقفل الغرفة</button>':'<button type="button" class="ol-s" onclick="OLTW.leave()">اخرج من الغرفة</button>')+'</div>';
  shellTw(h,{room:true,t:"Tawla",g:"tawla",playing:!rp.over});
  if(anim){var el=document.getElementById("otwDice");if(el&&rp.last){clearInterval(flickIv);flickIv=UI.flicker(el,rp.last.a===rp.last.b?[rp.last.a,rp.last.a,rp.last.a,rp.last.a]:[rp.last.a,rp.last.b],Math.max(120,UI.TOSS_MS-60-(Date.now()-rollAt)));}}
}

/* ---------- الشكل (نفس خشب الطاولة الأوفلاين) ---------- */
var css='#olRoot[data-g="tawla"]{--bg:#1c110a;--bgr:28,17,10;--bg0:#140c07;--wash:radial-gradient(ellipse at 50% -10%,rgba(227,177,92,.2),transparent 62%);--card:#2a190f;--cardr:42,25,15;--card2:#3a2216;--h1:#3a2216;--h2:#2a190f;--ln:rgba(227,177,92,.2);--ln2:rgba(227,177,92,.4);--mu:#b9a283;--mu2:#9a8667;--ink:#F1E4C8;--ink2:#F1E4C8;--ac:#E3B15C;--acr:227,177,92;--on:#1b110b}'+
'#olRoot[data-g="tawla"] .ol-ttl{font-family:"El Messiri","Noto Sans Arabic",serif;font-weight:700;letter-spacing:.08em;color:var(--ac)}'+
'.tw-app.tw-ol{min-height:0;max-width:none;margin:0;padding:2px 0 6px;--tw-wood:#3a2216;--tw-wood-2:#2a190f;--tw-wood-3:#1c110a;--tw-felt:#5b3a22;--tw-cream:#F1E4C8;--tw-dim:#b9a283;--tw-gold:#E3B15C;--tw-red:#A8452F;--tw-sand:#D9BE8C;--tw-ink:#1b110b}'+
'.tw-ol .tw-pl{margin:0 0 6px}'+
'.tw-ol .tw-start{margin-top:12px}'+
'.tw-ol .tw-roll{margin-top:8px}'+
'.tw-ol-wait{display:flex;flex-direction:column;align-items:center;gap:10px;margin:18px 0;color:var(--tw-dim);font-size:15px;text-align:center}'+
'.tw-ol-wait.sm{flex-direction:row;justify-content:center;margin:12px 0;font-size:14px}'+
'.tw-ol-dots{display:flex;gap:7px}.tw-ol-dots i{width:9px;height:9px;border-radius:50%;background:var(--tw-gold);animation:twOlDot 1.1s ease-in-out infinite}'+
'.tw-ol-dots i:nth-child(2){animation-delay:.18s}.tw-ol-dots i:nth-child(3){animation-delay:.36s}'+
'@keyframes twOlDot{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}'+
'.tw-ol-note{margin:10px 2px 0;font-size:13.5px;color:var(--tw-dim);text-align:center}.tw-ol-note.big{font-size:18px;color:var(--tw-cream)}'+
'.tw-ol-rules{margin:14px 4px 6px;font-size:13px;color:var(--tw-dim);text-align:center;line-height:1.7}.tw-ol-rules b{color:var(--tw-gold)}'+
'.tw-ol-foot{margin-top:6px}.tw-ol .ol-s{margin-top:10px}';
var st=document.createElement("style");st.id="otwCss";st.textContent=css;document.head.appendChild(st);

window.OLTW={draw:draw,roll:roll,tap:tap,tapOut:tapOut,next:next,color:setColor,start:start,leave:leave,
  _t:{replay:replay,openFor:openFor,history:history,calc:calc,colorOf:colorOf,enc:enc,logOf:logOf,results:results}};
})();
