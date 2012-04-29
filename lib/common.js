
exports.eyes = require('eyes')
exports._    = require('underscore')



exports.genlog  = require('./genlog')
exports.resman  = require('./resman')
exports.slotman = require('./slotman')
exports.stepman = require('./stepman')
exports.context = require('./context')




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

