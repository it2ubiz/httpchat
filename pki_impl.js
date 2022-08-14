
var database = require('./src/db');

var message_lib = require ("./message-fun.js");

var common = require ("./common.js");

try {
    var config = require('./config.js');
} catch (ex) {
    var config = require('./config.dist.js');
}

// Routine creates session between two GUIDs consuming one of randomly chosen keys from each side
CreateSession = function(GUID1, GUID2, callback)
{
    Helper_PickPKIRandomKey(GUID1, function(err, keyRecord1)
    {
        if (err != null)
        {
            callback(err);
            return;
        }

        if (keyRecord1 == null)
        {
            // no key
            console.log("PKI. No key for " + GUID1);
            callback (404);
            return;
        }

        Helper_PickPKIRandomKey(GUID2, function(err, keyRecord2)
        {
            if (err != null)
            {
                callback(err);
                return;
            }

            if (keyRecord2 == null)
            {
                // no key
                console.log("PKI. No key for " + GUID2);
                callback (409);
                return;
            }

            // send info message to both parties
            message_lib.PostInfoMessageSessionCreated(GUID1, keyRecord1, GUID2, keyRecord2, function(err)
            {
                callback(err);
            });
        });
    });
};

// Routine picks one random key from the database
Helper_PickPKIRandomKey = function(GUID, callback)
{
    database.GetGUIDPKIKeys(GUID, function(err, keyRecords)
    {
        if (err != null)
        {
            callback(err);
            return;
        }

        if (keyRecords.length == 0)
        {
            // user should upload keys
            message_lib.PostInfoMessageUploadKeys(GUID, 0, function(err)
            {
                callback(null, null);
            });
        }
        else
        {
            var keyNum = Math.floor(Math.random() * keyRecords.length);

            // delete key
            database.DeleteGUIDPKIKey(GUID, keyRecords[keyNum].key, function(err)
            {
                // if err == "Key not exists" that means our key has been taken and we need to choose other key
                if (err != null)
                {
                    // TODO: check error type
                    Helper_GetPKIRandomKey(GUID, callback);
                    return;
                }

                // if less than N keys left - send info message to user
                if (keyRecords.length <= config.pki.userKeysMinimum)
                {
                    message_lib.PostInfoMessageUploadKeys(GUID, keyRecords.length - 1, function(err) {});
                }
                callback(null, keyRecords[keyNum]);
            });
        }
    });
};

// export block

exports.CreateSession = CreateSession;
