var fs = require('fs');

var configfile = process.argv[2] || 'config.json';

try {
	data = fs.readFileSync(configfile);
}
catch(err) {
	console.log('Error opening config file: ' + err);
	return;
}


module.exports = JSON.parse(data);

