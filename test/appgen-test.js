
var vows   = require('vows')
var assert = require('assert')
var gex    = require('gex')

var appgen = require('../lib/appgen.js')


var spec = {
  happy: {
    res: { base: 'base01',gen: 'gen01' },

    pref:{ ext:'txt' },
  
    steps: [
      {name:'fork',opt:{
        forks:[
          {name:'aa',spec:{pref:{color:'red'}}},
          {name:'bb',spec:{pref:{color:'blue'}}}
        ]}},
      {name:'save',opt:{path:'#{pref.color}.#{pref.ext}',text:'fork:#{name}'}}
    ]
  },

  sad: {
    res: { base: 'base01',gen: 'gen01' },
    steps: [
      {name:'error',msg:'bye!'}
    ]
  }

}



vows.describe('module').addBatch({
  'happy': {
    topic: function() { new appgen.AppGen({spec:spec.happy,verbose:2}).exec(this.callback) },
    'exec': function( err ) { assert.ok(!err) }      
  },

  'sad': {
    topic: function() { 
      var cb = this.callback; new appgen.AppGen({spec:spec.sad,verbose:2}).exec(function(err){cb(null,{err:err})}) 
    },
    'exec': function( ignore, out ) { assert.equal(out.err.message,'bye!'); console.log(out.err.ctxt.genlog.toString()) }      
  },

}).export(module)

