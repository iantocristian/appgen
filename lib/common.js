

exports.resman  = require('./resman')
exports.slotman = require('./slotman')
exports.stepman = require('./stepman')
exports.context = require('./context')
exports.genlog  = require('./genlog')



exports.delegate = function( scope, func ) {
  return function() {
    return func.apply(scope,arguments)
  }
}


exports.clear_require = function() {
  Object.keys(require.cache).forEach(function(name){delete require.cache[name]})
}



