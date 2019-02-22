/*
Voice Display Script
Porter L

    > Control enabling or disabling voices

    2 / 4 / 19 : Initial commit
*/
console.log("voice_display.js loaded");

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

function updatePitchWrapper(elem, pitch_num, voice_index){
  pitch_codes = ['C5','C#5','D5','D#5','E5','F5','F#5','G5','G#5','A5','A#5','B5']
  updatePitch(pitch_codes[pitch_num], voice_index);  //call to sound.js to change note in voice
  // update keyboard to display choice
  if (elem.classList.contains('active') == false){
    var container = elem.parentElement;
    var children = container.children;
    for (var i = 0; i < children.length; i++) {
      children[i].classList.remove('active');
    }
    elem.classList.add('active');
  }
}
