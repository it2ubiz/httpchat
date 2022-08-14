const mysql = require("mysql");
let config;
try {
    config = require('./config.js');
} catch (ex) {
    config = require('./config.dist.js');
}


// Load missing configuration fields from ENV letiables
if (process.env.mysql && (process.env.mysql != "")) {
    config.MySQL.password = process.env.mysql;
    console.log("ENV letiable \"mysql\" has been read successfully");
}

let mysqlConnection = null;

ReconnectMySql = function (callback) {
    console.log("[MySql] reconnecting");
    if (config.MySQL !== undefined) {
        mysqlConnection = mysql.createConnection({
            host: config.MySQL.host,
            user: config.MySQL.user,
            password: config.MySQL.password,
            database: config.MySQL.database
        });

        mysqlConnection.connect(function (err) {
            if (err !== null) {
                console.log("ReconnectMySql: MYSQL Driver error connecting to service: " + err.stack);
            }
            else {
                console.log("ReconnectMySql: Mysql connected");
            }
            callback(err);
        });
    }
    else {
        callback("No MYSQL in config");
    }
};

QueryMySqlParams = function (request, params, callback) {
    console.log("[MYSQL] ", request, params);
    params = (params !== undefined) ? params : [];
    if (mysqlConnection === null) {
        ReconnectMySql(function (err) {
            if (err !== null) {
                callback(err);
                return;
            }

            mysqlConnection.query(request, params, function (err, row) {
                if (err !== null) {
                    console.log("[MySql] Query error = " + err);
                }
                callback(err, row);
            });
        });
    }
    else {
        mysqlConnection.query(request, params, function (err, row) {
            if (err) {
                console.log("MYSQL error query: " + err);
                if (mysqlConnection) {
                    mysqlConnection.end();
                }
                mysqlConnection = null;
            }
            callback(err, row);
        });
    }
};

exports.CreateTable = function (callback) {
    ReconnectMySql(function (err) {
        if (err !== null) {
            callback(err);
            return;
        }

        mysqlConnection.query("CREATE TABLE `Device` (	" +
            " `id` int(11) NOT NULL AUTO_INCREMENT," +
            " `user_id` int(11) DEFAULT NULL, " +
            " `jid` letchar(255) COLLATE utf8_unicode_ci NOT NULL," +
            " `token` letchar(255) COLLATE utf8_unicode_ci NOT NULL," +
            " `platform` letchar(10) COLLATE utf8_unicode_ci NOT NULL," +
            " `locale` letchar(5) COLLATE utf8_unicode_ci NOT NULL," +
            " `arn` letchar(255) COLLATE utf8_unicode_ci DEFAULT NULL," +
            " `versionClient` letchar(255) COLLATE utf8_unicode_ci DEFAULT NULL, " +
            " `versionProto` int(11) DEFAULT NULL," +
            " PRIMARY KEY (`id`)," +
            " KEY `IDX_E83B3B8A76ED395` (`user_id`)," +
            " KEY `UNIQ_Device_token` (`token`)," +
            " CONSTRAINT `FK_E83B3B8A76ED395` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE CASCADE" +
            ") ENGINE=InnoDB AUTO_INCREMENT=939 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci)", function (err) {
            console.log("error :" + err);
            callback(err);
        });
    });
};

exports.userExists = function (userID, callback) {
    const arr = userID.split("@");
    if (arr.length !== 2) {
        const err = "Wrong username format";
        callback(err);
        return;
    }
    const request = "select username from User where username=? and domain= ? and enabled=1;";
    QueryMySqlParams(request, [`${arr[0]}`, `${arr[1]}`], function (err, rows) {
        if (err != null) {
            callback(err);
            return;
        }
        if (rows && rows.length) {
            callback(err, true);
        } else {
            callback(err, false);
        }
    });
};

exports.QueryMySqlParams = QueryMySqlParams;
