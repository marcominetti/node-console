var agent_port = 9958;
var listen_address = '0.0.0.0';

// loading ECMAScript 6/7 polyfill if required (you need to manually install it)
require('babel-core/polyfill');

console_agent = require('./agent.js');
console_agent.start(agent_port||9958, listen_address||'0.0.0.0');
