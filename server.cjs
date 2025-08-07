const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Handle URL decoding for filenames with spaces
  let filePath = decodeURIComponent(req.url === '/' ? '/agrinota-guardian.html' : req.url);
  filePath = path.join(__dirname, filePath);
  
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css', 
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.glb': 'model/gltf-binary',
    '.stl': 'application/octet-stream',  // Proper STL MIME type
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
  };
  
  console.log('Requested:', req.url, '-> File:', filePath);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('File not found:', filePath);
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    const contentType = contentTypes[ext] || 'text/plain';
    console.log('Serving:', filePath, 'as', contentType);
    
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(data);
  });
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Server running at http://127.0.0.1:3000');
  console.log('Main page: http://127.0.0.1:3000/agrinota-guardian.html');
  console.log('Minimal test: http://127.0.0.1:3000/agrinota-guardian-minimal.html');
  console.log('Demo page: http://127.0.0.1:3000/demo.html');
});