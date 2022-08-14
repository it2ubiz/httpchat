
// timestamp is expected to be as a Number value, e.g. 1446393492786
exports.checkLocalTime = function(timeStamp)
{
	var result = false;
	
	var d = new Date().valueOf();
	
	// if the difference is more than 5 mins - 
	if (Math.abs(d - timeStamp) < 300000)
	{
		// timestamp is valid
		result = true;
	}
	
	return (result);
};