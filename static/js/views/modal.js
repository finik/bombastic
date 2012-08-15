define(function(require){
	
	var Backbone = require('backbone');
	var _ = require('underscore');
	
	var ModalDialogView = Backbone.View.extend({
		tagName: 'div',
		className: 'modal hide fade',
		initialize: function() {
		},
		render: function() {
			$(this.el).html(this.template());
			return this;
		},
		show: function() {
			$(this.el).modal('show');
		},
		hide: function() {
			$(this.el).modal('hide');			
		}
	});

	return ModalDialogView;
});