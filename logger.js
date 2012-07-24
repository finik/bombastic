var config = require('./config');
var winston = require('winston');

winston.add(winston.transports.File, { filename: config.logging.file });

module.exports = winston;
