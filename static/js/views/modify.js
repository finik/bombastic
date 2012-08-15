define(function(require){
	
	var Backbone = require('backbone');
	var _ = require('underscore');
	var ModalDialogView = require('views/modal');
	var tpl = require('text!templates/modify.html');

	var ModifyProjectView = ModalDialogView.extend({
		template: _.template(tpl),
		events: {
			'click #ok': 'ok'
		},
		render: function() {
			$(this.el).html(this.template({project: this.options.project}));
			return this;
		},
		ok: function() {
			var project = {};
			if ($(this.el).find('#modify-name').val()) {
				project.name = $(this.el).find('#modify-name').val();
			}

			if ($(this.el).find('#modify-path').val()) {
				project.path = $(this.el).find('#modify-path').val();
			}

			if ($(this.el).find('#modify-groups').val()) {
				project.groups = $(this.el).find('#modify-groups').val();
			}

			if ($(this.el).find('#modify-remote').val()) {
				project.remote = $(this.el).find('#modify-remote').val();
			}

			if ($(this.el).find('#modify-revision').val()) {
				project.revision = $(this.el).find('#modify-revision').val();
			}

			if (this.options.success) {
				this.options.success(project);
			}

			this.hide();

		}
	});

	return ModifyProjectView;
});