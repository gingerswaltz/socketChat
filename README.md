# socketChat: Real-Time Mobile Chat with Rooms

A chat app with chat rooms and message history: a Node.js server with Socket.IO and MongoDB, and a React Native (Expo) mobile client.

> Personal project, May 2024. The server previously ran on my own Linux server; it is no longer online.

## Features

- Join a room with a nickname; other users get join and leave notifications
- Real-time messages inside a room
- Message history stored in MongoDB and loaded when a user joins
- Room list loaded from the database, with room search
- List of users in the current room
- Error dialogs and logout through the device's native back button
- Server logging with winston

## Tech stack

**Server:** Node.js · Express · Socket.IO · MongoDB (Mongoose) · winston
**Client:** React Native · Expo · socket.io-client

## Project structure

```
socket-server/   index.js (Socket.IO events), users.js (room membership), route.js, utils.js
socket-client/   App.js, screens/Main.js (join form), screens/Chat.js (chat screen)
```

## Socket events

| Event | Direction | Purpose |
| --- | --- | --- |
| `join` | client → server | Join a room with a nickname |
| `sendMessage` | client → server | Send a message to the room |
| `listRoom` | client → server | Get the list of rooms |
| `leftRoom` | client → server | Leave the room |
| `message` | server → client | New message or system notification |
| `messageHistory` | server → client | Earlier messages in the room |
| `room` | server → client | Current users in the room |

## Running locally

```bash
# MongoDB must be running; set its address in socket-server/index.js
cd socket-server && npm install && node index.js
cd socket-client && npm install && npx expo start
```

Set the server address in the client before running. Keep connection strings in environment variables rather than in the code.
