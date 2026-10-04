/* فحص الأونلاين (للأدمن بس): بيجرّب على Firebase الحقيقي بحسابك نفس العمليات اللي اللعبة بتعملها، ويمسح كل اللي عمله. */
(function(){
var U=function(){return window.ppUser;},I=function(n){return'<i class="ol-i" style="--ic:var(--i-'+n+')"></i>';};
var e=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var R=[],busy=false;
function draw(done){var ok=R.filter(function(x){return x.ok;}).length;
  OL.shell('<div class="ol-w">'+(done?ok+" من "+R.length+" عدّوا":"بيجري الفحص…")+'</div>'+R.map(function(x){return'<div class="ol-t"><div style="min-width:0"><b style="display:block">'+e(x.n)+'</b>'+(x.m?'<small dir="ltr" style="display:block;color:'+(x.ok?'#8d9d95':'#e07a7a')+'">'+e(x.m)+'</small>':'')+'</div><span>'+I(x.ok?'check':'x')+'</span></div>';}).join("")+
  (done?'<button type="button" class="ol-b" onclick="OLT.run()">افحص تاني</button><button type="button" class="ol-b o" onclick="OLT.copy()">انسخ التقرير</button>':''),{t:"فحص الأونلاين"});}
function run(){if(busy)return;busy=true;R=[];var u=U(),db=firebase.database(),db2=null,p=null,c=null,need=false,chain=Promise.resolve();
  function add(n,ok,m){R.push({n:n,ok:ok,m:m||""});draw(false);}
  function S(n,fn,deny,pl){chain=chain.then(function(){if(pl&&!p)return;if(need&&!c){add(n,false,"الغرفة ماتفتحتش");return;}
    return Promise.resolve().then(fn).then(function(m){add(n,!deny,deny?"اتسمح وهو المفروض يترفض":(typeof m==="string"?m:""));},function(x){add(n,!!deny,deny?"اترفض زي المتوقع":(x&&(x.code||x.message))||"فشل");});});}
  var H=function(q){return q?db.ref(q):db.ref();},P=function(q){return db2.ref(q);},must=function(s){if(!s.exists())throw new Error("فاضي");};
  var cr=function(){return"rooms/"+c+"/crew/"+p.uid;},T1={name:"t",photo:""};
  S("الاتصال بالسيرفر",function(){return new Promise(function(res,rej){var r=H(".info/connected"),d=false,h=r.on("value",function(s){if(s.val()&&!d){d=true;r.off("value",h);res();}});setTimeout(function(){if(!d){r.off("value",h);rej(new Error("مفيش اتصال بعد 8 ثواني"));}},8000);});});
  S("سرعة الاتصال",function(){var t=Date.now();return H("badges").once("value").then(function(){var ms=Date.now()-t;if(ms>2500)throw new Error(ms+" ms (بطيء)");return ms+" ms";});});
  S("لاعب تجريبي (Anonymous) للاختبارات",function(){var app;try{app=firebase.app("pp-test");}catch(x){app=firebase.initializeApp(firebase.app().options,"pp-test");}
    return app.auth().signInAnonymously().then(function(r){p=r.user;db2=app.database();return"uid "+p.uid.slice(0,6);},function(x){throw new Error(x&&x.code==="auth/operation-not-allowed"?"فعّل Anonymous: Firebase ← Authentication ← Sign-in method":(x&&x.code)||"فشل");});});
  S("فتح غرفة جديدة بكود محجوز",function(){return new Promise(function(res,rej){OL.mk({host:u.uid,hostName:"test",game:"selftest",status:"lobby",created:Date.now()},function(err,k){if(err)return rej(err);c=k;res("كود "+k);},true);});});
  chain=chain.then(function(){need=true;});
  S("الـ host يقرا الغرفة",function(){return H("rooms/"+c).once("value").then(function(s){if((s.val()||{}).host!==u.uid)throw new Error("الـ host مش مظبوط");});});
  S("لاعب يدخل خانة a",function(){return P("rooms/"+c+"/players/a").set({uid:p.uid,name:"t",photo:""});},0,1);
  S("نفس اللاعب في خانة b (لازم يترفض)",function(){return P("rooms/"+c+"/players/b").set({uid:p.uid,name:"t",photo:""});},1,1);
  S("لاعب يغيّر حالة الغرفة (لازم يترفض)",function(){return P("rooms/"+c+"/status").set("end");},1,1);
  S("اللاعب يدوس «جاوب» ياخد الحق",function(){return P("rooms/"+c+"/buzz").transaction(function(x){return x?undefined:{uid:p.uid,name:"t",t:Date.now()};}).then(function(r){if(!r.committed)throw new Error("مخدش الحق");});},0,1);
  S("تاني واحد يدوس (لازم ما ياخدش الحق)",function(){return H("rooms/"+c+"/buzz").transaction(function(x){return x?undefined:{uid:u.uid};}).then(function(r){if(r.committed)throw new Error("اتسمح لاتنين");});});
  S("لاعب يكتب فوق الدوسة (لازم يترفض)",function(){return P("rooms/"+c+"/buzz").set({uid:p.uid,t:1});},1,1);
  S("الـ host يصفّر الدوسة ويحدّث النقاط",function(){return H("rooms/"+c).update({buzz:null,"scores/x":{pts:1,right:1,wrong:0},"locked/x":true,step:1});});
  S("لاعب جريمة يدخل (crew)",function(){return P(cr()).set(T1);},0,1);
  S("لاعب يدخّل حد تاني في crew (لازم يترفض)",function(){return P("rooms/"+c+"/crew/"+u.uid).set(T1);},1,1);
  S("توزيع الأدوار السرية",function(){var d={};d["secrets/"+c+"/"+u.uid]={role:"h"};if(p){d["secrets/"+c+"/"+p.uid]={role:"t",killer:false};d["rooms/"+c+"/cast/"+p.uid]={alive:true};}d["rooms/"+c+"/status"]="play";return H().update(d);});
  S("الـ host يقرا كل الأسرار",function(){return H("secrets/"+c).once("value").then(must);});
  S("اللاعب يقرا سره",function(){return P("secrets/"+c+"/"+p.uid).once("value").then(must);},0,1);
  S("لاعب يقرا سر غيره (لازم يترفض)",function(){return P("secrets/"+c+"/"+u.uid).once("value");},1,1);
  S("لاعب يقرا كل الأسرار (لازم يترفض)",function(){return P("secrets/"+c).once("value");},1,1);
  S("رجوع لاعب قديم بعد ريلود",function(){return P(cr()).set(T1);},0,1);
  S("لاعب جديد يدخل في نص اللعبة (لازم يترفض)",function(){return P(cr()).remove().then(function(){return P(cr()).set(T1);});},1,1);
  S("الـ host يفتح تصويت",function(){return H("rooms/"+c).update({vote:"v1",vc:1});});
  S("لاعب حي يصوّت",function(){return P("votes/"+c+"/v1/"+p.uid).set(p.uid);},0,1);
  S("صوت تاني من نفس اللاعب (لازم يترفض)",function(){return P("votes/"+c+"/v1/"+p.uid).set("zz");},1,1);
  S("لاعب يقرا الأصوات (لازم يترفض)",function(){return P("votes/"+c+"/v1").once("value");},1,1);
  S("الـ host يقرا الأصوات",function(){return H("votes/"+c+"/v1").once("value").then(must);},0,1);
  S("الـ host يقصي اللاعب ويفتح تصويت جديد",function(){var d={vote:"v2"};d["cast/"+p.uid+"/alive"]=false;return H("rooms/"+c).update(d);},0,1);
  S("لاعب مقصي يصوّت (لازم يترفض)",function(){return P("votes/"+c+"/v2/"+p.uid).set(p.uid);},1,1);
  S("حفظ بيانات الحساب",function(){var r=H("users/"+u.uid+"/selftest");return r.set(Date.now()).then(function(){return r.remove();});});
  S("لاعب يكتب في بيانات حساب غيره (لازم يترفض)",function(){return P("users/"+u.uid+"/selftest").set(1);},1,1);
  S("مسح الغرفة بالترتيب الصح",function(){return H("secrets/"+c).remove().then(function(){return H("votes/"+c).remove();}).then(function(){return H("rooms/"+c).remove();}).then(function(){return H("rooms/"+c).once("value");}).then(function(s){if(s.exists())throw new Error("الغرفة لسه موجودة");});});
  chain=chain.then(function(){need=false;});
  S("مسح اللاعب التجريبي",function(){return p.delete().then(function(){return firebase.app("pp-test").delete();});},0,1);
  S("كاش الموقع (Service Worker)",function(){if(!navigator.serviceWorker||!navigator.serviceWorker.controller)throw new Error("لسه مش شغال، افتح الموقع مرتين");});
  S("قفل الشاشة",function(){if(!navigator.wakeLock)throw new Error("المتصفح مش بيدعمه");});
  chain.then(function(){busy=false;draw(true);});}
function copy(){try{navigator.clipboard.writeText(R.map(function(x){return(x.ok?"OK   ":"FAIL ")+x.n+(x.m?" — "+x.m:"");}).join("\n")).then(function(){try{toast("اتنسخ التقرير");}catch(x){}});}catch(x){}}
window.OLT={run:run,copy:copy};
})();
