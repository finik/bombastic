requirejs.config({
  shim: {
    'bootstrap': {
      deps: ['jquery'],
      exports: 'bootstrap'
    },
    'datatables': {
      deps: ['jquery'],
      exports: 'datatables'
    },
    'paging': {
      deps: ['datatables'],
      exports: 'paging'
    },
  },
  paths: {
    'jquery'        : 'libs/jquery.min',
    'bootstrap'     : 'libs/bootstrap/bootstrap',
    'datatables'    : 'libs/jquery.dataTables.min',
    'paging'        : 'libs/jquery.dataTables.paging'
  }
});

require([
	"jquery",
	"bootstrap",
  "datatables",
  "paging"
  ], function($) {
    $(function() {

      var $project_tr;
      var $original_tr;

      $('select#project').change(function() {
        $this = $(this);
        project = $this.val();
        $.post('/api/project', {project: project}, function(data) {
          if (data.success) {
            document.location.href = document.location.href;
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

      $('td>div>a.remove').click(function() {
        $original_tr = $(this).parent().parent().parent();
        $project_tr = $original_tr.clone();
        $project_tr.find('td.action>div').html('Remove');
        $project_tr.find('td.restore>div').show();
        $project_tr.appendTo('.pending');
        $original_tr.addClass('removed-project');
        $original_tr.find('td.action>div').hide();
        $original_tr.find('td.restore>div').show();
      });

      $('td>div>a.modify').click(function() {
        $original_tr = $(this).parent().parent().parent();
        $project_tr = $original_tr.clone();
        $('#modify-name').val($project_tr.children('td.name').text());
        $('#modify-path').val($project_tr.children('td.path').text());
        $('#modify-groups').val($project_tr.children('td.groups').text());
        $('#modify-revision').val($project_tr.children('td.revision').text());
        $('#editModal').modal('show');
      });

      $('tbody').on('click', 'tr>td>div>a.restore', (function() {
        $tr = $(this).parent().parent().parent();
        name = $tr.children('td.name').text();
        $('tbody.pending>tr').each(function(index, element){
          if ($(this).children('td.name').text() == name) {
            $(this).remove();
          }
        });
        $('tbody.original>tr').each(function(index, element){
          if ($(this).children('td.name').text() == name) {
            $(this).removeClass('removed-project');
            $(this).removeClass('modified-project');
            $(this).find('td.action>div').show();
            $(this).find('td.restore>div').hide();
          }
        });
      }));

      $('#modify-ok').click(function() {
        $project_tr.find('td.action>div').html('Modify');
        $project_tr.find('td.restore>div').show();
        $project_tr.children('td.path').text($('#modify-path').val());
        $project_tr.children('td.groups').text($('#modify-groups').val());
        $project_tr.children('td.remote').text($('#modify-remote').val());
        $project_tr.children('td.revision').text($('#modify-revision').val());
        $('#editModal').modal('hide');
        $project_tr.appendTo('.pending');
        $original_tr.addClass('modified-project');
        $original_tr.find('td.action>div').hide();
        $original_tr.find('td.restore>div').show();
        event.stopPropagation();
      });

      $('#add-component').click(function() {
        $('#addModal').modal('show');
      })

      $('#add-ok').click(function() {
        $project_tr = $('#tr-template').clone();
        $project_tr.removeClass('hide');
        $project_tr.children('td.name').text($('#add-name').val());
        $project_tr.children('td.path').text($('#add-path').val());
        $project_tr.children('td.groups').text($('#add-groups').val());
        $project_tr.children('td.remote').text($('#add-remote').val());
        $project_tr.children('td.revision').text($('#add-revision').val());
        $('#addModal').modal('hide');
        $project_tr.appendTo('.pending');
        event.stopPropagation();
      });

      $('#submit-bom').click(function() {
        changes = [];
        request = {};

        $('tbody.pending>tr').each(function(index, element){
          if ($(this).hasClass('hide')) return;

          component = {};
          component.action = $(this).find('td.action>div').text();
          component.name = $(this).children('td.name').text();
          changes.push(component);

          if ($(this).children('td.path').text()) {
            component.path = $(this).children('td.path').text();
          }

          if ($(this).children('td.groups').text()) {
            component.groups = $(this).children('td.groups').text();
          }

          if ($(this).children('td.remote').text()) {
            component.remote = $(this).children('td.remote').text();
          }

          if ($(this).children('td.revision').text()) {
            component.revision = $(this).children('td.revision').text();
          }
        });

        if (changes.length == 0) {
          alert('There are no pending changes to submit!');
          return;
        }

        request.changes = changes;
        request.message = $('#message').val();

        if (request.message == "") {
          alert('Please describe your changes!');
          return;
        }


        $.post('/api/submit', {request: request}, function(data) {
          document.location.href = '/';
        });


      });

      $('#datatable').dataTable({
        "sDom": "<'row'<'span12'f>r><'row'<'span6'i><'span6'p>>t<'row'<'span6'i><'span6'p>>",
        "sPaginationType": "bootstrap"
      });

    });
  });






