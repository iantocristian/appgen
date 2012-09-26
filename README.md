# appgen - Node.js module


A software development toolkit that lets you generate many different versions of the same app.

If you're using this module, feel free to contact me on twitter if you have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.1.1

Tested on: node 0.8.6


The _appgen_ module is a build tool similar to make or ant, except that
it can produce multiple versions of the same app from a common set of
resources. You can easily handle platform quirks, compatibility
issues, skinning, feature selection by defining variations within a
well-defined build structure.

The _appgen_ module can help you build HTML5 cross-platform apps,
hybrid apps, native apps, or entire services that need to have mobile,
tablet, web, tv or other interfaces.

You can also buils variants of the same app, where you need to reskin
for different clients, or pick and choose features. You can even build
apps on demand.

You still have to provide the app source code, of course, but instead
of tearing your hair out with CSS hacks, platform sniffing _if_
statements, and last minute cut-and-paste desparation, you can get
your code back under control.


# Code Example


Take these as your base files, the templates from which your app is built:

_index.html_:
```html
<html><head>
  <title>${conf.title}</title>
  <link rel="stylesheet" href="${name}.css" />
</head><body>
 Hello <%="World!"%>
</body></html>
```

_ios.css_:
```css
body {
  background-color: blue;
}
```

_android.css_:
```css
body {
  background-color: black;
}
```

And define a build specification to create two versions of your app:
an iOS fork, and an Android fork:


_simple-spec.js_:
```javascript
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
```

This build specification also copies in _ios.css_ or _android.css_
depending on the name of the fork. The _index.html_ file is a template.

Then you can run appgen to generate two versions:

```bash
$ appgen -v simple-spec.js
fork: main: {"title":"Generic"}
fork: main-ios: {"title":"iOS"}
save: {"path":"ios.css"}
save: {"path":"index.html"}
fork: main-android: {"title":"Android"}
save: {"path":"android.css"}
save: {"path":"index.html"}
```

By default the <i>_gen</i> folder contains the output versions, each
in a separate folder. In this case, _main-ios_, and
_main-android_. All these things are configurable.


_appgen_ is language agnostic. While it's perfect for HTML5 apps, it
will also work with any codebase. In fact, the common scenario for
hybrid apps, where your app is mostly HTML-based, but you have a few
platform specific plugins written in Objective-C or Java, is exactly
what _appgen_ is designed for.


## What would you use _appgen_?

   * You need to build lots of similar apps
   * You need to support multiple configurations
   * You need to build cross-platform HTML5 apps
   * You need to let users create pre-defined apps
   * You need a ready-made way to organize your code


## Installation


To install as a development tool:

    npm install -g appgen

And then from the comman line:

    $ appgen path/to/my-spec.js

Or, if you are using it within a service:

    npm install appgen

And in your code:

    var appgen = require('appgen')

    var generator = new appgen.AppGen({spec:{conf:..., steps:...}})
    generator.exec({title:'My Title'}, function(err,log){ ... })


## Key Concepts


### Resources

### Transformation Steps

### Settings and Context

### Forks


## Build Specifications

### Structure

### Formats

### gen Schema

### Build Steps

### Macros

### Writing Your Own Build Steps


## Module API




