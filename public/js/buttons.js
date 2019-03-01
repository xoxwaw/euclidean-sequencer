// Functions for play and link buttons

var paused = true;

function buttonPlay() {
    console.log('play button press');
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