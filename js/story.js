/* =========================================================
   قصة — player-story guessing game
   Two teams, progressive clues (hardest -> easiest), points
   per clue reached (3 / 2 / 1), max 2 guesses per team per round.
   The answer is hidden until the moderator taps the reveal button.
   A results screen summarises the whole game.
   Data lives in STORY_PLAYERS (see story-data.js).
========================================================= */

const STORY_POINTS=[3,2,1]; // points if solved while clue 1 / 2 / 3 is the latest shown
const STORY_MAX_GUESSES=2;

const STORY_STORAGE_KEY="storyState";
const STORY_RESET_CONFIRM_MS=3000;

let storyDeck=[];      // shuffled indices into STORY_PLAYERS, not-yet-played
let storyCurrent=null; // current player object
let storyCurrentIdx=-1;// index of storyCurrent in STORY_PLAYERS (for saving)
let storyClueCount=3;  // 3 (عادي) or 4 (صعب)
let storyRevealed=1;   // how many clues are currently shown
let storyGuesses={a:0,b:0};   // wrong guesses used by each team this round
let storyHistory=[];          // finished rounds: {name,winner:'a'|'b'|null,pts}
let storyAnswerShown=false;   // moderator tapped «إظهار الإجابة»
let storyViewResult=false;    // results view is open (not saved)
let storyRoundOver=false;
let storyScores={a:0,b:0};
let storyTeamNames={a:"الفريق الأول",b:"الفريق الثاني"};
let storyResetArmed=false;
let storyResetTimer=null;

/* Saved on every change: scores, team names, mode, the remaining deck and
   the round in progress. Restored once when the page loads, so a refresh or
   leaving the screen never loses points or the current round. */
function storyLoadState(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORY_STORAGE_KEY)||"null");
    if(!saved)return;

    if(typeof saved.scoreA==="number")storyScores.a=saved.scoreA;
    if(typeof saved.scoreB==="number")storyScores.b=saved.scoreB;
    if(saved.teamA)storyTeamNames.a=saved.teamA;
    if(saved.teamB)storyTeamNames.b=saved.teamB;
    if(saved.clueCount===3||saved.clueCount===4)storyClueCount=saved.clueCount;

    /* deck / round are only trusted if the player list hasn't changed */
    const total=STORY_PLAYERS.length;
    if(saved.total!==total)return;
    const valid=i=>Number.isInteger(i)&&i>=0&&i<total;

    if(Array.isArray(saved.deck))storyDeck=saved.deck.filter(valid);

    if(Array.isArray(saved.history)){
      storyHistory=saved.history
        .filter(h=>h&&typeof h.name==="string")
        .map(h=>({name:h.name,winner:h.winner==="a"||h.winner==="b"?h.winner:null,pts:parseInt(h.pts,10)||0}))
        .slice(-300);
    }

    if(valid(saved.current)){
      storyCurrentIdx=saved.current;
      storyCurrent=STORY_PLAYERS[saved.current];
      const maxClues=Math.min(storyClueCount,storyCurrent.clues.length);
      storyRevealed=Math.min(Math.max(parseInt(saved.revealed,10)||1,1),maxClues);
      const g=saved.guesses||{};
      storyGuesses={
        a:Math.min(Math.max(parseInt(g.a,10)||0,0),STORY_MAX_GUESSES),
        b:Math.min(Math.max(parseInt(g.b,10)||0,0),STORY_MAX_GUESSES)
      };
      storyRoundOver=saved.roundOver===true;
      storyAnswerShown=storyRoundOver;
    }
  }catch(e){}
}

function storySaveState(){
  try{
    localStorage.setItem(STORY_STORAGE_KEY,JSON.stringify({
      scoreA:storyScores.a,
      scoreB:storyScores.b,
      teamA:storyTeamNames.a,
      teamB:storyTeamNames.b,
      clueCount:storyClueCount,
      total:STORY_PLAYERS.length,
      deck:storyDeck,
      current:storyCurrentIdx,
      revealed:storyRevealed,
      guesses:storyGuesses,
      roundOver:storyRoundOver,
      history:storyHistory
    }));
  }catch(e){}
  storyRefreshStartBtn();
}

/* "ابدأ اللعب" becomes "كمّل اللعب" when there is a saved game */
function storyRefreshStartBtn(){
  const btn=document.getElementById("storyStartBtn");
  if(!btn)return;
  const hasGame=storyCurrent!==null||storyScores.a>0||storyScores.b>0||storyHistory.length>0;
  btn.textContent=hasGame
    ?`كمّل اللعب (${storyScores.a} : ${storyScores.b})`
    :"ابدأ اللعب";
}

function storyRefillDeck(){
  const all=STORY_PLAYERS.map((_,i)=>i);
  storyDeck=seededShuffle(all,"story-"+Date.now()+"-"+Math.random());
}

function storyStartGame(){
  document.getElementById("storyTeamAInput").value=storyTeamNames.a;
  document.getElementById("storyTeamBInput").value=storyTeamNames.b;

  storyViewResult=false;
  if(storyCurrent){
    renderStoryRound();          // resume the round exactly where it was
  }else{
    if(storyDeck.length===0)storyRefillDeck();
    storyNextRound(true);
  }

  renderStoryScores();
  renderStoryView();
  show("story-game");
}

function storySetHardMode(on){
  storyClueCount=on?4:3;
  if(storyCurrent){
    const maxClues=Math.min(storyClueCount,storyCurrent.clues.length);
    if(storyRevealed>maxClues)storyRevealed=maxClues;
  }
  storySaveState();
  storyPaintMode();
  toast(on?"الوضع الصعب: 4 أدلة":"الوضع العادي: 3 أدلة");
}

function storyNextRound(silent){
  if(storyDeck.length===0)storyRefillDeck();
  const idx=storyDeck.pop();
  storyCurrentIdx=idx;
  storyCurrent=STORY_PLAYERS[idx];
  storyRevealed=1;
  storyGuesses={a:0,b:0};
  storyRoundOver=false;
  storyAnswerShown=false;
  storySaveState();
  renderStoryRound();
  if(!silent)toast("لاعب جديد");
}

function storyCurrentPoints(){
  // storyRevealed 1 -> 3pts, 2 -> 2pts, 3 -> 1pt, 4(hard extra clue) -> 0pts
  return STORY_POINTS[storyRevealed-1]||0;
}

function storyRevealNext(){
  if(storyRevealed<Math.min(storyClueCount,storyCurrent.clues.length)){
    storyRevealed++;
  }
  storySaveState();
  renderStoryRound();
}

/* ends the round once and remembers it for the results screen */
function storyEndRound(winner,pts){
  if(storyRoundOver||!storyCurrent)return;
  storyRoundOver=true;
  storyAnswerShown=true;
  storyHistory.push({name:storyCurrent.name,winner:winner,pts:pts||0});
}

function storyWrongGuess(team){
  if(storyRoundOver||!storyCurrent)return;
  if(storyGuesses[team]>=STORY_MAX_GUESSES)return;
  playClickSound();
  storyGuesses[team]++;
  const maxClues=Math.min(storyClueCount,storyCurrent.clues.length);
  if(storyRevealed<maxClues)storyRevealed++;
  if(storyGuesses.a>=STORY_MAX_GUESSES&&storyGuesses.b>=STORY_MAX_GUESSES){
    storyEndRound(null,0);
    toast("خلصت محاولات الفريقين");
  }else if(storyGuesses[team]>=STORY_MAX_GUESSES){
    toast(`${storyTeamNames[team]} خلصت محاولاتهم`);
  }
  storySaveState();
  renderStoryRound();
}

function storySkipRound(){
  if(storyRoundOver||!storyCurrent)return;
  playClickSound();
  const maxClues=Math.min(storyClueCount,storyCurrent.clues.length);
  if(storyRevealed<maxClues){
    storyRevealed++;
    toast("الدليل الجاي");
  }else{
    storyEndRound(null,0);
    toast("محدش عارف؟ الإجابة ظهرت");
  }
  storySaveState();
  renderStoryRound();
}

function storyCorrectGuess(team){
  if(storyRoundOver||!storyCurrent)return;
  if(storyGuesses[team]>=STORY_MAX_GUESSES)return;
  playRevealSound();
  const pts=storyCurrentPoints();
  storyScores[team]+=pts;
  storyEndRound(team,pts);
  storySaveState();
  renderStoryScores();
  renderStoryRound();
  toast(`+${pts} لـ${storyTeamNames[team]}`);
}

/* moderator-only: the answer stays hidden until this is tapped */
function storyToggleAnswer(){
  if(storyRoundOver)return;
  playClickSound();
  storyAnswerShown=!storyAnswerShown;
  renderStoryRound();
}

/* ---------- results screen ---------- */
function storyShowResult(){
  playClickSound();
  storyViewResult=true;
  renderStoryResult();
  renderStoryView();
  window.scrollTo({top:0,behavior:"smooth"});
}

function storyBackToGame(){
  playClickSound();
  storyViewResult=false;
  renderStoryRound();
  renderStoryView();
}

function storyResultNewGame(){
  playClickSound();
  storyScores={a:0,b:0};
  storyHistory=[];
  storyViewResult=false;
  storyRefillDeck();
  storyNextRound(true);
  renderStoryScores();
  renderStoryView();
  toast("لعبة جديدة");
}

function renderStoryView(){
  const play=document.getElementById("storyPlay");
  const res=document.getElementById("storyResult");
  if(play)play.classList.toggle("hidden",storyViewResult);
  if(res)res.classList.toggle("hidden",!storyViewResult);
}

function renderStoryResult(){
  const banner=document.getElementById("storyResultBanner");
  const meta=document.getElementById("storyResultMeta");
  const list=document.getElementById("storyResultList");
  if(!banner||!meta||!list)return;

  const a=storyScores.a,b=storyScores.b;
  banner.textContent=a===b
    ?`تعادل ${a} : ${b}`
    :`${a>b?storyTeamNames.a:storyTeamNames.b} فاز ${Math.max(a,b)} : ${Math.min(a,b)}`;

  const winsA=storyHistory.filter(h=>h.winner==="a").length;
  const winsB=storyHistory.filter(h=>h.winner==="b").length;
  const nobody=storyHistory.length-winsA-winsB;
  meta.textContent=storyHistory.length===0
    ?"لسه محدش لعب جولة كاملة"
    :`${storyHistory.length} جولة · ${storyTeamNames.a}: ${winsA} · ${storyTeamNames.b}: ${winsB} · محدش جاوب: ${nobody}`;

  list.textContent="";
  storyHistory.forEach((h,i)=>{
    const row=document.createElement("div");
    row.className="story-clue";
    const tag=document.createElement("span");
    tag.className="story-clue-tag";
    tag.dir="ltr";
    tag.textContent=`${i+1}. ${h.name}`;
    const text=document.createElement("p");
    text.textContent=h.winner
      ?`${storyTeamNames[h.winner]} جاوبوا صح (+${h.pts} نقطة)`
      :"محدش جاوب";
    row.append(tag,text);
    list.appendChild(row);
  });
}

/* Two taps within a few seconds: protects the points from an accidental tap */
function storyResetScores(){
  const btn=document.getElementById("storyResetBtn");

  if(!storyResetArmed){
    storyResetArmed=true;
    if(btn)btn.textContent="اضغط تاني للتأكيد";
    toast("اضغط تاني لتصفير النقط");
    clearTimeout(storyResetTimer);
    storyResetTimer=setTimeout(storyDisarmReset,STORY_RESET_CONFIRM_MS);
    return;
  }

  storyDisarmReset();
  storyScores={a:0,b:0};
  storyHistory=[];
  storyRefillDeck();
  storyNextRound(true);
  renderStoryScores();
  toast("لعبة جديدة، النقط اتصفرت");
}

function storyDisarmReset(){
  clearTimeout(storyResetTimer);
  storyResetArmed=false;
  const btn=document.getElementById("storyResetBtn");
  if(btn)btn.textContent="تصفير النقط";
}

function storyUpdateTeamName(team,value){
  const v=(value||"").trim();
  storyTeamNames[team]=v||(team==="a"?"الفريق الأول":"الفريق الثاني");
  storySaveState();
  renderStoryScores();
}

function renderStoryScores(){
  const a=document.getElementById("storyScoreA");
  const b=document.getElementById("storyScoreB");
  const an=document.getElementById("storyNameA");
  const bn=document.getElementById("storyNameB");
  if(a)a.textContent=storyScores.a;
  if(b)b.textContent=storyScores.b;
  if(an)an.textContent=storyTeamNames.a;
  if(bn)bn.textContent=storyTeamNames.b;
  const set=(id,t)=>{const el=document.getElementById(id);if(el)el.textContent=t;};
  set("storyLeftNameA",storyTeamNames.a);
  set("storyLeftNameB",storyTeamNames.b);
  set("storyCorrectA",`صح · ${storyTeamNames.a}`);
  set("storyCorrectB",`صح · ${storyTeamNames.b}`);
}

function renderStoryRound(){
  const wrap=document.getElementById("storyClues");
  if(!wrap||!storyCurrent)return;
  wrap.textContent="";

  const maxClues=Math.min(storyClueCount,storyCurrent.clues.length);

  for(let i=0;i<storyRevealed && i<maxClues;i++){
    const row=document.createElement("div");
    row.className="story-clue";
    const tag=document.createElement("span");
    tag.className="story-clue-tag";
    tag.textContent=`دليل ${i+1}`;
    const pts=document.createElement("span");
    pts.className="story-clue-pts";
    pts.textContent=STORY_POINTS[i]!==undefined?`(${STORY_POINTS[i]} نقطة)`:"(بدون نقط)";
    const text=document.createElement("p");
    text.textContent=storyCurrent.clues[i];
    row.append(tag,pts,text);
    wrap.appendChild(row);
  }

  const maxG=STORY_MAX_GUESSES;
  const leftA=document.getElementById("storyLeftA");
  const leftB=document.getElementById("storyLeftB");
  if(leftA)leftA.textContent=Math.max(0,maxG-storyGuesses.a);
  if(leftB)leftB.textContent=Math.max(0,maxG-storyGuesses.b);

  ["a","b"].forEach(t=>{
    const T=t.toUpperCase();
    const blocked=storyRoundOver||storyGuesses[t]>=maxG;
    const wrong=document.getElementById("storyWrong"+T);
    const right=document.getElementById("storyCorrect"+T);
    if(wrong){
      wrong.disabled=blocked;
      wrong.textContent=`غلط · ${storyTeamNames[t]}`;
    }
    if(right)right.disabled=blocked;
  });

  const skipBtn=document.getElementById("storySkipBtn");
  if(skipBtn)skipBtn.disabled=storyRoundOver;

  /* the answer: hidden until the moderator taps the button
     (shown automatically once the round is over) */
  const nameSpan=document.getElementById("storyAnswerName");
  if(nameSpan)nameSpan.textContent=storyCurrent.name;
  const showIt=storyAnswerShown||storyRoundOver;
  const reveal=document.getElementById("storyAnswerReveal");
  if(reveal)reveal.classList.toggle("hidden",!showIt);
  const ansBtn=document.getElementById("storyAnswerBtn");
  if(ansBtn){
    ansBtn.classList.toggle("hidden",storyRoundOver);
    ansBtn.textContent=storyAnswerShown?"إخفاء الإجابة":"إظهار الإجابة (للمشرف)";
  }

  const ptsNow=document.getElementById("storyPointsNow");
  if(ptsNow)ptsNow.textContent=storyCurrentPoints();
}

/* restore the saved game once, when the page loads */
storyLoadState();
storyRefreshStartBtn();


/* حالة وضع اللعب (عادي/صعب) على كروت الأدلة */
function storyPaintMode(){
  const hard=storyClueCount>=4;
  const a=document.getElementById("storyModeNormal"),b=document.getElementById("storyModeHard");
  if(a)a.classList.toggle("is-on",!hard);
  if(b)b.classList.toggle("is-on",hard);
}
setTimeout(storyPaintMode,0);
