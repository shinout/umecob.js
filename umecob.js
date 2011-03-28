/**
 * umecob.js
 * @author SHIN Suzuki
 * @version 1.1.0
 */

function Umecob(id) { // this function is meaningless. Just for making a scope.
  if (Umecob.instances[id]) {
    Umecob.log('id "'+ id + '" already exists. return the function (new function was not created.)');
    return Umecob.instances[id];
  }

  /**
   * function umecob(params)
   * render string from template and data.
   *
   * @param params object:
   *     tpl_id  mixed   : Identifier of template. This is parsed by binding. 
   *                         e.g. If binding is 'file', id means path.
   *     tpl     string  : Template. If this option is passed, tpl_id is ignored.
   *                            
   *     code    string  : JavaScript code compiled from template. 
   *                         If this option is passed, tpl_id and tpl is ignored.
   *     data_id mixed   : Identifier of data to pass to the template. This is parsed by binding.
   *                         e.g. If binding is 'jquery', id means url.
   *     data    object  : Data to pass to the template. If this option is passed, data_id is ignored.
   *
   *     attach  mixed   : After 'data' is prepared, this 'attach' is attached to the data (if typeof attach == object).
   *                         If typeof attach is function, then returned value is merged to 'data'. 
   *     result  string  : Rendered result. If this option is passed, umecob just returns this value
   *                         without doing anything.
   *     umecob function : umecob function in compiler scope. Default: this function.
   *
   *    ---------------------------------------------------------------------------------------
   *     These above are modified in umecob() process.                            
   *     These below are not modified in umecob() process.                            
   *    ---------------------------------------------------------------------------------------
   *     preset  string  : Preset name you registered. Default preset is 'plain'.
   *                         You can register your own preset by calling umecob.preset(name, preset_object) 
   *     use     mixed   : Use one-time setting. This setting is prior to 'preset' option.
   *
   *     sync    boolean : If true, calls this function synchronously and returns result.
   *                        If false, returns Deferred object which passes the result to next function. Default: false
   * @return if synchronous,    returns (string) result.
   *         if asynchronous,   returns Deferred object ( next function can get result at first argument)
   *         if error happened, returns error message(sync), Deferred object (next function gets error message) (async)
   * 
   */
  function umecob(params) {
    if (typeof params != 'object') params = {};
    params.umecob = params.umecob || umecob;
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

  /**
   * function umecob.use(setting [, append=true])
   * set 'plain' preset with given setting.
   *
   * @param setting mixed :
   *    See umecob.preset
   * @param append boolean : if true, append given setting to older one. 
   *                         Otherwise, given setting totally replaces. Default: true
   * @return [Function] umecob
   *
   */
  umecob.use = function(setting, append) {
    return umecob.preset('plain', setting, append);
  }

  /**
   * function umecob.preset(name [,setting [, append=true]])
   * register preset of given name with given setting.
   *
   * @param setting mixed:
   *   [if typeof setting == null]
   *     return umecob.preset.get(name)
   *     See umecob.preset.get
   *   [if typeof setting == string]
   *     setting string : binding name.
   *
   *   [if typeof setting == object]
   *     binding  mixed       : Setting of binding. default: 'plain'.
   *                              If string, setting is applied to both template binding and data binding.
   *                              If object, e.g. {tpl: 'binding_name_for_template', data: 'binding_name_for_data'}
   *     compiler string      : Setting of compiler. default: 'standard'.
   *
   *     start Array<string>  : Setting of start functions. default: []
   *
   *     end   Array<string>  : Setting of end functions. default: []
   *     merge_start string   : If 'pre', merge the setting of start array in 'plain' before this start.
   *                              If 'post', merge the setting of start array in 'plain' after this start.
   *                              If '' or false, never merges. Default : false.
   *     merge_end   string   : If 'pre', merge the setting of end array in 'plain' before this end.
   *                              If 'post', merge the setting of end array in 'plain' after this end.
   *                              If '' or false, never merges. Default : false.
   * @param append boolean : If true, append given setting to older one if exists. 
   *                         Otherwise, given setting totally replaces. Default: true
   *
   * @return [Function] umecob
   *
   */
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

  /**
   * function umecob.preset.push(type, name, fname)
   * push 'fname' function to 'type' (start or end) array of 'name' preset
   *
   * @param type string : must be 'start' or 'end'
   * @param name string : preset name
   * @param fname string : function name to push
   * @return [Function] umecob
   *
   */
  umecob.preset.push = function(type, name, fname) {
    if (typeof umecob.preset.vals[name] != 'object') return umecob;
    var arr = umecob.preset.vals[name][type] || [];
    arr.push(fname);
    umecob.preset.vals[name][type] = arr;
    return umecob;
  }

  /**
   * function umecob.preset.get(name)
   * get preset object specified by 'name' 
   * @param name string
   * @return object : preset object
   */
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

  /**
   *
   * function umecob.binding(name [,value, use=true])
   * function umecob.compiler(name [,value, use=true])
   * function umecob.start(name [,value, use=true])
   * function umecob.end(name [,value, use=true])
   *
   * (These four functions have similar format, so here writes about 'binding' in detail.)
   * If 'value' exists, execute umecob.binding.register(name, value, use)
   * Otherwise, execute umecob.binding.get(name)
   *
   *
   * function umecob.binding.get(name)       
   * (also available in compiler, start, end instead of 'binding')
   * Get a registered setting identified by name
   * @param name string
   * @return mixed : registered value
   *
   *
   * function umecob.binding.register(name, value [, use=true])  
   * (also available in compiler, start, end instead of 'binding')
   * Register a setting with given 'name'
   * @param name  string
   * @param value mixed: setting
   *   'binding' requires the same format as the object below for this 'value'.
   *      { getTemplate: {
   *          sync: function(tpl_id) { // returns a template string}
   *          async: function(tpl_id) { // returns Deferred object 
   *                                    //(the first argument of the next function is a data object)}
   *        },
   *        getData: {
   *          sync: function(data_id) { // returns a data object}
   *          async: function(data_id) { // returns Deferred object 
   *                                     //(the first argument of the next function is a data object)}
   *        },
   *      }
   *   'compiler' requires the same format as the object below for this 'value'.
   *      { compile : function(params) { //returns compiled code. params is the same argument as umecob(params) }
   *        run     : function(params) { //returns result if sync, Deferred object if async. 
   *                                     // params is the same argument as umecob(params) } }
   *   'start'
   *   'end'   requires the same format as the function below for this 'value'.
   *      function(params) {
   *        returns void. params is the same argument as umecob(params), 
   *        You can modify these parameters in this function.
   *        In 'end' functions, you can utilize the rendered values like params.result, params.tpl etc...
   *        'this' keyword in the function stands for 'configuration object.' 
   *        configuration object is as follows.
   *        { binding_tpl:  //binding object for preparing template
   *          binding_data: //binding object for preparing data
   *          compiler:     //compiler object for rendering result
   *          start:        //start functions being used by current umecob()
   *          end:          //end functions being used by current umecob()  }
   *      }
   * @param use   boolean : If true, set given 'name' as 'plain' setting. Default: true
   *                        If the target is 'start' or 'end', then added to original array.
   * @return umecob
   *
   *
   * function umecob.binding.remove(name)     (also available in compiler, start, end instead of 'binding')
   * Delete a registered setting.
   * @param name  string
   * @return umecob
   *
   */
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
      var preset = (typeof params.preset == 'string') ? umecob.preset.vals[params.preset] : {};
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
Umecob.version = '1.1.0'; 

/* log */
Umecob.log = console.log;

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
      Umecob.Error.hint(str);
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
// Compiler generator       [    %      %    ]
Umecob.compiler = function(lf1, lf2,   rg1, rg2) {
  var C = {};

  C.compile = function(params) {
    var tpl = params.tpl;
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
          : (function(){ throw Umecob.Error("COMPILER_STANDARD_UNKNOWN_STATE");})();
      }
    } catch (e) {
      Umecob.log(e + "  in  " + (params.tpl_id || params.tpl || params.code));
    }

    state.codeBuffer.add("echo.getResult();");
    state.codeBuffer.add("} // this line has to be removed when passing to #JSHINT#");
    return state.codeBuffer.join("\n");
  };

  C.run = function(params) {
    var buff = new T();
    var echo = function(txt) {
      buff.add(txt);
    };

    echo.umecob = params.umecob;
    echo.sync = params.sync || false;
    echo.data = params.data;
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
      return eval(params.code);
    } catch (e) {
      JSHINT = (typeof JSHINT == "function") ? JSHINT : (Umecob.node ? require("./jshint.js") : null)
      if (!JSHINT) {
        Umecob.log(Umecob.Error("JSHINT_REQUIRED"));
        Umecob.log(e.message || e);
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

      function getTplName(params) {
        return params.tpl_id || ((typeof params.tpl == "string") 
            ? "template :  >>> " + params.tpl.substr(0, 50).replace(/\n/g, " ") + "...  "
            : "compiled code: >>> " + params.code.substr(76, 50).replace(/\n/g, " ")
        );
      }

      var codes = params.code.split("\n"),
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
        Umecob.log(e.message || e);
        Umecob.log("Something is wrong with "+ getTplName(params));
        return e.message || e;
      }

      if (!params.tpl) {
        var k = Math.max(result.line - 10, 0);
        var limit = Math.min(code4lint.getIndex(), result.line + 10);
        while(k < limit) {
          code4disp.add( (k == result.line -1 ? "*" : " ") +  (parseInt(k)+1) + "\t"+code4lint.get(k));
          k++;
        }
        var err = result.reason + "   in  " + getTplName(params) + "  at line " + result.line;
        Umecob.log(err);
        Umecob.log(Umecob.Error.messages("SHOW_CODE")("",code4disp.join("\n")));
        Umecob.log(e.message || e);
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
      var tplines = params.tpl.split("\n");
      var k = Math.max(line - 10, 0);
      var limit = Math.min(tplines.length, line + 10);
      while(k < limit) {
        code4disp.add( (k == line -1 ? "*" : " ") +  (parseInt(k)+1) + "\t"+tplines[k]);
        k++;
      }
      var err = result.reason + "   in  " + getTplName(params) + "  at line " + line  + " (in compiled code line "+ result.line +")";
      Umecob.log(err);
      Umecob.log(Umecob.Error.messages("SHOW_CODE")("",code4disp.join("\n")));
      Umecob.log(e.message || e);
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
    case lf1:
      return "JS_PRE_START";
    case '\\':
      this.stack.push("START");
      return "ESCAPE";
    case '\0':
      strToCode.call(this);
      return null; // 終了
    }
  };

  // rg1 rg2 が出た状態(e.g. %])。次に改行コードが出てきたら無視
  trans["FINISH_JS"] = function(c) {
    switch (c) {
    case '\n':
      return "START";
    default:
      return trans["START"].call(this, c);
    }
  };

  // lf1 が出た状態
  trans["JS_PRE_START"] = function(c) {
    switch (c) {
    case lf2:
      // strBufferの内容を吐き出す (thisはnew Compiler)
      strToCode.call(this);
      return "JS_WAITING_COMMAND";
    default:
      this.buffer.add(lf1);
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
        // throw Umecob.Error("COMPILER_STANDARD_QUOTATION", type);
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
    case lf1:
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
      case '\\':
        this.stack.push(stateName);
        return "ESCAPE";
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
    this.codeBuffer.add('echo.addUmecob(echo.umecob(' + ( this.buffer.join() ) + '));');
    this.buffer.clear();
  });

  // lf1 lf2 @ (e.g. [%@ )
  trans["JS_ASYNC"] = jsStartTemplate("JS_ASYNC", "JS_ASYNC_PRE_END");
  trans["JS_ASYNC_PRE_END"] = jsPreEndTemplate("JS_ASYNC", function() {
    this.codeBuffer.add('echo.addDefer(' + ( this.buffer.join() ) + ');');
    this.buffer.clear();
  });

          
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
Umecob.Error.notice = function() {
  return (typeof Umecob.Error.messages[arguments[0]] == "function")
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
Umecob.Error.hint = function(str) {
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
    Umecob.log(e.message || e);
    Umecob.log(JSHINT.errors[0].reason+" at line " + linenum + " (evaled code below.)");
    Umecob.log(Umecob.Error.messages("SHOW_CODE")("",code4disp.join("\n")));
  } else {
    Umecob.log(Umecob.Error("JSHINT_REQUIRED"));
    Umecob.log(e.message || e);
  }
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
  return "\n\n//------------------------------------//\n" +
         "//-------------- start ---------------//\n" +
                        arguments[1]  + "\n"          +
         "//--------------- end ----------------//\n" +
         "//------------------------------------//\n\n";});
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
