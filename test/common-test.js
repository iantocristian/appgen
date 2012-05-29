
var vows   = require('vows')
var assert = require('assert')
var gex    = require('gex')

var common = require('../lib/common.js')



vows.describe('common').addBatch({
  'basic': {
    topic: function() {
      return common;
    },

    'interpolate': function( common ) {
      common.interpolate('${a}',{},function(err,str){ assert.isNull(err),assert.equal('',str) })

      assert.equal( common.interpolate('',{}), '' )
      assert.equal( common.interpolate('-${p1}-',{p1:'v1'}), '-v1-' )
      assert.equal( common.interpolate('${p1}-${p2}-${p1}',{p1:'v1',p2:'v2'}), 'v1-v2-v1' )

      assert.equal( common.interpolate('-+${p2}+-',{p1:'+${p2}+',p2:'v2'}), '-+v2+-' )
      assert.equal( common.interpolate('-${p1}-',{p1:'+${p2}+',p2:'v2'}), '-+v2+-' )

      try { common.interpolate('${a}',{},'required'); assert.fail() } catch(e) {}

      // TODO: test error handling
    },

    'deepoverride': function( common ) {
      assert.equal( JSON.stringify( common.deepoverride({a:1,b:2},{b:22,c:3})), 
                    '{"a":1,"b":22,"c":3}' )
      assert.equal( JSON.stringify( common.deepoverride({a:1,b:2,c:{c:1,d:1}},{b:22,c:{d:2,e:3},d:3})), 
                    '{"a":1,"b":22,"c":{"c":1,"d":2,"e":3},"d":3}' )
      assert.equal( JSON.stringify( common.deepoverride({a:1,b:[1]},{b:[1,2],c:3})), 
                    '{"a":1,"b":[1,2],"c":3}' )
      assert.equal( JSON.stringify( common.deepoverride({a:1,b:[1,2]},{b:[3],c:3})), 
                    '{"a":1,"b":[3,2],"c":3}' )
      assert.equal( JSON.stringify( common.deepoverride({a:1,b:[1,2]},{b:{1:3},c:3})), 
                    '{"a":1,"b":[1,3],"c":3}' )
    },

    'isTrueFalse': function( common ) {
      assert.ok( common.isFalse(false) )
      assert.ok( common.isFalse(null) )
      assert.ok( common.isFalse(undefined) )
      assert.ok( common.isFalse(void 0) )
      assert.ok( common.isFalse(0) )
      assert.ok( common.isFalse(-0) )
      assert.ok( common.isFalse(NaN) )
      assert.ok( common.isFalse('') )
      assert.ok( common.isFalse(new Boolean(false)) )
      assert.ok( common.isFalse('false') )
      assert.ok( common.isFalse('FALSE') )
      assert.ok( common.isFalse('no') )
      assert.ok( common.isFalse('N') )
      assert.ok( common.isFalse('f') )

      assert.ok( common.isTrue(true) )
      assert.ok( common.isTrue(1) )
      assert.ok( common.isTrue('a') )
      assert.ok( common.isTrue({}) )
      assert.ok( common.isTrue({a:1}) )
      assert.ok( common.isTrue('true') )
      assert.ok( common.isTrue('TRUE') )
      assert.ok( common.isTrue('T') )
      assert.ok( common.isTrue('yes') )
    }
  },
}).export(module)

