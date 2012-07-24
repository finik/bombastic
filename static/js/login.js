requirejs.config({
  shim: {
    'bootstrap': {
      deps: ['jquery'],
      exports: 'bootstrap'
    }
  },
  paths: {
    'jquery'        : 'libs/jquery.min',
    'bootstrap'     : 'libs/bootstrap/bootstrap',
  }
});

require([
	"jquery",
	"bootstrap"
  ], function($) {

    var submit = function() {
      $('#alert').hide();
      login = $('#loginbox').val();
      password = $('#passwordbox').val();

      $.post('/api/login', {login: login, password: password}, function(data) {
        if (data.success) {
          document.location.href = '/';
        } else {
          $('#alert').show();
        }
      });
    };

    var pressEnter = function() {
      if (event.which == 13) {
        event.preventDefault();
        submit();
      }
    }

    $(function() {
      $('#loginModal').modal('show');
      $('#loginModal').on('shown', ( function() {
        $('#loginbox').focus();
      }));

      $('a#login').click(submit);
      $('#loginbox').keydown(pressEnter);
      $('#passwordbox').keydown(pressEnter);
    });
  });






