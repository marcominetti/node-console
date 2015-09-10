var agent_port = 9958;
var listen_address = '0.0.0.0';

console_agent = require('./agent.js');
console_agent.start(agent_port||9958, listen_address||'0.0.0.0');
