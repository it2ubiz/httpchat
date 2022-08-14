const express = require('express');
const nodeRSA = require('node-rsa');
const fs = require('fs');
const https = require('https');

const users = require('./users.js');
const chats = require('./chats.js');
const messages = require('./messages.js');
const token_lib = require('./token.js');
const database = require('./src/db');
const server_ws = require("./server-code-ws.js");
const common = require("./common.js");
const contactList = require("./contactlist.js");
const userinfo = require("./userinfo.js");
const serverid = require("./serverid.js");
const updates = require("./src/update.js");
const devices = require("./src/devices.js");

const company = require("./src/company.js");

//const routes = require("./src/route");

const {authMiddleware, backendMiddleware, updateMiddleware} = require("./src/route/middleware");

let options;

try {
    options = {
        //ca: [fs.readFileSync("../../shared/config/ssl.ca")],
        //cert: fs.readFileSync("../../shared/config/ssl.crt"),
        //key: fs.readFileSync("../../shared/config/ssl.key")
        ca: [fs.readFileSync("../../shared/config/chain3.pem")],
        cert: fs.readFileSync("../../shared/config/cert3.pem"),
        key: fs.readFileSync("../../shared/config/privkey3.pem")
    };
} catch (ex) {
    options = {};
}

let keys = require("./keys.js");
let config;

try {
    config = require('./config.js');
} catch (ex) {
    config = require('./config.dist.js');
}

let demoBackend;
if (config.useDemoBackend === true) {
    demoBackend = require('./demo-backend/demo-backend.js');
}

const defaultReply = function (res) {
    return function (result) {
        res.status(result.statusCode);
        res.json(result.reply);
    }
};


var createServer = function (port) {
    var app = express();

    if (port == 443) {
        var server = https.createServer(options, app);
        var expressWs = require('express-ws')(app, server);
    } else {
        var server = app;
        var expressWs = require('express-ws')(app);
    }

    console.log("[Server] created at port: " + port);

    var bodyParser = require('body-parser');
    app.use(bodyParser.json()); // support json encoded bodies
    app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

    // if running in Amazon environment we should generate the server name using local instance id
    if (!config.noAmazon || config.noAmazon == false) {
        serverid.SetUpServerID(function () {
            server_ws.Init(function (err) {
                if (err) {
                    console.log('Server Init', err);
                }
            });
        });
    }
    else {
        // running outside the Amazon environment
        server_ws.Init(function (err) {
            if (err) {
                console.log('Server Init', err);
            }
        });
    }

    // if websockets
    app.ws("/", function (conn, req) {
        server_ws.HandleWebsocketConnection(conn, req);
    });

    app.get(config.APIPath + '/', function (req, res) {
        res.send('Welcome to SafeChats Communications Platform!');
    });

    app.get('/', function (req, res) {
        res.send('Welcome to SafeChats Communications Platform!');
    });

    // GET /version
    app.get(config.APIPath + '/version', function (req, res) {
        var pjson = require('./package.json');
        if (pjson) {
            var version = pjson.version;
            if (version && (version != "")) {
                res.json({
                    "version": pjson.version
                });
            } else {
                res.status(404);
                res.json({
                    "error": "Unknown"
                });
            }
        } else {
            res.status(404);
            res.json({
                "error": "Unknown"
            });
        }
    });

    // GET /get-update
    /*
    app.get(config.APIPath + '/update', function (req, res) {
        updates.GetUpdate(req,defaultReply(res));
    });
    */

    // GET /publicKey
    app.get(config.APIPath + '/publicKey', function (req, res) {
        if (keys && keys.pubserverKey) {
            var publicKey = keys.pubserverKey;
            res.json({
                "publicKey": publicKey
            });
        } else {
            res.status(404);
            res.json({
                "error": "Unknown"
            });
        }
    });

    /// Tokens

    // POST /token
    app.post(config.APIPath + '/token', function (req, res) {
        var result = users.postUser(req);

        res.status(result.statusCode);
        res.json(result.reply);
    });

    // PUT /token
    app.put(config.APIPath + '/token', function (req, res) {
        var result = users.refreshUser(req);

        res.status(result.statusCode);
        res.json(result.reply);
    });


    // GET /backend/contactlist
    app.get(config.APIPath + '/backend/contactlist', [backendMiddleware], function (req, res) {
        contactList.GetContactIds(res.locals.userID, req, defaultReply(res));
    });

    // POST /backend/contactlist
    app.post(config.APIPath + '/backend/contactlist', [backendMiddleware], function (req, res) {
        contactList.SyncContacts(res.locals.userID, req, defaultReply(res));
    });


    // Devices

    app.get(config.APIPath + '/backend/devices', [backendMiddleware], function (req, res) {
        devices.listDevices(res.locals.userID, null, req, defaultReply(res));
    });

    app.put(config.APIPath + '/backend/devices/lock', [backendMiddleware], function (req, res) {
        devices.lockDevice(res.locals.userID, req.body.deviceID, req, defaultReply(res));
    });

    app.delete(config.APIPath + '/backend/devices/lock', [backendMiddleware], function (req, res) {
        devices.unlockDevice(res.locals.userID, req.body.deviceID, req, defaultReply(res));
    });

    app.put(config.APIPath + '/backend/devices/erase', [backendMiddleware], function (req, res) {
        devices.eraseDevice(res.locals.userID, req.body.deviceID, req, defaultReply(res));
    });

    app.get(config.APIPath + '/backend/devices/new', [backendMiddleware], function (req, res) {
        devices.getNewDevicesState(res.locals.userID, req, defaultReply(res));
    });

    app.put(config.APIPath + '/backend/devices/new', [backendMiddleware], function (req, res) {
        devices.enableNewDevices(res.locals.userID, req, defaultReply(res));
    });

    app.delete(config.APIPath + '/backend/devices/new', [backendMiddleware], function (req, res) {
        devices.disableNewDevices(res.locals.userID, req, defaultReply(res));
    });

    //Special

    // GET /set-update
    app.post(config.APIPath + '/update', [updateMiddleware], function (req, res) {
        updates.SetUpdate(req, defaultReply(res));
    });

    //Company info
    app.post(config.APIPath + '/backend/companyinfo', [backendMiddleware], function (req, res) {
       company.SetCompInfo(req,defaultReply(res));
    });

///////////////////////////////////
// Public API

    // require accessToken

    /// Chats management

    var APIPath = config.APIPath + config.PublicPath;

    console.log("[Server] listening at: " + APIPath);

    // PUT /chats
    app.put(APIPath + '/chats', [authMiddleware], function (req, res) {
        chats.CreateChatInt(req, defaultReply(res));
    });

    // DELETE /chats
    app.delete(APIPath + '/chats', [authMiddleware], function (req, res) {
        chats.DeleteChatInt(req, defaultReply(res));
    });

    // GET /chats
    app.get(APIPath + '/chats', [authMiddleware], function (req, res) {
        chats.listChatsForUserInt(req, defaultReply(res));
    });

    /// Chat room management

    // PUT /chats/:chatID/users
    // Params: token, users, chatName
    app.put(APIPath + '/chats/:chatID/users', [authMiddleware], function (req, res) {
        chats.AddUsersToChatPublicInt(req, defaultReply(res));
    });

    // DELETE /chats/:chatID/users
    app.delete(APIPath + '/chats/:chatID/users', [authMiddleware], function (req, res) {
        chats.DeleteUsersFromChatPublicInt(req, defaultReply(res));
    });

    // GET /chats/:chatID/users
    app.get(APIPath + '/chats/:chatID/users', [authMiddleware], function (req, res) {
        chats.listUsersInChatPublicInt(req, defaultReply(res));
    });

    /// Chat information

    // GET /chats/info
    app.get(APIPath + '/chats/:chatID/info', [authMiddleware], function (req, res) {
        chats.GetChatInfo(req, defaultReply(res));
    });

    // PUT /chats/info
    app.put(APIPath + '/chats/:chatID/info', [authMiddleware], function (req, res) {
        chats.SetChatInfo(req, defaultReply(res));
    });

    // User information

    // GET /user/info
    app.get(APIPath + '/user/info', [authMiddleware], function (req, res) {
        userinfo.GetUserInfo(res.locals.userID, req, defaultReply(res));
    });

    // PUT /user/info
    app.put(APIPath + '/user/info', [authMiddleware], function (req, res) {
        userinfo.SetUserInfo(res.locals.userID, req, defaultReply(res));
    });

    /// Contact list

    // GET /contactlist
    app.get(APIPath + '/contactlist', [authMiddleware], function (req, res) {
        contactList.GetContactList(res.locals.userID, req, defaultReply(res));
    });


    // PUT /contactlist/contacts
    app.put(APIPath + '/contactlist/contacts', [authMiddleware], function (req, res) {
        contactList.PutContacts(res.locals.userID, req, defaultReply(res));
    });


    // DELETE /contactlist/contacts
    app.delete(APIPath + '/contactlist/contacts', [authMiddleware], function (req, res) {
        contactList.DeleteContacts(res.locals.userID, req, defaultReply(res));
    });

    /// Contact list customizations

    // PUT /contactlist/customizations
    app.put(APIPath + '/contactlist/customizations', [authMiddleware], function (req, res) {
        contactList.PutCustomizations(res.locals.userID, req, defaultReply(res));
    });

    /// Messaging

    // GET /messages
    app.get(APIPath + '/messages', function (req, res) {
        messages.getMessages(req, defaultReply(res));
    });

    // POST /messages
    app.post(APIPath + '/messages', function (req, res) {
        var result = messages.postMessages(req, defaultReply(res));

    });
    // GET amazon credentials for the chat
    app.get(APIPath + "/chats/:chatID/amazonCredentials", function (req, res) {
        database.RequestClientCredentials(req, defaultReply(res));

    });
///////////////////////////////////
// backend

    // DELETE /users/:userGUID
    app.delete(config.APIPath + '/users/:userGUID', function (req, res) {

        users.deleteUser(req, defaultReply(res));
    });
    // PUT /chats/:chatID/users
    // Params: userList
    app.put(config.APIPath + config.BackendPath + '/chats/:chatID/users', function (req, res) {
        chats.addUserToChatBackend(req, defaultReply(res));
    });
    // DELETE /chats/:chatID/users
    app.delete(config.APIPath + config.BackendPath + '/chats/:chatID/users', function (req, res) {
        chats.deleteUsersFromChatBackend(req, defaultReply(res));
    });
    // GET /chats/:chatID/users
    app.get(config.APIPath + config.BackendPath + '/chats/:chatID/users', function (req, res) {
        chats.listUsersInChatBackend(req, defaultReply(res));
    });
    // DELETE /chats/:chatID
    app.delete(config.APIPath + config.BackendPath + '/chats/:chatID', function (req, res) {
        chats.deleteChatBackend(req, defaultReply(res));
    });
    if (config.useDemoBackend === true) {

        demoBackend.setup(config, app);
        // console.log("Added demo backend API endpoints")
    }

    keys.InitializeKeys(false, true); // Params: force?, silent?

    console.log("Starting to listen for requests on port " + port);

    return server.listen(port);
};

module.exports = createServer;
