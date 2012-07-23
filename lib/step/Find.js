"use strict";

var common = require('../common')
var _ = common._
var gex = common.gex
var fs = common.fs
var fspath = common.fspath

var Step = require('./Step').Step



// TODO: what happens when none found
function FindStep() {
  var self = Step.apply( null, arguments )

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    var findpaths = opt.paths || opt.path

    ctxt.resman.paths({paths:findpaths},function(err,paths,pathquery){
      if( err ) { return cb(err) }

      var logdetails = common.isTrue(ctxt.spec.pref.stepdetails)
      if( logdetails ) {
        ctxt.genlog.log(ctxt,self.name+'/result',{pathquery:pathquery,numfound:paths.length})      
      }

      // TODO: review
      var base = fspath.resolve(ctxt.spec.res.origin,ctxt.spec.res.base)
      paths = _.filter(paths,function(val){
        var stats = fs.statSync(base+'/'+val);
        return stats.isFile();
      })

      if( opt.exclude ) {
        var exgex = gex(opt.exclude)
        paths = _.filter(paths,function(val){
          return !exgex.on(val)
        })
      }

      //console.log('findpaths='+findpaths+' gen.paths='+paths+' p.len='+paths.length)

      ctxt.spec.gen.paths = paths
      cb()
    })
  }
                       
  return self
}
exports.FindStep = FindStep
