'use strict';

var console_agent, console_server;

exports.start = function(frontend_port,agent_port,listen_address,ecmascript_version){
  console_agent = require(__dirname + '/agent.js');
  console_agent.start(agent_port||9999, listen_address||'0.0.0.0');

  console_server = require('child_process').spawn('node', [__dirname + '/server.js', agent_port||9999, frontend_port||9090, listen_address||'0.0.0.0', ecmascript_version||'5']);
};

exports.stop = function(){
  if (console_agent != null){
    console_agent.stop();
  }
  if (console_server != null){
    console_server.kill();
  }
};
