
"use strict";

var common = require('./common')

var _ = common._
var fspath = common.fspath

var eyes = common.eyes



function StepMan() {
  var self = {}


  self.steps = []
  self.stepI = 0

  self.conds = []
  self.condI = 0


  self.stepmap = {
    datepoint: DatePointStep,
    save:  SaveStep,
    fork:  ForkStep,
    error: ErrorStep,
    //slot: SlotStep
  }


  self.make = function(stepdef) {
    var stepclass = self.stepmap[stepdef.name]
    if( !stepclass ) throw new Error('unknown step: '+stepdef.name)

    var step = new stepclass(stepdef.opts||stepdef.opt||{})
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
    opts:common.copydata(opts)||{}
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
    ctxt.genlog.log(ctxt,'step/'+self.name,{name:opts.name,when:new Date().getTime()})
    cb()
  }

  return self
}
exports.DatePointStep = DatePointStep



function SaveStep( opts ) {
  var self = new Step( opts )
  self.name = 'save'

  self.opts.verbatim = self.opts.verbatim || {}
  self.opts.required = self.opts.required === void 0 ? true : self.opts.required


  self.exec = function( ctxt, cb ) {
    function cbwhence(whence,err) {
      cb(err)
    }

    var opts = self.opts
    var path = opts.path
    var text = opts.text
    var src  = opts.src || opts.path
    var encoding = opts.encoding || 'binary'
    var verbatim = opts.verbatim || {}

    if( !text && src) {
      var loadsrc = common.interpolate( src, ctxt.spec, {required:1} )

      ctxt.resman.load({path:loadsrc,encoding:encoding},function(err,reslist){
        if( err ) return cbwhence('loaderr',err);
        
        if( 0 === reslist.length ) {
          if( opts.required ) {
            return cbwhence('required',new Error('no resoures found: '+src) )
          }
          else {
            return cbwhence('nores')
          }
        }
        
        reslist.each( function( err, res, next ) {
          if( err ) return cbwhence('reslist.each',err);
          if( !res ) { return cbwhence('reslist.each/end') }
          interpolate(res,next)
        })
      })
    }
    else interpolate({text:text,srcpath:path},function(){cbwhence('has-text')});

    function interpolate( res, next ) {
      if( 'binary' != encoding || !verbatim.text ) {
        var spec = _.clone(ctxt.spec)
        spec.res.$name = fspath.basename(res.srcpath)

        common.interpolate( res.text, spec, {required:true,resource:true}, ctxt, function( err, text ){
          if( err ) { return cbwhence('text interpolate',err) }
          do_savepath(text)
        })
      }
      else do_savepath(res.text)

      function do_savepath(text) {
        var savepath = path
        if( !verbatim.path ) {
          savepath = common.interpolate( path, spec, {required:true,resource:false} )
        }
        save(savepath,text,next)
      }
    }

    function save(savepath,text,next) {
      ctxt.resman.save({path:savepath,text:text,encoding:encoding}, function(err){
        if( err ) { return cbwhence('saveerr',err) }
        next()
      })
    }
  }


  return self
}
exports.SaveStep = SaveStep



// simulate different kinds of errors generated by Steps
function ErrorStep( opts ) {
  var self = new Step( opts )
  self.name = 'error'

  self.exec = function( ctxt, cb ) {
    var kind = self.opts.kind || ctxt.spec.pref.kind || 'Error'
    var msg  = self.opts.msg  || self.opts.message || ctxt.spec.pref.msg || ctxt.spec.pref.message || 'unknown error'
    var die  = self.opts.die  || ctxt.spec.pref.die || 'callback'

    var error
    if( kind.match(/^[eE]rror$/ ) ) {
      error = new Error(msg)
      error.msg = error.message
    }
    else if( kind.match(/^[oO]bject$/ ) ) {
      error = {message:''+msg}
      error.msg = error.message
    }
    else {
      error = ''+msg
    }

    if( 'callback' == die ) {
      cb( error )
    }
    else if( 'throw' == die ) {
      throw error
    }
    else {
      return error
    }
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
    //match = match || ( opts.slot && ctxt.slotman.consume(opts.slot.name) )

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

/*
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


function SlotStep( opts ) {
  var self = new Step( opts )
  self.name = 'slot'

  self.exec = function( ctxt, cb ) {
    var name = self.opts.name
    var text = self.opts.text  // optional
    var src  = self.opts.src   // optional

    ctxt.slotman.consume(name)
    cb()
  }

  return self
}
exports.SlotStep = SlotStep

*/




