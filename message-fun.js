var async = require ("async");

var common = require ("./common.js");

var guid = require ("./guid.js");
var userInfo = require ("./userinfo.js");

var formatOutput = require ("./format-output.js");
var clientTable = require ("./client-table.js");
var serverUsers = require ("./server-users.js");

const database = require ('./src/db');
const queue_lib = require("./src/queueManager");

const mongoDB = require("./MongoDBHelper.js")

// Routine posts chat_enter/chat_leave messages
PostInfoMessageChatEvent = function(messageType, chatID, chatUserIDs, affectedUserIDs, callback)
{
    if (messageType == "chat_enter")
    {
        // combine userIDs
        var comboArray = chatUserIDs.concat(affectedUserIDs);
        comboArray = common.ArrNoDupe(comboArray);

        guid.BuildUsersGUIDList(comboArray, function(err, userGUIDArr)
        {
            Helper_PostInfoMessageChatEnter(chatID, affectedUserIDs, userGUIDArr, function(err)
            {
                callback(err);
            });
        });
    }
    else if (messageType == "chat_leave")
    {
        // combine userIDs
        var comboArray = chatUserIDs.concat(affectedUserIDs);
        comboArray = common.ArrNoDupe(comboArray);

        guid.BuildUsersGUIDList(comboArray, function(err, userGUIDArr)
        {
            Helper_PostInfoMessageChatLeave(chatID, affectedUserIDs, userGUIDArr, function(err)
            {
                callback(err);
            });
        });
    }
    else if (messageType == "chat_enter_guid")
    {
        guid.BuildUsersGUIDList(chatUserIDs, function(err, userGUIDArr)
        {
            // affectedUserIDs = {GUID, userID}
            var GUID = affectedUserIDs.GUID;
            var userID = affectedUserIDs.userID;

            Helper_PostInfoMessageChatEnterGUID(chatID, userGUIDArr, userID, GUID, function(err)
            {
                callback(err);
            });
        });
    }
    else if (messageType == "chat_leave_guid")
    {
        // combine userIDs
        var comboArray = chatUserIDs.concat(affectedUserIDs);
        comboArray = common.ArrNoDupe(comboArray);

        guid.BuildUsersGUIDList(comboArray, function(err, userGUIDArr)
        {
            Helper_PostInfoMessageChatLeave(chatID, affectedUserIDs, userGUIDArr, function(err)
            {
                callback(err);
            });
        });
    }
    else
    {
        // unsupported message
        console.log("[PostInfoMessageChatEvent] Error: unsupported info message type: " + messageType);
        callback(null);
    }
}

// Routine posts a message about necessity of upload keys
PostInfoMessageUploadKeys = function(GUID, numberKeysLeft, callback)
{
    var messageID = common.CreateMessageID("", GUID, "", new Date().valueOf().toString(), "upload keys");

    var message = formatOutput.InfoMessageUploadKeys(messageID, numberKeysLeft);

    PostMessageGUID(GUID, message, "info", function(err)
    {
        callback(null);
    });
}

// Routine posts a message about session creation to both parts
PostInfoMessageSessionCreated = function(GUID1, key1, GUID2, key2, callback)
{
    var messageID1 = common.CreateMessageID(GUID2, GUID1, "", new Date().valueOf().toString(), "session created");
    var messageID2 = common.CreateMessageID(GUID1, GUID2, "", new Date().valueOf().toString(), "session created");

    var message1 = formatOutput.InfoMessageSessionCreated(messageID1, key1, key2, GUID2);
    var message2 = formatOutput.InfoMessageSessionCreated(messageID2, key2, key1, GUID1);

    PostMessageGUID(GUID1, message1, "info", function(err)
    {
        PostMessageGUID(GUID2, message2, "info", function(err)
        {
            callback(null);
        });
    });
}

// Routine posts user's status to userIDs
PostInfoMessageStatusChanged = function(userID, GUIDList, status, callback)
{
    var fun_arr = [];

    for (var GUID of GUIDList)
    {
        fun_arr.push(function(GUID, callback)
        {
            // create messageID for each GUID
            var messageID = common.CreateMessageID(userID, GUID, "", new Date().valueOf().toString(), status);

            // format external part of message
            var message = formatOutput.InfoMessageStatusChanged(messageID, userID, status);

            // send message to GUID
            PostMessageGUID(GUID, message, "info", function(err)
            {
                callback(null);
            });
        }.bind(null, GUID));
    }

    async.parallel(fun_arr, function(err)
    {
        callback(err);
    });
}

PostOnlineMessageTypingGUID = function (GUIDTyping, chatID, userGUIDArr, callback) {
    for (let key in userGUIDArr) {
        let GUID = userGUIDArr[key];
        const messageID = common.CreateMessageID(GUIDTyping, GUID, chatID, new Date().valueOf().toString(), "typing");
        // format external part of message
        let message = formatOutput.InfoMessageStatusTyping(messageID, GUIDTyping, chatID);
        PostMessageGUID(GUID, message, "info", function (err) {
                callback(null);
            });
        }
}


// Routine posts one raw message (of any type) to the GUID's queue
// GUID = destination user's device
// message = message json
PostMessageGUID = function(GUID, message, messageType, callback)
{
    // enqueue item
    console.log("MESSAGE TO: " + JSON.stringify(GUID) + "\tmessageBody: " + JSON.stringify(message));
    
    var msgLog=new mongoDB.ModelMsgLog();
    msgLog.msgRcp=GUID
    msgLog.msgType=messageType
    msgLog.msgBody=message
    msgLog.msgID=message.messageID;

    /*
    var model_MessageLog={
    msgRcp:{type:'string'},
    msgType:{type:'string'},
    msgBody:{type:Object},
    msgID:{type:'string'}
}
    */

    var messageStr =
    {
        "type" : messageType,
        "body" : message
    }

    queue_lib.PostMessage(GUID, messageStr).then(function()
    {
        msgLog.save(function(er){
            console.log("Message save result:",er)
            callback(er);
        })        
    }).catch(function(err){
        callback(err);
    });
};

CheckMessageID = function(messageID, messageJson)
{
    try
    {
        var messageText = JSON.parse(messageJson);
        if (messageText.body.messageID == messageID)
        {
            return (true);
        }
        else
        {
            return (false);
        }

    } catch (e)
    {
        console.log("[CheckMessageID] JSON parse error: " + messageJson);
        return (false);
    }
}

// Routine sends data to the specific GUID
SendMessageToGUID = function(GUID, data)
{
	// lookup for user's connection record
	var record = clientTable.GetRecordByGUID(GUID);

	if (record == null)
	{
		// user is currently not connected
		return (false);
	}

    var info = [];
    var status = [];
    var message = [];
    var timestamp = new Date().valueOf().toString();

    // get message type
    if (data.type == "info")
    {
        info.push(data.body);
    }
    else if (data.type == "status")
    {
        status.push(data.body);
    }
    else if (data.type == "message")
    {
        message.push(data.body);
    }
   else
    {
        console.log("Incorrect message type: " + JSON.stringify(data));
        return (false);
    }

	// prepare message text
	var message = JSON.stringify(formatOutput.OutgoingMessage(timestamp, message, status, info));

    // send
	var result = serverUsers.SendDataToSocket(record, message);
	if (result == true)
	{
//		console.log("[" + GUID + "] Message sent to client: " + message);
	}

	return (result);
}

// Helpers

Helper_PostInfoMessageChatEnter = function(chatID, affectedUserIDs, userGUIDArr, callback)
{
    // prepare the message
    var fun_arr = [];
    var userNames = [];

    for (var user in affectedUserIDs)
    {
        var userID = affectedUserIDs[user];

        fun_arr.push(function(userID, callback)
        {
            // request userInfo for each user
            userInfo.Helper_GetUserInfo(userID, function(err, info)
            {
                if (err != null)
                {
                    callback(err);
                    return;
                }

                if (info.displayName)
                {
                    userNames[userID] = info.displayName;
                }

                callback(err);
            });
        }.bind(null, userID));
    }

    async.parallel(fun_arr, function(err)
    {
        if (err != null)
        {
            callback(err);
            return;
        }

        var guidList = [];

        for (var user in affectedUserIDs)
        {
            var userID = affectedUserIDs[user];
            var displayName = userNames[userID];

            for (var g in userGUIDArr[userID])
            {
                var GUID = userGUIDArr[userID][g];

                guidList.push(formatOutput.Helper_InfoMessageChatEnterItem(GUID, userID, displayName));
            }
        }

        Helper_PostChatEventToUserList(chatID, "chat_enter", userGUIDArr, guidList, function(err)
        {
            callback (err);
        });
    });
}

Helper_PostInfoMessageChatLeave = function(chatID, affectedUserIDs, userGUIDArr, callback)
{
    var guidList = [];

    for (var user in affectedUserIDs)
    {
        var userID = affectedUserIDs[user];

        guidList.push(formatOutput.Helper_InfoMessageChatLeaveItem(userID));
    }

    Helper_PostChatEventToUserList(chatID, "chat_leave", userGUIDArr, guidList, function(err)
    {
        callback (err);
    });
}

Helper_PostInfoMessageChatEnterGUID = function(chatID, userGUIDArr, userID, GUID, callback)
{
    var displayName = "";

    userInfo.Helper_GetUserInfo(userID, function(err, info)
    {
        if (err != null)
        {
            callback(err);
            return;
        }

        if (info.displayName)
        {
            displayName = info.displayName;
        }

        // make array from one item
        var guidList = [];
        guidList.push(formatOutput.Helper_InfoMessageChatEnterItem(GUID, userID, displayName));

        Helper_PostChatEventToUserList(chatID, "chat_enter", userGUIDArr, guidList, function(err)
        {
            callback (err);
        });
    });
}

Helper_PostChatEventToUserList = function(chatID, messageType, userGUIDArr, guidList, callback)
{
    var fun_arr = [];

    for (var user in userGUIDArr)
    {
        for (var g in userGUIDArr[user])
        {
            var GUID = userGUIDArr[user][g];

            fun_arr.push(function(GUID, callback)
            {
                // create messageID for each GUID
                var messageID = common.CreateMessageID("", GUID, chatID, new Date().valueOf().toString(), messageType);

                // format external part of message
                var message = formatOutput.InfoMessageChatEvent(messageID, messageType, chatID, guidList);

                // send message to GUID
                PostMessageGUID(GUID, message, "info", function(err)
                {
                    callback(null);
                });
            }.bind(null, GUID));
        }
    }

    async.parallel(fun_arr, function(err)
    {
        callback(err);
    });
}

PostStatusMessageToSender = function(GUID_status, messageID, messageType, callback)
{
    // get message metadata
    // get all sender's GUIDs
    // post status to all GUIDs

    database.QueryMetadataByMessageID(messageID, function(err, message)
    {
        if (err != null)
        {
            callback(500);
            return;
        }

        if (message == null)
        {
            // message not found
            // OR
            // messageID is for status or info which does not have metadata
            callback(200);
            return;
        }

        if (message.type && message.type["S"] != "text")
        {
            callback(200);
            return;
        }

        if (!message.sender)
        {
            callback(200);
            return;
        }

        var senderGUID = message.sender["S"];

        // get userID of sender
        guid.GetUserIDByGUID(senderGUID, function(err, userID)
        {
            if (err != null)
            {
                callback(500);
                return;
            }

            if (userID == null)
            {
                callback(200);
                return;
            }

            guid.Helper_GetUserIDGUIDs(userID, function(err, GUIDList)
            {
                var fun_arr = [];

                for (var i in GUIDList)
                {
                    var GUID = GUIDList[i];

                    fun_arr.push(function(GUID, callback)
                    {
                        var serverTime = new Date().valueOf().toString();
                        var statusMessageID = common.CreateMessageID(GUID_status, GUID, "", serverTime, "message " + JSON.stringify(messageType));

                        var statusMessage = formatOutput.StatusMessage(statusMessageID, messageType, messageID, GUID_status);

                        // post to the queue
                        PostMessageGUID(GUID, statusMessage, "status", function(err)
                        {
                            callback(err);
                        });

                    }.bind(null, GUID));
                }

                async.parallel(fun_arr, function(err)
                {
                    callback(200);
                });
            });
        });
    });
}

// export block
exports.PostInfoMessageChatEvent = PostInfoMessageChatEvent;
exports.PostInfoMessageUploadKeys = PostInfoMessageUploadKeys;
exports.PostInfoMessageSessionCreated = PostInfoMessageSessionCreated;
exports.PostInfoMessageStatusChanged = PostInfoMessageStatusChanged;
exports.PostOnlineMessageTypingGUID = PostOnlineMessageTypingGUID;

exports.PostMessageGUID = PostMessageGUID;
exports.PostStatusMessageToSender = PostStatusMessageToSender;

exports.CheckMessageID = CheckMessageID;

exports.SendMessageToGUID = SendMessageToGUID;
exports.Helper_PostInfoMessageChatLeave = Helper_PostInfoMessageChatLeave;