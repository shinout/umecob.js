umecob.js ${Umecob.version}
==========
JavaScript ${templateEngine}

${changeLog}
----------------
<< for (var i in changeLogs) { >>
* [${i}]: ${changeLogs[i]}
<< } >>

${features}
----------------

1. ${available}
2. ${asyncSupport('[JSDeferred](https://github.com/cho45/jsdeferred)')}
3. ${noDifficultSyntax}
4. ${simpleAPI}
5. ${easyToCustomize}

${overView}
----------------
### ${installation} ###
    git clone git://github.com/shinout/umecob.js.git
      ${_OR}
    npm install umecob


### ${preparation} ###
#### ${serverSide} ####
    var umecob = require("/path/to/umecob/umecob.js");
      ${_OR}
    var umecob = require("umecob"); // ${ifYouNPM}

#### ${clientSide} ####
    <script type="text/javascript" src="/path/to/umecob/jsdeferred.js"></script><!-- for asynchronous use -->
    <script type="text/javascript" src="/path/to/umecob/umecob.js"></script>
    <script type="text/javascript" src="/path/to/umecob/jshint.js"></script><!-- for debug -->


### Hello, World ###
    var template = '[%=foo %], World';
    var values   = { foo: 'Hello'};

#### ${useSynchronously} ####
    var result = umecob({tpl: template, data: values, sync: true});
    console.log(result); // Hello, World

#### ${useAsynchronously} ####
    umecob({tpl: template, data: values})
    .next( function(result) {
      console.log(result); // Hello, World
    });

### ${useBinding} ###
#### ${serverSide} ####
    umecob({use: 'file', tpl_id: '/path/to/template', data_id: '/path/to/data' })
    .next( function(result) {
      // do something
    });

    umecob({use: 'url', tpl_id: 'http://example.com/path/to/template', data_id: 'http://example.com/path/to/data' })
    .next( function(result) {
      // do something
    });


#### ${clientSide} ####
    umecob({use: 'xhr', tpl_id: 'http://example.com/path/to/template', data_id: 'http://example.com/path/to/data' })
    .next( function(result) {
      // do something
    });


    umecob({use: 'jquery', tpl_id: 'http://example.com/path/to/template', data_id: 'http://example.com/path/to/data' })
    .next( function(result) {
      // do something
    });


### ${sampleTemplate}###
    [% var username = "shinout"; %] 
    Hello, [%=username%]! // Hello, shinout!

#### ${shortTag} ####
    Hello, \${username} // Hello, shinout!
    twitter: \${twitter?} // if var 'twitter' is undefined or empty, then replaced with ''
    github: \${github.Account()?:'no account'} // if var 'github.getAccount()' is undefined or empty, then replaced with 'no account'

#### ${usePartial}####
    [% {tpl: "sample.tpl", data_id:"/data.json" } %]  // ${withPartial}


### ${customizing}###
#### ${changeDelimiter} ####
    var template = '<? var a = "hogefuga";?> <? echo("a")?>';
    var result = umecob({use: {compiler: 'php'}, tpl :template, sync: true});
    console.log(result); // "hogefuga"
    // use: {compiler: 'standard'}  [% and %]
    // use: {compiler: 'php'}  <? and ?>
    // use: {compiler: 'jsp'}  <% and %>
  
#### ${registerHook} ####
    umecob.start('modify_id001', function(params) {
      params.tpl_id = '/var/www/hogefuga.net/data/' + params.tpl_id + 'html';
      params.data_id = 'https://example.com/api/q?format=json&' + params.data_id;
    }, false);

    umecob.end('show_tpl001', function(params) {
      console.log(params.tpl);
    }, false);

    umecob({
      use: {binding: {tpl: 'file', data: 'url'}, start: ['modify_id001'], end: ['show_code001']}
      tpl_id: 'hogefuga', // ${convertedTo('/var/www/hogefuga.net/tpls/hogefuga.html')}
      data_id: '&id=32&name=piyo', // ${convertedTo('http://example.com/apis/q?format=json&id=32&name=piyo')}
    }).next(function(result) {
      // do something.
    });
    

${advanced}
----------------
### ${template} ###
#### echo ${echo.data['function']} ####
    [% echo("hoge"); %] // ${replacedWith('hoge')}
#### ${escape} ####
    \[%= hoge %] // ${notReplaced}
#### ${getWholeData} ####
    [% var my_whole_data = echo.data; %]
#### ${useDeferred} ####
    [%@ umecob({tpl: 'hogehoge'}) %] // ${withDeferred}

### ${customizing} ###
#### ${preset} ####
    // ${registerPreset}
    umecob.preset('get_from_example_server', {
      binding: {tpl: 'file', data: 'url'},
      start: ['modify_id001']
    });

    // ${usePreset}
    umecob({preset: 'get_from_example_server', tpl_id: 'foo', data: '&id=32&name=piyo'})
    .next(function(result) {
      // do something
    });
    
    // ${toDefaultPreset} (name : 'plain')
    umecob.use({
      binding: {tpl: 'file'}
    });
    umecob({tpl_id: '/path/to/tempplate'}); // ${bindingSet('file')}
 
#### ${registerBinding} ####
    umecob.binding('my_new_binding', {
      getTemplate: {
        sync: function(id) {
          // ${returns(template)}
        },
        async: function(id) {
          // ${returns('Deferred' + echo.data['object'])}
        }
      },
      getData: {
        sync: function(id) {
          // ${returns('data ' + echo.data['object'])}
        },
        async: function(id) {
          // ${returns('Deferred' + echo.data['object'])}
        }
      }
    }, false);

#### ${registerHooks} ####
    umecob.start('func1', function(params) {
      // do something
    }, true);

    // OR
    umecob.start('func1', function(params) {
      // do something
    }); // by default, the third argument is true, then added to a default preset.
    // this system is also similar in end, binding, compiler

#### ${customDelimiters} ####
    // ${setDelimiters('<{','}>')}
    umecob.compiler("custom_delim", Umecob.compiler('<','{', '}','>'));
    umecob({use: {compiler: 'custom_delim'}});
    // or umecob.preset('my_setting', {compiler: 'custom_delim'}); // then set to 'my_setting' preset
    // or umecob.use({compiler: 'custom_delim'}); // then set to a default preset


#### ${removeSetting} ####
    umecob.start.remove("func1");
    umecob.end.remove("my_end_name");
    umecob.binding.remove("file"); // you can't use file binding anymore.
    umecob.compiler.remove("custom_delim");

### Umecob ${object} ###
#### ${getStaticValues} ####
    console.log(Umecob.version); // ${version}
    console.log(Umecob.node); // boolean. ${isNodeOrNot}

#### create new umecob instance ####
    var my_umecob = Umecob('hogefuga'); // ${createNewUmecob('hogefuga')}

    var annonymous_umecob = Umecob(); // ${createNewUmecob('new Date().getTime().toString()')}

    var reuse_umecob = Umecob('hogefuga');
    console.log(reuse_umecob === my_umecob); // true


### ${argumentOptions} ###
#### ${attachOption} ####
'attach' ${option}.
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


${moreDetail}
-----------
### ${howToWriteTpl} ###
${see('docs/how_to_write_template.md')}
### ${howToWriteJS} ###
${see('docs/how_to_write_javascript.md')}
