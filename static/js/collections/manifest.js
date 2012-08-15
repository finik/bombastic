define(function(require){
	
	var Backbone = require('backbone');
	var _ = require('underscore');
	var Project = require('models/project');

	var Manifest = Backbone.Collection.extend({
		initialize: function() {
			this.on("all", function(event) {
				console.log(this);
			});
		},

		model: Project,
		url: '/api/projects'

	});

	return Manifest;
});