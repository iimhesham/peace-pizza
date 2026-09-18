/* =========================================================
   قصة — player-story guessing game
   Two teams, progressive clues (hardest -> easiest), points
   per clue reached (3 / 2 / 1), max 2 guesses per round.
   Data lives in STORY_PLAYERS (see story-data.js).
========================================================= */

const STORY_POINTS=[3,2,1]; // points if solved while clue 1 / 2 / 3 is the latest shown
const STORY_MAX_GUESSES=2;

let storyDeck=[];      // shuffled indices into STORY_PLAYERS, not-yet-played
let storyCurrent=null; // current player object
let storyClueCount=3;  // 3 (عادي) or 4 (صعب)
let storyRevealed=1;   // how many clues are currently shown
let storyGuessesUsed=0;
let storyRoundOver=false;
let storyScores={a:0,b:0};
let storyTeamNames={a:"الفريق الأول",b:"الفريق الثاني"};

function storyLoadState(){
  try{
    const saved=JSON.parse(localStorage.getItem("storyState")||"null");
    if(saved){
      if(typeof saved.scoreA==="number")storyScores.a=saved.scoreA;
      if(typeof saved.scoreB==="number")storyScores.b=saved.scoreB;
      if(saved.teamA)storyTeamNames.a=saved.teamA;
      if(saved.teamB)storyTeamNames.b=saved.teamB;
    }
  }catch(e){}
}

function storySaveState(){
  try{
    localStorage.setItem("storyState",JSON.stringify({
      scoreA:storyScores.a,
      scoreB:storyScores.b,
      teamA:storyTeamNames.a,
      teamB:storyTeamNames.b
    }));
  }catch(e){}
}

function storyRefillDeck(){
  const all=STORY_PLAYERS.map((_,i)=>i);
  storyDeck=seededShuffle(all,"story-"+Date.now()+"-"+Math.random());
}

function storyStartGame(){
  storyLoadState();
  document.getElementById("storyTeamAInput").value=storyTeamNames.a;
  document.getElementById("storyTeamBInput").value=storyTeamNames.b;
  storyRefillDeck();
  storyNextRound(true);
  renderStoryScores();
  show("story-game");
}

function storySetHardMode(on){
  storyClueCount=on?4:3;
  toast(on?"الوضع الصعب: 4 أدلة":"الوضع العادي: 3 أدلة");
}

function storyNextRound(silent){
  if(storyDeck.length===0)storyRefillDeck();
  const idx=storyDeck.pop();
  storyCurrent=STORY_PLAYERS[idx];
  storyRevealed=1;
  storyGuessesUsed=0;
  storyRoundOver=false;
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

function storyResetScores(){
  storyScores={a:0,b:0};
  storySaveState();
  renderStoryScores();
  toast("النقط اتصفرت");
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

  const answerBox=document.getElementById("storyAnswerBox");
  const nameSpan=document.getElementById("storyAnswerName");
  if(answerBox&&nameSpan){
    if(storyRoundOver){
      nameSpan.textContent=storyCurrent.name;
      answerBox.classList.remove("hidden");
    }else{
      answerBox.classList.add("hidden");
      nameSpan.textContent="";
    }
  }

  const ptsNow=document.getElementById("storyPointsNow");
  if(ptsNow)ptsNow.textContent=storyCurrentPoints();
}
