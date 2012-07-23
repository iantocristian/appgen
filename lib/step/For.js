
"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step



function ForStep( opt ) {
  var self = Step.apply( null, arguments )
  self.opt_exclude = ['steps']


  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt
    var stepdefs = opt.steps

    var res = opt.each

    if( !_.isArray(res) ) {
      res = [res]
    }

    //console.log('for arg='+JSON.stringify(self.arg)+' res='+res.length)
    
    ctxt.stepman.addsteps([
      ctxt.stepman.make({
        name:'iterate',
        opt:{
          list:res,
          index:0,
          steps:stepdefs
        },
        arg:self.arg,
        inmacro:self.inmacro
      })
    ])

    cb()
  }

  return self
}
exports.ForStep = ForStep

