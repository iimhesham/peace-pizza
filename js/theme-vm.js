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
