# Build stage

FROM node:16-slim AS build

WORKDIR /app

COPY . .

ENV NODE_ENV=production

RUN npm run compile

# Serve stage
FROM node:16-slim AS serve

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY package.json .

ENV NODE_ENV=production

EXPOSE 3000

RUN npm i

CMD ["node", "./dist/server.js"]