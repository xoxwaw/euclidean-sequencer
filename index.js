const express = require('express');
var path = require('path');
require("midi");
const app = express();
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.use(express.static(__dirname + '/public'));


window.onload = function () {
	MIDI.loadPlugin({
		soundfontUrl: "./soundfont/",
		instrument: "acoustic_grand_piano",
		onprogress: function(state, progress) {
			console.log(state, progress);
		},
		onsuccess: function() {
			var delay = 0; // play one note every quarter second
			var note = 50; // the MIDI note
			var velocity = 127; // how hard the note hits
			// play the note
			MIDI.setVolume(0, 127);
			MIDI.noteOn(0, note, velocity, delay);
			MIDI.noteOff(0, note, delay + 0.75);
		}
	});
};



app.listen(process.env.PORT || 8080, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
