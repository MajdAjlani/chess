var express = require('express');
var session  = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var flash    = require('connect-flash');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var onlineUsers = {};
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: "root",
    password: "",
    database: "game_hub"
});
var onlineUsers = {};
var current_game = {};
var vs = {};

connection.connect();

require('./config/passport')(passport); // pass passport for configuration

//use external resources (e.g css, js and images files)
app.use(express.static(__dirname + '/'));


// set up our express application
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// set the view engine to ejs
app.set('view engine', 'ejs');



// use res.render to load up an ejs view file

// required for passport
app.use(session({
  secret: 'vidyapathaisalwaysrunning',
  resave: true,
  maxAge: new Date(Date.now() + 3600000),
  saveUninitialized: true
 } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

var game_counter = 0;

io.on('connection',function (socket) {

  socket.on('registerOnlineUser',function(username){

      onlineUsers[username] = socket.id;
      socket.broadcast.emit('update_online_users',onlineUsers);
      socket.on('request_play_server',function (name) {
        socket.to(onlineUsers[name]).emit('request_play_client',username,game_counter);
        game_counter++;
      });

      socket.on('response_play_server',function (name, cur_game_id) {
        socket.to(onlineUsers[name]).emit('response_play_client',username,cur_game_id);
        current_game[cur_game_id] = {
          white  : name,
          black : username,
          position : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          history : new Array(),
          turn : 0,
          time : new Date()
      };
        vs[name] = { name: username, playRoom : cur_game_id, counter : 0};
        vs[username] = { name : name , playRoom : cur_game_id, counter : 0};
      });
      socket.on('move',function(move, position){
          current_game[vs[username].playRoom].position = position;
          current_game[vs[username].playRoom].turn ^= 1;
          current_game[vs[username].playRoom].history.push(move);
          vs[username].counter++;
          socket.to(onlineUsers[vs[username].name]).emit('resMove',move);
      });
      socket.on('Ask_for_draw', function() {
        if(vs[username].counter > 2)
        {
          vs[username].counter = 0;
          socket.to(onlineUsers[vs[username].name]).emit('Ask_for_draw');
        }
      });
      socket.on('Res_for_draw', function(res) {
        socket.to(onlineUsers[vs[username].name]).emit('Res_for_draw',res);
        if(res === true)
        {
          delete current_game[vs[username].playRoom];
          delete vs[vs[username].name];
          delete vs[username];
        }
      });
      socket.on('Resign',function() {
        socket.to(onlineUsers[vs[username].name]).emit('Resign');
          delete current_game[vs[username].playRoom];
          delete vs[vs[username].name];
          delete vs[username];
      });
      socket.on('EndGame',function() {
        delete current_game[vs[username].playRoom];
        delete vs[vs[username].name];
        delete vs[username];
      });
      socket.on('disconnect',function () {
        delete onlineUsers[username];
        socket.broadcast.emit('update_online_users',onlineUsers);
      });
  });

});

// Routing
app.get('/', function(req, res) {
  if(req.isAuthenticated())
      res.render('pages/index',{username : req.user.username,socket : onlineUsers[req.user.username]});
  else
    res.render('pages/index',{username : null,socket : null});
});


app.get('/games/chess/multi/:game_id', function(req, res) {
    if(req.isAuthenticated()){
      var side;
      var obj = current_game[req.params.game_id];
      if((obj == undefined) ||  ((req.user.username  !== obj.black) && (req.user.username  !== obj.white)))
        res.redirect('/find');
      else if (req.user.username  === obj.black)
        side = 2;
      else
        side = 1;
      d = new Date();
      time = d.getMinutes() * 60 + d.getSeconds() - (obj.time.getMinutes() * 60 + obj.time.getSeconds());
      res.render('pages/Games/chess/multi',{side : side, socket : onlineUsers[req.user.username], username : req.user.username, position : obj.position, P1 : obj.white, P2 : obj.black, turn : obj.turn, time : time, history : obj.history});
    }
    else {
      res.redirect('/login');
    }
});

app.get('/find', function(req, res) {
  if(req.isAuthenticated())
  {
      res.render('pages/Games/online_users',{ username : req.user.username, online : onlineUsers,socket : onlineUsers[req.user.username], current_game : vs[req.user.username]});
  }else
    res.redirect('/login');
});


app.get('/games/chess/single', function(req, res) {
    if(req.isAuthenticated())
      res.render('pages/Games/chess/single',{username : req.user.username,socket : onlineUsers[req.user.username]});
    else
      res.render('pages/Games/chess/single',{username : null, socket : undefined});
});

app.get('/register', function(req, res) {
  if(req.isAuthenticated())
      res.redirect('/');
    else
    // render the page and pass in any flash data if it exists
      res.render('pages/auth/register', { message: req.flash('signupMessage'), username : null });
  });


app.get('/login', function(req, res) {
      if(req.isAuthenticated()) {
          res.redirect('/');
     } else {
      // render the page and pass in any flash data if it exists
      res.render('pages/auth/login', { message: req.flash('loginMessage') , username : null});
    }
  });










app.post('/register', passport.authenticate('local-signup', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/register', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

app.get('/logout',function(req,res){
  if(req.isAuthenticated())
  {
    delete onlineUsers[req.user.username];
    req.logout();
    res.redirect('/');
  }
  else
    res.redirect('/');
});

// process the login form
app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
    }),
        function(req, res) {
            console.log("hello");
            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }

            res.redirect('/');
    });







// for 404 page error
app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    if(req.isAuthenticated())
      res.render('pages/errors/404', { url: req.url ,username:req.user.username});
    else
      res.render('pages/errors/404', { url: req.url ,username:null });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});










var port = process.env.PORT || 3000;

http.listen(port, function(){
  console.log('listening on port: '+port);
});
