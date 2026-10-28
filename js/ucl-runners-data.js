/* =========================================================
   UCL Runners-up — بيانات وصيف دوري أبطال أوروبا (2000–2025)
   كل موسم = النادي اللي وصل النهائي وخسر + تشكيلة النهائي.
   الـ 11 اللي عليهم s=1 هم التشكيلة الأساسية في النهائي.
   التقييمات تقديرية (مقياس شبه فيفا 70–95) وتعبّر عن مستوى اللاعب في حملة هذه البطولة.
   الصيغة: [الاسم, المركز, المركز البديل, التقييم, 1=أساسي/0=دكة]
   المراكز: GK RB LB CB DM CM AM RM LM RW LW ST
========================================================= */
(function(g){
"use strict";
var S=[];
function T(id,club,ab,yr,ss,c1,c2,coach,fin,pl){
  S.push({id:id,club:club,ab:ab,yr:yr,ss:ss,c:[c1,c2],coach:coach,fin:fin,
    p:pl.map(function(a){return{n:a[0],pos:a[1],alt:a[2]||"",r:a[3],s:a[4]?1:0};})});
}

/* ===================== 2000 ===================== */
T("val-2000-ru","Valencia","VAL",2000,"1999–00","#ee7f00","#f4f4f4","Héctor Cúper","0–3 Real Madrid",[
 ["Cañizares","GK","",88,1],["Angloma","RB","",82,1],["Đukić","CB","",81,1],["Pellegrino","CB","",83,1],
 ["Gerardo","LB","",78,1],["Farinós","DM","CM",80,1],["Mendieta","RM","CM",90,1],["Gerard","CM","",82,1],
 ["Kily González","LM","",85,1],["Angulo","AM","ST",81,1],["Claudio López","ST","",86,1],
 ["Albelda","DM","",79,0],["Adrian Ilie","ST","",80,0],["Juan Sánchez","ST","",77,0]]);

/* ===================== 2001 ===================== */
T("val-2001-ru","Valencia","VAL",2001,"2000–01","#ee7f00","#f4f4f4","Héctor Cúper","1–1 Bayern München (4–5 pens)",[
 ["Cañizares","GK","",89,1],["Angloma","RB","",82,1],["Ayala","CB","",88,1],["Pellegrino","CB","",84,1],
 ["Carboni","LB","",83,1],["Mendieta","CM","RM",90,1],["Baraja","CM","",86,1],["Kily González","LM","",85,1],
 ["Aimar","AM","",87,1],["Carew","ST","",84,1],["Juan Sánchez","ST","",78,1],
 ["Albelda","DM","",80,0],["Zahovič","AM","",81,0],["Đukić","CB","",80,0]]);

/* ===================== 2002 ===================== */
T("b04-2002-ru","Bayer Leverkusen","B04",2002,"2001–02","#e32221","#000000","Klaus Toppmöller","1–2 Real Madrid",[
 ["Butt","GK","",82,1],["Sebescen","RB","",78,1],["Lúcio","CB","",87,1],["Živković","CB","",80,1],
 ["Placente","LB","",81,1],["Ramelow","DM","",84,1],["Schneider","RM","",85,1],["Ballack","CM","",91,1],
 ["Baştürk","AM","",86,1],["Brdarić","LM","",79,1],["Neuville","ST","",85,1],
 ["Berbatov","ST","",80,0],["Kirsten","ST","",81,0],["Babić","CM","",77,0]]);

/* ===================== 2003 ===================== */
T("juv-2003-ru","Juventus","JUV",2003,"2002–03","#000000","#f4f4f4","Marcello Lippi","0–0 AC Milan (2–3 pens)",[
 ["Buffon","GK","",93,1],["Thuram","RB","",88,1],["Ferrara","CB","",82,1],["Tudor","CB","",83,1],
 ["Montero","LB","CB",84,1],["Camoranesi","RM","",84,1],["Tacchinardi","CM","",82,1],["Davids","CM","",88,1],
 ["Zambrotta","LM","",87,1],["Trezeguet","ST","",90,1],["Del Piero","ST","AM",91,1],
 ["Conte","CM","",81,0],["Zalayeta","ST","",79,0],["Birindelli","RB","",78,0]]);

/* ===================== 2004 ===================== */
T("mon-2004-ru","AS Monaco","MON",2004,"2003–04","#e51b24","#f4f4f4","Didier Deschamps","0–3 FC Porto",[
 ["Roma","GK","",82,1],["Ibarra","RB","",79,1],["Givet","CB","",78,1],["Rodríguez","CB","",79,1],
 ["Évra","LB","",84,1],["Zikos","DM","CM",77,1],["Bernardi","CM","",82,1],["Cissé","CM","",80,1],
 ["Giuly","RW","RM",87,1],["Rothen","LW","LM",83,1],["Morientes","ST","",88,1],
 ["Prso","ST","",83,0],["Adebayor","ST","",78,0],["Nonda","ST","",77,0],["Squillaci","CB","",79,0],["Plašil","CM","",80,0]]);

/* ===================== 2005 ===================== */
T("mil-2005-ru","AC Milan","MIL",2005,"2004–05","#fb090b","#111111","Carlo Ancelotti","3–3 Liverpool (2–3 pens)",[
 ["Dida","GK","",88,1],["Cafu","RB","",87,1],["Stam","CB","",89,1],["Nesta","CB","",93,1],
 ["Maldini","LB","",92,1],["Gattuso","DM","",87,1],["Pirlo","CM","",91,1],["Seedorf","CM","",89,1],
 ["Kaká","AM","",94,1],["Shevchenko","ST","",93,1],["Crespo","ST","",89,1],
 ["Serginho","LB","LM",80,0],["Rui Costa","AM","",86,0],["Tomasson","ST","",81,0]]);

/* ===================== 2006 ===================== */
T("ars-2006-ru","Arsenal","ARS",2006,"2005–06","#ef0107","#f4f4f4","Arsène Wenger","1–2 FC Barcelona",[
 ["Lehmann","GK","",85,1],["Eboué","RB","",80,1],["Touré","CB","",86,1],["Campbell","CB","",85,1],
 ["A. Cole","LB","",87,1],["Pires","RM","",84,1],["Gilberto","DM","",85,1],["Fàbregas","CM","",86,1],
 ["Hleb","LM","",82,1],["Ljungberg","AM","",84,1],["Henry","ST","",94,1],
 ["Almunia","GK","",78,0],["Flamini","CM","",79,0],["Reyes","LW","",81,0],["van Persie","ST","",82,0]]);

/* ===================== 2007 ===================== */
T("liv-2007-ru","Liverpool","LIV",2007,"2006–07","#c8102e","#f6eb61","Rafa Benítez","1–2 AC Milan",[
 ["Reina","GK","",86,1],["Finnan","RB","",81,1],["Carragher","CB","",86,1],["Agger","CB","",83,1],
 ["Riise","LB","",82,1],["Mascherano","DM","",86,1],["Alonso","CM","",87,1],["Gerrard","CM","",91,1],
 ["Pennant","RW","",80,1],["Zenden","LW","",78,1],["Kuyt","ST","",83,1],
 ["Kewell","AM","LW",81,0],["Crouch","ST","",80,0],["Arbeloa","RB","",78,0]]);

/* ===================== 2008 ===================== */
T("che-2008-ru","Chelsea","CHE",2008,"2007–08","#034694","#ffffff","Avram Grant","1–1 Manchester United (5–6 pens)",[
 ["Čech","GK","",91,1],["Essien","RB","DM",87,1],["Carvalho","CB","",88,1],["Terry","CB","",90,1],
 ["A. Cole","LB","",88,1],["Makelele","DM","",86,1],["Ballack","CM","",88,1],["Lampard","CM","",90,1],
 ["J. Cole","RW","",84,1],["Malouda","LW","",84,1],["Drogba","ST","",91,1],
 ["Kalou","ST","RW",80,0],["Anelka","ST","",85,0],["Belletti","RB","",79,0],["Mikel","DM","",81,0]]);

/* ===================== 2009 ===================== */
T("mun-2009-ru","Manchester United","MUN",2009,"2008–09","#da291c","#fbe122","Alex Ferguson","0–2 FC Barcelona",[
 ["van der Sar","GK","",90,1],["O'Shea","RB","",80,1],["Ferdinand","CB","",89,1],["Vidić","CB","",91,1],
 ["Evra","LB","",87,1],["Park","RM","",83,1],["Carrick","CM","",85,1],["Anderson","CM","",82,1],
 ["Giggs","LM","",86,1],["Ronaldo","ST","RW",94,1],["Rooney","ST","",91,1],
 ["Tévez","ST","",87,0],["Berbatov","ST","",85,0],["Scholes","CM","",86,0],["Nani","RW","",82,0]]);

/* ===================== 2010 ===================== */
T("bay-2010-ru","Bayern München","BAY",2010,"2009–10","#dc052d","#0066b2","Louis van Gaal","0–2 Inter",[
 ["Butt","GK","",82,1],["Lahm","RB","",88,1],["van Buyten","CB","",84,1],["Demichelis","CB","",83,1],
 ["Badstuber","LB","",81,1],["Altıntop","RM","",80,1],["van Bommel","DM","",85,1],["Schweinsteiger","CM","",88,1],
 ["Robben","RW","",92,1],["Müller","AM","",84,1],["Olić","ST","",83,1],
 ["Klose","ST","",85,0],["Gómez","ST","",84,0],["Tymoshchuk","DM","",81,0]]);

/* ===================== 2011 ===================== */
T("mun-2011-ru","Manchester United","MUN",2011,"2010–11","#da291c","#fbe122","Alex Ferguson","1–3 FC Barcelona",[
 ["van der Sar","GK","",89,1],["Fábio","RB","",79,1],["Ferdinand","CB","",87,1],["Vidić","CB","",90,1],
 ["Evra","LB","",86,1],["Valencia","RW","",84,1],["Carrick","CM","",85,1],["Giggs","CM","",85,1],
 ["Park","LW","",82,1],["Rooney","AM","ST",90,1],["Hernández","ST","",84,1],
 ["Nani","RW","",83,0],["Scholes","CM","",85,0],["Anderson","CM","",80,0],["Fletcher","CM","",81,0]]);

/* ===================== 2012 ===================== */
T("bay-2012-ru","Bayern München","BAY",2012,"2011–12","#dc052d","#0066b2","Jupp Heynckes","1–1 Chelsea (3–4 pens)",[
 ["Neuer","GK","",90,1],["Lahm","RB","",89,1],["Boateng","CB","",85,1],["Tymoshchuk","CB","",82,1],
 ["Contento","LB","",78,1],["Ribéry","LW","",91,1],["Schweinsteiger","CM","",89,1],["Kroos","CM","",86,1],
 ["Robben","RW","",92,1],["Müller","AM","",86,1],["Gómez","ST","",87,1],
 ["van Buyten","CB","",82,0],["Olić","ST","",82,0]]);

/* ===================== 2013 ===================== */
T("bvb-2013-ru","Borussia Dortmund","BVB",2013,"2012–13","#fde100","#000000","Jürgen Klopp","1–2 Bayern München",[
 ["Weidenfeller","GK","",84,1],["Piszczek","RB","",85,1],["Subotić","CB","",84,1],["Hummels","CB","",88,1],
 ["Schmelzer","LB","",83,1],["Bender","DM","",82,1],["Gündoğan","CM","",85,1],["Błaszczykowski","RW","",84,1],
 ["Reus","AM","LW",88,1],["Großkreutz","LW","",80,1],["Lewandowski","ST","",90,1],
 ["Şahin","CM","",83,0],["Kehl","DM","",80,0],["Schieber","ST","",77,0]]);

/* ===================== 2014 ===================== */
T("atm-2014-ru","Atlético Madrid","ATM",2014,"2013–14","#cb3524","#ffffff","Diego Simeone","1–4 Real Madrid (a.e.t.)",[
 ["Courtois","GK","",88,1],["Juanfran","RB","",83,1],["Godín","CB","",89,1],["Miranda","CB","",85,1],
 ["Filipe Luís","LB","",86,1],["Gabi","DM","",84,1],["Tiago","DM","",82,1],["Koke","CM","",85,1],
 ["Raúl García","AM","RM",83,1],["Villa","ST","",86,1],["Diego Costa","ST","",88,1],
 ["Alderweireld","CB","",82,0],["Sosa","AM","",80,0],["Adrián","ST","",78,0]]);

/* ===================== 2015 ===================== */
T("juv-2015-ru","Juventus","JUV",2015,"2014–15","#000000","#f4f4f4","Massimiliano Allegri","1–3 FC Barcelona",[
 ["Buffon","GK","",91,1],["Lichtsteiner","RB","",82,1],["Barzagli","CB","",87,1],["Bonucci","CB","",88,1],
 ["Evra","LB","",83,1],["Pirlo","DM","CM",88,1],["Marchisio","CM","",86,1],["Pogba","CM","",87,1],
 ["Vidal","CM","AM",87,1],["Tévez","ST","",88,1],["Morata","ST","",84,1],
 ["Pereyra","AM","",80,0],["Llorente","ST","",81,0],["Coman","LW","",79,0]]);

/* ===================== 2016 ===================== */
T("atm-2016-ru","Atlético Madrid","ATM",2016,"2015–16","#cb3524","#272e61","Diego Simeone","1–1 Real Madrid (3–5 pens)",[
 ["Oblak","GK","",90,1],["Juanfran","RB","",83,1],["Savić","CB","",84,1],["Godín","CB","",90,1],
 ["Filipe Luís","LB","",87,1],["Gabi","DM","CM",86,1],["Augusto","CM","",80,1],["Koke","RM","CM",87,1],
 ["Saúl","LM","CM",84,1],["Griezmann","ST","AM",91,1],["F. Torres","ST","",83,1],
 ["Carrasco","LW","LM",84,0],["Thomas","CM","DM",75,0],["Correa","AM","ST",77,0],["Giménez","CB","",78,0],["Lucas","LB","",80,0]]);

/* ===================== 2017 ===================== */
T("juv-2017-ru","Juventus","JUV",2017,"2016–17","#000000","#f4f4f4","Massimiliano Allegri","1–4 Real Madrid",[
 ["Buffon","GK","",90,1],["Barzagli","CB","RB",85,1],["Bonucci","CB","",89,1],["Chiellini","CB","",90,1],
 ["Alex Sandro","LB","",86,1],["Khedira","CM","",84,1],["Pjanic","CM","",86,1],["Marchisio","CM","",85,1],
 ["Dybala","AM","RW",87,1],["Mandžukić","ST","LW",85,1],["Higuaín","ST","",89,1],
 ["Cuadrado","RW","",83,0],["Asamoah","LB","CM",80,0],["Dani Alves","RB","",84,0]]);

/* ===================== 2018 ===================== */
T("liv-2018-ru","Liverpool","LIV",2018,"2017–18","#c8102e","#f6eb61","Jürgen Klopp","1–3 Real Madrid",[
 ["Karius","GK","",78,1],["Alexander-Arnold","RB","",82,1],["Lovren","CB","",82,1],["van Dijk","CB","",88,1],
 ["Robertson","LB","",85,1],["Wijnaldum","CM","",84,1],["Henderson","CM","",83,1],["Milner","CM","LB",82,1],
 ["Salah","RW","",91,1],["Firmino","ST","",87,1],["Mané","LW","",89,1],
 ["Can","CM","",83,0],["Lallana","AM","",80,0],["Solanke","ST","",75,0]]);

/* ===================== 2019 ===================== */
T("tot-2019-ru","Tottenham Hotspur","TOT",2019,"2018–19","#132257","#ffffff","Mauricio Pochettino","0–2 Liverpool",[
 ["Lloris","GK","",87,1],["Trippier","RB","",83,1],["Alderweireld","CB","",85,1],["Vertonghen","CB","",84,1],
 ["Rose","LB","",82,1],["Sissoko","CM","",82,1],["Winks","CM","",80,1],["Eriksen","AM","",87,1],
 ["Alli","AM","",85,1],["Son","LW","ST",87,1],["Kane","ST","",90,1],
 ["Moura","RW","ST",84,0],["Dier","DM","",81,0],["Davies","LB","",80,0]]);

/* ===================== 2020 ===================== */
T("psg-2020-ru","Paris Saint-Germain","PSG",2020,"2019–20","#004170","#da291c","Thomas Tuchel","0–1 Bayern München",[
 ["Navas","GK","",88,1],["Kehrer","RB","",78,1],["Thiago Silva","CB","",87,1],["Kimpembe","CB","",84,1],
 ["Bernat","LB","",81,1],["Marquinhos","DM","CB",86,1],["Gueye","DM","",83,1],["Verratti","CM","",87,1],
 ["Di María","RW","",87,1],["Mbappé","ST","RW",92,1],["Neymar","LW","",91,1],
 ["Herrera","CM","",82,0],["Sarabia","AM","",81,0],["Choupo-Moting","ST","",78,0]]);

/* ===================== 2021 ===================== */
T("mci-2021-ru","Manchester City","MCI",2021,"2020–21","#6cabdd","#1c2c5b","Pep Guardiola","0–1 Chelsea",[
 ["Ederson","GK","",88,1],["Walker","RB","",86,1],["Rúben Dias","CB","",88,1],["Stones","CB","",85,1],
 ["Zinchenko","LB","",81,1],["Rodri","DM","",87,1],["Gündoğan","CM","",87,1],["De Bruyne","AM","",93,1],
 ["Mahrez","RW","",87,1],["Foden","LW","AM",84,1],["Sterling","LW","",86,1],
 ["Bernardo Silva","AM","RW",88,0],["Jesus","ST","",83,0],["Cancelo","RB","LB",85,0]]);

/* ===================== 2022 ===================== */
T("liv-2022-ru","Liverpool","LIV",2022,"2021–22","#c8102e","#f6eb61","Jürgen Klopp","0–1 Real Madrid",[
 ["Alisson","GK","",91,1],["Alexander-Arnold","RB","",87,1],["Konaté","CB","",84,1],["van Dijk","CB","",91,1],
 ["Robertson","LB","",88,1],["Fabinho","DM","",87,1],["Henderson","CM","",84,1],["Thiago","CM","",88,1],
 ["Salah","RW","",91,1],["Mané","LW","",90,1],["Díaz","LW","",85,1],
 ["Keïta","CM","",82,0],["Jota","ST","",84,0],["Firmino","ST","",85,0]]);

/* ===================== 2023 ===================== */
T("int-2023-ru","Inter","INT",2023,"2022–23","#010e80","#000000","Simone Inzaghi","0–1 Manchester City",[
 ["Onana","GK","",84,1],["Darmian","RB","",80,1],["Acerbi","CB","",83,1],["Bastoni","CB","",86,1],
 ["Dimarco","LB","LM",84,1],["Barella","CM","",87,1],["Çalhanoğlu","CM","",86,1],["Mkhitaryan","CM","",83,1],
 ["Dumfries","RM","",83,1],["Lautaro","ST","",89,1],["Džeko","ST","",84,1],
 ["Brozović","DM","",85,0],["Lukaku","ST","",84,0],["Gagliardini","CM","",78,0]]);

/* ===================== 2024 ===================== */
T("bvb-2024-ru","Borussia Dortmund","BVB",2024,"2023–24","#fde100","#000000","Edin Terzić","0–2 Real Madrid",[
 ["Kobel","GK","",86,1],["Ryerson","RB","",80,1],["Hummels","CB","",84,1],["Schlotterbeck","CB","",85,1],
 ["Maatsen","LB","",81,1],["Emre Can","DM","CM",82,1],["Sabitzer","CM","",83,1],["Brandt","AM","CM",84,1],
 ["Sancho","RW","LW",83,1],["Adeyemi","LW","RW",82,1],["Füllkrug","ST","",83,1],
 ["Süle","CB","",81,0],["Reus","AM","",80,0],["Malen","RW","ST",81,0],["Haller","ST","",80,0]]);

/* ===================== 2025 ===================== */
T("int-2025-ru","Inter","INT",2025,"2024–25","#010e80","#000000","Simone Inzaghi","0–5 Paris Saint-Germain",[
 ["Sommer","GK","",85,1],["Pavard","CB","RB",83,1],["Acerbi","CB","",82,1],["Bastoni","CB","",87,1],
 ["Dumfries","RM","",84,1],["Barella","CM","",87,1],["Çalhanoğlu","CM","",86,1],["Mkhitaryan","CM","",82,1],
 ["Dimarco","LM","LB",85,1],["Thuram","ST","",86,1],["Lautaro","ST","",90,1],
 ["De Vrij","CB","",81,0],["Frattesi","CM","",80,0],["Darmian","RB","CB",78,0],["Arnautović","ST","",77,0],["Zieliński","CM","AM",80,0]]);

g.UCL_RUNNERS_DATA={version:1,provisional:true,seasons:S};
})(typeof window!=="undefined"?window:globalThis);
if(typeof module!=="undefined")module.exports=(typeof window!=="undefined"?window:globalThis).UCL_RUNNERS_DATA;
