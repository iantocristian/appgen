
var vows   = require('vows')
var assert = require('assert')
var gex    = require('gex')

var common = require('../lib/common.js')

var _ = common._

var stepman = common.stepman


function execerror(test,opts) {

  try {
    var err = new stepman.ErrorStep(opts).exec({spec:{conf:{}}},function(err){ test.callback(null,{err:err,how:'callback'}) })
    if( err ) {
      return {err:err,how:'return'}
    }
  }
  catch(ex) {
    // console.dir(ex) // use to debug test
    return {err:ex,how:'throw'}
  }

}

function checkerror(res,InstanceOf,message,how) {
  assert.isNotNull(res.err)

  if( InstanceOf ) {
    if( InstanceOf instanceof Function && InstanceOf.name == 'String' ) {
      assert.isString(res.err)
    }
    else {
      assert.isObject(res.err)
      assert.instanceOf(res.err,InstanceOf)
    }
  }

  if( message ) {
    if( _.isString(res.err) ) {
      assert.equal(res.err,message)
    }
    else {
      assert.equal(res.err.message,message)
    }
  }

  if( how ) {
    assert.equal(res.how,how)
  }
}


vows.describe('steps').addBatch({

  'default': {
    topic: function() { execerror(this) },
    'callback': function( res ) {
      checkerror(res,Error,'unknown error','callback')
    },
  },

  'message': {
    topic: function() { return execerror(this,{msg:'foo'}) },
    'callback': function( res ) {
      checkerror(res,Error,'foo','callback')
    },
  },

  'kind-error': {
    topic: function() { return execerror(this,{kind:'error',msg:'foo'}) },
    'callback': function( res ) {
      checkerror(res,Error,'foo','callback')
    },
  },

  'kind-string': {
    topic: function() { return execerror(this,{kind:'string',msg:'foo'}) },
    'callback': function( res ) {
      checkerror(res,String,'foo','callback')
    },
  },

  'kind-object': {
    topic: function() { return execerror(this,{kind:'object',msg:'foo'}) },
    'callback': function( res ) {
      checkerror(res,Object,'foo','callback')
    },
  },


  'throw': {
    topic: function() { return execerror(this,{die:'throw',msg:'foo'}) },
    'callback': function( res ) {
      checkerror(res,Error,'foo','throw')
    },
  },


  'return': {
    topic: function() { return execerror(this,{die:'return',msg:'foo'}) },
    'callback': function( res ) {
      checkerror(res,Error,'foo','return')
    },
  },

}).export(module)

