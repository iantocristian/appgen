

"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step




function IterateStep( opt ) {
  var self = Step.apply( null, arguments )
  self.opt_exclude = ['steps']

  self.spec = function() {
    return {name:self.name,size:self.opt.list.length,index:self.opt.index,steps:self.opt.steps.length}
  }


  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt
    var stepdefs = opt.steps

    if( opt.list.length <= opt.index ){
      return cb()
    }

    ctxt.spec.gen.item = opt.list[opt.index]

    var steps = []
    
    for( var i = 0; i < stepdefs.length; i++ ) {
      stepdefs[i].arg = self.arg
      steps[i] = ctxt.stepman.make(stepdefs[i])
      steps[i].inmacro = self.inmacro
    }

    steps.push( ctxt.stepman.make({
      name:'iterate',
      opt:{
        list:opt.list,
        index:opt.index+1,
        steps:stepdefs
      },
      arg:self.arg,
      inmacro:self.inmacro
    }))
    
    ctxt.stepman.addsteps(steps)

    cb()
  }

  return self
}
exports.IterateStep = IterateStep
