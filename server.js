var http = require('http'),
    https = require('https'),
    EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits,
    extend = require('util')._extend,
    fs = require('fs'),
    path = require('path'),
    express = require('express'),
    favicon = require('serve-favicon'),
    WebSocket = require('ws'),
    WebSocketServer = require('ws').Server,
    url = require('url');
    OVERRIDES = path.join(__dirname, './front-end-node'),
    WEBROOT = path.join(__dirname, './front-end');
   
function buildUrl(inspectorHost, inspectorPort, debugPort, fileToShow, isHttps, babel) {
  var host = inspectorHost == '0.0.0.0' ? '127.0.0.1' : inspectorHost;
  var parts = {
    protocol: isHttps ? 'https' : 'http',
    hostname: host,
    port: inspectorPort,
    pathname: '/debug',
    search: '?ws=' + host + ':' + inspectorPort + '&babel=' + babel + '&port=' + debugPort
  };

  return url.format(parts);
}

function debugAction(req, res) {
  if (!req.query.ws) {
    var urlParts = req.headers.host.split(':'),
      config = this.config;

    var newUrl = buildUrl(urlParts[0], urlParts[1], config.debugPort, null, this.isHTTPS, config.babel);
    return res.redirect(newUrl);
  }
  res.sendFile(path.join(WEBROOT, 'inspector.html'));
}

var frontends = [];

var handleFrontendConnection = function (socket) {
  socket._socket.pause();
  var debugPort = this._getDebuggerPort(socket.upgradeReq.url);
  socket.backend = new WebSocket('ws://localhost:' + debugPort);
  socket.backend.on('open', handleBackendOpen.bind(socket));
  socket.backend.on('message', handleBackendMessage.bind(socket));
  socket.backend.on('error', function(){
    socket.close();
  });
  socket.backend.on('close', function(){
    socket.close();
  });
  socket.on('message', handleFrontendMessage.bind(socket));
  socket.on('error', function(){
    socket.close();
  });
  socket.on('close', function(){
    for(var i =0; i<frontends.length;i++){
      if (frontends[i] === socket){
        socket.backend.close();
        frontends.splice(i,1);
      }
    }
  });
  frontends.push(socket);
}

var handleFrontendMessage = function (message) {
    var data;
    try {
        data = JSON.parse(message);
    } catch(e) {
        console.log(e.stack);
    }
    var command = data.method.split('.');
    var domainName = command[0];

    if (domainName !== 'Debugger') {
        this.backend.send(message);
        return;
    }

    var id = data.id;
    var method = command[1];
    var params = data.params;
};

var handleBackendOpen = function(){
  this._socket.resume();
};

var handleBackendMessage = function(message) {
  try {
    this.send(message);
  } catch(err) {}
};

function handleServerListening() {
  this.emit('listening');
}

function handleServerError(err) {
  if (err._handledByInspector) return;
  err._handledByInspector = true;
  this.emit('error', err);
}

function DebugServer() {}

inherits(DebugServer, EventEmitter);

DebugServer.prototype.start = function(options) {
  this.config = extend({}, options);
  this.isHTTPS = this.config.sslKey && this.config.sslCert ? true : false;

  var app = express();
  var httpServer;

  if (this.isHTTPS) {
    httpServer = https.createServer({
      key: fs.readFileSync(this.config.sslKey, {encoding: 'utf8'}),
      cert: fs.readFileSync(this.config.sslCert, {encoding: 'utf8'})
    }, app);
  } else {
    httpServer = http.createServer(app);
  }

  this.httpServer = httpServer;

  app.use(favicon(path.join(__dirname, './front-end-node/Images/favicon.png')));
  app.get('/', debugAction.bind(this));
  app.get('/debug', debugAction.bind(this));
  app.use('/node', express.static(OVERRIDES));
  app.use(express.static(WEBROOT));

  this.wsServer = new WebSocketServer({
    server: httpServer
  });
  this.wsServer.on('connection', handleFrontendConnection.bind(this));
  this.wsServer.on('error', handleServerError.bind(this));

  httpServer.on('listening', handleServerListening.bind(this));
  httpServer.on('error', handleServerError.bind(this));
  httpServer.listen(this.config.webPort, this.config.webHost);
};

DebugServer.prototype._getDebuggerPort = function(url) {
  return parseInt((/[\?\&]port=(\d+)/.exec(url) || [null, this.config.debugPort])[1], 10);
};

DebugServer.prototype.stop = function() {
  if (this.httpServer) {
    this.httpServer.close();
    this.httpServer = null;
  }
  if (this.wsServer) {
    this.wsServer.close();
    this.emit('close');
    this.wsServer = null;
  }
};

DebugServer.prototype.address = function() {
  var address = this.httpServer.address();
  var config = this.config;
  address.url = buildUrl(config.webHost, address.port, config.debugPort, null, this.isHTTPS, config.babel);
  return address;
};

module.exports = new DebugServer();
