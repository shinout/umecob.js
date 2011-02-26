var umecob = require("./umecob.js")

function argMistake() {
  // commonly mistaken problem
  umecob("template", "file")
}
//argMistake()

function invalidMethod() {
  // umecob method name not found
  umecob.user("file")
}
//invalidMethod()


function invalidType() {
  // umecob method name not found
  umecob.use("file")({tpl_id: "hoge", data_id: {title: "title"}})
}
invalidType()
