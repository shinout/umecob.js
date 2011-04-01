var umecob = require('../../umecob');

// prepare partial setting(optional)
umecob.start('partial_start01', function(p) {
  p.tpl_id = __dirname + '/tpls/' + p.tpl_id + '.html';
}, false)
.preset('partial_path', {start: 'partial_start01', binding: 'file', compiler: 'php'});

umecob({use: 'file', tpl_id: __dirname + '/tpls/partial.html', data: {
  hoge: 'value passed to parent'
}})
.next(function(r) {
  console.log(r);
})
.error(function(r) {
  console.log(r);
})
