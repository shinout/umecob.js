var umecob = require('../../umecob');

var data = {
  title: "Features of umecob.js",
  arr: ["Synchronous/Asynchonous support",
        "Available in Both Clientside and Serverside(Node.js)",
        "Simple API",
        "Easy to customize",
        "No difficult syntax"]
}

/* There are three ways to implement */

// 1. use "use" option
umecob({use: {binding: 'file', compiler: 'jsp'}, tpl_id: __dirname + "/tpls/readfile.txt", data: data }).
next( function(result) {
  console.log(result);
});


// 2. use preset 
umecob.preset('readfile', {
  binding: 'file',
  compiler: 'jsp'
});

umecob({preset: 'readfile', tpl_id: __dirname + "/tpls/readfile.txt", data: data})
.next(function(result) {
  console.log(result);
});


// 3. use default preset
umecob.use({binding: 'file', compiler: 'jsp'})({
  tpl_id: __dirname + "/tpls/readfile.txt", 
  data: data
})
.next(function(r) {
  console.log(r);
});

