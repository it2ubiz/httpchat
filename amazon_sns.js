const AWS = require('aws-sdk');
const amazon_sts = require('./amazon_sts.js');

let config = {};
try {
    config = require('./config.js');
} catch (ex) {
    config = require('./config.dist.js');
}

if (config.awsAccessKey && config.awsSecretKey && (config.awsAccessKey != "---EDIT---")
    && (config.awsSecretKey != "---EDIT---")) {
    AWS.config.update({accessKeyId: config.awsAccessKey, secretAccessKey: config.awsSecretKey});
}
AWS.config.update({region: config.awsRegion});


getPaa = function (deviceType) {
    if (config.sns && deviceType in config.sns.platform_application_arn) {
        return config.sns.platform_application_arn[deviceType];
    }
    return false;
};


createArn = function (deviceType, token, userID, callback) {
    //if (deviceType!=='Windows'){
        const paa = getPaa(deviceType);
        if (!paa) {
            let err = `Amazon sns: platform application arn for deviceType: ${deviceType} not defined`;
            callback(err, false);
            return;
        }

        let params = {
            'PlatformApplicationArn': paa,
            'Token': token,
            'CustomUserData': userID,
            'Attributes': []
        };


        Helper_InitSns(function (err, sns) {
            if (err) {
                console.error("[InitSns error]", err);
                callback(err);
            } else {
                sns.createPlatformEndpoint(params, function (err, data) {
                    if (err) {
                        console.error("[SNS: createPlatformEndpoint]", err);
                        callback(err);
                        return;
                    }
                    console.log("NEW ARN generated -> ",data.EndpointArn);
                    const endpointArn = data.EndpointArn;
                    callback(err, endpointArn);
                });
            }
        });
    //}
};

exports.deleteArn = function (arn, callback) {

    let params = {
        EndpointArn: arn
    };

    Helper_InitSns(function (err, sns) {
        if (err) {
            console.error("[InitSns error]", err);
            callback(err);
        } else {
            sns.deleteEndpoint(params, function (err, data) {
                if (err) {
                    console.error("[SNS: deleteEndpoint]", err);
                    callback(err);
                    return;
                }

                callback(err, data);
            });
        }
    });
};

exports.refreshArn = function (deviceType, token, userID, arn, callback) {
    //if (deviceType!=='Windows'){
        Helper_InitSns(function (err, sns) {
            if (err) {
                console.error("[InitSns error]", err);
                callback(err);
            } else {
                console.log("[refreshArn]: ARN -> ",arn," deviceType -> ",token, "userID ->", userID);
                
                sns.getEndpointAttributes({EndpointArn: arn}, function (err, data) {
                    if (err) {
                        console.log("[SNS] refreshArn: try to create new", err);
                        createArn(deviceType, token, userID, callback);
                    }
                    else {                    
                        console.log("NEW arn -> ", arn);
                        sns.setEndpointAttributes({
                            Attributes: {
                                /* required */
                                'Token': token,
                                'CustomUserData': userID,
                                'Enabled': 'true'
                            },
                            EndpointArn: arn,
                        }, function (err, data) {
                            if (err) {
                                console.error(err, err.stack); // an error occurred
                                callback(err);
                            }
                            else {
                                callback(err, arn);
                            }
                        });
                    }
                });
            }
        });
    //}
};

exports.publish = function (arn, preparedMessage, callback) {
    const params =
        {
            Message: preparedMessage,
            MessageStructure: 'json',
            TargetArn: arn
        };

    Helper_InitSns(function (err, sns) {
        if (err) {
            console.error("[InitSns error] %s", err);
            callback(err);
        } else {            
            sns.publish(params, function (err, data) {
                //console.log(data);
                if (err !== null) {
                    console.error("[SNS publish][ARN: " + arn + "] error: " + err); // an error occurred
                }
                callback(err, data);
            });
        }
    });
};

Helper_InitSns = function (callback) {
    amazon_sts.assumeRolePush(function (err, credData) {
        if (err === null) {
            let sns = new AWS.SNS({
                "accessKeyId": credData.Credentials.AccessKeyId,
                "secretAccessKey": credData.Credentials.SecretAccessKey,
                "sessionToken": credData.Credentials.SessionToken,
                "region": "ap-southeast-1"
            });
            callback(err, sns);
        } else {
            console.error("[AssumeRole] error = " + err);
            callback(err);
        }
    });
};


exports.createArn = createArn;
