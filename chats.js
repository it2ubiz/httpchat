
var database = require('./src/db');

var async = require ("async");

var chatOp = require ("./chat-operations.js");
var formatOutput = require ("./format-output.js");
var guid = require ("./guid.js");
var chatUsers = require ("./chat-users.js");
var chatInfo = require ("./chat-info.js");

var common = require ("./common.js");

try {
    var config = require('./config.js');
} catch (ex) {
    var config = require('./config.dist.js');
}

// Routine creates a chat with name and description, setting caller as the creator user there
EP_CreateChat = function(userID, req, callback)
{
	var chatName = "";
	var userLimit = "";
    var users = [];
	var result = {};

    // validate parameters
	if (req.body)
	{
		chatName = chatName + ((req.body.chatName) ? req.body.chatName : "");
		userLimit = userLimit + ((req.body.userLimit) ? req.body.userLimit : "");
        users = req.body.users;
	}

    // incoming parameters check
	if (chatName == "" || userLimit == "" || users == undefined || users == [])
	{
		// bad request
		callback(common.FormatErrorResponse(400));
		return;
	}

    // check number of users
    userLimit = parseInt(userLimit);
    if (userLimit > config.MaxUsersInChat)
    {
        userLimit = config.MaxUsersInChat;
        console.log("[" + userID + "][CreateChatInt]: userLimit is greater than maximum. Set " + config.MaxUsersInChat);
    }

    // array length check
    if (userLimit < 2 || userLimit < 1 + users.length)
    {
        // bad request (wrong number of users)
		callback(common.FormatErrorResponse(400));
		return;
    }

    // create chat and set creator and user list
    chatOp.CreateChat(userID, chatName, userLimit, users, function(err, chatID, creationTime, addedUsers)
    {
        if (err != 201)
        {
            result = common.FormatErrorResponse(err);
        }
        else
        {
            result = formatOutput.ChatCreated(chatID, creationTime, addedUsers);
        }
        callback(result);
    });
};

// Routine deletes a chat by chatID
EP_DeleteChat = function(userID, req, callback)
{
    var chatID = "";
    var result = {};

    // validate parameters
	if (req.body)
	{
		chatID = chatID + ((req.body.chatID) ? req.body.chatID : "");
	}

	if (chatID == "")
	{
		// bad request
		callback(common.FormatErrorResponse(400));
		return;
	}

	// check caller is owner
	CheckUserIDOwns(userID, chatID, function(err, owner, chatNotFound)
	{
        if (err != null)
        {
            // error working with DB
            callback(common.FormatErrorResponse(500));
			return;
        }
        if (chatNotFound == true)
        {
            // chat not found
            callback(common.FormatErrorResponse(404));
			return;
        }
		if (owner == false)
		{
			// the caller does not own this chat
            callback(common.FormatErrorResponse(403));
			return;
		}

        // Delete chat
        chatOp.DeleteChat(chatID, function(err)
        {
            if (err != null)
            {
                result = common.FormatErrorResponse(400);
            }
            else
            {
                result = formatOutput.ChatDeleted();
            }

            callback(result);
        });
	});
};

// Routine lists user's chats
EP_ListUserChats = function(userID, callback)
{
    var result = {};

    chatUsers.ListUserChats(userID, function(err, chats)
    {
        console.log("Error occured:",err);
        if (err != 200)
        {
            result = common.FormatErrorResponse(err);
        }
        else
        {
            result = formatOutput.ChatList(chats);
        }

        callback(result);
    });
};

EP_AddUsersToChat = function(userID, req, callback)
{
    var chatID = "";
    var userIDList = [];
    var result = {};

    // validate parameters
    if (req.body)
    {
        userIDList = req.body.users;
    }
    if (req.params)
    {
        chatID = "" + ((req.params.chatID) ? req.params.chatID : "");
    }

    if (chatID == "" || userIDList == [] || userIDList === undefined)
    {
        // bad request
        callback(common.FormatErrorResponse(400));
        return;
    }

	// check userID is owner of this chat
	CheckUserIDOwns(userID, chatID, function(err, owner, chatNotFound)
	{
		if (err != null)
		{
			callback(common.FormatErrorResponse(500));
			return;
		}
        if (chatNotFound == true)
		{
			// chatID not found
			callback(common.FormatErrorResponse(404));
			return;
		}
		if (owner == false)
		{
			// user is not a chat's owner
			callback(common.FormatErrorResponse(403));
			return;
		}

		// add users to chat
		chatUsers.AddUsersToChat(chatID, userIDList, function(err, addedUsers)
		{
            if (err != 200)
            {
                result = common.FormatErrorResponse(err);
                callback(result);
            }
            else
            {
                chatUsers.Helper_ListAndFormatChatUsers(addedUsers, function(err1, formattedList)
                {
                    if (err1 != null)
                    {
                        result = common.FormatErrorResponse(500);
                    }
                    else
                    {
                        result = formatOutput.AddChatUsers(formattedList);
                    }

                    callback(result);
                });
            }
		});
	});
};

EP_DeleteUsersFromChat = function(userID, req, callback)
{
    var users = [];
    var chatID = "";

    if (req.body)
    {
        users = req.body.users;
    }

    if (req.params)
    {
        chatID = "" + ((req.params.chatID) ? req.params.chatID : "");
    }

	if (chatID == "" || users == [])
	{
		callback(common.FormatErrorResponse(400));
		return;
	}

	// check user owns this chat
	CheckUserIDOwns(userID, chatID, function(err, owner, chatNotFound)
	{
		if (err != null)
		{
			callback(common.FormatErrorResponse(500));
			return;
		}

        if (chatNotFound == true)
        {
            callback(common.FormatErrorResponse(404));
            return;
        }

        // check userID is in the list
        var found = false;
        for (var user in users)
        {
            if ("" + users[user] == userID)
            {
                found = true;
                break;
            }
        }

        if (owner == false)
        {
            if (found)
            {
                chatUsers.DeleteUsersFromChat(chatID, [userID], function(err, deletedUsers)
                {
                    var result = {};
                    if (err != 200)
                    {
                        result = common.FormatErrorResponse(err);
                    }
                    else
                    {
                        result = formatOutput.DeleteChatUsers(deletedUsers);
                    }
                    callback (result);
                    return;
                });
            }
            else
            {
                callback(common.FormatErrorResponse(403));
                return;
            }
        }
        else
        {
            // owner == true
            if (found)
            {
                // no ownership transfer at now
                // user DeleteChat to delete the chat
                callback(common.FormatErrorResponse(403));
            }
            else
            {
                chatUsers.DeleteUsersFromChat(chatID, users, function(err, deletedUsers)
                {
                    var result = {};
                    if (err != 200)
                    {
                        result = common.FormatErrorResponse(err);
                    }
                    else
                    {
                        result = formatOutput.DeleteChatUsers(deletedUsers);
                    }
                    callback (result);
                });
            }
        }
    });
};

EP_ListChatUsers = function(userID, req, callback)
{
	var result = {};

	var chatID = "";

	if (req.params)
	{
		chatID = "" + req.params.chatID;
	}

	if (chatID == "")
	{
        callback(common.FormatErrorResponse(400));
		return;
	}

    // may be returned: 500, 404, 200
    chatUsers.ListChatUsers(chatID, userID, function(err, userList)
    {
        var result = {};
        if (err != 200)
        {
            result = common.FormatErrorResponse(err);
        }
        else
        {
            result = formatOutput.ListChatUsers(userList);
        }
        callback (result);
    });
};

EP_GetChatInfo = function(userID, req, callback)
{
	var chatID = "";

	if (req.params)
	{
		chatID = "" + req.params.chatID;
	}

	if (chatID == "")
	{
        callback(common.FormatErrorResponse(400));
		return;
	}

    chatUsers.Helper_ListChatUsers(chatID, function(err, users)
    {
        if (err != null)
        {
            callback(common.FormatErrorResponse(500));
    		return;
        }

        var found = false;

        for (var i in users)
        {
            if (users[i] == userID)
            {
                found = true;
                break;
            }
        }
        if (found == true)
        {
            chatInfo.GetChatInfo(chatID, function(err, info)
            {
                var result = {};
                if (err != null)
                {
                    result = common.FormatErrorResponse(500);
                }
                else
                {
                    result = formatOutput.GetChatInfo(info);
                }

                callback (result);
            });
        }
        else
        {
            // user is not in this chat
            callback(common.FormatErrorResponse(403));
        }
    });
};

EP_SetChatInfo = function(userID, req, callback)
{
	var chatID = "";
    var chatName = "";

    if (req.params)
    {
        chatID = "" + req.params.chatID;
    }

    if (req.body)
    {
        chatName = "" + req.body.chatName;
    }

	if (chatID == "" || chatName == "")
	{
        callback(common.FormatErrorResponse(400));
		return;
	}

	// update chat information
	chatInfo.UpdateChatInfo(chatID, chatName, function(err)
	{
        var result = {};
        if (err != null)
        {
            result = common.FormatErrorResponse(500);
        }
        else
        {
            result = formatOutput.SetChatInfo();
        }
        callback (result);

	});
};

// Routine:
// 1. gets all user's chats
// 2. sends to all chat an info message "GUID joined"
// 3. creates sessions for all GUIDs

AddGUIDToChat = function(userID, GUID, callback)
{
    // get user's chats
    chatUsers.Helper_ListUserChats(userID, function(err, chats)
    {
        if (err != null)
        {
            callback(err);
            return;
        }

        // inform each chat
        var fun_arr = [];
        for (var i in chats)
        {
            var chatID = chats[i];

            fun_arr.push(function(chatID, callback)
            {
                chatUsers.AddUserIDGUIDToChat(chatID, userID, GUID, function(err)
                {
                    callback(err);
                });
            }.bind(null, chatID));
        }

        async.parallel(fun_arr, function(err)
        {
            callback(err);
        });
    });
};

//////////////////////////////////////////////////////////
// helpers

// Function returns true if userID is the chatID's owner
CheckUserIDOwns = function(userID, chatID, callback)
{
	var owner = false;
	var ownerID = null;
    var chatNotFound = true;

	database.QueryChatInfo(chatID, function(err, info)
	{
		if (err == null)
		{
			if (info && info.length == 1)
			{
				ownerID = info[0].ownerID["S"];

				if (ownerID == userID)
				{
					owner = true;
				}

                chatNotFound = false;
			}
			else
			{
				console.log("No chat info found: " + chatID);
                chatNotFound = true;
			}
		}
		callback(err, owner, chatNotFound);
	});
};

/// Export block
exports.EP_CreateChat = EP_CreateChat;
exports.EP_DeleteChat = EP_DeleteChat;
exports.EP_ListUserChats = EP_ListUserChats;
exports.EP_AddUsersToChat = EP_AddUsersToChat;
exports.EP_DeleteUsersFromChat = EP_DeleteUsersFromChat;
exports.EP_ListChatUsers = EP_ListChatUsers;
exports.EP_GetChatInfo = EP_GetChatInfo;
exports.EP_SetChatInfo = EP_SetChatInfo;

exports.AddGUIDToChat = AddGUIDToChat;
