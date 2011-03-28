var test = require('./shinout.test/shinout.test');

var fns = {
  'hoge': {_name: 'hoge'},
  'fuga': {_name: 'fuga'},
  'piyo': {_name: 'piyo'},
}

function arrset(arr, type) {
  if (arr == null) return null;
  if (typeof arr == 'string') {
    var f = fns[arr];
    if (!f || typeof f != 'object') return null;
    return [f];
  }
  if (arr instanceof Array) {
    var l = arr.length;
    if (l == 0) return [];
    var ret = [];
    for (var i=0; i < l; i++) {
      var f = fns[ arr[i] ];
      if (f && typeof f == 'object') ret.push(f);
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

test.exe(function() {
  var a = ['fuga', 'piyo'];
  test('strictEqual', a.indexOf('piyo'), 1, 'invalid use of Array.indexOf()');
  test('strictEqual', a.indexOf('fuga'), 0, 'invalid use of Array.indexOf()');
  test('strictEqual', a.indexOf('hoge'), -1, 'invalid use of Array.indexOf()');
  test('result', 'Array.indexOf', true);
});


test.exe(function() {
  var a1 = null;
  var m1 = true;
  var a2 = 'fuga';
  var m2 = true;
  var a3 = ['hoge'];
  var result = merge(arrset(a1, 'start'), arrset(a2, 'start'), arrset(a3, 'start'), m1, m2);
  console.log(result);
  test('equal', result.length, 2, 'array invalid length');
  test('equal', result[0]._name, 'hoge', 'array invalid order');
  test('equal', result[1]._name, 'fuga', 'array invalid order');
  test('result', 'merge (true)');
});

test.exe(function() {
  var a1 = null;
  var m1 = 'post';
  var a2 = 'fuga';
  var m2 = 'post';
  var a3 = ['hoge'];
  var result = merge(arrset(a1, 'start'), arrset(a2, 'start'), arrset(a3, 'start'), m1, m2);
  console.log(result);
  test('equal', result.length, 2, 'array invalid length');
  test('equal', result[0]._name, 'fuga', 'array invalid order');
  test('equal', result[1]._name, 'hoge', 'array invalid order');
  test('result', 'merge post');
});

test.exe(function() {
  var a1 = null;
  var m1 = 'pre';
  var a2 = 'fuga';
  var m2 = 'pre';
  var a3 = ['hoge'];
  var result = merge(arrset(a1, 'start'), arrset(a2, 'start'), arrset(a3, 'start'), m1, m2);
  console.log(result);
  test('equal', result.length, 2, 'array invalid length');
  test('equal', result[0]._name, 'hoge', 'array invalid order');
  test('equal', result[1]._name, 'fuga', 'array invalid order');
  test('result', 'merge post');
});

test.exe(function() {
  var a1 = null;
  var m1 = 'pre';
  var a2 = 'fuga';
  var m2 = false;
  var a3 = ['hoge'];
  var result = merge(arrset(a1, 'start'), arrset(a2, 'start'), arrset(a3, 'start'), m1, m2);
  console.log(result);
  test('equal', result.length, 1, 'array invalid length');
  test('equal', result[0]._name, 'fuga', 'array invalid order');
  test('result', 'merge false');
});


test.exe(function() {
  var a1 = ['piyo', 'hoge'];
  var m1 = true;
  var a2 = 'piyo';
  var m2 = true;
  var a3 = ['hoge', 'fuga'];
  var result = merge(arrset(a1, 'start'), arrset(a2, 'start'), arrset(a3, 'start'), m1, m2);
  console.log(result);
  test('equal', result.length, 3, 'array invalid length');
  test('equal', result[0]._name, 'hoge', 'array invalid order');
  test('equal', result[1]._name, 'fuga', 'array invalid order');
  test('equal', result[2]._name, 'piyo', 'array invalid order');
  test('result', 'merge duplication');
});


test.exe(function() {
  var a1 = ['piyo', 'hoge'];
  var m1 = 'post';
  var a2 = 'piyo';
  var m2 = 'post';
  var a3 = ['hoge', 'fuga'];
  var result = merge(arrset(a1, 'start'), arrset(a2, 'start'), arrset(a3, 'start'), m1, m2);
  console.log(result);
  test('equal', result.length, 3, 'array invalid length');
  test('equal', result[0]._name, 'piyo', 'array invalid order');
  test('equal', result[1]._name, 'hoge', 'array invalid order');
  test('equal', result[2]._name, 'fuga', 'array invalid order');
  test('result', 'merge duplication post');
});

test.exe(function() {
  var a1 = ['piyo', 'hoge'];
  var m1 = 'post';
  var a2 = null;
  var m2 = 'post';
  var a3 = ['hoge', 'fuga'];
  var result = merge(arrset(a1, 'start'), arrset(a2, 'start'), arrset(a3, 'start'), m1, m2);
  console.log(result);
  test('equal', result.length, 3, 'array invalid length');
  test('equal', result[0]._name, 'piyo', 'array invalid order');
  test('equal', result[1]._name, 'hoge', 'array invalid order');
  test('equal', result[2]._name, 'fuga', 'array invalid order');
  test('result', 'mid null');
});

test.exe(function() {
  var a1 = null;
  var m1 = 'pre';
  var a2 = null;
  var m2 = 'pre';
  var a3 = null;
  var result = merge(arrset(a1, 'start'), arrset(a2, 'start'), arrset(a3, 'start'), m1, m2);
  console.log(result);
  test('equal', result.length, 0, 'array invalid length');
  test('ok', result instanceof Array, 'array invalid type');
  test('result', 'all null');
});

test.exe(function() {
  var a1 = null;
  var m1 = false;
  var a2 = ['hoge'];
  var m2 = false;
  var a3 = null;
  var result = merge(arrset(a1, 'start'), arrset(a2, 'start'), arrset(a3, 'start'), m1, m2);
  console.log(result);
  test('equal', result.length, 1, 'array invalid length');
  test('equal', result[0]._name, 'hoge', 'array invalid order');
  test('result', 'null and false');
});

test.exe(function() {
  var a1 = [];
  var m1 = false;
  var a2 = 'piyo';
  var m2 = 'pre';
  var a3 = ['hoge'];
  var result = merge(arrset(a1, 'start'), arrset(a2, 'start'), arrset(a3, 'start'), m1, m2);
  console.log(result);
  test('equal', result.length, 0, 'array invalid length');
  test('ok', result instanceof Array, 'array invalid type');
  test('result', 'empty and false');
});

