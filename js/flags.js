/* =========================================================
   FLAGS — one-phone "guess the flag" game. GM shows the flag,
   players call out a guess out loud, GM taps reveal, then marks
   عرفناها/منعرفهاش to keep a running score. Current flags are shown as big
   SVG images (flag-icons via jsDelivr) so every flag is crisp and the
   same on every phone; if the image can't load it falls back to the
   twemoji/raw emoji. A results screen shows the score and the missed flags.

   Two modes, same UI/scoring:
   - "current"    → FLAGS_DATA:            [code, name]
   - "historical" → FLAGS_HISTORICAL_DATA: [imageUrl, hint, answer, note]
     (old flags have no emoji, so these ship an actual image and
     a spoken hint instead of the name — see flags-historical-data.js)
========================================================= */

let fgDeck=[],fgIdx=0,fgRight=0,fgWrong=0,fgRevealed=false,fgStarted=false,fgFinished=false;
let fgMode="current";
let fgMissed=[];      // items answered «منعرفهاش»
let fgSkipped=0;

const FG_IMG_BASE="https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3/";
function flagImgUrl(code){return FG_IMG_BASE+code.toLowerCase()+".svg";}

/* big flag image, with an emoji fallback if the image fails to load */
function flagImgEl(code,cls){
  const img=document.createElement("img");
  img.className=cls||"fg-img";
  img.alt="";
  img.decoding="async";
  img.src=flagImgUrl(code);
  img.onerror=()=>{
    const span=document.createElement("span");
    span.className="fg-emoji";
    span.textContent=flagEmoji(code);
    img.replaceWith(span);
    if(window.twemoji){try{twemoji.parse(span.parentNode,{folder:"svg",ext:".svg"});}catch(e){}}
  };
  return img;
}

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
  fgIdx=0;fgRight=0;fgWrong=0;fgFinished=false;fgMissed=[];fgSkipped=0;
  flagsShowResult(false);
  flagsUpdateModeButtons();
  flagsRender();
}

function flagsRender(){
  const item=fgDeck[fgIdx];
  if(!item)return;
  fgRevealed=false;
  fgFinished=false;

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
      flagWrap.textContent="";
      flagWrap.appendChild(flagImgEl(item[0],"fg-img"));
    }
    /* warm the cache for the next flag so it appears instantly */
    const nxt=fgDeck[fgIdx+1];
    if(nxt){const pre=new Image();pre.src=flagImgUrl(nxt[0]);}
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
  if(fgRevealed||fgFinished)return;
  fgRevealed=true;
  if(typeof playRevealSound==="function")playRevealSound();

  const answer=document.getElementById("fgAnswer");
  const revealBtn=document.getElementById("fgRevealBtn");
  if(answer)answer.classList.remove("hidden");
  if(revealBtn)revealBtn.classList.add("hidden");
}

function flagsJudge(correct){
  if(fgFinished)return;
  if(correct)fgRight++;
  else{
    fgWrong++;
    const it=fgDeck[fgIdx];
    if(it)fgMissed.push(fgMode==="historical"?{name:it[2],note:it[3]}:{name:it[1],code:it[0]});
  }
  flagsUpdateScore();
  flagsNext();
}

function flagsSkip(){
  if(fgFinished)return;
  fgSkipped++;
  flagsNext();
}

function flagsNext(){
  if(fgFinished)return;
  if(typeof playClickSound==="function")playClickSound();
  if(fgIdx<fgDeck.length-1){
    fgIdx++;
    flagsRender();
  }else{
    fgFinished=true;
    flagsShowResult(true);
  }
}

/* ---------- results screen ---------- */
function flagsFinishNow(){
  if(typeof playClickSound==="function")playClickSound();
  fgFinished=true;
  flagsShowResult(true);
}

function flagsShowResult(on){
  const sec=document.getElementById("flags");
  if(sec)sec.classList.toggle("fg-showing-result",!!on);
  if(!on)return;
  flagsRenderResult();
  window.scrollTo({top:0,behavior:"smooth"});
}

function flagsResume(){
  /* back from the results screen to the flag we were on */
  if(typeof playClickSound==="function")playClickSound();
  fgFinished=false;
  flagsShowResult(false);
  const skipBtn=document.getElementById("fgSkipBtn");
  if(skipBtn)skipBtn.classList.remove("hidden");
  if(fgIdx>=fgDeck.length-1&&(fgRight+fgWrong+fgSkipped)>=fgDeck.length){flagsRestart();return;}
  flagsRender();
}

function flagsRenderResult(){
  const total=fgRight+fgWrong;
  const pct=total?Math.round(fgRight/total*100):0;
  const set=(id,t)=>{const el=document.getElementById(id);if(el)el.textContent=t;};
  set("fgResScore",`${fgRight} / ${total}`);
  set("fgResPct",total?`${pct}%`:"—");
  set("fgResMsg",
    !total?"لسه محدش جاوب على أي علم"
    :pct>=90?"أسطورة الأعلام 🔥"
    :pct>=70?"ممتاز 👏"
    :pct>=50?"كويس، فيه مجال للتحسن"
    :"محتاجين مراجعة 😅");
  set("fgResMeta",
    `${fgMode==="historical"?"أعلام قديمة":"أعلام دلوقتي"} · اتسجلت ${total} من ${fgDeck.length}`+(fgSkipped?` · اتخطينا ${fgSkipped}`:""));

  const wrap=document.getElementById("fgResMissed");
  const title=document.getElementById("fgResMissedTitle");
  if(!wrap)return;
  wrap.textContent="";
  if(title)title.classList.toggle("hidden",fgMissed.length===0);
  fgMissed.forEach(m=>{
    const row=document.createElement("div");
    row.className="fg-res-row";
    if(m.code)row.appendChild(flagImgEl(m.code,"fg-res-flag"));
    const t=document.createElement("span");
    t.className="fg-res-name";
    t.textContent=m.name;
    row.appendChild(t);
    wrap.appendChild(row);
  });
}

function flagsUpdateScore(){
  const el=document.getElementById("fgScore");
  if(el)el.innerHTML=`${fgRight}<small>/${fgRight+fgWrong}</small>`;
}
