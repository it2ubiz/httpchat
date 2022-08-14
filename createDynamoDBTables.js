var AmazonDynamoDB = require("./createDynamoDBTablesHelpers.js");
var database = require("./src/db");
var async = require('async');
var math = require("math");


// --- EDIT THESE PARAMETERS ---
// Configure base Read and Write Capacity
var baseReadCapacity = 3;
var baseWriteCapacity = 3;
var forceRecreate = false; // True to recreate tables, False - do no delete tables if exist

// /Configure

var createTable = AmazonDynamoDB.createTableIfNotExists;

if (forceRecreate === true) {
    createTable = AmazonDynamoDB.forceRecreateTable;
}

// Create table "Http_srv_messages"
var tableName3 = 'Http_srv_messages';
var schema3 = {
    TableName: tableName3,

    KeySchema: [
        {
            AttributeName: 'messageID',
            KeyType: 'HASH'
        },
        {
            AttributeName: 'serverTime',
            KeyType: "RANGE"
        }
    ],

    AttributeDefinitions: [
        {
            AttributeName: "messageID",
            AttributeType: 'S'
        },

        {
            AttributeName: "hashMessage",
            AttributeType: 'S'
        },

        {
            AttributeName: "serverTime",
            AttributeType: 'S'
        }

    ],

    ProvisionedThroughput: {
        ReadCapacityUnits: math.ceil(baseReadCapacity * 2),
        WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
    },

    GlobalSecondaryIndexes: [
        {
            IndexName: 'hashMessage',
            KeySchema: [
                {
                    AttributeName: "hashMessage",
                    KeyType: 'HASH'
                }
            ],

            Projection: {
                ProjectionType: 'ALL'
            },

            ProvisionedThroughput: {
                ReadCapacityUnits: math.ceil(baseReadCapacity * 2),
                WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
            }
        }
    ]
};

var tableName4 = 'Backend_users';
var schema4 = {
    TableName: tableName4,

    KeySchema: [
        {
            AttributeName: 'userID',
            KeyType: 'HASH'
        }
    ],

    AttributeDefinitions: [
        {
            AttributeName: "userID",
            AttributeType: 'S'
        }
    ],

    ProvisionedThroughput: {
        ReadCapacityUnits: math.ceil(baseReadCapacity * 0.2),
        WriteCapacityUnits: math.ceil(baseWriteCapacity * 0.2)
    }
};

var tableName5 = 'ChatInfo';
var schema5 = {
    TableName: tableName5,

    KeySchema: [
        {
            AttributeName: 'chatID',
            KeyType: 'HASH'
        }
    ],

    AttributeDefinitions: [
        {
            AttributeName: "chatID",
            AttributeType: 'S'
        }
    ],

    ProvisionedThroughput: {
        ReadCapacityUnits: math.ceil(baseReadCapacity * 0.2),
        WriteCapacityUnits: math.ceil(baseWriteCapacity * 0.2)
    }
};

var tableName6 = 'UserInfo';
var schema6 = {
    TableName: tableName6,

    KeySchema: [
        {
            AttributeName: 'userID',
            KeyType: 'HASH'
        }
    ],

    AttributeDefinitions: [
        {
            AttributeName: "userID",
            AttributeType: 'S'
        }
    ],

    ProvisionedThroughput: {
        ReadCapacityUnits: math.ceil(baseReadCapacity),
        WriteCapacityUnits: math.ceil(baseWriteCapacity * 0.1)
    }
};

// Create table "ClientPendingMessages"
var tableName7 = 'ContactList';
var schema7 = {
    TableName: tableName7,

    KeySchema: [
        {
            AttributeName: 'userID',
            KeyType: 'HASH'
        },
        {
            AttributeName: 'contactID',
            KeyType: 'RANGE'
        }
    ],

    AttributeDefinitions: [
        {
            AttributeName: "userID",
            AttributeType: 'S'
        },
        {
            AttributeName: "contactID",
            AttributeType: 'S'
        },
        {
            AttributeName: "contactIDInd",
            AttributeType: 'S'
        },
    ],

    GlobalSecondaryIndexes: [
        {
            IndexName: 'contactID-index',
            KeySchema: [
                {
                    AttributeName: "contactIDInd",
                    KeyType: 'HASH'
                }
            ],

            Projection: {
                ProjectionType: 'ALL'
            },

            ProvisionedThroughput: {
                ReadCapacityUnits: math.ceil(baseReadCapacity * 2),
                WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
            }
        }
    ],

    ProvisionedThroughput: {
        ReadCapacityUnits: math.ceil(baseReadCapacity * 2),
        WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
    }
};

// Create table "ServerUsers"
var tableName9 = 'ServerGUID';
var schema9 = {
    TableName: tableName9,

    KeySchema: [
        {
            AttributeName: 'GUID',
            KeyType: 'HASH'
        }
    ],

    AttributeDefinitions: [
        {
            AttributeName: "GUID",
            AttributeType: 'S'
        },
        {
            AttributeName: "userID",
            AttributeType: 'S'
        },
        {
            AttributeName: "serverID",
            AttributeType: 'S'
        },
    ],

    GlobalSecondaryIndexes: [
        {
            IndexName: 'userID-index',
            KeySchema: [
                {
                    AttributeName: "userID",
                    KeyType: 'HASH'
                }
            ],

            Projection: {
                ProjectionType: 'ALL'
            },

            ProvisionedThroughput: {
                ReadCapacityUnits: math.ceil(baseReadCapacity * 3),
                WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
            }
        },
        {
            IndexName: 'serverID-index',
            KeySchema: [
                {
                    AttributeName: "serverID",
                    KeyType: 'HASH'
                }
            ],

            Projection: {
                ProjectionType: 'ALL'
            },

            ProvisionedThroughput: {
                ReadCapacityUnits: math.ceil(baseReadCapacity * 3),
                WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
            }
        }

    ],

    ProvisionedThroughput: {
        ReadCapacityUnits: math.ceil(baseReadCapacity * 3),
        WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
    }
};

var tableName10 = 'ServerQueues';
var schema10 = {
    TableName: tableName10,

    KeySchema: [
        {
            AttributeName: 'serverID',
            KeyType: 'HASH'
        }
    ],

    AttributeDefinitions: [
        {
            AttributeName: "serverID",
            AttributeType: 'S'
        }
    ],

    ProvisionedThroughput: {
        ReadCapacityUnits: math.ceil(baseReadCapacity * 3),
        WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
    }
};

var tableName11 = 'ChatUsers';
var schema11 = {
    TableName: tableName11,

    KeySchema: [
        {
            AttributeName: 'chatID',
            KeyType: 'HASH'
        },
        {
            AttributeName: 'userID',
            KeyType: 'RANGE'
        }
    ],

    AttributeDefinitions: [
        {
            AttributeName: 'chatID',
            AttributeType: 'S'
        },
        {
            AttributeName: 'userID',
            AttributeType: 'S'
        },
        {
            AttributeName: "chatUserID",
            AttributeType: 'S'
        }
    ],

    GlobalSecondaryIndexes: [
        {
            IndexName: 'chatUserID-index',
            KeySchema: [
                {
                    AttributeName: "chatUserID",
                    KeyType: 'HASH'
                }
            ],

            Projection: {
                ProjectionType: 'ALL'
            },

            ProvisionedThroughput: {
                ReadCapacityUnits: math.ceil(baseReadCapacity * 3),
                WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
            }
        }
    ],

    ProvisionedThroughput: {
        ReadCapacityUnits: math.ceil(baseReadCapacity * 3),
        WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
    }
};


var tableName12 = 'UserDevices';
var schema12 = {
    TableName: tableName12,

    KeySchema: [
        {
            AttributeName: 'GUID',
            KeyType: 'HASH'
        }
    ],

    AttributeDefinitions: [
        {
            AttributeName: 'GUID',
            AttributeType: 'S'
        },
        {
            AttributeName: 'deviceID',
            AttributeType: 'S'
        },
        {
            AttributeName: 'userID',
            AttributeType: 'S'
        },
        {
            AttributeName: "token",
            AttributeType: 'S'
        },
        {
            AttributeName: "tokenVoip",
            AttributeType: 'S'
        }
    ],

    GlobalSecondaryIndexes: [
        {
            IndexName: 'userID-index',
            KeySchema: [
                {
                    AttributeName: "userID",
                    KeyType: 'HASH'
                }
            ],

            Projection: {
                ProjectionType: 'ALL'
            },

            ProvisionedThroughput: {
                ReadCapacityUnits: math.ceil(baseReadCapacity * 3),
                WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
            }
        },
        {
            IndexName: 'deviceID-index',
            KeySchema: [
                {
                    AttributeName: "deviceID",
                    KeyType: 'HASH'
                }
            ],

            Projection: {
                ProjectionType: 'ALL'
            },

            ProvisionedThroughput: {
                ReadCapacityUnits: math.ceil(baseReadCapacity * 3),
                WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
            }
        },
        {
            IndexName: 'token-index',
            KeySchema: [
                {
                    AttributeName: "token",
                    KeyType: 'HASH'
                }
            ],

            Projection: {
                ProjectionType: 'ALL'
            },

            ProvisionedThroughput: {
                ReadCapacityUnits: math.ceil(baseReadCapacity * 3),
                WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
            }
        }
    ],

    ProvisionedThroughput: {
        ReadCapacityUnits: math.ceil(baseReadCapacity * 3),
        WriteCapacityUnits: math.ceil(baseWriteCapacity * 1)
    }
};

var tableName13 = 'UserKeys';
var schema13 = {
    TableName: tableName13,

    KeySchema: [
        {
            AttributeName: 'GUID',
            KeyType: 'HASH'
        },
        {
            AttributeName: 'key',
            KeyType: 'RANGE'
        }
    ],

    AttributeDefinitions: [
        {
            AttributeName: 'GUID',
            AttributeType: 'S'
        },
        {
            AttributeName: 'key',
            AttributeType: 'S'
        }
    ],

    ProvisionedThroughput: {
        ReadCapacityUnits: math.ceil(baseReadCapacity * 3),
        WriteCapacityUnits: math.ceil(baseWriteCapacity * 2)
    }
};

var tableName15 = 'AppUpdate';
var schema15 = {
    TableName: tableName15,

    KeySchema: [
        {
            AttributeName: 'branch',
            KeyType: 'HASH'
        },
        {
            AttributeName: 'versionCode',
            KeyType: 'RANGE'
        }
    ],

    AttributeDefinitions: [
        {
            AttributeName: "branch",
            AttributeType: 'S'
        },
        {
            AttributeName: "versionCode",
            AttributeType: 'N'
        }
    ],

    ProvisionedThroughput: {
        ReadCapacityUnits: math.ceil(baseReadCapacity * 2),
        WriteCapacityUnits: math.ceil(baseWriteCapacity * 0.2)
    }
};


var tableName16 = 'CompanyInfo';
var schema16 = {
    TableName: tableName16,
    KeySchema: [
        {
            AttributeName: 'cmpDomain',
            KeyType: 'HASH'
        }
    ],

    AttributeDefinitions: [
        {
            AttributeName: "cmpDomain",
            AttributeType: 'S'
        }
    ],

    ProvisionedThroughput: {
        ReadCapacityUnits: math.ceil(baseReadCapacity * 0.2),
        WriteCapacityUnits: math.ceil(baseWriteCapacity * 0.2)
    }
};


async.waterfall([
    function (callback) {
        createTable(tableName3, schema3, function (result) {
                callback(null, result);
            }
        );
    },

    function (result, callback) {
        createTable(tableName4, schema4, function (result) {
                callback(null, result);
            }
        );
    },

    function (result, callback) {
        createTable(tableName5, schema5, function (result) {
                callback(null, result);
            }
        );
    },

    function (result, callback) {
        createTable(tableName6, schema6, function (result) {
                callback(null, result);
            }
        );
    },

    function (result, callback) {
        createTable(tableName7, schema7, function (result) {
                callback(null, result);
            }
        );
    },

    function (result, callback) {
        createTable(tableName9, schema9, function (result) {
                callback(null, result);
            }
        );
    },

    function (result, callback) {
        createTable(tableName10, schema10, function (result) {
            callback(null, result);
        });
    },

    function (result, callback) {
        createTable(tableName11, schema11, function (result) {
            callback(null, result);
        });
    },
    function (result, callback) {
        createTable(tableName12, schema12, function (result) {
            callback(null, result);
        });
    },

    function (result, callback) {
        createTable(tableName13, schema13, function (result) {
            callback(null, result);
        });
    },


    function (result, callback) {
        createTable(tableName15, schema15, function (result) {
            callback(null, result);
        });
    },

    function (result, callback) {
        createTable(tableName16, schema16, function (result) {
            callback(null, result);
        });
    },
    /*
    function (result, callback) {
        console.log("create dynamo(vogels) tables");
        database.createTables().then(function (result) {
            callback(null, result);
        }).catch(function (err) {
            console.error(err);
            callback(err, result);
        });
    }*/
], function (result) {
    console.log("Done");
});
