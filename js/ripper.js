/* =========================================================
   RIPPER SESSION
========================================================= */

function getRipperRoles(code){
  if(!code){
    return ripperRoles.map(r=>({...r,displayN:r.id}));
  }

  return seededShuffle(
    ripperRoles,
    "RIPPER-"+code
  ).map((r,i)=>({...r,displayN:i+1}));
}

function verifyRipperCode(code){
  if(!code)return "---";

  const roles=getRipperRoles(code);
  const order=roles
    .slice()
    .sort((a,b)=>a.displayN-b.displayN)
    .map(r=>r.id)
    .join("");

  const h=hashCode(order+"#"+code);

  return "3AWAEM-"+String(10+(h%90));
}

function ripperPlayer(){
  const saved=localStorage.getItem("ripperPlayer");

  if(saved){
    try{
      const p=JSON.parse(saved);
      const roles=getRipperRoles(p.sessionCode);
      const r=roles.find(x=>x.id===p.roleId);

      if(r){
        renderRipperPlayer(p.name,r);
        show("ripper-player");
        return;
      }
    }catch(e){}
  }

  show("ripper-setup");
}

function buildRipperRoles(){
  const box=document.getElementById("ripperRoles");
  box.textContent="";

  for(let n=1;n<=ripperRoles.length;n++){
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
      ripperSelected=n;

      document.querySelectorAll("#ripperRoles .role-btn")
        .forEach(x=>x.classList.toggle(
          "selected",
          Number(x.dataset.role)===n
        ));
    });

    box.appendChild(b);
  }
}

function checkRipperCode(){
  const value=document.getElementById("sessionCode").value.trim();
  const msg=document.getElementById("codeMessage");

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
  msg.textContent=`كلمة التحقق: ${verifyRipperCode(value)}`;
}

async function confirmRipperRole(){
  const name=document.getElementById("ripperName").value.trim();
  const code=document.getElementById("sessionCode").value.trim();

  if(!name){
    toast("اكتب اسمك الأول.");
    return;
  }

  if(!/^\d{4}$/.test(code)){
    toast("اكتب كود الجلسة المكون من 4 أرقام.");
    return;
  }

  if(!ripperSelected){
    toast("اختر رقم الشخصية.");
    return;
  }

  if(getLiveDbUrl()){
    const active=await isSessionActive("ripper",code);
    if(!active){
      toast("كود الجلسة ده لسه مش موجود. تأكد إن الـGM بدأ اللعبة بنفس الكود.");
      return;
    }
  }

  const roles=getRipperRoles(code);
  const r=roles.find(x=>x.displayN===ripperSelected);

  if(!r){
    toast("حصل خطأ في توزيع الشخصية.");
    return;
  }

  localStorage.setItem(
    "ripperPlayer",
    JSON.stringify({
      name,
      roleId:r.id,
      sessionCode:code
    })
  );

  renderRipperPlayer(name,r);
  pushPlayerStatus("ripper",code,r.displayN,name);
  show("ripper-player");
}

function renderRipperPlayer(name,r){
  document.getElementById("ripperPlayerBadge").textContent=
    `اللاعب: ${name} • الشخصية رقم ${r.displayN}`;

  document.getElementById("ripperRoleName").textContent=r.name;
  document.getElementById("ripperPublic").textContent=
    `المعلومات العلنية: ${r.public}`;

  document.getElementById("ripperSecret").textContent=r.secret;
  document.getElementById("ripperStrength").textContent=r.strength;
  document.getElementById("ripperWeakness").textContent=r.weakness;

  const mafia=r.killer||r.accomplice;

  document.getElementById("ripperMafia")
    .classList.toggle("hidden",!mafia);

  document.getElementById("ripperNotes").value=
    localStorage.getItem(`ripperNotes_${r.id}`)||"";

  if(mafia)playRevealSound();

  startLiveStatusPolling("ripper");
}

function saveRipperNotes(){
  const p=JSON.parse(
    localStorage.getItem("ripperPlayer")||"null"
  );

  if(!p)return;

  localStorage.setItem(
    `ripperNotes_${p.roleId}`,
    document.getElementById("ripperNotes").value
  );

  const s=document.getElementById("ripperSave");
  s.textContent="تم الحفظ تلقائيًا ✓";

  setTimeout(()=>s.textContent="",1200);
}

function resetRipper(){
  const p=JSON.parse(
    localStorage.getItem("ripperPlayer")||"null"
  );

  if(p){
    localStorage.removeItem(`ripperNotes_${p.roleId}`);
  }

  localStorage.removeItem("ripperPlayer");

  ripperSelected=null;

  document.getElementById("ripperName").value="";
  document.getElementById("sessionCode").value="";
  document.getElementById("codeMessage").textContent="";

  document.querySelectorAll("#ripperRoles .role-btn")
    .forEach(x=>x.classList.remove("selected"));

  show("ripper-setup");
}

function verifyRipperGM(){
  const value=document.getElementById("ripperGmInput").value.trim();

  if(value==="هشام"){
    document.getElementById("ripperGmError").classList.add("hidden");
    document.getElementById("ripperGmInput").value="";
    buildRipperGM();
    show("ripper-gm");
  }else{
    document.getElementById("ripperGmError").classList.remove("hidden");
  }
}

function generateRipperCode(){
  ripperGmCode=makeSessionCode();

  localStorage.setItem(
    "ripperGmCode",
    ripperGmCode
  );

  activateSession("ripper",ripperGmCode);

  buildRipperGM();

  toast("تم إنشاء توزيع عشوائي جديد.");
}

async function buildRipperGM(){
  document.getElementById("currentRipperCode").textContent=
    ripperGmCode||"غير محدد";

  document.getElementById("verifyCode").textContent=
    ripperGmCode
      ? verifyRipperCode(ripperGmCode)
      : "---";

  const roles=getRipperRoles(ripperGmCode);
  const roleBox=document.getElementById("ripperGMroles");
  roleBox.textContent="";

  let ripperPlayers=null;
  if(getLiveDbUrl()&&ripperGmCode){
    ripperPlayers=await fetchPlayers("ripper",ripperGmCode);
  }

  roles.forEach(r=>{
    const div=document.createElement("div");
    const pdata=ripperPlayers&&ripperPlayers[r.displayN];
    const taken=pdata&&pdata.name;
    const isOut=taken&&pdata.alive===false;
    div.className=isOut?"round out":(taken?"round taken":"round");

    let status="بريء من جرائم Whitechapel";

    if(r.killer){
      status="الفاعل المباشر — Jack the Ripper";
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

    if(ripperPlayers&&ripperPlayers[r.displayN]&&ripperPlayers[r.displayN].name){
      const playerLine=document.createElement("div");
      playerLine.style.marginTop="8px";
      playerLine.style.color="var(--gold3)";
      playerLine.style.fontWeight="700";
      playerLine.textContent=`اللاعب: ${ripperPlayers[r.displayN].name}`;
      div.appendChild(playerLine);
    }else if(getLiveDbUrl()&&ripperGmCode){
      const playerLine=document.createElement("div");
      playerLine.style.marginTop="8px";
      playerLine.style.color="var(--muted)";
      playerLine.style.fontSize="13px";
      playerLine.textContent="لسه محدش اختار الشخصية دي";
      div.appendChild(playerLine);
    }

    if(getLiveDbUrl()&&ripperGmCode){
      const btnOut=document.createElement("button");
      btnOut.className="btn ghost";
      btnOut.style.marginTop="12px";
      btnOut.style.marginLeft="8px";
      btnOut.textContent="أخرجه من اللعبة";
      btnOut.onclick=async()=>{playClickSound();await setPlayerAlive("ripper",ripperGmCode,r.displayN,false);toast(`${r.name} خرج من اللعبة`);buildRipperGM();};

      const btnIn=document.createElement("button");
      btnIn.className="btn ghost";
      btnIn.style.marginTop="12px";
      btnIn.textContent="رجّعه للعبة";
      btnIn.onclick=async()=>{playClickSound();await setPlayerAlive("ripper",ripperGmCode,r.displayN,true);toast(`${r.name} رجع للعبة`);buildRipperGM();};

      div.append(document.createElement("br"),btnOut,btnIn);
    }

    roleBox.appendChild(div);
  });

  const roundsBox=document.getElementById("ripperRounds");
  roundsBox.textContent="";

  ripperRounds.forEach(round=>{
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

  const nav=document.getElementById("ripperRoundNav");
  nav.textContent="";

  ripperRounds.forEach((round,i)=>{
    const b=document.createElement("button");
    b.className="round-chip";
    b.id=`ripperChip${i+1}`;
    b.type="button";
    b.textContent=`الجولة ${i+1}`;

    b.addEventListener("click",()=>{
      setCurrentRoundGeneric("ripper",i+1);
    });

    nav.appendChild(b);
  });

  const savedRound=Number(
    localStorage.getItem("ripperCurrentRound")||0
  );

  if(savedRound){
    const chip=document.getElementById(`ripperChip${savedRound}`);
    if(chip)chip.classList.add("active");
  }

  buildVoteTally("ripper");
}


