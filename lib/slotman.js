
var common = require('./common')



function SlotMan() {
  var self = {}


  self.slots = {}


  self.fork = function() {
    var fork = new SlotMan()

    // FIX: copy
    fork.slots = self.slots

    return fork
  }


  self.add = function( slot ) {
    self.slots[slot.name] = slot
  }

  self.get = function(name) {
    return self.slots[name]
  }

  self.consume = function(name) {
    var slot = self.slots[name]
    if( slot ) {
      delete self.slots[name]
    }
    return slot
  }

  self.api = {
    add: common.delegate(self,self.add),
    get: common.delegate(self,self.get),
    consume: common.delegate(self,self.consume)
  }
  
 
  return self
}


exports.SlotMan = SlotMan

