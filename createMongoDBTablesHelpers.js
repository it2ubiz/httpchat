let config = {};
try {
    config = require('./config.js');
} catch (ex) {
    config = require('./config.dist.js');
}

var mongoose    = require('mongoose');
var async = require('async');


getList = function (hdb,collection)
{
    var procedure = hdb.collection(collection);
    console.log(procedure);
}


//Table is Collection in terms of MongoDB
deleteTable = function (hdb,tableName,callback)
{    
    console.log("Deleting table \"" + tableName + "\" (if exists)...");
    hdb.connection.db.dropCollection(tableName, function(err, result) {
        if (err) {
            console.log("Table \"" + tableName + "\" cannot be deleted");
            callback(false);
        } else {
            console.log("Table \"" + tableName + "\" is deleted");
            callback(true);
        }
    })
}

checkIfTableExists  = function(hdb,tableName,callback){
    hdb.connection.db.listCollections().toArray(function(err, names) {
        if (err) {
            callback(err);
        }
        else {
            var find=false
            names.forEach(function(doc) {
                if (doc.name==tableName.toLowerCase()){
                    find=true;  
                    return;
                }
            });
            if (find==true)
                callback(true);
            else
                callback(false);
        }
    })    
}

createTableIfNotExists = function(hdb,tableName,shem,callback){
    checkIfTableExists(hdb,tableName,function(rst){
        if (rst==false)
        {
            console.log('Creating table:'+tableName)
            //var schema = new hdb.Schema(shem);            
            var tModel = hdb.model(tableName, shem);
            var tObject = new tModel();
            tObject.save(function (err) {
              if (err){
                console.log("Error occurred during creation table: ["+tableName+"]");                
                callback(false);
              }
              else{
                console.log("Table: ["+tableName+"] was created")
                callback(true);
              }               
            })           
        }
        else
        {
            console.log("Table: ["+tableName+"] has already created");
            callback(false);
        }
    })
}

forceRecreateTable = function(hdb,tableName,shem,callback){
    mongoHelper.deleteTable(hdb,tableName,function(del_res){
        if(del_res==true)
        {
            mongoHelper.createTableIfNotExists(dte,tableName,shem,function(a){               
                callback(true);
            })
        }        
    });
}


//MODELS for Mongoosse
var model_Http_srv_messages={
    messageID: {
        type:'string',
        index:  true
    },
    hashMessage: {
        type:'string'
    },
    serverTime:{ 
        type:   'string',
        index:  true,
    },
    messageText:
        {type:'string'},
    clientHash:
        {type:'string'},
    sender:
        {type:'string'},
    recepient:
        {type:'string'},
    chatID:
        {type:'string'},
    messageBlock:
        {type:'string'},
    recipientList:
        {type:'string'},
    deliverList:[{type:String}]

}

//model_Http_srv_messages.index({hashMessage:'hashed'});

var model_Backend_users={
    userID: {
        type:   'string',
        index:  true,
        unique: true
    }
}

var model_ChatInfo={
    chatID:{
        type:   'string',
        index:  true,
        unique: true
    },
    chatName:       {type:'string'},
    chatOwner:      {type:'string'},
    domainName:     {type:'string'},
    lastUpdateTime: {type:'number'},
    creationTime:   {type:'number'},
    userLimit:      {type:'number'},
    ownerID:        {type:'string'}
}

var model_UserInfo={
    userID:{
        type:   'string',
        index:  true,
        unique: true
    },
    avatarText:{type:"string"},
    avatarColor:{type:"string"},
    avatarLink:{type:"string"},
    displayName:{type:"string"},
    lastSeenOnline:{type:"string"},
    userDescr:{type:"string"}
}

var model_UserAddField={
    userID:{
        type:   'string',
        index:  true,
        unique: true
    },
    finBlob:{type:"string"}    
}

var model_ContactList={
    userID: {
        type: 'string',
        index: true
    },   
    contactID: {type:'string', index:true},
    contactIDInd:{type:'string'},
    displayName:{type:'string'},
    lastSeenOnline:{type:'string'},
    avatarColor: {type:'string'},
    avatarText: {type:'string'},
    avatarLink: {type:'string'}
}

var model_ServerGUID={
    GUID:       {type:'string', unique:true},
    userID:     {type:'string', index:true},
    serverID:   {type:'string', index:true}
}

var model_ServerQueues={
    serverID: {
        type:   'string',
        index:  true,
        unique: true
    }
}

var model_ChatUsers={
    chatID: {type:'string', index:true},
    userID: {type:'string', index:true},
    chatUserID: {type:'string', index:true}
}

var model_UserDevices={
    GUID:   {type:'string'},
    deviceID:{type:'string', index:true},
    userID: {type:'string',  index:true},
    platform:{type:'string'},
    noPush:{type:'boolean'},
    locked:{type:"boolean"},
    token:{type:"string"},
    versionClient:{type:"string"},
    versionProto:{type:"string"},
    pendingEraseMessage:{type:"string"}
}

var model_UserKeys={
    GUID:   {type:'string'},
    key:    'string',
    sign:   'string'
}

var model_AppUpdate={
    branch: {type:'string',unique:true, index:true},
    versionCode: 'number'
}


var model_CompanyInfo={
    cmpDomain:{type:'string', unique:true, index:true},
    cmpName:{type:'string'},
    logo_250:{type:'string'},
    primaryColor:{type:'string'},
    secondaryColor:{type:'string'},
    logo_250x2:{type:'string'},
    logo_250x3:{type:'string'}
}


var model_MessageLog={
    msgRcp:{type:'string'},
    msgType:{type:'string'},
    msgBody:{type:Object},
    msgID:{type:'string'}
}

var model_PushLog={
    token:{type:'string'},
    message:{type:Object},
    response:{type:Object},
    error:{type:Object},
    platform:{type:"string"}
}


//Export Mongoosse Models
exports.model_Http_srv_messages = new mongoose.Schema(model_Http_srv_messages);
exports.model_AppUpdate         = new mongoose.Schema(model_AppUpdate);
exports.model_Backend_users     = new mongoose.Schema(model_Backend_users);
exports.model_ChatInfo          = new mongoose.Schema(model_ChatInfo);
exports.model_ChatUsers         = new mongoose.Schema(model_ChatUsers);
exports.model_ContactList       = new mongoose.Schema(model_ContactList);
exports.model_ServerGUID        = new mongoose.Schema(model_ServerGUID);
exports.model_ServerQueues      = new mongoose.Schema(model_ServerQueues);
exports.model_UserDevices       = new mongoose.Schema(model_UserDevices);
exports.model_UserInfo          = new mongoose.Schema(model_UserInfo);
exports.model_UserKeys          = new mongoose.Schema(model_UserKeys);
exports.model_CompanyInfo       = new mongoose.Schema(model_CompanyInfo);
exports.model_UserAddField      = new mongoose.Schema(model_UserAddField);
exports.model_MessageLog        = new mongoose.Schema(model_MessageLog);
exports.model_PushLog           = new mongoose.Schema(model_PushLog);

//Export Helper Functions
exports.deleteTable = deleteTable;
exports.checkIfTableExists = checkIfTableExists;
exports.createTableIfNotExists = createTableIfNotExists;
exports.forceRecreateTable= forceRecreateTable;
