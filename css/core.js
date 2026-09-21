/* =========================================================
   GENERAL
========================================================= */

const FOOTBALL_SCREENS=["password","password-game","story","story-game"];

const YOUSEF_SCREENS=["yousef","yousef-gm-lock","yousef-setup","yousef-player","yousef-gm"];

const HOME_SCREENS=["hub","games"];
const STORY_SCREENS=["story","story-game"];  // «أنا مين» has its own colours
const START_SCREEN="hub";

/* ---------------------------------------------------------
   NAVIGATION + PHONE BACK
   Every screen change is a real history entry, so the phone's
   back button / edge swipe goes to the previous screen instead
   of leaving the site. navStack mirrors the browser history.
--------------------------------------------------------- */

let navStack=[START_SCREEN];

try{history.scrollRestoration="manual"}catch(e){}
history.replaceState({s:START_SCREEN},"");

function show(id,opts){
  opts=opts||{};
  if(id==="landing")id=START_SCREEN;

  if(!opts.fromHistory){
    const cur=navStack[navStack.length-1];

    if(id!==cur){
      const seen=navStack.lastIndexOf(id);

      if(seen!==-1){
        /* going back to a screen we already came from (e.g. an in-app
           "رجوع" button): rewind history so back stays consistent.
           popstate below does the actual rendering. */
        history.go(seen-(navStack.length-1));
        return;
      }

      if(/-(setup|gm-lock)$/.test(cur)&&/-(player|gm)$/.test(id)){
        /* setup / GM-lock screens shouldn't be a back stop once the
           player or GM is in */
        history.replaceState({s:id},"");
        navStack[navStack.length-1]=id;
      }else{
        history.pushState({s:id},"");
        navStack.push(id);
      }
    }
  }

  document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
  const target=document.getElementById(id);
  if(target){
    target.classList.remove("hidden");
    target.classList.remove("page-in");
    void target.offsetWidth;
    target.classList.add("page-in");
  }
  document.body.classList.toggle("mode-home",HOME_SCREENS.includes(id));
  document.body.classList.toggle("mode-football",FOOTBALL_SCREENS.includes(id));
  document.body.classList.toggle("mode-story",STORY_SCREENS.includes(id));
  document.body.classList.toggle("mode-yousef",YOUSEF_SCREENS.includes(id));
  window.scrollTo({top:0,behavior:"smooth"});
}

window.addEventListener("popstate",e=>{
  const id=(e.state&&e.state.s)||START_SCREEN;
  const idx=navStack.lastIndexOf(id);
  navStack=idx!==-1?navStack.slice(0,idx+1):[id];
  show(id,{fromHistory:true});
});

let toastTimer;

function toast(message){
  const t=document.getElementById("toast");
  t.textContent=message;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove("show"),2500);
}

function playClickSound(){
  try{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    const a=new AudioContext();
    const o=a.createOscillator(),g=a.createGain();
    o.type="triangle";
    o.frequency.setValueAtTime(260,a.currentTime);
    o.frequency.exponentialRampToValueAtTime(110,a.currentTime+.08);
    g.gain.setValueAtTime(.12,a.currentTime);
    g.gain.linearRampToValueAtTime(.01,a.currentTime+.08);
    o.connect(g);g.connect(a.destination);
    o.start();o.stop(a.currentTime+.08);
  }catch(e){}
}

function playRevealSound(){
  try{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    const a=new AudioContext(),t=a.currentTime;
    [196,146.8,110].forEach((f,i)=>{
      const o=a.createOscillator(),g=a.createGain();
      o.type="sine";o.frequency.value=f;
      g.gain.setValueAtTime(0,t+i*.05);
      g.gain.linearRampToValueAtTime(.09,t+.05+i*.05);
      g.gain.linearRampToValueAtTime(0,t+.9+i*.05);
      o.connect(g);g.connect(a.destination);
      o.start(t+i*.05);o.stop(t+1+i*.05);
    });
  }catch(e){}
}

function openGame(game){
  show(game);
}

function hashCode(str){
  let hash=0;
  for(let i=0;i<str.length;i++){
    hash=(hash<<5)-hash+str.charCodeAt(i);
    hash|=0;
  }
  return Math.abs(hash);
}

function seededShuffle(arr,seedStr){
  let seed=hashCode(seedStr);
  const a=[...arr];

  for(let i=a.length-1;i>0;i--){
    seed=(seed*9301+49297)%233280;
    const j=Math.floor((seed/233280)*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }

  return a;
}

function makeSessionCode(){
  return String(Math.floor(1000+Math.random()*9000));
}

// معرّف عشوائي ثابت لكل جهاز/متصفح (مش لكل شخص)، بيتحفظ مرة واحدة على
// الجهاز. بيستخدم بس عشان نفرّق بين "نفس الشخص فاتح نفس الصفحة تاني"
// و"شخص تاني بيحاول ياخد نفس الاسم من جهاز مختلف".
function getDeviceId(){
  let id=localStorage.getItem("peaceDeviceId");
  if(!id){
    id=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("peaceDeviceId",id);
  }
  return id;
}


