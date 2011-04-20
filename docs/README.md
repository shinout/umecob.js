umecob.js 1.1.6
==========
JavaScript Template Engine.

Change Log
----------------
* [1.1.1]: Registered to npm
* [1.1.2]: Modified error setting of JSHINT. Modified function 'Umecob.log()'
* [1.1.3]: ${val?:default_val} : set default value and suppress error
* [1.1.4]: asynchronous partial call in sync template will be parsed as synchronous call
* [1.1.5]: fixed a bug of deep partial call
* [1.1.6]: IE8 basic compatibility

Features
----------------

1. Available in both Browsers and Node.js
2. Asynchronous support with [JSDeferred](https://github.com/cho45/jsdeferred)
3. No difficult syntax. Just embed JavaScript in template.
4. Simple API. Just pass template and data. then gets rendered result.
5. Easy to customize

Overview
----------------
### Installation ###
    git clone git://github.com/shinout/umecob.js.git
      OR
    npm install umecob


### Preparation ###
#### Server Side ####
    var umecob = require("/path/to/umecob/umecob.js");
      OR
    var umecob = require("umecob"); // if you've installed via npm

#### Client Side ####
    <script type="text/javascript" src="/path/to/umecob/jsdeferred.js"></script><!-- for asynchronous use -->
    <script type="text/javascript" src="/path/to/umecob/umecob.js"></script>
    <script type="text/javascript" src="/path/to/umecob/jshint.js"></script><!-- for debug -->


### Hello, World ###
    var template = '[%=foo %], World';
    var values   = { foo: 'Hello'};

#### Use Synchronously ####
    var result = umecob({tpl: template, data: values, sync: true});
    console.log(result); // Hello, World

#### Use Asynchronously ####
    umecob({tpl: template, data: values})
    .next( function(result) {
      console.log(result); // Hello, World
    });

### Use Binding ###
#### Server Side ####
    umecob({use: 'file', tpl_id: '/path/to/template', data_id: '/path/to/data' })
    .next( function(result) {
      // do something
    });

    umecob({use: 'url', tpl_id: 'http://example.com/path/to/template', data_id: 'http://example.com/path/to/data' })
    .next( function(result) {
      // do something
    });


#### Client Side ####
    umecob({use: 'xhr', tpl_id: 'http://example.com/path/to/template', data_id: 'http://example.com/path/to/data' })
    .next( function(result) {
      // do something
    });


    umecob({use: 'jquery', tpl_id: 'http://example.com/path/to/template', data_id: 'http://example.com/path/to/data' })
    .next( function(result) {
      // do something
    });


### Sample Template###
    [% var username = "shinout"; %] 
    Hello, [%=username%]! // Hello, shinout!

#### show variable with ${} ####
    Hello, ${username} // Hello, shinout!
    twitter: ${twitter?} // if var 'twitter' is undefined or empty, then replaced with ''
    github: ${github.Account()?:'no account'} // if var 'github.getAccount()' is undefined or empty, then replaced with 'no account'

#### Use Partial Template####
    [% {tpl: "sample.tpl", data_id:"/data.json" } %]  // replaced with result of this partial.


### Customizing###
#### Change Delimiters ####
    var template = '<? var a = "hogefuga";?> <? echo("a")?>';
    var result = umecob({use: {compiler: 'php'}, tpl :template, sync: true});
    console.log(result); // "hogefuga"
    // use: {compiler: 'standard'}  [% and %]
    // use: {compiler: 'php'}  <? and ?>
    // use: {compiler: 'jsp'}  <% and %>
  
#### Register "start" hook, "end" hook ####
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
    

Advanced Use
----------------
### Template ###
#### echo function ####
    [% echo("hoge"); %] // replaced with hoge
#### Escape ####
    \[%= hoge %] // not replaced.
#### Gettin Whole passed data ####
    [% var my_whole_data = echo.data; %]
#### Use Deferred object ####
    [%@ umecob({tpl: 'hogehoge'}) %] // umecob() returns deferred object. then replaced with the result.

### Customizing ###
#### Preset ####
    // Register Preset
    umecob.preset('get_from_example_server', {
      binding: {tpl: 'file', data: 'url'},
      start: ['modify_id001']
    });

    // Use Preset
    umecob({preset: 'get_from_example_server', tpl_id: 'foo', data: '&id=32&name=piyo'})
    .next(function(result) {
      // do something
    });
    
    // Register to a default preset (name : 'plain')
    umecob.use({
      binding: {tpl: 'file'}
    });
    umecob({tpl_id: '/path/to/tempplate'}); // binding of tpl is already set to file
 
#### Register Bindings ####
    umecob.binding('my_new_binding', {
      getTemplate: {
        sync: function(id) {
          // 
        },
        async: function(id) {
          // 
        }
      },
      getData: {
        sync: function(id) {
          // 
        },
        async: function(id) {
          // 
        }
      }
    }, false);

#### Register start hook as for default preset ####
    umecob.start('func1', function(params) {
      // do something
    }, true);

    // OR
    umecob.start('func1', function(params) {
      // do something
    }); // by default, the third argument is true, then added to a default preset.
    // this system is also similar in end, binding, compiler

#### Register Custom Delimiters ####
    // if you wanna set <{ and }> as delimiter
    umecob.compiler("custom_delim", Umecob.compiler('<','{', '}','>'));
    umecob({use: {compiler: 'custom_delim'}});
    // or umecob.preset('my_setting', {compiler: 'custom_delim'}); // then set to 'my_setting' preset
    // or umecob.use({compiler: 'custom_delim'}); // then set to a default preset


#### Remove Setting ####
    umecob.start.remove("func1");
    umecob.end.remove("my_end_name");
    umecob.binding.remove("file"); // you can't use file binding anymore.
    umecob.compiler.remove("custom_delim");

### Umecob object ###
#### Get Static Values ####
    console.log(Umecob.version); // version
    console.log(Umecob.node); // boolean. is Node.js or not.

#### create new umecob instance ####
    var my_umecob = Umecob('hogefuga'); // new umecob function with id : hogefuga

    var annonymous_umecob = Umecob(); // new umecob function with id : new Date().getTime().toString()

    var reuse_umecob = Umecob('hogefuga');
    console.log(reuse_umecob === my_umecob); // true


### Argument Options ###
#### Modify data after fetched ####
'attach' option.
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


More Detail
-----------
### How to write Templates ###
see docs/how_to_write_template.md
### How to write JavaScript ###
see docs/how_to_write_javascript.md
