/* =========================================================
   HUB — الأرقام اللي فوق كروت الشاشة الرئيسية.
   بتتحسب من الصفحة نفسها، فلما تضيف لعبة (كارت .hx-card)
   أو قصة جديدة الأرقام بتتظبط لوحدها.
========================================================= */

(function(){
  const hub=document.getElementById("hub");
  if(!hub)return;

  const fmt=n=>Number(n).toLocaleString("en-US");
  const setStat=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};

  setStat("hmStatGames",hub.querySelectorAll(".hx-card").length);
  setStat("hmStatCases",document.querySelectorAll("#games button.hm-case").length);

  if(typeof FOOTBALL_PLAYERS!=="undefined"){
    setStat("hmStatNames",fmt(FOOTBALL_PLAYERS.length)+"+");
  }
})();

/* ---------- الدُرج الجانبي (اختصارات) ---------- */
(function(){
  const h=document.getElementById("dxHandle"),d=document.getElementById("dx"),sc=document.getElementById("dxScrim"),x=document.getElementById("dxClose");
  if(!h||!d)return;
  const set=on=>{
    document.body.classList.toggle("dx-open",on);
    h.setAttribute("aria-expanded",on?"true":"false");
    d.setAttribute("aria-hidden",on?"false":"true");
  };
  h.addEventListener("click",()=>{if(typeof playClickSound==="function")playClickSound();set(true);});
  [sc,x].forEach(e=>e&&e.addEventListener("click",()=>set(false)));
  d.addEventListener("click",e=>{if(e.target.closest(".hm-fc,.hm-fc5"))set(false);});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")set(false);});
})();
