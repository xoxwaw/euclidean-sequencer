// Functions for play and link buttons

var paused = true;  // in the default state the app is paused
function buttonPlay(){ // control the toggle between paused and unpaused
  if (paused == false){
    Tone.Transport.stop();
    paused = true;
  }else{
    Tone.Transport.start();
    paused = false;
  }
}

function buttonGit(){ // open the git repository for the project in new tab
  window.open('https://github.com/hungphi98/euclidean-sequencer');
}
