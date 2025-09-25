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

## CLI usage

Start proxy on default port 9999:

```sh
cors-proxy run
```

Start proxy on a custom port:

```sh
cors-proxy run -p 9889
```

Start proxy in daemon mode.

```sh
cors-proxy start
```

Kill the process with the PID specified in `$PWD/cors-proxy.pid`:

```sh
cors-proxy stop
```

### CLI configuration

Environment variables:
- `PORT` the port to listen to (if run with `npm start`)
- `ALLOW_ORIGIN` the value for the 'Access-Control-Allow-Origin' CORS header
- `INSECURE_HTTP_ORIGINS` comma separated list of origins for which HTTP should be used instead of HTTPS (added to make developing against locally running git servers easier)

## Installation on Kubernetes

There is no official chart for this project, helm or otherwise. You can make your own, but keep in mind cors-proxy uses the Micro server, which will return a 403 error for any requests that do not have the user agent header.

_Example:_
```yaml
  containers:
      - name: cors-proxy
        image: node:lts-alpine
        env:
        - name: ALLOW_ORIGIN
          value: https://mydomain.com
        command:
        - npx
        args:
        - '@isomorphic-git/cors-proxy'
        - start
        ports:
        - containerPort: 9999
          hostPort: 9999
          name: proxy
          protocol: TCP
        livenessProbe:
          tcpSocket:
            port: proxy
        readinessProbe:
          tcpSocket:
            port: proxy
```

## License

This work is released under [The MIT License](https://opensource.org/licenses/MIT)
