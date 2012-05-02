
exports.fs = require('fs')
exports.path = require('path')


exports.eyes      = require('eyes')
exports._         = require('underscore')
exports.optimist  = require('optimist')


var jsonquery = exports.jsonquery  = require('./jsonquery')

exports.genlog  = require('./genlog')
exports.resman  = require('./resman')
exports.slotman = require('./slotman')
exports.stepman = require('./stepman')
exports.context = require('./context')
exports.appgen  = require('./appgen')




exports.delegate = function( scope, func ) {
  return function() {
    return func.apply(scope,arguments)
  }
}


exports.clear_require = function() {
  Object.keys(require.cache).forEach(function(name){delete require.cache[name]})
}



// only for literal tree data with no "funnies"
// see http://stackoverflow.com/questions/728360/copying-an-object-in-javascript/728694#728694
var copydata = exports.copydata = function(obj) {

  // Handle the 3 simple types, and null or undefined
  if (null == obj || "object" != typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
    var copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }
  
  // Handle Array
    if (obj instanceof Array) {
      var copy = [];
      for (var i = 0, len = obj.length; i < len; ++i) {
        copy[i] = copydata(obj[i]);
      }
      return copy;
    }

  // Handle Object
  if (obj instanceof Object) {
    var copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = copydata(obj[attr]);
    }
    return copy;
  }
  
  throw new Error("Unable to copy obj! Its type isn't supported.");
}


exports.deepoverride = function(base,primary) {
  var out = copydata(base)

  override(primary,out)
  function override(src,tar) {
    for( var p in src ) {
      var v = src[p]

      // this also works for arrays - allows index-specific overides if object used - see test/common-test.js
      if( v instanceof Object ) {
        tar[p] = tar[p] || {}
        override(src[p],tar[p])
      }
      else {
        tar[p] = v
      }
    }
  }

  return out
}



exports.exitmsg = function(msg,val) {
  console.error( 'Error: '+msg )
  process.exit(val||1)
}



// #{jsonquery} - interpolate, ##{...} - literal
var interpolate = exports.interpolate = function( str, spec ) {
  str = ' '+str
  var sb = []
  var re = /[^#]#\{(.*?)\}/g
  var mlast = 1
  var m,i=0
  while( m = re.exec(str) ) {
    var mindex = m.index+1
    var mlen   = m[0].length-1
    sb.push( str.substring(mlast,mindex) )
    var val = jsonquery.JSONQuery(m[1],spec)
    sb.push(val)
    mlast = mindex+mlen
    i++
  }
  sb.push( str.substring(mlast) )
  var out = sb.join('')
  return 0==i ? out : interpolate(out, spec)
}