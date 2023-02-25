# Star cats game

A multiplayer star ship game written with pure JS, HTML, and socketjs. Shoot asteroids and collect gems stored inside to get points. Shoot other star ships to knock them out of the game! There aren't any cats yet but maybe someday there will be.

## How to run locally
This codebase contains both the frontend and backend code. You'll need Node 14 up to Node 16. (There is a webpacket issue related to the OpenSSL upgrade in Node 17.) The backend uses NodeJS and must be run before running the frontend. Use the following command to build and start the backend server:

```zsh
yarn build-server && yarn start
```

In another terminal, use the following to run the frontend in develop mode (hot reload frontend scripts and assets):

```zsh
yarn dev-ui
```
