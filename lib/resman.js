"use strict";


var common = require('./common')


var fs = common.fs
var fspath = common.fspath

var glob = common.glob
var _ = common._


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



function FileResList( paths, opt ) {
  var self = {}

  self.length = paths ? ( paths.length || 0 ) : 0

  self.each = function( f ) {
    var size = opt.first ? 1 : paths.length

    var pathI = -1

    nextpath()
    function nextpath(cmd) {
      if( 'stop'==cmd ) return;

      pathI++
      if( paths.length <= pathI ) {
        return f()
      }

      var path = paths[pathI]
      var encoding = opt.encoding || 'binary'

      fs.readFile(path,encoding, function(err,text){
        if( err ) return f(err);
        var res = {text:text,srcpath:path,srcbase:opt.base}
        f(err,res,nextpath)
      })
    }
  }

  return self
}


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


  self.paths = function(opt,cb) {
    var paths = self.base+'/'+opt.paths

    glob( paths, {}, function( err, paths ) {
      if( err ) return cb(err);

      // remove base path prefix
      paths = _.map(paths,function(val){
        if( 0 == val.indexOf(self.base ) ) {
          return val.substring( self.base.length+1 )
        }
        else return val;
      })

      cb(null,paths)
    })
  }


  self.load = function(opt,cb) {
    var path = opt.path

    if( 0 != path.indexOf( self.base ) ) {
      path = self.base+'/'+path 
    }

    var encoding = opt.encoding || 'binary'

    fs.readFile(path,encoding, function(err,text){
      if( err ) return cb(err);

      // HACK! also in stepman.LoadStep - fix!
      function removebase(path,base) {
        return 0 == path.indexOf(base) ? path.substring(base.length+1) : path
      }

      var name = fspath.basename(path)
      var dir = fspath.dirname(path)

      var resource = {
        text:text,
        name:name,
        folder:removebase(dir,self.base),
        loadpath:removebase(path,self.base),
        base:self.base,encoding:encoding
      }
      cb(err,resource)
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
        mkdir(1)
        function mkdir(i){
          if( i <= parts.length ) {
            var folder = self.out+'/'+parts.slice(0,i).join('/')
            fs.mkdir(folder,function(err){
              if( err && !'EEXIST'==err.code ) return cb( err );
              mkdir(i+1)
            })
          }
          else writeFile()
        }

        function writeFile() {
          var path = self.out+'/'+opt.path
          var encoding = opt.encoding || 'binary'
          fs.writeFile(path,opt.text,encoding,function(err){
            cb(err)
          })
        }
      })
    })
  }


  self.api = {
    paths: common.delegate(self,self.paths),
    load:  common.delegate(self,self.load),
    save:  common.delegate(self,self.save)
  }
  
 
  return self
}


exports.FileResMan = FileResMan

