var umecob = require("../umecob");
var tplfile  = process.argv[2];
var datafile = process.argv[3];

umecob.start('f', function(p) {
  p.tpl_id  = __dirname + '/../' + p.tpl_id;
  if (p.data_id) {
    p.data_id = __dirname + '/../' + p.data_id;
  }
  else {
    p.data = {};
  }
});

umecob.compiler('scripts', umecob.Umecob.compiler('<','<','>','>'));
var result = umecob({use: "file", tpl_id: tplfile, data_id: datafile, sync: true});
console.log(result);
