
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
      common.interpolate('#{a}',{},function(){ console.log('CB') })

      assert.equal( common.interpolate('',{}), '' )
      assert.equal( common.interpolate('-#{p1}-',{p1:'v1'}), '-v1-' )
      assert.equal( common.interpolate('#{p1}-#{p2}-#{p1}',{p1:'v1',p2:'v2'}), 'v1-v2-v1' )

      assert.equal( common.interpolate('-+#{p2}+-',{p1:'+#{p2}+',p2:'v2'}), '-+v2+-' )
      assert.equal( common.interpolate('-#{p1}-',{p1:'+#{p2}+',p2:'v2'}), '-+v2+-' )

      try { common.interpolate('#{a}',{},'required'); assert.fail() } catch(e) {}

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
    }
  },
}).export(module)

