/* =========================================================
   GENERIC VOTING (shared by every registered mystery game)
========================================================= */

function getSavedPlayerCode(game){
  try{
    const saved=JSON.parse(localStorage.getItem(`${game}Player`)||"null");
    return saved?saved.sessionCode:null;
  }catch(e){
    return null;
  }
}

function getSavedPlayerDisplayN(game){
  try{
    const saved=JSON.parse(localStorage.getItem(`${game}Player`)||"null");
    if(!saved)return null;
    const roles=getGameRoles(game,saved.sessionCode);
    const r=roles.find(x=>x.id===saved.roleId);
    return r?r.displayN:null;
  }catch(e){
    return null;
  }
}

async function setCurrentRoundLive(game,code,round){
  const url=getLiveDbUrl();
  if(!url||!code)return;
  try{
    await fetch(`${url}/sessions/${game}/${code}/currentRound.json`,{
      method:"PUT",
      body:JSON.stringify(round)
    });
  }catch(e){}
}

async function getCurrentRoundLive(game,code){
  const url=getLiveDbUrl();
  if(!url||!code)return 0;
  try{
    const res=await fetch(`${url}/sessions/${game}/${code}/currentRound.json`);
    if(!res.ok)return 0;
    const data=await res.json();
    return Number(data)||0;
  }catch(e){
    return 0;
  }
}

async function submitVote(game,targetDisplayN){
  const url=getLiveDbUrl();
  const code=getSavedPlayerCode(game);
  const voterN=getSavedPlayerDisplayN(game);

  if(!url){
    toast("الـGM لسه ما فعّلش المتابعة المباشرة، التصويت محتاجها.");
    return;
  }
  if(!code||!voterN){
    toast("محتاج تأكد شخصيتك الأول.");
    return;
  }

  // امنع اللاعب اللي خرج من اللعبة من إنه يصوّت أو يغيّر صوته.
  const players=await fetchPlayers(game,code);
  if(players&&players[voterN]&&players[voterN].alive===false){
    toast("خرجت من اللعبة، متقدرش تصوّت تاني.");
    refreshVoteUI(game);
    return;
  }

  const round=await getCurrentRoundLive(game,code);
  if(!round){
    toast("الـGM لسه ما حددش الجولة الحالية.");
    return;
  }

  try{
    await fetch(`${url}/sessions/${game}/${code}/votes/${round}/${voterN}.json`,{
      method:"PUT",
      body:JSON.stringify(targetDisplayN)
    });
    playClickSound();
    toast("اتسجل صوتك.");
    refreshVoteUI(game);
  }catch(e){
    toast("تعذر تسجيل الصوت، تأكد من الاتصال.");
  }
}

async function fetchVotes(game,code,round){
  const url=getLiveDbUrl();
  if(!url||!code||!round)return null;
  try{
    const res=await fetch(`${url}/sessions/${game}/${code}/votes/${round}.json`);
    if(!res.ok)return null;
    return await res.json();
  }catch(e){
    return null;
  }
}

async function refreshVoteUI(game,codeArg,playersArg){
  const statusEl=document.getElementById(`${game}VoteStatus`);
  const targetsEl=document.getElementById(`${game}VoteTargets`);
  if(!statusEl||!targetsEl)return;

  const url=getLiveDbUrl();
  const code=codeArg||getSavedPlayerCode(game);

  if(!url||!code){
    statusEl.textContent="التصويت هيظهر هنا لما الـGM يفعّل المتابعة المباشرة.";
    targetsEl.textContent="";
    return;
  }

  const round=await getCurrentRoundLive(game,code);
  if(!round){
    statusEl.textContent="لسه مفيش تصويت مفتوح، استنى الـGM.";
    targetsEl.textContent="";
    return;
  }

  // لو الداتا اتبعتت جاهزة (من pollLiveStatusOnce) بنستخدمها زي ما هي
  // من غير طلب إضافي لنفس البيانات.
  const players=playersArg!==undefined?playersArg:await fetchPlayers(game,code);
  const voterN=getSavedPlayerDisplayN(game);

  // اللاعب اللي خرج من اللعبة مايشوفش أزرار التصويت خالص، وبدل كده
  // بيشوف رسالة واضحة إنه خارج.
  if(players&&voterN&&players[voterN]&&players[voterN].alive===false){
    statusEl.textContent="خرجت من اللعبة، متقدرش تصوّت تاني، لكن كمّل متابعة باقي الأحداث.";
    targetsEl.textContent="";
    return;
  }

  const votes=await fetchVotes(game,code,round)||{};
  const myVote=voterN?votes[voterN]:null;

  statusEl.textContent=myVote
    ? `صوّتت للشخصية رقم ${myVote} في الجولة ${round}. تقدر تغيّر صوتك.`
    : `التصويت مفتوح للجولة ${round}. اختر رقم الشخصية اللي تشك فيها.`;

  targetsEl.textContent="";
  if(!players)return;

  Object.keys(players)
    .map(k=>Number(k))
    .sort((a,b)=>a-b)
    .forEach(n=>{
      const p=players[n];
      const alive=p.alive!==false;
      const b=document.createElement("button");
      b.className="vote-target-btn"+(myVote===n?" selected":"");
      b.type="button";
      b.textContent=`${n}. ${p.name||"لاعب"}`;
      if(!alive)b.disabled=true;
      b.onclick=()=>submitVote(game,n);
      targetsEl.appendChild(b);
    });
}

async function buildVoteTally(game){
  const tallyEl=document.getElementById(`${game}VoteTally`);
  if(!tallyEl)return;

  const gmCode=GAMES[game]&&GAMES[game].gmCode;

  if(!getLiveDbUrl()||!gmCode){
    tallyEl.innerHTML=`<p class="small">فعّل المتابعة المباشرة وولّد كود جلسة الأول.</p>`;
    return;
  }

  const round=Number(localStorage.getItem(`${game}CurrentRound`)||0);

  if(!round){
    tallyEl.innerHTML=`<p class="small">اختر الجولة الحالية بالأعلى الأول.</p>`;
    return;
  }

  const [players,votes]=await Promise.all([
    fetchPlayers(game,gmCode),
    fetchVotes(game,gmCode,round)
  ]);

  const counts={};
  if(votes){
    Object.values(votes).forEach(target=>{
      counts[target]=(counts[target]||0)+1;
    });
  }

  const entries=Object.keys(counts).map(n=>({n:Number(n),count:counts[n]}));
  entries.sort((a,b)=>b.count-a.count);
  const maxCount=entries.length?entries[0].count:0;

  tallyEl.innerHTML="";

  if(!entries.length){
    tallyEl.innerHTML=`<p class="small">مفيش أصوات مسجلة لسه للجولة ${round}.</p>`;
    return;
  }

  entries.forEach(e=>{
    const name=players&&players[e.n]&&players[e.n].name?players[e.n].name:`شخصية ${e.n}`;
    const row=document.createElement("div");
    row.className="vote-row"+(e.count===maxCount?" leading":"");

    const vname=document.createElement("span");
    vname.className="vname";
    vname.textContent=`${e.n}. ${name}`;

    const track=document.createElement("div");
    track.className="vote-bar-track";
    const fill=document.createElement("div");
    fill.className="vote-bar-fill";
    fill.style.width=`${maxCount?(e.count/maxCount*100):0}%`;
    track.appendChild(fill);

    const count=document.createElement("span");
    count.className="vote-count";
    count.textContent=e.count;

    row.append(vname,track,count);
    tallyEl.appendChild(row);
  });
}

async function eliminateTopVoted(game){
  const gmCode=GAMES[game]&&GAMES[game].gmCode;
  const round=Number(localStorage.getItem(`${game}CurrentRound`)||0);

  if(!getLiveDbUrl()||!gmCode||!round){
    toast("محتاج تفعّل المتابعة المباشرة وتحدد الجولة الأول.");
    return;
  }

  const votes=await fetchVotes(game,gmCode,round);
  if(!votes){
    toast("مفيش أصوات مسجلة لسه.");
    return;
  }

  const counts={};
  Object.values(votes).forEach(target=>{
    counts[target]=(counts[target]||0)+1;
  });

  let topN=null,topCount=-1;
  Object.keys(counts).forEach(n=>{
    if(counts[n]>topCount){topCount=counts[n];topN=Number(n);}
  });

  if(topN===null){
    toast("مفيش نتيجة واضحة.");
    return;
  }

  await setPlayerAlive(game,gmCode,topN,false);
  toast(`الشخصية رقم ${topN} خرجت من اللعبة بصمت.`);

  buildGameGM(game);
  buildVoteTally(game);
}

function setCurrentRoundGeneric(game,n){
  localStorage.setItem(`${game}CurrentRound`,n);

  document.querySelectorAll(`#${game}-gm .round-chip, #${game}RoundNav .round-chip`)
    .forEach(x=>x.classList.remove("active"));

  const chip=document.getElementById(`${game}Chip${n}`);
  if(chip)chip.classList.add("active");

  const gmCode=GAMES[game]&&GAMES[game].gmCode;
  if(gmCode)setCurrentRoundLive(game,gmCode,n);

  buildVoteTally(game);
}
