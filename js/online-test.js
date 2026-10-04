/* فحص الأونلاين (للأدمن بس): بيجرّب على Firebase الحقيقي بحسابك نفس العمليات اللي اللعبة بتعملها، ويمسح كل اللي عمله. */
(function(){
var U=function(){return window.ppUser;},I=function(n){return'<i class="ol-i" style="--ic:var(--i-'+n+')"></i>';};
var e=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var R=[],busy=false;
function draw(done){var ok=R.filter(function(x){return x.ok;}).length;
  OL.shell('<div class="ol-w">'+(done?ok+" من "+R.length+" عدّوا":"بيجري الفحص…")+'</div>'+R.map(function(x){return'<div class="ol-t"><div style="min-width:0"><b style="display:block">'+e(x.n)+'</b>'+(x.m?'<small dir="ltr" style="display:block;color:'+(x.ok?'#8d9d95':'#e07a7a')+'">'+e(x.m)+'</small>':'')+'</div><span>'+I(x.ok?'check':'x')+'</span></div>';}).join("")+
  (done?'<button type="button" class="ol-b" onclick="OLT.run()">افحص تاني</button><button type="button" class="ol-b o" onclick="OLT.copy()">انسخ التقرير</button>':''),{t:"فحص الأونلاين"});}
function run(){if(busy)return;busy=true;R=[];var u=U(),db=firebase.database(),c=null,need=false,chain=Promise.resolve();
  function add(n,ok,m){R.push({n:n,ok:ok,m:m||""});draw(false);}
  function S(n,fn,deny){chain=chain.then(function(){if(need&&!c){add(n,false,"الغرفة ماتفتحتش");return;}
    return Promise.resolve().then(fn).then(function(m){add(n,!deny,deny?"اتسمح وهو المفروض يترفض":(typeof m==="string"?m:""));},function(x){add(n,!!deny,deny?"اترفض زي المتوقع":(x&&(x.code||x.message))||"فشل");});});}
  var rf=function(p){return db.ref(p);},must=function(s){if(!s.exists())throw new Error("فاضي");};
  S("الاتصال بالسيرفر",function(){return new Promise(function(res,rej){var r=rf(".info/connected"),d=false,h=r.on("value",function(s){if(s.val()&&!d){d=true;r.off("value",h);res();}});setTimeout(function(){if(!d){r.off("value",h);rej(new Error("مفيش اتصال بعد 8 ثواني"));}},8000);});});
  S("سرعة الاتصال",function(){var t=Date.now();return rf("badges").once("value").then(function(){var ms=Date.now()-t;if(ms>2500)throw new Error(ms+" ms (بطيء)");return ms+" ms";});});
  S("فتح غرفة جديدة بكود محجوز",function(){return new Promise(function(res,rej){OL.mk({host:u.uid,hostName:"test",game:"selftest",status:"lobby",created:Date.now()},function(err,k){if(err)return rej(err);c=k;res("كود "+k);},true);});});
  chain=chain.then(function(){need=true;});
  S("قراءة الغرفة",function(){return rf("rooms/"+c).once("value").then(function(s){if((s.val()||{}).host!==u.uid)throw new Error("الـ host مش مظبوط");});});
  S("دخول لاعب جريمة (crew)",function(){return rf("rooms/"+c+"/crew/"+u.uid).set({name:"t",photo:""});});
  S("دخول خانة لاعب",function(){return rf("rooms/"+c+"/players/a").set({uid:u.uid,name:"t",photo:""});});
  S("نفس الحساب في خانتين (لازم يترفض)",function(){return rf("rooms/"+c+"/players/b").set({uid:u.uid,name:"t",photo:""});},true);
  S("أول واحد يدوس «جاوب» ياخد الحق",function(){return rf("rooms/"+c+"/buzz").transaction(function(x){return x?undefined:{uid:u.uid,name:"t",t:Date.now()};}).then(function(r){if(!r.committed)throw new Error("مخدش الحق");});});
  S("تاني واحد يدوس (لازم ما ياخدش الحق)",function(){return rf("rooms/"+c+"/buzz").transaction(function(x){return x?undefined:{uid:u.uid};}).then(function(r){if(r.committed)throw new Error("اتسمح لاتنين");});});
  S("الـ host يصفّر الدوسة ويحدّث النقاط",function(){return rf("rooms/"+c).update({buzz:null,"scores/x":{pts:1,right:1,wrong:0},"locked/x":true,step:1});});
  S("توزيع الأدوار السرية",function(){var p={};p["secrets/"+c+"/"+u.uid]={role:"t",killer:false};p["rooms/"+c+"/status"]="play";p["rooms/"+c+"/cast/"+u.uid]={alive:true};return rf("").update(p);});
  S("الـ host يقرا كل الأسرار",function(){return rf("secrets/"+c).once("value").then(must);});
  S("اللاعب يقرا سره",function(){return rf("secrets/"+c+"/"+u.uid).once("value").then(must);});
  S("رجوع لاعب قديم بعد ريلود (crew)",function(){return rf("rooms/"+c+"/crew/"+u.uid).set({name:"t",photo:""});});
  S("فتح تصويت وصوت لاعب حي",function(){return rf("rooms/"+c).update({vote:"v1",vc:1}).then(function(){return rf("votes/"+c+"/v1/"+u.uid).set(u.uid);});});
  S("صوت تاني من نفس الحساب (لازم يترفض)",function(){return rf("votes/"+c+"/v1/"+u.uid).set("zz");},true);
  S("الـ host يقرا الأصوات",function(){return rf("votes/"+c+"/v1").once("value").then(must);});
  S("لاعب مقصي يصوّت (لازم يترفض)",function(){var d={vote:"v2"};d["cast/"+u.uid+"/alive"]=false;return rf("rooms/"+c).update(d).then(function(){return rf("votes/"+c+"/v2/"+u.uid).set(u.uid);});},true);
  S("حفظ بيانات الحساب",function(){var r=rf("users/"+u.uid+"/selftest");return r.set(Date.now()).then(function(){return r.remove();});});
  S("مسح الغرفة بالترتيب الصح",function(){return rf("secrets/"+c).remove().then(function(){return rf("votes/"+c).remove();}).then(function(){return rf("rooms/"+c).remove();}).then(function(){return rf("rooms/"+c).once("value");}).then(function(s){if(s.exists())throw new Error("الغرفة لسه موجودة");});});
  chain=chain.then(function(){need=false;});
  S("كاش الموقع (Service Worker)",function(){if(!navigator.serviceWorker||!navigator.serviceWorker.controller)throw new Error("لسه مش شغال، افتح الموقع مرتين");});
  S("قفل الشاشة",function(){if(!navigator.wakeLock)throw new Error("المتصفح مش بيدعمه");});
  chain.then(function(){busy=false;draw(true);});}
function copy(){try{navigator.clipboard.writeText(R.map(function(x){return(x.ok?"OK   ":"FAIL ")+x.n+(x.m?" — "+x.m:"");}).join("\n")).then(function(){try{toast("اتنسخ التقرير");}catch(x){}});}catch(x){}}
window.OLT={run:run,copy:copy};
})();
