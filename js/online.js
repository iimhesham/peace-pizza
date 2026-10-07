/* Online: live rooms (Firebase Realtime Database). Every game has its own "Play Online" button.
   The host runs the room, two teams (one account per team). First to press "Answer!" gets the right to answer; points go to the account. */
(function(){
var SDK="https://www.gstatic.com/firebasejs/10.12.2/";
var db,code,role,S,ov,off,lastT,sy=0,ADM=null,BDG={},mk=null,vw=null,inRoom=false,playing=false,hist=false,busy=false;
var e=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var U=function(){return window.ppUser;},T=function(m){try{toast(m);}catch(x){}};
var P3=[3,2,1];
var IC=function(n,o){return'<i class="ol-i" style="--ic:var(--'+(o?'o':'i')+'-'+n+')"></i>';};
var SV=function(p){return'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'2.1\' stroke-linecap=\'round\' stroke-linejoin=\'round\'>'+p+'</svg>")';};
var KICK=function(t){return'<small class="ol-kick" dir="ltr">'+t+'</small>';};
var G={
 flags:{n:"Flags",tries:0,steps:1,data:function(){return FLAGS_DATA;},ans:function(x){return x[1];},pts:function(){return 1;},
  view:function(x){return'<div class="ol-fcard"><i class="ol-cn a"></i><i class="ol-cn b"></i><i class="ol-cn c"></i><i class="ol-cn d"></i><div class="ol-fw"><img class="ol-f" src="'+e(flagImgUrl(x[0]))+'" alt=""></div></div>';}},
 story:{n:"Who Am I",tries:2,steps:3,data:function(){return STORY_PLAYERS;},ans:function(x){return x.name;},pts:function(s){return P3[s];},
  view:function(x,s){return x.clues.slice(0,s+1).map(function(c,i){return'<div class="ol-k"><small>Clue '+(i+1)+'</small><div dir="auto">'+e(c)+'</div></div>';}).join("");}},
 career:{n:"Transfers",tries:0,steps:3,data:function(){return CAREER_PLAYERS;},ans:function(x){return x.n;},pts:function(s){return P3[s];},
  view:function(x,s,o){var k=Math.ceil(x.c.length*[.35,.6,.85][s]),sh=(o||[]).slice(0,k);var yr=function(c){if(!c[1])return"";if(c[2]==null)return c[1]+" – Now";return c[1]===c[2]?String(c[1]):c[1]+" – "+c[2];};
   return'<div class="ol-tl">'+x.c.map(function(c,i){var op=sh.indexOf(i)>=0;
    return'<div class="ol-stop '+(op?'is-open':'is-hidden')+'"><div class="ol-nd"><span class="ol-dot">'+(i+1)+'</span><span class="ol-rail"></span></div><div class="ol-cc'+(op&&c[3]?' is-loan':'')+'">'+(op?'<b class="ol-club" dir="ltr">'+e(c[0])+'</b>'+(c[3]?'<span class="ol-loan">Loan</span>':'')+'<span class="ol-yrs" dir="ltr">'+e(yr(c))+'</span>':'<span class="ol-q">?</span>')+'</div></div>';}).join("")+'</div>';}}
};
var META={
 flags:{n:"Flags",d:"First to press \u201cAnswer!\u201d gets the right to answer. First to the target score wins.",who:"Two teams, one account each",
  ic:"<path d='M5 21V4M5 4h12l-2.5 4L17 12H5'/>"},
 story:{n:"Who Am I",d:"Clues about a player are revealed one by one. The faster you guess, the more points you get.",who:"Two teams, one account each",
  ic:"<circle cx='12' cy='8' r='3.5'/><path d='M5 20c0-4 3-6 7-6s7 2 7 6'/>"},
 career:{n:"Transfers",d:"Missing stops from a player or coach career. Guess who it is.",who:"Two teams, one account each",
  ic:"<path d='M3 17l18-6-8 9-2-5-8 2zM11 15l10-4'/>"},
 crime:{n:"Crime Stories",d:"Secret roles, private clues and votes until the killer is revealed.",who:"3 or more players",
  ic:"<path d='M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4zM20 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z'/>"},
 xo:{n:"XO",d:"Tic-tac-toe against one friend. Win a game and earn 3 points in your stats.",who:"Two players. No host, no judge",
  ic:"<path d='M9 4v16M15 4v16M4 9h16M4 15h16'/>"},
 ludo:{n:"Ludo",d:"Roll, race and capture. Bring all four pieces home first. Win a game and earn 5 points in your stats.",who:"2 to 4 players. The host starts the game",
  ic:"<rect x='4' y='4' width='16' height='16' rx='3.5'/><circle cx='9' cy='9' r='.9'/><circle cx='15' cy='15' r='.9'/><circle cx='12' cy='12' r='.9'/>"},
 sudoku:{n:"Sudoku",d:"Race a friend on the same puzzle. The fastest solver wins points: 5 for Easy, 10 for Medium, 15 for Hard.",who:"2 players. The host picks the difficulty",
  ic:"<rect x='3' y='3' width='18' height='18' rx='2.5'/><path d='M9 3v18M15 3v18M3 9h18M3 15h18'/>"}
};
function RW(s){var r=0,w=0;Object.keys(s||{}).forEach(function(k){r+=(s[k]||{}).right||0;w+=(s[k]||{}).wrong||0;});return[r,w];}
function GP(s,k){return((s||{})[k]||{}).pts||0;}
function RT(s,k){return((s||{})[k]||{}).right||0;}
var BADGES=[
 ["First Win","Win 1 session",function(t){return t.wins>=1;},function(t){return t.wins;},1],
 ["Regular","Play 5 sessions",function(t){return t.games>=5;},function(t){return t.games;},5],
 ["Veteran","Play 25 sessions",function(t){return t.games>=25;},function(t){return t.games;},25],
 ["Marathoner","Play 50 sessions",function(t){return t.games>=50;},function(t){return t.games;},50],
 ["Point Collector","Score 50 points",function(t){return t.pts>=50;},function(t){return t.pts;},50],
 ["Century","Score 100 points",function(t){return t.pts>=100;},function(t){return t.pts;},100],
 ["Champion","Win 5 sessions",function(t){return t.wins>=5;},function(t){return t.wins;},5],
 ["Flag Expert","10 correct flags",function(t,s){return RT(s,"flags")>=10;},function(t,s){return RT(s,"flags");},10],
 ["Detective","5 correct players",function(t,s){return RT(s,"story")>=5;},function(t,s){return RT(s,"story");},5],
 ["Transfer Guru","5 correct transfers",function(t,s){return RT(s,"career")>=5;},function(t,s){return RT(s,"career");},5],
 ["Sharpshooter","80% accuracy, 20+ answers",function(t,s){var a=RW(s),n=a[0]+a[1];return n>=20&&a[0]/n>=.8;},function(t,s){var a=RW(s);return a[0]+a[1];},20],
 ["XO Rookie","Win 1 XO game",function(t,s){return((s||{}).xo||{}).wins>=1;},function(t,s){return((s||{}).xo||{}).wins||0;},1],
 ["XO Ace","Win 10 XO games",function(t,s){return((s||{}).xo||{}).wins>=10;},function(t,s){return((s||{}).xo||{}).wins||0;},10],
 ["Ludo Rookie","Win 1 Ludo game",function(t,s){return((s||{}).ludo||{}).wins>=1;},function(t,s){return((s||{}).ludo||{}).wins||0;},1],
 ["Ludo Ace","Win 10 Ludo games",function(t,s){return((s||{}).ludo||{}).wins>=10;},function(t,s){return((s||{}).ludo||{}).wins||0;},10],
 ["Sudoku Rookie","Win 1 Sudoku race",function(t,s){return((s||{}).sudoku||{}).wins>=1;},function(t,s){return((s||{}).sudoku||{}).wins||0;},1],
 ["Sudoku Ace","Win 10 Sudoku races",function(t,s){return((s||{}).sudoku||{}).wins>=10;},function(t,s){return((s||{}).sudoku||{}).wins||0;},10],
 ["All-Rounder","Score in Flags, Who Am I and Transfers",function(t,s){return GP(s,"flags")>0&&GP(s,"story")>0&&GP(s,"career")>0;},function(t,s){return(GP(s,"flags")>0)+(GP(s,"story")>0)+(GP(s,"career")>0);},3]
];
var CSS=':root{--o-bell:'+SV("<path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'/><path d='M10.3 21a1.9 1.9 0 0 0 3.4 0'/>")+';--o-trophy:'+SV("<path d='M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z'/><path d='M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3'/>")+';--o-chart:'+SV("<path d='M4 20V10M10 20V4M16 20v-7M22 20H2'/>")+';--o-copy:'+SV("<rect x='9' y='9' width='11' height='11' rx='2'/><path d='M5 15V6a2 2 0 0 1 2-2h8'/>")+'}'+
/* الأساس */
'#olRoot{position:fixed;top:0;right:0;bottom:0;left:0;z-index:9990;height:100vh;height:100dvh;background:var(--wash),var(--bg);color:var(--ink);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;font-family:"IBM Plex Sans Arabic","Tajawal",sans-serif;line-height:1.6;direction:ltr;text-align:left}'+
'#olRoot *{box-sizing:border-box}body.ol-open>*:not(#olRoot):not(#toast):not(#olSheet){display:none!important}'+
'.ol-i{display:inline-block;width:1.1em;height:1.1em;vertical-align:-.2em;background:currentColor;-webkit-mask:var(--ic) center/contain no-repeat;mask:var(--ic) center/contain no-repeat}'+
'.ol-c{max-width:460px;margin:0 auto;padding:0 16px 34px;padding-bottom:calc(34px + env(safe-area-inset-bottom,0px))}'+
/* الشريط العلوي */
'.ol-bar{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:12px;margin:0 -16px 16px;padding:12px 16px;padding-top:calc(12px + env(safe-area-inset-top,0px));background:rgba(var(--bgr),.92);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-bottom:1px solid var(--ln)}'+
'.ol-back{flex:none;width:42px;height:42px;display:grid;place-items:center;border-radius:12px;border:1px solid var(--ln2);background:var(--card);color:var(--ink);cursor:pointer;-webkit-tap-highlight-color:transparent}.ol-back:active{background:var(--card2);transform:scale(.95)}'+
'.ol-ttl{flex:1;font-weight:700;font-size:18px;color:var(--ink);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'.ol-pill{flex:none;font:400 17px Anton,Impact,sans-serif;letter-spacing:3px;color:var(--ac);border:1px dashed var(--acl);border-radius:999px;padding:3px 12px 1px;background:var(--card)}'+
'.ol-kick{display:block;font:400 12px Anton,Impact,sans-serif;letter-spacing:4px;color:var(--mu2);margin-bottom:4px}'+
/* كارت الدخول (تذكرة) */
'.ol-pass{position:relative;border:1px solid var(--ln2);border-radius:20px;background:linear-gradient(160deg,var(--h1),var(--h2));overflow:hidden}'+
'.ol-pass-top{display:flex;gap:14px;align-items:center;padding:20px 18px 18px}'+
'.ol-glyph{flex:none;width:58px;height:58px;display:grid;place-items:center;border-radius:16px;background:var(--ac);color:var(--on);box-shadow:0 0 0 4px rgba(var(--acr),.22)}.ol-glyph svg{width:30px;height:30px}'+
'.ol-pass-top b{display:block;font-size:22px;line-height:1.3;color:var(--ink2)}.ol-pass-top small{display:block;margin-top:3px;color:var(--mu);font-size:13.5px;line-height:1.55}'+
'.ol-perf{position:relative;height:0;border-top:2px dashed var(--ln);margin:0 14px}.ol-perf:before,.ol-perf:after{content:"";position:absolute;top:-11px;width:20px;height:20px;border-radius:50%;background:var(--bg0);border:1px solid var(--ln2)}.ol-perf:before{right:-25px}.ol-perf:after{left:-25px}'+
'.ol-pass-bot{padding:18px}.ol-hint{margin:10px 0 0;color:var(--mu2);font-size:13px;text-align:center}'+
/* الدخول بكود */
'.ol-join{margin-top:18px;border:1px dashed var(--ln2);border-radius:18px;padding:16px;background:rgba(var(--cardr),.7)}'+
'.ol-join label{display:block;margin:0 0 10px;color:var(--ac);font-weight:700;font-size:15px}'+
'.ol-join-row{display:flex;gap:10px;align-items:stretch}.ol-join-row .ol-b{width:auto;margin:0;flex:none;padding:0 22px}'+
'#olRoot input{flex:1;min-width:0;width:100%;padding:12px 8px 8px;border-radius:12px;border:1px solid var(--ln2);background:var(--bg0);color:var(--ink2);font:400 30px Anton,Impact,sans-serif;letter-spacing:.38em;text-indent:.38em;text-align:center;margin:0;direction:ltr}'+
'#olRoot input::placeholder{color:var(--mu2);letter-spacing:.38em;font-size:30px}#olRoot input:focus{outline:none;border-color:var(--ac);box-shadow:0 0 0 3px rgba(var(--acr),.16)}'+
/* أزرار */
'.ol-b,.ol-s,.ol-buzz{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:9px 0;min-height:52px;padding:12px 14px;border-radius:14px;border:0;background:var(--ac);color:var(--on);font:700 17px "IBM Plex Sans Arabic","Tajawal",sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .08s}'+
'.ol-b:active,.ol-s:active{transform:scale(.97)}.ol-b:disabled{opacity:.5}'+
'.ol-b.g{background:var(--gr);color:var(--gon)}.ol-b.r{background:#a02b2b;color:#fff}.ol-b.o{background:var(--card);color:var(--ac);border:1px solid var(--ln2)}'+
'.ol-s{background:transparent;color:var(--mu);font-size:14px;min-height:44px;border:1px solid var(--ln)}'+
'.ol-buzz{height:128px;font-size:32px;border-radius:20px;background:#c0392b;color:#fff;box-shadow:0 8px 0 #7d241b}.ol-buzz:active{transform:translateY(5px);box-shadow:0 3px 0 #7d241b}.ol-buzz:disabled{background:#262626;color:#666;box-shadow:0 8px 0 #171717}'+
/* الغرفة */
'.ol-ticket{position:relative;text-align:center;border:1px dashed var(--acl);border-radius:20px;padding:18px 10px 16px;background:var(--card);cursor:pointer;-webkit-tap-highlight-color:transparent}.ol-ticket small{display:block;color:var(--mu);font-size:13px}'+
'.ol-code{font:400 66px/1.1 Anton,Impact,sans-serif;letter-spacing:12px;text-indent:12px;color:var(--ac);direction:ltr;margin:4px 0 2px}.ol-ticket>span{color:var(--mu2);font-size:13px}'+
'.ol-sec{margin:20px 2px 8px;color:var(--mu);font-size:14px;font-weight:600}'+
'.ol-w{margin:10px 2px;color:var(--mu);text-align:center}.ol-a,.ol-l{margin:8px 0;color:var(--mu);text-align:center}.ol-a b{color:#fff}.ol-bz{font-size:19px;margin:10px 0;color:var(--ac);text-align:center}'+
'.ol-t{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:11px 14px;margin:7px 0}.ol-t b{display:flex;align-items:center;gap:10px;min-width:0}.ol-t>span{color:var(--ac);font-weight:800;font-size:19px}'+
'.ol-t.empty{border-style:dashed;color:var(--mu2);justify-content:center}'+
'.ol-av{width:34px;height:34px;border-radius:50%;object-fit:cover;border:1px solid var(--ln2);flex:none}.ol-ph{width:34px;height:34px;border-radius:50%;background:var(--card2);border:1px dashed var(--ln2);flex:none}'+
'.ol-score{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px}.ol-score .ol-t{margin:0;flex-direction:column;align-items:center;padding:10px 6px;text-align:center}.ol-score .ol-t b{flex-direction:column;gap:4px;font-size:14px}.ol-score .ol-av{width:40px;height:40px}.ol-score .ol-t>span{font:400 28px/1 Anton,Impact,sans-serif}'+
'.ol-card{background:var(--card);border:1px solid var(--ln);border-radius:16px;padding:12px;margin:8px 0;text-align:center}.ol-f{width:100%;max-height:210px;object-fit:contain;border-radius:8px;box-shadow:0 0 0 2px var(--ln)}'+
'.ol-k{background:var(--card);border-left:3px solid var(--ac);border-radius:10px;padding:10px 12px;margin:8px 0;line-height:1.7}.ol-k small{display:block;color:var(--mu);font-size:12px}'+
'.ol-r{display:flex;gap:10px}.ol-r .ol-b{margin:9px 0}'+
'.ol-bd{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.ol-bd div{background:var(--card);border:1px solid var(--ln);border-radius:12px;padding:10px 4px;font-size:13px;color:var(--mu2);text-align:center}.ol-bd .on{color:var(--ac);border-color:var(--ac)}.ol-bd small{display:block;font-size:11px;opacity:.8}'+
'.ol-st{background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:12px;margin:8px 0}.ol-st b{color:var(--ac)}'+
'.ol-me{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:12px;margin:8px 0}.ol-me img{width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid #10b981;flex:none}.ol-me b{display:block;color:#fff}.ol-me small{display:block;color:var(--mu);direction:ltr;text-align:left;word-break:break-all}'+
'.ol-bdg{display:inline-flex;align-items:center;gap:4px;margin-inline-start:7px;padding:2px 9px 0;border-radius:999px;font:400 12px/1.5 Anton,Impact,sans-serif;letter-spacing:1.5px;color:#1c1604;white-space:nowrap;font-style:normal;vertical-align:middle}'+
'.ol-bdg.t-gold{background:linear-gradient(135deg,#f6e3a1,#c9992f)}.ol-bdg.t-silver{background:linear-gradient(135deg,#f1f4f7,#9aa7b3)}.ol-bdg.t-premium{background:linear-gradient(135deg,#e4c6ff,#9a6bd6);color:#240a3d}.ol-bdg.t-master{background:linear-gradient(135deg,#6fe6ee,#00bcc8);color:#032a2e}.ol-bdg.t-elite{background:linear-gradient(135deg,#e9ff6e,#d0ff00);color:#1e2800}.ol-bdg.t-king{background:linear-gradient(120deg,#047857,#10b981 42%,#f0bfae 72%,#b76e79);color:#04251b}.ol-bdg.t-legend{background:linear-gradient(135deg,#5b7bc4,#1b2f6b);color:#fff}.ol-bdg.t-phantom{background:linear-gradient(135deg,#ff8a8a,#d4142a);color:#fff}.ol-bdg.t-savage{background:linear-gradient(135deg,#ff9ee8,#e0199f);color:#fff}'+
'.ol-nm.t-gold,.ol-nm.t-silver,.ol-nm.t-premium,.ol-nm.t-master,.ol-nm.t-elite,.ol-nm.t-king,.ol-nm.t-legend,.ol-nm.t-phantom,.ol-nm.t-savage{-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;font-weight:800}'+
'.ol-nm.t-gold{background-image:linear-gradient(100deg,#fff1b8,#e0ac35 45%,#b9831f)}.ol-nm.t-silver{background-image:linear-gradient(100deg,#ffffff,#b9c4cf 50%,#8895a2)}.ol-nm.t-premium{background-image:linear-gradient(100deg,#f1dcff,#b98cf0 50%,#8a5bc9)}.ol-nm.t-master{background-image:linear-gradient(100deg,#b4f5fa,#00bcc8 50%,#00909a)}.ol-nm.t-elite{background-image:linear-gradient(100deg,#f6ffb4,#d0ff00 50%,#a3c900)}.ol-nm.t-king{background-image:linear-gradient(100deg,#34d399,#10b981 35%,#f0bfae 70%,#c27d8a)}.ol-nm.t-legend{background-image:linear-gradient(100deg,#a9bdf0,#4a6bc9 50%,#2b4590)}.ol-nm.t-phantom{background-image:linear-gradient(100deg,#ffb3b3,#ff3b3b 50%,#c4122a)}.ol-nm.t-savage{background-image:linear-gradient(100deg,#ffc2f0,#ff4fd8 50%,#c2189b)}'+
'.ol-av.r-gold,.ol-me img.r-gold{border-color:#e6c25a;box-shadow:0 0 0 2px rgba(230,194,90,.35)}.ol-av.r-silver,.ol-me img.r-silver{border-color:#c3ccd5;box-shadow:0 0 0 2px rgba(195,204,213,.3)}.ol-av.r-premium,.ol-me img.r-premium{border-color:#b98cf0;box-shadow:0 0 0 2px rgba(185,140,240,.35)}.ol-av.r-master,.ol-me img.r-master{border-color:#00bcc8;box-shadow:0 0 0 2px rgba(0,188,200,.35)}.ol-av.r-elite,.ol-me img.r-elite{border-color:#d0ff00;box-shadow:0 0 0 2px rgba(208,255,0,.3)}.ol-av.r-king,.ol-me img.r-king{border-color:#10b981;box-shadow:0 0 0 2px rgba(183,110,121,.5)}.ol-av.r-legend,.ol-me img.r-legend{border-color:#3d5fc0;box-shadow:0 0 0 2px rgba(43,69,144,.5)}.ol-av.r-phantom,.ol-me img.r-phantom{border-color:#ff3b3b;box-shadow:0 0 0 2px rgba(255,59,59,.35)}.ol-av.r-savage,.ol-me img.r-savage{border-color:#ff4fd8;box-shadow:0 0 0 2px rgba(255,79,216,.35)}'+
'.ol-mrow{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px;direction:ltr}.ol-mini{padding:7px 4px;border-radius:999px;border:1px solid var(--ln2);background:var(--card2);color:var(--mu);font:600 13px "IBM Plex Sans Arabic",sans-serif;cursor:pointer}.ol-mini.on{color:#241a04;background:var(--ac);border-color:var(--ac)}.ol-mini.on.t-silver{background:#c3ccd5;border-color:#c3ccd5}.ol-mini.on.t-premium{background:#b98cf0;border-color:#b98cf0}.ol-mini.on.t-master{background:#00bcc8;border-color:#00bcc8;color:#032a2e}.ol-mini.on.t-elite{background:#d0ff00;border-color:#d0ff00;color:#1e2800}.ol-mini.on.t-king{background:linear-gradient(120deg,#047857,#10b981 42%,#f0bfae 72%,#b76e79);border-color:#10b981;color:#04251b}.ol-mini.on.t-legend{background:#1e3a8a;border-color:#3d5fc0;color:#fff}.ol-mini.on.t-phantom{background:#ff3b3b;border-color:#ff3b3b;color:#fff}.ol-mini.on.t-savage{background:#ff4fd8;border-color:#ff4fd8;color:#fff}.ol-me .ol-ust{display:flex;flex-wrap:wrap;gap:2px 12px;direction:ltr}.ol-ust span{white-space:nowrap}'+
'.ol-c h2{color:var(--ac);margin:16px 0 8px;font-weight:700;font-size:20px}'+
/* قصص الجرايم */
'.ol-p{background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:12px;margin:8px 0;line-height:1.7}.ol-p h3{margin:0 0 6px;color:var(--ac);font-size:16px}.ol-p small{color:var(--mu)}'+
'.ol-dead{opacity:.45;text-decoration:line-through}.ol-tag{display:inline-block;background:#a02b2b;color:#fff;border-radius:6px;padding:0 7px;font-size:12px;margin-left:6px;font-style:normal}.ol-v{display:flex;justify-content:space-between;align-items:center;gap:8px}.ol-v .ol-b{width:auto;min-height:40px;margin:4px 0;padding:6px 14px;font-size:14px}'+
'@media (prefers-reduced-motion:reduce){.ol-b,.ol-buzz,.ol-back{transition:none}}'+
/* زرار "العب أونلاين" جوا كل لعبة */
'.ol-go{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:420px;margin:12px auto;padding:13px 14px;border-radius:14px;border:1px dashed var(--olc,#d4b675);background:rgba(0,0,0,.28);color:var(--olc,#d4b675);font:700 16px "IBM Plex Sans Arabic","Tajawal",sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}.ol-go small{font:400 11px Anton,Impact,sans-serif;letter-spacing:3px;color:#8d9d95}.ol-go:active{transform:scale(.98)}#flags .ol-go{--olc:#7ccb9b}#story .ol-go{--olc:#74a5be}#career .ol-go{--olc:#d4b675}';
CSS+=`
#olRoot{--bg:#0a0a0a;--bgr:10,10,10;--bg0:#0b0b0a;--wash:linear-gradient(rgba(10,10,10,.95),rgba(10,10,10,.95)),url(img/bg-checker.webp) center/cover;--card:#141413;--cardr:20,20,19;--card2:#1b1a18;--h1:#1b1a18;--h2:#141413;--ln:#2a2927;--ln2:#41403b;--mu:#8d9d95;--mu2:#6c7c74;--ink:#e9efeb;--ink2:#f3e6c4;--ac:#d4b675;--acr:212,182,117;--acl:#6b5a35;--on:#111;--gr:#0d6b50;--gon:#fff}
#olRoot[data-g="career"]{--bg:#08141d;--bgr:8,20,29;--bg0:#071722;--wash:radial-gradient(ellipse at 50% -8%,rgba(29,69,96,.7),transparent 62%),linear-gradient(rgba(212,182,117,.045) 1px,transparent 1px) 0 0/100% 28px,linear-gradient(90deg,rgba(212,182,117,.045) 1px,transparent 1px) 0 0/28px 100%;--card:#12354d;--cardr:18,53,77;--card2:#163d58;--h1:#1d4560;--h2:#0b2233;--ln:rgba(212,182,117,.38);--ln2:rgba(212,182,117,.5);--mu:#9cc3d6;--mu2:#6b8ea3;--ink:#efe6cf;--ink2:#efe6cf;--ac:#d4b675;--acr:212,182,117;--acl:rgba(212,182,117,.5);--on:#0b2233;--gr:#1d4560;--gon:#efe6cf}
#olRoot[data-g="flags"]{--bg:#151514;--bgr:21,21,20;--bg0:#0f0f0e;--wash:radial-gradient(ellipse at 50% -8%,rgba(122,60,30,.45),transparent 62%),linear-gradient(rgba(124,203,155,.06) 1px,transparent 1px) 0 0/26px 26px,linear-gradient(90deg,rgba(124,203,155,.06) 1px,transparent 1px) 0 0/26px 26px;--card:#1f1e1c;--cardr:31,30,28;--card2:#292724;--h1:#292724;--h2:#1a1917;--ln:#3a3833;--ln2:#57544b;--mu:#b6b3a8;--mu2:#8a877c;--ink:#f7f2d9;--ink2:#f7f2d9;--ac:#7ccb9b;--acr:124,203,155;--acl:rgba(124,203,155,.5);--on:#151514;--gr:#f8a57d;--gon:#151514}
#olRoot[data-g="story"]{--bg:#0e0203;--bgr:14,2,3;--bg0:#2b0203;--wash:radial-gradient(ellipse at 50% -8%,rgba(117,6,8,.75),transparent 62%);--card:#5a0406;--cardr:90,4,6;--card2:#3f0304;--h1:#5c0507;--h2:#2b0203;--ln:rgba(116,165,190,.45);--ln2:rgba(116,165,190,.55);--mu:#e2b4b6;--mu2:#b88487;--ink:#fdf2f1;--ink2:#fdf2f1;--ac:#74a5be;--acr:116,165,190;--acl:rgba(116,165,190,.55);--on:#4a0305;--gr:#74a5be;--gon:#4a0305}
#olRoot[data-g="crime"]{--wash:radial-gradient(ellipse at 50% -8%,rgba(212,182,117,.10),transparent 62%);--bg:#050505;--bgr:5,5,5}
#olRoot[data-g="crime"][data-c="yousef"]{--bg:#1a485f;--bgr:26,72,95;--bg0:#0f2f3f;--wash:linear-gradient(#0000,#0000);--card:#143a4d;--cardr:20,58,77;--card2:#0f2f3f;--h1:#1a485f;--h2:#0f2f3f;--ln:rgba(216,224,164,.28);--ln2:rgba(216,224,164,.4);--mu:#a9c0bc;--mu2:#7f9a96;--ink:#f2f5dc;--ink2:#f2f5dc;--ac:#d8e0a4;--acr:216,224,164;--acl:rgba(216,224,164,.45);--on:#0a0a0a;--gr:#a9b46e;--gon:#0a0a0a}
#olRoot[data-g="crime"][data-c="train"]{--bg:#10112a;--bgr:16,17,42;--bg0:#0a0b1a;--wash:radial-gradient(ellipse 700px 380px at 50% -10%,rgba(255,179,71,.12),transparent 65%);--card:#1d1f3a;--cardr:29,31,58;--card2:#262a4d;--h1:#1d1f3a;--h2:#0a0b1a;--ln:rgba(255,179,71,.3);--ln2:rgba(255,179,71,.45);--mu:#c3bfd6;--mu2:#8d89a6;--ink:#fdf3e1;--ink2:#fdf3e1;--ac:#ffb347;--acr:255,179,71;--acl:rgba(255,179,71,.45);--on:#1a0f00;--gr:#d98a1f;--gon:#1a0f00}
#olRoot[data-g="crime"][data-c^="niyaba"]{--bg:#180d07;--bgr:24,13,7;--bg0:#0d0705;--wash:radial-gradient(circle at 15% 0%,rgba(226,176,100,.10),transparent 45%);--card:#2a1810;--cardr:42,24,16;--card2:#3a2216;--h1:#3a2216;--h2:#180d07;--ln:rgba(226,176,100,.28);--ln2:rgba(226,176,100,.42);--mu:#c99a5c;--mu2:#8f6d40;--ink:#FFF4C7;--ink2:#fbe9c8;--ac:#e2b064;--acr:226,176,100;--acl:rgba(226,176,100,.45);--on:#2a1810;--gr:#a5432f;--gon:#FFF4C7}

/* بطاقة الهيرو زي الأوفلاين: حدود مزدوجة */
.ol-pass{border-color:rgba(var(--acr),.46);box-shadow:0 10px 26px rgba(0,0,0,.45)}
.ol-pass:after{content:"";position:absolute;inset:6px;border-radius:15px;border:1px solid rgba(var(--acr),.22);pointer-events:none}
.ol-pass>*{position:relative;z-index:1}
#olRoot[data-g="story"] .ol-pass:before{content:"";position:absolute;top:0;left:0;right:0;height:7px;z-index:2;opacity:.6;background:repeating-linear-gradient(-45deg,#d4b675 0 6px,#2a0709 6px 12px)}
#olRoot[data-g="career"] .ol-pass:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.07;background:repeating-linear-gradient(135deg,#fff 0 1px,transparent 1px 7px)}
.ol-ticket,.ol-join{border-color:rgba(var(--acr),.5)}
.ol-b.o,.ol-s{border-style:solid}
#olRoot input{border-style:dashed;border-color:rgba(var(--acr),.5)}
.ol-bar{border-bottom-color:rgba(var(--acr),.22)}
#olRoot[data-g="flags"] .ol-ttl{font-family:'JetBrains Mono','IBM Plex Sans Arabic',monospace;letter-spacing:.06em;color:var(--ac)}
#olRoot[data-g="flags"] .ol-w{letter-spacing:.08em;font-size:13px}

/* لوحة النقط زي الأوفلاين */
.ol-score .ol-t{background:rgba(0,0,0,.3);border:1px dashed rgba(var(--acr),.5);border-radius:10px}
.ol-score .ol-t>span{font:400 34px/1 Anton,Impact,sans-serif;letter-spacing:.04em;color:var(--ac)}
.ol-score .ol-t b{font-size:13px;font-weight:600;color:var(--mu)}

/* الأعلام: كارت بأركان وورقة فاتحة */
.ol-fcard{position:relative;background:linear-gradient(175deg,var(--card),#0b0b0a);border:1px solid var(--ln);border-radius:18px;padding:26px 16px;margin:8px 0;box-shadow:0 20px 44px rgba(0,0,0,.5),inset 0 0 0 1px rgba(var(--acr),.05)}
.ol-cn{position:absolute;width:16px;height:16px;border:2px solid var(--ac);opacity:.55}
.ol-cn.a{top:10px;inset-inline-start:10px;border-inline-end:0;border-bottom:0;border-radius:4px 0 0 0}
.ol-cn.b{top:10px;inset-inline-end:10px;border-inline-start:0;border-bottom:0;border-radius:0 4px 0 0}
.ol-cn.c{bottom:10px;inset-inline-start:10px;border-inline-end:0;border-top:0;border-radius:0 0 0 4px}
.ol-cn.d{bottom:10px;inset-inline-end:10px;border-inline-start:0;border-top:0;border-radius:0 0 4px 0}
.ol-fw{display:grid;place-items:center;min-height:190px;padding:14px;background:#f7f2df;border:1px solid var(--ln);border-radius:14px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}
.ol-fw .ol-f{width:100%;max-width:340px;max-height:210px;aspect-ratio:4/3;object-fit:contain;border-radius:4px;border:1px solid rgba(0,0,0,.35);box-shadow:0 8px 20px rgba(0,0,0,.3);background:#fff}

/* أنا مين: أدلة بشريط لاصق */
#olRoot[data-g="story"] .ol-k{position:relative;border:1px dashed rgba(var(--acr),.5);border-radius:6px;background:rgba(0,0,0,.25);box-shadow:0 4px 0 rgba(0,0,0,.35);padding:12px 14px;margin:14px 0}
#olRoot[data-g="story"] .ol-k:after{content:"";position:absolute;top:-6px;inset-inline-end:16px;width:34px;height:12px;background:rgba(212,182,117,.8);transform:rotate(-4deg)}
#olRoot[data-g="story"] .ol-k small{color:var(--ac);font:700 11px/1 'Courier New',monospace;letter-spacing:.18em;margin-bottom:6px}

/* الانتقالات: نفس التايم لاين */
.ol-tl{display:flex;flex-direction:column;margin:16px 0 0}
.ol-stop{display:flex;gap:12px;align-items:stretch}
.ol-nd{flex:none;width:28px;display:flex;flex-direction:column;align-items:center}
.ol-dot{flex:none;width:26px;height:26px;border-radius:3px;display:grid;place-items:center;font:700 12px/1 ui-monospace,Menlo,Consolas,monospace;background:var(--bg);border:2px solid var(--ln);color:var(--mu);box-shadow:0 0 10px rgba(var(--acr),.3)}
.ol-rail{flex:1;width:2px;min-height:14px;margin:3px 0;background:linear-gradient(var(--ac),rgba(var(--acr),.15))}
.ol-stop:last-child .ol-rail{visibility:hidden}
.ol-cc{position:relative;flex:1;min-width:0;margin-bottom:10px;padding:11px 14px;min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-radius:4px;background:linear-gradient(135deg,var(--card2),var(--card));border:1px solid var(--ln)}
.ol-cc:before,.ol-cc:after{content:"";position:absolute;width:9px;height:9px;border:2px solid var(--ac);pointer-events:none;opacity:.85}
.ol-cc:before{top:-1px;inset-inline-start:-1px;border-width:2px 0 0 2px}
.ol-cc:after{bottom:-1px;inset-inline-end:-1px;border-width:0 2px 2px 0}
.ol-stop.is-open .ol-dot{background:var(--ac);border-color:var(--ac);color:var(--on)}
.ol-stop.is-open .ol-cc{border-left:3px solid var(--ac);box-shadow:0 0 16px rgba(var(--acr),.14),inset 0 0 20px rgba(var(--acr),.05)}
.ol-stop.is-open .ol-cc.is-loan{border-left:3px dashed var(--ac)}
.ol-stop.is-hidden .ol-cc{justify-content:center;border-style:dashed;background:repeating-linear-gradient(135deg,rgba(var(--acr),.05) 0 6px,transparent 6px 12px),var(--bg0)}
.ol-club{flex:1;min-width:0;font-size:16px;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:ltr;text-align:start}
.ol-yrs{flex:none;font:12.5px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.04em;color:var(--mu)}
.ol-loan{flex:none;padding:1px 9px;border-radius:2px;font-size:11.5px;font-weight:700;background:rgba(var(--acr),.14);color:var(--ac);border:1px solid var(--ac)}
.ol-q{font-size:20px;font-weight:700;color:rgba(var(--acr),.5)}
`;
CSS+=':root{--x-user:'+SV("<circle cx='12' cy='8' r='3.6'/><path d='M5 20c0-4 3-6 7-6s7 2 7 6'/>")+';--x-users:'+SV("<circle cx='9' cy='8' r='3.2'/><path d='M3 20c0-3.6 2.7-5.5 6-5.5s6 1.9 6 5.5'/><circle cx='17' cy='9' r='2.6'/><path d='M17 14.5c2.6 0 4.5 1.6 4.5 4.5'/>")+';--x-plus:'+SV("<circle cx='10' cy='8' r='3.6'/><path d='M3 20c0-4 3-6 7-6 2 0 3.6.5 4.8 1.4M19 9v6M16 12h6'/>")+';--x-pencil:'+SV("<path d='M4 20l1-4L16 5l3 3L8 19zM14 7l3 3'/>")+';--x-send:'+SV("<path d='M22 2L11 13M22 2l-7 20-4-9-9-4z'/>")+';--x-crown:'+SV("<path d='M3 8l4 4 5-7 5 7 4-4-2 11H5z'/>")+';--x-close:'+SV("<path d='M6 6l12 12M18 6L6 18'/>")+'}';
CSS+=`
.ol-meta{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:2px 0 10px}
.ol-meta span{padding:3px 11px;border-radius:999px;border:1px solid var(--ln);background:rgba(0,0,0,.25);color:var(--mu);font-size:12.5px}
.ol-meta b{color:var(--ac);font-weight:700}
.ol-neg{color:#ff8a80!important}
.ol-pb{display:block;width:100%;height:5px;margin-top:8px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden}
.ol-pb i{display:block;height:100%;background:var(--ac);border-radius:9px;transition:width .35s}
.ol-of{font-style:normal;font-size:11.5px;line-height:1;color:var(--mu2);margin-top:5px}
.ol-ck{cursor:pointer}.ol-ck:active{transform:scale(.985)}
.ol-t .ol-i{color:var(--mu2);flex:none}
.ol-chips{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
.ol-chip{min-height:46px;border-radius:12px;border:1px solid var(--ln2);background:rgba(0,0,0,.25);color:var(--mu);font:400 24px/1 Anton,Impact,sans-serif;cursor:pointer;padding-top:4px}
.ol-chip.on{background:var(--ac);color:var(--on);border-color:var(--ac);box-shadow:0 0 14px rgba(var(--acr),.35)}
.ol-sw{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;margin:12px 0 0;padding:12px 14px;border-radius:14px;border:1px dashed rgba(var(--acr),.5);background:rgba(0,0,0,.25);color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.ol-sw b{display:block;font-size:15px}.ol-sw small{display:block;color:var(--mu);font-size:12.5px;margin-top:2px;line-height:1.5}
.ol-sw>i{flex:none;position:relative;width:46px;height:26px;border-radius:99px;background:var(--ln2);transition:background .15s}
.ol-sw>i:after{content:"";position:absolute;top:3px;inset-inline-start:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .15s}
.ol-sw.on>i{background:var(--ac)}.ol-sw.on>i:after{transform:translateX(20px)}
.ol-hint2{margin:8px 2px 12px;color:var(--mu2);font-size:12.5px;text-align:center;line-height:1.6}
.ol-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0 0}.ol-acts .ol-b{margin:0}.ol-full{grid-column:1/-1}
.ol-fin{text-align:center;margin:6px 0 4px}
.ol-winner{display:flex;flex-direction:column;align-items:center;gap:6px;margin:10px 0 14px;padding:18px 12px;border-radius:18px;border:1px solid rgba(var(--acr),.5);background:linear-gradient(160deg,var(--h1),var(--h2));box-shadow:0 10px 26px rgba(0,0,0,.4)}
.ol-winner>.ol-i{width:34px;height:34px;color:var(--ac)}
.ol-winner .ol-av,.ol-winner .ol-ph{width:64px;height:64px;border-width:2px}
.ol-winner b{font-size:19px}.ol-winner>span{color:var(--ac);font:400 24px/1 Anton,Impact,sans-serif;letter-spacing:.06em}
.ol-t>span,.ol-score .ol-t>span,.ol-kpis b,.ol-gs-h span,.ol-winner>span,.ol-board span{direction:ltr;unicode-bidi:isolate}
.ol-kpis{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:8px;margin:0 0 6px}
.ol-kpis>div{padding:12px 6px 10px;text-align:center;border-radius:14px;border:1px solid var(--ln);background:var(--card)}
.ol-kpis>div:first-child{border-color:rgba(var(--acr),.5);background:linear-gradient(160deg,var(--h1),var(--h2))}
.ol-kpis b{display:block;font:400 32px/1 Anton,Impact,sans-serif;letter-spacing:.04em;color:var(--ac);padding-top:3px}
.ol-kpis small{display:block;margin-top:5px;color:var(--mu);font-size:12px}
.ol-gs{margin:9px 0;padding:13px 14px;border-radius:16px;border:1px solid var(--ln);background:var(--card)}
.ol-gs-h{display:flex;align-items:baseline;justify-content:space-between}.ol-gs-h b{font-size:16px}
.ol-gs-h span{font:400 26px/1 Anton,Impact,sans-serif;color:var(--ac);letter-spacing:.04em}.ol-gs-h small{font:400 12px sans-serif;color:var(--mu);letter-spacing:0}
.ol-gs-r{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:8px;color:var(--mu);font-size:12.5px}.ol-gs-r b{color:var(--ink)}
.ol-acc{height:5px;margin-top:10px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden}.ol-acc i{display:block;height:100%;background:var(--ac)}
.ol-accl{display:block;margin-top:5px;color:var(--mu2);font-size:11.5px}
`;
var CHEV='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
function root(){if(!ov){ov=document.getElementById("olRoot")||document.createElement("div");ov.id="olRoot";document.body.appendChild(ov);}return ov;}
function shell(h,o){o=o||{};root();var top=ov.scrollTop;ov.setAttribute("data-g",o.g||(o.room&&S&&G[S.game||"flags"]?(S.game||"flags"):(vw==="menu"&&mk?mk:"base")));if(o.c)ov.setAttribute("data-c",o.c);else ov.removeAttribute("data-c");inRoom=!!o.room;playing=!!o.playing;var c=o.code||(o.room?code:"");
  ov.innerHTML='<div class="ol-c"><div class="ol-bar"><button type="button" class="ol-back" onclick="OL.up()" aria-label="Back">'+CHEV+'</button><div class="ol-ttl">'+e(o.t||"Online")+'</div>'+(c?'<div class="ol-pill" dir="ltr">'+e(c)+'</div>':'')+'</div>'+h+'</div>';
  ov.scrollTop=(lastT===o.t)?top:0;lastT=o.t;}
function menu(k){if(k)mk=k;k=mk||"flags";vw="menu";var m=META[k],crime=k==="crime";
  shell('<div class="ol-pass"><div class="ol-pass-top"><span class="ol-glyph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+m.ic+'</svg></span><div><b>'+e(m.n)+'</b><small>'+e(m.d)+'</small></div></div><div class="ol-perf"></div><div class="ol-pass-bot"><button type="button" class="ol-b" onclick="'+(crime?'OLS.open()':'OL.create(\''+k+'\')')+'">'+(crime?'Pick a story and open the room':'Open a new room')+'</button><p class="ol-hint">'+e(m.who)+((k==="xo"||k==="ludo"||k==="sudoku")?'.':'. You run the room.')+'</p></div></div>'+
   '<div class="ol-join"><label for="olCode">Have a room code?</label><div class="ol-join-row"><input id="olCode" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="0000" autocomplete="off" onkeydown="if(event.key===\'Enter\')OL.join()"><button type="button" class="ol-b g" onclick="OL.join()">Join</button></div></div>'+((k==="xo"||k==="ludo"||k==="sudoku")?'':'<button type="button" class="ol-s" onclick="OL.sug(\''+k+'\')">'+IX('pencil')+' Suggest a question for this game</button>'),{t:m.n+" Online",g:k});}
var BD={gold:"Golden",silver:"Silver",premium:"Premium",master:"Master",elite:"Elite",king:"King",legend:"Legend",phantom:"Phantom",savage:"Savage"},BK=["premium","silver","gold","master","elite","king","legend","phantom","savage"];
function bk(id){return BD[BDG[id]]?BDG[id]:"";}
function bdg(id){var k=bk(id);return k?'<i class="ol-bdg t-'+k+'">&#9733; '+BD[k]+'</i>':"";}
function nmu(id,name){var k=bk(id);return'<span class="ol-nm'+(k?' t-'+k:'')+'" dir="auto">'+e(name)+'</span>'+bdg(id);}
function nm(p){return nmu(p.uid,p.name);}
function loadB(){return db.ref("badges").once("value").then(function(s){BDG=s.val()||{};},function(){});}
function setBadge(id,k){var on=k&&BD[k];db.ref("badges/"+id).set(on?k:null).then(function(){if(on)BDG[id]=k;else delete BDG[id];T(on?BD[k]+" badge given":"Badge removed");users();}).catch(function(){T("Couldn't change the badge. Make sure the Rules are published");});}
function pl(){var P=S.players||{};return Object.keys(P).map(function(k){return P[k];});}
function ids(){return pl().map(function(p){return p.uid;});}
function av(p){return p.photo?'<img class="ol-av'+(bk(p.uid)?' r-'+bk(p.uid):'')+'" referrerpolicy="no-referrer" alt="" src="'+e(p.photo)+'">':'<span class="ol-ph"></span>';}
function board(){var sc=S.scores||{};return pl().map(function(p){return'<div class="ol-t ol-ck" onclick="OL.prof(\''+e(p.uid)+'\')"><b>'+av(p)+nm(p)+'</b><span>'+((sc[p.uid]||{}).pts||0)+'</span></div>';}).join("")||'<div class="ol-w">No players yet</div>';}
function g(){return G[S.game||"flags"];}
var MO=["January","February","March","April","May","June","July","August","September","October","November","December"];
function mkey(d){d=d||new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2);}
function opts(){var o=(S&&S.opts)||{};return{neg:o.neg===0?0:1,tg:o.tg>0?+o.tg:10};}
function lockedFor(id){var m=g().tries;return m>0&&(((S.tries||{})[id])||0)>=m;}
function shufA(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function ent(k,x){return typeof k==="number"?g().data()[k]:((x||S.x||{})[k]);}
function cur(){return ent(S.deck[S.i]);}
function okEnt(gk,d){if(!d)return false;if(gk==="flags")return!!(d[0]&&d[1]);if(gk==="story")return!!(d.name&&d.clues&&d.clues.length>=3);if(gk==="career")return!!(d.n&&d.c&&d.c.length>=3);return false;}
function IX(n){return'<i class="ol-i" style="--ic:var(--x-'+n+')"></i>';}
function X(n,a){return window.OLX&&OLX[n]?OLX[n](a):"";}
function lastLine(){var l=S.last;if(!l)return"";return'<div class="ol-l">'+(l.w?IC('x')+' '+e(l.who)+' answered wrong'+(l.m?' <b class="ol-neg">−'+l.m+'</b>':''):l.skip?'Skipped: '+e(l.name):IC('check')+' '+e(l.who)+' got '+l.p+' · '+e(l.name))+'</div>';}
function chips(){var o=opts(),m=g().tries;return'<div class="ol-meta"><span>First to <b>'+o.tg+'</b> pts</span><span>'+(o.neg?'Wrong <b class="ol-neg">−1</b>':'No penalty')+'</span><span>'+(m?'<b>'+m+'</b> tries per question':'Unlimited tries')+'</span></div>';}
function draw(){
  if(!ov)return;
  if(!S){if(code){T("The room was closed");OL.exit();}return;}
  if(S.game==="xo"){if(window.OLXO)return OLXO.draw();shell('<div class="ol-w">Loading...</div>',{room:true,t:"XO",g:"xo"});setTimeout(draw,300);return;}
  if(S.game==="ludo"){if(window.OLLUDO)return OLLUDO.draw();shell('<div class="ol-w">Loading...</div>',{room:true,t:"LUDO",g:"ludo"});setTimeout(draw,300);return;}
  if(S.game==="sudoku"){if(window.OLSD)return OLSD.draw();shell('<div class="ol-w">Loading...</div>',{room:true,t:"Sudoku",g:"sudoku"});setTimeout(draw,300);return;}
  var host=role==="host",me=U().uid,b=S.buzz,gm=g(),st=S.step||0,op=opts(),o={room:true,t:gm.n+" Room"};vw="room";
  if(S.status==="lobby"){
    var ps=pl(),rows=ps.map(function(p){return'<div class="ol-t ol-ck" onclick="OL.prof(\''+e(p.uid)+'\')"><b>'+av(p)+nm(p)+'</b>'+IX('user')+'</div>';}).join("")+(ps.length<2?'<div class="ol-t empty">Waiting for a player...</div>':"");
    var set=host?'<div class="ol-sec">First to how many points?</div><div class="ol-chips">'+[5,10,15,20,30,50].map(function(n){return'<button type="button" class="ol-chip'+(op.tg===n?' on':'')+'" onclick="OL.opt(\'tg\','+n+')">'+n+'</button>';}).join("")+'</div><button type="button" class="ol-sw'+(op.neg?' on':'')+'" onclick="OL.opt(\'neg\','+(op.neg?0:1)+')"><span><b>Wrong answers cost 1 point</b><small>'+(op.neg?'A wrong answer takes −1 and the player can try again':'No penalty for wrong answers, but they still count in stats')+'</small></span><i></i></button><div class="ol-hint2">'+(gm.tries?'Each player gets '+gm.tries+' tries per question':'Unlimited tries: a wrong answer can be retried')+'</div>':chips();
    shell('<div class="ol-ticket" onclick="OL.copy()"><small>Room code · tap to copy</small><div class="ol-code">'+e(code)+'</div><span>Send the code to the players</span></div><div class="ol-sec">Players ('+ps.length+'/2)</div>'+rows+set+
      (host?'<button type="button" class="ol-b" onclick="OL.start()">Start Game</button>':'<div class="ol-w">Waiting for the host to start...</div>'),o);
  }else if(S.status==="play"){
    o.playing=true;
    var it=cur();
    if(!it){shell('<div class="ol-w">This question is not available, press Skip</div>'+(host?'<button type="button" class="ol-b o" onclick="OL.next()">Skip</button>':''),o);return;}
    var head=chips()+'<div class="ol-w">'+e(gm.n)+' · Question '+(S.i+1)+(gm.steps>1?' · worth '+gm.pts(st)+' pts':'')+'</div>'+strip()+gm.view(it,st,S.ord);
    if(host){var out=pl().filter(function(p){return lockedFor(p.uid);}).map(function(p){return e(p.name);});
      shell(head+'<div class="ol-a">Answer: <b>'+e(gm.ans(it))+'</b></div>'+lastLine()+(b?'<div class="ol-bz">'+IC('bell',1)+' '+e(b.name)+' buzzed first!</div><div class="ol-r"><button type="button" class="ol-b" onclick="OL.mark(1)">'+IC('check')+' Correct</button><button type="button" class="ol-b r" onclick="OL.mark(0)">'+IC('x')+' Wrong'+(op.neg?' (−1)':'')+'</button></div>':'<div class="ol-w">'+(out.length?out.join(", ")+' out of tries · ':'')+'Waiting for a buzz...</div>')+
        '<div class="ol-acts">'+(gm.steps>1&&st<gm.steps-1?'<button type="button" class="ol-b o ol-full" onclick="OL.hint()">'+IC('eye')+' Next Clue</button>':'')+'<button type="button" class="ol-b o" onclick="OL.shuffle()">'+IC('shuffle')+' Shuffle</button><button type="button" class="ol-b o" onclick="OL.next()">'+IC('skip')+' Skip</button></div><div class="ol-hint2">Shuffle: another question, the answer stays hidden · Skip: reveals the answer and moves on</div><button type="button" class="ol-s" onclick="OL.fin()">End Game</button>',o);}
    else{var lk=lockedFor(me),tr=(S.tries||{})[me]||0,left=gm.tries?gm.tries-tr:0,
        msg=b?(b.uid===me?IC('bell',1)+' You buzzed first! Answer out loud':e(b.name)+' buzzed first'):lk?'You are out of tries on this question':(tr&&gm.tries?left+(left===1?' try left':' tries left'):'');
      shell(head+lastLine()+'<div class="ol-bz">'+msg+'</div><button type="button" class="ol-buzz" '+(b||lk?'disabled':'')+' onclick="OL.buzz()">ANSWER!</button>',o);}
  }else{
    var sc=S.scores||{},best=pl().sort(function(a,c){return((sc[c.uid]||{}).pts||0)-((sc[a.uid]||{}).pts||0);}),w=best[0],wp=w?((sc[w.uid]||{}).pts||0):0;
    shell('<div class="ol-fin">'+(w&&wp>0?'<div class="ol-winner">'+IC('trophy',1)+'<small class="ol-kick">WINNER</small>'+av(w)+'<b>'+nm(w)+'</b><span>'+wp+' pts</span></div>':'<div class="ol-w">Game over · nobody scored</div>')+'</div>'+board()+
      (host?'<button type="button" class="ol-b" onclick="OL.start()">Play Again</button><button type="button" class="ol-b r" onclick="OL.close()">Close Room</button>':'<div class="ol-w">Your result was saved to your account</div><button type="button" class="ol-b" onclick="OL.rank()">'+IC('chart',1)+' Ranking</button><button type="button" class="ol-b o" onclick="OL.stats()">My Stats</button>'),o);
    if(!host)saveStats();
  }
}
function strip(){var sc=S.scores||{},ps=pl(),tg=opts().tg;return'<div class="ol-score">'+ps.map(function(p){var v=(sc[p.uid]||{}).pts||0,w=Math.max(0,Math.min(100,v/tg*100));return'<div class="ol-t ol-ck" onclick="OL.prof(\''+e(p.uid)+'\')"><b>'+av(p)+nm(p)+'</b><span>'+v+'</span><i class="ol-pb"><i style="width:'+w+'%"></i></i><em class="ol-of">of '+tg+'</em></div>';}).join("")+'</div>';}
function syncLB(cb){var u=U();if(!u||!db){if(cb)cb();return;}
  db.ref("users/"+u.uid+"/stats").once("value").then(function(s){return db.ref("lb/"+u.uid).update({n:u.displayName||"Player",p:u.photoURL||"",s:s.val()||null,u:Date.now()});}).then(function(){if(cb)cb();},function(){if(cb)cb();});}
function saveStats(){var k="olst_"+code+"_"+S.created;try{if(localStorage.getItem(k))return;localStorage.setItem(k,"1");}catch(x){}
  var sc=S.scores||{},m=sc[U().uid]||{},top=Math.max.apply(null,ids().map(function(i){return(sc[i]||{}).pts||0;})),w=(m.pts||0)>0&&m.pts>=top?1:0,u=U(),mo=mkey();
  db.ref("users/"+u.uid+"/stats/"+(S.game||"flags")).transaction(function(c){c=c||{pts:0,right:0,wrong:0,games:0,wins:0};c.pts+=m.pts||0;c.right+=m.right||0;c.wrong+=m.wrong||0;c.games+=1;c.wins=(c.wins||0)+w;return c;},function(){
    syncLB(function(){db.ref("lb/"+u.uid+"/m/"+mo).transaction(function(c){return(c||0)+(m.pts||0);});});});}
function mail(u){return(u&&(u.email||(u.providerData&&u.providerData[0]&&u.providerData[0].email)))||"";}
function isAdmin(){var u=U();return!!(u&&ADM&&ADM[u.uid]===true);}
function canClaim(){return ADM===false;}
function claim(){var u=U();if(!canClaim())return;
  db.ref("admins/"+u.uid).set(true).then(function(){T("You are now the admin");stats();}).catch(function(){T("Couldn't set you as admin. Make sure the Rules are published");});}
function me(){var u=U();return'<div class="ol-me">'+(u.photoURL?'<img class="'+(bk(u.uid)?'r-'+bk(u.uid):'')+'" referrerpolicy="no-referrer" alt="" src="'+e(u.photoURL)+'">':'')+'<div><b>'+nmu(u.uid,u.displayName||"Player")+'</b><small>'+e(mail(u))+'</small></div></div>';}
var synced=false;
var sTry=0;
function stats(){var u=U();vw="stats";
  db.ref("admins").once("value").then(function(a){ADM=a.exists()?a.val():false;},function(){ADM=null;}).then(function(){return db.ref("users/"+u.uid+"/stats").once("value");}).then(function(s){
    var v=s.val()||{};
    var go=function(){if(vw!=="stats")return;OLX.me({v:v,adm:isAdmin(),claim:canClaim(),inRoom:!!code});};
    if(window.OLX&&OLX.me){sTry=0;if(!synced){synced=true;syncLB(go);}else go();}
    else{shell('<div class="ol-w">Loading...</div>',{t:"Account",g:"base"});if(++sTry<12)setTimeout(function(){if(vw==="stats")stats();},400);}
  }).catch(function(){T("Couldn\'t load your stats");});}
/* Sync Ranking (admin): copies every player's points from users to lb in one go, without touching monthly points */
function syncAll(){if(!isAdmin())return;var b=document.getElementById("olSyncB");if(b&&b.disabled)return;if(b)b.disabled=true;
  db.ref("users").once("value").then(function(s){var v=s.val()||{},d={},n=0;
    Object.keys(v).forEach(function(id){var x=v[id]||{},st=x.stats,p=x.profile||{};if(!st||typeof st!=="object")return;
      var g=0;Object.keys(st).forEach(function(k){g+=((st[k]||{}).games)||0;});if(!g)return;
      d["lb/"+id+"/n"]=p.name||"Player";d["lb/"+id+"/p"]=p.photo||"";d["lb/"+id+"/s"]=st;d["lb/"+id+"/u"]=Date.now();n++;});
    if(!n){T("No players need syncing");return;}
    return db.ref().update(d).then(function(){T("Synced "+n+" player"+(n===1?"":"s"));});
  }).catch(function(){T("Couldn't sync. Make sure the Rules are published");}).then(function(){if(b)b.disabled=false;});}
function users(){if(!isAdmin())return;vw="users";
  loadB().then(function(){return db.ref("users").once("value");}).then(function(s){var v=s.val()||{};
    var L=Object.keys(v).map(function(id){var x=v[id]||{};return{id:id,p:x.profile||{},st:x.stats||{}};}).sort(function(a,b){return(b.p.updated||0)-(a.p.updated||0);});
    shell('<div class="ol-w">'+L.length+' users</div>'+L.map(function(u){var gg=0,pt=0;Object.keys(u.st).forEach(function(k){gg+=u.st[k].games||0;pt+=u.st[k].pts||0;});
      var d=u.p.updated?new Date(u.p.updated).toLocaleDateString("en-GB"):"—";
      return'<div class="ol-me">'+(u.p.photo?'<img class="'+(bk(u.id)?'r-'+bk(u.id):'')+'" referrerpolicy="no-referrer" alt="" src="'+e(u.p.photo)+'">':'')+'<div><b>'+nmu(u.id,u.p.name||"No name")+'</b>'+(u.p.email?'<small>'+e(u.p.email)+'</small>':'')+'<small dir="ltr">ID: '+e(u.id.slice(0,10))+'…</small><small class="ol-ust"><span>Last seen: '+d+'</span><span>Online sessions: '+gg+'</span><span>Points: '+pt+'</span></small><div class="ol-mrow">'+BK.map(function(k){return'<button type="button" class="ol-mini t-'+k+(bk(u.id)===k?' on':'')+'" onclick="OL.badge(\''+e(u.id)+'\',\''+(bk(u.id)===k?'':k)+'\')">'+BD[k]+'</button>';}).join("")+'</div></div></div>';}).join(""),{t:"Users"});
  }).catch(function(){T("No permission. Make sure the Rules are published");});}
function push(u){db.ref("rooms/"+code).update(u);}
function listen(){try{localStorage.setItem("pp_room",JSON.stringify({c:code,t:Date.now()}));}catch(x){}var r=db.ref("rooms/"+code),f=r.on("value",function(s){S=s.val();draw();});off=function(){r.off("value",f);};}
function bail(m){busy=false;code=role=null;T(m);if(!vw)OL.exit();}
function mkRoom(pay,cb,ns){var u=U(),n=0;(function go(){var c=String(1000+Math.floor(Math.random()*9000));
  db.ref("rooms/"+c).transaction(function(x){if(x&&Date.now()-(x.created||0)<43200000)return;return pay;},function(err,ok){
    if(err||!ok){if(++n<8)return go();return cb(err||new Error("full"));}
    db.ref("secrets/"+c).remove().catch(function(){});db.ref("votes/"+c).remove().catch(function(){});cb(null,c);if(!ns)sweep(u.uid,c);});})();}
function sweep(id,keep){var L=[];try{L=JSON.parse(localStorage.getItem("pp_hosted")||"[]");}catch(x){}
  L.forEach(function(c){if(c===keep)return;db.ref("rooms/"+c+"/host").once("value").then(function(s){if(s.val()!==id)return;
    return db.ref("secrets/"+c).remove().then(function(){return db.ref("votes/"+c).remove();}).then(function(){return db.ref("rooms/"+c).remove();});}).catch(function(){});});
  try{localStorage.setItem("pp_hosted",JSON.stringify([keep]));}catch(x){}}
function create(k){if(busy)return;var u=U();busy=true;role="host";
  var pay={host:u.uid,hostName:u.displayName||"",game:k,status:"lobby",opts:{neg:1,tg:10},created:Date.now()};
  if(k==="xo")pay.players={a:{uid:u.uid,name:u.displayName||"Player",photo:u.photoURL||"",rd:1,mv:"",w:0}};
  if(k==="ludo"){pay.players={a:{uid:u.uid,name:u.displayName||"Player",photo:u.photoURL||"",mv:""}};pay.opts={three:1,full:0};pay.gid=0;}
  if(k==="sudoku"){pay.players={a:{uid:u.uid,name:u.displayName||"Player",photo:u.photoURL||"",w:0,pr:0,pg:0}};pay.diff="easy";pay.rnd=0;}
  mkRoom(pay,function(err,c){
    if(err){var pd=err.code==="PERMISSION_DENIED"||/permission/i.test(err.message||"");return bail(pd?"Not allowed to open a room. Make sure the Rules are published":"No free room code right now, try again");}
    busy=false;code=c;listen();});}
function join(c0){if(busy)return;var u=U(),c=String(c0||(document.getElementById("olCode")||{}).value||"").replace(/\D/g,"");
  if(c.length!==4){T("Enter the 4-digit room code");return;}busy=true;
  db.ref("rooms/"+c).once("value").then(function(s){var r=s.val();
    if(!r){try{localStorage.removeItem("pp_room");}catch(x){}return bail("Room not found");}
    code=c;role=r.host===u.uid?"host":"player";
    if(role==="host"){busy=false;return listen();}
    var SL=r.game==="ludo"?["a","b","c","d"]:["a","b"],v=r.players||{},mine=SL.filter(function(x){return v[x]&&v[x].uid===u.uid;})[0];
    if(mine){busy=false;return listen();}
    if(r.status&&r.status!=="lobby")return bail("The game already started, you cannot join now");
    var me={uid:u.uid,name:u.displayName||"Player",photo:u.photoURL||""};
    (function claim(i){var k=SL[i];if(!k)return bail("The room is full");
      db.ref("rooms/"+c+"/players/"+k).transaction(function(x){return x&&x.uid!==u.uid?undefined:me;},function(err,ok){
        if(err)return bail("Could not join");
        if(ok){busy=false;listen();}else claim(i+1);});})(0);
  }).catch(function(){bail("Could not join");});}
function shuf(n){var a=[],i;for(i=0;i<n;i++)a.push(i);return a.sort(function(){return Math.random()-.5;});}

function pool(gk,cb){db.ref("qok/"+gk).once("value").then(function(v){v=v.val()||{};var r={};Object.keys(v).forEach(function(id){var d=(v[id]||{}).d;if(okEnt(gk,d))r["q"+id]=d;});cb(r);},function(){cb({});});}
function ordFor(x){return x&&x.c?shuf(x.c.length):null;}
function start(){var gm=g(),gk=S.game||"flags";if(ids().length<1){T("Nobody has joined the room yet");return;}
  pool(gk,function(xs){var keys=Object.keys(xs),all=[],i,n=gm.data().length,sc={};for(i=0;i<n;i++)all.push(i);
    var deck=shufA(all.concat(keys));ids().forEach(function(id){sc[id]={pts:0,right:0,wrong:0};});
    push({status:"play",deck:deck,x:keys.length?xs:null,i:0,step:0,ord:ordFor(ent(deck[0],xs)),buzz:null,locked:null,tries:null,last:null,fin:null,scores:sc,created:Date.now()});});}
function advance(u,last){var n=S.i+1;u.buzz=null;u.locked=null;u.tries=null;u.step=0;u.last=last;
  if(n>=S.deck.length)u.status="end";else{u.i=n;u.ord=ordFor(ent(S.deck[n]));}push(u);}
function mark(ok){var b=S.buzz;if(!b)return;var op=opts(),s=(S.scores||{})[b.uid]||{pts:0,right:0,wrong:0},u={},p=g().pts(S.step||0),nm0=g().ans(cur());
  if(ok){var np=s.pts+p;u["scores/"+b.uid]={pts:np,right:s.right+1,wrong:s.wrong};
    if(np>=op.tg){u.status="end";u.buzz=null;u.tries=null;u.fin=b.uid;u.last={name:nm0,who:b.name,p:p};push(u);return;}
    advance(u,{name:nm0,who:b.name,p:p});}
  else{var d=op.neg?1:0,n=(((S.tries||{})[b.uid])||0)+1;u["scores/"+b.uid]={pts:s.pts-d,right:s.right,wrong:s.wrong+1};u["tries/"+b.uid]=n;u.buzz=null;u.last={w:1,who:b.name,m:d};push(u);}}
function hint(){push({step:(S.step||0)+1,buzz:null});}
function next(){advance({},{skip:1,name:g().ans(cur())});}
function shuffle(){var d=(S.deck||[]).slice(),i=S.i,n=d.length;if(n-i<2){T("No more questions");return;}
  var j=i+1+Math.floor(Math.random()*(n-i-1)),t=d[i];d[i]=d[j];d[j]=t;
  push({deck:d,ord:ordFor(ent(d[i])),step:0,buzz:null,tries:null,last:null});}
function endNow(){if(confirm("End the game now?"))push({status:"end",buzz:null,fin:null});}
function opt(k,v){if(role!=="host"||!S||S.status!=="lobby")return;var u={};u["opts/"+k]=v;push(u);}
function buzz(){var u=U();db.ref("rooms/"+code+"/buzz").transaction(function(c){return c?undefined:{uid:u.uid,name:u.displayName||"Player",t:Date.now()};});}
function copy(){var u=location.origin+location.pathname+"?room="+code;try{if(navigator.share){navigator.share({title:"GAME",text:"Join room "+code,url:u}).catch(function(){});return;}navigator.clipboard.writeText(u).then(function(){T("Room link copied");});}catch(x){}}
function exit(){var sh0=document.getElementById("olSheet");if(sh0)sh0.remove();try{localStorage.removeItem("pp_room");}catch(x){}if(off)off();off=null;code=role=S=null;vw=null;inRoom=playing=busy=false;if(ov){ov.remove();ov=null;}
  if(document.body.classList.contains("ol-open")){document.body.classList.remove("ol-open");try{window.scrollTo(0,sy);}catch(x){}}
  if(hist){hist=false;try{history.back();}catch(x){}}}
/* Back from inside a screen: one level up */
function up(){
  var sh=document.getElementById("olSheet");if(sh){sh.remove();return;}
  if(vw==="x"&&window.OLX)return OLX.back();
  if(inRoom){if(playing&&!confirm("Leave the game?"))return;OL.exit();return;}
  if(vw==="users")return stats();
  if(vw==="stats"){if(code)return draw();if(mk)return menu();}
  OL.exit();}
/* Phone back button: closes online mode instead of leaving it over the page */
function pushH(){if(hist)return;var s=document.querySelector("section:not(.hidden)"),id=s?s.id:"hub";try{history.pushState({s:id,ol:1},"");hist=true;}catch(x){}}
window.addEventListener("popstate",function(){if(!ov)return;hist=false;
  var sh=document.getElementById("olSheet");if(sh){sh.remove();pushH();return;}
  if(inRoom&&playing){pushH();T("A game is running. Use the back button at the top to leave");return;}
  OL.exit();});
document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&ov)OL.up();});
function ensure(go){
  if(!U()){T("Sign in with Google first");return;}
  var run=function(){var fresh=!ov;if(fresh){sy=window.pageYOffset||0;document.body.classList.add("ol-open");}root();if(fresh)pushH();loadB().then(go);};
  if(db)return run();
  if(window.firebase&&firebase.database){db=firebase.database();return run();}
  var s=document.createElement("script");s.src=SDK+"firebase-database-compat.js";
  s.onload=function(){db=firebase.database();run();};s.onerror=function(){T("Could not load online mode. Check your connection");};document.head.appendChild(s);
}
function open(k){mk=k||"flags";ensure(function(){menu(mk);});}
function account(){mk=null;ensure(stats);}
window.OL={test:function(){if(window.OLT)return OLT.run();var s=document.createElement("script");s.src="js/online-test.js?v=2";s.onload=function(){OLT.run();};s.onerror=function(){T("Could not load the system check");};document.head.appendChild(s);},mk:mkRoom,nmu:nmu,bdg:bdg,badge:setBadge,shell:shell,users:users,syncAll:syncAll,claim:claim,open:open,account:account,create:create,join:join,start:start,mark:mark,hint:hint,next:next,buzz:buzz,copy:copy,exit:exit,up:up,back:up,stats:stats,opt:opt,shuffle:shuffle,fin:endNow,
  prof:function(id,fb){if(!fb&&S){var P=S.players||{};Object.keys(P).forEach(function(k){if(P[k].uid===id)fb={name:P[k].name,photo:P[k].photo};});}if(window.OLX)OLX.prof(id,fb);},rank:function(){if(window.OLX)OLX.go("rank");},queue:function(){if(window.OLX)OLX.queue();},
  sug:function(k){if(!U()){T("Sign in with Google first");return;}if(window.OLX)OLX.sug(k,k?function(){OL.open(k);}:null);},
  rejoin:function(c){ensure(function(){OL.join(c);});},
  signOut:function(){OL.exit();if(window.ppSignOut)window.ppSignOut();},close:function(){if(confirm("Close the room for everyone?"))db.ref("rooms/"+code).remove();}};
OL.i={db:function(){return db;},e:e,U:U,T:T,IC:IC,IX:IX,bk:bk,nmu:nmu,loadB:loadB,adm:isAdmin,BADGES:BADGES,G:G,META:META,shell:shell,syncLB:syncLB,mkey:mkey,MO:MO,ctx:function(){return{S:S,code:code,role:role};},sv:function(v){vw=v;},mail:mail};
var lx=document.createElement("script");lx.src="js/online-social.js?v=2";document.head.appendChild(lx);
var ls=document.createElement("script");ls.src="js/online-story.js?v=8";document.head.appendChild(ls);var lp=document.createElement("script");lp.src="js/online-plus.js?v=8";document.head.appendChild(lp);var lo=document.createElement("script");lo.src="js/online-xo.js?v=1";document.head.appendChild(lo);var ll=document.createElement("script");ll.src="js/online-ludo.js?v=1";document.head.appendChild(ll);var lsd=document.createElement("script");lsd.src="js/online-sudoku.js?v=1";document.head.appendChild(lsd);
var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
/* "Play Online" button inside each game as a separate option (no outer button on the hub) */
function mount(id,k,anchor,mode){var sec=document.getElementById(id);if(!sec||sec.querySelector(".ol-go"))return;
  var a=sec.querySelector(anchor);if(!a)return;
  var b=document.createElement("button");b.type="button";b.className="ol-go";
  b.innerHTML=IC("globe")+' Play Online <small dir="ltr">ONLINE</small>';
  b.onclick=function(){try{playClickSound();}catch(x){}open(k);};
  if(mode==="after")a.parentNode.insertBefore(b,a.nextSibling);else a.parentNode.parentNode.insertBefore(b,a.parentNode);}
mount("flags","flags",".fg-modes","after");
mount("story","story","#storyStartBtn","beforeGrid");
mount("career","career","#careerStartBtn","beforeGrid");
mount("games","crime",".hm-sub","after");
mount("xo","xo","#xoSetup .xo-start","after");
mount("ludo","ludo","#luSetup .lu-start","after");
})();
