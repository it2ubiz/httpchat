# SafeChats Communications Platform
# Public version of the websockets API

This API provides access to the SafeChats communications platform to third-party products and services via Websockets.

*All hash and token values are provided as examples and do not match real values in production environment.*
*All structures should be organized as JSON structures.*

##Request structure

**Mandatory fields:**

+ method. Request method.
*A string which means the exact action to be done. Could be "POST", "GET", "DELETE" or "PUT";*
+ uri - identifier of called method. 
*Example: "/version";*
+ clientID - is a unique number sent by a client to identify server's answer

**Optional fields:**

+ headers. Request headers. 
*Could contain additional headers as they go in HTTP request.*
+ body. Request body. 
*Only applicable for POST and PUT methods.*
+ params. Additional parameters for request.


##Response structure

**Mandatory fields:**

*These fields are copied from the corresponding request fields and sent back to client.*
+ uri - identifier of called method. 
*Example: "/version";*
+ method. Requested method.
*A string which means the exact action which was done.*
+ status. Response status.
*A code, which is similar to HTTP response code and contains the result of the request.*
+ clientID. Value from client.
*A number sent by client to identify the response*

**Optional fields:**
+ headers. Response headers. 
*Could contain additional headers as they go in HTTP response.*
+ body. Response body.

##API description


### API version
Returns current API version.

+ status : *200 - OK*
+ status : *404 - Unknown*

Request

    {
        "method" : "GET",
        "uri" : "/version",
		"clientID" : "1234567890"
    }

Response 200

    {
        "method" : "GET",
        "uri" : "/version",
        "status" : "200",
		"clientID" : "1234567890",
        "body":
        {
            "version": "1.1.0"
        }
    }

Response 404

    {
        "method" : "GET",
        "uri" : "/version",
        "status" : "404",
		"clientID" : "1234567890",
        "body":
        {
            "error": "Unknown"
        }
    }

### User login [/users/accessToken]

+ status: *200 - OK*
+ status: *400 - Bad request*
+ status: *403 - UserID or password is incorrect*

Request

    {
        "method" : "POST",
        "uri" : "/users/accessToken",
		"clientID" : "1234567890",
        "headers" : 
        {
            "authorization" : "P@ssw0rd"
        },
        "params" :
        {
            "userID": "John@safechats.com",
			"clientOS" : "Android",
			"clientID" : "124908-3982473-483998-55885"
        },
        "body" : 
        {
            "userKey": "305C300D06092A864886F70D0101010500034B003048024100A251C92CCA3E7B6599146DDB10044807B3AA1EFA8BE6274D329765E0CC5A0EA03CA8F010524A892484A7C96498660A20DBD3AA3E92D2CB5037DD95B7F69BBA630203010001"
        }
    }

Response 200

    {
        "method" : "POST",
        "uri" : "/users/accessToken",
        "status" : "200"
		"clientID" : "1234567890"
    }

Response 400

    {
        "method" : "POST",
        "uri" : "/users/accessToken",
        "status" : "400"
		"clientID" : "1234567890",
        "body":
        {
			"error" : "Bad request"
		}
    }

Response 403

    {
        "method" : "POST",
        "uri" : "/users/accessToken",
        "status" : "403"
		"clientID" : "1234567890",
        "body":
        {
			"error" : "userID or password is incorrect"
		}
    }

## Chat rooms management

### Create a chat room

**Description**

This request creates an empty chat, returning generated chatID. On success, the user who called for a chat creation will be set as the owner and as the first participant of the newly created chat.

**Possible response status codes**

+ status : *201 - Created*
+ status : *400 - Bad request*
+ status : *401 - Not authorized*
+ status : *500 - Internal server error*

**Example**

Request

	{
		"method" : "PUT",
		"uri" : "/chats",
		"clientID" : "1234567890",
		"body" :
		{
			"chatName" : "my-super-chat",
			"userLimit" : "20"
		}
	}

Response 201

	{
		"method" : "PUT",
		"uri" : "/chats",
		"status" : "201",
		"clientID" : "1234567890",
        "body":
        {
			"chatID" : "2EFD89MKT",
			"ownerGUID" : "6c84ec90-11c5-10e5-840d-7c25e5ff775a"
		}
	}

Response 400

	{
		"method" : "PUT",
		"uri" : "/chats",
		"status" : "400",
		"clientID" : "1234567890",
        "body":
        {
			"error" : "Bad request"
		}
	}
	

Response 401

	{
		"method" : "PUT",
		"uri" : "/chats",
		"status" : "401",
		"clientID" : "1234567890",
        "body":
        {
			"error" : "Not authorized"
		}
	}
	

Response 500

	{
		"method" : "PUT",
		"uri" : "/chats",
		"status" : "500",
		"clientID" : "1234567890",
        "body":
        {
			"error" : "Internal server error"
		}
	}

### Delete a chat room

**Description**

Deletes a chat completely. User should be its owner.

**Possible response status codes**

+ status : *200 - OK, deleted successfully*
+ status : *400 - Bad request*
+ status : *401 - Not authorized*
+ status : *403 - Not permitted, user is not the owner of this chat*
+ status : *404 - ChatID not found (or user does not participate in it)*
+ status : *500 - Internal server error*

Request

	{
		"method" : "DELETE",
		"uri" : "/chats",
		"clientID" : "1234567890",
		"body" :
		{
			"chatID" : "2EFD89MKT"
		}
	}

Response 200

	{
		"method" : "DELETE",
		"uri" : "/chats",
		"status" : "200",
		"clientID" : "1234567890"
	}

Response 400

	{
		"method" : "DELETE",
		"uri" : "/chats",
		"status" : "400",
		"clientID" : "1234567890",
        "body":
        {
			"error" : "Bad request"
		}
	}

Response 401

	{
		"method" : "DELETE",
		"uri" : "/chats",
		"status" : "401",
		"clientID" : "1234567890",
        "body":
        {
			"error" : "Not authorized"
		}
	}

Response 403

	{
		"method" : "DELETE",
		"uri" : "/chats",
		"status" : "403",
		"clientID" : "1234567890",
        "body":
        {
			"error" : "Not permitted"
		}
	}

Response 404

	{
		"method" : "DELETE",
		"uri" : "/chats",
		"status" : "404",
		"clientID" : "1234567890",
        "body":
        {
			"error" : "chatID not found"
		}
	}

Response 500

	{
		"method" : "DELETE",
		"uri" : "/chats",
		"status" : "500",
		"clientID" : "1234567890",
        "body":
        {
			"error" : "Internal server error"
		}
	}

### Get a list of user's chat rooms

**Description**

This method returns a set of chat rooms where user participates.
GUID is a special field which shows the GUID of userID in the selected chat.

**Possible response status codes**

+ status : *200 - OK*
+ status : *401 - Not authorized*
+ status : *500 - Internal server error*

Request

    {
        "method" : "GET",
        "uri" : "/chats",
		"clientID" : "1234567890"
    }

Response 200

    {
        "method" : "GET",
        "uri" : "/chats",
        "status" : "200",
		"clientID" : "1234567890",
		"body:
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
					"usersLimit": "13",
	            }
	        ]
		}
    }

Response 401

    {
        "method" : "GET",
        "uri" : "/chats",
        "status" : "401",
		"clientID" : "1234567890",
		"body" :
		{
			"error" : "Not authorized"
		}
    }


Response 500

    {
        "method" : "GET",
        "uri" : "/chats",
        "status" : "500",
		"clientID" : "1234567890",
		"body" :
		{
			"error" : "Internal server error"
		}
    }

## Chat room management

### Add user(s) to the chat

**Description**

Adds user(s) to the existing chat room.

+ users – The username array which contains UserIDs. Case-sensitive, *[a-zA-Z0-9]*, *"."* and *"-"* are allowed (*Example: ["John.Doe-mobile1@safechats.com", "user2222@safechats.com"]*)

This function adds users to the existing chat room. Returns a chatBuddies array containing all newly added users. If userID is not listed, user was not added.

**Possible response status codes**

+ status : *200 - OK*
+ status : *400 - Bad request*
+ status : *401 - Not authorized*
+ status : *403 - Not permitted, probably when the user is not the chat's owner*
+ status : *409 - Conflict. A user limit for this chat is too small*
+ status : *500 - Internal server error*

Request

    {
        "method" : "PUT",
        "uri" : "/chats/users",
		"clientID" : "1234567890",
        "params" :
        {
            "chatID" : "2EFD89MKT"
        },
        "body" :
        {
            "users":
            [
                "John.Doe-mobile1@safechats.com",
                "user2222@safechats.com"
            ]
        }
    }

Response 200

    {
        "method" : "PUT",
        "uri" : "/chats/users",
        "status" : "200",
		"clientID" : "1234567890",
        "body" :
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
    }

Response 400

    {
        "method" : "PUT",
        "uri" : "/chats/users",
        "status" : "400",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Bad request"
        }
    }

Response 401

    {
        "method" : "PUT",
        "uri" : "/chats/users",
        "status" : "401",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Not authorized"
        }
    }

Response 403

    {
        "method" : "PUT",
        "uri" : "/chats/users",
        "status" : "403",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Not permitted"
        }
    }

Response 409

    {
        "method" : "PUT",
        "uri" : "/chats/users",
        "status" : "409",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Conflict"
        }
    }


Response 500

    {
        "method" : "PUT",
        "uri" : "/chats/users",
        "status" : "500",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Internal server error"
        }
    }

### Delete user(s) from chat

**Description**

Deletes a list of users from *chatID*. 
If ownerID is included in the userList, the chat deletion will fail with the result 403. To delete a owner from chat use DeleteChat method.
Users can be indicated by their names (userID) and/or by GUIDs in this chat.

**Possible response status codes**

+ status : *200 - OK, deleted successfully*
+ status : *400 - Bad request*
+ status : *403 - Not permitted, probably the user is not the chat owner*
+ status : *500 - Internal server error*

Request

    {
        "method" : "DELETE",
        "uri" : "/chats/users",
		"clientID" : "1234567890",
        "params" :
        {
            "chatID" : "2EFD89MKT"
        },
        "body" :
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
    }

Response 200

    {
        "method" : "DELETE",
        "uri" : "/chats/users",
        "status" : "200",
		"clientID" : "1234567890"
    }

Response 400

    {
        "method" : "DELETE",
        "uri" : "/chats/users",
        "status" : "400",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Bad request"
        }
    }

Response 403

    {
        "method" : "DELETE",
        "uri" : "/chats/users",
        "status" : "403",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Not permitted"
        }
    }

Response 500

    {
        "method" : "DELETE",
        "uri" : "/chats/users",
        "status" : "500",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Internal server error"
        }
    }

### Get the list of users in the chat room

**Description**

Gets the list of users in the chat room identified by chatID.

**Possible response status codes**

+ status : *200 - OK*
+ status : *400 - Bad request*
+ status : *404 - ChatID not found*
+ status : *500 - Internal server error*

Request

    {
        "method" : "GET",
        "uri" : "/chats/users",
		"clientID" : "1234567890",
        "params" : 
        {
            "chatID" : "2EFD89MKT"
        }
    }

Response 200

    {
        "method" : "GET",
        "uri" : "/chats/users",
        "status" : "200",
		"clientID" : "1234567890",
        "body" :
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
    }

Response 400

    {
        "method" : "GET",
        "uri" : "/chats/users",
        "status" : "400",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Bad request"
        }
    }

Response 404

    {
        "method" : "GET",
        "uri" : "/chats/users",
        "status" : "404",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "ChatID not found"
        }
    }

Response 500

    {
        "method" : "GET",
        "uri" : "/chats/users",
        "status" : "500",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Internal server error"
        }
    }

### Get chat information

**Description**

Gets the information about the specified chat.

**Possible response status codes**

+ status : *200 - OK*
+ status : *400 - Bad request*
+ status : *401 - Not authorized*
+ status : *404 - ChatID not found*
+ status : *500 - Internal server error*

Request

	{
        "method" : "GET",
        "uri" : "/chats/info",
		"clientID" : "1234567890",
        "params" :
		{
			"chatID" : "2EFD89MKT"
		}
	}

Response 200

	{
        "method" : "GET",
        "uri" : "/chats/info",
		"status" : "200",
		"clientID" : "1234567890",
        "body" :
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
				"usersLimit": "13",
				"usersCount": "10"
			}
		}
	}

Response 400

    {
        "method" : "GET",
        "uri" : "/chats/info",
        "status" : "400",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Bad request"
        }
    }

Response 401

    {
        "method" : "GET",
        "uri" : "/chats/info",
        "status" : "401",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Not authorized"
        }
    }

Response 404

    {
        "method" : "GET",
        "uri" : "/chats/info",
        "status" : "404",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "ChatID not found"
        }
    }

Response 500

    {
        "method" : "GET",
        "uri" : "/chats/info",
        "status" : "500",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Internal server error"
        }
    }

### Set chat information

**Description**

Modifies the information about the specified chat.
Now it is possible only to modify the *chatName* field, modification of any other field will be ignored.

**Possible response status codes**

+ status : *200 - OK*
+ status : *400 - Bad request*
+ status : *401 - Not authorized*
+ status : *403 - Not permitted*
+ status : *500 - Internal server error*

Request

	{
        "method" : "PUT",
        "uri" : "/chats/info",
		"clientID" : "1234567890",
        "params" :
		{
			"chatID" : "2EFD89MKT"
		},
		"body" :
		{
            "chatName" : "New chat description"
		}
	}

Response 200

	{
        "method" : "PUT",
        "uri" : "/chats/info",
		"status" : "200",
		"clientID" : "1234567890"
	}

Response 400

    {
        "method" : "PUT",
        "uri" : "/chats/info",
		"status" : "400",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Bad request"
        }
    }

Response 401

    {
        "method" : "PUT",
        "uri" : "/chats/info",
		"status" : "401",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Not authorized"
        }
    }

Response 403

    {
        "method" : "PUT",
        "uri" : "/chats/info",
		"status" : "403",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Not permitted"
        }
    }

Response 500

    {
        "method" : "PUT",
        "uri" : "/chats/info",
		"status" : "500",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Internal server error"
        }
    }

## User information

### Receive user information

**Description**

Retrieves the user information.

**Possible response status codes**

+ status : *200 - OK*
+ status : *400 - Bad request*
+ status : *401 - Not authorized*
+ status : *500 - Internal server error*

Request

	{
        "method" : "GET",
        "uri" : "/user/info",
		"clientID" : "1234567890"
	}

Response 200

	{
        "method" : "GET",
        "uri" : "/user/info",
		"status" : "200",
		"clientID" : "1234567890",
        "body" :
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
	}

Response 400

	{
        "method" : "GET",
        "uri" : "/user/info",
		"status" : "400",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Bad request"
        }
	}

Response 401

	{
        "method" : "GET",
        "uri" : "/user/info",
		"status" : "401",
		"clientID" : "1234567890",
        "body" :
        {
			"error": "Not authorized"
        }
	}

Response 500

	{
	    "method" : "GET",
	    "uri" : "/user/info",
		"status" : "500",
		"clientID" : "1234567890",
	    "body" :
	    {
			"error": "Internal server error"
	    }
	}

### Set user information

**Description**

Sets the user's information.

**Possible response status codes**

+ status : *200 - OK*
+ status : *400 - Bad request*
+ status : *401 - Not authorized*
+ status : *500 - Internal server error*

Request

	{
        "method" : "PUT",
        "uri" : "/user/info",
		"clientID" : "1234567890",
        "body" :
		{
			"displayName" : "Super User",	... optional
			"avatar" : 			... optional
			{
				"text" : "AB",
				"color" : "#FFAAFF",
				"link" : "https://safechats.com/images/avatar1.png"
			}
		}
	}

Response 200

	{
        "method" : "PUT",
        "uri" : "/user/info",
		"status" : "200",
		"clientID" : "1234567890"
	}

Response 400

	{
        "method" : "PUT",
        "uri" : "/user/info",
		"status" : "400",
		"clientID" : "1234567890",
		"body" :
		{
            "error": "Bad request"
		}
	}

Response 401

	{
        "method" : "PUT",
        "uri" : "/user/info",
		"status" : "401",
		"clientID" : "1234567890",
		"body" :
		{
            "error": "Not authorized"
		}
	}

Response 500

	{
        "method" : "PUT",
        "uri" : "/user/info",
		"status" : "500",
		"clientID" : "1234567890",
		"body" :
		{
            "error": "Internal server error"
		}
	}

## Contact list operations

**Description**
Contact list contains the list of following items:
1) *userID*
2) *displayName*
3) *avatar*
4) *presence/lastSeenOnline* status.

Possible *presence* values:
+ *-1*	: Information about user's last seen online is not available;
+ *0*	: User is currently online;
* *Num*	: User has seen online at time *Num*.

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

### Get contact list

Request

	{
        "method" : "GET",
        "uri" : "/contactlist",
		"clientID" : "1234567890"
	}

Response 200

    {
        "method" : "GET",
        "uri" : "/contactlist",
		"status" : "200",
		"clientID" : "1234567890",
        "body" :
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
	}

Response 401

    {
        "method" : "GET",
        "uri" : "/contactlist",
		"status" : "401",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Not authorized"
        }
    }

Response 500

    {
        "method" : "GET",
        "uri" : "/contactlist",
		"status" : "500",
		"clientID" : "1234567890",
        "body" :
        {
			"error" : "Internal server error"
		}
	}

## Contact-list item operations

### Add users to the contact list

Request

    {
        "method" : "PUT",
        "uri" : "/contactlist/contacts",
		"clientID" : "1234567890",
        "body" :
        {
			"contactsToAdd" :
			[
				"user222@safechats.com",
				"user111@safechats.com"
			]
		}
	}

Response 200

    {
        "method" : "PUT",
        "uri" : "/contactlist/contacts",
		"status" : "200",
		"clientID" : "1234567890",
        "body" :
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
					"presence" : "0"
				}
			],
			"contactsNotFound" :
			[
				"user111@safechats.com"
			],
			"contactsError" :
			[
				"user333@safechats.com"
			]
		}
	}

Response 401

    {
        "method" : "PUT",
        "uri" : "/contactlist/contacts",
		"status" : "401",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Not authorized"
        }
    }


Response 500

    {
        "method" : "PUT",
        "uri" : "/contactlist/contacts",
		"status" : "500",
		"clientID" : "1234567890",
        "body" :
        {
			"error" : "Internal server error"
		}
	}

### Delete users from contact list [DELETE]

Request

    {
        "method" : "DELETE",
        "uri" : "/contactlist/contacts",
		"clientID" : "1234567890",
        "body" :
        {
			"contactsToDelete" :
			[
				"user222@safechats.com",
				"user111@safechats.com"
			]
		}
	}

Response 200

    {
        "method" : "DELETE",
        "uri" : "/contactlist/contacts",
		"status" : "200",
		"clientID" : "1234567890",
        "body" :
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
	}

Response 401

    {
        "method" : "DELETE",
        "uri" : "/contactlist/contacts",
		"status" : "401",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Not authorized"
        }
    }

Response 500

    {
        "method" : "DELETE",
        "uri" : "/contactlist/contacts",
		"status" : "500",
		"clientID" : "1234567890",
        "body" :
        {
			"error" : "Internal server error"
		}
	}


## Contact list customizations interface

**Remarks**
*Passing empty values in *displayName* field removes this field*
*Passing empty *avatar* structure removes avatar info*

### Set customizations [PUT]

Request

    {
        "method" : "PUT",
        "uri" : "/contactlist/customizations",
		"clientID" : "1234567890",
        "body" :
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
	}

Response 200

    {
        "method" : "PUT",
        "uri" : "/contactlist/customizations",
		"status" : "200",
		"clientID" : "1234567890",
        "body" :
        {
			"contactsUpdated":
			[
				"user222@safechats.com"
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
	}

Response 401

    {
        "method" : "PUT",
        "uri" : "/contactlist/customizations",
		"status" : "401",
		"clientID" : "1234567890",
        "body" :
        {
            "error": "Not authorized"
        }
    }


Response 500

    {
        "method" : "PUT",
        "uri" : "/contactlist/customizations",
		"status" : "500",
		"clientID" : "1234567890",
        "body" :
        {
			"error" : "Internal server error"
		}
	}

## Messaging API

###Incoming messages

**Description**
When a message is being delivered, a data block with the following structure arrives:

    {
        "method" : "GET",
        "uri" : "/messages",
        "body" :
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
                        "messageIDStatus": "20394cd7c3b248ac5c3bca651",
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
                    },
                    {
                        "messageID": "d97686706eb390250af964b10395",
                        "subType": "chat_leave",
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
    }

**Possible info subTypes**

+ chat_enter : *somebody or a group of users entered the chat*
+ chat_leave : *somebody or a group of users left the chat*

**Remarks**

The output described above does not include status and clientID fields. 

### Post a message

**Description**

This function could send a message or a status to the chat. It allows sending several messages at a time; however, the caller _should_ supply a *clientHash* parameter to identify each sent message or status in output.

**Possible response status codes**

+ status : *200 - OK*
+ status : *400 - Bad request*
+ status : *403 - Incorrect signature*
+ status : *404 - chatID was not found (or recipient was not found in a chat)*
+ status : *409 - Time is not set correctly on a user device*
+ status : *500 - Internal server error*

Request

    {
        "method" : "POST",
        "uri" : "/messages",
		"clientID" : "1234567890",
        "body" : 
        {
            "outgoingEvents":
            {
              "messages":
              [
                {
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
                }
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
    }

Response 200

    {
        "method" : "POST",
        "uri" : "/messages",
        "status" : "200",
		"clientID" : "1234567890",
        "body":
        {
            "outgoingEventsResult":
            {
				"messages":
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
				"statuses":
				[
					"2234567890abcdeb",
					"2234567890abcdef"
				]
            },
            "sign": "9ddd617a08486638a5d05692ae7f022fa0c632abdacb3041c4b0da91ee0cb73e2a48954fc601f96fdcaa6483c2baed98533ad946513588130ef8356d6c7bdf46",
        }
    }

Response 400

    {
        "method" : "POST",
        "uri" : "/messages",
        "status" : "400",
		"clientID" : "1234567890",
        "body":
        {
            "error": "Bad request"
        }
    }

Response 401

    {
        "method" : "POST",
        "uri" : "/messages",
        "status" : "401",
		"clientID" : "1234567890",
        "body":
        {
            "error": "Not authorized"
        }
    }

Response 403

    {
        "method" : "POST",
        "uri" : "/messages",
        "status" : "403",
		"clientID" : "1234567890",
        "body":
        {
            "error": "Bad signature"
        }
    }

Response 404

    {
        "method" : "POST",
        "uri" : "/messages",
        "status" : "404",
		"clientID" : "1234567890",
        "body":
        {
            "error": "chatID is not valid"
        }
    }

Response 409

    {
        "method" : "POST",
        "uri" : "/messages",
        "status" : "409",
		"clientID" : "1234567890",
        "body":
        {
            "error": "Time is not set correctly on a user device"
        }
    }

Response 500

    {
        "method" : "POST",
        "uri" : "/messages",
        "status" : "500",
		"clientID" : "1234567890",
        "body":
        {
            "error": "Internal server error"
        }
    }


## Misc functions

### Get amazon credentials for chat

**Possible response status codes**

+ status : *200 - OK*
+ status : *400 - Bad request*
+ status : *401 - Not authorized*
+ status : *409 - Conflict*
+ status : *500 - Internal server error*

Request

	    {
	        "method" : "GET",
	        "uri" : "/amazonCredentials",
			"clientID" : "1234567890",
	        "params" : 
	        {
	            "chatID": "1234567890"
			}
		}

Response 200

		{
	        "method" : "GET",
	        "uri" : "/amazonCredentials",
			"clientID" : "1234567890",
			"status" : "200",
			"body" :
			{
				"credentials":
				{
		        	"accessID" : "1224157698561287461289",
		        	"secretID" : "1249861598126497521387216376127836",
		        	"sessionToken" : "128946128946129874097832674364374673746"
				}
			}
		}