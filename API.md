# SafeChats Communications Platform
# HTTP Public API

This HTTP-based API provides access to the SafeChats communications platform to third-party products and services via HTTPS.

*All hash and token values are provided as examples and do not match real values in production environment.*

# HTTP Headers
The following HTTP headers are used in API calls. The explanation for each headers follows.

| Header                 | Description                                                                                   
|------------------------|------------------------------------------------------------------------------------------------|
|      Authorization     | Every user provides her/his accessToken to receive and send messages (/messages API endpoint). This header validates that the request is authentic.
|      Accept-Language   | (Optional) The preferred language (en, zh...) can be specified for error messages. English is the default language if the header is missing. If the requested language is not available, the reply will be in English. |

#Group API endpoints

## API version [/version]

### Get API version [GET]

**Description**

Returns current API version.

**Possible status codes**

+ 200 - OK
+ 404 - Unknown

+ Response 200

    + Body

            {
                "version": "1.1.0"
            }

+ Response 404

    + Body

            {
                "error": "Unknown"
            }

## Public key [/publicKey]

### Get public key [GET]

**Description**

Returns server's public key

**Possible status codes**

+ 200 - OK
+ 404 - Unknown

+ Response 200

    + Body

            {
                "publicKey": "128914718294789124789124978124571822716924871"
            }

+ Response 404

    + Body

            {
                "error": "Unknown"
            }

## User token management [/token]

### Create a new token pair [POST]

**Description**

Creates a new token pair (accessToken, refreshToken) for a user. This endpoint can be viewed as a "create a new user" endpoint.

It registers a new user with the supplied userID and userPubKey. The API backend issues a new token pair that the user will use to send and receive messages. The token is used to authenticate requests made by the user.

**Request body**

**userID** – the username used by a third-party system (your system). Case-sensitive, *[a-zA-Z0-9]*, *"."* and *"-"* are allowed (*Example: "John.Doe-mobile1"*)

**userKey** – the user's public key from an RSA key pair used to verify message authenticity (*Example: "305C300D06092...F69BBA630203010001"*)

**Possible response status codes**

+ 201 - OK, a new token pair has been created
+ 400 - Invalid parameters
+ 500 - Internal server error

+ Request (application/json)

    + Body

            {
                "userID": "John.Doe-mobile1@safechats.com",
                "userKey": "305C300D06092A864886F70D0101010500034B003048024100A251C92CCA3E7B6599146DDB10044807B3AA1EFA8BE6274D329765E0CC5A0EA03CA8F010524A892484A7C96498660A20DBD3AA3E92D2CB5037DD95B7F69BBA630203010001",
				"clientOS" : "Android",
				"clientID" : "124908-3982473-483998-55885"
            }

+ Response 201 (application/json)

    + Body

            {
                "accessToken": "ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=",
                "refreshToken": "k52pXVrASHXFDiWK3RN5IUCSsi+ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4="
            }

+ Response 400 (application/json)

    + Body

            {
                "error": "Invalid parameters"
            }

+ Response 500 (application/json)

    + Body

            {
                "error": "Internal server error"
            }

### Create a new accessToken for a valid refreshToken [PUT]

Creates a new *accessToken* for a valid *refreshToken*.

*accessTokens* expire from time to time and the next API request by the user will return a 401 error code. It means that that the provided *accessToken* has expired.

*refreshTokens* have a much longer life span. In case of a 401 error code, the client should make a request to this API endpoint to request a new *accessToken* using a *refreshToken*.

**Request body**

**refreshToken** – provide a *refreshToken* to receive a new *accessToken*

**Possible response status codes**

+ 201 - OK, a new accessToken has been created
+ 401 - The submitted refreshToken is not valid
+ 500 - Internal server error

+ Request (application/json)

    + Body

            {
                "refreshToken": "k52pXVrASHXFDiWK3RN5IUCSsi+ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4="
            }

+ Response 201 (application/json)

    + Body

            {
                "accessToken": "ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4="
            }

+ Response 401 (application/json)

    + Body

            {
                "error": "refreshToken is not valid"
            }

+ Response 500 (application/json)

    + Body

            {
                "error": "Internal server error"
            }

## Chats management [/chats]

**Required request headers**

**Authorization** – user's *accessToken*

### Create a chat room [PUT]

**Description**

This endpoint creates an empty chat, returning generated chatID. On success, the user who called for a chat creation will be set as the owner and as the first participant of a newly created chat.

**Possible response status codes**

+ 201 - Created
+ 400 - Bad request
+ 401 - Not authorized
+ 500 - Internal server error

+ Request (application/json)

    + Headers

            Authorization: ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=

	+ Body
	
			{
				"chatName" : "my-super-chat",
				"userLimit" : "20"
			}

+ Response 201 (application/json)

	+ Body

			{
				"chatID" : "2EFD89MKT",
				"ownerGUID" : "6c84ec90-11c5-10e5-840d-7c25e5ff775a"
			}

+ Response 400 (application/json)

	+ Body

			{
				"error" : "Bad request"
			}

+ Response 401 (application/json)

	+ Body

			{
				"error" : "Bad token"
			}

+ Response 500 (application/json)

	+ Body
	
			{
				"error" : "Internal server error"
			}

### Delete a chat room [DELETE]

**Description**

Deletes a chat completely. User should be its owner.

**Possible response status codes**

+ 200 - OK, deleted successfully
+ 400 - Bad request
+ 401 - Bad token
+ 403 - Not permitted, user is not an owner of this chat
+ 404 - ChatID not found (or user does not participate in it)
+ 500 - Internal server error

+ Request (application/json)

    + Headers

            Authorization: ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=

	+ Body
	
			{
				"chatID" : "2EFD89MKT"
			}

+ Response 200 (application/json)

+ Response 400 (application/json)

    + Body

            {
                "error": "Bad request"
            }

+ Response 401 (application/json)

    + Body

            {
                "error": "Bad token"
            }

+ Response 403 (application/json)

    + Body

            {
                "error": "Not permitted"
            }

+ Response 404 (application/json)

    + Body

            {
                "error": "ChatID not found"
            }

+ Response 500 (application/json)

    + Body

            {
                "error": "Internal server error"
            }

### List chats for the specified user [GET]

**Description**

This method returns a set of chat rooms where user participates.
GUID is a special field which shows the GUID of userID in the selected chat.

**Possible response status codes**

+ 200 - OK
+ 401 - Bad token
+ 500 - Internal error occurred

+ Request (application/json)

    + Headers

            Authorization: ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=

+ Response 200 (application/json)

	+ Body
	
			{
				"chats" :
				[
					{
		                "chatID" : "2EFD89MKT",
		                "chatName" : "chat description",
		                "ownerGUID" : "6c84ec90-11c5-10e5-840d-7c25e5ff775a",
		                "creationTime" : "14472857384",
		                "updateTime" : "14472857384",
		                "domainName" : "@safechats.com",
						"GUID" : "8c84ec90-11c5-10e5-840d-7c25e5ff775e",
						"userLimit": "13"
					},
				]
			}

+ Response 401 (application/json)

	+ Body
	
			{
				"error" : "Bad token"
			}

+ Response 500 (application/json)

	+ Body
	
			{
				"error" : "Internal server error"
			}

##  Chat room management [/chats/{chatID}/users]

+ Parameters
    + chatID (required, string) ... ID of the chat (chat room) to add a user to. Case-sensitive, *[a-zA-Z0-9]*, *"."* and *"-"* are allowed. (*Example: "chat-148523592"*)

### Add a user to a chat [PUT]

**Description**

Adds a user to a chat (chat room). If the chat room does not exist, it will be created.

This endpoint adds users to the existing chat room. Returns a chatBuddies array containing all newly added users. If userID is not listed, user was not added.

users – The username array used by a third-party system (your platform). Case-sensitive, *[a-zA-Z0-9]*, *"."* and *"-"* are allowed (*Example: ["John.Doe-mobile1@safechats.com", "user2222@safechats.com"]*)

**Request body parameters**

**users** – The list of participants to add to the chat room specified by *chatID*

**Possible response status codes**

+ 200 - OK
+ 400 - Bad request
+ 401 - Bad token
+ 403 - Not permitted or chat does not exist
+ 409 - Conflict. The chat's user limit exceeded
+ 500 - Internal server error

+ Request (application/json)

	+ Parameters
	
			"chatID" : "2EFD89MKT"

    + Headers

            Authorization: ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=

    + Body

			{
				"users":
				[
					"John.Doe-mobile1@safechats.com",
					"user2222@safechats.com"
				]
			}

+ Response 200 (application/json)

    + Body

            {
                "chatBuddies":
				[
					{
						"GUID" : "6c84ec90-11c5-10e5-840d-7c25e5ff775a",
						"userID" : "John.Doe-mobile1@safechats.com",
						"displayName" : "Super User"
					}
				]
            }

+ Response 400 (application/json)

    + Body

            {
                "error": "Bad request"
            }

+ Response 401 (application/json)

    + Body

            {
                "error": "Bad token"
            }

+ Response 403 (application/json)

    + Body

            {
                "error": "Not permitted"
            }

+ Response 409 (application/json)

    + Body

            {
                "error": "Conflict"
            }

+ Response 500

    + Body

            {
                "error": "Internal server error"
            }

### Delete users from chat [DELETE]

**Description**

Deletes a list of users from *chatID*. 
If ownerID is included in the userList, the chat deletion will fail with the result 403. To delete a owner from chat use DeleteChat endpoint.
Users can be indicated by their names (userID) and/or by GUIDs in this chat.

**Possible response status codes**

+ 200 - OK, deleted successfully
+ 400 - Bad request
+ 401 - Bad token
+ 403 - Not permitted or chatID not found
+ 500 - Internal server error

+ Request (application/json)

	+ Parameters
	
			"chatID" : "2EFD89MKT"

	+ Headers
	
			Authorization: ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=

    + Body

			{
	            "users" : 	... optional
	            [
	                "user2222@safechats.com",
	            ],
	            "GUIDs" : 	... optional
	            [
	                "f017e919-f759-451e-9365-c7dedccbdfef",
	            ]
			}


+ Response 200 (application/json)

+ Response 400 (application/json)

    + Body

            {
                "error": "Bad request"
            }

+ Response 401 (application/json)

    + Body

            {
                "error": "Bad token"
            }

+ Response 404 (application/json)

    + Body

            {
                "error": "ChatID not found"
            }

+ Response 500 (application/json)

    + Body

            {
                "error": "Internal server error"
            }

### Get a list of users in a chat room [GET]

**Description**

Gets the list of users in the chat room identified by chatID. Every participant from this chat room can obtain user's list of this room.

**Possible response status codes**

+ 200 - OK
+ 400 - Bad request
+ 401 - Bad token
+ 404 - ChatID not found
+ 500 - Internal server error

+ Request (application/json)

	+ Parameters
	
			"chatID" : "2EFD89MKT"

	+ Headers
	
			Authorization: ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=

+ Response 200 (application/json)

	+ Body
	
	        {
	    		"chatBuddies":
				[
					{
						"GUID" : "8861c317-a6a8-4655-b49f-0561f83220ff",
						"userID" : "user2222@safechats.com",
						"displayName" : "User1 display name"
					},
					{
						"GUID" : "f017e919-f759-451e-9365-c7dedccbdfef",
						"userID" : "John.Doe-mobile1@safechats.com",
						"displayName" : "User2 display name"
					}
				]
			}
			

+ Response 400 (application/json)

    + Body

            {
                "error": "Bad request"
            }

+ Response 401 (application/json)

    + Body

            {
                "error": "Bad token"
            }

+ Response 404 (application/json)

    + Body

            {
                "error": "ChatID not found"
            }

+ Response 500

    + Body

            {
                "error": "Internal server error"
            }

## Chat information [/chats/{ChatID}/info]

### Receive chat information [GET]

**Description**

Gets the information about the specified chat.

**Possible response status codes**

+ 200 - OK, deleted successfully
+ 400 - Bad request
+ 401 - Bad token
+ 404 - ChatID not found
+ 500 - Internal server error

+ Request (application/json)

	+ Parameters
	
			"chatID" : "2EFD89MKT"

	+ Headers
	
			Authorization: ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=

+ Response 200 (application/json)

	+ Body
	
			{
				"chatInfo" : 
				{
	                "chatID" : "2EFD89MKT",
	                "chatName" : "chat description",
	                "ownerGUID" : "6c84ec90-11c5-10e5-840d-7c25e5ff775a",
	                "creationTime" : "14472857384",
	                "updateTime" : "14472857384",
	                "domainName" : "@safechats.com",
					"GUID" : "7c84ec90-11c5-10e5-840d-7c25e5ff775a",
					"userLimit" : "20",
					"userCount" : "10"
				}
			}

+ Response 400 (application/json)

    + Body

            {
                "error": "Bad request"
            }

+ Response 401 (application/json)

    + Body

            {
                "error": "Bad token"
            }

+ Response 404 (application/json)

    + Body

            {
                "error": "ChatID not found"
            }

+ Response 500 (application/json)

    + Body

            {
                "error": "Internal server error"
            }

### Set chat information [PUT]

**Description**

Sets the information about the specified chat.
For now, could only set *chatName* field.

**Possible response status codes**

+ 200 - OK, deleted successfully
+ 400 - Bad request
+ 401 - Bad token
+ 403 - Not permitted or chatID not found
+ 500 - Internal server error

+ Request (application/json)

	+ Parameters
	
			"chatID" : "2EFD89MKT"

	+ Headers
	
			Authorization: ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=

	+ Body
	
			{
	            "chatName" : "New chat description"
			}

+ Response 200 (application/json)

+ Response 400 (application/json)

    + Body

            {
                "error": "Bad request"
            }

+ Response 401 (application/json)

    + Body

            {
                "error": "Bad token"
            }

+ Response 403 (application/json)

    + Body

            {
                "error": "Not permitted"
            }

+ Response 500 (application/json)

    + Body

            {
                "error": "Internal server error"
            }

## User information [/user/info]

### Receive user information [GET]

**Description**

Retrieves the current user's information.

**Possible response status codes**

+ 200 - OK, deleted successfully
+ 400 - Bad request
+ 401 - Bad token
+ 500 - Internal server error

+ Request (application/json)

	+ Headers
	
			Authorization: ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=

+ Response 200 (application/json)

	+ Body
	
			{
				"userInfo" : 
				{
	                "userID" : "user1@safechats.com",
					"displayName" : "super user",
					"avatar" :
					{
						"text" : "AB",
						"color" : "#FFAAFF"
					}
				}
			}

+ Response 400 (application/json)

    + Body

            {
                "error": "Bad request"
            }

+ Response 401 (application/json)

    + Body

            {
                "error": "Bad token"
            }

+ Response 500 (application/json)

    + Body

            {
                "error": "Internal server error"
            }

### Set user information [PUT]

**Description**

Sets the user's information.

**Possible response status codes**

+ 200 - OK, information set
+ 400 - Bad request
+ 401 - Bad token
+ 500 - Internal server error

+ Request (application/json)

	+ Headers
	
			Authorization: ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=

	+ Body
	
			{
				"displayName" : "Super User",	... optional
				"avatar" : 			... optional
				{
					"text" : "AB",
					"color" : "#FFAAFF",
					"link" : "https://safechats.com/images/avatar1.png"
				}
			}

+ Response 200 (application/json)

+ Response 400 (application/json)

    + Body

            {
                "error": "Bad request"
            }

+ Response 401 (application/json)

    + Body

            {
                "error": "Bad token"
            }

+ Response 403 (application/json)

    + Body

            {
                "error": "Not permitted"
            }

+ Response 500 (application/json)

    + Body

            {
                "error": "Internal server error"
            }


## Contact list [/contactlist]

**Description**
Contact list contains the list of following items:
1) *userID*
2) *displayName*
3) *avatar*
4) *presence/lastSeenOnline* status

Example of a contact list item:

	{
		"contact" : "user111@safechats.com",
		"displayName" : "original user name"
	}

Example of a contact list item after displayName customization:

	{
		"contact" : "user111@safechats.com",
		"displayName" : "super user"
	}

Example of a contact list item after avatar customization:

	{
		"contact" : "user111@safechats.com",
		"displayName" : "super user",
		"avatar" :
		{
			"text" : "AB",
			"color" : "#FFAAFF"
		}
	}

### Get contact list [GET]

+ Request (application/json)

		+ Headers:

			"token" : "12893471928471298480192492"


+ Response 200

		+ Body:

			{
				"contactList":
				[
					{
						"contactID" : "user222@safechats.com",
						"displayName" : "Super User",
						"avatar" :
						{
							"text" : "AB",
							"color" : "#FFAAFF",
							"link" : "https://safechats.com/images/avatar1.png"
						},
						"presence" : "1443837923"
					}
				]
			}

## Contact-list item operations [/contactlist/contacts]

### Add users to the contact list [PUT]

+ Request (application/json)

		+ Headers:

			{
				"token" : "12893471928471298480192492"
			}

		+ Body:

			{
				"contactsToAdd" :
				[
					"user222@safechats.com",
					"user111@safechats.com"
				]
			}

+ Response 200 (application/json)

		+ Body:

			{
				"contactsAdded" :
				[
					{
						"contactID" : "user222@safechats.com",
						"displayName" : "Super User",
						"avatar" :
						{
							"text" : "AB",
							"color" : "#FFAAFF",
							"link" : "https://safechats.com/images/avatar1.png"
						},
						"presence" : "1462893924239"
					}
				],
				"contactsNotFound" :
				[
					"user111@safechats.com"
				]
				"contactsError" :
				[
					"user333@safechats.com"
				]
			}

### Delete users from contact list [DELETE]

+ Request (application/json)

		+ Headers:

			{
				"Token" : "12893471928471298480192492"
			}

		+ Body:

			{
				"contactsToDelete" :
				[
					"user222@safechats.com",
					"user111@safechats.com"
				]

			}

+ Response 200 (application/json)

		+ Body:

			{
				"contactsDeleted" :
				[
					"user222@safechats.com"
				],
				"contactsError" :
				[
					"user333@safechats.com"
				]
			}

## Contact list customizations interface [/contactlist/customizations]

**Remarks**
*Passing empty values in *displayName* field removes this field*
*Passing empty *avatar* structure removes avatar info*

### Set customizations [PUT]

+ Request (application/json)

		+ Body:
			{
				"contactListCustomizations":
				[
					{
						"contactID" : "user222@safechats.com",
						"displayName" : "Super User",	... optional
						"avatar" : 			... optional
						{
							"text" : "AB",
							"color" : "#FFAAFF",
							"link" : "https://safechats.com/images/avatar1.png"
						}
					}
				]
			}
		

+ Response 200 (application/json)

		+ Body:

			{
				"contactsAdded":
				[
					{
						"contactID" : "user222@safechats.com",
						"presence" : "1463819741947"
					}
				]
				"contactsNotFound":
				[
					"user111@safechats.com"
				]
				"contactsError":
				[
					"user333@safechats.com"
				]
			}

+ Response 401 (application/json)

    + Body

            {
                "error": "Bad token"
            }

+ Response 500 (application/json)

    + Body

            {
                "error": "Internal server error"
            }

##  Messaging API [/messages]

**Required request headers**

**Authorization** – user's *accessToken*

### Get new messages [GET (?timestamp, sign)]

**Description**

Sign is a signature of timestamp (as user's public key is transferred in Authorization header)

**Possible info subTypes**

+ chat_enter : *somebody or a group of users entered the chat*
+ chat_leave : *somebody or a group of users left the chat*
+ chat_typing : *somebody or a group of users started typing messages*
+ chat_typingEnd : *somebody or a group of users ended typing messages*

**Possible response status codes**

+ 200 - OK
+ 401 - AccessToken is NOT correct (Authorization header)
+ 403 - Wrong signature
+ 409 - Time conflict
+ 500 - Internal server error

+ Request (application/json)

	+ Parameters
	
			"timestamp" : "1447584927",
			"sign" : "129842189471289791287892ab389239874987987"

    + Headers

            Authorization: ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=

+ Response 200 (application/json)

    + Body

            {
				"incomingEvents":
				{
					"timestamp" : "1449906857",
					"messages":		... optional
	                [
	                    {
	                        "messageID": "10394cd7c3b248ac5c3baa650",
	                        "sender": "6c84ec90-11c5-10e5-840d-7c25e5ff775a",
	                        "messageText": "Message text",
	                        "serverTime": "1444757940",
	                        "chatID": "2EFD89MKT",
							"recipientList":
							[
								"1084ec90-11c5-10e5-840d-7c25e5ff775a",
								"5984ec90-11c5-10e5-840d-7c25e5ff775b"
							]
	                    },
					],
					"statuses":		... optional
					[
	                    {
	                        "type": "delivered",
	                        "messageID": "d97686706eb390250af964b10394",
	                        "messageIDStatus": "20394cd7c3b248ac5c3bca651"б
							"recipient" : "1084ec90-11c5-10e5-840d-7c25e5ff775a"
	                    },
	                    {
	                        "type": "read",
	                        "messageID": "d97686706eb390250af964b10394",
	                        "messageIDStatus": "20394cd7c3b248ac5c3bca651",
							"recipient" : "1084ec90-11c5-10e5-840d-7c25e5ff775a"
	                    }
	                ],
					"info":		... optional
					[
						{
							"messageID": "d97686706eb390250af964b10394",
							"subType": "chat_enter",
							"chatID": "2EFD89MKT",
							"messageGUIDList": 
							[
								{
									"GUID" : "6c84ec90-11c5-10e5-840d-7c25e5ff775a",
									"userID" : "John.Doe-mobile1@safechats.com",
									"displayName" : "Super User"
								}
							]
						}
					]
				},
                "sign": "b196a0c8bb0e588d033faa7f6fde89a5c7cfd8fc7d305de4f0914fe2cce77c038c20b7d5afbbaf3d3b79ccf32a1503759176745b750b82a82efb56195b712c9f",
            }

+ Response 401 (application/json)

    + Body

            {
                "error": "Bad token"
            }

+ Response 403 (application/json)

    + Body

            {
                "error": "Bad signature"
            }

+ Response 409 (application/json)

    + Body

            {
                "error": "Time conflict"
            }

+ Response 500 (application/json)

    + Body

            {
                "error": "Internal server error"
            }


### Post a message [POST]

**Description**

This endpoint sends a bunch of messages and/or statuses to the chat's recipient.

**Possible response status codes**

+ 200 - OK
+ 400 - Bad request
+ 401 - Bad token
+ 403 - Bad signature
+ 404 - ChatID not found (or recipient not found in a chat)
+ 409 - Time conflict
+ 500 - Internal server error

+ Request (application/json)

    + Headers

            Authorization: ZmHBzeBxUs7N8hdt0BJbiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8osiROVfDe2MFXeTutQfJwaqcBAe88LKt5s8os4WE5N+isBd1Jo5kz+v1AVR5VV+5xgZvXeQ8dk8uSI0XBcUaUY5ByLtVXviYKrJ2KhiIJrbchDjRG6YPqXmvLE5rz/w19Wy79Hr+Mcliiqpwgur6fdMXA5dA5cE4XWuQSwe3ZSOZvWQgWeO5iDHcaoreU4=

    + Body

			{
				"outgoingEvents":
				{
					"timestamp" : "14458692938",
					"messages":
					[
						"chatID": "2EFD89MKT",
						"clientHash" : "1234567890abcdef",
						"timestamp": "1444757941",
						"messageBlock":
						[
							{
								"messageText": "Message text",
								"recipient" : "124098294-3902384-349028-48494849"
							}
						]
	                },
	                {
						"chatID": "2EFD89MKT",
						"clientHash" : "1234567890abcdee",
						"timestamp": "1444757942",
						"messageBlock":
						[
							{
								"messageText": "Message text - another message",
								"recipient" : "124098294-3902384-349028-48494849"
							}
						]
					],
					"statuses":
					[
						{
							"messageID": "10394cd7c3b248ac5c3baa6504",
							"clientHash" : "2234567890abcdeb",
							"messageStatus": "delivered"
						},
						{
							"messageID": "10394cd7c3b248ac5c3baa6504",
							"clientHash" : "2234567890abcdef",
							"messageStatus": "read"
						}
					],
				},
				"sign": "9e362a99813478ab0f7339507b7682ef7f198af859642b2b8ba75d9553564258a32a7b1231498117ed2e73c79b8d6435b50683cb93e4e269be1a9b485f120f5e",
			}


+ Response 200 (application/json)

    + Body

	        {
	            "outgoingEventsResult":
	            {
					"messages" :
					[
		                {
							"clientHash" : "1234567890abcdef",
							"serverTime": "1444757975",
							"messageID": "10394cd7c3b248ac5c3baa65041444757951"
		                },
		                {
							"clientHash" : "2234567890abcdee",
							"serverTime": "1444757975",
							"messageID": "10394cd7c3b248ac5c3baa65041444757959"
		                }
					],
					"statuses" :
					[
						"2234567890abcdeb",
						"2234567890abcdef"
					]
	            },
	            "sign": "9ddd617a08486638a5d05692ae7f022fa0c632abdacb3041c4b0da91ee0cb73e2a48954fc601f96fdcaa6483c2baed98533ad946513588130ef8356d6c7bdf46",
	        }
	
+ Response 400 (application/json)

    + Body

            {
                "error": "Bad request"
            }

+ Response 401 (application/json)

    + Body

            {
                "error": "Bad token"
            }

+ Response 403 (application/json)

    + Body

            {
                "error": "Bad signature"
            }

+ Response 404 (application/json)

    + Body

            {
                "error": "ChatID not found"
            }

+ Response 409 (application/json)

    + Body

            {
                "error": "Time conflict"
            }

+ Response 500 (application/json)

    + Body

            {
                "error": "Internal server error"
            }
