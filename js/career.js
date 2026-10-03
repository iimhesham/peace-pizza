/* =========================================================
   الانتقالات — مسيرة لاعب/مدرب
   فريقين، المسيرة بتظهر محطات ناقصة (؟) والمحطات بتتكشف مع كل
   دليل. نفس نظام نقط «قصة لاعب»: دليل 1 = 3 · دليل 2 = 2 · دليل 3 = 1،
   وفي الوضع الصعب دليل رابع بدون نقط. محاولتين لكل فريق.
   الداتا في CAREER_PLAYERS (career-data.js). المحطة الرابعة = 1 معناها إعارة.
========================================================= */

const CAREER_BASE_BEFORE=2;  // جاوبوا قبل ما المسيرة تخلص
const CAREER_BASE_AFTER=1;   // بعد ما المسيرة تخلص كلها
const CAREER_RISK_BONUS=1;   // كارت الريسك: +1
const CAREER_MAX_GUESSES=2;
const CAREER_STORAGE_KEY="careerState";
const CAREER_RESET_CONFIRM_MS=3000;
const CAREER_FRACTIONS=[.35,.6,.85,1]; // نسبة المحطات المكشوفة في كل دليل

let careerDeck=[];        // indices في CAREER_PLAYERS لسه ماتلعبوش
let careerCurrent=null;
let careerCurrentIdx=-1;
let careerOrder=[];       // ترتيب كشف المحطات للجولة الحالية
let careerStages=3;       // 3 عادي · 4 صعب
let careerFilter="all";   // all | p | c
let careerStage=1;
let careerRisk=null;                 // الفريق اللي مفعّل الريسك في الجولة دي
let careerRiskUsed={a:false,b:false}; // مرة واحدة لكل فريق
let careerPeek=new Set(); // محطات المشرف فتحها بالضغط
let careerFlipIdx=-1;
let careerPrevShown=0;    // عدد المحطات اللي كانت ظاهرة قبل آخر دليل (للأنيميشن)
let careerGuesses={a:0,b:0};
let careerHistory=[];
let careerAnswerShown=false;
let careerViewResult=false;
let careerRoundOver=false;
let careerScores={a:0,b:0};careerRiskUsed={a:false,b:false};
let careerTeamNames={a:"الفريق الأول",b:"الفريق الثاني"};
let careerResetArmed=false;
let careerResetTimer=null;

/* ---------- helpers ---------- */
function careerPool(){
  const out=[];
  CAREER_PLAYERS.forEach((p,i)=>{if(careerFilter==="all"||p.t===careerFilter)out.push(i);});
  return out;
}

/* عدد المحطات المكشوفة في كل دليل (دايمًا بيزيد، والأخير بيكشف الكل) */
function careerStageCount(n,stage){
  if(stage>=careerStages)return n;   // آخر دليل بيكشف المسيرة كلها
  let prev=1,c=2;
  for(let k=1;k<=stage;k++){
    c=Math.round(n*CAREER_FRACTIONS[k-1]);
    c=Math.min(n,Math.max(c,prev+1));
    prev=c;
  }
  return Math.min(n,c);
}

function careerShownCount(){
  if(!careerCurrent)return 0;
  if(careerRoundOver)return careerCurrent.c.length;
  return careerStageCount(careerCurrent.c.length,careerStage);
}

function careerAllVisible(){
  if(!careerCurrent)return false;
  const n=careerCurrent.c.length;
  if(careerRoundOver)return true;
  const vis=new Set([...careerOrder.slice(0,careerShownCount()),...careerPeek]);
  return vis.size>=n;
}

function careerPointsFor(team){
  const base=careerAllVisible()?CAREER_BASE_AFTER:CAREER_BASE_BEFORE;
  return base+(team&&careerRisk===team?CAREER_RISK_BONUS:0);
}

function careerCurrentPoints(){return careerPointsFor(null);}

/* ---------- كارت الريسك ---------- */
function careerRiskAllowed(team){
  return !!careerCurrent&&!careerRoundOver&&!careerRiskUsed[team]&&careerRisk===null
    &&careerStage===1&&careerGuesses.a===0&&careerGuesses.b===0&&careerPeek.size===0;
}

function careerUseRisk(team){
  if(!careerRiskAllowed(team))return;
  const isHard=i=>CAREER_PLAYERS[i].h&&i!==careerCurrentIdx;
  let pick=careerDeck.filter(isHard);
  let fromDeck=pick.length>0;
  if(!fromDeck)pick=careerPool().filter(isHard);
  if(!pick.length){toast("مفيش سؤال صعب متاح دلوقتي");return;}
  playRevealSound();
  const idx=pick[Math.floor(Math.random()*pick.length)];
  if(fromDeck)careerDeck.splice(careerDeck.indexOf(idx),1);
  careerDeck.splice(Math.floor(Math.random()*(careerDeck.length+1)),0,careerCurrentIdx); // السؤال القديم يرجع للدك
  careerCurrentIdx=idx;
  careerCurrent=CAREER_PLAYERS[idx];
  careerOrder=careerShuffleOrder(careerCurrent.c.length);
  careerPrevShown=0;careerPeek=new Set();careerFlipIdx=-1;
  careerRisk=team;careerRiskUsed[team]=true;
  careerSaveState();careerRenderRound();
  toast(`🎲 ريسك ${careerTeamNames[team]}: سؤال صعب · ${CAREER_BASE_BEFORE+CAREER_RISK_BONUS} نقط`);
}

/* ---------- save / load ---------- */
function careerLoadState(){
  try{
    const s=JSON.parse(localStorage.getItem(CAREER_STORAGE_KEY)||"null");
    if(!s)return;
    if(typeof s.scoreA==="number")careerScores.a=s.scoreA;
    if(typeof s.scoreB==="number")careerScores.b=s.scoreB;
    if(s.riskUsed)careerRiskUsed={a:!!s.riskUsed.a,b:!!s.riskUsed.b};
    if(s.teamA)careerTeamNames.a=s.teamA;
    if(s.teamB)careerTeamNames.b=s.teamB;
    if(s.stages===3||s.stages===4)careerStages=s.stages;
    if(s.filter==="all"||s.filter==="p"||s.filter==="c")careerFilter=s.filter;

    /* الدك والجولة بيترجعوا بس لو الداتا ماتغيرتش */
    const total=CAREER_PLAYERS.length;
    if(s.total!==total)return;
    const valid=i=>Number.isInteger(i)&&i>=0&&i<total;
    if(Array.isArray(s.deck))careerDeck=s.deck.filter(valid);
    if(Array.isArray(s.history)){
      careerHistory=s.history
        .filter(h=>h&&typeof h.name==="string")
        .map(h=>({name:h.name,winner:h.winner==="a"||h.winner==="b"?h.winner:null,pts:parseInt(h.pts,10)||0}))
        .slice(-300);
    }
    if(valid(s.current)){
      careerCurrentIdx=s.current;
      careerCurrent=CAREER_PLAYERS[s.current];
      const n=careerCurrent.c.length;
      careerOrder=Array.isArray(s.order)&&s.order.length===n&&s.order.every(i=>Number.isInteger(i)&&i>=0&&i<n)
        ?s.order:careerShuffleOrder(n);
      careerStage=Math.min(Math.max(parseInt(s.stage,10)||1,1),careerStages);
      const g=s.guesses||{};
      careerGuesses={
        a:Math.min(Math.max(parseInt(g.a,10)||0,0),CAREER_MAX_GUESSES),
        b:Math.min(Math.max(parseInt(g.b,10)||0,0),CAREER_MAX_GUESSES)
      };
      careerRisk=(s.risk==="a"||s.risk==="b")?s.risk:null;
      careerRoundOver=s.roundOver===true;
      careerAnswerShown=careerRoundOver;
      careerPrevShown=careerShownCount();
    }
  }catch(e){}
}

function careerSaveState(){
  try{
    localStorage.setItem(CAREER_STORAGE_KEY,JSON.stringify({
      scoreA:careerScores.a,scoreB:careerScores.b,
      teamA:careerTeamNames.a,teamB:careerTeamNames.b,
      stages:careerStages,filter:careerFilter,
      total:CAREER_PLAYERS.length,
      deck:careerDeck,current:careerCurrentIdx,order:careerOrder,
      stage:careerStage,guesses:careerGuesses,
      roundOver:careerRoundOver,history:careerHistory,
      risk:careerRisk,riskUsed:careerRiskUsed
    }));
  }catch(e){}
  careerRefreshStartBtn();
}

function careerRefreshStartBtn(){
  const btn=document.getElementById("careerStartBtn");
  if(!btn)return;
  const has=careerCurrent!==null||careerScores.a>0||careerScores.b>0||careerHistory.length>0;
  btn.textContent=has?`كمّل اللعب (${careerScores.a} : ${careerScores.b})`:"ابدأ اللعب";
}

/* ---------- setup screen ---------- */
function careerShuffleOrder(n){
  return seededShuffle([...Array(n).keys()],"career-"+Date.now()+"-"+Math.random());
}

function careerRefillDeck(){
  careerDeck=seededShuffle(careerPool(),"career-deck-"+Date.now()+"-"+Math.random());
}

function careerSetHardMode(on){
  careerStages=on?4:3;
  if(careerStage>careerStages)careerStage=careerStages;
  careerSaveState();
  careerRenderSetup();
  if(careerCurrent)careerRenderRound();
  toast(on?"الوضع الصعب: 4 أدلة":"الوضع العادي: 3 أدلة");
}

function careerSetFilter(f){
  if(f===careerFilter)return;
  careerFilter=f;
  careerDeck=[];          // الدك القديم كان على فلتر تاني
  careerSaveState();
  careerRenderSetup();
  toast(f==="p"?"لاعبين بس":f==="c"?"مدربين بس":"لاعبين ومدربين");
}

function careerRenderSetup(){
  const mark=(id,on)=>{
    const b=document.getElementById(id);
    if(!b)return;
    b.classList.toggle("is-on",on);
    b.setAttribute("aria-pressed",on?"true":"false");
  };
  mark("careerModeNormal",careerStages===3);
  mark("careerModeHard",careerStages===4);
  mark("careerFilterAll",careerFilter==="all");
  mark("careerFilterP",careerFilter==="p");
  mark("careerFilterC",careerFilter==="c");
  const cnt=document.getElementById("careerPoolCount");
  if(cnt)cnt.textContent=careerPool().length;
}

function careerStartGame(){
  document.getElementById("careerTeamAInput").value=careerTeamNames.a;
  document.getElementById("careerTeamBInput").value=careerTeamNames.b;
  careerViewResult=false;
  if(careerCurrent){
    careerRenderRound();
  }else{
    if(careerDeck.length===0)careerRefillDeck();
    careerNextRound(true);
  }
  careerRenderScores();
  careerRenderView();
  show("career-game");
}

/* ---------- round flow ---------- */
function careerNextRound(silent){
  if(careerDeck.length===0)careerRefillDeck();
  const idx=careerDeck.pop();
  careerCurrentIdx=idx;
  careerCurrent=CAREER_PLAYERS[idx];
  careerOrder=careerShuffleOrder(careerCurrent.c.length);
  careerPeek=new Set();careerFlipIdx=-1;careerRisk=null;
  careerStage=1;
  careerGuesses={a:0,b:0};
  careerRoundOver=false;
  careerAnswerShown=false;
  careerPrevShown=0;
  careerSaveState();
  careerRenderRound();
  if(!silent)toast("مسيرة جديدة");
}

function careerRevealNext(){
  if(careerStage<careerStages)careerStage++;
}

function careerEndRound(winner,pts){
  if(careerRoundOver||!careerCurrent)return;
  careerRoundOver=true;
  careerAnswerShown=true;
  careerHistory.push({name:careerCurrent.n,winner:winner,pts:pts||0});
}

function careerWrongGuess(team){
  if(careerRoundOver||!careerCurrent)return;
  if(careerGuesses[team]>=CAREER_MAX_GUESSES)return;
  playClickSound();
  careerGuesses[team]++;
  careerPrevShown=careerShownCount();
  careerRevealNext();
  if(careerGuesses.a>=CAREER_MAX_GUESSES&&careerGuesses.b>=CAREER_MAX_GUESSES){
    careerEndRound(null,0);
    toast("خلصت محاولات الفريقين");
  }else if(careerGuesses[team]>=CAREER_MAX_GUESSES){
    toast(`${careerTeamNames[team]} خلصت محاولاتهم`);
  }
  careerSaveState();
  careerRenderRound();
}

function careerSkipRound(){
  if(careerRoundOver||!careerCurrent)return;
  playClickSound();
  if(careerStage<careerStages){
    careerPrevShown=careerShownCount();
    careerRevealNext();
    toast("محطات جديدة اتكشفت");
  }else{
    careerEndRound(null,0);
    toast("محدش عارف؟ الإجابة ظهرت");
  }
  careerSaveState();
  careerRenderRound();
}

function careerCorrectGuess(team){
  if(careerRoundOver||!careerCurrent)return;
  if(careerGuesses[team]>=CAREER_MAX_GUESSES)return;
  playRevealSound();
  const pts=careerPointsFor(team);
  careerScores[team]+=pts;
  careerPrevShown=careerShownCount();
  careerEndRound(team,pts);
  careerSaveState();
  careerRenderScores();
  careerRenderRound();
  toast(`+${pts} لـ${careerTeamNames[team]}`);
}

function careerToggleAnswer(){
  if(careerRoundOver)return;
  playClickSound();
  careerAnswerShown=!careerAnswerShown;
  careerRenderRound();
}

/* ---------- rendering ---------- */
function careerYears(s){
  if(!s[1])return "";
  if(s[2]===null)return `${s[1]} – Now`;
  return s[1]===s[2]?`${s[1]}`:`${s[1]} – ${s[2]}`;
}

function careerRenderScores(){
  const set=(id,t)=>{const el=document.getElementById(id);if(el)el.textContent=t;};
  set("careerScoreA",careerScores.a);
  set("careerScoreB",careerScores.b);
  set("careerNameA",careerTeamNames.a);
  set("careerNameB",careerTeamNames.b);
  set("careerLeftNameA",careerTeamNames.a);
  set("careerLeftNameB",careerTeamNames.b);
  set("careerCorrectA",`صح ✅ ${careerTeamNames.a}`);
  set("careerCorrectB",`صح ✅ ${careerTeamNames.b}`);
}

function careerRenderRound(){
  const wrap=document.getElementById("careerTimeline");
  if(!wrap||!careerCurrent)return;
  wrap.textContent="";

  const stops=careerCurrent.c;
  const n=stops.length;
  const shown=careerShownCount();
  const open=new Set(careerOrder.slice(0,shown));
  const fresh=new Set(careerOrder.slice(careerPrevShown,shown));

  stops.forEach((s,i)=>{
    const official=open.has(i);
    const isOpen=official||careerPeek.has(i);
    const row=document.createElement("div");
    if(!careerRoundOver&&!official){
      row.classList.add("is-tap");row.setAttribute("role","button");row.tabIndex=0;
      row.onclick=()=>careerFlipStop(i);
      row.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();careerFlipStop(i);}};
    }
    row.className+=" cr-stop "+(isOpen?"is-open":"is-hidden")+(careerFlipIdx===i?" is-flip":"")+(isOpen&&fresh.has(i)&&careerPrevShown>0?" is-new":"");

    const node=document.createElement("div");
    node.className="cr-node";
    const dot=document.createElement("span");
    dot.className="cr-dot";
    dot.textContent=String(i+1);
    node.appendChild(dot);
    if(i<n-1){
      const rail=document.createElement("span");
      rail.className="cr-rail";
      node.appendChild(rail);
    }

    const card=document.createElement("div");
    card.className="cr-card";
    if(isOpen){
      const club=document.createElement("b");
      club.className="cr-club";
      club.dir="ltr";
      club.textContent=s[0];
      const yrs=document.createElement("span");
      yrs.className="cr-years";
      yrs.dir="ltr";
      yrs.textContent=careerYears(s);
      if(s[3]){
        const tag=document.createElement("span");
        tag.className="cr-loan";
        tag.textContent="إعارة";
        card.classList.add("is-loan");
        card.append(club,tag,yrs);
      }else{
        card.append(club,yrs);
      }
    }else{
      const q=document.createElement("span");
      q.className="cr-q";
      q.textContent="؟";
      card.appendChild(q);
    }
    row.append(node,card);
    wrap.appendChild(row);
  });

  /* نوع الاسم: لاعب أو مدرب */
  const kind=document.getElementById("careerKind");
  if(kind){
    const last=careerCurrent.c[n-1];
    const cur=careerCurrent.s?careerCurrent.s==="cur":last[2]===null;
    kind.textContent=careerCurrent.t==="c"
      ?`مدرب · ${n} محطات تدريب`
      :`لاعب ${cur?"حالي":"سابق"} · ${n} محطات`;
    kind.classList.toggle("is-cur",careerCurrent.t!=="c"&&cur);
    if(careerRisk)kind.textContent+=` · 🎲 ريسك ${careerTeamNames[careerRisk]}`;
    kind.classList.toggle("is-risk",!!careerRisk);
  }

  const hint=document.getElementById("careerShownInfo");
  if(hint)hint.textContent=careerRoundOver
    ?"المسيرة كاملة"
    :`ظاهر ${shown} من ${n} محطات · دليل ${careerStage} من ${careerStages}`;

  const maxG=CAREER_MAX_GUESSES;
  const setTxt=(id,t)=>{const el=document.getElementById(id);if(el)el.textContent=t;};
  setTxt("careerLeftA",Math.max(0,maxG-careerGuesses.a));
  setTxt("careerLeftB",Math.max(0,maxG-careerGuesses.b));

  ["a","b"].forEach(t=>{
    const T=t.toUpperCase();
    const blocked=careerRoundOver||careerGuesses[t]>=maxG;
    const wrong=document.getElementById("careerWrong"+T);
    const right=document.getElementById("careerCorrect"+T);
    if(wrong){wrong.disabled=blocked;wrong.textContent=`غلط ❌ ${careerTeamNames[t]}`;}
    if(right)right.disabled=blocked;
  });

  const pk=document.getElementById("careerPeekAllBtn");
  if(pk){pk.disabled=careerRoundOver;pk.textContent=careerPeek.size?"إخفاء المحطات المفتوحة 🙈":"إظهار كل المسيرة 👁️";}
  const skip=document.getElementById("careerSkipBtn");
  if(skip)skip.disabled=careerRoundOver;

  setTxt("careerAnswerName",careerCurrent.n);
  const showIt=careerAnswerShown||careerRoundOver;
  const reveal=document.getElementById("careerAnswerReveal");
  if(reveal)reveal.classList.toggle("hidden",!showIt);
  const ansBtn=document.getElementById("careerAnswerBtn");
  if(ansBtn){
    ansBtn.classList.toggle("hidden",careerRoundOver);
    ansBtn.textContent=careerAnswerShown?"إخفاء الإجابة 🙈":"إظهار الإجابة (للمشرف) 👁️";
  }
  setTxt("careerPointsNow",careerRisk&&!careerRoundOver
    ?`${careerPointsFor(null)} · ريسك ${careerTeamNames[careerRisk]}: ${careerPointsFor(careerRisk)}`
    :careerPointsFor(null));
  ["a","b"].forEach(t=>{
    const rb=document.getElementById("careerRisk"+t.toUpperCase());
    if(!rb)return;
    rb.disabled=!careerRiskAllowed(t);
    rb.textContent=careerRiskUsed[t]?`🎲 ${careerTeamNames[t]}: اتستخدم`:`🎲 ريسك ${careerTeamNames[t]}`;
  });
}

function careerFlipStop(i){
  if(careerRoundOver||!careerCurrent)return;
  playClickSound();
  if(careerPeek.has(i))careerPeek.delete(i);else careerPeek.add(i);
  careerFlipIdx=i;
  careerRenderRound();
  careerFlipIdx=-1;
}

function careerPeekAll(){
  if(careerRoundOver||!careerCurrent)return;
  playClickSound();
  const n=careerCurrent.c.length;
  const hidden=[...Array(n).keys()].filter(i=>!careerOrder.slice(0,careerShownCount()).includes(i));
  const all=hidden.every(i=>careerPeek.has(i));
  hidden.forEach(i=>all?careerPeek.delete(i):careerPeek.add(i));
  careerFlipIdx=-1;
  careerRenderRound();
}

function careerRenderView(){
  const play=document.getElementById("careerPlay");
  const res=document.getElementById("careerResult");
  if(play)play.classList.toggle("hidden",careerViewResult);
  if(res)res.classList.toggle("hidden",!careerViewResult);
}

/* ---------- results ---------- */
function careerShowResult(){
  playClickSound();
  careerViewResult=true;
  careerRenderResult();
  careerRenderView();
  window.scrollTo({top:0,behavior:"smooth"});
}

function careerBackToGame(){
  playClickSound();
  careerViewResult=false;
  careerRenderRound();
  careerRenderView();
}

function careerResultNewGame(){
  playClickSound();
  careerScores={a:0,b:0};careerRiskUsed={a:false,b:false};
  careerHistory=[];
  careerViewResult=false;
  careerRefillDeck();
  careerNextRound(true);
  careerRenderScores();
  careerRenderView();
  toast("لعبة جديدة");
}

function careerRenderResult(){
  const banner=document.getElementById("careerResultBanner");
  const meta=document.getElementById("careerResultMeta");
  const list=document.getElementById("careerResultList");
  if(!banner||!meta||!list)return;
  const a=careerScores.a,b=careerScores.b;
  banner.textContent=a===b
    ?`تعادل ${a} : ${b} 🤝`
    :`🏆 ${a>b?careerTeamNames.a:careerTeamNames.b} فاز ${Math.max(a,b)} : ${Math.min(a,b)}`;
  const winsA=careerHistory.filter(h=>h.winner==="a").length;
  const winsB=careerHistory.filter(h=>h.winner==="b").length;
  const nobody=careerHistory.length-winsA-winsB;
  meta.textContent=careerHistory.length===0
    ?"لسه محدش لعب جولة كاملة"
    :`${careerHistory.length} جولة · ${careerTeamNames.a}: ${winsA} · ${careerTeamNames.b}: ${winsB} · محدش جاوب: ${nobody}`;
  list.textContent="";
  careerHistory.forEach((h,i)=>{
    const row=document.createElement("div");
    row.className="cr-result-row";
    const tag=document.createElement("span");
    tag.className="cr-result-name";
    tag.dir="ltr";
    tag.textContent=`${i+1}. ${h.name}`;
    const text=document.createElement("p");
    text.textContent=h.winner
      ?`${careerTeamNames[h.winner]} جاوبوا صح (+${h.pts} نقطة)`
      :"محدش جاوب";
    row.append(tag,text);
    list.appendChild(row);
  });
}

/* ---------- reset (ضغطتين) + team names ---------- */
function careerResetScores(){
  const btn=document.getElementById("careerResetBtn");
  if(!careerResetArmed){
    careerResetArmed=true;
    if(btn)btn.textContent="اضغط تاني للتأكيد";
    toast("اضغط تاني لتصفير النقط");
    clearTimeout(careerResetTimer);
    careerResetTimer=setTimeout(careerDisarmReset,CAREER_RESET_CONFIRM_MS);
    return;
  }
  careerDisarmReset();
  careerScores={a:0,b:0};careerRiskUsed={a:false,b:false};
  careerHistory=[];
  careerRefillDeck();
  careerNextRound(true);
  careerRenderScores();
  toast("لعبة جديدة، النقط اتصفرت");
}

function careerDisarmReset(){
  clearTimeout(careerResetTimer);
  careerResetArmed=false;
  const btn=document.getElementById("careerResetBtn");
  if(btn)btn.textContent="تصفير النقط";
}

function careerUpdateTeamName(team,value){
  const v=(value||"").trim();
  careerTeamNames[team]=v||(team==="a"?"الفريق الأول":"الفريق الثاني");
  careerSaveState();
  careerRenderScores();
}

/* restore once on load */
careerLoadState();
careerRenderSetup();
careerRefreshStartBtn();
