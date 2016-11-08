// Require the Express module (https://npmjs.com/package/express)
var express = require('express');

// Create a new express application instance by calling `express()`
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Whether only 1 vote per IP
var limitingResponses = true;
var votedIPs = [];

//Databases n stuff
var redis = require("redis");
var redisClient = redis.createClient();
redisClient.on("error", function (err) {
  console.log("Error " + err);
});
function getMessageByKey(key, callback) {
  redisClient.get(key, function(err, reply) {
    return callback(reply);
  });
}

//Templating
app.set('view engine', 'pug');

// Serve files in the 'public' directory with Express's built-in static file server
app.use(express.static('public'));

app.get('/', function (req, res) {
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
  io.emit('resLimResponse', { status: limitingResponses });
  socket.on('limits', function (data) {
    if (data.toggle) {
      if (limitingResponses == true) {
        limitingResponses = false;
      } else {
        limitingResponses = true;
      }
      io.emit('resLimResponse', { status: limitingResponses });
    }
  });
  socket.on('vote', function (data) {
    //console.log('Vote received from: ' + socket.request.connection.remoteAddress);
    /** Here would be the code to check if we know this IP and it has already voted if I wanted.
     * I decided to not do that since running it from localhost means that I would have a hard time
     * voting more than once... **/
    if ((limitingResponses == false) || (votedIPs.indexOf(socket.request.connection.remoteAddress) == -1)) {
      votedIPs.push(socket.request.connection.remoteAddress);
      redisClient.SADD('votedIPs', socket.request.connection.remoteAddress);
      redisClient.SMEMBERS('votedIPs', function(err, reply) {
        return reply;
      });
      if (data.puppies == true) {
        ScoreCounter.record('puppies');
        redisClient.set("puppyVotes", ScoreCounter.retrieve('puppies'));
      } else if (data.kittens == true) {
        ScoreCounter.record('kittens');
        redisClient.set("kittenVotes", ScoreCounter.retrieve('kittens'));
      } else {
        console.log('[WARN] Received vote with erroneous data! ', data);
      }
      io.emit('score', {puppy: ScoreCounter.retrieve('puppies'),
                        kitten: ScoreCounter.retrieve('kittens')});
    }
  });
});

// Have the Express application listen for incoming requests on port 8080
server.listen(8080, function() {
  console.log('Puppies v Kittens server listening on port 8080.');
  console.log('[INFO] Redis server must be running already for server to connect.');
  redisClient.on('connect', function() {
    console.log('Connected to redis server');
    console.log('Fetching saved votes from database...');
    try {
      redisClient.setnx('puppyVotes', 0);
      getMessageByKey('puppyVotes', function (data) {
        ScoreCounter.set('puppies', data);
        console.log("Puppies: " + ScoreCounter.retrieve('puppies'));
      });
      redisClient.setnx('kittenVotes', 0);
      getMessageByKey('kittenVotes', function (data) {
        ScoreCounter.set('kittens', data);
        console.log("Kittens: " + ScoreCounter.retrieve('kittens'));
      });
      redisClient.SMEMBERS('votedIPs', function(err, reply) {
        votedIPs = reply;
        console.log('Loaded already voted IPs from database.');
      });
    }
    catch (err) {
      console.log('Unsuccessful in fetching votes... See: ' + err);
    }
  });
});
