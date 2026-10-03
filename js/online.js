/* أونلاين (المرحلة 1: الأعلام) — غرف لحظية على Firebase Realtime Database.
   الـ Host بيحكم، وفريقين (حساب لكل فريق). أول واحد يدوس "جاوب" ليه حق الإجابة. */
(function(){
var SDK="https://www.gstatic.com/firebasejs/10.12.2/",N=15,db,code,role,S,ov,off;
var e=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var U=function(){return window.ppUser;};
var T=function(m){try{toast(m);}catch(x){}};
var CSS='#olRoot{position:fixed;inset:0;z-index:9999;background:#0a0a0a;color:#f3ead0;overflow:auto;font-family:inherit;text-align:center}'+
'.ol-c{max-width:440px;margin:0 auto;padding:56px 18px 30px}.ol-x{position:fixed;top:12px;left:12px;background:#222;color:#fff;border:0;border-radius:50%;width:38px;height:38px;font-size:18px}'+
'.ol-b,.ol-s,.ol-buzz{display:block;width:100%;margin:10px 0;padding:14px;border-radius:12px;border:0;background:#d9c27a;color:#111;font:700 17px inherit;font-family:inherit}'+
'.ol-b.g{background:#0d6b50;color:#fff}.ol-b.r{background:#a02b2b;color:#fff}.ol-s{background:#2a2a2a;color:#ccc;font-size:14px}'+
'.ol-buzz{height:120px;font-size:30px;background:#c0392b;color:#fff}.ol-buzz:disabled{background:#333;color:#777}'+
'#olRoot input{width:100%;padding:13px;border-radius:10px;border:1px solid #444;background:#161616;color:#fff;font-size:20px;text-align:center;margin:8px 0}'+
'.ol-or{color:#888;margin:6px}.ol-code{font-size:56px;letter-spacing:8px;font-weight:800;color:#d9c27a;direction:ltr}'+
'.ol-f{width:78%;max-height:210px;object-fit:contain;border-radius:8px;margin:14px 0;box-shadow:0 0 0 2px #333}'+
'.ol-t{display:flex;justify-content:space-between;background:#171717;border-radius:10px;padding:10px 14px;margin:6px 0}.ol-t span{color:#d9c27a;font-weight:800}'+
'.ol-r{display:flex;gap:10px}.ol-a,.ol-w,.ol-l{margin:8px 0;color:#bbb}.ol-bz{font-size:20px;margin:10px 0;color:#ffd35c}.ol-a b{color:#fff}';
function shell(h){ov.innerHTML='<div class="ol-c"><button class="ol-x" onclick="OL.exit()">✕</button>'+h+'</div>';}
function menu(){shell('<h2>🌐 أونلاين · أعلام</h2><button class="ol-b" onclick="OL.create()">اعمل غرفة (أنا الـ Host)</button><div class="ol-or">أو</div><input id="olCode" inputmode="numeric" maxlength="4" placeholder="كود الغرفة" dir="ltr"><button class="ol-b g" onclick="OL.join()">ادخل كفريق</button>');}
function pl(){var P=S.players||{};return Object.keys(P).map(function(k){return P[k];});}
function ids(){return pl().map(function(p){return p.uid;});}
function board(){var sc=S.scores||{};return pl().map(function(p){return'<div class="ol-t"><b>'+e(p.name)+'</b><span>'+((sc[p.uid]||{}).pts||0)+'</span></div>';}).join("")||'<div class="ol-w">لسه محدش دخل</div>';}
function cur(){return FLAGS_DATA[S.deck[S.i]];}
function lastLine(){var l=S.last;if(!l)return"";return'<div class="ol-l">'+(l.w?'✗ '+e(l.who)+' جاوب غلط':l.skip?'اتخطّت — '+e(l.name):'✓ '+e(l.who)+' جاب النقطة — '+e(l.name))+'</div>';}
function draw(){
  if(!ov)return;
  if(!S){if(code){T("الغرفة اتقفلت");exit();}return;}
  var host=role==="host",me=U().uid,b=S.buzz;
  if(S.status==="lobby"){
    shell('<h2>الغرفة</h2><div class="ol-code">'+e(code)+'</div><div class="ol-w">ابعت الكود للفريقين</div>'+board()+(host?'<button class="ol-b" onclick="OL.start()">ابدأ ('+ids().length+'/2)</button>':'<div class="ol-w">مستني الـ Host يبدأ…</div>'));
  }else if(S.status==="play"){
    var it=cur(),img='<img class="ol-f" src="'+e(flagImgUrl(it[0]))+'" alt="">',head='<div class="ol-w">علم '+(S.i+1)+' / '+S.deck.length+'</div>'+board()+img;
    if(host)shell(head+'<div class="ol-a">الإجابة: <b>'+e(it[1])+'</b></div>'+lastLine()+(b?'<div class="ol-bz">🔔 '+e(b.name)+' سبق!</div><div class="ol-r"><button class="ol-b" onclick="OL.mark(1)">✓ صح</button><button class="ol-b r" onclick="OL.mark(0)">✗ غلط</button></div>':'<div class="ol-w">مستني حد يدوس…</div>')+'<button class="ol-s" onclick="OL.next()">تخطّي العلم</button>');
    else{var lk=(S.locked||{})[me],msg=b?(b.uid===me?'🔔 إنت سبقت! جاوب بصوتك':e(b.name)+' سبقك'):lk?'غلطت، استنى حد تاني':'';
      shell(head+lastLine()+'<div class="ol-bz">'+msg+'</div><button class="ol-buzz" '+(b||lk?'disabled':'')+' onclick="OL.buzz()">جاوب!</button>');}
  }else{
    var sc=S.scores||{},best=pl().sort(function(a,c){return((sc[c.uid]||{}).pts||0)-((sc[a.uid]||{}).pts||0);});
    shell('<h2>🏆 خلصنا</h2>'+board()+(best.length?'<div class="ol-bz">الفايز: '+e(best[0].name)+'</div>':'')+(host?'<button class="ol-b r" onclick="OL.close()">اقفل الغرفة</button>':'<div class="ol-w">النتيجة اتسجلت في حسابك</div>'));
    if(!host)saveStats();
  }
}
function saveStats(){var k="olst_"+code+"_"+S.created;try{if(localStorage.getItem(k))return;localStorage.setItem(k,"1");}catch(x){}
  var m=(S.scores||{})[U().uid]||{};
  db.ref("users/"+U().uid+"/stats/flags").transaction(function(c){c=c||{pts:0,right:0,wrong:0,games:0};c.pts+=m.pts||0;c.right+=m.right||0;c.wrong+=m.wrong||0;c.games+=1;return c;});}
function push(u){db.ref("rooms/"+code).update(u);}
function listen(){var r=db.ref("rooms/"+code),f=r.on("value",function(s){S=s.val();draw();});off=function(){r.off("value",f);};}
function create(){var u=U();code=String(1000+Math.floor(Math.random()*9000));role="host";
  db.ref("rooms/"+code).set({host:u.uid,hostName:u.displayName||"",status:"lobby",created:Date.now()}).then(listen).catch(function(){T("فشل إنشاء الغرفة، جرّب تاني");code=role=null;});}
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
  }).catch(function(){code=role=null;T("مقدرتش أدخل (الغرفة ممتلئة؟)");});}
function start(){var a=[],i;for(i=0;i<FLAGS_DATA.length;i++)a.push(i);a.sort(function(){return Math.random()-.5;});
  var sc={};ids().forEach(function(id){sc[id]={pts:0,right:0,wrong:0};});
  push({status:"play",deck:a.slice(0,N),i:0,buzz:null,locked:null,last:null,scores:sc});}
function advance(u,last){u.i=S.i+1;u.buzz=null;u.locked=null;u.last=last;if(S.i+1>=S.deck.length)u.status="end";push(u);}
function mark(ok){var b=S.buzz;if(!b)return;var s=(S.scores||{})[b.uid]||{pts:0,right:0,wrong:0},u={};
  if(ok){u["scores/"+b.uid]={pts:s.pts+1,right:s.right+1,wrong:s.wrong};advance(u,{name:cur()[1],who:b.name});}
  else{u["scores/"+b.uid]={pts:s.pts,right:s.right,wrong:s.wrong+1};u["locked/"+b.uid]=true;u.buzz=null;u.last={w:1,who:b.name};push(u);}}
function next(){advance({},{skip:1,name:cur()[1]});}
function buzz(){var u=U();db.ref("rooms/"+code+"/buzz").transaction(function(c){return c?undefined:{uid:u.uid,name:u.displayName||"لاعب",t:Date.now()};});}
function exit(){if(off)off();off=null;code=role=S=null;if(ov){ov.remove();ov=null;}}
function closeRoom(){var c=code;db.ref("rooms/"+c).remove();}
function open(){
  if(!U()){T("سجّل دخول بجوجل الأول");return;}
  var go=function(){if(!ov){ov=document.createElement("div");ov.id="olRoot";document.body.appendChild(ov);}menu();};
  if(db)return go();
  var s=document.createElement("script");s.src=SDK+"firebase-database-compat.js";
  s.onload=function(){db=firebase.database();go();};s.onerror=function(){T("مقدرتش أحمّل الأونلاين");};document.head.appendChild(s);
}
window.OL={open:open,create:create,join:join,start:start,mark:mark,next:next,buzz:buzz,exit:exit,close:closeRoom};
var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
var m=document.getElementById("fgModeCurrent");
if(m&&m.parentNode){var bt=document.createElement("button");bt.className="fg-mode";bt.textContent="🌐 أونلاين";bt.onclick=function(){try{playClickSound();}catch(x){}open();};m.parentNode.appendChild(bt);}
})();
