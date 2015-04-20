# Node Web Console (based on Webkit Agent and Blink Tools)

## Screenshot

![Screenshot](https://raw.githubusercontent.com/marcominetti/node-console/master/screenshot.png)  

## Fork

This node module is based on [node-webkit-agent](https://github.com/c4milo/node-webkit-agent) from Camilo Aguilar and WebKit Development Tools.
The front-end code is slightly modified to provide only remote "Console" feature with:  
* multiple front-ends connections  
* node-to-frontend logging  
* auto re-attach support on node process restart  
* programmatically define custom ports to avoid conflicts  

_The agent must be loaded inside the node process you want to control. If you pause runtime through breakpoints and debugger, the console will not work (use the inspector one)._



## Experimental
The console from 0.3.5 supports ECMAScript 6 and 7 through [babel.js](https://github.com/babel/babel) project.



## Example
```javascript  
var web_console = require('node-console');  

var frontend_port = 9090;
var agent_port = 9999;
var listen_address = '0.0.0.0';
var ecmascript_version = 7;      // supports values: 5,6,7 (through babel.js)

// loading ECMAScript 6/7 polyfill if required (you need to manually install it)
if (ecmascript_version > 5) {
  require('babel/polyfill');
}

web_console.start(frontend_port,agent_port,listen_address,ecmascript_version); 

[...]  

web_console.stop();  
```


## License
(The MIT License)

Copyright 2014-2015 Marco Minetti. All rights reserved.  
Copyright 2014 Camilo Aguilar. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
