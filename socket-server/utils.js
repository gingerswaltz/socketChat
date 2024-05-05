const winston = require("winston");
const mongoose = require("mongoose");

const trimStr = (str) =>
  typeof str === "string" ? str.trim().toLowerCase() : "";

// Создание модели сообщений
const Message = mongoose.model("Message", {
  user: String,
  room: String,
  message: String,
});

// Настройка логгера
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "server.log" }),
  ],
});
exports.Message = Message;
exports.logger = logger;
exports.trimStr = trimStr;
