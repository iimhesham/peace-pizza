/* =========================================================
   LUDO — اللوحة (مشتركة مع الأونلاين) + اللعب الأوفلاين.
   القواعد كلها في ludo-engine.js. هنا بس العرض والتحكم.
   الأوفلاين: 2–4 لاعبين على جهاز واحد أو ضد الكمبيوتر
   (سهل / متوسط / صعب). كل حاجة بتتحفظ في المتصفح بس.
========================================================= */
(function(){
  "use strict";
  const E=window.LudoEngine;
  if(!E)return;
  const $=id=>document.getElementById(id);
  const NS="http://www.w3.org/2000/svg";
  const CNAME={red:"Red",green:"Green",yellow:"Yellow",blue:"Blue",violet:"Violet",pink:"Pink"};
  const reduce=()=>{try{return window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  /* =======================================================
     1) اللوحة (SVG) — بتتبني مرة وبعدين بتتحدّث بالـ position
  ======================================================= */
  function starPath(cx,cy,R,r){
    let d="";
    for(let i=0;i<10;i++){
      const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r:R;
      d+=(i?"L":"M")+(cx+Math.cos(a)*rad).toFixed(3)+" "+(cy+Math.sin(a)*rad).toFixed(3);
    }
    return d+"Z";
  }

  // زخرفة مندلا بسيطة (بتر على البيت) زي المراجع
function rosette(cx,cy,R,n){
  let d='<g class="lu-mand" transform="translate('+cx+' '+cy+')">';
  d+='<circle r="'+R+'" fill="none" stroke="var(--pc)" stroke-width=".07" stroke-dasharray=".05 .16" stroke-linecap="round"/>';
  for(let i=0;i<n;i++)d+='<ellipse cx="0" cy="'+(-R*.62)+'" rx="'+(R*.17)+'" ry="'+(R*.36)+'" transform="rotate('+(i*360/n)+')" fill="var(--pc)" opacity=".5"/>';
  for(let i=0;i<n;i++)d+='<ellipse cx="0" cy="'+(-R*.9)+'" rx="'+(R*.07)+'" ry="'+(R*.1)+'" transform="rotate('+(i*360/n+180/n)+')" fill="var(--pc)" opacity=".7"/>';
  d+='<circle r="'+(R*.3)+'" fill="none" stroke="var(--pc)" stroke-width=".08" opacity=".8"/></g>';
  return d;
}
function arrowPath(cx,cy,rot){
  return'<path class="lu-arrow" transform="rotate('+rot+' '+cx+' '+cy+')" d="M'+(cx-.28)+' '+(cy-.08)+'h.34v-.2l.34.28-.34.28v-.2h-.34z"/>';
}
/* ---------- لوحة الـ 6 لاعبين: الهندسة ----------
   6 أذرع (عرض 3 × طول 6 خانات) حوالين مسدس ضلعه 3، والبيوت دواير جوه الفجوات بين الأذرع.
   كل ذراع i اتجاهها زاوية 180+60i (مع عقارب الساعة). v=-1 حارة الطلوع، v=+1 حارة الرجوع، v=0 المسار النهائي. */
const GEO6=(function(){
  const A=3*Math.sqrt(3)/2,CX=9.8,CY=9.8,N=6,LEN=78,RING=E.COLORS6;
  const rad=d=>d*Math.PI/180,mod=(a,n)=>((a%n)+n)%n;
  const th=i=>180+60*i;
  function pt(i,r,v){                       // r: 0 = صف الطرف .. 5 = أقرب صف للمركز
    const t=rad(th(i)),u=A+(5.5-r);
    return[CX+Math.cos(t)*u-Math.sin(t)*v,CY+Math.sin(t)*u+Math.cos(t)*v];
  }
  const track=new Array(LEN);
  for(let i=0;i<N;i++){
    for(let r=5;r>=0;r--)track[mod(13*(i-1)+5+(5-r),LEN)]=pt(i,r,-1).concat(th(i));
    track[mod(13*(i-1)+11,LEN)]=pt(i,0,0).concat(th(i));
    for(let r=0;r<=5;r++)track[mod(13*(i-1)+12+r,LEN)]=pt(i,r,1).concat(th(i));
  }
  const fin={},yard={},bis={};
  RING.forEach((c,i)=>{
    fin[c]=[1,2,3,4,5].map(r=>pt(i,r,0).concat(th(i)));
    const b=rad(th(i)+30);bis[c]=b;
    yard[c]=[CX+Math.cos(b)*7.2,CY+Math.sin(b)*7.2];
  });
  function cell(c,p){                       // مكان خانة (0..76 رئيسي، 77..81 نهائي)
    if(p<=76)return track[(E.START6[c]+p)%LEN];
    return fin[c][p-77];
  }
  function spot(c,idx){const y=yard[c];return[y[0]+(idx%2?.8:-.8),y[1]+(idx>1?.8:-.8)];}
  function done(c,k){                       // القطع اللي وصلت: قدام المثلث بتاع اللون
    const i=RING.indexOf(c),t=rad(th(i)),off=(k-1.5)*.3;
    return[CX+Math.cos(t)*1.05-Math.sin(t)*off,CY+Math.sin(t)*1.05+Math.cos(t)*off];
  }
  return{A,CX,CY,RING,track,fin,yard,cell,spot,done,th,rad};
})();

function boardSVG6(active){
  const G=GEO6,on=c=>active.indexOf(c)>=0,f=n=>n.toFixed(3);
  let s='<svg viewBox="0 0 19.6 19.6" class="lu-svg" role="img" aria-label="Ludo board for six players" xmlns="'+NS+'">';
  s+='<rect class="lu-felt" x="0" y="0" width="19.6" height="19.6" rx=".6"/>';
  // البيوت (دواير)
  G.RING.forEach(c=>{
    const y=G.yard[c];
    s+='<g class="c-'+c+(on(c)?'':' lu-off')+'">';
    s+='<circle class="lu-yard" cx="'+f(y[0])+'" cy="'+f(y[1])+'" r="1.95" fill="var(--pc)"/>';
    s+='<circle class="lu-yard-in" cx="'+f(y[0])+'" cy="'+f(y[1])+'" r="1.7"/>';
    s+=rosette(y[0],y[1],1.5,12);
    for(let i=0;i<4;i++){const q=G.spot(c,i);s+='<circle class="lu-spot" cx="'+f(q[0])+'" cy="'+f(q[1])+'" r=".5"/>';}
    s+='</g>';
  });
  // المسار الرئيسي
  const startAt={};G.RING.forEach(c=>startAt[E.START6[c]]=c);
  G.track.forEach((q,i)=>{
    const sc=startAt[i],safe=E.isSafeCell(i,6);
    s+='<g'+(sc?' class="c-'+sc+(on(sc)?'':' lu-off')+'"':'')+'>';
    s+='<rect class="lu-cell'+(sc?' is-start':safe?' is-safe':'')+'" x="-.47" y="-.47" width=".94" height=".94" rx=".12" transform="translate('+f(q[0])+' '+f(q[1])+') rotate('+q[2]+')"/>';
    if(sc)s+=arrowPath(q[0],q[1],(q[2]+180)%360);
    else if(safe)s+='<path class="lu-star" transform="translate('+f(q[0])+' '+f(q[1])+')" d="'+starPath(0,0,.3,.13)+'"/>';
    s+='</g>';
  });
  // المسارات النهائية
  G.RING.forEach(c=>{
    s+='<g class="c-'+c+(on(c)?'':' lu-off')+'">';
    G.fin[c].forEach(q=>{s+='<rect class="lu-cell is-final" x="-.47" y="-.47" width=".94" height=".94" rx=".12" transform="translate('+f(q[0])+' '+f(q[1])+') rotate('+q[2]+')"/><path class="lu-dia" transform="translate('+f(q[0])+' '+f(q[1])+')" d="M0 -.23l.23 .23-.23 .23-.23-.23z"/>';});
    s+='</g>';
  });
  // المركز: مسدس بـ 6 مثلثات
  const V=a=>[G.CX+Math.cos(G.rad(a))*3,G.CY+Math.sin(G.rad(a))*3];
  G.RING.forEach((c,i)=>{
    const a=V(G.th(i)-30),b=V(G.th(i)+30);
    s+='<polygon class="lu-tri c-'+c+(on(c)?'':' lu-off')+'" points="'+f(G.CX)+','+f(G.CY)+' '+f(a[0])+','+f(a[1])+' '+f(b[0])+','+f(b[1])+'"/>';
  });
  s+='<circle class="lu-hub" cx="'+G.CX+'" cy="'+G.CY+'" r=".5"/><text class="lu-hubt" x="'+G.CX+'" y="'+(G.CY+.12)+'" text-anchor="middle">LUDO</text>';
  s+='<g class="lu-layer"></g></svg>';
  return s;
}

function boardSVG(active,mode){
    if(mode===6)return boardSVG6(active);
    const on=c=>active.indexOf(c)>=0;
    let s='<svg viewBox="0 0 15 15" class="lu-svg" role="img" aria-label="Ludo board" xmlns="'+NS+'">';
    s+='<rect class="lu-felt" x="0" y="0" width="15" height="15" rx=".5"/>';
    // البيوت (Yards)
    for(const c of E.COLORS){
      const [r0,c0]=E.YARD_ORIGIN[c];
      s+='<g class="c-'+c+(on(c)?'':' lu-off')+'">';
      s+='<rect class="lu-yard" x="'+c0+'" y="'+r0+'" width="6" height="6" fill="var(--pc)"/>';
      s+='<rect class="lu-yard-in" x="'+(c0+1)+'" y="'+(r0+1)+'" width="4" height="4" rx=".6"/>';
      s+=rosette(c0+3,r0+3,1.72,12);
      [[2,2],[4,2],[2,4],[4,4]].forEach(p=>{s+='<circle class="lu-spot" cx="'+(c0+p[0])+'" cy="'+(r0+p[1])+'" r=".62"/>';});
      s+='</g>';
    }
    // المسار الرئيسي
    const startAt={};E.COLORS.forEach(c=>startAt[E.START[c]]=c);
    E.TRACK.forEach((p,i)=>{
      const sc=startAt[i];
      s+='<g'+(sc?' class="c-'+sc+(on(sc)?'':' lu-off')+'"':'')+'>';
      s+='<rect class="lu-cell'+(sc?' is-start':E.isSafeCell(i)?' is-safe':'')+'" x="'+(p[1]+.03)+'" y="'+(p[0]+.03)+'" width=".94" height=".94" rx=".12"/>';
      if(sc)s+=arrowPath(p[1]+.5,p[0]+.5,{red:0,green:90,yellow:180,blue:270}[sc]);
      else if(E.isSafeCell(i))s+='<path class="lu-star" d="'+starPath(p[1]+.5,p[0]+.5,.3,.13)+'"/>';
      s+='</g>';
    });
    // المسارات النهائية
    for(const c of E.COLORS){
      s+='<g class="c-'+c+(on(c)?'':' lu-off')+'">';
      E.FINAL_PATH[c].forEach(p=>{s+='<rect class="lu-cell is-final" x="'+(p[1]+.03)+'" y="'+(p[0]+.03)+'" width=".94" height=".94" rx=".12"/><path class="lu-dia" d="M'+(p[1]+.5)+' '+(p[0]+.27)+'l.23 .23-.23 .23-.23-.23z"/>';});
      s+='</g>';
    }
    // المركز: 4 مثلثات
    const tri={red:"6,6 6,9 7.5,7.5",green:"6,6 9,6 7.5,7.5",yellow:"9,6 9,9 7.5,7.5",blue:"6,9 9,9 7.5,7.5"};
    for(const c of E.COLORS)s+='<polygon class="lu-tri c-'+c+(on(c)?'':' lu-off')+'" points="'+tri[c]+'"/>';
    s+='<circle class="lu-hub" cx="7.5" cy="7.5" r=".5"/><text class="lu-hubt" x="7.5" y="7.62" text-anchor="middle">LUDO</text>';
    s+='<g class="lu-layer"></g></svg>';
    return s;
  }

  // مكان مرئي لكل position
  function yardXY(color,idx){
    const o=E.YARD_ORIGIN[color],dx=idx%2?4:2,dy=idx>1?4:2;
    return[o[1]+dx,o[0]+dy];
  }
  const FIN_BASE={red:[6.78,7.5,0,1],green:[7.5,6.78,1,0],yellow:[8.22,7.5,0,1],blue:[7.5,8.22,1,0]};
  function finXY(color,k){
    const b=FIN_BASE[color],off=(k-1.5)*.3;
    return[b[0]+b[2]*off,b[1]+b[3]*off];
  }

  function makeBoard(host,active,mode){
    mode=mode===6?6:4;
    const LYO=E.LY(mode);
    host.innerHTML=boardSVG(active,mode);
    const svg=host.querySelector("svg"),layer=svg.querySelector(".lu-layer");
    const tokens={},disp={},colorOf={},idxOf={};
    let pick=null;

    active.forEach(c=>{
      for(let i=0;i<4;i++){
        const id=c+"-"+(i+1);
        const g=document.createElementNS(NS,"g");
        g.setAttribute("class","lu-tk c-"+c);g.dataset.id=id;
        g.innerHTML='<circle class="lu-tk-hit" r=".62"/><ellipse class="lu-tk-sh" cx="0" cy=".26" rx=".36" ry=".2"/>'+
          '<circle class="lu-tk-b" r=".36"/><circle class="lu-tk-i" r=".17" cy="-.04"/><circle class="lu-tk-ring" r=".5"/>';
        layer.appendChild(g);
        tokens[id]=g;disp[id]=-1;colorOf[id]=c;idxOf[id]=i;
      }
    });

    svg.addEventListener("click",e=>{
      const t=e.target.closest(".lu-tk.is-valid");
      if(t&&pick)pick(t.dataset.id);
    });

    function layout(){
      const groups={};
      for(const id in disp){
        const c=colorOf[id],p=disp[id];
        let key;
        if(p<0)key="y-"+id;
        else if(p>=LYO.fin)key="f-"+c;
        else if(p<=LYO.last)key="m-"+E.absCell(c,p,mode);
        else key="n-"+c+"-"+p;
        (groups[key]=groups[key]||[]).push(id);
      }
      const O2=[[-.19,-.06],[.19,.06]],O4=[[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]];
      for(const key in groups){
        const ids=groups[key],n=ids.length;
        ids.forEach((id,k)=>{
          const c=colorOf[id],p=disp[id];
          let xy,sc=1;
          if(p<0){xy=mode===6?GEO6.spot(c,idxOf[id]):yardXY(c,idxOf[id]);}
          else if(p>=LYO.fin){xy=mode===6?GEO6.done(c,k):finXY(c,k);sc=.52;}
          else{
            if(mode===6){const q=GEO6.cell(c,p);xy=[q[0],q[1]];}
            else{const cell=E.cellOf(c,p);xy=[cell[1]+.5,cell[0]+.5];}
            if(n>1){const o=(n===2?O2:O4)[k%4];xy=[xy[0]+o[0],xy[1]+o[1]];sc=n===2?.76:.62;}
          }
          tokens[id].style.transform="translate("+xy[0].toFixed(3)+"px,"+xy[1].toFixed(3)+"px) scale("+sc+")";
        });
      }
    }

    function render(g){
      for(const p of g.players)for(const t of p.tokens)if(t.id in disp)disp[t.id]=t.position;
      layout();
    }

    function setValid(ids,fn){
      pick=fn||null;
      for(const id in tokens)tokens[id].classList.toggle("is-valid",!!ids&&ids.indexOf(id)>=0);
    }

    // حركة خطوة خطوة (من الـ position الحالي للمعروض لحد الجديد)
    async function animateMove(id,toPos,stepMs){
      const from=disp[id];
      layer.appendChild(tokens[id]);
      if(reduce()||from<0||toPos<=from){disp[id]=toPos;layout();await sleep(reduce()?0:160);return;}
      for(let p=from+1;p<=toPos;p++){disp[id]=p;layout();await sleep(stepMs||125);}
      await sleep(70);
    }
    async function flyHome(ids){
      if(!ids||!ids.length)return;
      ids.forEach(id=>{tokens[id].classList.add("is-hit");tokens[id].classList.add("is-fly");});
      await sleep(reduce()?0:260);
      ids.forEach(id=>{disp[id]=-1;});
      layout();
      await sleep(reduce()?0:430);
      ids.forEach(id=>{tokens[id].classList.remove("is-hit");tokens[id].classList.remove("is-fly");});
    }
    return{svg,render,setValid,animateMove,flyHome,layout,tokens};
  }

  /* =======================================================
     2) النرد
  ======================================================= */
  /* نرد: "real" = مكعب 3D بيتقلّب ويقف على الرقم، "flat" = مسطّح بسيط.
     نفس الدوال بتشتغل لأي عدد نردات (طاولة هتستخدمها مرتين: dieEl لكل نرد). */
  const ORI={1:"",2:"rotateX(-90deg)",3:"rotateY(-90deg)",4:"rotateY(90deg)",5:"rotateX(90deg)",6:"rotateY(180deg)"};
  function dieStyle(){try{return localStorage.getItem("ludoDiceStyle")==="flat"?"flat":"real";}catch(e){return"real";}}
  function dieEl(el){
    el.classList.remove("lu-die","lu-die3","is-empty","rolling","is-faded");
    el._rolling=false;el._v=0;
    if(dieStyle()==="real"){
      el.classList.add("lu-die3","is-faded");
      let f="";for(let v=1;v<=6;v++)f+='<div class="lu-face" data-v="'+v+'">'+"<i></i>".repeat(9)+"</div>";
      el.innerHTML='<div class="lu-toss"><div class="lu-cube">'+f+'</div></div>';
      el._cube=el.querySelector(".lu-cube");el._toss=el.querySelector(".lu-toss");
      el._cube.style.transform=ORI[1];
    }else{
      el.classList.add("lu-die","is-empty");el.innerHTML="<i></i>".repeat(9);el._cube=null;el.dataset.v="0";
    }
  }
  function setDie(el,v,faded){
    if(el._rolling)return;
    el._v=v||0;
    if(el._cube){
      if(v){el._cube.style.transition="none";el._cube.style.transform=ORI[v];}
      el.classList.toggle("is-faded",!!faded||!v);
    }else{
      el.dataset.v=String(v||0);el.classList.toggle("is-empty",!v||!!faded);
    }
  }
  async function rollAnim(el,final,ms){
    if(reduce()){setDie(el,final);return;}
    if(!el._cube){
      el.classList.add("rolling");el.classList.remove("is-empty");
      const t0=Date.now();
      while(Date.now()-t0<(ms||620)){el.dataset.v=String(1+Math.floor(Math.random()*6));await sleep(75);}
      el.classList.remove("rolling");setDie(el,final);return;
    }
    ms=Math.max(ms||0,900);
    el._rolling=true;
    const cube=el._cube,toss=el._toss;
    el.classList.remove("is-faded");
    const spin=()=>360*(1+Math.floor(Math.random()*3))*(Math.random()<.5?-1:1);
    cube.style.transition="none";
    cube.style.transform="rotateX("+Math.floor(Math.random()*360)+"deg) rotateY("+Math.floor(Math.random()*360)+"deg)";
    void cube.offsetWidth;
    cube.style.transition="transform "+ms+"ms cubic-bezier(.15,.7,.25,1)";
    cube.style.transform="rotateX("+spin()+"deg) rotateY("+spin()+"deg) "+ORI[final];
    toss.classList.remove("tossing");void toss.offsetWidth;
    toss.style.animationDuration=ms+"ms";toss.classList.add("tossing");
    await sleep(ms+50);
    toss.classList.remove("tossing");
    cube.style.transition="none";cube.style.transform=ORI[final];
    el._rolling=false;el._v=final;
  }

  /* ترتيب الألوان حسب عدد اللاعبين في الأونلاين */
  const SEAT_LAYOUT={2:["red","yellow"],3:["red","green","yellow"],4:["red","green","yellow","blue"]};
  /* لوحة الـ 6: الأماكن موزّعة بالتساوي حوالين المسدس (ترتيب الأذرع: أحمر · أخضر · بنفسجي · أصفر · أزرق · وردي) */
  const SEAT_LAYOUT6={2:["red","yellow"],3:["red","violet","blue"],4:["red","green","yellow","blue"],5:["red","green","violet","yellow","blue"],6:["red","green","violet","yellow","blue","pink"]};

  /* Auto roll: تفضيل واحد مشترك (أوفلاين + أونلاين) بيتحفظ على الجهاز بس */
  const KEY_AUTO="ludoAutoRoll";
  let autoRoll=false;
  try{autoRoll=localStorage.getItem(KEY_AUTO)==="1";}catch(e){}
  const autoGet=()=>autoRoll;
  function autoSet(v){autoRoll=!!v;try{localStorage.setItem(KEY_AUTO,autoRoll?"1":"0");}catch(e){}return autoRoll;}
  function autoPaint(btn){
    if(!btn)return;
    btn.classList.toggle("is-on",autoRoll);
    btn.setAttribute("aria-pressed",autoRoll?"true":"false");
    btn.title=autoRoll?"Auto roll: on":"Auto roll: off";
  }

  window.LudoUI={makeBoard,dieEl,setDie,rollAnim,CNAME,SEAT_LAYOUT,SEAT_LAYOUT6,sleep,reduce,autoGet,autoSet,autoPaint};

  /* =======================================================
     3) اللعب الأوفلاين
  ======================================================= */
  const root=$("ludo");
  if(!root)return;

  const KEY_SET="ludoSettings",KEY_SAVE="ludoSave",KEY_STATS="ludoStats",KEY_ACH="ludoAch",KEY_MUTE="ludoMute";
  const TYPES=["human","easy","mid","hard","off"];
  const TLABEL={human:"Player",easy:"Easy AI",mid:"Medium AI",hard:"Hard AI",off:"Off"};

  const DEF={
    seats:{red:{t:"human",n:""},green:{t:"off",n:""},yellow:{t:"mid",n:""},blue:{t:"off",n:""}},
    three:true,full:false,auto:true,timer:0,speed:"normal",dice:"real"
  };
  let cfg=JSON.parse(JSON.stringify(DEF));
  let G=null,board=null,A=null;       // G=game  A=active colors
  let busy=false,gen=0,elapsed=0,tick=null,tt=null,ttLeft=0,startedAt=0,humanColor=null;
  let muted=false,lastDie=0;
  const SP={fast:.55,normal:1,slow:1.7};
  const sp=()=>SP[cfg.speed]||1;

  const lsGet=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?d:v;}catch(e){return d;}};
  const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};

  function loadSettings(){
    const j=lsGet(KEY_SET,null);
    if(j&&j.seats){
      for(const c of E.COLORS){
        const s=j.seats[c];
        if(s&&TYPES.indexOf(s.t)>=0)cfg.seats[c]={t:s.t,n:String(s.n||"").slice(0,12)};
      }
      cfg.three=j.three!==false;cfg.full=!!j.full;cfg.auto=j.auto!==false;
      cfg.timer=[0,15,30].indexOf(j.timer)>=0?j.timer:0;
      cfg.speed=["fast","normal","slow"].indexOf(j.speed)>=0?j.speed:"normal";
    }
    try{cfg.dice=localStorage.getItem("ludoDiceStyle")==="flat"?"flat":"real";}catch(e){cfg.dice="real";}
    muted=!!lsGet(KEY_MUTE,false);
  }
  const saveSettings=()=>lsSet(KEY_SET,cfg);

  const activeSeats=()=>E.COLORS.filter(c=>cfg.seats[c].t!=="off");
  const nameOf=(p)=>p.name||CNAME[p.color];

  function sfx(kind){
    if(muted)return;
    try{
      if(kind==="win"||kind==="capture"){if(typeof playRevealSound==="function")playRevealSound();}
      else if(typeof playClickSound==="function")playClickSound();
    }catch(e){}
  }

  /* ---------- شاشة الإعدادات ---------- */
  function seatRows(){
    const host=$("luSeats");
    if(!host.children.length){
      E.COLORS.forEach(c=>{
        const d=document.createElement("div");
        d.className="lu-seat c-"+c;d.dataset.c=c;
        d.innerHTML='<span class="lu-dot"></span><input class="lu-nm" maxlength="12" autocomplete="off" aria-label="'+CNAME[c]+' name"><button type="button" class="lu-cyc"></button>';
        host.appendChild(d);
      });
      host.addEventListener("click",e=>{
        const b=e.target.closest(".lu-cyc");if(!b)return;
        const c=b.parentNode.dataset.c;captureNames();
        let i=TYPES.indexOf(cfg.seats[c].t);
        for(let k=0;k<TYPES.length;k++){
          i=(i+1)%TYPES.length;
          const t=TYPES[i];
          if(t==="off"){
            const left=activeSeats().filter(x=>x!==c).length;
            if(left<2)continue;
          }
          cfg.seats[c].t=t;break;
        }
        playClick();syncSetup();
      });
    }
  }
  function playClick(){sfx("click");}
  function captureNames(){
    root.querySelectorAll("#luSeats .lu-seat").forEach(r=>{
      const c=r.dataset.c;cfg.seats[c].n=r.querySelector(".lu-nm").value.slice(0,12);
    });
  }
  function syncSetup(){
    root.querySelectorAll("#luSeats .lu-seat").forEach(r=>{
      const c=r.dataset.c,s=cfg.seats[c],inp=r.querySelector(".lu-nm");
      r.classList.toggle("is-off",s.t==="off");
      r.querySelector(".lu-cyc").textContent=TLABEL[s.t];
      const human=s.t==="human";
      inp.disabled=!human;
      inp.value=human?s.n:"";
      inp.placeholder=human?CNAME[c]+" player":(s.t==="off"?"—":"Computer");
    });
    $("luSw3").classList.toggle("on",cfg.three);
    $("luSwFull").classList.toggle("on",cfg.full);
    $("luSwAuto").classList.toggle("on",cfg.auto);
    root.querySelectorAll("#luTimerSeg button").forEach(b=>b.classList.toggle("is-on",+b.dataset.v===cfg.timer));
    root.querySelectorAll("#luSpeedSeg button").forEach(b=>b.classList.toggle("is-on",b.dataset.v===cfg.speed));
    root.querySelectorAll("#luDiceSeg button").forEach(b=>b.classList.toggle("is-on",b.dataset.v===cfg.dice));
    const sv=lsGet(KEY_SAVE,null),ok=savedOk(sv);
    $("luResume").classList.toggle("hidden",!ok);
    if(ok){
      const names=sv.g.players.map(p=>p.name||CNAME[p.color]).join(" · ");
      $("luResumeTxt").textContent=names+" · "+fmtTime(sv.elapsed||0);
    }
  }
  function preset(k){
    captureNames();
    const keep=n=>E.COLORS.forEach(c=>{cfg.seats[c].t="off";});
    keep();
    if(k==="cpu"){cfg.seats.red.t="human";cfg.seats.yellow.t="mid";}
    else if(k==="two"){cfg.seats.red.t="human";cfg.seats.yellow.t="human";}
    else{E.COLORS.forEach(c=>{cfg.seats[c].t="human";});}
    playClick();syncSetup();
  }

  function showView(w){
    $("luSetup").classList.toggle("hidden",w!=="setup");
    $("luPlay").classList.toggle("hidden",w!=="play");
    $("luStats").classList.toggle("hidden",w!=="stats");
    $("luGear").classList.toggle("is-off",w!=="play");
    $("luFinal").classList.add("hidden");$("luQuit").classList.add("hidden");
  }
  const isOpen=()=>!root.classList.contains("hidden");

  /* ---------- حفظ / استرجاع المباراة ---------- */
  function savedOk(sv){
    return!!(sv&&sv.v===1&&sv.g&&Array.isArray(sv.g.players)&&sv.g.players.length>=2&&sv.g.phase!=="over");
  }
  function saveGame(){
    if(!G||G.phase==="over")return;
    lsSet(KEY_SAVE,{v:1,g:G,elapsed:elapsed,human:humanColor,t:Date.now()});
  }
  const clearSave=()=>{try{localStorage.removeItem(KEY_SAVE);}catch(e){}};

  /* ---------- بدء مباراة جديدة ---------- */
  function newGame(){
    const seats=activeSeats();
    if(seats.length<2){toast_("Pick at least two seats");return false;}
    if(!seats.some(c=>cfg.seats[c].t==="human")){toast_("Add at least one human player");return false;}
    const players=seats.map(c=>{
      const s=cfg.seats[c];
      return{color:c,type:s.t==="human"?"human":"ai",level:s.t==="human"?"mid":s.t,
        name:s.t==="human"?(s.n.trim()||CNAME[c]):"CPU "+CNAME[c]};
    });
    const first=Math.floor(Math.random()*players.length);
    G=E.initializeGame(players,{threeSixes:cfg.three,fullRanking:cfg.full},first);
    G.settings={auto:cfg.auto,timer:cfg.timer};
    humanColor=seats.find(c=>cfg.seats[c].t==="human");
    elapsed=0;lastDie=0;
    return true;
  }
  function toast_(m){try{toast(m);}catch(e){}}

  function enterPlay(){
    gen++;
    A=G.players.map(p=>p.color);
    showView("play");
    board=makeBoard($("luBoard"),A);
    $("luStrip").style.setProperty("--n",A.length);
    dieEl($("luDie"));
    board.render(G);
    $("luMute").textContent=muted?"Sound: off":"Sound: on";
    startClock();
    render();
    drive();
  }

  /* ---------- الساعة والمؤقتات ---------- */
  const fmtTime=s=>{s=Math.max(0,s|0);return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");};
  function startClock(){
    clearInterval(tick);startedAt=Date.now()-elapsed*1000;
    tick=setInterval(()=>{
      if(!isOpen()||!G||G.phase==="over")return;
      elapsed=Math.floor((Date.now()-startedAt)/1000);
      const el=$("luClock");if(el)el.textContent=fmtTime(elapsed);
    },1000);
  }
  function stopTurnTimer(){clearInterval(tt);tt=null;const el=$("luTT");if(el){el.textContent="";el.classList.remove("low");}}
  function startTurnTimer(){
    stopTurnTimer();
    const n=G.settings&&G.settings.timer;
    if(!n||G.phase==="over"||E.cur(G).type!=="human")return;
    ttLeft=n;showTT();const my=gen;
    tt=setInterval(()=>{
      if(my!==gen||!isOpen()){stopTurnTimer();return;}
      if(busy)return;
      ttLeft--;showTT();
      if(ttLeft<=0){stopTurnTimer();timeout();}
    },1000);
  }
  function showTT(){const el=$("luTT");if(!el)return;el.textContent="⏱ "+ttLeft+"s";el.classList.toggle("low",ttLeft<=5);}
  function timeout(){
    if(!G||G.phase==="over")return;
    board.setValid(null);
    const p=E.cur(G);
    G.last={type:"timeout",color:p.color};
    toast_("Time's up — "+nameOf(p)+" loses the turn");
    E.nextTurn(G);
    saveGame();render();drive();
  }

  /* ---------- العرض ---------- */
  function render(){
    if(!G)return;
    const cp=E.cur(G),over=G.phase==="over";
    // شريط اللاعبين
    const strip=$("luStrip");strip.innerHTML="";
    G.players.forEach(p=>{
      const d=document.createElement("div");
      d.className="lu-pc c-"+p.color+(!over&&p===cp?" is-turn":"")+(p.finishedTokens>=4?" is-done":"");
      const rk=G.ranking.indexOf(p.color);
      d.innerHTML='<span class="lu-dot"></span><b></b><span class="lu-pips">'+[0,1,2,3].map(i=>"<s"+(i<p.finishedTokens?' class="on"':"")+"></s>").join("")+"</span>"+(rk>=0&&G.opts.fullRanking?'<span class="lu-rk">#'+(rk+1)+"</span>":"");
      d.querySelector("b").textContent=nameOf(p);
      strip.appendChild(d);
    });
    // اللون الحالي على كل الواجهة
    const ctl=$("luCtl");
    autoPaint($("luAuto"));
    E.COLORS6.forEach(c=>ctl.classList.remove("c-"+c));
    if(!over)ctl.classList.add("c-"+cp.color);
    setDie($("luDie"),G.diceValue||lastDie,!G.diceValue);

    const roll=$("luRoll"),human=cp.type==="human";
    const canRoll=!over&&human&&G.phase==="roll"&&!busy;
    roll.disabled=!canRoll;roll.classList.toggle("is-go",canRoll);
    roll.textContent=canRoll?"Roll Dice":(over?"Game over":(human?(G.phase==="move"?"Pick a piece":"..."):"CPU is playing..."));
    $("luStatus").innerHTML=statusHTML(cp);
    $("luMeta").textContent=(G.opts.threeSixes?"3 sixes cancel":"No 6-limit")+" · Turn "+G.turnNo;
    $("luClock").textContent=fmtTime(elapsed);
    if(G.phase==="move"&&human&&!busy)board.setValid(G.valid.map(m=>m.tokenId),onPick);
    else board.setValid(null);
  }

  function esc(s){return String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));}
  function statusHTML(cp){
    const nm='<b>'+esc(nameOf(cp))+'</b>',l=G.last;
    if(G.phase==="over"){const w=E.playerOf(G,G.winner);return"<b>"+esc(nameOf(w))+"</b> wins!";}
    let pre="";
    if(l&&l.type==="cancel")pre="Three sixes — turn cancelled. ";
    else if(l&&l.type==="nomove")pre="No move for "+l.dice+". ";
    else if(l&&l.type==="timeout")pre="Time ran out. ";
    else if(l&&l.type==="move"&&l.captured&&l.captured.length)pre="Captured! ";
    if(cp.type==="ai")return G.phase==="move"?pre+nm+" rolled <b>"+G.diceValue+"</b>":pre+nm+" is rolling...";
    if(G.phase==="roll"){
      const humans=G.players.filter(p=>p.type==="human").length;
      return pre+nm+(G.consecutiveSixes?" — rolled a 6, roll again":(humans>1?" — your turn":" — roll the dice"));
    }
    return pre+nm+" — tap a glowing piece";
  }

  /* ---------- سير الدور ---------- */
  function drive(){
    if(!G||!isOpen())return;
    if(G.phase==="over"){finish();return;}
    const my=gen,cp=E.cur(G);
    startTurnTimer();
    if(cp.type==="ai"){
      busy=true;render();
      setTimeout(()=>{if(my===gen&&isOpen())doRoll();},reduce()?150:Math.round(850*sp()));
    }else{
      busy=false;render();
      if(G.phase==="move")autoPickIfSingle(my);
      else scheduleAutoRoll(my);
    }
  }

  /* Auto roll: لو مفعّل، دور أي لاعب (إنسان) بيترمي النرد لوحده بعد لحظة */
  function scheduleAutoRoll(my){
    if(!autoRoll||!G||G.phase!=="roll")return;
    setTimeout(()=>{
      if(my!==gen||!isOpen()||!autoRoll||busy||!G||G.phase!=="roll")return;
      if($("luPlay").classList.contains("hidden")||E.cur(G).type!=="human")return;
      doRoll();
    },reduce()?150:650);
  }

  function autoPickIfSingle(my){
    if(!G.settings.auto||G.phase!=="move")return;
    const v=G.valid;
    const same=v.length>0&&v.every(m=>m.exit);          // كل الحركات "إخراج" = نفس التأثير
    if(v.length===1||same){
      busy=true;board.setValid(null);
      setTimeout(()=>{if(my===gen&&isOpen())doMove(v[0].tokenId);},reduce()?100:420);
    }
  }

  async function doRoll(){
    if(!G||G.phase!=="roll")return;
    const my=gen;
    busy=true;stopTurnTimer();render();
    sfx("click");
    const dice=E.rollDice();
    await rollAnim($("luDie"),dice,950);
    lastDie=dice;
    if(my!==gen||!isOpen())return;
    const cp0=E.cur(G);
    const res=E.applyRoll(G,dice);
    saveGame();
    if(res.cancelled||res.noMove){
      render();
      sfx("click");
      await sleep(reduce()?100:Math.round(1100*(cp0.type==="ai"?sp():1)));
      if(my!==gen||!isOpen())return;
      busy=false;drive();return;
    }
    // في حركات
    const cp=E.cur(G);
    if(cp.type==="ai"){
      render();
      await sleep(reduce()?100:Math.round(850*sp()));
      if(my!==gen||!isOpen())return;
      const m=E.chooseAIMove(G,cp.level);
      board.setValid([m.tokenId],null);          // بنبرز القطعة اللي الكمبيوتر اختارها
      await sleep(reduce()?60:Math.round(550*sp()));
      if(my!==gen||!isOpen())return;
      doMove(m.tokenId);
    }else{
      busy=false;render();
      startTurnTimer();
      autoPickIfSingle(my);
    }
  }

  function onPick(id){
    if(busy||!G||G.phase!=="move"||E.cur(G).type!=="human")return;
    doMove(id);
  }

  async function doMove(id){
    if(!G||G.phase!=="move")return;
    const my=gen;
    busy=true;stopTurnTimer();board.setValid(null);
    const cp=E.cur(G);
    const res=E.moveToken(G,id,G.diceValue);
    if(!res.ok){busy=false;render();return;}
    sfx("click");
    await board.animateMove(id,res.to,cp.type==="ai"?Math.round(125*Math.max(.9,sp())):125);
    if(my!==gen)return;
    if(res.captured.length){sfx("capture");await board.flyHome(res.captured);if(my!==gen)return;}
    if(res.finished)sfx("capture");
    board.render(G);
    saveGame();
    if(res.over){busy=false;render();setTimeout(()=>{if(my===gen)finish();},reduce()?100:700);return;}
    busy=false;render();
    if(res.again&&cp.type==="human")toast_(res.bonusCapture?"Capture! Roll again":res.bonusFinish?"Piece home! Roll again":"Six! Roll again");
    drive();
  }

  /* ---------- نهاية المباراة ---------- */
  function finish(){
    if(!G||G.phase!=="over"||!isOpen())return;
    stopTurnTimer();clearInterval(tick);clearSave();
    const f=$("luFinal"),w=E.playerOf(G,G.winner);
    if(!f.classList.contains("hidden"))return;
    recordStats();
    sfx("win");
    $("luWinCard").className="lu-final-card c-"+G.winner;
    $("luWinTitle").textContent=nameOf(w)+" wins!";
    $("luWinSub").textContent="Match time "+fmtTime(elapsed);
    const medals=["1","2","3","4"];
    $("luRank").innerHTML=G.ranking.map((c,i)=>{
      const p=E.playerOf(G,c);
      return'<div class="c-'+c+'"><em>'+medals[i]+'</em><b>'+esc(nameOf(p))+'</b><small>'+p.finishedTokens+'/4 home · '+p.captures+' captures</small></div>';
    }).join("");
    f.classList.remove("hidden");
    $("luAgain").focus({preventScroll:true});
  }

  /* ---------- إحصائيات وإنجازات (للاعب الإنسان الأول) ---------- */
  const ACH=[
    {k:"first",n:"First Win",d:"Win your first game",f:(s)=>s.wins>=1},
    {k:"w5",n:"Regular Winner",d:"Win 5 games",f:(s)=>s.wins>=5},
    {k:"w10",n:"Ludo Master",d:"Win 10 games",f:(s)=>s.wins>=10},
    {k:"cap1",n:"First Capture",d:"Capture a piece",f:(s)=>s.captures>=1},
    {k:"cap2",n:"Double Trouble",d:"Capture 2+ pieces in one match",f:(s,m)=>m&&m.captures>=2||s.flags.cap2},
    {k:"clean",n:"Untouched",d:"Win without losing a piece",f:(s,m)=>m&&m.win&&m.lost===0||s.flags.clean},
    {k:"hard",n:"Giant Slayer",d:"Beat a Hard AI",f:(s,m)=>m&&m.win&&m.hard||s.flags.hard},
    {k:"streak",n:"On Fire",d:"Win 3 games in a row",f:(s)=>s.bestStreak>=3}
  ];
  const defStats=()=>({games:0,wins:0,losses:0,captures:0,finished:0,rolls:0,sixes:0,best:null,streak:0,bestStreak:0,flags:{}});
  function recordStats(){
    if(G.statsDone)return;G.statsDone=true;
    const hc=humanColor&&E.playerOf(G,humanColor);if(!hc)return;
    const s=Object.assign(defStats(),lsGet(KEY_STATS,{}));s.flags=s.flags||{};
    const win=G.winner===hc.color,m={win,captures:hc.captures,lost:hc.lost,hard:G.players.some(p=>p.type==="ai"&&p.level==="hard")};
    s.games++;if(win){s.wins++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak);if(s.best==null||elapsed<s.best)s.best=elapsed;}
    else{s.losses++;s.streak=0;}
    s.captures+=hc.captures;s.finished+=hc.finishedTokens;s.rolls+=hc.rolls;s.sixes+=hc.sixes;
    if(hc.captures>=2)s.flags.cap2=1;if(win&&hc.lost===0)s.flags.clean=1;if(win&&m.hard)s.flags.hard=1;
    const had=lsGet(KEY_ACH,{}),now=Object.assign({},had),fresh=[];
    ACH.forEach(a=>{if(!now[a.k]&&a.f(s,m)){now[a.k]=1;fresh.push(a.n);}});
    lsSet(KEY_STATS,s);lsSet(KEY_ACH,now);
    if(fresh.length)setTimeout(()=>toast_("Achievement: "+fresh.join(", ")),1400);
  }
  function renderStats(){
    const s=Object.assign(defStats(),lsGet(KEY_STATS,{})),got=lsGet(KEY_ACH,{});
    const rate=s.games?Math.round(s.wins/s.games*100):0;
    $("luKpis").innerHTML=[["Games",s.games],["Wins",s.wins],["Win rate",rate+"%"],["Captures",s.captures],["Pieces home",s.finished],["Best win",s.best==null?"—":fmtTime(s.best)],["Dice rolls",s.rolls],["Sixes",s.sixes],["Best streak",s.bestStreak]]
      .map(a=>"<div><b>"+a[1]+"</b><small>"+a[0]+"</small></div>").join("");
    $("luAchs").innerHTML=ACH.map(a=>'<div class="lu-ach'+(got[a.k]?" on":"")+'"><i>'+(got[a.k]?"✓":"•")+"</i><span><b>"+a.n+"</b><small>"+a.d+"</small></span></div>").join("");
  }

  /* =======================================================
     4) واجهة الصفحة (أزرار)
  ======================================================= */
  window.ludoOpen=function(){
    loadSettings();seatRows();
    gen++;busy=false;stopTurnTimer();clearInterval(tick);
    syncSetup();showView("setup");
    show("ludo");
  };
  window.ludoHome=function(){
    sfx("click");
    if(G&&G.phase!=="over"&&!$("luPlay").classList.contains("hidden")){saveGame();}
    gen++;busy=false;stopTurnTimer();clearInterval(tick);
    show("hub");
  };
  window.ludoBack=function(){
    if(!$("luPlay").classList.contains("hidden")&&G&&G.phase!=="over"){sfx("click");$("luQuit").classList.remove("hidden");return;}
    if(!$("luStats").classList.contains("hidden")){sfx("click");ludoShowSetup(true);return;}
    ludoHome();
  };
  window.ludoShowSetup=function(keep){
    sfx("click");
    gen++;busy=false;stopTurnTimer();clearInterval(tick);
    if(G&&G.phase!=="over"&&!keep)saveGame();
    syncSetup();showView("setup");
  };
  window.ludoStart=function(){
    sfx("click");captureNames();saveSettings();
    if(!newGame())return;
    clearSave();enterPlay();
  };
  window.ludoResume=function(){
    sfx("click");
    const sv=lsGet(KEY_SAVE,null);if(!savedOk(sv)){clearSave();syncSetup();return;}
    G=sv.g;elapsed=sv.elapsed||0;humanColor=sv.human||(G.players.find(p=>p.type==="human")||{}).color||null;
    G.statsDone=false;
    enterPlay();
  };
  window.ludoAuto=function(){
    autoSet(!autoRoll);sfx("click");
    autoPaint($("luAuto"));
    toast_(autoRoll?"Auto roll: on":"Auto roll: off");
    if(autoRoll&&G&&!busy)scheduleAutoRoll(gen);   // لو الدور على الرمي دلوقتي يرمي فورًا
  };
  window.ludoRoll=function(){if(!busy&&G&&G.phase==="roll"&&E.cur(G).type==="human")doRoll();};
  window.ludoAgain=function(){
    sfx("click");
    // نفس اللاعبين والإعدادات، مباراة جديدة بالكامل
    const old=G.players.map(p=>({color:p.color,type:p.type,level:p.level,name:p.name}));
    const first=Math.floor(Math.random()*old.length);
    const opts=G.opts,st=G.settings;
    G=E.initializeGame(old,opts,first);G.settings=st;elapsed=0;
    clearSave();enterPlay();
  };
  window.ludoMenu=function(){ludoShowSetup(true);};
  window.ludoRestart=function(){
    sfx("click");
    if(!confirm("Restart this match from the beginning?"))return;
    ludoAgain();
  };
  window.ludoQuitKeep=function(){$("luQuit").classList.add("hidden");sfx("click");};
  window.ludoQuitLater=function(){saveGame();ludoShowSetup(true);};
  window.ludoQuitNow=function(){clearSave();G=null;ludoShowSetup(true);};
  window.ludoMute=function(){muted=!muted;lsSet(KEY_MUTE,muted);$("luMute").textContent=muted?"Sound: off":"Sound: on";};
  window.ludoStats=function(){sfx("click");renderStats();showView("stats");};
  window.ludoPreset=preset;
  window.ludoTog=function(k){
    captureNames();
    if(k==="three")cfg.three=!cfg.three;else if(k==="full")cfg.full=!cfg.full;else cfg.auto=!cfg.auto;
    sfx("click");syncSetup();
  };
  window.ludoDice=function(v){cfg.dice=v;try{localStorage.setItem("ludoDiceStyle",v);}catch(e){}sfx("click");syncSetup();};
  window.ludoSpeed=function(v){cfg.speed=v;sfx("click");syncSetup();};
  window.ludoTimer=function(v){cfg.timer=+v;sfx("click");syncSetup();};
  window.ludoResetStats=function(){
    if(!confirm("Reset all Ludo stats and achievements on this device?"))return;
    try{localStorage.removeItem(KEY_STATS);localStorage.removeItem(KEY_ACH);}catch(e){}
    renderStats();
  };

  // لو الصفحة اتقفلت أو المستخدم خرج: نحفظ التقدم
  window.addEventListener("pagehide",()=>{if(G&&G.phase!=="over"&&!$("luPlay").classList.contains("hidden"))saveGame();});
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&G&&G.phase!=="over"&&!$("luPlay").classList.contains("hidden"))saveGame();});
})();
