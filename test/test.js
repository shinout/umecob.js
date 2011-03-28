var test = require('./shinout.test/shinout.test');
var umecob = require('../umecob');
var Umecob = require('../umecob').Umecob;

/* about configuration */
umecob.end('get_detail', function(params) {
  if (params.async) {
    params.result = params.result.next(function(result) {
      return {result: result, params: params, configs: this}; 
    }.bind(this));
  }
  else {
    params.result = {result: params.result, params: params, configs: this};
  }
}, false)

.preset.push('end', 'debug', 'get_detail');

test('equal', umecob.id, 'umecob', 'default umecob id should be "umecob"');
test('equal', umecob.preset('debug').end.length, 2, 'invalid debug end');
test('equal', umecob.preset('debug').end[1], 'get_detail', 'invalid debug end');
test('equal', umecob.use().end.length, 0, 'invalid plain preset end');
umecob.preset.push('start', 'debug', 'not_found');
test('equal', umecob.preset('debug').start.length, 1, 'not found is not appended. start');
test('result', 'configuration test');


umecob({name: 'empty umecob async', use: {end: ['get_detail']} })
.next(function(obj) {
  test('equal', obj.configs.start.length, 0, 'invalid start function detected.');
  test('equal', obj.result, '', 'result is not empty');
  test('result', 'empty umecob async');
})
.error(function(e){
  umecob.log(e);
});

var result = umecob({sync: true, name: 'empty umecob sync'});
test('equal', result, '', 'result is not empty');
test('result', 'empty umecob sync');



var tpl = '[%=hoge %] world';
var result = umecob({sync: true, name: 'hello world', tpl: tpl, data:{hoge: 'hello'} });
console.log(result);
test('equal', result, 'hello world', 'result is parsed incorrectly');
test('result', 'hello world sync');


var tpl = 'using <?=php ?> tag';
var result = umecob({sync: true, data:{php: 'PHP'}, use: {compiler: 'php'}, tpl :tpl});
console.log(result);
test('equal', result, 'using PHP tag', 'result is parsed incorrectly');
test('result', 'php sync');


var new_umecob = Umecob('new one');
test('equal', new_umecob.preset('debug').end.length, 1, 'invalid debug end at new umecob');
test('equal', new_umecob.preset('debug').end[0], 'logging', 'invalid debug end at new umecob');
test('equal', umecob, umecob, 'equal : comparison of umecob and new_umecob');
console.log(new_umecob.id);
test('equal', new_umecob.id, 'new one', 'invalid umecob id');
test('notEqual', new_umecob, umecob, 'notEqual: comparison of umecob and new_umecob');
test('result', 'new umecob');


var already_created_umecob = Umecob('umecob');
test('strictEqual', already_created_umecob, umecob, 'notStrictEqual: already_created_umecob and umecob');

var time_umecob = Umecob();
test('ok', time_umecob.id.match(/^[0-9]+$/), 'invalid time_umecob id');
test('result', 'about Umecob instances');

/* umecob option */
var tpl = '<?=echo.umecob.id ?>';
var result = umecob({use:{compiler: 'php'},umecob: new_umecob, sync: true, tpl: tpl});
umecob.log(result);
test('equal', result, new_umecob.id, 'invalid umecob (internal compiler)');


/* umecob use,attach,jsp,remove */
time_umecob.start('attach', function(u) {
  u.attach = {
    hoge: 'hello',
    fuga: ['world']
  }
})
.end.remove('logging');
var tpl = '<%=hoge%> <%=fuga[0]%>';
var result = time_umecob.use({compiler: 'jsp'})({tpl: tpl, sync: true, preset: 'debug'});
test('equal', result, 'hello world', 'attach jsp use remove');
test('equal', typeof time_umecob.end('logging'), 'undefined', 'logging was not removed at time_umecob.');
test('equal', typeof umecob.end('logging'), 'function', 'logging was removed at umecob.');
test('result', 'jsp, attach, use, remove');


/* umecob binding setting */
var bu = Umecob('binding_umecob');
bu.use('plain');
test('equal', bu.use().binding.tpl, 'plain', 'invalid set of binding.tpl via use(binding)');
test('equal', bu.use().binding.data, 'plain', 'invalid set of binding.data via use(binding)');
bu.preset('super', {binding: 'super_bind'});
umecob.log(bu.preset('super'));
umecob.log(bu.preset('super').binding.tpl);
test('equal', bu.preset('super').binding.tpl, 'super_bind', 'invalid set of binding.tpl via preset(binding: binding_name)');
test('equal', bu.preset('super').binding.data, 'super_bind', 'invalid set of binding.data via preset(binding: binding_name)');
test('result', 'use & binding');


/* umecob file binding */
var fu = Umecob("file");
fu.use("file")
fu.use({compiler: 'php'})
.start('file', function(params){
  params.tpl_id = 'test/tpls/' + params.tpl_id + '.html';
  params.data_id = 'test/data/' + params.data_id + '.data';
});
var result = fu({sync: true, tpl_id: "smpl1", data_id: "smpl1"});
console.log(result);
test('ok', result.match(/かいしゃ/), 'rendered incorectly');
test('ok', result.match(/list5/), 'rendered incorectly');
test('ok', result.match(/Microsoft/), 'rendered incorectly');
test('result', 'file binding');


/* umecob url binding */
var urlcob = Umecob("url");
urlcob.use("url")
.use({compiler: 'php'})
.start('url', function(params){
  params.tpl_id = 'shinout.net/tpls/' + params.tpl_id;
  console.log(params.tpl_id);
  params.data_id = 'https://shinout.net/js/' + params.data_id;
});
urlcob({tpl_id: "sample.tpl", data_id: "date.js", attach: function(data){
  return {"date": data};
}})
.next(function(result) {
  console.log(result);
  test('ok', result.match(/キャッシュ/), 'rendered incorectly');
  test('result', 'url binding');
});

