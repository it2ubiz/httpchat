
try {
    var config = require('./config.js');
} catch (ex) {
    var config = require('./config.dist.js');
}
var AWS = require('aws-sdk');

if (config.awsAccessKey && config.awsSecretKey && (config.awsAccessKey != "---EDIT---")
    && (config.awsSecretKey != "---EDIT---")) {
    AWS.config.update({accessKeyId: config.awsAccessKey, secretAccessKey: config.awsSecretKey});
}
AWS.config.update({region: config.awsRegion});

var db = new AWS.DynamoDB({ region: config.awsDynamoDBRegion });

exports.getDatabaseConnection = function () {
    return db;
};
