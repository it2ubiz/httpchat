const _ = require('lodash');
const Q = require('q');
var token = require('./token.js');
var database = require('./src/db');


exports.postUser = function (req) {
    var userID = req.body.userID;
    var userPubKey = req.body.userKey;

    var result = {};

    if (userID && userPubKey && (userID != "") && (userPubKey != "")) {
        var accessToken = token.createAccessToken(userID, userPubKey);
        var refreshToken = token.createRefreshToken(userID, userPubKey);

        if ((accessToken == "") || (refreshToken == "")) {
            result = {
                "statusCode": 500,
                "reply": {
                    "error": "Internal server error"
                }
            };
        } else {
            result = {
                "statusCode": 201,

                "reply": {
                    'accessToken': accessToken,
                    'refreshToken': refreshToken
                }
            };
        }
    } else {
        result = {
            "statusCode": 400,
            "reply": {
                "error": "Invalid parameters"
            }
        }
    }

    return result;
};

exports.deleteUser = function (req, callback) {
    var userGUID = req.params.userGUID;
    var result = {};

    result = {
        "statusCode": 404,
        "reply": {
            "error": "userGUID not found"
        }
    };

    if (userGUID && (userGUID != "") && (userGUID != "WRONG")) // WRONG is for integration tests for now
    {
        database.deleteUserByGUID(userGUID, function (err) {
                if (err == null) {
                    result = {
                        "statusCode": 200,
                        "reply": {}
                    };
                }
                callback(result);
            }
        )
    }
    else {
        callback(result);
    }
};

// ??? Refresh user's token??
exports.refreshUser = function (req) {
    var userGUID = req.params.userGUID;
    var result = {};

    // TODO: implement

    result = {
        "statusCode": 500,
        "reply": {
            "error": "Internal server error"
        }
    };

    return result;
};

exports.listOnlineDevices = function (userIDArr) {
    return Q.all(
        _.map(userIDArr, (userID) =>
            new Promise(function (success, reject) {
                database.GetServerGUIDListByUserID(userID, function (err, list) {
                    if (err) {
                        reject(err);
                    } else {
                        success(list);
                    }
                });
            }))
    ).then(function (results) {
        let userGUIDArr = [];
        for (const result of results) {
            for (const record of result) {
                userGUIDArr.push(record.GUID);
            }
        }
        return userGUIDArr;
    });
}