"use strict";


var common = require('./common')

var fspath = common.fspath

var _ = common._
var eyes = common.eyes


var sm = common.stepman


var Step = require('./step/Step').Step


var ResMan     = common.resman.ResMan
var FileResMan     = common.resman.FileResMan

var StepMan    = common.stepman.StepMan
//var SlotMan    = common.slotman.SlotMan
var ContextMan = common.context.ContextMan

var GenLog    = common.genlog.GenLog


function AppGen(opt) {
  var self = {}

  //eyes.inspect(opt)

  var baseopt = {
    macro: {

      handle_resource_savepath:{steps:[
        { name:'set', ref:'gen.resource.savepath', value:'${gen.resource.loadpath}' },
        { name:'set', if:'arg.save', ref:'gen.resource.savepath', value:'${arg.save}' },

        { name:'block', if:'arg.from', steps:[
          { name:'set', ref:'gen.escre_from', value:{source:'${arg.from}',match:'[-/\\\\^$*+?.()|[\]{}]',replace:'\\$&'}},
          { name:'set', ref:'gen.resource.selectpath', value:{source:'${gen.resource.loadpath}',match:'.*${gen.escre_from}(.*)',replace:'$1'}},
          { name:'set', ref:'gen.resource.savepath', value:'${arg.to+"/"+gen.resource.selectpath}'},
        ]},

        { name:'set', if:'arg.rename', ref:'gen.resource.savepath', value:{source:'${gen.resource.savepath}', match:'${arg.rename.find}', replace:'${arg.rename.replace}' }},
      ]},

/*
gah! define terms!

path = input path glob - full path to file
save = full output path

from = load base folder
select = sub path glob - from+select+to always together
to  =  save base folder - option - use from if not defined

rename:{find,replace} - operates last on full output path
*/


      import:{steps:[
/* need a step that decl defines expected arg combos */

        { name:'find', path:'${arg.path||arg.from+arg.select}', exclude:'${arg.exclude||""}'},

        { name:'for', opt:{
          each:'${gen.paths}',
          steps:[
            { name:'load', path:'${gen.item}'},
            { name:'handle_resource_savepath', from:'${arg.from}', to:'${arg.to}', save:'${arg.save}', rename:'${arg.rename}' },

            { name:'save',  opt:{path:'${gen.resource.savepath}'}},
          ]                     
        }},
      ]},

      template:{steps:[
        { name:'find', path:'${arg.path||arg.from+arg.select}', exclude:'${arg.exclude||""}'},

        { name:'for', opt:{
          each:'${gen.paths}',
            steps:[
              { name:'load',  opt:{path:'${gen.item}'}},
              { name:'handle_resource_savepath', from:'${arg.from}', to:'${arg.to}', save:'${arg.save}', rename:'${arg.rename}' },

              { name:'insert',  opt:{on:'gen.resource.text'}},
              { name:'ejs',     opt:{on:'gen.resource.text'}},

              { name:'save',  opt:{path:'${gen.resource.savepath}'}},
            ]                     
        }},
      ]},


      concat:{steps:[
        { name:'find', path:'${arg.path||arg.paths||arg.from+arg.select}', exclude:'${arg.exclude||""}'},

        { name:'set', ref:'gen.append', value:''},
        { name:'for', 
          each:'${gen.paths}',
          steps:[
            { name:'load', path:'${gen.item}'},
            { name:'print', msg:'${gen.resource.text}'},
            { name:'append', ref:'gen.append', value:'${gen.resource.text}'}
          ],
        },
        { name:'print', msg:'${gen.append}'},
        { name:'save', text:'${gen.append}', path:'${arg.save}'},
      ]},



      build_ios: {steps:[
        { name: 'exec',
            opt: { buildscript: require.resolve('./../bin/build-ios.sh') },
            cmd: '${opt.buildscript+" \\""+arg.outputdir+"\\" \\""+arg.xcodeproj+"\\" \\""+arg.target+"\\" \\""+arg.configuration+"\\" \\""+arg.keychain+"\\" \\""+arg.keychain_password+"\\" \\""+arg.codesignidentity+"\\" \\""+arg.provisioningprofile+"\\""}' },
        { name: "block", "if": "arg.archive", steps:[
            { name: 'exec',
                opt: { buildscript: require.resolve('./../bin/archive-ios.sh') },
                cmd: '${opt.buildscript+" \\""+arg.outputdir+"\\" \\""+arg.target+"\\" \\""+arg.keychain+"\\" \\""+arg.keychain_password+"\\" \\""+arg.codesignidentity+"\\" \\""+arg.provisioningprofile+"\\""}' },
        ]}
      ]},

      build_android: {steps: [
        { name: 'exec',
            opt: { buildscript: require.resolve('./../bin/build-android.sh') },
            cmd: '${opt.buildscript+" \\""+arg.outputdir+"\\" \\""+arg.projectdir+"\\" \\""+arg.target+"\\" \\""+arg.configuration+"\\""}'},
        { name: "block", "if": "arg.sign", steps:[
            { name: 'exec',
                opt: { buildscript: require.resolve('./../bin/sign-android.sh') },
                cmd: '${opt.buildscript+" \\""+arg.outputdir+"\\" \\""+arg.target+"\\" \\""+arg.keystore+"\\" \\""+arg.keystore_password+"\\" \\""+arg.key+"\\""}'},
        ]}
      ]},
    }
  }

  opt.spec = common.deepoverride(baseopt,opt.spec)

  if( !opt.spec.steps || !opt.spec.steps.length ) {
    throw new Error('Invalid spec: no steps')
  }

  opt.spec.pref = opt.spec.pref || {}

  opt.msgs = opt.msgs || {
    print:function(msg){console.log(msg)},
    error:function(error){console.dir(error)},
  }


  var errhandler = function( whence, ctxt, err, cb ) {
    if( !err instanceof Error ) {
      var orig = err
      var msg = orig.message || orig.msg
      if( _isString(orig) ) {
        msg = orig
      }
      err = new Error(msg)
      err.orig = orig
    }

    if( !err.message ) {
      err.message = 'unknown ('+JSON.stringify(err)+')'
    }

    err.ctxt = ctxt

    cb(err)
  }


  var finish = function( err, resctxt, cb ) {
    if( err ) {
      err.ctxt.genlog.log(err.ctxt,'error',{msg:err.message})
    }

    if( err ) {
      opt.msgs.error(err,{stack:0<opt.verbose})
    }

    cb && cb(err, resctxt)
  }


  var do_exec = function( conf, genlog, cb ) {
    var ctxtman = new ContextMan()

    var stepman = new StepMan({
      base:opt.specfile?fspath.dirname(fspath.resolve(opt.specfile)):null,
      steps:opt.spec.pref?opt.spec.pref.steps:null
    })
    

    stepman.macro = opt.spec.macro || {}

    var steps = []
    for( var i = 0; i < opt.spec.steps.length; i++ ) {
      steps.push( stepman.make(opt.spec.steps[i]) )
    }
    stepman.steps = steps



    var resman = new FileResMan()

    var deps = {
      genlog:  genlog,
      resman:  resman,
      stepman: stepman,
      msgs:    opt.msgs
    }

    var spec = opt.spec
    spec.conf = common.deepoverride( opt.spec.conf,conf)
    var initspec = {name:'main',spec:spec}


    ctxtman.init(deps, initspec)


    function nextcond( ctxt, cb ) {
      var cond = ctxt.stepman.cond()
      if( !cond ) return nextstep( 'cond', ctxt, cb );

      var err
      try {
        err = cond.exec( ctxt.api, function(err,res) {
          if( err ) { return errhandler('cond-callback',ctxt,err,cb) }
          
          if( res && 'fork' == res.cmd ) {
            return nextfork( 'cond', ctxtman.nextfork(), cb )
          }
          
          nextcond( ctxt, cb )
        })
      }
      catch( ex ) {
        return errhandler('cond-exception',ctxt,ex,cb)
      }

      if( err ) {
        return errhandler('cond-return',ctxt,err,cb)
      }
    }


    function nextstep( whence, ctxt, cb ) {
      var step = ctxt.stepman.step() 
      if( !step ) return nextfork( 'last-step', ctxtman.nextfork(), cb );

      var err,cbI=0
      try {
        err = step.do_exec( ctxt, function(err,res) {

          cbI++
          if( 1 < cbI ) {
            return errhandler( 
              'step-repeat-callback',ctxt,
              new Error('Step triggered callback more than once: '+cbI+' '+new Date().getTime()),cb)
          }

          if( err ) { return errhandler('step-callback',ctxt,err,cb) }

          if( res ) {

            if( res.info ) {
              if( opt.msgs && 1 == opt.verbose ) {
                opt.msgs.print(step.name+': '+JSON.stringify(res.info))
              }
            }

            if( 'fork' == res.cmd ) {
              return nextfork( 'step', ctxtman.nextfork(), cb )
            }
          }

          nextcond( ctxt, cb )
        })
      }
      catch( ex ) {
        return errhandler('step-exception',ctxt,ex,cb)
      }

      if( err ) {
        return errhandler('step-return',ctxt,err,cb)
      }
    }


    function nextfork( whence, ctxt, cb ) {
      if( !ctxt ) return cb();
      ctxtman.genlog.log(ctxt, 'fork/start', ctxt.spec.conf)
      
      if( opt.msgs && 1 == opt.verbose ) {
        opt.msgs.print('fork: '+ctxt.name+': '+JSON.stringify(ctxt.spec.conf))
      }

      ctxt.api = ctxtman.api(ctxt)
      nextstep( 'fork', ctxt, cb )
    }

    nextfork( 'start', ctxtman.nextfork(), function(err) { 
      finish(err,ctxtman.result(),cb) 
    })
  }


  self.exec = function(conf,cb) {
    if( !cb ) {
      cb = conf
      conf = {}
    }

    var genlog = new GenLog({msgs:opt.msgs,print:1<opt.verbose})

    try {
      do_exec( conf, genlog, cb )
    }
    catch( ex ) {
      ex.ctxt = ex.ctxt || {genlog:genlog,stepman:{steps:[{}],stepI:1,index:function(){return 1}}}
      finish( ex, ex.ctxt, cb )
    }
  }


  return self
}


exports.AppGen = AppGen

exports.Step = Step


