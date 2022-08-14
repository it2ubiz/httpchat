
var clients = [];


FindConnIndex = function(conn)
{
	for (var client in clients)
	{
		if (clients[client].conn == conn)
		{
			return (client);
		}
	}
	return (-1);
}

Add = function(connItem)
{
	clients.push(connItem);
	console.log("[Server] ++ client count: " + clients.length);
}

DeleteConnection = function(index)
{
	clients.splice(index, 1);
	console.log("[Server] -- client count: " + clients.length);
}

Del = function(conn)
{
	// find connection
	var cn = FindConnIndex(conn);

	if (cn == -1)
	{
//		console.log("Del error occurred: find connection record");
		return;
	}

	DeleteConnection(cn);
}

GetRecord = function(conn)
{
	var cn = FindConnIndex(conn);

	if (cn == -1)
	{
		console.log("Error occurred: find connection record");
		return (null);
	}

	return (clients[cn]);
}

SetConnProperty = function(conn, propertyName, propertyValue)
{
	var cn = FindConnIndex(conn);

	if (cn == -1)
	{
		console.log("Error occurred: find connection record");
		return;
	}

	clients[cn][propertyName] = propertyValue;
}

GetRecordByUserIDAll = function(userID)
{
	var clientList = [];
	for (var client in clients)
	{
		if (clients[client].userID == userID)
		{
			// user found online
			console.log("[GetRecordByUserIDAll] online user: " + JSON.stringify(userID) + ", " + clients[client].deviceID);
			clientList.push(clients[client]);
		}
	}

	console.log("[GetRecordByUserIDAll] user list count (" + JSON.stringify(userID) + "): " + JSON.stringify(clientList.length));
	return (clientList);
}


GetRecordByUserID = function(userID, deviceID)
{
	for (var client in clients)
	{
		if (clients[client].userID == userID && clients[client].deviceID == deviceID)
		{
			// user found online
			console.log("[GetRecordByUserID] online user: " + JSON.stringify(userID) + ", " + deviceID);
			return (clients[client]);
		}
	}

	// not found online
	console.log("[GetRecordByUserID] offline user: " + JSON.stringify(userID));
	return (null);
}

GetRecordByGUID = function(GUID)
{
	for (var client in clients)
	{
		if (clients[client].GUID == GUID)
		{
			// user found online
			var userID = clients[client].userID;
			var deviceID = clients[client].deviceID;
			console.log("[GetRecordByGUID][" + GUID + "] online user: " + JSON.stringify(userID) + ", " + deviceID);
			return (clients[client]);
		}
	}

	// not found online
	console.log("[GetRecordByGUID] offline user: " + JSON.stringify(GUID));
	return (null);
}

/////
// Exports

exports.Add = Add;
exports.GetRecord = GetRecord;
exports.Del = Del;
exports.SetConnProperty = SetConnProperty;
exports.GetRecordByUserID = GetRecordByUserID;
exports.GetRecordByUserIDAll = GetRecordByUserIDAll;
exports.GetRecordByGUID = GetRecordByGUID;
