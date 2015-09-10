var server = require('./server');
server.start({
  webHost: process.argv[4] || '0.0.0.0',
  webPort: process.argv[3] || 9090,
  debugPort: process.argv[2] || 9958
});
