$(function(){
  ace.require("ace/ext/language_tools");
  editor = ace.edit("commands");
  editor.setTheme("ace/theme/github");
  editor.getSession().setMode("ace/mode/sql");
  editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true
  });

  var db = new Worker("js/sql.js");

  db.onerror = function(e) {
    $('#output').html("<div class='panel panel-danger'><div class='panel-heading'>Error:</div><div class='panel-body'>" + e.message + "</div></div>");
  }
  db.postMessage({action:'open'});

  query = function(commands, callback) {
  	db.onmessage = callback;
  	db.postMessage({action:'exec', sql:commands});
  };

  $("#execute-script").click(function() {
    $('#error').hide();
    query(editor.getValue(), updateResults);
  });

  $("#execute-selection").click(function() {
    $('#error').hide();
    query(editor.session.getTextRange(editor.getSelectionRange()), updateResults);
  });

  refreshTables = function() {
    query("SELECT name as Tables FROM sqlite_master WHERE type = 'table'; SELECT name as Views FROM sqlite_master WHERE type = 'view';", function(event){
      if(event.data.results.length > 0){
        $('#tables').html("<li class='list-group-item'>" + event.data.results[0].values.join("</a><br /><a>") + "</li>");
      }
      if(event.data.results.length > 1){
        $('#views').html("<li class='list-group-item'>" + event.data.results[1].values.join("</a><br /><a>") + "</li>");
      }
      $('#tables li, #views li').click(function(){
        query("SELECT * FROM " + $(this).text() + ";", updateResults);
      });
    });
  };

  updateResults = function(event){
    var results = event.data.results;
    $('#output').empty();
    for (var i=0; i<results.length; i++) {
      html = '<div class="panel panel-default"><table class="table table-hover table-responsive"><thead><tr><th>' + results[i].columns.join("</th><th>") + '</th></tr></thead><tbody>';
      for (var j=0; j<results[i].values.length; j++) {
        html += "<tr><td>" + results[i].values[j].join("</td><td>") + "</td></tr>";
      }
      html += '</tbody></table></div>'
      $('#output').append(html);
    }
    refreshTables();
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
