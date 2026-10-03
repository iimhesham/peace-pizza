/* أونلاين — غرف لحظية (Firebase Realtime Database). الـ Host بيحكم، وفريقين (حساب لكل فريق).
   ألعاب: أعلام · أنا مين · انتقالات. أول واحد يدوس "جاوب" ليه حق الإجابة، والنقاط والإحصائيات على الحساب. */
(function(){
var SDK="https://www.gstatic.com/firebasejs/10.12.2/",db,code,role,S,ov,off;
var e=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var U=function(){return window.ppUser;},T=function(m){try{toast(m);}catch(x){}};
var P3=[3,2,1];
var IC=function(n,o){return'<i class="ol-i" style="--ic:var(--'+(o?'o':'i')+'-'+n+')"></i>';};
var SV=function(p){return'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'2.1\' stroke-linecap=\'round\' stroke-linejoin=\'round\'>'+p+'</svg>")';};
var KICK=function(t){return'<small class="ol-kick" dir="ltr">'+t+'</small>';};
var G={
 flags:{n:"أعلام",c:15,steps:1,data:function(){return FLAGS_DATA;},ans:function(x){return x[1];},pts:function(){return 1;},
  view:function(x){return'<img class="ol-f" src="'+e(flagImgUrl(x[0]))+'" alt="">';}},
 story:{n:"أنا مين",c:8,steps:3,data:function(){return STORY_PLAYERS;},ans:function(x){return x.name;},pts:function(s){return P3[s];},
  view:function(x,s){return x.clues.slice(0,s+1).map(function(c,i){return'<div class="ol-k"><small>دليل '+(i+1)+'</small>'+e(c)+'</div>';}).join("");}},
 career:{n:"انتقالات",c:8,steps:3,data:function(){return CAREER_PLAYERS;},ans:function(x){return x.n;},pts:function(s){return P3[s];},
  view:function(x,s,o){var k=Math.ceil(x.c.length*[.35,.6,.85][s]),sh=(o||[]).slice(0,k);
   return x.c.map(function(c){var i=x.c.indexOf(c);return'<div class="ol-k">'+(sh.indexOf(i)>=0?e(c[0])+' <small>'+e(c[1])+(c[2]?" – "+e(c[2]):"")+'</small>':'؟')+'</div>';}).join("");}}
};
var BADGES=[["أول فوز","فوز واحد",function(t){return t.wins>=1;}],["مواظب","5 جلسات",function(t){return t.games>=5;}],["جامع نقاط","50 نقطة",function(t){return t.pts>=50;}],
 ["عالم أعلام","10 أعلام صح",function(t,s){return((s.flags||{}).right||0)>=10;}],["محقق","5 لاعبين صح",function(t,s){return((s.story||{}).right||0)>=5;}],["سمسار","5 انتقالات صح",function(t,s){return((s.career||{}).right||0)>=5;}]];
var CSS=':root{--o-bell:'+SV("<path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'/><path d='M10.3 21a1.9 1.9 0 0 0 3.4 0'/>")+';--o-trophy:'+SV("<path d='M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z'/><path d='M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3'/>")+';--o-chart:'+SV("<path d='M4 20V10M10 20V4M16 20v-7M22 20H2'/>")+'}'+
'.ol-i{display:inline-block;width:1.1em;height:1.1em;vertical-align:-.2em;background:currentColor;-webkit-mask:var(--ic) center/contain no-repeat;mask:var(--ic) center/contain no-repeat}'+
'.ol-kick{display:block;font:400 12px Anton,Impact,sans-serif;letter-spacing:4px;color:#6c7c74;margin-bottom:4px}.ol-av{width:26px;height:26px;border-radius:50%;object-fit:cover;margin-left:9px;vertical-align:middle;border:1px solid #41403b}'+
'#olRoot{position:fixed;inset:0;z-index:9999;background:#0a0a0a linear-gradient(rgba(10,10,10,.86),rgba(10,10,10,.86)),url(img/bg-checker.webp) center/cover;color:#e9efeb;overflow:auto;text-align:center;font-family:"IBM Plex Sans Arabic","Tajawal",sans-serif}'+
'.ol-c{max-width:440px;margin:0 auto;padding:58px 18px 30px}.ol-x{position:fixed;top:12px;left:12px;background:#1b1a18;color:#fff;border:1px solid #41403b;border-radius:50%;width:38px;height:38px;font-size:17px}'+
'.ol-c h2{color:#d4b675;margin:0 0 14px;font-weight:700}.ol-b,.ol-s,.ol-buzz{display:block;width:100%;margin:9px 0;padding:14px;border-radius:12px;border:0;background:#d4b675;color:#111;font:700 17px inherit;font-family:inherit}'+
'.ol-b.g{background:#0d6b50;color:#fff}.ol-b.r{background:#a02b2b;color:#fff}.ol-b.o{background:#141413;color:#d4b675;border:1px solid #41403b}.ol-s{background:#1b1a18;color:#aaa;font-size:14px}'+
'.ol-buzz{height:118px;font-size:30px;background:#c0392b;color:#fff}.ol-buzz:disabled{background:#262626;color:#666}.ol-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ol-g3 .ol-b{font-size:15px;padding:12px 4px}'+
'#olRoot input{width:100%;padding:13px;border-radius:10px;border:1px solid #41403b;background:#141413;color:#fff;font-size:20px;text-align:center;margin:8px 0;box-sizing:border-box}'+
'.ol-or{color:#6c7c74;margin:6px}.ol-code{font:400 60px Anton,Impact,sans-serif;letter-spacing:10px;color:#d4b675;direction:ltr;border:1px dashed #41403b;border-radius:16px;background:#141413;padding:14px 0 10px;margin:8px 0}.ol-f{width:78%;max-height:200px;object-fit:contain;border-radius:8px;margin:12px 0;box-shadow:0 0 0 2px #2a2927}'+
'.ol-t{display:flex;justify-content:space-between;background:#141413;border:1px solid #2a2927;border-radius:10px;padding:10px 14px;margin:6px 0}.ol-t span{color:#d4b675;font-weight:800}'+
'.ol-k{background:#141413;border-right:3px solid #d4b675;border-radius:8px;padding:10px 12px;margin:7px 0;text-align:right;line-height:1.6}.ol-k small{display:block;color:#8d9d95;font-size:12px}'+
'.ol-r{display:flex;gap:10px}.ol-a,.ol-w,.ol-l{margin:8px 0;color:#8d9d95}.ol-bz{font-size:20px;margin:10px 0;color:#ffd35c}.ol-a b{color:#fff}'+
'.ol-bd{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.ol-bd div{background:#141413;border:1px solid #2a2927;border-radius:10px;padding:10px 4px;font-size:13px;color:#555}.ol-bd .on{color:#d4b675;border-color:#d4b675}.ol-bd small{display:block;font-size:11px;opacity:.8}'+
'.ol-st{background:#141413;border:1px solid #2a2927;border-radius:12px;padding:12px;margin:8px 0;text-align:right}.ol-st b{color:#d4b675}'+
'.ol-hub{display:block;width:calc(100% - 4px);margin:12px 2px;padding:14px;border-radius:14px;border:1px dashed #41403b;background:#141413;color:#d4b675;font:400 20px Anton,Impact,sans-serif;letter-spacing:3px}.ol-hub small{display:block;font:500 12px "IBM Plex Sans Arabic",sans-serif;letter-spacing:0;color:#8d9d95;margin-top:3px}';
function shell(h){ov.innerHTML='<div class="ol-c"><button class="ol-x" onclick="OL.exit()" aria-label="خروج">'+IC('x')+'</button>'+h+'</div>';}
function menu(){shell(KICK('ONLINE')+'<h2>'+IC('globe')+' أونلاين</h2><div class="ol-w">اعمل غرفة (إنت الـ Host)</div><div class="ol-g3"><button class="ol-b" onclick="OL.create(\'flags\')">أعلام</button><button class="ol-b" onclick="OL.create(\'story\')">أنا مين</button><button class="ol-b" onclick="OL.create(\'career\')">انتقالات</button></div><div class="ol-or">أو</div><input id="olCode" inputmode="numeric" maxlength="4" placeholder="كود الغرفة" dir="ltr"><button class="ol-b g" onclick="OL.join()">ادخل كفريق</button><button class="ol-b o" onclick="OLS.open()">'+IC('book')+' قصص الجرايم</button><button class="ol-b o" onclick="OL.stats()">'+IC('chart',1)+' إحصائياتي وإنجازاتي</button>');}
function pl(){var P=S.players||{};return Object.keys(P).map(function(k){return P[k];});}
function ids(){return pl().map(function(p){return p.uid;});}
function board(){var sc=S.scores||{};return pl().map(function(p){return'<div class="ol-t"><b>'+(p.photo?'<img class="ol-av" referrerpolicy="no-referrer" alt="" src="'+e(p.photo)+'">':'')+e(p.name)+'</b><span>'+((sc[p.uid]||{}).pts||0)+'</span></div>';}).join("")||'<div class="ol-w">لسه محدش دخل</div>';}
function g(){return G[S.game||"flags"];}
function cur(){return g().data()[S.deck[S.i]];}
function lastLine(){var l=S.last;if(!l)return"";return'<div class="ol-l">'+(l.w?IC('x')+' '+e(l.who)+' جاوب غلط':l.skip?'اتخطّت — '+e(l.name):IC('check')+' '+e(l.who)+' جاب '+l.p+' — '+e(l.name))+'</div>';}
function draw(){
  if(!ov)return;
  if(!S){if(code){T("الغرفة اتقفلت");exit();}return;}
  var host=role==="host",me=U().uid,b=S.buzz,gm=g(),st=S.step||0;
  if(S.status==="lobby"){
    shell(KICK('ROOM CODE')+'<h2>غرفة '+gm.n+'</h2><div class="ol-code">'+e(code)+'</div><div class="ol-w">ابعت الكود للفريقين</div>'+board()+(host?'<button class="ol-b" onclick="OL.start()">ابدأ ('+ids().length+'/2)</button>':'<div class="ol-w">مستني الـ Host يبدأ…</div>'));
  }else if(S.status==="play"){
    var it=cur(),head='<div class="ol-w">'+gm.n+' · '+(S.i+1)+' / '+S.deck.length+(gm.steps>1?' · هتاخد '+gm.pts(st)+' نقط':'')+'</div>'+board()+gm.view(it,st,S.ord);
    if(host)shell(head+'<div class="ol-a">الإجابة: <b>'+e(gm.ans(it))+'</b></div>'+lastLine()+(b?'<div class="ol-bz">'+IC('bell',1)+' '+e(b.name)+' سبق!</div><div class="ol-r"><button class="ol-b" onclick="OL.mark(1)">'+IC('check')+' صح</button><button class="ol-b r" onclick="OL.mark(0)">'+IC('x')+' غلط</button></div>':'<div class="ol-w">مستني حد يدوس…</div>')+(gm.steps>1&&st<gm.steps-1?'<button class="ol-b o" onclick="OL.hint()">الدليل التالي</button>':'')+'<button class="ol-s" onclick="OL.next()">تخطّي</button>');
    else{var lk=(S.locked||{})[me],msg=b?(b.uid===me?IC('bell',1)+' إنت سبقت! جاوب بصوتك':e(b.name)+' سبقك'):lk?'غلطت، استنى الدليل الجاي':'';
      shell(head+lastLine()+'<div class="ol-bz">'+msg+'</div><button class="ol-buzz" '+(b||lk?'disabled':'')+' onclick="OL.buzz()">جاوب!</button>');}
  }else{
    var sc=S.scores||{},best=pl().sort(function(a,c){return((sc[c.uid]||{}).pts||0)-((sc[a.uid]||{}).pts||0);});
    shell(KICK('FULL TIME')+'<h2>'+IC('trophy',1)+' خلصنا</h2>'+board()+(best.length?'<div class="ol-bz">الفايز: '+e(best[0].name)+'</div>':'')+(host?'<button class="ol-b r" onclick="OL.close()">اقفل الغرفة</button>':'<div class="ol-w">النتيجة اتسجلت في حسابك</div><button class="ol-b o" onclick="OL.stats()">'+IC('chart',1)+' إحصائياتي</button>'));
    if(!host)saveStats();
  }
}
function saveStats(){var k="olst_"+code+"_"+S.created;try{if(localStorage.getItem(k))return;localStorage.setItem(k,"1");}catch(x){}
  var sc=S.scores||{},m=sc[U().uid]||{},top=Math.max.apply(null,ids().map(function(i){return(sc[i]||{}).pts||0;})),w=(m.pts||0)>0&&m.pts>=top?1:0;
  db.ref("users/"+U().uid+"/stats/"+(S.game||"flags")).transaction(function(c){c=c||{pts:0,right:0,wrong:0,games:0,wins:0};c.pts+=m.pts||0;c.right+=m.right||0;c.wrong+=m.wrong||0;c.games+=1;c.wins=(c.wins||0)+w;return c;});}
function stats(){var u=U();db.ref("users/"+u.uid+"/stats").once("value").then(function(s){
  var v=s.val()||{},t={games:0,pts:0,wins:0},h="";
  Object.keys(G).forEach(function(k){var x=v[k];if(!x)return;t.games+=x.games||0;t.pts+=x.pts||0;t.wins+=x.wins||0;var tot=(x.right||0)+(x.wrong||0);
    h+='<div class="ol-st"><b>'+G[k].n+'</b><br>جلسات: '+x.games+' · فوز: '+(x.wins||0)+' · نقاط: '+x.pts+'<br>صح: '+(x.right||0)+' · غلط: '+(x.wrong||0)+(tot?' · دقة '+Math.round((x.right||0)/tot*100)+'%':'')+'</div>';});
  shell(KICK('STATS')+'<h2>'+IC('chart',1)+' إحصائياتي</h2>'+(h||'<div class="ol-w">لسه ملعبتش أونلاين</div>')+'<h2 style="margin-top:20px">'+IC('trophy',1)+' الإنجازات</h2><div class="ol-bd">'+BADGES.map(function(b){var on=b[2](t,v);return'<div class="'+(on?'on':'')+'">'+(on?IC('check'):IC('lock'))+' '+b[0]+'<small>'+b[1]+'</small></div>';}).join("")+'</div><button class="ol-b o" onclick="OL.back()">رجوع</button>');
 }).catch(function(){T("مقدرتش أجيب الإحصائيات");});}
function push(u){db.ref("rooms/"+code).update(u);}
function listen(){var r=db.ref("rooms/"+code),f=r.on("value",function(s){S=s.val();draw();});off=function(){r.off("value",f);};}
function create(k){var u=U();code=String(1000+Math.floor(Math.random()*9000));role="host";
  db.ref("rooms/"+code).set({host:u.uid,hostName:u.displayName||"",game:k,status:"lobby",created:Date.now()}).then(listen).catch(function(){T("فشل إنشاء الغرفة، جرّب تاني");code=role=null;});}
function join(){var u=U(),c=(document.getElementById("olCode").value||"").trim();if(!c)return;
  db.ref("rooms/"+c+"/host").once("value").then(function(s){
    if(!s.exists()){T("الغرفة مش موجودة");return;}
    code=c;role=s.val()===u.uid?"host":"player";
    if(role==="host")return listen();
    return db.ref("rooms/"+c+"/players").once("value").then(function(ps){
      var v=ps.val()||{},k=["a","b"].filter(function(x){return v[x]&&v[x].uid===u.uid;})[0]||["a","b"].filter(function(x){return!v[x];})[0];
      if(!k){code=role=null;T("الغرفة ممتلئة");return;}
      return db.ref("rooms/"+c+"/players/"+k).set({uid:u.uid,name:u.displayName||"لاعب",photo:u.photoURL||""}).then(listen);
    });
  }).catch(function(){code=role=null;T("مقدرتش أدخل");});}
function shuf(n){var a=[],i;for(i=0;i<n;i++)a.push(i);return a.sort(function(){return Math.random()-.5;});}
function ordFor(i){var x=g().data()[i];return x&&x.c?shuf(x.c.length):null;}
function start(){var gm=g(),a=shuf(gm.data().length).slice(0,gm.c),sc={};ids().forEach(function(id){sc[id]={pts:0,right:0,wrong:0};});
  push({status:"play",deck:a,i:0,step:0,ord:ordFor(a[0]),buzz:null,locked:null,last:null,scores:sc});}
function advance(u,last){var n=S.i+1;u.buzz=null;u.locked=null;u.step=0;u.last=last;
  if(n>=S.deck.length)u.status="end";else{u.i=n;u.ord=ordFor(S.deck[n]);}push(u);}
function mark(ok){var b=S.buzz;if(!b)return;var s=(S.scores||{})[b.uid]||{pts:0,right:0,wrong:0},u={},p=g().pts(S.step||0);
  if(ok){u["scores/"+b.uid]={pts:s.pts+p,right:s.right+1,wrong:s.wrong};advance(u,{name:g().ans(cur()),who:b.name,p:p});}
  else{u["scores/"+b.uid]={pts:s.pts,right:s.right,wrong:s.wrong+1};u["locked/"+b.uid]=true;u.buzz=null;u.last={w:1,who:b.name};push(u);}}
function hint(){push({step:(S.step||0)+1,buzz:null,locked:null});}
function next(){advance({},{skip:1,name:g().ans(cur())});}
function buzz(){var u=U();db.ref("rooms/"+code+"/buzz").transaction(function(c){return c?undefined:{uid:u.uid,name:u.displayName||"لاعب",t:Date.now()};});}
function exit(){if(off)off();off=null;code=role=S=null;if(ov){ov.remove();ov=null;}}
function back(){if(code)draw();else menu();}
function open(){
  if(!U()){T("سجّل دخول بجوجل الأول");return;}
  var go=function(){if(!ov){ov=document.createElement("div");ov.id="olRoot";document.body.appendChild(ov);}menu();};
  if(db)return go();
  var s=document.createElement("script");s.src=SDK+"firebase-database-compat.js";
  s.onload=function(){db=firebase.database();go();};s.onerror=function(){T("مقدرتش أحمّل الأونلاين");};document.head.appendChild(s);
}
window.OL={open:open,create:create,join:join,start:start,mark:mark,hint:hint,next:next,buzz:buzz,exit:exit,back:back,stats:stats,close:function(){db.ref("rooms/"+code).remove();}};
var ls=document.createElement("script");ls.src="js/online-story.js";document.head.appendChild(ls);
var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
var h=document.querySelector("#hub .hm-stats");
if(h&&h.parentNode){var bt=document.createElement("button");bt.className="ol-hub";bt.innerHTML='ONLINE<small>العب مع صحابك من موبايلات مختلفة · أعلام · أنا مين · انتقالات</small>';
  bt.onclick=function(){try{playClickSound();}catch(x){}open();};h.parentNode.insertBefore(bt,h);}
})();
