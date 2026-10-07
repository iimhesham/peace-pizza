/* =========================================================
   Online Sudoku: سباق بين لاعبين على نفس اللغز.
   اللي يحل الأول يكسب نقاط حسب المستوى: سهل 5 · متوسط 10 · صعب 15.
   مفيش Judge. اللغز بيتولّد عند الاتنين من نفس الـ seed (js/sudoku-core.js).
   الغرفة:
     rooms/<code>: game:"sudoku", status:"lobby"|"play", diff, rnd (رقم الجولة), seed, t0 (وقت السيرفر لما بدأت)
     players/a = المضيف, players/b = الضيف. كل لاعب بيكتب في خانته بس:
       pr = الجولة اللي pg بتاعتها, pg = عدد الخانات الصح اللي كتبها
       fr = الجولة اللي خلصها, fin = وقت السيرفر وقت الحل, w = عدد مرات فوزه في الغرفة
   الفايز في الجولة R = أصغر fin بين اللي fr == R.
   نقاط الفوز بتتسجل في users/<uid>/stats/sudoku وفي الترتيب الشهري (زي XO).
========================================================= */
(function(){
if(!window.OL||!OL.i||!window.SudokuCore)return;
var I=OL.i,e=I.e,U=I.U,T=I.T,C=SudokuCore;
var done={},L=null,off=0,offGot=false,lastPg=-1,tm=0;

/* ---------- اللغة: نفس اختيار اللعبة الأوفلاين ---------- */
function lang(){try{return localStorage.getItem("sdLang")==="en"?"en":"ar";}catch(x){return"ar";}}
var D={
  ar:{
    code:"كود الغرفة · اضغط للمشاركة",send:"ابعت الكود لصاحبك",wait:"مستني صاحبك يدخل...",
    diff:"الصعوبة والنقاط",easy:"سهل",medium:"متوسط",hard:"صعب",
    rules:"الأسرع في حل نفس اللغز يكسب: سهل +5 · متوسط +10 · صعب +15 نقطة.",
    start:"ابدأ السباق",waitHost:"مستني المضيف يبدأ...",hostPicks:"المضيف بيختار الصعوبة.",
    round:"الجولة",you:"(أنت)",race:"السباق شغال! حُلّها قبله.",
    won:"كسبت! +{p} نقطة",lost:"{n} حلّها الأول",solvedWait:"حليتها! مستني نتيجة السباق...",
    next:"اللغز الجاي",waitNext:"مستني {n} يبدأ اللغز الجاي...",
    leave:"اخرج من الغرفة",close:"اقفل الغرفة",confirmLeave:"تخرج من الغرفة؟",
    undo:"تراجع",erase:"مسح",notes:"ملاحظات",time:"الوقت",spect:"مشاهدة",
    plWait:"مستني...",finished:"خلّص"
  },
  en:{
    code:"Room code · tap to share",send:"Send this code to a friend",wait:"Waiting for your friend to join...",
    diff:"Difficulty and points",easy:"Easy",medium:"Medium",hard:"Hard",
    rules:"The fastest to solve the same puzzle wins: Easy +5 · Medium +10 · Hard +15 points.",
    start:"Start the race",waitHost:"Waiting for the host to start...",hostPicks:"The host picks the difficulty.",
    round:"Round",you:"(you)",race:"Race on! Solve it first.",
    won:"You win! +{p} points",lost:"{n} solved it first",solvedWait:"Solved! Waiting for the race result...",
    next:"Next puzzle",waitNext:"Waiting for {n} to start the next puzzle...",
    leave:"Leave Room",close:"Close Room",confirmLeave:"Leave this room?",
    undo:"Undo",erase:"Erase",notes:"Notes",time:"Time",spect:"Spectating",
    plWait:"Waiting...",finished:"Finished"
  }
};
function t(k,v){var s=(D[lang()]||D.en)[k]||D.en[k]||k,x;if(v)for(x in v)s=s.split("{"+x+"}").join(v[x]);return s;}

function pad2(n){return(n<10?"0":"")+n;}
function fmt(ms){var s=Math.max(0,Math.round(ms/1000));return pad2(Math.floor(s/60))+":"+pad2(s%60);}
function now(){return Date.now()+off;}
function srvTs(){return firebase.database.ServerValue.TIMESTAMP;}
function getOffset(){
  if(offGot)return;offGot=true;
  try{I.db().ref(".info/serverTimeOffset").once("value").then(function(s){off=+s.val()||0;},function(){});}catch(x){}
}

/* ---------- حالة الغرفة ---------- */
function calc(S,uid){
  var P=S.players||{},a=P.a,b=P.b,both=!!(a&&b),R=+S.rnd||0;
  var my=a&&a.uid===uid?"a":(b&&b.uid===uid?"b":"");
  var cand=[];
  ["a","b"].forEach(function(k){var p=P[k];if(p&&R>0&&+p.fr===R&&+p.fin)cand.push({k:k,fin:+p.fin,p:p});});
  cand.sort(function(x,y){return x.fin-y.fin;});
  var w=cand[0]||null,t0=+S.t0||0;
  var opp=my==="a"?b:(my==="b"?a:null);
  return{P:P,a:a,b:b,both:both,R:R,my:my,w:w,over:!!w,diff:C.LEVELS[S.diff]?S.diff:"easy",t0:t0,
    play:S.status==="play"&&R>0&&both,opp:opp,
    iFinished:!!(my&&P[my]&&+P[my].fr===R&&+P[my].fin)};
}

/* ---------- حالة اللاعب المحلية للجولة ---------- */
function ensureRound(c,ctx){
  var key=ctx.code+"_"+(ctx.S.created||0)+"_"+c.R;
  if(L&&L.key===key)return;
  var gen=C.generate(c.diff,+ctx.S.seed),puz=C.fromStr(gen.puzzle),sol=C.fromStr(gen.solution),given=[],i,empties=0;
  for(i=0;i<81;i++){given[i]=puz[i]?1:0;if(!puz[i])empties++;}
  L={key:key,sol:sol,puz:puz,val:puz.slice(),given:given,notes:[],flag:{},sel:-1,notesOn:false,hist:[],empties:empties};
  for(i=0;i<81;i++)L.notes.push(0);
  lastPg=-1;
  try{
    var o=JSON.parse(localStorage.getItem("sdo_cur")||"null");
    if(o&&o.key===key&&/^[0-9]{81}$/.test(o.val||"")){
      var v=C.fromStr(o.val),n=String(o.notes||"").split(",").map(Number);
      for(i=0;i<81;i++)if(!given[i])L.val[i]=v[i];
      if(n.length===81)L.notes=n.map(function(x){return(+x||0)&1022;});
    }
  }catch(x){}
}
function persist(){
  if(!L)return;
  try{localStorage.setItem("sdo_cur",JSON.stringify({key:L.key,val:L.val.join(""),notes:L.notes.join(",")}));}catch(x){}
}
function correctCount(){
  var n=0,i;for(i=0;i<81;i++)if(!L.given[i]&&L.val[i]&&L.val[i]===L.sol[i])n++;
  return n;
}
function pushProgress(finish){
  var ctx=I.ctx(),S=ctx.S;if(!S||!L)return;
  var c=calc(S,U().uid);if(!c.my||!c.play)return;
  var pg=correctCount();
  if(!finish&&pg===lastPg)return;
  lastPg=pg;
  var u={pr:c.R,pg:pg};
  if(finish){u.fr=c.R;u.fin=srvTs();}
  I.db().ref("rooms/"+ctx.code+"/players/"+c.my).update(u);
}

/* ---------- نقاط الفوز: مرة واحدة لكل جولة ---------- */
function record(c,ctx){
  if(!c.my||!c.both)return;
  var u=U(),key="olsd_"+ctx.code+"_"+(ctx.S.created||0)+"_"+c.R;
  if(done[key])return;done[key]=1;
  try{if(localStorage.getItem(key))return;localStorage.setItem(key,"1");}catch(x){}
  var db=I.db(),win=!!(c.w&&c.w.p.uid===u.uid),pts=win?C.onlinePoints(c.diff):0;
  db.ref("users/"+u.uid+"/stats/sudoku").transaction(function(s){
    s=s||{pts:0,right:0,wrong:0,games:0,wins:0};s.pts=(s.pts||0)+pts;s.games=(s.games||0)+1;if(win)s.wins=(s.wins||0)+1;return s;
  },function(err){
    if(err)return;
    I.syncLB(function(){if(pts)db.ref("lb/"+u.uid+"/m/"+I.mkey()).transaction(function(v){return(v||0)+pts;});});
  });
  if(win)db.ref("rooms/"+ctx.code+"/players/"+c.my+"/w").set(((c.P[c.my]||{}).w||0)+1);
}

/* ---------- أوامر اللاعب ---------- */
function mine(){
  var ctx=I.ctx(),S=ctx.S;if(!S||!L)return null;
  var c=calc(S,U().uid);
  if(!c.my||!c.play||c.over||c.iFinished)return null;
  return c;
}
function sel(i){if(!L)return;L.sel=i;draw();}
function dropNote(i,n){C.PEERS[i].forEach(function(p){L.notes[p]&=~C.BIT[n];});}
function push(i){L.hist.push({i:i,v:L.val[i],notes:L.notes.slice()});if(L.hist.length>300)L.hist.shift();}
function num(n){
  var c=mine();if(!c||L.sel<0)return;
  var i=L.sel;if(L.given[i])return;
  if(L.notesOn){if(L.val[i])return;push(i);L.notes[i]^=C.BIT[n];persist();draw();return;}
  if(L.val[i]===n)return;
  if(n!==L.sol[i]){
    /* رقم غلط: ما بيتحطش */
    try{toast(lang()==="ar"?"الرقم "+n+" غلط في الخانة دي، مش هينفع يتحط.":n+" is wrong for this cell, so it was not placed.");}catch(x){}
    try{if(navigator.vibrate)navigator.vibrate(60);}catch(x){}
    return;
  }
  push(i);L.val[i]=n;L.notes[i]=0;dropNote(i,n);delete L.flag[i];
  persist();
  if(C.checkWin(L.val,L.sol)){pushProgress(true);draw();return;}
  pushProgress(false);draw();
}
function erase(){
  var c=mine();if(!c||L.sel<0)return;
  var i=L.sel;if(L.given[i]||(!L.val[i]&&!L.notes[i]))return;
  push(i);L.val[i]=0;L.notes[i]=0;delete L.flag[i];persist();pushProgress(false);draw();
}
function undo(){
  var c=mine();if(!c||!L.hist.length)return;
  var h=L.hist.pop();L.val[h.i]=h.v;L.notes=h.notes;delete L.flag[h.i];
  if(L.val[h.i]&&L.val[h.i]!==L.sol[h.i])L.flag[h.i]=1;
  L.sel=h.i;persist();pushProgress(false);draw();
}
function notes(){if(!mine())return;L.notesOn=!L.notesOn;draw();}
function setDiff(d){
  var ctx=I.ctx(),S=ctx.S;if(!S||ctx.role!=="host"||!C.LEVELS[d])return;
  var c=calc(S,U().uid);if(c.play&&!c.over)return;
  I.db().ref("rooms/"+ctx.code+"/diff").set(d);
}
function start(){
  var ctx=I.ctx(),S=ctx.S;if(!S||ctx.role!=="host")return;
  var c=calc(S,U().uid);if(!c.both||(c.play&&!c.over))return;
  I.db().ref("rooms/"+ctx.code).update({status:"play",rnd:(+S.rnd||0)+1,seed:C.randSeed(),diff:C.LEVELS[S.diff]?S.diff:"easy",t0:srvTs()});
  try{if(typeof playClickSound==="function")playClickSound();}catch(x){}
}
function toggleLang(){try{localStorage.setItem("sdLang",lang()==="ar"?"en":"ar");}catch(x){}draw();}
function leave(){if(confirm(t("confirmLeave")))OL.exit();}

/* ---------- الرسم ---------- */
function lvl(d){return t(d);}
function notesHtml(m){
  if(!m)return"";
  var h='<span class="sd-n">',d;for(d=1;d<=9;d++)h+='<i>'+(m&C.BIT[d]?d:"")+'</i>';
  return h+"</span>";
}
function boardHtml(canPlay){
  var h="",i,r,c,sel=L.sel,sv=sel>=0?L.val[sel]:0,peers={};
  if(sel>=0)C.PEERS[sel].forEach(function(p){peers[p]=1;});
  for(i=0;i<81;i++){
    r=C.ROW[i];c=C.COL[i];
    var v=L.val[i],cls="sd-c"+(c%3===2&&c<8?" br":"")+(r%3===2&&r<8?" bb":"")+(c===8?" cl":"")+(r===8?" rl":"");
    if(L.given[i])cls+=" g";
    if(i===sel)cls+=" sel";else if(peers[i])cls+=" pr";
    if(sv&&v===sv&&i!==sel)cls+=" sm";
    if(L.flag[i])cls+=" bad";
    h+='<button type="button" class="'+cls+'" '+(canPlay?'':'disabled ')+'onclick="OLSD.sel('+i+')" aria-label="Row '+(r+1)+', column '+(c+1)+'">'+(v?v:notesHtml(L.notes[i]))+'</button>';
  }
  return h;
}
function padHtml(canPlay){
  var used={},i,n,h="";
  for(i=0;i<81;i++)if(L.val[i])used[L.val[i]]=(used[L.val[i]]||0)+1;
  for(n=1;n<=9;n++){var rem=Math.max(0,9-(used[n]||0));
    h+='<button type="button" class="sd-key'+(L.notesOn?' noted':'')+'" '+((!canPlay||!rem)?'disabled ':'')+'onclick="OLSD.num('+n+')"><b>'+n+'</b><i>'+rem+'</i></button>';}
  return h;
}
function pct(p,R){
  if(!p||+p.pr!==R||!L)return 0;
  return Math.min(100,Math.round((+p.pg||0)/Math.max(1,L.empties)*100));
}
function pcard(p,slot,c){
  var me=p&&p.uid===U().uid,fin=p&&c.R>0&&+p.fr===c.R&&+p.fin;
  var pc=fin?100:pct(p,c.R);
  return'<div class="sdo-pl'+(p?'':' empty')+(me?' me':'')+'"'+(p?' onclick="OL.prof(\''+e(p.uid)+'\')"':'')+'>'+
    '<b dir="auto">'+e(p?p.name:t("plWait"))+(me?' '+t("you"):'')+'</b>'+
    '<em>'+(p?(p.w||0):0)+'</em>'+
    '<span class="sdo-bar"><i style="width:'+pc+'%"></i></span>'+
    '<small dir="ltr">'+(p?(fin?t("finished"):pc+'%'):'')+'</small></div>';
}
function langBtn(){return'<button type="button" class="sdo-lang" onclick="OLSD.lang()" aria-label="Language">'+(lang()==="ar"?"EN":"ع")+'</button>';}

function draw(){
  var ctx=I.ctx(),S=ctx.S,u=U();if(!S||!u)return;
  getOffset();
  var c=calc(S,u.uid),host=ctx.role==="host",dir=lang()==="ar"?"rtl":"ltr";
  var o={room:true,t:"Sudoku",g:"sudoku",playing:!!(c.play&&!c.over)};
  var W=function(h){return'<div class="sd-app sdo" dir="'+dir+'" lang="'+lang()+'">'+h+'</div>';};

  /* ----- اللوبي: قبل ما حد يبدأ ----- */
  if(!c.both||S.status!=="play"||!c.R){
    var chips='<div class="sdo-lab">'+t("diff")+'</div><div class="sdo-chips">'+["easy","medium","hard"].map(function(d){
      return'<button type="button" class="sdo-chip'+(c.diff===d?' on':'')+'"'+(host?' onclick="OLSD.diff(\''+d+'\')"':' disabled')+'><span>'+lvl(d)+'</span><b dir="ltr">+'+C.onlinePoints(d)+'</b></button>';}).join("")+'</div>';
    var ps='<div class="sdo-score">'+pcard(c.a,"a",c)+'<div class="sdo-mid"><small>'+t("round")+'</small><em>'+(c.R||1)+'</em></div>'+pcard(c.b,"b",c)+'</div>';
    var h=langBtn()+'<div class="ol-ticket" onclick="OL.copy()"><small>'+t("code")+'</small><div class="ol-code">'+e(ctx.code)+'</div><span>'+t("send")+'</span></div>';
    if(!c.both)h+='<div class="sdo-wait"><div class="sdo-dots"><i></i><i></i><i></i></div>'+t("wait")+'</div>';
    else h+=ps;
    h+=chips+'<p class="sdo-rules">'+(host?t("rules"):t("hostPicks")+' '+t("rules"))+'</p>';
    if(host&&c.both)h+='<button type="button" class="sdo-go" onclick="OLSD.start()">'+t("start")+'</button>';
    else if(!host&&c.both)h+='<div class="sdo-wait sm">'+t("waitHost")+'</div>';
    h+=host?'<button type="button" class="ol-s" onclick="OL.close()">'+t("close")+'</button>':'<button type="button" class="ol-s" onclick="OLSD.leave()">'+t("leave")+'</button>';
    I.shell(W(h),o);
    stopTimer();
    return;
  }

  /* ----- السباق ----- */
  ensureRound(c,ctx);
  if(c.over)record(c,ctx);
  var iWon=!!(c.w&&c.w.p.uid===u.uid),pts=C.onlinePoints(c.diff),status,canPlay=!!(c.my&&!c.over&&!c.iFinished);
  if(!c.my)status='<span>'+t("spect")+'</span>';
  else if(c.over)status=iWon?'<span class="sdo-w">'+t("won",{p:pts})+'</span>':'<span class="sdo-l">'+t("lost",{n:e(c.w.p.name)})+'</span>';
  else if(c.iFinished)status='<span>'+t("solvedWait")+'</span>';
  else status='<span class="sdo-t">'+t("race")+'</span>';
  var elapsed=c.over?(c.w.fin-c.t0):(c.t0?now()-c.t0:0);
  var h=langBtn()+'<div class="sdo-score">'+pcard(c.a,"a",c)+'<div class="sdo-mid"><small>'+t("round")+' '+c.R+'</small><em id="sdoTime" dir="ltr">'+fmt(elapsed)+'</em><small>'+lvl(c.diff)+' · +'+pts+'</small></div>'+pcard(c.b,"b",c)+'</div>';
  h+='<p class="sdo-status" role="status" aria-live="polite">'+status+'</p>';
  h+='<div class="sd-board'+(c.over?' over':'')+'" dir="ltr" role="grid" aria-label="Sudoku">'+boardHtml(canPlay)+'</div>';
  if(c.over){
    if(host)h+='<div class="sdo-lab" style="margin-top:16px">'+t("diff")+'</div><div class="sdo-chips">'+["easy","medium","hard"].map(function(d){
      return'<button type="button" class="sdo-chip'+(c.diff===d?' on':'')+'" onclick="OLSD.diff(\''+d+'\')"><span>'+lvl(d)+'</span><b dir="ltr">+'+C.onlinePoints(d)+'</b></button>';}).join("")+'</div>'+
      '<button type="button" class="sdo-go" onclick="OLSD.start()">'+t("next")+'</button>';
    else h+='<div class="sdo-wait sm">'+t("waitNext",{n:e(c.P.a&&c.P.a.uid===u.uid?(c.b?c.b.name:""):(c.a?c.a.name:""))})+'</div>';
  }else{
    h+='<div class="sd-tools four" style="grid-template-columns:repeat(3,1fr)">'+
      '<button type="button" class="sd-tool" '+(canPlay?'':'disabled ')+'onclick="OLSD.undo()"><span>'+t("undo")+'</span></button>'+
      '<button type="button" class="sd-tool" '+(canPlay?'':'disabled ')+'onclick="OLSD.erase()"><span>'+t("erase")+'</span></button>'+
      '<button type="button" class="sd-tool'+(L.notesOn?' on':'')+'" '+(canPlay?'':'disabled ')+'onclick="OLSD.notes()"><span>'+t("notes")+'</span></button></div>'+
      '<div class="sd-pad">'+padHtml(canPlay)+'</div>';
  }
  h+='<div class="sdo-foot">'+(host?'<button type="button" class="ol-s" onclick="OL.close()">'+t("close")+'</button>':'<button type="button" class="ol-s" onclick="OLSD.leave()">'+t("leave")+'</button>')+'</div>';
  I.shell(W(h),o);
  startTimer();
}

/* ---------- عدّاد الوقت (من غير إعادة رسم كاملة) ---------- */
function startTimer(){if(tm)return;tm=setInterval(tick,1000);}
function stopTimer(){if(tm){clearInterval(tm);tm=0;}}
function tick(){
  var el=document.getElementById("sdoTime"),ctx=I.ctx(),S=ctx.S;
  if(!el||!S||!document.getElementById("olRoot")){stopTimer();return;}
  var c=calc(S,U().uid);
  if(!c.play||c.over||!c.t0)return;
  var s=fmt(now()-c.t0);if(el.textContent!==s)el.textContent=s;
}
document.addEventListener("keydown",function(ev){
  var ctx=I.ctx(),S=ctx.S;
  if(!S||S.game!=="sudoku"||!document.getElementById("olRoot")||!mine()||ev.ctrlKey||ev.metaKey||ev.altKey)return;
  var k=ev.key;
  if(k>="1"&&k<="9"){ev.preventDefault();num(+k);}
  else if(k==="Backspace"||k==="Delete"||k==="0"){ev.preventDefault();erase();}
  else if(k==="n"||k==="N")notes();
  else if(k==="z"||k==="Z")undo();
  else if(k.indexOf("Arrow")===0){
    ev.preventDefault();
    var i=L.sel<0?40:L.sel,r=C.ROW[i],c=C.COL[i];
    if(k==="ArrowUp")r=Math.max(0,r-1);else if(k==="ArrowDown")r=Math.min(8,r+1);
    else if(k==="ArrowLeft")c=Math.max(0,c-1);else c=Math.min(8,c+1);
    sel(r*9+c);
  }
});

window.OLSD={draw:draw,sel:sel,num:num,erase:erase,undo:undo,notes:notes,diff:setDiff,start:start,lang:toggleLang,leave:leave};
})();
