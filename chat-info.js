
var database = require('./src/db');

// Routine creates chat info structure
CreateChatInfo = function(chatID, chatName, creatorID, domainName, userLimit, callback)
{
	var chatInfo = {};
	var actionTime = new Date().valueOf().toString();

	// fill all the fields
	chatInfo.chatID = {"S" : chatID};
	chatInfo.chatName = {"S" : chatName};
	chatInfo.ownerID = {"S" : creatorID};
	chatInfo.domainName = {"S" : domainName};
	chatInfo.lastUpdateTime = {"N" : "" + actionTime};
	chatInfo.creationTime = {"N" : "" + actionTime};
	chatInfo.userLimit = {"N" : "" + userLimit};

	// save chat info
	database.SetChatInfo(chatInfo, function(err)
	{
		callback(err, actionTime);
	});
};

// Routine updates chat info structure
UpdateChatInfo = function(chatID, chatName, callback)
{
	// trying to read chatInfo
	database.QueryChatInfo(chatID, function(err, info)
	{
		if (err == null)
		{
			// check chat info existed before
			if (info && info.length > 0)
			{
				var actionTime = new Date().valueOf().toString();

				// change only required fields
				var chatInfo = info[0];
				chatInfo.lastUpdateTime = {"N" : actionTime};
				chatInfo.chatName = {"S" : chatName};

				// save chat info
				database.SetChatInfo(chatInfo, function(err)
				{
					callback(err);
				});
			}
			else
			{
				// no chat info, raise error
				err = "No chat info on update!";
                console.log("[" + chatID + "] error: " + err);
				callback(err);
			}
		}
		else
		{
			callback(err);
		}
	});
};

// Routine retrieves chat info
GetChatInfo = function(chatID, callback)
{
	database.QueryChatInfo(chatID, function(err, info)
	{
		if (err == null)
		{
			if (info && info.length > 0)
			{
                var chatInfo = {};

                chatInfo.chatID = info[0].chatID["S"];
                chatInfo.chatName = info[0].chatName["S"];
                chatInfo.ownerID = info[0].ownerID["S"];
                chatInfo.domainName = info[0].domainName["S"];
                chatInfo.lastUpdateTime = info[0].lastUpdateTime["N"];
                chatInfo.creationTime = info[0].creationTime["N"];
                chatInfo.userLimit = info[0].userLimit["N"];

                callback(null, chatInfo);
			}
			else
			{
				// no chat info, raise error
				err = "GetChatinfo: No chat info for: " + chatID;
				
				//Only for debug purposes. Delete it in new version or all chats without chatInfo is over
				console.error("Warning: ",err);
				//Start Block1
				chatInfo.chatID = null;
                chatInfo.chatName = null;
                chatInfo.ownerID = null;
                chatInfo.domainName = "@safechats.com";
                chatInfo.lastUpdateTime = null;
                chatInfo.creationTime = null;
                chatInfo.userLimit = 0;
				//End Block1

				//callback(err); Uncomment it whe Block1 was deleted
			}
		}
		else
		{
			callback(err);
		}
	});
};

/// export section

exports.CreateChatInfo = CreateChatInfo;
exports.UpdateChatInfo = UpdateChatInfo;
exports.GetChatInfo = GetChatInfo;
