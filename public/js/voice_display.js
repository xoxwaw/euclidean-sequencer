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
function updatePitch(elem, pitchNum){
  console.log(elem);
  console.log(pitchNum);

  if (elem.classList.contains('active') == false){
    var container = elem.parentElement;
    var children = container.children;

    for (var i = 0; i < children.length; i++) {
      children[i].classList.remove('active');
      // Do stuff
    }
    elem.classList.add('active');
  }

}
