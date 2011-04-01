var umecob = require('../../umecob');

umecob.start('set_path01', function(params) {
  params.tpl_id = __dirname + '/tpls/' + params.tpl_id + '.html';
  if (params.data_id) {
    params.data_id = __dirname + '/data/' + params.data_id + '.js';
  }
}, false);

var result = umecob({use: {binding: 'file', start: 'set_path01', compiler: 'php'}, tpl_id: 'hoge', data_id: 'hoge', sync: true});

console.log(result);
