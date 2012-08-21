define(function(require){

	var Backbone = require('backbone');
	var _ = require('underscore');
	var ModalDialogView = require('views/modal');
	var tpl = require('text!templates/import.html');

	var ImportChangesView = ModalDialogView.extend({
		template: _.template(tpl),
		events: {
			'click #ok': 'ok'
		},
		render: function() {
			$(this.el).html(this.template());
			return this;
		},
		ok: function() {
			var url;

			if ($(this.el).find('#import-url').val()) {
				url = $(this.el).find('#import-url').val();
			}

			if (this.options.success) {
				this.options.success(url);
			}

			this.hide();

		}
	});

	return ImportChangesView;
});