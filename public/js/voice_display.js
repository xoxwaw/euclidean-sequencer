/*
Voice Display Script

    > Control enabling or disabling voices

    2 / 4 / 19 : Initial commit
    2 / 19 / 19 : Add updatePitchWrapper function for pitch changing
    2 / 22 / 19 : Add updateColor to change color based on user input
*/
console.log("voice_display.js loaded");

//initialize 3 voices
var voice1 = document.getElementById('circle1');
var voice2 = document.getElementById('circle2');
var voice3 = document.getElementById('circle3');


function updatePitchWrapper(elem, pitch_num, voice_index) {
    /*
    takes input from the keyboard and send this data to sound.js
    */
    pitch_codes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    octave_code = document.getElementById("octave_" + String(voice_index)).value;
    pitch_out = pitch_codes[pitch_num] + String(octave_code);
    updatePitch(pitch_out, voice_index - 1); //call to sound.js to change note in voice
    // update keyboard to display choice
    if (elem.classList.contains('active') == false) {
        var container = elem.parentElement;
        var children = container.children;
        for (var i = 0; i < children.length; i++) {
            children[i].classList.remove('active' + String(voice_index - 1));
        }
        elem.classList.add('active' + String(voice_index - 1));
    }
}
function updatePulseLabel(id, value){ // update the label for the pulses per measure (by voice)
  document.getElementById(id).innerHTML = "Pulses Per Measure ( " + String(value) + " )";
}
function updateOffsetLabel(id,value){ // update the label for the number of steps (global)
  document.getElementById(id).innerHTML = "Voice Offset ( " + String(value) + " )";
}
function updateStepLabel(id,value){ // update the label for the number of steps (global)
  document.getElementById(id).innerHTML = "Steps Per Measure ( " + String(value) + " )";
}

function updateColor(color, dot_index){ // updated the color for a given voice
  let root = document.documentElement;
  root.style.setProperty('--color_one', color); // change color of dot by voice number
}
