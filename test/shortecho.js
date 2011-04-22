var test = require('./shinout.test/shinout.test');
var umecob = require('../umecob');
var result = umecob({tpl: '${(typeof hoge !== "undefined")?"Hello":"GoodBye"}, World', data: {fuga: "Hello"}, sync: true});
//var result = umecob({preset: 'debug', tpl: '${hoge?"Hello":"GoodBye"}, World', data: {fuga: "Hello"}});
console.log(result + "desu");
test('equal', result, 'GoodBye, World', 'easy input with ? ');

