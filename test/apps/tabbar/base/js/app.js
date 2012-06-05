



var i = 0

var app = {
  model: {},
  view: {},
  tabs: {
    one:   { index:i++ },
    two:   { index:i++ },
    three: { index:i++ },
    four:  { index:i++ },
    five:  { index:i++ },
  },
  initialtab: 'one'
}


console.log(app)

var bb = {
  model: {},
  view: {}
}


bb.init = function() {

  bb.model.State = Backbone.Model.extend({    
    defaults: {
      content: 'none'
    },
  })


  bb.view.Navigation = Backbone.View.extend({    
    initialize: function( items ) {
      var self = this
      _.bindAll(self)

      self.elem = {
        header: $("#header"),
        footer: $("#footer")
      }

      self.elem.header.css({zIndex:1000})
      self.elem.footer.css({zIndex:1000})

      function handletab(tabname) {
        return function(){
          app.model.state.set({current:tabname})
        }
      }

      var tabindex = 0
      for( var tabname in app.tabs ) {
        console.log(tabname)
        $("#tab_"+tabname).tap(handletab(tabname))
      }

      app.scrollheight = window.innerHeight - self.elem.header.height() - self.elem.footer.height()
    },

    render: function() {
    }
  })


  bb.view.Content = Backbone.View.extend({    
    initialize: function( initialtab ) {
      var self = this
      _.bindAll(self)

      self.current = initialtab
      self.scrollers = {}

      app.model.state.on('change:current',self.tabchange)

      window.onresize = function() {
        self.render()
      }

      app.model.state.on('scroll-refresh',function(){
        self.render()
      })
    },

    render: function() {
      var self = this

      app.view[self.current] && app.view[self.current].render()

      self.updatescroller()
    },

    tabchange: function() {
      var self = this

      var previous = self.current
      var current = app.model.state.get('current')
      console.log( 'tabchange prev='+previous+' cur='+current)

      $("#content_"+previous).hide().removeClass('leftin').removeClass('rightin')
      $("#content_"+current).show().addClass( app.tabs[previous].index <= app.tabs[current].index ?'leftin':'rightin')
      self.current = current

      self.render()
    }
  })



  bb.view.One = Backbone.View.extend({
    initialize: function() {
      var self = this
      _.bindAll(self)

      self.elem = {
      }
    },
    render: function() {
    }
  })

  bb.view.Two = Backbone.View.extend({
    initialize: function() {
      var self = this
      _.bindAll(self)

      self.elem = {
      }
    },
    render: function() {
    }
  })

  bb.view.Three = Backbone.View.extend({
    initialize: function() {
      var self = this
      _.bindAll(self)

      self.elem = {
      }
    },
    render: function() {
    }
  })

  bb.view.Four = Backbone.View.extend({
    initialize: function() {
      var self = this
      _.bindAll(self)

      self.elem = {
      }
    },
    render: function() {
    }
  })

  bb.view.Five = Backbone.View.extend({
    initialize: function() {
      var self = this
      _.bindAll(self)

      self.elem = {
      }
    },
    render: function() {
    }
  })

}


app.boot = function() {
  $( '#main' ).live( 'pagebeforecreate',function(){
    // as needed
  })
  app.boot_platform()
}


app.start = function() {
  $("#tab_"+app.initialtab).tap()
}

app.erroralert = function( error ) {
  alert(error)
}


app.init = function() {
  console.log('start init')

  bb.init()
  app.init_platform()

  app.model.state = new bb.model.State()

  app.view.navigation = new bb.view.Navigation(app.initialtab)
  app.view.navigation.render()

  app.view.content = new bb.view.Content(app.initialtab)
  app.view.content.render()

  app.view.one   = new bb.view.One()
  app.view.two   = new bb.view.Two()
  app.view.three = new bb.view.Three()
  app.view.four  = new bb.view.Four()
  app.view.five  = new bb.view.Five()


  app.start_platform()
  app.start()


  console.log('end init')
}


$(app.init)
