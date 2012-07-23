
"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step



function SaveStep() {
  var self = Step.apply( null, arguments )

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    var resource = ctxt.spec.gen.resource || {}
    var text     = opt.text     || resource.text

    if( common.emptystr( text ) ) {
      return cb(new Error("resource has no text: "+JSON.stringify(resource)))
    }

    var savepath = opt.path || resource.loadpath
    if( null == savepath || ''==savepath ) {
      return cb(new Error("resource has no path: "+JSON.stringify(resource)))
    }


    var encoding = opt.encoding || resource.encoding || 'binary' 


    // needed as resource path may have interpolates

    var spec = _.clone(ctxt.spec)
    spec.opt = opt
    spec.arg = self.arg

    savepath = common.interpolate( savepath, 
                                   spec,
                                   {required:true,resource:false} )


    var desc = {path:savepath,encoding:encoding,size:text.length}

    var logdetails = common.isTrue(ctxt.spec.pref.stepdetails)
    if( logdetails ) {
      ctxt.genlog.log(ctxt,self.name+'/resource',desc)      
    }

    var saveresource = _.clone(desc)
    saveresource.text = text

    ctxt.resman.save(saveresource, function(err){
      if( err ) { return cb(err) }
      cb(null,{info:{path:savepath}})
    })
  }
  
  return self
}
exports.SaveStep = SaveStep
