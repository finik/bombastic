requirejs.config({
	shim: {
		'bootstrap': {
			deps: ['jquery'],
			exports: 'bootstrap'
		},
		'datatables': {
			deps: ['jquery'],
			exports: 'datatables'
		},
		'paging': {
			deps: ['datatables'],
			exports: 'paging'
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
		'datatables'    : 'libs/jquery.dataTables.min',
		'paging'        : 'libs/jquery.dataTables.paging',
		'text'			: 'libs/text'
	}
});

define(function(require) {
	var _ = require('underscore');
	var $ = require('jquery');
	require('bootstrap');
	require('backbone');
	require('datatables');
	require('paging');
	var Manifest = require('collections/manifest');
	var ManifestView = require('views/manifest');
	var AddProjectView = require('views/add');
	var ModifyProjectView = require('views/modify');
	var Changes = require('collections/changes');
	var ChangesView = require('views/changes');

	$(function() {

		var manifest = new Manifest();
		var changes = new Changes();

		manifest.fetch({success: function(manifest, response){
			var manifestView = new ManifestView({
				collection: manifest,
				el: $('tbody.original'),
				remove: function(project) {
					var change = new Change({
						action: 'REMOVE',
						project: project.toJSON()
					});
					project.set('removed', true);
					changes.add(change);
				},
				modify: function(project) {
					var modifyProjectView = new ModifyProjectView({
						project: project.toJSON(),
						success: function(newProject) {
							var change = new Change({
								action: 'MODIFY',
								project: newProject,
								original: project.toJSON()
							});
							project.set('modified', true);
							changes.add(change);
						}
					});
					modifyProjectView.render().show();
				},
				restore: function(project) {
					changes.each(function(change) {
						if (project.get('name') == change.get('project').name) {
							project.unset('removed');
							project.unset('modified');
							changes.remove(change);
						}
					});
				}
			});
			var changesView = new ChangesView({
				collection: changes,
				el: $('tbody.pending'),
				restore: function(change) {
					if ('add' != change.get('action')) {
						manifest.each(function(project){
							if (change.get('project').name == project.get('name')) {
								project.unset('removed');
								project.unset('modified');
							}
						});
					}
					changes.remove(change);
				}
			});

			$('#datatable').dataTable({
				"sDom": "<'row'<'span12'f>r><'row'<'span6'i><'span6'p>>t<'row'<'span6'i><'span6'p>>",
				"sPaginationType": "bootstrap"
			});
		}});

		var $project_tr;
		var $original_tr;

		$('select#project').change(function() {
			$this = $(this);
			project = $this.val();
			$.post('/api/project', {project: project}, function(data) {
				if (data.success) {
					document.location.href = document.location.href;
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

		$('#add-component').click(function() {
			var addProjectView = new AddProjectView({success: function(project){
				console.log(project);
				var change = new Change({
					action: 'ADD',
					project: project
				});
				changes.add(change);
			}});
			addProjectView.render().show();
		});

		$('#submit-bom').click(function() {
			var request = {};
			request.changes = changes.toJSON();
			request.message = $('#message').val();
			
			if (request.changes.length === 0) {
				alert('There are no pending changes to submit!');
				return;
			}

			if (request.message === "") {
				alert('Please describe your changes!');
				return;
			}


			$.post('/api/submit', {request: request}, function(data) {
				document.location.href = '/';
			});


		});


	});
});






