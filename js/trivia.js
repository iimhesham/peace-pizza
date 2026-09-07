/* =========================================================
   TRIVIA DUEL — مبارزة المعلومات
   منطق اللعبة الكامل (إعداد، توليد أسئلة، لوحة، سؤال، نهاية)
========================================================= */

const TRIVIA_API_KEY_STORAGE="triviaGeminiApiKey";
const TRIVIA_API_URL="https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
const TRIVIA_QUESTION_TIME=60; // ثانية لكل سؤال

let triviaState={
  gameName:"",
  categoriesPool:[...TRIVIA_DEFAULT_CATEGORIES],
  selectedIds:[],
  players:[],
  categories:[],       // التصنيفات بعد ما اتولدت فيها الأسئلة
  currentPlayerIndex:0,
  selectedQuestion:null, // {categoryId, questionIndex}
  timerHandle:null,
  timeLeft:TRIVIA_QUESTION_TIME,
  retryCount:0
};

/* ---------- مفتاح Gemini API ---------- */

function getTriviaApiKey(){
  return (localStorage.getItem(TRIVIA_API_KEY_STORAGE)||"").trim();
}

function saveTriviaApiKey(){
  const input=document.getElementById("triviaApiKeyInput");
  const val=(input.value||"").trim();
  if(!val){
    toast("حط مفتاح API الأول");
    return;
  }
  localStorage.setItem(TRIVIA_API_KEY_STORAGE,val);
  toast("اتحفظ المفتاح ✓");
  renderTriviaApiKeyStatus();
}

function renderTriviaApiKeyStatus(){
  const status=document.getElementById("triviaApiKeyStatus");
  const input=document.getElementById("triviaApiKeyInput");
  if(!status||!input) return;
  const key=getTriviaApiKey();
  if(key){
    status.textContent="✓ فيه مفتاح محفوظ على الجهاز ده";
    status.style.color="#7fd9ae";
    input.value=key;
  }else{
    status.textContent="لسه محتاجين تحطوا مفتاح Gemini API";
    status.style.color="#df8b7f";
  }
}

/* ---------- شاشة الإعداد ---------- */

function initTriviaSetup(){
  triviaState.gameName="";
  triviaState.selectedIds=[];
  triviaState.players=[];
  triviaState.categories=[];
  triviaState.categoriesPool=[...TRIVIA_DEFAULT_CATEGORIES];

  document.getElementById("triviaGameName").value="";
  document.getElementById("triviaPlayer1Name").value="";
  document.getElementById("triviaPlayer2Name").value="";
  document.getElementById("triviaCustomName").value="";

  renderTriviaApiKeyStatus();
  renderTriviaRules();
  renderTriviaCategoryList();
}

function renderTriviaRules(){
  const box=document.getElementById("triviaRulesList");
  if(!box) return;
  box.innerHTML=TRIVIA_RULES.map(r=>`
    <div class="round" style="display:flex;gap:12px;align-items:flex-start">
      <span style="font-size:22px">${r.icon}</span>
      <p class="small" style="margin:0">${r.text}</p>
    </div>
  `).join("");
}

function renderTriviaCategoryList(){
  const count=triviaState.selectedIds.length;
  const counter=document.getElementById("triviaCategoryCount");
  if(counter){
    counter.textContent=`${count}/6`;
    counter.style.color=count===6?"#7fd9ae":"var(--gold3)";
  }

  const footballBox=document.getElementById("triviaFootballCategories");
  const otherBox=document.getElementById("triviaOtherCategories");
  if(!footballBox||!otherBox) return;

  const renderGroup=(list)=>list.map(cat=>{
    const selected=triviaState.selectedIds.includes(cat.id);
    const disabled=!selected&&count>=6;
    return `
      <button type="button" class="role-btn${selected?" selected":""}"
        style="padding:14px 8px${disabled?";opacity:.4;cursor:not-allowed":""}"
        ${disabled?"disabled":""}
        onclick="toggleTriviaCategory('${cat.id}')">
        <strong style="font-size:14px">${cat.name}</strong>
      </button>`;
  }).join("");

  footballBox.innerHTML=renderGroup(triviaState.categoriesPool.filter(c=>c.isFootball));
  otherBox.innerHTML=renderGroup(triviaState.categoriesPool.filter(c=>!c.isFootball));
}

function toggleTriviaCategory(id){
  playClickSound();
  const i=triviaState.selectedIds.indexOf(id);
  if(i>-1){
    triviaState.selectedIds.splice(i,1);
  }else if(triviaState.selectedIds.length<6){
    triviaState.selectedIds.push(id);
  }
  renderTriviaCategoryList();
}

function addTriviaCustomCategory(){
  const nameInput=document.getElementById("triviaCustomName");
  const name=(nameInput.value||"").trim();
  if(!name){
    toast("اكتب اسم التصنيف الأول");
    return;
  }
  const type=document.querySelector('input[name="triviaCustomType"]:checked');
  const isFootball=!type||type.value==="football";
  const id="custom-"+Date.now();
  triviaState.categoriesPool.push({id,name,isFootball,isCustom:true});
  nameInput.value="";
  playClickSound();
  renderTriviaCategoryList();
}

function validateTriviaSetup(){
  const gameName=document.getElementById("triviaGameName").value.trim();
  const p1=document.getElementById("triviaPlayer1Name").value.trim();
  const p2=document.getElementById("triviaPlayer2Name").value.trim();

  if(!gameName){toast("اكتب اسم اللعبة");return null;}
  if(!p1){toast("اكتب اسم اللاعب الأول");return null;}
  if(!p2){toast("اكتب اسم اللاعب التاني");return null;}
  if(triviaState.selectedIds.length!==6){toast("اختار 6 تصنيفات بالظبط");return null;}
  if(!getTriviaApiKey()){toast("حطوا مفتاح Gemini API الأول");return null;}

  return {gameName,p1,p2};
}

async function startTriviaGame(){
  const form=validateTriviaSetup();
  if(!form) return;

  playClickSound();
  triviaState.gameName=form.gameName;
  triviaState.players=[
    {id:"1",name:form.p1,score:0},
    {id:"2",name:form.p2,score:0}
  ];
  triviaState.currentPlayerIndex=0;
  triviaState.retryCount=0;

  const chosenCategories=triviaState.categoriesPool.filter(
    c=>triviaState.selectedIds.includes(c.id)
  );

  show("trivia-loading");
  document.getElementById("triviaLoadingNote").textContent="";

  try{
    triviaState.categories=await generateTriviaQuestions(chosenCategories);
    renderTriviaBoard();
    show("trivia-board");
  }catch(err){
    document.getElementById("triviaErrorMessage").textContent=
      (err&&err.message)||"حصل خطأ غير متوقع.";
    show("trivia-error");
  }
}

/* ---------- توليد الأسئلة (Gemini API) ---------- */

function buildTriviaPrompt(categories){
  const names=categories.map(c=>c.name).join("، ");
  return `أنت مساعد trivia. قم بتوليد 6 أسئلة لكل تصنيف من التصنيفات التالية: ${names}.

المطلوب:
- 6 تصنيفات × 6 أسئلة = 36 سؤال total
- لكل تصنيف: سؤالان (200 نقطة)، سؤالان (400 نقطة)، سؤالان (600 نقطة)
- الإجابات تكون concise (جملة قصيرة أو كلمة)
- جميع الأسئلة والإجابات بالعربية فقط
- تنوع في صعوبة الأسئلة داخل كل تصنيف

أرجع النتيجة بتنسيق JSON فقط هكذا بدون أي نص إضافي:
{
  "categories": [
    {
      "category": "اسم التصنيف",
      "questions": [
        {"question": "السؤال", "answer": "الإجابة", "points": 200},
        {"question": "السؤال", "answer": "الإجابة", "points": 200},
        {"question": "السؤال", "answer": "الإجابة", "points": 400},
        {"question": "السؤال", "answer": "الإجابة", "points": 400},
        {"question": "السؤال", "answer": "الإجابة", "points": 600},
        {"question": "السؤال", "answer": "الإجابة", "points": 600}
      ]
    }
  ]
}`;
}

function parseTriviaResponse(text){
  const match=text.match(/\{[\s\S]*\}/);
  if(!match) throw new Error("رد غير صالح من الذكاء الاصطناعي");
  return JSON.parse(match[0]);
}

function mapTriviaCategories(parsed,originalCategories){
  return parsed.categories.map(genCat=>{
    const original=originalCategories.find(c=>c.name===genCat.category);
    return {
      id:original?original.id:"gen-"+genCat.category,
      name:genCat.category,
      isFootball:original?original.isFootball:false,
      questions:genCat.questions.map((q,idx)=>({
        id:genCat.category+"-"+idx,
        question:q.question,
        answer:q.answer,
        points:q.points,
        answered:false
      }))
    };
  });
}

async function callTriviaGemini(prompt){
  const key=getTriviaApiKey();
  const controller=new AbortController();
  const timeoutId=setTimeout(()=>controller.abort(),120000);

  try{
    const res=await fetch(TRIVIA_API_URL,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-goog-api-key":key
      },
      signal:controller.signal,
      body:JSON.stringify({
        contents:[{parts:[{text:prompt}]}],
        generationConfig:{temperature:.7,maxOutputTokens:8000}
      })
    });

    clearTimeout(timeoutId);

    if(!res.ok){
      let msg;
      if(res.status===429){
        msg="تم تجاوز الحد المسموح من الطلبات. استنوا شوية وجربوا تاني.";
      }else if(res.status===400||res.status===403){
        msg="مفتاح Gemini API غلط أو مش شغال. راجعوه.";
      }else if(res.status===503){
        msg="السيرفر مزنوق حاليًا (503). بنعيد المحاولة تلقائي...";
      }else{
        msg="خطأ في الاتصال بالـ API (كود "+res.status+").";
      }
      const err=new Error(msg);
      err.status=res.status;
      throw err;
    }

    const data=await res.json();
    const text=data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if(!text) throw new Error("رد فاضي من الـ API.");

    return text;
  }catch(err){
    clearTimeout(timeoutId);
    if(err.name==="AbortError"){
      throw new Error("انتهت مهلة الطلب. جربوا تاني.");
    }
    throw err;
  }
}

function waitMs(ms){
  return new Promise(resolve=>setTimeout(resolve,ms));
}

async function generateTriviaQuestions(categories){
  const prompt=buildTriviaPrompt(categories);
  const maxAttempts=3;
  let lastErr;

  for(let i=0;i<maxAttempts;i++){
    try{
      const text=await callTriviaGemini(prompt);
      const parsed=parseTriviaResponse(text);
      if(!parsed.categories||parsed.categories.length!==6){
        throw new Error("رد غير مكتمل من الـ API (لازم 6 تصنيفات بالظبط).");
      }
      return mapTriviaCategories(parsed,categories);
    }catch(err){
      lastErr=err;
      const isRetryable=err.status===503||err.status===429;
      const isLastAttempt=i===maxAttempts-1;
      if(isLastAttempt) break;

      const note=document.getElementById("triviaLoadingNote");
      if(note){
        note.textContent=isRetryable
          ? "السيرفر مزنوق شوية، بنجرب تاني كمان لحظات... (محاولة "+(i+2)+"/"+maxAttempts+")"
          : "حصل خطأ، بنجرب تاني... (محاولة "+(i+2)+"/"+maxAttempts+")";
      }
      await waitMs(isRetryable?6000:2000);
    }
  }
  throw lastErr;
}

function retryTriviaGeneration(){
  playClickSound();
  if(triviaState.categories.length===0){
    show("trivia");
    initTriviaSetup();
    return;
  }
  show("trivia-loading");
  document.getElementById("triviaLoadingNote").textContent="";

  const originalCategories=triviaState.categories.map(c=>({
    id:c.id,name:c.name,isFootball:c.isFootball
  }));

  generateTriviaQuestions(originalCategories)
    .then(cats=>{
      triviaState.categories=cats;
      renderTriviaBoard();
      show("trivia-board");
    })
    .catch(err=>{
      document.getElementById("triviaErrorMessage").textContent=
        (err&&err.message)||"حصل خطأ غير متوقع.";
      show("trivia-error");
    });
}

/* ---------- لوحة اللعبة (الجدول) ---------- */

function renderTriviaBoard(){
  document.getElementById("triviaBoardTitle").textContent=
    triviaState.gameName||"مبارزة المعلومات";

  renderTriviaScoreboard();

  const headRow=document.getElementById("triviaBoardHead");
  const body=document.getElementById("triviaBoardBody");

  headRow.innerHTML=triviaState.categories.map(cat=>
    `<div class="tv-head-cell">${cat.name}</div>`
  ).join("");

  let rowsHtml="";
  for(let row=0;row<6;row++){
    rowsHtml+=`<div class="tv-row">`;
    triviaState.categories.forEach(cat=>{
      const q=cat.questions[row];
      if(!q){
        rowsHtml+=`<div class="tv-cell empty">-</div>`;
        return;
      }
      const done=q.answered;
      rowsHtml+=`
        <button type="button" class="tv-cell${done?" done":""}"
          ${done?"disabled":""}
          onclick="selectTriviaQuestion('${cat.id}',${row})">
          ${done?"":`<span class="tv-cell-points">${q.points}</span>`}
        </button>`;
    });
    rowsHtml+="</div>";
  }
  body.innerHTML=rowsHtml;

  document.getElementById("triviaTurnLabel").innerHTML=
    `الدور على: <b>${triviaState.players[triviaState.currentPlayerIndex].name}</b>`;
}

function renderTriviaScoreboard(){
  const box=document.getElementById("triviaScoreboard");
  box.innerHTML=triviaState.players.map((p,i)=>`
    <div class="tv-player-chip${i===triviaState.currentPlayerIndex?" active":""}">
      <span class="tv-player-name">${p.name}</span>
      <span class="tv-player-score">${p.score} نقطة</span>
    </div>
  `).join("");
}

/* ---------- شاشة السؤال ---------- */

function selectTriviaQuestion(categoryId,questionIndex){
  const cat=triviaState.categories.find(c=>c.id===categoryId);
  const q=cat.questions[questionIndex];
  if(!q||q.answered) return;

  playClickSound();
  triviaState.selectedQuestion={categoryId,questionIndex};
  renderTriviaQuestionScreen();
  show("trivia-question");
}

function renderTriviaQuestionScreen(){
  const {categoryId,questionIndex}=triviaState.selectedQuestion;
  const cat=triviaState.categories.find(c=>c.id===categoryId);
  const q=cat.questions[questionIndex];
  const current=triviaState.players[triviaState.currentPlayerIndex];

  document.getElementById("triviaQCategory").textContent=cat.name;
  document.getElementById("triviaQTurn").innerHTML=`الدور: <b>${current.name}</b>`;
  document.getElementById("triviaQPoints").textContent=`${q.points} نقطة`;
  document.getElementById("triviaQText").textContent=q.question;
  document.getElementById("triviaQAnswerBox").classList.add("hidden");
  document.getElementById("triviaQShowBtn").classList.remove("hidden");
  document.getElementById("triviaQAnswerText").textContent=q.answer;

  const playersBox=document.getElementById("triviaQPlayers");
  playersBox.innerHTML=triviaState.players.map(p=>`
    <button type="button" class="vote-target-btn" style="width:100%;text-align:right;padding:14px"
      onclick="awardTriviaPoints('${p.id}')">
      ${p.name} <span class="small">(+${q.points})</span>
    </button>
  `).join("")+`
    <button type="button" class="vote-target-btn" style="width:100%;text-align:right;padding:14px;color:var(--red)"
      onclick="awardTriviaPoints(null)">محدش جاوب</button>
  `;

  startTriviaTimer();
}

function startTriviaTimer(){
  stopTriviaTimer();
  triviaState.timeLeft=TRIVIA_QUESTION_TIME;
  updateTriviaTimerDisplay();

  triviaState.timerHandle=setInterval(()=>{
    triviaState.timeLeft--;
    updateTriviaTimerDisplay();
    if(triviaState.timeLeft<=0){
      stopTriviaTimer();
      revealTriviaAnswer(true);
    }
  },1000);
}

function stopTriviaTimer(){
  if(triviaState.timerHandle){
    clearInterval(triviaState.timerHandle);
    triviaState.timerHandle=null;
  }
}

function updateTriviaTimerDisplay(){
  const el=document.getElementById("triviaTimer");
  el.textContent=triviaState.timeLeft;
  el.classList.toggle("warn",triviaState.timeLeft<=10);
}

function revealTriviaAnswer(timeExpired){
  stopTriviaTimer();
  document.getElementById("triviaQShowBtn").classList.add("hidden");
  document.getElementById("triviaQAnswerBox").classList.remove("hidden");
  document.getElementById("triviaTimeUpNote").classList.toggle("hidden",!timeExpired);
  playRevealSound();
}

function awardTriviaPoints(playerId){
  playClickSound();
  const {categoryId,questionIndex}=triviaState.selectedQuestion;
  const cat=triviaState.categories.find(c=>c.id===categoryId);
  const q=cat.questions[questionIndex];
  q.answered=true;

  if(playerId){
    const player=triviaState.players.find(p=>p.id===playerId);
    player.score+=q.points;
  }

  triviaState.currentPlayerIndex=
    (triviaState.currentPlayerIndex+1)%triviaState.players.length;
  triviaState.selectedQuestion=null;

  const allAnswered=triviaState.categories.every(c=>
    c.questions.every(q=>q.answered)
  );

  if(allAnswered){
    renderTriviaEndScreen();
    show("trivia-end");
  }else{
    renderTriviaBoard();
    show("trivia-board");
  }
}

function backFromTriviaQuestion(){
  playClickSound();
  // السؤال بيتحسب "محدش جاوب" لو رجعنا من غير ما نحسم
  if(triviaState.selectedQuestion){
    awardTriviaPoints(null);
  }else{
    show("trivia-board");
  }
}

/* ---------- شاشة النهاية ---------- */

function renderTriviaEndScreen(){
  const sorted=[...triviaState.players].sort((a,b)=>b.score-a.score);
  const [first,second]=sorted;
  const isTie=first.score===second.score;

  const announce=document.getElementById("triviaWinnerAnnounce");
  if(isTie){
    announce.innerHTML=`<p style="font-size:32px;color:var(--gold3);margin:0">🤝 تعادل!</p>
      <p class="small">اللاعبين اتساووا في النقط</p>`;
  }else{
    announce.innerHTML=`<p class="small" style="margin:0">الفايز</p>
      <p style="font-size:30px;color:var(--gold3);margin:6px 0">🏆 ${first.name}</p>
      <p style="font-size:20px;margin:0">${first.score} نقطة</p>`;
  }

  const list=document.getElementById("triviaFinalScores");
  list.innerHTML=sorted.map((p,i)=>`
    <div class="round${i===0&&!isTie?" taken":""}" style="display:flex;justify-content:space-between;align-items:center">
      <span>${i===0&&!isTie?"🥇":"🥈"} ${p.name}</span>
      <b style="color:var(--gold3);font-size:20px">${p.score}</b>
    </div>
  `).join("");
}

function playTriviaAgain(){
  playClickSound();
  show("trivia");
  initTriviaSetup();
}
