try {
var umecob,
    Deferred = Deferred || null

// for node.js
if (typeof exports == "object") {
  Deferred = require("./jsdeferred.node.js").Deferred
}

// for client
if (typeof require == "undefined") {
  require = function(){}
}

umecob = ( function() {

  // umecob関数本体
  var UC = function(op) {
    if ( !UC.binding() ) 
      throw E.UMECOB.CALL_USE
      UC.start.fire(op) // dispatch Event:"start"
      return UC[op.sync ? "sync" : "async"](op)
  }

  var selectedBinding = false

  UC.use = function(t) {
    var b = UC.binding[t] || (function(){ throw E.USE.NOTFOUND(t)})()
    b.init ? b.init() : (function(){ throw E.USE.INIT_NOTFOUND(t)})()
    selectedBinding = b
    return UC
  }

  UC.binding = function() {
    if (arguments.length == 0) 
      return selectedBinding

    if (arguments.length != 2) 
      throw E.BINDING.INVALID_ARGUMENT
    var name = arguments[0]
    var hoge = arguments[1]

    return UC
  }


  // bindingの型 new UC.binding.Trait() とするとよい
  var Trait = function(impl) {
    impl = impl || {}
    var jsonize = function(str) {
      try {
        return eval("("+str+")") 
      } catch (e) {
        console.log("ERROR OCCUERED DURING JSONIZE")
        console.log(e)
      }
    }
    this.impl = function(obj) { impl = obj; return this }
    this.getTemplate = { 
      sync: function(id) { return impl.getSync(id) },
      async: function(id) { return impl.getAsync(id) },
    }
    this.getData = {
      sync: function(id) { 
        var data = impl.getSync(id)
        return (typeof data == "string") ? jsonize(data) : data
      },
      async: function(id) {
        return impl.getAsync(id).next(function(data) {
          return (typeof data == "string") ? jsonize(data) : data
        }) 
      }
    }
    this.init = function() {
    }
  }

  // 外部のbindingユーザーにTrait型を公開
  UC.binding.Trait = Trait


  // node.js file open binding
  UC.binding.file = (function(T) {
    var fs = require("fs")
    return T.impl({

      getSync : function(id) {
        return fs.readFileSync(id, "utf-8")
      },

      getAsync : function(id) {
        var d = new Deferred().next(function(str) {
          return str
        })
        fs.readFile(id, "utf-8", function(e, str){
          d.call.call(d, str)
        })
        return d
      }
    })
  })(new Trait())

  // file のエイリアスとしてnode を登録
  UC.binding.node = UC.binding.file

  // node.js url get binding
  UC.binding.url = (function(T) {
    var url  = require("url")
    var http = require("http")
    return T.impl({

      getSync : function(id) {
        throw BINDING.URL_SYNC
      },

      getAsync : function(id) {
        var d = new Deferred().next(function(str) {
          return str
        })
        var op = url.parse(id)
        http.get({
          host: op.hostname || "localhost",
          port: op.port || 80,
          path: ( (op.pathname.slice(0,1) == "/") ? "" : "/" ) + op.pathname + (op.search || "")
        }, function(res){
          //console.log(res)
          d.call.call(d, res)
        })
        return d
      }
    })
  })(new Trait())

  // jquery ajax binding
  UC.binding.jquery = ( function() {
    return new Trait({
      getSync : function(id) {
        var str
        jQuery.ajax({
          url: id,
          type: "GET",
          async: false,
          success: function(res) {
            str = res
          }
        })
        return str
      },

      getAsync : function(id) {
        var str 
          , d = new Deferred().next(function(str) {
          return str
        })
        jQuery.ajax({
          url     : id,
          type    : 'GET',
          success : function(res) {
            d.call.call(d, res)
          }
        })
        return d
      }
    })
  })()

  // client js ajax binding
  UC.binding.client = (function(T) {
    var Request = function(){
      return typeof(ActiveXObject) !== "undefined"   
        ? new ActiveXObject("Msxml2.XMLHTTP") || new ActiveXObject("Microsoft.XMLHTTP")
        : new XMLHttpRequest()
	  }

    return T.impl({
      getSync : function(id) {
        var request = new Request()
        request.open("GET", id, false)
        if ( request.status == 404 || request.status == 2 ||(request.status == 0 && request.responseText == '') ) return null
        return request.responseText
      },

      getAsync : function(id) {
        var request = new Request()
        var d = new Deferred().next(function(str) {
          return str
        })

        request.onreadystatechange = function(){
          if(request.readyState == 4){
            d.call.call(d, str)
          }
        }
        request.open("GET", id)
        request.send(null)
        return d
      }
    })
  })(new Trait())

  // umecobの非同期版
  UC.async = function(op) {
    if (typeof Deferred === "undefined") {
      throw E.ASYNC.DEFERRED_REQUIRED
    }
    return Deferred.parallel({
      tpl: op.tpl 
            ? Deferred.call(function(){return op.tpl})
            : UC.binding().getTemplate.async(op.tpl_id),
      data: op.data 
            ? Deferred.call(function(){return op.data})
            : UC.binding().getData.async(op.data_id),

    }).next( function(val) {
      op.tpl = val.tpl
      op.data = val.data
      UC.fetched.fire(op) // dispatch Event:"fetched"
      var compiler = new Compiler(op.tpl, op.sync || false).compile()
      op.compiled = compiler.compiled
      UC.compiled.fire(op) // dispatch Event:"compiled"
      return compiler.run(op.data).next(function(rendered) {
        op.rendered = rendered
        UC.rendered.fire(op) // dispatch Event:"rendered"
        return op.rendered
      })
    })
  }

  // umecobの同期版
  UC.sync = function(op) {
    op.sync = true
    op.tpl = op.tpl || UC.binding().getTemplate.sync(op.tpl_id)
    op.data = op.data || UC.binding().getData.sync(op.data_id)
    UC.fetched.fire(op) // dispatch Event:"fetched"
    var compiler = new Compiler(op.tpl, op.sync || false).compile()
    op.compiled = compiler.compiled
    UC.compiled.fire(op) // dispatch Event:"compiled"
    op.rendered = compiler.run(op.data)
    UC.rendered.fire(op) // dispatch Event:"rendered"
    return op.rendered
  }

  // Events
  function Evt(defaultName) {
    var i = 0

    // 本体
    var Ev = function() {
      if ( typeof arguments[0] === "function") {
        this.funcs[defaultName + i++] = arguments[0]
      } else if(arguments.length != 2 ) {
        throw E.EVT.INVALID_ARGUMENTS
      } else {
        this.funcs[arguments[0]] = arguments[1]
      }
    }

    Ev.funcs = {}
    Ev.fire = function() {
      for (var j in Ev.funcs) {
        if (typeof Ev.funcs === "function") {
          var args = arguments
          var func = Ev.funcs[j]
          setTimeout( function(){ func.apply(Ev, args)}, 0)
        }
      }
    }

    return Ev
  }

  UC.start    = Evt("start")
  UC.fetched  = Evt("fetched")
  UC.compiled = Evt("compiled")
  UC.rendered = Evt("rendered")


  var TextBuffer = (function() {
    var T = function() {
      this.init()
    }

    T.prototype.init = function(i, c) {
      this.i = 0
      this.arr = new Array()
    }

    T.prototype.add = function(c) {
      this.arr[this.i++] = c
    }

    T.prototype.push = T.prototype.add

    T.prototype.pop = function() {
      this.i--
      return this.arr.pop()
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

    T.prototype.clear = T.prototype.init

    return T
  })()

  var Compiler = (function(T) {

    var C = function(tpl, sync) {
      this.tpl              = tpl.replace(/\r(\n)?/g, '\n').replace(/\0/g, '') + '\0' // ヌルバイトを終端と見なすやり方にしてます
      this.compiled         = null
      this.state            = "START"
      this.codeBuffer       = new T()
      this.buffer           = new T()
      this.sync            = (sync) ? true : false
    }

    C.prototype.compile = function() {
      var tplArr      = this.tpl.split(""),
          trans       = this.transitions,
          state       = this.state,
          tmp         = this.tmpBuffer,
          codes       = this.codeBuffer

      try {
        i = 0
        while ( state ) {
          var c = tplArr[i++]
          var oldstate = state
          state = trans[state] ? trans[state].call(this,c) : (function(){ throw "State error: Unknown state '"+ state +"' was given."})()
          console.log(oldstate + "=>" + c + "で" +state)
        }

        (this.sync) 
          ? this.codeBuffer.add("echo.getText()")
          : this.codeBuffer.add("Deferred.parallel(echo.getDefers()).next( function(defers) { for ( var i in defers ){ echo.put(i,defers[i]) } return echo.getText() })")

        this.compiled = this.codeBuffer.join("\n")
        return this

      } catch(e) {
        console.log("ERR OCCURRED DURING COMPILATION")
        console.log(e)
        console.log(e.stack || "no stack")
      }
    }
    
    C.prototype.run = function(json) {
      if ( compiled === null ) {
        throw "please run after compile()"
      }
      var compiled = this.compiled
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
      try {
        return eval(code)
      } catch(e) {
        console.log(e)
      }
    }

    function strToCode() {
      this.codeBuffer.add('echo("' + this.buffer.join().replace(/\\g/, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"')  + '")')
      this.buffer.clear()
    }

    var trans = {}
    C.prototype.transitions = trans 
    trans.stack = new T()

    // 初期状態
    trans["START"] = function(c) {
      switch (c) {
        default:
          this.buffer.add(c)
          return "START"
        case '[':
          return "JS_PRE_START"
        case '\\':
          this.transitions.stack.push("START")
          return "ESCAPE"
        case '\0':
          strToCode.apply(this)
          return null // 終了
      }
    }

    // [ が出た状態
    trans["JS_PRE_START"] = function(c) {
      switch (c) {
        case '%':
          // strBufferの内容を吐き出す (thisはnew Compiler)
          strToCode.apply(this)
          return "JS_WAITING_COMMAND"
        default:
          this.buffer.add('[')
          return this.transitions["START"].call(this, c)
      }
    }

    function insideQuotation(state, type) {
      return function(c) {
        switch (c) {
          case type:
            this.buffer.add(c)
            console.log(this.transitions.stack)
            return this.transitions.stack.pop()
          default:
            this.buffer.add(c)
            return state
          case '\0':
            throw "Syntax error: you have to close quotation."
            return null
        }
      }
    }

    // ' の中の状態
    trans["INSIDE_SQ"] = insideQuotation("INSIDE_SQ", "'")
    trans["INSIDE_DQ"] = insideQuotation("INSIDE_DQ", '"')
    trans["ESCAPE"] = function(c) {
      switch (c) {
        case '\\':
        case '[':
          this.buffer.add(c)
          return this.transitions.stack.pop()
        default:
          this.buffer.add('\\'+c)
          return this.transitions.stack.pop()
      }
    }

    // [% が出た状態
    trans["JS_WAITING_COMMAND"] = function(c) {
      switch (c) {
        case ' ':
          return "JS_WAITING_COMMAND"
        case '=':
          return "JS_ECHO"
        case '{':
          this.buffer.add(c)
          return "JS_INCLUDE"
        case '@':
          return "JS_ASYNC"

        // the same as JS_START
        default:
          return this.transitions["JS_START"].call(this, c)
      }
    }

    function jsStartTemplate(state,preEndState) {
      return function(c) {
        switch (c) {
          case '%':
            return preEndState
          case "'":
            this.buffer.add(c)
            this.transitions.stack.push(state)
            return "INSIDE_SQ"
          case '"':
            this.buffer.add(c)
            this.transitions.stack.push(state)
            return "INSIDE_DQ"
          case '\\':
            this.transitions.stack.push(state)
            return "ESCAPE"
          default:
            this.buffer.add(c)
            return state
          case '\0':
            throw "Syntax error: you have to close [% tag with %] tag."
            return null
        }
      }
    }

    function jsPreEndTemplate(mainState, fn) {
      return function(c) {
        switch (c) {
          case ']':
            fn.apply(this)
            return "START"
          default:
            this.buffer.add("%"+c)
            return mainState
          case '\0':
            return this.transitions[mainState].call(this, c)
        }
      }
    }

    // [%
    trans["JS_START"] = jsStartTemplate("JS_START", "JS_PRE_END")
    trans["JS_PRE_END"] = jsPreEndTemplate("JS_START", function() {
      this.codeBuffer.add( this.buffer.join() )
      this.buffer.clear()
    })

    // [%=
    trans["JS_ECHO"] = jsStartTemplate("JS_ECHO", "JS_ECHO_PRE_END")
    trans["JS_ECHO_PRE_END"] = jsPreEndTemplate("JS_ECHO", function() {
      this.codeBuffer.add('echo(' + ( this.buffer.join() ) + ')')
      this.buffer.clear()
    })

    // [%{ 
    trans["JS_INCLUDE"] = jsStartTemplate("JS_INCLUDE", "JS_INCLUDE_PRE_END")
    trans["JS_INCLUDE_PRE_END"] = jsPreEndTemplate("JS_INCLUDE", function() {
      ( this.sync ) 
        ? this.codeBuffer.add('echo(umecob.sync(' + ( this.buffer.join() ) + '))')
        : this.codeBuffer.add('echo.addDefer(umecob(' + ( this.buffer.join() ) + '))')
      this.buffer.clear()
    })

    // [%@
    trans["JS_ASYNC"] = jsStartTemplate("JS_ASYNC", "JS_ASYNC_PRE_END")
    trans["JS_ASYNC_PRE_END"] = jsPreEndTemplate("JS_ASYNC", function() {
      ( this.sync ) 
        ? this.codeBuffer.add( this.buffer.join() )
        : this.codeBuffer.add('echo.addDefer(' + ( this.buffer.join() ) + ')')
      this.buffer.clear()
    })

    return C
  })(TextBuffer)

  /** ERRORS **/
  var E = {
    BASIC : "UmeCob Error.",
    UMECOB: {
      CALL_USE : "Before calling umecob(), you have to specify your environment with \"umecob.use(t);\" where t = 'file', 'url', 'jquery', 'client', or your customized binding." +
      "If you'd like to set your own binding, use "+
      "umecob.binding('someName', {getTemplate: {sync: function(id){}, async: function(id){}},getData: {sync: function(id){}, async: function(id){}}});",
    },
    USE: {
      NOTFOUND: function(t) { return "binding '"+ t +"' not found."},
      INIT_NOTFOUND: function(t) { return "binding '"+ t +"' doesn't have init() method."},
    },
    BINDING: {
      INVALID_ARGUMENT: "invalid argument. you must input 2 arguments, first argument is the name of your binding, and second is the setting of the binding.",
    },
    ASYNC: {
      DEFERRED_REQUIRED: "If you use umecob() asynchronously, you have to include \"JSDeferred\" library. Go to https://github.com/cho45/jsdeferred then download it.",
    },
    EVT: {
      INVALID_ARGUMENTS: "if you bind event to umecob, you should input one argument :function, or two arguments: string and function.",
    }
  }
  return UC
})()

} catch (e) {
  console.log("UMECOB ERR")
  console.log(e)
  console.log(e.stack || "no stack")
}

// for node.js
if (typeof exports == "object") {
  exports.umecob = umecob
}

