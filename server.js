var http = require('http')
  , server = http.createServer()
  , dish = require('dish');

var format = require('url').format
  , parse = require('url').parse
  , exists = require('fs').exists
  , resolve = require('path').resolve;

var port = process.argv[3] || 9090;
var babel = process.argv[5] || '5';

function handler (req, res) {
  var url, plate;
  try {
    url = parse(req.url, true);
    plate = resolve(__dirname, './frontend' + format(url.pathname));
  }
  catch (e) {
    res.writeHead(500);
    res.end();
    return;
  }
  if (req.url === '/') {
    res.statusCode = '302';
    var hostname = ( req.headers.host.match(/:/g) ) ? req.headers.host.slice( 0, req.headers.host.indexOf(":") ) : req.headers.host
    res.setHeader('Location', 'inspector.html?host=' + hostname + ':'+process.argv[2]+'&page=0'+((babel!=='5')?('&babel='+babel):''));
    res.end();
  }
  else {
    exists(plate, function (found) {
      if (found) {
        dish.file(plate)(req, res);
      }
      else {
        res.writeHead(404);
        res.end();
      }
    });
  }
}

server.on('request', handler);

server.listen(port, process.argv[4] || '0.0.0.0',function () {
  console.log('console front-end listening on port %s', port);
});


