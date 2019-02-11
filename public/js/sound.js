console.clear();

// UPDATE: there is a problem in chrome with starting audio context
//  before a user gesture. This fixes it.
document.documentElement.addEventListener('mousedown', () => {
  if (Tone.context.state !== 'running') Tone.context.resume();
});

const synths = [
  new Tone.Synth(),
  new Tone.Synth(),
  new Tone.Synth()
];

synths[0].oscillator.type = 'triangle';
synths[1].oscillator.type = 'sine';
synths[2].oscillator.type = 'sawtooth';

const gain = new Tone.Gain(0.6);
gain.toMaster();

synths.forEach(synth => synth.connect(gain));

const $rows = [[0,1,0,1,0,1,0,1],[1,0,0,1,0,0,1,0],[1,0,0,0,1,0,0,0,0]],
      notes = ['G5', 'E4', 'C3'];
let index = 0;

Tone.Transport.scheduleRepeat(repeat, '8n');
Tone.Transport.start();

function repeat(time) {
  let step = index % 8;
  for (let i = 0; i < $rows.length; i++) {
    let synth = synths[i],
        note = notes[i],
        $row = $rows[i],
        $input = $row[step];
    if ($input == 1) synth.triggerAttackRelease(note, '8n', time);
  }
  index++;
}
