define(function(require){
	var Backbone = require('backbone');
	var _ = require('underscore');
	var ProcessedRequestView = require('views/processedRequest');

	var ProcessedQueueView = Backbone.View.extend({
		initialize: function() {
			that = this;
			this.collection.each(function(request) {
				var view = new ProcessedRequestView({
					model: request,
					resubmit: that.options.resubmit
				});
				that.$el.append(view.render().el);
			});
		}
	});

	return ProcessedQueueView;
});