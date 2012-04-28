
"use strict";

var common = require('./common')



function StepMan() {
  var self = {}


  self.steps = []
  self.stepI = 0

  self.conds = []
  self.condI = 0


  self.fork = function( desc ) {
    var fork = new StepMan()

    fork.desc = desc

    // FIX: copy
    fork.steps = self.steps
    fork.conds = self.conds

    fork.stepI = self.stepI
    fork.condI = self.condI

    console.log('FORK stepman: fork.stepI='+fork.stepI+' self.stepI='+self.stepI)

    return fork
  }


  self.step = function() {
    var step = null
    if( self.stepI < self.steps.length ) {
      step = self.steps[self.stepI]
      self.stepI++
    }
    return step
  }


  self.cond = function() {
    var cond = null
    if( self.condI < self.conds.length ) {
      cond = self.conds[self.condI]
      self.condI++
    }
    return cond
  }


  self.addcond = function( cond ) {
    if( cond ) {
      self.conds.push( cond )
    }
  }



  self.api = {
    addcond: common.delegate(self,self.addcond),
  }

 
  return self
}


exports.StepMan = StepMan



function Step() {
  var self = {}

  self.desc = function(ctxt) {
    return {name:self.name,desc:ctxt.desc}
  }

  return self
}
exports.Step = Step


function ForkStep( opt ) {
  var self = new Step()
  self.name = 'fork'

  self.exec = function( ctxt, cb ) {
    console.log('FORK')
    var forks = opt.forks
    for( var i = forks.length-1; -1 < i ; i-- ) {
      var f = forks[i]
      ctxt.fork(f)
    }
    cb(null,{cmd:'fork'})
  }

  return self
}
exports.ForkStep = ForkStep



function DatePointStep(opt) {
  var self = new Step()
  self.name = 'datepoint'

  self.exec = function( ctxt, cb ) {
    console.log( opt.name+': '+new Date().getTime() )
    ctxt.genlog.log(ctxt,'step/'+self.name,{name:opt.name,when:new Date().getTime()})
    cb()
  }

  return self
}
exports.DatePointStep = DatePointStep



function SaveStep( opt ) {
  var self = new Step()
  self.name = 'save'

  self.exec = function( ctxt, cb ) {
    var path = opt.path
    console.log('SAVE:'+path)
    path = path.replace(/\$PLATFORM/g,ctxt.desc.platform)
    ctxt.resman.save({path:path}, cb)
  }

  return self
}
exports.SaveStep = SaveStep











