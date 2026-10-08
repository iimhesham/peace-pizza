/* =========================================================
   LUDO ENGINE — قواعد اللعبة فقط، بدون أي DOM.
   بيتستخدم في الأوفلاين (ludo.js) والأونلاين (online-ludo.js)
   عشان القواعد تبقى واحدة بالظبط في الاتنين.

   الفكرة: كل قطعة ليها position بس (مش مكان على الشاشة):
     -1      = في البيت (HOME)
     0..50   = على المسار الرئيسي (0 = خانة البداية بتاعتها)
     51..55  = المسار النهائي بتاع لونها (IN_FINAL_PATH)
     56      = وصلت (FINISHED)
   الـ UI بس هو اللي بيحوّل الـ position لمكان مرئي.
========================================================= */
(function(root){
  "use strict";

  const COLORS=["red","green","yellow","blue"];            // ترتيب الأدوار: مع عقارب الساعة
  const START={red:0,green:13,yellow:26,blue:39};          // خانة بداية كل لون على المسار (52 خانة)
  const SAFE=[0,8,13,21,26,34,39,47];                      // خانات البداية + النجمة اللي بعدها بـ 8
  const TRACK_LEN=52,LAST_MAIN=50,FINISH=56,FINAL_FIRST=51;

  /* ---------- لوحة الـ 6 لاعبين (أونلاين) ----------
     نفس القواعد بالظبط، بس 6 أذرع بدل 4: المسار 6×13 = 78 خانة، وكل لون بيبدأ عند 13×(رقم ذراعه).
     وعشان القطعة تلف لحد ذراعها هي: آخر خانة رئيسية = 76، المسار النهائي 77..81، والوصول = 82
     (في الـ 4 لاعبين: 50 / 51..55 / 56 — يعني طول المسار - 2 / - 1 / + 4).
     ترتيب الأدوار مع عقارب الساعة. اللونين الجداد: violet (بنفسجي) و pink (وردي).
     الـ mode بيتخزّن في g.mode (4 أو 6)، والألعاب القديمة اللي من غير mode بتتعامل كـ 4. */
  const COLORS6=["red","green","violet","yellow","blue","pink"];
  const START6={red:0,green:13,violet:26,yellow:39,blue:52,pink:65};
  const SAFE6=[0,8,13,21,26,34,39,47,52,60,65,73];
  const LAYOUT={
    4:{colors:COLORS,start:START,safe:SAFE,len:52,last:50,ff:51,fin:56},
    6:{colors:COLORS6,start:START6,safe:SAFE6,len:78,last:76,ff:77,fin:82}
  };
  const LY=m=>m===6?LAYOUT[6]:LAYOUT[4];

  /* ---------- Board Data (شبكة 15×15، [صف, عمود]) ---------- */
  const TRACK=[
    [6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
    [0,7],[0,8],
    [1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
    [7,14],[8,14],
    [8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
    [14,7],[14,6],
    [13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
    [7,0],[6,0]
  ];
  const FINAL_PATH={
    red:   [[7,1],[7,2],[7,3],[7,4],[7,5]],
    green: [[1,7],[2,7],[3,7],[4,7],[5,7]],
    yellow:[[7,13],[7,12],[7,11],[7,10],[7,9]],
    blue:  [[13,7],[12,7],[11,7],[10,7],[9,7]]
  };
  const YARD_ORIGIN={red:[0,0],green:[0,9],yellow:[9,9],blue:[9,0]};
  const board={
    mainTrack:TRACK,
    startCells:START,
    safeCells:SAFE,
    finalPaths:FINAL_PATH,
    homeAreas:YARD_ORIGIN
  };

  /* ---------- Tokens / Players ---------- */
  function stateOf(pos,mode){
    const L=LY(mode);
    if(pos<0)return"HOME";
    if(pos>=L.fin)return"FINISHED";
    if(pos>=L.ff)return"IN_FINAL_PATH";
    return"ON_BOARD";
  }

  function createTokens(color){
    const t=[];
    for(let i=0;i<4;i++)t.push({id:color+"-"+(i+1),playerId:color,idx:i,state:"HOME",position:-1,finished:false});
    return t;
  }

  /* cfg: [{color,type:"human"|"ai",level:"easy"|"mid"|"hard",name}] بترتيب الجلوس */
  function createPlayers(cfg){
    return cfg.map(c=>({
      id:c.color,color:c.color,type:c.type||"human",level:c.level||"mid",name:c.name||c.color,
      uid:c.uid||"",
      tokens:createTokens(c.color),finishedTokens:0,captures:0,score:0,lost:0,rolls:0,sixes:0
    }));
  }

  /* opts: {threeSixes:true, fullRanking:false}
     first: index اللاعب اللي يبدأ */
  function initializeGame(cfg,opts,first){
    const players=createPlayers(cfg);
    return{
      players,
      opts:Object.assign({threeSixes:true,fullRanking:false},opts||{}),
      mode:(opts&&opts.mode===6)?6:4,
      currentPlayer:Math.max(0,Math.min(players.length-1,first|0)),
      diceValue:null,
      consecutiveSixes:0,
      phase:"roll",            // roll | move | over
      valid:[],
      gameStatus:"playing",
      winner:null,
      ranking:[],              // ألوان بترتيب الوصول
      last:null,               // آخر حدث (للـ UI)
      turnNo:1
    };
  }

  const cur=g=>g.players[g.currentPlayer];
  const playerOf=(g,color)=>g.players.find(p=>p.color===color);
  const tokenOf=(g,id)=>{for(const p of g.players)for(const t of p.tokens)if(t.id===id)return t;return null;};

  /* ---------- Dice ---------- */
  function rollDice(rng){
    return 1+Math.floor((rng?rng():Math.random())*6);
  }
  /* نرد حتمي للأونلاين: نفس (seed,k) = نفس الرقم عند كل اللاعبين */
  function diceFor(seed,k){
    let h=(seed|0)^Math.imul((k|0)+1,0x9E3779B1);
    h^=h>>>16;h=Math.imul(h,0x85EBCA6B);h^=h>>>13;h=Math.imul(h,0xC2B2AE35);h^=h>>>16;
    return((h>>>0)%6)+1;
  }
  function rngFor(seed,k){            // رقم 0..1 حتمي (لاختيارات الـ AI في الأونلاين)
    let h=(seed|0)^Math.imul((k|0)+7,0x85EBCA6B);
    h^=h>>>15;h=Math.imul(h,0x2C1B3C6D);h^=h>>>12;h=Math.imul(h,0x297A2D39);h^=h>>>15;
    return(h>>>0)/4294967296;
  }

  /* ---------- الخانات ---------- */
  // رقم الخانة على المسار الرئيسي (0..51) أو -1 لو القطعة مش على المسار الرئيسي
  function absCell(color,pos,mode){
    const L=LY(mode);
    if(pos<0||pos>L.last)return -1;
    return(L.start[color]+pos)%L.len;
  }
  function isSafeCell(abs,mode){return abs>=0&&LY(mode).safe.indexOf(abs)>=0;}

  // الإحداثيات [صف, عمود] لأي position (للـ UI فقط)
  function cellOf(color,pos){
    if(pos>=0&&pos<=LAST_MAIN)return TRACK[(START[color]+pos)%TRACK_LEN];
    if(pos>=FINAL_FIRST&&pos<FINISH)return FINAL_PATH[color][pos-FINAL_FIRST];
    return null;
  }

  // مين على الخانة دي (على المسار الرئيسي)؟ كل خانة بتخزّن أكتر من قطعة
  function tokensOnCell(g,abs){
    const out=[];
    for(const p of g.players)for(const t of p.tokens){
      if(absCell(p.color,t.position,g.mode)===abs)out.push(t);
    }
    return out;
  }

  // Block: قطعتين أو أكتر من نفس اللاعب على نفس الخانة
  function isBlock(g,abs,color){
    let n=0;
    for(const t of tokensOnCell(g,abs))if(t.playerId===color)n++;
    return n>=2;
  }

  /* ---------- الحركة ---------- */
  function calculateDestination(token,dice,mode){
    const FIN=LY(mode).fin;
    if(token.position>=FIN)return{ok:false,reason:"finished"};
    if(token.position<0){
      if(dice!==6)return{ok:false,reason:"need-six"};
      return{ok:true,pos:0,exit:true};
    }
    const np=token.position+dice;
    if(np>FIN)return{ok:false,reason:"exact"};   // لازم الرقم الدقيق
    return{ok:true,pos:np,exit:false};
  }

  // مين هيتاكل لو القطعة دي نزلت على الخانة دي؟
  // مفيش أكل على: خانة safe، ولا Block، ولا خانة فيها أكتر من لون مع بعض
  // (يعني فيها قطع من ناحيتين قاعدين مع بعض بالفعل — مفيش حد فيهم يتاكل).
  // movingId = القطعة اللي بتتحرك دلوقتي (بنتجاهلها عشان النتيجة تطلع واحدة
  // سواء اتحسبت قبل الحركة (getValidMoves) أو بعدها (moveToken)).
  function checkCapture(g,color,newPos,movingId){
    const abs=absCell(color,newPos,g.mode);
    if(abs<0||isSafeCell(abs,g.mode))return[];
    const byColor={};
    for(const t of tokensOnCell(g,abs)){
      if(movingId&&t.id===movingId)continue;
      (byColor[t.playerId]=byColor[t.playerId]||[]).push(t);
    }
    if(Object.keys(byColor).length>=2)return[];      // خانة مشتركة: محدش بياكل حد
    const victims=[];
    for(const c in byColor){
      if(c===color)continue;                          // قطعي أنا
      if(byColor[c].length>=2)continue;               // Block محمي
      victims.push(byColor[c][0]);
    }
    return victims;
  }

  function canMoveToken(g,token,dice){
    if(!token||token.finished)return false;
    return calculateDestination(token,dice,g.mode).ok;
  }

  function getValidMoves(g,dice){
    const p=cur(g),moves=[],L=LY(g.mode);
    for(const t of p.tokens){
      const d=calculateDestination(t,dice,g.mode);
      if(!d.ok)continue;
      const caps=checkCapture(g,p.color,d.pos,t.id);
      moves.push({
        tokenId:t.id,idx:t.idx,from:t.position,to:d.pos,exit:!!d.exit,
        captures:caps.map(x=>x.id),capturesN:caps.length,
        finishes:d.pos===L.fin,intoFinal:t.position<L.ff&&d.pos>=L.ff&&d.pos<L.fin
      });
    }
    return moves;
  }

  /* ---------- الأدوار ---------- */
  function activePlayers(g){return g.players.filter(p=>p.finishedTokens<4);}

  function nextTurn(g){
    g.consecutiveSixes=0;
    g.diceValue=null;g.valid=[];
    const n=g.players.length;
    let i=g.currentPlayer;
    for(let k=0;k<n;k++){
      i=(i+1)%n;
      if(g.players[i].finishedTokens<4){g.currentPlayer=i;break;}
    }
    g.phase="roll";g.turnNo++;
  }
  const startTurn=g=>{g.phase="roll";};
  const endTurn=g=>nextTurn(g);

  /* بعد الرمية: يحسب الحركات الصالحة أو يعدّي الدور.
     بيرجّع وصف للي حصل عشان الـ UI يعرضه. */
  function applyRoll(g,dice){
    if(g.phase!=="roll")return{ok:false};
    const p=cur(g);
    g.diceValue=dice;p.rolls++;
    if(dice===6){p.sixes++;g.consecutiveSixes++;}else g.consecutiveSixes=0;

    // ثلاث ستات ورا بعض = الدور ملغي
    if(dice===6&&g.opts.threeSixes&&g.consecutiveSixes>=3){
      g.last={type:"cancel",color:p.color,dice};
      nextTurn(g);
      return{ok:true,cancelled:true,dice};
    }

    g.valid=getValidMoves(g,dice);
    if(!g.valid.length){
      g.last={type:"nomove",color:p.color,dice};
      if(dice===6){g.phase="roll";g.valid=[];}      // السته بتدّي رمية زيادة حتى لو مفيش حركة
      else nextTurn(g);
      return{ok:true,noMove:true,dice,again:dice===6};
    }
    g.phase="move";
    return{ok:true,dice,moves:g.valid};
  }

  function checkFinish(g,token){
    if(token.position===LY(g.mode).fin){token.finished=true;token.state="FINISHED";return true;}
    return false;
  }

  function captureToken(g,victim){
    victim.position=-1;victim.state="HOME";victim.finished=false;
    playerOf(g,victim.playerId).lost++;
  }

  // بيحدّث ترتيب الفوز. بيرجّع true لو المباراة خلصت.
  function checkWin(g){
    const p=cur(g);
    if(p.finishedTokens>=4&&g.ranking.indexOf(p.color)<0){
      g.ranking.push(p.color);
      if(g.winner===null)g.winner=p.color;
    }
    const left=activePlayers(g);
    const over=g.opts.fullRanking?left.length<=1:g.winner!==null;
    if(over){
      if(g.opts.fullRanking){
        left.forEach(x=>{if(g.ranking.indexOf(x.color)<0)g.ranking.push(x.color);});
      }else{
        // باقي الترتيب حسب القطع اللي وصلت ثم التقدم
        const prog=x=>x.tokens.reduce((s,t)=>s+Math.max(0,t.position+1),0);
        g.players.filter(x=>g.ranking.indexOf(x.color)<0)
          .sort((a,b)=>b.finishedTokens-a.finishedTokens||prog(b)-prog(a))
          .forEach(x=>g.ranking.push(x.color));
      }
      g.phase="over";g.gameStatus="finished";
    }
    return over;
  }

  /* moveToken: بتنفّذ الحركة بالترتيب اللي في المواصفات:
     القطعة بتاعة اللاعب الحالي ← الحركة صالحة ← تحديث position ← Capture ← Finish ← Win ← الدور */
  function moveToken(g,tokenId,dice){
    if(g.phase!=="move")return{ok:false,reason:"phase"};
    if(dice==null)dice=g.diceValue;
    if(dice!==g.diceValue)return{ok:false,reason:"dice"};
    const p=cur(g);
    const t=p.tokens.find(x=>x.id===tokenId);
    if(!t)return{ok:false,reason:"not-yours"};
    const mv=g.valid.find(m=>m.tokenId===tokenId);
    if(!mv)return{ok:false,reason:"invalid"};

    const from=t.position;
    t.position=mv.to;t.state=stateOf(mv.to,g.mode);

    const victims=checkCapture(g,p.color,mv.to,t.id);
    victims.forEach(v=>captureToken(g,v));
    if(victims.length){p.captures+=victims.length;p.score+=10*victims.length;}

    let fin=false;
    if(checkFinish(g,t)){fin=true;p.finishedTokens++;p.score+=15;}
    if(mv.exit)p.score+=2;

    const res={ok:true,tokenId,from,to:mv.to,exit:mv.exit,captured:victims.map(v=>v.id),capturedColors:victims.map(v=>v.playerId),finished:fin,dice};
    g.last={type:"move",color:p.color,tokenId,from,to:mv.to,captured:res.captured,finished:fin,dice};

    const over=checkWin(g);
    if(over){res.win=true;res.over=true;g.valid=[];return res;}
    res.win=p.finishedTokens>=4;

    // رمية زيادة عند الـ 6، وإلا الدور اللي بعده (لو اللاعب خلّص بالـ 6 الدور بيعدّي برضه)
    // رمية زيادة عند الـ 6 أو لما قطعة توصل (تدخل البيت) أو لما تاكل قطعة خصم — ما لم يكن اللاعب خلّص كل قطعه
    const cap=victims.length>0;
    if((dice===6||fin||cap)&&p.finishedTokens<4){g.phase="roll";g.valid=[];g.diceValue=null;res.again=true;res.bonusFinish=fin&&dice!==6;res.bonusCapture=cap&&dice!==6&&!fin;}
    else{nextTurn(g);res.again=false;}
    return res;
  }

  /* ---------- الذكاء الاصطناعي ---------- */
  function canCaptureWithMove(m){return m.capturesN>0;}
  function canFinishWithMove(m){return m.finishes;}

  // قطعة معرّضة للخطر: على المسار، مش على خانة آمنة، مش Block، وفي خصم وراها بـ 1..6 خانات
  function isTokenInDanger(g,token,posOverride){
    const color=token.playerId;
    const pos=posOverride==null?token.position:posOverride;
    const abs=absCell(color,pos,g.mode),LEN=LY(g.mode).len,LM=LY(g.mode).last;
    if(abs<0||isSafeCell(abs,g.mode))return false;
    if(posOverride==null&&isBlock(g,abs,color))return false;
    for(const o of g.players){
      if(o.color===color)continue;
      for(const ot of o.tokens){
        if(ot.position<0||ot.position>LM)continue;
        const oa=absCell(o.color,ot.position,g.mode);
        const steps=(abs-oa+LEN)%LEN;
        if(steps>=1&&steps<=6&&ot.position+steps<=LM)return true;
      }
    }
    return false;
  }

  function evaluateMove(g,m,level){
    const p=cur(g),t=p.tokens.find(x=>x.id===m.tokenId);
    let s=0;
    if(level==="easy")return Math.random();
    if(m.finishes)s+=100;
    if(m.capturesN)s+=60*m.capturesN;
    if(m.exit)s+=30;
    if(level==="mid"){s+=m.to*.2+Math.random()*3;return s;}

    // Hard: تقييم المخاطر والحماية والتقدم
    const abs=absCell(p.color,m.to,g.mode);
    const wasDanger=isTokenInDanger(g,t);
    const willDanger=m.to<=LY(g.mode).last&&isTokenInDanger(g,t,m.to)&&!m.capturesN;
    if(m.intoFinal)s+=28;
    if(abs>=0&&isSafeCell(abs,g.mode))s+=18;
    if(wasDanger&&!willDanger)s+=34;
    if(willDanger)s-=38;
    // تكوين Block
    if(abs>=0&&p.tokens.some(o=>o.id!==t.id&&absCell(p.color,o.position,g.mode)===abs))s+=12;
    // القطعة اللي قريبة من خصم وراها وبتتحرك مش هتتحمي لو سابت خانتها
    s+=m.to*.35;                       // تقدم
    if(m.from>=0)s+=m.from*.05;        // نفضّل القطعة المتقدمة
    s+=Math.random()*1.5;
    return s;
  }

  function chooseAIMove(g,level,rng){
    const moves=g.valid;
    if(!moves.length)return null;
    level=level||cur(g).level||"mid";
    if(level==="easy"){
      const r=(rng?rng():Math.random());
      return moves[Math.floor(r*moves.length)];
    }
    let best=null,bs=-Infinity;
    for(const m of moves){
      const sc=evaluateMove(g,m,level)+(rng?rng()*.5:0);
      if(sc>bs){bs=sc;best=m;}
    }
    return best;
  }

  /* نسخة حتمية للـ AI في الأونلاين (من غير Math.random) */
  function chooseAIMoveSeeded(g,seed,k){
    const moves=g.valid;
    if(!moves.length)return null;
    const p=cur(g),t={};
    let best=null,bs=-Infinity;
    moves.forEach((m,i)=>{
      const tk=p.tokens.find(x=>x.id===m.tokenId);
      let s=0;
      if(m.finishes)s+=100;
      if(m.capturesN)s+=60*m.capturesN;
      if(m.exit)s+=30;
      const abs=absCell(p.color,m.to,g.mode);
      const was=isTokenInDanger(g,tk),will=m.to<=LY(g.mode).last&&isTokenInDanger(g,tk,m.to)&&!m.capturesN;
      if(m.intoFinal)s+=28;
      if(abs>=0&&isSafeCell(abs,g.mode))s+=18;
      if(was&&!will)s+=34;
      if(will)s-=38;
      s+=m.to*.35+rngFor(seed,k*7+i)*1.5;
      if(s>bs){bs=s;best=m;}
    });
    return best;
  }

  /* ---------- حفظ/استرجاع (JSON بسيط) ---------- */
  function serialize(g){return JSON.parse(JSON.stringify(g));}

  const API={
    COLORS,START,SAFE,TRACK_LEN,LAST_MAIN,FINISH,FINAL_FIRST,TRACK,FINAL_PATH,YARD_ORIGIN,board,
    COLORS6,START6,SAFE6,LAYOUT,LY,
    stateOf,createTokens,createPlayers,initializeGame,
    rollDice,diceFor,rngFor,
    absCell,isSafeCell,cellOf,tokensOnCell,isBlock,
    calculateDestination,checkCapture,captureToken,canMoveToken,getValidMoves,
    nextTurn,startTurn,endTurn,applyRoll,moveToken,checkFinish,checkWin,
    canCaptureWithMove,canFinishWithMove,isTokenInDanger,evaluateMove,chooseAIMove,chooseAIMoveSeeded,
    cur,playerOf,tokenOf,activePlayers,serialize
  };
  root.LudoEngine=API;
  if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
