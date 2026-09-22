/* =========================================================
   UI MODE
   Desktop / Mobile layout preference.
========================================================= */

(function(){
  const STORAGE_KEY="peaceUiMode";
  const VALID_MODES=["mobile","desktop"];
  const root=document.documentElement;

  function detectMode(){
    return window.matchMedia("(min-width: 900px)").matches
      ?"desktop"
      :"mobile";
  }

  function getSavedMode(){
    try{
      const saved=localStorage.getItem(STORAGE_KEY);
      return VALID_MODES.includes(saved)?saved:null;
    }catch(e){
      return null;
    }
  }

  function getCurrentMode(){
    return root.dataset.uiMode||getSavedMode()||detectMode();
  }

  function apply(mode,save){
    if(!VALID_MODES.includes(mode))mode=detectMode();
    root.dataset.uiMode=mode;
    root.classList.toggle("ui-mode-mobile",mode==="mobile");
    root.classList.toggle("ui-mode-desktop",mode==="desktop");

    if(save){
      try{localStorage.setItem(STORAGE_KEY,mode)}catch(e){}
    }

    document.querySelectorAll(".ui-mode-btn").forEach(btn=>{
      const active=btn.dataset.uiMode===mode;
      btn.classList.toggle("is-active",active);
      btn.setAttribute("aria-pressed",active?"true":"false");
    });

    const label=document.getElementById("uiModeCurrent");
    if(label)label.textContent=mode==="desktop"?"ديسكتوب":"موبايل";
  }

  // Apply before the page paints, while keeping the current layout
  // responsive on first visit. An explicit selection is then persisted.
  apply(getSavedMode()||detectMode(),false);

  function initControls(){
    const switcher=document.getElementById("uiModeSwitch");
    if(!switcher)return;

    switcher.querySelectorAll(".ui-mode-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const mode=btn.dataset.uiMode;
        if(typeof playClickSound==="function")playClickSound();
        apply(mode,true);
      });
    });

    apply(getCurrentMode(),false);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",initControls,{once:true});
  }else{
    initControls();
  }

  window.setUiMode=function(mode){apply(mode,true)};
  window.getUiMode=getCurrentMode;
})();
