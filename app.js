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

	workqueue.init();

	for (project_id in config.projects) {
		updatertask.init(config.projects[project_id]);
	}

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
		if (undefined == req.session.user) {
			log.info('Need to log in, redirect to /login');
			res.redirect('/login');
			return;
		}

		workqueue.getQueue(req.session.project.name, function(pending, processed) {
			res.render('queue', {
				title: config.title,
				user: {name: req.session.user.fullName, email: req.session.user.mail},
				projects: config.projects,
				current: req.session.project.name,
				pending: pending,
				processed: processed
			});
		});

	});

	app.get('/login', function(req, res) {
		if (undefined != req.session.user) {
			log.info('Already logged in, redirect to /');
			res.redirect('/');
			return;
		}

		res.render('login', {
			title: config.title,
		});
	});

	app.get('/submit', function(req, res){
		if (undefined == req.session.user) {
			log.info('Need to log in, redirect to /logn');
			res.redirect('/login');
			return;
		}

		git.head(req.session.project.manifestPath, function(commit) {
			manifest.readObject(req.session.project.manifestPath, req.session.project.manifestFile, function(err, data){
				if(err) {
					log.error("Could not read manifest: " + err);
				}

				res.render('submit', {
							title: config.title,
							user: {name: req.session.user.fullName, email: req.session.user.mail},
							commit: commit,
							projects: config.projects,
							current: req.session.project.name,
							manifest: data
				});
			});
		});
	});

	app.post('/api/login', function(req, res){
		var login = req.body.login;
		var password = req.body.password;
		ldap.authenticate(login, password, function(err, user) {
			if (err) {
				res.json({success: false});
			} else {
				req.session.user = user;
				for (project in config.projects) {
					req.session.project = config.projects[project];
					break;
				}

				res.json({success: true});
			}
		});
	});

	app.post('/api/logout', function(req, res){
		req.session.user = undefined;
		res.json({success: true});
	});

	app.post('/api/submit', function(req, res){
		if (undefined == req.session.user) {
			log.error('Illegal submit request, no active user!');
			res.json({success: false});
		}

		request = req.body.request;
		request.pending = true;
		request.status = 'waiting';
		request.author = {};
		request.author.name = req.session.user.fullName;
		request.author.email = req.session.user.mail;
		request.project = req.session.project.name;
		workqueue.schedule(request, function(err, id) {
			jenkins.build(req.session.project.job, {BOMBASTIC_ID: id}, function(err, result) {
				res.json({success: true});
			});
		});
	});

	app.post('/api/resubmit', function(req, res){
		if (undefined == req.session.user) {
			log.error('Illegal submit request, no active user!');
			res.json({success: false});
		}
		workqueue.get(req.body.id, function(err, request) {
			if (request == undefined) {
				log.error("Can not find change %d", req.params.id);
				return;
			}
			// Resubmit the exact same request, reset id, state and author
			delete request._id;
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


	app.post('/api/delete', function(req, res){
		if (undefined == req.session.user) {
			log.error('Unauthorized POST access to /api/delete');
			res.json({success: false});
		}
		log.warn('Deleting ' + req.params.id);
		workqueue.delete(req.body.id, function(err) {
			 res.json({success: true});
		 });
	});

	app.get('/api/get/:id', function(req, res){
		// This doesn't have a session associated with it,
		// it can't rely on any session variables, only on
		// data that came with the request itself.
		log.info('Someone is fetching a fresh manifest with changes from ' + req.params.id);
		workqueue.get(req.params.id, function(err, request) {
			if (request == undefined) {
				log.error("Can not find change %d", req.params.id);
				return;
			}

			var project = config.projects[request.project];

			manifest.readObject(project.manifestPath, project.manifestFile, function(err, data){
				if(err) {
					log.error("Could not open file: " + err);
					return;
				}

				if (true == manifest.applyChanges(data, request)) {
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

	app.post('/api/approve', function(req, res){
		if (undefined == req.session.user) {
			log.error('Unauthorized POST access to /api/approve');
			res.json({success: false});
		}
		id = req.body.id;
		log.warn('Force approving ' + id);
		workqueue.get(id, function(err, request){
			if (request == undefined) {
				log.error("Can not find change %d", id);
				return;
			}
			else {
				commit(id, request, function(err) {
					var job = {};
					job.name = 'Manual force';
					job.number = 0;
					job.url = '';
					request.job = job;
					request.pending = false;
					request.status = 'approved';
					workqueue.updateRecord(id, request);
					res.json({success: true});
				});
			}

		});
	});

	app.post('/api/project', function(req, res) {
		if (undefined == req.session.user) {
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
}
