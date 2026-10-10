/* =========================================================
   TAWLA ENGINE — الطاولة المصرية (الفورة من 31)
   قواعد بس. مفيش DOM هنا، فتتختبر لوحدها وتتشارك أونلاين بعدين.
   المرجع الوحيد للقواعد: ملف ساهر (tawla31.Saher).

   اللوحة: 24 خانة بس. كل لاعب بيعدّ خاناته من ناحيته (q = 1..24):
     q=1   = خانة البداية (الستاك: 15 قشاطة)
     q=24  = آخر خانة في مساره
     19..24 = الـHOME (آخر ربع) — جوه اللوحة نفسها مش بره
   خانة الأبيض k هي نفسها خانة الأسود (25-k): الاتنين على نفس الخانات
   ومتعاكسين. ستاك الخصم قاعد جوه الـHOME بتاعك (خانة 24) لحد ما يتحرك.

   الحالة: { s:[أبيض, أسود], turn:0|1 }
   كل لاعب: { c:[عدد القشاطات في كل خانة 1..24], off, unlocked }
   (off = اللي خرج من اللوحة · OUT = وجهة الإخراج)
========================================================= */
(function(root){
  "use strict";

  var PIECES=15, TRACK=24, OUT=25, WIN_AT=31;
  var HOME_START=19;      /* أول خانة في الـHOME (آخر ربع) */
  var UNLOCK_AT=19;       /* القشاطة الأولى لازم توصل الـHOME (18 خطوة) عشان الباقي يتفتح */

  function newSide(){
    var c=[];for(var i=0;i<=TRACK;i++)c.push(0);
    c[1]=PIECES;
    return {c:c,off:0,unlocked:false};
  }
  function newGame(){return {s:[newSide(),newSide()],turn:0};}
  function cloneSide(x){return {c:x.c.slice(),off:x.off,unlocked:x.unlocked};}
  function clone(g){return {s:[cloneSide(g.s[0]),cloneSide(g.s[1])],turn:g.turn};}

  /* الإخراج مسموح بس لما كل القشاطات اللي لسه على اللوحة تبقى في الـHOME */
  function canBearOff(side){
    for(var i=1;i<HOME_START;i++)if(side.c[i]>0)return false;
    return true;
  }
  /* مفيش قشاطة ورا q جوه الـHOME (أبعد عن الخروج) */
  function noHigher(side,q){
    for(var j=HOME_START;j<q;j++)if(side.c[j]>0)return false;
    return true;
  }
  function inHome(side){var n=0;for(var i=HOME_START;i<=TRACK;i++)n+=side.c[i];return n;}
  function onBoard(side){var n=0;for(var i=1;i<=TRACK;i++)n+=side.c[i];return n;}

  /* الستاك مقفول لو القشاطة الأولى لسه ما فتحتش، وفيه قشاطة تانية بره الستاك */
  function stackLocked(side){
    return !side.unlocked && (onBoard(side)-side.c[1])>0;
  }
  /* الخانة q (بإحداثياتي) فاضية من قشاط الخصم؟ */
  function canLand(g,who,q){
    return q>=1&&q<=TRACK&&g.s[1-who].c[25-q]===0;
  }

  function die(rng){return 1+Math.floor((rng||Math.random)()*6);}
  function rollDice(rng){
    var a=die(rng),b=die(rng);
    return {a:a,b:b,list:a===b?[a,a,a,a]:[a,b]};
  }

  /* نرد ثابت من (seed, رقم الجيم, رقم الرمية): كل الأجهزة بتطلع بنفس الرمية، فمحدش يعيد الرمي — الأونلاين بيستخدمه */
  function mix(a,b,c){
    var x=(a|0)^Math.imul((b|0)+0x9e3779b9|0,0x85ebca6b)^Math.imul((c|0)+0x7f4a7c15|0,0xc2b2ae35);
    x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;
    return x>>>0;
  }
  function seedDice(seed,gid,k){
    var a=1+mix(seed,gid,2*k)%6,b=1+mix(seed,gid,2*k+1)%6;
    return {a:a,b:b,list:a===b?[a,a,a,a]:[a,b]};
  }

  /* كل الحركات القانونية بنرد واحد */
  function legalMoves(g,who,d){
    var me=g.s[who],c=me.c,res=[],q,t;
    var locked=stackLocked(me),bear=canBearOff(me);
    for(q=1;q<=TRACK;q++){
      if(!c[q])continue;
      if(q===1&&locked)continue;
      t=q+d;
      if(t<=TRACK){
        if(canLand(g,who,t))res.push({from:q,to:t,die:d});
      }else if(bear){
        var dist=TRACK+1-q;
        if(d===dist||(d>dist&&noHigher(me,q)))res.push({from:q,to:OUT,die:d});
      }
    }
    return res;
  }

  /* حركة مدموجة: النردين مع بعض على نفس القشاطة (مش في الدبل) —
     لازم الخانة الأخيرة تكون مفتوحة، ولازم واحدة من الخانتين اللي في النص مفتوحة */
  function combinedMoves(g,who,a,b){
    var me=g.s[who],c=me.c,res=[],q,t,S=a+b;
    var locked=stackLocked(me),bear=canBearOff(me);
    for(q=1;q<=TRACK;q++){
      if(!c[q])continue;
      if(q===1&&locked)continue;
      var m1=q+a,m2=q+b;
      var mid=(m1<=TRACK&&canLand(g,who,m1))||(m2<=TRACK&&canLand(g,who,m2));
      if(!mid)continue;
      t=q+S;
      if(t<=TRACK){
        if(canLand(g,who,t))res.push({from:q,to:t,die:S,combined:true,die1:a,die2:b});
      }else if(bear){
        var dist=TRACK+1-q;
        if(S===dist||(S>dist&&noHigher(me,q))){
          /* لو نرد واحد لوحده كان يخرجها، مفيش داعي تحرق النردين */
          var single=(a===dist||(a>dist&&noHigher(me,q)))||(b===dist||(b>dist&&noHigher(me,q)));
          if(!single)res.push({from:q,to:OUT,die:S,combined:true,die1:a,die2:b});
        }
      }
    }
    return res;
  }

  /* النردين اللي حركة بتستهلكهم */
  function diceOf(m){return m.combined?[m.die1,m.die2]:[m.die];}

  /* كل الحركات المتاحة بالنرد المتبقي (rem): فردي + مدموج (لو النردين لسه متاخدوش ومختلفين) */
  function movesFor(g,who,rem){
    var seen={},res=[],i,j,ds=[];
    for(i=0;i<rem.length;i++)if(!seen[rem[i]]){seen[rem[i]]=1;ds.push(rem[i]);}
    ds.sort(function(x,y){return x-y;});
    for(i=0;i<ds.length;i++){
      var m=legalMoves(g,who,ds[i]);
      for(j=0;j<m.length;j++)res.push(m[j]);
    }
    if(rem.length===2&&rem[0]!==rem[1]){
      var cm=combinedMoves(g,who,rem[0],rem[1]);
      for(j=0;j<cm.length;j++)res.push(cm[j]);
    }
    return res;
  }
  function hasMove(g,who,rem){return movesFor(g,who,rem).length>0;}

  function applyMove(g,who,m){
    var me=g.s[who];
    me.c[m.from]--;
    if(m.to===OUT)me.off++;
    else{
      me.c[m.to]++;
      if(m.to>=UNLOCK_AT)me.unlocked=true;
    }
    return g;
  }
  function winner(g){
    if(g.s[0].off>=PIECES)return 0;
    if(g.s[1].off>=PIECES)return 1;
    return -1;
  }
  /* نقاط الجيم = 15 - اللي الخصم أخرجه */
  function gamePoints(g,w){return PIECES-g.s[1-w].off;}

  function removeDie(list,d){
    var r=list.slice(),i=r.indexOf(d);
    if(i>-1)r.splice(i,1);
    return r;
  }
  /* شيل من النرد المتبقي اللي حركة استهلكته */
  function consume(list,m){
    var r=list,ds=diceOf(m);
    for(var i=0;i<ds.length;i++)r=removeDie(r,ds[i]);
    return r;
  }

  function key(g){return g.s[0].c.join(",")+"|"+g.s[1].c.join(",")+"|"+g.s[0].off+","+g.s[1].off+"|"+(g.s[0].unlocked?1:0)+(g.s[1].unlocked?1:0);}

  /* كل الأدوار الممكنة: [{g,moves}] — بتتستخدم في الكمبيوتر */
  function enumerateTurns(g0,who,dice){
    var out=[],seen={},cap=4000;
    (function rec(g,rem,moves){
      if(out.length>=cap)return;
      var ms=(winner(g)>-1||!rem.length)?[]:movesFor(g,who,rem);
      if(!ms.length){
        var k=key(g);
        if(!seen[k]){seen[k]=1;out.push({g:g,moves:moves});}
        return;
      }
      for(var j=0;j<ms.length;j++){
        var g2=applyMove(clone(g),who,ms[j]);
        var r2=consume(rem,ms[j]);
        var vk=key(g2)+"#"+r2.join("");
        if(seen[vk])continue;seen[vk]=1;
        rec(g2,r2,moves.concat([ms[j]]));
      }
    })(g0,dice.slice(),[]);
    return out;
  }

  /* ---------- تقييم للكمبيوتر ---------- */
  function pips(side){
    var s=0;
    for(var q=1;q<=TRACK;q++)s+=side.c[q]*(TRACK+1-q);
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
        for(o=Math.max(1,tgt-6);o<tgt;o++)if(op.c[o]>0)behind++;
        sc+=behind;
      }else run=0;
    }
    var low=25-(bestStart+best-1),behindRun=0;
    for(o=Math.max(1,low-6);o<low;o++)if(op.c[o]>0)behindRun++;
    return {spread:sc,run:best,runThreat:behindRun};
  }
  function evaluate(g,who){
    var me=g.s[who],op=g.s[1-who];
    var b=blockScore(me,op);
    var v=(pips(op)-pips(me));
    v+=7*(me.off-op.off);
    v+=2.2*b.spread;
    if(b.run>=3&&b.runThreat>0)v+=b.run*b.run*1.6;
    if(me.unlocked)v+=6;
    return v;
  }

  root.TawlaEngine={
    PIECES:PIECES,TRACK:TRACK,OUT:OUT,WIN_AT:WIN_AT,HOME_START:HOME_START,UNLOCK_AT:UNLOCK_AT,
    newGame:newGame,clone:clone,rollDice:rollDice,seedDice:seedDice,
    legalMoves:legalMoves,combinedMoves:combinedMoves,movesFor:movesFor,hasMove:hasMove,
    applyMove:applyMove,diceOf:diceOf,consume:consume,
    winner:winner,gamePoints:gamePoints,removeDie:removeDie,
    enumerateTurns:enumerateTurns,evaluate:evaluate,
    canBearOff:canBearOff,stackLocked:stackLocked,onBoard:onBoard,inHome:inHome,pips:pips
  };
  if(typeof module!=="undefined"&&module.exports)module.exports=root.TawlaEngine;
})(typeof window!=="undefined"?window:globalThis);
