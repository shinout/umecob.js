var umecob = require('../../umecob');

/*
 * Hello, World! (synchronous)
 */

var result01 = umecob({tpl: "[%=foo %], World! Sync.", data: {foo: 'Hello'}, sync: true})
console.log(result01);

/*
 * Hello, World! (asynchronous)
 */
umecob({tpl: "[%=foo %], World! Async.", data: {foo: 'Hello'}})
.next( function(result02) {
  console.log(result02);
});


