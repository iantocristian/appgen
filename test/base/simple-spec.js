module.exports = {
  conf: { title:'Generic' },
  steps: [
    { name:'fork', forks: [ 
      { name:'ios',     conf: { title:'iOS' }}, 
      { name:'android', conf: { title:'Android' }} 
    ] },
    { name:'import',   path:'${name}.css' },
    { name:'template', path:'index.html' }
  ]
}


