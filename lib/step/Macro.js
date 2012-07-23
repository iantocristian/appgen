"use strict";

var common = require('../common')
var _ = common._

var jsonquery = common.jsonquery

var Step = require('./Step').Step


function MacroStep() {
  var self = Step.apply( null, arguments )
  self.name = 'macro'
  //self.opt_exclude = 'all'
  self.opt_required = false

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt
    //console.log('MACRO EXEC: opt='+JSON.stringify(opt))

    var steps = []
    var macro = ctxt.spec.macro[opt.macro]

    if( !macro ) {
      return cb(new Error('unknown macro: '+opt.macro))
    }

    for( var i = 0; i < macro.steps.length; i++ ) {
      var stepdef = macro.steps[i]

      //console.log('MACRO: stepdef='+JSON.stringify(stepdef))
      //console.log('MACRO: opt='+JSON.stringify(opt))

      // TODO is this needed?
      // add macro options
      /*
      if( stepdef.argopt ) {
        var argopt = jsonquery.JSONQuery(stepdef.argopt,opt.macro_arg)
        //console.log('MACRO: argopt='+JSON.stringify(argopt))
        
        // build step options - take direct properties, and override with anything in opt
        var stepopt = _.clone(stepdef)
        delete stepopt.opt
        stepopt = _.extend(stepopt,stepdef.opt||stepdef.opts||{})

        stepdef.opt = common.deepoverride( stepopt, argopt || {} )
      }
      */

      stepdef.arg = opt.macro_arg

      //console.log('MACRO: final stepdef='+JSON.stringify(stepdef))
      steps[i] = ctxt.stepman.make(stepdef)
      steps[i].inmacro = opt.macro
    }

    ctxt.stepman.addsteps(steps)
    cb()
  }

  return self
}
exports.MacroStep = MacroStep
