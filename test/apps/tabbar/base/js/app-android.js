
app.platform = 'android'

app.boot_platform = function() {
  $('li span.ui-icon').css({'margin-top':-4})
}

app.init_platform = function() {
  bb.view.Content = bb.view.Content.extend({
    updatescroller: function() {
      var self = this
    }
  })
}

app.start_platform = function() {}
