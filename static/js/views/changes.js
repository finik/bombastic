define(function(require){
	
	var Backbone = require('backbone');
	var _ = require('underscore');
	var ChangeView = require('views/change');

	var ChangesView = Backbone.View.extend({
		initialize: function() {
			this.collection.on('all', this.render, this);
		},
		render: function() {
			that = this;
			this.$el.empty();
			this.collection.each(function(change) {
				var view = new ChangeView({
					model: change,
					restore: that.options.restore
				});
				that.$el.append(view.render().el);
			});
		}
	});

	return ChangesView;
});