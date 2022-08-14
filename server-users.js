/*
	This file implements server side user communication functions.
*/
var async = require("async");

var clientTable = require("./client-table.js")
const database = require ('./src/db');

var common = require("./common.js");
var contactlist = require("./contactlist.js");

var chatUsers = require("./chat-users.js");
var messages_lib = require("./message-fun.js");

var users = require ("./users.js");

SendDataToSocket = function(record, data)
{
	var result = true;
	try
	{
		record.conn.send(data);
	}
	catch (ex)
	{
		// web socket is closed
		console.log("Exception on send: " + ex);
		record.conn.close();
		result = false;
	}
	return (result);
}

// export block

exports.SendDataToSocket = SendDataToSocket;

// TODO: refactor
// sends status to all userID's subscriptors
exports.SendStatus = function(userID, deviceID, status, callback)
{
	//1. send offline messages to all user's chats
	chatUsers.Helper_ListUserChats(userID, function(err, chatList)
	{
		if (err != null)
		{
			console.log("[" + userID + "][SendStatus][QueryChats] error = " + err);
			callback(err);
			return;
		}

		var fun_arr = [];
		var usersArray = [];

		for (var chat in chatList)
		{
			var chatID = chatList[chat];

			fun_arr.push(function(chatID, callback)
			{
				chatUsers.Helper_ListChatUsers(chatID, function(err, users)
				{
					if (err != null)
					{
						callback(err);
						return;
					}

					usersArray = usersArray.concat(users);
					callback(err);
				});
			}.bind(null, chatID));
		}

		async.parallel(fun_arr, function(err)
		{
			if (err != null)
			{
				callback(err);
				return;
			}

			usersArray = common.ArrNoDupe(usersArray);
			// exclude self
			for (var user of usersArray)
			{
				if (user == userID)
				{
					usersArray.splice(usersArray.indexOf(user), 1);
					break;
				}
			}

			users.listOnlineDevices(usersArray).then(function(GUIDArr)
			{
				console.log("[" + userID + "][SendStatus](" + status + ") sending to: " + JSON.stringify(GUIDArr));

				messages_lib.PostInfoMessageStatusChanged(userID, GUIDArr, status, function(err)
				{
					callback(err);
				});
			}).catch(function (err)
			{
				console.log("[" + userID + "][SendStatus](" + status + ") sending error: ", err);
				callback(err);
			});
		});
	});
}
