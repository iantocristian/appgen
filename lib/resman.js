
var common = require('./common')



function ResMan() {
  var self = {}


  self.resmap = {
    'index.html': {path:'index.html',text:'<h1>Hello</h1>'},
    'js/app.js': {path:'js/app.js',text:'var app = {}'},
  }


  self.commit = function( step ) {} 


  self.get = function(opt,cb) {
    cb && cb(null,self.resmap[opt])
  }

  self.save = function(opt,cb) {
    self.resmap[opt.path] = opt
    cb && cb(null,opt)
  }

  self.api = {
    get: common.delegate(self,self.get),
    save: common.delegate(self,self.save)
  }
  
 
  return self
}


exports.ResMan = ResMan

