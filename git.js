var exec = require('child_process').exec;
var temp = require('temp');
var fs = require('fs');
var log = require('./logger');

exports.head = function (path, callback) {
	exec('git --git-dir=' + path + ".git log -1 --pretty=format:'%H%n%an <%ae>%n%ad%n%s%n'", function(err, stdout, stderr) {
		var str = stdout.split('\n');
		var commit = {
			commit: str[0],
			author: str[1],
			date: str[2],
			message: str[3]
		};
		callback(err, commit);
	});
};

exports.get = function(path, file, revision, callback) {
	exec('git --git-dir=' + path + ".git show "+revision+":"+file, function(err, stdout, stderr) {
		callback(err, stdout);
	});
}

exports.commit = function (path, author, message, callback) {
	temp.open('bombastic', function(err, info) {
		if (err) {
			log.error("Can't create temporaty file " + info.path);
			callback();
		}

		log.debug('Write commit message into temporary file ' + info.path);
		fs.write(info.fd, message);
		fs.close(info.fd, function(err) {
			var command = [__dirname + '/scripts/commit.sh ',
				path,
				'  "',
				author.name,
				' <',
				author.email,
				'> " "',
				info.path,
				'"'].join('');

			exec(command, function(error, stdout, stderr) {
				log.debug(stdout);
				callback();
			});
		});

	});
};
