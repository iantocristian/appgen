"use strict";

var common = require('../common')
var _ = common._
var childproc = common.childproc

var Step = require('./Step').Step



function ExecStep() {
  var self = Step.apply( null, arguments )

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    var child = childproc.exec( 
      opt.cmd, 

      opt, // see http://nodejs.org/api/child_process.html for options

      function( err, stdout, stderr ) {
        if( stderr && '' != stderr ) {
          ctxt.genlog.log(ctxt,self.name+'/stderr',{text:stderr})              
        }
        ctxt.genlog.log(ctxt,self.name+'/stdout',{text:stdout})              

        cb(err)
      }
    )
  }

  return self
}
exports.ExecStep = ExecStep
