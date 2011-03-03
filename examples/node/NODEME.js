/*** use umecob.js  ***/
var umecob = require("../../umecob.js");

function sectionize(msg) { 
  console.log("\n==================== "+ (msg || "") +" ======================"); 
  console.log("======================================================================\n"); 
}



/*** simple use ( asynchronous ) ***
 *
 * umecob(u);
 *
 * param u : object  
 *    tpl:  (string)    template 
 *    data: (object)    data to bind
 *      default: {}
 * return :   (Deferred) Deferred object which is already running.
 *            You can get rendered result by attaching next(function(result){}) .
 *
 ****************/
umecob({
  tpl:  "Embedded value 1: [%=val1%], value 2: [%=val2%]", 
  data: { val1 : "Hello", val2: "World!"}
})
.next(function(result) {
  console.log(result);  // here result is the rendered result.
  sectionize("Simple use finished");
});


/*** the simplest use (without data) ***/
umecob({tpl: "the simplest use without data! only 'tpl' option was passed." })
.next(function(result) {
  console.log(result);
  sectionize("The simplest use finished");
});


/*** synchronous use ***
 *
 * umecob(u);
 *
 * param u : object  
 *    tpl:  (string)    template 
 *    data: (object)    data to bind
 *    sync: (boolean)   true ? do synchronously : do asynchronously
 *      default: false
 * return : (string)    rendered result.
 *
 ****************/
var result = umecob({sync: true, tpl: "Synchro.... [%=val%] ",  data: {val: "nously ........."} });
console.log(result);
sectionize("Synchronous umecob has done.");




/*** use filesystem ***
 *
 * umecob.use("file")(u);
 *
 * param u : object  
 *    tpl_id :  (string) template file path.
 *    data_id:  (string) data file name. The data should be json or js object.
 *
 *   The path has to be :
 *            absolute path ( begins with '/')
 *                  or
 *            relative path from 'umecob.js'. Not from the running script!!
 *  
 **********************/

/* asynchronous */
umecob.use("file")({tpl_id: "examples/node/file_async.tpl", data: {title: "Asynchronous call of umecob", list: {key1: "val1", key2: "val2"}}  })
.next(function(result) {
  console.log(result);
  sectionize("filesystem fetching finished.");
});

/* synchronous */
var result = umecob.use("file")({sync: true, tpl_id: "examples/node/file_sync.tpl", data: {name: "ya", method: "Synchronous"}  })
console.log(result);
sectionize("filesystem fetching finished.");


/*** what is umecob.use() ??  ***
 *
 * umecob.use(binding);
 *
 * param binding : 
 *     (string) binding name you want to use.
 *              umecob.js prepares 5 bindings: file, url, jquery, xhr and default.
 *              default is 'default' binding and this cannot fetch templates or data from given tpl_id, data_id.
 *              Other four bindings are as belows.
 *
 *
 *      file:   use 'fs' module. for node.js.
 *      url:    use 'http' module. for node.js.
 *      jquery: use jQuery.ajax(). for client.
 *      xhr:    use XmlHttpRequet || ActiveXObject. for client.
 *
 *   Also, you can create your own binding ( explains later)
 *
 *   Once you call umecob.use(binding), 
 *   you don't need to call it again unless you want to change binding.
 *   This means umecob.use() is GLOBAL SETTING in umecob.
 *   When you'd like to use binding for specific use, you can call umecob() like 
 *
 *         umecob({ binding: "url", tpl_id: "/path/to/template", data: {E: "mc^2"}  });
 *                   ^
 *                  HERE.  This setting is prior to global setting via umecob.use().
 *
 *
 * return : (function) umecob.
 *          so you can write like  umecob.use("my_own_binding")({tpl_id:"hoge", data_id:"fuga", sync: false})  
 *                                                            ^^ 
 *                                                          connecting 
 *                                                          
 **********************/

/*** use URL ***
 *
 * umecob.use("url")(u);
 *
 * param u : object  
 *    tpl_id :  (string) template file url.
 *    data_id:  (string) data url.
 *
 *   The path has to be :
 *            absolute path ( begins with '/')
 *                  or
 *            relative path from 'umecob.js'. Not from the running script!!
 *  
 **********************/
 /*
 umecob.use("url")({tpl_id: "http://nodejs.org/docs/v0.4.1/api/http.html"})
 .next(function(result) {
   console.log(result);
   sectionize("Fetched from node.js");
 });

*/

/*** use different bindings between tpl and data ***
 *
 * umecob.use({tpl: t_binding, data: d_binding});
 *
 * param : object  
 *    t_binding :  (string) binding name for template
 *    d_binding :  (string) binding name for data
 *  
 **********************/
/*
umecob.use({tpl: "url", data: "file" })({tpl_id: "http://nodejs.org/docs/v0.4.1/api/http.html", data_id: "examples/node/included.data"})
 .next(function(result) {
   console.log(result);
   sectionize("used different bindings");
 });
*/

/*** pass Deferred object to tpl and/or data ***
 *
 * umecob({tpl: t_deferred, data: d_deferred});
 *
 * param : object  
 *    t_deferred : (Deferred) Deferred object whose next-registered function returns template.
 *    d_binding :  (Deferred) binding name for data whose next-registered function returns data.
 *  
 **********************/

umecob({
  tpl: Deferred.call(function(){ return "[%=hoge%]"; }),  
  data: Deferred.call(function(){ return {hoge: "Hello, Deferred"}; })
}).next(function(result){
  console.log(result);
  sectionize("pass Deferred.");
});
