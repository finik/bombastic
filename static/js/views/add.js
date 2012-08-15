define(function(require){
	
	var Backbone = require('backbone');
	var _ = require('underscore');
	var ModalDialogView = require('views/modal');
	var tpl = require('text!templates/add.html');

	var AddProjectView = ModalDialogView.extend({
		template: _.template(tpl),
		events: {
			'click #ok': 'ok'
		},
		ok: function() {
			var project = {};
			if ($(this.el).find('#add-name').val()) {
				project.name = $(this.el).find('#add-name').val();
			}

			if ($(this.el).find('#add-path').val()) {
				project.path = $(this.el).find('#add-path').val();
			}

			if ($(this.el).find('#add-groups').val()) {
				project.groups = $(this.el).find('#add-groups').val();
			}

			if ($(this.el).find('#add-remote').val()) {
				project.remote = $(this.el).find('#add-remote').val();
			}

			if ($(this.el).find('#add-revision').val()) {
				project.revision = $(this.el).find('#add-revision').val();
			}

			if (this.options.success) {
				this.options.success(project);
			}

			this.hide();

		}
	});

	return AddProjectView;
});