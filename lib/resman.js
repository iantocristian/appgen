
var common = require('./common')



function ResMan() {
  var self = {}


  self.commit = function( step ) {} 


  self.get = function(opt,cb) {
    cb && cb(null,{text:'<h1>Hello</h1>'})
  }

  self.save = function(opt,cb) {
    cb && cb(null,{path:'www/index.html'})
  }

  self.api = {
    get: common.delegate(self,self.get),
    save: common.delegate(self,self.save)
  }
  
 
  return self
}


exports.ResMan = ResMan

