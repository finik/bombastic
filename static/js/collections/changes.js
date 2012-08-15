define(function(require){
	
	var Backbone = require('backbone');
	var _ = require('underscore');
	var Change = require('models/change');

	var Changes = Backbone.Collection.extend({
		initialize: function() {
			this.on("all", function(event, message) {
				console.log("Changes:" + event + message);
			});
		},

		model: Change,
		url: '/api/changes'

	});

	return Changes;
});