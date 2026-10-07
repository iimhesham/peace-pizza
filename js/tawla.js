/* =========================================================
   TAWLA — واجهة اللعب (أوفلاين على جهاز واحد).
   لاعبين اتنين، أو ضد الكمبيوتر (سهل / متوسط / صعب).
   القواعد كلها في js/tawla-engine.js — هنا عرض وتحكم بس.
   اللعب أونلاين مرحلة جاية: الحالة (g) متفصلة عن الواجهة عشان كده.
========================================================= */

(function(){
  const $=id=>document.getElementById(id);
  const root=$("tawla");
  if(!root||!window.TawlaEngine)return;
  const E=window.TawlaEngine;

  const KEY="tawlaSettings";
  const W=0,B=1;           // 0 = الأبيض (تحت) · 1 = الأسود (فوق)
  const OUT=E.OUT;

  const S={
    mode:"pvp",            // pvp | cpu
    diff:"mid",            // easy | mid | hard
    nameW:"",nameB:"",
    g:null,turn:W,
    pts:[0,0],game:1,hist:[],
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
      S.nameW=String(j.nameW||"").slice(0,14);
      S.nameB=String(j.nameB||"").slice(0,14);
    }catch(e){}
  }
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify({mode:S.mode,diff:S.diff,nameW:S.nameW,nameB:S.nameB}));}catch(e){}
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
  /* كل الأماكن اللي القشاطة المختارة توصلها بنرد واحد أو أكتر (مجموع الأرقام)،
     بشرط إن كل خانة في الطريق تكون مفتوحة. القيمة = تسلسل الحركات. */
  function dests(){
    const map={};
    if(S.phase!=="move"||isCpu(S.turn)||S.sel===null)return map;
    const me=S.turn;
    (function rec(g,pos,rem,seq){
      const ds=[...new Set(rem)].sort((a,b)=>a-b);
      ds.forEach(d=>{
        E.legalMoves(g,me,d).forEach(m=>{
          if(m.from!==pos)return;
          const s2=seq.concat([m]);
          if(!map[m.to]||map[m.to].length>s2.length)map[m.to]=s2;
          if(m.to!==OUT)rec(E.applyMove(E.clone(g),me,m),m.to,E.removeDie(rem,d),s2);
        });
      });
    })(S.g,S.sel,S.dice,[]);
    return map;
  }

  /* اللوحة الفعلية: خانة فعلية ph (1..24) بترتيب مسار الأبيض.
     الأبيض: q=ph · الأسود: q=25-ph. الصف اللي تحت: ph 12←1 (شمال ← يمين)، اللي فوق: ph 13→24 */
  const qOf=(p,ph)=>p===W?ph:25-ph;

  function stripHTML(p,src,dst){
    const mine=S.turn===p&&S.phase==="move"&&!isCpu(p);
    const c=S.g.s[p].c;
    let h="";
    for(let slot=6;slot>=1;slot--){          // شمال ← يمين = 6..1
      const q=31-slot,n=c[q];
      const cls=["tw-slot"];
      if(mine&&src[q]&&S.sel!==q)cls.push("can");
      if(mine&&S.sel===q)cls.push("sel");
      if(mine&&dst[q]!==undefined)cls.push("dest");
      h+='<div class="'+cls.join(" ")+'" data-q="'+q+'" data-side="'+p+'"><i>'+slot+'</i>'+(n>0?pieceHTML(p,S.sel===q&&mine?" sel":"")+(n>1?'<em>×'+n+'</em>':""):"")+'</div>';
    }
    const lbl=p===W?"تجميع الأبيض · بداية الأسود":"تجميع الأسود · بداية الأبيض";
    return '<div class="tw-strip"><span class="tw-strip-l">'+lbl+'</span><div class="tw-slots">'+h+'</div></div>';
  }

  function renderBoard(src,dst){
    const g=S.g;
    const cell=ph=>{
      const w=g.s[W].c[ph],b=g.s[B].c[25-ph];
      const side=w>0?W:B,n=w>0?w:b;
      const q=qOf(S.turn,ph);
      const cls=["tw-pt",ph%2?"o":"e"];
      if(src[q]&&S.sel!==q)cls.push("can");
      if(dst[q]!==undefined)cls.push("dest");
      const pips=dst[q]!==undefined?dst[q].reduce((a,m)=>a+m.die,0):0;
      return '<div class="'+cls.join(" ")+'" data-ph="'+ph+'"'+(pips?' data-pips="'+pips+'"':"")+'>'+stackHTML(side,n,S.sel===q&&n>0&&side===S.turn)+'</div>';
    };
    let top="",bot="";
    for(let ph=13;ph<=24;ph++)top+=cell(ph);      // فوق: شمال ← يمين
    for(let ph=12;ph>=1;ph--)bot+=cell(ph);       // تحت: شمال ← يمين
    $("twBoard").innerHTML=
      stripHTML(W,src,dst)+
      '<div class="tw-row top">'+top+'</div>'+
      '<div class="tw-mid" aria-hidden="true"></div>'+
      '<div class="tw-row bot">'+bot+'</div>'+
      stripHTML(B,src,dst);
  }

  function renderPlayer(p,src,dst){
    const s=S.g.s[p],c=s.c;
    const el=$(p===W?"twPlW":"twPlB");
    el.classList.toggle("is-turn",S.turn===p&&S.phase!=="over"&&S.phase!=="idle");
    el.querySelector(".tw-pl-name").textContent=nameOf(p)+(isCpu(p)?" 🤖":"");
    el.querySelector(".tw-pl-pts").innerHTML=S.pts[p]+'<small> / 31</small>';

    const mine=S.turn===p&&S.phase==="move"&&!isCpu(p);
    const startCan=mine&&src[0]&&S.sel!==0;
    const startSel=mine&&S.sel===0;
    const outDst=mine&&dst[OUT]!==undefined;
    const chips=
      '<button type="button" class="tw-chip'+(startCan?" can":"")+(startSel?" sel":"")+'" data-q="0" data-side="'+p+'"><b>'+c[0]+'</b><span>في البداية</span></button>'+
      '<button type="button" class="tw-chip" tabindex="-1"><b>'+E.onTrack(s)+'</b><span>على اللوحة</span></button>'+
      '<button type="button" class="tw-chip" tabindex="-1"><b>'+E.inHome(s)+'</b><span>في التجميع</span></button>'+
      '<button type="button" class="tw-chip'+(outDst?" dest":"")+'" data-out="1" data-side="'+p+'"><b>'+s.eaten+'<small style="font-size:11px;opacity:.7">/15</small></b><span>اتاكلت</span></button>';
    el.querySelector(".tw-chips").innerHTML=chips;

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
    const me=S.g.s[S.turn];
    let hint="";
    if(S.phase==="move"&&!isCpu(S.turn)){
      if(S.sel===null)hint=me.unlocked?"اختار قشاطة تحركها":"قشاطة واحدة بس تتحرك لحد ما تدخل التجميع";
      else hint="الأخضر = أماكن توصلها برقم أو بمجموع الأرقام (والرقم على النقطة = عدد الخطوات)";
    }
    $("twHint").textContent=hint;
  }

  /* ---------- سير اللعب ---------- */
  function showView(which){
    $("twSetup").classList.toggle("hidden",which!=="setup");
    $("twPlay").classList.toggle("hidden",which!=="play");
    $("twGear").classList.toggle("is-off",which!=="play");
    $("twFinal").classList.add("hidden");
  }

  function startMatch(){
    clearTimers();
    S.pts=[0,0];S.game=1;S.hist=[];
    newGame();
  }

  function newGame(){
    clearTimers();
    S.g=E.newGame();S.sel=null;S.dice=[];S.shown=null;
    S.phase="start";
    $("twFinal").classList.add("hidden");
    setStatus("رمية البداية","اللي رقمه أعلى يبدأ الجيم "+S.game);
    render();
    openingRoll();
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

  function afterRoll(r){
    if(!E.hasMove(S.g,S.turn,S.dice)){
      setStatus("مفيش حركة قانونية لـ"+nameOf(S.turn),"الدور بيعدّي");
      S.phase="cpu";render();
      later(endTurn,1500);
      return;
    }
    const dbl=r.a===r.b;
    setStatus("دور "+nameOf(S.turn)+(dbl?" — دبل! 4 حركات":""),isCpu(S.turn)?"الكمبيوتر بيلعب…":"");
    render();
    if(isCpu(S.turn)){S.phase="cpu";later(cpuPlay,700);}
  }

  function applyOne(m){
    E.applyMove(S.g,S.turn,m);
    S.dice=E.removeDie(S.dice,m.die);
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
  /* حركة مركّبة (أكتر من نرد بنفس القشاطة): بتتنفذ خطوة خطوة */
  function doSeq(seq){
    if(seq.length===1){doMove(seq[0]);return;}
    const prev=S.phase;
    S.phase="busy";
    let i=0;
    const step=()=>{
      applyOne(seq[i]);
      S.sel=seq[i].to===OUT?null:seq[i].to;
      i++;
      renderDice(false);render();
      if(i<seq.length){later(step,230);return;}
      S.phase=prev;
      afterMoves();
    };
    step();
  }

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
        const ok=E.legalMoves(S.g,S.turn,m.die).some(x=>x.from===m.from&&x.to===m.to);
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
    S.pts[w]+=pts;
    S.hist.push({g:S.game,w:w,pts:pts});
    const done=S.pts[w]>=E.WIN_AT;
    const hist=S.hist.map(h=>'<div>جيم '+h.g+': '+nameOf(h.w)+' +'+h.pts+'</div>').join("");
    $("twFinalMark").innerHTML=pieceHTML(w);
    $("twFinalTitle").textContent=done?"🏆 "+nameOf(w)+" كسب المباراة":nameOf(w)+" كسب الجيم "+S.game;
    $("twFinalSub").textContent=done
      ?"وصل "+S.pts[w]+" نقطة"
      :"+"+pts+" نقطة (15 − "+S.g.s[1-w].eaten+" اتاكلوا من الخصم)";
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
    const t=e.target.closest("[data-q],[data-out],[data-ph]");
    if(!t)return;
    if(t.dataset.side!==undefined&&+t.dataset.side!==S.turn)return;
    const q=t.dataset.out?OUT:(t.dataset.ph?qOf(S.turn,+t.dataset.ph):+t.dataset.q);
    const dst=dests();
    if(S.sel!==null&&dst[q]!==undefined){
      click();doSeq(dst[q]);return;
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
  window.tawlaStart=function(){
    click();captureNames();save();
    showView("play");
    startMatch();
  };
  window.tawlaHome=function(){
    click();clearTimers();S.phase="idle";
    show("hub");
  };

  /* لو الصفحة اتقفلت / رجعت بزر الموبايل */
  window.addEventListener("popstate",()=>{
    if(root.classList.contains("hidden")){clearTimers();}
  });
})();
