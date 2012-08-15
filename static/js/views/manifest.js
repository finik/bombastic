define(function(require){
	
	var Backbone = require('backbone');
	var _ = require('underscore');
	var ProjectView = require('views/project');

	var ManifestView = Backbone.View.extend({
		initialize: function() {
			that = this;
			this.collection.each(function(project) {
				var view = new ProjectView({
					model: project,
					remove: that.options.remove,
					modify: that.options.modify,
					restore: that.options.restore
				});
				that.$el.append(view.render().el);
			});
		},
		render: function() {

		}
	});

	return ManifestView;
});