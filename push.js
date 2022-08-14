const async = require("async");
const guid = require("./guid.js");
const mysql_backend = require("./mysql-backend.js");
let amazon_sns = require('./amazon_sns.js');
let apns_push = require('./apns.js');
const database = require('./src/db');
const gcm      = require('./gcm-push.js');


let config = {};
try {
    config = require('./config.js');
} catch (ex) {
    config = require('./config.dist.js');
}

// Routine sends push using "new" style - one push per one new text message
SendPush = function (GUID, message, messageCount,token,voip_token,platform,callback) {
//	// construct the output message (to be sent in the push message)
//	var pushMessage = formatOutput.PushMessage(messageID, senderGUID, chatID, serverTime, messageType, messageBody);
    const pushMessage = messageCount;
    var isdebug=false;
    console.error('Sending push for platform: ',platform);
    if (platform === config.deviceTypes.IOS || platform === config.deviceTypes.IOS_VOIP
    || platform === config.deviceTypes.IOS_DEBUG || platform === config.deviceTypes.IOS_MP) 
    {

        // messageText: '{"type":"voip-action",
        let msg=JSON.parse(message.messageText)
        
        console.error(msg);
        console.error(msg.type);

        if (platform === config.deviceTypes.IOS_DEBUG)
            isdebug=true;
            //callback(null);
        
        if (msg.type=="voip-action"){
            console.error("Sending Voip Push")
            apns_push.SendAPNSPush(voip_token,pushMessage,isdebug,function (err){
                console.error("Error in push.js: ",err);
                callback(err);
            });
        }
        else
        {       
            apns_push.SendSimplePush(token,pushMessage,isdebug,function (err){
                console.log("Error in push.js: ",err);
                callback(err);
            });
        }               
    }
    else
    {
        //console.error("GCM platform");
        if (platform === config.deviceTypes.ANDROID || platform === config.deviceTypes.ANDROID_MP){
            gcm.SendGCMPush(token,pushMessage,function(err){
                callback(err);
            })
        }
        else
        {
            /*Helper_SendPushNotificationText(token, platform, pushMessage, function (err) {
                callback(err);
            });*/
            console.error("PUSH-NO-PLATFORM");
            callback(null);
        }
    }
};

Helper_SendPushNotificationText = function (arn, deviceType, messageText, callback) {   
    const preparedMessage = Helper_GeneratePushMessageAccordingToDeviceType(deviceType, messageText);
    console.log("Sending push for ARN -> "+arn);
    amazon_sns.publish(arn, preparedMessage, function (err) {
        callback(err);        
    });
};


Helper_GeneratePushMessageAccordingToDeviceType = function (deviceType, message) {
    const payload =
        {
            default: message
        };


    if (deviceType === config.deviceTypes.IOS
        || deviceType === config.deviceTypes.IOS_VOIP
        || deviceType === config.deviceTypes.IOS_DEBUG
        || deviceType === config.deviceTypes.IOS_MP) {

        payload.APNS = {aps: {alert: message,"content-available":1}};
        //        payload.default = { aps: { alert: message }};
        payload.APNS_VOIP_SANDBOX = {aps: {alert: message, "content-available":1}};
        payload.APNS_VOIP = {aps: {alert: message, "content-available":1}};

        payload.APNS = JSON.stringify(payload.APNS);
        payload.APNS_VOIP_SANDBOX = JSON.stringify(payload.APNS_VOIP_SANDBOX);
        payload.APNS_VOIP = JSON.stringify(payload.APNS_VOIP);
//        payload.default = JSON.stringify(payload.default);
    }
    if (deviceType === config.deviceTypes.ANDROID || deviceType === config.deviceTypes.ANDROID_MP) {
        payload.GCM =
            {
                priority: "high",
                data: {
                    message: message
                }
            };

        payload.GCM = JSON.stringify(payload.GCM);
    }

    const msg = JSON.stringify(payload);
    return (msg);
};


Helper_SendPushMessageText = function (userID, pushMessage, callback) {
     database.QueryUserDeviceByUserID(userID, function (err, devices) {
        if (err !== null) {
            console.log("[" + userID + "][Helper_SendPushMessageText] error receiving ARN: ", err);
            callback(err);
            return;
        }
        devices = database.processResult(devices);

        if (devices && devices.length > 0) {
            let fun_arr = [];
            for (const device of devices) {
                if (device.arn && device.platform) {
                    fun_arr.push(function (device, callback) {
                        Helper_SendPushNotificationText(device.arn, device.platform, pushMessage, function (err) {
                            callback(err);
                        });
                    }.bind(null, device));
                }
            }

            async.parallel(fun_arr, function (err) {
                callback(err);
            });
        }
        else {
            // no arn defined for user
            console.log("[Helper_SendPushMessageText] no ARNs defined for user: " + userID);
            callback(err);
        }
    });
};

// export block

exports.SendPush = SendPush;
exports.Helper_SendPush=Helper_SendPushNotificationText