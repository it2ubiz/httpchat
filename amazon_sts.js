const AWS = require('aws-sdk');

try {
    var config = require('./config.js');
} catch (ex) {
    var config = require('./config.dist.js');
}

if (config.awsAccessKey && config.awsSecretKey && (config.awsAccessKey != "---EDIT---")
    && (config.awsSecretKey != "---EDIT---")) {
    AWS.config.update({accessKeyId: config.awsAccessKey, secretAccessKey: config.awsSecretKey});
}
AWS.config.update({region: config.awsRegion});

const sts = new AWS.STS();

// STS
exports.getClientCredentials = function (chatID, callback) {
    // Check chatID
    if ((chatID == undefined) || (chatID == "")) {
        callback(true); // Error
        return;
    }

    let policy_to_grant = {
        'Statement': [{
            'Action': ['s3:PutObject', 's3:GetObject'],
            'Effect': 'Allow',
            'Resource': ['arn:aws:s3:::' + config.awsS3Bucket + '/files/' + chatID + '/*']
        }
        ]
    };

    // Generate a random session name "<chatID>-<timestamp>-<randomNum>"
    let randomNum = Math.floor(Math.random() * 10000);
    let sessionName = chatID + "-" + (new Date).getTime() + "-" + randomNum;

    let params = {
        RoleArn: config.roleARN,
        RoleSessionName: sessionName,
        ExternalId: chatID,
        DurationSeconds: 3600,
        Policy: JSON.stringify(policy_to_grant)
    };

    sts.assumeRole(params, function (err, data) {
        if (err) {
            console.log("Cannot call assumeRole to get a set of temporary credentials");
            console.log(err);
            callback(err);
        } else {
            // Successful response
            let credentials = {
                accessID: data.Credentials.AccessKeyId,
                secretID: data.Credentials.SecretAccessKey,
                sessionToken: data.Credentials.SessionToken
            };

            callback(err, credentials);
        }
    });
};

exports.assumeRolePush = function (callback) {
    // Generate a random session name "1-<timestamp>-<randomNum>"
    const randomNum = Math.floor(Math.random() * 10000);
    const sessionName = "1" + "-" + (new Date).getTime() + "-" + randomNum;

    const params = {
        RoleArn: "arn:aws:iam::106193757646:role/allowPublishSNS",
        RoleSessionName: sessionName,
        DurationSeconds: 3600,
    };

    sts.assumeRole(params, function (err, data) {
        if (err != null) {
            console.log("[AssumeRole] error: cannot get temporary credentials: " + err);
            callback(err);
        }
        else {
            callback(err, data);
        }
    });
};