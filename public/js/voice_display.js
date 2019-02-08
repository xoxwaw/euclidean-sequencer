/*
Voice Display Script
Porter L

    > Control enabling or disabling voices

    2 / 4 / 19 : Initial commit
*/
var voice1 = document.getElementById('circle1');
var voice2 = document.getElementById('circle2');
var voice3 = document.getElementById('circle3');

function voiceToggle(s,p){
  var voice = document.getElementById(p);
  if (s.checked){
    voice.style.visibility = 'visible';     // Show
  }
  else{
    voice.style.visibility = 'hidden';      // Hide

  }

}
