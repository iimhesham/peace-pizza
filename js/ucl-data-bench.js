/* =========================================================
   UCL — بيانات الدكة والمواسم الإضافية (تُحمَّل بعد ucl-data.js).
   ADD: لاعبين من قايمة الموسم/مباراة النهائي مش موجودين في ucl-data.js (s=0 = دكة/احتياطي).
   NEW: مواسم فازت بالبطولة مش موجودة في ucl-data.js.
   مصدر القوايم: ويكيبيديا (صفحة موسم النادي + جدول مشاركات دوري الأبطال) + معرفة المؤلف.
   التقييمات تقديرية (sofifa/EA FC غير متاحة من بيئة التطوير) — راجع README/الرسالة قبل الاعتماد عليها.
   صيغة اللاعب: [الاسم, المركز, المركز البديل, التقييم, 1=أساسي/0=دكة]
========================================================= */
(function(root){
"use strict";
var D=root.UCL_DATA;
if(!D&&typeof require==="function"){D=require("./ucl-data.js");}
if(!D||!D.seasons)return;
function norm(s){return String(s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z ]/g,"");}
function last(s){var a=norm(s).trim().split(" ");return a[a.length-1];}
var ADD={
 "rma-2017":[["Morata","ST","",83,0],["L. Vázquez","RW","RB",80,0],["Kovačić","CM","",82,0],["James","AM","CM",84,0],["Pepe","CB","",81,0],["Casilla","GK","",78,0],["Coentrão","LB","",77,0]],
 "rma-2018":[["Kovačić","CM","",82,0],["Ceballos","CM","",76,0],["Casilla","GK","",76,0],["Mayoral","ST","",74,0],["Vallejo","CB","",76,0],["Hakimi","RB","RM",77,0],["T. Hernández","LB","",78,0]],
 "liv-2019":[["Mignolet","GK","",77,0],["Lovren","CB","",82,0],["Moreno","LB","",76,0],["Lallana","CM","AM",78,0],["Sturridge","ST","",79,0]],
 "bay-2020":[["Coutinho","AM","LW",85,0],["Tolisso","CM","",82,0],["J. Martínez","DM","CB",80,0],["L. Hernández","LB","CB",84,0],["Ulreich","GK","",75,0],["Odriozola","RB","",76,0]],
 "che-2021":[["Giroud","ST","",80,0],["Ziyech","RW","",83,0],["Hudson-Odoi","RW","LW",80,0],["Abraham","ST","",78,0],["Zouma","CB","",82,0],["Emerson","LB","",78,0],["Kepa","GK","",82,0],["M. Alonso","LB","LM",80,0]],
 "rma-2022":[["Hazard","LW","AM",81,0],["Jović","ST","",76,0],["L. Vázquez","RB","RW",80,0],["Ceballos","CM","",78,0],["Vallejo","CB","",76,0],["Bale","RW","",80,0]],
 "mci-2023":[["Ortega","GK","",78,0],["Laporte","CB","LB",85,0],["K. Phillips","DM","CM",80,0],["Mahrez","RW","",85,0],["N. Gómez","CB","LB",77,0],["R. Lewis","RB","",74,0]],
 "rma-2024":[["B. Díaz","AM","RW",82,0],["L. Vázquez","RB","RW",80,0],["Ceballos","CM","",78,0],["Fran García","LB","",80,0],["Kepa","GK","",80,0]],
 "psg-2025":[["G. Ramos","ST","",80,0],["Lee Kang-in","AM","RW",79,0],["L. Hernández","CB","LB",82,0],["Safonov","GK","",77,0],["Mayulu","AM","CM",72,0]],
 "mil-2003":[["Abbiati","GK","",78,0],["Šimić","CB","",78,0],["Laursen","CB","",77,0],["Helveg","RB","",76,0],["Redondo","CM","",82,0],["Serginho","LB","LM",78,0],["Brocchi","CM","",76,0],["Tomasson","ST","",79,0],["Rivaldo","AM","ST",85,0],["Dalla Bona","CM","",74,0]],
 "liv-2005":[["Josemi","RB","",74,0],["Bišćan","DM","CM",74,0],["Sinama Pongolle","ST","",75,0],["A. Núñez","RM","",74,0],["Diao","CM","DM",74,0],["Warnock","LB","",72,0],["Kirkland","GK","",74,0],["Carson","GK","",72,0]],
 "bar-2006":[["Sylvinho","LB","",79,0],["Gabri","CM","",77,0],["Ezquerro","ST","",72,0],["Motta","CM","DM",80,0],["Maxi López","ST","",72,0],["Jorquera","GK","",72,0]],
 "mil-2007":[["R. Oliveira","ST","",78,0],["Borriello","ST","",77,0],["Bonera","CB","RB",77,0],["Brocchi","CM","",77,0],["Šimić","CB","",78,0],["Kalac","GK","",76,0],["Gourcuff","AM","CM",80,0],["Favalli","LB","",74,0],["Serginho","LB","LM",76,0],["Storari","GK","",72,0]],
 "mun-2008":[["Kuszczak","GK","",75,0],["G. Neville","RB","",78,0],["O'Shea","CB","LB",78,0],["Silvestre","CB","LB",76,0],["Park","LM","LW",78,0],["Fletcher","CM","",79,0],["Saha","ST","",77,0],["Evans","CB","",74,0],["Simpson","RB","",72,0],["Piqué","CB","",79,0]],
 "bar-2009":[["Pinto","GK","",75,0],["Cáceres","CB","RB",78,0],["Sylvinho","LB","",77,0],["Hleb","RW","AM",80,0],["Gudjohnsen","ST","",79,0],["Bojan","ST","RW",76,0],["V. Sánchez","DM","",72,0]],
 "int-2010":[["Toldo","GK","",77,0],["Materazzi","CB","",80,0],["Córdoba","CB","",76,0],["Santon","LB","",75,0],["Muntari","CM","",78,0],["Balotelli","ST","",80,0],["Quaresma","RW","",78,0],["Mariga","CM","DM",74,0]],
 "bar-2011":[["Pinto","GK","",76,0],["Maxwell","LB","",77,0],["Adriano","LB","RB",78,0],["Afellay","RW","LW",80,0],["Bojan","ST","",76,0],["Thiago","CM","",76,0],["Milito","CB","",78,0]],
 "che-2012":[["Meireles","CM","",80,0],["Sturridge","ST","LW",77,0],["Romeu","DM","",74,0],["Bertrand","LB","LW",74,0]],
 "bay-2013":[["Shaqiri","RW","AM",79,0],["Luiz Gustavo","DM","",82,0],["Pizarro","ST","",79,0],["Tymoshchuk","DM","",77,0],["Van Buyten","CB","",78,0],["Rafinha","RB","",76,0],["Badstuber","CB","",79,0],["Starke","GK","",72,0]],
 "rma-2014":[["Arbeloa","RB","",77,0],["Illarramendi","DM","CM",78,0],["Casemiro","DM","",76,0],["Morata","ST","",78,0],["Jesé","LW","",74,0],["Nacho","CB","",76,0],["Diego López","GK","",80,0]],
 "bar-2015":[["Rafinha","CM","RW",76,0],["Adriano","LB","RB",77,0],["Montoya","RB","",74,0],["Bartra","CB","",76,0],["S. Roberto","CM","",72,0],["Sandro","ST","",72,0],["Munir","ST","",72,0]]
};

/* FIX: تصحيح التشكيلة الأساسية في النهائي (s) والمراكز — من قايمة نهائيات بعتها المستخدم (Grok) وتمت مطابقتها
   مع جداول FBref وويكيبيديا قدر الإمكان. غير مؤكدة 100٪ لحد ما تتراجع على مصدر رسمي. */
var EXTRA={
 "rma-2000":[["Karembeu","CB","RB",80,1],["Sanchís","CB","",78,0]],
 "rma-2002":[["César","GK","",82,1]],
 "mil-1990":[["Evani","CM","",78,0],["Massaro","ST","",80,0],["F. Galli","CB","",79,0],["Pazzagli","GK","",72,0]],
 "bar-1992":[["Alexanko","CB","",75,0],["Goikoetxea","CB","",74,0]],
 "crv-1991":[["Radinović","LB","",76,1]],
 "om-1993":[["Durand","ST","",76,0],["Thomas","ST","",74,0],["Casoni","CB","",74,0]],
 "mil-1994":[["Eranio","CM","RM",76,0],["Simone","ST","",76,0],["F. Galli","CB","",78,0],["Lentini","RM","AM",76,0]],
 "ajx-1995":[["Kanu","ST","",82,0],["Scholten","AM","",76,0],["Winter","CM","DM",78,0],["Silooy","LB","",74,0]],
 "juv-1996":[["Padovano","ST","",76,0],["Tacchinardi","CM","DM",77,0],["Porrini","RB","",75,0],["Rampulla","GK","",73,0]],
 "bvb-1997":[["Herrlich","ST","",76,0],["Freund","DM","CM",78,0],["Tretschok","CM","",75,0]],
 "rma-1998":[["Morientes","ST","",78,0],["Jaime","CM","RM",76,0],["Amavisca","LW","",76,0],["F. Sanz","CB","",74,0]],
 "mun-1999":[["Blomqvist","LM","LW",78,0],["Van der Gouw","GK","",72,0],["P. Neville","LB","RB",75,0],["Berg","CB","",77,0]],
 "che-2012":[["Bertrand","LM","LB",74,0]],
 "rma-2014":[["Coentrão","LB","",80,0]]
};
var FIX={
 "rma-2000":{"Hierro":{s:0}},
 "bay-2001":{"Andersson":{s:1,pos:"CB"},"Hargreaves":{s:1,pos:"DM",alt:"CM"},"Jeremies":{s:0},"Jancker":{s:0}},
 "rma-2002":{"Casillas":{s:0},"Solari":{s:1},"McManaman":{s:0}},
 "mil-2003":{"Costacurta":{s:1,pos:"CB",alt:"RB"},"Pancaro":{s:0}},
 "por-2004":{"Pedro Mendes":{s:1},"Alenichev":{s:0}},
 "liv-2005":{"Hamann":{s:0},"Traoré":{s:1},"Riise":{pos:"LM",alt:"LB"},"Kewell":{pos:"RM",alt:"LW"}},
 "bar-2006":{"Oleguer":{s:1,pos:"RB",alt:"CB"},"Belletti":{s:0}},
 "mil-1990":{"Donadoni":{s:0},"Evani":{s:1,pos:"LM",alt:"CM"}},
 "crv-1991":{"Šabanadžović":{s:0},"Savićević":{pos:"AM",alt:"LW"},"Mihajlović":{s:1,pos:"CM",alt:"LB"},"Binić":{pos:"ST",alt:"CM"},"Marović":{pos:"RB",alt:"RM"}},
 "bar-1992":{"Salinas":{s:0},"Begiristain":{s:1,pos:"RW",alt:"AM"}},
 "che-2012":{"Ivanović":{s:0},"Terry":{s:0},"Ramires":{s:0},"Malouda":{s:0},"Bosingwa":{s:1,pos:"RB"},"Cahill":{s:1,pos:"CB"},"Bertrand":{s:1,pos:"LM",alt:"LB"},"Kalou":{s:1,pos:"RM",alt:"RW"}},
 "bay-2013":{"J. Martínez":{s:0},"Luiz Gustavo":{s:1,pos:"DM"}},
 "rma-2014":{"Marcelo":{s:0},"Coentrão":{s:1,pos:"LB"}},
 "mil-1994":{"Costacurta":{s:0},"Boban":{s:1,pos:"CM",alt:"AM"},"Desailly":{pos:"CB",alt:"DM"}},
 "ajx-1995":{"Kluivert":{s:0},"R. de Boer":{s:1,pos:"RM",alt:"AM"}},
 "mun-1999":{"Keane":{s:0},"Scholes":{s:0},"Butt":{s:1,pos:"CM"},"Blomqvist":{s:1,pos:"LM",alt:"LW"},"Giggs":{pos:"RM",alt:"LM"},"Beckham":{pos:"CM",alt:"RM"}},
 "bar-2009":{"Alves":{s:0},"Abidal":{s:0},"Puyol":{s:1,pos:"RB",alt:"CB"},"Y. Touré":{s:1,pos:"CB",alt:"DM"},"Busquets":{s:1,pos:"DM"},"Sylvinho":{s:1,pos:"LB"}}
};
var NEW=[
 {id:"rma-1956",club:"Real Madrid",ab:"RMA",yr:1956,ss:"1955–56",c:["#f4f4f4","#febe10"],coach:"José Villalonga",fin:"4–3 Stade de Reims",p:[
  ["Alonso","GK","",80,1],["Atienza","RB","",76,1],["Marquitos","CB","",80,1],["Lesmes","LB","",76,1],["Muñoz","DM","CM",82,1],["Zárraga","CM","DM",80,1],
  ["Joseíto","RW","",78,1],["Marsal","AM","CM",80,1],["Di Stéfano","ST","AM",96,1],["Rial","AM","ST",88,1],["Gento","LW","",90,1]]},
 {id:"rma-1957",club:"Real Madrid",ab:"RMA",yr:1957,ss:"1956–57",c:["#f4f4f4","#febe10"],coach:"José Villalonga",fin:"2–0 Fiorentina",p:[
  ["Alonso","GK","",80,1],["Torres","RB","",76,1],["Marquitos","CB","",80,1],["Lesmes","LB","",76,1],["Muñoz","DM","CM",82,1],["Zárraga","CM","DM",80,1],
  ["Kopa","RW","AM",92,1],["Mateos","AM","CM",80,1],["Di Stéfano","ST","AM",97,1],["Rial","AM","ST",88,1],["Gento","LW","",91,1]]},
 {id:"rma-1958",club:"Real Madrid",ab:"RMA",yr:1958,ss:"1957–58",c:["#f4f4f4","#febe10"],coach:"Luis Carniglia",fin:"3–2 AC Milan (a.e.t.)",p:[
  ["Alonso","GK","",80,1],["Atienza","RB","",76,1],["Santamaría","CB","",88,1],["Lesmes","LB","",76,1],["Muñoz","DM","CM",82,1],["Santisteban","CM","",78,1],
  ["Kopa","RW","AM",92,1],["Joseíto","RM","RW",78,1],["Di Stéfano","ST","AM",97,1],["Rial","AM","ST",88,1],["Gento","LW","",92,1]]},
 {id:"rma-1959",club:"Real Madrid",ab:"RMA",yr:1959,ss:"1958–59",c:["#f4f4f4","#febe10"],coach:"Luis Carniglia",fin:"2–0 Stade de Reims",p:[
  ["Domínguez","GK","",79,1],["Marquitos","RB","CB",80,1],["Santamaría","CB","",89,1],["Pachín","LB","",78,1],["Zárraga","DM","CM",80,1],["Santisteban","CM","",78,1],
  ["Kopa","RW","AM",91,1],["Mateos","AM","CM",80,1],["Di Stéfano","ST","AM",97,1],["Rial","AM","ST",87,1],["Gento","LW","",92,1]]},
 {id:"ben-1961",club:"SL Benfica",ab:"BEN",yr:1961,ss:"1960–61",c:["#e30613","#ffffff"],coach:"Béla Guttmann",fin:"3–2 FC Barcelona",p:[
  ["Costa Pereira","GK","",84,1],["Mário João","RB","",78,1],["Germano","CB","",84,1],["Neto","CB","DM",80,1],["Ângelo","LB","",78,1],["Cruz","DM","CM",79,1],
  ["Coluna","CM","AM",90,1],["José Augusto","RW","",84,1],["Águas","ST","",88,1],["Santana","ST","LW",82,1],["Cavém","LW","",82,1]]},
 {id:"ben-1962",club:"SL Benfica",ab:"BEN",yr:1962,ss:"1961–62",c:["#e30613","#ffffff"],coach:"Béla Guttmann",fin:"5–3 Real Madrid",p:[
  ["Costa Pereira","GK","",84,1],["Mário João","RB","",78,1],["Germano","CB","",85,1],["Cruz","CB","DM",80,1],["Ângelo","LB","",78,1],["Cavém","CM","LW",82,1],
  ["Coluna","CM","AM",91,1],["José Augusto","RW","",85,1],["Águas","ST","",87,1],["Eusébio","ST","",92,1],["Simões","LW","",82,1]]},
 {id:"mil-1963",club:"AC Milan",ab:"MIL",yr:1963,ss:"1962–63",c:["#fb090b","#111111"],coach:"Nereo Rocco",fin:"2–1 Benfica",p:[
  ["Ghezzi","GK","",80,1],["David","RB","",76,1],["Maldini","CB","",82,1],["Trebbi","LB","",76,1],["Trapattoni","CB","DM",82,1],["Benítez","DM","CM",78,1],
  ["Sani","CM","",82,1],["Rivera","AM","",92,1],["Pivatelli","RW","ST",78,1],["Altafini","ST","",90,1],["Mora","LW","",82,1]]},
 {id:"int-1964",club:"Inter",ab:"INT",yr:1964,ss:"1963–64",c:["#0068a8","#111111"],coach:"Helenio Herrera",fin:"3–1 Real Madrid",p:[
  ["Sarti","GK","",86,1],["Burgnich","RB","CB",86,1],["Guarneri","CB","",84,1],["Picchi","CB","",84,1],["Facchetti","LB","CB",92,1],["Tagnin","DM","",78,1],
  ["Suárez","CM","AM",93,1],["Mazzola","AM","",90,1],["Jair","RW","",88,1],["Milani","ST","",82,1],["Corso","LW","AM",88,1]]},
 {id:"int-1965",club:"Inter",ab:"INT",yr:1965,ss:"1964–65",c:["#0068a8","#111111"],coach:"Helenio Herrera",fin:"1–0 Benfica",p:[
  ["Sarti","GK","",86,1],["Burgnich","RB","CB",86,1],["Guarneri","CB","",84,1],["Picchi","CB","",84,1],["Facchetti","LB","CB",92,1],["Bedin","DM","",80,1],
  ["Suárez","CM","AM",93,1],["Mazzola","AM","",91,1],["Jair","RW","",88,1],["Peiró","ST","",84,1],["Corso","LW","AM",88,1]]},
 {id:"rma-1966",club:"Real Madrid",ab:"RMA",yr:1966,ss:"1965–66",c:["#f4f4f4","#febe10"],coach:"Miguel Muñoz",fin:"2–1 Partizan",p:[
  ["Araquistáin","GK","",80,1],["Calpe","RB","",76,1],["Sanchís","CB","",84,1],["Zoco","CB","",80,1],["Pachín","LB","",78,1],["Pirri","DM","CM",86,1],
  ["Velázquez","CM","AM",82,1],["Serena","RW","",78,1],["Amancio","ST","RW",88,1],["Grosso","ST","",80,1],["Gento","LW","",88,1]]},
 {id:"cel-1967",club:"Celtic",ab:"CEL",yr:1967,ss:"1966–67",c:["#128a3d","#ffffff"],coach:"Jock Stein",fin:"2–1 Inter",p:[
  ["Simpson","GK","",80,1],["Craig","RB","",78,1],["McNeill","CB","",86,1],["Clark","CB","",78,1],["Gemmell","LB","RB",82,1],["Murdoch","CM","",86,1],
  ["Auld","CM","AM",82,1],["Johnstone","RW","",90,1],["Wallace","ST","",82,1],["Chalmers","ST","",80,1],["Lennox","LW","",82,1]]},
 {id:"mil-1969",club:"AC Milan",ab:"MIL",yr:1969,ss:"1968–69",c:["#fb090b","#111111"],coach:"Nereo Rocco",fin:"4–1 Ajax",p:[
  ["Cudicini","GK","",82,1],["Anquilletti","RB","",78,1],["Rosato","CB","",84,1],["Malatrasi","CB","",78,1],["Schnellinger","LB","CB",86,1],["Trapattoni","DM","",82,1],
  ["Lodetti","CM","",82,1],["Rivera","AM","",92,1],["Hamrin","RW","",84,1],["Sormani","ST","",84,1],["Prati","LW","ST",88,1]]},
 {id:"fey-1970",club:"Feyenoord",ab:"FEY",yr:1970,ss:"1969–70",c:["#e4002b","#ffffff"],coach:"Ernst Happel",fin:"2–1 Celtic (a.e.t.)",p:[
  ["Pieters Graafland","GK","",80,1],["Romeijn","RB","",76,1],["Israël","CB","",86,1],["Laseroms","CB","",78,1],["Van Duivenbode","LB","",78,1],["Jansen","CM","DM",84,1],
  ["Hasil","CM","",80,1],["Van Hanegem","AM","CM",90,1],["Wery","RW","",78,1],["Kindvall","ST","",84,1],["Moulijn","LW","",82,1]]},
 {id:"ajx-1971",club:"Ajax",ab:"AJX",yr:1971,ss:"1970–71",c:["#f4f4f4","#d2122e"],coach:"Rinus Michels",fin:"2–0 Panathinaikos",p:[
  ["Stuy","GK","",78,1],["Suurbier","RB","",82,1],["Vasović","CB","",82,1],["Hulshoff","CB","",84,1],["Rijnders","LB","",76,1],["Neeskens","CM","",86,1],
  ["Haan","CM","",86,1],["Cruyff","AM","ST",97,1],["Swart","RW","",84,1],["Van Dijk","ST","",78,1],["Keizer","LW","",84,1]]},
 {id:"ajx-1973",club:"Ajax",ab:"AJX",yr:1973,ss:"1972–73",c:["#f4f4f4","#d2122e"],coach:"Ștefan Kovács",fin:"1–0 Juventus",p:[
  ["Stuy","GK","",80,1],["Suurbier","RB","",83,1],["Blankenburg","CB","",84,1],["Hulshoff","CB","",85,1],["Krol","LB","CB",90,1],["Neeskens","CM","",89,1],
  ["Haan","CM","",87,1],["G. Mühren","CM","AM",82,1],["Rep","RW","ST",86,1],["Cruyff","ST","AM",98,1],["Keizer","LW","",84,1]]},
 {id:"bay-1975",club:"Bayern München",ab:"BAY",yr:1975,ss:"1974–75",c:["#dc052d","#ffffff"],coach:"Dettmar Cramer",fin:"2–0 Leeds United",p:[
  ["Maier","GK","",92,1],["Hansen","RB","",80,1],["Schwarzenbeck","CB","",85,1],["Beckenbauer","CB","DM",97,1],["Horsmann","LB","",76,1],["Kapellmann","CM","",82,1],
  ["Dürnberger","CM","",80,1],["Roth","RW","AM",86,1],["Torstensson","LW","",78,1],["Müller","ST","",96,1],["Hoeneß","ST","LW",86,1]]},
 {id:"bay-1976",club:"Bayern München",ab:"BAY",yr:1976,ss:"1975–76",c:["#dc052d","#ffffff"],coach:"Dettmar Cramer",fin:"1–0 Saint-Étienne",p:[
  ["Maier","GK","",92,1],["Hansen","RB","",80,1],["Schwarzenbeck","CB","",85,1],["Beckenbauer","CB","DM",97,1],["Horsmann","LB","",76,1],["Kapellmann","CM","",82,1],
  ["Dürnberger","CM","",80,1],["Roth","RW","AM",87,1],["Rummenigge","LW","RW",86,1],["Müller","ST","",94,1],["Hoeneß","ST","LW",85,1]]},
 {id:"liv-1978",club:"Liverpool",ab:"LIV",yr:1978,ss:"1977–78",c:["#c8102e","#f6eb61"],coach:"Bob Paisley",fin:"1–0 Club Brugge",p:[
  ["Clemence","GK","",90,1],["Neal","RB","",86,1],["Thompson","CB","",84,1],["Hansen","CB","",86,1],["Jones","LB","",76,1],["Case","RM","",82,1],
  ["Souness","CM","DM",90,1],["R. Kennedy","LM","CM",84,1],["McDermott","AM","",86,1],["Dalglish","ST","AM",94,1],["Heighway","RW","",80,1]]},
 {id:"nfo-1980",club:"Nottingham Forest",ab:"NFO",yr:1980,ss:"1979–80",c:["#dd0000","#ffffff"],coach:"Brian Clough",fin:"1–0 Hamburger SV",p:[
  ["Shilton","GK","",92,1],["Anderson","RB","",82,1],["Lloyd","CB","",86,1],["Burns","CB","",84,1],["Gray","LB","",78,1],["O'Neill","RM","RW",82,1],
  ["McGovern","CM","",82,1],["Bowyer","CM","",80,1],["Robertson","LM","AM",88,1],["Birtles","ST","",82,1],["Woodcock","ST","",84,1]]},
 {id:"liv-1981",club:"Liverpool",ab:"LIV",yr:1981,ss:"1980–81",c:["#c8102e","#f6eb61"],coach:"Bob Paisley",fin:"1–0 Real Madrid",p:[
  ["Clemence","GK","",90,1],["Neal","RB","",86,1],["Thompson","CB","",84,1],["Hansen","CB","",88,1],["A. Kennedy","LB","",82,1],["McDermott","RM","AM",86,1],
  ["Lee","CM","",80,1],["Souness","CM","DM",91,1],["R. Kennedy","LM","CM",84,1],["Dalglish","ST","AM",94,1],["Johnson","ST","",80,1]]},
 {id:"ham-1983",club:"Hamburger SV",ab:"HSV",yr:1983,ss:"1982–83",c:["#005ca9","#ffffff"],coach:"Ernst Happel",fin:"1–0 Juventus",p:[
  ["Stein","GK","",84,1],["Kaltz","RB","",88,1],["Hieronymus","CB","",84,1],["Jakobs","CB","",84,1],["Wehmeyer","LB","",78,1],["Rolff","DM","CM",82,1],
  ["Groh","CM","",80,1],["Magath","AM","CM",88,1],["Milewski","RW","",80,1],["Hrubesch","ST","",88,1],["Hartwig","LW","ST",80,1]]},
 {id:"juv-1985",club:"Juventus",ab:"JUV",yr:1985,ss:"1984–85",c:["#111111","#f4f4f4"],coach:"Giovanni Trapattoni",fin:"1–0 Liverpool",p:[
  ["Tacconi","GK","",84,1],["Favero","RB","",78,1],["Brio","CB","",84,1],["Scirea","CB","",93,1],["Cabrini","LB","",88,1],["Bonini","DM","",82,1],
  ["Tardelli","CM","",88,1],["Platini","AM","",98,1],["Briaschi","RW","",80,1],["Boniek","ST","RW",90,1],["Mauro","LM","CM",78,1]]},
 {id:"ste-1986",club:"Steaua București",ab:"STE",yr:1986,ss:"1985–86",c:["#d4002a","#0033a0"],coach:"Emerich Jenei",fin:"0–0 FC Barcelona (2–0 pens)",p:[
  ["Duckadam","GK","",84,1],["Iovan","RB","",76,1],["Belodedici","CB","",86,1],["Bumbescu","CB","",78,1],["Barbu","LB","",76,1],["Majearu","DM","",80,1],
  ["Bölöni","CM","",84,1],["Balint","CM","",80,1],["Boldici","RW","",78,1],["Pițurcă","ST","",82,1],["Lăcătuș","LW","",84,1]]},
 {id:"por-1987",club:"FC Porto",ab:"POR",yr:1987,ss:"1986–87",c:["#003d99","#ffffff"],coach:"Artur Jorge",fin:"2–1 Bayern München",p:[
  ["Mlynarczyk","GK","",82,1],["João Pinto","RB","",78,1],["Lima Pereira","CB","",80,1],["Celso","CB","",76,1],["Inácio","LB","",76,1],["Magalhães","DM","",78,1],
  ["Sousa","CM","",80,1],["André","CM","",78,1],["Madjer","RW","AM",90,1],["Gomes","ST","",92,1],["Futre","LW","",84,1]]},
 {id:"psv-1988",club:"PSV Eindhoven",ab:"PSV",yr:1988,ss:"1987–88",c:["#ed1c24","#ffffff"],coach:"Guus Hiddink",fin:"0–0 Benfica (6–5 pens)",p:[
  ["Van Breukelen","GK","",90,1],["Gerets","RB","CB",86,1],["R. Koeman","CB","",92,1],["Koot","CB","",78,1],["Van Aerle","LB","RB",80,1],["Heintze","DM","LB",78,1],
  ["Lerby","CM","",84,1],["Vanenburg","AM","",86,1],["Gillhaus","RW","",82,1],["Kieft","ST","",84,1],["Linskens","LW","ST",78,1]]},
 {id:"mil-1990",club:"AC Milan",ab:"MIL",yr:1990,ss:"1989–90",c:["#fb090b","#111111"],coach:"Arrigo Sacchi",fin:"1–0 Benfica",p:[
  ["Galli","GK","",86,1],["Tassotti","RB","",84,1],["Costacurta","CB","",84,1],["Baresi","CB","",94,1],["Maldini","LB","CB",92,1],["Colombo","RM","",82,1],
  ["Rijkaard","CM","DM",94,1],["Ancelotti","CM","",88,1],["Donadoni","LM","AM",90,1],["Gullit","AM","ST",95,1],["Van Basten","ST","",97,1]]},
 {id:"crv-1991",club:"Red Star Belgrade",ab:"CRV",yr:1991,ss:"1990–91",c:["#d50032","#ffffff"],coach:"Ljupko Petrović",fin:"0–0 Marseille (5–3 pens)",p:[
  ["Stojanović","GK","",82,1],["Šabanadžović","RB","",76,1],["Belodedici","CB","",86,1],["Najdoski","CB","",78,1],["Mihajlović","LB","",84,1],["Jugović","DM","CM",86,1],
  ["Prosinečki","CM","AM",92,1],["Binić","CM","",80,1],["Savićević","AM","LW",90,1],["Pančev","ST","",88,1],["Marović","RM","",76,1]]},
 {id:"por-2004",club:"FC Porto",ab:"POR",yr:2004,ss:"2003–04",c:["#003d99","#ffffff"],coach:"José Mourinho",fin:"3–0 Monaco",p:[
  ["Vítor Baía","GK","",86,1],["Paulo Ferreira","RB","",83,1],["R. Carvalho","CB","",87,1],["Jorge Costa","CB","",82,1],["Nuno Valente","LB","",80,1],["Costinha","DM","",84,1],
  ["Maniche","CM","",86,1],["Deco","AM","",92,1],["Alenichev","LM","AM",82,1],["Carlos Alberto","RW","",80,1],["Derlei","ST","",84,1],
  ["McCarthy","ST","",82,0],["Pedro Emanuel","CB","",80,0],["Pedro Mendes","CM","",80,0],["Bosingwa","RB","",76,0],["Jankauskas","ST","",76,0],["R. Costa","CB","",74,0],["M. Ferreira","CM","",74,0]]},
 {id:"rma-2016",club:"Real Madrid",ab:"RMA",yr:2016,ss:"2015–16",c:["#f4f4f4","#febe10"],coach:"Zinedine Zidane",fin:"1–1 Atlético Madrid (5–3 pens)",p:[
  ["Navas","GK","",87,1],["Carvajal","RB","",83,1],["Pepe","CB","",84,1],["Ramos","CB","",90,1],["Marcelo","LB","",88,1],["Casemiro","DM","",85,1],
  ["Modrić","CM","",90,1],["Kroos","CM","",89,1],["Bale","RW","",90,1],["Benzema","ST","",88,1],["C. Ronaldo","LW","ST",95,1],
  ["Isco","AM","CM",85,0],["Danilo","RB","",80,0],["Varane","CB","",85,0],["Nacho","CB","",78,0],["James","AM","CM",84,0],["Kovačić","CM","",82,0],["L. Vázquez","RW","",78,0],["Jesé","LW","",76,0],["Casilla","GK","",78,0]]}
];
function mk(p){return{n:p[0],pos:p[1],alt:p[2]||"",r:p[3],s:p[4]?1:0};}
var byId={};D.seasons.forEach(function(s){byId[s.id]=s;});
Object.keys(ADD).forEach(function(id){
  var s=byId[id];if(!s)return;
  var have={};s.p.forEach(function(p){have[last(p.n)]=1;});
  ADD[id].forEach(function(p){if(have[last(p[0])])return;have[last(p[0])]=1;s.p.push(mk(p));});
});

NEW.forEach(function(n){
  if(byId[n.id])return;
  var s={id:n.id,club:n.club,ab:n.ab,yr:n.yr,ss:n.ss,c:n.c,coach:n.coach,fin:n.fin,p:n.p.map(mk)};
  D.seasons.push(s);byId[n.id]=s;
});
Object.keys(EXTRA).forEach(function(id){var t=byId[id];if(!t)return;var have={};t.p.forEach(function(p){have[last(p.n)]=1;});EXTRA[id].forEach(function(p){if(!have[last(p[0])])t.p.push(mk(p));});});
Object.keys(FIX).forEach(function(id){var t=byId[id];if(!t)return;Object.keys(FIX[id]).forEach(function(nm){var f=FIX[id][nm],hit=null;t.p.forEach(function(p){if(last(p.n)===last(nm))hit=p;});if(!hit)return;for(var k in f)hit[k]=f[k];});});
D.seasons.sort(function(a,b){return a.yr-b.yr;});
D.bench=true;
})(typeof window!=="undefined"?window:globalThis);
