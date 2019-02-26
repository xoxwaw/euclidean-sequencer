const express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
const app = express();
app.set('view engine', 'ejs');
app.get('/', function(req, res) {
    res.render("index",{
        numCycles: 6
    })
    // res.sendFile(path.join(__dirname + '/index.html'));
});

app.use(express.static(__dirname + '/public'));

// app.use(favicon(__dirname + '/public/img/icon.ico', { maxAge: 2592000000 }));

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
