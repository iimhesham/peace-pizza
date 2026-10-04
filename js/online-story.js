/* أونلاين — قصص الجرايم بالحسابات. الـ GM (حساب واحد) بيحكم ومش بيلعب؛ كل لاعب بحسابه، دوره السري ليه بس، وصوت واحد لكل حساب. */
(function(){
var GM="modybadr966@gmail.com",NM={niyaba:"ملفات النيابة 1",niyaba2:"ملفات النيابة 2",mabhouh:"ملف محمود المبحوح",train:"مين قتل فواز؟",yousef:"مين قتل يوسف عمر؟"};
var db,code,role,S,R,M,V,vref,vkey,peek=false,offs=[];
var e=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var U=function(){return window.ppUser;},T=function(m){try{toast(m);}catch(x){}};
var IC=function(n,o){return'<i class="ol-i" style="--ic:var(--'+(o?'o':'i')+'-'+n+')"></i>';};
var K=function(t){return'<small class="ol-kick" dir="ltr">'+t+'</small>';};

function shell(h,o){OL.shell(h,o);}
function on(r,f){var h=r.on("value",f);offs.push(function(){r.off("value",h);});}
function clear(){offs.forEach(function(f){f();});offs=[];vref=null;code=role=S=R=M=V=null;}
function rg(){return GAMES[S.st];}
function ids(){return Object.keys(S.crew||{});}
function open(){
  db=firebase.database();
  shell('<div class="ol-w">اختار القصة اللي هتحكمها</div>'+Object.keys(GAMES).map(function(k){return'<button class="ol-b" onclick="OLS.create(\''+k+'\')">'+e(NM[k]||k)+'</button>';}).join("")+'<button type="button" class="ol-b o" onclick="OL.up()">رجوع</button>',{t:"قصص الجرايم"});
}
function create(k){var u=U();clear();db=firebase.database();code=String(1000+Math.floor(Math.random()*9000));role="host";
  db.ref("rooms/"+code).set({host:u.uid,hostName:u.displayName||"",game:"story",st:k,status:"lobby",created:Date.now()}).then(listen).catch(function(){T("فشل إنشاء الغرفة");clear();});}
function join(c){var u=U();db=firebase.database();clear();code=c;role="player";
  db.ref("rooms/"+c+"/crew/"+u.uid).set({name:u.displayName||"لاعب",photo:u.photoURL||""}).then(listen).catch(function(){clear();T("مقدرتش أدخل");});}
function listen(){
  on(db.ref("rooms/"+code),function(s){S=s.val();if(!S){if(code){T("الغرفة اتقفلت");OL.exit();}return;}
    if(role==="host"&&S.vote&&S.vote!==vkey){vkey=S.vote;if(vref)vref.off();vref=db.ref("votes/"+code+"/"+vkey);vref.on("value",function(v){V=v.val()||{};draw();});}
    if(!S.vote)V=null;draw();});
  if(role==="host")on(db.ref("secrets/"+code),function(s){R=s.val()||{};draw();});
  else on(db.ref("secrets/"+code+"/"+U().uid),function(s){M=s.val();draw();});
}
function shuf(a){return a.slice().sort(function(){return Math.random()-.5;});}
function pub(rd){return{title:rd.title||"",text:rd.text||"",evidence:rd.evidence||""};}
function privs(i,m){var rd=rg().rounds[i],p={};if(rd&&rd.private&&rd.privateRole!=null)Object.keys(m).forEach(function(u){if(m[u].id===rd.privateRole)p["secrets/"+code+"/"+u+"/priv/"+i]=rd.private;});return p;}
function start(){var g=rg(),n=ids().length,rl=getGameRoles(S.st,code,n),us=shuf(ids()),cast={},p={};
  if(n<(g.minPlayers||3)){T("العدد قليل");return;}
  us.forEach(function(u,i){var r=rl[i];cast[u]={who:S.crew[u].name,role:r.name,pub:r.public,alive:true};p["secrets/"+code+"/"+u]=r;});
  var sec={};us.forEach(function(u,i){sec[u]=rl[i];});Object.assign(p,privs(0,sec));
  p["rooms/"+code+"/status"]="play";p["rooms/"+code+"/round"]=0;p["rooms/"+code+"/cast"]=cast;p["rooms/"+code+"/pub"]=pub(g.rounds[0]);
  db.ref().update(p);}
function next(){var n=S.round+1,g=rg();if(n>=g.rounds.length)return db.ref("rooms/"+code).update({status:"end",vote:null});
  var p=privs(n,R);p["rooms/"+code+"/round"]=n;p["rooms/"+code+"/pub"]=pub(g.rounds[n]);p["rooms/"+code+"/vote"]=null;db.ref().update(p);}
function openVote(){var n=(S.vc||0)+1;db.ref("rooms/"+code).update({vote:"v"+n,vc:n});}
function closeVote(){db.ref("rooms/"+code).update({vote:null});}
function elim(u){var p={};p["cast/"+u+"/alive"]=false;p.vote=null;p.last=S.cast[u].role+" ("+S.cast[u].who+") اتقصى";db.ref("rooms/"+code).update(p);}
function reveal(){var k=Object.keys(R).filter(function(u){return R[u].killer||R[u].accomplice;}).map(function(u){return(R[u].killer?"القاتل: ":"الشريك: ")+S.cast[u].role+" ("+S.cast[u].who+")";});
  db.ref("rooms/"+code).update({status:"end",vote:null,reveal:k});}
function vote(t){var k="olv_"+code+"_"+S.vote;try{localStorage.setItem(k,"1");}catch(x){}
  db.ref("votes/"+code+"/"+S.vote+"/"+U().uid).set(t).catch(function(){T("صوتك اتسجل قبل كده");});draw();}
function voted(){try{return localStorage.getItem("olv_"+code+"_"+S.vote);}catch(x){return null;}}
function cast(forVote,me){var c=S.cast||{};return Object.keys(c).map(function(u){var x=c[u];
  return'<div class="ol-t'+(x.alive?'':' ol-dead')+'"><div class="ol-v" style="width:100%"><span style="color:#e9efeb;text-align:right"><b>'+e(x.role)+'</b><br><small style="color:#8d9d95;font-weight:400">'+e(x.pub)+'</small></span>'+
   (forVote&&x.alive&&u!==me?'<button class="ol-b" onclick="OLS.vote(\''+u+'\')">صوّت</button>':'')+'</div></div>';}).join("");}
function draw(){
  if(!S||!document.getElementById("olRoot"))return;
  var host=role==="host",me=U().uid,p=S.pub||{},c=S.cast||{},O={room:true,code:code,t:NM[S.st]||S.st,playing:S.status==="play"};
  if(S.status==="lobby"){
    shell('<div class="ol-ticket" onclick="OL.copy()"><small>كود الغرفة · دوس عشان تنسخه</small><div class="ol-code">'+e(code)+'</div><span>ابعت الكود للاعبين</span></div><div class="ol-sec">اللاعبين ('+ids().length+')</div>'+ids().map(function(u){return'<div class="ol-t"><b>'+(S.crew[u].photo?'<img class="ol-av" referrerpolicy="no-referrer" alt="" src="'+e(S.crew[u].photo)+'">':'<span class="ol-ph"></span>')+(OL.nmu?OL.nmu(u,S.crew[u].name):e(S.crew[u].name))+'</b></div>';}).join("")+(host?'<button type="button" class="ol-b" onclick="OLS.start()">وزّع الأدوار وابدأ</button>':'<div class="ol-w">مستني الـ GM يوزع الأدوار…</div>'),O);
    return;}
  var rd=rg().rounds[S.round]||{},top='<div class="ol-p"><h3>'+e(p.title)+'</h3>'+e(p.text)+(p.evidence?'<br><small>الدليل</small><br>'+e(p.evidence):'')+'</div>'+(S.last?'<div class="ol-bz">'+e(S.last)+'</div>':'');
  if(host){
    var rows=Object.keys(c).map(function(u){var r=(R||{})[u]||{};return'<div class="ol-t'+(c[u].alive?'':' ol-dead')+'"><b>'+e(c[u].role)+'</b><span style="font-weight:400;color:#8d9d95">'+e(c[u].who)+(r.killer?'<i class="ol-tag">قاتل</i>':r.accomplice?'<i class="ol-tag">شريك</i>':'')+'</span></div>';}).join("");
    var tally="";if(S.vote){var cnt={};Object.keys(V||{}).forEach(function(v){cnt[V[v]]=(cnt[V[v]]||0)+1;});
      tally='<div class="ol-p"><h3>التصويت</h3><small>صوّت '+Object.keys(V||{}).length+' من '+Object.keys(c).filter(function(u){return c[u].alive;}).length+'</small>'+Object.keys(c).filter(function(u){return c[u].alive;}).map(function(u){return'<div class="ol-v"><span>'+e(c[u].role)+' — '+(cnt[u]||0)+'</span><button class="ol-b r" onclick="OLS.elim(\''+u+'\')">اقصِ</button></div>';}).join("")+'</div>';}
    shell(top+'<div class="ol-p"><h3>للـ GM فقط</h3>'+(rd.surface?'<small>سطحي</small><br>'+e(rd.surface)+'<br>':'')+(rd.deep?'<small>أعمق</small><br>'+e(rd.deep):'')+(rd.private?'<br><small>الدليل الخاص اتبعت لصاحب الدور تلقائيًا</small>':'')+'</div>'+rows+tally+
      (S.status==="end"?(S.reveal?'<div class="ol-p"><h3>الكشف</h3>'+S.reveal.map(e).join("<br>")+'</div>':'')+'<button class="ol-b" onclick="OLS.reveal()">اكشف القاتل</button><button class="ol-b r" onclick="OLS.close()">اقفل الغرفة</button>':
      (S.vote?'<button class="ol-b o" onclick="OLS.closeVote()">اقفل التصويت</button>':'<button class="ol-b" onclick="OLS.openVote()">افتح التصويت</button>')+'<button class="ol-b o" onclick="OLS.next()">'+(S.round+1>=rg().rounds.length?'ختام':'الجولة الجاية')+'</button><button class="ol-s" onclick="OLS.reveal()">اكشف القاتل (إنهاء)</button>'),O);
    return;}
  var mine=c[me]||{},alive=mine.alive!==false,mc=M?(M.killer||M.accomplice):false;
  var card=M?'<div class="ol-p"><h3>'+e(mine.role)+(mc?'<i class="ol-tag">إنت المافيوسو</i>':'')+'</h3>'+(peek?'<small>سرك</small><br>'+e(M.secret)+'<br><small>نقطة قوتك</small><br>'+e(M.strength)+'<br><small>نقطة ضعفك</small><br>'+e(M.weakness)+(M.grudge?'<br><small>ضغينة</small><br>'+e(M.grudge):'')+(M.witness&&!mc&&rg().witnessNote?'<br><small>ملاحظة سرية</small><br>'+e(rg().witnessNote):'')+Object.keys(M.priv||{}).map(function(i){return'<br><small>دليل خاص · جولة '+(+i+1)+'</small><br>'+e(M.priv[i]);}).join(""):'<small>دورك مخفي</small>')+'</div><button class="ol-b o" onclick="OLS.peek()">'+(peek?'اخفي دورك':'اكشف دورك')+'</button>':'';
  var vb=S.vote&&alive?(voted()?'<div class="ol-bz">'+IC("check")+' اتسجّل صوتك</div>':'<div class="ol-bz">اختار مين تشك فيه</div>'):"";
  shell(top+(alive?'':'<div class="ol-bz">اتقصيت، تفرّج بس</div>')+card+vb+cast(S.vote&&alive&&!voted(),me)+(S.reveal?'<div class="ol-p"><h3>الكشف</h3>'+S.reveal.map(e).join("<br>")+'</div>':''),O);
}
var oe=OL.exit,oj=OL.join;
OL.exit=function(){clear();oe();};
OL.join=function(){var c=(document.getElementById("olCode").value||"").replace(/\D/g,"");if(c.length!==4){T("اكتب كود الغرفة (4 أرقام)");return;}db=firebase.database();
  db.ref("rooms/"+c).once("value").then(function(s){var r=s.val();
    if(r&&r.game==="story"){if(r.host===U().uid){clear();code=c;role="host";listen();}else join(c);}else oj();}).catch(function(){oj();});};
window.OLS={open:open,create:create,start:start,next:next,openVote:openVote,closeVote:closeVote,elim:elim,reveal:reveal,vote:vote,peek:function(){peek=!peek;draw();},close:function(){if(!confirm("تقفل الغرفة للكل؟"))return;var c=code;db.ref("secrets/"+c).remove().then(function(){return db.ref("votes/"+c).remove();}).then(function(){return db.ref("rooms/"+c).remove();});}};
})();
