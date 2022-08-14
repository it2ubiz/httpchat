
var keys = require("./keys.js");

// Set this flag to true to regenerate the server's private key even if it exists
var reCreateFlag = false; // <-- HERE

// perform key generation if needed
keys.InitializeKeys(reCreateFlag);
