#!/usr/bin/env node
// A ~30-line static file server for the `vite build` output — used only in the Docker image
// (quant-fusion-ui/Dockerfile). `vite preview` would also work, but keeping vite (and its
// whole dev toolchain) out of the runtime image means a plain `node:http` server here instead,
// no new runtime dependency.
import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const DIST_DIR = path.join(import.meta.dirname, 'dist');
const PORT = Number(process.env.PORT ?? 5420);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const requestedPath = path.normalize(decodeURIComponent((req.url ?? '/').split('?')[0]));
  const candidate = path.join(DIST_DIR, requestedPath);
  // `index.html` for any path Vite didn't emit a real file for (client-side routes, or `/`) —
  // never for a path that escaped DIST_DIR (path.normalize above already collapses `..`, this is
  // a second, explicit guard against serving anything outside the built assets).
  const filePath =
    candidate.startsWith(DIST_DIR) && existsSync(candidate) && statSync(candidate).isFile()
      ? candidate
      : path.join(DIST_DIR, 'index.html');

  res.setHeader(
    'Content-Type',
    CONTENT_TYPES[path.extname(filePath)] ?? 'application/octet-stream',
  );
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`quant-fusion-ui serving ${DIST_DIR} on http://localhost:${String(PORT)}`);
});
