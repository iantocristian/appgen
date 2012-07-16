"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step


function EndForkStep() {
  var self = Step.apply( null, arguments )

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt
    cb(null,{cmd:'fork'})
  }

  return self
}
exports.EndForkStep = EndForkStep
