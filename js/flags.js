/* =========================================================
   FLAGS — one-phone "guess the flag" game. GM shows the flag,
   players call out a guess out loud, GM taps reveal, then marks
   عرفناها/منعرفهاش to keep a running score. Uses twemoji (loaded
   in <head>) so the flag renders the same on every phone/OS;
   falls back to the raw emoji if twemoji hasn't loaded.
========================================================= */

let fgDeck=[],fgIdx=0,fgRight=0,fgWrong=0,fgRevealed=false,fgStarted=false;

function flagEmoji(code){
  return code.toUpperCase().replace(/./g,c=>String.fromCodePoint(127397+c.charCodeAt(0)));
}

function flagsInit(){
  if(!fgStarted)flagsRestart();
}

function flagsRestart(){
  if(typeof FLAGS_DATA==="undefined"||!FLAGS_DATA.length)return;
  fgStarted=true;
  fgDeck=typeof seededShuffle==="function"
    ?seededShuffle(FLAGS_DATA,String(Date.now()))
    :[...FLAGS_DATA].sort(()=>Math.random()-.5);
  fgIdx=0;fgRight=0;fgWrong=0;
  flagsRender();
}

function flagsRender(){
  const item=fgDeck[fgIdx];
  if(!item)return;
  fgRevealed=false;

  const flagWrap=document.getElementById("fgFlag");
  if(flagWrap){
    flagWrap.innerHTML=`<span class="fg-emoji">${flagEmoji(item[0])}</span>`;
    if(window.twemoji){
      try{twemoji.parse(flagWrap,{folder:"svg",ext:".svg"});}catch(e){}
    }
  }

  const progress=document.getElementById("fgProgress");
  if(progress)progress.textContent=`${fgIdx+1} / ${fgDeck.length}`;

  const nameEl=document.getElementById("fgCountryName");
  if(nameEl)nameEl.textContent=item[1];

  const answer=document.getElementById("fgAnswer");
  const revealBtn=document.getElementById("fgRevealBtn");
  if(answer)answer.classList.add("hidden");
  if(revealBtn)revealBtn.classList.remove("hidden");

  flagsUpdateScore();
}

function flagsReveal(){
  if(fgRevealed)return;
  fgRevealed=true;
  if(typeof playRevealSound==="function")playRevealSound();

  const answer=document.getElementById("fgAnswer");
  const revealBtn=document.getElementById("fgRevealBtn");
  if(answer)answer.classList.remove("hidden");
  if(revealBtn)revealBtn.classList.add("hidden");
}

function flagsJudge(correct){
  if(correct)fgRight++;else fgWrong++;
  flagsUpdateScore();
  flagsNext();
}

function flagsNext(){
  if(typeof playClickSound==="function")playClickSound();
  if(fgIdx<fgDeck.length-1){
    fgIdx++;
    flagsRender();
  }else{
    if(typeof toast==="function"){
      toast(`خلصنا كل الأعلام (${fgDeck.length})! صح: ${fgRight} — غلط: ${fgWrong}`);
    }
  }
}

function flagsUpdateScore(){
  const el=document.getElementById("fgScore");
  if(el)el.innerHTML=`${fgRight}<small>/${fgRight+fgWrong}</small>`;
}
