
exports.fs = require('fs')
exports.fspath = require('path')
exports.util      = require('util')
exports.childproc = require('child_process')


exports.eyes      = require('eyes')
exports.optimist  = require('optimist')
exports.cson      = require('cson')
exports.glob      = require('glob')
exports.ejs       = require('ejs')
exports.gex       = require('gex')

var _         = exports._          = require('underscore')
var jsonquery = exports.jsonquery  = require('./jsonquery')

exports.genlog  = require('./genlog')
exports.resman  = require('./resman')
exports.stepman = require('./stepman')
exports.context = require('./context')
exports.appgen  = require('./appgen')


exports.Step = require('./step/Step').Step


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
  if( _.isDate(obj) ) {
    var copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }
  
  // Handle Array
  if( _.isArray(obj) ) {
    var copy = [];
    for (var i = 0, len = obj.length; i < len; ++i) {
      copy[i] = copydata(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if( _.isObject(obj) ) {
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
      if( _.isObject(v) ) {
        tar[p] = tar[p] || (_.isArray(v) ? [] : {})
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


var interpolate_re  = /[^$]\$\{(.*?)\}/g
var interpolate_lit = /\$(\$+{.*?})/g
var interpolate_esc    = /\$\{(.*?)\}/g
var interpolate_escrep = '\\$\\${$1}'

// ${jsonquery} - interpolate, $${...} - escaped, ${$...} - resource reference
var interpolate = exports.interpolate = function( str, spec, opt, ctxt, cb ) {
  //console.log('intp ['+str+'] opt:'+JSON.stringify(opt))

  var startchar = '$'
  var re = interpolate_re

  if( opt && opt.mark ) {
    var ms = startchar = opt.mark.start || '$'
    var mo = opt.mark.open  || '{'
    var mc = opt.mark.close || '}'
    interpolate_re  = new RegExp('[^\\'+ms+']\\'+ms+'\\'+mo+'(.*?)\\'+mc,'g')
    interpolate_lit = new RegExp('\\'+ms+'(\\'+ms+'+\\'+mo+'.*?\\'+mc+')','g')
    interpolate_esc = new RegExp('/\\'+ms+'\\'+mo+'(.*?)\\'+mc+'','g')
    interpolate_escrep = '\\'+ms+'\\'+ms+mo+'$1'+mc
  }


  function onerr( err ) {
    if( cb ) { 
      return cb(err) 
    }
    else throw err;
  }

  if( opt && _.isFunction(opt) ) {
    cb = opt
    opt = null
    ctxt = null
  }
  else if( ctxt && _.isFunction(ctxt) ) {
    cb = ctxt
    ctxt = null
  }

  if( opt && opt.resource ){
    if( !ctxt || !ctxt.resman ) {
      return onerr( new Error('opt.resource requires ctxt argument') )
    }
  }

  str = ' '+str
  opt = opt || ''
  var sb = []
  var mindex = 0, mlen = 1
  var i=-1
  
  function nextmatch(whence,lastq,val) {
    //console.log('nm '+whence+' '+i+' '+sb)

    mlast = mindex+mlen
    i++

    var m = re.exec(str);
    if( !m ) {
      sb.push( str.substring(mlast) )
      var out = sb.join('')

      if( 0 < i ) {
        opt.previous = opt.previous || {}
        if( !opt.previous[out] ) {
          opt.previous[out]=true
          var ret = interpolate(out, spec, opt, ctxt, cb)
          delete opt.previous[out]
          return ret
        }
        else {
          return onerr( new Error('circular reference: '+lastq+' -> '+val) )
        }
      }
      else {
        // literals: $${...} -> ${...}
        out = out.replace(interpolate_lit,'$1')

        if( cb ) { cb(null,out) }
        return out; 
      }
    }

    mindex = m.index+1
    mlen   = m[0].length-1
    sb.push( str.substring(mlast,mindex) )


    var q = m[1]

    if( startchar===q.charAt(0) ) {
      if( opt.resource ) {
        var respath = q.substring(1)

        ctxt.resman.load({path:respath},function(err,resource) {
          if( err ) { return onerr(err) }

          if( !resource ) {
            return onerr( new Error('resource not found: '+respath) )
          }

          sb.push(resource.text)
          nextmatch('resource',q,val)
        })
        return
      }
      else {
        sb.push(m[0].substring(1))
        return nextmatch('no-resource',q,val)
      }
    }
    else {
      var val = jsonq(q,spec)
      //console.log('q='+q+' val='+val+' opt.req='+opt.required)

      if( opt.required ) {
        if( isUndef(val) ) {
          return onerr( new Error("reference '"+m[1]+"' has no matches") )
        }
      }

      // not a match, so don't count, leave markers in place
      else {
        val = "${"+q+"}"
        i-- 
      }

      // helpful for debugging
      if( val && !_.isString(val) ) {
        var valstr = JSON.stringify(val)
        //console.log(q+' : '+val+' -> '+valstr)

        // but don't go down the rabbit hole - escape any embedded interpolates
        val = valstr.replace(interpolate_esc,interpolate_escrep)
      }

      sb.push(val)
      return nextmatch('insert',q,val)
    }
  }

  return nextmatch('start')
}


// op call: op(value, propname, parents)
var walk = exports.walk = function( obj, exclude, parents, op ) {
  //try { throw new Error() } catch( e ) { console.log(e.stack) }
  //console.log('A ('+exclude+') ('+JSON.stringify(parents)+') '+JSON.stringify(obj))

  if( !op ) {
    op = parents
    parents = []
  }
  if( !op ) {
    op = exclude
    exclude = {}
  }
  if( !parents ) {
    parents = []
  }
  if( !exclude ) {
    exclude = {}
  }

  //console.log('B ('+JSON.stringify(exclude)+') ('+JSON.stringify(parents)+') '+JSON.stringify(obj))

  if( _.isArray( exclude ) ) {
    var map = {}
    exclude.forEach(function(val){map[val]=1})
    exclude = map
  }

  var excludeFunc = _.isFunction(exclude) ? exclude : null


  for( var p in obj ) {
    var include = !exclude[p]
    if( excludeFunc ) {
      include = !excludeFunc(p, obj[p])
    }

    //console.log('include '+p+': '+include)

    if( include ) {
      obj[p] = op(obj[p],p,parents)
      var pp = parents.concat(p)

      if( _.isObject(obj[p]) ) {
        walk(obj[p],exclude,pp,op)
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


exports.getvalue = function( obj, ref ) {
  var val = jsonquery.JSONQuery(ref,obj)
  return val
}


exports.emptystr = function( str ) {
  if( 0 === str || false === str ) return false;
  return null == str || '' == str
}



var jsonq = exports.jsonq = function(q,obj) {
  var cq = q

  // remove interpolation markers if present
  var m = /^\$\{(.*)\}$/.exec(q)
  if( m ) {
    cq = m[1]
  }
    
  try {
    return jsonquery.JSONQuery(cq,obj)
  }
  catch(ex) {

    // jsonquery expression was ok, but evaluation failed, so return undef
    if( 'TypeError' == ex.constructor.name ) {
      if( 0 == ex.message.indexOf('Cannot read property') ) {
        return void(0)
      }
    }

    throw new Error('Invalid JSON query expression. '+ex.message+' in query '+cq)
  }
}



var isTrue = exports.isTrue = function( val) {
  return !isFalse(val)
}

var isFalse = exports.isFalse  = function( val ) {
  var bool = !(val)
  var str = ''+val
  return bool||'false'==str||'FALSE'==str||'f'==str||'F'==str||'no'==str||'NO'==str||'n'==str||'N'==str
}

var isUndef = exports.isUndef = function( val ) {
  return val == void 0;
} 
