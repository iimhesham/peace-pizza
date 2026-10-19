/* كاش ذكي: أي ملف بتاع الموقع بيتسأل عنه السيرفر الأول في كل فتحة (بيتحدّث فورًا، وبيرجع 304 خفيف لو مفيش جديد).
   لو النت وقع أو بطؤ بنجيبه من الكاش. الصور والخطوط من الكاش على طول وبتتحدّث في الخلفية. مكتبة Firebase من الكاش.
   قاعدة البيانات وتسجيل الدخول مبيتدخلش فيهم خالص. */
var V="pp-v4";
self.addEventListener("install",function(e){self.skipWaiting();});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==V;}).map(function(n){return caches.delete(n);}));}).then(function(){return self.clients.claim();}));});
function put(r,res){if(res&&(res.ok||res.type==="opaque")){var c=res.clone();caches.open(V).then(function(ch){ch.put(r,c);}).catch(function(){});}return res;}
function net(r){return fetch(r,{cache:"no-cache"});}
self.addEventListener("fetch",function(e){var r=e.request;if(r.method!=="GET")return;var u=new URL(r.url),same=u.origin===location.origin;
  var sdk=u.hostname==="www.gstatic.com"&&u.pathname.indexOf("/firebasejs/")===0;
  if(!same&&!sdk)return;
  if(sdk){e.respondWith(caches.match(r).then(function(m){return m||fetch(r).then(function(x){return put(r,x);});}));return;}
  if(/\.(woff2?|otf|ttf|png|jpe?g|webp|svg|ico)$/i.test(u.pathname)){
    var up=net(r).then(function(x){return put(r,x);});e.waitUntil(up.catch(function(){}));
    e.respondWith(caches.match(r).then(function(m){return m||up;}));return;}
  var nav=r.mode==="navigate"||/\.html?$/i.test(u.pathname)||u.pathname.slice(-1)==="/";
  if(!nav){
    /* ملف عليه ?v= : ثابت بإصداره => من الكاش فورًا. غير كده: من الكاش فورًا + تحديث في الخلفية للفتحة الجاية */
    var hit=caches.match(r);
    if(u.search.indexOf("v=")>-1){e.respondWith(hit.then(function(m){return m||net(r).then(function(x){return put(r,x);});}));return;}
    var bg=net(r).then(function(x){return put(r,x);}).catch(function(){});e.waitUntil(bg);
    e.respondWith(hit.then(function(m){return m||bg.then(function(){return caches.match(r);}).then(function(m2){return m2||fetch(r);});}));return;}
  /* الصفحة نفسها: الشبكة الأول (عشان تحديثاتك تظهر) وبعد ٢٫٥ ثانية الكاش */
  e.respondWith(new Promise(function(ok){var done=false,t=setTimeout(function(){caches.match(r).then(function(m){if(m&&!done){done=true;ok(m);}});},2500);
    net(r).then(function(x){clearTimeout(t);put(r,x);if(!done){done=true;ok(x);}}).catch(function(){clearTimeout(t);caches.match(r).then(function(m){if(!done){done=true;ok(m||Response.error());}});});}));});
