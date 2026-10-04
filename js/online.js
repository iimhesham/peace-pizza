/* أونلاين — غرف لحظية (Firebase Realtime Database). كل لعبة فيها زرار "العب أونلاين" خاص بيها.
   الـ Host بيحكم، وفريقين (حساب لكل فريق). أول واحد يدوس "جاوب" ليه حق الإجابة، والنقاط على الحساب. */
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
 flags:{n:"أعلام",c:15,steps:1,data:function(){return FLAGS_DATA;},ans:function(x){return x[1];},pts:function(){return 1;},
  view:function(x){return'<div class="ol-fcard"><i class="ol-cn a"></i><i class="ol-cn b"></i><i class="ol-cn c"></i><i class="ol-cn d"></i><div class="ol-fw"><img class="ol-f" src="'+e(flagImgUrl(x[0]))+'" alt=""></div></div>';}},
 story:{n:"أنا مين",c:8,steps:3,data:function(){return STORY_PLAYERS;},ans:function(x){return x.name;},pts:function(s){return P3[s];},
  view:function(x,s){return x.clues.slice(0,s+1).map(function(c,i){return'<div class="ol-k"><small>دليل '+(i+1)+'</small>'+e(c)+'</div>';}).join("");}},
 career:{n:"انتقالات",c:8,steps:3,data:function(){return CAREER_PLAYERS;},ans:function(x){return x.n;},pts:function(s){return P3[s];},
  view:function(x,s,o){var k=Math.ceil(x.c.length*[.35,.6,.85][s]),sh=(o||[]).slice(0,k);var yr=function(c){if(!c[1])return"";if(c[2]===null)return c[1]+" – Now";return c[1]===c[2]?String(c[1]):c[1]+" – "+c[2];};
   return'<div class="ol-tl">'+x.c.map(function(c,i){var op=sh.indexOf(i)>=0;
    return'<div class="ol-stop '+(op?'is-open':'is-hidden')+'"><div class="ol-nd"><span class="ol-dot">'+(i+1)+'</span><span class="ol-rail"></span></div><div class="ol-cc'+(op&&c[3]?' is-loan':'')+'">'+(op?'<b class="ol-club" dir="ltr">'+e(c[0])+'</b>'+(c[3]?'<span class="ol-loan">إعارة</span>':'')+'<span class="ol-yrs" dir="ltr">'+e(yr(c))+'</span>':'<span class="ol-q">؟</span>')+'</div></div>';}).join("")+'</div>';}}
};
var META={
 flags:{n:"أعلام",d:"أول واحد يدوس «جاوب!» ياخد حق الإجابة. 15 علم.",who:"فريقين، كل فريق بحسابه",
  ic:"<path d='M5 21V4M5 4h12l-2.5 4L17 12H5'/>"},
 story:{n:"أنا مين",d:"أدلة عن لاعب بتتكشف واحد واحد، والأسرع ياخد نقط أكتر.",who:"فريقين، كل فريق بحسابه",
  ic:"<circle cx='12' cy='8' r='3.5'/><path d='M5 20c0-4 3-6 7-6s7 2 7 6'/>"},
 career:{n:"انتقالات",d:"محطات ناقصة من مسيرة لاعب أو مدرب، خمّن مين هو.",who:"فريقين، كل فريق بحسابه",
  ic:"<path d='M3 17l18-6-8 9-2-5-8 2zM11 15l10-4'/>"},
 crime:{n:"قصص الجرايم",d:"أدوار سرية وأدلة خاصة وتصويت لحد ما القاتل يتكشف.",who:"3 لاعبين أو أكتر، وإنت اللي بتحكم",
  ic:"<path d='M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4zM20 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z'/>"}
};
var BADGES=[["First Win","1 win",function(t){return t.wins>=1;}],["Regular","5 sessions",function(t){return t.games>=5;}],["Point Collector","50 points",function(t){return t.pts>=50;}],
 ["Flag Expert","10 correct flags",function(t,s){return((s.flags||{}).right||0)>=10;}],["Detective","5 correct players",function(t,s){return((s.story||{}).right||0)>=5;}],["Transfer Guru","5 correct transfers",function(t,s){return((s.career||{}).right||0)>=5;}]];
var CSS=':root{--o-bell:'+SV("<path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'/><path d='M10.3 21a1.9 1.9 0 0 0 3.4 0'/>")+';--o-trophy:'+SV("<path d='M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z'/><path d='M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3'/>")+';--o-chart:'+SV("<path d='M4 20V10M10 20V4M16 20v-7M22 20H2'/>")+';--o-copy:'+SV("<rect x='9' y='9' width='11' height='11' rx='2'/><path d='M5 15V6a2 2 0 0 1 2-2h8'/>")+'}'+
/* الأساس */
'#olRoot{position:fixed;top:0;right:0;bottom:0;left:0;z-index:9990;height:100vh;height:100dvh;background:var(--wash),var(--bg);color:var(--ink);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;font-family:"IBM Plex Sans Arabic","Tajawal",sans-serif;line-height:1.6;direction:rtl;text-align:right}'+
'#olRoot *{box-sizing:border-box}body.ol-open>*:not(#olRoot):not(#toast){display:none!important}'+
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
'.ol-k{background:var(--card);border-right:3px solid var(--ac);border-radius:10px;padding:10px 12px;margin:8px 0;line-height:1.7}.ol-k small{display:block;color:var(--mu);font-size:12px}'+
'.ol-r{display:flex;gap:10px}.ol-r .ol-b{margin:9px 0}'+
'.ol-bd{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.ol-bd div{background:var(--card);border:1px solid var(--ln);border-radius:12px;padding:10px 4px;font-size:13px;color:var(--mu2);text-align:center}.ol-bd .on{color:var(--ac);border-color:var(--ac)}.ol-bd small{display:block;font-size:11px;opacity:.8}'+
'.ol-st{background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:12px;margin:8px 0}.ol-st b{color:var(--ac)}'+
'.ol-me{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:12px;margin:8px 0}.ol-me img{width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid #10b981;flex:none}.ol-me b{display:block;color:#fff}.ol-me small{display:block;color:var(--mu);direction:ltr;text-align:right;word-break:break-all}'+
'.ol-bdg{display:inline-flex;align-items:center;gap:4px;margin-inline-start:7px;padding:2px 9px 0;border-radius:999px;font:400 12px/1.5 Anton,Impact,sans-serif;letter-spacing:1.5px;color:#1c1604;white-space:nowrap;font-style:normal;vertical-align:middle}'+
'.ol-bdg.t-gold{background:linear-gradient(135deg,#f6e3a1,#c9992f)}.ol-bdg.t-silver{background:linear-gradient(135deg,#f1f4f7,#9aa7b3)}.ol-bdg.t-premium{background:linear-gradient(135deg,#e4c6ff,#9a6bd6);color:#240a3d}.ol-bdg.t-master{background:linear-gradient(135deg,#6fe6ee,#00bcc8);color:#032a2e}.ol-bdg.t-elite{background:linear-gradient(135deg,#e9ff6e,#d0ff00);color:#1e2800}.ol-bdg.t-king{background:linear-gradient(120deg,#047857,#10b981 42%,#f0bfae 72%,#b76e79);color:#04251b}.ol-bdg.t-legend{background:linear-gradient(135deg,#ff8a8a,#d4142a);color:#fff}.ol-bdg.t-phantom{background:linear-gradient(135deg,#9db8ff,#3a5bff);color:#fff}.ol-bdg.t-savage{background:linear-gradient(135deg,#ff9ee8,#e0199f);color:#fff}'+
'.ol-nm.t-gold,.ol-nm.t-silver,.ol-nm.t-premium,.ol-nm.t-master,.ol-nm.t-elite,.ol-nm.t-king,.ol-nm.t-legend,.ol-nm.t-phantom,.ol-nm.t-savage{-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;font-weight:800}'+
'.ol-nm.t-gold{background-image:linear-gradient(100deg,#fff1b8,#e0ac35 45%,#b9831f)}.ol-nm.t-silver{background-image:linear-gradient(100deg,#ffffff,#b9c4cf 50%,#8895a2)}.ol-nm.t-premium{background-image:linear-gradient(100deg,#f1dcff,#b98cf0 50%,#8a5bc9)}.ol-nm.t-master{background-image:linear-gradient(100deg,#b4f5fa,#00bcc8 50%,#00909a)}.ol-nm.t-elite{background-image:linear-gradient(100deg,#f6ffb4,#d0ff00 50%,#a3c900)}.ol-nm.t-king{background-image:linear-gradient(100deg,#34d399,#10b981 35%,#f0bfae 70%,#c27d8a)}.ol-nm.t-legend{background-image:linear-gradient(100deg,#ffb3b3,#ff3b3b 50%,#c4122a)}.ol-nm.t-phantom{background-image:linear-gradient(100deg,#c5d4ff,#5b84ff 50%,#3a4fe0)}.ol-nm.t-savage{background-image:linear-gradient(100deg,#ffc2f0,#ff4fd8 50%,#c2189b)}'+
'.ol-av.r-gold,.ol-me img.r-gold{border-color:#e6c25a;box-shadow:0 0 0 2px rgba(230,194,90,.35)}.ol-av.r-silver,.ol-me img.r-silver{border-color:#c3ccd5;box-shadow:0 0 0 2px rgba(195,204,213,.3)}.ol-av.r-premium,.ol-me img.r-premium{border-color:#b98cf0;box-shadow:0 0 0 2px rgba(185,140,240,.35)}.ol-av.r-master,.ol-me img.r-master{border-color:#00bcc8;box-shadow:0 0 0 2px rgba(0,188,200,.35)}.ol-av.r-elite,.ol-me img.r-elite{border-color:#d0ff00;box-shadow:0 0 0 2px rgba(208,255,0,.3)}.ol-av.r-king,.ol-me img.r-king{border-color:#10b981;box-shadow:0 0 0 2px rgba(183,110,121,.5)}.ol-av.r-legend,.ol-me img.r-legend{border-color:#ff3b3b;box-shadow:0 0 0 2px rgba(255,59,59,.35)}.ol-av.r-phantom,.ol-me img.r-phantom{border-color:#5b84ff;box-shadow:0 0 0 2px rgba(91,132,255,.35)}.ol-av.r-savage,.ol-me img.r-savage{border-color:#ff4fd8;box-shadow:0 0 0 2px rgba(255,79,216,.35)}'+
'.ol-mrow{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px;direction:ltr}.ol-mini{padding:7px 4px;border-radius:999px;border:1px solid var(--ln2);background:var(--card2);color:var(--mu);font:600 13px "IBM Plex Sans Arabic",sans-serif;cursor:pointer}.ol-mini.on{color:#241a04;background:var(--ac);border-color:var(--ac)}.ol-mini.on.t-silver{background:#c3ccd5;border-color:#c3ccd5}.ol-mini.on.t-premium{background:#b98cf0;border-color:#b98cf0}.ol-mini.on.t-master{background:#00bcc8;border-color:#00bcc8;color:#032a2e}.ol-mini.on.t-elite{background:#d0ff00;border-color:#d0ff00;color:#1e2800}.ol-mini.on.t-king{background:linear-gradient(120deg,#047857,#10b981 42%,#f0bfae 72%,#b76e79);border-color:#10b981;color:#04251b}.ol-mini.on.t-legend{background:#ff3b3b;border-color:#ff3b3b;color:#fff}.ol-mini.on.t-phantom{background:#5b84ff;border-color:#5b84ff;color:#fff}.ol-mini.on.t-savage{background:#ff4fd8;border-color:#ff4fd8;color:#fff}.ol-me .ol-ust{display:flex;flex-wrap:wrap;gap:2px 12px;direction:rtl}.ol-ust span{white-space:nowrap}'+
'.ol-c h2{color:var(--ac);margin:16px 0 8px;font-weight:700;font-size:20px}'+
/* قصص الجرايم */
'.ol-p{background:var(--card);border:1px solid var(--ln);border-radius:14px;padding:12px;margin:8px 0;line-height:1.7}.ol-p h3{margin:0 0 6px;color:var(--ac);font-size:16px}.ol-p small{color:var(--mu)}'+
'.ol-dead{opacity:.45;text-decoration:line-through}.ol-tag{display:inline-block;background:#a02b2b;color:#fff;border-radius:6px;padding:0 7px;font-size:12px;margin-right:6px;font-style:normal}.ol-v{display:flex;justify-content:space-between;align-items:center;gap:8px}.ol-v .ol-b{width:auto;min-height:40px;margin:4px 0;padding:6px 14px;font-size:14px}'+
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
.ol-stop.is-open .ol-cc{border-right:3px solid var(--ac);box-shadow:0 0 16px rgba(var(--acr),.14),inset 0 0 20px rgba(var(--acr),.05)}
.ol-stop.is-open .ol-cc.is-loan{border-right:3px dashed var(--ac)}
.ol-stop.is-hidden .ol-cc{justify-content:center;border-style:dashed;background:repeating-linear-gradient(135deg,rgba(var(--acr),.05) 0 6px,transparent 6px 12px),var(--bg0)}
.ol-club{flex:1;min-width:0;font-size:16px;font-weight:700;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:ltr;text-align:start}
.ol-yrs{flex:none;font:12.5px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.04em;color:var(--mu)}
.ol-loan{flex:none;padding:1px 9px;border-radius:2px;font-size:11.5px;font-weight:700;background:rgba(var(--acr),.14);color:var(--ac);border:1px solid var(--ac)}
.ol-q{font-size:20px;font-weight:700;color:rgba(var(--acr),.5)}
`;
var CHEV='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
function root(){if(!ov){ov=document.getElementById("olRoot")||document.createElement("div");ov.id="olRoot";document.body.appendChild(ov);}return ov;}
function shell(h,o){o=o||{};root();var top=ov.scrollTop;ov.setAttribute("data-g",o.g||(o.room&&S&&G[S.game||"flags"]?(S.game||"flags"):(vw==="menu"&&mk?mk:"base")));if(o.c)ov.setAttribute("data-c",o.c);else ov.removeAttribute("data-c");inRoom=!!o.room;playing=!!o.playing;var c=o.code||(o.room?code:"");
  ov.innerHTML='<div class="ol-c"><div class="ol-bar"><button type="button" class="ol-back" onclick="OL.up()" aria-label="رجوع">'+CHEV+'</button><div class="ol-ttl">'+e(o.t||"أونلاين")+'</div>'+(c?'<div class="ol-pill" dir="ltr">'+e(c)+'</div>':'')+'</div>'+h+'</div>';
  ov.scrollTop=(lastT===o.t)?top:0;lastT=o.t;}
function menu(k){if(k)mk=k;k=mk||"flags";vw="menu";var m=META[k],crime=k==="crime";
  shell('<div class="ol-pass"><div class="ol-pass-top"><span class="ol-glyph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+m.ic+'</svg></span><div><b>'+e(m.n)+'</b><small>'+e(m.d)+'</small></div></div><div class="ol-perf"></div><div class="ol-pass-bot"><button type="button" class="ol-b" onclick="'+(crime?'OLS.open()':'OL.create(\''+k+'\')')+'">'+(crime?'اختار القصة وافتح الغرفة':'افتح غرفة جديدة')+'</button><p class="ol-hint">'+e(m.who)+'. إنت اللي بتحكم في الغرفة.</p></div></div>'+
   '<div class="ol-join"><label for="olCode">عندك كود غرفة؟</label><div class="ol-join-row"><input id="olCode" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="0000" autocomplete="off" onkeydown="if(event.key===\'Enter\')OL.join()"><button type="button" class="ol-b g" onclick="OL.join()">ادخل</button></div></div>',{t:m.n+" أونلاين"});}
var BD={gold:"Golden",silver:"Silver",premium:"Premium",master:"Master",elite:"Elite",king:"King",legend:"Legend",phantom:"Phantom",savage:"Savage"},BK=["premium","silver","gold","master","elite","king","legend","phantom","savage"];
function bk(id){return BD[BDG[id]]?BDG[id]:"";}
function bdg(id){var k=bk(id);return k?'<i class="ol-bdg t-'+k+'">&#9733; '+BD[k]+'</i>':"";}
function nmu(id,name){var k=bk(id);return'<span class="ol-nm'+(k?' t-'+k:'')+'">'+e(name)+'</span>'+bdg(id);}
function nm(p){return nmu(p.uid,p.name);}
function loadB(){return db.ref("badges").once("value").then(function(s){BDG=s.val()||{};},function(){});}
function setBadge(id,k){var on=k&&BD[k];db.ref("badges/"+id).set(on?k:null).then(function(){if(on)BDG[id]=k;else delete BDG[id];T(on?"اتدّى "+BD[k]:"اتشال البادج");users();}).catch(function(){T("مقدرتش أغيّر البادج. اتأكد إن الـ Rules اتنشرت");});}
function pl(){var P=S.players||{};return Object.keys(P).map(function(k){return P[k];});}
function ids(){return pl().map(function(p){return p.uid;});}
function av(p){return p.photo?'<img class="ol-av'+(bk(p.uid)?' r-'+bk(p.uid):'')+'" referrerpolicy="no-referrer" alt="" src="'+e(p.photo)+'">':'<span class="ol-ph"></span>';}
function board(){var sc=S.scores||{};return pl().map(function(p){return'<div class="ol-t"><b>'+av(p)+nm(p)+'</b><span>'+((sc[p.uid]||{}).pts||0)+'</span></div>';}).join("")||'<div class="ol-w">لسه محدش دخل</div>';}
function g(){return G[S.game||"flags"];}
function cur(){return g().data()[S.deck[S.i]];}
function lastLine(){var l=S.last;if(!l)return"";return'<div class="ol-l">'+(l.w?IC('x')+' '+e(l.who)+' جاوب غلط':l.skip?'اتخطّت — '+e(l.name):IC('check')+' '+e(l.who)+' جاب '+l.p+' — '+e(l.name))+'</div>';}
function draw(){
  if(!ov)return;
  if(!S){if(code){T("الغرفة اتقفلت");OL.exit();}return;}
  var host=role==="host",me=U().uid,b=S.buzz,gm=g(),st=S.step||0,o={room:true,t:"غرفة "+gm.n};vw="room";
  if(S.status==="lobby"){
    var ps=pl(),rows=ps.map(function(p){return'<div class="ol-t"><b>'+av(p)+nm(p)+'</b></div>';}).join("")+(ps.length<2?'<div class="ol-t empty">مستني لاعب…</div>':"");
    shell('<div class="ol-ticket" onclick="OL.copy()"><small>كود الغرفة · دوس عشان تنسخه</small><div class="ol-code">'+e(code)+'</div><span>ابعت الكود للاعبين</span></div><div class="ol-sec">اللاعبين ('+ps.length+'/2)</div>'+rows+
      (host?'<button type="button" class="ol-b" onclick="OL.start()">ابدأ اللعب</button>':'<div class="ol-w">مستني صاحب الغرفة يبدأ…</div>'),o);
  }else if(S.status==="play"){
    o.playing=true;
    var it=cur(),head='<div class="ol-w">'+e(gm.n)+' · '+(S.i+1)+' / '+S.deck.length+(gm.steps>1?' · هتاخد '+gm.pts(st)+' نقط':'')+'</div>'+strip()+gm.view(it,st,S.ord);
    if(host)shell(head+'<div class="ol-a">الإجابة: <b>'+e(gm.ans(it))+'</b></div>'+lastLine()+(b?'<div class="ol-bz">'+IC('bell',1)+' '+e(b.name)+' سبق!</div><div class="ol-r"><button type="button" class="ol-b" onclick="OL.mark(1)">'+IC('check')+' صح</button><button type="button" class="ol-b r" onclick="OL.mark(0)">'+IC('x')+' غلط</button></div>':'<div class="ol-w">مستني حد يدوس…</div>')+(gm.steps>1&&st<gm.steps-1?'<button type="button" class="ol-b o" onclick="OL.hint()">الدليل التالي</button>':'')+'<button type="button" class="ol-s" onclick="OL.next()">تخطّي</button>',o);
    else{var lk=(S.locked||{})[me],msg=b?(b.uid===me?IC('bell',1)+' إنت سبقت! جاوب بصوتك':e(b.name)+' سبقك'):lk?'غلطت، استنى الدليل الجاي':'';
      shell(head+lastLine()+'<div class="ol-bz">'+msg+'</div><button type="button" class="ol-buzz" '+(b||lk?'disabled':'')+' onclick="OL.buzz()">جاوب!</button>',o);}
  }else{
    var sc=S.scores||{},best=pl().sort(function(a,c){return((sc[c.uid]||{}).pts||0)-((sc[a.uid]||{}).pts||0);});
    shell('<h2 style="text-align:center">'+IC('trophy',1)+' خلصنا</h2>'+board()+(best.length?'<div class="ol-bz">الفايز: '+e(best[0].name)+'</div>':'')+(host?'<button type="button" class="ol-b" onclick="OL.start()">العب تاني</button><button type="button" class="ol-b r" onclick="OL.close()">اقفل الغرفة</button>':'<div class="ol-w">النتيجة اتسجلت في حسابك</div><button type="button" class="ol-b o" onclick="OL.stats()">'+IC('chart',1)+' إحصائياتي</button>'),o);
    if(!host)saveStats();
  }
}
function strip(){var sc=S.scores||{},ps=pl();return'<div class="ol-score">'+ps.map(function(p){return'<div class="ol-t"><b>'+av(p)+nm(p)+'</b><span>'+((sc[p.uid]||{}).pts||0)+'</span></div>';}).join("")+'</div>';}
function saveStats(){var k="olst_"+code+"_"+S.created;try{if(localStorage.getItem(k))return;localStorage.setItem(k,"1");}catch(x){}
  var sc=S.scores||{},m=sc[U().uid]||{},top=Math.max.apply(null,ids().map(function(i){return(sc[i]||{}).pts||0;})),w=(m.pts||0)>0&&m.pts>=top?1:0;
  db.ref("users/"+U().uid+"/stats/"+(S.game||"flags")).transaction(function(c){c=c||{pts:0,right:0,wrong:0,games:0,wins:0};c.pts+=m.pts||0;c.right+=m.right||0;c.wrong+=m.wrong||0;c.games+=1;c.wins=(c.wins||0)+w;return c;});}
function mail(u){return(u&&(u.email||(u.providerData&&u.providerData[0]&&u.providerData[0].email)))||"";}
function isAdmin(){var u=U();return!!(u&&ADM&&ADM[u.uid]===true);}
function canClaim(){return ADM===false;}
function claim(){var u=U();if(!canClaim())return;
  db.ref("admins/"+u.uid).set(true).then(function(){T("اتسجّلت أدمن");stats();}).catch(function(){T("مقدرتش أسجّلك أدمن. اتأكد إن الـ Rules الجديدة اتنشرت");});}
function me(){var u=U();return'<div class="ol-me">'+(u.photoURL?'<img class="'+(bk(u.uid)?'r-'+bk(u.uid):'')+'" referrerpolicy="no-referrer" alt="" src="'+e(u.photoURL)+'">':'')+'<div><b>'+nmu(u.uid,u.displayName||"لاعب")+'</b><small>'+e(mail(u))+'</small></div></div>';}
function stats(){var u=U();vw="stats";
  db.ref("admins").once("value").then(function(a){ADM=a.exists()?a.val():false;},function(){ADM=null;}).then(function(){return db.ref("users/"+u.uid+"/stats").once("value");}).then(function(s){
  var v=s.val()||{},t={games:0,pts:0,wins:0},h="";
  Object.keys(G).forEach(function(k){var x=v[k];if(!x)return;t.games+=x.games||0;t.pts+=x.pts||0;t.wins+=x.wins||0;var tot=(x.right||0)+(x.wrong||0);
    h+='<div class="ol-st"><b>'+G[k].n+'</b><br>جلسات: '+x.games+' · فوز: '+(x.wins||0)+' · نقاط: '+x.pts+'<br>صح: '+(x.right||0)+' · غلط: '+(x.wrong||0)+(tot?' · دقة '+Math.round((x.right||0)/tot*100)+'%':'')+'</div>';});
  shell(me()+'<h2>'+IC('chart',1)+' إحصائياتي</h2>'+(h||'<div class="ol-w">لسه ملعبتش أونلاين</div>')+'<h2>'+IC('trophy',1)+' Achievements</h2><div class="ol-bd">'+BADGES.map(function(b){var on=b[2](t,v);return'<div class="'+(on?'on':'')+'">'+(on?IC('check'):IC('lock'))+' '+b[0]+'<small>'+b[1]+'</small></div>';}).join("")+'</div>'+
    (isAdmin()?'<button type="button" class="ol-b" onclick="OL.users()">كل المستخدمين (أدمن)</button><button type="button" class="ol-b o" onclick="OL.test()">فحص الأونلاين (أدمن)</button>':canClaim()?'<button type="button" class="ol-b o" onclick="OL.claim()">خليني أنا الأدمن (مرة واحدة بس)</button>':'')+(code?'':'<button type="button" class="ol-b r" onclick="OL.signOut()">تسجيل خروج</button>'),{t:"حسابي"});
 }).catch(function(){T("مقدرتش أجيب الإحصائيات");});}
function users(){if(!isAdmin())return;vw="users";
  loadB().then(function(){return db.ref("users").once("value");}).then(function(s){var v=s.val()||{};
    var L=Object.keys(v).map(function(id){var x=v[id]||{};return{id:id,p:x.profile||{},st:x.stats||{}};}).sort(function(a,b){return(b.p.updated||0)-(a.p.updated||0);});
    shell('<div class="ol-w">'+L.length+' مستخدم</div>'+L.map(function(u){var gg=0,pt=0;Object.keys(u.st).forEach(function(k){gg+=u.st[k].games||0;pt+=u.st[k].pts||0;});
      var d=u.p.updated?new Date(u.p.updated).toLocaleDateString("ar-EG"):"—";
      return'<div class="ol-me">'+(u.p.photo?'<img class="'+(bk(u.id)?'r-'+bk(u.id):'')+'" referrerpolicy="no-referrer" alt="" src="'+e(u.p.photo)+'">':'')+'<div><b>'+nmu(u.id,u.p.name||"بدون اسم")+'</b>'+(u.p.email?'<small>'+e(u.p.email)+'</small>':'')+'<small dir="ltr">ID: '+e(u.id.slice(0,10))+'…</small><small class="ol-ust"><span>آخر ظهور: '+d+'</span><span>جلسات أونلاين: '+gg+'</span><span>نقاط: '+pt+'</span></small><div class="ol-mrow">'+BK.map(function(k){return'<button type="button" class="ol-mini t-'+k+(bk(u.id)===k?' on':'')+'" onclick="OL.badge(\''+e(u.id)+'\',\''+(bk(u.id)===k?'':k)+'\')">'+BD[k]+'</button>';}).join("")+'</div></div></div>';}).join(""),{t:"المستخدمين"});
  }).catch(function(){T("مفيش صلاحية — اتأكد إن الـ Rules الجديدة اتنشرت");});}
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
  mkRoom({host:u.uid,hostName:u.displayName||"",game:k,status:"lobby",created:Date.now()},function(err,c){
    if(err){var pd=err.code==="PERMISSION_DENIED"||/permission/i.test(err.message||"");return bail(pd?"مش مسموح تفتح غرفة. اتأكد إن الـ Rules اتنشرت":"مفيش كود فاضي دلوقتي، جرّب تاني");}
    busy=false;code=c;listen();});}
function join(c0){if(busy)return;var u=U(),c=String(c0||(document.getElementById("olCode")||{}).value||"").replace(/\D/g,"");
  if(c.length!==4){T("اكتب كود الغرفة (4 أرقام)");return;}busy=true;
  db.ref("rooms/"+c).once("value").then(function(s){var r=s.val();
    if(!r){try{localStorage.removeItem("pp_room");}catch(x){}return bail("الغرفة مش موجودة");}
    code=c;role=r.host===u.uid?"host":"player";
    if(role==="host"){busy=false;return listen();}
    var v=r.players||{},mine=["a","b"].filter(function(x){return v[x]&&v[x].uid===u.uid;})[0];
    if(mine){busy=false;return listen();}
    if(r.status&&r.status!=="lobby")return bail("اللعبة بدأت، مينفعش تدخل دلوقتي");
    var me={uid:u.uid,name:u.displayName||"لاعب",photo:u.photoURL||""};
    (function claim(i){var k=["a","b"][i];if(!k)return bail("الغرفة ممتلئة");
      db.ref("rooms/"+c+"/players/"+k).transaction(function(x){return x&&x.uid!==u.uid?undefined:me;},function(err,ok){
        if(err)return bail("مقدرتش أدخل");
        if(ok){busy=false;listen();}else claim(i+1);});})(0);
  }).catch(function(){bail("مقدرتش أدخل");});}
function shuf(n){var a=[],i;for(i=0;i<n;i++)a.push(i);return a.sort(function(){return Math.random()-.5;});}
function ordFor(i){var x=g().data()[i];return x&&x.c?shuf(x.c.length):null;}
function start(){var gm=g(),a=shuf(gm.data().length).slice(0,gm.c),sc={};
  if(ids().length<1){T("لسه محدش دخل الغرفة");return;}
  ids().forEach(function(id){sc[id]={pts:0,right:0,wrong:0};});
  push({status:"play",deck:a,i:0,step:0,ord:ordFor(a[0]),buzz:null,locked:null,last:null,scores:sc,created:Date.now()});}
function advance(u,last){var n=S.i+1;u.buzz=null;u.locked=null;u.step=0;u.last=last;
  if(n>=S.deck.length)u.status="end";else{u.i=n;u.ord=ordFor(S.deck[n]);}push(u);}
function mark(ok){var b=S.buzz;if(!b)return;var s=(S.scores||{})[b.uid]||{pts:0,right:0,wrong:0},u={},p=g().pts(S.step||0);
  if(ok){u["scores/"+b.uid]={pts:s.pts+p,right:s.right+1,wrong:s.wrong};advance(u,{name:g().ans(cur()),who:b.name,p:p});}
  else{u["scores/"+b.uid]={pts:s.pts,right:s.right,wrong:s.wrong+1};u["locked/"+b.uid]=true;u.buzz=null;u.last={w:1,who:b.name};push(u);}}
function hint(){push({step:(S.step||0)+1,buzz:null,locked:null});}
function next(){advance({},{skip:1,name:g().ans(cur())});}
function buzz(){var u=U();db.ref("rooms/"+code+"/buzz").transaction(function(c){return c?undefined:{uid:u.uid,name:u.displayName||"لاعب",t:Date.now()};});}
function copy(){var u=location.origin+location.pathname+"?room="+code;try{if(navigator.share){navigator.share({title:"GAME",text:"ادخل غرفة "+code,url:u}).catch(function(){});return;}navigator.clipboard.writeText(u).then(function(){T("اتنسخ لينك الغرفة");});}catch(x){}}
function exit(){try{localStorage.removeItem("pp_room");}catch(x){}if(off)off();off=null;code=role=S=null;vw=null;inRoom=playing=busy=false;if(ov){ov.remove();ov=null;}
  if(document.body.classList.contains("ol-open")){document.body.classList.remove("ol-open");try{window.scrollTo(0,sy);}catch(x){}}
  if(hist){hist=false;try{history.back();}catch(x){}}}
/* رجوع من جوا الشاشة: مستوى واحد لفوق */
function up(){
  if(inRoom){if(playing&&!confirm("تخرج من اللعبة؟"))return;OL.exit();return;}
  if(vw==="users")return stats();
  if(vw==="stats"){if(code)return draw();if(mk)return menu();}
  OL.exit();}
/* زرار الرجوع بتاع الموبايل: يقفل الأونلاين بدل ما يسيبه فوق الصفحة */
function pushH(){if(hist)return;var s=document.querySelector("section:not(.hidden)"),id=s?s.id:"hub";try{history.pushState({s:id,ol:1},"");hist=true;}catch(x){}}
window.addEventListener("popstate",function(){if(!ov)return;hist=false;
  if(inRoom&&playing){pushH();T("إنت في لعبة شغالة. اخرج من زرار الرجوع فوق");return;}
  OL.exit();});
document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&ov)OL.up();});
function ensure(go){
  if(!U()){T("سجّل دخول بجوجل الأول");return;}
  var run=function(){var fresh=!ov;if(fresh){sy=window.pageYOffset||0;document.body.classList.add("ol-open");}root();if(fresh)pushH();loadB().then(go);};
  if(db)return run();
  if(window.firebase&&firebase.database){db=firebase.database();return run();}
  var s=document.createElement("script");s.src=SDK+"firebase-database-compat.js";
  s.onload=function(){db=firebase.database();run();};s.onerror=function(){T("مقدرتش أحمّل الأونلاين، اتأكد من النت");};document.head.appendChild(s);
}
function open(k){mk=k||"flags";ensure(function(){menu(mk);});}
function account(){mk=null;ensure(stats);}
window.OL={test:function(){if(window.OLT)return OLT.run();var s=document.createElement("script");s.src="js/online-test.js?v=1";s.onload=function(){OLT.run();};s.onerror=function(){T("مقدرتش أحمّل الفحص");};document.head.appendChild(s);},mk:mkRoom,nmu:nmu,bdg:bdg,badge:setBadge,shell:shell,users:users,claim:claim,open:open,account:account,create:create,join:join,start:start,mark:mark,hint:hint,next:next,buzz:buzz,copy:copy,exit:exit,up:up,back:up,stats:stats,
  rejoin:function(c){ensure(function(){OL.join(c);});},
  signOut:function(){OL.exit();if(window.ppSignOut)window.ppSignOut();},close:function(){if(confirm("تقفل الغرفة للكل؟"))db.ref("rooms/"+code).remove();}};
var ls=document.createElement("script");ls.src="js/online-story.js?v=7";document.head.appendChild(ls);var lp=document.createElement("script");lp.src="js/online-plus.js?v=7";document.head.appendChild(lp);
var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
/* زرار "أونلاين" جوا كل لعبة كخيار منفصل — مفيش زرار خارجي في الرئيسية */
function mount(id,k,anchor,mode){var sec=document.getElementById(id);if(!sec||sec.querySelector(".ol-go"))return;
  var a=sec.querySelector(anchor);if(!a)return;
  var b=document.createElement("button");b.type="button";b.className="ol-go";
  b.innerHTML=IC("globe")+' العب أونلاين <small dir="ltr">ONLINE</small>';
  b.onclick=function(){try{playClickSound();}catch(x){}open(k);};
  if(mode==="after")a.parentNode.insertBefore(b,a.nextSibling);else a.parentNode.parentNode.insertBefore(b,a.parentNode);}
mount("flags","flags",".fg-modes","after");
mount("story","story","#storyStartBtn","beforeGrid");
mount("career","career","#careerStartBtn","beforeGrid");
mount("games","crime",".hm-sub","after");
})();
