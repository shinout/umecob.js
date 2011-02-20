var umecob = require("./umecob.js")

for (var i in umecob) {
  console.log(i)
}

// umecob
function ucFile() {
  umecob.use("file")({tpl_id: "tpls/sample.tpl", data_id: "data/sample.json"})
  .next(function(html) {console.log(html) })
}

function ucFileSync() {
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
  umecob.use("url")({tpl: "tpl", data_id: "http://api.rakuten.co.jp/rws/1.12/json"})
  .next(function(html) {console.log(html) })
}

function ucNonUse() {
  umecob({tpl_id: "tpls/sample.tpl", data_id: "data/sample.json", binding: "file"})
  .next(function(html) {console.log(html) })
}

// ucUrl()
//ucNonUse()
//ucFile()
//ucFileSync()
//ucDefaultId()

