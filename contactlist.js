const uuid = require('node-uuid');
const crypto = require('crypto');
const async = require("async");

const database = require('./src/db');
const user = require("./user.js");
const common = require("./common.js");
const userinfo = require("./userinfo.js");
const formatOutput = require('./format-output');
const mysql = require('./mysql-backend');

// Routine returns contact list from database
exports.GetContactList = function (userID, req, callback) {
    exports.GetContactListInt(userID, function (err, contactListArray) {
        if (err !== null) {
            callback(common.FormatErrorResponse(500));
        }
        else {
            callback(formatOutput.ContactList(contactListArray));
        }
    });
};

exports.GetContactListInt = function (userID, callback) {
    // 1. Request a contact list from database
    database.GetContactListForUser(userID, function (err, contactListItems) {
        var contactListArray = [];
        var fun_arr = [];

        for (var contactID in contactListItems) {
            // 2. Form an output structure
            var contact = contactListItems[contactID];

            FillContactFields(contact, function (contactItem) {
                // add item to the output array
                var contactIndex = contactListArray.push(contactItem) - 1;

                fun_arr.push(function (contactIndex, callback) {
                    //	console.log("GET PRESENCE : " + contactListArray[contactIndex].contactID);
                    user.GetPresence(contactListArray[contactIndex].contactID, function (err, userPresence) {
                        //	console.log("PRESENCE : " + userPresence);
                        if (err == null) {
                            contactListArray[contactIndex].presence = userPresence;
                        }
                        callback(err);
                    });
                }.bind(null, contactIndex));
            });
        }

        // 4. Run status query
        async.parallel(fun_arr, function (err) {
            callback(err, contactListArray);
        });
    });
};

exports.GetContactIds = function (userID, req, callback) {
    database.GetContactListForUser(userID, function (err, contactListItems) {
        if (err !== null) {
            callback(common.FormatErrorResponse(500));
        }
        else {
            let contacts = contactListItems.map(contact => contact.contactID);
            callback(formatOutput.ContactIdList(contacts));
        }
    });
};


exports.SyncContacts = function (userID, req, callback) {
    var contacts = req.body.contacts;
    var result = {};
    result.reply = {};

    if (contacts === undefined) {
        callback(common.FormatErrorResponse(400));
        return;
    }

    // add contacts
    exports.SyncContactsInt(userID, contacts, function (result) {
        callback(result);
    });
};

exports.SyncContactsInt = function (userID, contacts, callback) {
    var result = {};
    result.reply = {};
    database.GetContactListForUser(userID, function (err, contactListItems) {
        if (err !== null) {
            callback(common.FormatErrorResponse(500));
            return;
        } else {
            var userToDelete = [];
            for (var index in contactListItems) {
                var contactID = contactListItems[index].contactID;
                var exists_pos = contacts.indexOf(contactID);
                if (exists_pos === -1) {
                    userToDelete.push(contactID);
                } else {
                    delete(contacts[exists_pos])
                }
            }
            exports.DeleteContactsInt(userID, userToDelete, function (result) {
                if (result) {
                    exports.PutContactsInt(userID, contacts, function (result) {
                        callback(result);
                    })
                }
            });
        }
    });
};

exports.PutContacts = function (userID, req, callback) {
    var usersToAdd = req.body.contactsToAdd;
    var result = {};
    result.reply = {};

    if (usersToAdd == undefined | usersToAdd == []) {
        callback(common.FormatErrorResponse(400));
        return;
    }

    // add contacts
    exports.PutContactsInt(userID, usersToAdd, function (result) {
        callback(result);
    });
};

// This function adds specified users to the contact list
exports.PutContactsInt = function (userID, usersToAdd, callback) {
    var result = {};
    var fun_arr = [];

    result.reply = {};

    var contactsAdded = [];
    var contactsError = [];
    var contactsNotFound = [];

    //	1. Add users one by one, on sync error continue
    for (var userIndex in usersToAdd) {
        var newUserID = "" + usersToAdd[userIndex];

        fun_arr.push(function (newUserID, callback) {
            //1. check if this user is available and request customizations from his info block
            mysql.userExists(newUserID, function (err, isExists) {
                if (err) {
                    contactsError.push(newUserID);
                    callback(err);
                    return;
                }
                if (!isExists){
                    contactsNotFound.push(newUserID);
                    callback(err);
                    return;
                }
                if (isExists) {
                    database.QueryUserInfo(newUserID, function (err, info) {
                        if (err) {
                            contactsError.push(newUserID);
                            callback(err);
                            return;
                        }

                        var userInfo = {};

                        if (info == null || (info && info.length == 0)) {
                            /*
                             contactsNotFound.push(newUserID);
                             callback(err);
                             return;
                             */
                            console.log("[" + userID + "][PutContactsInt] has no userInfo");
                        }
                        else {
                            userInfo = info[0];
                        }


                        // TODO: inform other party?
                        // TODO: make adding through invites?
                        database.AddContactToContactList(userID, newUserID, userInfo, function (err) {
                            if (err == null) {
                                // get presence for user
                                user.GetPresence(newUserID, function (err, userPresence) {
                                    //// !!!!
                                    // TODO: FIX: bad hack: userID->contactID to avoid database key changing
                                    userInfo.contactID = userInfo.userID;
                                    //// !!!!

                                    FillContactFields(userInfo, function (contactItem) {
                                        // replace the contactID
                                        contactItem.contactID = newUserID;

                                        contactItem.presence = userPresence;
                                        contactsAdded.push(contactItem);

                                        callback(null);
                                    });
                                });
                            }
                            else {
                                contactsError.push(newUserID);
                                callback(null);
                            }
                        });
                    });
                }
            });

        }.bind(null, newUserID));
    }

    async.parallel(fun_arr, function (err) {
        result.statusCode = 200;
        if (contactsAdded.length > 0) {
            result.reply.contactsAdded = contactsAdded;
        }
        if (contactsNotFound.length > 0) {
            result.statusCode = 404;
            result.reply.contactsNotFound = contactsNotFound;
        }
        if (contactsError.length > 0) {
            result.reply.contactsError = contactsError;
        }
        callback(result);
    });
};

exports.DeleteContacts = function (userID, req, callback) {
    var usersToDelete = req.body.contactsToDelete;
    var result = {};
    result.reply = {};

    if (usersToDelete == undefined || usersToDelete == []) {
        callback(common.FormatErrorResponse(400));
        return;
    }

    // set chat information
    exports.DeleteContactsInt(userID, usersToDelete, function (result) {
        callback(result);
    });
};

exports.DeleteContactsInt = function (userID, contactsToDelete, callback) {
    var result = {};
    var fun_arr = [];

    var contactsDeleted = [];
    var contactsError = [];

    result.reply = {};

    //	1. Add users one by one, on sync error continue
    for (var contact in contactsToDelete) {
        var contactID = "" + contactsToDelete[contact];

        fun_arr.push(function (contactID, callback) {
            // TODO: inform other party?

            database.DeleteContactFromContactList(userID, contactID, function (err) {
                if (err == null) {
                    contactsDeleted.push(contactID);
                }
                else {
                    contactsError.push(contactID);
                }
                callback(null);
            });
        }.bind(null, contactID));
    }

    async.parallel(fun_arr, function (err) {
        result.statusCode = 200;
        if (contactsDeleted.length > 0) {
            result.reply.contactsDeleted = contactsDeleted;
        }
        if (contactsError.length > 0) {
            result.reply.contactsError = contactsError;
        }

        callback(result);
    });
};

exports.PutCustomizations = function (userID, req, callback) {
    var customizations = req.body.contactListCustomizations;
    var result = {};
    result.reply = {};

    if (customizations == undefined || customizations == []) {
        callback(common.FormatErrorResponse(400));
        return;
    }

    // set chat information
    exports.PutCustomizationsInt(userID, customizations, function (result) {
        callback(result);
    });
};

exports.PutCustomizationsInt = function (userID, customizations, callback) {
    var result = {};
    var fun_arr = [];

    var contactsUpdated = [];
    var contactsNotFound = [];
    var contactsError = [];

    result.reply = {};

    //	Process contacts
    // 1. Get contact list
    database.GetContactListForUser(userID, function (err, contactListItems) {
        for (var contactCustom in customizations) {
            var contact = "" + customizations[contactCustom].contactID;
            var found = 0;
            for (var item in contactListItems) {
                if (contact == contactListItems[item].contactID["S"]) {
                    // item found
                    var param =
                        {
                            "contactCustom": contactCustom,
                            "item": item
                        };

                    fun_arr.push(function (param, callback) {
                        // update the information

                        var contactFromList = contactListItems[param.item];
                        var contactID = contactFromList.contactID["S"];
                        var userID = contactFromList.userID["S"];

                        // set original fields
                        // unpack user info
                        unpackedInfo = userinfo.UnpackUserInfo(contactFromList);
                        var contact = customizations[param.contactCustom];

                        // change format
                        var contactNewInf =
                            {
                                "displayName": contact.displayName
                            };

                        if (contact.avatar) {
                            contactNewInf.avatarText = contact.avatar.text;
                            contactNewInf.avatarColor = contact.avatar.color;
                            contactNewInf.avatarLink = contact.avatar.link;
                        }
                        // update the information
                        updatedInf = userinfo.ChangeUserInfo(contactNewInf, unpackedInfo);

                        // pack information to store it in DB
                        infoStruct = userinfo.PackUserInfo(updatedInf);
                        // update information in database
                        database.AddContactToContactList(userID, contactID, infoStruct, function (err) {
                            if (err == null) {
                                contactsUpdated.push(contactID);
                            }
                            else {
                                contactsError.push(contactID);
                            }
                            callback(null);
                        });
                    }.bind(null, param));

                    found = 1;
                    break;
                }
            }

            if (found == 0) {
                // item not found
                contactsNotFound.push(contact);
            }
        }

        async.parallel(fun_arr, function (err) {
            result.statusCode = 200;
            if (contactsUpdated.length > 0) {
                result.reply.contactsUpdated = contactsUpdated;
            }
            if (contactsNotFound.length > 0) {
                result.reply.contactsNotFound = contactsNotFound;
            }
            if (contactsError.length > 0) {
                result.reply.contactsError = contactsError;
            }

            callback(result);
        });
    });
};

/////////////////
// Helpers

// Routine prepares contact info for user
FillContactFields = function (contact, callback) {
    var contactItem = {};

    contactItem.contactID = contact.contactID["S"];

    unpackedInfo = userinfo.UnpackUserInfo(contact);
    if (unpackedInfo.displayName) {
        contactItem.displayName = unpackedInfo.displayName;
    }

    if (unpackedInfo.avatarColor || unpackedInfo.avatarText || unpackedInfo.avatarLink) {
        // format output to reach the documentation
        contactItem.avatar = {};
        contactItem.avatar.text = unpackedInfo.avatarText;
        contactItem.avatar.color = unpackedInfo.avatarColor;
        contactItem.avatar.link = unpackedInfo.avatarLink;
    }

    callback(contactItem);
};
