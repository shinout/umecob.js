try {
if (typeof module == "object") {
  Deferred = require("./jsdeferred.node.js").Deferred
} else {
  var require = function(){}
}

var umecob = ( function() {
  // umecob関数本体
  var UC = function(op) {
    return UC[op.sync ? "sync" : "async"](op)
  }

  // umecobの非同期版
  UC.async = function(op) {
    if (typeof Deferred === "undefined") 
      throw UC.Error("DEFERRED_NOTFOUND")

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
      return UC.binding.impls[Preferences.binding] || (function(){ throw UC.Error("BINDING_NOTFOUND", Preferences.binding)})()
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

    throw UC.Error("BINDING_INVALID_ARGUMENT")
  }
  UC.binding.impls = UC.binding.impls || {}

  // bindingの型
  UC.binding.Interface = function(impl) {
    impl = impl || { getSync: function(){ throw UC.Error("BINDING_NO_IMPL")}, getAsync: function() { this.getSync() }}
    var jsonize = function(str) {
      return eval("("+str+")") 
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
      return UC.compiler.impls[Preferences.compiler] || (function(){ throw UC.Error("COMPILER_NOTFOUND", Preferences.compiler)})()
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
    throw UC.Error("COMPILER_INVALID_ARGUMENT")
  }
  UC.compiler.impls = UC.compiler.impls || {}


  /** About Error **/
  UC.Error = function() {
    var name = arguments[0],
           e = new Error()
    e.message = (typeof umecob.Error.messages[name] == "undefined") 
        ? "unspecified internal error in umecob. If you have something to ask, "+
          "please feel free to send me an e-mail: shinout310 at gmail.com (Shin Suzuki)."
        : (typeof umecob.Error.messages[name] == "function")
          ? umecob.Error.messages[name].apply(this, arguments.shift())
          : umecob.Error.messages[name]
    e.name = "umecob Error"
    return e
  }

  UC.Error.messages = function() {
    if ( arguments.length == 1)
      return UC.Error.messages[arguments[0]]

    if ( arguments.length == 2)
      UC.Error.messages[arguments[0]] = arguments[1]
  }

  UC.Error.messages("DEFERRED_NOTFOUND", "If you use umecob() asynchronously, you have to include \"JSDeferred\" library."+
                                         " Go to https://github.com/cho45/jsdeferred then download it.")
  UC.Error.messages("BINDING_NOTFOUND", function() { return "Binding '"+ arguments[0] +"' is not found."})
  UC.Error.messages("BINDING_INVALID_ARGUMENT", "Invalid number of arguments in umecob.binding(). It requires at most 2 arguments.")
  UC.Error.messages("BINDING_NO_IMPL", "The 'default' binding doesn't support fetching templates and data by id."+
                                       " umecob.use(bindingName) , where bindingName = 'file', 'url', 'jquery', 'client', or your customized binding.")
  UC.Error.messages("COMPILER_NOTFOUND", function() { return "Compiler '"+ arguments[0] +"' is not found."})
  UC.Error.messages("COMPILER_INVALID_ARGUMENT", "Invalid number of arguments in umecob.compiler(). It requires at most 2 arguments.")

  return UC
})()

/** umecob Bindings  **/

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
  umecob.Error.messages("BINDING_URL_SYNC", "hogehoge")
  return T.impl({

    getSync : function(id) {
      throw umecob.Error("BINDING_URL_SYNC")
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

/** umecob Compilers  **/
// Standard Compiler
umecob.compiler("standard", (function() {
  var C = {}


  C.compile = function(tpl, sync) {
    var tplArr = tpl.replace(/\r(\n)?/g, '\n').replace(/\0/g, '') + '\0'.split(""), // ヌルバイトが終端
        i      = 0,
        state  = {
          sync       : sync || false,
          name       : "START", 
          buffer     : new T(), 
          stack      : new T(),
          codeBuffer : new T() }
    while ( state.name ) 
      state.name = trans[state.name] ? trans[state.name].call(state, tplArr[i++]) : (function(){ throw umecob.Error("COMPILER_STANDARD_UNKNOWN_STATE")})()

    sync
      ? state.codeBuffer.add("echo.getText()")
      : state.codeBuffer.add("Deferred.parallel(echo.getDefers()).next( function(defers) { for ( var i in defers ){ echo.put(i,defers[i]) } return echo.getText() })")

    return state.codeBuffer.join("\n")
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
    return eval(code)
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
          throw umecob.Error("COMPILER_STANDARD_QUOTATION", type)
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
          throw umecob.Error("COMPILER_STANDARD_CLOSE_TAG")
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

  umecob.Error.messages("COMPILER_STANDARD_UNKNOWN_STATE", function(){ "State error: Unknown state '"+ arguments[0] +"' was given."})
  umecob.Error.messages("COMPILER_STANDARD_QUOTATION", function(){ "Syntax error: you have to close quotation [" + arguments[0] +"']."})
  umecob.Error.messages("COMPILER_STANDARD_CLOSE_TAG", "Syntax error: you have to close [% tag with %] tag.")
          
  return C
})())

if(typeof  module == "object") {
  module.exports = umecob
}

} catch (e) {
  console.log(e.stack || e.message || e)
}
