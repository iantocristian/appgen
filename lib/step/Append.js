
"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step



// {name:'append', ref:'gen...', value:'...' }
function AppendStep() {
  var self = Step.apply( null, arguments )

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    if( !opt.ref ) {
      return cb(new Error('option missing: ref'))
    }
    var ref = opt.ref

    if( _.isUndefined(opt.value) ) {
      return cb(new Error('option missing: value'))
    }
    var value = opt.value


    
    var curval = self.getvalue( ctxt.spec, ref ) || ''
    var newval = curval + value

    self.setvalue( ctxt.spec, ref, newval )

    cb()
  }

  return self
}
exports.AppendStep = AppendStep
