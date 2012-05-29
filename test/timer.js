"use strict";

var appgen = require('../lib/appgen')
var Step = appgen.Step



function TimerStartStep( opt ) {
  var self = Step.apply( null, arguments )

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    ctxt.spec.gen.timerstart = new Date()
    ctxt.msgs.print('START: '+ctxt.spec.gen.timerstart.toISOString())

    cb();
  }

  return self
}
exports.TimerStartStep = TimerStartStep


function TimerEndStep( opt ) {
  var self = Step.apply( null, arguments )

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    var start = ctxt.spec.gen.timerstart
    var end   = new Date()
    ctxt.msgs.print('END: '+end.toISOString())
    ctxt.msgs.print('DURATION: '+(end.getTime()-start.getTime()))

    cb();
  }

  return self
}
exports.TimerEndStep = TimerEndStep
