FROM node:12-alpine
LABEL maintainer "William Hilton <wmhilton@gmail.com>"
WORKDIR /srv
COPY . .
RUN npm ci
EXPOSE 80
ENV PORT=80
CMD [ "npm", "start" ]

