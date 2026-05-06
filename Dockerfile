FROM node:22-slim
LABEL maintainer="William Hilton <wmhilton@gmail.com>"
WORKDIR /srv
COPY package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 80
ENV PORT=80
CMD [ "node", "bin.js", "run", "--port=80" ]

