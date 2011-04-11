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
  params.ext =  params.ext || 'html';
  if (params.tpl_id) { params.tpl_id = 'test/tpls/' + params.tpl_id + '.' + params.ext;
  }
  if (params.data_id) {
    params.data_id = 'test/data/' + params.data_id + '.data';
  }
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


/* umecob syntax1 quotation */
var result = fu({sync: true, tpl_id: "dq"});
console.log(result);
test('equal', result, "double [%quotation%] 'test'\'\"", 'rendered incorectly');
var result = fu({sync: true, tpl_id: "sq"});
console.log(result); test('equal', result, 'single quotation \n\n\n\n"test"\'\"', 'rendered incorectly');
test('result', 'quotation test');

/* umecob syntax2 comment */
fu.end('showcode', function(params) {
  console.log(params.code);
}, false);
var result = fu({use: {end: 'showcode'}, sync: true, tpl_id: "comment"});
//var result = fu({sync: true, tpl_id: "comment"});
console.log(result);
test('equal', result, "A\nB\nC", 'rendered incorectly');
test('result', 'comment test');



/* umecob syntax3 short echo */
var data = {hoge: {key: 'kkk', val: 'vvvvv'}};
var result = fu({sync: true, tpl_id: "short_echo", data: data});
console.log(result);
test('equal', result, '<p id="kkk">vvvvv</p>\nhoge', 'rendered incorectly');
test('result', 'short echo test');


/* umecob template error log */
var result = fu({sync: true, tpl_id: "error01" });
test('ok', result.match(/at line 4\./), 'incorect line number of error');

var result = fu({use: {end: 'showcode'}, sync: true, tpl_id: "error02" });
test('ok', result.match(/at line 7\./), 'incorect line number of error');

fu({tpl_id: "error03" })
.next(function(result) {
  test('ok', result.match(/at line 17\./), 'incorect line number of error');
  var outerscope = "outer";
  return fu({tpl_id: "error05"});
})
.next(function(result) {
  test('ok', result.match(/at line 3\./), 'incorect line number of error');
  return fu({tpl_id: "error06"});
})
.next(function(result) {
  test('ok', result.match(/at line 2\./), 'incorect line number of error');
  return fu({tpl_id: "error07"});
})
.next(function(result) {
  test('ok', !result.match(/at line 3\./), 'incorect line number of error');
  return fu({tpl_id: "error08", ext: 'css'});
})
.next(function(result) {
  console.log(result);
  test('ok', result.match(/section\.side/) && result.match(/div#main/), 'incorect rendering');
  test('result', 'short echo async test');
});



var result = fu({sync: true, tpl_id: "error04" });
test('ok', result.match(/at line 1\./), 'incorect line number of error');
test('result', 'short echo test');


/* umecob easy input */
var sumecob = new Umecob('sumecob');
var result = sumecob('${hoge}, World', {hoge: "Hello"});
test('equal', result, 'Hello, World', 'incorect line number of error');
test('result', 'umecob easy input test');
