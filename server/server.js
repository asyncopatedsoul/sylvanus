var nconf = require('nconf');

  nconf.overrides({
    'always': 'be this value'
  });
  nconf.env().argv();
  nconf.file('config/credentials.json');

var server = require('nodebootstrap-server');
var CronJob = require('cron').CronJob;
var request = require('request');

var email   = require("emailjs");
var emailServer  = email.server.connect({
   user:    nconf.get("user"), 
   password: nconf.get("password"), 
   host:    "smtp.gmail.com", 
   ssl:     true

});

// setInterval(function(){
//   console.log("...");
// },1000);

var fanIsOff = true;

// every day at 8AM, turn light on 
var turnOnLightJob1 = new CronJob('00 00 08 * * *', function() {
  lightAction(true);
}, null, false, 'America/Los_Angeles');

// every day at 8PM, turn light off
var turnOnLightJob2 = new CronJob('00 00 20 * * *', function() {
  lightAction(false);
}, null, false, 'America/Los_Angeles');

// every 10 minutes, (if fan is off) turn humidifier on. after 30 seconds turn humidifier off
var humidfierJob = setInterval(function(){
  humidifierAction();
},6*60*1000);

// every day at 8AM, turn fan on. after 30 seconds turn fan off and turn humidifier on. after 30 seconds turn humidifier off
var runFanJob1 = new CronJob('00 00 08 * * *', function() {
  fanAction();
}, null, false, 'America/Los_Angeles');

// every day at 4PM, turn fan on. after 30 seconds turn fan off and turn humidifier on. after 30 seconds turn humidifier off
var runFanJob2 = new CronJob('00 00 16 * * *', function() {
  fanAction();
}, null, false, 'America/Los_Angeles');

// every day at 12AM, turn fan on. after 30 seconds turn fan off and turn humidifier on. after 30 seconds turn humidifier off
var runFanJob3 = new CronJob('00 00 00 * * *', function() {
  fanAction();
}, null, false, 'America/Los_Angeles');

turnOnLightJob1.start();
turnOnLightJob2.start();
runFanJob1.start();
runFanJob2.start();
runFanJob3.start();



function humidifierAction() {
  if (!fanIsOff) return;

  request.post({
    url:'https://api.spark.io/v1/devices/51ff6b065067545718550287/relay', 
    form: {access_token:'4cd240bd67b599f991439773a1bc5989a0c35081',
    params:'r2,HIGH'}}, 
    function(err,httpResponse,body){ 
      console.log("HUMIDIFIER ON:",err,body);
      emailReport("HUMIDIFIER ON",body);

      setTimeout(function(){
        request.post(
        {
          url:'https://api.spark.io/v1/devices/51ff6b065067545718550287/relay', 
          form: {
            access_token:'4cd240bd67b599f991439773a1bc5989a0c35081',
            params:'r2,LOW'
          }
        }, 
          function(err,httpResponse,body){ 
            console.log("HUMIDIFIER OFF:",err,body);
            emailReport("HUMIDIFIER OFF",body);
          }
        );
      
      },40*1000);
  });
}

function lightAction(turnLightOn) {

  var params = turnLightOn ? 'r3,HIGH' : 'r3,LOW';
  request.post({
    url:'https://api.spark.io/v1/devices/51ff6b065067545718550287/relay', 
    form: {access_token:'4cd240bd67b599f991439773a1bc5989a0c35081',
    params:params}}, 
    function(err,httpResponse,body){ 

      if (turnLightOn) {
        console.log("LIGHT ON:",err,body);
        emailReport("LIGHT OFF",body);
      } else {
        console.log("LIGHT OFF:",err,body);
        emailReport("LIGHT OFF",body);
      }
    
    });
}

function fanAction() {

  request.post({
    url:'https://api.spark.io/v1/devices/51ff6b065067545718550287/relay', 
    form: {access_token:'4cd240bd67b599f991439773a1bc5989a0c35081',
    params:'r4,HIGH'}}, 
    function(err,httpResponse,body){ 

      console.log("FAN ON:",err,body);
      emailReport("FAN ON",body);
      fanIsOff = false;

      setTimeout(function(){

        request.post({
          url:'https://api.spark.io/v1/devices/51ff6b065067545718550287/relay', 
          form: {access_token:'4cd240bd67b599f991439773a1bc5989a0c35081',
          params:'r4,LOW'}}, 
          function(err,httpResponse,body){ 

            console.log("FAN OFF:",err,body);
            emailReport("FAN OFF",body);
            fanIsOff = true;

            humidifierAction();
          
          });

      }, 60*1000); 
    
    });

}

function emailReport (subject, text) {
  emailServer.send({
         from:    "Sylvanus <michael.a.garrido@gmail.com>", 
         to:      "Me <michael.a.garrido@gmail.com>",
         //cc:      "else <michael@playprizm.com>",
         subject: subject,
         text:    JSON.stringify(text)
      }, function(err, message) { console.log(err || message); });
}


new CronJob('10 * * * * *', function() {
  console.log('You will see this message every 10 seconds');

  request.post({url:'https://api.spark.io/v1/devices/51ff6b065067545718550287/relay', form: {access_token:'4cd240bd67b599f991439773a1bc5989a0c35081',params:'r4,HIGH'}}, 
    function(err,httpResponse,body){ 
      console.log("FAN ON:",err,body);

      /*
      FAN OFF: null {
        "id": "51ff6b065067545718550287",
        "name": "prizm-b1",
        "last_app": null,
        "connected": true,
        "return_value": 1
      }
      */
      // send the message and get a callback with an error or details of the message that was sent
      emailServer.send({
         text:    JSON.stringify(body), 
         from:    "you <michael.a.garrido@gmail.com>", 
         to:      "someone <michael.a.garrido@gmail.com>",
         cc:      "else <michael@playprizm.com>",
         subject: "FAN ON"
      }, function(err, message) { console.log(err || message); });
    });

  setTimeout(function(){
    console.log('You will see this message 3 seconds after FAN ON');

    request.post({url:'https://api.spark.io/v1/devices/51ff6b065067545718550287/relay', form: {access_token:'4cd240bd67b599f991439773a1bc5989a0c35081',params:'r4,LOW'}}, 
    function(err,httpResponse,body){ 
      console.log("FAN OFF:",err,body);
      // send the message and get a callback with an error or details of the message that was sent
      emailServer.send({
           text:    JSON.stringify(body), 
           from:    "you <michael.a.garrido@gmail.com>", 
           to:      "someone <michael.a.garrido@gmail.com>",
           cc:      "else <michael@playprizm.com>",
           subject: "FAN OFF"
        }, function(err, message) { console.log(err || message); });
      });
  },5000);
  //curl https://api.spark.io/v1/devices/51ff6b065067545718550287/relay -d access_token=4cd240bd67b599f991439773a1bc5989a0c35081 -d params=r4,HIGH

  //curl https://api.spark.io/v1/devices/51ff6b065067545718550287/relay -d access_token=4cd240bd67b599f991439773a1bc5989a0c35081 -d params=r4,LOW

}, null, false, 'America/Los_Angeles');


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

  // runningApp.use('/hello', require('hello')); // attach to sub-route
  // runningApp.use(require('routes')); // attach to root route
  
  // If you need websockets:
  // var socketio = require('socket.io')(runningApp.http);
  // require('fauxchatapp')(socketio);
  
});