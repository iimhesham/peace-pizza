/* =========================================================
   MABHOUH SESSION
========================================================= */

function getMabhouhRoles(code){
  if(!code){
    return mabhouhRoles.map(r=>({...r,displayN:r.id}));
  }

  return seededShuffle(
    mabhouhRoles,
    "MABHOUH-"+code
  ).map((r,i)=>({...r,displayN:i+1}));
}

function verifyMabhouhCode(code){
  if(!code)return "---";

  const roles=getMabhouhRoles(code);
  const order=roles
    .slice()
    .sort((a,b)=>a.displayN-b.displayN)
    .map(r=>r.id)
    .join("");

  const h=hashCode(order+"#"+code);

  return "DUBAI10-"+String(10+(h%90));
}

function mabhouhPlayer(){
  const saved=localStorage.getItem("mabhouhPlayer");

  if(saved){
    try{
      const p=JSON.parse(saved);
      const roles=getMabhouhRoles(p.sessionCode);
      const r=roles.find(x=>x.id===p.roleId);

      if(r){
        renderMabhouhPlayer(p.name,r);
        show("mabhouh-player");
        return;
      }
    }catch(e){}
  }

  show("mabhouh-setup");
}

function buildMabhouhRoles(){
  const box=document.getElementById("mabhouhRoles");
  box.textContent="";

  for(let n=1;n<=mabhouhRoles.length;n++){
    const b=document.createElement("button");
    b.className="role-btn";
    b.type="button";
    b.dataset.role=n;

    const strong=document.createElement("strong");
    strong.textContent=`شخصية ${n}`;

    const small=document.createElement("small");
    small.textContent="اضغط للاختيار";

    b.append(strong,small);

    b.addEventListener("click",()=>{
      playClickSound();
      mabhouhSelected=n;

      document.querySelectorAll("#mabhouhRoles .role-btn")
        .forEach(x=>x.classList.toggle(
          "selected",
          Number(x.dataset.role)===n
        ));
    });

    box.appendChild(b);
  }
}

function checkMabhouhCode(){
  const value=document.getElementById("mabhouhSessionCode").value.trim();
  const msg=document.getElementById("mabhouhCodeMessage");

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

  msg.style.color="var(--gold3)";
  msg.textContent=`كلمة التحقق: ${verifyMabhouhCode(value)}`;
}

async function confirmMabhouhRole(){
  const name=document.getElementById("mabhouhName").value.trim();
  const code=document.getElementById("mabhouhSessionCode").value.trim();

  if(!name){
    toast("اكتب اسمك الأول.");
    return;
  }

  if(!/^\d{4}$/.test(code)){
    toast("اكتب كود الجلسة المكون من 4 أرقام.");
    return;
  }

  if(!mabhouhSelected){
    toast("اختر رقم الشخصية.");
    return;
  }

  if(getLiveDbUrl()){
    const active=await isSessionActive("mabhouh",code);
    if(!active){
      toast("كود الجلسة ده لسه مش موجود. تأكد إن الـGM بدأ اللعبة بنفس الكود.");
      return;
    }
  }

  const roles=getMabhouhRoles(code);
  const r=roles.find(x=>x.displayN===mabhouhSelected);

  if(!r){
    toast("حصل خطأ في توزيع الشخصية.");
    return;
  }

  localStorage.setItem(
    "mabhouhPlayer",
    JSON.stringify({
      name,
      roleId:r.id,
      sessionCode:code
    })
  );

  renderMabhouhPlayer(name,r);
  pushPlayerStatus("mabhouh",code,r.displayN,name);
  show("mabhouh-player");
}

function renderMabhouhPlayer(name,r){
  document.getElementById("mabhouhPlayerBadge").textContent=
    `اللاعب: ${name} • الشخصية رقم ${r.displayN}`;

  document.getElementById("mabhouhRoleName").textContent=r.name;
  document.getElementById("mabhouhPublic").textContent=
    `المعلومات العلنية: ${r.public}`;

  document.getElementById("mabhouhSecret").textContent=r.secret;
  document.getElementById("mabhouhStrength").textContent=r.strength;
  document.getElementById("mabhouhWeakness").textContent=r.weakness;

  const mafia=r.killer||r.accomplice;

  document.getElementById("mabhouhMafia")
    .classList.toggle("hidden",!mafia);

  document.getElementById("mabhouhNotes").value=
    localStorage.getItem(`mabhouhNotes_${r.id}`)||"";

  if(mafia)playRevealSound();

  startLiveStatusPolling("mabhouh");
}

function saveMabhouhNotes(){
  const p=JSON.parse(
    localStorage.getItem("mabhouhPlayer")||"null"
  );

  if(!p)return;

  localStorage.setItem(
    `mabhouhNotes_${p.roleId}`,
    document.getElementById("mabhouhNotes").value
  );

  const s=document.getElementById("mabhouhSave");
  s.textContent="تم الحفظ تلقائيًا ✓";

  setTimeout(()=>s.textContent="",1200);
}

function resetMabhouh(){
  const p=JSON.parse(
    localStorage.getItem("mabhouhPlayer")||"null"
  );

  if(p){
    localStorage.removeItem(`mabhouhNotes_${p.roleId}`);
  }

  localStorage.removeItem("mabhouhPlayer");

  mabhouhSelected=null;

  document.getElementById("mabhouhName").value="";
  document.getElementById("mabhouhSessionCode").value="";
  document.getElementById("mabhouhCodeMessage").textContent="";

  document.querySelectorAll("#mabhouhRoles .role-btn")
    .forEach(x=>x.classList.remove("selected"));

  show("mabhouh-setup");
}

function verifyMabhouhGM(){
  const value=document.getElementById("mabhouhGmInput").value.trim();

  if(value==="هشام"){
    document.getElementById("mabhouhGmError").classList.add("hidden");
    document.getElementById("mabhouhGmInput").value="";
    buildMabhouhGM();
    show("mabhouh-gm");
  }else{
    document.getElementById("mabhouhGmError").classList.remove("hidden");
  }
}

function generateMabhouhCode(){
  mabhouhGmCode=makeSessionCode();

  localStorage.setItem(
    "mabhouhGmCode",
    mabhouhGmCode
  );

  activateSession("mabhouh",mabhouhGmCode);

  buildMabhouhGM();

  toast("تم إنشاء توزيع عشوائي جديد.");
}

async function buildMabhouhGM(){
  document.getElementById("currentMabhouhCode").textContent=
    mabhouhGmCode||"غير محدد";

  document.getElementById("mabhouhVerifyCode").textContent=
    mabhouhGmCode
      ? verifyMabhouhCode(mabhouhGmCode)
      : "---";

  const roles=getMabhouhRoles(mabhouhGmCode);
  const roleBox=document.getElementById("mabhouhGMroles");
  roleBox.textContent="";

  let mabhouhPlayers=null;
  if(getLiveDbUrl()&&mabhouhGmCode){
    mabhouhPlayers=await fetchPlayers("mabhouh",mabhouhGmCode);
  }

  roles.forEach(r=>{
    const div=document.createElement("div");
    const pdata=mabhouhPlayers&&mabhouhPlayers[r.displayN];
    const taken=pdata&&pdata.name;
    const isOut=taken&&pdata.alive===false;
    div.className=isOut?"round out":(taken?"round taken":"round");

    let status="مش المسؤول عن اللحظة الأخيرة من العملية";

    if(r.killer){
      status="المسؤول عن تنفيذ اللحظة الأخيرة — المافيوسو";
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

    if(mabhouhPlayers&&mabhouhPlayers[r.displayN]&&mabhouhPlayers[r.displayN].name){
      const playerLine=document.createElement("div");
      playerLine.style.marginTop="8px";
      playerLine.style.color="var(--gold3)";
      playerLine.style.fontWeight="700";
      playerLine.textContent=`اللاعب: ${mabhouhPlayers[r.displayN].name}`;
      div.appendChild(playerLine);
    }else if(getLiveDbUrl()&&mabhouhGmCode){
      const playerLine=document.createElement("div");
      playerLine.style.marginTop="8px";
      playerLine.style.color="var(--muted)";
      playerLine.style.fontSize="13px";
      playerLine.textContent="لسه محدش اختار الشخصية دي";
      div.appendChild(playerLine);
    }

    if(getLiveDbUrl()&&mabhouhGmCode){
      const btnOut=document.createElement("button");
      btnOut.className="btn ghost";
      btnOut.style.marginTop="12px";
      btnOut.style.marginLeft="8px";
      btnOut.textContent="أخرجه من اللعبة";
      btnOut.onclick=async()=>{playClickSound();await setPlayerAlive("mabhouh",mabhouhGmCode,r.displayN,false);toast(`${r.name} خرج من اللعبة`);buildMabhouhGM();};

      const btnIn=document.createElement("button");
      btnIn.className="btn ghost";
      btnIn.style.marginTop="12px";
      btnIn.textContent="رجّعه للعبة";
      btnIn.onclick=async()=>{playClickSound();await setPlayerAlive("mabhouh",mabhouhGmCode,r.displayN,true);toast(`${r.name} رجع للعبة`);buildMabhouhGM();};

      div.append(document.createElement("br"),btnOut,btnIn);
    }

    roleBox.appendChild(div);
  });

  const roundsBox=document.getElementById("mabhouhRounds");
  roundsBox.textContent="";

  mabhouhRounds.forEach(round=>{
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

  const nav=document.getElementById("mabhouhRoundNav");
  nav.textContent="";

  mabhouhRounds.forEach((round,i)=>{
    const b=document.createElement("button");
    b.className="round-chip";
    b.id=`mabhouhChip${i+1}`;
    b.type="button";
    b.textContent=`الجولة ${i+1}`;

    b.addEventListener("click",()=>{
      setCurrentRoundGeneric("mabhouh",i+1);
    });

    nav.appendChild(b);
  });

  const savedRound=Number(
    localStorage.getItem("mabhouhCurrentRound")||0
  );

  if(savedRound){
    const chip=document.getElementById(`mabhouhChip${savedRound}`);
    if(chip)chip.classList.add("active");
  }

  buildVoteTally("mabhouh");
}
