try {

function umecob(st) {
  return umecob[st.sync ? "sync" : "async"](st || {})
}

/** adding features to umecob. U is equal to umecob object. **/
( function(U) {

  /** Global Preferences of umecob.binding and umecob.compiler **/
  var Preferences = { binding  : "default", compiler : "standard" }

  U.node = (typeof exports === "object" && this === exports)

  // asynchronized umecob. returns Deferred Object.
  U.async = function(st) {
    if (typeof Deferred === "undefined") 
      throw U.Error("DEFERRED_NOTFOUND")

    U.start(st)

    var binding  = U.binding(st.binding || null),
        compiler = U.compiler(st.compiler || null)
    st.binding  = st.binding  || binding.name
    st.compiler = st.compiler || compiler.name

    return Deferred.parallel({
      tpl: ( st.tpl || st.code || st.result)
        ? Deferred.call(function(){return st.tpl})
        : binding.getTemplate.async(st.tpl_id),

      data: st.data 
        ? Deferred.call(function(){return st.data})
        : binding.getData.async(st.data_id)
    }).next( function(val) {
      st.tpl    = st.tpl || val.tpl
      st.data   = st.data || val.data
      st.code   = st.code || compiler.compile(st.tpl)
      st.result = st.result || compiler.run(st.code, st.data)
      U.end(st)
      return st.result
    }).error( function(e) {
      console.log(e.stack || e.message || e)
    })
  }

  // umecobの同期版
  U.sync = function(st) {
    U.start(st)

    var binding  = U.binding(st.binding || null),
        compiler = U.compiler(st.compiler || null)

    st.binding  = st.binding  || binding.name
    st.compiler = st.compiler || compiler.name
    st.tpl    = st.tpl || binding.getTemplate.sync(st.tpl_id)
    st.data   = st.data || binding.getData.sync(st.data_id)
    st.code   = st.code || compiler.compile(st.tpl)
    st.result = st.result || compiler.run(st.code, st.data, true)
    U.end(st)
    return st.result
  }

  // eventの管理
  function ev(name) {
    return function() {
      if (typeof arguments[0] == "function" ) {
        Preferences[name] = arguments[0]
        return U
      }
      else if (typeof arguments[0] == "object" && typeof arguments[0][name] == "function"){
        return arguments[0][name].apply(this, arguments)
      }
      else if (typeof Preferences[name] == "function"){
        return Preferences[name].apply(this, arguments)
      }
    }
  }
  U.start = ev("start")
  U.end   = ev("end")

  U.use = function() {
    if (arguments.length == 1) {

      if (typeof arguments[0] == "object") {
        Preferences.binding  = arguments[0].binding  || Preferences.binding
        Preferences.compiler = arguments[0].compiler || Preferences.compiler

      // string
      } else {
        Preferences.binding = arguments[0]
      }
    } 

    else if (arguments.length == 2) {
      Preferences.binding  = arguments[0]
      Preferences.compiler = arguments[1]
    }
    return U
  }

  U.binding = function() {
    if (arguments.length == 0 || !arguments[0]) {
      return (Preferences.binding) ? U.binding(Preferences.binding) : (function(){throw U.Error("BINDING_NO_DEFAULT")})()
    }

    if (arguments.length == 1) {
      return U.binding.impls[ arguments[0] ] || (function(){ throw U.Error("BINDING_NOTFOUND", arguments[0])})()
    }

    if (arguments.length == 2)  {
      // Register Binding. returns umecob
      arguments[1].name = arguments[0]
      U.binding.impls[arguments[0]] = arguments[1]
      return U.binding(arguments[0])
    }

    throw U.Error("BINDING_INVALID_ARGUMENT")
  }
  U.binding.impls = U.binding.impls || {}

  // bindingを作りやすくする骨格。
  U.binding.Frame = function(impl) {
    impl = impl || { getSync: function(){ throw U.Error("BINDING_NO_IMPL")}, getAsync: function() { this.getSync() }}
    var jsonize = function(str) {
      return eval("("+str+")") 
    }
    this.impl = function(obj) { impl = obj; return this }

    // bindingのインターフェイス1: getTemplate(id): return (string) template
    this.getTemplate = { 
      sync: function(id) { return impl.getSync(id) },
      async: function(id) { return impl.getAsync(id) },
    }

    // bindingのインターフェイス1: getData(id) : return (object) data
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
  U.binding("default", new U.binding.Frame())

  U.compiler = function() {
    if (arguments.length == 0 || !arguments[0]) {
      return (Preferences.compiler) ? U.compiler(Preferences.compiler) : (function(){throw U.Error("COMPILER_NO_DEFAULT")})()
    }

    if (arguments.length == 1) {
      return U.compiler.impls[ arguments[0] ] || (function(){ throw U.Error("COMPILER_NOTFOUND", arguments[0])})()
    }

    if (arguments.length == 2)  {
      // Register Compiler. returns umecob
      arguments[1].name = arguments[0]
      U.compiler.impls[arguments[0]] = arguments[1]
      return U.compiler(arguments[0])
    }

    throw U.Error("COMPILER_INVALID_ARGUMENT")
  }
  U.compiler.impls = U.compiler.impls || {}


  /** About Error **/
  U.Error = function() {
    var name = arguments[0],
           e = new Error()
    e.message = (typeof umecob.Error.messages[name] == "undefined") 
        ? "Unspecified internal error occurred in umecob. If you have something to ask, "+
          "please feel free to send me an e-mail: shinout310 at gmail.com (Shin Suzuki)."
        : (typeof umecob.Error.messages[name] == "function")
          ? umecob.Error.messages[name].apply(this, arguments.shift())
          : umecob.Error.messages[name]
    e.name = "umecob Error"
    return e
  }

  U.Error.messages = function() {
    if ( arguments.length == 1)
      return U.Error.messages[arguments[0]]

    if ( arguments.length == 2)
      U.Error.messages[arguments[0]] = arguments[1]
  }

  U.Error.messages("DEFERRED_NOTFOUND", "If you use umecob() asynchronously, you have to include \"JSDeferred\" library."+
                                         " Go to https://github.com/cho45/jsdeferred then download it.")
  U.Error.messages("EV_NOTFOUND", "Event '"+arguments[0]+"' is not found.")
  U.Error.messages("BINDING_USE", "Please call umecob.use(bindingName) , where bindingName = 'file', 'url', 'jquery', 'xhr', or your customized binding.")
  U.Error.messages("BINDING_NODEFAULT", "No default binding is selected. " + U.Error.messages("BINDING_USE"))
  U.Error.messages("BINDING_NOTFOUND", function() { return "Binding '"+ arguments[0] +"' is not found."})
  U.Error.messages("BINDING_INVALID_ARGUMENT", "Invalid number of arguments in umecob.binding(). It requires at most 2 arguments.")
  U.Error.messages("BINDING_NO_IMPL", "The 'default' binding doesn't support fetching templates and data by id. " + U.Error.messages("BINDING_USE"))
  U.Error.messages("COMPILER_NOTFOUND", function() { return "Compiler '"+ arguments[0] +"' is not found."})
  U.Error.messages("COMPILER_INVALID_ARGUMENT", "Invalid number of arguments in umecob.compiler(). It requires at most 2 arguments.")

}).call(this, umecob)


/** umecob for node.js  **/
if (umecob.node) {
  Deferred = require("./jsdeferred.node.js")
  module.exports = umecob
}

/** umecob Bindings  **/

// node.js file open binding
umecob.binding("file", (function(T) {
  if (!umecob.node) return T
  var fs   = require("fs"),
      path = __dirname + "/"
  return T.impl({

    getSync : function(id) {
      try {
        return fs.readFileSync((id.substr(0,1) == "/")? id : path + id, "utf-8")
      } catch (e) {
        console.log(e.stack || e.message || e)
        return e.message || e
      }
    },

    getAsync : function(id) {
      var d = new Deferred().next(function(str) {
        return str
      })
      fs.readFile((id.substr(0,1) == "/")? id : path + id, "utf-8", function(e, str){
        if (e) 
          throw e
        d.call.call(d, str)
      })
      return d
    }
  })
})(new umecob.binding.Frame() ))


// node.js url get binding
umecob.binding("url", (function(T) {
  if (!umecob.node) return T
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
      var result = ""
      http.get({
        host: op.hostname || "localhost",
        port: op.port || 80,
        path: ( (op.pathname.slice(0,1) == "/") ? "" : "/" ) + op.pathname + (op.search || "")
      }, function(res){
        res.on("data", function(chunk) {
          result += chunk.toString()
        }).on("end", function(){
          d.call.call(d, result)
        })
      })
      return d
    }
  })
})(new umecob.binding.Frame()) )

// jquery ajax binding
umecob.binding("jquery", new umecob.binding.Frame({
  getSync : function(id) {
    var str
    jQuery.ajax({
      url      : id,
      type     : "GET",
      dataType : 'text',
      async    : false,
      success  : function(res) {
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
      url      : id,
      type     : 'GET',
      dataType : 'text',
      success  : function(res) {
        d.call.call(d, res)
      }
    })
    return d
  }
}))

// client js binding with XMLHttpRequest
umecob.binding("xhr", (function(T) {
  if (umecob.node) return T
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
          d.call.call(d, request.responseText)
        }
      }
      request.open("GET", id)
      request.send(null)
      return d
    }
  })
})(new umecob.binding.Frame()) )

/** umecob Compilers  **/
// Standard Compiler
umecob.compiler("standard", (function() {
  var C = {}

  C.compile = function(tpl) {
    var tplArr = (typeof tpl === "string")  ? tpl.replace(/\r(\n)?/g, '\n').replace(/\0/g, '') + '\0'.split("") : '\0',
        i      = 0,
        state  = {
          name       : "START", 
          buffer     : new T(), 
          stack      : new T(),
          codeBuffer : new T() }
    state.codeBuffer.add("with(json){")
    while ( state.name ) 
      state.name = trans[state.name] ? trans[state.name].call(state, tplArr[i++]) : (function(){ throw umecob.Error("COMPILER_STANDARD_UNKNOWN_STATE")})()

    state.codeBuffer.add("echo.getResult()}\n")
    return state.codeBuffer.join("\n")
  }

  C.run = function(code, json, sync) {
    var buff = new T()
    var echo = function(txt) {
      buff.add(txt)
    }

    echo.sync = sync || false
    echo.defers = {}

    echo.addDefer = function(d) {
      echo.defers[buff.getIndex()] = d
      buff.increment()
    }

    echo.addUmecob = function(u) {
      ( u instanceof Deferred) ? echo.addDefer(u) : echo(u)
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

    echo.getResult = function() {
      return echo.sync 
        ? echo.getText()
        : Deferred.parallel(echo.getDefers()).next( function(results) {for ( var i in results ){ echo.put(i,results[i]) } return echo.getText() })
    }

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
          return mainStateName
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
    this.codeBuffer.add('echo.addUmecob(umecob(' + ( this.buffer.join() ) + '))')
    this.buffer.clear()
  })

  // [%@
  trans["JS_ASYNC"] = jsStartTemplate("JS_ASYNC", "JS_ASYNC_PRE_END")
  trans["JS_ASYNC_PRE_END"] = jsPreEndTemplate("JS_ASYNC", function() {
    this.codeBuffer.add('echo.addDefer(' + ( this.buffer.join() ) + ')')
    this.buffer.clear()
  })

  umecob.Error.messages("COMPILER_STANDARD_UNKNOWN_STATE", function(){ "State error: Unknown state '"+ arguments[0] +"' was given."})
  umecob.Error.messages("COMPILER_STANDARD_QUOTATION", function(){ "Syntax error: you have to close quotation [" + arguments[0] +"']."})
  umecob.Error.messages("COMPILER_STANDARD_CLOSE_TAG", "Syntax error: you have to close [% tag with %] tag.")
          
  return C
})())

} catch (e) {
  console.log(e.stack || e.message || e)
}
