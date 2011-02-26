var umecob = require("../umecob.js")

function argMistake() {
  umecob("template", "file")
  .next(function(result){ console.log(result)})
}
//argMistake()

function invalidBinding() {
  umecob.use("flie")({tpl: "hoge", data_id: {title: "title"}})
  .next(function(result){ console.log(result)})
}
//invalidBinding()


function invalidMethod() {
  umecob.user("file")
}
//invalidMethod()


function invalidDataIdType() {
  umecob.use("file")({tpl: "hoge", data_id: {title: "title"}})
  .next(function(result){ console.log(result)})
}
//invalidDataIdType()

function invalidTplIdType() {
  umecob.use("file")({tpl_id: {}, data: {title: "title"}})
  .next(function(result){ console.log(result)})
}
//invalidTplIdType()

function invalidDataType() {
  umecob.use("file")({tpl: "template", data: '{title: "title"}'})
  .next(function(result){ console.log(result)})
}
//invalidDataType()

function invalidTplType() {
  umecob.use("file")({tpl: {}, data: {title: "title"}})
  .next(function(result){ console.log(result)})
}
//invalidTplType()

function invalidFileName() {
  umecob.use("file")({tpl_id: "hoge", data: {title: "title"}})
  .next(function(result){ console.log(result)})
}
//invalidFileName()


function syntaxError01() {
  umecob.use("file")({tpl_id: "test/tpls/syntax_error01.tpl", data: {title: "title"}})
  .next(function(result){ console.log(result)})
}
syntaxError01()


