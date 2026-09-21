/* =========================================================
   قصة — player-story guessing game
   Two teams, progressive clues (hardest -> easiest), points
   per clue reached (3 / 2 / 1), max 2 guesses per round.
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
let storyGuessesUsed=0;
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

    if(valid(saved.current)){
      storyCurrentIdx=saved.current;
      storyCurrent=STORY_PLAYERS[saved.current];
      const maxClues=Math.min(storyClueCount,storyCurrent.clues.length);
      storyRevealed=Math.min(Math.max(parseInt(saved.revealed,10)||1,1),maxClues);
      storyGuessesUsed=Math.min(Math.max(parseInt(saved.guessesUsed,10)||0,0),STORY_MAX_GUESSES);
      storyRoundOver=saved.roundOver===true;
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
      guessesUsed:storyGuessesUsed,
      roundOver:storyRoundOver
    }));
  }catch(e){}
  storyRefreshStartBtn();
}

/* "ابدأ اللعب" becomes "كمّل اللعب" when there is a saved game */
function storyRefreshStartBtn(){
  const btn=document.getElementById("storyStartBtn");
  if(!btn)return;
  const hasGame=storyCurrent!==null||storyScores.a>0||storyScores.b>0;
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

  if(storyCurrent){
    renderStoryRound();          // resume the round exactly where it was
  }else{
    if(storyDeck.length===0)storyRefillDeck();
    storyNextRound(true);
  }

  renderStoryScores();
  show("story-game");
}

function storySetHardMode(on){
  storyClueCount=on?4:3;
  if(storyCurrent){
    const maxClues=Math.min(storyClueCount,storyCurrent.clues.length);
    if(storyRevealed>maxClues)storyRevealed=maxClues;
  }
  storySaveState();
  toast(on?"الوضع الصعب: 4 أدلة":"الوضع العادي: 3 أدلة");
}

function storyNextRound(silent){
  if(storyDeck.length===0)storyRefillDeck();
  const idx=storyDeck.pop();
  storyCurrentIdx=idx;
  storyCurrent=STORY_PLAYERS[idx];
  storyRevealed=1;
  storyGuessesUsed=0;
  storyRoundOver=false;
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

function storyWrongGuess(){
  if(storyRoundOver)return;
  playClickSound();
  storyGuessesUsed++;
  const maxClues=Math.min(storyClueCount,storyCurrent.clues.length);
  const hasMoreClues=storyRevealed<maxClues;
  if(storyGuessesUsed>=STORY_MAX_GUESSES && !hasMoreClues){
    storyRoundOver=true;
    toast("خلصت المحاولات");
  }else if(hasMoreClues){
    storyRevealed++;
  }
  if(storyGuessesUsed>=STORY_MAX_GUESSES){
    storyRoundOver=true;
  }
  storySaveState();
  renderStoryRound();
}

function storySkipRound(){
  if(storyRoundOver)return;
  playClickSound();
  const maxClues=Math.min(storyClueCount,storyCurrent.clues.length);
  if(storyRevealed<maxClues){
    storyRevealed++;
    toast("الدليل الجاي");
  }else{
    storyRoundOver=true;
    toast("محدش عارف؟ اتفرجوا على الإجابة");
  }
  storySaveState();
  renderStoryRound();
}

function storyCorrectGuess(team){
  if(storyRoundOver)return;
  playRevealSound();
  const pts=storyCurrentPoints();
  storyScores[team]+=pts;
  storyRoundOver=true;
  storySaveState();
  renderStoryScores();
  renderStoryRound();
  toast(`+${pts} لـ${storyTeamNames[team]}`);
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

  const guessesLeft=document.getElementById("storyGuessesLeft");
  if(guessesLeft)guessesLeft.textContent=Math.max(0,STORY_MAX_GUESSES-storyGuessesUsed);

  const nextBtn=document.getElementById("storyWrongBtn");
  const canRevealMore=storyRevealed<maxClues;
  if(nextBtn){
    nextBtn.disabled=storyRoundOver;
    nextBtn.textContent=storyGuessesUsed>=STORY_MAX_GUESSES-1 && canRevealMore
      ? "غلط ❌ (آخر محاولة)"
      : "غلط ❌";
  }

  const correctBtns=document.querySelectorAll(".story-correct-btn");
  correctBtns.forEach(b=>b.disabled=storyRoundOver);

  const skipBtn=document.getElementById("storySkipBtn");
  if(skipBtn)skipBtn.disabled=storyRoundOver;

  const answerBox=document.getElementById("storyAnswerBox");
  const nameSpan=document.getElementById("storyAnswerName");
  if(answerBox&&nameSpan){
    nameSpan.textContent=storyCurrent.name;
  }

  const ptsNow=document.getElementById("storyPointsNow");
  if(ptsNow)ptsNow.textContent=storyCurrentPoints();
}

/* restore the saved game once, when the page loads */
storyLoadState();
storyRefreshStartBtn();
