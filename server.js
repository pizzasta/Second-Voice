const http = require('node:http');
const { createReadStream, existsSync } = require('node:fs');
const { extname, join, normalize } = require('node:path');

const port = process.env.PORT || 4173;
const root = process.cwd();
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

const server = http.createServer((request, response) => {
  const requestedPath = request.url === '/' ? '/index.html' : request.url;
  const filePath = normalize(join(root, requestedPath));

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'text/plain' });
  createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Second Voice is running at http://localhost:${port}`);
});
