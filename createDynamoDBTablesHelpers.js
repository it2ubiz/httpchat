// Exports forceRecreateTable and createTableIfNotExists

try {
    var config = require('./config.js');
} catch (ex) {
    var config = require('./config.dist.js');
}

var AWS = require('aws-sdk');
var async = require('async');
var amazon = require('./amazon.js');

if (config.awsAccessKey && config.awsSecretKey && (config.awsAccessKey != "---EDIT---")
    && (config.awsSecretKey != "---EDIT---")) {
    AWS.config.update({accessKeyId: config.awsAccessKey, secretAccessKey: config.awsSecretKey});
}
AWS.config.update({region: config.awsDynamoDBRegion});
//var db = new AWS.DynamoDB();
let db = amazon.getDatabaseConnection();

deleteTable = function (tableName, callback) {
    var params = {
        TableName: tableName
    };

    console.log("Deleting table \"" + tableName + "\" (if exists)...");

    db.deleteTable(params, function (err, data) {
        if (err) {
            console.log("Table \"" + tableName + "\" cannot be deleted");
            //console.log(err);
            callback(false);
        } else {

            console.log("Waiting for table \"" + tableName + "\" to be deleted...")

            db.waitFor('tableNotExists', params, function (err, data) {
                if (err) {
                    console.log(err);
                    callback(false);
                } else {
                    console.log("Table \"" + tableName + "\" deleted");
                    callback(true);
                }
            });
        }
    });
}

checkIfTableExists = function (tableName, callback) {
    var params = {
        TableName: tableName
    };

    db.describeTable(params, function (err, data) {
        // Do not return an error in any case
        if (err == null) {
            // Table exists
            callback(null, true);
        } else {
            callback(null, false);
        }
    });
}

// createTableIfNotExists
// Returns "true" if successful. "False" if the table cannot be created.

createTableIfNotExists = function (tableName, schema, callback) {
    async.waterfall([
            // Check if the table exists
            function (callback) {
                checkIfTableExists(tableName, callback);
            },

            // Table does not exist - create it
            function (result, callback) {
                if (result == false) {
                    console.log("Table \"" + tableName + "\" does not exist. Creating...");

                    // Create table
                    db.createTable(schema, function (err, data) {
                        if (err) {
                            console.log(err);
                            callback(false);
                        } else {
                            callback(false);
                        }
                    });
                } else {
                    callback(result);
                }
            }
        ],

        function (result) {
            if (result == true) {
                console.log("Table \"" + tableName + "\" already exists");
                callback(false);
            } else {
                var params = {
                    TableName: tableName
                };

                console.log("Waiting for table \"" + tableName + "\"...")

                db.waitFor('tableExists', params, function (err, data) {
                    if (err) {
                        console.log(err);
                        callback(false);
                    } else {
                        console.log("Table \"" + tableName + "\" created")
                        callback(true);
                    }
                });
            }
        }
    );
}

forceRecreateTable = function (tableName, schema, callback) {
    deleteTable(tableName, function () {
        createTableIfNotExists(tableName, schema, function (result) {
                callback(result);
            }
        );
    });
}

exports.forceRecreateTable = forceRecreateTable;
exports.createTableIfNotExists = createTableIfNotExists;

//var params = {
//    TableName: 'table_name',
//    KeySchema: [ // The type of of schema.  Must start with a HASH type, with an optional second RANGE.
//        { // Required HASH type attribute
//            AttributeName: 'hash_key_attribute_name',
//            KeyType: 'HASH',
//        },
//        { // Optional RANGE key type for HASH + RANGE tables
//            AttributeName: 'range_key_attribute_name',
//            KeyType: 'RANGE',
//        }
//    ],
//    AttributeDefinitions: [ // The names and types of all primary and index key attributes only
//        {
//            AttributeName: 'hash_key_attribute_name',
//            AttributeType: 'S', // (S | N | B) for string, number, binary
//        },
//        {
//            AttributeName: 'range_key_attribute_name',
//            AttributeType: 'S', // (S | N | B) for string, number, binary
//        },
//        {
//            AttributeName: 'index_hash_key_attribute_name_1',
//            AttributeType: 'S', // (S | N | B) for string, number, binary
//        },
//        {
//            AttributeName: 'index_range_key_attribute_name_1',
//            AttributeType: 'S', // (S | N | B) for string, number, binary
//        },
//        {
//            AttributeName: 'index_range_key_attribute_name_2',
//            AttributeType: 'S', // (S | N | B) for string, number, binary
//        },
//
//        // ... more attributes ...
//    ],
//    ProvisionedThroughput: { // required provisioned throughput for the table
//        ReadCapacityUnits: 1,
//        WriteCapacityUnits: 1,
//    },
//    GlobalSecondaryIndexes: [ // optional (list of GlobalSecondaryIndex)
//        {
//            IndexName: 'index_name_1',
//            KeySchema: [
//                { // Required HASH type attribute
//                    AttributeName: 'index_hash_key_attribute_name_1',
//                    KeyType: 'HASH',
//                },
//                { // Optional RANGE key type for HASH + RANGE secondary indexes
//                    AttributeName: 'index_range_key_attribute_name_1',
//                    KeyType: 'RANGE',
//                }
//            ],
//            Projection: { // attributes to project into the index
//                ProjectionType: 'INCLUDE', // (ALL | KEYS_ONLY | INCLUDE)
//                NonKeyAttributes: [ // required / allowed only for INCLUDE
//                    'attribute_name_1',
//                    // ... more attribute names ...
//                ],
//            },
//            ProvisionedThroughput: { // throughput to provision to the index
//                ReadCapacityUnits: 1,
//                WriteCapacityUnits: 1,
//            },
//        },
//        // ... more global secondary indexes ...
//    ],
//    LocalSecondaryIndexes: [ // optional (list of LocalSecondaryIndex)
//        {
//            IndexName: 'index_name_2',
//            KeySchema: [
//                { // Required HASH type attribute - must match the table's HASH key attribute name
//                    AttributeName: 'hash_key_attribute_name',
//                    KeyType: 'HASH',
//                },
//                { // alternate RANGE key attribute for the secondary index
//                    AttributeName: 'index_range_key_attribute_name_2',
//                    KeyType: 'RANGE',
//                }
//            ],
//            Projection: { // required
//                ProjectionType: 'INCLUDE', // (ALL | KEYS_ONLY | INCLUDE)
//                NonKeyAttributes: [ // required / allowed only for INCLUDE
//                    'attribute_name_1',
//                    // ... more attribute names ...
//                ],
//            },
//        },
//        // ... more local secondary indexes ...
//    ],
//};
//dynamodb.createTable(params, function(err, data) {
//    if (err) console.log(err); // an error occurred
//    else console.log(data); // successful response
//
//});
