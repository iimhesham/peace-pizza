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

/* ---------- الإجراءات السريعة + المحفظة ---------- */
(function(){
  const hub=document.getElementById("hub");
  if(!hub)return;
  const click=()=>{if(typeof playClickSound==="function")playClickSound();};
  const say=m=>{if(typeof toast==="function")toast(m);};

  /* آخر لعبة فتحتها: كارت فيه data-g. «كمّل» بيضغط على نفس الكارت فمفيش كود فتح مكرر */
  const KEY="pp_last_game";
  const cardOf=g=>hub.querySelector('.hx-card[data-g="'+g+'"]');
  const resume=document.getElementById("hxResume"),rname=document.getElementById("hxResumeName"),top=document.getElementById("hxTop");
  const syncResume=()=>{
    let g="";try{g=localStorage.getItem(KEY)||"";}catch(e){}
    const c=g&&cardOf(g);
    if(resume){
      resume.classList.toggle("hidden",!c);
      if(c)rname.textContent=c.dataset.name||g;
    }
    if(top)top.classList.toggle("one",!c);
  };
  hub.addEventListener("click",e=>{
    const c=e.target.closest(".hx-card[data-g]");
    if(c){try{localStorage.setItem(KEY,c.dataset.g);}catch(x){}syncResume();}
  },true);
  if(resume)resume.addEventListener("click",()=>{
    let g="";try{g=localStorage.getItem(KEY)||"";}catch(e){}
    const c=g&&cardOf(g);
    if(c)c.click();
  });
  syncResume();

  /* ادخل غرفة بكود */
  const jb=document.getElementById("hxJoinBtn"),box=document.getElementById("hxJoinBox"),code=document.getElementById("hxCode");
  if(jb&&box&&code){
    jb.addEventListener("click",()=>{
      click();
      const on=box.classList.toggle("hidden")===false;
      jb.setAttribute("aria-expanded",on?"true":"false");
      if(on)setTimeout(()=>code.focus(),50);
    });
    code.addEventListener("input",()=>{code.value=code.value.replace(/\D/g,"").slice(0,4);});
    box.addEventListener("submit",e=>{
      e.preventDefault();
      const v=code.value.trim();
      if(!/^\d{4}$/.test(v)){say("اكتب كود الغرفة (4 أرقام)");code.focus();return;}
      click();
      if(window.OL&&OL.rejoin){OL.rejoin(v);box.classList.add("hidden");jb.setAttribute("aria-expanded","false");code.value="";}
      else{
        /* الأونلاين لسه ما اتفتحش: سجّل دخول الأول وبعدين جرّب تاني */
        say("سجّل دخولك الأول، وبعدها ادخل الكود");
        const chip=document.getElementById("accChip");if(chip)chip.click();
      }
    });
  }

  /* رصيد الشنكلولو جنب الحساب (بيظهر لما تكون مسجّل دخول والمحفظة جاهزة) */
  const pill=document.getElementById("hmWallet"),num=document.getElementById("hmWalletNum");
  if(pill&&num){
    const fmt=n=>Number(n||0).toLocaleString("en-US");
    const paint=()=>{
      const S=window.SHK,w=S&&S.wallet&&S.wallet();
      if(w&&typeof w.b==="number"){num.textContent=fmt(w.b);pill.classList.remove("hidden");}
      else pill.classList.add("hidden");
    };
    let hooked=false;
    const hook=()=>{
      if(!hooked&&window.SHK&&SHK.onChange){SHK.onChange(paint);hooked=true;}
      paint();
      if(hooked)clearInterval(iv);
    };
    const iv=setInterval(hook,1200);
    hook();
    pill.addEventListener("click",()=>{
      click();
      if(window.OL&&OL.wallet)OL.wallet();
    });
  }
})();
