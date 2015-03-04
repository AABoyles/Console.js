$(function(){

  // Start the db in which sql.js will run
  var db = new Worker("js/sql.js");
  db.onerror = function(e) {
    $('#error').text(e.message).show();
  }
  db.postMessage({action:'open'});

  // Run a command in the database
  function query(commands, callback) {
  	db.onmessage = callback;
  	db.postMessage({action:'exec', sql:commands});
  }

  // query the commands when the button is clicked
  $("#execute").click(function() {
    $('#error').hide();
    query($('#commands').val(), function(event) {
      var results = event.data.results;
      $('#output').empty();
      for (var i=0; i<results.length; i++) {
        html = '<table><thead><tr><th>' + results[i].columns.join("</th><th>") + '</th></tr></thead><tbody>';
        for (var j=0; j<results[i].values.length; j++) {
          html += "<tr><td>" + results[i].values[j].join("</td><td>") + "</td></tr>";
        }
        html += '</tbody></table>'
        $('#output').append(html);
      }
      refreshTables();
    });
  });

  function refreshTables() {
    query("SELECT name as Tables FROM sqlite_master WHERE type = 'table'; SELECT name as Views FROM sqlite_master WHERE type = 'view';", function(event){
      var results = event.data.results;
      $('#tables').html("<a>" + results[0].values.join("</a><br /><a>") + "</a>");
      $('#views').html("<a>" + results[1].values.join("</a><br /><a>") + "</a>");
    });
  };

  // Load a db from a file
  $('#dbfile')[0].onchange = function(){
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
  }

  // Save the db to a file
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
