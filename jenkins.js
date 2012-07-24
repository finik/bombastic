var request = require('request');
var config = require('./config');
var log = require('./logger');

/** internal
 * jenkins#_http(method, url, handlers, cb)
 * - method (String): http method
 * - url (String): Jenkins URL without query string
 * - qs (Object): object containing URL query strings with format { name: value }
 * - handlers (Object): response handlers with format { statuscode: handlerfunction }
 * - cb (Function): standard cb(err, result) callback
 *
 * Sends a HTTP request to a Jenkins URL and handle the following errors:
 * - request error
 * - authentication error
 * - unexpected status error
 **/
function _http(method, url, queryStrings, handlers, cb) {
	request({
		method: method,
		uri: url,
		qs: queryStrings
	}, function (err, result) {
		if (err) {
			cb(err);
		} else if (result.statusCode === 401) {
			cb(new Error('Authentication failed - incorrect username and/or password in JENKINS_URL'));
		} else if (result.statusCode === 403) {
			cb(new Error('Jenkins requires authentication - set username and password in JENKINS_URL'));
		} else if (handlers[result.statusCode]) {
			handlers[result.statusCode](result);
		} else {
			cb(new Error('Unexpected status code ' + result.statusCode + ' from Jenkins\nResponse body:\n' + result.body));
		}
	});
}

var build = function (jobName, params, cb) {

	function _success(result) {
		log.info('Job scheduled successfully');
		cb(null);
	}

	function _notFound(result) {
		log.error('Jenkins: job not found!');
		cb(new Error('Job ' + jobName + ' does not exist'));
	}

	function _notAllowed(result) {
		log.error('Jenkins: permission denied!');
		cb(new Error('Job ' + jobName + ' requires build parameters'));
	}

	var json = {parameter: []};

	for (param in params) {
		json.parameter.push({ name: param, value: params[param] });
	}

	log.info('Scheduling jenkins job: ' + jobName + ' params: ' + JSON.stringify(json));

	_http('post', config.jenkins.url + '/job/' + jobName + '/build',
		{ token: 'bombastic',
			json: JSON.stringify(json)
		},
		{ 200: _success,
			404: _notFound,
			405: _notAllowed
		}, cb);
};

var job = function (name, cb) {

	function _success(result) {
		var data = JSON.parse(result.body);
		cb(null, data);
	}

	function _notFound(result) {
		cb(new Error('Job ' + name + ' does not exist'));
	}

	_http('get', config.jenkins.url + '/job/' + name + '/api/json?depth=1', {}, { 200: _success, 404: _notFound }, cb);
};

exports.job = job;
exports.build = build;