define(function(require){
	var _ = require('underscore');
	var Backbone = require('backbone');

	Project = Backbone.Model.extend({
		initialize: function() {
			this.on("all", function(event) {
				console.log(event);
			});
		}
	});

	return Project;
});