const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const winston = require("winston");
const mongoose = require("mongoose");

const app = express();
const route = require("./route");
const { addUser, findUser, getRoomUsers, removeUser } = require("./users");
const { Message } = require("./utils");
app.use(cors({ origin: "*" }));
app.use(route);

// Настройка логгера
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "server.log" }),
  ],
});

// Подключение к базе данных MongoDB
mongoose.connect("mongodb://localhost:27017/chatApp", {});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  socket.on("join", async ({ name, room }) => {
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

    // Отправка истории сообщений всем участникам комнаты
    try {
      const messageHistory = await Message.find({ room: user.room }).exec();
      io.to(user.room).emit("messageHistory", {
        data: { messages: messageHistory },
      });
    } catch (error) {
      console.error("Error fetching message history:", error);
    }

    // Сохранение события подключения нового пользователя в базе данных
    const newMessage = new Message({
      user: "Admin",
      room: user.room,
      message: `${user.name} has joined`,
    });
    await newMessage.save();

    // Логгирование события подключения нового пользователя
    logger.info(`${user.name} has joined room ${user.room}`);
  });

  socket.on("sendMessage", async ({ message, params }) => {
    const user = findUser(params);

    if (user) {
      const { room, name } = user;

      // Создание нового сообщения и добавление его в базу данных
      const newMessage = new Message({
        user: name,
        room: room,
        message: message,
      });
      await newMessage.save();

      // Отправка сообщения всем клиентам в комнате, кроме отправителя
      io.to(room).emit("message", { user: name, message });

      // Логгирование отправки сообщения
      logger.info(`Message sent by ${user.name}: ${message}`);
    }
  });

  socket.on("listRoom", async () => {
    try {
      // Получение списка комнат из базы данных (уникальные значения)
      const rooms = await Message.distinct("room").exec();

      // Отправка списка комнат клиенту
      socket.emit("message", { data: { rooms } });

      // Логгирование отправки списка комнат
      logger.info(`Rooms list: ${JSON.stringify(rooms)}`);
    } catch (error) {
      console.error("Error fetching rooms list:", error);
    }
  });

  socket.on("leftRoom", async ({ params }) => {
    const user = removeUser(params);

    if (user) {
      const { room, name } = user;

      io.to(room).emit("message", {
        data: { user: { name: "Admin" }, message: `${name} has left` },
      });

      io.to(room).emit("room", {
        data: { users: getRoomUsers(room) },
      });

      // Сохранение события выхода пользователя из комнаты в базе данных
      const newMessage = new Message({
        user: "Admin",
        room,
        message: `${name} has left`,
      });
      await newMessage.save();

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
