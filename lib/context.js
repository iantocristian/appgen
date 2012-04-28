
var common = require('./common')


function ContextMan() {
  var self = {}

  self.forks = []

  
  self.init = function( ctxt, desc ) {
    self.fork( ctxt, desc )
  }


  self.fork = function( ctxt, desc ) {
    var fork = {desc:{}}

    for( var p in ctxt.desc ) {
      fork.desc[p] = ctxt.desc[p]
    }

    for( var p in desc ) {
      fork.desc[p] = desc[p]
    }

    fork.resman  = ctxt.resman
    fork.stepman = ctxt.stepman.fork( desc )
    fork.slotman = ctxt.slotman.fork( desc )
    self.forks.push(fork)

    console.log('FORK:'+JSON.stringify(desc)+' forks:'+self.forks.length)
  }
 
  
  self.nextfork = function() {
    return self.forks.pop()
  }


  self.api = function(fork) {
    return {
      fork:    function(desc) { self.fork(fork,desc) },
      desc:    fork.desc,
      resman:  fork.resman,
      stepman: fork.stepman.api,
      slotman: fork.slotman.api,
    }
  }


  return self
}


exports.ContextMan = ContextMan

