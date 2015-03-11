$(function(){
  var editor = ace.edit("commands");
  editor.setTheme("ace/theme/github");
  editor.getSession().setMode("ace/mode/sql");

  var db = new Worker("js/sql.js");

  db.onerror = function(e) {
    $('#error').text(e.message).show();
  }
  db.postMessage({action:'open'});

  query = function(commands, callback) {
  	db.onmessage = callback;
  	db.postMessage({action:'exec', sql:commands});
  };

  $("#execute").click(function() {
    $('#error').hide();
    query(editor.getValue(), function(event) {
      var results = event.data.results;
      $('#output').empty();
      for (var i=0; i<results.length; i++) {
        html = '<table class="table table-striped"><thead><tr><th>' + results[i].columns.join("</th><th>") + '</th></tr></thead><tbody>';
        for (var j=0; j<results[i].values.length; j++) {
          html += "<tr><td>" + results[i].values[j].join("</td><td>") + "</td></tr>";
        }
        html += '</tbody></table>'
        $('#output').append(html);
      }
      refreshTables();
    });
  });

  refreshTables = function() {
    query("SELECT name as Tables FROM sqlite_master WHERE type = 'table'; SELECT name as Views FROM sqlite_master WHERE type = 'view';", function(event){
      $('#tables').html("<a>" + event.data.results[0].values.join("</a><br /><a>") + "</a>");
      $('#views').html("<a>" + event.data.results[1].values.join("</a><br /><a>") + "</a>");
      $('#tables a, #views a').click(function(){
        query("SELECT * FROM '" + $(this).text() + "';",function(){
          var results = event.data.results;
          html = '<table class="table table-striped"><thead><tr><th>' + results[0].columns.join("</th><th>") + '</th></tr></thead><tbody>';
          for (var j=0; j<results[0].values.length; j++) {
            html += "<tr><td>" + results[0].values[j].join("</td><td>") + "</td></tr>";
          }
          html += '</tbody></table>'
          $('#output').html(html);
        });
      });
    });
  };

  $('#dbfile').change(function(){
  	var f = $('#dbfile')[0].files[0];
  	var r = new FileReader();
  	r.onload = function() {
  		db.onmessage = refreshTables;
  		try {
  			db.postMessage({action:'open',buffer:r.result}, [r.result]);
  		} catch(exception) {
  			db.postMessage({action:'open',buffer:r.result});
  		}
  	}
  	r.readAsArrayBuffer(f);
  });

  $('#savedb').mousedown(function(){
    db.onmessage = function(event) {
      var arraybuff = event.data.buffer;
      var blob = new Blob([arraybuff]);
      var url = window.URL.createObjectURL(blob);
      $('#savedb')[0].href = url;
    };
    db.postMessage({action:'export'});
  });
});
