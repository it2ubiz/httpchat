const async = require("async");
const database = require('./src/db');
const common = require("./common.js");
const devices = require('./src/devices.js');

// Routine retrieves GUID list by userID
Helper_GetUserIDGUIDs = function (userID, callback) {
    database.QueryUserDeviceByUserID(userID, function (err, items) {
        if (err !== null) {
            callback(err);
        }
        else {
            items = database.processResult(items);
            let result = items.map(item => item.GUID);
            callback(null, result);
        }
    });
};

// Routine retrieves UserID by GUID
GetUserIDByGUID = function (GUID, callback) {
    database.QueryUserDeviceByGUID(GUID, function (err, items) {
        if (err !== null) {
            callback(err);
            return;
        }
        if (items.length === 0) {
            callback(null, null);
            return;
        }
        items = database.processResult(items);
        callback(null, items[0].userID);
    });
};

// Routine retrieves arn by GUID
GetUserArnByGUID = function (GUID, callback) {
    database.QueryUserDeviceByGUID(GUID, function (err, items) {
        if (err !== null) {
            callback(err, {arn: null, platform: null});
            return;
        }
        if (items.length === 0) {
            callback(`No records for guid: ${GUID}`, {arn: null, platform: null});
            return;
        }
        items = database.processResult(items);
        if (items[0].arn && items[0].platform) {
            callback(null, {arn: items[0].arn, platform: items[0].platform});
        }
        else {
            callback(`User device arn,platform missing for guid: ${GUID}`, {arn: null, platform: null});
        }
    });
};


// Routine retrieves device list by userID
// fix: not used?
Helper_GetUserIDDevices = function (userID, callback) {
    database.QueryUserDeviceByUserID(userID, function (err, items) {
        if (err !== null) {
            callback(err);
        }
        else {
            items = database.processResult(items);
            items = items.map((item) => item.deviceID);
            callback(null, items);
        }
    });
};


// Routine creates output list containing userID and all its GUIDs
BuildUsersGUIDList = function (userIDList, callback) {
    let userGUIDArr = [];
    let fun_arr = [];

    // resolve all userIDs
    for (const userID of userIDList) {
        fun_arr.push(function (userID, callback) {
            Helper_GetUserIDGUIDs(userID, function (err, items) {
                if (err !== null) {
                    callback(err);
                    return;
                }
                userGUIDArr[userID] = items;
                callback(null);

            });
        }.bind(null, userID));
    }

    async.parallel(fun_arr, function (err) {
        if (err !== null) {
            callback(err);
            return;
        }

        callback(err, userGUIDArr);
    });
};

// Routine checks the device is new and adds it if not
// TODO: store deviceType
AddUserDevice = function (userID, deviceID, deviceType, callback) {
    devices.getDeviceInt(userID, deviceID, function (err, device) {
        if (err !== null) {
            callback(err);
            return;
        }
        if (device) {
            if (!device.platform) {
                let platform = deviceType === 'node_client' ? 'node' : deviceType;
                device.platform = platform;
                database.UpdateDevice(device).then(function () {
                    callback(null, false, device.GUID);
                }).catch(function (err) {
                    callback(err);
                });
                return;
            }
            callback(null, false, device.GUID);
            return;
        }

        const GUID = common.CreateGUID(userID, deviceID);

        // let arn = "";
        // amazonSns.createArn(deviceType, deviceToken, userID, function (err, arn) {
        // process deviceID && deviceType
        let platform = deviceType === 'node_client' ? 'node' : deviceType;
        database.AddUserDevice(GUID, userID, deviceID, platform, function (err) {
            if (err !== null) {
                callback(err);
                return;
            }

            callback(null, true, GUID);
        });
    });
};

// export block
exports.Helper_GetUserIDGUIDs = Helper_GetUserIDGUIDs;
exports.Helper_GetUserIDDevices = Helper_GetUserIDDevices;
exports.BuildUsersGUIDList = BuildUsersGUIDList;
exports.GetUserIDByGUID = GetUserIDByGUID;
exports.GetUserArnByGUID = GetUserArnByGUID;


exports.AddUserDevice = AddUserDevice;
