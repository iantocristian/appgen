"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step


function DatePointStep() {
  var self = Step.apply( null, arguments )

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    setTimeout( function() {
      ctxt.genlog.log(ctxt,'step/'+self.name,{name:opt.name,when:new Date().getTime()})
      cb()
    },100)
  }

  return self
}
exports.DatePointStep = DatePointStep
