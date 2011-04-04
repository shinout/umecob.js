var umecob = require('../../umecob');
umecob({use: "file", tpl_id: __dirname + '/tpls/error.html', data: {title: 'error sample'}, sync: true});
