/* =========================================================
   TAWLA — واجهة اللعب (أوفلاين على جهاز واحد).
   لاعبين اتنين، أو ضد الكمبيوتر (سهل / متوسط / صعب).
   القواعد كلها في js/tawla-engine.js — هنا عرض وتحكم بس.
   المرجع: قواعد ملف ساهر. رسم اللوحة والنرد في js/tawla-ui.js (مشترك مع الأونلاين: js/online-tawla.js).
========================================================= */

(function(){
  const $=id=>document.getElementById(id);
  const root=$("tawla");
  if(!root||!window.TawlaEngine||!window.TawlaUI)return;
  const E=window.TawlaEngine,UI=window.TawlaUI;

  const KEY="tawlaSettings";
  const W=0,B=1;           // 0 = الأبيض (تحت) · 1 = الأسود (فوق)
  const OUT=E.OUT;         // 25 = وجهة الإخراج

  const S={
    view:1,                // مين اللي اللوحة معروضة من ناحيته = اللون اللي بتلعب بيه (0 أبيض / 1 أسود). الأسود هو الافتراضي.
    tray:"r",              // مكان التجميع بره اللوحة: r يمين / l شمال
    mode:"pvp",            // pvp | cpu
    diff:"mid",            // easy | mid | hard
    nameW:"",nameB:"",
    g:null,turn:W,
    pts:[0,0],game:1,hist:[],last:null,   // last = كاسب الجيم اللي فات (هو اللي يبدأ اللي بعده)
    dice:[],shown:null,    // dice = اللي لسه متاح · shown = [a,b] المعروض
    phase:"idle",          // idle | start | roll | move | cpu | over
    sel:null,
    timers:[]
  };

  /* ---------- حفظ الإعدادات ---------- */
  function load(){
    try{
      const j=JSON.parse(localStorage.getItem(KEY)||"null");
      if(!j)return;
      if(j.mode==="pvp"||j.mode==="cpu")S.mode=j.mode;
      if(["easy","mid","hard"].includes(j.diff))S.diff=j.diff;
      if(j.tray==="l"||j.tray==="r")S.tray=j.tray;
      if(j.side==="w")S.view=W;else if(j.side==="b")S.view=B;
      S.nameW=String(j.nameW||"").slice(0,14);
      S.nameB=String(j.nameB||"").slice(0,14);
    }catch(e){}
  }
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify({mode:S.mode,diff:S.diff,tray:S.tray,side:S.view===W?"w":"b",nameW:S.nameW,nameB:S.nameB}));}catch(e){}
  }

  const later=(fn,ms)=>{const t=setTimeout(fn,ms);S.timers.push(t);return t;};
  const clearTimers=()=>{S.timers.forEach(clearTimeout);S.timers=[];};
  const click=()=>{if(typeof playClickSound==="function")playClickSound();};

  const isCpu=p=>S.mode==="cpu"&&p!==S.view;      // ضد الكمبيوتر: هو اللون التاني غير اللي بتلعب بيه
  const nameOf=p=>{
    if(isCpu(p))return "الكمبيوتر";
    const n=(p===W?S.nameW:S.nameB).trim();
    return n||(S.mode==="cpu"?"أنت":(p===W?"الأبيض":"الأسود"));
  };

  /* ---------- العرض ---------- */
  function pieceHTML(side,extra){
    return '<span class="tw-pc '+(side===W?"w":"b")+(extra||"")+'"></span>';
  }
  /* خرايط: المصادر اللي ليها حركة، والوجهات من المصدر المختار */
  function sources(){
    const set={};
    if(S.phase!=="move"||isCpu(S.turn))return set;
    E.movesFor(S.g,S.turn,S.dice).forEach(m=>{set[m.from]=1;});
    return set;
  }
  /* الأماكن اللي القشاطة المختارة توصلها: نرد فردي، أو النردين مع بعض (مدموج) لو الطريق مفتوح.
     القيمة = [الحركة]. لو أكتر من نرد يوصل لنفس المكان (الإخراج) بناخد الأصغر الأول. */
  function dests(){
    const map={};
    if(S.phase!=="move"||isCpu(S.turn)||S.sel===null)return map;
    E.movesFor(S.g,S.turn,S.dice).forEach(m=>{
      if(m.from!==S.sel)return;
      if(map[m.to]===undefined)map[m.to]=[m];
    });
    return map;
  }

  const qOf=UI.qOf;

  function renderBoard(src,dst){
    const v=UI.boardHTML({g:S.g,view:S.view,turn:S.turn,sel:S.sel,src:src,dst:dst,tray:S.tray,
      trayMine:p=>S.turn===p&&S.phase==="move"&&!isCpu(p)});
    $("twBoard").innerHTML=v.board;
    $("twTray").innerHTML=v.tray;
    $("twWrap").classList.toggle("tray-l",v.trayLeft);   // الخارج جنب منطقة التجميع (أو عكسها) في الاتجاهين
  }

  function renderPlayer(p,src,dst){
    const s=S.g.s[p];
    const el=$(p===W?"twPlW":"twPlB");
    el.style.order=((p===W)===(S.view===W))?4:1;               // اللي بيتفرج من ناحيته تحت
    el.classList.toggle("is-turn",S.turn===p&&S.phase!=="over"&&S.phase!=="idle");
    el.querySelector(".tw-pl-name").textContent=nameOf(p);
    el.querySelector(".tw-pl-pts").innerHTML=S.pts[p]+'<small> / 31</small>';
    const mine=S.turn===p&&S.phase==="move"&&!isCpu(p);
    const outDst=mine&&dst[OUT]!==undefined;
    el.querySelector(".tw-chips").innerHTML=
      '<button type="button" class="tw-chip" tabindex="-1"><b>'+E.inHome(s)+'</b><span>في التجميع</span></button>'+
      '<button type="button" class="tw-chip'+(outDst?" dest":"")+'" data-out="1" data-side="'+p+'"><b>'+s.off+'<small style="font-size:11px;opacity:.7">/15</small></b><span>خارج</span></button>';
  }

  /* rolling=true: النرد بيتدحرج (الأنيميشن في CSS، والوشوش بتتقلّب من UI.flicker) */
  function renderDice(rolling){
    const el=$("twDice");
    if(!S.shown){el.innerHTML="";return;}
    const [a,b]=S.shown;
    if(S.phase==="start"){
      el.innerHTML=UI.diceHTML([a,b],{sides:[W,B],toss:rolling,vs:true});
      return;
    }
    const vals=a===b?[a,a,a,a]:[a,b];
    let used=null;
    if(!rolling){
      if(a===b){const left=S.dice.length;used=vals.map((_,i)=>i>=left);}
      else{
        const rem=S.dice.slice();     // مين اتستخدم: بنقارن بالمتبقي
        used=vals.map(v=>{const i=rem.indexOf(v);if(i>-1){rem.splice(i,1);return false;}return true;});
      }
    }
    el.innerHTML=UI.diceHTML(vals,{used:used,side:S.turn,toss:rolling});
  }

  function setStatus(main,sub){
    $("twStatus").innerHTML=main+(sub?"<small>"+sub+"</small>":"");
  }

  function render(){
    if(!S.g)return;
    const src=sources(),dst=dests();
    renderBoard(src,dst);
    renderPlayer(B,src,dst);
    renderPlayer(W,src,dst);
    const rb=$("twRoll");
    const canRoll=S.phase==="roll"&&!isCpu(S.turn);
    rb.classList.toggle("hidden",!canRoll);
  }

  /* ---------- سير اللعب ---------- */
  function showView(which){
    $("twSetup").classList.toggle("hidden",which!=="setup");
    $("twPlay").classList.toggle("hidden",which!=="play");
    $("twGear").classList.toggle("is-off",which!=="play");
    $("twFinal").classList.add("hidden");
    document.body.classList.toggle("tw-playing",which==="play");
  }

  function startMatch(){
    clearTimers();
    S.pts=[0,0];S.game=1;S.hist=[];S.last=null;
    newGame();
  }

  /* أول جيم في المباراة: رمية بداية. بعد كده اللي كسب الجيم اللي فات هو اللي يبدأ. */
  function newGame(){
    clearTimers();
    S.g=E.newGame();S.sel=null;S.dice=[];S.shown=null;
    $("twFinal").classList.add("hidden");
    if(S.last===null){
      S.phase="start";
      setStatus("رمية البداية","اللي رقمه أعلى يبدأ الجيم "+S.game);
      render();
      openingRoll();
    }else{
      S.turn=S.last;
      beginTurn();
    }
  }

  function openingRoll(){
    const spin=()=>{
      const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);
      S.shown=[a,b];renderDice(true);
      UI.flicker($("twDice"),[a,b],UI.TOSS_MS-60);
      later(()=>{
        renderDice(false);
        if(a===b){
          setStatus("تعادل "+a+" — إعادة الرمية");
          later(openingRoll,1100);
          return;
        }
        S.turn=a>b?W:B;
        setStatus(nameOf(S.turn)+" يبدأ الجيم");
        later(()=>beginTurn(),1300);
      },UI.TOSS_MS);
    };
    later(spin,250);
  }

  function beginTurn(){
    S.sel=null;S.dice=[];
    S.phase="roll";
    setStatus("دور "+nameOf(S.turn),isCpu(S.turn)?"الكمبيوتر بيفكر…":"ارمِ النرد");
    $("twDice").innerHTML="";S.shown=null;
    render();
    if(isCpu(S.turn))later(doRoll,700);
  }

  function doRoll(){
    if(S.phase!=="roll")return;
    click();
    const r=E.rollDice();
    S.phase="rolling";S.dice=[];S.shown=[r.a,r.b];
    render();
    renderDice(true);
    UI.flicker($("twDice"),r.list,UI.TOSS_MS-60);
    later(()=>{
      S.dice=r.list.slice();S.phase="move";
      renderDice(false);
      afterRoll(r);
    },UI.TOSS_MS);
  }
  window.tawlaRoll=doRoll;

  const lockNote=p=>S.g.s[p].unlocked?"":"لسه قشاطة واحدة بس تتحرك — وصّلها آخر ربع (18 خطوة) وباقي القشاط يتفتح";

  function afterRoll(r){
    if(!E.hasMove(S.g,S.turn,S.dice)){
      setStatus("مفيش حركة قانونية لـ"+nameOf(S.turn),"الدور بيعدّي");
      S.phase="cpu";render();
      later(endTurn,1500);
      return;
    }
    const dbl=r.a===r.b;
    setStatus("دور "+nameOf(S.turn)+(dbl?" — دبل! 4 حركات":""),isCpu(S.turn)?"الكمبيوتر بيلعب…":lockNote(S.turn));
    render();
    if(isCpu(S.turn)){S.phase="cpu";later(cpuPlay,700);}
  }

  function applyOne(m){
    const was=S.g.s[S.turn].unlocked;
    E.applyMove(S.g,S.turn,m);
    S.dice=E.consume(S.dice,m);
    if(!was&&S.g.s[S.turn].unlocked)setStatus("اتفتح اللعب","دلوقتي حرّك أي قشاطة، حتى من أول خانة");
  }
  function afterMoves(){
    S.sel=null;
    const w=E.winner(S.g);
    if(w>-1){S.phase="over";renderDice(false);render();later(()=>endGame(w),700);return;}
    renderDice(false);
    if(!S.dice.length){S.phase="ending";render();later(endTurn,500);return;}
    if(!E.hasMove(S.g,S.turn,S.dice)){
      setStatus("مفيش حركة قانونية للباقي","الدور بيعدّي");
      S.phase="ending";
      render();
      later(endTurn,1300);
      return;
    }
    render();
  }
  function doMove(m){applyOne(m);afterMoves();}

  function endTurn(){
    if(S.phase==="over")return;
    S.turn=1-S.turn;
    beginTurn();
  }

  /* ---------- الكمبيوتر ---------- */
  function cpuPlay(){
    if(S.phase!=="cpu")return;
    const turns=E.enumerateTurns(S.g,S.turn,S.dice);
    if(!turns.length){endTurn();return;}
    let pick;
    if(S.diff==="easy"){
      pick=turns[Math.floor(Math.random()*turns.length)];
    }else{
      const hard=S.diff==="hard";
      let best=-Infinity;
      turns.forEach(t=>{
        let v=E.evaluate(t.g,S.turn);
        if(!hard)v+=(Math.random()-.5)*14;
        if(v>best){best=v;pick=t;}
      });
    }
    const seq=pick.moves.slice();
    const step=()=>{
      if(S.phase==="over")return;
      const m=seq.shift();
      if(!m)return;
      S.sel=m.from;render();
      later(()=>{
        // الحركة لسه قانونية (نفس التسلسل)
        const ok=E.movesFor(S.g,S.turn,S.dice).some(x=>x.from===m.from&&x.to===m.to&&x.die===m.die&&!!x.combined===!!m.combined);
        if(!ok){endTurn();return;}
        doMove(m);
        if(S.phase==="cpu"&&seq.length)later(step,520);
      },380);
    };
    step();
  }

  /* ---------- نهاية الجيم ---------- */
  function endGame(w){
    S.phase="over";
    const pts=E.gamePoints(S.g,w);
    S.pts[w]+=pts;S.last=w;
    S.hist.push({g:S.game,w:w,pts:pts});
    const done=S.pts[w]>=E.WIN_AT;
    const hist=S.hist.map(h=>'<div>جيم '+h.g+': '+nameOf(h.w)+' +'+h.pts+'</div>').join("");
    $("twFinalMark").innerHTML=pieceHTML(w);
    $("twFinalTitle").textContent=done?nameOf(w)+" كسب المباراة":nameOf(w)+" كسب الجيم "+S.game;
    $("twFinalSub").textContent=done
      ?"وصل "+S.pts[w]+" نقطة"
      :"+"+pts+" نقطة (15 − "+S.g.s[1-w].off+" خرجوا من الخصم)";
    $("twFinalScore").textContent=S.pts[W]+" : "+S.pts[B];
    $("twHist").innerHTML=hist;
    $("twAgain").textContent=done?"مباراة جديدة":"الجيم التالي";
    $("twAgain").onclick=done?tawlaRematch:tawlaNextGame;
    $("twFinal").classList.remove("hidden");
    render();
  }
  window.tawlaNextGame=function(){click();S.game++;newGame();};
  window.tawlaRematch=function(){click();startMatch();};

  /* ---------- لمس اللوحة ---------- */
  function onTap(e){
    if(S.phase!=="move"||isCpu(S.turn))return;
    const t=e.target.closest("[data-out],[data-ph]");
    if(!t)return;
    if(t.dataset.side!==undefined&&+t.dataset.side!==S.turn)return;
    const q=t.dataset.out?OUT:qOf(S.turn,+t.dataset.ph);
    const dst=dests();
    if(S.sel!==null&&dst[q]!==undefined){
      click();doMove(dst[q][0]);return;
    }
    const src=sources();
    if(q!==OUT&&src[q]&&S.sel!==q){click();S.sel=q;render();return;}
    if(S.sel!==null){S.sel=null;render();}
  }
  $("twPlay").addEventListener("click",onTap);

  /* ---------- الإعدادات ---------- */
  function captureNames(){
    const w=$("twNameW"),b=$("twNameB");
    if(!w.disabled)S.nameW=w.value;
    if(!b.disabled)S.nameB=b.value;
  }
  function syncSetup(){
    root.querySelectorAll("#twModeSeg button").forEach(b=>b.classList.toggle("is-on",b.dataset.v===S.mode));
    root.querySelectorAll("#twTraySeg button").forEach(b=>b.classList.toggle("is-on",b.dataset.v===S.tray));
    root.querySelectorAll("#twDiffSeg button").forEach(b=>b.classList.toggle("is-on",b.dataset.v===S.diff));
    $("twDiffWrap").classList.toggle("hidden",S.mode!=="cpu");
    root.querySelectorAll("#twSideSeg button").forEach(b=>b.classList.toggle("is-on",b.dataset.v===(S.view===W?"w":"b")));
    if($("twSideLbl"))$("twSideLbl").textContent=S.mode==="cpu"?"هتلعب بأنهي لون؟":"اللوحة تتعرض من ناحية أنهي لون؟";
    const cpuSide=S.mode==="cpu"?1-S.view:-1,iw=$("twNameW"),ib=$("twNameB");
    iw.disabled=cpuSide===W;iw.value=iw.disabled?"الكمبيوتر":S.nameW;
    ib.disabled=cpuSide===B;ib.value=ib.disabled?"الكمبيوتر":S.nameB;
    iw.placeholder=S.mode==="cpu"?"أنت":"الأبيض";
    ib.placeholder=S.mode==="cpu"?"أنت":"الأسود";
  }
  function seg(id,fn){
    if(!$(id))return;
    $(id).addEventListener("click",e=>{
      const b=e.target.closest("button[data-v]");
      if(!b)return;
      click();captureNames();fn(b.dataset.v);syncSetup();
    });
  }
  seg("twModeSeg",v=>{S.mode=v;});
  seg("twTraySeg",v=>{S.tray=v;});
  seg("twSideSeg",v=>{S.view=v==="w"?W:B;});
  seg("twDiffSeg",v=>{S.diff=v;});

  window.tawlaOpen=function(){
    load();clearTimers();S.phase="idle";
    syncSetup();showView("setup");
    show("tawla");
  };
  window.tawlaShowSetup=function(){
    click();clearTimers();S.phase="idle";
    syncSetup();showView("setup");
  };
  /* الأونلاين: كل لاعب يشوف اللوحة من ناحيته (لاعبه تحت) — tawlaSetView(0|1) */
  window.tawlaSetView=function(p){S.view=p===B?B:W;if(S.g)render();};
  window.tawlaStart=function(){
    click();captureNames();save();
    showView("play");
    startMatch();
  };
  /* أونلاين: نظام الغرف بتاع الموقع (js/online.js) هو اللي بيفتح غرفة الطاولة */
  window.tawlaOnline=function(){
    if(window.OL&&OL.open){click();OL.open("tawla");}
    else if(typeof toast==="function")toast("سجّل دخولك الأول عشان تلعب أونلاين");
  };

  window.tawlaHome=function(){
    click();clearTimers();S.phase="idle";document.body.classList.remove("tw-playing");
    show("hub");
  };

  /* لو الصفحة اتقفلت / رجعت بزر الموبايل */
  window.addEventListener("popstate",()=>{
    if(root.classList.contains("hidden")){clearTimers();}
  });
})();
