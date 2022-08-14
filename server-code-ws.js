const chats = require("./chats.js");
const messages = require("./messages.js");
const database = require("./src/db");
const contactList = require("./contactlist.js");

const keys = require("./keys.js");

const common = require("./common.js");
const clientTable = require("./client-table.js");
const serverUsers = require("./server-users.js");
const userinfo = require("./userinfo.js");
const user = require("./user.js");
const devices = require("./src/devices.js");
const formatOutput = require("./format-output.js");

const guid = require("./guid.js");
const pki = require("./pki.js");


const serverid = require("./serverid.js");
const mysql = require("./mysql-backend.js");
const queue_lib = require("./src/queueManager");
const updates = require("./src/update");

const amazonSns = require('./amazon_sns.js');

const company = require("./src/company.js");

const push = require("./push.js");
var async = require("async");

let config = {}
try {
    config = require('./config.js');
} catch (ex) {
    config = require('./config.dist.js');
}

defaultReply = function (callback) {
    return function (result) {
        const status = result.statusCode;
        const res = result.reply;
        callback(status, res);
    }
};

exports.Init = function (callback) {
    // generate a server name
    console.log("[INIT]Worker " + serverid.SERVERID + " is starting");
    user.InitUsersOnServerStartup(serverid.SERVERID, function (err) {
        queue_lib.InitializeQueue(config).then(function () {
            callback();
        }).catch(function (err) {
            console.log("[INIT]Worker " + serverid.SERVERID + " error on init");
            callback();
        });
    });
};

exports.HandleWebsocketConnection = function (conn, req) {
    // on connection
    // add connection
    let connItem = {};
    connItem.conn = conn;

    clientTable.Add(connItem);

    conn.on("message", function (data) {
        // find connection
        let record = clientTable.GetRecord(conn);
        if (record === null) {
            // error searching conn occurred
            conn.close();
            return;
        }

        // parse and process
        let parsed = {};
        try {
            parsed = JSON.parse(data);
        }
        catch (ex) {
            console.log("[" + record.userID + "]" + " error parsing JSON");
            Helper_SendBadRequest(record);
            conn.close();
            return;
        }

        if (parsed.method === undefined || parsed.uri === undefined || parsed.clientID === undefined) {
            console.log("[" + record.userID + "] error occurred: invalid parameters");
            Helper_SendBadRequest(record);
            conn.close();
            return;
        }
        else {
            console.log("[" + record.userID + "][" + parsed.method + "]" + ": " + parsed.uri);
        }

        Execute(record, parsed, function (dataToSend) {
            serverUsers.SendDataToSocket(record, JSON.stringify(dataToSend));
        });
    });

    conn.on("close", function (code, reason) {
        // user goes offline
        CloseConnection(conn, code, reason, function (err) {
            console.log(err);
        });
    });
};

HandleOnline = function (record, callback) {
    if (record.userID && record.userID == "" || record.userID == undefined) {
        console.log("UserID = empty");
        callback("Empty userID");
        return;
    }

    // make device (user) online
    guid.AddUserDevice(record.userID, record.deviceID, record.deviceType, function (err, addedFlag, GUID) {
        if (err != null) {
            console.log(err);
            callback(err);
            return;
        }

        if (addedFlag) {
            // send chat_enter messages to every user's chat containing GUID
            // create sessions
            chats.AddGUIDToChat(record.userID, GUID, function (err) {
            });
        }

        // disable auto-creation of sessions
        /*            else
                    {
                        // create all missing sessions
                        chatUsers.CreateMissingChatPKISessions(record.userID, GUID, function(err) {});
                    }
        */

        // create GUID's consumer
        queue_lib.queueEvent('DeviceConnected', {GUID}).then(function () {
            callback();
        }).catch(function (error) {
            callback(error);
        })
    });
};

HandleOffline = function (conn, callback) {    
    const record = clientTable.GetRecord(conn);
    //console.error("HandleOffline for user: ",record.userID);
    if (record == null || record.userID == null) {
        callback("No authentication record for user", null);
        return;
    }

    // delete GUID's consumer
    queue_lib.queueEvent('DeviceDisconnected', {GUID: record.GUID}).then(function (err) {
        // remove device from the server's list
        DELETEOnline(record, function (err) {
            callback(null, record.userID);
        });
    }).catch(function (err) {
        console.log('[QueueEvent][DeviceDisconnected]', err);
        // keep flow running
        DELETEOnline(record, function (err) {
            callback(null, record.userID);
        });
    });
};

// routine sends bad request to the user
Helper_SendBadRequest = function (record) {
    const result = common.FormatErrorResponse(400);

    let reply = {};
    reply.status = result.statusCode;
    reply.error = result.reply;

    serverUsers.SendDataToSocket(record, JSON.stringify(reply));
};

CloseConnection = function (conn, code, reason, callback) {
    HandleOffline(conn, function (err, userID) {
        if (err == null) {
            console.log("[" + userID + "] disconnect reason = " + JSON.stringify(reason) + ", error = " + JSON.stringify(err));
            clientTable.Del(conn);
        }
        else {
            console.log(err);
            // connection was already removed
        }

        callback(err);
    });
}

// this function returns with return code and body block
CheckAndCall = function (record, req, callback) {
    if (req.method === "GET" && req.uri === "/version") {
        GETVersion(req, function (status, res) {
            callback(status, res);
        });
    } else if (req.method === "GET" && req.uri === "/updates") {
        GETUpdate(req, function (status, res) {
            callback(status, res);
        });
    } else if (req.method === "GET" && req.uri === "/publicKey") {
        GETPublicKey(req, function (status, res) {
            callback(status, res);
        });
    } else if (req.method === "POST" && req.uri === "/users/accessToken") {
        POSTAccessToken(record, req, function (status, body) {
            callback(status, body);
            if (status === 200) {
                console.log("[" + serverid.SERVERID + "][" + record.userID + "] connected");

                HandleOnline(record, function (err) {
                    if (err != null) {
                        console.log("[" + record.userID + "] error on HandleOnline(): " + err);
                        record.conn.close();
                    }
                    // send offline messages
                    /*					messages.SendUserMessagesWS(record, function(sentFlag)
                                        {
                                            console.log("[" + record.userID + "] offline messages sent");
                                        });
                    */
                });
            } else if (status === 401) {
                console.log(body);
                console.log(`[${serverid.SERVERID}][${record.userID}] Device not allowed - disconnecting`);
                record.conn.close();
            } else {
                console.log(`[${serverid.SERVERID}][${record.userID}] status: `, status, body)
            }
        });
    }
    else {
        // authorized only
        if (record.userID) {
            if (req.method === "GET" && req.uri === "/chats") {
                GETChats(record, req, callback);
            } else if (req.method === "PUT" && req.uri === "/chats") {
                CreateChat(record, req, callback);
            } else if (req.method === "DELETE" && req.uri === "/chats") {
                DeleteChat(record, req, callback);
            } else if (req.method === "PUT" && req.uri === "/chats/users") {
                PUTChatUsers(record, req, callback);
            } else if (req.method === "DELETE" && req.uri === "/chats/users") {
                DELETEChatUsers(record, req, callback);
            } else if (req.method === "GET" && req.uri === "/chats/users") {
                GETChatUsers(record, req, callback);
            }

            // chat info
            else if (req.method === "GET" && req.uri === "/chats/info") {
                GETChatInfo(record, req, callback);
            } else if (req.method === "PUT" && req.uri === "/chats/info") {
                SETChatInfo(record, req, callback);
            }

            // user info
            else if (req.method === "GET" && req.uri === "/user/info") {
                GETUserInfo(record, req, callback);
            } else if (req.method === "PUT" && req.uri === "/user/info") {
                PUTUserInfo(record, req, callback);
            }

            // devices
            else if (req.method === "GET" && req.uri === "/devices") {
                GETDevices(record, req, callback);
            } else if (req.method === "POST" && req.uri === "/devices") {
                POSTDevices(record, req, callback);
            } else if (req.method === "DELETE" && req.uri === "/devices") {
                DELETEDevices(record, req, callback);
            }

            // device management

            else if (req.method === "PUT" && req.uri === "/devices/lock") {
                PUTDevicesLock(record, req, callback);
            }
            else if (req.method === "DELETE" && req.uri === "/devices/lock") {
                DELETEDevicesLock(record, req, callback);
            }
            else if (req.method === "PUT" && req.uri === "/devices/erase") {
                PUTDevicesErase(record, req, callback);
            }


            else if (req.method === "PUT" && req.uri === "/devices/new") {
                PUTDevicesNew(record, req, callback);
            }
            else if (req.method === "DELETE" && req.uri === "/devices/new") {
                DELETEDevicesNew(record, req, callback);
            }

            // contact list
            else if (req.method === "GET" && req.uri === "/contactlist") {
                GETContactList(record, req, callback);
            }
            else if (req.method === "PUT" && req.uri === "/contactlist/contacts") {
                PUTContact(record, req, callback);
            }
            else if (req.method === "DELETE" && req.uri === "/contactlist/contacts") {
                DeleteContact(record, req, callback);
            }
            // contact customizations
            else if (req.method === "PUT" && req.uri === "/contactlist/customizations") {
                PUTCustomizations(record, req, callback);
            }

            /// messaging
            else if (req.method === "POST" && req.uri === "/messages") {
                POSTMessage(record, req, callback);
            }
            else if (req.method === "PUT" && req.uri === "/typing") {
                PUTTyping(record, req, callback);
            }
            /// misc
            else if (req.method === "GET" && req.uri === "/amazonCredentials") {
                GETAmazonCreds(record, req, callback);
            }
            else if (req.method === "PUT" && req.uri === "/online") {
                PUTOnline(record, callback);
            }
            else if (req.method === "DELETE" && req.uri === "/online") {
                DELETEOnline(record, callback);
            }

            /// keys & sessions
            else if (req.method === "PUT" && req.uri === "/keys") {
                PUTKeys(record, req, callback);
            }
            else if (req.method === "PUT" && req.uri === "/session") {
                PUTSession(record, req, callback);
            }
            else if (req.method === "GET" && req.uri === "/companyinfo") {
                GetCmpInfo(record, req, callback);
            }
            else if (req.method === "PUT" && req.uri === "/sendlistpush") {
                SendListPush(record, req, callback);
            }
            
            /// default handler
            else {
                // unknown method called
                // return 400
                let res = {};
                res.error = "Bad request";
                callback(400, res);
            }
        }
        else {
            // user is not authorized to perform action
            let res = {};
            res.error = "Not authorized";
            callback(401, res);
        }
    }
};

const Execute = function (record, req, callback) {
    // process the request
    CheckAndCall(record, req, function (status, body) {
        // form the result
        let res = {};
        res.method = req.method;
        res.uri = req.uri;
        res.status = status;
        res.clientID = req.clientID;
        if (body !== {}) {
            res.body = body;
        }

        // send the result
        callback(res);
    });
};


/// implementation

// GET /version
GETVersion = function (req, callback) {

    let res = {};
    let status = 404;

    const pjson = require('./package.json');
    if (pjson) {
        const version = pjson.version;
        if (version && (version != "")) {
            status = 200;
            res.version = pjson.version;
        }
        else {
            status = 404;
            res.error = "Unknown";
        }
    }
    else {
        status = 404;
        res.error = "Unknown";
    }

    callback(status, res);
};

// GET /update

GETUpdate = function (req, callback) {
    updates.GetUpdate(req, function (result) {
        const status = result.statusCode;
        const res = result.reply;
        callback(status, res);
    });
};

// GET /publicKey
GETPublicKey = function (req, callback) {
    let res = {};
    let status = 404;

    if (keys && keys.pubserverKey) {
        res.publicKey = keys.pubserverKey;
        status = 200;
    }
    else {
        status = 404;
        res.error = "Unknown";
    }

    callback(status, res);
};

// POST access token (login user)

POSTAccessToken = function (record, req, callback) {
    let password = "";
    let userID = "";
    let deviceType = "";
    let deviceID = "";
    let userKey = "";

    if (req.headers) {
        password = "" + ((req.headers.authorization) ? req.headers.authorization : "");
    }
    if (req.params) {
        userID = "" + ((req.params.userID) ? req.params.userID : "");
        deviceType = "" + ((req.params.deviceType) ? req.params.deviceType : "");
        deviceID = "" + ((req.params.deviceID) ? req.params.deviceID : "");
    }
    if (req.body) {
        userKey = "" + ((req.body.userKey) ? req.body.userKey : "");
    }

    let result = common.FormatErrorResponse(403);
    let status = result.statusCode;
    let body = result.reply;

    if ((password != "") && (userID != "") && (userKey != "") && deviceType != "" && deviceID != "") {
        /*        // check userKey
                // get hash from database
                AmazonUserAuthHelper(userID, password, function(err)
        */

        CheckDeviceAllowed(userID, deviceID, function (err, deviceState) {
            if (err != null) {
                let response;
                console.log(`[${userID}][${deviceID}]`, err);
                if (deviceState === devices.DEVICE_STATE_LOCKED) {
                    response = formatOutput.DeviceLocked();
                } else if (deviceState === devices.DEVICE_STATE_NOT_ALLOWED) {
                    response = formatOutput.DeviceNotAllowed();
                } else {
                    response = common.FormatErrorResponse(500);
                }
                callback(response.statusCode, response.reply);
                return;
            }

            // check user with mysql
            CheckUserMySqlHelper(userID, password, function (err) {
                if (err != null) {
                    console.log("[Login][" + userID + "] " + err);
                    callback(status, body);
                }
                else {
                    status = 200;
                    body = {};

                    let recOld = clientTable.GetRecordByUserID(userID, deviceID);
                    if (recOld != null) {
                        // user already exists
                        console.log("[" + userID + "]" + " connection already exists, dropping old connection");

                        // wait until consumer terminates
                        CloseConnection(recOld.conn, 0, "duplicate connection", function (err) {
                            recOld.conn.close();
                            body = Helper_CreateClient(record, userID, deviceID, deviceType);
                            callback(status, body);
                        });
                    }
                    else {
                        body = Helper_CreateClient(record, userID, deviceID, deviceType);
                        callback(status, body);
                    }
                }
            });
        });
    }
    else {
        console.log("GetAccessToken error: missing required parameters in request: \n\t" +
            "UserID = " + userID + "\n\t" +
            "password = " + password + "\n\t" +
            "userKey = " + userKey + "\n\t" +
            "deviceID = " + deviceID + "\n\t" +
            "deviceType = " + deviceType);

        // bad request (parameters missing)
        let result = common.FormatErrorResponse(400);
        const status = result.statusCode;
        const body = result.reply;

        callback(status, body);
    }
};

Helper_CreateClient = function (record, userID, deviceID, deviceType) {
    var body = {};

    // create and return GUID for user's device
    const GUID = common.CreateGUID(userID, deviceID);

    // continue with new user
    clientTable.SetConnProperty(record.conn, "userID", userID);
    clientTable.SetConnProperty(record.conn, "deviceID", deviceID);
    clientTable.SetConnProperty(record.conn, "deviceType", deviceType);
    clientTable.SetConnProperty(record.conn, "GUID", GUID);

    body.GUID = GUID;

    return (body);
}

//////////////////////////////////////////////////////
// Authorized part

// Create a chat room
// PUT /chats
CreateChat = function (record, req, callback) {
    chats.EP_CreateChat(record.userID, req, defaultReply(callback));
};

// Delete a chat room
// DELETE /chats
DeleteChat = function (record, req, callback) {
    chats.EP_DeleteChat(record.userID, req, defaultReply(callback));
};

// GET /chats
// gets chats for current userID
GETChats = function (record, req, callback) {
    chats.EP_ListUserChats(record.userID, defaultReply(callback));
};

//////////////////////////////////////////////////////
// Chat user management

// PUT /chats/:chatID/users
// PUT user_list to the chat
// Params: chatID, user list
PUTChatUsers = function (record, req, callback) {
    chats.EP_AddUsersToChat(record.userID, req, defaultReply(callback));
};

// DELETE /chats/:chatID/users
// Delete user(s) from chat
DELETEChatUsers = function (record, req, callback) {
    chats.EP_DeleteUsersFromChat(record.userID, req, defaultReply(callback));
};

// GET /chats/:chatID/users
// Get list of users in chat
GETChatUsers = function (record, req, callback) {
    chats.EP_ListChatUsers(record.userID, req, defaultReply(callback));
};

//////////////////////////////////////////////////////
// Chat info

// GET /chats/info
// Get chat information
GETChatInfo = function (record, req, callback) {
    chats.EP_GetChatInfo(record.userID, req, defaultReply(callback));
};

// PUT /chats/info
// Set chat information
SETChatInfo = function (record, req, callback) {
    console.log("set info");
    chats.EP_SetChatInfo(record.userID, req, defaultReply(callback));
};

//////////////////////////////////////////////////////
// User info

// GET /user/info
// Get user information
GETUserInfo = function (record, req, callback) {
    console.log("[***] GETUserInfo request: " + JSON.stringify(req));
    userinfo.GetUserInfo(record.userID, req, function (result) {
        console.log("[***] GETUserInfo result: " + JSON.stringify(result));
        const status = result.statusCode;
        const res = result.reply;

        callback(status, res);
    });
};

// PUT /user/info
// Set user information
PUTUserInfo = function (record, req, callback) {
    userinfo.SetUserInfo(record.userID, req, defaultReply(callback));
};


//////////////////////////////////////////////////////
// Contact list API

GETContactList = function (record, req, callback) {
    console.log("[***] GETContactList request: " + JSON.stringify(req));
    contactList.GetContactList(record.userID, req, function (result) {
        console.log("[***] GETContactList result: " + JSON.stringify(result));
        const status = result.statusCode;
        const res = result.reply;

        callback(status, res);
    });
};

PUTContact = function (record, req, callback) {
    contactList.PutContacts(record.userID, req, defaultReply(callback));
};

DeleteContact = function (record, req, callback) {
    contactList.DeleteContacts(record.userID, req, defaultReply(callback));
};

PUTCustomizations = function (record, req, callback) {
    contactList.PutCustomizations(record.userID, req, defaultReply(callback));
};

GETDevices = function (record, req, callback) {
    devices.listDevices(record.userID, record.deviceID, req, defaultReply(callback));
};

POSTDevices = function (record, req, callback) {
    devices.createDevice(record.userID, record.deviceID, record.deviceType, record.GUID, req, defaultReply(callback));
};

DELETEDevices = function (record, req, callback) {
    devices.removeDeviceFromPush(record.userID, record.GUID, req, defaultReply(callback));
};

PUTDevicesLock = function (record, req, callback) {
    devices.lockDevice(record.userID, req.body.deviceID, req, defaultReply(callback));
};

DELETEDevicesLock = function (record, req, callback) {
    devices.unlockDevice(record.userID, req.body.deviceID, req, defaultReply(callback));
};

PUTDevicesErase = function (record, req, callback) {
    devices.eraseDevice(record.userID, req.body.deviceID, req, defaultReply(callback));
};

PUTDevicesNew = function (record, req, callback) {
    devices.enableNewDevices(record.userID, req, defaultReply(callback));
};

DELETEDevicesNew = function (record, req, callback) {
    devices.disableNewDevices(record.userID, req, defaultReply(callback));
};


//////////////////////////////////////////////////////
// Messaging API
// POST /messages
// Send a message to the chat

POSTMessage = function (record, req, callback) {
//    console.log("["+ record.GUID "(" + record.userID + ")" + "] incoming message");
//    console.log("[***] POSTMessage request: " + JSON.stringify(req));
    messages.EP_IncomingMessages(record.userID, record.deviceID, req, function (result) {
//        console.log("[***] PostMessage result: " + JSON.stringify(result));
        const status = result.statusCode;
        const res = result.reply;

        callback(status, res);
    });
};

PUTTyping = function (record, req, callback) {
    messages.EP_IncomingTyping(record.userID, record.deviceID, req, function (result) {
        let status = result.statusCode;
        let res = result.reply;
        callback(status, res);
    });
};

//////////////////////////////////////////////////////
// Additional functions

// GET amazon credentials for the chat
GETAmazonCreds = function (record, req, callback) {
    database.RequestClientCredentialsInt(record.userID, req, defaultReply(callback));
};

// PUT online status -> on
PUTOnline = function (record, callback) {

    user.SetUserDeviceOnline(record.userID, record.deviceID, serverid.SERVERID, function (result) {
        const status = result.statusCode;
        const res = result.reply;

        console.log("[" + record.userID + "] PUTOnline result: " + JSON.stringify(result));

        callback(status, res);
    });
};

// Set online status -> off
DELETEOnline = function (record, callback) {

    // publish "offline" status only if it was set with "/online"
    user.SetUserDeviceOffline(record.userID, record.deviceID, function (err) {
        let status = 200;
        let res = {};

        callback(status, res);
    });
};


// Routine handles PUT keys operation
PUTKeys = function (record, req, callback) {
    console.log("[***] PUTKeys request");

    // upload keys to server
    pki.EP_UploadKeys(record.userID, record.deviceID, req, function (result) {
        const status = result.statusCode;
        let res = result.reply;

        console.log("[***] PUTKeys result: " + JSON.stringify(result));
        callback(status, res);
    });
};

PUTSession = function (record, req, callback) {
    console.log("[***] PUTSession request");
    // create session manually
    pki.EP_CreateSession(record.userID, record.deviceID, req, function (result) {
        const status = result.statusCode;
        const res = result.reply;

        console.log("[***] PUTSession result: " + JSON.stringify(result));
        callback(status, res);
    });
};


GetCmpInfo = function(record,req,callback){
    company.GetCompInfoByDomain(record.userID,function(err,result){
        const status = result.statusCode;
        const res = result.reply;
        callback(status, res);
    });
}

SendListPush = function(record, req, callback){
     database.QueryUserDeviceByUserID(req.clientID, function (err, data) {
        
        if (err) {
            console.log(err);
            callback(common.FormatErrorResponse(500));
            return;
        }
        let deviceList = database.processResult(data);
        var fun_arr = [];
        //console.log("deviceList :-> ", deviceList);
        var device;
        //var message = formatOutput.TextMessage("1504609321984_ae2ed41e6009a31871e4d3f1283dbe2c", "9c21b53d-b35d-44c2-8008-2c85d4bf0c1a", "messageText", "1504609321984", "2bef6aa5-e2c7-462f-8a27-179f6b96f38e");
        var message="Test_message_for_push";
        for (i=0; i<deviceList.length; i++)
        {
            device = deviceList[i];
            console.log("device :-> ", device);
            fun_arr.push(function (device, callback) {                              
                push.Helper_SendPush(device.arn, device.platform, message, function (err) {
                    console.error("Helper_SendPushNotificationText:",err);
                    callback(err);
                });                
            }.bind(null, device));
        }    
        async.parallel(fun_arr, function (err) {
            callback(err);
        });
    })    
}

// Auth helpers

AmazonUserAuthHelper = function (userID, password, callback) {
    database.GetHashPasswordForUserFromDatabase(userID, function (err, hash) {
        if (err == null) {
            if (hash != null) {
                if (common.validateHash(hash, password)) {
                    callback(null);
                    return;
                }
                else {
                    // userKey is wrong
                    console.log("GetAccessToken error: validateHash failed on hash = " + hash);
                }
            }
            else {
                // there is no such user in the database
                console.log("GetAccessToken error: no user " + userID + " in the database");
            }
        }
        else {
            // there was an error while retrieving user hash from the database
            console.log("GetAccessToken error: GetHashPasswordForUserFromDatabase returned an error: " + err);
        }

        callback("Incorrect userID or password");
    });
};

CheckUserMySqlHelper = function (userID, password, callback) {
    // split userID and domain
    const arr = userID.split("@");
    if (arr.length !== 2) {
        const err = "Wrong username format";
        callback(err);
        return;
    }

    const request = "select salt,password from User where username=? and domain= ? and enabled=1;";
    mysql.QueryMySqlParams(request, [`${arr[0]}`, `${arr[1]}`], function (err, rows) {
        if (err != null) {
            callback(err);
            return;
        }

        err = "Incorrect userID or password";
        if (rows && rows.length > 0) {
            for (let i in rows) {
                const row = rows[i];
                // validate hash
                // echo hash('sha512', $pwd.$salt);
                if (common.validateHashMySQL(row.password, password + row.salt)) {
                    // auth ok
                    callback(null);
                    return;
                }
                else {
                    console.log("GetAccessToken error: validateHash failed for userID = " + userID);
                }
            }
        }
        else {
            console.log("No records for user = " + userID);
        }

        callback(err);
    });
};


CheckDeviceAllowed = function (userID, deviceID, callback) {
    devices.getDeviceInt(userID, deviceID, function (err, device) {
            if (err) {
                callback(err);
                return;
            }
            if (device) {
                if (device.locked) {
                    callback("Device locked", devices.DEVICE_STATE_LOCKED);
                    return;
                } else {
                    callback(null);
                    return;
                }
            } else {
                database.QueryUserInfo(userID, function (err, user) {
                    user = database.processResult(user);
                    if (Array.isArray(user) && user[0]) {
                        user = user[0];
                    }
                    if (!user || user.blockNewDevices !== true) {
                        callback(null);
                        return;
                    } else {
                        callback("Device not allowed", devices.DEVICE_STATE_NOT_ALLOWED);
                        return;
                    }
                });

            }
        }
    );
};
