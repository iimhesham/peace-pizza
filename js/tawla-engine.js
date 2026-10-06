/* =========================================================
   TAWLA ENGINE — الطاولة المصرية (الفورة من 31)
   قواعد بس. مفيش DOM هنا، فتتختبر لوحدها وتتشارك أونلاين بعدين.

   المواضع (q) لكل لاعب:
     0        = لسه ما بدأش (START)
     1..24    = المسار الرئيسي (TRACK) — كل لاعب يمشي في اتجاه عكس التاني على نفس
                الـ24 خانة: خانة الأبيض k هي نفسها خانة الأسود (25-k)
     25..30   = منطقة التجميع (HOME) — الخانة = 31 - q
                (q=25 ← خانة 6 … q=30 ← خانة 1)
     31 (OUT) = اتاكلت/خرجت نهائيًا

   الحالة: { s:[أبيض, أسود], turn:0|1 }
   كل لاعب: { c:[عدد القشاطات في كل موضع 0..31], eaten, unlocked }
========================================================= */
(function(root){
  "use strict";

  var PIECES=15, TRACK=24, OUT=31, WIN_AT=31;
  /* لو true: ما ينفعش تاكل قشاطة غير لما كل قشاطاتك تبقى في التجميع (زي الطاولة العادية).
     لو عايزها تتاكل في أي وقت بعد دخول أول قشاطة، خليها false. */
  var REQUIRE_ALL_HOME=true;

  function newSide(){
    var c=[];for(var i=0;i<=OUT;i++)c.push(0);
    c[0]=PIECES;
    return {c:c,eaten:0,unlocked:false};
  }
  function newGame(){return {s:[newSide(),newSide()],turn:0};}
  function cloneSide(x){return {c:x.c.slice(),eaten:x.eaten,unlocked:x.unlocked};}
  function clone(g){return {s:[cloneSide(g.s[0]),cloneSide(g.s[1])],turn:g.turn};}

  function allHome(side){
    if(side.c[0]>0)return false;
    for(var i=1;i<=TRACK;i++)if(side.c[i]>0)return false;
    return true;
  }
  function onTrack(side){var n=0;for(var i=1;i<=TRACK;i++)n+=side.c[i];return n;}
  function inHome(side){var n=0;for(var i=25;i<=30;i++)n+=side.c[i];return n;}

  function die(rng){return 1+Math.floor((rng||Math.random)()*6);}
  function rollDice(rng){
    var a=die(rng),b=die(rng);
    return {a:a,b:b,list:a===b?[a,a,a,a]:[a,b]};
  }

  /* كل الحركات القانونية بنرد واحد */
  function legalMoves(g,who,d){
    var me=g.s[who],op=g.s[1-who],c=me.c,res=[],i,q,t;
    var home=REQUIRE_ALL_HOME?allHome(me):true;

    /* قبل فتح القشاطات: قشاطة واحدة بس تتحرك */
    var only=-1;
    if(!me.unlocked){
      for(i=1;i<=TRACK;i++)if(c[i]>0)only=i;
      if(only<0)only=0;
    }

    /* أعلى خانة تجميع فيها قشاطة (أصغر q) */
    var hi=-1;
    for(i=25;i<=30;i++)if(c[i]>0){hi=i;break;}

    for(q=0;q<=30;q++){
      if(!c[q])continue;
      if(only>=0&&q!==only)continue;

      if(q<=TRACK){
        t=q+d;
        if(t<=TRACK&&op.c[25-t]>0)continue;        /* حاجز: قشاطة الخصم في نفس الخانة الفعلية */
        res.push({from:q,to:t,die:d});            /* t>24 ← دخول التجميع */
      }else{
        var slot=31-q;
        if(slot>d){
          if(home&&c[31-d]>0)continue;            /* أولوية رقم النرد: القشاطة اللي على الرقم بتتاكل الأول */
          res.push({from:q,to:q+d,die:d});
        }else if(slot===d){
          if(home)res.push({from:q,to:OUT,die:d});
        }else{
          if(home&&q===hi)res.push({from:q,to:OUT,die:d});   /* النرد أكبر من أعلى خانة: بتتاكل الأعلى */
        }
      }
    }
    return res;
  }

  function movesFor(g,who,dice){
    var seen={},res=[];
    for(var i=0;i<dice.length;i++){
      var d=dice[i];
      if(seen[d])continue;seen[d]=1;
      var m=legalMoves(g,who,d);
      for(var j=0;j<m.length;j++)res.push(m[j]);
    }
    return res;
  }
  function hasMove(g,who,dice){return movesFor(g,who,dice).length>0;}

  function applyMove(g,who,m){
    var me=g.s[who];
    me.c[m.from]--;
    if(m.to===OUT)me.eaten++;
    else{me.c[m.to]++;if(m.to>=25)me.unlocked=true;}
    return g;
  }
  function winner(g){
    if(g.s[0].eaten>=PIECES)return 0;
    if(g.s[1].eaten>=PIECES)return 1;
    return -1;
  }
  /* نقاط الجيم = 15 - اللي الخصم أكلهم */
  function gamePoints(g,w){return PIECES-g.s[1-w].eaten;}

  function removeDie(list,d){
    var r=list.slice(),i=r.indexOf(d);
    if(i>-1)r.splice(i,1);
    return r;
  }

  function key(g){return g.s[0].c.join(",")+"|"+g.s[1].c.join(",")+"|"+g.s[0].eaten+","+g.s[1].eaten+"|"+(g.s[0].unlocked?1:0)+(g.s[1].unlocked?1:0);}

  /* كل الأدوار الممكنة: [{g,moves}] — بتتستخدم في الكمبيوتر */
  function enumerateTurns(g0,who,dice){
    var out=[],seen={},cap=4000;
    (function rec(g,rem,moves){
      if(out.length>=cap)return;
      if(winner(g)>-1||!rem.length||!hasMove(g,who,rem)){
        var k=key(g);
        if(!seen[k]){seen[k]=1;out.push({g:g,moves:moves});}
        return;
      }
      var tried={};
      for(var i=0;i<rem.length;i++){
        var d=rem[i];
        if(tried[d])continue;tried[d]=1;
        var ms=legalMoves(g,who,d);
        for(var j=0;j<ms.length;j++){
          var g2=applyMove(clone(g),who,ms[j]);
          var vk=key(g2)+"#"+removeDie(rem,d).join("");
          if(seen[vk])continue;seen[vk]=1;
          rec(g2,removeDie(rem,d),moves.concat([ms[j]]));
        }
      }
    })(g0,dice.slice(),[]);
    return out;
  }

  /* ---------- تقييم للكمبيوتر ---------- */
  function pips(side){
    var s=0;
    for(var q=0;q<=30;q++)s+=side.c[q]*(31-q);
    return s;
  }
  function blockScore(me,op){
    /* خانتي t بتمنع قشاطات الخصم اللي على o (بإحداثياته) لو o+d = 25-t */
    var sc=0,run=0,best=0,bestStart=0,start=0,t,o;
    for(t=1;t<=TRACK;t++){
      if(me.c[t]>0){
        if(!run)start=t;
        run++;
        if(run>best){best=run;bestStart=start;}
        var tgt=25-t,behind=0;
        for(o=Math.max(0,tgt-6);o<tgt;o++)if(op.c[o]>0)behind++;
        sc+=behind;
      }else run=0;
    }
    var low=25-(bestStart+best-1),behindRun=0;
    for(o=Math.max(0,low-6);o<low;o++)if(op.c[o]>0)behindRun++;
    return {spread:sc,run:best,runThreat:behindRun};
  }
  function evaluate(g,who){
    var me=g.s[who],op=g.s[1-who];
    var b=blockScore(me,op);
    var v=(pips(op)-pips(me));
    v+=7*(me.eaten-op.eaten);
    v+=2.2*b.spread;
    if(b.run>=3&&b.runThreat>0)v+=b.run*b.run*1.6;
    if(me.unlocked)v+=6;
    return v;
  }

  root.TawlaEngine={
    PIECES:PIECES,TRACK:TRACK,OUT:OUT,WIN_AT:WIN_AT,
    newGame:newGame,clone:clone,rollDice:rollDice,
    legalMoves:legalMoves,movesFor:movesFor,hasMove:hasMove,applyMove:applyMove,
    winner:winner,gamePoints:gamePoints,removeDie:removeDie,
    enumerateTurns:enumerateTurns,evaluate:evaluate,
    allHome:allHome,onTrack:onTrack,inHome:inHome,pips:pips
  };
  if(typeof module!=="undefined"&&module.exports)module.exports=root.TawlaEngine;
})(typeof window!=="undefined"?window:globalThis);
