/* =========================================================
   THEME — Vanilla × Moonstone  (data-theme="vm")
   - زرار السويتش (منحوت) + حفظ الاختيار
   - بيبني «المنيو» الجديد للصفحة الرئيسية من نفس كروت .hx-card
     (يعني أي لعبة تتضاف للكروت بتظهر لوحدها في المنيو، والضغط عليها بيفتح اللعبة نفسها)
   - لما الثيم يتغيّر وإنت في صفحة الحساب، الصفحة بتتعمل رندر تاني بالتصميم المناسب
   الثيم الكلاسيك هو الافتراضي ومفيش حاجة فيه اتغيّرت.
========================================================= */
(function(){
  var KEY="pp_theme",root=document.documentElement,TC={classic:"#050706",vm:"#FFEBAF"};

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
   PEACE PIZZA — App Shell: نافبار + 4 صفحات + انتقالات
   - بيبني الصفحات من نفس كروت .hx-card (أي لعبة تتضاف للكروت بتظهر لوحدها)
   - الضغط على أي لعبة بيشغّل الكارت الأصلي، فكل المنطق القديم شغال زي ما هو
   - «لعبت N مرة / آخر لعب» محفوظة على جهازك بس (localStorage)
========================================================= */
(function(){
  var hub=document.getElementById("hub");
  if(!hub||document.getElementById("ppShell"))return;
  var KEY="pp_play_stats",TABS=["home","football","games","soon"],cur="home",busy=false;
  var RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;

  function load(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch(e){return {};}}
  function save(o){try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function ar(n){return String(n).replace(/\d/g,function(d){return"٠١٢٣٤٥٦٧٨٩"[d];});}
  function ago(t){
    var m=Math.max(0,Math.round((Date.now()-t)/60000));
    if(m<2)return"دلوقتي";if(m<60)return"من "+ar(m)+" دقيقة";
    var h=Math.round(m/60);if(h<24)return h===1?"من ساعة":h===2?"من ساعتين":"من "+ar(h)+" ساعات";
    var d=Math.round(h/24);if(d<30)return d===1?"من إمبارح":d===2?"من يومين":"من "+ar(d)+" أيام";
    return"من "+ar(Math.round(d/7))+" أسابيع";
  }
  function times(n){return n===1?"مرة":n===2?"مرتين":ar(n)+" مرات";}
  function click(){if(typeof playClickSound==="function"){try{playClickSound();}catch(e){}}}

  /* ---------- اللوجو: دايرة بيتزا منحوتة + علامة سلام + اسم ---------- */
  function mark(){
    return '<span class="pp-mark" aria-hidden="true"><svg viewBox="0 0 64 64">'+
      '<g fill="none" stroke-linecap="round"><path d="M32 11V53M32 32L17 47M32 32L47 47" stroke="#fffdf0" stroke-width="2.4" opacity=".9" transform="translate(.9 1.1)"/>'+
      '<path d="M32 11V53M32 32L17 47M32 32L47 47" stroke="#0a2e22" stroke-width="2.4" opacity=".85"/></g>'+
      [[21,24,6.3],[44.5,21.5,4.1],[45,38,5.6],[23.5,41,3.9],[33.5,57,0]].map(function(p){
        if(!p[2])return'';return '<circle cx="'+(p[0]+.8)+'" cy="'+(p[1]+1.3)+'" r="'+p[2]+'" fill="#000" opacity=".3"/>'+
               '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+p[2]+'" fill="#0a2e22"/>'+
               '<circle cx="'+(p[0]-p[2]*.3)+'" cy="'+(p[1]-p[2]*.34)+'" r="'+(p[2]*.32)+'" fill="#EEEBDA" opacity=".3"/>';
      }).join("")+'</svg></span>';
  }
  function brand(xl){return '<span class="pp-brand'+(xl?' xl':'')+'" role="img" aria-label="Peace Pizza">'+mark()+'<span class="pp-word" dir="ltr"><b>peace</b><b>pizza</b></span></span>';}

  /* ---------- أشكال عضوية (موجات + حلقات) مستوحاة من صورة الموجات ---------- */
  function f1(n){return Math.round(n*10)/10;}
  function smooth(pts,closed){
    var n=pts.length,d="M"+f1(pts[0][0])+" "+f1(pts[0][1]),last=closed?n:n-1;
    for(var j=0;j<last;j++){
      var p0=pts[closed?(j+n-1)%n:Math.max(j-1,0)],p1=pts[j],p2=pts[(j+1)%n],p3=pts[closed?(j+2)%n:Math.min(j+2,n-1)];
      d+="C"+f1(p1[0]+(p2[0]-p0[0])/6)+" "+f1(p1[1]+(p2[1]-p0[1])/6)+" "+f1(p2[0]-(p3[0]-p1[0])/6)+" "+f1(p2[1]-(p3[1]-p1[1])/6)+" "+f1(p2[0])+" "+f1(p2[1]);
    }
    return d+(closed?"Z":"");
  }
  function blob(cx,cy,r,seed,amp){
    var pts=[],n=12;for(var i=0;i<n;i++){var a=i/n*Math.PI*2,k=1+amp*Math.sin(a*3+seed)+amp*.6*Math.cos(a*2+seed*1.7);pts.push([cx+Math.cos(a)*r*k,cy+Math.sin(a)*r*k]);}
    return smooth(pts,true);
  }
  function wave(a,b,amp,ph,dy){
    var pts=[],n=9;for(var i=0;i<=n;i++){var x=i/n*440-20;pts.push([x,a+(b-a)*(i/n)+amp*Math.sin(i/n*Math.PI*2.6+ph)+(dy||0)]);}
    return smooth(pts,false);
  }
  function waves(){
    var B=[[150,90,40,0,"w1"],[300,220,44,1.2,"w2"],[470,380,46,2.1,"w3"],[620,540,48,.4,"w4"],[740,700,36,1.7,"w6"],[810,780,26,.9,"w5"]],o='';
    B.forEach(function(x){o+='<path d="'+wave(x[0],x[1],x[2],x[3])+'V880H-20Z" fill="var(--'+x[4]+')"/>';});
    B.forEach(function(x,i){if(i%2===0)o+='<path d="'+wave(x[0],x[1],x[2],x[3],-14)+'" fill="none" stroke="var(--wl)" stroke-opacity=".2" stroke-width="1.2"/>';});
    o+='<path d="'+blob(380,120,95,.6,.12)+'" fill="var(--wc)" opacity=".45"/><path d="'+blob(-10,760,110,1.9,.14)+'" fill="var(--wk)" opacity=".9"/>';
    [[330,640,3],[352,662,2],[310,668,2.4],[372,628,1.8],[338,690,1.6],[60,330,2],[84,350,1.5]].forEach(function(c){o+='<circle cx="'+c[0]+'" cy="'+c[1]+'" r="'+c[2]+'" fill="var(--wl)" opacity=".28"/>';});
    return '<svg class="pp-waves" viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+o+'</svg>';
  }
  function emblem(){
    var R=[[136,0,.04,"w2",.22],[115,1.3,.045,"w3",.22],[95,2.4,.05,"w4",.24],[76,3.5,.045,"w5",.28]],o='';
    R.forEach(function(r,i){o+='<path d="'+blob(160+(i%2?3:-3),160+(i%2?-2:3),r[0],r[1],r[2])+'" fill="var(--'+r[3]+')" stroke="var(--wl)" stroke-opacity="'+r[4]+'" stroke-width="1.4"/>';});
    o+='<path d="'+blob(160,160,148,4.2,.035)+'" fill="none" stroke="var(--wl)" stroke-opacity=".2" stroke-width="1.2"/>';
    return '<svg class="rings" viewBox="0 0 320 320" aria-hidden="true">'+o+'</svg>';
  }

  /* ---------- الأيقونات ---------- */
  var IC={
    home:'<svg viewBox="0 0 24 24"><path d="M3.6 11.2 12 4l8.4 7.2V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.2H9v5.2H5.1A1.5 1.5 0 0 1 3.6 19z"/></svg>',
    football:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m12 8.1 3.4 2.5-1.3 4H9.9l-1.3-4zM12 3v5.1M20.5 9.4l-5.1 1.2M17.4 19l-3.3-4.4M6.6 19l3.3-4.4M3.5 9.4l5.1 1.2"/></svg>',
    games:'<svg viewBox="0 0 24 24"><rect x="2.8" y="7" width="18.4" height="10.6" rx="5.2"/><path d="M8 10.6v3.6M6.2 12.4h3.6"/><circle cx="15.6" cy="11.4" r=".9" fill="currentColor"/><circle cx="18" cy="13.6" r=".9" fill="currentColor"/></svg>',
    soon:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.3 2"/></svg>',
    me:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8.6" r="3.7"/><path d="M4.8 20c.9-3.8 3.6-5.6 7.2-5.6s6.3 1.8 7.2 5.6"/></svg>',
    play:'<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z"/></svg>',
    key:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.7-8.7M16 7l3 3M13.5 9.5l2 2"/></svg>',
    go:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.6"/><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7"/><circle cx="12" cy="15.5" r="1.3" fill="currentColor"/></svg>'
  };
  var GRAD={password:["#0f5f46","#06251b"],story:["#4d2b24","#1a0e0c"],career:["#17564f","#071f1c"],flags:["#2a6b3a","#0c2413"],xo:["#14604e","#072720"],
    ludo:["#0d6b57","#052a22"],sudoku:["#0e5a3a","#05211a"],tawla:["#3a2a1e","#140d09"],blackjack:["#0b4d3a","#04170f"],snake:["#127a52","#062b1e"]};

  /* ---------- نقرا الألعاب من الكروت ---------- */
  function readCards(){
    var out=[],sec="fun";
    [].forEach.call(hub.children,function(el){
      if(el.classList&&el.classList.contains("hx-h"))sec=/g-ball/.test(el.className)?"ball":"fun";
      else if(el.classList&&el.classList.contains("hx-grid")){
        [].forEach.call(el.querySelectorAll(".hx-card[data-g]"),function(c){
          var a=c.querySelector(".hx-art svg"),tags=[].map.call(c.querySelectorAll(".hx-tags i"),function(i){return{t:i.textContent.trim(),on:i.classList.contains("on")};});
          out.push({g:c.getAttribute("data-g"),ar:(c.querySelector(".hx-ar")||{}).textContent||c.getAttribute("data-name")||"",en:((c.querySelector(".hx-en")||{}).textContent||"").trim(),
            ds:((c.querySelector(".hx-desc")||{}).textContent||"").trim(),art:a?a.outerHTML.replace(/^<svg[^>]*>/,function(t){return t.replace(/\s(width|height)="[^"]*"/g,"");}):"",tags:tags,sec:sec,
            online:tags.some(function(t){return t.on;}),pc:tags.some(function(t){return t.t==="كمبيوتر";}),off:tags.some(function(t){return t.t==="أوفلاين";})});
        });
      }
    });
    return out;
  }
  var games=readCards();if(!games.length)return;
  var balls=games.filter(function(x){return x.sec==="ball";}),funs=games.filter(function(x){return x.sec!=="ball";});
  function byG(g){for(var i=0;i<games.length;i++)if(games[i].g===g)return games[i];return null;}
  function gr(g){var c=GRAD[g]||["#0f5f46","#06251b"];return'--g1:'+c[0]+';--g2:'+c[1];}

  function tile(c,i,note){
    return '<button type="button" class="pp-tile pp-s" data-g="'+esc(c.g)+'" style="'+gr(c.g)+';--i:'+i+'" aria-label="'+esc(c.ar)+'">'+
      '<span class="wm" aria-hidden="true">'+c.art+'</span><span class="ic" aria-hidden="true">'+c.art+'</span>'+
      '<span class="t">'+esc(c.ar)+'</span>'+(c.en?'<span class="e" dir="ltr">'+esc(c.en)+'</span>':'')+
      '<span class="st">'+(note?esc(note):(c.online?'<i class="pp-dot"></i>أونلاين':'أوفلاين'))+'</span></button>';
  }
  function row(title,go,list,start){
    return '<div class="pp-s pp-rh" style="--i:'+start+'"><h3>'+title+'</h3>'+(go?'<a type="button" data-go="'+go+'">عرض الكل</a>':'')+'</div>'+
      '<div class="pp-s pp-row" style="--i:'+(start+1)+'">'+list.map(function(c,i){return tile(c,0);}).join("")+'</div>';
  }

  /* ---------- بناء الصفحات ---------- */
  var off=document.getElementById("hxOff"),offT=off&&off.querySelector(".hx-off-tx b"),offS=off&&off.querySelector(".hx-off-tx small");
  var offName=offT?offT.textContent.trim():"القصص",offSub=offS?offS.textContent.trim():"مغلق مؤقتاً";

  var hr=new Date().getHours(),KICK=hr<5?"LATE NIGHT":hr<12?"MORNING":hr<17?"AFTERNOON":hr<21?"EVENING":"TONIGHT";
  var home=
    '<div class="pp-page" role="region" data-page="home">'+
      '<div class="pp-home">'+
        '<div class="pp-s pp-greet" style="--i:0"><small class="pp-kick" dir="ltr">'+KICK+'</small><h1>تحب تلعب إيه؟</h1></div>'+
        '<div class="pp-s pp-emblem" style="--i:1">'+emblem()+mark()+'</div>'+
        '<button type="button" class="pp-s pp-slab" style="--i:2" data-go="games"><span class="tx"><b>ابدأ لعب</b><small>اختار من كل الألعاب</small></span><span class="go">'+IC.go+'</span></button>'+
        '<form class="pp-s pp-join" id="ppJoin" style="--i:3" autocomplete="off">'+IC.key+
          '<div class="jl"><small>معاك كود غرفة؟</small><label class="pp-cells" dir="ltr"><i></i><i></i><i></i><i></i>'+
          '<input id="ppCode" inputmode="numeric" pattern="[0-9]*" maxlength="4" aria-label="كود الغرفة" dir="ltr"></label></div>'+
          '<button type="submit" aria-label="ادخل الغرفة">'+IC.go+'</button></form>'+
      '</div></div>';

  var fb=
    '<div class="pp-page" role="region" data-page="football" hidden>'+
      '<div class="pp-s pp-fb-head" style="--i:0"><small class="pp-kick" dir="ltr">FOOTBALL</small><h1>كورة</h1><p>ألعاب بأسامي لاعبين وأندية، من كلمة السر لحد عقود الانتقالات.</p></div>'+
      '<div class="pp-fb-list">'+balls.map(function(c,i){
        return '<button type="button" class="pp-frow pp-s" data-g="'+esc(c.g)+'" style="--i:'+(i+1)+'">'+
          '<span class="no" dir="ltr">'+(i+1)+'</span>'+
          '<span class="tx"><span class="t">'+esc(c.ar)+'</span>'+(c.en?'<span class="e" dir="ltr">'+esc(c.en)+'</span>':'')+
          '<span class="d">'+esc(c.ds)+'</span><span class="m">'+(c.online?'<i class="pp-dot"></i>':'')+'<span>'+[c.online?'أونلاين':'',c.off?'أوفلاين':'',c.pc?'كمبيوتر':''].filter(Boolean).join(' · ')+'</span></span></span>'+
          '<span class="ic" aria-hidden="true">'+c.art+'</span></button>';
      }).join("")+'</div></div>';

  /* أرفف الألعاب حسب النوع (مفيش فلاتر). لعبة جديدة مش في أي رف بتروح رف «ألعاب تانية» لوحدها */
  var SHELVES=[
    {t:"طاولة وورق",s:"كلاسيكيات القعدة",gs:["tawla","blackjack"],lay:"big"},
    {t:"حظ وسباق",s:"كل رمية ممكن تقلب اللعبة",gs:["ludo","snake"],lay:"wide"},
    {t:"تفكير وألغاز",s:"ركّز وفكّر",gs:["xo","sudoku","flags"],lay:"trio"}
  ];
  var placed={};SHELVES.forEach(function(sh){sh.list=sh.gs.map(byG).filter(Boolean);sh.list.forEach(function(c){placed[c.g]=1;});});
  var rest=funs.filter(function(c){return!placed[c.g];});
  if(rest.length)SHELVES.push({t:"ألعاب تانية",s:"",lay:"big",list:rest});
  var gi=1;
  var gm=
    '<div class="pp-page" role="region" data-page="games" hidden>'+
      '<div class="pp-s pp-g-head" style="--i:0"><small class="pp-kick" dir="ltr">GAMES</small><h1>ألعاب</h1></div>'+
      SHELVES.filter(function(sh){return sh.list&&sh.list.length;}).map(function(sh){
        var h='<div class="pp-s pp-shelf-h" style="--i:'+(gi++)+'"><div><h3>'+esc(sh.t)+'</h3>'+(sh.s?'<small>'+esc(sh.s)+'</small>':'')+'</div><span class="ln"></span></div>';
        var body='<div class="pp-lay pp-'+sh.lay+'">'+sh.list.map(function(c){
          return tile(c,0).replace('style="','style="--i:'+(gi++)+';');
        }).join("")+'</div>';
        return h+body;
      }).join("")+
    '</div>';

  var soon=
    '<div class="pp-page" role="region" data-page="soon" hidden>'+
      '<div class="pp-soon">'+
        '<div class="pp-s pp-lock" style="--i:0">'+IC.lock+'</div>'+
        '<small class="pp-s pp-kick" style="--i:1" dir="ltr">COMING SOON</small>'+
        '<p class="pp-s" style="--i:2">'+esc(offName)+' — '+esc(offSub)+'. بنجهّز حاجة جديدة، ولما تجهز هتلاقيها هنا.</p>'+
        '<div class="pp-s pp-ghosts" style="--i:4"><i class="pp-ghost"></i><i class="pp-ghost"></i><i class="pp-ghost"></i></div>'+
        '<button type="button" class="pp-s pp-btn g" data-off="1" style="--i:5">اعرف أكتر</button>'+
      '</div></div>';

  var nav='<nav class="pp-nav" aria-label="التنقل"><svg class="pp-navbg" aria-hidden="true"><path class="pp-navpath"/></svg><span class="pp-orb" aria-hidden="true"></span>'+
    [["home","الرئيسية"],["football","كورة"],["games","ألعاب"],["soon","قريباً"],["me","حسابي"]].map(function(t,i){
      return '<button type="button" data-tab="'+t[0]+'"'+(i===0?' class="on" aria-current="page"':'')+'><span class="ico">'+IC[t[0]]+'</span><span>'+t[1]+'</span></button>';
    }).join("")+'</nav>';

  var shell=document.createElement("div");shell.id="ppShell";shell.setAttribute("data-page","home");
  shell.innerHTML='<div class="pp-bg" aria-hidden="true">'+waves()+'<i class="vg"></i><i class="vg2"></i></div>'+
    '<main class="pp-pages">'+home+fb+gm+soon+'</main>'+nav;
  var head=hub.querySelector(".hm-head");
  if(head){head.after(shell);}else hub.prepend(shell);
  /* اللوجو + سويتش الثيم جوه الهيدر الأصلي (فالمحفظة وزرار الحساب بيفضلوا شغالين) */
  if(head){
    var b=document.createElement("div");b.innerHTML=brand();head.insertBefore(b.firstChild,head.firstChild);
    var sw=document.createElement("div");sw.className="pp-hsw";sw.innerHTML=(window.PPTheme?PPTheme.sw():"");head.appendChild(sw);
    if(window.PPTheme)PPTheme.sync();
  }

  var pages={};[].forEach.call(shell.querySelectorAll(".pp-page"),function(p){pages[p.getAttribute("data-page")]=p;});
  var navEl=shell.querySelector(".pp-nav"),orb=shell.querySelector(".pp-orb"),navPath=shell.querySelector(".pp-navpath"),navSvg=shell.querySelector(".pp-navbg");
  var navCx=null,navRaf=0,NH=70;
  function tabBtn(n){return navEl.querySelector('[data-tab="'+n+'"]');}
  /* البار الأسود بفتحة منحنية تحت الدايرة */
  function pathFor(cx,W){
    var r=22,d=42,a=40,x1=Math.max(r+2,cx-a),x2=Math.min(W-r-2,cx+a),l=cx-x1,m=x2-cx;
    return"M"+r+" 0H"+x1+"C"+(x1+l*.5)+" 0 "+(cx-l*.5)+" "+d+" "+cx+" "+d+"C"+(cx+m*.5)+" "+d+" "+(x2-m*.5)+" 0 "+x2+" 0H"+(W-r)+
      "Q"+W+" 0 "+W+" "+r+"V"+(NH-r)+"Q"+W+" "+NH+" "+(W-r)+" "+NH+"H"+r+"Q0 "+NH+" 0 "+(NH-r)+"V"+r+"Q0 0 "+r+" 0Z";
  }
  function draw(cx){
    navCx=cx;var W=navEl.offsetWidth||360;
    navSvg.setAttribute("viewBox","0 0 "+W+" "+NH);navPath.setAttribute("d",pathFor(cx,W));
    orb.style.transform="translate3d("+(cx-27)+"px,0,0)";
  }
  function moveInd(n,anim){
    var b=tabBtn(n);if(!b||!orb)return;
    var cx=b.offsetLeft+b.offsetWidth/2,ico=b.querySelector(".ico");
    var html='<span class="oi">'+(ico&&!ico.querySelector("img")?ico.innerHTML:"")+'</span>';
    if(orb.getAttribute("data-t")!==n){orb.innerHTML=html;orb.setAttribute("data-t",n);var oi=orb.firstChild;if(anim&&oi&&oi.animate&&!RM)oi.animate([{transform:"scale(.4) rotate(-40deg)",opacity:0},{transform:"scale(1) rotate(0)",opacity:1}],{duration:420,delay:120,easing:"cubic-bezier(.3,1.5,.4,1)",fill:"backwards"});}
    cancelAnimationFrame(navRaf);
    if(!anim||navCx==null||RM){draw(cx);return;}
    var from=navCx,t0=performance.now(),D=560;
    (function step(now){
      var k=Math.min(1,(now-t0)/D),e=1+2.2*Math.pow(k-1,3)+1.2*Math.pow(k-1,2);
      draw(from+(cx-from)*e);
      if(k<1)navRaf=requestAnimationFrame(step);else draw(cx);
    })(t0);
  }

  /* ---------- الانتقال بين الصفحات ---------- */
  function go(name){
    if(name===cur||!pages[name]||busy)return;
    var oldN=cur,old=pages[cur],nu=pages[name],ob=tabBtn(oldN),nb=tabBtn(name);
    var dir=(nb&&ob&&nb.getBoundingClientRect().left<ob.getBoundingClientRect().left)?-1:1;
    cur=name;
    TABS.forEach(function(t){var b=tabBtn(t);if(b){b.classList.toggle("on",t===name);if(t===name)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");}});
    shell.setAttribute("data-page",name);moveInd(name,true);
    try{if(navigator.vibrate)navigator.vibrate(8);}catch(e){}
    if(RM||!old.animate){old.hidden=true;nu.hidden=false;window.scrollTo(0,0);return;}
    busy=true;
    var out=old.animate([{opacity:1},{opacity:0}],{duration:130,easing:"ease-out",fill:"forwards"});
    function enter(){
      old.hidden=true;out.cancel();
      nu.hidden=false;window.scrollTo(0,0);
      busy=false;
    }
    out.onfinish=enter;out.oncancel=function(){if(busy)enter();};
  }

  /* ---------- فتح لعبة: دايرة بتتفتح من مكان الضغطة ---------- */
  function launch(el,g){
    var src=hub.querySelector('.hx-card[data-g="'+g+'"]');if(!src)return;
    click();
    if(RM||!document.body.animate){src.click();return;}
    var r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    var w=document.createElement("div");w.className="pp-wipe";w.innerHTML=brand(true);document.body.appendChild(w);
    var a=w.animate([{clipPath:"circle(0px at "+x+"px "+y+"px)"},{clipPath:"circle(150vmax at "+x+"px "+y+"px)"}],{duration:420,easing:"cubic-bezier(.5,0,.2,1)",fill:"forwards"});
    var done=false;
    function fin(){
      if(done)return;done=true;
      try{src.click();}catch(e){}
      setTimeout(function(){
        var f=w.animate([{opacity:1},{opacity:0}],{duration:320,easing:"ease-out",fill:"forwards"});
        f.onfinish=function(){w.remove();};
      },380);
    }
    a.onfinish=fin;setTimeout(fin,700);
  }

  /* ---------- حالة الصفحة الرئيسية: أرقام صغيرة + صورة الحساب ---------- */
  function paint(){
    var st=load(),plays=0;Object.keys(st).forEach(function(k){plays+=(st[k]&&st[k].n)||0;});
    var host=document.getElementById("ppStats");
    if(host){
      var on=games.filter(function(c){return c.online;}).length;
      host.innerHTML=[[games.length,"لعبة"],[on,"أونلاين"],[plays,"مرة لعب"]].map(function(x){return '<div class="pp-stat"><b>'+ar(x[0])+'</b><small>'+x[1]+'</small></div>';}).join("");
    }
    /* صورة الحساب في التاب */
    var chip=document.getElementById("accChip"),me=tabBtn("me"),img=chip&&chip.querySelector("img");
    if(me){var ico=me.querySelector(".ico");if(ico){ico.innerHTML=img?'<img class="av" alt="" src="'+esc(img.getAttribute("src"))+'">':IC.me;}}
    moveInd(cur);
  }

  /* ---------- الأحداث ---------- */
  shell.addEventListener("click",function(e){
    var t=e.target;if(!t.closest)return;
    var tb=t.closest("[data-tab]");
    if(tb){click();var n=tb.getAttribute("data-tab");if(n==="me"){var c=document.getElementById("accChip");if(c)c.click();}else go(n);return;}
    var gb=t.closest("[data-go]");if(gb){click();go(gb.getAttribute("data-go"));return;}
    var of=t.closest("[data-off]");if(of){click();if(typeof hxOff==="function")hxOff();return;}
    var gm2=t.closest("[data-g]");if(gm2&&(gm2.classList.contains("pp-tile")||gm2.classList.contains("pp-frow")||gm2.classList.contains("pp-play"))){launch(gm2,gm2.getAttribute("data-g"));}
  });
  var jf=document.getElementById("ppJoin"),jc=document.getElementById("ppCode");
  if(jf&&jc){
    var cells=jf.querySelectorAll(".pp-cells i");
    function syncCells(){
      var v=jc.value,focus=document.activeElement===jc;
      [].forEach.call(cells,function(c,i){c.textContent=v[i]?ar(v[i]):"";c.classList.toggle("on",focus&&i===Math.min(v.length,3));});
    }
    jc.addEventListener("focus",syncCells);jc.addEventListener("blur",syncCells);
    jc.addEventListener("input",function(){jc.value=jc.value.replace(/[^\d٠-٩]/g,function(c){var i="٠١٢٣٤٥٦٧٨٩".indexOf(c);return i>-1?String(i):"";}).replace(/\D/g,"").slice(0,4);syncCells();});
    jf.addEventListener("submit",function(e){
      e.preventDefault();
      var hc=document.getElementById("hxCode"),hb=document.getElementById("hxJoinBox");
      if(hc&&hb){hc.value=jc.value;hb.dispatchEvent(new Event("submit",{cancelable:true,bubbles:true}));if(!/^\d{4}$/.test(jc.value))jc.focus();else jc.value="";syncCells();}
    });
  }
  /* عدّاد اللعب */
  hub.addEventListener("click",function(e){
    var c=e.target.closest&&e.target.closest(".hx-card[data-g]");if(!c)return;
    var st=load(),g=c.dataset.g;st[g]={n:((st[g]&&st[g].n)||0)+1,t:Date.now()};save(st);setTimeout(paint,80);
  },true);
  /* رجوع من لعبة: نعيد الأنيميشن ونحدّث */
  var was=!hub.classList.contains("hidden");
  new MutationObserver(function(){
    var now=!hub.classList.contains("hidden");
    if(now&&!was){var p=pages[cur];paint();if(p){p.hidden=true;void p.offsetWidth;p.hidden=false;}requestAnimationFrame(function(){moveInd(cur);fit();});}
    was=now;
  }).observe(hub,{attributes:true,attributeFilter:["class"]});
  (function watchChip(n){
    var c=document.getElementById("accChip");
    if(c){new MutationObserver(function(){paint();}).observe(c,{childList:true});}
    else if(n<40)setTimeout(function(){watchChip(n+1);},500);
  })(0);
  function fit(){
    var hd=hub.querySelector(".hm-head");if(!hd||!navEl)return;
    var top=hd.getBoundingClientRect().bottom+window.scrollY,nav=navEl.getBoundingClientRect().top+window.scrollY;
    var h=Math.floor(nav-top-40);if(h>200)shell.style.setProperty("--pp-avail",h+"px");
  }
  window.addEventListener("resize",function(){moveInd(cur);fit();});
  window.addEventListener("pageshow",paint);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){moveInd(cur);fit();});
  paint();fit();setTimeout(function(){moveInd(cur);paint();fit();},60);setTimeout(function(){moveInd(cur);fit();},600);
  window.PPShell={go:go,paint:paint,brand:brand};
})();
