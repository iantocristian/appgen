
"use strict";

var common = require('../common')
var _ = common._
var eyes = common.eyes

var Step = require('./Step').Step



function VerifyStep( opt ) {
  var self = Step.apply( null, arguments )


  self.exec = function( ctxt, cb ) {
    var opt = ctxt.opt

    var filemap = opt.filemap
    // TODO validate opts


    var filelist = []
    common.walk(filemap,function(val,prop,parents) {
      if( _.isString(val) ){
        filelist.push( {path:parents.concat(prop).join('/'),re:val} )
      }
      return val
    })


    //console.dir(filelist)

    function verify(i){
      if( i < filelist.length ) {
        var fileitem = filelist[i]
        ctxt.resman.load({path:fileitem.path,encoding:'binary'},function(err,resource){
          if( err ) {
            return cb(err);
          }
          else if( !new RegExp(fileitem.re).exec(resource.text) ) {
            return cb(new Error("resource "+fileitem.path+" content does not match regexp: "+fileitem.re))
          }
          else {
            verify(i+1)
          }
        })
      }
      else {
        cb()
      }
    }
    verify(0)
  }

  return self
}
exports.VerifyStep = VerifyStep
