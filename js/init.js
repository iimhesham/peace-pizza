/* =========================================================
   INIT
   Loops over every registered game (see GAMES in
   games-engine.js) so a new story never needs an edit here.
========================================================= */

Object.keys(GAMES).forEach(game=>{
  buildGameRoleButtons(game);
  buildGameGM(game);

  const nameInput=document.getElementById(`${game}Name`);
  if(nameInput){
    nameInput.addEventListener("keydown",e=>{
      if(e.key==="Enter")confirmGameRole(game);
    });
  }

  const gmInput=document.getElementById(`${game}GmInput`);
  if(gmInput){
    gmInput.addEventListener("keydown",e=>{
      if(e.key==="Enter")verifyGameGM(game);
    });
  }

  /* RESTORE SAVED PLAYER */
  try{
    const saved=JSON.parse(
      localStorage.getItem(`${game}Player`)||"null"
    );

    if(saved){
      const roles=getGameRoles(game,saved.sessionCode);
      const r=roles.find(x=>x.id===saved.roleId);

      if(r){
        renderGamePlayer(game,saved.name,r);
      }
    }
  }catch(e){}
});

updateLiveDbStatusText();
