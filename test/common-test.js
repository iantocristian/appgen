
var vows   = require('vows')
var assert = require('assert')
var gex    = require('gex')

var common = require('../lib/common.js')



vows.describe('common').addBatch({
  'interpolate': {
    topic: function() {
      return common;
    },

    'basic': function( common ) {
      assert.equal( common.interpolate('',{}), '' )
      assert.equal( common.interpolate('-#{p1}-',{p1:'v1'}), '-v1-' )
      assert.equal( common.interpolate('#{p1}-#{p2}-#{p1}',{p1:'v1',p2:'v2'}), 'v1-v2-v1' )

      assert.equal( common.interpolate('-+#{p2}+-',{p1:'+#{p2}+',p2:'v2'}), '-+v2+-' )
      assert.equal( common.interpolate('-#{p1}-',{p1:'+#{p2}+',p2:'v2'}), '-+v2+-' )

      // TODO: test error handling
    },
  },
}).export(module)

