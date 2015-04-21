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
    var newUrl = this.address();
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
    this.send(message);
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
  this._config = extend({}, options);
  this._isHTTPS = this._config.sslKey && this._config.sslCert ? true : false;

  var app = express();
  var httpServer;

  if (this._isHTTPS) {
    httpServer = https.createServer({
      key: fs.readFileSync(this._config.sslKey, {encoding: 'utf8'}),
      cert: fs.readFileSync(this._config.sslCert, {encoding: 'utf8'})
    }, app);
  } else {
    httpServer = http.createServer(app);
  }

  this._httpServer = httpServer;

  app.use(favicon(path.join(__dirname, './front-end-node/Images/favicon.png')));
  app.get('/', (function(req,res){
    res.redirect(this.address().url);
  }).bind(this));
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
  httpServer.listen(this._config.webPort, this._config.webHost);
};

DebugServer.prototype._getDebuggerPort = function(url) {
  return parseInt((/[\?\&]port=(\d+)/.exec(url) || [null, this._config.debugPort])[1], 10);
};

DebugServer.prototype.close = function() {
  if (this.wsServer) {
    this.wsServer.close();
    this.emit('close');
  }
};

DebugServer.prototype.address = function() {
  var address = this._httpServer.address();
  var config = this._config;
  address.url = buildUrl(config.webHost, address.port, config.debugPort, null, this._isHTTPS,config.babel);
  return address;
};

exports = new DebugServer();

exports.start({
  webHost: process.argv[4] || '0.0.0.0',
  webPort: process.argv[3] || 9090,
  debugPort: process.argv[2] || 9958,
  babel: process.argv[5] || '5'
});
