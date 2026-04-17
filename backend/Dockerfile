FROM node:22-alpine

WORKDIR /app

RUN apk update && apk upgrade --no-cache

COPY package.json package-lock.json ./ 
RUN npm ci --omit=dev
COPY --chown=node:node . .

USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
