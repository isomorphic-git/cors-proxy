'use strict'
const url = require('url')
const pkg = require('./package.json')
const {send} = require('micro')
const origin = process.env.ALLOW_ORIGIN
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
  'pragma',
  'range',
  'referer',
  'user-agent',
  'x-http-method-override',
  'x-requested-with',
]
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
  'pragma',
  'server',
  'transfer-encoding',
  'vary',
  'x-github-request-id',
]
const allowMethods = [
  'POST',
  'GET',
  'OPTIONS'
]
const fetch = require('node-fetch')
const cors = require('./micro-cors.js')({
  allowHeaders,
  exposeHeaders,
  allowMethods,
  origin
})
const allow = require('./allow-request.js')

async function service (req, res) {
  let u = url.parse(req.url, true)

  if (u.pathname === '/') {
    res.setHeader('content-type', 'text/html')
    let html = `<!DOCTYPE html>
    <html>
      <title>@isomorphic-git/cors-proxy</title>
      <h1>@isomorphic-git/cors-proxy</h1>
      <p>This is the server software that runs on <a href="https://cors.isomorphic-git.org">https://cors.isomorphic-git.org</a>
         &ndash; a free service (generously sponsored by <a href="https://www.clever-cloud.com/?utm_source=ref&utm_medium=link&utm_campaign=isomorphic-git">Clever Cloud</a>)
         for users of <a href="https://isomorphic-git.org">isomorphic-git</a> that enables cloning and pushing repos in the browser.</p>
      <p>The source code is hosted on Github at <a href="https://github.com/isomorphic-git/cors-proxy">https://github.com/isomorphic-git/cors-proxy</a></p>
      <p>It can also be installed from npm with <code>npm install <a href="https://npmjs.org/package/${pkg.name}">@isomorphic-git/cors-proxy</a></code></p>

      <h2>Terms of Use</h2>
      <p><b>This free service is provided to you AS IS with no guarantees.
      By using this free service, you promise not to use excessive amounts of bandwidth.
      </b></p>

      <p><b>If you are cloning or pushing large amounts of data your IP address may be banned.
      Please run your own instance of the software if you need to make heavy use this service.</b></p>

      <h2>Allowed Origins</h2>
      This proxy allows git clone / fetch / push / getRemoteInfo requests from these domains: <code>${process.env.ALLOW_ORIGIN || '*'}</code>
    </html>
    `
    return send(res, 400, html)
  }

  if (!allow(req, u)) {
    // Don't waste my precious bandwidth
    return send(res, 403, '')
  }

  let headers = {}
  for (let h of allowHeaders) {
    if (req.headers[h]) {
      headers[h] = req.headers[h]
    }
  }

  let p = u.path
  let parts = p.match(/\/([^\/]*)\/(.*)/)
  let pathdomain = parts[1]
  let remainingpath = parts[2]
  console.log(`https://${pathdomain}/${remainingpath}`)
  let f = await fetch(
    `https://${pathdomain}/${remainingpath}`,
    {
      method: req.method,
      headers,
      body: (req.method !== 'GET' && req.method !== 'HEAD') ? req : undefined
    }
  )
  res.statusCode = f.status
  for (let h of exposeHeaders) {
    if (h === 'content-length') continue
    if (f.headers.has(h)) {
      res.setHeader(h, f.headers.get(h))
    }
  }
  f.body.pipe(res)
}

module.exports = cors(service)