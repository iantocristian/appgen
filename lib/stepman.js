
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
    save:  SaveStep,
    load:  LoadStep,
    fork:  ForkStep,
    error: ErrorStep,
    macro: MacroStep,
    print: PrintStep,
    each:    EachStep,
    iterate: IterateStep,
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

    var step = new stepclass(stepdef.opt||stepdef.opts||{})
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











function Step(opt) {
  var self = {
    opt:common.copydata(opt)||{}
  }

  self.id = Math.random()

  self.spec = function() {
    return {name:self.name,opt:self.opt}
  }

  self.resolve_opt = function( ctxt ) {
    return common.walk( self.opt, function(val) {
      while( _.isString(val) ) {
        var m = /^#\{(.*?)\}$/.exec(val)
        
        //console.log('ro v='+val+' m='+m)

        if( m ) {
          val = jsonquery.JSONQuery(m[1],ctxt.spec)
          //console.log('ro after v='+val)
          if( val == void 0 ) {
            throw new Error("reference '"+m[1]+"' has no matches")
          }
        }
        else return common.interpolate(val,ctxt.spec,{required:true,resource:false})
      } 

      return val;
    })
  }

  return self
}
exports.Step = Step


function ForkStep( opt ) {
  var self = new Step( opt )
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


function MacroStep( opt ) {
  var self = new Step( opt )
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






function DatePointStep(opt) {
  var self = new Step( opt )
  self.name = 'datepoint'

  self.exec = function( ctxt, cb ) {
    ctxt.genlog.log(ctxt,'step/'+self.name,{name:opt.name,when:new Date().getTime()})
    cb()
  }

  return self
}
exports.DatePointStep = DatePointStep





function LoadStep( opt ) {
  var self = new Step( opt )
  self.name = 'load'

  self.exec = function( ctxt, cb ) {
    var opt = self.resolve_opt(ctxt)

    var path = opt.path
    var src  = opt.src || opt.path
    var text = opt.text
    var encoding = opt.encoding || 'binary'

    if( !text && src) {

      var spec = _.clone(ctxt.spec)
      spec.opt = opt      
      var loadsrc = common.interpolate( src, spec, {required:1} )

      ctxt.resman.load({path:loadsrc,encoding:encoding},function(err,reslist){
        if( err ) return cb(err);
        
        if( 0 === reslist.length ) {
          if( opt.required ) {
            return cb(new Error('no resoures found: '+src) )
          }
          else {
            return cb()
          }
        }
        
        var resitems = []
        reslist.each( function( err, res, next ) {
          if( err ) return cb(err);
          if( !res ) { 
            ctxt.spec.gen.reslist = resitems
            return cb() 
          }
          res.path = path
          resitems.push(res)
          next()
        })
      })
    }
    else {
      ctxt.spec.gen.reslist = [{path:path,text:text,encoding:encoding}]
      cb()
    }
  }

  return self
}
exports.LoadStep = LoadStep



function SaveStep( opt ) {
  var self = new Step( opt )
  self.name = 'save'


  self.exec = function( ctxt, cb ) {
    var opt = self.resolve_opt(ctxt)
    var savelist = []

    if( opt.path && opt.text ) {
      savelist = [{path:opt.path,text:opt.text}]
    }
    else if( opt.list ) {
      savelist = opt.list
    }
    else {
      savelist = ctxt.spec.gen && ctxt.spec.gen.reslist
    }

    for( var i = 0; i < savelist.length; i++ ) {
      var saveitem = savelist[i]
      saveitem.path     = opt.path     || saveitem.path
      if( null == saveitem.path ) {
        return cb(new Error("save item has no path: "+JSON.stringify(saveitem)))
      }
 
      saveitem.encoding = opt.encoding || saveitem.encoding || 'binary' 
      saveitem.verbatim = opt.verbatim || saveitem.verbatim || false 
    }

    var spec = _.clone(ctxt.spec)
    spec.opt = opt

    function nextsave(i) {
      if( savelist.length <= i ) return cb();

      var saveitem = savelist[i]
      if( !saveitem.verbatim ) {
        saveitem.path = common.interpolate( saveitem.path, 
                                            spec,
                                            {required:true,resource:false} )
      }

      var desc = _.clone(saveitem)
      delete desc.text
      desc.text_length = saveitem.text.length
      ctxt.genlog.log(ctxt,self.name+'/item',desc)      

      ctxt.resman.save({path:saveitem.path,text:saveitem.text,encoding:saveitem.encoding}, function(err){
        if( err ) { return cb(err) }
        nextsave(i+1)
      })
    }
    nextsave(0)
  }
  
  return self
}
exports.SaveStep = SaveStep



function InsertStep( opt ) {
  var self = new Step( opt )
  self.name = 'insert'

  self.opt.required = self.opt.required === void 0 ? true : self.opt.required


  self.exec = function( ctxt, cb ) {
    var opt = self.resolve_opt(ctxt)

    var text = opt.text || ctxt.spec.gen.text
    var src  = opt.src || opt.path
    var encoding = opt.encoding || 'binary'
    var verbatim = opt.verbatim || {}

    if( !text && src) {
      var loadsrc = common.interpolate( src, ctxt.spec, {required:1} )

      ctxt.resman.load({path:loadsrc,encoding:encoding},function(err,reslist){
        if( err ) return cbwhence('loaderr',err);
        
        if( 0 === reslist.length ) {
          if( opt.required ) {
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
exports.InsertStep = InsertStep



function EachStep( opt ) {
  var self = new Step( opt )
  self.name = 'each'

  self.exec = function( ctxt, cb ) {
    var stepdefs = self.opt.steps
    delete self.opt.steps

    var opt = self.resolve_opt(ctxt)

    //var q = opt.of
    //var res = _.isString(q) ? jsonquery.JSONQuery(q,ctxt.spec) : q

    var res = opt.of

    if( !_.isArray(res) ) {
      res = [res]
    }
    
    ctxt.stepman.addsteps([
      ctxt.stepman.make({
        name:'iterate',
        opt:{
          list:res,
          index:0,
          steps:stepdefs
        }
      })
    ])

    cb()
  }

  return self
}
exports.EachStep = EachStep




function IterateStep( opt ) {
  var self = new Step( opt )
  self.name = 'iterate'

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
      steps[i] = ctxt.stepman.make(stepdefs[i])
    }


    steps.push( ctxt.stepman.make({
      name:'iterate',
      opt:{
        list:opt.list,
        index:opt.index+1,
        steps:stepdefs
      }
    }))
    
    ctxt.stepman.addsteps(steps)

    cb()
  }

  return self
}
exports.IterateStep = IterateStep



function SuperSaveStep( opt ) {
  var self = new Step( opt )
  self.name = 'save'

  self.opt.verbatim = self.opt.verbatim || {}
  self.opt.required = self.opt.required === void 0 ? true : self.opt.required


  self.exec = function( ctxt, cb ) {
    function cbwhence(whence,err) {
      cb(err)
    }

    var opt = self.opt
    var path = opt.path
    var text = opt.text
    var src  = opt.src || opt.path
    var encoding = opt.encoding || 'binary'
    var verbatim = opt.verbatim || {}

    if( !text && src) {
      var loadsrc = common.interpolate( src, ctxt.spec, {required:1} )

      ctxt.resman.load({path:loadsrc,encoding:encoding},function(err,reslist){
        if( err ) return cbwhence('loaderr',err);
        
        if( 0 === reslist.length ) {
          if( opt.required ) {
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
exports.SuperSaveStep = SuperSaveStep



// simulate different kinds of errors generated by Steps
function ErrorStep( opt ) {
  var self = new Step( opt )
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
  var self = new Step( opt )
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
  var self = new Step( opt )
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
  var self = new Step( opt )
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
  var self = new Step( opt )
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




