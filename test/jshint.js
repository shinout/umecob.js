var test = require('./shinout.test/shinout.test');
var umecob = require('../umecob');



test.exe(function() {
  var code = 'var hoge = {a: "b", c: "d"};for(var i in hoge){hoge[i]++;}';
  var hint = require('../jshint');
  hint(code, {forin : false});
  test('ok', hint.errors[0].raw.match(/for in/), 'JSHINT did not detect for in error.');
  hint(code, {forin : true});
  test('equal', hint.errors.length, 0, 'JSHINT detected for in error in a suppressed condition.');
  test('result', 'for in test', true);
});


test.exe(function() {
  var code = 'var a=('+require('fs').readFileSync(__dirname + '/data/jsonlike.js').toString() + ')';
  var hint = require('../jshint');

  hint(code, {asi: true, laxbreak: false});
  test('ok', hint.errors[0].raw.match(/Bad line breaking/), 'JSHINT did not detect for in error.');

  hint(code, {asi: true, laxbreak : true});
  test('equal', hint.errors.length, 0, 'JSHINT detected for in error in a suppressed condition.');


  try {
    var data = umecob.binding('file').getData.sync(__dirname + '/data/jsonlike.js');
    test('ok', true);
  } catch (e) {
    test('fail', 'umecob jsonize error');
  }
  console.log(data);
  test('result', 'json parsing test', true);
});
