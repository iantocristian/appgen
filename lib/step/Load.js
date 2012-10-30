
"use strict";

var common = require('../common')
var _ = common._
var eyes = common.eyes

var Step = require('./Step').Step



function LoadStep( opt ) {
  var self = Step.apply( null, arguments )
  self.opt_virtual = {
    loadpath: '${opt.path}'
  }


  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    var path     = opt.path
    var loadpath = opt.loadpath
    var dontread = opt.dontread
    var encoding = opt.encoding || 'binary'

    // TODO validate opts

    var logdetails = common.isTrue(ctxt.spec.pref.stepdetails)
    if( logdetails ) {
      var desc = {path:loadpath,encoding:encoding}
      ctxt.genlog.log(ctxt,self.name+'/resource',desc)      
    }

    ctxt.resman.load({path:loadpath,dontread:dontread, encoding:encoding},function(err,resource){
      if( err ) return cb(err);

      if( !resource ) {
        return cb(new Error('resource not found: '+loadsrc) )
      }
      
      function removebase(path,base) {
        return 0 == path.indexOf(base) ? path.substring(base.length+1) : path
      }

      resource.path     = removebase(path,resource.base)
      resource.loadpath = removebase(resource.loadpath,resource.base)

      ctxt.spec.gen.resource = resource
      cb()
    })
  }

  return self
}
exports.LoadStep = LoadStep
