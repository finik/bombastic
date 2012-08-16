define(function(require){

	var Backbone = require('backbone');
	var _ = require('underscore');
	var Request = require('models/request');

	var Queue = Backbone.Collection.extend({
		initialize: function() {
			this.on("all", function(event, message) {
				console.log("Changes:" + event + message);
			});
		},

		model: Request,
		url: '/api/requests'

	});

	return Queue;
});