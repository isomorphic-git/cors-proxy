function isPreflightInfoRefs (req, u) {
  return req.method === 'OPTIONS' && u.pathname.endsWith('/info/refs') && (u.query.service === 'git-upload-pack' || u.query.service === 'git-receive-pack')
}

function isInfoRefs (req, u) {
  return req.method === 'GET' && u.pathname.endsWith('/info/refs') && (u.query.service === 'git-upload-pack' || u.query.service === 'git-receive-pack')
}

function isPreflightPull (req, u) {
  return req.method === 'OPTIONS' && req.headers['access-control-request-headers'].includes('content-type') && u.pathname.endsWith('git-upload-pack')
}

function isPull (req, u) {
  return req.method === 'POST' && req.headers['content-type'] === 'application/x-git-upload-pack-request' && u.pathname.endsWith('git-upload-pack')
}

function isPreflightPush (req, u) {
  return req.method === 'OPTIONS' && req.headers['access-control-request-headers'].includes('content-type') && u.pathname.endsWith('git-receive-pack')
}

function isPush (req, u) {
  return req.method === 'POST' && req.headers['content-type'] === 'application/x-git-receive-pack-request' && u.pathname.endsWith('git-receive-pack')
}

module.exports = function allow (req, u) {
  return (
    isPreflightInfoRefs(req, u) ||
    isInfoRefs(req, u) ||
    isPreflightPull(req, u) ||
    isPull(req, u) ||
    isPreflightPush(req, u) ||
    isPush(req, u)
  )
}
