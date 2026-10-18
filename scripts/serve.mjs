import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const root = resolve('dist');
const mimeTypes = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' };

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relativePath = pathname === '/' ? 'index.html' : pathname.endsWith('/') ? `${pathname.slice(1)}index.html` : pathname.slice(1);
  const target = resolve(root, relativePath);
  if (!target.startsWith(root)) { response.writeHead(403); response.end('Forbidden'); return; }
  try {
    response.setHeader('Content-Type', mimeTypes[extname(target)] ?? 'application/octet-stream');
    response.end(await readFile(target));
  } catch {
    response.writeHead(404); response.end('Not found');
  }
}).listen(4173, () => console.log('http://127.0.0.1:4173'));
