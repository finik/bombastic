var _ = require('underscore');
var express = require('express');
var request = require('request');
var app = express.createServer();
var git = require('./git');
var workqueue = require('./workqueue');
var manifest = require('./manifest');
var ldap = require('./ldap');
var jenkins = require('./jenkins');
var updatertask = require('./updatertask');
var config = require('./config');
var log = require('./logger');

exports.init = function() {

	workqueue.init(function(err) {
		if (err) {
			log.error('Error initializing workqueue');
			return false;
		}

		_.each(config.projects, function(project) {
			updatertask.init(project);
		});

		return true;
	});



	app.configure(function(){
		app.set('views', __dirname + '/views');
		app.set('view engine', 'ejs');
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.static(__dirname + '/static'));
		app.use(express.cookieParser());
		app.use(express.session({ secret: "bombastic" }));
		app.enable("jsonp callback");
	});

	app.configure('development', function(){
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
		// app.use(express.logger({ format: ':method :url' }));
	});

	app.configure('production', function(){
		app.use(express.errorHandler());
	});

	app.error(function(err, req, res, next){
		res.render('500.ejs', { locals: { error: err },status: 500 });
	});

	app.get('/', function(req, res) {
		if (undefined === req.session.user) {
			if (undefined === config.ldap) {
				req.session.user = {
					fullName : "Anonymous Coward",
					mail : "dummy@example.com",
					admin: true
				};
				req.session.project = config.projects[Object.keys(config.projects)[0]];
			} else {
				log.info('Need to log in, redirect to /login');
				res.redirect('/login');
				return;
			}
		}

		res.render('queue', {
			title: config.title,
			user: {
				name: req.session.user.fullName,
				email: req.session.user.mail,
				admin: (req.session.project.admins.indexOf(req.session.user.mail) != -1)},
			projects: config.projects,
			current: req.session.project.name
		});
	});

	app.get('/login', function(req, res) {
		if (undefined !== req.session.user) {
			log.info('Already logged in, redirect to /');
			res.redirect('/');
			return;
		}

		res.render('login', {
			title: config.title
		});
	});

	app.get('/submit', function(req, res){
		if (undefined === req.session.user) {
			if (undefined === config.ldap) {
				req.session.user = {
					fullName : "Anonymous Coward",
					mail : "dummy@example.com",
					admin: true
				};
				req.session.project = config.projects[_.keys(config.projects)[0]];
			} else {
				log.info('Need to log in, redirect to /login');
				res.redirect('/login');
				return;
			}
		}

		git.head(req.session.project.manifestPath, function(commit) {
			res.render('submit', {
						title: config.title,
						user: {
							name: req.session.user.fullName,
							email: req.session.user.mail,
							admin: (req.session.project.admins.indexOf(req.session.user.mail) != -1)},
						commit: commit,
						projects: config.projects,
						current: req.session.project.name,
			});
		});
	});

	///////////////////////////////////////////////////////
	// Session APIs
	///////////////////////////////////////////////////////
	app.post('/api/login', function(req, res){
		var login = req.body.login;
		var password = req.body.password;
		ldap.authenticate(login, password, function(err, user) {
			if (err) {
				res.json({success: false});
			} else {
				req.session.user = user;
				req.session.project = config.projects[Object.keys(config.projects)[0]];

				res.json({success: true});
			}
		});
	});

	app.post('/api/logout', function(req, res){
		req.session.user = undefined;
		res.json({success: true});
	});

	///////////////////////////////////////////////////////
	// /api/requests/*
	///////////////////////////////////////////////////////

	// Get
	app.get('/api/requests', function(req, res){
		var pending = true;
		var limit = 0;
		if (req.query.pending) {
			pending = (req.query.pending === 'true');
		}
		if (req.query.limit) {
			limit = parseInt(req.query.limit);
		}
		workqueue.getQueue(req.session.project.name, pending, limit, function(err, queue) {
			if (err) {
				res.json({success: false});
			} else {
				res.json(queue);
			}
		});
	});

	// Create
	app.post('/api/requests', function(req, res){
		if (undefined === req.session.user) {
			log.error('Illegal submit request, no active user!');
			res.json({success: false});
		}

		request = req.body;
		request.pending = true;
		request.status = 'waiting';
		request.author = {};
		request.author.name = req.session.user.fullName;
		request.author.email = req.session.user.mail;
		request.project = req.session.project.name;
		workqueue.schedule(request, function(err, id) {
			jenkins.build(req.session.project.job, {BOMBASTIC_ID: id}, function(err, result) {
				request.id = id;
				res.json(request);
			});
		});
	});

	// Delete
	app.del('/api/requests/:id', function(req, res){
		if (undefined === req.session.user) {
			log.error('Unauthorized DELETE access to /api/requests/:id');
			res.json({success: false});
		}
		log.warn('Deleting ' + req.params.id);
		workqueue.delete(req.params.id, function(err) {
			res.json({success: true});
		});
	});

	// Approve (modify)
	app.put('/api/requests/:id', function(req, res){
		if (undefined === req.session.user) {
			log.error('Unauthorized POST access to /api/approve');
			res.json({success: false});
		}
		id = req.params.id;
		log.warn('Force approving ' + id);
		workqueue.get(id, function(err, request){
			if (request === undefined) {
				log.error("Can not find change %d", id);
				return;
			}
			else {
				var job = {};
				job.name = 'Manual override';
				job.number = 0;
				job.url = '';
				request.job = job;
				request.status = 'approved';
				workqueue.updateRecord(id, request);
				res.json({success: true});
			}

		});
	});

	// Create (clone)
	app.post('/api/resubmit', function(req, res){
		if (undefined === req.session.user) {
			log.error('Illegal submit request, no active user!');
			res.json({success: false});
		}
		workqueue.get(req.body.id, function(err, request) {
			if (request === undefined) {
				log.error("Can not find change %d", req.params.id);
				return;
			}
			// Resubmit the exact same request, reset id, state and author
			delete request._id;
			delete request.job;
			request.pending = true;
			request.status = 'waiting';
			request.author.name = req.session.user.fullName;
			request.author.email = req.session.user.mail;
			workqueue.schedule(request, function(err, id) {
				jenkins.build(req.session.project.job, {BOMBASTIC_ID: id}, function(err, result) {
					res.json({success: true});
				});
			});
		});
	});

	app.get('/api/projects', function(req, res){
		var project = req.session.project;
		manifest.readObject(project.manifestPath, project.manifestFile, function(err, data){
			if(err) {
				log.error("Could not open file: " + err);
				res.json({success: false});
				return;
			}

			res.json(data.manifest.project);
		});
	});

	///////////////////////////////////////////////////////
	// /api/changes/*
	///////////////////////////////////////////////////////
	app.get('/api/changes', function(req, res) {
		if (undefined !== req.session.changes) {
			var keys = Object.keys(req.session.changes);
			var values = keys.map(function(v) { return req.session.changes[v]; });
			res.json(values);
		} else {
			res.json([]);
		}
	});

	app.del('/api/changes/:id', function(req, res){
		log.warn('Deleting change ' + req.params.id);
		if (undefined !== req.session.changes[req.params.id]) {
			req.session.changes[req.params.id] = undefined;
			delete req.session.changes[req.params.id];
			res.json({success: true});
		}
	});

	app.post('/api/changes', function(req, res) {
		req.body.id = require('crypto').createHash('md5').update(req.body.project.name).digest("hex");
		if (undefined === req.session.changes) {
			req.session.changes = {};
		}
		req.session.changes[req.body.id] = req.body;
		res.json(req.body);
	});

	///////////////////////////////////////////////////////
	// MISC
	///////////////////////////////////////////////////////
	app.get('/api/get/:id', function(req, res){
		// This doesn't have a session associated with it,
		// it can't rely on any session variables, only on
		// data that came with the request itself.
		log.info('Someone is fetching a fresh manifest with changes from ' + req.params.id);
		workqueue.get(req.params.id, function(err, request) {
			if (request === undefined) {
				log.error("Can not find change %d", req.params.id);
				return;
			}

			var project = config.projects[request.project];

			manifest.readObject(project.manifestPath, project.manifestFile, function(err, data){
				if(err) {
					log.error("Could not open file: " + err);
					return;
				}

				if (true === manifest.applyChanges(data, request)) {
					// Convert back to xml and send
					res.header('Content-Type', 'text/xml');
					res.send(manifest.object2xml(data));
				}
			});
		});
	});

	app.get('/api/clean', function(req, res){
		// This doesn't have a session associated with it,
		// it can't rely on any session variables, only on
		// data that came with the request itself.
		log.info('Someone is fetching a clean version of ' + req.query.url);
		request({
			method: 'get',
			uri: req.query.url,
			qs: {}
		}, function (err, result) {
			if (err) {
				log.err('Can not retrieve ' + req.query.url);
			} else {
				data = manifest.xml2object(result.body);
				// Convert back to xml and send
				res.header('Content-Type', 'text/xml');
				res.send(manifest.object2xml(data));
			}
		});
	});

	app.post('/api/project', function(req, res) {
		if (undefined === req.session.user) {
			log.error('Unauthorized POST access to /api/project');
			res.json({success: false});
		}

		req.session.project = config.projects[req.body.project];
		res.json({success: true});
	});

	/* The 404 Route (ALWAYS Keep this as the last route) */
	app.get('/*', function(req, res){
		res.render('404.ejs', {
			title: config.title
		});
	});

	app.listen(config.port);

	log.info("Starting on port " + app.address().port);

	return app;
};
