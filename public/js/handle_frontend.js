/*
Arrange Radial Script

    > Arrange divs in a euclidian circle in parent

    2 / 3 / 19 : Initial commit + add templates
    2 / 4 / 19 : Fix null error
    2 / 12 / 19 : Add connections to backend and populate all function for general
    2 / 12 / 19 : rewrite the functions to clean up code space
*/
console.log("arrange_radial.js loaded");

var dot_template = []; //initialization of all the dots

for (var i = 0; i < global.num_cycle; i++) {
    /*
    update all the dots at the load
    */
    let template = document.createElement('div');
    template.setAttribute('class', 'dot');
    template.setAttribute('id', 'dot' + String(i + 1));
    dot_template.push(template);
}

function populateAll() { //change all three voices at the same time [ THIS IS THE ONE THAT SHOULD BE CALLED ON CHANGE ( FOR GENERAL )]
    /*
    populate the dots in each circle on change
    */
    var n = 1; //default value of 1.
    if (document.getElementById("step_val") != null) {
        n = document.getElementById("step_val").value;
    } //get value of the step
    updateSeq(); //update the music
    for (var i = 1; i < global.num_cycle + 1; i++) {
        populate(n, "circle" + i, i);
    }
    pulses(); //update the visual pulses
}

function populate(n, p, m) {
    /*
    populate each circle with n dots
    */
    var parent = document.getElementById(p); //get circle id components
    if (parent) {
        parent.innerHTML = '';
        for (var x = 0; x < n; x++) {
            var cln = dot_template[m - 1].cloneNode(true);
            parent.appendChild(cln);
        }
        arrange(p); // update the circles
    }
}

function arrange(p) {
    /*
    arrange dots with euclidian spacing
    */
    var parent = document.getElementById(p); //get circle id components
    var children = parent.getElementsByTagName('div'); //get all the divs circle component
    var rad = parent.clientWidth / 2; //radian value
    var radial_dist = -360 / children.length;
    for (var x = 0; x < children.length; x++) {
        var dist_degree = radial_dist * x;
        var dist_radian = dist_degree * (Math.PI / 180);
        var coord_x = Math.cos(dist_radian) * rad + rad - 15;
        var coord_y = Math.sin(dist_radian) * rad + rad - 15;
        children[x].style.bottom = coord_x + 'px';
        children[x].style.right = coord_y + 'px';
    }
}

function setPulses(id) {
    /*
    set the pulse in each circle id component
    */
    var circle_id = "circle" + String(id + 1);
    var parent = document.getElementById(circle_id);
    var children = [];
    if (parent != null) {
        children = parent.getElementsByTagName('div');
    }
    for (var x = 0; x < cycles[id].length; x++) {
        if (children[x] != null) {
            if (cycles[id][x] == 1) {
                children[x].setAttribute('class', 'dot_pulse'); //add active style to the dot
            } else {
                children[x].setAttribute('class', 'dot'); //add inactive style to the dot
            }
        }
    }
}

function pulses() {
    for (var i = 0; i < cycles.length; i++) {
        setPulses(i);
    }
}

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
function updateTempoLabel(id,value){ // update the label for the number of steps (global)
  document.getElementById(id).innerHTML = "Global Tempo ( " + String(value) + " BPM )";
}

function updateColor(color, dot_index){ // updated the color for a given voice
  let root = document.documentElement;

  root.style.setProperty('--color_' + String(dot_index), color); // change color of dot by voice number
}

// Functions for play and link buttons

var paused = true;

function buttonPlay() {
    console.log('play button press');
    var playpause_button = document.getElementById('play_pause_button');
    playpause_button.classList.toggle("active");
    if (paused == false) {
        Tone.Transport.stop();
        paused = true;
    } else {
        Tone.Transport.start();
        paused = false;
    }
}

function buttonGit() {
    window.open('https://github.com/hungphi98/euclidean-sequencer');
}

window.onload = function() { // once page is loaded, run initial populate
    populateAll(); // on load populate with current values.
}
