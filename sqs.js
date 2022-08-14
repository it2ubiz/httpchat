var AWS = require('aws-sdk');
var Consumer = require('sqs-consumer');

var messages = require ("./messages.js");

try {
    var config = require('./config.js');
} catch (ex) {
    var config = require('./config.dist.js');
}

var database = require('./src/db');

if (config.awsAccessKey && config.awsSecretKey && (config.awsAccessKey != "---EDIT---")
    && (config.awsSecretKey != "---EDIT---")) {
    AWS.config.update({accessKeyId: config.awsAccessKey, secretAccessKey: config.awsSecretKey});
}

var sqs = new AWS.SQS({ region: config.awsSQSRegion });

// Routine creates Queue for server
CreateQueue = function(queueName, callback)
{
    var params =
    {
        QueueName: "" + queueName
    };

    sqs.createQueue(params, function(err, res)
    {
        if (err != null)
        {
            console.log("[SQS][CreateQueue] error: " + err);
            callback(err, null);

        }
        else
        {
            // store queue value in the table
            database.StoreServerQueue(queueName, res.QueueUrl, function(err)
            {
                callback(err, res.QueueUrl);
            });
        }
    });
};

// Routine sends a message to the queue
EnqueueMessage = function(queueUrl, message, callback)
{
    var msg = { payload: message };

    var sqsParams =
    {
        MessageBody: JSON.stringify(msg),
        QueueUrl: queueUrl
    };

//    console.log("[DBG] sqsParams = " + JSON.stringify(sqsParams));

    sqs.sendMessage(sqsParams, function(err, data)
    {
        if (err != null)
        {
            console.log("[SQS][EnqueueMessage][sendMessage] error: " + err);
        }
        else
        {
            console.log("[DBG][SQS][EnqueueMessage] WorkItem: " + message + " at " + queueUrl + " queued successfully");
        }

        callback(err);
    });
};

CreateConsumer = function(queueName)
{
    // get queueURL from the table
    database.GetServerQueue(queueName, function(err, queueUrl)
    {
        if (err != null)
        {
            console.log("[SQS][CreateConsumer][GetQueue] error: " + err);
            return;
        }

        var app = Consumer.create(
        {
            queueUrl: queueUrl,
            region: config.awsSQSRegion,
            batchSize: 10,

            handleMessage: function (message, done)
            {
                var msgBody = JSON.parse(message.Body);
                console.log("[SQS][" + queueName + "][Consumer] processing item: " + msgBody.payload);
                messages.DeliverLocal(msgBody.payload, function(err, numSent)
                {
                    console.log("[SQS][" + queueName + "][Consumer] item processed");
                    done();
                });
            },
            sqs: new AWS.SQS()
        });

        app.on('error', function (err)
        {
            console.log("[SQS][" + queueName + "][Consumer] error: " + err);
        });

        console.log("[SQS][" + queueName + "][Consumer] created");
        app.start();
    });
};

exports.CreateConsumer = CreateConsumer;
exports.EnqueueMessage = EnqueueMessage;
exports.CreateQueue = CreateQueue;
