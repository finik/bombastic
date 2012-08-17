define(function(require){
	var Backbone = require('backbone');
	var _ = require('underscore');
	var PendingRequestView = require('views/pendingRequest');

	var PendingQueueView = Backbone.View.extend({
		initialize: function() {
			that = this;
			this.collection.each(function(request) {
				var view = new PendingRequestView({
					model: request,
				});
				that.$el.append(view.render().el);
			});
		}
	});

	return PendingQueueView;
});