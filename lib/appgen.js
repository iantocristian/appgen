"use strict";


var common = require('./common')


var ResMan  = common.resman.ResMan
var StepMan = common.stepman.StepMan
var SlotMan = common.slotman.SlotMan
var ContextMan = common.context.ContextMan






var ctxtman = new ContextMan()

var stepman = new StepMan()
stepman.steps = [
  new common.stepman.DatePointStep({name:'a'}),
  new common.stepman.ForkStep({forks:[{name:'ios',desc:{platform:'iphone'}},{name:'android',desc:{platform:'android'}}]}),
  new common.stepman.DatePointStep({name:'b'}),

/*
  new common.stepman.SaveStep({path:'css/app.css'}),

  new common.stepman.SaveStep({path:'css/$PLATFORM-app.css'})
*/
]


var resman = new ResMan()

ctxtman.init({
  resman:  resman,
  slotman: new SlotMan(),
  stepman: stepman,
}, {name:'main',desc:{platform:'common'}})


console.dir(ctxtman)

function nextfork( fork, cb ) {
  if( !fork ) return cb();
  ctxtman.genlog.log(fork, 'fork/start', fork.desc)

  console.log( JSON.stringify(fork.desc) )
  
  var forkctxt = ctxtman.api(fork)

  nextstep( fork.stepman.step() )
  function nextstep( step ) {
    if( !step ) return nextfork( ctxtman.nextfork(), cb );

    ctxtman.genlog.log(fork, 'step', step.desc(forkctxt))
    step.exec( forkctxt, function(err,res) {
      if( res && 'fork' == res.cmd ) {
        return nextfork( ctxtman.nextfork(), cb )
      }

      nextcond( fork.stepman.cond() )
      function nextcond( cond ) {
        if( !cond ) return nextstep( fork.stepman.step() );

        ctxtman.genlog.log(fork, 'step', step.desc(forkctxt))
        cond.exec( forkctxt, function() {
          nextcond( fork.stepman.cond() )
        })
      }
    })
  }
}
nextfork( ctxtman.nextfork(), function() {
  console.dir( resman )
  console.log( ctxtman.genlog.toString() )
})



