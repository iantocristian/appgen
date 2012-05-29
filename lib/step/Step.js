"use strict";

var common = require('../common')

var _ = common._
var fspath = common.fspath

var eyes = common.eyes
var jsonquery = common.jsonquery


function Step(opt,arg) {
  var self = {
    opt:common.copydata(opt)||{},
    arg:common.copydata(arg)||{}
  }

  self.id = Math.random()


  self.spec = function() {
    var spec = _.extend({},self.opt,{name:self.name})
    return spec
  }


  self.resolve_opt = function( ctxt ) {
    var spec = _.clone(ctxt.spec)
    spec.arg = self.arg

    
    for( var vn in self.opt_virtual ) {
      self.opt[vn] = self.opt_virtual[vn]
    }
    

    var exclude = (self.opt_exclude||[]).concat('if')
    return common.walk( self.opt, exclude, function(val) {
      while( _.isString(val) ) {
        var m = /^\$\{([^}]*?)\}$/.exec(val)
        
        //console.log('ro v='+val+' m='+m)

        if( m ) {
          val = common.jsonq(m[1],spec)
          //console.log('ro after v='+val)
          if( common.isUndef(val) ) {
            throw new Error("reference '"+m[1]+"' has no matches")
          }
        }
        else return common.interpolate(val,spec,{required:true,resource:false})
      } 

      return val;
    })
  }


  self.do_exec = function( ctxt, cb ) {
    ctxt.genlog.log(ctxt, 'step', self.spec())

    var ctxtapi = ctxt.api
    // make resolved opt available to interpolates
    ctxtapi.spec.opt = self.opt
    //console.dir(ctxtapi.spec)

    ctxtapi.opt = self.resolve_opt(ctxtapi)


    if( opt.if ) {
      var q = ''+opt.if

      var execstep = common.jsonq(q,ctxtapi.spec)
      if( common.isFalse(execstep) ) {
        ctxt.genlog.log(ctxt, 'step/skip', self.spec())
        return cb();
      }
    }

    self.exec(ctxtapi,cb)
  }
  

  return self
}
exports.Step = Step
