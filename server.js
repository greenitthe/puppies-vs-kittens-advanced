// Require the Express module (https://npmjs.com/package/express)
var express = require('express');

// Create a new express application instance by calling `express()`
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

//Templating
app.set('views', __dirname + 'public/views');
app.set('view engine', 'pug');

// Serve files in the 'public' directory with Express's built-in static file server
app.use(express.static('public'));

app.get('/d', function (req, res) {
  res.render('index', { title: "hey", message: "hello" });
});

// Create a Counter class that will be used to create counter objects
// See the full description in README.md
var Counter = require('./counter.js');

// Create a new Counter instance, like: `var ScoreCounter = new Counter()`
var ScoreCounter = new Counter();

//Main page
//IO
io.on('connection', function (socket) {
  io.emit('score', {puppy: ScoreCounter.retrieve('puppies'),
                    kitten: ScoreCounter.retrieve('kittens')});
  socket.on('vote', function (data) {
    //console.log('Vote received from: ' + socket.request.connection.remoteAddress);
    /** Here would be the code to check if we know this IP and it has already voted if I wanted.
     * I decided to not do that since running it from localhost means that I would have a hard time
     * voting more than once... **/
    if (data.puppies == true) {
      ScoreCounter.record('puppies');
    } else if (data.kittens == true) {
      ScoreCounter.record('kittens');
    } else {
      console.log('[WARN] Received vote with erroneous data! ', data);
    }

    io.emit('score', {puppy: ScoreCounter.retrieve('puppies'),
                      kitten: ScoreCounter.retrieve('kittens')});
  });
});

// Have the Express application listen for incoming requests on port 8080
server.listen(8080, function() {
  console.log('Puppies v Kittens server listening on port 8080.');
});
