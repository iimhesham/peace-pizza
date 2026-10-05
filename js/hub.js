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
