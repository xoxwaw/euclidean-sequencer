const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');

const app = express();
app.use(favicon(path.join(__dirname,'public','img','euclid.ico')));

app.set('view engine', 'ejs');
app.get('/', function(req, res) {
    res.render("index",{
        numCycles: 6
    })
});

app.use(express.static(__dirname + '/public'));


app.listen(process.env.PORT || 8080, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
