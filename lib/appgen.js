"use strict";


var common = require('./common')

var _ = common._
var eyes = common.eyes


var sm = common.stepman


var ResMan     = common.resman.ResMan
var FileResMan     = common.resman.FileResMan

var StepMan    = common.stepman.StepMan
//var SlotMan    = common.slotman.SlotMan
var ContextMan = common.context.ContextMan

var GenLog    = common.genlog.GenLog


function AppGen(opt) {
  var self = {}

  //eyes.inspect(opt)

  var spec = opt.spec
  if( !spec.steps || !spec.steps.length ) {
    throw new Error('Invalid spec: no steps')
  }

  opt.msgs = opt.msgs || {
    print:function(msg){console.log(msg)},
    error:function(error){console.dir(error)},
  }


  var errhandler = function( whence, ctxt, err, cb ) {
    if( !err instanceof Error ) {
      var orig = err
      var msg = orig.message || orig.msg
      if( _isString(orig) ) {
        msg = orig
      }
      err = new Error(msg)
      err.orig = orig
    }

    if( !err.message ) {
      err.message = 'unknown ('+JSON.stringify(err)+')'
    }

    err.ctxt = ctxt

    cb(err)
  }


  var finish = function( err, cb ) {
    if( err ) {
      err.ctxt.genlog.log(err.ctxt,'error',{msg:err.message})
    }

    if( err ) {
      opt.msgs.error(err,{stack:0<opt.verbose})
    }

    cb && cb(err)
  }


  var do_exec = function( genlog, cb ) {
    var ctxtman = new ContextMan()

    var stepman = new StepMan()
    

    stepman.macro = opt.spec.macro || {}

    var steps = []
    for( var i = 0; i < opt.spec.steps.length; i++ ) {
      steps.push( stepman.make(opt.spec.steps[i]) )
    }
    stepman.steps = steps



    var resman = new FileResMan()

    var deps = {
      genlog:  genlog,
      resman:  resman,
      stepman: stepman,
      msgs:    opt.msgs
    }

    var initspec = {name:'main',spec:opt.spec}


    ctxtman.init(deps, initspec)


    function nextcond( ctxt, cb ) {
      var cond = ctxt.stepman.cond()
      if( !cond ) return nextstep( 'cond', ctxt, cb );

      var err
      try {
        err = cond.exec( ctxt.api, function(err,res) {
          if( err ) { return errhandler('cond-callback',ctxt,err,cb) }
          
          if( res && 'fork' == res.cmd ) {
            return nextfork( 'cond', ctxtman.nextfork(), cb )
          }
          
          nextcond( ctxt, cb )
        })
      }
      catch( ex ) {
        return errhandler('cond-exception',ctxt,ex,cb)
      }

      if( err ) {
        return errhandler('cond-return',ctxt,err,cb)
      }
    }


    function nextstep( whence, ctxt, cb ) {
      var step = ctxt.stepman.step() 
      if( !step ) return nextfork( 'last-step', ctxtman.nextfork(), cb );

      var err,cbI=0
      try {
        err = step.do_exec( ctxt, function(err,res) {

          cbI++
          if( 1 < cbI ) {
            return errhandler( 
              'step-repeat-callback',ctxt,
              new Error('Step triggered callback more than once: '+cbI+' '+new Date().getTime()),cb)
          }

          if( err ) { return errhandler('step-callback',ctxt,err,cb) }

          if( res && 'fork' == res.cmd ) {
            return nextfork( 'step', ctxtman.nextfork(), cb )
          }

          nextcond( ctxt, cb )
        })
      }
      catch( ex ) {
        return errhandler('step-exception',ctxt,ex,cb)
      }

      if( err ) {
        return errhandler('step-return',ctxt,err,cb)
      }
    }


    function nextfork( whence, ctxt, cb ) {
      if( !ctxt ) return cb();
      ctxtman.genlog.log(ctxt, 'fork/start', ctxt.spec.pref)
      
      if( opt.msgs && 1 == opt.verbose ) {
        opt.msgs.print('fork: '+ctxt.name+': '+JSON.stringify(ctxt.spec.pref))
      }

      ctxt.api = ctxtman.api(ctxt)
      nextstep( 'fork', ctxt, cb )
    }

    nextfork( 'start', ctxtman.nextfork(), function(err) { finish(err,cb) } )
  }


  self.exec = function(cb) {

    var genlog = new GenLog({msgs:opt.msgs,print:1<opt.verbose})

    try {
      do_exec( genlog, cb )
    }
    catch( ex ) {
      ex.ctxt = ex.ctxt || {genlog:genlog,stepman:{steps:[{}],stepI:1,index:function(){return 1}}}
      finish( ex, cb )
    }
  }


  return self
}


exports.AppGen = AppGen

