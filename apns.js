const fs    = require('fs');
const apns  = require('node_apns');
const PushNotifications = require('node-pushnotifications');

const cert_and_key = fs.readFileSync('../../shared/config/aps_all.pem');

const cert_key_debug = fs.readFileSync('../../shared/config/sandbox_push.pem');
const cert_key_prod = fs.readFileSync('../../shared/config/prod_push.pem');
const voip_cert = fs.readFileSync('../../shared/config/voip_push.pem');
const simple_key =fs.readFileSync('../../shared/config/simple_push.p8');
const simple_cert_prod=fs.readFileSync('../../shared/config/simple_cert.pem');
const simple_cert_dev=fs.readFileSync('../../shared/config/simple_cert_dev.pem');
//
const mongoDB = require("./MongoDBHelper.js")

var Notification = apns.Notification;
var Push = apns.Push;
var Device = apns.Device;


SendSimplePush = function SendSimplePush(token,message,isdebug,callback)
{

  var settings;  
  if (isdebug==true) 
    settings= {
      apn: {
          cert:simple_cert_dev,
          key:simple_cert_dev,
          production:false 
      }
    };
  else
    settings= {
      apn: {
          cert:simple_cert_prod,
          key:simple_cert_prod,
          production:true 
      }
    };
  
  const push = new PushNotifications(settings);
  let body;
  if (message==1) 
    body = message+" message";
  else
    body = message+" messages";
  let payload = {"aps": {"alert":body}, "badge":message, "sound":"default","content-available":"1","topic":"com.safechats.SafeChats"};
  var pushLog=new mongoDB.ModelPushLog();

  const data = {
    topic: 'com.safechats.Safechats', 
    priority: 'high',    
    contentAvailable: true, 
    badge: message, 
    sound: 'ping.aiff',
    alert: body
  };

  pushLog.token=token;
  pushLog.message=message;
  pushLog.platform="APNS_SIMPLE";
  push.send(token, data, (err, result) => {
    pushLog.response=result;
    pushLog.error=err;
    pushLog.save(function(er){
      console.error("Push log saved...")
      callback(er);
    })
  });
}


SendVoipPush = function SendVoipPush(token,message,isdebug,callback)
{
  var settings; 
  settings= {
    apn: {
        cert:voip_cert,
        key:voip_cert,
        production:!isdebug 
    }
  }; 
  const push = new PushNotifications(settings);
  let body;
  if (message==1) 
    body = "New message";
  else
    body = "New messages";

  var pushLog=new mongoDB.ModelPushLog();

  const data = {
    //topic: 'com.safechats.Safechats', 
    priority: 'high',    
    contentAvailable: true, 
    badge: message, 
    sound: 'ping.aiff',
    alert: body
  };

  pushLog.token=token;
  pushLog.message=message;
  pushLog.platform="APNS_VoIP";
  push.send(token, data, (err, result) => {
    pushLog.response=result;
    pushLog.error=err;
    pushLog.save(function(er){
      console.error("VoIP_push log saved...")
      callback(er);
    })
  });
}

SendAPNSPush = function SendAPNSPush(token,message,isdebug,callback)
{
  var notifier;
  //console.error("isdebug:",isdebug);
  /*if(isdebug==true) 
    notifier = apns.services.Notifier({ cert: voip_cert, key: voip_cert }, isdebug);  
  else*/
  notifier = apns.services.Notifier({ cert: voip_cert, key: voip_cert }, isdebug);  
  console.error("iOS gateway is sandbox:",isdebug);  

  var pushLog=new mongoDB.ModelPushLog();
  pushLog.token=token;
  pushLog.message=message;
  pushLog.platform="APNS_VoIP";

  //let payload = {aps: {alert: "MESSAGE_PUSH","content-available":1,"priority":10,"badge":9}};
  let payload = {aps: {alert: {body:"test"},"content-available":1}};

  notifier.notify(Notification(token, payload), 
    function (err) {
      console.error("iOS push error:",err)
      pushLog.response=payload;
      pushLog.error=err;
      pushLog.save(function(er){
          callback(er);
      })
    });
}


SendAPN = function(token,message,isdebug,callback)
{

  const settings = {
    apn: {
        cert:cert_and_key,
        key:cert_and_key,
        production:!isdebug,
        voip:true   
    }
  };
  const push = new PushNotifications(settings);
     
  let dmsg={
      APNS:{aps: {alert: "PUSH_MSG", "content-available":1, priority:10, sound:'ping.aiff', badge:9}},
      APNS_VOIP:{aps: {alert: "PUSH_MSG", "content-available":1, priority:10, sound:'ping.aiff', badge:9}},
      APNS_VOIP_SANDBOX:{aps: {alert: "PUSH_MSG", "content-available":1, priority:10, sound:'ping.aiff', badge:9}}
  };

  let dmg2={
    alert:"PUSH_MESSAGE",
    notification:"MESSAGE_PUSH",
    priority:10,
    content_available: true
  };

  const data = {
    //title: 'PUSH_NOTIFICATION', 
    //body: 'PUSH_MESSAGE',     
    contentAvailable: true,
    priority: 'high',
    //delayWhileIdle: true,     
    badge: 9,
    sound: 'ping.aiff',
    expiry: Math.floor(Date.now() / 1000) + 28 * 86400,
    timeToLive: 28 * 86400,
    //alert: {} 
    alert:"MESSAGE_PUSH",
    notification:"MESSAGE_PUSH"
   };
  
  //console.error("PUSH content is:", push);
  push.send(token, dmsg, (err, result) => {
    if (err) console.error('Error[APNS_PUSH]-> ',err);
    else console.error(result[0]);
    //console.error("PUSH_MESSAGE");
    //console.error(result.message);
    callback(err);
  });
}


exports.SendAPNSPush = SendVoipPush;
//SendAPNSPush;
exports.SentAPN = SendAPN;
exports.SendSimplePush=SendSimplePush;