
var crypto = require('crypto');
var token_lib = require ("./token.js");
var uuid = require('node-uuid');

try {
    var config = require('./config.js');
} catch (ex) {
    var config = require('./config.dist.js');
}

exports.generateSalt = function(len)
{
    var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ',
        setLen = set.length,
        salt = '';
    for (var i = 0; i < len; i++)
	{
        var p = Math.floor(Math.random() * setLen);
        salt += set[p];
    }
    return (salt);
};

exports.validateHash = function(hash, password)
{
    var salt = hash.substr(0, 9); // We use 9 characters for salt when saving password hashes
    var validHash = salt + crypto.createHash('sha512').update(salt + password).digest("hex");

    return (hash === validHash);
};

exports.validateHashMySQL = function(hash, password)
{
    var validHash = crypto.createHash('sha512').update(password).digest("hex");

    return (hash === validHash);
};


exports.getDomainNameForUserID = function(userID)
{
	var domainName = "";

	var n = userID.indexOf("@");
	if (n != -1)
	{
		domainName = userID.substring(n);
	}

	return (domainName);
};

exports.ValidateBackendSecret = function (req, nextFunction, callback)
{
    var backendSecret = process.env.BACKEND_SECRET;
    if (!backendSecret || backendSecret === undefined){
        backendSecret = config.backendSecret;
    }

    var token = "" + req.headers.authorization;
	var result = {};
    result.reply = {};
    // process the user's token and check user is the chat owner or the chat is new

    if (token && token != "" && token === backendSecret)
    {
        var userID = req.body.userID === undefined ? req.query.userID : req.body.userID;
        if (!userID || userID == "")
        {
            result.statusCode = 401;
            result.reply.error = "Bad User";
            callback(result);
            return;
        }
        nextFunction(userID, req, function(result)
        {
            callback(result);
        });

    } else {
        result.statusCode = 401;
        result.reply.error = "Bad token";
        callback(result);

	}
};

exports.ValidateUpdateSecret = function (req, nextFunction, callback) {
    var updateSecret = process.env.UPDATE_SECRET;
    if (!updateSecret || updateSecret === undefined) {
        updateSecret = config.updateSecret;
    }

    var token = "" + req.headers.authorization;
    var result = {};
    result.reply = {};
    // process the user's token and check user is the chat owner or the chat is new

    if (token && token != "" && token === updateSecret) {
        nextFunction(req, callback);
    } else {
        result.statusCode = 401;
        result.reply.error = "Bad token";
        callback(result);

    }
};


// Routine validates token and on success calls nextFunction(userID, req)
exports.ValidateToken = function (req, nextFunction, callback) {
    var token = "" + req.headers.authorization;
	var result = {};
	result.reply = {};
	var userID = "";

	// process the user's token and check user is the chat owner or the chat is new

	if (token && token != "")
	{
		if (token_lib.validateEncryptedToken(token, "accessToken"))
		{
			userID = "" + token_lib.getParamFromAccessToken(token, "userID");
		}
	}

	// TODO: check user's signature

	if (userID == "")
	{
		result.statusCode = 401;
		result.reply.error = "Bad token";
		callback(result);
		return;
	}

	nextFunction(userID, req, function(result)
	{
		callback(result);
	});
};

exports.ArrNoDupe = function(a)
{
    var temp = {};
    for (var i = 0; i < a.length; i++)
        temp[a[i]] = true;
    var r = [];
    for (var k in temp)
        r.push(k);
    return r;
};

const CreateChatID = function(userID, domainName)
{
	var hash = crypto.createHash('sha512');

	hash.update(domainName);
	hash.update(userID);

	// add timestamp
	hash.update(new Date().valueOf().toString());

	var nodeID = hash.digest(); // Returns a Buffer object
	var random = {random: nodeID.slice(0, 16)};
	var chatID = uuid.v4(random);

	return (chatID);
};

const CreateGUID = function(userID, deviceID)
{
	// generate GUID for a new user
	var hash = crypto.createHash('sha512');
	hash.update(userID);
	hash.update(deviceID);
	var nodeID = hash.digest(); // Returns a Buffer object

	var material = {random: nodeID.slice(0, 16)};
	var GUID = uuid.v4(material);

	return (GUID);
};

// Routine creates messageID
const CreateMessageID = function(sender, recipient, chatID, serverTime, messageText)
{
	var hash = crypto.createHash('sha512');

	hash.update(messageText);
	hash.update(serverTime);
	hash.update(JSON.stringify(sender));
	hash.update(JSON.stringify(recipient));
	hash.update(JSON.stringify(chatID));

	var messageID = hash.digest('hex');

	messageID = messageID.slice(0, 32);

	// adding sorting key
	messageID = serverTime + "_" + messageID;

	return (messageID);
};

const CreateSessionID = function(GUID1, GUID2)
{
    var hash = crypto.createHash('sha512');

    var str = "";

    if (GUID1 > GUID2)
    {
        str = GUID2 + GUID1;
    }
    else
    {
        str = GUID1 + GUID2;
    }

    hash.update(str);

    var sessionID = hash.digest('hex');

    sessionID = sessionID.slice(0, 32);

    return (sessionID);
};

const CreateKeyID = function(key1, key2)
{
    return (CreateSessionID(key1, key2));
};

const FormatErrorResponse = function(code)
{
    var result = {};

    result.reply = {};
    result.statusCode = code;

    if (code == 400)
    {
        result.reply.error = "Bad request";
    }
    if (code == 401)
    {
        result.reply.error = "Not authorized";
    }
    if (code == 403)
    {
        result.reply.error = "Bad signature";
    }
    if (code == 404)
    {
        result.reply.error = "Object not found";
    }
    if (code == 409)
    {
        result.reply.error = "Conflict";
    }
    if (code == 500)
    {
        result.reply.error = "Internal server error";
    }

    return (result);
};


// Export block

exports.CreateChatID = CreateChatID;
exports.CreateGUID = CreateGUID;
exports.CreateMessageID = CreateMessageID;
exports.CreateSessionID = CreateSessionID;
exports.CreateKeyID = CreateKeyID;
exports.FormatErrorResponse = FormatErrorResponse;
