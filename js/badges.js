/* =========================================================
   Badges & Achievements (shared by online.js / online-social.js)
   - PPB.TIERS      : admin-granted rank badges (each one has its own icon + colors)
   - PPB.ACH        : achievements, computed from the stats the site already keeps
   - PPB.level      : player level from points + sessions
   - PPB.usersView  : search / filter / sort for the admin Users page (pure function)
   - PPB.css()      : all styles for the above (appended to the online.js stylesheet)
   Nothing here writes to the database.
========================================================= */
(function(){
var P=window.PPB={};
var GK=["flags","story","career","xo","ludo","sudoku","tawla","blackjack"];

/* ---------- icons (24x24 stroke paths, drawn with CSS mask so they take any color) ---------- */
var ICONS={
 medal:"<circle cx='12' cy='9' r='5'/><path d='M8.6 13.3L7 21l5-3 5 3-1.6-7.7'/>",
 star:"<path d='M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'/>",
 trophy:"<path d='M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z'/><path d='M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3'/>",
 hexa:"<path d='M12 3l8 4.5v9L12 21l-8-4.5v-9z'/><path d='M12 8v8M8.5 10l7 4M15.5 10l-7 4'/>",
 sparkle:"<path d='M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z'/><path d='M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z'/>",
 leaf:"<path d='M5 19c0-8 5-14 15-14 0 10-6 15-14 15'/><path d='M5 19l8-8'/>",
 heart:"<path d='M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'/>",
 gem:"<path d='M6 4h12l3 5-9 11L3 9z'/><path d='M3 9h18M9 4L7.5 9 12 20M15 4l1.5 5L12 20'/>",
 target:"<circle cx='12' cy='12' r='8.5'/><circle cx='12' cy='12' r='4.5'/><circle cx='12' cy='12' r='.8'/>",
 bolt:"<path d='M13 2L4 14h7l-1 8 9-12h-7z'/>",
 flame:"<path d='M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4.2.2 1.4 1 2 1.8 2.2C10.5 8 11 5.5 12 3z'/>",
 snow:"<path d='M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9'/><path d='M9.5 4.6L12 7l2.5-2.4M9.5 19.4L12 17l2.5 2.4'/>",
 crown:"<path d='M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z'/><path d='M5 21h14'/>",
 shield:"<path d='M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'/><path d='M12 8l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3L7.7 11l3-.4z'/>",
 ghost:"<path d='M5 21V11a7 7 0 0 1 14 0v10l-3-2-2 2-2-2-2 2-2-2z'/><circle cx='9.5' cy='11' r='1'/><circle cx='14.5' cy='11' r='1'/>",
 skull:"<path d='M12 3a8 8 0 0 0-8 8c0 3 1.5 4.8 3 5.8V20h10v-3.2c1.5-1 3-2.8 3-5.8a8 8 0 0 0-8-8z'/><circle cx='9' cy='11.5' r='1.3'/><circle cx='15' cy='11.5' r='1.3'/><path d='M10 20v-2M14 20v-2'/>",
 flag:"<path d='M5 21V4M5 4h12l-2.5 4L17 12H5'/>",
 globe:"<circle cx='12' cy='12' r='9'/><path d='M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18'/>",
 search:"<circle cx='11' cy='11' r='6.5'/><path d='M16 16l5 5'/>",
 grid:"<rect x='4' y='4' width='16' height='16' rx='2.5'/><path d='M9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16'/>",
 dice:"<rect x='4' y='4' width='16' height='16' rx='3.5'/><circle cx='9' cy='9' r='.9'/><circle cx='15' cy='15' r='.9'/><circle cx='12' cy='12' r='.9'/>",
 hash:"<path d='M9 4v16M15 4v16M4 9h16M4 15h16'/>",
 swap:"<path d='M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4'/>",
 clock:"<circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 2'/>",
 check:"<path d='M4 12.5l5 5L20 6.5'/>",
 lock:"<rect x='5' y='11' width='14' height='9' rx='2'/><path d='M8 11V8a4 4 0 0 1 8 0v3'/>",
 rocket:"<path d='M12 3c3 2 4.5 5.5 4.5 9L14 15h-4l-2.5-3C7.5 8.5 9 5 12 3z'/><circle cx='12' cy='9' r='1.4'/><path d='M10 15l-1.5 4.5M14 15l1.5 4.5M12 17v4'/>",
 compass:"<circle cx='12' cy='12' r='9'/><path d='M15.5 8.5l-2 5-5 2 2-5z'/>",
 bulb:"<path d='M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.8c.7.6 1 1.4 1 2.2h5c0-.8.3-1.6 1-2.2A6 6 0 0 0 12 3z'/>",
 layers:"<path d='M12 3l9 5-9 5-9-5z'/><path d='M3 12.5l9 5 9-5M3 16.5l9 5 9-5'/>",
 users:"<circle cx='9' cy='8' r='3.2'/><path d='M3 20c0-3.6 2.7-5.5 6-5.5s6 1.9 6 5.5M16 5a3.2 3.2 0 0 1 0 6M18 14.8c2 .7 3 2.4 3 5.2'/>",
 key:"<circle cx='8' cy='15' r='4'/><path d='M11 12l9-9M16 7l3 3M14 9l2 2'/>",
 percent:"<path d='M19 5L5 19'/><circle cx='7' cy='7' r='2.4'/><circle cx='17' cy='17' r='2.4'/>",
 coins:"<ellipse cx='12' cy='6' rx='7' ry='3'/><path d='M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6'/>",
 who:"<circle cx='12' cy='8' r='3.5'/><path d='M5 20c0-4 3-6 7-6s7 2 7 6'/>",
 board:"<rect x='3' y='5' width='18' height='14' rx='2.5'/><path d='M6.5 5l1.6 6 1.6-6M14.3 19l1.6-6 1.6 6'/>",
 eye:"<path d='M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z'/><circle cx='12' cy='12' r='3'/>"
};
function svg(p){return'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'>'+p+'</svg>")';}
P.ic=function(n){return'<i class="ol-i" style="--ic:var(--b-'+(ICONS[n]?n:"star")+')"></i>';};

/* ---------- tier badges (admin gives them) ----------
   k = key stored in the database (old keys kept), a = main color, b = dark color, l = light color,
   g = "r,g,b" of the glow, ink = text color on the pill, sh = animated shine */
P.TIERS=[
 {k:"bronze",  n:"Bronze",   ic:"medal",   l:"#ffd9b8",a:"#e0a06a",b:"#9b5a2a",ink:"#2d1606",g:"224,160,106"},
 {k:"silver",  n:"Silver",   ic:"star",    l:"#ffffff",a:"#c9d3dc",b:"#8895a2",ink:"#18222a",g:"195,204,213"},
 {k:"gold",    n:"Golden",   ic:"trophy",  l:"#fff1b8",a:"#f0c24a",b:"#b9831f",ink:"#2b1d03",g:"230,194,90"},
 {k:"platinum",n:"Platinum", ic:"hexa",    l:"#f3fbfd",a:"#a9d7e6",b:"#5c8ea3",ink:"#0a222b",g:"169,215,230",sh:1},
 {k:"premium", n:"Premium",  ic:"sparkle", l:"#f1dcff",a:"#b98cf0",b:"#8a5bc9",ink:"#240a3d",g:"185,140,240"},
 {k:"emerald", n:"Emerald",  ic:"leaf",    l:"#b6f7d3",a:"#34d399",b:"#0b8f5b",ink:"#022a1b",g:"52,211,153"},
 {k:"ruby",    n:"Ruby",     ic:"heart",   l:"#ffc2cb",a:"#ff5a73",b:"#b8112f",ink:"#ffffff",g:"255,90,115"},
 {k:"diamond", n:"Diamond",  ic:"gem",     l:"#e1fbff",a:"#62d6f7",b:"#3b7be0",ink:"#032233",g:"98,214,247",sh:1},
 {k:"master",  n:"Master",   ic:"target",  l:"#b4f5fa",a:"#19c9d4",b:"#00909a",ink:"#032a2e",g:"25,201,212"},
 {k:"elite",   n:"Elite",    ic:"bolt",    l:"#f6ffb4",a:"#d0ff00",b:"#a3c900",ink:"#1e2800",g:"208,255,0"},
 {k:"blaze",   n:"Blaze",    ic:"flame",   l:"#ffd9a6",a:"#ff8a2a",b:"#d9400c",ink:"#2f0d00",g:"255,138,42"},
 {k:"frost",   n:"Frost",    ic:"snow",    l:"#eef6ff",a:"#8dbdff",b:"#4a78d8",ink:"#07183d",g:"141,189,255"},
 {k:"king",    n:"King",     ic:"crown",   l:"#34d399",a:"#10b981",b:"#c27d8a",ink:"#04251b",g:"183,110,121",sh:1,
  bg:"linear-gradient(120deg,#047857,#10b981 42%,#f0bfae 72%,#b76e79)",nm:"linear-gradient(100deg,#34d399,#10b981 35%,#f0bfae 70%,#c27d8a)"},
 {k:"legend",  n:"Legend",   ic:"shield",  l:"#a9bdf0",a:"#4a6bc9",b:"#2b4590",ink:"#ffffff",g:"61,95,192",sh:1,
  bg:"linear-gradient(135deg,#5b7bc4,#1b2f6b)"},
 {k:"phantom", n:"Phantom",  ic:"ghost",   l:"#ffb3b3",a:"#ff3b3b",b:"#c4122a",ink:"#ffffff",g:"255,59,59",sh:1,
  bg:"linear-gradient(135deg,#ff8a8a,#d4142a)"},
 {k:"savage",  n:"Savage",   ic:"skull",   l:"#ffc2f0",a:"#ff4fd8",b:"#c2189b",ink:"#ffffff",g:"255,79,216",sh:1,
  bg:"linear-gradient(135deg,#ff9ee8,#e0199f)"},
 {k:"founder", n:"Founder",  ic:"flag",    l:"#fff8dc",a:"#ffe08a",b:"#e8a93a",ink:"#3a2600",g:"255,216,107",sh:1,
  bg:"linear-gradient(120deg,#fff3c4,#ffd86b 45%,#f2a93b)"}
];
P.T={};P.TIERS.forEach(function(t,i){P.T[t.k]=t;t.i=i+1;});
P.name=function(k){return P.T[k]?P.T[k].n:"";};
P.pill=function(k){var t=P.T[k];if(!t)return"";return'<i class="ol-bdg t-'+k+(t.sh?' sh':'')+'">'+P.ic(t.ic)+'<span>'+t.n+'</span></i>';};
P.seal=function(k){var t=P.T[k];if(!t)return"";return'<div class="pp-seal t-'+k+'" title="'+t.n+'">'+P.ic(t.ic)+'<span>'+t.n+'</span></div>';};

/* ---------- levels ---------- */
var RANKS=[[3,"Rookie"],[6,"Regular"],[10,"Pro"],[15,"Expert"],[20,"Master"],[1e9,"Legend"]];
P.level=function(pts,games){var xp=Math.max(0,Math.floor((pts||0)+(games||0)*2)),L=Math.floor(Math.sqrt(xp/12))+1,lo=12*(L-1)*(L-1),hi=12*L*L,rk="Rookie",i;
  for(i=0;i<RANKS.length;i++){if(L<RANKS[i][0]){rk=RANKS[i][1];break;}}
  return{lv:L,xp:xp,lo:lo,hi:hi,pc:Math.max(0,Math.min(100,Math.round((xp-lo)/(hi-lo)*100))),rank:rk};};

/* ---------- achievements ----------
   [ name, description, unlocked(t,s), progress(t,s), target, {ic, tr (rarity 1-4), g (group)} ]
   t = totals {games,wins,right,wrong,pts}, s = per-game stats {flags:{games,wins,right,wrong,pts},...} */
P.RAR={1:{n:"Common",c:"#d9a273",rgb:"217,162,115"},2:{n:"Rare",c:"#8dbdff",rgb:"141,189,255"},3:{n:"Epic",c:"#e6c25a",rgb:"230,194,90"},4:{n:"Legendary",c:"#c88cff",rgb:"200,140,255"}};
P.GROUPS=[["all","Overall"],["flags","Flags"],["story","Who Am I"],["career","Transfers"],["xo","XO"],["ludo","Ludo"],["sudoku","Sudoku"],["tawla","Tawla"],["blackjack","Blackjack"],["mix","Mixed"]];
function X(s,k){return(s&&s[k])||{};}
function A(n,d,ic,tr,g,pf,tg,ok){return[n,d,ok||function(t,s){return pf(t,s)>=tg;},pf,tg,{ic:ic,tr:tr,g:g}];}
function pg(k,f){return function(t,s){return f(X(s,k))||0;};}
function cnt(f){return function(t,s){var n=0;GK.forEach(function(k){if(f(X(s,k)))n++;});return n;};}
function ans(t){return(t.right||0)+(t.wrong||0);}
function accAll(mn,r){return function(t){var n=ans(t);return n>=mn&&(t.right||0)/n>=r;};}
function accG(k,mn,r){return function(t,s){var x=X(s,k),n=(x.right||0)+(x.wrong||0);return n>=mn&&(x.right||0)/n>=r;};}
function wr(k,mg,r){return function(t,s){var x=X(s,k),g=x.games||0;return g>=mg&&(x.wins||0)/g>=r;};}
var wins=function(x){return x.wins;},games=function(x){return x.games;},right=function(x){return x.right;},pts=function(x){return x.pts;};
var playedN=cnt(function(x){return(x.games||0)>0;}),wonN=cnt(function(x){return(x.wins||0)>0;});

P.ACH=[
 /* overall */
 A("First Win","Win 1 session","check",1,"all",function(t){return t.wins;},1),
 A("Regular","Play 5 sessions","clock",1,"all",function(t){return t.games;},5),
 A("Veteran","Play 25 sessions","compass",2,"all",function(t){return t.games;},25),
 A("Marathoner","Play 50 sessions","rocket",3,"all",function(t){return t.games;},50),
 A("Dedicated","Play 100 sessions","flame",4,"all",function(t){return t.games;},100),
 A("Point Collector","Score 50 points","coins",1,"all",function(t){return t.pts;},50),
 A("Century","Score 100 points","star",2,"all",function(t){return t.pts;},100),
 A("Point Tycoon","Score 500 points","gem",3,"all",function(t){return t.pts;},500),
 A("Point Legend","Score 1,000 points","crown",4,"all",function(t){return t.pts;},1000),
 A("Champion","Win 5 sessions","trophy",2,"all",function(t){return t.wins;},5),
 A("Serial Winner","Win 15 sessions","medal",3,"all",function(t){return t.wins;},15),
 A("Unstoppable","Win 50 sessions","bolt",4,"all",function(t){return t.wins;},50),
 A("Sharpshooter","80% accuracy, 20+ answers","target",3,"all",ans,20,accAll(20,.8)),
 A("Marksman","90% accuracy, 50+ answers","eye",4,"all",ans,50,accAll(50,.9)),
 /* flags */
 A("Flag Spotter","3 correct flags","flag",1,"flags",pg("flags",right),3),
 A("Flag Expert","10 correct flags","flag",2,"flags",pg("flags",right),10),
 A("Globetrotter","50 correct flags","globe",3,"flags",pg("flags",right),50),
 A("Cartographer","150 correct flags","compass",4,"flags",pg("flags",right),150),
 A("Flag Perfectionist","90% accuracy in Flags, 30+ answers","target",4,"flags",function(t,s){var x=X(s,"flags");return(x.right||0)+(x.wrong||0);},30,accG("flags",30,.9)),
 /* who am i */
 A("Rookie Sleuth","1 correct player","search",1,"story",pg("story",right),1),
 A("Detective","5 correct players","who",2,"story",pg("story",right),5),
 A("Inspector","15 correct players","bulb",3,"story",pg("story",right),15),
 A("Case Closer","40 correct players","key",4,"story",pg("story",right),40),
 A("Sharp Mind","85% accuracy in Who Am I, 15+ answers","target",3,"story",function(t,s){var x=X(s,"story");return(x.right||0)+(x.wrong||0);},15,accG("story",15,.85)),
 /* transfers */
 A("Talent Scout","1 correct transfer","compass",1,"career",pg("career",right),1),
 A("Transfer Guru","5 correct transfers","swap",2,"career",pg("career",right),5),
 A("Super Agent","15 correct transfers","users",3,"career",pg("career",right),15),
 A("Football Director","40 correct transfers","rocket",4,"career",pg("career",right),40),
 A("Deal Maker","Score 90 points in Transfers","coins",3,"career",pg("career",pts),90),
 /* xo */
 A("XO Rookie","Win 1 XO game","hash",1,"xo",pg("xo",wins),1),
 A("XO Regular","Play 10 XO games","clock",1,"xo",pg("xo",games),10),
 A("XO Ace","Win 10 XO games","star",2,"xo",pg("xo",wins),10),
 A("XO Veteran","Win 25 XO games","medal",3,"xo",pg("xo",wins),25),
 A("XO Strategist","Win 60% of your XO games (20+ played)","percent",3,"xo",pg("xo",games),20,wr("xo",20,.6)),
 A("XO Legend","Win 50 XO games","crown",4,"xo",pg("xo",wins),50),
 /* ludo */
 A("Ludo Rookie","Win 1 Ludo game","dice",1,"ludo",pg("ludo",wins),1),
 A("Ludo Regular","Play 10 Ludo games","clock",1,"ludo",pg("ludo",games),10),
 A("Ludo Ace","Win 10 Ludo games","star",2,"ludo",pg("ludo",wins),10),
 A("Ludo Veteran","Win 25 Ludo games","medal",3,"ludo",pg("ludo",wins),25),
 A("Dice Master","Win 40% of your Ludo games (15+ played)","percent",3,"ludo",pg("ludo",games),15,wr("ludo",15,.4)),
 A("Ludo Legend","Win 50 Ludo games","crown",4,"ludo",pg("ludo",wins),50),
 /* sudoku */
 A("Sudoku Rookie","Win 1 Sudoku race","grid",1,"sudoku",pg("sudoku",wins),1),
 A("Sudoku Regular","Play 10 Sudoku races","clock",1,"sudoku",pg("sudoku",games),10),
 A("Sudoku Ace","Win 10 Sudoku races","star",2,"sudoku",pg("sudoku",wins),10),
 A("Sudoku Veteran","Win 25 Sudoku races","medal",3,"sudoku",pg("sudoku",wins),25),
 A("Speed Solver","Win 60% of your Sudoku races (15+ played)","percent",3,"sudoku",pg("sudoku",games),15,wr("sudoku",15,.6)),
 A("Puzzle Machine","Score 150 points in Sudoku","bolt",4,"sudoku",pg("sudoku",pts),150),
 /* tawla */
 A("Tawla Rookie","Win 1 Tawla game","board",1,"tawla",pg("tawla",wins),1),
 A("Tawla Regular","Play 10 Tawla games","clock",1,"tawla",pg("tawla",games),10),
 A("Tawla Ace","Win 10 Tawla games","star",2,"tawla",pg("tawla",wins),10),
 A("Tawla Veteran","Win 25 Tawla games","medal",3,"tawla",pg("tawla",wins),25),
 A("Board Shark","Win 60% of your Tawla games (15+ played)","percent",3,"tawla",pg("tawla",games),15,wr("tawla",15,.6)),
 A("Tawla Grandmaster","Score 300 points in Tawla","crown",4,"tawla",pg("tawla",pts),300),
 /* blackjack */
 A("Blackjack Rookie","Win 1 Blackjack round online","dice",1,"blackjack",pg("blackjack",wins),1),
 A("Card Regular","Play 10 Blackjack rounds online","clock",1,"blackjack",pg("blackjack",games),10),
 A("Card Sharp","Win 10 Blackjack rounds","star",2,"blackjack",pg("blackjack",wins),10),
 A("High Roller","Win 30 Blackjack rounds","medal",3,"blackjack",pg("blackjack",wins),30),
 A("House Beater","Win 55% of your Blackjack rounds (20+ played)","percent",3,"blackjack",pg("blackjack",games),20,wr("blackjack",20,.55)),
 A("Blackjack Legend","Score 100 points in Blackjack","crown",4,"blackjack",pg("blackjack",pts),100),
 /* mixed */
 A("Explorer","Play 3 different games","compass",1,"mix",playedN,3),
 A("All-Rounder","Score in Flags, Who Am I and Transfers","layers",2,"mix",function(t,s){return(X(s,"flags").pts>0)+(X(s,"story").pts>0)+(X(s,"career").pts>0);},3),
 A("Triple Threat","Win in 3 different games","star",3,"mix",wonN,3),
 A("Board Champion","Win a game of XO, Ludo, Sudoku and Tawla","trophy",4,"mix",function(t,s){return(X(s,"xo").wins>0)+(X(s,"ludo").wins>0)+(X(s,"sudoku").wins>0)+(X(s,"tawla").wins>0);},4),
 A("Eight Wonders","Play all 8 games","globe",4,"mix",playedN,8)
];
/* each card: unlocked flag + progress (capped at the target) */
P.state=function(t,s){return P.ACH.map(function(b){var on=!!b[2](t,s),c=Math.min(Number(b[3](t,s))||0,b[4]);return{b:b,on:on,c:on?b[4]:c};});};
P.top=function(st,n){return st.filter(function(x){return x.on;}).sort(function(a,b){return b.b[5].tr-a.b[5].tr;}).slice(0,n);};
P.card=function(x){var b=x.b,m=b[5],r=P.RAR[m.tr];
  return'<div class="ach'+(x.on?' on':'')+'" style="--rc:'+r.rgb+'"><span class="ach-ic">'+P.ic(m.ic)+'</span><div class="ach-tx"><b>'+b[0]+'</b><small>'+b[1]+'</small>'+
    (x.on?'':'<i class="ol-pb"><i style="width:'+Math.round(x.c/b[4]*100)+'%"></i></i><em class="ol-of">'+x.c+' / '+b[4]+'</em>')+'</div><span class="ach-r">'+r.n+'</span></div>';};
P.chip=function(x){var b=x.b,m=b[5];return'<span class="ach-chip" style="--rc:'+P.RAR[m.tr].rgb+'" title="'+b[1]+'">'+P.ic(m.ic)+b[0]+'</span>';};
P.tile=function(x){var b=x.b,m=b[5],r=P.RAR[m.tr];return'<div class="ach-st" style="--rc:'+r.rgb+'" title="'+b[1]+'"><span class="ach-ic">'+P.ic(m.ic)+'</span><b>'+b[0]+'</b><small>'+r.n+'</small></div>';};

/* ---------- admin Users page: search / filter / sort ---------- */
P.USORT=[["recent","Recent"],["pts","Points"],["games","Sessions"],["coins","Coins"],["tier","Badge"],["name","A–Z"]];
P.UFLT=[["all","All"],["badged","Badged"],["plain","No badge"],["active","Active"],["idle","Never played"]];
P.usersView=function(L,o){o=o||{};var q=String(o.q||"").trim().toLowerCase(),f=o.flt||"all",rk={};
  P.TIERS.forEach(function(t){rk[t.k]=t.i;});
  var r=L.filter(function(u){
    if(q&&(String(u.name)+" "+String(u.email)+" "+String(u.id)).toLowerCase().indexOf(q)<0)return false;
    if(o.tier&&u.tier!==o.tier)return false;
    if(f==="badged"&&!u.tier)return false;if(f==="plain"&&u.tier)return false;
    if(f==="active"&&!(u.games>0))return false;if(f==="idle"&&u.games>0)return false;
    return true;});
  var S={recent:function(a,b){return(b.seen||0)-(a.seen||0);},pts:function(a,b){return b.pts-a.pts;},games:function(a,b){return b.games-a.games;},
    coins:function(a,b){return(b.coins==null?-1:b.coins)-(a.coins==null?-1:a.coins);},tier:function(a,b){return(rk[b.tier]||0)-(rk[a.tier]||0);},
    name:function(a,b){var x=String(a.name).toLowerCase(),y=String(b.name).toLowerCase();return x<y?-1:x>y?1:0;}};
  var fn=S[o.sort]||S.recent;
  r.sort(function(a,b){return fn(a,b)||(a.id<b.id?-1:1);});
  return{rows:r,total:L.length};};
P.usersStats=function(L){var s={n:L.length,active:0,badged:0,coins:0};L.forEach(function(u){if(u.games>0)s.active++;if(u.tier)s.badged++;if(typeof u.coins==="number")s.coins+=u.coins;});return s;};

/* ---------- styles ---------- */
function tierCss(t){var k=t.k,g=t.g,bg=t.bg||"linear-gradient(135deg,"+t.l+","+t.a+" 45%,"+t.b+")",nm=t.nm||"linear-gradient(100deg,"+t.l+","+t.a+" 48%,"+t.b+")";
  return".ol-bdg.t-"+k+"{background:"+bg+";color:"+t.ink+";box-shadow:inset 0 1px 0 rgba(255,255,255,.42),0 0 0 1px rgba("+g+",.5),0 2px 10px rgba("+g+",.3)}"+
   ".ol-nm.t-"+k+"{background-image:"+nm+"}"+
   ".ol-av.r-"+k+",.ol-me img.r-"+k+"{border-color:"+t.a+";box-shadow:0 0 0 2px rgba("+g+",.4),0 0 14px rgba("+g+",.28)}"+
   ".pp-seal.t-"+k+"{background:"+bg+";color:"+t.ink+";border-color:transparent;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 3px 12px rgba("+g+",.4)}"+
   ".tp-opt.t-"+k+"{--tc:"+t.a+";--tg:"+g+"}";}
P.css=function(){
  var v=":root{",k;for(k in ICONS)v+="--b-"+k+":"+svg(ICONS[k])+";";v+="}";
  var names=P.TIERS.map(function(t){return".ol-nm.t-"+t.k;}).join(",");
  var c=v+
  /* tier pill + name + avatar ring */
  ".ol-bdg{position:relative;overflow:hidden;gap:4px;padding:2px 9px 1px 6px}.ol-bdg .ol-i{width:1.12em;height:1.12em;vertical-align:0;margin-top:-1px;flex:none}"+
  ".ol-bdg.sh:after{content:\"\";position:absolute;top:0;bottom:0;left:0;width:55%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.6),transparent);transform:translateX(-130%) skewX(-18deg);animation:ppShine 3.6s ease-in-out infinite}"+
  "@keyframes ppShine{0%,55%{transform:translateX(-130%) skewX(-18deg)}100%{transform:translateX(330%) skewX(-18deg)}}"+
  "@media (prefers-reduced-motion:reduce){.ol-bdg.sh:after{animation:none;display:none}}"+
  names+"{-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;font-weight:800}"+
  P.TIERS.map(tierCss).join("")+
  ".pp-seal{display:inline-flex;align-items:center;gap:4px;padding:3px 10px 3px 8px;font:700 11px/1.3 \"IBM Plex Sans Arabic\",sans-serif;border:1px solid transparent}.pp-seal .ol-i{width:1.15em;height:1.15em}"+
  /* achievements */
  ".ach{position:relative;display:flex;align-items:center;gap:12px;padding:11px 12px;margin:7px 0;border-radius:16px;border:1px solid var(--ln);background:var(--card);overflow:hidden}"+
  ".ach.on{border-color:rgba(var(--rc),.55);background:linear-gradient(135deg,rgba(var(--rc),.14),rgba(var(--rc),.03) 70%)}"+
  ".ach-ic{position:relative;flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.05);color:var(--mu2)}.ach-ic .ol-i{width:22px;height:22px}"+
  ".ach.on .ach-ic{background:linear-gradient(145deg,rgba(var(--rc),.4),rgba(var(--rc),.12));color:rgb(var(--rc));box-shadow:0 0 0 1px rgba(var(--rc),.5),0 4px 14px rgba(var(--rc),.22)}"+
  ".ach:not(.on) .ach-ic .ol-i{opacity:.4}.ach:not(.on) .ach-ic:after{content:\"\";position:absolute;right:-4px;bottom:-4px;width:15px;height:15px;background:var(--mu);-webkit-mask:var(--b-lock) center/contain no-repeat;mask:var(--b-lock) center/contain no-repeat}"+
  ".ach-tx{flex:1;min-width:0}.ach-tx b{display:block;font-size:14.5px;color:var(--mu);line-height:1.3}.ach.on .ach-tx b{color:var(--ink2,#f3e6c4)}"+
  ".ach-tx small{display:block;margin-top:2px;color:var(--mu2);font-size:12px;line-height:1.45}.ach.on .ach-tx small{color:var(--mu)}.ach-tx .ol-pb{margin-top:7px}.ach-tx .ol-of{display:block;margin-top:4px}"+
  ".ach-r{position:absolute;top:8px;inset-inline-end:10px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(var(--rc),.7)}.ach.on .ach-r{color:rgb(var(--rc))}"+
  ".ach-tx b{padding-inline-end:62px}"+
  ".ach-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px 4px 7px;border-radius:99px;border:1px solid rgba(var(--rc),.5);background:rgba(var(--rc),.1);color:rgb(var(--rc));font-size:12px;font-weight:600}.ach-chip .ol-i{width:1.05em;height:1.05em}"+
  ".ach-st{display:flex;flex-direction:column;align-items:center;gap:3px;padding:12px 6px 10px;text-align:center;border-radius:16px;border:1px solid rgba(var(--rc),.5);background:linear-gradient(160deg,rgba(var(--rc),.16),rgba(var(--rc),.03));min-width:0}"+
  ".ach-st .ach-ic{width:42px;height:42px;margin-bottom:3px}.ach-st b{font-size:12.5px;line-height:1.3;color:var(--ink);overflow-wrap:anywhere}.ach-st small{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgb(var(--rc))}"+
  ".ach-show{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}"+
  ".ach-sum{padding:14px;border-radius:18px;border:1px solid rgba(var(--acr),.4);background:linear-gradient(160deg,var(--h1),var(--h2));margin:2px 0 12px}"+
  ".ach-sum-t{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.ach-sum-t b{font:400 34px/1 Anton,Impact,sans-serif;letter-spacing:.03em;color:var(--ac)}.ach-sum-t b small{font-size:18px;color:var(--mu);margin-inline-start:3px}.ach-sum-t span{color:var(--mu);font-size:12.5px}"+
  ".ach-sum .ol-pb{height:7px;margin-top:10px}"+
  ".ach-rar{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px}.ach-rar>div{padding:7px 4px 6px;text-align:center;border-radius:11px;border:1px solid rgba(var(--rc),.4);background:rgba(var(--rc),.07)}.ach-rar b{display:block;font:400 17px/1 Anton,sans-serif;letter-spacing:.03em;color:rgb(var(--rc));direction:ltr}.ach-rar small{display:block;margin-top:3px;font-size:10px;color:var(--mu)}"+
  ".ach-chips{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;margin:0 -16px;padding-inline:16px;scrollbar-width:none}.ach-chips::-webkit-scrollbar{display:none}"+
  ".ach-f{flex:none;padding:7px 13px;border-radius:99px;border:1px solid var(--ln2);background:var(--card);color:var(--mu);font:600 13px \"IBM Plex Sans Arabic\",sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}.ach-f.on{background:var(--ac);border-color:var(--ac);color:#111}.ach-f em{font-style:normal;opacity:.7;margin-inline-start:4px;font-size:11.5px}"+
  /* passport extras */
  ".pp-lv{position:relative;z-index:1;display:flex;align-items:center;gap:12px;padding:11px 14px 12px;border-top:1px solid var(--ln)}"+
  ".pp-lv-b{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;width:48px;height:48px;border-radius:14px;border:1px solid rgba(var(--acr),.55);background:linear-gradient(145deg,rgba(var(--acr),.3),rgba(var(--acr),.06));color:var(--ac)}.pp-lv-b small{font:400 10px/1 Anton,sans-serif;letter-spacing:.14em;opacity:.8}.pp-lv-b b{font:400 22px/1 Anton,Impact,sans-serif;margin-top:2px}"+
  ".pp-lv-t{flex:1;min-width:0}.pp-lv-r{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.pp-lv-r b{font-size:15px;color:var(--ink2,#f3e6c4)}.pp-lv-r em{font-style:normal;color:var(--mu);font-size:11.5px;direction:ltr}.pp-lv-t .ol-pb{height:6px;margin-top:7px}"+
  ".pp-hl{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pp-hl>div{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:14px;border:1px solid var(--ln);background:var(--card);min-width:0}"+
  ".pp-hl .hl-i{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:rgba(var(--acr),.12);color:var(--ac)}.pp-hl .hl-i .ol-i{width:18px;height:18px}"+
  ".pp-hl .hl-t{min-width:0}.pp-hl label{display:block;color:var(--mu);font-size:11px}.pp-hl b{display:block;font-size:14.5px;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:ltr;text-align:start}"+
  ".pp-med{display:flex;gap:10px}.pp-med span{display:inline-flex;align-items:center;gap:4px;font:400 17px/1 Anton,sans-serif;color:var(--ink)}.pp-med i{width:11px;height:11px;border-radius:50%;display:inline-block}.pp-med .g i{background:#e6c25a}.pp-med .s i{background:#c3ccd5}.pp-med .b i{background:#c98a55}"+
  ".ox-hl{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.ox-hl>div{padding:9px 6px;text-align:center;border-radius:12px;border:1px solid var(--ln);background:var(--card);min-width:0}.ox-hl small{display:block;color:var(--mu);font-size:10.5px}.ox-hl b{display:block;margin-top:2px;font-size:13.5px;color:var(--ac);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
  ".ox-lv{display:flex;align-items:center;gap:10px;margin-top:10px;padding:9px 12px;border-radius:14px;border:1px solid rgba(var(--acr),.4);background:rgba(var(--acr),.06)}.ox-lv .pp-lv-b{width:40px;height:40px}.ox-lv .pp-lv-b b{font-size:18px}"+
  /* admin users page */
  ".us-sum{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0 0 12px}.us-sum>div{padding:10px 4px 8px;text-align:center;border-radius:13px;border:1px solid var(--ln);background:var(--card);min-width:0}"+
  ".us-sum b{display:block;font:400 21px/1 Anton,Impact,sans-serif;letter-spacing:.03em;color:var(--ac);direction:ltr}.us-sum small{display:block;margin-top:4px;color:var(--mu);font-size:10.5px}"+
  ".us-top{position:sticky;top:calc(66px + env(safe-area-inset-top,0px));z-index:2;margin:0 -16px 8px;padding:8px 16px 6px;background:rgba(var(--bgr),.94);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-bottom:1px solid var(--ln)}"+
  ".us-sr{position:relative}.us-sr>.ol-i{position:absolute;top:50%;left:13px;transform:translateY(-50%);width:17px;height:17px;color:var(--mu2);pointer-events:none}"+
  "#olRoot input.us-q{display:block;width:100%;padding:11px 12px 11px 40px;border-radius:13px;border:1px solid var(--ln2);background:var(--card);color:var(--ink);font:500 15px \"IBM Plex Sans Arabic\",sans-serif;letter-spacing:0;text-indent:0;text-align:start;direction:auto;margin:0}"+
  "#olRoot input.us-q::placeholder{font-size:14px;letter-spacing:0;color:var(--mu2)}#olRoot input.us-q:focus{outline:none;border-color:var(--ac);box-shadow:0 0 0 3px rgba(var(--acr),.16)}"+
  ".us-chips{display:flex;gap:6px;overflow-x:auto;margin:8px -16px 0;padding:0 16px 4px;scrollbar-width:none}.us-chips::-webkit-scrollbar{display:none}"+
  ".us-chip{flex:none;padding:6px 12px;border-radius:99px;border:1px solid var(--ln2);background:var(--card);color:var(--mu);font:600 12.5px \"IBM Plex Sans Arabic\",sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap}.us-chip.on{background:var(--ac);border-color:var(--ac);color:#111}.us-chip.s.on{background:rgba(var(--acr),.16);color:var(--ac)}.us-chip em{font-style:normal;opacity:.7;margin-inline-start:4px}"+
  ".us-sel{flex:none;padding:6px 10px;border-radius:99px;border:1px solid var(--ln2);background:var(--card);color:var(--mu);font:600 12.5px \"IBM Plex Sans Arabic\",sans-serif}.us-sel.on{border-color:var(--ac);color:var(--ac)}"+
  ".us-cnt{margin:10px 2px 4px;color:var(--mu2);font-size:12px}"+
  ".us-c{margin:8px 0;border-radius:16px;border:1px solid var(--ln);background:var(--card);overflow:hidden}.us-c.open{border-color:rgba(var(--acr),.5)}"+
  ".us-r{display:flex;align-items:center;gap:12px;padding:12px;cursor:pointer;-webkit-tap-highlight-color:transparent}.us-r:active{background:rgba(255,255,255,.03)}"+
  ".ol-av.us-av,.ol-ph.us-av{width:46px;height:46px;flex:none;border-width:2px}.ol-ph.us-av{display:grid;place-items:center;font:400 20px/1 Anton,sans-serif;color:var(--mu);border-style:solid}"+
  ".us-i{flex:1;min-width:0}.us-n{font-weight:700;font-size:15px;line-height:1.5;overflow-wrap:anywhere}.us-e{display:block;color:var(--mu);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
  ".us-m{display:flex;flex-wrap:wrap;gap:1px 12px;margin-top:3px;color:var(--mu2);font-size:12px;direction:ltr}.us-m b{color:var(--ink);font-weight:600}"+
  ".us-ch{flex:none;width:18px;height:18px;color:var(--mu2);transition:transform .2s}.us-c.open .us-ch{transform:rotate(90deg);color:var(--ac)}"+
  ".us-p{padding:2px 12px 14px;border-top:1px dashed var(--ln2)}.us-l{margin:12px 2px 7px;color:var(--ac);font-weight:700;font-size:12.5px}"+
  ".tp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;direction:ltr}"+
  ".tp-opt{display:flex;align-items:center;gap:6px;min-width:0;padding:8px 8px;border-radius:12px;border:1px solid var(--ln2);background:var(--card2);color:var(--mu);font:600 12px \"IBM Plex Sans Arabic\",sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;text-align:start}"+
  ".tp-opt .ol-i{flex:none;width:17px;height:17px;color:var(--tc)}.tp-opt span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tp-opt:active{transform:scale(.97)}"+
  ".tp-opt.on{color:var(--ink);border-color:var(--tc);background:linear-gradient(135deg,rgba(var(--tg),.3),rgba(var(--tg),.08));box-shadow:0 0 0 1px var(--tc) inset}"+
  ".us-rm{display:block;width:100%;margin-top:8px;padding:9px;border-radius:12px;border:1px solid rgba(224,80,74,.45);background:transparent;color:#e0746f;font:600 13px \"IBM Plex Sans Arabic\",sans-serif;cursor:pointer}"+
  ".us-cn{display:flex;gap:6px;direction:ltr}.us-cn .ol-mini{flex:none;padding:0 16px}"+
  "#olRoot input.us-coin{flex:1;min-width:0;padding:10px 12px;border-radius:12px;border:1px solid var(--ln2);background:var(--card2);color:var(--ink);font:500 15px \"IBM Plex Sans Arabic\",sans-serif;letter-spacing:0;text-indent:0;text-align:start;margin:0}"+
  "#olRoot input.us-coin::placeholder{font-size:14px;letter-spacing:0}#olRoot input.us-coin:focus{outline:none;border-color:var(--ac)}"+
  ".us-ps{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px;direction:ltr}.us-ps .ol-mini{padding:7px 2px}"+
  ".us-id{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px;padding:8px 10px;border-radius:11px;background:rgba(0,0,0,.25);color:var(--mu2);font-size:11.5px;direction:ltr}.us-id span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
  ".us-id button{flex:none;display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:99px;border:1px solid var(--ln2);background:transparent;color:var(--mu);font:600 11.5px \"IBM Plex Sans Arabic\",sans-serif;cursor:pointer}.us-id .ol-i{width:13px;height:13px}"+
  "@media (max-width:360px){.tp-grid{grid-template-columns:repeat(2,1fr)}.us-sum b{font-size:18px}.ach-show{grid-template-columns:repeat(2,1fr)}}";
  return c;};
})();
