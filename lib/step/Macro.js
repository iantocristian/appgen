"use strict";

var common = require('../common')
var _ = common._

var jsonquery = common.jsonquery

var Step = require('./Step').Step


function MacroStep() {
  var self = Step.apply( null, arguments )
  self.name = 'macro'


  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    var steps = []
    var macro = ctxt.spec.macro[opt.macro]

    if( !macro ) {
      return cb(new Error('unknown macro: '+opt.macro))
    }

    for( var i = 0; i < macro.steps.length; i++ ) {
      var stepdef = macro.steps[i]

      if( stepdef.argopt ) {
        stepdef.opt = common.deepoverride( stepdef.opt || {}, jsonquery.JSONQuery(stepdef.argopt,opt.argopt) || {} )
      }

      stepdef.arg = opt.argopt
      steps[i] = ctxt.stepman.make(stepdef)
    }

    ctxt.stepman.addsteps(steps)
    cb()
  }

  return self
}
exports.MacroStep = MacroStep
