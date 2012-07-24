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
    $(function() {
      $('a.remove').click(function() {
        $this = $(this);
        id = $this.parent().children('span.id').text();
         $.post('/api/delete', {id: id}, function(data) {
          if (data.success) {
            $this.parent().parent().hide('slow');
          } else {
            alert('Something went wrong, server returned error');
          }
        });
      });

      $('a.approve').click(function() {
        $this = $(this);
        id = $this.parent().children('span.id').text();
         $.post('/api/approve', {id: id}, function(data) {
          if (data.success) {
            $this.parent().parent().hide('slow');
            document.location.href = '/';
          } else {
            alert('Something went wrong, server returned error');
          }
        });
      });

      $('a.logout').click(function() {
        $this = $(this);
        $.post('/api/logout', {}, function(data) {
          document.location.href = '/';
        });
      });

      $('select#project').change(function() {
        $this = $(this);
        project = $this.val();
        $.post('/api/project', {project: project}, function(data) {
          if (data.success) {
            document.location.href = '/';
          } else {
            alert('Something went wrong, server returned error');
          }
        });
      });

    });
  });






