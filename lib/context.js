"use strict";


var common = require('./common')


var GenLog = common.genlog.GenLog


function ContextMan() {
  var self = {}

  self.forks = []

  
  self.init = function( ctxt, forkdef ) {
    self.genlog = new GenLog()
    self.genlog.log(ctxt,'init',forkdef)

    ctxt.resman.genlog = self.genlog
    ctxt.stepman.genlog = self.genlog
    ctxt.slotman.genlog = self.genlog

    var fork = self.fork( ctxt, forkdef )
  }


  self.fork = function( ctxt, forkdef ) {
    var desc = forkdef.desc
    var fork = {desc:{}}

    for( var p in ctxt.desc ) {
      fork.desc[p] = ctxt.desc[p]
    }

    for( var p in desc ) {
      fork.desc[p] = desc[p]
    }

    fork.name    = forkdef.name
    fork.resman  = ctxt.resman
    fork.stepman = ctxt.stepman.fork( desc )
    fork.slotman = ctxt.slotman.fork( desc )
    self.forks.push(fork)

    self.genlog.log(ctxt,'fork',forkdef)
    return fork
  }
 
  
  self.nextfork = function() {
    return self.forks.pop()
  }


  self.api = function(fork) {
    return {
      fork:    function(forkdef) { self.fork(fork,forkdef) },
      name:    fork.name,
      desc:    fork.desc,
      resman:  fork.resman,
      stepman: fork.stepman.api,
      slotman: fork.slotman.api,
      genlog:  self.genlog
    }
  }


  return self
}


exports.ContextMan = ContextMan

