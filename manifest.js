var parser = require('xml2json');
var fs = require('fs');
var pd = require('pretty-data').pd;
var log = require('./logger');

object2xml = function(data) {
	return pd.xml(parser.toXml(data));
}
exports.object2xml = object2xml;


exports.readObject = function(path, file, callback) {
	fs.readFile(path + file, function(err, data){
		if(err) {
			log.error("Could not open file: " + err);
			callback(err, undefined);
		}
		// Send a method response with a value
		var json = parser.toJson(data.toString(), {reversible: true});
		callback(err, JSON.parse(json));
	});
}

exports.writeObject = function(path, file, data, callback) {

	fs.writeFile(path + file, object2xml(data), function(err){
		callback(err);
	});
}

exports.applyChanges = function (manifest, request) {
	var projects = manifest.manifest.project;

	// Modify
	for (i in request.changes) {
		change = request.changes[i];
		switch (change.action) {
			case "Add":
				// TODO: error checking, does it already exist?
				project = {};
				project.name = change.name;
				project.path = change.path;
				project.groups = change.groups;
				project.revision = change.revision;
				project.remote = change.remote;
				projects.push(project);
			break;

			case "Remove":
				// TODO: Error checking, is it really removing anything?
				projects = projects.filter(function(v) { return v.name == change.name ? false : true;});
				manifest.manifest.project = projects;
			break;

			case "Modify":
				for (j in projects) {
					project = projects[j];
					if (change.name == project.name) {
						project.path = change.path;
						project.groups = change.groups;
						project.revision = change.revision;
						project.remote = change.remote;
					}
				}
			break;

			default:
				log.error("Unknown change action: " + change.action);
				return false;
			break;
		}

	}

	return true;

}
