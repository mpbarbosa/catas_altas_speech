// Zero-dependency static file server for the Playwright e2e suite.
//
// Serves the repository root so that /examples/*.html and /dist/esm/*.js
// resolve exactly as they do in production (manual-test.html imports
// ../dist/esm/index.js as a relative ES module). We deliberately avoid
// `python3 -m http.server` here so the same command runs unchanged inside the
// official Playwright Docker image, which ships Node but not necessarily Python.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Repo root, without a trailing separator so the traversal guard below can do
// a clean `startsWith(ROOT + sep)` check.
const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/[/\\]$/, '');
const PORT = Number(process.env.PORT) || 8099;

// Correct MIME types matter: browsers refuse to evaluate an ES module that is
// not served as a JavaScript type.
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    let relative = decodeURIComponent(pathname);
    if (relative.endsWith('/')) relative += 'index.html';

    const filePath = normalize(join(ROOT, relative));
    // Reject path traversal outside the served root.
    if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      'content-type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`static server serving ${ROOT} on http://localhost:${PORT}`);
});
