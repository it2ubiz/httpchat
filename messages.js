var crypto = require('crypto');
const _ = require('lodash');
const Q = require('q');
// include for token validation
var token_lib = require('./token.js');
// include for Amazon DynamoDB access
var database = require('./src/db');
const amazon_cloudwatch = require('./amazon_cloudwatch.js');

const devices = require('./src/devices');
const users = require('./users.js');
var utils = require("./utils.js");

var keys = require("./keys.js");

var async = require("async");

var sqs = require("./sqs.js");

var clientTable = require("./client-table.js");
var serverUsers = require("./server-users.js");
var chats = require("./chats.js");

var common = require("./common.js");
var serverid = require("./serverid.js");
var guid = require("./guid.js");
var message_lib = require("./message-fun.js");
var chatUsers = require("./chat-users.js");

var formatOutput = require("./format-output.js");

var push_lib = require("./push.js");
const amazonSns = require('./amazon_sns.js');

const queue_lib = require("./src/queueManager");


try {
    var config = require('./config.js');
} catch (ex) {
    var config = require('./config.dist.js');
}

// set defaults

if (config.oldPush == undefined) {
    config.oldPush = false;
}
if (config.maxMessageLengthToIncapsulate == undefined) {
    config.maxMessageLengthToIncapsulate = 2048;
}

////////////////////////////////////////

signMessage = function (message) {
    var sign = crypto.createSign(config.signAlgorithm);

    var str = JSON.stringify(message);
    var buf = new Buffer(str);

    sign.update(buf);

    var msg = sign.sign(keys.prvServerKey, "hex");

    return (msg);
};

checkMessageSign = function (message, userKey, sign) {
    var verifier = crypto.createVerify(config.signAlgorithm);

    var str = JSON.stringify(message);
    var buf = new Buffer(str);

    verifier.update(buf);

    return (verifier.verify(userKey, sign, "hex"));
};


EP_IncomingMessages = function (userID, deviceID, req, callback) {
    var messages = "";

    if (req.body) {
        messages = req.body.outgoingEvents;
    }

    if (messages == "") {
        callback(common.FormatErrorResponse(400));
        return;
    }
    Helper_ProcessIncomingAcks(userID, deviceID, messages.statuses, function (err, acksResult) {
        if (err != 200) {
            callback(common.FormatErrorResponse(err));
            return;
        }

        // processing incoming messages
        Helper_ProcessIncomingMessages(userID, deviceID, messages.messages, function (err, messagesResult) {
           
            if (err != 200) {
                callback(common.FormatErrorResponse(err));

            }
            else {
                var outgoingEventsResult = {};

                outgoingEventsResult.messages = messagesResult;
                outgoingEventsResult.statuses = acksResult;

                var sign = signMessage(outgoingEventsResult);

                callback(formatOutput.IncomingMessages(outgoingEventsResult, sign));
            }
        });
    });
};

EP_IncomingTyping = function (userID, deviceID, req, callback) {
    const chatID = req.chatID;
    if (!chatID) {
        callback(common.FormatErrorResponse(500));
        return;
    }

    chatUsers.Helper_ListChatOnlineUsers(chatID, function (err, onlineUserList, userTotal) {
            if (err) {
                console.log("[Helper_ListChatOnlineUsers] error: " + err);
                callback(common.FormatErrorResponse(500));
                return;
            }
            _.remove(onlineUserList, {userID: userID});
            let GUIDTyping = common.CreateGUID(userID, deviceID);
            let userIDArr = _.map(onlineUserList, (record) => record.userID);

            // remove duplicates
            userIDArr = common.ArrNoDupe(userIDArr);

            users.listOnlineDevices(userIDArr)
                .then(function (userGUIDArr) {
                    console.log('Typing chatID:%s , GUIDs :', chatID, userGUIDArr);
                    if (userGUIDArr && userGUIDArr.length) {
                        message_lib.PostOnlineMessageTypingGUID(GUIDTyping, chatID, userGUIDArr, function () {
                        });
                    }
                    callback(formatOutput.OnlineMessageTyping());
                }).catch(function (err) {
                console.log("IncomingTyping: ", err);
                callback(common.FormatErrorResponse(500));
            });
        }
    )
};

exports.EP_IncomingTyping = EP_IncomingTyping;

// Helpers

Helper_ProcessIncomingMessages = function (userID, deviceID, messageArray, callback) {
    var result = [];
    var fun_arr = [];

    // process message array
    if (messageArray != []) {
        for (var message in messageArray) {
            // do not allow to send more than limitSendMsgToN messages contemporarily
            if (message >= config.limitSendMsgToN) {
                break;
            }

            // process each message from messageArray
            fun_arr.push(function (message, callback) {
                ProcessIncomingMessage(userID, deviceID, messageArray[message], function (err, res) {
                    if (err == null) {
                        result.push(res);
                    }
                    callback(err);
                });
            }.bind(null, message));
        }

        async.series(fun_arr, function (err) {
            if (err != null) {
                callback(err, result);
                return;
            }

            // post to the cloudwatch
            amazon_cloudwatch.publishNumMsgsSentMetrics("APINumSent", result.length, function () {
            });
            callback(200, result);
        });
    }
    else {
        // no message array defined
        // this is not an error - we allow such behavior
        callback(200, null);
    }
};

// Routine handles sending one message
ProcessIncomingMessage = function (userID, deviceID, message, callback) {
    // get message fields
    var timestamp = "" + message.timestamp;
    var clientHash = "" + message.clientHash;
    var chatID = "" + message.chatID;
    var messageBlock = message.messageBlock;

    // optional oldMessageID
    var oldMessageID = "";
    if (message.oldMessageID != undefined) {
        oldMessageID = "" + message.oldMessageID;
    }

    // check parameters
    if (timestamp == "" || chatID == "" || clientHash == "" || messageBlock == undefined) {
        // error in parameters
        callback(400);
        return;
    }

    if (messageBlock.length == 0) {
        // messageBlock cannot be empty
        callback(400);
        return;
    }

    for (var messageItem in messageBlock) {
        var msgText = "" + messageBlock[messageItem].messageText;
        var recipient = "" + messageBlock[messageItem].recipient;

        if (recipient == "" && msgText == "") {
            // error in parameters
            callback(400);
            return;
        }
    }

    // check user (userID) is in destination chat (chatID)
    // and get GUIDList (list of all GUIDs in the chat)
    chatUsers.Helper_ListChatUsers(chatID, function (err, userList) {
        if (err != null) {
            callback(500);
            return;
        }

        var found = false;

        for (var i in userList) {
            if (userList[i] == userID) {
                found = true;
                break;
            }
        }

        if (found == false) {
            callback(404);
            return;
        }

        guid.BuildUsersGUIDList(userList, function (err, userGUIDArr) {
            if (err != null) {
                callback(500);
                return;
            }

            for (var messageItem in messageBlock) {
                if (messageBlock[messageItem].recipient == undefined) {
                    callback(400);
                    return;
                }

                found = false;

                for (var u in userGUIDArr) {
                    for (var g in userGUIDArr[u]) {
                        if (messageBlock[messageItem].recipient == userGUIDArr[u][g]) {
                            found = true;
                            break;
                        }
                    }
                }

                if (found == false) {
                    // the recipient does not exist in the chat
                    console.log("The recipient " + messageBlock[messageItem].recipient + " does not exist in the chat " + chatID);
                    callback(404);
                    return;
                }
            }

            var senderGUID = common.CreateGUID(userID, deviceID);

            // all checks are finished. Now process the message
            ProcessIncomingMessageInt(messageBlock, senderGUID, chatID, oldMessageID, function (err, result) {
                if (err != null) {
                    callback(err, null);
                    return;
                }

                // return clientHash
                result.clientHash = clientHash;

                // finish processing
                callback(err, result);
            });
        });
    });
};

// Routine sends a text message
ProcessIncomingMessageInt = function (messageBlock, senderGUID, chatID, oldMessageID, callback) {
    if (oldMessageID != "") {
        ProcessIncomingMessageOldMessage(messageBlock, senderGUID, chatID, oldMessageID, function (err, result) {
            callback(err, result);
        });
    }
    else {
        ProcessIncomingMessageNoOldMessage(messageBlock, senderGUID, chatID, function (err, result) {
            callback(err, result);
        });
    }
};

ProcessIncomingMessageOldMessage = function (messageBlock, senderGUID, chatID, oldMessageID, callback) {
    // get current system time
    var serverTime = new Date().valueOf().toString();

    async.waterfall(
        [
            // get the old message with messageID
            function (callback) {
                database.QueryMetadataByMessageID(oldMessageID, function (err, message) {
                    if (err != null || message == null) {
                        // this messageID metainfo does not exist, oldMessageID is wrong
                        callback(404);
                        return;
                    }

                    // check that the sender is the same
                    if (message.sender["S"] != senderGUID) {
                        callback(403);
                        return;
                    }

                    callback(null, oldMessageID);
                });
            },
            function (messageID, callback) {
                // add recipients to the database
                Helper_AddMessageRecipients(messageID, senderGUID, serverTime, messageBlock, chatID, function (err) {
                    callback(err, messageID);
                });
            }
        ],

        function (err, messageID) {
            if (err != null) {
                // something internal occurred
                console.log("ERROR: ProcessIncomingMessageIntOldMessage: internal error: " + err);
                callback(err);
                return;
            }

            callback(null, formatOutput.SingleMessageSent(serverTime, messageID));
        });
};

ProcessIncomingMessageNoOldMessage = function (messageBlock, senderGUID, chatID, callback) {
    // get current system time
    var serverTime = new Date().valueOf().toString();

    async.waterfall(
        [
            // insert text into metadata
            function (callback) {
                // create and fill deliverList
                var deliverList = [];
                for (var messageItem in messageBlock) {
                    deliverList.push(messageBlock[messageItem].recipient);
                }

                // create metadata record
                Helper_CreateAndAddMetadata(chatID, serverTime, senderGUID, deliverList, function (err, messageID) {
                    console.log('Helper_CreateAndAddMetadata',err);
                    callback(err, messageID);
                });
            },
            // insert into pending for each user
            function (messageID, callback) {
                // add message to the database
                Helper_AddMessageRecipients(messageID, senderGUID, serverTime, messageBlock, chatID, function (err) {
                    console.log('Helper_AddMessageRecipients',err);
                    callback(err, messageID);
                });
            }
        ],

        // finally: prepare result
        function (err, messageID) {
            if (err != null) {
                // something internal occurred
                console.log("ERROR: ProcessIncomingMessageIntNoOldMessage: internal error: " + err);
                callback(500);
                return;
            }

            callback(null, formatOutput.SingleMessageSent(serverTime, messageID));
        });
};

// Routine posts the message text to the corresponding user in messageBlock
Helper_AddMessageRecipients = function (messageID, senderGUID, serverTime, messageBlock, chatID, callback) {
    var fun_arr = [];

    for (var messageItem in messageBlock) {
        fun_arr.push(function (messageItem, callback) {
            var GUID = messageBlock[messageItem].recipient;
            var messageText = messageBlock[messageItem].messageText;
            console.log("GUID to send: ",GUID);
            // do not send the message back
            if (GUID == senderGUID) {
                callback(null);
                return;
            }

            var message = formatOutput.TextMessage(messageID, senderGUID, messageText, serverTime, chatID);
            message_lib.PostMessageGUID(GUID, message, "message", function (err) {
                if (err != null) {
                    console.error("PostMessageGUID error: ",err);
                    callback(err);                   
                    return;
                }
                //console.error("Sending message to GUID -> ",GUID);

                
                database.QueryUserDeviceByGUID(GUID, function (err, data) {                    
                    // send push
                    if (err != null) {
                        callback(err);                        
                    }
                    else{
                        dta = database.processResult(data);
                        console.log("data-> ",dta);
                        if (dta && dta[0]){// && dta[0].noPush!=true && dta[0].arn){
                            console.error("Sending push to GUID -> ", GUID);
                            queue_lib.getQueueInfo(GUID,function(qinfo){
                                let voip_token=null;
                                console.error(dta[0]);
                                if((dta[0].tokenVoip!=undefined)&&(dta[0].tokenVoip!=null))
                                    voip_token=dta[0].tokenVoip;

                                push_lib.SendPush(GUID, message,qinfo.messageCount,dta[0].token,voip_token,dta[0].platform,function (err) {                            
                                    if (err) {
                                        console.error("[Messages]: send push", err);
                                        callback(err);
                                        //return;
                                    }
                                    else{
                                        callback(null);
                                    }
                                });
                            })
                        }
                        else{
                            callback(null);
                        }
                    }
                });               
                
                //callback(null);
            });

        }.bind(null, messageItem));
    }

    async.parallel(fun_arr, function (err) {
        callback(err);
    });
};

Helper_CreateAndAddMetadata = function (chatID, serverTime, senderGUID, deliverList, callback) {
    // create messageID
    var messageID = common.CreateMessageID(senderGUID, "", chatID, serverTime, "");

    // insert to the table
    database.InsertMetadataMessage(messageID, serverTime, senderGUID, chatID, deliverList, function (err) {
        callback(err, messageID);
    });
};


Helper_ProcessIncomingAcks = function (userID, deviceID, acksArray, callback) {
    function deleteDeviceFin(device, callback) {
        database.DeleteDeviceByGUID(device.GUID).then(function () {
            const record = clientTable.GetRecordByGUID(device.GUID);
            setTimeout(function () {
                //close connection
                if (record) {
                    record.conn.close();
                }

            }, 200);
            callback();
        }).catch(function (err) {
            console.error('Fail to delete device', err);
            callback(err);
            return;
        });
    }

    var statuses = [];
    devices.getDeviceInt(userID, deviceID, function (err, device) {
        if (acksArray && acksArray.length > 0) {
            var fun_arr = [];

            // for each ack do
            for (var ackItem in acksArray) {
                var ack = acksArray[ackItem];
                fun_arr.push(function (ack, callback) {
                    // check parameters
                    if (ack.messageID == undefined || ack.messageID == "" ||
                        ack.messageStatus == undefined || ack.messageStatus == "" ||
                        ack.clientHash == undefined || ack.clientHash == "") {
                        callback(400);
                        return;
                    }
                    var GUID = common.CreateGUID(userID, deviceID);

                    if (ack.messageStatus == "delivered") {
                        // process ack message
                        Helper_ProcessAck(ack, GUID, function (err) {
                            if (err == null) {
                                statuses.push(ack.clientHash);
                            }
                            if (device && device.pendingEraseMessage && device.pendingEraseMessage === ack.messageID) {
                                if (device.arn) {
                                    amazonSns.deleteArn(device.arn, function (err) {
                                        // remove device from db
                                        deleteDeviceFin(device, function (err) {
                                            device = null;
                                            callback(err);
                                        });
                                    });
                                } else {
                                    // remove device from db
                                    deleteDeviceFin(device, function (err) {
                                        device = null;
                                        callback(err);
                                    });
                                }
                            }
                            callback(err);
                        });
                    }
                    else if (ack.messageStatus == "read") {
                        Helper_ProcessRead(ack, GUID, function (err) {
                            if (err == null) {
                                statuses.push(ack.clientHash);
                            }
                            callback(err);
                        });
                    }
                    else {
                        console.log("Error: unknown ack type: " + ack.messageStatus);
                        callback(400);
                    }
                }.bind(null, ack));
            }	// for
            async.series(fun_arr, function (err) {
                if (err != null) {
                    callback(err, statuses);
                }
                else {
                    console.log("Statuses: " + JSON.stringify(statuses));
                    if (device && device.pendingEraseMessage) {
                        devices.eraseDeviceInt(device, function () {
                            callback(200, statuses);
                        });
                    } else
                        callback(200, statuses);
                }
            });
        }
        else {
            // no acks array
            if (device && device.pendingEraseMessage) {
                devices.eraseDeviceInt(device, function () {
                    callback(200, null);
                });
            } else
                callback(200, null);
        }
    });


};

Helper_ProcessAck = function (ack, GUID, callback) {
    var messageID = "" + ack.messageID;

    // look for the corresponding message and delete it from the delivery queue
    queue_lib.MessageDeliveredToClient(GUID, messageID).then(function (notFound) {
        if (notFound == true) {
            callback(null);
            return;
        }
        // send status message to sender
        // send status to all sender's GUIDs
        message_lib.PostStatusMessageToSender(GUID, messageID, "delivered", function (err) {
            callback(null);
        });
    }).catch(function (err) {
        callback(err);
    });
};

Helper_ProcessRead = function (ack, GUID, callback) {
    var messageID = "" + ack.messageID;

    // send status message to sender
    // send status to all sender's GUIDs
    message_lib.PostStatusMessageToSender(GUID, messageID, "read", function (err) {
        callback(null);
    });
};

// export block

exports.EP_IncomingMessages = EP_IncomingMessages;
