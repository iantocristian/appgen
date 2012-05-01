"use strict";


var common = require('./common')


var fs = common.fs



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



function FileResMan() {
  var self = {}


  self.fork = function( ctxt ) {
    var ctxtres = ctxt.spec.res
    var fork = new FileResMan()

    fork.base = ctxtres.base
    fork.gen  = ctxtres.gen
    fork.out  = ctxtres.gen+'/'+ctxt.name

    return fork
  }

  self.load = function(opt,cb) {
    var path = self.base+'/'+opt.path
    fs.readFile(path,'utf8',function(err,text){
      cb(err,text)
    })
  }


  self.save = function(opt,cb) {

    // TODO: cache folders created state

    // DONT DO THIS
    fs.mkdir(self.gen,function(err){
      if( err && !'EEXIST'==err.code ) return cb( err );
      fs.mkdir(self.out,function(err){
        if( err && !'EEXIST'==err.code ) return cb( err );


        var parts = (opt.path.split('/').slice(0,-1))
        console.log('PARTS:'+parts)
        mkdir(1)
        function mkdir(i){
          if( i <= parts.length ) {
            var folder = self.out+'/'+parts.slice(0,i)
            fs.mkdir(folder,function(err){
              if( err ) return cb( err );
              mkdir(i+1)
            })
          }
          else writeFile()
        }

        function writeFile() {
          var path = self.out+'/'+opt.path
          console.log('WRITE:'+path)
          fs.writeFile(path,opt.text,'utf8',function(err){
            cb(err)
          })
        }
      })
    })
  }


  self.api = {
    get: common.delegate(self,self.get),
    save: common.delegate(self,self.save)
  }
  
 
  return self
}


exports.FileResMan = FileResMan

