try {

// for node.js
if (typeof exports == "object") 
  Deferred = require("./jsdeferred.node.js").Deferred

// for client
if (typeof require == "undefined") 
  require = function(){}


var umecob = ( function() {
  // umecob関数本体
  var UC = function(op) {
    return UC[op.sync ? "sync" : "async"](op)
  }


  // umecobの非同期版
  UC.async = function(op) {
    if (typeof Deferred === "undefined") 
      throw E.ASYNC.DEFERRED_REQUIRED

    return Deferred.parallel({
      tpl: op.tpl 
            ? Deferred.call(function(){return op.tpl})
            : UC.binding().getTemplate.async(op.tpl_id),
      data: op.data 
            ? Deferred.call(function(){return op.data})
            : UC.binding().getData.async(op.data_id),

    }).next( function(val) {
      var compiled = UC.compiler().compile(val.tpl)
      return UC.compiler().run(compiled, val.data);
    })
  }

  // umecobの同期版
  UC.sync = function(op) {
    op.sync = true
    var tpl = op.tpl || UC.binding().getTemplate.sync(op.tpl_id)
    var data = op.data || UC.binding().getData.sync(op.data_id)
    var compiled = UC.compiler().compile(tpl, true)
    return UC.compiler().run(compiled, data)
  }

  // private Preferences. umecob.binding()  or umecob.compiler()
  var Preferences = {
    binding  : "default",
    compiler : "standard"
  }

  UC.use = function(t) {
    return UC.binding(t)
  }

  UC.binding = function() {
    if (arguments.length == 0) {
      // Get Current Binding. returns binding
      return UC.binding.impls[Preferences.binding] || (function(){ throw E.USE.NOTFOUND(Preferences.binding)})()
    }

    if (arguments.length == 1) {
      // Set Current Binding. returns umecob
      Preferences.binding = arguments[0]
      return UC
    }

    if (arguments.length == 2)  {
      // Register Binding. returns umecob
      UC.binding.impls[arguments[0]] = arguments[1]
      return UC.binding(arguments[0])
    }

    throw E.BINDING.INVALID_ARGUMENT
  }
  UC.binding.impls = UC.binding.impls || {}

  // bindingの型
  UC.binding.Interface = function(impl) {
    impl = impl || { getSync: function(){ throw "NOIMPL"}, getAsync: function() { this.getSync() }}
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
  }
  UC.binding("default", new UC.binding.Interface())

  UC.compiler = function() {
    if (arguments.length == 0) {
      return UC.compiler.impls[Preferences.compiler] || (function(){ throw E.COMPILER.NOTFOUND(Preferences.compiler)})()
    }

    if (arguments.length == 1) {
      Preferences.compiler = arguments[0]
      return UC
    }

    if (arguments.length == 2) {
      UC.compiler.impls[arguments[0]] = arguments[1]
      UC.compiler(arguments[0])
      return UC
    }
    throw E.COMPILER.INVALID_ARGUMENT
  }
  UC.compiler.impls = UC.compiler.impls || {}

  /** ERRORS **/
  var E = {
    BASIC : "UmeCob Error.",
    UMECOB: {
      CALL_USE : "Before calling umecob(), you have to specify your environment with \"umecob.use(t);\" where t = 'file', 'url', 'jquery', 'client', or your customized binding." +
      "If you'd like to set your own binding, use "+
      "umecob.binding('someName', {getTemplate: {sync: function(id){}, async: function(id){}},getData: {sync: function(id){}, async: function(id){}}});",
    },
    USE: {
      NOTFOUND: function(t) { return "binding '"+ t +"' not found."}
    },
    COMPILER: {
      NOTFOUND: function(t) { return "compiler '"+ t +"' not found."}
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

// node.js file open binding
umecob.binding("file", (function(T) {
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
})(new umecob.binding.Interface() ))


// node.js url get binding
umecob.binding("url", (function(T) {
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
        d.call.call(d, res)
      })
      return d
    }
  })
})(new umecob.binding.Interface()) )

// jquery ajax binding
umecob.binding("jquery", new umecob.binding.Interface({
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
}))

// client js ajax binding
umecob.binding("client", (function(T) {
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
})(new umecob.binding.Interface()) )

// Standard Compiler
umecob.compiler("standard", (function() {
  var C = {}
  C.compile = function(tpl, sync) { try {
    var tplArr = tpl.replace(/\r(\n)?/g, '\n').replace(/\0/g, '') + '\0'.split(""), // ヌルバイトが終端
        i      = 0,
        state  = {
          name       : "START", 
          buffer     : new T(), 
          stack      : new T(),
          codeBuffer : new T() }
    while ( state.name ) 
      state.name = trans[state.name] ? trans[state.name].call(state, tplArr[i++]) : (function(){ throw "State error: Unknown state '"+ state.name +"' was given."})()

    sync
      ? state.codeBuffer.add("echo.getText()")
      : state.codeBuffer.add("Deferred.parallel(echo.getDefers()).next( function(defers) { for ( var i in defers ){ echo.put(i,defers[i]) } return echo.getText() })")

    return state.codeBuffer.join("\n")

    } catch(e) {
      console.log("ERR OCCURRED DURING COMPILATION")
      console.log(e)
      console.log(e.stack || "no stack")
    }
  }

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
    try {
      return eval(code)
    } catch(e) {
      console.log(e)
    }
  }

  // T: buffer
  var T = function() { this.init() }
    T.prototype.init = function(i, c) { this.i = 0; this.arr = new Array() }
    T.prototype.add = function(c) { this.arr[this.i++] = c }
    T.prototype.push = T.prototype.add
    T.prototype.pop = function() { this.i--; return this.arr.pop() }
    T.prototype.join = function(sep) { return this.arr.join(sep || '') }
    T.prototype.getIndex = function() { return this.i }
    T.prototype.increment = function() { this.i++ }
    T.prototype.get = function(i) { return this.arr[i] }
    T.prototype.put = function(i, c) { this.arr[i] = c }
    T.prototype.clear = T.prototype.init

  // transition functions. These functions are called by fn.call(state), so "this" always means state object.
  var trans = {}

  // 初期状態
  trans["START"] = function(c) {
    switch (c) {
      default:
        this.buffer.add(c)
        return "START"
      case '[':
        return "JS_PRE_START"
      case '\\':
        this.stack.push("START")
        return "ESCAPE"
      case '\0':
        strToCode.call(this)
        return null // 終了
    }
  }

  // [ が出た状態
  trans["JS_PRE_START"] = function(c) {
    switch (c) {
      case '%':
        // strBufferの内容を吐き出す (thisはnew Compiler)
        strToCode.call(this)
        return "JS_WAITING_COMMAND"
      default:
        this.buffer.add('[')
        return trans["START"].call(this, c)
    }
  }

  function strToCode() {
    this.codeBuffer.add('echo("' + this.buffer.join().replace(/\\g/, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"')  + '")')
    this.buffer.clear()
  }

  function insideQuotation(stateName, type) {
    return function(c) {
      switch (c) {
        case type:
          this.buffer.add(c)
          return this.stack.pop()
        default:
          this.buffer.add(c)
          return stateName
        case '\0':
          throw "Syntax error: you have to close quotation."
          return null
      }
    }
  }

  // ' の中の状態
  trans["INSIDE_SQ"] = insideQuotation("INSIDE_SQ", "'")
  // " の中の状態
  trans["INSIDE_DQ"] = insideQuotation("INSIDE_DQ", '"')
  // \ の次
  trans["ESCAPE"] = function(c) {
    switch (c) {
      case '\\':
      case '[':
        this.buffer.add(c)
        return this.stack.pop()
      default:
        this.buffer.add('\\'+c)
        return this.stack.pop()
    }
  }

  // [%
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
        return trans["JS_START"].call(this, c)
    }
  }

  function jsStartTemplate(stateName, preEndStateName) {
    return function(c) {
      switch (c) {
        case '%':
          return preEndStateName
        case "'":
          this.buffer.add(c)
          this.stack.push(stateName)
          return "INSIDE_SQ"
        case '"':
          this.buffer.add(c)
          this.stack.push(stateName)
          return "INSIDE_DQ"
        case '\\':
          this.stack.push(stateName)
          return "ESCAPE"
        default:
          this.buffer.add(c)
          return stateName
        case '\0':
          throw "Syntax error: you have to close [% tag with %] tag."
          return null
      }
    }
  }

  function jsPreEndTemplate(mainStateName, fn) {
    return function(c) {
      switch (c) {
        case ']':
          fn.apply(this)
          return "START"
        default:
          this.buffer.add("%"+c)
          return mainState
        case '\0':
          return trans[mainStateName].call(this, c)
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
})())


} catch (e) {
  console.log("UMECOB ERR")
  console.log(e)
  console.log(e.stack || "no stack")
}

// for node.js
if (typeof exports == "object") {
  exports.umecob = umecob
}
