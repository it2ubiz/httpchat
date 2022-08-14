var mongoose = require('mongoose');
var mongoHelper = require("./createMongoDBTablesHelpers.js");
const common = require("./common.js");

try {
    var config = require('./config.js');
} catch (ex) {
    var config = require('./config.dist.js');
}

const _ = require('lodash');

mongoose.connect('mongodb://'+config.MongoDBHost+'/'+config.MongoDBSch);               

var ModelHttp_srv_messages = mongoose.model('Http_srv_messages', mongoHelper.model_Http_srv_messages);
var ModelBackend_users = mongoose.model('Backend_users', mongoHelper.model_Backend_users);
var ModelChatInfo      = mongoose.model('ChatInfos', mongoHelper.model_ChatInfo);
var ModelUserInfo      = mongoose.model('UserInfos', mongoHelper.model_UserInfo);
var ModelContactList   = mongoose.model('ContactLists', mongoHelper.model_ContactList);
var ModelServerGUID    = mongoose.model('ServerGUIDs', mongoHelper.model_ServerGUID);
var ModelServerQueues  = mongoose.model('ServerQueues', mongoHelper.model_ServerQueues);
var ModelChatUsers     = mongoose.model('ChatUsers', mongoHelper.model_ChatUsers);
var ModelUserDevices   = mongoose.model('UserDevices', mongoHelper.model_UserDevices);
var ModelUserKeys      = mongoose.model('UserKeys ', mongoHelper.model_UserKeys);
var ModelAppUpdate     = mongoose.model('AppUpdates', mongoHelper.model_AppUpdate);
var ModelCompanyInfo   = mongoose.model('CompanyInfo', mongoHelper.model_CompanyInfo);
var ModelUserAddField  = mongoose.model('UserAddField',mongoHelper.model_UserAddField);
var ModelMsgLog        = mongoose.model('MessageModels',mongoHelper.model_MessageLog);
var ModelPushLog       = mongoose.model('PushLog',mongoHelper.model_PushLog);
//


exports.ModelHttp_srv_messages  = ModelHttp_srv_messages;
exports.ModelBackend_users      = ModelBackend_users;
exports.ModelChatInfo           = ModelChatInfo;
exports.ModelUserInfo           = ModelUserInfo;
exports.ModelContactList        = ModelContactList;
exports.ModelServerGUID         = ModelServerGUID;
exports.ModelServerQueues       = ModelServerQueues;
exports.ModelChatUsers          = ModelChatUsers;
exports.ModelUserDevices        = ModelUserDevices;
exports.ModelUserKeys           = ModelUserKeys;
exports.ModelAppUpdate          = ModelAppUpdate;
exports.ModelCompanyInfo        = ModelCompanyInfo;
exports.ModelUserAddField       = ModelUserAddField;
exports.ModelMsgLog             = ModelMsgLog;
exports.ModelPushLog            = ModelPushLog;


exports.FindUsersOnline = function (userIDList) {
    return new Promise(function (success, reject) {
        ModelServerGUID.find()
            .where('userID').in(userIDList)
            .exec(function (err, data) {
                if (!err) {
                    let res = _.map(data.Items, (item) => item.attrs);
                    success(res);
                } else {
                    reject(err);
                }
            });
    })
};

exports.PrepareDbForTest = function(){
    //1. Create users in DB - user01,user02 und user03
    var userArr = [];
    var userDvc = [];

    for(i=0;i<10;i++)
    {
        userArr[i]=new  ModelUserInfo();
        userArr[i].userID="user0"+(i+1)+"@safechats.com";
        userArr[i].displayName="User0"+(i+1);
        userArr[i].avatarText=null;
        userArr[i].avatarColor=null;
        userArr[i].avatarLink=null;
        userArr[i].lastSeenOnline=new Date().valueOf().toString();
        userArr[i].save(function(err){
            if (err)
                console.log(err);
        });        
    // User devices
        userDvc[i] = new ModelUserDevices();
        userDvc[i].GUID     = common.CreateGUID("user0"+(i+1)+"@safechats.com", "device_0"+(i+1));
        userDvc[i].userID   = "user0"+(i+1)+"@safechats.com";
        userDvc[i].deviceID = "device_0"+(i+1);
        userDvc[i].save(function(err){
            if (err)
                console.log(err);
        });
    }  
}

exports.ClearDbAfterTest = function(){
    for(i=0;i<10;i++)
    {
        ModelUserInfo.remove({"userID":"user0"+(i+1)+"@safechats.com"},function(err){
            if (err)
                console.log(err);
        });
        ModelUserDevices.remove({"userID":"user0"+(i+1)+"@safechats.com"},function(err){
            if (err)
                console.log(err);
        })        
        ModelChatUsers.remove({"userID":"user0"+(i+1)+"@safechats.com"},function(err){
            if (err)
                console.log(err);
        })
    }

    ModelChatInfo.remove({"ownerID":"126228@safechats.com"},function(err){
        if (err)
            console.log(err);
    })
    ModelChatUsers.remove({"userID":"126228@safechats.com"},function(err){
        if (err)
            console.log(err);
    })
}