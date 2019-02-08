const express = require('express');
var path = require('path');
const app = express();
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.use(express.static(__dirname + '/public'));

/*require("Tone", function(Tone){
    var synth = new Tone.MonoSynth();
    var seq = new Tone.Sequence(function(time, note){
	console.log(note);
//straight quater notes
}, ["C4", "E4", "G4", "A4"], "4n");
});*/


app.listen(process.env.PORT || 8080, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
