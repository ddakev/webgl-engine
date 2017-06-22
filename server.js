var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);

// serve all static files
app.use(express.static(__dirname));

// on GET request to root, send index
app.get('/', function(req, res) {
    console.log('user connected');
    res.sendFile(__dirname + '/index.html');
});

// on GET request to index, send index
app.get('/index.html', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// listen on 8080
server.listen(8080);
console.log('Listening on port 8080');