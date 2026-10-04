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
setInterval(function(){if(inRoom()){lock();hook();if(offline)show(true);}else{unlock();show(false);}},700);
document.addEventListener("visibilitychange",function(){if(!document.hidden&&inRoom())lock();});

var q=null,c=null,fromLink=false;
try{q=new URLSearchParams(location.search).get("room");}catch(x){}
if(q&&/^\d{4}$/.test(q)){c=q;fromLink=true;try{history.replaceState(null,"",location.pathname);}catch(x){}}
if(!c){try{var s=JSON.parse(localStorage.getItem("pp_room")||"null");if(s&&s.c&&Date.now()-s.t<10800000)c=s.c;}catch(x){}}
if(c){var n=0,t=setInterval(function(){
  if(++n>150){clearInterval(t);return;}
  if(!window.ppUser||!window.OL||!OL.rejoin)return;
  clearInterval(t);if(!inRoom())OL.rejoin(c);},700);
  if(fromLink)setTimeout(function(){if(!window.ppUser)try{toast("سجّل دخول بجوجل وهتدخل الغرفة لوحدك");}catch(x){}},2500);}
})();
