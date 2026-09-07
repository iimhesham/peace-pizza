/* =========================================================
   TRIVIA DUEL — مبارزة المعلومات
   منطق اللعبة الكامل (إعداد، توليد أسئلة، لوحة، سؤال، نهاية)
   يدعم مفاتيح Groq API و Gemini API تلقائياً
========================================================= */

const TRIVIA_API_KEY_STORAGE = "triviaGeminiApiKey";
const TRIVIA_QUESTION_TIME = 60; // ثانية لكل سؤال

let triviaState = {
  gameName: "",
  categoriesPool: [...TRIVIA_DEFAULT_CATEGORIES],
  selectedIds: [],
  players: [],
  categories: [],       // التصنيفات بعد ما اتولدت فيها الأسئلة
  currentPlayerIndex: 0,
  selectedQuestion: null, // {categoryId, questionIndex}
  timerHandle: null,
  timeLeft: TRIVIA_QUESTION_TIME,
  retryCount: 0
};

/* ---------- مفتاح API (Groq / Gemini) ---------- */

function getTriviaApiKey(){
  return (localStorage.getItem(TRIVIA_API_KEY_STORAGE) || "").trim();
}

function saveTriviaApiKey(){
  const input = document.getElementById("triviaApiKeyInput");
  const val = (input.value || "").trim();
  if(!val){
    toast("حط مفتاح API الأول");
    return;
  }
  localStorage.setItem(TRIVIA_API_KEY_STORAGE, val);
  toast("اتحفظ المفتاح بنجاح ✓");
  renderTriviaApiKeyStatus();
}

function renderTriviaApiKeyStatus(){
  const status = document.getElementById("triviaApiKeyStatus");
  const input = document.getElementById("triviaApiKeyInput");
  if(!status || !input) return;
  const key = getTriviaApiKey();
  if(key){
    if(key.startsWith("gsk_")){
      status.textContent = "✓ مفتاح Groq API محفوظ جاهز للعمل";
    } else {
      status.textContent = "✓ مفتاح Gemini API محفوظ جاهز للعمل";
    }
    status.style.color = "#7fd9ae";
    input.value = key;
  }else{
    status.textContent = "حط مفتاح Groq API (يبدأ بـ gsk_) أو Gemini API هنا";
    status.style.color = "#df8b7f";
  }
}

/* ---------- شاشة الإعداد ---------- */

function initTriviaSetup(){
  triviaState.gameName = "";
  triviaState.selectedIds = [];
  triviaState.players = [];
  triviaState.categories = [];
  triviaState.categoriesPool = [...TRIVIA_DEFAULT_CATEGORIES];

  document.getElementById("triviaGameName").value = "";
  document.getElementById("triviaPlayer1Name").value = "";
  document.getElementById("triviaPlayer2Name").value = "";
  document.getElementById("triviaCustomName").value = "";

  renderTriviaApiKeyStatus();
  renderTriviaRules();
  renderTriviaCategoryList();
}

function renderTriviaRules(){
  const box = document.getElementById("triviaRulesList");
  if(!box) return;
  box.innerHTML = TRIVIA_RULES.map(r => `
    <div class="round" style="display:flex;gap:12px;align-items:flex-start">
      <span style="font-size:22px">${r.icon}</span>
      <p class="small" style="margin:0">${r.text}</p>
    </div>
  `).join("");
}

function renderTriviaCategoryList(){
  const count = triviaState.selectedIds.length;
  const counter = document.getElementById("triviaCategoryCount");
  if(counter){
    counter.textContent = `${count}/6`;
    counter.style.color = count === 6 ? "#7fd9ae" : "var(--gold3)";
  }

  const footballBox = document.getElementById("triviaFootballCategories");
  const otherBox = document.getElementById("triviaOtherCategories");
  if(!footballBox || !otherBox) return;

  const renderGroup = (list) => list.map(cat => {
    const selected = triviaState.selectedIds.includes(cat.id);
    const disabled = !selected && count >= 6;
    return `
      <button type="button" class="role-btn${selected ? " selected" : ""}"
        style="padding:14px 8px${disabled ? ";opacity:.4;cursor:not-allowed" : ""}"
        ${disabled ? "disabled" : ""}
        onclick="toggleTriviaCategory('${cat.id}')">
        <strong style="font-size:14px">${cat.name}</strong>
      </button>`;
  }).join("");

  footballBox.innerHTML = renderGroup(triviaState.categoriesPool.filter(c => c.isFootball));
  otherBox.innerHTML = renderGroup(triviaState.categoriesPool.filter(c => !c.isFootball));
}

function toggleTriviaCategory(id){
  playClickSound();
  const i = triviaState.selectedIds.indexOf(id);
  if(i > -1){
    triviaState.selectedIds.splice(i, 1);
  }else if(triviaState.selectedIds.length < 6){
    triviaState.selectedIds.push(id);
  }
  renderTriviaCategoryList();
}

function addTriviaCustomCategory(){
  const nameInput = document.getElementById("triviaCustomName");
  const name = (nameInput.value || "").trim();
  if(!name){
    toast("اكتب اسم التصنيف الأول");
    return;
  }
  const type = document.querySelector('input[name="triviaCustomType"]:checked');
  const isFootball = !type || type.value === "football";
  const id = "custom-" + Date.now();
  triviaState.categoriesPool.push({id, name, isFootball, isCustom: true});
  nameInput.value = "";
  playClickSound();
  renderTriviaCategoryList();
}

function validateTriviaSetup(){
  const gameName = document.getElementById("triviaGameName").value.trim();
  const p1 = document.getElementById("triviaPlayer1Name").value.trim();
  const p2 = document.getElementById("triviaPlayer2Name").value.trim();

  if(!gameName){toast("اكتب اسم اللعبة"); return null;}
  if(!p1){toast("اكتب اسم اللاعب الأول"); return null;}
  if(!p2){toast("اكتب اسم اللاعب التاني"); return null;}
  if(triviaState.selectedIds.length !== 6){toast("اختار 6 تصنيفات بالظبط"); return null;}
  if(!getTriviaApiKey()){toast("حطوا مفتاح API الأول (Groq أو Gemini)"); return null;}

  return {gameName, p1, p2};
}

async function startTriviaGame(){
  const form = validateTriviaSetup();
  if(!form) return;

  playClickSound();
  triviaState.gameName = form.gameName;
  triviaState.players = [
    {id: "1", name: form.p1, score: 0},
    {id: "2", name: form.p2, score: 0}
  ];
  triviaState.currentPlayerIndex = 0;
  triviaState.retryCount = 0;

  const chosenCategories = triviaState.categoriesPool.filter(
    c => triviaState.selectedIds.includes(c.id)
  );

  show("trivia-loading");
  document.getElementById("triviaLoadingNote").textContent = "";

  try{
    triviaState.categories = await generateTriviaQuestions(chosenCategories);
    renderTriviaBoard();
    show("trivia-board");
  }catch(err){
    document.getElementById("triviaErrorMessage").textContent =
      (err && err.message) || "حصل خطأ غير متوقع.";
    show("trivia-error");
  }
}

/* ---------- توليد الأسئلة (Groq / Gemini API) ---------- */

function buildTriviaPrompt(categories){
  const names = categories.map(c => c.name).join("، ");
  return `أنت مساعد trivia لخلق أسئلة ألعاب ومسابقات باللغة العربية.
قم بتوليد 6 أسئلة لكل تصنيف من التصنيفات التالية: ${names}.

المطلوب بدقة:
- 6 تصنيفات × 6 أسئلة = 36 سؤال إجمالاً.
- لكل تصنيف بالتفصيل:
  * سؤالان بسهولة متدرجة بقيمة 200 نقطة.
  * سؤالان بقيمة 400 نقطة.
  * سؤالان بقيمة 600 نقطة.
- الإجابات تكون مباشرة وقصيرة جداً (كلمة أو كلمة وحيدة أو جملة من 2-3 كلمات).
- جميع الأسئلة والإجابات باللغة العربية.

يجب إرجاع النتيجة بصيغة JSON فقط بهذا الشكل الدقيق بدون أي كلام خارجي:
{
  "categories": [
    {
      "category": "اسم التصنيف بالضبط",
      "questions": [
        {"question": "السؤال الأول", "answer": "الإجابة", "points": 200},
        {"question": "السؤال الثاني", "answer": "الإجابة", "points": 200},
        {"question": "السؤال الثالث", "answer": "الإجابة", "points": 400},
        {"question": "السؤال الرابع", "answer": "الإجابة", "points": 400},
        {"question": "السؤال الخامس", "answer": "الإجابة", "points": 600},
        {"question": "السؤال السادس", "answer": "الإجابة", "points": 600}
      ]
    }
  ]
}`;
}

function parseTriviaResponse(text){
  const match = text.match(/\{[\s\S]*\}/);
  if(!match) throw new Error("رد غير صالح من الذكاء الاصطناعي");
  return JSON.parse(match[0]);
}

function mapTriviaCategories(parsed, originalCategories){
  return parsed.categories.map(genCat => {
    const original = originalCategories.find(c => c.name.trim() === genCat.category.trim());
    return {
      id: original ? original.id : "gen-" + genCat.category,
      name: genCat.category,
      isFootball: original ? original.isFootball : false,
      questions: genCat.questions.map((q, idx) => ({
        id: genCat.category + "-" + idx,
        question: q.question,
        answer: q.answer,
        points: q.points,
        answered: false
      }))
    };
  });
}

async function callTriviaApi(prompt){
  const key = getTriviaApiKey();
  if(!key) throw new Error("لم يتم إدخال مفتاح API.");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    if (key.startsWith("gsk_")) {
      // تجربة موديلات Groq المتاحة تلقائياً لتفادي خطأ 404
      const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
      let lastRes;

      for (const modelName of groqModels) {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: modelName,
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
          })
        });

        if (res.ok) {
          clearTimeout(timeoutId);
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (!text) throw new Error("رد فارغ من Groq API.");
          return text;
        }
        lastRes = res;
      }

      clearTimeout(timeoutId);
      let msg = `خطأ في اتصال Groq API (كود ${lastRes.status})`;
      if (lastRes.status === 401) msg = "مفتاح Groq API غير صحيح أو تم إلغاؤه.";
      if (lastRes.status === 429) msg = "تم تجاوز حد الطلبات في Groq API. جرب بعد قليل.";
      const err = new Error(msg);
      err.status = lastRes.status;
      throw err;

    } else {
      // تجربة موديلات Gemini المتاحة تلقائياً لتفادي خطأ 404
      const geminiModels = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"];
      let lastRes;

      for (const modelName of geminiModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
          })
        });

        if (res.ok) {
          clearTimeout(timeoutId);
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) throw new Error("رد فارغ من Gemini API.");
          return text;
        }
        lastRes = res;
      }

      clearTimeout(timeoutId);
      let msg = `خطأ في اتصال Gemini API (كود ${lastRes.status})`;
      if (lastRes.status === 400 || lastRes.status === 403) msg = "مفتاح Gemini API غير صحيح أو محظور.";
      if (lastRes.status === 429) msg = "تم تجاوز حد الطلبات لـ Gemini. حاول بعد قليل.";
      if (lastRes.status === 503) msg = "سيرفر Gemini مشغول حالياً (503).";
      const err = new Error(msg);
      err.status = lastRes.status;
      throw err;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("انتهت مهلة الطلب (Timeout). حاول مرة أخرى.");
    }
    throw err;
  }
}

function waitMs(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateTriviaQuestions(categories){
  const prompt = buildTriviaPrompt(categories);
  const maxAttempts = 3;
  let lastErr;

  for(let i = 0; i < maxAttempts; i++){
    try{
      const text = await callTriviaApi(prompt);
      const parsed = parseTriviaResponse(text);
      if(!parsed.categories || parsed.categories.length !== 6){
        throw new Error("رد غير مكتمل من الـ API (لازم 6 تصنيفات بالظبط).");
      }
      return mapTriviaCategories(parsed, categories);
    }catch(err){
      lastErr = err;
      const isRetryable = err.status === 503 || err.status === 429;
      const isLastAttempt = i === maxAttempts - 1;
      if(isLastAttempt) break;

      const note = document.getElementById("triviaLoadingNote");
      if(note){
        note.textContent = isRetryable
          ? "السيرفر مزنوق شوية، بنجرب تاني كمان لحظات... (محاولة " + (i + 2) + "/" + maxAttempts + ")"
          : "حصل خطأ، بنجرب تاني... (محاولة " + (i + 2) + "/" + maxAttempts + ")";
      }
      await waitMs(isRetryable ? 6000 : 2000);
    }
  }
  throw lastErr;
}

function retryTriviaGeneration(){
  playClickSound();
  if(triviaState.categories.length === 0){
    show("trivia");
    initTriviaSetup();
    return;
  }
  show("trivia-loading");
  document.getElementById("triviaLoadingNote").textContent = "";

  const originalCategories = triviaState.categories.map(c => ({
    id: c.id, name: c.name, isFootball: c.isFootball
  }));

  generateTriviaQuestions(originalCategories)
    .then(cats => {
      triviaState.categories = cats;
      renderTriviaBoard();
      show("trivia-board");
    })
    .catch(err => {
      document.getElementById("triviaErrorMessage").textContent =
        (err && err.message) || "حصل خطأ غير متوقع.";
      show("trivia-error");
    });
}

/* ---------- لوحة اللعبة (الجدول) ---------- */

function renderTriviaBoard(){
  document.getElementById("triviaBoardTitle").textContent =
    triviaState.gameName || "مبارزة المعلومات";

  renderTriviaScoreboard();

  const headRow = document.getElementById("triviaBoardHead");
  const body = document.getElementById("triviaBoardBody");

  headRow.innerHTML = triviaState.categories.map(cat =>
    `<div class="tv-head-cell">${cat.name}</div>`
  ).join("");

  let rowsHtml = "";
  for(let row = 0; row < 6; row++){
    rowsHtml += `<div class="tv-row">`;
    triviaState.categories.forEach(cat => {
      const q = cat.questions[row];
      if(!q){
        rowsHtml += `<div class="tv-cell empty">-</div>`;
        return;
      }
      const done = q.answered;
      rowsHtml += `
        <button type="button" class="tv-cell${done ? " done" : ""}"
          ${done ? "disabled" : ""}
          onclick="selectTriviaQuestion('${cat.id}',${row})">
          ${done ? "" : `<span class="tv-cell-points">${q.points}</span>`}
        </button>`;
    });
    rowsHtml += "</div>";
  }
  body.innerHTML = rowsHtml;

  document.getElementById("triviaTurnLabel").innerHTML =
    `الدور على: <b>${triviaState.players[triviaState.currentPlayerIndex].name}</b>`;
}

function renderTriviaScoreboard(){
  const box = document.getElementById("triviaScoreboard");
  box.innerHTML = triviaState.players.map((p, i) => `
    <div class="tv-player-chip${i === triviaState.currentPlayerIndex ? " active" : ""}">
      <span class="tv-player-name">${p.name}</span>
      <span class="tv-player-score">${p.score} نقطة</span>
    </div>
  `).join("");
}

/* ---------- شاشة السؤال ---------- */

function selectTriviaQuestion(categoryId, questionIndex){
  const cat = triviaState.categories.find(c => c.id === categoryId);
  const q = cat.questions[questionIndex];
  if(!q || q.answered) return;

  playClickSound();
  triviaState.selectedQuestion = {categoryId, questionIndex};
  renderTriviaQuestionScreen();
  show("trivia-question");
}

function renderTriviaQuestionScreen(){
  const {categoryId, questionIndex} = triviaState.selectedQuestion;
  const cat = triviaState.categories.find(c => c.id === categoryId);
  const q = cat.questions[questionIndex];
  const current = triviaState.players[triviaState.currentPlayerIndex];

  document.getElementById("triviaQCategory").textContent = cat.name;
  document.getElementById("triviaQTurn").innerHTML = `الدور: <b>${current.name}</b>`;
  document.getElementById("triviaQPoints").textContent = `${q.points} نقطة`;
  document.getElementById("triviaQText").textContent = q.question;
  document.getElementById("triviaQAnswerBox").classList.add("hidden");
  document.getElementById("triviaQShowBtn").classList.remove("hidden");
  document.getElementById("triviaQAnswerText").textContent = q.answer;

  const playersBox = document.getElementById("triviaQPlayers");
  playersBox.innerHTML = triviaState.players.map(p => `
    <button type="button" class="vote-target-btn" style="width:100%;text-align:right;padding:14px"
      onclick="awardTriviaPoints('${p.id}')">
      ${p.name} <span class="small">(+${q.points})</span>
    </button>
  `).join("") + `
    <button type="button" class="vote-target-btn" style="width:100%;text-align:right;padding:14px;color:var(--red)"
      onclick="awardTriviaPoints(null)">محدش جاوب</button>
  `;

  startTriviaTimer();
}

function startTriviaTimer(){
  stopTriviaTimer();
  triviaState.timeLeft = TRIVIA_QUESTION_TIME;
  updateTriviaTimerDisplay();

  triviaState.timerHandle = setInterval(() => {
    triviaState.timeLeft--;
    updateTriviaTimerDisplay();
    if(triviaState.timeLeft <= 0){
      stopTriviaTimer();
      revealTriviaAnswer(true);
    }
  }, 1000);
}

function stopTriviaTimer(){
  if(triviaState.timerHandle){
    clearInterval(triviaState.timerHandle);
    triviaState.timerHandle = null;
  }
}

function updateTriviaTimerDisplay(){
  const el = document.getElementById("triviaTimer");
  el.textContent = triviaState.timeLeft;
  el.classList.toggle("warn", triviaState.timeLeft <= 10);
}

function revealTriviaAnswer(timeExpired){
  stopTriviaTimer();
  document.getElementById("triviaQShowBtn").classList.add("hidden");
  document.getElementById("triviaQAnswerBox").classList.remove("hidden");
  document.getElementById("triviaTimeUpNote").classList.toggle("hidden", !timeExpired);
  playRevealSound();
}

function awardTriviaPoints(playerId){
  playClickSound();
  const {categoryId, questionIndex} = triviaState.selectedQuestion;
  const cat = triviaState.categories.find(c => c.id === categoryId);
  const q = cat.questions[questionIndex];
  q.answered = true;

  if(playerId){
    const player = triviaState.players.find(p => p.id === playerId);
    player.score += q.points;
  }

  triviaState.currentPlayerIndex =
    (triviaState.currentPlayerIndex + 1) % triviaState.players.length;
  triviaState.selectedQuestion = null;

  const allAnswered = triviaState.categories.every(c =>
    c.questions.every(q => q.answered)
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
  if(triviaState.selectedQuestion){
    awardTriviaPoints(null);
  }else{
    show("trivia-board");
  }
}

/* ---------- شاشة النهاية ---------- */

function renderTriviaEndScreen(){
  const sorted = [...triviaState.players].sort((a, b) => b.score - a.score);
  const [first, second] = sorted;
  const isTie = first.score === second.score;

  const announce = document.getElementById("triviaWinnerAnnounce");
  if(isTie){
    announce.innerHTML = `<p style="font-size:32px;color:var(--gold3);margin:0">🤝 تعادل!</p>
      <p class="small">اللاعبين اتساووا في النقط</p>`;
  }else{
    announce.innerHTML = `<p class="small" style="margin:0">الفايز</p>
      <p style="font-size:30px;color:var(--gold3);margin:6px 0">🏆 ${first.name}</p>
      <p style="font-size:20px;margin:0">${first.score} نقطة</p>`;
  }

  const list = document.getElementById("triviaFinalScores");
  list.innerHTML = sorted.map((p, i) => `
    <div class="round${i === 0 && !isTie ? " taken" : ""}" style="display:flex;justify-content:space-between;align-items:center">
      <span>${i === 0 && !isTie ? "🥇" : "🥈"} ${p.name}</span>
      <b style="color:var(--gold3);font-size:20px">${p.score}</b>
    </div>
  `).join("");
}

function playTriviaAgain(){
  playClickSound();
  show("trivia");
  initTriviaSetup();
}
