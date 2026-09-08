/* =========================================================
   GENERIC MYSTERY GAME ENGINE
   (shared by every investigation-story game: ripper, mabhouh, ...)

   Adding a new story only needs:
   1. A new js/<game>-data.js file that calls registerGame(...)
   2. HTML sections whose element ids follow the "<game>Xxx" pattern
   3. Script tags for that data file added in index.html + init.js
      picks it up automatically — no other file needs to change.
========================================================= */

const GAMES={};

function registerGame(id,config){
  GAMES[id]={
    roles:config.roles,
    rounds:config.rounds,
    password:config.password,
    verifyPrefix:config.verifyPrefix,
    gmCode:localStorage.getItem(`${id}GmCode`)||"",
    playerCount:Number(localStorage.getItem(`${id}PlayerCount`))||config.roles.length,
    activeCount:null,
    selected:null
  };
}

function cap(s){
  return s.charAt(0).toUpperCase()+s.slice(1);
}

function el(game,suffix){
  return document.getElementById(`${game}${suffix}`);
}

/* ---------------------------------------------------------
   ROLE DISTRIBUTION
--------------------------------------------------------- */

function getGameRoles(game,code,count){
  const allRoles=GAMES[game].roles;
  const n=count||allRoles.length;

  if(!code){
    return allRoles.slice(0,n).map(r=>({...r,displayN:r.id}));
  }

  // الشخصيات اللي لازم تكون في اللعبة دايمًا (القاتل/الشريك) بتتفصل
  // عن الباقي، عشان لو عدد اللاعبين أقل من العدد الكامل، القاتل
  // يفضل مضمون إنه موزّع على حد فعلي مش على شخصية محدش هيلعبها.
  const essential=allRoles.filter(r=>r.killer||r.accomplice);
  const others=allRoles.filter(r=>!r.killer&&!r.accomplice);

  const shuffledOthers=seededShuffle(
    others,
    `${game.toUpperCase()}-${code}-OTHERS`
  );

  const fillCount=Math.max(0,n-essential.length);
  const chosen=essential.concat(shuffledOthers.slice(0,fillCount));

  const finalOrder=seededShuffle(
    chosen,
    `${game.toUpperCase()}-${code}-ORDER`
  );

  return finalOrder.map((r,i)=>({...r,displayN:i+1}));
}

function essentialRoleCount(game){
  return GAMES[game].roles.filter(r=>r.killer||r.accomplice).length;
}

function verifyGameCode(game,code,count){
  if(!code)return "---";

  const roles=getGameRoles(game,code,count);
  const order=roles
    .slice()
    .sort((a,b)=>a.displayN-b.displayN)
    .map(r=>r.id)
    .join("");

  const h=hashCode(order+"#"+code+"#"+(count||GAMES[game].roles.length));

  return `${GAMES[game].verifyPrefix}-${10+(h%90)}`;
}

/* ---------------------------------------------------------
   PLAYER FLOW
--------------------------------------------------------- */

function openGamePlayer(game){
  const saved=localStorage.getItem(`${game}Player`);

  if(saved){
    try{
      const p=JSON.parse(saved);
      const roles=getGameRoles(game,p.sessionCode,p.count);
      const r=roles.find(x=>x.id===p.roleId);

      if(r){
        renderGamePlayer(game,p.name,r);
        show(`${game}-player`);
        return;
      }
    }catch(e){}
  }

  show(`${game}-setup`);
}

function buildGameRoleButtons(game,count){
  const box=el(game,"Roles");
  if(!box)return;
  box.textContent="";

  const n=count||GAMES[game].roles.length;

  for(let i=1;i<=n;i++){
    const b=document.createElement("button");
    b.className="role-btn";
    b.type="button";
    b.dataset.role=i;

    const strong=document.createElement("strong");
    strong.textContent=`شخصية ${i}`;

    const small=document.createElement("small");
    small.textContent="اضغط للاختيار";

    b.append(strong,small);

    b.addEventListener("click",()=>{
      playClickSound();
      GAMES[game].selected=i;

      box.querySelectorAll(".role-btn")
        .forEach(x=>x.classList.toggle(
          "selected",
          Number(x.dataset.role)===i
        ));
    });

    box.appendChild(b);
  }
}

async function checkGameSessionCode(game){
  const value=el(game,"SessionCode").value.trim();
  const msg=el(game,"CodeMessage");

  if(value===""){
    msg.textContent="اكتب كود الجلسة الذي أعطاه لك الـGM.";
    msg.style.color="var(--muted)";
    return;
  }

  if(!/^\d{4}$/.test(value)){
    msg.textContent="كود الجلسة لازم يكون 4 أرقام.";
    msg.style.color="var(--red)";
    return;
  }

  let count=GAMES[game].roles.length;

  if(getLiveDbUrl()){
    const liveCount=await getGamePlayerCountLive(game,value);
    if(liveCount)count=liveCount;
  }

  GAMES[game].activeCount=count;
  buildGameRoleButtons(game,count);

  msg.style.color="var(--gold3)";
  msg.textContent=`كلمة التحقق: ${verifyGameCode(game,value,count)}`;
}

async function confirmGameRole(game){
  const name=el(game,"Name").value.trim();
  const code=el(game,"SessionCode").value.trim();

  if(!name){
    toast("اكتب اسمك الأول.");
    return;
  }

  if(!/^\d{4}$/.test(code)){
    toast("اكتب كود الجلسة المكون من 4 أرقام.");
    return;
  }

  if(!GAMES[game].selected){
    toast("اختر رقم الشخصية.");
    return;
  }

  if(getLiveDbUrl()){
    const active=await isSessionActive(game,code);
    if(!active){
      toast("كود الجلسة ده لسه مش موجود. تأكد إن الـGM بدأ اللعبة بنفس الكود.");
      return;
    }
  }

  const count=GAMES[game].activeCount||GAMES[game].roles.length;
  const roles=getGameRoles(game,code,count);
  const r=roles.find(x=>x.displayN===GAMES[game].selected);

  if(!r){
    toast("حصل خطأ في توزيع الشخصية.");
    return;
  }

  localStorage.setItem(
    `${game}Player`,
    JSON.stringify({
      name,
      roleId:r.id,
      sessionCode:code,
      count
    })
  );

  renderGamePlayer(game,name,r);
  pushPlayerStatus(game,code,r.displayN,name);
  show(`${game}-player`);
}

function renderGamePlayer(game,name,r){
  el(game,"PlayerBadge").textContent=
    `اللاعب: ${name} • الشخصية رقم ${r.displayN}`;

  el(game,"RoleName").textContent=r.name;
  el(game,"Public").textContent=
    `المعلومات العلنية: ${r.public}`;

  el(game,"Secret").textContent=r.secret;
  el(game,"Strength").textContent=r.strength;
  el(game,"Weakness").textContent=r.weakness;

  const mafia=r.killer||r.accomplice;

  el(game,"Mafia").classList.toggle("hidden",!mafia);

  el(game,"Notes").value=
    localStorage.getItem(`${game}Notes_${r.id}`)||"";

  if(mafia)playRevealSound();

  startLiveStatusPolling(game);
}

function saveGameNotes(game){
  const p=JSON.parse(
    localStorage.getItem(`${game}Player`)||"null"
  );

  if(!p)return;

  localStorage.setItem(
    `${game}Notes_${p.roleId}`,
    el(game,"Notes").value
  );

  const s=el(game,"Save");
  s.textContent="تم الحفظ تلقائيًا ✓";

  setTimeout(()=>s.textContent="",1200);
}

function resetGame(game){
  const p=JSON.parse(
    localStorage.getItem(`${game}Player`)||"null"
  );

  if(p){
    localStorage.removeItem(`${game}Notes_${p.roleId}`);

    // امسح بيانات اللاعب من المتابعة المباشرة كمان، مش بس من جهازه،
    // عشان الـGM ميفضلش شايف اسمه في اللعبة وهو أصلًا مسح شخصيته.
    if(getLiveDbUrl()){
      const roles=getGameRoles(game,p.sessionCode,p.count);
      const r=roles.find(x=>x.id===p.roleId);
      if(r)clearPlayerLive(game,p.sessionCode,r.displayN);
    }
  }

  localStorage.removeItem(`${game}Player`);

  GAMES[game].selected=null;

  el(game,"Name").value="";
  el(game,"SessionCode").value="";
  el(game,"CodeMessage").textContent="";

  document.querySelectorAll(`#${game}Roles .role-btn`)
    .forEach(x=>x.classList.remove("selected"));

  show(`${game}-setup`);
}

/* ---------------------------------------------------------
   GM FLOW
--------------------------------------------------------- */

function verifyGameGM(game){
  const value=el(game,"GmInput").value.trim();

  if(value===GAMES[game].password){
    el(game,"GmError").classList.add("hidden");
    el(game,"GmInput").value="";
    buildGameGM(game);
    show(`${game}-gm`);
  }else{
    el(game,"GmError").classList.remove("hidden");
  }
}

function generateGameCode(game){
  const input=el(game,"PlayerCountInput");
  const min=essentialRoleCount(game);
  const max=GAMES[game].roles.length;
  let count=input?parseInt(input.value,10):max;

  if(!count||isNaN(count))count=max;
  if(count<min)count=min;
  if(count>max)count=max;

  if(input)input.value=count;

  GAMES[game].playerCount=count;
  localStorage.setItem(`${game}PlayerCount`,count);

  GAMES[game].gmCode=makeSessionCode();

  localStorage.setItem(
    `${game}GmCode`,
    GAMES[game].gmCode
  );

  activateSession(game,GAMES[game].gmCode);
  setGamePlayerCountLive(game,GAMES[game].gmCode,count);

  buildGameGM(game);

  toast(`تم إنشاء توزيع عشوائي جديد لـ ${count} لاعبين.`);
}

async function buildGameGM(game){
  const gmCode=GAMES[game].gmCode;
  const count=GAMES[game].playerCount||
    Number(localStorage.getItem(`${game}PlayerCount`))||
    GAMES[game].roles.length;

  GAMES[game].playerCount=count;

  const countInput=el(game,"PlayerCountInput");
  if(countInput){
    const min=essentialRoleCount(game);
    const max=GAMES[game].roles.length;
    countInput.min=min;
    countInput.max=max;
    countInput.placeholder=max;
    if(!countInput.value)countInput.value=count;
  }

  const countLabel=el(game,"PlayerCountLabel");
  if(countLabel){
    const min=essentialRoleCount(game);
    const max=GAMES[game].roles.length;
    countLabel.textContent=
      min===max
        ? `عدد اللاعبين (${max})`
        : `عدد اللاعبين (من ${min} إلى ${max})`;
  }

  el(game,"CurrentCode").textContent=gmCode||"غير محدد";

  el(game,"VerifyCode").textContent=
    gmCode?verifyGameCode(game,gmCode,count):"---";

  const roles=getGameRoles(game,gmCode,count);
  const benched=GAMES[game].roles.filter(
    full=>!roles.find(r=>r.id===full.id)
  );

  const roleBox=el(game,"GMroles");
  roleBox.textContent="";

  let players=null;
  if(getLiveDbUrl()&&gmCode){
    players=await fetchPlayers(game,gmCode);
  }

  roles.forEach(r=>{
    const div=document.createElement("div");
    const pdata=players&&players[r.displayN];
    const taken=pdata&&pdata.name;
    const isOut=taken&&pdata.alive===false;
    div.className=isOut?"round out":(taken?"round taken":"round");

    let status="بريء من الجرائم";

    if(r.killer){
      status="الفاعل المباشر — المافيوسو";
    }else if(r.accomplice){
      status="الشريك المُسهّل — Mafioso الثاني";
    }

    const title=document.createElement("b");
    title.textContent=`رقم ${r.displayN}: ${r.name}`;

    if(isOut){
      const badge=document.createElement("span");
      badge.className="out-badge";
      badge.textContent="خرج من اللعبة";
      title.appendChild(badge);
    }else if(taken){
      const badge=document.createElement("span");
      badge.className="taken-badge";
      badge.textContent="✓ اتاخدت";
      title.appendChild(badge);
    }

    const br=document.createElement("br");

    const span=document.createElement("span");
    span.className=(r.killer||r.accomplice)?"danger":"";
    span.textContent=status;

    div.append(title,br,span);

    if(players&&players[r.displayN]&&players[r.displayN].name){
      const playerLine=document.createElement("div");
      playerLine.style.marginTop="8px";
      playerLine.style.color="var(--gold3)";
      playerLine.style.fontWeight="700";
      playerLine.textContent=`اللاعب: ${players[r.displayN].name}`;
      div.appendChild(playerLine);
    }else if(getLiveDbUrl()&&gmCode){
      const playerLine=document.createElement("div");
      playerLine.style.marginTop="8px";
      playerLine.style.color="var(--muted)";
      playerLine.style.fontSize="13px";
      playerLine.textContent="لسه محدش اختار الشخصية دي";
      div.appendChild(playerLine);
    }

    if(getLiveDbUrl()&&gmCode){
      const btnOut=document.createElement("button");
      btnOut.className="btn ghost";
      btnOut.style.marginTop="12px";
      btnOut.style.marginLeft="8px";
      btnOut.textContent="أخرجه من اللعبة";
      btnOut.onclick=async()=>{playClickSound();await setPlayerAlive(game,gmCode,r.displayN,false);toast(`${r.name} خرج من اللعبة`);buildGameGM(game);};

      const btnIn=document.createElement("button");
      btnIn.className="btn ghost";
      btnIn.style.marginTop="12px";
      btnIn.textContent="رجّعه للعبة";
      btnIn.onclick=async()=>{playClickSound();await setPlayerAlive(game,gmCode,r.displayN,true);toast(`${r.name} رجع للعبة`);buildGameGM(game);};

      div.append(document.createElement("br"),btnOut,btnIn);

      if(taken){
        const btnClear=document.createElement("button");
        btnClear.className="btn ghost";
        btnClear.style.marginTop="12px";
        btnClear.style.marginLeft="8px";
        btnClear.style.color="var(--red)";
        btnClear.style.borderColor="var(--red)";
        btnClear.textContent="امسح اللاعب من الشخصية دي";
        btnClear.onclick=async()=>{
          playClickSound();
          await clearPlayerLive(game,gmCode,r.displayN);
          toast(`اتمسح اللاعب من الشخصية رقم ${r.displayN}، حد تاني يقدر ياخدها.`);
          buildGameGM(game);
        };

        div.append(document.createElement("br"),btnClear);
      }
    }

    roleBox.appendChild(div);
  });

  if(benched.length){
    const note=document.createElement("p");
    note.className="small";
    note.style.marginTop="10px";
    note.style.color="var(--muted)";
    note.textContent=
      `مش في اللعبة دي (العدد المختار ${count} لاعبين): `+
      benched.map(b=>b.name).join("، ");
    roleBox.appendChild(note);
  }

  const roundsBox=el(game,"Rounds");
  roundsBox.textContent="";

  GAMES[game].rounds.forEach(round=>{
    const d=document.createElement("details");

    const s=document.createElement("summary");
    s.textContent=round.title;

    const p=document.createElement("p");
    const pb=document.createElement("b");
    pb.textContent="الدليل: ";
    p.append(pb,document.createTextNode(round.text));

    const e=document.createElement("div");
    e.className="evidence";

    const eb=document.createElement("b");
    eb.textContent="الدليل المادي: ";
    e.append(eb,document.createTextNode(round.evidence));

    d.append(s,p,e);

    if(round.privateRole){
      const mapped=roles.find(r=>r.id===round.privateRole);

      if(mapped){
        const note=document.createElement("div");
        note.className="private-note";

        const nb=document.createElement("b");
        nb.textContent=
          `ملاحظة خاصة — شخصية رقم ${mapped.displayN} فقط: `;

        note.append(
          nb,
          document.createTextNode(round.private)
        );

        d.appendChild(note);
      }
    }

    const p2=document.createElement("p");
    const b2=document.createElement("b");
    b2.textContent="السطحية: ";
    p2.append(b2,document.createTextNode(round.surface));

    const p3=document.createElement("p");
    const b3=document.createElement("b");
    b3.textContent="الأعمق: ";
    p3.append(b3,document.createTextNode(round.deep));

    d.append(p2,p3);
    roundsBox.appendChild(d);
  });

  const nav=el(game,"RoundNav");
  nav.textContent="";

  GAMES[game].rounds.forEach((round,i)=>{
    const b=document.createElement("button");
    b.className="round-chip";
    b.id=`${game}Chip${i+1}`;
    b.type="button";
    b.textContent=`الجولة ${i+1}`;

    b.addEventListener("click",()=>{
      setCurrentRoundGeneric(game,i+1);
    });

    nav.appendChild(b);
  });

  const savedRound=Number(
    localStorage.getItem(`${game}CurrentRound`)||0
  );

  if(savedRound){
    const chip=document.getElementById(`${game}Chip${savedRound}`);
    if(chip)chip.classList.add("active");
  }

  buildVoteTally(game);
}
