var config = require('./config');
var mongo = require('mongodb'),
  Server = mongo.Server,
  Db = mongo.Db,
  ObjectID = require('mongodb').ObjectID;
var log = require('./logger');

var server;
var db;
var queue;

exports.init = function(callback) {
	server = new Server(config.mongodb.host, parseInt(config.mongodb.port), {auto_reconnect: true});
	db = new Db(config.mongodb.database, server);

	db.open(function(err, db) {
		if(!err) {
			log.info("We are connected to mongodb");

			// Creating queue collection if it doesn't exist yet
			db.createCollection('queue', function(err, collection) {
				queue = collection;
				callback(err);
				return true;
			});
		}
	});

	return false;
};

exports.schedule = function(request, callback) {
	request.date = new Date();
	queue.insert(request, function(err, result) {
		callback(err, result[0]._id);
	});
};

exports.getQueue = function(project_id, pending, limit, callback) {
	queue.find({pending: pending, project: project_id}).sort({date: -1}).limit(limit).toArray(function(err, queue) {
		callback(err, queue);
	});
};

exports.get = function(id, callback) {
	queue.findOne({_id: new ObjectID(id)}, function(err, doc) {
		callback(err, doc);
	});
};

exports.delete = function(id, callback) {
	queue.remove({_id: new ObjectID(id)}, {safe:true}, function(err, number) {
		log.warn('Deleting ' + id);
		callback(err);
	});
};

exports.updateRecord = function(id, request) {
	queue.update({_id: new ObjectID(id)}, request);
}