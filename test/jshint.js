var test = require('./shinout.test/shinout.test');



test.exe(function() {
  var code = 'var hoge = {a: "b", c: "d"};for(var i in hoge){hoge[i]++;}';
  var hint = require('../jshint');
  hint(code, {forin : false});
  test('ok', hint.errors[0].raw.match(/for in/), 'JSHINT did not detect for in error.');
  hint(code, {forin : true});
  test('equal', hint.errors.length, 0, 'JSHINT detected for in error in a suppressed condition.');
  test('result', 'for in test', true);
});

