function umecob(u) {
  try {
    if (typeof u != "object") 
      throw umecob.Error("UMECOB_INVALID_ARGUMENT");
    umecob.start(u);
    var ret = umecob[u.sync ? "sync" : "async"](u || {});
    return (ret instanceof Deferred)
      ? ret.error(function(e){
        console.log(e.stack || e.message || e)
        console.log((u.name)? "Error occurred in "+u.name : umecob.Error.messages("UMECOB_SET_NAME"));
      })
      : ret;
  } catch (e) {
    console.log(e.stack || e.message || e);
    console.log((u.name)? "Error occurred in "+u.name : umecob.Error.messages("UMECOB_SET_NAME"));
    return (u.sync || false) ? (e.message || e) : new Deferred.call(function() {return e.message || e;});
  }
}

/** adding features to umecob. U is equal to umecob object. **/
( function(U) {
  U.node = (typeof exports === "object" && this === exports);

  /** Global Preferences of umecob.binding and umecob.compiler **/
  var Preferences = { 
    binding  : {tpl: "default", data: "default"},
    compiler : "standard",
    start    : {},
    end      : {}
  };

  function common_start(u) {
    if (typeof u.binding == "object") {
      u.tpl_binding  = U.binding(u.binding.tpl  || Preferences.binding.tpl);
      u.data_binding = U.binding(u.binding.data || Preferences.binding.data);
    } else {
      u.tpl_binding  = U.binding(u.binding  || Preferences.binding.tpl);
      u.data_binding = U.binding(u.binding  || Preferences.binding.data);
    }
    u.compiler_obj = U.compiler(u.compiler || null);
    u.binding      = { tpl: u.tpl_binding.name, data: u.data_binding.name };
    u.compiler     = u.compiler || u.compiler_obj.name;
  }

  function common_end(u) {
    function checkTemplateType(tpl) { return (typeof tpl == "string") || (function(){throw U.Error("UMECOB_INVALID_TEMPLATE", typeof tpl) })();}
    function checkDataType(data) { return (typeof data == "object") || (function(){throw U.Error("UMECOB_INVALID_DATA", typeof data) })();}
    u.code   = u.code ||  (checkTemplateType(u.tpl) ? u.compiler_obj.compile(u) : "");
    if (typeof u.attach == "object") {
      for (var i in u.attach) {
        u.data[i] = u.attach[i];
      }
    } else if (typeof u.attach == "function") {
      var ret = u.attach(u.data);
      u.data = (ret) ? ret : u.data;
    }

    u.result = u.result || (checkDataType(u.data) ? u.compiler_obj.run(u) : {});
    U.end(u);
    return u.result;
  }

  // asynchronized umecob. returns Deferred Object.
  U.async = function(u) {
    if (typeof Deferred === "undefined") 
      throw U.Error("DEFERRED_NOTFOUND");

    common_start(u);

    return Deferred.parallel({
      tpl: ( u.tpl || u.code || u.result)
        ? (u.tpl instanceof Deferred)
          ? u.tpl
          : Deferred.call(function(){return u.tpl})
        : u.tpl_binding.getTemplate.async(u.tpl_id),

      data: u.data 
        ? (u.data instanceof Deferred)
          ? u.data
          : Deferred.call(function(){return u.data})
        : (u.data_id) 
          ? u.data_binding.getData.async(u.data_id)
          : Deferred.call(function(){return {} })
    }).next( function(val) {
      u.tpl    = val.tpl;
      u.data   = val.data || {};
      return common_end(u);
    });
  }

  // umecobの同期版
  U.sync = function(u) {
    common_start(u);
    u.tpl    = u.tpl || u.tpl_binding.getTemplate.sync(u.tpl_id);
    u.data   = u.data || ( (u.data_id) ? u.tpl_binding.getData.sync(u.data_id) : {});
    return common_end(u);
  }

  U.use = function() {
    if (typeof arguments[0] == "object") {
      Preferences.binding  = (typeof arguments[0].binding == "object") 
        ? arguments[0].binding 
        : (typeof arguments[0].binding == "string")
          ? {tpl: arguments[0].binding, data: arguments[0].binding}
          : Preferences.binding;
      Preferences.compiler     = arguments[0].compiler || Preferences.compiler;
      Preferences.binding.tpl  = arguments[0].tpl      || Preferences.binding.tpl;
      Preferences.binding.data = arguments[0].data     || Preferences.binding.data;
    // string
    } else {
      Preferences.binding = {tpl: arguments[0], data: arguments[0]};
    }
    return U;
  };

  U.binding = function() {
    if (arguments.length == 1) {
      return U.binding.impls[ arguments[0] ] || (function(name){ throw U.Error("BINDING_NOTFOUND", name);})(arguments[0]);
    }

    if (arguments.length == 2)  {
      // Register Binding. returns umecob
      arguments[1].name = arguments[0];
      U.binding.impls[arguments[0]] = arguments[1];
      return U.binding(arguments[0]);
    }
    throw U.Error("BINDING_INVALID_ARGUMENT");
  };
  U.binding.impls = U.binding.impls || {};

  // bindingを作りやすくする骨格。
  U.binding.Skeleton = function(impl) {
    function jsonize(str) {
      if ( str == "") 
        return {};
      try {
        str = "("+str+")";
        return eval(str);
      } catch (e) {
        JSHINT = (typeof JSHINT == "function") ? JSHINT : (umecob.node ? require("./jshint.js") : null);
        if (JSHINT) {
          var codes = str.split("\n");
          JSHINT(str);
          var linenum   = JSHINT.errors[0].line;
          var len       = codes.length;
          var code4disp = new Array();
          for (var i = Math.max(linenum - 6, 0); i < Math.min(linenum + 6, len); i++) { 
            code4disp.push( (i == linenum -1 ? "*" : "") +  (parseInt(i)+1) + "\t"+codes[i]);
          }
          console.log(e.message || e);
          console.log(JSHINT.errors[0].reason+" at line " + linenum + " (evaled code below.)");
          console.log(U.Error.messages("SHOW_CODE")("",code4disp.join("\n")));
        } else {
          console.log(U.Error("JSHINT_REQUIRED"));
          console.log(e.message || e);
        }
        return {};
      }
    }
    function checkIdType(id) {
      if (typeof id != "string") 
        throw U.Error("FRAME_INVALID_ID", typeof id);
    }

    impl = impl || { getSync: function(){ throw U.Error("BINDING_NO_IMPL");}, getAsync: function() { this.getSync(); }}
    this.impl = function(obj) { impl = obj; return this; };

    // bindingのインターフェイス1: getTemplate(id): return (string) template
    this.getTemplate = { 
      sync: function(id) {
        checkIdType(id);
        return impl.getSync(id);
      },
      async: function(id) { 
        checkIdType(id);
        return impl.getAsync(id);
      }
    };

    // bindingのインターフェイス1: getData(id) : return (object) data
    this.getData = {
      sync: function(id) { 
        checkIdType(id);
        var data = impl.getSync(id);
        return (typeof data == "string") ? jsonize(data) : data;
      },
      async: function(id) {
        checkIdType(id)
        return impl.getAsync(id).next(function(data) {
          return (typeof data == "string") ? jsonize(data) : data;
        });
      }
    };
  };
  U.binding("default", new U.binding.Skeleton());

  // hookの管理
  function hook(name) {
    Preferences[name] = {};
    var i = 0;
    var ret = function() {
      // registration
      if (typeof arguments[0] == "function" ) {
        Preferences[name][arguments[1] || i++] = arguments[0];
        return U;
      } 
      else if (arguments.length == 2 && typeof arguments[1] == "function") {
        Preferences[name][arguments[0] || i++] = arguments[1];
        return U;
      }

      // execution
      else {
        for (var j in Preferences[name]) {
          Preferences[name][j].apply(this, arguments);
        }
        // attached hook 
        if (typeof arguments[0] == "object" && typeof arguments[0][name] == "function"){
          arguments[0][name].apply(this, arguments);
        }
      }
    }
    ret.del = function() {
      // Deletion
      if(typeof arguments[0] == "string" && typeof Preferences[name][arguments[0]] == "function") {
        delete Preferences[name][arguments[0]];
        console.log(name + " hook '" + arguments[0] + "' was deleted."); 
      }
    };
    return ret;
  }
  U.start = hook("start");
  U.end   = hook("end");

  U.compiler = function() {
    if (arguments.length == 0 || !arguments[0]) {
      return (Preferences.compiler) ? U.compiler(Preferences.compiler) : (function(){throw U.Error("COMPILER_NO_DEFAULT");})();
    }

    if (arguments.length == 1) {
      return U.compiler.impls[ arguments[0] ] || (function(){ throw U.Error("COMPILER_NOTFOUND", arguments[0]);})();
    }

    if (arguments.length == 2)  {
      // Register Compiler. returns umecob
      arguments[1].name = arguments[0];
      U.compiler.impls[arguments[0]] = arguments[1];
      return U.compiler(arguments[0]);
    }

    throw U.Error("COMPILER_INVALID_ARGUMENT");
  }
  U.compiler.impls = U.compiler.impls || {};

  /** About Error **/
  U.Error = function() {
    var name = arguments[0],
           e = new Error();
    e.message = (typeof umecob.Error.messages[name] == "undefined")
        ? "("+arguments[0] + ") " +
          "Unspecified internal error occurred in umecob. If you have something to ask, "+
          "please feel free to send me an e-mail: shinout310 at gmail.com (Shin Suzuki)."
        : (typeof umecob.Error.messages[name] == "function")
          ? umecob.Error.messages[name].apply(this, arguments )
          : umecob.Error.messages[name];
    e.name = "umecob Error";
    return e;
  };

  U.Error.messages = function() {
    if ( arguments.length == 1)
      return U.Error.messages[arguments[0]];

    if ( arguments.length == 2)
      U.Error.messages[arguments[0]] = arguments[1];
  };

  U.Error.messages("UMECOB_SET_NAME", "umecob Notice: If you want to know which umecob() threw this error, call umecob with 'name' option." +
                   "  e.g.  umecob({name: 'sample_name', tpl_id: 'hoge' }); ");
  U.Error.messages("UMECOB_INVALID_ARGUMENT", "umecob() requires one object argument. See README for detail of the argument.");
  U.Error.messages("UMECOB_INVALID_TEMPLATE", function(){ return "The typeof 'tpl' has to be 'string', '"+ arguments[1] +"' is given."});
  U.Error.messages("UMECOB_INVALID_DATA", function(){ return "The typeof 'data' has to be 'object', '"+ arguments[1] +"' is given."});
  U.Error.messages("DEFERRED_NOTFOUND", "If you use umecob() asynchronously, you have to include \"JSDeferred\" library."+
                                         " Go to https://github.com/cho45/jsdeferred then download it.");
  U.Error.messages("EV_NOTFOUND", function(){ return "Event '"+arguments[1]+"' is not found."});
  U.Error.messages("JSHINT_REQUIRED", "Error occurred during eval(). If you want to see details of the error, please request " +
                                      'JSHINT.  e.g. <script type="text/javascript" src="/path/to/umecob/jshint.js"></script>');
  U.Error.messages("SHOW_CODE", function(){ 
    return "\n\n//------------------------------------//\n" +
           "//-------------- start ---------------//\n" +
                          arguments[1]  + "\n"          +
           "//--------------- end ----------------//\n" +
           "//------------------------------------//\n\n";});
  U.Error.messages("BINDING_USE", "Please call umecob.use(bindingName) , where bindingName = 'file', 'url', 'jquery', 'xhr', or your customized binding.");
  U.Error.messages("BINDING_NODEFAULT", "No default binding is selected. " + U.Error.messages("BINDING_USE"));
  U.Error.messages("BINDING_NOTFOUND", function() { return "Binding '"+ arguments[1] +"' is not found."});
  U.Error.messages("BINDING_INVALID_ARGUMENT", "Invalid number of arguments in umecob.binding(). It requires at most 2 arguments.");
  U.Error.messages("BINDING_NO_IMPL", "The 'default' binding doesn't support fetching templates and data by id. " + U.Error.messages("BINDING_USE"));
  U.Error.messages("FRAME_INVALID_ID", function() { return "The type of tpl_id and data_id have be 'string', '"+ arguments[1] +"' is given."});
  U.Error.messages("COMPILER_NOTFOUND", function() { return "Compiler '"+ arguments[1] +"' is not found."});
  U.Error.messages("COMPILER_INVALID_ARGUMENT", "Invalid number of arguments in umecob.compiler(). It requires at most 2 arguments.");

}).call(this, umecob);


/** umecob for node.js  **/
if (umecob.node) {
  Deferred = require("./jsdeferred.node.js");
  module.exports = umecob;
}

/** umecob Bindings  **/

// node.js file open binding
umecob.binding("file", (function(T) {
  if (!umecob.node) return T;
  var fs   = require("fs"),
      path = __dirname + "/";
  return T.impl({

    getSync : function(id) {
      return fs.readFileSync((id.substr(0,1) == "/")? id : path + id, "utf-8");
    },

    getAsync : function(id) {
      var d = new Deferred().next(function(str) {
        return str;
      });
      fs.readFile((id.substr(0,1) == "/")? id : path + id, "utf-8", function(e, str){
        (e) ? d.fail.call(d, e) : d.call.call(d, str);
      });
      return d
    }
  });
})(new umecob.binding.Skeleton() ));


// node.js url get binding
umecob.binding("url", (function(T) {
  if (!umecob.node) return T;
  var url  = require("url");
  var http = require("http");
  umecob.Error.messages("BINDING_URL_SYNC", "hogehoge");
  return T.impl({

    getSync : function(id) {
      throw umecob.Error("BINDING_URL_SYNC");
    },

    getAsync : function(id) {
      var d = new Deferred().next(function(str) {
        return str;
      });
      var op = url.parse(id);
      var result = "";
      http.get({
        host: op.hostname || "localhost",
        port: op.port || 80,
        path: ( op.pathname 
                ? (op.pathname.slice(0,1) == "/") 
                  ? "" 
                  : "/" + op.pathname + (op.search || "") 
                : "")
      }, function(res){
        res.on("data", function(chunk) {
          result += chunk.toString();
        }).on("error", function(e){
          d.fail.call(d,e);
        }).on("end", function(){
          d.call.call(d, result);
        });
      });
      return d;
    }
  });
})(new umecob.binding.Skeleton()) );

// jquery ajax binding
umecob.binding("jquery", new umecob.binding.Skeleton({
  getSync : function(id) {
    var str;
    jQuery.ajax({
      url      : id,
      type     : "GET",
      dataType : 'text',
      async    : false,
      success  : function(res) {
        str = res
      }
    });
    return str;
  },

  getAsync : function(id) {
    var str,
        d = new Deferred().next(function(str) {
      return str;
    });
    jQuery.ajax({
      url      : id,
      type     : 'GET',
      dataType : 'text',
      success  : function(res) {
        d.call.call(d, res)
      }
    });
    return d;
  }
}));

// client js binding with XMLHttpRequest
umecob.binding("xhr", (function(T) {
  if (umecob.node) return T;
  var Request = function(){
    return typeof(ActiveXObject) !== "undefined"   
      ? new ActiveXObject("Msxml2.XMLHTTP") || new ActiveXObject("Microsoft.XMLHTTP")
      : new XMLHttpRequest();
  };

  return T.impl({
    getSync : function(id) {
      var request = new Request();
      request.open("GET", id, false);
      if ( request.status == 404 || request.status == 2 ||(request.status == 0 && request.responseText == '') ) return "";
      return request.responseText;
    },

    getAsync : function(id) {
      var request = new Request()
      var d = new Deferred().next(function(str) {
        return str;
      })

      request.onreadystatechange = function(){
        if(request.readyState == 4){
          d.call.call(d, request.responseText);
        }
      }
      request.open("GET", id);
      request.send(null);
      return d;
    }
  });
})(new umecob.binding.Skeleton()) );

/** umecob Compilers  **/
// Standard Compiler
umecob.compiler("standard", (function() {
  var C = {};

  C.compile = function(u) {
    var tpl = u.tpl;
    var tplArr = (typeof tpl === "string")  ? tpl.replace(/\r(\n)?/g, '\n').replace(/\0/g, '') + '\0'.split("") : '\0',
        i      = 0,
        state  = {
          name       : "START", 
          buffer     : new T(), 
          stack      : new T(),
          codeBuffer : new T() };

    state.codeBuffer.add(" with (echo.data) { // this line has to be removed when passing to #JSHINT#");

    try {
      while ( state.name ) {
        state.name = trans[state.name] 
          ? trans[state.name].call(state, tplArr[i++]) 
          : (function(){ throw umecob.Error("COMPILER_STANDARD_UNKNOWN_STATE");})();
      }
    } catch (e) {
      console.log(e + "  in  " + (u.tpl_id || u.tpl || u.code));
    }

    state.codeBuffer.add("echo.getResult();");
    state.codeBuffer.add("} // this line has to be removed when passing to #JSHINT#");
    return state.codeBuffer.join("\n");
  };

  C.run = function(u) {
    var buff = new T();
    var echo = function(txt) {
      buff.add(txt);
    };

    echo.sync = u.sync || false;
    echo.data = u.data;
    echo.defers = {};

    echo.addDefer = function(d) {
      echo.defers[buff.getIndex()] = d;
      buff.increment();
    };

    echo.addUmecob = function(um) {
      ( um instanceof Deferred) ? echo.addDefer(um) : echo(um);
    };

    echo.put = function(i, v) {
      buff.put(i, v);
    };

    echo.getDefers = function() {
      return echo.defers;
    };

    echo.getText = function() {
      return buff.join();
    };

    echo.getResult = function() {
      return echo.sync
        ? echo.getText()
        : Deferred.parallel(echo.getDefers()).next( function(results) {for ( var i in results ){ echo.put(i,results[i]) } return echo.getText() });
    };


    try {
      return eval(u.code);
    } catch (e) {
      JSHINT = (typeof JSHINT == "function") ? JSHINT : (umecob.node ? require("./jshint.js") : null)
      if (!JSHINT) {
        console.log(umecob.Error("JSHINT_REQUIRED"));
        console.log(e.message || e);
        return;
      }

      echo.evalScope = function() {
        with(echo.data) {
          for (var i in this.errors) {
            try{
              var t = typeof eval(this.errors[i].a);
            } catch(e) {
              var t = "undefined";
            }
            if (t  === "undefined" ) {
              return {
                line    : this.errors[i].line,
                reason  : this.errors[i].reason
              };
            }
          }
        }
        return false;
      }

      function getTplName(u) {
        return u.tpl_id || ((typeof u.tpl == "string") 
            ? "template :  >>> " + u.tpl.substr(0, 50).replace(/\n/g, " ") + "...  "
            : "compiled code: >>> " + u.code.substr(76, 50).replace(/\n/g, " ")
        );
      }

      var codes = u.code.split("\n"),
          code4lint = new T(),
          code4disp = new T();

      for (var i in codes) {
        if (! codes[i].match(/#JSHINT#/)) {
          code4lint.add(codes[i]);
        }
      }

      JSHINT(code4lint.join("\n"), {browser: true, undef: true, boss: true, evil: true, devel: true, asi: true});
      result = echo.evalScope.apply(JSHINT)
      if (!result) {
        console.log(e.message || e);
        console.log("Something is wrong with "+ getTplName(u));
        return e.message || e;
      }

      if (!u.tpl) {
        var k = Math.max(result.line - 10, 0);
        var limit = Math.min(code4lint.getIndex(), result.line + 10);
        while(k < limit) {
          code4disp.add( (k == result.line -1 ? "*" : " ") +  (parseInt(k)+1) + "\t"+code4lint.get(k));
          k++;
        }
        var err = result.reason + "   in  " + getTplName(u) + "  at line " + result.line;
        console.log(err);
        console.log(umecob.Error.messages("SHOW_CODE")("",code4disp.join("\n")));
        console.log(e.message || e);
        return result.reason;
      }

      var line = result.line;
      var j = 0; // read line [j+1] of the code passed to JSHINT
      while (j < result.line) {
        if (code4lint.get(j).slice(0,6) == 'echo("') {
          var m = code4lint.get(j).split("\\\\n").join("").match(/\\n/g);
          line += (m) ? m.length -1 : 0;
        }
        j++;
      }
      var tplines = u.tpl.split("\n");
      var k = Math.max(line - 10, 0);
      var limit = Math.min(tplines.length, line + 10);
      while(k < limit) {
        code4disp.add( (k == line -1 ? "*" : " ") +  (parseInt(k)+1) + "\t"+tplines[k]);
        k++;
      }
      var err = result.reason + "   in  " + getTplName(u) + "  at line " + line  + " (in compiled code line "+ result.line +")";
      console.log(err);
      console.log(umecob.Error.messages("SHOW_CODE")("",code4disp.join("\n")));
      console.log(e.message || e);
      return result.reason;
    }

  };

  // T: buffer
  var T = function() { this.init(); };
    T.prototype.init = function(i, c) { this.i = 0; this.arr = new Array(); };
    T.prototype.add = function(c) { this.arr[this.i++] = c; };
    T.prototype.push = T.prototype.add;
    T.prototype.pop = function() { this.i--; return this.arr.pop() };
    T.prototype.join = function(sep) { return this.arr.join(sep || ''); };
    T.prototype.getIndex = function() { return this.i; };
    T.prototype.increment = function() { this.i++; };
    T.prototype.get = function(i) { return this.arr[i]; };
    T.prototype.put = function(i, c) { this.arr[i] = c; };
    T.prototype.clear = T.prototype.init;

  // transition functions. These functions are called by fn.call(state), so "this" always means state object.
  var trans = {};

  // 初期状態
  trans["START"] = function(c) {
    switch (c) {
      default:
        this.buffer.add(c);
        return "START";
      case '[':
        return "JS_PRE_START";
      case '\\':
        this.stack.push("START");
        return "ESCAPE";
      case '\0':
        strToCode.call(this);
        return null; // 終了
    }
  };

  // %] が出た状態。次に改行コードが出てきたら無視
  trans["FINISH_JS"] = function(c) {
    switch (c) {
      case '\n':
        return "START";
      default:
        return trans["START"].call(this, c);
    }
  };

  // [ が出た状態
  trans["JS_PRE_START"] = function(c) {
    switch (c) {
      case '%':
        // strBufferの内容を吐き出す (thisはnew Compiler)
        strToCode.call(this);
        return "JS_WAITING_COMMAND";
      default:
        this.buffer.add('[');
        return trans["START"].call(this, c);
    }
  };

  function strToCode() {
    this.codeBuffer.add('echo("' + this.buffer.join().replace(/\\g/, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"')  + '");');
    this.buffer.clear();
  }

  function insideQuotation(stateName, type) {
    return function(c) {
      switch (c) {
        case type:
          this.buffer.add(c);
          return this.stack.pop();
        default:
          this.buffer.add(c);
          return stateName;
        case '\0':
          return null;
          // throw umecob.Error("COMPILER_STANDARD_QUOTATION", type);
        case '\n':
          return this.stack.pop();
      }
    };
  }

  // ' の中の状態
  trans["INSIDE_SQ"] = insideQuotation("INSIDE_SQ", "'");
  // " の中の状態
  trans["INSIDE_DQ"] = insideQuotation("INSIDE_DQ", '"');
  // \ の次
  trans["ESCAPE"] = function(c) {
    switch (c) {
      case '\\':
      case '[':
        this.buffer.add(c);
        return this.stack.pop();
      default:
        this.buffer.add('\\\\'+c);
        return this.stack.pop();
    }
  };

  // [%
  trans["JS_WAITING_COMMAND"] = function(c) {
    switch (c) {
      case ' ':
        return "JS_WAITING_COMMAND";
      case '=':
        return "JS_ECHO";
      case '{':
        this.buffer.add(c);
        return "JS_INCLUDE";
      case '@':
        return "JS_ASYNC";

      // the same as JS_START
      default:
        return trans["JS_START"].call(this, c);
    }
  };

  function jsStartTemplate(stateName, preEndStateName) {
    return function(c) {
      switch (c) {
        case '%':
          return preEndStateName;
        case "'":
          this.buffer.add(c);
          this.stack.push(stateName);
          return "INSIDE_SQ";
        case '"':
          this.buffer.add(c);
          this.stack.push(stateName);
          return "INSIDE_DQ";
        case '\\':
          this.stack.push(stateName);
          return "ESCAPE";
        default:
          this.buffer.add(c);
          return stateName;
        case '\0':
          throw umecob.Error("COMPILER_STANDARD_CLOSE_TAG");
          return null;
      }
    };
  }

  function jsPreEndTemplate(mainStateName, fn) {
    return function(c) {
      switch (c) {
        case ']':
          fn.apply(this);
          return "FINISH_JS"
        default:
          this.buffer.add("%"+c);
          return mainStateName;
        case '\0':
          return trans[mainStateName].call(this, c);
      }
    };
  }

  // [%
  trans["JS_START"] = jsStartTemplate("JS_START", "JS_PRE_END");
  trans["JS_PRE_END"] = jsPreEndTemplate("JS_START", function() {
    this.codeBuffer.add( this.buffer.join() );
    this.buffer.clear();
  });

  // [%=
  trans["JS_ECHO"] = jsStartTemplate("JS_ECHO", "JS_ECHO_PRE_END");
  trans["JS_ECHO_PRE_END"] = jsPreEndTemplate("JS_ECHO", function() {
    this.codeBuffer.add('echo(' + ( this.buffer.join() ) + ');');
    this.buffer.clear();
  });

  // [%{ 
  trans["JS_INCLUDE"] = jsStartTemplate("JS_INCLUDE", "JS_INCLUDE_PRE_END");
  trans["JS_INCLUDE_PRE_END"] = jsPreEndTemplate("JS_INCLUDE", function() {
    this.codeBuffer.add('echo.addUmecob(umecob(' + ( this.buffer.join() ) + '));');
    this.buffer.clear();
  });

  // [%@
  trans["JS_ASYNC"] = jsStartTemplate("JS_ASYNC", "JS_ASYNC_PRE_END");
  trans["JS_ASYNC_PRE_END"] = jsPreEndTemplate("JS_ASYNC", function() {
    this.codeBuffer.add('echo.addDefer(' + ( this.buffer.join() ) + ');');
    this.buffer.clear();
  });

  umecob.Error.messages("COMPILER_STANDARD_UNKNOWN_STATE", function(){ return "State error: Unknown state '"+ arguments[1] +"' was given."});
  umecob.Error.messages("COMPILER_STANDARD_QUOTATION", function(){ return "Syntax error: you have to close quotation [" + arguments[1] +"']."});
  umecob.Error.messages("COMPILER_STANDARD_CLOSE_TAG", "Syntax error: you have to close '[%' tag with '%]' tag.");
          
  return C;
})());
