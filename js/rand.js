/* =========================================================
   Secure random (PPR) — المصدر الوحيد للعشوائية في النرد والورق.
   بيستخدم crypto.getRandomValues (مش Math.random) وبيتجنب الـ modulo bias
   بطريقة rejection sampling، فكل رقم/كارت احتماله متساوي فعلًا.
   لو المتصفح مفيهوش crypto بيرجع لـ Math.random (نادر جدًا).
========================================================= */
(function(g){
"use strict";
var C=g.crypto||g.msCrypto,SEC=!!(C&&C.getRandomValues),B32=4294967296;
function u32(){
  if(SEC){var a=new Uint32Array(1);C.getRandomValues(a);return a[0];}
  return Math.floor(Math.random()*B32)>>>0;
}
/* رقم صحيح من 0 لـ n-1 بتوزيع منتظم */
function int(n){
  n=Math.floor(n);if(!(n>1))return 0;
  if(!SEC)return Math.floor(Math.random()*n);
  var lim=Math.floor(B32/n)*n,x;
  do{x=u32();}while(x>=lim);
  return x%n;
}
/* رقم عشري في [0,1) بدقة 53 bit */
function float(){
  if(!SEC)return Math.random();
  var a=new Uint32Array(2);C.getRandomValues(a);
  return((a[0]>>>5)*67108864+(a[1]>>>6))/9007199254740992;
}
function die(){return 1+int(6);}
/* Fisher–Yates صح (بيرجع نسخة جديدة) */
function shuffle(arr){
  var a=Array.prototype.slice.call(arr),i,j,t;
  for(i=a.length-1;i>0;i--){j=int(i+1);t=a[i];a[i]=a[j];a[j]=t;}
  return a;
}
function pick(a){return a[int(a.length)];}
function seed31(){return int(2147483647);}
g.PPR={secure:SEC,u32:u32,int:int,float:float,die:die,shuffle:shuffle,pick:pick,seed31:seed31};
})(typeof window!=="undefined"?window:globalThis);
