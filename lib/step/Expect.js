
"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step




function ExpectStep( opt ) {
  var self = Step.apply( null, arguments )
  self.name = 'expect'

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    if( !opt.expect ) {
      return cb(new Error('option missing: expect'))
    }

    if( !opt.value ) {
      return cb(new Error('option missing: value'))
    }

    var expect_json = JSON.stringify(opt.expect)
    var value_json  = JSON.stringify(opt.value)

    if( expect_json !== value_json ) {
      return cb(new Error('unexpected value: '+value_json+', expected: '+expect_json))
    }

    cb()
  }

  return self
}
exports.ExpectStep = ExpectStep
