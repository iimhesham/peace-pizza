/* =========================================================
   INIT
   Loops over every registered game (see GAMES in
   games-engine.js) so a new story never needs an edit here.
========================================================= */

Object.keys(GAMES).forEach(game=>{
  buildGameRoleButtons(game);
  buildGameGM(game);

  const nameInput=document.getElementById(`${game}Name`);
  if(nameInput){
    nameInput.addEventListener("keydown",e=>{
      if(e.key==="Enter")confirmGameRole(game);
    });
  }

  const gmInput=document.getElementById(`${game}GmInput`);
  if(gmInput){
    gmInput.addEventListener("keydown",e=>{
      if(e.key==="Enter")verifyGameGM(game);
    });
  }

  /* RESTORE SAVED PLAYER */
  try{
    const saved=JSON.parse(
      localStorage.getItem(`${game}Player`)||"null"
    );

    // ألعاب الأسماء الحقيقية بتتكشف من openGamePlayer بعد ما الكل يدخل،
    // فمنعمللهاش عرض مسبق هنا (كان ممكن يظهر دور غلط لحظيًا).
    if(saved&&!GAMES[game].useRealNames){
      const roles=getGameRoles(game,saved.sessionCode,saved.count);
      const r=roles.find(x=>x.id===saved.roleId);

      if(r){
        renderGamePlayer(game,saved.name,r);
      }
    }
  }catch(e){}
});

updateLiveDbStatusText();

/* =========================================================
   VIEW MODE TOGGLE (desktop / mobile)
   Only relevant on wide screens (see @media in app.css).
   Remembers the user's choice in localStorage.
========================================================= */
(function initViewModeToggle(){
  const KEY="viewMode"; // "mobile" | "desktop"
  const btn=document.getElementById("viewModeToggle");
  if(!btn)return;

  function apply(mode){
    document.body.classList.toggle("force-mobile-view",mode==="mobile");
    btn.setAttribute("aria-pressed",mode==="mobile"?"true":"false");
  }

  let saved=null;
  try{saved=localStorage.getItem(KEY);}catch(e){}
  apply(saved==="mobile"?"mobile":"desktop");

  btn.addEventListener("click",()=>{
    const nowMobile=!document.body.classList.contains("force-mobile-view");
    apply(nowMobile?"mobile":"desktop");
    try{localStorage.setItem(KEY,nowMobile?"mobile":"desktop");}catch(e){}
  });
})();

/* =========================================================
   CREDITS EASTER EGG (top-left "⋮" button)
========================================================= */
(function initCreditsOverlay(){
  const toggle=document.getElementById("creditsToggle");
  const overlay=document.getElementById("creditsOverlay");
  if(!toggle||!overlay)return;

  function open(){
    overlay.classList.remove("closing");
    overlay.hidden=false;
    overlay.scrollTop=0;
    document.body.classList.add("credits-open");
    toggle.setAttribute("aria-label","رجوع");
  }
  function close(){
    if(overlay.hidden)return;
    overlay.classList.add("closing");
    setTimeout(()=>{
      overlay.hidden=true;
      overlay.classList.remove("closing");
      document.body.classList.remove("credits-open");
      toggle.setAttribute("aria-label","القائمة");
    },220);
  }
  // النجمة نفسها: بتفتح الصفحة، ولما تبقى مفتوحة بترجّع
  toggle.addEventListener("click",()=>{
    playClickSound();
    if(overlay.hidden||overlay.classList.contains("closing")){if(overlay.hidden)open();}
    else close();
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
})();
