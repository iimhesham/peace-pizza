/* =========================================================
   TAWLA UI — الرسم المشترك: اللوحة والنرد.
   بيستخدمه tawla.js (أوفلاين) و online-tawla.js (أونلاين)،
   فاللوحة أونلاين هي نفسها الأوفلاين بالظبط.
   مفيش حالة هنا: كل دالة بتاخد اللي تعرضه وترجّع HTML.

   الخانة الفعلية ph (1..24) بترتيب مسار الأبيض: الأبيض q=ph · الأسود q=25-ph.
   أسود: ستاكه فوق يمين وتجميعه تحت يمين · أبيض: اللوحة متلفّة 180°.
========================================================= */
(function(root){
  "use strict";
  var W=0,B=1;
  var qOf=function(p,ph){return p===W?ph:25-ph;};

  /* نقش ذهبي في نص كل نص من اللوحة (زي الطاولات الخشب الحقيقية) */
  var MANDALA=(function(){
    var h='<svg viewBox="-50 -50 100 100" class="tw-mand" aria-hidden="true"><g fill="none" stroke="#c9a15a" stroke-width="1.1" stroke-linecap="round">';
    h+='<circle r="47"/><circle r="41"/><circle r="23"/><circle r="9"/>';
    var i;
    for(i=0;i<12;i++)h+='<path transform="rotate('+i*30+')" d="M0 -23C9 -29 9 -36 0 -41C-9 -36 -9 -29 0 -23Z"/>';
    for(i=0;i<12;i++)h+='<circle transform="rotate('+(i*30+15)+') translate(0 -44)" r="1.9"/>';
    for(i=0;i<8;i++)h+='<path transform="rotate('+i*45+')" d="M0 -9C5 -13 5 -18 0 -23C-5 -18 -5 -13 0 -9Z"/>';
    return h+'</g></svg>';
  })();
  var TRI_TOP='<svg class="tw-tri" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,0 10,0 5,100" vector-effect="non-scaling-stroke"/></svg>';
  var TRI_BOT='<svg class="tw-tri" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="5,0 10,100 0,100" vector-effect="non-scaling-stroke"/></svg>';

  /* أيقونة نرد (بدل الإيموجي) */
  var ICON_DIE='<svg class="tw-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="8.6" cy="8.6" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.4" cy="15.4" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/></svg>';

  function stackHTML(side,n,sel){
    if(n<=0)return "";
    var show=Math.min(n,5),h="",i;
    for(i=0;i<show;i++){
      var last=i===show-1,cnt=last&&n>5;
      h+='<span class="tw-pc '+(side===W?"w":"b")+(cnt?" cnt":"")+(sel&&last?" sel":"")+'"'+(cnt?' data-n="'+n+'"':"")+'></span>';
    }
    return h;
  }

  /* vm = { g, view, turn, sel, src:{q:1}, dst:{q:[حركة]}, tray:"r"|"l",
            trayMine(p)->bool, ph(ph)->attrs, out(p)->attrs }
     بيرجّع { board, tray, trayLeft } */
  function boardHTML(vm){
    var g=vm.g,view=vm.view,OUT=root.TawlaEngine.OUT;
    var cell=function(ph,isTop){
      var w=g.s[W].c[ph],b=g.s[B].c[25-ph];
      var side=w>0?W:B,n=w>0?w:b;
      var q=qOf(vm.turn,ph);
      var cls=["tw-pt",ph%2?"o":"e"];
      if(vm.src[q]&&vm.sel!==q)cls.push("can");
      if(vm.dst[q]!==undefined)cls.push("dest");
      var pips=0;
      if(vm.dst[q]!==undefined)vm.dst[q].forEach(function(m){pips+=m.die;});
      return '<div class="'+cls.join(" ")+'" data-ph="'+ph+'"'+(pips?' data-pips="'+pips+'"':"")+(vm.ph?" "+vm.ph(ph):"")+'>'+
        (isTop?TRI_TOP:TRI_BOT)+stackHTML(side,n,vm.sel===q&&n>0&&side===vm.turn)+'</div>';
    };
    var GAP='<i class="tw-gap" aria-hidden="true"></i>';      // الفاصل الرأسي: 6 شمال | 6 يمين
    var seqA=[],seqB=[],ph;                                    // A: 13→24 · B: 12→1
    for(ph=13;ph<=24;ph++)seqA.push(ph);
    for(ph=12;ph>=1;ph--)seqB.push(ph);
    var topSeq=view===B?seqA:seqB.slice().reverse(),botSeq=view===B?seqB:seqA.slice().reverse();
    var row=function(seq,isTop){
      var h="";
      seq.forEach(function(p,k){h+=cell(p,isTop);if(k===5)h+=GAP;});
      return '<div class="tw-row '+(isTop?"top":"bot")+'">'+h+'</div>';
    };
    var board='<div class="tw-field"><div class="tw-mandwrap" aria-hidden="true">'+MANDALA+MANDALA+'</div>'+
      row(topSeq,true)+'<div class="tw-mid" aria-hidden="true"></div>'+row(botSeq,false)+'</div>';

    /* الخارج بره اللوحة: نص لكل لاعب جنب الـHOME بتاعه */
    var topP=1-view,botP=view;
    var half=function(p){
      var n=g.s[p].off;
      var mine=vm.trayMine?vm.trayMine(p):false;
      return '<div class="tw-tray-half'+(mine&&vm.dst[OUT]!==undefined?" dest":"")+'" data-out="1" data-side="'+p+'"'+(vm.out?" "+vm.out(p):"")+'>'+
        (n>0?'<div class="tw-slot"><span class="tw-pc '+(p===W?"w":"b")+'"><em>'+n+'</em></span></div>':"")+'</div>';
    };
    return {board:board,tray:half(topP)+half(botP),trayLeft:(vm.tray==="l")!==(view===W)};
  }

  /* ---------- النرد ---------- */
  var rnd6=function(){return 1+Math.floor(Math.random()*6);};

  function dieHTML(v,used,toss,side,i){
    var st="";
    if(toss){
      var d=i%2?1:-1;                                          // كل نردة تيجي من ناحية
      st=' style="--fx:'+(d*(44+Math.floor(Math.random()*36)))+'px;--r0:'+(d*(380+Math.floor(Math.random()*340)))+'deg;--dl:'+(i*0.05)+'s"';
    }
    var h='<div class="tw-die'+(used?" used":"")+(toss?" toss":"")+(side===B?" bd":"")+'" data-v="'+(toss?rnd6():v)+'" role="img" aria-label="'+v+'"'+st+'>';
    for(var k=0;k<9;k++)h+='<i></i>';
    return h+'</div>';
  }

  /* vals = قيم النرد (دبل = 4) · o = { used:[bool], side | sides:[..], toss, vs } */
  function diceHTML(vals,o){
    o=o||{};
    var h="";
    vals.forEach(function(v,i){
      var side=o.sides?o.sides[i]:o.side;
      if(o.vs&&i===1)h+='<span class="tw-die-x">VS</span>';
      h+=dieHTML(v,o.used?o.used[i]:false,o.toss,side,i);
    });
    return h;
  }

  /* وشوش النرد بتتقلّب وهي بتتدحرج، وبعدين تثبت على القيمة النهائية */
  function flicker(el,finals,ms){
    var els=el.querySelectorAll(".tw-die"),t0=Date.now();
    var iv=setInterval(function(){
      if(!el.isConnected){clearInterval(iv);return;}
      var done=Date.now()-t0>=ms;
      for(var i=0;i<els.length;i++)els[i].setAttribute("data-v",done?finals[i]:rnd6());
      if(done)clearInterval(iv);
    },70);
    return iv;
  }

  root.TawlaUI={W:W,B:B,qOf:qOf,boardHTML:boardHTML,diceHTML:diceHTML,flicker:flicker,ICON_DIE:ICON_DIE,TOSS_MS:760};
})(typeof window!=="undefined"?window:globalThis);
