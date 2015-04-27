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

var phantPublicKey = nconf.get("phant").devices.publickey;
var phantPrivateKey = nconf.get("phant").devices.privatekey;
var phantUrl = "http://data.sparkfun.com/input/"+phantPublicKey+"?private_key="+phantPrivateKey;

var sparkCoreId = "54ff6a066672524822260167";
var sparkCoreAccessToken = '4cd240bd67b599f991439773a1bc5989a0c35081';
var sparkCoreEndpointRelay = 'https://api.spark.io/v1/devices/'+sparkCoreId+'/relay';

var relay = {
  humidifier: "R4",
  light: "R2",
  fan: "R3"
};

var fanDuration = 40;
var humidifierDuration = 15;
var humidifierInterval = 60*2;

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
},humidifierInterval*1000);

// every day at 6AM, turn fan on. after 30 seconds turn fan off and turn humidifier on. after 30 seconds turn humidifier off
var runFanJob1 = new CronJob('00 00 06 * * *', function() {
  fanAction();
}, null, false, 'America/Los_Angeles');

// every day at 12PM, turn fan on. after 30 seconds turn fan off and turn humidifier on. after 30 seconds turn humidifier off
var runFanJob2 = new CronJob('00 00 12 * * *', function() {
  fanAction();
}, null, false, 'America/Los_Angeles');

// every day at 6PM, turn fan on. after 30 seconds turn fan off and turn humidifier on. after 30 seconds turn humidifier off
var runFanJob3 = new CronJob('00 00 18 * * *', function() {
  fanAction();
}, null, false, 'America/Los_Angeles');

// every day at 12AM, turn fan on. after 30 seconds turn fan off and turn humidifier on. after 30 seconds turn humidifier off
var runFanJob4 = new CronJob('00 00 00 * * *', function() {
  fanAction();
}, null, false, 'America/Los_Angeles');


turnOnLightJob1.start();
turnOnLightJob2.start();
runFanJob1.start();
runFanJob2.start();
runFanJob3.start();
runFanJob4.start();

humidifierAction();

function postSparkCall (endpoint, params, callback) {

    request.post(
    {
      url: endpoint, 
      form: {
        access_token: sparkCoreAccessToken,
        params: params
      }
    }, 
      function(err,httpResponse,body){ 
        callback(err,httpResponse,body);
        //console.log("HUMIDIFIER OFF:",err,body);
        //emailReport("HUMIDIFIER OFF",body);
      }
    );
}


function humidifierAction() {
  if (!fanIsOff) return;

  request.post({
    url: sparkCoreEndpointRelay, 
    form: {access_token: sparkCoreAccessToken,
    params: relay.humidifier+',HIGH'}}, 
    function(err,httpResponse,body){ 
      console.log("HUMIDIFIER ON:",err,body);
      //emailReport("HUMIDIFIER ON",body);
      phantReport("HUMIDIFIER","ON");

      setTimeout(function(){
        request.post(
        {
          url: sparkCoreEndpointRelay, 
          form: {
            access_token: sparkCoreAccessToken,
            params: relay.humidifier+',LOW'
          }
        }, 
          function(err,httpResponse,body){ 
            console.log("HUMIDIFIER OFF:",err,body);
            phantReport("HUMIDIFIER","OFF");
            //emailReport("HUMIDIFIER OFF",body);
          }
        );
      
      },humidifierDuration*1000);
  });
}

function lightAction(turnLightOn) {

  var params = turnLightOn ? relay.light+',HIGH' : relay.light+',LOW';
  request.post({
    url: sparkCoreEndpointRelay, 
    form: {access_token: sparkCoreAccessToken,
    params:params}}, 
    function(err,httpResponse,body){ 

      if (turnLightOn) {
        console.log("LIGHT ON:",err,body);
        phantReport("LIGHT","ON");
        //emailReport("LIGHT OFF",body);
      } else {
        console.log("LIGHT OFF:",err,body);
        phantReport("LIGHT","OFF");
        //emailReport("LIGHT OFF",body);
      }
    
    });
}

function fanAction() {

  request.post({
    url: sparkCoreEndpointRelay, 
    form: {access_token: sparkCoreAccessToken,
    params: relay.fan+',HIGH'}}, 
    function(err,httpResponse,body){ 

      console.log("FAN ON:",err,body);
      phantReport("FAN","ON");
      //emailReport("FAN ON",body);
      fanIsOff = false;

      setTimeout(function(){

        request.post({
          url: sparkCoreEndpointRelay, 
          form: {access_token: sparkCoreAccessToken,
          params:relay.fan+',LOW'}}, 
          function(err,httpResponse,body){ 

            console.log("FAN OFF:",err,body);
            phantReport("FAN","OFF");
            //emailReport("FAN OFF",body);
            fanIsOff = true;

            humidifierAction();
          
          });

      }, fanDuration*1000); 
    
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

function phantReport (deviceName, status) {
  // http://data.sparkfun.com/input/[publicKey]?private_key=[privateKey]&device=[value]&status=[value]
  request.get(phantUrl+"&device="+deviceName+"&status="+status, 
    function(err,httpResponse,body){ 
      console.log("PHANT REPORT:",err,body);
    });
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

  runningApp.use('/hello', require('hello')); // attach to sub-route
  runningApp.use(require('routes')); // attach to root route
  
  // If you need websockets:
  // var socketio = require('socket.io')(runningApp.http);
  // require('fauxchatapp')(socketio);
  
});