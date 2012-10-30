
"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step



function CopyStep() {
  var self = Step.apply( null, arguments )

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    var resource = ctxt.spec.gen.resource || {}

    var loadpath = resource.loadpath;
    var savepath = opt.path || resource.loadpath
    if( null == savepath || ''==savepath ) {
      return cb(new Error("resource has no path: "+JSON.stringify(resource)))
    }

    // needed as resource path may have interpolates

    var spec = _.clone(ctxt.spec)
    spec.opt = opt
    spec.arg = self.arg

    savepath = common.interpolate( savepath,
                                   spec,
                                   {required:true,resource:false} )


    var desc = {path:loadpath, savepath:savepath,encoding:'binary',size:0}

    var logdetails = common.isTrue(ctxt.spec.pref.stepdetails)
    if( logdetails ) {
      ctxt.genlog.log(ctxt,self.name+'/resource',desc)
    }

    var resource = _.clone(desc)

    ctxt.resman.copy(resource, function(err){
      if( err ) { return cb(err) }
      cb(null,{info:{path:savepath}})
    })
  }

  return self
}
exports.CopyStep = CopyStep
