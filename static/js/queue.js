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
				el: '#pending-queue'
			});
		}});

		var processedQueue = new Queue({
			url: '/api/requests?pending=false&limit=10'
		});
		processedQueue.fetch({success: function(processedQueue, response){
			var processedQueueView = new ProcessedQueueView({
				collection: processedQueue,
				el: '#processed-queue'
			});
		}});

		$('a.remove').click(function() {
			$this = $(this);
			id = $this.parent().children('span.id').text();
			$.delete('/api/requests/' + id, {}, function(data) {
				if (data.success) {
					$this.parent().parent().hide('slow');
				} else {
					alert('Something went wrong, server returned error');
				}
			});
		});

		$('a.approve').click(function() {
			$this = $(this);
			id = $this.parent().children('span.id').text();
			$.post('/api/approve', {id: id}, function(data) {
				if (data.success) {
					$this.parent().parent().hide('slow');
					document.location.href = '/';
				} else {
					alert('Something went wrong, server returned error');
				}
			});
		});

		$('a.resubmit').click(function() {
			$this = $(this);
			id = $this.parent().children('span.id').text();
			$.post('/api/resubmit', {id: id}, function(data) {
				if (data.success) {
					document.location.href = '/';
				} else {
					alert('Something went wrong, server returned error');
				}
			});
		});

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






