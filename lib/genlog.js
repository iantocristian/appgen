
var common = require('./common')



function GenLog() {
  var self = {}

  self.log = function( msg ) {
    console.log( msg )
  }
 
  return self
}


exports.GenLog = GenLog

