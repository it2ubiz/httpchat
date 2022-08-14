var util = require('util');
var cluster = require('cluster');

var numCPUs = require('os').cpus().length;

function formatArgs(args){
	var date = new Date().toISOString().slice(0, 19) + 'Z';
	return ["[" + date + "] " + util.format.apply(util.format, Array.prototype.slice.call(args))];
}

["log", "warn", "error"].forEach(function(method) {
    var oldMethod = console[method].bind(console);
    console[method] = function() {

        oldMethod.apply(
            console,
	    formatArgs(arguments)
        );
    };
});

// Still launch the webserver so "monit" can check and see that the server is alive

if (cluster.isMaster)
{
	// Fork workers.
    for (var i = 0; i < numCPUs; i++)
    {
      cluster.fork();
    }
}
else
{
	var server = require('./server-code.js');
	var app = server(process.env.PORT || 3000);

	if( process.env.appType && (process.env.appType == "loadTest") )
	{
		console.log("Launching load test...");
		var loadTest = require("./demo-load-test/demo-load-test.js");
	}
}
