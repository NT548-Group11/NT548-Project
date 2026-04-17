FROM node:22-alpine as builder
WORKDIR /app

RUN apk update && apk upgrade --no-cache

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

RUN apk update && apk upgrade --no-cache

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
