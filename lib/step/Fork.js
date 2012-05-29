"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step


function ForkStep() {
  var self = Step.apply( null, arguments )

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt
    var forks = opt.forks
    for( var i = forks.length-1; -1 < i ; i-- ) {
      var f = forks[i]
      ctxt.fork(f)
    }
    cb(null,{cmd:'fork'})
  }

  return self
}
exports.ForkStep = ForkStep
