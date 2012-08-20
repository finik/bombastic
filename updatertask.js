var log = require('./logger');
var config = require('./config');
var jenkins = require('./jenkins');
var workqueue = require('./workqueue');
var manifest = require('./manifest');
var git = require('./git');

commit = function(project, id, request, callback) {
	manifest.readObject(project.manifestPath, project.manifestFile, function(err, data){
		if(err) {
			log.error("Could not open file: " + err);
			return;
		}

		if (true === manifest.applyChanges(data, request)) {
			manifest.writeObject(project.manifestPath, project.manifestFile, data, function() {
				git.commit(project.manifestPath, request.author, request.message, function() {
					callback();
				});
			});
		}
	});
};

handleApproved = function(project, id, request) {
	// Now try to commit it
	log.info('Trying to commit manifest change ' + id);
	commit(project, id, request, function() {
		request.pending = false;
		request.status = 'commited';
		workqueue.updateRecord(id, request);
	});
}

update = function(project, id, request, build, workqueue) {
	var hasChanged = false;
	if (undefined === request.job) {
		log.info('Build started for: ' + id + ' > ' + build.url);
		// First time we see that job on jenkins, lets gather some data
		var job = {};
		job.number = build.number;
		job.url = build.url;
		request.job = job;
	}

	if (build.building) {
		if (request.status != 'testing') {
			log.info('Build '+ id +' changed status to [testing]');
			hasChanged = true;
			request.status = 'testing';
		}
	} else {
		if (build.result == 'SUCCESS' && request.status != 'approved') {
			log.info('Build ' + id + ' changed status to [approved]');
			hasChanged = true;
			request.status = 'approved';
		} else if (build.result != 'SUCCESS' && request.status != 'failed') {
			log.info('Build ' + id + ' changed status to [failed]');
			hasChanged = true;
			request.pending = false;
			request.status = 'failed';
		}
	}

	if (request.status == 'approved') {
		handleApproved(project, id, request);
	} else {
		workqueue.updateRecord(id, request);
	}
};


updaterTask = function(project, timeout) {
	workqueue.getQueue(project.name, true, 100, function(err, pending) {
		if (err) {
			log.error('Error getting pending list');
		} else if (pending.length > 0) {
			for (m in pending) {
				request = pending[m];

				if (request.status == 'approved') {
					handleApproved(project, request._id.toString(), request);
				}
			}
			jenkins.job(project.job, function(err, data) {
				if (err) {
					log.error('Error getting build list');
				}
				else {
					for (n in data.builds) {
						var build = data.builds[n];
						var params = build.actions[0].parameters;
						var id;
						for (pair in params) {
							if (params[pair].name === 'BOMBASTIC_ID') {
								id = params[pair].value;
							}
						}

						for (m in pending) {
							request = pending[m];

							if (request._id == id) {
								update(project, id, request, build, workqueue);
							}
						}
					}
				}
			});
		}
	});

	setTimeout(function() {
		updaterTask(project, timeout);
	}, timeout*1000);
};

exports.init = function(project) {
	var timeout = project.timeout || 10;
	log.info('Starting updatertask for project: ' + project.name + ' interval: ' + timeout + 's');
	updaterTask(project, timeout);
};
