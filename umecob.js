/**
 * umecob.js
 * @author SHIN Suzuki
 * @version 1.1.7
 */

function Umecob(id) { // this function is meaningless. Just for making a scope.
  if (Umecob.instances[id]) {
    Umecob.log('id "'+ id + '" already exists. return the function (new function was not created.)');
    return Umecob.instances[id];
  }

  function umecob(params) {
    if (typeof params != 'object') {
      params = { 
       tpl_id: arguments[0] || '', 
       data: arguments[1] || {} , 
       sync: (typeof arguments[2] == 'boolean') ? arguments[2]: true};
    }
    return umecob[params.sync ? "sync" : "async"](params);
  }

  /* inherit static values */
  umecob.id = id || new Date().getTime().toString();
  umecob.Umecob = Umecob;
  umecob.version = Umecob.version;
  umecob.log = Umecob.log;
  umecob.scope = Umecob.scope;
  umecob.node = Umecob.node;
  umecob.Deferred = Umecob.Deferred;
  var Deferred = umecob.Deferred;

  umecob.use = function(setting, append) {
    return umecob.preset('plain', setting, append);
  }

  umecob.preset = function(name, setting, append) {
    if (setting == null) return umecob.preset.get(name);
    if (append !== false) append = true;
    if (typeof setting == 'string') setting = { binding: {tpl: setting, data: setting} };
    if (typeof setting.binding == 'string') setting.binding = {tpl: setting.binding, data: setting.binding};
    if (typeof setting.start == 'string') setting.start = [setting.start];
    if (typeof setting.end == 'string') setting.end = [setting.end];
    if (append && typeof umecob.preset.vals[name] == 'object') {
      umecob.preset.vals[name].binding = setting.binding || umecob.preset.vals[name].binding;
      umecob.preset.vals[name].compiler = setting.compiler || umecob.preset.vals[name].compiler;
      umecob.preset.vals[name].start = setting.start || umecob.preset.vals[name].start;
      umecob.preset.vals[name].end = setting.end || umecob.preset.vals[name].end;
      umecob.preset.vals[name].merge_start = setting.merge_start || false;
      umecob.preset.vals[name].merge_end = setting.merge_end || false;
    }
    else {
      umecob.preset.vals[name] = setting;
    }
    return umecob;
  }

  umecob.preset.push = function(type, name, fname) {
    if (typeof umecob.preset.vals[name] != 'object') return umecob;
    var arr = umecob.preset.vals[name][type] || [];
    arr.push(fname);
    umecob.preset.vals[name][type] = arr;
    return umecob;
  }

  umecob.preset.get = function(name) {
    return umecob.preset.vals[name];
  }

  /* default setting 'plain' */
  umecob.preset.vals = {
    plain : {
      binding  : {tpl: 'plain', data: 'plain'},
      compiler : 'standard',
      start    : [],
      end      : []
    }
  };


  (function(umecob) {
    umecob.binding  = Config('binding');
    umecob.compiler = Config('compiler');
    umecob.start = Config('start', true);
    umecob.end = Config('end', true);

    function Config(setting_name, is_arr) {
      var f = function() {
        switch (arguments.length) {
        default:
        case 1: 
          return f.get.apply(f, arguments);
        case 2: 
        case 3: 
          return f.register.apply(f, arguments);
        }
      }
      f.vals = {};
      f.register = function(name, value, use) { 
        if (use !== false) use = true;
        value._name = name;
        f.vals[name] = value;
        if (use) {
          if (is_arr) {
            umecob.preset.push(setting_name, 'plain', name);
          }
          else {
            umecob.preset.vals.plain[setting_name] = name;
          }
        }
        return umecob;
      }
      f.get = function(name) { return f.vals[name]; }
      f.remove = function(name) { delete f.vals[name]; return umecob;}
      return f;
    }
  })(umecob);

  /* execution */
  (function(umecob) {
    /* get binding */
    function btyp(binding, type) {
      if (!binding) return null;
      if (typeof binding == 'string') return umecob.binding(binding);
      if (binding[type]) return umecob.binding(binding[type]);
      return null;
    }

    /* get start | end */
    function arrset(arr, type) {
      if (arr == null) return null;
      if (typeof arr == 'string') {
        var f = umecob[type](arr);
        if (!f || typeof f != 'function') return null;
        return [f];
      }
      if (arr instanceof Array) {
        var l = arr.length;
        if (l == 0) return [];
        var ret = [];
        for (var i=0; i < l; i++) {
          var f = umecob[type]( arr[i] );
          if (f && typeof f == 'function') ret.push(f);
        }
        return ret;
      }
      return null;
    }

    /* merge array */
    function merge(arr1, arr2, arr3, m1, m2) {
      return _m(arr1, _m(arr2, arr3, m2), m1) || [];

      function _m(a1, a2, m) {
        if (!m) return a1 || a2;
        switch (m) {
        case 'pre':
        default:
          return _mg(a1, a2);
        case 'post':
          return _mg(a2, a1);
        }
      }
      function _mg(a, name_a) {
        var names = [];
        var ret = [];
        for (var i in name_a) {
          ret.push(name_a[i]);
          names.push(name_a[i]._name);
        }
        for (var i in a) {
          if (names.indexOf(a[i]._name) < 0) {
            ret.push(a[i]);
          }
        }
        return ret;
      }
    }

    /* get current setting */
    function get_current_setting(params) {
      var configs = {};
      var local  = params.use || {};
      local = (typeof local == 'string') ? {binding: local} : local;
      var preset = (typeof params.preset == 'string') ? umecob.preset.vals[params.preset] : {};
      if (!preset) {
        Umecob.log('preset "'+params.preset+'" does not exist');
        preset = {};
      }
      var plain  = umecob.preset.vals.plain;

      configs.binding_tpl  = btyp(local.binding, 'tpl') || btyp(preset.binding, 'tpl') || btyp(plain.binding, 'tpl');
      configs.binding_data = btyp(local.binding, 'data') || btyp(preset.binding, 'data') || btyp(plain.binding, 'data');
      configs.compiler     = umecob.compiler(local.compiler) || umecob.compiler(preset.compiler) || umecob.compiler(plain.compiler);
      configs.start        = merge(arrset(local.start, 'start'), arrset(preset.start, 'start'), arrset(plain.start, 'start'), local.merge_start, preset.merge_start);
      configs.end          = merge(arrset(local.end, 'end'), arrset(preset.end, 'end'), arrset(plain.end, 'end'), local.merge_end, preset.merge_end);
      return configs;
    }

    /* prepare current setting and execute start functions */
    function common_start(params) {
      params.umecob = params.umecob || umecob;
      var configs = get_current_setting(params);
      /* execute start functions */
      for (var i in configs.start) {
        configs.start[i].call(configs, params);
      }
      return configs;
    }

    /* compile code and execute end functions */
    function common_end(params, configs) {
      params.code = params.code || configs.compiler.compile(params);
      if (typeof params.attach == "object") {
        for (var i in params.attach) {
          params.data[i] = params.attach[i];
        }
      } else if (typeof params.attach == "function") {
        var ret = params.attach(params.data);
        params.data = (ret) ? ret : params.data;
      }
      params.result = params.result || configs.compiler.run(params);
      /* execute end functions */
      for (var i in configs.end) {
        configs.end[i].call(configs, params);
      }
      return params.result;
    }

    /* synchronous call */
    umecob.sync = function(params) {
      params.sync  = true;
      params.async = false;
      try {
        var configs = common_start(params);
        params.tpl    = params.tpl || configs.binding_tpl.getTemplate.sync(params.tpl_id);
        params.data   = params.data || ( (params.data_id) ? configs.binding_data.getData.sync(params.data_id) : {});
        return common_end(params, configs);
      } catch (e) {
        umecob.log(e.stack || e.message || e);
        umecob.log(Umecob.Error.notice("UMECOB_SET_NAME", params.name));
        return e;
      }
    }

    /* asynchronous call */
    umecob.async = function(params) {
      if (typeof Deferred != "function") throw Umecob.Error("DEFERRED_NOTFOUND");
      params.async = true;
      params.sync  = false;
      var configs = common_start(params);
      return Deferred.parallel({
        tpl: ( params.tpl || params.code || params.result)
          ? (params.tpl instanceof Deferred)
            ? params.tpl
            : Deferred.call(function(){return params.tpl})
          : configs.binding_tpl.getTemplate.async(params.tpl_id),

        data: params.data 
          ? (params.data instanceof Deferred)
            ? params.data
            : Deferred.call(function(){return params.data})
          : (params.data_id) 
            ? configs.binding_data.getData.async(params.data_id)
            : Deferred.call(function(){return {} })
      })
      .next( function(val) {
        params.tpl    = val.tpl;
        params.data   = val.data || {};
        return common_end(params, configs);
      }).
      error( function(e) {
        umecob.log(e.stack || e.message || e);
        umecob.log(Umecob.Error.notice("UMECOB_SET_NAME", params.name));
        return Deferred.call(function(){ return e;});
      });
    }
  })(umecob);

  /* add bindings */
  umecob.binding('plain',  Umecob.binding.plain, false);
  umecob.binding('jquery', Umecob.binding.jquery, false);
  umecob.binding('xhr',    Umecob.binding.xhr, false);
  umecob.binding('file',   Umecob.binding.file, false);
  umecob.binding('url',    Umecob.binding.url, false);


  /* add compilers */
  umecob.compiler('plain', Umecob.compiler.plain, false); // mock

  umecob.compiler('standard', Umecob.compiler('[','%',  '%',']'), false);
  umecob.compiler('php', Umecob.compiler('<','?',  '?','>'), false);
  umecob.compiler('jsp', Umecob.compiler('<','%',  '%','>'), false);

  /* add end functions */
  umecob.end('logging', Umecob.end.logging, false);

  /* add preset */
  umecob.preset('debug', {end: 'logging'});

  Umecob.instances[umecob.id] = umecob;
  return umecob;

}// function Umecob() end.

/* umecob instances */
Umecob.instances = {};

/*********************
 *** STATIC VALUES ***
 *********************/

/* version */
Umecob.version = '1.1.7'; 

/* log */
Umecob.log = function(v){console.log(v)};

/* static values */
Umecob.scope = this;

/* is node.js or not */
Umecob.node = (typeof exports == 'object' && Umecob.scope === exports);

/* JSDeferred */
if (Umecob.node) var Deferred = require('./lib/jsdeferred.node.js');
Umecob.Deferred = (typeof Deferred == 'function') ? Deferred : null;


/*************************************
 *** BINDING, COMPILER, START, END ***
 ************************************/
// binding skeleton
Umecob.binding = function(impl) {
  function jsonize(str) {
    if ( str == "") return {};
    try {
      str = "("+str+")";
      return eval(str);
    } catch (e) {
      var hint = Umecob.Error.JSHINT('var a='+str, e);
      if (!hint || !hint.errors) { return {};}
      Umecob.Error.showCode(str.split("\n"), hint.errors[0].reason, hint.errors[0].line, e);
      return {};
    }
  }

  impl = impl || { getSync: function(){ throw Umecob.Error("BINDING_NO_IMPL");}, getAsync: function() { this.getSync(); }}
  this.impl = function(obj) { impl = obj; return this; };

  // interface of binding 1: getTemplate(id): return (string) template
  this.getTemplate = { 
    sync: function(id) {
      return impl.getSync(id);
    },
    async: function(id) { 
      return impl.getAsync(id);
    }
  };

  // interrace of binding 2: getData(id) : return (object) data
  this.getData = {
    sync: function(id) { 
      var data = impl.getSync(id);
      return (typeof data == "string") ? jsonize(data) : data;
    },
    async: function(id) {
      return impl.getAsync(id).next(function(data) {
        return (typeof data == "string") ? jsonize(data) : data;
      });
    }
  };
}

/**
 * plain binding
 * do nothing.
 */
Umecob.binding.plain = {
  getTemplate: {
    sync: function(id) {
      return id || '';
    },
    async: function(id) {
      return Deferred.call(function(){return id || '';});
    }
  },
  getData: {
    sync: function(id) {
      return id || '';
    },
    async: function(id) {
      return Deferred.call(function(){return id || '';});
    }
  }
};


/**
 * jquery ajax binding
 * id: url
 * support: sync/async
 * only for client side
 */
Umecob.binding.jquery = new Umecob.binding({
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
});

/**
 * xhr binding
 * id: url
 * support: sync/async
 * only for client side
 */
Umecob.binding.xhr = (function(T) {
  if (Umecob.node) return T;
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
})(new Umecob.binding());

/**
 * file binding
 * id: file path ( relative from this file, or absolute path)
 * support: sync/async
 * only for node.js
 */
Umecob.binding.file = (function(T) {
  if (!Umecob.node) return T;
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
})(new Umecob.binding());

/**
 * url binding
 * id: file path ( relative from this file, or absolute path)
 * support: sync/async
 * only for node.js
 * only support GET method.
 */
Umecob.binding.url = (function(T) {
  if (!Umecob.node) return T;
  var u2r = require("./lib/url2request");
  var url  = require("url");
  var http = require("http");
  var https = require("https");
  return T.impl({

    getSync : function(id) {
      throw Umecob.Error("BINDING_URL_SYNC");
    },

    getAsync : function(id) {
      var d = new Deferred();
      var op = u2r(id); 
      var protocol = op.protocol == 'https' ? https : http;
      var result = "";
      protocol.get(op, function(res) {
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
})(new Umecob.binding());


/**
 * Compiler
 */
// prepare scope for eval()
Umecob.eval = function(echo, code) { return eval(code); }
// evaluate for JSHINT
Umecob.evalScope = function(echo) {
  with(echo.data) {
    for (var i in this.errors) {
      try {
        var t = typeof eval(this.errors[i].a);
      }
      catch(e) {
        var t = "undefined";
      }
      if (t  === "undefined") { return { line: this.errors[i].line, reason: this.errors[i].reason }; }
    }
  }
  return false;
}

// Compiler generator       [    %      %    ]
Umecob.compiler = function(lf1, lf2,   rg1, rg2, nextState) {
  var C = {};

  C.run = function(params) {
    var buff = new T();
    var echo = function(txt) {
      buff.add(txt);
    };
    echo.params = params;
    echo.umecob = params.umecob;
    echo.sync = params.sync || false;
    echo.data = params.data;
    echo.defers = {};
    echo.addDefer = function(d) { echo.defers[buff.getIndex()] = d; buff.increment(); };
    echo.addUmecob = function(um) { ( um instanceof Deferred) ? echo.addDefer(um) : echo(um); };
    echo.put = function(i, v) { buff.put(i, v); };
    echo.getDefers = function() { return echo.defers; };
    echo.getText = function() { return buff.join(); };
    echo.getResult = function() {
      return echo.sync
        ? echo.getText()
        : Deferred.parallel(echo.getDefers()).next( function(results) {for ( var i in results ){ echo.put(i,results[i]) } return echo.getText() });
    };
    try {
      return Umecob.eval(echo, params.code);
    } catch (e) {
      var code4lint = params.code.replace(/->#JH#(\n|.)*?<-#JH#/g, '').split("\n");
      var tplname = params.tpl_id || ((typeof params.tpl == "string") 
        ? "template :  >>> " + params.tpl.substr(0, 50).replace(/\n/g, " ") + "...  "
        : "compiled code: >>> " + params.code.substr(76, 50).replace(/\n/g, " "));

      var hint = Umecob.Error.JSHINT(code4lint.join("\n"), e);
      if (!hint) {return e.stack || e.message || e;}
      var result = Umecob.evalScope.call(hint, echo);
      if (!result) {
        Umecob.log(e.stack || e.message || e);
        Umecob.log("Something is wrong with "+ tplname);
        return e.message || e;
      }
      var code = (typeof params.tpl == 'string') ? params.tpl.replace(/\n$/, '').split("\n") : code4lint;
      var reason = result.reason + "  in " + tplname;
      return Umecob.Error.showCode(code, reason, result.line, e);
    }
  };

  C.compile = function(params) {
    var tpl = params.tpl;
    var tplArr = (typeof tpl === "string")  ? (tpl.replace(/\r(\n)?/g, '\n').replace(/\0/g, '').replace(/\n$/, '') + '\0').split("") : '\0',
        i      = 0,
        state  = {
          name       : "START", 
          vals       : {braces: 0, linefeeds: 0},
          buffer     : new T(), 
          stack      : new T(),
          codeBuffer : new T() };

    state.codeBuffer.add("/*->#JH#*/with(echo.data){/*<-#JH#*/");

    try {
      while (state.name && trans[state.name]) {
        state.name = trans[state.name].call(state, tplArr[i++]);
      }
    } catch (e) {
      Umecob.log("Error  in  " + (params.tpl_id || params.tpl || params.code));
      Umecob.log(e.stack);
    }

    state.codeBuffer.add("\necho.getResult();\n");
    state.codeBuffer.add("/*->#JH#*/}/*<-#JH#*/");
    return state.codeBuffer.join("");
  };

  // T: buffer
   function T() { this.init(); };
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
  nextState = nextState || {};
  function setDefault (name, alt) {
    nextState[name] = (typeof nextState[name] == "function") ? nextState[name] : alt;
  };

  // 初期状態
  trans["START"] = function(c) {
    switch (c) {
    case "\n":
      this.vals.linefeeds++;
      return nextState.START.call(this, c);
    default:
      return nextState.START.call(this, c);
    case lf1:
      return "JS_PRE_START";
    case "$":
      return "PRE_SHORT_ECHO";
    case '\\':
      this.stack.push("START");
      return "ESCAPE";
    case '\0':
      strToCode.call(this);
      return null; // 終了
    }
  };
  setDefault('START', function(c) {
      this.buffer.add(c);
      return "START";
  });

  // $
  trans["PRE_SHORT_ECHO"] = function(c) {
    if (c == '{') {
      // strBufferの内容を吐き出す (thisはnew Compiler)
      strToCode.call(this);
      this.vals.braces = 1;
      return 'SHORT_ECHO';
    } else {
      this.buffer.add('$'+c);
      return 'START';
    }
  }
  // ${ }
  trans["SHORT_ECHO"] = function(c) {
    switch (c) {
    default:
      this.buffer.add(c);
      return 'SHORT_ECHO';
    case '{':
      this.buffer.add(c);
      this.vals.braces++;
      return 'SHORT_ECHO';
    case '?':
      if (this.vals.braces != 1) {
        this.buffer.add(c);
        return 'SHORT_ECHO';
      }
      else {
        return 'QS_SHORT_ECHO';
      }
    case '}':
      this.vals.braces--;
      if (this.vals.braces == 0) {
        this.codeBuffer.add('echo(' + ( this.buffer.join() ) + ');');
        this.buffer.clear();
        return 'START';
      } else {
        this.buffer.add(c);
        return 'SHORT_ECHO';
      }
    case "'":
      this.buffer.add(c);
      this.stack.push(this.name);
      return "INSIDE_SQ";
    case '"':
      this.buffer.add(c);
      this.stack.push(this.name);
      return "INSIDE_DQ";
    case '/':
      this.buffer.add(c);
      this.stack.push(this.name);
      return "JS_PRE_COMMENT";
    case '\\':
      this.stack.push(this.name);
      return "JS_ESCAPE";
    case '\0':
      throw Umecob.Error("COMPILER_STANDARD_CLOSE_TAG", '${', '}');
      return null;
    }
  }

  // ${hoge ? の状態
  trans["QS_SHORT_ECHO"] = function(c) {
    switch (c) {
    default:
      this.buffer.add('?');
      this.name = "SHORT_ECHO";
      return trans["SHORT_ECHO"].call(this, c);
    case ':':
      this.mainval = this.buffer.join();
      this.buffer.clear();
      return 'ALTERNATE_SHORT_ECHO';
    case '}':
      this.codeBuffer.add('/*->#JH#*/try{echo(echo.tmp=' + ( this.buffer.join() ) + '||(function(){throw ""})());}catch(e){}/*<-#JH#*/');
      this.buffer.clear();
      return 'START';
    }
  }

  // ${hoge ?: の状態
  trans["ALTERNATE_SHORT_ECHO"] = function(c) {
    switch (c) {
    default:
      this.buffer.add(c);
      return 'ALTERNATE_SHORT_ECHO';
    case '{':
      this.buffer.add(c);
      this.vals.braces++;
      return 'ALTERNATE_SHORT_ECHO';
    case '}':
      this.vals.braces--;
      if (this.vals.braces == 0) {
        this.codeBuffer.add('/*->#JH#*/try{echo(echo.tmp='+(this.mainval)+'||(function(){throw ""})());}catch(e){try{echo('+ this.buffer.join() +');}catch(e){}}/*<-#JH#*/');
        this.buffer.clear();
        return 'START';
      } else {
        this.buffer.add(c);
        return 'ALTERNATE_SHORT_ECHO';
      }
    case "'":
      this.buffer.add(c);
      this.stack.push(this.name);
      return "INSIDE_SQ";
    case '"':
      this.buffer.add(c);
      this.stack.push(this.name);
      return "INSIDE_DQ";
    case '/':
      this.buffer.add(c);
      this.stack.push(this.name);
      return "JS_PRE_COMMENT";
    case '\\':
      this.stack.push(this.name);
      return "JS_ESCAPE";
    case '\0':
      throw Umecob.Error("COMPILER_STANDARD_CLOSE_TAG", '${', '}');
      return null;
    }
  }

  // lf1 が出た状態
  trans["JS_PRE_START"] = function(c) {
    switch (c) {
    case lf2:
      // strBufferの内容を吐き出す (thisはnew Compiler)
      strToCode.call(this);
      return "JS_WAITING_COMMAND";
    default:
      return nextState.JS_PRE_START.call(this, c);
    }
  };
  setDefault('JS_PRE_START', function(c) {
      this.buffer.add(lf1);
      return trans["START"].call(this, c);
  });

  // rg1 rg2 が出た状態(e.g. %])。次に改行コードが出てきたらJSのコードに含める
  trans["FINISH_JS"] = function(c) {
    switch (c) {
    case '\n':
      this.codeBuffer.add('\n');
      return "START";
    default:
      return nextState.FINISH_JS.call(this, c);
    }
  };
  setDefault('FINISH_JS', function(c) {
      return trans["START"].call(this, c);
  });

  function strToCode() {
    if (this.buffer.getIndex() > 0) {
      var LF = "";
      for (var i=0; i<this.vals.linefeeds;i++) 
        LF+="\n";
      this.codeBuffer.add('echo("' + this.buffer.join().replace(/\\g/, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"')  + '");'+ LF);
      this.buffer.clear();
      this.vals.linefeeds = 0;
    }
  }

  // \ の次
  trans["ESCAPE"] = function(c) {
    switch (c) {
    case '\\':
    case lf1:
    case '$':
      this.buffer.add(c);
      return this.stack.pop();
    default:
      this.buffer.add('\\\\'+c);
      return this.stack.pop();
    }
  };

  // lf1 lf2 (e.g. [% )
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
      case rg1:
        return preEndStateName;
      case "'":
        this.buffer.add(c);
        this.stack.push(stateName);
        return "INSIDE_SQ";
      case '"':
        this.buffer.add(c);
        this.stack.push(stateName);
        return "INSIDE_DQ";
      case '/':
        this.buffer.add(c);
        this.stack.push(stateName);
        return "JS_PRE_COMMENT";
      default:
        this.buffer.add(c);
        return stateName;
      case '\0':
        throw Umecob.Error("COMPILER_STANDARD_CLOSE_TAG", lf1+lf2, rg1+rg2);
        return null;
      }
    };
  }

  function jsPreEndTemplate(mainStateName, fn) {
    return function(c) {
      switch (c) {
      case rg2:
        fn.apply(this);
        return "FINISH_JS"
      default:
        this.buffer.add(rg1+c);
        return mainStateName;
      case '\0':
        return trans[mainStateName].call(this, c);
      }
    };
  }

  // lf1 lf2 (e.g. [% )
  trans["JS_START"] = jsStartTemplate("JS_START", "JS_PRE_END");
  trans["JS_PRE_END"] = jsPreEndTemplate("JS_START", function() {
    this.codeBuffer.add( this.buffer.join() );
    this.buffer.clear();
  });

  // lf1 lf2 = (e.g. [%= )
  trans["JS_ECHO"] = jsStartTemplate("JS_ECHO", "JS_ECHO_PRE_END");
  trans["JS_ECHO_PRE_END"] = jsPreEndTemplate("JS_ECHO", function() {
    this.codeBuffer.add('echo(' + ( this.buffer.join() ) + ');');
    this.buffer.clear();
  });

  // lf1 lf2 { (e.g. [%{ )
  trans["JS_INCLUDE"] = jsStartTemplate("JS_INCLUDE", "JS_INCLUDE_PRE_END");
  trans["JS_INCLUDE_PRE_END"] = jsPreEndTemplate("JS_INCLUDE", function() {
    this.codeBuffer.add('echo.addUmecob(echo.umecob[echo.sync?"sync":"async"](' + ( this.buffer.join() ) + '));');
    this.buffer.clear();
  });

  // lf1 lf2 @ (e.g. [%@ )
  trans["JS_ASYNC"] = jsStartTemplate("JS_ASYNC", "JS_ASYNC_PRE_END");
  trans["JS_ASYNC_PRE_END"] = jsPreEndTemplate("JS_ASYNC", function() {
    this.codeBuffer.add('echo.addDefer(' + ( this.buffer.join() ) + ');');
    this.buffer.clear();
  });

  // / が出た場合. 正規表現とか割り算かもしれないけど
  trans["JS_PRE_COMMENT"] = function(c) {
    this.buffer.add(c);
    switch (c) {
    //case '/': return 'JS_SCOMMENT';
    case '*': return 'JS_MCOMMENT';
    default :  return this.stack.pop();
    }
  }
  /*
  // // が出た場合
  trans["JS_SCOMMENT"] = function(c) {
    this.buffer.add(c);
    return (c == '\n') ? this.stack.pop() : 'JS_SCOMMENT'; 
  }
  */
  // /* が出た場合
  trans["JS_MCOMMENT"] = function(c) {
    this.buffer.add(c);
    switch (c) {
    case '*': return 'JS_PRE_ENDMCOMMENT';
    default : return 'JS_MCOMMENT';
    }
  }
  // /* *
  trans["JS_PRE_ENDMCOMMENT"] = function(c) {
    this.buffer.add(c);
    switch (c) {
    case '/': return this.stack.pop();
    default : return trans['JS_MCOMMENT'].call(this, c);
    }
  }
  // quotation
  function insideQuotation(stateName, type) {
    setDefault(stateName, function(c) {
        this.buffer.add(c);
        return stateName;
    });
    return function(c) {
      switch (c) {
      case type:
        this.buffer.add(c);
        return this.stack.pop();
      default:
        return nextState[stateName].call(this, c);
      case '\0':
        return null;
        // throw Umecob.Error("COMPILER_STANDARD_QUOTATION", type);
      case '\n':
        return this.stack.pop();
      case '\\':
        this.stack.push(stateName);
        return 'JS_ESCAPE';
      }
    };
  }

  // ' の中の状態
  trans["INSIDE_SQ"] = insideQuotation("INSIDE_SQ", "'");
  // " の中の状態
  trans["INSIDE_DQ"] = insideQuotation("INSIDE_DQ", '"');
  // " の中でのescape
  trans["JS_ESCAPE"] = function(c) {
    this.buffer.add("\\"+c);
    return this.stack.pop();
  }

          
  return C;
} // Umecob.compiler end

Umecob.compiler.plain = {
  compile: function(params) {
    return params.code ||'';
  },
  run: function(params) {
    return params.result || '';
  }
};


/* add end functions */
Umecob.end = {
  logging: function(params) {
    Umecob.log('[parameters'+ ((params.name) ? ' of "'+ params.name +'"' : '') +']');
    Umecob.log(params);
    Umecob.log('\n[used configurations]');
    Umecob.log('binding_tpl : ' + this.binding_tpl._name);
    Umecob.log('binding_data : ' + this.binding_data._name);
    Umecob.log('compiler : ' + this.compiler._name);
    var startnames = 'start : ';
    for (var i in this.start) {
      startnames += this.start[i]._name + ' -> ';
    }
    Umecob.log(this.start.length >=1 ? startnames.slice(0, -4) : startnames);
    var endnames = 'end : ';
    for (var i in this.end) {
      endnames += this.end[i]._name + ' -> ';
    }
    Umecob.log(this.end.length >=1 ? endnames.slice(0, -4) : endnames);
  }
};


/**
 * Error
 */
Umecob.Error = function() {
  var name = arguments[0],
         e = new Error();
  e.message = (typeof Umecob.Error.messages[name] == "undefined")
      ? "("+arguments[0] + ") " +
        "Unspecified internal error occurred in umecob. If you have something to ask, "+
        "please feel free to send me an e-mail: shinout310 at gmail.com (Shin Suzuki)."
      : (typeof Umecob.Error.messages[name] == "function")
        ? Umecob.Error.messages[name].apply(this, arguments)
        : Umecob.Error.messages[name];
  e.name = "umecob.Error";
  return e;
};

/* notice : just return message */
Umecob.Error.notice = function(name) {
  return (typeof Umecob.Error.messages[name] == "function")
    ? Umecob.Error.messages[name].apply(this, arguments)
    : Umecob.Error.messages[name];
};

/* messages: setter/getter of message */
Umecob.Error.messages = function() {
  if ( arguments.length == 1)
    return Umecob.Error.messages[arguments[0]];

  if ( arguments.length == 2)
    Umecob.Error.messages[arguments[0]] = arguments[1];
};


/* hint: show error in detail using JSHINT */
Umecob.Error.JSHINT = function(code, e) {
  var option = {
    maxerr   : 10000000,
    browser  : true,
    undef    : true,
    boss     : true,
    evil     : true,
    devel    : true,
    asi      : true,
    forin    : true,
    jquery   : true,
    node     : true,
    on       : true,
    laxbreak : true
  }
  JSHINT = (typeof JSHINT == "function") ? JSHINT : (Umecob.node ? require("./jshint.js") : null);
  if (!JSHINT) {
    Umecob.log(Umecob.Error("JSHINT_REQUIRED"));
    Umecob.log(e.stack || e.message || e);
    return null;
  }
  JSHINT(code, option);
  return JSHINT;
}

Umecob.Error.showCode = function(arr, reason, line, e) {
  var code4disp = [];
  var k = Math.max(line - 10, 0);
  var limit = Math.min(arr.length, line + 10);
  while(k < limit) {
    code4disp.push( (k == line -1 ? "*" : " ") +  (parseInt(k)+1) + "\t"+arr[k]);
    k++;
  }
  var err = reason + " at line " + line + '.';
  Umecob.log(err);
  Umecob.log(Umecob.Error.messages("SHOW_CODE")("",code4disp.join("\n")));
  Umecob.log(e.stack || e.message || e);
  return err;
}

/* 
 * ERROR MESSAGES 
 */
Umecob.Error.messages("UMECOB_SET_NAME", function() { 
  if (arguments[1]) {
    return "Error occurred in " + arguments[1];
  }
  return "umecob Notice: If you want to know which umecob() threw this error, call umecob with 'name' option." +
  "  e.g.  umecob({name: 'sample_name', tpl_id: 'hoge' }); Also, it will be helpful if you set 'debug' preset." + 
  "  e.g.  umecob({preset: 'debug'}); ";
});
Umecob.Error.messages("DEFERRED_NOTFOUND", 
  "If you use umecob() asynchronously, you have to include \"JSDeferred\" library."+
  ' e.g. <script type="text/javascript" src="/path/to/umecob/jsdeferred.js"></script>');
Umecob.Error.messages("BINDING_NO_IMPL", "You must implement getSync(id) and getAsync(id) when extending Umecob.binding. ");

Umecob.Error.messages("SHOW_CODE", function(){ 
  return "//------------------------------------//\n" +
         "//-------------- start ---------------//\n" +
                        arguments[1]  + "\n"          +
         "//--------------- end ----------------//\n" +
         "//------------------------------------//\n";});
Umecob.Error.messages("COMPILER_STANDARD_UNKNOWN_STATE", function(){ return "State error: Unknown state '"+ arguments[1] +"' was given."});
Umecob.Error.messages("COMPILER_STANDARD_QUOTATION", function(){ return "Syntax error: you have to close quotation [" + arguments[1] +"']."});
Umecob.Error.messages("COMPILER_STANDARD_CLOSE_TAG", function(name, ldel, rdel){ return "Syntax error: you have to close '"+ldel+"' tag with '"+rdel+"' tag."});
Umecob.Error.messages("JSHINT_REQUIRED", 
  "Error occurred during eval(). If you want to see details of the error, please request " +
  'JSHINT.  e.g. <script type="text/javascript" src="/path/to/umecob/jshint.js"></script>');

/*********************
 *** EXPORT UMECOB ***
 *********************/
var umecob = Umecob('umecob');
if (Umecob.node) module.exports = umecob;
