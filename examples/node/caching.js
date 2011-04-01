var umecob = require('../../umecob');
var cachedata = {};


// shorten tpl_id and data_id (not necessary)
umecob.start('set_path', function(params) {
  params.tpl_id = __dirname + '/tpls/' + params.tpl_id + '.html';
  if (params.data_id) {
    params.data_id = __dirname + '/data/' + params.data_id + '.js';
  }
}, false);


// use cache  (required)
umecob.start('cache_start_sample01', function(params) {
  if (params.tpl_id && cachedata[params.tpl_id]) {
    params.code = cachedata[params.tpl_id];
  }
}, false);


// save cache (required)
umecob.end('cache_end_sample01', function(params) {
  console.log(params.code);
  cachedata[params.tpl_id] = params.code;
}, false);


// make a preset (not necessary)
umecob.preset('caching_sample', {
  binding: 'file',
  compiler: 'php',
  start : ['set_path', 'cache_start_sample01'], // first, run set_path, then run cache_start_sample01
  end   : ['cache_end_sample01']
});

var data = {
  'file': 'Read a file of tpl_id. It uses \'fs\' module. Only for Node.js',
  'xhr' : 'Get a resource of url : tpl_id via XMLHttpRequest.  Only for Browsers',
  'jquery' : 'Get a resource of url : tpl_id via $.get(). Only for Browsers and needs jQuery.',
  'url' : 'Get a resource of url : tpl_id via http(s).clientRequest. Only for Node.js'
};

var t1 = new Date().getTime();

// run (required)
var result = umecob({preset: 'caching_sample', data: data, tpl_id: 'caching', sync: true})
var t2 = new Date().getTime();

// get it again.
var result = umecob({preset: 'caching_sample', data: data, tpl_id: 'caching', sync: true})
var t3 = new Date().getTime();

console.log("before caching: " + (t2 - t1) + "msec");
console.log(" after caching: " + (t3 - t2) + "msec");
