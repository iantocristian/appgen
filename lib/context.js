"use strict";


var common = require('./common')

var _ = common._


var GenLog = common.genlog.GenLog


function ContextMan() {
  var self = {}

  self.forks = []

  
  self.init = function( deps, initspec ) {
    self.genlog = new GenLog()

    var ctxt = _.clone(deps)
    ctxt.spec = {}
    ctxt.genlog = self.genlog
    ctxt.resman.genlog = self.genlog
    ctxt.stepman.genlog = self.genlog
    ctxt.slotman.genlog = self.genlog

    var fork = self.fork( ctxt, initspec )
    self.genlog.log( fork, 'init', initspec)
  }


  self.fork = function( ctxt, forkdef ) {
    var forkspec = forkdef.spec
    var fork     = {spec:common.copydata(ctxt.spec)}

    for( var p in forkspec ) {
      fork.spec[p] = forkspec[p]
    }

    fork.name    = (ctxt.name?ctxt.name+'-':'')+forkdef.name
    fork.genlog  = ctxt.genlog
    fork.resman  = ctxt.resman
    fork.stepman = ctxt.stepman.fork()
    fork.slotman = ctxt.slotman.fork()
    self.forks.push(fork)

    self.genlog.log(ctxt,'fork',forkdef)
    return fork
  }
 
  
  self.nextfork = function() {
    return self.forks.pop()
  }


  self.api = function( ctxt ) {
    return {
      fork:    function(forkdef) { self.fork(ctxt,forkdef) },
      name:    ctxt.name,
      spec:    ctxt.spec,
      resman:  ctxt.resman,
      stepman: ctxt.stepman.api,
      slotman: ctxt.slotman.api,
      genlog:  self.genlog
    }
  }


  self.desc = function() {
    var desc = {forks:[]}
    for( var i = 0; i < self.forks.length; i++ ) {
      desc.forks.push({
        name:self.forks[i].name,
        spec:self.forks[i].spec
      })
    }
    return desc
  }

  return self
}


exports.ContextMan = ContextMan

