/* =========================================================
   SNAKES & LADDERS (سلم وتعبان) — الواجهة.
   الملف بيحتوي على:
     1) رسم اللوحة (SVG): سلالم، تعابين، خانات خاصة، فخاخ، قطع
     2) الكروت والعرض (SnakeUI.createView): بيمشّي الأحداث بالأنيميشن
        ويرسم الأزرار/القرارات. نفس الـ view بيشتغل أوفلاين وأونلاين.
     3) اللعب الأوفلاين (إعدادات، كمبيوتر، حفظ، إحصائيات وإنجازات)
   القواعد: js/snake-engine.js (من ts/snake-engine.ts) · الأونلاين: js/online-snake.js · الشكل: css/snake.css
========================================================= */
(function(){
"use strict";
if(!window.SNE)return;
var E=window.SNE;
var NS="http://www.w3.org/2000/svg";
var $=function(id){return document.getElementById(id);};
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m];});}
function reduce(){try{return window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){return false;}}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function pad(n){return(n<10?"0":"")+n;}

/* ---------- ألوان اللاعبين (نفس ألوان لودو) ---------- */
var CNAME={red:"الأحمر",green:"الأخضر",yellow:"الأصفر",blue:"الأزرق"};
var SEAT_LAYOUT={2:["red","yellow"],3:["red","green","yellow"],4:["red","green","yellow","blue"]};
var HEX={red:"#E5484D",green:"#2EAE6B",yellow:"#F2B632",blue:"#3B82E0"};

/* ---------- صوت ---------- */
var muted=false;try{muted=localStorage.getItem("snakeMute")==="1";}catch(e){}
function sfx(k){
  if(muted)return;
  try{
    if(k==="win"||k==="big"){if(typeof playRevealSound==="function")playRevealSound();}
    else if(typeof playClickSound==="function")playClickSound();
  }catch(e){}
}

/* ---------- أيقونات 24×24 (خط) ---------- */
var IC={
  hunt:"<path d='M6 20c-2-3 0-6 4-6s6-2 4-5-5-3-6-6'/><circle cx='15' cy='6' r='2.3'/><path d='M3 4l18 16'/>",
  shield:"<path d='M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'/><path d='M8.6 12l2.5 2.5L15.6 9.5'/>",
  draw:"<rect x='3.5' y='6' width='11' height='14' rx='2'/><path d='M9 3.5h8.5A2 2 0 0 1 19.5 5.5V16'/><path d='M9 10.5v5M6.5 13h5'/>",
  cut:"<path d='M8 3v18M16 3v18M8 7.5h8M8 12h8M8 16.5h8'/><path d='M3.5 20.5l17-17' stroke-width='2.4'/>",
  swap:"<path d='M6 8h12l-3-3.2M18 16H6l3 3.2'/>",
  loaded:"<rect x='4' y='4' width='16' height='16' rx='3.5'/><circle cx='9' cy='9' r='1' fill='currentColor'/><circle cx='15' cy='15' r='1' fill='currentColor'/><circle cx='15' cy='9' r='1' fill='currentColor'/><circle cx='9' cy='15' r='1' fill='currentColor'/>",
  tback:"<path d='M5 12a7 7 0 1 0 2.2-5.1'/><path d='M4 4v4.5h4.5'/><path d='M12 8.5V12l2.6 1.6'/>",
  tskip:"<path d='M12 3v18M4.3 7.5l15.4 9M19.7 7.5L4.3 16.5'/><path d='M9.5 4.8L12 7.2l2.5-2.4M9.5 19.2L12 16.8l2.5 2.4'/>",
  tsteal:"<circle cx='12' cy='12' r='8.5'/><path d='M12 7v10M9.3 9.6a2.4 2 0 0 1 2.7-1.1h.9a2.2 2 0 0 1 0 4.2h-1.8a2.2 2 0 0 0 0 4.2h.9a2.4 2 0 0 0 2.7-1.1'/>",
  tfake:"<path d='M3 12c2.5-4.5 5.5-6.5 9-6.5s6.5 2 9 6.5c-2.5 4.5-5.5 6.5-9 6.5S5.5 16.5 3 12z'/><path d='M9.5 9.5l5 5M14.5 9.5l-5 5'/>",
  flip:"<path d='M4 12a8 8 0 0 1 14-5.2l2-1.8v6h-6l2.3-2.1A5.8 5.8 0 0 0 6 12'/><path d='M20 12a8 8 0 0 1-14 5.2l-2 1.8v-6h6l-2.3 2.1A5.8 5.8 0 0 0 18 12'/>",
  treasure:"<path d='M6 4h12l3 5-9 11L3 9z'/><path d='M3 9h18M9 4L7.5 9 12 20M15 4l1.5 5L12 20'/>",
  curse:"<path d='M12 3a8 8 0 0 0-8 8c0 2.6 1.2 4.2 3 5.2V20h10v-3.8c1.8-1 3-2.6 3-5.2a8 8 0 0 0-8-8z'/><circle cx='9' cy='11' r='1.6' fill='currentColor'/><circle cx='15' cy='11' r='1.6' fill='currentColor'/><path d='M10.5 16h3'/>",
  steal:"<path d='M7 9h10l1.5 10a1 1 0 0 1-1 1.2h-11a1 1 0 0 1-1-1.2z'/><path d='M9 9V7a3 3 0 0 1 6 0v2'/>",
  ward:"<path d='M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'/>",
  fork:"<path d='M12 21v-7M12 14L6 6M12 14l6-8'/><path d='M3 8l3-3 3 3M15 8l3-3 3 3'/>",
  gift:"<rect x='3.5' y='9' width='17' height='11' rx='1.5'/><path d='M12 9v11M3.5 13h17M12 9c-2.5 0-4.5-1-4.5-2.8S9.8 3.5 12 9zM12 9c2.5 0 4.5-1 4.5-2.8S14.2 3.5 12 9z'/>",
  tax:"<circle cx='12' cy='12' r='8.5'/><path d='M8.5 12.5l2.5 2.5 4.5-5'/><path d='M12 3.5V2M12 22v-1.5'/>",
  headwind:"<path d='M3 8h11a2.5 2.5 0 1 0-2.5-2.5M3 12h16a2.5 2.5 0 1 1-2.5 2.5M3 16h8a2.5 2.5 0 1 1-2.5 2.5'/>",
  season:"<path d='M8 3v18M16 3v18M8 7.5h8M8 12h8M8 16.5h8'/>",
  sleepy:"<path d='M6 7h5L6 12h5M13 13h4l-4 4.5h4'/><path d='M4 20c4-2 8-2 12 0'/>",
  bolt:"<path d='M13 2L4 14h7l-1 8 9-12h-7z'/>",
  heart:"<path d='M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'/>",
  skull:"<path d='M12 3a8 8 0 0 0-8 8c0 2.6 1.2 4.2 3 5.2V20h10v-3.8c1.8-1 3-2.6 3-5.2a8 8 0 0 0-8-8z'/>",
  crown:"<path d='M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z'/><path d='M5 21h14'/>",
  trophy:"<path d='M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 21h8M10 17h4'/>",
  cards:"<rect x='3.5' y='6' width='11' height='14' rx='2'/><path d='M9 3.5h8.5A2 2 0 0 1 19.5 5.5V16'/>",
  trap:"<path d='M3 15c2-6 16-6 18 0M5 15l1.5-3M9 14l1-3.5M14 14l-1-3.5M19 15l-1.5-3'/><path d='M3 15h18v3H3z'/>"
};
function ic(name,sz){return'<svg viewBox="0 0 24 24" width="'+(sz||18)+'" height="'+(sz||18)+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(IC[name]||"")+'</svg>';}

/* ---------- الكروت (HTML) ---------- */
var TONE={green:"#2fae6b",blue:"#3b82e0",gold:"#e0b043",orange:"#e0742f",violet:"#9b6cf0",red:"#d9484f"};
function cardHTML(id,o){
  o=o||{};
  var d=E.CARDS[id];
  if(!d||o.back)return'<div class="sn-card is-back'+(o.cls?" "+o.cls:"")+'"'+(o.attr||"")+'><i class="sn-back-ic">'+ic("cards",30)+'</i><span class="sn-back-pat"></span></div>';
  return'<div class="sn-card tone-'+d.tone+(o.cls?" "+o.cls:"")+'" data-card="'+id+'"'+(o.attr||"")+'><span class="sn-c-top"></span><i class="sn-c-ic">'+ic(id,34)+'</i><b class="sn-c-en">'+esc(d.ar)+'</b>'+(o.noDesc?"":'<p class="sn-c-d">'+esc(d.da)+'</p>')+(o.tag?'<span class="sn-c-tag">'+esc(o.tag)+'</span>':"")+'</div>';
}

/* =========================================================
   1) اللوحة
========================================================= */
var VBW=104,VBH=117;
function cxy(c){var p=E.cellXY(c);return[2+p[0]*10+5,2+(9-p[1])*10+5];}
function mk(tag,attrs,parent){
  var el=document.createElementNS(NS,tag);
  if(attrs)for(var k in attrs)el.setAttribute(k,attrs[k]);
  if(parent)parent.appendChild(el);
  return el;
}
var SNAKE_COL="#E4564E";   /* كل التعابين نفس اللون: أحمر = خطر، والسلالم خشب دهبي */

function ladderGeom(a,b){
  var dx=b[0]-a[0],dy=b[1]-a[1],len=Math.sqrt(dx*dx+dy*dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
  var s=2.2,A=[a[0]+ux*s,a[1]+uy*s],B=[b[0]-ux*s,b[1]-uy*s],L=len-2*s;
  return{A:A,B:B,L:L,ux:ux,uy:uy,nx:nx,ny:ny,pts:[a,b]};
}
function snakeGeom(h,t,id){
  var dx=t[0]-h[0],dy=t[1]-h[1],len=Math.sqrt(dx*dx+dy*dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
  var amp=Math.min(len*.15,6)*(id%2?1:-1);
  var P0=h,P3=t,P1=[h[0]+dx*.33+nx*amp,h[1]+dy*.33+ny*amp],P2=[h[0]+dx*.66-nx*amp,h[1]+dy*.66-ny*amp],N=34,pts=[];
  for(var i=0;i<=N;i++){
    var u=i/N,v=1-u,x=v*v*v*P0[0]+3*v*v*u*P1[0]+3*v*u*u*P2[0]+u*u*u*P3[0],y=v*v*v*P0[1]+3*v*v*u*P1[1]+3*v*u*u*P2[1]+u*u*u*P3[1];
    pts.push([x,y]);
  }
  return{pts:pts};
}

/* بيبني اللوحة جوه host. g = حالة اللعبة (بس عشان اللوحة نفسها). */
function makeBoard(host,g){
  host.innerHTML="";
  var svg=mk("svg",{viewBox:"0 0 "+VBW+" "+VBH,class:"sn-svg",role:"img","aria-label":"لوحة سلم وتعبان"});
  host.appendChild(svg);
  var L={bg:mk("g",{class:"sn-l-bg"},svg),tiles:mk("g",{class:"sn-l-tiles"},svg),sp:mk("g",{class:"sn-l-sp"},svg),jump:mk("g",{class:"sn-l-jump"},svg),spi:mk("g",{class:"sn-l-spi"},svg),
    trap:mk("g",{class:"sn-l-trap"},svg),hl:mk("g",{class:"sn-l-hl"},svg),pawn:mk("g",{class:"sn-l-pawn"},svg),fx:mk("g",{class:"sn-l-fx"},svg)};
  // الإطار (خشب) + منطقة البداية
  mk("rect",{x:0,y:0,width:VBW,height:104,rx:3.5,class:"sn-frame"},L.bg);
  mk("rect",{x:1.4,y:1.4,width:VBW-2.8,height:101.2,rx:2.6,class:"sn-frame2"},L.bg);
  mk("rect",{x:2,y:106,width:60,height:10,rx:3,class:"sn-startpad"},L.bg);
  var st=mk("text",{x:50,y:112.8,class:"sn-starttxt","text-anchor":"middle"},L.bg);st.textContent="البداية";
  // الخانات
  for(var c=1;c<=100;c++){
    var p=E.cellXY(c),x=2+p[0]*10,y=2+(9-p[1])*10;
    var r=mk("rect",{x:x+.25,y:y+.25,width:9.5,height:9.5,rx:1,class:"sn-tile "+((p[0]+p[1])%2?"b":"a")+(c===1?" is-start":"")+(c===100?" is-end":""),"data-c":c},L.tiles);
    var t=mk("text",{x:x+1.2,y:y+3.4,class:"sn-num"},L.tiles);t.textContent=c;
  }
  // الخانة 100: تاج
  var gx=cxy(100);
  var crown=mk("g",{transform:"translate("+(gx[0]-4)+","+(gx[1]-3)+") scale(.34)",class:"sn-crown"},L.spi);
  crown.innerHTML=IC.crown;
  // الخانات الخاصة
  var SPLAB={treasure:"كنز",curse:"لعنة",steal:"سرقة",ward:"حماية",fork:"تفرّع"};
  g.sp.forEach(function(s){
    var xy=cxy(s.cell),x0=xy[0]-5,y0=xy[1]-5;
    mk("rect",{x:x0+.25,y:y0+.25,width:9.5,height:9.5,rx:1,class:"sn-sp-bg sp-"+s.t},L.sp);
    var gg=mk("g",{transform:"translate("+(xy[0]-3.6)+","+(xy[1]-3.8)+") scale(.3)",class:"sn-sp-ic sp-"+s.t},L.spi);
    gg.innerHTML=IC[s.t]||"";
    var lab=mk("text",{x:xy[0],y:y0+9.2,class:"sn-sp-lab","text-anchor":"middle"},L.spi);
    lab.textContent=SPLAB[s.t];
  });

  var B={svg:svg,L:L,host:host,disp:[],pawns:[],jumpGeo:{},sig:"",viewSeat:-1,names:[],colors:[]};
  var pawnsReady=false;

  /* ---- السلالم والتعابين ---- */
  B.renderJumps=function(g){
    var sig=g.jumps.map(function(j){return j.from+">"+j.to+(j.cut?"c"+Math.max(0,j.cut-g.round+1):"");}).join(",");
    if(sig===B.sig)return;
    B.sig=sig;L.jump.innerHTML="";B.jumpGeo={};
    // سلالم الأول (تحت)، بعدين التعابين
    var order=g.jumps.slice().sort(function(a,b){return(E.isLadder(b)?1:0)-(E.isLadder(a)?1:0);});
    order.forEach(function(j){
      var a=cxy(j.from),b=cxy(j.to),grp=mk("g",{class:"sn-jump "+(E.isLadder(j)?"is-lad":"is-snk")+(j.cut?" is-cut":""),"data-j":j.id},L.jump);
      if(E.isLadder(j)){
        var G=ladderGeom(a,b);B.jumpGeo[j.id]={pts:[a,b],lad:true};
        [1,-1].forEach(function(sd){
          mk("line",{x1:G.A[0]+G.nx*1.5*sd+.5,y1:G.A[1]+G.ny*1.5*sd+.8,x2:G.B[0]+G.nx*1.5*sd+.5,y2:G.B[1]+G.ny*1.5*sd+.8,class:"sn-lad-sh"},grp);
        });
        var n=Math.max(2,Math.floor(G.L/3.6));
        for(var i=1;i<=n;i++){
          var u=i/(n+1),cx=G.A[0]+(G.B[0]-G.A[0])*u,cy=G.A[1]+(G.B[1]-G.A[1])*u;
          mk("line",{x1:cx-G.nx*1.5,y1:cy-G.ny*1.5,x2:cx+G.nx*1.5,y2:cy+G.ny*1.5,class:"sn-lad-rung"},grp);
        }
        [1,-1].forEach(function(sd){
          mk("line",{x1:G.A[0]+G.nx*1.5*sd,y1:G.A[1]+G.ny*1.5*sd,x2:G.B[0]+G.nx*1.5*sd,y2:G.B[1]+G.ny*1.5*sd,class:"sn-lad-rail"},grp);
          mk("line",{x1:G.A[0]+G.nx*1.5*sd,y1:G.A[1]+G.ny*1.5*sd,x2:G.B[0]+G.nx*1.5*sd,y2:G.B[1]+G.ny*1.5*sd,class:"sn-lad-rail2"},grp);
        });
        if(j.cut){
          var mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
          mk("circle",{cx:mx,cy:my,r:3.4,class:"sn-cutbadge"},grp);
          var tx=mk("text",{x:mx,y:my+1.3,class:"sn-cuttxt","text-anchor":"middle"},grp);tx.textContent=Math.max(1,j.cut-g.round+1);
          mk("line",{x1:mx-6,y1:my-6,x2:mx+6,y2:my+6,class:"sn-cutx"},grp);
        }
        mk("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1],class:"sn-hit"},grp);
      }else{
        var S=snakeGeom(a,b,j.id),col=SNAKE_COL;B.jumpGeo[j.id]={pts:S.pts,lad:false};
        var pts=S.pts,left=[],right=[],N=pts.length;
        for(var k=0;k<N;k++){
          var pa=pts[Math.max(0,k-1)],pb=pts[Math.min(N-1,k+1)],ddx=pb[0]-pa[0],ddy=pb[1]-pa[1],dl=Math.sqrt(ddx*ddx+ddy*ddy)||1,nx=-ddy/dl,ny=ddx/dl;
          var u2=k/(N-1),w=(1.12*Math.pow(1-u2,.62)+.18)*(k<3?.9+k*.04:1);
          left.push([pts[k][0]+nx*w,pts[k][1]+ny*w]);right.push([pts[k][0]-nx*w,pts[k][1]-ny*w]);
        }
        var dstr="M"+left.map(function(q){return q[0].toFixed(2)+" "+q[1].toFixed(2);}).join("L")+"L"+right.reverse().map(function(q){return q[0].toFixed(2)+" "+q[1].toFixed(2);}).join("L")+"Z";
        mk("path",{d:dstr,transform:"translate(.5,.8)",class:"sn-snk-sh"},grp);
        var body=mk("path",{d:dstr,class:"sn-snk-body",style:"fill:"+col},grp);
        var mid="M"+pts.map(function(q){return q[0].toFixed(2)+" "+q[1].toFixed(2);}).join("L");
        mk("path",{d:mid,class:"sn-snk-scale"},grp);
        // الرأس
        var hx=pts[0][0],hy=pts[0][1],ang=Math.atan2(pts[0][1]-pts[3][1],pts[0][0]-pts[3][0])*180/Math.PI;
        var head=mk("g",{transform:"translate("+hx.toFixed(2)+","+hy.toFixed(2)+") rotate("+ang.toFixed(1)+")",class:"sn-snk-head"},grp);
        mk("path",{d:"M2.4 0L4.9 -.7M2.4 0L4.9 .7",class:"sn-tongue"},head);
        mk("ellipse",{cx:.4,cy:0,rx:2.2,ry:1.8,style:"fill:"+col,class:"sn-head-sh"},head);
        mk("circle",{cx:.9,cy:-1.05,r:.62,fill:"#fff"},head);mk("circle",{cx:.9,cy:1.05,r:.62,fill:"#fff"},head);
        mk("circle",{cx:1.05,cy:-1.05,r:.3,fill:"#1a120d"},head);mk("circle",{cx:1.05,cy:1.05,r:.3,fill:"#1a120d"},head);
        var path=mk("path",{d:mid,class:"sn-hit"},grp);
      }
    });
    B.markPick();
  };

  /* ---- الفخاخ (مكانها معروف للكل، نوعها سري) ---- */
  B.renderTraps=function(g){
    L.trap.innerHTML="";
    g.traps.forEach(function(t){
      var xy=cxy(t.cell),mine=B.viewSeat===t.owner,col=HEX[B.colors[t.owner]]||"#999";
      var pos=mk("g",{transform:"translate("+xy[0]+","+xy[1]+")"},L.trap);
      var grp=mk("g",{class:"sn-trapmk"+(mine?" is-mine":"")},pos);
      mk("circle",{r:4.1,class:"sn-trap-ring",style:"stroke:"+col},grp);
      mk("circle",{r:3.3,class:"sn-trap-bg"},grp);
      if(mine){
        var gg=mk("g",{transform:"translate(-2.5,-2.5) scale(.21)",class:"sn-trap-ic"},grp);gg.innerHTML=IC[t.tt]||"";
      }else{
        var q=mk("text",{x:0,y:1.55,class:"sn-trap-q","text-anchor":"middle"},grp);q.textContent="?";
      }
    });
  };

  /* ---- القطع ---- */
  function pawnEl(seat,color){
    var gp=mk("g",{class:"sn-pawn c-"+color,"data-seat":seat},L.pawn);
    var inner=mk("g",{class:"sn-pawn-in"},gp);
    mk("ellipse",{cx:0,cy:3.5,rx:3.2,ry:1.1,class:"sn-pawn-sh"},inner);
    mk("path",{d:"M-3 3.6C-3 1 -1.4 -.1 -.8 -.9L.8 -.9C1.4 -.1 3 1 3 3.6Z",class:"sn-pawn-body"},inner);
    mk("circle",{cx:0,cy:-2.2,r:2.1,class:"sn-pawn-head"},inner);
    mk("ellipse",{cx:-.7,cy:-2.9,rx:.7,ry:.45,class:"sn-pawn-gl"},inner);
    return gp;
  }
  B.setSeats=function(n,colors,names){
    B.colors=colors;B.names=names;L.pawn.innerHTML="";B.pawns=[];B.disp=[];
    for(var i=0;i<n;i++){B.pawns.push(pawnEl(i,colors[i]));B.disp.push(0);}
    pawnsReady=true;
  };
  function spot(seat,cell,idx,cnt){
    var xy;
    if(cell<=0){xy=[8+seat*9.5,111];return{x:xy[0],y:xy[1],s:.85};}
    xy=cxy(cell);
    if(cnt<=1)return{x:xy[0],y:xy[1]+.4,s:1};
    var offs=cnt===2?[[-2.2,.6],[2.2,.6]]:cnt===3?[[-2.4,1.4],[2.4,1.4],[0,-1.6]]:[[-2.4,-1.4],[2.4,-1.4],[-2.4,2.2],[2.4,2.2]];
    var o=offs[idx%offs.length];
    return{x:xy[0]+o[0],y:xy[1]+o[1]+.2,s:cnt===2?.82:.72};
  }
  B.layout=function(skip){
    var by={};
    B.disp.forEach(function(c,i){if(B.ghost&&B.ghost[i])return;(by[c]=by[c]||[]).push(i);});
    Object.keys(by).forEach(function(k){
      var arr=by[k];
      arr.forEach(function(seat,idx){
        if(skip&&skip.indexOf(seat)>=0)return;
        var s=spot(seat,+k,idx,arr.length),el=B.pawns[seat];
        el.style.transform="translate("+s.x.toFixed(2)+"px,"+s.y.toFixed(2)+"px) scale("+s.s+")";
        el._sc=s.s;
      });
    });
  };
  B.syncPawns=function(g){
    B.ghost=g.players.map(function(p){return p.ghost;});
    g.players.forEach(function(p,i){B.disp[i]=p.ghost?0:p.pos;B.pawns[i].classList.toggle("is-ghost",p.ghost);});
    B.layout();
  };
  B.render=function(g,viewSeat){
    if(viewSeat!==undefined)B.viewSeat=viewSeat;
    B.renderJumps(g);B.renderTraps(g);B.syncPawns(g);
    svg.classList.toggle("fx-sleepy",E.fxOn(g,"sleepy"));
    svg.classList.toggle("fx-season",E.fxOn(g,"season"));
    svg.classList.toggle("fx-headwind",E.fxOn(g,"headwind"));
  };
  B.setTurn=function(seat){B.pawns.forEach(function(p,i){p.classList.toggle("is-turn",i===seat);});};

  /* ---- أنيميشن ---- */
  B.step=function(seat,cell,ms){B.disp[seat]=cell;B.layout();return sleep(ms);};
  B.walk=async function(seat,from,to,ms){
    if(reduce()){B.disp[seat]=to;B.layout();await sleep(80);return;}
    for(var c=from+1;c<=to;c++)await B.step(seat,c,ms||115);
  };
  function raf(){return new Promise(function(r){requestAnimationFrame(r);});}
  B.slide=async function(seat,pts,ms,endCell){
    var el=B.pawns[seat];
    if(reduce()||!pts||pts.length<2){B.disp[seat]=endCell;B.layout();await sleep(60);return;}
    // مقاطع تراكمية
    var seg=[0],tot=0,i;
    for(i=1;i<pts.length;i++){tot+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(tot);}
    var t0=performance.now(),sc=el._sc||1;
    el.classList.add("is-flying");
    while(true){
      var u=Math.min(1,(performance.now()-t0)/ms),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2,d=e*tot,k=1;
      while(k<seg.length-1&&seg[k]<d)k++;
      var f=(d-seg[k-1])/((seg[k]-seg[k-1])||1),x=pts[k-1][0]+(pts[k][0]-pts[k-1][0])*f,y=pts[k-1][1]+(pts[k][1]-pts[k-1][1])*f;
      el.style.transform="translate("+x.toFixed(2)+"px,"+(y-(Math.sin(u*Math.PI)*(pts.length===2?2.2:0))).toFixed(2)+"px) scale("+sc+")";
      if(u>=1)break;
      await raf();
    }
    el.classList.remove("is-flying");
    B.disp[seat]=endCell;B.layout();
  };
  B.line=function(a,b,n){var o=[];for(var i=0;i<=n;i++)o.push([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]);return o;};
  B.cellPt=function(c){return c<=0?[8,111]:cxy(c);};
  B.pulse=function(cell,cls){
    var xy=cxy(cell),r=mk("circle",{cx:xy[0],cy:xy[1],r:3,class:"sn-ripple "+(cls||"")},L.fx);
    setTimeout(function(){if(r.parentNode)r.parentNode.removeChild(r);},1100);
  };
  B.pulseJump=function(id,cls){
    var grp=L.jump.querySelector('[data-j="'+id+'"]');if(!grp)return;
    grp.classList.add(cls||"is-flash");setTimeout(function(){grp.classList.remove(cls||"is-flash");},1000);
  };
  B.shake=function(){svg.classList.remove("is-shake");void svg.getBoundingClientRect();svg.classList.add("is-shake");setTimeout(function(){svg.classList.remove("is-shake");},520);};
  B.nudge=function(seat){var el=B.pawns[seat];el.classList.add("is-nudge");setTimeout(function(){el.classList.remove("is-nudge");},500);};

  /* ---- اختيار هدف: خانات / سلالم / لاعبين ---- */
  var pickCb=null;
  B.markPick=function(){
    var set=B._pickJ||[];
    [].forEach.call(L.jump.querySelectorAll(".sn-jump"),function(el){
      var on=set.indexOf(+el.getAttribute("data-j"))>=0;
      el.classList.toggle("is-pick",on);
      el.onclick=on?function(){if(pickCb)pickCb("j"+pad(+el.getAttribute("data-j")));}:null;
    });
  };
  B.setTargets=function(spec,cb){
    L.hl.innerHTML="";pickCb=cb||null;B._pickJ=spec&&spec.jumps||[];
    B.pawns.forEach(function(p,i){p.classList.remove("is-pick");p.onclick=null;});
    if(spec){
      (spec.cells||[]).forEach(function(c){
        var xy=cxy(c),r=mk("rect",{x:xy[0]-4.6,y:xy[1]-4.6,width:9.2,height:9.2,rx:1.2,class:"sn-hl-cell"},L.hl);
        r.onclick=function(){if(pickCb)pickCb("c"+pad(c));};
      });
      (spec.seats||[]).forEach(function(s){
        var el=B.pawns[s];el.classList.add("is-pick");el.onclick=function(){if(pickCb)pickCb("t"+s);};
      });
    }
    B.markPick();
  };
  host._board=B;
  return B;
}

/* =========================================================
   2) الـ view: بيعرض الأحداث بالأنيميشن + بيرسم القرارات
   cfg: {n,opts,seed,first,state?,names[],colors[],canAct(seat),viewSeat(),reveal?(seat),send(tok),
         onIdle?(sh),onOver?(sh),speed?()}
   بيستقبل حروف القرارات (feed) ويطبّقها على نسخته (shadow) ويعرض كل حدث.
========================================================= */
var SPEEDM={fast:.6,normal:1,slow:1.5};
function speedMul(){var s="normal";try{s=localStorage.getItem("snakeSpeed")||"normal";}catch(e){}return SPEEDM[s]||1;}
var WORLD_ICON={gift:"gift",tax:"tax",headwind:"headwind",season:"season",sleepy:"sleepy"};
var BACK_WHY={curse:"لعنة",tax:"ضريبة المتصدر",ambush:"كمين",trap:"فخ"};

function playHTML(){
  return'<div class="sn-play">'+
    '<div class="sn-strip"></div>'+
    '<div class="sn-banner hidden"></div>'+
    '<div class="sn-boardwrap"><div class="sn-board"></div><div class="sn-stage"></div><div class="sn-floats"></div></div>'+
    '<p class="sn-last"></p><p class="sn-status" role="status" aria-live="polite"></p>'+
    '<div class="sn-ctl"><div class="sn-dice"><div class="sn-die"></div><div class="sn-die2 hidden"></div></div>'+
      '<div class="sn-act"><div class="sn-rollrow"><button type="button" class="sn-roll">ارمي النرد</button>'+
      '<button type="button" class="sn-auto" aria-pressed="false" aria-label="رمي تلقائي" title="رمي تلقائي"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg><span>تلقائي</span></button></div>'+
      '<div class="sn-prompt hidden"></div></div></div>'+
    '<div class="sn-hand hidden"></div>'+
    '<div class="sn-meta"><span class="sn-m1"></span><span class="sn-tt"></span><span class="sn-m2"></span></div>'+
    '<details class="sn-log"><summary>السجل</summary><div class="sn-loglist"></div></details>'+
  '</div>';
}

function createView(root,cfg){
  var q=function(s){return root.querySelector(s);};
  var el={strip:q(".sn-strip"),board:q(".sn-board"),stage:q(".sn-stage"),floats:q(".sn-floats"),status:q(".sn-status"),last:q(".sn-last"),die:q(".sn-die"),die2:q(".sn-die2"),roll:q(".sn-roll"),
    auto:q(".sn-auto"),prompt:q(".sn-prompt"),hand:q(".sn-hand"),m1:q(".sn-m1"),m2:q(".sn-m2"),tt:q(".sn-tt"),log:q(".sn-loglist"),banner:q(".sn-banner"),ctl:q(".sn-ctl"),
    rollrow:q(".sn-rollrow"),wrap:q(".sn-boardwrap")};
  var sh=cfg.state?E.clone(cfg.state):E.init(cfg.n,cfg.opts,cfg.seed,cfg.first);
  var board=makeBoard(el.board,sh);board.setSeats(sh.n,cfg.colors,cfg.names);
  var UI=window.LudoUI;
  if(UI){UI.dieEl(el.die);UI.dieEl(el.die2);}
  var queue=[],running=false,destroyed=false,locked=false,lockT=0,overDone=false,lines=[],lastDie=0,lastDie2=0,dieSeat=-1,skipStage=false,curSpec=null;
  var V={sh:sh,board:board,el:el};
  var spd=function(){return cfg.speed?cfg.speed():speedMul();};
  var T=function(ms){return reduce()?Math.min(ms,60):Math.round(ms*spd());};
  var viewSeat=function(){return cfg.viewSeat?cfg.viewSeat():-1;};
  var reveal=function(s){return cfg.reveal?cfg.reveal(s):viewSeat()===s;};
  var nameOf=function(s){return cfg.names[s]||("لاعب "+(s+1));};
  var colOf=function(s){return cfg.colors[s]||"red";};
  var nmH=function(s){return'<bdi class="sn-nm c-'+colOf(s)+'"><b>'+esc(nameOf(s))+"</b></bdi>";};
  var cardAr=function(id){return E.CARDS[id]?E.CARDS[id].ar:id;};

  /* ---------- نص الحالة + السجل ---------- */
  function say(html,log){
    if(html)el.last.innerHTML=html;
    if(log!==false&&html){lines.unshift(html);if(lines.length>60)lines.pop();el.log.innerHTML=lines.map(function(l){return"<div>"+l+"</div>";}).join("");}
  }
  function pre(dest){
    if(dest>100)return{t:"محتاج رقم بالظبط",c:"x"};
    if(dest===100)return{t:"بتوصل 100!",c:"w"};
    var j=E.jumpAt(sh,dest);
    if(j&&!j.cut)return E.isLadder(j)?{t:"سلم لخانة "+j.to,c:"up"}:{t:"تعبان لخانة "+j.to,c:"dn"};
    var sp=E.spAt(sh,dest);
    if(sp)return{t:"خانة "+E.SP_INFO[sp.t].ar,c:"sp"};
    return{t:"خانة "+dest,c:""};
  }

  /* ---------- كارت على المسرح (ريفيل) ---------- */
  async function stageCard(o){
    var s=el.stage;skipStage=false;
    var front=o.id?cardHTML(o.id,{cls:"is-big"}):"";
    s.innerHTML='<div class="sn-reveal">'+
      '<div class="sn-flip'+(o.back?" is-back":"")+'"><div class="sn-flip-in"><div class="sn-flip-f">'+front+'</div><div class="sn-flip-b">'+cardHTML(null,{back:true,cls:"is-big"})+'</div></div></div>'+
      '<div class="sn-cap"><b>'+(o.cap||"")+'</b>'+(o.sub?'<small>'+o.sub+'</small>':"")+'</div></div>';
    s.classList.add("on");
    var flip=s.querySelector(".sn-flip");
    if(!o.back&&!reduce()){flip.classList.add("pre");await sleep(260);if(destroyed)return;flip.classList.remove("pre");flip.classList.add("go");}
    var t0=Date.now(),ms=T(o.ms||1500);
    s.onclick=function(){skipStage=true;};
    while(Date.now()-t0<ms&&!skipStage&&!destroyed)await sleep(40);
    s.classList.remove("on");s.onclick=null;
    await sleep(reduce()?0:160);
    if(!s.classList.contains("on"))s.innerHTML="";
  }
  async function stageBanner(o){
    var s=el.stage;skipStage=false;
    s.innerHTML='<div class="sn-wbanner tone-'+(o.tone||"gold")+'"><i>'+ic(o.icon,44)+'</i><small>'+(o.kicker||"")+'</small><b>'+esc(o.title)+'</b><p>'+esc(o.d||"")+'</p></div>';
    s.classList.add("on");s.onclick=function(){skipStage=true;};
    var t0=Date.now(),ms=T(o.ms||1900);
    while(Date.now()-t0<ms&&!skipStage&&!destroyed)await sleep(40);
    s.classList.remove("on");s.onclick=null;await sleep(reduce()?0:160);if(!s.classList.contains("on"))s.innerHTML="";
  }
  function confetti(){
    if(reduce())return;
    var s=el.stage,h="";
    for(var i=0;i<34;i++)h+='<i class="sn-conf" style="--x:'+Math.round(Math.random()*100)+'%;--d:'+(Math.random()*.5).toFixed(2)+'s;--r:'+Math.round(Math.random()*720-360)+'deg;--c:'+["#F2B632","#E5484D","#2EAE6B","#3B82E0","#fff"][i%5]+'"></i>';
    var d=document.createElement("div");d.className="sn-confetti";d.innerHTML=h;s.appendChild(d);
    setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d);},2200);
  }
  function floatAt(cell,text,cls){
    var p=board.cellPt(cell),d=document.createElement("div");
    d.className="sn-float "+(cls||"");d.textContent=text;
    d.style.left=(p[0]/VBW*100)+"%";d.style.top=(p[1]/VBH*100)+"%";
    el.floats.appendChild(d);setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d);},1500);
  }

  /* ---------- النرد ---------- */
  function dieColor(seat){
    ["red","green","yellow","blue"].forEach(function(c){el.ctl.classList.remove("c-"+c);});
    if(seat>=0)el.ctl.classList.add("c-"+colOf(seat));
  }
  async function rollDice(e){
    dieSeat=e.seat;dieColor(e.seat);
    if(UI){
      el.die2.classList.toggle("hidden",!e.loaded);
      if(e.loaded){await Promise.all([UI.rollAnim(el.die,e.d,T(700)),UI.rollAnim(el.die2,e.d2,T(900))]);lastDie2=e.d2;}
      else await UI.rollAnim(el.die,e.d,T(760));
      lastDie=e.d;
    }
  }

  /* ---------- الأحداث ---------- */
  function trapName(tt){return E.CARDS[tt]?E.CARDS[tt].ar:"فخ";}
  async function playEv(e){
    switch(e.t){
      case "turn":
        board.setTurn(e.seat);dieColor(e.seat);renderStrip();
        if(UI&&lastDie){UI.setDie(el.die,lastDie,true);}
        el.die2.classList.add("hidden");
        break;
      case "round":renderMeta();break;
      case "roll":
        await rollDice(e);
        say(nmH(e.seat)+(e.loaded?" رمى <b>"+e.d+"</b> و <b>"+e.d2+"</b>":" رمى <b>"+e.d+"</b>"));
        break;
      case "headwind":say(nmH(e.seat)+" اتعطّل بالرياح العكسية: <b>"+e.d+"</b> اتحسبت <b>"+e.eff+"</b>");await sleep(T(450));break;
      case "move":
        await board.walk(e.seat,e.from,e.to,T(120));sfx("click");renderStrip();
        say(nmH(e.seat)+" راح خانة <b>"+e.to+"</b>");
        break;
      case "exact":
        board.nudge(e.seat);sfx("click");say(nmH(e.seat)+" محتاج الرقم <b>بالظبط</b> عشان يخلص، فمفيش حركة.");await sleep(T(650));break;
      case "special":{
        var si=E.SP_INFO[e.sp];board.pulse(e.cell,"sp-"+e.sp);floatAt(e.cell,si.ar,"sp");sfx("click");
        say(nmH(e.seat)+" وقف على خانة <b>"+si.ar+"</b>. "+esc(si.da));await sleep(T(650));break;
      }
      case "climb":{
        var geo=board.jumpGeo[e.jid];board.pulseJump(e.jid);
        say(nmH(e.seat)+" طلع سلم: <b>"+e.from+"</b> ← <b>"+e.to+"</b>");sfx("win");
        await sleep(T(250));
        await board.slide(e.seat,geo?geo.pts.slice():[board.cellPt(e.from),board.cellPt(e.to)],T(750),e.to);
        if(e.bonus)floatAt(e.to,"+"+e.bonus+" موسم","up");
        renderStrip();break;
      }
      case "bite":{
        var gb=board.jumpGeo[e.jid];board.pulseJump(e.jid,"is-bite");board.shake();
        say("تعبان لدغ "+nmH(e.seat)+": <b>"+e.from+"</b> ← <b>"+e.to+"</b>");sfx("big");
        floatAt(e.from,"لدغة!","dn");await sleep(T(250));
        await board.slide(e.seat,gb?gb.pts.slice():[board.cellPt(e.from),board.cellPt(e.to)],T(900),e.to);
        renderStrip();break;
      }
      case "sleepy":
        say("التعبان نايم. "+nmH(e.seat)+" في أمان.");board.pulseJump(e.jid,"is-sleep");floatAt(board.disp[e.seat],"zzz","up");await sleep(T(700));break;
      case "cutBlock":say("السلم مقطوع. "+nmH(e.seat)+" مش هيقدر يطلعه.");board.nudge(e.seat);await sleep(T(600));break;
      case "back":{
        var why=BACK_WHY[e.why]||"رجوع";
        say(nmH(e.seat)+" رجع: <b>"+e.from+"</b> ← <b>"+e.to+"</b> ("+why+")");sfx("big");board.shake();
        floatAt(e.from,"−"+(e.from-e.to),"dn");
        await board.slide(e.seat,board.line(board.cellPt(e.from),board.cellPt(e.to),6),T(520),e.to);renderStrip();break;
      }
      case "ward":
        say(nmH(e.seat)+" خد <b>حماية</b>. بتلغي ضربة واحدة، حتى التعبان.");floatAt(board.disp[e.seat],"حماية","up");renderStrip();await sleep(T(520));break;
      case "nothing":{
        var msg={empty:function(){return nmH(e.victim)+" معاه ولا كارت يتسرق.";},nopockets:function(){return nmH(e.seat)+" لقى الجيوب كلها فاضية.";},
          haveward:function(){return nmH(e.seat)+" معاه حماية بالفعل.";},fake:function(){return"كان فخ مزيف! مفيش حاجة حصلت لـ "+nmH(e.seat)+".";},
          calm:function(){return"طريق الكنز هادي. مفيش كمين.";},tax:function(){return"مفيش متصدر يتفرض عليه ضريبة لسه.";}}[e.why];
        say(msg?msg():"مفيش حاجة حصلت.");await sleep(T(560));break;
      }
      case "gain":{
        var rv=reveal(e.seat),d=E.CARDS[e.card];
        var via={treasure:"من الكنز",draw:"من الكومة",gift:"هدية",steal:"بالسرقة"}[e.via]||"";
        say(nmH(e.seat)+(rv?" خد <b>"+esc(d.ar)+"</b>":" خد كارت")+" "+via);
        sfx("click");renderStrip();
        await stageCard({id:e.card,back:!rv,cap:esc(nameOf(e.seat))+(rv?" خد "+esc(d.ar):" سحب كارت"),sub:rv?esc(d.da):"",ms:rv?1700:900});
        renderHand();break;
      }
      case "full":say("إيد "+nmH(e.seat)+" مليانة. لازم كارت يروح.");await sleep(T(300));break;
      case "drop":say(nmH(e.seat)+" رمى "+(reveal(e.seat)?"<b>"+esc(cardAr(e.card))+"</b>":"كارت"));renderStrip();await sleep(T(350));break;
      case "swapcard":say(nmH(e.seat)+" بدّل كارت في إيده.");renderStrip();renderHand();await sleep(T(350));break;
      case "steal":{
        var rvs=reveal(e.from)||reveal(e.to),ds=E.CARDS[e.card];
        say(nmH(e.to)+" سرق "+(rvs?"<b>"+esc(ds.ar)+"</b>":"كارت")+" من "+nmH(e.from));sfx("big");renderStrip();
        await stageCard({id:e.card,back:!rvs,cap:esc(nameOf(e.to))+" بيسرق من "+esc(nameOf(e.from)),sub:rvs?esc(ds.ar):"",ms:rvs?1600:1000});
        renderHand();break;
      }
      case "play":{
        var dp=E.CARDS[e.card],trap=dp.tgt==="cell",rp=!trap||reveal(e.seat);
        say(nmH(e.seat)+(trap?" خبّى فخ":" لعب <b>"+esc(dp.ar)+"</b>"));sfx("big");renderStrip();renderHand();
        if(dp.tgt==="none"&&e.card==="loaded")await stageCard({id:e.card,cap:esc(nameOf(e.seat))+" لعب "+esc(dp.ar),sub:esc(dp.da),ms:1300});
        else await stageCard({id:e.card,back:!rp,cap:esc(nameOf(e.seat))+(trap?" زرع فخ":" لعب "+esc(dp.ar)),sub:rp?esc(dp.da):"فخ مخفي اتزرع. الخانة اتعلّمت بعلامة ؟",ms:1400});
        break;
      }
      case "trapSet":board.renderTraps(sh);board.pulse(e.cell,"sp-trap");floatAt(e.cell,"؟","sp");await sleep(T(350));break;
      case "trapExpire":board.renderTraps(sh);say("فخ على خانة <b>"+e.cell+"</b> انتهت مدته.",false);break;
      case "trapHit":{
        board.renderTraps(sh);board.shake();sfx("big");
        say(nmH(e.seat)+" داس على فخ "+nmH(e.owner)+": <b>"+esc(trapName(e.tt))+"</b>");
        await stageCard({id:e.tt,cap:esc(nameOf(e.seat))+" داس على فخ!",sub:esc(trapName(e.tt))+" · زرعه "+esc(nameOf(e.owner)),ms:1500});
        break;
      }
      case "threat":break;
      case "defend":{
        var byName=E.CARDS[e.by]?E.CARDS[e.by].ar:"الحماية";
        say(nmH(e.seat)+" صدّ الضربة بـ <b>"+esc(byName)+"</b>!");sfx("win");floatAt(board.disp[e.seat],"اتصدّت","up");
        board.pulse(board.disp[e.seat]||1,"sp-ward");renderStrip();renderHand();await sleep(T(700));break;
      }
      case "freeze":say(nmH(e.seat)+" اتجمّد وبيضيّع دوره الجاي.");floatAt(board.disp[e.seat],"متجمّد","dn");renderStrip();await sleep(T(550));break;
      case "skip":say("فات دور "+nmH(e.seat)+".");renderStrip();await sleep(T(500));break;
      case "route":{
        var rn=["الطريق السريع","الطريق الآمن","طريق الكنز"][e.r];say(nmH(e.seat)+" اختار <b>"+rn+"</b>.");await sleep(T(350));break;
      }
      case "boost":
        await board.slide(e.seat,board.line(board.cellPt(e.from),board.cellPt(e.to),6),T(520),e.to);renderStrip();
        say(nmH(e.seat)+" راح خانة <b>"+e.to+"</b>");break;
      case "swap":{
        say(nmH(e.a)+" و"+nmH(e.b)+" بدّلوا أماكنهم!");sfx("big");
        await Promise.all([board.slide(e.a,board.line(board.cellPt(board.disp[e.a]),board.cellPt(e.pa),8),T(700),e.pa),board.slide(e.b,board.line(board.cellPt(board.disp[e.b]),board.cellPt(e.pb),8),T(700),e.pb)]);
        renderStrip();break;
      }
      case "cut":board.renderJumps(sh);board.pulseJump(e.jid,"is-cutflash");say(nmH(e.seat)+" قطع سلم. هيتعطّل 3 جولات.");await sleep(T(700));break;
      case "mend":board.renderJumps(sh);board.pulseJump(e.jid);say("سلم مقطوع اتصلّح.",false);break;
      case "flip":board.renderJumps(sh);board.pulseJump(e.jid,"is-cutflash");board.shake();say(nmH(e.seat)+" قلب الطاولة: "+(E.isLadder(sh.jumps[e.jid])?"تعبان بقى سلم":"سلم بقى تعبان")+"!");await sleep(T(800));break;
      case "heart":
        floatAt(board.disp[e.seat]||1,e.d>0?"+♥":"−♥",e.d>0?"up":"dn");renderStrip();
        say(nmH(e.seat)+(e.d>0?" لقى قلب":" خسر قلب")+" (فاضل "+e.left+")");await sleep(T(550));break;
      case "ghost":
        say(nmH(e.seat)+" خرج من اللعبة! بقى شبح.");sfx("big");board.syncPawns(sh);renderStrip();await sleep(T(900));break;
      case "world":{
        var wi=E.WORLD_INFO[e.id];renderBanner();
        say("<b>"+esc(wi.ar)+"</b>: "+esc(wi.da));sfx("big");
        await stageBanner({icon:WORLD_ICON[e.id],kicker:"حدث عالمي · الجولة "+e.round,title:wi.ar,d:wi.da,tone:"gold"});
        break;
      }
      case "finish":
        board.syncPawns(sh);floatAt(100,"#"+e.place,"up");board.pulse(100,"sp-fin");sfx("win");confetti();
        say(nmH(e.seat)+" وصل <b>100</b>! المركز <b>"+e.place+"</b>");renderStrip();await sleep(T(1100));break;
      case "over":break;
      default:break;
    }
  }

  /* ---------- رسم الأجزاء ---------- */
  function renderStrip(){
    var vs=viewSeat();
    el.strip.innerHTML=sh.players.map(function(p,i){
      var h="";
      if(sh.opts.surv){for(var k=0;k<Math.max(3,p.hearts);k++)h+='<s class="sn-h'+(k<p.hearts?" on":"")+'">'+ic("heart",11)+"</s>";}
      var cnt=p.hand.length,trs=sh.traps.filter(function(t){return t.owner===i;}).length;
      var pos=p.ghost?"خارج":(board.disp[i]>0?board.disp[i]:"البداية");
      var meta="";
      if(sh.opts.style==="chaos"&&!p.ghost){
        if(p.ward)meta+='<span class="sn-ico ward" title="حماية">'+ic("shield",12)+"</span>";
        if(cnt)meta+='<span class="sn-ico" title="كروت">'+ic("cards",12)+cnt+"</span>";
        if(trs)meta+='<span class="sn-ico trap" title="فخاخ">'+ic("trap",12)+trs+"</span>";
        if(p.skip)meta+='<span class="sn-ico frz" title="متجمّد">'+ic("tskip",12)+"</span>";
      }
      var cpu=cfg.isCpu&&cfg.isCpu(i);
      return'<div class="sn-pc c-'+colOf(i)+(i===sh.turn&&!sh.over?" is-turn":"")+(p.ghost?" is-ghost":"")+(p.fin?" is-done":"")+(curSpec&&curSpec.seats&&curSpec.seats.indexOf(i)>=0?" is-pick":"")+'" data-seat="'+i+'">'+
        '<span class="sn-dot"></span><b dir="auto">'+esc(nameOf(i))+(vs===i&&!cfg.hideYou?" (إنت)":"")+"</b>"+
        '<span class="sn-pos">'+pos+"</span>"+(cpu?'<span class="sn-rk">كمبيوتر</span>':"")+
        (h?'<span class="sn-hearts">'+h+"</span>":"")+(meta?'<span class="sn-pmeta">'+meta+"</span>":"")+"</div>";
    }).join("");
    el.strip.style.setProperty("--n",sh.n);
    [].forEach.call(el.strip.querySelectorAll(".sn-pc.is-pick"),function(c){c.onclick=function(){trySend("t"+c.getAttribute("data-seat"));};});
  }
  function renderBanner(){
    var on=E.WORLD_IDS.filter(function(id){return E.fxOn(sh,id);});
    if(!on.length||sh.over){el.banner.classList.add("hidden");el.banner.innerHTML="";return;}
    el.banner.classList.remove("hidden");
    el.banner.innerHTML=on.map(function(id){var w=E.WORLD_INFO[id];return'<span class="sn-fx fx-'+id+'">'+ic(WORLD_ICON[id],15)+"<b>"+esc(w.ar)+"</b><small>"+esc(w.da)+"</small></span>";}).join("");
  }
  function renderMeta(){
    el.m1.textContent="الجولة "+sh.round+" · "+(sh.opts.style==="classic"?"كلاسيك":"فوضى")+(sh.opts.surv?" · نجاة":"")+(sh.opts.full?" · كل المراكز":"");
    el.m2.textContent="";
  }
  function whyNot(card,slot){
    var p=sh.pend,mine=!sh.over&&p&&cfg.canAct(p.seat)&&p.seat===viewSeat();
    var d=E.CARDS[card];
    if(d.tgt==="react")return d.id==="hunt"?"بيشتغل لوحده لما تعبان يلدغك":"بيشتغل لوحده لما فخ أو لعنة أو سرقة تضربك";
    if(!mine)return"الكروت بتتلعب في دورك";
    if(p.t!=="roll")return"خلّص الاختيار الحالي الأول";
    if(sh.cardUsed)return"كارت واحد بس في الدور";
    return"مفيش هدف للكارت ده دلوقتي";
  }
  function renderHand(){
    var vs=viewSeat();
    if(vs<0||sh.opts.style!=="chaos"||!sh.players[vs]){el.hand.classList.add("hidden");return;}
    var P=sh.players[vs],p=sh.pend,legal=(!sh.over&&p&&p.seat===vs&&cfg.canAct(vs))?E.legal(sh):[];
    el.hand.classList.remove("hidden");
    var h='<div class="sn-hand-h"><b>كروتك</b><small>'+P.hand.length+"/"+E.MAXHAND+"</small></div><div class=\"sn-hand-row\">";
    for(var i=0;i<E.MAXHAND;i++){
      if(i<P.hand.length){
        var play=legal.indexOf("u"+i)>=0;
        h+=cardHTML(P.hand[i],{cls:play?"is-playable":"is-dim",attr:' data-slot="'+i+'" role="button" tabindex="0"'});
      }else h+='<div class="sn-slot"><span>فاضي</span></div>';
    }
    h+="</div>";
    el.hand.innerHTML=h;
    [].forEach.call(el.hand.querySelectorAll(".sn-card[data-slot]"),function(c){
      var slot=+c.getAttribute("data-slot");
      c.onclick=function(){
        if(c.classList.contains("is-playable"))trySend("u"+slot);
        else{try{toast(whyNot(P.hand[slot],slot));}catch(e){}}
      };
    });
  }

  /* ---------- قرارات ---------- */
  function trySend(tok){
    if(destroyed||running||queue.length||locked)return;
    if(sh.over||E.legal(sh).indexOf(tok)<0)return;
    var p=sh.pend;if(!cfg.canAct(p.seat))return;
    locked=true;clearTimeout(lockT);lockT=setTimeout(function(){locked=false;settle();},3200);
    cfg.send(tok);
  }
  V.send=trySend;
  function btn(tok,html,cls){return'<button type="button" class="sn-pb '+(cls||"")+'" data-tok="'+tok+'">'+html+"</button>";}
  function bindPrompt(){
    [].forEach.call(el.prompt.querySelectorAll("[data-tok]"),function(b){b.onclick=function(){trySend(b.getAttribute("data-tok"));};});
  }
  function promptHTML(p,L){
    var s=p.seat,P=sh.players[s];
    switch(p.t){
      case "target":{
        var c=p.card,d=E.CARDS[c],h='<div class="sn-pt"><b>'+esc(d.ar)+"</b>";
        if(c==="cut")h+="<small>دوس على سلم في اللوحة عشان تقطعه.</small></div>";
        else if(c==="flip")h+="<small>دوس على تعبان أو سلم عشان تقلبه.</small></div>";
        else if(d.tgt==="cell")h+="<small>دوس على خانة عادية عشان تخبّي الفخ. الكل هيشوف علامة ؟ هناك، بس إنت اللي عارف هو إيه.</small></div>";
        else if(c==="swap"){
          h+="<small>اختار مين تبدّل مكانك معاه.</small></div><div class=\"sn-pbs\">";
          L.forEach(function(t){if(t.charAt(0)==="t"){var i=+t.charAt(1);h+=btn(t,'<span class="sn-dot c-'+colOf(i)+'"></span>'+esc(nameOf(i))+" <small>خانة "+sh.players[i].pos+"</small>");}});
          h+="</div>";
        }else{
          h+="<small>اسحب من الكومة، أو اسرق كارت عشوائي.</small></div><div class=\"sn-pbs\">"+btn("d",ic("cards",16)+" اسحب من الكومة","gold");
          L.forEach(function(t){if(t.charAt(0)==="t"){var i=+t.charAt(1);h+=btn(t,'<span class="sn-dot c-'+colOf(i)+'"></span>اسرق من '+esc(nameOf(i))+" <small>"+sh.players[i].hand.length+" كروت</small>");}});
          h+="</div>";
        }
        return h+'<div class="sn-pbs">'+btn("z","إلغاء","ghost")+"</div>";
      }
      case "steal":{
        var h2='<div class="sn-pt"><b>سرقة!</b><small>اختار مين تسرقه. هتاخد كارت عشوائي.</small></div><div class="sn-pbs">';
        L.forEach(function(t){var i=+t.charAt(1);h2+=btn(t,'<span class="sn-dot c-'+colOf(i)+'"></span>'+esc(nameOf(i))+" <small>"+sh.players[i].hand.length+" كروت</small>");});
        return h2+"</div>";
      }
      case "pick":{
        var pa=pre(P.pos+p.a),pb=pre(P.pos+p.b);
        return'<div class="sn-pt"><b>النرد المزوّر</b><small>خد الرمية اللي تعجبك.</small></div><div class="sn-pbs two">'+
          btn("A",'<span class="sn-bigdie">'+p.a+'</span><small class="pv-'+pa.c+'">'+pa.t+"</small>")+btn("B",'<span class="sn-bigdie">'+p.b+'</span><small class="pv-'+pb.c+'">'+pb.t+"</small>")+"</div>";
      }
      case "fork":
        return'<div class="sn-pt"><b>مفترق طرق</b><small>اختار طريقك.</small></div><div class="sn-pbs col">'+
          btn("f0",'<i>'+ic("bolt",20)+'</i><span><b>سريع</b><small>+6 خانات، بس بتضيّع دورك الجاي</small></span>')+
          btn("f1",'<i>'+ic("shield",20)+'</i><span><b>آمن</b><small>+2 خانة وحماية (لو مش معاك)</small></span>')+
          btn("f2",'<i>'+ic("treasure",20)+'</i><span><b>كنز</b><small>كارت، بس فيه احتمال 1 من 3 يتعملك كمين (رجوع 3)</small></span>')+"</div>";
      case "discard":{
        var h3='<div class="sn-pt"><b>إيدك مليانة</b><small>دوس على الكارت اللي عايز ترميه.</small></div><div class="sn-disc">';
        P.hand.forEach(function(cid,i){h3+=cardHTML(cid,{noDesc:true,cls:"is-mini is-playable",attr:' data-tok="x'+i+'" role="button" tabindex="0"'});});
        h3+=cardHTML(p.incoming,{noDesc:true,cls:"is-mini is-playable is-new",tag:"جديد",attr:' data-tok="x3" role="button" tabindex="0"'});
        return h3+"</div>";
      }
      case "defend":{
        var h4=p.hit,why={
          snake:"تعبان هيلدغك: من خانة "+h4.from+" لخانة "+h4.to,curse:"خانة لعنة! هترجع 4 خانات.",
          trap:"فخ اشتغل عليك: "+trapName(h4.tt),steal:nameOf(h4.by)+" بيسرق كارت منك.",
          swap:nameOf(h4.by)+" عايز يبدّل مكانه معاك.",tax:"ضريبة المتصدر: هترجع 5 خانات.",ambush:"كمين! هترجع 3 خانات."}[h4.kind]||"في ضربة جاية.";
        var h5='<div class="sn-pt warn"><b>تصدّ الضربة؟</b><small>'+esc(why)+'</small></div><div class="sn-pbs col">';
        L.forEach(function(t){
          if(t==="w")h5+=btn("w",'<i>'+ic("shield",20)+'</i><span><b>استخدم الحماية</b><small>بتلغي الضربة، حتى التعبان</small></span>',"good");
          else if(t.charAt(0)==="a"){var cid=P.hand[+t.charAt(1)];h5+=btn(t,'<i>'+ic(cid,20)+'</i><span><b>استخدم '+esc(cardAr(cid))+"</b><small>"+esc(E.CARDS[cid].da)+"</small></span>","good");}
        });
        return h5+btn("n","خد الضربة","ghost")+"</div>";
      }
      default:return"";
    }
  }

  /* ---------- رسم الحالة النهائية وأزرار القرار ---------- */
  function settle(){
    if(destroyed||running||queue.length)return;
    var vs=viewSeat();
    renderMeta();renderBanner();
    if(sh.over){
      board.setTargets(null);board.render(sh,vs);board.setTurn(-1);renderStrip();renderHand();
      el.prompt.classList.add("hidden");el.rollrow.classList.remove("hidden");
      el.roll.disabled=true;el.roll.classList.remove("is-go");el.roll.textContent="المباراة خلصت";
      if(UI)UI.setDie(el.die,lastDie,true);
      if(!overDone){overDone=true;setTimeout(function(){if(!destroyed&&cfg.onOver)cfg.onOver(sh);},T(900));}
      return;
    }
    var p=sh.pend,mine=cfg.canAct(p.seat),L=E.legal(sh);
    board.render(sh,vs);board.setTurn(sh.turn);
    // أهداف على اللوحة
    var spec=null;
    if(mine&&(p.t==="target"||p.t==="steal")){
      spec={cells:[],jumps:[],seats:[]};
      L.forEach(function(t){var c=t.charAt(0);if(c==="c")spec.cells.push(+t.slice(1));else if(c==="j")spec.jumps.push(+t.slice(1));else if(c==="t")spec.seats.push(+t.slice(1));});
    }
    curSpec=spec;
    board.setTargets(spec,function(tok){trySend(tok);});
    renderStrip();renderHand();
    // زرار الرمي / القرار
    var onRoll=p.t==="roll";
    if(onRoll||!mine){
      el.prompt.classList.add("hidden");el.prompt.innerHTML="";el.rollrow.classList.remove("hidden");
      var can=mine&&onRoll&&!locked;
      el.roll.disabled=!can;el.roll.classList.toggle("is-go",can);
      el.roll.textContent=can?(sh.loaded?"ارمي مرتين":"ارمي النرد"):"استنى...";
      var nm=nmH(p.seat),txt="";
      if(mine&&onRoll)txt=sh.loaded?"نرد مزوّر! ارمي مرتين وخد واحدة":(sh.cardUsed?"لعبت كارت. دلوقتي ارمي النرد":"دورك. ارمي النرد"+(sh.players[p.seat].hand.length&&sh.opts.style==="chaos"?" أو العب كارت":""));
      else if(onRoll)txt=nm+" هيرمي النرد...";
      else txt=nm+({target:" بيختار هدف...",steal:" بيسرق...",pick:" بيختار نرد...",fork:" عند مفترق الطرق...",discard:" إيده مليانة...",defend:" ممكن يصدّ الضربة..."}[p.t]||" بيختار...");
      if(UI&&!el.die2.classList.contains("hidden")&&p.t!=="pick"&&p.t!=="roll")el.die2.classList.add("hidden");
      el.status.innerHTML=txt;
    }else{
      el.rollrow.classList.add("hidden");
      el.prompt.classList.remove("hidden");el.prompt.innerHTML=promptHTML(p,L);bindPrompt();
      el.status.innerHTML=({target:"اختار الهدف",steal:"اختار مين تسرقه",pick:"اختار نرد",fork:"اختار طريق",discard:"اختار كارت ترميه",defend:"تصدّ الضربة؟"}[p.t]||"");
    }
    if(UI)UI.autoPaint(el.auto);
    if(cfg.onIdle)cfg.onIdle(sh);
  }
  V.settle=settle;

  /* ---------- الطابور ---------- */
  async function pump(){
    if(running||destroyed)return;
    running=true;
    try{
      while(queue.length&&!destroyed){
        el.status.innerHTML="";
        var tok=queue.shift(),ev=E.apply(sh,tok);
        if(!ev)continue;
        for(var i=0;i<ev.length&&!destroyed;i++){
          try{await playEv(ev[i]);}catch(err){try{console.error(err);}catch(x){}}
        }
        if(destroyed)return;
        board.syncPawns(sh);renderStrip();
      }
    }finally{running=false;}
    settle();
  }
  V.feed=function(toks){
    if(destroyed)return;
    locked=false;clearTimeout(lockT);
    for(var i=0;i<toks.length;i++)queue.push(toks[i]);
    pump();
  };
  V.busy=function(){return running||queue.length>0;};
  V.destroy=function(){destroyed=true;clearTimeout(lockT);if(el.stage)el.stage.innerHTML="";};
  V.roll=function(){trySend("r");};
  el.roll.onclick=function(){trySend("r");};
  if(el.auto&&cfg.onAuto)el.auto.onclick=cfg.onAuto;
  V.setTimer=function(txt){el.tt.textContent=txt||"";};
  V.skipAnim=function(){skipStage=true;};
  V.say=say;
  dieColor(sh.turn);
  board.render(sh,viewSeat());board.setTurn(sh.over?-1:sh.turn);
  renderStrip();renderMeta();renderBanner();renderHand();
  say(nmH(sh.turn)+" بيبدأ.",false);
  setTimeout(settle,0);
  return V;
}

/* ---------- نتيجة المباراة (مشتركة) ---------- */
function resultHTML(sh,names,colors,o){
  o=o||{};
  var rows=sh.ranking.map(function(s,i){
    var p=sh.players[s],pts=o.points&&o.points[s]?" · +"+o.points[s]+" نقطة":"";
    var sub=p.ghost?"خرج من اللعبة":(p.fin?"وصل 100":"وقف عند خانة "+p.pos);
    return'<div class="c-'+colors[s]+'"><em>'+(i+1)+'</em><b dir="auto">'+esc(names[s])+"</b><small>"+sub+" · لدغات: "+p.st.bites+" · سلالم: "+p.st.climbs+pts+"</small></div>";
  }).join("");
  return rows;
}

window.SnakeUI={makeBoard:makeBoard,createView:createView,playHTML:playHTML,resultHTML:resultHTML,cardHTML:cardHTML,ic:ic,IC:IC,SEAT_LAYOUT:SEAT_LAYOUT,CNAME:CNAME,HEX:HEX,sfx:sfx,esc:esc,sleep:sleep,reduce:reduce,
  setMuted:function(m){muted=!!m;try{localStorage.setItem("snakeMute",muted?"1":"0");}catch(e){}},isMuted:function(){return muted;}};

/* =========================================================
   3) اللعب الأوفلاين: إعدادات، كمبيوتر، حفظ، إحصائيات
========================================================= */
var root=$("snake");
if(!root)return;
var KEY_SET="snakeSettings",KEY_SAVE="snakeSave",KEY_STATS="snakeStats",KEY_ACH="snakeAch";
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function lsDel(k){try{localStorage.removeItem(k);}catch(e){}}
function toast_(m){try{toast(m);}catch(e){}}
var UI=window.LudoUI;

var TYPES=["human","easy","mid","hard","off"];
var TLABEL={human:"لاعب",easy:"كمبيوتر · سهل",mid:"كمبيوتر · متوسط",hard:"كمبيوتر · صعب",off:"مقفول"};
var COLS=["red","green","yellow","blue"];
function defCfg(){
  return{seats:[{c:"red",t:"human",name:""},{c:"green",t:"mid",name:""},{c:"yellow",t:"off",name:""},{c:"blue",t:"off",name:""}],chaos:true,surv:false,full:false,timer:0};
}
var cfg=defCfg(),G=null,M=null,view=null,cpuT=0,tickT=0,timerKey="",lastHuman=-1,finalShown=false;

function loadSettings(){
  var s=lsGet(KEY_SET,null),d=defCfg();
  if(s&&s.seats&&s.seats.length===4){
    cfg.seats=s.seats.map(function(x,i){return{c:COLS[i],t:TYPES.indexOf(x.t)>=0?x.t:d.seats[i].t,name:String(x.name||"").slice(0,12)};});
    cfg.chaos=s.chaos!==false;cfg.surv=!!s.surv&&cfg.chaos;cfg.full=!!s.full;cfg.timer=[0,15,30,45].indexOf(s.timer)>=0?s.timer:0;
  }else cfg=d;
}
function saveSettings(){lsSet(KEY_SET,cfg);}
function autoOn(){return UI?UI.autoGet():false;}
function spM(){var s="normal";try{s=localStorage.getItem("snakeSpeed")||"normal";}catch(e){}return SPEEDM[s]||1;}

/* ---------- الإعدادات ---------- */
function seatRows(){
  var host=$("snSeats");
  if(!host.children.length){
    COLS.forEach(function(c){
      var d=document.createElement("div");d.className="sn-seat c-"+c;d.dataset.c=c;
      d.innerHTML='<span class="sn-dot"></span><input class="sn-nm-in" maxlength="12" autocomplete="off" aria-label="'+CNAME[c]+' name"><button type="button" class="sn-cyc"></button>';
      host.appendChild(d);
    });
    host.addEventListener("click",function(e){
      var b=e.target.closest(".sn-cyc");if(!b)return;
      var c=b.parentNode.dataset.c;captureNames();
      var s=cfg.seats[COLS.indexOf(c)],i=TYPES.indexOf(s.t);
      s.t=TYPES[(i+1)%TYPES.length];
      saveSettings();syncSetup();sfx("click");
    });
  }
}
function captureNames(){
  [].forEach.call($("snSeats").children,function(row,i){
    var inp=row.querySelector("input");if(inp&&!inp.disabled)cfg.seats[i].name=inp.value.trim().slice(0,12);
  });
}
function syncSetup(){
  [].forEach.call($("snSeats").children,function(row,i){
    var s=cfg.seats[i],inp=row.querySelector("input"),b=row.querySelector(".sn-cyc");
    row.classList.toggle("is-off",s.t==="off");
    inp.disabled=s.t!=="human";
    inp.value=s.t==="human"?s.name:"";
    inp.placeholder=s.t==="human"?"لاعب "+(i+1):(s.t==="off"?"—":"كمبيوتر "+CNAME[s.c]);
    b.textContent=TLABEL[s.t];b.className="sn-cyc t-"+s.t;
  });
  $("snSwChaos").classList.toggle("on",cfg.chaos);
  $("snSwSurv").classList.toggle("on",cfg.surv&&cfg.chaos);
  $("snSwSurv").classList.toggle("is-dis",!cfg.chaos);
  $("snSwFull").classList.toggle("on",cfg.full);
  [].forEach.call($("snTimerSeg").children,function(b){b.classList.toggle("on",+b.dataset.v===cfg.timer);});
  var sp="normal";try{sp=localStorage.getItem("snakeSpeed")||"normal";}catch(e){}
  [].forEach.call($("snSpeedSeg").children,function(b){b.classList.toggle("on",b.dataset.v===sp);});
  var ds="real";try{ds=localStorage.getItem("ludoDiceStyle")==="flat"?"flat":"real";}catch(e){}
  [].forEach.call($("snDiceSeg").children,function(b){b.classList.toggle("on",b.dataset.v===ds);});
  var sv=lsGet(KEY_SAVE,null),ok=savedOk(sv);
  $("snResume").classList.toggle("hidden",!ok);
  if(ok)$("snResumeTxt").textContent="الجولة "+sv.G.round+" · "+sv.M.names.join("، ");
}
function showView(name){
  ["Setup","Play","Stats"].forEach(function(n){$("sn"+n).classList.toggle("hidden",n.toLowerCase()!==name);});
  $("snGear").classList.toggle("is-off",name!=="play");
  window.scrollTo(0,0);
}
function playing(){return!$("snPlay").classList.contains("hidden");}

/* ---------- مباراة جديدة ---------- */
function mkNames(act){
  return act.map(function(s){return s.t==="human"?(s.name||("لاعب "+(cfg.seats.indexOf(s)+1))):CNAME[s.c];});
}
function newGame(){
  captureNames();
  var act=cfg.seats.filter(function(s){return s.t!=="off";});
  if(act.length<2){toast_("اختار لاعبين اتنين على الأقل");return false;}
  var humans=act.filter(function(s){return s.t==="human";}).length;
  if(!humans&&!confirm("مفيش لاعبين بشر. تتفرج على الكمبيوتر وهو بيلعب؟"))return false;
  var seed=PPR.seed31(),first=PPR.int(act.length);
  var opts={style:cfg.chaos?"chaos":"classic",surv:cfg.chaos&&cfg.surv,full:cfg.full};
  G=E.init(act.length,opts,seed,first);
  M={names:mkNames(act),colors:act.map(function(s){return s.c;}),types:act.map(function(s){return s.t;})};
  lastHuman=-1;
  return true;
}
function savedOk(sv){return!!(sv&&sv.v===1&&sv.G&&sv.G.v===1&&!sv.G.over&&sv.M&&sv.M.names&&sv.M.names.length===sv.G.n&&(sv.G.sp||[]).every(function(x){return x.t!=="gate";}));}   /* مباراة محفوظة من نسخة فيها بوابات: بتتتجاهل */
function saveGame(){if(G&&!G.over)lsSet(KEY_SAVE,{v:1,G:G,M:M,t:Date.now()});}
function clearSave(){lsDel(KEY_SAVE);}

function humanSeats(){return M.types.map(function(t,i){return t==="human"?i:-1;}).filter(function(i){return i>=0;});}
function viewSeatOff(){
  var hs=humanSeats();if(!hs.length)return-1;
  var sh=view&&view.sh?view.sh:G,p=sh&&!sh.over&&sh.pend?sh.pend.seat:-1;
  if(p>=0&&M.types[p]==="human")lastHuman=p;
  if(lastHuman<0)lastHuman=hs[0];
  return lastHuman;
}
function enterPlay(){
  showView("play");finalShown=false;
  $("snFinal").classList.add("hidden");$("snQuit").classList.add("hidden");
  if(view)view.destroy();
  clearTimeout(cpuT);stopTimer();timerKey="";
  var host=$("snPlayHost");host.innerHTML=playHTML();
  var multi=humanSeats().length>1;
  view=createView(host,{
    state:E.clone(G),names:M.names,colors:M.colors,
    canAct:function(seat){return M.types[seat]==="human";},
    viewSeat:viewSeatOff,
    reveal:function(seat){return multi?M.types[seat]==="human":M.types[seat]==="human";},
    isCpu:function(seat){return M.types[seat]!=="human";},
    hideYou:multi,
    send:function(tok){doTok(tok);},
    onIdle:drive,onOver:finish,onAuto:snakeAuto
  });
  UI&&UI.autoPaint(host.querySelector(".sn-auto"));
}
function doTok(tok){
  if(!G||G.over||!view)return false;
  var ev=E.apply(G,tok);if(!ev)return false;
  stopTimer();clearTimeout(cpuT);
  view.feed([tok]);saveGame();
  return true;
}

/* ---------- الدور: كمبيوتر / رمي تلقائي / مؤقت ---------- */
function drive(){
  if(!G||G.over||!view||view.busy()||!playing())return;
  var p=G.pend,type=M.types[p.seat],key=G.seq+":"+p.t+p.seat;
  clearTimeout(cpuT);
  if(type!=="human"){
    var delay=UI&&UI.reduce()?150:Math.round((p.t==="roll"?900:760)*spM());
    cpuT=setTimeout(function(){
      if(!G||G.over||!view||view.busy()||!playing())return;
      doTok(E.ai(G,type));
    },delay);
    return;
  }
  if(p.t==="roll"&&autoOn()){
    cpuT=setTimeout(function(){
      if(!G||G.over||!view||view.busy()||!playing()||!autoOn())return;
      if(G.pend.t==="roll"&&M.types[G.pend.seat]==="human")doTok("r");
    },UI&&UI.reduce()?120:650);
    return;
  }
  if(timerKey!==key){timerKey=key;startTimer();}
}
var tLeft=0;
function startTimer(){
  stopTimer();
  if(!cfg.timer||!G||G.over)return;
  tLeft=cfg.timer;paintTimer();
  tickT=setInterval(function(){
    if(!G||G.over||!view||!playing()||$("snQuit").classList.contains("hidden")===false){return;}
    tLeft--;paintTimer();
    if(tLeft<=0){
      stopTimer();toast_("الوقت خلص. الكمبيوتر هيقرر عنك");
      if(!view.busy())doTok(E.ai(G,"mid"));
    }
  },1000);
}
function stopTimer(){clearInterval(tickT);tickT=0;if(view&&view.setTimer)view.setTimer("");}
function paintTimer(){if(view)view.setTimer("⏱ "+tLeft+" ث");}

/* ---------- نهاية المباراة + إحصائيات ---------- */
var ACH=[
  {k:"first",n:"أول فوز",d:"اكسب أول مباراة ليك",f:function(s){return s.wins>=1;}},
  {k:"w5",n:"فايز منتظم",d:"اكسب 5 مباريات",f:function(s){return s.wins>=5;}},
  {k:"w10",n:"سيد السلالم",d:"اكسب 10 مباريات",f:function(s){return s.wins>=10;}},
  {k:"cb",n:"عودة أسطورية",d:"اكسب بعد ما تتأخر عن المتصدر 40 خانة أو أكتر",f:function(s){return!!s.flags.cb;}},
  {k:"clean",n:"إيد نضيفة",d:"اكسب من غير ما تلعب كارت أو تستخدم حماية",f:function(s){return!!s.flags.clean;}},
  {k:"dodge",n:"متفادي التعابين",d:"صدّ 3 لدغات تعبان في مباراة واحدة",f:function(s){return!!s.flags.dodge;}},
  {k:"heist",n:"نشّال",d:"اسرق كارتين في مباراة واحدة",f:function(s){return!!s.flags.heist;}},
  {k:"iron",n:"قلب حديد",d:"اكسب مباراة نجاة",f:function(s){return!!s.flags.iron;}},
  {k:"trap",n:"صاحب الفخاخ",d:"اوقّع خصمين في فخاخك في مباراة واحدة",f:function(s){return!!s.flags.trap;}},
  {k:"hard",n:"قاتل العمالقة",d:"اهزم كمبيوتر صعب",f:function(s){return!!s.flags.hard;}},
  {k:"streak",n:"على نار",d:"اكسب 3 مباريات ورا بعض",f:function(s){return s.bestStreak>=3;}}
];
function defStats(){return{games:0,wins:0,losses:0,bites:0,climbs:0,steals:0,blocks:0,bestStreak:0,streak:0,flags:{}};}
function recordStats(sh){
  if(sh.statsDone)return;sh.statsDone=true;
  var hs=humanSeats();if(!hs.length)return;
  var h=hs[0],P=sh.players[h],win=sh.winner===h,s=Object.assign(defStats(),lsGet(KEY_STATS,{}));s.flags=s.flags||{};
  s.games++;if(win){s.wins++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak);}else{s.losses++;s.streak=0;}
  s.bites+=P.st.bites;s.climbs+=P.st.climbs;s.steals+=P.st.steals;s.blocks+=P.st.wardUsed;
  if(win&&P.st.gap>=40)s.flags.cb=1;
  if(win&&P.st.used===0&&P.st.wardUsed===0)s.flags.clean=1;
  if(P.st.dodged>=3)s.flags.dodge=1;
  if(P.st.steals>=2)s.flags.heist=1;
  if(win&&sh.opts.surv)s.flags.iron=1;
  if(P.st.sprung>=2)s.flags.trap=1;
  if(win&&M.types.indexOf("hard")>=0)s.flags.hard=1;
  var had=lsGet(KEY_ACH,{}),now=Object.assign({},had),fresh=[];
  ACH.forEach(function(a){if(!now[a.k]&&a.f(s)){now[a.k]=1;fresh.push(a.n);}});
  lsSet(KEY_STATS,s);lsSet(KEY_ACH,now);
  if(fresh.length)setTimeout(function(){toast_("إنجاز جديد: "+fresh.join("، "));},1600);
}
function finish(sh){
  if(finalShown||!G||!G.over)return;finalShown=true;
  stopTimer();clearTimeout(cpuT);clearSave();recordStats(G);sfx("win");
  var w=G.winner;
  $("snWinCard").className="sn-final-card c-"+M.colors[w];
  $("snWinTitle").textContent="الفايز: "+M.names[w];
  $("snWinSub").textContent="الجولة "+G.round+" · "+(G.opts.style==="classic"?"كلاسيك":"فوضى")+(G.opts.surv?" · نجاة":"");
  $("snRank").innerHTML=resultHTML(G,M.names,M.colors);
  $("snFinal").classList.remove("hidden");
  var ag=$("snAgain");if(ag)ag.focus({preventScroll:true});
}
function renderStats(){
  var s=Object.assign(defStats(),lsGet(KEY_STATS,{})),got=lsGet(KEY_ACH,{}),rate=s.games?Math.round(s.wins/s.games*100):0;
  $("snKpis").innerHTML=[["المباريات",s.games],["الفوز",s.wins],["نسبة الفوز",rate+"%"],["لدغات التعابين",s.bites],["سلالم طلعتها",s.climbs],["كروت سرقتها",s.steals],["ضربات صدّيتها",s.blocks],["أفضل سلسلة",s.bestStreak]]
    .map(function(a){return"<div><b>"+a[1]+"</b><small>"+a[0]+"</small></div>";}).join("");
  $("snAchs").innerHTML=ACH.map(function(a){return'<div class="sn-ach'+(got[a.k]?" on":"")+'"><i>'+(got[a.k]?"✓":"•")+"</i><span><b>"+a.n+"</b><small>"+a.d+"</small></span></div>";}).join("");
}

/* ---------- أزرار الصفحة ---------- */
window.snakeOpen=function(){
  loadSettings();seatRows();
  clearTimeout(cpuT);stopTimer();
  if(view){view.destroy();view=null;}
  syncSetup();showView("setup");show("snake");
};
window.snakeHome=function(){
  sfx("click");if(G&&!G.over&&playing())saveGame();
  clearTimeout(cpuT);stopTimer();if(view){view.destroy();view=null;}
  show("hub");
};
window.snakeBack=function(){
  if(playing()&&G&&!G.over){sfx("click");$("snQuit").classList.remove("hidden");return;}
  if(!$("snStats").classList.contains("hidden")){sfx("click");snakeShowSetup(true);return;}
  snakeHome();
};
window.snakeShowSetup=function(keep){
  sfx("click");clearTimeout(cpuT);stopTimer();
  if(G&&!G.over&&!keep)saveGame();
  if(view){view.destroy();view=null;}
  syncSetup();showView("setup");
};
window.snakeStart=function(){
  sfx("click");captureNames();saveSettings();
  if(!newGame())return;
  clearSave();enterPlay();
};
window.snakeResume=function(){
  sfx("click");var sv=lsGet(KEY_SAVE,null);
  if(!savedOk(sv)){clearSave();syncSetup();return;}
  G=sv.G;M=sv.M;lastHuman=-1;enterPlay();
};
window.snakeAuto=function(){
  if(!UI)return;
  UI.autoSet(!UI.autoGet());sfx("click");
  var b=document.querySelector("#snPlayHost .sn-auto");UI.autoPaint(b);
  toast_(UI.autoGet()?"الرمي التلقائي: شغال":"الرمي التلقائي: مقفول");
  if(view)view.settle();
};
window.snakeAgain=function(){
  sfx("click");
  var seed=PPR.seed31(),first=PPR.int(M.names.length);
  var opts=G.opts;
  G=E.init(M.names.length,opts,seed,first);lastHuman=-1;
  clearSave();enterPlay();
};
window.snakeMenu=function(){snakeShowSetup(true);};
window.snakeRestart=function(){sfx("click");if(!confirm("تبدأ المباراة من الأول؟"))return;snakeAgain();};
window.snakeQuitKeep=function(){$("snQuit").classList.add("hidden");sfx("click");};
window.snakeQuitLater=function(){saveGame();snakeShowSetup(true);};
window.snakeQuitNow=function(){clearSave();G=null;snakeShowSetup(true);};
window.snakeMute=function(){SnakeUI.setMuted(!SnakeUI.isMuted());$("snMute").textContent=SnakeUI.isMuted()?"الصوت: مقفول":"الصوت: شغال";};
window.snakeStats=function(){sfx("click");renderStats();showView("stats");};
window.snakeResetStats=function(){if(!confirm("تمسح إحصائياتك وإنجازاتك على الجهاز ده؟"))return;lsDel(KEY_STATS);lsDel(KEY_ACH);renderStats();};
window.snakePreset=function(k){
  captureNames();
  var T=k==="cpu"?["human","mid","off","off"]:k==="two"?["human","human","off","off"]:["human","human","human","human"];
  cfg.seats.forEach(function(s,i){s.t=T[i];});
  saveSettings();syncSetup();sfx("click");
};
window.snakeTog=function(k){
  captureNames();
  if(k==="chaos"){cfg.chaos=!cfg.chaos;if(!cfg.chaos)cfg.surv=false;}
  else if(k==="surv"){if(!cfg.chaos){toast_("النجاة محتاجة وضع الفوضى");return;}cfg.surv=!cfg.surv;}
  else cfg.full=!cfg.full;
  saveSettings();syncSetup();sfx("click");
};
window.snakeTimer=function(v){captureNames();cfg.timer=v;saveSettings();syncSetup();sfx("click");};
window.snakeSpeed=function(v){try{localStorage.setItem("snakeSpeed",v);}catch(e){}syncSetup();sfx("click");};
window.snakeDice=function(v){try{localStorage.setItem("ludoDiceStyle",v);}catch(e){}syncSetup();sfx("click");};
window.snakeHowTo=function(){sfx("click");$("snHow").classList.toggle("hidden");};
$("snMute").textContent=SnakeUI.isMuted()?"الصوت: مقفول":"الصوت: شغال";
})();
