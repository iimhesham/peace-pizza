/* =========================================================
   GENERAL
========================================================= */

const FOOTBALL_SCREENS=["password","password-game"];

function show(id){
  document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
  const target=document.getElementById(id);
  if(target){
    target.classList.remove("hidden");
    target.classList.remove("page-in");
    void target.offsetWidth;
    target.classList.add("page-in");
  }
  document.body.classList.toggle("mode-football",FOOTBALL_SCREENS.includes(id));
  window.scrollTo({top:0,behavior:"smooth"});
}

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


