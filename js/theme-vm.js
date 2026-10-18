/* =========================================================
   THEME — Vanilla × Moonstone  (data-theme="vm")
   - زرار السويتش (منحوت) + حفظ الاختيار
   - بيبني «المنيو» الجديد للصفحة الرئيسية من نفس كروت .hx-card
     (يعني أي لعبة تتضاف للكروت بتظهر لوحدها في المنيو، والضغط عليها بيفتح اللعبة نفسها)
   - لما الثيم يتغيّر وإنت في صفحة الحساب، الصفحة بتتعمل رندر تاني بالتصميم المناسب
   الثيم الكلاسيك هو الافتراضي ومفيش حاجة فيه اتغيّرت.
========================================================= */
(function(){
  var KEY="pp_theme",root=document.documentElement,TC={classic:"#050505",vm:"#FFEBAF"};

  function stored(){var t="";try{t=localStorage.getItem(KEY)||"";}catch(e){}return t==="vm"?"vm":"classic";}
  function cur(){return root.getAttribute("data-theme")==="vm"?"vm":"classic";}
  function on(){return cur()==="vm";}

  /* ---------- السويتش ---------- */
  var SUN='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none"/><path d="M12 2.6v2.4M12 19v2.4M2.6 12H5M19 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3L17 7M7 17l-1.7 1.7"/></svg>';
  var MOON='<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z"/></svg>';
  function sw(){
    var v=on();
    return '<button type="button" class="vm-sw" role="switch" aria-checked="'+(v?"true":"false")+'" aria-label="تبديل الثيم (كلاسيك / فانيليا)" title="تبديل الثيم">'+
      '<span class="vm-sw-track"><span class="vm-sw-ic m">'+MOON+'</span><span class="vm-sw-ic s">'+SUN+'</span><span class="vm-sw-knob"></span></span></button>';
  }
  function syncSwitches(){
    var v=on(),all=document.querySelectorAll(".vm-sw");
    for(var i=0;i<all.length;i++)all[i].setAttribute("aria-checked",v?"true":"false");
  }

  function set(t,silent){
    t=t==="vm"?"vm":"classic";
    if(!silent){root.classList.add("vm-anim");setTimeout(function(){root.classList.remove("vm-anim");},520);}
    if(t==="vm")root.setAttribute("data-theme","vm");else root.removeAttribute("data-theme");
    try{localStorage.setItem(KEY,t);}catch(e){}
    var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",TC[t]);
    syncSwitches();
    /* صفحة الحساب (فيها التابات) بتتبني بHTML مختلف حسب الثيم، فنرسمها تاني */
    if(!silent&&document.getElementById("olTabs")&&window.OLX&&OLX.go&&OLX.cur){try{OLX.go(OLX.cur());}catch(e){}}
  }
  function toggle(){
    if(typeof playClickSound==="function"){try{playClickSound();}catch(e){}}
    set(on()?"classic":"vm");
  }

  /* السويتش بيتحط في أماكن كتير (الهوم + صفحة الحساب) فنسمع على الـ document */
  document.addEventListener("click",function(e){
    var b=e.target.closest&&e.target.closest(".vm-sw");
    if(b){e.preventDefault();toggle();}
  });

  /* ---------- المنيو الجديد للصفحة الرئيسية ---------- */
  var ARROW='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var LOCK='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function two(n){return n<10?"0"+n:""+n;}

  /* تظبيط حجم وخط كلمة GAME واللوجو (بيتحط من هنا عشان ملف الـCSS ما يتغيرش) */
  (function(){
    if(document.getElementById("vmHeroTune"))return;
    var st=document.createElement("style");st.id="vmHeroTune";
    st.textContent=
      'html[data-theme="vm"] #vmHero{padding:0 0 2px;margin:0 0 6px}'+
      '.vm-logo{width:84px!important;height:84px!important}'+
      '.vm-word{font-family:"Jost","IBM Plex Sans Arabic",sans-serif!important;font-weight:600!important;'+
        'font-size:clamp(26px,8vw,34px)!important;letter-spacing:.42em!important;padding-inline-start:.42em;'+
        'margin:6px 0 0!important;text-shadow:none!important;color:var(--vm-moon-d)!important}'+
      '.vm-ask{font-size:17px!important;margin:2px 0 0!important;text-shadow:none!important}';
    document.head.appendChild(st);
  })();

  /* اللوجو: ألوان صريحة من غير gradient ids (الـurl(#id) كان بيفقد الرسم بعد الرجوع للهوم) */
  function LOGO(){
    return '<svg class="vm-logo" viewBox="0 0 120 120" role="img" aria-label="Peace Pizza">'+
      '<circle cx="60" cy="60" r="54" fill="#E9D18A"/><circle cx="60" cy="60" r="47" fill="#FFF1C2"/>'+
      '<circle cx="60" cy="60" r="40" fill="none" stroke="#4C9DB0" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round" opacity=".7"/>'+
      '<path d="M60 60V22M60 60L93 79M60 60L27 79" stroke="#2D7488" stroke-width="2.4" stroke-linecap="round" opacity=".45"/>'+
      '<g fill="#4C9DB0"><circle cx="60" cy="38" r="7"/><circle cx="79" cy="70" r="7"/><circle cx="41" cy="70" r="7"/></g>'+
      '<g fill="#FFEBAF" opacity=".75"><circle cx="58" cy="36" r="2.2"/><circle cx="77" cy="68" r="2.2"/><circle cx="39" cy="68" r="2.2"/></g></svg>';
  }
  /* نعيد رسم اللوجو كل ما الهوم يظهر (رجوع من لعبة / bfcache) */
  function refreshLogo(){
    var h=document.getElementById("vmHero");if(!h)return;
    var old=h.querySelector(".vm-logo");if(!old)return;
    var t=document.createElement("div");t.innerHTML=LOGO();old.replaceWith(t.firstChild);
  }
  function watchHub(){
    var hub=document.getElementById("hub");if(!hub||hub._vmW)return;hub._vmW=1;
    var was=!hub.classList.contains("hidden");
    new MutationObserver(function(){
      var now=!hub.classList.contains("hidden");
      if(now&&!was)refreshLogo();was=now;
    }).observe(hub,{attributes:true,attributeFilter:["class"]});
    window.addEventListener("pageshow",function(e){if(e.persisted)refreshLogo();});
    document.addEventListener("visibilitychange",function(){if(!document.hidden)refreshLogo();});
  }

  function buildHub(){
    var hub=document.getElementById("hub");
    if(!hub||document.getElementById("vmMenu"))return;
    var head=hub.querySelector(".hm-head"),top=document.getElementById("hxTop"),joinBox=document.getElementById("hxJoinBox");
    var kids=[].slice.call(hub.children),secs=[],curSec=null,total=0;

    /* نقرا الأقسام والكروت من الصفحة نفسها */
    kids.forEach(function(el){
      if(el.classList&&el.classList.contains("hx-h")){
        var small=/g-ball/.test(el.className)?"FOOTBALL":/g-fun/.test(el.className)?"GAMES":/g-case/.test(el.className)?"CASES":"";
        curSec={ar:(el.textContent||"").trim(),en:small,items:[]};secs.push(curSec);
      }else if(el.classList&&el.classList.contains("hx-grid")&&curSec){
        [].forEach.call(el.querySelectorAll(".hx-card"),function(c){curSec.items.push(c);});
      }
    });
    secs.forEach(function(s){total+=s.items.length;});

    /* الهيرو: نص فانيليا + نص مونستون */
    var hero=document.createElement("div");hero.id="vmHero";hero.className="vm-hero";
    hero.innerHTML=
      LOGO()+
      '<h1 class="vm-word" dir="ltr">GAME</h1><p class="vm-ask">تحب تلعب إيه؟</p>';
    /* شريط الثيم */
    var bar=document.createElement("div");bar.id="vmBar";bar.className="vm-bar-row";
    bar.innerHTML='<span class="vm-bar-t">الثيم</span>'+sw();

    /* المنيو */
    var menu=document.createElement("div");menu.id="vmMenu";menu.className="vm-menu";
    var n=0,html="";
    secs.forEach(function(s){
      html+='<div class="vm-sec"><b>'+esc(s.ar)+'</b>'+(s.en?'<small dir="ltr">'+s.en+'</small>':'')+'</div>';
      s.items.forEach(function(c){
        n++;
        var g=c.getAttribute("data-g")||"",ar=c.querySelector(".hx-ar"),en=c.querySelector(".hx-en"),ds=c.querySelector(".hx-desc"),art=c.querySelector(".hx-art svg");
        var tags=[].map.call(c.querySelectorAll(".hx-tags i"),function(i){return'<i'+(i.classList.contains("on")?' class="on"':'')+'>'+esc(i.textContent)+'</i>';}).join("");
        html+='<button type="button" class="vm-row" data-g="'+esc(g)+'">'+
          '<span class="vm-no" dir="ltr">'+two(n)+'</span>'+
          '<span class="vm-plate" aria-hidden="true">'+(art?art.outerHTML:"")+'</span>'+
          '<span class="vm-txt"><b class="vm-ar">'+esc(ar?ar.textContent:g)+'</b>'+(en?'<small class="vm-en" dir="ltr">'+esc(en.textContent)+'</small>':'')+
          (ds?'<span class="vm-ds">'+ds.innerHTML+'</span>':'')+'</span>'+
          '<span class="vm-go">'+ARROW+'</span>'+
          (tags?'<span class="vm-tags">'+tags+'</span>':'')+'</button>';
      });
    });
    /* القصص المغلقة */
    var off=document.getElementById("hxOff");
    if(off){
      var t=off.querySelector(".hx-off-tx b"),s2=off.querySelector(".hx-off-tx small");
      html+='<div class="vm-sec"><b>قريباً</b><small dir="ltr">SOON</small></div>'+
        '<button type="button" class="vm-row off" data-off="1"><span class="vm-no" dir="ltr">--</span>'+
        '<span class="vm-plate" aria-hidden="true">'+LOCK+'</span>'+
        '<span class="vm-txt"><b class="vm-ar">'+esc(t?t.textContent:"القصص")+'</b><small class="vm-en" dir="ltr">CASE FILES</small>'+
        '<span class="vm-ds">'+esc(s2?s2.textContent:"مغلق مؤقتاً")+'</span></span><span class="vm-stamp">مغلق</span></button>';
    }
    menu.innerHTML=html;

    menu.addEventListener("click",function(e){
      var r=e.target.closest(".vm-row");if(!r)return;
      if(r.getAttribute("data-off")){if(typeof hxOff==="function")hxOff();return;}
      var src=hub.querySelector('.hx-card[data-g="'+r.getAttribute("data-g")+'"]');
      if(src)src.click();
    });

    if(head){head.after(bar);bar.after(hero);}else{hub.prepend(hero);hub.prepend(bar);}
    (joinBox||top||hero).after(menu);
    /* ملاحظة: هيرو ← إجراءات سريعة ← منيو  (ترتيب الـ DOM الأصلي بيحافظ على hxTop بعد الهيرو) */
    if(top&&hero.nextSibling!==top)hero.after(top);
    if(joinBox&&top)top.after(joinBox);
    syncSwitches();
    watchHub();
  }

  window.PPTheme={on:on,cur:cur,set:set,toggle:toggle,sw:sw,sync:syncSwitches};
  set(stored(),true);
  buildHub();
})();

/* =========================================================
   EVIDENCE BOARD — لوحة التحقيق: ميل الملفات، لون الدبوس، الخيوط الحمرا،
   «N مرات · من كذا / ملف جديد» (محفوظة على جهازك بس) و«آخر لعب» تحت فولدر القضية.
========================================================= */
(function(){
  var KEY="pp_play_stats",hub=document.getElementById("hub");
  if(!hub)return;
  var TILT=[-.5,.4,-.3,.5,-.4,.3],PIN=["#d63a30","#e2b23a","#3b82f6","#d63a30","#2fae6b","#e2b23a"],PX=["24%","76%"];
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch(e){return {};}}
  function save(o){try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}
  function ar(n){return String(n).replace(/\d/g,function(d){return"٠١٢٣٤٥٦٧٨٩"[d];});}
  function ago(t){
    var m=Math.max(0,Math.round((Date.now()-t)/60000));
    if(m<2)return"دلوقتي";
    if(m<60)return"من "+ar(m)+" دقيقة";
    var h=Math.round(m/60);if(h<24)return h===1?"من ساعة":h===2?"من ساعتين":"من "+ar(h)+" ساعات";
    var d=Math.round(h/24);if(d<30)return d===1?"من إمبارح":d===2?"من يومين":"من "+ar(d)+" أيام";
    var w=Math.round(d/7);return"من "+ar(w)+" أسابيع";
  }
  function times(n){return n===1?"مرة":n===2?"مرتين":ar(n)+" مرات";}

  function strings(menu){
    var NS="http://www.w3.org/2000/svg",svg=document.getElementById("lgStrings");
    if(!svg){svg=document.createElementNS(NS,"svg");svg.id="lgStrings";svg.setAttribute("aria-hidden","true");menu.insertBefore(svg,menu.firstChild);}
    var mr=menu.getBoundingClientRect();if(!mr.width){return;}
    svg.setAttribute("height",menu.scrollHeight);svg.setAttribute("viewBox","0 0 "+mr.width+" "+menu.scrollHeight);
    var d="",prev=null;
    [].forEach.call(menu.children,function(el){
      if(el.classList.contains("vm-sec")){prev=null;return;}
      if(!el.classList.contains("vm-row")||el.getAttribute("data-off")){return;}
      var r=el.getBoundingClientRect(),px=parseFloat(el.style.getPropertyValue("--px"))||24,
          p={x:r.left-mr.left+r.width*px/100,y:r.top-mr.top};
      if(prev){
        var mx=(prev.x+p.x)/2,my=(prev.y+p.y)/2+20;
        d+="M"+prev.x.toFixed(1)+" "+prev.y.toFixed(1)+"Q"+mx.toFixed(1)+" "+my.toFixed(1)+" "+p.x.toFixed(1)+" "+p.y.toFixed(1);
      }
      prev=p;
    });
    svg.innerHTML='<path d="'+d+'" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="3.4" stroke-linecap="round" transform="translate(0 3)"/>'+
                  '<path d="'+d+'" fill="none" stroke="#d9362c" stroke-width="2" stroke-linecap="round"/>';
  }

  function paint(){
    var menu=document.getElementById("vmMenu");if(!menu)return;
    var st=load(),n=0;
    [].forEach.call(menu.children,function(el){
      if(!el.classList.contains("vm-row")||el.getAttribute("data-off"))return;
      el.style.setProperty("--r",TILT[n%TILT.length]+"deg");el.style.setProperty("--pin",PIN[n%PIN.length]);el.style.setProperty("--px",PX[n%2]);n++;
      var g=el.getAttribute("data-g"),s=st[g],tg=el.querySelector(".vm-tags"),m=el.querySelector(".lg-meta");
      if(!tg)return;
      if(!m){m=document.createElement("span");m.className="lg-meta";tg.insertBefore(m,tg.firstChild);}
      if(s&&s.n){m.className="lg-meta";m.textContent=times(s.n)+" · "+ago(s.t);}
      else{m.className="lg-meta new";m.textContent="ملف جديد";}
    });
    var r=document.getElementById("hxResume"),last="";try{last=localStorage.getItem("pp_last_game")||"";}catch(e){}
    if(r){
      var sp=r.querySelector("span"),a=r.querySelector(".lg-ago");
      if(st[last]&&st[last].t){
        if(!a&&sp){a=document.createElement("em");a.className="lg-ago";a.style.fontStyle="normal";sp.appendChild(a);}
        if(a)a.textContent="آخر لعب "+ago(st[last].t);
      }else if(a)a.remove();
    }
    requestAnimationFrame(function(){strings(menu);});
  }
  hub.addEventListener("click",function(e){
    var c=e.target.closest&&e.target.closest(".hx-card[data-g]");if(!c)return;
    var st=load(),g=c.dataset.g;st[g]={n:((st[g]&&st[g].n)||0)+1,t:Date.now()};save(st);
    setTimeout(paint,60);
  },true);
  new MutationObserver(function(){if(!hub.classList.contains("hidden"))paint();}).observe(hub,{attributes:true,attributeFilter:["class"]});
  window.addEventListener("pageshow",paint);window.addEventListener("resize",paint);
  document.addEventListener("visibilitychange",function(){if(!document.hidden)paint();});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(paint);
  setTimeout(paint,0);setTimeout(paint,400);setTimeout(paint,1200);
})();
