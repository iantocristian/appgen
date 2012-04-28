"use strict";


var common = require('./common')



function GenLog() {
  var self = {}

  self.entries = []

  self.log = function( fork, type, desc ) {
    var entry = {
      when: new Date().toISOString(),
      fork: fork.name,
      type: type,
      desc: desc
    }
    self.entries.push( entry )
    console.log( GenLog.stringify(entry) )
  }

  self.toString = function() {
    var sb = []
    for( var i = 0; i < self.entries.length; i++ ) {
      var entry = self.entries[i]
      sb.push( GenLog.stringify(entry) )
      sb.push('\n')
    }
    return sb.join('')
  }
 
  return self
}

GenLog.stringify = function( entry ) {
  var sb = [
    '{"when":"',entry.when,
    '","fork":"',entry.fork,
    '","type":"',entry.type,
    '","desc":',JSON.stringify(entry.desc),
    "}"
  ]
  return sb.join('')
}


exports.GenLog = GenLog

