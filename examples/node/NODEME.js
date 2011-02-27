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
 *            relative path from umecob.js
 *  
 **********************/


/* asynchronous */
umecob.use("file")({tpl_id: "examples/node/file_async.tpl", data: {title: "Asynchronous call of umecob", list: {key1: "val1", key2: "val2"}}  })
.next(function(result) {
  console.log(result);
  sectionize();
});






/* synchronous */
var result = umecob.use("file")({sync: true, tpl_id: "examples/node/file_sync.tpl", data: {name: "ya", method: "Synchronous"}  })
console.log(result);
sectionize();





