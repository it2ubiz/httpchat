
const database = require ('./src/db');

try {
    var config = require('./config.js');
} catch (ex) {
    var config = require('./config.dist.js');
}

// Routine gets user's info
// no parameters
exports.GetUserInfo = function(userID, req, callback)
{
	var result = {};
	result.reply = {};

	// request user info
	database.QueryUserInfo(userID, function(err, info)
	{
		if (err != null)
		{
			// error receiving user information
			result.statusCode = 500;
			result.reply.error = "Internal server error";
			callback(result);
			return;
		}

		var inf = {};
		if (info != null && info.length > 0)
		{
			inf = info[0];
		}

		// query was successful
		// unpack user info
		unpackedInfo = exports.UnpackUserInfo(inf);

		var userInfo = {};

		userInfo.userID = userID;
		if (unpackedInfo.displayName)
		{
			userInfo.displayName = unpackedInfo.displayName;
		}

		if (unpackedInfo.avatarColor || unpackedInfo.avatarText || unpackedInfo.avatarLink)
		{
			// format output to reach the documentation
			userInfo.avatar = {};
			userInfo.avatar.text = unpackedInfo.avatarText;
			userInfo.avatar.color = unpackedInfo.avatarColor;
			userInfo.avatar.link = unpackedInfo.avatarLink;
		}

		result.statusCode = 200;
		result.reply.userInfo = userInfo;
		callback(result);
	});
};

// Routine sets user's info
exports.SetUserInfo = function(userID, req, callback)
{
	var result = {};
	result.reply = {};

	var body = req.body;
	if (body == undefined)
	{
		result.reply.error = "Bad request";
		result.statusCode = 400;
		callback(result);
		return;
	}

	// use these values, if they exist in request
	var displayNameNew = body.displayName;
	var avatarNew = body.avatar;

	// request user info
	database.QueryUserInfo(userID, function(err, info)
	{
		if (err != null)
		{
			// error receiving user information
			result.statusCode = 500;
			result.reply.error = "Internal server error";
			callback(result);
			return;
		}

		var inf = {};
		if (info == null || (info && info.length == 0))
		{
/*			result.statusCode = 500;
			result.reply.error = "Internal server error";
			callback(result);
			return;
*/
            console.log("[" + userID + "][SetUserInfo] has no userInfo");
		}
		else
		{
			inf = info[0];
            // query was successful
    		oldInf = exports.UnpackUserInfo(inf);
		}

		// prepare a new info structure from user's parameters
		var newInf =
		{
			"displayName" : displayNameNew
		};

		if (avatarNew)
		{
			newInf.avatarText = avatarNew.text;
			newInf.avatarColor = avatarNew.color;
			newInf.avatarLink = avatarNew.link;
        }
        updatedInf = exports.ChangeUserInfo(newInf, oldInf);

		// write values to the DB
		// pack them
		info = exports.PackUserInfo(updatedInf);

		// save values
		database.SetUserInfo(userID, info, function(err)
		{
			if (err != null)
			{
				result.statusCode = 500;
				result.reply.error = "Internal server error";
			}
			else
			{
				result.statusCode = 200;
			}
			callback(result);
		});
	});
};

// Helpers

// called to unpack data, received from DB
exports.UnpackUserInfo = function(info)
{
	var avatarText = "";
	var avatarColor = "";
	var avatarLink = "";
	var displayName = "";

	if (info.displayName && info.displayName["S"] != "")
	{
		displayName = info.displayName["S"];
	}

	if (info.avatarText && info.avatarText["S"] != "")
	{
		avatarText = info.avatarText["S"];
	}

	if (info.avatarColor && info.avatarColor["S"] != "")
	{
		avatarColor = info.avatarColor["S"];
	}

	if (info.avatarLink && info.avatarLink["S"] != "")
	{
		avatarLink = info.avatarLink["S"];
	}

	var unpacked =
	{
		"displayName" : displayName,
		"avatarText" : avatarText,
		"avatarColor" : avatarColor,
		"avatarLink" : avatarLink
	};

	return (unpacked);
};

// called to prepare data to be stored in DB
exports.PackUserInfo = function(info)
{
	var infoDB = {};

	if (info.displayName)
	{
		infoDB.displayName = {"S" : info.displayName};
	}

	if (info.avatarLink)
	{
		infoDB.avatarLink = {"S" : info.avatarLink};
	}

	if (info.avatarText)
	{
		infoDB.avatarText = {"S" : info.avatarText};
	}

	if (info.avatarColor)
	{
		infoDB.avatarColor = {"S" : info.avatarColor};
	}

	return (infoDB);
};

// routine changes displayName, avatar with use of info's. Resulting displayName & avatar returned as callback's parameters.
exports.ChangeUserInfo = function(newInfo, oldInfo, callback)
{
	// to remove a field - pass empty string
	// to not to touch the field - pass undefined or null

	var resultInfo = oldInfo;

	if (newInfo.displayName && newInfo.displayName != "")
	{
		resultInfo.displayName = newInfo.displayName;
	}
	else if (newInfo.displayName == "")
	{
		resultInfo.displayName = undefined;
	}

	if (newInfo.avatarText && newInfo.avatarText != "")
	{
		resultInfo.avatarText = newInfo.avatarText;
	}
	else if (newInfo.avatarText == "")
	{
		resultInfo.avatarText = undefined;
	}

	if (newInfo.avatarColor && newInfo.avatarColor != "")
	{
		resultInfo.avatarColor = newInfo.avatarColor;
	}
	else if (newInfo.avatarColor == "")
	{
		resultInfo.avatarColor = undefined;
	}

	if (newInfo.avatarLink && newInfo.avatarLink != "")
	{
		resultInfo.avatarLink = newInfo.avatarLink;
	}
	else if (newInfo.avatarLink == "")
	{
		resultInfo.avatarLink = undefined;
	}

	return (resultInfo);
};

// Helpers

// Routine retrieves userInfo for the specified user

Helper_GetUserInfo = function(userID, callback)
{
    database.QueryUserInfo(userID, function(err, info)
	{
		if (err != null)
		{
			// error receiving user information
            callback(err);
			return;
		}

		var inf = {};
		if (info != null && info.length > 0)
		{
			inf = info[0];
		}

		// query was successful
		// unpack user info
		unpackedInfo = exports.UnpackUserInfo(inf);

        callback(err, unpackedInfo);
    });
};

exports.Helper_GetUserInfo = Helper_GetUserInfo;
