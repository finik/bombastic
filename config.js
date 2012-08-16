var cjson = require('cjson');
var configfile = process.argv[2] || 'config.json';

module.exports = cjson.load(configfile);

