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
  new common.stepman.DatePointStep({name:'b'}),
  new common.stepman.SaveStep({path:'css/app.css'}),
  new common.stepman.ForkStep({forks:[{desc:{platform:'ios'}},{desc:{platform:'android'}}]}),
  new common.stepman.SaveStep({path:'css/$PLATFORM-app.css'})
]


var resman = new ResMan()

ctxtman.init({
  resman:  resman,
  slotman: new SlotMan(),
  stepman: stepman,
}, {platform:'common'})


console.dir(ctxtman)

function nextfork( fork, cb ) {
  if( !fork ) return cb();
  console.log( JSON.stringify(fork.desc) )
  
  var forkctxt = ctxtman.api(fork)

  nextstep( fork.stepman.step() )
  function nextstep( step ) {
    if( !step ) return nextfork( ctxtman.nextfork(), cb );
    step.exec( forkctxt, function() {

      nextcond( fork.stepman.cond() )
      function nextcond( cond ) {
        if( !cond ) return nextstep( fork.stepman.step() );
        cond.exec( forkctxt, function() {
          nextcond( fork.stepman.cond() )
        })
      }
    })
  }
}
nextfork( ctxtman.nextfork(), function() {
  console.dir( resman )
})



