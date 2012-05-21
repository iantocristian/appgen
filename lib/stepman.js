
"use strict";

var common = require('./common')

var _ = common._
var fspath = common.fspath

var eyes = common.eyes
var jsonquery = common.jsonquery



function StepMan() {
  var self = {}


  self.steps = []
  self.stepI = 0

  self.macro = {}

  self.conds = []
  self.condI = 0


  self.stepmap = {
    datepoint: DatePointStep,
    find:      FindStep,
    save:  SaveStep,
    load:  LoadStep,
    fork:  ForkStep,
    error: ErrorStep,
    macro: MacroStep,
    print: PrintStep,
    for:    ForStep,
    iterate: IterateStep,
    insert: InsertStep,
  }


  self.make = function(stepdef) {
    var stepclass = self.stepmap[stepdef.name]
    if( !stepclass ) {
      var macro = self.macro[stepdef.name]
      if( macro ) {
        stepclass = self.stepmap.macro
        stepdef.opt = {macro:stepdef.name,argopt:stepdef.opt}
      }
    }

    if( !stepclass ) throw new Error('unknown step: '+stepdef.name)

    var opt = stepdef.opt||stepdef.opts||{}
    
    var step = new stepclass(opt,stepdef.arg)
    return step
  }



  self.fork = function() {
    var fork = new StepMan()

    fork.steps = _.map(self.steps,function(step){
      return self.stepmap[step.name](step.opt)
    })
    fork.conds = _.map(self.conds,function(cond){
      return self.condmap[cond.name](cond.opt)
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


  self.api = {
    addcond: common.delegate(self,self.addcond),
    addsteps: common.delegate(self,self.addsteps),
    make: common.delegate(self,self.make),
  }

 
  return self
}


exports.StepMan = StepMan











function Step(opt,arg) {
  var self = {
    opt:common.copydata(opt)||{},
    arg:common.copydata(arg)||{}
  }

  self.id = Math.random()

  self.spec = function() {
    return {name:self.name,opt:self.opt}
  }

  self.resolve_opt = function( ctxt ) {
    var spec = _.clone(ctxt.spec)
    spec.arg = self.arg

    return common.walk( self.opt, function(val) {
      while( _.isString(val) ) {
        var m = /^#\{([^}]*?)\}$/.exec(val)
        
        //console.log('ro v='+val+' m='+m)

        if( m ) {
          val = jsonquery.JSONQuery(m[1],spec)
          //console.log('ro after v='+val)
          if( val == void 0 ) {
            throw new Error("reference '"+m[1]+"' has no matches")
          }
        }
        else return common.interpolate(val,spec,{required:true,resource:false})
      } 

      return val;
    })
  }

  return self
}
exports.Step = Step


function ForkStep() {
  var self = Step.new.apply( null, arguments )
  self.name = 'fork'

  self.exec = function( ctxt, cb ) {
    var opt = self.resolve_opt(ctxt)
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


function MacroStep() {
  var self = Step.apply( null, arguments )
  self.name = 'macro'


  self.exec = function( ctxt, cb ) {
    var opt = self.resolve_opt(ctxt)

    var steps = []
    var macro = ctxt.spec.macro[opt.macro]

    //console.log('macro='+JSON.stringify(macro)+' macro.steps.length='+macro.steps.length)

    if( !macro ) {
      return cb(new Error('unknown macro: '+opt.macro))
    }

    for( var i = 0; i < macro.steps.length; i++ ) {
      var stepdef = macro.steps[i]

      if( stepdef.argopt ) {
        stepdef.opt = common.deepoverride( stepdef.opt || {}, jsonquery.JSONQuery(stepdef.argopt,opt.argopt) || {} )
      }

      stepdef.arg = opt.argopt
      steps[i] = ctxt.stepman.make(stepdef)
      //console.log('macro '+i+' d='+macro.steps[i])
    }

    //console.log('steps='+steps)

    ctxt.stepman.addsteps(steps)
    cb()
  }

  return self
}
exports.MacroStep = MacroStep






function DatePointStep() {
  var self = Step.apply( null, arguments )
  self.name = 'datepoint'

  self.exec = function( ctxt, cb ) {
    ctxt.genlog.log(ctxt,'step/'+self.name,{name:opt.name,when:new Date().getTime()})
    cb()
  }

  return self
}
exports.DatePointStep = DatePointStep



// TODO: what happens when none found
function FindStep() {
  var self = Step.apply( null, arguments )
  self.name = 'find'

  console.log('arg='+JSON.stringify(self.arg))

  self.exec = function( ctxt, cb ) {
    var opt = self.resolve_opt(ctxt)

    var spec = _.clone(ctxt.spec)
    spec.opt = opt      
    var paths = common.interpolate( opt.paths, spec, {required:1} )

    ctxt.resman.paths({paths:opt.paths},function(err,paths){
      if( err ) { return cb(err) }

      ctxt.spec.gen.paths = paths
      cb()
    })
  }
                       
  return self
}
exports.FindStep = FindStep





function LoadStep( opt ) {
  var self = Step.apply( null, arguments )
  self.name = 'load'

  self.exec = function( ctxt, cb ) {
    var opt = self.resolve_opt(ctxt)

    var path     = opt.path
    var encoding = opt.encoding || 'binary'

    // TODO validate opts

    var spec = _.clone(ctxt.spec)
    spec.opt = opt      
    var loadpath = common.interpolate( path, spec, {required:1} )

    ctxt.resman.load({path:loadpath,encoding:encoding},function(err,resource){
      if( err ) return cb(err);

      if( !resource ) {
        return cb(new Error('resource not found: '+loadsrc) )
      }
      
      function removebase(path,base) {
        return 0 == path.indexOf(base) ? path.substring(base.length+1) : path
      }

      resource.path     = removebase(path,resource.base)
      resource.loadpath = removebase(resource.loadpath,resource.base)

      ctxt.spec.gen.resource = resource
      cb()
    })
  }

  return self
}
exports.LoadStep = LoadStep



function SaveStep() {
  var self = Step.apply( null, arguments )
  self.name = 'save'


  self.exec = function( ctxt, cb ) {
    var opt = self.opt

    var resource = ctxt.spec.gen.resource || {}
    var text     = opt.text     || resource.text
    // TODO check

    var savepath = opt.path || resource.loadpath
    if( null == savepath || ''==savepath ) {
      return cb(new Error("resource has no path: "+JSON.stringify(resource)))
    }


    opt = self.resolve_opt(ctxt)



    var encoding = opt.encoding || resource.encoding || 'binary' 
    var verbatim = opt.verbatim || resource.verbatim || false 


    var spec = _.clone(ctxt.spec)
    spec.opt = opt
    spec.arg = self.arg

    if( !verbatim ) {
      savepath = common.interpolate( savepath, 
                                     spec,
                                     {required:true,resource:false} )
    }

    var desc = {path:savepath,encoding:encoding,size:text.length}
    ctxt.genlog.log(ctxt,self.name+'/resource',desc)      

    var saveresource = _.clone(desc)
    saveresource.text = text

    ctxt.resman.save(saveresource, function(err){
      if( err ) { return cb(err) }
      cb()
    })
  }
  
  return self
}
exports.SaveStep = SaveStep



// in: source text, out: target ref, on: in+out ref (#{...} optional)
function InsertStep( opt ) {
  var self = Step.apply( null, arguments )
  self.name = 'insert'

  self.exec = function( ctxt, cb ) {
    var outward = opt.out || opt.on
    var m = /#\{(.*?)\}/.exec(outward)
    outward = m ? m[1] : outward

    var inward = opt.in || opt.on
    var m = /#\{(.*?)\}/.exec(outward)
    inward = m ? m[1] : inward

    console.log('in=['+inward+'] out=['+outward+']')

    var spec = ctxt.spec
    var text = ''+jsonquery.JSONQuery( inward, spec )


    common.interpolate( text, spec, {required:true,resource:true}, ctxt, function( err, text ){
      if( err ) { return cb(err) }

      common.setvalue(ctxt.spec,outward,text)
      cb()
    })
  }


  return self
}
exports.InsertStep = InsertStep



function ForStep( opt ) {
  var self = Step.apply( null, arguments )
  self.name = 'for'

  self.exec = function( ctxt, cb ) {
    var stepdefs = self.opt.steps
    delete self.opt.steps

    var opt = self.resolve_opt(ctxt)

    var res = opt.each

    if( !_.isArray(res) ) {
      res = [res]
    }

    console.log('for arg='+JSON.stringify(self.arg))
    
    ctxt.stepman.addsteps([
      ctxt.stepman.make({
        name:'iterate',
        opt:{
          list:res,
          index:0,
          steps:stepdefs
        },
        arg:self.arg
      })
    ])

    cb()
  }

  return self
}
exports.ForStep = ForStep




function IterateStep( opt ) {
  var self = Step.apply( null, arguments )
  self.name = 'iterate'

  console.log('IS self.arg='+JSON.stringify(self.arg))

  self.spec = function() {
    var opt = self.opt
    return {name:self.name,opt:{size:opt.list.length,index:opt.index,steps:opt.steps.length}}
  }


  self.exec = function( ctxt, cb ) {
    var stepdefs = self.opt.steps
    delete self.opt.steps

    var opt = self.resolve_opt(ctxt)

    if( opt.list.length <= opt.index ){
      return cb()
    }

    ctxt.spec.gen.item = opt.list[opt.index]

    var steps = []
    
    for( var i = 0; i < stepdefs.length; i++ ) {
      stepdefs[i].arg = self.arg
      steps[i] = ctxt.stepman.make(stepdefs[i])
    }

    console.log('IS steps self.arg='+JSON.stringify(self.arg))

    steps.push( ctxt.stepman.make({
      name:'iterate',
      opt:{
        list:opt.list,
        index:opt.index+1,
        steps:stepdefs
      },
      arg:self.arg
    }))
    
    ctxt.stepman.addsteps(steps)

    cb()
  }

  return self
}
exports.IterateStep = IterateStep







// simulate different kinds of errors generated by Steps
function ErrorStep( opt ) {
  var self = Step.apply( null, arguments )
  self.name = 'error'

  self.exec = function( ctxt, cb ) {
    var opt = self.resolve_opt(ctxt)

    var kind = opt.kind || ctxt.spec.pref.kind || 'Error'
    var msg  = opt.msg  || opt.message || ctxt.spec.pref.msg || ctxt.spec.pref.message || 'unknown error'
    var die  = opt.die  || ctxt.spec.pref.die || 'callback'

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




function PrintStep( opt ) {
  var self = Step.apply( null, arguments )
  self.name = 'print'

  self.exec = function( ctxt, cb ) {
    var opt = self.resolve_opt(ctxt)

    var msg = opt.msg || ''

    if( !_.isString(msg) ) {
      msg = JSON.stringify(msg)
    }

    ctxt.msgs.print(msg)

    cb();
  }

  return self
}
exports.PrintStep = PrintStep




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




