var test = require('./shinout.test/shinout.test');
var umecob = require('../umecob');
var Umecob = require('../umecob').Umecob;

umecob.end('get', function(p) {
  if (p.async) {
    p.result = p.result.next(function(result) {
      console.log("async");
      return 'shinout' + result;
    });
  }
});

umecob({tpl: '${skinmilk?:"nivea"}', data: {skinmilk : false}})
.next(function(result) {
  test('equal', result.slice(0, 7), 'shinout', 'async end function error');
  test('result', 'deferred test');
});
