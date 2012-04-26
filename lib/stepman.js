
var common = require('./common')



function StepMan() {
  var self = {}


  self.steps = []
  self.stepI = 0

  self.conds = []
  self.condI = 0


  self.step = function() {
    var step = null
    if( stepI < steps.length ) {
      step = self.steps[self.stepI]
    }
    return step
  }


  self.cond = function() {
    var cond = null
    if( condI < conds.length ) {
      cond = self.conds[self.condI]
    }
    return cond
  }


  self.addcond = function( cond ) {
    if( cond ) {
      self.conds.push( cond )
    }
  }



  self.api = {
    addcond: common.delegate(self,self.addcond),
  }

 
  return self
}


exports.StepMan = StepMan

