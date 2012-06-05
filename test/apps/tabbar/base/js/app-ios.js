
app.platform = 'ios'


app.boot_platform = function() {
  document.ontouchmove = function(e){ e.preventDefault(); }
}


app.init_platform = function() {
  bb.view.Content = bb.view.Content.extend({
    updatescroller: function() {
      var self = this

      if( !self.scrollers[self.current] ) {
        self.scrollers[self.current] = new iScroll("content_"+self.current)      

        var content = $("#content_"+self.current)
        content.height( app.scrollheight ) 

        setTimeout( function() {
          self.scrollers[self.current].refresh()
        },300 )
      }
    }
  })
}


app.start_platform = function() {}