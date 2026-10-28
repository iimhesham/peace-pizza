/* =========================================================
   UCL — دمج بيانات وصيف أبطال أوروبا (ucl-runners-data.js) في UCL_DATA.
   بيتحمّل بعد ucl-data-bench.js. كل موسم وصيف بياخد ru:1 و comp:"ucl"،
   فبيدخل في الدرافت والخصوم زي أي موسم، ومعلّم "FINALIST" في كارت السحب.
   لو عايز تشيله: شيل سطري الـ script بتوعه من index.html.
========================================================= */
(function(g){
"use strict";
var D=g.UCL_DATA,R=g.UCL_RUNNERS_DATA;
if(!D&&typeof require==="function"){D=require("./ucl-data.js");require("./ucl-data-bench.js");}
if(!R&&typeof require==="function"){R=require("./ucl-runners-data.js");}
if(!D||!D.seasons||!R||!R.seasons||D.runners)return;
var have={};D.seasons.forEach(function(s){have[s.id]=1;});
R.seasons.forEach(function(s){
  if(have[s.id])return;have[s.id]=1;
  D.seasons.push({id:s.id,comp:"ucl",ru:1,club:s.club,ab:s.ab,yr:s.yr,ss:s.ss,c:s.c,coach:s.coach,fin:s.fin,p:s.p});
});
D.seasons.sort(function(a,b){return a.yr-b.yr;});
D.runners=true;
})(typeof window!=="undefined"?window:globalThis);
