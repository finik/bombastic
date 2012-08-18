requirejs.config({
	shim: {
		'bootstrap': {
			deps: ['jquery'],
			exports: 'bootstrap'
		},
		'underscore': {
			exports: '_'
		},
		'backbone': {
			exports: 'Backbone',
			deps: ['underscore']

		}
	},
	paths: {
		'underscore'    : 'libs/underscore-min',
		'backbone'      : 'libs/backbone-min',
		'jquery'        : 'libs/jquery.min',
		'bootstrap'     : 'libs/bootstrap/bootstrap',
		'text'          : 'libs/text'
	}
});

define(function(require) {
	var _ = require('underscore');
	var $ = require('jquery');
	var Backbone = require('backbone');
	var Queue = require('collections/queue');
	var PendingQueueView = require('views/pendingQueue');
	var ProcessedQueueView = require('views/processedQueue');
	require('bootstrap');

	$(function() {

		var pendingQueue = new Queue({
			url: '/api/requests'
		});
		pendingQueue.fetch({success: function(pendingQueue, response){
			var pendingQueueView = new PendingQueueView({
				collection: pendingQueue,
				el: '#pending-queue',
				remove: function(request) {
					request.destroy();
				},
				approve: function(request) {
					request.save();
				}
			});
		}});

		var processedQueue = new Queue({
			url: '/api/requests?pending=false&limit=10'
		});
		processedQueue.fetch({success: function(processedQueue, response){
			var processedQueueView = new ProcessedQueueView({
				collection: processedQueue,
				el: '#processed-queue',
				resubmit: function(request) {
					alert('resubmit');
				}
			});
		}});

		$('a.logout').click(function() {
			$this = $(this);
			$.post('/api/logout', {}, function(data) {
				document.location.href = '/';
			});
		});

		$('select#project').change(function() {
			$this = $(this);
			project = $this.val();
			$.post('/api/project', {project: project}, function(data) {
				if (data.success) {
					document.location.href = '/';
				} else {
					alert('Something went wrong, server returned error');
				}
			});
		});
	});
});






