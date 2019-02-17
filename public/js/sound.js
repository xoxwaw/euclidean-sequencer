//phi
//Feb 11
document.documentElement.addEventListener('mousedown', () => {
    if (Tone.context.state !== 'running') Tone.context.resume();
}); //fix Chrome constraints when you have to trigger to play music

const synths = [
    new Tone.Synth(),
    new Tone.Synth(),
    new Tone.Synth()
]; //synth initializtion

synths[0].oscillator.type = 'triangle';
synths[1].oscillator.type = 'sine';
synths[2].oscillator.type = 'sawtooth';

const gain = new Tone.Gain(0.5);
gain.toMaster(); //gain volume

synths.forEach(synth => synth.connect(gain));

let stepCount = 8
let pulseCount = 3




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
	console.log(seq);
	return seq;
}


var cycles = [makeEuclidSeq(8,6),makeEuclidSeq(8,5),makeEuclidSeq(8,3)],
      notes = ['G5', 'E4', 'C3'];//sample sequencer
let index = 0;

Tone.Transport.scheduleRepeat(loop, '8n');
Tone.Transport.start();

function loop(time) {
    let step = index % 8;
    for (let i = 0; i < cycles.length; i++) {
        let synth = synths[i],
            note = notes[i],
            cycle = cycles[i],
            input = cycle[step];
        if (input == 1) synth.triggerAttackRelease(note, '8n', time); //play the note if the current buffer is 1
    } //
    index++;
}

function generateBinarySequence(step){
    sequence = [];
    for (var i = 0; i < 16; i++){
        sequence[i] = (i%step == 0 ? 1 : 0);
    }
    return sequence;
}

function updateSeq(){  // call on change to update information
  var steps = document.getElementById("step_val").value;
  var pulse_one = document.getElementById("pulse_val_one").value;
  var pulse_two = document.getElementById("pulse_val_two").value;
  var pulse_three = document.getElementById("pulse_val_three").value;
  cycles = [makeEuclidSeq(steps,pulse_one),makeEuclidSeq(steps,pulse_two),makeEuclidSeq(steps,pulse_three)]
}
