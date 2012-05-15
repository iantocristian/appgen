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


function AppGen(opts) {
  var self = {}

  //eyes.inspect(opts)

  var spec = opts.spec
  if( !spec.steps || !spec.steps.length ) {
    throw new Error('Invalid spec: no steps')
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


  self.exec = function() {
    // FIX: accept deep overrides
    
    var ctxtman = new ContextMan()

    var stepman = new StepMan()
    
    var steps = []
    for( var i = 0; i < opts.spec.steps.length; i++ ) {
      steps.push( stepman.make(opts.spec.steps[i]) )
    }
    stepman.steps = steps

      /*
    stepman.steps = [
      new sm.DatePointStep({name:'a'}),

      new sm.InsertCondStep({
        slot:{name:'foo'},
        steps:[
          new sm.DatePointStep({name:'aa'}),
        ]
      }),

      new sm.DatePointStep({name:'b'}),
      new sm.AddSlotStep({name:'foo',val:1}),
      new sm.DatePointStep({name:'c'}),


        new sm.InsertCondStep({
        equal:{ref:'spec:foo',val:'bar'},
        steps:[
        new sm.DatePointStep({name:'aa'}),
        ]
        }),

        new sm.DatePointStep({name:'b'}),
        new sm.ModifySpecStep({foo:'bar'}),
        new sm.DatePointStep({name:'c'}),
      */

      /*
        new sm.ForkStep({
        forks:[
        {name:'ios',     spec:{platform:'iphone'}  },
        {name:'android', spec:{platform:'android'} }
        ]
        }),
        //new sm.ErrorStep({msg:'test'}),
        new sm.DatePointStep({name:'b'}),

        new sm.ForkStep({
        forks:[
        {name:'mob', spec:{factor:'mob'}  },
        {name:'pad', spec:{factor:'pad'} }
        ]
        }),

        new sm.DatePointStep({name:'c'}),

        /*
        new common.stepman.SaveStep({path:'css/app.css'}),
        new common.stepman.SaveStep({path:'css/$PLATFORM-app.css'})

    ]
      */

    //eyes.inspect( stepman.spec() )

    var genlog = new GenLog({msgs:opts.msgs,print:1<opts.verbose})

    var resman = new FileResMan()

    var deps = {
      genlog: genlog,
      resman:  resman,
      //slotman: new SlotMan(),
      stepman: stepman,
    }

    var initspec = {name:'main',spec:opts.spec}

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

      ctxtman.genlog.log(ctxt, 'step', step.spec())



      var err,cbI=0
      try {
        err = step.exec( ctxt.api, function(err,res) {
          //if( ctxt.stepman.stepI==2)
          //  return errhandler(ctxt,new Error('Step die'),cb)

          cbI++
          if( 1 < cbI ) {
            return errhandler('step-repeat-callback',ctxt,new Error('Step triggered callback more than once: '+cbI+' '+new Date().getTime()),cb)
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
      
      if( opts.msgs && 1 == opts.verbose ) {
        opts.msgs.print('fork: '+ctxt.name+': '+JSON.stringify(ctxt.spec.pref))
      }

      ctxt.api = ctxtman.api(ctxt)
      nextstep( 'fork', ctxt, cb )
    }


    function finish( err ) {
      if( err ) {
        err.ctxt.genlog.log(err.ctxt,'error',{msg:err.message})
      }

      //opts.msgs.print('\n-- appgen step log --')
      //opts.msgs.print( ctxtman.genlog.toString() )

      if( err ) {
        opts.msgs.error(err)
      }
    }


    nextfork( 'start', ctxtman.nextfork(), finish )
  }

  return self
}


exports.AppGen = AppGen

