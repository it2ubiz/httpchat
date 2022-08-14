// Server and API paths

let useLocalServer = false;

exports.wsProto = 'wss://';
exports.clientDefaultDomain = 'safechats.com';

if (useLocalServer) {
    exports.serverURL = "127.0.0.1:3000"; // no trailing slash
    exports.APIURL = "http://" + exports.serverURL;
}
else {
    exports.serverURL = "api2.platform.safechats.com"; // no trailing slash
    exports.APIURL = "https://" + exports.serverURL;
}

exports.APIPath = "/api/v3"; // no trailing slash

exports.BackendPath = "/backend"; // no trailing slash
exports.PublicPath = "/public"; // no trailing slash

// Token
exports.serverKeyForHmac = 'asdfWEWERWEgfgag32423432Vadffa_2331$aas';
exports.accessTokenValidForSeconds = 86400; // 24 hours
exports.refreshTokenValidForSeconds = 86400 * 7; // 7 days
exports.AESPassword = 'afsdbbvxbvb_zz$zxvxbb4345Gsfgagaggafg';

exports.tokenDelimiter = ";";

// Amazon
//exports.awsRegion = "ap-southeast-1"; // !!! EDIT in local config.js !!! <-- (config.dist.js) USED by scripts running on servers
exports.awsAccessKey = "---EDIT---";
exports.awsSecretKey = "---EDIT---";

//exports.awsDynamoDBRegion = "ap-southeast-1";	// !!! DO NOT CHANGE
//exports.awsSQSRegion = "ap-southeast-1"; 		// !!! DO NOT CHANGE

//exports.awsRegion = "eu-west-1";
exports.awsRegion = "ap-southeast-1";

exports.awsDynamoDBRegion = exports.awsRegion;
exports.awsSQSRegion = exports.awsRegion;

// set up this flag if you intend to run server outside the Amazon environment (locally hosted)
exports.noAmazon = false;

// Amazon S3
exports.awsS3Region = "ap-southeast-1"; // DO NOT EDIT
exports.awsS3Bucket = "sf-platform-files-sg"; // DO NOT EDIT
exports.roleARN = "arn:aws:iam::505719123589:role/client-software-s3-uploader"; // DO NOT EDIT

// Demo backend
exports.useDemoBackend = true; // Add API endpoints for the demo backend
exports.demoBackendPath = "/server/v1"; // no trailing slash

// Signing
exports.signAlgorithm = "RSA-SHA256";
exports.serverKeyDirectory = "./server/runtime-data";
exports.clientKeyDirectory = "./server/runtime-data";

// Message GET/POST limitations
exports.limitSendMsgToN = 10;
exports.limitResponseToNRecords = 10;

// Auto-cleaning undelivered messages
// overdue age, in seconds
exports.pendingOverdue = 86400;

// Chats
exports.MaxUsersInChat = 25;

// MySQL connection
exports.MySQL = {};
// MySQL connection
exports.MySQL = {};
exports.MySQL.host = 'safechats-api-stage.csxmqfltcakb.ap-southeast-1.rds.amazonaws.com';
exports.MySQL.user = 'scplatform';
exports.MySQL.password = '';
exports.MySQL.database = 'sc_api_stage';

// Push messages
exports.oldPush = false; // use "true" to send old-style push messages
exports.maxMessageLengthToIncapsulate = 2048;	// maximum based64 message length to be sent directly in push message

exports.backendSecret = ''; // Gen value
exports.updateSecret = ''; // Gen value

// PKI keys
exports.pki = {};
exports.pki.userKeysMinimum = 5;


// DB selector
exports.databaseDriver = 'dynamo.vogels';
exports.queueDriver = 'rabbitMQ';

exports.queueLog = {reject: false};

// RabbitMQ connection
exports.RabbitMQ = {};

if (exports.awsRegion == "eu-west-1") {
    exports.RabbitMQ.uri = 'amqp://ch001:yOcfLjILtJ@rabbit-eu.platform.safechats.com:5672';
}
else {
    exports.RabbitMQ.uri = 'amqp://ch001:wfb78QRmgz@rabbit-sg.platform.safechats.com:5672';
}

const deviceTypes = {
    IOS: "iOS",
    IOS_DEBUG: "iOSDebug",
    IOS_VOIP: "iOSVoIP",
    IOS_MP: "iOSMP",
    ANDROID: "Android",
    ANDROID_MP: "AndroidMP",
    WINDOWS: "Windows",
    NODE_DEMO: "node_client"
};

exports.deviceTypes = deviceTypes;


// sns

exports.sns = {
    region: "ap-southeast-1",
    platform_application_arn: {
        //[deviceTypes.IOS]: 'arn:aws:sns:ap-southeast-1:106193757646:app/APNS/SafeChats-Messenger-Production',
        [deviceTypes.IOS]: 'arn:aws:sns:ap-southeast-1:106193757646:app/APNS_VOIP/SafeChats-v3-VoIP',
        [deviceTypes.IOS_DEBUG]: 'arn:aws:sns:ap-southeast-1:106193757646:app/APNS_VOIP_SANDBOX/SafeChats-v3-VoIP-Debug',
        [deviceTypes.IOS_VOIP]: 'arn:aws:sns:ap-southeast-1:106193757646:app/APNS_VOIP/SafeChats-v3-VoIP',
        [deviceTypes.IOS_MP]: 'arn:aws:sns:ap-southeast-1:106193757646:app/APNS/Mesej-Peribadi-Production',
        [deviceTypes.ANDROID]: 'arn:aws:sns:ap-southeast-1:106193757646:app/GCM/SafeChats-Messenger-Android',
        [deviceTypes.ANDROID_MP]: 'arn:aws:sns:ap-southeast-1:106193757646:app/GCM/Mesej-Peribadi-Android',
        [deviceTypes.WINDOWS]: null,
        [deviceTypes.NODE_DEMO]: 'arn:aws:sns:ap-southeast-1:106193757646:app/GCM/SafeChats-Messenger-Android' // For test
    }
};

//exports.RabbitMQ.uri = 'amqp://sfuser:Safe01@localhost:5672';

//MongoDB
exports.useMongoDB      = true;
exports.MongoDBHost     = "localhost";
exports.MongoDBPort     = "27017";
exports.MongoDBUserName = "";
exports.MongoDBPwd      = "";
exports.MongoDBSch      = "safechats";