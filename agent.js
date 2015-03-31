var agents = require('./lib');
var WebSocketServer = require('ws').Server;

var self = {};
self.loadedAgents = {};
self.server = null;
self.frontends = [];

self.onFrontendConnection = function(socket) {
  self.frontends.push(socket);
  socket.on('message', self.onFrontendMessage.bind(socket));
  socket.on('close', (function(){
    for(var i =0; i<self.frontends.length;i++){
      if (self.frontends[i] === socket){
        self.frontends.splice(i,1);
      }
    }
  }).bind(socket));
  socket.on('error', function(error) {
    console.error(error);
  });
};

self.onFrontendMessage = function(message) {
  var socket = this;
  try {
    data = JSON.parse(message);
  } catch(e) {
    console.error(e.stack);
    return;
  }

  var id = data.id;
  var command = data.method.split('.');
  var domain = self.loadedAgents[command[0]];
  var method = command[1];
  var params = data.params;

  if (!domain || !domain[method]) {
    //console.warn('%s is not implemented', data.method);
    return;
  }

  domain[method](params, function(result) {
    var response = {
      id: id,
      result: result
    };

    socket.send(JSON.stringify(response));
  });
};

self.notify = function(notification) {
  self.frontends.forEach(function(socket){socket.send(JSON.stringify(notification))});
};

self.loadAgents = function() {
  var runtimeAgent = new agents.Runtime(self.notify);

  for (var agent in agents) {
    if (typeof agents[agent] == 'function' && agent != 'Runtime') {
      self.loadedAgents[agent] = new agents[agent](self.notify, runtimeAgent);
    }
  }
  self.loadedAgents.Runtime = runtimeAgent;
};

module.exports = {
  'start': function(port,host) {
    self.port = port || 9958;
    self.host = host || '0.0.0.0';

    if (self.server) return;

    self.server = new WebSocketServer({
      port: self.port,
      host: self.host
    });

    self.server.on('listening', function() {
      self.loadAgents();
    });
    self.server.on('connection', self.onFrontendConnection);
  },
  'stop': function() {
    frontends.forEach(function(socket){
      socket.close();
    });

    if (server) {
      server.close();
      server = null;
    }
  }
}






