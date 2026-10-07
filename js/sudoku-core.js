/* =========================================================
   SUDOKU CORE: منطق اللعبة بس (من غير أي واجهة).
   بيشتغل في المتصفح وفي Node (للاختبار).
   كل التوليد بيعتمد على seed ثابت (mulberry32) من غير Math.random،
   عشان نفس الـ seed يطلّع نفس اللغز على أي جهاز (Daily + الأونلاين).
   الشبكة = مصفوفة 81 رقم (0 = فاضي)، الفهرس = صف*9 + عمود.
========================================================= */
(function(root,factory){
  if(typeof module==="object"&&module.exports)module.exports=factory();
  else root.SudokuCore=factory();
})(typeof self!=="undefined"?self:this,function(){
  "use strict";

  var ALL=0x3FE;                       /* بتات 1..9 */
  var BIT=[0,2,4,8,16,32,64,128,256,512];
  var POP=function(m){var c=0;while(m){m&=m-1;c++;}return c;};

  /* ---------- أماكن الصف / العمود / المربع ---------- */
  var ROW=[],COL=[],BOX=[],UNITS=[],PEERS=[];
  (function(){
    var i,j,r,c;
    for(i=0;i<81;i++){r=(i/9)|0;c=i%9;ROW[i]=r;COL[i]=c;BOX[i]=((r/3)|0)*3+((c/3)|0);}
    for(r=0;r<9;r++){var a=[];for(c=0;c<9;c++)a.push(r*9+c);UNITS.push({t:"row",i:r,cells:a});}
    for(c=0;c<9;c++){var b=[];for(r=0;r<9;r++)b.push(r*9+c);UNITS.push({t:"col",i:c,cells:b});}
    for(var k=0;k<9;k++){var d=[],br=((k/3)|0)*3,bc=(k%3)*3;
      for(r=0;r<3;r++)for(c=0;c<3;c++)d.push((br+r)*9+bc+c);UNITS.push({t:"box",i:k,cells:d});}
    for(i=0;i<81;i++){var s={};
      for(j=0;j<81;j++)if(j!==i&&(ROW[j]===ROW[i]||COL[j]===COL[i]||BOX[j]===BOX[i]))s[j]=1;
      PEERS[i]=Object.keys(s).map(Number);}
  })();

  /* ---------- seed + PRNG ---------- */
  function mulberry32(a){
    return function(){
      a=(a+0x6D2B79F5)|0;
      var t=Math.imul(a^(a>>>15),1|a);
      t=(t+Math.imul(t^(t>>>7),61|t))^t;
      return((t^(t>>>14))>>>0)/4294967296;
    };
  }
  function hashStr(s){
    var h=2166136261>>>0,i;s=String(s);
    for(i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function shuffle(a,rng){
    a=a.slice();
    for(var i=a.length-1;i>0;i--){var j=Math.floor(rng()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}
    return a;
  }
  function randSeed(){
    var n=0;
    try{if(typeof crypto!=="undefined"&&crypto.getRandomValues){var u=new Uint32Array(1);crypto.getRandomValues(u);n=u[0];}}catch(e){}
    if(!n)n=(Date.now()^Math.floor(Math.random()*4294967296))>>>0;
    return n>>>0;
  }

  /* ---------- isValid(board,row,col,num) ---------- */
  function isValid(g,r,c,n){
    var i,br=r-r%3,bc=c-c%3;
    for(i=0;i<9;i++){
      if(g[r*9+i]===n&&i!==c)return false;
      if(g[i*9+c]===n&&i!==r)return false;
    }
    for(i=0;i<9;i++){
      var rr=br+((i/3)|0),cc=bc+i%3;
      if(g[rr*9+cc]===n&&(rr!==r||cc!==c))return false;
    }
    return true;
  }

  /* ---------- بتّات الصفوف / الأعمدة / المربعات ---------- */
  function masksOf(g){
    var rows=[0,0,0,0,0,0,0,0,0],cols=rows.slice(),boxes=rows.slice();
    for(var i=0;i<81;i++){var v=g[i];if(v){var b=BIT[v];rows[ROW[i]]|=b;cols[COL[i]]|=b;boxes[BOX[i]]|=b;}}
    return{rows:rows,cols:cols,boxes:boxes};
  }
  /* هل الشبكة الأولية نفسها فيها تكرار؟ */
  function hasConflict(g){
    var rows=[0,0,0,0,0,0,0,0,0],cols=rows.slice(),boxes=rows.slice();
    for(var i=0;i<81;i++){var v=g[i];if(!v)continue;var b=BIT[v];
      if((rows[ROW[i]]&b)||(cols[COL[i]]&b)||(boxes[BOX[i]]&b))return true;
      rows[ROW[i]]|=b;cols[COL[i]]|=b;boxes[BOX[i]]|=b;}
    return false;
  }

  /* ---------- Backtracking Solver (أقل خانات احتمالات أول) ---------- */
  /* بيعدّ الحلول لحد limit، وممكن يسجّل أول حل. rng اختياري بيخلط ترتيب الأرقام (للتوليد). */
  function search(g,limit,rng,keep){
    var m=masksOf(g),rows=m.rows,cols=m.cols,boxes=m.boxes,count=0,first=null;
    function go(){
      var best=-1,bm=0,bc=10,i;
      for(i=0;i<81;i++){
        if(g[i])continue;
        var cand=ALL&~(rows[ROW[i]]|cols[COL[i]]|boxes[BOX[i]]),n=POP(cand);
        if(n===0)return;
        if(n<bc){bc=n;best=i;bm=cand;if(n===1)break;}
      }
      if(best<0){count++;if(keep&&!first)first=g.slice();return;}
      var digs=[],d;for(d=1;d<=9;d++)if(bm&BIT[d])digs.push(d);
      if(rng)digs=shuffle(digs,rng);
      var r=ROW[best],c=COL[best],b=BOX[best];
      for(var k=0;k<digs.length;k++){
        d=digs[k];var bit=BIT[d];
        g[best]=d;rows[r]|=bit;cols[c]|=bit;boxes[b]|=bit;
        go();
        g[best]=0;rows[r]&=~bit;cols[c]&=~bit;boxes[b]&=~bit;
        if(count>=limit)return;
      }
    }
    go();
    return{count:count,first:first};
  }

  /* solveSudoku: بيرجّع الحل (نسخة جديدة) أو null */
  function solveSudoku(grid){
    var g=grid.slice();if(hasConflict(g))return null;
    var r=search(g,1,null,true);return r.first;
  }
  /* countSolutions: بيقف أول ما يلاقي limit حلول (الافتراضي 2) */
  function countSolutions(grid,limit){
    var g=grid.slice();if(hasConflict(g))return 0;
    return search(g,limit||2,null,false).count;
  }
  function hasUniqueSolution(grid){return countSolutions(grid,2)===1;}

  /* generateSolution: شبكة كاملة صحيحة من seed */
  function generateSolution(rng){
    var g=[];for(var i=0;i<81;i++)g.push(0);
    return search(g,1,rng,true).first;
  }

  /* ---------- حل منطقي (للتقييم والـ Hints) ---------- */
  function candidates(g){
    var m=masksOf(g),out=[];
    for(var i=0;i<81;i++)out[i]=g[i]?0:(ALL&~(m.rows[ROW[i]]|m.cols[COL[i]]|m.boxes[BOX[i]]));
    return out;
  }
  /* بيحل بتقنيات Singles بس. level 1 = Naked Singles بس، level 2 = Naked + Hidden Singles */
  function solveBySingles(grid,level){
    var g=grid.slice(),progress=true,usedHidden=false;
    while(progress){
      progress=false;
      var cand=candidates(g),i,u,d;
      for(i=0;i<81;i++){
        if(!g[i]&&POP(cand[i])===1){
          for(d=1;d<=9;d++)if(cand[i]&BIT[d]){g[i]=d;break;}
          progress=true;break;
        }
      }
      if(progress)continue;
      if(level<2)break;
      for(u=0;u<UNITS.length&&!progress;u++){
        var cells=UNITS[u].cells;
        for(d=1;d<=9&&!progress;d++){
          var at=-1,n=0,has=false;
          for(i=0;i<9;i++){var ci=cells[i];if(g[ci]===d){has=true;break;}if(!g[ci]&&(cand[ci]&BIT[d])){n++;at=ci;}}
          if(!has&&n===1){g[at]=d;progress=true;usedHidden=true;}
        }
      }
    }
    var solved=true;for(var k=0;k<81;k++)if(!g[k]){solved=false;break;}
    return{solved:solved,usedHidden:usedHidden};
  }

  /* ---------- المستويات ---------- */
  var LEVELS={
    easy:{clues:[40,45],hints:3,base:1000,par:600,online:5},
    medium:{clues:[30,35],hints:2,base:2000,par:900,online:10},
    hard:{clues:[23,29],hints:1,base:3000,par:1500,online:15}
  };

  /* createPuzzle: بيشيل أرقام من الحل واحد واحد وبيتأكد إن الحل يفضل وحيد */
  function createPuzzle(solution,target,rng){
    var g=solution.slice(),order=shuffle(Array.apply(null,{length:81}).map(Number.call,Number),rng),clues=81;
    for(var k=0;k<81&&clues>target;k++){
      var i=order[k],keep=g[i];g[i]=0;
      if(countSolutions(g,2)===1)clues--;else g[i]=keep;
    }
    return{puzzle:g,clues:clues};
  }

  /* generate: بيطلّع {puzzle,solution,clues,diff,seed} كلهم نصوص 81 رقم. نفس الـ seed = نفس اللغز */
  function generate(diff,seed){
    var L=LEVELS[diff]||LEVELS.easy;diff=LEVELS[diff]?diff:"easy";
    if(seed==null)seed=randSeed();seed=seed>>>0;
    var rng=mulberry32(seed),best=null,last=null;
    for(var attempt=0;attempt<14;attempt++){
      var sol=generateSolution(rng),target=L.clues[0]+Math.floor(rng()*(L.clues[1]-L.clues[0]+1));
      var p=createPuzzle(sol,target,rng);
      last={puzzle:p.puzzle,solution:sol,clues:p.clues,ok:false};
      if(p.clues>L.clues[1]+(attempt>9?2:0))continue;            /* مش نازل للحد المطلوب: جرّب حل تاني */
      var r1=solveBySingles(p.puzzle,1),r2=solveBySingles(p.puzzle,2),ok;
      if(diff==="easy")ok=r1.solved;                            /* Easy: Naked Singles بس */
      else if(diff==="medium")ok=r2.solved&&!r1.solved;         /* Medium: لازم Hidden Single */
      else ok=!r2.solved;                                       /* Hard: أصعب من Singles */
      var cur={puzzle:p.puzzle,solution:sol,clues:p.clues};
      if(!best||(ok&&!best.ok))best=cur,best.ok=ok;
      if(ok)break;
      if(attempt>=5&&best.ok===false&&p.clues<=L.clues[1])break;  /* كفاية محاولات: خُد أقرب واحد */
    }
    if(!best)best=last;
    return{puzzle:toStr(best.puzzle),solution:toStr(best.solution),clues:best.clues,diff:diff,seed:seed};
  }

  /* ---------- Daily: تاريخ اليوم بتوقيت القاهرة ---------- */
  function dailyKey(date){
    date=date||new Date();
    try{
      var p=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
      if(/^\d{4}-\d{2}-\d{2}$/.test(p))return p;
    }catch(e){}
    var m=date.getMonth()+1,d=date.getDate();
    return date.getFullYear()+"-"+(m<10?"0":"")+m+"-"+(d<10?"0":"")+d;
  }
  function dailySeed(key){return hashStr("peace-pizza-sudoku-"+key);}

  /* ---------- تحويلات ---------- */
  function toStr(g){return g.join("");}
  function fromStr(s){var g=[];for(var i=0;i<81;i++)g.push(+s.charAt(i)||0);return g;}

  /* ---------- فحص الحركة والفوز ---------- */
  function checkMove(solution,i,n){return solution[i]===n;}
  function conflicts(g){                         /* الخانات اللي رقمها متكرر في صف/عمود/مربع */
    var bad={},u,d,i;
    for(u=0;u<UNITS.length;u++){
      var seen={};
      for(i=0;i<9;i++){var c=UNITS[u].cells[i],v=g[c];if(!v)continue;(seen[v]=seen[v]||[]).push(c);}
      for(d in seen)if(seen[d].length>1)seen[d].forEach(function(c){bad[c]=1;});
    }
    return bad;
  }
  function isComplete(g){for(var i=0;i<81;i++)if(!g[i])return false;return true;}
  function checkWin(g,solution){
    for(var i=0;i<81;i++)if(g[i]!==solution[i])return false;
    return true;
  }
  function validGrid(g){                          /* شبكة كاملة وسليمة؟ */
    if(!isComplete(g))return false;
    return Object.keys(conflicts(g)).length===0;
  }

  /* ---------- Hints منطقية: بتدّي معلومة من غير ما تكشف الرقم (إلا في Hidden Single) ---------- */
  function logicalHint(g,solution){
    var i,u,d;
    for(i=0;i<81;i++)if(g[i]&&g[i]!==solution[i])return{t:"mistake",cell:i};
    var cand=candidates(g);
    for(u=0;u<UNITS.length;u++){
      var empty=UNITS[u].cells.filter(function(c){return!g[c];});
      if(empty.length===1)return{t:"last",unit:UNITS[u].t,index:UNITS[u].i,cell:empty[0],cells:UNITS[u].cells};
    }
    for(i=0;i<81;i++)if(!g[i]&&POP(cand[i])===1)return{t:"naked",cell:i};
    for(u=0;u<UNITS.length;u++){
      var cells=UNITS[u].cells;
      for(d=1;d<=9;d++){
        var at=-1,n=0,has=false,k;
        for(k=0;k<9;k++){var c=cells[k];if(g[c]===d){has=true;break;}if(!g[c]&&(cand[c]&BIT[d])){n++;at=c;}}
        if(!has&&n===1)return{t:"hidden",unit:UNITS[u].t,index:UNITS[u].i,n:d,cell:at,cells:cells};
      }
    }
    var best=-1,bc=10;
    for(i=0;i<81;i++)if(!g[i]){var pc=POP(cand[i]);if(pc<bc){bc=pc;best=i;}}
    if(best<0)return null;
    var list=[];for(d=1;d<=9;d++)if(cand[best]&BIT[d])list.push(d);
    return{t:"cands",cell:best,cands:list};
  }
  /* خانة تتكشف (Reveal): الخانة المختارة لو فاضية، وإلا أسهل خانة */
  function pickReveal(g,solution,sel){
    if(sel!=null&&sel>=0&&!g[sel])return sel;
    var cand=candidates(g),best=-1,bc=10,i;
    for(i=0;i<81;i++)if(!g[i]){var pc=POP(cand[i]);if(pc<bc){bc=pc;best=i;}}
    return best;
  }

  /* ---------- النقاط ---------- */
  function calcScore(o){
    /* o = {diff, seconds, hints, errors, timed, errorsOn} */
    var L=LEVELS[o.diff]||LEVELS.easy,s=L.base;
    if(o.timed)s+=Math.max(0,Math.round((L.par-o.seconds)*2));
    s-=(o.hints||0)*150;
    if(o.errorsOn)s-=(o.errors||0)*100;
    if(!o.hints)s+=200;
    if(o.errorsOn&&!o.errors)s+=300;
    return Math.max(0,s);
  }

  /* نقاط الأونلاين حسب الصعوبة: 5 / 10 / 15 */
  function onlinePoints(diff){return(LEVELS[diff]||LEVELS.easy).online;}

  return{
    LEVELS:LEVELS,ROW:ROW,COL:COL,BOX:BOX,UNITS:UNITS,PEERS:PEERS,BIT:BIT,
    mulberry32:mulberry32,hashStr:hashStr,randSeed:randSeed,
    isValid:isValid,solveSudoku:solveSudoku,countSolutions:countSolutions,hasUniqueSolution:hasUniqueSolution,
    generateSolution:generateSolution,createPuzzle:createPuzzle,generate:generate,
    solveBySingles:solveBySingles,candidates:candidates,
    dailyKey:dailyKey,dailySeed:dailySeed,toStr:toStr,fromStr:fromStr,
    checkMove:checkMove,conflicts:conflicts,isComplete:isComplete,checkWin:checkWin,validGrid:validGrid,
    logicalHint:logicalHint,pickReveal:pickReveal,calcScore:calcScore,onlinePoints:onlinePoints
  };
});
