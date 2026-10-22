/* =========================================================
   UCL — بيانات أبطال أوروبا (الإصدار التجريبي).
   كل موسم = نادي فاز باللقب + أهم لاعبي حملته. الـ 11 اللي عليهم s=1
   هم "التشكيلة الأساسية المعتادة" وبيتحسب منها قوة الفريق لما يتسحب كخصم.

   ⚠ بيانات تجريبية: الأسماء والمراكز من معرفة المؤلف والتقييمات تقديرية
   (مقياس شبه فيفا 70–99). هتتبدل بتقييمات من فيفا / القيمة السوقية
   لما نبني مصدر التقييم النهائي. الشكل: [اسم, مركز, مركز بديل, تقييم, أساسي]

   المراكز: GK RB LB CB DM CM AM RM LM RW LW ST
========================================================= */
(function(g){
"use strict";
var S=[];
function T(id,club,ab,yr,ss,c1,c2,coach,fin,pl){
  S.push({id:id,club:club,ab:ab,yr:yr,ss:ss,c:[c1,c2],coach:coach,fin:fin,
    p:pl.map(function(a){return{n:a[0],pos:a[1],alt:a[2]||"",r:a[3],s:a[4]?1:0};})});
}

T("rma-1960","Real Madrid","RMA",1960,"1959–60","#f4f4f4","#febe10","Miguel Muñoz","7–3 Eintracht Frankfurt",[
 ["Domínguez","GK","",80,1],["Marquitos","RB","CB",81,1],["Santamaría","CB","",90,1],["Pachín","LB","",80,1],
 ["Vidal","CM","RB",78,1],["Zárraga","DM","",81,1],["Canário","RW","",80,1],["Del Sol","CM","AM",86,1],
 ["Di Stéfano","ST","AM",97,1],["Puskás","ST","AM",96,1],["Gento","LW","",92,1]]);

T("mun-1968","Manchester United","MUN",1968,"1967–68","#da291c","#fbe122","Matt Busby","4–1 Benfica (a.e.t.)",[
 ["Stepney","GK","",80,1],["Brennan","RB","",73,1],["Foulkes","CB","",78,1],["Sadler","CB","ST",77,1],
 ["Dunne","LB","",83,1],["Stiles","DM","",84,1],["Crerand","CM","",84,1],["B. Charlton","CM","AM",92,1],
 ["Best","RW","AM",96,1],["Kidd","ST","",80,1],["Aston","LW","",77,1]]);

T("ajx-1972","Ajax","AJX",1972,"1971–72","#f4f4f4","#d2122e","Ștefan Kovács","2–0 Inter",[
 ["Stuy","GK","",80,1],["Suurbier","RB","",83,1],["Hulshoff","CB","",83,1],["Blankenburg","CB","",82,1],
 ["Krol","LB","CB",88,1],["Haan","DM","CB",86,1],["Neeskens","CM","",91,1],["Mühren","CM","AM",80,1],
 ["Swart","RW","",79,1],["Cruyff","ST","AM",98,1],["Keizer","LW","",84,1]]);

T("bay-1974","Bayern München","BAY",1974,"1973–74","#dc052d","#0066b2","Udo Lattek","4–0 Atlético Madrid (replay)",[
 ["Maier","GK","",92,1],["Hansen","RB","",80,1],["Schwarzenbeck","CB","",83,1],["Beckenbauer","CB","DM",97,1],
 ["Breitner","LB","CM",90,1],["Zobel","DM","",80,1],["Roth","RM","CM",83,1],["Kapellmann","CM","",78,1],
 ["U. Hoeneß","RW","ST",88,1],["G. Müller","ST","",95,1],["Torstensson","LW","",76,1]]);

T("liv-1977","Liverpool","LIV",1977,"1976–77","#c8102e","#f6eb61","Bob Paisley","3–1 Borussia Mönchengladbach",[
 ["Clemence","GK","",89,1],["Neal","RB","",83,1],["T. Smith","CB","",84,1],["E. Hughes","CB","LB",88,1],
 ["J. Jones","LB","",76,1],["Case","RM","CM",82,1],["McDermott","CM","AM",85,1],["Callaghan","CM","RM",84,1],
 ["R. Kennedy","LM","CM",81,1],["Heighway","LW","",83,1],["Keegan","ST","AM",91,1]]);

T("nfo-1979","Nottingham Forest","NFO",1979,"1978–79","#dd0000","#ffffff","Brian Clough","1–0 Malmö",[
 ["Shilton","GK","",91,1],["Anderson","RB","",82,1],["Lloyd","CB","",84,1],["Burns","CB","",80,1],
 ["Clark","LB","",78,1],["McGovern","CM","",82,1],["Bowyer","CM","RM",80,1],["O'Neill","RW","RM",83,1],
 ["Robertson","LW","",89,1],["Francis","ST","RW",88,1],["Birtles","ST","",82,1],["Gemmill","CM","AM",82,0]]);

T("avl-1982","Aston Villa","AVL",1982,"1981–82","#7b003c","#95bfe5","Tony Barton","1–0 Bayern München",[
 ["Rimmer","GK","",80,1],["Swain","RB","",76,1],["Evans","CB","",82,1],["McNaught","CB","",80,1],
 ["Williams","LB","",77,1],["Mortimer","DM","CM",84,1],["Cowans","CM","",85,1],["Bremner","RM","",78,1],
 ["Morley","LW","RW",82,1],["Shaw","ST","",82,1],["Withe","ST","",83,1],["Spink","GK","",76,0]]);

T("liv-1984","Liverpool","LIV",1984,"1983–84","#c8102e","#f6eb61","Joe Fagan","1–1 Roma (4–2 pens)",[
 ["Grobbelaar","GK","",85,1],["Neal","RB","",84,1],["Lawrenson","CB","",86,1],["Hansen","CB","",91,1],
 ["A. Kennedy","LB","",82,1],["Johnston","RM","",80,0],["Souness","CM","DM",93,1],["Whelan","CM","LM",84,1],
 ["S. Lee","CM","",78,1],["Dalglish","AM","ST",93,1],["Rush","ST","",93,1],["Nicol","RB","CM",80,1],["Robinson","ST","",76,0]]);

T("mil-1989","AC Milan","MIL",1989,"1988–89","#fb090b","#111111","Arrigo Sacchi","4–0 Steaua București",[
 ["Galli","GK","",83,1],["Tassotti","RB","",82,1],["Costacurta","CB","",80,1],["Baresi","CB","DM",94,1],
 ["Maldini","LB","CB",89,1],["Colombo","LM","",77,1],["Ancelotti","CM","",85,1],["Rijkaard","DM","CM",91,1],
 ["Donadoni","RM","RW",87,1],["Gullit","AM","ST",94,1],["Van Basten","ST","",97,1],["Evani","CM","",78,0]]);

T("bar-1992","FC Barcelona","BAR",1992,"1991–92","#a50044","#004d98","Johan Cruyff","1–0 Sampdoria (a.e.t.)",[
 ["Zubizarreta","GK","",86,1],["Ferrer","RB","CB",83,1],["Nando","CB","",79,1],["Koeman","CB","DM",91,1],
 ["Juan Carlos","LB","",77,1],["Eusebio","DM","",80,1],["Guardiola","DM","CM",88,1],["Bakero","CM","",83,1],
 ["Laudrup","AM","",93,1],["Stoichkov","LW","ST",93,1],["Salinas","ST","",82,1],["Amor","CM","",81,0],["Begiristain","RW","AM",82,0]]);

T("om-1993","Olympique de Marseille","OM",1993,"1992–93","#2faee0","#ffffff","Raymond Goethals","1–0 AC Milan",[
 ["Barthez","GK","",84,1],["Angloma","RB","",80,1],["Boli","CB","",82,1],["Desailly","CB","DM",88,1],
 ["Di Meco","LB","",78,1],["Sauzée","RM","CM",82,1],["Deschamps","DM","",82,1],["Eydelie","CM","",76,1],
 ["Abedi Pelé","AM","LW",89,1],["Völler","ST","",87,1],["Boksić","ST","LW",84,1]]);

T("mil-1994","AC Milan","MIL",1994,"1993–94","#fb090b","#111111","Fabio Capello","4–0 FC Barcelona",[
 ["Rossi","GK","",84,1],["Panucci","RB","",82,1],["Costacurta","CB","",81,1],["Baresi","CB","DM",93,1],
 ["Maldini","LB","CB",91,1],["Donadoni","RM","RW",85,1],["Desailly","DM","CB",89,1],["Albertini","CM","",86,1],
 ["Savićević","AM","LW",91,1],["Massaro","ST","",84,1],["Papin","ST","",87,1],["Tassotti","RB","",83,0],["Boban","AM","CM",86,0]]);

T("ajx-1995","Ajax","AJX",1995,"1994–95","#f4f4f4","#d2122e","Louis van Gaal","1–0 AC Milan",[
 ["Van der Sar","GK","",86,1],["Reiziger","RB","",81,1],["Blind","CB","DM",86,1],["F. de Boer","CB","LB",88,1],
 ["Rijkaard","DM","CM",88,1],["Seedorf","CM","DM",85,1],["Davids","CM","DM",87,1],["Litmanen","AM","ST",91,1],
 ["Finidi","RW","",83,1],["Overmars","LW","",89,1],["Kluivert","ST","",85,1],["R. de Boer","RW","AM",83,0]]);

T("juv-1996","Juventus","JUV",1996,"1995–96","#f4f4f4","#111111","Marcello Lippi","1–1 Ajax (4–2 pens)",[
 ["Peruzzi","GK","",89,1],["Torricelli","RB","CB",82,1],["Ferrara","CB","",87,1],["Vierchowod","CB","",84,1],
 ["Pessotto","LB","",80,1],["Di Livio","RM","",78,1],["Deschamps","DM","",86,1],["Conte","CM","",85,1],
 ["Del Piero","AM","LW",90,1],["Vialli","ST","",87,1],["Ravanelli","ST","",87,1],["Paulo Sousa","CM","",85,0],["Jugović","CM","",82,0]]);

T("bvb-1997","Borussia Dortmund","BVB",1997,"1996–97","#fde100","#111111","Ottmar Hitzfeld","3–1 Juventus",[
 ["Klos","GK","",85,1],["Reuter","RB","",83,1],["Kohler","CB","",88,1],["Sammer","CB","DM",92,1],
 ["Heinrich","LB","",82,1],["Lambert","DM","CM",81,1],["Zorc","DM","CM",81,1],["Paulo Sousa","CM","",87,1],
 ["Möller","AM","",89,1],["Riedle","ST","",87,1],["Chapuisat","ST","LW",85,1],["J. César","CB","",82,0],["Ricken","AM","",78,0]]);

T("rma-1998","Real Madrid","RMA",1998,"1997–98","#f4f4f4","#febe10","Jupp Heynckes","1–0 Juventus",[
 ["Illgner","GK","",84,1],["Panucci","RB","",82,1],["Hierro","CB","DM",90,1],["Sanchís","CB","",83,1],
 ["Roberto Carlos","LB","",91,1],["Karembeu","RM","RB",81,1],["Redondo","DM","CM",90,1],["Seedorf","CM","",87,1],
 ["Raúl","ST","AM",90,1],["Mijatović","ST","",88,1],["Šuker","ST","LW",86,1]]);

T("mun-1999","Manchester United","MUN",1999,"1998–99","#da291c","#fbe122","Alex Ferguson","2–1 Bayern München",[
 ["Schmeichel","GK","",91,1],["G. Neville","RB","",84,1],["Johnsen","CB","",82,1],["Stam","CB","",90,1],
 ["Irwin","LB","CB",84,1],["Beckham","RM","RW",91,1],["Keane","CM","",91,1],["Scholes","CM","AM",89,1],
 ["Giggs","LM","LW",90,1],["Yorke","ST","",91,1],["Andy Cole","ST","",87,1],["Sheringham","ST","AM",85,0],
 ["Solskjær","ST","",86,0],["Blomqvist","LM","",80,0],["Butt","CM","DM",78,0]]);

T("rma-2000","Real Madrid","RMA",2000,"1999–2000","#f4f4f4","#febe10","Vicente del Bosque","3–0 Valencia",[
 ["Casillas","GK","",84,1],["Salgado","RB","",85,1],["Hierro","CB","DM",89,1],["Campo","CB","DM",80,1],
 ["Roberto Carlos","LB","",92,1],["Helguera","DM","CB",81,1],["Redondo","CM","DM",89,1],["McManaman","CM","AM",85,1],
 ["Raúl","ST","AM",91,1],["Morientes","ST","",86,1],["Anelka","ST","LW",82,1],["Savio","LW","",80,0]]);

T("bay-2001","Bayern München","BAY",2001,"2000–01","#dc052d","#0066b2","Ottmar Hitzfeld","1–1 Valencia (5–4 pens)",[
 ["Kahn","GK","",93,1],["Sagnol","RB","",82,1],["Kuffour","CB","",83,1],["Linke","CB","",82,1],
 ["Lizarazu","LB","",87,1],["Effenberg","CM","",89,1],["Jeremies","DM","",80,1],["Scholl","AM","CM",85,1],
 ["Salihamidžić","RM","RW",82,1],["Élber","ST","LW",87,1],["Jancker","ST","",80,1],["Zickler","ST","",80,0],["Hargreaves","DM","RB",80,0],["Andersson","CB","",83,0]]);

T("rma-2002","Real Madrid","RMA",2002,"2001–02","#f4f4f4","#febe10","Vicente del Bosque","2–1 Bayer Leverkusen",[
 ["Casillas","GK","",86,1],["Salgado","RB","",86,1],["Hierro","CB","DM",87,1],["Helguera","CB","DM",80,1],
 ["Roberto Carlos","LB","",92,1],["Makélélé","DM","",88,1],["McManaman","CM","AM",83,1],["Zidane","AM","CM",97,1],
 ["Figo","RW","RM",94,1],["Raúl","ST","AM",91,1],["Morientes","ST","",85,1],["Solari","LW","LM",80,0],["Flávio Conceição","CM","",80,0]]);

T("mil-2003","AC Milan","MIL",2003,"2002–03","#fb090b","#111111","Carlo Ancelotti","0–0 Juventus (3–2 pens)",[
 ["Dida","GK","",88,1],["Pancaro","RB","",78,1],["Nesta","CB","",92,1],["Maldini","LB","CB",91,1],
 ["Kaladze","LB","CB",80,1],["Gattuso","DM","CM",86,1],["Pirlo","DM","CM",90,1],["Seedorf","CM","AM",88,1],
 ["Rui Costa","AM","CM",88,1],["Shevchenko","ST","LW",94,1],["Inzaghi","ST","",88,1],["Costacurta","CB","",74,0],
 ["Roque Júnior","CB","",80,0],["Ambrosini","CM","",82,0]]);

T("liv-2005","Liverpool","LIV",2005,"2004–05","#c8102e","#f6eb61","Rafael Benítez","3–3 AC Milan (3–2 pens)",[
 ["Dudek","GK","",82,1],["Finnan","RB","",80,1],["Carragher","CB","RB",87,1],["Hyypiä","CB","",87,1],
 ["Riise","LB","LM",82,1],["Hamann","DM","",82,1],["X. Alonso","CM","DM",88,1],["Gerrard","CM","AM",93,1],
 ["Luis García","AM","LW",84,1],["Baroš","ST","",82,1],["Cissé","ST","",83,0],["Kewell","LW","",82,1],
 ["Šmicer","RM","",80,0],["Traoré","LB","",73,0]]);
/* ↑ Baroš/Kewell: بدايتهم في النهائي متأكد منها من صفحة النهائي (ويكيبيديا) */

T("bar-2006","FC Barcelona","BAR",2006,"2005–06","#a50044","#004d98","Frank Rijkaard","2–1 Arsenal",[
 ["Valdés","GK","",85,1],["Belletti","RB","",80,1],["Puyol","CB","RB",90,1],["Márquez","CB","DM",87,1],
 ["Van Bronckhorst","LB","",81,1],["Edmílson","DM","CB",81,1],["Van Bommel","DM","CM",84,1],["Deco","AM","CM",92,1],
 ["Ronaldinho","LW","AM",97,1],["Eto'o","ST","",92,1],["Giuly","RW","",83,1],["Xavi","CM","",90,0],
 ["Iniesta","CM","",86,0],["Larsson","ST","",87,0],["Messi","RW","AM",85,0],["Oleguer","RB","CB",76,0]]);

T("mil-2007","AC Milan","MIL",2007,"2006–07","#fb090b","#111111","Carlo Ancelotti","2–1 Liverpool",[
 ["Dida","GK","",86,1],["Oddo","RB","",81,1],["Nesta","CB","",91,1],["Maldini","CB","LB",91,1],
 ["Jankulovski","LB","",82,1],["Gattuso","DM","CM",87,1],["Pirlo","DM","CM",91,1],["Ambrosini","CM","",85,1],
 ["Seedorf","AM","CM",89,1],["Kaká","AM","ST",96,1],["Inzaghi","ST","",88,1],["Cafu","RB","",82,0],
 ["Gilardino","ST","",83,0],["Kaladze","LB","CB",78,0]]);

T("mun-2008","Manchester United","MUN",2008,"2007–08","#da291c","#fbe122","Alex Ferguson","1–1 Chelsea (6–5 pens)",[
 ["Van der Sar","GK","",89,1],["W. Brown","RB","CB",80,1],["Ferdinand","CB","",90,1],["Vidić","CB","",91,1],
 ["Evra","LB","",88,1],["Hargreaves","DM","RM",85,1],["Carrick","CM","DM",86,1],["Scholes","CM","",88,1],
 ["Giggs","LM","CM",85,0],["C. Ronaldo","RW","LW",97,1],["Rooney","ST","LW",90,1],["Tévez","ST","",86,1],
 ["Nani","RW","",80,0],["Anderson","CM","",80,0]]);

T("bar-2009","FC Barcelona","BAR",2009,"2008–09","#a50044","#004d98","Pep Guardiola","2–0 Manchester United",[
 ["Valdés","GK","",86,1],["Alves","RB","",90,1],["Puyol","CB","",90,1],["Piqué","CB","",89,1],
 ["Abidal","LB","CB",85,1],["Y. Touré","DM","CB",88,1],["Xavi","CM","",93,1],["Iniesta","CM","",93,1],
 ["Messi","RW","AM",97,1],["Eto'o","ST","",91,1],["Henry","LW","ST",90,1],["Márquez","CB","",85,0],
 ["Busquets","DM","",82,0],["Keita","CM","",82,0],["Pedro","RW","LW",84,0]]);

T("int-2010","Inter","INT",2010,"2009–10","#0068a8","#111111","José Mourinho","2–0 Bayern München",[
 ["J. César","GK","",90,1],["Maicon","RB","",91,1],["Lúcio","CB","",91,1],["Samuel","CB","",88,1],
 ["Chivu","LB","CB",85,1],["Zanetti","RM","DM",87,1],["Cambiasso","DM","CM",86,1],["Sneijder","AM","",94,1],
 ["Eto'o","RW","ST",91,1],["Milito","ST","",93,1],["Pandev","LW","",82,1],["Motta","CM","",83,0],["Stanković","CM","AM",83,0]]);

T("bar-2011","FC Barcelona","BAR",2011,"2010–11","#a50044","#004d98","Pep Guardiola","3–1 Manchester United",[
 ["Valdés","GK","",87,1],["Alves","RB","",89,1],["Piqué","CB","",90,1],["Mascherano","CB","DM",88,1],
 ["Abidal","LB","CB",85,1],["Busquets","DM","",89,1],["Xavi","CM","",94,1],["Iniesta","CM","",94,1],
 ["Pedro","RW","LW",87,1],["Messi","RW","ST",99,1],["Villa","LW","ST",89,1],["Puyol","CB","",89,0],["Keita","CM","",82,0]]);

T("che-2012","Chelsea","CHE",2012,"2011–12","#034694","#ffffff","Roberto Di Matteo","1–1 Bayern München (4–3 pens)",[
 ["Čech","GK","",89,1],["Ivanović","RB","CB",84,1],["Terry","CB","",85,1],["D. Luiz","CB","",84,1],
 ["Ashley Cole","LB","",87,1],["Mikel","DM","",80,1],["Lampard","CM","AM",88,1],["Ramires","CM","RM",85,1],
 ["Mata","AM","RW",87,1],["Malouda","LW","",80,1],["Drogba","ST","",91,1],["Bosingwa","RB","",78,0],
 ["Cahill","CB","",83,0],["Essien","DM","CM",82,0],["Kalou","RW","",78,0],["Torres","ST","",80,0]]);

T("bay-2013","Bayern München","BAY",2013,"2012–13","#dc052d","#0066b2","Jupp Heynckes","2–1 Borussia Dortmund",[
 ["Neuer","GK","",92,1],["Lahm","RB","DM",91,1],["Dante","CB","",84,1],["Boateng","CB","",85,1],
 ["Alaba","LB","",85,1],["J. Martínez","DM","CB",87,1],["Schweinsteiger","CM","DM",90,1],["T. Müller","RW","AM",88,1],
 ["Robben","RW","",93,1],["Ribéry","LW","",93,1],["Mandžukić","ST","",87,1],["Kroos","CM","AM",87,0],["Gómez","ST","",85,0]]);

T("rma-2014","Real Madrid","RMA",2014,"2013–14","#f4f4f4","#febe10","Carlo Ancelotti","4–1 Atlético Madrid (a.e.t.)",[
 ["Casillas","GK","",88,1],["Carvajal","RB","",82,1],["Varane","CB","",84,1],["Ramos","CB","",90,1],
 ["Marcelo","LB","",87,1],["X. Alonso","DM","CM",90,1],["Modrić","CM","",90,1],["Di María","RW","CM",90,1],
 ["Bale","RW","LW",92,1],["Benzema","ST","",90,1],["C. Ronaldo","LW","ST",97,1],["Pepe","CB","",85,0],
 ["Khedira","CM","DM",85,0],["Isco","AM","",84,0],["Coentrão","LB","",80,0]]);

T("bar-2015","FC Barcelona","BAR",2015,"2014–15","#a50044","#004d98","Luis Enrique","3–1 Juventus",[
 ["ter Stegen","GK","",87,1],["Alves","RB","",88,1],["Piqué","CB","",90,1],["Mascherano","CB","DM",88,1],
 ["Alba","LB","",87,1],["Busquets","DM","",91,1],["Rakitić","CM","",88,1],["Iniesta","CM","",92,1],
 ["Messi","RW","ST",98,1],["Suárez","ST","",93,1],["Neymar","LW","",92,1],["Xavi","CM","",88,0],
 ["Pedro","LW","RW",84,0],["Mathieu","CB","LB",80,0]]);

T("rma-2017","Real Madrid","RMA",2017,"2016–17","#f4f4f4","#febe10","Zinedine Zidane","4–1 Juventus",[
 ["Navas","GK","",88,1],["Carvajal","RB","",86,1],["Varane","CB","",87,1],["Ramos","CB","",91,1],
 ["Marcelo","LB","",90,1],["Casemiro","DM","",89,1],["Modrić","CM","",91,1],["Kroos","CM","",91,1],
 ["Isco","AM","",89,1],["C. Ronaldo","ST","LW",96,1],["Benzema","ST","",89,1],["Bale","RW","",87,0],
 ["Nacho","CB","",80,0],["Danilo","RB","",80,0],["Asensio","AM","RW",81,0]]);

T("rma-2018","Real Madrid","RMA",2018,"2017–18","#f4f4f4","#febe10","Zinedine Zidane","3–1 Liverpool",[
 ["Navas","GK","",88,1],["Carvajal","RB","",85,1],["Varane","CB","",88,1],["Ramos","CB","",91,1],
 ["Marcelo","LB","",88,1],["Casemiro","DM","",89,1],["Modrić","CM","",92,1],["Kroos","CM","",91,1],
 ["Isco","AM","",87,1],["C. Ronaldo","ST","LW",95,1],["Benzema","ST","",88,1],["Bale","RW","",88,0],
 ["Nacho","CB","",80,0],["Lucas Vázquez","RW","RM",80,0],["Asensio","AM","RW",82,0]]);

T("liv-2019","Liverpool","LIV",2019,"2018–19","#c8102e","#f6eb61","Jürgen Klopp","2–0 Tottenham Hotspur",[
 ["Alisson","GK","",90,1],["Alexander-Arnold","RB","",85,1],["Matip","CB","",82,1],["Van Dijk","CB","",93,1],
 ["Robertson","LB","",87,1],["Fabinho","DM","CM",87,1],["Henderson","CM","",84,1],["Wijnaldum","CM","",84,1],
 ["Salah","RW","ST",92,1],["Mané","LW","ST",91,1],["Firmino","ST","AM",87,1],["Gomez","CB","RB",78,0],
 ["Milner","CM","LB",80,0],["Origi","ST","",74,0],["Shaqiri","RW","AM",78,0],["Keïta","CM","",80,0]]);

T("bay-2020","Bayern München","BAY",2020,"2019–20","#dc052d","#0066b2","Hansi Flick","1–0 Paris Saint-Germain",[
 ["Neuer","GK","",93,1],["Pavard","RB","CB",82,1],["Boateng","CB","",85,1],["Alaba","CB","LB",88,1],
 ["Davies","LB","LM",87,1],["Kimmich","DM","RB",89,1],["Goretzka","CM","",87,1],["T. Müller","AM","RW",89,1],
 ["Gnabry","RW","",87,1],["Coman","LW","",86,1],["Lewandowski","ST","",97,1],["Thiago","CM","DM",90,0],
 ["Süle","CB","",82,0],["Perišić","LW","LM",84,0]]);

T("che-2021","Chelsea","CHE",2021,"2020–21","#034694","#ffffff","Thomas Tuchel","1–0 Manchester City",[
 ["E. Mendy","GK","",88,1],["James","RB","RM",83,1],["T. Silva","CB","",87,1],["Rüdiger","CB","",85,1],
 ["Chilwell","LB","",85,1],["Jorginho","DM","CM",86,1],["Kanté","DM","CM",90,1],["Mount","AM","CM",84,1],
 ["Havertz","AM","ST",82,1],["Pulisic","RW","",81,0],["Werner","LW","ST",80,1],["Azpilicueta","CB","RB",83,1],
 ["Christensen","CB","",82,0],["Kovačić","CM","",85,0]]);

T("rma-2022","Real Madrid","RMA",2022,"2021–22","#f4f4f4","#febe10","Carlo Ancelotti","1–0 Liverpool",[
 ["Courtois","GK","",94,1],["Carvajal","RB","",87,1],["Militão","CB","",87,1],["Alaba","CB","LB",87,1],
 ["F. Mendy","LB","",84,1],["Casemiro","DM","",89,1],["Kroos","CM","",90,1],["Modrić","CM","",91,1],
 ["Valverde","CM","RW",87,1],["Benzema","ST","",96,1],["Vinícius","LW","",91,1],["Rodrygo","RW","",84,0],
 ["Camavinga","CM","",83,0],["Asensio","RW","AM",82,0],["Nacho","CB","",80,0],["Marcelo","LB","",82,0]]);

T("mci-2023","Manchester City","MCI",2023,"2022–23","#6cabdd","#1c2c5b","Pep Guardiola","1–0 Inter",[
 ["Ederson","GK","",90,1],["Walker","RB","",87,1],["Rúben Dias","CB","",89,1],["Akanji","CB","",84,1],
 ["Aké","LB","CB",85,1],["Rodri","DM","CM",91,1],["Gündoğan","CM","",88,1],["De Bruyne","AM","CM",94,1],
 ["B. Silva","RW","AM",89,1],["Haaland","ST","",94,1],["Foden","LW","AM",87,1],["Stones","CB","DM",88,0],
 ["Grealish","LW","",85,0],["J. Álvarez","ST","",80,0]]);

T("rma-2024","Real Madrid","RMA",2024,"2023–24","#f4f4f4","#febe10","Carlo Ancelotti","2–0 Borussia Dortmund",[
 ["Courtois","GK","",91,1],["Carvajal","RB","",87,1],["Rüdiger","CB","",88,1],["Nacho","CB","",83,1],
 ["F. Mendy","LB","",83,1],["Tchouaméni","DM","CB",86,1],["Kroos","CM","",91,1],["Valverde","CM","RW",89,1],
 ["Bellingham","AM","CM",93,1],["Vinícius","LW","",93,1],["Rodrygo","RW","",87,1],["Modrić","CM","",89,0],
 ["Camavinga","CM","LB",85,0],["Joselu","ST","",78,0],["Lunin","GK","",82,0]]);

T("psg-2025","Paris Saint-Germain","PSG",2025,"2024–25","#004170","#da291c","Luis Enrique","5–0 Inter",[
 ["Donnarumma","GK","",91,1],["Hakimi","RB","",89,1],["Marquinhos","CB","DM",88,1],["Pacho","CB","",83,1],
 ["Nuno Mendes","LB","",88,1],["Vitinha","CM","",89,1],["J. Neves","CM","DM",86,1],["Fabián Ruiz","CM","",86,1],
 ["Doué","RW","AM",86,1],["Kvaratskhelia","LW","",90,1],["Dembélé","ST","RW",94,1],["Barcola","LW","",84,0],
 ["Zaïre-Emery","CM","RB",83,0],["Beraldo","CB","",78,0]]);

g.UCL_DATA={version:1,provisional:true,seasons:S};
})(typeof window!=="undefined"?window:globalThis);
if(typeof module!=="undefined")module.exports=(typeof window!=="undefined"?window:globalThis).UCL_DATA;
