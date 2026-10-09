/* Firebase Realtime Database mock (in-memory) — enough for testing js/shankalolo.js */
function createDb(){
  let root=null; const listeners=[]; let pushN=0;
  const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const parts=p=>String(p).split("/").filter(Boolean);
  function getAt(p){let c=root;for(const k of parts(p)){if(c==null||typeof c!=="object")return null;c=c[k];if(c===undefined)return null;}return c===undefined?null:c;}
  function setAt(p,v){
    const ks=parts(p);
    if(!ks.length){root=v===undefined?null:clone(v);return;}
    if(root==null||typeof root!=="object")root={};
    let c=root;
    for(let i=0;i<ks.length-1;i++){if(c[ks[i]]==null||typeof c[ks[i]]!=="object")c[ks[i]]={};c=c[ks[i]];}
    const last=ks[ks.length-1];
    if(v===null||v===undefined)delete c[last];else c[last]=clone(v);
    // clean empty parents
    for(let n=ks.length-1;n>0;n--){const pp=ks.slice(0,n);const x=getAt(pp.join("/"));if(x&&typeof x==="object"&&!Object.keys(x).length)setAt(pp.join("/"),null);}
  }
  function snap(p){const v=getAt(p);return{val:()=>clone(v),exists:()=>v!==null,key:parts(p).pop()||null,numChildren:()=>v&&typeof v==="object"?Object.keys(v).length:0};}
  function notify(){
    listeners.slice().forEach(l=>{
      if(l.type==="value"){const j=JSON.stringify(getAt(l.path));if(j!==l.last){l.last=j;setTimeout(()=>l.cb(snap(l.path)),0);}}
      else{const cur=getAt(l.path)||{};Object.keys(cur).forEach(k=>{if(!l.seen[k]){l.seen[k]=1;setTimeout(()=>l.cb(snap(l.path+"/"+k)),0);}});}
    });
  }
  function ref(path){
    path=parts(path).join("/");
    const r={
      key:parts(path).pop()||null,
      child:c=>ref(path+"/"+c),
      set:v=>{setAt(path,v);notify();return Promise.resolve();},
      update:u=>{Object.keys(u).forEach(k=>setAt((path?path+"/":"")+k,u[k]));notify();return Promise.resolve();},
      remove:()=>{setAt(path,null);notify();return Promise.resolve();},
      push:()=>ref(path+"/-P"+String(++pushN).padStart(6,"0")),
      once:()=>Promise.resolve(snap(path)),
      orderByChild:()=>r,limitToLast:()=>r,
      on:(type,cb)=>{const l={path,type,cb,last:undefined,seen:{}};listeners.push(l);
        if(type==="value"){l.last=JSON.stringify(getAt(path));setTimeout(()=>cb(snap(path)),0);}
        else{Object.keys(getAt(path)||{}).forEach(k=>{l.seen[k]=1;setTimeout(()=>cb(snap(path+"/"+k)),0);});}
        return cb;},
      off:(t,cb)=>{for(let i=listeners.length-1;i>=0;i--)if(listeners[i].path===path&&(!cb||listeners[i].cb===cb))listeners.splice(i,1);},
      transaction:(fn,cb)=>{
        const hasL=listeners.some(l=>l.path===path&&l.type==="value");
        const real=getAt(path);
        let res;
        if(hasL){res=fn(clone(real));}
        else{
          const guess=fn(null);              // the SDK first guesses with null when nothing is cached
          if(real===null)res=guess;          // server agrees with the guess
          else if(guess===undefined)res=undefined; // abort based on the guess (the real SDK gotcha)
          else res=fn(clone(real));          // mismatch: retried with the real value
        }
        const committed=res!==undefined;
        if(committed){setAt(path,res);notify();}
        const s=snap(path);
        if(cb)setTimeout(()=>cb(null,committed,s),0);
        return Promise.resolve({committed:committed,snapshot:s});
      }
    };
    return r;
  }
  return{ref,dump:()=>clone(root),get:getAt,set:setAt};
}
module.exports=createDb;
