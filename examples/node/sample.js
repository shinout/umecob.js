var umecob = require("../../umecob.js")

umecob.use("file")({tpl_id: "sample.tpl", data: {title: "umecob * node", list: {key1: "val1", key2: "val2"}}  })
.next(function(result) {
  console.log(result)
})

