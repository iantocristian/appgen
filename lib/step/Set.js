
"use strict";

var common = require('../common')
var _ = common._

var Step = require('./Step').Step



// {name:'set', ref:'gen...', value:'...'||{source:'...',match:'regexp',replace:'...$1...'} }
function SetStep() {
  var self = Step.apply( null, arguments )

  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    if( !opt.ref ) {
      return cb(new Error('option missing: ref'))
    }
    var ref = opt.ref

    if( _.isUndefined(opt.value) ) {
      return cb(new Error('option missing: value'))
    }
    var value = opt.value


    var val

    if( _.isObject(value) ) {
      if( value.match ) {
        value.flags = value.flags || ''

        var flags = ''

        // special case - g is default, so G removes
        flags += (-1==value.flags.indexOf('G'))?'g':''

        flags += (-1==value.flags.indexOf('i'))?'':'i'
        flags += (-1==value.flags.indexOf('m'))?'':'m'

        var re = new RegExp(value.match,flags)
        val = ''+value.source
        val = val.replace(re,value.replace)


        
      }
    }
    else val = value;

    
    self.setvalue( ctxt.spec, ref, val )

    cb()
  }

  return self
}
exports.SetStep = SetStep
