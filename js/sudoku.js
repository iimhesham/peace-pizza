/* =========================================================
   SUDOKU (أوفلاين): الواجهة وربط المنطق.
   المنطق نفسه في js/sudoku-core.js. الأونلاين في js/online-sudoku.js.
   كل حاجة بتتحفظ في المتصفح بس (localStorage):
     sdSave  اللغز الشغال  ·  sdStats  الإحصائيات والإنجازات
     sdPrefs آخر نمط/مستوى  ·  sdLang  اللغة (ar / en)
========================================================= */
(function(){
  "use strict";
  var C=window.SudokuCore;
  var sec=document.getElementById("sudoku"),root=document.getElementById("sdRoot");
  if(!C||!sec||!root)return;

  var K_SAVE="sdSave",K_STATS="sdStats",K_PREF="sdPrefs",K_LANG="sdLang";

  /* ---------- النصوص: عربي + English ---------- */
  var T={
    ar:{
      title:"سودوكو",sub:"ألغاز الأرقام",back:"رجوع",lang:"EN",
      mode:"نمط اللعب",diff:"الصعوبة",
      m_classic:"كلاسيك",m_relaxed:"مريح",m_challenge:"تحدّي",m_daily:"اليومية",
      md_classic:"وقت وتلميحات ونقاط.",
      md_relaxed:"من غير وقت ولا ضغط أخطاء، والتلميحات مفتوحة.",
      md_challenge:"من غير تلميحات. بتتأكد بزرار «تحقق»، و3 أخطاء وتخسر الجولة.",
      md_daily:"لغز واحد كل يوم، نفسه لكل اللاعبين.",
      d_easy:"سهل",d_medium:"متوسط",d_hard:"صعب",
      daily_fixed:"صعوبة اللغز اليومي ثابتة: متوسط.",
      daily_date:"لغز يوم {d}",daily_done:"اتحل النهارده · أفضل وقت {t}",daily_todo:"لسه ماتحلش النهارده.",
      start:"ابدأ اللعب",cont:"كمّل اللغز اللي كنت فيه",online:"العب أونلاين",stats:"الإحصائيات",ach:"الإنجازات",
      time:"الوقت",errors:"الأخطاء",hints:"تلميحات",score:"النقاط",
      undo:"تراجع",erase:"مسح",notes:"ملاحظات",hint:"تلميح",check:"تحقق",
      menu:"القائمة",
      m_new:"لغز جديد",m_new_d:"اللغز الحالي هيتقفل",
      m_reset:"إعادة اللغز",m_reset_d:"نفس اللغز من الأول",
      m_sol:"اعرض الحل",m_sol_d:"الجولة هتخلص ومش هتتحسب فوز",
      m_home:"القائمة الرئيسية للعبة",
      c_new:"تبدأ لغز جديد؟",c_new_d:"تقدّمك في اللغز الحالي هيضيع.",
      c_reset:"تعيد اللغز من الأول؟",c_reset_d:"هتتمسح كل إجاباتك والوقت يبدأ من الصفر.",
      c_sol:"تعرض الحل؟",c_sol_d:"الجولة هتخلص ومش هتتحسب فوز.",
      yes:"تمام",no:"لأ، كمّل",
      hs_title:"تلميح",hs_logic:"تلميح منطقي",hs_logic_d:"معلومة تساعدك من غير ما نكشف الرقم",
      hs_rev:"اكشف خانة",hs_rev_d:"بنحط الرقم الصح في خانة",
      hs_left:"المتبقي: {n}",hs_none:"خلصت تلميحاتك في اللغز ده.",hs_chal:"مفيش تلميحات في وضع التحدّي.",
      h_mistake:"فيه رقم غلط في الصف {r}، العمود {c}.",
      h_last_row:"ناقص رقم واحد بس في الصف {i}.",
      h_last_col:"ناقص رقم واحد بس في العمود {i}.",
      h_last_box:"ناقص رقم واحد بس في المربع {i}.",
      h_naked:"الخانة اللي في الصف {r} والعمود {c} ينفع لها رقم واحد بس. بُص على الصف والعمود والمربع بتوعها.",
      h_hidden:"الرقم {n} ينفع في خانة واحدة بس جوه {u}. دوّر عليها.",
      h_cands:"الخانة اللي في الصف {r} والعمود {c} ممكن تكون: {l}.",
      u_row:"الصف {i}",u_col:"العمود {i}",u_box:"المربع {i}",
      revealed:"كشفنا لك خانة.",mistakes:"الشبكة اتملت بس فيها أخطاء، راجعها.",
      allGood:"كل اللي كتبته لحد دلوقتي صح.",foundWrong:"لقينا {n} خانة غلط.",
      w_title:"برافو، حليتها!",l_title:"الجولة خلصت",l_sub:"وصلت لـ {n} أخطاء.",
      sol_shown:"ده الحل الكامل. الجولة خلصت ومتحسبتش فوز.",
      newbest:"رقم قياسي جديد!",unl:"إنجاز جديد",
      w_new:"لغز جديد",w_menu:"القائمة",l_retry:"جرّب تاني",l_sol:"اعرض الحل",
      s_games:"عدد الألعاب",s_wins:"اتحلّت",s_rate:"نسبة الفوز",s_avg:"متوسط وقت الحل",
      s_err:"متوسط الأخطاء",s_hints:"تلميحات اتستخدمت",s_score:"أفضل نقاط",s_bt:"أفضل وقت",
      s_h_times:"أفضل وقت لكل مستوى",
      a_first_t:"أول حل",a_first_d:"حل أول سودوكو.",
      a_five_t:"خمسة ألغاز",a_five_d:"حل 5 ألغاز.",
      a_ten_t:"عشرة ألغاز",a_ten_d:"حل 10 ألغاز.",
      a_hard_t:"قلب الأسد",a_hard_d:"حل لغز من المستوى الصعب.",
      a_nohint_t:"من دماغك",a_nohint_d:"حل لغز من غير ما تستخدم تلميح.",
      a_noerr_t:"ولا غلطة",a_noerr_d:"حل لغز من غير أي خطأ.",
      a_daily_t:"لاعب اليوم",a_daily_d:"حل اللغز اليومي.",
      a_best_t:"رقم قياسي",a_best_d:"اكسر أفضل وقت ليك في أي مستوى.",
      a_days_t:"زبون دائم",a_days_d:"العب في 5 أيام مختلفة.",
      signin:"سجّل دخول بجوجل الأول",
      done:"تمام",
      aria_cell:"الصف {r}، العمود {c}"
    },
    en:{
      title:"Sudoku",sub:"Number puzzle",back:"Back",lang:"ع",
      mode:"Game mode",diff:"Difficulty",
      m_classic:"Classic",m_relaxed:"Relaxed",m_challenge:"Challenge",m_daily:"Daily",
      md_classic:"Timer, hints and score.",
      md_relaxed:"No timer, no error pressure, hints always open.",
      md_challenge:"No hints. You verify with the Check button, and 3 mistakes end the round.",
      md_daily:"One puzzle a day, the same for every player.",
      d_easy:"Easy",d_medium:"Medium",d_hard:"Hard",
      daily_fixed:"The daily puzzle is always Medium.",
      daily_date:"Puzzle of {d}",daily_done:"Solved today · best time {t}",daily_todo:"Not solved yet today.",
      start:"Start game",cont:"Continue your last puzzle",online:"Play online",stats:"Statistics",ach:"Achievements",
      time:"Time",errors:"Errors",hints:"Hints",score:"Score",
      undo:"Undo",erase:"Erase",notes:"Notes",hint:"Hint",check:"Check",
      menu:"Menu",
      m_new:"New puzzle",m_new_d:"The current puzzle will be closed",
      m_reset:"Reset puzzle",m_reset_d:"Same puzzle, from the start",
      m_sol:"Show solution",m_sol_d:"The round ends and doesn't count as a win",
      m_home:"Game menu",
      c_new:"Start a new puzzle?",c_new_d:"Your progress on this puzzle will be lost.",
      c_reset:"Restart this puzzle?",c_reset_d:"All your answers are cleared and the timer restarts.",
      c_sol:"Show the solution?",c_sol_d:"The round ends and won't count as a win.",
      yes:"Yes",no:"No, keep playing",
      hs_title:"Hint",hs_logic:"Logical hint",hs_logic_d:"A clue that helps without giving the number away",
      hs_rev:"Reveal a cell",hs_rev_d:"Fills one cell with the right number",
      hs_left:"Left: {n}",hs_none:"You've used all the hints for this puzzle.",hs_chal:"No hints in Challenge mode.",
      h_mistake:"There's a wrong number in row {r}, column {c}.",
      h_last_row:"Only one number is missing in row {i}.",
      h_last_col:"Only one number is missing in column {i}.",
      h_last_box:"Only one number is missing in box {i}.",
      h_naked:"The cell in row {r}, column {c} can only take one number. Look at its row, column and box.",
      h_hidden:"The number {n} fits in only one cell inside {u}. Find it.",
      h_cands:"The cell in row {r}, column {c} can be: {l}.",
      u_row:"row {i}",u_col:"column {i}",u_box:"box {i}",
      revealed:"We revealed a cell for you.",mistakes:"The grid is full but has mistakes. Check it.",
      allGood:"Everything you've entered so far is correct.",foundWrong:"Found {n} wrong cell(s).",
      w_title:"Solved!",l_title:"Round over",l_sub:"You reached {n} mistakes.",
      sol_shown:"This is the full solution. The round is over and doesn't count as a win.",
      newbest:"New personal best!",unl:"New achievement",
      w_new:"New puzzle",w_menu:"Menu",l_retry:"Try again",l_sol:"Show solution",
      s_games:"Games played",s_wins:"Solved",s_rate:"Win rate",s_avg:"Average solve time",
      s_err:"Average errors",s_hints:"Hints used",s_score:"Best score",s_bt:"Best time",
      s_h_times:"Best time per level",
      a_first_t:"First solve",a_first_d:"Solve your first Sudoku.",
      a_five_t:"Five puzzles",a_five_d:"Solve 5 puzzles.",
      a_ten_t:"Ten puzzles",a_ten_d:"Solve 10 puzzles.",
      a_hard_t:"Brave heart",a_hard_d:"Solve a Hard puzzle.",
      a_nohint_t:"All in your head",a_nohint_d:"Solve a puzzle without using a hint.",
      a_noerr_t:"Flawless",a_noerr_d:"Solve a puzzle with zero errors.",
      a_daily_t:"Player of the day",a_daily_d:"Solve the Daily puzzle.",
      a_best_t:"Record breaker",a_best_d:"Beat your best time on any level.",
      a_days_t:"Regular",a_days_d:"Play on 5 different days.",
      signin:"Sign in with Google first",
      done:"OK",
      aria_cell:"Row {r}, column {c}"
    }
  };

  var LANG="ar";
  function loadLang(){try{var l=localStorage.getItem(K_LANG);if(l==="en"||l==="ar")LANG=l;}catch(e){}}
  function t(k,v){
    var s=(T[LANG]&&T[LANG][k])||T.en[k]||k,x;
    if(v)for(x in v)s=s.split("{"+x+"}").join(v[x]);
    return s;
  }

  /* ---------- أيقونات ---------- */
  function sv(p,s){return'<svg viewBox="0 0 24 24" width="'+(s||22)+'" height="'+(s||22)+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';}
  var IC={
    back:function(){return sv(LANG==="ar"?'<path d="M9 6l6 6-6 6"/>':'<path d="M15 6l-6 6 6 6"/>',20);},
    dots:'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    undo:sv('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',20),
    erase:sv('<path d="M4 20h16"/><path d="M6 14l7-7a2.2 2.2 0 0 1 3 0l1.6 1.6a2.2 2.2 0 0 1 0 3L11 18H8z"/>',20),
    pencil:sv('<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>',20),
    bulb:sv('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',20),
    check:sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>',20),
    checkL:sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>',34),
    trophy:sv('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>',20),
    chart:sv('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',20),
    globe:sv('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',20),
    lock:sv('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',20),
    plus:sv('<path d="M12 5v14M5 12h14"/>',22),
    reset:sv('<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/>',22),
    eye:sv('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',22),
    home:sv('<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',22),
    star:sv('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',22)
  };

  /* ---------- الأنماط ---------- */
  var MODE_IDS=["classic","relaxed","challenge","daily"],DIFF_IDS=["easy","medium","hard"];
  var MODES={
    classic:{timed:true,errorsOn:true,instant:true,hints:"lvl",max:0},
    relaxed:{timed:false,errorsOn:false,instant:true,hints:"inf",max:0},
    challenge:{timed:true,errorsOn:true,instant:false,hints:0,max:3},
    daily:{timed:true,errorsOn:true,instant:true,hints:"lvl",max:0}
  };

  /* ---------- تخزين ---------- */
  function jget(k){try{return JSON.parse(localStorage.getItem(k)||"null");}catch(e){return null;}}
  function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function defStats(){return{games:0,wins:0,hints:0,timeSum:0,timeN:0,errSum:0,errGames:0,bestScore:0,best:{easy:null,medium:null,hard:null},daily:{},ach:{},flags:{},days:[]};}
  function loadStats(){
    var s=jget(K_STATS),d=defStats(),k;
    if(!s||typeof s!=="object")return d;
    for(k in d)if(s[k]!==undefined&&s[k]!==null)d[k]=s[k];
    if(!d.best||typeof d.best!=="object")d.best=defStats().best;
    if(!Array.isArray(d.days))d.days=[];
    ["daily","ach","flags"].forEach(function(x){if(!d[x]||typeof d[x]!=="object")d[x]={};});
    return d;
  }
  function saveStats(){jset(K_STATS,ST);}
  var PREF={mode:"classic",diff:"easy"};
  function loadPref(){
    var p=jget(K_PREF);
    if(p&&MODES[p.mode])PREF.mode=p.mode;
    if(p&&C.LEVELS[p.diff])PREF.diff=p.diff;
  }
  function savePref(){jset(K_PREF,PREF);}

  var ST=loadStats(),G=null,view="setup",dlg=null,pending=null,SIG=[];
  loadLang();loadPref();

  function zeros(){var a=[],i;for(i=0;i<81;i++)a.push(0);return a;}
  function snd(){try{if(typeof playClickSound==="function")playClickSound();}catch(e){}}
  function say(m){try{if(typeof toast==="function")toast(m);}catch(e){}}
  function pad2(n){return(n<10?"0":"")+n;}
  function fmt(s){s=Math.max(0,Math.round(s));return pad2(Math.floor(s/60))+":"+pad2(s%60);}
  function lvlName(d){return t("d_"+d);}
  function modeLabel(){return t("m_"+G.mode)+" · "+lvlName(G.diff);}

  /* ---------- لعبة جديدة / حفظ / استكمال ---------- */
  function noteDay(){
    var k=C.dailyKey();
    if(ST.days.indexOf(k)<0){ST.days.push(k);if(ST.days.length>400)ST.days.shift();}
  }
  function newGame(mode,diff){
    var daily=null,seed,i;
    if(mode==="daily"){daily=C.dailyKey();seed=C.dailySeed(daily);diff="medium";}
    else seed=C.randSeed();
    var gen=C.generate(diff,seed),puz=C.fromStr(gen.puzzle),sol=C.fromStr(gen.solution),given=[];
    for(i=0;i<81;i++)given[i]=puz[i]?1:0;
    G={mode:mode,diff:gen.diff,seed:seed,daily:daily,sol:sol,puz:puz,val:puz.slice(),given:given,
       rev:{},notes:zeros(),flag:{},sel:-1,notesOn:false,errors:0,hintsUsed:0,elapsed:0,seg:0,
       hist:[],over:false,result:null,msg:"",hl:{},shown:false};
    ST.games++;noteDay();
    var got=evalAch();saveStats();
    if(got.length)say(t("unl")+": "+t("a_"+got[0]+"_t"));
    save();
  }
  function startGame(mode,diff){
    snd();newGame(mode||PREF.mode,diff||PREF.diff);
    view="play";render();resume();
  }
  function save(){
    if(!G||G.over)return;
    jset(K_SAVE,{v:1,mode:G.mode,diff:G.diff,seed:G.seed,daily:G.daily,
      puz:C.toStr(G.puz),sol:C.toStr(G.sol),val:G.val.join(""),notes:G.notes.join(","),
      rev:Object.keys(G.rev).join(","),flag:Object.keys(G.flag).join(","),
      errors:G.errors,hints:G.hintsUsed,el:Math.round(elapsedMs())});
  }
  function clearSave(){try{localStorage.removeItem(K_SAVE);}catch(e){}}
  function readSave(){
    var o=jget(K_SAVE);
    if(!o||o.v!==1||!MODES[o.mode]||!C.LEVELS[o.diff])return null;
    var re=/^[0-9]{81}$/;
    if(!re.test(o.puz||"")||!re.test(o.sol||"")||!re.test(o.val||""))return null;
    var notes=String(o.notes||"").split(",").map(Number);
    if(notes.length!==81)return null;
    return o;
  }
  function continueGame(){
    var o=readSave();if(!o){render();return;}
    var puz=C.fromStr(o.puz),sol=C.fromStr(o.sol),val=C.fromStr(o.val),given=[],i,rev={},flag={};
    for(i=0;i<81;i++)given[i]=puz[i]?1:0;
    String(o.rev||"").split(",").forEach(function(x){if(x!=="")rev[+x]=1;});
    String(o.flag||"").split(",").forEach(function(x){if(x!=="")flag[+x]=1;});
    G={mode:o.mode,diff:o.diff,seed:o.seed,daily:o.daily||null,sol:sol,puz:puz,val:val,given:given,
       rev:rev,notes:String(o.notes).split(",").map(function(x){return(+x||0)&511*2;}),flag:flag,sel:-1,notesOn:false,
       errors:+o.errors||0,hintsUsed:+o.hints||0,elapsed:+o.el||0,seg:0,hist:[],over:false,result:null,msg:"",hl:{},shown:false};
    view="play";render();resume();
  }
  function resetGame(){
    G.val=G.puz.slice();G.notes=zeros();G.flag={};G.rev={};G.errors=0;G.hintsUsed=0;
    G.elapsed=0;G.seg=0;G.hist=[];G.over=false;G.result=null;G.msg="";G.hl={};G.shown=false;G.sel=-1;
    save();render();resume();
  }

  /* ---------- المؤقت ---------- */
  function elapsedMs(){return G?G.elapsed+(G.seg?Date.now()-G.seg:0):0;}
  function pause(){if(G&&G.seg){G.elapsed+=Date.now()-G.seg;G.seg=0;}}
  function resume(){
    if(G&&!G.over&&MODES[G.mode].timed&&view==="play"&&!dlg&&!document.hidden&&!sec.classList.contains("hidden")&&!G.seg)G.seg=Date.now();
  }
  function tick(){
    if(!G||view!=="play"||G.over||dlg)return;
    if(document.hidden||sec.classList.contains("hidden")){if(G.seg){pause();save();}return;}
    resume();paintStatus();
  }
  setInterval(tick,500);
  document.addEventListener("visibilitychange",function(){
    if(document.hidden){pause();save();}else tick();
  });

  /* ---------- نوافذ ---------- */
  function openDlg(html,sheet){
    closeDlg(true);
    var o=document.createElement("div");
    o.className="sd-ov"+(sheet?" sheet":"");
    o.innerHTML=html;
    o.addEventListener("click",function(e){if(e.target===o&&!o.getAttribute("data-lock"))closeDlg();});
    root.appendChild(o);dlg=o;
    if(G&&view==="play"&&!G.over)pause();
  }
  function closeDlg(keepTimer){
    if(dlg){dlg.remove();dlg=null;}
    pending=null;
    if(!keepTimer)resume();
  }
  function lockDlg(){if(dlg)dlg.setAttribute("data-lock","1");}
  function confirmBox(title,desc,fn){
    openDlg('<div class="sd-dlg"><h3>'+title+'</h3><p>'+desc+'</p><button type="button" class="sd-btn" data-a="ok">'+t("yes")+'</button><button type="button" class="sd-btn alt" data-a="close">'+t("no")+'</button></div>');
    pending=fn;
  }

  /* ---------- الشاشات ---------- */
  function bar(opt){
    opt=opt||{};
    return'<header class="sd-bar"><button type="button" class="sd-ib" data-a="back" aria-label="'+t("back")+'">'+IC.back()+'</button>'+
      '<div class="sd-title"><b>'+t("title")+'</b><span>'+(opt.sub||t("sub"))+'</span></div>'+
      '<button type="button" class="sd-ib" data-a="lang" aria-label="Language">'+t("lang")+'</button>'+
      (opt.menu?'<button type="button" class="sd-ib" data-a="menu" aria-label="'+t("menu")+'">'+IC.dots+'</button>':'')+'</header>';
  }
  function seg(name,ids,cur,label){
    return'<div class="sd-seg" role="group">'+ids.map(function(id){
      return'<button type="button" data-a="'+name+'" data-v="'+id+'" class="'+(cur===id?"on":"")+'">'+label(id)+'</button>';}).join("")+'</div>';
  }
  function render(){
    sec.setAttribute("dir",LANG==="ar"?"rtl":"ltr");sec.setAttribute("lang",LANG);
    closeDlg(true);
    if(view==="play"&&G)renderPlay();
    else if(view==="stats")renderStats();
    else if(view==="ach")renderAch();
    else{view="setup";renderSetup();}
  }

  function renderSetup(){
    var daily=PREF.mode==="daily",key=C.dailyKey(),dd=ST.daily[key],hasSave=!!readSave(),h=bar();
    h+='<div class="sd-panel"><div class="sd-label">'+t("mode")+'</div>'+
       seg("mode",MODE_IDS,PREF.mode,function(id){return t("m_"+id);})+
       '<p class="sd-note">'+t("md_"+PREF.mode)+'</p></div>';
    if(daily){
      h+='<div class="sd-panel"><div class="sd-label">'+t("daily_date",{d:'<span class="sd-num">'+key+'</span>'})+'</div>'+
         '<p class="sd-note" style="margin-top:0">'+t("daily_fixed")+'<br><b>'+(dd?t("daily_done",{t:'<span class="sd-num">'+fmt(dd.t)+'</span>'}):t("daily_todo"))+'</b></p></div>';
    }else{
      h+='<div class="sd-panel"><div class="sd-label">'+t("diff")+'</div>'+
         seg("diff",DIFF_IDS,PREF.diff,lvlName)+'</div>';
    }
    h+='<button type="button" class="sd-start" data-a="start">'+t("start")+'</button>';
    if(hasSave)h+='<button type="button" class="sd-wide alt" data-a="continue">'+t("cont")+'</button>';
    h+='<button type="button" class="sd-wide" data-a="online">'+t("online")+'<span class="sd-tag">ONLINE</span></button>';
    h+='<div class="sd-duo"><button type="button" class="sd-wide alt" data-a="stats">'+t("stats")+'</button><button type="button" class="sd-wide alt" data-a="ach">'+t("ach")+'</button></div>';
    root.innerHTML=h;
  }

  function chip(id,label){return'<div class="sd-chip" id="'+id+'Box"><small>'+label+'</small><b id="'+id+'">0</b></div>';}
  function boardHtml(){
    var h="",i,r,c;
    for(i=0;i<81;i++){
      r=C.ROW[i];c=C.COL[i];
      h+='<button type="button" class="sd-c'+(c%3===2&&c<8?" br":"")+(r%3===2&&r<8?" bb":"")+(c===8?" cl":"")+(r===8?" rl":"")+'" data-i="'+i+'" role="gridcell" aria-label="'+t("aria_cell",{r:r+1,c:c+1})+'"></button>';
    }
    return h;
  }
  function renderPlay(){
    SIG=[];
    var chal=G.mode==="challenge",h=bar({menu:1,sub:modeLabel()});
    h+='<div class="sd-info">'+chip("sdTime",t("time"))+chip("sdErr",t("errors"))+chip("sdHint",t("hints"))+chip("sdScore",t("score"))+'</div>';
    h+='<div class="sd-board" id="sdBoard" dir="ltr" role="grid" aria-label="Sudoku">'+boardHtml()+'</div>';
    h+='<div class="sd-msg" id="sdMsg" role="status" aria-live="polite"></div>';
    h+='<div id="sdCtl"><div class="sd-tools four">'+
       '<button type="button" class="sd-tool" data-a="undo">'+IC.undo+'<span>'+t("undo")+'</span></button>'+
       '<button type="button" class="sd-tool" data-a="erase">'+IC.erase+'<span>'+t("erase")+'</span></button>'+
       '<button type="button" class="sd-tool" data-a="notes" id="sdNotesBtn">'+IC.pencil+'<span>'+t("notes")+'</span></button>'+
       (chal?'<button type="button" class="sd-tool" data-a="check">'+IC.check+'<span>'+t("check")+'</span></button>':
             '<button type="button" class="sd-tool" data-a="hint" id="sdHintBtn">'+IC.bulb+'<span>'+t("hint")+'</span><em class="bd" id="sdHintBd"></em></button>')+
       '</div><div class="sd-pad" id="sdPad">';
    var n;for(n=1;n<=9;n++)h+='<button type="button" class="sd-key" data-a="num" data-n="'+n+'" aria-label="'+n+'"><b>'+n+'</b><i></i></button>';
    h+='</div></div>';
    h+='<div id="sdEnd" class="sd-endbar hidden"><button type="button" class="sd-wide" data-a="'+(G.daily?"w_menu":"w_new")+'">'+(G.daily?t("w_menu"):t("w_new"))+'</button><button type="button" class="sd-wide alt" data-a="w_menu">'+t("m_home")+'</button></div>';
    root.innerHTML=h;
    paint();
  }

  /* ---------- رسم الشبكة والحالة ---------- */
  function notesHtml(m){
    if(!m)return"";
    var h='<span class="sd-n">',d;
    for(d=1;d<=9;d++)h+='<i>'+(m&C.BIT[d]?d:"")+'</i>';
    return h+"</span>";
  }
  function hintsLeft(){
    var m=MODES[G.mode];
    if(m.hints==="inf")return Infinity;
    if(!m.hints)return 0;
    return Math.max(0,C.LEVELS[G.diff].hints-G.hintsUsed);
  }
  function liveScore(){
    var m=MODES[G.mode];
    if(G.mode==="relaxed")return null;
    return C.calcScore({diff:G.diff,seconds:Math.round(elapsedMs()/1000),hints:G.hintsUsed,errors:G.errors,timed:m.timed,errorsOn:m.errorsOn});
  }
  function setTxt(id,v){var e=document.getElementById(id);if(e&&e.textContent!==String(v))e.textContent=v;}
  function paintStatus(){
    if(view!=="play"||!G)return;
    var m=MODES[G.mode],sc=liveScore();
    setTxt("sdTime",m.timed?fmt(elapsedMs()/1000):"—");
    setTxt("sdScore",sc===null?"—":sc);
  }
  function paint(){
    if(view!=="play"||!G)return;
    var b=document.getElementById("sdBoard");if(!b)return;
    var sel=G.sel,sv0=sel>=0?G.val[sel]:0,peers={},i,m=MODES[G.mode],cells=b.children;
    if(sel>=0)C.PEERS[sel].forEach(function(p){peers[p]=1;});
    for(i=0;i<81;i++){
      var v=G.val[i],cls="sd-c"+(C.COL[i]%3===2&&C.COL[i]<8?" br":"")+(C.ROW[i]%3===2&&C.ROW[i]<8?" bb":"")+(C.COL[i]===8?" cl":"")+(C.ROW[i]===8?" rl":"");
      if(G.given[i])cls+=" g";else if(G.rev[i])cls+=" rv";
      if(i===sel)cls+=" sel";else if(peers[i])cls+=" pr";
      if(sv0&&v===sv0&&i!==sel)cls+=" sm";
      if(G.flag[i])cls+=" bad";
      if(G.hl[i])cls+=" hl";
      var sig=cls+"|"+v+"|"+(v?0:G.notes[i]);
      if(SIG[i]===sig)continue;
      SIG[i]=sig;
      var el=cells[i];el.className=cls;el.innerHTML=v?String(v):notesHtml(G.notes[i]);
    }
    b.classList.toggle("over",G.over);
    /* الشرايط والعدّادات */
    paintStatus();
    var left=hintsLeft();
    setTxt("sdErr",m.errorsOn?(m.max?G.errors+"/"+m.max:G.errors):"—");
    setTxt("sdHint",m.hints===0?"—":(left===Infinity?"∞":left));
    var eb=document.getElementById("sdErrBox");if(eb)eb.classList.toggle("warn",!!m.max&&G.errors>=m.max-1&&G.errors>0);
    var bd=document.getElementById("sdHintBd");
    if(bd){bd.textContent=left===Infinity?"∞":left;}
    var hb=document.getElementById("sdHintBtn");if(hb)hb.disabled=G.over;
    var nb=document.getElementById("sdNotesBtn");if(nb)nb.classList.toggle("on",G.notesOn);
    var used={},n;for(i=0;i<81;i++)if(G.val[i])used[G.val[i]]=(used[G.val[i]]||0)+1;
    var keys=document.querySelectorAll("#sdPad .sd-key");
    for(n=0;n<keys.length;n++){
      var k=n+1,rem=Math.max(0,9-(used[k]||0));
      keys[n].disabled=G.over||rem===0;
      keys[n].classList.toggle("noted",G.notesOn);
      var ie=keys[n].querySelector("i");if(ie&&ie.textContent!==String(rem))ie.textContent=rem;
    }
    var ms=document.getElementById("sdMsg");if(ms&&ms.textContent!==G.msg)ms.textContent=G.msg;
    var ctl=document.getElementById("sdCtl"),en=document.getElementById("sdEnd");
    if(ctl)ctl.classList.toggle("hidden",G.over);
    if(en)en.classList.toggle("hidden",!G.over);
  }

  /* ---------- اللعب ---------- */
  function pushHist(i){
    G.hist.push({i:i,v:G.val[i],notes:G.notes.slice(),flag:G.flag[i]?1:0});
    if(G.hist.length>300)G.hist.shift();
  }
  function selectCell(i){
    if(!G)return;
    G.sel=i;
    if(Object.keys(G.hl).length)G.hl={};
    paint();
  }
  function editable(i){return i>=0&&!G.over&&!G.given[i]&&!G.rev[i];}
  function dropNote(i,n){C.PEERS[i].forEach(function(p){G.notes[p]&=~C.BIT[n];});}
  function enter(n){
    if(!G||G.over||G.sel<0)return;
    var i=G.sel,m=MODES[G.mode];
    if(!editable(i))return;
    G.hl={};
    if(G.notesOn){
      if(G.val[i])return;
      pushHist(i);G.notes[i]^=C.BIT[n];save();paint();return;
    }
    if(G.val[i]===n)return;
    pushHist(i);
    G.val[i]=n;G.notes[i]=0;dropNote(i,n);delete G.flag[i];G.msg="";
    if(m.instant&&n!==G.sol[i]){G.flag[i]=1;if(m.errorsOn)G.errors++;}
    save();paint();
    afterMove();
  }
  function afterMove(){
    if(!C.isComplete(G.val))return;
    if(C.checkWin(G.val,G.sol)){finish("win");return;}
    if(!MODES[G.mode].instant)check(true);
    else{G.msg=t("mistakes");paint();}
  }
  function erase(){
    if(!G||G.over||G.sel<0)return;
    var i=G.sel;if(!editable(i))return;
    if(!G.val[i]&&!G.notes[i])return;
    pushHist(i);G.val[i]=0;G.notes[i]=0;delete G.flag[i];G.hl={};save();paint();
  }
  function undo(){
    if(!G||G.over||!G.hist.length)return;
    var h=G.hist.pop(),m=MODES[G.mode];
    G.val[h.i]=h.v;G.notes=h.notes;
    if(h.flag)G.flag[h.i]=1;else delete G.flag[h.i];
    if(m.instant&&G.val[h.i]&&G.val[h.i]!==G.sol[h.i])G.flag[h.i]=1;
    G.sel=h.i;G.hl={};save();paint();
  }
  function toggleNotes(){if(!G||G.over)return;G.notesOn=!G.notesOn;paint();}
  function check(auto){
    if(!G||G.over)return;
    var m=MODES[G.mode],wrong=[],i;
    for(i=0;i<81;i++)if(!G.given[i]&&!G.rev[i]&&G.val[i]&&G.val[i]!==G.sol[i])wrong.push(i);
    var fresh=wrong.filter(function(x){return!G.flag[x];});
    wrong.forEach(function(x){G.flag[x]=1;});
    G.hl={};
    if(!wrong.length)G.msg=t("allGood");
    else{G.errors+=fresh.length;G.msg=t("foundWrong",{n:wrong.length});}
    save();paint();
    if(m.max&&G.errors>=m.max)finish("lose");
  }

  /* ---------- التلميحات ---------- */
  function openHints(){
    if(!G||G.over)return;
    if(MODES[G.mode].hints===0){say(t("hs_chal"));return;}
    var left=hintsLeft(),dis=left<=0?" disabled":"";
    openDlg('<div class="sd-sheetbox"><h4>'+t("hs_title")+' · '+(left===Infinity?"∞":t("hs_left",{n:'<span class="sd-num">'+left+'</span>'}))+'</h4>'+
      '<button type="button" class="sd-item" data-a="hs_logic"'+dis+'>'+IC.bulb+'<span>'+t("hs_logic")+'<small>'+t("hs_logic_d")+'</small></span></button>'+
      '<button type="button" class="sd-item" data-a="hs_rev"'+dis+'>'+IC.eye+'<span>'+t("hs_rev")+'<small>'+t("hs_rev_d")+'</small></span></button>'+
      (left<=0?'<p class="sd-note" style="text-align:center">'+t("hs_none")+'</p>':"")+'</div>',true);
  }
  function unitName(u,idx){return t("u_"+u,{i:idx+1});}
  function useHint(type){
    if(!G||G.over||hintsLeft()<=0)return;
    var i,h,m=MODES[G.mode];
    if(type==="rev"){
      i=C.pickReveal(G.val,G.sol,G.sel);if(i<0)return;
      closeDlg(true);
      pushHist(i);
      G.val[i]=G.sol[i];G.notes[i]=0;dropNote(i,G.sol[i]);delete G.flag[i];G.rev[i]=1;G.sel=i;
      G.hintsUsed++;ST.hints++;saveStats();G.msg=t("revealed");G.hl={};
      save();resume();paint();afterMove();
      return;
    }
    h=C.logicalHint(G.val,G.sol);if(!h)return;
    closeDlg(true);
    G.hintsUsed++;ST.hints++;saveStats();
    var r=h.cell!=null?C.ROW[h.cell]+1:0,c=h.cell!=null?C.COL[h.cell]+1:0;
    G.hl={};
    if(h.t==="mistake"){G.msg=t("h_mistake",{r:r,c:c});G.hl[h.cell]=1;G.sel=h.cell;}
    else if(h.t==="last"){G.msg=t("h_last_"+h.unit,{i:h.index+1});h.cells.forEach(function(x){G.hl[x]=1;});G.sel=h.cell;}
    else if(h.t==="naked"){G.msg=t("h_naked",{r:r,c:c});G.hl[h.cell]=1;G.sel=h.cell;}
    else if(h.t==="hidden"){G.msg=t("h_hidden",{n:h.n,u:unitName(h.unit,h.index)});h.cells.forEach(function(x){if(!G.val[x])G.hl[x]=1;});}
    else{G.msg=t("h_cands",{r:r,c:c,l:h.cands.join(", ")});G.hl[h.cell]=1;G.sel=h.cell;}
    save();resume();paint();
  }

  /* ---------- نهاية الجولة ---------- */
  var ACH=[
    {id:"first",test:function(s){return s.wins>=1;},prog:function(s){return s.wins;},max:1,ic:IC.star},
    {id:"five",test:function(s){return s.wins>=5;},prog:function(s){return s.wins;},max:5,ic:IC.star},
    {id:"ten",test:function(s){return s.wins>=10;},prog:function(s){return s.wins;},max:10,ic:IC.star},
    {id:"hard",test:function(s){return!!s.flags.hard;},ic:IC.trophy},
    {id:"nohint",test:function(s){return!!s.flags.nohint;},ic:IC.bulb},
    {id:"noerr",test:function(s){return!!s.flags.noerr;},ic:IC.check},
    {id:"daily",test:function(s){return!!s.flags.daily;},ic:IC.globe},
    {id:"best",test:function(s){return!!s.flags.best;},ic:IC.chart},
    {id:"days",test:function(s){return s.days.length>=5;},prog:function(s){return s.days.length;},max:5,ic:IC.home}
  ];
  function evalAch(){
    var got=[];
    ACH.forEach(function(a){if(!ST.ach[a.id]&&a.test(ST)){ST.ach[a.id]=Date.now();got.push(a.id);}});
    return got;
  }
  function record(kind,secs){
    var m=MODES[G.mode],res={score:null,newBest:false,got:[]};
    if(kind==="win"){
      ST.wins++;
      if(m.timed){ST.timeSum+=secs;ST.timeN++;}
      if(G.mode!=="relaxed"){
        res.score=C.calcScore({diff:G.diff,seconds:secs,hints:G.hintsUsed,errors:G.errors,timed:m.timed,errorsOn:m.errorsOn});
        if(res.score>ST.bestScore)ST.bestScore=res.score;
      }
      if(G.diff==="hard")ST.flags.hard=1;
      if(G.mode!=="challenge"&&!G.hintsUsed)ST.flags.nohint=1;
      if(m.errorsOn&&!G.errors)ST.flags.noerr=1;
      if(G.mode==="daily"){
        ST.flags.daily=1;
        var d=ST.daily[G.daily];
        if(!d||secs<d.t){ST.daily[G.daily]={t:secs,s:res.score||0};res.newBest=true;}
      }else if(m.timed){
        var prev=ST.best[G.diff];
        if(prev==null||secs<prev){ST.best[G.diff]=secs;if(prev!=null){res.newBest=true;ST.flags.best=1;}}
      }
    }
    if(m.errorsOn&&(kind==="win"||kind==="lose")){ST.errSum+=G.errors;ST.errGames++;}
    res.got=evalAch();
    saveStats();
    return res;
  }
  function finish(kind){
    if(!G||G.over)return;
    pause();G.over=true;G.result=kind;G.sel=-1;G.hl={};
    var secs=Math.round(G.elapsed/1000);
    clearSave();
    if(kind==="solution"){
      G.val=G.sol.slice();G.shown=true;G.flag={};G.msg=t("sol_shown");
      paint();return;
    }
    var res=record(kind,secs);
    G.msg="";
    paint();
    if(kind==="win"){snd();var bd=document.getElementById("sdBoard");if(bd){bd.classList.add("won");}}
    showResult(kind,secs,res);
  }
  function showResult(kind,secs,res){
    var m=MODES[G.mode],h='<div class="sd-dlg">';
    if(kind==="win"){
      h+='<div class="sd-medal">'+IC.checkL+'</div><h3>'+t("w_title")+'</h3><p>'+modeLabel()+'</p>';
      if(res.newBest)h+='<div class="sd-tagline">'+t("newbest")+'</div>';
      h+='<div class="sd-res"><div><small>'+t("time")+'</small><b>'+(m.timed?fmt(secs):"—")+'</b></div>'+
         '<div><small>'+t("errors")+'</small><b>'+(m.errorsOn?G.errors:"—")+'</b></div>'+
         '<div><small>'+t("hints")+'</small><b>'+G.hintsUsed+'</b></div>'+
         '<div><small>'+t("score")+'</small><b>'+(res.score===null?"—":res.score)+'</b></div></div>';
    }else{
      h+='<div class="sd-medal">'+sv('<path d="M6 6l12 12M18 6L6 18"/>',34)+'</div><h3>'+t("l_title")+'</h3><p>'+t("l_sub",{n:G.errors})+'</p>';
    }
    if(res.got.length){
      h+='<div class="sd-unl"><div>'+t("unl")+'</div>'+res.got.map(function(id){return'<div>★ '+t("a_"+id+"_t")+'</div>';}).join("")+'</div>';
    }
    if(kind==="win"){
      h+=G.daily?'<button type="button" class="sd-btn" data-a="w_menu">'+t("w_menu")+'</button>':
         '<button type="button" class="sd-btn" data-a="w_new">'+t("w_new")+'</button><button type="button" class="sd-btn alt" data-a="w_menu">'+t("w_menu")+'</button>';
    }else{
      h+='<button type="button" class="sd-btn" data-a="l_retry">'+t("l_retry")+'</button>'+
         '<button type="button" class="sd-btn alt" data-a="w_new">'+t("w_new")+'</button>'+
         '<button type="button" class="sd-btn ghost" data-a="l_sol">'+t("l_sol")+'</button>';
    }
    openDlg(h+'</div>');lockDlg();
  }

  /* ---------- القائمة ---------- */
  function openMenu(){
    if(!G)return;
    var over=G.over;
    openDlg('<div class="sd-sheetbox"><h4>'+t("menu")+'</h4>'+
      (G.daily?"":'<button type="button" class="sd-item" data-a="m_new">'+IC.plus+'<span>'+t("m_new")+'<small>'+t("m_new_d")+'</small></span></button>')+
      '<button type="button" class="sd-item" data-a="m_reset">'+IC.reset+'<span>'+t("m_reset")+'<small>'+t("m_reset_d")+'</small></span></button>'+
      '<button type="button" class="sd-item" data-a="m_sol"'+(over?" disabled":"")+'>'+IC.eye+'<span>'+t("m_sol")+'<small>'+t("m_sol_d")+'</small></span></button>'+
      '<button type="button" class="sd-item" data-a="m_home">'+IC.home+'<span>'+t("m_home")+'</span></button></div>',true);
  }
  function inProgress(){return G&&!G.over&&(G.hist.length>0||G.errors>0||G.hintsUsed>0);}
  function toSetup(){
    pause();save();closeDlg(true);view="setup";render();window.scrollTo(0,0);
  }

  /* ---------- إحصائيات + إنجازات ---------- */
  function renderStats(){
    var s=ST,rate=s.games?Math.round(s.wins/s.games*100)+"%":"—",
        avg=s.timeN?fmt(s.timeSum/s.timeN):"—",ae=s.errGames?(s.errSum/s.errGames).toFixed(1):"—";
    function card(v,l,hi){return'<div class="sd-st'+(hi?" hi":"")+'"><b>'+v+'</b><small>'+l+'</small></div>';}
    var h=bar({sub:t("stats")})+'<div class="sd-grid2">'+
      card(s.games,t("s_games"))+card(s.wins,t("s_wins"))+card(rate,t("s_rate"),1)+card(avg,t("s_avg"))+
      card(ae,t("s_err"))+card(s.hints,t("s_hints"))+'</div>'+
      '<div class="sd-grid2" style="grid-template-columns:1fr">'+card(s.bestScore||"—",t("s_score"),1)+'</div>'+
      '<div class="sd-h">'+t("s_h_times")+'</div><div class="sd-grid2" style="grid-template-columns:repeat(3,1fr)">'+
      DIFF_IDS.map(function(d){return card(s.best[d]==null?"—":fmt(s.best[d]),lvlName(d));}).join("")+'</div>';
    root.innerHTML=h;
  }
  function renderAch(){
    var h=bar({sub:t("ach")})+'<div class="sd-list">'+ACH.map(function(a){
      var got=!!ST.ach[a.id],p=a.max?Math.min(a.prog(ST),a.max):0;
      return'<div class="sd-ach '+(got?"got":"lock")+'"><span class="ic">'+(got?a.ic:IC.lock)+'</span><div class="tx"><b>'+t("a_"+a.id+"_t")+'</b><small>'+t("a_"+a.id+"_d")+'</small>'+
        (!got&&a.max?'<span class="sd-prog"><i style="width:'+Math.round(p/a.max*100)+'%"></i></span>':"")+'</div></div>';
    }).join("")+'</div>';
    root.innerHTML=h;
  }

  /* ---------- الأوامر ---------- */
  function goOnline(){
    if(window.OL&&OL.open){snd();OL.open("sudoku");}
    else say(t("signin"));
  }
  function act(a,d){
    switch(a){
      case"back":
        if(view==="setup"){snd();pause();show("hub");}
        else if(view==="play"){snd();toSetup();}
        else{snd();view="setup";render();}
        break;
      case"lang":
        LANG=LANG==="ar"?"en":"ar";try{localStorage.setItem(K_LANG,LANG);}catch(e){}
        render();if(view==="play")paint();
        break;
      case"mode":PREF.mode=d.v;savePref();snd();renderSetup();break;
      case"diff":PREF.diff=d.v;savePref();snd();renderSetup();break;
      case"start":startGame();break;
      case"continue":snd();continueGame();break;
      case"online":goOnline();break;
      case"stats":snd();view="stats";render();window.scrollTo(0,0);break;
      case"ach":snd();view="ach";render();window.scrollTo(0,0);break;
      case"menu":openMenu();break;
      case"close":closeDlg();break;
      case"ok":{var f=pending;closeDlg(true);pending=null;if(f)f();else resume();break;}
      case"num":enter(+d.n);break;
      case"undo":undo();break;
      case"erase":erase();break;
      case"notes":toggleNotes();break;
      case"hint":openHints();break;
      case"hs_logic":useHint("logic");break;
      case"hs_rev":useHint("rev");break;
      case"check":check(false);break;
      case"m_new":
        closeDlg(true);
        if(inProgress())confirmBox(t("c_new"),t("c_new_d"),function(){startGame(G.mode,G.diff);});
        else startGame(G.mode,G.diff);
        break;
      case"m_reset":
        closeDlg(true);
        if(inProgress())confirmBox(t("c_reset"),t("c_reset_d"),resetGame);
        else resetGame();
        break;
      case"m_sol":closeDlg(true);confirmBox(t("c_sol"),t("c_sol_d"),function(){finish("solution");});break;
      case"m_home":closeDlg(true);toSetup();break;
      case"w_new":closeDlg(true);startGame(G.mode,G.diff);break;
      case"w_menu":closeDlg(true);toSetup();break;
      case"l_retry":closeDlg(true);resetGame();break;
      case"l_sol":closeDlg(true);G.over=false;finish("solution");break;
    }
  }
  root.addEventListener("click",function(e){
    var c=e.target.closest(".sd-c");
    if(c&&view==="play"&&!dlg){selectCell(+c.getAttribute("data-i"));return;}
    var el=e.target.closest("[data-a]");
    if(!el||el.disabled)return;
    act(el.getAttribute("data-a"),{v:el.getAttribute("data-v"),n:el.getAttribute("data-n")});
  });
  document.addEventListener("keydown",function(e){
    if(view!=="play"||!G||dlg||sec.classList.contains("hidden")||e.ctrlKey||e.metaKey||e.altKey)return;
    var k=e.key;
    if(k>="1"&&k<="9"){e.preventDefault();enter(+k);}
    else if(k==="Backspace"||k==="Delete"||k==="0"){e.preventDefault();erase();}
    else if(k==="n"||k==="N"){toggleNotes();}
    else if(k==="h"||k==="H"){openHints();}
    else if(k==="z"||k==="Z"){undo();}
    else if(k.indexOf("Arrow")===0){
      e.preventDefault();
      var i=G.sel<0?40:G.sel,r=C.ROW[i],c=C.COL[i];
      if(k==="ArrowUp")r=Math.max(0,r-1);else if(k==="ArrowDown")r=Math.min(8,r+1);
      else if(k==="ArrowLeft")c=Math.max(0,c-1);else c=Math.min(8,c+1);
      selectCell(r*9+c);
    }else if(k==="Escape"){selectCell(-1);}
  });

  /* ---------- نقاط الدخول ---------- */
  window.sdOpen=function(){
    loadLang();ST=loadStats();loadPref();
    if(G)pause();
    closeDlg(true);view="setup";render();
    show("sudoku");
  };
})();
