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

Kill the daemon process:

```sh
cors-proxy stop
```

### CLI configuration

Environment variables:

- `PORT` the port to listen to (if run with `npm start`)
- `ALLOW_ORIGIN` the value for the 'Access-Control-Allow-Origin' CORS header
- `INSECURE_HTTP_ORIGINS` comma separated list of origins for which HTTP should be used instead of HTTPS (added to make developing against locally running git servers easier)

## Middleware usage

You can also use the `cors-proxy` as a middleware in your own server.

```js
import express from 'express';
import corsProxy from '@isomorphic-git/cors-proxy';

const app = express();
const options = {};

app.use(corsProxy(options));
```

### Middleware configuration

_The middleware doesn't use the environment variables._ The options object supports the following properties:

- `origin`: _string_. The value for the 'Access-Control-Allow-Origin' CORS header
- `insecure_origins`: _string[]_. Array of origins for which HTTP should be used instead of HTTPS (added to make developing against locally running git servers easier)
- `authorization`: _(req, res, next) => void_. A middleware function you can use to handle custom authorization. Is run after filtering for git-like requests and handling CORS but before the request is proxied.

_Example:_

```ts
app.use(
	corsProxy({
		authorization: (req: Request, res: Response, next: NextFunction) => {
			// proxied git HTTP requests already use the Authorization header for git credentials,
			// so their [Company] credentials are inserted in the X-Authorization header instead.
			if (getAuthorizedUser(req, 'X-Authorization')) {
				return next();
			} else {
				return res.status(401).send("Unable to authenticate you with [Company]'s git proxy");
			}
		},
	}),
);

// Only requests with a valid JSON Web Token will be proxied
function getAuthorizedUser(req: Request, header: string = 'Authorization') {
	const Authorization = req.get(header);

	if (Authorization) {
		const token = Authorization.replace('Bearer ', '');
		try {
			const verifiedToken = verify(token, env.APP_SECRET) as IToken;
			if (verifiedToken) {
				return {
					id: verifiedToken.userId,
				};
			}
		} catch (e) {
			// noop
		}
	}
}
```

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
