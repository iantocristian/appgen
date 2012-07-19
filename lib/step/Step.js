"use strict";

var common = require('../common')

var _ = common._
var fspath = common.fspath

var eyes = common.eyes
var jsonquery = common.jsonquery


function Step(opt,arg) {
  var self = {
    opt:common.copydata(opt)||{},
    arg:common.copydata(arg)||{},
    jsonq:common.jsonq,
    setvalue:common.setvalue,
    opt_required:true
  }

  self.id = Math.random()


  self.spec = function() {
    var spec = _.extend({},self.opt,{name:self.name})
    return spec
  }


  self.resolve_opt = function( ctxt ) {
    //console.log('ro start')

    var spec = _.clone(ctxt.spec)
    spec.arg = self.arg

    
    for( var vn in self.opt_virtual ) {
      self.opt[vn] = self.opt_virtual[vn]
    }
    

    if( 'all' == self.opt_exclude ) {
      //console.log('ro end none')
      return common.copydata(self.opt)
    }
    
    var exclude = (self.opt_exclude||[]).concat(['if','arg'])
    var resopt = common.walk( self.opt, exclude, function(val) {
      //console.log('ro walk:'+val)

      while( _.isString(val) ) {
        var m = /^\$\{([^}]*?)\}$/.exec(val)
        
        //console.log('ro v='+val+' m='+m)

        if( m ) {
          val = common.jsonq(m[1],spec)
          //console.log('ro after v='+val)
          if( common.isUndef(val) && self.opt_required ) {
            throw new Error("reference '"+m[1]+"' has no matches")
          }
        }
        else {
          try {
            var out = common.interpolate(val,spec,{
              required:self.opt_required,
              resource:false
            })
            //console.log('ro out='+out)
            return out
          }
          catch( err ) {
            console.dir(err)
            throw err
          }
        }
      } 

      return val;
    })

    //console.log('ro end='+JSON.stringify(resopt))
    return resopt
  }


  self.do_exec = function( ctxt, cb ) {
    ctxt.genlog.log(ctxt, 'step', self.spec())

    var ctxtapi = ctxt.api
    // make resolved opt available to interpolates
    ctxtapi.spec.opt = self.opt
    //console.dir(ctxtapi.spec)


    if( opt['if'] ) {
      var q = ''+opt['if']

      var spec = common.copydata(ctxtapi.spec)
      spec.arg = self.arg

      var execstep = common.jsonq(q,spec)
      if( common.isFalse(execstep) ) {
        ctxt.genlog.log(ctxt, 'step/skip', self.spec())
        return cb();
      }
    }


    // after if check, as refs may be undefined
    ctxtapi.opt = self.resolve_opt(ctxtapi)

    self.exec(ctxtapi,cb)
  }
  

  return self
}
exports.Step = Step
