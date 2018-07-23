# @isomorphic-git/cors-proxy

This is the software running on https://cors.isomorphic-git.org/ -
a free service (generously sponsored by [Clever Cloud](https://www.clever-cloud.com/?utm_source=ref&utm_medium=link&utm_campaign=isomorphic-git))
for users of [isomorphic-git](https://isomorphic-git.org) that enables cloning and pushing repos in the browser.

It is derived from https://github.com/wmhilton/cors-buster with added restrictions to reduce the opportunity to abuse the proxy.
Namely, it blocks requests that don't look like valid git requests.

## Installation

```sh
npm install @isomorphic-git/cors-proxy
```

## Configuration

Environment variables:
- `PORT` the port to listen to
- `ALLOW_ORIGIN` the value for the 'Access-Control-Allow-Origin' CORS header


## License

This work is released under [The MIT License](https://opensource.org/licenses/MIT)
