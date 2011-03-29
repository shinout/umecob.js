umecob.js
==========
JavaScript Template Engine.

Features
----------------

1. avaliable in both Browsers and node.js
2. asynchronous support with [JSDeferred](https://github.com/cho45/jsdeferred)
3. no difficult syntax. Just embed JavaScript in template.
4. simple API. Just pass template and data. then gets rendered result.
5. easy to customize.

Overview
----------------
### installation ###
    git clone git://github.com/shinout/umecob.js.git

### preparation ###
#### server side ####
    var umecob = require("/path/to/umecob/umecob.js");

#### client side ####
    <script type="text/javascript" src="/path/to/umecob/jsdeferred.js"></script><!-- for asynchronous use -->
    <script type="text/javascript" src="/path/to/umecob/umecob.js"></script>
    <script type="text/javascript" src="/path/to/umecob/jshint.js"></script><!-- for debug -->


### Hello, World ###
    var template = '[%=foo %], World';
    var values   = { foo: 'Hello'};

#### use synchronously ####
    var result = umecob({tpl: template, data: values, sync: true});
    console.log(result); // Hello, World

#### use Asynchronously ####
    umecob({tpl: template, data: values})
    .next( function(result) {
      console.log(result); // Hello, World
    });

### use binding ###
#### server side ####
    umecob({use: 'file', tpl_id: /path/to/template, data_id: /path/to/data })
    .next( function(result) {
      // do something
    });

    umecob({use: 'url', tpl_id: http://example.com/path/to/template, data_id: http://example.com/path/to/data })
    .next( function(result) {
      // do something
    });


#### client side ####
    umecob({use: 'xhr', tpl_id: http://example.com/path/to/template, data_id: http://example.com/path/to/data })
    .next( function(result) {
      // do something
    });


    umecob({use: 'jquery', tpl_id: http://example.com/path/to/template, data_id: http://example.com/path/to/data })
    .next( function(result) {
      // do something
    });


###sample template###
    [% var username = "shinout"; %] 
    Hello, [%=username%]! // Hello, shinout!
####use partial template####
    [% {tpl: "sample.tpl", data_id:"/data.json" } %]  // replaced with result of this partial.


###customizing###
#### change delimiter ####
    var template = '<? var a = "hogefuga";?> <? echo("a")?>';
    var result = umecob({use: {compiler: 'php'}, tpl :template, sync: true});
    console.log(result); // "hogefuga"
    // use: {compiler: 'standard'}  [% and %]
    // use: {compiler: 'php'}  <? and ?>
    // use: {compiler: 'jsp'}  <% and %>
  
#### register start hook, end hook ####
    umecob.start('modify_id001', function(params) {
      params.tpl_id = '/var/www/hogefuga.net/data/' + params.tpl_id + 'html';
      params.data_id = 'https://example.com/api/q?format=json&' + params.data_id;
    }, false);

    umecob.end('show_tpl001', function(params) {
      console.log(params.tpl);
    }, false);

    umecob({
      use: {binding: {tpl: 'file', data: 'url'}, start: ['modify_id001'], end: ['show_code001']}
      tpl_id: 'hogefuga', // converted to /var/www/hogefuga.net/tpls/hogefuga.html
      data_id: '&id=32&name=piyo', // converted to http://example.com/apis/q?format=json&id=32&name=piyo
    }).next(function(result) {
      // do something.
    });
    

Advanced
----------------
### template ###
#### echo ####
    [% echo("hoge"); %] // replaced with  hoge
#### escape ####
    \[%= hoge %] // not replaced.
#### get whole data ####
    [% var my_whole_data = echo.data; %] // not replaced.
#### use Deferred object ####
    [%@ umecob({tpl: 'hogehoge'}) %] // umecob() returns deferred object. then replaced with the result.

### customizing ###
#### preset ####
    // register preset
    umecob.preset('get_from_example_server', {
      binding: {tpl: 'file', data: 'url'},
      start: ['modify_id001']
    });

    // use preset
    umecob({preset: 'get_from_example_server', tpl_id: 'foo', data: '&id=32&name=piyo'})
    .next(function(result) {
      // do something
    });
    
    // register to a default preset (name : 'plain')
    umecob.use({
      binding: {tpl: 'file'}
    });
    umecob({tpl_id: '/path/to/tempplate'}); // binding of tpl is already set to 'file'
 
#### register binding ####
    umecob.binding('my_new_binding', {
      getTemplate: {
        sync: function(id) {
          // should return template.
        },
        async: function(id) {
          // should return Deferred object
        }
      },
      getData: {
        sync: function(id) {
          // should return data object.
        },
        async: function(id) {
          // should return Deferred object
        }
      }
    }, false);

#### register start hook as for default preset ####
    umecob.start('func1', function(params) {
      // do something
    }, true);

    // OR
    umecob.start('func1', function(params) {
      // do something
    }); // by default, the third argument is true, then added to a default preset.
    // this system is also similar in end, binding, compiler

#### add custom delimiters ####
    // if you wanna set <{ and }> as delimiter.
    umecob.compiler("custom_delim", Umecob.compiler('<','{', '}','>'));
    umecob({use: {compiler: 'custom_delim'}});
    // or umecob.preset('my_setting', {compiler: 'custom_delim'}); // then set to 'my_setting' preset
    // or umecob.use({compiler: 'custom_delim'}); // then set to a default preset


#### remove setting ####
    umecob.start.remove("func1");
    umecob.end.remove("my_end_name");
    umecob.binding.remove("file"); // you can't use file binding anymore.
    umecob.compiler.remove("custom_delim");

### Umecob ###
#### get static values ####
console.log(Umecob.version);
console.log(Umecob.node); //boolean. is node.js or not.

#### create new umecob instance ####
var my_umecob = Umecob('hogefuga'); // new umecob function with id : hogefuga

var annonymous_umecob = Umecob(); // new umecob function with id: new Date().getTime().toString()

var reuse_umecob = Umecob('hogefuga');
console.log(reuse_umecob === my_umecob); // true


### argument options ###
#### modify data after fetched ####
use attach option.
    umecob({
      use: {binding: 'file', compiler: 'php'}.
      tpl: <?=date("Y-m-d H:i:s"); ?>,
      data_id: 'date.js', // Provide date.js contains function 'date'. Then data is parsed as a function.
      attach: function(data) {
        return {date: data}; // convert (function)data to object.
      }
    })
    .next(function(result) {
      console.log(result);
    });


####use different umecob object in compiler####
use umecob option.
    umecob({
      umecob: my_umecob
    });


More Detail
-----------
### How To Write Template ###
see docs/how_to_write_template.md
### How To JavaScript ###
see docs/how_to_write_javascript.md // not created yet...
