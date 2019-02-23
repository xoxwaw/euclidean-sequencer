//phi
//Feb 11
console.log("sound.js loaded");
document.documentElement.addEventListener('mousedown', () => {
    if (Tone.context.state !== 'running') Tone.context.resume();
}); //fix Chrome constraints when you have to trigger to play music
global.step_val = 1;
global.num_cycle = 3;
const synths = [
    new Tone.Synth(),
    new Tone.Synth(),
    new Tone.Synth()
]; //synth initializtion



const gain = new Tone.Gain(0.5);
gain.toMaster(); //gain volume

synths.forEach(synth => synth.connect(gain));

let wave_type = 'sine';
	tempo = '8n';

synths[0].oscillator.type = wave_type;
synths[1].oscillator.type = wave_type;
synths[2].oscillator.type = wave_type;

function makeEuclidSeq(steps, pulses){//euclid function
	let seq = [];
	let x = -1;
	let y = 0;
	for(let s =0; s < steps; s++){
		if(y >= x+1){
			x++;
			seq.push(1);
		}
		else {
			seq.push(0);
		}
		y = y + (pulses/steps);
	}
	return seq;
}

function offset(seq_in, offset){//return sequence array rotated by offset value
	steps = seq_in.length;
	offset = offset % steps; //fix if offset is longer than sequence
	let seq_front = seq_in.slice(0, steps - offset);
	let seq_back = seq_in.slice(steps - offset);
	let seq_out = seq_back.concat(seq_front);
	return seq_out;
}

function updatePitch(pitch_code, voice_number){
  notes[voice_number] = pitch_code;
  // set the pitch of a specific voice. input comes from updatePitchWrapper
  // in voice_display.js which connects to the UI.
}

function updateDisplay(){
    var parent_voice = document.getElementById("controlbtns");
    var children_voice = parent_voice.children;
    for (var i = 1; i < children_voice.length; i++){
        if (i > global.num_cycle){
            children_voice[i].style.display = "none";
            document.getElementById("circle"+i).style.display = "none";
        }else{
            children_voice[i].style.display = "block";
            document.getElementById("circle"+i).style.display = "block";
        }
    }
}

function addVoice(){
    cycles.push(makeEuclidSeq(global.step_val,1));
    global.num_cycle += 1;
    updateDisplay()

}
function removeVoice(){
    cycles.pop();
    global.num_cycle -= 1;
    updateDisplay();
}

var cycles = [makeEuclidSeq(1,1),makeEuclidSeq(1,1),makeEuclidSeq(1,1)],
    notes = ['G5', 'E4', 'C3'];//sample sequencer
let index = 0;

Tone.Transport.scheduleRepeat(loop, "8n");
Tone.Transport.start();

function loop(time) {
    if (document.getElementById("step_val") != null){
        global.step_val = document.getElementById("step_val").value;
    }
    let step = index % global.step_val;
    // document.getElementById("step_counter").innerHTML = step; //output step # to screen
    for (let i = 0; i < cycles.length; i++) {
        let synth = synths[i],
            note = notes[i],
            cycle = global.cycles[i],
            input = cycle[step];
        // console.log(note, cycle[i]);
        if (input == 1) synth.triggerAttackRelease(note, "8n", time); //play the note if the current buffer is 1
    }
    activeStep(step);
    index++;
}

function updateWave(voice,wave){
	voice = voice - 1;
	synths[voice].oscillator.type = wave;
}

function generateBinarySequence(step, pulse){
    sequence = [];
    for (var i = 0; i < step; i++){
        sequence[i] = (i%pulse == 0 ? 1 : 0);
    }
    return sequence;
}

function updateSeq(){  // call on change to update information
  var steps = 1, pulse_one = 1, pulse_two = 1, pulse_three = 1, pulses = [],cycles = [];
  if (document.getElementById("step_val")!= null){
      global.step_val = document.getElementById("step_val").value;
      for (var j = 1; j < 4; j++){
          pulses.push(document.getElementById("pulse_val_"+j).value);
      }
  }
  for (var j = 0; j < 3; j++){
      cycles.push(makeEuclidSeq(global.step_val,pulses[j]));
  }
  global.cycles = cycles;
  // var tempo = (document.getElementById("tempo_val").value) + 'n';
  // cycles = [makeEuclidSeq(steps,pulse_one),makeEuclidSeq(steps,pulse_two),makeEuclidSeq(steps,pulse_three)]
}
function activeStep(current_step){ // set the active step to dot_active class
  voices = ['circle1','circle2','circle3'];
  for (let i = 0; i < voices.length; i++){ // iterate over i voices
    var container = document.getElementById(voices[i]);
    if (container != null){
        var children = container.children;
        for (let j = 0; j < children.length; j++){ // iterate over j children of voice i
          children[j].setAttribute('id', 'dot'+String(i+1)); // reset the class of all children in voice i
        }
        children[current_step].setAttribute('id', 'dot_active'); // set active step to be of different subclass
        // this way it will be a different color.
    }
  }
}
