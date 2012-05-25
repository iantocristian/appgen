"use strict";

var common = require('../common')
var _ = common._

var jsonquery = common.jsonquery
var ejs = common.ejs

var Step = require('./Step').Step




function EjsStep( opt ) {
  var self = Step.apply( null, arguments )
  self.name = 'insert'
  self.opt_exclude = ['in','out','on']
  

  // TODO: same opt as Insert - factor out
  // TODO: handle escaping - running on ejs format template itself!

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

    var ejsopt = _.clone(spec)

    // as per https://github.com/visionmedia/ejs
    delete ejsopt.cache
    delete ejsopt.filename
    delete ejsopt.scope
    delete ejsopt.debug
    delete ejsopt.open
    delete ejsopt.closed

    var gentext = ejs.render(text,ejsopt)

    common.setvalue(ctxt.spec,outward,gentext)
    cb()
  }


  return self
}
exports.EjsStep = EjsStep
