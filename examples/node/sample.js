var umecob = require("../../umecob.js")

/*** use filesystem ***/

/* asynchronous */
umecob.use("file")({tpl_id: "examples/node/file_async.tpl", data: {title: "Asynchronous call of umecob", list: {key1: "val1", key2: "val2"}}  })
.next(function(result) {
  console.log(result)
})

/* synchronous */
var result = umecob.use("file")({sync: true, tpl_id: "examples/node/file_sync.tpl", data: {name: "ya", method: "Synchronous"}  })
console.log(result)

