/* =========================================================
   TAWLA — واجهة اللعب (أوفلاين على جهاز واحد).
   لاعبين اتنين، أو ضد الكمبيوتر (سهل / متوسط / صعب).
   القواعد كلها في js/tawla-engine.js — هنا عرض وتحكم بس.
   المرجع: قواعد ملف ساهر. اللعب أونلاين مرحلة جاية: الحالة (g) متفصلة عن الواجهة عشان كده.
========================================================= */

(function(){
  const $=id=>document.getElementById(id);
  const root=$("tawla");
  if(!root||!window.TawlaEngine)return;
  const E=window.TawlaEngine;

  const KEY="tawlaSettings";
  const W=0,B=1;           // 0 = الأبيض (تحت) · 1 = الأسود (فوق)
  const OUT=E.OUT;         // 25 = وجهة الإخراج

  const S={
    view:0,                // مين اللي اللوحة معروضة من ناحيته (0 أبيض / 1 أسود). الأونلاين هيستخدمها.
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
      S.nameW=String(j.nameW||"").slice(0,14);
      S.nameB=String(j.nameB||"").slice(0,14);
    }catch(e){}
  }
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify({mode:S.mode,diff:S.diff,tray:S.tray,nameW:S.nameW,nameB:S.nameB}));}catch(e){}
  }

  const later=(fn,ms)=>{const t=setTimeout(fn,ms);S.timers.push(t);return t;};
  const clearTimers=()=>{S.timers.forEach(clearTimeout);S.timers=[];};
  const click=()=>{if(typeof playClickSound==="function")playClickSound();};

  const nameOf=p=>{
    if(p===W)return S.nameW.trim()||(S.mode==="cpu"?"أنت":"الأبيض");
    return S.mode==="cpu"?"الكمبيوتر":(S.nameB.trim()||"الأسود");
  };
  const isCpu=p=>S.mode==="cpu"&&p===B;

  /* ---------- العرض ---------- */
  function pieceHTML(side,extra){
    return '<span class="tw-pc '+(side===W?"w":"b")+(extra||"")+'"></span>';
  }
  function stackHTML(side,n,sel){
    if(n<=0)return"";
    const show=Math.min(n,5);
    let h="";
    for(let i=0;i<show;i++){
      const last=i===show-1;
      const cnt=last&&n>5;
      h+='<span class="tw-pc '+(side===W?"w":"b")+(cnt?" cnt":"")+(sel&&last?" sel":"")+'"'+(cnt?' data-n="'+n+'"':"")+'></span>';
    }
    return h;
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

  /* اللوحة الفعلية: خانة فعلية ph (1..24) بترتيب مسار الأبيض.
     الأبيض: q=ph · الأسود: q=25-ph. الصف اللي تحت: ph 12←1 (شمال ← يمين)، اللي فوق: ph 13→24 */
  const qOf=(p,ph)=>p===W?ph:25-ph;

  /* نقش ذهبي في نص كل نص من اللوحة (زي الطاولات الخشب الحقيقية) */
  const MANDALA=(function(){
    let h='<svg viewBox="-50 -50 100 100" class="tw-mand" aria-hidden="true"><g fill="none" stroke="#c9a15a" stroke-width="1.1" stroke-linecap="round">';
    h+='<circle r="47"/><circle r="41"/><circle r="23"/><circle r="9"/>';
    for(let i=0;i<12;i++)h+='<path transform="rotate('+i*30+')" d="M0 -23C9 -29 9 -36 0 -41C-9 -36 -9 -29 0 -23Z"/>';
    for(let i=0;i<12;i++)h+='<circle transform="rotate('+(i*30+15)+') translate(0 -44)" r="1.9"/>';
    for(let i=0;i<8;i++)h+='<path transform="rotate('+i*45+')" d="M0 -9C5 -13 5 -18 0 -23C-5 -18 -5 -13 0 -9Z"/>';
    return h+'</g></svg>';
  })();

  const TRI_TOP='<svg class="tw-tri" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,0 10,0 5,100" vector-effect="non-scaling-stroke"/></svg>';
  const TRI_BOT='<svg class="tw-tri" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="5,0 10,100 0,100" vector-effect="non-scaling-stroke"/></svg>';

  /* الخارج بره اللوحة: نص لكل لاعب جنب الـHOME بتاعه (الأبيض فوق، الأسود تحت لما اللوحة من ناحية الأبيض) */
  function trayHTML(dst){
    const topP=S.view===W?W:B,botP=1-topP;
    const half=p=>{
      const n=S.g.s[p].off;
      const mine=S.turn===p&&S.phase==="move"&&!isCpu(p);
      return '<div class="tw-tray-half'+(mine&&dst[OUT]!==undefined?" dest":"")+'" data-out="1" data-side="'+p+'">'+
        (n>0?'<div class="tw-slot"><span class="tw-pc '+(p===W?"w":"b")+'"><em>'+n+'</em></span></div>':"")+'</div>';
    };
    return half(topP)+half(botP);
  }

  function renderBoard(src,dst){
    const g=S.g;
    const cell=(ph,isTop)=>{
      const w=g.s[W].c[ph],b=g.s[B].c[25-ph];
      const side=w>0?W:B,n=w>0?w:b;
      const q=qOf(S.turn,ph);
      const cls=["tw-pt",ph%2?"o":"e"];
      if(src[q]&&S.sel!==q)cls.push("can");
      if(dst[q]!==undefined)cls.push("dest");
      const pips=dst[q]!==undefined?dst[q].reduce((a,m)=>a+m.die,0):0;
      return '<div class="'+cls.join(" ")+'" data-ph="'+ph+'"'+(pips?' data-pips="'+pips+'"':"")+'>'+(isTop?TRI_TOP:TRI_BOT)+stackHTML(side,n,S.sel===q&&n>0&&side===S.turn)+'</div>';
    };
    const GAP='<i class="tw-gap" aria-hidden="true"></i>';    // الفاصل الرأسي: 6 شمال | 6 يمين
    const seqA=[],seqB=[];                                      // A: 13→24 · B: 12→1
    for(let ph=13;ph<=24;ph++)seqA.push(ph);
    for(let ph=12;ph>=1;ph--)seqB.push(ph);
    const topSeq=S.view===W?seqA:seqB,botSeq=S.view===W?seqB:seqA;
    const row=(seq,isTop)=>{
      let h="";
      seq.forEach((ph,k)=>{h+=cell(ph,isTop);if(k===5)h+=GAP;});
      return '<div class="tw-row '+(isTop?"top":"bot")+'">'+h+'</div>';
    };
    $("twBoard").innerHTML=
      '<div class="tw-field">'+
        '<div class="tw-mandwrap" aria-hidden="true">'+MANDALA+MANDALA+'</div>'+
        row(topSeq,true)+'<div class="tw-mid" aria-hidden="true"></div>'+row(botSeq,false)+
      '</div>';
    $("twTray").innerHTML=trayHTML(dst);
    $("twWrap").classList.toggle("tray-l",S.tray==="l");
  }

  function renderPlayer(p,src,dst){
    const s=S.g.s[p];
    const el=$(p===W?"twPlW":"twPlB");
    el.style.order=((p===W)===(S.view===W))?4:1;               // اللي بيتفرج من ناحيته تحت
    el.classList.toggle("is-turn",S.turn===p&&S.phase!=="over"&&S.phase!=="idle");
    el.querySelector(".tw-pl-name").textContent=nameOf(p)+(isCpu(p)?" 🤖":"");
    el.querySelector(".tw-pl-pts").innerHTML=S.pts[p]+'<small> / 31</small>';
    const mine=S.turn===p&&S.phase==="move"&&!isCpu(p);
    const outDst=mine&&dst[OUT]!==undefined;
    el.querySelector(".tw-chips").innerHTML=
      '<button type="button" class="tw-chip" tabindex="-1"><b>'+E.inHome(s)+'</b><span>في التجميع</span></button>'+
      '<button type="button" class="tw-chip'+(outDst?" dest":"")+'" data-out="1" data-side="'+p+'"><b>'+s.off+'<small style="font-size:11px;opacity:.7">/15</small></b><span>خارج</span></button>';
  }

  function dieHTML(v,used,rolling,side){
    const P={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]}[v]||[];
    let h='<div class="tw-die'+(used?" used":"")+(rolling?" rolling":"")+(side===B?" bd":"")+'" aria-label="'+v+'">';
    for(let i=1;i<=9;i++)h+='<i'+(P.includes(i)?' class="p"':"")+'></i>';
    return h+"</div>";
  }

  function renderDice(rolling){
    const el=$("twDice");
    if(!S.shown){el.innerHTML="";return;}
    const [a,b]=S.shown;
    let h="";
    if(S.phase==="start"){
      h=dieHTML(a,false,rolling,W)+'<span class="tw-die-x">VS</span>'+dieHTML(b,false,rolling,B);
    }else{
      // مين اتستخدم: بنقارن بالمتبقي
      const rem=S.dice.slice();
      const used=v=>{const i=rem.indexOf(v);if(i>-1){rem.splice(i,1);return false;}return true;};
      if(a===b){
        // دبل: أربع حركات
        const left=S.dice.length;
        for(let i=0;i<4;i++)h+=dieHTML(a,i>=left,rolling,S.turn);
      }else{
        h=dieHTML(a,used(a),rolling,S.turn)+dieHTML(b,used(b),rolling,S.turn);
      }
    }
    el.innerHTML=h;
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
    if(canRoll)rb.textContent="ارمِ النرد 🎲";
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
    let n=0;
    const spin=()=>{
      S.shown=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)];
      renderDice(true);
      if(++n<7){later(spin,90);return;}
      const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);
      S.shown=[a,b];renderDice(false);
      if(a===b){
        setStatus("تعادل "+a+" — إعادة الرمية");
        later(openingRoll,1100);
        return;
      }
      S.turn=a>b?W:B;
      setStatus(nameOf(S.turn)+" يبدأ الجيم 🎯");
      later(()=>beginTurn(),1300);
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
    let n=0;
    S.phase="rolling";
    render();
    const spin=()=>{
      S.shown=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)];
      S.dice=S.shown.slice();
      renderDice(true);
      if(++n<7){later(spin,85);return;}
      const r=E.rollDice();
      S.shown=[r.a,r.b];S.dice=r.list.slice();
      S.phase="move";
      renderDice(false);
      afterRoll(r);
    };
    spin();
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
    if(!was&&S.g.s[S.turn].unlocked)setStatus("اتفتح اللعب ✨","دلوقتي حرّك أي قشاطة، حتى من أول خانة");
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
    $("twFinalTitle").textContent=done?"🏆 "+nameOf(w)+" كسب المباراة":nameOf(w)+" كسب الجيم "+S.game;
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
    S.nameW=$("twNameW").value;
    if(S.mode!=="cpu")S.nameB=$("twNameB").value;
  }
  function syncSetup(){
    root.querySelectorAll("#twModeSeg button").forEach(b=>b.classList.toggle("is-on",b.dataset.v===S.mode));
    root.querySelectorAll("#twTraySeg button").forEach(b=>b.classList.toggle("is-on",b.dataset.v===S.tray));
    root.querySelectorAll("#twDiffSeg button").forEach(b=>b.classList.toggle("is-on",b.dataset.v===S.diff));
    $("twDiffWrap").classList.toggle("hidden",S.mode!=="cpu");
    const o=$("twNameB");
    o.disabled=S.mode==="cpu";
    o.value=S.mode==="cpu"?"الكمبيوتر":S.nameB;
    o.placeholder="الأسود";
    $("twNameW").value=S.nameW;
    $("twNameW").placeholder=S.mode==="cpu"?"أنت":"الأبيض";
  }
  function seg(id,fn){
    $(id).addEventListener("click",e=>{
      const b=e.target.closest("button[data-v]");
      if(!b)return;
      click();captureNames();fn(b.dataset.v);syncSetup();
    });
  }
  seg("twModeSeg",v=>{S.mode=v;});
  seg("twTraySeg",v=>{S.tray=v;});
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
  window.tawlaHome=function(){
    click();clearTimers();S.phase="idle";document.body.classList.remove("tw-playing");
    show("hub");
  };

  /* لو الصفحة اتقفلت / رجعت بزر الموبايل */
  window.addEventListener("popstate",()=>{
    if(root.classList.contains("hidden")){clearTimers();}
  });
})();
