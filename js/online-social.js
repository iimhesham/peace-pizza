/* =========================================================
   Online: social side
   Account · Ranking · Awards & Titles · Profile · Friends · Question suggestions
   Runs on top of online.js (uses OL.i)
========================================================= */
(function(){
if(!window.OL||!OL.i)return;
var I=OL.i,e=I.e,U=I.U,T=I.T,IC=I.IC,IX=I.IX;
var D=function(){return I.db();};
var GK=["flags","story","career","xo","ludo"];
var GN={flags:"Flags",story:"Who Am I",career:"Transfers",xo:"XO",ludo:"Ludo",crime:"Crime Story"};
var GS={flags:"Flags",story:"Who",career:"Transfers",xo:"XO",ludo:"Ludo"};
var GI={flags:"flag",story:"who",career:"move",xo:"grid",ludo:"dice"};
var GC={flags:"#7ccb9b",story:"#74a5be",career:"#d4b675",xo:"#FF4777",ludo:"#F2B632"};
var LB=null,NREQ=0,preAt=0,ret=null,curTab="me",rf="all",F={g:"career"},QL=[],profId=null,fq="",FB={},FLC={};

/* ---------- helpers ---------- */
function mlabel(k){var p=k.split("-");return I.MO[+p[1]-1]+" "+p[0];}
function agg(x){var s=(x&&x.s)||{},r={games:0,wins:0,right:0,wrong:0,pts:0};GK.forEach(function(k){var y=s[k]||{};r.games+=y.games||0;r.wins+=y.wins||0;r.right+=y.right||0;r.wrong+=y.wrong||0;r.pts+=y.pts||0;});return r;}
function gp(x,k){return((((x||{}).s||{})[k]||{}).pts)||0;}
function av(p,id,cls,nm){cls=cls||"";var b=I.bk(id)?" r-"+I.bk(id):"";
  return p?'<img class="ol-av '+cls+b+'" referrerpolicy="no-referrer" alt="" src="'+e(p)+'">':'<span class="ol-ph ox-ini '+cls+b+'">'+e(String(nm||"?").trim().charAt(0).toUpperCase())+'</span>';}
function val(id){var el=document.getElementById(id);return el?String(el.value||"").trim():"";}
function alive(){return!!document.getElementById("olRoot");}
function ico(s){return s.indexOf("o:")===0?IC(s.slice(2),1):IX(s.slice(2));}
function dstr(t){try{return new Date(t).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});}catch(x){return"";}}
function load(cb){I.loadB().then(function(){return D().ref("lb").once("value");}).then(function(s){LB=s.val()||{};cb(LB);},function(){LB=LB||{};T("Couldn't load the ranking. Make sure the Rules are published");cb(LB);});}
function list(f){return Object.keys(LB||{}).map(function(id){var x=LB[id]||{},a=agg(x);return{id:id,x:x,n:x.n||"Player",p:x.p||"",a:a,v:f==="all"?a.pts:gp(x,f)};}).filter(function(r){return r.a.games>0||r.v!==0;}).sort(function(a,b){return b.v-a.v||b.a.wins-a.a.wins||(a.n<b.n?-1:1);});}
function accOf(a){var t=a.right+a.wrong;return t?Math.round(a.right/t*100):null;}

/* ---------- Player of the Month + podiums ---------- */
function monthsMap(){var M={};Object.keys(LB||{}).forEach(function(id){var m=(LB[id]||{}).m||{};Object.keys(m).forEach(function(k){(M[k]=M[k]||[]).push({id:id,v:m[k]});});});
  Object.keys(M).forEach(function(k){M[k]=M[k].filter(function(r){return r.v>0;}).sort(function(a,b){return b.v-a.v||(a.id<b.id?-1:1);});});return M;}
function winners(){var M=monthsMap(),cur=I.mkey();
  var past=Object.keys(M).filter(function(k){return k<cur&&M[k].length;}).sort().reverse().map(function(k){return{k:k,w:M[k][0],top:M[k].slice(0,3)};});
  return{cur:cur,now:M[cur]||[],past:past};}

/* ---------- Titles: held live by whoever leads each category ---------- */
var TT=[
 {k:"scorer",n:"Top Scorer",d:"Most points overall",ic:"o:trophy",u:"pts",f:function(r){return r.a.pts;}},
 {k:"champ",n:"Champion",d:"Most session wins",ic:"x:crown",u:"wins",f:function(r){return r.a.wins;}},
 {k:"sharp",n:"Sharpshooter",d:"Best accuracy (20+ answers)",ic:"x:target",u:"%",f:function(r){var t=r.a.right+r.a.wrong;return t>=20?Math.round(r.a.right/t*100):0;}},
 {k:"flags",n:"Flag Master",d:"Most points in Flags",ic:"x:flag",u:"pts",f:function(r){return gp(r.x,"flags");}},
 {k:"story",n:"Top Detective",d:"Most points in Who Am I",ic:"x:who",u:"pts",f:function(r){return gp(r.x,"story");}},
 {k:"career",n:"Transfer King",d:"Most points in Transfers",ic:"x:move",u:"pts",f:function(r){return gp(r.x,"career");}},
 {k:"xo",n:"XO Champion",d:"Most points in XO",ic:"x:grid",u:"pts",f:function(r){return gp(r.x,"xo");}},
 {k:"ludo",n:"Ludo Champion",d:"Most points in Ludo",ic:"x:dice",u:"pts",f:function(r){return gp(r.x,"ludo");}},
 {k:"active",n:"Marathoner",d:"Most sessions played",ic:"x:bolt",u:"sessions",f:function(r){return r.a.games;}}
];
function holders(){var R=list("all");return TT.map(function(t){var best=null;R.forEach(function(r){var v=t.f(r);if(v>0&&(!best||v>best.v))best={id:r.id,v:v,n:r.n,p:r.p};});return{t:t,h:best};});}
function awardsOf(id){var W=winners(),md={g:0,s:0,b:0};
  W.past.forEach(function(p){p.top.forEach(function(r,i){if(r.id===id)md[["g","s","b"][i]]++;});});
  return{won:W.past.filter(function(p){return p.w.id===id;}),lead:!!(W.now[0]&&W.now[0].id===id),W:W,medals:md,
    titles:holders().filter(function(x){return x.h&&x.h.id===id;}).map(function(x){return x.t;})};}
var TROPHY='<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="oxTg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".5" stop-color="#e6b53c"/><stop offset="1" stop-color="#9b6d10"/></linearGradient></defs><path d="M30 14h60v30c0 20-13 34-30 34S30 64 30 44z" fill="url(#oxTg)"/><path d="M30 22H12v10c0 14 9 24 22 26M90 22h18v10c0 14-9 24-22 26" fill="none" stroke="url(#oxTg)" stroke-width="7" stroke-linecap="round"/><rect x="54" y="76" width="12" height="18" fill="url(#oxTg)"/><path d="M38 94h44l6 14H32z" fill="url(#oxTg)"/><rect x="28" y="108" width="64" height="12" rx="3" fill="#7b5410"/><path d="M60 26l5 10 11 1.6-8 7.8 1.9 11L60 51l-9.9 5.4 1.9-11-8-7.8 11-1.6z" fill="#fff6d0" opacity=".85"/></svg>';

/* ---------- tab bar ---------- */
function tabs(a){if(a)curTab=a;
  var L=[["me","Account","u"],["rank","Ranking","o:chart"],["awards","Awards","o:trophy"],["friends","Friends","x:users"]];
  return'<nav class="ox-tabs" id="olTabs">'+L.map(function(t){var ic=t[2]==="u"?IX("user"):ico(t[2]);
    return'<button type="button" class="ox-tab'+(curTab===t[0]?' on':'')+'" onclick="OLX.go(\''+t[0]+'\')">'+ic+'<span>'+t[1]+'</span>'+(t[0]==="friends"&&NREQ?'<i class="ox-dot">'+NREQ+'</i>':'')+'</button>';}).join("")+'</nav>';}
function pre(){var u=U();if(!u||Date.now()-preAt<15000)return;preAt=Date.now();
  D().ref("fr/"+u.uid).once("value").then(function(s){var n=s.numChildren();if(n!==NREQ){NREQ=n;var el=document.getElementById("olTabs");if(el)el.outerHTML=tabs();}},function(){});}
function go(t){curTab=t;if(t==="me")OL.stats();else if(t==="rank")rank();else if(t==="awards")awards();else if(t==="friends")friends();}
function shell(h,t){I.shell(h,{t:t,g:"base"});pre();}
function sec(t,sub,extra){return'<div class="ac-h"><b>'+t+'</b>'+(sub?'<em>'+sub+'</em>':'')+(extra||"")+'</div>';}

/* ---------- Account ---------- */
function me(o){o=o||{};I.sv("stats");curTab="me";
  load(function(){if(!alive())return;
    var u=U(),v=o.v||{},t={games:0,wins:0,right:0,wrong:0,pts:0,s:v};
    GK.forEach(function(k){var y=v[k]||{};t.games+=y.games||0;t.wins+=y.wins||0;t.right+=y.right||0;t.wrong+=y.wrong||0;t.pts+=y.pts||0;});
    var R=list("all"),ix=R.map(function(r){return r.id;}).indexOf(u.uid),acc=accOf(t),name=u.displayName||"Player",
        mine=holders().filter(function(x){return x.h&&x.h.id===u.uid;}).map(function(x){return x.t;});
    var h=tabs("me");
    h+='<section class="ac-hero"><div class="ac-id">'+av(u.photoURL,u.uid,"ac-av",name)+'<div class="ac-who"><b class="ac-name">'+I.nmu(u.uid,name)+'</b><small class="ac-mail" dir="ltr">'+e(I.mail(u))+'</small>'+
      '<div class="ac-pills">'+(ix>=0?'<span class="ac-pill gold">'+IC("chart",1)+' Rank #'+(ix+1)+'<em>of '+R.length+'</em></span>':'<span class="ac-pill">Unranked</span>')+
      mine.slice(0,2).map(function(x){return'<span class="ac-pill">'+ico(x.ic)+' '+x.n+'</span>';}).join("")+'</div></div></div>'+
      '<div class="ac-stats">'+[[t.pts,"Points"],[t.wins,"Wins"],[t.games,"Sessions"],[acc===null?"-":acc+"%","Accuracy"]].map(function(c){return'<div><b>'+c[0]+'</b><small>'+c[1]+'</small></div>';}).join("")+'</div></section>';
    h+=sec("Games")+'<div class="ac-games">'+GK.map(function(k){var x=v[k],xoG=k==="xo"||k==="ludo",tot=x?(xoG?(x.games||0):(x.right||0)+(x.wrong||0)):0,pc=tot?Math.round((xoG?(x.wins||0):(x.right||0))/tot*100):0;
      return'<div class="ac-g'+(x?'':' off')+'" style="--gc:'+GC[k]+'"><span class="ac-gi">'+IX(GI[k])+'</span><small>'+GN[k]+'</small><b>'+(x?x.pts:"-")+'</b>'+
        (x?'<div class="ac-gr">'+(xoG?'<span>'+IC("check")+(x.wins||0)+' wins</span><span>'+(x.games||0)+' games</span>':'<span>'+IC("check")+(x.right||0)+'</span><span>'+IC("x")+(x.wrong||0)+'</span>')+'</div><i class="ol-acc"><i style="width:'+pc+'%"></i></i>':'<em>Not played yet</em>')+'</div>';}).join("")+'</div>';
    var B=I.BADGES,done=B.filter(function(b){return b[2](t,v);}),next=B.filter(function(b){return!b[2](t,v);}).map(function(b){return{b:b,c:Math.min(b[3](t,v),b[4])};}).sort(function(a,c){return c.c/c.b[4]-a.c/a.b[4];})[0];
    h+=sec("Achievements",done.length+" of "+B.length,'<button type="button" class="ac-more" onclick="OLX.go(\'awards\')">View all</button>')+
      '<div class="ac-chips">'+(done.length?done.slice(0,8).map(function(b){return'<span class="ac-chip">'+IC("check")+' '+b[0]+'</span>';}).join(""):'<span class="ac-none">Play online games to unlock achievements</span>')+'</div>'+
      (next?'<div class="ac-next"><b>Next up: '+next.b[0]+'</b><small>'+next.b[1]+'</small><i class="ol-pb"><i style="width:'+Math.round(next.c/next.b[4]*100)+'%"></i></i><em class="ol-of">'+next.c+' / '+next.b[4]+'</em></div>':'');
    h+=sec("Community")+'<button type="button" class="ac-tile" onclick="OL.sug()">'+IX("pencil")+'<span><b>Suggest a Question</b><small>Send your own questions to the admin</small></span></button>';
    if(o.adm){h+=sec("Admin Tools","",'<span class="ac-tag">Admin</span>')+'<div class="ac-grid">'+
      '<button type="button" class="ac-sq" id="acQreq" onclick="OL.queue()">'+IX("send")+'Question Requests</button>'+
      '<button type="button" class="ac-sq" onclick="OL.users()">'+IX("users")+'Users and Badges</button>'+
      '<button type="button" class="ac-sq" id="olSyncB" onclick="OL.syncAll()">'+IX("sync")+'Sync Ranking</button>'+
      '<button type="button" class="ac-sq" onclick="OL.test()">'+IX("shield")+'System Check</button></div>';}
    else if(o.claim)h+='<button type="button" class="ol-b o" onclick="OL.claim()">Make me the admin (one time only)</button>';
    if(!o.inRoom)h+='<button type="button" class="ac-out" onclick="OL.signOut()">'+IX("logout")+' Sign out</button>';
    shell(h,"Account");
    if(o.adm)D().ref("qreq").once("value").then(function(s){var v2=s.val()||{},n=Object.keys(v2).filter(function(k){return!v2[k].s||v2[k].s==="p";}).length,el=document.getElementById("acQreq");if(el&&n)el.insertAdjacentHTML("beforeend",'<i class="ox-dot">'+n+'</i>');},function(){});
  });}

/* ---------- Ranking ---------- */
function row(r,rk,mid){var s=r.x.s||{},z=s[rf]||{},sub=rf==="all"?GK.map(function(k){return GS[k]+" "+gp(r.x,k);}).join(" · "):((rf==="xo"||rf==="ludo")?"Wins "+(z.wins||0)+" · Games "+(z.games||0):"Right "+(z.right||0)+" · Wrong "+(z.wrong||0)+" · Sessions "+(z.games||0));
  return'<div class="ox-row'+(r.id===mid?' me':'')+'" onclick="OLX.prof(\''+e(r.id)+'\')"><span class="ox-rk">'+rk+'</span>'+av(r.p,r.id,"",r.n)+'<div class="ox-rw"><b>'+I.nmu(r.id,r.n)+'</b><small>'+e(sub)+'</small></div><span class="ox-pts">'+r.v+'</span></div>';}
function pod(r,rk){var c=["","g","s","b"][rk];return'<div class="ox-pc '+c+'" onclick="OLX.prof(\''+e(r.id)+'\')">'+(rk===1?'<i class="ox-cr">'+IX("crown")+'</i>':'')+av(r.p,r.id,"",r.n)+'<span class="ox-pn">'+I.nmu(r.id,r.n)+'</span><b class="ox-pv">'+r.v+'</b><div class="ox-pl"><span>'+rk+'</span></div></div>';}
function rank(f){if(f)rf=f;I.sv("stats");curTab="rank";
  load(function(){if(!alive())return;var R=list(rf),mid=U().uid,h=tabs("rank");
    h+='<div class="ox-chips">'+[["all","All"],["flags","Flags"],["story","Who"],["career","Moves"],["xo","XO"],["ludo","Ludo"]].map(function(c){return'<button type="button" class="ox-chip'+(rf===c[0]?' on':'')+'" onclick="OLX.rf(\''+c[0]+'\')">'+c[1]+'</button>';}).join("")+'</div>';
    if(!R.length)h+='<div class="ox-none">Nobody has played online yet. The first player to finish a game shows up here.</div>';
    else{var top3=R.length>=3;if(top3)h+='<div class="ox-pod">'+pod(R[1],2)+pod(R[0],1)+pod(R[2],3)+'</div>';
      h+='<div class="ox-list">'+R.slice(top3?3:0).map(function(r,i){return row(r,i+(top3?4:1),mid);}).join("")+'</div>';
      if(R.map(function(r){return r.id;}).indexOf(mid)<0)h+='<div class="ol-hint2">You have not played online yet. Finish a game and you will appear here.</div>';}
    shell(h,"Ranking");});}

/* ---------- Awards ---------- */
function awards(){I.sv("stats");curTab="awards";
  load(function(){if(!alive())return;var W=winners(),top=W.now[0],h=tabs("awards"),mid=U().uid;
    var nm=function(r){var x=LB[r.id]||{};return{n:x.n||"Player",p:x.p||""};};
    if(top){var w=nm(top);h+='<div class="ox-hero"><span class="ox-rib">PLAYER OF THE MONTH</span><div class="ox-tr">'+TROPHY+'</div><div class="ox-mo">'+mlabel(W.cur)+'</div>'+av(w.p,top.id,"ox-big",w.n)+'<div class="ox-wn">'+I.nmu(top.id,w.n)+'</div><div class="ox-wp">'+top.v+' <small>pts this month</small></div></div>';}
    else h+='<div class="ox-hero off"><span class="ox-rib">PLAYER OF THE MONTH</span><div class="ox-tr">'+TROPHY+'</div><div class="ox-mo">'+mlabel(W.cur)+'</div><div class="ox-wn">Nobody has scored this month yet</div></div>';
    h+='<div class="ol-hint2">Whoever scores the most points in a month wins the award. Standings update after every finished game.</div>';
    if(W.now.length>1)h+=sec("This Month's Race")+'<div class="ox-list">'+W.now.slice(0,5).map(function(r,i){var x=nm(r);return'<div class="ox-row'+(r.id===mid?' me':'')+'" onclick="OLX.prof(\''+e(r.id)+'\')"><span class="ox-rk">'+(i+1)+'</span>'+av(x.p,r.id,"",x.n)+'<div class="ox-rw"><b>'+I.nmu(r.id,x.n)+'</b></div><span class="ox-pts">'+r.v+'</span></div>';}).join("")+'</div>';
    h+=sec("Titles","Held by the current leader")+'<div class="ti-grid">'+holders().map(function(x){var t=x.t,hd=x.h;
      return'<div class="ti'+(hd?'':' vac')+'"'+(hd?' onclick="OLX.prof(\''+e(hd.id)+'\')"':'')+'><span class="ti-ic">'+ico(t.ic)+'</span><b>'+t.n+'</b><small>'+t.d+'</small>'+
        (hd?'<div class="ti-h">'+av(hd.p,hd.id,"",hd.n)+'<span class="ti-n" dir="auto">'+e(hd.n)+'</span><span class="ti-v">'+hd.v+(t.u==="%"?"%":"")+'</span></div>':'<div class="ti-h vacant">Vacant</div>')+'</div>';}).join("")+'</div>';
    h+=sec("Hall of Fame","Past months");
    h+=W.past.length?W.past.map(function(p){var x=nm(p.w);return'<div class="hf"><div class="hf-h">'+IC("trophy",1)+' '+mlabel(p.k)+'</div><div class="hf-w" onclick="OLX.prof(\''+e(p.w.id)+'\')">'+av(x.p,p.w.id,"",x.n)+'<div class="ox-rw"><b>'+I.nmu(p.w.id,x.n)+'</b><small>Player of the Month</small></div><span class="ox-pts">'+p.w.v+'</span></div>'+
      (p.top.length>1?'<div class="hf-pod">'+p.top.slice(1).map(function(r,i){var y=nm(r);return'<span class="'+(i?'b':'s')+'" onclick="OLX.prof(\''+e(r.id)+'\')"><i></i>'+(i?'3rd':'2nd')+' <b dir="auto">'+e(y.n)+'</b> '+r.v+'</span>';}).join("")+'</div>':'')+'</div>';}).join(""):'<div class="ox-none">No month has finished yet. The first champion is crowned at the start of next month.</div>';
    var a=agg(LB[mid]),s=(LB[mid]||{}).s||{},B=I.BADGES;
    h+=sec("My Achievements",B.filter(function(b){return b[2](a,s);}).length+" of "+B.length)+'<div class="bd2-grid">'+B.map(function(b){var on=b[2](a,s),c=Math.min(b[3](a,s),b[4]);
      return'<div class="bd2'+(on?' on':'')+'"><b><span class="bd2-i">'+(on?IC("check"):IC("lock"))+'</span>'+b[0]+'</b><small>'+b[1]+'</small>'+(on?'':'<i class="ol-pb"><i style="width:'+Math.round(c/b[4]*100)+'%"></i></i><em class="ol-of">'+c+' / '+b[4]+'</em>')+'</div>';}).join("")+'</div>';
    shell(h,"Awards");});}

/* ---------- Profile (sheet over any screen) ---------- */
function sheet(h){var s=document.getElementById("olSheet");if(!s){s=document.createElement("div");s.id="olSheet";s.onclick=function(ev){if(ev.target===s)close();};document.body.appendChild(s);}s.innerHTML=h;}
function close(){var s=document.getElementById("olSheet");if(s)s.remove();profId=null;}
function prof(id,fb){var u=U();if(!u){T("Sign in with Google first");return;}fb=fb||FB[id];profId=id;
  sheet('<div class="ox-sh"><div class="ox-ld">Loading...</div></div>');
  load(function(){if(profId!==id)return;
    if(id===u.uid)return pview(id,fb,{});
    Promise.all([D().ref("fl/"+u.uid+"/"+id).once("value"),D().ref("fr/"+id+"/"+u.uid).once("value"),D().ref("fr/"+u.uid+"/"+id).once("value")])
      .then(function(r){if(profId===id)pview(id,fb,{fr:r[0].exists(),sent:r[1].exists(),inc:r[2].exists()});},function(){if(profId===id)pview(id,fb,{err:1});});});}
function pview(id,fb,st){var x=LB[id]||null,u=U(),mine=id===u.uid,n=(x&&x.n)||(fb&&fb.name)||(mine&&u.displayName)||"Player",p=(x&&x.p)||(fb&&fb.photo)||(mine&&u.photoURL)||"",a=agg(x),A=awardsOf(id),s=(x&&x.s)||{};
  var R=list("all"),ri=R.map(function(r){return r.id;}).indexOf(id),ac=accOf(a);
  var mx=Math.max(1,Math.max.apply(null,GK.map(function(k){return gp(x,k);})));
  var gr=GK.map(function(k){var v=gp(x,k);return'<div class="ox-gr"><span>'+GN[k]+'</span><i class="ox-bar"><i style="width:'+Math.max(0,v)/mx*100+'%;background:'+GC[k]+'"></i></i><b>'+v+'</b></div>';}).join("");
  var aw="";
  if(A.lead)aw+='<div class="ox-aw lead">'+IX("crown")+'<div><b>Leading '+mlabel(A.W.cur)+'</b><small>Wins Player of the Month if they stay on top</small></div></div>';
  aw+=A.won.map(function(w){return'<div class="ox-aw">'+IC("trophy",1)+'<div><b>Player of the Month: '+mlabel(w.k)+'</b><small>'+w.w.v+' pts that month</small></div></div>';}).join("");
  if(A.titles.length)aw+='<div class="ox-achs">'+A.titles.map(function(t){return'<span class="ox-ttl">'+ico(t.ic)+' '+t.n+'</span>';}).join("")+'</div>';
  var md=A.medals;if(md.g+md.s+md.b)aw+='<div class="pv-medals">'+[["g","Gold"],["s","Silver"],["b","Bronze"]].map(function(m){return'<div class="pv-m '+m[0]+'">'+IX("medal")+'<b>'+md[m[0]]+'</b><small>'+m[1]+'</small></div>';}).join("")+'</div>';
  if(!aw)aw='<div class="ox-none sm">'+(mine?"You have no awards yet":"No awards yet")+'</div>';
  var ach=I.BADGES.filter(function(b){return b[2](a,s);}).map(function(b){return'<span class="ox-ach">'+IC("check")+' '+b[0]+'</span>';}).join("");
  var act="";
  if(!mine){if(st.err)act='<div class="ox-none sm">Could not load friend status. Make sure the Rules are published</div>';
    else if(st.fr)act='<div class="ox-fr ok">'+IX("users")+' Friends</div><button type="button" class="ol-s" onclick="OLX.funf(\''+e(id)+'\')">Remove Friend</button>';
    else if(st.inc)act='<div class="ox-fr">Sent you a friend request</div><div class="ol-r"><button type="button" class="ol-b g" onclick="OLX.facc(\''+e(id)+'\')">Accept</button><button type="button" class="ol-b o" onclick="OLX.fdec(\''+e(id)+'\')">Decline</button></div>';
    else if(st.sent)act='<button type="button" class="ol-b o" disabled>Request Sent</button><button type="button" class="ol-s" onclick="OLX.fcan(\''+e(id)+'\')">Cancel Request</button>';
    else act='<button type="button" class="ol-b" onclick="OLX.fadd(\''+e(id)+'\')">'+IX("plus")+' Add Friend</button>';}
  sheet('<div class="ox-sh"><i class="ox-grab"></i><button type="button" class="ox-x" onclick="OLX.close()" aria-label="Close">'+IX("close")+'</button>'+
    '<div class="ox-ph">'+av(p,id,"ox-big",n)+'<b class="ox-nn">'+I.nmu(id,n)+'</b><div class="ac-pills">'+(ri>=0?'<span class="ac-pill gold">'+IC("chart",1)+' Rank #'+(ri+1)+'<em>of '+R.length+'</em></span>':'<span class="ac-pill">Unranked</span>')+(mine?'<span class="ac-pill">This is you</span>':'')+'</div></div>'+
    (act?'<div class="ox-act top">'+act+'</div>':'')+
    '<div class="ox-kp"><div class="m"><b>'+a.pts+'</b><small>Total Points</small></div><div><b>'+a.wins+'</b><small>Wins</small></div><div><b>'+a.games+'</b><small>Sessions</small></div><div><b>'+(ac===null?"-":ac+"%")+'</b><small>Accuracy</small></div></div>'+
    '<div class="ox-sec">Points by Game</div><div class="ox-grs">'+gr+'</div>'+
    '<div class="ox-sec">Awards</div>'+aw+
    (ach?'<div class="ox-sec">Achievements</div><div class="ox-achs">'+ach+'</div>':'')+'</div>');}

/* ---------- Friends ---------- */
function frow(id,x,extra){var r=LB[id]||{},n=r.n||x.n||"Player",p=r.p||x.p||"";FB[id]={name:n,photo:p};
  return'<div class="ox-row" onclick="OLX.prof(\''+e(id)+'\')">'+av(p,id,"",n)+'<div class="ox-rw"><b>'+I.nmu(id,n)+'</b><small>'+agg(r).pts+' pts</small></div>'+(extra||"")+'</div>';}
function friends(){I.sv("stats");curTab="friends";
  load(function(){if(!alive())return;var u=U();
    Promise.all([D().ref("fr/"+u.uid).once("value"),D().ref("fl/"+u.uid).once("value")]).then(function(r){
      var inc=r[0].val()||{},fl=r[1].val()||{},ik=Object.keys(inc),fk=Object.keys(fl);NREQ=ik.length;
      var h=tabs("friends");
      if(ik.length)h+=sec("Friend Requests",String(ik.length))+'<div class="ox-list">'+ik.map(function(id){return frow(id,inc[id],'<span class="ox-btns"><button type="button" class="ox-yes" onclick="event.stopPropagation();OLX.facc(\''+e(id)+'\')">Accept</button><button type="button" class="ox-no" aria-label="Decline" onclick="event.stopPropagation();OLX.fdec(\''+e(id)+'\')">'+IX("close")+'</button></span>');}).join("")+'</div>';
      h+=sec("Find Players")+'<input class="ox-in" dir="auto" id="oxQ" placeholder="Search by name" value="'+e(fq)+'" oninput="OLX.srch(this.value)" autocomplete="off"><div id="oxS" class="ox-list"></div>';
      h+=sec("My Friends",String(fk.length))+(fk.length?'<div class="ox-list">'+fk.map(function(id){return frow(id,fl[id]);}).join("")+'</div>':'<div class="ox-none">No friends yet. Search for a player above, or tap any name in the ranking.</div>');
      shell(h,"Friends");srch(fq,fl);
    },function(){T("Couldn't load friends. Make sure the Rules are published");});});}
function srch(q,fl){if(fl)FLC=fl;fq=q||"";var el=document.getElementById("oxS");if(!el)return;var mid=U().uid,t=fq.trim().toLowerCase();
  if(!t){el.innerHTML="";return;}
  var R=Object.keys(LB||{}).filter(function(id){return id!==mid&&String((LB[id]||{}).n||"").toLowerCase().indexOf(t)>=0;}).slice(0,15);
  el.innerHTML=R.length?R.map(function(id){var isF=!!FLC[id];return frow(id,{},isF?'<span class="ox-tag">Friend</span>':'<span class="ox-btns"><button type="button" class="ox-yes" onclick="event.stopPropagation();OLX.fadd(\''+e(id)+'\')">'+IX("plus")+' Add</button></span>');}).join(""):'<div class="ox-none sm">No player with that name. Players show up here after they finish an online game.</div>';}
function after(){if(profId)prof(profId);if(curTab==="friends"&&alive())friends();}
function fail(){T("Couldn't do that. Make sure the Rules are published");}
function fadd(id){var u=U();D().ref("fr/"+id+"/"+u.uid).set({n:u.displayName||"Player",p:u.photoURL||"",t:Date.now()}).then(function(){T("Friend request sent");after();},fail);}
function facc(id){var u=U();D().ref("fr/"+u.uid+"/"+id).once("value").then(function(s){var r=s.val();if(!r){T("That request no longer exists");return;}
  var up={},now=Date.now();up["fl/"+u.uid+"/"+id]={n:r.n||"Player",p:r.p||"",t:now};up["fl/"+id+"/"+u.uid]={n:u.displayName||"Player",p:u.photoURL||"",t:now};up["fr/"+u.uid+"/"+id]=null;
  return D().ref().update(up).then(function(){T("You are now friends");});}).then(after,fail);}
function fdec(id){var u=U();D().ref("fr/"+u.uid+"/"+id).remove().then(after,fail);}
function fcan(id){var u=U();D().ref("fr/"+id+"/"+u.uid).remove().then(function(){T("Request cancelled");after();},fail);}
function funf(id){if(!confirm("Remove this player from your friends?"))return;var u=U(),up={};up["fl/"+u.uid+"/"+id]=null;up["fl/"+id+"/"+u.uid]=null;D().ref().update(up).then(after,fail);}

/* ---------- Suggest a question ---------- */
function sug(k,r){ret=r||null;I.sv("x");F={g:GN[k]?k:"career"};formView();}
function back(){var r=ret;ret=null;if(r)r();else OL.stats();return true;}
function fg(g){F.g=g;formView();}
function formView(){var g=F.g,h='<div class="ox-note">'+IX("pencil")+'<div><b>Suggest a Question</b><small>Fill in the details and they go to the admin. If approved, the question is added to the game.</small></div></div>'+
  '<div class="ox-gs">'+["flags","story","career","crime"].map(function(x){return'<button type="button" class="ox-g'+(g===x?' on':'')+'" onclick="OLX.fg(\''+x+'\')">'+GN[x]+'</button>';}).join("")+'</div><div id="oxF">'+fields(g)+
  '<label class="ox-l">Notes for the admin <small>(optional)</small></label><textarea class="ox-ta" dir="auto" id="oxN" rows="2" maxlength="400" placeholder="Source of the info or any extra detail"></textarea>'+
  '<button type="button" class="ol-b" onclick="OLX.send()">'+IX("send")+' Send to Admin</button></div><div id="oxMine"></div>';
  I.shell(h,{t:"Suggest a Question",g:g==="crime"?"crime":g});mine();}
function stopRow(i){return'<div class="ox-stop"><span class="ox-sn">'+i+'</span><div class="ox-sf"><input class="ox-in l ox-club" dir="ltr" placeholder="Club" maxlength="40"><div class="ox-yrs"><input class="ox-in ox-from" type="number" inputmode="numeric" placeholder="From" min="1950" max="2100"><input class="ox-in ox-to" type="number" inputmode="numeric" placeholder="To (empty = now)" min="1950" max="2100"><label class="ox-lo"><input type="checkbox" class="ox-cb ox-loan"> Loan</label></div></div><button type="button" class="ox-rm" onclick="OLX.rm(this)" aria-label="Remove">'+IX("close")+'</button></div>';}
function clueRow(i){return'<div class="ox-clue"><small>Clue '+i+'</small><textarea class="ox-ta ox-cl" dir="auto" rows="2" maxlength="300" placeholder="'+(i===1?"Hardest clue":i===2?"A bit easier":"Clearer")+'"></textarea><button type="button" class="ox-rm" onclick="OLX.rm(this)" aria-label="Remove">'+IX("close")+'</button></div>';}
function fields(g){
  if(g==="flags")return'<label class="ox-l">Country name <small>(in Arabic, as shown in the game)</small></label><input class="ox-in" dir="auto" id="oxA" maxlength="40" placeholder="e.g. مصر"><label class="ox-l">Country code <small>(2 letters)</small></label><div class="ox-flagrow"><input class="ox-in l" dir="ltr" id="oxC" maxlength="2" placeholder="EG" oninput="OLX.fp(this)"><div class="ox-fp" id="oxFp"></div></div>';
  if(g==="story")return'<label class="ox-l">Player name <small>(in English, as in the game)</small></label><input class="ox-in l" dir="ltr" id="oxA" maxlength="60" placeholder="Mohamed Salah"><label class="ox-l">Clues <small>(hardest to easiest, 3 minimum)</small></label><div id="oxCl">'+clueRow(1)+clueRow(2)+clueRow(3)+'</div><button type="button" class="ol-b o" onclick="OLX.addc()">+ Add Clue</button>';
  if(g==="career")return'<label class="ox-l">Name <small>(in English)</small></label><input class="ox-in l" dir="ltr" id="oxA" maxlength="60" placeholder="Mohamed Salah"><div class="ox-seg"><button type="button" class="on" data-t="p" onclick="OLX.seg(this)">Player</button><button type="button" data-t="c" onclick="OLX.seg(this)">Coach</button></div><label class="ox-l">Career stops in order <small>(3 minimum)</small></label><div id="oxSt">'+stopRow(1)+stopRow(2)+stopRow(3)+'</div><button type="button" class="ol-b o" onclick="OLX.adds()">+ Add Stop</button>';
  return'<label class="ox-l">Story title</label><input class="ox-in" dir="auto" id="oxA" maxlength="80" placeholder="Case name"><label class="ox-l">Details <small>(events, roles, clues and the solution)</small></label><textarea class="ox-ta" dir="auto" id="oxD" rows="10" maxlength="4000" placeholder="Write the whole story in detail"></textarea>';}
function fp(el){el.value=el.value.replace(/[^a-zA-Z]/g,"").toUpperCase();var f=document.getElementById("oxFp");if(f)f.innerHTML=el.value.length===2&&window.flagImgUrl?'<img src="'+e(flagImgUrl(el.value))+'" alt="">':"";}
function renum(sel,cls){var c=document.querySelectorAll(sel+" ."+cls);for(var i=0;i<c.length;i++)c[i].textContent=cls==="ox-sn"?(i+1):"Clue "+(i+1);}
function rm(b){var r=b.parentNode,box=r.parentNode;if(box.children.length<=3){T("3 minimum");return;}r.remove();renum("#"+box.id,box.id==="oxSt"?"ox-sn":"ox-clue>small");}
function addc(){var b=document.getElementById("oxCl");if(b.children.length>=8){T("8 clues maximum");return;}b.insertAdjacentHTML("beforeend",clueRow(b.children.length+1));}
function adds(){var b=document.getElementById("oxSt");if(b.children.length>=20){T("That is enough stops");return;}b.insertAdjacentHTML("beforeend",stopRow(b.children.length+1));}
function seg(b){var all=b.parentNode.children;for(var i=0;i<all.length;i++)all[i].classList.remove("on");b.classList.add("on");}
function send(){var u=U(),g=F.g,A=val("oxA"),d,title=A;
  if(g==="flags"){var c=val("oxC").toUpperCase();if(!A||!/^[A-Z]{2}$/.test(c))return T("Enter the country name and its 2-letter code");d=[c,A];}
  else if(g==="story"){var cl=[].slice.call(document.querySelectorAll(".ox-cl")).map(function(x){return x.value.trim();}).filter(Boolean);if(!A||cl.length<3)return T("Enter the player name and at least 3 clues");d={name:A,clues:cl};}
  else if(g==="career"){var st=[].slice.call(document.querySelectorAll(".ox-stop")).map(function(r){var cb=r.querySelector(".ox-club").value.trim(),f=parseInt(r.querySelector(".ox-from").value,10),t=r.querySelector(".ox-to").value.trim(),ln=r.querySelector(".ox-loan").checked;
      if(!cb)return null;if(!(f>=1950&&f<=2100))return"bad";var to=t===""?null:parseInt(t,10);if(to!==null&&!(to>=f&&to<=2100))return"bad";return ln?[cb,f,to,1]:[cb,f,to];}).filter(Boolean);
    if(!A||st.length<3||st.indexOf("bad")>=0)return T("Enter the name and 3 valid stops (From / To years)");
    var tp=document.querySelector(".ox-seg .on");d={n:A,t:tp?tp.getAttribute("data-t"):"p",c:st};}
  else{var tx=val("oxD");if(!A||tx.length<40)return T("Enter a title and details (40 characters minimum)");d={title:A,text:tx};}
  var id=D().ref("qreq").push().key,up={},now=Date.now();
  up["qreq/"+id]={u:u.uid,n:u.displayName||"Player",g:g,d:d,note:val("oxN"),t:now,s:"p"};
  up["qres/"+u.uid+"/"+id]={g:g,t:title,s:"p",at:now};
  D().ref().update(up).then(function(){T("Sent to the admin");formView();},function(){T("Couldn't send. Make sure the Rules are published");});}
function mine(){var u=U(),el=document.getElementById("oxMine");if(!el)return;
  D().ref("qres/"+u.uid).once("value").then(function(s){var v=s.val()||{},L=Object.keys(v).map(function(k){return v[k];}).sort(function(a,b){return(b.at||0)-(a.at||0);}).slice(0,8);
    el=document.getElementById("oxMine");if(!el||!L.length)return;
    el.innerHTML=sec("My Requests")+L.map(function(q){var c=q.s==="a"?"a":q.s==="r"?"r":"p";return'<div class="ox-mq"><span class="ox-st s-'+c+'">'+(c==="a"?"Accepted":c==="r"?"Rejected":"Pending")+'</span><div><b dir="auto">'+e(q.t||"")+'</b><small>'+(GN[q.g]||"")+(q.r?' · '+e(q.r):'')+'</small></div></div>';}).join("");},function(){});}

/* ---------- Question requests (admin) ---------- */
function fmt(g,d){d=d||{};
  if(g==="flags")return'<div class="ox-fm">'+(window.flagImgUrl&&d[0]?'<img src="'+e(flagImgUrl(d[0]))+'" alt="">':'')+'<b dir="auto">'+e(d[1])+'</b><small dir="ltr">'+e(d[0])+'</small></div>';
  if(g==="story")return'<b dir="ltr">'+e(d.name)+'</b><ol class="ox-cll">'+(d.clues||[]).map(function(c){return'<li dir="auto">'+e(c)+'</li>';}).join("")+'</ol>';
  if(g==="career")return'<b dir="ltr">'+e(d.n)+'</b> <small>'+(d.t==="c"?"Coach":"Player")+'</small><div class="ox-stl">'+(d.c||[]).map(function(c){return'<div dir="ltr"><span>'+e(c[0])+(c[3]?' <i>loan</i>':'')+'</span><small>'+e(c[1])+' – '+(c[2]==null?"Now":e(c[2]))+'</small></div>';}).join("")+'</div>';
  return'<b dir="auto">'+e(d.title)+'</b><p class="ox-tx" dir="auto">'+e(d.text)+'</p>';}
function lit(s){return"`"+String(s).replace(/\\/g,"\\\\").replace(/`/g,"\\`").replace(/\$\{/g,"\\${")+"`";}
function srcOf(g,d){if(g==="flags")return JSON.stringify([d[0],d[1]])+",";
  if(g==="story")return"{name:"+lit(d.name)+",clues:[\n"+(d.clues||[]).map(function(c){return"    "+lit(c);}).join(",\n")+"\n  ]},";
  if(g==="career")return'{n:'+JSON.stringify(d.n)+',t:"'+(d.t==="c"?"c":"p")+'",c:['+(d.c||[]).map(function(c){return"["+JSON.stringify(c[0])+","+c[1]+","+(c[2]==null?"null":c[2])+(c[3]?",1":"")+"]";}).join(",")+"]},";
  return d.title+"\n\n"+d.text;}
function queue(){if(!I.adm())return;I.sv("x");ret=function(){OL.stats();};
  D().ref("qreq").once("value").then(function(s){var v=s.val()||{};QL=Object.keys(v).map(function(id){return{id:id,x:v[id]};}).filter(function(r){return!r.x.s||r.x.s==="p";}).sort(function(a,b){return(b.x.t||0)-(a.x.t||0);});qview();},function(){T("No permission. Make sure the Rules are published");});}
function qview(){var h='<div class="ol-w">'+QL.length+' pending request'+(QL.length===1?'':'s')+'</div>'+(QL.length?QL.map(function(r,i){var x=r.x,dt=x.t?dstr(x.t):"";
  return'<div class="ox-q"><div class="ox-qh"><span class="ox-gt">'+(GN[x.g]||x.g)+'</span><small>from <b dir="auto">'+e(x.n||"")+'</b> · '+dt+'</small></div><div class="ox-qb">'+fmt(x.g,x.d)+'</div>'+(x.note?'<div class="ox-qn" dir="auto">'+e(x.note)+'</div>':'')+
    '<div class="ol-r"><button type="button" class="ol-b g" onclick="OLX.qdec('+i+',1)">'+IC("check")+' Approve</button><button type="button" class="ol-b r" onclick="OLX.qdec('+i+',0)">'+IC("x")+' Reject</button></div><button type="button" class="ol-s" onclick="OLX.qcopy('+i+')">Copy as game data</button>'+(x.g==="crime"?'<div class="ox-hint">Crime stories are only recorded. Add them to the code yourself.</div>':'<div class="ox-hint">If approved, the question shows up in online games right away.</div>')+'</div>';}).join(""):'<div class="ox-none">No new requests</div>');
  I.shell(h,{t:"Question Requests",g:"base"});}
function qdec(i,ok){var r=QL[i];if(!r)return;var x=r.x,up={},rs="";
  if(!ok){rs=prompt("Reason for rejecting (optional)");if(rs===null)return;}
  up["qreq/"+r.id+"/s"]=ok?"a":"r";up["qres/"+x.u+"/"+r.id+"/s"]=ok?"a":"r";if(rs)up["qres/"+x.u+"/"+r.id+"/r"]=rs;
  if(ok&&x.g!=="crime")up["qok/"+x.g+"/"+r.id]={d:x.d,by:x.n||"",at:Date.now()};
  D().ref().update(up).then(function(){QL.splice(i,1);T(ok?(x.g==="crime"?"Approved":"Approved and added to online games"):"Rejected");qview();},function(){T("Couldn't do that. Make sure the Rules are published");});}
function qcopy(i){var r=QL[i];if(!r)return;var t=srcOf(r.x.g,r.x.d);try{navigator.clipboard.writeText(t).then(function(){T("Copied");},function(){T("Couldn't copy");});}catch(x){T("Couldn't copy");}}

/* ---------- styles ---------- */
var SVG=function(p){return'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'2.1\' stroke-linecap=\'round\' stroke-linejoin=\'round\'>'+p+'</svg>")';};
var css=':root{--x-grid:'+SVG("<path d=\'M9 4v16M15 4v16M4 9h16M4 15h16\'/>")+';--x-dice:'+SVG("<rect x=\'4\' y=\'4\' width=\'16\' height=\'16\' rx=\'3.5\'/><circle cx=\'9\' cy=\'9\' r=\'.9\'/><circle cx=\'15\' cy=\'15\' r=\'.9\'/><circle cx=\'12\' cy=\'12\' r=\'.9\'/>")+';--x-flag:'+SVG("<path d=\'M5 21V4M5 4h12l-2.5 4L17 12H5\'/>")+';--x-who:'+SVG("<circle cx=\'12\' cy=\'8\' r=\'3.5\'/><path d=\'M5 20c0-4 3-6 7-6s7 2 7 6\'/>")+';--x-move:'+SVG("<path d=\'M3 17l18-6-8 9-2-5-8 2zM11 15l10-4\'/>")+';--x-target:'+SVG("<circle cx=\'12\' cy=\'12\' r=\'9\'/><circle cx=\'12\' cy=\'12\' r=\'5\'/><circle cx=\'12\' cy=\'12\' r=\'1.2\'/>")+';--x-bolt:'+SVG("<path d=\'M13 2L4 14h7l-1 8 9-12h-7z\'/>")+';--x-sync:'+SVG("<path d=\'M20 8a8 8 0 0 0-14-2L4 8M4 4v4h4M4 16a8 8 0 0 0 14 2l2-2M20 20v-4h-4\'/>")+';--x-shield:'+SVG("<path d=\'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z\'/><path d=\'M8.5 12l2.5 2.5L16 9.5\'/>")+';--x-logout:'+SVG("<path d=\'M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9\'/>")+';--x-medal:'+SVG("<circle cx=\'12\' cy=\'14\' r=\'6\'/><path d=\'M8.5 3l3.5 6 3.5-6\'/>")+';--x-chev:'+SVG("<path d=\'M9 6l6 6-6 6\'/>")+'}'+`
#olSheet{--bg:#0a0a0a;--card:#141413;--card2:#1b1a18;--h1:#1b1a18;--h2:#141413;--ln:#2a2927;--ln2:#41403b;--mu:#8d9d95;--mu2:#6c7c74;--ink:#e9efeb;--ac:#d4b675;--acr:212,182,117;--on:#111;--gr:#0d6b50;--gon:#fff;position:fixed;inset:0;z-index:9995;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.66);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);direction:ltr;text-align:left;color:var(--ink);font-family:'IBM Plex Sans Arabic','Tajawal',system-ui,sans-serif;animation:oxF .15s}
#olSheet *{box-sizing:border-box}
.ox-pts,.ox-pv,.ox-wp,.ox-kp b,.ox-gr b{direction:ltr;unicode-bidi:isolate}
@keyframes oxF{from{opacity:0}}@keyframes oxU{from{transform:translateY(40px);opacity:0}}
.ox-sh{position:relative;width:100%;max-width:480px;max-height:92dvh;overflow-y:auto;border-radius:24px 24px 0 0;background:#111110;border:1px solid var(--ln2);border-bottom:0;padding:14px 16px calc(24px + env(safe-area-inset-bottom,0px));animation:oxU .22s cubic-bezier(.2,.8,.2,1)}
.ox-ld{padding:50px 0;text-align:center;color:var(--mu)}
.ox-grab{display:block;width:42px;height:4px;margin:0 auto 12px;border-radius:9px;background:var(--ln2)}
.ox-x{position:absolute;top:12px;inset-inline-end:12px;width:36px;height:36px;border-radius:50%;border:1px solid var(--ln2);background:var(--card);color:var(--mu);display:grid;place-items:center;cursor:pointer}
.ox-ph{display:flex;flex-direction:column;align-items:center;gap:6px;margin:6px 0 12px;text-align:center}
.ox-nn{font-size:21px;max-width:100%;overflow-wrap:anywhere}.ox-ph small{color:var(--mu)}
.ol-av.ox-big,.ol-ph.ox-big{width:84px;height:84px;border-width:3px}
.ox-ini{display:inline-grid;place-items:center;border-style:solid;background:var(--card2);color:var(--mu);font:400 .55em/1 Anton,Impact,sans-serif;letter-spacing:.02em}
.ol-ph.ox-ini{font-size:15px}.ox-big.ox-ini{font-size:40px}
.ox-kp{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:6px}
.ox-kp>div{padding:11px 4px 9px;text-align:center;border-radius:14px;border:1px solid var(--ln);background:var(--card)}
.ox-kp>.m{border-color:rgba(var(--acr),.5);background:linear-gradient(160deg,var(--h1),var(--h2))}
.ox-kp b{display:block;font:400 26px/1 Anton,Impact,sans-serif;letter-spacing:.04em;color:var(--ink);padding-top:3px}.ox-kp>.m b{color:var(--ac);font-size:30px}
.ox-kp small{display:block;margin-top:5px;color:var(--mu);font-size:11.5px}
.ox-sec{margin:18px 2px 8px;color:var(--ac);font-weight:700;font-size:14px}
.ox-grs{padding:12px 14px;border-radius:14px;border:1px solid var(--ln);background:var(--card)}
.ox-gr{display:flex;align-items:center;gap:10px;padding:5px 0;font-size:14px}.ox-gr>span{flex:none;width:76px;color:var(--mu)}
.ox-bar{flex:1;height:7px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden}.ox-bar i{display:block;height:100%;background:var(--ac);border-radius:9px}
.ox-gr b{flex:none;min-width:32px;text-align:right;font:400 20px/1 Anton,sans-serif;color:var(--ink);padding-top:2px}
.ox-aw{display:flex;align-items:center;gap:12px;margin:7px 0;padding:11px 13px;border-radius:14px;border:1px solid rgba(230,194,90,.5);background:linear-gradient(135deg,rgba(230,194,90,.16),rgba(230,194,90,.04));color:#e6c25a}
.ox-aw .ol-i{flex:none;width:26px;height:26px}.ox-aw b{display:block;color:#f6e7b4;font-size:15px}.ox-aw small{display:block;color:#b9a574;font-size:12px;margin-top:1px}
.ox-aw.lead{border-style:dashed}
.ox-none{padding:16px;text-align:center;border-radius:14px;border:1px dashed var(--ln2);color:var(--mu);font-size:14px;line-height:1.7;margin:8px 0}.ox-none.sm{padding:10px;font-size:13px}
.ox-achs{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.ox-ach{padding:4px 10px;border-radius:99px;border:1px solid var(--ln2);color:var(--mu);font-size:12px}.ox-ach .ol-i{color:var(--ac);width:.95em;height:.95em}
.ox-ttl{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;border:1px solid rgba(230,194,90,.5);background:rgba(230,194,90,.1);color:#e6c25a;font-size:12px;font-weight:600}.ox-ttl .ol-i{width:1em;height:1em}
.pv-medals{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
.pv-m{text-align:center;padding:9px 4px 8px;border-radius:12px;border:1px solid var(--ln);background:var(--card)}
.pv-m .ol-i{width:20px;height:20px}.pv-m b{display:block;font:400 22px/1.1 Anton,sans-serif;color:var(--ink);margin-top:2px}.pv-m small{display:block;color:var(--mu);font-size:11px}
.pv-m.g .ol-i{color:#e6c25a}.pv-m.s .ol-i{color:#c3ccd5}.pv-m.b .ol-i{color:#c98a55}
.ox-act{margin-top:16px}.ox-act .ol-b{margin:0 0 8px}.ox-act.top{margin:0 0 14px}.ox-act .ol-s{margin:0}
.ox-fr{display:flex;align-items:center;justify-content:center;gap:8px;padding:11px;margin-bottom:8px;border-radius:12px;border:1px solid var(--ln2);color:var(--mu);font-weight:600}.ox-fr.ok{border-color:rgba(124,203,155,.5);color:#7ccb9b}
.ox-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:0 0 14px;padding:5px;border-radius:16px;border:1px solid var(--ln);background:rgba(0,0,0,.28)}
.ox-tab{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 2px 7px;border:0;border-radius:12px;background:transparent;color:var(--mu);font:600 12px inherit;font-family:inherit;cursor:pointer}
.ox-tab .ol-i{width:20px;height:20px}.ox-tab.on{background:var(--ac);color:var(--on)}
.ox-dot{position:absolute;top:3px;inset-inline-end:12px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#e0504a;color:#fff;font:700 10px/17px sans-serif;text-align:center;font-style:normal}
.ox-chips{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:0 0 14px}
.ox-chip{min-height:38px;padding:0 2px;border-radius:99px;border:1px solid var(--ln2);background:transparent;color:var(--mu);font:600 12.5px inherit;font-family:inherit;cursor:pointer}.ox-chip.on{background:var(--ac);color:var(--on);border-color:var(--ac)}
.ox-pod{display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:8px;align-items:end;margin:6px 0 14px}
.ox-pc{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;min-width:0}
.ox-pc .ol-av,.ox-pc .ol-ph{width:54px;height:54px;border-width:2px}.ox-pc.g .ol-av,.ox-pc.g .ol-ph{width:70px;height:70px}
.ox-pc.g .ol-av,.ox-pc.g .ol-ph{border-color:#e6c25a;box-shadow:0 0 0 3px rgba(230,194,90,.22)}.ox-pc.s .ol-av,.ox-pc.s .ol-ph{border-color:#c3ccd5}.ox-pc.b .ol-av,.ox-pc.b .ol-ph{border-color:#c98a55}
.ox-pc .ol-ph{font-size:20px}.ox-pc.g .ol-ph{font-size:26px}
.ox-cr{color:#e6c25a;line-height:0}.ox-cr .ol-i{width:24px;height:24px}
.ox-pn{display:block;max-width:100%;text-align:center;font-size:13px;font-weight:700;line-height:1.5;word-break:break-word}
.ox-pv{font:400 26px/1 Anton,Impact,sans-serif;letter-spacing:.04em;color:var(--ac);padding-top:3px}
.ox-pl{width:100%;display:grid;place-items:center;border-radius:12px 12px 4px 4px;border:1px solid var(--ln2);background:linear-gradient(180deg,var(--card2),var(--card));font:400 30px/1 Anton,sans-serif;color:var(--mu)}
.ox-pc.g .ox-pl{height:84px;border-color:rgba(230,194,90,.6);color:#e6c25a;background:linear-gradient(180deg,rgba(230,194,90,.2),var(--card))}.ox-pc.s .ox-pl{height:62px;color:#c3ccd5}.ox-pc.b .ox-pl{height:46px;color:#c98a55}
.ox-pl span{padding-top:4px}
.ox-list{margin:0 0 6px}
.ox-row{display:flex;align-items:center;gap:10px;padding:10px 12px;margin:7px 0;border-radius:14px;border:1px solid var(--ln);background:var(--card);cursor:pointer}
.ox-row:active{transform:scale(.985)}.ox-row.me{border-color:var(--ac);box-shadow:0 0 0 1px rgba(var(--acr),.25)}
.ox-row .ol-av,.ox-row .ol-ph{width:40px;height:40px;flex:none}
.ox-rk{flex:none;width:28px;text-align:center;font:400 20px/1 Anton,sans-serif;color:var(--mu);padding-top:3px}
.ox-rw{flex:1;min-width:0}.ox-rw b{display:block;font-size:15px}.ox-rw small{display:block;color:var(--mu);font-size:11.5px;margin-top:2px;line-height:1.5}
.ox-pts{flex:none;font:400 24px/1 Anton,Impact,sans-serif;color:var(--ac);letter-spacing:.03em;padding-top:3px}
.ox-btns{flex:none;display:flex;gap:6px}
.ox-yes,.ox-no{min-height:36px;padding:0 12px;border-radius:10px;border:1px solid var(--ln2);background:transparent;color:var(--ink);font:600 13px inherit;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
.ox-yes{background:var(--ac);color:var(--on);border-color:var(--ac)}.ox-no{padding:0 10px;color:var(--mu)}
.ox-tag{flex:none;padding:3px 10px;border-radius:99px;border:1px solid rgba(124,203,155,.5);color:#7ccb9b;font-size:12px}
.ox-hero{position:relative;overflow:hidden;text-align:center;padding:20px 16px 20px;border-radius:22px;border:1px solid rgba(230,194,90,.55);background:radial-gradient(ellipse at 50% 0%,rgba(230,194,90,.24),transparent 65%),linear-gradient(170deg,#241d0c,#0f0d07);box-shadow:0 14px 34px rgba(0,0,0,.5)}
.ox-hero:before{content:"";position:absolute;inset:6px;border-radius:17px;border:1px solid rgba(230,194,90,.25);pointer-events:none}
.ox-hero>*{position:relative}
.ox-rib{display:inline-block;padding:6px 16px 3px;border-radius:4px;background:linear-gradient(135deg,#f6e3a1,#c9992f);color:#2a1d02;font:400 13px/1.3 Anton,Impact,sans-serif;letter-spacing:.2em}
.ox-tr svg{width:116px;height:auto;margin:10px auto 0;display:block;filter:drop-shadow(0 8px 14px rgba(230,194,90,.35))}
.ox-mo{margin:6px 0 10px;color:#f3e6c4;font-weight:700;font-size:15px}
.ox-hero .ol-av,.ox-hero .ol-ph{display:block;margin:0 auto;width:84px;height:84px;border:3px solid #e6c25a;box-shadow:0 0 0 4px rgba(230,194,90,.2)}
.ox-hero .ol-ph{display:grid;font-size:40px;color:#e6c25a}
.ox-wn{margin-top:10px;font-size:22px;font-weight:800;color:#fff}
.ox-wp{margin-top:2px;font:400 28px/1.2 Anton,Impact,sans-serif;color:#e6c25a;letter-spacing:.06em}.ox-wp small{font:600 13px sans-serif;letter-spacing:0;color:#b9a574}
.ox-hero.off .ox-tr svg{filter:grayscale(1) opacity(.35)}.ox-hero.off .ox-wn{font-size:16px;color:#b9a574;font-weight:600}
.ox-note{display:flex;gap:12px;align-items:center;margin:0 0 14px;padding:12px 14px;border-radius:14px;border:1px dashed rgba(var(--acr),.5);background:rgba(0,0,0,.22)}
.ox-note .ol-i{flex:none;width:26px;height:26px;color:var(--ac)}.ox-note b{display:block;font-size:16px}.ox-note small{display:block;color:var(--mu);font-size:12.5px;margin-top:2px;line-height:1.5}
.ox-gs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0 0 12px}
.ox-g{min-height:40px;border-radius:12px;border:1px solid var(--ln2);background:transparent;color:var(--mu);font:600 12.5px inherit;font-family:inherit;cursor:pointer}.ox-g.on{background:var(--ac);color:var(--on);border-color:var(--ac)}
.ox-l{display:block;margin:14px 2px 6px;color:var(--ink);font-weight:700;font-size:14px}.ox-l small{color:var(--mu);font-weight:400}
#olRoot input.ox-in,.ox-ta{display:block;width:100%;min-height:46px;padding:11px 13px;border-radius:12px;border:1px dashed rgba(var(--acr),.5);background:rgba(0,0,0,.28);color:var(--ink);font:500 16px/1.5 inherit;font-family:inherit;letter-spacing:0;text-indent:0;text-align:start;outline:none}
#olRoot input.ox-in.l{direction:ltr;text-align:left}
#olRoot input.ox-in::placeholder,.ox-ta::placeholder{color:var(--mu2);letter-spacing:0;font-size:14px}
#olRoot input.ox-in:focus,.ox-ta:focus{border-style:solid;border-color:var(--ac)}
.ox-ta{resize:vertical;min-height:70px}
.ox-flagrow{display:flex;gap:10px;align-items:center}#olRoot .ox-flagrow input{width:110px;flex:none;text-align:center;letter-spacing:.2em;font-family:Anton,Impact,sans-serif;font-size:22px}
.ox-fp{flex:1;min-height:46px;display:grid;place-items:center}.ox-fp img{max-height:46px;border-radius:4px;border:1px solid rgba(255,255,255,.2)}
.ox-clue{position:relative;margin:0 0 8px}.ox-clue small{display:block;color:var(--ac);font-size:12px;font-weight:700;margin:0 2px 4px}
.ox-rm{position:absolute;top:0;inset-inline-end:0;width:32px;height:32px;border-radius:50%;border:0;background:transparent;color:var(--mu2);display:grid;place-items:center;cursor:pointer}
.ox-stop{position:relative;display:flex;gap:10px;margin:0 0 10px;padding:10px;border-radius:14px;border:1px solid var(--ln);background:var(--card)}
.ox-stop .ox-rm,.ox-clue .ox-rm{inset-inline-end:2px;top:4px}.ox-clue .ox-rm{top:-4px}
.ox-sn{flex:none;width:26px;height:26px;border-radius:4px;display:grid;place-items:center;background:var(--ac);color:var(--on);font:700 12px/1 ui-monospace,monospace}
.ox-sf{flex:1;min-width:0;padding-inline-end:26px}
.ox-yrs{display:grid;grid-template-columns:1fr 1.4fr;gap:6px;margin-top:6px}
#olRoot .ox-yrs input.ox-in{text-align:center;font-size:14px;padding:9px 6px}
.ox-lo{grid-column:1/-1;display:flex;align-items:center;gap:8px;color:var(--mu);font-size:13px}
#olRoot input.ox-cb{width:20px;height:20px;min-height:0;padding:0;flex:none;accent-color:var(--ac)}
.ox-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:14px 0 0}.ox-seg button{min-height:40px;border-radius:12px;border:1px solid var(--ln2);background:transparent;color:var(--mu);font:600 14px inherit;font-family:inherit;cursor:pointer}.ox-seg .on{background:var(--ac);color:var(--on);border-color:var(--ac)}
#oxF .ol-b{margin-top:12px}
.ox-mq{display:flex;align-items:center;gap:10px;margin:7px 0;padding:10px 12px;border-radius:12px;border:1px solid var(--ln);background:var(--card)}.ox-mq b{display:block;font-size:14px}.ox-mq small{color:var(--mu);font-size:12px}
.ox-st{flex:none;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;border:1px solid var(--ln2);color:var(--mu)}.ox-st.s-a{color:#7ccb9b;border-color:rgba(124,203,155,.5)}.ox-st.s-r{color:#ff8a80;border-color:rgba(255,138,128,.5)}
.ox-q{margin:12px 0;padding:14px;border-radius:16px;border:1px solid var(--ln2);background:var(--card)}
.ox-qh{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.ox-qh small{color:var(--mu);font-size:12px}
.ox-gt{padding:3px 11px;border-radius:99px;background:var(--ac);color:var(--on);font-size:12px;font-weight:700}
.ox-qb{padding:12px;border-radius:12px;background:rgba(0,0,0,.3);border:1px dashed var(--ln2);line-height:1.8;font-size:14px}
.ox-qn{margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(var(--acr),.08);color:var(--mu);font-size:13px}
.ox-fm{display:flex;align-items:center;gap:12px}.ox-fm img{height:40px;border-radius:4px;border:1px solid rgba(255,255,255,.2)}
.ox-cll{margin:6px 0 0;padding-inline-start:20px}.ox-cll li{margin:4px 0}
.ox-stl>div{display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px dashed var(--ln)}.ox-stl small{color:var(--mu)}.ox-stl i{font-size:11px;color:var(--ac)}
.ox-tx{margin:6px 0 0;white-space:pre-wrap}
.ox-q .ol-r{margin-top:12px}.ox-hint{margin-top:8px;color:var(--mu2);font-size:12px;text-align:center}
/* ---- account layout ---- */
.ac-h{display:flex;align-items:center;gap:8px;margin:24px 2px 10px;color:var(--ac)}
.ac-h:before{content:"";flex:none;width:3px;height:15px;border-radius:2px;background:var(--ac)}
.ac-h b{font-size:15px;font-weight:700;letter-spacing:.02em}
.ac-h em{font-style:normal;color:var(--mu2);font-size:12.5px}
.ac-h .ac-more{margin-inline-start:auto;border:0;background:transparent;color:var(--ac);font:600 12.5px inherit;font-family:inherit;cursor:pointer;padding:4px 2px}
.ac-tag{margin-inline-start:auto;padding:2px 9px;border-radius:99px;border:1px solid rgba(var(--acr),.5);color:var(--ac);font-size:11px;font-weight:600}
.ac-hero{position:relative;border:1px solid rgba(var(--acr),.46);border-radius:20px;background:linear-gradient(160deg,var(--h1),var(--h2));box-shadow:0 10px 26px rgba(0,0,0,.45);overflow:hidden}
.ac-hero:after{content:"";position:absolute;inset:6px;border-radius:15px;border:1px solid rgba(var(--acr),.2);pointer-events:none}
.ac-id{position:relative;z-index:1;display:flex;gap:14px;align-items:center;padding:18px 16px 14px}
.ol-av.ac-av,.ol-ph.ac-av{width:68px;height:68px;border-width:2px;border-color:var(--ac)}.ol-ph.ac-av{font-size:30px}
.ac-who{min-width:0;flex:1}
.ac-name{display:block;font-size:19px;line-height:1.35;color:var(--ink2);overflow-wrap:anywhere}
.ac-mail{display:block;color:var(--mu);font-size:12.5px;word-break:break-all;margin-top:1px}
.ac-pills{display:flex;flex-wrap:wrap;justify-content:inherit;gap:6px;margin-top:9px}
.ox-ph .ac-pills{justify-content:center;margin-top:2px}
.ac-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;border:1px solid var(--ln2);background:rgba(0,0,0,.3);color:var(--mu);font-size:12px;font-weight:600}
.ac-pill .ol-i{width:1em;height:1em}.ac-pill em{font-style:normal;opacity:.7;font-weight:400}
.ac-pill.gold{border-color:rgba(var(--acr),.6);color:var(--ac)}
.ac-stats{position:relative;z-index:1;display:grid;grid-template-columns:1.25fr 1fr 1fr 1fr;border-top:1px dashed var(--ln2)}
.ac-stats>div{padding:12px 4px 11px;text-align:center}
.ac-stats>div+div{border-inline-start:1px solid var(--ln)}
.ac-stats b{display:block;font:400 27px/1 Anton,Impact,sans-serif;letter-spacing:.04em;color:var(--ink);padding-top:3px;direction:ltr}
.ac-stats>div:first-child b{color:var(--ac);font-size:32px}
.ac-stats small{display:block;margin-top:5px;color:var(--mu);font-size:11.5px}
.ac-games{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ac-g{position:relative;padding:13px 10px 11px;border-radius:16px;border:1px solid var(--ln);background:var(--card);overflow:hidden}
.ac-g:before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--gc)}
.ac-gi{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:9px;background:rgba(255,255,255,.05);color:var(--gc)}.ac-gi .ol-i{width:16px;height:16px}
.ac-g small{display:block;margin-top:8px;color:var(--mu);font-size:12px}
.ac-g b{display:block;font:400 30px/1.1 Anton,Impact,sans-serif;letter-spacing:.04em;color:var(--ink);margin-top:2px;direction:ltr}
.ac-gr{display:flex;gap:10px;margin-top:6px;color:var(--mu);font-size:12px}.ac-gr .ol-i{width:.9em;height:.9em;vertical-align:-.12em;margin-inline-end:3px}
.ac-g .ol-acc{margin-top:8px}.ac-g .ol-acc i{background:var(--gc)}
.ac-g.off{opacity:.55}.ac-g.off b{color:var(--mu2)}.ac-g em{display:block;margin-top:6px;color:var(--mu2);font-style:normal;font-size:11.5px}
.ac-chips{display:flex;flex-wrap:wrap;gap:6px}
.ac-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:99px;border:1px solid rgba(var(--acr),.5);background:rgba(var(--acr),.08);color:var(--ac);font-size:12.5px;font-weight:600}.ac-chip .ol-i{width:1em;height:1em}
.ac-none{color:var(--mu2);font-size:13px}
.ac-next{margin-top:10px;padding:11px 14px;border-radius:14px;border:1px dashed var(--ln2);background:rgba(0,0,0,.2)}
.ac-next b{font-size:13.5px}.ac-next small{color:var(--mu);font-size:12px;margin-inline-start:8px}
.ac-tile{display:flex;align-items:center;gap:14px;width:100%;padding:14px 16px;border-radius:16px;border:1px solid rgba(var(--acr),.5);background:linear-gradient(160deg,var(--h1),var(--h2));color:var(--ink);font:inherit;font-family:inherit;text-align:start;cursor:pointer;-webkit-tap-highlight-color:transparent}
.ac-tile:active{transform:scale(.985)}
.ac-tile>.ol-i{flex:none;width:26px;height:26px;color:var(--ac)}
.ac-tile b{display:block;font-size:15.5px}.ac-tile small{display:block;color:var(--mu);font-size:12.5px;margin-top:1px}
.ac-tile:after{content:"";flex:none;margin-inline-start:auto;width:18px;height:18px;background:var(--mu2);-webkit-mask:var(--x-chev) center/contain no-repeat;mask:var(--x-chev) center/contain no-repeat}
.ac-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ac-sq{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:12px;padding:14px 14px 13px;min-height:92px;border-radius:16px;border:1px solid var(--ln2);background:var(--card);color:var(--ink);font:600 14px/1.3 inherit;font-family:inherit;text-align:start;cursor:pointer;-webkit-tap-highlight-color:transparent}
.ac-sq .ol-i{width:24px;height:24px;color:var(--ac)}.ac-sq:active{transform:scale(.97)}.ac-sq:disabled{opacity:.5}
.ac-sq .ox-dot{top:10px;inset-inline-end:10px}
.ac-out{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:26px 0 0;min-height:46px;border-radius:14px;border:1px solid rgba(224,80,74,.45);background:transparent;color:#e0746f;font:600 14px inherit;font-family:inherit;cursor:pointer}
/* ---- titles / hall of fame / achievements ---- */
.ti-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ti{display:flex;flex-direction:column;gap:2px;padding:12px;border-radius:16px;border:1px solid rgba(230,194,90,.4);background:linear-gradient(160deg,rgba(230,194,90,.12),rgba(230,194,90,.02));cursor:pointer;min-width:0}
.ti:last-child:nth-child(odd){grid-column:1/-1}
.ti-ic{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:rgba(230,194,90,.16);color:#e6c25a;margin-bottom:6px}.ti-ic .ol-i{width:18px;height:18px}
.ti b{font-size:14px;color:#f6e7b4}.ti small{color:var(--mu);font-size:11.5px;line-height:1.4}
.ti-h{display:flex;align-items:center;gap:7px;margin-top:9px;padding-top:9px;border-top:1px dashed rgba(230,194,90,.28);min-width:0}
.ti-h .ol-av,.ti-h .ol-ph{width:26px;height:26px;flex:none}.ti-h .ol-ph{font-size:12px}
.ti-n{flex:1;min-width:0;font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ti-v{flex:none;font:400 18px/1 Anton,sans-serif;color:#e6c25a;letter-spacing:.03em;direction:ltr}
.ti.vac{border-style:dashed;border-color:var(--ln2);background:transparent;opacity:.6;cursor:default}.ti.vac .ti-ic{background:rgba(255,255,255,.05);color:var(--mu2)}.ti.vac b{color:var(--mu)}
.ti-h.vacant{color:var(--mu2);font-size:12.5px;border-top-color:var(--ln)}
.hf{margin:8px 0;border-radius:16px;border:1px solid var(--ln);background:var(--card);overflow:hidden}
.hf-h{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(230,194,90,.08);color:#e6c25a;font-size:12.5px;font-weight:700;letter-spacing:.03em}.hf-h .ol-i{width:16px;height:16px}
.hf-w{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer}.hf-w .ol-av,.hf-w .ol-ph{width:40px;height:40px;flex:none}
.hf-pod{display:flex;gap:6px;padding:0 12px 11px;flex-wrap:wrap}
.hf-pod span{display:inline-flex;align-items:center;gap:6px;padding:3px 10px 3px 8px;border-radius:99px;border:1px solid var(--ln2);color:var(--mu);font-size:12px;cursor:pointer;max-width:100%}
.hf-pod span b{font-weight:600;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hf-pod i{flex:none;width:9px;height:9px;border-radius:50%;background:#c3ccd5}.hf-pod span.b i{background:#c98a55}
.bd2-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.bd2{padding:11px 12px;border-radius:14px;border:1px solid var(--ln);background:var(--card);color:var(--mu2)}
.bd2 b{display:flex;align-items:center;gap:6px;font-size:13.5px;color:var(--mu)}.bd2 b .ol-i{width:1em;height:1em}.bd2 small{display:block;font-size:11.5px;margin-top:2px}
.bd2.on{border-color:rgba(var(--acr),.6);background:rgba(var(--acr),.07)}.bd2.on b{color:var(--ac)}
.bd2 .ol-pb{margin-top:8px}.bd2 .ol-of{display:block;margin-top:4px}
`;
var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

window.OLX={tabs:tabs,pre:pre,go:go,me:me,rank:rank,rf:function(f){rank(f);},awards:awards,friends:friends,prof:prof,close:close,
  fadd:fadd,facc:facc,fdec:fdec,fcan:fcan,funf:funf,srch:srch,sug:sug,back:back,fg:fg,fp:fp,rm:rm,addc:addc,adds:adds,seg:seg,send:send,
  queue:queue,qdec:qdec,qcopy:qcopy};
})();
