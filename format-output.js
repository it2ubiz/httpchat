// Routine formats output of the ChatCreated
ChatCreated = function (chatID, creationTime, addedUsers) {

    var result = {};
    result.reply = {};

    result.statusCode = 201;
    result.reply.chatID = chatID;
    result.reply.creationTime = creationTime;
    result.reply.addedUsers = addedUsers;

    return (result);
};

ChatDeleted = function () {
    var result = {};
    //result.reply = {};

    result.statusCode = 200;

    return (result);
};

DeviceCreated = function () {

    let result = {};
    result.reply = {};

    result.statusCode = 201;
    return (result);
};

DeviceDeleted = function () {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    return (result);
};

DeviceList = function (devices) {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    result.reply.devices = devices;

    return (result);
};

DeviceGet = function (device) {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    result.reply = device;

    return (result);
};


// userList item as a part of list user chats
UserListChatList = function (userID, GUIDList, displayName) {
    var userList = [];

    if (GUIDList.length == 0) {
        var userListItem = {};
        userListItem.userID = userID;
        userListItem.displayName = displayName;

        userList = [userListItem];
    }
    else {
        for (var GUID in GUIDList) {
            var userListItem = {};
            userListItem.userID = userID;
            userListItem.GUID = GUIDList[GUID];
            userListItem.displayName = displayName;

            userList.push(userListItem);
        }
    }

    return (userList);
};

ChatItemChatList = function (chatID, chatInfo, userList) {
    var result = {};

    result.chatID = chatID;
    result.chatName = chatInfo.chatName;
    result.ownerID = chatInfo.ownerID;
    result.creationTime = chatInfo.creationTime;
    result.updateTime = chatInfo.lastUpdateTime;
    result.domainName = chatInfo.domainName;
    result.userLimit = chatInfo.userLimit;

    result.userList = userList;

    return (result);
};

ChatList = function (chatList) {
    var result = {};
    result.reply = {};

    result.reply.chats = chatList;
    result.statusCode = 200;

    return (result);
};

AddChatUsers = function (userList) {
    var result = {};
    result.reply = {};

    result.statusCode = 200;
    result.reply.addedUsers = userList;

    return (result);
};

DeleteChatUsers = function (userList) {
    var result = {};
    result.reply = {};

    result.statusCode = 200;
    result.reply.deletedUsers = userList;

    return (result);
};

ListChatUsers = function (userList) {
    var result = {};
    result.reply = {};

    result.statusCode = 200;
    result.reply.chatBuddies = userList;

    return (result);
};

ContactList = function (contactList) {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    result.reply.contactList = contactList;
    return (result);
};

ContactIdList = function (contacts) {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    result.reply.data = contacts;
    return (result);
};

GetChatInfo = function (info) {
    var result = {};
    result.reply = {};

    result.statusCode = 200;
    result.reply.chatInfo = info;

    return (result);
};

SetChatInfo = function () {
    var result = {};
    result.reply = {};

    result.statusCode = 200;

    return (result);
};

RequestClientCredentials = function (credentials) {
    var result = {};
    result.reply = {};

    result.reply.credentials = credentials;
    result.statusCode = 200;

    return (result);
};

Helper_InfoMessageChatEnterItem = function (GUID, userID, description) {
    var result = {};

    result.GUID = GUID;
    result.userID = userID;
    if (description) {
        result.displayName = description;
    }

    return (result);
};

Helper_InfoMessageChatLeaveItem = function (userID) {
    var result = {};

    result.userID = userID;

    return (result);
};

// info message for chat_enter/chat_leave
InfoMessageChatEvent = function (messageID, messageType, chatID, eventArray) {
    var result = {};

    result.messageID = messageID;
    result.subType = messageType;
    result.chatID = chatID;
    result.messageGUIDList = eventArray;

    return (result);
};

InfoMessageUploadKeys = function (messageID, keysLeft) {
    var result = {};

    result.messageID = messageID;
    result.subType = "upload_keys";
    result.numberKeysLeft = keysLeft;

    return (result);
};

InfoMessageSessionCreated = function (messageID, myKeyUsed, theirKeyUsed, theirGUID) {
    var result = {};

    result.messageID = messageID;
    result.subType = "session_created";
    result.sessionInfo = {};

    result.sessionInfo.my = {};
    result.sessionInfo.my.key = myKeyUsed.key;
    result.sessionInfo.my.sign = myKeyUsed.sign;

    result.sessionInfo.their = {};
    result.sessionInfo.their.key = theirKeyUsed.key;
    result.sessionInfo.their.sign = theirKeyUsed.sign;
    result.sessionInfo.their.GUID = theirGUID;

    return (result);
};

InfoMessageStatusChanged = function (messageID, userID, status) {
    var result = {};

    result.messageID = messageID;
    result.subType = "status_set";
    result.status = status;
    result.userID = userID;

    return (result);
};

InfoMessageLocked = function (messageID, lockID) {
    var result = {};

    result.messageID = messageID;
    result.subType = "lock_device";
    result.status = lockID;

    return (result);
};

InfoMessageErased = function (messageID) {
    var result = {};

    result.messageID = messageID;
    result.subType = "erase_device";

    return (result);
};


OnlineMessageTyping = function () {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    return (result);
};

InfoMessageStatusTyping = function (messageID, GUID, chatID) {
    let result = {};

    result.messageID = messageID;
    result.subType = "typing";
    result.GUID = GUID;
    result.chatID = chatID;
    return (result);
};


TextMessage = function (messageID, senderGUID, messageText, serverTime, chatID) {
    var result = {};

    result.messageID = messageID;
    result.sender = senderGUID;
    result.messageText = messageText;
    result.serverTime = serverTime;
    result.chatID = chatID;

    return (result);
};

StatusMessage = function (messageID, type, messageIDStatus, recipient) {
    var result = {};

    result.messageID = messageID;
    result.type = type;
    result.messageIDStatus = messageIDStatus;
    result.recipient = recipient;

    return (result);
};

Message = function (timestamp, textMessageArray, statusArray, infoMessageArray) {
    var result = {};

    result.incomingEvents = {};
    result.incomingEvents.timestamp = timestamp;

    if (textMessageArray != null && textMessageArray.length > 0) {
        result.incomingEvents.messages = [];

        for (var i in textMessageArray) {
            result.incomingEvents.messages.push(textMessageArray[i]);
        }
    }
    if (statusArray != null && statusArray.length > 0) {
        result.incomingEvents.statuses = [];

        for (var i in statusArray) {
            result.incomingEvents.statuses.push(statusArray[i]);
        }
    }
    if (infoMessageArray != null && infoMessageArray.length > 0) {
        result.incomingEvents.info = [];

        for (var i in infoMessageArray) {
            result.incomingEvents.info.push(infoMessageArray[i]);
        }
    }

    return (result);
};

UploadKeys = function () {
    var result = {};
    result.reply = {};

    result.statusCode = 200;

    return (result);
};

CreateSession = function () {
    var result = {};
    result.reply = {};

    result.statusCode = 201;

    return (result);
};

IncomingMessages = function (outgoingMessages, sign) {
    var result = {};
    result.reply = {};

    result.reply.outgoingEventsResult = outgoingMessages;
    result.reply.sign = sign;
    result.statusCode = 200;

    return (result);
};

SingleMessageSent = function (serverTime, messageID) {
    var result = {};
    result = {};

    result.serverTime = serverTime;
    result.messageID = messageID;

    return (result);
};

PushMessage = function (messageID, senderGUID, chatID, serverTime, messageType, messageBody/*, messageText*/) {
    var result =
        {
            "messageID": messageID,
            "senderGUID": senderGUID,
            "chatID": chatID,
            "serverTime": serverTime,
            "messageType": messageType,
            "messageBody": messageBody
        };

    /*    var basedMsg = new Buffer(messageText).toString('base64');

        if (basedMsg.length <= config.maxMessageLengthToIncapsulate)
        {
            // send message text
            result.message = basedMsg;
        }
    */
    result = JSON.stringify(result);

    return (result);
};

OutgoingMessage = function (timestamp, messages, statuses, infos) {
    var result =
        {
            "method": "GET",
            "uri": "/messages"
        };

    result.body = Message(timestamp, messages, statuses, infos);

    return (result);
};


GetUpdateInfo = function (info) {
    var result = {};
    result.reply = {};

    result.statusCode = 200;

    console.log(JSON.stringify(info));

    var structure =
        {
            versionName: info.versionName["S"],
            versionCode: info.versionCode["N"],
            description: info.description["S"],
            downloadUrl: info.downloadUrl["S"],
        };
    result.reply = structure;

    console.log(JSON.stringify(result.reply));

    return (result);
};

SetUpdateInfo = function () {
    var result = {};
    result.reply = {};

    result.statusCode = 200;

    return (result);
};


PutOnline = function () {
    var result = {};
    result.reply = {};

    result.statusCode = 200;

    return (result);
};

DeviceLocked = function () {
    let result = {};
    result.reply = {};
    result.statusCode = 401;
    result.reply.error = "Device locked";
    return (result);
};


PutDeviceLock = function () {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    return (result);

};

PutDeviceErase = function () {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    return (result);
};

DeleteDeviceLock = function () {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    return (result);
};

PutDeviceNew = function () {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    return (result);
};
DeleteDeviceNew = function () {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    return (result);
};
DeviceStateResponse = function (state) {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    result.reply.blockNewDevices = state;
    return (result);
};


DeviceNotAllowed = function () {
    let result = {};
    result.reply = {};
    result.statusCode = 401;
    result.reply.error = "Device not allowed";
    return (result);
};

SetCmpInfo = function (state) {
    let result = {};
    result.reply = {};
    result.statusCode = 200;
    return (result);
};

GetCmpInfo = function(info){
    var result = {};
    result.reply = {};
    result.statusCode = 200;
    var inf=JSON.parse(JSON.stringify(info));
    var structure={};
    for (var item in info) {
        structure[item]=info[item]["S"];
    }
    result.reply = structure;
    return (result);
}

EmptyCmpInfo = function(){
    let result = {};
    result.reply = {};
    result.statusCode = 404;
    return (result);
}

/// export block

exports.ChatCreated = ChatCreated;
exports.ChatDeleted = ChatDeleted;

exports.DeviceCreated = DeviceCreated;
exports.DeviceDeleted = DeviceDeleted;
exports.DeviceList = DeviceList;
exports.DeviceGet = DeviceGet;

exports.UserListChatList = UserListChatList;
exports.ChatItemChatList = ChatItemChatList;
exports.ChatList = ChatList;
exports.AddChatUsers = AddChatUsers;
exports.DeleteChatUsers = DeleteChatUsers;
exports.ListChatUsers = ListChatUsers;

exports.Helper_InfoMessageChatEnterItem = Helper_InfoMessageChatEnterItem;
exports.Helper_InfoMessageChatLeaveItem = Helper_InfoMessageChatLeaveItem;
exports.InfoMessageUploadKeys = InfoMessageUploadKeys;
exports.InfoMessageSessionCreated = InfoMessageSessionCreated;
exports.InfoMessageChatEvent = InfoMessageChatEvent;
exports.InfoMessageStatusChanged = InfoMessageStatusChanged;
exports.InfoMessageStatusTyping = InfoMessageStatusTyping;
exports.TextMessage = TextMessage;
exports.StatusMessage = StatusMessage;
exports.Message = Message;

exports.GetChatInfo = GetChatInfo;
exports.SetChatInfo = SetChatInfo;

exports.UploadKeys = UploadKeys;
exports.CreateSession = CreateSession;

exports.IncomingMessages = IncomingMessages;
exports.SingleMessageSent = SingleMessageSent;
exports.OutgoingMessage = OutgoingMessage;
exports.OnlineMessageTyping = OnlineMessageTyping;

exports.PushMessage = PushMessage;

exports.SetUpdateInfo = SetUpdateInfo;
exports.GetUpdateInfo = GetUpdateInfo;

exports.PutOnline = PutOnline;

exports.InfoMessageLocked = InfoMessageLocked;
exports.InfoMessageErased = InfoMessageErased;

exports.DeviceLocked = DeviceLocked;

exports.ContactList = ContactList;
exports.ContactIdList = ContactIdList;

exports.PutDeviceLock = PutDeviceLock;
exports.DeleteDeviceLock = DeleteDeviceLock;
exports.PutDeviceErase = PutDeviceErase;

exports.DeleteDeviceNew = DeleteDeviceNew;
exports.PutDeviceNew = PutDeviceNew;

exports.DeviceNotAllowed = DeviceNotAllowed;
exports.DeviceStateResponse = DeviceStateResponse;

exports.SetCmpInfo   =  SetCmpInfo;
exports.GetCmpInfo   =  GetCmpInfo;