/* =========================================================
   XO — لعبة أوفلاين على جهاز واحد.
   الوضعين: لاعبين اتنين، أو ضد الكمبيوتر (سهل / متوسط / مستحيل).
   مفيش أي اتصال بالأونلاين هنا: كل حاجة بتتحفظ في المتصفح بس.
========================================================= */

(function(){
  const $=id=>document.getElementById(id);
  const root=$("xo");
  if(!root)return;

  const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const KEY="xoSettings";
  const NEED={1:1,3:2,5:3};

  const MARK={
    x:'<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M26 26L74 74" pathLength="100"/><path d="M74 26L26 74" pathLength="100" style="animation-delay:.12s"/></svg>',
    o:'<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="25" pathLength="100"/></svg>'
  };

  const S={
    mode:"pvp",      // pvp | cpu
    diff:"mid",      // easy | mid | hard
    best:3,          // 1 | 3 | 5
    nameX:"",nameO:"",
    scores:{x:0,o:0,d:0},
    board:Array(9).fill(""),
    turn:"x",starter:"x",round:1,
    over:false,seriesOver:false,line:null,lastWinner:null,
    timer:null
  };

  /* ---------- حفظ الإعدادات ---------- */
  function load(){
    try{
      const j=JSON.parse(localStorage.getItem(KEY)||"null");
      if(!j)return;
      if(j.mode==="pvp"||j.mode==="cpu")S.mode=j.mode;
      if(["easy","mid","hard"].includes(j.diff))S.diff=j.diff;
      if(NEED[j.best])S.best=j.best;
      S.nameX=String(j.nameX||"").slice(0,14);
      S.nameO=String(j.nameO||"").slice(0,14);
    }catch(e){}
  }
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify({mode:S.mode,diff:S.diff,best:S.best,nameX:S.nameX,nameO:S.nameO}));}catch(e){}
  }

  /* ---------- أسامي ---------- */
  const nameOf=p=>{
    if(p==="x")return S.nameX.trim()||(S.mode==="cpu"?"You":"Player X");
    return S.mode==="cpu"?"Computer":(S.nameO.trim()||"Player O");
  };

  /* ---------- منطق اللعبة ---------- */
  function winnerOf(b){
    for(const l of LINES){
      const[a,c,d]=l;
      if(b[a]&&b[a]===b[c]&&b[a]===b[d])return{w:b[a],line:l};
    }
    return null;
  }
  const empties=b=>b.reduce((r,v,i)=>(v?r:(r.push(i),r)),[]);
  const pick=a=>a[Math.floor(Math.random()*a.length)];

  function minimax(b,turn,me){
    const w=winnerOf(b);
    if(w)return w.w===me?10:-10;
    const e=empties(b);
    if(!e.length)return 0;
    let best=turn===me?-Infinity:Infinity;
    for(const i of e){
      b[i]=turn;
      const s=minimax(b,turn==="x"?"o":"x",me);
      b[i]="";
      best=turn===me?Math.max(best,s):Math.min(best,s);
    }
    return best;
  }

  function findWinning(b,p){
    for(const i of empties(b)){
      b[i]=p;const w=winnerOf(b);b[i]="";
      if(w)return i;
    }
    return -1;
  }

  function cpuMove(){
    const b=S.board.slice(),me="o",foe="x",e=empties(b);
    if(S.diff==="easy")return pick(e);
    if(S.diff==="mid"){
      let m=findWinning(b,me);
      if(m<0&&Math.random()<.85)m=findWinning(b,foe);
      if(m>=0)return m;
      if(b[4]===""&&Math.random()<.7)return 4;
      const corners=[0,2,6,8].filter(i=>b[i]==="");
      if(corners.length&&Math.random()<.6)return pick(corners);
      return pick(e);
    }
    // مستحيل: أفضل نقلة دايمًا (بيختار عشوائي بين النقلات المتساوية)
    let bestScore=-Infinity,bestMoves=[];
    for(const i of e){
      b[i]=me;
      const s=minimax(b,foe,me);
      b[i]="";
      if(s>bestScore){bestScore=s;bestMoves=[i];}
      else if(s===bestScore)bestMoves.push(i);
    }
    return pick(bestMoves);
  }

  /* ---------- رسم الواجهة ---------- */
  const cells=[];
  function buildBoard(){
    const host=$("xoBoard");
    if(host.children.length)return;
    for(let i=0;i<9;i++){
      const c=document.createElement("button");
      c.type="button";c.className="xo-cell";c.dataset.i=i;
      host.appendChild(c);cells.push(c);
    }
    host.addEventListener("click",e=>{
      const c=e.target.closest(".xo-cell");
      if(c)place(+c.dataset.i,false);
    });
  }

  const verb=p=>nameOf(p)==="You"?" win":" wins";
  function statusText(){
    const el=$("xoStatus");
    el.textContent="";
    const add=(t,cls)=>{const s=document.createElement("span");if(cls)s.className=cls;s.textContent=t;el.appendChild(s);};
    if(S.over){
      if(S.lastWinner){add(nameOf(S.lastWinner),"xo-"+S.lastWinner);add(verb(S.lastWinner)+" the round");}
      else add("Draw — no winner this round");
    }else{
      add(nameOf(S.turn),"xo-"+S.turn);add(S.mode==="cpu"&&S.turn==="o"?" is thinking...":nameOf(S.turn)==="You"?" — your turn":"'s turn");
    }
  }

  function render(){
    cells.forEach((c,i)=>{
      const v=S.board[i];
      const was=c.dataset.v||"";
      if(was!==v){c.innerHTML=v?MARK[v]:"";c.dataset.v=v;}
      c.classList.toggle("is-filled",!!v);
      c.classList.toggle("is-x",v==="x");
      c.classList.toggle("is-o",v==="o");
      const win=!!S.line&&S.line.includes(i);
      c.classList.toggle("is-win",win);
      c.classList.toggle("is-dim",!!S.line&&!win);
      c.disabled=!!v||S.over||(S.mode==="cpu"&&S.turn==="o");
      c.setAttribute("aria-label","Cell "+(i+1)+(v?", "+v.toUpperCase():", empty"));
    });
    $("xoBoard").classList.toggle("is-draw",S.over&&!S.lastWinner);

    $("xoNX").textContent=nameOf("x");
    $("xoNO").textContent=nameOf("o");
    $("xoSX").textContent=S.scores.x;
    $("xoSO").textContent=S.scores.o;
    $("xoSD").textContent=S.scores.d;
    $("xoPlX").classList.toggle("is-turn",!S.over&&S.turn==="x");
    $("xoPlO").classList.toggle("is-turn",!S.over&&S.turn==="o");

    const need=NEED[S.best];
    $("xoMeta").textContent=S.best===1?"Single round":"Round "+S.round+" · First to "+need;
    $("xoNext").classList.toggle("hidden",!(S.over&&!S.seriesOver));
    statusText();
  }

  /* ---------- اللعب ---------- */
  function place(i,fromCpu){
    if(S.over||S.board[i])return;
    if(S.mode==="cpu"&&S.turn==="o"&&!fromCpu)return;
    S.board[i]=S.turn;
    if(typeof playClickSound==="function")playClickSound();

    const w=winnerOf(S.board);
    if(w){
      S.over=true;S.line=w.line;S.lastWinner=w.w;S.scores[w.w]++;
      endRound();
    }else if(!empties(S.board).length){
      S.over=true;S.lastWinner=null;S.scores.d++;
      endRound();
    }else{
      S.turn=S.turn==="x"?"o":"x";
      render();
      if(S.mode==="cpu"&&S.turn==="o"){
        clearTimeout(S.timer);
        S.timer=setTimeout(()=>{S.timer=null;place(cpuMove(),true);},S.diff==="easy"?380:560);
      }
    }
  }

  function endRound(){
    const need=NEED[S.best];
    S.seriesOver=S.best===1||S.scores.x>=need||S.scores.o>=need;
    render();
    if(S.lastWinner&&typeof playRevealSound==="function")playRevealSound();
    if(S.seriesOver)setTimeout(showFinal,S.lastWinner?900:600);
  }

  function showFinal(){
    if(!S.seriesOver||$("xoPlay").classList.contains("hidden"))return;
    const f=$("xoFinal");
    const sx=S.scores.x,so=S.scores.o;
    let champ=sx>so?"x":so>sx?"o":null;
    $("xoFinalMark").className="xo-final-mark"+(champ?" xo-"+champ+"-mark":" is-tie");
    $("xoFinalMark").innerHTML=champ?MARK[champ]:'<span class="xo-tie-eq">=</span>';
    $("xoFinalTitle").textContent=champ?nameOf(champ)+verb(champ)+" the match":"Match tied";
    $("xoFinalScore").textContent=sx+" - "+so+(S.scores.d?"   (draws "+S.scores.d+")":"");
    f.classList.remove("hidden");
    $("xoAgain").focus({preventScroll:true});
  }

  function newRound(){
    clearTimeout(S.timer);S.timer=null;
    S.board=Array(9).fill("");
    S.over=false;S.line=null;S.lastWinner=null;S.seriesOver=false;
    S.turn=S.starter;
    render();
    if(S.mode==="cpu"&&S.turn==="o"){
      S.timer=setTimeout(()=>{S.timer=null;place(cpuMove(),true);},520);
    }
  }

  // بيحفظ اللي اتكتب في خانات الأسامي قبل أي إعادة رسم للإعدادات
  function captureNames(){
    S.nameX=$("xoNameX").value.slice(0,14);
    if(S.mode==="pvp")S.nameO=$("xoNameO").value.slice(0,14);
  }

  /* ---------- شاشات ---------- */
  function showView(which){
    $("xoSetup").classList.toggle("hidden",which!=="setup");
    $("xoPlay").classList.toggle("hidden",which!=="play");
    $("xoGear").classList.toggle("is-off",which!=="play");
    $("xoFinal").classList.add("hidden");
  }

  function syncSetup(){
    root.querySelectorAll("#xoModeSeg button").forEach(b=>b.classList.toggle("is-on",b.dataset.v===S.mode));
    root.querySelectorAll("#xoDiffSeg button").forEach(b=>b.classList.toggle("is-on",b.dataset.v===S.diff));
    root.querySelectorAll("#xoBestSeg button").forEach(b=>b.classList.toggle("is-on",+b.dataset.v===S.best));
    $("xoDiffWrap").classList.toggle("hidden",S.mode!=="cpu");
    const o=$("xoNameO");
    o.disabled=S.mode==="cpu";
    o.value=S.mode==="cpu"?"Computer":S.nameO;
    o.placeholder="Player O";
    $("xoNameX").value=S.nameX;
    $("xoNameX").placeholder=S.mode==="cpu"?"You":"Player X";
  }

  window.xoOpen=function(){
    buildBoard();load();
    clearTimeout(S.timer);S.timer=null;
    syncSetup();showView("setup");
    show("xo");
  };

  window.xoShowSetup=function(){
    if(typeof playClickSound==="function")playClickSound();
    clearTimeout(S.timer);S.timer=null;
    syncSetup();showView("setup");
  };

  window.xoStart=function(){
    if(typeof playClickSound==="function")playClickSound();
    captureNames();
    save();
    S.scores={x:0,o:0,d:0};S.round=1;S.starter="x";
    showView("play");
    newRound();
  };

  window.xoNextRound=function(){
    if(typeof playClickSound==="function")playClickSound();
    S.round++;
    S.starter=S.starter==="x"?"o":"x";
    newRound();
  };

  window.xoRematch=function(){
    if(typeof playClickSound==="function")playClickSound();
    $("xoFinal").classList.add("hidden");
    S.scores={x:0,o:0,d:0};S.round=1;S.starter="x";
    newRound();
  };

  window.xoHome=function(){
    if(typeof playClickSound==="function")playClickSound();
    clearTimeout(S.timer);S.timer=null;
    show("hub");
  };

  /* ---------- أزرار الإعدادات ---------- */
  function seg(id,fn){
    $(id).addEventListener("click",e=>{
      const b=e.target.closest("button[data-v]");
      if(!b)return;
      if(typeof playClickSound==="function")playClickSound();
      captureNames();
      fn(b.dataset.v);
      syncSetup();
    });
  }
  seg("xoModeSeg",v=>{S.mode=v;});
  seg("xoDiffSeg",v=>{S.diff=v;});
  seg("xoBestSeg",v=>{S.best=+v;});

  ["xoNameX","xoNameO"].forEach(id=>$(id).addEventListener("keydown",e=>{
    if(e.key==="Enter"){e.preventDefault();window.xoStart();}
  }));
})();
