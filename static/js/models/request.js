define(function(require){
	var _ = require('underscore');
	var Backbone = require('backbone');

	Request = Backbone.Model.extend({
		initialize: function() {
			this.on("all", function(event) {
				console.log(event);
			});
		}
	});

	return Request;
});