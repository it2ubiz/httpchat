var cluster = require("cluster");
var AWS = require("aws-sdk");

exports.SetUpServerID = function (callback) {
    var meta = new AWS.MetadataService();

    meta.request("/latest/meta-data/instance-id", function (err, data) {
        meta.request("/latest/meta-data/placement/availability-zone", function (err, region) {
            if (err != null) {
                console.log("Get EC metadata failed");
            }
            else {
                var SERVERID = "Server_" + region + data + "_" + cluster.worker.id;
                console.log("ID: " + SERVERID);

                exports.SERVERID = SERVERID;

                callback();
            }
        });
    });
};

var SERVERID = "Server" + ( cluster.worker ? cluster.worker.id : " Zero");

exports.SERVERID = SERVERID;
