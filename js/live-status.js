/* =========================================================
   LIVE STATUS (optional Firebase Realtime Database, REST only)
========================================================= */

/* ضع رابط قاعدة بيانات Firebase بتاعتك هنا مرة واحدة، بعدين احفظ
   وارفع الملف. بالطريقة دي كل الأجهزة (بتاعتك وبتاعة اللاعبين)
   هتستخدم نفس القاعدة تلقائيًا من غير ما حد يحتاج يدخلها بنفسه.

   ⚠️ تنبيه مهم: أي حد يفتح الملف ده من غير ما يحفظ رابط قاعدة بياناته
   الخاصة (زر "حفظ" فوق) هيستخدم نفس المشروع ده تلقائيًا. لو الملف
   اتوزّع على أكتر من مجموعة/فريق، كلهم هيقروا ويكتبوا على نفس القاعدة،
   وده معناه:
   - استهلاك أسرع لحد الاستخدام المجاني (Quota) بتاع الخطة المجانية
   - تداخل بيانات جلسات مجموعات مختلفة لو الأكواد اتصادفت
   لازم كل مجموعة تستخدم مشروع Firebase منفصل بتاعها. */
const DEFAULT_LIVE_DB_URL="https://gamev2-13144-default-rtdb.firebaseio.com";

/* أي جلسة (لعبة) ما حصلش فيها أي نشاط (لا الـGM فعّلها ولا لاعب أكّد
   شخصيته) لمدة أطول من المدة دي، بتتمسح تلقائيًا من قاعدة البيانات
   عشان الداتا ما تتراكمش وتستهلك مساحة/حد استخدام من غير داعي. */
const SESSION_MAX_AGE_MS=7*24*60*60*1000; // 7 أيام

/* عشان مانعملش قراءة لكل الجلسات (تنضيف) في كل مرة، بنحدد أقل مدة
   بين كل عملية تنضيف والتانية على نفس الجهاز. */
const CLEANUP_THROTTLE_MS=60*60*1000; // ساعة

const LIVE_DB_INPUT_IDS=["liveDbUrlInput","liveDbUrlInputRipper"];
const LIVE_DB_STATUS_IDS=["liveDbStatus","liveDbStatusRipper"];

function getLiveDbUrl(){
  const stored=(localStorage.getItem("liveDbUrl")||"").trim().replace(/\/+$/,"");
  if(stored)return stored;
  return DEFAULT_LIVE_DB_URL.trim().replace(/\/+$/,"");
}

function saveLiveDbUrl(inputId){
  const id=inputId||"liveDbUrlInput";
  const el=document.getElementById(id);
  const value=el?el.value.trim().replace(/\/+$/,""):"";

  if(!value||!/^https:\/\/.+firebasedatabase\.app$|^https:\/\/.+firebaseio\.com$/.test(value)){
    toast("الرابط لازم يكون رابط Firebase Realtime Database صحيح.");
    return;
  }

  localStorage.setItem("liveDbUrl",value);

  LIVE_DB_INPUT_IDS.forEach(otherId=>{
    const other=document.getElementById(otherId);
    if(other)other.value=value;
  });

  if(ripperGmCode)activateSession("ripper",ripperGmCode);

  updateLiveDbStatusText();
  buildRipperGM();
  toast("تم تفعيل المتابعة المباشرة.");
}

function clearLiveDbUrl(){
  localStorage.removeItem("liveDbUrl");

  LIVE_DB_INPUT_IDS.forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.value="";
  });

  updateLiveDbStatusText();
  buildRipperGM();
  toast("تم إلغاء المتابعة المباشرة.");
}

function updateLiveDbStatusText(){
  const url=getLiveDbUrl();
  const text=url?`مفعّلة — متصلة بقاعدة البيانات.`:`غير مفعّلة حاليًا.`;

  LIVE_DB_STATUS_IDS.forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.textContent=text;
  });

  LIVE_DB_INPUT_IDS.forEach(id=>{
    const el=document.getElementById(id);
    if(el && !el.value)el.value=url;
  });
}

async function pushPlayerStatus(game,code,displayN,name){
  const url=getLiveDbUrl();
  if(!url||!code)return;

  try{
    await fetch(`${url}/sessions/${game}/${code}/players/${displayN}.json`,{
      method:"PUT",
      body:JSON.stringify({name,alive:true,ts:Date.now()})
    });
  }catch(e){}
}

async function setPlayerAlive(game,code,displayN,alive){
  const url=getLiveDbUrl();
  if(!url||!code)return;

  try{
    await fetch(`${url}/sessions/${game}/${code}/players/${displayN}.json`,{
      method:"PATCH",
      body:JSON.stringify({alive})
    });
  }catch(e){
    toast("تعذر تحديث الحالة، تأكد من الاتصال بالإنترنت.");
  }
}

async function fetchPlayers(game,code){
  const url=getLiveDbUrl();
  if(!url||!code)return null;

  try{
    const res=await fetch(`${url}/sessions/${game}/${code}/players.json`);
    if(!res.ok)return null;
    return await res.json();
  }catch(e){
    return null;
  }
}

async function activateSession(game,code){
  const url=getLiveDbUrl();
  if(!url||!code)return;

  try{
    // PATCH بيحدّث "active" و"updatedAt" بس، من غير ما يمسح باقي
    // بيانات الجلسة (اللاعبين، الجولات، التصويت) زي ما كان بيحصل
    // مع PUT على مسار /active.json لوحده.
    await fetch(`${url}/sessions/${game}/${code}.json`,{
      method:"PATCH",
      body:JSON.stringify({active:true,updatedAt:Date.now()})
    });
  }catch(e){}

  cleanupOldSessions(game);
}

/* بتمسح أي جلسة قديمة (من نفس اللعبة) عدّت عليها مدة SESSION_MAX_AGE_MS
   من غير نشاط. النشاط بيتحسب من "updatedAt" بتاعة الجلسة نفسها، أو
   آخر "ts" لأي لاعب فيها، أيهما أحدث. */
async function cleanupOldSessions(game){
  const url=getLiveDbUrl();
  if(!url)return;

  const throttleKey=`lastCleanup_${game}`;
  const last=Number(localStorage.getItem(throttleKey)||0);
  if(Date.now()-last<CLEANUP_THROTTLE_MS)return;
  localStorage.setItem(throttleKey,String(Date.now()));

  try{
    const res=await fetch(`${url}/sessions/${game}.json`);
    if(!res.ok)return;

    const all=await res.json();
    if(!all)return;

    const now=Date.now();
    const deletions=[];

    Object.keys(all).forEach(code=>{
      const s=all[code]||{};
      let lastActivity=Number(s.updatedAt)||0;

      if(s.players){
        Object.values(s.players).forEach(p=>{
          const ts=Number(p&&p.ts)||0;
          if(ts>lastActivity)lastActivity=ts;
        });
      }

      if(lastActivity&&(now-lastActivity)>SESSION_MAX_AGE_MS){
        deletions.push(
          fetch(`${url}/sessions/${game}/${code}.json`,{method:"DELETE"}).catch(()=>{})
        );
      }
    });

    if(deletions.length)await Promise.all(deletions);
  }catch(e){}
}

async function isSessionActive(game,code){
  const url=getLiveDbUrl();
  if(!url||!code)return null;

  try{
    const res=await fetch(`${url}/sessions/${game}/${code}/active.json`);
    if(!res.ok)return false;
    const data=await res.json();
    return data===true;
  }catch(e){
    return false;
  }
}

let liveStatusTimer=null;
let liveStatusGame=null;
let liveStatusCode=null;

function startLiveStatusPolling(game,code){
  liveStatusGame=game;
  liveStatusCode=code;

  clearInterval(liveStatusTimer);
  pollLiveStatusOnce();

  liveStatusTimer=setInterval(()=>{
    // من غير الشرط ده، البولينج كان بيفضل شغال حتى لو التاب في الخلفية
    // لساعات، وده بيستهلك من حد القراءة بتاع Firebase من غير أي فايدة
    // لحد ما المستخدم يرجع يشوف الشاشة.
    if(document.hidden)return;
    pollLiveStatusOnce();
  },5000);
}

// لما المستخدم يرجع للتاب بعد ما يكون سايبه في الخلفية، نعمل تحديث
// فوري بدل ما نستنى لحد الدورة الجاية (ممكن توصل لـ5 ثواني تأخير).
document.addEventListener("visibilitychange",()=>{
  if(!document.hidden&&liveStatusGame)pollLiveStatusOnce();
});

async function pollLiveStatusOnce(){
  if(!liveStatusGame)return;

  const game=liveStatusGame;
  const code=liveStatusCode||getSavedPlayerCode(game);

  // نجيب لستة اللاعبين مرة واحدة بس ونشاركها بين الدالتين، بدل ما
  // كل دالة تعمل طلب منفصل لنفس البيانات (كان بيضاعف عدد القراءات
  // من غير داعي في كل دورة بولينج).
  const players=code?await fetchPlayers(game,code):null;

  refreshLiveStatus(game,liveStatusCode,players);
  refreshVoteUI(game,liveStatusCode,players);
}

async function refreshLiveStatus(game,codeArg,playersArg){
  const listElId={ripper:"ripperStatusList"}[game];
  const listEl=document.getElementById(listElId);
  if(!listEl)return;

  const url=getLiveDbUrl();

  if(!url){
    listEl.textContent="الـGM لسه ما فعّلش المتابعة المباشرة لهذه الجولة.";
    return;
  }

  let code=codeArg;

  if(!code){
    code=getSavedPlayerCode(game);
  }

  if(!code){
    listEl.textContent="مفيش كود جلسة محفوظ على جهازك.";
    return;
  }

  // لو الداتا اتبعتت جاهزة (من pollLiveStatusOnce) بنستخدمها زي ما هي
  // من غير طلب إضافي لنفس البيانات.
  const data=playersArg!==undefined?playersArg:await fetchPlayers(game,code);

  if(!data){
    listEl.textContent="مفيش بيانات لسه، أول لاعب يأكد شخصيته هيظهر هنا.";
    return;
  }

  listEl.textContent="";
  const myN=getSavedPlayerDisplayN(game);
  const entries=Object.keys(data)
    .map(k=>({n:Number(k),...data[k]}))
    .sort((a,b)=>a.n-b.n);

  entries.forEach(p=>{
    const row=document.createElement("div");
    row.style.display="flex";
    row.style.justifyContent="space-between";
    row.style.padding="8px 0";
    row.style.borderBottom="1px solid var(--border)";

    const left=document.createElement("span");
    left.textContent=`${p.n}. ${p.name||"لاعب"}`+(p.n===myN?" (انت)":"");
    if(p.n===myN)left.style.fontWeight="700";

    const right=document.createElement("span");
    right.style.fontWeight="700";
    right.style.color=p.alive===false?"var(--red)":"#7fd9ae";
    right.textContent=p.alive===false?"خرج من اللعبة":"لسه في اللعبة";

    row.append(left,right);
    listEl.appendChild(row);
  });
}


