var LdapAuth = require('ldapauth');
var log = require('./logger');
var config = require('./config');

exports.authenticate = function(login, password, callback) {
	var auth = new LdapAuth(config.ldap);
	auth.authenticate(login, password, function(err, user) {
		if (err) {
			log.error("LDAP auth error: " + err);
		} else {
			log.info('Logged in as: ' + user.fullName + ' ' + user.mail);
		}
		callback(err, user);
	});
}





