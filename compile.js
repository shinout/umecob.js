var fs = require("fs")
var print = require("util").print
var tpl = fs.readFileSync('sample.tpl', "utf-8")
var json = eval( "(" + fs.readFileSync('sample.json', "utf-8") + ")")
var Deferred = require("./jsdeferred.node.js").Deferred

function umecob(op) {
  return Deferred.parallel({
    tpl: op.tpl 
          ? function(){ return new Deferred().next(function(){ return op.tpl }) }
          : umecob.getTemplate(op.tpl_id),
    data: op.data
          ? function(){ return new Deferred().next(function(){ return op.data }) }
          : umecob.getData(op.data_id),
  }).next( function(val) {
    var compiled = new Compiler(val.tpl).compile()
    return Compiler.run(compiled, val.data)
  })
}

umecob.getTemplate = function(tpl) {
  var d = new Deferred()
}


umecob.TextBuffer = function() {
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
})(umecob.TextBuffer)


umecob.Compiler = function(tpl) {
  var T= umecob.TextBuffer
  this.tpl              = tpl.replace(/\r(\n)?/g, '\n').replace(/\0/g, '') + '\0' // ヌルバイトを終端と見なすやり方にしてます
  this.state            = "START"
  this.codeBuffer       = new T()
  this.strBuffer        = new T()
  this.jsBuffer         = new T()
  this.jsEchoBuffer     = new T()
  this.jsIncludeBuffer  = new T()
}

(function(C,T) {
  C.run = function(compiled, json) {
    var buff = new T()
    var echo = function(txt) {
      buff.add(txt)
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

    var code = "with(json){" + compiled + "}"
    console.log (code)

    var d = eval(code)
    return d instanceof Deferred ? d : buff.join()
  }

  C.prototype.compile = function() {
    var tplArr      = this.tpl.split(""),
        changeState = this.changeState,
        state       = this.state
        defer       = false

    try {
      i = 0
      while ( state ) {
        var c = tplArr[i++]
        state = changeState[state] ? changeState[state].call(this,c) : (function(){ throw new Error("State error: Unknown state '"+ state +"' was given.")})()
        // print(state+ "\t")
      }

      if (defer) {
        this.codeBuffer.add("Deferred.parallel(echo.getDefers()).next( function(defers) { for ( var i in defers ){ echo.put(i,defers[i].tpl_id) } return echo.getText() })")
      }

      return this.codeBuffer.join("\n")

    } catch(e) {
      return e
    }
  }
  
  // strBufferの内容をコードに起こす
  function strToCode() {
    this.codeBuffer.add('echo("' + escapeForString( this.strBuffer.join() ) + '")')
    this.strBuffer = new T()
  }

  // jsBufferの内容をコードに起こす
  function jsToCode() {
    this.codeBuffer.add( this.jsBuffer.join() )
    this.jsBuffer = new T()
  }

  // jsEchoBufferの内容をコードに起こす
  function jsEchoToCode() {
    this.codeBuffer.add('echo(' + ( this.jsEchoBuffer.join() ) + ')')
    this.jsEchoBuffer = new T()
  }
  // jsIncludeBufferの内容をコードに起こす
  function jsIncludeToCode() {
    //  code:            echo.addDefer(umecob({tpl_id:"sample.tpl", json: "sample.json"}))
    this.codeBuffer.add('echo.addDefer(umecob(' + ( this.jsIncludeBuffer.join() ) + '))')
    defer = true
    this.jsIncludeBuffer = new T()
  }

  function escapeForString(str) {
    return str.replace(/\\g/, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"')
  }


  C.prototype.changeState = { 
    // 初期状態
    "START": function(c) {
      switch (c) {
        default:
          this.strBuffer.add(c)
          return "START"
        case '[':
          return "JS_PRE_START"
        case '\\':
          return "ESCAPE"
        case '\0':
          strToCode.apply(this)
          return null // 終了
      }
    },

    // \ が出た状態
    "ESCAPE": function(c) {
      switch (c) {
        case '\\':
        case '[':
          this.strBuffer.add(c)
          return "START"
        default:
          this.strBuffer.add('\\'+c)
          return "START"
        case '\0':
          this.strBuffer.add('\\'+c)
          strToCode.apply(this)
          return null // 終了
      }
    },

    // [ が出た状態
    "JS_PRE_START": function(c) {
      switch (c) {
        case '%':
          // strBufferの内容を吐き出す (thisはnew Compiler)
          strToCode.apply(this)
          return "JS_WAITING_COMMAND"
        default:
          this.strBuffer.add(c)
          return "START"
        case '\0':
          this.strBuffer.add('['+c)
          strToCode.apply(this)
          return null // 終了
      }
    },

    // [% が出た状態
    "JS_WAITING_COMMAND": function(c) {
      switch (c) {
        case ' ':
          return "JS_WAITING_COMMAND"
        case '=':
          return "JS_ECHO"
        case '{':
          this.jsIncludeBuffer.add(c)
          return "JS_INCLUDE"

        // the same as JS_START
        case '%':
          return "JS_PRE_END"
        case "'":
          this.jsBuffer.add(c)
          return "JS_INSIDE_SQ"
        case '"':
          this.jsBuffer.add(c)
          return "JS_INSIDE_DQ"
        case '\\':
          return "JS_ESCAPE"
        default:
          this.jsBuffer.add(c)
          return "JS_START"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // PARSING JS状態
    "JS_START": function(c) {
      switch (c) {
        case '%':
          return "JS_PRE_END"
        case "'":
          this.jsBuffer.add(c)
          return "JS_INSIDE_SQ"
        case '"':
          this.jsBuffer.add(c)
          return "JS_INSIDE_DQ"
        case '\\':
          return "JS_ESCAPE"
        default:
          this.jsBuffer.add(c)
          return "JS_START"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // %が来て、次は終わるかもしれない状態
    "JS_PRE_END": function(c) {
      switch (c) {
        case ']':
          jsToCode.apply(this)
          return "START"
        default:
          this.jsBuffer.add("%"+c)
          return "JS_START"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // ' の中の状態
    "JS_INSIDE_SQ": function(c) {
      switch (c) {
        case "'":
          this.jsBuffer.add(c)
          return "JS_START"
        default:
          this.jsBuffer.add(c)
          return "JS_INSIDE_SQ"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // " の中の状態
    "JS_INSIDE_DQ": function(c) {
      switch (c) {
        case '"':
          this.jsBuffer.add(c)
          return "JS_START"
        default:
          this.jsBuffer.add(c)
          return "JS_INSIDE_DQ"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // " の中の状態
    "JS_ESCAPE": function(c) {
      switch (c) {
        case '\\':
          this.jsBuffer.add(c)
          return "JS_START"
        default:
          this.jsBuffer.add('\\'+c)
          return "JS_START"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // [%= の中の状態
    "JS_ECHO": function(c) {
      switch (c) {
        case '%':
          return "JS_ECHO_PRE_END"
        default:
          this.jsEchoBuffer.add(c)
          return "JS_ECHO"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // %が来て、次はECHOが終わるかもしれない状態
    "JS_ECHO_PRE_END": function(c) {
      switch (c) {
        case ']':
          jsEchoToCode.apply(this)
          return "START"
        default:
          this.jsEchoBuffer.add(c)
          return "JS_ECHO"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // ECHOでの' の中の状態
    "JS_ECHO_INSIDE_SQ": function(c) {
      switch (c) {
        case "'":
          this.jsEchoBuffer.add(c)
          return "JS_ECHO"
        default:
          this.jsEchoBuffer.add(c)
          return "JS_ECHO_INSIDE_SQ"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // ECHOでの" の中の状態
    "JS_ECHO_INSIDE_DQ": function(c) {
      switch (c) {
        case '"':
          this.jsEchoBuffer.add(c)
          return "JS_ECHO"
        default:
          this.jsEchoBuffer.add(c)
          return "JS_ECHO_INSIDE_DQ"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // " の中の状態
    "JS_ECHO_ESCAPE": function(c) {
      switch (c) {
        case '\\':
          this.jsEchoBuffer.add(c)
          return "JS_ECHO"
        default:
          this.jsEchoBuffer.add('\\'+c)
          return "JS_ECHO"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // [%{ の始まり
    "JS_INCLUDE": function(c) {
      switch (c) {
        case '%':
          return "JS_INCLUDE_PRE_END"
        default:
          this.jsIncludeBuffer.add(c)
          return "JS_INCLUDE"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // %が来て、次はINCLUDEが終わるかもしれない状態
    "JS_INCLUDE_PRE_END": function(c) {
      switch (c) {
        case ']':
          jsIncludeToCode.apply(this)
          return "START"
        default:
          this.jsIncludeBuffer.add(c)
          return "JS_INCLUDE"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // INCLUDEでの' の中の状態
    "JS_INCLUDE_INSIDE_SQ": function(c) {
      switch (c) {
        case "'":
          this.jsIncludeBuffer.add(c)
          return "JS_INCLUDE"
        default:
          this.jsIncludeBuffer.add(c)
          return "JS_INCLUDE_INSIDE_SQ"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // INCLUDEでの" の中の状態
    "JS_INCLUDE_INSIDE_DQ": function(c) {
      switch (c) {
        case '"':
          this.jsIncludeBuffer.add(c)
          return "JS_INCLUDE"
        default:
          this.jsIncludeBuffer.add(c)
          return "JS_INCLUDE_INSIDE_DQ"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },

    // " の中の状態
    "JS_INCLUDE_ESCAPE": function(c) {
      switch (c) {
        case '\\':
          this.jsIncludeBuffer.add(c)
          return "JS_INCLUDE"
        default:
          this.jsIncludeBuffer.add(c)
          return "JS_INCLUDE"
        case '\0':
          throw new Error("Syntax error: you have to close [% tag with %] tag.")
          return null
      }
    },



  }

})(umecob.Compiler,umecob.TextBuffer)

umecob({"tpl": tpl, "data": json})
.next(function(html) { console.log(html) })
