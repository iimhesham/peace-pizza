/* =========================================================
   FLAGS — one-phone "guess the flag" game. GM shows the flag,
   players call out a guess out loud, GM taps reveal, then marks
   عرفناها/منعرفهاش to keep a running score. Uses twemoji (loaded
   in <head>) so the flag renders the same on every phone/OS;
   falls back to the raw emoji if twemoji hasn't loaded.

   Two modes, same UI/scoring:
   - "current"    → FLAGS_DATA:            [code, name]
   - "historical" → FLAGS_HISTORICAL_DATA: [imageUrl, hint, answer, note]
     (old flags have no emoji, so these ship an actual image and
     a spoken hint instead of the name — see flags-historical-data.js)
========================================================= */

let fgDeck=[],fgIdx=0,fgRight=0,fgWrong=0,fgRevealed=false,fgStarted=false;
let fgMode="current";

function flagEmoji(code){
  return code.toUpperCase().replace(/./g,c=>String.fromCodePoint(127397+c.charCodeAt(0)));
}

function flagsInit(){
  if(!fgStarted)flagsRestart();
}

function flagsDataFor(mode){
  if(mode==="historical")return typeof FLAGS_HISTORICAL_DATA!=="undefined"?FLAGS_HISTORICAL_DATA:[];
  return typeof FLAGS_DATA!=="undefined"?FLAGS_DATA:[];
}

function flagsSetMode(mode){
  if(mode===fgMode)return;
  if(!flagsDataFor(mode).length)return;
  fgMode=mode;
  if(typeof playClickSound==="function")playClickSound();
  flagsUpdateModeButtons();
  flagsRestart();
}

function flagsUpdateModeButtons(){
  const cur=document.getElementById("fgModeCurrent");
  const hist=document.getElementById("fgModeHistorical");
  if(cur)cur.classList.toggle("fg-mode-active",fgMode==="current");
  if(hist)hist.classList.toggle("fg-mode-active",fgMode==="historical");
}

function flagsRestart(){
  const data=flagsDataFor(fgMode);
  if(!data.length)return;
  fgStarted=true;
  fgDeck=typeof seededShuffle==="function"
    ?seededShuffle(data,String(Date.now()))
    :[...data].sort(()=>Math.random()-.5);
  fgIdx=0;fgRight=0;fgWrong=0;
  flagsUpdateModeButtons();
  flagsRender();
}

function flagsRender(){
  const item=fgDeck[fgIdx];
  if(!item)return;
  fgRevealed=false;

  const flagWrap=document.getElementById("fgFlag");
  const hintEl=document.getElementById("fgHint");
  const noteEl=document.getElementById("fgNote");
  const nameEl=document.getElementById("fgCountryName");

  if(fgMode==="historical"){
    const[svgMarkup,hint,answer,note]=item;
    if(flagWrap){
      flagWrap.innerHTML=`<div class="fg-histflag">${svgMarkup}</div>`;
    }
    if(hintEl){hintEl.textContent=hint;hintEl.classList.remove("hidden");}
    if(nameEl)nameEl.textContent=answer;
    if(noteEl){noteEl.textContent=note;noteEl.classList.remove("hidden");}
  }else{
    if(flagWrap){
      flagWrap.innerHTML=`<span class="fg-emoji">${flagEmoji(item[0])}</span>`;
      if(window.twemoji){
        try{twemoji.parse(flagWrap,{folder:"svg",ext:".svg"});}catch(e){}
      }
    }
    if(hintEl)hintEl.classList.add("hidden");
    if(nameEl)nameEl.textContent=item[1];
    if(noteEl)noteEl.classList.add("hidden");
  }

  const progress=document.getElementById("fgProgress");
  if(progress)progress.textContent=`${fgIdx+1} / ${fgDeck.length}`;

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
