
"use strict";

var common = require('./common')

var _ = common._
var fspath = common.fspath

var eyes = common.eyes
var jsonquery = common.jsonquery


var Step = require('./step/Step').Step


var step = {
  Fork:1,
  Macro:1,
  DatePoint:1,
  Find:1,
  Save:1,
  Load:1,
  Error:1,
  For:1,
  Iterate:1,
  Print:1,
  Insert:1,
  Expect:1,
  Ejs:1,
  Block:1,
  Exec:1,
  Set:1,
  EndFork:1,
  Verify:1,
  Append:1,
}
for( var sn in step ) {
  step[sn] = require('./step/'+sn+'.js')[sn+'Step']
}



function StepMan(opt) {
  var self = {}


  self.steps = []
  self.stepI = 0

  self.macro = {}

  self.conds = []
  self.condI = 0


  self.stepmap = {
    datepoint: step.DatePoint,
    find:      step.Find,
    save:      step.Save,
    load:      step.Load,
    fork:      step.Fork,
    error:     step.Error,
    macro:     step.Macro,
    for:       step.For,
    iterate:   step.Iterate,
    insert:    step.Insert,
    print:     step.Print,
    expect:    step.Expect,
    ejs:       step.Ejs,
    block:     step.Block,
    exec:      step.Exec,
    set:       step.Set,
    endfork:   step.EndFork,
    verify:    step.Verify,
    append:    step.Append,
  }


  if( opt && opt.steps ) {
    for( var stepname in opt.steps ) {
      var stepdetails = opt.steps[stepname]
      //console.log('sd='+JSON.stringify(stepdetails))

      // relative to spec file folder
      var requirepath = stepdetails.require
      if( opt.base ) {
        //console.log('opt.base='+opt.base)
        if( 0 == requirepath.indexOf('./') ) {
          requirepath = opt.base + requirepath.substring(1)
        }
      }
      //console.log('srp='+requirepath)

      var steprequire = require(requirepath)
      //console.log('sr='+steprequire)
      var stepclass   = steprequire[stepdetails.class+'Step']
      stepclass.stepname = stepname
      //console.dir(stepclass)

      self.stepmap[stepname] = stepclass
    }
  }


  self.make = function(stepdef) {
    var stepclass = self.stepmap[stepdef.name]
    if( !stepclass ) {
      var macro = self.macro[stepdef.name]
      if( macro ) {
        stepclass = self.stepmap.macro

        var macro_arg = _.clone(stepdef)
        delete macro_arg.opt
        delete macro_arg.name
        delete macro_arg.macro
        delete macro_arg.arg
        macro_arg = _.extend(macro_arg,stepdef.opt||stepdef.opts||{})

        stepdef = {name:'macro', arg:stepdef.arg, macro:stepdef.name, macro_arg:macro_arg}
      }
    }

    if( !stepclass ) throw new Error('unknown step: '+stepdef.name)
    if( !(stepclass instanceof Function) ) throw new Error('not a step object, step:'+stepdef.name+' object:'+JSON.stringify(stepclass))

    // FIX factor out - also used in MacroStep, and above!
    var opt = _.clone(stepdef)
    delete opt.opt
    opt = _.extend(opt,stepdef.opt||stepdef.opts||{})

    var step = new stepclass(opt,stepdef.arg)
    step.name = step.name || stepclass.stepname || stepdef.name

    step.inmacro = stepdef.inmacro

    return step
  }



  self.fork = function() {
    var fork = new StepMan()

    fork.stepmap = self.stepmap

    fork.steps = _.map(self.steps,function(step){
      var forkedstep = self.stepmap[step.name](step.opt)
      forkedstep.name = step.name
      return forkedstep
    })
    fork.conds = _.map(self.conds,function(cond){
      var forkedcond = self.condmap[cond.name](cond.opt)
      forkedcond.name = cond.name
      return forkedcond
    })

    fork.macro = self.macro

    fork.stepI = self.stepI
    fork.condI = self.condI

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


  // NOTE: does not append! inserts at index
  self.addsteps = function( steps ) {
    var args = _.flatten([self.stepI, 0, steps]) // build splice args
    Array.prototype.splice.apply( self.steps, args )
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

  self.index = function() {
    return self.stepI
  }

  self.api = {
    addcond:  common.delegate(self,self.addcond),
    addsteps: common.delegate(self,self.addsteps),
    make:     common.delegate(self,self.make),
    index:    common.delegate(self,self.index), 
  }

 
  return self
}


exports.StepMan = StepMan




























/*

function ModifySpecStep( opt ) {
  var self = Step.apply( null, arguments )
  self.name = 'modifyspec'

  self.exec = function( ctxt, cb ) {
    var opt = self.resolve_opt(ctxt)

    ctxt.spec = _.extend(ctxt.spec,opt)
    ctxt.genlog.log(ctxt,'step/'+self.name,ctxt.spec)
    cb()
  }

  return self
}
exports.ModifySpecStep = ModifySpecStep


function CondStep( opt ) {
  var self = Step.apply( null, arguments )
  self.name = 'cond'

  self.active = true

  self.exec = function( ctxt, cb ) {
    if( !self.active ) return cb();

    var opt = self.resolve_opt(ctxt)

    // FIX: not the right way at all - just a hack for testing
    var match = false
    match = match || ( opt.equal && ctxt.spec['foo'] === opt.equal.val )
    //match = match || ( opt.slot && ctxt.slotman.consume(opt.slot.name) )

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
  var self = Step.apply( null, arguments )
  self.name = 'insertcond'

  self.exec = function( ctxt, cb ) {
    var opt = self.resolve_opt(ctxt)

    var cond = new CondStep(opt)
    ctxt.stepman.addcond(ctxt,cond)
    cb()
  }

  return self
}
exports.InsertCondStep = InsertCondStep

/*
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


function SlotStep( opt ) {
  var self = new Step( opt )
  self.name = 'slot'

  self.exec = function( ctxt, cb ) {
    var name = self.opt.name
    var text = self.opt.text  // optional
    var src  = self.opt.src   // optional

    ctxt.slotman.consume(name)
    cb()
  }

  return self
}
exports.SlotStep = SlotStep

*/




