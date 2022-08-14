
var database = require('./src/db');

var async = require ("async");

var chatInfo = require ("./chat-info.js");
var chatUsers = require ("./chat-users.js");

var common = require ("./common.js");

// Routine creates chat, setting default values, adding userID as creator and a first user
// returns newly created chatID on success
CreateChat = function(userID, chatName, userLimit, userList, callback)
{
    // get domain name from userID
    var domainName = common.getDomainNameForUserID(userID);

    // create a chat and set the caller user as owner
    // create chatID
    var chatID = common.CreateChatID(domainName, userID);

    chatInfo.CreateChatInfo(chatID, chatName, userID, domainName, userLimit, function(err, creationTime)
    {
        if (err != null)
        {
            callback(500);
            return;
        }

        // insert owner to the list
        userList.splice(0, 0, userID);

        // add all users to the chat after the chat has been created
        chatUsers.AddUsersToChat(chatID, userList, function(err, addedUsers)
        {
            if (err != 200)
            {
                // TODO: process other error codes (500, 409)
                callback(err);
            }
            else
            {
                err = 201; // chat created
                chatUsers.Helper_ListAndFormatChatUsers(addedUsers, function(err1, formattedList)
                {
                    if (err1 != null)
                    {
                        err = 500;
                    }

                    callback(err, chatID, creationTime, formattedList);
                });
            }
        });
    });
}

DeleteChat = function(chatID, callback)
{
    // delete all chat users
    chatUsers.DeleteChatUsers(chatID, function(err)
    {
        if (err != 200)
        {
            callback(err);
            return;
        }

        // delete chat info
        database.DeleteChatInfo(chatID, function(err)
        {
            callback(err);
        });
    });
}

// exports block

exports.CreateChat = CreateChat;
exports.DeleteChat = DeleteChat;
