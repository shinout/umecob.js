umecob.js 1.1.0
==========
JavaScript テンプレートエンジン

特徴
----------------

1. ブラウザとNode.jsの両方で利用可能
2. [JSDeferred](https://github.com/cho45/jsdeferred)を用いて非同期処理に対応
3. JavaScriptをテンプレートに書く形式の文法。新しく覚える文法はない。
4. シンプルなAPI. テンプレートとデータを渡して結果を取得する。
5. カスタマイズが簡単

概要
----------------
### インストール方法 ###
    git clone git://github.com/shinout/umecob.js.git
      または
    npm install umecob


### 準備 ###
#### サーバーサイド ####
    var umecob = require("/path/to/umecob/umecob.js");
      または
    var umecob = require("umecob"); // npmでインストールした場合

#### クライアントサイド ####
    <script type="text/javascript" src="/path/to/umecob/jsdeferred.js"></script><!-- for asynchronous use -->
    <script type="text/javascript" src="/path/to/umecob/umecob.js"></script>
    <script type="text/javascript" src="/path/to/umecob/jshint.js"></script><!-- for debug -->


### Hello, World ###
    var template = '[%=foo %], World';
    var values   = { foo: 'Hello'};

#### 同期処理 ####
    var result = umecob({tpl: template, data: values, sync: true});
    console.log(result); // Hello, World

#### 非同期処理 ####
    umecob({tpl: template, data: values})
    .next( function(result) {
      console.log(result); // Hello, World
    });

### バインディング ###
#### サーバーサイド ####
    umecob({use: 'file', tpl_id: '/path/to/template', data_id: '/path/to/data' })
    .next( function(result) {
      // do something
    });

    umecob({use: 'url', tpl_id: 'http://example.com/path/to/template', data_id: 'http://example.com/path/to/data' })
    .next( function(result) {
      // do something
    });


#### クライアントサイド ####
    umecob({use: 'xhr', tpl_id: 'http://example.com/path/to/template', data_id: 'http://example.com/path/to/data' })
    .next( function(result) {
      // do something
    });


    umecob({use: 'jquery', tpl_id: 'http://example.com/path/to/template', data_id: 'http://example.com/path/to/data' })
    .next( function(result) {
      // do something
    });


### テンプレートのサンプル###
    [% var username = "shinout"; %] 
    Hello, [%=username%]! // Hello, shinout!

#### パーシャル(サブテンプレート)を利用####
    [% {tpl: "sample.tpl", data_id:"/data.json" } %]  // パーシャルの内容に置換されます


### カスタマイズ###
#### デリミタの変更 ####
    var template = '<? var a = "hogefuga";?> <? echo("a")?>';
    var result = umecob({use: {compiler: 'php'}, tpl :template, sync: true});
    console.log(result); // "hogefuga"
    // use: {compiler: 'standard'}  [% and %]
    // use: {compiler: 'php'}  <? and ?>
    // use: {compiler: 'jsp'}  <% and %>
  
#### 実行開始時、終了時のHookを登録 ####
    umecob.start('modify_id001', function(params) {
      params.tpl_id = '/var/www/hogefuga.net/data/' + params.tpl_id + 'html';
      params.data_id = 'https://example.com/api/q?format=json&' + params.data_id;
    }, false);

    umecob.end('show_tpl001', function(params) {
      console.log(params.tpl);
    }, false);

    umecob({
      use: {binding: {tpl: 'file', data: 'url'}, start: ['modify_id001'], end: ['show_code001']}
      tpl_id: 'hogefuga', // /var/www/hogefuga.net/tpls/hogefuga.htmlに変換されます
      data_id: '&id=32&name=piyo', // http://example.com/apis/q?format=json&id=32&name=piyoに変換されます
    }).next(function(result) {
      // do something.
    });
    

さらなる使い方
----------------
### テンプレート ###
#### echo 関数 ####
    [% echo("hoge"); %] // "hoge"に置換されます
#### エスケープ ####
    \[%= hoge %] // 置換されません
#### 渡された全変数を取得 ####
    [% var my_whole_data = echo.data; %]
#### Deferredオブジェクトを使用する ####
    [%@ umecob({tpl: 'hogehoge'}) %] // umecob() はDeferred objectを返しますが、ここはumecobの結果に置換されます

### カスタマイズ ###
#### プリセット ####
    // プリセットを登録
    umecob.preset('get_from_example_server', {
      binding: {tpl: 'file', data: 'url'},
      start: ['modify_id001']
    });

    // プリセットを使用
    umecob({preset: 'get_from_example_server', tpl_id: 'foo', data: '&id=32&name=piyo'})
    .next(function(result) {
      // do something
    });
    
    // デフォルトのプリセットに登録 (name : 'plain')
    umecob.use({
      binding: {tpl: 'file'}
    });
    umecob({tpl_id: '/path/to/tempplate'}); // tplのバインディングはすでにfileにセットされています
 
#### バインディングの登録 ####
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

#### Hookのデフォルトプリセットへの登録 ####
    umecob.start('func1', function(params) {
      // do something
    }, true);

    // OR
    umecob.start('func1', function(params) {
      // do something
    }); // by default, the third argument is true, then added to a default preset.
    // this system is also similar in end, binding, compiler

#### デリミタの登録 ####
    // <{ と }> をデリミタに設定
    umecob.compiler("custom_delim", Umecob.compiler('<','{', '}','>'));
    umecob({use: {compiler: 'custom_delim'}});
    // or umecob.preset('my_setting', {compiler: 'custom_delim'}); // then set to 'my_setting' preset
    // or umecob.use({compiler: 'custom_delim'}); // then set to a default preset


#### 設定の削除 ####
    umecob.start.remove("func1");
    umecob.end.remove("my_end_name");
    umecob.binding.remove("file"); // you can't use file binding anymore.
    umecob.compiler.remove("custom_delim");

### Umecob オブジェクト ###
#### staticな値を取得 ####
    console.log(Umecob.version); // バージョン
    console.log(Umecob.node); // boolean. Node.jsかどうか

#### create new umecob instance ####
    var my_umecob = Umecob('hogefuga'); // id : hogefuga のumecobインスタンスを新たに生成

    var annonymous_umecob = Umecob(); // id : new Date().getTime().toString() のumecobインスタンスを新たに生成

    var reuse_umecob = Umecob('hogefuga');
    console.log(reuse_umecob === my_umecob); // true


### 引数のオプション ###
#### データ取得後にそれを変更するオプション ####
'attach' オプション.
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


さらに詳しく
-----------
### テンプレートの書き方 ###
docs/how_to_write_template.mdを参照
### JavaScriptの書き方 ###
docs/how_to_write_javascript.mdを参照
