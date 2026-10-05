/* =========================================================
   أونلاين — الجانب الاجتماعي
   الترتيب · لاعب الشهر · البروفايل · الأصحاب · اقتراح الأسئلة
   بيشتغل فوق online.js (بياخد منه OL.i)
========================================================= */
(function(){
if(!window.OL||!OL.i)return;
var I=OL.i,e=I.e,U=I.U,T=I.T,IC=I.IC,IX=I.IX;
var D=function(){return I.db();};
var GK=["flags","story","career"];
var GN={flags:"أعلام",story:"أنا مين",career:"انتقالات",crime:"قصة جريمة"};
var LB=null,NREQ=0,preAt=0,ret=null,curTab="me",rf="all",F={g:"career"},QL=[],profId=null,fq="";

/* ---------- أدوات ---------- */
function mlabel(k){var p=k.split("-");return I.MO[+p[1]-1]+" "+p[0];}
function agg(x){var s=(x&&x.s)||{},r={games:0,wins:0,right:0,wrong:0,pts:0};GK.forEach(function(k){var y=s[k]||{};r.games+=y.games||0;r.wins+=y.wins||0;r.right+=y.right||0;r.wrong+=y.wrong||0;r.pts+=y.pts||0;});return r;}
function gp(x,k){return((((x||{}).s||{})[k]||{}).pts)||0;}
function av(p,id,cls){return p?'<img class="ol-av '+(cls||"")+(I.bk(id)?' r-'+I.bk(id):'')+'" referrerpolicy="no-referrer" alt="" src="'+e(p)+'">':'<span class="ol-ph '+(cls||"")+'"></span>';}
function val(id){var el=document.getElementById(id);return el?String(el.value||"").trim():"";}
function alive(){return!!document.getElementById("olRoot");}
function load(cb){I.loadB().then(function(){return D().ref("lb").once("value");}).then(function(s){LB=s.val()||{};cb(LB);},function(){LB=LB||{};T("مقدرتش أجيب الترتيب. اتأكد إن الـ Rules اتنشرت");cb(LB);});}
function list(f){return Object.keys(LB||{}).map(function(id){var x=LB[id]||{},a=agg(x);return{id:id,x:x,n:x.n||"لاعب",p:x.p||"",a:a,v:f==="all"?a.pts:gp(x,f)};}).filter(function(r){return r.a.games>0||r.v!==0;}).sort(function(a,b){return b.v-a.v||b.a.wins-a.a.wins||(a.n<b.n?-1:1);});}

/* ---------- لاعب الشهر ---------- */
function monthsMap(){var M={};Object.keys(LB||{}).forEach(function(id){var m=(LB[id]||{}).m||{};Object.keys(m).forEach(function(k){(M[k]=M[k]||[]).push({id:id,v:m[k]});});});
  Object.keys(M).forEach(function(k){M[k]=M[k].filter(function(r){return r.v>0;}).sort(function(a,b){return b.v-a.v||(a.id<b.id?-1:1);});});return M;}
function winners(){var M=monthsMap(),cur=I.mkey();
  var past=Object.keys(M).filter(function(k){return k<cur&&M[k].length;}).sort().reverse().map(function(k){return{k:k,w:M[k][0]};});
  return{cur:cur,now:M[cur]||[],past:past};}
function awardsOf(id){var W=winners();return{won:W.past.filter(function(p){return p.w.id===id;}),lead:!!(W.now[0]&&W.now[0].id===id),W:W};}
var TROPHY='<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="oxTg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".5" stop-color="#e6b53c"/><stop offset="1" stop-color="#9b6d10"/></linearGradient></defs><path d="M30 14h60v30c0 20-13 34-30 34S30 64 30 44z" fill="url(#oxTg)"/><path d="M30 22H12v10c0 14 9 24 22 26M90 22h18v10c0 14-9 24-22 26" fill="none" stroke="url(#oxTg)" stroke-width="7" stroke-linecap="round"/><rect x="54" y="76" width="12" height="18" fill="url(#oxTg)"/><path d="M38 94h44l6 14H32z" fill="url(#oxTg)"/><rect x="28" y="108" width="64" height="12" rx="3" fill="#7b5410"/><path d="M60 26l5 10 11 1.6-8 7.8 1.9 11L60 51l-9.9 5.4 1.9-11-8-7.8 11-1.6z" fill="#fff6d0" opacity=".85"/></svg>';

/* ---------- شريط التبويبات ---------- */
function tabs(a){if(a)curTab=a;
  var L=[["me","حسابي","u"],["rank","الترتيب","o:chart"],["awards","الجوايز","o:trophy"],["friends","الأصحاب","x:users"]];
  return'<nav class="ox-tabs" id="olTabs">'+L.map(function(t){var ic=t[2]==="u"?IX("user"):t[2].indexOf("o:")===0?IC(t[2].slice(2),1):IX(t[2].slice(2));
    return'<button type="button" class="ox-tab'+(curTab===t[0]?' on':'')+'" onclick="OLX.go(\''+t[0]+'\')">'+ic+'<span>'+t[1]+'</span>'+(t[0]==="friends"&&NREQ?'<i class="ox-dot">'+NREQ+'</i>':'')+'</button>';}).join("")+'</nav>';}
function pre(){var u=U();if(!u||Date.now()-preAt<15000)return;preAt=Date.now();
  D().ref("fr/"+u.uid).once("value").then(function(s){var n=s.numChildren();if(n!==NREQ){NREQ=n;var el=document.getElementById("olTabs");if(el)el.outerHTML=tabs();}},function(){});}
function go(t){curTab=t;if(t==="me")OL.stats();else if(t==="rank")rank();else if(t==="awards")awards();else if(t==="friends")friends();}
function shell(h,t){I.shell(h,{t:t,g:"base"});pre();}

/* ---------- الترتيب ---------- */
function row(r,rk,me){var sub=rf==="all"?GK.map(function(k){return GN[k]+' '+gp(r.x,k);}).join(" · "):'صح '+((r.x.s||{})[rf]||{}).right+' · غلط '+((r.x.s||{})[rf]||{}).wrong+' · جلسات '+((r.x.s||{})[rf]||{}).games;
  return'<div class="ox-row'+(r.id===me?' me':'')+'" onclick="OLX.prof(\''+e(r.id)+'\')"><span class="ox-rk">'+rk+'</span>'+av(r.p,r.id)+'<div class="ox-rw"><b>'+I.nmu(r.id,r.n)+'</b><small>'+e(sub.replace(/undefined/g,"0"))+'</small></div><span class="ox-pts">'+r.v+'</span></div>';}
function pod(r,rk){var c=["","g","s","b"][rk];return'<div class="ox-pc '+c+'" onclick="OLX.prof(\''+e(r.id)+'\')">'+(rk===1?'<i class="ox-cr">'+IX("crown")+'</i>':'')+av(r.p,r.id)+'<span class="ox-pn">'+I.nmu(r.id,r.n)+'</span><b class="ox-pv">'+r.v+'</b><div class="ox-pl"><span>'+rk+'</span></div></div>';}
function rank(f){if(f)rf=f;I.sv("stats");curTab="rank";
  load(function(){if(!alive())return;var R=list(rf),me=U().uid,h=tabs("rank");
    h+='<div class="ox-chips">'+[["all","الكل"],["flags","أعلام"],["story","أنا مين"],["career","انتقالات"]].map(function(c){return'<button type="button" class="ox-chip'+(rf===c[0]?' on':'')+'" onclick="OLX.rf(\''+c[0]+'\')">'+c[1]+'</button>';}).join("")+'</div>';
    if(!R.length)h+='<div class="ox-none">لسه محدش لعب أونلاين. أول واحد يخلّص لعبة هيظهر هنا.</div>';
    else{var top3=R.length>=3;if(top3)h+='<div class="ox-pod">'+pod(R[1],2)+pod(R[0],1)+pod(R[2],3)+'</div>';
      h+='<div class="ox-list">'+R.slice(top3?3:0).map(function(r,i){return row(r,i+(top3?4:1),me);}).join("")+'</div>';
      var mi=R.map(function(r){return r.id;}).indexOf(me);if(mi<0)h+='<div class="ol-hint2">لسه ملعبتش أونلاين، العب لعبة وهتظهر في الترتيب</div>';}
    shell(h,"الترتيب");});}

/* ---------- الجوايز ---------- */
function awards(){I.sv("stats");curTab="awards";
  load(function(){if(!alive())return;var W=winners(),top=W.now[0],h=tabs("awards"),me=U().uid;
    var nm=function(r){var x=LB[r.id]||{};return{n:x.n||"لاعب",p:x.p||""};};
    if(top){var w=nm(top);h+='<div class="ox-hero"><span class="ox-rib">PLAYER OF THE MONTH</span><div class="ox-tr">'+TROPHY+'</div><div class="ox-mo">'+mlabel(W.cur)+'</div>'+av(w.p,top.id,"ox-big")+'<div class="ox-wn">'+I.nmu(top.id,w.n)+'</div><div class="ox-wp">'+top.v+' <small>نقطة</small></div></div>';}
    else h+='<div class="ox-hero off"><span class="ox-rib">PLAYER OF THE MONTH</span><div class="ox-tr">'+TROPHY+'</div><div class="ox-mo">'+mlabel(W.cur)+'</div><div class="ox-wn">لسه محدش جمّع نقط الشهر ده</div></div>';
    h+='<div class="ol-hint2">اللي يجمّع أكتر نقط في الشهر ياخد الجايزة، والترتيب بيتحدّث مع كل لعبة بتخلص.</div>';
    if(W.now.length>1){h+='<h2>'+IC("chart",1)+' سباق الشهر</h2><div class="ox-list">'+W.now.slice(0,5).map(function(r,i){var x=nm(r);return'<div class="ox-row'+(r.id===me?' me':'')+'" onclick="OLX.prof(\''+e(r.id)+'\')"><span class="ox-rk">'+(i+1)+'</span>'+av(x.p,r.id)+'<div class="ox-rw"><b>'+I.nmu(r.id,x.n)+'</b></div><span class="ox-pts">'+r.v+'</span></div>';}).join("")+'</div>';}
    h+='<h2>'+IC("trophy",1)+' قاعة المشاهير</h2>';
    h+=W.past.length?'<div class="ox-list">'+W.past.map(function(p){var x=nm(p.w);return'<div class="ox-row hall" onclick="OLX.prof(\''+e(p.w.id)+'\')">'+IC("trophy",1)+av(x.p,p.w.id)+'<div class="ox-rw"><b>'+I.nmu(p.w.id,x.n)+'</b><small>لاعب شهر '+mlabel(p.k)+'</small></div><span class="ox-pts">'+p.w.v+'</span></div>';}).join("")+'</div>':'<div class="ox-none">لسه مفيش شهور خلصت. أول بطل هيتسجّل أول الشهر الجاي.</div>';
    var a=agg(LB[me]),s=(LB[me]||{}).s||{};
    h+='<h2>'+IC("lock")+' إنجازاتي</h2><div class="ol-bd">'+I.BADGES.map(function(b){var on=b[2](a,s);return'<div class="'+(on?'on':'')+'">'+(on?IC("check"):IC("lock"))+' '+b[0]+'<small>'+b[1]+'</small></div>';}).join("")+'</div>';
    shell(h,"الجوايز");});}

/* ---------- البروفايل (شيت فوق أي شاشة) ---------- */
function sheet(h){var s=document.getElementById("olSheet");if(!s){s=document.createElement("div");s.id="olSheet";s.onclick=function(ev){if(ev.target===s)close();};document.body.appendChild(s);}s.innerHTML=h;}
function close(){var s=document.getElementById("olSheet");if(s)s.remove();profId=null;}
function prof(id,fb){var u=U();if(!u){T("سجّل دخول بجوجل الأول");return;}fb=fb||FB[id];profId=id;
  sheet('<div class="ox-sh"><div class="ox-ld">جاري التحميل…</div></div>');
  load(function(){if(profId!==id)return;
    if(id===u.uid)return pview(id,fb,{});
    Promise.all([D().ref("fl/"+u.uid+"/"+id).once("value"),D().ref("fr/"+id+"/"+u.uid).once("value"),D().ref("fr/"+u.uid+"/"+id).once("value")])
      .then(function(r){if(profId===id)pview(id,fb,{fr:r[0].exists(),sent:r[1].exists(),inc:r[2].exists()});},function(){if(profId===id)pview(id,fb,{err:1});});});}
function pview(id,fb,st){var x=LB[id]||null,u=U(),mine=id===u.uid,n=(x&&x.n)||(fb&&fb.name)||(mine&&u.displayName)||"لاعب",p=(x&&x.p)||(fb&&fb.photo)||(mine&&u.photoURL)||"",a=agg(x),A=awardsOf(id),s=(x&&x.s)||{};
  var mx=Math.max(1,Math.max.apply(null,GK.map(function(k){return gp(x,k);})));
  var gr=GK.map(function(k){var v=gp(x,k);return'<div class="ox-gr"><span>'+GN[k]+'</span><i class="ox-bar"><i style="width:'+Math.max(0,v)/mx*100+'%"></i></i><b>'+v+'</b></div>';}).join("");
  var aw=(A.lead?'<div class="ox-aw lead">'+IX("crown")+'<div><b>متصدّر '+mlabel(A.W.cur)+' دلوقتي</b><small>لو كمّل لآخر الشهر هياخد جايزة لاعب الشهر</small></div></div>':"")+
    A.won.map(function(w){return'<div class="ox-aw">'+IC("trophy",1)+'<div><b>لاعب شهر '+mlabel(w.k)+'</b><small>'+w.w.v+' نقطة في الشهر</small></div></div>';}).join("");
  if(!aw)aw='<div class="ox-none sm">'+(mine?"لسه معاكش جوايز":"معهوش جوايز لسه")+'</div>';
  var ach=I.BADGES.filter(function(b){return b[2](a,s);}).map(function(b){return'<span class="ox-ach">'+IC("check")+' '+b[0]+'</span>';}).join("");
  var act="";
  if(!mine){if(st.err)act='<div class="ox-none sm">مقدرتش أحمّل حالة الصداقة. اتأكد إن الـ Rules اتنشرت</div>';
    else if(st.fr)act='<div class="ox-fr ok">'+IX("users")+' أصحاب</div><button type="button" class="ol-s" onclick="OLX.funf(\''+e(id)+'\')">شيل من الأصحاب</button>';
    else if(st.inc)act='<div class="ox-fr">بعتلك طلب صداقة</div><div class="ol-r"><button type="button" class="ol-b g" onclick="OLX.facc(\''+e(id)+'\')">قبول</button><button type="button" class="ol-b o" onclick="OLX.fdec(\''+e(id)+'\')">رفض</button></div>';
    else if(st.sent)act='<button type="button" class="ol-b o" disabled>طلب الصداقة اتبعت</button><button type="button" class="ol-s" onclick="OLX.fcan(\''+e(id)+'\')">إلغاء الطلب</button>';
    else act='<button type="button" class="ol-b" onclick="OLX.fadd(\''+e(id)+'\')">'+IX("plus")+' ضيف صاحب</button>';}
  sheet('<div class="ox-sh"><i class="ox-grab"></i><button type="button" class="ox-x" onclick="OLX.close()" aria-label="إغلاق">'+IX("close")+'</button>'+
    '<div class="ox-ph">'+av(p,id,"ox-big")+'<b class="ox-nn">'+I.nmu(id,n)+'</b>'+(mine?'<small>ده حسابك</small>':'')+'</div>'+
    '<div class="ox-kp"><div class="m"><b>'+a.pts+'</b><small>نقطة (كل الألعاب)</small></div><div><b>'+a.wins+'</b><small>فوز</small></div><div><b>'+a.games+'</b><small>جلسة</small></div></div>'+
    '<div class="ox-sec">النقط في كل لعبة</div><div class="ox-grs">'+gr+'</div>'+
    '<div class="ox-sec">الجوايز</div>'+aw+(ach?'<div class="ox-achs">'+ach+'</div>':'')+
    '<div class="ox-act">'+act+'</div></div>');}

/* ---------- الأصحاب ---------- */
var FB={};
function frow(id,x,extra){var r=LB[id]||{},n=r.n||x.n||"لاعب",p=r.p||x.p||"";FB[id]={name:n,photo:p};
  return'<div class="ox-row" onclick="OLX.prof(\''+e(id)+'\')">'+av(p,id)+'<div class="ox-rw"><b>'+I.nmu(id,n)+'</b><small>'+agg(r).pts+' نقطة</small></div>'+(extra||"")+'</div>';}
function friends(){I.sv("stats");curTab="friends";
  load(function(){if(!alive())return;var u=U();
    Promise.all([D().ref("fr/"+u.uid).once("value"),D().ref("fl/"+u.uid).once("value")]).then(function(r){
      var inc=r[0].val()||{},fl=r[1].val()||{},ik=Object.keys(inc),fk=Object.keys(fl);NREQ=ik.length;
      var h=tabs("friends");
      if(ik.length)h+='<h2>'+IX("plus")+' طلبات صداقة ('+ik.length+')</h2><div class="ox-list">'+ik.map(function(id){return frow(id,inc[id],'<span class="ox-btns"><button type="button" class="ox-yes" onclick="event.stopPropagation();OLX.facc(\''+e(id)+'\')">قبول</button><button type="button" class="ox-no" onclick="event.stopPropagation();OLX.fdec(\''+e(id)+'\')">'+IX("close")+'</button></span>');}).join("")+'</div>';
      h+='<h2>'+IX("users")+' أصحابي ('+fk.length+')</h2>'+(fk.length?'<div class="ox-list">'+fk.map(function(id){return frow(id,fl[id]);}).join("")+'</div>':'<div class="ox-none">لسه معندكش أصحاب. دوّر على لاعب تحت أو دوس على أي اسم في الترتيب.</div>');
      h+='<h2>'+IX("user")+' دوّر على لاعب</h2><input class="ox-in" id="oxQ" placeholder="اكتب اسم اللاعب" value="'+e(fq)+'" oninput="OLX.srch(this.value)" autocomplete="off"><div id="oxS" class="ox-list"></div>';
      shell(h,"الأصحاب");srch(fq,fl);
    },function(){T("مقدرتش أجيب الأصحاب. اتأكد إن الـ Rules اتنشرت");});});}
var FLC={};
function srch(q,fl){if(fl)FLC=fl;fq=q||"";var el=document.getElementById("oxS");if(!el)return;var me=U().uid,t=fq.trim().toLowerCase();
  if(!t){el.innerHTML='<div class="ox-none sm">اكتب جزء من الاسم</div>';return;}
  var R=Object.keys(LB||{}).filter(function(id){return id!==me&&String((LB[id]||{}).n||"").toLowerCase().indexOf(t)>=0;}).slice(0,15);
  el.innerHTML=R.length?R.map(function(id){var isF=!!FLC[id];return frow(id,{},isF?'<span class="ox-tag">صاحبك</span>':'<span class="ox-btns"><button type="button" class="ox-yes" onclick="event.stopPropagation();OLX.fadd(\''+e(id)+'\')">'+IX("plus")+' ضيف</button></span>');}).join(""):'<div class="ox-none sm">مفيش حد بالاسم ده. اللاعب لازم يكون خلّص لعبة أونلاين</div>';}
function after(){if(profId)prof(profId);if(curTab==="friends"&&alive())friends();}
function fail(){T("معرفتش أنفّذ. اتأكد إن الـ Rules اتنشرت");}
function fadd(id){var u=U();D().ref("fr/"+id+"/"+u.uid).set({n:u.displayName||"لاعب",p:u.photoURL||"",t:Date.now()}).then(function(){T("طلب الصداقة اتبعت");after();},fail);}
function facc(id){var u=U();D().ref("fr/"+u.uid+"/"+id).once("value").then(function(s){var r=s.val();if(!r){T("الطلب مبقاش موجود");return;}
  var up={},now=Date.now();up["fl/"+u.uid+"/"+id]={n:r.n||"لاعب",p:r.p||"",t:now};up["fl/"+id+"/"+u.uid]={n:u.displayName||"لاعب",p:u.photoURL||"",t:now};up["fr/"+u.uid+"/"+id]=null;
  return D().ref().update(up).then(function(){T("بقيتوا أصحاب");});}).then(after,fail);}
function fdec(id){var u=U();D().ref("fr/"+u.uid+"/"+id).remove().then(after,fail);}
function fcan(id){var u=U();D().ref("fr/"+id+"/"+u.uid).remove().then(function(){T("اتلغى الطلب");after();},fail);}
function funf(id){if(!confirm("تشيله من أصحابك؟"))return;var u=U(),up={};up["fl/"+u.uid+"/"+id]=null;up["fl/"+id+"/"+u.uid]=null;D().ref().update(up).then(after,fail);}

/* ---------- اقتراح الأسئلة ---------- */
function sug(k,r){ret=r||null;I.sv("x");F={g:GN[k]?k:"career"};formView();}
function back(){var r=ret;ret=null;if(r)r();else OL.stats();return true;}
function fg(g){F.g=g;formView();}
function formView(){var g=F.g,h='<div class="ox-note">'+IX("pencil")+'<div><b>اقترح سؤال</b><small>املا التفاصيل وهتتبعت للأدمن. لو وافق عليها هتتضاف للعبة.</small></div></div>'+
  '<div class="ox-gs">'+["flags","story","career","crime"].map(function(x){return'<button type="button" class="ox-g'+(g===x?' on':'')+'" onclick="OLX.fg(\''+x+'\')">'+GN[x]+'</button>';}).join("")+'</div><div id="oxF">'+fields(g)+
  '<label class="ox-l">ملاحظات للأدمن <small>(اختياري)</small></label><textarea class="ox-ta" id="oxN" rows="2" maxlength="400" placeholder="مصدر المعلومة أو أي توضيح"></textarea>'+
  '<button type="button" class="ol-b" onclick="OLX.send()">'+IX("send")+' ابعت للأدمن</button></div><div id="oxMine"></div>';
  I.shell(h,{t:"اقتراح سؤال",g:g==="crime"?"crime":g});mine();}
function stopRow(i){return'<div class="ox-stop"><span class="ox-sn">'+i+'</span><div class="ox-sf"><input class="ox-in l ox-club" placeholder="النادي (Club)" maxlength="40"><div class="ox-yrs"><input class="ox-in ox-from" type="number" inputmode="numeric" placeholder="من" min="1950" max="2100"><input class="ox-in ox-to" type="number" inputmode="numeric" placeholder="إلى (فاضي = الآن)" min="1950" max="2100"><label class="ox-lo"><input type="checkbox" class="ox-cb ox-loan"> إعارة</label></div></div><button type="button" class="ox-rm" onclick="OLX.rm(this)" aria-label="شيل">'+IX("close")+'</button></div>';}
function clueRow(i){return'<div class="ox-clue"><small>دليل '+i+'</small><textarea class="ox-ta ox-cl" rows="2" maxlength="300" placeholder="'+(i===1?"أصعب دليل":i===2?"أسهل شوية":"أوضح")+'"></textarea><button type="button" class="ox-rm" onclick="OLX.rm(this)" aria-label="شيل">'+IX("close")+'</button></div>';}
function fields(g){
  if(g==="flags")return'<label class="ox-l">اسم الدولة بالعربي</label><input class="ox-in" id="oxA" maxlength="40" placeholder="مثال: مصر"><label class="ox-l">كود الدولة <small>(حرفين بالإنجليزي)</small></label><div class="ox-flagrow"><input class="ox-in l" id="oxC" maxlength="2" placeholder="EG" oninput="OLX.fp(this)"><div class="ox-fp" id="oxFp"></div></div>';
  if(g==="story")return'<label class="ox-l">اسم اللاعب <small>(بالإنجليزي زي ما في اللعبة)</small></label><input class="ox-in l" id="oxA" maxlength="60" placeholder="Mohamed Salah"><label class="ox-l">الأدلة <small>(من الأصعب للأسهل، 3 على الأقل)</small></label><div id="oxCl">'+clueRow(1)+clueRow(2)+clueRow(3)+'</div><button type="button" class="ol-b o" onclick="OLX.addc()">+ دليل</button>';
  if(g==="career")return'<label class="ox-l">الاسم <small>(بالإنجليزي)</small></label><input class="ox-in l" id="oxA" maxlength="60" placeholder="Mohamed Salah"><div class="ox-seg"><button type="button" class="on" data-t="p" onclick="OLX.seg(this)">لاعب</button><button type="button" data-t="c" onclick="OLX.seg(this)">مدرب</button></div><label class="ox-l">المحطات بالترتيب <small>(3 على الأقل)</small></label><div id="oxSt">'+stopRow(1)+stopRow(2)+stopRow(3)+'</div><button type="button" class="ol-b o" onclick="OLX.adds()">+ محطة</button>';
  return'<label class="ox-l">عنوان القصة</label><input class="ox-in" id="oxA" maxlength="80" placeholder="اسم القضية"><label class="ox-l">التفاصيل <small>(الأحداث والأدوار والأدلة والحل)</small></label><textarea class="ox-ta" id="oxD" rows="10" maxlength="4000" placeholder="اكتب القصة كاملة بالتفصيل"></textarea>';}
function fp(el){el.value=el.value.replace(/[^a-zA-Z]/g,"").toUpperCase();var f=document.getElementById("oxFp");if(f)f.innerHTML=el.value.length===2&&window.flagImgUrl?'<img src="'+e(flagImgUrl(el.value))+'" alt="">':"";}
function renum(sel,cls){var c=document.querySelectorAll(sel+" ."+cls);for(var i=0;i<c.length;i++)c[i].textContent=cls==="ox-sn"?(i+1):"دليل "+(i+1);}
function rm(b){var r=b.parentNode,box=r.parentNode;if(box.children.length<=3){T("3 على الأقل");return;}r.remove();renum("#"+box.id,box.id==="oxSt"?"ox-sn":"ox-clue>small");}
function addc(){var b=document.getElementById("oxCl");if(b.children.length>=8){T("8 أدلة بحد أقصى");return;}b.insertAdjacentHTML("beforeend",clueRow(b.children.length+1));}
function adds(){var b=document.getElementById("oxSt");if(b.children.length>=20){T("كفاية محطات");return;}b.insertAdjacentHTML("beforeend",stopRow(b.children.length+1));}
function seg(b){var all=b.parentNode.children;for(var i=0;i<all.length;i++)all[i].classList.remove("on");b.classList.add("on");}
function send(){var u=U(),g=F.g,A=val("oxA"),d,title=A;
  if(g==="flags"){var c=val("oxC").toUpperCase();if(!A||!/^[A-Z]{2}$/.test(c))return T("اكتب اسم الدولة وكودها (حرفين)");d=[c,A];}
  else if(g==="story"){var cl=[].slice.call(document.querySelectorAll(".ox-cl")).map(function(x){return x.value.trim();}).filter(Boolean);if(!A||cl.length<3)return T("اكتب اسم اللاعب و3 أدلة على الأقل");d={name:A,clues:cl};}
  else if(g==="career"){var st=[].slice.call(document.querySelectorAll(".ox-stop")).map(function(r){var cb=r.querySelector(".ox-club").value.trim(),f=parseInt(r.querySelector(".ox-from").value,10),t=r.querySelector(".ox-to").value.trim(),ln=r.querySelector(".ox-loan").checked;
      if(!cb)return null;if(!(f>=1950&&f<=2100))return"bad";var to=t===""?null:parseInt(t,10);if(to!==null&&!(to>=f&&to<=2100))return"bad";return ln?[cb,f,to,1]:[cb,f,to];}).filter(Boolean);
    if(!A||st.length<3||st.indexOf("bad")>=0)return T("اكتب الاسم و3 محطات صح (سنين من/إلى)");
    var tp=document.querySelector(".ox-seg .on");d={n:A,t:tp?tp.getAttribute("data-t"):"p",c:st};}
  else{var tx=val("oxD");if(!A||tx.length<40)return T("اكتب عنوان وتفاصيل القصة (40 حرف على الأقل)");d={title:A,text:tx};}
  var id=D().ref("qreq").push().key,up={},now=Date.now();
  up["qreq/"+id]={u:u.uid,n:u.displayName||"لاعب",g:g,d:d,note:val("oxN"),t:now,s:"p"};
  up["qres/"+u.uid+"/"+id]={g:g,t:title,s:"p",at:now};
  D().ref().update(up).then(function(){T("اتبعت للأدمن");formView();},function(){T("معرفتش أبعت. اتأكد إن الـ Rules اتنشرت");});}
function mine(){var u=U(),el=document.getElementById("oxMine");if(!el)return;
  D().ref("qres/"+u.uid).once("value").then(function(s){var v=s.val()||{},L=Object.keys(v).map(function(k){return v[k];}).sort(function(a,b){return(b.at||0)-(a.at||0);}).slice(0,8);
    el=document.getElementById("oxMine");if(!el||!L.length)return;
    el.innerHTML='<h2>'+IX("send")+' طلباتي</h2>'+L.map(function(q){var c=q.s==="a"?"a":q.s==="r"?"r":"p";return'<div class="ox-mq"><span class="ox-st s-'+c+'">'+(c==="a"?"اتقبل":c==="r"?"اترفض":"مستني")+'</span><div><b>'+e(q.t||"")+'</b><small>'+(GN[q.g]||"")+(q.r?' · '+e(q.r):'')+'</small></div></div>';}).join("");},function(){});}

/* ---------- طلبات الأسئلة (أدمن) ---------- */
function fmt(g,d){d=d||{};
  if(g==="flags")return'<div class="ox-fm">'+(window.flagImgUrl&&d[0]?'<img src="'+e(flagImgUrl(d[0]))+'" alt="">':'')+'<b>'+e(d[1])+'</b><small dir="ltr">'+e(d[0])+'</small></div>';
  if(g==="story")return'<b>'+e(d.name)+'</b><ol class="ox-cll">'+(d.clues||[]).map(function(c){return'<li>'+e(c)+'</li>';}).join("")+'</ol>';
  if(g==="career")return'<b dir="ltr">'+e(d.n)+'</b> <small>'+(d.t==="c"?"مدرب":"لاعب")+'</small><div class="ox-stl">'+(d.c||[]).map(function(c){return'<div dir="ltr"><span>'+e(c[0])+(c[3]?' <i>loan</i>':'')+'</span><small>'+e(c[1])+' – '+(c[2]==null?"Now":e(c[2]))+'</small></div>';}).join("")+'</div>';
  return'<b>'+e(d.title)+'</b><p class="ox-tx">'+e(d.text)+'</p>';}
function lit(s){return"`"+String(s).replace(/\\/g,"\\\\").replace(/`/g,"\\`").replace(/\$\{/g,"\\${")+"`";}
function srcOf(g,d){if(g==="flags")return JSON.stringify([d[0],d[1]])+",";
  if(g==="story")return"{name:"+lit(d.name)+",clues:[\n"+(d.clues||[]).map(function(c){return"    "+lit(c);}).join(",\n")+"\n  ]},";
  if(g==="career")return'{n:'+JSON.stringify(d.n)+',t:"'+(d.t==="c"?"c":"p")+'",c:['+(d.c||[]).map(function(c){return"["+JSON.stringify(c[0])+","+c[1]+","+(c[2]==null?"null":c[2])+(c[3]?",1":"")+"]";}).join(",")+"]},";
  return d.title+"\n\n"+d.text;}
function queue(){if(!I.adm())return;I.sv("x");ret=function(){OL.stats();};
  D().ref("qreq").once("value").then(function(s){var v=s.val()||{};QL=Object.keys(v).map(function(id){return{id:id,x:v[id]};}).filter(function(r){return!r.x.s||r.x.s==="p";}).sort(function(a,b){return(b.x.t||0)-(a.x.t||0);});qview();},function(){T("مفيش صلاحية. اتأكد إن الـ Rules اتنشرت");});}
function qview(){var h='<div class="ol-w">'+QL.length+' طلب مستني</div>'+(QL.length?QL.map(function(r,i){var x=r.x,dt=x.t?new Date(x.t).toLocaleDateString("ar-EG"):"";
  return'<div class="ox-q"><div class="ox-qh"><span class="ox-gt">'+(GN[x.g]||x.g)+'</span><small>من <b>'+e(x.n||"")+'</b> · '+dt+'</small></div><div class="ox-qb">'+fmt(x.g,x.d)+'</div>'+(x.note?'<div class="ox-qn">'+e(x.note)+'</div>':'')+
    '<div class="ol-r"><button type="button" class="ol-b g" onclick="OLX.qdec('+i+',1)">'+IC("check")+' قبول</button><button type="button" class="ol-b r" onclick="OLX.qdec('+i+',0)">'+IC("x")+' رفض</button></div><button type="button" class="ol-s" onclick="OLX.qcopy('+i+')">نسخ بصيغة ملف الداتا</button>'+(x.g==="crime"?'<div class="ox-hint">قصص الجرايم بتتسجّل بس، ضيفها في الكود بنفسك.</div>':'<div class="ox-hint">لو قبلت، السؤال بيظهر في الأونلاين على طول.</div>')+'</div>';}).join(""):'<div class="ox-none">مفيش طلبات جديدة</div>');
  I.shell(h,{t:"طلبات الأسئلة",g:"base"});}
function qdec(i,ok){var r=QL[i];if(!r)return;var x=r.x,up={},rs="";
  if(!ok){rs=prompt("سبب الرفض (اختياري)");if(rs===null)return;}
  up["qreq/"+r.id+"/s"]=ok?"a":"r";up["qres/"+x.u+"/"+r.id+"/s"]=ok?"a":"r";if(rs)up["qres/"+x.u+"/"+r.id+"/r"]=rs;
  if(ok&&x.g!=="crime")up["qok/"+x.g+"/"+r.id]={d:x.d,by:x.n||"",at:Date.now()};
  D().ref().update(up).then(function(){QL.splice(i,1);T(ok?(x.g==="crime"?"اتقبل":"اتقبل واتضاف للأونلاين"):"اترفض");qview();},function(){T("معرفتش أنفّذ. اتأكد إن الـ Rules اتنشرت");});}
function qcopy(i){var r=QL[i];if(!r)return;var t=srcOf(r.x.g,r.x.d);try{navigator.clipboard.writeText(t).then(function(){T("اتنسخ");},function(){T("مقدرتش أنسخ");});}catch(x){T("مقدرتش أنسخ");}}

/* ---------- ستايل ---------- */
var css=`
#olSheet{--bg:#0a0a0a;--card:#141413;--card2:#1b1a18;--h1:#1b1a18;--h2:#141413;--ln:#2a2927;--ln2:#41403b;--mu:#8d9d95;--mu2:#6c7c74;--ink:#e9efeb;--ac:#d4b675;--acr:212,182,117;--on:#111;--gr:#0d6b50;--gon:#fff;position:fixed;inset:0;z-index:9995;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.66);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);direction:rtl;text-align:right;color:var(--ink);font-family:'IBM Plex Sans Arabic','Tajawal',system-ui,sans-serif;animation:oxF .15s}
#olSheet *{box-sizing:border-box}
.ox-pts,.ox-pv,.ox-wp,.ox-kp b,.ox-gr b{direction:ltr;unicode-bidi:isolate}
@keyframes oxF{from{opacity:0}}@keyframes oxU{from{transform:translateY(40px);opacity:0}}
.ox-sh{position:relative;width:100%;max-width:480px;max-height:92dvh;overflow-y:auto;border-radius:24px 24px 0 0;background:#111110;border:1px solid var(--ln2);border-bottom:0;padding:14px 16px calc(24px + env(safe-area-inset-bottom,0px));animation:oxU .22s cubic-bezier(.2,.8,.2,1)}
.ox-ld{padding:50px 0;text-align:center;color:var(--mu)}
.ox-grab{display:block;width:42px;height:4px;margin:0 auto 12px;border-radius:9px;background:var(--ln2)}
.ox-x{position:absolute;top:12px;inset-inline-start:12px;width:36px;height:36px;border-radius:50%;border:1px solid var(--ln2);background:var(--card);color:var(--mu);display:grid;place-items:center;cursor:pointer}
.ox-ph{display:flex;flex-direction:column;align-items:center;gap:6px;margin:6px 0 14px;text-align:center}
.ox-nn{font-size:21px}.ox-ph small{color:var(--mu)}
.ol-av.ox-big,.ol-ph.ox-big{width:84px;height:84px;border-width:3px}
.ox-kp{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:8px}
.ox-kp>div{padding:12px 6px 10px;text-align:center;border-radius:14px;border:1px solid var(--ln);background:var(--card)}
.ox-kp>.m{border-color:rgba(var(--acr),.5);background:linear-gradient(160deg,var(--h1),var(--h2))}
.ox-kp b{display:block;font:400 34px/1 Anton,Impact,sans-serif;letter-spacing:.04em;color:var(--ac);padding-top:3px}
.ox-kp small{display:block;margin-top:5px;color:var(--mu);font-size:12px}
.ox-sec{margin:18px 2px 8px;color:var(--ac);font-weight:700;font-size:14px}
.ox-grs{padding:12px 14px;border-radius:14px;border:1px solid var(--ln);background:var(--card)}
.ox-gr{display:flex;align-items:center;gap:10px;padding:5px 0;font-size:14px}.ox-gr>span{flex:none;width:70px;color:var(--mu)}
.ox-bar{flex:1;height:7px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden}.ox-bar i{display:block;height:100%;background:var(--ac);border-radius:9px}
.ox-gr b{flex:none;min-width:32px;text-align:left;font:400 20px/1 Anton,sans-serif;color:var(--ink);padding-top:2px}
.ox-aw{display:flex;align-items:center;gap:12px;margin:7px 0;padding:11px 13px;border-radius:14px;border:1px solid rgba(230,194,90,.5);background:linear-gradient(135deg,rgba(230,194,90,.16),rgba(230,194,90,.04));color:#e6c25a}
.ox-aw .ol-i{flex:none;width:26px;height:26px}.ox-aw b{display:block;color:#f6e7b4;font-size:15px}.ox-aw small{display:block;color:#b9a574;font-size:12px;margin-top:1px}
.ox-aw.lead{border-style:dashed}
.ox-none{padding:16px;text-align:center;border-radius:14px;border:1px dashed var(--ln2);color:var(--mu);font-size:14px;line-height:1.7;margin:8px 0}.ox-none.sm{padding:10px;font-size:13px}
.ox-achs{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.ox-ach{padding:4px 10px;border-radius:99px;border:1px solid var(--ln2);color:var(--mu);font-size:12px}.ox-ach .ol-i{color:var(--ac);width:.95em;height:.95em}
.ox-act{margin-top:16px}.ox-act .ol-b{margin:0 0 8px}
.ox-fr{display:flex;align-items:center;justify-content:center;gap:8px;padding:11px;margin-bottom:8px;border-radius:12px;border:1px solid var(--ln2);color:var(--mu);font-weight:600}.ox-fr.ok{border-color:rgba(124,203,155,.5);color:#7ccb9b}
.ox-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:0 0 14px;padding:5px;border-radius:16px;border:1px solid var(--ln);background:rgba(0,0,0,.28)}
.ox-tab{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 2px 7px;border:0;border-radius:12px;background:transparent;color:var(--mu);font:600 12px inherit;font-family:inherit;cursor:pointer}
.ox-tab .ol-i{width:20px;height:20px}.ox-tab.on{background:var(--ac);color:var(--on)}
.ox-dot{position:absolute;top:3px;inset-inline-end:12px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#e0504a;color:#fff;font:700 10px/17px sans-serif;text-align:center;font-style:normal}
.ox-chips{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0 0 14px}
.ox-chip{min-height:38px;border-radius:99px;border:1px solid var(--ln2);background:transparent;color:var(--mu);font:600 13px inherit;font-family:inherit;cursor:pointer}.ox-chip.on{background:var(--ac);color:var(--on);border-color:var(--ac)}
.ox-pod{display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:8px;align-items:end;margin:6px 0 14px}
.ox-pc{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;min-width:0}
.ox-pc .ol-av,.ox-pc .ol-ph{width:54px;height:54px;border-width:2px}.ox-pc.g .ol-av,.ox-pc.g .ol-ph{width:70px;height:70px}
.ox-pc.g .ol-av{border-color:#e6c25a;box-shadow:0 0 0 3px rgba(230,194,90,.22)}.ox-pc.s .ol-av{border-color:#c3ccd5}.ox-pc.b .ol-av{border-color:#c98a55}
.ox-cr{color:#e6c25a;line-height:0}.ox-cr .ol-i{width:24px;height:24px}
.ox-pn{display:block;max-width:100%;text-align:center;font-size:13px;font-weight:700;line-height:1.5;word-break:break-word}
.ox-pv{font:400 26px/1 Anton,Impact,sans-serif;letter-spacing:.04em;color:var(--ac);padding-top:3px}
.ox-pl{width:100%;display:grid;place-items:center;border-radius:12px 12px 4px 4px;border:1px solid var(--ln2);background:linear-gradient(180deg,var(--card2),var(--card));font:400 30px/1 Anton,sans-serif;color:var(--mu)}
.ox-pc.g .ox-pl{height:84px;border-color:rgba(230,194,90,.6);color:#e6c25a;background:linear-gradient(180deg,rgba(230,194,90,.2),var(--card))}.ox-pc.s .ox-pl{height:62px;color:#c3ccd5}.ox-pc.b .ox-pl{height:46px;color:#c98a55}
.ox-pl span{padding-top:4px}
.ox-list{margin:0 0 6px}
.ox-row{display:flex;align-items:center;gap:10px;padding:10px 12px;margin:7px 0;border-radius:14px;border:1px solid var(--ln);background:var(--card);cursor:pointer}
.ox-row:active{transform:scale(.985)}.ox-row.me{border-color:var(--ac);box-shadow:0 0 0 1px rgba(var(--acr),.25)}
.ox-row .ol-av,.ox-row .ol-ph{width:40px;height:40px;flex:none}
.ox-rk{flex:none;width:28px;text-align:center;font:400 20px/1 Anton,sans-serif;color:var(--mu);padding-top:3px}
.ox-rw{flex:1;min-width:0}.ox-rw b{display:block;font-size:15px}.ox-rw small{display:block;color:var(--mu);font-size:11.5px;margin-top:2px;line-height:1.5}
.ox-pts{flex:none;font:400 24px/1 Anton,Impact,sans-serif;color:var(--ac);letter-spacing:.03em;padding-top:3px}
.ox-row.hall>.ol-i{flex:none;width:24px;height:24px;color:#e6c25a}
.ox-btns{flex:none;display:flex;gap:6px}
.ox-yes,.ox-no{min-height:36px;padding:0 12px;border-radius:10px;border:1px solid var(--ln2);background:transparent;color:var(--ink);font:600 13px inherit;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
.ox-yes{background:var(--ac);color:var(--on);border-color:var(--ac)}.ox-no{padding:0 10px;color:var(--mu)}
.ox-tag{flex:none;padding:3px 10px;border-radius:99px;border:1px solid rgba(124,203,155,.5);color:#7ccb9b;font-size:12px}
.ox-hero{position:relative;overflow:hidden;text-align:center;padding:20px 16px 20px;border-radius:22px;border:1px solid rgba(230,194,90,.55);background:radial-gradient(ellipse at 50% 0%,rgba(230,194,90,.24),transparent 65%),linear-gradient(170deg,#241d0c,#0f0d07);box-shadow:0 14px 34px rgba(0,0,0,.5)}
.ox-hero:before{content:"";position:absolute;inset:6px;border-radius:17px;border:1px solid rgba(230,194,90,.25);pointer-events:none}
.ox-hero>*{position:relative}
.ox-rib{display:inline-block;padding:6px 16px 3px;border-radius:4px;background:linear-gradient(135deg,#f6e3a1,#c9992f);color:#2a1d02;font:400 13px/1.3 Anton,Impact,sans-serif;letter-spacing:.2em}
.ox-tr svg{width:116px;height:auto;margin:10px auto 0;display:block;filter:drop-shadow(0 8px 14px rgba(230,194,90,.35))}
.ox-mo{margin:6px 0 10px;color:#f3e6c4;font-weight:700;font-size:15px}
.ox-hero .ol-av,.ox-hero .ol-ph{display:block;margin:0 auto;width:84px;height:84px;border:3px solid #e6c25a;box-shadow:0 0 0 4px rgba(230,194,90,.2)}
.ox-wn{margin-top:10px;font-size:22px;font-weight:800;color:#fff}
.ox-wp{margin-top:2px;font:400 28px/1.2 Anton,Impact,sans-serif;color:#e6c25a;letter-spacing:.06em}.ox-wp small{font:600 13px sans-serif;letter-spacing:0;color:#b9a574}
.ox-hero.off .ox-tr svg{filter:grayscale(1) opacity(.35)}.ox-hero.off .ox-wn{font-size:16px;color:#b9a574;font-weight:600}
.ox-note{display:flex;gap:12px;align-items:center;margin:0 0 14px;padding:12px 14px;border-radius:14px;border:1px dashed rgba(var(--acr),.5);background:rgba(0,0,0,.22)}
.ox-note .ol-i{flex:none;width:26px;height:26px;color:var(--ac)}.ox-note b{display:block;font-size:16px}.ox-note small{display:block;color:var(--mu);font-size:12.5px;margin-top:2px;line-height:1.5}
.ox-gs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0 0 12px}
.ox-g{min-height:40px;border-radius:12px;border:1px solid var(--ln2);background:transparent;color:var(--mu);font:600 12.5px inherit;font-family:inherit;cursor:pointer}.ox-g.on{background:var(--ac);color:var(--on);border-color:var(--ac)}
.ox-l{display:block;margin:14px 2px 6px;color:var(--ink);font-weight:700;font-size:14px}.ox-l small{color:var(--mu);font-weight:400}
#olRoot input.ox-in,.ox-ta{display:block;width:100%;min-height:46px;padding:11px 13px;border-radius:12px;border:1px dashed rgba(var(--acr),.5);background:rgba(0,0,0,.28);color:var(--ink);font:500 16px/1.5 inherit;font-family:inherit;letter-spacing:0;text-indent:0;text-align:right;direction:rtl;outline:none}
#olRoot input.ox-in.l{direction:ltr;text-align:left}
#olRoot input.ox-in::placeholder,.ox-ta::placeholder{color:var(--mu2);letter-spacing:0;font-size:14px}
#olRoot input.ox-in:focus,.ox-ta:focus{border-style:solid;border-color:var(--ac)}
.ox-ta{resize:vertical;min-height:70px}
.ox-flagrow{display:flex;gap:10px;align-items:center}#olRoot .ox-flagrow input{width:110px;flex:none;text-align:center;letter-spacing:.2em;font-family:Anton,Impact,sans-serif;font-size:22px}
.ox-fp{flex:1;min-height:46px;display:grid;place-items:center}.ox-fp img{max-height:46px;border-radius:4px;border:1px solid rgba(255,255,255,.2)}
.ox-clue{position:relative;margin:0 0 8px}.ox-clue small{display:block;color:var(--ac);font-size:12px;font-weight:700;margin:0 2px 4px}
.ox-rm{position:absolute;top:0;inset-inline-start:0;width:32px;height:32px;border-radius:50%;border:0;background:transparent;color:var(--mu2);display:grid;place-items:center;cursor:pointer}
.ox-stop{position:relative;display:flex;gap:10px;margin:0 0 10px;padding:10px;border-radius:14px;border:1px solid var(--ln);background:var(--card)}
.ox-stop .ox-rm,.ox-clue .ox-rm{inset-inline-start:auto;inset-inline-end:2px;top:4px}.ox-clue .ox-rm{top:-4px}
.ox-sn{flex:none;width:26px;height:26px;border-radius:4px;display:grid;place-items:center;background:var(--ac);color:var(--on);font:700 12px/1 ui-monospace,monospace}
.ox-sf{flex:1;min-width:0;padding-inline-end:26px}
.ox-yrs{display:grid;grid-template-columns:1fr 1.4fr;gap:6px;margin-top:6px}
#olRoot .ox-yrs input.ox-in{text-align:center;font-size:14px;padding:9px 6px}
.ox-lo{grid-column:1/-1;display:flex;align-items:center;gap:8px;color:var(--mu);font-size:13px}
#olRoot input.ox-cb{width:20px;height:20px;min-height:0;padding:0;flex:none;accent-color:var(--ac)}
.ox-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:14px 0 0}.ox-seg button{min-height:40px;border-radius:12px;border:1px solid var(--ln2);background:transparent;color:var(--mu);font:600 14px inherit;font-family:inherit;cursor:pointer}.ox-seg .on{background:var(--ac);color:var(--on);border-color:var(--ac)}
#oxF .ol-b{margin-top:12px}
.ox-mq{display:flex;align-items:center;gap:10px;margin:7px 0;padding:10px 12px;border-radius:12px;border:1px solid var(--ln);background:var(--card)}.ox-mq b{display:block;font-size:14px}.ox-mq small{color:var(--mu);font-size:12px}
.ox-st{flex:none;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;border:1px solid var(--ln2);color:var(--mu)}.ox-st.s-a{color:#7ccb9b;border-color:rgba(124,203,155,.5)}.ox-st.s-r{color:#ff8a80;border-color:rgba(255,138,128,.5)}
.ox-q{margin:12px 0;padding:14px;border-radius:16px;border:1px solid var(--ln2);background:var(--card)}
.ox-qh{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.ox-qh small{color:var(--mu);font-size:12px}
.ox-gt{padding:3px 11px;border-radius:99px;background:var(--ac);color:var(--on);font-size:12px;font-weight:700}
.ox-qb{padding:12px;border-radius:12px;background:rgba(0,0,0,.3);border:1px dashed var(--ln2);line-height:1.8;font-size:14px}
.ox-qn{margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(var(--acr),.08);color:var(--mu);font-size:13px}
.ox-fm{display:flex;align-items:center;gap:12px}.ox-fm img{height:40px;border-radius:4px;border:1px solid rgba(255,255,255,.2)}
.ox-cll{margin:6px 0 0;padding-inline-start:20px}.ox-cll li{margin:4px 0}
.ox-stl>div{display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px dashed var(--ln)}.ox-stl small{color:var(--mu)}.ox-stl i{font-size:11px;color:var(--ac)}
.ox-tx{margin:6px 0 0;white-space:pre-wrap}
.ox-q .ol-r{margin-top:12px}.ox-hint{margin-top:8px;color:var(--mu2);font-size:12px;text-align:center}
`;
var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

window.OLX={tabs:tabs,pre:pre,go:go,rank:rank,rf:function(f){rank(f);},awards:awards,friends:friends,prof:prof,close:close,
  fadd:fadd,facc:facc,fdec:fdec,fcan:fcan,funf:funf,srch:srch,sug:sug,back:back,fg:fg,fp:fp,rm:rm,addc:addc,adds:adds,seg:seg,send:send,
  queue:queue,qdec:qdec,qcopy:qcopy};
})();
