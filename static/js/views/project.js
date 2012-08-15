define(function(require){
	
	var Backbone = require('backbone');
	var _ = require('underscore');
	var Project = require('models/project');
	var tpl = require('text!templates/project.html');

	var ProjectView = Backbone.View.extend({
		template: _.template(tpl),
		tagName: 'tr',
		className: 'project',
		initialize: function() {
			this.model.on('all', this.render, this);
			this.render();
		},

		render: function() {
			$(this.el).html(this.template({project: this.model.toJSON()}));
			return this;
		},

		events: {
			'click a.remove': 'remove',
			'click a.modify': 'modify',
			'click a.restore': 'restore'
		},

		remove: function() {
			if (this.options.remove) {
				this.options.remove(this.model);
			}
		},

		modify: function() {
			if (this.options.modify) {
				this.options.modify(this.model);
			}
		},

		restore: function() {
			if (this.options.restore) {
				this.options.restore(this.model);
			}
		}
	});

	return ProjectView;
});