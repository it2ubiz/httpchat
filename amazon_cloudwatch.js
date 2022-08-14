const AWS = require('aws-sdk');

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
const cloudwatch = new AWS.CloudWatch();


// Publish metrics to CloudWatch
exports.publishLoadTestSettingsMetrics = function (concurrency, msgsInChat, maxConsecutiveMsgs, sendMsgRate, callback) {
    let timestamp = new Date;

    let params = {
        MetricData: [
            {
                MetricName: 'concurrency',
                Timestamp: timestamp,
                Unit: 'Count',
                Value: concurrency
            },

            {
                MetricName: 'msgsInChat',
                Timestamp: timestamp,
                Unit: 'Count',
                Value: msgsInChat
            },

            {
                MetricName: 'maxConsecutiveMsgs',
                Timestamp: timestamp,
                Unit: 'Count',
                Value: maxConsecutiveMsgs
            },

            {
                MetricName: 'sendMsgRate',
                Timestamp: timestamp,
                Unit: 'Count',
                Value: sendMsgRate
            }
        ],
        Namespace: 'SFPlatformLoadTest'
    };

    cloudwatch.putMetricData(params, function(err, data) {
        if (err) {
            console.log("Cannot publish metrics (Settings) to CloudWatch");
            if (err.code != "AccessDenied")
            {
                console.log(err);
            }
            callback(err);
        } else {
            callback(err);
        }
    });
};

exports.publishLoadTestPerformanceMetrics = function (requestsUsed, requestsRemaining, callback) {
    let timestamp = new Date;

    let params = {
        MetricData: [
            {
                MetricName: 'requestsUsed',
                Timestamp: timestamp,
                Unit: 'Count/Second',
                Value: requestsUsed
            },

            {
                MetricName: 'requestsRemaining',
                Timestamp: timestamp,
                Unit: 'Count/Second',
                Value: requestsRemaining
            }
        ],
        Namespace: 'SFPlatformLoadTest'
    };

    cloudwatch.putMetricData(params, function(err, data) {
        if (err) {
            console.log("Cannot publish metrics (Settings) to CloudWatch");
            if (err.code != "AccessDenied")
            {
                console.log(err);
            }
            callback(err);
        } else {
            callback(err);
        }
    });
};

exports.publishLoadTestFuncGetLatencyMetrics = function (funcLatency, funcIntLatency, callback) {
    let timestamp = new Date;

    let params = {
        MetricData: [
            {
                MetricName: 'get-test-latency',
                Timestamp: timestamp,
                Unit: 'Milliseconds',
                Value: funcLatency
            },
            {
                MetricName: 'get-test-latency-net',
                Timestamp: timestamp,
                Unit: 'Milliseconds',
                Value: funcIntLatency
            }

        ],
        Namespace: 'SFPlatformLoadTest'
    };

    cloudwatch.putMetricData(params, function(err, data) {
        if (err) {
            console.log("Cannot publish metrics (Settings) to CloudWatch");
            if (err.code != "AccessDenied")
            {
                console.log(err);
            }
            callback(err);
        } else {
            callback(err);
        }
    });
};

exports.publishLoadTestFuncPostLatencyMetrics = function (funcLatency, funcIntLatency, callback) {
    let timestamp = new Date;

    let params = {
        MetricData: [
            {
                MetricName: 'post-test-latency',
                Timestamp: timestamp,
                Unit: 'Milliseconds',
                Value: funcLatency
            },
            {
                MetricName: 'post-test-latency-net',
                Timestamp: timestamp,
                Unit: 'Milliseconds',
                Value: funcIntLatency
            }
        ],
        Namespace: 'SFPlatformLoadTest'
    };

    cloudwatch.putMetricData(params, function(err, data) {
        if (err) {
            console.log("Cannot publish metrics (Settings) to CloudWatch");
            if (err.code != "AccessDenied")
            {
                console.log(err);
            }
            callback(err);
        } else {
            callback(err);
        }
    });
};

// Publish metrics to CloudWatch
exports.publishNumMsgsSentMetrics = function (graphName, numMessages, callback)
{
    let timestamp = new Date;

    let params = {
        MetricData: [
            {
                MetricName: graphName + '_msgSent',
                Timestamp: timestamp,
                Unit: 'Count',
                Value: numMessages
            }
        ],
        Namespace: 'SFPlatform'
    };

    cloudwatch.putMetricData(params, function(err, data) {
        if (err) {
            console.log("Cannot publish metrics (Settings) to CloudWatch");
            if (err.code != "AccessDenied")
            {
                console.log(err);
            }
            callback(err);
        } else {
            callback(err);
        }
    });
};

// Publish metrics to CloudWatch
exports.publishNumMsgConsumedMetrics = function (graphName, consumed, numMessages, callback)
{
    let timestamp = new Date;

    let params = {
        MetricData: [
            {
                MetricName: graphName + '_CapacityUnits',
                Timestamp: timestamp,
                Unit: 'Count',
                Value: consumed
            },

            {
                MetricName: graphName + '_numMessages',
                Timestamp: timestamp,
                Unit: 'Count',
                Value: numMessages
            }
        ],
        Namespace: 'SFPlatform'
    };

    cloudwatch.putMetricData(params, function(err, data) {
        if (err) {
            console.log("Cannot publish metrics (Settings) to CloudWatch");
            if (err.code != "AccessDenied")
            {
                console.log(err);
            }
            callback(err);
        } else {
            callback(err);
        }
    });
};