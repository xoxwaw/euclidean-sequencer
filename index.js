const express = require('express');
var path = require('path');
const app = express();

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.use(express.static(__dirname + '/public'));

app.listen(8080, () => {
  console.log('app listening on port 8080!')
});
