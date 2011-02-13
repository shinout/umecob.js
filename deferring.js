var Deferred = require("./jsdeferred.node.js").Deferred

function TextBuffer() {
  this.i = 0
  this.arr = new Array()
}

(function(T) {
  T.prototype.add = function(c) {
    this.arr[this.i++] = c
  }

  T.prototype.join = function(sep) {
    return this.arr.join(sep || '')
  }

  T.prototype.getIndex = function() {
    return this.i
  }

  T.prototype.increment = function() {
    this.i++
  }

  T.prototype.get = function(i) {
    return this.arr[i]
  }

  T.prototype.put = function(i, c) {
    this.arr[i] = c
  }
})(TextBuffer)

var buff = new TextBuffer()
var echo = function(str) {
  buff.add(str)
}

  echo.defers = {}
  echo.addDefer = function(d) {
    echo.defers[buff.getIndex()] = d
    buff.increment()
  }

  echo.put = function(i, v) {
    buff.put(i, v)
  }

  echo.getDefers = function() {
    return echo.defers
  }

  echo.getText = function() {
    return buff.join()
  }


var umecob = function(op) {
  var d = new Deferred()
  setTimeout( function() {
    d.call.call(d, op)
  }, 2000)
  return d
}

function run() {
  echo("a")
  echo("b")
  echo.addDefer( umecob({tpl_id:"sample.tpl", json: "sample.json"}) )
  echo("c")
  echo("d")
  echo.addDefer( umecob({tpl_id:"sample.tpl", json: "sample.json"}) )
  echo("e")
  echo("f")
  return Deferred.parallel(echo.getDefers()).next( function(defers) { for ( var i in defers ){ echo.put(i,defers[i].tpl_id) } return echo.getText() })
}

run().next(function(result){
  console.log(result)
})
