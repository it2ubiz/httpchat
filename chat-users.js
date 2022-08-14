var async = require("async");
const amazon_sts = require('./amazon_sts.js');
const database = require('./src/db');

var formatOutput = require("./format-output.js");

var guid = require("./guid.js");
var chatInfo = require("./chat-info.js");
var chatUsers = require("./chat-users.js");
var userInfo = require("./userinfo.js");
var pki = require("./pki.js");

var common = require("./common.js");

var message_lib = require("./message-fun.js");


// Routine deletes all chat users
DeleteChatUsers = function (chatID, callback) {
    Helper_ListChatUsers(chatID, function (err, users) {
        DeleteUsersFromChat(chatID, users, function (err) {
            if (err != null) {
                callback(err);
                return;
            }

            callback(200);
        });
    });
};

// Routine gets list of user's chats
Helper_ListUserChats = function (userID, callback) {
    var chats = [];
    var fun_arr = [];

    database.QueryChatsByUserID(userID, function (err, chatList) {
        if (err != null) {
            // error occurred
            console.log("[" + userID + "][Helper_ListUserChats] error: " + err);
            callback(err);
            return;
        }
        console.log("Chat list is:",chatList);
        for (var item in chatList) {
            chats.push(chatList[item].chatID["S"]);
        }

        callback(null, chats);
    });
};

ListUserChats = function (userID, callback) {
    // Get chats where user participates
    Helper_ListUserChats(userID, function (err, chats) {
        console.log("Helper_ListUserChats error",err);
        if (err != null) {
            // an error occurred
            callback(500);
            return;
        }

        var userChats = [];
        var fun_arr = [];
        for (var index in chats) {
            var chatID = chats[index];

            fun_arr.push(function (chatID, callback) {
                // for each chat retrieve chat info and user list
                chatInfo.GetChatInfo(chatID, function (err, info) {
                    if (err != null) {
                        console.log("GetChatInfo err",err);
                        callback(err);
                        return;
                    }

                    Helper_ListChatUsers(chatID, function (err, userList) {
                        if (err != null) {
                            console.log("Helper_ListChatUsers err",err);
                            callback(err);
                            return;
                        }

                        Helper_ListAndFormatChatUsers(userList, function (err, userOutputList) {
                            if (err != null) {
                                console.log("Helper_ListAndFormatChatUsers err",err);
                                callback(err);
                                return;
                            }

                            // finished with one chat
                            userChats.push(formatOutput.ChatItemChatList(chatID, info, userOutputList));
                            callback(null);
                        });
                    });
                });
            }.bind(null, chatID));
        }

        async.parallel(fun_arr, function (err) {
            if (err != null) {
                console.log("Err is: ",err)
                callback(500);
            }
            else {
                callback(200, userChats);
            }
        });
    });
};

// Routine lists chat users's IDs
Helper_ListChatUsers = function (chatID, callback) {
    database.QueryUsersByChatID(chatID, function (err, users) {
        if (err != null) {
            callback(err);
            return;
        }

        var userList = [];

        for (var index in users) {
            var user = users[index].userID["S"];
            userList.push(user);
        }

        callback(err, userList);
    });
};

Helper_ListChatOnlineUsers = function (chatID, callback) {
    Helper_ListChatUsers(chatID, function (err, userList) {
        if (err !== null) {
            callback(err);
            return;
        }
        database.FindUsersOnline(userList).then(function (onlineUserList) {
            callback(null, onlineUserList, userList.length);
        }).catch(function (err) {
            callback(err);
        });
    })
};

// Routine formats and gives output as a userID-GUID list
Helper_ListAndFormatChatUsers = function (userList, callback) {
    var userOutputList = [];
    var fun_arr2 = [];
    for (var userIndex in userList) {
        var user = userList[userIndex];

        fun_arr2.push(function (user, callback) {
            // get GUID list for userID
            guid.Helper_GetUserIDGUIDs(user, function (err, GUIDList) {
                if (err != null) {
                    callback(err);
                    return;
                }

                // get userinfo for userID
                userInfo.Helper_GetUserInfo(user, function (err, info) {
                    if (err != null) {
                        callback(err);
                        return;
                    }

                    // form output substructure
                    userOutputList = userOutputList.concat(formatOutput.UserListChatList(user, GUIDList, info.displayName));
                    callback(null);
                });
            });
        }.bind(null, user));
    }

    async.parallel(fun_arr2, function (err) {
        if (err != null) {
            callback(err);
        }
        else {
            callback(null, userOutputList);
        }
    });
};

// routine adds a user list to the chat
AddUsersToChat = function (chatID, userIDList, callback) {
    // scenario
    // 1. check user limit

    // get domainName for chat
    database.QueryChatInfo(chatID, function (err, info) {
        var domainName0 = "";
        var userLimit = null;
        var oldChatBuddies = [];
        var newChatBuddies = [];
        var fun_arr = [];

        if (err != null || info.length == 0) {
            callback(500);
            return;
        }

        if (info[0].userLimit) {
            userLimit = info[0].userLimit["N"];
        }

        ////
        // check user limit
        ////
        Helper_ListChatUsers(chatID, function (err, users) {
            if (err != null) {
                callback(err);
                return;
            }

            var currUserCount = users.length;
            if (currUserCount >= userLimit) {
                // user limit exceeded
                callback(409);
                return;
            }

            // prepare list of users to send message on
            oldChatBuddies = users;

            ////
            // add all users to the chat
            ////
            domainName0 = info[0].domainName["S"];

            for (user in userIDList) {
                var userID = "" + userIDList[user];

                if (common.getDomainNameForUserID(userID) != domainName0) {
                    // an attempt to add cross-domain user
                    // do not add him
                    continue;
                }

                fun_arr.push(function (userID, callback) {
                    ///
                    // add each user to the chat
                    ///
                    AddUserToChat(chatID, userID, function (err) {
                        if (err == null) {
                            // add user to the chat user list
                            newChatBuddies.push(userID);
                        }
                        callback(null);
                    });
                }.bind(null, userID));
            }

            async.parallel(fun_arr, function (err)
            {
                if (err == null)
                {
                    if (newChatBuddies.length > 0)
                    {
                        // combine lists and make it unique
                        newChatBuddies = common.ArrNoDupe(newChatBuddies);
                        var allChatBuddies = oldChatBuddies.concat(newChatBuddies);
                        allChatBuddies = common.ArrNoDupe(allChatBuddies);

                        // send notifications to all users in this chat (including new users)
                        message_lib.PostInfoMessageChatEvent("chat_enter", chatID, allChatBuddies, newChatBuddies, function (err) {});

//                          disable auto-creation of sessions
//                        // create sessions with newly added users
//                        pki.ProcessUserIDSessions(oldChatBuddies, newChatBuddies, function(err) {});
                    }
                }

                // return positive result anyway
                callback(200, newChatBuddies);
            });
        });
    });
};

AddUserIDGUIDToChat = function (chatID, userID, GUID, callback) {
    Helper_ListChatUsers(chatID, function (err, userIDList) {
        if (err != null) {
            callback(err);
            return;
        }

        var param =
            {
                "userID": userID,
                "GUID": GUID
            };

        message_lib.PostInfoMessageChatEvent("chat_enter_guid", chatID, userIDList, param, function (err) {
        });

        // disable auto-creation sessions
        // pki.ProcessGUIDSessions(userIDList, GUID, function(err) {});

        callback(null);
    });
};

/*
CreateMissingChatPKISessions = function(userID, GUID, callback)
{
    // get user chats
    // for each chat check and create user sessions

    var fun_arr = [];
    var totalUserIDList = [];

    Helper_ListUserChats(userID, function(err, chats)
    {
        for (var i in chats)
        {
            var chatID = chats[i];

            fun_arr.push(function(chatID, callback)
            {
                Helper_ListChatUsers(chatID, function(err, userIDList)
                {
                    if (err != null)
                    {
                        callback(err);
                        return;
                    }

                    totalUserIDList = totalUserIDList.concat(userIDList);
                    callback(null);
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

            totalUserIDList = common.ArrNoDupe(totalUserIDList);

            pki.ProcessGUIDSessions(totalUserIDList, GUID, function(err) {});

            callback(null);
        });
    });
}
*/

// Routine deletes a list of users from the chat
DeleteUsersFromChat = function (chatID, userList, callback) {
    var fun_arr = [];
    var deletedList = [];
    var oldChatBuddies = [];

    // get user list
    Helper_ListChatUsers(chatID, function (err, users) {
        if (err != null) {
            callback(500);
            return;
        }

        oldChatBuddies = users;

        for (var i in userList) {
            var userToDelete = "" + userList[i];

            for (var index in users) {
                var user = "" + users[index];

                if (userToDelete == user) {
                    fun_arr.push(function (user, callback) {
                        // delete user from chat, if succeeded - add him to the list
                        database.DeleteUserFromChat(chatID, user, function (err) {
                            if (err != null) {
                                // do not raise any error
                                callback(null);
                            }
                            else {
                                deletedList.push(user);
                                callback(null);
                            }
                        });
                    }.bind(null, user));
                    break;
                }
            }
        }
        async.parallel(fun_arr, function (err) {
            if (err != null) {
                // if somehow we got an error - return error
                callback(500);
            }
            else {
                // send "chat_leave" to all users
                message_lib.PostInfoMessageChatEvent("chat_leave", chatID, oldChatBuddies, deletedList, function (err) {
                });
                callback(200);
            }
        });
    });
};

// Routine returns chat users of the userID is allowed to request it
ListChatUsers = function (chatID, userID, callback) {
    // get list of chat users
    Helper_ListChatUsers(chatID, function (err, users) {
        if (err != null) {
            callback(500);
            return;
        }

        var found = false;

        // prepare list of users to send message on
        for (var i in users) {
            if (users[i] == userID) {
                found = true;
                // user found in chat users
                // get GUID list for every userID
                Helper_ListAndFormatChatUsers(users, function (err, userOutputList) {
                    if (err != null) {
                        callback(500);
                    }
                    else {
                        callback(200, userOutputList);
                    }
                });

                break;
            }
        }

        if (found == false) {
            // user not found in chat -> he is not allowed to request this information
            callback(403);
        }
    });
};

RequestClientCredentials = function (chatID, callback) {
    // user exists inside chat
    amazon_sts.getClientCredentials(chatID, function (err, credentials) {
        var result = {};

        if (err != null) {
            result = common.FormatErrorResponse(409);
            console.log("getClientCredentials err = " + err);
        }
        else {
            result = formatOutput.RequestClientCredentials(credentials);
        }

        callback(result);
    });
};


// This routine makes low-level job by adding user to the chat
// does not perform any checks
AddUserToChat = function (chatID, userID, callback) {
    database.AddUserToChat(chatID, userID, function (err) {
        if (err != null) {
            console.log("[" + userID + "][AddUserIDToChat] error: " + err);
        }
        else {
            console.log("[" + userID + "][AddUserIDToChat] added user to the chat: " + chatID);
        }
        callback(err);
    });
};

// export block

exports.DeleteChatUsers = DeleteChatUsers;
exports.Helper_ListUserChats = Helper_ListUserChats;
exports.ListUserChats = ListUserChats;
exports.AddUsersToChat = AddUsersToChat;
exports.AddUserToChat = AddUserToChat;
exports.DeleteUsersFromChat = DeleteUsersFromChat;
exports.ListChatUsers = ListChatUsers;
exports.AddUserIDGUIDToChat = AddUserIDGUIDToChat;

exports.Helper_ListChatUsers = Helper_ListChatUsers;
exports.Helper_ListChatOnlineUsers = Helper_ListChatOnlineUsers;
exports.RequestClientCredentials = RequestClientCredentials;
exports.Helper_ListAndFormatChatUsers = Helper_ListAndFormatChatUsers;
//exports.CreateMissingChatPKISessions = CreateMissingChatPKISessions;
