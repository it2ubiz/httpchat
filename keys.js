
var fs = require ("fs");
var crypto = require('crypto');
var nodeRSA = require('node-rsa');
var fs = require('fs');

try {
    var config = require('./config.js');
} catch (ex) {
    var config = require('./config.dist.js');
}

exports.pubServerKey = [];
exports.prvServerKey = [];

exports.ReadKey = function()
{
	if( fs.existsSync(config.serverKeyDirectory + '/ServerPublicKey.json') )
	{
        exports.pubserverKey = JSON.parse(fs.readFileSync(config.serverKeyDirectory + '/ServerPublicKey.json'));

		if( fs.existsSync(config.serverKeyDirectory + '/ServerPrivateKey.json') )
		{
			var key = JSON.parse(fs.readFileSync(config.serverKeyDirectory + '/ServerPrivateKey.json'));
			rsa = new nodeRSA();
			rsa.importKey(key);
			exports.prvServerKey = rsa.exportKey();

			return (true);
		}
	}

	return (false);
}

exports.SaveKey = function()
{
	fs.writeFileSync(
        config.serverKeyDirectory + '/ServerPublicKey.json',
        JSON.stringify(exports.pubServerKey)
    );

	fs.writeFileSync(
        config.serverKeyDirectory + '/ServerPrivateKey.json',
        JSON.stringify(exports.prvServerKey)
    );
}

exports.GenKey = function()
{
	var serverKey = new nodeRSA( {b: 2048} );

	exports.pubServerKey = serverKey.exportKey("public");
	exports.prvServerKey = serverKey.exportKey();
}

exports.InitializeKeys = function(forceReCreate, silent)
{
	if( (forceReCreate == false) && exports.ReadKey() )
  {
      // There is a private key already
      // reCreateFlag in genkeys.js is not set to True to create a new one
      // Doing nothing
      if( (silent == undefined) || (silent == false) )
      {
        console.log("There is a private key already and reCreateFlag is set to FALSE.");
        console.log("Not doing anything");
      }
  }

	// try to read the private key
	if (forceReCreate == true || !exports.ReadKey())
	{
		console.log("Generating a new private server key...");
		exports.GenKey();
		exports.SaveKey();
		console.log("Done");
	}
}
