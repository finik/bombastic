define(function(require){

	var Backbone = require('backbone');
	var _ = require('underscore');
	var Request = require('models/request');
	var tpl = require('text!templates/processedRequest.html');

	var ProcessedRequest = Backbone.View.extend({
		template: _.template(tpl),
		initialize: function() {
			this.on('all', this.render, this);
			this.render();
		},

		render: function() {
			var json = this.model.toJSON();
			json.date = new Date(this.model.get('date'));
			$(this.el).html(this.template(json));
			return this;
		},

		events: {
			'click a.resubmit': 'resubmit',
		},

		resubmit: function() {
			if (this.options.resubmit) {
				this.options.resubmit(this.model);
			}
		}
	});

	return ProcessedRequest;
});