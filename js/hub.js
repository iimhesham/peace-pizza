/* =========================================================
   HUB — stats strip, filter tabs and search on the start screen.
   Numbers are computed live from the page/data, so they stay
   correct when a new game or story is added.
========================================================= */

(function(){
  const hub=document.getElementById("hub");
  if(!hub)return;

  /* ---------- stats ---------- */
  const fmt=n=>Number(n).toLocaleString("en-US");
  const setStat=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};

  setStat("hmStatGames",hub.querySelectorAll(".hm-row").length);
  setStat("hmStatCases",document.querySelectorAll("#games button.hm-case").length);
  if(typeof FOOTBALL_PLAYERS!=="undefined"){
    setStat("hmStatNames",fmt(FOOTBALL_PLAYERS.length)+"+");
  }

  /* ---------- filter + search ---------- */
  const tabs=[...hub.querySelectorAll(".hm-tabs button")];
  const input=document.getElementById("hmSearch");
  const empty=document.getElementById("hmEmpty");
  const rows=[...hub.querySelectorAll(".hm-row[data-cat]")];
  const groups=[...hub.querySelectorAll(".hm-group")];

  // Arabic-friendly normalisation: أ/إ/آ→ا، ة→ه، ى→ي، without tashkeel
  const norm=t=>(t||"").toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g,"")
    .replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي")
    .replace(/\s+/g," ").trim();

  let filter="all";

  function apply(){
    const q=norm(input?input.value:"");
    let shown=0;

    rows.forEach(r=>{
      const okCat=filter==="all"||r.dataset.cat===filter;
      const hay=norm(r.textContent+" "+(r.dataset.k||""));
      const ok=okCat&&(!q||hay.includes(q));
      r.classList.toggle("hidden",!ok);
      if(ok)shown++;
    });

    // hide a group label when none of its rows is visible
    groups.forEach(g=>{
      let n=g.nextElementSibling,any=false;
      while(n&&!n.classList.contains("hm-group")&&n.id!=="hmEmpty"){
        if(n.classList.contains("hm-row")&&!n.classList.contains("hidden"))any=true;
        n=n.nextElementSibling;
      }
      g.classList.toggle("hidden",!any);
    });

    if(empty)empty.classList.toggle("hidden",shown>0);
  }

  tabs.forEach(t=>t.addEventListener("click",()=>{
    if(typeof playClickSound==="function")playClickSound();
    filter=t.dataset.f;
    tabs.forEach(x=>{
      const on=x===t;
      x.classList.toggle("is-on",on);
      x.setAttribute("aria-selected",on?"true":"false");
    });
    apply();
  }));

  if(input)input.addEventListener("input",apply);
})();
