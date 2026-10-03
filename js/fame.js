/* =========================================================
   مستوى الشهرة — بيستخدم في ترتيب دك «أنا مين» و«الانتقالات»
   3 = نجوم الكل عارفهم · 2 = معروفين لمتابع الكورة · 1 = أسماء أصعب/أقدم
   أي اسم مش مكتوب هنا بيتحسب مستوى 1.
   لإضافة لاعب جديد: اكتب اسمه (زي ما هو في الداتا) في القايمة المناسبة.
   الدك بيتخلط بطريقة موزونة: المعروفين بيطلعوا أكتر وبدري،
   والأصعب لسه بيطلعوا بس أقل.
========================================================= */
const FAME_T3=[
"Diego Maradona","Lionel Messi","Cristiano Ronaldo","Zinedine Zidane","Ronaldinho","Neymar","Kylian Mbappé","Erling Haaland",
"Kevin De Bruyne","Mohamed Salah","Robert Lewandowski","Luis Suárez","Zlatan Ibrahimović","David Beckham","Wayne Rooney",
"Didier Drogba","Mohamed Aboutrika","Sergio Ramos","Iker Casillas","Ronaldo Nazário","Luka Modrić","Andrés Iniesta","Xavi",
"Karim Benzema","Pep Guardiola","José Mourinho","Sir Alex Ferguson","Alex Ferguson","Carlo Ancelotti","Jürgen Klopp","Vinícius Júnior",
"Jude Bellingham","Mohamed Elneny","Ahmed Hassan","Hossam Hassan","Essam El Hadary","Mido","Mohamed Zidan",
"Mahmoud Hassan Trezeguet","Shikabala","Omar Marmoush","Harry Kane","Thibaut Courtois","Romelu Lukaku","Eden Hazard","Sadio Mané","Riyad Mahrez"
];
const FAME_T2=[
"Cafu","Roberto Carlos","Andrea Pirlo","Roberto Baggio","Francesco Totti","Gianluigi Buffon","Manuel Neuer","Thierry Henry","Kaká",
"Luís Figo","Sergio Agüero","Samuel Eto'o","Virgil van Dijk","Arjen Robben","Wesley Sneijder","Dennis Bergkamp","Robin van Persie",
"Eric Cantona","Steven Gerrard","Frank Lampard","Rodri","Rivaldo","Paolo Maldini","Johan Cruyff","Radamel Falcao","James Rodríguez",
"Miroslav Klose","Philipp Lahm","Raúl González","Fabio Cannavaro","Deco","Ruud van Nistelrooy","Michael Owen","Alan Shearer",
"Robert Pirès","Diego Simeone","Arsène Wenger","Antonio Conte","Fabio Capello","Mikel Arteta","Luis Enrique","Xabi Alonso",
"Thomas Tuchel","Unai Emery","Massimiliano Allegri","Erik ten Hag","Joachim Löw","Didier Deschamps","Rafael Benítez","Louis van Gaal",
"Vicente del Bosque","Marcelo Bielsa","Jürgen Klinsmann","Mostafa Mohamed","Ahmed Elmohamady","Wael Gomaa","Amr Zaki","Emad Moteab",
"Mohamed Nagy Gedo","Ahmed Hegazy","Ahmed Fathy","Hazem Emam","Hany Ramzy","Mohamed Shawky","Hosny Abd Rabou","Ramadan Sobhi",
"Hassan Shehata","Sam Morsy","Mauricio Pochettino","Fernando Torres","David Villa","Cesc Fàbregas","Gareth Bale","Mesut Özil",
"Son Heung-min","Andriy Shevchenko","Carlos Tevez","Ángel Di María","Yaya Touré","Jay-Jay Okocha","Dani Alves","Patrick Vieira",
"Paulo Dybala","Bernardo Silva","Trent Alexander-Arnold","Bruno Guimarães","Enzo Fernández","Gabriel Jesus","Mauro Icardi"
];
const FAME_W={3:1,2:.5,1:.15};

function fameNorm(n){
  return String(n||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]/g,"").toLowerCase();
}
const FAME_TIER=(function(){
  const m={};
  FAME_T2.forEach(n=>{m[fameNorm(n)]=2;});
  FAME_T3.forEach(n=>{m[fameNorm(n)]=3;});
  return m;
})();
function fameTier(name){return FAME_TIER[fameNorm(name)]||1;}

/* خلط موزون (Efraimidis–Spirakis): الدك بيتسحب من الآخر (pop)، فالأعلى شهرة في الآخر */
function weightedDeck(indices,nameOf){
  return indices
    .map(i=>({i:i,k:Math.pow(Math.random()||1e-9,1/FAME_W[fameTier(nameOf(i))])}))
    .sort((a,b)=>a.k-b.k)
    .map(o=>o.i);
}

/* =========================================================
   ذاكرة «اللي اتلعب قبل كده» — بتفضل محفوظة بين الألعاب والريسيت
   لاعب بيتسجل أول ما يظهر، ومش بيرجع تاني غير بعد ما كل اللاعبين
   يتلعبوا (دورة كاملة)، وبعدها آخر 8 لاعبين بيتأخروا في الدورة الجديدة.
========================================================= */
function seenGet(key){
  try{const a=JSON.parse(localStorage.getItem("seen_"+key));return Array.isArray(a)?a:[];}catch(e){return [];}
}
function seenSave(key,a){
  try{localStorage.setItem("seen_"+key,JSON.stringify(a.slice(-600)));}catch(e){}
}
function seenAdd(key,name){
  const a=seenGet(key).filter(n=>n!==name);a.push(name);seenSave(key,a);
}
function seenRemove(key,name){
  seenSave(key,seenGet(key).filter(n=>n!==name));
}
function freshDeck(key,indices,nameOf){
  const seen=seenGet(key);
  const inSeen=new Set(seen);
  const fresh=indices.filter(i=>!inSeen.has(nameOf(i)));
  if(fresh.length)return weightedDeck(fresh,nameOf);
  /* دورة جديدة: امسح اللي في البول، وآخر 8 يتأخروا */
  const recent=new Set(seen.slice(-8));
  const pool=new Set(indices.map(nameOf));
  seenSave(key,seen.filter(n=>!pool.has(n)));
  const late=indices.filter(i=>recent.has(nameOf(i)));
  const rest=indices.filter(i=>!recent.has(nameOf(i)));
  return late.concat(weightedDeck(rest,nameOf)); /* اللي في الأول بيتسحب آخر حاجة */
}
