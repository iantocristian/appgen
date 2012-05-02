
"use strict";

var common = require('./common')

var _ = common._





function StepMan() {
  var self = {}


  self.steps = []
  self.stepI = 0

  self.conds = []
  self.condI = 0


  self.stepmap = {
    datepoint: DatePointStep,
    save: SaveStep,
    fork: ForkStep
  }


  self.make = function(stepdef) {
    var stepclass = self.stepmap[stepdef.name]
    if( !stepclass ) throw new Error('unknown step: '+stepdef.name)

    var step = new stepclass(stepdef.opts||{})
    console.dir(step)
    return step
  }



  self.fork = function() {
    var fork = new StepMan()

    fork.steps = _.map(self.steps,function(step){
      return self.stepmap[step.name](step.opts)
    })
    fork.conds = _.map(self.conds,function(cond){
      return self.condmap[cond.name](cond.opts)
    })

    fork.stepI = self.stepI
    fork.condI = self.condI

    //console.log('FORK stepman: fork.stepI='+fork.stepI+' self.stepI='+self.stepI)

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











function Step(opts) {
  var self = {
    opts:common.copydata(opts)
  }

  self.id = Math.random()

  self.spec = function() {
    return {name:self.name,opts:self.opts}
  }

  return self
}
exports.Step = Step


function ForkStep( opts ) {
  var self = new Step( opts )
  self.name = 'fork'

  self.exec = function( ctxt, cb ) {
    var forks = opts.forks
    for( var i = forks.length-1; -1 < i ; i-- ) {
      var f = forks[i]
      ctxt.fork(f)
    }
    cb(null,{cmd:'fork'})
  }

  return self
}
exports.ForkStep = ForkStep



function DatePointStep(opts) {
  var self = new Step( opts )
  self.name = 'datepoint'

  self.exec = function( ctxt, cb ) {
    console.log( opts.name+': '+new Date().getTime() )
    ctxt.genlog.log(ctxt,'step/'+self.name,{name:opts.name,when:new Date().getTime()})
    cb()
  }

  return self
}
exports.DatePointStep = DatePointStep



function SaveStep( opts ) {
  var self = new Step( opts )
  self.name = 'save'

  opts.verbatim = opts.verbatim || {}

  self.exec = function( ctxt, cb ) {
    var path = opts.path
    var text = opts.text
    var src  = opts.src
    
    if( !text && src) {
      text = ctxt.resman.load({path:src},save)
    }
    else save(null,text);

    function save(err,text) {
      if( err ) return cb(err);

      if( !opts.verbatim.path ) {
        path = common.interpolate( path, ctxt.spec )
      }

      if( !opts.verbatim.text ) {
        text = common.interpolate( text, ctxt.spec )
      }

      ctxt.resman.save({path:path,text:text}, cb)
    }
  }

  return self
}
exports.SaveStep = SaveStep



function ErrorStep( opts ) {
  var self = new Step( opts )
  self.name = 'error'

  self.exec = function( ctxt, cb ) {
    cb( new Error(opts.msg) )
  }

  return self
}
exports.ErrorStep = ErrorStep



function ModifySpecStep( opts ) {
  var self = new Step( opts )
  self.name = 'modifyspec'

  self.exec = function( ctxt, cb ) {
    ctxt.spec = _.extend(ctxt.spec,opts)
    ctxt.genlog.log(ctxt,'step/'+self.name,ctxt.spec)
    cb()
  }

  return self
}
exports.ModifySpecStep = ModifySpecStep


function CondStep( opts ) {
  var self = new Step( opts )
  self.name = 'cond'

  self.active = true

  self.exec = function( ctxt, cb ) {
    if( !self.active ) return cb();

    // FIX: not the right way at all - just a hack for testing
    var match = false
    match = match || ( opts.equal && ctxt.spec['foo'] === opts.equal.val )
    match = match || ( opts.slot && ctxt.slotman.consume(opts.slot.name) )

    if( match ) {
      ctxt.genlog.log(ctxt,'cond/match',opts)
      self.active = false
      ctxt.stepman.addsteps(opts.steps)
    }
    cb();
  }

  return self
}
exports.CondStep = CondStep


function InsertCondStep( opts ) {
  var self = new Step( opts )
  self.name = 'insertcond'

  self.exec = function( ctxt, cb ) {
    var cond = new CondStep(opts)
    ctxt.stepman.addcond(ctxt,cond)
    cb()
  }

  return self
}
exports.InsertCondStep = InsertCondStep


function AddSlotStep( opts ) {
  var self = new Step( opts )
  self.name = 'addslot'

  self.exec = function( ctxt, cb ) {
    ctxt.slotman.add(opts)
    cb()
  }

  return self
}
exports.AddSlotStep = AddSlotStep






