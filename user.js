
var database = require('./src/db');

var serverUsers = require ("./server-users.js");
var clientTable = require ("./client-table.js");

var formatOutput = require ("./format-output.js");

var common = require ("./common.js");

var async = require("async");
var contactlist = require("./contactlist.js");


InitUsersOnServerStartup = function(serverID, callback)
{
    database.GetServerGUIDListByServerID(serverID, function(err, deviceList)
    {
        if (err != null)
        {
            callback(err);
            return;
        }

        // form unique list of userIDs
        var userIDList = [];
        for (var i in deviceList)
        {
            userIDList.push(deviceList[i].userID);
        }
        userIDList = common.ArrNoDupe(userIDList);
        var oldUserIDList = common.ArrNoDupe(userIDList);

        var fun_arr = [];

        for (var i in deviceList)
        {
            fun_arr.push(function(i, callback)
            {
                var GUID = deviceList[i].GUID;

                database.DeleteServerGUIDItem(GUID, function(err)
                {
                    // if userIDList contains current userID - delete presence for this userID
                    var notFound = true;
                    for (var j in userIDList)
                    {
                        if (userIDList[j] == deviceList[i].userID)
                        {
                            notFound = false;
                            Helper_DeletePresence(deviceList[i].userID, function(err)
                            {
                                // remove userID from the list
                                userIDList.splice(i, 1);
                                callback(err);
                            });
                            break;
                        }
                    }

                    if (notFound == true)
                    {
                        callback(err);
                    }
                });
            }.bind(null, i));
        }

        async.series(fun_arr, function(err)
        {
            if (err != null)
            {
                console.log("[INIT][" + serverID + "] ServerGUID data clear error: " + err);

            }
            else
            {
                console.log("[INIT][" + serverID + "] ServerGUID data cleared for: " + JSON.stringify(oldUserIDList));
            }

            callback(err);
        });
    });
}

SetUserDeviceOnline = function(userID, deviceID, serverID, callback)
{
    var result = {};
    var GUID = common.CreateGUID(userID, deviceID);

    database.AddServerGUIDItem(GUID, userID, serverID, function(err)
    {
        if (err != null)
        {
            result = common.FormatErrorResponse(500);
            callback(result);
        }
        else
        {
            Helper_SetPresence(userID, function(err)
            {
                if (err != null)
                {
                    result = common.FormatErrorResponse(500);
                    callback(result);
                }
                else
                {
                    database.GetServerGUIDListByUserID(userID, function(err, deviceList)
                    {
                        if (err != null)
                        {
                            result = common.FormatErrorResponse(500);
                            callback(result);
                        }

                        if (deviceList.length == 1)
                        {
                            serverUsers.SendStatus(userID, deviceID, "online", function(err)
                            {
                                //TO_DO Make method to get account with flag isSupport=1 and put it on this function
                                //Temporary set service_support@safechats.com
                                SupportHelper(userID,"service_support@safechats.com",function(err){
                                    result = formatOutput.PutOnline();                                
                                    callback(result);
                                });                                
                            });
                        }
                        else
                        {
                            // no need to send online status
                            //TO_DO Make method to get account with flag isSupport=1 and put it on this function
                            //Temporary set service_support@safechats.com
                            SupportHelper(userID,"service_support@safechats.com",function(err){
                                result = formatOutput.PutOnline();
                                callback(result);
                            });
                        }
                    });
                }
            });
           
        }
    });
}

SetUserDeviceOffline = function(userID, deviceID, callback)
{
    var result = {};
    var GUID = common.CreateGUID(userID, deviceID);

    database.DeleteServerGUIDItem(GUID, function(err)
    {
        if (err != null)
        {
            callback(err);
        }
        else
        {
            database.GetServerGUIDListByUserID(userID, function(err, deviceList)
            {
                if (err != null)
                {
                    callback(err);
                }
                else
                {
                    if (deviceList.length == 0)
                    {
                        // delete presence
                        Helper_DeletePresence(userID, function(err)
                        {
                            // send offline status
                            serverUsers.SendStatus(userID, deviceID, "offline", function(err)
                            {
                                callback(err);
                            });
                        });
                    }
                    else
                    {
                        // there are more items in the list: not the last item has been removed
                        callback(err);
                    }
                }
            });
        }
    });
}

// Requests current presence status
GetPresence = function(userID, callback)
{
    // read current user's presence from the dynamoDB
    database.QueryUserInfo(userID, function(err, items)
    {
        if (err != null)
        {
            console.log("[" + userID + "][GetPresence] error = " + err);
            callback(err);
            return;
        }

        // user is online, so set 0
        if (items && items.length > 0)
        {
            var item = items[0];
            if (item.lastSeenOnline)
            {
                var value = "" + item.lastSeenOnline["N"];

                // return the value of lastSeenOnline
                callback(null, value);
                return;
            }
        }

        // if field is not defined or user does not have the userInfo
//		console.log("[" + userID + "][GetPresence] userID does not have corresponding userInfo record!");
        callback(null, "-1");
    });
};

// Helpers

// Routine sets presence of the userID
Helper_SetPresence = function(userID, callback)
{
    Helper_WritePresenceValue(userID, 0, function(err)
    {
        callback(err);
    });
};

// Routine writes current time as a presence value when the user logs out
Helper_DeletePresence = function(userID, callback)
{
    Helper_WritePresenceValue(userID, new Date().valueOf().toString(), function(err)
    {
        callback(err);
    });
};

Helper_WritePresenceValue = function(userID, value, callback)
{
    // read current user's presence from the dynamoDB
    database.QueryUserInfo(userID, function(err, items)
    {
        if (err != null)
        {
            console.log("[" + userID + "][WritePresenceValue] error = " + err);
            callback(err);
            return;
        }

        // update lastSeenOnline to the submitted value
        var item = {};
        if (items && items.length > 0)
        {
            item = items[0];
            item.lastSeenOnline = {"N" : "" + value};
            if (item.displayName == undefined)
            {
                item.displayName = {"S" : "" + userID};
            }
        }
        else
        {
            // userID is also added in amazon_lib !! Fix!!
            item.userID = {"S" : "" + userID};
            item.lastSeenOnline = {"N" : "" + value};
            item.displayName = {"S" : "" + userID};
        }

        // write back
        database.SetUserInfo(userID, item, function(err)
        {
            if (err != null)
            {
                console.log("[" + userID + "][WritePresenceValue] error = " + err);
                callback(null);
            }
            else
            {
//					console.log("[" + userID + "][WritePresenceValue] presence for user written succesfully");
                callback(null);
            }
        });
    });
};


SupportHelper = function(userID,supportUserId,callback)
{
    var conArr=[];
    database.CheckContactUserExists(userID,supportUserId,function(error,data){
        if(error==null)
        {
            console.log("data=",data);
            if (data.Count==0)
            {
                conArr.push(supportUserId);
                contactlist.PutContactsInt(userID,conArr,function(res){
                    console.log("[Support account add result]->",res);                    
                    callback(res);
                });
            }
        }
        callback(error);
    })
}
//SupportADD--END

// export block

exports.InitUsersOnServerStartup = InitUsersOnServerStartup;
exports.SetUserDeviceOnline = SetUserDeviceOnline;
exports.SetUserDeviceOffline = SetUserDeviceOffline;
exports.GetPresence = GetPresence;
