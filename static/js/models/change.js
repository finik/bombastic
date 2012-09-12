define(function(require){
	var _ = require('underscore');
	var Backbone = require('backbone');

	Change = Backbone.Model.extend({
		urlRoot: '/api/changes',

		initialize: function() {
			this.on("all", function(event) {
				console.log(event);
			});
		}
	});

	return Change;
});