define(function(require){

	var Backbone = require('backbone');
	var _ = require('underscore');
	var Request = require('models/request');

	var Queue = Backbone.Collection.extend({
		initialize: function(props) {
			this.url = props.url;
			this.on("all", function(event, message) {
				console.log("Changes:" + event + message);
			});
		},

		model: Request,
	});

	return Queue;
});