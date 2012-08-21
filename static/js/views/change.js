define(function(require){

	var Backbone = require('backbone');
	var _ = require('underscore');
	var Change = require('models/change');
	var tpl = require('text!templates/change.html');

	var ChangeView = Backbone.View.extend({
		template: _.template(tpl),
		tagName: 'tr',
		className: 'project',
		initialize: function() {
			this.on('all', this.render, this);
			this.render();
		},

		render: function() {
			$(this.el).html(this.template({change: this.model.toJSON()}));
			return this;
		},

		events: {
			'click a.restore': 'restore'
		},

		restore: function() {
			if (this.options.restore) {
				this.options.restore(this.model);
			}
		}
	});

	return ChangeView;
});