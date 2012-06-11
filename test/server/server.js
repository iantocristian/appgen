
"use strict";

var eyes    = require('eyes')
var express = require('express')
var appgen  = require('../../lib/appgen')

var workfolder = __dirname+'/../'
var spec = {
  res: { base: workfolder+'base01', gen: workfolder+'gen01' },

  conf:{ ext:'txt' },
  
  steps: [
    {name:'fork',opt:{
      forks:[
        {name:'aa',spec:{conf:{color:'red'}}},
        {name:'bb',spec:{conf:{color:'blue'}}}
      ]}},
    { name:'import', path:'README.txt' },
    { name:'save', path:'${conf.color}.${conf.ext}',text:'fork:${name}'}
  ]

}


var ag = new appgen.AppGen({spec:spec,verbose:2})

var app = express.createServer()

app.get('/build', function(req, res){
  console.log('build')
  res.send('build')

  ag.exec({ext:'html'},function(err,out){
    console.log(err)
    console.log(out)
  })
});

app.listen(3333)



