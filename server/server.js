var server = require('nodebootstrap-server');
var CronJob = require('cron').CronJob;
var request = require('request');

setInterval(function(){
  console.log("...");
},1000);

new CronJob('10 * * * * *', function() {
  console.log('You will see this message every 10 seconds');

  request.post({url:'https://api.spark.io/v1/devices/51ff6b065067545718550287/relay', form: {access_token:'4cd240bd67b599f991439773a1bc5989a0c35081',params:'r4,HIGH'}}, 
    function(err,httpResponse,body){ 
      console.log("FAN ON:",err,httpResponse,body);
    });

  setTimeout(function(){
    console.log('You will see this message 3 seconds after FAN ON');

    request.post({url:'https://api.spark.io/v1/devices/51ff6b065067545718550287/relay', form: {access_token:'4cd240bd67b599f991439773a1bc5989a0c35081',params:'r4,LOW'}}, 
    function(err,httpResponse,body){ 
      console.log("FAN OFF:",err,httpResponse,body);
    });
  },5000);
  //curl https://api.spark.io/v1/devices/51ff6b065067545718550287/relay -d access_token=4cd240bd67b599f991439773a1bc5989a0c35081 -d params=r4,HIGH

  //curl https://api.spark.io/v1/devices/51ff6b065067545718550287/relay -d access_token=4cd240bd67b599f991439773a1bc5989a0c35081 -d params=r4,LOW

}, null, true, 'America/Los_Angeles');

server.setup(function(runningApp) {
  
  // runningApp.use(require('express-session')({secret: CONF.app.cookie_secret, resave: false, saveUninitialized: false}));
  
  // Choose your favorite view engine(s)  
  runningApp.set('view engine', 'handlebars');
  runningApp.engine('handlebars', require('hbs').__express);

  //// you could use two view engines in parallel (if you are brave):  
  // runningApp.set('view engine', 'j2');
  // runningApp.engine('j2', require('swig').renderFile);


  //---- Mounting well-encapsulated application modules
  //---- See: http://vimeo.com/56166857

  runningApp.use('/hello', require('hello')); // attach to sub-route
  runningApp.use(require('routes')); // attach to root route
  
  // If you need websockets:
  // var socketio = require('socket.io')(runningApp.http);
  // require('fauxchatapp')(socketio);
  
});