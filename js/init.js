/* =========================================================
   INIT
========================================================= */

const GAME_ROLE_GETTERS={ripper:getRipperRoles};

buildRipperRoles();
buildRipperGM();
updateLiveDbStatusText();

document.getElementById("ripperName").addEventListener("keydown",e=>{
  if(e.key==="Enter")confirmRipperRole();
});

document.getElementById("ripperGmInput").addEventListener("keydown",e=>{
  if(e.key==="Enter")verifyRipperGM();
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

