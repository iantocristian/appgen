"use strict";


var common = require('./common')

var eyes = common.eyes


var sm = common.stepman


var ResMan     = common.resman.ResMan
var FileResMan     = common.resman.FileResMan

var StepMan    = common.stepman.StepMan
var SlotMan    = common.slotman.SlotMan
var ContextMan = common.context.ContextMan




function AppGen(opts) {
  eyes.inspect(opts)

  var self = {}


  self.exec = function() {
    // FIX: accept deep overrides
    
    var ctxtman = new ContextMan()

    var stepman = new StepMan()
    
    var steps = []
    for( var i = 0; i < opts.spec.steps.length; i++ ) {
      console.dir(opts.spec.steps[i])
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



    var resman = new FileResMan()

    var deps = {
      resman:  resman,
      slotman: new SlotMan(),
      stepman: stepman,
    }

    var initspec = {name:'main',spec:opts.spec}

    ctxtman.init(deps, initspec)

    //eyes.inspect(ctxtman.desc())



    nextfork( ctxtman.nextfork(), finish )
    function nextfork( ctxt, cb ) {
      if( !ctxt ) return cb();
      ctxtman.genlog.log(ctxt, 'fork/start', ctxt.spec.pref)

      var ctxtapi = ctxtman.api(ctxt)

      nextstep( ctxt.stepman.step() )
      function nextstep( step ) {
        if( !step ) return nextfork( ctxtman.nextfork(), cb );

        ctxtman.genlog.log(ctxt, 'step', step.spec())
        step.exec( ctxtapi, function(err,res) {
          if( err ) { err.ctxt = ctxt; return cb(err) }

          if( res && 'fork' == res.cmd ) {
            return nextfork( ctxtman.nextfork(), cb )
          }

          nextcond( ctxt.stepman.cond() )
          function nextcond( cond ) {
            if( !cond ) return nextstep( ctxt.stepman.step() );

            //ctxtman.genlog.log(ctxt, 'cond', cond.spec())
            cond.exec( ctxtapi, function(err,res) {
              if( err ) { err.ctxt = ctxt; return cb(err) }

              if( res && 'fork' == res.cmd ) {
                return nextfork( ctxtman.nextfork(), cb )
              }

              nextcond( ctxt.stepman.cond() )
            })
          }
        })
      }
    }

    function finish( err ) {
      if( err ) {
        err.ctxt.genlog.log(err.ctxt,'error',{msg:err.message})
        opts.msgs.error(err)
      }

      opts.msgs.print('\n\n')
      opts.msgs.print( ctxtman.genlog.toString() )
    }

  }

  return self
}


exports.AppGen = AppGen

