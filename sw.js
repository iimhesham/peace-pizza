/* كاش بسيط: الصفحة والسكربتات من النت الأول (عشان تحديثاتك تظهر فورًا) ولو النت وقع بنجيبها من الكاش.
   الخطوط والصور وملفات Firebase SDK من الكاش مباشرة. قاعدة البيانات والتسجيل مش بيتدخل فيهم خالص. */
var V="pp-v1";
self.addEventListener("install",function(e){self.skipWaiting();});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==V;}).map(function(n){return caches.delete(n);}));}).then(function(){return self.clients.claim();}));});
function put(r,res){if(res&&(res.ok||res.type==="opaque")){var c=res.clone();caches.open(V).then(function(ch){ch.put(r,c);}).catch(function(){});}return res;}
self.addEventListener("fetch",function(e){var r=e.request;if(r.method!=="GET")return;var u=new URL(r.url),same=u.origin===location.origin;
  var sdk=u.hostname==="www.gstatic.com"&&u.pathname.indexOf("/firebasejs/")===0;
  if(!same&&!sdk)return;
  var st=sdk||/\.(woff2?|otf|ttf|png|jpe?g|webp|svg|ico)$/i.test(u.pathname);
  if(st){e.respondWith(caches.match(r).then(function(m){return m||fetch(r).then(function(x){return put(r,x);});}));return;}
  e.respondWith(new Promise(function(ok){var done=false,t=setTimeout(function(){caches.match(r).then(function(m){if(m&&!done){done=true;ok(m);}});},4000);
    fetch(r).then(function(x){clearTimeout(t);put(r,x);if(!done){done=true;ok(x);}}).catch(function(){clearTimeout(t);caches.match(r).then(function(m){if(!done){done=true;ok(m||Response.error());}});});}));});
