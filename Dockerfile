FROM node:22-slim
LABEL maintainer="William Hilton <wmhilton@gmail.com>"
WORKDIR /srv
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
RUN chown -R node:node /srv
USER node
EXPOSE 80
ENV PORT=80
CMD [ "sh", "-c", "exec node bin.js run --port=${PORT:-80}" ]

