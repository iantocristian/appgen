
"use strict";

var common = require('./common')

var _ = common._


function StepMan() {
  var self = {}


  self.steps = []
  self.stepI = 0

  self.conds = []
  self.condI = 0


  self.fork = function() {
    var fork = new StepMan()

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
    else {
      self.condI = 0
    }
    return cond
  }


  self.addcond = function( ctxt, cond ) {
    if( cond ) {
      ctxt.genlog.log(ctxt,'cond/add',cond.spec())
      self.conds.push( cond )
    }
  }


  self.addsteps = function( steps ) {
    //console.dir(steps)
    var args = _.flatten([self.stepI, 0, steps])
    //console.dir(args)
    Array.prototype.splice.apply( self.steps, args )
    //console.dir(self.steps)
  }


  self.spec = function() {
    var spec = {steps:[]}
    for( var i = 0; i < self.steps.length; i++ ) {
      var stepspec = self.steps[i].spec()
      spec.steps.push({
        index:i,
        spec:stepspec
      })
    }
    return spec
  }


  self.api = {
    addcond: common.delegate(self,self.addcond),
    addsteps: common.delegate(self,self.addsteps),
  }

 
  return self
}


exports.StepMan = StepMan



function Step(opt) {
  var self = {
    opt:common.copydata(opt)
  }

  self.spec = function() {
    return {name:self.name,opt:self.opt}
  }

  return self
}
exports.Step = Step


function ForkStep( opt ) {
  var self = new Step( opt )
  self.name = 'fork'

  self.exec = function( ctxt, cb ) {
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
  var self = new Step( opt )
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
  var self = new Step( opt )
  self.name = 'save'

  self.exec = function( ctxt, cb ) {
    var path = opt.path
    
    

    // FIX: need general meta replacer ref'ing spec and opts
    path = path.replace(/\$PLATFORM/g,ctxt.desc.platform)
    ctxt.resman.save({path:path}, cb)
  }

  return self
}
exports.SaveStep = SaveStep



function ErrorStep( opt ) {
  var self = new Step( opt )
  self.name = 'error'

  self.exec = function( ctxt, cb ) {
    cb( new Error(opt.msg) )
  }

  return self
}
exports.ErrorStep = ErrorStep



function ModifySpecStep( opt ) {
  var self = new Step( opt )
  self.name = 'modifyspec'

  self.exec = function( ctxt, cb ) {
    ctxt.spec = _.extend(ctxt.spec,opt)
    ctxt.genlog.log(ctxt,'step/'+self.name,ctxt.spec)
    cb()
  }

  return self
}
exports.ModifySpecStep = ModifySpecStep


function CondStep( opt ) {
  var self = new Step( opt )
  self.name = 'cond'

  self.active = true

  self.exec = function( ctxt, cb ) {
    if( !self.active ) return cb();

    // FIX: not the right way at all - just a hack for testing
    var match = false
    match = match || ( opt.equal && ctxt.spec['foo'] === opt.equal.val )
    match = match || ( opt.slot && ctxt.slotman.consume(opt.slot.name) )

    if( match ) {
      ctxt.genlog.log(ctxt,'cond/match',opt)
      self.active = false
      ctxt.stepman.addsteps(opt.steps)
    }
    cb();
  }

  return self
}
exports.CondStep = CondStep


function InsertCondStep( opt ) {
  var self = new Step( opt )
  self.name = 'insertcond'

  self.exec = function( ctxt, cb ) {
    var cond = new CondStep(opt)
    ctxt.stepman.addcond(ctxt,cond)
    cb()
  }

  return self
}
exports.InsertCondStep = InsertCondStep


function AddSlotStep( opt ) {
  var self = new Step( opt )
  self.name = 'addslot'

  self.exec = function( ctxt, cb ) {
    ctxt.slotman.add(opt)
    cb()
  }

  return self
}
exports.AddSlotStep = AddSlotStep












