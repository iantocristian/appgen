"use strict";


var common = require('./common')

var eyes = common.eyes


function GenLog(opts) {
  var self = {}

  self.entries = []

  self.log = function( ctxt, type, desc ) {

    var entry = {
      when: new Date().toISOString(),
      fork: ctxt.name,
      type: type,
      desc: desc,
      meta: {stepI:ctxt.stepman?ctxt.stepman.index()-1:-1}
    }
    self.entries.push( entry )

    if( opts.msgs && opts.print ) {
      opts.msgs.print( GenLog.prettify(entry) )
    }
  }

  self.toString = function() {
    var sb = []
    for( var i = 0; i < self.entries.length; i++ ) {
      var entry = self.entries[i]
      sb.push( GenLog.stringify(entry) )
      sb.push('\n')
    }
    var str = sb.join('')
    return str
  }
 
  return self
}


GenLog.stringify = function( entry ) {
  var sb = [
    '{"fork":"',entry.fork,
    '","type":"',entry.type,
    '","desc":',JSON.stringify(entry.desc),
    ',"when":"',entry.when,'"}'
  ]
  return sb.join('')
}


GenLog.prettify = function( entry ) {
  var sb = [
    entry.fork,
    ': ',
    entry.type,
  ]

  if( 0 == entry.type.indexOf('step') ) {
    sb[2] = 'step:'+entry.meta.stepI+entry.type.substring(4)
  }

  var str = sb.join('')
  var spacer = "                              ".substring(0,Math.max(2,30-str.length))

  return str+spacer+JSON.stringify(entry.desc)
}


exports.GenLog = GenLog

