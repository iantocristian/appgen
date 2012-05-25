"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step



function PrintStep( opt ) {
  var self = Step.apply( null, arguments )
  self.name = 'print'

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    var msg = opt.msg || ''

    if( !_.isString(msg) ) {
      msg = JSON.stringify(msg)
    }

    ctxt.msgs.print(msg)

    cb();
  }

  return self
}
exports.PrintStep = PrintStep
