"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step



// TODO: what happens when none found
function FindStep() {
  var self = Step.apply( null, arguments )
  self.name = 'find'

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    ctxt.resman.paths({paths:opt.paths},function(err,paths){
      if( err ) { return cb(err) }

      ctxt.spec.gen.paths = paths
      cb()
    })
  }
                       
  return self
}
exports.FindStep = FindStep
