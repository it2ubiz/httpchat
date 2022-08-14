# SafeChats Communication Platform Backend API 

## Users management [/backend/users/{:userID}]

### Create a new user [PUT]

Creates a user.

**Request body**

**password** – a password for the user being created
**displayName** - a name (string), describing the user being created

**Possible response status codes**

+ 200 - OK
+ 400 - Bad request
+ 500 - Internal server error

+ Request (application/json)

	+ Parameters
	
			{
				"userID" : "user111@safechats.com"
			}

    + Body

            {
                "password": "12344567ascavenv",
				"displayName" : "super user!"
            }

+ Response 200 (application/json)

+ Response 400 (application/json)

    + Body

            {
                "error": "Bad request"
            }

+ Response 500

    + Body

            {
                "error": "Internal server error"
            }

### Delete a user [DELETE]

Deletes a user.

**Request body**

**password** – a password for the user being deleted
**displayName** - a name (string), describing the user being deleted

**Possible response status codes**

+ 200 - OK
+ 400 - Bad request
+ 500 - Internal server error

+ Request (application/json)

	+ Parameters
	
			{
				"userID" : "user111@safechats.com"
			}

+ Response 200 (application/json)

+ Response 400 (application/json)

    + Body

            {
                "error": "Bad request"
            }

+ Response 500

    + Body

            {
                "error": "Internal server error"
            }
