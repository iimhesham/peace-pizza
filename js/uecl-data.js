/* =========================================================
   UECL — بيانات دوري المؤتمر الأوروبي (تُحمَّل بعد uel-data.js). 5 مواسم: 2021–22 لحد 2025–26. comp:"uecl"
   v:1 = التشكيلة الأساسية اتراجعت على قايمة النهائي الرسمية. v:0 = جاية من الإكسل ومتراجعتش.
   التقييمات: بحكم المؤلف (66–95) وبتعبّر عن مستوى اللاعب في حملة هذه البطولة بس.
   الصيغة: [الاسم, المركز, المركز البديل, التقييم, 1=أساسي/0=دكة]
========================================================= */
(function(g){
"use strict";
var D=g.UCL_DATA;
if(!D&&typeof require==="function"){D=require("./ucl-data.js");require("./ucl-data-bench.js");}
if(!D||!D.seasons)return;
var have={};D.seasons.forEach(function(s){have[s.id]=1;});
function T(id,club,ab,yr,ss,c1,c2,coach,fin,v,pl){
  if(have[id])return;have[id]=1;
  D.seasons.push({id:id,comp:"uecl",v:v,club:club,ab:ab,yr:yr,ss:ss,c:[c1,c2],coach:coach,fin:fin,
    p:pl.map(function(a){return{n:a[0],pos:a[1],alt:a[2]||"",r:a[3],s:a[4]?1:0};})});
}

T("rom-2022-uecl","Roma","ROM",2022,"2021–22","#8e1f2f","#f0bc42","José Mourinho","1–0 Feyenoord",0,[
 ["Rui Patrício","GK","",82,1],["Karsdorp","RB","",76,1],["Smalling","CB","",82,1],["Mancini","CB","",80,1],["Ibañez","CB","LB",78,1],
 ["Cristante","CM","DM",78,1],["Oliveira","CM","",79,1],["Zaniolo","RW","AM",85,1],["Pellegrini","AM","CM",86,1],["Mkhitaryan","LW","AM",84,1],["Abraham","ST","",90,1],
 ["Fuzato","GK","",68,0],["Reynolds","RB","",70,0],["Kumbulla","CB","",74,0],["Viña","LB","LM",75,0],["Diawara","DM","",72,0],["Veretout","CM","",78,0],["Shomurodov","ST","",74,0],["El Shaarawy","LW","",78,0]]);

T("whu-2023-uecl","West Ham United","WHU",2023,"2022–23","#7a263a","#1bb1e7","David Moyes","2–1 Fiorentina",0,[
 ["Areola","GK","",84,1],["Coufal","RB","",80,1],["Aguerd","CB","",80,1],["Zouma","CB","",80,1],["Emerson","LB","",78,1],
 ["Rice","DM","CM",88,1],["Souček","CM","",81,1],["Bowen","RW","",88,1],["Paquetá","AM","",86,1],["Benrahma","LW","",83,1],["Antonio","ST","",80,1],
 ["Fabiański","GK","",72,0],["Kehrer","CB","RB",74,0],["Ogbonna","CB","",74,0],["Cresswell","LB","CB",74,0],["Downes","CM","DM",72,0],["Fornals","AM","",76,0],["Ings","ST","",72,0],["Scamacca","ST","",72,0]]);

T("oly-2024-uecl","Olympiacos","OLY",2024,"2023–24","#e1000f","#ffffff","José Luis Mendilibar","1–0 Fiorentina (a.e.t.)",1,[
 ["Tzolakis","GK","",83,1],["Rodinei","RB","",78,1],["Retsos","CB","",76,1],["D. Carmo","CB","",80,1],["Ortega","LB","",75,1],
 ["Hezze","CM","",78,1],["Iborra","CM","DM",75,1],["Podence","RW","LW",85,1],["Chiquinho","AM","CM",80,1],["Fortounis","AM","LW",84,1],["El Kaabi","ST","",92,1],
 ["Paschalakis","GK","",70,0],["Horta","CM","AM",76,0],["El-Arabi","ST","",72,0],["Alexandropoulos","CM","",70,0],["Quini","LB","",72,0],["Masouras","RW","",74,0],["J. Carvalho","CM","",72,0],["Jovetić","ST","",76,0],["O. Richards","LB","",72,0]]);

T("che-2025-uecl","Chelsea","CHE",2025,"2024–25","#034694","#ffffff","Enzo Maresca","4–1 Real Betis",1,[
 ["Jørgensen","GK","",82,1],["Gusto","RB","",78,1],["Chalobah","CB","",79,1],["Badiashile","CB","",77,1],["Cucurella","LB","",81,1],
 ["Caicedo","DM","CM",86,1],["E. Fernández","CM","",86,1],["Madueke","RW","",85,1],["Palmer","AM","",90,1],["Neto","LW","RW",83,1],["Jackson","ST","",84,1],
 ["R. Sánchez","GK","",76,0],["Bergström","GK","",66,0],["Acheampong","RB","",68,0],["R. James","RB","",80,0],["Colwill","CB","",80,0],["Adarabioyo","CB","",76,0],["Dewsbury-Hall","CM","AM",80,0],["Amougou","CM","",68,0],["Sancho","LW","RW",76,0],["George","RW","",72,0],["Nkunku","AM","ST",82,0],["Guiu","ST","",74,0]]);

T("cry-2026-uecl","Crystal Palace","CRY",2026,"2025–26","#1b458f","#c4122e","Oliver Glasner","1–0 Rayo Vallecano",1,[
 ["Henderson","GK","",88,1],["Canvot","CB","",78,1],["Lacroix","CB","",84,1],["Riad","CB","",77,1],["Muñoz","RB","RM",84,1],
 ["Wharton","CM","",87,1],["Kamada","CM","AM",82,1],["Mitchell","LB","LM",80,1],["Sarr","RW","ST",91,1],["Mateta","ST","",88,1],["Pino","LW","RW",84,1],
 ["Matthews","GK","",66,0],["Benítez","GK","",68,0],["Clyne","RB","",68,0],["Sosa","LB","",72,0],["Richards","CB","",80,0],["Lerma","DM","CM",76,0],["B. Johnson","RW","",78,0],["Hughes","CM","",74,0],["Strand Larsen","ST","",78,0],["Guessand","ST","RW",74,0],["Devenny","CM","",68,0]]);

D.seasons.sort(function(a,b){return a.yr-b.yr;});
})(typeof window!=="undefined"?window:globalThis);
