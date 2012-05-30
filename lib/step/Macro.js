"use strict";

var common = require('../common')
var _ = common._

var jsonquery = common.jsonquery

var Step = require('./Step').Step


function MacroStep() {
  var self = Step.apply( null, arguments )
  self.name = 'macro'
  self.opt_exclude = 'all'

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    var steps = []
    var macro = ctxt.spec.macro[opt.macro]

    if( !macro ) {
      return cb(new Error('unknown macro: '+opt.macro))
    }

    for( var i = 0; i < macro.steps.length; i++ ) {
      var stepdef = macro.steps[i]

      //console.log('MACRO: stepdef='+JSON.stringify(stepdef))
      //console.log('MACRO: opt='+JSON.stringify(opt))

      if( stepdef.argopt ) {
        var argopt = jsonquery.JSONQuery(stepdef.argopt,opt.argopt)
        //console.log('MACRO: argopt='+JSON.stringify(argopt))
        
        var stepopt = _.clone(stepdef)
        delete stepopt.opt
        stepopt = _.extend(stepopt,stepdef.opt||stepdef.opts||{})

        stepdef.opt = common.deepoverride( stepopt, argopt || {} )
      }

      stepdef.arg = opt.argopt

      //console.log('MACRO: final stepdef='+JSON.stringify(stepdef))
      steps[i] = ctxt.stepman.make(stepdef)
    }

    ctxt.stepman.addsteps(steps)
    cb()
  }

  return self
}
exports.MacroStep = MacroStep
