global.require = require;

var web_console = require('./');  

var frontend_port = 9090;
var agent_port = 9999;
var listen_address = '0.0.0.0';

web_console.start(frontend_port,agent_port,listen_address);
