var parser = require('xml2json');
var fs = require('fs');
var pd = require('pretty-data').pd;
var log = require('./logger');

object2xml = function(manifestObject) {
	var project;
	var external = {};
	external.project = [];

	var length = manifestObject.manifest.project.length;
	for (i = 0; i < length; i++) {
		project = manifestObject.manifest.project[i];
		if (project.external) {
			delete project.external;
			delete project.path;
			external.project.push(project);
			manifestObject.manifest.project[i] = undefined;
		}
	}

	if (external.project.length > 0) {
		manifestObject.manifest.external = external;

		// Cleanup main project array
		for (i = length; i > 0; i--) {
			if (manifestObject.manifest.project[i] == undefined) {
				manifestObject.manifest.project.splice(i, 1);
			}
		}
	}

	return pd.xml(parser.toXml(manifestObject));
}
exports.object2xml = object2xml;

xml2object = function(xml) {
	// Send a method response with a value
	var json = parser.toJson(xml, {reversible: true});
	var manifestObject = JSON.parse(json);

	var length = manifestObject.manifest.project.length;
	for (i = 0; i < length; i++) {
		project = manifestObject.manifest.project[i];
		delete project.groups;
	}

	return manifestObject;
}
exports.xml2object = xml2object;


exports.readObject = function(path, file, callback) {
	fs.readFile(path + file, function(err, data){
		if(err) {
			log.error("Could not open file: " + err);
			callback(err, undefined);
		}
		// Send a method response with a value
		var json = parser.toJson(data.toString(), {reversible: true});
		var manifestObject = JSON.parse(json);

		if (manifestObject.manifest.external) {
			while (manifestObject.manifest.external.project.length > 0) {
				var project = manifestObject.manifest.external.project.shift();
				project.external = true;
				project.path = 'N/A';
				manifestObject.manifest.project.push(project);
			}
		}

		callback(err, manifestObject);
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
