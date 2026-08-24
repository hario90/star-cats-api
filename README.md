# Star Cats

A 2D Starship game to learn about WebSockets, HTML Canvas API, and keep math skills fresh.

It's comprised of a NodeJS backend and a Vanilla JavaScript frontend that uses HTML Canvas API's to render the game. Socket IO is used for the WebSocket interface.

## Requirements

- Node 22

## Setup

1. Clone this repo.
2. Run `npm i`
3. Create .env file at root of the repo with the contents

```.env
PORT=3000
HOST=localhost
PROTOCOL=http
```

## Development

In development, you can run the app and server on separate ports.
In your terminal, run the following to build and run the server (on port 3000):

```zsh
npm run build-server && npm run start
```

In another terminal, run the following to run a dev server for the frontend (on port 8080):

```zsh
npm run dev-ui
```

### Docker

To simulate running this in prod, run the server and app in one container.

```zsh
docker build -t star-cats-api:latest .
docker run -p 3000:3000 --rm star-cats-api
```