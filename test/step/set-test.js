
var vows   = require('vows')
var assert = require('assert')
var gex    = require('gex')

var common = require('../../lib/common.js')

var stepmod = require('../../lib/step/Set.js')

var _ = common._




function execstep(test,opt,spec) {
  var ctxt = {
    api:{
      spec:spec,
      genlog:{log:function(msg){
        if( false ) console.log(msg);
      }}
    }
  }
  ctxt.genlog = ctxt.api.genlog

  try {
    new stepmod.SetStep(opt).do_exec(ctxt,function(err){
      test.callback(err,spec)
    })
  }
  catch( err ) {
    console.log(err.stack)
    throw err
  }
}


vows.describe('SetStep').addBatch({

  'literal': {
    topic: function() { execstep(this,{ref:'gen.foo',value:'bar'},{}) },
    'callback': function( res ) {
      assert.equal(res.gen.foo,'bar')
    },
  },

  'regexp': {
    topic: function() { execstep(this,{ref:'gen.foo',value:{source:'${gen.bar}',match:'(b)',replace:'c$1c'}},{gen:{bar:'ababa'}}) },
    'callback': function( res ) {
      //console.dir(res)
      assert.equal(res.gen.foo,'acbcacbca')
    },
  },


}).export(module)

