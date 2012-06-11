"use strict";


var common = require('./common')

var _ = common._


var GenLog = common.genlog.GenLog


function ContextMan() {
  var self = {}

  self.forks = []

  
  self.init = function( deps, initctxt ) {
    self.genlog = deps.genlog

    var ctxt = _.clone(deps)
    ctxt.spec = {res:{},gen:{},conf:{},steps:[]}
    ctxt.resman.genlog = self.genlog
    ctxt.stepman.genlog = self.genlog
    //ctxt.slotman.genlog = self.genlog

    initctxt.init = true
    var fork = self.fork( ctxt, initctxt )
    self.genlog.log( fork, 'init', initctxt.spec.conf)
  }


  self.fork = function( ctxt, forkdef ) {
    var fork = {}

    fork.spec       = common.deepoverride(ctxt.spec,forkdef.spec)
    fork.spec.conf  = common.deepoverride(fork.spec.conf,forkdef.conf)

    fork.name    = (ctxt.name?ctxt.name+'-':'')+forkdef.name

    fork.spec.name = forkdef.name
    fork.spec.fullname = fork.name

    fork.genlog  = ctxt.genlog
    fork.msgs    = ctxt.msgs

    fork.resman  = ctxt.resman.fork(fork)
    fork.stepman = ctxt.stepman.fork(fork)
    //fork.slotman = ctxt.slotman.fork(fork)
    self.forks.push(fork)

    if( !forkdef.init ) {
      self.genlog.log(ctxt,'fork',forkdef.spec)
    }
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
      resman:  ctxt.resman.api,
      stepman: ctxt.stepman.api,
      genlog:  self.genlog,
      msgs:    ctxt.msgs
    }
  }

  self.result = function() {
    return {
      genlog: self.genlog
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

