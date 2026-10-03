/* قصص الجرايم: ملف سري بالضغط المطوّل + هوية لكل قضية + قواعد قابلة للطي */
(function(){
  var CASES={
    train:{tag:"ASWAN • CAIRO",no:"T-ASW"},
    yousef:{tag:"CAIRO • 3AWAEM",no:"Y-3WM"},
    niyaba:{tag:"CASE FILE • 001/2026",no:"NYABA"},
    niyaba2:{tag:"CASE FILE • 002/2026",no:"NYABA"}
  };
  function S(p){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';}
  var IC={
    lock:S('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    book:S('<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>'),
    chev:S('<path d="M6 9l6 6 6-6"/>'),
    users:S('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 5 5"/>'),
    clock:S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    search:S('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),
    mail:S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    vote:S('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>'),
    door:S('<path d="M14 4h5v16h-5"/><path d="M4 12h9M10 8l4 4-4 4"/>'),
    target:S('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
    dot:S('<circle cx="12" cy="12" r="3"/>')
  };
  function iconFor(t){
    if(/ملاحظة سرية|سري/.test(t))return IC.lock;
    if(/تصويت|صوت/.test(t)&&!/يخرج/.test(t))return IC.vote;
    if(/يخرج/.test(t))return IC.door;
    if(/اتهام|الفاعل|المافيوسو|يقول مين/.test(t))return IC.target;
    if(/دليل|وثيقة/.test(t))return IC.search;
    if(/جول/.test(t))return IC.clock;
    if(/لاعب|اسمه|أنتم/.test(t))return IC.users;
    return IC.dot;
  }

  /* ---- 2) هوية القضية ---- */
  function caseOf(id){
    var m=/^(niyaba2|niyaba|train|yousef)(-|$)/.exec(id);
    return m?m[1]:null;
  }
  function addIdentity(sec){
    var c=caseOf(sec.id);if(!c)return;
    sec.setAttribute("data-case",c);
    var info=CASES[c];
    if(info&&info.tag&&!sec.querySelector(":scope > .cs-strip")){
      var d=document.createElement("div");d.className="cs-strip";d.setAttribute("aria-hidden","true");
      d.innerHTML="<span>"+info.tag+"</span><span class=\"cs-no\">"+info.no+"</span>";
      sec.insertBefore(d,sec.firstChild);
    }
  }

  /* ---- 1) الملف السري ---- */
  function setCovered(sec,on){
    sec.classList.toggle("dsr-covered",on);
    sec.querySelectorAll(".dsr-body").forEach(function(b){b.setAttribute("aria-hidden",on?"true":"false");});
    sec.querySelectorAll(".dsr-hold").forEach(function(b){b.classList.toggle("on",!on);});
  }
  function buildDossier(sec,card){
    if(card.classList.contains("dossier"))return;
    card.classList.add("dossier");
    var body=document.createElement("div");body.className="dsr-body";
    while(card.firstChild)body.appendChild(card.firstChild);
    var head=document.createElement("div");head.className="dsr-head";
    head.innerHTML='<span class="dsr-stamp">سري للغاية</span><button type="button" class="dsr-hold">'+IC.lock+'<span>اضغط مطولًا للكشف</span></button>';
    card.appendChild(head);card.appendChild(body);
    var btn=head.querySelector(".dsr-hold");
    function reveal(e){if(e&&e.preventDefault)e.preventDefault();setCovered(sec,false);}
    function cover(){setCovered(sec,true);}
    btn.addEventListener("pointerdown",function(e){try{btn.setPointerCapture(e.pointerId);}catch(_){ }reveal(e);});
    ["pointerup","pointercancel","lostpointercapture"].forEach(function(ev){btn.addEventListener(ev,cover);});
    btn.addEventListener("contextmenu",function(e){e.preventDefault();});
    btn.addEventListener("click",function(e){if(e.detail===0)setCovered(sec,!sec.classList.contains("dsr-covered"));}); /* كيبورد */
  }
  function setupPlayer(sec){
    var cards=sec.querySelectorAll(".card.secret");
    if(!cards.length)return;
    cards.forEach(function(c){buildDossier(sec,c);});
    setCovered(sec,true);
    var wasHidden=sec.classList.contains("hidden");
    new MutationObserver(function(){
      var h=sec.classList.contains("hidden");
      if(wasHidden&&!h)setCovered(sec,true); /* أول ما الشاشة تظهر تبدأ مغطّاة */
      wasHidden=h;
    }).observe(sec,{attributes:true,attributeFilter:["class"]});
  }
  document.addEventListener("visibilitychange",function(){
    if(document.hidden)document.querySelectorAll('section[id$="-player"]').forEach(function(s){if(s.querySelector(".dossier"))setCovered(s,true);});
  });

  /* ---- 8) القواعد ---- */
  function setupRules(sec){
    sec.querySelectorAll(".card").forEach(function(card){
      if(card.classList.contains("rules-card"))return;
      var h=card.querySelector(":scope > h2");
      var ul=card.querySelector(":scope > ul");
      if(!h||!ul||!/^\s*قواعد/.test(h.textContent))return;
      card.classList.add("rules-card");
      var head=document.createElement("button");head.type="button";head.className="rl-head";head.setAttribute("aria-expanded","false");
      head.innerHTML='<span class="rl-ico">'+IC.book+'</span>';
      head.appendChild(h);
      var chev=document.createElement("span");chev.className="rl-chev";chev.innerHTML=IC.chev;head.appendChild(chev);
      var body=document.createElement("div");body.className="rl-body";
      ul.className="rl-list";ul.removeAttribute("style");
      ul.querySelectorAll("li").forEach(function(li){
        var ico=document.createElement("span");ico.className="rl-li-ico";ico.innerHTML=iconFor(li.textContent);
        var txt=document.createElement("span");
        while(li.firstChild)txt.appendChild(li.firstChild);
        li.appendChild(ico);li.appendChild(txt);
      });
      body.appendChild(ul);
      card.innerHTML="";card.appendChild(head);card.appendChild(body);
      head.addEventListener("click",function(){
        var open=card.classList.toggle("open");head.setAttribute("aria-expanded",open?"true":"false");
        if(typeof playClickSound==="function")playClickSound();
      });
    });
  }

  function init(){
    document.querySelectorAll("section[id]").forEach(function(sec){
      if(!caseOf(sec.id))return;
      addIdentity(sec);
      if(/-player$/.test(sec.id)){setupPlayer(sec);setupRules(sec);}
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
