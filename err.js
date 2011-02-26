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


function invalidMethod() {
  // umecob method name not found
  umecob.user("file")
}
// 
