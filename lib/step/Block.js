

"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step




function BlockStep( opt ) {
  var self = Step.apply( null, arguments )
  self.opt_exclude = ['steps']

  self.spec = function() {
    var opt = self.opt
    return {name:self.name,opt:{steps:opt.steps.length}}
  }


  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt
    var stepdefs = opt.steps

    var steps = []
    
    for( var i = 0; i < stepdefs.length; i++ ) {
      stepdefs[i].arg = self.arg
      steps[i] = ctxt.stepman.make(stepdefs[i])
      steps[i].inmacro = self.inmacro
    }

    ctxt.stepman.addsteps(steps)

    cb()
  }

  return self
}
exports.BlockStep = BlockStep
