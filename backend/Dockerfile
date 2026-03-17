FROM node:18-alpine

WORKDIR /app
COPY package.json package-lock.json ./ 
RUN npm ci --omit=dev
COPY --chown=node:node . .

USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
