import { readFileSync } from 'fs';
import { join } from 'path';
import { Writable } from 'stream';

const origin = process.env.ALLOW_ORIGIN || '*';
const insecure_origins = (process.env.INSECURE_HTTP_ORIGINS || '').split(',');

const allowHeaders = [
  'accept-encoding',
  'accept-language',
  'accept',
  'access-control-allow-origin',
  'authorization',
  'cache-control',
  'connection',
  'content-length',
  'content-type',
  'dnt',
  'git-protocol',
  'pragma',
  'range',
  'referer',
  'user-agent',
  'x-authorization',
  'x-http-method-override',
  'x-requested-with',
];

const exposeHeaders = [
  'accept-ranges',
  'age',
  'cache-control',
  'content-length',
  'content-language',
  'content-type',
  'date',
  'etag',
  'expires',
  'last-modified',
  'location',
  'pragma',
  'server',
  'transfer-encoding',
  'vary',
  'x-github-request-id',
  'x-redirected-url',
];
const allowMethods = ['POST', 'GET', 'OPTIONS'];

const maxAge = 60 * 60 * 24; // 24 hours
const allowCredentials = false;

const landingPage = readFileSync(join(import.meta.dirname, 'index.html'), 'utf8').replaceAll(
  '%allowed_origins%',
  origin,
);

/**
 *
 * @param {import('http').IncomingMessage} req
 * @param {URL} u
 */
function isAllowed(req, u) {
  const isInfoRefs =
    u.pathname.endsWith('/info/refs') &&
    (u.searchParams.get('service') === 'git-upload-pack' || u.searchParams.get('service') === 'git-receive-pack');

  switch (req.method) {
    case 'OPTIONS':
      if (isInfoRefs) return true;
      if (!req.headers['access-control-request-headers'].includes('content-type')) return false;
      return u.pathname.endsWith('git-upload-pack') || u.pathname.endsWith('git-receive-pack');
    case 'POST':
      return (
        // pull
        (req.headers['content-type'] === 'application/x-git-upload-pack-request' &&
          u.pathname.endsWith('git-upload-pack')) ||
        // push
        (req.headers['content-type'] === 'application/x-git-receive-pack-request' &&
          u.pathname.endsWith('git-receive-pack'))
      );
    case 'GET':
      return isInfoRefs;
    default:
      return false;
  }
}

/**
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {(() => any)?} next
 * @returns
 */
export default function handleRequest(req, res, next) {
  const u = new URL(req.url, `https://0.0.0.0:${req.socket.localPort}/`);
  const isMiddleware = typeof next === 'function';

  // CORS

  res.setHeader('Access-Control-Allow-Origin', origin);
  if (allowCredentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (exposeHeaders.length) {
    res.setHeader('Access-Control-Expose-Headers', exposeHeaders.join(','));
  }

  const preFlight = req.method === 'OPTIONS';
  if (preFlight) {
    res.setHeader('Access-Control-Allow-Methods', allowMethods.join(','));
    res.setHeader('Access-Control-Allow-Headers', allowHeaders.join(','));
    res.setHeader('Access-Control-Max-Age', String(maxAge));
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Default landing page
  if (u.pathname === '/') {
    if (isMiddleware) return next();
    res.setHeader('content-type', 'text/html');
    res.statusCode = 400;
    res.end(landingPage);
    return;
  }

  if (!isAllowed(req, u)) {
    if (isMiddleware) return next();
    res.statusCode = 403;
    res.end();
    return;
  }

  if (process.env.DEBUG) console.log(req.method, req.url);

  const headers = {};
  for (let h of allowHeaders) {
    if (req.headers[h]) {
      headers[h] = req.headers[h];
    }
  }

  // GitHub uses user-agent sniffing for git/* and changes its behavior which is frustrating
  if (!headers['user-agent']?.startsWith('git/')) {
    headers['user-agent'] = 'git/@isomorphic-git/cors-proxy';
  }

  let [, pathdomain, remainingpath] = u.pathname.match(/\/([^\/]*)\/(.*)/);
  const protocol = insecure_origins.includes(pathdomain) ? 'http' : 'https';

  fetch(`${protocol}://${pathdomain}/${remainingpath}${u.search}`, {
    method: req.method,
    redirect: 'manual',
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
    duplex: 'half',
  })
    .then((f) => {
      if (f.headers.has('location')) {
        // Modify the location so the client continues to use the proxy
        let newUrl = f.headers.get('location').replace(/^https?:\//, '');
        f.headers.set('location', newUrl);
      }
      res.statusCode = f.status;
      for (let h of exposeHeaders) {
        if (h === 'content-length') continue;
        if (f.headers.has(h)) {
          res.setHeader(h, f.headers.get(h));
        }
      }
      if (f.redirected) {
        res.setHeader('x-redirected-url', f.url);
      }
      return f.body.pipeTo(Writable.toWeb(res));
    })
    .catch((e) => {
      console.error(e);
      if (isMiddleware) return next();
      res.statusCode = 502;
      res.end();
    });
}
