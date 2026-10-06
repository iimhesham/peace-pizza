/* Online system check (admin only): runs the same operations the game does against the real Firebase with your account, then cleans up after itself. */
(function(){
var U=function(){return window.ppUser;},I=function(n){return'<i class="ol-i" style="--ic:var(--i-'+n+')"></i>';};
var e=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var R=[],busy=false;
function draw(done){var ok=R.filter(function(x){return x.ok;}).length;
  OL.shell('<div class="ol-w">'+(done?ok+" of "+R.length+" passed":"Running checks...")+'</div>'+R.map(function(x){return'<div class="ol-t"><div style="min-width:0"><b style="display:block">'+e(x.n)+'</b>'+(x.m?'<small dir="ltr" style="display:block;color:'+(x.ok?'#8d9d95':'#e07a7a')+'">'+e(x.m)+'</small>':'')+'</div><span>'+I(x.ok?'check':'x')+'</span></div>';}).join("")+
  (done?'<button type="button" class="ol-b" onclick="OLT.run()">Run Again</button><button type="button" class="ol-b o" onclick="OLT.copy()">Copy Report</button>':''),{t:"System Check"});}
function run(){if(busy)return;busy=true;R=[];var u=U(),db=firebase.database(),db2=null,p=null,c=null,need=false,chain=Promise.resolve();
  function add(n,ok,m){R.push({n:n,ok:ok,m:m||""});draw(false);}
  function S(n,fn,deny,pl){chain=chain.then(function(){if(pl&&!p){R.push({n:n,ok:false,m:"Skipped: no test player (enable Anonymous sign-in)"});draw(false);return;}if(need&&!c){add(n,false,"The room was not opened");return;}
    return Promise.resolve().then(fn).then(function(m){add(n,!deny,deny?"Allowed, but it should have been denied":(typeof m==="string"?m:""));},function(x){add(n,!!deny,deny?"Denied as expected":(x&&(x.code||x.message))||"Failed");});});}
  var H=function(q){return q?db.ref(q):db.ref();},P=function(q){return db2.ref(q);},must=function(s){if(!s.exists())throw new Error("Empty");};
  var cr=function(){return"rooms/"+c+"/crew/"+p.uid;},T1={name:"t",photo:""};
  S("Server connection",function(){return new Promise(function(res,rej){var r=H(".info/connected"),d=false,h=r.on("value",function(s){if(s.val()&&!d){d=true;r.off("value",h);res();}});setTimeout(function(){if(!d){r.off("value",h);rej(new Error("No connection after 8 seconds"));}},8000);});});
  S("Connection speed",function(){var t=Date.now();return H("badges").once("value").then(function(){var ms=Date.now()-t;if(ms>2500)throw new Error(ms+" ms (slow)");return ms+" ms";});});
  S("Test player (Anonymous) for the checks",function(){var app;try{app=firebase.app("pp-test");}catch(x){app=firebase.initializeApp(firebase.app().options,"pp-test");}
    return app.auth().signInAnonymously().then(function(r){p=r.user;db2=app.database();return"uid "+p.uid.slice(0,6);},function(x){throw new Error(x&&(x.code==="auth/operation-not-allowed"||x.code==="auth/admin-restricted-operation")?"Enable Anonymous: Firebase > Authentication > Sign-in method (turn it off again after testing)":(x&&x.code)||"Failed");});});
  S("Open a new room with a reserved code",function(){return new Promise(function(res,rej){OL.mk({host:u.uid,hostName:"test",game:"selftest",status:"lobby",created:Date.now()},function(err,k){if(err)return rej(err);c=k;res("Code "+k);},true);});});
  chain=chain.then(function(){need=true;});
  S("Host reads the room",function(){return H("rooms/"+c).once("value").then(function(s){if((s.val()||{}).host!==u.uid)throw new Error("Host is wrong");});});
  S("Player takes slot a",function(){return P("rooms/"+c+"/players/a").set({uid:p.uid,name:"t",photo:""});},0,1);
  S("Same player in slot b (must be denied)",function(){return P("rooms/"+c+"/players/b").set({uid:p.uid,name:"t",photo:""});},1,1);
  S("Player changes the room status (must be denied)",function(){return P("rooms/"+c+"/status").set("end");},1,1);
  S("Player buzzes and gets the right",function(){return P("rooms/"+c+"/buzz").transaction(function(x){return x?undefined:{uid:p.uid,name:"t",t:Date.now()};}).then(function(r){if(!r.committed)throw new Error("Did not get the right");});},0,1);
  S("Second buzz (must not get the right)",function(){return H("rooms/"+c+"/buzz").transaction(function(x){return x?undefined:{uid:u.uid};}).then(function(r){if(r.committed)throw new Error("Both were allowed");});});
  S("Player overwrites the buzz (must be denied)",function(){return P("rooms/"+c+"/buzz").set({uid:p.uid,t:1});},1,1);
  S("Host resets the buzz and updates scores",function(){return H("rooms/"+c).update({buzz:null,"scores/x":{pts:1,right:1,wrong:0},"locked/x":true,step:1});});
  S("Crime player joins (crew)",function(){return P(cr()).set(T1);},0,1);
  S("Player adds someone else to the crew (must be denied)",function(){return P("rooms/"+c+"/crew/"+u.uid).set(T1);},1,1);
  S("Secret roles are dealt",function(){var d={};d["secrets/"+c+"/"+u.uid]={role:"h"};if(p){d["secrets/"+c+"/"+p.uid]={role:"t",killer:false};d["rooms/"+c+"/cast/"+p.uid]={alive:true};}d["rooms/"+c+"/status"]="play";return H().update(d);});
  S("Host reads all secrets",function(){return H("secrets/"+c).once("value").then(must);});
  S("Player reads their own secret",function(){return P("secrets/"+c+"/"+p.uid).once("value").then(must);},0,1);
  S("Player reads someone else's secret (must be denied)",function(){return P("secrets/"+c+"/"+u.uid).once("value");},1,1);
  S("Player reads all secrets (must be denied)",function(){return P("secrets/"+c).once("value");},1,1);
  S("Returning player after a reload",function(){return P(cr()).set(T1);},0,1);
  S("New player joins mid-game (must be denied)",function(){return P(cr()).remove().then(function(){return P(cr()).set(T1);});},1,1);
  S("Host opens a vote",function(){return H("rooms/"+c).update({vote:"v1",vc:1});});
  S("Alive player votes",function(){return P("votes/"+c+"/v1/"+p.uid).set(p.uid);},0,1);
  S("Second vote from the same player (must be denied)",function(){return P("votes/"+c+"/v1/"+p.uid).set("zz");},1,1);
  S("Player reads the votes (must be denied)",function(){return P("votes/"+c+"/v1").once("value");},1,1);
  S("Host reads the votes",function(){return H("votes/"+c+"/v1").once("value").then(must);},0,1);
  S("Host eliminates the player and opens a new vote",function(){var d={vote:"v2"};d["cast/"+p.uid+"/alive"]=false;return H("rooms/"+c).update(d);},0,1);
  S("Eliminated player votes (must be denied)",function(){return P("votes/"+c+"/v2/"+p.uid).set(p.uid);},1,1);
  S("Saving account data",function(){var r=H("users/"+u.uid+"/selftest");return r.set(Date.now()).then(function(){return r.remove();});});
  S("Player writes to another account (must be denied)",function(){return P("users/"+u.uid+"/selftest").set(1);},1,1);
  S("Clearing the room in the right order",function(){return H("secrets/"+c).remove().then(function(){return H("votes/"+c).remove();}).then(function(){return H("rooms/"+c).remove();}).then(function(){return H("rooms/"+c).once("value");}).then(function(s){if(s.exists())throw new Error("The room still exists");});});
  chain=chain.then(function(){need=false;});
  S("Removing the test player",function(){return p.delete().then(function(){return firebase.app("pp-test").delete();});},0,1);
  S("Site cache (Service Worker)",function(){if(!navigator.serviceWorker||!navigator.serviceWorker.controller)throw new Error("Not active yet, open the site twice");});
  S("Screen lock",function(){if(!navigator.wakeLock)throw new Error("The browser does not support it");});
  chain.then(function(){busy=false;draw(true);});}
function copy(){try{navigator.clipboard.writeText(R.map(function(x){return(x.ok?"OK   ":"FAIL ")+x.n+(x.m?" — "+x.m:"");}).join("\n")).then(function(){try{toast("Report copied");}catch(x){}});}catch(x){}}
window.OLT={run:run,copy:copy};
})();
