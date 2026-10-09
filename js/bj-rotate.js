/* =========================================================
   Blackjack — زرار تدوير الشاشة (landscape).
   1) بيحاول fullscreen + screen.orientation.lock("landscape") (أندرويد/كروم/بريف).
   2) لو المتصفح رفض (آيفون مثلًا) بيلف الصفحة 90° بالـ CSS.
   3) أي وقت الموبايل نفسه يتلف عرضي والطاولة ظاهرة، التخطيط الأفقي بيتفعل لوحده.
   الحالة بتتفك لوحدها لما تخرج من البلاك جاك.
========================================================= */
(function(){
"use strict";
var H=document.documentElement,want=false,forced=false,fsOn=false;
function shown(){
  var b=document.getElementById("blackjack");
  if(b&&!b.classList.contains("hidden"))return true;
  var o=document.getElementById("olRoot");
  return !!(o&&o.getAttribute("data-g")==="blackjack"&&o.children.length&&getComputedStyle(o).display!=="none"&&!o.classList.contains("hidden"));
}
function apply(){
  var vis=shown();
  if(!vis&&(want||forced)){release();}
  var land=vis&&(forced||window.innerWidth>window.innerHeight*1.1);
  H.classList.toggle("bj-land",land);
  H.classList.toggle("bj-rot",vis&&forced);
  var bs=document.querySelectorAll(".bj-rotbtn");for(var i=0;i<bs.length;i++)bs[i].classList.toggle("on",vis&&(want||land));
}
function release(){
  want=false;forced=false;
  try{if(screen.orientation&&screen.orientation.unlock)screen.orientation.unlock();}catch(e){}
  try{if(fsOn&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen();}catch(e){}
  fsOn=false;
}
function turnOn(){
  want=true;
  var el=document.documentElement,rq=el.requestFullscreen||el.webkitRequestFullscreen,p;
  try{p=rq?rq.call(el):null;}catch(e){p=null;}
  var lock=function(){
    try{if(screen.orientation&&screen.orientation.lock)return screen.orientation.lock("landscape");}catch(e){}
    return Promise.reject();
  };
  Promise.resolve(p).then(function(){fsOn=!!document.fullscreenElement;return lock();}).catch(function(){return lock();}).catch(function(){})
    .then(function(){setTimeout(function(){
      if(want&&window.innerWidth<=window.innerHeight*1.1)forced=true;   // مفيش قفل → لف بالـ CSS
      apply();
    },450);});
  apply();
}
window.bjRotate=function(){
  try{if(typeof playClickSound==="function")playClickSound();}catch(e){}
  if(want||forced||H.classList.contains("bj-land")){release();}else{turnOn();return;}
  apply();
};
window.addEventListener("resize",apply);window.addEventListener("orientationchange",function(){setTimeout(apply,200);});
document.addEventListener("fullscreenchange",function(){fsOn=!!document.fullscreenElement;if(!fsOn&&want&&!forced){want=false;}apply();});
setInterval(apply,700);
})();
