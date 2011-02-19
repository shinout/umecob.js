var umecob = require("./umecob.js").umecob

// umecob
try {
  console.log(umecob)

function ucfile() {
  umecob.use("file")({tpl_id: "tpls/sample.tpl", data_id: "data/sample.json"})
  .next(function(html) {console.log(html) })
}

function ucSync() {
  var fs = require("fs")
  var tpl = fs.readFileSync('tpls/sample.tpl', "utf-8")
  var json = eval( "(" + fs.readFileSync('data/sample.json', "utf-8") + ")")
  console.log( umecob.use("node")({tpl: tpl, data: json, "sync": true}) )
}

function ucUrl() {
  umecob.use("url")({tpl: "tpl", data_id: "http://api.rakuten.co.jp/rws/1.12/json"})
  .next(function(html) {console.log(html) })
}

// ucUrl()

// cache
var cache = {}
umecob.compiled(function(op){
  cache[op.tpl_id || op.tpl] = opl
})

} catch (e) {
  console.log(e)
  console.log(e.stack || "no stack")
}
