// create a new synth and route the output to master
const synth = new Tone.Synth().toMaster();
// play a note with the synth we setup
synth.triggerAttackRelease("C2", "8n");
