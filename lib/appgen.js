"use strict";


var common = require('./common')

var fspath = common.fspath

var _ = common._
var eyes = common.eyes


var sm = common.stepman


var Step = require('./step/Step').Step


var ResMan     = common.resman.ResMan
var FileResMan     = common.resman.FileResMan

var StepMan    = common.stepman.StepMan
//var SlotMan    = common.slotman.SlotMan
var ContextMan = common.context.ContextMan

var GenLog    = common.genlog.GenLog


function AppGen(opt) {
  var self = {}

  //eyes.inspect(opt)

  var baseopt = {
    macro: {
      import:{steps:[
        { name:'find', paths:'${arg.path||(arg.from+arg.selector)}', exclude:'${arg.exclude||""}'},
        { name:'for', opt:{
          each:'${gen.paths}',
          steps:[
            { name:'load', path:'${gen.item}'},
            { name:'save',  opt:{path:'${arg.save||(arg.to+gen.resource.relativePath)+"/"+gen.resource.name}'}},
          ]                     
        }},
      ]},

      template:{steps:[
        { name:'find', argopt:'$'},
        //{ name:'print', opt:{msg:'paths=${gen.paths}'}},            

        { name:'for', opt:{
          each:'${gen.paths}',
            steps:[
              //{ name:'print', opt:{msg:'path=${gen.item}'}},
              { name:'load',  opt:{path:'${gen.item}'}},

              { name:'insert',  opt:{on:'gen.resource.text'}},
              { name:'ejs',     opt:{on:'gen.resource.text'}},

              //{ name:'print', opt:{msg:'resource=${gen.resource}'}},
              { name:'save',  opt:{path:'${arg.save||(arg.to+gen.resource.relativePath)+"/"+gen.resource.name}'}},
            ]                     
        }},
      ]},
    }
  }

  opt.spec = common.deepoverride(baseopt,opt.spec)

  if( !opt.spec.steps || !opt.spec.steps.length ) {
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


  var finish = function( err, resctxt, cb ) {
    if( err ) {
      err.ctxt.genlog.log(err.ctxt,'error',{msg:err.message})
    }

    if( err ) {
      opt.msgs.error(err,{stack:0<opt.verbose})
    }

    cb && cb(err, resctxt)
  }


  var do_exec = function( conf, genlog, cb ) {
    var ctxtman = new ContextMan()

    var stepman = new StepMan({
      base:opt.specfile?fspath.dirname(fspath.resolve(opt.specfile)):null,
      steps:opt.spec.pref?opt.spec.pref.steps:null
    })
    

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

    var spec = opt.spec
    spec.conf = common.deepoverride( opt.spec.conf,conf)
    var initspec = {name:'main',spec:spec}


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
      ctxtman.genlog.log(ctxt, 'fork/start', ctxt.spec.conf)
      
      if( opt.msgs && 1 == opt.verbose ) {
        opt.msgs.print('fork: '+ctxt.name+': '+JSON.stringify(ctxt.spec.conf))
      }

      ctxt.api = ctxtman.api(ctxt)
      nextstep( 'fork', ctxt, cb )
    }

    nextfork( 'start', ctxtman.nextfork(), function(err) { 
      finish(err,ctxtman.result(),cb) 
    })
  }


  self.exec = function(conf,cb) {
    if( !cb ) {
      cb = conf
      conf = {}
    }

    var genlog = new GenLog({msgs:opt.msgs,print:1<opt.verbose})

    try {
      do_exec( conf, genlog, cb )
    }
    catch( ex ) {
      ex.ctxt = ex.ctxt || {genlog:genlog,stepman:{steps:[{}],stepI:1,index:function(){return 1}}}
      finish( ex, ex.ctxt, cb )
    }
  }


  return self
}


exports.AppGen = AppGen

exports.Step = Step

