# Build stage

FROM node:22-slim AS build

WORKDIR /app

COPY . .

ENV NODE_ENV=production

RUN npm run compile

# Serve stage
FROM node:22-slim AS serve

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY package.json .
COPY package-lock.json .

ENV NODE_ENV=production

EXPOSE 3000

RUN npm ci --omit=dev

CMD ["node", "./dist/server.js"]