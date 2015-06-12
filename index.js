'use strict';

var console_agent = require('./agent'),
  console_server = require('./server');

exports.start = function(frontend_port,agent_port,listen_address,ecmascript_version){
  console_agent.start(agent_port||9958, listen_address||'0.0.0.0');
  console_server.start({
    webHost: listen_address || '0.0.0.0',
    webPort: frontend_port || 9090,
    debugPort: agent_port || 9958,
    babel: ecmascript_version || '5'
  });
};

exports.stop = function(){
  if (console_agent != null){
    console_agent.stop();
  }
  if (console_server != null){
    console_server.stop();
  }
};

exports.agent = console_agent;
exports.server = console_server;