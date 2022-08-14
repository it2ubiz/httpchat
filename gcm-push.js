var gcm = require('node-gcm');

const mongoDB = require("./MongoDBHelper.js")

SendGCMPush = function(token,msg,callback){
    var sender = new gcm.Sender('AIzaSyCw2ftFLLnE1swN7OjwW52M39j7pj8oahM'); //API Key
    var registrationTokens = [];
    registrationTokens.push(token);
    let message = new gcm.Message(
    {
        priority: "high",
        data: {message: "PUSH_TEXT"},
        notification: {
            message:"PUSH_TEXT"
        }
    });

    var pushLog=new mongoDB.ModelPushLog();
    pushLog.token=token;
    pushLog.message=message;
    pushLog.platform="GCM";
    /*
    token:{type:'string'},
        message:{type:Object},
        response:{type:Object},
        error:{type:Object},
        platform:{type:"string"}
    */
    sender.send(message, 
        {registrationTokens: registrationTokens}, 
        function (err, response) {
            pushLog.response=response;
            pushLog.error=err;
            pushLog.save(function(er){
                callback(er);
            })
            /*if(err) 
                console.error("err[GCM]->",err);
            else 
                console.log("response[GCM]->",response);*/            
        }
    );
}

exports.SendGCMPush = SendGCMPush;



// Alternative API Keys
// AIzaSyBFhzsVklWwV9IEysOk10hkzMXUti2ksrA
// AAAA1P7wg84:APA91bG6YWq_NXS63wFlyHuY2Hco_MCuLApsOJur5UIgDfif0e_BE6it6cPU3xZ76LBuIZeQFL_0ep6-EWAlVDG-yN-VAePXUq4aZA-4t_BHprTb28kDz9QO4VzrCn8uz6PRHctvvoIR
// AIzaSyCw2ftFLLnE1swN7OjwW52M39j7pj8oahM
// AIzaSyBNQAKUOXMIzo8HS5k12vT9PJsCTB31wO8