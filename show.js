function showConnected(){
  try { 
  
   document.getElementById("connectedId").style.display = "none";
   document.getElementById("mintingId").style.display = "none";
   document.getElementById("PlayId").style.display = "table";   
   document.getElementById("erroreth").style.display = "none";
   document.getElementById("drawId").style.display = "";
   document.getElementById("leaderboard").style.display = "table";
   document.getElementById("TableId").style.display = "";
    
  }
catch (e) {}
}

function showWrongNetwork(){
  try { 
   
      document.getElementById("erroreth").style.display = "table";
      document.getElementById("PlayId").style.display = "none";
      document.getElementById("withdrawId").style.display = "none";   
      document.getElementById("drawId").style.display = "none";
      document.getElementById("leaderboard").style.display = "none";
      document.getElementById("TableId").style.display = "none";
    
  }
catch (e) {}
}

function showMinting(){

  document.getElementById("PlayId").style.display = "none";
  document.getElementById("mintingId").style.display = "";
    
  
}

function DisPlay(){
  document.getElementById("PlayId").style.display = "none";
  document.getElementById("mintingId").style.display = "none";
  document.getElementById("connectedId").style.display = "none";
  document.getElementById("erroreth").style.display = "none";
 
}

function showWinner(){
  document.getElementById("withdrawId").style.display = "table";
}

function DisWinner(){
  document.getElementById("withdrawId").style.display = "none";
}

function showgrid(){
  document.getElementById("gridId").style.display = "flex";
  
  
}

