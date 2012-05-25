"use strict";

var common = require('../common')
var _ = common._

var jsonquery = common.jsonquery

var Step = require('./Step').Step



// in: source text, out: target ref, on: in+out ref (#{...} optional)
function InsertStep( opt ) {
  var self = Step.apply( null, arguments )
  self.name = 'insert'
  self.opt_exclude = ['in','out','on']
  

  self.exec = function( ctxt, cb ) {

    // uses raw options
    var opt = self.opt

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
