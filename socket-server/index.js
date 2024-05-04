const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const winston = require("winston");

const app = express();
const route = require("./route");
const {
  addUser,
  findUser,
  getRoomUsers,
  removeUser,
  getActiveRooms,
} = require("./users");

app.use(cors({ origin: "*" }));
app.use(route);

// Настройка логгера
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "server.log" }),
  ],
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }) => {
    socket.join(room);

    const { user, isExist } = addUser({ name, room });

    const userMessage = isExist
      ? `${user.name}, here you go again`
      : `Hey my love ${user.name}`;

    socket.emit("message", {
      data: { user: { name: "Admin" }, message: userMessage },
    });

    socket.broadcast.to(user.room).emit("message", {
      data: { user: { name: "Admin" }, message: `${user.name} has joined` },
    });

    io.to(user.room).emit("room", {
      data: { users: getRoomUsers(user.room) },
    });

    // Логгирование события подключения нового пользователя
    logger.info(`${user.name} has joined room ${user.room}`);
  });

  socket.on("sendMessage", ({ message, params }) => {
    const user = findUser(params);

    if (user) {
      io.to(user.room).emit("message", { data: { user, message } });

      // Логгирование отправки сообщения
      logger.info(`Message sent by ${user.name}: ${message}`);
    }
  });

  socket.on("listRoom", () => {
    const rooms = getActiveRooms();

    if (rooms.length > 0) {
      // Отправляем список комнат только пользователю, отправившему запрос
      socket.emit("message", { data: { rooms } });

      // Логгирование отправки сообщения
      logger.info(`Rooms list: ${JSON.stringify(rooms)}`);
    }
  });

  socket.on("leftRoom", ({ params }) => {
    const user = removeUser(params);

    if (user) {
      const { room, name } = user;

      io.to(room).emit("message", {
        data: { user: { name: "Admin" }, message: `${name} has left` },
      });

      io.to(room).emit("room", {
        data: { users: getRoomUsers(room) },
      });

      // Логгирование выхода пользователя из комнаты
      logger.info(`${name} has left room ${room}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnect");
  });
});

server.listen(80, "192.168.0.12", () => {
  console.log("Server is running");
});
