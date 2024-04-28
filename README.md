# Star Cats

A 2D Starship game to learn about WebSockets, HTML Canvas API, and keep math skills fresh.

It's comprised of a NodeJS backend and a Vanilla JavaScript frontend that uses HTML Canvas API's to render the game. Socket IO is used for the WebSocket interface.

## Requirements

- Node 16
- Yarn 1

## Setup

1. Clone this repo.
2. Run `yarn`
3. Create .env file at root of the repo with the contents

```.env
PORT=3000
HOST=localhost
PROTOCOL=http
```

## Development

In your terminal, run the following to build and run the server (on port 3000):

```zsh
yarn build-server && yarn start
```

In another terminal, run the following to run a dev server for the frontend (on port 8080):

```zsh
yarn dev-ui
```
