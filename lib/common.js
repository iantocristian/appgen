
exports.fs = require('fs')
exports.fspath = require('path')


exports.eyes      = require('eyes')
exports.optimist  = require('optimist')
exports.cson      = require('cson')
exports.glob      = require('glob')
exports.ejs       = require('ejs')

var _         = exports._          = require('underscore')
var jsonquery = exports.jsonquery  = require('./jsonquery')

exports.genlog  = require('./genlog')
exports.resman  = require('./resman')
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
        tar[p] = tar[p] || (v instanceof Array ? [] : {})
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
var interpolate = exports.interpolate = function( str, spec, mode, ctxt, cb ) {

  function onerr( err ) {
    if( cb ) { 
      return cb(err) 
    }
    else throw err;
  }

  if( mode && mode instanceof Function ) {
    cb = mode
    mode = null
    ctxt = null
  }
  else if( ctxt && ctxt instanceof Function ) {
    cb = ctxt
    ctxt = null
  }

  if( mode && mode.resource ){
    if( !ctxt || !ctxt.resman ) {
      return onerr( new Error('mode.resource requires ctxt argument') )
    }
  }

  str = ' '+str
  mode = mode || ''
  var sb = []
  var re = /[^#]#\{(.*?)\}/g
  var mindex = 0, mlen = 1
  var i=-1
  
  function nextmatch(whence) {
    mlast = mindex+mlen
    i++

    var m = re.exec(str);
    if( !m ) {
      sb.push( str.substring(mlast) )
      var out = sb.join('')

      if( 0 < i ) {
        return interpolate(out, spec, mode, ctxt, cb)
      }
      else {
        // escape: ##{...} -> #{...}
        out = out.replace(/#(#+{.*?})/g,'$1')

        if( cb ) { cb(null,out) }
        return out; 
      }
    }

    mindex = m.index+1
    mlen   = m[0].length-1
    sb.push( str.substring(mlast,mindex) )


    var q = m[1]

    if( '#'===q.charAt(0) ) {
      if( mode.resource ) {
        var respath = q.substring(1)

        ctxt.resman.load({path:respath},function(err,resource) {
          if( err ) { return onerr(err) }

          if( !resource ) {
            return onerr( new Error('resource not found: '+respath) )
          }

          sb.push(resource.text)
          nextmatch('resource')
        })
        return
      }
      else {
        sb.push(m[0].substring(1))
        return nextmatch('no-resource')
      }
    }
    else {
      var val = jsonquery.JSONQuery(q,spec)

      if( mode.required ) {
        if( val === void 0 ) {
          return onerr( new Error("reference '"+m[1]+"' has no matches") )
        }
      }

      // helpful for debugging
      if( !_.isString(val) ) {
        val = JSON.stringify(val)

        // but don't go down the rabbit hole - escape any embedded interpolates
        val = val.replace(/#\{(.*?)\}/g,'##{$1}')
      }

      sb.push(val)
      return nextmatch('insert')
    }
  }

  return nextmatch('start')
}


var walk = exports.walk = function( obj, exclude, op ) {
  if( !op ) {
    op = exclude
    exclude = {}
  }
  if( !exclude ) {
    exclude = {}
  }

  if( _.isArray( exclude ) ) {
    var map = {}
    exclude.forEach(function(val){map[val]=1})
    exclude = map
  }

  for( var p in obj ) {
    if( !exclude[p] ) {
      obj[p] = op(obj[p])
      if( obj[p] instanceof Object ) {
        walk(obj[p],op)
      }
    }
  }
  return obj
}



exports.setvalue = function( obj, ref, val ) {
  var cur = obj
  var parts = ref.split(/\./)
  for( var i = 0; i < parts.length-1; i++ ) {
    var part = parts[i]
    cur = cur[part] ? cur[part] : (cur[part]={})
  }
  cur[parts[i]] = val
  return obj
}


exports.emptystr = function( str ) {
  if( 0 === str || false === str ) return false;
  return null == str || '' == str
}