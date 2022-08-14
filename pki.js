
var common = require ("./common.js");

var pki_impl = require ("./pki_impl.js");
const database = require ('./src/db');
var formatOutput = require ("./format-output.js");
var guid = require ("./guid.js");

var chatUsers = require ("./chat-users.js");


var async = require ("async");

EP_UploadKeys = function(userID, deviceID, req, callback)
{
    var result = {};
    var keys = [];
    var resetKeys = false;

    // validate parameters
    if (req.body)
    {
        keys = req.body;
    }

    // optional parameter
    if (req.params)
    {
        resetKeys = req.params.resetKeys;
    }

    // incoming parameters check
    if (keys == [])
    {
        // bad request
        callback(common.FormatErrorResponse(400));
        return;
    }

    var GUID = common.CreateGUID(userID, deviceID);

    Helper_PutPKIKeys(GUID, keys, resetKeys, function(err)
    {
        if (err != null)
        {
            result = common.FormatErrorResponse(500);
        }
        else
        {
            result = formatOutput.UploadKeys();

//          !!disabled sessions auto-creation
//            // create all missing sessions
//            chatUsers.CreateMissingChatPKISessions(userID, GUID, function(err) {});
        }

        callback (result);
    });
};

EP_CreateSession = function(userID, deviceID, req, callback)
{
    var result = {};
    var GUID1 = "";
    var GUID2 = "";

    // validate parameters
    if (req.body)
    {
        GUID2 = "" + (req.body.GUID) ? req.body.GUID : "";
    }

    // incoming parameters check
    if (GUID2 == "")
    {
        // bad request
        callback(common.FormatErrorResponse(400));
        return;
    }

    GUID1 = common.CreateGUID(userID, deviceID);

    // Drop old session and create new (overwrite)
    pki_impl.CreateSession(GUID1, GUID2, function(err)
    {
        if (err != null)
        {
            result = common.FormatErrorResponse(err);
        }
        else
        {
            result = formatOutput.CreateSession();
        }

        callback (result);
    });
};

/*
// Routine resolves all users and checks GUIDs have a mutual session. Creates it they have not.
ProcessUserIDSessions = function(oldList, newList, callback)
{
    guid.BuildUsersGUIDList(oldList, function(err, GUIDList1)
    {
        if (err != null)
        {
            callback(err);
            return;
        }
        guid.BuildUsersGUIDList(newList, function(err, GUIDList2)
        {
            if (err != null)
            {
                callback(err);
                return;
            }

            var fun_arr = [];

            for (var u1 in GUIDList1)
            {
                for (var g1 in GUIDList1[u1])
                {
                    for (var u2 in GUIDList2)
                    {
                        for (var g2 in GUIDList2[u2])
                        {
                            var GUID1 = GUIDList1[u1][g1];
                            var GUID2 = GUIDList2[u2][g2];
                            if (GUID1 != GUID2)
                            {
                                var param =
                                {
                                    "GUID1" : GUID1,
                                    "GUID2" : GUID2
                                };

                                fun_arr.push(function(param, callback)
                                {
                                    LookupAndCreateSession(param.GUID1, param.GUID2, function(err)
                                    {
                                        callback(err);
                                    });
                                }.bind(null, param));
                            }
                        }
                    }
                }
            }

            async.parallel(fun_arr, function(err)
            {
                callback(err);
            });
        });
    });
}

// Routine resolves all users and checks GUIDs have a mutual session. Creates it they have not.
ProcessGUIDSessions = function(userIDList, GUID, callback)
{
    guid.BuildUsersGUIDList(userIDList, function(err, GUIDList)
    {
        if (err != null)
        {
            callback(err);
            return;
        }

        var fun_arr = [];

        for (var u in GUIDList)
        {
            for (var g in GUIDList[u])
            {
                var GUID1 = GUIDList[u][g];
                if (GUID1 != GUID)
                {
                    fun_arr.push(function(GUID1, callback)
                    {
                        LookupAndCreateSession(GUID, GUID1, function(err)
                        {
                            callback(err);
                        });
                    }.bind(null, GUID1));
                }
            }
        }

        async.parallel(fun_arr, function(err)
        {
            callback(err);
        });
    });
}

// Routine checks whether there is a session between two users and creates it if needed
LookupAndCreateSession = function(GUID1, GUID2, callback)
{
    var sessionID = common.CreateSessionID(GUID1, GUID2);

    database.GetPKISession(sessionID, function(err, sessionExists)
    {
        if (err != null)
        {
            callback(err);
            return;
        }

        if (sessionExists == false)
        {
            // need to create session
            pki_impl.CreateSession(GUID1, GUID2, function(err)
            {
                callback(err);
            });
        }
        else
        {
            // all ok, session exists
            callback(err);
        }
    });
}
*/

// Helpers

Helper_PutPKIKeys = function(GUID, keysArray, resetKeys, callback)
{
    Helper_DeletePKIKeys(GUID, resetKeys, function(err)
    {
        var fun_arr = [];

        for (var i in keysArray)
        {
            var key = keysArray[i];

            fun_arr.push(function(key, callback)
            {
                if (key.key && key.key.length <= 256 && key.sign && key.sign.length <= 512)
                {
                    database.PutGUIDPKIKey(GUID, key.key, key.sign, function(err)
                    {
                        if (err != null)
                        {
                            callback(err);
                            return;
                        }

                        callback(err);
                    });
                }
                else
                {
                    console.log("[Helper_PutPKIKeys] key format error, GUID: " + GUID);
                    callback (500);
                }

            }.bind(null, key));
        }

        async.parallel(fun_arr, function(err)
        {
            callback(err);
        });
    });
};

Helper_DeletePKIKeys = function(GUID, deleteKeys, callback)
{
    if (deleteKeys == false)
    {
        callback(null);
        return;
    }

    database.GetGUIDPKIKeys(GUID, function(err, keys)
    {
        if (err != null)
        {
            callback(err);
            return;
        }

        var fun_arr = [];

        for (var i in keys)
        {
            key = keys[i];
            fun_arr.push(function(key, callback)
            {
                database.DeleteGUIDPKIKey(GUID, key.key, function(err)
                {
                    callback(null);
                });
            }.bind(null, key));
        }

        async.parallel(fun_arr, function(err)
        {
            callback(err);
        });
    });
};

// export block
exports.EP_UploadKeys = EP_UploadKeys;
exports.EP_CreateSession = EP_CreateSession;

/*
exports.LookupAndCreateSession = LookupAndCreateSession;
exports.ProcessUserIDSessions = ProcessUserIDSessions;
exports.ProcessGUIDSessions = ProcessGUIDSessions;
*/
