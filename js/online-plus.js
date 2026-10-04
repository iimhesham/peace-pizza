/* تحسينات الأونلاين (من غير أي تغيير في الشكل): قفل الشاشة، شريط انقطاع النت، الدخول بلينك ?room= والرجوع للغرفة بعد ريلود. */
(function(){
var wl=null,bar=null,hooked=false,offline=false;
function inRoom(){return !!document.getElementById("olRoot");}
function lock(){try{if(navigator.wakeLock&&!wl)navigator.wakeLock.request("screen").then(function(l){wl=l;l.addEventListener("release",function(){wl=null;});}).catch(function(){});}catch(x){}}
function unlock(){try{if(wl)wl.release();}catch(x){}wl=null;}
function show(on){var r=document.getElementById("olRoot");
  if(!bar){bar=document.createElement("div");bar.setAttribute("role","status");bar.textContent="النت قطع… بحاول أرجّع الاتصال";
    bar.style.cssText="position:fixed;top:0;right:0;left:0;z-index:9999;padding:6px 12px;padding-top:calc(6px + env(safe-area-inset-top,0px));background:#a02b2b;color:#fff;text-align:center;font:600 13px 'IBM Plex Sans Arabic','Tajawal',sans-serif;direction:rtl";}
  if(on&&r){if(bar.parentNode!==r)r.appendChild(bar);}else if(bar.parentNode)bar.parentNode.removeChild(bar);}
function hook(){if(hooked||!window.firebase||!firebase.apps||!firebase.apps.length||!firebase.database)return;hooked=true;var t;
  firebase.database().ref(".info/connected").on("value",function(s){clearTimeout(t);if(s.val()){offline=false;show(false);}else t=setTimeout(function(){offline=true;},2500);});}
var pre=false;
setInterval(function(){if(window.ppUser&&!pre&&window.firebase&&!firebase.database){pre=true;var s=document.createElement("script");s.src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js";document.head.appendChild(s);}
  if(inRoom()){lock();hook();if(offline)show(true);}else{unlock();show(false);}},1000);
document.addEventListener("visibilitychange",function(){if(!document.hidden&&inRoom())lock();});

var q=null,c=null,fromLink=false;
try{q=new URLSearchParams(location.search).get("room");}catch(x){}
if(q&&/^\d{4}$/.test(q)){c=q;fromLink=true;try{localStorage.setItem("pp_room",JSON.stringify({c:q,t:Date.now()}));}catch(x){}try{history.replaceState(null,"",location.pathname);}catch(x){}}
if(!c){try{var s=JSON.parse(localStorage.getItem("pp_room")||"null");if(s&&s.c&&Date.now()-s.t<10800000)c=s.c;}catch(x){}}
if(c){var n=0,t=setInterval(function(){
  if(++n>150){clearInterval(t);return;}
  if(!window.ppUser||!window.OL||!OL.rejoin)return;
  clearInterval(t);if(!inRoom())OL.rejoin(c);},700);
  if(fromLink)setTimeout(function(){if(!window.ppUser)try{toast("سجّل دخول بجوجل وهتدخل الغرفة لوحدك");}catch(x){}},2500);}

/* لمسة اهتزاز على «جاوب!» (من غير أي تغيير في الشكل) + الدخول أوتوماتيك أول ما الكود يكمل 4 أرقام */
var n2=0,t2=setInterval(function(){if(++n2>120){clearInterval(t2);return;}if(!window.OL||!OL.buzz)return;clearInterval(t2);var ob=OL.buzz;
  OL.buzz=function(){try{navigator.vibrate&&navigator.vibrate(35);}catch(x){}return ob.apply(this,arguments);};},500);
document.addEventListener("input",function(ev){var i=ev.target;if(!i||i.id!=="olCode")return;i.value=i.value.replace(/\D/g,"").slice(0,4);if(i.value.length===4&&window.OL)OL.join();});
})();
