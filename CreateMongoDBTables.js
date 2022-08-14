var mongoHelper = require("./createMongoDBTablesHelpers.js");
var MongoDB = require("./mongo.js");
var async = require('async');

/*
MongoDB.getConnect.then(function(dat){
    mongoHelper.createTableIfNotExists(dat,"user2",function(trs){
        console.log(trs);
    })
},
//Если ошибка
function(er){
    console.log(er);
});
*/

MongoDB.mongooseConnect.then(function(dte){
    async.waterfall([
        function (callback) {
            mongoHelper.createTableIfNotExists(dte,'Http_srv_messages', mongoHelper.model_Http_srv_messages, 
            function (result) {
                callback(null, result);
            });
        },
        function (result,callback) {
            mongoHelper.createTableIfNotExists(dte,'Backend_users',mongoHelper.model_Backend_users,
            function(result){
                callback(null, result);
            })
        },
        function (result,callback) {
            mongoHelper.createTableIfNotExists(dte,'ChatInfos',mongoHelper.model_ChatInfo,
            function(result){
                callback(null, result);
            })
        },
        function (result,callback) {
            mongoHelper.createTableIfNotExists(dte,'ChatUsers',mongoHelper.model_ChatUsers,
            function(result){
                callback(null, result);
            })
        },
        function (result,callback) {
            mongoHelper.createTableIfNotExists(dte,'ContactLists',mongoHelper.model_ContactList,
            function(result){
                callback(null, result);
            })
        },
        /*---*/
        function (result,callback) {
            mongoHelper.createTableIfNotExists(dte,'AppUpdates',mongoHelper.model_AppUpdate,
            function(result){
                callback(null, result);
            })
        },
        function (result,callback) {
            mongoHelper.createTableIfNotExists(dte,'ServerGUIDs',mongoHelper.model_ServerGUID,
            function(result){
                callback(null, result);
            })
        },
        function (result,callback) {
            mongoHelper.createTableIfNotExists(dte,'ServerQueues',mongoHelper.model_ServerQueues,
            function(result){
                callback(null, result);
            })
        },
        function (result,callback) {
            mongoHelper.createTableIfNotExists(dte,'UserDevices',mongoHelper.model_UserDevices,
            function(result){
                callback(null, result);
            })
        },
        function (result,callback) {
            mongoHelper.createTableIfNotExists(dte,'UserInfos',mongoHelper.model_UserInfo,
            function(result){
                callback(null, result);
            })
        },        
        function (result,callback) {
            mongoHelper.createTableIfNotExists(dte,'UserKeys',mongoHelper.model_UserKeys,
            function(result){
                callback(null,result);
            })
        },
        function (result,callback) {
            mongoHelper.createTableIfNotExists(dte,'CompanyInfo',mongoHelper.model_CompanyInfo,
            function(result){
                callback(null,result);
            })
        },
        function (result,callback) {
            mongoHelper.createTableIfNotExists(dte,'UserAddField',mongoHelper.model_UserAddField,
            function(result){
                callback(null,result);
            })
        },
        function (result,callback) {
            var tModelUserInfo = dte.model("UserInfo", mongoHelper.model_UserInfo);
            var tObjectUserInfo = new tModelUserInfo();
            tObjectUserInfo.userID="service_support@safechats.com";
            tObjectUserInfo.displayName="SafeChats Support";
            tObjectUserInfo.lastSeenOnline=0;
            tObjectUserInfo.avatarLink="";
            tObjectUserInfo.save(function(err){
                console.log("Service Support account has been created");
                callback(err,result);
            })
        }
        ],
        function(er,result){
            console.log("Done");
            //process.abort();
        }
    )
},
function(err){
    console.log('Eror:');
})