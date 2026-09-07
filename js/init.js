/* =========================================================
   INIT
========================================================= */

const GAME_ROLE_GETTERS={ripper:getRipperRoles,mabhouh:getMabhouhRoles};

buildRipperRoles();
buildRipperGM();
buildMabhouhRoles();
buildMabhouhGM();
updateLiveDbStatusText();

document.getElementById("ripperName").addEventListener("keydown",e=>{
  if(e.key==="Enter")confirmRipperRole();
});

document.getElementById("ripperGmInput").addEventListener("keydown",e=>{
  if(e.key==="Enter")verifyRipperGM();
});

document.getElementById("mabhouhName").addEventListener("keydown",e=>{
  if(e.key==="Enter")confirmMabhouhRole();
});

document.getElementById("mabhouhGmInput").addEventListener("keydown",e=>{
  if(e.key==="Enter")verifyMabhouhGM();
});



/* RESTORE RIPPER */

try{
  const ripper=JSON.parse(
    localStorage.getItem("ripperPlayer")||"null"
  );

  if(ripper){
    const roles=getRipperRoles(ripper.sessionCode);
    const r=roles.find(x=>x.id===ripper.roleId);

    if(r){
      renderRipperPlayer(ripper.name,r);
    }
  }
}catch(e){}

/* RESTORE MABHOUH */

try{
  const mabhouh=JSON.parse(
    localStorage.getItem("mabhouhPlayer")||"null"
  );

  if(mabhouh){
    const roles=getMabhouhRoles(mabhouh.sessionCode);
    const r=roles.find(x=>x.id===mabhouh.roleId);

    if(r){
      renderMabhouhPlayer(mabhouh.name,r);
    }
  }
}catch(e){}

