define(function(require){

	var Backbone = require('backbone');
	var _ = require('underscore');
	var Change = require('models/change');

	var Changes = Backbone.Collection.extend({
		initialize: function(props) {
			this.url = props.url;
			this.on("all", function(event, message) {
				console.log("Changes:" + event + message);
			});
		},

		empty: function() {
			while (this.length) {
				var change = this.pop();
				change.destroy();
			}
		},

		model: Change
	});

	return Changes;
});