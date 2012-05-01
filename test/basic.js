
var vows   = require('vows')
var assert = require('assert')
var gex    = require('gex')

var stepman = require('../lib/stepman.js')
var slotman = require('../lib/slotman.js')
var resman  = require('../lib/resman.js')
var genlog  = require('../lib/genlog.js')



vows.describe('basic').addBatch({
  'stepman': {
    topic: function() {
      return new stepman.StepMan()
    },

    'step': function( stepman ) {
      stepman.steps = ['a','b','c']
      var step
      var i = 0
      while( step = stepman.step() ) {
        assert.equal( stepman.steps[i++], step )
      }
    },

    'cond': function( condman ) {
      condman.conds = ['a','b','c']
      var cond
      var i = 0
      while( cond = condman.cond() ) {
        assert.equal( condman.conds[i++], cond )
      }
    },

    'make': function( stepman ) {
      var dp = stepman.make({name:'datepoint',opts:{name:'a'}})
      assert.equal(dp.name, 'datepoint')
    }
  },

  'slotman': {
    topic: function() {
      return new slotman.SlotMan()
    },

    'api': function( slotman ) {
      assert.equal(null,slotman.get('a'))
      slotman.add({name:'a'})
      assert.deepEqual({name:'a'},slotman.get('a'))
      var slota = slotman.consume('a')
      assert.deepEqual({name:'a'},slota)
      assert.equal(null,slotman.get('a'))
      assert.equal(null,slotman.consume('a'))
    },
  },

  'resman': {
    topic: function() {
      return new resman.ResMan()
    },

    'api': function( resman ) {
      resman.save({path:'css/app.css',text:'h1 {color:red}'},function(err,desc){
        assert.equal(null,err)
        assert.equal('css/app.css',desc.path)

        resman.get('css/app.css',function(err,desc){
          assert.equal(null,err)
          assert.equal('css/app.css',desc.path)
        })
      })
    }
  },

  'genlog': {
    topic: function() {
      return new genlog.GenLog()
    },

    'happy': function( genlog ) {
      var fork = {name:'main'}
      genlog.log(fork,'step',{a:1})
      genlog.log(fork,'cond',{a:2})
      var s = genlog.toString()
      console.log(s)
      assert.ok(gex('{"fork":"main","type":"step","desc":{"a":1},"when":"*T*Z"}\n{"fork":"main","type":"cond","desc":{"a":2},"when":"*T*Z"}\n').on(s))
    }
  }

}).run()

