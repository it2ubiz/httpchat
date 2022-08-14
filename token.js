
var crypto = require('crypto');
var nodeRSA = require('node-rsa');
var fs = require('fs');

try {
    var config = require('./config.js');
} catch (ex) {
    var config = require('./config.dist.js');
}

var encryptAES = function encryptAES(text) {
    var cipher = crypto.createCipher('aes-256-cbc', config.AESPassword);
    var crypted = cipher.update(text, 'utf8', 'base64');
    crypted += cipher.final('base64');
    return crypted;
};

// Returns an empty string in case of an error
var decryptAES = function decryptAES(text) {
    var decipher = crypto.createDecipher('aes-256-cbc', config.AESPassword);
    try {
        var decrypted = decipher.update(text, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
    } catch (ex) {
        return "";
    }

    return decrypted;
};

// For unit tests only
exports.encryptAES = encryptAES;
exports.decryptAES = decryptAES;

function createToken(type, userID, userPubKey) {
    // type - accessToken / refreshToken
    if ((type != "accessToken") && (type != "refreshToken")) {
        return "";
    }

    if (!userID || (userID == "" ) || !userPubKey || (userPubKey == "")) {
        return "";
    }

    var expires = Math.floor(new Date() / 1000);
    if (type == "accessToken") {
        expires += config.accessTokenValidForSeconds;
    } else if (type == "refreshToken") {
        expires += config.refreshTokenValidForSeconds;
    }

    var hash = crypto.createHmac('sha512', config.serverKeyForHmac);
    hash.update(expires + type + userPubKey + userID);
    var hashValue = hash.digest('hex');

    var tokenDecrypted = hashValue
        + config.tokenDelimiter + expires
        + config.tokenDelimiter + type
        + config.tokenDelimiter + userPubKey
        + config.tokenDelimiter + userID;
    var tokenEncrypted = encryptAES(tokenDecrypted);

    return tokenEncrypted;
}
exports.createAccessToken = function (userID, userPubKey) {
    return createToken("accessToken", userID, userPubKey);
};

exports.createRefreshToken = function (userID, userPubKey) {
    return createToken("refreshToken", userID, userPubKey);
};

var decodeToken = function (encryptedToken) {
    var decodedToken = {};

    var tokenDecrypted = decryptAES(encryptedToken);
    if (tokenDecrypted && (tokenDecrypted != "")) {
        var values = tokenDecrypted.split(config.tokenDelimiter, 5);
        // hash, expires, type, userPubKey, userID
        if (values.length == 5) {
            decodedToken["hash"] = values[0];
            decodedToken["expires"] = values[1];
            decodedToken["type"] = values[2];
            decodedToken["userPubKey"] = values[3];
            decodedToken["userID"] = values[4];
        }
    }

    return decodedToken;
};

// For unit tests only
exports.decodeToken = decodeToken;

var validateDecodedToken = function (decodedToken, ofType) {
    if (decodedToken["hash"] && decodedToken["expires"] && decodedToken["type"]
        && decodedToken["userPubKey"] && decodedToken["userID"]) {
        // TODO: Should check hash first

        if (decodedToken["type"] == ofType) {
            var timestampNow = Math.floor(new Date() / 1000);
            if (decodedToken["expires"] > timestampNow) {
                var hash = crypto.createHmac('sha512', config.serverKeyForHmac);
                hash.update(decodedToken["expires"] + decodedToken["type"]
                    + decodedToken["userPubKey"] + decodedToken["userID"]);
                var hashValue = hash.digest('hex');

                if (decodedToken["hash"] == hashValue) {
                    return true;
                }
            }
        }
    }

    return false;
};

exports.validateDecodedToken = validateDecodedToken;

exports.validateEncryptedToken = function (encryptedToken, ofType) {

    var decodedToken = decodeToken(encryptedToken);

    return validateDecodedToken(decodedToken, ofType);
};

// routine retrieves a requested parameter (name, string) from access token.
// input token is considered to be valid, and no additional token checks is performed.
// returns empty string if the parameter not found
exports.getParamFromAccessToken = function (encryptedToken, param) {
    var decodedToken = decodeToken(encryptedToken);
    return (decodedToken[param]);
};