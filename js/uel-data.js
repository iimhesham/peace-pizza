/* =========================================================
   UEL — بيانات اليوروبا ليج / كأس الاتحاد الأوروبي (تُحمَّل بعد ucl-data-bench.js).
   27 موسم: 1999–00 لحد 2025–26. comp:"uel"
   التشكيلات الأساسية (s=1) اتراجعت على قوايم النهائي الرسمية (UEFA / ويكيبيديا / تقارير المباراة)،
   وفي مواضع كتير اتصحّحت عن ملف الإكسل. الموسم اللي عليه v:0 جاي من الإكسل ومتراجعش بعد.
   التقييمات: بحكم المؤلف، بمقياس 66–95، وبتعبّر عن مستوى اللاعب في حملة هذه البطولة بس
   (مش مستواه في مسيرته). مفيش مصدر تقييم رسمي — لازم تتعاير بعد التجربة.
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
  D.seasons.push({id:id,comp:"uel",v:v,club:club,ab:ab,yr:yr,ss:ss,c:[c1,c2],coach:coach,fin:fin,
    p:pl.map(function(a){return{n:a[0],pos:a[1],alt:a[2]||"",r:a[3],s:a[4]?1:0};})});
}

T("gal-2000-uel","Galatasaray","GAL",2000,"1999–00","#e8112d","#ffb81c","Fatih Terim","0–0 Arsenal (4–1 pens)",0,[
 ["Taffarel","GK","",88,1],["Capone","RB","",76,1],["Popescu","CB","",82,1],["Bülent","CB","",78,1],["Ergün","LB","",76,1],
 ["Suat","DM","",75,1],["Okan","RM","CM",79,1],["Davala","LM","",80,1],["Hagi","AM","",91,1],["Arif","ST","",78,1],["Şükür","ST","",86,1],
 ["Kerem","GK","",68,0],["Akyel","RB","CB",70,0],["Ünsal","CB","RB",72,0],["Şaş","LW","LM",78,0],["Mixirica","ST","",70,0]]);

T("liv-2001-uel","Liverpool","LIV",2001,"2000–01","#c8102e","#f6eb61","Gérard Houllier","5–4 Alavés (golden goal)",1,[
 ["Westerveld","GK","",76,1],["Babbel","RB","",82,1],["Henchoz","CB","",80,1],["Hyypiä","CB","",85,1],["Carragher","LB","CB",80,1],
 ["Hamann","DM","CM",81,1],["McAllister","CM","",87,1],["Gerrard","CM","RM",86,1],["Murphy","LM","CM",78,1],["Heskey","ST","",80,1],["Owen","ST","",88,1],
 ["Šmicer","RW","AM",80,0],["Fowler","ST","",84,0],["Berger","LM","CM",77,0]]);

T("fey-2002-uel","Feyenoord","FEY",2002,"2001–02","#e30613","#ffffff","Bert van Marwijk","3–2 Borussia Dortmund",1,[
 ["Zoetebier","GK","",78,1],["Gyan","RB","",76,1],["Rzasa","CB","",77,1],["Van Wonderen","CB","",76,1],["Bosvelt","DM","CM",81,1],
 ["Paauwe","CM","LB",78,1],["Ono","AM","CM",82,1],["B. Kalou","RW","",79,1],["Tomasson","ST","AM",85,1],["Van Hooijdonk","ST","",88,1],["Van Persie","LW","ST",77,1],
 ["Timmer","GK","",68,0],["Leonardo","LW","",74,0],["Elmander","ST","",72,0],["De Haan","CM","",70,0]]);

T("por-2003-uel","FC Porto","POR",2003,"2002–03","#003d99","#ffffff","José Mourinho","3–2 Celtic (a.e.t.)",1,[
 ["Vítor Baía","GK","",84,1],["Paulo Ferreira","RB","",81,1],["Jorge Costa","CB","",80,1],["R. Carvalho","CB","",83,1],["Nuno Valente","LB","",80,1],
 ["Costinha","DM","",80,1],["Maniche","CM","",82,1],["Alenichev","LM","AM",82,1],["Deco","AM","",89,1],["Capucho","RW","RM",77,1],["Derlei","ST","",87,1],
 ["R. Costa","CB","",74,0],["Pedro Emanuel","CB","",76,0],["Marco Ferreira","ST","",72,0],["Jankauskas","ST","",76,0]]);

T("val-2004-uel","Valencia","VAL",2004,"2003–04","#f4f4f4","#ee7f00","Rafa Benítez","2–0 Olympique de Marseille",1,[
 ["Cañizares","GK","",87,1],["Curro Torres","RB","",78,1],["Ayala","CB","",87,1],["Marchena","CB","",82,1],["Carboni","LB","",81,1],
 ["Albelda","DM","",84,1],["Baraja","CM","",85,1],["Rufete","RM","CM",77,1],["Angulo","AM","RW",80,1],["Vicente","LM","LW",87,1],["Mista","ST","",85,1],
 ["Aimar","AM","",84,0],["Sissoko","DM","CM",74,0],["Pellegrino","CB","DM",74,0],["Rangel","GK","",66,0]]);

T("csk-2005-uel","CSKA Moscow","CSK",2005,"2004–05","#d3112e","#1b3a8c","Valery Gazzaev","3–1 Sporting CP",1,[
 ["Akinfeev","GK","",83,1],["A. Berezutski","RB","CB",79,1],["V. Berezutski","CB","",79,1],["Ignashevich","CB","",81,1],["Zhirkov","LB","LM",80,1],
 ["Rahimić","DM","CM",79,1],["Aldonin","CM","",76,1],["Odiah","RM","RW",76,1],["D. Carvalho","AM","LW",87,1],["Olić","ST","RW",80,1],["Vágner Love","ST","",85,1],
 ["Gusev","CM","",70,0],["Šemberas","CM","",70,0],["Krasić","RW","",72,0]]);

T("sev-2006-uel","Sevilla","SEV",2006,"2005–06","#f4f4f4","#d4001f","Juande Ramos","4–0 Middlesbrough",1,[
 ["Palop","GK","",82,1],["Alves","RB","",88,1],["Javi Navarro","CB","",80,1],["Escudé","CB","",79,1],["Castedo","LB","",74,1],
 ["Martí","DM","CM",76,1],["Maresca","CM","AM",87,1],["J. Navas","RM","RW",82,1],["Adriano","LM","LB",80,1],["Saviola","ST","AM",82,1],["Luís Fabiano","ST","",88,1],
 ["Kanouté","ST","",86,0],["Renato","DM","CM",76,0],["Puerta","LB","LM",76,0]]);

T("sev-2007-uel","Sevilla","SEV",2007,"2006–07","#f4f4f4","#d4001f","Juande Ramos","2–2 Espanyol (3–1 pens)",1,[
 ["Palop","GK","",89,1],["Alves","RB","",88,1],["Javi Navarro","CB","",79,1],["Dragutinović","CB","",80,1],["Puerta","LB","LM",78,1],
 ["Martí","DM","CM",76,1],["Poulsen","DM","CM",79,1],["Maresca","CM","AM",80,1],["Adriano","LM","LB",81,1],["Kanouté","ST","",89,1],["Luís Fabiano","ST","",85,1],
 ["J. Navas","RW","RM",83,0],["Renato","DM","CM",75,0],["Kerzhakov","ST","",74,0]]);

T("zen-2008-uel","Zenit Saint Petersburg","ZEN",2008,"2007–08","#0b9fdb","#ffffff","Dick Advocaat","2–0 Rangers",1,[
 ["Malafeev","GK","",83,1],["Anyukov","RB","",80,1],["Križanac","CB","",76,1],["Tymoshchuk","CB","DM",82,1],["Šírl","LB","",76,1],
 ["Zyryanov","CM","LM",84,1],["Denisov","CM","DM",81,1],["Shirokov","RM","CM",78,1],["Fayzulin","LM","CM",77,1],["Arshavin","AM","LW",93,1],["Tekke","ST","",78,1],
 ["Pogrebnyak","ST","",86,0],["Dominguez","RW","",80,0],["Danny","AM","",78,0],["Puygrenier","CB","",74,0],["Radimov","CM","",72,0]]);

T("sha-2009-uel","Shakhtar Donetsk","SHA",2009,"2008–09","#f58220","#111111","Mircea Lucescu","2–1 Werder Bremen (a.e.t.)",1,[
 ["Pyatov","GK","",81,1],["Srna","RB","",88,1],["Kucher","CB","",77,1],["Chygrynskiy","CB","",83,1],["Rat","LB","",79,1],
 ["Lewandowski","DM","CM",77,1],["Fernandinho","CM","",85,1],["Ilsinho","RM","RW",80,1],["Jadson","AM","",87,1],["Willian","LW","RW",85,1],["Luiz Adriano","ST","",83,1],
 ["Hübschman","DM","",75,0],["Duljaj","CM","",70,0],["Gai","LM","",72,0],["Gladkiy","ST","",72,0],["Ischenko","CB","",72,0]]);

T("atm-2010-uel","Atlético Madrid","ATM",2010,"2009–10","#cb3524","#1d2a6b","Quique Sánchez Flores","2–1 Fulham (a.e.t.)",1,[
 ["De Gea","GK","",85,1],["Perea","RB","CB",77,1],["Ujfaluši","CB","RB",81,1],["Á. Domínguez","CB","",76,1],["Antonio López","LB","",79,1],
 ["Assunção","DM","",80,1],["Raúl García","CM","",79,1],["Reyes","RM","LW",85,1],["Simão","LM","RW",84,1],["Forlán","ST","",93,1],["Agüero","ST","",89,1],
 ["Jurado","AM","",76,0],["Salvio","LW","",74,0],["Valera","RB","",70,0],["Camacho","DM","",68,0]]);

T("por-2011-uel","FC Porto","POR",2011,"2010–11","#003d99","#ffffff","André Villas-Boas","1–0 Braga",1,[
 ["Helton","GK","",82,1],["Sapunaru","RB","",77,1],["Rolando","CB","",83,1],["Otamendi","CB","",84,1],["Álvaro Pereira","LB","",83,1],
 ["Fernando","DM","CM",84,1],["Guarín","CM","",83,1],["Moutinho","CM","AM",86,1],["Hulk","RW","",91,1],["Falcao","ST","",95,1],["Varela","LW","",78,1],
 ["James","LW","AM",80,0],["Belluschi","CM","",74,0],["C. Rodríguez","RW","LW",78,0]]);

T("atm-2012-uel","Atlético Madrid","ATM",2012,"2011–12","#cb3524","#1d2a6b","Diego Simeone","3–0 Athletic Club",1,[
 ["Courtois","GK","",87,1],["Juanfran","RB","",79,1],["Miranda","CB","",83,1],["Godín","CB","",85,1],["Filipe Luís","LB","",84,1],
 ["Mario Suárez","DM","CM",78,1],["Gabi","DM","CM",82,1],["Diego","AM","",85,1],["Adrián","RW","AM",81,1],["Arda Turan","LW","AM",86,1],["Falcao","ST","",95,1],
 ["Koke","CM","",74,0],["Salvio","LW","",72,0],["Á. Domínguez","CB","",72,0],["Assunção","DM","",72,0]]);

T("che-2013-uel","Chelsea","CHE",2013,"2012–13","#034694","#ffffff","Rafa Benítez","2–1 Benfica",1,[
 ["Čech","GK","",86,1],["Azpilicueta","RB","LB",81,1],["Ivanović","CB","RB",84,1],["Cahill","CB","",80,1],["Ashley Cole","LB","",82,1],
 ["D. Luiz","DM","CB",83,1],["Lampard","CM","",86,1],["Ramires","RM","CM",81,1],["Mata","AM","",90,1],["Oscar","LW","AM",83,1],["Torres","ST","",86,1],
 ["Hazard","LW","AM",86,0],["Moses","RW","",76,0],["Mikel","DM","",76,0],["Terry","CB","",78,0],["Bertrand","LB","",72,0]]);

T("sev-2014-uel","Sevilla","SEV",2014,"2013–14","#f4f4f4","#d4001f","Unai Emery","0–0 Benfica (4–2 pens)",1,[
 ["Beto","GK","",87,1],["Coke","RB","",80,1],["Pareja","CB","",78,1],["Fazio","CB","",79,1],["Moreno","LB","",79,1],
 ["Mbia","DM","CM",80,1],["Carriço","DM","CB",78,1],["Rakitić","CM","AM",89,1],["Reyes","RW","LW",81,1],["Vitolo","LW","RW",80,1],["Bacca","ST","",88,1],
 ["Gameiro","ST","",78,0],["Marin","AM","LW",74,0],["Figueiras","RB","",70,0],["Iborra","CM","",72,0]]);

T("sev-2015-uel","Sevilla","SEV",2015,"2014–15","#f4f4f4","#d4001f","Unai Emery","3–2 Dnipro",1,[
 ["Rico","GK","",79,1],["Aleix Vidal","RB","RM",80,1],["Carriço","CB","DM",78,1],["Kolodziejczak","CB","",76,1],["Trémoulinas","LB","",77,1],
 ["Mbia","DM","CM",78,1],["Krychowiak","DM","CM",87,1],["Reyes","RW","LW",80,1],["Banega","AM","CM",88,1],["Vitolo","LW","RW",82,1],["Bacca","ST","",91,1],
 ["Coke","RB","RM",78,0],["Gameiro","ST","",80,0],["Iborra","CM","",72,0],["Denis Suárez","AM","",72,0]]);

T("sev-2016-uel","Sevilla","SEV",2016,"2015–16","#f4f4f4","#d4001f","Unai Emery","3–1 Liverpool",1,[
 ["Soria","GK","",81,1],["Mariano","RB","",77,1],["Rami","CB","",80,1],["Carriço","CB","DM",78,1],["Escudero","LB","",77,1],
 ["N'Zonzi","DM","CM",83,1],["Krychowiak","DM","CM",85,1],["Coke","RM","RB",86,1],["Banega","AM","CM",91,1],["Vitolo","LM","LW",82,1],["Gameiro","ST","",87,1],
 ["Rico","GK","",74,0],["Kolodziejczak","CB","",74,0],["Iborra","CM","",74,0],["Cristóforo","CM","",70,0],["Konoplyanka","LW","",74,0]]);

T("mun-2017-uel","Manchester United","MUN",2017,"2016–17","#da291c","#fbe122","José Mourinho","2–0 Ajax",1,[
 ["Romero","GK","",83,1],["Valencia","RB","",78,1],["Smalling","CB","",79,1],["D. Blind","CB","LB",77,1],["Darmian","LB","RB",75,1],
 ["Herrera","CM","",82,1],["Fellaini","CM","DM",80,1],["Pogba","CM","",87,1],["Mata","RW","AM",82,1],["Mkhitaryan","LW","AM",88,1],["Rashford","ST","LW",85,1],
 ["Ibrahimović","ST","",89,0],["De Gea","GK","",85,0],["Rooney","ST","AM",78,0],["Carrick","DM","CM",78,0],["Martial","LW","ST",78,0],["Lingard","LW","AM",75,0],["Phil Jones","CB","",76,0]]);

T("atm-2018-uel","Atlético Madrid","ATM",2018,"2017–18","#cb3524","#1d2a6b","Diego Simeone","3–0 Marseille",1,[
 ["Oblak","GK","",90,1],["Vrsaljko","RB","",80,1],["Giménez","CB","",83,1],["Godín","CB","",86,1],["L. Hernández","LB","CB",82,1],
 ["Gabi","DM","CM",83,1],["Saúl","CM","",86,1],["Koke","CM","LM",86,1],["Correa","RW","AM",79,1],["Griezmann","ST","AM",93,1],["Diego Costa","ST","",86,1],
 ["Juanfran","RB","",76,0],["Filipe Luís","LB","",80,0],["Partey","DM","CM",76,0],["Torres","ST","",74,0],["Gameiro","ST","",76,0],["Savić","CB","",78,0]]);

T("che-2019-uel","Chelsea","CHE",2019,"2018–19","#034694","#ffffff","Maurizio Sarri","4–1 Arsenal",1,[
 ["Kepa","GK","",82,1],["Azpilicueta","RB","CB",82,1],["D. Luiz","CB","",82,1],["Christensen","CB","",80,1],["Emerson","LB","",80,1],
 ["Jorginho","DM","CM",86,1],["Kanté","CM","DM",86,1],["Kovačić","CM","",82,1],["Pedro","RW","LW",83,1],["Giroud","ST","",89,1],["Hazard","LW","AM",95,1],
 ["Willian","RW","LW",83,0],["Barkley","CM","AM",78,0],["Zappacosta","RB","RM",74,0],["M. Alonso","LB","LM",77,0],["Higuaín","ST","",74,0]]);

T("sev-2020-uel","Sevilla","SEV",2020,"2019–20","#f4f4f4","#d4001f","Julen Lopetegui","3–2 Inter",0,[
 ["Bono","GK","",87,1],["J. Navas","RB","RM",82,1],["Koundé","CB","",85,1],["Diego Carlos","CB","",85,1],["Reguilón","LB","",81,1],
 ["Fernando","DM","CM",84,1],["J. Jordán","CM","",80,1],["Banega","CM","AM",86,1],["Ocampos","RW","",86,1],["Suso","LW","RW",80,1],["De Jong","ST","",88,1],
 ["Vaclík","GK","",72,0],["Sergi Gómez","CB","",74,0],["Gudelj","CB","DM",75,0],["Óliver Torres","CM","AM",74,0],["F. Vázquez","AM","CM",76,0],["Munir","ST","",72,0],["En-Nesyri","ST","",80,0]]);

T("vil-2021-uel","Villarreal","VIL",2021,"2020–21","#ffe667","#005187","Unai Emery","1–1 Manchester United (11–10 pens)",0,[
 ["Rulli","GK","",89,1],["Gaspar","RB","",76,1],["Albiol","CB","",84,1],["Pau Torres","CB","",87,1],["Pedraza","LB","",79,1],
 ["Parejo","CM","DM",86,1],["Capoue","DM","CM",83,1],["Pino","RW","",81,1],["Trigueros","AM","CM",81,1],["G. Moreno","LW","ST",90,1],["Alcácer","ST","",79,1],
 ["Asenjo","GK","",76,0],["Foyth","CB","RB",78,0],["Moreno","LB","",76,0],["Moi Gómez","RW","",76,0],["Raba","CM","",72,0],["Bacca","ST","",78,0]]);

T("sge-2022-uel","Eintracht Frankfurt","SGE",2022,"2021–22","#111111","#e1000f","Oliver Glasner","1–1 Rangers (5–4 pens)",0,[
 ["Trapp","GK","",88,1],["Knauff","RB","RM",78,1],["Tuta","CB","",79,1],["Hinteregger","CB","",81,1],["Ndicka","LB","CB",81,1],
 ["Sow","CM","",80,1],["Rode","CM","DM",78,1],["Lindstrøm","RW","",82,1],["Kamada","AM","CM",86,1],["Kostić","LW","LM",86,1],["Borré","ST","",85,1],
 ["Grahl","GK","",68,0],["A. Touré","RB","",74,0],["Hasebe","CB","",74,0],["Chandler","RB","",70,0],["Jakić","CM","",76,0],["Hauge","LW","",76,0],["Paciência","ST","",75,0]]);

T("sev-2023-uel","Sevilla","SEV",2023,"2022–23","#f4f4f4","#d4001f","José Luis Mendilibar","1–1 Roma (4–1 pens)",0,[
 ["Bono","GK","",88,1],["J. Navas","RB","",78,1],["Badé","CB","",81,1],["Gudelj","CB","DM",79,1],["Acuña","LB","LM",81,1],
 ["Fernando","DM","CM",76,1],["Rakitić","CM","",82,1],["Suso","RW","",76,1],["Lamela","AM","",78,1],["En-Nesyri","ST","LW",84,1],["Rafa Mir","ST","",76,1],
 ["Dmitrović","GK","",72,0],["Montiel","RB","",76,0],["Carmona","RB","",72,0],["J. Jordán","CM","",76,0],["Óliver Torres","CM","AM",74,0],["Ocampos","LW","RW",78,0],["Papu Gómez","AM","",76,0]]);

T("ata-2024-uel","Atalanta","ATA",2024,"2023–24","#1e71b8","#111111","Gian Piero Gasperini","3–0 Bayer Leverkusen",1,[
 ["Musso","GK","",85,1],["Djimsiti","CB","",82,1],["Hien","CB","",82,1],["Kolašinac","CB","LB",80,1],["Zappacosta","RB","RM",81,1],
 ["Éderson","CM","DM",83,1],["Koopmeiners","CM","AM",87,1],["Ruggeri","LB","LM",79,1],["De Ketelaere","AM","LW",84,1],["Lookman","LW","RW",95,1],["Scamacca","ST","",85,1],
 ["Carnesecchi","GK","",76,0],["Scalvini","CB","",80,0],["Pašalić","CM","AM",79,0],["De Roon","DM","CM",78,0],["Holm","RB","RM",76,0],["Hateboer","RB","",74,0],["Tolói","CB","",76,0],["Touré","ST","",74,0],["Miranchuk","AM","",74,0]]);

T("tot-2025-uel","Tottenham Hotspur","TOT",2025,"2024–25","#f4f4f4","#132257","Ange Postecoglou","1–0 Manchester United",0,[
 ["Vicario","GK","",84,1],["Porro","RB","",82,1],["Romero","CB","",88,1],["Van de Ven","CB","",85,1],["Udogie","LB","",80,1],
 ["Bissouma","DM","CM",81,1],["Bentancur","CM","DM",83,1],["P. Sarr","CM","",81,1],["B. Johnson","RW","",84,1],["Solanke","ST","",82,1],["Richarlison","LW","ST",83,1],
 ["Son","LW","ST",82,0],["Spence","RB","",72,0],["B. Davies","CB","LB",74,0],["Danso","CB","",76,0],["A. Gray","CM","DM",72,0],["Odobert","LW","",72,0],["Tel","ST","",72,0]]);

T("avl-2026-uel","Aston Villa","AVL",2026,"2025–26","#7b003c","#95bfe5","Unai Emery","3–0 Freiburg",0,[
 ["E. Martínez","GK","",87,1],["Cash","RB","",81,1],["Konsa","CB","",82,1],["Pau Torres","CB","",83,1],["Digne","LB","",80,1],
 ["Lindelöf","DM","CB",80,1],["Tielemans","CM","",86,1],["McGinn","CM","RW",83,1],["Rogers","AM","",88,1],["Buendía","LW","AM",85,1],["Watkins","ST","",86,1],
 ["Bizot","GK","",70,0],["Mings","CB","",75,0],["Maatsen","LB","",75,0],["Elliott","CM","AM",74,0],["Sancho","RW","LW",76,0],["Douglas Luiz","CM","DM",76,0],["Onana","DM","CM",80,0],["Abraham","ST","",74,0],["Bailey","RW","",76,0]]);

D.seasons.sort(function(a,b){return a.yr-b.yr;});
})(typeof window!=="undefined"?window:globalThis);
