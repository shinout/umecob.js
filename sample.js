var umecob = require("./umecob.js")

function umecobProp() {
  for (var i in umecob) {
    console.log(i)
  }
}

function ucFile() {
  umecob.use("file")({tpl_id: "tpls/sample.tpl", data_id: "data/sample.json"})
  .next(function(html) {console.log(html) })
}

function ucFileSync() {
  var html = umecob.use("file")({tpl_id: "tpls/sample.tpl", data_id: "data/sample.json", sync: true})
  console.log(html)
}

function ucStatic() {
  var fs = require("fs")
  var tpl = fs.readFileSync('tpls/sample.tpl', "utf-8")
  var json = eval( "(" + fs.readFileSync('data/sample.json', "utf-8") + ")")
  console.log( umecob.use("file")({tpl: tpl, data: json, sync: true}) )
}

function ucDefault() {
  umecob.use("default")({tpl: "[%=url%]とかどうなんでしょう。", data: {url: "http://api.rakuten.co.jp/rws/1.12/json"}})
  .next(function(html) {console.log(html) })
}

function ucDefaultId() {
  umecob.use("default")({tpl_id: "hogehoge", data_id: "okok"})
  .next(function(html) {console.log(html) })
}

function ucUrl() {
  umecob.binding("file_url", { 
    getTemplate : umecob.binding("file").getTemplate,
    getData     : umecob.binding("url").getData
  })

  umecob.use("file_url")({tpl_id: "tpls/rakuten.tpl", data_id: "http://api.rakuten.co.jp/rws/1.12/json"})
  .next(function(html) {console.log(html) })
}

function ucNonUse() {
  umecob({tpl_id: "tpls/sample.tpl", data_id: "data/sample.json", binding: "file"})
  .next(function(html) {console.log(html) })
}

function ucStartEndFile() {
  umecob.use("file").start(function(input, output){
    output.result = "HOGE"
  }).end(function(input, output){
    console.log(input.tpl_id)
  })
  ({tpl_id: "tpls/sample.tpl", data_id: "data/sample.json"})
  .next(function(html) {console.log(html) })
}

function ucStartEndFileSync() {
  var html = umecob.use("file").start(function(input, output){
    output.result = "HOGE"
  }).end(function(input, output){
    console.log(input.tpl_id)
  })
  ({tpl_id: "tpls/sample.tpl", data_id: "data/sample.json", sync: true})
  console.log(html)
}

function ucCacheSync() {
  var db = {}
  umecob.use("file").start(function(input, output){
    if ( typeof db[input.tpl_id] != "undefined") {
      output.code = db[input.tpl_id]
    }
  }).end(function(input, output){
    if (input.tpl_id) {
      db[input.tpl_id] = "console.log('HOGEEEEEEEE');"+ output.code
    }
  })

  console.log (umecob({tpl_id: "tpls/sample.tpl", data_id: "data/sample.json", sync: true}) )
  console.log (umecob({tpl_id: "tpls/sample.tpl", data_id: "data/sample.json", sync: true}) )
  console.log (umecob({tpl_id: "tpls/sample.tpl", data_id: "data/sample.json", sync: true}) )
}


ucUrl()
//ucNonUse()
//ucFile()
//ucFileSync()
//ucStartEndFile()
//ucStartEndFileSync()
//ucCacheSync()
//ucDefaultId()

