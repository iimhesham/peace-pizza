/* =========================================================
   حساب جوجل (Firebase Auth) + مزامنة «اللي اتلعب قبل كده» على السيرفر
   مفيش حاجة بتتغير في اللعب نفسه: لو فشل أي شيء الموقع بيكمّل عادي بالمحفوظ على الجهاز.
========================================================= */
(function(){
  var cfg=window.FIREBASE_WEB_CONFIG||(typeof FIREBASE_WEB_CONFIG!=="undefined"?FIREBASE_WEB_CONFIG:null);
  if(!cfg||!cfg.apiKey||!cfg.appId)return; /* مش متفعّل لسه */

  var SDK="https://www.gstatic.com/firebasejs/10.12.2/";
  var auth=null,user=null,chip,pop,pushTimer=null;
  var KEYS=["story","career"];

  function dbUrl(){
    try{if(typeof DEFAULT_LIVE_DB_URL==="string")return DEFAULT_LIVE_DB_URL.replace(/\/$/,"");}catch(e){}
    return "";
  }
  function say(m){try{toast(m);}catch(e){}}
  function loadScript(src){
    return new Promise(function(res,rej){
      var s=document.createElement("script");s.src=src;s.onload=res;s.onerror=function(){rej(new Error("load "+src));};
      document.head.appendChild(s);
    });
  }

  /* ---------- واجهة: شريحة الحساب ---------- */
  var G='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4-5.5 4a6.1 6.1 0 1 1 0-12.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6A9.9 9.9 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.8 0-.7-.1-1.2-.2-1.9z"/></svg>';
  function build(){
    var host=document.querySelector("#hub .hm-head-c");if(!host)return;
    host.style.position="relative";
    chip=document.createElement("button");chip.type="button";chip.className="acc-chip";chip.id="accChip";
    pop=document.createElement("div");pop.className="acc-pop hidden";pop.id="accPop";
    host.appendChild(chip);host.appendChild(pop);
    chip.addEventListener("click",function(){
      if(typeof playClickSound==="function")playClickSound();
      if(!auth)return;
      if(!user){signIn();}else if(window.OL&&OL.account){OL.account();}else{pop.classList.toggle("hidden");}
    });
    document.addEventListener("click",function(e){
      if(!pop.classList.contains("hidden")&&!pop.contains(e.target)&&e.target!==chip&&!chip.contains(e.target))pop.classList.add("hidden");
    });
    render();
  }
  function render(){
    if(!chip)return;
    if(!user){
      chip.className="acc-chip";chip.innerHTML=G+'<span>دخول</span>';chip.setAttribute("aria-label","تسجيل الدخول بحساب جوجل");
      pop.classList.add("hidden");return;
    }
    chip.className="acc-chip in";
    var img=user.photoURL?'<img alt="" referrerpolicy="no-referrer" src="'+user.photoURL.replace(/"/g,"")+'">':'<b>'+(user.displayName||"?").trim().charAt(0)+'</b>';
    chip.innerHTML=img;chip.setAttribute("aria-label","حسابي");
    var name=(user.displayName||"لاعب").replace(/[<>&"]/g,"");
    pop.innerHTML='<div class="acc-name">'+name+'</div><div class="acc-mail" dir="ltr">'+(user.email||"").replace(/[<>&"]/g,"")+'</div><button type="button" class="acc-out">تسجيل خروج</button>';
    pop.querySelector(".acc-out").addEventListener("click",function(){
      if(typeof playClickSound==="function")playClickSound();
      auth.signOut().then(function(){say("اتسجّل خروج");});
    });
  }

  /* ---------- الدخول ---------- */
  function signIn(){
    var provider=new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    auth.signInWithPopup(provider).catch(function(e){
      var c=e&&e.code;
      if(c==="auth/popup-closed-by-user"||c==="auth/cancelled-popup-request")return;
      if(c==="auth/popup-blocked"){auth.signInWithRedirect(provider);return;}
      if(c==="auth/unauthorized-domain"){say("الدومين ده مش مضاف في Firebase (Authorized domains)");return;}
      if(c==="auth/operation-not-allowed"){say("تسجيل جوجل مش مفعّل في Firebase");return;}
      say("فشل تسجيل الدخول");
    });
  }

  window.ppSignOut=function(){if(auth)auth.signOut().then(function(){say("اتسجّل خروج");});};

  /* ---------- مزامنة السيرفر ---------- */
  async function token(){return user?await user.getIdToken():null;}
  async function pull(){
    var base=dbUrl();if(!base||!user)return;
    try{
      var t=await token();
      var r=await fetch(base+"/users/"+user.uid+"/seen.json?auth="+t);
      if(!r.ok)throw new Error(r.status);
      var remote=(await r.json())||{};
      KEYS.forEach(function(k){
        var rem=Array.isArray(remote[k])?remote[k]:(remote[k]&&typeof remote[k]==="object"?Object.values(remote[k]):[]);
        var loc=seenGet(k);
        var merged=rem.filter(function(n){return loc.indexOf(n)<0;}).concat(loc);
        if(merged.length!==loc.length)rawSave(k,merged);
      });
      await push();
    }catch(e){/* بنكمّل بالمحلي */}
  }
  function rawSave(k,a){try{localStorage.setItem("seen_"+k,JSON.stringify(a.slice(-600)));}catch(e){}}
  async function push(){
    var base=dbUrl();if(!base||!user)return;
    try{
      var t=await token(),body={};
      KEYS.forEach(function(k){body[k]=seenGet(k);});
      await fetch(base+"/users/"+user.uid+"/seen.json?auth="+t,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      await fetch(base+"/users/"+user.uid+"/profile.json?auth="+t,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:user.displayName||"",email:(user.email||(user.providerData&&user.providerData[0]&&user.providerData[0].email)||"").toLowerCase(),photo:user.photoURL||"",updated:Date.now()})});
    }catch(e){}
  }
  function schedulePush(){
    if(!user)return;clearTimeout(pushTimer);pushTimer=setTimeout(push,2500);
  }
  /* أي حفظ في ذاكرة اللي اتلعب → ادفعه للسيرفر (لو داخل) */
  if(typeof window.seenSave==="function"){
    var orig=window.seenSave;
    window.seenSave=function(key,a){orig(key,a);schedulePush();};
  }

  /* ---------- تشغيل ---------- */
  function start(){
    build();
    Promise.all([loadScript(SDK+"firebase-app-compat.js"),loadScript(SDK+"firebase-auth-compat.js")]).then(function(){
      firebase.initializeApp(cfg);
      auth=firebase.auth();
      auth.onAuthStateChanged(function(u){
        var was=user;user=u||null;render();window.ppUser=user;
        if(user){if(!was)say("أهلًا "+((user.displayName||"").split(" ")[0]||"بيك"));pull();}
      });
      auth.getRedirectResult().catch(function(){});
      loadScript("js/online.js?v=6").catch(function(){});
    }).catch(function(){if(chip)chip.style.display="none";});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
