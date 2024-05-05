// Импортируем необходимые модули
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

// Создаем экземпляр приложения Express
const app = express();

// Импортируем маршруты из файла route.js
const route = require("./route");

// Импортируем необходимые функции для работы с пользователями из файла users.js
const { addUser, findUser, getRoomUsers, removeUser } = require("./users");

// Импортируем объекты Message и logger из файла utils.js
const { Message, logger } = require("./utils");

// Используем middleware для обработки CORS-запросов
app.use(cors({ origin: "*" }));

// Используем маршруты, определенные в файле route.js
app.use(route);

// Подключаемся к базе данных MongoDB
mongoose.connect("mongodb://localhost:27017/chatApp", {});

// Создаем HTTP-сервер на основе приложения Express
const server = http.createServer(app);

// Создаем экземпляр Socket.IO и привязываем его к серверу HTTP
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Обработчик события подключения нового клиента
io.on("connection", async (socket) => {
  // Обработчик события подключения к комнате
  socket.on("join", async ({ name, room }) => {
    // Присоединяем клиента к комнате
    socket.join(room);

    // Добавляем пользователя в список и получаем информацию о нем
    const { user, isExist } = addUser({ name, room });

    // Отправляем сообщение пользователю о подключении
    const userMessage = isExist
      ? `${user.name}, here you go again`
      : `Hey my love ${user.name}`;
    socket.emit("message", {
      data: { user: { name: "Admin" }, message: userMessage },
    });

    // Отправляем сообщение всем остальным пользователям в комнате о подключении нового пользователя
    socket.broadcast.to(user.room).emit("message", {
      data: { user: { name: "Admin" }, message: `${user.name} has joined` },
    });

    // Отправляем информацию о пользователях в комнате всем участникам
    io.to(user.room).emit("room", {
      data: { users: getRoomUsers(user.room) },
    });

    // Отправляем историю сообщений новому пользователю
    try {
      const messageHistory = await Message.find({ room: user.room }).exec();
      io.to(user.room).emit("messageHistory", {
        data: { messages: messageHistory },
      });
    } catch (error) {
      console.error("Error fetching message history:", error);
    }

    // Сохраняем событие подключения нового пользователя в базе данных
    const newMessage = new Message({
      user: "Admin",
      room: user.room,
      message: `${user.name} has joined`,
    });
    await newMessage.save();

    // Логируем событие подключения нового пользователя
    logger.info(`${user.name} has joined room ${user.room}`);
  });

  // Обработчик события отправки сообщения
  socket.on("sendMessage", async ({ message, params }) => {
    const user = findUser(params);

    // Если пользователь найден
    if (user) {
      const { room, name } = user;

      // Создаем новое сообщение и сохраняем его в базе данных
      const newMessage = new Message({
        user: name,
        room: room,
        message: message,
      });
      await newMessage.save();

      // Отправляем сообщение всем клиентам в комнате, кроме отправителя
      io.to(room).emit("message", { user: name, message });

      // Логируем отправку сообщения
      logger.info(`Message sent by ${user.name}: ${message}`);
    }
  });

  // Обработчик события запроса списка комнат
  socket.on("listRoom", async () => {
    try {
      // Получаем список комнат из базы данных (уникальные значения)
      const rooms = await Message.distinct("room").exec();

      // Отправляем список комнат клиенту
      socket.emit("message", { data: { rooms } });

      // Логируем отправку списка комнат
      //logger.info(`Rooms list: ${JSON.stringify(rooms)}`);
    } catch (error) {
      console.error("Error fetching rooms list:", error);
    }
  });

  // Обработчик события выхода пользователя из комнаты
  socket.on("leftRoom", async ({ params }) => {
    const user = removeUser(params);

    // Если пользователь найден
    if (user) {
      const { room, name } = user;

      // Отправляем сообщение всем участникам комнаты о выходе пользователя
      io.to(room).emit("message", {
        data: { user: { name: "Admin" }, message: `${name} has left` },
      });

      // Отправляем информацию о пользователях в комнате всем участникам
      io.to(room).emit("room", {
        data: { users: getRoomUsers(room) },
      });

      // Сохраняем событие выхода пользователя из комнаты в базе данных
      const newMessage = new Message({
        user: "Admin",
        room,
        message: `${name} has left`,
      });
      await newMessage.save();

      // Логируем выход пользователя из комнаты
      logger.info(`${name} has left room ${room}`);
    }
  });

  // Обработчик события отключения клиента
  socket.on("disconnect", () => {
    //console.log("Disconnect");
  });
});

// Запускаем сервер на указанном порту и хосте
server.listen(8080, "213.183.59.239", () => {
  console.log("Server is running");
});
